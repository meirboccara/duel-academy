import { describe, expect, it } from "vitest";
import { type CardDef, canSpecialSummon, cites, type Duel, negateCardEffects, specialSummon } from "../../src";
import { offered, play, position, type SideSpec } from "./fixtures";

/**
 * "You can only Special Summon "[name](s)" once per turn" (`CardDef.summon.oncePerTurn`, `specialOnceUsed` in src/modifiers.ts):
 * Sky Striker Ace - Hayate's line, read with Konami's Japanese notes on it (OCG only). Made-up cards: a Link-1 monster and a Main Deck
 * monster with that line, and a plain monster to use as material.
 */
const CARDS: Record<string, CardDef> = {
	"fixture-once-link": { code: "fixture-once-link", kind: "monster", facts: { name: "Fixture Once Link", frame: "link", link: 1, arrows: ["bottom"], atk: 1500 }, procedure: { kind: "link", materials: { min: 1 } }, summon: { oncePerTurn: true } },
	"fixture-once": { code: "fixture-once", kind: "monster", facts: { name: "Fixture Once", level: 4, atk: 1000, def: 0 }, summon: { oncePerTurn: true } },
	"fixture-plain": { code: "fixture-plain", kind: "monster", facts: { level: 1, atk: 0, def: 0 } },
};

const board = (you: SideSpec, rival: SideSpec = {}): Duel => position({ defs: CARDS, you, rival });
const ids = (duel: Duel, code: string): number[] => Object.values(duel.cards).filter((card) => card.code === code).map((card) => card.id);
/** Answers every question left with its first candidate (materials, zones). */
function settle(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && next.asking; guard++) next = play(next, offered(next).find((name) => name !== "pass")!);
	return next;
}

describe('"You can only Special Summon [this card] once per turn"', () => {
	it(`${cites("rules", "special-once-any-way")} once one is Link Summoned, the player cannot Special Summon another of that name this turn, by its procedure or by an effect`, () => {
		const start = board({ monsters: ["fixture-plain", "fixture-plain"], extra: ["fixture-once-link", "fixture-once-link"] });
		expect(offered(start)).toContain("special-summon fixture-once-link");
		const done = settle(play(start, "special-summon fixture-once-link"));
		expect(done.piles.you.monster.map((id) => done.cards[id]!.code)).toContain("fixture-once-link");
		expect(offered(done)).not.toContain("special-summon fixture-once-link");
	});
	it(`${cites("rules", "special-once-any-way")} a Special Summon by an effect counts too; each player has their own, a Normal Summon is not limited, and the next turn opens it again`, () => {
		const start = board({ hand: ["fixture-once", "fixture-once"] }, { hand: ["fixture-once"] });
		const [first, second, theirs] = ids(start, "fixture-once");
		const summoned = specialSummon(start, "you", first!);
		expect(summoned.cards[first!]!.zone).toBe("monster");
		expect(canSpecialSummon(summoned, "you", second!)).toBe(false);
		expect(specialSummon(summoned, "you", second!)).toBe(summoned);
		expect(canSpecialSummon(summoned, "rival", theirs!)).toBe(true);
		expect(offered(summoned)).toContain("summon fixture-once");
		const nextTurn = { ...summoned, turn: { ...summoned.turn, number: summoned.turn.number + 2 } };
		expect(canSpecialSummon(nextTurn, "you", second!)).toBe(true);
	});
	it(`${cites("rules", "special-once-not-an-effect")} it is not an effect: negating the effects of the monster Summoned does not lift it`, () => {
		const start = board({ hand: ["fixture-once", "fixture-once"] });
		const [first, second] = ids(start, "fixture-once");
		const summoned = specialSummon(start, "you", first!);
		expect(canSpecialSummon(negateCardEffects(summoned, first!, summoned.turn.number), "you", second!)).toBe(false);
	});
});
