import { type Action, PASS, sameAction } from "../action";
import { act, legalActions } from "../chain";
import type { Duel, Side } from "../duel";
import { createRng } from "../rng";
import { evaluate } from "./evaluate";
import { actionName, findNamed } from "./names";
import { redeal, type View, viewFor } from "./view";

/**
 * Step 9: the bot (docs/rules-core/step9/design.md, "The bot"). The hybrid of wayfinder ticket #4: a general bot that only chooses
 * among `legalActions` and checks each choice by playing it, per-deck combo lines as data, and determinized Monte Carlo sampling at
 * the expert level. It never reads what its side cannot see: it plays on worlds re-dealt from `viewFor`, never on the real Duel.
 */

export const LEVELS = ["basic", "medium", "strong", "expert"] as const;
/** basic: greedy, no lines; medium: + the main line; strong: + the other lines; expert: + sampling over re-dealt worlds. */
export type Level = (typeof LEVELS)[number];

/** A combo line: the names of one player's moves, in order (see `actionName`; a step may add " @z" and " as defense"). */
export interface ComboLine {
	readonly name: string;
	readonly steps: readonly string[];
}

/** A deck's plan, as data next to the deck: its lines, the first being the main line. */
export interface DeckPlan {
	readonly lines: readonly ComboLine[];
}

/**
 * Where the bot is in its lines, handed back with each decision and given again on the next call (the bot holds no state): the line,
 * how many of its steps have been played, in which turn, and whether it is over (finished or failed) for that turn.
 */
export interface Progress {
	readonly line: string;
	readonly step: number;
	readonly turn: number;
	readonly over?: true;
}

export interface BotOptions {
	readonly level: Level;
	/** The seed of the worlds dealt; the same seed, Duel, plan and progress give the same answer while the budget is not reached. */
	readonly seed?: number;
	/** Time allowed for the decision, in ms (default 1,000; 1,200 for expert). When it runs out the best complete answer so far is given, else the quick choice. */
	readonly budgetMs?: number;
	readonly plan?: DeckPlan;
	readonly progress?: Progress | null;
	/** The clock, in ms (default `performance.now`). Injected: the rules core reads no clock. */
	readonly now?: () => number;
	/** Expert: the worlds sampled per candidate (default 8) and the greedy candidates compared (default 4; a line's step comes on top). */
	readonly samples?: number;
	readonly candidates?: number;
	/** Expert: how many decisions a playout may take before it is scored (default 60). */
	readonly playoutDecisions?: number;
}

export interface Decision {
	readonly action: Action;
	readonly name: string;
	readonly progress: Progress | null;
	/** How it was chosen: the next step of a line, the greedy search, the sampling, or the quick choice (only one action, or no time). */
	readonly via: "line" | "greedy" | "sample" | "quick";
}

const DEFAULT_BUDGET = 1000;
const EXPERT_BUDGET = 1200;
const SAMPLES = 8;
const CANDIDATES = 4;
const PLAYOUT_DECISIONS = 60;
/** Sampling overrides the next step of a line only for a clear gain. */
const LINE_BONUS = 3;
/** Settling a move takes at most this many passes and answers. */
const SETTLE_STEPS = 40;

/** Who must act now: the player asked a question, else the holder of priority; `null` once the Duel is won. */
export function decider(duel: Duel): Side | null {
	if (duel.winner) return null;
	return duel.asking ? duel.asking.player : duel.priority.holder;
}

/** The action the bot chooses for `side`: one of `legalActions(duel)`. */
export const chooseAction = (duel: Duel, side: Side, options: BotOptions): Action => decide(duel, side, options).action;

/** The bot's decision for `side`, with the name of the action and the line progress to hand back next time. */
export function decide(duel: Duel, side: Side, options: BotOptions): Decision {
	if (decider(duel) !== side) throw new Error(`${side} does not hold the decision`);
	const now = options.now ?? (() => performance.now());
	const deadline = now() + (options.budgetMs ?? (options.level === "expert" ? EXPERT_BUDGET : DEFAULT_BUDGET));
	const actions = legalActions(duel);
	const named = (action: Action, progress: Progress | null, via: Decision["via"]): Decision => ({ action, name: actionName(duel, action), progress, via });

	const line = followPlan(duel, side, options);
	const quick = line.action ?? actions[0] ?? PASS;
	if (actions.length <= 1) return named(quick, line.progress, "quick");
	if (line.action && options.level !== "expert") return named(line.action, line.progress, "line");

	const view = viewFor(duel, side);
	const hidden = hasHidden(view);
	// Expert with nothing hidden: sampling would deal the same world every time; the line is played as at strong.
	if (line.action && !hidden) return named(line.action, line.progress, "line");
	const seeds = worldSeeds(options.seed ?? 0, options.samples ?? SAMPLES);
	const ranked = rank(redeal(view, seeds[0]!), side, actions, () => now() > deadline);
	if (ranked.length === 0) return named(quick, line.progress, "quick");
	const count = options.candidates ?? CANDIDATES;
	if (line.action) {
		// Expert: the line's step is a candidate with a bonus, compared by sampling with the best of the greedy search.
		const others = ranked.map(({ action }) => action).filter((action) => !sameAction(action, line.action!));
		const best = sample(view, side, seeds, [line.action, ...others.slice(0, Math.max(0, count))], 0, options, now, deadline);
		// Another move won: the line has not moved on, and its step is offered again next time.
		return best && best !== line.action ? named(best, options.progress ?? null, "sample") : named(line.action, line.progress, "line");
	}
	if (options.level === "expert" && hidden) {
		const best = sample(view, side, seeds, ranked.slice(0, count).map(({ action }) => action), -1, options, now, deadline);
		if (best) return named(best, line.progress, "sample");
	}
	return named(ranked[0]!.action, line.progress, "greedy");
}

/** The seeds of the worlds dealt for one decision, drawn from the bot's seed. */
function worldSeeds(seed: number, count: number): number[] {
	const rng = createRng(seed);
	return Array.from({ length: Math.max(1, count) }, () => rng.int(0x7fffffff));
}

const hasHidden = (view: View): boolean => [view.unknown.you, view.unknown.rival].some((pools) => pools.main.length + pools.extra.length > 0);

interface Scored {
	readonly action: Action;
	readonly score: number;
}

/**
 * The greedy search: each action played on the world and settled, best first (a tie keeps the listing's order). An action the world
 * does not allow is left out. Stops early when `late` says the time is up, with what it has scored.
 */
function rank(world: Duel, side: Side, actions: readonly Action[], late: () => boolean): Scored[] {
	const scored: Scored[] = [];
	for (const action of actions) {
		if (late()) break;
		const after = tryAct(world, action);
		if (after) scored.push({ action, score: evaluate(settle(after), side) });
	}
	return scored.map((entry, index) => ({ entry, index })).sort((a, b) => b.entry.score - a.entry.score || a.index - b.index).map(({ entry }) => entry);
}

function tryAct(duel: Duel, action: Action): Duel | null {
	try {
		return act(duel, action);
	} catch {
		return null;
	}
}

/** Is the game state open, with nothing going on: where a move has finished happening. */
const settled = (duel: Duel): boolean => duel.winner !== null || (duel.priority.open && duel.chain.length === 0 && !duel.asking && !duel.building && !duel.summoning && !duel.battle);

/**
 * The Duel once a move has finished happening, as if nobody answered it: every player passes, a question takes its first answer,
 * until the game state is open again (or the turn has changed).
 */
function settle(duel: Duel): Duel {
	let next = duel;
	const turn = duel.turn.number;
	for (let step = 0; step < SETTLE_STEPS && !settled(next) && next.turn.number === turn; step++) {
		const actions = legalActions(next);
		const action = next.asking ? (actions.find((candidate) => candidate.type !== "pass") ?? actions[0]) : (actions.find((candidate) => candidate.type === "pass") ?? actions[0]);
		if (!action) break;
		// A move a dealt world refuses ends the settling where it stands.
		const after = tryAct(next, action);
		if (!after) break;
		next = after;
	}
	return next;
}

/**
 * Determinized sampling: each candidate is played on the same worlds dealt from the view, then both players play on with the greedy
 * policy to the end of the next turn, and the board is scored; the best mean wins. Worlds are taken one at a time across all the
 * candidates, so when time runs out every candidate has the same worlds. `bonusFor` is the candidate given `LINE_BONUS` (-1: none).
 * `null` when not even one world could be played for every candidate.
 */
function sample(view: View, side: Side, seeds: readonly number[], candidates: readonly Action[], bonusFor: number, options: BotOptions, now: () => number, deadline: number): Action | null {
	if (candidates.length < 2) return null;
	const totals = candidates.map(() => 0);
	const counts = candidates.map(() => 0);
	let rounds = 0;
	const decisions = options.playoutDecisions ?? PLAYOUT_DECISIONS;
	outer: for (const seed of seeds) {
		const world = redeal(view, seed);
		// A world counts only once every candidate has been played on it.
		const scores: (number | null)[] = [];
		const late = () => now() > deadline;
		for (const candidate of candidates) {
			if (late()) break outer;
			const after = tryAct(world, candidate);
			const end = after && playout(after, view.duel.turn.number + 1, decisions, late);
			// Time ran out during the playout: this world is not complete, and is not counted.
			if (after && !end && late()) break outer;
			scores.push(end ? evaluate(end, side) : null);
		}
		scores.forEach((score, i) => {
			if (score === null) return;
			totals[i]! += score;
			counts[i]!++;
		});
		rounds++;
	}
	if (rounds === 0) return null;
	let best = -1;
	let bestScore = -Infinity;
	for (let i = 0; i < candidates.length; i++) {
		if (counts[i] === 0) continue;
		const mean = totals[i]! / counts[i]! + (i === bonusFor ? LINE_BONUS : 0);
		if (mean > bestScore) {
			best = i;
			bestScore = mean;
		}
	}
	return best < 0 ? null : candidates[best]!;
}

/**
 * Both players play the greedy policy on a world until the end of turn `lastTurn` (or `decisions` decisions). `null` when the time ran
 * out on the way (`late`, read before each decision and between the moves ranked), or when the world refused a move.
 */
function playout(duel: Duel, lastTurn: number, decisions: number, late: () => boolean): Duel | null {
	let next = duel;
	for (let step = 0; step < decisions && !next.winner && next.turn.number <= lastTurn; step++) {
		if (late()) return null;
		const who = decider(next)!;
		const actions = legalActions(next);
		if (actions.length === 0) break;
		const action = actions.length === 1 ? actions[0]! : rank(next, who, actions, late)[0]?.action;
		if (!action || late()) return null;
		const after = tryAct(next, action);
		if (!after) return null;
		next = after;
	}
	return next;
}

/** The next step of a line, if one applies now, and the progress to hand back. */
function followPlan(duel: Duel, side: Side, options: BotOptions): { action: Action | null; progress: Progress | null } {
	const { level, plan } = options;
	const lines = level === "basic" || !plan ? [] : level === "medium" ? plan.lines.slice(0, 1) : plan.lines;
	const turn = duel.turn.number;
	const progress = options.progress?.turn === turn ? options.progress : null;
	if (lines.length === 0) return { action: null, progress: options.progress ?? null };
	/** Where a line that cannot go on has failed: an open state of the side's own turn, or a question to it. Elsewhere a step waits. */
	const failsHere = duel.asking !== null || (settled(duel) && duel.turn.player === side);
	if (progress && !progress.over) {
		const current = lines.find((line) => line.name === progress.line);
		const step = current?.steps[progress.step];
		if (current && step !== undefined) {
			const action = findNamed(duel, step);
			if (action) return { action, progress: { ...progress, step: progress.step + 1 } };
			if (!failsHere) return { action: null, progress };
			// Strong and expert switch to another line that shares the steps played so far and can go on.
			const played = current.steps.slice(0, progress.step);
			for (const other of lines) {
				if (other === current || !played.every((name, i) => other.steps[i] === name) || other.steps[progress.step] === undefined) continue;
				const switched = findNamed(duel, other.steps[progress.step]!);
				if (switched) return { action: switched, progress: { line: other.name, step: progress.step + 1, turn } };
			}
		}
		return { action: null, progress: { ...progress, over: true } };
	}
	if (progress || !(settled(duel) && duel.turn.player === side)) return { action: null, progress };
	for (const line of lines) {
		const first = line.steps[0];
		const action = first === undefined ? null : findNamed(duel, first);
		if (action) return { action, progress: { line: line.name, step: 1, turn } };
	}
	return { action: null, progress: null };
}
