import { bench, describe } from "vitest";
import { atk, legalActions } from "../src";
import { continuousCards } from "../test/rules/continuous-fixtures";
import { play, position, REAL_CARDS } from "../test/rules/fixtures";

/**
 * Continuous effects (step 6): queries scan the field when a card with a continuous record is in the defs. A board with Skill Drain
 * and Muka Muka face-up (every query reads both), and the rival's window with Droll & Lock Bird in the hand, then the lock applying.
 * Run with `pnpm --filter @duel-academy/rules bench`; numbers in BASELINE.md.
 */
const defs = { ...REAL_CARDS, ...continuousCards() };
const drained = position({
	defs,
	you: { hand: ["shrink", "small", "small"], monsters: ["muka-muka", "ping", "big"] },
	rival: { faceupSpells: ["skill-drain"], monsters: ["muka-muka-rival", "huge"] },
});
const muka = Object.values(drained.cards).find((card) => card.code === "muka-muka")!.id;
const searchStart = position({ defs, turn: "rival", you: { hand: ["droll-lock-bird"] }, rival: { hand: ["terraforming", "pot-of-greed", "two-part"], deck: ["umi", "celtic-guardian", "celtic-guardian"] } });
const drollWindow = play(searchStart, "activate terraforming");
const lockedTurn = play(drollWindow, "activate droll-lock-bird");

describe("continuous effects, rules core", () => {
	bench("legalActions: Skill Drain and two Muka Mukas on the field", () => {
		legalActions(drained);
	});
	bench("atk: Muka Muka under Skill Drain (the field is read)", () => {
		atk(drained, muka);
	});
	bench("legalActions: your window with Droll & Lock Bird after the rival's search", () => {
		legalActions(drollWindow);
	});
	bench("legalActions: the rival's turn under Droll's lock (Pot of Greed not offered)", () => {
		legalActions(lockedTurn);
	});
});
