import { legalPlays } from "@duel-academy/engine";
import { bench, describe } from "vitest";
import { act, legalActions } from "../src";
import { REFERENCE_BOARDS } from "./reference-boards";
import { REFERENCE_DUELS } from "./reference-duels";

/**
 * Run with `pnpm --filter @duel-academy/rules bench`; the numbers and ratios are kept in BASELINE.md.
 * Baseline: today's engine listing every legal move with its resulting board, on each reference board.
 */
describe("legal moves, today's engine (baseline)", () => {
	for (const [name, make] of Object.entries(REFERENCE_BOARDS)) {
		const state = make();
		bench(name, () => {
			legalPlays(state);
		});
	}
});

/** The new core listing every legal action on the same positions (reference-duels.ts). */
describe("legalActions, rules core", () => {
	for (const [name, make] of Object.entries(REFERENCE_DUELS)) {
		const duel = make();
		bench(name, () => {
			legalActions(duel);
		});
	}
});

/**
 * Like for like with `legalPlays`, which returns each move with the board it leads to: list the actions, then do each
 * one. An activation nobody answers resolves its whole chain here.
 */
describe("legalActions and the duel after each, rules core", () => {
	for (const [name, make] of Object.entries(REFERENCE_DUELS)) {
		const duel = make();
		bench(name, () => {
			for (const action of legalActions(duel)) act(duel, action);
		});
	}
});
