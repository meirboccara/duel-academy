import { describe, expect, it } from "vitest";
import { type CardDef, cites, type Duel } from "../../src";
import { offered, play, position, type SideSpec } from "./fixtures";

/**
 * The Battle Phase's steps outside an attack (RB10: Start Step, Battle Step, End Step; `Duel.battleStep`, src/chain.ts). Made-up cards:
 * a monster that attacks, a Quick-Play Spell that only writes its code in the log, and a monster whose mandatory trigger answers the
 * End Step beginning.
 */
function cards(log: string[]): Record<string, CardDef> {
	const logs = (code: string) => (duel: Duel) => (log.push(code), duel);
	return {
		"fixture-attacker": { code: "fixture-attacker", kind: "monster", facts: { level: 4, atk: 1500, def: 1000 } },
		"fixture-other-attacker": { code: "fixture-other-attacker", kind: "monster", facts: { level: 4, atk: 1200, def: 1000 } },
		"fixture-quick": { code: "fixture-quick", kind: "quick-play", effects: [{ type: "activation", operation: logs("fixture-quick") }] },
		// "At the end of the Battle Phase, ..." (a mandatory trigger on the End Step beginning).
		"fixture-end-watch": {
			code: "fixture-end-watch",
			kind: "monster",
			facts: { level: 4, atk: 0, def: 0 },
			effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "battle-step" && event.step === "end", operation: logs("fixture-end-watch") }],
		},
	};
}

const board = (log: string[], you: SideSpec, rival: SideSpec = {}): Duel => position({ defs: cards(log), you, rival });

describe("the Battle Phase's Start Step, Battle Step and End Step", () => {
	it(`${cites("rules", "battle-phase-steps")} ${cites("rules", "start-step")} ${cites("rules", "each-step-starts-open")} the Battle Phase begins with its Start Step: the turn player may use a fast effect there, but declares no attack before the Battle Step`, () => {
		const log: string[] = [];
		const start = play(board(log, { monsters: ["fixture-attacker"], set: ["fixture-quick"] }), "pass");
		expect([start.turn.phase, start.battleStep, start.priority.holder, start.priority.open]).toEqual(["battle", "start", "you", true]);
		expect(offered(start)).toEqual(["activate fixture-quick", "pass"]);
		// A fast effect resolves in the Start Step; with nothing left to do there, both pass and the Battle Step begins, where attacks are declared.
		const battle = play(start, "activate fixture-quick");
		expect([log, battle.turn.phase, battle.battleStep]).toEqual([["fixture-quick"], "battle", "battle"]);
		expect(offered(battle)).toEqual(["attack fixture-attacker directly", "pass"]);
	});
	it(`${cites("rules", "end-step")} the turn player passing in the Battle Step ends their attacks: the End Step opens, with no attack, its "end of the Battle Phase" triggers, then Main Phase 2`, () => {
		const log: string[] = [];
		const battle = play(board(log, { monsters: ["fixture-attacker", "fixture-end-watch"], set: ["fixture-quick"] }), "pass", "pass");
		expect(battle.battleStep).toBe("battle");
		// The End Step begins: its trigger goes on a chain, which the turn player may answer.
		const ending = play(battle, "pass");
		expect([ending.turn.phase, ending.battleStep, ending.chain.length]).toEqual(["battle", "end", 1]);
		const end = play(ending, "pass");
		expect([end.battleStep, end.chain.length, log]).toEqual(["end", 0, ["fixture-end-watch"]]);
		expect(offered(end)).toEqual(["activate fixture-quick", "pass"]);
		// After the chain, both pass once in the reopened game state (still the End Step, nothing new), then Main Phase 2.
		const reopened = play(end, "pass");
		expect([reopened.battleStep, reopened.priority.open]).toEqual(["end", true]);
		const main2 = play(reopened, "pass");
		expect([main2.turn.phase, main2.battleStep]).toEqual(["main2", null]);
	});
	it(`${cites("rules", "battle-phase-steps")} an attack over, the turn player is back in the Battle Step: another monster may attack, the End Step comes only when they pass`, () => {
		const log: string[] = [];
		const battle = play(board(log, { monsters: ["fixture-attacker", "fixture-other-attacker", "fixture-end-watch"], set: ["fixture-quick"] }), "pass", "pass");
		let attacked = play(battle, "attack fixture-attacker directly");
		for (let guard = 0; attacked.battle && guard < 20; guard++) attacked = play(attacked, "pass");
		expect([attacked.battle, attacked.battleStep, attacked.lp.rival, log]).toEqual([null, "battle", 6500, []]);
		expect(offered(attacked)).toContain("attack fixture-other-attacker directly");
	});
	it("with nothing anyone can do in the Start and End Steps, they pass by themselves: one pass enters the Battle Step, one pass leaves for Main Phase 2", () => {
		const log: string[] = [];
		const battle = play(board(log, { monsters: ["fixture-attacker"] }), "pass");
		expect([battle.turn.phase, battle.battleStep]).toEqual(["battle", "battle"]);
		expect(offered(battle)).toEqual(["attack fixture-attacker directly", "pass"]);
		const main2 = play(battle, "pass");
		expect([main2.turn.phase, main2.battleStep]).toEqual(["main2", null]);
	});
	it("the opponent's fast effect alone keeps a step open for them: the turn player who can do nothing there passes, then the opponent decides", () => {
		const log: string[] = [];
		// The turn player, then the opponent, pass in Main Phase 1 (the opponent's Quick-Play Spell could be used there too).
		const start = play(board(log, { monsters: ["fixture-attacker"] }, { set: ["fixture-quick"] }), "pass", "pass");
		expect([start.battleStep, start.priority.holder]).toEqual(["start", "rival"]);
		expect(offered(start)).toEqual(["activate fixture-quick", "pass"]);
	});
});
