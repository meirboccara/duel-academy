import { describe, expect, it } from "vitest";
import { actionName, atk, chooseAction, type Duel, equipMonster, equipsOf, followLine, HIDDEN, legalActions, redeal, viewFor } from "../../src";
import { equipCards } from "../rules/equip-fixtures";
import { codes, play, position } from "../rules/fixtures";

const names = (duel: Duel) => legalActions(duel).map((action) => actionName(duel, action)).sort();
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((card) => card.code === code)!;

/**
 * The bot's seams over step 11's monsters treated as Equip Cards: no new action type (the monster and the zone are `choose` and
 * `place`), an Equip Card that was hidden in the Extra Deck is public once equipped, and a view and its re-dealt worlds keep the
 * relation and what the Equip Card gives.
 */
describe("monsters treated as Equip Cards, seen by the bot", () => {
	const start = () => position({ defs: equipCards(), you: { hand: ["fixture-prayer"], monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion", "fixture-eyes-synchro", "fixture-tyrant"], deck: ["fixture-vanilla", "fixture-little-dragon"] }, rival: { hand: ["fixture-vanilla"], monsters: ["fixture-little-dragon"], deck: ["fixture-vanilla"] } });
	it("names the choice of the monster to equip and of its zone, and follows the line to the Summon that uses the equipped card", () => {
		const line = followLine(start(), ["activate fixture-prayer > fixture-white-dragon", "choose fixture-eyes-fusion", "place 3", "special-summon fixture-tyrant", "place 2"]);
		expect(line.failed).toBeNull();
		expect(codes(line.duel, "you", "monster")).toEqual(["fixture-tyrant"]);
		expect(codes(line.duel, "you", "graveyard").sort()).toEqual(["fixture-eyes-fusion", "fixture-prayer", "fixture-white-dragon"]);
	});
	it("shows the opponent an Equip Card that came from the hidden Extra Deck, and leaks nothing else of that Extra Deck", () => {
		const equipped = play(start(), "activate fixture-prayer > fixture-white-dragon", "choose fixture-eyes-fusion", "place 3");
		const fusion = find(equipped, "fixture-eyes-fusion").id;
		const view = viewFor(equipped, "rival");
		expect(view.duel.cards[fusion]).toMatchObject({ code: "fixture-eyes-fusion", zone: "spell", equippedTo: find(equipped, "fixture-white-dragon").id });
		expect(view.duel.piles.you.extra.map((id) => view.duel.cards[id]!.code)).toEqual([HIDDEN, HIDDEN]);
		expect(view.unknown.you.extra).toEqual(["fixture-eyes-synchro", "fixture-tyrant"]);
		// Before the effect resolved it was one hidden card among three.
		expect(viewFor(start(), "rival").unknown.you.extra).toEqual(["fixture-eyes-fusion", "fixture-eyes-synchro", "fixture-tyrant"]);
	});
	it("keeps the relation, what the Equip Card gives and the Summon that uses it in every re-dealt world, and the bot can decide there", () => {
		const equipped = play(start(), "activate fixture-prayer > fixture-white-dragon", "choose fixture-eyes-fusion", "place 3");
		const dragon = find(equipped, "fixture-white-dragon").id;
		const fusion = find(equipped, "fixture-eyes-fusion").id;
		for (const side of ["you", "rival"] as const) {
			for (const seed of [1, 2, 3]) {
				const world = redeal(viewFor(equipped, side), seed);
				expect(equipsOf(world, dragon)).toEqual([fusion]);
				expect(atk(world, dragon)).toBe(3400);
				// Your own view knows your Extra Deck: the Summon is offered. The rival's worlds deal your two hidden Extra Deck cards back to it.
				expect(names(world)).toContain("special-summon fixture-tyrant");
			}
		}
		const world = redeal(viewFor(equipped, "you"), 4);
		expect(() => chooseAction(world, "you", { level: "basic", seed: 1 })).not.toThrow();
		// The same from a world where the monster to equip is still to be chosen (a chain paused on the choice).
		const asked = play(start(), "activate fixture-prayer > fixture-white-dragon");
		const paused = redeal(viewFor(asked, "you"), 9);
		expect(names(paused)).toEqual(["choose fixture-eyes-fusion", "choose fixture-eyes-synchro"]);
		expect(atk(play(paused, "choose fixture-eyes-synchro", "place 1"), dragon)).toBe(3400);
	});
});
