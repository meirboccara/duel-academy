import { moveCards } from "../duel";
import type { CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { } from "./helpers";
import { konamiCardUrl } from "../sources";

/**
 * "Draw 2 cards." A Normal Spell. Drawing is a move from the Deck to the hand, so the cards drawn are added at the same
 * time (one batch). It needs two cards in the Deck: kept from Academy's old engine; no Konami page was read for it.
 */
export const POT_OF_GREED: CardDef = {
	code: "pot-of-greed",
	kind: "spell",
	effects: [
		{
			type: "activation",
			categories: ["draw"],
			condition: (duel, { player }) => duel.piles[player].deck.length >= 2,
			operation: (duel, link) => moveCards(duel, duel.piles[link.player].deck.slice(0, 2), { zone: "hand" }),
		},
	],
};

export const POT_OF_GREED_SOURCES: CardSources = {
	code: "pot-of-greed",
	cid: 4844,
	french: { text: "Piochez 2 cartes.", url: konamiCardUrl(4844, "fr"), read: "2026-11-23" },
	sources: [{ id: "text", kind: "card-text", cid: 4844, url: konamiCardUrl(4844, "en"), read: "2026-11-23", quote: "Draw 2 cards." }],
	effects: ["text"],
	rulings: [],
};
