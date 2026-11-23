import { describe, expect, it } from "vitest";
import { jargonIn } from "./jargon";

describe("game words in explanations for children", () => {
	it("finds the words a child would not know", () => {
		expect(jargonIn("Target 1 Spell, then wait for the chain.", "en")).toEqual(["Target", "chain"]);
		expect(jargonIn("Ciblez 1 Magie ; payez le coût.", "fr")).toEqual(["Ciblez", "coût"]);
		expect(jargonIn("בחרו מטרה אחת", "he")).toEqual(["מטרה"]);
	});

	it("finds every form of the word, accented ones included", () => {
		expect(jargonIn("Before activating it, pick one.", "en")).toEqual(["activating"]);
		expect(jargonIn("Le monstre ciblé est détruit, et la carte activée reste.", "fr")).toEqual(["ciblé", "activée"]);
		expect(jargonIn("אפשר להפעיל אותו", "he")).toEqual(["הפעיל"]);
	});

	it("does not mistake longer everyday words for game words", () => {
		expect(jargonIn("A costume and a chainsaw-free story.", "en")).toEqual([]);
		expect(jargonIn("Il porte un costume.", "fr")).toEqual([]);
	});

	it("accepts the plain-words version", () => {
		const mst = "Pick one Spell or Trap card on the field. Your opponent can still play a card to answer. When it's this card's turn, the card you picked is destroyed, if it's still there.";
		expect(jargonIn(mst, "en")).toEqual([]);
	});
});
