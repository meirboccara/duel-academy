import { describe, expect, it } from "vitest";
import { addModifier, CARD_DEFS, type CardDef, cites, type Duel, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { nextTurn as passUntil, toPhase } from "../rules/continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "bystial-magnamhut";
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...blueEyesFixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const toMain = (duel: Duel, by: number): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};
/** Resolves the chain and answers the questions of the effect (zone, card) with the first offer, stopping when something else is offered. */
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
const LIGHT = "fixture-light-1";
const DARK = "fixture-dark-tuner";
const summoned = (extra: SideSpec = {}, rival: SideSpec = {}, options = {}) => settle(play(board({ hand: [card], graveyard: [LIGHT], ...extra }, rival, options), `activate ${card} > ${LIGHT}`));

describe("Bystial Magnamhut, written as effect records", () => {
	it(`${cites("bystial-magnamhut", "facts")} is a DARK Dragon Effect Monster of Level 6 with 2500 ATK and 2000 DEF`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Bystial Magnamhut", attribute: "DARK", monsterType: "Dragon", level: 6, atk: 2500, def: 2000, archetypes: ["Bystial"], mentions: ["Bystial Magnamhut"] });
	});

	describe("its Special Summon from the hand", () => {
		it(`${cites("bystial-magnamhut", "summon")} ${cites("bystial-magnamhut", "notes-summon-ignition")} banishes the LIGHT or DARK monster targeted in either GY and, if it did, Special Summons itself from the hand`, () => {
			const start = board({ hand: [card], graveyard: [LIGHT, "fixture-normal-4", "fixture-normal-6"] }, { graveyard: [DARK, "fixture-other-dragon", "raigeki"] });
			// An Ignition Effect (the opponent controls no monster): the LIGHT and DARK monsters of both Graveyards are the targets.
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card} > ${DARK}`, `activate ${card} > fixture-other-dragon`, `activate ${card} > ${LIGHT}`].sort());
			const done = settle(play(start, `activate ${card} > ${DARK}`));
			expect(codes(done, "rival", "banished")).toEqual([DARK]);
			expect(find(done, DARK).face).toBe("up");
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
		});
		it(`${cites("bystial-magnamhut", "summon")} is not activated with no LIGHT or DARK monster in a GY, or with no free Monster Zone`, () => {
			expect(own(board({ hand: [card], graveyard: ["fixture-normal-4", "raigeki"] }), `activate ${card}`)).toEqual([]);
			const full = ["fixture-effect-4", "fixture-effect-4", "fixture-effect-4", "fixture-effect-4", "fixture-effect-4"];
			expect(own(board({ hand: [card], graveyard: [LIGHT], monsters: full }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("bystial-magnamhut", "quick")} ${cites("bystial-magnamhut", "notes-summon-quick")} is a Quick Effect while the opponent controls a monster: it can be activated in the opponent's turn, and not otherwise`, () => {
			// In the opponent's turn, with a monster of theirs: offered when the player holds priority.
			const rivalTurn = (rival: SideSpec) => {
				const start = board({ hand: [card], graveyard: [LIGHT] }, rival, { everyWindow: true }, "rival");
				return start.priority.holder === "you" ? start : play(start, "pass");
			};
			expect(own(rivalTurn({ monsters: ["fixture-effect-4"] }), `activate ${card}`)).toEqual([`activate ${card} > ${LIGHT}`]);
			expect(own(rivalTurn({}), `activate ${card}`)).toEqual([]);
			// In the player's own turn it is offered once, whether the opponent controls a monster or not.
			expect(own(board({ hand: [card], graveyard: [LIGHT] }, { monsters: ["fixture-effect-4"] }), `activate ${card}`)).toEqual([`activate ${card} > ${LIGHT}`]);
		});
		it(`${cites("bystial-magnamhut", "notes-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = board({ hand: [card], graveyard: [LIGHT], monsters: ["fixture-effect-4"] }, { monsters: ["fixture-other-dragon"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-other-dragon > fixture-effect-4");
			expect(own(declared.priority.holder === "you" ? declared : play(declared, "pass"), `activate ${card}`)).toEqual([`activate ${card} > ${LIGHT}`]);
			const inStep = toStep(declared, "start");
			expect(own(inStep.priority.holder === "you" ? inStep : play(inStep, "pass"), `activate ${card}`)).toEqual([]);
		});
	});

	describe("its effect when Special Summoned", () => {
		it(`${cites("bystial-magnamhut", "add")} ${cites("bystial-magnamhut", "notes-add-end-phase")} lets the player activate it, and then in the End Phase of the turn it adds 1 Dragon monster from the Deck or GY, other than itself, to the hand, with no Chain Link`, () => {
			const done = summoned({ deck: ["fixture-blue-eyes-normal", "fixture-normal-4", card], graveyard: [LIGHT, "fixture-other-dragon"] });
			expect(own(done, `activate ${card}`)).toEqual([`activate ${card}`]);
			const activated = settle(play(done, `activate ${card}`));
			// Nothing is added now: it is done in the End Phase.
			expect(codes(activated, "you", "hand")).toEqual([]);
			const end = toPhase(activated, "end");
			const due = own(end.priority.holder === "you" ? end : play(end, "pass"), "apply");
			expect(due).toEqual([`apply ${card}`]);
			const choosing = play(end.priority.holder === "you" ? end : play(end, "pass"), `apply ${card}`);
			// Dragons of the Deck and the GY, not the card itself, not another kind of monster; no Chain Link.
			expect(choosing.chain).toEqual([]);
			expect(offered(choosing)).toEqual(["choose fixture-blue-eyes-normal", "choose fixture-other-dragon"]);
			const added = settle(play(choosing, "choose fixture-other-dragon"));
			expect(codes(added, "you", "hand")).toEqual(["fixture-other-dragon"]);
		});
		it(`${cites("bystial-magnamhut", "notes-add-no-dragon")} can be activated even when there is no Dragon monster in the Deck or GY, and then adds nothing`, () => {
			const done = summoned({ deck: ["fixture-normal-4"], graveyard: [LIGHT] });
			expect(own(done, `activate ${card}`)).toEqual([`activate ${card}`]);
			const end = toPhase(settle(play(done, `activate ${card}`)), "end");
			expect(own(end.priority.holder === "you" ? end : play(end, "pass"), "apply")).toEqual([]);
		});
		it(`${cites("bystial-magnamhut", "qa-lock-end-phase")} can be activated while cards cannot be added from the Deck to the hand, and then adds a Dragon from the GY only, the Deck's being out of reach when the End Phase effect is applied`, () => {
			const done = summoned({ deck: ["fixture-blue-eyes-normal"], graveyard: [LIGHT, "fixture-other-dragon"] });
			const locked = addModifier(done, { affects: () => true, until: done.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			expect(own(locked, `activate ${card}`)).toEqual([`activate ${card}`]);
			const end = toPhase(settle(play(locked, `activate ${card}`)), "end");
			const choosing = play(end.priority.holder === "you" ? end : play(end, "pass"), `apply ${card}`);
			// The Dragon of the GY is added; the one of the Deck is no choice (a single card: nothing is asked).
			const added = settle(choosing);
			expect(codes(added, "you", "hand")).toEqual(["fixture-other-dragon"]);
		});
		it(`${cites("bystial-magnamhut", "qa-ash-end-phase-add")} is an effect that includes an addition from the Deck to the hand though the add is done in the End Phase: Ash Blossom & Joyous Spring and Dominus Purge can be chained to its activation, even with no Dragon in the Deck`, () => {
			const answered = (rival: SideSpec, you: SideSpec = {}) => {
				const chained = play(summoned({ deck: ["fixture-normal-4"], ...you }, rival, { everyWindow: true }), `activate ${card}`);
				return chained.priority.holder === "rival" ? chained : play(chained, "pass");
			};
			expect(offered(answered({ hand: ["ash-blossom-joyous-spring"] }))).toContain("activate ash-blossom-joyous-spring");
			// Dominus Purge (a Set copy, or from the hand while the player controls a card) answers it on the text "adds a card(s) from the Deck to the hand".
			expect(offered(answered({ set: ["dominus-purge"] }))).toContain("activate dominus-purge");
			// Ash Blossom negates it: the End Phase effect is never owed.
			const negated = settle(play(answered({ hand: ["ash-blossom-joyous-spring"] }), "activate ash-blossom-joyous-spring"));
			const end = toPhase(negated, "end");
			expect(own(end.priority.holder === "you" ? end : play(end, "pass"), "apply")).toEqual([]);
		});
		it(`${cites("bystial-magnamhut", "add")} is offered only for a card that was Special Summoned, not for one on the field some other way`, () => {
			const start = board({ monsters: [card], deck: ["fixture-blue-eyes-normal"] });
			expect(own(start, `activate ${card}`)).toEqual([]);
		});
	});

	describe("once per turn", () => {
		it(`${cites("bystial-magnamhut", "once")} lets each effect be used once per turn, by name: the Special Summon is used once for every copy, and the End Phase effect is another use`, () => {
			const start = board({ hand: [card, card], graveyard: [LIGHT, DARK], deck: ["fixture-blue-eyes-normal"] });
			expect(own(start, `activate ${card}`)).toHaveLength(4);
			const done = summoned({ hand: [card, card], graveyard: [LIGHT, DARK] });
			// The second copy cannot Special Summon this turn (the effect was used), but the trigger of the one on the field is free.
			expect(own(done, `activate ${card}`)).toEqual([`activate ${card}`]);
			const activated = settle(play(done, `activate ${card}`));
			expect(own(activated, `activate ${card}`)).toEqual([]);
			expect(own(toMain(activated, 2), `activate ${card}`).length).toBeGreaterThan(0);
		});
	});
});
