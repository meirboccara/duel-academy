import type { Locale } from "./locales";
import { UI_FR } from "./ui-fr";
import { UI_HE } from "./ui-he";

/** Interface labels (not lesson content). Lesson content lives in fr-content.json / he-content.json. */
const UI: Record<"fr" | "he", Record<string, string>> = { fr: UI_FR, he: UI_HE };

export function uiDictionary(locale: Locale, english: string): string | undefined {
	if (locale === "en") return english;
	const table = UI[locale];
	return Object.hasOwn(table, english) ? table[english] : undefined;
}
