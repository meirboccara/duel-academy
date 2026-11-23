import { describe, expect, it } from "vitest";
import { checkExplanation, expandPhrases, PHRASES } from "./phrases";

describe("shared phrases in explanations for children", () => {
	it("writes the same answer sentence on every card, in the reader's language", () => {
		expect(expandPhrases("Pick one monster. {answer}", "en")).toBe(
			"Pick one monster. Your opponent can still answer with a card first, and the last card played happens first.",
		);
		expect(expandPhrases("Choisis un monstre. {answer}", "fr")).toBe(
			"Choisis un monstre. Ton adversaire peut encore répondre avec une carte avant, et la dernière carte jouée passe en premier.",
		);
		expect(expandPhrases("בחרו מפלצת. {answer}", "he")).toBe("בחרו מפלצת. היריב עוד יכול לענות קודם עם קלף, והקלף האחרון ששוחק קורה ראשון.");
	});

	it("expands every shared phrase in a text", () => {
		expect(expandPhrases("First you must throw away 1 card from your hand. {cost} {if-gone}", "en")).toBe(
			"First you must throw away 1 card from your hand. This happens even if your opponent stops the card afterwards. If the card you picked is gone by then, nothing happens to it.",
		);
	});

	it("refuses a token that is not a shared phrase", () => {
		expect(checkExplanation("Pick one card. {answr}", "en")).toEqual(["unknown shared phrase {answr}"]);
	});

	it("refuses a shared sentence written by hand, so every card says it the same way", () => {
		expect(checkExplanation("Choisis un monstre. Ton adversaire peut encore répondre avec une carte avant ; ensuite il est détruit.", "fr")).toEqual([
			"write {answer} instead of saying it in your own words",
		]);
		expect(checkExplanation("Throw away 1 card. It stays there, even if your opponent stops this Spell.", "en")).toEqual([
			"write {cost} instead of saying it in your own words",
		]);
		expect(checkExplanation("בחרו קלף. אם הוא עדיין שם, הוא מושמד.", "he")).toEqual(["write {if-gone} instead of saying it in your own words"]);
	});

	it("refuses game words a child does not know", () => {
		expect(checkExplanation("Target 1 Spell, then the chain resolves.", "en")).toEqual(["game words to explain instead: Target, chain, resolves"]);
	});

	it("calls the other player the opponent in English, as the cards do", () => {
		for (const [key, sentence] of Object.entries(PHRASES)) expect(sentence.en, key).not.toMatch(/\bfriend/i);
	});

	it("refuses an English explanation that calls the opponent a friend", () => {
		expect(checkExplanation("Destroy one of your friend's monsters.", "en")).toEqual(['say "opponent", not "friend"']);
		expect(checkExplanation("A friendly dragon flies to the field.", "en")).toEqual([]);
	});

	it("keeps game words out of every shared sentence", () => {
		const all = Object.keys(PHRASES).map((key) => `{${key}}`).join(" ");
		for (const locale of ["en", "fr", "he"] as const) expect(checkExplanation(all, locale)).toEqual([]);
	});

	it("explains how an effect works: when, if, once per turn, quick effects", () => {
		expect(expandPhrases("{when}", "en")).toBe("It only works if that was the very last thing that happened. If something else happened just after, the moment is lost.");
		expect(expandPhrases("{if}", "fr")).toBe("Ça marche quand même, même si d’autres choses se sont passées juste après.");
		expect(expandPhrases("{once-per-turn}", "en")).toBe(
			"You can use this once each turn. If this card leaves the field or is turned face-down and comes back, it is like a new card and can use it again this turn.",
		);
		expect(expandPhrases("{once-per-turn-name}", "fr")).toBe(
			"Tu ne peux t’en servir qu’une fois par tour, même avec plusieurs exemplaires de cette carte, et même si elle quitte le Terrain et revient.",
		);
		expect(expandPhrases("{quick-effect}", "he")).toBe("המפלצת הזו יכולה להשתמש בכוח שלה גם בתור של היריב, גם מיד אחרי שהוא שיחק קלף.");
	});

	it("explains the little words that join two parts: then, also, and if you do", () => {
		expect(expandPhrases("{then}", "en")).toBe("First the first part happens, then the second. If the first part doesn't happen, the second doesn't either.");
		expect(expandPhrases("{also}", "en")).toBe("Both parts happen at the same time, and each one happens even if the other can't.");
		expect(expandPhrases("{if-you-do}", "en")).toBe("Both parts happen at the same time, but the second part only happens if the first one did.");
	});

	it("explains what happens to a card: destroyed, banished, negated…", () => {
		expect(expandPhrases("{destroy}", "fr")).toBe("Détruite veut dire cassée : en général, la carte va au Cimetière.");
		expect(expandPhrases("{cannot-be-destroyed}", "en")).toBe("Breaking it doesn't work, but it can still be sent away in other ways, like being banished.");
		expect(expandPhrases("{banish}", "he")).toBe("גירוש פירושו שהקלף מונח בצד, לא בבית הקברות. יש קלפים שיכולים להחזיר אותו.");
		expect(expandPhrases("{return-to-hand}", "en")).toBe(
			"The card goes back to its owner's hand. A Fusion, Synchro, Xyz or Link monster goes back to the Extra Deck instead.",
		);
		expect(expandPhrases("{negate}", "en")).toBe("Negated means stopped: that card or effect does nothing, but a monster whose effects are negated can still attack.");
	});

	it("refuses the new shared ideas written by hand", () => {
		expect(checkExplanation("If it was the very last thing that happened, draw 1 card.", "en")).toEqual(["write {when} instead of saying it in your own words"]);
		expect(checkExplanation("Tu peux piocher une fois par tour.", "fr")).toEqual(["write {once-per-turn} instead of saying it in your own words"]);
		expect(checkExplanation("Draw 1 card, even if you don't want to.", "en")).toEqual(["write {mandatory} instead of saying it in your own words"]);
		expect(checkExplanation("Once per turn, even with several copies, draw 1 card.", "en")).toEqual(["write {once-per-turn-name} instead of saying it in your own words"]);
	});

	it("lets a card's own words say destroyed, banished or Special Summon", () => {
		expect(checkExplanation("The monster you picked is destroyed. {destroy}", "en")).toEqual([]);
		expect(checkExplanation("Ce monstre est banni. {banish}", "fr")).toEqual([]);
		expect(checkExplanation("Special Summon 1 monster from your Graveyard. {special-summon}", "en")).toEqual([]);
	});

	it("accepts the tokens themselves", () => {
		expect(checkExplanation("Pick one Spell or Trap card on the field. {answer} Then the card you picked is destroyed. {if-gone}", "en")).toEqual([]);
	});

	it("leaves a text without shared phrases as written", () => {
		expect(expandPhrases("Every face-up monster your opponent has is destroyed.", "en")).toBe("Every face-up monster your opponent has is destroyed.");
	});
});
