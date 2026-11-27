import { describe, expect, it } from "vitest";
import { addModifier, atk, canSpecialSummon, cites, type Duel, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, lastingLines, offered, play } from "../rules/fixtures";
import { activations, board, find, resolve } from "./sky-striker-fixtures";

const card = "sky-striker-mobilize-linkage";
const activate = `activate ${card}`;
/** The activation, and the Ace and zone the player chooses: the Ace first (when 2 can be chosen), then Extra Monster Zone 5. */
const through = (duel: Duel, ...choices: string[]): Duel => play(resolve(play(duel, activate)), ...choices);

describe("Sky Striker Mobilize - Linkage!, written as effect records", () => {
	it(`${cites("sky-striker-mobilize-linkage", "facts")} is a Quick-Play Spell, a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Mobilize - Linkage!", archetypes: ["Sky Striker"], mentions: ["Sky Striker Mobilize - Linkage!"] });
	});

	describe("its activation", () => {
		const start = { hand: [card], set: ["fixture-trap"], extra: ["fixture-ace-light"] };
		it(`${cites("sky-striker-mobilize-linkage", "condition")} needs no monster of the player in a Main Monster Zone`, () => {
			expect(activations(board(start), card)).toEqual([activate]);
			expect(activations(board({ ...start, monsters: ["fixture-filler"] }), card)).toEqual([]);
			expect(activations(board({ ...start, facedown: ["fixture-filler"] }), card)).toEqual([]);
			// The opponent's monsters do not count.
			expect(activations(board(start, { monsters: ["fixture-filler"] }), card)).toEqual([activate]);
		});
		it(`${cites("sky-striker-mobilize-linkage", "notes-emz-monster")} a monster in an Extra Monster Zone does not stop it`, () => {
			expect(activations(board({ ...start, extraZone: ["fixture-link"] }), card)).toEqual([activate]);
		});
		it("cannot be activated with no other card to send, or with no Ace of the Extra Deck to Special Summon (YGOProJudge only: chat of 2026-11-26, no Konami page cited for the activation)", () => {
			expect(activations(board({ hand: [card], extra: ["fixture-ace-light"] }), card)).toEqual([]);
			expect(activations(board({ hand: [card], set: ["fixture-trap"], extra: ["fixture-link"] }), card)).toEqual([]);
			expect(activations(board({ hand: [card], set: ["fixture-trap"] }), card)).toEqual([]);
		});
		it(`${cites("sky-striker-mobilize-linkage", "notes-no-damage-step")} is not activated in the Damage Step, but is in the Battle Step before it`, () => {
			const rival = board({ set: [card, "fixture-trap"], extra: ["fixture-ace-light"] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle");
			const declared = play(rival, "attack fixture-filler directly");
			expect(activations(play(declared, "pass"), card)).toEqual([activate]);
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			expect(activations(mine, card)).toEqual([]);
		});
		it(`${cites("sky-striker-mobilize-linkage", "send-summon")} sends nothing when activated: the opponent answers first, and an opponent who can only pass is passed for at once (no every-window option)`, () => {
			const start = { hand: [card], extraZone: ["fixture-link"], extra: ["fixture-ace-light"] };
			// The opponent holds Effect Veiler (a Quick Effect from the hand): they get priority, the Link Monster still on the field.
			const answered = play(board(start, { hand: ["effect-veiler"] }, { everyWindow: false }), activate);
			expect(answered.priority.holder).toBe("rival");
			expect(answered.asking).toBeNull();
			expect(answered.chain.map((link) => link.card.code)).toEqual([card]);
			expect(find(answered, "fixture-link")).toMatchObject({ zone: "monster", slot: 5 });
			expect(offered(answered)).toContain("activate effect-veiler > fixture-link");
			// The opponent holds nothing to answer with: their pass is made for them, and the card is sent only as Linkage resolves.
			const passed = play(board(start, { hand: ["fixture-filler"] }, { everyWindow: false }), activate);
			expect(passed.priority.passed).toEqual(["rival"]);
			expect(find(passed, "fixture-link").zone).toBe("graveyard");
			expect(offered(passed)).toEqual(["place 5", "place 6"]);
		});
	});

	describe("when it resolves", () => {
		it(`${cites("sky-striker-mobilize-linkage", "send-summon")} sends 1 other card the player controls to the GY (not itself), then Special Summons 1 Ace of the Extra Deck to an Extra Monster Zone, with no Summon procedure`, () => {
			const start = board({ hand: [card], set: ["fixture-trap"], faceupSpells: ["fixture-ss-spell"], extra: ["fixture-ace-light", "fixture-ace-dark"] });
			const asked = resolve(play(start, activate));
			expect(offered(asked).sort()).toEqual(["choose fixture-ss-spell", "choose fixture-trap"]);
			const aces = play(asked, "choose fixture-trap");
			expect(find(aces, "fixture-trap").zone).toBe("graveyard");
			expect(offered(aces).sort()).toEqual(["choose fixture-ace-dark", "choose fixture-ace-light"]);
			const zones = play(aces, "choose fixture-ace-dark");
			expect(offered(zones)).toEqual(["place 5", "place 6"]);
			const done = play(zones, "place 5");
			expect(find(done, "fixture-ace-dark")).toMatchObject({ zone: "monster", face: "up", slot: 5, controller: "you", proper: false });
			expect(find(done, "fixture-ss-spell").zone).toBe("spell");
			// Chain Link 1 resolved: the Spell itself goes to the GY afterwards.
			expect(find(done, card).zone).toBe("graveyard");
		});
		it(`${cites("sky-striker-mobilize-linkage", "notes-only-emz-monster")} with a monster in an Extra Monster Zone, only that monster can be sent`, () => {
			const start = board({ hand: [card], set: ["fixture-trap"], extraZone: ["fixture-link"], extra: ["fixture-ace-light"] });
			const done = play(resolve(play(start, activate)), "place 5");
			expect(find(done, "fixture-link").zone).toBe("graveyard");
			expect(find(done, "fixture-trap").zone).toBe("spell");
			expect(find(done, "fixture-ace-light")).toMatchObject({ zone: "monster", slot: 5 });
		});

		it(`${cites("sky-striker-mobilize-linkage", "lock")} afterwards the player cannot Special Summon from the Extra Deck, except "Sky Striker Ace" monsters (cards of the hand, the Deck and the GY are not stopped)`, () => {
			const start = board({ hand: [card, "fixture-filler"], set: ["fixture-trap"], extra: ["fixture-ace-light", "fixture-ace-dark", "fixture-link"] });
			const done = through(start, "choose fixture-ace-light", "place 5");
			const extra = (code: string) => done.piles.you.extra.find((id) => done.cards[id]!.code === code)!;
			expect(canSpecialSummon(done, "you", extra("fixture-ace-dark"))).toBe(true);
			expect(canSpecialSummon(done, "you", extra("fixture-link"))).toBe(false);
			expect(canSpecialSummon(done, "you", find(done, "fixture-filler").id)).toBe(true);
			expect(lastingLines(done).join("\n")).toContain('you cannot Special Summon from the Extra Deck, except "Sky Striker Ace" monsters');
			expect(canSpecialSummon(addModifier(start, { affects: () => false, until: 3, layer: { kind: "lock", what: "summon", who: "you", ways: ["special"], only: () => false } }), "you", start.piles.you.extra.at(-1)!)).toBe(true);
		});
		it(`${cites("sky-striker-mobilize-linkage", "notes-lock-regardless")} ${cites("sky-striker-mobilize-linkage", "qa-redirect")} the card sent goes elsewhere (cards sent to the GY are banished instead): nothing is Summoned, but the restriction still applies`, () => {
			const start = board({ hand: [card], extraZone: ["fixture-link"], extra: ["fixture-ace-light", "fixture-ace-dark"] });
			const replaced = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
			const done = resolve(play(replaced, activate));
			expect(find(done, "fixture-link").zone).toBe("banished");
			expect(codes(done, "you", "monster")).toEqual([]);
			expect(done.asking).toBeFalsy();
			expect(find(done, card).zone).toBe("banished");
			const extra = (code: string) => done.piles.you.extra.find((id) => done.cards[id]!.code === code)!;
			expect(canSpecialSummon(done, "you", extra("fixture-ace-light"))).toBe(true);
			expect(canSpecialSummon(done, "you", extra("fixture-ace-dark"))).toBe(true);
		});

		describe("the 1000 ATK", () => {
			it(`${cites("sky-striker-mobilize-linkage", "atk")} ${cites("sky-striker-mobilize-linkage", "notes-atk-at-summon")} is gained when a LIGHT and a DARK Ace are on the field and/or in the GY once the Summon is done: the one Summoned counts, and so do the cards sent`, () => {
				// The Ace Summoned is the LIGHT one; the DARK one is in the Graveyard.
				const inGraveyard = board({ hand: [card], set: ["fixture-trap"], graveyard: ["fixture-ace-dark"], extra: ["fixture-ace-light"] });
				const done = through(inGraveyard, "place 5");
				expect(atk(done, find(done, "fixture-ace-light").id)).toBe(2500);
				// The DARK Ace on the field is the card sent; the LIGHT one is Summoned: both are there when the Summon is done.
				const sent = board({ hand: [card], extraZone: ["fixture-ace-dark"], extra: ["fixture-ace-light"] });
				const sentDone = through(sent, "place 5");
				expect(atk(sentDone, find(sentDone, "fixture-ace-light").id)).toBe(2500);
			});
			it(`${cites("sky-striker-mobilize-linkage", "atk")} is not gained without both Attributes, nor for an Ace of another Attribute alone, nor for a card that is not an Ace`, () => {
				const light = board({ hand: [card], set: ["fixture-trap"], graveyard: ["fixture-ace-fire", "fixture-link"], extra: ["fixture-ace-light"] });
				const done = through(light, "place 5");
				expect(atk(done, find(done, "fixture-ace-light").id)).toBe(1500);
			});
		});
	});
});
