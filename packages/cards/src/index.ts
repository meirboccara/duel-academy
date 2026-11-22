import { setCatalogue } from "@duel-academy/engine";
import { CARD_ART } from "./card-art";
import { type CARDS, FORBIDDEN_ONE, PRINTED } from "./cards";

/**
 * @duel-academy/cards: the cards Duel Academy plays, with their printed facts. Importing it gives them to the engine,
 * and narrows the engine's card ids to these.
 */
setCatalogue({ cards: PRINTED, facts: CARD_ART, forbiddenOne: FORBIDDEN_ONE });

declare module "@duel-academy/engine" {
	interface CardRegistry {
		id: keyof typeof CARDS;
	}
}

export * from "./card-art";
export * from "./cards";
