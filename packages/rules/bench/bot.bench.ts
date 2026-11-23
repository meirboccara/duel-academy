import { bench, describe } from "vitest";
import { chooseAction, type Duel, LEVELS } from "../src";
import { REFERENCE_DUELS } from "./reference-duels";
import { HAND_TRAP_MIDGAME } from "./bot-boards";

/**
 * Step 9: one bot decision per level, on the reference positions and on a midgame board with hand traps in both hands and Set cards
 * on both sides. The expert row runs with a budget far above its own cost (`budgetMs: 60_000`), so it measures the full sampling
 * (4 candidates x 8 worlds, playouts to the end of the next turn); the spec's target is <= 1.5 s. Results in BASELINE.md.
 */
const BOARDS: Record<string, () => Duel> = { ...REFERENCE_DUELS, handTrapMidgame: HAND_TRAP_MIDGAME };

for (const [name, make] of Object.entries(BOARDS)) {
	describe(`bot decision, ${name}`, () => {
		const duel = make();
		for (const level of LEVELS) {
			bench(level, () => {
				chooseAction(duel, "you", { level, seed: 1, budgetMs: 60_000 });
			}, { iterations: level === "expert" ? 5 : 20, time: 0 });
		}
	});
}
