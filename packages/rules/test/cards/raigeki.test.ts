import { describe, expect, it } from "vitest";
import { cites, type GameEvent } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const card = "raigeki";

describe("Raigeki, written as an effect record", () => {
	it(`${cites("raigeki", "text")} destroys all monsters the opponent controls, at the same time, and none of yours; the destruction is Raigeki's effect`, () => {
		const start = position({ defs, you: { hand: [card], monsters: ["normal-4"] }, rival: { monsters: ["normal-4-b", "effect-4"], extraZone: ["normal-6"] } });
		const done = play(start, `activate ${card}`);
		expect(codes(done, "rival", "monster")).toEqual([]);
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["effect-4", "normal-4-b", "normal-6"]);
		expect(codes(done, "you", "monster")).toEqual(["normal-4"]);
		expect(codes(done, "you", "graveyard")).toEqual([card]);
	});
	it(`${cites("raigeki", "text")} attributes each destruction to its effect and moves them as one batch`, () => {
		const start = position({ defs, options: { everyWindow: true }, you: { hand: [card] }, rival: { monsters: ["normal-4-b", "effect-4"] } });
		const resolved = play(start, `activate ${card}`, "pass", "pass");
		const destroyed = resolved.live.filter((event): event is Extract<GameEvent, { type: "moved" }> => event.type === "moved" && event.reason === "destroyed");
		expect(destroyed).toHaveLength(2);
		expect(new Set(destroyed.map((event) => event.batch)).size).toBe(1);
		expect(destroyed.every((event) => event.destruction?.cause === "effect" && event.destruction.source.code === card && event.destruction.player === "you")).toBe(true);
	});
	it(`${cites("raigeki", "notes-activation")} can be activated only while the opponent has a monster in their Monster Zone`, () => {
		expect(offered(position({ defs, you: { hand: [card], monsters: ["normal-4"] } }))).not.toContain(`activate ${card}`);
		expect(offered(position({ defs, you: { hand: [card] }, rival: { facedown: ["normal-4"] } }))).toContain(`activate ${card}`);
	});
	it(`${cites("raigeki", "notes-all-positions")} destroys the monsters there when it resolves, in every battle position, face-down ones included`, () => {
		const start = position({ defs, you: { hand: [card] }, rival: { monsters: ["normal-4"], defense: ["normal-4-b"], facedown: ["effect-4"] } });
		const done = play(start, `activate ${card}`);
		expect(codes(done, "rival", "monster")).toEqual([]);
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["effect-4", "normal-4", "normal-4-b"]);
	});
});
