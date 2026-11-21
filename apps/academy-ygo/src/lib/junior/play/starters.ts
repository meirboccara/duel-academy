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
 * Each starter Deck is built around one legend and brings a real Extra Deck, every monster of it Summonable from the
 * cards of the same Deck. All of it follows the current TCG Forbidden & Limited List (checked by masters.test.ts).
 */
const TRAPS = [
	["mirror-force", 1],
	["sakuretsu-armor", 2],
	["sticky-vine", 2],
] as const;

export const STARTERS: Record<StarterId, Starter> = {
	/* Dark Magician: Dark Paladin (with Buster Blader), the two Dragon Knights, Black Skull Dragon, a Rank 7. */
	warrior: {
		cover: "dark-magician",
		deck: {
			main: build(["dark-magician", 3], ["dark-magician-girl", 2], ["magicians-valkyria", 1], ["buster-blader", 2], ["curse-of-dragon", 2], ["gaia-the-fierce-knight", 1], ["summoned-skull", 1], ["red-eyes-black-dragon", 1], ["celtic-guardian", 2], ["giant-soldier-of-stone", 2], ["tune-warrior", 2], ["beta-the-magnet-warrior", 1], ["polymerization", 3], ["dark-magical-curtain", 2], ["sages-stone", 1], ["dark-magic-attack", 1], ["thousand-knives", 2], ["monster-reborn", 1], ["dark-hole", 1], ["swords-of-revealing-light", 1], ["spark-dash", 1], ["magic-cylinder", 1], ["negate-attack", 1], ...TRAPS),
			extra: build(["dark-paladin", 2], ["dark-magician-the-dragon-knight", 2], ["dark-magician-girl-the-dragon-knight", 2], ["gaia-the-dragon-champion", 1], ["black-skull-dragon", 1], ["gaia-dragon-the-thunder-charger", 1], ["gaia-knight", 1], ["gem-knight-pearl", 1], ["utopia", 1], ["lanphorhynchus", 1]),
		},
	},
	/* Blue-Eyes White Dragon: Blue-Eyes Ultimate Dragon, Twin Burst Dragon, Spirit Dragon (with Flamvell Guard, a Level 1 Tuner). */
	dragon: {
		cover: "blue-eyes-white-dragon",
		deck: {
			main: build(["blue-eyes-white-dragon", 3], ["blue-eyes-alternative-white-dragon", 2], ["flamvell-guard", 2], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 3], ["x-head-cannon", 2], ["luster-dragon-2", 2], ["tune-warrior", 2], ["polymerization", 2], ["ancient-rules", 1], ["trade-in", 2], ["burst-stream-of-destruction", 1], ["silvers-cry", 1], ["monster-reborn", 1], ["raigeki", 1], ["dark-hole", 1], ["spark-dash", 2], ["thunder-clap", 1], ["negate-attack", 2], ["magic-cylinder", 1], ...TRAPS),
			extra: build(["blue-eyes-ultimate-dragon", 2], ["blue-eyes-twin-burst-dragon", 2], ["blue-eyes-spirit-dragon", 2], ["gaia-knight", 2], ["gem-knight-pearl", 2], ["utopia", 1], ["lanphorhynchus", 1]),
		},
	},
	/* Elemental HEROes: Flame Wingman and Shining Flare Wingman, Thunder Giant, Great Tornado, Nova Master, Rampart Blaster. */
	hero: {
		cover: "elemental-hero-flame-wingman",
		deck: {
			main: build(["elemental-hero-avian", 3], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 2], ["elemental-hero-sparkman", 3], ["elemental-hero-bladedge", 1], ["elemental-hero-neos", 2], ["tune-warrior", 1], ["polymerization", 3], ["fusion-sage", 2], ["ancient-rules", 1], ["monster-reborn", 1], ["dark-hole", 1], ["raigeki", 1], ["the-warrior-returning-alive", 1], ["forbidden-chalice", 1], ["smashing-ground", 1], ["book-of-moon", 1], ["spark-dash", 2], ["thunder-clap", 1], ["swords-of-revealing-light", 1], ["hero-barrier", 2], ["magic-cylinder", 1], ...TRAPS),
			extra: build(["elemental-hero-flame-wingman", 3], ["elemental-hero-shining-flare-wingman", 2], ["elemental-hero-thunder-giant", 2], ["elemental-hero-great-tornado", 2], ["elemental-hero-nova-master", 2], ["elemental-hero-rampart-blaster", 1], ["gem-knight-pearl", 1], ["utopia", 1], ["lanphorhynchus", 1]),
		},
	},
};
