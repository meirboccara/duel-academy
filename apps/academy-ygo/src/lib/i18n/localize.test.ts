import { describe, expect, it } from "vitest";
import { localizeData } from "@/lib/i18n/localize";

const fr = { "Welcome": "Bienvenue", "Two duelists": "Deux duellistes", normal: "NE PAS TRADUIRE", welcome: "NE PAS TRADUIRE" };

describe("localizeData", () => {
	it("translates reader-facing strings at any depth", () => {
		const out = localizeData({ title: "Welcome", slides: [{ chips: [{ label: "Two duelists" }] }] }, fr);
		expect(out).toEqual({ title: "Bienvenue", slides: [{ chips: [{ label: "Deux duellistes" }] }] });
	});

	it("keeps untranslated strings in English", () => {
		expect(localizeData({ title: "Unknown text" }, fr)).toEqual({ title: "Unknown text" });
	});

	it("never rewrites identifiers or enum values, even if a translation key matches", () => {
		const data = { id: "welcome", chapterId: "welcome", kind: "normal", type: "normal", url: "Welcome", title: "Welcome" };
		expect(localizeData(data, fr)).toEqual({ ...data, title: "Bienvenue" });
	});

	it("leaves the input untouched and returns it as-is without a dictionary", () => {
		const data = { title: "Welcome" };
		expect(localizeData(data, undefined)).toBe(data);
		localizeData(data, fr);
		expect(data.title).toBe("Welcome");
	});
});
