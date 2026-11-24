import { describe, expect, it } from "vitest";
import { cites, type Duel } from "../../src";
import { attackCards } from "./attack-fixtures";
import { toStep } from "./battle-fixtures";
import { codes, offered, play, position, type SideSpec } from "./fixtures";

const every = { everyWindow: true };
/** Your turn, Battle Phase, the game state open. */
const battle = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs: attackCards(), phase: "battle", options, you, rival });
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));
const positionOf = (duel: Duel, code: string) => Object.values(duel.cards).find((card) => card.code === code)!.position;

/**
 * Direct attacks while the opponent controls monsters, and attacks in face-up Defense Position (the `attack` layer of
 * src/modifiers.ts, read by src/battle.ts). Konami's Japanese Q&A and notes are OCG only; a test that rests on the core's own reading
 * says so in its title.
 */
describe("a monster that can attack directly", () => {
	it(`${cites("rules", "direct-attack-ability")} ${cites("rules", "damage-direct")} it may attack a monster or attack directly although the opponent controls monsters; the direct attack deals its full ATK and touches no monster`, () => {
		const start = battle({ monsters: ["fixture-direct", "big"] }, { monsters: ["small"] });
		expect(attacks(start)).toEqual(["attack big > small", "attack fixture-direct > small", "attack fixture-direct directly"]);
		const done = play(start, "attack fixture-direct directly");
		expect([done.lp.rival, codes(done, "rival", "monster"), done.attacked.map((made) => made.direct)]).toEqual([8000 - 1500, ["small"], [true]]);
		// One attack, like any monster.
		expect(attacks(done)).toEqual(["attack big > small"]);
	});
	it(`${cites("rules", "direct-attack-continuous")} the permission is a Continuous Effect of the monster in the Monster Zone: negated, it attacks like any other monster`, () => {
		const start = battle({ monsters: ["fixture-direct"], set: ["fixture-silence"] }, { monsters: ["small"] });
		expect(attacks(play(start, "activate fixture-silence > fixture-direct"))).toEqual(["attack fixture-direct > small"]);
	});
	it("\"it can attack directly this turn\", left by a resolved effect, gives the same permission to the monster it was applied to", () => {
		const start = battle({ monsters: ["big", "even"], set: ["fixture-open-path"] }, { monsters: ["small"] });
		expect(attacks(play(start, "activate fixture-open-path > big"))).toEqual(["attack big > small", "attack big directly", "attack even > small"]);
	});
	it("a \"cannot attack directly\" lock closes the direct attack and leaves the attacks on monsters", () => {
		expect(attacks(battle({ monsters: ["fixture-direct"], faceupSpells: ["fixture-no-direct-field"] }, { monsters: ["small"] }))).toEqual(["attack fixture-direct > small"]);
		expect(attacks(battle({ monsters: ["fixture-direct"], faceupSpells: ["fixture-no-direct-field"] }))).toEqual([]);
	});
	it(`${cites("rules", "direct-attack-lost-replay")} the permission lost in the Battle Step of a direct attack: a replay, and the monster may attack a monster instead`, () => {
		const start = battle({ monsters: ["fixture-direct"] }, { monsters: ["small"], set: ["fixture-silence"] }, every);
		const replayed = play(start, "attack fixture-direct directly", "pass", "activate fixture-silence > fixture-direct", "pass", "pass", "pass", "pass");
		expect([replayed.battle, replayed.lp.rival, attacks(replayed)]).toEqual([null, 8000, ["attack fixture-direct > small"]]);
		expect(codes(toStep(play(replayed, "attack fixture-direct > small"), null), "rival", "graveyard")).toContain("small");
	});
	it(`${cites("rules", "direct-attack-lost-replay")} (D) a monster that attacks all monsters once each, whose direct attack was replayed onto a monster, attacks no other monster`, () => {
		const start = battle({ monsters: ["fixture-sweeper"], faceupSpells: ["fixture-path-field"] }, { monsters: ["small", "even"], set: ["mystical-space-typhoon"] });
		expect(attacks(start)).toEqual(["attack fixture-sweeper > even", "attack fixture-sweeper > small", "attack fixture-sweeper directly"]);
		const replayed = play(start, "attack fixture-sweeper directly", "activate mystical-space-typhoon > fixture-path-field");
		expect([replayed.battle, attacks(replayed)]).toEqual([null, ["attack fixture-sweeper > even", "attack fixture-sweeper > small"]]);
		const battled = play(replayed, "attack fixture-sweeper > small");
		expect([codes(battled, "rival", "monster"), attacks(battled)]).toEqual([["even"], []]);
	});
	it("the permission lost in the Damage Step, before damage calculation: no replay, no damage calculation, the Damage Step ends and the monster has attacked (YGOProJudge only)", () => {
		const start = battle({ monsters: ["fixture-direct"] }, { monsters: ["small"], set: ["fixture-silence"] }, every);
		const inDamageStep = toStep(play(start, "attack fixture-direct directly"), "start");
		const ended = toStep(play(inDamageStep, "pass", "activate fixture-silence > fixture-direct"), null);
		expect([ended.lp.rival, ended.replay, attacks(ended)]).toEqual([8000, null, []]);
	});
	it("\"cannot attack directly\" begins to apply in the Battle Step of a direct attack: a replay, onto a monster if there is one, and no direct attack is made (YGOProJudge only)", () => {
		// The opponent controls no monster: the attack stops, and there is nothing left to attack.
		const alone = play(battle({ monsters: ["big"] }, { set: ["fixture-no-direct-trap"] }), "attack big directly", "activate fixture-no-direct-trap");
		expect([alone.battle, alone.lp.rival, attacks(alone)]).toEqual([null, 8000, []]);
		// A monster that could attack directly past a monster: it may attack that monster instead.
		const past = play(battle({ monsters: ["fixture-direct"] }, { monsters: ["small"], set: ["fixture-no-direct-trap"] }), "attack fixture-direct directly", "activate fixture-no-direct-trap");
		expect([past.battle, past.lp.rival, attacks(past)]).toEqual([null, 8000, ["attack fixture-direct > small"]]);
	});
	it("\"cannot attack directly\" begins to apply in the Damage Step of a direct attack, before damage calculation: no replay, no damage calculation, and the monster has attacked (YGOProJudge only)", () => {
		for (const rival of [{ set: ["fixture-no-direct-trap"] }, { monsters: ["small"], set: ["fixture-no-direct-trap"] }]) {
			const attacker = rival.monsters ? "fixture-direct" : "big";
			const inDamageStep = toStep(play(battle({ monsters: [attacker] }, rival, every), `attack ${attacker} directly`), "start");
			const ended = toStep(play(inDamageStep, "pass", "activate fixture-no-direct-trap"), null);
			expect([ended.lp.rival, ended.replay, attacks(ended)]).toEqual([8000, null, []]);
		}
	});
	it(`${cites("rules", "replay-causes")} a new monster on the opponent's side during its direct attack still causes a replay`, () => {
		const start = battle({ monsters: ["fixture-direct"] }, { monsters: ["small"], hand: ["even"], set: ["fixture-call"] });
		const replayed = play(start, "attack fixture-direct directly", "activate fixture-call");
		expect([replayed.battle, attacks(replayed)]).toEqual([null, ["attack fixture-direct > even", "attack fixture-direct > small", "attack fixture-direct directly"]]);
	});
});

describe("attacking in face-up Defense Position", () => {
	it(`${cites("rules", "defense-attack-damage")} a monster that can attack in face-up Defense Position uses its DEF as its ATK: against a higher ATK its controller takes the difference and it is destroyed`, () => {
		const start = battle({ defense: ["fixture-wall"] }, { monsters: ["fixture-3500"] });
		expect(attacks(start)).toEqual(["attack fixture-wall > fixture-3500"]);
		const lost = play(start, "attack fixture-wall > fixture-3500");
		expect([lost.lp.you, lost.lp.rival, codes(lost, "you", "graveyard"), codes(lost, "rival", "monster")]).toEqual([8000 - 200, 8000, ["fixture-wall"], ["fixture-3500"]]);
	});
	it(`${cites("rules", "defense-attack-damage")} against a lower ATK the opponent takes the difference and their monster is destroyed; equal values destroy both; it stays in Defense Position`, () => {
		const won = play(battle({ defense: ["fixture-wall"] }, { monsters: ["huge"] }), "attack fixture-wall > huge");
		expect([won.lp.rival, won.lp.you, codes(won, "rival", "graveyard"), positionOf(won, "fixture-wall")]).toEqual([8000 - 300, 8000, ["huge"], "defense"]);
		const tie = play(battle({ defense: ["fixture-wall"] }, { monsters: ["fixture-3300"] }), "attack fixture-wall > fixture-3300");
		expect([tie.lp, codes(tie, "you", "graveyard"), codes(tie, "rival", "graveyard")]).toEqual([{ you: 8000, rival: 8000 }, ["fixture-wall"], ["fixture-3300"]]);
	});
	it(`${cites("rules", "damage-direct")} ${cites("rules", "damage-atk-vs-def")} its DEF is the damage of its direct attack, and is compared with the DEF of a Defense Position target`, () => {
		expect(play(battle({ defense: ["fixture-wall"] }), "attack fixture-wall directly").lp.rival).toBe(8000 - 3300);
		const through = play(battle({ defense: ["fixture-wall"] }, { defense: ["huge"] }), "attack fixture-wall > huge");
		expect([codes(through, "rival", "graveyard"), through.lp]).toEqual([["huge"], { you: 8000, rival: 8000 }]);
	});
	it("in Attack Position it attacks with its ATK like any monster, and a permission given to other monsters lets them attack in Defense Position too", () => {
		expect(play(battle({ monsters: ["fixture-wall"] }), "attack fixture-wall directly").lp.rival).toBe(8000);
		const start = battle({ defense: ["big"], faceupSpells: ["fixture-wall-field"] }, { defense: ["even"] });
		expect(attacks(start)).toEqual(["attack big > even"]);
		// 1000 DEF against 1000 DEF: nothing happens.
		const done = play(start, "attack big > even");
		expect([done.lp, codes(done, "rival", "monster")]).toEqual([{ you: 8000, rival: 8000 }, ["even"]]);
		expect(attacks(battle({ defense: ["big"] }, { defense: ["even"] }))).toEqual([]);
	});
	it(`${cites("rules", "defense-attack-negated-before-damage-step")} its permission negated before the Damage Step: it can no longer attack, the attack ends with no Damage Step and no replay`, () => {
		const start = battle({ defense: ["fixture-wall"] }, { monsters: ["huge"], set: ["fixture-silence"] }, every);
		const stopped = play(start, "attack fixture-wall > huge", "pass", "activate fixture-silence > fixture-wall", "pass", "pass", "pass", "pass");
		expect([stopped.battle, stopped.replay, stopped.lp, codes(stopped, "rival", "monster"), attacks(stopped)]).toEqual([null, null, { you: 8000, rival: 8000 }, ["huge"], []]);
	});
	it(`${cites("rules", "defense-attacker-stops")} its permission negated in the Damage Step, before damage calculation: no damage calculation, the Damage Step ends`, () => {
		const start = battle({ defense: ["fixture-wall"] }, { monsters: ["huge"], set: ["fixture-silence"] }, every);
		const inDamageStep = toStep(play(start, "attack fixture-wall > huge"), "start");
		const ended = toStep(play(inDamageStep, "pass", "activate fixture-silence > fixture-wall"), null);
		expect([ended.lp, codes(ended, "rival", "monster"), codes(ended, "you", "monster")]).toEqual([{ you: 8000, rival: 8000 }, ["huge"], ["fixture-wall"]]);
	});
});
