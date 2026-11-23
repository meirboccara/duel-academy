import type { CardDef } from "../effects";
import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { sendThisToGraveyard } from "./helpers";
import { ICE_BELL_QA } from "../rule-sources";
import { konamiCardUrl } from "../sources";

/**
 * What Ash Blossom & Joyous Spring answers: a card or effect that "includes" one of the three listed effects. Draw is
 * not on the list (Academy's old engine counts it; the printed text does not), so a draw card is not answered.
 */
export const ASH_BLOSSOM_ANSWERS: readonly string[] = ["search", "summon-from-deck", "send-from-deck"];

/**
 * Quick Effect from the hand, on a chain link whose declared categories include one of the three; the cost is discarding
 * this card (dry-run by the listing); it negates the effect (the activation stands); once per turn by name.
 */
export const ASH_BLOSSOM: CardDef = {
	code: "ash-blossom-joyous-spring",
	kind: "monster",
	effects: [
		{
			type: "quick",
			range: "hand",
			condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.some((category) => ASH_BLOSSOM_ANSWERS.includes(category)) ?? false,
			cost: sendThisToGraveyard,
			operation: (duel, _link, index) => negateEffect(duel, index - 1),
			once: { scope: "name" },
		},
	],
};

export const ASH_BLOSSOM_SOURCES: CardSources = {
	code: "ash-blossom-joyous-spring",
	cid: 12950,
	french: {
		text: "Lorsqu'une carte ou un effet qui inclut n'importe lequel de ces effets est activé (Effet Rapide) : vous pouvez défausser cette carte ; annulez l'effet. ●Ajouter une carte depuis le Deck à la main. ●Invoquer Spécialement depuis le Deck. ●Envoyer une carte depuis le Deck au Cimetière. Vous ne pouvez utiliser cet effet de \"Floraison de Cendres et Joyeux Printemps\" qu'une fois par tour.",
		url: konamiCardUrl(12950, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 12950,
			url: konamiCardUrl(12950, "en"),
			read: "2026-11-23",
			quote: "When a card or effect is activated that includes any of these effects (Quick Effect): You can discard this card; negate that effect. ●Add a card from the Deck to the hand. ●Special Summon from the Deck. ●Send a card from the Deck to the GY. You can only use this effect of \"Ash Blossom & Joyous Spring\" once per turn.",
		},
		{ id: "negated-effect-activation-stands", ...ICE_BELL_QA },

	],
	effects: ["text"],
	rulings: [{ source: "negated-effect-activation-stands" }],
};
