import { describe, expect, it } from "vitest";
import { apply, board, type Board, type Move } from "./engine";

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`rejected: ${result.reason}`);
	return result;
}
const types = (move: ReturnType<typeof ok>) => move.events.map((event) => event.type);

describe('"If… you can" and "When… you can" when a card goes to the Graveyard', () => {
	const trade = (discard: "busy-bee" | "dozy-moth") => ok(board({ you: { hand: ["spark-trade", discard] }, rival: { lp: 2000, monsters: ["iron-boar"] } }), { type: "place", card: "spark-trade", row: "backrow", zone: 0, discard });
	it('"If…" always works: discarded as a cost, Busy Bee still deals its damage once the Spell has resolved', () => {
		const done = trade("busy-bee");
		expect(types(done)).toEqual(["activated", "discarded", "destroyed", "trigger", "lp"]);
		expect(done.events[3]).toEqual({ type: "trigger", side: "you", card: "busy-bee", word: "if", amount: 500 });
		expect(done.board.rival.lp).toBe(1500);
	});
	it('"When…" misses its chance when something else happened right after: here, the Spell was activated', () => {
		const done = trade("dozy-moth");
		expect(types(done)).toEqual(["activated", "discarded", "destroyed", "missed"]);
		expect(done.events[3]).toEqual({ type: "missed", side: "you", card: "dozy-moth", last: "activation" });
		expect(done.board.rival.lp).toBe(2000);
		expect(done.board.you.graveyard).toContain("dozy-moth");
	});
	it('"When…" works when going to the Graveyard was the last thing: destroyed in battle', () => {
		const done = ok(board({ turn: "rival", you: { monsters: ["dozy-moth"] }, rival: { lp: 2000, monsters: ["iron-boar"] } }), { type: "attack", attacker: 0, target: 0 });
		expect(types(done)).toEqual(["attack-declared", "battle", "lp", "trigger", "lp"]);
		expect(done.board.rival.lp).toBe(1500);
	});
	it('"When…" works when a Spell destroys it, and the damage can win the duel', () => {
		const done = ok(board({ turn: "rival", you: { monsters: ["dozy-moth"] }, rival: { lp: 400, hand: ["thunder-clap"] } }), { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 });
		expect(types(done)).toEqual(["activated", "destroyed", "trigger", "lp", "won"]);
		expect(done.board.winner).toBe("you");
	});
	it("misses when Tributed for a Tribute Summon: the Summon is the last thing that happened", () => {
		const moth = ok(board({ you: { hand: ["storm-stag"], monsters: ["dozy-moth"] }, rival: { lp: 2000 } }), { type: "place", card: "storm-stag", row: "monsters", zone: 0, tributes: [0] });
		expect(types(moth)).toEqual(["summoned", "missed"]);
		expect(moth.events[1]).toEqual({ type: "missed", side: "you", card: "dozy-moth", last: "summon" });
		const bee = ok(board({ you: { hand: ["storm-stag"], monsters: ["busy-bee"] }, rival: { lp: 2000 } }), { type: "place", card: "storm-stag", row: "monsters", zone: 0, tributes: [0] });
		expect(types(bee)).toEqual(["summoned", "trigger", "lp"]);
	});
	it("gives each waiting effect its chance in the order the cards reached the Graveyard", () => {
		const done = ok(board({ you: { hand: ["spark-trade", "busy-bee"] }, rival: { lp: 2000, monsters: ["dozy-moth", "iron-boar"] } }), { type: "place", card: "spark-trade", row: "backrow", zone: 0, discard: "busy-bee" });
		expect(done.events.filter((event) => event.type === "trigger").map((event) => event.type === "trigger" && [event.side, event.card])).toEqual([
			["you", "busy-bee"],
			["rival", "dozy-moth"],
		]);
		expect([done.board.you.lp, done.board.rival.lp]).toEqual([3500, 1500]);
	});
	it("works for the child on the rival's turn, when the rival's attack destroys it", () => {
		const done = ok(board({ turn: "rival", you: { lp: 4000, monsters: ["dozy-moth"] }, rival: { lp: 500, monsters: ["iron-boar"] } }), { type: "attack", attacker: 0, target: 0 });
		expect(done.board.winner).toBe("you");
		expect(done.board.triggers).toEqual([]);
	});
	it("waits until the Chain has resolved", () => {
		const guarded = board({ you: { hand: ["spark-trade", "busy-bee"] }, rival: { lp: 2000, monsters: ["river-otter"], backrow: ["quick-burrow"] } });
		const activated = ok(guarded, { type: "place", card: "spark-trade", row: "backrow", zone: 0, discard: "busy-bee" });
		expect(types(activated)).toEqual(["activated", "discarded", "chain", "window"]);
		const answered = ok(activated.board, { type: "spring", zone: 0, target: 0 });
		expect(types(answered).slice(-3)).toEqual(["no-effect", "trigger", "lp"]);
		expect(answered.board.rival.lp).toBe(1500);
	});
});
