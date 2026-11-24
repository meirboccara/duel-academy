import { describe, expect, it } from "vitest";
import { canSetByEffect, cites, type Duel, fromOtherCards, setByEffect, viewFor, HIDDEN, type CardDef } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec, more: Record<string, CardDef> = {}, log: string[] = []): Duel => position({ defs: { ...gapCards(log), ...more }, you });
const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;
const cardOf = (duel: Duel, code: string) => duel.cards[idOf(duel, code)]!;

/**
 * An effect that Sets a Spell or Trap ("Set 1 ... Spell/Trap from your Deck", "Set this card from your GY", "target 1 Trap in your
 * GY; Set it"): `setByEffect`, `askSetByEffect`, `canSetByEffect` (src/set.ts). Primite Dragon Ether Beryl, Primite Drillbeam,
 * Blue-Eyes Tyrant Dragon and Lightstorm Dragon (texts); made-up cards with the same wording.
 */
describe("Setting a Spell or Trap by an effect", () => {
	it(`${cites("rules", "set-from-deck-text")} from the Deck: the card is placed face-down in the Spell & Trap Zone the player chooses`, () => {
		const duel = board({ hand: ["fixture-setter"], deck: ["fixture-trap", "fixture-plain"] });
		const asked = play(duel, "summon fixture-setter", "activate fixture-setter");
		// A monster cannot be Set this way: the only Spell/Trap of the Deck is taken, and the zone is asked.
		expect(offered(asked)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
		const done = play(asked, "place 3");
		expect(cardOf(done, "fixture-trap")).toMatchObject({ zone: "spell", face: "down", slot: 3, controller: "you" });
		expect(codes(done, "you", "deck")).toEqual(["fixture-plain"]);
	});
	it(`${cites("rules", "set-trap-not-the-same-turn")} a Trap Set by an effect cannot be activated in the turn it was Set, and can from the next turn`, () => {
		const duel = board({ deck: ["fixture-trap"] });
		const set = setByEffect(duel, "you", idOf(duel, "fixture-trap"));
		expect(set.setThisTurn).toEqual([idOf(duel, "fixture-trap")]);
		expect(offered(set)).not.toContain("activate fixture-trap");
		expect(offered({ ...set, setThisTurn: [] })).toContain("activate fixture-trap");
	});
	it(`${cites("rules", "set-quick-play-not-the-same-turn")} ${cites("rules", "set-from-gy-text")} a Quick-Play Spell Set from the GY by its own effect cannot be activated that turn; a Normal Spell Set by an effect can`, () => {
		const log: string[] = [];
		const duel = board({ graveyard: ["fixture-reset-quick"], deck: ["fixture-spell"] }, {}, log);
		const set = play(duel, "activate fixture-reset-quick", "place 0");
		expect(cardOf(set, "fixture-reset-quick")).toMatchObject({ zone: "spell", face: "down", slot: 0 });
		expect(offered(set).filter((name) => name.includes("fixture-reset-quick"))).toEqual([]);
		const spell = setByEffect(duel, "you", idOf(duel, "fixture-spell"), { slot: 2 });
		expect(offered(spell)).toContain("activate fixture-spell");
	});
	it(`${cites("rules", "set-from-deck-text")} with no free Spell & Trap Zone nothing can be Set, and nothing is: the effect cannot be activated`, () => {
		const full = { set: ["fixture-trap", "fixture-trap", "fixture-trap", "fixture-trap", "fixture-trap"] };
		const duel = board({ ...full, graveyard: ["fixture-reset-quick"], hand: ["fixture-setter"], deck: ["fixture-spell"] });
		expect(canSetByEffect(duel, "you", idOf(duel, "fixture-reset-quick"))).toBe(false);
		expect(offered(duel)).not.toContain("activate fixture-reset-quick");
		expect(setByEffect(duel, "you", idOf(duel, "fixture-reset-quick"))).toBe(duel);
		// The trigger of the Normal Summoned monster is not put on a chain either.
		expect(play(duel, "summon fixture-setter").building).toBeNull();
	});
	it(`${cites("rules", "set-field-spell-replaces")} a Field Spell is Set in the Field Zone, with a zone free or not; the one already there is sent to the GY`, () => {
		const duel = board({ set: ["fixture-trap", "fixture-trap", "fixture-trap", "fixture-trap", "fixture-trap", "fixture-field-b"], deck: ["fixture-field"] });
		expect(cardOf(duel, "fixture-field-b").zone).toBe("field");
		expect(canSetByEffect(duel, "you", idOf(duel, "fixture-field"))).toBe(true);
		const set = setByEffect(duel, "you", idOf(duel, "fixture-field"));
		expect([cardOf(set, "fixture-field"), cardOf(set, "fixture-field-b").zone]).toMatchObject([{ zone: "field", face: "down" }, "graveyard"]);
	});
	it("a monster and a card already on the field cannot be Set by it, a card of the opponent can (to the field of the player who Sets); a card unaffected by the effect stays where it is", () => {
		const immune: CardDef = { code: "fixture-immune-trap", kind: "trap", effects: [{ type: "activation", operation: (duel) => duel }] };
		const duel = position({ defs: { ...gapCards(), [immune.code]: immune }, you: { set: ["fixture-trap"], graveyard: ["fixture-plain", "fixture-spell"] }, rival: { deck: ["fixture-trap"] } });
		expect(canSetByEffect(duel, "you", idOf(duel, "fixture-plain"))).toBe(false);
		expect(canSetByEffect(duel, "you", duel.piles.you.spell[0]!)).toBe(false);
		expect(canSetByEffect(duel, "you", duel.piles.rival.deck[0]!)).toBe(true);
		expect(setByEffect(duel, "you", idOf(duel, "fixture-plain"))).toBe(duel);
		// The move is the effect's: a lasting "unaffected by other cards' effects" on the card in the GY stops it.
		const spell = idOf(duel, "fixture-spell");
		const shielded = { ...duel, clock: duel.clock + 1, modifiers: [{ stamp: duel.clock + 1, affects: { card: spell, moves: duel.cards[spell]!.moves }, until: 99, layer: { kind: "protect" as const, against: "effects" as const, from: fromOtherCards } }] };
		const by = { card: duel.cards[duel.piles.you.spell[0]!]!, player: "you" as const, effect: 0 };
		expect(setByEffect(shielded, "you", spell, { effect: by }).cards[spell]!.zone).toBe("graveyard");
		expect(setByEffect(duel, "you", spell, { effect: by }).cards[spell]!.zone).toBe("spell");
	});
	it("the opponent's view hides a card Set from the Deck, and shows that a card was Set", () => {
		const duel = board({ deck: ["fixture-trap"] });
		const set = setByEffect(duel, "you", idOf(duel, "fixture-trap"));
		const seen = viewFor(set, "rival").duel;
		expect(seen.cards[idOf(duel, "fixture-trap")]).toMatchObject({ code: HIDDEN, zone: "spell", face: "down" });
	});
});
