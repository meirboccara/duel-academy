import type { Point } from "./hex";
import type { World } from "./world";

/**
 * The sea the child steers the boat over. The boat stays inside a box round the archipelago, never comes closer
 * than `KEEP_OFF` to an island, and never goes behind one (north of it), where the island would hide it. With that
 * last rule the water straight south of the boat is always open, which is what lets `seaRoute` bring it home from
 * anywhere without crossing land.
 */

/** The boat stays this far from every island's shore. */
export const KEEP_OFF = 1;
/** Closer than this to a harbour, the boat can land there. */
export const DOCK_REACH = 2.6;
/** Units a second while a direction is held. */
export const SAIL_SPEED = 7;
/** With reduced motion the boat does not glide: each press moves it this far at once. */
export const SAIL_STEP = 2.5;
/** How far south of the islands the boat's own routes run. */
const LANE = 2.5;

export interface SeaBounds {
	minX: number;
	maxX: number;
	minZ: number;
	maxZ: number;
}

const boxes = new WeakMap<World, SeaBounds>();

/** The box the boat stays in: a little water west and east of the row of islands, a little north, more to the south. */
export function seaBounds(world: World): SeaBounds {
	let box = boxes.get(world);
	if (!box) {
		const islands = world.islands;
		box = {
			minX: Math.min(...islands.map((island) => island.center.x - island.radius)) - 8,
			maxX: Math.max(...islands.map((island) => island.center.x + island.radius)) + 8,
			minZ: Math.min(...islands.map((island) => island.center.z - island.radius)) - 3,
			maxZ: Math.max(...islands.map((island) => island.center.z + island.radius)) + 9,
		};
		boxes.set(world, box);
	}
	return box;
}

/** True where the boat may be: inside the box, off every island, and not behind one. */
export function isSea(world: World, point: Point): boolean {
	const box = seaBounds(world);
	if (!(point.x >= box.minX && point.x <= box.maxX && point.z >= box.minZ && point.z <= box.maxZ)) return false;
	for (const island of world.islands) {
		const reach = island.radius + KEEP_OFF;
		const dx = point.x - island.center.x;
		const dz = point.z - island.center.z;
		if (Math.abs(dx) >= reach) continue;
		if (dz < 0 || Math.hypot(dx, dz) < reach) return false;
	}
	return true;
}

/**
 * Where the boat is after being pushed `distance` in a direction (x east, z south). Against an island or the edge
 * of the sea it slides along instead of stopping dead, and it never ends up anywhere `isSea` refuses.
 */
export function steerBoat(world: World, at: Point, direction: Point, distance: number): Point {
	const length = Math.hypot(direction.x, direction.z);
	if (!length || !(distance > 0)) return at;
	const box = seaBounds(world);
	const inBox = (point: Point): Point => ({ x: Math.min(box.maxX, Math.max(box.minX, point.x)), z: Math.min(box.maxZ, Math.max(box.minZ, point.z)) });
	const want = inBox({ x: at.x + (direction.x / length) * distance, z: at.z + (direction.z / length) * distance });
	if (isSea(world, want)) return want;
	const options: Point[] = [];
	/* Round the shore: back out to the edge of the island's circle. */
	for (const island of world.islands) {
		const reach = island.radius + KEEP_OFF;
		const dx = want.x - island.center.x;
		const dz = want.z - island.center.z;
		const out = Math.hypot(dx, dz);
		if (out >= reach || out < 1e-6 || dz < 0) continue;
		const pushed = inBox({ x: island.center.x + (dx / out) * (reach + 1e-3), z: island.center.z + (dz / out) * (reach + 1e-3) });
		/* Sliding never moves the boat further than the push itself would have. */
		if (Math.hypot(pushed.x - at.x, pushed.z - at.z) <= distance * 1.5) options.push(pushed);
	}
	options.push({ x: want.x, z: at.z }, { x: at.x, z: want.z });
	for (const option of options) if (isSea(world, option) && Math.hypot(option.x - at.x, option.z - at.z) > 1e-6) return option;
	return at;
}

/** The island whose harbour the boat is close enough to land at: the nearest one within reach, or null. */
export function landingAt(world: World, at: Point): number | null {
	let best: number | null = null;
	let least = DOCK_REACH;
	for (const island of world.islands) {
		const distance = Math.hypot(at.x - island.harbour.x, at.z - island.harbour.z);
		if (distance < least) {
			least = distance;
			best = island.index;
		}
	}
	return best;
}

/**
 * The way from a place at sea to an island's harbour, as corner points: straight in when the boat is at the
 * harbour's mouth, otherwise south to open water, along it, and north into the harbour. It never crosses land.
 */
export function seaRoute(world: World, from: Point, to: number): Point[] {
	const harbour = world.islands[to]!.harbour;
	if (Math.hypot(from.x - harbour.x, from.z - harbour.z) < DOCK_REACH) return [from, harbour];
	const west = Math.min(from.x, harbour.x);
	const east = Math.max(from.x, harbour.x);
	/* South of every island the boat passes in front of. */
	const passed = world.islands.filter((island) => island.center.x + island.radius + KEEP_OFF > west && island.center.x - island.radius - KEEP_OFF < east);
	const lane = Math.max(from.z, harbour.z, ...passed.map((island) => island.center.z + island.radius + LANE));
	const points = [from, { x: from.x, z: lane }, { x: harbour.x, z: lane }, harbour];
	return points.filter((point, i) => i === 0 || i === points.length - 1 || (Math.hypot(point.x - points[i - 1]!.x, point.z - points[i - 1]!.z) > 0.3 && Math.hypot(point.x - harbour.x, point.z - harbour.z) > 0.3));
}
