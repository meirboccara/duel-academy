import type { Action } from "./chain";
import { type Duel, type Link, other, type Priority } from "./duel";
import { type Building, dropWhen, effectOf, type Waiting } from "./events";
import { speedOf } from "./effects";

/**
 * Step 3 of docs/rules-core-spec.md: trigger points. After a chain resolves, or after an action that starts no chain,
 * the trigger effects waiting in `duel.waiting` are put on a chain, and the players choose them in turn.
 */
const NO_TARGETS: readonly number[] = Object.freeze([]);
type Activate = Extract<Action, { type: "activate" }>;

/** Every way this trigger effect can be activated now: none if its card has moved since, or a condition, cost or target fails. */
function options(duel: Duel, waiting: Waiting): Activate[] {
	const effect = effectOf(duel, waiting)!;
	const card = duel.cards[waiting.card.id]!;
	if (card.moves !== waiting.card.moves) return [];
	// The teaching chain limit stops us asking for optional effects; a mandatory one still goes on, or the card would resolve differently.
	if (!effect.mandatory && duel.options.chainLimit !== null && duel.chain.length >= duel.options.chainLimit) return [];
	const ctx = { player: waiting.card.controller, card };
	if (effect.condition && !effect.condition(duel, ctx)) return [];
	if (effect.cost?.can && !effect.cost.can(duel, ctx)) return [];
	if (!effect.targets) return [{ type: "activate", card: card.id, effect: waiting.effect, targets: NO_TARGETS }];
	return effect.targets(duel, ctx).map((target) => ({ type: "activate", card: card.id, effect: waiting.effect, targets: [target] }));
}

const stageSide = (duel: Duel, stage: number) => (stage % 2 === 0 ? duel.turn.player : other(duel.turn.player));

/** The effects the player of the current stage chooses among: the right kind, from their cards. */
function inStage(duel: Duel, building: Building): Waiting[] {
	return building.remaining.filter((waiting) => (effectOf(duel, waiting)!.mandatory === true) === building.stage < 2 && waiting.card.controller === stageSide(duel, building.stage));
}

/** Puts what is waiting on a chain, or gives priority to `after` when nothing can be activated. */
export function triggerPoint(duel: Duel, after: Priority): Duel {
	const seen = new Set<string>();
	// Only occurrences whose card has not moved since can activate; a stale earlier one must not hide a valid later one.
	const remaining = duel.waiting.filter((waiting) => {
		if (duel.cards[waiting.card.id]!.moves !== waiting.card.moves) return false;
		const key = `${waiting.card.id}:${waiting.effect}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	const cleared = { ...duel, waiting: [] };
	if (remaining.length === 0) return { ...cleared, priority: after };
	return settle({ ...cleared, building: { stage: 0, remaining, after, added: false } });
}

/** Moves on until a player has a real choice: a trigger with only one way to activate goes on the chain by itself. */
function settle(duel: Duel): Duel {
	let current = duel;
	for (;;) {
		const building = current.building;
		if (!building) return current;
		const all = inStage(current, building).flatMap((waiting) => options(current, waiting));
		if (all.length === 0) {
			if (building.stage === 3) return finish(current);
			current = { ...current, building: { ...building, stage: (building.stage + 1) as Building["stage"] } };
			continue;
		}
		if (all.length === 1 && building.stage < 2) {
			current = add(current, all[0]!);
			continue;
		}
		return { ...current, priority: { holder: stageSide(current, building.stage), passed: [], open: false } };
	}
}

function finish(duel: Duel): Duel {
	const building = duel.building!;
	const top = duel.chain[duel.chain.length - 1];
	const priority: Priority = building.added && top ? { holder: other(top.player), passed: [], open: false } : building.after;
	return { ...duel, building: null, priority };
}

function add(duel: Duel, action: Activate): Duel {
	const building = duel.building!;
	const waiting = building.remaining.find((entry) => entry.card.id === action.card && entry.effect === action.effect)!;
	const def = duel.defs[waiting.card.code]!;
	const effect = def.effects![action.effect]!;
	const player = waiting.card.controller;
	let next = duel;
	// The link holds the card as it was when activated, before the cost.
	const card = duel.cards[action.card]!;
	if (effect.cost) next = dropWhen(effect.cost.pay(next, { player, card }));
	const link: Link = { player, card, effect: action.effect, speed: speedOf(def, effect), targets: action.targets, categories: effect.categories ?? [], activationNegated: false, effectNegated: false };
	const remaining = building.remaining.filter((entry) => entry !== waiting);
	return { ...next, chain: [...next.chain, link], building: { ...building, remaining, added: true } };
}

/** The actions open while the trigger effects are put on a chain. */
export function triggerActions(duel: Duel): Action[] {
	const building = duel.building!;
	const choices = inStage(duel, building).flatMap((waiting) => options(duel, waiting));
	// A mandatory effect must be chosen; an optional one may be declined, which declines the player's other optional effects too.
	return building.stage < 2 ? choices : [PASS, ...choices];
}

const PASS: Action = Object.freeze({ type: "pass" });

/** An optional stage is over for the player: they decline what is left. */
export function declineTriggers(duel: Duel): Duel {
	const building = duel.building!;
	const left = new Set(inStage(duel, building));
	return settle({ ...duel, building: { ...building, remaining: building.remaining.filter((waiting) => !left.has(waiting)) } });
}

/** Does the choice made while building: activating a trigger effect. */
export function chooseTrigger(duel: Duel, action: Activate): Duel {
	return settle(add(duel, action));
}
