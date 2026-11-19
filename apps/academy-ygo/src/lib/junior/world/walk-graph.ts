import { standPoint } from "./hero-path";
import { DIRECTIONS, add, hexKey, hexToPoint, type Hex, type Point } from "./hex";
import type { Island } from "./world";

/**
 * Where the child's figure may walk on an island, and how it gets from one tile to another. The figure moves
 * from tile to tile only, over tiles with nothing on them, so it can never end up in the water, inside a building
 * or behind a tree, and every tile it can reach has a way back.
 */

/** A building, tree or rock within this distance of a tile's middle stands on that tile. */
const TAKEN = 0.75;
/** A tap further than this from every walkable tile (out at sea, or deep in a village) is not a wish to walk. */
const TAP_REACH = 4.2;
/** A key moves the figure to a neighbour only when that neighbour lies within about 70° of the key's direction. */
const KEY_SPREAD = 0.3;

const tiles = new WeakMap<Island, Hex[]>();
const lookups = new WeakMap<Island, Set<string>>();

/** Every tile the figure may stand on: the road (dock included) and any land with nothing standing on it. */
export function walkable(island: Island): Hex[] {
	let list = tiles.get(island);
	if (!list) {
		const road = new Set(island.walk.map(hexKey));
		list = island.land.filter((hex) => {
			if (road.has(hexKey(hex))) return true;
			const at = hexToPoint(hex);
			return !island.props.some((item) => Math.hypot(item.x - at.x, item.z - at.z) <= TAKEN);
		});
		/* The road is always walkable, even if the island's shape were to change. */
		const listed = new Set(list.map(hexKey));
		for (const hex of island.walk) if (!listed.has(hexKey(hex))) list.push(hex);
		tiles.set(island, list);
	}
	return list;
}

function free(island: Island): Set<string> {
	let set = lookups.get(island);
	if (!set) {
		set = new Set(walkable(island).map(hexKey));
		lookups.set(island, set);
	}
	return set;
}

/** The shortest way from one walkable tile to another, both included, one neighbour at a time. Null when there is none. */
export function pathBetween(island: Island, from: Hex, to: Hex): Hex[] | null {
	const open = free(island);
	if (!open.has(hexKey(from)) || !open.has(hexKey(to))) return null;
	const cameFrom = new Map<string, Hex | null>([[hexKey(from), null]]);
	const queue: Hex[] = [from];
	for (let i = 0; i < queue.length; i++) {
		const hex = queue[i]!;
		if (hexKey(hex) === hexKey(to)) {
			const path: Hex[] = [];
			for (let at: Hex | null = hex; at; at = cameFrom.get(hexKey(at)) ?? null) path.unshift(at);
			return path;
		}
		for (const side of DIRECTIONS) {
			const next = add(hex, side);
			const key = hexKey(next);
			if (!open.has(key) || cameFrom.has(key)) continue;
			cameFrom.set(key, hex);
			queue.push(next);
		}
	}
	return null;
}

/** The walkable tile nearest to a point of the island (relative to its centre): the tile tapped, or the road beside a tapped house. */
export function nearestWalkable(island: Island, point: Point): Hex | null {
	let best: Hex | null = null;
	let least = TAP_REACH;
	for (const hex of walkable(island)) {
		const at = hexToPoint(hex);
		const distance = Math.hypot(at.x - point.x, at.z - point.z);
		if (distance < least) {
			least = distance;
			best = hex;
		}
	}
	return best;
}

/** The walkable neighbour that lies most in a direction (x east, z south), or null when none lies that way. */
export function stepTowards(island: Island, from: Hex, direction: Point): Hex | null {
	const open = free(island);
	const length = Math.hypot(direction.x, direction.z);
	if (!length) return null;
	const here = hexToPoint(from);
	let best: Hex | null = null;
	let most = KEY_SPREAD;
	for (const side of DIRECTIONS) {
		const next = add(from, side);
		if (!open.has(hexKey(next))) continue;
		const at = hexToPoint(next);
		const along = ((at.x - here.x) * direction.x + (at.z - here.z) * direction.z) / (2 * length);
		if (along > most + 1e-9) {
			most = along;
			best = next;
		}
	}
	return best;
}

/** Where the figure stands on a tile, relative to the island's centre: its middle, or beside the stop when the tile has one. */
export function spotOf(island: Island, hex: Hex): Point {
	const key = hexKey(hex);
	const onRoad = island.stops.some((stop) => hexKey(stop.hex) === key) ? island.walk.findIndex((road) => hexKey(road) === key) : -1;
	return onRoad >= 0 ? standPoint(island, onRoad) : hexToPoint(hex);
}

const KEYS: Record<string, Point> = {
	arrowup: { x: 0, z: -1 },
	w: { x: 0, z: -1 },
	arrowdown: { x: 0, z: 1 },
	s: { x: 0, z: 1 },
	arrowleft: { x: -1, z: 0 },
	a: { x: -1, z: 0 },
	arrowright: { x: 1, z: 0 },
	d: { x: 1, z: 0 },
};

/** The direction a key asks for, as seen on screen (up is north, away from the camera). Null for any other key. */
export function keyDirection(key: string): Point | null {
	return KEYS[key.toLowerCase()] ?? null;
}
