import { describe, expect, it } from "vitest";
import { type CardDef, type Duel, evaluate, interruptions, type Side } from "../../src";
import { play, position, REAL_CARDS, type SideSpec } from "../rules/fixtures";

const DEFS: Record<string, CardDef> = {
	...REAL_CARDS,
	"big": { code: "big", kind: "monster", facts: { level: 4, atk: 3000, def: 0 } },
	// A monster with a Quick Effect on the field, once per turn by name.
	"field-quick": { code: "field-quick", kind: "monster", facts: { level: 4, atk: 0, def: 0 }, effects: [{ type: "quick", range: "field", once: { scope: "name" }, operation: (duel) => duel }] },
};
const at = (you: SideSpec, rival: SideSpec = {}): Duel => position({ defs: DEFS, you, rival });
const score = (duel: Duel, side: Side = "you") => evaluate(duel, side);

describe("evaluate: a score from one side's view", () => {
	it("is 0 on an even board, and the same score with the sign turned for the other side", () => {
		expect(score(at({ hand: ["normal-4"] }, { hand: ["normal-4"] }))).toBe(0);
		const duel = at({ hand: ["normal-4", "normal-4-b"], monsters: ["big"] }, { hand: ["normal-4"] });
		expect(score(duel, "you")).toBeGreaterThan(0);
		expect(score(duel, "rival")).toBe(-score(duel, "you"));
	});

	it("counts Life Points: 1000 LP is 10 points", () => {
		const duel = at({});
		expect(score({ ...duel, lp: { you: 8000, rival: 7000 } })).toBe(10);
	});

	it("counts the board: a 3000 ATK monster is worth 18 (3 for the card, 15 for its ATK)", () => {
		expect(score(at({ monsters: ["big"] }))).toBe(18);
	});

	it("counts the cards in hand: 3 each", () => {
		expect(score(at({ hand: ["normal-4", "normal-4"] }))).toBe(6);
	});

	it("counts a won or lost Duel above everything", () => {
		const duel = at({ monsters: ["big"] });
		expect(score({ ...duel, winner: "rival" })).toBe(-1_000_000);
		expect(score({ ...duel, winner: "you" })).toBe(1_000_000);
	});

	it("counts interruptions: a hand trap in hand, a Set negator, an untapped Quick Effect; a spent one is not counted", () => {
		expect(interruptions(at({ hand: ["ash-blossom-joyous-spring"] }), "you", "you")).toBe(1);
		expect(interruptions(at({ hand: ["normal-4"] }), "you", "you")).toBe(0);
		expect(interruptions(at({ set: ["solemn-strike"] }), "you", "you")).toBe(1);
		expect(interruptions(at({ monsters: ["field-quick"] }), "you", "you")).toBe(1);
		const spent = play(at({ monsters: ["field-quick"] }), "activate field-quick");
		expect(interruptions(spent, "you", "you")).toBe(0);
		// A hand trap is worth its card and its interruption.
		expect(score(at({ hand: ["ash-blossom-joyous-spring"] })) - score(at({ hand: ["normal-4"] }))).toBe(2);
	});

	it("counts the opponent's Set card as half an interruption: the viewer does not know what it is", () => {
		expect(interruptions(at({}, { set: ["solemn-strike"] }), "rival", "you")).toBe(0.5);
		expect(interruptions(at({}, { set: ["normal-4"] }), "rival", "you")).toBe(0.5);
	});

	it("reads nothing the side cannot see: the opponent's hand, the Decks, the opponent's Set cards", () => {
		const a = at({ hand: ["normal-4"], deck: ["umi"] }, { hand: ["ash-blossom-joyous-spring"], set: ["solemn-strike"], deck: ["normal-4"] });
		const b = at({ hand: ["normal-4"], deck: ["normal-6"] }, { hand: ["normal-4"], set: ["terraforming"], deck: ["big"] });
		expect(score(a)).toBe(score(b));
	});
});

describe("review fixes (step 9)", () => {
	it("does not count a Set card whose once-per-turn activation is spent; still counts one Set this turn (it guards the opponent's turn)", () => {
		expect(interruptions(at({ setThisTurn: ["solemn-strike"] }), "you", "you")).toBe(1);
		const onceDefs: Record<string, CardDef> = { ...DEFS, "once-trap": { code: "once-trap", kind: "trap", effects: [{ type: "activation", once: { scope: "activation" }, operation: (duel) => duel }] } };
		const duel = position({ defs: onceDefs, you: { set: ["once-trap", "once-trap"] } });
		expect(interruptions(duel, "you", "you")).toBe(2);
		const spent: Duel = { ...duel, used: { ...duel.used, turn: ["activation:you:once-trap:0"] } };
		expect(interruptions(spent, "you", "you")).toBe(0);
	});
});
