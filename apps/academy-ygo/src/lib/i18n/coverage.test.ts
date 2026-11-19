import { describe, expect, it } from "vitest";
import { chapters } from "@/content/chapters";
import { TEXT_FIELDS } from "@/lib/i18n/localize";
import { UI_FR } from "@/lib/i18n/ui-fr";
import { UI_HE } from "@/lib/i18n/ui-he";
import fr from "@/lib/i18n/fr-content.json";
import he from "@/lib/i18n/he-content.json";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractTranslatedLiterals } from "@/lib/i18n/extract-ui-strings";

/** Every reader-facing string localizeData would look up, collected from the real curriculum. */
function collectText(value: unknown, field = "", out = new Set<string>()): Set<string> {
	if (typeof value === "string") {
		if ((TEXT_FIELDS.has(field) || field === "headings") && value.trim()) out.add(value);
	} else if (Array.isArray(value)) value.forEach((item) => collectText(item, field, out));
	else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) collectText(item, key, out);
	return out;
}

const english = collectText(chapters);

function sourceFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.tsx$/.test(entry.name) && !entry.name.endsWith(".test.tsx") ? [path] : [];
	});
}

/** Literal `t("...")` strings, read from the components so a new one cannot be forgotten. */
const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const interfaceLiterals = new Set(sourceFiles(sourceRoot).flatMap((file) => extractTranslatedLiterals(readFileSync(file, "utf8"))));

/**
 * Strings that reach `t()` through a lookup table or a prop, so no literal call exists to read:
 * zone, summon-method, card-kind, subtype, attribute and card-part labels, the default phase names, and the
 * lesson page's next-lesson label. Add to this list when a new table value is shown through `t()`.
 */
const DYNAMIC_INTERFACE_STRINGS = [
	"Monster 1", "Monster 2", "Monster 3", "Monster 4", "Monster 5", "S/T 1", "S/T 2", "S/T 3", "S/T 4", "S/T 5",
	"Field", "Deck", "Extra Monster",
	"Fusion Summon", "Synchro Summon", "Xyz Summon", "Link Summon", "Ritual Summon", "Pendulum Summon", "Summon",
	"normal monster", "effect monster", "fusion monster", "synchro monster", "xyz monster", "link monster", "ritual monster", "spell monster", "trap monster", "token monster",
	"Ritual", "Quick-Play", "Continuous", "Equip", "Counter",
	"DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE",
	"frame", "name", "attribute", "level", "art", "type", "effect", "atk", "def", "scale", "arrows", "icon",
	"Draw", "Standby", "Main 1", "Battle", "Main 2", "End",
	"Next lesson",
];
const interfaceStrings = [...new Set([...interfaceLiterals, ...DYNAMIC_INTERFACE_STRINGS])];
// Card names, numbers and notation that read the same in every language.
const SAME_IN_ALL_LANGUAGES = /^[\d\s+\-–—/:.,×x%()↔→←↑↓·]*$/;

describe.each([
	["French", fr as Record<string, string>, UI_FR],
	["Hebrew", he as Record<string, string>, UI_HE],
])("%s coverage", (_name, content, ui) => {
	it("translates every lesson string (or deliberately keeps it)", () => {
		const missing = [...english].filter((s) => !(s in content) && !SAME_IN_ALL_LANGUAGES.test(s));
		expect(missing.slice(0, 15), `${missing.length} untranslated strings`).toEqual([]);
	});

	it("never leaves a translation empty", () => {
		expect(Object.entries(content).filter(([, v]) => typeof v !== "string" || !v.trim()).map(([k]) => k)).toEqual([]);
	});

	it("translates every interface string used by the components", () => {
		const missing = interfaceStrings.filter((s) => !(s in ui));
		expect(missing).toEqual([]);
	});
});
