import { describe, expect, it } from "vitest";
import { coverCrop, panelShift } from "./panel-spot";
import { buildWorld } from "./world";

const world = buildWorld();

describe("panelShift", () => {
	it("keeps the panel over the island and off the tall landmarks", () => {
		for (const island of world.islands) {
			expect(Math.abs(panelShift(island, false)), island.world).toBeLessThanOrEqual(4.5);
			expect(Math.abs(panelShift(island, true)), island.world).toBeGreaterThanOrEqual(2);
		}
	});

	it("never floats right in front of a stop on the far side of the road", () => {
		for (const island of world.islands) {
			for (const tall of [false, true]) {
				const x = panelShift(island, tall);
				for (const stop of island.stops) if (stop.at.z < -0.5) expect(Math.abs(stop.at.x - x), `${island.world} ${stop.levelId}`).toBeGreaterThanOrEqual(0.5);
			}
		}
	});
});

describe("coverCrop", () => {
	it("cuts the sides of a wide picture and the top and bottom of a tall one", () => {
		expect(coverCrop(2, 1)).toEqual({ repeat: [0.5, 1], offset: [0.25, 0] });
		expect(coverCrop(0.5, 1)).toEqual({ repeat: [1, 0.5], offset: [0, 0.25] });
		expect(coverCrop(1.25, 1.25)).toEqual({ repeat: [1, 1], offset: [0, 0] });
		expect(coverCrop(0, 1)).toEqual({ repeat: [1, 1], offset: [0, 0] });
	});
});
