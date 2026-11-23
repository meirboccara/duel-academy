import type { CardInstance, Side } from "../duel";

/**
 * Is the card hidden from `viewer`? The Decks (contents and order) are hidden from both players; a hand, a face-down Extra Deck and
 * face-down banished cards from the other player; face-down cards on the field from the player who does not control them. The
 * Graveyard, Xyz Materials and everything face-up are public.
 */
export function hiddenFrom(card: CardInstance, viewer: Side): boolean {
	switch (card.zone) {
		case "deck":
			return true;
		case "hand":
			return card.owner !== viewer;
		case "extra":
		case "banished":
			return card.owner !== viewer && card.face === "down";
		case "monster":
		case "spell":
		case "field":
			return card.controller !== viewer && card.face === "down";
		default:
			return false;
	}
}
