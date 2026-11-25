import { describe, expect, it } from "vitest";
import { standIndex } from "./hero-path";
import { hexDistance, hexKey, hexToPoint } from "./hex";
import { behindStop, behindTrainer, canBoard, nearShop, restIndex, shopSpot, stopOn, towardsSea, trainerHex, trainerPoint } from "./map-places";
import type { StopStatus } from "./status";
import { pathBetween, walkable } from "./walk-graph";
import { buildWorld } from "./world";

const world = buildWorld();
const marks = (island: (typeof world.islands)[number], solved: number): Record<string, StopStatus> => Object.fromEntries(island.stops.map((stop, i) => [stop.levelId, i < solved ? (i % 2 ? "star" : "solved") : i === solved ? "next" : "locked"]));

describe("trainerHex", () => {
	it("is a piece of land beside the dock, off the road, that the figure cannot walk on", () => {
		for (const island of world.islands) {
			const hex = trainerHex(island);
			expect(hex, island.world).not.toBeNull();
			expect(island.land.some((land) => hexKey(land) === hexKey(hex!)), island.world).toBe(true);
			/* Not the dock, not a stop, not any road tile: the road stays whole. */
			expect(island.walk.some((road) => hexKey(road) === hexKey(hex!)), island.world).toBe(false);
			expect(walkable(island).some((free) => hexKey(free) === hexKey(hex!)), island.world).toBe(false);
			/* The figure arrives at the dock: the trainer is its neighbour, so the close view shows both. */
			expect(hexDistance(hex!, island.dock), island.world).toBe(1);
			/* In the front row, so no building stands between the trainer and the camera. */
			expect(hexToPoint(hex!).z, island.world).toBeCloseTo(hexToPoint(island.dock).z);
		}
	});

	it("is the same tile on every call", () => {
		expect(trainerHex(world.islands[0]!)).toEqual(trainerHex(world.islands[0]!));
	});

	it("has the trainer standing on that tile, east of its middle, so the first stop behind it stays in view", () => {
		for (const island of world.islands) {
			const hex = trainerHex(island)!;
			const at = trainerPoint(hex);
			expect(at.z, island.world).toBe(hexToPoint(hex).z);
			expect(at.x - hexToPoint(hex).x, island.world).toBeGreaterThan(0);
			expect(at.x - hexToPoint(hex).x, island.world).toBeLessThan(1);
			/* The first stop's mark is clear of the picture, which is at most 1.3 wide each side. */
			expect(at.x - island.stops[0]!.at.x, island.world).toBeGreaterThanOrEqual(1.5);
			/* And the figure on the dock stands beside the trainer, not behind. */
			expect(behindTrainer(hex, hexToPoint(island.dock)), island.world).toBe(false);
		}
	});

	it("knows when the figure is behind the trainer, who then lets it show through", () => {
		for (const island of world.islands) {
			const hex = trainerHex(island)!;
			/* On the tile next to the dock, the figure is behind the picture. */
			expect(behindTrainer(hex, hexToPoint(island.walk[1]!)), island.world).toBe(true);
			const at = trainerPoint(hex);
			expect(behindTrainer(hex, { x: at.x, z: at.z + 1 }), island.world).toBe(false);
			expect(behindTrainer(hex, { x: at.x, z: at.z - 6 }), island.world).toBe(false);
			expect(behindTrainer(hex, { x: at.x + 3, z: at.z - 1.7 }), island.world).toBe(false);
		}
	});
});

describe("shopSpot", () => {
	const island = world.islands[0]!;
	const spot = shopSpot(island, trainerHex(island))!;

	it("is a house of the first island, not the trainer's tile, with a door tile on the road in front of it", () => {
		expect(spot).not.toBeNull();
		expect(island.props).toContain(spot.building);
		expect(spot.building.piece).toMatch(/^building_/);
		expect(hexKey(spot.hex)).not.toBe(hexKey(trainerHex(island)!));
		expect(hexDistance(spot.hex, spot.door)).toBe(1);
		/* In front: the figure at the door is not hidden by the shop. */
		expect(hexToPoint(spot.door).z).toBeGreaterThan(hexToPoint(spot.hex).z);
	});

	it("has a door the figure can reach from the dock, which is neither the dock nor a stop", () => {
		expect(pathBetween(island, island.dock, spot.door)).not.toBeNull();
		expect(hexKey(spot.door)).not.toBe(hexKey(island.dock));
		expect(stopOn(island, spot.door)).toBeNull();
	});

	it("is near for the free tiles around it that are not stops, and for no other", () => {
		expect(nearShop(island, spot, spot.door)).toBe(true);
		expect(nearShop(island, spot, island.dock)).toBe(false);
		for (const stop of island.stops) expect(nearShop(island, spot, stop.hex)).toBe(false);
		for (const hex of walkable(island)) if (nearShop(island, spot, hex)) expect(hexDistance(hex, spot.hex)).toBe(1);
	});

	it("is a valid spot or nothing on every other island", () => {
		for (const other of world.islands) {
			const found = shopSpot(other, trainerHex(other));
			if (!found) continue;
			expect(pathBetween(other, other.dock, found.door), other.world).not.toBeNull();
			expect(stopOn(other, found.door), other.world).toBeNull();
		}
	});
});

describe("restIndex", () => {
	it("is the dock while no level of the island is solved", () => {
		for (const island of world.islands) expect(restIndex(island, marks(island, 0)), island.world).toBe(0);
	});

	it("after a solve, is the next stop: the figure stands on it, and the action button plays it", () => {
		for (const island of world.islands) {
			for (let solved = 1; solved < island.stops.length; solved++) {
				const status = marks(island, solved);
				const rest = restIndex(island, status);
				expect(hexKey(island.walk[rest]!), `${island.world} ${solved}`).toBe(hexKey(island.stops[solved]!.hex));
				expect(stopOn(island, island.walk[rest]!)?.levelId, `${island.world} ${solved}`).toBe(island.stops[solved]!.levelId);
				/* Further along than the stop just solved. */
				expect(rest, `${island.world} ${solved}`).toBeGreaterThan(standIndex(island, status));
			}
		}
	});

	it("goes further along the walk with every level solved", () => {
		for (const island of world.islands) {
			let before = 0;
			for (let solved = 1; solved <= island.stops.length; solved++) {
				const rest = restIndex(island, marks(island, solved));
				expect(rest, `${island.world} ${solved}`).toBeGreaterThanOrEqual(before);
				before = rest;
			}
		}
	});

	it("is the last stop once the island is finished", () => {
		for (const island of world.islands) {
			const status = marks(island, island.stops.length);
			expect(restIndex(island, status), island.world).toBe(standIndex(island, status));
		}
	});
});

describe("stopOn", () => {
	it("finds the stop of a tile, and nothing on a tile without one", () => {
		const island = world.islands[0]!;
		for (const stop of island.stops) expect(stopOn(island, stop.hex)).toBe(stop);
		expect(stopOn(island, island.dock)).toBeNull();
	});
});

describe("boarding", () => {
	it("is offered on the dock and on the tile next to it, nowhere else", () => {
		for (const island of world.islands) {
			expect(canBoard(island, island.dock), island.world).toBe(true);
			expect(canBoard(island, island.walk[1]!), island.world).toBe(true);
			expect(canBoard(island, island.walk[3]!), island.world).toBe(false);
		}
	});

	it("reads down and right as towards the boat, up and left as away from it", () => {
		for (const island of world.islands) {
			expect(towardsSea(island, { x: 0, z: 1 }), island.world).toBe(true);
			expect(towardsSea(island, { x: 1, z: 0 }), island.world).toBe(true);
			expect(towardsSea(island, { x: 0, z: -1 }), island.world).toBe(false);
			expect(towardsSea(island, { x: -1, z: 0 }), island.world).toBe(false);
		}
	});
});

describe("a trainer's face on a duel stop", () => {
	const stop = { x: 4, z: 2 };
	it("lets the figure show through only when it stands behind the face, as the camera sees it", () => {
		/* On the stop itself the figure is in front of the face, which stands a little behind it. */
		expect(behindStop(stop, stop)).toBe(false);
		expect(behindStop(stop, { x: 4, z: 0.5 })).toBe(true);
		expect(behindStop(stop, { x: 4.6, z: 0 })).toBe(true);
		/* Beside it, or far behind it on the next road, the figure is not hidden. */
		expect(behindStop(stop, { x: 6, z: 0.5 })).toBe(false);
		expect(behindStop(stop, { x: 4, z: -2 })).toBe(false);
		/* In front of it, closer to the camera. */
		expect(behindStop(stop, { x: 4, z: 3.5 })).toBe(false);
	});
});
