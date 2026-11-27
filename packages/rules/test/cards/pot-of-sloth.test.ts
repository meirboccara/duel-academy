import { describe, expect, it } from "vitest";
import { addModifier, CARD_DEFS, type CardDef, cites, type Duel, moveCard, printedFacts } from "../../src";
import { codes, lastingLines, offered, play, plainCards, position, type SideSpec } from "../rules/fixtures";

const card = "pot-of-sloth";
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...plainCards(), "fixture-filler": { code: "fixture-filler", kind: "monster", facts: { level: 4, atk: 0, def: 0 } },
	// A monster with a Quick Effect that sends itself to the Graveyard as its cost (it leaves the opponent's field in response to the Spell).
	"fixture-vanisher": { code: "fixture-vanisher", kind: "monster", facts: { level: 4, atk: 0, def: 0 }, effects: [{ type: "quick", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: (duel) => duel }] },
};
const board = (you: SideSpec, rival: SideSpec = {}): Duel => position({ defs, options: { everyWindow: true }, you, rival });
const filler = ["raigeki", "upstart-goblin", "terraforming", "pot-of-greed", "muka-muka", "dd-crow"];
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
/** Passes until the chain is resolved or a question is open, then until the game state is open again (the opponent passes first after a chain). */
const resolve = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 8 && !next.asking && (next.chain.length > 0 || (offered(next).length === 1 && offered(next)[0] === "pass")); guard++) next = play(next, "pass");
	return next;
};

describe("Pot of Sloth, written as effect records", () => {
	it(`${cites("pot-of-sloth","facts")} is a Normal Spell that mentions itself, and no archetype`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("spell");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Pot of Sloth", mentions: ["Pot of Sloth"] });
	});

	it(`${cites("pot-of-sloth","draw")} draws as many cards as the opponent controls: monsters, Spells and Traps, Set cards included`, () => {
		const start = board({ hand: [card], deck: filler }, { monsters: ["fixture-filler"], set: ["infinite-impermanence"] });
		const asked = resolve(play(start, `activate ${card}`));
		// 2 cards drawn: the first part of the effect is done, the second asks for 1 card of the hand.
		expect(codes(asked, "you", "hand")).toHaveLength(2);
		expect(asked.asking).toBeTruthy();
		const one = resolve(play(board({ hand: [card], deck: filler }, { monsters: ["fixture-filler"] }), `activate ${card}`));
		expect(codes(one, "you", "hand")).toHaveLength(1);
		expect(one.asking).toBeFalsy();
	});

	it(`${cites("pot-of-sloth","draw")} counts every card the opponent controls: face-down and Extra Monster Zone monsters, Set Spells and Traps and the Field Zone`, () => {
		const rival = { monsters: ["fixture-filler"], facedown: ["fixture-filler"], extraZone: ["fixture-filler"], set: ["infinite-impermanence"], faceupSpells: ["umi"] };
		const asked = resolve(play(board({ hand: [card], deck: [...filler, "dd-crow", "mausoleum-of-white"] }, rival), `activate ${card}`));
		// 5 cards drawn (the player's own cards are not counted), 4 of them to be placed.
		expect(codes(asked, "you", "hand")).toHaveLength(5);
		expect(asked.asking).toBeTruthy();
	});

	it(`${cites("pot-of-sloth","bottom")} ${cites("pot-of-sloth","notes-sequential")} after drawing 2 or more, places the number drawn minus 1 cards of the hand on the bottom of the Deck in the order chosen, once the drawing is done`, () => {
		const start = board({ hand: [card], deck: filler }, { monsters: ["fixture-filler", "fixture-filler", "fixture-filler"] });
		const asked = resolve(play(start, `activate ${card}`));
		// The 3 cards are already in the hand when the player chooses (the two parts are not simultaneous), and 2 of the hand are to be placed.
		const drawn = codes(asked, "you", "hand");
		expect(drawn).toHaveLength(3);
		expect(offered(asked).sort()).toEqual(drawn.map((code) => `choose ${code}`).sort());
		const deckBefore = codes(asked, "you", "deck");
		const first = play(asked, `choose ${drawn[0]}`);
		expect(first.asking).toBeTruthy();
		const ordered = play(first, `choose ${drawn[2]}`);
		const done = play(ordered, `choose ${drawn[0]}`);
		expect(codes(done, "you", "hand")).toEqual([drawn[1]]);
		// The last card chosen is the bottom card.
		expect(codes(done, "you", "deck")).toEqual([...deckBefore, drawn[0], drawn[2]]);
	});

	it(`${cites("pot-of-sloth","lock")} after it resolves, no other "Pot of Sloth" can be activated this turn`, () => {
		const start = board({ hand: [card, card], deck: filler }, { monsters: ["fixture-filler"] });
		expect([...new Set(offered(start).filter((label) => label.startsWith("activate")))]).toEqual([`activate ${card}`]);
		const done = resolve(play(start, `activate ${card}`));
		expect(offered(done).filter((label) => label.startsWith("activate"))).toEqual([]);
		// The board's lasting line says what the lock stops, in the card's words.
		expect(lastingLines(done).join("\n")).toContain('you cannot activate "Pot of Sloth"');
	});

	it(`${cites("pot-of-sloth","notes-lock-failure")} the lock stands even when nothing was drawn: the opponent's only card left in response to the activation`, () => {
		const start = board({ hand: [card, card], deck: filler }, { monsters: ["fixture-vanisher"] });
		const answered = play(play(start, `activate ${card}`), "activate fixture-vanisher");
		const done = resolve(answered);
		// 0 cards drawn: only the second copy of the card is in the hand.
		expect(codes(done, "you", "hand")).toEqual([card]);
		expect(codes(done, "you", "deck")).toHaveLength(filler.length);
		expect(offered(done).filter((label) => label.startsWith("activate"))).toEqual([]);
	});

	describe("activation legality (YGOProJudge only: chat of 2026-11-26, no Konami page cited for the activation)", () => {
		const legal = (duel: Duel) => [...new Set(offered(duel).filter((label) => label.startsWith("activate")))];
		it("cannot be activated when the opponent controls no card", () => {
			expect(legal(board({ hand: [card], deck: filler }))).toEqual([]);
		});
		it("cannot be activated while the player cannot draw by card effects or add cards from the Deck to the hand", () => {
			const start = board({ hand: [card], deck: filler }, { monsters: ["fixture-filler"] });
			expect(legal(start)).toEqual([`activate ${card}`]);
			expect(legal(addModifier(start, { affects: () => true, until: 3, layer: { kind: "lock", what: "draw", who: "you" } }))).toEqual([]);
			expect(legal(addModifier(start, { affects: () => true, until: 3, layer: { kind: "lock", what: "add-to-hand", who: "both" } }))).toEqual([]);
		});
		it("cannot be activated when the Deck holds fewer cards than the opponent controls (the player would lose)", () => {
			const rival = { monsters: ["fixture-filler", "fixture-filler", "fixture-filler"] };
			expect(legal(board({ hand: [card], deck: filler.slice(0, 2) }, rival))).toEqual([]);
			expect(legal(board({ hand: [card], deck: filler.slice(0, 3) }, rival))).toEqual([`activate ${card}`]);
		});
	});

	it(`${cites("pot-of-sloth","notes-lock-failure")} an activation that is negated does not resolve: no lock`, () => {
		const start = board({ hand: [card, card], deck: filler }, { monsters: ["fixture-filler"], set: ["counter"] });
		const chained = play(start, `activate ${card}`);
		expect(offered(chained)).toContain("activate counter");
		const done = resolve(play(chained, "activate counter"));
		expect(codes(done, "you", "hand")).toEqual([card]);
		expect(offered(done).filter((label) => label.startsWith("activate"))).toEqual([`activate ${card}`]);
	});
});
