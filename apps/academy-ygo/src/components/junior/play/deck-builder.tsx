"use client";

import { Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { CARD_ART, cardArtUrl } from "@/lib/junior/play/card-art";
import { cardOf, inExtraDeck, monsterOf, type CardId } from "@/lib/junior/play/cards";
import { PLAY_COPY, cardType, type PlayCopy } from "@/lib/junior/play/copy";
import { DECK_COPY } from "@/lib/junior/play/deck-copy";
import { addCard, copiesOf, removeCard, startWith, type DeckRecord } from "@/lib/junior/play/deck-record";
import { EXTRA_DECK, MAIN_DECK, MOST_COPIES, copiesAllowed, deckProblems } from "@/lib/junior/play/masters";
import { bigButton, quietButton } from "../home/confirm-dialog";

type Filter = "all" | "monster" | "spell" | "trap" | "extra";
type Sort = "level" | "atk" | "name";
const FILTERS: readonly Filter[] = ["all", "monster", "spell", "trap", "extra"];
const SORTS: readonly Sort[] = ["level", "atk", "name"];

const KIND_EDGE = { monster: "border-normal-monster", spell: "border-spell", trap: "border-trap" } as const;
const FRAME_EDGE = { ritual: "border-ritual", fusion: "border-fusion", synchro: "border-synchro", xyz: "border-white/60", link: "border-link" } as const;
const edgeOf = (card: CardId): string => {
	const info = cardOf(card);
	return info.kind === "monster" && info.frame ? FRAME_EDGE[info.frame] : KIND_EDGE[info.kind];
};
/** Where a card belongs in the builder: the Extra Deck, or its kind. */
const groupOf = (card: CardId): Exclude<Filter, "all"> => (inExtraDeck(card) ? "extra" : cardOf(card).kind);
const GROUP_ORDER = { monster: 0, spell: 1, trap: 2, extra: 3 } as const;
const levelOf = (card: CardId) => {
	const info = cardOf(card);
	return info.kind === "monster" ? info.level || info.rank || info.link || 0 : 0;
};
const atkOfCard = (card: CardId) => (cardOf(card).kind === "monster" ? monsterOf(card).atk : -1);

/** A card as a small picture, with the colour of its frame: the building block of both grids. */
function Thumb({ card, dim }: { card: CardId; dim?: boolean }) {
	const art = cardArtUrl(card, 160);
	return (
		<span className={`block aspect-square w-full overflow-hidden rounded-md border-2 bg-ink-700 ${edgeOf(card)} ${dim ? "opacity-40" : ""}`}>
			{art ? (
				<img src={art} alt="" width={160} height={160} loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
			) : (
				<span aria-hidden className="grid h-full w-full place-items-center text-2xl">
					{cardOf(card).art}
				</span>
			)}
		</span>
	);
}

/**
 * The Deck builder, like the ones of the card games children know: the Deck on one side and the binder on the other,
 * both as grids of card pictures; filters, a search and a sort over the binder; and a panel that shows the card that
 * was tapped, large, with its whole text and the buttons to add or take out a copy. The Deck is kept only when it
 * follows the rules: 40 cards in the Main Deck, up to 15 in the Extra Deck, up to 3 copies, and the TCG
 * Forbidden & Limited List.
 */
export function DeckBuilder({ deck, owned, copy, locale, onSave, onClose }: { deck: DeckRecord; owned: readonly CardId[]; copy: PlayCopy; locale: Locale; onSave: (deck: DeckRecord) => void; onClose: () => void }) {
	const words = DECK_COPY[locale];
	const titleId = useId();
	const [draft, setDraft] = useState(deck);
	const [filter, setFilter] = useState<Filter>("all");
	const [sort, setSort] = useState<Sort>("level");
	const [query, setQuery] = useState("");
	const [shown, setShown] = useState<CardId | null>(deck.main[0] ?? null);
	const ownedSet = useMemo(() => new Set<string>(owned), [owned]);
	const problems = deckProblems(draft, ownedSet);
	const english = locale === "he" ? "en" : undefined;
	const nameOf = (card: CardId) => copy.cards[card].name;

	const box = useRef<HTMLDivElement>(null);
	/* Like the other dialogs: the focus comes in, stays in while Tab is pressed, and goes back where it was. */
	useEffect(() => {
		const back = document.activeElement as HTMLElement | null;
		box.current?.focus();
		return () => back?.focus?.();
	}, []);
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") return onClose();
			if (event.key !== "Tab" || !box.current) return;
			const stops = [...box.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, select")];
			const first = stops[0];
			const last = stops.at(-1);
			if (!first || !last) return;
			const inside = box.current.contains(document.activeElement);
			if (event.shiftKey && (!inside || document.activeElement === first || document.activeElement === box.current)) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && (!inside || document.activeElement === last)) {
				event.preventDefault();
				first.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const bySort = (a: CardId, b: CardId) => GROUP_ORDER[groupOf(a)] - GROUP_ORDER[groupOf(b)] || (sort === "name" ? 0 : sort === "atk" ? atkOfCard(b) - atkOfCard(a) : levelOf(b) - levelOf(a)) || nameOf(a).localeCompare(nameOf(b));
	const binder = useMemo(() => {
		const wanted = query.trim().toLowerCase();
		return owned
			.filter((card) => filter === "all" || groupOf(card) === filter)
			.filter((card) => !wanted || nameOf(card).toLowerCase().includes(wanted) || PLAY_COPY.en.cards[card].name.toLowerCase().includes(wanted))
			.sort(bySort);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [owned, filter, query, sort, copy]);
	const main = useMemo(() => [...draft.main].sort(bySort), [draft.main, sort, copy]); // eslint-disable-line react-hooks/exhaustive-deps
	const extra = useMemo(() => [...draft.extra].sort(bySort), [draft.extra, sort, copy]); // eslint-disable-line react-hooks/exhaustive-deps
	const count = (kind: "monster" | "spell" | "trap") => draft.main.filter((card) => cardOf(card).kind === kind).length;

	const most = (card: CardId) => Math.min(MOST_COPIES, copiesAllowed(card));
	const full = (card: CardId) => copiesOf(draft, card) >= most(card) || (inExtraDeck(card) ? draft.extra.length >= EXTRA_DECK : draft.main.length >= MAIN_DECK);
	const add = (card: CardId) => setDraft((current) => addCard(current, card));
	const remove = (card: CardId) => setDraft((current) => removeCard(current, card));

	const deckGrid = (cards: readonly CardId[]) => (
		<ul className="grid grid-cols-8 gap-1 sm:grid-cols-10">
			{cards.map((card, index) => (
				<li key={`${card}:${index}`}>
					<button type="button" onClick={() => setShown(card)} aria-label={words.show(nameOf(card))} aria-pressed={shown === card} className={`block w-full rounded-md ${shown === card ? "ring-2 ring-gold-400" : ""}`}>
						<Thumb card={card} />
					</button>
				</li>
			))}
		</ul>
	);
	const info = shown ? cardOf(shown) : null;
	const ban = shown ? CARD_ART[shown]?.ban : undefined;
	const large = shown ? cardArtUrl(shown, 480) : null;
	const shownText = shown ? (copy.cards[shown].text ?? "") : "";

	return (
		<div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="outline-none fixed inset-0 z-[80] flex flex-col gap-2 overflow-hidden bg-ink-950 p-2 text-fg md:p-4">
			<header className="flex flex-wrap items-center gap-x-4 gap-y-1">
				<h2 id={titleId} className="font-display text-xl md:text-2xl">
					{words.deckTitle}
				</h2>
				<p aria-live="polite" className="flex flex-wrap items-center gap-x-3 text-sm">
					<span className={draft.main.length === MAIN_DECK ? "font-semibold text-spell" : "font-semibold text-ember-400"}>{words.main(draft.main.length, MAIN_DECK)}</span>
					<span className="text-fg-muted">{words.counts(count("monster"), count("spell"), count("trap"))}</span>
					<span className="text-fg-muted">{words.extra(draft.extra.length, EXTRA_DECK)}</span>
					<span className={problems.length === 0 ? "font-semibold text-spell" : "text-ember-400"}>{problems.length === 0 ? words.ready : words.problems[problems[0]!]}</span>
				</p>
				<span className="ms-auto flex flex-wrap gap-2">
					<button type="button" disabled={problems.length > 0} onClick={() => onSave(draft)} className={`${bigButton} bg-gold-400 text-ink-950 disabled:opacity-40`}>
						{words.save}
					</button>
					{draft.starter && (
						<button type="button" onClick={() => draft.starter && setDraft(startWith(draft.starter))} className={quietButton}>
							{words.reset}
						</button>
					)}
					<button type="button" onClick={onClose} aria-label={words.close} className={quietButton}>
						<X className="h-5 w-5" aria-hidden />
					</button>
				</span>
			</header>

			<div className="grid min-h-0 flex-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_17rem]">
				{/* The Deck: every copy, as in the real game's Deck box. */}
				<section aria-label={words.yourDeck} className="min-h-0 space-y-2 overflow-y-auto rounded-xl border border-white/15 p-2">
					<h3 className="text-sm font-semibold text-gold-400">
						{words.yourDeck} · {words.main(draft.main.length, MAIN_DECK)}
					</h3>
					{deckGrid(main)}
					<h3 className="text-sm font-semibold text-gold-400">{words.extra(draft.extra.length, EXTRA_DECK)}</h3>
					{deckGrid(extra)}
				</section>

				{/* The binder: one picture per card owned, with how many copies are in the Deck. */}
				<section aria-label={words.binder} className="flex min-h-0 flex-col gap-2 rounded-xl border border-white/15 p-2">
					<div className="flex flex-wrap items-center gap-1" role="group" aria-label={words.binder}>
						{FILTERS.map((item) => (
							<button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`min-h-9 rounded-lg border-2 px-2 text-sm font-semibold ${filter === item ? "border-gold-400 bg-gold-400/20" : "border-white/20"}`}>
								{words.filters[item]}
							</button>
						))}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<label className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border-2 border-white/20 px-2">
							<Search className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
							<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={words.search} aria-label={words.search} className="min-h-9 w-full min-w-0 bg-transparent text-sm text-fg outline-none" />
						</label>
						<label className="flex items-center gap-1 text-sm text-fg-muted">
							{words.sort}
							<select value={sort} onChange={(event) => setSort(SORTS.find((item) => item === event.target.value) ?? "level")} className="min-h-9 rounded-lg border-2 border-white/20 bg-ink-950 px-1 text-fg">
								{SORTS.map((item) => (
									<option key={item} value={item}>
										{words.sorts[item]}
									</option>
								))}
							</select>
						</label>
					</div>
					{binder.length === 0 ? (
						<p className="text-sm text-fg-muted">{words.nothingFound}</p>
					) : (
						<ul className="grid min-h-0 flex-1 grid-cols-5 content-start gap-1.5 overflow-y-auto sm:grid-cols-6">
							{binder.map((card) => {
								const inDeck = copiesOf(draft, card);
								return (
									<li key={card} className="relative">
										<button type="button" onClick={() => setShown(card)} aria-label={`${words.show(nameOf(card))}, ${words.inDeck(inDeck)}`} aria-pressed={shown === card} className={`block w-full rounded-md ${shown === card ? "ring-2 ring-gold-400" : ""}`}>
											<Thumb card={card} dim={most(card) === 0} />
										</button>
										<span aria-hidden className={`pointer-events-none absolute bottom-0 end-0 rounded-tl-md rounded-br-md px-1 text-[11px] font-bold ${inDeck > 0 ? "bg-gold-400 text-ink-950" : "bg-ink-950/80 text-fg-muted"}`}>
											{inDeck}/{most(card)}
										</span>
									</li>
								);
							})}
						</ul>
					)}
				</section>

				{/* The card that was tapped, large, with its whole text. */}
				<aside data-deck-card className="min-h-0 space-y-2 overflow-y-auto rounded-xl border border-white/15 p-2">
					{!shown || !info ? (
						<p className="text-sm text-fg-muted">{words.noCard}</p>
					) : (
						<>
							<div className="flex gap-2 md:block md:space-y-2">
								<span className={`block w-24 shrink-0 overflow-hidden rounded-lg border-4 md:w-full ${edgeOf(shown)}`}>
									{large ? <img src={large} alt="" width={480} height={480} className="aspect-square w-full object-cover" /> : <span aria-hidden className="grid aspect-square w-full place-items-center bg-ink-700 text-5xl">{info.art}</span>}
								</span>
								<div className="min-w-0 space-y-1">
									<h3 className="font-display text-lg leading-tight">
										<bdi lang={english}>{nameOf(shown)}</bdi>
									</h3>
									<p className="text-sm text-fg-muted">
										{info.kind === "monster" ? [info.type ? copy.types[info.type] : "", info.frame ? copy.frames[info.frame] : "", info.tuner ? copy.tuner : ""].filter(Boolean).join(" / ") || copy.kinds.monster : cardType(copy, shown)}
									</p>
									{info.kind === "monster" && (
										<p className="text-sm font-semibold">
											{info.link ? `${copy.linkRating} ${info.link}` : info.rank ? `${copy.rank} ${info.rank}` : `${copy.level} ${info.level}`} · {copy.atk} {info.atk}
											{info.link ? "" : ` · ${copy.def} ${info.def}`}
										</p>
									)}
									{ban && <p className="text-sm font-semibold text-ember-400">{words.limits[ban as keyof typeof words.limits] ?? ban}</p>}
								</div>
							</div>
							{shownText && (
								<p dir={copy.englishCards ? "ltr" : undefined} lang={copy.englishCards ? "en" : undefined} className="whitespace-pre-line text-sm leading-snug">
									{shownText}
								</p>
							)}
							<div className="flex items-center gap-3">
								<button type="button" onClick={() => remove(shown)} disabled={copiesOf(draft, shown) === 0} aria-label={words.remove(nameOf(shown))} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-white/30 disabled:opacity-30">
									<Minus className="h-5 w-5" aria-hidden />
								</button>
								<span className="text-center text-sm font-semibold" aria-live="polite">
									{words.inDeck(copiesOf(draft, shown))}
								</span>
								<button type="button" onClick={() => add(shown)} disabled={!ownedSet.has(shown) || full(shown)} aria-label={words.add(nameOf(shown))} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-gold-400 bg-gold-400/20 disabled:opacity-30">
									<Plus className="h-5 w-5" aria-hidden />
								</button>
							</div>
						</>
					)}
				</aside>
			</div>
		</div>
	);
}
