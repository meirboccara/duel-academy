import { describe, expect, it } from "vitest";
import { act, type CardDef, cardsIn, cites, type Duel, type EffectRecord, moveCard } from "../../src";
import { offered, plainCards, play, position, recordCards } from "./fixtures";

/**
 * Step 4: the five once-per-turn scopes, as a player sees them through `legalActions` and `act`. A scope is read from
 * the wording printed on a card; where Konami's pages are silent on what a wording does, the test says so.
 */
const options = { everyWindow: true };
const count = (duel: Duel, line: string) => offered(duel).filter((label) => label === line).length;
/** Both players pass until it is `player`'s Main Phase 1 of a later turn. */
function untilTurn(duel: Duel, number: number): Duel {
	let next = duel;
	for (let guard = 0; guard < 200 && !(next.turn.number === number && next.turn.phase === "main1" && next.chain.length === 0 && next.priority.open); guard++) next = act(next, { type: "pass" });
	return next;
}
const defsWith = (log: string[] = []) => ({ ...plainCards(log), ...recordCards(log) });

describe("once per turn: \"Once per turn:\" is per copy", () => {
	it(`${cites("rules", "once-instance-wording")} lets each copy use the effect once`, () => {
		const log: string[] = [];
		const start = position({ defs: defsWith(log), options, you: { monsters: ["once-instance", "once-instance"] } });
		expect(count(start, "activate once-instance")).toBe(2);
		const used = play(start, "activate once-instance", "pass", "pass");
		expect(log).toEqual(["once-instance"]);
		expect(count(used, "activate once-instance")).toBe(1);
		const both = play(used, "activate once-instance", "pass", "pass");
		expect(count(both, "activate once-instance")).toBe(0);
	});
	// A choice, not a ruling: the wording "Once per turn:" does not say whether two effects of one card share the limit; the core
	// gives each effect of a card its own (YGOProJudge, no source cited, answers per copy only).
	it("keeps the limit apart for each of a card's own effects (a choice, no Konami record)", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-two"] } });
		expect(count(start, "activate once-two")).toBe(2);
		const used = play(start, "activate once-two", "pass", "pass");
		expect(count(used, "activate once-two")).toBe(1);
	});
	// No Konami page found says it: YGOProJudge (the owner's rules site, no source cited) says a copy that leaves and comes
	// back "forgets its history"; the core reads it as the 2021 "new card" rule, which step 1 models with `moves`.
	it("gives a card that became a new card a new use (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-instance"] } });
		const used = play(start, "activate once-instance", "pass", "pass");
		expect(count(used, "activate once-instance")).toBe(0);
		const id = cardsIn(used, "you", "monster")[0]!.id;
		const back = moveCard(moveCard(used, id, { zone: "hand" }), id, { zone: "monster", face: "up" });
		expect(count(back, "activate once-instance")).toBe(1);
	});
	it(`${cites("rules", "once-instance-wording")} lifts the limit when the next turn comes`, () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-instance"] } });
		const used = play(start, "activate once-instance", "pass", "pass");
		expect(count(used, "activate once-instance")).toBe(0);
		expect(count(untilTurn(used, 5), "activate once-instance")).toBe(1);
	});
	// No Konami page says it either; YGOProJudge says a negated activation still counts for "Once per turn:".
	it("does not give the use back when the activation is negated (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-instance"] }, rival: { set: ["counter"] } });
		const negated = play(start, "activate once-instance", "activate counter", "pass", "pass");
		expect(count(negated, "activate once-instance")).toBe(0);
	});
});

describe("once per turn: \"You can only use this effect of [name] once per turn\" is by name, per player, spent at activation", () => {
	it(`${cites("rules", "once-name-wording")} ${cites("rules", "once-name-second-copy")} blocks every copy of the name once one has been used`, () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-name", "once-name"] }, rival: { monsters: ["once-name"] } });
		expect(count(start, "activate once-name")).toBe(2);
		const used = play(start, "activate once-name");
		// Yours are spent (the rival's copy is theirs, see the next test).
		expect(offered(used).filter((label) => label === "activate once-name")).toHaveLength(1);
	});
	// YGOProJudge (no source cited): the limit is tracked per player; the wording names the card, not the player. Konami's
	// fid 24139 speaks of "I" having used the effect, which is consistent but does not say the rival's copy is free.
	it("keeps the limit apart for each player (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-name"] }, rival: { monsters: ["once-name"] } });
		const used = play(start, "activate once-name");
		const rival = play(used, "activate once-name", "pass", "pass");
		expect(count(rival, "activate once-name")).toBe(0);
		expect(count(used, "activate once-name")).toBe(1);
	});
	// An analogy: Konami's Q&A fid 23336 says a once-per-Duel "use" stays used when the activation is negated
	// (rule record duel-use-spent-even-if-negated); no page found says it of the per-turn wording.
	it("keeps the use when the activation is negated (analogy to the Duel Q&A, no per-turn record)", () => {
		const negated = play(position({ defs: defsWith(), options, you: { monsters: ["once-name", "once-name"] }, rival: { set: ["counter"] } }), "activate once-name", "activate counter", "pass", "pass");
		expect(count(negated, "activate once-name")).toBe(0);
	});
	// Derived: the Ice Bell Q&A says an activation whose effect was negated was still made, and a "use" is spent at activation.
	it(`${cites("rules", "effect-negated-still-activated")} keeps the use when only the effect is negated`, () => {
		const effectNegated = play(position({ defs: defsWith(), options, you: { monsters: ["once-name", "once-name"] }, rival: { hand: ["effect-negator"] } }), "activate once-name", "activate effect-negator", "pass", "pass");
		expect(count(effectNegated, "activate once-name")).toBe(0);
	});
	// A mechanism of the core for "You can only use 1 [name] effect per turn"; no card text of this wording was read.
	it("lets effects that share a key use the limit once between them", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-shared"] } });
		expect(count(start, "activate once-shared")).toBe(2);
		const used = play(start, "activate once-shared", "pass", "pass");
		expect(count(used, "activate once-shared")).toBe(0);
	});
	// One limit has one count: two effects that share a key and do not allow the same number of uses are a mistake in the cards.
	it("refuses effects that share a key but not the number of uses it allows (a definition error), and counts a shared \"twice per turn\" between them", () => {
		const shared = (code: string, first: number | undefined, second: number | undefined): CardDef => ({
			code,
			kind: "monster",
			effects: [first, second].map((times): EffectRecord => ({ type: "quick", range: "field", once: { scope: "name", key: code, ...(times === undefined ? {} : { times }) }, operation: (duel) => duel })),
		});
		const mixed = position({ defs: { ...defsWith(), "once-mixed": shared("once-mixed", 2, undefined) }, options, you: { monsters: ["once-mixed"] } });
		expect(() => offered(mixed)).toThrow(/once-mixed.*share.*once-mixed.*times/);
		// The same count on both: two uses between them, whichever effect is used.
		const start = position({ defs: { ...defsWith(), "once-pair": shared("once-pair", 2, 2) }, options, you: { monsters: ["once-pair"] } });
		expect(count(start, "activate once-pair")).toBe(2);
		const once = play(start, "activate once-pair", "pass", "pass");
		expect(count(once, "activate once-pair")).toBe(2);
		expect(count(play(once, "activate once-pair", "pass", "pass"), "activate once-pair")).toBe(0);
	});
	// The core's reading: a card that came back is a new card (step 1), and Q&A fid 24139 blocks a new second copy.
	it("counts a card that came back as the same name, and lifts the limit with the turn", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-name"] } });
		const used = play(start, "activate once-name", "pass", "pass");
		const id = cardsIn(used, "you", "monster")[0]!.id;
		const back = moveCard(moveCard(used, id, { zone: "hand" }), id, { zone: "monster", face: "up" });
		expect(count(back, "activate once-name")).toBe(0);
		expect(count(untilTurn(used, 5), "activate once-name")).toBe(1);
	});
	it(`${cites("rules", "once-name-wording")} applies to a trigger put on a chain: two copies sent together activate once`, () => {
		const log: string[] = [];
		const start = position({ defs: { ...defsWith(log), sweep: recordCards(log).sweep! }, options, you: { hand: ["sweep"], monsters: ["once-trigger", "once-trigger"] } });
		const asked = play(start, "activate sweep", "pass", "pass");
		expect(offered(asked)).toEqual(["activate once-trigger", "activate once-trigger"]);
		const chained = play(asked, "activate once-trigger");
		expect(chained.chain.map((link) => link.card.code)).toEqual(["once-trigger"]);
		const done = play(chained, "pass", "pass");
		expect(log).toEqual(["sweep", "once-trigger"]);
		expect(done.chain).toEqual([]);
	});
});

describe("once per turn: \"You can only activate 1 [name] per turn\" is given back when the activation is negated", () => {
	const twoCopies = (rival: Parameters<typeof position>[0]["rival"] = {}) => position({ defs: defsWith(), options, you: { hand: ["once-activation", "once-activation"] }, rival });
	it(`${cites("rules", "once-activation-wording")} blocks the second copy once the first has been activated`, () => {
		const used = play(twoCopies(), "activate once-activation", "pass", "pass");
		expect(count(used, "activate once-activation")).toBe(0);
	});
	// The Q&A says only an activation that was not negated blocks a second one, so a negated one does not (an implication,
	// not an outright sentence). Konami's fid 11730 (Great Shogun Shien's "activate 1 Spell/Trap each turn") says the same of that
	// other limit: an analogy only.
	it(`${cites("rules", "once-activation-wording")} ${cites("rules", "activate-one-unless-negated")} gives the use back when the activation is negated`, () => {
		const negated = play(twoCopies({ set: ["counter"] }), "activate once-activation", "activate counter", "pass", "pass");
		expect(count(negated, "activate once-activation")).toBe(1);
	});
	it(`${cites("rules", "effect-negated-still-activated")} keeps the use when only the effect is negated`, () => {
		const negated = play(twoCopies({ hand: ["effect-negator"] }), "activate once-activation", "activate effect-negator", "pass", "pass");
		expect(count(negated, "activate once-activation")).toBe(0);
	});
});

describe("once per turn: once per Duel and once per Chain", () => {
	it(`${cites("rules", "once-duel-wording")} is never lifted by a new turn`, () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-duel"] } });
		const used = play(start, "activate once-duel", "pass", "pass");
		expect(count(untilTurn(used, 5), "activate once-duel")).toBe(0);
	});
	it(`${cites("rules", "duel-use-spent-even-if-negated")} keeps the Duel use when the activation is negated`, () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-duel"] }, rival: { set: ["counter"] } });
		const negated = play(start, "activate once-duel", "activate counter", "pass", "pass");
		expect(count(untilTurn(negated, 5), "activate once-duel")).toBe(0);
	});
	it(`${cites("rules", "duel-per-player-control")} ${cites("rules", "duel-per-player-effect-used")} keeps the Duel limit apart for each player`, () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-duel"] }, rival: { monsters: ["once-duel"] } });
		const used = play(start, "activate once-duel", "pass", "pass");
		const rivalsTurn = untilTurn(used, 4);
		expect(rivalsTurn.turn.player).toBe("rival");
		expect(count(rivalsTurn, "activate once-duel")).toBe(1);
	});
	it(`${cites("rules", "once-chain-wording")} allows one use in a chain, and another in the next chain of the same turn`, () => {
		const log: string[] = [];
		const start = position({ defs: defsWith(log), options, you: { monsters: ["once-chain", "once-chain"] }, rival: { monsters: ["once-chain"] } });
		const first = play(start, "activate once-chain", "pass");
		// Same chain: your other copy is spent.
		expect(count(first, "activate once-chain")).toBe(0);
		const resolved = play(first, "pass");
		expect(log).toEqual(["once-chain"]);
		expect(resolved.chain).toEqual([]);
		// The chain is over: the limit is lifted, the same turn.
		expect(resolved.turn.number).toBe(start.turn.number);
		expect(count(untilOpen(resolved), "activate once-chain")).toBe(2);
	});
});

/** Both players pass until the game state is open again. */
function untilOpen(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && !next.priority.open; guard++) next = act(next, { type: "pass" });
	return next;
}


// YGOProJudge (no source cited): the Chain limit is per player, so the rival's own copy may join the chain.
describe("once per Chain, for each player", () => {
	it("lets the rival's copy join a chain that already holds yours (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs: defsWith(), options, you: { monsters: ["once-chain"] }, rival: { monsters: ["once-chain"] } });
		expect(count(play(start, "activate once-chain"), "activate once-chain")).toBe(1);
	});
});
