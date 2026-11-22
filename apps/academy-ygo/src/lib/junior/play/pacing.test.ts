import type { GameEvent } from "@duel-academy/engine";
import { describe, expect, it } from "vitest";
import { RIVAL_BEATS, rivalPause, turnBeat } from "./pacing";

/** The rival's turn, paced as card games on screen pace the opponent's (docs/research/opponent-turn-presentation.md). */
describe("the pause after each step of the rival's turn", () => {
	it("is longest for a card it activates, then a new turn, an attack, a phase or a Summon", () => {
		expect(rivalPause([{ type: "activated", side: "rival", card: "pot-of-greed" }], true)).toBe(RIVAL_BEATS.activation);
		expect(rivalPause([{ type: "turn", side: "rival" }], true)).toBe(RIVAL_BEATS.turn);
		expect(rivalPause([{ type: "attack-declared", side: "rival", attacker: "iron-boar", target: null }], true)).toBe(RIVAL_BEATS.attack);
		expect(rivalPause([{ type: "phase", side: "rival", phase: "battle" }], true)).toBe(RIVAL_BEATS.phase);
		expect(rivalPause([{ type: "summoned", side: "rival", card: "iron-boar", zone: 0, tributes: [] }], true)).toBe(RIVAL_BEATS.summon);
		expect(RIVAL_BEATS.activation).toBeGreaterThan(RIVAL_BEATS.turn);
		expect(RIVAL_BEATS.turn).toBeGreaterThan(RIVAL_BEATS.phase);
	});
	it("takes the longest beat when one step does several things", () => {
		expect(rivalPause([{ type: "phase", side: "rival", phase: "main1" }, { type: "activated", side: "rival", card: "pot-of-greed" }], true)).toBe(RIVAL_BEATS.activation);
	});
	it("is short when nothing is shown moving, but still lets an activation be read", () => {
		expect(rivalPause([{ type: "phase", side: "rival", phase: "battle" }], false)).toBe(RIVAL_BEATS.still);
		expect(rivalPause([{ type: "activated", side: "rival", card: "pot-of-greed" }], false)).toBe(RIVAL_BEATS.activation);
	});
});

describe("the banner of a step", () => {
	it("names a new turn first, then a phase, for either player", () => {
		expect(turnBeat([{ type: "phase", side: "rival", phase: "end" }, { type: "turn", side: "you" }])).toEqual({ kind: "turn", side: "you" });
		expect(turnBeat([{ type: "phase", side: "rival", phase: "battle" }])).toEqual({ kind: "phase", side: "rival", phase: "battle" });
		expect(turnBeat([{ type: "drew", side: "rival", card: "iron-boar" }])).toBeNull();
	});
});
