import { describe, expect, it } from "vitest";
import { addModifier, atk, CARD_DEFS, type CardDef, cites, type Duel, specialSummon, printedFacts } from "../../src";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { primiteFixtures } from "./primite-fixtures";

const card = "primite-lordly-lode";
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...blueEyesFixtures, ...primiteFixtures };
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
const N4 = "Fixture Normal 4";

describe("Primite Lordly Lode, written as effect records", () => {
	it(`${cites("primite-lordly-lode", "facts")} is a Continuous Spell, a "Primite" card`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Primite Lordly Lode", archetypes: ["Primite"], mentions: ["Primite Lordly Lode"] });
		expect(duel.defs[card]!.kind).toBe("spell");
	});

	describe("when it is activated", () => {
		it(`${cites("primite-lordly-lode", "search")} ${cites("primite-lordly-lode", "notes-search-applies")} ${cites("rules", "search-needs-a-card")} adds 1 "Primite" card other than itself from the Deck to the hand, chosen as the effect resolves, and cannot be activated with none to add`, () => {
			const start = board({ hand: [card], deck: ["fixture-primite-spell", "fixture-primite-normal", card, "fixture-plain-spell"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const asked = play(start, `activate ${card}`);
			// Not another copy of the card, not a card that is not a "Primite" card.
			expect(offered(asked).sort()).toEqual(["choose fixture-primite-normal", "choose fixture-primite-spell"]);
			const done = play(asked, "choose fixture-primite-spell");
			expect(codes(done, "you", "hand")).toEqual(["fixture-primite-spell"]);
			expect(find(done, card)).toMatchObject({ zone: "spell", face: "up" });
			// Another copy of itself, or a card of another name, is not a card it can add: not activated at all.
			expect(own(board({ hand: [card], deck: [card, "fixture-plain-spell"] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ set: [card], deck: [] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-lordly-lode", "search")} ${cites("primite-lordly-lode", "qa-lock-activate")} is not activated while cards cannot be added from the Deck to the hand (the card must add one when it resolves)`, () => {
			const locked = addModifier(board({ hand: [card], deck: ["fixture-primite-spell"] }), { affects: () => true, until: 3, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			expect(own(locked, `activate ${card}`)).toEqual([]);
		});
	});

	describe("its effect that Special Summons", () => {
		it(`${cites("primite-lordly-lode", "summon")} ${cites("primite-lordly-lode", "notes-declare")} declares the name of a Normal Monster in the hand, Deck or GY and Special Summons 1 of that name from there in Defense Position`, () => {
			const start = board({ faceupSpells: [card], hand: ["fixture-normal-4", "fixture-effect-4"], deck: ["fixture-normal-6"], graveyard: ["fixture-other-dragon", "fixture-light-tuner"] });
			// The names of the Normal Monsters of the hand, the Deck and the GY: an Effect Monster is not a choice.
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card} =Fixture Normal 4`, `activate ${card} =Fixture Normal 6`, `activate ${card} =Fixture Other Dragon`]);
			for (const [name, code] of [[N4, "fixture-normal-4"], ["Fixture Normal 6", "fixture-normal-6"], ["Fixture Other Dragon", "fixture-other-dragon"]] as const) {
				const done = play(start, `activate ${card} =${name}`, "place 0");
				expect(codes(done, "you", "monster")).toEqual([code]);
				expect(find(done, code)).toMatchObject({ zone: "monster", face: "up", position: "defense", specialSummoned: true });
			}
			// Nothing declared that is not there: no Normal Monster, no activation.
			expect(own(board({ faceupSpells: [card], hand: ["fixture-effect-4"] }), `activate ${card}`)).toEqual([]);
			// The effect is of the face-up card: not offered in the opponent's turn.
			expect(own(board({ faceupSpells: [card], hand: ["fixture-normal-4"] }, {}, {}, "rival"), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-lordly-lode", "qa-declare-names")} cannot declare the name of a Ritual, Fusion, Synchro, Xyz or Link Monster that has no effect, nor of any monster that is not a Normal Monster`, () => {
			const start = board({ faceupSpells: [card], hand: ["fixture-normal-4", "fixture-ritual-vanilla", "fixture-effect-4"], deck: ["fixture-primite-4"], graveyard: ["fixture-light-tuner"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card} =${N4}`]);
		});
		it(`${cites("primite-lordly-lode", "summon")} Summons the copy the player chooses when there are several of the declared name, with no free zone no Summon is offered`, () => {
			const start = board({ faceupSpells: [card], hand: ["fixture-normal-4"], graveyard: ["fixture-normal-4"] });
			const asked = play(start, `activate ${card} =${N4}`);
			expect(offered(asked)).toEqual(["choose fixture-normal-4", "choose fixture-normal-4"]);
			const full = ["fixture-effect-4", "fixture-effect-4", "fixture-effect-4", "fixture-effect-4", "fixture-effect-4"];
			expect(own(board({ faceupSpells: [card], hand: ["fixture-normal-4"], monsters: full }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-lordly-lode", "lock")} stops the effects of Special Summoned monsters on the field for the rest of the turn, and not those of other monsters, Spells or Traps`, () => {
			const start = board({ faceupSpells: [card], hand: ["fixture-normal-4", "fixture-ignition-monster", "fixture-spell-breaker"], monsters: ["fixture-ignition-monster"] });
			// A made-up monster Special Summoned from the hand: its Ignition Effect is open before the lock and shut after it.
			const summoned = specialSummon(start, "you", start.piles.you.hand[1]!);
			expect(own(summoned, "activate fixture-ignition-monster")).toHaveLength(2);
			const locked = play(summoned, `activate ${card} =${N4}`, "pass", "place 2", "pass");
			// The monster that was placed on the field without a Summon stays free; the Special Summoned one is stopped.
			expect(own(locked, "activate fixture-ignition-monster")).toEqual(["activate fixture-ignition-monster"]);
			expect(own(locked, "activate fixture-spell-breaker")).toContain(`activate fixture-spell-breaker > ${card}`);
			// It ends with the turn.
			expect(own(toMain(locked, 2), "activate fixture-ignition-monster")).toHaveLength(2);
		});
		it(`${cites("primite-lordly-lode", "notes-lock-already")} can be activated in a turn when the effect of a Special Summoned monster has already been activated`, () => {
			const summoned = (() => {
				const start = board({ faceupSpells: [card], hand: ["fixture-normal-4", "fixture-ignition-monster"] });
				const one = specialSummon(start, "you", start.piles.you.hand[1]!);
				return play(one, "activate fixture-ignition-monster");
			})();
			expect(own(summoned, `activate ${card}`)).toEqual([`activate ${card} =${N4}`]);
		});
		it(`${cites("primite-lordly-lode", "notes-lock-needs-card")} does nothing when the card has left the field when its effect resolves: no Summon, and no lock`, () => {
			const start = board({ faceupSpells: [card], hand: ["fixture-normal-4", "fixture-ignition-monster"] }, { set: ["fixture-spell-breaker"] }, { everyWindow: true });
			const one = specialSummon(start, "you", start.piles.you.hand[1]!);
			const chained = play(one, `activate ${card} =${N4}`);
			// The opponent answers by destroying the card: its effect resolves with the card gone.
			const answered = play(chained, "activate fixture-spell-breaker > primite-lordly-lode", "pass", "pass", "pass", "pass");
			expect(codes(answered, "you", "monster")).toEqual(["fixture-ignition-monster"]);
			expect(codes(answered, "you", "graveyard")).toEqual([card]);
			expect(own(answered, "activate fixture-ignition-monster")).toEqual(["activate fixture-ignition-monster"]);
		});
	});

	describe("its continuous effect", () => {
		it(`${cites("primite-lordly-lode", "atk")} ${cites("primite-lordly-lode", "notes-continuous-atk")} gives the Normal Monsters and "Primite" monsters you control 300 ATK for each Normal Monster with a different name in your GY`, () => {
			const start = board({ faceupSpells: [card], monsters: ["fixture-normal-4", "fixture-primite-5", "fixture-effect-4", "fixture-ignition-monster"], graveyard: ["fixture-normal-6", "fixture-other-dragon", "fixture-normal-6", "fixture-effect-4"] }, { monsters: ["fixture-normal-4"] });
			const id = (code: string, side: "you" | "rival" = "you") => start.piles[side].monster.find((entry) => start.cards[entry]!.code === code)!;
			// Two names (the second copy of Fixture Normal 6 counts once, the Effect Monster not at all): +600.
			expect(atk(start, id("fixture-normal-4"))).toBe(1000 + 600);
			expect(atk(start, id("fixture-primite-5"))).toBe(2000 + 600);
			// Neither a Normal Monster nor a "Primite" monster, and the opponent's Normal Monster: not reached.
			expect(atk(start, id("fixture-effect-4"))).toBe(1000);
			expect(atk(start, id("fixture-ignition-monster"))).toBe(1000);
			expect(atk(start, id("fixture-normal-4", "rival"))).toBe(1000);
			// No Normal Monster in the GY: nothing to gain. Set, the card applies nothing.
			const empty = board({ faceupSpells: [card], monsters: ["fixture-normal-4"] });
			expect(atk(empty, empty.piles.you.monster[0]!)).toBe(1000);
			const set = board({ set: [card], monsters: ["fixture-normal-4"], graveyard: ["fixture-normal-6"] });
			expect(atk(set, set.piles.you.monster[0]!)).toBe(1000);
		});
	});

	describe("once per turn", () => {
		it(`${cites("primite-lordly-lode", "once")} lets each effect be used once per turn, by name: a second copy shares the use, and the two effects do not share one`, () => {
			const start = board({ hand: [card, card], faceupSpells: [], deck: ["fixture-primite-spell", "fixture-primite-spell"], graveyard: ["fixture-normal-4"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`, `activate ${card}`]);
			const searched = play(start, `activate ${card}`, "choose fixture-primite-spell");
			// The other copy cannot add a card this turn, but the face-up one has its other effect.
			expect(own(reopen(searched), `activate ${card}`)).toEqual([`activate ${card} =${N4}`]);
			const summoned = play(searched, `activate ${card} =${N4}`, "place 0");
			expect(codes(summoned, "you", "monster")).toEqual(["fixture-normal-4"]);
			// Both effects are spent for the turn, for every copy; two turns later they are back.
			expect(own(reopen(summoned), `activate ${card}`)).toEqual([]);
			expect(own(toMain(summoned, 2), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
	});
});
