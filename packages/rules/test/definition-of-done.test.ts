import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_SOURCES, coverage, RULE_SOURCES, type TestFile } from "../src";

/**
 * Card tests live in test/cards and rule tests in test/rules. Each cites its sources in its title: cites(card, source)
 * for a card, cites("rules", id) for a rule of the registry (src/rule-sources.ts).
 */
function testFiles(folder: string): TestFile[] {
	let names: string[];
	try {
		names = readdirSync(join(__dirname, folder), { recursive: true, encoding: "utf8" }).filter((name) => name.endsWith(".test.ts"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
	return names.map((name) => ({ path: `test/${folder}/${name.replaceAll("\\", "/")}`, text: readFileSync(join(__dirname, folder, name), "utf8") }));
}

describe("the definition of done, over every card the rules core plays and every rule it cites", () => {
	it("has at least one card and one rule", () => {
		expect(CARD_SOURCES.length).toBeGreaterThan(0);
		expect(RULE_SOURCES.length).toBeGreaterThan(0);
	});
	it("leaves no gap: every effect, listed ruling and rule tested, every source well formed, French text present", () => {
		expect(coverage(CARD_SOURCES, [...testFiles("cards"), ...testFiles("rules")], RULE_SOURCES).gaps).toEqual([]);
	});
	it("gives each card its own code and Konami card id", () => {
		expect(new Set(CARD_SOURCES.map((card) => card.code)).size).toBe(CARD_SOURCES.length);
		expect(new Set(CARD_SOURCES.map((card) => card.cid)).size).toBe(CARD_SOURCES.length);
	});
});
