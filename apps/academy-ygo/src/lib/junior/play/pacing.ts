import type { GameEvent, Phase, Side } from "@duel-academy/engine";

/**
 * How the rival's turn is paced on screen, step by step, as Master Duel, YGO Omega and EDOPro pace the opponent's
 * (docs/research/opponent-turn-presentation.md §5): a banner for a new turn and for each phase, time to see a Summon
 * or an attack, and the longest pause for a card it activates, so a child can read it.
 */
export const RIVAL_BEATS = {
	/** A card activated, an answer flipped, an ATK changed: read it. */
	activation: 2200,
	/** "Kaiba's turn": the turn banner. */
	turn: 1400,
	/** An attack declared: the arrow, then the clash. */
	attack: 1000,
	/** "Battle Phase": a phase banner. */
	phase: 900,
	/** A monster Summoned or Set. */
	summon: 900,
	/** Anything else, while things are shown moving. */
	step: 700,
	/** Nothing is shown moving (reduced motion): only what must be read waits. */
	still: 250,
} as const;

const ACTIVATIONS = new Set<GameEvent["type"]>(["activated", "sprung", "boosted", "effect-used", "hand-effect", "chain"]);
const SUMMONS = new Set<GameEvent["type"]>(["summoned", "special", "set", "flipped", "pendulum"]);
const ATTACKS = new Set<GameEvent["type"]>(["attack-declared", "battle", "direct"]);

/** How long to wait after a step of the rival's turn, by what it did; `moving`: whether motion is shown. */
export function rivalPause(events: readonly GameEvent[], moving: boolean): number {
	const beats = events.map((event): number => {
		if (ACTIVATIONS.has(event.type)) return RIVAL_BEATS.activation;
		if (!moving) return RIVAL_BEATS.still;
		if (event.type === "turn") return RIVAL_BEATS.turn;
		if (ATTACKS.has(event.type)) return RIVAL_BEATS.attack;
		if (event.type === "phase") return RIVAL_BEATS.phase;
		if (SUMMONS.has(event.type)) return RIVAL_BEATS.summon;
		return RIVAL_BEATS.step;
	});
	return Math.max(moving ? RIVAL_BEATS.step : RIVAL_BEATS.still, ...beats);
}

/** The banner a step shows: a new turn ("Your turn!") before a phase ("Battle Phase"), or none. */
export type TurnBeat = { kind: "turn"; side: Side } | { kind: "phase"; side: Side; phase: Phase };
export function turnBeat(events: readonly GameEvent[]): TurnBeat | null {
	const last = [...events].reverse();
	const turn = last.find((event) => event.type === "turn");
	if (turn?.type === "turn") return { kind: "turn", side: turn.side };
	const phase = last.find((event) => event.type === "phase");
	return phase?.type === "phase" ? { kind: "phase", side: phase.side, phase: phase.phase } : null;
}
