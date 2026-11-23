import { bench, describe } from "vitest";
import { act, type Action, type Duel, legalActions } from "../src";
import { position } from "../test/rules/fixtures";
import { summonCards } from "../test/rules/summon-fixtures";

/**
 * Step 8: the listing with Summon procedures to look at (an Extra Deck of fifteen monsters over five monsters on the field: each is
 * listed at most once, after a search that stops at the first legal set of materials), and whole Summons from the action to the
 * monster on the field. Run with `pnpm --filter @duel-academy/rules bench`; results in BASELINE.md.
 */
const DEFS = summonCards();
const EXTRA = ["synchro-5", "synchro-6", "synchro-7", "synchro-dragon-5", "xyz-4", "xyz-4-up", "xyz-4-plain-up", "link-2", "link-3", "link-2-low", "fusion-43", "fusion-many", "contact", "synchro-5", "xyz-4"];

const crowded = (): Duel => position({ defs: DEFS, you: { hand: ["lv6", "lv7", "lv4", "poly", "rite-exceed", "ritual-8"], monsters: ["tuner-2", "lv3", "lv4", "lv4-b", "lv2"], extra: EXTRA } });
/** No material for anything: every search runs to its end. */
const barren = (): Duel => position({ defs: DEFS, you: { hand: ["lv4"], monsters: ["lv1", "lv1", "lv1", "lv1", "lv1"], extra: EXTRA } });

const named = (duel: Duel, type: Action["type"], code: string): Action => legalActions(duel).find((action) => action.type === type && "card" in action && duel.cards[action.card]!.code === code)!;
/** Answers every question with its first choice until the duel waits on something else. */
function finish(duel: Duel): Duel {
	let next = duel;
	while (next.asking) next = act(next, legalActions(next).find((action) => action.type !== "pass") ?? legalActions(next)[0]!);
	return next;
}

describe("Summon procedures, rules core", () => {
	const board = crowded();
	const empty = barren();
	bench("legalActions: 15 Extra Deck monsters, 5 monsters on the field, 6 cards in hand (7 procedure Summons listed)", () => {
		legalActions(board);
	});
	bench("legalActions: the same Extra Deck with no legal material set (every search fails)", () => {
		legalActions(empty);
	});
	const synchro = named(board, "summon", "synchro-5");
	bench("a Synchro Summon from the action to the monster on the field (material and zone choices answered)", () => {
		finish(act(board, synchro));
	});
	const tribute = named(board, "summon", "lv7");
	bench("a Tribute Summon with 2 Tributes, from the action to the monster on the field", () => {
		finish(act(board, tribute));
	});
	const fusion = named(board, "activate", "poly");
	bench("Polymerization: activation, Fusion Monster, materials and zone chosen, Fusion Summon", () => {
		finish(act(board, fusion));
	});
	const ritual = named(board, "activate", "rite-exceed");
	bench("a Ritual Spell (equal or exceed): activation, Tributes and zone chosen, Ritual Summon", () => {
		finish(act(board, ritual));
	});
});
