import { describe, expect, it } from "vitest";
import { addModifier, cites, printedFacts } from "../../src";
import { codes, offered, play } from "../rules/fixtures";
import { activations, board, find, resolve, threeSpells } from "./sky-striker-fixtures";

const card = "sky-striker-mobilize-engage";
const activate = `activate ${card}`;

describe("Sky Striker Mobilize - Engage!, written as effect records", () => {
	it(`${cites("sky-striker-mobilize-engage", "facts")} is a Normal Spell, a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("spell");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Mobilize - Engage!", archetypes: ["Sky Striker"], mentions: ["Sky Striker Mobilize - Engage!"] });
	});

	it(`${cites("sky-striker-mobilize-engage", "condition")} can be activated only while the player controls no monster in the Main Monster Zone (a monster in an Extra Monster Zone does not stop it)`, () => {
		expect(activations(board({ hand: [card], deck: ["fixture-ss-spell"] }), card)).toEqual([activate]);
		expect(activations(board({ hand: [card], deck: ["fixture-ss-spell"], monsters: ["fixture-filler"] }), card)).toEqual([]);
		expect(activations(board({ hand: [card], deck: ["fixture-ss-spell"], facedown: ["fixture-filler"] }), card)).toEqual([]);
		expect(activations(board({ hand: [card], deck: ["fixture-ss-spell"], extraZone: ["fixture-filler"] }), card)).toEqual([activate]);
		// The opponent's monsters do not count.
		expect(activations(board({ hand: [card], deck: ["fixture-ss-spell"] }, { monsters: ["fixture-filler"] }), card)).toEqual([activate]);
	});

	it(`${cites("sky-striker-mobilize-engage", "search")} ${cites("sky-striker-mobilize-engage", "notes-search")} ${cites("rules", "search-needs-a-card")} adds 1 "Sky Striker" card of any kind other than itself from the Deck, chosen when the effect resolves; it cannot be activated with none to add`, () => {
		const start = board({ hand: [card], deck: ["fixture-ss-spell", "fixture-ss-monster", card, "fixture-other-spell", "fixture-trap"] });
		const asked = resolve(play(start, activate));
		// Not another copy of the card, not a card that is not a "Sky Striker" card; a monster is a card too.
		expect(offered(asked).sort()).toEqual(["choose fixture-ss-monster", "choose fixture-ss-spell"]);
		const done = play(asked, "choose fixture-ss-monster");
		expect(codes(done, "you", "hand")).toEqual(["fixture-ss-monster"]);
		expect(codes(done, "you", "graveyard")).toEqual([card]);
		expect(activations(board({ hand: [card], deck: [card, "fixture-other-spell"] }), card)).toEqual([]);
	});

	it(`${cites("sky-striker-mobilize-engage", "search")} ${cites("rules", "search-needs-a-card")} cannot be activated while cards cannot be added from the Deck to the hand`, () => {
		const locked = addModifier(board({ hand: [card], deck: ["fixture-ss-spell"] }), { affects: () => true, until: 3, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
		expect(activations(locked, card)).toEqual([]);
	});

	describe("the draw", () => {
		it(`${cites("sky-striker-mobilize-engage", "draw")} ${cites("sky-striker-mobilize-engage", "notes-sequential")} with 3 or more Spells in the Graveyard the player may draw 1 card after the add, which is done first; it is declined with pass`, () => {
			const start = board({ hand: [card], deck: ["fixture-ss-spell", "fixture-ss-monster", "fixture-trap"], graveyard: threeSpells });
			const asked = resolve(play(start, activate));
			const added = play(asked, "choose fixture-ss-spell");
			// The card is in the hand before the player decides to draw (the two parts are not simultaneous).
			expect(codes(added, "you", "hand")).toEqual(["fixture-ss-spell"]);
			expect(offered(added)).toContain(`choose ${card}`);
			const drawn = play(added, `choose ${card}`);
			expect(codes(drawn, "you", "hand")).toHaveLength(2);
			const declined = play(added, "pass");
			expect(codes(declined, "you", "hand")).toEqual(["fixture-ss-spell"]);
		});
		it(`${cites("sky-striker-mobilize-engage", "draw")} counts Spells of every kind and none that are Traps or monsters; the card itself is not in the Graveyard while it resolves`, () => {
			const twoSpells = board({ hand: [card], deck: ["fixture-ss-spell", "fixture-trap"], graveyard: ["fixture-other-spell", "fixture-quick-spell", "fixture-trap", "fixture-filler"] });
			const done = resolve(play(twoSpells, activate));
			expect(codes(done, "you", "hand")).toEqual(["fixture-ss-spell"]);
			expect(done.asking).toBeFalsy();
			expect(offered(done)).not.toContain(`choose ${card}`);
		});
		it(`${cites("sky-striker-mobilize-engage", "qa-last-card")} can be activated with only 1 card left in the Deck, a "Sky Striker" card, and then the draw is not offered (and the player does not lose)`, () => {
			const start = board({ hand: [card], deck: ["fixture-ss-spell"], graveyard: threeSpells });
			expect(activations(start, card)).toEqual([activate]);
			const done = resolve(play(start, activate));
			expect(codes(done, "you", "hand")).toEqual(["fixture-ss-spell"]);
			expect(codes(done, "you", "deck")).toEqual([]);
			expect(done.asking).toBeFalsy();
			expect(done.winner).toBeFalsy();
		});
		it(`${cites("sky-striker-mobilize-engage", "draw")} the draw is not offered while the player cannot draw by card effects`, () => {
			const locked = addModifier(board({ hand: [card], deck: ["fixture-ss-spell", "fixture-trap"], graveyard: threeSpells }), { affects: () => true, until: 3, layer: { kind: "lock", what: "draw", who: "you" } });
			const done = resolve(play(locked, activate));
			expect(done.asking).toBeFalsy();
			expect(codes(done, "you", "hand")).toEqual(["fixture-ss-spell"]);
		});
	});
});
