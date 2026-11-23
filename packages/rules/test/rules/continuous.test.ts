import { describe, expect, it } from "vitest";
import { atk, cites, def, isNegated, level, originalAtk } from "../../src";
import { moveCard } from "../../src";
import { nextTurn } from "./continuous-fixtures";
import { play, position, REAL_CARDS } from "./fixtures";
import { continuousCards } from "./continuous-fixtures";

const defs = continuousCards();
const options = { everyWindow: true };

/** The id of the only card with this code on the side. */
const idOf = (duel: ReturnType<typeof position>, code: string) => Object.values(duel.cards).find((card) => card.code === code)!.id;

describe("ATK, DEF and Level are queries over the board", () => {
	it(`${cites("rules", "atk-original-glossary")} a monster's ATK, DEF and Level are the printed ones, and its original ATK too`, () => {
		const start = position({ defs, you: { monsters: ["big"] } });
		const id = idOf(start, "big");
		expect([atk(start, id), def(start, id), level(start, id), originalAtk(start, id)]).toEqual([2000, 1000, 4, 2000]);
	});
});

describe("ATK changes: the original ATK first, the rest on top, a later 'becomes' over an earlier one", () => {
	const shrinkDefs = { ...defs, ...REAL_CARDS };
	it(`${cites("rules", "shrink-recomputes-losses")} a loss that was there before Shrink is added on top of the halved original ATK`, () => {
		const start = position({ defs: shrinkDefs, options, you: { hand: ["drain", "shrink"], monsters: ["tower"] } });
		const lowered = play(start, "activate drain > tower", "pass", "pass");
		expect(atk(lowered, idOf(lowered, "tower"))).toBe(2400);
		const done = play(lowered, "activate shrink > tower", "pass", "pass");
		expect(atk(done, idOf(done, "tower"))).toBe(800);
	});
	it(`${cites("rules", "set-then-shrink")} a later change of the original ATK beats an earlier 'becomes 0'`, () => {
		const start = position({ defs: shrinkDefs, options, you: { hand: ["zero", "shrink"], monsters: ["huge"] } });
		const zeroed = play(start, "activate zero > huge", "pass", "pass");
		expect(atk(zeroed, idOf(zeroed, "huge"))).toBe(0);
		const done = play(zeroed, "activate shrink > huge", "pass", "pass");
		expect(atk(done, idOf(done, "huge"))).toBe(1500);
	});
});

describe("two continuous effects that change the same ATK: the later one wins, and the older comes back when the later one stops applying", () => {
	/** Brings a face-up Spell to the field again, so its effect began to apply last. */
	const later = (duel: ReturnType<typeof position>, code: string) => {
		const id = idOf(duel, code);
		return moveCard(moveCard(duel, id, { zone: "spell", face: "down" }), id, { zone: "spell", face: "up" });
	};
	const board = () => position({ defs, you: { monsters: ["blank"], faceupSpells: ["set-spell", "double-spell"] } });
	// The cards are made up (an Equip Card waits for step 7): "set-spell" makes the ATK 2500, "double-spell" doubles the original
	// ATK while its controller has fewer Life Points than the opponent (Megamorph's wording).
	it(`${cites("rules", "set-vs-original-later-wins-a")} a 'becomes' that began later wins over a change of the original ATK, whatever the Life Points`, () => {
		const start = later(board(), "set-spell");
		const id = idOf(start, "blank");
		expect(atk(start, id)).toBe(2500);
		expect(atk({ ...start, lp: { you: 100, rival: 8000 } }, id)).toBe(2500);
	});
	it(`${cites("rules", "set-vs-original-later-wins-b")} a change of the original ATK that began later wins while it applies, and the older 'becomes' is back when it does not`, () => {
		const start = later(board(), "double-spell");
		const id = idOf(start, "blank");
		// Equal Life Points: the doubling changes nothing, so the 'becomes' is what is read.
		expect(atk(start, id)).toBe(2500);
		// Fewer Life Points: the doubling of the original ATK (0) is the later effect, so the ATK is 0.
		expect(atk({ ...start, lp: { you: 100, rival: 8000 } }, id)).toBe(0);
	});
});

describe("a monster whose effects are negated has its continuous effects switched off too", () => {
	const negating = { ...REAL_CARDS, ...defs };
	it(`${cites("rules", "impermanence-only-monster-zone")} Infinite Impermanence takes away Muka Muka's gain until the end of the turn: the effects that apply while it is in the Monster Zone are negated`, () => {
		const start = position({ defs: negating, you: { monsters: ["muka-muka"], hand: ["idle", "small", "small"] }, rival: { set: ["infinite-impermanence"] } });
		const id = idOf(start, "muka-muka");
		expect(atk(start, id)).toBe(1500);
		const negated = play(start, "set idle", "activate infinite-impermanence > muka-muka");
		expect(isNegated(negated, id)).toBe(true);
		expect([atk(negated, id), def(negated, id)]).toEqual([600, 300]);
		// When the turn is over the negation is over, and the gain applies again.
		const later = nextTurn(negated, 4);
		expect(isNegated(later, id)).toBe(false);
		expect(atk(later, id)).toBe(600 + 300 * later.piles.you.hand.length);
	});
});
