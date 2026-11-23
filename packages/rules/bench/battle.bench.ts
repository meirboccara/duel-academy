import { bench, describe } from "vitest";
import { legalActions } from "../src";
import { battleCards } from "../test/rules/battle-fixtures";
import { play, position } from "../test/rules/fixtures";

/**
 * Battle (step 6b): the Battle Step with three attackers and three targets, and a whole attack through the Damage Step (ATK read
 * at damage calculation, destruction at the end). Run with `pnpm --filter @duel-academy/rules bench`; numbers in BASELINE.md.
 */
const defs = battleCards();
const battleStep = position({ defs, phase: "battle", you: { monsters: ["big", "huge", "even"] }, rival: { monsters: ["small", "big", "even"], set: ["shrink"] } });
const plain = position({ defs, phase: "battle", you: { monsters: ["big"] }, rival: { monsters: ["small"] } });

describe("battle, rules core", () => {
	bench("legalActions: Battle Step, 3 attackers x 3 targets, a Set Shrink on the other side", () => {
		legalActions(battleStep);
	});
	bench("one attack, declaration to the end of the Damage Step (nobody responds)", () => {
		play(plain, "attack big > small");
	});
});
