import { beforeAll, describe, expect, it } from "vitest";
import { apply, board, botMove, type Board, type Card, legalMoves, type Move, setCatalogue } from "../src";

/**
 * The engine knows no card of its own: any app can bring its catalogue. Here, three made-up cards play the rules a
 * duel needs (a Summon, a battle, a Spell, a hand trap that answers a search).
 */
const TINY: Record<string, Card> = {
	knight: { kind: "monster", level: 4, atk: 1800, def: 1000, art: "" },
	goblin: { kind: "monster", level: 3, atk: 1000, def: 500, art: "" },
	zap: { kind: "spell", effect: { type: "burn", amount: 500 }, art: "" },
	seek: { kind: "spell", effect: { type: "data", actions: [{ do: "search", filter: { kind: "monster" } }] }, art: "" },
	stopper: { kind: "monster", level: 3, atk: 0, def: 1800, hand: "ash", art: "" },
};

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`refused: ${result.reason}`);
	return result.board;
}

describe("an engine with another app's cards", () => {
	beforeAll(() => setCatalogue({ cards: TINY }));
	it("summons, battles and burns with cards it was given", () => {
		let state = board({ you: { hand: ["knight", "zap"] }, rival: { monsters: ["goblin"] } });
		state = ok(state, { type: "place", card: "knight", row: "monsters", zone: 0 });
		state = ok(state, { type: "attack", attacker: 0, target: 0 });
		expect(state.rival.monsters[0]).toBeNull();
		expect(state.rival.lp).toBe(4000 - 800);
		state = ok(state, { type: "place", card: "zap", row: "backrow", zone: 0 });
		expect(state.rival.lp).toBe(4000 - 800 - 500);
	});
	it("plays its rules on those cards: a hand trap negates a search written as data", () => {
		const searching = ok(board({ full: true, you: { hand: ["seek"], deck: ["knight"] }, rival: { hand: ["stopper"] } }), { type: "place", card: "seek", row: "backrow", zone: 0, pick: "knight" });
		const negated = ok(searching, { type: "hand", card: "stopper" });
		expect(negated.you.hand).toEqual([]);
	});
	it("lists legal moves and lets the bot choose one", () => {
		const state = board({ you: { hand: ["knight", "goblin"] } });
		expect(legalMoves(state).length).toBeGreaterThan(0);
		expect(apply(state, botMove(state, { aggression: 1, skill: 1, caution: 1, answers: 1 }, () => 0.5)).ok).toBe(true);
	});
	it("refuses a card no catalogue knows", () => {
		expect(() => apply(board({ you: { hand: ["unknown"] } }), { type: "place", card: "unknown", row: "monsters", zone: 0 })).toThrow(/unknown/);
	});
});
