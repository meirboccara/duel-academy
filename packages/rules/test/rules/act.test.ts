import { describe, expect, it } from "vitest";
import { act, cardsIn, cites, type Duel, legalActions } from "../../src";
import { codes, offered, plainCards, play, position } from "./fixtures";

/** Every chance to respond is shown, so a test can make each pass itself. */
const options = { everyWindow: true };
const priority = (duel: Duel) => ({ holder: duel.priority.holder, open: duel.priority.open, links: duel.chain.length });

function freeze<T>(value: T): T {
	if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const inner of Object.values(value)) freeze(inner);
	}
	return value;
}

describe("act: activating", () => {
	it(`${cites("rules", "priority-passes")} ${cites("rules", "after-activation")} puts the card face-up on the field and a link on the chain, and gives priority to the other player`, () => {
		const start = position({ defs: plainCards(), options, you: { hand: ["spell"] } });
		const duel = play(start, "activate spell");
		const spell = cardsIn(duel, "you", "spell")[0]!;
		expect(spell).toMatchObject({ code: "spell", zone: "spell", face: "up" });
		expect(duel.chain).toEqual([{ player: "you", card: spell, effect: 0, speed: 1, targets: [], targetMoves: [], spent: null, categories: [], activationNegated: false, effectNegated: false }]);
		expect(duel.priority).toEqual({ holder: "rival", passed: [], open: false });
	});
	it("returns a new duel and leaves the one it was given untouched", () => {
		const start = freeze({ ...position({ defs: {}, options, you: { hand: ["spell"] }, rival: { set: ["trap"] } }), defs: plainCards() });
		const duel = play(start, "activate spell", "activate trap");
		expect(duel.chain).toHaveLength(2);
		expect(start.chain).toEqual([]);
		expect(codes(start, "you", "hand")).toEqual(["spell"]);
		expect(duel.piles.rival.hand).toBe(start.piles.rival.hand);
	});
	it(`${cites("rules", "cost-no-refund")} pays the cost at activation, and keeps it paid when the activation is negated`, () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), options, phase: "battle", you: { hand: ["hand-quick"] }, rival: { set: ["counter"] } });
		const paid = play(start, "activate hand-quick");
		expect(codes(paid, "you", "graveyard")).toEqual(["hand-quick"]);
		expect(paid.chain[0]!.card).toMatchObject({ code: "hand-quick", zone: "hand" });
		const after = play(paid, "activate counter", "pass", "pass");
		expect(log).toEqual(["counter"]);
		expect(codes(after, "you", "graveyard")).toEqual(["hand-quick"]);
		expect(codes(after, "you", "hand")).toEqual([]);
	});
	it("refuses an action that is not legal: another player's card, a Spell Speed 1 card on a chain, a link beyond the teaching limit", () => {
		const start = position({ defs: plainCards(), options: { everyWindow: true, chainLimit: 1 }, you: { hand: ["spell", "other-spell"] }, rival: { set: ["trap"] } });
		const trap = cardsIn(start, "rival", "spell")[0]!.id;
		expect(() => act(start, { type: "activate", card: trap, effect: 0, targets: [] })).toThrow(/not a legal action for you/);
		const chained = play(start, "activate spell");
		expect(() => act(chained, { type: "activate", card: trap, effect: 0, targets: [] })).toThrow(/not a legal action for rival/);
		const mine = play(chained, "pass");
		expect(() => act(mine, { type: "activate", card: cardsIn(mine, "you", "hand")[0]!.id, effect: 0, targets: [] })).toThrow(/not a legal action/);
	});
});

describe("act: passing, and when the chain resolves", () => {
	it(`${cites("rules", "chain-own-link")} does not resolve the chain on a single pass: the player who activated may add a link to their own`, () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), options, you: { hand: ["spell"], set: ["quick-play"] }, rival: { set: ["trap"] } });
		const passed = play(start, "activate spell", "pass");
		expect(priority(passed)).toEqual({ holder: "you", open: false, links: 1 });
		expect(log).toEqual([]);
		expect(offered(passed)).toEqual(["activate quick-play", "pass"]);
		const added = play(passed, "activate quick-play");
		expect(added.chain.map((link) => [link.player, link.card.code])).toEqual([["you", "spell"], ["you", "quick-play"]]);
		expect(added.priority).toEqual({ holder: "rival", passed: [], open: false });
	});
	it(`${cites("rules", "chain-until-both-pass")} resolves the chain when both players pass in a row, not before`, () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), options, you: { hand: ["spell"], set: ["quick-play"] }, rival: { set: ["trap"] } });
		const building = play(start, "activate spell", "activate trap", "pass");
		expect(priority(building)).toEqual({ holder: "rival", open: false, links: 2 });
		expect(log).toEqual([]);
		const resolved = play(building, "pass");
		expect(log).toEqual(["trap", "spell"]);
		expect(resolved.chain).toEqual([]);
	});
	it(`${cites("rules", "chain-resolves-backwards")} resolves the links from the last to the first, with no chance to activate in between`, () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), options, you: { hand: ["spell"], set: ["quick-play", "other-quick-play"] }, rival: { set: ["trap", "other-trap"] } });
		const resolved = play(start, "activate spell", "activate trap", "activate quick-play", "activate other-trap", "pass", "pass");
		expect(log).toEqual(["other-trap", "quick-play", "trap", "spell"]);
		expect(resolved.chain).toEqual([]);
		expect(offered(resolved)).toEqual(["activate other-quick-play", "pass"]);
	});
	it(`${cites("rules", "spell-to-graveyard")} sends the Spell and Trap Cards of the chain to their owners' Graveyards once they have resolved`, () => {
		const start = position({ defs: plainCards(), options, you: { hand: ["spell"] }, rival: { set: ["trap"] } });
		const resolved = play(start, "activate spell", "activate trap", "pass", "pass");
		expect([codes(resolved, "you", "graveyard"), codes(resolved, "rival", "graveyard")]).toEqual([["spell"], ["trap"]]);
		expect([codes(resolved, "you", "spell"), codes(resolved, "rival", "spell")]).toEqual([[], []]);
	});
	it(`${cites("rules", "negated-activation")} applies nothing for a link whose activation was negated, and still resolves the links below it`, () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), options, you: { hand: ["spell"], set: ["counter"] }, rival: { set: ["trap"] } });
		const resolved = play(start, "activate spell", "activate trap", "activate counter", "pass", "pass");
		expect(log).toEqual(["counter", "spell"]);
		expect(codes(resolved, "rival", "graveyard")).toEqual(["trap"]);
		expect(codes(resolved, "you", "graveyard")).toEqual(["spell", "counter"]);
	});
	it(`${cites("rules", "after-action-or-chain")} ${cites("rules", "open-again")} after a chain resolves, gives the turn player the first fast effect, then the opponent; the game state is open again when both pass`, () => {
		const start = position({ defs: plainCards(), options, you: { hand: ["spell", "other-spell"], set: ["quick-play"] }, rival: { set: ["trap"] } });
		const resolved = play(start, "activate spell", "pass", "pass");
		expect(priority(resolved)).toEqual({ holder: "you", open: false, links: 0 });
		expect(offered(resolved)).toEqual(["activate quick-play", "pass"]);
		const passed = play(resolved, "pass");
		expect(priority(passed)).toEqual({ holder: "rival", open: false, links: 0 });
		expect(offered(passed)).toEqual(["activate trap", "pass"]);
		const open = play(passed, "pass");
		expect(priority(open)).toEqual({ holder: "you", open: true, links: 0 });
		expect(open.turn.phase).toBe("main1");
		expect(offered(open)).toContain("activate other-spell");
	});
});

describe("act: Setting, and moving through the turn", () => {
	it(`${cites("rules", "after-action-or-chain")} Sets a card face-down, then lets the turn player and the opponent use a fast effect before the game state is open again`, () => {
		const start = position({ defs: plainCards(), options, you: { hand: ["trap", "spell"] }, rival: { set: ["quick-play"] } });
		const set = play(start, "set trap");
		expect(cardsIn(set, "you", "spell")[0]).toMatchObject({ code: "trap", face: "down", zone: "spell" });
		expect(priority(set)).toEqual({ holder: "you", open: false, links: 0 });
		expect(offered(set)).toEqual(["pass"]);
		const rival = play(set, "pass");
		expect(offered(rival)).toEqual(["activate quick-play", "pass"]);
		expect(priority(play(rival, "pass"))).toEqual({ holder: "you", open: true, links: 0 });
	});
	it(`${cites("rules", "next-phase")} moves to the next phase when both players pass in an open game state, and to the other player's turn after the End Phase`, () => {
		const start = position({ defs: plainCards(), options, phase: "main2", you: { hand: ["spell"] } });
		const offer = play(start, "pass");
		expect(offer.turn.phase).toBe("main2");
		expect(priority(offer)).toEqual({ holder: "rival", open: true, links: 0 });
		const end = play(offer, "pass");
		expect(end.turn).toEqual({ player: "you", number: 3, phase: "end" });
		expect(priority(end)).toEqual({ holder: "you", open: true, links: 0 });
		const next = play(end, "pass", "pass");
		expect(next.turn).toEqual({ player: "rival", number: 4, phase: "draw" });
		expect(priority(next)).toEqual({ holder: "rival", open: true, links: 0 });
	});
	it(`${cites("rules", "trap-set-first")} ${cites("rules", "quick-play")} makes a Trap and a Quick-Play Spell Set this turn ready from the next turn on`, () => {
		const start = position({ defs: plainCards(), phase: "main2", you: { hand: ["trap", "quick-play"] } });
		// After the first Set, you still hold a fast effect (the Quick-Play Spell in your hand), so you pass yourself.
		const set = play(start, "set trap", "pass", "set quick-play");
		expect(offered(set)).toEqual(["pass"]);
		const endPhase = play(set, "pass");
		expect(endPhase.turn).toEqual({ player: "you", number: 3, phase: "end" });
		const rivalTurn = play(endPhase, "pass");
		expect(rivalTurn.turn).toEqual({ player: "rival", number: 4, phase: "draw" });
		expect(rivalTurn.setThisTurn).toEqual([]);
		const window = play(rivalTurn, "pass");
		expect(window.priority.holder).toBe("you");
		expect(offered(window)).toEqual(["activate quick-play", "activate trap", "pass"]);
	});
});

describe("act: response windows and the teaching limit", () => {
	it("passes for a player who holds no legal response, so a chain nobody answers resolves at once", () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), you: { hand: ["spell", "other-spell"] }, rival: { hand: ["monster", "quick-play"], setThisTurn: ["trap"] } });
		const duel = play(start, "activate spell");
		expect(log).toEqual(["spell"]);
		expect(priority(duel)).toEqual({ holder: "you", open: true, links: 0 });
	});
	it("stops at each player who does hold a response", () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), you: { hand: ["spell"] }, rival: { set: ["trap"] } });
		const asked = play(start, "activate spell");
		expect(priority(asked)).toEqual({ holder: "rival", open: false, links: 1 });
		const declined = play(asked, "pass");
		expect(log).toEqual(["spell"]);
		expect(priority(declined)).toEqual({ holder: "rival", open: false, links: 0 });
		expect(offered(declined)).toEqual(["activate trap", "pass"]);
	});
	it("shows every chance to respond when the teaching option asks for it", () => {
		const start = position({ defs: plainCards(), options, you: { hand: ["spell"] } });
		const duel = play(start, "activate spell");
		expect(priority(duel)).toEqual({ holder: "rival", open: false, links: 1 });
		expect(legalActions(duel)).toEqual([{ type: "pass" }]);
	});
	it("applies the teaching chain limit: no response is asked for beyond it, and the cards resolve as they always do", () => {
		const log: string[] = [];
		const start = position({ defs: plainCards(log), options: { chainLimit: 2 }, you: { hand: ["spell"], set: ["counter"] }, rival: { set: ["trap"] } });
		const duel = play(start, "activate spell", "activate trap");
		expect(log).toEqual(["trap", "spell"]);
		expect(duel.chain).toEqual([]);
		expect(codes(duel, "you", "spell")).toEqual(["counter"]);
	});
});

describe("act and createDuel: refusing what makes no sense", () => {
	it("refuses a teaching chain limit below one link", () => {
		expect(() => position({ defs: plainCards(), options: { chainLimit: 0 }, you: { hand: ["spell"] } })).toThrow(RangeError);
	});
	it("refuses an activation written without its targets as not a legal action, not with a crash", () => {
		const start = position({ defs: plainCards(), options, you: { hand: ["spell"] } });
		const id = cardsIn(start, "you", "hand")[0]!.id;
		expect(() => act(start, { type: "activate", card: id, effect: 0 } as never)).toThrow(/not a legal action/);
	});
});
