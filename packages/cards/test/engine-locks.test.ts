import { describe, expect, it } from "vitest";
import { apply, board, type Board, type Move, type Setup } from "@duel-academy/engine";

/** Quick Effects that answer what just happened, and "for the rest of this turn" locks. Texts in card-art.ts. */
function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`refused: ${result.reason}`);
	return result;
}
const play = (state: Board, ...moves: Move[]) => moves.reduce((current, move) => ok(current, move).board, state);
const reason = (state: Board, move: Move) => {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
};
const mat = (setup: Setup) => board({ full: true, ...setup });
const cast = (card: string, extra: Record<string, unknown> = {}) => ({ type: "place", card, row: "backrow", zone: 0, ...extra }) as Move;
const summon = (card: string, zone = 0) => ({ type: "place", card, row: "monsters", zone, tributes: [] }) as Move;
const droll: Move = { type: "hand", card: "droll-lock-bird" };
const pass: Move = { type: "pass" };

describe("Droll & Lock Bird", () => {
	const start = (you: Setup["you"] = {}) => mat({ you: { hand: ["reinforcement-of-the-army", "pot-of-greed", "elemental-hero-blazeman"], deck: ["elemental-hero-sparkman", "polymerization", "iron-boar", "celtic-guardian"], ...you }, rival: { hand: ["droll-lock-bird"], deck: ["iron-boar", "iron-boar"] } });
	it("answers a card added from the Deck to the opponent's hand, then nothing more can be added this turn", () => {
		const added = ok(start(), cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }));
		expect(added.board.you.hand).toContain("elemental-hero-sparkman");
		expect(added.board.pending).toEqual({ kind: "added", side: "you" });
		expect(added.events.at(-1)).toEqual({ type: "window", side: "rival", kind: "added" });
		const locked = play(added.board, droll);
		expect(locked.pending).toBeNull();
		expect(locked.rival.graveyard).toEqual(["droll-lock-bird"]);
		expect(locked.locks).toEqual([{ kind: "deck-to-hand", by: "droll-lock-bird" }]);
		/* Pot of Greed could only draw: it cannot be activated. */
		expect(reason(locked, cast("pot-of-greed", { zone: 1 }))).toBe("deck-locked");
		/* Blazeman is still Summoned; its search finds nothing to do. */
		const summoned = play(locked, summon("elemental-hero-blazeman"));
		expect(summoned.you.monsters[0]?.card).toBe("elemental-hero-blazeman");
		expect(summoned.you.hand).not.toContain("polymerization");
	});
	it("lets the turn player go on when the opponent does not use it", () => {
		const passed = play(start(), cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }), pass);
		expect(passed.pending).toBeNull();
		expect(passed.locks).toEqual([]);
		expect(play(passed, cast("pot-of-greed", { zone: 1 })).you.hand).toHaveLength(4);
	});
	it("answers a draw in the Main Phase, never the draw of the Draw Phase", () => {
		const drawn = ok(start(), cast("pot-of-greed"));
		expect(drawn.board.pending).toEqual({ kind: "added", side: "you" });
		const drawPhase = mat({ phase: "draw", you: { deck: ["iron-boar"] }, rival: { hand: ["droll-lock-bird"] } });
		expect(play(drawPhase, { type: "draw" }).pending).toBeNull();
	});
	it("the lock ends with the turn", () => {
		const locked = play(start(), cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }), droll, { type: "phase", to: "end" });
		expect(locked.turn).toBe("rival");
		expect(locked.locks).toEqual([]);
	});
	it("opens no moment for a player who holds no Droll", () => {
		const plain = mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman"] }, rival: { hand: ["iron-boar"] } });
		expect(play(plain, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" })).pending).toBeNull();
	});
});
