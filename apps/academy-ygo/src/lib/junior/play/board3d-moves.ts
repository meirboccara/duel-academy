import type { CardId } from "./cards";
import { beatLength, spotKey, timeline, type Beat, type LeaveHow, type Spot } from "./cues";
import type { Board } from "./engine";

/**
 * What the cards themselves do on the 3D mat while a move plays: which cards fly from one place to another, and
 * which monster lunges at its target. Worked out from the same cues as the HTML effects, with the same timing, so the
 * 3D mat shows the same story. Times are in seconds from the move.
 */

/** A card that leaves a place for another. Until its moment comes, a card that stood in a zone still stands there. */
export interface Flight {
	id: string;
	/** Null for a face-down card. */
	card: CardId | null;
	how: LeaveHow;
	from: Spot;
	to: Spot;
	/** When it starts to move, and for how long. */
	start: number;
	length: number;
	/** True for a card that stood in a zone: it is shown there from the start. */
	stands: boolean;
	/** True for a monster that stood in Defense Position: it leaves turned sideways. */
	turned: boolean;
}

/** A monster that attacks: it rises, charges at its target and comes back. `key` is the zone it stands in, `from` that zone. */
export interface Lunge {
	key: string;
	from: Spot;
	to: Spot;
	start: number;
	length: number;
}

/** The sign the cues give an attack. */
export const ATTACK_ART = "⚔️";
/** Cards that leave in the same beat follow each other this closely, and a destroyed card first shakes this long. */
const FOLLOW = 0.08;
const SHAKE = 0.2;
/** An attack lasts this many beats, and the monsters meet this far into it (a share of one beat, so of the charge's first part). */
const LUNGE_BEATS = 1.3;
export const LUNGE_HIT_SHARE = 0.46;
/** When the attacker reaches its target, in beats from the start of the attack. */
export const LUNGE_HIT = LUNGE_BEATS * LUNGE_HIT_SHARE;
/** A destroyed card takes longer than the others: it breaks into pieces first, then the pieces fly to the Graveyard. */
const BREAK_BEATS = 1.5;

export function flights(before: Board, beats: readonly Beat[], beat: number): Flight[] {
	const starts = timeline(beats);
	const out: Flight[] = [];
	beats.forEach((cues, index) => {
		let leaving = 0;
		for (const cue of cues) {
			if (cue.kind !== "leave") continue;
			const stands = cue.from.at === "zone";
			const slot = cue.from.at === "zone" && cue.from.row === "monsters" ? before[cue.from.side].monsters[cue.from.zone] : null;
			out.push({
				id: `${index}-${cue.order}`,
				card: cue.card,
				how: cue.how,
				from: cue.from,
				to: cue.to,
				start: (starts[index] ?? 0) * beat + leaving * FOLLOW + (cue.how === "destroyed" ? SHAKE : 0),
				length: cue.how === "destroyed" ? beat * BREAK_BEATS : beat,
				stands,
				turned: slot?.position === "defense",
			});
			leaving++;
		}
	});
	return out;
}

export function lunges(beats: readonly Beat[], beat: number): Lunge[] {
	const starts = timeline(beats);
	return beats.flatMap((cues, index) => cues.flatMap((cue) => (cue.kind === "beam" && cue.art === ATTACK_ART && cue.from.at === "zone" ? [{ key: spotKey(cue.from), from: cue.from, to: cue.to, start: (starts[index] ?? 0) * beat, length: beat * LUNGE_BEATS }] : [])));
}

/** How long the whole move plays, in seconds: the scene keeps drawing frames until then. */
export function playLength(beats: readonly Beat[], beat: number): number {
	return beats.reduce((total, cues) => total + beatLength(cues), 0) * beat + SHAKE + beat * (BREAK_BEATS - 1) + 0.6;
}

const ease = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

/**
 * An attacker at the share `u` of its attack, from 0 to 1: how far towards its target it is (0 in its zone, 1 at the
 * target), how high it is lifted, how much bigger it looks and how far it leans forward. It rises and grows, so the
 * child sees who attacks; then it charges, hits, and comes back.
 */
export function lungeAt(u: number): { reach: number; lift: number; grow: number; lean: number } {
	if (u <= 0 || u >= 1) return { reach: 0, lift: 0, grow: 0, lean: 0 };
	const rise = 0.26;
	const hold = 0.6;
	if (u < rise) {
		const up = ease(u / rise);
		return { reach: -0.1 * up, lift: 0.85 * up, grow: 0.3 * up, lean: 0.25 * up };
	}
	if (u < LUNGE_HIT_SHARE) {
		const dash = ease((u - rise) / (LUNGE_HIT_SHARE - rise));
		return { reach: -0.1 + 0.9 * dash, lift: 0.85 - 0.5 * dash, grow: 0.3, lean: 0.25 + 0.45 * dash };
	}
	if (u < hold) return { reach: 0.8, lift: 0.35, grow: 0.3, lean: 0.7 };
	const back = ease(clamp01((u - hold) / (1 - hold)));
	return { reach: 0.8 * (1 - back), lift: 0.35 * (1 - back), grow: 0.3 * (1 - back), lean: 0.7 * (1 - back) };
}

/** A monster that is hit: how far it is knocked back (in card widths) at this many seconds after the hit. It recoils and springs back. */
export function knockAt(seconds: number): number {
	const u = seconds / 0.34;
	if (u <= 0 || u >= 1) return 0;
	return 0.32 * Math.sin(u * Math.PI) * (1 - u * 0.5);
}

/**
 * Where a flying card is along its way, from 0 to 1: how far, how high above the straight line, how big, how much it
 * has spun (in turns), how much it shakes sideways and how far apart its pieces are. A destroyed card shakes, breaks
 * into pieces that jump apart, then the pieces fly together to the Graveyard; a banished one spins away.
 */
export function flightAt(how: LeaveHow, u: number): { along: number; arc: number; scale: number; spin: number; shake: number; burst: number; shown: boolean } {
	if (u < 0) {
		/* A destroyed card shakes in its zone just before it breaks. */
		const shaking = how === "destroyed" && u > -SHAKE * 2;
		return { along: 0, arc: 0, scale: 1, spin: 0, shake: shaking ? Math.sin(u * 60) * 0.06 : 0, burst: 0, shown: true };
	}
	if (u >= 1) return { along: 1, arc: 0, scale: 0, spin: 0, shake: 0, burst: 0, shown: false };
	if (how === "destroyed") {
		const breaking = 0.32;
		if (u < breaking) {
			const out = u / breaking;
			return { along: 0, arc: 0, scale: 1, spin: 0, shake: 0, burst: 1 - (1 - out) * (1 - out), shown: true };
		}
		const v = (u - breaking) / (1 - breaking);
		const along = ease(v);
		return { along, arc: Math.sin(v * Math.PI), scale: 1 - 0.55 * along * along, spin: 0, shake: 0, burst: 1 - 0.8 * along, shown: true };
	}
	const along = ease(u);
	const arc = Math.sin(u * Math.PI);
	if (how === "banished") return { along, arc, scale: 1 - 0.8 * along, spin: 2 * along, shake: 0, burst: 0, shown: true };
	if (how === "revive" || how === "draw") return { along, arc, scale: 0.6 + 0.4 * along, spin: 0, shake: 0, burst: 0, shown: true };
	return { along, arc, scale: 1 - 0.35 * along * along, spin: 0, shake: 0, burst: 0, shown: true };
}

/** The pieces a destroyed card breaks into: two across, three down. */
export const PIECES = { across: 2, down: 3 } as const;
/** Where piece number `index` flies when the card breaks: away from the card's middle, each a little differently, in card widths. */
export function pieceThrow(index: number): { x: number; y: number; z: number; turn: number } {
	const column = index % PIECES.across;
	const row = Math.floor(index / PIECES.across);
	const x = (column - (PIECES.across - 1) / 2) * 0.9;
	const z = (row - (PIECES.down - 1) / 2) * 0.75;
	/* Not random: the same card breaks the same way every time, so a replay looks the same. */
	const wobble = Math.sin(index * 12.9898) * 0.5;
	return { x: x + wobble * 0.25, y: 0.55 + 0.35 * Math.abs(Math.cos(index * 4.1)), z: z - wobble * 0.2, turn: (index % 2 === 0 ? 1 : -1) * (1.2 + Math.abs(wobble)) };
}
