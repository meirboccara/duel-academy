import { bench, describe } from "vitest";
import { CARD_DEFS, type CardDef, cardsInColumn, createDuel, type Duel, legalActions, moveCard, negateColumn, pointedZones, summonZones } from "../src";
import { position } from "../test/rules/fixtures";

/**
 * Step 7: the zone queries on a board with Link Monsters on both sides and Extra Monster Zones taken, and the listing under an
 * Infinite Impermanence column negation. Run with `pnpm --filter @duel-academy/rules bench`; results in BASELINE.md.
 */
const link = (code: string, arrows: NonNullable<NonNullable<CardDef["facts"]>["arrows"]>): CardDef => ({ code, kind: "monster", facts: { frame: "link", arrows } });
const DEFS: Record<string, CardDef> = {
	...CARD_DEFS,
	"link-a": link("link-a", ["top", "bottom", "bottom-right"]),
	"link-b": link("link-b", ["top-left", "top-right", "left"]),
	"link-c": link("link-c", ["bottom-left", "bottom-right"]),
	normal: { code: "normal", kind: "monster", facts: { level: 4, normal: true } },
	fusion: { code: "fusion", kind: "monster", facts: { frame: "fusion", level: 6 } },
	spell: { code: "spell", kind: "spell", effects: [{ type: "activation", operation: (duel) => duel }] },
};

function linkedBoard(): Duel {
	let duel = createDuel({ seed: 3, you: { deck: ["normal", "normal", "normal"], extra: ["link-a", "link-b", "link-c", "fusion"] }, rival: { deck: ["normal"], extra: ["link-c"] }, defs: DEFS });
	const extra = (side: "you" | "rival", code: string) => duel.piles[side].extra.find((id) => duel.cards[id]!.code === code)!;
	duel = moveCard(duel, extra("you", "link-a"), { zone: "monster", slot: 5 });
	duel = moveCard(duel, extra("you", "link-b"), { zone: "monster", slot: 2 });
	duel = moveCard(duel, extra("rival", "link-c"), { zone: "monster", slot: 6, controller: "rival" });
	duel = moveCard(duel, duel.piles.you.deck[0]!, { zone: "monster", slot: 1 });
	return { ...duel, turn: { player: "you", number: 3, phase: "main1" } };
}

describe("zones, rules core", () => {
	const board = linkedBoard();
	const linkC = board.piles.you.extra.find((id) => board.cards[id]!.code === "link-c")!;
	const fusion = board.piles.you.extra.find((id) => board.cards[id]!.code === "fusion")!;
	const monsters = [...board.piles.you.monster, ...board.piles.rival.monster];
	bench("pointedZones of every monster on the field (3 Link Monsters, 1 other)", () => {
		for (const id of monsters) pointedZones(board, id);
	});
	bench("summonZones: a Link Monster from the Extra Deck (linked zones + Extra Link check)", () => {
		summonZones(board, "you", linkC);
	});
	bench("summonZones: a Fusion Monster from the Extra Deck", () => {
		summonZones(board, "you", fusion);
	});
	bench("cardsInColumn: every column", () => {
		for (let column = 0; column < 5; column++) cardsInColumn(board, column);
	});
	const crowded = position({ defs: DEFS, you: { hand: ["spell", "spell", "spell", "normal"], set: ["infinite-impermanence"] }, rival: { monsters: ["normal"] } });
	const negated = negateColumn(crowded, crowded.piles.you.spell[0]!, 3);
	bench("legalActions: four cards to place, each listed with its free zones", () => {
		legalActions(crowded);
	});
	bench("legalActions: the same under an Infinite Impermanence column negation", () => {
		legalActions(negated);
	});
});
