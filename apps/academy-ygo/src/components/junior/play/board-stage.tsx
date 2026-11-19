"use client";

import { motion } from "motion/react";
import { Fragment, useContext, useLayoutEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { ATTACK_ART } from "@/lib/junior/play/board3d-moves";
import { clashes, lifeChanges } from "@/lib/junior/play/board3d-show";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { arrivals, beatLength, effectCues, lpCounts, spotKey, statHolds, timeline, type ArriveWay, type Beat, type Cue, type Spot } from "@/lib/junior/play/cues";
import type { Board, GameEvent, Row, Side } from "@/lib/junior/play/engine";
import { AimBeam, BigCast, BigLife, ClashNumbers, type Stage3d } from "./board3d/big-moments";
import { Board3dStage, type HandItem } from "./board3d/board-3d-stage";
import { Board3dContext } from "./board3d/support";
import { BEAT, COLOR, FADE, TIMES, at, centred, place, type CardSize, type Finder, type Place } from "./effect-kit";
import { CardFace, MiniBoard, type LpCount, type Pile, type StatHold } from "./mini-board";
import { LegendScene, SummonScene, stageOf } from "./summon-scenes";

export { BEAT } from "./effect-kit";

interface BoardStageProps {
	board: Board;
	/** What the last move did. A new list means a new move, and its effects play. */
	events: readonly GameEvent[];
	copy: PlayCopy;
	moving: boolean;
	glow?: ReadonlySet<string>;
	chosen?: ReadonlySet<string>;
	onZone?: (side: Side, row: Row, zone: number) => void;
	onPile?: (side: Side, pile: Pile) => void;
	/** For the 3D mat only, which also shows the child's hand: its cards, with the same choices as their HTML buttons. */
	hand?: readonly HandItem[];
	/** For the 3D mat only: the card of the hand the keyboard is on, by its place in the hand. */
	handFocus?: number | null;
}
/**
 * The board with the effects of the last move played over it: a bolt on a destroyed monster, sparkles flying to the
 * Life Points, a card spinning away when it is banished. The pictures show what the rules did; the sentence under the
 * board still says it. With motion off (calm mode, or the device's setting) nothing plays and the board is as before.
 *
 * Inside a `Board3dContext` the mat is drawn in 3D, in the room the level keeps for it, and the cards themselves act
 * the move out. The HTML board is then still here, hidden from the eyes only: it stays the board a screen reader
 * hears and the keyboard moves on, and the zone the keyboard is on is ringed on the 3D mat.
 */
export function BoardStage({ board, events, copy, moving, glow, chosen, onZone, onPile, hand, handFocus }: BoardStageProps) {
	const three = useContext(Board3dContext);
	const [focused, setFocused] = useState<string | null>(null);
	/* The board before the last move is the one shown before it. */
	const [seen, setSeen] = useState<{ board: Board; events: readonly GameEvent[]; before: Board | null; id: number }>({ board, events, before: null, id: 0 });
	let current = seen;
	if (seen.board !== board || seen.events !== events) {
		current = { board, events, before: seen.board, id: seen.id + 1 };
		setSeen(current);
	}
	const { before, id } = current;
	const beats = useMemo(() => (moving && before && events.length > 0 ? effectCues(before, events, board) : []), [moving, before, events, board]);
	const landing = useMemo(() => new Map([...arrivals(beats)].map(([key, at]) => [key, at * BEAT])), [beats]);
	/* The new ATK and DEF appear as the "▲ +500" rises, not before. */
	const holding = useMemo(() => (before ? new Map([...statHolds(before, beats)].map(([key, hold]): [string, StatHold] => [key, { atk: hold.atk, def: hold.def, delay: hold.at * BEAT + 0.2 }])) : undefined), [before, beats]);
	const counting = useMemo(() => {
		const out: Partial<Record<Side, LpCount>> = {};
		for (const [side, count] of Object.entries(lpCounts(beats)) as [Side, { from: number; at: number }][]) out[side] = { from: count.from, delay: count.at * BEAT + 0.3 };
		return out;
	}, [beats]);
	const rootRef = useRef<HTMLDivElement>(null);
	const [places, setPlaces] = useState<{ id: number; find: Finder } | null>(null);
	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root || beats.length === 0) return;
		setPlaces({ id, find: finder(root) });
	}, [id, beats]);
	/*
	 * On the 3D mat, with motion off, one thing is still shown for a move: the Life Points lost or gained, written
	 * big, fading in and out where it stands. Nothing moves and nothing shakes.
	 */
	const calm = useMemo(() => (three && !moving && before && events.length > 0 ? effectCues(before, events, board).map((beat) => beat.filter((cue) => cue.kind === "lp")).filter((beat) => beat.length > 0) : []), [three, moving, before, events, board]);
	const fights = useMemo(() => (three && moving ? clashes(events, beats, BEAT) : []), [three, moving, events, beats]);
	if (three) {
		const shown = moving ? beats : calm;
		/* Only a focus that shows (the keyboard's) is mirrored: a tap leaves no ring behind. */
		const onFocus = (event: FocusEvent<HTMLDivElement>) => {
			let shows = true;
			try {
				shows = event.target.matches(":focus-visible");
			} catch {
				/* An old browser: show the ring. */
			}
			setFocused(shows ? (event.target.closest("[data-spot]")?.getAttribute("data-spot") ?? null) : null);
		};
		return (
			<div className="sr-only" onFocus={onFocus} onBlur={() => setFocused(null)}>
				<MiniBoard board={board} copy={copy} moving={moving} landing={landing} counting={counting} holding={holding} playId={id} {...(glow ? { glow } : {})} {...(chosen ? { chosen } : {})} {...(onZone ? { onZone } : {})} {...(onPile ? { onPile } : {})} />
				{three.slot &&
					createPortal(
						<Board3dStage
							three={three}
							board={board}
							before={before}
							beats={shown}
							playId={id}
							copy={copy}
							moving={moving}
							glow={glow}
							chosen={chosen}
							landing={landing}
							holding={holding}
							counting={counting}
							onZone={onZone}
							onPile={onPile}
							hand={hand}
							focusKey={focused ?? (handFocus === null || handFocus === undefined ? null : `hand-${handFocus}`)}
							effects={(find, stage) => (
								<>
									<EffectLayer key={id} beats={shown} find={find} copy={copy} full={board.full} solid={stage} calm={!moving} />
									{/* A battle's two numbers, big, over everything else of the move. */}
									<div key={`fights-${id}`} aria-hidden dir="ltr" className="pointer-events-none absolute inset-0 z-20">
										{fights.map((clash) => (
											<ClashNumbers key={clash.id} clash={clash} find={find} stage={stage} copy={copy} />
										))}
									</div>
								</>
							)}
						/>,
						three.slot,
					)}
			</div>
		);
	}
	return (
		<div ref={rootRef} className="relative">
			<MiniBoard board={board} copy={copy} moving={moving} landing={landing} counting={counting} holding={holding} playId={id} {...(glow ? { glow } : {})} {...(chosen ? { chosen } : {})} {...(onZone ? { onZone } : {})} {...(onPile ? { onPile } : {})} />
			{beats.length > 0 && places?.id === id && <EffectLayer key={id} beats={beats} find={places.find} copy={copy} full={board.full} />}
		</div>
	);
}

/** Measures where things are on the board as it is now. A spot the board does not show (the hand, a pile on the small board) is placed at its owner's edge. */
function finder(root: HTMLElement): Finder {
	const origin = root.getBoundingClientRect();
	const frame = root.firstElementChild?.getBoundingClientRect() ?? origin;
	const mat = place(frame.left - origin.left, frame.top - origin.top, frame.width, frame.height, true);
	return (spot) => {
		/* The middle of the board is the whole board: a scene there may use all of it. */
		if (spot.at === "center") return mat;
		const element = root.querySelector(`[data-spot="${spotKey(spot)}"]`);
		if (element) {
			const box = element.getBoundingClientRect();
			return place(box.left - origin.left, box.top - origin.top, box.width, box.height, true);
		}
		const side = spot.side;
		const y = side === "you" ? mat.y + mat.h + 12 : mat.y - 12;
		const x = spot.at === "pile" && spot.pile !== "hand" ? mat.x + mat.w - 28 : mat.cx;
		return place(x, y, 0, 0, false);
	};
}

/** Each way of arriving has its colour and its sign. Ritual is blue, Fusion purple, Synchro white, Xyz black and gold, Link dark blue, like the frames of the cards. */
const ARRIVE: Record<ArriveWay, { color: string; sign: string }> = {
	normal: { color: COLOR.gold, sign: "" },
	tribute: { color: COLOR.gold, sign: "🐾" },
	own: { color: COLOR.arcane, sign: "⚡" },
	revive: { color: COLOR.green, sign: "💫" },
	ritual: { color: COLOR.blue, sign: "🕯️" },
	fusion: { color: COLOR.violet, sign: "🌀" },
	synchro: { color: COLOR.white, sign: "⭐" },
	xyz: { color: COLOR.gold, sign: "✴️" },
	link: { color: COLOR.link, sign: "🔗" },
	pendulum: { color: COLOR.arcane, sign: "◈" },
	scale: { color: COLOR.arcane, sign: "" },
};


interface LayerProps {
	beats: readonly Beat[];
	find: Finder;
	copy: PlayCopy;
	full: boolean;
	/**
	 * Over the 3D mat: what the mat looks like on the screen. The cards that leave, the attackers and the hits are
	 * then the 3D cards and the 3D scene themselves, and the big moments (Life Points, the card that acts) are written large.
	 */
	solid?: Stage3d;
	/** Motion is off: what is still shown only fades. */
	calm?: boolean;
}
/** The cues, drawn. Decorative: a screen reader gets the sentence under the board instead. */
function EffectLayer({ beats, find, copy, full, solid, calm }: LayerProps) {
	const mat = find({ at: "center" });
	/* The card of a ghost is as big as a card in a zone: small on the whole mat. */
	const card: CardSize = solid?.card ?? (full ? { w: 44, h: 48 } : { w: 80, h: 96 });
	const changes = solid ? lifeChanges(beats, BEAT) : [];
	const stage = stageOf(mat);
	const starts = timeline(beats);
	return (
		<div aria-hidden data-effects dir="ltr" className="pointer-events-none absolute inset-0 z-10">
			{beats.flatMap((beat, index) =>
				beat.map((cue, order) => {
					const key = `${index}-${order}`;
					const delay = (starts[index] ?? 0) * BEAT;
					const duration = beatLength(beat) * BEAT;
					switch (cue.kind) {
						case "summon":
							return <SummonScene key={key} cue={cue} stage={stage} targets={cue.spots.map(find)} delay={delay} duration={duration} copy={copy} size={card} />;
						case "legend":
							return <LegendScene key={key} cue={cue} stage={stage} target={find(cue.spot)} delay={delay} duration={duration} copy={copy} />;
						case "cast":
							return solid ? <BigCast key={key} card={cue.card} side={cue.side} mat={mat} stage={solid} name={copy.cards[cue.card].name} delay={delay} length={BEAT * 1.25} /> : <Cast key={key} cue={cue} delay={delay} mat={mat} copy={copy} />;
						case "aim":
							return (
								<Fragment key={key}>
									{/* On the 3D mat a beam goes from the card that acts to what it targets. */}
									{solid && <AimBeam from={mat} to={find(cue.spot)} delay={delay + 0.3} />}
									<Ring spot={find(cue.spot)} delay={delay + 0.15} color={COLOR.ember} sign="🎯" />
								</Fragment>
							);
						case "strike":
							/* The clash of a battle is the 3D scene's own flash and burst. */
							return solid && cue.style === "clash" ? null : <Strike key={key} cue={cue} spot={find(cue.spot)} delay={delay} />;
						case "leave":
							return solid ? null : <Ghost key={key} cue={cue} from={find(cue.from)} to={find(cue.to)} delay={delay + beat.slice(0, order).filter((item) => item.kind === "leave").length * 0.08} card={card} copy={copy} />;
						case "arrive":
							return cue.way === "scale" ? <Pillar key={key} spot={find(cue.spot)} delay={delay} /> : <Ring key={key} spot={find(cue.spot)} delay={delay} color={ARRIVE[cue.way].color} sign={ARRIVE[cue.way].sign} twice />;
						case "stat":
							return <Stat key={key} spot={find(cue.spot)} amount={cue.amount} delay={delay} />;
						case "lp": {
							const change = changes.find((item) => item.id === `lp-${index}-${order}`);
							if (solid) return change ? <BigLife key={key} change={{ ...change, start: delay, roll: delay + (change.roll - change.start) }} find={find} stage={solid} {...(calm ? { calm } : {})} /> : null;
							return <LifePoints key={key} cue={cue} lantern={find({ at: "lantern", side: cue.side })} source={find(cue.source)} delay={delay} />;
						}
						case "block":
							return <Pop key={key} spot={find(cue.spot)} art={cue.art} delay={delay} ring={COLOR.ember} />;
						case "beam":
							return solid && cue.art === ATTACK_ART && cue.from.at === "zone" ? null : <Beam key={key} from={find(cue.from)} to={find(cue.to)} art={cue.art} delay={delay} />;
						case "shield":
							return <Pop key={key} spot={find({ at: "lantern", side: cue.side })} art="🛡️" delay={delay} ring={COLOR.arcane} />;
						case "wave":
							return <Wave key={key} cue={cue} mat={mat} find={find} delay={delay} />;
						case "fizzle":
							return <Fizzle key={key} spot={find(cue.spot)} art={cue.art} delay={delay} />;
						case "cheer":
							return <Cheer key={key} spot={find({ at: "lantern", side: cue.side })} delay={delay} />;
					}
				}),
			)}
		</div>
	);
}

/** The card that acts, shown in the middle of the board for one beat. */
function Cast({ cue, delay, mat, copy }: { cue: Extract<Cue, { kind: "cast" }>; delay: number; mat: Place; copy: PlayCopy }) {
	const from = cue.side === "you" ? 60 : -60;
	return (
		<motion.span
			data-cue="cast"
			style={at(mat.cx - 36, mat.cy - 44, { width: 72, height: 88, boxShadow: `0 0 24px ${COLOR.gold}` })}
			className="block rounded-lg bg-ink-800"
			initial={{ opacity: 0, scale: 0.5, y: from }}
			animate={{ opacity: FADE, scale: [0.5, 1.15, 1, 0.9], y: [from, 0, 0, 0] }}
			transition={{ delay, duration: BEAT * 1.1, times: TIMES }}
		>
			<CardFace card={cue.card} copy={copy} compact />
		</motion.span>
	);
}

/** A ring that opens around a spot, with a sign in it. */
function Ring({ spot, delay, color, sign, twice }: { spot: Place; delay: number; color: string; sign: string; twice?: boolean }) {
	const size = Math.max(spot.w, spot.h, 40) + 12;
	const ring = (wait: number) => (
		<motion.span style={centred(spot.cx, spot.cy, size, { border: `3px solid ${color}`, boxShadow: `0 0 14px ${color}` })} className="block rounded-full" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 1.35] }} transition={{ delay: delay + wait, duration: 0.55 }} />
	);
	return (
		<>
			{ring(0)}
			{twice && ring(0.14)}
			{sign && (
				<motion.span style={centred(spot.cx, spot.cy - size / 2, 28)} className="flex items-center justify-center text-xl" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: FADE, scale: [0.4, 1.3, 1.1, 1], y: [0, -6, -10, -16] }} transition={{ delay, duration: BEAT, times: TIMES }}>
					{sign}
				</motion.span>
			)}
		</>
	);
}

/** A column of light on a Pendulum Zone. */
function Pillar({ spot, delay }: { spot: Place; delay: number }) {
	const height = Math.max(spot.h, 40) * 2.2;
	return (
		<motion.span
			style={at(spot.x, spot.y + spot.h - height, { width: Math.max(spot.w, 24), height, transformOrigin: "bottom", background: `linear-gradient(to top, ${COLOR.arcane}, transparent)` })}
			className="block rounded-lg"
			initial={{ opacity: 0, scaleY: 0 }}
			animate={{ opacity: [0, 0.75, 0.75, 0], scaleY: [0, 1, 1, 1] }}
			transition={{ delay, duration: BEAT, times: TIMES }}
		/>
	);
}

/** Lightning from the top of the board down to a point: a few broken lines. */
function boltPath(spot: Place): string {
	const top = -8;
	const steps = 5;
	const lean = 34;
	return Array.from({ length: steps + 1 }, (_, index) => {
		const share = index / steps;
		const jag = index === 0 || index === steps ? 0 : index % 2 === 0 ? 13 : -13;
		return `${Math.round(spot.cx + lean * (1 - share) + jag)},${Math.round(top + (spot.cy - top) * share)}`;
	}).join(" ");
}
/** A crack across a zone: the ground opening. */
function crackPath(spot: Place): string {
	const steps = 6;
	return Array.from({ length: steps + 1 }, (_, index) => `${Math.round(spot.x + (spot.w * index) / steps)},${Math.round(spot.cy + (index % 2 === 0 ? 7 : -7))}`).join(" ");
}
const SIGN = { burst: "💥", clash: "💥", crack: "💢", quake: "" } as const;
/** Something hits a spot. Lightning flashes once, on that zone only: never the whole screen, never twice. */
function Strike({ cue, spot, delay }: { cue: Extract<Cue, { kind: "strike" }>; spot: Place; delay: number }) {
	if (cue.style === "bolt" || cue.style === "quake") {
		const bolt = cue.style === "bolt";
		const points = bolt ? boltPath(spot) : crackPath(spot);
		const line = (stroke: string, width: number, opacity: number) => (
			<motion.polyline points={points} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1, 1, 1], opacity: [opacity, opacity, opacity, 0] }} transition={{ delay, duration: 0.85, times: [0, 0.2, 0.7, 1] }} />
		);
		return (
			<>
				<svg data-cue={cue.style} className="absolute inset-0 h-full w-full overflow-visible">
					{line(bolt ? COLOR.gold : COLOR.ember, bolt ? 8 : 9, 0.55)}
					{line(bolt ? COLOR.white : "#3a1c10", bolt ? 3 : 4, 1)}
				</svg>
				{bolt ? (
					<motion.span style={at(spot.x, spot.y, { width: spot.w, height: spot.h })} className="block rounded-xl bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ delay: delay + 0.14, duration: 0.3 }} />
				) : (
					<motion.span style={at(spot.x, spot.y, { width: spot.w, height: spot.h, border: `3px solid ${COLOR.ember}` })} className="block rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, -5, 5, 0] }} transition={{ delay, duration: 0.5 }} />
				)}
			</>
		);
	}
	const big = cue.style === "burst";
	return (
		<motion.span data-cue={cue.style} style={centred(spot.cx, spot.cy, 48)} className={`flex items-center justify-center ${big ? "text-5xl" : "text-3xl"}`} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 0], scale: [0.3, big ? 1.5 : 1.2, big ? 1.7 : 1.3] }} transition={{ delay, duration: 0.5 }}>
			{SIGN[cue.style]}
		</motion.span>
	);
}

/** A card leaving a place for another. Until its beat comes, a card that stood in a zone still stands there. */
function Ghost({ cue, from, to, delay, card, copy }: { cue: Extract<Cue, { kind: "leave" }>; from: Place; to: Place; delay: number; card: CardSize; copy: PlayCopy }) {
	const stands = from.found && cue.from.at === "zone";
	/* A destroyed card with no Graveyard to go to on this board falls where it stood. */
	const dx = cue.how === "destroyed" && !to.found ? 0 : to.cx - from.cx;
	const dy = cue.how === "destroyed" && !to.found ? 26 : to.cy - from.cy;
	const start = stands ? 1 : 0;
	const motionOf = () => {
		if (cue.how === "destroyed") return { animate: { opacity: [1, 1, 1, 1, 0], x: [0, -6, 6, -4, dx], y: [0, 0, 0, 0, dy], rotate: [0, -5, 5, -3, 20], scale: [1, 1, 1, 1, 0.3] }, times: [0, 0.15, 0.3, 0.45, 1], wait: 0.2 };
		if (cue.how === "banished") return { animate: { opacity: [start, 1, 1, 0], x: [0, 0, dx, dx], y: [0, 0, dy, dy], rotate: [0, 0, 540, 720], scale: [1, 1.05, 0.2, 0.05] }, times: TIMES, wait: 0 };
		if (cue.how === "revive") return { animate: { opacity: FADE, x: [0, dx, dx, dx], y: [0, dy, dy, dy], rotate: [0, 0, 0, 0], scale: [0.4, 1, 1, 1] }, times: [0, 0.6, 0.9, 1], wait: 0 };
		return { animate: { opacity: [start, 1, 1, 0], x: [0, 0, dx, dx], y: [0, 0, dy, dy], rotate: [0, 0, 0, 0], scale: [1, 1, 0.6, 0.5] }, times: TIMES, wait: 0 };
	};
	const { animate, times, wait } = motionOf();
	return (
		<motion.span
			data-cue={`leave-${cue.how}`}
			style={at(from.cx - card.w / 2, from.cy - card.h / 2, { width: card.w, height: card.h, ...(cue.how === "banished" ? { boxShadow: `0 0 16px ${COLOR.violet}` } : {}) })}
			className="block rounded-lg bg-ink-800"
			initial={{ opacity: start }}
			animate={animate}
			transition={{ delay: delay + wait, duration: BEAT, times }}
		>
			{cue.card ? <CardFace card={cue.card} copy={copy} compact /> : <span className="flex h-full w-full items-center justify-center rounded-md border-2 border-white/40 bg-ink-700 text-lg">🂠</span>}
		</motion.span>
	);
}

/** ATK going up, in gold, or down, in red: the amount beside an arrow. */
function Stat({ spot, amount, delay }: { spot: Place; amount: number; delay: number }) {
	const up = amount > 0;
	return (
		<motion.span
			data-cue="stat"
			style={at(spot.cx - 36, spot.cy - 12, { width: 72, color: up ? COLOR.gold : COLOR.ember, borderColor: up ? COLOR.gold : COLOR.ember })}
			className="block rounded-full border-2 bg-ink-950/90 text-center text-sm font-bold leading-6"
			initial={{ opacity: 0 }}
			animate={{ opacity: FADE, y: up ? [12, 0, -14, -26] : [-12, 0, 14, 26], scale: [0.7, 1.15, 1, 1] }}
			transition={{ delay, duration: BEAT * 1.3, times: TIMES }}
		>
			{up ? `▲ +${amount}` : `▼ −${Math.abs(amount)}`}
		</motion.span>
	);
}

/** Life Points going up: sparkles fly from the card to the lantern, which glows. Going down: the lantern is shaken. */
function LifePoints({ cue, lantern, source, delay }: { cue: Extract<Cue, { kind: "lp" }>; lantern: Place; source: Place; delay: number }) {
	const amount = cue.to - cue.from;
	const up = amount > 0;
	const color = up ? COLOR.green : COLOR.ember;
	/* The lantern's picture is at the left end of its row. */
	const lamp = { x: lantern.x + 16, y: lantern.cy };
	const flying = up && cue.source.at !== "lantern";
	return (
		<>
			{flying &&
				[0, 1, 2, 3, 4].map((index) => (
					<motion.span
						key={index}
						style={centred(source.cx, source.cy, 24)}
						className="flex items-center justify-center text-lg"
						initial={{ opacity: 0 }}
						animate={{ opacity: [0, 1, 1, 0], x: [0, (index - 2) * 14, lamp.x - source.cx], y: [0, -18, lamp.y - source.cy], scale: [0.6, 1.2, 0.5] }}
						transition={{ delay: delay + index * 0.07, duration: 0.5, opacity: { delay: delay + index * 0.07, duration: 0.5, times: [0, 0.15, 0.85, 1] } }}
					>
						✨
					</motion.span>
				))}
			<motion.span
				style={at(lantern.x - 4, lantern.y - 4, { width: lantern.w + 8, height: lantern.h + 8, border: `2px solid ${color}`, boxShadow: `0 0 16px ${color}` })}
				className="block rounded-xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: [0, 1, 1, 0], x: up ? [0, 0, 0, 0] : [0, -6, 6, 0] }}
				transition={{ delay: delay + 0.3, duration: 0.6 }}
			/>
			<motion.span
				data-cue={up ? "lp-gain" : "lp-loss"}
				style={at(lantern.x + lantern.w - 92, lantern.y - (cue.side === "you" ? 24 : -lantern.h + 4), { color, borderColor: color })}
				className="block rounded-full border-2 bg-ink-950/90 px-3 text-base font-bold leading-7"
				initial={{ opacity: 0 }}
				animate={{ opacity: FADE, y: up ? [8, 0, -12, -22] : [-8, 0, 8, 14], scale: [0.7, 1.2, 1, 1] }}
				transition={{ delay: delay + 0.3, duration: BEAT * 1.5, times: TIMES }}
			>
				{up ? `+${amount}` : `−${Math.abs(amount)}`}
			</motion.span>
		</>
	);
}

/** A picture that pops up on a spot, inside a ring: a vine that holds an attacker, a shield. */
function Pop({ spot, art, delay, ring }: { spot: Place; art: string; delay: number; ring: string }) {
	return (
		<>
			<Ring spot={spot} delay={delay} color={ring} sign="" />
			<motion.span data-cue="pop" style={centred(spot.cx, spot.cy, 48)} className="flex items-center justify-center text-4xl" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: FADE, scale: [0.4, 1.3, 1.15, 1.15] }} transition={{ delay, duration: BEAT * 1.2, times: TIMES }}>
				{art}
			</motion.span>
		</>
	);
}

/** A picture that flies from one spot to another: an attack, a monster's effect. */
function Beam({ from, to, art, delay }: { from: Place; to: Place; art: string; delay: number }) {
	return (
		<motion.span data-cue="beam" style={centred(from.cx, from.cy, 40)} className="flex items-center justify-center text-3xl" initial={{ opacity: 0 }} animate={{ opacity: FADE, x: [0, 0, to.cx - from.cx, to.cx - from.cx], y: [0, 0, to.cy - from.cy, to.cy - from.cy], scale: [0.6, 1.2, 1.2, 0.8] }} transition={{ delay, duration: BEAT, times: [0, 0.15, 0.85, 1] }}>
			{art}
		</motion.span>
	);
}

/** A Field Spell: a soft light rises over the whole field from the side of the player who played it. */
function Wave({ cue, mat, find, delay }: { cue: Extract<Cue, { kind: "wave" }>; mat: Place; find: Finder; delay: number }) {
	const top = find({ at: "lantern", side: "rival" });
	const bottom = find({ at: "lantern", side: "you" });
	return (
		<>
			<motion.span
				data-cue="wave"
				style={at(top.x, top.y, { width: top.w, height: bottom.y + bottom.h - top.y, transformOrigin: cue.side === "you" ? "bottom" : "top", background: `linear-gradient(${cue.side === "you" ? "to top" : "to bottom"}, ${COLOR.green}, transparent)` })}
				className="block rounded-2xl"
				initial={{ opacity: 0, scaleY: 0 }}
				animate={{ opacity: [0, 0.45, 0.45, 0], scaleY: [0, 1, 1, 1] }}
				transition={{ delay, duration: BEAT * 1.4, times: TIMES }}
			/>
			<motion.span style={centred(mat.cx, mat.cy, 64)} className="flex items-center justify-center text-5xl" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: FADE, scale: [0.5, 1.3, 1.2, 1.2] }} transition={{ delay, duration: BEAT * 1.4, times: TIMES }}>
				{cue.art}
			</motion.span>
		</>
	);
}

/** Nothing happens: a small grey puff. */
function Fizzle({ spot, art, delay }: { spot: Place; art: string; delay: number }) {
	return (
		<motion.span data-cue="fizzle" style={centred(spot.cx, spot.cy, 40)} className="flex items-center justify-center text-3xl grayscale" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0.9, 0], y: [0, -6, -18, -28], scale: [0.6, 1, 1.1, 1.2] }} transition={{ delay, duration: BEAT * 1.3, times: TIMES }}>
			{art}
		</motion.span>
	);
}

/** The duel is won: stars fly out from the winner's lantern. */
function Cheer({ spot, delay }: { spot: Place; delay: number }) {
	return (
		<>
			{Array.from({ length: 8 }, (_, index) => {
				const angle = (index / 8) * Math.PI * 2;
				return (
					<motion.span key={index} data-cue="cheer" style={centred(spot.cx, spot.cy, 28)} className="flex items-center justify-center text-xl" initial={{ opacity: 0 }} animate={{ opacity: FADE, x: [0, Math.cos(angle) * 40, Math.cos(angle) * 90, Math.cos(angle) * 110], y: [0, Math.sin(angle) * 24, Math.sin(angle) * 54, Math.sin(angle) * 66], scale: [0.4, 1.2, 1, 0.8] }} transition={{ delay: delay + (index % 2) * 0.08, duration: BEAT * 1.6, times: TIMES }}>
						{index % 2 === 0 ? "⭐" : "🎉"}
					</motion.span>
				);
			})}
		</>
	);
}
