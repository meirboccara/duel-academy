"use client";

import { Heart, Search } from "lucide-react";
import Link from "next/link";
import { APP_NAME, PATREON_URL } from "@/lib/brand";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n/provider";

/**
 * The site is one children's game: the name leads home, "Cards" opens the card search, and the language can be changed from every page. Grown-ups
 * can support the project on Patreon (the owner's page; it opens in a new tab, the game stays open).
 */
export function SiteHeader() {
	const { t } = useLanguage();
	return (
		<header data-site-chrome className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/10 px-4 py-2 md:px-6">
			<Link href="/" className="inline-flex min-h-10 items-center font-display text-sm font-bold uppercase tracking-wider text-gold-400 focus-visible:outline-2 focus-visible:outline-gold-400" dir="ltr">
				{APP_NAME}
			</Link>
			<div className="flex items-center gap-2">
				<Link
					href="/card-search"
					className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 px-3 text-sm font-semibold text-fg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
				>
					<Search className="h-4 w-4" aria-hidden />
					<span>{t("Cards")}</span>
				</Link>
				<a
					href={PATREON_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#ff424d] px-3 text-sm font-semibold text-white hover:bg-[#e63a44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
				>
					<Heart className="h-4 w-4 fill-white" aria-hidden />
					<span>{t("Support us on Patreon")}</span>
					<span className="sr-only">{t("(opens in a new tab)")}</span>
				</a>
				<LanguageSwitcher />
			</div>
		</header>
	);
}
