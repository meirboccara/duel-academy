import { describe, expect, it } from "vitest";
import { apply, board, legalMoves, type Board, type Move, type Setup } from "./engine";

/** Cards whose effects are written as data, from the shared vocabulary (effects.ts). Texts in card-art.ts. */
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
const summon = (card: string, zone = 0) => ({ type: "place", card, row: "monsters", zone, tributes: [] }) as Move;
const use = (card: string, effect: number, extra: Record<string, unknown> = {}) => ({ type: "effect", card, effect, ...extra }) as Move;

describe("Spells written as data", () => {
	it("Terraforming adds the Field Spell chosen, and only a Field Spell", () => {
		const start = mat({ you: { hand: ["terraforming"], deck: ["umi", "pot-of-greed", "forest"] } });
		expect(reason(start, cast("terraforming", { pick: "pot-of-greed" }))).toBe("no-target");
		expect(play(start, cast("terraforming", { pick: "forest" })).you.hand).toEqual(["forest"]);
		const picks = legalMoves(start).flatMap((move) => (move.type === "place" && move.pick ? [move.pick] : []));
		expect(picks.sort()).toEqual(["forest", "umi"]);
	});
	it("Foolish Burial sends the monster chosen from the Deck to the Graveyard", () => {
		const done = play(mat({ you: { hand: ["foolish-burial"], deck: ["iron-boar", "pot-of-greed"] } }), cast("foolish-burial", { pick: "iron-boar" }));
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["iron-boar", "foolish-burial"]));
		expect(done.you.deck).toEqual(["pot-of-greed"]);
	});
	it("One for One: send a monster from the hand to the GY; Special Summon a Level 1 monster from the hand or Deck", () => {
		const start = mat({ you: { hand: ["one-for-one", "iron-boar", "pot-of-greed"], deck: ["sage-with-eyes-of-blue", "celtic-guardian"] } });
		expect(reason(start, cast("one-for-one", { discard: "pot-of-greed", pick: "sage-with-eyes-of-blue" }))).toBe("cost-needed");
		expect(reason(start, cast("one-for-one", { discard: "iron-boar", pick: "celtic-guardian" }))).toBe("no-target");
		const done = play(start, cast("one-for-one", { discard: "iron-boar", pick: "sage-with-eyes-of-blue" }));
		expect(done.you.monsters[0]?.card).toBe("sage-with-eyes-of-blue");
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["iron-boar", "one-for-one"]));
	});
	it("Toon Table of Contents adds a card whose name says Toon", () => {
		const start = mat({ you: { hand: ["toon-table-of-contents"], deck: ["toon-alligator", "iron-boar"] } });
		expect(reason(start, cast("toon-table-of-contents", { pick: "iron-boar" }))).toBe("no-target");
		expect(play(start, cast("toon-table-of-contents", { pick: "toon-alligator" })).you.hand).toEqual(["toon-alligator"]);
	});
	it("Ash Blossom judges a data Spell by what it does: it negates Terraforming, not One for One from the hand", () => {
		const start = mat({ you: { hand: ["terraforming"], deck: ["umi"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const negated = play(start, cast("terraforming", { pick: "umi" }), { type: "hand", card: "ash-blossom-joyous-spring" });
		expect(negated.you.hand).toEqual([]);
	});
});

describe("monsters written as data", () => {
	const blue = (you: Setup["you"] = {}, rival: Setup["rival"] = {}) =>
		mat({ you: { hand: ["sage-with-eyes-of-blue"], deck: ["the-white-stone-of-legend", "blue-eyes-white-dragon", "effect-veiler", "iron-boar"], ...you }, rival });
	it("Sage with Eyes of Blue: when Normal Summoned, you can add a Level 1 LIGHT Tuner, now and only now", () => {
		const summoned = play(blue(), summon("sage-with-eyes-of-blue"));
		expect(summoned.triggered).toEqual([{ side: "you", card: "sage-with-eyes-of-blue", effect: 0, zone: 0 }]);
		const picks = legalMoves(summoned).flatMap((move) => (move.type === "effect" && move.pick ? [move.pick] : []));
		expect(picks.sort()).toEqual(["effect-veiler", "the-white-stone-of-legend"]);
		expect(play(summoned, use("sage-with-eyes-of-blue", 0, { zone: 0, pick: "the-white-stone-of-legend" })).you.hand).toEqual(["the-white-stone-of-legend"]);
		/* Something else first: the moment is gone. */
		const later = play(summoned, { type: "phase", to: "battle" });
		expect(reason(later, use("sage-with-eyes-of-blue", 0, { zone: 0, pick: "the-white-stone-of-legend" }))).toBe("nothing-to-answer");
	});
	it("Sage's other effect: discard it, send an Effect Monster you control to the GY, then Special Summon a Blue-Eyes from the Deck; once per turn", () => {
		const start = blue({ hand: ["sage-with-eyes-of-blue", "sage-with-eyes-of-blue"], monsters: ["elemental-hero-blazeman"] });
		expect(reason(start, use("sage-with-eyes-of-blue", 1, { target: 0, pick: "iron-boar" }))).toBe("no-target");
		const done = play(start, use("sage-with-eyes-of-blue", 1, { target: 0, pick: "blue-eyes-white-dragon" }));
		expect(done.you.monsters.some((slot) => slot?.card === "blue-eyes-white-dragon")).toBe(true);
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["sage-with-eyes-of-blue", "elemental-hero-blazeman"]));
		expect(reason(done, use("sage-with-eyes-of-blue", 1, { target: 0, pick: "blue-eyes-white-dragon" }))).toBe("once-per-turn");
	});
	it("The White Stone of Legend: sent to the GY, it adds Blue-Eyes White Dragon by itself", () => {
		const done = play(mat({ you: { hand: ["foolish-burial"], deck: ["the-white-stone-of-legend", "blue-eyes-white-dragon"] } }), cast("foolish-burial", { pick: "the-white-stone-of-legend" }));
		expect(done.you.hand).toEqual(["blue-eyes-white-dragon"]);
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["the-white-stone-of-legend"]));
	});
	it("Destiny HERO - Malicious: banished from the GY to Special Summon another copy from the Deck", () => {
		const start = mat({ you: { graveyard: ["destiny-hero-malicious"], deck: ["destiny-hero-malicious", "iron-boar"] } });
		const done = play(start, use("destiny-hero-malicious", 0, { pick: "destiny-hero-malicious" }));
		expect(done.you.monsters[0]?.card).toBe("destiny-hero-malicious");
		expect(done.you.banished).toEqual([{ card: "destiny-hero-malicious", faceDown: false }]);
		expect(done.you.graveyard).toEqual([]);
		expect(reason(mat({ strict: true, phase: "battle", you: { graveyard: ["destiny-hero-malicious"], deck: ["destiny-hero-malicious"] } }), use("destiny-hero-malicious", 0, { pick: "destiny-hero-malicious" }))).not.toBe("accepted");
	});
	it("Elemental HERO Shadow Mist: sent to the GY, you can add a HERO monster; only 1 of its effects per turn", () => {
		const start = mat({ you: { hand: ["foolish-burial", "foolish-burial"], deck: ["elemental-hero-shadow-mist", "elemental-hero-sparkman", "iron-boar"] } });
		const milled = play(start, cast("foolish-burial", { pick: "elemental-hero-shadow-mist" }));
		expect(milled.triggered).toEqual([{ side: "you", card: "elemental-hero-shadow-mist", effect: 1 }]);
		expect(reason(milled, use("elemental-hero-shadow-mist", 1, { pick: "iron-boar" }))).toBe("no-target");
		expect(play(milled, use("elemental-hero-shadow-mist", 1, { pick: "elemental-hero-sparkman" })).you.hand).toContain("elemental-hero-sparkman");
	});
	it("Ash Blossom negates a monster's data effect that adds from the Deck; Ghost Ogre destroys the monster on the field", () => {
		const summoned = play(blue({}, { hand: ["ash-blossom-joyous-spring", "ghost-ogre-snow-rabbit"] }), summon("sage-with-eyes-of-blue"));
		const used = ok(summoned, use("sage-with-eyes-of-blue", 0, { zone: 0, pick: "the-white-stone-of-legend" }));
		expect(used.board.pending).toMatchObject({ kind: "effect", card: "sage-with-eyes-of-blue" });
		const negated = play(used.board, { type: "hand", card: "ash-blossom-joyous-spring" });
		expect(negated.you.hand).toEqual([]);
		const ogred = play(used.board, { type: "hand", card: "ghost-ogre-snow-rabbit" });
		expect(ogred.you.monsters[0]).toBeNull();
		expect(ogred.you.hand).toEqual(["the-white-stone-of-legend"]);
	});
});
