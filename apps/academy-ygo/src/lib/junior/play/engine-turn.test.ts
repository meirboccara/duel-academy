import { describe, expect, it } from "vitest";
import { apply, atkOf, board, legalMoves, type Board, type Move } from "./engine";

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

describe("playing cards from the hand", () => {
	it("Normal Summons a Level 4 or lower monster in Attack Position, once per turn", () => {
		const start = board({ you: { hand: ["pocket-cub", "river-otter"] } });
		const { board: after, events } = ok(start, { type: "place", card: "pocket-cub", row: "monsters", zone: 1 });
		expect(after.you.monsters[1]).toMatchObject({ card: "pocket-cub", position: "attack" });
		expect(after.you.hand).toEqual(["river-otter"]);
		expect(events).toEqual([{ type: "summoned", side: "you", card: "pocket-cub", zone: 1, tributes: [] }]);
		expect(reason(after, { type: "place", card: "river-otter", row: "monsters", zone: 0 })).toBe("summon-used");
	});
	it("sends each kind of card to its own row only", () => {
		const start = board({ you: { hand: ["pocket-cub", "glow-charm", "sticky-vine"] } });
		expect(reason(start, { type: "place", card: "pocket-cub", row: "backrow", zone: 0 })).toBe("wrong-zone");
		expect(reason(start, { type: "place", card: "glow-charm", row: "monsters", zone: 0 })).toBe("wrong-zone");
		expect(reason(start, { type: "place", card: "sticky-vine", row: "monsters", zone: 0 })).toBe("wrong-zone");
	});
	it("needs one Tribute for Level 5 or 6 and two for Level 7 or higher", () => {
		const start = board({ you: { hand: ["storm-stag", "mountain-bison"], monsters: ["pocket-cub", "pebble-crab"] } });
		expect(reason(start, { type: "place", card: "storm-stag", row: "monsters", zone: 2 })).toBe("wrong-tributes");
		expect(reason(start, { type: "place", card: "mountain-bison", row: "monsters", zone: 2, tributes: [0] })).toBe("wrong-tributes");
		expect(reason(start, { type: "place", card: "mountain-bison", row: "monsters", zone: 2, tributes: [0, 0] })).toBe("wrong-tributes");
		const stag = ok(start, { type: "place", card: "storm-stag", row: "monsters", zone: 0, tributes: [0] });
		expect(stag.board.you.monsters.map((slot) => slot?.card ?? null)).toEqual(["storm-stag", "pebble-crab", null]);
		expect(stag.board.you.graveyard).toEqual(["pocket-cub"]);
		const bear = ok(start, { type: "place", card: "mountain-bison", row: "monsters", zone: 2, tributes: [0, 1] });
		expect(bear.board.you.monsters.map((slot) => slot?.card ?? null)).toEqual([null, null, "mountain-bison"]);
		expect(bear.events).toEqual([{ type: "summoned", side: "you", card: "mountain-bison", zone: 2, tributes: ["pocket-cub", "pebble-crab"] }]);
	});
	it("activates a Normal Spell, applies it and sends it to the Graveyard", () => {
		const { board: after, events } = ok(board({ you: { hand: ["glow-charm"] } }), { type: "place", card: "glow-charm", row: "backrow", zone: 0 });
		expect(after.you.lp).toBe(4500);
		expect(after.you.graveyard).toEqual(["glow-charm"]);
		expect(after.you.backrow[0]).toBeNull();
		expect(events.map((event) => event.type)).toEqual(["activated", "gained"]);
	});
	it("destroys the chosen opposing monster with a destroy Spell, and needs a target", () => {
		const start = board({ you: { hand: ["thunder-clap"] }, rival: { monsters: [null, "iron-boar"] } });
		expect(reason(start, { type: "place", card: "thunder-clap", row: "backrow", zone: 0 })).toBe("no-target");
		const after = play(start, { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 1 });
		expect(after.rival.monsters[1]).toBeNull();
		expect(after.rival.graveyard).toEqual(["iron-boar"]);
	});
	it("raises ATK with a boost Spell until the end of the turn only", () => {
		const boosted = play(board({ you: { hand: ["spark-dash"], monsters: ["pocket-cub"] } }), { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 });
		expect(atkOf(boosted.you.monsters[0]!, boosted)).toBe(1700);
		const next = play(boosted, { type: "phase", to: "end" });
		expect(atkOf(next.you.monsters[0]!, next)).toBe(1200);
	});
	it("changes a battle position once per turn, never on the turn of the Summon", () => {
		const start = board({ you: { hand: ["river-otter"], monsters: ["pocket-cub"] } });
		const turned = ok(start, { type: "position", zone: 0 });
		expect(turned.board.you.monsters[0]?.position).toBe("defense");
		expect(turned.events).toEqual([{ type: "position", side: "you", card: "pocket-cub", position: "defense" }]);
		expect(reason(turned.board, { type: "position", zone: 0 })).toBe("position-used");
		const summoned = play(start, { type: "place", card: "river-otter", row: "monsters", zone: 1 });
		expect(reason(summoned, { type: "position", zone: 1 })).toBe("just-summoned");
	});
});

describe("Traps", () => {
	const ambush = () => board({ you: { hand: ["sticky-vine"], monsters: ["pocket-cub"] }, rival: { monsters: ["iron-boar"] } });
	it("are Set face-down and cannot be used on the turn they were Set", () => {
		const { board: set, events } = ok(ambush(), { type: "place", card: "sticky-vine", row: "backrow", zone: 0 });
		expect(set.you.backrow[0]).toEqual({ card: "sticky-vine", setThisTurn: true });
		expect(events).toEqual([{ type: "set", side: "you", card: "sticky-vine", zone: 0 }]);
		expect(reason(set, { type: "spring", zone: 0 })).toBe("trap-just-set");
	});
	it("freeze the opponent's attack until the player answers, then stop it", () => {
		const rivalTurn = play(ambush(), { type: "place", card: "sticky-vine", row: "backrow", zone: 0 }, { type: "phase", to: "end" });
		expect(rivalTurn.turn).toBe("rival");
		const declared = ok(rivalTurn, { type: "attack", attacker: 0, target: 0 });
		expect(declared.board.pending).toEqual({ kind: "attack", attacker: 0, target: 0 });
		expect(declared.events.at(-1)).toEqual({ type: "window", side: "you", kind: "attack" });
		expect(declared.board.you.monsters[0]?.card).toBe("pocket-cub");
		expect(reason(declared.board, { type: "phase", to: "end" })).toBe("answer-first");
		const sprung = ok(declared.board, { type: "spring", zone: 0 });
		expect(sprung.events.map((event) => event.type)).toEqual(["sprung", "attack-stopped"]);
		expect(sprung.board.you.monsters[0]?.card).toBe("pocket-cub");
		expect(sprung.board.you.lp).toBe(4000);
		expect(sprung.board.you.graveyard).toEqual(["sticky-vine"]);
		expect(reason(sprung.board, { type: "attack", attacker: 0, target: 0 })).toBe("already-attacked");
	});
	it("let the attack through when the player passes", () => {
		const declared = play(ambush(), { type: "place", card: "sticky-vine", row: "backrow", zone: 0 }, { type: "phase", to: "end" }, { type: "attack", attacker: 0, target: 0 });
		const passed = play(declared, { type: "pass" });
		expect(passed.you.monsters[0]).toBeNull();
		expect(passed.you.lp).toBe(3500);
		expect(passed.you.backrow[0]?.card).toBe("sticky-vine");
	});
	it("can turn a battle around by weakening the attacker", () => {
		const start = board({ you: { monsters: ["river-otter"], backrow: ["fog-snare"] }, rival: { monsters: ["iron-boar"] }, turn: "rival" });
		const after = play(start, { type: "attack", attacker: 0, target: 0 }, { type: "spring", zone: 0 });
		expect(after.rival.monsters[0]).toBeNull();
		expect(after.rival.lp).toBe(3700);
		expect(after.you.monsters[0]?.card).toBe("river-otter");
	});
	it("do not answer the wrong thing, and do nothing without an opponent's action", () => {
		const start = board({ you: { monsters: ["river-otter"], backrow: ["quick-burrow", "sticky-vine"] }, rival: { monsters: ["iron-boar"] } });
		expect(reason(start, { type: "spring", zone: 1 })).toBe("nothing-to-answer");
		const declared = play(start, { type: "phase", to: "end" }, { type: "attack", attacker: 0, target: 0 });
		expect(reason(declared, { type: "spring", zone: 0, target: 0 })).toBe("cannot-answer-that");
	});
});

describe("a two-link chain", () => {
	const start = () => board({ you: { monsters: ["pocket-cub"], backrow: ["quick-burrow"] }, rival: { hand: ["thunder-clap"] }, turn: "rival" });
	it("resolves the last card first: the Trap saves the monster and the Spell finds no target", () => {
		const activated = ok(start(), { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 });
		expect(activated.events.map((event) => event.type)).toEqual(["activated", "chain", "window"]);
		expect(activated.board.you.monsters[0]?.card).toBe("pocket-cub");
		expect(reason(activated.board, { type: "spring", zone: 0 })).toBe("no-target");
		const chained = ok(activated.board, { type: "spring", zone: 0, target: 0 });
		expect(chained.events).toEqual([
			{ type: "sprung", side: "you", card: "quick-burrow" },
			{ type: "chain", link: 2, side: "you", card: "quick-burrow" },
			{ type: "resolve", link: 2, card: "quick-burrow" },
			{ type: "returned", side: "you", card: "pocket-cub" },
			{ type: "resolve", link: 1, card: "thunder-clap" },
			{ type: "no-effect", card: "thunder-clap" },
		]);
		expect(chained.board.you.hand).toEqual(["pocket-cub"]);
		expect(chained.board.you.graveyard).toEqual(["quick-burrow"]);
		expect(chained.board.rival.graveyard).toEqual(["thunder-clap"]);
	});
	it("lets the Spell destroy the monster when the player passes", () => {
		const after = play(start(), { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 }, { type: "pass" });
		expect(after.you.monsters[0]).toBeNull();
		expect(after.you.graveyard).toEqual(["pocket-cub"]);
	});
});

describe("the phases of a turn, moved by hand", () => {
	const turn = (extra: Parameters<typeof board>[0] = {}) => board({ strict: true, phase: "draw", you: { deck: ["river-otter", "pocket-cub"], hand: ["spark-dash"], monsters: ["lantern-owl"] }, rival: { monsters: ["thorn-fox"] }, ...extra });
	it("draws one card in the Draw Phase, and must draw before moving on", () => {
		expect(reason(turn(), { type: "phase", to: "main1" })).toBe("draw-first");
		const drew = ok(turn(), { type: "draw" });
		expect(drew.events).toEqual([{ type: "drew", side: "you", card: "river-otter" }]);
		expect(drew.board.you.hand).toEqual(["spark-dash", "river-otter"]);
		expect(reason(drew.board, { type: "draw" })).toBe("already-drew");
	});
	it("only goes forward, and keeps Spells and Summons for a Main Phase", () => {
		const battle = play(turn(), { type: "draw" }, { type: "phase", to: "main1" }, { type: "phase", to: "battle" });
		expect(reason(battle, { type: "phase", to: "main1" })).toBe("cannot-go-back");
		expect(reason(battle, { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 })).toBe("not-main-phase");
		expect(reason(battle, { type: "place", card: "river-otter", row: "monsters", zone: 1 })).toBe("not-main-phase");
		const main2 = play(battle, { type: "phase", to: "main2" });
		expect(play(main2, { type: "place", card: "river-otter", row: "monsters", zone: 1 }).you.monsters[1]?.card).toBe("river-otter");
	});
	it("attacks only in the Battle Phase", () => {
		const main = play(turn(), { type: "draw" }, { type: "phase", to: "main1" });
		expect(reason(main, { type: "attack", attacker: 0, target: 0 })).toBe("not-battle-phase");
		expect(reason(main, { type: "phase", to: "main2" })).toBe("not-battle-phase");
	});
	it("hands the turn over at the End Phase and forgets what was used", () => {
		const ended = ok(play(turn(), { type: "draw" }, { type: "phase", to: "main1" }, { type: "place", card: "river-otter", row: "monsters", zone: 1 }), { type: "phase", to: "end" });
		expect(ended.events).toEqual([{ type: "phase", side: "you", phase: "end" }, { type: "turn", side: "rival" }]);
		expect(ended.board).toMatchObject({ turn: "rival", phase: "draw", turnNumber: 4, summonUsed: false });
	});
	it("gives the first player of a duel no draw and no Battle Phase", () => {
		const first = turn({ turnNumber: 1 });
		expect(reason(first, { type: "draw" })).toBe("first-turn-no-draw");
		const main = play(first, { type: "phase", to: "main1" });
		expect(reason(main, { type: "phase", to: "battle" })).toBe("first-turn-no-battle");
	});
	it("loses the duel when a card must be drawn from an empty Deck", () => {
		const { board: after, events } = ok(board({ strict: true, phase: "draw" }), { type: "draw" });
		expect(after.winner).toBe("rival");
		expect(events).toEqual([{ type: "deck-out", side: "you" }, { type: "won", side: "rival" }]);
	});
});

describe("listing the moves a player may make", () => {
	it("offers only legal moves", () => {
		const start = board({ you: { hand: ["storm-stag"], monsters: ["pocket-cub", { card: "pebble-crab", position: "defense" }] }, rival: { monsters: ["mud-toad"] } });
		const moves = legalMoves(start);
		expect(moves).toContainEqual({ type: "attack", attacker: 0, target: 0 });
		expect(moves).not.toContainEqual({ type: "attack", attacker: 1, target: 0 });
		expect(moves).not.toContainEqual({ type: "attack", attacker: 0, target: "direct" });
		expect(moves).toContainEqual({ type: "place", card: "storm-stag", row: "monsters", zone: 2, tributes: [1] });
		expect(moves).not.toContainEqual({ type: "place", card: "storm-stag", row: "monsters", zone: 1, tributes: [0] });
		for (const move of moves) expect(apply(start, move).ok).toBe(true);
	});
	it("offers only an answer or a pass while an attack is frozen", () => {
		const declared = play(board({ you: { monsters: ["pocket-cub"], backrow: ["sticky-vine"] }, rival: { monsters: ["iron-boar"] }, turn: "rival" }), { type: "attack", attacker: 0, target: 0 });
		expect(legalMoves(declared)).toEqual([{ type: "pass" }, { type: "spring", zone: 0 }, { type: "spring", zone: 0, target: 0 }, { type: "spring", zone: 0, target: 1 }, { type: "spring", zone: 0, target: 2 }]);
	});
});
