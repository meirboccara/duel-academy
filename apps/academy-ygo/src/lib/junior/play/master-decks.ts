import type { CardId } from "./cards";
import type { Deck, MasterId } from "./masters";

/* Generated from the trainers' card lists (anime cards from Yugipedia, read 2026-11-20; docs/academy-junior-masters-plan.md). */

/** A deck from [card, copies] pairs, in that order. */
export const build = (...parts: readonly (readonly [CardId, number])[]): CardId[] => parts.flatMap(([card, count]) => Array.from({ length: count }, () => card));

/**
 * Each trainer's deck. `anime`: cards the character used in the anime. `filler`: cards that are not (or not checked),
 * among them newer and stronger cards, where the anime gives too few cards the rules engine plays exactly (a card it
 * cannot play exactly is left out, never changed). Every deck follows the TCG Forbidden & Limited List.
 */
export const MASTER_DECK_PARTS: Record<MasterId, { anime: readonly (readonly [CardId, number])[]; filler: readonly (readonly [CardId, number])[]; extra: readonly (readonly [CardId, number])[] }> = {
	"rex-raptor": {
		anime: [["two-headed-king-rex", 3], ["crawling-dragon-2", 3], ["uraby", 3], ["megazowler", 3], ["sword-arm-of-dragon", 3], ["trakodon", 3], ["red-eyes-black-dragon", 2], ["serpent-night-dragon", 2], ["polymerization", 3]],
		filler: [["little-d", 3], ["lesser-dragon", 3], ["fairy-dragon", 3], ["raise-body-heat", 2], ["raigeki", 1], ["dark-hole", 1], ["trap-hole", 2]],
		extra: [["bracchio-raidus", 2]],
	},
	"weevil-underwood": {
		anime: [["basic-insect", 3], ["big-insect", 3], ["flying-kamakiri-2", 3], ["gokibore", 3], ["hercules-beetle", 3], ["killer-needle", 3], ["leghul", 3], ["skull-mark-ladybug", 3], ["insect-soldiers-of-the-sky", 2], ["laser-cannon-armor", 3]],
		filler: [["giant-flea", 3], ["forest", 3], ["swords-of-revealing-light", 2], ["trap-hole", 3]],
		extra: [],
	},
	"mako-tsunami": {
		anime: [["jellyfish", 3], ["amphibian-beast", 2], ["fiend-kraken", 3], ["flying-fish", 3], ["great-white", 3], ["kairyu-shin", 3], ["serpent-night-dragon", 1], ["umi", 3], ["fortress-whale", 2], ["fortress-whales-oath", 2]],
		filler: [["7-colored-fish", 3], ["giant-red-seasnake", 3], ["crazy-fish", 2], ["fire-kraken", 2], ["bottom-dweller", 1], ["raigeki", 1], ["trap-hole", 2], ["torrential-tribute", 1]],
		extra: [],
	},
	"joey-wheeler": {
		anime: [["alligators-sword", 3], ["axe-raider", 3], ["baby-dragon", 3], ["garoozis", 2], ["red-eyes-black-dragon", 2], ["masaki", 2], ["flame-manipulator", 2], ["hayabusa-knight", 2], ["mad-sword-beast", 1], ["jinzo", 1], ["lava-battleguard", 1], ["swamp-battleguard", 1], ["time-wizard", 2], ["rocket-warrior", 2], ["polymerization", 2], ["salamandra", 1], ["legendary-sword", 1], ["harpies-feather-duster", 1], ["raigeki", 1], ["monster-reborn", 1]],
		filler: [["dark-time-wizard", 2], ["meteor-dragon", 1], ["inferno-fire-blast", 1], ["trap-hole", 1], ["swift-scarecrow", 1]],
		extra: [["flame-swordsman", 2], ["alligators-sword-dragon", 2], ["thousand-dragon", 2], ["meteor-black-dragon", 1]],
	},
	"arkana": {
		anime: [["dark-magician", 3], ["thousand-knives", 2], ["monster-reborn", 1], ["dark-magic-curtain", 3]],
		filler: [["dark-magical-curtain", 2], ["dark-magic-attack", 1], ["magicians-valkyria", 1], ["illusionist-faceless-mage", 3], ["night-bat", 3], ["moss-beetle", 3], ["pebble-crab", 1], ["book-of-secret-arts", 2], ["dark-hole", 1], ["swords-of-revealing-light", 1], ["mirror-force", 1], ["negate-attack", 2], ["spark-dash", 2], ["thunder-clap", 2], ["book-of-moon", 1], ["magicians-rod", 3], ["trap-hole", 1], ["bottomless-trap-hole", 1]],
		extra: [],
	},
	"yami-bakura": {
		anime: [["headless-knight", 3], ["the-earl-of-demise", 3], ["doma-the-angel-of-silence", 2], ["earthbound-spirit", 3], ["mud-toad", 1], ["night-bat", 2], ["souls-of-the-forgotten", 3], ["the-gross-ghost-of-fled-dreams", 3], ["the-portraits-secret", 3], ["monster-reborn", 1], ["just-desserts", 2]],
		filler: [["upstart-goblin", 1], ["ryu-kishin-powered", 3], ["gil-garth", 2], ["melchid-the-four-face-beast", 2], ["widespread-ruin", 2], ["book-of-moon", 1], ["trap-hole", 2], ["dd-crow", 1]],
		extra: [],
	},
	"maximillion-pegasus": {
		anime: [["dark-rabbit", 3], ["illusionist-faceless-mage", 3], ["killer-needle", 1], ["parrot-dragon", 3], ["red-archery-girl", 3], ["ryu-ran", 3], ["thousand-eyes-idol", 3], ["toon-alligator", 3], ["monster-reborn", 1], ["shine-palace", 2]],
		filler: [["upstart-goblin", 1], ["mirror-force", 1], ["magic-cylinder", 1], ["swords-of-revealing-light", 1], ["storming-mirror-force", 2], ["book-of-moon", 2], ["forbidden-chalice", 2], ["dark-hole", 1], ["effect-veiler", 2], ["bottomless-trap-hole", 1], ["torrential-tribute", 1]],
		extra: [],
	},
	"yugi-muto": {
		anime: [["dark-magician", 2], ["dark-magician-girl", 2], ["alpha-the-magnet-warrior", 2], ["beta-the-magnet-warrior", 2], ["gamma-the-magnet-warrior", 2], ["curse-of-dragon", 2], ["queens-knight", 3], ["summoned-skull", 2], ["buster-blader", 1], ["obnoxious-celtic-guard", 1], ["swords-of-revealing-light", 1], ["thousand-knives", 1], ["monster-reborn", 1], ["polymerization", 2], ["black-luster-soldier", 1], ["black-luster-ritual", 1], ["gaia-the-fierce-knight", 1], ["kuriboh", 1]],
		filler: [["upstart-goblin", 1], ["sages-stone", 1], ["dark-magical-curtain", 2], ["dark-magic-attack", 1], ["dark-burning-attack", 1], ["magicians-valkyria", 1], ["magicians-rod", 2], ["ash-blossom-joyous-spring", 1], ["effect-veiler", 1], ["bottomless-trap-hole", 1]],
		extra: [["gaia-the-dragon-champion", 2], ["dark-paladin", 1], ["dark-magician-the-dragon-knight", 1], ["dark-magician-girl-the-dragon-knight", 1]],
	},
	"jaden-yuki": {
		anime: [["elemental-hero-avian", 3], ["elemental-hero-burstinatrix", 3], ["elemental-hero-clayman", 3], ["elemental-hero-sparkman", 3], ["elemental-hero-neos", 2], ["elemental-hero-bladedge", 1], ["polymerization", 3], ["fusion-sage", 2], ["monster-reborn", 1], ["the-warrior-returning-alive", 2], ["sticky-vine", 2], ["hero-barrier", 2]],
		filler: [["upstart-goblin", 1], ["forbidden-chalice", 1], ["smashing-ground", 1], ["storming-mirror-force", 1], ["dark-hole", 1], ["elemental-hero-blazeman", 2], ["a-hero-lives", 2], ["e-emergency-call", 2], ["reinforcement-of-the-army", 1], ["ash-blossom-joyous-spring", 1]],
		extra: [["elemental-hero-flame-wingman", 3], ["elemental-hero-thunder-giant", 2], ["elemental-hero-shining-flare-wingman", 1], ["elemental-hero-rampart-blaster", 1], ["elemental-hero-great-tornado", 1], ["elemental-hero-nova-master", 1], ["elemental-hero-gaia", 1]],
	},
	"yusei-fudo": {
		anime: [["junk-synchron", 3], ["flamvell-guard", 3], ["unicycular", 3], ["sonic-chick", 3], ["shield-wing", 2], ["fortress-warrior", 2], ["dash-warrior", 2], ["tri-horned-dragon", 1]],
		filler: [["tune-warrior", 3], ["giant-soldier-of-stone", 3], ["monster-reborn", 1], ["upstart-goblin", 1], ["spark-dash", 2], ["sticky-vine", 2], ["book-of-moon", 1], ["smashing-ground", 1], ["negate-attack", 2], ["effect-veiler", 2], ["swift-scarecrow", 1], ["bottomless-trap-hole", 1], ["reinforcement-of-the-army", 1]],
		extra: [["junk-warrior", 3], ["gaia-knight", 2]],
	},
	"yami-marik": {
		anime: [["gil-garth", 3], ["melchid-the-four-face-beast", 3], ["bowganian", 3], ["legendary-fiend", 2], ["monster-reborn", 1], ["mirror-force", 2], ["malevolent-catastrophe", 2]],
		filler: [["upstart-goblin", 1], ["ryu-kishin-powered", 3], ["the-earl-of-demise", 2], ["summoned-skull", 2], ["dark-hole", 1], ["raigeki", 1], ["just-desserts", 2], ["widespread-ruin", 2], ["storming-mirror-force", 1], ["book-of-moon", 2], ["forbidden-chalice", 1], ["ash-blossom-joyous-spring", 2], ["effect-veiler", 1], ["bottomless-trap-hole", 2], ["torrential-tribute", 1]],
		extra: [],
	},
	"seto-kaiba": {
		anime: [["blue-eyes-white-dragon", 3], ["blue-eyes-alternative-white-dragon", 2], ["vorse-raider", 3], ["la-jinn-the-mystical-genie-of-the-lamp", 3], ["x-head-cannon", 2], ["luster-dragon-2", 2], ["monster-reborn", 1], ["polymerization", 2], ["shrink", 2], ["enemy-controller", 2], ["burst-stream-of-destruction", 1], ["silvers-cry", 1]],
		filler: [["upstart-goblin", 1], ["harpies-feather-duster", 1], ["ancient-rules", 2], ["trade-in", 2], ["book-of-moon", 1], ["mirror-force", 1], ["ash-blossom-joyous-spring", 2], ["effect-veiler", 2], ["bottomless-trap-hole", 1], ["torrential-tribute", 1], ["flamvell-guard", 2]],
		extra: [["blue-eyes-ultimate-dragon", 2], ["blue-eyes-twin-burst-dragon", 2], ["blue-eyes-spirit-dragon", 2]],
	},
	"atem": {
		anime: [["dark-magician", 3], ["dark-magician-girl", 2], ["curse-of-dragon", 1], ["gaia-the-fierce-knight", 1], ["summoned-skull", 2], ["kuriboh", 1], ["buster-blader", 1], ["black-luster-soldier", 1], ["black-luster-ritual", 1], ["monster-reborn", 1], ["swords-of-revealing-light", 1], ["dark-hole", 1], ["polymerization", 2], ["thousand-knives", 1], ["mirror-force", 2], ["magic-cylinder", 2]],
		filler: [["upstart-goblin", 1], ["harpies-feather-duster", 1], ["dark-magical-curtain", 2], ["dark-magic-attack", 1], ["sages-stone", 1], ["dark-burning-attack", 1], ["magicians-valkyria", 1], ["book-of-moon", 1], ["magicians-rod", 3], ["ash-blossom-joyous-spring", 2], ["effect-veiler", 1], ["bottomless-trap-hole", 1], ["torrential-tribute", 1]],
		extra: [["gaia-the-dragon-champion", 1], ["dark-paladin", 2], ["dark-magician-the-dragon-knight", 1], ["dark-magician-girl-the-dragon-knight", 1]],
	},
};

export const MASTER_DECKS = Object.fromEntries(Object.entries(MASTER_DECK_PARTS).map(([master, parts]) => [master, { main: build(...parts.anime, ...parts.filler), extra: build(...parts.extra) }])) as unknown as Record<MasterId, Deck>;
