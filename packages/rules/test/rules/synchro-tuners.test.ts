import { describe, expect, it } from "vitest";
import { cardsIn, cites, type Duel } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { summonExtrasCards } from "./summon-extras-fixtures";

const board = (you: SideSpec) => position({ defs: summonExtrasCards(), you });
const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
const monster = (duel: Duel, code: string) => cardsIn(duel, "you", "monster").find((card) => card.code === code)!;

/**
 * Synchro Monsters whose printed materials ask for a number of Tuners other than one (`Procedure.tuners`, src/procedures.ts). The
 * material line is the card's own text; the rule that the Levels add up and the materials are face-up is step 8's.
 */
describe("a Synchro Summon with 2 or more Tuners", () => {
	it(`${cites("rules", "synchro-two-or-more-tuners")} "2+ Tuners + 1 non-Tuner": two Tuners and the non-Tuner whose Levels add up are its materials, all sent to the Graveyard`, () => {
		const start = board({ monsters: ["tuner-1", "tuner-2", "dragon-3"], extra: ["fixture-synchro-two-tuners-6"] });
		expect(summons(start)).toEqual(["special-summon fixture-synchro-two-tuners-6"]);
		// Every legal set needs the three monsters: none is asked for, only the zone.
		const done = play(start, "special-summon fixture-synchro-two-tuners-6", "place 0");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["dragon-3", "tuner-1", "tuner-2"]);
		expect(monster(done, "fixture-synchro-two-tuners-6")).toMatchObject({ face: "up", proper: true, summonedBy: "synchro" });
	});
	it(`${cites("rules", "synchro-two-or-more-tuners")} one Tuner is not enough, even when the Levels add up`, () => {
		// 3 + 3 = 6 with a single Tuner.
		expect(summons(board({ monsters: ["tuner-3", "dragon-3"], extra: ["fixture-synchro-two-tuners-6"] }))).toEqual([]);
	});
	it(`${cites("rules", "synchro-two-or-more-tuners")} "2+" takes a third Tuner, and "1 non-Tuner" never a second one`, () => {
		// 1 + 2 + 3 + 3 = 9 with three Tuners.
		expect(summons(board({ monsters: ["tuner-1", "tuner-2", "tuner-3", "dragon-3"], extra: ["fixture-synchro-two-tuners-9"] }))).toEqual(["special-summon fixture-synchro-two-tuners-9"]);
		// 1 + 2 + 3 + 3 = 9 with two Tuners and two non-Tuners: not a legal set.
		expect(summons(board({ monsters: ["tuner-1", "tuner-2", "dragon-3", "dragon-3"], extra: ["fixture-synchro-two-tuners-9"] }))).toEqual([]);
	});
	it("\"2 Tuners + 1+ non-Tuner monsters\": exactly two Tuners, with any number of non-Tuners (the printed wording of the made-up card)", () => {
		// 1 + 2 + 4 = 7.
		expect(summons(board({ monsters: ["tuner-1", "tuner-2", "lv4"], extra: ["fixture-synchro-double-tuning-7"] }))).toEqual(["special-summon fixture-synchro-double-tuning-7"]);
		// 1 + 2 + 3 + 1 = 7 needs three Tuners: not offered.
		expect(summons(board({ monsters: ["tuner-1", "tuner-2", "tuner-3", "lv1"], extra: ["fixture-synchro-double-tuning-7"] }))).toEqual([]);
		// 1 + 2 + 1 + 3 = 7: two Tuners and two non-Tuners; the player chooses nothing (every card is needed) but the zone.
		const done = play(board({ monsters: ["tuner-1", "tuner-2", "lv1", "lv3"], extra: ["fixture-synchro-double-tuning-7"] }), "special-summon fixture-synchro-double-tuning-7", "place 0");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["lv1", "lv3", "tuner-1", "tuner-2"]);
	});
	it(`${cites("rules", "synchro-procedure")} a Synchro Monster that does not say otherwise still takes exactly 1 Tuner`, () => {
		// 1 + 2 + 2 = 5 with two Tuners is not a set for a generic Level 5 Synchro Monster; 2 + 3 is.
		expect(summons(board({ monsters: ["tuner-1", "tuner-2", "lv2"], extra: ["synchro-5"] }))).toEqual([]);
		expect(summons(board({ monsters: ["tuner-2", "lv3"], extra: ["synchro-5"] }))).toEqual(["special-summon synchro-5"]);
	});
});
