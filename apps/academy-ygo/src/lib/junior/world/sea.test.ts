import { describe, expect, it } from "vitest";
import type { Point } from "./hex";
import { DOCK_REACH, KEEP_OFF, isSea, landingAt, seaBounds, seaRoute, steerBoat } from "./sea";
import { buildWorld } from "./world";

const world = buildWorld();
const FOUR: Point[] = [
	{ x: 1, z: 0 },
	{ x: -1, z: 0 },
	{ x: 0, z: 1 },
	{ x: 0, z: -1 },
];
const UP = FOUR[3]!;
const DOWN = FOUR[2]!;
const RIGHT = FOUR[0]!;
/** A small seeded random generator: the same voyage on every run. */
function seeded(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}
const offLand = (point: Point) => world.islands.every((island) => Math.hypot(point.x - island.center.x, point.z - island.center.z) >= island.radius + KEEP_OFF - 1e-6);

describe("seaBounds and isSea", () => {
	it("holds every harbour and every point of the boat's routes", () => {
		const bounds = seaBounds(world);
		for (const island of world.islands) {
			expect(isSea(world, island.harbour), island.world).toBe(true);
			expect(island.harbour.x).toBeGreaterThan(bounds.minX);
			expect(island.harbour.x).toBeLessThan(bounds.maxX);
		}
		for (const route of world.routes) for (const point of route) expect(isSea(world, point)).toBe(true);
	});

	it("is never an island, the water behind one, or the far ocean", () => {
		for (const island of world.islands) {
			expect(isSea(world, island.center), island.world).toBe(false);
			expect(isSea(world, { x: island.center.x + island.radius, z: island.center.z }), island.world).toBe(false);
			/* Behind an island the boat would be hidden by it: that water is closed. */
			expect(isSea(world, { x: island.center.x, z: island.center.z - island.radius - 2 }), island.world).toBe(false);
		}
		expect(isSea(world, { x: -500, z: 0 })).toBe(false);
		expect(isSea(world, { x: 0, z: 500 })).toBe(false);
	});
});

describe("steerBoat", () => {
	it("never leaves the sea, whatever the child presses", () => {
		for (const island of world.islands) {
			const random = seeded(island.index + 1);
			let at = island.harbour;
			for (let i = 0; i < 1500; i++) {
				const direction = FOUR[Math.floor(random() * 4)]!;
				/* Long pushes the same way, like a held key. */
				for (let hold = 0; hold < 12; hold++) {
					const next = steerBoat(world, at, direction, 0.25);
					expect(isSea(world, next), `${island.world} ${next.x},${next.z}`).toBe(true);
					expect(offLand(next), island.world).toBe(true);
					expect(Math.hypot(next.x - at.x, next.z - at.z)).toBeLessThan(0.8);
					at = next;
				}
			}
		}
	});

	it("does not move without a direction, and stops at the edge of the sea", () => {
		const harbour = world.islands[0]!.harbour;
		expect(steerBoat(world, harbour, { x: 0, z: 0 }, 1)).toEqual(harbour);
		let at = harbour;
		for (let i = 0; i < 400; i++) at = steerBoat(world, at, DOWN, 0.5);
		expect(at.z).toBeCloseTo(seaBounds(world).maxZ);
	});

	it("sails from each island to the next with three keys: down, right, up", () => {
		for (let i = 0; i + 1 < world.islands.length; i++) {
			const from = world.islands[i]!.harbour;
			const to = world.islands[i + 1]!.harbour;
			let at = from;
			const lane = Math.max(from.z, to.z) + 4;
			for (let step = 0; step < 400 && at.z < lane; step++) at = steerBoat(world, at, DOWN, 0.25);
			for (let step = 0; step < 400 && at.x < to.x; step++) at = steerBoat(world, at, RIGHT, 0.25);
			for (let step = 0; step < 400 && at.z > to.z; step++) at = steerBoat(world, at, UP, 0.25);
			expect(landingAt(world, at), world.islands[i + 1]!.world).toBe(i + 1);
		}
	});
});

describe("landingAt", () => {
	it("is the island whose harbour the boat is at or close to", () => {
		for (const island of world.islands) {
			expect(landingAt(world, island.harbour), island.world).toBe(island.index);
			expect(landingAt(world, { x: island.harbour.x + DOCK_REACH - 0.1, z: island.harbour.z }), island.world).toBe(island.index);
		}
	});

	it("is nothing out at sea", () => {
		/* Half way between two islands, on the boat's own route. */
		for (const route of world.routes) expect(landingAt(world, { x: (route[1]!.x + route[2]!.x) / 2, z: route[1]!.z })).toBeNull();
		const island = world.islands[0]!;
		expect(landingAt(world, { x: island.harbour.x, z: island.harbour.z + DOCK_REACH + 0.1 })).toBeNull();
	});
});

describe("seaRoute", () => {
	it("takes the boat from anywhere at sea to any harbour without crossing land", () => {
		const random = seeded(7);
		const bounds = seaBounds(world);
		let tried = 0;
		while (tried < 300) {
			const from = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), z: bounds.minZ + random() * (bounds.maxZ - bounds.minZ) };
			if (!isSea(world, from)) continue;
			tried++;
			const to = Math.floor(random() * world.islands.length);
			const route = seaRoute(world, from, to);
			expect(route.length).toBeGreaterThanOrEqual(2);
			expect(route[0]).toEqual(from);
			expect(route.at(-1)).toEqual(world.islands[to]!.harbour);
			for (let i = 1; i < route.length; i++) {
				expect(Math.hypot(route[i]!.x - route[i - 1]!.x, route[i]!.z - route[i - 1]!.z)).toBeGreaterThan(0.05);
				for (let t = 0; t <= 1; t += 0.02) {
					const point = { x: route[i - 1]!.x + (route[i]!.x - route[i - 1]!.x) * t, z: route[i - 1]!.z + (route[i]!.z - route[i - 1]!.z) * t };
					/* Half the keep-off distance is allowed on the last stretch into the harbour. */
					for (const island of world.islands) expect(Math.hypot(point.x - island.center.x, point.z - island.center.z), `${from.x},${from.z} to ${to}`).toBeGreaterThan(island.radius + KEEP_OFF / 2);
				}
			}
		}
	});

	it("is one straight line when the boat is already at the harbour's mouth", () => {
		const island = world.islands[3]!;
		expect(seaRoute(world, { x: island.harbour.x + 1, z: island.harbour.z + 1 }, 3)).toHaveLength(2);
	});
});
