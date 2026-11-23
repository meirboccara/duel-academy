import { type Action, PASS, sameAction } from "./action";
import { activateAction, activateEffect, activationWays } from "./activation";
import { closedPriority, type Duel, other, type Priority, type Side } from "./duel";
import { effectOf } from "./effects";
import type { Waiting } from "./events";

/**
 * Step 3 of docs/rules-core-spec.md: trigger points. After a chain resolves, or after an action that starts no chain,
 * the trigger effects waiting in `duel.waiting` are put on a chain, and the players choose them in turn.
 */

interface Stage {
	readonly mandatory: boolean;
	readonly side: "turn player" | "opponent";
}

/** Konami's order for trigger effects put on one chain: whose, and of which kind, a player chooses in any order within one. */
const STAGES = [
	{ mandatory: true, side: "turn player" },
	{ mandatory: true, side: "opponent" },
	{ mandatory: false, side: "turn player" },
	{ mandatory: false, side: "opponent" },
] as const satisfies readonly Stage[];

/** An index in `STAGES`. */
export type StageIndex = 0 | 1 | 2 | 3;
const LAST_STAGE: StageIndex = 3;

/** The trigger effects being put on a chain; the players choose them stage by stage. */
export interface Building {
	/** The index in `STAGES` of the choices being made. */
	readonly stage: StageIndex;
	readonly remaining: readonly Waiting[];
	/** Where priority goes if no trigger ends up on the chain. */
	readonly after: Priority;
	/** Has a trigger effect been put on the chain yet? */
	readonly anyActivated: boolean;
}

type Activate = Extract<Action, { type: "activate" }>;

/** Every way this trigger effect can be activated now: none if its card has moved since, or a condition, limit, cost or target fails. */
function options(duel: Duel, waiting: Waiting): Activate[] {
	const effect = effectOf(duel, waiting);
	const card = duel.cards[waiting.card.id]!;
	if (card.moves !== waiting.card.moves) return [];
	// The teaching chain limit stops us asking for optional effects; a mandatory one still goes on, or the card would resolve differently.
	if (!effect.mandatory && duel.options.chainLimit !== null && duel.chain.length >= duel.options.chainLimit) return [];
	return activationWays(duel, { player: card.controller, card }, waiting.effect, effect).map((way): Activate => activateAction(card.id, waiting.effect, way));
}

/** An "each time" effect waiting twice offers the same action twice: show it once, it will be offered again. */
const distinct = (actions: Activate[]) => actions.filter((action, index) => actions.findIndex((candidate) => sameAction(candidate, action)) === index);

const sideOfStage = (duel: Duel, stage: StageIndex): Side => (STAGES[stage].side === "turn player" ? duel.turn.player : other(duel.turn.player));

/** The effects the player of the current stage chooses among: the right kind, from their cards. */
function candidatesInStage(duel: Duel, building: Building): Waiting[] {
	const { mandatory } = STAGES[building.stage];
	return building.remaining.filter((waiting) => (effectOf(duel, waiting).mandatory === true) === mandatory && waiting.card.controller === sideOfStage(duel, building.stage));
}

/** Puts what is waiting on a chain, or gives priority to `after` when nothing can be activated. */
export function triggerPoint(duel: Duel, after: Priority): Duel {
	const seen = new Set<string>();
	// Only occurrences whose card has not moved since can activate; a stale earlier one must not hide a valid later one.
	const remaining = duel.waiting.filter((waiting) => {
		if (duel.cards[waiting.card.id]!.moves !== waiting.card.moves) return false;
		// An "each time" effect counts occurrences: cards moved at the same time (one batch) are one occurrence.
		const batch = waiting.event.type === "moved" ? waiting.event.batch : undefined;
		if (effectOf(duel, waiting).each && batch === undefined) return true;
		const key = `${waiting.card.id}:${waiting.effect}${effectOf(duel, waiting).each ? `:batch ${batch}` : ""}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	const cleared = { ...duel, waiting: [] };
	if (remaining.length === 0) return { ...cleared, priority: after };
	return advanceToChoice({ ...cleared, building: { stage: 0, remaining, after, anyActivated: false } });
}

/** Moves on until a player has a real choice: a trigger with only one way to activate goes on the chain by itself. */
function advanceToChoice(duel: Duel): Duel {
	let current = duel;
	for (;;) {
		const building = current.building;
		if (!building) return current;
		const all = distinct(candidatesInStage(current, building).flatMap((waiting) => options(current, waiting)));
		if (all.length === 0) {
			if (building.stage === LAST_STAGE) return finish(current);
			current = { ...current, building: { ...building, stage: (building.stage + 1) as StageIndex } };
			continue;
		}
		if (all.length === 1 && STAGES[building.stage].mandatory) {
			current = add(current, all[0]!);
			continue;
		}
		return { ...current, priority: closedPriority(sideOfStage(current, building.stage)) };
	}
}

function finish(duel: Duel): Duel {
	const building = duel.building!;
	const top = duel.chain[duel.chain.length - 1];
	const priority: Priority = building.anyActivated && top ? closedPriority(other(top.player)) : building.after;
	return { ...duel, building: null, priority };
}

function add(duel: Duel, action: Activate): Duel {
	const building = duel.building!;
	const waiting = building.remaining.find((entry) => entry.card.id === action.card && entry.effect === action.effect)!;
	const next = activateEffect(duel, waiting.card.controller, duel.cards[action.card]!, action.effect, { paid: action.paid ?? [], targets: action.targets }, false);
	const remaining = building.remaining.filter((entry) => entry !== waiting);
	return { ...next, building: { ...building, remaining, anyActivated: true } };
}

/** The actions open while the trigger effects are put on a chain. */
export function triggerActions(duel: Duel): Action[] {
	const building = duel.building!;
	const choices = distinct(candidatesInStage(duel, building).flatMap((waiting) => options(duel, waiting)));
	// A mandatory effect must be chosen; an optional one may be declined, which declines the player's other optional effects too.
	return STAGES[building.stage].mandatory ? choices : [PASS, ...choices];
}

/** An optional stage is over for the player: they decline what is left. */
export function declineTriggers(duel: Duel): Duel {
	const building = duel.building!;
	const left = new Set(candidatesInStage(duel, building));
	return advanceToChoice({ ...duel, building: { ...building, remaining: building.remaining.filter((waiting) => !left.has(waiting)) } });
}

/** Does the choice made while building: activating a trigger effect. */
export function chooseTrigger(duel: Duel, action: Activate): Duel {
	return advanceToChoice(add(duel, action));
}
