"use client";

import { useRef } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { rarityOf } from "@/lib/junior/world/shop";
import { Modal, quietButton } from "../home/confirm-dialog";
import { BinderCard } from "./display-card";
import { RarityBadge } from "./rarity-look";

/** The cards of the album: played with, given by finished islands (gold ring) and bought (with their rarity). */
export function AlbumCards({ cards, rewards, copy, locale }: { cards: readonly string[]; rewards: ReadonlySet<string>; copy: PlayCopy; locale: Locale }) {
	const words = CONTROLS_COPY[locale];
	if (cards.length === 0) return <p className="text-fg-muted">{copy.albumEmpty}</p>;
	return (
		<ul className="flex flex-wrap gap-2">
			{cards.map((card) => {
				const rarity = rarityOf(card);
				return (
					<li key={card} className="flex w-28 flex-col items-center gap-1">
						<span className="block h-28 w-24">
							<BinderCard card={card} copy={copy} locale={locale} gold={rewards.has(card)} />
						</span>
						{rarity && <RarityBadge rarity={rarity} name={words.rarity[rarity]} lang={locale === "fr" ? undefined : "en"} />}
					</li>
				);
			})}
		</ul>
	);
}

/** The album, opened from its button on the map or the list whenever the child wants to look at their cards. */
export function AlbumDialog({ cards, rewards, copy, locale, onClose }: { cards: readonly string[]; rewards: ReadonlySet<string>; copy: PlayCopy; locale: Locale; onClose: () => void }) {
	const close = useRef<HTMLButtonElement>(null);
	return (
		<Modal title={copy.albumTitle} onClose={onClose} initial={close}>
			{/* Padded so the glow of the rarest cards is not cut by the scrolling box. */}
			<div className="max-h-[60svh] overflow-y-auto p-3">
				<AlbumCards cards={cards} rewards={rewards} copy={copy} locale={locale} />
			</div>
			<div className="flex justify-end">
				<button ref={close} type="button" className={quietButton} onClick={onClose}>
					{CONTROLS_COPY[locale].close}
				</button>
			</div>
		</Modal>
	);
}
