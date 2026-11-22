import { describe, expect, it } from "vitest";
import { actor, apply, board, type Board, type Move, type Setup } from "@duel-academy/engine";

/**
 * Cards used "at any time": a Quick-Play Spell from the hand in any phase of its owner's turn, and the opponent's
 * chance in each phase of the turn (a Set Quick-Play Spell, Infinite Impermanence, Mulcharmy Fuwalos, Effect Veiler).
 */
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
const mat = (setup: Setup) => board({ full: true, strict: true, ...setup });
const curtain = (zone = 0): Move => ({ type: "place", card: "dark-magical-curtain", row: "backrow", zone });

describe("a Quick-Play Spell from the hand, in any phase of its owner's turn", () => {
	it("Dark Magical Curtain in the Draw Phase, once the card is drawn, and the phase does not change", () => {
		const start = mat({ phase: "draw", turnNumber: 3, you: { hand: ["dark-magical-curtain"], deck: ["dark-magician", "pot-of-greed"] }, rival: { deck: ["iron-boar"] } });
		expect(reason(start, curtain())).toBe("draw-first");
		const drawn = play(start, { type: "draw" });
		const done = play(drawn, curtain());
		expect(done.phase).toBe("draw");
		expect(done.you.monsters.some((slot) => slot?.card === "dark-magician")).toBe(true);
	});
	it("in the Standby Phase too, but a Normal Spell still waits for a Main Phase", () => {
		const standby = play(mat({ phase: "draw", turnNumber: 3, you: { hand: ["dark-magical-curtain", "pot-of-greed"], deck: ["dark-magician", "iron-boar", "mud-toad", "pebble-crab"] } }), { type: "draw" }, { type: "phase", to: "standby" });
		expect(reason(standby, { type: "place", card: "pot-of-greed", row: "backrow", zone: 0 })).toBe("not-main-phase");
		expect(play(standby, curtain(1)).phase).toBe("standby");
	});
});

describe("the opponent's chance in each phase of the turn", () => {
	const rivalTurn = (you: Setup["you"], rival: Setup["rival"] = {}) => mat({ turn: "rival", phase: "draw", turnNumber: 4, you, rival: { deck: ["iron-boar", "mud-toad", "pebble-crab"], ...rival } });
	it("opens after the turn player draws only when the other player holds a card for it", () => {
		expect(play(rivalTurn({ hand: ["iron-boar"] }), { type: "draw" }).pending).toBeNull();
		const open = ok(rivalTurn({ hand: ["mulcharmy-fuwalos"] }), { type: "draw" });
		expect(open.board.pending).toEqual({ kind: "open", phase: "draw" });
		expect(actor(open.board)).toBe("you");
		expect(open.events.at(-1)).toEqual({ type: "window", side: "you", kind: "open" });
		const passed = play(open.board, { type: "pass" });
		expect(passed.pending).toBeNull();
		expect(passed.phase).toBe("draw");
	});
	it("a Set Quick-Play Spell can be activated in the opponent's phase", () => {
		const drawn = play(rivalTurn({ backrow: ["dark-magical-curtain"], hand: [], deck: ["dark-magician"] }), { type: "draw" });
		expect(drawn.pending).toEqual({ kind: "open", phase: "draw" });
		/* Let go in the Draw Phase, it is offered again in the Standby Phase. */
		const open = play(drawn, { type: "pass" }, { type: "phase", to: "standby" });
		expect(open.pending).toEqual({ kind: "open", phase: "standby" });
		const done = play(open, { type: "spring", zone: 0 });
		expect(done.you.monsters.some((slot) => slot?.card === "dark-magician")).toBe(true);
	});
	it("Effect Veiler at the start of the opponent's Main Phase", () => {
		const open = play(rivalTurn({ hand: ["effect-veiler"] }, { monsters: ["elemental-hero-blazeman"] }), { type: "draw" }, { type: "phase", to: "main1" });
		expect(open.pending).toEqual({ kind: "open", phase: "main1" });
		const veiled = play(open, { type: "hand", card: "effect-veiler", target: 0 });
		expect(veiled.rival.monsters[0]?.negatedTurn).toBe(true);
	});
});

describe("Mulcharmy Fuwalos", () => {
	const fuwalos: Move = { type: "hand", card: "mulcharmy-fuwalos" };
	it("needs its owner to control no cards", () => {
		const covered = ok(mat({ turn: "rival", phase: "draw", turnNumber: 4, you: { hand: ["mulcharmy-fuwalos"], monsters: ["iron-boar"] }, rival: { deck: ["mud-toad"] } }), { type: "draw" });
		expect(covered.board.pending).toBeNull();
	});
	it("draws 1 card each time the opponent Special Summons from the Deck or the Extra Deck, this turn", () => {
		const start = mat({
			turn: "rival",
			phase: "draw",
			turnNumber: 4,
			you: { hand: ["mulcharmy-fuwalos"], deck: ["pot-of-greed", "raigeki", "dark-hole"] },
			rival: { hand: ["one-for-one", "iron-boar", "monster-reborn"], deck: ["mud-toad", "sage-with-eyes-of-blue"], graveyard: ["pebble-crab"] },
		});
		const used = play(start, { type: "draw" }, fuwalos);
		expect(used.you.graveyard).toEqual(["mulcharmy-fuwalos"]);
		const main = play(used, { type: "phase", to: "main1" });
		const fromDeck = play(main, { type: "place", card: "one-for-one", row: "backrow", zone: 0, discard: "iron-boar", pick: "sage-with-eyes-of-blue" });
		expect(fromDeck.you.hand).toEqual(["pot-of-greed"]);
		/* From the GY: no card. */
		const fromGy = play(fromDeck, { type: "place", card: "monster-reborn", row: "backrow", zone: 1, grave: { side: "rival", index: fromDeck.rival.graveyard.indexOf("pebble-crab") } });
		expect(fromGy.you.hand).toEqual(["pot-of-greed"]);
	});
	it("in the End Phase, shuffles the hand back down to the opponent's cards + 6", () => {
		const hand = ["mulcharmy-fuwalos", "iron-boar", "mud-toad", "pebble-crab", "pot-of-greed", "raigeki", "dark-hole", "monster-reborn", "celtic-guardian", "night-bat"] as const;
		const start = mat({ turn: "rival", phase: "draw", turnNumber: 4, you: { hand: [...hand], deck: [] }, rival: { deck: ["iron-boar"], monsters: ["mud-toad"] } });
		const used = play(start, { type: "draw" }, fuwalos);
		expect(used.you.hand).toHaveLength(9);
		const ended = play(used, { type: "phase", to: "end" });
		/* The rival controls 1 card: the hand goes down to 7, and 2 cards go back to the Deck. */
		expect(ended.you.hand).toHaveLength(7);
		expect(ended.you.deck).toHaveLength(2);
	});
	it("only 1 other Mulcharmy monster effect the turn it is used", () => {
		const start = mat({ turn: "rival", phase: "draw", turnNumber: 4, you: { hand: ["mulcharmy-fuwalos", "mulcharmy-fuwalos", "mulcharmy-fuwalos"] }, rival: { deck: ["iron-boar"] } });
		const twice = play(start, { type: "draw" }, fuwalos, { type: "phase", to: "standby" }, fuwalos);
		expect(twice.you.hand).toEqual(["mulcharmy-fuwalos"]);
		const third = play(twice, { type: "phase", to: "main1" });
		expect(third.pending).toBeNull();
	});
});
