import { describe, expect, it } from "vitest";
import { createRng } from "../src";

describe("createRng: the only source of randomness in a duel", () => {
	it("gives the same sequence for the same seed, so a duel can be replayed", () => {
		const a = createRng(42);
		const b = createRng(42);
		const first = Array.from({ length: 20 }, () => a.int(1000));
		expect(Array.from({ length: 20 }, () => b.int(1000))).toEqual(first);
	});
	it("gives a different sequence for another seed", () => {
		const a = createRng(1);
		const b = createRng(2);
		expect(Array.from({ length: 10 }, () => a.int(1_000_000))).not.toEqual(Array.from({ length: 10 }, () => b.int(1_000_000)));
	});
	it("draws integers in [0, n) and reaches both ends", () => {
		const rng = createRng(7);
		const seen = new Set(Array.from({ length: 2000 }, () => rng.int(6)));
		expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
	});
	it("refuses a range that is empty, negative or not a whole number", () => {
		const rng = createRng(3);
		for (const n of [0, -1, 2.5, Number.NaN]) expect(() => rng.int(n)).toThrow(RangeError);
	});
	it("can be saved and resumed mid-sequence (its state is a plain number)", () => {
		const rng = createRng(99);
		rng.int(10);
		const resumed = createRng(99, rng.state);
		expect(resumed.int(1000)).toBe(rng.int(1000));
	});
});
