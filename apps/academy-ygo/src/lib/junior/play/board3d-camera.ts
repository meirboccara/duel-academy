import type { Point3 } from "./board3d-layout";

/**
 * The camera of the 3D duel mat. It never moves by itself: it stands on the child's side, looks down at the mat, and
 * steps back just far enough for the whole mat and the hand to show, whatever the shape of the screen (a phone on its
 * side, an iPad either way, a desktop). Plain numbers, so the page can also work out where a zone is on the screen
 * and lay the HTML effects over it.
 */

/** The vertical field of view, in degrees: narrow, so the far rows are not much smaller than the near ones. */
export const FOV = 34;
/** How steeply the camera looks down, in radians from level. Steep enough to read the numbers on a card lying flat. */
export const PITCH = (62 * Math.PI) / 180;
/** The mat fills at most this share of the screen each way. */
const FILL = 0.94;

export interface View {
	position: Point3;
	target: Point3;
	fov: number;
	aspect: number;
	distance: number;
}

const TALL = Math.tan(((FOV / 2) * Math.PI) / 180);
/* A 0 × 0 canvas (not laid out yet) has no shape: keep the numbers sensible. */
const shapeOf = (aspect: number) => (Number.isFinite(aspect) && aspect > 0 ? Math.min(Math.max(aspect, 0.3), 4) : 1);

/* The camera's own directions: it looks along `ahead`, and `up` is the top of the screen. Right is +x. */
const ahead = { x: 0, y: -Math.sin(PITCH), z: -Math.cos(PITCH) };
const up = { x: 0, y: Math.cos(PITCH), z: -Math.sin(PITCH) };
const dot = (a: Point3, b: Point3) => a.x * b.x + a.y * b.y + a.z * b.z;

/** How far back the camera must stand, looking at `target`, for every point to be on a screen of this shape. */
function distanceFor(points: readonly Point3[], target: Point3, aspect: number): number {
	const tall = TALL * FILL;
	const wide = tall * aspect;
	let distance = 1;
	for (const point of points) {
		const rel = { x: point.x - target.x, y: point.y - target.y, z: point.z - target.z };
		const deep = dot(rel, ahead);
		distance = Math.max(distance, Math.abs(rel.x) / wide - deep, Math.abs(dot(rel, up)) / tall - deep);
	}
	return distance;
}

/** How far off the middle of the screen, up or down, the points are as a whole, seen from `distance`: 0 when the room above and below is the same. */
function leanOf(points: readonly Point3[], target: Point3, distance: number): number {
	let top = -Infinity;
	let bottom = Infinity;
	for (const point of points) {
		const rel = { x: point.x - target.x, y: point.y - target.y, z: point.z - target.z };
		const y = dot(rel, up) / ((distance + dot(rel, ahead)) * TALL);
		top = Math.max(top, y);
		bottom = Math.min(bottom, y);
	}
	return Math.abs(top + bottom) / 2;
}

/**
 * The closest view that shows all the points, with the same room above and below them. The camera looks at a point
 * on the mat's middle line; which one is searched for, because near things look bigger than far ones and the best
 * picture is not centred on the middle. On a screen much taller than the mat many points give the same distance,
 * and the one that centres the mat is taken.
 */
export function fitView(points: readonly Point3[], aspect: number): View {
	const shape = shapeOf(aspect);
	const xs = points.map((point) => point.x);
	const zs = points.map((point) => point.z);
	const x = points.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
	const low = points.length ? Math.min(...zs) : 0;
	const high = points.length ? Math.max(...zs) : 0;
	const at = (z: number) => distanceFor(points, { x, y: 0, z }, shape);
	/* Tried all along the mat: a little distance is given up for a centred picture, never much. */
	const STEPS = 240;
	let best = { z: (low + high) / 2, cost: Infinity };
	for (let step = 0; step <= STEPS; step++) {
		const z = low + ((high - low) * step) / STEPS;
		const distance = at(z);
		const cost = distance * (1 + 0.6 * leanOf(points, { x, y: 0, z }, distance));
		if (cost < best.cost) best = { z, cost };
	}
	const target = { x, y: 0, z: best.z };
	const distance = at(target.z);
	return { position: { x: target.x - ahead.x * distance, y: target.y - ahead.y * distance, z: target.z - ahead.z * distance }, target, fov: FOV, aspect: shape, distance };
}

/** Where a point of the mat is on a canvas of this size, in pixels from its top left corner. `scale` is how many pixels one mat unit is there. */
export function project(view: View, point: Point3, width: number, height: number): { x: number; y: number; scale: number } {
	const rel = { x: point.x - view.position.x, y: point.y - view.position.y, z: point.z - view.position.z };
	const deep = Math.max(dot(rel, ahead), 0.01);
	const half = height / 2 / TALL;
	return { x: width / 2 + (rel.x / deep) * half, y: height / 2 - (dot(rel, up) / deep) * half, scale: half / deep };
}

/** The box on the screen around a flat rectangle of the mat, `w` across and `d` deep, centred on `center`. */
export function projectTile(view: View, center: Point3, w: number, d: number, width: number, height: number): { x: number; y: number; w: number; h: number } {
	const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => project(view, { x: center.x + (sx * w) / 2, y: center.y, z: center.z + (sz * d) / 2 }, width, height)));
	const xs = corners.map((corner) => corner.x);
	const ys = corners.map((corner) => corner.y);
	const x = Math.min(...xs);
	const y = Math.min(...ys);
	return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
