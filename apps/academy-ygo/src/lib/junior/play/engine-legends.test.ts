import { describe, expect, it } from "vitest";
import { FORBIDDEN_LIMBS, FORBIDDEN_ONE, hasRulesText, monsterOf } from "./cards";
import { apply, board, type Board, type Move } from "./engine";

const ok = (state: Board, move: Move) => {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`refused: ${result.reason}`);
	return result;
};
const LIMBS = FORBIDDEN_LIMBS;

describe("the legendary cards", () => {
	it("are printed with their real numbers", () => {
		expect(monsterOf("dark-magician")).toMatchObject({ level: 7, atk: 2500, def: 2100 });
		expect(monsterOf("blue-eyes-white-dragon")).toMatchObject({ level: 8, atk: 3000, def: 2500, type: "dragon" });
		expect(monsterOf("blue-eyes-ultimate-dragon")).toMatchObject({ level: 12, atk: 4500, def: 3800, frame: "fusion", fusion: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"] });
		expect(monsterOf("exodia-the-forbidden-one")).toMatchObject({ level: 3, atk: 1000, def: 1000 });
		for (const limb of LIMBS) expect(monsterOf(limb)).toMatchObject({ level: 1, atk: 200, def: 300 });
		expect(FORBIDDEN_ONE).toEqual(["exodia-the-forbidden-one", ...LIMBS]);
		expect(hasRulesText("exodia-the-forbidden-one")).toBe(true);
		expect(hasRulesText("dark-magician")).toBe(false);
	});

	it("Dark Magician needs two Tributes", () => {
		const state = board({ you: { hand: ["dark-magician"], monsters: ["pocket-cub"] } });
		expect(apply(state, { type: "place", card: "dark-magician", row: "monsters", zone: 1, tributes: [0] })).toEqual({ ok: false, reason: "wrong-tributes" });
	});

	it("three Blue-Eyes White Dragons fuse into Blue-Eyes Ultimate Dragon, from the hand", () => {
		const state = board({ full: true, you: { hand: ["polymerization", "blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"], extra: ["blue-eyes-ultimate-dragon"] } });
		const materials = [0, 1, 2].map(() => ({ from: "hand", card: "blue-eyes-white-dragon" }) as const);
		const result = ok(state, { type: "place", card: "polymerization", row: "backrow", zone: 0, summon: "blue-eyes-ultimate-dragon", materials });
		expect(result.board.you.monsters[0]?.card).toBe("blue-eyes-ultimate-dragon");
		expect(result.board.you.graveyard.filter((card) => card === "blue-eyes-white-dragon")).toHaveLength(3);
		expect(apply(state, { type: "place", card: "polymerization", row: "backrow", zone: 0, summon: "blue-eyes-ultimate-dragon", materials: materials.slice(0, 2) })).toEqual({ ok: false, reason: "wrong-materials" });
	});

	it("drawing the fifth piece of the Forbidden One wins the duel, whatever the Life Points", () => {
		const state = board({ strict: true, phase: "draw", you: { lp: 100, hand: [...LIMBS], deck: ["exodia-the-forbidden-one"] }, rival: { lp: 8000, monsters: ["shadow-wolf"] } });
		const result = ok(state, { type: "draw" });
		expect(result.board.winner).toBe("you");
		expect(result.events.slice(-2)).toEqual([
			{ type: "exodia", side: "you" },
			{ type: "won", side: "you" },
		]);
	});

	it("a piece drawn by a Spell wins too, and four pieces win nothing", () => {
		const hand = ["exodia-the-forbidden-one", "right-arm-of-the-forbidden-one", "left-arm-of-the-forbidden-one", "right-leg-of-the-forbidden-one", "upstart-goblin"] as const;
		const drawn = ok(board({ you: { hand: [...hand], deck: ["left-leg-of-the-forbidden-one"] } }), { type: "place", card: "upstart-goblin", row: "backrow", zone: 0 });
		expect(drawn.board.winner).toBe("you");
		expect(drawn.board.rival.lp).toBe(5000);
		const short = ok(board({ you: { hand: [...hand], deck: ["pocket-cub"] } }), { type: "place", card: "upstart-goblin", row: "backrow", zone: 0 });
		expect(short.board.winner).toBeNull();
		expect(short.events.some((event) => event.type === "exodia")).toBe(false);
	});

	it("a piece on the field does not count: all five must be in the hand", () => {
		const state = board({ you: { hand: [...LIMBS, "pocket-cub"], monsters: ["exodia-the-forbidden-one"] } });
		const result = ok(state, { type: "place", card: "pocket-cub", row: "monsters", zone: 1 });
		expect(result.board.winner).toBeNull();
	});
});
