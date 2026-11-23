import { describe, expect, it } from "vitest";
import { cites, legalActions } from "../../src";
import { offered, plainCards, play, position } from "./fixtures";

const defs = plainCards();
/** Every chance to respond is shown, so a test can stop at any point of a chain. */
const options = { everyWindow: true };

describe("legalActions in an open game state", () => {
	it(`${cites("rules", "open-state")} ${cites("rules", "open-state-only")} offers the turn player, in their Main Phase, every card they can activate or Set, and to pass`, () => {
		const duel = position({ defs, you: { hand: ["monster", "spell", "quick-play", "trap", "hand-quick"], monsters: ["ignition"] }, rival: { hand: ["hand-quick"], set: ["trap"] } });
		expect(offered(duel)).toEqual(["activate hand-quick", "activate ignition", "activate quick-play", "activate spell", "pass", "set quick-play", "set spell", "set trap"]);
	});
	it(`${cites("rules", "turn-player-priority")} offers only the cards of the player who holds priority`, () => {
		const duel = position({ defs, you: { hand: ["spell"], set: ["quick-play"] }, rival: { hand: ["hand-quick"], set: ["trap"], monsters: ["field-quick"] } });
		const controllers = legalActions(duel).flatMap((action) => (action.type === "pass" || action.type === "place" ? [] : [duel.cards[action.card]!.controller]));
		expect(controllers).toEqual(["you", "you", "you"]);
	});
	it(`${cites("rules", "spell-main-phase")} ${cites("rules", "quick-play")} outside the Main Phase, offers no Spell Speed 1 card and no Set, but still a Quick-Play Spell from the hand`, () => {
		const duel = position({ defs, phase: "battle", you: { hand: ["spell", "quick-play", "trap"], set: ["spell"], monsters: ["ignition"] } });
		expect(offered(duel)).toEqual(["activate quick-play", "attack ignition directly", "pass"]);
	});
	it(`${cites("rules", "set-spell-same-turn")} ${cites("rules", "trap-set-first")} offers a Spell Set this turn, but not a Trap or a Quick-Play Spell Set this turn, nor a Trap in the hand`, () => {
		const duel = position({ defs, you: { hand: ["other-trap"], setThisTurn: ["spell", "quick-play", "trap"] } });
		expect(offered(duel)).toEqual(["activate spell", "pass", "set other-trap"]);
		const later = position({ defs, you: { set: ["spell", "quick-play", "trap"] } });
		expect(offered(later)).toEqual(["activate quick-play", "activate spell", "activate trap", "pass"]);
	});
	it("offers one action per card that can be targeted, and none when there is no target or the condition is not met", () => {
		const two = position({ defs, you: { hand: ["aimed"], set: ["answer"], monsters: ["monster"] }, rival: { monsters: ["ignition"] } });
		expect(offered(two).filter((line) => line.startsWith("activate"))).toEqual(["activate aimed > ignition", "activate aimed > monster"]);
		const none = position({ defs, you: { hand: ["aimed"], set: ["answer"] } });
		expect(offered(none)).toEqual(["pass", "set aimed"]);
	});
	it("offers nothing that needs a free Spell & Trap Zone when all five are taken", () => {
		const duel = position({ defs, you: { hand: ["spell", "quick-play", "trap"], set: ["trap", "trap", "trap", "trap", "other-spell"] } });
		expect(offered(duel)).toEqual(["activate other-spell", "activate trap", "activate trap", "activate trap", "activate trap", "pass"]);
	});
});

describe("legalActions when the other player may respond", () => {
	it(`${cites("rules", "fast-effects-either-turn")} offers the opponent, when the turn player passes, their fast effects only: nothing of Spell Speed 1, no Set, no Quick-Play Spell from the hand`, () => {
		const start = position({ defs, options, you: { hand: ["spell"] }, rival: { hand: ["spell", "other-quick-play", "other-trap", "hand-quick"], set: ["other-spell", "quick-play", "trap"], monsters: ["ignition", "field-quick"] } });
		const duel = play(start, "pass");
		expect(duel.priority.holder).toBe("rival");
		expect(offered(duel)).toEqual(["activate field-quick", "activate hand-quick", "activate quick-play", "activate trap", "pass"]);
	});
	it(`${cites("rules", "response-speed")} offers every response at least as fast as the top link: Set Traps and Quick-Play Spells, Quick Effects in the hand and on the field, Counter Traps`, () => {
		const start = position({ defs, options, you: { hand: ["spell"] }, rival: { hand: ["hand-quick", "aimed", "monster"], set: ["quick-play", "trap", "answer", "counter"], setThisTurn: ["other-quick-play"], monsters: ["field-quick"] } });
		const duel = play(start, "activate spell");
		expect(duel.priority.holder).toBe("rival");
		expect(offered(duel)).toEqual(["activate answer", "activate counter", "activate field-quick", "activate hand-quick", "activate quick-play", "activate trap", "pass"]);
	});
	it(`${cites("rules", "speed-1-no-response")} offers no Spell Speed 1 card or effect while a chain is being built, even to the turn player in their Main Phase`, () => {
		const start = position({ defs, options, you: { hand: ["spell", "quick-play"], set: ["other-spell"], monsters: ["ignition"] } });
		const duel = play(start, "activate quick-play", "pass");
		expect(duel.priority.holder).toBe("you");
		expect(duel.chain).toHaveLength(1);
		expect(offered(duel)).toEqual(["pass"]);
	});
	it(`${cites("rules", "speed-3-only-speed-3")} offers only a Counter Trap in response to a Counter Trap`, () => {
		const start = position({ defs, options, you: { hand: ["spell", "quick-play", "hand-quick"], set: ["trap", "counter"] }, rival: { set: ["counter"] } });
		const duel = play(start, "activate spell", "activate counter");
		expect(duel.priority.holder).toBe("you");
		expect(offered(duel)).toEqual(["activate counter", "pass"]);
	});
	it("offers only to pass once the chain has as many links as the teaching limit allows", () => {
		const hands = { you: { hand: ["spell"], set: ["quick-play"] }, rival: { set: ["trap", "counter"] } };
		const capped = play(position({ defs, options: { everyWindow: true, chainLimit: 1 }, ...hands }), "activate spell");
		expect(offered(capped)).toEqual(["pass"]);
		const two = play(position({ defs, options: { everyWindow: true, chainLimit: 2 }, ...hands }), "activate spell");
		expect(offered(two)).toEqual(["activate counter", "activate trap", "pass"]);
		expect(offered(play(two, "activate trap"))).toEqual(["pass"]);
	});
});
