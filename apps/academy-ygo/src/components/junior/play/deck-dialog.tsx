"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { cardArtUrl } from "@/lib/junior/play/card-art";
import { cardOf, inExtraDeck, monsterOf, type CardId } from "@/lib/junior/play/cards";
import { cardType, type PlayCopy } from "@/lib/junior/play/copy";
import { DECK_COPY } from "@/lib/junior/play/deck-copy";
import { addCard, copiesOf, removeCard, startWith, type DeckRecord } from "@/lib/junior/play/deck-record";
import { EXTRA_DECK, MAIN_DECK, MOST_COPIES, deckProblems } from "@/lib/junior/play/masters";
import { STARTERS, STARTER_IDS, type StarterId } from "@/lib/junior/play/starters";
import { Modal, bigButton, quietButton } from "../home/confirm-dialog";

/** The order of the binder in the Deck editor: Monsters by Level, then Spells, then Traps, then the Extra Deck. */
function order(card: CardId): number {
	const info = cardOf(card);
	if (inExtraDeck(card)) return 300;
	return info.kind === "monster" ? monsterOf(card).level : info.kind === "spell" ? 100 : 200;
}

/**
 * "Choose your starter Deck", once, on the masters' island: three Decks of real cards. The one chosen becomes the
 * child's Deck, and its cards join the binder.
 */
export function StarterDialog({ copy, locale, onChoose, onClose }: { copy: PlayCopy; locale: Locale; onChoose: (starter: StarterId) => void; onClose: () => void }) {
	const words = DECK_COPY[locale];
	return (
		<Modal title={words.chooseTitle} onClose={onClose}>
			<p className="text-sm text-fg-muted">{words.chooseText}</p>
			<ul className="grid gap-2 sm:grid-cols-3">
				{STARTER_IDS.map((starter) => {
					const info = words.starters[starter];
					const art = cardArtUrl(STARTERS[starter].cover, 160);
					return (
						<li key={starter}>
							<button type="button" onClick={() => onChoose(starter)} aria-label={`${words.choose(info.name)}. ${info.text}`} className="flex h-full w-full flex-col items-center gap-2 rounded-2xl border-4 border-gold-400/70 bg-gold-400/10 p-3 text-center hover:border-gold-400">
								{art && <img src={art} alt="" width={160} height={160} className="h-20 w-20 rounded-lg object-cover" />}
								<span dir="auto" className="font-display text-base leading-tight text-fg">
									{info.name}
								</span>
								<span dir="auto" className="text-xs leading-snug text-fg-muted">
									{info.text}
								</span>
								<span className="sr-only">{copy.cards[STARTERS[starter].cover as CardId]?.name}</span>
							</button>
						</li>
					);
				})}
			</ul>
		</Modal>
	);
}

/**
 * The Deck editor: every card of the binder the rules engine plays, with how many copies are in the Deck and buttons
 * to add or take one out. The Deck is kept only when it follows the rules: 40 cards in the Main Deck, up to 3 copies,
 * up to 15 in the Extra Deck.
 */
export function DeckDialog({ deck, owned, copy, locale, onSave, onClose }: { deck: DeckRecord; owned: readonly CardId[]; copy: PlayCopy; locale: Locale; onSave: (deck: DeckRecord) => void; onClose: () => void }) {
	const words = DECK_COPY[locale];
	const [draft, setDraft] = useState(deck);
	const ownedSet = useMemo(() => new Set<string>(owned), [owned]);
	const cards = useMemo(() => [...owned].sort((a, b) => order(a) - order(b) || copy.cards[a].name.localeCompare(copy.cards[b].name)), [owned, copy]);
	const problems = deckProblems(draft, ownedSet);
	const english = locale === "he" ? "en" : undefined;
	return (
		<Modal title={words.deckTitle} onClose={onClose}>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-live="polite">
				<span className={draft.main.length === MAIN_DECK ? "text-spell" : "text-fg"}>{words.main(draft.main.length, MAIN_DECK)}</span>
				<span className="text-fg-muted">{words.extra(draft.extra.length, EXTRA_DECK)}</span>
				<span className={problems.length === 0 ? "font-semibold text-spell" : "text-ember-400"}>{problems.length === 0 ? words.ready : words.problems[problems[0]!]}</span>
			</div>
			<ul className="grid max-h-[50svh] gap-1 overflow-y-auto sm:grid-cols-2">
				{cards.map((card) => {
					const name = copy.cards[card].name;
					const count = copiesOf(draft, card);
					const info = cardOf(card);
					const art = cardArtUrl(card, 160);
					const full = count >= MOST_COPIES || (inExtraDeck(card) ? draft.extra.length >= EXTRA_DECK : draft.main.length >= MAIN_DECK);
					return (
						<li key={card} className={`flex items-center gap-2 rounded-xl border-2 p-1 ${count > 0 ? "border-gold-400/70 bg-gold-400/10" : "border-white/15"}`}>
							{art ? <img src={art} alt="" width={160} height={160} loading="lazy" className="h-10 w-10 shrink-0 rounded object-cover" /> : <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center text-2xl">{info.art}</span>}
							<span className="min-w-0 flex-1 leading-tight">
								<bdi lang={english} className="block truncate text-sm text-fg">
									{name}
								</bdi>
								<span className="block text-xs text-fg-muted">
									{info.kind === "monster" ? `${copy.level} ${info.level || info.rank || info.link || 0} · ${info.atk}/${info.def}` : cardType(copy, card)} · {words.inDeck(count)}
								</span>
							</span>
							<button type="button" onClick={() => setDraft((current) => removeCard(current, card))} disabled={count === 0} aria-label={words.remove(name)} className="grid h-10 w-10 place-items-center rounded-lg border-2 border-white/25 disabled:opacity-30">
								<Minus className="h-4 w-4" aria-hidden />
							</button>
							<span aria-hidden className="w-4 text-center font-bold text-fg">
								{count}
							</span>
							<button type="button" onClick={() => setDraft((current) => addCard(current, card))} disabled={full} aria-label={words.add(name)} className="grid h-10 w-10 place-items-center rounded-lg border-2 border-white/25 disabled:opacity-30">
								<Plus className="h-4 w-4" aria-hidden />
							</button>
						</li>
					);
				})}
			</ul>
			<div className="flex flex-wrap gap-2">
				<button type="button" disabled={problems.length > 0} onClick={() => onSave(draft)} className={`${bigButton} bg-gold-400 text-ink-950 disabled:opacity-40`}>
					{words.save}
				</button>
				{draft.starter && (
					<button type="button" onClick={() => draft.starter && setDraft(startWith(draft.starter))} className={quietButton}>
						{words.reset}
					</button>
				)}
				<button type="button" onClick={onClose} className={quietButton}>
					{words.close}
				</button>
			</div>
		</Modal>
	);
}
