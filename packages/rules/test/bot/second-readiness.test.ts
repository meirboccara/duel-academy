import { describe, expect, it } from "vitest";
import { act, actionName, type Duel, findNamed, followLine, legalActions, redeal, viewFor } from "../../src";
import { attackCards } from "../rules/attack-fixtures";
import { codes, play, position } from "../rules/fixtures";
import { replaceCards } from "../rules/replace-fixtures";
import { summonExtrasCards } from "../rules/summon-extras-fixtures";

const names = (duel: Duel) => legalActions(duel).map((action) => actionName(duel, action)).sort();

/**
 * The bot's seams over the second readiness slice: the attack permissions, the additional Normal Summon, monsters Special Summoned
 * together and a replaced effect add no action type but one mark (`extra` on a `summon`); the names stay stable, and a view and its
 * re-dealt worlds keep the new public bookkeeping.
 */
describe("named moves of the second readiness slice", () => {
	it("names a direct attack beside the attacks on monsters, and a second attack like the first", () => {
		const start = position({ defs: attackCards(), phase: "battle", you: { monsters: ["fixture-direct", "fixture-twin"] }, rival: { monsters: ["small"] } });
		expect(names(start)).toEqual(["attack fixture-direct > small", "attack fixture-direct directly", "attack fixture-twin > small", "pass"]);
		const line = followLine(start, ["attack fixture-twin > small", "attack fixture-twin directly", "attack fixture-direct directly"]);
		expect([line.failed, line.duel.lp.rival]).toEqual([null, 8000 - 2200 - 2800 - 1500]);
	});
	it("names the additional Normal Summon apart from the turn's Normal Summon, with its zone", () => {
		const start = position({ defs: summonExtrasCards(), you: { hand: ["fixture-light-tuner", "lv4"], faceupSpells: ["fixture-mausoleum"] } });
		expect(names(start)).toEqual(["pass", "set fixture-light-tuner", "set lv4", "summon fixture-light-tuner", "summon fixture-light-tuner additional", "summon lv4"]);
		expect(findNamed(start, "summon fixture-light-tuner additional @3")).toMatchObject({ type: "summon", how: "normal", extra: true, zone: 3 });
		const line = followLine(start, ["summon fixture-light-tuner additional @3", "summon lv4"]);
		expect([line.failed, codes(line.duel, "you", "monster")]).toEqual([null, ["fixture-light-tuner", "lv4"]]);
		// A malformed guess of the mark is not the action.
		expect(() => act(play(start, "summon lv4"), { type: "summon", card: start.piles.you.hand[1]!, how: "normal", extra: true })).toThrow();
	});
	it("names the zones of monsters Special Summoned together, one question after the other", () => {
		const start = position({ defs: summonExtrasCards(), you: { monsters: ["fixture-zero"], deck: ["fixture-ace-a", "fixture-ace-b"] } });
		const line = followLine(start, ["activate fixture-zero", "place 1 as defense", "place 3", "pass"]);
		expect(line.failed).toBeNull();
		expect(line.duel.piles.you.monster.map((id) => [line.duel.cards[id]!.code, line.duel.cards[id]!.slot, line.duel.cards[id]!.position])).toEqual([["fixture-ace-a", 1, "defense"], ["fixture-ace-b", 3, "attack"]]);
	});
});

describe("views and re-dealt worlds of the second readiness slice", () => {
	it("keep the turn's attacks, the \"attack again\" permission and the additional Normal Summon, and play on from them", () => {
		const battle = play(position({ defs: attackCards(), phase: "battle", you: { monsters: ["fixture-again", "fixture-twin"] }, rival: { monsters: ["small"], hand: ["even", "big"], deck: ["huge", "even"] } }), "attack fixture-again > small", "activate fixture-again");
		for (const side of ["you", "rival"] as const) {
			const view = viewFor(battle, side);
			expect([view.duel.attacked, view.duel.again]).toEqual([battle.attacked, battle.again]);
			const world = redeal(view, 11);
			expect(names(world)).toEqual(names(battle));
			expect(names(act(world, findNamed(world, "attack fixture-twin directly")!))).toEqual(["attack fixture-twin directly", "pass"]);
		}
		const summoned = play(position({ defs: summonExtrasCards(), you: { hand: ["fixture-light-tuner", "fixture-light-tuner"], faceupSpells: ["fixture-mausoleum"], deck: ["lv4"] }, rival: { hand: ["lv3"] } }), "summon fixture-light-tuner additional");
		const world = redeal(viewFor(summoned, "you"), 5);
		expect([world.extraNormalSummoned, names(world)]).toEqual([true, ["pass", "set fixture-light-tuner", "summon fixture-light-tuner"]]);
	});
	it("keep a replaced effect on a chain that waits for a choice: every world resolves the new effect, not the card's own", () => {
		const log: string[] = [];
		const start = position({ defs: replaceCards(log), turn: "rival", options: { everyWindow: true }, you: { extraZone: ["fixture-rewriter"], monsters: ["fixture-plain-ace"], hand: ["fixture-vanilla"] }, rival: { monsters: ["fixture-big-drawer"], hand: ["fixture-vanilla", "fixture-big"], deck: ["fixture-big", "fixture-big", "fixture-vanilla"] } });
		const answered = play(start, "activate fixture-big-drawer ~ fixture-vanilla", "activate fixture-rewriter");
		for (const side of ["you", "rival"] as const) {
			const world = redeal(viewFor(answered, side), 3);
			expect(world.chain.map((link) => link.replaced !== undefined)).toEqual([false, false]);
			log.length = 0;
			const asked = play(world, "pass", "pass");
			expect([asked.asking?.player, names(asked)]).toEqual(["rival", ["choose fixture-plain-ace", "choose fixture-rewriter"]]);
			// The choice is asked of the opponent: the viewer's own world of that paused chain keeps the replacement too.
			const paused = redeal(viewFor(asked, side), 4);
			const done = play(paused, "choose fixture-rewriter");
			expect([codes(done, "you", "graveyard"), log.filter((line) => line.endsWith("draws"))]).toEqual([["fixture-rewriter"], []]);
		}
	});
});
