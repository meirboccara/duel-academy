import type { Action } from "./action";
import { type CardInstance, type CardRef, type Destruction, type Duel, isStill, other, type Phase, PHASES, refOf, type Side } from "./duel";
import type { GameEvent } from "./events";
import type { EffectSource } from "./modifiers";

/**
 * Real-deck readiness (steps 3 to 6): what a resolved effect leaves to be done later, without activating again.
 *
 * - **Delayed effects** (`Duel.delayed`, `delay`): "during the End Phase of this turn, destroy it", "during your opponent's next End
 *   Phase ...", "at the start of the next Standby Phase ...". They live in the Duel, not on their source, so they survive the source
 *   leaving the field; one that is about a card (`card`) is about the card as it was (a card that moved is a new card, and nothing is
 *   applied to it). Several resolved copies leave one each. In their phase, their player applies them with an `apply` action, which
 *   starts no chain: nothing is done just because the phase began. The turn player holds priority first; the other player gets theirs
 *   when the turn player passes. A player cannot pass in an open game state while they hold a mandatory one that is due (so the phase
 *   cannot end before it is applied), and orders them, and their other actions, as they wish. Choices made while one is applied are
 *   its player's (`ask`). That they start no chain, their tie to the card and this ordering are YGOProJudge's answers (asked
 *   2026-11-24, no source cited); Konami's notes on Mulcharmy Fuwalos give "no Chain Link" for that card's End Phase clause.
 * - **Watches** (`Duel.watches`, `watch`): "for the rest of this turn, each time your opponent Special Summons ..., immediately draw 1
 *   card". Applied at once when the event is raised, also while a chain resolves, with no Chain Link; events that happened at the same
 *   time (one `batch`: a Pendulum Summon of several monsters) count once; several resolved copies each apply (Konami's notes on
 *   Mulcharmy Fuwalos, OCG only: card records `notes-no-chain`, `notes-per-summon`, `notes-stacks`). A watch's `apply` must not ask
 *   for a choice.
 */

/** When a delayed effect is due: in that phase of that turn (the turn's number). */
export interface Due {
	readonly phase: Phase;
	readonly turn: number;
}

export interface Delayed {
	/** Its place in the order things began to apply (`Duel.clock`): what an `apply` action names. */
	readonly stamp: number;
	/** Whose effect it is: who applies it and makes its choices. */
	readonly player: Side;
	/** The card whose resolved effect left it, as it was when activated, and which of its effects. */
	readonly source: CardInstance;
	readonly effect: number;
	readonly due: Due;
	/** The card it is about, as it was: once that card has moved, nothing is applied. */
	readonly card?: CardRef;
	/** "You must" / plain wording (`true`): the phase cannot end before it is applied. "You can" (`false`): its player may let the phase end. */
	readonly mandatory: boolean;
	/** A condition read when it would be applied ("if the number of cards in your hand is more than ..."): while it fails, nothing is offered or owed. */
	readonly condition?: (duel: Duel, self: Delayed) => boolean;
	/** What it does. It may ask its player for a choice (`ask`, `askUpTo`...). */
	readonly apply: (duel: Duel, self: Delayed) => Duel;
}

export interface Watch {
	readonly stamp: number;
	readonly player: Side;
	readonly source: CardInstance;
	readonly effect: number;
	/** The number of the turn at whose end it stops. */
	readonly until: number;
	/** Does this event count? */
	readonly event: (duel: Duel, event: GameEvent, self: Watch) => boolean;
	/** What is done at once, each time. It must not ask for a choice. */
	readonly apply: (duel: Duel, self: Watch, event: GameEvent) => Duel;
	/** The last group of simultaneous events it was applied for (`type:batch`): the others of that group do not count again. */
	readonly lastBatch?: string;
}

/** Leaves a delayed effect of `by` (the resolving link): due in `due`, applied by `by.player`. */
export function delay(duel: Duel, by: EffectSource, spec: { readonly due: Due; readonly card?: CardInstance | CardRef; readonly mandatory: boolean; readonly condition?: Delayed["condition"]; readonly apply: Delayed["apply"] }): Duel {
	const stamp = duel.clock + 1;
	const entry: Delayed = {
		stamp,
		player: by.player,
		source: by.card,
		effect: by.effect ?? 0,
		due: spec.due,
		mandatory: spec.mandatory,
		apply: spec.apply,
		...(spec.card ? { card: refOf(spec.card as CardInstance) } : {}),
		...(spec.condition ? { condition: spec.condition } : {}),
	};
	return { ...duel, clock: stamp, delayed: [...duel.delayed, entry] };
}

/** Leaves a lingering operation of `by` (the resolving link), applied each time `event` accepts an event, until the end of turn `until`. */
export function watch(duel: Duel, by: EffectSource, spec: { readonly until: number; readonly event: Watch["event"]; readonly apply: Watch["apply"] }): Duel {
	const stamp = duel.clock + 1;
	return { ...duel, clock: stamp, watches: [...duel.watches, { stamp, player: by.player, source: by.card, effect: by.effect ?? 0, until: spec.until, event: spec.event, apply: spec.apply }] };
}

/** The destruction a delayed effect or a watch does: by its source's effect, as `effectDestruction` for a link. */
export const delayedDestruction = (self: Pick<Delayed, "source" | "player" | "effect">): Destruction => ({ cause: "effect", source: self.source, player: self.player, effect: self.effect });

/**
 * The number of the next turn in which `phase` begins, counted from now: this turn if the phase is still to come (and the turn is
 * `whose`, when given), else the next turn (of `whose`). "During your opponent's next End Phase": `nextPhaseTurn(duel, "end", other(player))`;
 * "at the start of the next Standby Phase": `nextPhaseTurn(duel, "standby")`. A phase already begun is not "the next".
 */
export function nextPhaseTurn(duel: Duel, phase: Phase, whose?: Side): number {
	const { player, number } = duel.turn;
	const ahead = PHASES.indexOf(duel.turn.phase) < PHASES.indexOf(phase);
	if (ahead && (whose === undefined || whose === player)) return number;
	return whose === undefined || whose === other(player) ? number + 1 : number + 2;
}

const BATCHED: ReadonlySet<GameEvent["type"]> = new Set(["moved", "added-to-hand", "summoned"]);

/** An event was raised: each watch that counts it is applied at once, in the order they began (called by `raiseEvent`). */
export function runWatches(duel: Duel, event: GameEvent): Duel {
	let next = duel;
	const batch = BATCHED.has(event.type) && (event as { batch?: number }).batch !== undefined ? `${event.type}:${(event as { batch?: number }).batch}` : null;
	for (const { stamp } of duel.watches) {
		const self = next.watches.find((entry) => entry.stamp === stamp);
		if (!self || next.winner) continue;
		if (batch !== null && self.lastBatch === batch) continue;
		if (!self.event(next, event, self)) continue;
		if (batch !== null) next = { ...next, watches: next.watches.map((entry) => (entry === self ? { ...entry, lastBatch: batch } : entry)) };
		next = self.apply(next, self, event);
	}
	return next;
}

/** Is the delayed effect one its player could apply now: its phase and turn, its card still the card it was, its condition met? */
function dueNow(duel: Duel, entry: Delayed): boolean {
	if (entry.due.phase !== duel.turn.phase || entry.due.turn !== duel.turn.number) return false;
	if (entry.card && !isStill(duel, entry.card)) return false;
	return entry.condition ? entry.condition(duel, entry) : true;
}

/** Delayed effects are applied in an open game state, with nothing else going on. */
const calm = (duel: Duel): boolean => duel.chain.length === 0 && duel.priority.open && !duel.battle && !duel.summoning;

/** The delayed effects the holder of priority may apply now. `out`: where to list them; returns whether there is one. */
export function delayedActions(duel: Duel, out: Action[] | null, only?: number): boolean {
	if (duel.delayed.length === 0 || !calm(duel)) return false;
	const player = duel.priority.holder;
	let found = false;
	for (const entry of duel.delayed) {
		if (entry.player !== player || (only !== undefined && entry.source.id !== only) || !dueNow(duel, entry)) continue;
		if (!out) return true;
		out.push({ type: "apply", card: entry.source.id, delayed: entry.stamp });
		found = true;
	}
	return found;
}

/** Must the holder of priority apply a delayed effect before passing: an open game state, and a mandatory one of theirs is due? */
export function mustApply(duel: Duel): boolean {
	if (duel.delayed.length === 0 || !calm(duel)) return false;
	const player = duel.priority.holder;
	return duel.delayed.some((entry) => entry.mandatory && entry.player === player && dueNow(duel, entry));
}

/** Takes the delayed effect out of the Duel and applies it. What follows (triggers, priority) is the caller's (`act`). */
export function applyDelayed(duel: Duel, stamp: number): Duel {
	const entry = duel.delayed.find((candidate) => candidate.stamp === stamp);
	if (!entry) return duel;
	return entry.apply({ ...duel, delayed: duel.delayed.filter((candidate) => candidate !== entry) }, entry);
}

/** A phase or a turn began: the delayed effects whose phase is over are gone, and the watches of a turn that ended. */
export function expireDelayed(duel: Duel): Duel {
	if (duel.delayed.length === 0 && duel.watches.length === 0) return duel;
	const { number, phase } = duel.turn;
	const at = PHASES.indexOf(phase);
	const delayed = duel.delayed.filter((entry) => entry.due.turn > number || (entry.due.turn === number && PHASES.indexOf(entry.due.phase) >= at));
	const watches = duel.watches.filter((entry) => entry.until >= number);
	return delayed.length === duel.delayed.length && watches.length === duel.watches.length ? duel : { ...duel, delayed, watches };
}
