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
 *
 * The lists borrow from what the same strategies play in tournaments (read 2026-11-22, docs/academy-junior-masters-plan.md):
 * the hand traps Ash Blossom & Joyous Spring and Effect Veiler, Magician's Rod for Dark Magician, Effect Veiler as the
 * Level 1 LIGHT Tuner of Blue-Eyes, A Hero Lives and the searchers for the HEROes. A tournament card the rules engine
 * cannot play exactly is left out.
 */
const TRAPS = [
	["mirror-force", 1],
	["bottomless-trap-hole", 1],
	["trap-hole", 1],
	["torrential-tribute", 1],
	["sakuretsu-armor", 1],
] as const;

export const STARTERS: Record<StarterId, Starter> = {
	/* Dark Magician: Magician's Rod finds the Curtain; Dark Paladin (with Buster Blader), the two Dragon Knights, Black Skull Dragon, a Rank 7. */
	warrior: {
		cover: "dark-magician",
		deck: {
			main: build(["dark-magician", 3], ["dark-magician-girl", 2], ["magicians-rod", 3], ["magicians-valkyria", 1], ["buster-blader", 2], ["curse-of-dragon", 1], ["gaia-the-fierce-knight", 1], ["summoned-skull", 1], ["red-eyes-black-dragon", 1], ["tune-warrior", 2], ["ash-blossom-joyous-spring", 2], ["effect-veiler", 1], ["polymerization", 3], ["dark-magical-curtain", 2], ["sages-stone", 1], ["dark-magic-attack", 1], ["thousand-knives", 2], ["monster-reborn", 1], ["dark-hole", 1], ["swords-of-revealing-light", 1], ["spark-dash", 1], ["magic-cylinder", 1], ["negate-attack", 1], ...TRAPS),
			extra: build(["dark-paladin", 3], ["dark-magician-the-dragon-knight", 2], ["dark-magician-girl-the-dragon-knight", 2], ["gaia-the-dragon-champion", 1], ["black-skull-dragon", 1], ["gaia-dragon-the-thunder-charger", 1], ["gaia-knight", 2], ["lanphorhynchus", 1]),
		},
	},
	/* Blue-Eyes White Dragon: Blue-Eyes Ultimate Dragon, Twin Burst Dragon, Spirit Dragon (with Effect Veiler or Flamvell Guard, Level 1 Tuners). */
	dragon: {
		cover: "blue-eyes-white-dragon",
		deck: {
			main: build(["blue-eyes-white-dragon", 3], ["blue-eyes-alternative-white-dragon", 2], ["flamvell-guard", 2], ["effect-veiler", 2], ["ash-blossom-joyous-spring", 2], ["battle-fader", 1], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 2], ["x-head-cannon", 1], ["luster-dragon-2", 2], ["polymerization", 2], ["ancient-rules", 1], ["trade-in", 2], ["burst-stream-of-destruction", 1], ["silvers-cry", 1], ["monster-reborn", 1], ["raigeki", 1], ["dark-hole", 1], ["spark-dash", 2], ["thunder-clap", 1], ["negate-attack", 1], ["magic-cylinder", 1], ...TRAPS),
			extra: build(["blue-eyes-ultimate-dragon", 2], ["blue-eyes-twin-burst-dragon", 2], ["blue-eyes-spirit-dragon", 3], ["gem-knight-pearl", 2], ["utopia", 1], ["lanphorhynchus", 1]),
		},
	},
	/* Elemental HEROes: A Hero Lives and Blazeman bring the Fusion together; Flame Wingman, Shining Flare Wingman, Thunder Giant, Great Tornado, Nova Master, Gaia, Rampart Blaster. */
	hero: {
		cover: "elemental-hero-flame-wingman",
		deck: {
			main: build(["elemental-hero-avian", 2], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 2], ["elemental-hero-sparkman", 3], ["elemental-hero-blazeman", 3], ["elemental-hero-bladedge", 1], ["elemental-hero-neos", 1], ["ash-blossom-joyous-spring", 2], ["effect-veiler", 1], ["polymerization", 3], ["a-hero-lives", 2], ["e-emergency-call", 2], ["reinforcement-of-the-army", 1], ["fusion-sage", 1], ["monster-reborn", 1], ["dark-hole", 1], ["raigeki", 1], ["the-warrior-returning-alive", 1], ["forbidden-chalice", 1], ["book-of-moon", 1], ["hero-barrier", 1], ["magic-cylinder", 1], ...TRAPS),
			extra: build(["elemental-hero-flame-wingman", 3], ["elemental-hero-shining-flare-wingman", 1], ["elemental-hero-thunder-giant", 2], ["elemental-hero-great-tornado", 2], ["elemental-hero-nova-master", 2], ["elemental-hero-gaia", 2], ["elemental-hero-rampart-blaster", 1], ["gem-knight-pearl", 1], ["utopia", 1]),
		},
	},
};
