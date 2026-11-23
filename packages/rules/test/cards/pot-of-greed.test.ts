import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const options = { everyWindow: true };

describe("Pot of Greed, written as an effect record", () => {
	it(`${cites("pot-of-greed", "text")} draws 2 cards when it resolves, and declares that it draws`, () => {
		const start = position({ defs, options, you: { hand: ["pot-of-greed"], deck: ["umi", "other-field", "celtic-guardian"] } });
		const activated = play(start, "activate pot-of-greed");
		expect(activated.chain[0]!.categories).toEqual(["draw"]);
		const done = play(activated, "pass", "pass");
		expect(codes(done, "you", "hand")).toEqual(start.piles.you.deck.slice(0, 2).map((id) => start.cards[id]!.code));
		expect(codes(done, "you", "deck")).toHaveLength(1);
		expect(codes(done, "you", "graveyard")).toEqual(["pot-of-greed"]);
	});
	// Kept from Academy's old engine: no Konami page about drawing from a Deck of fewer than 2 cards was read.
	it("is not offered with fewer than 2 cards in the Deck (kept from the old engine, no Konami record)", () => {
		expect(offered(position({ defs, options, you: { hand: ["pot-of-greed"], deck: ["umi"] } }))).toEqual(["pass", "set pot-of-greed"]);
	});
});
