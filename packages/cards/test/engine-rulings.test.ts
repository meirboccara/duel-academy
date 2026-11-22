import { describe, expect, it } from "vitest";
import { apply, atkOf, board, legalMoves, type Board, type Move } from "@duel-academy/engine";

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`rejected: ${result.reason}`);
	return result;
}
function reason(state: Board, move: Move) {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
}
const play = (state: Board, ...moves: Move[]) => moves.reduce((current, move) => ok(current, move).board, state);

describe("a cost: the part before the semicolon", () => {
	const start = () => board({ you: { hand: ["lightning-vortex", "mud-toad"], monsters: ["lantern-owl"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] } });
	it("is paid when the card is activated: the discarded card goes to the Graveyard first", () => {
		const { board: after, events } = ok(start(), { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "mud-toad" });
		expect(events.map((event) => event.type)).toEqual(["activated", "discarded", "destroyed", "destroyed"]);
		expect(events[1]).toEqual({ type: "discarded", side: "you", card: "mud-toad" });
		expect(after.you.hand).toEqual([]);
		expect(after.you.graveyard).toEqual(["mud-toad", "lightning-vortex"]);
		expect(after.rival.monsters).toEqual([null, null, null]);
	});
	it("must be paid: no card chosen, or no other card in hand, means no activation", () => {
		expect(reason(start(), { type: "place", card: "lightning-vortex", row: "backrow", zone: 0 })).toBe("cost-needed");
		expect(reason(start(), { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "lightning-vortex" })).toBe("cost-needed");
		const alone = board({ you: { hand: ["lightning-vortex"] }, rival: { monsters: ["iron-boar"] } });
		expect(reason(alone, { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "mud-toad" })).toBe("cost-needed");
	});
	it("stays paid when the effect ends up doing nothing", () => {
		const guarded = board({ you: { hand: ["lightning-vortex", "mud-toad"] }, rival: { monsters: ["river-otter"], backrow: ["quick-burrow"] } });
		const activated = ok(guarded, { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "mud-toad" });
		expect(activated.board.pending).toEqual({ kind: "spell", card: "lightning-vortex" });
		expect(activated.board.you.graveyard).toEqual(["mud-toad"]);
		const answered = ok(activated.board, { type: "spring", zone: 0, target: 0 });
		expect(answered.events.map((event) => event.type)).toEqual(["sprung", "chain", "resolve", "returned", "resolve", "no-effect"]);
		expect(answered.board.rival.hand).toEqual(["river-otter"]);
		expect(answered.board.you.graveyard).toEqual(["mud-toad", "lightning-vortex"]);
	});
	it("needs something for the effect to hit, even without a target", () => {
		expect(reason(board({ you: { hand: ["lightning-vortex", "mud-toad"] } }), { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "mud-toad" })).toBe("nothing-to-hit");
	});
});

describe("a Quick Effect", () => {
	const attacked = () =>
		play(board({ turn: "rival", you: { monsters: ["river-otter", "glint-lynx", "cinder-hedgehog"] }, rival: { monsters: ["iron-boar"] } }), { type: "attack", attacker: 0, target: 0 });
	it("opens a window on the opponent's turn and can be used in answer", () => {
		const declared = attacked();
		expect(declared.pending).toEqual({ kind: "attack", attacker: 0, target: 0 });
		const used = ok(declared, { type: "ability", zone: 1, target: 0 });
		expect(used.events.slice(0, 2)).toEqual([
			{ type: "ability", side: "you", card: "glint-lynx", target: "iron-boar" },
			{ type: "boosted", side: "rival", card: "iron-boar", amount: -800, atk: 900 },
		]);
		expect(used.board.rival.monsters[0]).toBeNull();
		expect(used.board.rival.lp).toBe(3400);
		expect(used.board.you.monsters[0]?.card).toBe("river-otter");
	});
	it("needs the words (Quick Effect): any other effect is for your own Main Phase", () => {
		expect(reason(attacked(), { type: "ability", zone: 2, target: 0 })).toBe("not-quick");
		const mine = board({ strict: true, phase: "battle", you: { monsters: ["cinder-hedgehog"] }, rival: { monsters: ["iron-boar"] } });
		expect(reason(mine, { type: "ability", zone: 0, target: 0 })).toBe("not-main-phase");
		const main = ok(board({ you: { monsters: ["cinder-hedgehog"] }, rival: { monsters: ["iron-boar"] } }), { type: "ability", zone: 0, target: 0 });
		expect(atkOf(main.board.rival.monsters[0]!, main.board)).toBe(900);
	});
	it("can also be used on your own turn, in the Battle Phase", () => {
		const battle = board({ strict: true, phase: "battle", you: { monsters: ["glint-lynx"] }, rival: { monsters: ["iron-boar"] } });
		const quick = ok(battle, { type: "ability", zone: 0, target: 0 }).board;
		expect(atkOf(quick.rival.monsters[0]!, quick)).toBe(900);
	});
	it("needs a target, and a monster with an effect", () => {
		expect(reason(attacked(), { type: "ability", zone: 1 })).toBe("no-target");
		expect(reason(attacked(), { type: "ability", zone: 0, target: 0 })).toBe("no-ability");
	});
	it("goes on top of a Spell as Chain Link 2 and resolves first", () => {
		const cast = play(board({ turn: "rival", you: { monsters: ["glint-lynx"] }, rival: { hand: ["spark-dash"], monsters: ["thorn-fox"] } }), { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 });
		const used = ok(cast, { type: "ability", zone: 0, target: 0 });
		expect(used.events.map((event) => event.type)).toEqual(["ability", "chain", "resolve", "boosted", "resolve", "boosted"]);
		expect(atkOf(used.board.rival.monsters[0]!, used.board)).toBe(1400 - 800 + 700);
	});
});

describe("once per turn", () => {
	const twoAttacks = () => board({ turn: "rival", you: { monsters: ["river-otter", "glint-lynx"], backrow: ["sticky-vine"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] } });
	it("stops a second use of the same card's effect in the same turn", () => {
		const first = play(twoAttacks(), { type: "attack", attacker: 0, target: 0 }, { type: "ability", zone: 1, target: 0 });
		const second = play(first, { type: "attack", attacker: 1, target: 0 });
		expect(second.pending).toMatchObject({ kind: "attack" });
		expect(reason(second, { type: "ability", zone: 1, target: 1 })).toBe("once-per-turn");
		expect(legalMoves(second).some((move) => move.type === "ability")).toBe(false);
		expect(ok(second, { type: "spring", zone: 0 }).events.map((event) => event.type)).toEqual(["sprung", "attack-stopped", "gained"]);
	});
	it("is available again on the next turn", () => {
		const used = play(board({ you: { monsters: ["glint-lynx"] }, rival: { monsters: ["iron-boar"] } }), { type: "ability", zone: 0, target: 0 });
		expect(reason(used, { type: "ability", zone: 0, target: 0 })).toBe("once-per-turn");
		const later = play(used, { type: "phase", to: "end" }, { type: "phase", to: "end" });
		expect(later.turn).toBe("you");
		expect(reason(later, { type: "ability", zone: 0, target: 0 })).toBe("accepted");
	});
	it("does not open a window when the only Quick Effect was already used", () => {
		const used = play(board({ turn: "rival", you: { monsters: ["river-otter", "glint-lynx"] }, rival: { monsters: ["iron-boar", "thorn-fox"] } }), { type: "attack", attacker: 0, target: 0 }, { type: "ability", zone: 1, target: 0 });
		const next = ok(used, { type: "attack", attacker: 1, target: 0 });
		expect(next.board.pending).toBeNull();
		expect(next.events.map((event) => event.type)).toEqual(["attack-declared", "battle", "lp"]);
	});
});

describe("listing moves with costs and effects", () => {
	it("offers the discard choices and the effect targets", () => {
		const moves = legalMoves(board({ you: { hand: ["lightning-vortex", "mud-toad"], monsters: ["cinder-hedgehog"] }, rival: { monsters: ["iron-boar"] } }));
		expect(moves).toContainEqual({ type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "mud-toad" });
		expect(moves).not.toContainEqual({ type: "place", card: "lightning-vortex", row: "backrow", zone: 0 });
		expect(moves).toContainEqual({ type: "ability", zone: 0, target: 0 });
	});
});
