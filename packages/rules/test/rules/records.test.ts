import { describe, expect, it } from "vitest";
import { act, cardsIn, cites, legalActions } from "../../src";
import { codes, offered, play, position, recordCards } from "./fixtures";

/** Step 4: effect records played through `legalActions` and `act`: costs, targets and their dry runs. */
const options = { everyWindow: true };

describe("effect records: costs", () => {
	// Konami says nothing of an effect whose cost cannot be paid; that it is not offered follows from costs being paid at activation.
	it("offers an effect only when its cost can be paid (derived, no Konami sentence)", () => {
		const alone = position({ defs: recordCards(), options, you: { hand: ["pay-a-card"] } });
		expect(offered(alone)).toEqual(["pass", "set pay-a-card"]);
	});
	it(`${cites("rules", "costs-at-activation")} pays the cost at activation`, () => {
		const defs = recordCards();
		const start = position({ defs, options, you: { hand: ["pay-a-card", "monster"] } });
		expect(offered(start)).toContain("activate pay-a-card");
		const paid = play(start, "activate pay-a-card");
		expect(codes(paid, "you", "graveyard")).toEqual(["monster"]);
		expect(codes(paid, "you", "spell")).toEqual(["pay-a-card"]);
	});
	it("lists without paying: asking for the actions leaves the duel as it was", () => {
		const start = position({ defs: recordCards(), options, you: { hand: ["pay-a-card", "monster"] } });
		const before = JSON.stringify(start.piles);
		legalActions(start);
		expect(JSON.stringify(start.piles)).toBe(before);
		expect(codes(start, "you", "graveyard")).toEqual([]);
	});
});

describe("effect records: targets are read on the board the cost leaves", () => {
	it(`${cites("rules", "cost-then-target")} reads the targets after the cost is paid: an effect whose cost takes its only target is not offered`, () => {
		const defs = recordCards();
		const one = position({ defs, options, you: { hand: ["banish-then-aim"], graveyard: ["monster"] } });
		expect(offered(one)).toEqual(["pass", "set banish-then-aim"]);
		const two = position({ defs, options, you: { hand: ["banish-then-aim"], graveyard: ["monster", "monster-b"] } });
		// The cost banishes the first monster of the Graveyard; only the other one is left to target.
		const first = cardsIn(two, "you", "graveyard")[0]!.code;
		const second = first === "monster" ? "monster-b" : "monster";
		expect(offered(two)).toEqual(["activate banish-then-aim > " + second, "pass", "set banish-then-aim"]);
		const done = play(two, "activate banish-then-aim > " + second);
		expect(codes(done, "you", "banished")).toEqual([first]);
		expect(done.chain[0]!.targets).toEqual([cardsIn(two, "you", "graveyard").find((card) => card.code === second)!.id]);
	});
	it(`${cites("rules", "cost-then-target")} reads the targets after the cost is paid: a cost can make the target`, () => {
		const start = position({ defs: recordCards(), options, you: { hand: ["mill-then-aim"], deck: ["monster"] } });
		expect(offered(start)).toEqual(["activate mill-then-aim > monster", "pass", "set mill-then-aim"]);
		const done = play(start, "activate mill-then-aim > monster");
		expect(codes(done, "you", "graveyard")).toEqual(["monster"]);
	});
	it("refuses a target that was only legal before the cost was paid", () => {
		const start = position({ defs: recordCards(), options, you: { hand: ["banish-then-aim"], graveyard: ["monster"] } });
		const monster = cardsIn(start, "you", "graveyard")[0]!;
		const spell = cardsIn(start, "you", "hand")[0]!;
		expect(() => act(start, { type: "activate", card: spell.id, effect: 0, targets: [monster.id] })).toThrow(/not a legal action/);
	});
});

describe("effect records: choices made while an effect resolves", () => {
	const deck = ["monster", "monster-b"];
	const chosen = (duel: Parameters<typeof offered>[0]) => offered(duel);
	it(`${cites("rules", "choice-at-resolution")} waits for the player's choice of card when the effect resolves, and nothing else is offered`, () => {
		const log: string[] = [];
		const start = position({ defs: recordCards(log), options, you: { hand: ["pick-from-deck"], deck } });
		const asked = play(start, "activate pick-from-deck", "pass", "pass");
		expect(chosen(asked)).toEqual(["choose monster", "choose monster-b"]);
		expect(log).toEqual([]);
		expect(asked.chain).toHaveLength(1);
		const done = play(asked, "choose monster-b");
		expect(log).toEqual(["pick-from-deck adds monster-b"]);
		expect(codes(done, "you", "hand")).toEqual(["monster-b"]);
		expect(codes(done, "you", "graveyard")).toEqual(["pick-from-deck"]);
		expect(done.chain).toEqual([]);
		expect(done.priority).toMatchObject({ holder: "you", open: false });
	});
	// A choice of the core: with one candidate there is nothing to choose.
	it("takes the only candidate without asking", () => {
		const log: string[] = [];
		const start = position({ defs: recordCards(log), options, you: { hand: ["pick-from-deck"], deck: ["monster"] } });
		const done = play(start, "activate pick-from-deck", "pass", "pass");
		expect(log).toEqual(["pick-from-deck adds monster"]);
		expect(codes(done, "you", "hand")).toEqual(["monster"]);
	});
	it(`${cites("rules", "choice-at-resolution")} reads the candidates when the link resolves, not when it was activated`, () => {
		const start = position({ defs: recordCards(), options, you: { hand: ["pick-quick", "mill-top"], deck } });
		// Link 1 could take either monster; link 2 sends the top card of the Deck to the Graveyard first.
		const top = cardsIn(start, "you", "deck")[0]!.code;
		const left = top === "monster" ? "monster-b" : "monster";
		const done = play(start, "activate pick-quick", "pass", "activate mill-top", "pass", "pass");
		expect(codes(done, "you", "hand")).toEqual([left]);
		expect(codes(done, "you", "graveyard")).toEqual(expect.arrayContaining([top]));
	});
	it(`${cites("rules", "chain-resolves-backwards")} goes on resolving the links below once the choice is made`, () => {
		const log: string[] = [];
		const start = position({ defs: recordCards(log), options, you: { hand: ["log-quick", "pick-quick"], deck } });
		const asked = play(start, "activate log-quick", "pass", "activate pick-quick", "pass", "pass");
		expect(chosen(asked)).toEqual(["choose monster", "choose monster-b"]);
		expect(asked.chain).toHaveLength(2);
		const done = play(asked, "choose monster");
		expect(log).toEqual(["pick-quick adds monster", "log-quick"]);
		expect(done.chain).toEqual([]);
	});
	it("leaves the duel it was given untouched: the same question can be answered both ways", () => {
		const asked = play(position({ defs: recordCards(), options, you: { hand: ["pick-from-deck"], deck } }), "activate pick-from-deck", "pass", "pass");
		const a = play(asked, "choose monster");
		const b = play(asked, "choose monster-b");
		expect(codes(a, "you", "hand")).toEqual(["monster"]);
		expect(codes(b, "you", "hand")).toEqual(["monster-b"]);
		expect(asked.asking).not.toBeNull();
		expect(chosen(asked)).toEqual(["choose monster", "choose monster-b"]);
	});
	it("resolves the same with or without the teaching option that shows every window", () => {
		const run = (everyWindow: boolean) => {
			const start = position({ defs: recordCards(), options: { everyWindow }, you: { hand: ["pick-from-deck"], deck } });
			const asked = play(start, "activate pick-from-deck", ...(everyWindow ? ["pass", "pass"] : []));
			return codes(play(asked, "choose monster-b"), "you", "hand");
		};
		expect(run(true)).toEqual(run(false));
	});
	it("refuses a card that was not offered, and a pass while a choice is waiting", () => {
		const asked = play(position({ defs: recordCards(), options, you: { hand: ["pick-from-deck"], deck } }), "activate pick-from-deck", "pass", "pass");
		const spell = cardsIn(asked, "you", "spell").length;
		expect(() => act(asked, { type: "pass" })).toThrow(/not a legal action/);
		expect(() => act(asked, { type: "choose", card: asked.piles.you.hand[0] ?? 9999 })).toThrow(/not a legal action/);
		expect(spell).toBe(1);
	});
});

describe("effect records: categories are frozen on the link", () => {
	// The core reads a function of categories after the cost is paid (a choice; no Konami sentence).
	it("reads what the effect would do on the board its cost left", () => {
		const defs = recordCards();
		const two = play(position({ defs, options, you: { hand: ["mill-then-search"], deck: ["monster", "monster-b"] } }), "activate mill-then-search");
		expect(two.chain[0]!.categories).toEqual(["search"]);
		// With one monster in the Deck the cost takes it, and the effect would search nothing.
		const one = play(position({ defs, options, you: { hand: ["mill-then-search"], deck: ["monster"] } }), "activate mill-then-search");
		expect(one.chain[0]!.categories).toEqual([]);
	});
	it(`${cites("rules", "frozen-categories")} keeps them as declared when the board changes before the chain resolves`, () => {
		const start = position({ defs: recordCards(), options, you: { hand: ["reckless-search", "deck-sweeper"], deck: ["monster"] }, rival: { hand: ["search-negator"] } });
		const searched = play(start, "activate reckless-search");
		expect(offered(searched)).toEqual(["activate search-negator", "pass"]);
		const swept = play(searched, "pass", "activate deck-sweeper");
		// Nothing is left in the Deck to search, but link 1 still says what it declared.
		expect(codes(swept, "you", "deck")).toEqual([]);
		expect(swept.chain.map((link) => link.categories)).toEqual([["search"], []]);
	});
});
