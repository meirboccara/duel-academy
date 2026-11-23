import { describe, expect, it } from "vitest";
import { CARD_DEFS, cites, type CardDef } from "../../src";
import { negationCards } from "./negation-fixtures";
import { codes, play, position, REAL_CARDS } from "./fixtures";

/** Step 6: destruction is an event of its own: a destroyed card is sent to the Graveyard, but a card sent there is not destroyed. */
const watcher = (log: string[]): Record<string, CardDef> => ({
	// "When a Spell/Trap Card is destroyed": a mandatory trigger of a monster on the field.
	"destroy-watcher": {
		code: "destroy-watcher",
		kind: "monster",
		effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "moved" && event.reason === "destroyed", operation: (duel) => (log.push("destroyed"), duel) }],
	},
});

describe("destroying a card", () => {
	it(`${cites("rules", "trigger-effects")} ${cites("rules", "trigger-sent-to-graveyard")} a destroyed Spell is sent to the Graveyard, and a "when destroyed" trigger sees it`, () => {
		const log: string[] = [];
		const defs = { ...REAL_CARDS, ...watcher(log) };
		const start = position({ defs, you: { hand: ["mystical-space-typhoon"], monsters: ["destroy-watcher"] }, rival: { set: ["umi"] } });
		const done = play(start, "activate mystical-space-typhoon > umi", "pass", "pass");
		expect(codes(done, "rival", "graveyard")).toEqual(["umi"]);
		expect(log).toEqual(["destroyed"]);
	});
	// The core's reading of "destroyed": a discard as a cost and a resolved Spell going to the Graveyard are sends, not destruction.
	it("a card sent to the Graveyard without being destroyed is not seen as destroyed", () => {
		const log: string[] = [];
		const defs = { ...REAL_CARDS, ...watcher(log) };
		// Ash Blossom is discarded as its cost; Terraforming goes to the Graveyard once the chain has resolved.
		const start = position({ defs, you: { hand: ["terraforming"], deck: ["umi"], monsters: ["destroy-watcher"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const done = play(start, "activate terraforming", "activate ash-blossom-joyous-spring");
		expect(codes(done, "you", "graveyard")).toEqual(["terraforming"]);
		expect(codes(done, "rival", "graveyard")).toEqual(["ash-blossom-joyous-spring"]);
		expect(log).toEqual([]);
	});
	it(`${cites("rules", "negated-summon-not-from-field")} a Summon negated by Solemn Judgment destroys the monster: it is destroyed, though not sent from the field`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(), ...watcher(log) };
		const start = position({ defs, you: { hand: ["normal-4"] }, rival: { set: ["solemn-judgment"], monsters: ["destroy-watcher"] } });
		const done = play(start, "summon normal-4", "activate solemn-judgment");
		expect(codes(done, "you", "graveyard")).toEqual(["normal-4"]);
		expect(log).toEqual(["destroyed"]);
	});
});
