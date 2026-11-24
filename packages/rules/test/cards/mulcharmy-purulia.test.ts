import { describe, expect, it } from "vitest";
import { cites, type Duel, landSummon, moveCard, specialSummon } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";
import { readinessCards } from "../rules/readiness-fixtures";
import { summonCards } from "../rules/summon-fixtures";

const options = { everyWindow: true };
const card = "mulcharmy-purulia";
const cards = (log: string[] = []) => ({ ...readinessCards(log), ...REAL_CARDS });
const deckOf = (count: number) => Array.from({ length: count }, () => "fixture-vanilla");

/** Passes until the turn player holds priority in an open game state of `phase`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"]): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

/** The rival's turn, Main Phase 1, the game state open; you hold Purulia and have applied it. */
function applied(defs: ReturnType<typeof cards>, rival: Parameters<typeof position>[0]["rival"], you: Parameters<typeof position>[0]["you"] = {}): Duel {
	const start = position({ defs, options, turn: "rival", you: { hand: [card], deck: deckOf(6), ...you }, rival });
	return toPhase(play(start, "pass", `activate ${card}`, "pass", "pass"), "main1");
}

describe("Mulcharmy Purulia: activation", () => {
	it(`${cites("mulcharmy-purulia", "text-activation")} ${cites("mulcharmy-purulia", "notes-hand-quick")} is a Quick Effect in the hand, in either player's turn, only while its player controls no cards, and its cost is discarding itself`, () => {
		const defs = cards();
		const theirs = position({ defs, options, turn: "rival", you: { hand: [card] } });
		expect(offered(play(theirs, "pass"))).toEqual([`activate ${card}`, "pass"]);
		const mine = position({ defs, options, you: { hand: [card] } });
		const paid = play(mine, `activate ${card}`);
		expect(codes(paid, "you", "graveyard")).toEqual([card]);
		for (const side of [{ monsters: ["fixture-vanilla"] }, { set: ["fixture-plain-trap"] }, { faceupSpells: ["umi"] }]) {
			expect(offered(position({ defs, options, you: { hand: [card], ...side } }))).not.toContain(`activate ${card}`);
		}
	});
	it(`${cites("mulcharmy-purulia", "notes-damage-step")} cannot be activated in the Damage Step`, () => {
		const defs = cards();
		const battle = position({ defs, options, turn: "rival", phase: "battle", you: { hand: [card] }, rival: { monsters: ["fixture-big"] } });
		const damageStep = play(battle, "attack fixture-big directly", "pass", "pass");
		expect(damageStep.battle?.step).toBe("start");
		expect(offered(play(damageStep, "pass"))).toEqual(["pass"]);
	});
	it(`${cites("mulcharmy-purulia", "text-limit")} ${cites("mulcharmy-purulia", "notes-second-copy")} ${cites("mulcharmy-purulia", "notes-stacks")} a second copy can be activated while the first applies and both then draw; a third "Mulcharmy" monster effect cannot be activated that turn`, () => {
		const defs = cards();
		const start = position({ defs, options, turn: "rival", you: { hand: [card, card, card, "mulcharmy-fuwalos"], deck: deckOf(6) }, rival: { hand: ["fixture-vanilla"] } });
		const two = play(start, "pass", `activate ${card}`, "pass", "pass", "pass", `activate ${card}`, "pass", "pass");
		expect(two.watches).toHaveLength(2);
		expect(offered(play(two, "pass"))).toEqual(["pass"]);
		// One Normal Summon by the opponent: each of the two resolved copies draws 1 card.
		const summoned = play(toPhase(two, "main1"), "summon fixture-vanilla", "pass", "pass");
		expect(summoned.piles.you.hand).toHaveLength(4);
	});
	it(`${cites("mulcharmy-purulia", "notes-limit-not-effect")} ${cites("mulcharmy-purulia", "qa-negated-counts")} the limit is not an effect and counts an activation that was negated`, () => {
		const log: string[] = [];
		const defs = cards(log);
		const start = position({ defs, options, turn: "rival", you: { hand: [card, card, card], deck: deckOf(6) }, rival: { set: ["fixture-counter"] } });
		const negated = play(start, "pass", `activate ${card}`, "activate fixture-counter", "pass", "pass");
		expect(negated.watches).toEqual([]);
		const second = play(negated, "pass", `activate ${card}`, "pass", "pass");
		expect(second.watches).toHaveLength(1);
		expect(offered(play(second, "pass"))).toEqual(["pass"]);
	});
});

describe("Mulcharmy Purulia: each time your opponent Normal or Special Summons from the hand", () => {
	it(`${cites("mulcharmy-purulia", "text-draw")} draws 1 card for a Normal Summon and for a Special Summon from the hand, not for a Special Summon from the Deck`, () => {
		const defs = cards();
		const duel = applied(defs, { hand: ["fixture-vanilla", "fixture-big", "fixture-summon-from-hand", "fixture-summon-from-deck"], deck: ["fixture-big"] });
		const normal = play(duel, "summon fixture-vanilla", "pass", "pass");
		expect(codes(normal, "rival", "monster")).toEqual(["fixture-vanilla"]);
		expect(normal.piles.you.hand).toHaveLength(1);
		const special = play(toPhase(normal, "main1"), "activate fixture-summon-from-hand", "pass", "pass");
		expect(codes(special, "rival", "monster")).toEqual(["fixture-vanilla", "fixture-big"]);
		expect(special.piles.you.hand).toHaveLength(2);
		const fromDeck = play(toPhase(special, "main1"), "activate fixture-summon-from-deck", "pass", "pass");
		expect(fromDeck.piles.rival.monster).toHaveLength(3);
		expect(fromDeck.piles.you.hand).toHaveLength(2);
	});
	it(`${cites("mulcharmy-purulia", "notes-set-not-summon")} a monster Set from the hand is not Summoned: no draw`, () => {
		const defs = cards();
		const duel = applied(defs, { hand: ["fixture-vanilla"] });
		const set = play(duel, "set fixture-vanilla");
		expect(set.piles.rival.monster).toHaveLength(1);
		expect(set.piles.you.hand).toHaveLength(0);
	});
	it(`${cites("mulcharmy-purulia", "notes-no-chain")} draws at once when the Summon succeeds, with no Chain Link`, () => {
		const defs = cards();
		const duel = applied(defs, { hand: ["fixture-vanilla"] });
		const attempted = play(duel, "summon fixture-vanilla");
		// The Summon has not succeeded yet: nothing is drawn while it can still be negated.
		expect(attempted.summoning).not.toBeNull();
		expect(attempted.piles.you.hand).toHaveLength(0);
		const summoned = play(attempted, "pass", "pass");
		expect(summoned.piles.you.hand).toHaveLength(1);
		expect(summoned.chain).toEqual([]);
		expect(summoned.activations.map((entry) => entry.card.code)).toEqual([card]);
	});
	it(`${cites("mulcharmy-purulia", "notes-per-summon")} counts Summons, not monsters: monsters Special Summoned from the hand at the same time (a Pendulum Summon) draw 1 card`, () => {
		const defs = cards();
		const duel = applied(defs, { hand: ["fixture-vanilla", "fixture-big"] });
		const [first, second] = duel.piles.rival.hand;
		const together = landSummon(duel, { player: "rival", cards: [first!, second!], how: "special", kind: "pendulum", negated: false });
		expect(together.piles.rival.monster).toHaveLength(2);
		expect(together.piles.you.hand).toHaveLength(1);
	});
	it(`${cites("mulcharmy-purulia", "notes-per-summon")} a real Pendulum Summon of two monsters from the hand draws 1 card, once both are on the field: none when one of them stops its opponent's draws, whichever was chosen first`, () => {
		const defs = { ...summonCards(), ...cards() };
		const pendulum = (hand: string[], picks: string[]) => {
			const start = position({ defs, options, you: { faceupSpells: ["scale-1", "scale-8"], hand }, rival: { hand: [card], deck: deckOf(4) } });
			const scaled = moveCard(start, start.piles.you.spell[1]!, { zone: "spell", slot: 4 });
			const applying = play({ ...scaled, live: [], waiting: [] }, "pass", `activate ${card}`, "pass", "pass", "pass", "pass");
			expect(applying.watches).toHaveLength(1);
			const done = play(applying, "pendulum-summon", `choose ${picks[0]}`, "place 1", `choose ${picks[1]}`, "place 2", "pass", "pass");
			expect(codes(done, "you", "monster").sort()).toEqual([...picks].sort());
			return done.piles.rival.hand.length;
		};
		expect(pendulum(["fixture-vanilla", "fixture-big"], ["fixture-vanilla", "fixture-big"])).toBe(1);
		expect(pendulum(["fixture-vanilla", "fixture-no-draw-monster"], ["fixture-vanilla", "fixture-no-draw-monster"])).toBe(0);
		expect(pendulum(["fixture-vanilla", "fixture-no-draw-monster"], ["fixture-no-draw-monster", "fixture-vanilla"])).toBe(0);
	});
	it(`${cites("mulcharmy-purulia", "notes-damage-step-summon")} also draws for a Special Summon from the hand made during the Damage Step`, () => {
		const defs = cards();
		const duel = applied(defs, { monsters: ["fixture-big"], hand: ["fixture-vanilla"] });
		const damageStep = play(toPhase(duel, "battle"), "attack fixture-big directly", "pass", "pass");
		expect(damageStep.battle?.step).toBe("start");
		expect(specialSummon(damageStep, "rival", damageStep.piles.rival.hand[0]!).piles.you.hand).toHaveLength(1);
	});
	it(`${cites("mulcharmy-purulia", "notes-cannot-draw")} can be activated with an empty Deck; its player then loses when the draw comes`, () => {
		const defs = cards();
		const duel = applied(defs, { hand: ["fixture-vanilla"] }, { hand: [card], deck: [] });
		expect(duel.watches).toHaveLength(1);
		expect(play(duel, "summon fixture-vanilla", "pass", "pass").winner).toBe("rival");
	});
});

describe("Mulcharmy Purulia: during this End Phase", () => {
	it(`${cites("mulcharmy-purulia", "text-end-phase")} ${cites("mulcharmy-purulia", "notes-end-no-chain")} shuffles random cards from the hand into the Deck down to the opponent's cards on the field +6, once, with no Chain Link; with no more than that, nothing happens`, () => {
		const defs = cards();
		// 10 cards in hand after the discard; the rival controls 2 cards: 10 > 2 + 6, so 2 go back.
		const duel = applied(defs, { monsters: ["fixture-big"], set: ["fixture-plain-trap"] }, { hand: [card, ...deckOf(10)], deck: deckOf(3) });
		const end = play(toPhase(duel, "end"), "pass");
		expect(offered(end)).toEqual([`apply ${card}`]);
		const done = play(end, `apply ${card}`);
		expect(done.chain).toEqual([]);
		expect(done.piles.you.hand).toHaveLength(8);
		expect(done.piles.you.deck).toHaveLength(5);
		expect(done.delayed).toEqual([]);
		const few = applied(defs, { monsters: ["fixture-big"], set: ["fixture-plain-trap"] }, { hand: [card, ...deckOf(8)], deck: deckOf(3) });
		expect(offered(play(toPhase(few, "end"), "pass"))).toEqual(["pass"]);
	});
});
