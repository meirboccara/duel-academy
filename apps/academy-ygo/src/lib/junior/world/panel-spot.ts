import type { Island } from "./world";

/**
 * Where an island's card panel floats, and how its picture is cut. The panel hangs over the middle of the island,
 * nearer the camera than the far half of the road, so it is moved east or west until no stop stands behind it.
 */

/** Tried in this order: over the landmark first, then further and further to either side, half a unit at a time. */
const SHIFTS = Array.from({ length: 19 }, (_, i) => (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.5 + 0);
/** A stop this far north is wholly behind the panel on screen: it needs room for its mark and for the figure beside it. */
const FAR = -2.5;
const FAR_ROOM = 2;
/** A nearer stop on the far side shows under the panel; only the top of its floating mark needs room. */
const NEAR_ROOM = 1.3;

/**
 * How far east (+) or west (-) of the island's middle the panel floats. `tall` is a landmark the panel cannot
 * float over: then it never stays in the middle either.
 */
export function panelShift(island: Island, tall: boolean): number {
	const behind = island.stops.filter((stop) => stop.at.z < -0.5).map((stop) => ({ x: stop.at.x, room: stop.at.z < FAR ? FAR_ROOM : NEAR_ROOM }));
	/* How much more room than needed the tightest stop gets: 0 or more is clear. */
	const spare = (x: number) => Math.min(...behind.map((stop) => Math.abs(stop.x - x) - stop.room), 9);
	const choices = SHIFTS.filter((x) => !tall || Math.abs(x) >= 2);
	/* When the far road is all stops, the best that exists: between two of them. */
	return choices.find((x) => spare(x) >= 0) ?? choices.reduce((best, x) => (spare(x) > spare(best) + 0.01 ? x : best));
}

/** A picture drawn to cover a window of another shape: how much of the picture shows, and from where (0 to 1). */
export function coverCrop(pictureAspect: number, windowAspect: number): { repeat: [number, number]; offset: [number, number] } {
	if (!(pictureAspect > 0) || !(windowAspect > 0)) return { repeat: [1, 1], offset: [0, 0] };
	if (pictureAspect > windowAspect) {
		const shown = windowAspect / pictureAspect;
		return { repeat: [shown, 1], offset: [(1 - shown) / 2, 0] };
	}
	const shown = pictureAspect / windowAspect;
	return { repeat: [1, shown], offset: [0, (1 - shown) / 2] };
}
