"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { cardPictureUrl, displayName, PAGE_SIZE } from "@/lib/card-search/links";
import type { JudgeCard } from "@/server/judge-cards";
import { useLanguage } from "@/lib/i18n/provider";

type Props = {
	query: string;
	page: number;
	/** null: the card list could not be read. */
	result: { cards: Pick<JudgeCard, "passcode" | "name" | "nameFr">[]; total: number } | null;
};

/** Find any card by its name or the number printed on it. French readers see French names (as on their cards); others, English. */
export function CardSearch({ query, page, result }: Props) {
	const { t, locale } = useLanguage();
	const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
	const pageHref = (to: number) => `/card-search?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(to) })}`;
	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<h1 className="font-display text-3xl text-gold-400">{t("Find a card")}</h1>
			<p className="mt-2 text-lg text-fg-muted">{t("Got a card in your hand? Type its name, or the number at the bottom left of the card.")}</p>
			<form action="/card-search" role="search" className="mt-4 flex gap-2">
				<label className="sr-only" htmlFor="card-search-q">{t("Card name or number")}</label>
				<input
					id="card-search-q"
					name="q"
					defaultValue={query}
					placeholder={t("Name or number, like 05318639")}
					dir="ltr"
					autoComplete="off"
					className="min-h-12 flex-1 rounded-2xl border border-white/15 bg-surface px-4 text-lg text-fg placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-gold-400"
				/>
				<button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gold-400 px-5 text-lg font-semibold text-ink-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400">
					<Search className="h-5 w-5" aria-hidden />
					{t("Search")}
				</button>
			</form>

			{!result ? (
				<p role="alert" className="mt-8 text-lg text-fg-muted">{t("The card book is closed for now. Please try again later.")}</p>
			) : result.cards.length === 0 ? (
				<p className="mt-8 text-lg text-fg-muted">{t("No card found. Try the number at the bottom left of your card.")}</p>
			) : (
				<>
					<ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{result.cards.map((card) => (
							<li key={card.passcode}>
								<Link href={`/card-search/${card.passcode}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400">
									{/* eslint-disable-next-line @next/next/no-img-element -- the picture is already resized by ygoprojudge.com */}
									<img src={cardPictureUrl(card.passcode)} alt="" loading="lazy" width={256} height={373} className="aspect-[59/86] w-full rounded-lg bg-surface object-cover transition group-hover:scale-[1.03]" />
									<span className="mt-1 block text-sm text-fg" dir="ltr">{displayName(card, locale)}</span>
								</Link>
							</li>
						))}
					</ul>
					{pages > 1 && (
						<nav aria-label={t("Pages")} className="mt-8 flex items-center justify-center gap-4 text-fg">
							{page > 1 && <Link href={pageHref(page - 1)} className="min-h-10 rounded-full border border-white/15 px-4 py-2">{t("Previous")}</Link>}
							<span dir="ltr">{page} / {pages}</span>
							{page < pages && <Link href={pageHref(page + 1)} className="min-h-10 rounded-full border border-white/15 px-4 py-2">{t("Next")}</Link>}
						</nav>
					)}
				</>
			)}
		</main>
	);
}
