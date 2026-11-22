import { describe, expect, it } from "vitest";
import { botMove, seeded } from "../bot";
import { cardOf, type CardId } from "../cards";
import { apply, board, actor, type Board } from "../engine";
import { deckProblems, MASTER_LP, OPENING_HAND, shuffled } from "../masters";
import { PACK_IDS, PACKS, type PackId } from ".";

/** Each meta pack is a legal deck whose cards the engine plays, and two pack trainers finish a duel without getting stuck. */
const MOST_MOVES = 2500;

function duel(first: PackId, second: PackId, seed: number): { board: Board; effects: number } {
	const random = seeded(seed);
	const deal = (pack: PackId) => {
		const cards = shuffled(PACKS[pack].deck.main, random);
		return { lp: MASTER_LP, hand: cards.slice(0, OPENING_HAND), deck: cards.slice(OPENING_HAND), extra: [...PACKS[pack].deck.extra] };
	};
	let state = board({ full: true, seed, turnNumber: 1, phase: "draw", you: deal(first), rival: deal(second) });
	let effects = 0;
	for (let move = 0; move < MOST_MOVES && !state.winner; move++) {
		const persona = PACKS[actor(state) === "you" ? first : second].persona;
		const chosen = botMove(state, persona, random);
		const result = apply(state, chosen);
		if (!result.ok) throw new Error(`move ${move} refused (${result.reason}): ${JSON.stringify(chosen)}`);
		state = result.board;
		effects += result.events.filter((event) => event.type === "effect-used").length;
	}
	return { board: state, effects };
}

describe.each(PACK_IDS.map((id) => [id] as const))("the %s pack", (id) => {
	const pack = PACKS[id];
	it("is a legal deck: 40 cards, the Forbidden & Limited List, Extra Deck monsters in the Extra Deck", () => {
		expect(deckProblems(pack.deck)).toEqual([]);
	});
	it("names its archetype's engine cards, all in its deck", () => {
		for (const card of pack.engine) expect(pack.deck.main.includes(card) || pack.deck.extra.includes(card), card).toBe(true);
		expect(pack.engine.length).toBeGreaterThan(0);
		expect(pack.engine.every((card: CardId) => !!cardOf(card))).toBe(true);
	});
});

describe("pack against pack", () => {
	it.each([1, 2])("Blue-Eyes against HERO ends without getting stuck, and both use their effects (seed %i)", (seed) => {
		const result = duel("blue-eyes", "hero", seed);
		expect(result.board.chain).toEqual([]);
		expect(result.board.winner).not.toBeNull();
		expect(result.effects).toBeGreaterThan(0);
	}, 240000);
});
