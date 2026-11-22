import type { Persona } from "@duel-academy/engine";
import type { CardId } from "@duel-academy/engine";
import type { Deck } from "../masters";
import { BLUE_EYES } from "./blue-eyes/pack";
import { HERO } from "./hero/pack";

/**
 * Meta packs: one folder per archetype, each with a deck built only from cards the rules engine plays by itself
 * (written as data, or with their own rules), and the way its trainer plays. "Meta-lite": the hand traps and staples
 * of today's tournaments, with combos short enough for a child to follow.
 */
export interface Pack {
	/** The archetype, as the cards name it. */
	archetype: string;
	/** The cards that make the archetype work, for a binder page or a lesson. */
	engine: readonly CardId[];
	deck: Deck;
	persona: Persona;
}

export const PACK_IDS = ["blue-eyes", "hero"] as const;
export type PackId = (typeof PACK_IDS)[number];
export const PACKS: Record<PackId, Pack> = { "blue-eyes": BLUE_EYES, hero: HERO };
