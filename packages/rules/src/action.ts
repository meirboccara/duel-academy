/** What a player can do (steps 2 to 4): see `legalActions` and `act` in chain.ts. */
export type Action =
	| { readonly type: "pass" }
	/**
	 * Activate a card or an effect: `effect` is its index in the card's effects, `targets` the cards it targets, `paid` the
	 * cards chosen to pay its cost (absent when the cost has no choice).
	 */
	| { readonly type: "activate"; readonly card: number; readonly effect: number; readonly targets: readonly number[]; readonly paid?: readonly number[] }
	/** Set a Spell or Trap from the hand. */
	| { readonly type: "set"; readonly card: number }
	/** The card an effect asked for while it resolves (a choice that is not a target). */
	| { readonly type: "choose"; readonly card: number };

export const PASS: Action = Object.freeze({ type: "pass" });

/** Are these two lists of card ids the same, in order? `b` may be malformed (a caller's guess), so it is checked. */
export const sameIds = (a: readonly number[], b: readonly number[] | undefined): boolean => Array.isArray(b) && a.length === b.length && a.every((id, i) => id === b[i]);

/** Are these the same action? `b` may be malformed (a caller's guess: missing targets, wrong type), so it is checked, not trusted. */
export function sameAction(a: Action, b: Action): boolean {
	if (a.type !== b.type) return false;
	if (a.type === "pass") return true;
	const other = b as typeof a;
	if (a.card !== other.card) return false;
	if (a.type !== "activate") return true;
	const asked = b as typeof a;
	return a.effect === asked.effect && sameIds(a.targets, asked.targets) && sameIds(a.paid ?? [], asked.paid ?? []);
}
