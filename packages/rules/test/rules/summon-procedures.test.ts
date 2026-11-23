import { describe, expect, it } from "vitest";
import { act, type Action, addModifier, cardsIn, changeControl, cites, type Duel, flipFaceDown, legalActions, materialsOf, moveCard } from "../../src";
import { codes, offered, play, position } from "./fixtures";
import { summonCards } from "./summon-fixtures";

/**
 * Step 8: Summon procedures as data, through `legalActions` / `act`: Synchro, Xyz and Link Summons, Fusion Summons by an effect
 * (from the hand, the field, the Deck, the Graveyard, the opponent's field) and contact Fusion, Ritual Summons, Pendulum Summons,
 * and "properly Summoned". The cards are made up (test/rules/summon-fixtures.ts); the spy card writes every event in the log.
 */
function board(spec: Omit<Parameters<typeof position>[0], "defs">): { duel: Duel; log: string[] } {
	const log: string[] = [];
	const duel = position({ ...spec, defs: summonCards(log), rival: { ...spec.rival, faceupSpells: [...(spec.rival?.faceupSpells ?? []), "spy"] } });
	log.length = 0;
	return { duel, log };
}
const monster = (duel: Duel, code: string, side: "you" | "rival" = "you") => cardsIn(duel, side, "monster").find((card) => card.code === code)!;
const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
const listed = (duel: Duel, code: string) => legalActions(duel).find((action) => action.type === "summon" && action.how === "special" && duel.cards[action.card]!.code === code)!;

describe("a Synchro Summon", () => {
	it(`${cites("rules", "synchro-procedure")} is listed once for each Synchro Monster whose Level a Tuner and non-Tuners you control add up to; the materials are sent to the Graveyard and the monster is Synchro Summoned`, () => {
		const { duel, log } = board({ you: { monsters: ["tuner-2", "lv3", "dragon-3", "lv4"], extra: ["synchro-5", "synchro-6", "synchro-7"] } });
		// 2 + 3 and 2 + 4; nothing adds up to 7.
		expect(summons(duel)).toEqual(["special-summon synchro-5", "special-summon synchro-6"]);
		const asked = play(duel, "special-summon synchro-5");
		// The Tuner is in every legal set: it is taken without asking. Only cards that can still be part of a legal set are offered:
		// the Level 4 monster is not one for a Level 5 Synchro Monster.
		expect(offered(asked)).toEqual(["choose dragon-3", "choose lv3"]);
		// Then the zone: any free Main Monster Zone (the materials' included) or an Extra Monster Zone.
		const placing = play(asked, "choose lv3");
		expect(offered(placing)).toEqual(["place 0", "place 1", "place 4", "place 5", "place 6"]);
		const done = play(placing, "place 5");
		expect(monster(done, "synchro-5")).toMatchObject({ slot: 5, face: "up", position: "attack", proper: true, summonedBy: "synchro" });
		expect(codes(done, "you", "graveyard").sort()).toEqual(["lv3", "tuner-2"]);
		expect(log).toEqual(["moved tuner-2 monster>graveyard material for synchro", "moved lv3 monster>graveyard material for synchro", "moved synchro-5 extra>monster", "summoned synchro-5 special synchro"]);
	});
	it(`${cites("rules", "synchro-position")} ${cites("rules", "special-summon-position")} is in face-up Attack or Defense Position, the player's choice, as is a built-in Special Summon from the hand`, () => {
		const { duel } = board({ you: { hand: ["cyber"], monsters: ["tuner-2", "lv3"], extra: ["synchro-5"] } });
		expect(listed(duel, "synchro-5")).toMatchObject({ how: "special", positions: ["attack", "defense"] });
		const done = play(act(duel, { ...listed(duel, "synchro-5"), position: "defense" } as Action), "place 0");
		expect(monster(done, "synchro-5")).toMatchObject({ face: "up", position: "defense" });
		expect(listed(duel, "cyber")).toMatchObject({ how: "special", zones: [2, 3, 4], positions: ["attack", "defense"] });
		expect(monster(act(duel, { ...listed(duel, "cyber"), position: "defense" } as Action), "cyber")).toMatchObject({ slot: 2, face: "up", position: "defense" });
		// A position the action does not list is refused.
		expect(() => act(duel, { ...listed(duel, "cyber"), position: "sideways" } as unknown as Action)).toThrow(/not a legal action/);
	});
	it(`${cites("rules", "synchro-procedure")} needs exactly 1 Tuner and face-up materials: two Tuners, no Tuner, or a face-down non-Tuner do not make one`, () => {
		const twoTuners = board({ you: { monsters: ["tuner-2", "tuner-3", "lv3"], extra: ["synchro-5"] } }).duel;
		// tuner-2 + tuner-3 is 5 with two Tuners; tuner-2 + lv3 is the only legal set, so nothing is asked but the zone.
		expect(codes(play(twoTuners, "special-summon synchro-5", "place 0"), "you", "monster")).toEqual(["tuner-3", "synchro-5"]);
		expect(summons(board({ you: { monsters: ["lv2", "lv3"], extra: ["synchro-5"] } }).duel)).toEqual([]);
		expect(summons(board({ you: { monsters: ["tuner-2"], facedown: ["lv3"], extra: ["synchro-5"] } }).duel)).toEqual([]);
	});
	it(`${cites("rules", "synchro-procedure")} takes any number of non-Tuners, and a card's own filter on them ("1 Tuner + 1+ non-Tuner Dragon monsters")`, () => {
		const { duel } = board({ you: { monsters: ["tuner-1", "lv2", "lv4", "lv6"], extra: ["synchro-7", "synchro-dragon-5"] } });
		// 1 + 6, or 1 + 2 + 4.
		const asked = play(duel, "special-summon synchro-7");
		expect(offered(asked)).toEqual(["choose lv2", "choose lv4", "choose lv6"]);
		expect(codes(play(asked, "choose lv2", "place 0"), "you", "monster")).toEqual(["lv6", "synchro-7"]);
		expect(codes(play(asked, "choose lv6", "place 0"), "you", "monster")).toEqual(["lv2", "lv4", "synchro-7"]);
		// tuner-1 + lv4 is 5, but lv4 is not a Dragon.
		expect(summons(duel)).toEqual(["special-summon synchro-7"]);
		expect(summons(board({ you: { monsters: ["tuner-2", "dragon-3", "lv3"], extra: ["synchro-dragon-5"] } }).duel)).toEqual(["special-summon synchro-dragon-5"]);
	});
	// The Level query is step 6's (YGOProJudge lead for its order); that a changed Level is the one that counts is the core's reading of "their Levels".
	it("reads the materials' Levels as they are now: a monster whose Level an effect changed counts for its new Level (the core's reading, no Konami record)", () => {
		const { duel } = board({ you: { monsters: ["tuner-2", "lv4"], extra: ["synchro-5", "synchro-6"] } });
		expect(summons(duel)).toEqual(["special-summon synchro-6"]);
		const lv4 = monster(duel, "lv4");
		const changed = addModifier(duel, { affects: { card: lv4.id, moves: lv4.moves }, until: duel.turn.number, layer: { kind: "set", stat: "level", to: 3 } });
		expect(summons(changed)).toEqual(["special-summon synchro-5"]);
	});
	// That the materials are not given back is YGOProJudge's answer only (asked 2026-11-23); the monster's fate is Konami's (records cited).
	it(`${cites("rules", "negated-summon-not-from-field")} ${cites("rules", "revive-needs-successful-proper-summon")} ${cites("rules", "properly-summoned-first")} negated, the materials stay in the Graveyard, the monster is destroyed without reaching the field, and it cannot be Special Summoned from the Graveyard: its Summon never succeeded`, () => {
		const { duel, log } = board({ you: { hand: ["reborn"], monsters: ["tuner-2", "lv3"], extra: ["synchro-5", "synchro-5"] }, rival: { set: ["warning"] } });
		const negated = play(duel, "special-summon synchro-5", "place 0", "activate warning");
		expect(codes(negated, "you", "graveyard").sort()).toEqual(["lv3", "synchro-5", "tuner-2"]);
		expect(log).toContain("moved synchro-5 extra>graveyard destroyed negated");
		expect(cardsIn(negated, "you", "graveyard").find((card) => card.code === "synchro-5")).toMatchObject({ proper: false });
		// Monster Reborn's shape: the materials can come back, the Synchro Monster cannot.
		expect(offered(negated)).toEqual(["activate reborn > lv3", "activate reborn > tuner-2", "pass", "set reborn"]);
		// A Synchro Monster sent from the Extra Deck to the Graveyard without being Synchro Summoned cannot either.
		const dumped = moveCard(duel, duel.piles.you.extra[0]!, { zone: "graveyard" });
		expect(offered(dumped).filter((label) => label.startsWith("activate reborn"))).toEqual([]);
	});
	it(`${cites("rules", "revive-needs-successful-proper-summon")} once properly Summoned it can be Special Summoned from the Graveyard, to a Main Monster Zone`, () => {
		const { duel } = board({ you: { hand: ["reborn"], monsters: ["tuner-2", "lv3"], extra: ["synchro-5"] } });
		const summoned = play(duel, "special-summon synchro-5", "place 5");
		const buried = moveCard(summoned, monster(summoned, "synchro-5").id, { zone: "graveyard" });
		expect(offered(buried)).toContain("activate reborn > synchro-5");
		const asked = play(buried, "activate reborn > synchro-5");
		// From the Graveyard it goes to a Main Monster Zone, not an Extra Monster Zone (step 7's rule).
		expect(offered(asked)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
		expect(monster(play(asked, "place 2"), "synchro-5")).toMatchObject({ slot: 2, proper: true, summonedBy: null });
	});
});

describe("an Xyz Summon", () => {
	const summoned = () => {
		const { duel, log } = board({ you: { monsters: ["lv4", "lv4-b", "lv3"], extra: ["xyz-4", "xyz-4-up", "xyz-4-plain-up"] } });
		return { duel, log, done: play(duel, "special-summon xyz-4", "place 5") };
	};
	it(`${cites("rules", "xyz-procedure")} ${cites("rules", "xyz-materials-not-on-field")} stacks 2 face-up monsters whose Level is the Rank under the Xyz Monster: they become its Xyz Materials and are no longer on the field`, () => {
		const { duel, done, log } = summoned();
		// Both Level 4 monsters are needed: nothing to choose but the zone. Three Level 4 monsters are not there for the other Xyz Monsters.
		expect(summons(duel)).toEqual(["special-summon xyz-4"]);
		const xyz = monster(done, "xyz-4");
		expect(xyz).toMatchObject({ slot: 5, proper: true, summonedBy: "xyz" });
		expect(codes(done, "you", "monster")).toEqual(["lv3", "xyz-4"]);
		expect(materialsOf(done, xyz.id).map((id) => done.cards[id]!.code)).toEqual(["lv4", "lv4-b"]);
		expect(done.cards[materialsOf(done, xyz.id)[0]!]).toMatchObject({ zone: "material", slot: null, attachedTo: xyz.id });
		expect(codes(done, "you", "graveyard")).toEqual([]);
		expect(log).toEqual(["moved lv4 monster>material", "moved lv4-b monster>material", "moved xyz-4 extra>monster", "summoned xyz-4 special xyz"]);
		// A face-down monster is not a material.
		expect(summons(board({ you: { monsters: ["lv4"], facedown: ["lv4-b"], extra: ["xyz-4"] } }).duel)).toEqual([]);
	});
	it(`${cites("rules", "xyz-detach")} "detach 1 material" sends one Xyz Material to the Graveyard, and cannot be paid with none left`, () => {
		const { done } = summoned();
		const once = play(done, "activate xyz-4", "pass");
		expect(codes(once, "you", "graveyard")).toEqual(["lv4"]);
		expect(materialsOf(once, monster(once, "xyz-4").id)).toHaveLength(1);
		// With no material left the cost cannot be paid: the effect is not offered (a new turn lifts its "once per turn").
		const xyz = monster(done, "xyz-4").id;
		const emptied = materialsOf(done, xyz).reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), done);
		expect(offered(emptied)).not.toContain("activate xyz-4");
	});
	it(`${cites("rules", "xyz-materials-not-on-field")} ${cites("rules", "xyz-materials-stay")} ${cites("rules", "face-down-still-xyz-summoned")} the materials go to the Graveyard when the Xyz Monster leaves the field, and stay when it is flipped face-down or changes control; face-down, it is still an Xyz Summoned monster`, () => {
		const { done } = summoned();
		const xyz = monster(done, "xyz-4").id;
		const down = flipFaceDown(done, xyz);
		expect(materialsOf(down, xyz)).toHaveLength(2);
		expect(down.cards[xyz]).toMatchObject({ face: "down", proper: true, summonedBy: "xyz" });
		const taken = changeControl(done, xyz, "rival", 0);
		expect(materialsOf(taken, xyz)).toHaveLength(2);
		const gone = moveCard(taken, xyz, { zone: "graveyard" });
		expect(materialsOf(gone, xyz)).toEqual([]);
		// Each card goes to its owner's Graveyard.
		expect(codes(gone, "you", "graveyard").sort()).toEqual(["lv4", "lv4-b", "xyz-4"]);
	});
	it(`${cites("rules", "xyz-procedure")} an alternative printed on the card ("by using a Rank 4 Xyz Monster you control as material") is a way of its own, with its materials transferred when the card says so`, () => {
		const { done } = summoned();
		// xyz-4 has 2 materials: both alternatives are open; three Level 4 monsters are not there for the ordinary way.
		expect(summons(done)).toEqual(["special-summon xyz-4-plain-up", "special-summon xyz-4-up"]);
		const up = play(done, "special-summon xyz-4-up", "place 5");
		expect(materialsOf(up, monster(up, "xyz-4-up").id).map((id) => up.cards[id]!.code)).toEqual(["lv4", "lv4-b", "xyz-4"]);
		expect(codes(up, "you", "graveyard")).toEqual([]);
		// Without "(Transfer its materials to this card.)" the monster used leaves the field and its materials go to the Graveyard.
		const plain = play(done, "special-summon xyz-4-plain-up", "place 5");
		expect(materialsOf(plain, monster(plain, "xyz-4-plain-up").id).map((id) => plain.cards[id]!.code)).toEqual(["xyz-4"]);
		expect(codes(plain, "you", "graveyard").sort()).toEqual(["lv4", "lv4-b"]);
	});
	// YGOProJudge only (asked 2026-11-23, no Konami page cited): the monsters stacked for a negated Xyz Summon go to the Graveyard.
	it("negated, the monsters stacked as materials go to the Graveyard with the Xyz Monster (YGOProJudge lead, no Konami record)", () => {
		const { duel } = board({ you: { monsters: ["lv4", "lv4-b"], extra: ["xyz-4"] }, rival: { set: ["warning"] } });
		const negated = play(duel, "special-summon xyz-4", "place 0", "activate warning");
		expect(codes(negated, "you", "graveyard").sort()).toEqual(["lv4", "lv4-b", "xyz-4"]);
		expect(codes(negated, "you", "material")).toEqual([]);
	});
});

describe("a Link Summon", () => {
	it(`${cites("rules", "link-procedure")} ${cites("rules", "link-zone")} ${cites("rules", "link-no-defense")} sends face-up monsters equal to the Link Rating to the Graveyard; the Link Monster goes to an Extra Monster Zone, in Attack Position only`, () => {
		const { duel, log } = board({ you: { monsters: ["lv4", "lv3"], facedown: ["lv2"], extra: ["link-2", "link-3"] } });
		// Three face-up monsters would be needed for the Link-3.
		expect(summons(duel)).toEqual(["special-summon link-2"]);
		expect(listed(duel, "link-2")).not.toHaveProperty("positions");
		// Naming the only position is accepted; Defense Position is refused.
		expect(offered(act(duel, { ...listed(duel, "link-2"), position: "attack" } as Action))).toEqual(["place 5", "place 6"]);
		expect(() => act(duel, { ...listed(duel, "link-2"), position: "defense" } as Action)).toThrow(/not a legal action/);
		const placing = play(duel, "special-summon link-2");
		// No Link Monster points anywhere: only the Extra Monster Zones.
		expect(offered(placing)).toEqual(["place 5", "place 6"]);
		const done = play(placing, "place 6");
		expect(monster(done, "link-2")).toMatchObject({ slot: 6, position: "attack", proper: true, summonedBy: "link" });
		expect(log).toEqual(["moved lv4 monster>graveyard material for link", "moved lv3 monster>graveyard material for link", "moved link-2 extra>monster", "summoned link-2 special link"]);
	});
	it(`${cites("rules", "link-material-rating")} a Link Monster used as material counts for 1 or for its Link Rating, the player stopping when the materials chosen are enough`, () => {
		const { duel } = board({ you: { extraZone: ["link-2"], monsters: ["lv4", "lv3"], extra: ["link-3"] } });
		// Two monsters count for 2, not 3: every legal set holds the Link-2, which is taken without asking. Alone it is not "2+ monsters".
		const first = play(duel, "special-summon link-3");
		expect(offered(first)).toEqual(["choose lv3", "choose lv4"]);
		// Link-2 (for 2) + 1 monster is 3; adding the third monster is also 3 (1 + 1 + 1): the player may stop or go on.
		const second = play(first, "choose lv4");
		expect(offered(second)).toEqual(["choose lv3", "pass"]);
		const two = play(second, "pass", "place 5");
		expect(codes(two, "you", "monster")).toEqual(["lv3", "link-3"]);
		const three = play(second, "choose lv3", "place 5");
		expect(codes(three, "you", "monster")).toEqual(["link-3"]);
	});
	it(`${cites("rules", "link-zone")} ${cites("rules", "linked-zones-extra-deck")} a material filter is the card's; with your Extra Monster Zone taken, the monster goes to a zone a Link Monster points to, read once the materials have left`, () => {
		// link-2 in your Extra Monster Zone points to your Main Monster Zones 0 and 2; lv4 is in zone 0, lv3 in zone 1.
		const { duel } = board({ you: { extraZone: ["link-2"], monsters: ["lv4", "lv3"], extra: ["link-2-low", "link-3"] } });
		// "2 Level 4 or lower monsters": the Link-2 (no Level) is not one, so lv4 and lv3 are forced.
		expect(offered(play(duel, "special-summon link-2-low"))).toEqual(["place 0", "place 2"]);
		// For the Link-3, using the Link-2 takes its arrows away: only the Extra Monster Zones are left.
		expect(offered(play(duel, "special-summon link-3", "choose lv4", "pass"))).toEqual(["place 5", "place 6"]);
	});
});

describe("a Fusion Summon by a card effect", () => {
	it(`${cites("rules", "fusion-procedure")} ${cites("rules", "fusion-material-places")} ${cites("rules", "negate-summon-built-in-only")} sends the materials the Fusion Monster lists from the hand or field to the Graveyard and Special Summons it; the Summon is the effect's, so a card that negates a Summon cannot answer it`, () => {
		const { duel, log } = board({ options: { everyWindow: true }, you: { hand: ["poly", "lv4", "lv2"], monsters: ["lv3"], extra: ["fusion-43"] }, rival: { set: ["warning"] } });
		const placing = play(duel, "activate poly", "pass", "pass");
		// One Fusion Monster and one set of materials: only the zone and the position are asked.
		expect(legalActions(placing)[0]).toEqual({ type: "place", zone: 0, positions: ["attack", "defense"] });
		const done = act(placing, { type: "place", zone: 6, position: "defense" });
		expect(monster(done, "fusion-43")).toMatchObject({ slot: 6, position: "defense", proper: true, summonedBy: "fusion" });
		expect(log).toEqual(["moved poly hand>spell", "moved lv4 hand>graveyard material for fusion", "moved lv3 monster>graveyard material for fusion", "moved fusion-43 extra>monster", "summoned fusion-43 special fusion by effect", "moved poly spell>graveyard"]);
		// The rival is asked after the chain: the Summon has already succeeded, and their card has nothing to negate.
		expect(done.summoning).toBeNull();
		expect(offered(play(done, "pass"))).toEqual(["pass"]);
		// Without the listed materials in the places the card names, it cannot be activated.
		expect(offered(board({ you: { hand: ["poly", "lv4"], deck: ["lv3"], extra: ["fusion-43"] } }).duel)).not.toContain("activate poly");
	});
	it(`${cites("rules", "fusion-material-places")} takes materials from the Deck, from the Graveyard (banished), or from the opponent's field, as the Summoning card says`, () => {
		const fromDeck = board({ you: { hand: ["deck-fusion"], deck: ["lv4", "lv3", "lv2"], extra: ["fusion-43"] } });
		const deck = play(fromDeck.duel, "activate deck-fusion", "place 0");
		expect(codes(deck, "you", "monster")).toEqual(["fusion-43"]);
		expect(fromDeck.log.slice(1, 3).sort()).toEqual(["moved lv3 deck>graveyard material for fusion", "moved lv4 deck>graveyard material for fusion"]);
		const fromGrave = board({ you: { hand: ["grave-fusion"], graveyard: ["lv4", "lv3"], extra: ["fusion-43"] } });
		const grave = play(fromGrave.duel, "activate grave-fusion", "place 0");
		expect(codes(grave, "you", "banished").sort()).toEqual(["lv3", "lv4"]);
		expect(codes(grave, "you", "monster")).toEqual(["fusion-43"]);
		// Either field: your lv4 and the rival's lv3, which goes to its owner's Graveyard. A Quick-Play Spell: Set, it works in the rival's turn too.
		const either = board({ turn: "rival", you: { set: ["super-poly"], monsters: ["lv4"], extra: ["fusion-43"] }, rival: { monsters: ["lv3"] } });
		const taken = play(either.duel, "pass", "activate super-poly", "place 0");
		expect(codes(taken, "rival", "monster")).toEqual([]);
		expect(codes(taken, "rival", "graveyard")).toEqual(["lv3"]);
		expect(codes(taken, "you", "monster")).toEqual(["fusion-43"]);
		expect(taken.turn.player).toBe("rival");
	});
	it(`${cites("rules", "fusion-procedure")} "2+ monsters with different names": the player chooses the materials one at a time, only among cards that still make a legal set, and may stop once they are enough`, () => {
		const { duel } = board({ you: { hand: ["poly", "lv4", "lv4", "lv3", "lv2"], extra: ["fusion-many"] } });
		const first = play(duel, "activate poly");
		expect(offered(first)).toEqual(["choose lv2", "choose lv3", "choose lv4", "choose lv4"]);
		// The second copy of lv4 has the same name: not offered any more.
		const second = play(first, "choose lv4");
		expect(offered(second)).toEqual(["choose lv2", "choose lv3"]);
		const third = play(second, "choose lv3");
		expect(offered(third)).toEqual(["choose lv2", "pass"]);
		const done = play(third, "pass", "place 0");
		expect(codes(done, "you", "hand").sort()).toEqual(["lv2", "lv4"]);
		expect(codes(done, "you", "monster")).toEqual(["fusion-many"]);
	});
	it(`${cites("rules", "fusion-procedure")} a contact Fusion is an action with no card effect: the materials you control go where the card says, and the Summon can be negated`, () => {
		const { duel, log } = board({ you: { monsters: ["lv4", "lv2"], extra: ["contact", "fusion-43"] }, rival: { set: ["warning"] } });
		// The ordinary Fusion Monster is not an action.
		expect(summons(duel)).toEqual(["special-summon contact"]);
		const asked = play(duel, "special-summon contact", "place 0");
		expect(codes(asked, "you", "banished").sort()).toEqual(["lv2", "lv4"]);
		expect(offered(asked)).toEqual(["activate warning", "pass"]);
		const done = play(asked, "pass");
		expect(monster(done, "contact")).toMatchObject({ proper: true, summonedBy: null });
		expect(log).toEqual(["moved lv4 monster>banished", "moved lv2 monster>banished", "moved contact extra>monster", "summoned contact special"]);
	});
});

describe("a Ritual Summon", () => {
	it(`${cites("rules", "ritual-procedure")} ${cites("rules", "ritual-position")} "equal": Tributes from the hand or field whose Levels add up exactly to the Ritual Monster's Level; it is Special Summoned to a Main Monster Zone in Attack or Defense Position`, () => {
		const { duel, log } = board({ you: { hand: ["rite-equal", "ritual-8", "lv4", "lv5", "lv2"], monsters: ["lv4-b", "lv3"] } });
		const asked = play(duel, "activate rite-equal");
		// 4 + 4 or 5 + 3; the Level 2 monster fits in no exact sum of these, and the Ritual Monster is not its own Tribute.
		expect(offered(asked)).toEqual(["choose lv3", "choose lv4", "choose lv4-b", "choose lv5"]);
		const placing = play(asked, "choose lv4");
		expect(legalActions(placing).map((action) => (action as { zone: number }).zone)).toEqual([0, 2, 3, 4]);
		expect(legalActions(placing)[0]).toMatchObject({ positions: ["attack", "defense"] });
		const done = play(placing, "place 0");
		expect(monster(done, "ritual-8")).toMatchObject({ slot: 0, proper: true, summonedBy: "ritual" });
		expect(log).toEqual(["moved rite-equal hand>spell", "moved lv4 hand>graveyard tributed", "moved lv4-b monster>graveyard tributed", "moved ritual-8 hand>monster", "summoned ritual-8 special ritual by effect", "moved rite-equal spell>graveyard"]);
		// 7 + 2 is not 8: with those only, "equal" cannot be activated.
		expect(offered(board({ you: { hand: ["rite-equal", "ritual-8", "lv7", "lv2"] } }).duel)).not.toContain("activate rite-equal");
	});
	// The rule against a Tribute that is not needed is YGOProJudge's answer only (asked 2026-11-23, no Konami page cited).
	it(`${cites("rules", "ritual-procedure")} "equal or exceed": the total may exceed the Level, but no Tribute may be unnecessary (YGOProJudge lead)`, () => {
		const { duel } = board({ you: { hand: ["rite-exceed", "ritual-8", "lv7", "lv2", "lv8"] } });
		const asked = play(duel, "activate rite-exceed");
		expect(offered(asked)).toEqual(["choose lv2", "choose lv7", "choose lv8"]);
		// lv8 alone is enough: nothing can be added to it.
		expect(codes(play(asked, "choose lv8", "place 0"), "you", "graveyard").sort()).toEqual(["lv8", "rite-exceed"]);
		// lv7 needs lv2 (9, and neither can be left out); lv8 cannot join them.
		expect(codes(play(asked, "choose lv7", "place 0"), "you", "graveyard").sort()).toEqual(["lv2", "lv7", "rite-exceed"]);
		// The Ritual Monster in the hand is never its own Tribute.
		expect(offered(board({ you: { hand: ["rite-exceed", "ritual-8"] } }).duel)).toEqual(["pass", "set rite-exceed"]);
	});
	it(`${cites("rules", "ritual-procedure")} a Ritual Spell that says so banishes monsters from the Graveyard as Tribute, and a card can be the entire Tribute`, () => {
		const grave = board({ you: { hand: ["rite-grave", "ritual-8", "lv4"], graveyard: ["lv4-b"] } });
		const done = play(grave.duel, "activate rite-grave", "place 0");
		expect(codes(done, "you", "banished")).toEqual(["lv4-b"]);
		expect(grave.log.slice(1, 3)).toEqual(["moved lv4 hand>graveyard tributed", "moved lv4-b graveyard>banished"]);
		const whole = board({ you: { hand: ["rite-equal", "ritual-8", "whole-tribute", "lv4"] } });
		const summoned = play(whole.duel, "activate rite-equal", "place 0");
		expect(codes(summoned, "you", "graveyard").sort()).toEqual(["rite-equal", "whole-tribute"]);
		expect(codes(summoned, "you", "monster")).toEqual(["ritual-8"]);
	});
	it(`${cites("rules", "properly-summoned-first")} a Ritual Monster that was never Ritual Summoned cannot be Special Summoned from the Graveyard`, () => {
		expect(offered(board({ you: { hand: ["reborn"], graveyard: ["ritual-8", "lv4"] } }).duel)).toEqual(["activate reborn > lv4", "pass", "set reborn"]);
	});
});

describe("a Pendulum Summon", () => {
	/** Scales 1 and 8 in your two Pendulum Zones (the leftmost and rightmost Spell & Trap Zones). */
	const scaled = (spec: Parameters<typeof board>[0]) => {
		const { duel, log } = board({ ...spec, you: { ...spec.you, faceupSpells: ["scale-1", "scale-8"] } });
		const moved = moveCard(duel, duel.piles.you.spell[1]!, { zone: "spell", slot: 4 });
		log.length = 0;
		return { duel: { ...moved, live: [], waiting: [] }, log };
	};
	it(`${cites("rules", "pendulum-summon-once")} ${cites("rules", "pendulum-summon-levels")} ${cites("rules", "pendulum-summon-extra-zone")} once per turn, Special Summons at the same time monsters of the hand and face-up Pendulum Monsters of the Extra Deck whose Levels are between the Scales, the latter to an Extra Monster Zone`, () => {
		const { duel, log } = scaled({ you: { hand: ["lv4", "lv7", "lv8", "lv1"], extraFaceUp: ["pend-4"] } });
		expect(offered(duel)).toContain("pendulum-summon");
		// Levels 2 to 7: neither the Level 8 nor the Level 1 monster.
		const first = play(duel, "pendulum-summon");
		expect(offered(first)).toEqual(["choose lv4", "choose lv7", "choose pend-4"]);
		const second = play(first, "choose pend-4");
		expect(offered(second)).toEqual(["place 5", "place 6"]);
		const third = play(second, "place 5");
		// One is chosen: the player may stop, or add another.
		expect(offered(third)).toEqual(["choose lv4", "choose lv7", "pass"]);
		const done = play(third, "choose lv7", "place 3", "pass");
		expect(monster(done, "pend-4")).toMatchObject({ slot: 5, face: "up" });
		expect(monster(done, "lv7")).toMatchObject({ slot: 3, face: "up" });
		expect(log).toEqual(["moved pend-4 extra>monster", "summoned pend-4 special pendulum", "moved lv7 hand>monster", "summoned lv7 special pendulum"]);
		expect(offered(done)).not.toContain("pendulum-summon");
		// It needs a Pendulum Monster in each Pendulum Zone.
		const single = board({ you: { hand: ["lv4"], faceupSpells: ["scale-1"] } }).duel;
		expect(offered(single)).not.toContain("pendulum-summon");
	});
	// YGOProJudge only for "all of them, to the Graveyard"; it agrees with step 5's Konami record on negated Summons.
	it(`${cites("rules", "negated-summon-not-from-field")} negated, every monster of it is destroyed, and a Pendulum Monster from the Extra Deck goes to the Graveyard: it never was on the field`, () => {
		const { duel } = scaled({ you: { hand: ["lv4"], extraFaceUp: ["pend-4"] }, rival: { set: ["warning"] } });
		const negated = play(duel, "pendulum-summon", "choose pend-4", "place 5", "choose lv4", "place 0", "activate warning");
		expect(codes(negated, "you", "graveyard").sort()).toEqual(["lv4", "pend-4"]);
		expect(codes(negated, "you", "monster")).toEqual([]);
		expect(offered(negated)).not.toContain("pendulum-summon");
	});
});
