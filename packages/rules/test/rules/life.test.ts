import { describe, expect, it } from "vitest";
import { cites, payHalfLp } from "../../src";
import { position } from "./fixtures";

/** Paying Life Points as a cost. */
describe("pay half your LP", () => {
	it(`${cites("rules", "half-lp-odd-rounds-remaining-up")} an odd number of Life Points: the half paid is rounded down, the remaining half is rounded up`, () => {
		const start = { ...position({ defs: {} }), lp: { you: 125, rival: 8000 } };
		const paid = payHalfLp(start, "you")!;
		expect(paid.lp.you).toBe(63);
		expect(start.lp.you).toBe(125);
	});
	it("an even number of Life Points: half remains", () => {
		const start = { ...position({ defs: {} }), lp: { you: 8000, rival: 8000 } };
		expect(payHalfLp(start, "you")!.lp.you).toBe(4000);
	});
	it("one Life Point: all but the rounded-up half is paid, which is nothing", () => {
		const start = { ...position({ defs: {} }), lp: { you: 1, rival: 8000 } };
		expect(payHalfLp(start, "you")!.lp.you).toBe(1);
	});
});
