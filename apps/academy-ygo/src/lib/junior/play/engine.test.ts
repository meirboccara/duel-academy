import { describe, expect, it } from "vitest";
import { apply, board, legalMoves, type Board, type Move, type Setup } from "./engine";

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`rejected: ${result.reason}`);
	return result;
}
function reason(state: Board, move: Move) {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
}
const fight = (you: Setup["you"], rival: Setup["rival"], extra: Partial<Setup> = {}) => board({ you, rival, phase: "battle", ...extra });

describe("battle between two Attack Position monsters", () => {
	it("destroys the weaker monster and its owner loses the difference", () => {
		const start = fight({ monsters: ["lantern-owl"] }, { monsters: ["thorn-fox"] });
		const { board: after, events } = ok(start, { type: "attack", attacker: 0, target: 0 });
		expect(after.rival.monsters[0]).toBeNull();
		expect(after.rival.graveyard).toEqual(["thorn-fox"]);
		expect(after.rival.lp).toBe(3600);
		expect(after.you.lp).toBe(4000);
		expect(events).toContainEqual({ type: "battle", side: "you", attacker: "lantern-owl", attackerValue: 1800, defender: "thorn-fox", defenderValue: 1400, defenderPosition: "attack", damage: { side: "rival", amount: 400 }, destroyed: [{ side: "rival", card: "thorn-fox" }] });
	});
	it("turns against a weaker attacker", () => {
		const { board: after } = ok(fight({ monsters: ["pocket-cub"] }, { monsters: ["thorn-fox"] }), { type: "attack", attacker: 0, target: 0 });
		expect(after.you.monsters[0]).toBeNull();
		expect(after.you.lp).toBe(3800);
		expect(after.rival.monsters[0]?.card).toBe("thorn-fox");
	});
	it("destroys both on equal ATK and nobody loses Life Points", () => {
		const { board: after } = ok(fight({ monsters: ["river-otter"] }, { monsters: ["bramble-ram"] }), { type: "attack", attacker: 0, target: 0 });
		expect(after.you.monsters[0]).toBeNull();
		expect(after.rival.monsters[0]).toBeNull();
		expect([after.you.lp, after.rival.lp]).toEqual([4000, 4000]);
	});
	it("lets each monster attack once per turn", () => {
		const start = fight({ monsters: ["lantern-owl"] }, { monsters: ["thorn-fox", "night-bat"] });
		const { board: after } = ok(start, { type: "attack", attacker: 0, target: 0 });
		expect(reason(after, { type: "attack", attacker: 0, target: 1 })).toBe("already-attacked");
	});
});

describe("attacking a Defense Position monster", () => {
	it("destroys it without damage when ATK is higher than DEF", () => {
		const { board: after } = ok(fight({ monsters: ["lantern-owl"] }, { monsters: [{ card: "pebble-crab", position: "defense" }] }), { type: "attack", attacker: 0, target: 0 });
		expect(after.rival.monsters[0]).toBeNull();
		expect(after.rival.lp).toBe(4000);
	});
	it("hurts the attacker's owner when ATK is lower than DEF, and destroys nothing", () => {
		const { board: after } = ok(fight({ monsters: ["pocket-cub"] }, { monsters: [{ card: "pebble-crab", position: "defense" }] }), { type: "attack", attacker: 0, target: 0 });
		expect(after.you.lp).toBe(3700);
		expect(after.you.monsters[0]?.card).toBe("pocket-cub");
		expect(after.rival.monsters[0]?.card).toBe("pebble-crab");
	});
	it("does nothing when ATK equals DEF", () => {
		const { board: after } = ok(fight({ monsters: ["river-otter"] }, { monsters: [{ card: "pebble-crab", position: "defense" }] }), { type: "attack", attacker: 0, target: 0 });
		expect(after.rival.monsters[0]?.card).toBe("pebble-crab");
		expect([after.you.lp, after.rival.lp]).toEqual([4000, 4000]);
	});
	it("refuses an attack by a Defense Position monster", () => {
		expect(reason(fight({ monsters: [{ card: "lantern-owl", position: "defense" }] }, { monsters: ["thorn-fox"] }), { type: "attack", attacker: 0, target: 0 })).toBe("defense-cannot-attack");
	});
});

describe("direct attacks and Life Points", () => {
	it("refuses a direct attack while the opponent controls a monster", () => {
		expect(reason(fight({ monsters: ["lantern-owl"] }, { monsters: ["mud-toad"] }), { type: "attack", attacker: 0, target: "direct" })).toBe("monster-in-the-way");
	});
	it("takes the full ATK from Life Points and wins at 0", () => {
		const { board: after, events } = ok(fight({ monsters: ["lantern-owl"] }, { lp: 1500 }), { type: "attack", attacker: 0, target: "direct" });
		expect(after.rival.lp).toBe(0);
		expect(after.winner).toBe("you");
		expect(events.at(-1)).toEqual({ type: "won", side: "you" });
		expect(legalMoves(after)).toEqual([]);
	});
	it("allows no attack on the very first turn of a duel", () => {
		expect(reason(fight({ monsters: ["lantern-owl"] }, {}, { turnNumber: 1 }), { type: "attack", attacker: 0, target: "direct" })).toBe("first-turn-no-battle");
	});
});
