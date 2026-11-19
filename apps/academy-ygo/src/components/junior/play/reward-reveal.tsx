"use client";

import { Share } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { HOME_COPY } from "@/lib/junior/home/copy";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { Modal, bigButton } from "../home/confirm-dialog";
import { binderCardName } from "./display-card";
import { CardArt } from "./mini-board";

/** The moment new cards join the binder: each card large with its art, shown once, closed by one big button. */
export function RewardReveal({ cards, copy, locale, homeScreenHint, onClose }: { cards: string[]; copy: PlayCopy; locale: Locale; /** Shown once, with the first finished island: how a parent keeps the saves on an iPad. */ homeScreenHint?: boolean; onClose: () => void }) {
	const words = HOME_COPY[locale];
	const ok = useRef<HTMLButtonElement>(null);
	return (
		<Modal title={words.newCards(cards.length)} onClose={onClose} initial={ok}>
			<ul className="flex flex-wrap justify-center gap-3">
				{cards.map((card, i) => (
					<motion.li key={card} initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.15 * i, type: "spring", stiffness: 160, damping: 16 }} className="w-32 space-y-1 text-center sm:w-40">
						<span className="block overflow-hidden rounded-lg border-2 border-gold-400 shadow-[0_0_24px_rgba(255,216,74,0.35)]">
							<CardArt card={card} size="large" emojiClass="grid aspect-square w-full place-items-center text-6xl" />
						</span>
						<span dir="auto" lang={copy.englishCards ? "en" : undefined} className="block text-sm font-semibold text-fg">
							{binderCardName(card, copy, locale)}
						</span>
					</motion.li>
				))}
			</ul>
			{homeScreenHint && (
				<aside className="rounded-xl border border-white/15 p-3 text-start text-sm text-fg-muted">
					<p className="flex items-center gap-2 font-semibold text-fg">
						<Share className="h-5 w-5 shrink-0" aria-hidden />
						{words.homeScreenTitle}
					</p>
					<p className="pt-1">{words.homeScreenSteps}</p>
				</aside>
			)}
			<div className="text-center">
				<button ref={ok} type="button" onClick={onClose} className={`${bigButton} bg-gold-400 text-ink-950`}>
					{words.gotIt}
				</button>
			</div>
		</Modal>
	);
}
