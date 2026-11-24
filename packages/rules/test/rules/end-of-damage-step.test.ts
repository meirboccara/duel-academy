import { describe, expect, it } from "vitest";
import { attackedNow, banishWhenItLeaves, battledNow, cites, destroyedByBattleNow, type Duel, moveCard } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec, rival: SideSpec, log: string[] = []): Duel => position({ defs: gapCards(log), phase: "battle", options: { everyWindow: true }, you, rival });
const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;
/** Passes until the attack reaches `step`. */
function until(duel: Duel, step: string): Duel {
	let next = duel;
	for (let guard = 0; guard < 20 && next.battle?.step !== step; guard++) next = play(next, "pass");
	return next;
}

/**
 * "At the end of the Damage Step, if this card battled / attacked: ..." (`battledNow`, `attackedNow`, `destroyedByBattleNow`,
 * src/battle.ts). Blue-Eyes Tyrant Dragon (text, and Konami's Japanese notes, OCG only) and Neo Blue-Eyes Ultimate Dragon (text);
 * made-up cards with the same wording.
 */
describe("the end of the Damage Step, for a monster that battled", () => {
	it(`${cites("rules", "end-of-damage-step-battled-text")} a monster has "battled" once damage calculation was performed, not before; at the end of the Damage Step its effect can be activated in the Monster Zone`, () => {
		const log: string[] = [];
		const duel = board({ monsters: ["fixture-battler"] }, { monsters: ["fixture-plain"] }, log);
		const battler = idOf(duel, "fixture-battler");
		expect(battledNow(duel, battler)).toBe(false);
		const declared = play(duel, "attack fixture-battler > fixture-plain");
		expect([declared.battle?.step, battledNow(declared, battler)]).toEqual(["declared", false]);
		expect(battledNow(until(declared, "before"), battler)).toBe(false);
		const after = until(declared, "after");
		expect([battledNow(after, battler), battledNow(after, idOf(duel, "fixture-plain")), destroyedByBattleNow(after, battler)]).toEqual([true, true, false]);
		const end = until(after, "end");
		expect(offered(end)).toEqual(["activate fixture-battler", "pass"]);
		play(end, "activate fixture-battler", "pass", "pass");
		expect(log).toEqual(["fixture-battler in field"]);
	});
	it(`${cites("rules", "end-of-damage-step-where")} destroyed by that battle and sent to the GY, it is activated in the GY`, () => {
		const log: string[] = [];
		const duel = board({ monsters: ["fixture-battler"] }, { monsters: ["fixture-giant"] }, log);
		const end = until(play(duel, "attack fixture-battler > fixture-giant"), "end");
		expect([codes(end, "you", "graveyard"), destroyedByBattleNow(end, idOf(duel, "fixture-battler"))]).toEqual([["fixture-battler"], true]);
		expect(offered(end)).toEqual(["activate fixture-battler", "pass"]);
		play(end, "activate fixture-battler", "pass", "pass");
		expect(log).toEqual(["fixture-battler in graveyard"]);
	});
	it(`${cites("rules", "end-of-damage-step-where")} destroyed by that battle and banished face-up, it is activated while banished`, () => {
		const log: string[] = [];
		const duel = board({ monsters: ["fixture-battler"] }, { monsters: ["fixture-giant"] }, log);
		const end = until(play(banishWhenItLeaves(duel, idOf(duel, "fixture-battler")), "attack fixture-battler > fixture-giant"), "end");
		expect(codes(end, "you", "banished")).toEqual(["fixture-battler"]);
		play(end, "activate fixture-battler", "pass", "pass");
		expect(log).toEqual(["fixture-battler in banished"]);
	});
	it(`${cites("rules", "end-of-damage-step-battled-text")} a monster that did not battle in this attack is not concerned, nor one whose attack ended with no damage calculation; nothing is left once the attack is over`, () => {
		const duel = board({ monsters: ["fixture-battler", "fixture-white"] }, { monsters: ["fixture-plain"] });
		const battler = idOf(duel, "fixture-battler");
		const end = until(play(duel, "attack fixture-white > fixture-plain"), "end");
		expect([battledNow(end, battler), battledNow(end, idOf(duel, "fixture-white"))]).toEqual([false, true]);
		expect(offered(end)).toEqual(["pass"]);
		let over = end;
		for (let guard = 0; guard < 6 && over.battle; guard++) over = play(over, "pass");
		expect([over.battle, battledNow(over, idOf(duel, "fixture-white"))]).toEqual([null, false]);
		// The attack target leaves in the Damage Step, before damage calculation: nobody battled.
		const started = until(play(duel, "attack fixture-battler > fixture-plain"), "start");
		const ended = until(moveCard(started, idOf(duel, "fixture-plain"), { zone: "graveyard" }), "end");
		expect([ended.battle?.step, battledNow(ended, battler)]).toEqual(["end", false]);
	});
	it(`${cites("rules", "end-of-damage-step-attacked-text")} "if this card attacked": the attacking monster, not the monster it attacked`, () => {
		const log: string[] = [];
		const duel = board({ monsters: ["fixture-attacker"] }, { monsters: ["fixture-attacker"] }, log);
		const [mine] = duel.piles.you.monster;
		const [theirs] = duel.piles.rival.monster;
		const end = until(play(duel, "attack fixture-attacker > fixture-attacker"), "after");
		expect([attackedNow(end, mine!), attackedNow(end, theirs!), battledNow(end, theirs!)]).toEqual([true, false, true]);
	});
});
