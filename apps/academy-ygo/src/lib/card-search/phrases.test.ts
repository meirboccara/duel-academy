import { describe, expect, it } from "vitest";
import { checkExplanation, expandPhrases } from "./phrases";

describe("shared phrases in explanations for children", () => {
	it("writes the same answer sentence on every card, in the reader's language", () => {
		expect(expandPhrases("Pick one monster. {answer}", "en")).toBe(
			"Pick one monster. Your friend can still answer with a card first, and the last card played happens first.",
		);
		expect(expandPhrases("Choisis un monstre. {answer}", "fr")).toBe(
			"Choisis un monstre. Ton adversaire peut encore répondre avec une carte avant, et la dernière carte jouée passe en premier.",
		);
		expect(expandPhrases("בחרו מפלצת. {answer}", "he")).toBe("בחרו מפלצת. היריב עוד יכול לענות קודם עם קלף, והקלף האחרון ששוחק קורה ראשון.");
	});

	it("expands every shared phrase in a text", () => {
		expect(expandPhrases("First you must throw away 1 card from your hand. {cost} {if-gone}", "en")).toBe(
			"First you must throw away 1 card from your hand. This happens even if your friend stops the card afterwards. If the card you picked is gone by then, nothing happens to it.",
		);
	});

	it("refuses a token that is not a shared phrase", () => {
		expect(checkExplanation("Pick one card. {answr}", "en")).toEqual(["unknown shared phrase {answr}"]);
	});

	it("refuses a shared sentence written by hand, so every card says it the same way", () => {
		expect(checkExplanation("Choisis un monstre. Ton adversaire peut encore répondre avec une carte avant ; ensuite il est détruit.", "fr")).toEqual([
			"write {answer} instead of saying it in your own words",
		]);
		expect(checkExplanation("Throw away 1 card. It stays there, even if your friend stops this Spell.", "en")).toEqual([
			"write {cost} instead of saying it in your own words",
		]);
		expect(checkExplanation("בחרו קלף. אם הוא עדיין שם, הוא מושמד.", "he")).toEqual(["write {if-gone} instead of saying it in your own words"]);
	});

	it("refuses game words a child does not know", () => {
		expect(checkExplanation("Target 1 Spell, then the chain resolves.", "en")).toEqual(["game words to explain instead: Target, chain, resolves"]);
	});

	it("keeps game words out of the shared sentences too", () => {
		for (const locale of ["en", "fr", "he"] as const) {
			expect(checkExplanation("{answer} {cost} {if-gone} {set-trap} {quick-play}", locale)).toEqual([]);
		}
	});

	it("accepts the tokens themselves", () => {
		expect(checkExplanation("Pick one Spell or Trap card on the field. {answer} Then the card you picked is destroyed. {if-gone}", "en")).toEqual([]);
	});

	it("leaves a text without shared phrases as written", () => {
		expect(expandPhrases("Every face-up monster your friend has is destroyed.", "en")).toBe("Every face-up monster your friend has is destroyed.");
	});
});
