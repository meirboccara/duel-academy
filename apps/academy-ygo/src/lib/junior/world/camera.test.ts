import { describe, expect, it } from "vitest";
import { CLOSE_SPAN, FOV, closeDistance, closeView, farDistance, seaView } from "./camera";
import { buildWorld } from "./world";

const world = buildWorld();
/* The shape of the map under the header: a phone upright, a phone on its side, an iPad upright, a computer. */
const SCREENS = { phone: 390 / 786, phoneWide: 844 / 332, tablet: 820 / 1122, desktop: 1280 / 660 };
const halfWidth = (distance: number, aspect: number) => distance * Math.tan(((FOV / 2) * Math.PI) / 180) * aspect;

describe("farDistance", () => {
	it("shows the whole island across the screen", () => {
		for (const island of world.islands) for (const aspect of Object.values(SCREENS)) expect(halfWidth(farDistance(island.radius, aspect), aspect)).toBeGreaterThanOrEqual((island.radius + 1.5) * 0.8 - 1e-9);
	});

	it("stays finite on a hidden, shapeless canvas", () => {
		expect(Number.isFinite(farDistance(6, 0))).toBe(true);
		expect(Number.isFinite(farDistance(6, Number.NaN))).toBe(true);
	});
});

describe("closeDistance", () => {
	it("is at most about half the whole-island distance on every screen, for every island", () => {
		for (const island of world.islands) for (const [name, aspect] of Object.entries(SCREENS)) expect(closeDistance(island.radius, aspect) / farDistance(island.radius, aspect), `${island.world} ${name}`).toBeLessThanOrEqual(0.6);
	});

	it("still shows the tiles around the figure, left and right", () => {
		for (const aspect of Object.values(SCREENS)) expect(halfWidth(closeDistance(9, aspect), aspect)).toBeGreaterThanOrEqual(CLOSE_SPAN - 1e-9);
	});

	it("never goes further out than the whole-island view, and stays finite", () => {
		for (const aspect of [0, 0.2, 1, 3, Number.NaN]) {
			expect(closeDistance(3, aspect)).toBeLessThanOrEqual(farDistance(3, aspect));
			expect(Number.isFinite(closeDistance(3, aspect))).toBe(true);
		}
	});
});

describe("closeView", () => {
	it("looks a little south of the figure, so it shows above the buttons at the bottom", () => {
		const view = closeView({ x: 3, z: -2 }, { x: 0, z: 0 }, 7, SCREENS.phone);
		expect(view.target.x).toBe(3);
		expect(view.target.z).toBeGreaterThan(-2);
		expect(view.distance).toBe(closeDistance(7, SCREENS.phone));
	});

	it("does not follow the figure out over the sea: the point looked at stays over the island", () => {
		const view = closeView({ x: 30, z: 0 }, { x: 0, z: 0 }, 7, SCREENS.phone);
		expect(Math.hypot(view.target.x, view.target.z)).toBeLessThanOrEqual(7 + 1e-9);
	});
});

describe("closeView with the island's trainer", () => {
	const figure = { x: 3, z: 5.2 };
	const half = (aspect: number) => halfWidth(closeDistance(7.2, aspect), aspect);

	it("leans towards a trainer standing next to the figure, so both show, the figure still well inside", () => {
		for (const [name, aspect] of Object.entries(SCREENS)) {
			const trainer = { x: 0.4, z: 5.2 };
			const view = closeView(figure, { x: 0, z: 0 }, 7.2, aspect, trainer);
			expect(view.target.x, name).toBeLessThan(figure.x);
			/* The trainer's middle is on screen with room to spare, and so is the figure. */
			expect(Math.abs(trainer.x - view.target.x), name).toBeLessThan(half(aspect) - 1);
			expect(Math.abs(figure.x - view.target.x), name).toBeLessThan(half(aspect) - 1);
		}
	});

	it("forgets a trainer who is far away, with no jump in between", () => {
		const alone = closeView(figure, { x: 0, z: 0 }, 7.2, SCREENS.phone);
		expect(closeView(figure, { x: 0, z: 0 }, 7.2, SCREENS.phone, { x: -4, z: 5.2 })).toEqual(alone);
		let before = closeView(figure, { x: 0, z: 0 }, 7.2, SCREENS.phone, { x: 3, z: 5.2 }).target.x;
		for (let away = 0.1; away < 8; away += 0.1) {
			const x = closeView(figure, { x: 0, z: 0 }, 7.2, SCREENS.phone, { x: 3 - away, z: 5.2 }).target.x;
			expect(Math.abs(x - before)).toBeLessThan(0.2);
			before = x;
		}
	});
});

describe("seaView", () => {
	it("follows the boat from a bit further out than the close view on land, and nearer than the whole-island view", () => {
		for (const island of world.islands)
			for (const [name, aspect] of Object.entries(SCREENS)) {
				const view = seaView({ x: 5, z: 9 }, aspect);
				expect(view.distance, `${island.world} ${name}`).toBeGreaterThan(closeDistance(island.radius, aspect));
				expect(view.distance, `${island.world} ${name}`).toBeLessThan(farDistance(9.2, aspect) * 1.01);
				expect(view.target.x).toBe(5);
				expect(view.target.z).toBeGreaterThan(9);
			}
	});

	it("stays finite on a hidden, shapeless canvas", () => {
		for (const aspect of [0, Number.NaN]) expect(Number.isFinite(seaView({ x: 0, z: 0 }, aspect).distance)).toBe(true);
	});
});
