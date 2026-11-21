import type { CardId } from "./cards";
import type { Deck, MasterId } from "./masters";

/* Generated from the trainers' anime card lists (Yugipedia, read 2026-11-20; docs/academy-junior-masters-plan.md). */

/** A deck from [card, copies] pairs, in that order. */
export const build = (...parts: readonly (readonly [CardId, number])[]): CardId[] => parts.flatMap(([card, count]) => Array.from({ length: count }, () => card));

/**
 * Each trainer's deck. `anime`: cards the character used in the anime. `filler`: cards that are not, where the anime
 * gives too few cards the rules engine plays exactly (a card it cannot play exactly is left out, never changed).
 */
export const MASTER_DECK_PARTS: Record<MasterId, { anime: readonly (readonly [CardId, number])[]; filler: readonly (readonly [CardId, number])[]; extra: readonly (readonly [CardId, number])[] }> = {
	"rex-raptor": {
		anime: [["two-headed-king-rex", 3], ["crawling-dragon-2", 3], ["uraby", 3], ["megazowler", 3], ["sword-arm-of-dragon", 3], ["trakodon", 3], ["red-eyes-black-dragon", 2], ["serpent-night-dragon", 2], ["polymerization", 3]],
		filler: [["little-d", 3], ["lesser-dragon", 3], ["fairy-dragon", 3], ["one-eyed-shield-dragon", 2], ["raise-body-heat", 2], ["raigeki", 1], ["dark-hole", 1]],
		extra: [["bracchio-raidus", 2]],
	},
	"weevil-underwood": {
		anime: [["basic-insect", 3], ["big-insect", 3], ["flying-kamakiri-2", 3], ["gokibore", 3], ["hercules-beetle", 3], ["killer-needle", 3], ["leghul", 3], ["skull-mark-ladybug", 3], ["insect-soldiers-of-the-sky", 2], ["laser-cannon-armor", 3]],
		filler: [["giant-flea", 3], ["petit-moth", 3], ["forest", 3], ["swords-of-revealing-light", 2]],
		extra: [],
	},
	"mako-tsunami": {
		anime: [["jellyfish", 3], ["amphibian-beast", 2], ["fiend-kraken", 3], ["flying-fish", 3], ["great-white", 3], ["kairyu-shin", 3], ["serpent-night-dragon", 1], ["umi", 3], ["fortress-whale", 2], ["fortress-whales-oath", 2]],
		filler: [["7-colored-fish", 3], ["giant-red-seasnake", 3], ["crazy-fish", 2], ["fire-kraken", 2], ["bottom-dweller", 2], ["armored-starfish", 2], ["raigeki", 1]],
		extra: [],
	},
	"joey-wheeler": {
		anime: [["alligators-sword", 3], ["axe-raider", 3], ["baby-dragon", 3], ["battle-warrior", 1], ["swordsman-of-landstar", 1], ["garoozis", 2], ["red-eyes-black-dragon", 2], ["masaki", 2], ["flame-manipulator", 2], ["kojikocy", 2], ["leogun", 1], ["tiger-axe", 2], ["rude-kaiser", 1], ["hayabusa-knight", 2], ["mad-sword-beast", 2], ["jinzo", 1], ["lava-battleguard", 1], ["swamp-battleguard", 1], ["polymerization", 2], ["salamandra", 1], ["legendary-sword", 1], ["hinotama", 1], ["harpies-feather-duster", 1], ["raigeki", 1], ["monster-reborn", 1]],
		filler: [],
		extra: [["flame-swordsman", 2], ["alligators-sword-dragon", 2]],
	},
	"arkana": {
		anime: [["dark-magician", 3], ["thousand-knives", 2], ["monster-reborn", 1]],
		filler: [["aqua-madoor", 3], ["illusionist-faceless-mage", 3], ["night-bat", 3], ["moss-beetle", 3], ["pebble-crab", 3], ["bramble-ram", 3], ["thorn-fox", 2], ["book-of-secret-arts", 2], ["dark-hole", 1], ["swords-of-revealing-light", 1], ["mirror-force", 1], ["ookazi", 2], ["raigeki", 1], ["negate-attack", 2], ["spark-dash", 2], ["thunder-clap", 2]],
		extra: [],
	},
	"yami-bakura": {
		anime: [["headless-knight", 3], ["the-earl-of-demise", 3], ["doma-the-angel-of-silence", 2], ["earthbound-spirit", 3], ["mud-toad", 2], ["night-bat", 2], ["souls-of-the-forgotten", 3], ["the-gross-ghost-of-fled-dreams", 3], ["the-portraits-secret", 3], ["monster-reborn", 1], ["just-desserts", 2]],
		filler: [["feral-imp", 3], ["ryu-kishin-powered", 3], ["gil-garth", 2], ["melchid-the-four-face-beast", 2], ["ookazi", 2], ["upstart-goblin", 1]],
		extra: [],
	},
	"maximillion-pegasus": {
		anime: [["dark-rabbit", 3], ["illusionist-faceless-mage", 3], ["killer-needle", 3], ["parrot-dragon", 3], ["red-archery-girl", 3], ["ryu-ran", 3], ["thousand-eyes-idol", 3], ["toon-alligator", 3], ["monster-reborn", 1], ["shine-palace", 2]],
		filler: [["mirror-force", 1], ["magic-cylinder", 1], ["hinotama", 2], ["swords-of-revealing-light", 1], ["sakuretsu-armor", 2], ["sticky-vine", 2], ["spark-dash", 2], ["dark-hole", 1], ["upstart-goblin", 1]],
		extra: [],
	},
	"yugi-muto": {
		anime: [["dark-magician", 2], ["dark-magician-girl", 2], ["alpha-the-magnet-warrior", 3], ["beta-the-magnet-warrior", 3], ["gamma-the-magnet-warrior", 3], ["gazelle-the-king-of-mythical-beasts", 2], ["curse-of-dragon", 2], ["giant-soldier-of-stone", 3], ["moss-beetle", 2], ["queens-knight", 3], ["summoned-skull", 2], ["buster-blader", 1], ["obnoxious-celtic-guard", 2], ["swords-of-revealing-light", 1], ["thousand-knives", 1], ["monster-reborn", 1], ["polymerization", 2], ["black-luster-soldier", 1], ["black-luster-ritual", 1], ["gaia-the-fierce-knight", 1], ["kuriboh", 1]],
		filler: [["upstart-goblin", 1]],
		extra: [["gaia-the-dragon-champion", 2]],
	},
	"jaden-yuki": {
		anime: [["elemental-hero-avian", 3], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 3], ["elemental-hero-sparkman", 3], ["elemental-hero-neos", 3], ["elemental-hero-bladedge", 3], ["oscillo-hero", 3], ["beaver-warrior", 3], ["ojama-yellow", 1], ["polymerization", 3], ["fusion-sage", 2], ["monster-reborn", 1], ["the-warrior-returning-alive", 2], ["sticky-vine", 2], ["hero-barrier", 2], ["elemental-recharge", 2]],
		filler: [["upstart-goblin", 1]],
		extra: [["elemental-hero-flame-wingman", 3]],
	},
	"yusei-fudo": {
		anime: [["junk-synchron", 3], ["flamvell-guard", 3], ["unicycular", 3], ["sonic-chick", 3], ["shield-wing", 2], ["fortress-warrior", 2], ["dash-warrior", 2], ["muka-muka", 2], ["tri-horned-dragon", 1], ["yaranzo", 3]],
		filler: [["tune-warrior", 3], ["giant-soldier-of-stone", 3], ["monster-reborn", 1], ["spark-dash", 2], ["sticky-vine", 2], ["fog-snare", 2], ["negate-attack", 2], ["upstart-goblin", 1]],
		extra: [["junk-warrior", 3], ["gaia-knight", 2]],
	},
	"yami-marik": {
		anime: [["gil-garth", 3], ["melchid-the-four-face-beast", 3], ["bowganian", 3], ["legendary-fiend", 2], ["monster-reborn", 1], ["mirror-force", 2], ["malevolent-catastrophe", 2]],
		filler: [["feral-imp", 3], ["ryu-kishin-powered", 3], ["earthbound-spirit", 2], ["headless-knight", 2], ["the-earl-of-demise", 2], ["souls-of-the-forgotten", 2], ["summoned-skull", 2], ["dark-hole", 1], ["raigeki", 1], ["hinotama", 2], ["just-desserts", 2], ["ookazi", 1], ["upstart-goblin", 1]],
		extra: [],
	},
	"seto-kaiba": {
		anime: [["blue-eyes-white-dragon", 3], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 3], ["x-head-cannon", 3], ["iron-boar", 2], ["swordstalker", 2], ["gadget-soldier", 2], ["hitotsu-me-giant", 2], ["hyozanryu", 2], ["shadow-wolf", 1], ["luster-dragon-2", 2], ["rude-kaiser", 1], ["ryu-kishin-powered", 2], ["pebble-crab", 1], ["mystic-horseman", 2], ["blade-knight", 1], ["aqua-madoor", 1], ["grappler", 1], ["gyakutenno-megami", 1], ["monster-reborn", 1], ["polymerization", 2]],
		filler: [["upstart-goblin", 1], ["harpies-feather-duster", 1]],
		extra: [["blue-eyes-ultimate-dragon", 2], ["rabid-horseman", 2]],
	},
	"atem": {
		anime: [["dark-magician", 3], ["dark-magician-girl", 1], ["celtic-guardian", 2], ["gazelle-the-king-of-mythical-beasts", 1], ["curse-of-dragon", 2], ["gaia-the-fierce-knight", 2], ["summoned-skull", 2], ["beta-the-magnet-warrior", 2], ["alpha-the-magnet-warrior", 1], ["gamma-the-magnet-warrior", 1], ["kuriboh", 2], ["feral-imp", 1], ["buster-blader", 1], ["black-luster-soldier", 1], ["black-luster-ritual", 1], ["giant-soldier-of-stone", 1], ["moss-beetle", 1], ["obnoxious-celtic-guard", 1], ["monster-reborn", 1], ["swords-of-revealing-light", 1], ["dark-hole", 1], ["polymerization", 2], ["thousand-knives", 1], ["mirror-force", 2], ["magic-cylinder", 2], ["fissure", 1], ["soul-taker", 1]],
		filler: [["upstart-goblin", 1], ["harpies-feather-duster", 1]],
		extra: [["gaia-the-dragon-champion", 2]],
	},
};

export const MASTER_DECKS = Object.fromEntries(Object.entries(MASTER_DECK_PARTS).map(([master, parts]) => [master, { main: build(...parts.anime, ...parts.filler), extra: build(...parts.extra) }])) as unknown as Record<MasterId, Deck>;
