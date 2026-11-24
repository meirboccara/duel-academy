import { describe, expect, it } from "vitest";
import { atk, canFusionSummon, canRitualSummon, canSpecialSummon, canSummonByEffect, changeControl, cites, flipFaceDown, flipFaceUp, type Duel, equipMonster, isNegated, moveCard, pendulumZones, specialSummon, summonByEffect } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { equipCards } from "./equip-fixtures";

function board(you: SideSpec, rival: SideSpec = {}, turn: "you" | "rival" = "you"): { duel: Duel; log: string[] } {
	const log: string[] = [];
	return { duel: position({ defs: equipCards(log), you, rival, turn }), log };
}
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((card) => card.code === code)!;

/**
 * Regression tests for the review of step 11's first slice (monsters treated as Equip Cards): each was red before its fix.
 */
describe("a Pendulum Monster that is an Equip Card", () => {
	it(`${cites("rules", "equipped-monster-is-equip-spell")} is not in a Pendulum Zone, even in the leftmost or rightmost Spell & Trap Zone: no Scale, no Pendulum Summon, no Pendulum Effect`, () => {
		const { duel } = board({ hand: ["fixture-vanilla"], monsters: ["fixture-white-dragon"], deck: ["fixture-scale-1", "fixture-scale-8"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const low = find(duel, "fixture-scale-1").id;
		const high = find(duel, "fixture-scale-8").id;
		// One Pendulum Monster in the left Pendulum Zone; the other equipped to the Dragon, in the rightmost Spell & Trap Zone.
		const scaled = moveCard(duel, low, { zone: "spell", face: "up", slot: 0 });
		const equipped = equipMonster(scaled, high, dragon, { player: "you", slot: 4 });
		expect(equipped.cards[high]).toMatchObject({ zone: "spell", slot: 4, equippedTo: dragon });
		expect(pendulumZones(equipped, "you")).toEqual([low]);
		expect(offered(equipped)).not.toContain("pendulum-summon");
		expect(offered(equipped).filter((label) => label.startsWith("activate"))).toEqual(["activate fixture-scale-1"]);
		// Both in their Pendulum Zones: the Level 4 monster of the hand can be Pendulum Summoned.
		const both = moveCard(scaled, high, { zone: "spell", face: "up", slot: 4 });
		expect(pendulumZones(both, "you")).toEqual([low, high]);
		expect(offered(both)).toContain("pendulum-summon");
	});
});

describe("a Fusion Monster's other way of being Special Summoned, against the rest of the core", () => {
	/** You control a "Fixture White Dragon" equipped with a Fusion Monster, and `fixture-tyrant` is in your Extra Deck. */
	const ready = (you: SideSpec = {}, rival: SideSpec = {}) => {
		const { duel, log } = board({ monsters: ["fixture-white-dragon"], ...you, extra: ["fixture-tyrant", "fixture-eyes-fusion", ...(you.extra ?? [])] }, rival);
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		return { duel: { ...equipMonster(duel, fusion, dragon, { player: "you", slot: 2 }), live: [], waiting: [] } as Duel, log, dragon, fusion, tyrant: find(duel, "fixture-tyrant").id };
	};
	it(`${cites("rules", "tribute-equipped-not-an-effect")} is the player's own action only: an effect that performs a Summon does not perform it`, () => {
		const { duel, dragon, tyrant } = ready();
		expect(offered(duel)).toContain("special-summon fixture-tyrant");
		expect(canSummonByEffect(duel, "you", tyrant)).toBe(false);
		expect(canSummonByEffect(duel, "you", tyrant, [dragon])).toBe(false);
		expect(summonByEffect(duel, 0, "you", tyrant)).toBe(duel);
		expect(summonByEffect(duel, 1, "you", tyrant, [dragon])).toBe(duel);
	});
	it(`${cites("rules", "tribute-equipped-then-summon")} is told apart from the card's contact Fusion when the same cards fit both: the player says which way, and the cards are handled that way`, () => {
		const { duel, log, dragon } = ready({ extra: ["fixture-two-ways"] }, { faceupSpells: ["fixture-spy"] });
		const ways = offered(duel).filter((label) => label.startsWith("special-summon fixture-two-ways"));
		expect(ways).toEqual(["special-summon fixture-two-ways by contact", "special-summon fixture-two-ways by tribute"]);
		// By Tributing: the monster is Tributed (as Fusion Material), not banished.
		log.length = 0;
		const tributed = play(duel, "special-summon fixture-two-ways by tribute", "place 0");
		expect(tributed.cards[dragon]!.zone).toBe("graveyard");
		expect(log).toEqual(["fixture-white-dragon tributed for fusion", "fixture-eyes-fusion destroyed"]);
		expect(codes(tributed, "you", "monster")).toEqual(["fixture-two-ways"]);
		// By the contact Fusion: it goes where the card says.
		log.length = 0;
		const banished = play(duel, "special-summon fixture-two-ways by contact", "place 0");
		expect(banished.cards[dragon]!.zone).toBe("banished");
		expect(log).toEqual(["fixture-eyes-fusion destroyed"]);
		// With one way open (nothing equipped), nothing is asked: the action is listed once, as before.
		const plain = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-two-ways"] }).duel;
		expect(offered(plain).filter((label) => label.startsWith("special-summon"))).toEqual(["special-summon fixture-two-ways"]);
		expect(play(plain, "special-summon fixture-two-ways", "place 0").cards[find(plain, "fixture-white-dragon").id]!.zone).toBe("banished");
	});
});

describe("an Equip Card that is a monster and negates its monster's effects", () => {
	const NEGATES = [{ kind: "negate" as const }];
	/** Your "Fixture Absorber" ("target 1 face-up monster your opponent controls; equip it to this card") is equipped with a monster that negates its effects. */
	const negatedAbsorber = (rival: SideSpec) => {
		const { duel } = board({ monsters: ["fixture-absorber"], extra: ["fixture-eyes-fusion"] }, { monsters: ["fixture-vanilla"], ...rival });
		const absorber = find(duel, "fixture-absorber").id;
		const equipped = equipMonster(duel, find(duel, "fixture-eyes-fusion").id, absorber, { player: "you", slot: 0, gives: NEGATES });
		return { duel: { ...equipped, live: [], waiting: [] } as Duel, absorber, vanilla: find(duel, "fixture-vanilla").id };
	};
	// YGOProJudge (asked 2026-11-24, no source cited): what the Equip Card gives is its own Spell effect, and stops while it is negated.
	it("negates the effect its monster activates, and no longer does while the Equip Card itself is negated: the chain and the queries agree (YGOProJudge lead, no Konami record)", () => {
		const applying = negatedAbsorber({});
		expect(isNegated(applying.duel, applying.absorber)).toBe(true);
		const stopped = play(applying.duel, "activate fixture-absorber > fixture-vanilla");
		expect(stopped.cards[applying.vanilla]).toMatchObject({ zone: "monster", equippedTo: null });
		// The rival's Continuous Spell negates the Spells on the field: the Equip Card gives nothing, so the monster's effect resolves.
		const lifted = negatedAbsorber({ faceupSpells: ["fixture-spell-negator"] });
		expect(isNegated(lifted.duel, lifted.absorber)).toBe(false);
		const resolved = play(lifted.duel, "activate fixture-absorber > fixture-vanilla", "place 1");
		expect(resolved.cards[lifted.vanilla]).toMatchObject({ zone: "spell", equippedTo: lifted.absorber });
	});
});

describe("a monster that is an Equip Card, for what asks for monsters", () => {
	it(`${cites("rules", "equipped-monster-is-equip-spell")} is not a monster to use as Fusion Material or to Tribute for a Ritual Summon, even for an effect that takes cards from the whole field: it is a Spell there`, () => {
		// "Fixture Tyrant": "Fixture White Dragon" + 1 Dragon monster. The only other Dragon is the Fusion Monster equipped to it.
		const { duel } = board({ hand: ["fixture-ritual"], monsters: ["fixture-white-dragon"], extra: ["fixture-tyrant", "fixture-eyes-fusion"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const field = (state: Duel, player: "you" | "rival") => [...state.piles[player].monster, ...state.piles[player].spell];
		const fromField = { pool: field };
		// A Level 10 Ritual Monster in the hand, "Tributing cards you control whose total Levels equal 10": the equipped card is Level 10.
		const ritual = { monsters: (state: Duel, player: "you" | "rival") => state.piles[player].hand, pool: (state: Duel, player: "you" | "rival") => field(state, player).filter((id) => id !== dragon), mode: "equal" as const };
		// As a monster on the field it is a material and a Tribute.
		const summoned = moveCard(duel, fusion, { zone: "monster" });
		expect(canFusionSummon(summoned, "you", fromField)).toBe(true);
		expect(canRitualSummon(summoned, "you", ritual)).toBe(true);
		const equipped = equipMonster(duel, fusion, dragon, { player: "you" });
		expect(canFusionSummon(equipped, "you", fromField)).toBe(false);
		expect(canRitualSummon(equipped, "you", ritual)).toBe(false);
	});
});

describe("what an Equip Card that is a monster gives, when the relation ends or its cards change hands", () => {
	const GIVES_400 = [{ kind: "add" as const, stat: "atk" as const, by: 400 }];
	const equippedDragon = () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		return { dragon, fusion, duel: equipMonster(duel, fusion, dragon, { player: "you", gives: GIVES_400 }) };
	};
	it(`${cites("rules", "equip-destroyed-with-monster")} is gone for good once its monster is flipped face-down: nothing is left to apply when the monster is face-up again`, () => {
		const { duel, dragon, fusion } = equippedDragon();
		const down = flipFaceDown(duel, dragon);
		expect(down.cards[fusion]).toMatchObject({ zone: "graveyard", equippedTo: null });
		expect(down.modifiers).toEqual([]);
		expect(atk(flipFaceUp(down, dragon, "attack"), dragon)).toBe(3000);
	});
	it("keeps giving while the card stays equipped, whoever controls the Equip Card or its monster, and leaves nothing once the card is gone (the core's reading for the Equip Card's control)", () => {
		const { duel, dragon, fusion } = equippedDragon();
		// The Equip Card changes control: it is still equipped to the same monster.
		const taken = changeControl(duel, fusion, "rival");
		expect(taken.cards[fusion]).toMatchObject({ zone: "spell", controller: "rival", equippedTo: dragon });
		expect(atk(taken, dragon)).toBe(3400);
		// Both change control, then the monster leaves: the Equip Card is destroyed and nothing is left.
		const both = changeControl(taken, dragon, "rival");
		expect(atk(both, dragon)).toBe(3400);
		const gone = moveCard(both, dragon, { zone: "hand" });
		expect(gone.cards[fusion]).toMatchObject({ zone: "graveyard", equippedTo: null });
		expect(gone.modifiers).toEqual([]);
	});
});

describe("\"properly Summoned first\" for an Extra Deck monster in a Spell & Trap Zone", () => {
	// YGOProJudge (asked 2026-11-24, no source cited): the rule applies to a card in a Pendulum Zone as it does in the Graveyard.
	it(`${cites("rules", "properly-summoned-first")} is asked of an Extra Deck Pendulum Monster in a Pendulum Zone as of an Equip Card: never properly Summoned, an effect cannot Special Summon it from there (the Pendulum Zone: YGOProJudge lead, no Konami record)`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-pendulum-xyz"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const xyz = find(duel, "fixture-pendulum-xyz").id;
		// Placed in a Pendulum Zone, or equipped to a monster, straight from the Extra Deck: never Xyz Summoned.
		const scaled = moveCard(duel, xyz, { zone: "spell", face: "up", slot: 0 });
		expect(pendulumZones(scaled, "you")).toEqual([xyz]);
		expect(canSpecialSummon(scaled, "you", xyz)).toBe(false);
		expect(canSpecialSummon(equipMonster(duel, xyz, dragon, { player: "you", slot: 0 }), "you", xyz)).toBe(false);
		// Properly Summoned first, then placed in the Pendulum Zone: it can be.
		const summoned = specialSummon(duel, "you", xyz, { kind: "xyz" });
		expect(summoned.cards[xyz]).toMatchObject({ zone: "monster", proper: true });
		const back = moveCard(summoned, xyz, { zone: "spell", face: "up", slot: 0 });
		expect(pendulumZones(back, "you")).toEqual([xyz]);
		expect(canSpecialSummon(back, "you", xyz)).toBe(true);
	});
});
