import { describe, expect, it } from "vitest";
import { CARD_DEFS, cites } from "../../src";
import { negationCards } from "../rules/negation-fixtures";
import { codes, offered, play, position } from "../rules/fixtures";

const card = "solemn-judgment";

describe("Solemn Judgment, written as an effect record", () => {
	it(`${cites("solemn-judgment", "text")} negates a Summon: half the LP is paid, the monster is destroyed and never Summoned, and nothing triggers`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["normal-4"] }, rival: { set: [card], monsters: ["summon-watcher"] } });
		expect(start.lp).toEqual({ you: 8000, rival: 8000 });
		const summoned = play(start, "summon normal-4");
		expect(offered(summoned)).toEqual([`activate ${card}`, "pass"]);
		const done = play(summoned, `activate ${card}`);
		expect(done.lp).toEqual({ you: 8000, rival: 4000 });
		expect(codes(done, "you", "graveyard")).toEqual(["normal-4"]);
		expect(codes(done, "you", "monster")).toEqual([]);
		expect(codes(done, "rival", "graveyard")).toEqual([card]);
		// The Summon never succeeded: no "when Summoned" trigger, and the Normal Summon of the turn is spent.
		expect(log).toEqual([]);
		expect(done.summoning).toBeNull();
		expect(offered(done)).toEqual(["pass"]);
	});
	it(`${cites("rules", "negate-summon-cannot-be-negated")} is not offered against a Summon that cannot be negated`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, options: { everyWindow: true }, you: { hand: ["unstoppable"] }, rival: { set: [card] } });
		const summoned = play(start, "summon unstoppable");
		// You pass first (box B), then the rival is asked (box C).
		const asked = play(summoned, "pass");
		expect(asked.priority.holder).toBe("rival");
		expect(offered(asked)).toEqual(["pass"]);
		const done = play(asked, "pass");
		expect(codes(done, "you", "monster")).toEqual(["unstoppable"]);
	});
	it(`${cites("solemn-judgment", "text")} negates the activation of a Spell Card and destroys it: the card is in the Graveyard, "not from the field", and its effect is not applied`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["plain-spell"] }, rival: { set: [card], monsters: ["field-watcher"] } });
		const done = play(start, "activate plain-spell", `activate ${card}`);
		expect(done.lp.rival).toBe(4000);
		expect(codes(done, "you", "graveyard")).toEqual(["plain-spell"]);
		expect(codes(done, "rival", "graveyard")).toEqual([card]);
		// The Spell was destroyed by the negation, not on the field: its effect did nothing and "sent from the field" triggers do not see it.
		expect(log).toEqual([]);
		expect(done.chain).toEqual([]);
	});
	it(`${cites("rules", "solemn-judgment-notes")} ${cites("rules", "activation-of-card-vs-effect")} answers the activation of a Spell or Trap Card, not a monster's effect or the effect of a Spell on the field`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const options = { everyWindow: true };
		const monster = play(position({ defs, options, you: { monsters: ["ignition"] }, rival: { set: [card] } }), "activate ignition");
		expect(offered(monster)).toEqual(["pass"]);
		const spell = play(position({ defs, options, you: { faceupSpells: ["lamp"] }, rival: { set: [card] } }), "activate lamp");
		expect(offered(spell)).toEqual(["pass"]);
	});
	it(`${cites("rules", "cost-not-chainable")} a Summon is not an activation: a card that negates an activation is not offered against it`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const start = position({ defs, options: { everyWindow: true }, you: { hand: ["normal-4"] }, rival: { set: ["jammer", card] } });
		const asked = play(start, "summon normal-4", "pass");
		expect(offered(asked)).toEqual([`activate ${card}`, "pass"]);
	});
	// The Summon going through once the chain has resolved rests on YGOProJudge's lead (the window ends with the first chain started
	// in it), as in summon.test.ts; no Konami page found.
	it(`${cites("solemn-judgment", "text")} its own activation can be negated by another Counter Trap: the Summon goes through and the LP stays paid`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["normal-4"], set: ["jammer"] }, rival: { set: [card] } });
		const done = play(start, "summon normal-4", `activate ${card}`, "activate jammer");
		expect(log).toEqual(["destroyed", "jammer"]);
		expect(codes(done, "you", "monster")).toEqual(["normal-4"]);
		expect(done.lp.rival).toBe(4000);
		expect(codes(done, "rival", "graveyard")).toEqual([card]);
		expect(done.summoning).toBeNull();
	});
	it(`${cites("rules", "negated-summon-not-from-field")} the monster whose Summon was negated is destroyed but not sent from the field`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["normal-4"] }, rival: { set: [card], monsters: ["monster-watcher"] } });
		const done = play(start, "summon normal-4", `activate ${card}`);
		expect(codes(done, "you", "graveyard")).toEqual(["normal-4"]);
		expect(log).toEqual([]);
	});
	it(`${cites("rules", "negate-summon-built-in-only")} a Summon performed by an effect is not the Summon that is negated: no window opens for it`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const start = position({ defs, options: { everyWindow: true }, you: { hand: ["summon-spell", "normal-4"] }, rival: { set: [card] } });
		const asked = play(start, "activate summon-spell");
		// Solemn Judgment may answer the Spell Card's activation, but not the Summon it will perform.
		expect(offered(asked)).toEqual([`activate ${card}`, "pass"]);
		const done = play(asked, "pass", "pass");
		expect(codes(done, "you", "monster")).toEqual(["normal-4"]);
		expect(done.summoning).toBeNull();
		expect(offered(done)).not.toContain(`activate ${card}`);
	});
});
