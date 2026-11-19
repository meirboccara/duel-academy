"use client";

import { Play, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useLanguage } from "@/lib/i18n/provider";
import { HOME_COPY } from "@/lib/junior/home/copy";
import { requestPersist } from "@/lib/junior/persist";
import { WORLD_IDS } from "@/lib/junior/play/levels";
import { loadPlayProgress } from "@/lib/junior/play/progress";
import { DEFAULT_AVATAR, SLOTS, characterLocked, createSlot, deleteSlot, firstEmptySlot, isSameSave, loadProfiles, slotKey, slotStorage, touchSlot, updateSlot, type Avatar, type Profiles, type Slot, type SlotStorage } from "@/lib/junior/profiles";
import { islandStatus } from "@/lib/junior/world/status";
import { dormKeyFor, loadDorm } from "@/lib/junior/world/dorm";
import { loadPurchases, shopKeyFor } from "@/lib/junior/world/shop";
import { binder } from "@/lib/junior/world/trainers";
import { CardArt } from "../play/mini-board";
import { JuniorPlay } from "../play/junior-play";
import { useImmersive } from "../play/use-immersive";
import { ChooseAvatar } from "./choose-avatar";
import { ConfirmDialog, bigButton, quietButton } from "./confirm-dialog";
import { ManageSave, type ManageSection } from "./manage-save";
import { NameStep } from "./name-step";
import { SaveTile, TilePlaceholder, type SlotSummary } from "./save-tile";

/** The browser's storage when it really keeps what is written; undefined in a blocked or broken one. */
function usableStorage(): SlotStorage | undefined {
	try {
		const storage = window.localStorage;
		const probe = "academy-ygo:probe";
		storage.setItem(probe, "1");
		storage.removeItem(probe);
		return storage;
	} catch {
		return undefined;
	}
}
const DAY = 86_400_000;
const daysSince = (iso: string, now: Date) => {
	const then = new Date(iso);
	if (Number.isNaN(then.getTime())) return 0;
	const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	return Math.max(0, Math.round((midnight(now) - midnight(then)) / DAY));
};

type Step = { at: "title"; replacing: boolean } | { at: "choose"; slot: Slot; then: "new" | "change" } | { at: "name"; slot: Slot; avatar: Avatar } | { at: "play"; slot: Slot | null; createdAt: string };
type Overlay = { kind: "confirm"; action: "replace" | "delete"; slot: Slot } | { kind: "manage"; slot: Slot; start: ManageSection } | null;

/**
 * The landing of the site: the title screen with New game and Continue, three save slots (one per child on a shared
 * device), the character choice and the nickname, then the island map for the chosen save. All steps live on `/`;
 * Back returns from the map to the title screen. The server and the first client render show the title and three
 * neutral places of the final size; the saves fill in after hydration, so nothing on screen jumps or mismatches.
 */
export function JuniorHome() {
	const { locale, playIn } = useLanguage();
	const copy = HOME_COPY[locale];
	/* The game is played in full screen: Continue or New game turn it on, and the title screen is always shown without it. */
	const immersive = useImmersive();
	/* undefined until known; null when this browser keeps nothing. */
	const [storage, setStorage] = useState<SlotStorage | null | undefined>(undefined);
	const [profiles, setProfiles] = useState<Profiles | null>(null);
	const [step, setStep] = useState<Step>({ at: "title", replacing: false });
	const [overlay, setOverlay] = useState<Overlay>(null);
	const pushed = useRef(false);
	const rootRef = useRef<HTMLDivElement>(null);

	const refresh = useCallback((from: SlotStorage | null | undefined = storage) => setProfiles(from ? loadProfiles(from) : null), [storage]);
	useEffect(() => {
		const found = usableStorage() ?? null;
		setStorage(found);
		setProfiles(found ? loadProfiles(found) : null);
	}, []);
	/* Another tab created, changed or deleted a save. */
	useEffect(() => {
		if (!storage) return;
		const onStorage = (event: StorageEvent) => {
			if (event.key === null || event.key.startsWith("academy-ygo:junior:")) setProfiles(loadProfiles(storage));
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [storage]);
	/* Back from the map returns here, not out of the site. */
	useEffect(() => {
		const onPop = () => {
			pushed.current = false;
			setStep({ at: "title", replacing: false });
			refresh();
		};
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, [refresh]);
	/* Each new step starts at its heading, for keyboard and screen-reader users. */
	const stepAt = step.at;
	const first = useRef(true);
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		if (stepAt !== "play") rootRef.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus();
	}, [stepAt]);
	/* Back on the title screen by any way (its button, the browser's Back): out of full screen. */
	const { leave } = immersive;
	useEffect(() => {
		if (stepAt !== "play") void leave();
	}, [stepAt, leave]);
	/*
	 * A save played in its own language: the page shows it while the save is played, without changing the site's
	 * language, which comes back with the title screen (or when the save is set to follow the site again).
	 */
	const playedSlot = step.at === "play" ? step.slot : null;
	const ownLocale = playedSlot ? (profiles?.slots[playedSlot - 1]?.locale ?? null) : null;
	const inOwnLocale = useRef(false);
	useEffect(() => {
		if (ownLocale) {
			inOwnLocale.current = true;
			playIn(ownLocale);
		} else if (inOwnLocale.current) {
			inOwnLocale.current = false;
			playIn(null);
		}
	}, [ownLocale, playIn]);
	/* Leaving the game for another page (the quiz link) gives the site its own language back. */
	useEffect(
		() => () => {
			if (inOwnLocale.current) playIn(null);
		},
		[playIn],
	);

	const summary = (slot: Slot): SlotSummary => {
		const profile = profiles?.slots[slot - 1] ?? null;
		const progress = profile && storage ? loadPlayProgress(slotStorage(storage, slot)).progress : null;
		return {
			slot,
			profile,
			name: profile?.name || copy.defaultName(slot),
			levels: progress ? Object.keys(progress.levels).length : 0,
			islands: progress ? WORLD_IDS.filter((world) => islandStatus(progress, world) === "done").length : 0,
			cards: progress && storage ? binder(progress, loadPurchases(storage, shopKeyFor(slotKey(slot))), loadDorm(storage, dormKeyFor(slotKey(slot)))).length : 0,
			days: profile?.playedAt ? daysSince(profile.playedAt, new Date()) : 0,
		};
	};

	const play = (slot: Slot | null) => {
		/* Asked at once, while the tap on Continue or New game still counts. */
		void immersive.enter();
		let createdAt = "";
		if (slot && storage) {
			const touched = touchSlot(storage, slot);
			setProfiles(touched);
			createdAt = touched.slots[slot - 1]?.createdAt ?? "";
		}
		if (!pushed.current) {
			window.history.pushState({ junior: "play" }, "");
			pushed.current = true;
		}
		setOverlay(null);
		setStep({ at: "play", slot, createdAt });
	};
	const backToTitle = useCallback(() => {
		setStep({ at: "title", replacing: false });
		refresh();
		if (pushed.current) {
			pushed.current = false;
			window.history.back();
		}
	}, [refresh]);
	const openSlot = (slot: Slot) => {
		const profile = profiles?.slots[slot - 1];
		if (!profile) return setStep({ at: "choose", slot, then: "new" });
		/* A save from before slots existed: its child chooses a character the first time. */
		if (profile.legacy) return setStep({ at: "choose", slot, then: "change" });
		play(slot);
	};
	const newGame = () => {
		const empty = profiles ? firstEmptySlot(profiles) : null;
		if (empty) setStep({ at: "choose", slot: empty, then: "new" });
		else setStep({ at: "title", replacing: true });
	};

	if (step.at === "play") {
		const { slot, createdAt } = step;
		const profile = slot ? profiles?.slots[slot - 1] : null;
		const player =
			slot && storage && profile
				? {
						storage: slotStorage(storage, slot),
						key: slotKey(slot),
						stillMine: () => isSameSave(loadProfiles(storage), slot, createdAt),
						avatar: profile.avatar,
						name: profile.name || copy.defaultName(slot),
						onChangePlayer: backToTitle,
						locale: profile.locale ?? null,
						onChangeLocale: (next: Locale | null) => {
							if (isSameSave(loadProfiles(storage), slot, createdAt)) setProfiles(updateSlot(storage, slot, { locale: next }));
						},
						/*
						 * Before the first mission only (the character is then part of the story), and not while this
						 * save was replaced in another tab: the other child's character stays theirs.
						 */
						onChangeAvatar: (avatar: Avatar) => {
							const solved = Object.keys(loadPlayProgress(slotStorage(storage, slot)).progress.levels).length;
							if (!characterLocked(solved) && isSameSave(loadProfiles(storage), slot, createdAt)) setProfiles(updateSlot(storage, slot, { avatar }));
						},
					}
				: undefined;
		return <JuniorPlay key={`${slot}-${createdAt}`} player={player} onTitle={backToTitle} />;
	}

	const lastSlot = profiles?.last ?? null;
	const known = storage !== undefined;
	return (
		<div ref={rootRef} className="min-h-[calc(100svh-var(--chrome-top))] bg-[radial-gradient(ellipse_at_top,rgba(255,216,74,0.12),transparent_60%)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
			{step.at === "choose" ? (
				<ChooseAvatar
					copy={copy}
					initial={step.then === "change" ? (profiles?.slots[step.slot - 1]?.avatar ?? undefined) : undefined}
					onBack={() => setStep({ at: "title", replacing: false })}
					onDone={(avatar) => {
						if (step.then === "new") return setStep({ at: "name", slot: step.slot, avatar });
						const legacy = profiles?.slots[step.slot - 1]?.legacy;
						/* A mission solved meanwhile (in another tab) locks the character; an old save chooses its first one. */
						const locked = !legacy && !!storage && characterLocked(Object.keys(loadPlayProgress(slotStorage(storage, step.slot)).progress.levels).length);
						if (storage && !locked) setProfiles(updateSlot(storage, step.slot, { avatar }));
						if (legacy) play(step.slot);
						else setStep({ at: "title", replacing: false });
					}}
				/>
			) : step.at === "name" ? (
				<NameStep
					copy={copy}
					avatar={step.avatar}
					onBack={() => setStep({ at: "choose", slot: step.slot, then: "new" })}
					onDone={(name, locale) => {
						if (!storage) return;
						setProfiles(createSlot(storage, step.slot, { name, avatar: step.avatar, locale }));
						void requestPersist();
						play(step.slot);
					}}
				/>
			) : (
				<main className="mx-auto max-w-3xl space-y-6 px-4 py-6 text-center md:py-10">
					<div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-8 md:text-start">
						<div className="w-40 shrink-0 -rotate-3 overflow-hidden rounded-xl border-4 border-gold-400 shadow-[0_0_40px_rgba(255,216,74,0.35)] md:w-52">
							<CardArt card="dark-magician" size="large" />
						</div>
						<div className="space-y-2">
							<h1 data-step-heading tabIndex={-1} className="font-display text-4xl text-fg outline-none md:text-6xl">
								{copy.title}
							</h1>
							<p className="text-xl text-fg-muted md:text-2xl">{copy.tagline}</p>
						</div>
					</div>

					{known && !storage ? (
						<div className="space-y-3">
							<button type="button" onClick={() => play(null)} className={`${bigButton} min-h-14 bg-gold-400 text-ink-950`}>
								<Play className="h-6 w-6 rtl:rotate-180" aria-hidden />
								{copy.play}
							</button>
							<p role="note" className="text-fg-muted">
								{copy.noStorage}
							</p>
						</div>
					) : (
						<>
							<div className="flex flex-wrap justify-center gap-3">
								<button type="button" disabled={!lastSlot} onClick={() => lastSlot && openSlot(lastSlot)} className={`${bigButton} min-h-14 bg-gold-400 text-ink-950 disabled:opacity-40`}>
									<Play className="h-6 w-6 rtl:rotate-180" aria-hidden />
									{copy.continue}
								</button>
								<button type="button" onClick={newGame} disabled={!profiles} className={`${bigButton} min-h-14 border-2 border-gold-400 text-fg disabled:opacity-40`}>
									{copy.newGame}
								</button>
							</div>

							<section aria-labelledby="saves-title" className="space-y-3">
								<h2 id="saves-title" className="font-display text-xl text-fg">
									{copy.savesTitle}
								</h2>
								{step.at === "title" && step.replacing && (
									<div role="note" className="flex flex-wrap items-center justify-center gap-3 rounded-xl border-2 border-red-400/60 p-3 text-fg">
										<span>{copy.allTaken}</span>
										<button type="button" className={quietButton} onClick={() => setStep({ at: "title", replacing: false })}>
											{copy.cancel}
										</button>
									</div>
								)}
								<ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
									{SLOTS.map((slot) => (
										<li key={slot}>
											{profiles ? (
												<SaveTile
													summary={summary(slot)}
													copy={copy}
													mode={step.at === "title" && step.replacing ? "replace" : "open"}
													onOpen={() => (step.at === "title" && step.replacing ? setOverlay({ kind: "confirm", action: "replace", slot }) : openSlot(slot))}
													onManage={() => setOverlay({ kind: "manage", slot, start: "menu" })}
												/>
											) : (
												<TilePlaceholder />
											)}
										</li>
									))}
								</ul>
								{profiles && firstEmptySlot(profiles) && (
									<button type="button" className={quietButton} onClick={() => setOverlay({ kind: "manage", slot: firstEmptySlot(profiles)!, start: "load" })}>
										<Upload className="h-5 w-5" aria-hidden />
										{copy.loadCopy}
									</button>
								)}
							</section>
						</>
					)}
				</main>
			)}

			{overlay?.kind === "confirm" && storage && (
				<ConfirmDialog
					kind={overlay.action}
					name={summary(overlay.slot).name}
					avatar={summary(overlay.slot).profile?.avatar ?? DEFAULT_AVATAR}
					levels={summary(overlay.slot).levels}
					cards={summary(overlay.slot).cards}
					copy={copy}
					onKeep={() => setOverlay(null)}
					onSaveCopy={() => setOverlay({ kind: "manage", slot: overlay.slot, start: "copy" })}
					onConfirm={() => {
						const slot = overlay.slot;
						setOverlay(null);
						if (overlay.action === "delete") {
							setProfiles(deleteSlot(storage, slot));
							setStep({ at: "title", replacing: false });
						} else setStep({ at: "choose", slot, then: "new" });
					}}
				/>
			)}
			{overlay?.kind === "manage" && storage && (
				<ManageSave
					summary={summary(overlay.slot)}
					copy={copy}
					storage={storage}
					start={overlay.start}
					onChanged={() => refresh()}
					onChangeCharacter={() => {
						setOverlay(null);
						setStep({ at: "choose", slot: overlay.slot, then: "change" });
					}}
					onDelete={() => setOverlay({ kind: "confirm", action: "delete", slot: overlay.slot })}
					onClose={() => setOverlay(null)}
				/>
			)}
		</div>
	);
}
