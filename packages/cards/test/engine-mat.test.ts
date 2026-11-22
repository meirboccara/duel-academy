import { describe, expect, it } from "vitest";
import { EXTRA_ZONE, apply, atkOf, board, defOf, legalMoves, type Board, type Move } from "@duel-academy/engine";

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`rejected: ${result.reason}`);
	return result;
}
function reason(state: Board, move: Move) {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
}
const cards = (state: Board, who: "you" | "rival") => state[who].monsters.map((slot) => slot?.card ?? null);

describe("the whole mat", () => {
	it("has five Main Monster Zones, five Spell & Trap Zones and one Extra Monster Zone per player", () => {
		const state = board({ full: true });
		expect(state.you.monsters).toHaveLength(6);
		expect(state.you.backrow).toHaveLength(5);
		expect(EXTRA_ZONE).toBe(5);
	});
	it("keeps the small board at three zones", () => {
		const state = board();
		expect(state.you.monsters).toHaveLength(3);
		expect(state.you.backrow).toHaveLength(3);
	});
	it("takes a Normal Summon in any Main Monster Zone, never in the Extra Monster Zone", () => {
		const state = board({ full: true, you: { hand: ["river-otter"] } });
		expect(reason(state, { type: "place", card: "river-otter", row: "monsters", zone: EXTRA_ZONE })).toBe("extra-zone");
		expect(cards(ok(state, { type: "place", card: "river-otter", row: "monsters", zone: 4 }).board, "you")[4]).toBe("river-otter");
	});
});

describe("the Graveyard", () => {
	const start = () => board({ full: true, you: { hand: ["monster-reborn"], graveyard: ["pocket-cub", "glow-charm"] }, rival: { graveyard: ["storm-stag"] } });
	it("gives a monster back: Monster Reborn Special Summons it without using the Normal Summon", () => {
		const { board: after, events } = ok(start(), { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 0 } });
		expect(cards(after, "you")[0]).toBe("pocket-cub");
		expect(after.you.graveyard).toEqual(["glow-charm", "monster-reborn"]);
		expect(after.summonUsed).toBe(false);
		expect(events).toContainEqual({ type: "special", side: "you", card: "pocket-cub", zone: 0, how: "revive", materials: [], from: "you" });
	});
	it('says "either GY": a monster in the opponent\'s Graveyard may be taken', () => {
		const { board: after } = ok(start(), { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "rival", index: 0 } });
		expect(cards(after, "you")[0]).toBe("storm-stag");
		expect(after.rival.graveyard).toEqual([]);
	});
	it("targets a monster: a Spell in the Graveyard, or nothing, is refused", () => {
		expect(reason(start(), { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 1 } })).toBe("no-target");
		expect(reason(start(), { type: "place", card: "monster-reborn", row: "backrow", zone: 0 })).toBe("no-target");
	});
	it("lists every monster of both Graveyards as a move", () => {
		const revivals = legalMoves(start()).filter((move) => move.type === "place" && move.grave);
		expect(revivals).toHaveLength(2);
	});
});

describe("the Field Zone", () => {
	const start = () => board({ full: true, you: { hand: ["mountain", "glow-charm"], monsters: ["lantern-owl", "river-otter"] }, rival: { monsters: ["lantern-owl"] } });
	it("holds a Field Spell, which stays on the field", () => {
		const { board: after, events } = ok(start(), { type: "place", card: "mountain", row: "field", zone: 0 });
		expect(after.you.field).toBe("mountain");
		expect(after.you.graveyard).toEqual([]);
		expect(events.map((event) => event.type)).toEqual(["activated", "field"]);
	});
	it("is the only place for a Field Spell, and takes nothing else", () => {
		expect(reason(start(), { type: "place", card: "mountain", row: "backrow", zone: 0 })).toBe("field-zone");
		expect(reason(start(), { type: "place", card: "glow-charm", row: "field", zone: 0 })).toBe("field-zone");
	});
	it('says "on the field": Mountain adds 200 ATK and DEF to both players\' Winged Beasts, and to nobody else', () => {
		const after = ok(start(), { type: "place", card: "mountain", row: "field", zone: 0 }).board;
		expect(atkOf(after.you.monsters[0]!, after)).toBe(2000);
		expect(defOf(after.you.monsters[0]!, after)).toBe(800);
		expect(atkOf(after.you.monsters[1]!, after)).toBe(1500);
		expect(atkOf(after.rival.monsters[0]!, after)).toBe(2000);
	});
	it("sends the old Field Spell to the Graveyard when a new one is played", () => {
		const again = board({ full: true, you: { hand: ["mountain"], field: "mountain" } });
		const after = ok(again, { type: "place", card: "mountain", row: "field", zone: 0 }).board;
		expect(after.you.field).toBe("mountain");
		expect(after.you.graveyard).toEqual(["mountain"]);
	});
	it("counts in battle", () => {
		const after = ok(board({ full: true, you: { monsters: ["lantern-owl"] }, rival: { field: "mountain", monsters: ["shadow-wolf"], lp: 4000 } }), { type: "attack", attacker: 0, target: 0 });
		expect(after.events).toContainEqual(expect.objectContaining({ type: "battle", attackerValue: 2000, defenderValue: 2200 }));
	});
});

describe("banished cards", () => {
	const start = (trap: "sakuretsu-armor" | "dimensional-prison") => board({ full: true, turn: "rival", you: { lp: 500, backrow: [trap] }, rival: { monsters: ["busy-bee"] } });
	it("are not in the Graveyard: a banished monster's Graveyard effect never happens", () => {
		const attacked = ok(start("dimensional-prison"), { type: "attack", attacker: 0, target: "direct" }).board;
		const { board: after, events } = ok(attacked, { type: "spring", zone: 0 });
		expect(after.rival.banished).toEqual([{ card: "busy-bee", faceDown: false }]);
		expect(after.rival.graveyard).toEqual([]);
		expect(after.you.lp).toBe(500);
		expect(events).toContainEqual({ type: "banished", side: "rival", cards: ["busy-bee"], faceDown: false });
	});
	it("while a destroyed monster goes to the Graveyard, and its effect happens", () => {
		const attacked = ok(start("sakuretsu-armor"), { type: "attack", attacker: 0, target: "direct" }).board;
		const after = ok(attacked, { type: "spring", zone: 0 }).board;
		expect(after.rival.graveyard).toEqual(["busy-bee"]);
		expect(after.winner).toBe("rival");
	});
	it("can be banished face-down as a cost: Pot of Desires banishes 10 from the Deck, then draws 2", () => {
		const deck = ["pocket-cub", "moss-beetle", "river-otter", "lantern-owl", "pebble-crab", "storm-stag", "mountain-bison", "mud-toad", "night-bat", "thorn-fox", "spark-dash", "thunder-clap"] as const;
		const state = board({ full: true, you: { hand: ["pot-of-desires", "pot-of-desires"], deck } });
		const { board: after, events } = ok(state, { type: "place", card: "pot-of-desires", row: "backrow", zone: 0 });
		expect(after.you.banished).toHaveLength(10);
		expect(after.you.banished.every((item) => item.faceDown)).toBe(true);
		expect(after.you.hand).toEqual(["pot-of-desires", "spark-dash", "thunder-clap"]);
		expect(events.map((event) => event.type)).toEqual(["activated", "banished", "drew", "drew"]);
		expect(reason(after, { type: "place", card: "pot-of-desires", row: "backrow", zone: 0 })).toBe("one-per-turn");
	});
	it("needs the whole cost: with fewer than 12 cards in the Deck, Pot of Desires cannot be activated", () => {
		const state = board({ full: true, you: { hand: ["pot-of-desires"], deck: ["pocket-cub", "moss-beetle"] } });
		expect(reason(state, { type: "place", card: "pot-of-desires", row: "backrow", zone: 0 })).toBe("deck-too-small");
	});
});
