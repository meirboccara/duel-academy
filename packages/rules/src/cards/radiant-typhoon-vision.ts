import type { CardSources } from "../coverage";
import { drawCards } from "../deck";
import { type Duel, moveCard, moveCards, type Side } from "../duel";
import { ask, type CardDef, type EffectRecord } from "../effects";
import { breakEffect } from "../events";
import { belongsTo, hasPrintedName } from "../identity";
import { askSetByEffect, canSetByEffect } from "../set";
import { konamiCardUrl } from "../sources";

const NAME = "Radiant Typhoon Vision";
const MST = "Mystical Space Typhoon";
const RADIANT_TYPHOON = "Radiant Typhoon";

/** "A "Radiant Typhoon" card or a Quick-Play Spell in your hand": the cards of the hand it may discard (a card of the archetype of any kind). */
const discardable = (duel: Duel, player: Side): number[] => duel.piles[player].hand.filter((id) => belongsTo(duel, id, RADIANT_TYPHOON) || duel.defs[duel.cards[id]!.code]?.kind === "quick-play");

/** "1 "Mystical Space Typhoon" from your Deck or GY". */
const typhoons = (duel: Duel, player: Side): number[] => [...duel.piles[player].deck, ...duel.piles[player].graveyard].filter((id) => hasPrintedName(duel, id, MST));

/**
 * "If this card is destroyed by the effect of "Mystical Space Typhoon": You can Set this card." Written as two optional "if" Trigger Effects, one
 * for the Graveyard and one for banishment (face-up), as Konami's notes say: it is activated where it first went. The destruction names the effect
 * (`Destruction`): a card effect whose card has the printed name of "Mystical Space Typhoon"; another destruction (battle, a cost, another card's
 * effect) does not trigger it. The card may be destroyed on the field Set or face-up, or while it is on the chain as the card being activated.
 */
const setItself = (zone: "graveyard" | "banished"): EffectRecord => ({
	type: "trigger",
	range: zone,
	timing: "if",
	categories: ["set-from-graveyard"],
	condition: (duel, { player, card }) => canSetByEffect(duel, player, card.id),
	event: (duel, event, { card }) =>
		event.type === "moved" &&
		event.before.id === card.id &&
		(event.before.zone === "spell" || event.before.zone === "field") &&
		event.reason === "destroyed" &&
		event.destruction?.cause === "effect" &&
		duel.defs[event.destruction.source.code]?.facts?.name === MST &&
		event.after.zone === zone &&
		(zone === "graveyard" || event.after.face === "up"),
	operation: (duel, link) => {
		const now = duel.cards[link.card.id]!;
		// Only for the card that was destroyed: it must still be where it went (a card that moved on is another card).
		if (now.zone !== zone || now.moves !== link.card.moves) return duel;
		return askSetByEffect(duel, link.player, now.id, { effect: link });
	},
});

/**
 * "Activate 1 of these effects (but you can only use each of these effects of "Radiant Typhoon Vision" once per turn); ●Draw 2 cards, then if you
 * have a "Radiant Typhoon" card or a Quick-Play Spell in your hand, discard 1 of them, or your entire hand if you don't. ●Add 1 "Mystical Space
 * Typhoon" from your Deck or GY to your hand." A Quick-Play Spell, "Radiant Typhoon" by its name, and the Set effect above.
 *
 * - Pattern P1 (docs/rules-core/sky-striker-gaps.md): each ● is its own `activation` record with its own once-per-turn use, because the use is
 *   each ●'s own and `EffectMode` has none. Konami's notes: the ● is chosen when the card is activated and it is activated as that effect. The two
 *   records are told apart by their `effect` index (the action label is the same: no target, no mode). The use is by name, per player, spent at
 *   activation and kept when the activation or the effect is negated (Konami's Q&A fid 23977, about another card with the same wording: the
 *   choice of the ● counts); the other ● can still be chosen (the same fid: the card can be activated again with the other effect).
 * - ●1: draw 2, then (not simultaneous: notes) if the player has a "Radiant Typhoon" card or a Quick-Play Spell in the hand, one of them is
 *   chosen and discarded; if not, the entire hand is discarded. The cards just drawn are in the hand and may be chosen. The discard is read
 *   only when the draw succeeded (notes), so a draw that did nothing (a lock set in the chain) discards nothing. This card is on the field while it
 *   resolves, so it is not in the hand. Activation legality (YGOProJudge only for Pot of Greed, asked 2026-11-23 and 2026-11-24, no source
 *   cited; the same reading here): it cannot be activated with fewer than 2 cards in the Deck or while the player cannot draw by card effects
 *   (`requiresDraw`).
 * - ●2: the card is chosen when the effect resolves (no target), from the Deck and the GY; the activation needs one there to take (the core's reading
 *   "cannot activate when it cannot be done", `requiresAddToHand` for the Deck lock).
 */
export const RADIANT_TYPHOON_VISION: CardDef = {
	code: "radiant-typhoon-vision",
	kind: "quick-play",
	facts: { name: NAME, archetypes: [RADIANT_TYPHOON], mentions: [MST, NAME] },
	effects: [
		{
			type: "activation",
			categories: ["draw"],
			requiresDraw: true,
			once: { scope: "name", key: "radiant-typhoon-vision-draw" },
			condition: (duel, { player }) => duel.piles[player].deck.length >= 2,
			operation: (duel, link) => {
				const before = duel.piles[link.player].hand.length;
				const drawn = drawCards(duel, link.player, 2);
				if (drawn.winner || drawn.piles[link.player].hand.length === before) return drawn;
				const next = breakEffect(drawn);
				const choices = discardable(next, link.player);
				if (choices.length > 0) return ask(next, link.player, choices, (board, picked) => moveCard(board, picked, { zone: "graveyard", reason: "discarded", effect: link }));
				return moveCards(next, next.piles[link.player].hand, { zone: "graveyard", reason: "discarded", effect: link });
			},
		},
		{
			type: "activation",
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "name", key: "radiant-typhoon-vision-search" },
			condition: (duel, { player }) => typhoons(duel, player).length > 0,
			operation: (duel, link) => ask(duel, link.player, typhoons(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
		setItself("graveyard"),
		setItself("banished"),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=21829&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(21829, "en");

export const RADIANT_TYPHOON_VISION_SOURCES: CardSources = {
	code: "radiant-typhoon-vision",
	cid: 21829,
	french: {
		text: "Si cette carte est détruite par l'effet de \"Typhon d'Espace Mystique\" : vous pouvez Poser cette carte. Activez 1 de ces effets (mais vous ne pouvez utiliser chacun de ces effets de \"Vision du Typhon Radieux\" qu'une fois par tour) ;\n●Piochez 2 cartes, puis si vous avez une carte \"Typhon Radieux\" ou une Magie Jeu-Rapide dans votre main, défaussez-en 1, ou toute votre main si vous n'en avez pas.\n●Ajoutez 1 \"Typhon d'Espace Mystique\" depuis votre Deck ou Cimetière à votre main.",
		url: konamiCardUrl(21829, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 21829, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "set", kind: "card-text", cid: 21829, url: EN, read: "2026-11-26", quote: "If this card is destroyed by the effect of \"Mystical Space Typhoon\": You can Set this card." },
		{ id: "choose", kind: "card-text", cid: 21829, url: EN, read: "2026-11-26", quote: "Activate 1 of these effects (but you can only use each of these effects of \"Radiant Typhoon Vision\" once per turn);" },
		{ id: "draw", kind: "card-text", cid: 21829, url: EN, read: "2026-11-26", quote: "●Draw 2 cards, then if you have a \"Radiant Typhoon\" card or a Quick-Play Spell in your hand, discard 1 of them, or your entire hand if you don't." },
		{ id: "search", kind: "card-text", cid: 21829, url: EN, read: "2026-11-26", quote: "●Add 1 \"Mystical Space Typhoon\" from your Deck or GY to your hand." },
		// OCG only. Konami's notes (補足情報, 2025-07-26), page read 2026-11-26. Its 3 Q&A are opened below: fids 23977, 24403 and 24312.
		{ id: "notes-chain-block", kind: "jp-notes", cid: 21829, url: NOTES, read: "2026-11-26", quote: "■このカードの発動時の効果です。" },
		{ id: "notes-mode", kind: "jp-notes", cid: 21829, url: NOTES, read: "2026-11-26", quote: "■この効果を発動する際に『●』を１つ選択し、その『●』の効果として発動します。" },
		{ id: "notes-draw-then", kind: "jp-notes", cid: 21829, url: NOTES, read: "2026-11-26", quote: "■処理時に、『自分は２枚ドローする』処理を行います。ドローに成功し、自分の手札に「絢嵐」カードか速攻魔法カードが存在する場合、その後、『その内の１枚を選んで捨てる』処理を行います。存在しない場合、その後、『自分の手札を全て捨てる』処理を行います。" },
		{ id: "notes-not-simultaneous", kind: "jp-notes", cid: 21829, url: NOTES, read: "2026-11-26", quote: "■ドローする処理と手札を捨てる処理は同時に行われません。" },
		{ id: "notes-set-chain-block", kind: "jp-notes", cid: 21829, url: NOTES, read: "2026-11-26", quote: "■チェーンブロックの作られる効果です。" },
		{ id: "notes-set-where", kind: "jp-notes", cid: 21829, url: NOTES, read: "2026-11-26", quote: "■このカードが「サイクロン」の効果で破壊され、墓地へ送られた場合には墓地で、表側で除外された場合には除外状態で発動できます。（破壊され最初に送られたところで発動できます。）" },
		// OCG only. Konami's Q&A fid 23977 (2026-11-26), page read 2026-11-26. It is about "Volcanic Rimfire"; its answer ends with the list of cards worded
		// the same way, which the page of this card lists among its Q&A.
		{ id: "qa-mode-counts-when-negated", kind: "jp-qa", cid: 21829, fid: 23977, url: qa(23977), read: "2026-11-26", quote: "（効果の発動や効果が無効になった場合でも、『●』の選択は行ったことになります。）" },
		// OCG only. Konami's Q&A fids 24403 (2026-10-16) and 24312 (2026-04-02), pages read 2026-11-26. Both are about cards Academy does not have (see `rulings`).
		{ id: "qa-hand-discard-watcher", kind: "jp-qa", cid: 21829, fid: 24403, url: qa(24403), read: "2026-11-26", quote: "「絢嵐たる見神」の１つ目の『●』" },
		{ id: "qa-drawn-krosea", kind: "jp-qa", cid: 21829, fid: 24312, url: qa(24312), read: "2026-11-26", quote: "（自身を特殊召喚する誘発効果のうち手札で発動可能である効果は、同一チェーン上ではいずれか１つしか発動できないため、「絢嵐豪火フォニクス」、「絢嵐渦麗ヴァルルーン」、「絢嵐たるクローゼア」の内１体しか発動できません。）" },
	],
	effects: ["facts", "set", "choose", "draw", "search"],
	rulings: [{ source: "notes-chain-block" }, { source: "notes-mode" }, { source: "notes-draw-then" }, { source: "notes-not-simultaneous" }, { source: "notes-set-chain-block" }, { source: "notes-set-where" }, { source: "qa-mode-counts-when-negated" },
		{ source: "qa-hand-discard-watcher", pending: "Fid 24403 lists the first ● among the cards that include a discard of the player's own hand, which \"Gravekeeper's Watcher\" answers; that card is not in Academy and no category names a discard (the Chain Link declares \"draw\" only)" },
		{ source: "qa-drawn-krosea", pending: "Fid 24312 is about \"Radiant Typhoon Krosea\" (and two other Radiant Typhoon monsters) drawn by the first ●, which Academy does not have; the draw and discard are tested with made-up cards" },
	],
};
