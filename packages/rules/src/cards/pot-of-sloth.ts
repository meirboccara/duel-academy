import { askUpTo } from "../choices";
import type { CardSources } from "../coverage";
import { askBottomOrder, drawCards } from "../deck";
import { type Duel, other, type Side } from "../duel";
import type { CardDef } from "../effects";
import { breakEffect } from "../events";
import { hasPrintedName } from "../identity";
import { addModifier } from "../modifiers";
import { konamiCardUrl } from "../sources";

const NAME = "Pot of Sloth";

/** "The number of cards your opponent controls": their monsters, their Spell & Trap Zones and their Field Zone, face-down ones included. */
const opponentsCards = (duel: Duel, player: Side): number => {
	const piles = duel.piles[other(player)];
	return piles.monster.length + piles.spell.length + piles.field.length;
};

/**
 * "Draw cards equal to the number of cards your opponent controls, then if you drew 2 or more cards, place cards from your hand on the bottom of
 * the Deck in any order, equal to the number you drew -1. For the rest of this turn after this card resolves, you cannot activate "Pot of Sloth"."
 * A Normal Spell.
 *
 * - Activation legality (YGOProJudge only, chat of 2026-11-26, it cited no Konami page for the activation): it cannot be activated while its
 *   draw cannot be done: the opponent controls no card (a draw of 0), the player cannot draw by card effects or add cards from the Deck to the hand
 *   (`requiresDraw`, as for Pot of Greed), or the Deck holds fewer cards than the opponent controls (the player would lose). Konami's notes say the
 *   restriction stands "whether or not the drawing and the placing succeeded": that is read as what happens when things change between the
 *   activation and the resolution (the opponent's cards leave in response), not as a licence to activate an impossible draw. A draw of more cards
 *   than the Deck holds at resolution makes the player lose, as for every draw by an effect (`drawCards`).
 * - The number counted is read when the effect resolves. The drawing and the placing are two steps (notes: "not simultaneous"): the cards drawn
 *   are in the hand when the player chooses, and they may be chosen. The player picks the cards one at a time; the last one picked is the bottom card.
 * - "For the rest of this turn after this card resolves": a lock on activating a card named "Pot of Sloth" (a Spell Card's activation, not another
 *   effect that happens to be of a card of that name), set by the effect when it resolves, so a negated activation or effect does not set it (notes:
 *   "unless the effect is negated"). Not tied to the card: it stays if the card has left the field.
 */
export const POT_OF_SLOTH: CardDef = {
	code: "pot-of-sloth",
	kind: "spell",
	facts: { name: NAME, mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["draw"],
			requiresDraw: true,
			condition: (duel, { player }) => opponentsCards(duel, player) > 0 && duel.piles[player].deck.length >= opponentsCards(duel, player),
			operation: (duel, link) => {
				const locked = addModifier(duel, {
					affects: () => false,
					until: duel.turn.number,
					layer: { kind: "lock", what: "activate", who: link.player, stops: (board, { card, effect }) => effect.type === "activation" && hasPrintedName(board, card.id, NAME), describe: `"${NAME}"` },
				});
				const before = locked.piles[link.player].hand.length;
				const drawn = drawCards(locked, link.player, opponentsCards(locked, link.player));
				const count = drawn.piles[link.player].hand.length - before;
				if (count < 2 || drawn.winner) return drawn;
				// "Then": the drawing is done, and the placing begins from the hand as it now is.
				return askUpTo(breakEffect(drawn), link.player, drawn.piles[link.player].hand, { min: count - 1, max: count - 1 }, (board, picked) => askBottomOrder(board, link.player, picked));
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=23010&request_locale=ja";
const EN = konamiCardUrl(23010, "en");

export const POT_OF_SLOTH_SOURCES: CardSources = {
	code: "pot-of-sloth",
	cid: 23010,
	french: {
		text: "Piochez un nombre de cartes égal au nombre de cartes contrôlées par votre adversaire, puis si vous avez pioché min. 2 cartes, placez un nombre de cartes depuis votre main au-dessous du Deck dans l'ordre de votre choix, égal au nombre que vous avez pioché -1. Le reste de ce tour après la résolution de cette carte, vous ne pouvez pas activer \"Pot de Paresse\".",
		url: konamiCardUrl(23010, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 23010, url: EN, read: "2026-11-26", quote: "Normal Spell" },
		{ id: "draw", kind: "card-text", cid: 23010, url: EN, read: "2026-11-26", quote: "Draw cards equal to the number of cards your opponent controls," },
		{ id: "bottom", kind: "card-text", cid: 23010, url: EN, read: "2026-11-26", quote: "then if you drew 2 or more cards, place cards from your hand on the bottom of the Deck in any order, equal to the number you drew -1." },
		{ id: "lock", kind: "card-text", cid: 23010, url: EN, read: "2026-11-26", quote: "For the rest of this turn after this card resolves, you cannot activate \"Pot of Sloth\"." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-26. The card has no Q&A ("このカードに関連するＱ＆Ａはありません").
		{ id: "notes-sequential", kind: "jp-notes", cid: 23010, url: NOTES, read: "2026-11-26", quote: "■ドローする処理とデッキの下に戻す処理を両方行う場合、それらは同時に行われません。" },
		{ id: "notes-lock-failure", kind: "jp-notes", cid: 23010, url: NOTES, read: "2026-11-26", quote: "■ドローする処理やデッキの下に戻す処理に成功したかに関わらず、この効果の発動や効果が無効にならなかったのであれば、『このカードの発動後、ターン終了時まで自分は「怠慢な壺」を発動できない』状態になります。" },
	],
	effects: ["facts", "draw", "bottom", "lock"],
	rulings: [{ source: "notes-sequential" }, { source: "notes-lock-failure" }],
};
