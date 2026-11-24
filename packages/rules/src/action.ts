import type { Position } from "./duel";
import { type Declaration, sameDeclaration } from "./effects";

/**
 * Step 7: an action that puts a card from the hand onto the field lists `zones`, the exact zones it may go to (from the player's
 * left; 5 and 6 are the shared Extra Monster Zones as `you` see them). The player names one with `zone`; with none, the first.
 */
export interface Placing {
	readonly zones?: readonly number[];
	readonly zone?: number;
	/**
	 * Step 8: the battle positions the monster may be Summoned in, when there is a choice (a Special Summon: face-up Attack or Defense
	 * Position). The player names one with `position`; with none, the first.
	 */
	readonly positions?: readonly Position[];
	readonly position?: Position;
}

/**
 * What a player can do (steps 2 to 4): see `legalActions` and `act` in chain.ts.
 *
 * Step 8: a Summon or Set that needs Tributes or materials (a Level 5 or higher monster, a Synchro, Xyz or Link Monster) is listed
 * once, with no `zones`: the materials are then asked one at a time (`choose`, and `pass` once the cards chosen are enough), then
 * the zone (`place`).
 */
export type Action =
	/** Pass priority; while materials are being chosen (step 8), "these are all". */
	| { readonly type: "pass" }
	/**
	 * Activate a card or an effect: `effect` is its index in the card's effects, `targets` the cards it targets, `paid` the
	 * cards chosen to pay its cost (absent when the cost has no choice), `mode` the mode chosen for an effect with modes.
	 */
	| ({ readonly type: "activate"; readonly card: number; readonly effect: number; readonly targets: readonly number[]; readonly paid?: readonly number[]; readonly mode?: number; readonly declared?: Declaration; readonly groups?: readonly number[] } & Placing)
	/** Set a Spell or Trap from the hand; step 8: or a monster, in face-down Defense Position (a Normal Set, or a Tribute Set). */
	| ({ readonly type: "set"; readonly card: number } & Placing)
	/**
	 * Summon a monster as an action: a Normal Summon (`normal`; a Tribute Summon for a Level 5 or higher monster) or a Special
	 * Summon that starts no chain (`special`: a built-in Special Summon from the hand, or the own procedure of a monster of the Extra
	 * Deck: Synchro, Xyz, Link, contact Fusion). It starts no chain: the Summon is a moment of its own that the opponent may answer
	 * ("would be Summoned") before it succeeds. `extra`: a Normal Summon made "in addition to your Normal Summon/Set" by an effect
	 * that allows one: the player says which of the two they use (Konami's notes on Mausoleum of White), so both are listed.
	 */
	| ({ readonly type: "summon"; readonly card: number; readonly how: "normal" | "special"; readonly extra?: true } & Placing)
	/** Step 8: Flip Summon a face-down monster. Like any Summon, a moment of its own that can be answered. */
	| { readonly type: "flip-summon"; readonly card: number }
	/** Step 8: change a face-up monster's battle position by hand (once per monster per turn). An action that starts no chain. */
	| { readonly type: "change-position"; readonly card: number }
	/** Step 8: Pendulum Summon (once per turn): the monsters are then chosen one at a time, each with its zone. */
	| { readonly type: "pendulum-summon" }
	/** Step 6b: declare an attack with `card` on `target`, or directly (`target: null`). An action that starts no chain. */
	| { readonly type: "attack"; readonly card: number; readonly target: number | null }
	/**
	 * Apply a delayed effect that is due in this phase (src/delayed.ts): `delayed` is its stamp, `card` the card that left it. Not an
	 * activation: it starts no chain.
	 */
	| { readonly type: "apply"; readonly card: number; readonly delayed: number }
	/** The card an effect asked for while it resolves (a choice that is not a target). */
	| { readonly type: "choose"; readonly card: number }
	/** Step 7: the zone asked for while an effect resolves or a monster goes back to its owner (from the player's left). */
	| { readonly type: "place"; readonly zone: number; readonly positions?: readonly Position[]; readonly position?: Position }
	/** What the player declares while an effect resolves (`askDeclare`): one of the values asked. */
	| { readonly type: "declare"; readonly declaration: Declaration };

export const PASS: Action = Object.freeze({ type: "pass" });

/** Are these two lists of card ids the same, in order? `b` may be malformed (a caller's guess), so it is checked. */
export const sameIds = (a: readonly number[], b: readonly number[] | undefined): boolean => Array.isArray(b) && a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Is `asked` the listed action `listed` with a zone it may take: the same action (`sameAction`), and its `zone`, if it names one,
 * among the zones listed. `asked` may be malformed, so it is checked.
 */
export function takes(listed: Action, asked: Action): boolean {
	if (!sameAction(listed, asked)) return false;
	const { zone, position } = asked as Placing;
	// A Summon that lists no positions is in Attack Position: naming it is accepted, anything else is not.
	if (position !== undefined && !((listed as Placing).positions?.includes(position) ?? (listed.type === "summon" && position === "attack"))) return false;
	// The zone of a `place` is the action itself, already compared.
	if (zone === undefined || listed.type === "place") return true;
	const zones = (listed as Placing).zones;
	return zones !== undefined && zones.includes(zone);
}

/** Are these the same action (the zone aside)? `b` may be malformed (a caller's guess: missing targets, wrong type), so it is checked, not trusted. */
export function sameAction(a: Action, b: Action): boolean {
	if (a.type !== b.type) return false;
	if (a.type === "pass" || a.type === "pendulum-summon") return true;
	if (a.type === "place") return a.zone === (b as typeof a).zone;
	if (a.type === "declare") return sameDeclaration(a.declaration, (b as typeof a).declaration);
	const other = b as typeof a;
	if (a.card !== other.card) return false;
	if (a.type === "summon") return a.how === (b as typeof a).how && (a.extra === true) === ((b as typeof a).extra === true);
	if (a.type === "attack") return a.target === (b as typeof a).target;
	if (a.type === "apply") return a.delayed === (b as typeof a).delayed;
	if (a.type !== "activate") return true;
	const asked = b as typeof a;
	return a.effect === asked.effect && a.mode === asked.mode && sameDeclaration(a.declared, asked.declared) && sameIds(a.targets, asked.targets) && sameIds(a.paid ?? [], asked.paid ?? []) && sameIds(a.groups ?? [], asked.groups ?? []);
}
