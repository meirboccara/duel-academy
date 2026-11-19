/**
 * Hexagon grid of the island world, matching KayKit's tiles: pointy-top hexagons, 2 units across the flat sides,
 * top face at y = 0. A hex is addressed by axial coordinates (q, r).
 *
 * The six sides are numbered 0 to 5. Side `d` faces the angle d × 60° measured from +x towards +z, so in the
 * world +z is "south", towards the camera: sides 1 and 2 face it.
 */
export interface Hex {
	q: number;
	r: number;
}
export interface Point {
	x: number;
	z: number;
}

/** The neighbour across side 0, 1, … 5. */
export const DIRECTIONS: readonly Hex[] = [
	{ q: 1, r: 0 },
	{ q: 0, r: 1 },
	{ q: -1, r: 1 },
	{ q: -1, r: 0 },
	{ q: 0, r: -1 },
	{ q: 1, r: -1 },
];

export const SQRT3 = Math.sqrt(3);
/** Distance from a tile's centre to its corners. */
export const HEX_CORNER = 2 / SQRT3;

export const hexKey = ({ q, r }: Hex) => `${q},${r}`;
export const add = (a: Hex, b: Hex): Hex => ({ q: a.q + b.q, r: a.r + b.r });
export const scale = (a: Hex, k: number): Hex => ({ q: a.q * k, r: a.r * k });
export const neighbour = (hex: Hex, side: number): Hex => add(hex, DIRECTIONS[((side % 6) + 6) % 6]!);
export const opposite = (side: number) => (side + 3) % 6;

export function hexDistance(a: Hex, b: Hex): number {
	const dq = a.q - b.q;
	const dr = a.r - b.r;
	return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** The side of `from` that faces `to`, or -1 when they are not neighbours. */
export function sideTowards(from: Hex, to: Hex): number {
	return DIRECTIONS.findIndex((d) => from.q + d.q === to.q && from.r + d.r === to.r);
}

export function hexToPoint({ q, r }: Hex): Point {
	return { x: 2 * q + r, z: SQRT3 * r };
}

/** The hexes at exactly `k` steps from the centre, in walking order (each one next to the one before). */
export function ring(k: number): Hex[] {
	if (k === 0) return [{ q: 0, r: 0 }];
	const out: Hex[] = [];
	let hex = scale(DIRECTIONS[4]!, k);
	for (let side = 0; side < 6; side++) {
		for (let step = 0; step < k; step++) {
			out.push(hex);
			hex = neighbour(hex, side);
		}
	}
	return out;
}

/** Every hex within `k` steps of the centre. */
export function disk(k: number): Hex[] {
	const out: Hex[] = [];
	for (let i = 0; i <= k; i++) out.push(...ring(i));
	return out;
}
