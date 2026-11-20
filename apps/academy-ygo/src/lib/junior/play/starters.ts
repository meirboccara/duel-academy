import { build } from "./master-decks";
import type { Deck } from "./masters";

/**
 * The starter decks: on the masters' island the child chooses one, once. Its cards join the binder, and the deck can
 * then be changed with any card of the binder (deck rules in masters.ts: 40 cards, up to 3 copies). Every card is a
 * real card the rules engine plays exactly.
 */
export const STARTER_IDS = ["warrior", "dragon", "hero"] as const;
export type StarterId = (typeof STARTER_IDS)[number];
export interface Starter {
	/** The card shown on the starter's cover. */
	cover: string;
	deck: Deck;
}

const DEFENCE = [
	["sticky-vine", 2],
	["sakuretsu-armor", 2],
] as const;

export const STARTERS: Record<StarterId, Starter> = {
	warrior: {
		cover: "dark-magician",
		deck: {
			main: build(["celtic-guardian", 3], ["queens-knight", 3], ["gazelle-the-king-of-mythical-beasts", 3], ["alpha-the-magnet-warrior", 3], ["beta-the-magnet-warrior", 3], ["gamma-the-magnet-warrior", 3], ["giant-soldier-of-stone", 3], ["moss-beetle", 2], ["curse-of-dragon", 2], ["summoned-skull", 1], ["dark-magician", 1], ["pot-of-greed", 1], ["monster-reborn", 1], ["swords-of-revealing-light", 1], ["spark-dash", 2], ["thunder-clap", 2], ["fog-snare", 2], ...DEFENCE),
			extra: [],
		},
	},
	dragon: {
		cover: "blue-eyes-white-dragon",
		deck: {
			main: build(["baby-dragon", 3], ["lesser-dragon", 3], ["fairy-dragon", 3], ["luster-dragon-2", 2], ["curse-of-dragon", 3], ["serpent-night-dragon", 1], ["blue-eyes-white-dragon", 1], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 3], ["x-head-cannon", 3], ["hyozanryu", 1], ["pot-of-greed", 1], ["monster-reborn", 1], ["mountain", 2], ["thunder-clap", 2], ["spark-dash", 2], ["negate-attack", 2], ...DEFENCE),
			extra: [],
		},
	},
	hero: {
		cover: "elemental-hero-flame-wingman",
		deck: {
			main: build(["elemental-hero-avian", 3], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 3], ["elemental-hero-sparkman", 3], ["oscillo-hero", 3], ["beaver-warrior", 3], ["polymerization", 3], ["fusion-sage", 2], ["pot-of-greed", 1], ["monster-reborn", 1], ["the-warrior-returning-alive", 2], ["hero-barrier", 2], ["elemental-recharge", 2], ["spark-dash", 2], ["thunder-clap", 2], ["fog-snare", 1], ...DEFENCE),
			extra: build(["elemental-hero-flame-wingman", 3]),
		},
	},
};
