import { describe, expect, it } from "vitest";
import { cites, type Duel, legalActions } from "../../src";
import { nextTurn } from "./continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { summonExtrasCards } from "./summon-extras-fixtures";

const board = (you: SideSpec, rival: SideSpec = {}, turn: "you" | "rival" = "you") => position({ defs: summonExtrasCards(), you, rival, turn });
const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("summon") || label.startsWith("set fixture-") || label.startsWith("set lv"));

/**
 * "You can Normal Summon 1 [monster] in addition to your Normal Summon/Set" (a `permit` layer of src/modifiers.ts, offered by
 * `legalActions` as a `summon` action marked `extra`). Mausoleum of White's text (TCG) and Konami's Japanese notes and Q&A on it (OCG
 * only); YGOProJudge gave the same answers for the TCG (asked 2026-11-24, no source cited).
 */
describe("a Normal Summon in addition to the Normal Summon/Set", () => {
	it(`${cites("rules", "extra-normal-summon-text")} ${cites("rules", "extra-normal-summon-declared")} a monster the effect names is offered both ways, the additional Summon being named as such; other monsters only the turn's Normal Summon or Set`, () => {
		const start = board({ hand: ["fixture-light-tuner", "fixture-dark-tuner", "lv4"], faceupSpells: ["fixture-mausoleum"] });
		expect(summons(start)).toEqual(["set fixture-dark-tuner", "set fixture-light-tuner", "set lv4", "summon fixture-dark-tuner", "summon fixture-light-tuner", "summon fixture-light-tuner additional", "summon lv4"]);
		expect(legalActions(start).filter((action) => action.type === "summon" && action.extra)).toHaveLength(1);
	});
	it(`${cites("rules", "extra-normal-summon-either-order")} the additional Summon first, then the turn's Normal Summon: both monsters are Summoned, and nothing more`, () => {
		const start = board({ hand: ["fixture-light-tuner", "lv4", "lv3"], faceupSpells: ["fixture-mausoleum"] });
		const first = play(start, "summon fixture-light-tuner additional");
		expect([first.extraNormalSummoned, first.normalSummoned, first.chain.length]).toEqual([true, false, 0]);
		expect(summons(first)).toEqual(["set lv3", "set lv4", "summon lv3", "summon lv4"]);
		const second = play(first, "summon lv4");
		expect([codes(second, "you", "monster"), summons(second)]).toEqual([["fixture-light-tuner", "lv4"], []]);
	});
	it(`${cites("rules", "extra-normal-summon-either-order")} the turn's Normal Summon first, then the additional one, which is a Normal Summon and never a Set`, () => {
		const start = board({ hand: ["fixture-light-tuner", "fixture-light-tuner", "lv4"], faceupSpells: ["fixture-mausoleum"] });
		const first = play(start, "summon fixture-light-tuner");
		expect(summons(first)).toEqual(["summon fixture-light-tuner additional"]);
		const second = play(first, "summon fixture-light-tuner additional");
		expect([codes(second, "you", "monster"), summons(second)]).toEqual([["fixture-light-tuner", "fixture-light-tuner"], []]);
	});
	it(`${cites("rules", "extra-normal-summon-one-per-turn")} with two such effects applying, only one additional Summon is made that turn`, () => {
		const start = board({ hand: ["fixture-light-tuner", "lv3", "lv4"], faceupSpells: ["fixture-mausoleum", "fixture-second-summon-field"] });
		expect(summons(start)).toContain("summon lv3 additional");
		const first = play(start, "summon fixture-light-tuner additional");
		expect(summons(first)).toEqual(["set lv3", "set lv4", "summon lv3", "summon lv4"]);
		expect(summons(play(first, "summon lv3"))).toEqual([]);
	});
	it(`${cites("rules", "extra-normal-summon-text")} "you can only gain this effect once per turn": another copy activated after the additional Summon gives no second one`, () => {
		const start = board({ hand: ["fixture-light-tuner", "fixture-light-tuner", "fixture-mausoleum"], faceupSpells: ["fixture-mausoleum"] });
		const replaced = play(start, "summon fixture-light-tuner additional", "activate fixture-mausoleum");
		expect([codes(replaced, "you", "field"), codes(replaced, "you", "graveyard")]).toEqual([["fixture-mausoleum"], ["fixture-mausoleum"]]);
		expect(summons(replaced)).toEqual(["set fixture-light-tuner", "summon fixture-light-tuner"]);
	});
	it(`${cites("rules", "extra-normal-summon-blocks-others")} once an additional Summon was made, another effect that gives one cannot be activated; before that, it gives its own (here a Tribute Summon)`, () => {
		const start = board({ hand: ["fixture-light-tuner", "lv5", "fixture-extra-tribute-summon"], monsters: ["lv2"], faceupSpells: ["fixture-mausoleum"] });
		expect(offered(play(start, "summon fixture-light-tuner additional"))).not.toContain("activate fixture-extra-tribute-summon");
		const applied = play(start, "activate fixture-extra-tribute-summon");
		expect(summons(applied)).toContain("summon lv5 additional");
		// The Tribute, then the zone, are asked as for any Tribute Summon; the turn's Normal Summon is still there.
		const done = play(applied, "summon lv5 additional", "place 0");
		expect([codes(done, "you", "monster"), done.normalSummoned, done.extraNormalSummoned]).toEqual([["lv5"], false, true]);
		expect(summons(done)).toEqual(["set fixture-light-tuner", "summon fixture-light-tuner"]);
	});
	it(`${cites("rules", "extra-normal-summon-controller-only")} only the controller of the card, in their own Main Phase, and only while the card applies`, () => {
		// The opponent's card gives you nothing.
		expect(summons(board({ hand: ["fixture-light-tuner"] }, { faceupSpells: ["fixture-mausoleum"] }))).toEqual(["set fixture-light-tuner", "summon fixture-light-tuner"]);
		// Gone from the field, it gives nothing any more.
		const start = board({ hand: ["fixture-light-tuner"], set: ["fixture-field-breaker"], faceupSpells: ["fixture-mausoleum"] });
		expect(summons(play(start, "activate fixture-field-breaker"))).toEqual(["set fixture-light-tuner", "summon fixture-light-tuner"]);
		// Not in the Battle Phase.
		expect(summons(position({ defs: summonExtrasCards(), phase: "battle", you: { hand: ["fixture-light-tuner"], faceupSpells: ["fixture-mausoleum"] } }))).toEqual([]);
	});
	it(`${cites("rules", "normal-summon-is-an-action")} it is a Normal Summon: it starts no chain and can be negated like one, and a negated one is still the turn's additional Summon`, () => {
		const start = position({ defs: summonExtrasCards(), you: { hand: ["fixture-light-tuner", "fixture-light-tuner"], faceupSpells: ["fixture-mausoleum"] }, rival: { set: ["warning"] } });
		const negated = play(start, "summon fixture-light-tuner additional", "activate warning");
		expect([codes(negated, "you", "graveyard"), codes(negated, "you", "monster"), negated.extraNormalSummoned]).toEqual([["fixture-light-tuner"], [], true]);
		expect(summons(negated)).toEqual(["set fixture-light-tuner", "summon fixture-light-tuner"]);
	});
	it("a new turn gives the additional Summon again", () => {
		const used = play(board({ hand: ["fixture-light-tuner", "fixture-light-tuner", "fixture-light-tuner"], faceupSpells: ["fixture-mausoleum"] }), "summon fixture-light-tuner additional");
		let next = nextTurn(used, 5);
		for (let guard = 0; guard < 10 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
		expect(summons(next)).toContain("summon fixture-light-tuner additional");
	});
});
