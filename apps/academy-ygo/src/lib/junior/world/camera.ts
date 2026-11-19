import type { Point } from "./hex";

/**
 * How far the camera of the island world stands. Three views: the whole island (while the boat sails by itself, on
 * an island still asleep, or when there is no figure), a close one that follows the child's figure, and one that
 * follows the boat while the child steers it.
 */

/** The camera's vertical field of view, in degrees. */
export const FOV = 40;
/** In the close view, at least this much ground shows left and right of the figure: a tile and a half each way. */
export const CLOSE_SPAN = 3;
/**
 * The close view is never more than this share of the whole-island distance. On an upright phone this is the limit
 * that decides (about half the distance, the owner asked for a closer island); on a wide screen `CLOSE_SPAN` does.
 */
const CLOSE_SHARE = 0.55;

/** How far the close view leans from the figure towards the trainer beside it, and between which distances that fades out. */
const TRAINER_LEAN = 0.4;
const TRAINER_NEAR = 3;
const TRAINER_FAR = 6;

const TALL = Math.tan(((FOV / 2) * Math.PI) / 180);
/* A 0 × 0 canvas (hidden) has no shape and would give an endless distance: keep it sensible. */
const wideOf = (aspect: number) => TALL * Math.max(aspect || 0.3, 0.3);

/**
 * The whole island on a screen of this shape (width / height). A tall phone screen is narrow, so the camera steps
 * back until the island fits across it; a wide one is framed by height.
 */
export function farDistance(radius: number, aspect: number): number {
	const reach = radius + 1.5;
	return Math.max((reach * 0.8) / wideOf(aspect), (reach * 0.95) / TALL, 14);
}

/** Close on the figure: a few tiles around it fill the screen, whatever the island's size. */
export function closeDistance(radius: number, aspect: number): number {
	return Math.min(farDistance(radius, aspect) * CLOSE_SHARE, Math.max(CLOSE_SPAN / wideOf(aspect), CLOSE_SPAN / TALL, 9));
}

/**
 * The close view of a figure standing at `figure` (world position) on an island. The camera looks a little south
 * of it, so the figure shows in the upper half, clear of the buttons at the bottom; and the point looked at never
 * leaves the island, so the view cannot drift out over the sea. `trainer` is where the island's trainer stands.
 */
export function closeView(figure: Point, center: Point, radius: number, aspect: number, trainer: Point | null = null): { target: Point; distance: number } {
	const distance = closeDistance(radius, aspect);
	let x = figure.x - center.x;
	let z = figure.z - center.z + distance * 0.07;
	if (trainer) {
		/* Next to the island's trainer the view leans towards them, so both show; the lean fades out as the figure walks away. */
		const away = Math.hypot(trainer.x - figure.x, trainer.z - figure.z);
		const lean = TRAINER_LEAN * Math.min(1, Math.max(0, (TRAINER_FAR - away) / (TRAINER_FAR - TRAINER_NEAR)));
		x += (trainer.x - figure.x) * lean;
		z += (trainer.z - figure.z) * lean;
	}
	const out = Math.hypot(x, z);
	if (out > radius) {
		x *= radius / out;
		z *= radius / out;
	}
	return { target: { x: center.x + x, z: center.z + z }, distance };
}

/** At sea, at least this much water shows left and right of the boat: room to see where it is going. */
export const SEA_SPAN = 4.5;

/**
 * The view of the boat while the child steers it: a bit further out than the close view on land, and looking a
 * little south of the boat, so it shows above the buttons at the bottom.
 */
export function seaView(boat: Point, aspect: number): { target: Point; distance: number } {
	const distance = Math.max(SEA_SPAN / wideOf(aspect), SEA_SPAN / TALL, 12);
	return { target: { x: boat.x, z: boat.z + distance * 0.05 }, distance };
}
