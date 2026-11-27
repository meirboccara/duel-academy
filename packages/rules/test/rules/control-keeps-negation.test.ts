import { describe, expect, it } from "vitest";
import { type CardDef, type Duel, isNegated, negateCardEffects, other, takeControl, targetsOf } from "../../src";
import { nextTurn } from "./continuous-fixtures";
import { offered, play, position } from "./fixtures";

/**
 * "Negate its effects until the end of this turn, then take control of it until the End Phase" (Sky Striker Mecha - Widow Anchor's
 * wording): the negation stands for the rest of the turn while the monster changes hands, and after it is given back in the End
 * Phase. **YGOProJudge only** (the batch-5 chat of 2026-11-26, no source cited). No Konami page read settles it: fid 8398 is about
 * a monster that left as its own cost, fid 17476 about a control change and a temporary banishment, and the notes behind the record
 * `negated-monster-state` about a monster turned face-down (there the negation does end). A made-up Quick-Play Spell and a monster
 * with an Ignition Effect.
 */
function cards(log: string[]): Record<string, CardDef> {
	return {
		"fixture-engine": { code: "fixture-engine", kind: "monster", facts: { level: 4, atk: 1500, def: 1500 }, effects: [{ type: "ignition", operation: (duel) => (log.push("engine"), duel) }] },
		// "Target 1 face-up monster your opponent controls; negate its effects until the end of this turn, then take control of it until the End Phase."
		"fixture-anchor": {
			code: "fixture-anchor",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					target: (duel, { player }) => duel.piles[other(player)].monster,
					operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => takeControl(negateCardEffects(board, card.id, board.turn.number, link), card.id, link.player, board.turn.number, link), duel),
				},
			],
		},
	};
}

const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;

describe("a negation \"until the end of this turn\" and a change of control (YGOProJudge only)", () => {
	it("stands while the monster is controlled by the player who took it: its effect, activated by them, is negated", () => {
		const log: string[] = [];
		const start = position({ defs: cards(log), you: { hand: ["fixture-anchor"] }, rival: { monsters: ["fixture-engine"] } });
		const engine = idOf(start, "fixture-engine");
		const taken = play(start, "activate fixture-anchor > fixture-engine", "place 0");
		expect(taken.cards[engine]!.controller).toBe("you");
		expect(isNegated(taken, engine)).toBe(true);
		const used = play(taken, "activate fixture-engine");
		expect(used.chain).toEqual([]);
		expect(log).toEqual([]);
	});
	it("still stands once the monster is given back in the End Phase, and ends with the turn", () => {
		const log: string[] = [];
		const start = position({ defs: cards(log), phase: "main2", you: { hand: ["fixture-anchor"] }, rival: { monsters: ["fixture-engine"] } });
		const engine = idOf(start, "fixture-engine");
		const taken = play(start, "activate fixture-anchor > fixture-engine", "place 0");
		const end = play(taken, "pass");
		expect([end.turn.phase, offered(end)]).toEqual(["end", ["apply fixture-engine"]]);
		const back = play(end, "apply fixture-engine", "place 2");
		expect(back.cards[engine]).toMatchObject({ controller: "rival", slot: 2 });
		expect([back.turn.phase, isNegated(back, engine)]).toEqual(["end", true]);
		const later = nextTurn(back, back.turn.number + 1);
		expect(isNegated(later, engine)).toBe(false);
		expect(later.modifiers).toEqual([]);
	});
});
