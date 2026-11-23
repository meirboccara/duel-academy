import { describe, expect, it } from "vitest";
import { act, type Action, actionName, type CardDef, chooseAction, decide, decider, type DeckPlan, type Progress, type Duel, evaluate, legalActions, type Level, LEVELS, moveCard, sameAction, type Side } from "../../src";
import { codes, play, position, REAL_CARDS } from "../rules/fixtures";

/** Is `action` one of the actions listed (zone and position aside, which `act` checks against the listing)? */
const listed = (duel: Duel, action: Action) => legalActions(duel).some((legal) => sameAction(legal, action));

const openState = (): Duel => position({ defs: REAL_CARDS, you: { hand: ["terraforming", "normal-4", "mystical-space-typhoon"], deck: ["umi", "other-field"] }, rival: { hand: ["ash-blossom-joyous-spring", "normal-4"], set: ["solemn-strike"], deck: ["normal-4", "umi"] } });

describe("chooseAction: always a legal action of the side that decides", () => {
	const decisions: [string, () => Duel, Side][] = [
		["an open state of its own turn", openState, "you"],
		["a chain to answer, for the opponent", () => play(openState(), "activate terraforming"), "rival"],
		["a choice while an effect resolves", () => play(position({ defs: REAL_CARDS, you: { hand: ["terraforming"], deck: ["umi", "other-field"] } }), "activate terraforming"), "you"],
	];
	for (const [what, make, side] of decisions) {
		for (const level of LEVELS) {
			it(`${what}, ${level}`, () => {
				const duel = make();
				const action = chooseAction(duel, side, { level, seed: 1 });
				expect(listed(duel, action)).toBe(true);
				expect(typeof actionName(duel, action)).toBe("string");
			});
		}
	}

	it("refuses to decide for a side that does not hold the decision", () => {
		expect(() => chooseAction(openState(), "rival", { level: "basic", seed: 1 })).toThrow(/does not hold/);
	});
});

describe("chooseAction: deterministic", () => {
	const still = () => 0;
	it("gives the same answer for the same duel and seed, at every level", () => {
		for (const level of LEVELS) {
			const a = chooseAction(openState(), "you", { level, seed: 9, now: still });
			const b = chooseAction(openState(), "you", { level, seed: 9, now: still });
			expect(b).toEqual(a);
		}
	});
});

/**
 * A fixed position where hidden information decides: two Spells, only one of which can be activated this turn. "call-big" Special
 * Summons a 3000 ATK monster from the Deck, which Ash Blossom & Joyous Spring can negate; "call-small" a 2000 ATK monster from the
 * hand, which it cannot. Played as if nobody answers, "call-big" is better; against a likely Ash Blossom, "call-small" is.
 */
const call = (code: string, target: string, from: "deck" | "hand", category: string): CardDef => ({
	code,
	kind: "spell",
	effects: [
		{
			type: "activation",
			categories: [category],
			once: { scope: "activation", key: "call" },
			condition: (duel, { player }) => duel.piles[player][from].some((id) => duel.cards[id]!.code === target),
			operation: (duel, link) => {
				const id = duel.piles[link.player][from].find((card) => duel.cards[card]!.code === target);
				return id === undefined ? duel : moveCard(duel, id, { zone: "monster", face: "up" });
			},
		},
	],
});
const HIDDEN_DEFS: Record<string, CardDef> = {
	...REAL_CARDS,
	big: { code: "big", kind: "monster", facts: { level: 8, atk: 3000, def: 0 } },
	small: { code: "small", kind: "monster", facts: { level: 8, atk: 2000, def: 0 } },
	"call-big": call("call-big", "big", "deck", "summon-from-deck"),
	"call-small": call("call-small", "small", "hand", "summon"),
};
/** The rival holds one card; its Deck is the rest of a pool of five Ash Blossoms and one Normal Monster. */
const handTrapLikely = (rivalHand: string, rivalDeck: string[]): Duel =>
	position({ defs: HIDDEN_DEFS, you: { hand: ["call-big", "call-small", "small"], deck: ["big", "normal-4"] }, rival: { hand: [rivalHand], deck: rivalDeck } });
const ASH = "ash-blossom-joyous-spring";

describe("expert: determinized sampling finds what playing as if nobody answers misses", () => {
	const still = () => 0;
	it("basic calls the big monster; expert, expecting Ash Blossom in five worlds of six, calls the small one", () => {
		const duel = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		const name = (level: Level) => actionName(duel, chooseAction(duel, "you", { level, seed: 3, now: still }));
		expect(name("basic")).toBe("activate call-big");
		expect(name("strong")).toBe("activate call-big");
		expect(name("expert")).toBe("activate call-small");
	});

	it("is clearly better: against the Ash Blossom really held, the expert's move leaves the better board", () => {
		const duel = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		const after = (level: Level) => {
			let next = act(duel, chooseAction(duel, "you", { level, seed: 3, now: still }));
			// The rival answers with Ash Blossom when it can; the chain then resolves.
			if (decider(next) === "rival") next = act(next, chooseAction(next, "rival", { level: "expert", seed: 3, now: still }));
			while (decider(next) !== null && !(next.priority.open && next.chain.length === 0 && decider(next) === "you")) next = act(next, legalActions(next)[0]!);
			return evaluate(next, "you");
		};
		expect(after("expert")).toBeGreaterThan(after("basic") + 3);
	});

	it("never peeks: Ash Blossom in the rival's hand or in its Deck, the expert's answer is the same", () => {
		const inHand = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		const inDeck = handTrapLikely("normal-4", [ASH, ASH, ASH, ASH, ASH]);
		const choice = (duel: Duel) => actionName(duel, chooseAction(duel, "you", { level: "expert", seed: 3, now: still }));
		expect(choice(inDeck)).toBe(choice(inHand));
	});
});

describe("combo lines as data, by level", () => {
	const still = () => 0;
	const lineBoard = (rivalHand: string[] = []) => position({ defs: REAL_CARDS, you: { hand: ["terraforming", "normal-4"], deck: ["umi", "other-field"] }, rival: { hand: rivalHand, deck: ["normal-4"] } });
	const PLAN: DeckPlan = {
		lines: [
			{ name: "main", steps: ["activate terraforming", "choose umi", "summon normal-4"] },
			{ name: "ashed", steps: ["activate terraforming", "summon normal-4"] },
		],
	};

	it("basic plays no line; medium starts the main line where greedy play would not", () => {
		const duel = lineBoard();
		const plan: DeckPlan = { lines: [{ name: "summon first", steps: ["summon normal-4", "activate terraforming"] }] };
		expect(decide(duel, "you", { level: "basic", plan, seed: 1, now: still }).name).not.toBe("summon normal-4");
		const medium = decide(duel, "you", { level: "medium", plan, seed: 1, now: still });
		expect(medium).toMatchObject({ name: "summon normal-4", via: "line", progress: { line: "summon first", step: 1 } });
	});

	it("medium follows the main line to its end, one decision at a time, the progress handed back", () => {
		let duel = lineBoard();
		let progress: Progress | null = null;
		const names: string[] = [];
		for (let i = 0; i < 3; i++) {
			const decision = decide(duel, "you", { level: "medium", plan: PLAN, progress, seed: 1, now: still });
			names.push(decision.name);
			progress = decision.progress;
			duel = act(duel, decision.action);
		}
		expect(names).toEqual(["activate terraforming", "choose umi", "summon normal-4"]);
		expect(codes(duel, "you", "hand")).toEqual(["umi"]);
	});

	/** Terraforming activated by the line, then negated by the rival's Ash Blossom: "choose umi" never comes. */
	const ashed = (level: Level) => {
		let duel = lineBoard([ASH]);
		const first = decide(duel, "you", { level, plan: PLAN, seed: 1, now: still });
		duel = play(act(duel, first.action), `activate ${ASH}`);
		return decide(duel, "you", { level, plan: PLAN, progress: first.progress, seed: 1, now: still });
	};

	it("medium drops the line where it fails and plays on greedily", () => {
		const decision = ashed("medium");
		expect(decision.via).toBe("greedy");
		expect(decision.name).toBe("set normal-4");
		expect(decision.progress).toMatchObject({ line: "main", over: true });
	});

	it("strong switches to the line written for that interruption, which shares the steps played", () => {
		expect(ashed("strong")).toMatchObject({ name: "summon normal-4", via: "line", progress: { line: "ashed", step: 2 } });
	});
});

describe("the time budget", () => {
	it("falls back to the quick choice when the time is already gone", () => {
		let clock = 0;
		const late = () => (clock += 1000);
		const duel = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		const decision = decide(duel, "you", { level: "expert", budgetMs: 10, seed: 3, now: late });
		expect(decision.via).toBe("quick");
		expect(legalActions(duel).some((legal) => sameAction(legal, decision.action))).toBe(true);
	});

	it("keeps the greedy answer when the time runs out during the sampling", () => {
		let clock = 0;
		const ticking = () => (clock += 1);
		const duel = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		// One tick to start, one per action ranked, then two of the four candidates of the first world: no world is complete.
		const decision = decide(duel, "you", { level: "expert", budgetMs: legalActions(duel).length + 2, seed: 3, now: ticking });
		expect(decision.via).toBe("greedy");
		expect(decision.name).toBe("activate call-big");
	});

	it("answers in time on the real clock", () => {
		const duel = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		const start = performance.now();
		chooseAction(duel, "you", { level: "expert", budgetMs: 50, seed: 3 });
		expect(performance.now() - start).toBeLessThan(500);
	});
});

describe("bot against bot", () => {
	it("plays two turns of a midgame board with real cards, every move legal, at every level", async () => {
		const { HAND_TRAP_MIDGAME } = await import("../../bench/bot-boards");
		for (const level of LEVELS) {
			let duel = HAND_TRAP_MIDGAME();
			const progress: Record<Side, Progress | null> = { you: null, rival: null };
			let moves = 0;
			while (duel.turn.number <= 4 && !duel.winner && moves < 300) {
				const side = decider(duel)!;
				const decision = decide(duel, side, { level, seed: moves, progress: progress[side], budgetMs: 2000 });
				progress[side] = decision.progress;
				duel = act(duel, decision.action);
				moves++;
			}
			expect(duel.turn.number > 4 || duel.winner !== null).toBe(true);
		}
	}, 60_000);
});

describe("review fixes (step 9)", () => {
	it("stops a playout as soon as the time is up, rather than playing it to its end", () => {
		// Time is work here: the clock reads how many listings have been made. "ticker" (one on each side) has a Quick Effect whose
		// condition every listing reads, and never holds.
		let work = 0;
		const ticker: CardDef = { code: "ticker", kind: "monster", facts: { level: 1, atk: 0, def: 0 }, effects: [{ type: "quick", range: "field", condition: () => (work++, false), operation: (d) => d }] };
		const duel = position({ defs: { ...HIDDEN_DEFS, ticker }, you: { hand: ["call-big", "call-small", "small"], monsters: ["ticker"], deck: ["big", "normal-4"] }, rival: { hand: [ASH], monsters: ["ticker"], deck: [ASH, ASH, ASH, ASH, "normal-4"] } });
		const clock = () => work;
		// The greedy ranking alone (strong, no plan) costs this much work; the budget ends a little after it, inside the first playout.
		work = 0;
		decide(duel, "you", { level: "strong", seed: 3, now: clock, budgetMs: 1e9 });
		const ranking = work;
		work = 0;
		const decision = decide(duel, "you", { level: "expert", seed: 3, now: clock, budgetMs: ranking + 5 });
		expect(decision.via).toBe("greedy");
		expect(work - (ranking + 5)).toBeLessThan(10);
	});

	it("compares the line's step with as many greedy candidates as asked", () => {
		// With one candidate asked for, the line's step is still compared with one other move, not with none.
		const duel = handTrapLikely(ASH, [ASH, ASH, ASH, ASH, "normal-4"]);
		const plan: DeckPlan = { lines: [{ name: "big", steps: ["activate call-big"] }] };
		const decision = decide(duel, "you", { level: "expert", plan, candidates: 1, seed: 3, now: () => 0 });
		expect(decision).toMatchObject({ name: "activate call-small", via: "sample" });
	});
});
