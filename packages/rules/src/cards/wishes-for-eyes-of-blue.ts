import type { CardSources } from "../coverage";
import { shuffleDeck } from "../deck";
import { type Duel, moveCard, moveCards, type Side } from "../duel";
import { ask, type CardDef, targetsOf } from "../effects";
import { askEquipMonster, canEquipMonster } from "../equips";
import { belongsTo, hasPrintedName, mentionsCard } from "../identity";
import { canBeBanished } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Wishes for Eyes of Blue";
const BLUE_EYES_WHITE_DRAGON = "Blue-Eyes White Dragon";

/** "1 Level 1 LIGHT Tuner" in the player's Deck. */
const lightTuners = (duel: Duel, player: Side): number[] =>
	duel.piles[player].deck.filter((id) => {
		const facts = factsOf(duel, id);
		return duel.defs[duel.cards[id]!.code]?.kind === "monster" && facts?.level === 1 && facts.attribute === "LIGHT" && facts.tuner === true;
	});

/** "1 Spell/Trap that mentions "Blue-Eyes White Dragon" ... except "Wishes for Eyes of Blue"" in the player's Deck. */
const mentioning = (duel: Duel, player: Side): number[] =>
	duel.piles[player].deck.filter((id) => {
		const def = duel.defs[duel.cards[id]!.code];
		return def !== undefined && def.kind !== "monster" && mentionsCard(duel, id, BLUE_EYES_WHITE_DRAGON) && !hasPrintedName(duel, id, NAME);
	});

/** The "Blue-Eyes" monsters of the player's Extra Deck that could be equipped to `monster` now. */
const blueEyesToEquip = (duel: Duel, player: Side, monster: number): number[] => duel.piles[player].extra.filter((id) => belongsTo(duel, id, "Blue-Eyes") && canEquipMonster(duel, player, id, monster));

/**
 * "Discard 1 card; add 1 Level 1 LIGHT Tuner, and 1 Spell/Trap that mentions "Blue-Eyes White Dragon", from your Deck to your hand,
 * except "Wishes for Eyes of Blue". You can banish this card from your GY, then target 1 "Blue-Eyes White Dragon" you control; equip 1
 * "Blue-Eyes" monster from your Extra Deck to it as an Equip Spell that gives it 400 ATK. You can only use each effect of "Wishes for
 * Eyes of Blue" once per turn." A Normal Spell.
 *
 * - First effect: the effect of the card's activation; both kinds must be in the Deck to activate it (Konami's notes, OCG). The two
 *   cards are added at the same time, and nothing is added if one kind is missing when it resolves: YGOProJudge only (asked
 *   2026-11-24, it cited no official source). The Deck is shuffled afterwards. The cards added are not shown to the opponent by the
 *   core (as for Terraforming: the bot's view keeps them hidden). Known limit: the core has no "discarded" reason (`MoveReason` is
 *   destroyed, Tributed or material), so the discard is a plain move from the hand to the Graveyard, as for every card that discards
 *   (Ash Blossom, D.D. Crow): an "if this card is discarded" effect could not tell it from a card sent there otherwise.
 * - Second effect: an Ignition Effect in the Graveyard that starts a Chain Link (notes). Banishing itself is the cost. It is not
 *   applied to the target (notes): a monster unaffected by Spell effects is equipped too. The 400 ATK is the effect of the Equip Card
 *   (`equipMonster`'s `gives`): YGOProJudge only. A target that is no longer the card targeted (it left, was flipped face-down or
 *   changed control) is not equipped (`targetsOf`: the core's reading of a target, R2021).
 * - "A "Blue-Eyes" monster" is read from `facts.archetypes`; "Blue-Eyes White Dragon" from the printed name. No effect that changes a
 *   name is modelled.
 */
export const WISHES_FOR_EYES_OF_BLUE: CardDef = {
	code: "wishes-for-eyes-of-blue",
	kind: "spell",
	facts: { name: NAME, archetypes: ["Eyes of Blue"], mentions: [BLUE_EYES_WHITE_DRAGON] },
	effects: [
		{
			type: "activation",
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "name" },
			condition: (duel, { player }) => lightTuners(duel, player).length > 0 && mentioning(duel, player).length > 0,
			// "Discard 1 card": another card of the hand (this one is on the field by then). A plain move: the core has no discard reason (see above).
			cost: {
				can: (duel, { player, card }) => duel.piles[player].hand.some((id) => id !== card.id),
				pick: (duel, { player, card }) => duel.piles[player].hand.filter((id) => id !== card.id).map((id) => [id]),
				pay: (duel, _ctx, picked) => (picked.length === 1 ? moveCard(duel, picked[0]!, { zone: "graveyard" }) : null),
			},
			operation: (duel, link) => {
				const player = link.player;
				// All or nothing: with one kind missing, nothing is added (YGOProJudge only).
				if (lightTuners(duel, player).length === 0 || mentioning(duel, player).length === 0) return duel;
				return ask(duel, player, lightTuners(duel, player), (board, tuner) =>
					ask(board, player, mentioning(board, player), (chosen, spell) => shuffleDeck(moveCards(chosen, [tuner, spell], { zone: "hand" }), player)),
				);
			},
		},
		{
			type: "ignition",
			range: "graveyard",
			once: { scope: "name" },
			cost: (duel, { player, card }) => (canBeBanished(duel, card.id, player) ? moveCard(duel, card.id, { zone: "banished", player }) : null),
			target: (duel, { player }) => duel.piles[player].monster.filter((id) => duel.cards[id]!.face === "up" && hasPrintedName(duel, id, BLUE_EYES_WHITE_DRAGON) && blueEyesToEquip(duel, player, id).length > 0),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target || target.zone !== "monster" || target.face !== "up") return duel;
				return ask(duel, link.player, blueEyesToEquip(duel, link.player, target.id), (board, picked) =>
					askEquipMonster(board, link.player, picked, target.id, { by: link, gives: [{ kind: "add", stat: "atk", by: 400 }] }),
				);
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20604&request_locale=ja";

export const WISHES_FOR_EYES_OF_BLUE_SOURCES: CardSources = {
	code: "wishes-for-eyes-of-blue",
	cid: 20604,
	french: {
		text: "Défaussez 1 carte ; ajoutez 1 Syntoniseur LUMIÈRE de Niveau 1 et 1 Magie/Piège qui mentionne \"Dragon Blanc aux Yeux Bleus\" (\"Vœux pour les Yeux de Bleu\" exclu) depuis votre Deck à votre main. Vous pouvez bannir cette carte depuis votre Cimetière, puis ciblez 1 \"Dragon Blanc aux Yeux Bleus\" que vous contrôlez ; équipez-lui 1 monstre \"Yeux Bleus\" depuis votre Extra Deck comme Magie d'Équipement qui lui donne 400 ATK. Vous ne pouvez utiliser chaque effet de \"Vœux pour les Yeux de Bleu\" qu'une fois par tour.",
		url: konamiCardUrl(20604, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{
			id: "search",
			kind: "card-text",
			cid: 20604,
			url: konamiCardUrl(20604, "en"),
			read: "2026-11-24",
			quote: "Discard 1 card; add 1 Level 1 LIGHT Tuner, and 1 Spell/Trap that mentions \"Blue-Eyes White Dragon\", from your Deck to your hand, except \"Wishes for Eyes of Blue\".",
		},
		{
			id: "equip",
			kind: "card-text",
			cid: 20604,
			url: konamiCardUrl(20604, "en"),
			read: "2026-11-24",
			quote: "You can banish this card from your GY, then target 1 \"Blue-Eyes White Dragon\" you control; equip 1 \"Blue-Eyes\" monster from your Extra Deck to it as an Equip Spell that gives it 400 ATK.",
		},
		{ id: "once", kind: "card-text", cid: 20604, url: konamiCardUrl(20604, "en"), read: "2026-11-24", quote: "You can only use each effect of \"Wishes for Eyes of Blue\" once per turn." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-24.
		{ id: "notes-activation", kind: "jp-notes", cid: 20604, url: NOTES, read: "2026-11-24", quote: "■このカードの発動時の効果です。" },
		{ id: "notes-needs-both", kind: "jp-notes", cid: 20604, url: NOTES, read: "2026-11-24", quote: "のカード名が記された魔法・罠カード』が１枚以上、かつ『光属性・レベル１チューナー』が１体以上存在する状況で発動できます。" },
		{ id: "notes-mentions", kind: "jp-notes", cid: 20604, url: NOTES, read: "2026-11-24", quote: "のカード名が記された魔法・罠カードとは、テキストに特定のカード名として" },
		{ id: "notes-graveyard", kind: "jp-notes", cid: 20604, url: NOTES, read: "2026-11-24", quote: "■墓地で発動できるチェーンブロックの作られる効果です。" },
		{ id: "notes-not-applied", kind: "jp-notes", cid: 20604, url: NOTES, read: "2026-11-24", quote: "■対象のモンスターに適用する効果ではありません。（魔法カードの効果を受けないモンスターにも処理を適用できます。）" },
		// OCG only. The card's one Q&A (fid 23815, page dated 2026-06-26), about effects such as Macro Cosmos ("cards sent to the GY are
		// banished instead"): this card's first effect can still be activated, its text not saying "to the GY".
		{
			id: "qa-discard-while-banished-instead",
			kind: "jp-qa",
			cid: 20604,
			fid: 23815,
			url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=23815&request_locale=ja",
			read: "2026-11-24",
			quote: "コストとして捨てたカードは結果的に墓地へは行かず除外されますが、「灰流うらら」のように、テキストに『墓地へ捨てて発動』とは記載されていない効果は発動できます。",
		},
	],
	effects: ["search", "equip", "once"],
	rulings: [
		{ source: "notes-activation" },
		{ source: "notes-needs-both" },
		{ source: "notes-mentions" },
		{ source: "notes-graveyard" },
		{ source: "notes-not-applied" },
		{ source: "qa-discard-while-banished-instead", pending: "needs an effect that banishes cards sent to the GY instead (Macro Cosmos and the like), which the core does not have" },
	],
};
