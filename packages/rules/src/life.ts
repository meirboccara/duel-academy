import type { Duel, Side } from "./duel";

/** Pays Life Points as a cost: the duel with them paid, or `null` when the player has fewer than that. */
export function payLp(duel: Duel, side: Side, amount: number): Duel | null {
	return amount < 0 || duel.lp[side] < amount ? null : { ...duel, lp: { ...duel.lp, [side]: duel.lp[side] - amount } };
}

/**
 * "Pay half your LP". The amount paid is rounded up for an odd number of Life Points: this is the core's reading; no
 * Konami page found says how an odd number is halved (tests use even Life Points).
 */
export function payHalfLp(duel: Duel, side: Side): Duel | null {
	return payLp(duel, side, Math.ceil(duel.lp[side] / 2));
}
