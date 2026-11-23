import { describe, expect, it } from "vitest";
import { CARD_DEFS, cites } from "../../src";
import { negationCards } from "../rules/negation-fixtures";
import { codes, offered, play, position } from "../rules/fixtures";

const card = "solemn-strike";

describe("Solemn Strike, written as an effect record", () => {
	it(`${cites("solemn-strike", "text")} negates a Special Summon: 1500 LP is paid, the monster is destroyed and never Summoned`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["cyber"] }, rival: { set: [card], monsters: ["summon-watcher"] } });
		expect(offered(start)).toEqual(["pass", "special-summon cyber"]);
		const done = play(start, "special-summon cyber", `activate ${card}`);
		expect(done.lp).toEqual({ you: 8000, rival: 6500 });
		expect(codes(done, "you", "graveyard")).toEqual(["cyber"]);
		expect(codes(done, "you", "monster")).toEqual([]);
		expect(codes(done, "rival", "graveyard")).toEqual([card]);
		expect(log).toEqual([]);
		// A Special Summon does not use up the Normal Summon of the turn.
		expect(done.normalSummoned).toBe(false);
	});
	it(`${cites("solemn-strike", "text")} ${cites("solemn-judgment", "text")} Solemn Strike answers Special Summons only, while Solemn Judgment answers every Summon`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const options = { everyWindow: true };
		const normal = play(position({ defs, options, you: { hand: ["normal-4"] }, rival: { set: [card, "solemn-judgment"] } }), "summon normal-4", "pass");
		expect(offered(normal)).toEqual(["activate solemn-judgment", "pass"]);
		const special = play(position({ defs, options, you: { hand: ["cyber"] }, rival: { set: [card, "solemn-judgment"] } }), "special-summon cyber", "pass");
		expect(offered(special)).toEqual(["activate solemn-judgment", `activate ${card}`, "pass"].sort());
	});
	it(`${cites("solemn-strike", "text")} ${cites("rules", "solemn-strike-notes")} negates a monster effect: the monster is destroyed on the field, the cost stays, and the use of the effect is spent`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { monsters: ["ignition-once", "ignition-once"] }, rival: { set: [card, "solemn-judgment"] } });
		// Solemn Judgment is not offered against a monster effect; Solemn Strike is.
		const asked = play(start, "activate ignition-once");
		expect(offered(asked)).toEqual([`activate ${card}`, "pass"]);
		// The rival's Solemn Judgment could answer their own Solemn Strike, a Trap Card activation; they let it resolve.
		const done = play(asked, `activate ${card}`, "pass");
		expect(done.lp.rival).toBe(6500);
		expect(log).toEqual([]);
		expect(codes(done, "you", "graveyard")).toEqual(["ignition-once"]);
		// The other copy: the use stays spent (the core's reading, backed by YGOProJudge and not by a Konami record; no cite).
		expect(offered(done)).toEqual(["pass"]);
	});
	it(`${cites("solemn-strike", "text")} is not offered against the activation of a Spell Card`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const asked = play(position({ defs, options: { everyWindow: true }, you: { hand: ["plain-spell"] }, rival: { set: [card] } }), "activate plain-spell");
		expect(offered(asked)).toEqual(["pass"]);
	});
	it(`${cites("rules", "hand-effect-negated-card-already-in-graveyard")} a monster whose hand effect is negated is already in the Graveyard as the cost: there is nothing left to destroy`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["hand-monster"] }, rival: { set: [card] } });
		const done = play(start, "activate hand-monster", `activate ${card}`);
		expect(log).toEqual([]);
		expect(codes(done, "you", "graveyard")).toEqual(["hand-monster"]);
		expect(done.lp.rival).toBe(6500);
	});
});
