import { describe, expect, it } from "vitest";
import { addModifier, cites, type Duel, landSummon, specialSummon } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";
import { readinessCards } from "../rules/readiness-fixtures";

const options = { everyWindow: true };
const card = "mulcharmy-fuwalos";
const cards = (log: string[] = []) => ({ ...readinessCards(log), ...REAL_CARDS });
/** A Deck of `count` Normal Monsters. */
const deckOf = (count: number) => Array.from({ length: count }, () => "fixture-vanilla");

/** Passes until the turn player holds priority in an open game state of `phase`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"]): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === phase && (phase !== "battle" || next.battleStep === "battle") && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

/** The rival's turn, Main Phase 1; you hold Fuwalos and have applied it. The rival holds what `rival` says. */
function applied(defs: ReturnType<typeof cards>, rival: Parameters<typeof position>[0]["rival"], you: Parameters<typeof position>[0]["you"] = {}): Duel {
	const start = position({ defs, options, turn: "rival", you: { hand: [card], deck: deckOf(6), ...you }, rival });
	return play(start, "pass", `activate ${card}`, "pass", "pass");
}

describe("Mulcharmy Fuwalos: activation", () => {
 it(`${cites("ash-blossom-joyous-spring", "qa-discard-while-banished-instead")} both Mulcharmy monsters can pay their discard cost under a GY-to-banish replacement`, () => {
  for (const code of ["mulcharmy-fuwalos", "mulcharmy-purulia"]) {
   const start = position({ defs: cards(), options, you: { hand: [code] } });
   const replaced = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
   const paid = play(replaced, `activate ${code}`);
   expect(codes(paid, "you", "banished")).toEqual([code]);
   expect(paid.chain.map((link) => link.card.code)).toEqual([code]);
  }
 });
	it(`${cites("mulcharmy-fuwalos", "text-activation")} ${cites("mulcharmy-fuwalos", "notes-hand-quick")} is a Quick Effect in the hand, in either player's turn, only while its player controls no cards, and its cost is discarding itself`, () => {
		const defs = cards();
		const theirs = position({ defs, options, turn: "rival", you: { hand: [card] } });
		expect(offered(play(theirs, "pass"))).toEqual([`activate ${card}`, "pass"]);
		const mine = position({ defs, options, you: { hand: [card] } });
		expect(offered(mine)).toContain(`activate ${card}`);
		const paid = play(mine, `activate ${card}`);
		expect(codes(paid, "you", "graveyard")).toEqual([card]);
		expect(paid.chain.map((link) => link.card.code)).toEqual([card]);
		// A monster, a Set card or a Field Spell on its player's side: not offered.
		for (const side of [{ monsters: ["fixture-vanilla"] }, { set: ["fixture-plain-trap"] }, { faceupSpells: ["umi"] }]) {
			expect(offered(position({ defs, options, you: { hand: [card], ...side } }))).not.toContain(`activate ${card}`);
		}
		// The opponent's cards do not matter.
		expect(offered(position({ defs, options, you: { hand: [card] }, rival: { monsters: ["fixture-vanilla"] } }))).toContain(`activate ${card}`);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-damage-step")} cannot be activated in the Damage Step`, () => {
		const defs = cards();
		const battle = position({ defs, options, turn: "rival", phase: "battle", you: { hand: [card] }, rival: { monsters: ["fixture-big"] } });
		const declared = play(battle, "attack fixture-big directly");
		expect(declared.battle?.step).toBe("declared");
		expect(offered(play(declared, "pass"))).toContain(`activate ${card}`);
		const damageStep = play(declared, "pass", "pass");
		expect(damageStep.battle?.step).toBe("start");
		expect(offered(play(damageStep, "pass"))).toEqual(["pass"]);
	});
	it(`${cites("mulcharmy-fuwalos", "text-limit")} ${cites("mulcharmy-fuwalos", "notes-second-copy")} only 1 other "Mulcharmy" monster effect in the turn: a second copy can be activated while the first applies, a third (or a Purulia) cannot`, () => {
		const defs = cards();
		const start = position({ defs, options, turn: "rival", you: { hand: [card, card, card, "mulcharmy-purulia"], deck: deckOf(6) } });
		const one = play(start, "pass", `activate ${card}`, "pass", "pass");
		expect([...new Set(offered(play(one, "pass")))]).toEqual(["activate mulcharmy-fuwalos", "activate mulcharmy-purulia", "pass"]);
		const two = play(one, "pass", `activate ${card}`, "pass", "pass");
		expect(two.watches).toHaveLength(2);
		expect(offered(play(two, "pass"))).toEqual(["pass"]);
		// A new turn: the count starts again.
		const next = toPhase(two, "draw");
		expect(next.turn.number).toBe(4);
		expect(offered(next)).toContain(`activate ${card}`);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-limit-not-effect")} ${cites("mulcharmy-fuwalos", "qa-negated-counts")} the limit is not an effect and counts an activation that was negated: after a negated Fuwalos and a second one, no third`, () => {
		const log: string[] = [];
		const defs = cards(log);
		const start = position({ defs, options, turn: "rival", you: { hand: [card, card, card], deck: deckOf(6) }, rival: { set: ["fixture-counter"] } });
		const negated = play(start, "pass", `activate ${card}`, "activate fixture-counter", "pass", "pass");
		expect(log).toEqual(["fixture-counter"]);
		expect(negated.watches).toEqual([]);
		const second = play(negated, "pass", `activate ${card}`, "pass", "pass");
		expect(second.watches).toHaveLength(1);
		expect(offered(play(second, "pass"))).toEqual(["pass"]);
	});
	it("can be answered by Ash Blossom & Joyous Spring: its effect includes drawing (YGOProJudge only for this card; Konami's Q&A on draws is Ash Blossom's record)", () => {
		const defs = cards();
		const start = position({ defs, options, turn: "rival", you: { hand: [card], deck: deckOf(6) }, rival: { hand: ["ash-blossom-joyous-spring", "fixture-summon-from-deck"], deck: ["fixture-big"] } });
		const answered = play(start, "pass", `activate ${card}`);
		expect(offered(answered)).toContain("activate ash-blossom-joyous-spring");
		const done = play(answered, "activate ash-blossom-joyous-spring", "pass", "pass");
		expect(done.watches).toEqual([]);
		expect(done.delayed).toEqual([]);
	});
});

describe("Mulcharmy Fuwalos: each time your opponent Special Summons from the Deck or Extra Deck", () => {
	it(`${cites("mulcharmy-fuwalos", "text-draw")} draws 1 card for a Special Summon from the opponent's Deck or Extra Deck, not from the hand, and not for its own player's Summons`, () => {
		const defs = cards();
		const duel = applied(defs, { hand: ["fixture-summon-from-deck", "fixture-summon-from-hand", "fixture-big"], deck: ["fixture-big"], extra: ["link-spider"] }, { hand: [card, "fixture-vanilla"] });
		const fromDeck = play(duel, "pass", "pass", "activate fixture-summon-from-deck", "pass", "pass");
		expect(codes(fromDeck, "rival", "monster")).toEqual(["fixture-big"]);
		expect(fromDeck.piles.you.hand).toHaveLength(2);
		// From the hand: nothing.
		const fromHand = play(toPhase(fromDeck, "main1"), "activate fixture-summon-from-hand", "pass", "pass");
		expect(codes(fromHand, "rival", "monster")).toEqual(["fixture-big", "fixture-big"]);
		expect(fromHand.piles.you.hand).toHaveLength(2);
		// From the Extra Deck, by an effect of the opponent: 1 more card.
		const extra = fromHand.piles.rival.extra[0]!;
		expect(landSummon(fromHand, { player: "rival", cards: [extra], how: "special", negated: false }).piles.you.hand).toHaveLength(3);
		// Its own player's Special Summon from the Deck: nothing.
		const own = specialSummon(fromHand, "you", fromHand.piles.you.deck[0]!);
		expect(own.piles.you.monster).toHaveLength(1);
		expect(own.piles.you.hand).toHaveLength(2);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-no-chain")} draws at once, with no Chain Link, also while a chain resolves`, () => {
		const log: string[] = [];
		const defs = cards(log);
		// Your turn; the rival applies Fuwalos. Chain Link 1 writes the size of the rival's hand, Chain Link 2 Special Summons from your Deck.
		const start = position({ defs, options, you: { hand: ["fixture-count-hand", "fixture-summon-from-deck"], deck: ["fixture-big"] }, rival: { hand: [card], deck: deckOf(6) } });
		const watching = play(start, "pass", `activate ${card}`, "pass", "pass");
		expect(watching.piles.rival.hand).toHaveLength(0);
		const chained = play(watching, "activate fixture-count-hand", "pass", "activate fixture-summon-from-deck");
		expect(chained.chain).toHaveLength(2);
		const done = play(chained, "pass", "pass");
		// The card was drawn while Chain Link 2 resolved: Chain Link 1 already sees it. No link was added for the draw.
		expect(log).toEqual(["rival hand 1"]);
		expect(done.chain).toEqual([]);
		expect(done.activations.map((entry) => entry.card.code)).toEqual([card, "fixture-count-hand", "fixture-summon-from-deck"]);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-per-summon")} counts Summons, not monsters: two monsters Special Summoned at the same time draw 1 card`, () => {
		const defs = cards();
		const duel = applied(defs, { deck: ["fixture-big", "fixture-vanilla"] });
		const [first, second] = duel.piles.rival.deck;
		const together = landSummon(duel, { player: "rival", cards: [first!, second!], how: "special", negated: false });
		expect(together.piles.rival.monster).toHaveLength(2);
		expect(together.piles.you.hand).toHaveLength(1);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-stacks")} two resolved copies each draw 1 card for one Summon`, () => {
		const defs = cards();
		const start = position({ defs, options, turn: "rival", you: { hand: [card, card], deck: deckOf(6) }, rival: { hand: ["fixture-summon-from-deck"], deck: ["fixture-big"] } });
		const two = play(start, "pass", `activate ${card}`, "pass", "pass", "pass", `activate ${card}`, "pass", "pass");
		const done = play(two, "pass", "pass", "activate fixture-summon-from-deck", "pass", "pass");
		expect(done.piles.you.hand).toHaveLength(2);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-damage-step-summon")} also draws for a Special Summon made during the Damage Step`, () => {
		const defs = cards();
		const duel = applied(defs, { monsters: ["fixture-big"], deck: ["fixture-vanilla"] });
		const damageStep = play(toPhase(duel, "battle"), "attack fixture-big directly", "pass", "pass");
		expect(damageStep.battle?.step).toBe("start");
		const summoned = specialSummon(damageStep, "rival", damageStep.piles.rival.deck[0]!);
		expect(summoned.piles.you.hand).toHaveLength(1);
	});
	it(`${cites("mulcharmy-fuwalos", "qa-opponent-summons-from-my-deck")} draws when the opponent Special Summons a monster from its player's own Deck to the opponent's field`, () => {
		const defs = cards();
		const duel = applied(defs, {});
		const taken = specialSummon(duel, "rival", duel.piles.you.deck[0]!);
		expect(taken.piles.rival.monster).toHaveLength(1);
		expect(taken.piles.you.hand).toHaveLength(1);
	});
	it(`${cites("mulcharmy-fuwalos", "notes-cannot-draw")} can be activated when no draw is possible: under Droll & Lock Bird's lock nothing is drawn, and with an empty Deck its player loses when the draw comes`, () => {
		const defs = cards();
		// The rival draws with Pot of Greed; you answer with Droll & Lock Bird: for the rest of the turn no card is added from a Deck.
		const start = position({ defs, options, turn: "rival", you: { hand: [card, "droll-lock-bird"], deck: deckOf(3) }, rival: { hand: ["pot-of-greed", "fixture-summon-from-deck"], deck: ["fixture-big", "fixture-big", "fixture-big"] } });
		const locked = play(start, "activate pot-of-greed", "pass", "pass", "pass", "activate droll-lock-bird", "pass", "pass");
		expect(locked.modifiers).toHaveLength(1);
		// Fuwalos is still offered and applied; the Special Summon from the Deck then draws nothing.
		const watching = play(locked, "pass", `activate ${card}`, "pass", "pass");
		expect(watching.watches).toHaveLength(1);
		const summoned = play(toPhase(watching, "main1"), "activate fixture-summon-from-deck", "pass", "pass");
		expect(codes(summoned, "rival", "monster")).toEqual(["fixture-big"]);
		expect(summoned.piles.you.hand).toHaveLength(0);
		expect(summoned.winner).toBeNull();
		const empty = position({ defs, options, turn: "rival", you: { hand: [card] }, rival: { hand: ["fixture-summon-from-deck"], deck: ["fixture-big"] } });
		const lost = play(empty, "pass", `activate ${card}`, "pass", "pass", "pass", "pass", "activate fixture-summon-from-deck", "pass", "pass");
		expect(lost.winner).toBe("rival");
	});
	it("applies for the turn only: no draw for a Summon of the next turn", () => {
		const defs = cards();
		const duel = applied(defs, { deck: ["fixture-big"] });
		const next = toPhase(duel, "draw");
		expect(next.turn.number).toBe(4);
		expect(next.watches).toEqual([]);
		expect(specialSummon(next, "rival", next.piles.rival.deck[0]!).piles.you.hand).toHaveLength(0);
	});
});

describe("Mulcharmy Fuwalos: during this End Phase", () => {
	it(`${cites("mulcharmy-fuwalos", "text-end-phase")} ${cites("mulcharmy-fuwalos", "notes-end-no-chain")} with more cards in hand than the opponent's cards on the field +6, shuffles random cards from the hand into the Deck down to that number, once, with no Chain Link`, () => {
		const defs = cards();
		// 9 cards left in hand after the discard; the rival controls 1 card: 9 > 1 + 6, so 2 go back.
		const duel = applied(defs, { monsters: ["fixture-big"] }, { hand: [card, ...deckOf(9)], deck: deckOf(3) });
		expect(duel.piles.you.hand).toHaveLength(9);
		const end = play(toPhase(duel, "end"), "pass");
		expect(end.priority.holder).toBe("you");
		expect(offered(end)).toEqual([`apply ${card}`]);
		const done = play(end, `apply ${card}`);
		expect(done.chain).toEqual([]);
		expect(done.piles.you.hand).toHaveLength(7);
		expect(done.piles.you.deck).toHaveLength(5);
		// Once: nothing more is owed, and the turn ends.
		expect(done.delayed).toEqual([]);
		expect(toPhase(done, "draw").turn.number).toBe(4);
	});
	it(`${cites("mulcharmy-fuwalos", "text-end-phase")} with no more cards than that, nothing is asked and nothing happens`, () => {
		const defs = cards();
		const duel = applied(defs, { monsters: ["fixture-big"] }, { hand: [card, ...deckOf(7)], deck: deckOf(3) });
		const end = play(toPhase(duel, "end"), "pass");
		expect(offered(end)).toEqual(["pass"]);
		const next = play(end, "pass");
		expect(next.turn.number).toBe(4);
		expect(next.piles.you.hand).toHaveLength(7);
	});
	it("the cards shuffled back are picked by the Duel's seeded RNG: the same Duel gives the same hand (determinism)", () => {
		const defs = cards();
		const once = () => {
			const duel = applied(defs, {}, { hand: [card, "fixture-big", "fixture-big", "fixture-big", "fixture-big", ...deckOf(5)], deck: deckOf(3) });
			return codes(play(toPhase(duel, "end"), "pass", `apply ${card}`), "you", "hand");
		};
		expect(once()).toEqual(once());
		expect(once()).toHaveLength(6);
	});
});
