import { hexKey, hexToPoint, type Point } from "./hex";
import type { StopStatus } from "./status";
import type { Island } from "./world";

/**
 * Where the child's figure stands on an island, and the way it walks. Nothing is stored: the place comes from
 * the stops' marks, so the figure is in the right spot on any device and after a reload.
 */

/** The figure stands beside a stop, not on it: the stop's ring and its floating mark stay in view. East or west of it. */
export const BESIDE_STOP: Point = { x: 0.8, z: 0.22 };

const isSolved = (status: StopStatus | undefined) => status === "solved" || status === "star";

/**
 * The step of `island.walk` the figure stands at: the stop of the last solved level in course order, or 0 (the
 * dock) when no level of the island is solved yet.
 */
export function standIndex(island: Island, stopStatus: Readonly<Record<string, StopStatus>>): number {
	for (let i = island.stops.length - 1; i >= 0; i--) {
		const stop = island.stops[i]!;
		if (!isSolved(stopStatus[stop.levelId])) continue;
		const at = island.walk.findIndex((hex) => hexKey(hex) === hexKey(stop.hex));
		return Math.max(0, at);
	}
	return 0;
}

/**
 * The exact spot for a step of the walk, relative to the island's centre: the middle of the dock, or beside a stop.
 * The camera looks from the south, so a building or tree just south of the spot would hide the figure: of the two
 * sides of the stop, it takes the one further (east to west) from everything standing in front of it.
 */
export function standPoint(island: Island, index: number): Point {
	const at = hexToPoint(island.walk[index] ?? island.walk[0]!);
	if (index <= 0) return at;
	const z = at.z + BESIDE_STOP.z;
	const clear = (x: number) => Math.min(...island.props.filter((item) => item.z > z + 0.4 && item.z < z + 3.8).map((item) => Math.abs(item.x - x)), 9);
	const east = at.x + BESIDE_STOP.x;
	const west = at.x - BESIDE_STOP.x;
	return { x: clear(west) > clear(east) + 0.01 ? west : east, z };
}

/**
 * The points to walk through from one step of the walk to another, either way round, relative to the island's
 * centre. It follows the road hex by hex and ends on the standing spot of `to`; the start is where the figure is.
 */
export function walkBetween(island: Island, from: number, to: number): Point[] {
	const last = island.walk.length - 1;
	const a = Math.max(0, Math.min(last, from));
	const b = Math.max(0, Math.min(last, to));
	const step = b >= a ? 1 : -1;
	const points: Point[] = [standPoint(island, a)];
	for (let i = a + step; i !== b && step * (b - i) > 0; i += step) points.push(hexToPoint(island.walk[i]!));
	if (b !== a) points.push(standPoint(island, b));
	return points;
}

/** The length of a path, to choose how long the walk lasts. */
export function pathLength(points: readonly Point[]): number {
	let total = 0;
	for (let i = 1; i < points.length; i++) total += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.z - points[i - 1]!.z);
	return total;
}

/** A walk never becomes a wait: short hops take half a second, the longest way round under two. */
export function walkSeconds(length: number): number {
	return Math.max(0.5, Math.min(1.8, length / 4.5));
}
