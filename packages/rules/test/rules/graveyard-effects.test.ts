import { describe, expect, it } from "vitest";
import { type CardDef, moveCard } from "../../src";
import { codes, offered, play, position } from "./fixtures";

/**
 * Effects a player activates with a card that is in their Graveyard or banished (`range: "graveyard"` / `"banished"` on an Ignition or
 * Quick Effect): listed by `legalActions` like those of the hand and the field. Made-up cards; the first real consumer is Wishes for
 * Eyes of Blue (test/cards/wishes-for-eyes-of-blue.test.ts, which cites Konami's notes on it).
 */
function cards(log: string[]): Record<string, CardDef> {
	const all: CardDef[] = [
		// "You can banish this card from your GY; (logged)." An Ignition Effect in the Graveyard.
		{ code: "fixture-grave-ignition", kind: "spell", facts: { name: "Fixture Grave Ignition" }, effects: [{ type: "activation", operation: (duel) => duel }, { type: "ignition", range: "graveyard", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }), operation: (duel) => (log.push("grave-ignition"), duel) }] },
		// A Quick Effect in the Graveyard, and an Ignition Effect while banished.
		{ code: "fixture-grave-quick", kind: "monster", facts: { name: "Fixture Grave Quick", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "quick", range: "graveyard", once: { scope: "name" }, operation: (duel) => (log.push("grave-quick"), duel) }] },
		{ code: "fixture-banished-ignition", kind: "monster", facts: { name: "Fixture Banished Ignition", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "ignition", range: "banished", once: { scope: "name" }, operation: (duel) => (log.push("banished-ignition"), duel) }] },
		{ code: "fixture-vanilla", kind: "monster", facts: { name: "Fixture Vanilla", level: 4, atk: 1500, def: 1000, normal: true } },
	];
	return Object.fromEntries(all.map((card) => [card.code, card]));
}
const activations = (duel: ReturnType<typeof position>) => offered(duel).filter((label) => label.startsWith("activate"));

describe("effects activated in the Graveyard or while banished", () => {
	it("offers an Ignition Effect of a card in its owner's Graveyard in their Main Phase with the game state open, and nowhere else", () => {
		const log: string[] = [];
		const duel = position({ defs: cards(log), you: { graveyard: ["fixture-grave-ignition"], hand: ["fixture-vanilla"] }, rival: { graveyard: ["fixture-grave-ignition"] } });
		expect(activations(duel)).toEqual(["activate fixture-grave-ignition"]);
		const done = play(duel, "activate fixture-grave-ignition");
		expect(log).toEqual(["grave-ignition"]);
		expect(codes(done, "you", "banished")).toEqual(["fixture-grave-ignition"]);
		// Banished, it has no such effect; in the Battle Phase, or in the opponent's turn, an Ignition Effect is not offered.
		expect(activations(done)).toEqual([]);
		expect(activations(position({ defs: cards(log), phase: "battle", you: { graveyard: ["fixture-grave-ignition"] } }))).toEqual([]);
		expect(activations(position({ defs: cards(log), turn: "rival", you: { graveyard: ["fixture-grave-ignition"] } }))).toEqual([]);
	});
	it("offers a Quick Effect of a card in the Graveyard in response, and an Ignition Effect of a face-up banished card, each with its once-per-turn limit", () => {
		const log: string[] = [];
		const start = position({ defs: cards(log), you: { graveyard: ["fixture-grave-ignition", "fixture-banished-ignition", "fixture-banished-ignition"] }, rival: { graveyard: ["fixture-grave-quick"] } });
		const [, faceUp, faceDown] = start.piles.you.graveyard;
		const duel = moveCard(moveCard(start, faceUp!, { zone: "banished" }), faceDown!, { zone: "banished", face: "down" });
		expect(activations(duel)).toEqual(["activate fixture-banished-ignition", "activate fixture-grave-ignition"]);
		// The rival answers your Graveyard effect with theirs.
		const answered = play(duel, "activate fixture-grave-ignition");
		expect(offered(answered)).toEqual(["activate fixture-grave-quick", "pass"]);
		const done = play(answered, "activate fixture-grave-quick", "pass", "pass");
		expect(log).toEqual(["grave-quick", "grave-ignition"]);
		expect(activations(play(done, "activate fixture-banished-ignition", "pass"))).toEqual([]);
		expect(log).toEqual(["grave-quick", "grave-ignition", "banished-ignition"]);
	});
});
