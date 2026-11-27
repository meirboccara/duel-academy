import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef, type EffectRecord, type Range, targetsOf } from "../effects";
import type { GameEvent } from "../events";
import { belongsTo, hasPrintedName } from "../identity";
import { addModifier, banishWhenItLeaves, FOREVER, originalAtk } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { discardThis, factsOf } from "./helpers";

const NAME = "Deep-Eyes White Dragon, the Blue Abyss";
const BEWD = "Blue-Eyes White Dragon";
const BLUE_EYES = "Blue-Eyes";

/** "1 Level 1 LIGHT Tuner" in the player's Deck. */
const tunersToAdd = (duel: Duel, player: Side): number[] =>
	duel.piles[player].deck.filter((id) => {
		const facts = factsOf(duel, id);
		return duel.defs[duel.cards[id]!.code]?.kind === "monster" && facts?.level === 1 && facts.attribute === "LIGHT" && facts.tuner === true;
	});

/** A "Blue-Eyes" Ritual Monster or "Blue-Eyes White Dragon". */
const triggersIt = (duel: Duel, id: number): boolean => hasPrintedName(duel, id, BEWD) || (belongsTo(duel, id, BLUE_EYES) && factsOf(duel, id)?.frame === "ritual");

/** Is the duel in the Damage Step (an attack has gone past its declaration)? */
const inDamageStep = (duel: Duel): boolean => duel.battle !== null && duel.battle.step !== "declared";

/** The monsters of the events that triggered the effect, still in the GY: "them" of "target 1 of them in the GY". */
const sentCards = (duel: Duel, player: Side, events: readonly GameEvent[] | undefined): number[] =>
	(events ?? []).flatMap((event) => (event.type === "moved" && event.after.owner === player && duel.cards[event.after.id]!.zone === "graveyard" && triggersIt(duel, event.after.id) ? [event.after.id] : []));

/** One place of the second effect: both share its once per turn. */
const reviveFrom = (range: Extract<Range, "hand" | "graveyard">): EffectRecord => ({
	type: "trigger",
	range,
	timing: "if",
	categories: ["special-summon"],
	once: { scope: "name", key: "deep-eyes-white-dragon-revive" },
	event: (duel, event, { player }) => event.type === "moved" && event.before.zone !== "graveyard" && event.after.zone === "graveyard" && event.after.owner === player && triggersIt(duel, event.after.id) && !inDamageStep(duel),
	// An effect that Summons is activated only while it can be done: this card Special Summonable.
	condition: (duel, { player, card }) => canSpecialSummon(duel, player, card.id),
	target: (duel, ctx) => sentCards(duel, ctx.player, ctx.triggered),
	operation: (duel, link) => {
		const target = targetsOf(duel, link)[0];
		const now = duel.cards[link.card.id]!;
		// This very card, still where it was activated from (from the GY, it was there before the monster was sent: the core's trigger rule).
		// The Summon does not use the target: with the target gone it still happens, only without the ATK change ("and if you do" needs the Summon, not the reverse).
		if (now.moves !== link.card.moves || now.zone !== range) return duel;
		const copied = target ? originalAtk(duel, target.id) : undefined;
		return askSpecialSummon(duel, link.player, now.id, {
			then: (board) => {
				const summoned = board.cards[now.id]!;
				// "Its ATK becomes that target's": its own effect on itself, which stops while its effects are negated (Konami's notes, OCG).
				const set = copied === undefined ? board : addModifier(board, { affects: { card: summoned.id, moves: summoned.moves }, until: FOREVER, layer: { kind: "set", stat: "atk", to: copied }, by: link, own: true });
				return banishWhenItLeaves(set, summoned.id, link);
			},
		});
	},
});

/**
 * "(This card is always treated as a "Blue-Eyes" card.) You can discard this card; add 1 Level 1 LIGHT Tuner from your Deck to your hand. If a
 * "Blue-Eyes" Ritual Monster or "Blue-Eyes White Dragon" is sent to your GY (except during the Damage Step): You can target 1 of them in the GY;
 * Special Summon this card from your GY (if it was there when the monster was sent) or hand (even if not), and if you do, its ATK becomes that
 * target's, also banish it when it leaves the field. You can only use each effect of "Deep-Eyes White Dragon, the Blue Abyss" once per turn." A
 * LIGHT Dragon Effect Monster of Level 10.
 *
 * - "Always treated as a "Blue-Eyes" card" is not an effect (Konami's notes, OCG): it is in `facts.archetypes`, which negation does not touch.
 * - First effect: an Ignition Effect of the hand; discarding itself is the cost. Not activated with no Level 1 LIGHT Tuner in the Deck (rule
 *   record `search-needs-a-card`) or while cards cannot be added from the Deck to the hand (`requiresAddToHand`). Once per turn by name.
 * - Second effect: an optional "if" Trigger Effect of the hand and of the Graveyard (notes), two records sharing one use per turn by name. Never in
 *   the Damage Step (notes: the event is read in the Damage Step). From the GY it needs this card to have been there before the monster was sent
 *   (a card sent at the same time does not trigger it: the core's trigger rule, notes), from the hand it does not. It targets one of the monsters
 *   sent (the events of the trigger); the Dragon must be Special Summonable when it is activated (the core's reading of "cannot activate when it
 *   cannot be done"). Only the player's own GY ("your GY"): the owner of the monster sent.
 * - The target gone from the GY when it resolves: Deep-Eyes is still Special Summoned (and still banished when it leaves the field), with its ATK
 *   unchanged: the Summon does not use the target, and "and if you do" ties the ATK to the Summon, not the other way round. YGOProJudge's answer only
 *   (asked 2026-11-24, unchanged after two follow-ups that contested it with the targeting rule: no official source, only an internal PSCT note;
 *   Konami's notes and its 5 Q&A on this card say nothing about it). It conflicts with the general idea that an
 *   effect whose targets are all illegal does not resolve: no Konami page read here settles that general rule for this shape.
 * - "Its ATK becomes that target's": the target's original ATK as it is in the GY, fixed when it resolves, the card's own effect (`Modifier.own`,
 *   Konami's notes: it stops applying while its effects are negated or once it is not face-up in the Monster Zone). "Banish it when it leaves the
 *   field": `banishWhenItLeaves` (notes: the state ends when it is no longer face-up in the Monster Zone, so turned face-down and then destroyed it
 *   goes to the GY). Banished instead when returned to the hand or Deck: YGOProJudge's answer only (asked 2026-11-24, no source cited).
 */
export const DEEP_EYES_WHITE_DRAGON: CardDef = {
	code: "deep-eyes-white-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", level: 10, atk: 0, def: 0, archetypes: [BLUE_EYES], mentions: [BEWD, NAME] },
	effects: [
		{
			type: "ignition",
			range: "hand",
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "name", key: "deep-eyes-white-dragon-search" },
			// "search-needs-a-card" (RB10): not activated with no Level 1 LIGHT Tuner to add in the Deck.
			condition: (duel, { player }) => tunersToAdd(duel, player).length > 0,
			cost: discardThis,
			operation: (duel, link) => ask(duel, link.player, tunersToAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand" })),
		},
		reviveFrom("hand"),
		reviveFrom("graveyard"),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=22717&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(22717, "en");

export const DEEP_EYES_WHITE_DRAGON_SOURCES: CardSources = {
	code: "deep-eyes-white-dragon",
	cid: 22717,
	// The page gives the first line apart from the rest with a literal line break marker; it is shown here as a line break.
	french: {
		text: "(Cette carte est toujours traitée comme carte \"Yeux Bleus\".)\nVous pouvez défausser cette carte ; ajoutez 1 Syntoniseur LUMIÈRE de Niveau 1 depuis votre Deck à votre main. Si \"Dragon Blanc aux Yeux Bleus\" ou un Monstre Rituel \"Yeux Bleus\" est envoyé à votre Cimetière (sauf durant la Damage Step) : vous pouvez en cibler 1 dans le Cimetière ; Invoquez Spécialement cette carte depuis votre Cimetière (si elle y était lorsque le monstre a été envoyé) ou la main (même si elle n'y était pas), et si vous le faites, son ATK devient celle de la cible, et aussi, bannissez-la lorsqu'elle quitte le Terrain. Vous ne pouvez utiliser chaque effet de \"Dragon Blanc aux Yeux Profonds, les Abysses Bleus\" qu'une fois par tour.",
		url: konamiCardUrl(22717, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 22717, url: EN, read: "2026-11-24", quote: "LIGHT Level 10 ATK 0 DEF 0 Dragon／Effect" },
		{ id: "treated", kind: "card-text", cid: 22717, url: EN, read: "2026-11-24", quote: "(This card is always treated as a \"Blue-Eyes\" card.)" },
		{ id: "search", kind: "card-text", cid: 22717, url: EN, read: "2026-11-24", quote: "You can discard this card; add 1 Level 1 LIGHT Tuner from your Deck to your hand." },
		{ id: "revive", kind: "card-text", cid: 22717, url: EN, read: "2026-11-24", quote: "If a \"Blue-Eyes\" Ritual Monster or \"Blue-Eyes White Dragon\" is sent to your GY (except during the Damage Step): You can target 1 of them in the GY; Special Summon this card from your GY (if it was there when the monster was sent) or hand (even if not), and if you do, its ATK becomes that target's, also banish it when it leaves the field." },
		{ id: "once", kind: "card-text", cid: 22717, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Deep-Eyes White Dragon, the Blue Abyss\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2026-03-19), page read 2026-11-24. Its 5 Q&A entries: titles read, the one about Blue-Eyes Alternative White Dragon opened (below); the others are about other cards.
		{ id: "notes-treated", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■効果として扱いません。（このカードの効果が無効化された場合でも、「ブルーアイズ」カードとして扱います。）" },
		{ id: "notes-search-ignition", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■手札で発動できる起動効果です。" },
		{ id: "notes-trigger-places", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■手札または墓地で発動できる誘発効果です。" },
		{ id: "notes-gy-first", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■この効果を墓地で発動する場合、このカードが墓地に存在する状態で、該当のモンスターが自分の墓地へ送られる必要があります。（該当のモンスターとこのカードが同時に墓地へ送られた場合には発動できません。）" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-atk-negated", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■この効果で特殊召喚したこのカードがモンスターゾーンに表側表示で存在しなくなった場合、このカードの効果が無効化された場合に、『攻撃力が対象のモンスターと同じになり』の効果の適用はなくなります。" },
		{ id: "notes-leave-ends", kind: "jp-notes", cid: 22717, url: NOTES, read: "2026-11-24", quote: "■この効果で特殊召喚したこのカードがモンスターゾーンに表側表示で存在しなくなった場合、『フィールドから離れた場合に除外される』状態ではなくなります。" },
		// OCG only. Konami's Q&A fid 24303 (Blue-Eyes Alternative White Dragon sent to the GY), page read 2026-11-24.
		{ id: "qa-alternative-white-dragon", kind: "jp-qa", cid: 22717, fid: 24303, url: qa(24303), read: "2026-11-24", quote: "墓地でのカード名が、「ブルーアイズ」が含まれる儀式モンスター、または「青眼の白龍」であるモンスターが墓地へ送られた場合に、" },
	],
	effects: ["facts", "treated", "search", "revive", "once"],
	rulings: [{ source: "notes-treated" }, { source: "notes-search-ignition" }, { source: "notes-trigger-places" }, { source: "notes-gy-first" }, { source: "notes-damage-step" }, { source: "notes-atk-negated" }, { source: "notes-leave-ends" }, { source: "qa-alternative-white-dragon", pending: "needs Blue-Eyes Alternative White Dragon (its name is treated as \"Blue-Eyes White Dragon\" in the GY): effective names are not modelled" }],
};
