/**
 * The only source of randomness in a duel (shuffles, coin tosses, dice). Seeded and resumable, so a duel can be
 * replayed and a board stays a plain value: its `state` is one 32-bit number. Mulberry32.
 */
export interface Rng {
	/** An integer in [0, n). */
	int(n: number): number;
	/** The current state, to store on a board and resume with `createRng(seed, state)`. */
	readonly state: number;
}

export function createRng(seed: number, state: number = seed): Rng {
	let current = state >>> 0;
	const next = () => {
		current = (current + 0x6d2b79f5) >>> 0;
		let t = current;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	return {
		int: (n) => {
			if (!Number.isInteger(n) || n <= 0) throw new RangeError(`rng.int needs a whole number above 0, got ${n}`);
			return Math.floor(next() * n);
		},
		get state() {
			return current;
		},
	};
}
