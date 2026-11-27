import type { Action } from "../action";
import { act } from "../chain";
import { createDuel, type Duel, type DuelSetup, type Side, startDuel } from "../duel";
import type { CardDef } from "../effects";
import { type DeckPlan, decide, type Level, type Progress } from "./bot";

/**
 * Step 9: the bot's Web Worker protocol (docs/rules-core/step9/design.md, "Worker protocol"). A Duel holds functions (card records,
 * the continuation of a question), which do not cross `postMessage`; the request carries it as its setup and the actions played
 * since, plain data, and the worker rebuilds it with the card records it holds. Wiring it into the app is step 10.
 */

/** What the app sends: the Duel as setup + actions, whose decision it is, and the bot's options (all plain data). */
export interface BotRequest {
	readonly id: number;
	/** Omitted: a positioned fixture (`createDuel`). "play": a real game from `startDuel`. */
	readonly lifecycle?: "fixture" | "play";
	readonly setup: Omit<DuelSetup, "defs">;
	readonly actions: readonly Action[];
	readonly side: Side;
	readonly level: Level;
	readonly seed: number;
	readonly budgetMs?: number;
	readonly plan?: DeckPlan;
	readonly progress?: Progress | null;
}

/** What the worker sends back: the action with its name and the progress to send with the next request, or what went wrong. */
export type BotAnswer = { readonly id: number; readonly action: Action; readonly name: string; readonly progress: Progress | null } | { readonly id: number; readonly error: string };

/** Replays from a fixture by default; "play" includes opening hands and normal turn rules. Throws on illegal actions. */
export function rebuildDuel(setup: Omit<DuelSetup, "defs">, actions: readonly Action[], defs: Readonly<Record<string, CardDef>>, lifecycle: "fixture" | "play" = "fixture"): Duel {
	const start = lifecycle === "play" ? startDuel : createDuel;
	return actions.reduce(act, start({ ...setup, defs }));
}

/** Answers one request. Never throws: a request that cannot be answered gets an error answer. */
export function answerRequest(request: BotRequest, defs: Readonly<Record<string, CardDef>>): BotAnswer {
	try {
		const duel = rebuildDuel(request.setup, request.actions, defs, request.lifecycle);
		const { action, name, progress } = decide(duel, request.side, { level: request.level, seed: request.seed, budgetMs: request.budgetMs, plan: request.plan, progress: request.progress });
		return { id: request.id, action, name, progress };
	} catch (error) {
		return { id: request.id, error: error instanceof Error ? error.message : String(error) };
	}
}

/** The part of a worker's global scope the bot uses (`self` in a Web Worker). */
export interface WorkerScope {
	onmessage: ((event: { readonly data: BotRequest }) => void) | null;
	postMessage(answer: BotAnswer): void;
}

/** Answers every request the scope receives, with these card records. */
export function serveBot(scope: WorkerScope, defs: Readonly<Record<string, CardDef>>): void {
	scope.onmessage = (event) => scope.postMessage(answerRequest(event.data, defs));
}
