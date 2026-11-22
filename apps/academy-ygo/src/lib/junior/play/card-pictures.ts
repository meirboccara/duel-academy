import { CARD_ART } from "@duel-academy/cards";

/** Official card art: our own copies of YGOPRODeck's cropped pictures, in `public/cards` (scripts/cards/build-art.mjs). */
export type ArtSize = 160 | 480;
/** The address of a card's picture, or null when the card has no official art (an original card). */
export function cardArtUrl(id: string, size: ArtSize = 160): string | null {
	const entry = CARD_ART[id];
	return entry ? `/cards/${entry.image}-${size}.webp` : null;
}
