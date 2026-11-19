"use client";

import { ChevronLeft, ChevronRight, Flag, Hand, HardHat, Lock, RotateCcw, RotateCw, Shirt, User, X } from "lucide-react";
import { motion } from "motion/react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { HOME_COPY } from "@/lib/junior/home/copy";
import { AVATARS, type Avatar } from "@/lib/junior/profiles";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { type Outfit, WARDROBE_SLOTS, type WardrobeItem, type WardrobeSlot, wardrobeFor } from "@/lib/junior/world/wardrobe";
import { AvatarPicture } from "../home/avatar-picture";
import { ItemIcon } from "./hero-shop";

export interface HeroRoomProps {
	avatar: Avatar;
	/** Everything bought or given (the dorm's cap). */
	items: readonly string[];
	wear: Outfit;
	locale: Locale;
	/** Changes the save's character: only given while it may still change (before the first mission is done). */
	onAvatar?: (avatar: Avatar) => void;
	/** The character is chosen for good: says so where the characters would be. */
	characterLocked?: boolean;
	onWear: (id: string) => void;
	onTakeOff: (slot: WardrobeSlot) => void;
	onClose: () => void;
	/** The 3D figure wearing the outfit, turned by `heading` (radians, from its usual angle) and filling its box; the still picture when absent (no WebGL). */
	preview?: (avatar: Avatar, outfit: Outfit, heading: number) => ReactNode;
	/** The pages after Equipment, turned to with the side arrows (the card album, the quest). */
	pages?: readonly { id: string; title: string; content: ReactNode }[];
}

const SLOT_ICON: Record<WardrobeSlot, typeof Shirt> = { shirt: Shirt, cape: Flag, hat: HardHat, held: Hand };

/** One square of the Equipment grid: the character's own look in that place, a thing owned, or one still to buy. */
type Cell = { key: string; slot: WardrobeSlot; item: WardrobeItem | null; owned: boolean };

/**
 * "My hero", a pause menu in the manner of the classic adventure games: framed pages turned like the faces of a
 * cube. The first, Equipment, shows the figure in the middle and, by place, every thing this character can wear in
 * squares: owned ones lit, the worn one marked, the rest dark with their price in Grandpa's shop. A cursor moves with
 * the arrow keys (a tap moves it too); the bar at the bottom says what is under it. Enter or a tap puts it on or
 * takes it off. Q / E (or the side arrows) turn to the other pages.
 */
export function HeroRoom({ avatar, items, wear, locale, onAvatar, characterLocked = false, onWear, onTakeOff, onClose, preview, pages = [] }: HeroRoomProps) {
	const words = CONTROLS_COPY[locale];
	const names = HOME_COPY[locale].avatars;
	const titleId = useId();
	const all = [{ id: "equipment", title: words.equipment, content: null as ReactNode }, ...pages];
	const [page, setPage] = useState(0);
	const [turn, setTurn] = useState(0);
	const box = useRef<HTMLDivElement>(null);

	/* Everything this character can wear, by place: its own look, what is owned, then the rest, still to buy. */
	const fits = wardrobeFor(avatar, items);
	const rows: Cell[][] = WARDROBE_SLOTS.map((slot) => [
		{ key: `own-${slot}`, slot, item: null, owned: true },
		...fits.filter((item) => item.slot === slot && items.includes(item.id)).map((item) => ({ key: item.id, slot, item, owned: true })),
		...fits.filter((item) => item.slot === slot && !items.includes(item.id)).map((item) => ({ key: item.id, slot, item, owned: false })),
	]);
	/* What is worn in a place only counts when it suits this character (a broom kept from a girl does not show on the Knight). */
	const wornIn = (slot: WardrobeSlot) => fits.find((item) => item.id === wear[slot] && items.includes(item.id))?.id;
	const isWorn = (cell: Cell) => (cell.item ? wornIn(cell.slot) === cell.item.id : !wornIn(cell.slot));
	const [picked, setCursor] = useState<string>(() => rows[0]!.find(isWorn)?.key ?? rows[0]![0]!.key);
	/* After a change of character the square under the cursor may be gone: it falls back to the first one. */
	const cursor = rows.some((row) => row.some((cell) => cell.key === picked)) ? picked : rows[0]![0]!.key;
	const under = rows.flat().find((cell) => cell.key === cursor);

	/* The hero on its stand turns: dragged sideways with a finger or the mouse, or an eighth of a turn per button press. */
	const [heading, setHeading] = useState(0);
	const drag = useRef<{ x: number; from: number } | null>(null);
	const spin = (by: number) => setHeading((now) => now + by);

	const turnTo = (next: number) => {
		setTurn(next > page ? 1 : -1);
		setPage((next + all.length) % all.length);
	};
	/* Opening focuses the cursor's square; closing gives focus back to the button that opened the menu. */
	useEffect(() => {
		const back = document.activeElement as HTMLElement | null;
		box.current?.querySelector<HTMLElement>("[data-cell][tabindex='0']")?.focus();
		return () => back?.focus?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		const onKey = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") return onClose();
			/* Letters typed into a list (the save's language) choose in it, they do not turn the page. */
			if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
			/* The Q and E keys by place too, so they turn the page on a Hebrew keyboard (where they type / and ק). */
			if (event.code === "KeyQ" || event.key === "q" || event.key === "Q" || event.key === "PageUp") turnTo(page - 1);
			else if (event.code === "KeyE" || event.key === "e" || event.key === "E" || event.key === "PageDown") turnTo(page + 1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const use = (cell: Cell) => {
		setCursor(cell.key);
		if (!cell.owned) return;
		if (isWorn(cell)) {
			if (cell.item) onTakeOff(cell.slot);
		} else if (cell.item) onWear(cell.item.id);
		else onTakeOff(cell.slot);
	};
	/* Arrow keys move the cursor square by square; up and down keep the column as far as the row goes. */
	const onArrow = (event: KeyboardEvent<HTMLDivElement>) => {
		const at = (event.target as HTMLElement).dataset;
		if (at.row === undefined || at.col === undefined) return;
		let row = Number(at.row);
		let col = Number(at.col);
		const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
		if (event.key === "ArrowRight") col += rtl ? -1 : 1;
		else if (event.key === "ArrowLeft") col += rtl ? 1 : -1;
		else if (event.key === "ArrowDown") row += 1;
		else if (event.key === "ArrowUp") row -= 1;
		else if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			const cell = rows[row]?.[col];
			if (cell) use(cell);
			return;
		} else return;
		event.preventDefault();
		row = Math.max(0, Math.min(rows.length - 1, row));
		col = Math.max(0, Math.min(rows[row]!.length - 1, col));
		setCursor(rows[row]![col]!.key);
		event.currentTarget.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`)?.focus();
	};
	/* The characters are one radio group: a single tab stop, the arrow keys choose the next one. */
	const onAvatarArrow = (event: KeyboardEvent<HTMLDivElement>, choose: (avatar: Avatar) => void) => {
		const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
		const step = event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight") ? 1 : event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft") ? -1 : 0;
		if (!step) return;
		event.preventDefault();
		const next = AVATARS[(AVATARS.indexOf(avatar) + step + AVATARS.length) % AVATARS.length]!;
		choose(next);
		event.currentTarget.querySelector<HTMLElement>(`[data-avatar="${next}"]`)?.focus();
	};
	const label = (cell: Cell) => (cell.item ? (cell.owned ? cell.item.name[locale] : `${cell.item.name[locale]}, ${words.inShop(cell.item.price)}`) : words.ownLook);
	const say = under ? (under.owned ? `${label(under)} · ${isWorn(under) ? words.wearing : words.putOn}` : label(under)) : "";
	const current = all[page]!;
	const before = all[(page - 1 + all.length) % all.length]!;
	const after = all[(page + 1) % all.length]!;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/85 p-1.5 backdrop-blur-sm sm:p-3 tablet:p-6">
			{/* Nearly the whole screen, as a pause menu is: a gold double frame around a deep green page. */}
			<div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex h-full max-h-[54rem] w-full max-w-6xl flex-col rounded-[2rem] border-4 border-double border-gold-400/80 bg-[radial-gradient(ellipse_at_center,rgba(40,74,62,0.97),rgba(8,16,22,0.98))] p-2.5 shadow-[0_0_60px_rgba(255,216,74,0.3)] sm:p-4 tablet:p-5 [perspective:1400px]">
				<h2 id={titleId} className="sr-only">
					{words.heroTitle}
				</h2>
				{/* The page's banner, between the arrows that turn the cube. */}
				<div className="flex items-center justify-between gap-2" dir="ltr">
					<button type="button" onClick={() => turnTo(page - 1)} aria-label={words.previousPage(before.title)} className={pageArrow}>
						<ChevronLeft className="h-6 w-6" aria-hidden />
						<span aria-hidden className="text-xs font-bold">
							Q
						</span>
					</button>
					<h3 dir="auto" className="rounded-full border-2 border-gold-400/70 bg-ink-950/70 px-6 py-1 font-display text-xl text-gold-400 shadow-inner sm:text-2xl">
						{current.title}
					</h3>
					<button type="button" onClick={() => turnTo(page + 1)} aria-label={words.nextPage(after.title)} className={pageArrow}>
						<span aria-hidden className="text-xs font-bold">
							E
						</span>
						<ChevronRight className="h-6 w-6" aria-hidden />
					</button>
				</div>
				<button type="button" onClick={onClose} aria-label={words.close} className="absolute -end-2 -top-2 grid h-10 w-10 place-items-center rounded-full border-2 border-gold-400 bg-ink-950 text-gold-400">
					<X className="h-5 w-5" aria-hidden />
				</button>

				<motion.div key={current.id} initial={{ rotateY: turn * 80, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.35, ease: "easeOut" }} className="mt-3 min-h-0 flex-1 overflow-y-auto [transform-style:preserve-3d]">
					{page === 0 ? (
						<div className="grid h-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,38%)] tablet:gap-5 [@media(max-height:32rem)]:grid-cols-[minmax(0,1fr)_13rem]">
							{/* The equipment, place by place, on a panel of its own like the item screens of the classic adventure games. */}
							<div onKeyDown={onArrow} className="min-h-0 space-y-2 overflow-y-auto rounded-2xl border border-gold-400/25 bg-black/25 p-2 shadow-inner tablet:space-y-3 tablet:p-4 [@media(max-height:32rem)]:space-y-1">
								{rows.map((row, r) => {
									const slot = row[0]!.slot;
									const Icon = SLOT_ICON[slot];
									return (
										<section key={slot} aria-label={words.slots[slot]} className="flex items-start gap-2 border-b border-gold-400/10 pb-2 last:border-0 last:pb-0 [@media(max-height:32rem)]:pb-1">
											<span title={words.slots[slot]} className="flex h-14 w-9 shrink-0 flex-col items-center justify-center gap-0.5 text-gold-400 tablet:h-[4.5rem] tablet:w-16 [@media(max-height:32rem)]:h-11">
												<Icon className="h-6 w-6 tablet:h-7 tablet:w-7" aria-hidden />
												<span aria-hidden dir="auto" className="text-center hidden text-[0.65rem] leading-tight font-semibold tablet:block">
													{words.slots[slot]}
												</span>
											</span>
											<ul className="flex flex-wrap gap-2 [@media(max-height:32rem)]:gap-1.5">
												{row.map((cell, c) => {
													const worn = cell.owned && isWorn(cell);
													return (
														<li key={cell.key}>
															<button
																type="button"
																data-cell
																data-row={r}
																data-col={c}
																tabIndex={cell.key === cursor ? 0 : -1}
																aria-label={label(cell)}
																{...(cell.owned ? { "aria-pressed": worn } : { "aria-disabled": true })}
																onClick={() => use(cell)}
																onFocus={() => setCursor(cell.key)}
																className={`relative grid h-14 w-14 place-items-center rounded-xl border-2 shadow-inner outline-none transition tablet:h-[4.5rem] tablet:w-[4.5rem] [@media(max-height:32rem)]:h-11 [@media(max-height:32rem)]:w-11 ${worn ? "border-sky-300 bg-[radial-gradient(circle,rgba(125,211,252,0.45),rgba(14,116,144,0.35))] shadow-[0_0_14px_rgba(125,211,252,0.5)]" : cell.owned ? "border-gold-400/35 bg-[radial-gradient(circle,rgba(255,255,255,0.12),rgba(0,0,0,0.45))]" : "border-white/10 bg-black/60"} focus-visible:ring-4 focus-visible:ring-gold-400 ${cell.key === cursor ? "scale-105 ring-4 ring-gold-400/90 motion-safe:animate-pulse" : "hover:border-gold-400/70"}`}
															>
																{cell.item ? <ItemIcon item={cell.item} className={`h-8 w-8 tablet:h-10 tablet:w-10 [@media(max-height:32rem)]:h-6 [@media(max-height:32rem)]:w-6 ${cell.owned ? "drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]" : "opacity-25 grayscale"}`} /> : <User className="h-7 w-7 text-white/80 tablet:h-9 tablet:w-9 [@media(max-height:32rem)]:h-6 [@media(max-height:32rem)]:w-6" aria-hidden />}
																{!cell.owned && <Lock className="absolute bottom-1 end-1 h-3.5 w-3.5 text-white/60" aria-hidden />}
															</button>
														</li>
													);
												})}
											</ul>
										</section>
									);
								})}
							</div>
							{/* The figure in the middle of its equipment, as the hero stands in the classic pause screens. */}
							<div className="flex min-h-0 flex-col items-center gap-2 max-sm:order-first">
								<div
									data-testid="hero-stage"
									onPointerDown={(event) => {
										/* A press on a turn button is a press, not a drag: capturing it would take the button's click away. */
										if ((event.target as HTMLElement).closest("button")) return;
										drag.current = { x: event.clientX, from: heading };
										event.currentTarget.setPointerCapture?.(event.pointerId);
									}}
									onPointerMove={(event) => {
										if (drag.current) setHeading(drag.current.from + (event.clientX - drag.current.x) * DRAG_TURN);
									}}
									onPointerUp={() => (drag.current = null)}
									onPointerCancel={() => (drag.current = null)}
									onLostPointerCapture={() => (drag.current = null)}
									className={`relative w-full min-h-56 flex-1 overflow-hidden rounded-2xl border-2 border-gold-400/60 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,236,170,0.28),rgba(20,40,40,0.2)_45%,rgba(0,0,0,0.55))] shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] [@media(max-height:32rem)]:min-h-0 ${preview ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
								>
									{/* The stand the hero turns on. */}
									<div aria-hidden className="absolute inset-x-[18%] bottom-[6%] h-[11%] rounded-[50%] border-2 border-gold-400/50 bg-[radial-gradient(ellipse,rgba(255,216,74,0.35),rgba(0,0,0,0.5))]" />
									<div className="absolute inset-0 grid place-items-center">{preview ? preview(avatar, wear, heading) : <AvatarPicture avatar={avatar} className="h-4/5 w-auto" />}</div>
									{preview && (
										<>
											<button type="button" onClick={() => spin(-BUTTON_TURN)} aria-label={words.turnHeroLeft} title={words.turnHeroLeft} className={`${turnButton} start-2`}>
												<RotateCcw className="h-5 w-5" aria-hidden />
											</button>
											<button type="button" onClick={() => spin(BUTTON_TURN)} aria-label={words.turnHeroRight} title={words.turnHeroRight} className={`${turnButton} end-2`}>
												<RotateCw className="h-5 w-5" aria-hidden />
											</button>
										</>
									)}
								</div>
								<p className="rounded-full border border-gold-400/50 bg-ink-950/70 px-4 font-display text-lg text-gold-400 tablet:text-xl">{names[avatar]}</p>
								{onAvatar ? (
									<div role="radiogroup" aria-label={words.character} onKeyDown={(event) => onAvatarArrow(event, onAvatar)} className="grid grid-cols-6 gap-1">
										{AVATARS.map((id) => (
											<button key={id} type="button" role="radio" data-avatar={id} tabIndex={id === avatar ? 0 : -1} aria-checked={id === avatar} aria-label={names[id]} title={names[id]} onClick={() => onAvatar(id)} className={`grid aspect-square place-items-center rounded-lg border-2 ${id === avatar ? "border-gold-400 bg-gold-400/20" : "border-white/15"}`}>
												<AvatarPicture avatar={id} className="h-8 w-8" />
											</button>
										))}
									</div>
								) : (
									characterLocked && (
										<p dir="auto" className="max-w-64 text-center text-xs text-fg-muted [@media(max-height:32rem)]:sr-only">
											{HOME_COPY[locale].characterLocked}
										</p>
									)
								)}
							</div>
						</div>
					) : (
						current.content
					)}
				</motion.div>

				{/* The bar at the bottom: what is under the cursor, and the keys. */}
				<div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold-400/40 bg-ink-950/70 px-3 py-1.5 tablet:mt-3 tablet:py-2">
					<div className="flex min-h-7 items-center gap-2">
						{page === 0 && under && (under.item ? <ItemIcon item={under.item} className="h-7 w-7 shrink-0" /> : <User className="h-6 w-6 shrink-0 text-white/80" aria-hidden />)}
						<p role="status" dir="auto" className="font-semibold text-fg tablet:text-lg">
							{page === 0 ? say : ""}
						</p>
					</div>
					<p className="text-xs text-fg-muted max-sm:hidden">{page === 0 ? words.turnHint : words.pageHint}</p>
				</div>
			</div>
		</div>
	);
}

/** A drag across the stand: radians per pixel, so a swipe across the stand is about half a turn. */
const DRAG_TURN = 0.012;
/** One press of a turn button: an eighth of a turn. */
const BUTTON_TURN = Math.PI / 4;
const turnButton = "absolute bottom-2 grid h-11 w-11 place-items-center [@media(max-height:32rem)]:bottom-1 [@media(max-height:32rem)]:h-9 [@media(max-height:32rem)]:w-9 rounded-full border-2 border-gold-400/70 bg-ink-950/75 text-gold-400";
const pageArrow ="inline-flex min-h-11 min-w-11 items-center justify-center gap-0.5 rounded-full border-2 border-gold-400/70 bg-ink-950/70 px-2 text-gold-400";
