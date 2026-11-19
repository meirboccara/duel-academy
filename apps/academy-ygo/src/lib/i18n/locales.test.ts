import { describe, expect, it } from "vitest";
import { LOCALES, DEFAULT_LOCALE, dirOf, resolveLocale } from "@/lib/i18n/locales";

describe("locales", () => {
	it("offers English, French and Hebrew, English first", () => {
		expect(LOCALES).toEqual(["en", "fr", "he"]);
		expect(DEFAULT_LOCALE).toBe("en");
	});

	it("writes Hebrew right-to-left and the others left-to-right", () => {
		expect(dirOf("he")).toBe("rtl");
		expect(dirOf("fr")).toBe("ltr");
		expect(dirOf("en")).toBe("ltr");
	});

	it("prefers the saved choice over the browser language", () => {
		expect(resolveLocale("he", ["fr-FR"])).toBe("he");
	});

	it("ignores an unknown saved value and falls back to the browser language", () => {
		expect(resolveLocale("de", ["fr-CA", "en"])).toBe("fr");
		expect(resolveLocale(null, ["he-IL"])).toBe("he");
	});

	it("matches the first supported browser language, otherwise English", () => {
		expect(resolveLocale(null, ["de-DE", "fr", "he"])).toBe("fr");
		expect(resolveLocale(null, ["de-DE"])).toBe("en");
		expect(resolveLocale(null, [])).toBe("en");
	});

	it("accepts the legacy ISO code 'iw' for Hebrew", () => {
		expect(resolveLocale(null, ["iw"])).toBe("he");
	});
});
