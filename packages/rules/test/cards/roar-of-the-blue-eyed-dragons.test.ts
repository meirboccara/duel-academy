import { describe, expect, it } from "vitest";
import { act, canSpecialSummon, CARD_DEFS, type CardDef, cites, type Duel, legalActions, moveCard, negateEffect, specialSummon, printedFacts } from "../../src";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "roar-of-the-blue-eyed-dragons";
const BEWD = "blue-eyes-white-dragon";
const gaps = gapCards();
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	// A Fusion Monster that is not a Dragon ("2 monsters"), and one that is.
	"fixture-twin": gaps["fixture-twin"]!,
	"fixture-dragon-twin": { code: "fixture-dragon-twin", kind: "monster", facts: { name: "Fixture Dragon Twin", frame: "fusion", monsterType: "Dragon", level: 8, atk: 2800, def: 2000 }, procedure: { kind: "fusion", materials: [{ min: 2, max: 2 }] } },
	// A Counter Trap: "Negate the effect" of the last link.
	"fixture-effect-negator": { code: "fixture-effect-negator", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs, options, you, rival });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
/** Banishes the first card with this code that is not banished yet (the position builder has no banished zone). */
const banish = (duel: Duel, code: string, face: "up" | "down" = "up"): Duel => moveCard(duel, Object.values(duel.cards).find((entry) => entry.code === code && entry.zone !== "banished")!.id, { zone: "banished", face });
const toMain = (duel: Duel, by: number): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};
/** Passes while only passing is offered (the chain is over, the game state not open yet). */
const reopen = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 4 && offered(next).length === 1 && offered(next)[0] === "pass"; guard++) next = play(next, "pass");
	return next;
};
const choices = (duel: Duel) => offered(duel).filter((entry) => entry.startsWith("choose"));
/** Takes the first zone offered (`place`) or card offered (`choose`) while the effect asks, then passes until the chain is resolved. */
const finish = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 20 && (next.asking || next.chain.length > 0); guard++) {
		const labels = offered(next);
		next = play(next, labels.find((entry) => entry.startsWith("place") || entry.startsWith("choose")) ?? "pass");
	}
	return next;
};

describe("Roar of the Blue-Eyed Dragons, written as effect records", () => {
	it(`${cites("roar-of-the-blue-eyed-dragons", "facts")} is a Normal Spell`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Roar of the Blue-Eyed Dragons", mentions: ["Blue-Eyes White Dragon", "Roar of the Blue-Eyed Dragons"] });
		expect(duel.defs[card]!.kind).toBe("spell");
	});

	describe("its Special Summon", () => {
		it(`${cites("roar-of-the-blue-eyed-dragons", "summon")} Special Summons 1 "Blue-Eyes" monster from the GY or banishment in Defense Position, chosen when it resolves, and not one from the hand or banished face-down; the Spell goes to the GY`, () => {
			let start = board({ hand: [card, "fixture-blue-eyes-normal"], monsters: [BEWD], graveyard: ["fixture-blue-eyes-small", "fixture-blue-eyes-effect", "fixture-blue-eyes-effect"] });
			start = banish(banish(start, "fixture-blue-eyes-effect"), "fixture-blue-eyes-effect", "down");
			const asked = play(start, `activate ${card}`);
			expect(choices(asked)).toEqual(["choose fixture-blue-eyes-effect", "choose fixture-blue-eyes-small"]);
			for (const code of ["fixture-blue-eyes-small", "fixture-blue-eyes-effect"]) {
				const done = finish(play(asked, `choose ${code}`));
				expect(find(done, code)).toMatchObject({ zone: "monster", face: "up", position: "defense", specialSummoned: true });
				expect(find(done, card).zone).toBe("graveyard");
			}
		});
		it(`${cites("roar-of-the-blue-eyed-dragons", "summon")} Special Summons a "Blue-Eyes" monster from the Deck, and cannot be activated with no such monster to Summon in the Deck, GY or banishment`, () => {
			const start = board({ hand: [card], monsters: [BEWD], deck: ["fixture-blue-eyes-normal", "fixture-other-dragon"] });
			const done = finish(play(start, `activate ${card}`));
			expect(codes(done, "you", "monster").sort()).toEqual([BEWD, "fixture-blue-eyes-normal"].sort());
			expect(find(done, "fixture-blue-eyes-normal")).toMatchObject({ position: "defense", specialSummoned: true });
			expect(own(board({ hand: [card], monsters: [BEWD], deck: ["fixture-other-dragon"], graveyard: ["fixture-light-1"] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("roar-of-the-blue-eyed-dragons", "bewd-only")} ${cites("roar-of-the-blue-eyed-dragons", "notes-bewd-only")} lets only "Blue-Eyes White Dragon" be Summoned while the player controls no face-up "Blue-Eyes White Dragon" in the Monster Zone or Spell & Trap Zone`, () => {
			const others = ["fixture-blue-eyes-normal", "fixture-blue-eyes-small"];
			// None controlled: the Dragon only; a Deck with other "Blue-Eyes" monsters alone is no activation.
			const none = board({ hand: [card], deck: [...others, BEWD] });
			const done = finish(play(none, `activate ${card}`));
			expect(codes(done, "you", "monster")).toEqual([BEWD]);
			expect(own(board({ hand: [card], deck: others }), `activate ${card}`)).toEqual([]);
			// A face-down one is not "face-up": the Dragon only.
			expect(codes(finish(play(board({ hand: [card], facedown: [BEWD], deck: [...others, BEWD] }), `activate ${card}`)), "you", "monster").sort()).toEqual([BEWD, BEWD]);
			expect(own(board({ hand: [card], facedown: [BEWD], deck: others }), `activate ${card}`)).toEqual([]);
			// Face-up in the Monster Zone or in the Spell & Trap Zone: any "Blue-Eyes" monster.
			for (const spec of [{ monsters: [BEWD] }, { faceupSpells: [BEWD] }]) {
				const asked = play(board({ hand: [card], deck: others, ...spec }), `activate ${card}`);
				expect(choices(asked)).toEqual(["choose fixture-blue-eyes-normal", "choose fixture-blue-eyes-small"]);
			}
		});
		it(`${cites("roar-of-the-blue-eyed-dragons", "lock")} stops the player from Special Summoning from the Extra Deck for the rest of the turn, except Dragon monsters, but not from anywhere else`, () => {
			const start = board({ hand: [card, "fixture-normal-4"], deck: [BEWD], extra: ["fixture-twin", "fixture-dragon-twin"] });
			expect(canSpecialSummon(start, "you", find(start, "fixture-twin").id, "fusion")).toBe(true);
			const done = finish(play(start, `activate ${card}`));
			expect(codes(done, "you", "monster")).toEqual([BEWD]);
			expect(canSpecialSummon(done, "you", find(done, "fixture-twin").id, "fusion")).toBe(false);
			expect(canSpecialSummon(done, "you", find(done, "fixture-dragon-twin").id, "fusion")).toBe(true);
			expect(canSpecialSummon(done, "you", find(done, "fixture-normal-4").id)).toBe(true);
			// It ends with the turn.
			expect(canSpecialSummon(toMain(done, 2), "you", find(done, "fixture-twin").id, "fusion")).toBe(true);
		});
		it(`${cites("roar-of-the-blue-eyed-dragons", "notes-lock-already")} can be activated in a turn when a monster was already Special Summoned from the Extra Deck`, () => {
			const start = board({ hand: [card], deck: [BEWD], extra: ["fixture-twin"] });
			const summoned = specialSummon(start, "you", find(start, "fixture-twin").id, { kind: "fusion" });
			expect(find(summoned, "fixture-twin").zone).toBe("monster");
			expect(own(summoned, `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("roar-of-the-blue-eyed-dragons", "notes-lock-negated")} leaves no lock, and Summons nothing, when the effect is negated`, () => {
			const start = board({ hand: [card], deck: [BEWD], extra: ["fixture-twin"] }, { set: ["fixture-effect-negator"] }, { everyWindow: true });
			const negated = finish(play(start, `activate ${card}`, "activate fixture-effect-negator"));
			expect(codes(negated, "you", "monster")).toEqual([]);
			expect(canSpecialSummon(negated, "you", find(negated, "fixture-twin").id, "fusion")).toBe(true);
		});
	});

	describe("its Graveyard effect", () => {
		const fusing = (extra: Partial<SideSpec> = {}) => board({ graveyard: [card], hand: ["fixture-blue-eyes-small", "fixture-normal-4"], extra: ["fixture-twin"], ...extra });
		it(`${cites("roar-of-the-blue-eyed-dragons", "fusion")} ${cites("roar-of-the-blue-eyed-dragons", "notes-gy-effect")} banishes itself from the GY as a cost and Fusion Summons 1 Fusion Monster using monsters from the hand or field, including a "Blue-Eyes" monster, as a Chain Link`, () => {
			const start = fusing();
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const chained = play(start, `activate ${card}`);
			expect(find(chained, card).zone).toBe("banished");
			const done = finish(chained);
			expect(find(done, "fixture-twin")).toMatchObject({ zone: "monster", summonedBy: "fusion", proper: true });
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-blue-eyes-small", "fixture-normal-4"].sort());
			// The Chain Link was the Spell's own effect from the GY.
			expect(play(start, `activate ${card}`).chain.map((link) => [link.card.code, link.card.zone])).toEqual([[card, "graveyard"]]);
		});
		it(`${cites("roar-of-the-blue-eyed-dragons", "fusion")} is not activated without a "Blue-Eyes" monster among the monsters of the hand or field it could use, nor with one only in the Deck`, () => {
			expect(own(fusing({ hand: ["fixture-normal-4", "fixture-normal-6"] }), `activate ${card}`)).toEqual([]);
			expect(own(fusing({ hand: ["fixture-normal-4", "fixture-normal-6"], deck: ["fixture-blue-eyes-small"] }), `activate ${card}`)).toEqual([]);
			// On the field it counts as well as in the hand.
			expect(own(fusing({ hand: ["fixture-normal-4"], monsters: ["fixture-blue-eyes-small"] }), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
	});

	describe("once per turn", () => {
		/** Activates the Spell from where it is: the hand (its own activation) or the Graveyard (its effect). */
		const from = (duel: Duel, zone: "hand" | "graveyard"): Duel => act(duel, legalActions(duel).find((action) => action.type === "activate" && duel.cards[action.card]!.zone === zone)!);
		it(`${cites("roar-of-the-blue-eyed-dragons", "once")} lets only 1 Roar effect be used per turn, whichever effect and whichever copy`, () => {
			const start = board({ hand: [card, "fixture-blue-eyes-small", "fixture-normal-4"], graveyard: [card], deck: [BEWD], extra: ["fixture-twin"] });
			expect(own(start, `activate ${card}`)).toHaveLength(2);
			const spell = finish(from(start, "hand"));
			expect(own(reopen(spell), `activate ${card}`)).toEqual([]);
			// The other way round: the Graveyard effect first, then the Spell in the hand is not offered.
			const grave = finish(from(start, "graveyard"));
			expect(own(reopen(grave), `activate ${card}`)).toEqual([]);
			expect(own(toMain(grave, 2), `activate ${card}`).length).toBeGreaterThan(0);
		});
	});
});
