"use client";

import { Check, ChevronLeft, ChevronRight, Lock, Play, Star } from "lucide-react";
import dynamic from "next/dynamic";
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { WORLD_IDS, levelsOf, type WorldId } from "@/lib/junior/play/levels";
import { MASTER_SHORT_NAMES, masterOfLevel, masterPicture, type MasterId } from "@/lib/junior/play/masters";
import type { PlayProgress } from "@/lib/junior/play/progress";
import type { Avatar } from "@/lib/junior/profiles";
import { WORLD_COPY } from "@/lib/junior/world/copy";
import { currentIsland, islandStatus, stopStatus, type StopStatus } from "@/lib/junior/world/status";
import { createMapControls } from "@/lib/junior/world/controls";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { SHOP_ISLAND } from "@/lib/junior/world/shop";
import { islandTrainerPictures } from "@/lib/junior/world/trainers";
import type { Outfit } from "@/lib/junior/world/wardrobe";
import type { Dorm } from "@/lib/junior/world/dorm";
import { buildWorld } from "@/lib/junior/world/world";
import { ActionButton, MovePad } from "../play/move-pad";

const WorldScene = dynamic(() => import("./world-scene"), { ssr: false });

/** True when this browser can draw WebGL. Checked once, in the browser only. */
function canDraw3d(): boolean {
	try {
		const canvas = document.createElement("canvas");
		return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
	} catch {
		return false;
	}
}

/** Any failure inside the 3D scene hides it; the list of levels below stays. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch() {
		this.props.onError();
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

export interface IslandWorldProps {
	progress: PlayProgress;
	copy: PlayCopy;
	locale: Locale;
	moving: boolean;
	/** True while a level is played over the world: the boat waits to sail until the child is back. */
	hidden: boolean;
	/** Controls for the top corner of the map (the sound switch, change player). */
	corner?: ReactNode;
	/** For the other top corner: the shop and the stars to spend. */
	cornerStart?: ReactNode;
	/** The child's chosen figure, walking on the map. */
	avatar?: Avatar;
	/** What the figure wears, bought in Grandpa's shop. */
	outfit?: Outfit;
	/** The child's dorm: its leader stands on the tower island. */
	dorm?: Dorm | null;
	/** Per island, in `WORLD_IDS` order: the address of its signature card's art, shown on a panel on the island. */
	islandCards?: readonly (string | null)[];
	/** Drawn above the island's buttons: the island's trainer. */
	trainer?: (world: WorldId) => ReactNode;
	onOpen: (levelId: string) => void;
	/** Opens Grandpa's game shop: from its building on the first island, or from the shop button. */
	onShop?: () => void;
	/** Tells the page whether the 3D world is shown, so it can leave out what the world already offers. */
	onAvailable: (available: boolean) => void;
}

const stopIcon = (status: StopStatus) =>
	status === "star" ? <Star className="h-5 w-5 fill-gold-400 text-gold-400" aria-hidden /> : status === "solved" ? <Check className="h-5 w-5 text-spell" aria-hidden /> : status === "locked" ? <Lock className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4 rtl:rotate-180" aria-hidden />;

/** A trainer to duel, on a stop of the masters' island: the face, round, greyed while the duel is still locked. */
function TrainerFace({ master, status, size }: { master: MasterId; status: StopStatus; size: "stop" | "play" }) {
	return (
		<img
			src={masterPicture(master)}
			alt=""
			width={256}
			height={256}
			className={`shrink-0 rounded-full border-2 bg-ink-800 object-cover object-top ${size === "stop" ? "h-12 w-12" : "h-10 w-10"} ${status === "locked" ? "border-white/20 opacity-60 grayscale" : status === "next" ? "border-gold-400" : "border-white/60"}`}
		/>
	);
}

/**
 * The landing of Junior: an archipelago in 3D, one island per world. The child taps an island and the boat sails
 * there; taps a glowing stop and the level starts. The canvas is decoration for assistive technology: every
 * action is also a real button here, and the full list of levels stays on the page below.
 */
export function IslandWorld({ progress, copy, locale, moving, hidden, corner, cornerStart, avatar, outfit, dorm = null, islandCards, trainer, onOpen, onShop, onAvailable }: IslandWorldProps) {
	const words = WORLD_COPY[locale];
	const pad = CONTROLS_COPY[locale];
	const world = useMemo(() => buildWorld(), []);
	/* The direction pad and the action button talk to the scene through this. */
	const controls = useMemo(() => createMapControls(), []);
	const trainerPictures = useMemo(() => islandTrainerPictures(dorm), [dorm]);
	const [supported, setSupported] = useState<boolean | null>(null);
	const here = WORLD_IDS.indexOf(currentIsland(progress));
	const [focus, setFocus] = useState(here);
	/*
	 * When the child's next level moves to a new island (a level was solved), sail there once the world shows again.
	 * Only then: coming back from a replayed level leaves the map on the island the child was looking at.
	 */
	const sailedFor = useRef(here);
	useEffect(() => {
		if (hidden || sailedFor.current === here) return;
		sailedFor.current = here;
		setFocus(here);
	}, [here, hidden]);
	useEffect(() => {
		const ok = canDraw3d();
		setSupported(ok);
		onAvailable(ok);
	}, [onAvailable]);
	const fail = () => {
		setSupported(false);
		onAvailable(false);
	};

	const statuses = useMemo(() => WORLD_IDS.map((id) => islandStatus(progress, id)), [progress]);
	/* On the row of trainers, the next one to duel is scrolled into sight (once per button, not on every render). */
	const showNext = useCallback((node: HTMLButtonElement | null) => node?.scrollIntoView?.({ block: "nearest", inline: "center" }), []);
	const stops = useMemo(() => Object.fromEntries(world.islands.flatMap((island) => island.stops.map((stop) => [stop.levelId, stopStatus(progress, stop.levelId)]))), [world, progress]);
	if (!supported) return null;

	const island = world.islands[focus]!;
	const levels = levelsOf(island.world);
	const status = statuses[focus]!;
	const nextHere = levels.find((level) => stops[level.id] === "next");
	const nextTrainer = nextHere ? masterOfLevel(nextHere.id) : null;
	/* The masters' island: thirteen trainers, each shown by face. They stay on one row the child scrolls through. */
	const duels = levels.some((level) => masterOfLevel(level.id));
	const solved = levels.filter((level) => stops[level.id] === "solved" || stops[level.id] === "star").length;
	const title = copy.worlds[island.world].title;
	const before = focus > 0 ? copy.worlds[WORLD_IDS[focus - 1]!].title : "";
	const go = (index: number) => setFocus(Math.max(0, Math.min(WORLD_IDS.length - 1, index)));
	const arrow = "pointer-events-auto grid h-12 w-12 place-items-center rounded-full border-2 border-white/70 bg-ink-950/55 text-white shadow-lg backdrop-blur-sm disabled:opacity-30 md:h-14 md:w-14";

	return (
		/* The whole screen under the header: `svh` so a phone's browser bars never hide the buttons at the bottom. */
		<section aria-label={words.region} className="relative overflow-hidden bg-[linear-gradient(180deg,#7cc8f2_0%,#bfe8ff_55%,#e9f7ff_100%)]">
			<div className="h-[calc(100svh-var(--chrome-top))] min-h-[18rem] w-full">
				<SceneBoundary onError={fail}>
					<Suspense fallback={<p className="grid h-full place-items-center font-display text-lg text-ink-950">{words.loading}</p>}>
						<WorldScene world={world} focus={focus} islandStatus={statuses} stopStatus={stops} moving={moving} avatar={avatar} outfit={outfit} islandCards={islandCards} trainerPictures={trainerPictures} controls={controls} shopIsland={SHOP_ISLAND} onShop={onShop} onPickIsland={go} onPickStop={onOpen} onLost={fail} />
					</Suspense>
				</SceneBoundary>
			</div>

			{/* Island name and progress, over the sky. */}
			{/* On a short screen (a phone on its side) the words get smaller and the side notes go, so the map shows. */}
			<div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 px-16 pt-3 text-center [@media(max-height:32rem)]:pt-2">
				{/* Previous and next island beside the island's number: the scene is not mirrored in Hebrew, so the arrows are not either. */}
				<div className="flex items-center gap-2" dir="ltr">
					<button type="button" className={arrow} disabled={focus === 0} onClick={() => go(focus - 1)} aria-label={words.previous}>
						<ChevronLeft className="h-7 w-7" aria-hidden />
					</button>
					<p dir="auto" className="rounded-full bg-ink-950/55 px-3 py-0.5 text-sm font-semibold text-white backdrop-blur-sm [@media(max-height:32rem)]:hidden">
						{words.islandOf(focus + 1, WORLD_IDS.length)}
					</p>
					<button type="button" className={arrow} disabled={focus === WORLD_IDS.length - 1} onClick={() => go(focus + 1)} aria-label={words.next}>
						<ChevronRight className="h-7 w-7" aria-hidden />
					</button>
				</div>
				{/* Back from a level, focus (and the page) lands here, not on the list below. */}
				<h2 {...(hidden ? {} : { "data-step-heading": true, tabIndex: -1 })} className="font-display text-2xl leading-tight text-ink-950 outline-none drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] md:text-4xl [@media(max-height:32rem)]:text-xl">
					{title}
				</h2>
				<p className="max-w-md text-sm font-semibold text-ink-950/80 md:text-base [@media(max-height:32rem)]:hidden">{status === "locked" ? words.lockedIsland(before) : status === "done" ? words.replay : words.solvedOf(solved, levels.length)}</p>
			</div>
			{corner && <div className="absolute end-3 top-3">{corner}</div>}
			{/* Grandpa's shop stands on the first island only, so its button shows only there. */}
			{cornerStart && focus === SHOP_ISLAND && <div className="absolute start-3 top-3">{cornerStart}</div>}

			{/*
			 * A game pad: directions on the left, the one action on the right, on every screen. Only with a figure to move.
			 * On a phone it sits just above the trainer's words, clear of the figure in the upper half; on a tablet (an iPad in both hands) in the bottom corners, under the thumbs,
			 * above the stops and the Play button, which keep the middle.
			 */}
			<div className="pointer-events-none absolute inset-x-0 top-[60%] z-10 flex -translate-y-1/2 items-center justify-between px-2 [@media(max-height:32rem)]:top-1/2 [@media(max-height:32rem)]:pe-[4.5rem] tablet:top-auto tablet:bottom-[max(1.5rem,env(safe-area-inset-bottom))] tablet:translate-y-0 tablet:items-end tablet:px-6" dir="ltr">
				{avatar ? <MovePad controls={controls} copy={pad} /> : <span />}
				{avatar && <ActionButton controls={controls} copy={pad} />}
			</div>

			{/* The stops of this island as buttons, and the big button to the next level. */}
			<div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-ink-950/70 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 [@media(max-height:32rem)]:flex-row [@media(max-height:32rem)]:flex-wrap [@media(max-height:32rem)]:justify-center [@media(max-height:32rem)]:gap-2 [@media(max-height:32rem)]:pt-6 tablet:px-[16rem]">
				{trainer && status !== "locked" && trainer(island.world)}
				{nextHere && (
					<button type="button" onClick={() => onOpen(nextHere.id)} className="inline-flex min-h-14 max-w-full items-center gap-3 rounded-2xl bg-gold-400 px-7 py-3 text-lg font-semibold text-ink-950 shadow-[0_0_24px_rgba(255,216,74,0.6)] max-sm:w-full max-sm:justify-center [@media(max-height:32rem)]:min-h-12 [@media(max-height:32rem)]:w-auto [@media(max-height:32rem)]:py-2 [@media(max-height:32rem)]:text-base">
						{nextTrainer ? <TrainerFace master={nextTrainer} status="next" size="play" /> : <Play className="h-6 w-6 rtl:rotate-180" aria-hidden />}
						{words.play(copy.levels[nextHere.id]?.title ?? "")}
					</button>
				)}
				{status !== "locked" && (
					<ol aria-label={words.stopsLabel} className={duels ? "flex max-w-full snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]" : "flex flex-wrap justify-center gap-2"}>
						{levels.map((level, i) => {
							const state = stops[level.id]!;
							const label = copy.levels[level.id]?.title ?? level.id;
							const said = state === "star" ? copy.starMark : state === "solved" ? copy.solvedMark : state === "locked" ? copy.locked : words.next_;
							const master = masterOfLevel(level.id);
							if (master)
								return (
									<li key={level.id} className="snap-center">
										<button
											type="button"
											ref={state === "next" ? showNext : undefined}
											disabled={state === "locked"}
											onClick={() => onOpen(level.id)}
											aria-label={words.stop(i + 1, label, said)}
											title={label}
											className={`relative flex w-[4.5rem] flex-col items-center gap-0.5 rounded-xl border-2 px-1 pb-1 pt-1.5 text-xs font-semibold backdrop-blur-sm ${state === "next" ? "border-gold-400 bg-gold-400/30 text-white" : state === "locked" ? "border-white/20 bg-ink-950/40 text-white/60" : "border-white/60 bg-ink-950/50 text-white"}`}
										>
											<TrainerFace master={master} status={state} size="stop" />
											<bdi dir="ltr" className="max-w-full truncate">
												{MASTER_SHORT_NAMES[master]}
											</bdi>
											{state !== "next" && <span className="absolute end-0.5 top-0.5 rounded-full bg-ink-950/70 p-0.5">{stopIcon(state)}</span>}
										</button>
									</li>
								);
							return (
								<li key={level.id}>
									<button
										type="button"
										disabled={state === "locked"}
										onClick={() => onOpen(level.id)}
										aria-label={words.stop(i + 1, label, said)}
										title={label}
										className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl border-2 px-3 font-semibold backdrop-blur-sm ${state === "next" ? "border-gold-400 bg-gold-400/30 text-white" : state === "locked" ? "border-white/20 bg-ink-950/40 text-white/60" : "border-white/60 bg-ink-950/50 text-white"}`}
									>
										<bdi dir="ltr">{i + 1}</bdi>
										{stopIcon(state)}
									</button>
								</li>
							);
						})}
					</ol>
				)}
				<p className="text-center text-sm text-white/90 max-sm:hidden [@media(max-height:32rem)]:hidden">{words.hint}</p>
			</div>
		</section>
	);
}
