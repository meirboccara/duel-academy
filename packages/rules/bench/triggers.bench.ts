import { bench, describe } from "vitest";
import { legalActions } from "../src";
import { play, position, triggerCards } from "../test/rules/fixtures";

/**
 * Trigger-heavy positions (step 3): every card has a trigger effect, so each move scans them and a sweep collects many
 * triggers into one chain. Run with `pnpm --filter @duel-academy/rules bench`; numbers in BASELINE.md.
 */
const defs = triggerCards();
const crowded = (hand: string[]) =>
	position({
		defs,
		you: { hand, monsters: ["forced-a", "forced-b", "forced-c", "if-a", "if-b", "when-a", "when-b", "standby-forced", "standby-optional", "set-watcher"] },
		rival: { monsters: ["forced-a", "forced-b", "forced-c", "if-a", "if-b", "when-a", "when-b", "standby-forced", "standby-optional", "set-watcher"] },
	});

describe("trigger collection, rules core", () => {
	const sweep = crowded(["sweep"]);
	bench("sweep: 20 monsters sent, 6 mandatory triggers chained, optional ones asked", () => {
		play(sweep, "activate sweep");
	});
	const asking = play(sweep, "activate sweep");
	bench("legalActions while the optional triggers are chosen", () => {
		legalActions(asking);
	});
	const quiet = position({ defs, you: { hand: ["spell"], monsters: ["forced-a", "if-a", "when-a", "standby-forced"] } });
	bench("a Spell with 4 trigger cards on the field that never trigger", () => {
		play(quiet, "activate spell");
	});
});
