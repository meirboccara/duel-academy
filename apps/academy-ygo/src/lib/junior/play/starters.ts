import type { CardId } from "@duel-academy/engine";
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
	["torrential-tribute", 1],
] as const;

/**
 * The edition of the starter Decks. Raise it whenever a starter's list changes: a child whose saved Deck came from an
 * older edition is offered the new one (deck-record.ts `starterUpdate`), and may keep their own.
 * 1: the Decks before 2026-11-23 (their lists changed a few times). 2: today's meta, with hand traps and 15-card Extra Decks (2026-11-23).
 */
export const STARTER_EDITION = 2;
/**
 * The cards of every earlier list of each starter (edition 1 changed several times before editions were counted, from
 * the first Decks to 2026-11-22): still the child's, so a Deck built from any of them stays valid.
 */
export const PAST_STARTER_CARDS: Record<StarterId, readonly CardId[]> = {
	warrior: ["dark-magician", "dark-magician-girl", "magicians-rod", "magicians-valkyria", "buster-blader", "curse-of-dragon", "gaia-the-fierce-knight", "summoned-skull", "red-eyes-black-dragon", "tune-warrior", "ash-blossom-joyous-spring", "effect-veiler", "polymerization", "dark-magical-curtain", "sages-stone", "dark-magic-attack", "thousand-knives", "monster-reborn", "dark-hole", "swords-of-revealing-light", "spark-dash", "magic-cylinder", "negate-attack", "dark-paladin", "dark-magician-the-dragon-knight", "dark-magician-girl-the-dragon-knight", "gaia-the-dragon-champion", "black-skull-dragon", "gaia-dragon-the-thunder-charger", "gaia-knight", "lanphorhynchus", "mirror-force", "bottomless-trap-hole", "trap-hole", "torrential-tribute", "sakuretsu-armor", "celtic-guardian", "giant-soldier-of-stone", "beta-the-magnet-warrior", "gem-knight-pearl", "utopia", "sticky-vine", "upstart-goblin", "queens-knight", "gamma-the-magnet-warrior", "flame-manipulator", "masaki", "pot-of-greed", "flame-swordsman", "gazelle-the-king-of-mythical-beasts", "alpha-the-magnet-warrior", "moss-beetle", "thunder-clap", "fog-snare"],
	dragon: ["blue-eyes-white-dragon", "blue-eyes-alternative-white-dragon", "flamvell-guard", "effect-veiler", "ash-blossom-joyous-spring", "battle-fader", "vorse-raider", "la-jinn-the-mystical-genie-of-the-lamp", "x-head-cannon", "luster-dragon-2", "polymerization", "ancient-rules", "trade-in", "burst-stream-of-destruction", "silvers-cry", "monster-reborn", "raigeki", "dark-hole", "spark-dash", "thunder-clap", "negate-attack", "magic-cylinder", "blue-eyes-ultimate-dragon", "blue-eyes-twin-burst-dragon", "blue-eyes-spirit-dragon", "gem-knight-pearl", "utopia", "lanphorhynchus", "mirror-force", "bottomless-trap-hole", "trap-hole", "torrential-tribute", "sakuretsu-armor", "tune-warrior", "gaia-knight", "sticky-vine", "lesser-dragon", "mountain", "upstart-goblin", "fog-snare", "fairy-dragon", "curse-of-dragon", "red-eyes-black-dragon", "baby-dragon", "pot-of-greed", "serpent-night-dragon", "hyozanryu"],
	hero: ["elemental-hero-avian", "elemental-hero-burstinatrix", "elemental-hero-clayman", "elemental-hero-sparkman", "elemental-hero-blazeman", "elemental-hero-bladedge", "elemental-hero-neos", "ash-blossom-joyous-spring", "effect-veiler", "polymerization", "a-hero-lives", "e-emergency-call", "reinforcement-of-the-army", "fusion-sage", "monster-reborn", "dark-hole", "raigeki", "the-warrior-returning-alive", "forbidden-chalice", "book-of-moon", "hero-barrier", "magic-cylinder", "elemental-hero-flame-wingman", "elemental-hero-shining-flare-wingman", "elemental-hero-thunder-giant", "elemental-hero-great-tornado", "elemental-hero-nova-master", "elemental-hero-gaia", "elemental-hero-rampart-blaster", "gem-knight-pearl", "utopia", "mirror-force", "bottomless-trap-hole", "trap-hole", "torrential-tribute", "sakuretsu-armor", "tune-warrior", "ancient-rules", "smashing-ground", "spark-dash", "thunder-clap", "swords-of-revealing-light", "lanphorhynchus", "sticky-vine", "upstart-goblin", "negate-attack", "beaver-warrior", "pot-of-greed", "elemental-recharge", "oscillo-hero", "fog-snare"],
};

export const STARTERS: Record<StarterId, Starter> = {
	/* Dark Magician: Magician's Rod finds the Curtain; Dark Paladin (with Buster Blader), the two Dragon Knights, Black Skull Dragon, a Rank 7. */
	warrior: {
		cover: "dark-magician",
		deck: {
			main: build(["dark-magician", 3], ["dark-magician-girl", 2], ["magicians-rod", 3], ["magicians-valkyria", 1], ["buster-blader", 2], ["curse-of-dragon", 1], ["gaia-the-fierce-knight", 1], ["summoned-skull", 1], ["red-eyes-black-dragon", 1], ["tune-warrior", 2], ["ash-blossom-joyous-spring", 2], ["effect-veiler", 1], ["ghost-ogre-snow-rabbit", 2], ["polymerization", 3], ["dark-magical-curtain", 2], ["sages-stone", 1], ["dark-magic-attack", 1], ["thousand-knives", 2], ["monster-reborn", 1], ["dark-hole", 1], ["swords-of-revealing-light", 1], ["magic-cylinder", 1], ["negate-attack", 1], ...TRAPS, ["infinite-impermanence", 1]),
			extra: build(["dark-paladin", 3], ["dark-magician-the-dragon-knight", 2], ["dark-magician-girl-the-dragon-knight", 2], ["gaia-the-dragon-champion", 1], ["black-skull-dragon", 1], ["gaia-dragon-the-thunder-charger", 1], ["gaia-knight", 2], ["scrap-archfiend", 1], ["lanphorhynchus", 1], ["gaia-saber-the-lightning-shadow", 1]),
		},
	},
	/* Blue-Eyes White Dragon: Blue-Eyes Ultimate Dragon, Twin Burst Dragon, Spirit Dragon (with Sage with Eyes of Blue, The White Stone of Legend, Protector with Eyes of Blue or Effect Veiler, Level 1 Tuners). */
	dragon: {
		cover: "blue-eyes-white-dragon",
		deck: {
			main: build(["blue-eyes-white-dragon", 3], ["blue-eyes-alternative-white-dragon", 2], ["sage-with-eyes-of-blue", 3], ["the-white-stone-of-legend", 2], ["protector-with-eyes-of-blue", 1], ["effect-veiler", 2], ["ash-blossom-joyous-spring", 2], ["ghost-ogre-snow-rabbit", 1], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 2], ["luster-dragon-2", 2], ["polymerization", 2], ["ancient-rules", 1], ["trade-in", 2], ["burst-stream-of-destruction", 1], ["silvers-cry", 1], ["monster-reborn", 1], ["raigeki", 1], ["dark-hole", 1], ["negate-attack", 1], ["magic-cylinder", 1], ...TRAPS, ["trap-hole", 1], ["sakuretsu-armor", 1]),
			extra: build(["blue-eyes-ultimate-dragon", 2], ["blue-eyes-twin-burst-dragon", 2], ["blue-eyes-spirit-dragon", 3], ["gem-knight-pearl", 2], ["utopia", 1], ["gagagigo-the-risen", 1], ["scrap-archfiend", 1], ["lanphorhynchus", 1], ["gaia-saber-the-lightning-shadow", 1], ["traffic-ghost", 1]),
		},
	},
	/* Elemental HEROes: A Hero Lives and Blazeman bring the Fusion together; Flame Wingman, Shining Flare Wingman, Thunder Giant, Great Tornado, Nova Master, Gaia, Rampart Blaster. */
	hero: {
		cover: "elemental-hero-flame-wingman",
		deck: {
			main: build(["elemental-hero-avian", 2], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 2], ["elemental-hero-sparkman", 3], ["elemental-hero-blazeman", 3], ["elemental-hero-bladedge", 1], ["elemental-hero-neos", 1], ["elemental-hero-shadow-mist", 3], ["ash-blossom-joyous-spring", 2], ["ghost-ogre-snow-rabbit", 2], ["effect-veiler", 2], ["polymerization", 3], ["a-hero-lives", 2], ["e-emergency-call", 2], ["reinforcement-of-the-army", 1], ["fusion-sage", 1], ["monster-reborn", 1], ["dark-hole", 1], ["raigeki", 1], ["the-warrior-returning-alive", 1], ...TRAPS),
			extra: build(["elemental-hero-flame-wingman", 3], ["elemental-hero-shining-flare-wingman", 1], ["elemental-hero-thunder-giant", 2], ["elemental-hero-great-tornado", 2], ["elemental-hero-nova-master", 2], ["elemental-hero-gaia", 2], ["elemental-hero-rampart-blaster", 1], ["gem-knight-pearl", 1], ["scrap-archfiend", 1]),
		},
	},
};
