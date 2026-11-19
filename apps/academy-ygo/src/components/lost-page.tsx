"use client";

import { Compass } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { useLanguage } from "@/lib/i18n/provider";

const WORDS: Record<Locale, { title: string; text: string; home: string }> = {
	en: { title: "Lost at sea!", text: "This page does not exist. Your boat is waiting at the islands.", home: "Back to the islands" },
	fr: { title: "Perdu en mer !", text: "Cette page n’existe pas. Ton bateau t’attend aux îles.", home: "Retour aux îles" },
	he: { title: "אבדנו בים!", text: "הדף הזה לא קיים. הסירה שלך מחכה באיים.", home: "חזרה לאיים" },
};

/** The page shown for an address that does not exist, in the child's language. */
export function LostPage() {
	const { locale } = useLanguage();
	const words = WORDS[locale];
	return (
		<main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
			<Compass className="h-14 w-14 text-gold-400" aria-hidden />
			<h1 className="font-display text-3xl text-fg">{words.title}</h1>
			<p className="text-lg text-fg-muted">{words.text}</p>
			<Link href="/" className="inline-flex min-h-14 items-center rounded-2xl bg-gold-400 px-7 py-3 text-lg font-semibold text-ink-950">
				{words.home}
			</Link>
		</main>
	);
}
