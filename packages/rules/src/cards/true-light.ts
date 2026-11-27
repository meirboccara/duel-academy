import type { CardSources } from "../coverage";
import { effectDestruction, type Duel, moveCard, moveCards, type Side } from "../duel";
import { ask, type CardDef, type EffectMode } from "../effects";
import { hasPrintedName, mentionsCard } from "../identity";
import { fromOpponent } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "True Light";
const BEWD = "Blue-Eyes White Dragon";

/** "1 "Blue-Eyes White Dragon" from your hand or GY" that can be Special Summoned now. */
const dragonsToSummon = (duel: Duel, player: Side): number[] => [...duel.piles[player].hand, ...duel.piles[player].graveyard].filter((id) => hasPrintedName(duel, id, BEWD) && canSpecialSummon(duel, player, id));

/** The names of the face-up cards a player controls and of the cards in their Graveyard: a face-down card has no name for this check (Konami's Q&A fid 23374). */
const namesInPlay = (duel: Duel, player: Side): Set<string> => {
	const names = new Set<string>();
	const add = (id: number) => {
		const name = duel.defs[duel.cards[id]!.code]?.facts?.name;
		if (name !== undefined) names.add(name);
	};
	for (const zone of ["monster", "spell", "field"] as const) for (const id of duel.piles[player][zone]) if (duel.cards[id]!.face === "up") add(id);
	for (const id of duel.piles[player].graveyard) add(id);
	return names;
};

/** The Spell and Trap Zones of a player with nothing in them (the Field Zone is another zone). */
const freeSpellZones = (duel: Duel, player: Side): number => 5 - duel.piles[player].spell.length;

/**
 * "1 Spell/Trap from your Deck, that mentions "Blue-Eyes White Dragon", with a different name from the cards you control and in your GY",
 * that can be Set: a Field Spell goes to the Field Zone, any other card needs a free Spell & Trap Zone (`reserved`: zones another card, this
 * one when it is being activated from the hand or Set, is about to take).
 */
const settable = (duel: Duel, player: Side, reserved: number, activating?: string): number[] => {
	const names = namesInPlay(duel, player);
	// The card being activated is face-up when its effect resolves, so its own name is already one "you control".
	if (activating !== undefined) names.add(activating);
	return duel.piles[player].deck.filter((id) => {
		const def = duel.defs[duel.cards[id]!.code];
		if (def === undefined || def.kind === "monster" || !mentionsCard(duel, id, BEWD)) return false;
		const name = def.facts?.name;
		if (name !== undefined && names.has(name)) return false;
		return def.facts?.icon === "field" || freeSpellZones(duel, player) - reserved > 0;
	});
};

/**
 * Sets a card from the Deck by an effect: face-down in a Spell & Trap Zone (a Field Spell in the Field Zone, the one there being sent to the
 * Graveyard as the rulebook says), and marked as Set this turn so a Trap or Quick-Play Spell cannot be activated at once.
 */
const setFromDeck = (duel: Duel, player: Side, id: number): Duel => {
	const field = factsOf(duel, id)?.icon === "field";
	let board = duel;
	if (field) {
		const old = duel.piles[player].field[0];
		if (old !== undefined) board = moveCard(board, old, { zone: "graveyard" });
	} else if (freeSpellZones(duel, player) <= 0) return duel;
	const set = moveCard(board, id, { zone: field ? "field" : "spell", face: "down" });
	return { ...set, setThisTurn: [...set.setThisTurn, id] };
};

/** The two modes of "You can activate 1 of these effects", shared by the activation of the card with the effect and by the Ignition Effect. */
const modes = (reservesItsOwnZone: boolean): readonly EffectMode[] => [
	{
		categories: ["special-summon"],
		condition: (duel, { player }) => dragonsToSummon(duel, player).length > 0,
		operation: (duel, link) => ask(duel, link.player, dragonsToSummon(duel, link.player), (board, picked) => askSpecialSummon(board, link.player, picked)),
	},
	{
		categories: ["set-from-deck"],
		condition: (duel, { player, card }) => settable(duel, player, reservesItsOwnZone && card.zone === "hand" ? 1 : 0, NAME).length > 0,
		operation: (duel, link) => ask(duel, link.player, settable(duel, link.player, 0), (board, picked) => setFromDeck(board, link.player, picked)),
	},
];

/**
 * "Your opponent cannot target "Blue-Eyes White Dragon" in your Monster Zone with card effects. If this face-up card is sent from the Spell &
 * Trap Zone to the GY: Destroy all monsters you control. You can only use the following effect of "True Light" once per turn. You can
 * activate 1 of these effects; ● Special Summon 1 "Blue-Eyes White Dragon" from your hand or GY. ● Set 1 Spell/Trap from your Deck, that
 * mentions "Blue-Eyes White Dragon", with a different name from the cards you control and in your GY." A Continuous Trap.
 *
 * - Three ways to activate (Konami's notes, OCG): the card alone (no condition), the card with its effect in the same Chain Link (when that
 *   effect's condition is met), and later the effect of the face-up card. That effect is Spell Speed 2, a Quick Effect in the core: in
 *   either player's turn, in any phase, in response to other effects (RB10's Spell Speed table puts Continuous Traps' effects at Spell
 *   Speed 2), but never in the Damage Step (Konami's notes, OCG; it changes no ATK/DEF, so `damageStepAllows` refuses it). YGOProJudge
 *   gave the same answer (chat of 2026-11-26, citing RB10; graded okay). The two activations are two records; the effect's once
 *   per turn is shared by the second and third (`once.key`), by name, spent at activation. Both modes choose their card when the effect
 *   resolves (no target). Each mode is activated only while it can be done: a "Blue-Eyes White Dragon" that can be Special Summoned in the
 *   hand or GY (zones included); a card in the Deck that can be Set (a free Spell & Trap Zone, the one this card takes counted when it
 *   is activated from the hand). The core's reading of "cannot activate when it cannot be done", as for the other searches.
 * - Cards "you control" for the different name are the face-up ones (a face-down card has no name: Konami's Q&A fid 23374: a Set card of the
 *   same name does not stop another being Set; a face-up one, e.g. activated in response, does). The Set card is marked as Set this turn.
 * - The first effect is the player's `protect` layer against targeting from the opponent's card effects, for a face-up monster of the
 *   controller named "Blue-Eyes White Dragon" while this card is face-up on the field (not negated); an effect that does not target is not stopped.
 * - Third effect: a mandatory "if" trigger of the Graveyard, only for this card face-up in the Spell & Trap Zone sent to the Graveyard:
 *   not when it was Set, not when its activation was negated (`moved.negated`), also in the Damage Step (notes).
 */
export const TRUE_LIGHT: CardDef = {
	code: "true-light",
	kind: "trap",
	facts: { name: NAME, mentions: [BEWD, NAME] },
	effects: [
		{ type: "activation", stays: true, operation: (duel) => duel },
		{ type: "activation", stays: true, once: { scope: "name", key: "true-light-effect" }, modes: modes(true) },
		{
			type: "continuous",
			range: "field",
			modifies: () => [{ kind: "protect", against: "target", from: fromOpponent }],
			affects: (duel, target, source) => target.zone === "monster" && target.face === "up" && target.controller === source.controller && hasPrintedName(duel, target.id, BEWD),
		},
		{
			type: "trigger",
			range: "graveyard",
			timing: "if",
			mandatory: true,
			event: (_duel, event, { card }) => event.type === "moved" && event.before.id === card.id && event.before.zone === "spell" && event.before.face === "up" && event.after.zone === "graveyard" && event.negated !== true,
			operation: (duel, link) => moveCards(duel, duel.piles[link.player].monster, { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) }),
		},
		{ type: "quick", range: "field", once: { scope: "name", key: "true-light-effect" }, modes: modes(false) },
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=16653&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;

export const TRUE_LIGHT_SOURCES: CardSources = {
	code: "true-light",
	cid: 16653,
	french: {
		text: "Votre adversaire ne peut pas cibler \"Dragon Blanc aux Yeux Bleus\" dans votre Zone Monstre avec des effets de carte. Si cette carte face recto est envoyée depuis la Zone Magie & Piège au Cimetière : détruisez tous les monstres que vous contrôlez. Vous ne pouvez utiliser l'effet suivant de \"Véritable Lumière\" qu'une fois par tour. Vous pouvez activer 1 de ces effets ;\n●Invoquez Spécialement 1 \"Dragon Blanc aux Yeux Bleus\" depuis votre main ou Cimetière.\n●Posez 1 Magie/Piège depuis votre Deck, qui mentionne \"Dragon Blanc aux Yeux Bleus\", de nom différent des cartes que vous contrôlez et dans votre Cimetière.",
		url: konamiCardUrl(16653, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "protect", kind: "card-text", cid: 16653, url: konamiCardUrl(16653, "en"), read: "2026-11-24", quote: "Your opponent cannot target \"Blue-Eyes White Dragon\" in your Monster Zone with card effects." },
		{ id: "destroy", kind: "card-text", cid: 16653, url: konamiCardUrl(16653, "en"), read: "2026-11-24", quote: "If this face-up card is sent from the Spell & Trap Zone to the GY: Destroy all monsters you control." },
		{ id: "once", kind: "card-text", cid: 16653, url: konamiCardUrl(16653, "en"), read: "2026-11-24", quote: "You can only use the following effect of \"True Light\" once per turn." },
		{ id: "choose", kind: "card-text", cid: 16653, url: konamiCardUrl(16653, "en"), read: "2026-11-24", quote: "You can activate 1 of these effects;" },
		{ id: "summon", kind: "card-text", cid: 16653, url: konamiCardUrl(16653, "en"), read: "2026-11-24", quote: "●Special Summon 1 \"Blue-Eyes White Dragon\" from your hand or GY." },
		{ id: "set", kind: "card-text", cid: 16653, url: konamiCardUrl(16653, "en"), read: "2026-11-24", quote: "●Set 1 Spell/Trap from your Deck, that mentions \"Blue-Eyes White Dragon\", with a different name from the cards you control and in your GY." },
		// OCG only. Konami's notes (補足情報, 2024-03-23), page read 2026-11-24.
		{ id: "notes-activation-only", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■カードの発動のみを行う場合、発動の条件はありません。" },
		{ id: "notes-activation-with-effect", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■①の効果の発動の条件を満たしている場合、カードの発動と同じチェーンブロックで①の効果を発動できます。" },
		{ id: "notes-effect-in-zone", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■魔法＆罠ゾーンで発動できるチェーンブロックの作られる効果です。" },
		{ id: "notes-effect-no-damage-step", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-26", quote: "【①の効果について】■魔法＆罠ゾーンで発動できるチェーンブロックの作られる効果です。■ダメージステップ中には発動できません。" },
		// TCG rulebook v10, Spell Speed table (page read 2026-11-26): the effect of the face-up card is Spell Speed 2.
		{ id: "rb10-trap-speed-2", kind: "tcg-rule", url: "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf", read: "2026-11-26", quote: "Spell Speed 2 Traps (Normal, Continuous), Quick-Play Spells, Effect Monster's Quick Effects These cards can be used to respond to a Spell Speed 1 or 2 effect, and can typically be activated during any phase." },
		{ id: "notes-mode", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■この効果を発動する際に●を１つ選択し、その●の効果として発動します。" },
		{ id: "notes-summon-no-target", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "処理時に、自分の手札または墓地から「青眼の白龍」１体を選び、そのモンスターを特殊召喚します。（発動時には対象を選択しません。）" },
		{ id: "notes-continuous", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■魔法＆罠ゾーンで適用するチェーンブロックの作られない効果です。" },
		{ id: "notes-destroy-face-up-only", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "セットされているこのカードが墓地へ送られた場合や、このカードの発動が無効になり墓地へ送られた場合には発動しません。" },
		{ id: "notes-destroy-mandatory", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■条件を満たした場合に必ず発動します。" },
		{ id: "notes-destroy-damage-step", kind: "jp-notes", cid: 16653, url: NOTES, read: "2026-11-24", quote: "■ダメージステップ中に条件を満たした場合でも発動します。" },
		// OCG only. Konami's Q&A on the card (8 entries; titles of all read 2026-11-24, the two below opened). The others are about cards the core does not have.
		{ id: "qa-set-name", kind: "jp-qa", cid: 16653, fid: 23374, url: qa(23374), read: "2026-11-24", quote: "「真の光」の『●』の効果の処理時に、自分フィールドの「強靭！無敵！最強！」がセットされている状態なのであれば、『●』の処理によって別の「強靭！無敵！最強！」をセットできます。" },
		{ id: "qa-activation-negated", kind: "jp-qa", cid: 16653, fid: 23215, url: qa(23215), read: "2026-11-24", quote: "この場合、「真の光」は魔法＆罠ゾーンから墓地に送られた扱いになりませんので、『③：魔法＆罠ゾーンの表側表示のこのカードが墓地へ送られた場合に発動する。自分フィールドのモンスターを全て破壊する』効果は発動しません。" },
	],
	effects: ["protect", "destroy", "once", "choose", "summon", "set"],
	rulings: [
		{ source: "notes-activation-only" },
		{ source: "notes-activation-with-effect" },
		{ source: "notes-effect-in-zone" },
		{ source: "notes-effect-no-damage-step" },
		{ source: "rb10-trap-speed-2" },
		{ source: "notes-mode" },
		{ source: "notes-summon-no-target" },
		{ source: "notes-continuous" },
		{ source: "notes-destroy-face-up-only" },
		{ source: "notes-destroy-mandatory" },
		{ source: "notes-destroy-damage-step" },
		{ source: "qa-set-name" },
		{ source: "qa-activation-negated" },
	],
};
