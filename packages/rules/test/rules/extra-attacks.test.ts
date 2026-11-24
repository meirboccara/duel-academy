import { describe, expect, it } from "vitest";
import { canChangePosition, cites, type Duel, flipFaceDown, flipFaceUp } from "../../src";
import { attackCards } from "./attack-fixtures";
import { toStep } from "./battle-fixtures";
import { nextTurn } from "./continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "./fixtures";

const every = { everyWindow: true };
/** Your turn, Battle Phase, the game state open. */
const battle = (you: SideSpec, rival: SideSpec = {}, options = {}, log: string[] = []) => position({ defs: attackCards(log), phase: "battle", options, you, rival });
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));

/**
 * Extra attacks (src/battle.ts, the `attack` layer of src/modifiers.ts). Konami's Japanese Q&A (OCG only) is cited where a page was
 * read; what only YGOProJudge backs says so in its title.
 */
describe("a second attack during each Battle Phase", () => {
	it("\"can make a second attack during each Battle Phase\": the monster attacks twice, a monster or directly, and no third time (the printed wording; YGOProJudge only for two direct attacks)", () => {
		const start = battle({ monsters: ["fixture-twin", "big"] }, { monsters: ["small"] });
		const first = play(start, "attack fixture-twin > small");
		expect(codes(first, "rival", "graveyard")).toEqual(["small"]);
		expect(attacks(first)).toEqual(["attack big directly", "attack fixture-twin directly"]);
		const second = play(first, "attack fixture-twin directly");
		expect(second.lp.rival).toBe(8000 - 2200 - 2800);
		expect(attacks(second)).toEqual(["attack big directly"]);
		// Two direct attacks.
		const direct = play(battle({ monsters: ["fixture-twin"] }), "attack fixture-twin directly", "attack fixture-twin directly");
		expect([direct.lp.rival, attacks(direct)]).toEqual([8000 - 5600, []]);
	});
	it(`${cites("rules", "one-attack-per-monster")} the count is per monster and per turn: another monster keeps its single attack, and the next turn starts again`, () => {
		const done = play(battle({ monsters: ["fixture-twin", "big"] }), "attack big directly", "attack fixture-twin directly", "attack fixture-twin directly");
		expect(attacks(done)).toEqual([]);
		expect(done.attacked.map((made) => done.cards[made.id]!.code)).toEqual(["big", "fixture-twin", "fixture-twin"]);
		let next = nextTurn(done, 5);
		for (let guard = 0; guard < 10 && next.turn.phase !== "battle"; guard++) next = play(next, "pass");
		expect(attacks(next)).toEqual(["attack big directly", "attack fixture-twin directly"]);
	});
	it("two \"second attack\" permissions on one monster do not add up: the widest applies, two attacks in all (the core's reading, no page read)", () => {
		const twice = { kind: "attack" as const, allows: { what: "times" as const, count: 2 } };
		const defs = { ...attackCards(), "fixture-twin-twice": { code: "fixture-twin-twice", kind: "monster" as const, facts: { level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous" as const, modifies: () => [twice, twice] }] } };
		const second = play(position({ defs, phase: "battle", you: { monsters: ["fixture-twin-twice"] } }), "attack fixture-twin-twice directly", "attack fixture-twin-twice directly");
		expect([second.lp.rival, attacks(second)]).toEqual([8000 - 2000, []]);
	});
	it("a monster that attacked still cannot change its battle position by hand, however many attacks it has left", () => {
		const first = play(battle({ monsters: ["fixture-twin"] }), "attack fixture-twin directly");
		expect(canChangePosition({ ...first, turn: { ...first.turn, phase: "main2" } }, first.cards[first.piles.you.monster[0]!]!)).toBe(false);
	});
	it(`${cites("rules", "replay")} a replayed attack made again with the same monster is still its first attack; if another monster attacks instead, the first attack stays used and the second is left`, () => {
		const start = battle({ monsters: ["fixture-twin", "big"] }, { monsters: ["even"], set: ["vanish"] });
		const replayed = play(start, "attack fixture-twin > even", "activate vanish");
		expect(attacks(replayed)).toEqual(["attack big directly", "attack fixture-twin directly"]);
		// The same monster attacks again: that is still its first attack, and it has its second.
		const again = play(replayed, "attack fixture-twin directly");
		expect(attacks(again)).toEqual(["attack big directly", "attack fixture-twin directly"]);
		expect(attacks(play(again, "attack fixture-twin directly"))).toEqual(["attack big directly"]);
		// Another monster attacks instead: the first monster has declared one attack, and has one left.
		const other = play(replayed, "attack big directly");
		expect(attacks(other)).toEqual(["attack fixture-twin directly"]);
		expect(attacks(play(other, "attack fixture-twin directly"))).toEqual([]);
	});
});

describe("up to 2 attacks on monsters", () => {
	it("\"can make up to 2 attacks on monsters during each Battle Phase\": after a monster, the second attack must be on a monster; after a direct attack there is none (YGOProJudge only)", () => {
		const start = battle({ monsters: ["fixture-monster-twin"] }, { monsters: ["small", "even"] });
		const first = play(start, "attack fixture-monster-twin > small");
		expect(attacks(first)).toEqual(["attack fixture-monster-twin > even"]);
		const second = play(first, "attack fixture-monster-twin > even");
		expect([codes(second, "rival", "graveyard"), attacks(second)]).toEqual([["small", "even"], []]);
		// No monster is left after its first attack on a monster: it does not attack directly.
		expect(attacks(play(battle({ monsters: ["fixture-monster-twin"] }, { monsters: ["small"] }), "attack fixture-monster-twin > small"))).toEqual([]);
		// Its first attack was direct: a monster that comes later is not attacked.
		const direct = play(battle({ monsters: ["fixture-monster-twin"] }, { hand: ["small"], set: ["fixture-call"] }, every), "attack fixture-monster-twin directly", "pass", "pass");
		const later = play(toStep(direct, null), "pass", "activate fixture-call", "pass", "pass");
		expect([codes(later, "rival", "monster"), later.battle, attacks(later)]).toEqual([["small"], null, []]);
	});
});

describe("attacking all monsters the opponent controls, once each", () => {
	it(`${cites("rules", "attack-all-once-each")} each of the opponent's monsters is attacked once, and a monster that survived its battle is never attacked a second time`, () => {
		const defs = { ...attackCards(), "fixture-rock": { code: "fixture-rock", kind: "monster" as const, facts: { level: 4, atk: 0, def: 4000 } } };
		const start = position({ defs, phase: "battle", you: { monsters: ["fixture-sweeper"] }, rival: { monsters: ["small", "even"], defense: ["fixture-rock"] } });
		const first = play(start, "attack fixture-sweeper > fixture-rock");
		// 3400 against 4000 DEF: the rock stays, and is not offered again.
		expect([first.lp.you, codes(first, "rival", "monster")]).toEqual([8000 - 600, ["small", "even", "fixture-rock"]]);
		expect(attacks(first)).toEqual(["attack fixture-sweeper > even", "attack fixture-sweeper > small"]);
		const second = play(first, "attack fixture-sweeper > small");
		expect(attacks(second)).toEqual(["attack fixture-sweeper > even"]);
		expect(attacks(play(second, "attack fixture-sweeper > even"))).toEqual([]);
	});
	it(`${cites("rules", "attack-all-direct-or-monsters")} (B) after a direct attack that reached damage calculation, a monster that comes later cannot be attacked`, () => {
		const direct = play(battle({ monsters: ["fixture-sweeper"] }, { hand: ["small"], set: ["fixture-call"] }, every), "attack fixture-sweeper directly");
		const later = play(toStep(direct, null), "pass", "activate fixture-call", "pass", "pass");
		expect([later.lp.rival, codes(later, "rival", "monster"), later.battle]).toEqual([8000 - 3400, ["small"], null]);
		expect(attacks(later)).toEqual([]);
	});
	it(`${cites("rules", "attack-all-direct-or-monsters")} (C) after battling a monster, its next attack cannot be a direct attack`, () => {
		expect(attacks(play(battle({ monsters: ["fixture-sweeper"] }, { monsters: ["small"] }), "attack fixture-sweeper > small"))).toEqual([]);
	});
	it(`${cites("rules", "attack-all-direct-or-monsters")} (A) its first attack replayed because the only monster left: it can attack directly; replayed after it battled another monster, the attack is over`, () => {
		const first = play(battle({ monsters: ["fixture-sweeper"] }, { monsters: ["small"], set: ["vanish"] }), "attack fixture-sweeper > small", "activate vanish");
		expect(attacks(first)).toEqual(["attack fixture-sweeper directly"]);
		expect(play(first, "attack fixture-sweeper directly").lp.rival).toBe(8000 - 3400);
		const second = play(battle({ monsters: ["fixture-sweeper"] }, { monsters: ["small", "even"], set: ["vanish"] }), "attack fixture-sweeper > small", "pass", "attack fixture-sweeper > even", "activate vanish");
		expect([second.battle, codes(second, "rival", "monster"), attacks(second)]).toEqual([null, [], []]);
	});
});

describe("an extra attack whose permission is negated", () => {
	it(`${cites("rules", "multi-attack-negated")} negated before the second attack is declared: no second attack is offered`, () => {
		const first = toStep(play(battle({ monsters: ["fixture-twin"], set: ["fixture-silence"] }, { monsters: ["small"] }), "attack fixture-twin > small"), null);
		expect(attacks(first)).toEqual(["attack fixture-twin directly"]);
		expect(attacks(play(first, "activate fixture-silence > fixture-twin"))).toEqual([]);
	});
	it(`${cites("rules", "multi-attack-negated")} negated in the Battle Step of the second attack: that attack can no longer be made`, () => {
		const start = battle({ monsters: ["fixture-twin"] }, { monsters: ["small"], set: ["fixture-silence"] }, every);
		const second = play(toStep(play(start, "attack fixture-twin > small"), null), "attack fixture-twin directly", "pass");
		expect(second.battle?.step).toBe("declared");
		const stopped = play(second, "activate fixture-silence > fixture-twin", "pass", "pass", "pass", "pass");
		expect([stopped.battle, stopped.lp.rival]).toEqual([null, 8000 - 2200]);
		expect(attacks(stopped)).toEqual([]);
	});
	it(`${cites("rules", "multi-attack-negated")} negated in the Damage Step of the second attack: the battle goes on to damage calculation`, () => {
		const start = battle({ monsters: ["fixture-twin"] }, { monsters: ["small"], set: ["fixture-silence"] }, every);
		const second = toStep(play(toStep(play(start, "attack fixture-twin > small"), null), "attack fixture-twin directly"), "start");
		const done = toStep(play(second, "pass", "activate fixture-silence > fixture-twin"), null);
		expect(done.lp.rival).toBe(8000 - 2200 - 2800);
	});
	it("a first attack is never an extra one: negated in its Battle Step, it goes on", () => {
		const start = battle({ monsters: ["fixture-twin"] }, { set: ["fixture-silence"] }, every);
		const done = toStep(play(start, "attack fixture-twin directly", "pass", "activate fixture-silence > fixture-twin"), null);
		expect([done.lp.rival, attacks(done)]).toEqual([8000 - 2800, []]);
	});
});

describe("attacking again in a row", () => {
	it(`${cites("rules", "attack-again-while-face-up")} "this card can attack again in a row": granted at the end of the Damage Step, it allows one more attack, a monster or directly, and is gone once the monster is no longer face-up in the Monster Zone`, () => {
		const log: string[] = [];
		const start = battle({ monsters: ["fixture-again"] }, { monsters: ["small"] }, {}, log);
		const first = play(start, "attack fixture-again > small");
		// The optional trigger at the end of the Damage Step.
		expect(offered(first)).toEqual(["activate fixture-again", "pass"]);
		expect(attacks(play(first, "pass"))).toEqual([]);
		const granted = play(first, "activate fixture-again");
		expect(log).toEqual(["fixture-again"]);
		expect(attacks(granted)).toEqual(["attack fixture-again directly"]);
		// It attacks, and may be granted the attack once more.
		const second = play(granted, "attack fixture-again directly", "activate fixture-again");
		expect([second.lp.rival, attacks(second)]).toEqual([8000 - 1900 - 2500, ["attack fixture-again directly"]]);
		// Turned face-down and face-up again where it stands, the permission is gone.
		const id = granted.piles.you.monster[0]!;
		expect(attacks(flipFaceUp(flipFaceDown(granted, id), id, "attack"))).toEqual([]);
	});
	it("\"you can use this effect twice per turn\": after two uses it is not offered a third time that turn, by either copy (the printed wording; a count on the by-name limit)", () => {
		const start = battle({ monsters: ["fixture-again", "fixture-again"] });
		const twice = play(start, "attack fixture-again directly", "activate fixture-again", "attack fixture-again directly", "activate fixture-again");
		expect(twice.used.turn.filter((key) => key.includes("fixture-again"))).toHaveLength(2);
		// After the third attack of the first copy the effect is not offered again; only the other copy's attack is left.
		const third = play(twice, "attack fixture-again directly");
		expect([third.battle, offered(third)]).toEqual([null, ["attack fixture-again directly", "pass"]]);
	});
	it("\"in a row\": the attack must be the next one declared; once another monster attacks, the permission is lost (YGOProJudge only)", () => {
		const start = battle({ monsters: ["fixture-again", "big"] }, { monsters: ["small"] });
		const granted = play(start, "attack fixture-again > small", "activate fixture-again");
		expect(attacks(granted)).toEqual(["attack big directly", "attack fixture-again directly"]);
		expect(attacks(play(granted, "attack big directly"))).toEqual([]);
	});
	it("\"attack again\" needs an attack: given to a monster that has not attacked this turn, nothing is granted, and its first attack is an ordinary one (the core's reading of the wording)", () => {
		const start = battle({ monsters: ["big", "even"], set: ["fixture-encore"] }, { monsters: ["small"] });
		const early = play(start, "activate fixture-encore > big");
		expect(early.again).toBeNull();
		const first = play(early, "attack big > small");
		expect([first.attacked.map((made) => made.again === true), attacks(first)]).toEqual([[false], ["attack even directly"]]);
	});
	it(`${cites("rules", "replay")} granted in the Battle Step of an attack that is then replayed: the same monster makes that attack again and still has its attack "again in a row"`, () => {
		const start = battle({ monsters: ["big"], set: ["fixture-encore"] }, { monsters: ["small"], set: ["vanish"] }, every);
		const replayed = play(start, "attack big > small", "activate fixture-encore > big", "activate vanish", "pass", "pass", "pass", "pass");
		expect([replayed.battle, attacks(replayed)]).toEqual([null, ["attack big directly"]]);
		const first = toStep(play(replayed, "attack big directly"), null);
		expect([first.lp.rival, attacks(first)]).toEqual([8000 - 2000, ["attack big directly"]]);
		const second = toStep(play(first, "attack big directly"), null);
		expect([second.lp.rival, attacks(second)]).toEqual([8000 - 4000, []]);
	});
});
