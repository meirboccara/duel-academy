import { describe, expect, it } from "vitest";
import { act, type Duel, legalActions, nextPhaseTurn } from "../../src";
import { codes, offered, play, position } from "./fixtures";
import { readinessCards } from "./readiness-fixtures";

const options = { everyWindow: true };

/** Passes until the turn player holds priority in an open game state of `phase`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"]): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

/**
 * Delayed effects (src/delayed.ts): an effect that resolves now and is applied later, without activating. No Konami page was found for
 * the general rules: that they start no chain, are tied to the card as it was, and are ordered by their player are YGOProJudge's answers
 * (asked 2026-11-24, no source cited). Mulcharmy's notes (test/cards) are the Konami source for "no Chain Link" on that card.
 */
describe("an effect applied later, in the End Phase", () => {
	it("is not applied when the phase begins: its player applies it as an action that starts no chain, and it survives its source leaving the field", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-doom"] }, rival: { monsters: ["fixture-vanilla"] } });
		const doomed = play(start, "activate fixture-doom > fixture-vanilla", "pass", "pass");
		// The Quick-Play Spell is in the GY; what it left is in the Duel, not on the card.
		expect(codes(doomed, "you", "graveyard")).toEqual(["fixture-doom"]);
		expect(doomed.delayed).toHaveLength(1);
		expect(offered(doomed)).not.toContain("apply fixture-doom");
		const end = toPhase(doomed, "end");
		expect(codes(end, "rival", "monster")).toEqual(["fixture-vanilla"]);
		expect(log).toEqual([]);
		// Mandatory: the phase cannot be left before it is applied.
		expect(offered(end)).toEqual(["apply fixture-doom"]);
		const applied = play(end, "apply fixture-doom");
		expect(applied.chain).toEqual([]);
		expect(log).toEqual(["fixture-doom destroys fixture-vanilla"]);
		expect(codes(applied, "rival", "graveyard")).toEqual(["fixture-vanilla"]);
		expect(applied.delayed).toEqual([]);
		// The destruction is the Spell's effect: its source is the card as activated.
		const destroyed = applied.live.find((event) => event.type === "moved" && event.reason === "destroyed");
		expect(destroyed).toMatchObject({ destruction: { cause: "effect", source: { code: "fixture-doom" }, player: "you" } });
	});
	it("is tied to the card as it was: a card that moved since is a new card, and nothing is applied to it", () => {
		const log: string[] = [];
		const defs = readinessCards(log);
		const start = position({ defs, options, you: { hand: ["fixture-doom", "fixture-blink"] }, rival: { monsters: ["fixture-vanilla"] } });
		const doomed = play(start, "activate fixture-doom > fixture-vanilla", "pass", "pass");
		// Banished and Special Summoned again: the monster on the field is a new card.
		const taken = play(doomed, "activate fixture-blink > fixture-vanilla", "pass", "pass");
		expect(codes(taken, "rival", "monster")).toEqual(["fixture-vanilla"]);
		const end = toPhase(taken, "end");
		expect(offered(end)).toEqual(["pass"]);
		expect(log).toEqual([]);
		const next = play(end, "pass", "pass");
		expect(next.turn.number).toBe(4);
		expect(codes(next, "rival", "monster")).toEqual(["fixture-vanilla"]);
		expect(next.delayed).toEqual([]);
	});
	it("several resolved copies stack: each leaves its own delayed effect, applied one after the other in the order the player chooses", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-doom", "fixture-doom"] }, rival: { monsters: ["fixture-vanilla", "fixture-big"] } });
		const two = play(start, "activate fixture-doom > fixture-big", "pass", "pass", "activate fixture-doom > fixture-vanilla", "pass", "pass");
		expect(two.delayed).toHaveLength(2);
		const end = toPhase(two, "end");
		expect(legalActions(end)).toHaveLength(2);
		// The player picks the second one first.
		const second = legalActions(end).find((action) => action.type === "apply" && action.delayed === two.delayed[1]!.stamp)!;
		const one = act(end, second);
		expect(log).toEqual(["fixture-doom destroys fixture-vanilla"]);
		expect(offered(toPhase(one, "end"))).toEqual(["apply fixture-doom"]);
		play(toPhase(one, "end"), "apply fixture-doom");
		expect(log).toEqual(["fixture-doom destroys fixture-vanilla", "fixture-doom destroys fixture-big"]);
	});
	it("the player whose effect it is makes its choices when it is applied, and may order it around their other End Phase effects", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-end-discard", "fixture-vanilla", "fixture-big"], monsters: ["fixture-end-trigger"] } });
		const end = toPhase(play(start, "activate fixture-end-discard", "pass", "pass"), "end");
		// The mandatory trigger of the End Phase went on a chain and resolved first; the delayed effect is then the player's to apply.
		expect(log).toEqual(["fixture-end-trigger"]);
		const asked = play(end, "apply fixture-end-discard");
		expect(asked.asking?.player).toBe("you");
		expect(offered(asked)).toEqual(["choose fixture-big", "choose fixture-vanilla"]);
		const done = play(asked, "choose fixture-big");
		expect(log).toEqual(["fixture-end-trigger", "fixture-end-discard discards fixture-big"]);
		expect(codes(done, "you", "hand")).toEqual(["fixture-vanilla"]);
		expect(done.delayed).toEqual([]);
	});
	it("an optional one may be declined by leaving the phase; it is gone afterwards", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-end-draw"], deck: ["fixture-vanilla"] } });
		const end = toPhase(play(start, "activate fixture-end-draw", "pass", "pass"), "end");
		expect(offered(end)).toEqual(["apply fixture-end-draw", "pass"]);
		const left = play(end, "pass", "pass");
		expect(left.turn.number).toBe(4);
		expect(left.delayed).toEqual([]);
		expect(log).toEqual([]);
		expect(codes(play(end, "apply fixture-end-draw"), "you", "hand")).toEqual(["fixture-vanilla"]);
	});
	it("the turn player applies theirs first; the other player applies theirs when the turn player passes, and the turn does not end before", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-doom"], monsters: ["fixture-big"] }, rival: { set: ["fixture-doom"], monsters: ["fixture-vanilla"] } });
		const both = play(start, "activate fixture-doom > fixture-vanilla", "activate fixture-doom > fixture-big", "pass", "pass");
		const end = toPhase(both, "end");
		expect(end.priority.holder).toBe("you");
		expect(offered(end)).toEqual(["apply fixture-doom"]);
		const mine = toPhase(play(end, "apply fixture-doom"), "end");
		expect(log).toEqual(["fixture-doom destroys fixture-vanilla"]);
		// The turn player has nothing left and passes: the other player must apply theirs before the turn ends.
		const theirs = play(mine, "pass");
		expect(theirs.priority.holder).toBe("rival");
		expect(offered(theirs)).toEqual(["apply fixture-doom"]);
		play(theirs, "apply fixture-doom");
		expect(log).toEqual(["fixture-doom destroys fixture-vanilla", "fixture-doom destroys fixture-big"]);
	});
	it("with the windows passed automatically, a mandatory delayed effect still stops the Duel on its player", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), you: { monsters: ["fixture-big"] }, rival: { set: ["fixture-doom"] } });
		const doomed = play(play(start, "pass"), "activate fixture-doom > fixture-big");
		const end = toPhase(doomed, "end");
		const waiting = play(end, "pass");
		expect(waiting.turn).toMatchObject({ number: 3, phase: "end" });
		expect(waiting.priority.holder).toBe("rival");
		expect(offered(waiting)).toEqual(["apply fixture-doom"]);
	});
});

describe("an effect scheduled for a later turn", () => {
	it("\"during your opponent's next End Phase\" waits for a turn of the opponent, and \"the next Standby Phase\" for the next one to begin", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-rival-end", "fixture-next-standby"] } });
		// In your turn 3, Main Phase 1: the opponent's next End Phase is turn 4's, the next Standby Phase turn 4's too.
		expect(nextPhaseTurn(start, "end", "rival")).toBe(4);
		expect(nextPhaseTurn(start, "end", "you")).toBe(3);
		expect(nextPhaseTurn(start, "standby")).toBe(4);
		expect(nextPhaseTurn({ ...start, turn: { ...start.turn, phase: "draw" } }, "standby")).toBe(3);
		const set = play(start, "activate fixture-rival-end", "pass", "pass", "activate fixture-next-standby", "pass", "pass");
		const end3 = toPhase(set, "end");
		expect(offered(end3)).toEqual(["pass"]);
		const standby4 = play(toPhase(end3, "standby"), "pass");
		// The rival is the turn player in turn 4; the effect is yours to apply.
		expect(standby4.priority.holder).toBe("you");
		expect(offered(standby4)).toEqual(["apply fixture-next-standby"]);
		const end4 = play(toPhase(play(standby4, "apply fixture-next-standby"), "end"), "pass");
		expect(offered(end4)).toEqual(["apply fixture-rival-end"]);
		play(end4, "apply fixture-rival-end");
		expect(log).toEqual(["fixture-next-standby on turn 4", "fixture-rival-end on turn 4"]);
	});
});
