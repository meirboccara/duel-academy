import { describe, expect, it } from "vitest";
import { botMove, HINT_PERSONA, seeded } from "@duel-academy/engine";
import type { CardId } from "@duel-academy/engine";
import { apply, board, type Board } from "@duel-academy/engine";

/**
 * Trainer against trainer, with the cards that make long Chains: every move the bot picks is accepted, every Chain
 * resolves, and the duel ends or runs out of moves without getting stuck.
 */
const MOST_MOVES = 1500;

/** The same cards in another order, from a seed. */
function shuffled(cards: readonly CardId[], seed: number): CardId[] {
	const random = seeded(seed);
	const out = [...cards];
	for (let index = out.length - 1; index > 0; index--) {
		const swap = Math.floor(random() * (index + 1));
		[out[index], out[swap]] = [out[swap] as CardId, out[index] as CardId];
	}
	return out;
}

function duel(deckA: readonly CardId[], deckB: readonly CardId[], seed: number): { board: Board; moves: number; longest: number; effects: number } {
	const you = shuffled(deckA, seed);
	const rival = shuffled(deckB, seed * 31 + 7);
	let state = board({ full: true, seed, turnNumber: 1, phase: "draw", you: { hand: you.slice(0, 5), deck: you.slice(5) }, rival: { hand: rival.slice(0, 5), deck: rival.slice(5) } });
	const random = seeded(seed);
	let longest = 0;
	let moves = 0;
	let effects = 0;
	for (; moves < MOST_MOVES && !state.winner; moves++) {
		const move = botMove(state, HINT_PERSONA, random);
		const result = apply(state, move);
		if (!result.ok) throw new Error(`move ${moves} refused (${result.reason}): ${JSON.stringify(move)}`);
		state = result.board;
		effects += result.events.filter((event) => event.type === "effect-used").length;
		longest = Math.max(longest, state.chain.length + (state.pending ? 1 : 0));
	}
	return { board: state, moves, longest, effects };
}

const CHAINS: CardId[] = [
	"elemental-hero-blazeman",
	"polymerization",
	"ash-blossom-joyous-spring",
	"ghost-ogre-snow-rabbit",
	"effect-veiler",
	"infinite-impermanence",
	"solemn-strike",
	"seven-tools-of-the-bandit",
	"magic-jammer",
	"reinforcement-of-the-army",
	"elemental-hero-sparkman",
	"iron-boar",
	"celtic-guardian",
	"pot-of-greed",
	"elemental-hero-blazeman",
	"solemn-strike",
	"iron-boar",
	"ash-blossom-joyous-spring",
	"droll-lock-bird",
	"elemental-hero-sparkman",
] as CardId[];

/** Cards written as data: searches, sends, Summons from the Deck and the GY, and the triggers they start. */
const DATA: CardId[] = [
	"sage-with-eyes-of-blue",
	"sage-with-eyes-of-blue",
	"the-white-stone-of-legend",
	"blue-eyes-white-dragon",
	"blue-eyes-white-dragon",
	"effect-veiler",
	"foolish-burial",
	"terraforming",
	"umi",
	"one-for-one",
	"destiny-hero-malicious",
	"destiny-hero-malicious",
	"elemental-hero-shadow-mist",
	"elemental-hero-sparkman",
	"toon-table-of-contents",
	"toon-alligator",
	"ash-blossom-joyous-spring",
	"iron-boar",
	"celtic-guardian",
	"solemn-strike",
] as CardId[];

describe("trainer against trainer with cards written as data", () => {
	it.each([1, 2, 3])("every effect the bot picks is accepted and the duel never gets stuck (seed %i)", (seed) => {
		const result = duel(DATA, CHAINS, seed);
		expect(result.board.chain).toEqual([]);
		expect(result.effects).toBeGreaterThan(0);
		expect(result.board.winner !== null || result.moves === MOST_MOVES).toBe(true);
	});
});

describe("trainer against trainer with Chain cards", () => {
	it.each([1, 2, 3])("ends or keeps going without getting stuck (seed %i)", (seed) => {
		const result = duel(CHAINS, [...CHAINS].reverse(), seed);
		expect(result.board.chain).toEqual([]);
		expect(result.moves).toBeGreaterThan(10);
		expect(result.board.winner !== null || result.moves === MOST_MOVES).toBe(true);
	});
	it("has an answer wait on the Chain for the other player's answer in at least one of these duels", () => {
		const longest = Math.max(...[1, 2, 3, 4, 5, 6].map((seed) => duel(CHAINS, CHAINS, seed).longest));
		expect(longest).toBeGreaterThanOrEqual(2);
	});
});
