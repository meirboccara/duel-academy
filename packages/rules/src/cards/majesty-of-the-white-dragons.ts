import { askUpTo } from "../choices";
import type { CardSources } from "../coverage";
import { revealCards } from "../deck";
import { effectDestruction, type Duel, moveCard, moveCards, other, type Side } from "../duel";
import type { CardDef } from "../effects";
import { breakEffect } from "../events";
import { hasPrintedName } from "../identity";
import { canBeBanished } from "../modifiers";
import { canRitualSummon, type RitualOptions, ritualSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Majesty of the White Dragons";
const BEWD = "Blue-Eyes White Dragon";

/** The "Blue-Eyes White Dragon" that can be shown: in the hand, the face-up Monster Zone and the GY (Konami's notes: not a Spell & Trap Zone). */
const showable = (duel: Duel, player: Side): number[] => {
	const piles = duel.piles[player];
	return [...piles.hand, ...piles.monster.filter((id) => duel.cards[id]!.face === "up"), ...piles.graveyard].filter((id) => hasPrintedName(duel, id, BEWD));
};

/** The cards the player's opponent controls: monsters, Spells and Traps, and the Field Spell, face-up or face-down. */
const theirCards = (duel: Duel, player: Side): number[] => {
	const piles = duel.piles[other(player)];
	return [...piles.monster, ...piles.spell, ...piles.field];
};

/** "Ritual Summon 1 Ritual Monster from your hand, by Tributing "Blue-Eyes White Dragon(s)" from your hand or field whose total Levels equal its Level." */
const RITUAL: RitualOptions = {
	monsters: (duel, player) => duel.piles[player].hand.filter((id) => factsOf(duel, id)?.frame === "ritual"),
	pool: (duel, player) => [...duel.piles[player].hand, ...duel.piles[player].monster].filter((id) => hasPrintedName(duel, id, BEWD)),
	mode: "equal",
};

/**
 * "Show up to 3 of the "Blue-Eyes White Dragon" in your hand, face-up Monster Zone, and/or GY, then destroy an equal number of cards your
 * opponent controls. You can banish this card from your GY; Ritual Summon 1 Ritual Monster from your hand, by Tributing "Blue-Eyes White
 * Dragon(s)" from your hand or field whose total Levels equal its Level. You can only use each effect of "Majesty of the White Dragons" once
 * per turn." A Normal Trap.
 *
 * - First effect: no target. When it resolves the player chooses up to 3 dragons one at a time (none is allowed) and shows them to both
 *   players; "then" is a break in the effect: the showing and the destruction are not simultaneous (Konami's notes). They then choose that
 *   many of the opponent's cards (monsters, Spells/Traps, Field Spell) to destroy, as many as there are when the opponent has fewer. Nothing is
 *   destroyed if nothing was shown. The count is not capped by the opponent's cards at the showing: no page read says it must be (the core's
 *   reading). Not in the Damage Step (notes; it is a Trap).
 * - Second effect: an effect of the Graveyard that makes a Chain Link (notes), banishing this card as the cost; activated only while a Ritual
 *   Monster of the hand can be Summoned with such Tributes (the core's reading, as for the other Summons). Written as a Quick Effect
 *   (Spell Speed 2): YGOProJudge's answer only (asked 2026-11-24, it cited no official source); Konami's notes only say it makes a Chain
 *   Link. Not in the Damage Step: the notes say so and a Quick Effect that changes neither ATK nor DEF cannot be activated there.
 * - Each effect once per turn, by name, one use each (they do not share one).
 */
export const MAJESTY_OF_THE_WHITE_DRAGONS: CardDef = {
	code: "majesty-of-the-white-dragons",
	kind: "trap",
	facts: { name: NAME, mentions: [BEWD, NAME] },
	effects: [
		{
			type: "activation",
			categories: ["destroy"],
			once: { scope: "name", key: "majesty-of-the-white-dragons-show" },
			operation: (duel, link) =>
				askUpTo(duel, link.player, showable(duel, link.player), { min: 0, max: 3 }, (board, shown) => {
					if (shown.length === 0) return board;
					// "Then": the destruction is a part of the effect of its own, after the cards are shown.
					const revealed = breakEffect(revealCards(board, link.player, shown));
					return askUpTo(revealed, link.player, theirCards(revealed, link.player), { min: shown.length, max: shown.length }, (next, chosen) => moveCards(next, chosen, { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) }));
				}),
		},
		{
			type: "quick",
			range: "graveyard",
			categories: ["special-summon"],
			once: { scope: "name", key: "majesty-of-the-white-dragons-ritual" },
			condition: (duel, { player }) => canRitualSummon(duel, player, RITUAL),
			cost: (duel, { player, card }) => (canBeBanished(duel, card.id, player) ? moveCard(duel, card.id, { zone: "banished", player }) : null),
			operation: (duel, link) => ritualSummon(duel, link.player, RITUAL),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20606&request_locale=ja";
const EN = konamiCardUrl(20606, "en");

export const MAJESTY_OF_THE_WHITE_DRAGONS_SOURCES: CardSources = {
	code: "majesty-of-the-white-dragons",
	cid: 20606,
	french: {
		text: "Montrez max. 3 \"Dragon Blanc aux Yeux Bleus\" dans votre main, Zone Monstre face recto et/ou Cimetière, puis détruisez un nombre égal de cartes contrôlées par votre adversaire. Vous pouvez bannir cette carte depuis votre Cimetière ; Invoquez Rituellement 1 Monstre Rituel depuis votre main, en Sacrifiant des \"Dragon Blanc aux Yeux Bleus\" depuis votre main ou Terrain dont le Niveau total est égal à son Niveau. Vous ne pouvez utiliser chaque effet de \"Majesté des Dragons Blancs\" qu'une fois par tour.",
		url: konamiCardUrl(20606, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20606, url: EN, read: "2026-11-24", quote: "Normal Trap" },
		{ id: "show", kind: "card-text", cid: 20606, url: EN, read: "2026-11-24", quote: "Show up to 3 of the \"Blue-Eyes White Dragon\" in your hand, face-up Monster Zone, and/or GY, then destroy an equal number of cards your opponent controls." },
		{ id: "ritual", kind: "card-text", cid: 20606, url: EN, read: "2026-11-24", quote: "You can banish this card from your GY; Ritual Summon 1 Ritual Monster from your hand, by Tributing \"Blue-Eyes White Dragon(s)\" from your hand or field whose total Levels equal its Level." },
		{ id: "once", kind: "card-text", cid: 20606, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Majesty of the White Dragons\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-09-07), page read 2026-11-24.
		{ id: "notes-damage-step", kind: "jp-notes", cid: 20606, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-show-places", kind: "jp-notes", cid: 20606, url: NOTES, read: "2026-11-24", quote: "（魔法＆罠ゾーンに存在する「青眼の白龍」を選ぶことはできません。）" },
		{ id: "notes-ritual-chain", kind: "jp-notes", cid: 20606, url: NOTES, read: "2026-11-24", quote: "■墓地で発動できるチェーンブロックの作られる効果です。" },
	],
	effects: ["facts", "show", "ritual", "once"],
	rulings: [{ source: "notes-damage-step" }, { source: "notes-show-places" }, { source: "notes-ritual-chain" }],
};
