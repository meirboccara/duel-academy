import type { CardSources } from "../coverage";
import { drawCards, gainLp } from "../deck";
import { other } from "../duel";
import type { CardDef } from "../effects";
import { breakEffect } from "../events";
import { konamiCardUrl } from "../sources";

/**
 * "Draw 1 card, then your opponent gains 1000 LP." A Normal Spell with no once-per-turn limit on its text. Konami's notes (OCG): it can
 * be activated only while its controller has a card in the Deck; the opponent gains LP only if the card was drawn, and the two do not
 * happen at the same time ("then": `breakEffect` between them). If the Deck is empty when it resolves, its controller still has to draw
 * and loses the Duel (`drawCards`; Konami's notes on Mulcharmy Fuwalos, record `notes-cannot-draw`, OCG only). It cannot be activated
 * while Droll & Lock Bird's lock applies, or while its player cannot draw by card effects (`requiresDraw`): YGOProJudge's answers only
 * (asked 2026-11-24, no source cited), as for Pot of Greed.
 */
export const UPSTART_GOBLIN: CardDef = {
	code: "upstart-goblin",
	kind: "spell",
	facts: { name: "Upstart Goblin" },
	effects: [
		{
			type: "activation",
			categories: ["draw"],
			requiresDraw: true,
			condition: (duel, { player }) => duel.piles[player].deck.length > 0,
			operation: (duel, link) => {
				// The draw is attempted whatever the Deck holds: with no card left (the Deck was emptied in response), its player loses.
				const top = duel.piles[link.player].deck[0];
				const drawn = drawCards(duel, link.player, 1);
				if (top === undefined || drawn.cards[top]!.zone !== "hand") return drawn;
				return gainLp(breakEffect(drawn), other(link.player), 1000);
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4895&request_locale=ja";

export const UPSTART_GOBLIN_SOURCES: CardSources = {
	code: "upstart-goblin",
	cid: 4895,
	french: { text: "Piochez 1 carte, puis votre adversaire gagne 1000 LP.", url: konamiCardUrl(4895, "fr"), read: "2026-11-24" },
	sources: [
		{ id: "text", kind: "card-text", cid: 4895, url: konamiCardUrl(4895, "en"), read: "2026-11-24", quote: "Draw 1 card, then your opponent gains 1000 LP." },
		// OCG only. Konami's notes (補足情報, 2020-03-07), page read 2026-11-24. Its 2 Q&A entries are about cards the core does not have
		// (Pot of Extravagance, Performapal Life Swordsman): titles read, entries not opened.
		{ id: "notes-deck", kind: "jp-notes", cid: 4895, url: NOTES, read: "2026-11-24", quote: "■自分のデッキにカードが存在する状況で発動できます。" },
		{ id: "notes-sequence", kind: "jp-notes", cid: 4895, url: NOTES, read: "2026-11-24", quote: "■処理時に、『自分は１枚ドローする』処理を行います。ドローした場合、『相手は１０００LP回復する』処理を行います。これらの処理は同時に行われません。" },
	],
	effects: ["text"],
	rulings: [{ source: "notes-deck" }, { source: "notes-sequence" }],
};
