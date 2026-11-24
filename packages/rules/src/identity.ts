import type { Duel } from "./duel";
import type { Facts } from "./effects";

/**
 * A card's printed facts by instance. Missing definitions and ids not on the board are unknown, never guessed from its code. These
 * read the card's definition whatever its place and face: a script that asks about "a face-up [archetype] monster you control" must
 * check the face and zone itself (a face-down card has no name or archetype for such checks).
 */
export function printedFacts(duel: Duel, id: number): Facts | undefined {
	const card = duel.cards[id];
	return card ? duel.defs[card.code]?.facts : undefined;
}

export const hasPrintedName = (duel: Duel, id: number, name: string): boolean => printedFacts(duel, id)?.name === name;
export const belongsTo = (duel: Duel, id: number, archetype: string): boolean => printedFacts(duel, id)?.archetypes?.includes(archetype) ?? false;
export const mentionsCard = (duel: Duel, id: number, name: string): boolean => printedFacts(duel, id)?.mentions?.includes(name) ?? false;
