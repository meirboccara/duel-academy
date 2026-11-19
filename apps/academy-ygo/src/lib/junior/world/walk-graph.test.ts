import { describe, expect, it } from "vitest";
import { hexDistance, hexKey, hexToPoint } from "./hex";
import { keyDirection, nearestWalkable, pathBetween, spotOf, stepTowards, walkable } from "./walk-graph";
import { buildWorld } from "./world";

const world = buildWorld();
const FOUR = [
	{ x: 1, z: 0 },
	{ x: -1, z: 0 },
	{ x: 0, z: 1 },
	{ x: 0, z: -1 },
];

describe("walkable", () => {
	it("is every road tile, plus only land with nothing standing on it", () => {
		for (const island of world.islands) {
			const free = new Set(walkable(island).map(hexKey));
			const land = new Set(island.land.map(hexKey));
			for (const hex of island.walk) expect(free.has(hexKey(hex)), `${island.world} road ${hexKey(hex)}`).toBe(true);
			for (const hex of walkable(island)) {
				expect(land.has(hexKey(hex)), `${island.world} ${hexKey(hex)}`).toBe(true);
				if (island.walk.some((road) => hexKey(road) === hexKey(hex))) continue;
				const at = hexToPoint(hex);
				for (const item of island.props) expect(Math.hypot(item.x - at.x, item.z - at.z), `${island.world} ${hexKey(hex)} ${item.piece}`).toBeGreaterThan(0.75);
			}
		}
	});

	it("is the same list on every call", () => {
		expect(walkable(world.islands[0]!)).toBe(walkable(world.islands[0]!));
	});
});

describe("pathBetween", () => {
	it("joins any two walkable tiles one neighbour at a time, never leaving them: nobody gets stuck", () => {
		for (const island of world.islands) {
			const tiles = walkable(island);
			const free = new Set(tiles.map(hexKey));
			for (const to of tiles) {
				const path = pathBetween(island, island.dock, to);
				expect(path, `${island.world} ${hexKey(to)}`).not.toBeNull();
				expect(hexKey(path![0]!)).toBe(hexKey(island.dock));
				expect(hexKey(path!.at(-1)!)).toBe(hexKey(to));
				for (let i = 1; i < path!.length; i++) {
					expect(hexDistance(path![i - 1]!, path![i]!)).toBe(1);
					expect(free.has(hexKey(path![i]!))).toBe(true);
				}
			}
		}
	});

	it("takes the short way round the road loop", () => {
		const island = world.islands[0]!;
		const loop = island.walk.slice(1);
		const path = pathBetween(island, loop[0]!, loop.at(-1)!)!;
		expect(path.length).toBeLessThanOrEqual(3);
	});

	it("is one tile when already there, and nothing for water or a building", () => {
		const island = world.islands[0]!;
		expect(pathBetween(island, island.dock, island.dock)).toEqual([island.dock]);
		expect(pathBetween(island, island.dock, { q: 0, r: 0 })).toBeNull();
		expect(pathBetween(island, island.dock, { q: 40, r: 40 })).toBeNull();
		expect(pathBetween(island, { q: 40, r: 40 }, island.dock)).toBeNull();
	});
});

describe("nearestWalkable", () => {
	it("finds the tile under a tap, and the road next to a tapped building", () => {
		for (const island of world.islands) {
			for (const hex of walkable(island)) {
				const at = hexToPoint(hex);
				expect(hexKey(nearestWalkable(island, { x: at.x + 0.3, z: at.z - 0.3 })!), island.world).toBe(hexKey(hex));
			}
			/* The landmark in the middle is not walkable: a tap on it goes to a tile close by, or nowhere when a whole village lies between. */
			const beside = nearestWalkable(island, { x: 0, z: 0 });
			if (beside) expect(hexDistance(beside, { q: 0, r: 0 }), island.world).toBeLessThanOrEqual(2);
			else expect(walkable(island).every((hex) => hexDistance(hex, { q: 0, r: 0 }) > 2), island.world).toBe(true);
		}
	});

	it("ignores a tap far out at sea", () => {
		expect(nearestWalkable(world.islands[0]!, { x: 60, z: 60 })).toBeNull();
	});
});

describe("stepTowards", () => {
	it("goes to a neighbour that lies that way, and nowhere when none does", () => {
		for (const island of world.islands) {
			const free = new Set(walkable(island).map(hexKey));
			for (const from of walkable(island)) {
				for (const direction of FOUR) {
					const to = stepTowards(island, from, direction);
					if (!to) continue;
					expect(hexDistance(from, to)).toBe(1);
					expect(free.has(hexKey(to))).toBe(true);
					const a = hexToPoint(from);
					const b = hexToPoint(to);
					expect((b.x - a.x) * direction.x + (b.z - a.z) * direction.z, `${island.world} ${hexKey(from)}`).toBeGreaterThan(0.5);
				}
			}
		}
	});

	it("leaves the dock by going north, and the keys alone reach every road tile", () => {
		for (const island of world.islands) {
			expect(stepTowards(island, island.dock, { x: 0, z: -1 }), island.world).not.toBeNull();
			const seen = new Set([hexKey(island.dock)]);
			const queue = [island.dock];
			while (queue.length) {
				const from = queue.shift()!;
				for (const direction of FOUR) {
					const to = stepTowards(island, from, direction);
					if (to && !seen.has(hexKey(to))) {
						seen.add(hexKey(to));
						queue.push(to);
					}
				}
			}
			for (const hex of island.walk) expect(seen.has(hexKey(hex)), `${island.world} ${hexKey(hex)}`).toBe(true);
		}
	});
});

describe("spotOf", () => {
	it("is the middle of a tile, and beside the stop on a tile with a stop", () => {
		const island = world.islands[0]!;
		expect(spotOf(island, island.dock)).toEqual(hexToPoint(island.dock));
		const stop = island.stops[0]!;
		const spot = spotOf(island, stop.hex);
		expect(Math.abs(spot.x - stop.at.x)).toBeGreaterThan(0.5);
		expect(Math.hypot(spot.x - stop.at.x, spot.z - stop.at.z)).toBeLessThan(1);
	});
});

describe("keyDirection", () => {
	it("reads the arrows and W A S D, in any case, as screen directions", () => {
		expect(keyDirection("ArrowUp")).toEqual({ x: 0, z: -1 });
		expect(keyDirection("ArrowDown")).toEqual({ x: 0, z: 1 });
		expect(keyDirection("ArrowLeft")).toEqual({ x: -1, z: 0 });
		expect(keyDirection("ArrowRight")).toEqual({ x: 1, z: 0 });
		expect(keyDirection("w")).toEqual(keyDirection("ArrowUp"));
		expect(keyDirection("A")).toEqual(keyDirection("ArrowLeft"));
		expect(keyDirection("s")).toEqual(keyDirection("ArrowDown"));
		expect(keyDirection("D")).toEqual(keyDirection("ArrowRight"));
	});

	it("is nothing for any other key", () => {
		for (const key of ["Enter", " ", "Tab", "q", "Escape", ""]) expect(keyDirection(key)).toBeNull();
	});
});
