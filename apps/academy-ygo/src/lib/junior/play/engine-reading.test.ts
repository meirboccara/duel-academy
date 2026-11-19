import { describe, expect, it } from "vitest";
import { apply, board, legalMoves, type Board, type Move } from "./engine";

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`rejected: ${result.reason}`);
	return result;
}
function reason(state: Board, move: Move) {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
}
const cards = (state: Board, who: "you" | "rival") => state[who].monsters.map((slot) => slot?.card ?? null);

describe("a card that does not say Target", () => {
	const start = () => board({ full: true, you: { hand: ["fissure"] }, rival: { monsters: ["shadow-wolf", "mud-toad"] } });
	it("chooses by itself: Fissure destroys the lowest ATK, whatever the player points at", () => {
		const { board: after } = ok(start(), { type: "place", card: "fissure", row: "backrow", zone: 0, target: 0 });
		expect(cards(after, "rival").slice(0, 2)).toEqual(["shadow-wolf", null]);
	});
	it("lets the player choose only between monsters that are tied", () => {
		const tied = board({ full: true, you: { hand: ["fissure"] }, rival: { monsters: ["river-otter", "bramble-ram", "shadow-wolf"] } });
		const { board: after } = ok(tied, { type: "place", card: "fissure", row: "backrow", zone: 0, target: 1 });
		expect(cards(after, "rival").slice(0, 3)).toEqual(["river-otter", null, "shadow-wolf"]);
	});
	it("cannot be activated with nothing to destroy", () => {
		expect(reason(board({ full: true, you: { hand: ["fissure"] } }), { type: "place", card: "fissure", row: "backrow", zone: 0 })).toBe("nothing-to-hit");
	});
});

describe('"then"', () => {
	it("does the first part, then the second: Upstart Goblin draws, then the opponent gains 1000 LP", () => {
		const state = board({ full: true, you: { hand: ["upstart-goblin"], deck: ["thunder-clap"] }, rival: { lp: 800 } });
		const { board: after, events } = ok(state, { type: "place", card: "upstart-goblin", row: "backrow", zone: 0 });
		expect(after.you.hand).toEqual(["thunder-clap"]);
		expect(after.rival.lp).toBe(1800);
		expect(events.map((event) => event.type)).toEqual(["activated", "drew", "gained"]);
		expect(events[2]).toEqual({ type: "gained", side: "rival", amount: 1000, lp: 1800 });
	});
	it("cannot be activated with no card to draw", () => {
		const state = board({ full: true, you: { hand: ["upstart-goblin"] } });
		expect(reason(state, { type: "place", card: "upstart-goblin", row: "backrow", zone: 0 })).toBe("deck-too-small");
	});
});

describe("a condition with no colon", () => {
	const special = (zone = 0): Move => ({ type: "place", card: "cyber-dragon", row: "monsters", zone, special: true });
	it("lets Cyber Dragon be Special Summoned from the hand while only the opponent controls a monster", () => {
		const state = board({ full: true, you: { hand: ["cyber-dragon", "river-otter"] }, rival: { monsters: ["thorn-fox"] } });
		const { board: after, events } = ok(state, special());
		expect(cards(after, "you")[0]).toBe("cyber-dragon");
		expect(after.summonUsed).toBe(false);
		expect(events).toEqual([{ type: "special", side: "you", card: "cyber-dragon", zone: 0, how: "own", materials: [] }]);
		expect(reason(after, { type: "place", card: "river-otter", row: "monsters", zone: 1, tributes: [] })).toBe("accepted");
	});
	it("is checked when it is used: with a monster of your own, or an empty field opposite, it is refused", () => {
		const mine = board({ full: true, you: { hand: ["cyber-dragon"], monsters: ["river-otter"] }, rival: { monsters: ["thorn-fox"] } });
		expect(reason(mine, special(1))).toBe("condition-not-met");
		expect(reason(board({ full: true, you: { hand: ["cyber-dragon"] } }), special())).toBe("condition-not-met");
	});
	it("still needs a Tribute for a Normal Summon", () => {
		const state = board({ full: true, you: { hand: ["cyber-dragon"] }, rival: { monsters: ["thorn-fox"] } });
		expect(reason(state, { type: "place", card: "cyber-dragon", row: "monsters", zone: 0, tributes: [] })).toBe("wrong-tributes");
	});
});

describe("a Quick Effect in the hand", () => {
	const start = () => board({ full: true, turn: "rival", you: { lp: 2000, hand: ["kuriboh"], monsters: ["pocket-cub"] }, rival: { monsters: ["shadow-wolf"] } });
	it("freezes the attack so Kuriboh can be discarded: no battle damage, but the battle still happens", () => {
		const attacked = ok(start(), { type: "attack", attacker: 0, target: 0 });
		expect(attacked.board.pending).not.toBeNull();
		expect(legalMoves(attacked.board)).toContainEqual({ type: "hand", card: "kuriboh" });
		const { board: after, events } = ok(attacked.board, { type: "hand", card: "kuriboh" });
		expect(after.you.lp).toBe(2000);
		expect(after.you.hand).toEqual([]);
		expect(after.you.graveyard).toEqual(["kuriboh", "pocket-cub"]);
		expect(events[0]).toEqual({ type: "hand-effect", side: "you", card: "kuriboh" });
		expect(events).toContainEqual(expect.objectContaining({ type: "battle", damage: null, destroyed: [{ side: "you", card: "pocket-cub" }] }));
	});
	it("stops the damage of a direct attack too", () => {
		const alone = board({ full: true, turn: "rival", you: { lp: 2000, hand: ["kuriboh"] }, rival: { monsters: ["shadow-wolf"] } });
		const attacked = ok(alone, { type: "attack", attacker: 0, target: "direct" });
		expect(ok(attacked.board, { type: "hand", card: "kuriboh" }).board.you.lp).toBe(2000);
	});
	it("is not usable on your own turn with nothing to answer", () => {
		const mine = board({ full: true, you: { hand: ["kuriboh"] }, rival: { monsters: ["shadow-wolf"] } });
		expect(reason(mine, { type: "hand", card: "kuriboh" })).toBe("nothing-to-answer");
	});
});

describe("a cost that fills the Graveyard", () => {
	it("discards for Lightning Vortex, and the discarded monster can then be brought back by Monster Reborn", () => {
		const state = board({ full: true, you: { hand: ["lightning-vortex", "monster-reborn", "storm-stag"] }, rival: { monsters: ["iron-boar", "thorn-fox"] } });
		const cleared = ok(state, { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "storm-stag" }).board;
		expect(cards(cleared, "rival").filter(Boolean)).toEqual([]);
		const after = ok(cleared, { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 0 } }).board;
		expect(cards(after, "you")[0]).toBe("storm-stag");
	});
	it("cannot be paid by the last card in the hand", () => {
		const state = board({ full: true, you: { hand: ["lightning-vortex"] }, rival: { monsters: ["iron-boar"] } });
		expect(reason(state, { type: "place", card: "lightning-vortex", row: "backrow", zone: 0 })).toBe("cost-needed");
	});
});
