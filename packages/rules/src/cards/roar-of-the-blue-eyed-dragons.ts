import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { addModifier, canBeBanished } from "../modifiers";
import { canFusionSummon, canSpecialSummon, type FusionOptions, fusionSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { askSpecialSummonIn, factsOf } from "./helpers";

const NAME = "Roar of the Blue-Eyed Dragons";
const BEWD = "Blue-Eyes White Dragon";
const BLUE_EYES = "Blue-Eyes";

/** Does the player control a face-up "Blue-Eyes White Dragon" in the Monster Zone or a Spell & Trap Zone (Konami's notes: that is how the effect reads it)? */
const controlsDragon = (duel: Duel, player: Side): boolean => [...duel.piles[player].monster, ...duel.piles[player].spell].some((id) => duel.cards[id]!.face === "up" && hasPrintedName(duel, id, BEWD));

/**
 * The "Blue-Eyes" monsters of the Deck, the GY and banishment (face-up: a face-down banished card cannot be chosen) that can be Special
 * Summoned now; with no "Blue-Eyes White Dragon" controlled, only "Blue-Eyes White Dragon".
 */
const toSummon = (duel: Duel, player: Side): number[] => {
	const only = !controlsDragon(duel, player);
	const piles = duel.piles[player];
	return [...piles.deck, ...piles.graveyard, ...piles.banished.filter((id) => duel.cards[id]!.face === "up")].filter(
		(id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, BLUE_EYES) && (!only || hasPrintedName(duel, id, BEWD)) && canSpecialSummon(duel, player, id),
	);
};

/** "Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field, including a "Blue-Eyes" monster". */
const FUSION: FusionOptions = {
	pool: (duel, player) => [...duel.piles[player].hand, ...duel.piles[player].monster],
	check: (duel, cards) => cards.some((card) => belongsTo(duel, card.id, BLUE_EYES)),
};

/**
 * "Special Summon in Defense Position, 1 "Blue-Eyes" monster from your Deck, GY, or banishment (but if you control no "Blue-Eyes White
 * Dragon", you can only Special Summon "Blue-Eyes White Dragon" with this effect), also you cannot Special Summon from the Extra Deck for the
 * rest of this turn, except Dragon monsters. You can banish this card from your GY; Fusion Summon 1 Fusion Monster from your Extra Deck, using
 * monsters from your hand or field, including a "Blue-Eyes" monster. You can only use 1 "Roar of the Blue-Eyed Dragons" effect per turn, and
 * only once that turn." A Normal Spell.
 *
 * - Activation effect: the monster is chosen when it resolves; with no face-up "Blue-Eyes White Dragon" in the Monster Zone or a Spell &
 *   Trap Zone at that moment only that card can be chosen (Konami's notes, OCG). It is activated only while a monster can be Summoned (the
 *   core's reading, as for the other Summons), counted with the board as it stands. A card banished face-down is not a choice.
 * - The restriction on Extra Deck Summons is applied when the effect resolves, whether or not a monster was Summoned, unless the activation or
 *   the effect was negated (notes); it stops the player's Special Summons of a monster that is in the Extra Deck and is not a Dragon, until the
 *   end of the turn. A turn when such a Summon was already made is no obstacle to the activation (notes).
 * - Graveyard effect: banishing itself is the cost; the materials are monsters of the hand or the field that must include a "Blue-Eyes"
 *   monster (`FusionOptions.check`), and go to the GY as Fusion Materials. Notes: an effect that makes a Chain Link, in the GY; the core
 *   writes it as an Ignition Effect (the card is a Normal Spell: Spell Speed 1; Konami's notes say neither).
 * - "Only 1 effect per turn, and only once that turn": the two effects share one use by name (`once.key`).
 * - "Blue-Eyes" is read from `facts.archetypes`: the name's own archetype, which no Konami page lists.
 */
export const ROAR_OF_THE_BLUE_EYED_DRAGONS: CardDef = {
	code: "roar-of-the-blue-eyed-dragons",
	kind: "spell",
	facts: { name: NAME, mentions: [BEWD, NAME] },
	effects: [
		{
			type: "activation",
			categories: ["special-summon", "summon-from-deck"],
			once: { scope: "name", key: "roar-of-the-blue-eyed-dragons" },
			condition: (duel, { player }) => toSummon(duel, player).length > 0,
			operation: (duel, link) => {
				// Applied with the effect, whether or not a monster ends up Summoned.
				const locked = addModifier(duel, {
					affects: () => false,
					until: duel.turn.number,
					layer: { kind: "lock", what: "summon", who: link.player, ways: ["special"], only: (board, card) => card.zone === "extra" && factsOf(board, card.id)?.monsterType !== "Dragon" },
				});
				return ask(locked, link.player, toSummon(locked, link.player), (board, picked) => askSpecialSummonIn(board, link.player, picked, "defense"));
			},
		},
		{
			type: "ignition",
			range: "graveyard",
			categories: ["special-summon"],
			once: { scope: "name", key: "roar-of-the-blue-eyed-dragons" },
			condition: (duel, { player }) => canFusionSummon(duel, player, FUSION),
			cost: (duel, { player, card }) => (canBeBanished(duel, card.id, player) ? moveCard(duel, card.id, { zone: "banished", player }) : null),
			operation: (duel, link) => fusionSummon(duel, link.player, FUSION),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20605&request_locale=ja";
const EN = konamiCardUrl(20605, "en");

export const ROAR_OF_THE_BLUE_EYED_DRAGONS_SOURCES: CardSources = {
	code: "roar-of-the-blue-eyed-dragons",
	cid: 20605,
	french: {
		text: "Invoquez Spécialement 1 monstre \"Yeux Bleus\" depuis votre Deck, Cimetière ou bannissement en Position de Défense (mais si vous ne contrôlez aucun \"Dragon Blanc aux Yeux Bleus\", vous ne pouvez Invoquer Spécialement que \"Dragon Blanc aux Yeux Bleus\" avec cet effet), et aussi, vous ne pouvez pas Invoquer Spécialement (monstres Dragon exclus) depuis l'Extra Deck le reste de ce tour. Vous pouvez bannir cette carte depuis votre Cimetière ; Invoquez par Fusion 1 Monstre Fusion depuis votre Extra Deck, en utilisant des monstres (un monstre \"Yeux Bleus\" inclus) depuis votre main ou Terrain. Vous ne pouvez utiliser qu'1 effet de \"Hurlement des Dragons aux Yeux de Bleu\" par tour, et uniquement une fois le tour.",
		url: konamiCardUrl(20605, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20605, url: EN, read: "2026-11-24", quote: "Normal Spell" },
		{ id: "summon", kind: "card-text", cid: 20605, url: EN, read: "2026-11-24", quote: "Special Summon in Defense Position, 1 \"Blue-Eyes\" monster from your Deck, GY, or banishment" },
		{ id: "lock", kind: "card-text", cid: 20605, url: EN, read: "2026-11-24", quote: "also you cannot Special Summon from the Extra Deck for the rest of this turn, except Dragon monsters." },
		{ id: "fusion", kind: "card-text", cid: 20605, url: EN, read: "2026-11-24", quote: "You can banish this card from your GY; Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field, including a \"Blue-Eyes\" monster." },
		{ id: "once", kind: "card-text", cid: 20605, url: EN, read: "2026-11-24", quote: "You can only use 1 \"Roar of the Blue-Eyed Dragons\" effect per turn, and only once that turn." },
		{ id: "bewd-only", kind: "card-text", cid: 20605, url: EN, read: "2026-11-24", quote: "(but if you control no \"Blue-Eyes White Dragon\", you can only Special Summon \"Blue-Eyes White Dragon\" with this effect)" },
		// OCG only. Konami's notes (補足情報, 2024-09-07), page read 2026-11-24.
		{ id: "notes-bewd-only", kind: "jp-notes", cid: 20605, url: NOTES, read: "2026-11-24", quote: "■処理時に、自分のモンスターゾーンまたは魔法＆罠ゾーンに表側表示の「青眼の白龍」が存在しない場合、「青眼の白龍」のみ特殊召喚できます。" },
		{ id: "notes-lock-already", kind: "jp-notes", cid: 20605, url: NOTES, read: "2026-11-24", quote: "（既にドラゴン族モンスター以外のモンスターをエクストラデッキから特殊召喚したターンでもこの効果を発動できます。）" },
		{ id: "notes-lock-negated", kind: "jp-notes", cid: 20605, url: NOTES, read: "2026-11-24", quote: "■特殊召喚の処理に成功したかに関わらず、この効果の発動や効果が無効にならなかったのであれば、『このターン、自分はドラゴン族モンスターしかEXデッキから特殊召喚できない』状態になります。" },
		{ id: "notes-gy-effect", kind: "jp-notes", cid: 20605, url: NOTES, read: "2026-11-24", quote: "■墓地で発動できるチェーンブロックの作られる効果です。" },
	],
	effects: ["facts", "summon", "lock", "fusion", "once", "bewd-only"],
	rulings: [{ source: "notes-bewd-only" }, { source: "notes-lock-already" }, { source: "notes-lock-negated" }, { source: "notes-gy-effect" }],
};
