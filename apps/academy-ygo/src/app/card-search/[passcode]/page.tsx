import { CARD_ART, CARDS } from "@duel-academy/cards";
import { notFound } from "next/navigation";
import { CardDetail } from "@/components/card-search/card-detail";
import { parsePasscode } from "@/lib/card-search/links";
import { kidExplanations, type KidExplanation } from "@/server/academy-db";
import { findCard, type JudgeCard } from "@/server/judge-cards";
import type { Locale } from "@/lib/i18n/locales";

/** Cards the Junior game plays (`CARDS`; some art entries are not playable), by passcode: their page says so. */
const PLAYABLE = new Set(Object.keys(CARDS).flatMap((id) => CARD_ART[id]?.image ?? []));

/** The tab shows the card's printed (English) name; the page itself shows the French name to French readers. */
export async function generateMetadata({ params }: { params: Promise<{ passcode: string }> }) {
	const passcode = parsePasscode((await params).passcode);
	const card = passcode === null ? null : await findCard(passcode).catch(() => null);
	return { title: card?.name ?? "Cards" };
}

/** One card: its picture, its explanation for children (the reader's language only) and its printed words. */
export default async function CardPage({ params }: { params: Promise<{ passcode: string }> }) {
	const passcode = parsePasscode((await params).passcode);
	if (passcode === null) notFound();
	let card: JudgeCard | null;
	try {
		card = await findCard(passcode);
	} catch (error) {
		console.error("card page:", error);
		return <CardDetail card={null} explanations={{}} playable={false} />;
	}
	if (!card) notFound();
	/* The explanations are Duel Academy's own data: without them the card still shows, with its printed words. */
	let explanations: Partial<Record<Locale, KidExplanation>> = {};
	try {
		explanations = await kidExplanations(passcode);
	} catch (error) {
		console.error("kid explanations:", error);
	}
	return <CardDetail card={card} explanations={explanations} playable={PLAYABLE.has(passcode)} />;
}
