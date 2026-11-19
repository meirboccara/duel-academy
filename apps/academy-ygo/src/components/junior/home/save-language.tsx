"use client";

import { Languages } from "lucide-react";
import { useId } from "react";
import type { HomeCopy } from "@/lib/junior/home/copy";
import { LANGUAGE_NAMES, LOCALES, isLocale, type Locale } from "@/lib/i18n/locales";

const SITE = "site";

/**
 * A save's own language: "the site's" (whatever the site is shown in), or one of the site's languages, each named
 * in itself so a child who cannot read the current one still finds theirs. Used in the save's settings on the title
 * screen and in the game's pause menu.
 */
export function SaveLanguage({ value, onChange, copy }: { value: Locale | null; onChange: (next: Locale | null) => void; copy: HomeCopy }) {
	const id = useId();
	return (
		<div className="flex flex-wrap items-center gap-2">
			<label htmlFor={id} className="inline-flex items-center gap-2 font-semibold text-fg">
				<Languages className="h-5 w-5 text-gold-400" aria-hidden />
				{copy.language}
			</label>
			<select id={id} value={value ?? SITE} onChange={(event) => onChange(isLocale(event.target.value) ? event.target.value : null)} className="min-h-11 rounded-xl border-2 border-white/25 bg-surface px-3 text-fg focus-visible:outline-2 focus-visible:outline-gold-400">
				<option value={SITE}>{copy.siteLanguage}</option>
				{LOCALES.map((language) => (
					<option key={language} value={language} lang={language}>
						{LANGUAGE_NAMES[language]}
					</option>
				))}
			</select>
		</div>
	);
}
