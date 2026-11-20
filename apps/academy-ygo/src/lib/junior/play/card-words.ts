import { CARD_ART } from "./card-art";
import type { CardId } from "./cards";

/**
 * The name and text of real cards as printed, in English or French (Konami's wording, fetched by
 * scripts/cards/build-art.mjs into card-art.ts). The copy files word the course's cards by hand and fall back to
 * these for every other real card, so a card added to a deck needs no hand-written copy.
 */
export function printedWords(language: "en" | "fr"): Partial<Record<CardId, { name: string; text?: string }>> {
	return Object.fromEntries(
		Object.entries(CARD_ART).map(([id, entry]) => {
			const text = language === "fr" ? entry.textFr : entry.text;
			return [id, { name: language === "fr" ? entry.nameFr : entry.name, ...(text ? { text } : {}) }];
		}),
	);
}
