import { LANGUAGE_KEY, isLocale, type Locale } from "./locales";

type LocaleStorage = Pick<Storage, "getItem" | "setItem">;

/** The saved language, or null when nothing valid is stored or storage is unavailable. */
export function readSavedLocale(storage: LocaleStorage | undefined): Locale | null {
	try {
		const value = storage?.getItem(LANGUAGE_KEY);
		return isLocale(value) ? value : null;
	} catch {
		return null;
	}
}

export function saveLocale(storage: LocaleStorage | undefined, locale: Locale): void {
	try {
		storage?.setItem(LANGUAGE_KEY, locale);
	} catch {
		/* Storage is optional (private browsing, blocked cookies). */
	}
}
