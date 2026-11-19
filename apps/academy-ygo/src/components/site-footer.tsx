"use client";

import { ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/provider";

const RESOURCES = [
	{ name: "YGOPRODeck", href: "https://ygoprodeck.com/" },
	{ name: "YGOProJudge", href: "https://ygoprojudge.com/" },
	{ name: "DuelingTCG", href: "https://duelingtcg.com/" },
];

export function SiteFooter() {
	const { t } = useLanguage();
	const pathname = usePathname();
	/* The Junior mission is for children: no links that leave the site on their path. */
	const isJuniorPath = pathname === "/junior" || pathname.startsWith("/junior/");
	return (
		<footer data-site-chrome className="border-t border-white/10 px-6 py-8 text-center text-xs text-fg-muted">
			<div className="mx-auto max-w-4xl space-y-4">
				{!isJuniorPath && (
					<nav aria-labelledby="resources-heading">
						<h2 id="resources-heading" className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{t("More Yu-Gi-Oh! resources")}</h2>
						<ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
							{RESOURCES.map(({ name, href }) => (
								<li key={href}>
									<a
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										dir="ltr"
										className="inline-flex min-h-10 items-center gap-1.5 text-sm text-arcane-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-gold-400"
									>
										{name}
										<ExternalLink className="h-3.5 w-3.5" aria-hidden />
										<span className="sr-only">{t("(opens in a new tab)")}</span>
									</a>
								</li>
							))}
						</ul>
					</nav>
				)}
				<p>{t("Duel Academy is an unofficial, non-commercial fan project for learning. Card names, card text, card artwork and characters belong to their owners: Yu-Gi-Oh! © Kazuki Takahashi, Studio Dice/SHUEISHA, TV TOKYO, KONAMI. A few cards are our own examples.")}</p>
				<p>{t("Duel Academy is not affiliated with or endorsed by Konami. Yu-Gi-Oh! is a trademark of Konami.")}</p>
				<p>{t("Card pictures: YGOPRODeck and the Duelists Unite team. Island and character models: Kay Lousberg (KayKit), CC0.")}</p>
				{/* The year comes from the reader's clock, so a page built last year still shows this year. */}
				<p suppressHydrationWarning>
					© {new Date().getFullYear()} {APP_NAME}, {t("for the lessons and the code.")}
				</p>
			</div>
		</footer>
	);
}
