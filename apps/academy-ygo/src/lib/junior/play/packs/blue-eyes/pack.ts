import { build } from "../../master-decks";
import type { Pack } from "..";

/**
 * Blue-Eyes, meta-lite. Sage with Eyes of Blue finds The White Stone of Legend or Effect Veiler; Sage's other effect
 * and The White Stone of Legend bring Blue-Eyes White Dragon out early. Today's hand traps answer the opponent:
 * Ash Blossom, Effect Veiler, Ghost Ogre & Snow Rabbit, Droll & Lock Bird, Infinite Impermanence, Solemn Strike.
 */
export const BLUE_EYES: Pack = {
	archetype: "Blue-Eyes",
	engine: ["sage-with-eyes-of-blue", "the-white-stone-of-legend", "blue-eyes-white-dragon", "blue-eyes-alternative-white-dragon"],
	deck: {
		main: build(
			["sage-with-eyes-of-blue", 3],
			["the-white-stone-of-legend", 3],
			["blue-eyes-white-dragon", 3],
			["blue-eyes-alternative-white-dragon", 2],
			["vorse-raider", 3],
			["luster-dragon-2", 2],
			["effect-veiler", 3],
			["ash-blossom-joyous-spring", 3],
			["ghost-ogre-snow-rabbit", 2],
			["droll-lock-bird", 1],
			["one-for-one", 1],
			["foolish-burial", 1],
			["trade-in", 2],
			["silvers-cry", 1],
			["ancient-rules", 1],
			["monster-reborn", 1],
			["dark-hole", 1],
			["raigeki", 1],
			["infinite-impermanence", 3],
			["solemn-strike", 2],
			["magic-cylinder", 1],
		),
		extra: build(["blue-eyes-spirit-dragon", 3], ["blue-eyes-twin-burst-dragon", 2], ["blue-eyes-ultimate-dragon", 2], ["gem-knight-pearl", 2], ["utopia", 1], ["lanphorhynchus", 1], ["gaia-saber-the-lightning-shadow", 2], ["link-spider", 1]),
	},
	/* An expert trainer that goes for the Life Points, as the trainers' expert tier plays (masters.ts). */
	persona: { aggression: 1.3, skill: 1, caution: 1, answers: 1, plans: 2 },
};
