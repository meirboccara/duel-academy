export interface TouchPoint {
	x: number;
	y: number;
}

export type SwipeIntent = "next" | "prev";

/** Shortest horizontal drag, in CSS px, that counts as a swipe. */
const MIN_DISTANCE = 56;
/** The drag must be this many times wider than tall, so scrolling a tall slide never changes slides. */
const HORIZONTAL_DOMINANCE = 1.5;

/**
 * Turns a touch start/end pair into a slide move: drag left for the next slide, right for the previous one.
 * Returns null for taps, short jitters and mostly vertical drags.
 */
export function classifySwipe(start: TouchPoint, end: TouchPoint): SwipeIntent | null {
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	if (Math.abs(dx) < MIN_DISTANCE) return null;
	if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return null;
	return dx < 0 ? "next" : "prev";
}
