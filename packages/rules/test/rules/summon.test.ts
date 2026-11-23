import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { negationCards } from "./negation-fixtures";
import { codes, offered, play, position } from "./fixtures";

/** Step 5: the Summon as a moment of its own, only enough to test negating it (Tributes, Extra Deck procedures and Summons by effect are step 8). */
describe("a Normal Summon", () => {
	it(`${cites("rules", "normal-summon-is-an-action")} is offered in your Main Phase with the game state open and starts no chain`, () => {
		const log: string[] = [];
		const start = position({ defs: negationCards(log), you: { hand: ["normal-4", "normal-4"] }, rival: { monsters: ["summon-watcher"] } });
		expect(offered(start)).toEqual(["pass", "set normal-4", "set normal-4", "summon normal-4", "summon normal-4"]);
		const done = play(start, "summon normal-4");
		expect(codes(done, "you", "monster")).toEqual(["normal-4"]);
		// The Summon raises `summoned`, so a "when Summoned" trigger goes on a chain: step 3's trigger rules, the core's reading here (no cite).
		expect(log).toEqual(["summon-watcher"]);
	});
	it(`${cites("rules", "normal-summon-once-per-turn")} is open once a turn`, () => {
		const start = position({ defs: negationCards(), you: { hand: ["normal-4", "normal-4"] } });
		expect(offered(play(start, "summon normal-4"))).toEqual(["pass"]);
	});
});

describe("the moment of the Summon", () => {
	// YGOProJudge (the owner's rules site, no source cited; asked twice, 2026-11-23) says the window offers only cards worded
	// "when a monster would be Summoned", and that it is over once a chain started in it has resolved. No Konami page found.
	it("offers only the cards that answer the Summon, and the Summon succeeds once a chain started in the window has resolved", () => {
		const log: string[] = [];
		const defs = negationCards(log);
		const start = position({ defs, options: { everyWindow: true }, you: { hand: ["normal-4"], monsters: ["bystander"] }, rival: { set: ["summon-dud", "summon-dud"], monsters: ["bystander"] } });
		const asked = play(start, "summon normal-4", "pass");
		expect(asked.priority.holder).toBe("rival");
		// A Quick Effect of a monster on the field does not answer the Summon.
		expect(offered(asked)).toEqual(["activate summon-dud", "activate summon-dud", "pass"]);
		const answered = play(asked, "activate summon-dud", "pass", "pass");
		expect(log).toEqual(["summon-dud"]);
		// The chain resolved: the Summon succeeded, so the second copy has nothing to answer.
		expect(codes(answered, "you", "monster").sort()).toEqual(["bystander", "normal-4"]);
		expect(answered.summoning).toBeNull();
		expect(offered(answered)).not.toContain("activate summon-dud");
	});
});
