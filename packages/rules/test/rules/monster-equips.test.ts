import { describe, expect, it } from "vitest";
import { atk, belongsTo, canSpecialSummon, changeControl, columnOf, cardTypeOf, CARD_DEFS, canEquipMonster, cites, destroyCard, type Duel, equip, equipMonster, equipsOf, flipFaceDown, isEquipCard, isNegated, moveCard, printedFacts, specialSummon, withoutEnded } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { equipCards } from "./equip-fixtures";

const REAL = ["mystical-space-typhoon", "infinite-impermanence", "ghost-ogre-snow-rabbit", "solemn-judgment"] as const;

function board(you: SideSpec, rival: SideSpec = {}, turn: "you" | "rival" = "you"): { duel: Duel; log: string[] } {
	const log: string[] = [];
	const defs = { ...equipCards(log), ...Object.fromEntries(REAL.map((code) => [code, CARD_DEFS[code]!])) };
	return { duel: position({ defs, you, rival, turn }), log };
}
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((card) => card.code === code)!;
const GIVES_400 = [{ kind: "add" as const, stat: "atk" as const, by: 400 }];

/**
 * Step 11 of docs/rules-core-spec.md, monsters treated as Equip Cards (`equipMonster`, `askEquipMonster`, `canEquipMonster`,
 * `isEquipCard`, `cardTypeOf`, the `equipped` range, a Fusion Monster's `alternatives`). RB10's "Equip Cards" paragraph; Konami's
 * Japanese notes on Wishes for Eyes of Blue and Blue-Eyes Tyrant Dragon (OCG only); the rest rests on YGOProJudge and says so.
 */
describe("a monster equipped to another monster", () => {
	it(`${cites("rules", "equipped-monster-is-equip-spell")} sits face-up in a Spell & Trap Zone of the player who equipped it, linked to its monster, and is a Spell there, with its printed monster facts still readable`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		expect(canEquipMonster(duel, "you", fusion, dragon)).toBe(true);
		const equipped = equipMonster(duel, fusion, dragon, { player: "you", slot: 3 });
		expect(equipped.cards[fusion]).toMatchObject({ zone: "spell", face: "up", slot: 3, controller: "you", equippedTo: dragon });
		expect(codes(equipped, "you", "spell")).toEqual(["fixture-eyes-fusion"]);
		expect(codes(equipped, "you", "extra")).toEqual([]);
		expect(equipsOf(equipped, dragon)).toEqual([fusion]);
		expect(isEquipCard(equipped, fusion)).toBe(true);
		expect(isEquipCard(equipped, dragon)).toBe(false);
		// It is a Spell where it is; in the Extra Deck it was a monster.
		expect(cardTypeOf(equipped, equipped.cards[fusion]!)).toBe("spell");
		expect(cardTypeOf(duel, duel.cards[fusion]!)).toBe("monster");
		// What is printed on it is still read: "the equipped monster card" is a "Fixture Eyes" Fusion Monster.
		expect(belongsTo(equipped, fusion, "Fixture Eyes")).toBe(true);
		expect(printedFacts(equipped, fusion)).toMatchObject({ frame: "fusion", level: 10, monsterType: "Dragon" });
		// Never Summoned: it is not a Special Summoned monster, and was not properly Summoned.
		expect(equipped.cards[fusion]).toMatchObject({ specialSummoned: false, proper: false, summonedBy: null });
	});
	it(`${cites("rules", "equip-monster-from-extra-deck-text")} is equipped from the Extra Deck by an effect, in the zone its player chooses, and gives its monster 400 ATK while it stays equipped`, () => {
		const { duel } = board({ hand: ["fixture-prayer"], monsters: ["fixture-white-dragon", "fixture-vanilla"], extra: ["fixture-eyes-fusion", "fixture-eyes-synchro", "fixture-tyrant"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		// Only a "Fixture White Dragon" is a target; the monster to equip is chosen when the effect resolves, among the "Fixture Eyes" monsters.
		expect(offered(duel).filter((label) => label.startsWith("activate"))).toEqual(["activate fixture-prayer > fixture-white-dragon"]);
		const asked = play(duel, "activate fixture-prayer > fixture-white-dragon");
		expect(offered(asked)).toEqual(["choose fixture-eyes-fusion", "choose fixture-eyes-synchro"]);
		const zone = play(asked, "choose fixture-eyes-synchro");
		// The Spell is still on the field while it resolves, in the first zone.
		expect(offered(zone)).toEqual(["place 1", "place 2", "place 3", "place 4"]);
		const done = play(zone, "place 2");
		const synchro = find(done, "fixture-eyes-synchro");
		expect(synchro).toMatchObject({ zone: "spell", slot: 2, face: "up", equippedTo: dragon });
		expect(atk(done, dragon)).toBe(3400);
		expect(atk(done, find(done, "fixture-vanilla").id)).toBe(1500);
		// The Spell that equipped it has gone to the Graveyard; the Equip Card stays.
		expect(codes(done, "you", "graveyard")).toEqual(["fixture-prayer"]);
		expect(codes(done, "you", "spell")).toEqual(["fixture-eyes-synchro"]);
		// The gain lasts beyond the turn, while the card stays equipped.
		const later = { ...done, turn: { ...done.turn, number: done.turn.number + 4 } };
		expect(atk(later, dragon)).toBe(3400);
	});
	it(`${cites("rules", "equipped-monster-is-equip-spell")} does not apply its monster effects while it is an Equip Card: only what the effect that equipped it gives`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon", "fixture-vanilla"], extra: ["fixture-eyes-fusion"] });
		const [dragon, vanilla] = duel.piles.you.monster;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		// "All monsters you control gain 500 ATK": in the Monster Zone it applies, as an Equip Card it does not.
		const summoned = moveCard(duel, fusion, { zone: "monster" });
		expect([atk(summoned, dragon!), atk(summoned, vanilla!)]).toEqual([3500, 2000]);
		const equipped = equipMonster(duel, fusion, dragon!, { player: "you", gives: GIVES_400 });
		expect([atk(equipped, dragon!), atk(equipped, vanilla!)]).toEqual([3400, 1500]);
		// Equipped with nothing given, it changes nothing.
		const bare = equipMonster(duel, fusion, dragon!, { player: "you" });
		expect([atk(bare, dragon!), atk(bare, vanilla!)]).toEqual([3000, 1500]);
	});
	// YGOProJudge (asked 2026-11-24, no source cited): with no free Spell & Trap Zone the effect cannot be activated; if the last zone is taken before it resolves, the monster stays where it was.
	it("needs a free Spell & Trap Zone of the player who equips, at activation and at resolution; otherwise the monster stays where it was (YGOProJudge lead, no Konami record)", () => {
		const full = board({ hand: ["fixture-prayer"], monsters: ["fixture-white-dragon"], set: ["fixture-prayer", "fixture-prayer", "fixture-prayer", "fixture-prayer", "fixture-prayer"], extra: ["fixture-eyes-fusion"] }).duel;
		expect(offered(full).filter((label) => label.startsWith("activate"))).toEqual([]);
		const dragon = find(full, "fixture-white-dragon").id;
		const fusion = find(full, "fixture-eyes-fusion").id;
		expect(canEquipMonster(full, "you", fusion, dragon)).toBe(false);
		const tried = equipMonster(full, fusion, dragon, { player: "you", gives: GIVES_400 });
		expect(tried.cards[fusion]).toMatchObject({ zone: "extra", equippedTo: null });
		expect(atk(tried, dragon)).toBe(3000);
		// A face-down monster cannot be equipped, nor a monster to itself, nor a card that is not a monster.
		const { duel } = board({ hand: ["fixture-prayer"], monsters: ["fixture-white-dragon"], facedown: ["fixture-vanilla"], extra: ["fixture-eyes-fusion"] });
		const [faceUp, faceDown] = duel.piles.you.monster;
		const extra = duel.piles.you.extra[0]!;
		expect([canEquipMonster(duel, "you", extra, faceDown!), canEquipMonster(duel, "you", faceUp!, faceUp!), canEquipMonster(duel, "you", duel.piles.you.hand[0]!, faceUp!)]).toEqual([false, false, false]);
	});
	it(`${cites("rules", "equip-destroyed-with-monster")} is destroyed and sent to the Graveyard when its monster is destroyed, leaves the field or is flipped face-down, an Extra Deck monster too, and its gain ends`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const equipped = equipMonster(duel, fusion, dragon, { player: "you", gives: GIVES_400 });
		const outcomes = [destroyCard(equipped, dragon, { destruction: { cause: "game-mechanic" } }), moveCard(equipped, dragon, { zone: "banished" }), moveCard(equipped, dragon, { zone: "hand" }), flipFaceDown(equipped, dragon)];
		for (const after of outcomes) {
			// To the Graveyard, never back to the Extra Deck: it was on the field.
			expect(after.cards[fusion]).toMatchObject({ zone: "graveyard", equippedTo: null });
			expect(equipsOf(after, dragon)).toEqual([]);
		}
		// The monster is back with no gain when it returns to the field.
		const back = moveCard(outcomes[1]!, dragon, { zone: "monster" });
		expect(atk(back, dragon)).toBe(3000);
		expect(back.modifiers).toEqual([]);
	});
	it(`${cites("rules", "properly-summoned-first")} cannot be Special Summoned, as an Equip Card or from the Graveyard afterwards, when it was equipped straight from the Extra Deck: it was never properly Summoned`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const equipped = equipMonster(duel, fusion, dragon, { player: "you" });
		// Nor from the Spell & Trap Zone while it is an Equip Card ("Special Summon that equipped monster").
		expect(canSpecialSummon(equipped, "you", fusion)).toBe(false);
		const buried = moveCard(equipped, dragon, { zone: "graveyard" });
		expect(buried.cards[fusion]).toMatchObject({ zone: "graveyard", proper: false });
		expect(canSpecialSummon(buried, "you", fusion)).toBe(false);
		expect(canSpecialSummon(buried, "you", dragon)).toBe(true);
	});
	it(`${cites("mystical-space-typhoon", "text")} can be targeted and destroyed as a Spell on the field: its monster loses what it gave and stays`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] }, { hand: ["mystical-space-typhoon"] }, "rival");
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const equipped = equipMonster(duel, fusion, dragon, { player: "you", gives: GIVES_400 });
		expect(atk(equipped, dragon)).toBe(3400);
		expect(offered(equipped)).toContain("activate mystical-space-typhoon > fixture-eyes-fusion");
		const destroyed = play(equipped, "activate mystical-space-typhoon > fixture-eyes-fusion", "pass", "pass");
		expect(destroyed.cards[fusion]).toMatchObject({ zone: "graveyard", equippedTo: null });
		expect(destroyed.cards[dragon]!.zone).toBe("monster");
		expect(atk(destroyed, dragon)).toBe(3000);
		// Equipped again later with nothing given, nothing of the first time is left.
		const again = equipMonster(destroyed, fusion, dragon, { player: "you" });
		expect(again.cards[fusion]!.equippedTo).toBe(dragon);
		expect(atk(again, dragon)).toBe(3000);
	});
	it(`${cites("rules", "equipped-monster-stays")} stays equipped to its monster: it cannot be equipped to another one, even by an effect that moves Equip Cards`, () => {
		const { duel } = board({ monsters: ["fixture-white-dragon", "fixture-vanilla"], extra: ["fixture-eyes-fusion"] });
		const [dragon, vanilla] = duel.piles.you.monster;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const equipped = equipMonster(duel, fusion, dragon!, { player: "you", gives: GIVES_400 });
		// What moves an Equip Spell to another monster (`equip`) does nothing to it, nor does equipping it anew.
		for (const moved of [equip(equipped, fusion, vanilla!), equipMonster(equipped, fusion, vanilla!, { player: "you" })]) {
			expect(moved.cards[fusion]!.equippedTo).toBe(dragon);
			expect([atk(moved, dragon!), atk(moved, vanilla!)]).toEqual([3400, 1500]);
		}
	});
});

describe("what an Equip Card that is a monster gives, against negation, protection and control changes", () => {
	// YGOProJudge (asked 2026-11-24, no source cited): the gain is the Equip Card's own Spell effect; negated, it stops while the card stays equipped.
	it(`${cites("infinite-impermanence", "column")} gives nothing while its effects are negated as a Spell (the column of Infinite Impermanence) and stays equipped; the negation of its monster does not touch it (YGOProJudge lead, no Konami record)`, () => {
		const start = (slot: number) => {
			const { duel } = board({ monsters: ["fixture-effect-dragon"], extra: ["fixture-eyes-fusion"] }, { set: ["infinite-impermanence"] }, "rival");
			const dragon = find(duel, "fixture-effect-dragon").id;
			const fusion = find(duel, "fixture-eyes-fusion").id;
			const equipped = equipMonster(duel, fusion, dragon, { player: "you", slot, gives: GIVES_400 });
			return { dragon, fusion, done: play(equipped, "activate infinite-impermanence > fixture-effect-dragon", "pass", "pass") };
		};
		// The rival's Set card is in their first zone: your fifth column. The Equip Card there is negated for the rest of the turn.
		const inColumn = start(4);
		expect(columnOf(inColumn.done, inColumn.fusion)).toBe(4);
		expect(isNegated(inColumn.done, inColumn.fusion)).toBe(true);
		expect(atk(inColumn.done, inColumn.dragon)).toBe(3000);
		expect(inColumn.done.cards[inColumn.fusion]).toMatchObject({ zone: "spell", equippedTo: inColumn.dragon });
		// Next turn the column is no longer negated: the gain is back.
		const next = withoutEnded({ ...inColumn.done, turn: { ...inColumn.done.turn, number: inColumn.done.turn.number + 1 } }, inColumn.done.turn.number);
		expect(atk(next, inColumn.dragon)).toBe(3400);
		// In another column: the monster's own effects are negated, and what its Equip Card gives still applies.
		const elsewhere = start(0);
		expect(isNegated(elsewhere.done, elsewhere.dragon)).toBe(true);
		expect(isNegated(elsewhere.done, elsewhere.fusion)).toBe(false);
		expect(atk(elsewhere.done, elsewhere.dragon)).toBe(3400);
	});
	it("gives nothing while a continuous effect negates the Spells on the field, and gives again once that effect is gone (YGOProJudge lead, no Konami record)", () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] }, { faceupSpells: ["fixture-spell-negator"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const equipped = equipMonster(duel, fusion, dragon, { player: "you", gives: GIVES_400 });
		expect(atk(equipped, dragon)).toBe(3000);
		expect(atk(moveCard(equipped, find(equipped, "fixture-spell-negator").id, { zone: "graveyard" }), dragon)).toBe(3400);
	});
	it(`${cites("rules", "equip-effect-not-applied-to-target")} is equipped to a monster that is unaffected by Spell effects, which does not gain what the Equip Card gives (the gain: YGOProJudge lead, no Konami record)`, () => {
		const { duel } = board({ hand: ["fixture-prayer"], monsters: ["fixture-spell-proof"], extra: ["fixture-eyes-fusion"] });
		const proof = find(duel, "fixture-spell-proof").id;
		const done = play(duel, "activate fixture-prayer > fixture-spell-proof", "place 1");
		expect(find(done, "fixture-eyes-fusion")).toMatchObject({ zone: "spell", equippedTo: proof });
		expect(atk(done, proof)).toBe(3000);
	});
	// YGOProJudge (asked 2026-11-23 for Equip Spells, no source cited): a control change leaves the Equip Card where it is, still equipped.
	it("stays equipped, in its own controller's Spell & Trap Zone, and keeps giving when its monster changes control (YGOProJudge lead, no Konami record)", () => {
		const { duel } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-eyes-fusion"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const taken = changeControl(equipMonster(duel, fusion, dragon, { player: "you", gives: GIVES_400 }), dragon, "rival");
		expect(taken.cards[dragon]).toMatchObject({ zone: "monster", controller: "rival" });
		expect(taken.cards[fusion]).toMatchObject({ zone: "spell", controller: "you", equippedTo: dragon });
		expect(atk(taken, dragon)).toBe(3400);
		// Given back, it is still equipped.
		const back = changeControl(taken, dragon, "you");
		expect(back.cards[dragon]!.controller).toBe("you");
		expect(back.cards[fusion]!.equippedTo).toBe(dragon);
		expect(atk(back, dragon)).toBe(3400);
	});
});

describe("an effect a monster can use while it is an Equip Card (range `equipped`)", () => {
	const equippedUnion = (rival: SideSpec = {}) => {
		const { duel, log } = board({ monsters: ["fixture-white-dragon"], extra: ["fixture-union"] }, rival);
		const dragon = find(duel, "fixture-white-dragon").id;
		const union = find(duel, "fixture-union").id;
		return { log, dragon, union, start: duel, duel: equipMonster(duel, union, dragon, { player: "you" }) };
	};
	it(`${cites("rules", "equipped-monster-is-equip-spell")} is offered only while the card is equipped, in its Spell & Trap Zone, and resolves as its controller's effect`, () => {
		const { duel, start, union, log } = equippedUnion();
		expect(offered(duel).filter((label) => label.startsWith("activate"))).toEqual(["activate fixture-union"]);
		// In the Monster Zone, or in a Spell & Trap Zone with nothing equipped, it is not.
		expect(offered(moveCard(start, union, { zone: "monster" })).filter((label) => label.startsWith("activate"))).toEqual([]);
		expect(offered(moveCard(start, union, { zone: "spell", face: "up" })).filter((label) => label.startsWith("activate"))).toEqual([]);
		const done = play(duel, "activate fixture-union", "pass");
		expect(log).toEqual(["fixture-union"]);
		expect(done.cards[union]).toMatchObject({ zone: "spell", equippedTo: find(done, "fixture-white-dragon").id });
	});
	// YGOProJudge (asked 2026-11-24): Ghost Ogre can be chained to an effect activated by a monster treated as an Equip Card, and destroys it.
	it(`${cites("ghost-ogre-snow-rabbit", "text")} is answered by Ghost Ogre & Snow Rabbit as the effect of a Spell/Trap already face-up on the field: the Equip Card is destroyed (YGOProJudge lead for the monster treated as an Equip Card)`, () => {
		const { duel, union, dragon, log } = equippedUnion({ hand: ["ghost-ogre-snow-rabbit"] });
		const answered = play(duel, "activate fixture-union");
		expect(offered(answered)).toEqual(["activate ghost-ogre-snow-rabbit", "pass"]);
		const done = play(answered, "activate ghost-ogre-snow-rabbit", "pass", "pass");
		expect(done.cards[union]).toMatchObject({ zone: "graveyard", equippedTo: null });
		expect(done.cards[dragon]!.zone).toBe("monster");
		// Ghost Ogre does not negate: the effect still applies (its own notes).
		expect(log).toEqual(["fixture-union"]);
	});
	it("is negated with the card's other effects while the Spells on the field are negated (the core's reading, no Konami record)", () => {
		const { duel, log } = equippedUnion({ faceupSpells: ["fixture-spell-negator"] });
		play(duel, "activate fixture-union", "pass");
		expect(log).toEqual([]);
	});
});

describe("a monster on the field that becomes an Equip Card", () => {
	// YGOProJudge (asked 2026-11-24, no source cited): it keeps its "properly Summoned" status, and is no longer a "Special Summoned monster" while it is an Equip Card.
	it(`${cites("rules", "equipped-monster-is-equip-spell")} leaves the Monster Zone for a Spell & Trap Zone of the player who equips it: no longer a monster on the field nor a Special Summoned monster, its own Equip Cards destroyed, still properly Summoned for later (the last two words: YGOProJudge lead, no Konami record)`, () => {
		const { duel } = board({ monsters: ["fixture-absorber"] }, { monsters: ["fixture-vanilla"], extra: ["fixture-eyes-fusion", "fixture-eyes-synchro"] });
		const absorber = find(duel, "fixture-absorber").id;
		const fusion = find(duel, "fixture-eyes-fusion").id;
		const synchro = find(duel, "fixture-eyes-synchro").id;
		// The rival's Fusion Monster, properly Fusion Summoned, itself equipped with a monster.
		const summoned = equipMonster(specialSummon(duel, "rival", fusion, { kind: "fusion" }), synchro, fusion, { player: "rival" });
		expect(summoned.cards[fusion]).toMatchObject({ zone: "monster", proper: true, specialSummoned: true, summonedBy: "fusion" });
		const ready = { ...summoned, live: [], waiting: [] };
		expect(offered(ready).filter((label) => label.startsWith("activate"))).toEqual(["activate fixture-absorber > fixture-eyes-fusion", "activate fixture-absorber > fixture-vanilla"]);
		const done = play(ready, "activate fixture-absorber > fixture-eyes-fusion", "place 4");
		expect(done.cards[fusion]).toMatchObject({ zone: "spell", slot: 4, face: "up", owner: "rival", controller: "you", equippedTo: absorber, specialSummoned: false, proper: true });
		expect(codes(done, "rival", "monster")).toEqual(["fixture-vanilla"]);
		expect(codes(done, "you", "spell")).toEqual(["fixture-eyes-fusion"]);
		// Properly Summoned before: an effect could Special Summon it from where it is equipped.
		expect(canSpecialSummon(done, "you", fusion)).toBe(true);
		// What was equipped to it is destroyed: its monster left the Monster Zone.
		expect(done.cards[synchro]).toMatchObject({ zone: "graveyard", equippedTo: null });
		// When its new monster leaves, it goes to its owner's Graveyard, from where it can be Special Summoned.
		const gone = moveCard(done, absorber, { zone: "graveyard" });
		expect(gone.cards[fusion]).toMatchObject({ zone: "graveyard", controller: "rival", proper: true });
		expect(codes(gone, "rival", "graveyard")).toContain("fixture-eyes-fusion");
		expect(canSpecialSummon(gone, "rival", fusion)).toBe(true);
	});
	it("is not moved by an effect it is unaffected by", () => {
		const { duel } = board({ monsters: ["fixture-absorber"] }, { monsters: ["fixture-untouchable"] });
		const untouchable = find(duel, "fixture-untouchable").id;
		const done = play(duel, "activate fixture-absorber > fixture-untouchable");
		expect(done.asking).toBeNull();
		expect(done.cards[untouchable]).toMatchObject({ zone: "monster", controller: "rival", equippedTo: null });
	});
});

describe("a Summon procedure that uses an equipped card (a Fusion Monster's other way of being Special Summoned)", () => {
	/** You control a "Fixture White Dragon" equipped with `equip` (from your Extra Deck), and `fixture-tyrant` is in your Extra Deck. */
	const withEquipped = (equip: string | null, you: SideSpec = {}, rival: SideSpec = {}) => {
		const { duel, log } = board({ monsters: ["fixture-white-dragon"], ...you, extra: ["fixture-tyrant", ...(equip ? [equip] : []), ...(you.extra ?? [])] }, { ...rival, faceupSpells: ["fixture-spy"] });
		const dragon = find(duel, "fixture-white-dragon").id;
		const equipped = equip ? equipMonster(duel, find(duel, equip).id, dragon, { player: "you", slot: 4 }) : duel;
		log.length = 0;
		return { duel: { ...equipped, live: [], waiting: [] } as Duel, log, dragon, tyrant: find(duel, "fixture-tyrant").id };
	};
	const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
	it(`${cites("rules", "tribute-equipped-procedure-text")} is offered as its own Special Summon only while the player controls the monster it names equipped with a Fusion Monster`, () => {
		expect(summons(withEquipped("fixture-eyes-fusion").duel)).toEqual(["special-summon fixture-tyrant"]);
		// Not equipped; equipped with a monster that is not a Fusion Monster; the Fusion Monster equipped to another monster.
		expect(summons(withEquipped(null).duel)).toEqual([]);
		expect(summons(withEquipped("fixture-eyes-synchro").duel)).toEqual([]);
		const { duel } = board({ monsters: ["fixture-white-dragon", "fixture-vanilla"], extra: ["fixture-tyrant", "fixture-eyes-fusion"] });
		expect(summons(equipMonster(duel, find(duel, "fixture-eyes-fusion").id, find(duel, "fixture-vanilla").id, { player: "you" }))).toEqual([]);
		// Its Fusion Materials on the field are not enough for an action: it has no contact Fusion.
		expect(summons(board({ monsters: ["fixture-white-dragon", "fixture-little-dragon"], extra: ["fixture-tyrant"] }).duel)).toEqual([]);
	});
	it(`${cites("rules", "tribute-equipped-then-summon")} ${cites("rules", "tribute-equipped-not-fusion-summon")} Tributes the monster first (as Fusion Material; its Equip Card is destroyed), then Special Summons from the Extra Deck to the zone chosen: not a Fusion Summon`, () => {
		const { duel, log, dragon, tyrant } = withEquipped("fixture-eyes-fusion", { monsters: ["fixture-white-dragon", "fixture-vanilla", "fixture-vanilla", "fixture-vanilla", "fixture-vanilla"] }, { set: ["solemn-judgment"] });
		// Five monsters: the only Main Monster Zone is the one the Tributed monster frees (a Fusion Monster may also take an Extra Monster Zone).
		const asked = play(duel, "special-summon fixture-tyrant");
		expect(offered(asked)).toEqual(["place 0", "place 5", "place 6"]);
		expect(asked.cards[dragon]!.zone).toBe("monster");
		const begun = play(asked, "place 0");
		expect(begun.cards[dragon]!.zone).toBe("graveyard");
		expect(find(begun, "fixture-eyes-fusion")).toMatchObject({ zone: "graveyard", equippedTo: null });
		expect(log).toEqual(["fixture-white-dragon tributed for fusion", "fixture-eyes-fusion destroyed"]);
		// The Summon is attempted after the Tribute: the monster is not on the field yet.
		expect(begun.summoning).toMatchObject({ cards: [tyrant], how: "special", negated: false });
		expect(begun.cards[tyrant]!.zone).toBe("extra");
		// (The rival, who could negate the Summon, lets it through.)
		const done = play(begun, "pass");
		expect(done.cards[tyrant]).toMatchObject({ zone: "monster", slot: 0, face: "up", specialSummoned: true, summonedBy: null });
	});
	it(`${cites("rules", "tribute-equipped-is-proper")} is a proper Summon of the monster, which can then be Special Summoned from the Graveyard; never Summoned, it cannot`, () => {
		const { duel, tyrant } = withEquipped("fixture-eyes-fusion");
		const done = play(duel, "special-summon fixture-tyrant", "place 2");
		expect(done.cards[tyrant]).toMatchObject({ zone: "monster", slot: 2, proper: true });
		expect(canSpecialSummon(moveCard(done, tyrant, { zone: "graveyard" }), "you", tyrant)).toBe(true);
		expect(canSpecialSummon(moveCard(duel, tyrant, { zone: "graveyard" }), "you", tyrant)).toBe(false);
	});
	it(`${cites("rules", "tribute-equipped-not-an-effect")} starts no chain, and the Summon can be negated in its window: the Tributed monster is not given back`, () => {
		const { duel, dragon, tyrant } = withEquipped("fixture-eyes-fusion", {}, { set: ["solemn-judgment"] });
		const begun = play(duel, "special-summon fixture-tyrant", "place 0");
		expect(begun.chain).toEqual([]);
		expect(offered(begun)).toEqual(["activate solemn-judgment", "pass"]);
		const negated = play(begun, "activate solemn-judgment");
		expect(negated.cards[tyrant]!.zone).toBe("graveyard");
		expect(negated.cards[dragon]!.zone).toBe("graveyard");
		expect(codes(negated, "you", "monster")).toEqual([]);
	});
	it(`${cites("rules", "tribute-equipped-extra-deck-only")} comes from the Extra Deck only by a Fusion Summon or by its other way: an effect that just Special Summons from the Extra Deck does not Summon it`, () => {
		const { duel, tyrant } = withEquipped("fixture-eyes-fusion");
		expect(canSpecialSummon(duel, "you", tyrant)).toBe(false);
		expect(specialSummon(duel, "you", tyrant).cards[tyrant]!.zone).toBe("extra");
		expect(canSpecialSummon(duel, "you", tyrant, "fusion")).toBe(true);
		// A Fusion Monster with no such condition can be (the fixture's other Fusion Monster).
		const plain = board({ extra: ["fixture-eyes-fusion"] }).duel;
		expect(canSpecialSummon(plain, "you", find(plain, "fixture-eyes-fusion").id)).toBe(true);
	});
	it("leaves the Fusion Summon to the printed materials: an effect that Fusion Summons does not use the other way, and the other way does not use the printed materials", () => {
		// Only the equipped monster: nothing to Fusion Summon with.
		const alone = withEquipped("fixture-eyes-fusion", { hand: ["fixture-polymerization"] });
		expect(offered(alone.duel).filter((label) => label.startsWith("activate"))).toEqual([]);
		// With a second Dragon: the Fusion Summon by the effect, with both printed materials.
		const { duel, tyrant } = withEquipped(null, { hand: ["fixture-polymerization"], monsters: ["fixture-white-dragon", "fixture-little-dragon"] });
		const fused = play(duel, "activate fixture-polymerization", "place 0");
		expect(fused.cards[tyrant]).toMatchObject({ zone: "monster", proper: true, summonedBy: "fusion" });
		expect(codes(fused, "you", "graveyard").sort()).toEqual(["fixture-little-dragon", "fixture-polymerization", "fixture-white-dragon"]);
	});
	it("lets a cost use an Equip Card that is a monster: \"send 1 Equip Card equipped to this card to the GY\" is paid with it, once per card equipped", () => {
		const { duel, log } = board({ monsters: ["fixture-equip-eater"], extra: ["fixture-eyes-fusion", "fixture-eyes-synchro"] });
		const eater = find(duel, "fixture-equip-eater").id;
		expect(offered(duel).filter((label) => label.startsWith("activate"))).toEqual([]);
		const one = equipMonster(duel, find(duel, "fixture-eyes-fusion").id, eater, { player: "you", gives: GIVES_400 });
		const two = equipMonster(one, find(duel, "fixture-eyes-synchro").id, eater, { player: "you" });
		expect(offered(two).filter((label) => label.startsWith("activate"))).toEqual(["activate fixture-equip-eater ~ fixture-eyes-fusion", "activate fixture-equip-eater ~ fixture-eyes-synchro"]);
		const paid = play(two, "activate fixture-equip-eater ~ fixture-eyes-fusion");
		expect(log).toEqual(["fixture-equip-eater"]);
		// Sent as a cost, not destroyed; the other one stays, and what the first gave is gone.
		expect(find(paid, "fixture-eyes-fusion")).toMatchObject({ zone: "graveyard", equippedTo: null });
		expect(equipsOf(paid, eater)).toEqual([find(paid, "fixture-eyes-synchro").id]);
		expect(atk(paid, eater)).toBe(3000);
	});
});
