import { describe, expect, it } from "vitest";
import { isEffectMonster } from "@duel-academy/engine";
import { apply, board, EXTRA_ZONE, legalMoves, type Board, type Move, type Setup } from "@duel-academy/engine";

/** Link Monsters on the whole mat: what their materials count for, where they and Pendulum Monsters from the Extra Deck may go. */
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
const link = (card: string, materials: number[], zone?: number) => ({ type: "extra", card, materials, ...(zone === undefined ? {} : { zone }) }) as Move;

describe("Link materials", () => {
	it("arrows and materials are printed facts, not an effect: a Link Monster without text is no Effect Monster", () => {
		expect(isEffectMonster("lanphorhynchus")).toBe(false);
		expect(isEffectMonster("gaia-saber-the-lightning-shadow")).toBe(false);
		expect(isEffectMonster("link-spider")).toBe(true);
	});
	it("Gaia Saber, the Lightning Shadow: 2+ monsters; a Link-2 counts as 2, so a Link-2 and 1 monster make Link-3", () => {
		const two = mat({ you: { monsters: ["iron-boar", "celtic-guardian"], extra: ["gaia-saber-the-lightning-shadow"] } });
		expect(reason(two, link("gaia-saber-the-lightning-shadow", [0, 1]))).toBe("link-count");
		const three = mat({ you: { monsters: ["iron-boar", "celtic-guardian", "mud-toad"], extra: ["gaia-saber-the-lightning-shadow"] } });
		expect(play(three, link("gaia-saber-the-lightning-shadow", [0, 1, 2])).you.monsters[EXTRA_ZONE]?.card).toBe("gaia-saber-the-lightning-shadow");
		const mixed = mat({ you: { monsters: ["iron-boar"], emz: "lanphorhynchus", extra: ["gaia-saber-the-lightning-shadow"] } });
		expect(play(mixed, link("gaia-saber-the-lightning-shadow", [0, EXTRA_ZONE])).you.monsters[EXTRA_ZONE]?.card).toBe("gaia-saber-the-lightning-shadow");
	});
	it("LANphorhynchus: exactly 2 monsters, so one Link-2 alone is not enough", () => {
		const alone = mat({ you: { emz: "lanphorhynchus", extra: ["lanphorhynchus"] } });
		expect(reason(alone, link("lanphorhynchus", [EXTRA_ZONE]))).toBe("link-count");
	});
	it("Link Spider: 1 Normal Monster, not an Effect Monster", () => {
		const start = mat({ you: { monsters: ["iron-boar", "elemental-hero-blazeman"], extra: ["link-spider"] } });
		expect(reason(start, link("link-spider", [1]))).toBe("wrong-materials");
		expect(play(start, link("link-spider", [0])).you.monsters[EXTRA_ZONE]?.card).toBe("link-spider");
	});
});

describe("Link Arrows", () => {
	it("a Link Monster goes to the Extra Monster Zone, or to a Main Monster Zone a Link Monster points to", () => {
		/* Link Spider in the Extra Monster Zone points down, to Main Monster Zone 1. */
		const start = mat({ you: { monsters: ["iron-boar", null, "celtic-guardian", "mud-toad"], emz: "link-spider", extra: ["gaia-saber-the-lightning-shadow"] } });
		expect(reason(start, link("gaia-saber-the-lightning-shadow", [0, 2, 3], 4))).toBe("extra-zone");
		const below = play(start, link("gaia-saber-the-lightning-shadow", [0, 2, 3], 1));
		expect(below.you.monsters[1]?.card).toBe("gaia-saber-the-lightning-shadow");
		/* Used as a material, Link Spider points nowhere any more: only the Extra Monster Zone, which it frees. */
		const used = play(start, link("gaia-saber-the-lightning-shadow", [0, 2, EXTRA_ZONE]));
		expect(used.you.monsters[EXTRA_ZONE]?.card).toBe("gaia-saber-the-lightning-shadow");
		expect(reason(start, link("gaia-saber-the-lightning-shadow", [0, 2, EXTRA_ZONE], 1))).toBe("extra-zone");
	});
	it("Link Spider: once per turn, Special Summons a Level 4 or lower Normal Monster from the hand to the zone it points to", () => {
		const start = mat({ you: { hand: ["iron-boar", "elemental-hero-blazeman"], emz: "link-spider" } });
		const use = (pick: string) => ({ type: "effect", card: "link-spider", effect: 0, zone: EXTRA_ZONE, pick }) as Move;
		expect(reason(start, use("elemental-hero-blazeman"))).toBe("no-target");
		const done = play(start, use("iron-boar"));
		expect(done.you.monsters[1]?.card).toBe("iron-boar");
		expect(reason(play(mat({ you: { hand: ["iron-boar", "iron-boar"], emz: "link-spider" } }), use("iron-boar")), use("iron-boar"))).toBe("once-per-turn");
		/* The zone it points to is taken: nowhere to go. */
		expect(reason(mat({ you: { hand: ["iron-boar"], monsters: [null, "mud-toad"], emz: "link-spider" } }), use("iron-boar"))).toBe("no-target");
	});
});

describe("Pendulum Summon from the Extra Deck", () => {
	const scaled = (setup: Setup) => {
		const state = mat(setup);
		state.you.backrow[0] = { card: "mandragon", setThisTurn: false, up: true };
		state.you.backrow[4] = { card: "dragong", setThisTurn: false, up: true };
		state.you.extraUp.push("flash-knight");
		return state;
	};
	it("a face-up Pendulum Monster in the Extra Deck goes to the Extra Monster Zone or a zone a Link Monster points to", () => {
		const done = play(scaled({}), { type: "pendulum", cards: ["flash-knight"] });
		expect(done.you.monsters[EXTRA_ZONE]?.card).toBe("flash-knight");
		expect(done.you.extraUp).toEqual([]);
		const pointed = play(scaled({ you: { emz: "link-spider" } }), { type: "pendulum", cards: ["flash-knight"] });
		expect(pointed.you.monsters[1]?.card).toBe("flash-knight");
		expect(reason(scaled({ you: { emz: "iron-boar" } }), { type: "pendulum", cards: ["flash-knight"] })).toBe("no-free-zone");
		expect(legalMoves(scaled({})).some((move) => move.type === "pendulum" && move.cards.includes("flash-knight"))).toBe(true);
	});
});
