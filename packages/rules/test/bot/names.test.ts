import { describe, expect, it } from "vitest";
import { act, type Action, actionName, findNamed, followLine, legalActions } from "../../src";
import { codes, play, position, REAL_CARDS } from "../rules/fixtures";
import { battleCards } from "../rules/battle-fixtures";

const names = (duel: Parameters<typeof actionName>[0]) => legalActions(duel).map((action) => actionName(duel, action)).sort();

describe("named moves: each action has a stable, human-readable name", () => {
	it("names activations, Summons, Sets and passing", () => {
		const duel = position({ defs: REAL_CARDS, you: { hand: ["terraforming", "normal-4", "mystical-space-typhoon"], deck: ["umi"] }, rival: { set: ["solemn-strike"] } });
		expect(names(duel)).toEqual(["activate mystical-space-typhoon > solemn-strike", "activate terraforming", "pass", "set mystical-space-typhoon", "set normal-4", "set terraforming", "summon normal-4"]);
	});

	it("names a choice asked while an effect resolves", () => {
		const duel = play(position({ defs: REAL_CARDS, you: { hand: ["terraforming"], deck: ["umi", "other-field"] } }), "activate terraforming");
		expect(names(duel)).toEqual(["choose other-field", "choose umi"]);
	});

	it("names attacks on a monster and direct attacks", () => {
		const defs = battleCards();
		const duel = position({ defs, you: { monsters: ["even"] }, rival: { monsters: ["fallen"] }, phase: "battle" });
		expect(names(duel)).toContain("attack even > fallen");
		const open = position({ defs, you: { monsters: ["even"] }, phase: "battle" });
		expect(names(open)).toContain("attack even directly");
	});

	it("finds the action a name stands for, with a zone when the step names one", () => {
		const duel = position({ defs: REAL_CARDS, you: { hand: ["normal-4"] } });
		expect(findNamed(duel, "summon normal-4")).toMatchObject({ type: "summon", zone: 0 });
		const placed = act(duel, findNamed(duel, "summon normal-4 @3")!);
		expect(placed.cards[duel.piles.you.hand[0]!]!.slot).toBe(3);
		expect(findNamed(duel, "summon normal-4 @9")).toBeNull();
		expect(findNamed(duel, "activate terraforming")).toBeNull();
	});
});

describe("combo lines: a list of names followed step by step", () => {
	it("plays a line to its end", () => {
		const duel = position({ defs: REAL_CARDS, you: { hand: ["terraforming", "normal-4"], deck: ["umi", "other-field"] } });
		const result = followLine(duel, ["activate terraforming", "choose umi", "summon normal-4"]);
		expect(result.failed).toBeNull();
		expect(result.played).toBe(3);
		expect(codes(result.duel, "you", "hand")).toEqual(["umi"]);
		expect(codes(result.duel, "you", "monster")).toEqual(["normal-4"]);
	});

	it("fails cleanly at the first step that is not legal, saying which and what was offered", () => {
		const duel = position({ defs: REAL_CARDS, you: { hand: ["terraforming", "normal-4"], deck: ["umi", "other-field"] } });
		const result = followLine(duel, ["summon normal-4", "summon normal-4", "activate terraforming"]);
		expect(result.played).toBe(1);
		expect(result.failed).toMatchObject({ index: 1, step: "summon normal-4" });
		expect(result.failed!.offered).toContain("activate terraforming");
		expect(codes(result.duel, "you", "monster")).toEqual(["normal-4"]);
	});

	it("names stay the same in another duel with other ids", () => {
		const a = position({ defs: REAL_CARDS, you: { hand: ["terraforming"], deck: ["umi"] } });
		const b = position({ defs: REAL_CARDS, you: { hand: ["normal-4", "terraforming"], deck: ["umi"] } });
		const name = (duel: typeof a, code: string) => actionName(duel, legalActions(duel).find((action: Action) => action.type === "activate" && duel.cards[action.card]!.code === code)!);
		expect(name(a, "terraforming")).toBe(name(b, "terraforming"));
	});
});

describe("review fixes (step 9)", () => {
	it("finds the action a step names among several with the same name: the one that can take the zone asked for", () => {
		// A Set Mystical Space Typhoon (no zone to choose) and one in hand (placed in a zone of the player's choice).
		const duel = position({ defs: REAL_CARDS, you: { set: ["mystical-space-typhoon"], hand: ["mystical-space-typhoon"] }, rival: { set: ["solemn-strike"] } });
		const action = findNamed(duel, "activate mystical-space-typhoon > solemn-strike @2");
		expect(action).toMatchObject({ type: "activate", zone: 2 });
		expect(duel.cards[(action as { card: number }).card]!.zone).toBe("hand");
	});
});
