/** What a player can do (steps 2 to 4): see `legalActions` and `act` in chain.ts. */
export type Action =
	| { readonly type: "pass" }
	/** Activate a card or an effect: `effect` is its index in the card's effects, `targets` the cards it targets. */
	| { readonly type: "activate"; readonly card: number; readonly effect: number; readonly targets: readonly number[] }
	/** Set a Spell or Trap from the hand. */
	| { readonly type: "set"; readonly card: number }
	/** The card an effect asked for while it resolves (a choice that is not a target). */
	| { readonly type: "choose"; readonly card: number };

export const PASS: Action = Object.freeze({ type: "pass" });

/** Are these the same action? `b` may be malformed (a caller's guess: missing targets, wrong type), so it is checked, not trusted. */
export function sameAction(a: Action, b: Action): boolean {
	if (a.type !== b.type) return false;
	if (a.type === "pass") return true;
	const other = b as typeof a;
	if (a.card !== other.card) return false;
	if (a.type !== "activate") return true;
	const asked = b as typeof a;
	return a.effect === asked.effect && Array.isArray(asked.targets) && a.targets.length === asked.targets.length && a.targets.every((target, i) => target === asked.targets[i]);
}
