import "@duel-academy/cards";
import { board, type Board } from "@duel-academy/engine";

/**
 * Fixed reference boards for the speed targets of docs/rules-core-spec.md (legal moves >= 10x faster by step 2,
 * >= 30x by step 9). Built on today's engine to record the baseline; each rules-core step rebuilds the same positions
 * on the new core and compares.
 */
export const REFERENCE_BOARDS: Record<string, () => Board> = {
	/** Turn 1, Main Phase 1: five cards in hand, nothing on the field. */
	opening: () =>
		board({
			full: true,
			turnNumber: 1,
			phase: "main1",
			you: { hand: ["dark-magician", "celtic-guardian", "pot-of-greed", "terraforming", "mirror-force"], deck: ["kuriboh", "summoned-skull", "raigeki", "monster-reborn", "foolish-burial"] },
			rival: { hand: ["ash-blossom-joyous-spring", "effect-veiler", "kuriboh", "celtic-guardian", "raigeki"], deck: ["summoned-skull", "dark-magician"] },
		}),
	/** Mid-duel: monsters and Set cards on both sides, hand traps waiting. */
	midgame: () =>
		board({
			full: true,
			turnNumber: 5,
			you: {
				hand: ["monster-reborn", "polymerization", "summoned-skull", "infinite-impermanence"],
				monsters: ["dark-magician", "celtic-guardian", null, "giant-soldier-of-stone"],
				backrow: ["mirror-force", "solemn-strike"],
				graveyard: ["blue-eyes-white-dragon", "kuriboh"],
				deck: ["pot-of-greed", "raigeki", "foolish-burial", "terraforming"],
			},
			rival: {
				hand: ["ash-blossom-joyous-spring", "droll-lock-bird", "ghost-ogre-snow-rabbit"],
				monsters: ["blue-eyes-white-dragon", "summoned-skull"],
				backrow: ["storming-mirror-force", "infinite-impermanence"],
				deck: ["kuriboh", "dark-magician"],
			},
		}),
	/** A crowded hand: many cards to place, many zones to choose. */
	crowdedHand: () =>
		board({
			full: true,
			you: {
				hand: ["dark-magician", "celtic-guardian", "summoned-skull", "kuriboh", "pot-of-greed", "raigeki", "monster-reborn", "mirror-force", "solemn-strike", "harpies-feather-duster"],
				deck: ["blue-eyes-white-dragon", "giant-soldier-of-stone", "terraforming", "foolish-burial"],
				graveyard: ["blue-eyes-white-dragon"],
			},
			rival: { monsters: ["summoned-skull", "giant-soldier-of-stone"], backrow: ["mirror-force"], hand: ["effect-veiler"], deck: ["kuriboh"] },
		}),
};
