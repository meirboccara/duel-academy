"use client";

import type { Locale } from "@/lib/i18n/locales";
import { cardArtUrl } from "@/lib/junior/play/card-pictures";
import type { CardId } from "@duel-academy/engine";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { DECK_COPY } from "@/lib/junior/play/deck-copy";
import { STARTERS, STARTER_IDS, type StarterId } from "@/lib/junior/play/starters";
import { Modal } from "../home/confirm-dialog";

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

/** How many new cards the offer shows as pictures; the rest are counted. */
const SHOWN_NEW = 8;
/**
 * A newer edition of the child's starter Deck (starters.ts `STARTER_EDITION`): the new cards, and a choice between the
 * new Deck and the child's own. The new cards join the binder either way.
 */
export function StarterUpdateDialog({ starter, added, copy, locale, onTake, onKeep }: { starter: StarterId; added: readonly CardId[]; copy: PlayCopy; locale: Locale; onTake: () => void; onKeep: () => void }) {
	const words = DECK_COPY[locale];
	const shown = added.slice(0, SHOWN_NEW);
	return (
		<Modal title={words.updateTitle} onClose={onKeep}>
			<p dir="auto" className="text-sm text-fg-muted">
				{words.updateText(words.starters[starter].name)}
			</p>
			<p className="text-sm font-semibold text-fg">{words.updateCards}</p>
			<ul className="flex flex-wrap gap-2">
				{shown.map((card) => {
					const art = cardArtUrl(card, 160);
					const name = copy.cards[card]?.name ?? card;
					return (
						<li key={card} className="flex w-20 flex-col items-center gap-1 text-center">
							{art && <img src={art} alt="" width={160} height={160} className="h-16 w-16 rounded-lg object-cover" />}
							<span dir="auto" className="text-[11px] leading-tight text-fg">
								{name}
							</span>
						</li>
					);
				})}
			</ul>
			{added.length > shown.length && <p className="text-xs text-fg-muted">{words.updateMore(added.length - shown.length)}</p>}
			<div className="flex flex-wrap gap-2">
				<button type="button" onClick={onTake} className="rounded-xl border-4 border-gold-400 bg-gold-400 px-4 py-2 font-display text-base text-ink-950">
					{words.takeNew}
				</button>
				<button type="button" onClick={onKeep} className="rounded-xl border-4 border-gold-400/70 px-4 py-2 font-display text-base text-fg">
					{words.keepMine}
				</button>
			</div>
		</Modal>
	);
}

