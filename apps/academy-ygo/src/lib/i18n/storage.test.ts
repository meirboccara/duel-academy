import { describe, expect, it } from "vitest";
import { readSavedLocale, saveLocale } from "@/lib/i18n/storage";

function fakeStorage(initial: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> & { data: Record<string, string> } {
	const data = { ...initial };
	return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

describe("language persistence", () => {
	it("remembers the chosen language", () => {
		const storage = fakeStorage();
		saveLocale(storage, "he");
		expect(readSavedLocale(storage)).toBe("he");
	});

	it("returns null when nothing valid is saved", () => {
		expect(readSavedLocale(fakeStorage())).toBeNull();
		expect(readSavedLocale(fakeStorage({ "duel-academy-language": "de" }))).toBeNull();
	});

	it("survives storage that throws (private browsing)", () => {
		const broken = {
			getItem: () => { throw new Error("blocked"); },
			setItem: () => { throw new Error("blocked"); },
		};
		expect(readSavedLocale(broken)).toBeNull();
		expect(() => saveLocale(broken, "fr")).not.toThrow();
	});

	it("tolerates missing storage", () => {
		expect(readSavedLocale(undefined)).toBeNull();
		expect(() => saveLocale(undefined, "fr")).not.toThrow();
	});
});
