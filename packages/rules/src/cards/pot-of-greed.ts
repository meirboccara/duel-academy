import { drawCards } from "../deck";
import type { CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { } from "./helpers";
import { konamiCardUrl } from "../sources";

/**
 * "Draw 2 cards." A Normal Spell. Drawing is a move from the Deck to the hand, so the cards drawn are added at the same
 * time (one batch). It needs two cards in the Deck: kept from Academy's old engine; no Konami page was read for it. It cannot be
 * activated while its player cannot draw by card effects or cannot add cards from the Deck to the hand (`requiresDraw`): YGOProJudge's
 * answers only (asked 2026-11-23 and 2026-11-24, no source cited).
 */
export const POT_OF_GREED: CardDef = {
	code: "pot-of-greed",
	kind: "spell",
	effects: [
		{
			type: "activation",
			categories: ["draw"],
			requiresDraw: true,
			condition: (duel, { player }) => duel.piles[player].deck.length >= 2,
			operation: (duel, link) => drawCards(duel, link.player, 2),
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
