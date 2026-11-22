import { describe, expect, it } from "vitest";
import { apply, atkOf, board, defOf, legalMoves, type Board, type Move } from "@duel-academy/engine";

/** The six icons of Spells and Traps: Quick-Play, Counter, Continuous and Equip, beside Normal, Field and Ritual. */
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

describe("a Quick-Play Spell", () => {
	const setUp = () => play(board({ full: true, you: { hand: ["spark-dash"], monsters: ["river-otter"] }, rival: { monsters: ["iron-boar"] } }), { type: "place", card: "spark-dash", row: "backrow", zone: 0, set: true });
	it("can be Set face-down; a Normal Spell cannot", () => {
		expect(setUp().you.backrow[0]).toEqual({ card: "spark-dash", setThisTurn: true });
		expect(reason(board({ you: { hand: ["glow-charm"] } }), { type: "place", card: "glow-charm", row: "backrow", zone: 0, set: true })).toBe("cannot-set");
	});
	it("cannot be activated the turn it was Set", () => {
		expect(reason(setUp(), { type: "spring", zone: 0, target: 0 })).toBe("trap-just-set");
	});
	it("answers an attack on the next turn: the boost lands before the battle", () => {
		const attacked = play(setUp(), { type: "phase", to: "end" }, { type: "attack", attacker: 0, target: 0 });
		expect(attacked.pending).toMatchObject({ kind: "attack" });
		const answered = ok(attacked, { type: "spring", zone: 0, target: 0 });
		expect(answered.events.map((event) => event.type)).toEqual(["activated", "boosted", "battle", "lp"]);
		expect(answered.board.rival.monsters[0]).toBeNull();
		expect(answered.board.you.monsters[0]?.card).toBe("river-otter");
		expect(answered.board.you.graveyard).toEqual(["spark-dash"]);
	});
	it("destroys the attacker in answer, and its attack never happens", () => {
		const start = play(board({ full: true, you: { hand: ["thunder-clap"], monsters: ["pocket-cub"] }, rival: { monsters: ["shadow-wolf"] } }), { type: "place", card: "thunder-clap", row: "backrow", zone: 0, set: true }, { type: "phase", to: "end" }, { type: "attack", attacker: 0, target: 0 });
		const answered = ok(start, { type: "spring", zone: 0, target: 0 });
		expect(answered.board.rival.monsters[0]).toBeNull();
		expect(answered.board.pending).toBeNull();
		expect(answered.board.you.lp).toBe(4000);
		expect(answered.board.you.skipDraw).toBe(true);
	});
	it("can be activated from the hand in the Battle Phase", () => {
		const battle = board({ strict: true, phase: "battle", you: { hand: ["spark-dash"], monsters: ["pocket-cub"] } });
		expect(atkOf(play(battle, { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 }).you.monsters[0]!, battle)).toBe(1900);
	});
});

describe("a Counter Trap: Negate Attack", () => {
	it("negates the attack, then ends the Battle Phase: the second attack never comes", () => {
		const start = board({ full: true, turn: "rival", you: { monsters: ["pocket-cub"], backrow: ["negate-attack"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] }, phase: "battle" });
		const declared = play(start, { type: "attack", attacker: 0, target: 0 });
		const answered = ok(declared, { type: "spring", zone: 0 });
		expect(answered.events.map((event) => event.type)).toEqual(["sprung", "attack-stopped", "battle-ended", "phase"]);
		expect(answered.board.phase).toBe("main2");
		expect(reason(answered.board, { type: "attack", attacker: 1, target: 0 })).toBe("not-battle-phase");
	});
});

describe("a Continuous Spell: Banner of Courage", () => {
	it("stays face-up and adds ATK to every monster of its owner, during that player's Battle Phase only", () => {
		const start = board({ strict: true, full: true, you: { hand: ["banner-of-courage"], monsters: ["river-otter", "pocket-cub"] } });
		const placed = ok(start, { type: "place", card: "banner-of-courage", row: "backrow", zone: 2 });
		expect(placed.events.at(-1)).toEqual({ type: "stays", side: "you", card: "banner-of-courage" });
		expect(placed.board.you.backrow[2]).toMatchObject({ card: "banner-of-courage", open: true });
		expect(atkOf(placed.board.you.monsters[0]!, placed.board)).toBe(1500);
		const battle = play(placed.board, { type: "phase", to: "battle" });
		expect(battle.you.monsters.slice(0, 2).map((slot) => atkOf(slot!, battle))).toEqual([1700, 1400]);
		const theirTurn = play(battle, { type: "phase", to: "end" }, { type: "phase", to: "battle" });
		expect(atkOf(theirTurn.you.monsters[0]!, theirTurn)).toBe(1500);
	});
	it("cannot be flipped again: it is already face-up", () => {
		const placed = play(board({ full: true, you: { hand: ["banner-of-courage"] } }), { type: "place", card: "banner-of-courage", row: "backrow", zone: 0 });
		expect(reason(placed, { type: "spring", zone: 0 })).toBe("nothing-to-answer");
	});
});

describe("an Equip Spell: Legendary Sword", () => {
	const start = () => board({ full: true, you: { hand: ["legendary-sword"], monsters: ["masaki", "pebble-crab"] }, rival: { monsters: ["shadow-wolf"] } });
	it("is equipped only to a Warrior", () => {
		expect(reason(start(), { type: "place", card: "legendary-sword", row: "backrow", zone: 0, target: 1 })).toBe("equip-only");
	});
	it("gives ATK and DEF while it stays, linked to its monster", () => {
		const equipped = ok(start(), { type: "place", card: "legendary-sword", row: "backrow", zone: 0, target: 0 });
		expect(equipped.events.at(-1)).toEqual({ type: "equipped", side: "you", card: "legendary-sword", target: "masaki" });
		const slot = equipped.board.you.monsters[0]!;
		expect([atkOf(slot, equipped.board), defOf(slot, equipped.board)]).toEqual([1400, 1400]);
	});
	it("is destroyed when its monster leaves the field", () => {
		const equipped = play(start(), { type: "place", card: "legendary-sword", row: "backrow", zone: 0, target: 0 }, { type: "attack", attacker: 0, target: 0 });
		expect(equipped.you.monsters[0]).toBeNull();
		expect(equipped.you.backrow[0]).toBeNull();
		expect(equipped.you.graveyard).toEqual(["masaki", "legendary-sword"]);
	});
});

describe("a Continuous Trap: Call of the Haunted", () => {
	const start = () => board({ strict: true, full: true, you: { backrow: ["call-of-the-haunted"], graveyard: ["storm-stag", "glow-charm"] }, rival: { monsters: ["iron-boar"] } });
	it("Special Summons a monster from its owner's Graveyard in the Main Phase, and stays", () => {
		const flipped = ok(start(), { type: "spring", zone: 0, grave: { side: "you", index: 0 } });
		expect(flipped.board.you.monsters[0]).toMatchObject({ card: "storm-stag", position: "attack" });
		expect(flipped.board.you.backrow[0]).toMatchObject({ card: "call-of-the-haunted", open: true, haunt: 0 });
		expect(reason(start(), { type: "spring", zone: 0, grave: { side: "you", index: 1 } })).toBe("no-target");
		expect(reason(start(), { type: "spring", zone: 0, grave: { side: "rival", index: 0 } })).toBe("no-target");
	});
	it("is destroyed when that monster is destroyed", () => {
		const fought = play(start(), { type: "spring", zone: 0, grave: { side: "you", index: 0 } }, { type: "phase", to: "battle" }, { type: "phase", to: "end" }, { type: "attack", attacker: 0, target: 0 });
		expect(fought.rival.monsters[0]).toBeNull();
		const lost = play(board({ strict: true, full: true, you: { backrow: ["call-of-the-haunted"], graveyard: ["pocket-cub"] }, rival: { monsters: ["iron-boar"] } }), { type: "spring", zone: 0, grave: { side: "you", index: 0 } }, { type: "phase", to: "end" }, { type: "attack", attacker: 0, target: 0 });
		expect(lost.you.monsters[0]).toBeNull();
		expect(lost.you.backrow[0]).toBeNull();
		expect(lost.you.graveyard).toEqual(["pocket-cub", "call-of-the-haunted"]);
	});
	it("is offered with every monster of the Graveyard when the moves are listed", () => {
		expect(legalMoves(start())).toContainEqual({ type: "spring", zone: 0, grave: { side: "you", index: 0 } });
	});
});
