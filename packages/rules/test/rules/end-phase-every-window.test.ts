import { describe, expect, it } from "vitest";
import { type CardDef, cites, type Duel, other, specialSummon, takeControl, targetsOf } from "../../src";
import { offered, play, position } from "./fixtures";

/**
 * The End Phase after an `apply` action (a monster given back, a temporarily banished monster returned), with the `everyWindow` teaching
 * option on: every window is shown, so the closed windows that follow an action that starts no chain (FET boxes B and C) are too. A
 * "During the End Phase: You can ..." optional Trigger Effect is not a fast effect: it is activated in the open game state, so the player
 * whose turn it is not is offered it once both players have passed those closed windows and the turn player has passed again in the
 * open game state (fid 11533). Nothing is lost; without `everyWindow` the closed windows are passed by themselves. Made-up cards.
 */
const defs: Record<string, CardDef> = {
	// "Once per turn, during the End Phase, if this card was Special Summoned this turn: You can ..." (Sky Striker Ace - Shizuku's kind).
	"fixture-shizuku": {
		code: "fixture-shizuku",
		kind: "monster",
		facts: { frame: "link", link: 1, arrows: ["top-right"], atk: 1500 },
		effects: [{ type: "trigger", during: "end", eitherTurn: true, once: { scope: "instance", acrossMoves: true }, condition: (duel, { card }) => card.specialSummoned && card.summonedTurn === duel.turn.number, operation: (duel) => duel }],
	},
	// "Target 1 monster your opponent controls; take control of it until the End Phase."
	"fixture-mind": { code: "fixture-mind", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[other(player)].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => takeControl(board, card.id, link.player, board.turn.number, link), duel) }] },
};

const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;
const state = (duel: Duel) => [duel.turn.phase, duel.priority.holder, duel.priority.open, offered(duel)];

/** Your turn: the rival Special Summoned "fixture-shizuku" this turn, you took it until the End Phase; the End Phase begins. */
function end(everyWindow: boolean): Duel {
	const placed = position({ defs, options: { everyWindow }, you: { hand: ["fixture-mind"] }, rival: { extra: ["fixture-shizuku"] }, phase: "main2" });
	const start = { ...specialSummon(placed, "rival", idOf(placed, "fixture-shizuku")), live: [], waiting: [] };
	let next = play(start, "activate fixture-mind > fixture-shizuku");
	for (let guard = 0; guard < 20 && next.turn.phase !== "end"; guard++) next = play(next, offered(next).includes("pass") ? "pass" : "place 0");
	return next;
}

describe("the End Phase after an apply action, every window shown", () => {
	it(`${cites("rules", "after-action-or-chain")} ${cites("rules", "open-state-only")} ${cites("rules", "end-phase-other-player-next")} the game state is closed after the monster is given back (boxes B and C); the other player's End Phase effect waits for the open game state and is offered once the turn player passes there`, () => {
		const start = end(true);
		expect(state(start)).toEqual(["end", "you", true, ["activate fixture-shizuku", "apply fixture-shizuku"]]);
		const back = play(start, "apply fixture-shizuku", "place 3");
		// Box B: the turn player, fast effects only; box C: the rival, fast effects only. Not the optional Trigger Effect of the phase.
		expect(state(back)).toEqual(["end", "you", false, ["pass"]]);
		const boxC = play(back, "pass");
		expect(state(boxC)).toEqual(["end", "rival", false, ["pass"]]);
		// Both passed: the game state is open again, the turn player first; once they pass, the rival is offered it.
		const open = play(boxC, "pass");
		expect(state(open)).toEqual(["end", "you", true, ["pass"]]);
		expect(state(play(open, "pass"))).toEqual(["end", "rival", true, ["activate fixture-shizuku", "pass"]]);
	});
	it(`${cites("rules", "end-phase-other-player-next")} without every window shown, the closed windows are passed by themselves: the same offer, one pass sooner`, () => {
		const back = play(end(false), "apply fixture-shizuku", "place 3");
		expect(state(back)).toEqual(["end", "you", true, ["pass"]]);
		expect(state(play(back, "pass"))).toEqual(["end", "rival", true, ["activate fixture-shizuku", "pass"]]);
	});
});
