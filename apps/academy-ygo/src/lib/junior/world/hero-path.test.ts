import { describe, expect, it } from "vitest";
import { hexKey, hexToPoint } from "./hex";
import { BESIDE_STOP, pathLength, standIndex, standPoint, walkBetween, walkSeconds } from "./hero-path";
import type { StopStatus } from "./status";
import { buildWorld } from "./world";

const world = buildWorld();
const marks = (island: (typeof world.islands)[number], solved: number): Record<string, StopStatus> => Object.fromEntries(island.stops.map((stop, i) => [stop.levelId, i < solved ? (i % 2 ? "star" : "solved") : i === solved ? "next" : "locked"]));

describe("standIndex", () => {
	it("is the dock while no level of the island is solved", () => {
		for (const island of world.islands) {
			expect(standIndex(island, marks(island, 0)), island.world).toBe(0);
			expect(standIndex(island, {}), island.world).toBe(0);
		}
	});

	it("is the stop of the last solved level, further along the walk with every level", () => {
		for (const island of world.islands) {
			let before = 0;
			for (let solved = 1; solved <= island.stops.length; solved++) {
				const at = standIndex(island, marks(island, solved));
				expect(hexKey(island.walk[at]!), island.world).toBe(hexKey(island.stops[solved - 1]!.hex));
				expect(at, island.world).toBeGreaterThan(before);
				before = at;
			}
		}
	});
});

describe("standPoint", () => {
	it("is the middle of the dock, and beside a stop without leaving its tile", () => {
		for (const island of world.islands) {
			expect(standPoint(island, 0), island.world).toEqual(hexToPoint(island.dock));
			for (let solved = 1; solved <= island.stops.length; solved++) {
				const stop = island.stops[solved - 1]!.at;
				const spot = standPoint(island, standIndex(island, marks(island, solved)));
				expect(Math.abs(spot.x - stop.x), island.world).toBeCloseTo(BESIDE_STOP.x);
				expect(spot.z - stop.z, island.world).toBeCloseTo(BESIDE_STOP.z);
				/* A tile is 2 across its flat sides: within 1 of the middle is always on it. */
				expect(Math.hypot(spot.x - stop.x, spot.z - stop.z), island.world).toBeLessThan(1);
			}
		}
	});

	it("takes the side of the stop that is clearer of what stands in front of it, seen from the south", () => {
		for (const island of world.islands) {
			for (let index = 1; index < island.walk.length; index++) {
				const spot = standPoint(island, index);
				const other = { x: 2 * hexToPoint(island.walk[index]!).x - spot.x, z: spot.z };
				const clear = (x: number) => Math.min(...island.props.filter((item) => item.z > spot.z + 0.4 && item.z < spot.z + 3.8).map((item) => Math.abs(item.x - x)), 9);
				expect(clear(spot.x), `${island.world} ${index}`).toBeGreaterThanOrEqual(clear(other.x) - 0.01);
			}
		}
	});
});

describe("walkBetween", () => {
	it("follows the road one tile at a time and ends on the standing spot", () => {
		for (const island of world.islands) {
			const to = standIndex(island, marks(island, island.stops.length));
			const path = walkBetween(island, 0, to);
			expect(path).toHaveLength(to + 1);
			expect(path[0]).toEqual(standPoint(island, 0));
			expect(path.at(-1)).toEqual(standPoint(island, to));
			for (let i = 1; i < path.length; i++) expect(Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.z - path[i - 1]!.z), island.world).toBeLessThan(3);
		}
	});

	it("walks back the same way, and stays put when there is nowhere to go", () => {
		const island = world.islands[2]!;
		const there = walkBetween(island, 1, 4);
		const back = walkBetween(island, 4, 1);
		expect(back.slice(1, -1)).toEqual(there.slice(1, -1).reverse());
		expect(walkBetween(island, 3, 3)).toEqual([standPoint(island, 3)]);
		expect(walkBetween(island, -5, 999).at(-1)).toEqual(standPoint(island, island.walk.length - 1));
	});
});

describe("walkSeconds", () => {
	it("keeps every walk between half a second and under two", () => {
		expect(walkSeconds(0)).toBe(0.5);
		expect(walkSeconds(4.5)).toBe(1);
		expect(walkSeconds(500)).toBe(1.8);
		expect(pathLength([{ x: 0, z: 0 }, { x: 3, z: 4 }, { x: 3, z: 6 }])).toBe(7);
	});
});
