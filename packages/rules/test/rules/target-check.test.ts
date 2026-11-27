import { describe, expect, it } from "vitest";
import { act, type CardDef, cites, type Duel } from "../../src";
import { offered, position } from "./fixtures";

/**
 * S8 of docs/rules-core/sky-striker-gaps.md: a rule over the whole choice of targets (`EffectRecord.targetCheck`), for "target 2
 * face-up monsters on the field, including a monster you control" (S:P Little Knight ②): each pair is listed once, and only the pairs
 * that hold a monster of the player. A made-up Quick-Play Spell with that wording.
 */
const defs: Record<string, CardDef> = {
	"fixture-a": { code: "fixture-a", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
	"fixture-b": { code: "fixture-b", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
	"fixture-c": { code: "fixture-c", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
	"fixture-pair": {
		code: "fixture-pair",
		kind: "quick-play",
		effects: [
			{
				type: "activation",
				target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up"),
				targetCount: { min: 2, max: 2 },
				targetCheck: (duel, { player }, targets) => targets.some((id) => duel.cards[id]!.controller === player),
				operation: (duel) => duel,
			},
		],
	},
};

const pairs = (duel: Duel) => offered(duel).filter((label) => label.startsWith("activate fixture-pair"));

describe("a rule over the combination of targets (S8)", () => {
	it(`${cites("rules", "targets-including-text")} "target 2 monsters, including a monster you control": only the pairs that hold one are listed, each once, and no other is accepted`, () => {
		const start = position({ defs, you: { hand: ["fixture-pair"], monsters: ["fixture-a"] }, rival: { monsters: ["fixture-b", "fixture-c"] } });
		expect(pairs(start)).toEqual(["activate fixture-pair > fixture-a > fixture-b", "activate fixture-pair > fixture-a > fixture-c"]);
		const [spell, , b, c] = [1, 2, 3, 4];
		expect(start.cards[spell]!.code).toBe("fixture-pair");
		expect(() => act(start, { type: "activate", card: spell, effect: 0, targets: [b, c] })).toThrow(/not a legal action/);
	});
	it(`${cites("rules", "targets-including-text")} with no monster of the player, it cannot be activated, even with two monsters to target`, () => {
		const start = position({ defs, you: { hand: ["fixture-pair"] }, rival: { monsters: ["fixture-b", "fixture-c"] } });
		expect(pairs(start)).toEqual([]);
	});
});
