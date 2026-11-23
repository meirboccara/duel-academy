import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { factsOf } from "./helpers";
import { konamiCardUrl } from "../sources";

/**
 * "Add 1 Field Spell from your Deck to your hand." Not a targeting effect: the player picks the card when it resolves.
 * It cannot be activated with no Field Spell in the Deck (rule record `search-needs-a-card`).
 */
const fieldSpellsIn = (duel: Duel, player: Side) => duel.piles[player].deck.filter((id) => factsOf(duel, id)?.icon === "field");

export const TERRAFORMING: CardDef = {
	code: "terraforming",
	kind: "spell",
	effects: [
		{
			type: "activation",
			categories: ["search"],
			condition: (duel, { player }) => fieldSpellsIn(duel, player).length > 0,
			operation: (duel, link) => ask(duel, link.player, fieldSpellsIn(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand" })),
		},
	],
};

export const TERRAFORMING_SOURCES: CardSources = {
	code: "terraforming",
	cid: 5537,
	french: { text: "Ajoutez 1 Magie de Terrain depuis votre Deck à votre main.", url: konamiCardUrl(5537, "fr"), read: "2026-11-23" },
	sources: [{ id: "text", kind: "card-text", cid: 5537, url: konamiCardUrl(5537, "en"), read: "2026-11-23", quote: "Add 1 Field Spell from your Deck to your hand." }],
	effects: ["text"],
	rulings: [],
};
