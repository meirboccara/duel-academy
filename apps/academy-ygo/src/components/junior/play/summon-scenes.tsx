"use client";

import { motion, type TargetAndTransition, type Transition } from "motion/react";
import { cardOf, type CardId } from "@duel-academy/engine";
import type { PlayCopy } from "@/lib/junior/play/copy";
import type { Cue } from "@/lib/junior/play/cues";
import { COLOR, at, centred, type CardSize, type Place } from "./effect-kit";
import { CardFace } from "./mini-board";

/*
 * The big scenes: a Summon that has a way of its own (Ritual, Fusion, Synchro, Xyz, Link, Pendulum) and the
 * legendary cards. Every shape is drawn here, with CSS and SVG: no picture or video is loaded. Each scene shows the
 * rule it is about (the Levels that add up, the materials that go under the monster) and ends with the new monster
 * flying to its zone. Nothing flashes: lights fade in and out, and only once.
 */

/** Where a scene happens: the middle of the board, and how big it may be there. */
export interface Stage {
	cx: number;
	cy: number;
	r: number;
	mat: Place;
}
export const stageOf = (mat: Place): Stage => ({ cx: mat.cx, cy: mat.cy, r: Math.max(56, Math.min(mat.w, mat.h, 340) * 0.34), mat });

/** A point of a scene's timeline, from 0 to 1, as seconds. */
const timed = (delay: number, duration: number, from: number, to: number) => ({ delay: delay + duration * from, duration: Math.max(0.05, duration * (to - from)) });

const SCENE_COLOR: Record<Extract<Cue, { kind: "summon" }>["way"], string> = { ritual: COLOR.blue, fusion: COLOR.violet, synchro: COLOR.tuner, xyz: COLOR.gold, link: COLOR.link, pendulum: COLOR.arcane };

/** The name of the Summon and its sum, under the scene. */
function Caption({ stage, text, sum, color, delay, duration }: { stage: Stage; text: string; sum: string; color: string; delay: number; duration: number }) {
	return (
		<motion.div style={at(stage.mat.x, stage.cy + stage.r + 6, { width: stage.mat.w })} className="flex flex-col items-center gap-0.5 text-center" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }} transition={{ ...timed(delay, duration, 0.1, 0.95), times: [0, 0.15, 0.85, 1] }}>
			<span className="rounded-full bg-ink-950/85 px-3 font-display text-base font-bold" style={{ color }}>
				{text}
			</span>
			{sum && (
				<bdi dir="ltr" className="rounded-full bg-ink-950/85 px-3 text-lg font-bold text-fg">
					{sum}
				</bdi>
			)}
		</motion.div>
	);
}

/** The new monster: it appears in the middle once the scene has built up, then flies to its zone. */
function Emerge({ card, from, to, delay, duration, appear, glow, copy, size }: { card: CardId; from: { x: number; y: number }; to: Place; delay: number; duration: number; appear: number; glow: string; copy: PlayCopy; size: CardSize }) {
	const w = 72;
	const h = 88;
	const shrink = Math.min(1, size.w / w);
	return (
		<motion.span
			data-cue="emerge"
			style={at(from.x - w / 2, from.y - h / 2, { width: w, height: h, boxShadow: `0 0 28px ${glow}` })}
			className="block rounded-lg bg-ink-800"
			initial={{ opacity: 0, scale: 0.2 }}
			animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.2, 0.2, 1.3, 1.15, shrink], x: [0, 0, 0, 0, to.cx - from.x], y: [0, 0, 0, 0, to.cy - from.y] }}
			transition={{ delay, duration, times: [0, appear, appear + 0.12, 0.82, 1] }}
		>
			<CardFace card={card} copy={copy} compact />
		</motion.span>
	);
}

interface SummonProps {
	cue: Extract<Cue, { kind: "summon" }>;
	stage: Stage;
	targets: Place[];
	delay: number;
	duration: number;
	copy: PlayCopy;
	size: CardSize;
}
export function SummonScene(props: SummonProps) {
	const { cue, stage, targets, delay, duration, copy, size } = props;
	const color = SCENE_COLOR[cue.way];
	const sum = (() => {
		if (cue.way === "synchro" || cue.way === "ritual") return `${cue.numbers.join(" + ")} = ${cue.numbers.reduce((total, value) => total + value, 0)}`;
		if (cue.way === "xyz") return `★${cue.numbers[0] ?? cue.value} × ${cue.materials.length} → ${copy.rank} ${cue.value}`;
		if (cue.way === "link") return `${cue.materials.length} → LINK-${cue.value}`;
		if (cue.way === "pendulum") return `${cue.numbers[0] ?? ""} < ★ < ${cue.numbers[1] ?? ""}`;
		return cue.materials.map((item) => cardOf(item.card).art).join(" + ");
	})();
	const spread = (index: number) => ({ x: stage.cx + (index - (cue.cards.length - 1) / 2) * 84, y: stage.cy });
	return (
		<div data-cue={`summon-${cue.way}`}>
			{cue.way === "ritual" && <Ritual {...props} />}
			{cue.way === "fusion" && <Fusion {...props} />}
			{cue.way === "synchro" && <Synchro {...props} />}
			{cue.way === "xyz" && <Xyz {...props} />}
			{cue.way === "link" && <Link {...props} />}
			{cue.way === "pendulum" && <Pendulum {...props} />}
			<Caption stage={stage} text={copy.rules[cue.way]} sum={sum} color={color} delay={delay} duration={duration} />
			{cue.cards.map((card, index) => {
				const target = targets[index];
				return target ? <Emerge key={`${card}-${index}`} card={card} from={spread(index)} to={target} delay={delay} duration={duration} appear={0.52} glow={color} copy={copy} size={size} /> : null;
			})}
		</div>
	);
}

/** A blue circle is drawn on the ground, candles light around it, and light rises from it. */
function Ritual({ stage, delay, duration }: SummonProps) {
	const { cx, cy, r } = stage;
	const star = (turn: number) =>
		[0, 1, 2]
			.map((index) => {
				const angle = turn + (index * Math.PI * 2) / 3 - Math.PI / 2;
				return `${Math.round(Math.cos(angle) * r * 0.78)},${Math.round(Math.sin(angle) * r * 0.78)}`;
			})
			.join(" ");
	const stroke = { fill: "none", stroke: COLOR.blue, strokeWidth: 3, strokeLinejoin: "round" as const };
	return (
		<>
			<motion.div style={centred(cx, cy, r * 2 + 8)} initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: [0, 1, 1, 0], rotate: [0, 60] }} transition={{ ...timed(delay, duration, 0, 0.8), opacity: { ...timed(delay, duration, 0, 0.8), times: [0, 0.15, 0.8, 1] } }}>
				<svg viewBox={`${-r - 4} ${-r - 4} ${r * 2 + 8} ${r * 2 + 8}`} className="h-full w-full overflow-visible" style={{ filter: `drop-shadow(0 0 6px ${COLOR.blue})` }}>
					<motion.circle r={r} {...stroke} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={timed(delay, duration, 0, 0.3)} />
					<motion.circle r={r * 0.82} {...stroke} strokeWidth={1.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={timed(delay, duration, 0.08, 0.35)} />
					<motion.polygon points={star(0)} {...stroke} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={timed(delay, duration, 0.15, 0.42)} />
					<motion.polygon points={star(Math.PI)} {...stroke} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={timed(delay, duration, 0.2, 0.47)} />
				</svg>
			</motion.div>
			{Array.from({ length: 6 }, (_, index) => {
				const angle = (index * Math.PI * 2) / 6 - Math.PI / 2;
				return (
					<motion.span key={index} style={centred(cx + Math.cos(angle) * (r + 4), cy + Math.sin(angle) * (r + 4), 24)} className="flex items-center justify-center text-lg" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.8] }} transition={{ ...timed(delay, duration, 0.1 + index * 0.04, 0.8), times: [0, 0.15, 0.85, 1] }}>
						🕯️
					</motion.span>
				);
			})}
			<motion.span style={at(cx - 22, stage.mat.y, { width: 44, height: cy - stage.mat.y, transformOrigin: "bottom", background: `linear-gradient(to top, ${COLOR.blue}, transparent)` })} className="block rounded-full" initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1, 1] }} transition={timed(delay, duration, 0.4, 0.7)} />
		</>
	);
}

/** The materials circle into a purple whirl and become one. */
function Fusion({ cue, stage, delay, duration }: SummonProps) {
	const { cx, cy, r } = stage;
	return (
		<>
			<motion.span
				style={centred(cx, cy, r * 2, { background: `conic-gradient(from 0deg, ${COLOR.violet}, var(--color-ink-950), ${COLOR.deepViolet}, var(--color-ink-950), ${COLOR.violet})`, boxShadow: `0 0 30px ${COLOR.deepViolet}` })}
				className="block rounded-full"
				initial={{ opacity: 0, scale: 0, rotate: 0 }}
				animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0, 1, 1, 0.15], rotate: [0, 900] }}
				transition={{ ...timed(delay, duration, 0, 0.62), times: [0, 0.25, 0.8, 1], rotate: { ...timed(delay, duration, 0, 0.62), ease: "easeIn" } }}
			/>
			{cue.materials.map((item, index) => {
				const start = (index * 360) / Math.max(1, cue.materials.length);
				return (
					<motion.div key={index} style={centred(cx, cy, 0)} initial={{ rotate: start }} animate={{ rotate: start + 540 }} transition={{ ...timed(delay, duration, 0.05, 0.55), ease: "easeIn" }}>
						<motion.span style={at(0, -18, { width: 36, height: 36 })} className="flex items-center justify-center text-3xl" initial={{ x: r * 0.85, opacity: 0 }} animate={{ x: [r * 0.85, r * 0.85, 0], opacity: [0, 1, 0], scale: [1, 1.1, 0.3] }} transition={timed(delay, duration, 0.05, 0.55)}>
							{cardOf(item.card).art}
						</motion.span>
					</motion.div>
				);
			})}
		</>
	);
}

/** The Tuner becomes rings, one per Level; the other monsters become stars that pass through them; a column of light. */
function Synchro({ cue, stage, delay, duration }: SummonProps) {
	const { cx, cy, r } = stage;
	const rings = Math.min(8, cue.materials.filter((item) => item.tuner).reduce((total, item) => total + item.level, 0));
	const stars = Math.min(8, cue.materials.filter((item) => !item.tuner).reduce((total, item) => total + item.level, 0));
	const gap = 20;
	const left = cx - ((rings - 1) * gap) / 2;
	return (
		<>
			{Array.from({ length: rings }, (_, index) => (
				<motion.span
					key={`ring-${index}`}
					style={at(left + index * gap - 9, cy - 38, { width: 18, height: 76, border: `3px solid ${COLOR.tuner}`, boxShadow: `0 0 10px ${COLOR.tuner}` })}
					className="block rounded-[50%]"
					initial={{ opacity: 0, scaleY: 0.2 }}
					animate={{ opacity: [0, 1, 1, 0], scaleY: [0.2, 1, 1, 1.2] }}
					transition={{ ...timed(delay, duration, 0.02 + index * 0.025, 0.62), times: [0, 0.2, 0.8, 1] }}
				/>
			))}
			{Array.from({ length: stars }, (_, index) => (
				<motion.span
					key={`star-${index}`}
					style={centred(cx - r * 1.3, cy + ((index % 3) - 1) * 14, 22)}
					className="flex items-center justify-center text-base"
					initial={{ opacity: 0, x: 0 }}
					animate={{ opacity: [0, 1, 1, 0], x: [0, r * 0.6, r * 1.3 + ((rings - 1) * gap) / 2, r * 1.3 + ((rings - 1) * gap) / 2 + 16] }}
					transition={{ ...timed(delay, duration, 0.15 + index * 0.03, 0.5 + index * 0.01), times: [0, 0.2, 0.85, 1] }}
				>
					⭐
				</motion.span>
			))}
			<motion.span style={at(cx - 16, stage.mat.y, { width: 32, height: cy - stage.mat.y + 40, transformOrigin: "bottom", background: `linear-gradient(to top, ${COLOR.white}, ${COLOR.tuner}, transparent)` })} className="block rounded-full" initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: [0, 0.75, 0], scaleY: [0, 1, 1] }} transition={timed(delay, duration, 0.42, 0.68)} />
		</>
	);
}

/** The materials become lights that fall into a dark whirl; the monster rises with them circling it, as its materials. */
function Xyz({ cue, stage, delay, duration }: SummonProps) {
	const { cx, cy, r } = stage;
	const orbs = cue.materials.length;
	const orb = (key: string, style: React.CSSProperties, animate: TargetAndTransition, transition: Transition) => <motion.span key={key} style={style} className="block rounded-full" initial={{ opacity: 0 }} animate={animate} transition={transition} />;
	const light = { background: COLOR.gold, boxShadow: `0 0 12px ${COLOR.gold}` };
	return (
		<>
			<motion.span
				style={centred(cx, cy, r * 2, { background: `radial-gradient(circle, #000 0%, var(--color-xyz) 38%, ${COLOR.deepViolet} 64%, transparent 70%)`, border: `2px dashed ${COLOR.gold}` })}
				className="block rounded-full"
				initial={{ opacity: 0, scale: 0, rotate: 0 }}
				animate={{ opacity: [0, 0.95, 0.95, 0], scale: [0, 1, 1, 0.6], rotate: [0, -360] }}
				transition={{ ...timed(delay, duration, 0, 0.7), times: [0, 0.2, 0.8, 1] }}
			/>
			{Array.from({ length: orbs }, (_, index) => {
				const start = (index * 360) / Math.max(1, orbs);
				return (
					<motion.div key={`in-${index}`} style={centred(cx, cy, 0)} initial={{ rotate: start }} animate={{ rotate: start - 450 }} transition={{ ...timed(delay, duration, 0.05, 0.45), ease: "easeIn" }}>
						{orb("o", at(-8, -8, { width: 16, height: 16, ...light }), { x: [r, r, 0], opacity: [0, 1, 0] }, timed(delay, duration, 0.05, 0.45))}
					</motion.div>
				);
			})}
			<motion.span style={centred(cx, cy, r * 1.2, { border: `3px solid ${COLOR.gold}` })} className="block rounded-full" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 1.4] }} transition={timed(delay, duration, 0.45, 0.62)} />
			{/* Once the monster is up, its materials circle it: they are under it, not in the Graveyard. */}
			<motion.div style={centred(cx, cy, 0)} initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={timed(delay, duration, 0.55, 0.85)}>
				{Array.from({ length: orbs }, (_, index) => {
					const angle = (index * Math.PI * 2) / Math.max(1, orbs);
					return orb(`out-${index}`, at(Math.cos(angle) * 58 - 7, Math.sin(angle) * 58 - 7, { width: 14, height: 14, ...light }), { opacity: [0, 1, 1, 0] }, { ...timed(delay, duration, 0.55, 0.85), times: [0, 0.2, 0.8, 1] });
				})}
			</motion.div>
		</>
	);
}

const ARROWS = ["◣", "◢", "▼", "▲", "◤", "◥", "◀", "▶"] as const;
const ARROW_AT: Record<(typeof ARROWS)[number], [number, number]> = { "◣": [-1, 1], "◢": [1, 1], "▼": [0, 1], "▲": [0, -1], "◤": [-1, -1], "◥": [1, -1], "◀": [-1, 0], "▶": [1, 0] };
/** A square with eight arrows: as many arrows light up as the Link Rating. */
function Link({ cue, stage, delay, duration }: SummonProps) {
	const { cx, cy, r } = stage;
	const half = r * 0.72;
	return (
		<>
			<motion.span style={centred(cx, cy, half * 2, { border: `3px solid ${COLOR.link}`, boxShadow: `0 0 18px ${COLOR.link}, inset 0 0 18px ${COLOR.link}` })} className="block rounded-xl bg-ink-950/70" initial={{ opacity: 0, scale: 0.4, rotate: 45 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.8], rotate: [45, 0, 0, 0] }} transition={{ ...timed(delay, duration, 0, 0.75), times: [0, 0.2, 0.85, 1] }} />
			{ARROWS.map((arrow, index) => {
				const [dx, dy] = ARROW_AT[arrow];
				const lit = index < cue.value;
				return (
					<motion.span
						key={arrow}
						style={centred(cx + dx * (half + 2), cy + dy * (half + 2), 26, { color: lit ? COLOR.ember : "var(--color-fg-muted)", textShadow: lit ? `0 0 10px ${COLOR.ember}` : "none" })}
						className="flex items-center justify-center text-xl"
						initial={{ opacity: 0 }}
						animate={{ opacity: lit ? [0, 0.4, 1, 1, 0] : [0, 0.4, 0.4, 0.4, 0], scale: lit ? [1, 1, 1.5, 1.1, 1] : 1 }}
						transition={{ ...timed(delay, duration, 0.1, 0.78), times: [0, 0.15, 0.3 + index * 0.06, 0.85, 1] }}
					>
						{arrow}
					</motion.span>
				);
			})}
		</>
	);
}

/** A pendulum swings between the two Scales, and the monsters come down through a light above the board. */
function Pendulum({ stage, delay, duration, cue }: SummonProps) {
	const { cx, cy, r } = stage;
	const top = cy - r;
	return (
		<>
			<motion.span style={centred(cx, top, r * 1.6, { height: 28, top: top - 14, border: `3px solid ${COLOR.arcane}`, boxShadow: `0 0 18px ${COLOR.arcane}` })} className="block rounded-[50%]" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 1] }} transition={{ ...timed(delay, duration, 0, 0.8), times: [0, 0.2, 0.85, 1] }} />
			<motion.div style={at(cx - 1, top, { width: 2, height: r * 1.1, transformOrigin: "top center", background: COLOR.arcane })} initial={{ opacity: 0, rotate: -55 }} animate={{ opacity: [0, 1, 1, 0], rotate: [-55, 55, -40, 30, 0] }} transition={{ ...timed(delay, duration, 0.02, 0.55), opacity: { ...timed(delay, duration, 0.02, 0.6), times: [0, 0.1, 0.85, 1] } }}>
				<span style={at(-14, r * 1.1 - 14, { width: 28, height: 28, color: COLOR.arcane, textShadow: `0 0 10px ${COLOR.arcane}` })} className="flex items-center justify-center text-2xl">
					◈
				</span>
			</motion.div>
			{cue.numbers.map((value, index) => (
				<motion.span key={index} style={centred(cx + (index === 0 ? -1 : 1) * r * 1.05, top + r * 0.6, 40, { color: COLOR.arcane, borderColor: COLOR.arcane })} className="flex items-center justify-center rounded-full border-2 bg-ink-950/80 text-lg font-bold" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ ...timed(delay, duration, 0, 0.8), times: [0, 0.2, 0.85, 1] }}>
					<bdi dir="ltr">{value}</bdi>
				</motion.span>
			))}
		</>
	);
}

interface LegendProps {
	cue: Extract<Cue, { kind: "legend" }>;
	stage: Stage;
	target: Place;
	delay: number;
	duration: number;
	copy: PlayCopy;
}
const LEGEND_GLOW: Record<Extract<Cue, { kind: "legend" }>["style"], string> = { "dark-magic": COLOR.deepViolet, "white-lightning": COLOR.ice, ultimate: COLOR.ice, forbidden: COLOR.gold };
/** The board grows dark, the legend appears in the middle with its name, then takes its place. */
export function LegendScene({ cue, stage, target, delay, duration, copy }: LegendProps) {
	const { cx, cy, r, mat } = stage;
	const glow = LEGEND_GLOW[cue.style];
	const art = cardOf(cue.card).art;
	/* A monster flies to its zone at the end. */
	const toZone = cue.spot.at === "zone";
	return (
		<div data-cue={`legend-${cue.style}`}>
			<motion.span style={at(mat.x, mat.y, { width: mat.w, height: mat.h })} className="block rounded-2xl bg-ink-950" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.82, 0.82, 0] }} transition={{ delay, duration, times: [0, 0.12, 0.8, 1] }} />
			{cue.style === "dark-magic" && <DarkMagic stage={stage} delay={delay} duration={duration} />}
			{(cue.style === "white-lightning" || cue.style === "ultimate") && <Roar stage={stage} delay={delay} duration={duration} gold={cue.style === "ultimate"} />}
			{cue.style === "ultimate" && <ThreeHeads stage={stage} delay={delay} duration={duration} />}
			{cue.style === "forbidden" ? (
				<Forbidden stage={stage} delay={delay} duration={duration} />
			) : (
				<motion.span
					style={centred(cx, cy, 120, { filter: `drop-shadow(0 0 18px ${glow})` })}
					className="flex items-center justify-center text-[88px] leading-none"
					initial={{ opacity: 0, scale: 0.2 }}
					animate={{ opacity: [0, 1, 1, toZone ? 0.9 : 0, 0], scale: [0.2, 1.25, 1.1, toZone ? 0.4 : 1.1, 0.3], x: [0, 0, 0, toZone ? target.cx - cx : 0, toZone ? target.cx - cx : 0], y: [0, 0, 0, toZone ? target.cy - cy : 0, toZone ? target.cy - cy : 0] }}
					transition={{ delay, duration, times: [0, cue.style === "ultimate" ? 0.4 : 0.22, 0.72, 0.92, 1] }}
				>
					{art}
				</motion.span>
			)}
			<motion.div style={at(mat.x, cy + r + 4, { width: mat.w })} className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, 0] }} transition={{ delay, duration, times: [0, 0.25, 0.35, 0.8, 0.9] }}>
				<span lang={copy.englishCards ? "en" : undefined} className="rounded-full bg-ink-950/85 px-4 py-1 text-center font-display text-xl font-bold" style={{ color: glow === COLOR.ice ? COLOR.white : glow, textShadow: `0 0 12px ${glow}` }}>
					{copy.cards[cue.card].name}
				</span>
			</motion.div>
		</div>
	);
}

/** A purple magic circle turning behind the magician, and sparks flying out. */
function DarkMagic({ stage, delay, duration }: { stage: Stage; delay: number; duration: number }) {
	const { cx, cy, r } = stage;
	const points = Array.from({ length: 5 }, (_, index) => {
		const angle = (index * 4 * Math.PI) / 5 - Math.PI / 2;
		return `${Math.round(Math.cos(angle) * r * 0.85)},${Math.round(Math.sin(angle) * r * 0.85)}`;
	}).join(" ");
	const line = { fill: "none", stroke: COLOR.violet, strokeWidth: 2.5 };
	return (
		<>
			<motion.div style={centred(cx, cy, r * 2 + 8, { filter: `drop-shadow(0 0 8px ${COLOR.deepViolet})` })} initial={{ opacity: 0, rotate: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], rotate: [0, 120], scale: [0.6, 1, 1, 1.1] }} transition={{ delay, duration, times: [0, 0.2, 0.8, 1] }}>
				<svg viewBox={`${-r - 4} ${-r - 4} ${r * 2 + 8} ${r * 2 + 8}`} className="h-full w-full overflow-visible">
					<circle r={r} {...line} />
					<circle r={r * 0.92} {...line} strokeWidth={1} />
					<motion.polygon points={points} {...line} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + duration * 0.05, duration: duration * 0.3 }} />
				</svg>
			</motion.div>
			{Array.from({ length: 10 }, (_, index) => {
				const angle = (index / 10) * Math.PI * 2;
				return (
					<motion.span key={index} style={centred(cx, cy, 24)} className="flex items-center justify-center text-lg" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: [0, Math.cos(angle) * r * 1.2], y: [0, Math.sin(angle) * r * 1.2] }} transition={{ delay: delay + duration * (0.25 + (index % 3) * 0.05), duration: duration * 0.4 }}>
						✨
					</motion.span>
				);
			})}
		</>
	);
}

/** Light rays turning behind a dragon, and three waves going out from it like a roar. */
function Roar({ stage, delay, duration, gold }: { stage: Stage; delay: number; duration: number; gold: boolean }) {
	const { cx, cy, r } = stage;
	const ray = gold ? "rgba(240, 196, 90, 0.45)" : "rgba(191, 227, 255, 0.45)";
	return (
		<>
			<motion.span
				style={centred(cx, cy, r * 2.4, { background: `repeating-conic-gradient(from 0deg, ${ray} 0deg 7deg, transparent 7deg 22deg)`, maskImage: "radial-gradient(circle, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)" })}
				className="block rounded-full"
				initial={{ opacity: 0, rotate: 0 }}
				animate={{ opacity: [0, 1, 1, 0], rotate: [0, 50] }}
				transition={{ delay, duration, times: [0, 0.2, 0.8, 1] }}
			/>
			{[0, 1, 2].map((index) => (
				<motion.span key={index} style={centred(cx, cy, r * 0.8, { border: `3px solid ${gold ? COLOR.gold : COLOR.ice}` })} className="block rounded-full" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.6, 2.6] }} transition={{ delay: delay + duration * (0.35 + index * 0.1), duration: duration * 0.35 }} />
			))}
		</>
	);
}

/** Three white dragons come together into one. */
function ThreeHeads({ stage, delay, duration }: { stage: Stage; delay: number; duration: number }) {
	const { cx, cy, r } = stage;
	return (
		<>
			{[-1, 0, 1].map((side) => (
				<motion.span key={side} style={centred(cx + side * r * 0.95, cy - 6, 64, { filter: `drop-shadow(0 0 12px ${COLOR.ice})` })} className="flex items-center justify-center text-5xl" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, 0, -side * r * 0.95, -side * r * 0.95], scale: [0.6, 1, 1, 0.4] }} transition={{ delay, duration: duration * 0.42, times: [0, 0.3, 0.85, 1] }}>
					🐲
				</motion.span>
			))}
		</>
	);
}

/** The five pieces fly in and make one figure, and a golden wave goes out from it. */
function Forbidden({ stage, delay, duration }: { stage: Stage; delay: number; duration: number }) {
	const { cx, cy, r } = stage;
	const PIECES: [CardId, number, number][] = [
		["exodia-the-forbidden-one", 0, -0.5],
		["right-arm-of-the-forbidden-one", -0.62, -0.08],
		["left-arm-of-the-forbidden-one", 0.62, -0.08],
		["right-leg-of-the-forbidden-one", -0.28, 0.5],
		["left-leg-of-the-forbidden-one", 0.28, 0.5],
	];
	return (
		<>
			<motion.span style={centred(cx, cy, r * 2.2, { background: `radial-gradient(circle, ${COLOR.gold} 0%, rgba(240, 196, 90, 0.25) 40%, transparent 68%)` })} className="block rounded-full" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0, 0.9, 0.9, 0], scale: [0.3, 0.3, 1, 1.05, 1.1] }} transition={{ delay, duration, times: [0, 0.35, 0.5, 0.85, 1] }} />
			{PIECES.map(([card, px, py], index) => (
				<motion.span
					key={card}
					style={centred(cx + px * r, cy + py * r, 52, { filter: `drop-shadow(0 0 10px ${COLOR.gold})` })}
					className="flex items-center justify-center text-4xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 1, 1, 1, 0], x: [px * r * 2.4 || 0, 0, 0, 0, 0], y: [py * r * 2.4 || -r * 1.4, 0, 0, 0, 0], scale: [0.6, 1, 1, 1.25, 1] }}
					transition={{ delay: delay + index * duration * 0.05, duration: duration * (1 - index * 0.05), times: [0, 0.3, 0.55, 0.7, 1] }}
				>
					{cardOf(card).art}
				</motion.span>
			))}
			{/* The figure is whole: one golden wave goes out. The win comes from the hand, so nothing hits the Life Points. */}
			{[0, 1].map((index) => (
				<motion.span key={index} style={centred(cx, cy, r, { border: `4px solid ${COLOR.gold}`, boxShadow: `0 0 18px ${COLOR.gold}` })} className="block rounded-full" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 0], scale: [0.6, 1.8, 2.6] }} transition={{ delay: delay + duration * (0.62 + index * 0.1), duration: duration * 0.3 }} />
			))}
		</>
	);
}
