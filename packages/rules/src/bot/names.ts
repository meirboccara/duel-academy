import type { Action, Placing } from "../action";
import { act, legalActions } from "../chain";
import type { Duel, Position } from "../duel";

/**
 * Step 9: moves as named choices, for combo lines written as data. A name says what a player would say: "activate terraforming",
 * "attack big > small", "choose umi". It reads card codes, never ids, so the same name means the same move in another duel.
 */

/** The name of an action of `legalActions(duel)`. A card with two or more effect records adds "#n" (1-based) to "activate", an effect with modes ":n" (1-based), a declaration "=value". */
export function actionName(duel: Duel, action: Action): string {
	switch (action.type) {
		case "pass":
		case "pendulum-summon":
			return action.type;
		case "place":
			return `place ${action.zone}`;
		case "declare":
			return `declare ${action.declaration.value}`;
		case "attack":
			return `attack ${codeOf(duel, action.card)} ${action.target === null ? "directly" : `> ${codeOf(duel, action.target)}`}`;
		case "summon":
			// A Normal Summon made in addition to the turn's Normal Summon/Set says so: "summon lv1 additional".
			return `${action.how === "special" ? "special-summon" : "summon"} ${codeOf(duel, action.card)}${action.extra ? " additional" : ""}`;
		case "activate": {
			const code = codeOf(duel, action.card);
			const effect = (duel.defs[code]?.effects?.length ?? 0) > 1 ? ` #${action.effect + 1}` : "";
			const paid = (action.paid ?? []).map((id) => ` ~ ${codeOf(duel, id)}`).join("");
			// An effect with modes: ":n" names the mode chosen (1-based).
			const mode = action.mode === undefined ? "" : ` :${action.mode + 1}`;
			// A declaration made at activation: "=value".
			const declared = action.declared === undefined ? "" : ` =${action.declared.value}`;
			// Coupled targets: "{1,1}" names how many targets go to each group.
			const groups = action.groups === undefined ? "" : ` {${action.groups.join(",")}}`;
			return `activate ${code}${effect}${mode}${declared}${paid}${action.targets.map((id) => ` > ${codeOf(duel, id)}`).join("")}${groups}`;
		}
		default:
			return `${action.type} ${codeOf(duel, action.card)}`;
	}
}

const codeOf = (duel: Duel, id: number): string => duel.cards[id]!.code;

/** A step of a line: a name, then optionally " @z" (the zone of a card placed) and " as attack" / " as defense" (its battle position). */
const STEP = /^(.*?)(?: @(\d+))?(?: as (attack|defense))?$/;

/**
 * The action of `legalActions(duel)` that a step names, with the zone and position the step asks for (else the first listed), or
 * `null` when no legal action has that name or the zone or position asked for is not open.
 */
export function findNamed(duel: Duel, step: string): Action | null {
	const [, name, zoneText, position] = STEP.exec(step.trim())!;
	// Several actions can share a name (two copies of a card): the first that can take the zone and position asked for.
	for (const listed of legalActions(duel)) {
		if (actionName(duel, listed) !== name) continue;
		const found = withChoices(listed, zoneText === undefined ? undefined : Number(zoneText), position as Position | undefined);
		if (found) return found;
	}
	return null;
}

/** The listed action with the zone and position asked for (else the first listed), or `null` when it cannot take them. */
function withChoices(listed: Action, zone: number | undefined, position: Position | undefined): Action | null {
	if (listed.type === "place") return position === undefined ? listed : listed.positions?.includes(position) ? { ...listed, position } : null;
	if (listed.type !== "summon" && listed.type !== "set" && listed.type !== "activate") return zone === undefined && position === undefined ? listed : null;
	const { zones, positions } = listed as Placing;
	if (zone !== undefined && !zones?.includes(zone)) return null;
	if (position !== undefined && !(positions ?? ["attack"]).includes(position)) return null;
	const chosenZone = zone ?? zones?.[0];
	const chosen = position ?? positions?.[0];
	return { ...listed, ...(chosenZone === undefined ? {} : { zone: chosenZone }), ...(chosen === undefined ? {} : { position: chosen }) };
}

/** Where a line stopped: the step that is not legal, its index, and the names offered instead. */
export interface LineFailure {
	readonly index: number;
	readonly step: string;
	readonly offered: readonly string[];
}

/** A line followed as far as it goes: the duel reached, how many steps were played, and the first step that could not be. */
export interface LineResult {
	readonly duel: Duel;
	readonly played: number;
	readonly failed: LineFailure | null;
}

/**
 * Plays a combo line (a list of step names) from `duel`, one `act` per step, and stops cleanly at the first step that is not legal.
 * The steps are one player's decisions; whatever the core does in between (an opponent with nothing to answer passes) happens in
 * `act`. The duel given is not changed.
 */
export function followLine(duel: Duel, steps: readonly string[]): LineResult {
	let next = duel;
	for (let index = 0; index < steps.length; index++) {
		const action = findNamed(next, steps[index]!);
		if (!action) return { duel: next, played: index, failed: { index, step: steps[index]!, offered: legalActions(next).map((legal) => actionName(next, legal)) } };
		next = act(next, action);
	}
	return { duel: next, played: steps.length, failed: null };
}
