import { bench, describe } from "vitest";
import { legalActions } from "../src";
import { play, position, REAL_CARDS } from "../test/rules/fixtures";

/**
 * Effect-record positions (step 4): cost dry runs in the listing, a choice at resolution, once-per-turn checks. Run with
 * `pnpm --filter @duel-academy/rules bench`; numbers in BASELINE.md.
 */
const handTraps = position({
	defs: REAL_CARDS,
	you: { hand: ["terraforming", "mystical-space-typhoon", "pot-of-greed"], deck: ["umi", "other-field", "celtic-guardian", "normal-4"], monsters: ["link-spider"] },
	rival: { hand: ["ash-blossom-joyous-spring", "ash-blossom-joyous-spring", "dd-crow"], graveyard: ["celtic-guardian", "normal-4"], set: ["umi"] },
});
const searching = play(handTraps, "activate terraforming");

describe("effect records, rules core", () => {
	bench("legalActions: 3 hand cards, a Link Spider, 3 rival hand traps with costs and targets", () => {
		legalActions(handTraps);
	});
	bench("legalActions: the rival's window with Ash Blossom and D.D. Crow in hand", () => {
		legalActions(searching);
	});
	bench("Terraforming, 2 Field Spells: activate, both pass, the player chooses", () => {
		play(handTraps, "activate terraforming", "pass", "pass", "choose umi");
	});
});
