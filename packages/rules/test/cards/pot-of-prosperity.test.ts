import { describe, expect, it } from "vitest";
import { addModifier, CARD_DEFS, type CardDef, cites, damageFor, drawCards, type Duel, negateActivation, negateEffect, revealedNow, printedFacts } from "../../src";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "pot-of-prosperity";
const gaps = gapCards();
const EXTRA = ["a", "b", "c", "d", "e", "f", "g"].map((letter) => `fixture-extra-${letter}`);
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...Object.fromEntries(EXTRA.map((code) => [code, gaps[code]!])),
	// A Counter Trap: "Negate the activation" of the last link; and "Negate the effect".
	"fixture-activation-negator": { code: "fixture-activation-negator", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateActivation(duel, index - 1) }] },
	"fixture-effect-negator": { code: "fixture-effect-negator", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
	// A Trap: "Neither player can add cards from the Deck to the hand for the rest of this turn."
	"fixture-deck-lock": { code: "fixture-deck-lock", kind: "trap", effects: [{ type: "activation", operation: (duel) => addModifier(duel, { affects: () => false, until: duel.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } }) }] },
	// A Trap: "Your opponent's damage is halved for the rest of this turn" (a second halving effect).
	"fixture-halver": gaps["fixture-halver"]!,
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs, options, you, rival });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const toMain = (duel: Duel, by: number): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};
/** Takes the first card offered while the effect or the cost asks, then passes until the chain is resolved. */
const finish = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 40 && (next.asking || next.chain.length > 0); guard++) next = play(next, offered(next).find((entry) => entry.startsWith("choose") || entry.startsWith("place")) ?? "pass");
	return next;
};
/** Passes while only passing is offered (the chain is over, the game state not open yet). */
const reopen = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 4 && offered(next).length === 1 && offered(next)[0] === "pass"; guard++) next = play(next, "pass");
	return next;
};
const DECK = ["fixture-normal-4", "fixture-normal-6", "fixture-other-dragon", "fixture-light-1", "fixture-light-tuner"];
const withExtra = (count: number, more: SideSpec = {}): Duel => board({ hand: [card], extra: EXTRA.slice(0, count), deck: DECK, ...more });

describe("Pot of Prosperity, written as effect records", () => {
	it(`${cites("pot-of-prosperity", "facts")} is a Normal Spell`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Pot of Prosperity", mentions: ["Pot of Prosperity"] });
		expect(duel.defs[card]!.kind).toBe("spell");
	});

	describe("its cost", () => {
		it(`${cites("pot-of-prosperity", "cost")} ${cites("pot-of-prosperity", "notes-cost")} banishes 3 or 6 cards of the player's choice from the Extra Deck face-down, each count a way to activate it, the cards chosen one at a time first`, () => {
			expect(own(withExtra(7), `activate ${card}`)).toEqual([`activate ${card} x3`, `activate ${card} x6`]);
			expect(own(withExtra(4), `activate ${card}`)).toEqual([`activate ${card} x3`]);
			expect(own(withExtra(2), `activate ${card}`)).toEqual([]);
			const asked = play(withExtra(7), `activate ${card} x3`);
			// The cards are chosen before the card is activated: nothing is on the chain yet.
			expect(asked.chain).toEqual([]);
			expect(offered(asked)).toEqual(EXTRA.map((code) => `choose ${code}`).sort());
			const paid = play(asked, "choose fixture-extra-c", "choose fixture-extra-a", "choose fixture-extra-f");
			expect(codes(paid, "you", "banished").sort()).toEqual(["fixture-extra-a", "fixture-extra-c", "fixture-extra-f"]);
			expect(paid.piles.you.banished.every((id) => paid.cards[id]!.face === "down")).toBe(true);
			expect(paid.chain.map((link) => link.card.code)).toEqual([card]);
			// A face-up card of the Extra Deck can be banished as well (notes).
			const faceUp = board({ hand: [card], extraFaceUp: ["fixture-extra-a"], extra: ["fixture-extra-b", "fixture-extra-c", "fixture-extra-d"], deck: DECK });
			const banished = finish(play(faceUp, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c"));
			expect(codes(banished, "you", "banished")).toHaveLength(3);
		});
	});

	describe("its effect", () => {
		it(`${cites("pot-of-prosperity", "excavate")} excavates as many cards from the top of the Deck as were banished, adds 1 of them to the hand and places the rest on the bottom of the Deck in the order the player chooses`, () => {
			const start = withExtra(7, { deck: [...DECK, "fixture-dark-tuner", "fixture-effect-4"] });
			const named = (ids: readonly number[]) => ids.map((id) => start.cards[id]!.code);
			const top = start.piles.you.deck.slice(0, 3);
			const below = start.piles.you.deck.slice(3);
			const picking = play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c");
			expect(offered(picking)).toEqual(named(top).map((code) => `choose ${code}`).sort());
			// Excavated cards are shown to both players while they stay on the Deck.
			expect(revealedNow(picking)).toEqual(top);
			const [keep, first, last] = named(top);
			const ordering = play(picking, `choose ${keep}`);
			expect(codes(ordering, "you", "hand")).toEqual([keep]);
			// The rest are placed one after another; the last picked is the bottom card.
			expect(offered(ordering)).toEqual([`choose ${first}`, `choose ${last}`].sort());
			const done = finish(play(ordering, `choose ${first}`));
			expect(codes(done, "you", "deck")).toEqual([...named(below), first, last]);
			// 6 banished: 6 excavated.
			const six = play(withExtra(7), `activate ${card} x6`, ...EXTRA.slice(0, 6).map((code) => `choose ${code}`));
			expect(offered(six)).toHaveLength(5);
		});
		it(`${cites("pot-of-prosperity", "notes-deck-short")} turns over the whole Deck when it holds fewer cards than were banished`, () => {
			const start = board({ hand: [card], extra: EXTRA.slice(0, 4), deck: ["fixture-normal-4", "fixture-normal-6"] });
			const picking = play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c");
			expect(offered(picking)).toEqual(["choose fixture-normal-4", "choose fixture-normal-6"]);
			const done = finish(play(picking, "choose fixture-normal-4"));
			expect([codes(done, "you", "hand"), codes(done, "you", "deck")]).toEqual([["fixture-normal-4"], ["fixture-normal-6"]]);
		});
		it(`${cites("pot-of-prosperity", "damage")} ${cites("pot-of-prosperity", "notes-halved-at-resolution")} halves any damage the opponent takes for the rest of the turn, once the card resolves and not before`, () => {
			const start = withExtra(4, {});
			const rivalAnswers = { ...start, options: { ...start.options, everyWindow: true } };
			const chained = play(rivalAnswers, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c");
			// With the card still on the chain, nothing is halved yet.
			expect(damageFor(chained, "rival", 1000)).toBe(1000);
			const done = finish(chained);
			expect(damageFor(done, "rival", 1000)).toBe(500);
			expect(damageFor(done, "you", 1000)).toBe(1000);
			// It is the end of the turn that ends it.
			expect(damageFor(toMain(done, 2), "rival", 1000)).toBe(1000);
		});
		it(`${cites("pot-of-prosperity", "qa-no-stack")} halves once when another effect also halves the damage`, () => {
			const start = board({ hand: [card], extra: EXTRA.slice(0, 4), deck: DECK, set: ["fixture-halver"] });
			const done = finish(play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c"));
			const twice = addModifier(done, { affects: () => false, until: done.turn.number, layer: { kind: "damage", who: "rival", halved: true } });
			expect(damageFor(twice, "rival", 1000)).toBe(500);
		});
	});

	describe("its limits", () => {
		it(`${cites("pot-of-prosperity", "once")} can be activated once per turn, whichever count and whichever copy, and a negated activation gives the use back`, () => {
			const start = board({ hand: [card, card], extra: EXTRA, deck: DECK }, { set: ["fixture-activation-negator"] }, { everyWindow: true });
			expect(own(start, `activate ${card}`)).toHaveLength(4);
			// Negated: the use is given back (the cost is not): the other copy can be activated, with the Extra Deck left.
			const negated = finish(play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c", "activate fixture-activation-negator"));
			expect(own(reopen(negated), `activate ${card}`)).toEqual([`activate ${card} x3`]);
			// Resolved: no copy, no count, for the rest of the turn.
			const resolved = finish(play(board({ hand: [card, card], extra: EXTRA, deck: DECK }), `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c"));
			expect(own(reopen(resolved), `activate ${card}`)).toEqual([]);
			expect(offered(reopen(resolved))).toContain("pass");
			expect(own(toMain(resolved, 2), `activate ${card}`)).toEqual([`activate ${card} x3`]);
		});
		it(`${cites("pot-of-prosperity", "oath")} ${cites("pot-of-prosperity", "notes-oath-from-activation")} forbids drawing by card effects from the moment it is activated, and cannot be activated after a draw by a card effect (notes)`, () => {
			const start = withExtra(4);
			expect(drawCards(start, "you", 1).piles.you.hand).toHaveLength(2);
			const chained = play({ ...start, options: { ...start.options, everyWindow: true } }, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c");
			expect(chained.chain).toHaveLength(1);
			// The card has not resolved: the player already cannot draw by an effect.
			expect(drawCards(chained, "you", 1)).toBe(chained);
			// The turn after, it is possible again.
			expect(drawCards(toMain(finish(chained), 2), "you", 1).piles.you.hand.length).toBeGreaterThan(0);
			// After a draw by a card effect this turn: not activated.
			const drawn = drawCards(start, "you", 1);
			expect(own(drawn, `activate ${card}`)).toEqual([]);
			expect(own(start, `activate ${card}`)).not.toEqual([]);
		});
		it(`${cites("pot-of-prosperity", "qa-oath-negated-activation")} lets the player draw by card effects again when the activation is negated`, () => {
			const start = board({ hand: [card], extra: EXTRA, deck: DECK }, { set: ["fixture-activation-negator"] }, { everyWindow: true });
			const negated = finish(play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c", "activate fixture-activation-negator"));
			expect(drawCards(negated, "you", 1).piles.you.hand).toHaveLength(1);
		});
		it(`${cites("pot-of-prosperity", "qa-upstart-negated")} can be activated the turn Upstart Goblin was negated, as no card was actually drawn, and not the turn it drew`, () => {
			const negatedGoblin = board({ hand: ["upstart-goblin", card], extra: EXTRA, deck: DECK }, { set: ["fixture-effect-negator"] }, { everyWindow: true });
			const stopped = reopen(finish(play(negatedGoblin, "activate upstart-goblin", "activate fixture-effect-negator")));
			expect(codes(stopped, "you", "hand")).toEqual([card]);
			expect(own(stopped, `activate ${card}`)).not.toEqual([]);
			const drew = reopen(finish(play(board({ hand: ["upstart-goblin", card], extra: EXTRA, deck: DECK }, {}, { everyWindow: true }), "activate upstart-goblin")));
			expect(codes(drew, "you", "hand")).toHaveLength(2);
			expect(own(drew, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("pot-of-prosperity", "qa-oath-negated-effect")} still forbids drawing by card effects this turn when only the effect is negated`, () => {
			const start = board({ hand: [card], extra: EXTRA, deck: DECK }, { set: ["fixture-effect-negator"] }, { everyWindow: true });
			const negated = finish(play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c", "activate fixture-effect-negator"));
			expect(negated.piles.you.hand).toHaveLength(0);
			expect(drawCards(negated, "you", 1)).toBe(negated);
		});
	});

	describe("while cards cannot be added from the Deck to the hand", () => {
		const locked = (duel: Duel) => addModifier(duel, { affects: () => false, until: duel.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
		it(`${cites("pot-of-prosperity", "qa-lock-activate")} cannot be activated`, () => {
			expect(own(locked(withExtra(7)), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("pot-of-prosperity", "qa-lock-resolve")} resolves with the excavation when the lock came in the chain: the card chosen to add is sent to the GY (not by an effect), and the rest go to the bottom`, () => {
			const start = board({ hand: [card], extra: EXTRA.slice(0, 4), deck: DECK }, { set: ["fixture-deck-lock"] }, { everyWindow: true });
			const lockedIn = play(start, `activate ${card} x3`, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c", "activate fixture-deck-lock", "pass", "pass");
			// The excavation is still done and the player chooses the card that cannot be added.
			const top = start.piles.you.deck.slice(0, 3).map((id) => start.cards[id]!.code);
			const below = start.piles.you.deck.slice(3).map((id) => start.cards[id]!.code);
			expect(offered(lockedIn)).toEqual(top.map((code) => `choose ${code}`).sort());
			const done = finish(play(lockedIn, `choose ${top[0]}`));
			expect(codes(done, "you", "hand")).toEqual([]);
			expect(codes(done, "you", "graveyard").sort()).toEqual([card, top[0]!].sort());
			expect(codes(done, "you", "deck").sort()).toEqual([...below, top[1]!, top[2]!].sort());
			expect(find(done, top[0]!).zone).toBe("graveyard");
		});
	});
});
