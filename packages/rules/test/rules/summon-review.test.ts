import { describe, expect, it } from "vitest";
import { act, type Action, CARD_DEFS, type CardDef, cardsIn, cites, type Duel, flipFaceDown, legalActions, materialsOf, moveCard, specialSummon, takeControl } from "../../src";
import { codes, offered, play, position } from "./fixtures";
import { summonCards } from "./summon-fixtures";

/**
 * Step 8: regressions for the defects the review of the step found (docs/rules-core/step8/design.md, "Review"). Each test failed
 * before its fix.
 */
function board(spec: Omit<Parameters<typeof position>[0], "defs">, more: Record<string, CardDef> = {}): { duel: Duel; log: string[] } {
	const log: string[] = [];
	const duel = position({ ...spec, defs: { ...summonCards(log), ...more }, rival: { ...spec.rival, faceupSpells: [...(spec.rival?.faceupSpells ?? []), "spy"] } });
	log.length = 0;
	return { duel, log };
}
const monster = (duel: Duel, code: string, side: "you" | "rival" = "you") => cardsIn(duel, side, "monster").find((card) => card.code === code)!;
const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));

describe("a monster turned face-down is still the monster an earlier ruling of the turn was about", () => {
	// Konami's notes give the return in the End Phase; that turning the monster face-down does not stop it is the core's reading
	// (no Konami page read, YGOProJudge not asked). Before the fix the monster stayed with the player who took it, for good.
	it(`${cites("rules", "control-until-end-phase")} a monster taken until the End Phase and turned face-down by an effect still goes back to its owner (the flip: the core's reading, no source)`, () => {
		const { duel } = board({ you: { monsters: ["lv1", "lv1", "lv1", "lv1"] }, rival: { monsters: ["lv4"] } });
		const id = monster(duel, "lv4", "rival").id;
		let next = flipFaceDown(takeControl(duel, id, "you", duel.turn.number), id);
		expect(next.cards[id]).toMatchObject({ controller: "you", face: "down" });
		while (next.turn.phase !== "end") next = play(next, "pass");
		// The owner chooses the zone it comes back to.
		if (next.asking) next = act(next, legalActions(next)[0]!);
		expect(next.cards[id]).toMatchObject({ controller: "rival", zone: "monster", face: "down" });
	});
	it(`${cites("rules", "replay-causes")} an attack target turned face-down in the Battle Step is neither removed nor a new monster: no replay, the attack goes on against it`, () => {
		const { duel } = board({ phase: "battle", you: { monsters: ["lv4"], set: ["book"] }, rival: { monsters: ["lv3"] } });
		const done = play(duel, "attack lv4 > lv3", "activate book > lv3", "pass");
		// 1200 ATK against the 600 DEF of the monster flipped back face-up for damage calculation: destroyed, with no replay.
		expect(codes(done, "rival", "graveyard")).toEqual(["lv3"]);
		expect(done.replay).toBeNull();
		expect(done.battle).toBeNull();
	});
});

describe("a Summon that is listed can be made", () => {
	it(`${cites("rules", "ritual-procedure")} a Ritual Monster known by its frame alone is Ritual Summoned by a Ritual Spell: the Tributes are never paid for nothing`, () => {
		const framed: CardDef = { code: "ritual-frame-4", kind: "monster", facts: { frame: "ritual", level: 4, atk: 1600 } };
		const { duel } = board({ you: { hand: ["rite-equal", "ritual-frame-4", "lv4"] } }, { "ritual-frame-4": framed });
		const done = play(duel, "activate rite-equal", "place 0");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["lv4", "rite-equal"]);
		expect(monster(done, "ritual-frame-4")).toMatchObject({ slot: 0, proper: true, summonedBy: "ritual" });
	});
	it(`${cites("rules", "pendulum-summon-extra-zone")} ${cites("rules", "link-pendulum-still-restricted")} an Xyz Pendulum Monster face-up on the Extra Deck needs an Extra Monster Zone or a linked zone for its Xyz Summon too: with neither it is not listed`, () => {
		const pendXyz: CardDef = { code: "pend-xyz", kind: "monster", facts: { frame: "xyz", rank: 4, atk: 2000, pendulum: { scale: 3 } }, procedure: { kind: "xyz" } };
		// Your Extra Monster Zone is taken (by a monster that is no material) and no Link Monster points anywhere.
		const blocked = board({ you: { extraZone: ["lv6"], monsters: ["lv4", "lv4-b"], extraFaceUp: ["pend-xyz"] } }, { "pend-xyz": pendXyz }).duel;
		expect(summons(blocked)).toEqual([]);
		const open = board({ you: { monsters: ["lv4", "lv4-b"], extraFaceUp: ["pend-xyz"] } }, { "pend-xyz": pendXyz }).duel;
		expect(offered(play(open, "special-summon pend-xyz"))).toEqual(["place 5", "place 6"]);
	});
	it(`${cites("rules", "xyz-materials-not-on-field")} a Summon that finds no zone left when it should succeed fails cleanly: the monster and the materials stacked under it go to the Graveyard (the core's reading)`, () => {
		const { duel, log } = board({ options: { everyWindow: true }, you: { hand: ["lv1", "lv1", "lv1", "lv1", "lv1"], monsters: ["lv4", "lv4-b"], extra: ["xyz-4"] }, rival: { hand: ["lv2", "lv2"] } });
		const window = play(duel, "special-summon xyz-4", "place 0");
		const xyz = window.summoning!.cards[0]!;
		expect(materialsOf(window, xyz)).toHaveLength(2);
		// While the Summon waits, every zone it could use is taken (by hand here; a chain in its window would do it).
		let full = window.piles.you.hand.reduce((next, id, slot) => moveCard(next, id, { zone: "monster", slot }), window);
		full = full.piles.rival.hand.reduce((next, id, i) => moveCard(next, id, { zone: "monster", slot: 5 + i }), full);
		log.length = 0;
		const done = play(full, "pass", "pass");
		expect(done.summoning).toBeNull();
		expect(done.cards[xyz]).toMatchObject({ zone: "graveyard", proper: false });
		expect(materialsOf(done, xyz)).toEqual([]);
		expect(codes(done, "you", "graveyard").sort()).toEqual(["lv4", "lv4-b", "xyz-4"]);
		expect(log.filter((line) => line.startsWith("summoned"))).toEqual([]);
	});
});

describe("after a Summon an effect performed as Chain Link 1", () => {
	it(`${cites("rules", "summon-by-effect-chain-link-1")} ${cites("droll-lock-bird", "notes")} the Summon is something that happened: a card added to a hand in that chain is no longer what Droll & Lock Bird may answer`, () => {
		const search: CardDef = { code: "quick-search", kind: "quick-play", effects: [{ type: "activation", categories: ["search"], operation: (duel, link) => moveCard(duel, duel.piles[link.player].deck[0]!, { zone: "hand" }) }] };
		const { duel } = board({ you: { hand: ["droll-lock-bird"], monsters: ["quick-tuner", "lv3"], extra: ["synchro-5"] }, rival: { set: ["quick-search"], deck: ["lv2"] } }, { "quick-search": search, "droll-lock-bird": CARD_DEFS["droll-lock-bird"]! });
		// Chain Link 1: your Tuner's Synchro Summon; Chain Link 2: the rival's search.
		const done = play(duel, "activate quick-tuner", "activate quick-search", "place 0");
		expect(codes(done, "rival", "hand")).toEqual(["lv2"]);
		expect(monster(done, "synchro-5")).toMatchObject({ slot: 0 });
		expect(offered(done)).not.toContain("activate droll-lock-bird");
	});
});

describe("Special Summons by effect, the corners", () => {
	it(`${cites("rules", "pendulum-zones")} ${cites("rules", "position-not-the-turn-played")} a Pendulum Monster in a Pendulum Zone can be Special Summoned by an effect, and is then a monster played onto the field this turn`, () => {
		const { duel } = board({ you: { faceupSpells: ["pend-4"] } });
		const id = duel.piles.you.spell[0]!;
		const summoned = specialSummon(duel, "you", id, { slot: 2 });
		expect(summoned.cards[id]).toMatchObject({ zone: "monster", slot: 2, face: "up", arrived: duel.turn.number });
		expect(offered(summoned)).not.toContain("change-position pend-4");
	});
	it(`${cites("rules", "link-no-defense")} the zone of a Link Monster an effect Special Summons is asked with its one position, which the answer may name`, () => {
		const { duel } = board({ you: { hand: ["reborn"], monsters: ["lv4", "lv3"], extra: ["link-2"] } });
		const summoned = play(duel, "special-summon link-2", "place 5");
		const buried = moveCard(summoned, monster(summoned, "link-2").id, { zone: "graveyard" });
		const asked = play(buried, "activate reborn > link-2");
		expect(legalActions(asked)[1]).toEqual({ type: "place", zone: 1, positions: ["attack"] });
		expect(() => act(asked, { type: "place", zone: 1, position: "defense" } as Action)).toThrow(/not a legal action/);
		expect(monster(act(asked, { type: "place", zone: 1, position: "attack" }), "link-2")).toMatchObject({ slot: 1, position: "attack" });
	});
});
