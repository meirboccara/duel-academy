import { legalPlays } from "@duel-academy/engine";
import { bench, describe } from "vitest";
import { REFERENCE_BOARDS } from "./reference-boards";

/**
 * Baseline: today's engine listing every legal move with its resulting board, on each reference board. Run with
 * `pnpm --filter @duel-academy/rules bench`. Later steps add the new core's numbers next to these.
 */
describe("legal moves, today's engine (baseline)", () => {
	for (const [name, make] of Object.entries(REFERENCE_BOARDS)) {
		const state = make();
		bench(name, () => {
			legalPlays(state);
		});
	}
});
