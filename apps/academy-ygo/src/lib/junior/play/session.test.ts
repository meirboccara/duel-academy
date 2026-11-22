import { describe, expect, it } from "vitest";
import type { Move } from "@duel-academy/engine";
import { DEMOS, LEVELS, RULE_IDS, levelById, type Level } from "./levels";
import { demoFrames, hint, next, outcome, play, restart, start, undo, type Session } from "./session";

const level = (id: string): Level => {
	const found = levelById(id);
	if (!found) throw new Error(`no level ${id}`);
	return found;
};
const attack = (attacker: number, target: number | "direct"): Move => ({ type: "attack", attacker, target });
const end: Move = { type: "phase", to: "end" };
/** Plays the player's moves, letting the rival take every step it has in between. */
function run(session: Session, moves: readonly Move[]): Session {
	let current = session;
	const rival = () => {
		while (current.status === "rival") current = next(current);
	};
	rival();
	for (const move of moves) {
		current = play(current, move);
		rival();
	}
	return current;
}

describe("a level session", () => {
	it("is solved by the right attack, on the first try", () => {
		const done = play(start(level("w1-clash")), attack(1, 0));
		expect(done.status).toBe("solved");
		expect(outcome(done)).toEqual({ tries: 1, firstTry: true, clean: true, hints: 0, slips: [] });
	});
	it("plays a losing attack out, then lets the child go back one step", () => {
		const failed = play(start(level("w1-clash")), attack(0, 0));
		expect(failed.status).toBe("failed");
		expect(failed.fail).toBe("monster-lost");
		expect(failed.board.you.monsters[0]).toBeNull();
		expect(failed.events.map((event) => event.type)).toContain("battle");
		const back = undo(failed);
		expect(back.status).toBe("playing");
		expect(back.board.you.monsters[0]?.card).toBe("pocket-cub");
		const done = play(back, attack(1, 0));
		expect(outcome(done)).toMatchObject({ tries: 2, firstTry: false, clean: true });
	});
	it("refuses a move that breaks a rule, keeps the board, and remembers which rule", () => {
		const first = start(level("w2-lantern"));
		const refused = play(first, attack(1, "direct"));
		expect(refused.rejected).toBe("monster-in-the-way");
		expect(refused.board).toEqual(first.board);
		expect(refused.status).toBe("playing");
		const done = run(refused, level("w2-lantern").solution);
		expect(done.status).toBe("solved");
		expect(outcome(done)).toMatchObject({ firstTry: false, slips: ["monster-in-the-way"] });
	});
	it("fails when nothing useful is left to do", () => {
		/* Otter's ATK equals Crab's DEF: nothing happens, and the wall can no longer be broken. */
		const stuck = run(start(level("w2-boss")), [attack(1, 1), attack(2, 1), attack(0, 0)]);
		expect(stuck.status).toBe("failed");
		expect(stuck.fail).toBe("out-of-moves");
	});
	it("does not call it a first try when the child started over after a move", () => {
		const again = restart(play(start(level("w2-lantern")), attack(0, 0)));
		const done = run(again, level("w2-lantern").solution);
		expect(outcome(done)).toMatchObject({ tries: 1, firstTry: false, clean: true });
	});
	it("starts over from the first board and counts another try", () => {
		const again = restart(play(start(level("w1-clash")), attack(0, 0)));
		expect(again.status).toBe("playing");
		expect(again.board).toEqual(start(level("w1-clash")).board);
		expect(again.stats.tries).toBe(2);
	});
});

describe("the rival's turn", () => {
	it("is taken one step at a time, and the result is judged when it ends", () => {
		const waiting = run(start(level("w2-crouch")), []);
		const ended = play(play(waiting, { type: "position", zone: 0 }), end);
		expect(ended.status).toBe("rival");
		const attacked = next(ended);
		expect(attacked.events.map((event) => event.type)).toEqual(["attack-declared", "battle", "lp"]);
		expect(attacked.board.rival.lp).toBe(3700);
		expect(attacked.status).toBe("rival");
		expect(next(attacked).status).toBe("solved");
	});
	it("fails a level about keeping Life Points when they are lost", () => {
		const done = run(start(level("w2-crouch")), [end]);
		expect(done.status).toBe("failed");
		expect(done.fail).toBe("monster-lost");
	});
	it("freezes on an attack the child can answer with a Set Trap", () => {
		const moves = level("w4-ambush").solution;
		const frozen = run(start(level("w4-ambush")), moves.slice(0, -1));
		expect(frozen.status).toBe("answer");
		expect(frozen.board.pending).toMatchObject({ kind: "attack" });
		const passed = run(frozen, [{ type: "pass" }]);
		expect(passed.status).toBe("failed");
		expect(run(frozen, [{ type: "spring", zone: 0 }]).status).toBe("solved");
	});
	it("lets the rival attack directly when its target has left the field", () => {
		const done = run(start(level("w2-wall")), [end]);
		expect(done.board.you.lp).toBe(4000 - 500 - 1400);
		expect(done.status).toBe("failed");
	});
	it("starts on the rival's turn when the level does", () => {
		const first = start(level("w6-tower"));
		expect(first.status).toBe("rival");
		expect(next(first).status).toBe("answer");
	});
});

describe("Main Phase 2", () => {
	it("is where the child Summons once a battle has freed a zone: in Main Phase 1 every zone is taken", () => {
		const first = start(level("w6-main2"));
		expect(play(first, { type: "place", card: "lantern-owl", row: "monsters", zone: 0 }).rejected).toBe("zone-taken");
		const done = run(first, level("w6-main2").solution);
		expect(done.status).toBe("solved");
		expect(done.board.phase).toBe("main2");
	});
});

describe("the rival answering the child", () => {
	it("flips its Set Trap when the child activates a Spell: the cost stays paid and the Spell does nothing", () => {
		const cast = play(start(level("r-paid")), { type: "place", card: "spark-trade", row: "backrow", zone: 0, discard: "mud-toad", target: 0 });
		expect(cast.status).toBe("rival");
		expect(cast.events.map((event) => event.type)).toEqual(["activated", "discarded", "chain", "window"]);
		const answered = next(cast);
		expect(answered.status).toBe("playing");
		expect(answered.events.map((event) => event.type)).toEqual(["sprung", "chain", "resolve", "returned", "resolve", "no-effect"]);
		expect(answered.board.you.graveyard).toEqual(["mud-toad", "spark-trade"]);
		expect(answered.board.rival.monsters).toEqual([null, null, null]);
	});
	it("saves its strongest Monster when the child's Spell targets the child's own Monster", () => {
		const base = levelById("r-target")!;
		const level = { ...base, setup: { ...base.setup, you: { hand: ["spark-dash"] as const, monsters: ["river-otter"] as const }, rival: { monsters: ["mud-toad", "shadow-wolf"] as const, backrow: ["quick-burrow"] as const } } };
		const answered = next(play(start(level), { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 }));
		expect(answered.board.rival.hand).toEqual(["shadow-wolf"]);
		expect(answered.board.rival.monsters[0]?.card).toBe("mud-toad");
	});
	it("saves the Monster a targeting Spell aims at", () => {
		const level = { ...levelById("r-target")!, setup: { ...levelById("r-target")!.setup, rival: { lp: 1500, monsters: ["shadow-wolf", "mud-toad"] as const, backrow: ["quick-burrow"] as const } } };
		const answered = next(play(start(level), { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 }));
		expect(answered.board.rival.hand).toEqual(["shadow-wolf"]);
		expect(answered.board.rival.monsters[1]?.card).toBe("mud-toad");
	});
});

describe("hints", () => {
	it("gives the next move of a line that solves the level, also after a different start", () => {
		const first = start(level("w2-boss"));
		const { move, session } = hint(play(first, attack(0, 0)));
		expect(move).toEqual(attack(2, 1));
		expect(session.stats.hints).toBe(1);
		const done = run(session, [attack(2, 1), attack(1, "direct")]);
		expect(done.status).toBe("solved");
		expect(outcome(done)).toMatchObject({ clean: false, firstTry: false, hints: 1 });
	});
	it("has no move to give when the level can no longer be solved from here", () => {
		const wasted = play(start(level("w2-boss")), attack(1, 1));
		expect(hint(wasted).move).toBeNull();
	});
});

describe("every level", () => {
	it.each(LEVELS.filter((item) => !item.duel).map((item) => [item.id, item] as const))("%s is solved by its recorded solution", (_id, item) => {
		const done = run(start(item), item.solution);
		expect(done.rejected).toBeNull();
		expect(done.status).toBe("solved");
	});
	it.each(LEVELS.filter((item) => !item.open).map((item) => [item.id, item] as const))("%s can be solved from the start by search", (_id, item) => {
		expect(hint(run(start(item), [])).move).not.toBeNull();
	});
	it("has a unique id, and every rule is taught exactly once before it is used", () => {
		expect(new Set(LEVELS.map((item) => item.id)).size).toBe(LEVELS.length);
		const taught: string[] = [];
		for (const item of LEVELS) {
			for (const rule of item.uses) expect(taught, `${item.id} uses ${rule}`).toContain(rule);
			if (item.teaches) taught.push(item.teaches);
		}
		expect(taught).toEqual([...RULE_IDS]);
	});
	it("the rival duel is won on the third turn by the recorded line", () => {
		const done = run(start(level("w7-duel")), level("w7-duel").solution);
		expect(done.board.winner).toBe("you");
		expect(done.board.turnNumber).toBe(5);
		expect(done.board.you.lp).toBe(3700);
	});
	it("the Extra Deck duel is won on the third turn by the recorded line, without losing a Life Point", () => {
		const done = run(start(level("x-duel")), level("x-duel").solution);
		expect(done.board.winner).toBe("you");
		expect(done.board.turnNumber).toBe(5);
		/* Draining Shield stopped Battle Ox's attack and gave its 1700 ATK as Life Points. */
		expect(done.board.you.lp).toBe(5700);
	});
});

describe("the rival's Extra Deck", () => {
	const duel = level("x-duel");
	const firstTurn: Move[] = [{ type: "phase", to: "main1" }, { type: "place", card: "tune-warrior", row: "monsters", zone: 0 }, end];
	it("is used: Nox Fusion Summons with Polymerization on its first turn, with materials from its hand", () => {
		let current = play(play(play(start(duel), firstTurn[0]!), firstTurn[1]!), firstTurn[2]!);
		expect(current.status).toBe("rival");
		current = next(current);
		expect(current.events).toContainEqual({ type: "special", side: "rival", card: "flame-swordsman", zone: 0, how: "fusion", materials: ["flame-manipulator", "masaki"] });
		expect(current.board.rival.extra).toEqual(["gem-knight-pearl"]);
	});
	it("Xyz Summons on Nox's second turn when its two Level 4 Monsters are still there", () => {
		const idle: Move[] = [{ type: "draw" }, end];
		const done = run(start(duel), [...firstTurn, ...idle]);
		expect(done.board.rival.monsters.some((slot) => slot?.card === "gem-knight-pearl" && slot.materials?.length === 2)).toBe(true);
	});
	it("skips a Summon whose materials are gone", () => {
		const done = run(start(duel), duel.solution.slice(0, -2));
		expect(done.board.rival.extra).toEqual(["gem-knight-pearl"]);
	});
});

describe("demonstrations", () => {
	it.each(RULE_IDS.map((rule) => [rule] as const))("%s plays every move through the rules engine", (rule) => {
		const frames = demoFrames(DEMOS[rule]);
		expect(frames).toHaveLength(DEMOS[rule].moves.length + 1);
		expect(frames[0]?.events).toEqual([]);
		for (const frame of frames.slice(1)) expect(frame.events.length).toBeGreaterThan(0);
	});
	it("shows the subtraction of a battle", () => {
		expect(demoFrames(DEMOS.battle)[1]?.events).toContainEqual(expect.objectContaining({ type: "battle", attackerValue: 1500, defenderValue: 1100, damage: { side: "rival", amount: 400 } }));
	});
});
