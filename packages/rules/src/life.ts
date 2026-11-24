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

/**
 * Loses Life Points (battle damage, an effect's damage): never below 0. A player at 0 LP loses; both at 0 at the same time is a draw
 * (RB10, record `lp-zero-wins-both-draw`). `winner` is set once and never changed afterwards.
 */
export function loseLp(duel: Duel, side: Side, amount: number): Duel {
	if (amount <= 0) return duel;
	const lp = { ...duel.lp, [side]: Math.max(0, duel.lp[side] - amount) };
	return { ...duel, lp, winner: duel.winner ?? winnerOf(lp) };
}

/** The player loses the Duel by a rule of the game (a draw from an empty Deck). `winner` is set once and never changed afterwards. */
export const lose = (duel: Duel, side: Side): Duel => (duel.winner ? duel : { ...duel, winner: side === "you" ? "rival" : "you" });

const winnerOf = (lp: Duel["lp"]): Duel["winner"] => (lp.you === 0 && lp.rival === 0 ? "draw" : lp.you === 0 ? "rival" : lp.rival === 0 ? "you" : null);
