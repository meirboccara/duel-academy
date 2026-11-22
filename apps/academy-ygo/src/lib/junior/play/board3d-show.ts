import type { CardId } from "@duel-academy/engine";
import { timeline, type Beat, type Spot } from "./cues";
import type { GameEvent, Position, Side } from "@duel-academy/engine";
import { ATTACK_ART, LUNGE_HIT } from "./board3d-moves";

/**
 * The big moments of a move on the 3D mat, and when each happens: the clash of two monsters with both numbers, a
 * hit that shakes the table, Life Points going down or up. Worked out from the same cues and events as everything
 * else, so the child sees cause, then effect: the charge, the impact, the destroyed monster, then the Life Points.
 * Times are in seconds from the move.
 */

/** Two monsters meet (or a monster reaches a player): the numbers that are compared, shown big while it happens. */
export interface Clash {
	id: string;
	/** Whose monster attacks. */
	side: Side;
	attacker: CardId;
	attackerValue: number;
	from: Spot;
	/** Null for a direct attack: there is nothing to compare with. */
	defender: { card: CardId; value: number; position: Position } | null;
	to: Spot;
	/** Who has the higher number. */
	winner: "attacker" | "defender" | "tie";
	/** When the numbers appear (the charge starts), when the monsters meet, and when the numbers go. */
	start: number;
	hit: number;
	end: number;
}

/** Something hits the table: the scene flashes and bursts there, and the camera shakes with it. */
export interface Impact {
	id: string;
	kind: "clash" | "strike" | "hurt" | "heal";
	at: Spot;
	time: number;
	/** From 0 to 1: how hard. A big loss of Life Points shakes more than a small one. */
	power: number;
}

/** Life Points change: the amount shown big on that player's half of the mat. */
export interface LifeChange {
	id: string;
	side: Side;
	amount: number;
	from: number;
	to: number;
	/** When the number appears, and when the counter starts to roll. */
	start: number;
	roll: number;
}

/** The counter starts to roll this long after the big number appears: the child reads the amount first. */
export const LP_ROLL = 0.3;
/** The clash numbers stay this long after the monsters meet, so the winner can be seen. */
const CLASH_HOLD = 0.9;

/** The battles of a move, in order: each attack that is declared, with the battle (or the direct attack) it led to, if any. */
function battles(events: readonly GameEvent[]): (Extract<GameEvent, { type: "battle" | "direct" }> | null)[] {
	const out: (Extract<GameEvent, { type: "battle" | "direct" }> | null)[] = [];
	for (const event of events) {
		if (event.type === "attack-declared") out.push(null);
		else if ((event.type === "battle" || event.type === "direct") && out.length > 0 && out[out.length - 1] === null) out[out.length - 1] = event;
	}
	return out;
}

export function clashes(events: readonly GameEvent[], beats: readonly Beat[], beat: number): Clash[] {
	const starts = timeline(beats);
	const fights = battles(events);
	const out: Clash[] = [];
	let attack = 0;
	beats.forEach((cues, index) => {
		for (const cue of cues) {
			if (cue.kind !== "beam" || cue.art !== ATTACK_ART) continue;
			const fight = fights[attack++];
			/* An attack that a Trap stopped has no numbers to compare. */
			if (!fight) continue;
			const start = (starts[index] ?? 0) * beat;
			const hit = start + LUNGE_HIT * beat;
			const base = { id: `clash-${index}`, side: fight.side, attacker: fight.attacker, from: cue.from, to: cue.to, start, hit, end: hit + CLASH_HOLD };
			if (fight.type === "direct") out.push({ ...base, attackerValue: fight.amount, defender: null, winner: "attacker" });
			else out.push({ ...base, attackerValue: fight.attackerValue, defender: { card: fight.defender, value: fight.defenderValue, position: fight.defenderPosition }, winner: fight.attackerValue > fight.defenderValue ? "attacker" : fight.attackerValue < fight.defenderValue ? "defender" : "tie" });
		}
	});
	return out;
}

export function lifeChanges(beats: readonly Beat[], beat: number): LifeChange[] {
	const starts = timeline(beats);
	return beats.flatMap((cues, index) => cues.flatMap((cue, order) => (cue.kind === "lp" && cue.to !== cue.from ? [{ id: `lp-${index}-${order}`, side: cue.side, amount: cue.to - cue.from, from: cue.from, to: cue.to, start: (starts[index] ?? 0) * beat, roll: (starts[index] ?? 0) * beat + LP_ROLL }] : [])));
}

/** How hard a loss of Life Points hits: 500 is felt, 2000 or more is as hard as it gets. */
export const hurtPower = (amount: number) => Math.min(1, 0.35 + Math.abs(amount) / 3000);

export function impacts(beats: readonly Beat[], beat: number): Impact[] {
	const starts = timeline(beats);
	const out: Impact[] = [];
	beats.forEach((cues, index) => {
		const start = (starts[index] ?? 0) * beat;
		cues.forEach((cue, order) => {
			const id = `${index}-${order}`;
			if (cue.kind === "beam" && cue.art === ATTACK_ART && cue.from.at === "zone") out.push({ id, kind: "clash", at: cue.to, time: start + LUNGE_HIT * beat, power: 0.7 });
			/* A monster hit by an effect: lightning, the ground opening, an explosion. The clash of a battle already has its own. */
			else if (cue.kind === "strike" && cue.style !== "clash") out.push({ id, kind: "strike", at: cue.spot, time: start + 0.15, power: cue.style === "crack" ? 0.4 : 0.8 });
			else if (cue.kind === "lp" && cue.to < cue.from) out.push({ id, kind: "hurt", at: { at: "lantern", side: cue.side }, time: start + 0.08, power: hurtPower(cue.from - cue.to) });
			else if (cue.kind === "lp" && cue.to > cue.from) out.push({ id, kind: "heal", at: { at: "lantern", side: cue.side }, time: start + 0.08, power: 0 });
		});
	});
	return out;
}

/** How long the table shakes after a hit, in seconds. */
export const SHAKE_TIME = 0.42;
/** How much the camera is pushed at time `t`, from 0 to about 1: every hit shakes, hard at first, then dies away. */
export function shakeAt(hits: readonly Impact[], t: number): number {
	let total = 0;
	for (const hit of hits) {
		const u = (t - hit.time) / SHAKE_TIME;
		if (u >= 0 && u < 1) total += hit.power * (1 - u) * (1 - u);
	}
	return Math.min(1, total);
}

/** How long the big moments of a move go on after its last beat starts: the scene keeps drawing until they are over. */
export function showLength(fights: readonly Clash[], changes: readonly LifeChange[], hits: readonly Impact[]): number {
	return Math.max(0, ...fights.map((item) => item.end), ...changes.map((item) => item.roll + 1.2), ...hits.map((item) => item.time + 0.9));
}
