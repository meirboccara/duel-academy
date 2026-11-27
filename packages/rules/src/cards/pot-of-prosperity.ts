import type { CardSources } from "../coverage";
import { askBottomOrder, drewByEffect, excavate } from "../deck";
import { moveCard, moveCards, other } from "../duel";
import { ask, type CardDef, type EffectRecord, type Operation } from "../effects";
import { addModifier, locked } from "../modifiers";
import { konamiCardUrl } from "../sources";

/**
 * What happens when the card resolves, for a cost of `count` cards (the number banished is what the text reads, so each count has its own
 * record): the opponent's damage is halved from now to the end of the turn, then the top `count` cards of the Deck (all of them when it holds
 * fewer) are excavated, the player chooses 1 of them to add to the hand, and the rest go to the bottom of the Deck in the order they choose.
 * Konami's Q&A (fids 9932, OCG only): while cards cannot be added from the Deck to the hand the effect is still carried out, and the card
 * chosen to be added is sent to the GY instead (it does not count as sent there by an effect). The adding and the placing are "simultaneous"
 * in the notes; the core does them one after the other (the hand first), as `moveCards` has one destination.
 */
const resolves =
	(count: number): Operation =>
	(duel, link) => {
		const damaged = addModifier(duel, { affects: () => false, until: duel.turn.number, layer: { kind: "damage", who: other(link.player), halved: true }, by: link });
		const { duel: shown, cards } = excavate(damaged, link.player, count);
		return ask(shown, link.player, cards, (board, picked) => {
			const taken = moveCard(board, picked, { zone: locked(board, "add-to-hand", link.player) ? "graveyard" : "hand" });
			return askBottomOrder(taken, link.player, cards.filter((id) => id !== picked));
		});
	};

/** One way to activate the card: banish `count` cards of the Extra Deck face-down, chosen one at a time; the same use and the same oath. */
const activation = (count: number): EffectRecord => ({
	type: "activation",
	categories: ["search"],
	// A search that adds a card from the Deck: not activated while that is locked (Konami's Q&A fid 17846, OCG only).
	requiresAddToHand: true,
	once: { scope: "activation", key: "pot-of-prosperity" },
	// "You cannot draw cards by card effects the turn you activate this card" is a condition of the activation and a restriction from it
	// (Konami's notes): not after a draw by a card effect this turn, and from the moment it is activated, whether it resolves or not.
	condition: (duel, { player }) => !drewByEffect(duel, player),
	oath: (_duel, { player }) => [{ kind: "lock", what: "draw", who: player }],
	cost: { choose: { from: (duel, { player }) => duel.piles[player].extra, counts: [count] }, pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "banished", face: "down" }) },
	operation: resolves(count),
});

/**
 * "Banish 3 or 6 cards of your choice from your Extra Deck, face-down; for the rest of this turn after this card resolves, any damage your
 * opponent takes is halved, also excavate cards from the top of your Deck equal to the number of cards banished, add 1 excavated card to your
 * hand, place the rest on the bottom of your Deck in any order. You can only activate 1 "Pot of Prosperity" per turn. You cannot draw cards by
 * card effects the turn you activate this card." A Normal Spell.
 *
 * - The cost is the cards chosen one at a time before the card is activated (`CostSpec.choose`); a face-up card of the Extra Deck can be
 *   banished too (notes). The number banished is what the effect reads when it resolves, and the link keeps no list of the cards paid: the
 *   one printed effect is written as two activation records, one per count (3 and 6), as Maiden of White writes one effect in two places.
 * - "Only 1 per turn" is by activation (a negated activation gives the use back); the two records share it.
 * - Not activated while cards cannot be added from the Deck to the hand (`requiresAddToHand`, Konami's Q&A fid 17846, OCG only).
 * - The halving is applied when the card resolves (notes), and it does not add up with another halving (Konami's Q&A fid 23511).
 * - The oath is read from the activation (`oath`): it stands when only the effect is negated and is lifted when the activation is negated
 *   (Konami's Q&A fid 23378).
 */
export const POT_OF_PROSPERITY: CardDef = {
	code: "pot-of-prosperity",
	kind: "spell",
	facts: { name: "Pot of Prosperity", mentions: ["Pot of Prosperity"] },
	effects: [activation(3), activation(6)],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=15756&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(15756, "en");

export const POT_OF_PROSPERITY_SOURCES: CardSources = {
	code: "pot-of-prosperity",
	cid: 15756,
	french: {
		text: "Bannissez face verso 3 ou 6 cartes de votre choix depuis votre Extra Deck ; le reste de ce tour après la résolution de cette carte, les dommages reçus par votre adversaire sont divisés par deux, et aussi, dévoilez un nombre de cartes du dessus de votre Deck égal au nombre de cartes qui ont été bannies, ajoutez 1 carte dévoilée à votre main, placez les cartes restantes au-dessous de votre Deck dans l'ordre de votre choix. Vous ne pouvez activer qu'1 \"Pot de la Prospérité\" par tour. Vous ne pouvez pas piocher de cartes par des effets de carte le tour où vous activez cette carte.",
		url: konamiCardUrl(15756, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 15756, url: EN, read: "2026-11-24", quote: "Normal Spell" },
		{ id: "cost", kind: "card-text", cid: 15756, url: EN, read: "2026-11-24", quote: "Banish 3 or 6 cards of your choice from your Extra Deck, face-down;" },
		{ id: "damage", kind: "card-text", cid: 15756, url: EN, read: "2026-11-24", quote: "for the rest of this turn after this card resolves, any damage your opponent takes is halved" },
		{ id: "excavate", kind: "card-text", cid: 15756, url: EN, read: "2026-11-24", quote: "also excavate cards from the top of your Deck equal to the number of cards banished, add 1 excavated card to your hand, place the rest on the bottom of your Deck in any order." },
		{ id: "once", kind: "card-text", cid: 15756, url: EN, read: "2026-11-24", quote: "You can only activate 1 \"Pot of Prosperity\" per turn." },
		{ id: "oath", kind: "card-text", cid: 15756, url: EN, read: "2026-11-24", quote: "You cannot draw cards by card effects the turn you activate this card." },
		// OCG only. Konami's notes (補足情報, 2025-05-24), page read 2026-11-24.
		{ id: "notes-cost", kind: "jp-notes", cid: 15756, url: NOTES, read: "2026-11-24", quote: "■このカードを発動する際にコストとして、自分のエクストラデッキのカードを３枚または６枚、裏側で除外します（EXデッキの表側のカードも除外できます）。" },
		{ id: "notes-deck-short", kind: "jp-notes", cid: 15756, url: NOTES, read: "2026-11-24", quote: "■処理時に、自分のデッキの枚数がコストとして除外した枚数より少ない場合、デッキを全てめくって処理を行います。" },
		{ id: "notes-halved-at-resolution", kind: "jp-notes", cid: 15756, url: NOTES, read: "2026-11-24", quote: "また、処理時に、『ターン終了時まで相手が受ける全てのダメージは半分になる』効果を適用します。" },
		{ id: "notes-oath-from-activation", kind: "jp-notes", cid: 15756, url: NOTES, read: "2026-11-24", quote: "■このカードを発動した時点で、（実際に処理が行われたかどうかにかかわらず、）そのターン、自分はカードの効果でドローできなくなります。ただし、この効果の発動が無効になった場合、カードの効果でドローできる状態に戻ります。" },
		// OCG only. Konami's Q&A on the card (8 entries; titles of all read 2026-11-24, the five below opened).
		{ id: "qa-oath-negated-activation", kind: "jp-qa", cid: 15756, fid: 23378, url: qa(23378), read: "2026-11-24", quote: "「金満で謙虚な壺」の発動が無効になった場合、同じターン中に自分はカードの効果によってドローできます。" },
		{ id: "qa-oath-negated-effect", kind: "jp-qa", cid: 15756, fid: 23378, url: qa(23378), read: "2026-11-24", quote: "ただし、「金満で謙虚な壺」の効果が無効になった場合、同じターン中に自分はカードの効果によってドローできません。" },
		{ id: "qa-no-stack", kind: "jp-qa", cid: 15756, fid: 23511, url: qa(23511), read: "2026-11-24", quote: "（ダメージが半分の半分になることはありません。）" },
		// OCG only. Konami's Q&A fid 23121 (page dated 2022-12-30, read 2026-11-26): Upstart Goblin negated and nothing actually drawn: the Pot can be activated.
		{ id: "qa-upstart-negated", kind: "jp-qa", cid: 15756, fid: 23121, url: qa(23121), read: "2026-11-26", quote: "「成金ゴブリン」の発動や効果が無効になったことにより、このターンにカードの効果で実際にドローしていないのであれば、「金満で謙虚な壺」を発動できます。" },
		// The two Q&A below are about "Pot of Duality" and name this card in their lists ("the same for the following cards"): "cannot add cards
		// from the Deck to the hand" (Raiō's effect in the question) stops the activation, and with the lock applied while it resolves, the
		// card chosen to add is sent to the GY. The tests use the core's own lock on adding cards from the Deck to the hand.
		{ id: "qa-lock-activate", kind: "jp-qa", cid: 15756, fid: 17846, url: qa(17846), read: "2026-11-24", quote: "（A）発動できません。" },
		{ id: "qa-lock-resolve", kind: "jp-qa", cid: 15756, fid: 9932, url: qa(9932), read: "2026-11-24", quote: "以下のカードの効果についても同様に、めくる処理を行い、手札に加えられるカードがあるのであれば、手札に加えるカードを選び、墓地へ送ります。（手札に加えるカードとして選び墓地へ送られたカードは、効果で墓地へ送られた扱いにはなりません。）" },
	],
	effects: ["facts", "cost", "damage", "excavate", "once", "oath"],
	rulings: [
		{ source: "notes-cost" },
		{ source: "notes-deck-short" },
		{ source: "notes-halved-at-resolution" },
		{ source: "notes-oath-from-activation" },
		{ source: "qa-oath-negated-activation" },
		{ source: "qa-oath-negated-effect" },
		{ source: "qa-no-stack" },
		{ source: "qa-upstart-negated" },
		{ source: "qa-lock-activate" },
		{ source: "qa-lock-resolve" },
	],
};
