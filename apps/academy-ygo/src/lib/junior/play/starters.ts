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

/**
 * Each starter Deck plays its own way and brings a real Extra Deck, every monster of it Summonable from the cards
 * of the same Deck: Fusion with Polymerization, a Synchro with Tune Warrior (Level 3) and a Level 3 monster, an Xyz
 * with two Level 4 monsters, a Link with any two monsters.
 */
const TRAPS = [
	["mirror-force", 1],
	["sakuretsu-armor", 2],
	["sticky-vine", 2],
] as const;
const EXTRA_FOR_ALL = [
	["gem-knight-pearl", 2],
	["utopia", 1],
	["gaia-knight", 2],
	["lanphorhynchus", 1],
] as const;

export const STARTERS: Record<StarterId, Starter> = {
	warrior: {
		cover: "dark-magician",
		deck: {
			main: build(["celtic-guardian", 3], ["queens-knight", 2], ["beta-the-magnet-warrior", 3], ["gamma-the-magnet-warrior", 2], ["giant-soldier-of-stone", 3], ["tune-warrior", 3], ["flame-manipulator", 1], ["masaki", 1], ["curse-of-dragon", 2], ["gaia-the-fierce-knight", 1], ["summoned-skull", 2], ["dark-magician", 1], ["dark-magician-girl", 1], ["polymerization", 2], ["pot-of-greed", 1], ["monster-reborn", 1], ["swords-of-revealing-light", 1], ["dark-hole", 1], ["spark-dash", 2], ["magic-cylinder", 1], ["negate-attack", 1], ...TRAPS),
			extra: build(["gaia-the-dragon-champion", 2], ["flame-swordsman", 1], ...EXTRA_FOR_ALL),
		},
	},
	dragon: {
		cover: "blue-eyes-white-dragon",
		deck: {
			main: build(["lesser-dragon", 3], ["fairy-dragon", 2], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 3], ["x-head-cannon", 2], ["luster-dragon-2", 2], ["curse-of-dragon", 2], ["tune-warrior", 3], ["blue-eyes-white-dragon", 1], ["red-eyes-black-dragon", 1], ["baby-dragon", 2], ["mountain", 2], ["pot-of-greed", 1], ["monster-reborn", 1], ["raigeki", 1], ["thunder-clap", 2], ["spark-dash", 2], ["negate-attack", 2], ...TRAPS),
			extra: build(...EXTRA_FOR_ALL, ["utopia", 1]),
		},
	},
	hero: {
		cover: "elemental-hero-flame-wingman",
		deck: {
			main: build(["elemental-hero-avian", 3], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 2], ["elemental-hero-sparkman", 3], ["elemental-hero-bladedge", 1], ["elemental-hero-neos", 1], ["beaver-warrior", 1], ["tune-warrior", 3], ["polymerization", 3], ["fusion-sage", 2], ["dark-hole", 1], ["raigeki", 1], ["pot-of-greed", 1], ["monster-reborn", 1], ["the-warrior-returning-alive", 1], ["spark-dash", 2], ["thunder-clap", 2], ["hero-barrier", 2], ["elemental-recharge", 1], ["magic-cylinder", 1], ...TRAPS),
			extra: build(["elemental-hero-flame-wingman", 3], ...EXTRA_FOR_ALL),
		},
	},
};
