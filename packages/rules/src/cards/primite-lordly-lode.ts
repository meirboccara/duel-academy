import type { CardSources } from "../coverage";
import { type CardInstance, type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { addModifier } from "../modifiers";
import { canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { askSpecialSummonIn, factsOf } from "./helpers";

const NAME = "Primite Lordly Lode";
const PRIMITE = "Primite";

const isNormalMonster = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.normal === true;

/** "1 "Primite" card from your Deck", "except "Primite Lordly Lode"". */
const toAdd = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => belongsTo(duel, id, PRIMITE) && !hasPrintedName(duel, id, NAME));

/** The Normal Monsters of the hand, the Deck and the GY that can be Special Summoned now: their names are what can be declared. */
const toSummon = (duel: Duel, player: Side): number[] => [...duel.piles[player].hand, ...duel.piles[player].deck, ...duel.piles[player].graveyard].filter((id) => isNormalMonster(duel, id) && canSpecialSummon(duel, player, id));

/** The Normal Monsters of the player's GY with different names (the count of the ATK gain). */
const namesInGraveyard = (duel: Duel, player: Side): number => new Set(duel.piles[player].graveyard.filter((id) => isNormalMonster(duel, id)).map((id) => factsOf(duel, id)?.name)).size;

/** Is the card still the face-up card in the Spell & Trap Zone that was activated (its effect needs it on the field when it resolves)? */
const stillOnField = (duel: Duel, card: CardInstance): boolean => {
	const now = duel.cards[card.id]!;
	return now.moves === card.moves && now.zone === "spell" && now.face === "up";
};

/**
 * "When this card is activated: Add 1 "Primite" card from your Deck to your hand, except "Primite Lordly Lode". You can declare 1 Normal
 * Monster Card name; Special Summon 1 declared Normal Monster from your hand, Deck, or GY in Defense Position, also you cannot activate the
 * effects of Special Summoned monsters on the field this turn. You can only use each effect of "Primite Lordly Lode" once per turn. Normal
 * Monsters and "Primite" monsters you control gain 300 ATK for each Normal Monster with different names in your GY." A Continuous Spell.
 *
 * - Activation effect: it is applied when the card resolves, and the card cannot be activated when it cannot be applied (Konami's notes, OCG):
 *   with no "Primite" card other than itself in the Deck (rule record `search-needs-a-card`), or while cards cannot be added from the Deck to the
 *   hand (`requiresAddToHand`). The card is chosen when it resolves. Once per turn, by name.
 * - Ignition Effect of the face-up card, in the Main Phase (the core's reading of "ignition"), once per turn by name, apart from the first. The
 *   name is declared at activation, from the Normal Monsters of the hand, the Deck and the GY (notes); only a name of a monster that can be
 *   Special Summoned now is offered (the core's reading of "cannot activate when it cannot be done", as for the other Summons). A monster
 *   that is treated as a Normal Monster has no printed Normal facts here and is not offered (the notes forbid its name). The player chooses
 *   which copy and the zone; it is placed in Defense Position.
 * - "Also you cannot activate the effects of Special Summoned monsters on the field this turn": a restriction applied when the effect
 *   resolves (notes: not at activation, so a turn when such an effect was already activated is fine), whether or not the Summon succeeds, but
 *   not at all when this card is not on the field when it resolves. It stops the effects activated by a monster on the field that was
 *   Special Summoned, for the player, until the end of the turn.
 * - Continuous effect: the Normal Monsters and the "Primite" monsters in the controller's Monster Zone gain 300 ATK per name (notes: the
 *   monsters of the Monster Zone only). "Primite" is read from `facts.archetypes`: Konami's page has no archetype field, and the text's own
 *   "except "Primite Lordly Lode"" names the card as a "Primite" card.
 */
export const PRIMITE_LORDLY_LODE: CardDef = {
	code: "primite-lordly-lode",
	kind: "spell",
	facts: { name: NAME, archetypes: [PRIMITE], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			stays: true,
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "name", key: "primite-lordly-lode-activation" },
			// "search-needs-a-card" (RB10): "Primite" is applied when the card resolves, so it cannot be activated with nothing to add.
			condition: (duel, { player }) => toAdd(duel, player).length > 0,
			operation: (duel, link) => ask(duel, link.player, toAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand" })),
		},
		{
			type: "ignition",
			range: "field",
			categories: ["special-summon", "summon-from-deck"],
			once: { scope: "name", key: "primite-lordly-lode-summon" },
			declare: (duel, { player }) => [...new Set(toSummon(duel, player).map((id) => factsOf(duel, id)?.name))].flatMap((name) => (name === undefined ? [] : [{ kind: "name" as const, value: name }])),
			operation: (duel, link) => {
				// Applied when it resolves: with the card gone, nothing is done (notes), the restriction included.
				if (!stillOnField(duel, link.card)) return duel;
				const locked = addModifier(duel, {
					affects: () => false,
					until: duel.turn.number,
					layer: { kind: "lock", what: "activate", who: link.player, stops: (board, { card }) => card.zone === "monster" && card.specialSummoned && board.defs[card.code]?.kind === "monster" },
				});
				const declared = link.declared?.kind === "name" ? link.declared.value : undefined;
				const candidates = toSummon(locked, link.player).filter((id) => factsOf(locked, id)?.name === declared);
				return ask(locked, link.player, candidates, (board, picked) => askSpecialSummonIn(board, link.player, picked, "defense"));
			},
		},
		{
			type: "continuous",
			affects: (duel, target, source) => target.zone === "monster" && target.face === "up" && target.controller === source.controller && (isNormalMonster(duel, target.id) || (duel.defs[target.code]?.kind === "monster" && belongsTo(duel, target.id, PRIMITE))),
			modifies: () => [{ kind: "add", stat: "atk", by: (duel, source) => (source === null ? 0 : 300 * namesInGraveyard(duel, source.controller)) }],
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20534&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(20534, "en");

export const PRIMITE_LORDLY_LODE_SOURCES: CardSources = {
	code: "primite-lordly-lode",
	cid: 20534,
	french: {
		text: "Lorsque cette carte est activée : ajoutez 1 carte \"Primite\" (\"Filon Noble Primite\" exclu) depuis votre Deck à votre main. Vous pouvez déclarer 1 nom de Carte Monstre Normal ; Invoquez Spécialement 1 Monstre Normal déclaré depuis votre main, Deck ou Cimetière en Position de Défense, et aussi, vous ne pouvez pas activer les effets des monstres Invoqués Spécialement sur le Terrain ce tour. Vous ne pouvez utiliser chaque effet de \"Filon Noble Primite\" qu'une fois par tour. Les Monstres Normaux et monstres \"Primite\" que vous contrôlez gagnent 300 ATK pour chaque Monstre Normal de noms différents dans votre Cimetière.",
		url: konamiCardUrl(20534, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20534, url: EN, read: "2026-11-24", quote: "Continuous Spell" },
		{ id: "search", kind: "card-text", cid: 20534, url: EN, read: "2026-11-24", quote: "When this card is activated: Add 1 \"Primite\" card from your Deck to your hand, except \"Primite Lordly Lode\"." },
		{ id: "summon", kind: "card-text", cid: 20534, url: EN, read: "2026-11-24", quote: "You can declare 1 Normal Monster Card name; Special Summon 1 declared Normal Monster from your hand, Deck, or GY in Defense Position," },
		{ id: "lock", kind: "card-text", cid: 20534, url: EN, read: "2026-11-24", quote: "also you cannot activate the effects of Special Summoned monsters on the field this turn." },
		{ id: "once", kind: "card-text", cid: 20534, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Primite Lordly Lode\" once per turn." },
		{ id: "atk", kind: "card-text", cid: 20534, url: EN, read: "2026-11-24", quote: "Normal Monsters and \"Primite\" monsters you control gain 300 ATK for each Normal Monster with different names in your GY." },
		// OCG only. Konami's notes (補足情報, 2024-07-27), page read 2026-11-24.
		{ id: "notes-search-applies", kind: "jp-notes", cid: 20534, url: NOTES, read: "2026-11-24", quote: "■このカードを発動した場合、そのチェーンブロックの処理時に必ず適用する効果です。（処理を適用できない状況ではこのカードを発動できません。）" },
		{ id: "notes-continuous-atk", kind: "jp-notes", cid: 20534, url: NOTES, read: "2026-11-24", quote: "■自分のモンスターゾーンに存在する通常モンスターと「原石」モンスターに適用する効果です。" },
		{ id: "notes-declare", kind: "jp-notes", cid: 20534, url: NOTES, read: "2026-11-24", quote: "■自分の手札・デッキ・墓地のいずれかに存在する通常モンスターのカード名を宣言して発動できる効果です。" },
		{ id: "notes-lock-already", kind: "jp-notes", cid: 20534, url: NOTES, read: "2026-11-24", quote: "（既に特殊召喚されたモンスターの効果を発動したターンでもこの効果を発動できます。）" },
		{ id: "notes-lock-needs-card", kind: "jp-notes", cid: 20534, url: NOTES, read: "2026-11-24", quote: "（ただし、処理時にこのカードがフィールドに存在しない場合、処理は何も行われませんので『自分は特殊召喚されたフィールドのモンスターの効果を発動できない』状態にはなりません。）" },
		// OCG only. Konami's Q&A on the card (5 entries, titles read 2026-11-24, the three below opened).
		{ id: "qa-lock-activate", kind: "jp-qa", cid: 20534, fid: 10803, url: qa(10803), read: "2026-11-24", quote: "そのカードの発動時の効果処理として『手札に加える』処理を行う必要がありますが、この処理を行えないためです。" },
		{ id: "qa-declare-names", kind: "jp-qa", cid: 20534, fid: 24080, url: qa(24080), read: "2026-11-24", quote: "いずれも宣言できません。" },
		{ id: "qa-token-names", kind: "jp-qa", cid: 20534, fid: 12551, url: qa(12551), read: "2026-11-24", quote: "モンスタートークンを『カード名』として宣言できません。" },
	],
	effects: ["facts", "search", "summon", "lock", "once", "atk"],
	rulings: [{ source: "notes-search-applies" }, { source: "notes-continuous-atk" }, { source: "notes-declare" }, { source: "notes-lock-already" }, { source: "notes-lock-needs-card" }, { source: "qa-lock-activate" }, { source: "qa-declare-names" }, { source: "qa-token-names", pending: "the core has no Tokens (Konami: a Monster Token name cannot be declared), so there is none to declare" }],
};
