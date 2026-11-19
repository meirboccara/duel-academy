/**
 * KayKit's road tiles and the sides each one leaves by, read from the models' geometry (sides as in `hex.ts`).
 * A tile turned by `turns` × 60° about +y (three.js `rotation.y`) leaves by each side minus `turns`.
 */
const ROADS = {
	hex_road_A: [0, 3],
	hex_road_B: [3, 5],
	hex_road_C: [3, 4],
	hex_road_D: [1, 3, 5],
	hex_road_E: [0, 3, 5],
	hex_road_F: [0, 1, 3],
	hex_road_G: [2, 3, 4],
	hex_road_H: [0, 2, 3, 4],
	hex_road_I: [1, 2, 4, 5],
	hex_road_K: [1, 2, 3, 4, 5],
	hex_road_J: [0, 1, 2, 3, 4, 5],
	hex_road_M: [3],
} as const;
export type RoadPiece = keyof typeof ROADS;

export interface RoadChoice {
	piece: RoadPiece;
	turns: number;
}

const wrap = (side: number) => ((side % 6) + 6) % 6;

export function exitsOf({ piece, turns }: RoadChoice): number[] {
	return ROADS[piece].map((side) => wrap(side - turns));
}

/** The road tile and turn that leave by exactly `exits`; failing that, the one with the fewest extra exits. */
export function roadPiece(exits: readonly number[]): RoadChoice {
	const wanted = new Set(exits.map(wrap));
	let best: { choice: RoadChoice; extra: number } | undefined;
	for (const piece of Object.keys(ROADS) as RoadPiece[]) {
		for (let turns = 0; turns < 6; turns++) {
			const choice = { piece, turns };
			const have = exitsOf(choice);
			if (![...wanted].every((side) => have.includes(side))) continue;
			const extra = have.length - wanted.size;
			if (!best || extra < best.extra) best = { choice, extra };
		}
	}
	return best!.choice;
}
