import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_SOURCES, coverage, type TestFile } from "../src";

/** Card tests live in test/cards; each cites its sources with cites(card, source) in its title. */
const CARD_TESTS = join(__dirname, "cards");

function cardTestFiles(): TestFile[] {
	let names: string[];
	try {
		names = readdirSync(CARD_TESTS, { recursive: true, encoding: "utf8" }).filter((name) => name.endsWith(".test.ts"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
	return names.map((name) => ({ path: `test/cards/${name.replaceAll("\\", "/")}`, text: readFileSync(join(CARD_TESTS, name), "utf8") }));
}

describe("the definition of done, over every card the rules core plays", () => {
	it("has at least one card", () => {
		expect(CARD_SOURCES.length).toBeGreaterThan(0);
	});
	it("leaves no gap: every effect and listed ruling tested, every source well formed, French text present", () => {
		expect(coverage(CARD_SOURCES, cardTestFiles()).gaps).toEqual([]);
	});
	it("gives each card its own code and Konami card id", () => {
		expect(new Set(CARD_SOURCES.map((card) => card.code)).size).toBe(CARD_SOURCES.length);
		expect(new Set(CARD_SOURCES.map((card) => card.cid)).size).toBe(CARD_SOURCES.length);
	});
});
