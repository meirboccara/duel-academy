import { describe, expect, it } from "vitest";
import { atk, cites, originalAtk } from "../../src";
import { continuousCards, nextTurn } from "../rules/continuous-fixtures";
import { offered, play, position, REAL_CARDS } from "../rules/fixtures";
import { readinessCards } from "../rules/readiness-fixtures";

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
	it(`${cites("rules", "unaffected-targeted-not-applied")} a monster unaffected by other cards' effects can be targeted, and its ATK is not halved; one unaffected by Trap effects only is halved (Shrink is a Spell)`, () => {
		const immuneDefs = { ...REAL_CARDS, ...readinessCards() };
		const start = position({ defs: immuneDefs, options, you: { hand: ["shrink", "shrink"] }, rival: { monsters: ["fixture-immune", "fixture-trap-immune"] } });
		expect(offered(start)).toContain("activate shrink > fixture-immune");
		const done = play(start, "activate shrink > fixture-immune", "pass", "pass", "activate shrink > fixture-trap-immune", "pass", "pass");
		expect([atk(done, idOf(done, "fixture-immune")), originalAtk(done, idOf(done, "fixture-immune"))]).toEqual([1000, 1000]);
		expect([atk(done, idOf(done, "fixture-trap-immune")), originalAtk(done, idOf(done, "fixture-trap-immune"))]).toEqual([500, 500]);
	});
});
