import { describe, expect, it } from "vitest";
import { exitsOf, roadPiece } from "./roads";

const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);

describe("roadPiece", () => {
	it("uses the straight road, unturned, for a road running east to west", () => {
		expect(roadPiece([0, 3])).toEqual({ piece: "hex_road_A", turns: 0 });
	});

	it("uses the dead end for a road that only leaves one side", () => {
		expect(roadPiece([3]).piece).toBe("hex_road_M");
		expect(roadPiece([0])).toEqual({ piece: "hex_road_M", turns: 3 });
	});

	it("finds a tile and a turn whose exits are exactly the ones asked, for every road of one to three exits", () => {
		const sets: number[][] = [];
		for (let mask = 1; mask < 64; mask++) {
			const set = [0, 1, 2, 3, 4, 5].filter((side) => mask & (1 << side));
			if (set.length <= 3) sets.push(set);
		}
		for (const set of sets) {
			const choice = roadPiece(set);
			expect(sorted(exitsOf(choice)), `${set} -> ${choice.piece} turned ${choice.turns}`).toEqual(set);
		}
	});
});
