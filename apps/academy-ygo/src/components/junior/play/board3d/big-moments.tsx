"use client";

import { motion } from "motion/react";
import type { Clash, LifeChange } from "@/lib/junior/play/board3d-show";
import { LP_ROLL } from "@/lib/junior/play/board3d-show";
import type { CardId } from "@/lib/junior/play/cards";
import type { PlayCopy } from "@/lib/junior/play/copy";
import type { Side } from "@/lib/junior/play/engine";
import { COLOR, at, centred, type CardSize, type Finder, type Place } from "../effect-kit";
import { CardArt } from "../mini-board";

/**
 * The big moments of a move, written large over the 3D mat so a child cannot miss them: the two numbers of a battle
 * with the winner's growing, the Life Points lost or gained flying from the player's half of the mat to the
 * counter, the card that acts shown big with a pulse of light. All decorative (the sentence beside the mat says the
 * same), and timed after the cards' own motion so the cause is seen before the effect.
 *
 * With motion off (calm mode, or the device's setting) only the Life Points amount is shown, and it just fades in
 * and out where it stands, on the player's half of the mat: nothing flies, nothing shakes.
 */

/** What the HTML effects know about the 3D mat they are laid over. */
export interface Stage3d {
	/** A card lying in the middle of the mat, on the screen. */
	card: CardSize;
	/** Each player's half of the mat, on the screen. */
	half: (side: Side) => Place;
	/** The size of the big numbers, in pixels: they grow with the room the mat has. */
	big: number;
}

const SIDE_COLOR: Record<Side, string> = { you: COLOR.arcane, rival: COLOR.ember };
/** White letters with a dark edge: readable over any card or zone. */
const outline = (color: string) => ({ color, WebkitTextStroke: "2px #05070f", paintOrder: "stroke fill" as const, textShadow: "0 3px 0 #05070f, 0 0 18px rgba(5,7,15,0.9)" });

/** One number of a battle on its plate: the monster's picture, ATK or DEF, and the number. */
function Plate({ card, label, value, side, size, role, start, hit, end }: { card: CardId; label: string; value: number; side: Side; size: number; role: "winner" | "loser" | "even"; start: number; hit: number; end: number }) {
	const length = end - start;
	const when = Math.min(0.9, (hit - start) / length);
	const after = Math.min(0.97, when + 0.16);
	/* Until the monsters meet both numbers are the same size; then the higher one grows and the lower one fades back. */
	const scale = role === "winner" ? [1, 1, 1.45, 1.3] : role === "loser" ? [1, 1, 0.78, 0.78] : [1, 1, 1.1, 1];
	const opacity = role === "loser" ? [1, 1, 0.5, 0.5] : [1, 1, 1, 1];
	return (
		<motion.span
			data-plate={role}
			className="flex items-center gap-2 rounded-2xl border-4 bg-ink-950/90 px-3 py-1"
			style={{ borderColor: SIDE_COLOR[side], boxShadow: role === "winner" ? `0 0 0 0 ${COLOR.gold}` : undefined }}
			initial={{ scale: 1, opacity: 1 }}
			animate={{ scale, opacity, ...(role === "winner" ? { boxShadow: [`0 0 0px ${COLOR.gold}`, `0 0 0px ${COLOR.gold}`, `0 0 28px ${COLOR.gold}`, `0 0 18px ${COLOR.gold}`] } : {}), ...(role === "even" ? { x: [0, 0, -6, 0] } : {}) }}
			transition={{ delay: start, duration: length, times: [0, when, after, 1] }}
		>
			<span className="block overflow-hidden rounded-md" style={{ width: size * 0.9, height: size * 0.9 }}>
				<CardArt card={card} size="large" emojiClass="text-3xl leading-none" />
			</span>
			<span className="flex flex-col items-start leading-none">
				<span className="text-xs font-bold uppercase text-fg-muted">{label}</span>
				<bdi dir="ltr" className="font-display font-black text-white" style={{ fontSize: size }}>
					{value}
				</bdi>
			</span>
		</motion.span>
	);
}

/**
 * A battle as two big numbers side by side across the middle row of the mat, the child's on the left and the
 * rival's on the right, with the swords between them. That row is between the two players' monsters, so the charge
 * and the hit stay in view above and below it. The numbers appear when the attacker rises, and when the monsters
 * meet the higher number grows and glows while the lower one fades back.
 */
export function ClashNumbers({ clash, find, stage, copy }: { clash: Clash; find: Finder; stage: Stage3d; copy: PlayCopy }) {
	const mat = find({ at: "center" });
	const length = clash.end - clash.start;
	const attacker = { card: clash.attacker, label: copy.atk, value: clash.attackerValue, side: clash.side, role: clash.winner === "attacker" ? "winner" : clash.winner === "defender" ? "loser" : "even" } as const;
	const defender = clash.defender ? ({ card: clash.defender.card, label: clash.defender.position === "defense" ? copy.def : copy.atk, value: clash.defender.value, side: clash.side === "you" ? "rival" : "you", role: clash.winner === "defender" ? "winner" : clash.winner === "attacker" ? "loser" : "even" } as const) : null;
	/* A direct attack has one number: it is the damage. */
	const rows = defender ? (attacker.side === "you" ? [attacker, defender] : [defender, attacker]) : [{ ...attacker, role: "even" as const }];
	const when = Math.min(0.9, (clash.hit - clash.start) / length);
	return (
		<motion.div data-cue="clash-numbers" style={at(mat.x, mat.cy - stage.big * 1.2, { width: mat.w, height: stage.big * 2.4 })} className="flex items-center justify-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: clash.start, duration: length, times: [0, 0.1, 0.86, 1] }}>
			{rows.map((row, index) => (
				<div key={row.side} className="flex items-center gap-2">
					{index === 1 && (
						<motion.span className="leading-none" style={{ fontSize: stage.big * 0.8 }} initial={{ scale: 1 }} animate={{ scale: [1, 1, 1.9, 1.2], rotate: [0, 0, -12, 0] }} transition={{ delay: clash.start, duration: length, times: [0, when, Math.min(0.97, when + 0.12), 1] }}>
							⚔️
						</motion.span>
					)}
					<Plate card={row.card} label={row.label} value={row.value} side={row.side} size={stage.big} role={row.role} start={clash.start} hit={clash.hit} end={clash.end} />
				</div>
			))}
		</motion.div>
	);
}

/**
 * Life Points lost or gained, written big on that player's half of the mat: it pops up there, is read, then flies
 * to the player's counter, which starts to roll as it arrives. A loss is red and the counter is knocked and throws
 * chips; a gain is green, with sparkles rising to the counter.
 */
export function BigLife({ change, find, stage, calm }: { change: LifeChange; find: Finder; stage: Stage3d; calm?: boolean }) {
	const half = stage.half(change.side);
	const chip = find({ at: "lantern", side: change.side });
	const up = change.amount > 0;
	const color = up ? "#6dff8d" : "#ff5a48";
	const size = stage.big * 1.35;
	const dx = chip.cx - half.cx;
	const dy = chip.cy - half.cy;
	/* The number is read for a moment before it leaves for the counter. */
	const length = 1.25;
	const sign = <bdi dir="ltr">{up ? `+${change.amount}` : `−${Math.abs(change.amount)}`}</bdi>;
	const box = at(half.cx - size * 2.2, half.cy - size * 0.6, { width: size * 4.4, fontSize: size, lineHeight: 1.2, ...outline(color) });
	/* Motion off: the amount fades in, stays to be read, and fades out, where it stands. */
	if (calm)
		return (
			<motion.span data-cue={up ? "lp-gain" : "lp-loss"} style={box} className="block text-center font-display font-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: change.start, duration: 1.6, times: [0, 0.15, 0.8, 1] }}>
				{sign}
			</motion.span>
		);
	return (
		<>
			<motion.span
				data-cue={up ? "lp-gain" : "lp-loss"}
				style={box}
				className="block text-center font-display font-black"
				initial={{ opacity: 0 }}
				animate={{ opacity: [0, 1, 1, 1, 0], scale: [0.3, 1.5, 1.15, 1.15, 0.45], x: up ? [0, 0, 0, dx, dx] : [0, -10, 8, dx, dx], y: [up ? 18 : -10, 0, up ? -8 : 0, dy, dy] }}
				transition={{ delay: change.start, duration: length, times: [0, 0.12, 0.3, 0.84, 1] }}
			>
				{sign}
			</motion.span>
			{/* The counter answers: a ring of the same colour, and it is knocked when points are lost. */}
			<motion.span style={at(chip.x - 5, chip.y - 5, { width: chip.w + 10, height: chip.h + 10, border: `4px solid ${color}`, boxShadow: `0 0 22px ${color}` })} className="block rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [1, 1.15, 1.05, 1], x: up ? 0 : [0, -8, 8, 0] }} transition={{ delay: change.start + LP_ROLL, duration: 0.8 }} />
			{Array.from({ length: 8 }, (_, index) => {
				const angle = (index / 8) * Math.PI * 2 + 0.4;
				/* Lost points fly off the counter as chips; gained ones rise to it as sparkles from the mat. */
				return up ? (
					<motion.span key={index} style={centred(half.cx, half.cy, 26)} className="flex items-center justify-center text-xl" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, Math.cos(angle) * 46, dx], y: [0, Math.sin(angle) * 30 - 20, dy], scale: [0.6, 1.3, 0.6] }} transition={{ delay: change.start + 0.15 + index * 0.05, duration: 0.85, opacity: { delay: change.start + 0.15 + index * 0.05, duration: 0.85, times: [0, 0.15, 0.85, 1] } }}>
						✨
					</motion.span>
				) : (
					<motion.span key={index} style={centred(chip.cx, chip.cy, 12, { background: color })} className="block rounded-sm" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, Math.cos(angle) * 34, Math.cos(angle) * 78], y: [0, Math.sin(angle) * 24, Math.sin(angle) * 40 + 46], rotate: [0, 140, 320], scale: [1, 1, 0.4] }} transition={{ delay: change.start + LP_ROLL + 0.05, duration: 0.75 }} />
				);
			})}
		</>
	);
}

/** The card that acts, shown big in the middle of the mat with a pulse of light around it: the child sees which card does what comes next. */
export function BigCast({ card, side, mat, stage, name, delay, length }: { card: CardId; side: Side; mat: Place; stage: Stage3d; name: string; delay: number; length: number }) {
	const width = Math.max(84, Math.min(170, stage.big * 2.6));
	const from = side === "you" ? mat.h * 0.3 : -mat.h * 0.3;
	return (
		<>
			{[0, 0.18].map((wait) => (
				<motion.span key={wait} style={centred(mat.cx, mat.cy, width * 1.5, { border: `5px solid ${COLOR.gold}`, boxShadow: `0 0 26px ${COLOR.gold}` })} className="block rounded-full" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.6, 2.6] }} transition={{ delay: delay + 0.2 + wait, duration: 0.7 }} />
			))}
			<motion.span data-cue="cast" style={at(mat.cx - width / 2, mat.cy - width * 0.72, { width, boxShadow: `0 0 30px ${COLOR.gold}` })} className="block overflow-hidden rounded-xl border-4 border-gold-400 bg-ink-950" initial={{ opacity: 0, scale: 0.4, y: from }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.12, 1, 0.9], y: [from, 0, 0, 0] }} transition={{ delay, duration: length, times: [0, 0.2, 0.8, 1] }}>
				<span className="block aspect-square w-full">
					<CardArt card={card} size="large" emojiClass="flex h-full w-full items-center justify-center text-6xl leading-none" />
				</span>
				<span dir="auto" className="block truncate px-1 py-0.5 text-center text-sm font-bold text-white">
					{name}
				</span>
			</motion.span>
		</>
	);
}

/** A beam of light from the card that acts, in the middle of the mat, to what it targets. */
export function AimBeam({ from, to, delay }: { from: Place; to: Place; delay: number }) {
	return (
		<svg data-cue="aim-beam" className="absolute inset-0 h-full w-full overflow-visible">
			{[
				{ stroke: COLOR.gold, width: 12, opacity: 0.5 },
				{ stroke: COLOR.white, width: 4, opacity: 1 },
			].map((line) => (
				<motion.line key={line.width} x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy} stroke={line.stroke} strokeWidth={line.width} strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1, 1, 1], opacity: [line.opacity, line.opacity, line.opacity, 0] }} transition={{ delay, duration: 0.6, times: [0, 0.35, 0.75, 1] }} />
			))}
		</svg>
	);
}
