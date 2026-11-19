"use client";

import { animate } from "motion/react";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fitView, project, projectTile, type View } from "@/lib/junior/play/board3d-camera";
import { CARD, TILE, framePoints, matLayout, placeKey, spotPoint, type MatLayout } from "@/lib/junior/play/board3d-layout";
import { flights, lunges, playLength } from "@/lib/junior/play/board3d-moves";
import { impacts, lifeChanges, showLength } from "@/lib/junior/play/board3d-show";
import { holdPiles, matView, monsterFace, printedFace, type FaceSpec } from "@/lib/junior/play/board3d-view";
import type { CardId } from "@/lib/junior/play/cards";
import type { PlayCopy } from "@/lib/junior/play/copy";
import type { Beat } from "@/lib/junior/play/cues";
import { START_LP, type Board, type Row, type Side } from "@/lib/junior/play/engine";
import { BEAT, place, type Finder } from "../effect-kit";
import type { Stage3d } from "./big-moments";
import type { LpCount, Pile, StatHold } from "../mini-board";
import type { HandCardView, Play } from "./board-scene";
import { BOARD3D_COPY, SceneBoundary, type Board3d } from "./support";

const BoardScene = dynamic(() => import("./board-scene"), { ssr: false });

/** One card of the child's hand, as the level sees it: the same choices as its HTML button. */
export interface HandItem {
	card: CardId;
	state: "plain" | "picked" | "hint";
	enabled: boolean;
	onTap: () => void;
}

export interface Board3dStageProps {
	three: Board3d;
	board: Board;
	/** The board before the last move, for the cards that leave. */
	before: Board | null;
	beats: readonly Beat[];
	/** Changes with every move. */
	playId: number;
	copy: PlayCopy;
	moving: boolean;
	glow?: ReadonlySet<string> | undefined;
	chosen?: ReadonlySet<string> | undefined;
	landing?: ReadonlyMap<string, number> | undefined;
	holding?: ReadonlyMap<string, StatHold> | undefined;
	counting?: Partial<Record<Side, LpCount>> | undefined;
	onZone?: ((side: Side, row: Row, zone: number) => void) | undefined;
	onPile?: ((side: Side, pile: Pile) => void) | undefined;
	/** Missing in a demonstration: the hand is then only shown. */
	hand?: readonly HandItem[] | undefined;
	/** The place (`data-spot`) or the card of the hand (`hand-2`) the keyboard is on, in the HTML twin. */
	focusKey: string | null;
	/** The HTML effects of the move, laid over the mat: given where things are on the screen, and what the mat looks like there. */
	effects?: ((find: Finder, stage: Stage3d) => ReactNode) | undefined;
}

/** Life Points over a corner of the mat: a name, the number (counted up or down while an effect plays) and a bar. Decorative: the HTML twin says them. */
function LifeChip({ side, name, lp, moving, count, playId }: { side: Side; name: string; lp: number; moving: boolean; count?: LpCount | undefined; playId: number }) {
	const counting = moving && !!count && count.from !== lp;
	const from = count?.from ?? lp;
	const delay = count?.delay ?? 0;
	const [tick, setTick] = useState<{ id: number; value: number } | null>(null);
	useEffect(() => {
		if (!counting) return;
		const controls = animate(from, lp, { duration: 0.7, delay, ease: "easeOut", onUpdate: (value) => setTick({ id: playId, value: Math.round(value / 10) * 10 }) });
		return () => controls.stop();
	}, [counting, from, lp, delay, playId]);
	const shown = !counting ? lp : tick && tick.id === playId ? tick.value : from;
	const share = Math.max(0, Math.min(100, (shown / START_LP) * 100));
	return (
		<div data-spot={`${side}-lantern`} className={`pointer-events-none absolute top-1.5 w-[7rem] rounded-xl border-2 bg-ink-950/80 px-2 py-0.5 backdrop-blur-sm md:w-[9.5rem] md:px-3 md:py-1 ${side === "rival" ? "left-1.5 border-ember-400" : "right-1.5 border-arcane-400"}`}>
			<p className="flex items-baseline justify-between gap-1 text-xs font-semibold text-white">
				<span className="truncate" dir="auto">
					<span className={shown === 0 ? "opacity-30 grayscale" : ""}>🏮</span> {name}
				</span>
				<bdi dir="ltr" className={`text-lg font-black md:text-2xl ${counting && shown !== lp && shown !== from ? (lp < from ? "text-ember-400" : "text-spell") : ""}`}>
					{shown}
				</bdi>
			</p>
			<div className="h-1.5 overflow-hidden rounded-full bg-ink-700" dir="ltr">
				<div className={`h-full rounded-full ${side === "you" ? "bg-arcane-400" : "bg-ember-400"} ${moving && !counting ? "transition-[width] duration-700" : ""}`} style={{ width: `${share}%` }} />
			</div>
		</div>
	);
}

/** Where the spots of the effects are on the screen: zones and piles from the camera, the Life Points from their chips. */
function finderOf(root: HTMLElement, layout: MatLayout, view: View, width: number, height: number): Finder {
	const mat = projectTile(view, { x: (layout.minX + layout.maxX) / 2, y: 0, z: (layout.minZ + layout.maxZ) / 2 }, layout.maxX - layout.minX, layout.maxZ - layout.minZ, width, height);
	return (spot) => {
		if (spot.at === "center") return place(mat.x, mat.y, mat.w, mat.h, true);
		if (spot.at === "lantern") {
			const chip = root.querySelector(`[data-spot="${spot.side}-lantern"]`);
			if (chip) {
				const origin = root.getBoundingClientRect();
				const box = chip.getBoundingClientRect();
				return place(box.left - origin.left, box.top - origin.top, box.width, box.height, true);
			}
		}
		const point = spotPoint(layout, spot);
		if (!point.found) {
			const at = project(view, point, width, height);
			return place(at.x, at.y, 0, 0, false);
		}
		const box = projectTile(view, point, TILE.w, TILE.d, width, height);
		return place(box.x, box.y, box.w, box.h, true);
	};
}

/**
 * The 3D mat with everything that is laid over it: the Life Points in the top corners and the HTML effects of the
 * last move (a Summon scene, a bolt, the numbers that rise). It measures the room it is given, works out the camera
 * for it, and hands the same camera to the scene and to the effects, so a ring opens exactly on its zone.
 */
export function Board3dStage({ three, board, before, beats, playId, copy, moving, glow, chosen, landing, holding, counting, onZone, onPile, hand, focusKey, effects }: Board3dStageProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<{ w: number; h: number } | null>(null);
	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const measure = () => {
			const box = root.getBoundingClientRect();
			setSize((old) => (old && old.w === box.width && old.h === box.height ? old : { w: box.width, h: box.height }));
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(root);
		return () => observer.disconnect();
	}, []);
	const layout = useMemo(() => matLayout(board.full), [board.full]);
	const view = useMemo(() => (size && size.w > 0 && size.h > 0 ? fitView(framePoints(layout), size.w / size.h) : null), [layout, size]);
	/* The clock of the move starts when the move is first drawn. */
	const play = useMemo<Play>(
		() => {
			const hits = moving ? impacts(beats, BEAT) : [];
			return { id: playId, at: performance.now(), flights: before && moving ? flights(before, beats, BEAT) : [], lunges: moving ? lunges(beats, BEAT) : [], impacts: hits, length: beats.length > 0 ? Math.max(playLength(beats, BEAT), showLength([], lifeChanges(beats, BEAT), hits)) : 0.8 };
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[playId, beats],
	);
	const cards = useMemo<HandCardView[]>(
		() =>
			hand
				? hand.map((item, index) => ({ face: printedFace(copy, item.card), state: item.state, dim: !item.enabled, focused: focusKey === `hand-${index}`, ...(item.enabled ? { tap: item.onTap } : {}) }))
				: board.you.hand.map((card) => ({ face: printedFace(copy, card), state: "plain" as const, dim: false, focused: false })),
		[hand, board.you.hand, copy, focusKey],
	);
	/* A flying card looks as it did where it stood: a monster from a zone keeps the number it showed there. */
	const flightFaces = useMemo(() => {
		const out = new Map<string, FaceSpec>();
		for (const flight of play.flights) {
			if (!flight.card) continue;
			const slot = before && flight.from.at === "zone" && flight.from.row === "monsters" ? before[flight.from.side].monsters[flight.from.zone] : null;
			out.set(flight.id, slot && slot.card === flight.card ? monsterFace(copy, before!, slot) : printedFace(copy, flight.card));
		}
		return out;
	}, [play, before, copy]);
	const places = useMemo(() => {
		const now = matView({ board, copy, layout, glow, chosen, landing, holding, onZone, onPile });
		if (!before || play.flights.length === 0) return now;
		const arrivals = new Map<string, number>();
		for (const flight of play.flights) arrivals.set(placeKey(flight.to), Math.max(arrivals.get(placeKey(flight.to)) ?? 0, flight.start + flight.length * 0.9));
		return holdPiles(now, matView({ board: before, copy, layout }), arrivals);
	}, [board, before, play, copy, layout, glow, chosen, landing, holding, onZone, onPile]);
	/* The effects need the chips in the page to find the Life Points: they wait for the first layout, like the HTML board's. */
	const [found, setFound] = useState<{ id: number; find: Finder; stage: Stage3d } | null>(null);
	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root || !view || !size || beats.length === 0) return;
		/* A card flying in an HTML scene is as big as a card lying in the middle of the mat. */
		const unit = project(view, { x: 0, y: 0, z: 0 }, size.w, size.h).scale;
		const depth = (layout.maxZ - layout.minZ) / 2;
		const half = (side: Side) => {
			const box = projectTile(view, { x: (layout.minX + layout.maxX) / 2, y: 0, z: side === "you" ? layout.maxZ - depth / 2 : layout.minZ + depth / 2 }, layout.maxX - layout.minX, depth, size.w, size.h);
			return place(box.x, box.y, box.w, box.h, true);
		};
		/* The big numbers grow with the mat: about a card and a half high on a phone, never huge on a desktop. */
		setFound({ id: playId, find: finderOf(root, layout, view, size.w, size.h), stage: { card: { w: Math.max(30, unit * CARD.w), h: Math.max(36, unit * CARD.w * 1.15) }, half, big: Math.max(26, Math.min(64, unit * 1.05)) } });
	}, [playId, beats, view, size, layout]);
	const words = BOARD3D_COPY[three.locale];
	return (
		<div ref={rootRef} data-board-3d dir="ltr" aria-hidden className="absolute inset-0 select-none overflow-hidden">
			{view && (
				<SceneBoundary onError={three.fail}>
					<Suspense fallback={<p className="grid h-full place-items-center font-display text-lg text-ink-950">{words.loading}</p>}>
						<BoardScene view={view} layout={layout} places={places} hand={cards} play={play} moving={moving} focusKey={focusKey} flightFaces={flightFaces} labels={words.zones} onLost={three.fail} />
					</Suspense>
				</SceneBoundary>
			)}
			<LifeChip side="rival" name={copy.rivalName} lp={board.rival.lp} moving={moving} count={counting?.rival} playId={playId} />
			<LifeChip side="you" name={words.you} lp={board.you.lp} moving={moving} count={counting?.you} playId={playId} />
			{effects && found?.id === playId && beats.length > 0 && effects(found.find, found.stage)}
		</div>
	);
}
