"use client";

import type { Locale } from "@/lib/i18n/locales";
import { cardArtUrl } from "@/lib/junior/play/card-art";
import type { CardId } from "@/lib/junior/play/cards";
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
