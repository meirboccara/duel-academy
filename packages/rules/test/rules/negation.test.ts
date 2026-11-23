import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { negationCards } from "./negation-fixtures";
import { codes, offered, play, position } from "./fixtures";

/**
 * Step 5: negation, as a player sees it through `legalActions` and `act`. Rule tests cite a record of
 * src/rule-sources.ts; card tests cite the card's CardSources.
 */
describe("a negation that does not take", () => {
	it(`${cites("rules", "cannot-negate-activation-read-when-negator-resolves")} a negation of the activation is read against "cannot be negated" when the negating effect resolves: it does nothing while the condition holds, and "if you do" does not happen`, () => {
		const log: string[] = [];
		const defs = negationCards(log);
		const held = position({ defs, you: { hand: ["conditional-activation"], monsters: ["monster"] }, rival: { set: ["jammer"] } });
		const done = play(held, "activate conditional-activation", "activate jammer", "pass", "pass");
		expect(log).toEqual(["jammer", "conditional-activation"]);
		expect(codes(done, "you", "graveyard")).toEqual(["conditional-activation"]);
		log.length = 0;
		// The monster is gone by the time the negating effect resolves: the activation is negated.
		const gone = position({ defs, you: { hand: ["conditional-activation"], monsters: ["monster"], set: ["purge"] }, rival: { set: ["jammer"] } });
		play(gone, "activate conditional-activation", "activate jammer", "activate purge", "pass", "pass");
		expect(log).toEqual(["purge", "destroyed", "jammer"]);
	});
	// A boolean flag is the shorthand for a condition that always holds. No Konami page found for an unconditional one (the
	// only printed ones read are conditional, or Obelisk's Summon), so this test cites none.
	it("an activation flagged as never negatable is not negated either", () => {
		const log: string[] = [];
		const start = position({ defs: negationCards(log), you: { hand: ["sturdy"] }, rival: { set: ["jammer"] } });
		play(start, "activate sturdy", "activate jammer", "pass", "pass");
		expect(log).toEqual(["jammer", "sturdy"]);
	});
	it(`${cites("rules", "cannot-negate-effect-read-when-negator-resolves")} a negation of the effect is read against "cannot be negated" when the negating effect resolves, not at activation`, () => {
		const log: string[] = [];
		const defs = negationCards(log);
		const held = position({ defs, you: { hand: ["conditional"], monsters: ["monster"] }, rival: { set: ["effect-jammer"] } });
		play(held, "activate conditional", "activate effect-jammer", "pass", "pass");
		expect(log).toEqual(["effect-jammer", "conditional"]);
		log.length = 0;
		// The same, but the monster is gone by the time the negating effect resolves: the effect is negated.
		const gone = position({ defs, you: { hand: ["conditional"], monsters: ["monster"], set: ["purge"] }, rival: { set: ["effect-jammer"] } });
		const done = play(gone, "activate conditional", "activate effect-jammer", "activate purge", "pass", "pass");
		expect(log).toEqual(["purge", "effect-jammer"]);
		expect(codes(done, "you", "monster")).toEqual([]);
	});
	it(`${cites("rules", "effect-immunity-not-activation-immunity")} an effect that cannot be negated can still have its activation negated`, () => {
		const log: string[] = [];
		const start = position({ defs: negationCards(log), you: { hand: ["sturdy-effect"] }, rival: { set: ["jammer"] } });
		play(start, "activate sturdy-effect", "activate jammer", "pass", "pass");
		expect(log).toEqual(["destroyed", "jammer"]);
	});
});

describe("what a negated activation leaves", () => {
	it(`${cites("rules", "negated-card-not-from-field")} a Spell Card whose activation is negated reaches the Graveyard without being sent from the field; one whose effect is negated is`, () => {
		const log: string[] = [];
		const defs = negationCards(log);
		const sides = { you: { hand: ["plain-spell"] }, rival: { set: ["jammer", "effect-jammer"], monsters: ["field-watcher"] } };
		const activation = play(position({ defs, ...sides }), "activate plain-spell", "activate jammer", "pass", "pass");
		expect(codes(activation, "you", "graveyard")).toEqual(["plain-spell"]);
		expect(log).toEqual(["destroyed", "jammer"]);
		log.length = 0;
		const effect = play(position({ defs, ...sides }), "activate plain-spell", "activate effect-jammer", "pass", "pass");
		expect(codes(effect, "you", "graveyard")).toEqual(["plain-spell"]);
		// The Spell Card was on the field when it was sent: the watcher's trigger goes on a chain and resolves.
		expect(log).toEqual(["effect-jammer", "field-watcher"]);
	});
	it(`${cites("rules", "negated-activation-cost-stays")} the cost of a negated activation stays paid`, () => {
		const log: string[] = [];
		const start = position({ defs: negationCards(log), you: { monsters: ["blazer", "blazer"] }, rival: { set: ["jammer"] } });
		const negated = play(start, "activate blazer", "activate jammer", "pass", "pass");
		expect(log).toEqual(["destroyed", "jammer"]);
		expect(codes(negated, "you", "banished")).toEqual(["blazer"]);
		// The other copy is not offered: the use stays spent (the core's reading, backed by YGOProJudge and not by a Konami record; no cite).
		expect(offered(negated)).toEqual(["change-position blazer", "pass"]);
	});
});
