import { bench, describe } from "vitest";
import { CARD_DEFS, legalActions } from "../src";
import { negationCards } from "../test/rules/negation-fixtures";
import { play, position } from "../test/rules/fixtures";

/**
 * Negation positions (step 5): the window of a Summon with the rival holding Set Counter Traps and Infinite Impermanence in
 * the hand, and a negated monster on the field. Run with `pnpm --filter @duel-academy/rules bench`; numbers in BASELINE.md.
 */
const defs = { ...CARD_DEFS, ...negationCards() };
const window = play(
	position({ defs, you: { hand: ["normal-4", "cyber"], monsters: ["ignition"] }, rival: { hand: ["infinite-impermanence"], set: ["solemn-judgment", "solemn-strike", "solemn-judgment"], monsters: ["effect-b"] } }),
	"summon normal-4",
);
const negated = play(position({ defs, you: { monsters: ["ignition", "bell"] }, rival: { set: ["infinite-impermanence"] } }), "activate ignition", "activate infinite-impermanence > ignition");

describe("negation, rules core", () => {
	bench("legalActions: the rival's window against a Summon (3 Set Counter Traps, Impermanence in hand)", () => {
		legalActions(window);
	});
	bench("legalActions: your turn with a negated monster on the field", () => {
		legalActions(negated);
	});
	bench("Normal Summon negated by Solemn Judgment, the whole sequence", () => {
		play(window, "activate solemn-judgment");
	});
});
