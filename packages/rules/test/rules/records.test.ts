import { describe, expect, it } from "vitest";
import { act, cardsIn, cites, legalActions, moveCard } from "../../src";
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

describe("effect records: how many targets", () => {
	// Konami's UCT3 has a card that says "target 2 Level 2 monsters": how many a card targets is its text.
	// That a count is chosen among legal combinations, with the exact number needed, is the core's reading of those words.
	const graveyard = ["monster", "monster-b", "normal-4"];
	const defs = (log: string[] = []) => ({ ...recordCards(log), "normal-4": { code: "normal-4", kind: "monster" as const } });
	it(`${cites("rules", "target-count-from-text")} lists every pair for "target 2 monsters", and none with fewer than two`, () => {
		const start = position({ defs: defs(), options, you: { hand: ["aim-two"], graveyard } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["activate aim-two > monster > monster-b", "activate aim-two > monster > normal-4", "activate aim-two > monster-b > normal-4"].sort());
		expect(offered(position({ defs: defs(), options, you: { hand: ["aim-two"], graveyard: ["monster"] } }))).toEqual(["pass", "set aim-two"]);
	});
	// The core's own bookkeeping (each target's `moves` is frozen on the link); no Konami sentence.
	it("freezes each of the targets on the link", () => {
		const start = position({ defs: defs(), options, you: { hand: ["aim-two"], graveyard } });
		const pair = offered(start).find((label) => label.startsWith("activate aim-two"))!;
		const done = play(start, pair);
		expect(done.chain[0]!.targets).toHaveLength(2);
		expect(done.chain[0]!.targetMoves).toEqual(done.chain[0]!.targets.map((id) => done.cards[id]!.moves));
	});
	// The core's reading of "up to 2" (one card or both); the record only has the "target 2" wording.
	it('lists one card, or both, for "target up to 2"', () => {
		const start = position({ defs: defs(), options, you: { hand: ["aim-up-to-two"], graveyard: ["monster", "monster-b"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["activate aim-up-to-two > monster", "activate aim-up-to-two > monster > monster-b", "activate aim-up-to-two > monster-b"]);
	});
	// The core's reading of an effect that may be activated with no target; the record only has the "target 2" wording.
	it('can be activated with no target when none is needed ("you can target 1")', () => {
		const none = position({ defs: defs(), options, you: { hand: ["aim-optional"] } });
		expect(offered(none)).toEqual(["activate aim-optional", "pass", "set aim-optional"]);
		const some = position({ defs: defs(), options, you: { hand: ["aim-optional"], graveyard: ["monster"] } });
		expect(offered(some)).toEqual(["activate aim-optional", "activate aim-optional > monster", "pass", "set aim-optional"]);
	});
	it("never pairs a card with itself, even when the candidates repeat it", () => {
		const start = position({ defs: defs(), options, you: { hand: ["aim-two-repeated"], graveyard } });
		const labels = offered(start).filter((label) => label.startsWith("activate"));
		expect(labels).toHaveLength(3);
		for (const label of labels) {
			const [first, second] = label.split(" > ").slice(1);
			expect(first).not.toBe(second);
		}
		for (const action of legalActions(start)) expect(() => act(start, action)).not.toThrow();
	});
	it("throws a clear error for a record that counts targets and has nothing to target", () => {
		const start = position({ defs: defs(), options, you: { hand: ["count-without-target"] } });
		expect(() => legalActions(start)).toThrow(/targetCount/);
	});
	it("checks the combination again after the cost is paid", () => {
		// The cost banishes the first monster of the Graveyard: with 3 left 2, one pair; with 2 left 1, none.
		const three = position({ defs: defs(), options, you: { hand: ["banish-then-aim-two"], graveyard } });
		expect(offered(three).filter((label) => label.startsWith("activate"))).toHaveLength(1);
		expect(offered(position({ defs: defs(), options, you: { hand: ["banish-then-aim-two"], graveyard: ["monster", "monster-b"] } }))).toEqual(["pass", "set banish-then-aim-two"]);
		const spell = cardsIn(three, "you", "hand")[0]!;
		const all = cardsIn(three, "you", "graveyard").slice(1, 3).map((card) => card.id);
		expect(() => act(three, { type: "activate", card: spell.id, effect: 0, targets: all })).not.toThrow();
		const stale = cardsIn(three, "you", "graveyard")[0]!.id;
		expect(() => act(three, { type: "activate", card: spell.id, effect: 0, targets: [stale, all[1]!] })).toThrow(/not a legal action/);
	});
	it("resolves with the targets that are still the same cards", () => {
		const log: string[] = [];
		const start = position({ defs: defs(log), options, you: { hand: ["aim-two"], graveyard: ["monster", "monster-b"] } });
		const aimed = play(start, "activate aim-two > monster > monster-b");
		// One of the two targets leaves the Graveyard and comes back before the chain resolves: it is a new card.
		const id = aimed.chain[0]!.targets[0]!;
		const bounced = moveCard(moveCard(aimed, id, { zone: "hand" }), id, { zone: "graveyard" });
		play(bounced, "pass", "pass");
		expect(log).toEqual(["aim-two aims " + [bounced.cards[aimed.chain[0]!.targets[1]!]!.code].join(",")]);
	});
});

describe("effect records: a cost with a choice", () => {
	// Konami's UCT4 lists "pay, discard, Tribute, or destroy" in the activation text (before the semicolon) as a cost, paid at
	// activation. Which card is discarded is the player's choice then; that each way of paying is its own action is the core's reading.
	const defs = recordCards();
	it(`${cites("rules", "costs-at-activation")} lists one activation for each card that can be discarded, and pays the one chosen`, () => {
		const start = position({ defs, options, you: { hand: ["discard-one", "monster", "monster-b"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["activate discard-one ~ monster", "activate discard-one ~ monster-b"]);
		const done = play(start, "activate discard-one ~ monster-b");
		expect(codes(done, "you", "graveyard")).toEqual(["monster-b"]);
		expect(codes(done, "you", "hand")).toEqual(["monster"]);
	});
	it("is not offered when no way of paying exists", () => {
		expect(offered(position({ defs, options, you: { hand: ["discard-one"] } }))).toEqual(["pass", "set discard-one"]);
		expect(offered(position({ defs, options, you: { hand: ["tribute-one"] } }))).toEqual(["pass", "set tribute-one"]);
	});
	it(`${cites("rules", "cost-then-target")} combines each way of paying with the targets read after paying it`, () => {
		const start = position({ defs, options, you: { hand: ["discard-then-aim", "monster", "monster-b"], graveyard: ["normal-6"] } });
		const labels = offered({ ...start, defs: { ...defs, "normal-6": { code: "normal-6", kind: "monster" } } }).filter((label) => label.startsWith("activate"));
		// The card discarded is in the Graveyard when the target is chosen, so it may be the target.
		expect(labels).toEqual(["activate discard-then-aim ~ monster > monster", "activate discard-then-aim ~ monster > normal-6", "activate discard-then-aim ~ monster-b > monster-b", "activate discard-then-aim ~ monster-b > normal-6"]);
	});
	it("pays exactly the way that was listed: every listed action can be played, and an unlisted way is refused", () => {
		const start = position({ defs, options, you: { hand: ["discard-then-aim", "monster", "monster-b"], graveyard: ["monster"] } });
		for (const action of legalActions(start)) expect(() => act(start, action)).not.toThrow();
		const spell = cardsIn(start, "you", "hand").find((card) => card.code === "discard-then-aim")!;
		const asked = cardsIn(start, "you", "hand").find((card) => card.code === "monster")!;
		expect(() => act(start, { type: "activate", card: spell.id, effect: 0, paid: [spell.id], targets: [asked.id] })).toThrow(/not a legal action/);
		expect(() => act(start, { type: "activate", card: spell.id, effect: 0, targets: [asked.id] })).toThrow(/not a legal action/);
	});
	it("lets a Quick Effect with a cost of Tribute choose the monster", () => {
		const start = position({ defs, options, you: { hand: ["tribute-one"], monsters: ["monster", "monster-b"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["activate tribute-one ~ monster", "activate tribute-one ~ monster-b"]);
		expect(codes(play(start, "activate tribute-one ~ monster-b"), "you", "monster")).toEqual(["monster"]);
	});
});

describe("effect records: what a link answers", () => {
	it("records no answered link for trigger effects put on a chain at a trigger point: they answer nothing", async () => {
		const { triggerCards } = await import("./fixtures");
		const start = position({ defs: triggerCards(), options, you: { hand: ["sweep"], monsters: ["forced-a", "forced-b"] } });
		const swept = play(start, "activate sweep", "pass", "pass", "activate forced-a");
		expect(swept.chain.map((link) => link.card.code)).toEqual(["forced-a", "forced-b"]);
		expect(swept.chain.map((link) => link.answers)).toEqual([null, null]);
	});
});
