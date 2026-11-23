import { describe, expect, it } from "vitest";
import { cardPictureUrl, cardRulingsUrl, displayName, parsePasscode } from "./links";

describe("card search links", () => {
	it("loads pictures through ygoprojudge.com, never straight from YGOPRODeck", () => {
		const url = cardPictureUrl(5318639);
		expect(url).toBe("https://ygoprojudge.com/_next/image?url=https%3A%2F%2Fimages.ygoprodeck.com%2Fimages%2Fcards%2F5318639.jpg&w=256&q=75");
		expect(url.startsWith("https://ygoprojudge.com/")).toBe(true);
	});

	it("links each card to its YGOProJudge page by passcode", () => {
		expect(cardRulingsUrl(5318639)).toBe("https://ygoprojudge.com/cards/5318639");
	});

	it("only accepts a whole positive passcode from the address bar", () => {
		expect(parsePasscode("5318639")).toBe(5318639);
		expect(parsePasscode("0")).toBeNull();
		expect(parsePasscode("53x")).toBeNull();
		expect(parsePasscode("-1")).toBeNull();
	});

	it("shows French readers the French name printed on their card", () => {
		const card = { name: "Book of Moon", nameFr: "Le Livre de la Lune" };
		expect(displayName(card, "fr")).toBe("Le Livre de la Lune");
		expect(displayName(card, "he")).toBe("Book of Moon");
		expect(displayName({ name: "Book of Moon", nameFr: null }, "fr")).toBe("Book of Moon");
	});
});
