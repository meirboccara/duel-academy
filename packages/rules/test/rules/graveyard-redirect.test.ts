import { describe, expect, it } from "vitest";
import { addModifier, type CardDef, cites, destroyCard, type Duel, FOREVER, type GameEvent, moveCard, negateCardEffects, tribute } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";

/**
 * "Any card sent to the GY is banished instead" (the `redirect` layer, `graveyardRedirect` in src/modifiers.ts; costs in src/activation.ts).
 * Made-up cards: a Continuous Trap with Macro Cosmos's lasting part, monsters whose costs send themselves to the GY, discard themselves
 * or Tribute themselves, and a Spell that sends a monster from the Deck "and if you do" gains something. Konami's Japanese Q&A (OCG only)
 * on Mausoleum of White (fid 18128), Maiden of White (fid 14540) and Wishes for Eyes of Blue (fid 23815).
 */
function cards(log: string[]): Record<string, CardDef> {
	const logs = (code: string) => (duel: Duel) => (log.push(code), duel);
	return {
		"fixture-cosmos": {
			code: "fixture-cosmos",
			kind: "trap",
			effects: [
				{ type: "activation", stays: true },
				{ type: "continuous", modifies: () => [{ kind: "redirect", from: "graveyard", to: "banished" }] },
			],
		},
		// "(Quick Effect): You can send this card from your hand to the GY; ..." (Effect Veiler's kind of cost).
		"fixture-send-cost": { code: "fixture-send-cost", kind: "monster", facts: { level: 1, atk: 0, def: 0 }, effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: logs("fixture-send-cost") }] },
		// "(Quick Effect): You can discard this card; ..." (Ash Blossom's kind of cost).
		"fixture-discard-cost": { code: "fixture-discard-cost", kind: "monster", facts: { level: 1, atk: 0, def: 0 }, effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard", reason: "discarded" }), operation: logs("fixture-discard-cost") }] },
		// "You can Tribute this card; ..."
		"fixture-tribute-cost": { code: "fixture-tribute-cost", kind: "monster", facts: { level: 4, atk: 0, def: 0 }, effects: [{ type: "ignition", cost: (duel, { card }) => tribute(duel, [card.id]), operation: logs("fixture-tribute-cost") }] },
		// "Send 1 "fixture-plain" from your Deck to the GY, and if you do, [gain]." (Mausoleum of White's kind of "if you do").
		"fixture-bury": {
			code: "fixture-bury",
			kind: "spell",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
						const id = duel.piles[link.player].deck.find((card) => duel.cards[card]!.code === "fixture-plain");
						if (id === undefined) return duel;
						const sent = moveCard(duel, id, { zone: "graveyard", effect: link });
						return sent.cards[id]!.zone === "graveyard" ? (log.push("gained"), sent) : sent;
					},
				},
			],
		},
		"fixture-plain": { code: "fixture-plain", kind: "monster", facts: { level: 4, atk: 1000, def: 0 } },
		// A card that listens to events (none of its own), so that the Duel keeps the events of a move for the tests to read.
		"fixture-listener": { code: "fixture-listener", kind: "monster", effects: [{ type: "trigger", event: () => false, operation: (duel) => duel }] },
	};
}

const board = (log: string[], you: SideSpec, rival: SideSpec = {}): Duel => position({ defs: cards(log), you, rival });
const withCosmos = (log: string[], you: SideSpec, rival: SideSpec = {}): Duel => board(log, you, { faceupSpells: ["fixture-cosmos"], ...rival });
const movedOf = (duel: Duel, code: string) => duel.live.slice().reverse().find((event): event is Extract<GameEvent, { type: "moved" }> => event.type === "moved" && event.before.code === code);

describe("cards sent to the GY are banished instead", () => {
	it(`${cites("rules", "redirect-effect-send-banished")} ${cites("rules", "redirect-if-you-do-fails")} a card an effect sends to the GY is banished, face-up, and "if you do" (it was sent) is not applied; the resolved Spell is banished too`, () => {
		const log: string[] = [];
		const done = play(withCosmos(log, { hand: ["fixture-bury"], deck: ["fixture-plain"] }), "activate fixture-bury");
		expect([codes(done, "you", "banished").sort(), codes(done, "you", "graveyard"), log]).toEqual([["fixture-bury", "fixture-plain"], [], []]);
		expect(Object.values(done.cards).every((card) => card.zone !== "banished" || card.face === "up")).toBe(true);
		// Without it: sent, and the gain applies.
		const plain = play(board(log, { hand: ["fixture-bury"], deck: ["fixture-plain"] }), "activate fixture-bury");
		expect([codes(plain, "you", "graveyard").sort(), log]).toEqual([["fixture-bury", "fixture-plain"], ["gained"]]);
	});
	it(`${cites("rules", "send-cost-replaced-unpaid")} ${cites("rules", "discard-to-gy-cost-replaced-unpaid")} a cost that sends a card to the GY cannot be paid: the effect is not offered (a "discard ... to the GY" cost is written as a send)`, () => {
		const log: string[] = [];
		expect(offered(board(log, { hand: ["fixture-send-cost"] }))).toContain("activate fixture-send-cost");
		expect(offered(withCosmos(log, { hand: ["fixture-send-cost"] }))).not.toContain("activate fixture-send-cost");
	});
	it(`${cites("rules", "discard-cost-replaced-paid")} a discard cost is paid: the card is banished instead, and the effect is activated and resolves`, () => {
		const log: string[] = [];
		const done = play(withCosmos(log, { hand: ["fixture-discard-cost"] }), "activate fixture-discard-cost");
		expect([codes(done, "you", "banished"), log]).toEqual([["fixture-discard-cost"], ["fixture-discard-cost"]]);
		const moved = movedOf(moveCard(withCosmos(log, { hand: ["fixture-discard-cost"] }), 1, { zone: "graveyard", reason: "discarded" }), "fixture-discard-cost");
		// The move keeps its reason; where the card went says it was not sent to the GY.
		expect([moved?.reason, moved?.after.zone]).toEqual(["discarded", "banished"]);
	});
	it("a Tribute as a cost is paid, the monster banished (a Tribute is not a send to the GY: the core's reading, no page read)", () => {
		const log: string[] = [];
		const done = play(withCosmos(log, { monsters: ["fixture-tribute-cost"] }), "activate fixture-tribute-cost");
		expect([codes(done, "you", "banished"), log]).toEqual([["fixture-tribute-cost"], ["fixture-tribute-cost"]]);
	});
	it("a destroyed card is banished too, and its move still says it was destroyed; the replacement stops while its card is negated", () => {
		const log: string[] = [];
		const duel = withCosmos(log, { monsters: ["fixture-plain"] });
		const id = duel.piles.you.monster[0]!;
		const destroyed = destroyCard(duel, id, { destruction: { cause: "battle" } });
		const moved = movedOf(destroyed, "fixture-plain");
		expect([moved?.reason, moved?.after.zone]).toEqual(["destroyed", "banished"]);
		const cosmos = duel.piles.rival.spell[0]!;
		const negated = negateCardEffects(duel, cosmos, duel.turn.number);
		expect(destroyCard(negated, id, { destruction: { cause: "battle" } }).cards[id]!.zone).toBe("graveyard");
	});
	it("a replacement may reach only some cards (\"any monster sent to the GY\") and banish face-down", () => {
		const log: string[] = [];
		const duel = addModifier(board(log, { monsters: ["fixture-plain"], faceupSpells: ["fixture-bury"] }), {
			affects: () => false,
			until: FOREVER,
			layer: { kind: "redirect", from: "graveyard", to: "banished", face: "down", only: (board, card) => board.defs[card.code]?.kind === "monster" },
		});
		const [monster, trap] = [duel.piles.you.monster[0]!, duel.piles.you.spell[0]!];
		const sent = moveCard(moveCard(duel, monster, { zone: "graveyard" }), trap, { zone: "graveyard" });
		expect([sent.cards[monster]!.zone, sent.cards[monster]!.face, sent.cards[trap]!.zone]).toEqual(["banished", "down", "graveyard"]);
	});
});
