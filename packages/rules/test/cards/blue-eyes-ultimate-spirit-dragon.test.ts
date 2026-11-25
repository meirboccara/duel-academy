import { describe, expect, it } from "vitest";
import { atk, banishWhenItLeaves, CARD_DEFS, type CardDef, cites, type Duel, moveCard, printedFacts, specialSummon } from "../../src";
import { battleCards, toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesExtraFixtures, fixtureLog, settle } from "./blue-eyes-extra-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "blue-eyes-ultimate-spirit-dragon";
const gaps = gapCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...battleCards(),
	...blueEyesFixtures,
	...extraDeckFixtures,
	...blueEyesExtraFixtures,
	...Object.fromEntries(["fixture-crow", "fixture-smite", "fixture-giant"].map((code) => [code, gaps[code]!])),
};
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const effect = `activate ${card}`;
/** The dragon on the field in the rival's turn (they hold priority), with the cards the rival acts with. */
const theirTurn = (you: SideSpec = {}, rival: SideSpec = {}) => board({ monsters: [card], ...you }, rival, { everyWindow: true }, "rival");
const negates = (duel: Duel) => own(duel, effect);
const duelAtk = (duel: Duel) => atk(duel, find(duel, card).id);

describe("Blue-Eyes Ultimate Spirit Dragon, written as effect records", () => {
	it(`${cites("blue-eyes-ultimate-spirit-dragon", "facts")} is a LIGHT Dragon Synchro Effect Monster of Level 12 with 3500 ATK and 4000 DEF, that mentions itself`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Blue-Eyes Ultimate Spirit Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 12, atk: 3500, def: 4000, archetypes: ["Blue-Eyes"], mentions: ["Blue-Eyes Ultimate Spirit Dragon"] });
	});

	it(`${cites("blue-eyes-ultimate-spirit-dragon", "procedure")} is Synchro Summoned with 2 or more Tuners and 1 non-Tuner "Blue-Eyes" monster whose Levels add up to 12, sent to the Graveyard`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["fixture-tuner-2", "fixture-tuner-2", "fixture-blue-eyes-effect"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		// 2+ Tuners: three are fine.
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-tuner-1", "fixture-tuner-2", "blue-eyes-white-dragon"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		// One Tuner only, two non-Tuners, a non-Tuner that is not a "Blue-Eyes" monster, a total that is not 12.
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-blue-eyes-effect"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-2", "fixture-tuner-2", "fixture-blue-eyes-small", "fixture-blue-eyes-small"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-2", "fixture-tuner-2", "fixture-other-dragon"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-2", "fixture-tuner-3", "fixture-blue-eyes-effect"], extra: [card] }))).toEqual([]);
		const done = play(board({ monsters: ["fixture-tuner-2", "fixture-tuner-2", "fixture-blue-eyes-effect"], extra: [card] }), `special-summon ${card}`, "place 5");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-blue-eyes-effect", "fixture-tuner-2", "fixture-tuner-2"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
	});

	describe("its Continuous Effect", () => {
		const crows = (duel: Duel) => offered(duel).filter((label) => label.startsWith("activate fixture-crow"));
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "lock")} ${cites("blue-eyes-ultimate-spirit-dragon", "notes-lock-field")} the opponent cannot banish cards from its controller's Graveyard, while it is face-up in the Monster Zone`, () => {
			const you: SideSpec = { monsters: [card], graveyard: ["fixture-plain-1"] };
			// The opponent's banishment: their own Graveyard only.
			const rival = board(you, { set: ["fixture-crow"], graveyard: ["fixture-plain-2"] }, {}, "rival");
			expect(crows(rival)).toEqual(["activate fixture-crow > fixture-plain-2"]);
			// The controller's own banishment is not stopped, in either Graveyard.
			const mine = board({ ...you, set: ["fixture-crow"] }, { graveyard: ["fixture-plain-2"] });
			expect(crows(mine)).toEqual(["activate fixture-crow > fixture-plain-1", "activate fixture-crow > fixture-plain-2"]);
			// Not on the field (Extra Deck, face-down): nothing is stopped.
			const away = board({ extra: [card], facedown: [card], graveyard: ["fixture-plain-1"] }, { set: ["fixture-crow"] }, {}, "rival");
			expect(crows(away)).toEqual(["activate fixture-crow > fixture-plain-1"]);
		});
	});

	describe("its negation", () => {
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "negate")} ${cites("blue-eyes-ultimate-spirit-dragon", "notes-negate-quick")} negates the activation of a card or effect activated on the field, and if it does this card gains 1000 ATK until the end of the turn`, () => {
			fixtureLog.length = 0;
			const start = theirTurn({}, { monsters: ["fixture-field-quick-a"] });
			const activated = play(start, "activate fixture-field-quick-a");
			expect(negates(activated)).toEqual([effect]);
			const done = settle(play(activated, effect));
			expect(fixtureLog).toEqual([]);
			expect(duelAtk(done)).toBe(4500);
			// A Spell Card activated (a Normal Spell, from the hand: it is placed on the field).
			const spell = play(theirTurn({}, { hand: ["fixture-normal-spell"] }), "activate fixture-normal-spell");
			expect(negates(spell)).toEqual([effect]);
			expect(fixtureLog).toEqual([]);
			const negatedSpell = settle(play(spell, effect));
			expect(fixtureLog).toEqual([]);
			expect(codes(negatedSpell, "rival", "graveyard")).toEqual(["fixture-normal-spell"]);
			// The gain lasts to the end of the turn, then is gone.
			expect(duelAtk(negatedSpell)).toBe(4500);
			let next = negatedSpell;
			for (let guard = 0; guard < 60 && next.turn.number === 3; guard++) next = play(next, "pass");
			expect(next.turn.number).toBe(4);
			expect(duelAtk(next)).toBe(3500);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "qa-continuous-activation")} also answers the activation of a Continuous Spell, a card that does nothing when it is activated (Konami's Q&A fid 24092)`, () => {
			fixtureLog.length = 0;
			const activated = play(theirTurn({}, { hand: ["fixture-continuous-spell"] }), "activate fixture-continuous-spell");
			expect(negates(activated)).toEqual([effect]);
			const done = settle(play(activated, effect));
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-continuous-spell"]);
			expect(codes(done, "rival", "spell")).toEqual([]);
			expect(duelAtk(done)).toBe(4500);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "negate")} is not offered against an effect activated from the hand or in the Graveyard`, () => {
			expect(negates(play(theirTurn({}, { hand: ["fixture-hand-quick"] }), "activate fixture-hand-quick"))).toEqual([]);
			expect(negates(play(theirTurn({}, { graveyard: ["fixture-gy-ignition"] }), "activate fixture-gy-ignition"))).toEqual([]);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "notes-negate-resolution")} gains the ATK only if the activation was negated: with an activation that cannot be negated it gains nothing`, () => {
			fixtureLog.length = 0;
			const answered = play(play(theirTurn({}, { set: ["fixture-unstoppable"] }), "activate fixture-unstoppable"), effect);
			const done = settle(answered);
			expect(fixtureLog).toEqual(["unstoppable"]);
			expect(duelAtk(done)).toBe(3500);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "notes-atk-ends")} the gain stops when this card leaves the Monster Zone, is turned face-down, or has its effects negated`, () => {
			const gained = (): Duel => settle(play(play(theirTurn({}, { monsters: ["fixture-field-quick-a"], set: ["infinite-impermanence"] }), "activate fixture-field-quick-a"), effect));
			const base = gained();
			expect(duelAtk(base)).toBe(4500);
			// Its effects negated by Infinite Impermanence: the gain is gone (it is this card's own effect).
			const rivalActs = play(base, "activate infinite-impermanence > blue-eyes-ultimate-spirit-dragon", "pass", "pass");
			expect(duelAtk(rivalActs)).toBe(3500);
			// Turned face-down and face-up again: a new card, with no gain.
			const id = find(base, card).id;
			const flipped = moveCard(moveCard(base, id, { zone: "monster", face: "down" }), id, { zone: "monster", face: "up" });
			expect(duelAtk(flipped)).toBe(3500);
			// Left the Monster Zone and came back.
			const returned = moveCard(moveCard(base, id, { zone: "banished" }), id, { zone: "monster", face: "up" });
			expect(duelAtk(returned)).toBe(3500);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "once")} can be used once per turn`, () => {
			const start = theirTurn({}, { monsters: ["fixture-field-quick-a", "fixture-field-quick-b"] });
			const first = settle(play(play(start, "activate fixture-field-quick-a"), effect));
			const second = play(first, "activate fixture-field-quick-b");
			expect(negates(second)).toEqual([]);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "notes-negate-damage-step")} can also be activated in the Damage Step`, () => {
			fixtureLog.length = 0;
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: ["huge", card] }, rival: { monsters: ["big", "pump"] } });
			// The rival changes ATK with "pump" in the Damage Step; the dragon negates that activation.
			const rivalActs = play(toStep(play(start, "attack huge > big"), "start"), "pass");
			expect(rivalActs.battle?.step).toBe("start");
			expect(rivalActs.priority.holder).toBe("rival");
			const pumped = play(rivalActs, "activate pump");
			expect(pumped.chain.map((link) => link.card.code)).toEqual(["pump"]);
			expect(negates(pumped)).toEqual([effect]);
		});
	});

	describe("its Special Summon", () => {
		const graveyard = ["fixture-blue-eyes-effect", "fixture-light-dragon", "fixture-dark-blue-eyes-dragon", "fixture-light-warrior", "fixture-plain-3"];
		/** The dragon is destroyed by the rival's Quick-Play Spell "fixture-smite" in the rival's turn. */
		const destroyed = (you: SideSpec = {}, rival: SideSpec = {}) => play(play(theirTurn({ graveyard, ...you }, { hand: ["fixture-smite"], ...rival }), `activate fixture-smite > ${card}`), "pass", "pass");
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "special-summon")} ${cites("blue-eyes-ultimate-spirit-dragon", "notes-destroyed-trigger")} if it is destroyed by a card effect and sent to the Graveyard, Special Summons 1 LIGHT Dragon monster from the Graveyard`, () => {
			const duel = destroyed();
			expect(find(duel, card).zone).toBe("graveyard");
			expect(own(duel, effect)).toEqual([effect]);
			const asked = play(duel, effect, "pass", "pass");
			// A LIGHT Dragon monster only: not the DARK Dragon, not the LIGHT Warrior, not the Level 3 Warrior.
			expect(offered(asked)).toEqual(["choose fixture-blue-eyes-effect", "choose fixture-light-dragon"]);
			const done = settle(play(asked, "choose fixture-light-dragon"));
			expect(find(done, "fixture-light-dragon")).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "special-summon")} is not activated with no LIGHT Dragon monster in the Graveyard, and never Summons "Blue-Eyes Ultimate Spirit Dragon" itself`, () => {
			expect(own(destroyed({ graveyard: ["fixture-dark-blue-eyes-dragon", "fixture-light-warrior"] }), effect)).toEqual([]);
			// A second copy, properly Summoned and sent to the Graveyard, is a LIGHT Dragon monster with the same name: left out.
			const start = theirTurn({ graveyard: [], extra: [card] }, { hand: ["fixture-smite"] });
			const second = find(start, card);
			const other = Object.values(start.cards).filter((entry) => entry.code === card);
			expect(other).toHaveLength(2);
			const spare = other.find((entry) => entry.zone === "extra")!;
			const properly = moveCard(specialSummon(start, "you", spare.id, { kind: "synchro", slot: 5 }), spare.id, { zone: "graveyard" });
			expect(properly.cards[spare.id]).toMatchObject({ zone: "graveyard", proper: true });
			const done = play(play(properly, `activate fixture-smite > ${card}`), "pass", "pass");
			expect(find(done, card).id).toBe(second.id);
			expect(own(done, effect)).toEqual([]);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "notes-destroyed-trigger")} ${cites("blue-eyes-ultimate-spirit-dragon", "notes-destroyed-damage-step")} also triggers when it is destroyed by battle (also in the Damage Step), and while it is banished face-up`, () => {
			const battle = (prepare: (duel: Duel) => Duel = (duel) => duel): Duel => {
				const start = prepare(position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: [card], graveyard }, rival: { monsters: ["fixture-giant"] } }));
				return toStep(play(start, `attack ${card} > fixture-giant`), "end");
			};
			const inStep = battle();
			expect(inStep.battle?.step).toBe("end");
			expect(find(inStep, card).zone).toBe("graveyard");
			expect(own(inStep, effect)).toEqual([effect]);
			const banished = battle((duel) => banishWhenItLeaves(duel, find(duel, card).id));
			expect(find(banished, card)).toMatchObject({ zone: "banished", face: "up" });
			expect(own(banished, effect)).toEqual([effect]);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "special-summon")} is not triggered when it is sent to the Graveyard without being destroyed`, () => {
			const start = theirTurn({ graveyard });
			const sent = moveCard(start, find(start, card).id, { zone: "graveyard" });
			expect(own(sent, effect)).toEqual([]);
		});
		it(`${cites("blue-eyes-ultimate-spirit-dragon", "once")} can be used once per turn: a second copy destroyed in the same turn does not Special Summon`, () => {
			const start = theirTurn({ graveyard, monsters: [card, card] }, { hand: ["fixture-smite"], set: ["fixture-smite"] });
			const [a, b] = Object.values(start.cards).filter((entry) => entry.code === card && entry.zone === "monster");
			const first = settle(play(play(play(start, `activate fixture-smite > ${card}`), "pass", "pass"), effect));
			expect(first.cards[a!.id]!.zone === "graveyard" || first.cards[b!.id]!.zone === "graveyard").toBe(true);
			expect(codes(first, "you", "monster").filter((code) => code !== card)).toHaveLength(1);
			// The second copy is destroyed too: nothing is offered.
			const second = play(first, `activate fixture-smite > ${card}`, "pass", "pass");
			expect(codes(second, "you", "graveyard").filter((code) => code === card)).toHaveLength(2);
			expect(own(second, effect)).toEqual([]);
		});
	});
});
