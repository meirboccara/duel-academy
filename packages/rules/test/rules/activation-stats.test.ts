import { describe, expect, it } from "vitest";
import { addModifier, atk, type CardDef, cites, type Duel, tribute } from "../../src";
import { offered, play, position } from "./fixtures";

/**
 * S7 of docs/rules-core/sky-striker-gaps.md: the ATK and DEF of a monster when it activated its effect, read before its cost
 * (`Link.stats`), for "When a monster your opponent controls with 2000 or more ATK activates its effect" (Prototype Sky Striker Ace -
 * Amatsu). Konami's Japanese Q&A fid 24164 (OCG only): a monster that Tributes itself as the cost is judged by the ATK it had before
 * it left. Made-up cards: a 1500 ATK monster that Tributes itself, and a monster with Amatsu's condition.
 */
function cards(log: string[]): Record<string, CardDef> {
	return {
		// "You can Tribute this card; ..." (Primite Dragon Ether Beryl's kind of cost).
		"fixture-beryl": { code: "fixture-beryl", kind: "monster", facts: { level: 4, atk: 1500, def: 600 }, effects: [{ type: "ignition", cost: (duel, { card }) => tribute(duel, [card.id]), operation: (duel) => duel }] },
		// "When a monster your opponent controls with 2000 or more ATK activates its effect (Quick Effect): You can ...".
		"fixture-amatsu": {
			code: "fixture-amatsu",
			kind: "monster",
			facts: { level: 4, atk: 1500, def: 0 },
			effects: [
				{
					type: "quick",
					condition: (duel, { player }) => {
						const top = duel.chain[duel.chain.length - 1];
						return top !== undefined && top.player !== player && top.stats !== undefined && top.stats.atk >= 2000;
					},
					operation: (duel) => (log.push("amatsu"), duel),
				},
			],
		},
		"fixture-spell": { code: "fixture-spell", kind: "spell", effects: [{ type: "activation", operation: (duel) => duel }] },
	};
}

const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;
const board = (log: string[] = []): Duel => position({ defs: cards(log), turn: "rival", options: { everyWindow: true }, you: { monsters: ["fixture-amatsu"] }, rival: { monsters: ["fixture-beryl"], hand: ["fixture-spell"] } });

describe("the ATK of a monster when its effect was activated (S7)", () => {
	it(`${cites("rules", "activating-monster-atk-before-cost")} the link keeps the ATK and DEF the monster had before its cost: a monster raised to 2000 or more that Tributes itself still "has 2000 or more ATK"`, () => {
		const start = board();
		const beryl = idOf(start, "fixture-beryl");
		const raised = addModifier(start, { affects: { card: beryl, moves: start.cards[beryl]!.moves }, until: start.turn.number, layer: { kind: "add", stat: "atk", by: 600 } });
		expect(atk(raised, beryl)).toBe(2100);
		const activated = play(raised, "activate fixture-beryl");
		// The monster is in the GY as its cost: its ATK is no longer 2100 there, the link remembers it.
		expect(activated.cards[beryl]!.zone).toBe("graveyard");
		expect(atk(activated, beryl)).toBe(1500);
		expect(activated.chain[0]!.stats).toEqual({ atk: 2100, def: 600 });
		expect(offered(activated)).toEqual(["activate fixture-amatsu", "pass"]);
	});
	it(`${cites("rules", "activating-monster-atk-before-cost")} with less than 2000 ATK before the cost, the condition is not met; a Spell Card's activation has no ATK`, () => {
		const activated = play(board(), "activate fixture-beryl");
		expect(activated.chain[0]!.stats).toEqual({ atk: 1500, def: 600 });
		expect(offered(activated)).toEqual(["pass"]);
		const spell = play(board(), "activate fixture-spell");
		expect(spell.chain[0]!.stats).toBeUndefined();
		expect(offered(spell)).toEqual(["pass"]);
	});
});
