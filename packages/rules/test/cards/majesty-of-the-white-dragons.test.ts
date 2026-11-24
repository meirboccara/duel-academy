import { describe, expect, it } from "vitest";
import { act, CARD_DEFS, type CardDef, cites, type Duel, legalActions, revealedNow, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "majesty-of-the-white-dragons";
const BEWD = "blue-eyes-white-dragon";
const ritual = (code: string, level: number): CardDef => ({ code, kind: "monster", facts: { name: `Fixture Ritual ${level}`, frame: "ritual", attribute: "LIGHT", monsterType: "Dragon", level, atk: 3000, def: 2500 }, procedure: { kind: "ritual" } });
const fixtures: Record<string, CardDef> = { ...blueEyesFixtures, "fixture-ritual-8": ritual("fixture-ritual-8", 8), "fixture-ritual-16": ritual("fixture-ritual-16", 16), "fixture-ritual-12": ritual("fixture-ritual-12", 12) };
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
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
/** Takes the first zone or card offered while the effect asks, then passes until the chain is resolved. */
const finish = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 30 && (next.asking || next.chain.length > 0); guard++) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose")) ?? "pass");
	return next;
};
const rivalField: SideSpec = { monsters: ["fixture-other-dragon", "fixture-effect-4"], set: ["fixture-primite-spell"] };
const rivalWith = (extra: SideSpec = {}): SideSpec => ({ ...rivalField, ...extra });

describe("Majesty of the White Dragons, written as effect records", () => {
	it(`${cites("majesty-of-the-white-dragons", "facts")} is a Normal Trap`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Majesty of the White Dragons", mentions: ["Blue-Eyes White Dragon", "Majesty of the White Dragons"] });
		expect(duel.defs[card]!.kind).toBe("trap");
	});

	describe("its Trap Card effect", () => {
		it(`${cites("majesty-of-the-white-dragons", "show")} shows up to 3 "Blue-Eyes White Dragon" in the hand, the face-up Monster Zone and the GY, then destroys an equal number of cards the opponent controls, the player choosing which`, () => {
			const start = board({ set: [card], hand: [BEWD], monsters: [BEWD], graveyard: [BEWD, BEWD] }, { monsters: ["fixture-other-dragon", "fixture-effect-4"], set: ["fixture-plain-spell"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			// Up to 3 of the 4 are chosen one by one; none more once 3 are shown, and stopping early is allowed once 1 is.
			const asked = play(start, `activate ${card}`);
			expect(offered(asked)).toEqual(["choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon", "pass"]);
			const two = play(asked, "choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon", "pass");
			// 2 shown: 2 of the opponent's 3 cards are destroyed, the player's choice.
			expect(offered(two)).toEqual(["choose fixture-effect-4", "choose fixture-other-dragon", "choose fixture-plain-spell"]);
			const done = finish(play(two, "choose fixture-other-dragon", "choose fixture-plain-spell"));
			expect(codes(done, "rival", "graveyard").sort()).toEqual(["fixture-other-dragon", "fixture-plain-spell"]);
			expect(codes(done, "rival", "monster")).toEqual(["fixture-effect-4"]);
			expect(revealedNow(done)).toHaveLength(2);
			// All 3: every card of the opponent goes, nothing is asked.
			const all = finish(play(asked, "choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon"));
			expect([codes(all, "rival", "monster"), codes(all, "rival", "spell")]).toEqual([[], []]);
			expect(codes(all, "rival", "graveyard")).toHaveLength(3);
			expect(find(all, card).zone).toBe("graveyard");
		});
		it(`${cites("majesty-of-the-white-dragons", "show")} destroys nothing when no card is shown, and destroys as many as the opponent controls when it has fewer than were shown`, () => {
			const start = board({ set: [card], hand: [BEWD, BEWD] }, { monsters: ["fixture-effect-4"] });
			const none = finish(play(start, `activate ${card}`, "pass"));
			expect(none.piles.rival.monster).toHaveLength(1);
			expect(revealedNow(none)).toEqual([]);
			const fewer = finish(play(start, `activate ${card}`, "choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon"));
			expect(fewer.piles.rival.monster).toHaveLength(0);
			expect(codes(fewer, "rival", "graveyard")).toEqual(["fixture-effect-4"]);
		});
		it(`${cites("majesty-of-the-white-dragons", "notes-show-places")} cannot show a "Blue-Eyes White Dragon" in a Spell & Trap Zone, face-down, in the Deck or banished: the hand, the face-up Monster Zone and the GY only`, () => {
			const start = board({ set: [card], faceupSpells: [BEWD], facedown: [BEWD], deck: [BEWD], hand: ["fixture-blue-eyes-normal"], graveyard: ["fixture-blue-eyes-effect"] }, rivalField);
			// No card can be shown: the effect asks for none (nothing to choose, no card destroyed).
			const done = finish(play(start, `activate ${card}`));
			expect(done.piles.rival.monster).toHaveLength(2);
			expect(revealedNow(done)).toEqual([]);
			const one = board({ set: [card], monsters: [BEWD], faceupSpells: [BEWD] }, rivalField);
			expect(offered(play(one, `activate ${card}`))).toEqual(["choose blue-eyes-white-dragon", "pass"]);
		});
		it(`${cites("majesty-of-the-white-dragons", "notes-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = board({ set: [card], monsters: [BEWD], hand: [BEWD] }, { monsters: ["fixture-other-dragon"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-other-dragon > blue-eyes-white-dragon");
			expect(offered(declared.priority.holder === "you" ? declared : play(declared, "pass"))).toContain(`activate ${card}`);
			const inStep = toStep(declared, "start");
			const holder = inStep.priority.holder === "you" ? inStep : play(inStep, "pass");
			expect(own(holder, `activate ${card}`)).toEqual([]);
		});
	});

	describe("its Graveyard effect", () => {
		const rite = (you: SideSpec = {}, turn: "you" | "rival" = "you") => board({ graveyard: [card], hand: ["fixture-ritual-8", BEWD], ...you }, {}, {}, turn);
		it(`${cites("majesty-of-the-white-dragons", "ritual")} ${cites("majesty-of-the-white-dragons", "notes-ritual-chain")} banishes itself and Ritual Summons 1 Ritual Monster from the hand by Tributing "Blue-Eyes White Dragon" from the hand or field whose total Levels equal its Level, as a Chain Link`, () => {
			const start = rite();
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const chained = play(start, `activate ${card}`);
			expect(chained.chain.map((link) => [link.card.code, link.card.zone])).toEqual([[card, "graveyard"]]);
			expect(find(chained, card).zone).toBe("banished");
			const done = finish(chained);
			expect(find(done, "fixture-ritual-8")).toMatchObject({ zone: "monster", summonedBy: "ritual", proper: true });
			expect(codes(done, "you", "graveyard")).toEqual([BEWD]);
			// Two Dragons from the hand and the field for a Level 16 monster; Levels that do not add up, or a Tribute that is not the Dragon, are no Summon.
			const sixteen = board({ graveyard: [card], hand: ["fixture-ritual-16", BEWD], monsters: [BEWD] });
			expect(codes(finish(play(sixteen, `activate ${card}`)), "you", "graveyard").sort()).toEqual([BEWD, BEWD]);
			expect(own(board({ graveyard: [card], hand: ["fixture-ritual-12", BEWD], monsters: [BEWD] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ graveyard: [card], hand: ["fixture-ritual-8", "fixture-blue-eyes-normal"] }), `activate ${card}`)).toEqual([]);
			// The Ritual Monster must be in the hand; the Dragons in the Deck or the GY are not Tributes.
			expect(own(board({ graveyard: [card, BEWD], deck: [BEWD], hand: ["fixture-normal-4"], extra: [] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("majesty-of-the-white-dragons", "ritual")} can be activated in the opponent's turn too: a Quick Effect (Spell Speed 2, YGOProJudge's answer only, asked 2026-11-24: no Konami page read says which speed it has)`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-ritual-8", BEWD] }, {}, { everyWindow: true }, "rival");
			const mine = start.priority.holder === "you" ? start : play(start, "pass");
			expect(own(mine, `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("majesty-of-the-white-dragons", "notes-damage-step")} cannot be activated in the Damage Step either`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-ritual-8", BEWD], monsters: [BEWD] }, { monsters: ["fixture-other-dragon"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-other-dragon > blue-eyes-white-dragon");
			expect(offered(declared.priority.holder === "you" ? declared : play(declared, "pass"))).toContain(`activate ${card}`);
			const inStep = toStep(declared, "start");
			const holder = inStep.priority.holder === "you" ? inStep : play(inStep, "pass");
			expect(own(holder, `activate ${card}`)).toEqual([]);
		});
	});

	describe("once per turn", () => {
		/** Activates the copy in the Spell & Trap Zone (its own activation) or the one in the Graveyard (its effect). */
		const from = (duel: Duel, zone: "spell" | "graveyard"): Duel => act(duel, legalActions(duel).find((action) => action.type === "activate" && duel.cards[action.card]!.zone === zone)!);
		it(`${cites("majesty-of-the-white-dragons", "once")} lets each effect be used once per turn, by name: another copy cannot use the same effect, and the other effect is free`, () => {
			const start = board({ set: [card, card], graveyard: [card, card], hand: ["fixture-ritual-8", BEWD] }, rivalField);
			expect(own(start, `activate ${card}`)).toHaveLength(4);
			// The Trap's effect once: the other Set copy is no longer offered; the three Graveyard copies (the one used is there now) still are.
			const trap = finish(from(start, "spell"));
			expect(own(reopen(trap), `activate ${card}`)).toHaveLength(3);
			// The Graveyard effect once: nothing is left this turn, for any copy.
			const both = finish(from(trap, "graveyard"));
			expect(own(reopen(both), `activate ${card}`)).toEqual([]);
			// Two turns later both effects are back.
			expect(own(toMain(both, 2), `activate ${card}`).length).toBeGreaterThan(0);
		});
	});
});
