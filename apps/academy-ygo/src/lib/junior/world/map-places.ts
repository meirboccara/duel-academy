import { standIndex } from "./hero-path";
import { DIRECTIONS, add, hexDistance, hexKey, hexToPoint, type Hex, type Point } from "./hex";
import type { StopStatus } from "./status";
import { pathBetween, walkable } from "./walk-graph";
import type { Island, IslandStop, Placement } from "./world";

/**
 * The special places of an island, all worked out from the island itself: where its trainer stands, which house is
 * the game shop and where its door is, where the figure waits after a solved level, and where it can board the boat.
 */

/** A building, tree or rock within this distance of a tile's middle stands on that tile (as in `walk-graph.ts`). */
const TAKEN = 0.75;

const pieceOn = (island: Island, hex: Hex): Placement | null => {
	const at = hexToPoint(hex);
	return island.props.find((item) => Math.hypot(item.x - at.x, item.z - at.z) <= TAKEN) ?? null;
};
const sameHex = (a: Hex, b: Hex) => a.q === b.q && a.r === b.r;

/**
 * The tile the island's trainer stands on: the piece of land next to the dock, in the front row, where the figure
 * comes ashore and nothing stands between the trainer and the camera. The scene leaves out the small building or
 * tree that the island's plan puts there; the plan still counts the tile as taken, so the figure never walks on it.
 */
export function trainerHex(island: Island): Hex | null {
	const road = new Set(island.walk.map(hexKey));
	const fits = (hex: Hex) => !road.has(hexKey(hex)) && island.land.some((land) => sameHex(land, hex)) && !!pieceOn(island, hex);
	/* Beside the dock first, then beside the road, tile after tile from the dock. */
	for (const from of island.walk) {
		const around = DIRECTIONS.map((side) => add(from, side)).filter(fits);
		if (!around.length) continue;
		/* The most to the front, then the most to the west: away from the boat, which is moored east of the dock. */
		return around.sort((a, b) => hexToPoint(b).z - hexToPoint(a).z || hexToPoint(a).x - hexToPoint(b).x)[0]!;
	}
	return null;
}

/** The trainer stands east of the tile's middle: towards the dock, and clear of the first stop, which is behind to the north-west. */
const TRAINER_SHIFT = 0.5;

/** Where the trainer stands on their tile, relative to the island's centre. */
export function trainerPoint(hex: Hex): Point {
	const at = hexToPoint(hex);
	return { x: at.x + TRAINER_SHIFT, z: at.z };
}

/**
 * True when a point of the island (relative to its centre) is behind the trainer as the camera sees it, from the
 * south: the picture would hide a figure standing there, so it lets the figure show through.
 */
export function behindTrainer(hex: Hex, point: Point): boolean {
	const at = trainerPoint(hex);
	const north = at.z - point.z;
	return Math.abs(point.x - at.x) < 1.5 && north > 0.3 && north < 3.4;
}

export interface ShopSpot {
	/** The house that is the shop: one of `island.props`. */
	building: Placement;
	hex: Hex;
	/** The road tile in front of it, where the figure stands to go in. */
	door: Hex;
}

const SHOP_PIECES = /^building_(home|market|tavern)/;

/**
 * The house that is the game shop: of the island's houses with a free tile in front of them (to the south, so the
 * figure at the door stays in view) that is neither the dock nor a stop, the one whose door is the shortest walk
 * from the dock. `taken` is a tile it must not be (the trainer's). Null on an island with no such house.
 */
export function shopSpot(island: Island, taken: Hex | null = null): ShopSpot | null {
	const free = new Set(walkable(island).map(hexKey));
	let best: (ShopSpot & { steps: number }) | null = null;
	for (const hex of island.land) {
		const building = pieceOn(island, hex);
		if (!building || !SHOP_PIECES.test(building.piece) || (taken && sameHex(taken, hex))) continue;
		for (const side of DIRECTIONS) {
			const door = add(hex, side);
			if (!free.has(hexKey(door)) || sameHex(door, island.dock) || stopOn(island, door)) continue;
			if (hexToPoint(door).z <= hexToPoint(hex).z + 0.5) continue;
			const steps = pathBetween(island, island.dock, door)?.length;
			if (steps === undefined) continue;
			if (!best || steps < best.steps) best = { building, hex, door, steps };
		}
	}
	return best ? { building: best.building, hex: best.hex, door: best.door } : null;
}

/** True on the free tiles round the shop where the figure can go in: any neighbour of the house that is not a stop or the dock. */
export function nearShop(island: Island, spot: ShopSpot, hex: Hex): boolean {
	return hexDistance(hex, spot.hex) === 1 && !sameHex(hex, island.dock) && !stopOn(island, hex);
}

/** The stop on a tile, or null. */
export function stopOn(island: Island, hex: Hex): IslandStop | null {
	return island.stops.find((stop) => sameHex(stop.hex, hex)) ?? null;
}

/**
 * The step of `island.walk` where the figure waits: the dock while no level of the island is solved; after a solve,
 * the next stop itself (standing on a stop opens nothing: the action button does); and the last solved stop once
 * nothing is left to play on the island.
 */
export function restIndex(island: Island, stopStatus: Readonly<Record<string, StopStatus>>): number {
	const solved = standIndex(island, stopStatus);
	if (solved === 0) return 0;
	const next = island.stops.find((stop) => stopStatus[stop.levelId] === "next");
	const at = next ? island.walk.findIndex((hex) => sameHex(hex, next.hex)) : -1;
	return at > solved ? at : solved;
}

/** The figure can step into the boat from the dock and from the tile next to it. */
export function canBoard(island: Island, hex: Hex): boolean {
	return hexDistance(hex, island.dock) <= 1 && island.walk.slice(0, 2).some((road) => sameHex(road, hex));
}

/** True when a direction (x east, z south) points from the dock to the boat: pressing that way on the dock boards it. */
export function towardsSea(island: Island, direction: Point): boolean {
	const dock = hexToPoint(island.dock);
	const out = { x: island.harbour.x - island.center.x - dock.x, z: island.harbour.z - island.center.z - dock.z };
	const length = Math.hypot(direction.x, direction.z) * Math.hypot(out.x, out.z);
	return length > 0 && (direction.x * out.x + direction.z * out.z) / length > 0.3;
}
