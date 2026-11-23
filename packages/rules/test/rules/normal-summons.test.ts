import { describe, expect, it } from "vitest";
import { act, cardsIn, cites, type Duel, legalActions } from "../../src";
import { codes, offered, play, position } from "./fixtures";
import { summonCards } from "./summon-fixtures";

/**
 * Step 8: the Normal Summon family (Tribute Summon, Normal Set, Tribute Set), the Flip Summon and FLIP effects, and changes of
 * battle position, through `legalActions` / `act`. The spy card writes every event in the log.
 */
function board(spec: Omit<Parameters<typeof position>[0], "defs">): { duel: Duel; log: string[] } {
	const log: string[] = [];
	const duel = position({ ...spec, defs: summonCards(log), rival: { ...spec.rival, faceupSpells: [...(spec.rival?.faceupSpells ?? []), "spy"] } });
	log.length = 0;
	return { duel, log };
}
const monster = (duel: Duel, code: string, side: "you" | "rival" = "you") => cardsIn(duel, side, "monster").find((card) => card.code === code)!;

describe("a Tribute Summon", () => {
	it(`${cites("rules", "tribute-summon")} ${cites("rules", "tribute-count")} ${cites("rules", "tribute-not-destroyed")} a Level 5 or 6 monster is Normal Summoned by Tributing 1 monster the player chooses, which is sent to the Graveyard and not destroyed`, () => {
		const { duel, log } = board({ you: { hand: ["lv6", "lv5"], monsters: ["lv4", "lv3"] } });
		// Each is listed once: the Tribute is asked afterwards.
		expect(offered(duel).filter((label) => label.includes("lv6") || label.includes("lv5"))).toEqual(["set lv5", "set lv6", "summon lv5", "summon lv6"]);
		const asked = play(duel, "summon lv6");
		expect(offered(asked)).toEqual(["choose lv3", "choose lv4"]);
		// The Tribute frees its zone: the monster may go there or to any other free Main Monster Zone.
		const placing = play(asked, "choose lv4");
		expect(offered(placing)).toEqual(["place 0", "place 2", "place 3", "place 4"]);
		const done = play(placing, "place 0");
		expect(monster(done, "lv6")).toMatchObject({ slot: 0, face: "up", position: "attack" });
		expect(codes(done, "you", "graveyard")).toEqual(["lv4"]);
		expect(log).toEqual(["moved lv4 monster>graveyard tributed", "moved lv6 hand>monster", "summoned lv6 normal tribute"]);
		// It was the turn's Normal Summon.
		expect(offered(done)).not.toContain("summon lv5");
	});
	it(`${cites("rules", "tribute-count")} a Level 7 or higher monster needs 2 Tributes, and is not offered with fewer monsters`, () => {
		const { duel } = board({ you: { hand: ["lv7"], monsters: ["lv4", "lv3", "lv2"] } });
		const first = play(duel, "summon lv7", "choose lv2");
		// One more is needed: the player cannot stop here.
		expect(offered(first)).toEqual(["choose lv3", "choose lv4"]);
		const done = play(first, "choose lv4", "place 2");
		expect(codes(done, "you", "monster")).toEqual(["lv3", "lv7"]);
		expect(codes(done, "you", "graveyard").sort()).toEqual(["lv2", "lv4"]);
		const { duel: short } = board({ you: { hand: ["lv7", "lv5"], monsters: ["lv4"] } });
		expect(offered(short).filter((label) => label.startsWith("summon") || label.startsWith("set"))).toEqual(["set lv5", "summon lv5"]);
		expect(offered(board({ you: { hand: ["lv5"] } }).duel)).toEqual(["pass"]);
	});
	it(`${cites("rules", "tribute-summon")} ${cites("rules", "tribute-not-destroyed")} a face-down monster can be Tributed, and with all five Main Monster Zones full the monster takes the Tribute's zone`, () => {
		const { duel } = board({ you: { hand: ["lv5"], monsters: ["lv4", "lv3", "lv2", "lv1"], facedown: ["lv4-b"] } });
		const asked = play(duel, "summon lv5");
		expect(offered(asked)).toContain("choose lv4-b");
		// The only free zone is the one the Tribute leaves: nothing more is asked.
		const done = play(asked, "choose lv4-b");
		expect(monster(done, "lv5").slot).toBe(4);
	});
	it(`${cites("rules", "tribute-is-a-cost")} ${cites("rules", "negated-summon-not-from-field")} the Tribute is a cost: when the Summon is negated it stays paid, and the Normal Summon is used`, () => {
		const { duel, log } = board({ you: { hand: ["lv6", "lv4-b"], monsters: ["lv4"] }, rival: { set: ["warning"] } });
		const negated = play(duel, "summon lv6", "place 0", "activate warning");
		expect(codes(negated, "you", "monster")).toEqual([]);
		expect(codes(negated, "you", "graveyard")).toEqual(["lv4", "lv6"]);
		expect(log).toEqual(["moved lv4 monster>graveyard tributed", "warning", "moved lv6 hand>graveyard destroyed negated", "moved warning spell>graveyard"]);
		expect(offered(negated)).toEqual(["pass"]);
	});
});

describe("monsters that cannot be Normal Summoned", () => {
	it(`${cites("rules", "ritual-monster-needs-ritual")} ${cites("rules", "normal-summon-restriction")} a Ritual Monster, and a monster whose text forbids it, are offered neither a Normal Summon nor a Set, with or without Tributes`, () => {
		const { duel } = board({ you: { hand: ["ritual-8", "no-normal", "lv4"], monsters: ["lv3", "lv2"] } });
		expect(offered(duel).filter((label) => label.startsWith("summon") || label.startsWith("set"))).toEqual(["set lv4", "summon lv4"]);
	});
});

describe("a Normal Set", () => {
	it(`${cites("rules", "normal-set")} ${cites("rules", "normal-summon-or-set")} puts the monster in face-down Defense Position in the zone chosen; it is not a Summon and uses the turn's Normal Summon`, () => {
		const { duel, log } = board({ you: { hand: ["lv4", "lv3"] }, rival: { set: ["warning"], monsters: ["summon-watcher"] } });
		const setting = legalActions(duel).find((action) => action.type === "set" && duel.cards[action.card]!.code === "lv4")!;
		expect(setting).toMatchObject({ zones: [0, 1, 2, 3, 4] });
		const done = act(duel, { ...setting, zone: 3 } as typeof setting);
		expect(monster(done, "lv4")).toMatchObject({ slot: 3, face: "down", position: "defense" });
		// No window for "when a monster would be Summoned", no "when Summoned" trigger: nothing was Summoned.
		expect(done.summoning).toBeNull();
		expect(log).toEqual(["moved lv4 hand>monster"]);
		expect(offered(done)).toEqual(["pass"]);
	});
	it(`${cites("rules", "tribute-set")} a Level 5 or higher monster is Tribute Set: Tributes, then face-down Defense Position, and nothing is Summoned`, () => {
		const { duel, log } = board({ you: { hand: ["lv6"], monsters: ["lv4"] }, rival: { set: ["warning"] } });
		const done = play(duel, "set lv6", "place 1");
		expect(monster(done, "lv6")).toMatchObject({ slot: 1, face: "down", position: "defense" });
		expect(log).toEqual(["moved lv4 monster>graveyard tributed", "moved lv6 hand>monster"]);
		expect(done.summoning).toBeNull();
	});
});

describe("a Flip Summon", () => {
	it(`${cites("rules", "flip-summon")} ${cites("rules", "flip-effect")} turns a face-down monster to face-up Attack Position; the monster is Summoned, and its FLIP effect is activated`, () => {
		const { duel, log } = board({ you: { facedown: ["flipper"] } });
		expect(offered(duel)).toEqual(["flip-summon flipper", "pass"]);
		const done = play(duel, "flip-summon flipper");
		expect(monster(done, "flipper")).toMatchObject({ face: "up", position: "attack" });
		expect(log).toEqual(["flipped flipper", "summoned flipper flip", "flipper"]);
	});
	it(`${cites("rules", "flip-summon-not-the-turn-set")} is not offered in the turn the monster was Set, and there is no limit to the number of Flip Summons in a turn`, () => {
		const { duel } = board({ you: { hand: ["lv4"], facedown: ["lv3", "lv2"] } });
		const set = play(duel, "set lv4");
		expect(offered(set)).toEqual(["flip-summon lv2", "flip-summon lv3", "pass"]);
		expect(offered(play(set, "flip-summon lv3"))).toEqual(["flip-summon lv2", "pass"]);
	});
	it(`${cites("rules", "negated-flip-summon-destroyed-on-field")} a negated Flip Summon destroys the monster on the field: it is sent from the Monster Zone, never flipped`, () => {
		const { duel, log } = board({ you: { facedown: ["flipper"] }, rival: { set: ["warning"] } });
		const asked = play(duel, "flip-summon flipper");
		// During the window the monster is still face-down on the field.
		expect(monster(asked, "flipper").face).toBe("down");
		const negated = play(asked, "activate warning");
		expect(codes(negated, "you", "graveyard")).toEqual(["flipper"]);
		// Destroyed in the Monster Zone (no "negated" mark: it was on the field), and neither flipped nor Summoned.
		expect(log).toEqual(["warning", "moved flipper monster>graveyard destroyed", "moved warning spell>graveyard"]);
	});
	it(`${cites("rules", "flip-effect")} a FLIP effect is also activated when a card effect flips the monster face-up, which is not a Summon`, () => {
		const { duel, log } = board({ you: { hand: ["light"], facedown: ["flipper"] } });
		const done = play(duel, "activate light");
		expect(monster(done, "flipper")).toMatchObject({ face: "up", position: "defense" });
		expect(log).toEqual(["moved light hand>spell", "flipped flipper", "moved light spell>graveyard", "flipper"]);
	});
});

describe("changing a battle position by hand", () => {
	it(`${cites("rules", "position-once-per-turn")} ${cites("rules", "actions-not-chained-to")} changes a face-up monster between Attack and Defense Position, once per turn for each monster, with no chain`, () => {
		const { duel, log } = board({ you: { monsters: ["lv4", "lv3"] } });
		const done = play(duel, "change-position lv4");
		expect(monster(done, "lv4")).toMatchObject({ face: "up", position: "defense" });
		expect(done.chain).toEqual([]);
		expect(log).toEqual(["position lv4 attack>defense"]);
		expect(offered(done)).toEqual(["change-position lv3", "pass"]);
		expect(monster(play(done, "change-position lv3", "pass", "pass", "pass", "pass"), "lv3").position).toBe("defense");
	});
	it(`${cites("rules", "position-not-the-turn-played")} not for a monster played onto the field this turn, Summoned or Set`, () => {
		const { duel } = board({ you: { hand: ["lv4"], monsters: ["lv3"] } });
		expect(offered(play(duel, "summon lv4"))).toEqual(["change-position lv3", "pass"]);
		const { duel: again } = board({ you: { hand: ["lv4"] } });
		expect(offered(play(again, "set lv4"))).toEqual(["pass"]);
	});
	it(`${cites("rules", "position-not-after-attack")} not in Main Phase 2 for a monster that attacked in the Battle Phase`, () => {
		const { duel } = board({ phase: "battle", you: { monsters: ["lv4", "lv3"] } });
		const attacked = play(duel, "attack lv4 directly");
		expect(attacked.lp.rival).toBe(8000 - 1200);
		const main2 = play(attacked, "pass");
		expect(main2.turn.phase).toBe("main2");
		expect(offered(main2)).toEqual(["change-position lv3", "pass"]);
	});
	it(`${cites("rules", "link-no-defense")} never for a Link Monster, which no effect can put in Defense Position or face-down either`, () => {
		const { duel } = board({ you: { hand: ["switch", "book"], extraZone: ["link-2"] } });
		expect(offered(duel)).not.toContain("change-position link-2");
		expect(monster(play(duel, "activate switch > link-2", "pass"), "link-2")).toMatchObject({ face: "up", position: "attack" });
		expect(monster(play(duel, "activate book > link-2", "pass"), "link-2")).toMatchObject({ face: "up", position: "attack" });
	});
	// The rulebook gives the three limits; that a Flip Summon is the monster's change of the turn, and that an effect's change does not use
	// it, is YGOProJudge's answer only (asked 2026-11-23, no Konami page cited).
	it("a Flip Summon is the monster's change of the turn; a change made by a card effect is not (YGOProJudge lead, no Konami record)", () => {
		const { duel } = board({ you: { hand: ["switch", "book"], monsters: ["lv4"], facedown: ["lv3"] } });
		expect(offered(play(duel, "flip-summon lv3"))).not.toContain("change-position lv3");
		const switched = play(duel, "activate switch > lv4", "pass", "pass");
		expect(monster(switched, "lv4").position).toBe("defense");
		expect(offered(switched)).toContain("change-position lv4");
		// Turned face-down by an effect, a monster that was not Set this turn can still be Flip Summoned.
		expect(offered(play(duel, "activate book > lv4", "pass"))).toContain("flip-summon lv4");
	});
});
