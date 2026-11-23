"use client";

import { ExternalLink, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { cardPictureUrl, cardRulingsUrl, displayName } from "@/lib/card-search/links";
import type { Locale } from "@/lib/i18n/locales";
import { useLanguage } from "@/lib/i18n/provider";
import type { KidExplanation } from "@/server/academy-db";
import type { JudgeCard } from "@/server/judge-cards";

type Props = {
	/** null: the card list could not be read. */
	card: JudgeCard | null;
	/** Explanations for children, by language: only the reader's language is shown. */
	explanations: Partial<Record<Locale, KidExplanation>>;
	/** In the Junior game's card list. */
	playable: boolean;
};

export function CardDetail({ card, explanations, playable }: Props) {
	const { t, locale } = useLanguage();
	const back = (
		<Link href="/card-search" className="text-arcane-300 underline-offset-4 hover:underline">
			{t("Back to the card search")}
		</Link>
	);
	if (!card) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-8">
				<p role="alert" className="text-lg text-fg-muted">{t("The card book is closed for now. Please try again later.")}</p>
				<p className="mt-4">{back}</p>
			</main>
		);
	}
	const explanation = explanations[locale];
	const name = displayName(card, locale);
	return (
		<main className="mx-auto max-w-4xl px-4 py-8">
			<p>{back}</p>
			<div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
				{/* eslint-disable-next-line @next/next/no-img-element -- the picture is already resized by ygoprojudge.com */}
				<img src={cardPictureUrl(card.passcode, 384)} alt={name} width={384} height={560} className="w-full max-w-72 rounded-xl bg-surface" />
				<div className="space-y-5">
					<h1 className="font-display text-3xl text-gold-400" dir="ltr">{name}</h1>
					{playable && (
						<p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-fg">
							<Gamepad2 className="h-4 w-4" aria-hidden />
							{t("You can play this card in the game")}
						</p>
					)}
					<section aria-labelledby="kid-explanation">
						<h2 id="kid-explanation" className="text-xl font-semibold text-fg">{t("What does this card do?")}</h2>
						{explanation ? (
							<>
								<p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-fg">{explanation.text}</p>
								{!explanation.checked && <p className="mt-1 text-xs text-fg-muted">{t("Written by a computer helper, not checked by a grown-up yet.")}</p>}
							</>
						) : (
							<p className="mt-2 text-lg text-fg-muted">{t("The explanation for this card is coming soon.")}</p>
						)}
					</section>
					<details className="rounded-xl border border-white/10 p-4">
						<summary className="cursor-pointer text-fg">{t("The words printed on the card (for grown-ups)")}</summary>
						<p className="mt-2 whitespace-pre-line text-sm text-fg-muted" dir="ltr" lang="en">{card.text}</p>
					</details>
					<a href={cardRulingsUrl(card.passcode)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-arcane-300 underline-offset-4 hover:underline">
						{t("Rules for this card on YGOProJudge")}
						<ExternalLink className="h-4 w-4" aria-hidden />
						<span className="sr-only">{t("(opens in a new tab)")}</span>
					</a>
				</div>
			</div>
		</main>
	);
}
