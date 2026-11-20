"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { CARD_ART } from "@/lib/junior/play/card-art";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { RARITIES, SHOP_CARDS, onSale, priceOf, rarityOf } from "@/lib/junior/world/shop";
import type { PlayProgress } from "@/lib/junior/play/progress";
import { trainerPicture } from "@/lib/junior/world/trainers";
import type { Outfit } from "@/lib/junior/world/wardrobe";
import { Modal, bigButton, quietButton } from "../home/confirm-dialog";
import { binderCardName } from "./display-card";
import { CardArt } from "./mini-board";
import { HeroShop, type WardrobeActions } from "./hero-shop";
import { Foil, RARITY_FRAME, RarityBadge } from "./rarity-look";

export type { WardrobeActions };

/**
 * Grandpa's game shop: Solomon Muto greets the child, the stars to spend are shown, and every card is shown with its
 * price. A card is bought from its large view, with one button; a card the child cannot afford yet says how many
 * stars are missing. Nothing random is sold.
 */
/** `progress`: which cards are on sale; a trainer's cards open once that trainer of the masters' island is beaten. Without it, every card is shown. */
export function ShopDialog({ stars, bought, wardrobe, preview, copy, locale, progress, onBuy, onClose }: { stars: number; bought: readonly string[]; wardrobe?: WardrobeActions; preview?: (outfit: Outfit) => ReactNode; copy: PlayCopy; locale: Locale; progress?: PlayProgress; onBuy: (card: string) => boolean; onClose: () => void }) {
	const words = CONTROLS_COPY[locale];
	const [tab, setTab] = useState<"cards" | "hero">("cards");
	const [picked, setPicked] = useState<string | null>(null);
	const [done, setDone] = useState<string | null>(null);
	const first = useRef<HTMLButtonElement>(null);
	const name = (card: string) => binderCardName(card, copy, locale);
	/* French shows French names; English and Hebrew show the English printed words. */
	const lang = locale === "fr" ? undefined : "en";

	return (
		<Modal title={words.shopName} onClose={onClose} initial={first}>
			<div className="flex items-end gap-2">
				<img src={trainerPicture("solomon-muto", 256)} alt="" height={256} className="h-20 w-auto shrink-0 object-contain" />
				<p dir="auto" className="rounded-xl bg-white/95 px-3 py-2 text-sm text-ink-950">
					{words.shopWelcome}
				</p>
			</div>
			<p className="flex items-center gap-2 text-lg font-semibold text-gold-400">
				<Star className="h-5 w-5 fill-gold-400" aria-hidden />
				{words.stars(stars)}
			</p>
			<p className="text-sm text-fg-muted">{words.howStars}</p>
			{wardrobe && (
				<div role="tablist" className="flex gap-2">
					{(["cards", "hero"] as const).map((id) => (
						<button
							key={id}
							type="button"
							role="tab"
							aria-selected={tab === id}
							onClick={() => {
								setTab(id);
								setPicked(null);
							}}
							className={`min-h-12 flex-1 rounded-xl border-2 px-3 font-semibold ${tab === id ? "border-gold-400 bg-gold-400/20 text-fg" : "border-white/15 text-fg-muted"}`}
						>
							{id === "cards" ? words.cardsTab : words.heroTab}
						</button>
					))}
				</div>
			)}
			{wardrobe && tab === "hero" ? (
				<div role="tabpanel">
					<HeroShop stars={stars} wardrobe={wardrobe} locale={locale} first={first} preview={preview} />
				</div>
			) : picked ? (
				large(picked)
			) : (
				<ul className="grid max-h-[50svh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
					{SHOP_CARDS.filter((item) => !progress || onSale(item, progress)).map((item, i) => {
						const owned = bought.includes(item.card);
						const label = `${name(item.card)}, ${words.rarity[item.rarity]}, ${owned ? words.owned : words.price(item.price)}`;
						return (
							<li key={item.card}>
								<button
									ref={i === 0 ? first : undefined}
									type="button"
									aria-label={label}
									onClick={() => {
										setDone(null);
										setPicked(item.card);
									}}
									className={`flex w-full flex-col items-center gap-1 rounded-lg border-2 p-1 text-center ${RARITY_FRAME[item.rarity]} ${owned ? "bg-spell/15" : item.price <= stars ? "" : "opacity-70"}`}
								>
									<span className="relative isolate block w-full overflow-hidden rounded">
										<CardArt card={item.card} size="large" />
										<Foil rarity={item.rarity} />
									</span>
									<RarityBadge rarity={item.rarity} name={words.rarity[item.rarity]} lang={lang} />
									<span dir="auto" lang={lang} className="line-clamp-2 text-xs font-semibold leading-tight text-fg">
										{name(item.card)}
									</span>
									<span className="text-xs font-bold text-gold-400">{owned ? "✓" : words.price(item.price)}</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
			{!picked && (
				<div className="flex justify-end">
					<button type="button" className={quietButton} onClick={onClose}>
						{words.close}
					</button>
				</div>
			)}
		</Modal>
	);

	/** The large view of one card: its art, name, numbers, and Buy (or why not). */
	function large(card: string) {
		const price = priceOf(card) ?? 0;
		const rarity = rarityOf(card) ?? "common";
		const owned = bought.includes(card);
		const info = CARD_ART[card];
		/* The bigger the rarity, the bigger the reward when it is bought: a larger card that turns and shines. */
		const rank = RARITIES.indexOf(rarity);
		const justBought = done === card;
		return (
			<div className="space-y-3 text-center">
				<motion.div
					key={justBought ? "won" : "shown"}
					initial={justBought ? { scale: 0.6, rotateY: 180 } : false}
					animate={{ scale: justBought ? 1 + rank * 0.06 : 1, rotateY: 0 }}
					transition={{ type: "spring", stiffness: 140, damping: 14 }}
					className={`relative mx-auto w-40 overflow-hidden rounded-xl border-4 ${RARITY_FRAME[rarity]}`}
				>
					<CardArt card={card} size="large" />
					<Foil rarity={rarity} />
				</motion.div>
				<RarityBadge rarity={rarity} name={words.rarity[rarity]} lang={lang} />
				<p dir="auto" lang={lang} className="text-lg font-semibold text-fg">
					{name(card)}
				</p>
				{info?.kind === "monster" && (
					<bdi dir="ltr" className="block text-sm text-fg-muted">
						{copy.atk} {info.atk} · {copy.def} {info.def}
					</bdi>
				)}
				{justBought ? (
					<p role="status" className="font-semibold text-spell">
						{words.bought(name(card))}
						{rank >= RARITIES.indexOf("super") && <span className="block text-gold-400">{words.rareCheer}</span>}
					</p>
				) : owned ? (
					<p className="font-semibold text-spell">{words.owned}</p>
				) : price <= stars ? (
					<button type="button" className={`${bigButton} bg-gold-400 text-ink-950`} onClick={() => onBuy(card) && setDone(card)}>
						{words.buy(price)}
					</button>
				) : (
					<p className="font-semibold text-fg-muted">{words.needMore(price - stars)}</p>
				)}
				<div>
					<button type="button" className={quietButton} onClick={() => setPicked(null)}>
						{words.back}
					</button>
				</div>
			</div>
		);
	}
}
