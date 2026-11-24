import { describe, expect, it } from "vitest";
import { cites, costDestruction, createDuel, destroyCard, equip, moveCard, type GameEvent, type CardDef, type Destruction } from "../../src";
import { play, position, REAL_CARDS } from "./fixtures";

/**
 * Synthetic watcher, not a real card: its matcher records the attribution carried by destruction events. Matchers may run in dry
 * runs, so equal attributions are kept once.
 */
const watcher = (log: Map<string, Destruction>): Record<string, CardDef> => ({
	"destruction-watcher": {
		code: "destruction-watcher",
		kind: "monster",
		effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => {
			if (event.type !== "moved" || event.reason !== "destroyed") return false;
			if (event.destruction) log.set(JSON.stringify(event.destruction), event.destruction);
			return true;
		}, operation: (duel) => duel }],
	},
});

describe("destruction provenance", () => {
	it(`${cites("mystical-space-typhoon", "text")} keeps MST's activated instance and controller after the chain resolves`, () => {
		const log = new Map<string, Destruction>();
		const start = position({ defs: { ...REAL_CARDS, ...watcher(log) }, you: { hand: ["mystical-space-typhoon"] }, rival: { set: ["umi"], monsters: ["destruction-watcher"] } });
		play(start, "activate mystical-space-typhoon > umi", "pass", "pass");
		expect([...log.values()]).toEqual([{ cause: "effect", player: "you", effect: 0, source: expect.objectContaining({ id: 1, code: "mystical-space-typhoon", controller: "you", zone: "spell", face: "up" }) }]);
	});
	it(`${cites("solemn-judgment", "text")} attributes a negated activation's destruction to Judgment, not its victim`, () => {
		const log = new Map<string, Destruction>();
		const start = position({ defs: { ...REAL_CARDS, ...watcher(log) }, you: { hand: ["mystical-space-typhoon"] }, rival: { set: ["solemn-judgment", "umi"], monsters: ["destruction-watcher"] } });
		play(start, "activate mystical-space-typhoon > umi", "activate solemn-judgment", "pass", "pass");
		expect([...log.values()]).toEqual([{ cause: "effect", player: "rival", effect: 0, source: expect.objectContaining({ code: "solemn-judgment", controller: "rival" }) }]);
	});
	it("keeps a destruction paid as a cost apart from an effect destruction (synthetic cost fixture)", () => {
		const log = new Map<string, Destruction>();
		// Synthetic test card: "destroy 1 Spell/Trap you control" as an activation cost; not a registered real card.
		const coster: CardDef = { code: "cost-destroyer", kind: "spell", effects: [{ type: "activation", cost: (duel, ctx) => {
			const paid = duel.piles[ctx.player].spell.find((id) => id !== ctx.card.id);
			return paid === undefined ? null : destroyCard(duel, paid, { destruction: costDestruction(ctx) });
		}, operation: (duel) => duel }] };
		const start = position({ defs: { ...REAL_CARDS, ...watcher(log), [coster.code]: coster }, you: { hand: [coster.code], set: ["terraforming"], monsters: ["destruction-watcher"] } });
		play(start, `activate ${coster.code}`);
		expect([...log.values()]).toEqual([{ cause: "cost", player: "you", source: expect.objectContaining({ code: coster.code, controller: "you", zone: "spell" }) }]);
	});
	it("labels the Equip Card's rule destruction as a game mechanic, not as the effect that destroyed its monster", () => {
		const defs: Record<string, CardDef> = { monster: { code: "monster", kind: "monster" }, gear: { code: "gear", kind: "spell", facts: { icon: "equip" } }, listener: { code: "listener", kind: "monster", effects: [{ type: "quick", range: "hand", event: () => false, operation: (board) => board }] } };
		let duel = createDuel({ seed: 1, you: { deck: ["monster", "gear"] }, rival: { deck: [] }, defs });
		const gear = Object.values(duel.cards).find((card) => card.code === "gear")!.id;
		const monster = Object.values(duel.cards).find((card) => card.code === "monster")!.id;
		duel = equip(moveCard(moveCard(duel, monster, { zone: "monster" }), gear, { zone: "spell" }), gear, monster);
		const done = destroyCard(duel, monster, { destruction: { cause: "effect", source: duel.cards[monster]!, player: "you", effect: 0 } });
		const destroyed = done.live.filter((event): event is Extract<GameEvent, { type: "moved" }> => event.type === "moved" && event.reason === "destroyed");
		expect(destroyed.map((event) => [event.after.code, event.destruction?.cause])).toEqual([["monster", "effect"], ["gear", "game-mechanic"]]);
	});
});

describe("destruction always says what destroyed it (review)", () => {
	const defs: Record<string, CardDef> = { victim: { code: "victim", kind: "monster" } };
	const board = () => moveCard(createDuel({ seed: 1, you: { deck: ["victim"] }, rival: { deck: [] }, defs }), 1, { zone: "monster" });
	it("refuses a move that destroys with no attribution", () => {
		expect(() => moveCard(board(), 1, { zone: "graveyard", reason: "destroyed" })).toThrow(/attribution/);
	});
	it("refuses an attribution on a move that is not a destruction", () => {
		expect(() => moveCard(board(), 1, { zone: "graveyard", destruction: { cause: "game-mechanic" } })).toThrow(/destroyed/);
	});
});
