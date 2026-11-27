import { describe, expect, it } from "vitest";
import { type CardDef, cites, createDuel, type Duel, moveCard } from "../../src";
import { position } from "./fixtures";

/**
 * `CardInstance.sentTurn`: the number of the turn in which the card was sent to the Graveyard, while it has stayed there since; 0
 * elsewhere. What "if this card is in the GY because it was sent there this turn" reads (The Dragon that Devours the Dogma). Konami's
 * Japanese notes on that card (OCG only): it must have been sent to the GY and stayed there until that turn's End Phase. A card placed
 * in the GY by a rule is not "sent" there (fid 24001). Made-up cards only.
 */
const defs: Record<string, CardDef> = {
	"fixture-plain": { code: "fixture-plain", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
	// "Any card sent to the GY is banished instead" (Macro Cosmos's lasting part).
	"fixture-cosmos": {
		code: "fixture-cosmos",
		kind: "trap",
		effects: [
			{ type: "activation", stays: true },
			{ type: "continuous", modifies: () => [{ kind: "redirect", from: "graveyard", to: "banished" }] },
		],
	},
};

const idOf = (duel: Duel, code: string, zone?: string): number => Object.values(duel.cards).find((card) => card.code === code && (zone === undefined || card.zone === zone))!.id;
const nextTurn = (duel: Duel): Duel => ({ ...duel, turn: { ...duel.turn, number: duel.turn.number + 1 } });

describe("the turn a card was sent to the Graveyard (sentTurn)", () => {
	it(`${cites("rules", "sent-this-turn-stayed-in-graveyard")} is the turn number when the card is sent to the GY, from the field, the hand or the Deck; 0 for a card that never was`, () => {
		const start = position({ defs, you: { monsters: ["fixture-plain"], hand: ["fixture-plain"], deck: ["fixture-plain"] } });
		expect(Object.values(start.cards).map((card) => card.sentTurn)).toEqual([0, 0, 0]);
		const [field, hand, deck] = [idOf(start, "fixture-plain", "monster"), idOf(start, "fixture-plain", "hand"), idOf(start, "fixture-plain", "deck")];
		const sent = [field, hand, deck].reduce((duel, id) => moveCard(duel, id, { zone: "graveyard" }), start);
		expect([field, hand, deck].map((id) => sent.cards[id]!.sentTurn)).toEqual([3, 3, 3]);
		expect(createDuel({ seed: 1, you: { deck: ["fixture-plain"] }, rival: { deck: [] }, defs }).cards[1]!.sentTurn).toBe(0);
	});
	it(`${cites("rules", "sent-this-turn-stayed-in-graveyard")} keeps the turn it was sent while it stays in the GY: on a later turn it is no longer "sent this turn"`, () => {
		const start = position({ defs, you: { monsters: ["fixture-plain"] } });
		const id = idOf(start, "fixture-plain");
		const later = nextTurn(moveCard(start, id, { zone: "graveyard" }));
		expect([later.turn.number, later.cards[id]!.sentTurn]).toEqual([4, 3]);
	});
	it(`${cites("rules", "sent-this-turn-stayed-in-graveyard")} is lost when the card leaves the GY, and sent there again, it is the turn of that new sending`, () => {
		const start = position({ defs, you: { monsters: ["fixture-plain"] } });
		const id = idOf(start, "fixture-plain");
		const sent = moveCard(start, id, { zone: "graveyard" });
		const banished = moveCard(sent, id, { zone: "banished" });
		expect(banished.cards[id]!.sentTurn).toBe(0);
		const back = moveCard(nextTurn(moveCard(banished, id, { zone: "hand" })), id, { zone: "graveyard" });
		expect(back.cards[id]!.sentTurn).toBe(4);
		expect(moveCard(sent, id, { zone: "monster" }).cards[id]!.sentTurn).toBe(0);
	});
	it(`${cites("rules", "temporary-banishment-placed-not-sent")} a card placed in the GY by a rule of the game was not sent there: 0`, () => {
		const start = position({ defs, you: { monsters: ["fixture-plain"] } });
		const id = idOf(start, "fixture-plain");
		const placed = moveCard(moveCard(start, id, { zone: "banished" }), id, { zone: "graveyard", placed: true });
		expect(placed.cards[id]).toMatchObject({ zone: "graveyard", sentTurn: 0 });
	});
	it(`${cites("rules", "redirect-effect-send-banished")} a card banished instead of being sent to the GY is not in the GY: 0`, () => {
		const start = position({ defs, you: { monsters: ["fixture-plain"] }, rival: { faceupSpells: ["fixture-cosmos"] } });
		const id = idOf(start, "fixture-plain");
		expect(moveCard(start, id, { zone: "graveyard" }).cards[id]).toMatchObject({ zone: "banished", sentTurn: 0 });
	});
});
