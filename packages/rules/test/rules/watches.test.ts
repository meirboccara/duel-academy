import { describe, expect, it } from "vitest";
import { act, decide, drawCards, type Duel, type GameEvent, HIDDEN, landSummon, legalActions, redeal, viewFor } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "./fixtures";
import { readinessCards } from "./readiness-fixtures";

const options = { everyWindow: true };

/**
 * Lingering operations that are not activations (src/delayed.ts, `watch`): "for the rest of this turn, each time ..., immediately ...".
 * The Konami source for how they apply is Mulcharmy's notes (test/cards/mulcharmy-*.test.ts); these tests exercise the mechanism on a
 * made-up card.
 */
describe("a lingering operation applied each time something happens", () => {
	it("is applied at once, inside the resolving chain, without a Chain Link: the link below sees the card already drawn", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, turn: "you", you: { hand: ["fixture-count-hand", "fixture-summon-from-deck"], deck: ["fixture-vanilla"] }, rival: { set: ["fixture-summon-watch"], deck: ["fixture-big", "fixture-big"] } });
		const watching = play(start, "pass", "activate fixture-summon-watch", "pass", "pass");
		expect(watching.watches).toHaveLength(1);
		// Chain Link 1 counts the rival's hand; Chain Link 2 Special Summons from the Deck and resolves first.
		const chained = play(watching, "activate fixture-count-hand", "pass", "activate fixture-summon-from-deck");
		expect(chained.chain.map((link) => link.card.code)).toEqual(["fixture-count-hand", "fixture-summon-from-deck"]);
		const done = play(chained, "pass", "pass");
		expect(log).toEqual(["fixture-summon-watch draws", "rival hand 1"]);
		expect(codes(done, "rival", "hand")).toEqual(["fixture-big"]);
		expect(done.chain).toEqual([]);
	});
	it("several resolved copies stack: each applies once per Summon", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-summon-from-deck"], deck: ["fixture-vanilla"] }, rival: { set: ["fixture-summon-watch", "fixture-summon-watch"], deck: ["fixture-big", "fixture-big", "fixture-big"] } });
		const watching = play(start, "pass", "activate fixture-summon-watch", "pass", "activate fixture-summon-watch", "pass", "pass");
		expect(watching.watches).toHaveLength(2);
		const done = play(watching, "pass", "pass", "activate fixture-summon-from-deck", "pass", "pass");
		expect(log).toEqual(["fixture-summon-watch draws", "fixture-summon-watch draws"]);
		expect(codes(done, "rival", "hand")).toEqual(["fixture-big", "fixture-big"]);
	});
	it("counts a group of monsters Summoned at the same time once", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-vanilla", "fixture-big"] }, rival: { set: ["fixture-summon-watch"], deck: ["fixture-big", "fixture-big", "fixture-big"] } });
		const watching = play(start, "pass", "activate fixture-summon-watch", "pass", "pass");
		const [first, second] = watching.piles.you.hand;
		// Two monsters Special Summoned at the same time (as a Pendulum Summon does): one group, one draw.
		const together = landSummon(watching, { player: "you", cards: [first!, second!], how: "special", negated: false, slots: [0, 1] });
		expect(codes(together, "you", "monster")).toEqual(["fixture-vanilla", "fixture-big"]);
		expect(log).toEqual(["fixture-summon-watch draws"]);
		// One after the other: two Summons, two more draws.
		const again = position({ defs: readinessCards(log), options, you: { hand: ["fixture-vanilla", "fixture-big"] }, rival: { set: ["fixture-summon-watch"], deck: ["fixture-big", "fixture-big", "fixture-big"] } });
		const rewatching = play(again, "pass", "activate fixture-summon-watch", "pass", "pass");
		const one = landSummon(rewatching, { player: "you", cards: [first!], how: "special", negated: false, slots: [0] });
		landSummon(one, { player: "you", cards: [second!], how: "special", negated: false, slots: [1] });
		expect(log).toEqual(["fixture-summon-watch draws", "fixture-summon-watch draws", "fixture-summon-watch draws"]);
	});
	it("is applied once the whole group Summoned at the same time is on the field: a monster of the group that stops the draw stops it wherever it stands in the group, and every monster's events keep their origin, player and batch", () => {
		for (const hand of [["fixture-vanilla", "fixture-no-draw-monster"], ["fixture-no-draw-monster", "fixture-vanilla"]]) {
			const log: string[] = [];
			const start = position({ defs: readinessCards(log), options, you: { hand }, rival: { set: ["fixture-summon-watch"], deck: ["fixture-big", "fixture-big"] } });
			const watching = play(start, "pass", "activate fixture-summon-watch", "pass", "pass");
			const [first, second] = watching.piles.you.hand;
			const together = landSummon({ ...watching, live: [] }, { player: "you", cards: [first!, second!], how: "special", kind: "pendulum", negated: false, slots: [0, 1] });
			expect(codes(together, "you", "monster")).toEqual(hand);
			// The watch was applied (once, for the group), and the draw was not done: the lock was already there.
			expect(log).toEqual(["fixture-summon-watch draws"]);
			expect(codes(together, "rival", "hand")).toEqual([]);
			const summoned = together.live.filter((event): event is Extract<GameEvent, { type: "summoned" }> => event.type === "summoned");
			expect(summoned.map((event) => [event.card.code, event.card.zone, event.how, event.kind, event.player, event.from])).toEqual(hand.map((code) => [code, "monster", "special", "pendulum", "you", "hand"]));
			expect(new Set(summoned.map((event) => event.batch)).size).toBe(1);
			// Each monster's move is still raised before its Summon.
			expect(together.live.map((event) => event.type)).toEqual(["moved", "summoned", "moved", "summoned"]);
		}
	});
	it("ends with the turn it was applied for", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-summon-from-deck"], deck: ["fixture-vanilla"] }, rival: { set: ["fixture-summon-watch"], deck: ["fixture-big"] } });
		let next = play(start, "pass", "activate fixture-summon-watch", "pass", "pass");
		for (let guard = 0; next.turn.number < 4 && guard < 100; guard++) next = play(next, "pass");
		expect(next.watches).toEqual([]);
	});
});

describe("drawing by a card effect", () => {
	it("draws from the top of the Deck, at the same time; a player who must draw from an empty Deck loses", () => {
		const start = position({ defs: readinessCards(), you: { deck: ["fixture-vanilla", "fixture-big"] }, rival: { deck: ["fixture-big"] } });
		const drawn = drawCards(start, "you", 2);
		expect(codes(drawn, "you", "hand").sort()).toEqual(["fixture-big", "fixture-vanilla"]);
		const batches = drawn.live.filter((event): event is Extract<GameEvent, { type: "added-to-hand" }> => event.type === "added-to-hand").map((event) => event.batch);
		expect(new Set(batches).size).toBe(1);
		expect(drawCards(drawn, "you", 1).winner).toBe("rival");
	});
});

describe("a Duel lost by a draw while a chain resolves ends there", () => {
	const over = (duel: Duel) => {
		expect(duel.winner).toBe("you");
		expect(duel.asking).toBeNull();
		expect(legalActions(duel)).toEqual([]);
		expect(() => act(duel, { type: "pass" })).toThrow(/not a legal action/);
	};
	it("the links below the one that lost the Duel are not resolved: they ask nothing, move nothing and raise nothing", () => {
		for (const deck of [["umi", "other-field"], ["umi"]]) {
			const log: string[] = [];
			const start = position({ defs: { ...REAL_CARDS, ...readinessCards(log) }, options, you: { hand: ["terraforming", "fixture-count-hand"], deck }, rival: { set: ["fixture-draw-one", "fixture-plain-trap"] } });
			// Chain Link 1 would search (asking which Field Spell when there are two); Chain Link 2 makes the rival draw from an empty Deck.
			const chained = play(start, "activate terraforming", "activate fixture-draw-one", "pass");
			const events = chained.live.length;
			const done = play(chained, "pass");
			over(done);
			expect(codes(done, "you", "deck").sort()).toEqual([...deck].sort());
			expect(codes(done, "you", "hand")).toEqual(["fixture-count-hand"]);
			expect(done.live.slice(events).filter((event) => event.type === "added-to-hand" || event.type === "moved")).toEqual([]);
			expect(log).toEqual([]);
		}
	});
	it("a choice answered while the chain was paused loses the Duel: the chain does not go on to the links below", () => {
		const log: string[] = [];
		const start = position({ defs: { ...REAL_CARDS, ...readinessCards(log) }, options, you: { hand: ["fixture-count-hand", "terraforming"], deck: ["umi", "other-field"] }, rival: { set: ["fixture-discard-then-draw"], hand: ["fixture-vanilla", "fixture-big"] } });
		const paused = play(start, "activate terraforming", "activate fixture-discard-then-draw", "pass", "pass");
		expect(paused.winner).toBeNull();
		expect(paused.asking?.player).toBe("rival");
		expect(offered(paused)).toEqual(["choose fixture-big", "choose fixture-vanilla"]);
		const done = play(paused, "choose fixture-vanilla");
		over(done);
		expect(codes(done, "rival", "graveyard")).toEqual(["fixture-vanilla"]);
		// Terraforming, the link below, was not resolved.
		expect(codes(done, "you", "deck").sort()).toEqual(["other-field", "umi"]);
		expect(codes(done, "you", "hand")).toEqual(["fixture-count-hand"]);
	});
});

describe("what a player sees of delayed effects and lingering operations", () => {
	it("keeps them in the view and in a re-dealt world, hides nothing public and leaks no hidden code", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-doom", "fixture-vanilla"], deck: ["fixture-big"] }, rival: { set: ["fixture-summon-watch"], hand: ["fixture-big"], monsters: ["fixture-vanilla"], deck: ["fixture-vanilla"] } });
		const duel = play(start, "activate fixture-doom > fixture-vanilla", "activate fixture-summon-watch", "pass", "pass");
		expect(duel.delayed).toHaveLength(1);
		expect(duel.watches).toHaveLength(1);
		for (const side of ["you", "rival"] as const) {
			const view = viewFor(duel, side);
			// The sources were activated, so both players know them.
			expect(view.duel.delayed.map((entry) => entry.source.code)).toEqual(["fixture-doom"]);
			expect(view.duel.watches.map((entry) => entry.source.code)).toEqual(["fixture-summon-watch"]);
			// The other player's hand stays hidden.
			const hiddenHand = view.duel.piles[side === "you" ? "rival" : "you"].hand.map((id) => view.duel.cards[id]!.code);
			expect(hiddenHand.every((code) => code === HIDDEN)).toBe(true);
			const world: Duel = redeal(view, 5);
			expect(world.delayed).toHaveLength(1);
			expect(world.watches).toHaveLength(1);
			// The world plays on: the delayed effect is applied in its End Phase without a crash.
			let next = world;
			for (let guard = 0; next.turn.number === 3 && guard < 100; guard++) {
				const names = ["apply fixture-doom", "pass"];
				next = play(next, names.find((name) => { try { play(next, name); return true; } catch { return false; } })!);
			}
			expect(next.turn.number).toBe(4);
			expect(codes(next, "rival", "graveyard")).toContain("fixture-vanilla");
		}
	});
	it("the bot plays through an End Phase that owes a mandatory delayed effect: it applies it (no pass is offered) and the turn ends", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), you: { hand: ["fixture-doom"], deck: ["fixture-big"] }, rival: { monsters: ["fixture-vanilla"], deck: ["fixture-vanilla"] } });
		let next = play(start, "activate fixture-doom > fixture-vanilla");
		for (let guard = 0; next.turn.number === 3 && guard < 100; guard++) {
			for (const level of ["basic", "expert"] as const) expect(() => decide(next, next.asking?.player ?? next.priority.holder, { level, seed: 3, budgetMs: 50 })).not.toThrow();
			next = act(next, decide(next, next.asking?.player ?? next.priority.holder, { level: "basic", seed: 3, budgetMs: 50 }).action);
		}
		expect(next.turn.number).toBe(4);
		expect(log).toEqual(["fixture-doom destroys fixture-vanilla"]);
	});
});
