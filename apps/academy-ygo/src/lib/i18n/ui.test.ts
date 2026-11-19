import { describe, expect, it } from "vitest";
import { uiDictionary } from "@/lib/i18n/ui";

describe("uiDictionary", () => {
	it("returns the string as-is for English", () => {
		expect(uiDictionary("en", "Language")).toBe("Language");
	});

	it("translates control labels into French and Hebrew", () => {
		expect(uiDictionary("fr", "Language")).toBe("Langue");
		expect(uiDictionary("he", "Language")).toBe("שפה");
	});

	it("returns undefined for strings it does not know, so callers can fall back", () => {
		expect(uiDictionary("fr", "No such label")).toBeUndefined();
	});
});
