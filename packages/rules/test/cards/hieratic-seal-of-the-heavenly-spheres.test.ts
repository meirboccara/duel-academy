import { describe, expect, it } from "vitest";
import { atk, banishWhenItLeaves, CARD_DEFS, type CardDef, cites, def as defOf, type Duel, moveCard, moveCards, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "hieratic-seal-of-the-heavenly-spheres";
const gaps = gapCards();
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...extraDeckFixtures,
	...Object.fromEntries(["fixture-crow", "fixture-giant"].map((code) => [code, gaps[code]!])),
	// A Quick-Play Spell that does nothing (it stays on the field during the Chain it is in).
	"fixture-noop-quick": { code: "fixture-noop-quick", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => duel }] },
	// A Continuous Spell that does nothing.
	"fixture-continuous": { code: "fixture-continuous", kind: "spell", effects: [{ type: "activation", stays: true, operation: (duel) => duel }] },
	// A Quick-Play Spell that changes ATK (so it can be activated in the Damage Step), its cost being the Tribute of 1 monster the player controls.
	"fixture-tribute-pump": {
		code: "fixture-tribute-pump",
		kind: "quick-play",
		effects: [{ type: "activation", categories: ["change-atk"], cost: { pick: (duel, { player }) => duel.piles[player].monster.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard", reason: "tributed" }) }, operation: (duel) => duel }],
	},
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
/**
 * Extra Deck monsters on the field come from their Extra Deck (a Link, Synchro or Fusion Monster that leaves the field for the hand goes back to
 * the Extra Deck, face-down): the cards of `monsters` and `extraZone` that have a frame are created in the Extra Deck, then placed face-up.
 */
const board = (youSpec: SideSpec, rivalSpec: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => {
	const moved: { side: "you" | "rival"; code: string; slot?: number }[] = [];
	const split = (side: "you" | "rival", spec: SideSpec): SideSpec => {
		const out: SideSpec = { ...spec };
		for (const key of ["monsters", "extraZone"] as const) {
			out[key] = (spec[key] ?? []).filter((code) => {
				if (defs[code]?.facts?.frame === undefined) return true;
				out.extra = [...(out.extra ?? []), code];
				moved.push({ side, code, ...(key === "extraZone" ? { slot: side === "you" ? 5 : 6 } : {}) });
				return false;
			});
		}
		return out;
	};
	let duel = position({ defs, options, you: split("you", youSpec), rival: split("rival", rivalSpec), turn });
	for (const entry of moved) {
		const id = duel.piles[entry.side].extra.find((candidate) => duel.cards[candidate]!.code === entry.code)!;
		duel = moveCard(duel, id, { zone: "monster", face: "up", ...(entry.slot === undefined ? {} : { slot: entry.slot }) });
	}
	return duel;
};
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const mine = (duel: Duel): Duel => (duel.priority.holder === "you" ? duel : play(duel, "pass"));
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
const effect = `activate ${card}`;
/** The opponent's turn, Hieratic Seal in the player's Extra Monster Zone: the player has priority (the opponent passes first). */
const rivalTurn = (you: SideSpec, rival: SideSpec = {}, options = { everyWindow: true }) => mine(board({ extraZone: [card], ...you }, rival, options, "rival"));

describe("Hieratic Seal of the Heavenly Spheres, written as effect records", () => {
	it(`${cites("ash-blossom-joyous-spring", "text")} answers the Tributed effect, which includes a Summon from the Deck even when only a Dragon in the hand can be chosen (YGOProJudge lead for the hand-only case)`, () => {
		const start = rivalTurn({ hand: ["fixture-dragon-4"], monsters: ["fixture-plain-2"] }, { hand: ["ash-blossom-joyous-spring"] });
		// The first chain Tributes the Seal and returns the other monster; its mandatory GY trigger then starts a new chain.
		const tributed = play(start, `${effect} ~ ${card}`, "pass", "pass");
		const chained = tributed.priority.holder === "rival" ? tributed : play(tributed, "pass");
		expect(offered(chained)).toContain("activate ash-blossom-joyous-spring");
		const stopped = play(chained, "activate ash-blossom-joyous-spring", "pass", "pass");
		expect(codes(stopped, "you", "monster")).toEqual([]);
		expect(codes(stopped, "you", "hand")).toEqual(["fixture-dragon-4", "fixture-plain-2"]);
	});
	it(`${cites("hieratic-seal-of-the-heavenly-spheres", "facts")} is a LIGHT Dragon Link Effect Monster, Link 2 with its arrows at the bottom left and bottom right, 0 ATK and no DEF, that mentions itself`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({
			name: "Hieratic Seal of the Heavenly Spheres",
			attribute: "LIGHT",
			monsterType: "Dragon",
			frame: "link",
			link: 2,
			arrows: ["bottom-left", "bottom-right"],
			atk: 0,
			mentions: ["Hieratic Seal of the Heavenly Spheres"],
		});
	});

	describe("its Link Summon", () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "procedure")} needs 2 Dragon monsters, sent to the Graveyard, and is Link Summoned face-up`, () => {
			const start = board({ monsters: ["fixture-dragon-4", "fixture-dragon-5"], extra: [card] });
			expect(summons(start)).toEqual([`special-summon ${card}`]);
			const done = play(start, `special-summon ${card}`, "place 5");
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-dragon-4", "fixture-dragon-5"]);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "link" });
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "procedure")} is not offered with only one Dragon monster, or with a monster that is not a Dragon`, () => {
			expect(summons(board({ monsters: ["fixture-dragon-4"], extra: [card] }))).toEqual([]);
			expect(summons(board({ monsters: ["fixture-dragon-4", "fixture-warrior-4"], extra: [card] }))).toEqual([]);
		});
	});

	describe("its Quick Effect", () => {
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "return")} ${cites("hieratic-seal-of-the-heavenly-spheres", "notes-quick-field")} ${cites("hieratic-seal-of-the-heavenly-spheres", "notes-chosen")} Tributes 1 monster from the hand as the cost, and when it resolves returns 1 face-up card on the field of the player's choice to the hand`, () => {
			const start = rivalTurn({ hand: ["fixture-plain-1"], monsters: ["fixture-plain-2"] }, { monsters: ["fixture-plain-3"], faceupSpells: ["fixture-continuous"] });
			expect(own(start, effect)).toEqual([`${effect} ~ fixture-plain-1`, `${effect} ~ fixture-plain-2`, `${effect} ~ ${card}`].sort());
			const chained = play(start, `${effect} ~ fixture-plain-1`);
			// The cost is paid, and nothing is targeted: the card is chosen when the effect resolves.
			expect(codes(chained, "you", "graveyard")).toEqual(["fixture-plain-1"]);
			expect(chained.chain[0]!.targets).toEqual([]);
			const asked = play(chained, "pass", "pass");
			// Every face-up card on the field, either side, monsters and Spells.
			expect(offered(asked)).toEqual([`choose ${card}`, "choose fixture-continuous", "choose fixture-plain-2", "choose fixture-plain-3"].sort());
			const done = play(asked, "choose fixture-plain-3");
			expect(codes(done, "rival", "hand")).toEqual(["fixture-plain-3"]);
			expect(codes(done, "rival", "monster")).toEqual([]);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "notes-cost")} can Tribute a monster of the field of any position, face-down ones included, or the card itself, as the cost`, () => {
			const start = rivalTurn({ facedown: ["fixture-plain-2"], monsters: ["fixture-plain-4"] });
			expect(own(start, effect)).toEqual([`${effect} ~ fixture-plain-2`, `${effect} ~ fixture-plain-4`, `${effect} ~ ${card}`].sort());
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "notes-extra-deck")} returns a Fusion, Synchro, Xyz or Link Monster to the Extra Deck of its owner, face-down`, () => {
			const start = rivalTurn({ hand: ["fixture-plain-1"] }, { monsters: ["fixture-synchro-dragon-7"] });
			const asked = play(start, `${effect} ~ fixture-plain-1`, "pass", "pass");
			const done = play(asked, "choose fixture-synchro-dragon-7");
			expect(find(done, "fixture-synchro-dragon-7")).toMatchObject({ zone: "extra", face: "down", controller: "rival" });
			expect(codes(done, "rival", "hand")).toEqual([]);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "return")} ${cites("hieratic-seal-of-the-heavenly-spheres", "once-opponent-turn")} can be used only in the opponent's turn, once per turn by each copy (YGOProJudge's answer for the scope, asked 2026-11-24, no source cited)`, () => {
			const duel = board({ extraZone: [card], hand: ["fixture-plain-1", "fixture-plain-2"] }, {}, { everyWindow: true });
			// Not in the player's own turn.
			expect(own(duel, effect)).toEqual([]);
			const start = rivalTurn({ hand: ["fixture-plain-1", "fixture-plain-2"] });
			const done = settle(play(start, `${effect} ~ fixture-plain-1`, "pass"));
			expect(own(done.priority.holder === "you" ? done : play(done, "pass"), effect)).toEqual([]);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "return")} needs the card to be in an Extra Monster Zone: it is not offered in a Main Monster Zone`, () => {
			const start = mine(board({ monsters: [card], hand: ["fixture-plain-1"] }, {}, { everyWindow: true }, "rival"));
			expect(own(start, effect)).toEqual([]);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "qa-only-itself")} cannot Tribute itself when it is the only face-up card on the field, but a monster from the hand can be Tributed, and it is then the card returned`, () => {
			const alone = rivalTurn({ hand: ["fixture-plain-1"] });
			// Itself as the cost would leave no face-up card to return.
			expect(own(alone, effect)).toEqual([`${effect} ~ fixture-plain-1`]);
			// It is the only face-up card: nothing to choose, it is the card returned (to the Extra Deck, face-down).
			const done = play(alone, `${effect} ~ fixture-plain-1`, "pass", "pass");
			expect(find(done, card)).toMatchObject({ zone: "extra", face: "down" });
			// With another face-up card on the field it may be Tributed.
			const other = rivalTurn({}, { monsters: ["fixture-plain-3"] });
			expect(own(other, effect)).toEqual([`${effect} ~ ${card}`]);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "qa-quick-play-chain")} cannot return a Quick-Play Spell activated in the Chain that is still on the field, and must return itself when that and itself are the only face-up cards`, () => {
			const start = board({ extraZone: [card], hand: ["fixture-plain-1"] }, { set: ["fixture-noop-quick"] }, { everyWindow: true }, "rival");
			const aimed = play(start, "activate fixture-noop-quick");
			// Hieratic Seal is Chain Link 2 and resolves first: the Spell is on the field, and cannot be chosen.
			const done = play(aimed, `${effect} ~ fixture-plain-1`, "pass", "pass");
			expect(find(done, card)).toMatchObject({ zone: "extra", face: "down" });
			expect(find(done, "fixture-noop-quick").zone).toBe("graveyard");
			// A Continuous Spell in the Chain stays on the field: it can be chosen.
			const withContinuous = board({ extraZone: [card], hand: ["fixture-plain-1"] }, { hand: ["fixture-continuous"] }, { everyWindow: true }, "rival");
			const link1 = play(withContinuous, "activate fixture-continuous");
			expect(offered(play(link1, `${effect} ~ fixture-plain-1`, "pass", "pass"))).toEqual([`choose ${card}`, "choose fixture-continuous"].sort());
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "qa-quick-play-chain")} cannot return a Quick-Play Spell whose higher Chain Link already resolved`, () => {
			const start = board({ extraZone: [card], hand: ["fixture-plain-1"] }, { set: ["fixture-noop-quick"] }, { everyWindow: true }, "rival");
			const done = play(start, "pass", `${effect} ~ fixture-plain-1`, "activate fixture-noop-quick", "pass", "pass");
			expect(find(done, card)).toMatchObject({ zone: "extra", face: "down" });
			expect(find(done, "fixture-noop-quick").zone).toBe("graveyard");
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "notes-no-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = board({ extraZone: [card], monsters: ["fixture-plain-1"], hand: ["fixture-plain-2"] }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-giant > fixture-plain-1");
			expect(own(mine(declared), effect)).not.toEqual([]);
			expect(own(mine(toStep(declared, "start")), effect)).toEqual([]);
		});
	});

	describe("its Summon effect when it is Tributed", () => {
		const hand = ["fixture-plain-1", "fixture-dragon-4", "fixture-warrior-4"];
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "summon")} ${cites("hieratic-seal-of-the-heavenly-spheres", "notes-summon-trigger")} ${cites("hieratic-seal-of-the-heavenly-spheres", "notes-summon-mandatory")} Special Summons 1 Dragon monster from the hand or the Deck and makes its ATK and DEF 0, a mandatory Trigger Effect of the Graveyard`, () => {
			const start = rivalTurn({ hand, deck: ["fixture-blue-eyes-normal", "fixture-warrior-4"], monsters: ["fixture-plain-2"] });
			// Tribute itself as the cost: it goes to the Graveyard, tributed. The only other face-up card is returned when that effect resolves.
			const tributed = play(start, `${effect} ~ ${card}`, "pass", "pass");
			expect(find(tributed, card).zone).toBe("graveyard");
			expect(codes(tributed, "you", "hand")).toContain("fixture-plain-2");
			// Then the mandatory Trigger Effect is put on a Chain, after the first one has resolved, and asks for the Dragon when it resolves.
			const asked = play(tributed, "pass", "pass");
			expect(offered(asked)).toEqual(["choose fixture-blue-eyes-normal", "choose fixture-dragon-4"]);
			const placed = play(asked, "choose fixture-blue-eyes-normal");
			const done = play(placed, offered(placed).find((label) => label.startsWith("place"))!);
			const summoned = find(done, "fixture-blue-eyes-normal");
			expect(summoned).toMatchObject({ zone: "monster", face: "up" });
			expect([atk(done, summoned.id), defOf(done, summoned.id)]).toEqual([0, 0]);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "summon")} ${cites("hieratic-seal-of-the-heavenly-spheres", "once")} is used once per turn, by name: a second copy Tributed in the same turn does not trigger it`, () => {
			const start = board({ extraZone: [card], monsters: [card], set: ["fixture-tribute-pump", "fixture-tribute-pump"], hand: ["fixture-dragon-4", "fixture-blue-eyes-normal"] }, {}, { everyWindow: true });
			const first = settle(play(start, "activate fixture-tribute-pump ~ " + card));
			expect(codes(first, "you", "monster").filter((code) => code === card)).toHaveLength(1);
			expect(codes(first, "you", "graveyard")).toContain(card);
			// The first copy Tributed Summoned a Dragon; the second copy Tributed now does not trigger it again.
			const second = settle(play(first, "activate fixture-tribute-pump ~ " + card));
			expect(codes(second, "you", "monster")).toHaveLength(1);
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "notes-summon-damage-step")} ${cites("hieratic-seal-of-the-heavenly-spheres", "notes-summon-graveyard")} activates in the Damage Step when it was Tributed there, from the Graveyard, even when the Tribute was a cost paid in that Step`, () => {
			const start = board({ extraZone: [card], monsters: ["fixture-plain-1"], set: ["fixture-tribute-pump"], hand: ["fixture-dragon-4"] }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-giant > fixture-plain-1");
			const inStep = mine(toStep(declared, "start"));
			const chained = play(inStep, `activate fixture-tribute-pump ~ ${card}`);
			const done = settle(chained);
			expect(find(done, card).zone).toBe("graveyard");
			expect(done.battle?.step).toBe("start");
			expect(find(done, "fixture-dragon-4").zone).toBe("monster");
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "notes-summon-banished")} activates from banishment when it was Tributed and banished face-up`, () => {
			const start = rivalTurn({ hand: ["fixture-dragon-4"], monsters: ["fixture-plain-2"] });
			const marked = banishWhenItLeaves(start, find(start, card).id);
			const done = settle(play(marked, `${effect} ~ ${card}`, "pass", "pass"));
			expect(find(done, card)).toMatchObject({ zone: "banished", face: "up" });
			expect(find(done, "fixture-dragon-4").zone).toBe("monster");
		});
		it(`${cites("hieratic-seal-of-the-heavenly-spheres", "qa-left-graveyard")} is not activated when the card has left the Graveyard before the effect could be activated (Konami's Q&A: the opponent banished it in response to the Tribute)`, () => {
			const start = board({ extraZone: [card], hand: ["fixture-dragon-4"], monsters: ["fixture-plain-2"] }, { set: ["fixture-crow"] }, { everyWindow: true }, "rival");
			const chained = play(mine(start), `${effect} ~ ${card}`);
			const banished = settle(play(chained, `activate fixture-crow > ${card}`));
			expect(find(banished, card).zone).toBe("banished");
			expect(find(banished, "fixture-dragon-4").zone).toBe("hand");
		});
	});
});
