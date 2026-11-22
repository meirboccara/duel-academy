import { describe, expect, it } from "vitest";
import { actor, apply, board, type Board, type Move, type Setup } from "./engine";

/** A real Chain: both players answer in turn, the last card resolves first, Spell Speeds decide who may answer what. Texts in card-art.ts. */
function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`refused: ${result.reason}`);
	return result;
}
const play = (state: Board, ...moves: Move[]) => moves.reduce((current, move) => ok(current, move).board, state);
const reason = (state: Board, move: Move) => {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
};
const mat = (setup: Setup) => board({ full: true, ...setup });
const cast = (card: string, extra: Record<string, unknown> = {}) => ({ type: "place", card, row: "backrow", zone: 0, ...extra }) as Move;
const pass: Move = { type: "pass" };
const ash: Move = { type: "hand", card: "ash-blossom-joyous-spring" };

describe("a Chain of more than two links", () => {
	it("the turn player answers Ash Blossom with Solemn Strike: Ash is negated and the search resolves", () => {
		const start = mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman", "iron-boar"], backrow: [null, "solemn-strike"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const searching = play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }));
		const answered = ok(searching, ash);
		/* Chain Link 2 waits: the turn player may answer it. */
		expect(answered.board.chain).toHaveLength(1);
		expect(actor(answered.board)).toBe("you");
		expect(answered.events).toContainEqual({ type: "chain", link: 2, side: "rival", card: "ash-blossom-joyous-spring" });
		const struck = ok(answered.board, { type: "spring", zone: 1 });
		expect(struck.events).toContainEqual({ type: "chain", link: 3, side: "you", card: "solemn-strike" });
		const done = struck.board;
		expect(done.chain).toEqual([]);
		expect(done.pending).toBeNull();
		expect(done.you.lp).toBe(4000 - 1500);
		expect(done.you.hand).toEqual(["elemental-hero-sparkman"]);
		expect(done.rival.graveyard).toEqual(["ash-blossom-joyous-spring"]);
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["reinforcement-of-the-army", "solemn-strike"]));
	});
	it("when the turn player lets Ash resolve, the search is negated", () => {
		const start = mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman", "iron-boar"], backrow: [null, "solemn-strike"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const done = play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }), ash, pass);
		expect(done.chain).toEqual([]);
		expect(done.pending).toBeNull();
		expect(done.you.hand).toEqual([]);
		expect(done.you.lp).toBe(4000);
	});
	it("with nothing to answer it with, Ash resolves at once, as before", () => {
		const start = mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman", "iron-boar"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const negated = ok(play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" })), ash);
		expect(negated.board.chain).toEqual([]);
		expect(negated.board.pending).toBeNull();
		expect(negated.board.you.hand).toEqual([]);
	});
});

const summon = (card: string, zone = 0) => ({ type: "place", card, row: "monsters", zone, tributes: [] }) as Move;
const blazeman = (rival: Setup["rival"], you: Setup["you"] = {}) => mat({ you: { hand: ["elemental-hero-blazeman"], deck: ["polymerization", "iron-boar"], ...you }, rival });

describe("answering a monster's effect", () => {
	it("Blazeman's search opens a moment only when the other player can answer it", () => {
		const free = ok(blazeman({}), summon("elemental-hero-blazeman"));
		expect(free.board.pending).toBeNull();
		expect(free.board.you.hand).toEqual(["polymerization"]);
		const held = ok(blazeman({ hand: ["ash-blossom-joyous-spring"] }), summon("elemental-hero-blazeman"));
		expect(held.board.pending).toMatchObject({ kind: "effect", card: "elemental-hero-blazeman" });
		expect(held.events.at(-1)).toEqual({ type: "window", side: "rival", kind: "effect" });
		expect(play(held.board, pass).you.hand).toEqual(["polymerization"]);
	});
	it("Ash Blossom negates a monster's effect that adds from the Deck", () => {
		const done = play(blazeman({ hand: ["ash-blossom-joyous-spring"] }), summon("elemental-hero-blazeman"), ash);
		expect(done.you.hand).toEqual([]);
		expect(done.you.monsters[0]?.card).toBe("elemental-hero-blazeman");
		expect(done.rival.graveyard).toEqual(["ash-blossom-joyous-spring"]);
	});
	it("Ghost Ogre & Snow Rabbit destroys the monster, but its search still resolves", () => {
		const done = play(blazeman({ hand: ["ghost-ogre-snow-rabbit"] }), summon("elemental-hero-blazeman"), { type: "hand", card: "ghost-ogre-snow-rabbit" });
		expect(done.you.monsters[0]).toBeNull();
		expect(done.you.graveyard).toEqual(["elemental-hero-blazeman"]);
		expect(done.you.hand).toEqual(["polymerization"]);
		/* A Spell is not a monster on the field: Ghost Ogre cannot answer it. */
		const spell = play(mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman"] }, rival: { hand: ["ghost-ogre-snow-rabbit"] } }), cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }));
		expect(spell.pending).toBeNull();
	});
	it("Effect Veiler negates the monster on the field, so the effect it activated does nothing", () => {
		const done = play(blazeman({ hand: ["effect-veiler"] }), summon("elemental-hero-blazeman"), { type: "hand", card: "effect-veiler", target: 0 });
		expect(done.you.hand).toEqual([]);
		expect(done.you.monsters[0]?.negatedTurn).toBe(true);
	});
	it("Infinite Impermanence: from the hand when its owner controls no cards, or Set", () => {
		const fromHand = play(blazeman({ hand: ["infinite-impermanence"] }), summon("elemental-hero-blazeman"), { type: "hand", card: "infinite-impermanence", target: 0 });
		expect(fromHand.you.hand).toEqual([]);
		expect(fromHand.rival.graveyard).toEqual(["infinite-impermanence"]);
		/* Controlling a card, it must be Set first. */
		const covered = ok(blazeman({ hand: ["infinite-impermanence"], monsters: ["iron-boar"] }), summon("elemental-hero-blazeman"));
		expect(covered.board.pending).toBeNull();
		const set = play(blazeman({ backrow: ["infinite-impermanence"], monsters: ["iron-boar"] }), summon("elemental-hero-blazeman"), { type: "spring", zone: 0, target: 0 });
		expect(set.you.hand).toEqual([]);
	});
	it("Solemn Strike negates the effect and destroys the monster; Seven Tools of the Bandit answers Solemn Strike", () => {
		const struck = play(blazeman({ backrow: ["solemn-strike"] }), summon("elemental-hero-blazeman"), { type: "spring", zone: 0 });
		expect(struck.rival.lp).toBe(2500);
		expect(struck.you.monsters[0]).toBeNull();
		expect(struck.you.hand).toEqual([]);
		const tools = blazeman({ backrow: ["solemn-strike"] }, { backrow: ["seven-tools-of-the-bandit"] });
		const chained = ok(play(tools, summon("elemental-hero-blazeman")), { type: "spring", zone: 0 });
		expect(actor(chained.board)).toBe("you");
		const saved = play(chained.board, { type: "spring", zone: 0 });
		expect(saved.you.lp).toBe(3000);
		expect(saved.you.hand).toEqual(["polymerization"]);
		expect(saved.you.monsters[0]?.card).toBe("elemental-hero-blazeman");
		expect(saved.rival.graveyard).toEqual(["solemn-strike"]);
	});
});

describe("Spell Speed", () => {
	it("Magic Jammer negates a Spell; a hand trap cannot answer a Counter Trap, only another Counter Trap", () => {
		const start = mat({ you: { hand: ["reinforcement-of-the-army", "ash-blossom-joyous-spring"], deck: ["elemental-hero-sparkman"] }, rival: { hand: ["iron-boar"], backrow: ["magic-jammer"] } });
		const cast1 = play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }));
		expect(reason(cast1, { type: "spring", zone: 0 })).toBe("cost-needed");
		const jammed = ok(cast1, { type: "spring", zone: 0, discard: "iron-boar" });
		expect(jammed.board.chain).toEqual([]);
		expect(jammed.board.you.hand).toEqual(["ash-blossom-joyous-spring"]);
		expect(jammed.board.rival.graveyard).toEqual(expect.arrayContaining(["iron-boar", "magic-jammer"]));
	});
	it("Seven Tools of the Bandit answers Magic Jammer: the Spell resolves", () => {
		const start = mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman"], backrow: [null, "seven-tools-of-the-bandit"] }, rival: { hand: ["iron-boar"], backrow: ["magic-jammer"] } });
		const jammed = ok(play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" })), { type: "spring", zone: 0, discard: "iron-boar" });
		expect(jammed.board.chain).toHaveLength(1);
		expect(reason(jammed.board, { type: "hand", card: "ash-blossom-joyous-spring" })).toBe("answer-first");
		const done = play(jammed.board, { type: "spring", zone: 1 });
		expect(done.you.hand).toEqual(["elemental-hero-sparkman"]);
		expect(done.you.lp).toBe(3000);
	});
	it("a level's Chain limit of 2 keeps the Counter Trap out: Ash resolves at once", () => {
		const start = board({ full: true, chainLimit: 2, you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman"], backrow: [null, "solemn-strike"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const done = ok(play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" })), ash);
		expect(done.board.chain).toEqual([]);
		expect(done.board.you.hand).toEqual([]);
	});
});

