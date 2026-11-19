"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { DEFAULT_LOCALE, LANGUAGE_NAMES, LOCALES, dirOf, isLocale, resolveLocale, type Locale } from "./locales";
import { localizeData, type Dictionary } from "./localize";
import { readSavedLocale, saveLocale } from "./storage";
import { uiDictionary } from "./ui";

const contentLoaders = {
	fr: () => import("./fr-content.json").then((m) => m.default as Dictionary),
	he: () => import("./he-content.json").then((m) => m.default as Dictionary),
};
interface LanguageContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	/**
	 * Shows the page in `locale` without making it the site's language (a Junior save played in its own language);
	 * null goes back to the site's language.
	 */
	playIn: (locale: Locale | null) => void;
	t: (english: string) => string;
	localize: <T>(data: T) => T;
	pending: boolean;
	error: boolean;
}
function safeStorage(): Storage | undefined {
	try { return window.localStorage; } catch { return undefined; }
}
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [locale, updateLocale] = useState<Locale>(DEFAULT_LOCALE);
	const [dictionary, setDictionary] = useState<Dictionary>();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	const request = useRef(0);
	const show = useCallback((next: Locale, keep: boolean) => {
		const id = ++request.current;
		setPending(true);
		setError(false);
		void (next === "en" ? Promise.resolve(undefined) : contentLoaders[next]()).then((content) => {
			if (id !== request.current) return;
			setDictionary(content);
			updateLocale(next);
			if (keep) saveLocale(safeStorage(), next);
		}).catch(() => {
			if (id === request.current) setError(true);
		}).finally(() => {
			if (id === request.current) setPending(false);
		});
	}, []);
	const setLocale = useCallback((next: Locale) => show(next, true), [show]);
	const playIn = useCallback((next: Locale | null) => show(next ?? resolveLocale(readSavedLocale(safeStorage()), navigator.languages), false), [show]);
	useEffect(() => {
		setLocale(resolveLocale(readSavedLocale(safeStorage()), navigator.languages));
	}, [setLocale]);
	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = dirOf(locale);
	}, [locale]);
	const value = useMemo<LanguageContextValue>(() => ({
		locale, setLocale, playIn, pending, error,
		t: (english) => uiDictionary(locale, english) ?? (dictionary && Object.hasOwn(dictionary, english) ? dictionary[english]! : english),
		localize: <T,>(data: T) => localizeData(data, dictionary),
	}), [locale, dictionary, setLocale, playIn, pending, error]);
	return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
	const context = useContext(LanguageContext);
	if (!context) throw new Error("useLanguage must be inside LanguageProvider");
	return context;
}
export function LanguageSwitcher() {
	const { locale, setLocale, t, pending, error } = useLanguage();
	return (
		<div className="flex flex-wrap items-center gap-2 text-sm text-fg">
			<label className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface px-3 py-2">
				<Languages className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
				<span className="sr-only">{t("Language")}</span>
				<select aria-label={t("Language")} aria-busy={pending} value={locale} onChange={(e) => { if (isLocale(e.target.value)) setLocale(e.target.value); }} className="max-w-28 bg-surface text-fg focus-visible:outline-2 focus-visible:outline-gold-400" dir="ltr">
					{LOCALES.map((language) => <option key={language} value={language} lang={language}>{LANGUAGE_NAMES[language]}</option>)}
				</select>
			</label>
			<span role="status" className="sr-only">{pending ? t("Loading language…") : ""}</span>
			{error && <span role="alert">{t("Could not load language. Please try again.")}</span>}
		</div>
	);
}
