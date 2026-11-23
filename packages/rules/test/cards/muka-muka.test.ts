import { describe, expect, it } from "vitest";
import { atk, cites, def, moveCard } from "../../src";
import { continuousCards } from "../rules/continuous-fixtures";
import { play, position, REAL_CARDS } from "../rules/fixtures";

const defs = { ...REAL_CARDS, ...continuousCards() };
const options = { everyWindow: true };
const idOf = (duel: ReturnType<typeof position>, code: string) => Object.values(duel.cards).find((card) => card.code === code)!.id;

describe("Muka Muka, written as an effect record", () => {
	it(`${cites("muka-muka", "notes")} gains 300 ATK and DEF for each card in its controller's hand, and follows the hand at once`, () => {
		const start = position({ defs, options, you: { monsters: ["muka-muka"], hand: ["small", "small"] }, rival: { hand: ["small"] } });
		const id = idOf(start, "muka-muka");
		expect([atk(start, id), def(start, id)]).toEqual([1200, 900]);
		// A card leaves the hand: the number follows at once (the notes: "ただちに変化します"); there is no stored value.
		const smaller = moveCard(start, start.piles.you.hand[0]!, { zone: "graveyard" });
		expect([atk(smaller, id), def(smaller, id)]).toEqual([900, 600]);
	});
	it(`${cites("muka-muka", "text")} counts only its controller's hand, and nothing while it is face-down or in the hand`, () => {
		const down = position({ defs, options, you: { facedown: ["muka-muka"], hand: ["small"] } });
		expect(atk(down, idOf(down, "muka-muka"))).toBe(600);
		const held = position({ defs, options, you: { hand: ["muka-muka", "small"] } });
		expect(atk(held, idOf(held, "muka-muka"))).toBe(600);
	});
	it(`${cites("rules", "shrink-then-own-gain")} Shrink halves the original ATK, then its own gain is added: 600 / 2 + 2 x 300`, () => {
		const start = position({ defs, options, you: { monsters: ["muka-muka"], hand: ["shrink", "small", "small"] } });
		const id = idOf(start, "muka-muka");
		expect(atk(start, id)).toBe(1500);
		const done = play(start, "activate shrink > muka-muka", "pass", "pass");
		// Shrink left the hand: 2 cards, 300 + 600.
		expect(atk(done, id)).toBe(900);
	});
});
