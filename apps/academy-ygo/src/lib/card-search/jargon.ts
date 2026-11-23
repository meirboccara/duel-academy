import type { Locale } from "@/lib/i18n/locales";

/**
 * Game words an explanation for children must not use: it says what they mean in plain words instead
 * (docs/kid-explanations-guide.md). Card names, Monster, Spell and Trap stay: a child sees them on the card.
 */
/*
 * Each pattern starts at the beginning of a word and takes the whole word (accented letters included, hence `u` and
 * \p{L} rather than \b), so every form counts: "activating", "ciblé", "activée", "להפעיל".
 */
const WORD = "\\p{L}*";
const at = (stem: string) => new RegExp(`(?<!\\p{L})(?:${stem})${WORD}`, "iu");
const exactly = (word: string) => new RegExp(`(?<!\\p{L})(?:${word})(?!\\p{L})`, "iu");
const JARGON: Record<Locale, readonly RegExp[]> = {
	en: [at("target"), exactly("chain(?:s|ed|ing)?"), exactly("costs?"), at("resolv"), at("activat"), exactly("spell speed")],
	fr: [at("cibl"), at("cha[iî]n"), exactly("co[uû]ts?"), at("r[ée]so(?:ud|ut|lu)"), at("activ")],
	he: [/מטרה/u, /שרשרת/u, /מחיר/u, /עלות/u, /הפע(?:י)?ל/u],
};

/** The game words found in `text`, as written. */
export function jargonIn(text: string, locale: Locale): string[] {
	return JARGON[locale].flatMap((pattern) => text.match(pattern)?.[0] ?? []);
}
