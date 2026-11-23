import { type Duel } from "../src";
import { position, REAL_CARDS } from "../test/rules/fixtures";

/**
 * Step 9's midgame board for the bot: the core's real cards (Ash Blossom, Infinite Impermanence, Solemn Strike, Mystical Space
 * Typhoon, Terraforming, Pot of Greed, Shrink) with monsters, Set cards and hand traps on both sides; your Main Phase 1 of turn 3.
 */
export const HAND_TRAP_MIDGAME = (): Duel =>
	position({
		defs: REAL_CARDS,
		you: {
			hand: ["terraforming", "pot-of-greed", "normal-4", "mystical-space-typhoon", "ash-blossom-joyous-spring"],
			monsters: ["normal-6", "effect-4"],
			set: ["solemn-strike", "shrink"],
			graveyard: ["normal-4-b"],
			deck: ["umi", "other-field", "normal-4", "normal-4-b", "infinite-impermanence", "pot-of-greed", "effect-4", "normal-6"],
		},
		rival: {
			hand: ["ash-blossom-joyous-spring", "infinite-impermanence", "normal-4", "droll-lock-bird"],
			monsters: ["normal-6", "effect-4"],
			set: ["solemn-judgment", "mystical-space-typhoon"],
			facedown: ["normal-4-b"],
			deck: ["umi", "normal-4", "pot-of-greed", "terraforming", "effect-4", "normal-6", "shrink", "normal-4-b"],
		},
	});
