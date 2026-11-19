"use client";

import { BookOpen, Check, House, Lock, Play, Shirt, Smartphone, Star, Store, Volume2, VolumeX } from "lucide-react";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import { HOME_COPY } from "@/lib/junior/home/copy";
import { requestPersist } from "@/lib/junior/persist";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { LEVELS, RULE_IDS, WORLD_IDS, levelById, levelsOf, type WorldId } from "@/lib/junior/play/levels";
import { PLAY_PROGRESS_KEY, emptyPlayProgress, isSolved, isUnlocked, loadPlayProgress, mergePlayProgress, nextLevel, recordSolve, ruleMastery, savePlayProgress, type PlayProgress, type PlayStorage } from "@/lib/junior/play/progress";
import type { Outcome } from "@/lib/junior/play/session";
import { stopSpeaking } from "@/lib/junior/play/sound";
import { type Avatar, DEFAULT_AVATAR, characterLocked } from "@/lib/junior/profiles";
import { islandStatus } from "@/lib/junior/world/status";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { SHOP_ISLAND, type ShopRecord, buy, buyItem, giveItem, loadShop, parseShop, shopKeyFor, starsLeft, starsWon, takeOff, wear } from "@/lib/junior/world/shop";
import { binder, islandCardUrls, rewardCards } from "@/lib/junior/world/trainers";
import type { Outfit } from "@/lib/junior/world/wardrobe";
import { type Dorm, dormCapId, dormKeyFor, dormToChoose, loadDorm, saveDorm } from "@/lib/junior/world/dorm";
import { IslandWorld } from "../world/island-world";
import { AlbumCards, AlbumDialog } from "./album-dialog";
import { LevelPlayer } from "./level-player";
import { RewardReveal } from "./reward-reveal";
import { ShopDialog, type WardrobeActions } from "./shop-dialog";

/* The shop's try-on figure: 3D, loaded only when the shop's "For your hero" tab shows it. */
const OutfitPreview = dynamic(() => import("../world/outfit-preview"), { ssr: false });
import { TrainerTalk } from "./trainer-talk";
import { DormDialog } from "./dorm-dialog";
import { HeroRoom } from "./hero-room";
import { QuestPage } from "./quest-page";
import type { Locale } from "@/lib/i18n/locales";
import { SaveLanguage } from "../home/save-language";
import { FullScreenButton } from "./full-screen-button";
import { useImmersive } from "./use-immersive";

const finishedIslands = (progress: PlayProgress) => WORLD_IDS.filter((world) => islandStatus(progress, world) === "done").length;

function getStorage(): PlayStorage | undefined {
	try {
		return window.localStorage;
	} catch {
		return undefined;
	}
}
const toggle = (on: boolean) => `inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 py-2 font-semibold text-fg ${on ? "border-gold-400 bg-gold-400/20" : "border-white/25"}`;

/** The child playing, when the title screen opened a save slot. Without it, the page uses the one legacy record. */
export interface JuniorPlayer {
	/** The slot's own storage (see `slotStorage`) and the key another tab's change arrives on. */
	storage: PlayStorage;
	key: string;
	/** False once this save was deleted or replaced in another tab: nothing is saved, and the page goes back. */
	stillMine: () => boolean;
	avatar: Avatar;
	/** The nickname, or the default name. */
	name: string;
	onChangePlayer: () => void;
	/** Changes this save's character, from "My hero", only until the first mission is done. */
	onChangeAvatar?: (avatar: Avatar) => void;
	/** This save's own language (null: the site's), and changing it from the pause menu, also in full screen. */
	locale?: Locale | null;
	onChangeLocale?: (locale: Locale | null) => void;
}

/**
 * Junior mode: a map of short playable levels, one new rule at a time, and the level being played.
 * Progress lives in this browser only. There is no account, no timer, no streak and no link out.
 */
/** `onTitle`: back to the title screen, also for a game played without a save (a browser that keeps nothing). */
export function JuniorPlay({ player, onTitle }: { player?: JuniorPlayer; onTitle?: () => void } = {}) {
	const { locale } = useLanguage();
	const copy = PLAY_COPY[locale];
	const pad = CONTROLS_COPY[locale];
	const playerRef = useRef(player);
	playerRef.current = player;
	const storageOf = useCallback(() => (playerRef.current ? playerRef.current.storage : getStorage()), []);
	const storageKey = player?.key ?? PLAY_PROGRESS_KEY;
	/*
	 * What was bought in Grandpa's shop (cards, things for the figure, what it wears), beside this save's play record.
	 * Read and written through the page's storage under the shop key: a slot's storage only maps the play key.
	 */
	const shopKey = shopKeyFor(storageKey);
	const [shop, setShop] = useState<ShopRecord>(() => parseShop(null));
	const bought = shop.cards;
	/* The dorm chosen (Slifer Red, Ra Yellow, Obelisk Blue), stored the same way under its own key. */
	const dormKey = dormKeyFor(storageKey);
	const [dorm, setDorm] = useState<Dorm | null>(null);
	const dormRef = useRef(dorm);
	dormRef.current = dorm;
	/* Closed without choosing: asked again on the next visit. */
	const [dormLater, setDormLater] = useState(false);
	const [shopOpen, setShopOpen] = useState(false);
	const [albumOpen, setAlbumOpen] = useState(false);
	const [heroOpen, setHeroOpen] = useState(false);
	const [progress, setProgress] = useState(emptyPlayProgress);
	const [hydrated, setHydrated] = useState(false);
	const [deviceReduced, setDeviceReduced] = useState(false);
	const [active, setActive] = useState<string | null>(null);
	const progressRef = useRef(progress);
	const rootRef = useRef<HTMLElement>(null);
	/*
	 * Motion follows the device's "reduce motion" setting only; there is no calm button any more, so an old saved
	 * calm choice is ignored. Motion stays off until the device setting is known, so it never flashes.
	 */
	const moving = hydrated && !deviceReduced;

	const apply = useCallback((value: PlayProgress) => {
		progressRef.current = value;
		setProgress(value);
	}, []);
	/** A change by the child: save it merged with the latest stored record, then show the merged result. */
	const commit = useCallback(
		(change: (current: PlayProgress) => PlayProgress) => {
			const changed = change(progressRef.current);
			if (changed === progressRef.current) return;
			const current = playerRef.current;
			/* The save was deleted or replaced in another tab: writing now would bring the old child's record back. */
			if (current && !current.stillMine()) return current.onChangePlayer();
			apply(savePlayProgress(storageOf(), changed) ?? changed);
		},
		[apply, storageOf],
	);
	/* Server and first client render use the empty default; saved progress and the device setting join after hydration. */
	useEffect(() => {
		/* Sound is off each time the game opens (the owner's choice): turning it on lasts for this visit only. */
		apply({ ...mergePlayProgress(progressRef.current, loadPlayProgress(storageOf()).progress), sound: false });
		const storage = getStorage();
		const chosen = loadDorm(storage, dormKey);
		let record = loadShop(storage, shopKey);
		/* A save that chose its dorm before caps existed gets its cap now, worn, once (never again if it is taken off). */
		const cap = chosen && dormCapId(chosen);
		const stillMine = !playerRef.current || playerRef.current.stillMine();
		if (storage && cap && stillMine && !record.items.includes(cap)) record = giveItem(storage, shopKey, cap) ?? record;
		setShop(record);
		setDorm(chosen);
		setDeviceReduced(typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
		setHydrated(true);
	}, [apply, storageOf, shopKey, dormKey]);
	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = (event: MediaQueryListEvent) => setDeviceReduced(event.matches);
		query.addEventListener?.("change", update);
		return () => query.removeEventListener?.("change", update);
	}, []);
	/* Another tab saved progress: take its solved levels and its choices. */
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key === shopKey) return setShop(loadShop(getStorage(), shopKey));
			if (event.key === dormKey) return setDorm(loadDorm(getStorage(), dormKey));
			if (event.key !== storageKey) return;
			const latest = loadPlayProgress(storageOf());
			/* Sound stays as this tab has it: another tab turning it on must not make this one speak. */
			if (latest.writable) apply({ ...mergePlayProgress(progressRef.current, latest.progress), sound: progressRef.current.sound });
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [apply, storageKey, storageOf, shopKey, dormKey]);
	/* Each new screen starts at its heading, for keyboard and screen-reader users. */
	const shown = useRef(active);
	useEffect(() => {
		if (shown.current === active) return;
		shown.current = active;
		rootRef.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus();
	}, [active]);

	const level = active ? levelById(active) : undefined;
	const index = level ? LEVELS.indexOf(level) : -1;
	const following = LEVELS[index + 1];
	/* Whether this level was already solved when it was opened: decides if its demonstration plays by itself. */
	const solvedAtOpen = useRef(false);
	const open = (id: string) => {
		solvedAtOpen.current = isSolved(progressRef.current, id);
		/* A mission opened from the map closes the map's dialogs: back on the map, none comes back by itself. */
		setHeroOpen(false);
		setActive(id);
	};
	/* Cards that joined the binder with the last solve: shown once, large, back on the map. */
	const [revealed, setRevealed] = useState<string[]>([]);
	const [homeHint, setHomeHint] = useState(false);
	/* The stars the last solve won, said once back on the map (an island or a real duel gives more). */
	const [won, setWon] = useState<ReturnType<typeof starsWon> | null>(null);
	const onMapNow = !active;
	useEffect(() => {
		if (!won || !onMapNow) return;
		const timer = window.setTimeout(() => setWon(null), 5000);
		return () => window.clearTimeout(timer);
	}, [won, onMapNow]);
	const onSolved = useCallback(
		(result: Outcome) => {
			if (!active) return;
			const before = binder(progressRef.current, [], dormRef.current);
			const recordBefore = progressRef.current;
			const islandsBefore = finishedIslands(progressRef.current);
			commit((current) => recordSolve(current, active, result));
			const gained = starsWon(recordBefore, progressRef.current, active);
			if (gained.stars > 0) setWon(gained);
			const fresh = binder(progressRef.current, [], dormRef.current).filter((card) => !before.includes(card));
			/* The first finished island: a save now worth keeping, so the parents' Home Screen hint comes with its reward. */
			if (islandsBefore === 0 && finishedIslands(progressRef.current) > 0) setHomeHint(true);
			if (fresh.length) setRevealed((shown) => [...shown, ...fresh.filter((card) => !shown.includes(card))]);
			void requestPersist();
		},
		[active, commit],
	);
	const upNext = nextLevel(progress);
	const cards = binder(progress, bought, dorm);
	/* Things this character cannot hold (bought before each character had its own) are refunded: they cost nothing. */
	const heroAvatar = player?.avatar ?? DEFAULT_AVATAR;
	const stars = starsLeft(progress, bought, shop.items, heroAvatar);
	const onChooseDorm = (choice: Dorm) => {
		const storage = shopStorage();
		if (!storage || !saveDorm(storage, dormKey, choice)) return;
		setDorm(choice);
		/* Joining a dorm gives its cap at once, worn (the owner's wish); it can be taken off in the shop like any hat. */
		const dressed = giveItem(storage, shopKey, dormCapId(choice));
		if (dressed) setShop(dressed);
	};
	/** The page's storage, unless this save was deleted or replaced in another tab (then nothing is written). */
	const shopStorage = () => {
		const storage = getStorage();
		const current = playerRef.current;
		return !storage || (current && !current.stillMine()) ? null : storage;
	};
	const onBuy = (card: string) => {
		const storage = shopStorage();
		if (!storage) return false;
		const result = buy(storage, shopKey, progressRef.current, card, heroAvatar);
		if (result.ok) setShop(loadShop(storage, shopKey));
		return result.ok;
	};
	/* Trying things on in the shop: the 3D figure, or its still picture where 3D cannot run. */
	const [previewOk, setPreviewOk] = useState(true);
	const preview = (outfit: Outfit, avatar: Avatar = player?.avatar ?? DEFAULT_AVATAR, heading?: number) => (
		<OutfitPreview avatar={avatar} outfit={outfit} moving={moving} onFail={() => setPreviewOk(false)} {...(heading === undefined ? { className: "h-44 w-44" } : { heading, className: "h-full w-full" })} />
	);
	const wardrobe: WardrobeActions = {
		avatar: player?.avatar ?? DEFAULT_AVATAR,
		items: shop.items,
		wear: shop.wear,
		onBuy: (id) => {
			const storage = shopStorage();
			if (!storage) return false;
			const result = buyItem(storage, shopKey, progressRef.current, id, heroAvatar);
			if (result.ok) setShop(result.shop);
			return result.ok;
		},
		onWear: (id) => {
			const storage = shopStorage();
			const outfit = storage && wear(storage, shopKey, id);
			if (outfit) setShop((current) => ({ ...current, wear: outfit }));
		},
		onTakeOff: (slot) => {
			const storage = shopStorage();
			const outfit = storage && takeOff(storage, shopKey, slot);
			if (outfit) setShop((current) => ({ ...current, wear: outfit }));
		},
	};
	const shopButton = (
		<button type="button" onClick={() => setShopOpen(true)} aria-label={pad.shopButton(stars)} title={pad.shopButton(stars)} className="pointer-events-auto relative grid h-12 w-12 place-items-center rounded-full border-2 border-gold-400 bg-ink-950/55 text-gold-400 backdrop-blur-sm">
			<Store className="h-6 w-6" aria-hidden />
			<span aria-hidden className="absolute -bottom-2 start-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-gold-400 px-1.5 text-xs font-bold text-ink-950 rtl:translate-x-1/2">
				<Star className="h-3 w-3 fill-ink-950" />
				<bdi dir="ltr">{stars}</bdi>
			</span>
		</button>
	);
	const rewards = new Set(rewardCards(progress, dorm));
	/* "My hero", the pause menu: the outfit changes at any time, the character only before the first mission is done. */
	const heroButton = (
		<button type="button" onClick={() => setHeroOpen(true)} aria-label={pad.heroButton} title={pad.heroButton} className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border-2 border-white/70 bg-ink-950/55 text-white backdrop-blur-sm">
			<Shirt className="h-6 w-6" aria-hidden />
		</button>
	);
	/* The album, always one tap away on the map (under the corner buttons) and in the list. */
	const albumButton = (
		<button type="button" onClick={() => setAlbumOpen(true)} aria-label={pad.albumButton(cards.length)} title={pad.albumButton(cards.length)} className="pointer-events-auto relative grid h-12 w-12 place-items-center rounded-full border-2 border-white/70 bg-ink-950/55 text-white backdrop-blur-sm">
			<BookOpen className="h-6 w-6" aria-hidden />
			<span aria-hidden className="absolute -bottom-2 start-1/2 -translate-x-1/2 rounded-full bg-white px-1.5 text-xs font-bold text-ink-950 rtl:translate-x-1/2">
				<bdi dir="ltr">{cards.length}</bdi>
			</span>
		</button>
	);
	const islandCards = useMemo(() => islandCardUrls(progress, dorm), [progress, dorm]);
	/* Whether the island world is shown: null until known. With it, the map is the whole page; without it, the list is. */
	const [islands, setIslands] = useState<boolean | null>(null);
	const onMap = !level && islands === true;
	/* Full screen (`FullScreenButton`): no header or footer, and on the map nothing but the map. */
	const immersive = useImmersive();
	const toggleSound = () => {
		if (progress.sound) stopSpeaking();
		commit((current) => ({ ...current, sound: !current.sound }));
	};
	/* What the map does not show: the rules met so far, the cards played with, and the older quiz. */
	const extras = (
		<>
			<section aria-labelledby="rules-title" className="space-y-2">
				<h2 id="rules-title" className="font-display text-xl text-fg">
					{copy.rulesTitle}
				</h2>
				<ul className="grid gap-1 sm:grid-cols-2">
					{RULE_IDS.map((rule) => {
						const mastery = ruleMastery(progress, rule);
						return (
							<li key={rule} className={`flex items-center gap-2 ${mastery === "new" ? "text-fg-muted" : "text-fg"}`}>
								{mastery === "mastered" ? <Star className="h-4 w-4 shrink-0 fill-gold-400 text-gold-400" aria-hidden /> : mastery === "met" ? <Check className="h-4 w-4 shrink-0 text-spell" aria-hidden /> : <span aria-hidden className="h-4 w-4 shrink-0 rounded-full border border-white/25" />}
								<span>
									{copy.rules[rule]} <span className="text-sm text-fg-muted">({copy.mastery[mastery]})</span>
								</span>
							</li>
						);
					})}
				</ul>
			</section>
			<section aria-labelledby="album-title" className="space-y-2">
				<h2 id="album-title" className="font-display text-xl text-fg">
					{copy.albumTitle}
				</h2>
				<AlbumCards cards={cards} rewards={rewards} copy={copy} locale={locale} />
			</section>
			<div className="flex flex-wrap gap-4">
				<Link href="/junior/quiz" className="inline-flex min-h-12 items-center gap-2 text-fg-muted underline hover:text-gold-400">
					{copy.quizLink}
				</Link>
			</div>
		</>
	);
	const home = HOME_COPY[locale];
	/* Back to the title screen (Continue, New game): the title screen leaves full screen. First in the corner, as a house. */
	const toTitle = onTitle ?? player?.onChangePlayer;
	const titleLabel = home.backToTitle(player?.name ?? null);
	const titleButton = toTitle && (
		<button type="button" onClick={toTitle} aria-label={titleLabel} title={titleLabel} className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border-2 border-white/70 bg-ink-950/55 text-white backdrop-blur-sm">
			<House className="h-6 w-6" aria-hidden />
		</button>
	);
	const soundOnMap = (
		/* Stacked, so the corner stays one button wide and never covers the island's title on a phone. */
		<div className="flex flex-col gap-2">
			{titleButton}
			<FullScreenButton locale={locale} round />
			<button type="button" aria-pressed={progress.sound} aria-label={copy.sound} title={copy.soundHint} onClick={toggleSound} className={`pointer-events-auto grid h-12 w-12 place-items-center rounded-full border-2 backdrop-blur-sm ${progress.sound ? "border-gold-400 bg-gold-400/40 text-white" : "border-white/70 bg-ink-950/55 text-white"}`}>
				{progress.sound ? <Volume2 className="h-6 w-6" aria-hidden /> : <VolumeX className="h-6 w-6" aria-hidden />}
			</button>
			{heroButton}
			{albumButton}
		</div>
	);
	const trainer = (world: WorldId) => <TrainerTalk world={world} dorm={dorm} done={islandStatus(progress, world) === "done"} locale={locale} />;

	return (
		<MotionConfig reducedMotion={moving ? "never" : "always"}>
			{/* The game is played sideways on a phone or a small tablet: held upright, it asks to be turned (CSS only, so it follows the device at once). */}
			<div className="fixed inset-0 z-[60] hidden flex-col items-center justify-center gap-4 bg-ink-950 p-6 text-center upright-small:flex">
				<Smartphone className="h-16 w-16 text-gold-400 motion-safe:animate-bounce" aria-hidden />
				<p className="font-display text-2xl text-fg">{pad.turnTitle}</p>
				<p className="max-w-xs text-fg-muted">{pad.turnBody}</p>
			</div>
			<main ref={rootRef} data-motion={moving ? "on" : "off"} {...(onMap && immersive.on ? { "data-whole-screen": "" } : {})} className={onMap ? (immersive.on ? "" : "space-y-6 pb-6") : "mx-auto max-w-240 space-y-6 px-4 py-6 md:px-6"}>
				<h1 className={onMap ? "sr-only" : `font-display text-fg ${level ? "text-xl" : "text-3xl md:text-4xl"}`}>{copy.pageTitle}</h1>
				{/* Kept alive, hidden, during a level: back on the map, the boat sails on if the level opened a new island. */}
				{hydrated && (
					<div hidden={!!level}>
						<IslandWorld progress={progress} copy={copy} locale={locale} moving={moving} hidden={!!level} corner={soundOnMap} cornerStart={shopButton} onShop={() => setShopOpen(true)} avatar={player?.avatar} outfit={shop.wear} dorm={dorm} islandCards={islandCards} trainer={trainer} onOpen={open} onAvailable={setIslands} />
					</div>
				)}
				{(level || islands === false) && (
					<div className="space-y-1 print:hidden">
						{toTitle && !level && (
							<button type="button" onClick={toTitle} aria-label={titleLabel} className={`${toggle(false)} me-2`}>
								<House className="h-5 w-5" aria-hidden />
								{home.titleScreen}
							</button>
						)}
						{!level && (
							<button type="button" onClick={() => setHeroOpen(true)} className={`${toggle(false)} me-2`}>
								<Shirt className="h-5 w-5" aria-hidden />
								{pad.heroTitle}
							</button>
						)}
						{!level && (
							<button type="button" onClick={() => setAlbumOpen(true)} aria-label={pad.albumButton(cards.length)} className={`${toggle(false)} me-2`}>
								<BookOpen className="h-5 w-5" aria-hidden />
								{copy.albumTitle} · <bdi dir="ltr">{cards.length}</bdi>
							</button>
						)}
						<FullScreenButton locale={locale} className="me-2" />
						<button type="button" aria-pressed={progress.sound} onClick={toggleSound} className={toggle(progress.sound)}>
							<Volume2 className="h-5 w-5" aria-hidden />
							{copy.sound}
						</button>
						<p className={`max-w-80 text-sm text-fg-muted ${level ? "sr-only" : ""}`}>{copy.soundHint}</p>
					</div>
				)}
				{/* In full screen the map is all there is: the rules and the album below it come back on leaving. */}
				{onMap ? (immersive.on ? null : <div className="mx-auto max-w-240 space-y-6 px-4 md:px-6">{extras}</div>) : level ? (
					<LevelPlayer
						key={level.id}
						level={level}
						number={levelsOf(level.world).indexOf(level) + 1}
						total={levelsOf(level.world).length}
						copy={copy}
						locale={locale}
						moving={moving}
						sound={progress.sound}
						solvedBefore={solvedAtOpen.current}
						/* With the 3D map, a solved level goes back to it: the figure walks to the next stop and the gold button opens it. */
						hasNext={!!following && islands !== true}
						onSolved={onSolved}
						onNext={() => following && open(following.id)}
						onExit={() => setActive(null)}
					/>
				) : islands === false ? (
					/* No 3D here: the list of worlds and levels is the map. */
					<>
						<p className="text-lg text-fg">{copy.intro}</p>
						{upNext ? (
							<button type="button" onClick={() => open(upNext.id)} className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-gold-400 px-7 py-3 text-lg font-semibold text-ink-950">
								<Play className="h-6 w-6 rtl:rotate-180" aria-hidden />
								{copy.continueWith(copy.levels[upNext.id]?.title ?? "")}
							</button>
						) : (
							<p role="note" className="rounded-xl border-2 border-gold-400 p-3 text-fg">
								{copy.allDone}
							</p>
						)}
						{WORLD_IDS.map((world, worldIndex) => (
							<section key={world} aria-labelledby={`world-${world}`} className="space-y-3 rounded-2xl border border-white/10 bg-surface/60 p-4">
								<h2 id={`world-${world}`} {...(worldIndex === 0 ? { "data-step-heading": true, tabIndex: -1 } : {})} className="font-display text-xl text-fg md:text-2xl">
									<bdi dir="ltr" className="text-gold-400">
										{worldIndex + 1}
									</bdi>{" "}
									{copy.worlds[world].title}
								</h2>
								<p className="text-fg-muted">{copy.worlds[world].blurb}</p>
								{/* Grandpa's shop belongs to the first island, here as on the map. */}
								{worldIndex === SHOP_ISLAND && (
									<button type="button" onClick={() => setShopOpen(true)} className={toggle(false)}>
										<Store className="h-5 w-5 text-gold-400" aria-hidden />
										{pad.shopName} · <Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden />
										<bdi dir="ltr">{stars}</bdi>
									</button>
								)}
								<ol className="flex flex-wrap gap-2">
									{levelsOf(world).map((item) => {
										const record = progress.levels[item.id];
										const unlocked = isUnlocked(progress, item.id);
										const title = copy.levels[item.id]?.title ?? item.id;
										const state = record ? (record.clean ? copy.starMark : copy.solvedMark) : unlocked ? "" : copy.locked;
										return (
											<li key={item.id}>
												<button
													type="button"
													disabled={!unlocked}
													aria-label={state ? `${title}: ${state}` : title}
													onClick={() => open(item.id)}
													className={`inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 py-2 font-semibold ${record ? "border-spell bg-spell/15 text-fg" : unlocked ? "border-gold-400 text-fg" : "border-white/15 text-fg-muted"}`}
												>
													{record ? record.clean ? <Star className="h-5 w-5 fill-gold-400 text-gold-400" aria-hidden /> : <Check className="h-5 w-5 text-spell" aria-hidden /> : unlocked ? null : <Lock className="h-4 w-4" aria-hidden />}
													{title}
												</button>
											</li>
										);
									})}
								</ol>
							</section>
						))}
						{extras}
					</>
				) : null}
				{!level && won && (
					<p role="status" className="fixed inset-x-0 top-20 z-40 mx-auto w-fit rounded-full bg-gold-400 px-5 py-2 text-lg font-bold text-ink-950 shadow-[0_0_24px_rgba(255,216,74,0.6)]">
						{pad.gained(won.stars, won.island, won.duel)}
					</p>
				)}
				{/* The dorm is asked for once the first island is finished, after its reward is shown, and never over another dialog. */}
				{hydrated && !level && !dormLater && !shopOpen && !albumOpen && revealed.length === 0 && dormToChoose(progress, dorm) && <DormDialog locale={locale} onChoose={onChooseDorm} onClose={() => setDormLater(true)} />}
				{!level && heroOpen && (
					<HeroRoom
						avatar={player?.avatar ?? DEFAULT_AVATAR}
						items={shop.items}
						wear={shop.wear}
						locale={locale}
						/* The character can change only until the first mission is done: then it is part of the story. */
						{...(player?.onChangeAvatar && !characterLocked(Object.keys(progress.levels).length) ? { onAvatar: player.onChangeAvatar } : {})}
						characterLocked={!!player && characterLocked(Object.keys(progress.levels).length)}
						onWear={wardrobe.onWear}
						onTakeOff={wardrobe.onTakeOff}
						onClose={() => setHeroOpen(false)}
						{...(previewOk ? { preview: (avatar: Avatar, outfit: Outfit, heading: number) => preview(outfit, avatar, heading) } : {})}
						pages={[
							{ id: "cards", title: copy.albumTitle, content: <AlbumCards cards={cards} rewards={rewards} copy={copy} locale={locale} /> },
							{ id: "quest", title: pad.quest, content: <QuestPage progress={progress} dorm={dorm} stars={stars} locale={locale} language={player?.onChangeLocale && <SaveLanguage copy={home} value={player.locale ?? null} onChange={player.onChangeLocale} />} /> },
						]}
					/>
				)}
				{!level && albumOpen && <AlbumDialog cards={cards} rewards={rewards} copy={copy} locale={locale} onClose={() => setAlbumOpen(false)} />}
				{!level && shopOpen && <ShopDialog stars={stars} bought={bought} wardrobe={wardrobe} preview={previewOk ? preview : undefined} copy={copy} locale={locale} onBuy={onBuy} onClose={() => setShopOpen(false)} />}
				{!level && revealed.length > 0 && <RewardReveal
						cards={revealed}
						copy={copy}
						locale={locale}
						homeScreenHint={homeHint}
						onClose={() => {
							setRevealed([]);
							setHomeHint(false);
						}}
					/>}
			</main>
		</MotionConfig>
	);
}
