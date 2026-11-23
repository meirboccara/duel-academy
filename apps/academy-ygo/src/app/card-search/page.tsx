import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CardSearch } from "@/components/card-search/card-search";
import { printedNumber, searchCards, type JudgeCard } from "@/server/judge-cards";

export const metadata: Metadata = { title: "Cards" };

/**
 * The card search: a child looks up a card they hold, by name or by the number printed on it, to understand what it
 * does. Every card in YGOProJudge's list, a page at a time. Read on the server.
 */
export default async function CardSearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	const params = await searchParams;
	const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
	const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
	let result: { cards: JudgeCard[]; total: number } | null = null;
	try {
		result = await searchCards(query, page);
	} catch (error) {
		console.error("card search:", error);
	}
	/* The number on the card names exactly one card: go straight to it. (redirect() throws, so it stays out of the try.) */
	if (result && printedNumber(query) !== null && result.cards.length === 1) redirect(`/card-search/${result.cards[0]!.passcode}`);
	return <CardSearch query={query} page={page} result={result && { cards: result.cards.map(({ passcode, name, nameFr }) => ({ passcode, name, nameFr })), total: result.total }} />;
}
