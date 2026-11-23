import { describe, expect, it } from "vitest";
import { atk, cites, originalAtk } from "../../src";
import { continuousCards, nextTurn } from "../rules/continuous-fixtures";
import { offered, play, position, REAL_CARDS } from "../rules/fixtures";

const defs = { ...REAL_CARDS, ...continuousCards() };
const options = { everyWindow: true };
const idOf = (duel: ReturnType<typeof position>, code: string) => Object.values(duel.cards).find((card) => card.code === code)!.id;

describe("Shrink, written as an effect record", () => {
	it(`${cites("shrink", "text")} targets a face-up monster of either player, and not a face-down one`, () => {
		const start = position({ defs, options, you: { hand: ["shrink"], monsters: ["big"], facedown: ["small"] }, rival: { monsters: ["huge"] } });
		expect(offered(start)).toEqual(["activate shrink > big", "activate shrink > huge", "change-position big", "flip-summon small", "pass", "set shrink"]);
	});
	it(`${cites("shrink", "text")} halves the original ATK of the target until the end of this turn`, () => {
		const start = position({ defs, options, you: { hand: ["shrink"], monsters: ["big"] }, rival: { monsters: ["huge"] } });
		const done = play(start, "activate shrink > huge", "pass", "pass");
		expect([atk(done, idOf(done, "huge")), originalAtk(done, idOf(done, "huge")), atk(done, idOf(done, "big"))]).toEqual([1500, 1500, 2000]);
		// It lasts through the End Phase of that turn, and is over when the next turn begins.
		const later = nextTurn(done, 4);
		expect(atk(later, idOf(later, "huge"))).toBe(3000);
	});
});
