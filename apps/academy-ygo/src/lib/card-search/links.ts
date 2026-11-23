import type { Locale } from "@/lib/i18n/locales";

/**
 * Card pictures come through ygoprojudge.com, the way YGOProJudge shows them: its image service resizes YGOPRODeck's
 * picture (YGOProJudge's `remotePatterns` allow images.ygoprodeck.com/images/cards). Widths 256 and 384 are Next's
 * default image sizes, which that service accepts.
 */
export function cardPictureUrl(passcode: number, width: 256 | 384 = 256): string {
	const source = `https://images.ygoprodeck.com/images/cards/${passcode}.jpg`;
	return `https://ygoprojudge.com/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=75`;
}

/** The card's page on YGOProJudge, with its rulings (by passcode; names and Konami ids give 404). */
export function cardRulingsUrl(passcode: number): string {
	return `https://ygoprojudge.com/cards/${passcode}`;
}

/** Cards per page of the search. */
export const PAGE_SIZE = 24;

/** The name a child reads on their card: French cards are printed with French names. */
export function displayName(card: { name: string; nameFr: string | null }, locale: Locale): string {
	return (locale === "fr" && card.nameFr) || card.name;
}

/** A passcode from the address bar: a whole positive number, or null. */
export function parsePasscode(value: string): number | null {
	return /^\d{1,10}$/.test(value) && Number(value) > 0 ? Number(value) : null;
}
