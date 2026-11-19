export const LOCALES = ["en", "fr", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LANGUAGE_KEY = "duel-academy-language";
export const LANGUAGE_NAMES: Record<Locale, string> = { en: "English", fr: "Français", he: "עברית" };
export function isLocale(value: unknown): value is Locale {
	return value === "en" || value === "fr" || value === "he";
}
export function dirOf(locale: Locale): "rtl" | "ltr" {
	return locale === "he" ? "rtl" : "ltr";
}
export function resolveLocale(saved: unknown, languages: readonly string[]): Locale {
	if (isLocale(saved)) return saved;
	for (const language of languages) {
		const base = language.toLowerCase().split("-")[0];
		if (base === "iw") return "he";
		if (isLocale(base)) return base;
	}
	return DEFAULT_LOCALE;
}
