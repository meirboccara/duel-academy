import type { Duel, Side } from "./duel";

/** Pays Life Points as a cost: the duel with them paid, or `null` when the player has fewer than that. */
export function payLp(duel: Duel, side: Side, amount: number): Duel | null {
	return amount < 0 || duel.lp[side] < amount ? null : { ...duel, lp: { ...duel.lp, [side]: duel.lp[side] - amount } };
}

/**
 * "Pay half your LP". An odd number of Life Points leaves the rounded-up half, so the amount paid is rounded down
 * (125 LP leaves 63). Source: Konami's Japanese Q&A for Dinomorphia Intact, OCG only (record half-lp-odd-rounds-remaining-up).
 */
export function payHalfLp(duel: Duel, side: Side): Duel | null {
	return payLp(duel, side, Math.floor(duel.lp[side] / 2));
}
