import { describe, expect, it } from "vitest";
import { apply, board, type Board, type Move } from "./engine";
import { levelById } from "./levels";
import { next, play as playLevel, start } from "./session";

/** An attack in two steps (Rulebook v10 pp. 37-39): the Battle Step when it is declared, then the Damage Step. */
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
const attackOn = (setup: Parameters<typeof board>[0]) => play(board({ full: true, turn: "rival", phase: "battle", ...setup }), { type: "attack", attacker: 0, target: 0 });

describe("the Battle Step", () => {
	it("is when a Trap that answers a declared attack is flipped; Kuriboh must wait", () => {
		const declared = attackOn({ you: { hand: ["kuriboh"], monsters: ["pocket-cub"], backrow: ["sakuretsu-armor"] }, rival: { monsters: ["iron-boar"] } });
		expect(declared.pending).toEqual({ kind: "attack", attacker: 0, target: 0 });
		expect(reason(declared, { type: "hand", card: "kuriboh" })).toBe("not-damage-step");
		expect(ok(declared, { type: "spring", zone: 0 }).board.rival.monsters[0]).toBeNull();
	});
	it("goes straight on when nothing can answer in it", () => {
		const declared = attackOn({ you: { monsters: ["pocket-cub"] }, rival: { monsters: ["iron-boar"] } });
		expect(declared.pending).toBeNull();
		expect(declared.you.monsters[0]).toBeNull();
	});
});

describe("the Damage Step", () => {
	it("opens after the Battle Step when the defender can still act there", () => {
		const declared = attackOn({ you: { hand: ["kuriboh"], monsters: ["pocket-cub"], backrow: ["sakuretsu-armor"] }, rival: { monsters: ["iron-boar"] } });
		const passed = ok(declared, { type: "pass" });
		expect(passed.events.map((event) => event.type)).toEqual(["damage-step", "window"]);
		expect(passed.board.pending).toMatchObject({ kind: "attack", step: "damage" });
		expect(reason(passed.board, { type: "spring", zone: 0 })).toBe("damage-step-closed");
		const saved = ok(passed.board, { type: "hand", card: "kuriboh" });
		expect(saved.board.you.lp).toBe(4000);
		expect(saved.board.you.monsters[0]).toBeNull();
	});
	it("takes an ATK boost from a Set Quick-Play Spell, but not a Spell that destroys", () => {
		const boost = attackOn({ you: { hand: ["kuriboh"], monsters: ["river-otter"], backrow: ["spark-dash", "thunder-clap"] }, rival: { monsters: ["shadow-wolf"] } });
		const damage = play(boost, { type: "pass" });
		expect(reason(damage, { type: "spring", zone: 1, target: 0 })).toBe("damage-step-closed");
		const boosted = ok(damage, { type: "spring", zone: 0, target: 0 });
		expect(boosted.board.rival.monsters[0]).toBeNull();
		expect(boosted.board.you.monsters[0]).toBeNull();
	});
});

describe("the island of steps", () => {
	it("loses Silver Fang when only Kuriboh is used: a Trap had to act in the Battle Step", () => {
		const level = levelById("st-battle")!;
		const attacked = next(start(level));
		expect(attacked.status).toBe("answer");
		const damageStep = playLevel(attacked, { type: "pass" });
		const kuriboh = playLevel(damageStep, { type: "hand", card: "kuriboh" });
		expect(kuriboh.board.you.monsters[0]).toBeNull();
	});
});
