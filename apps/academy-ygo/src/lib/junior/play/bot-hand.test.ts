import { describe, expect, it } from "vitest";
import { botMove, seeded } from "./bot";
import { apply, board, type Board, type Move } from "./engine";

const EXPERT = { aggression: 1, skill: 1, caution: 1, answers: 1, plans: 2 };
const after = (state: Board, move: Move): Board => {
	const result = apply(state, move);
	if (!result.ok) throw new Error(result.reason);
	return result.board;
};

describe("the bot with Traps and hand traps", () => {
	it("Sets a Trap instead of keeping it in the hand", () => {
		const state = board({ full: true, phase: "main1", turnNumber: 3, turn: "rival", rival: { hand: ["trap-hole"], deck: ["vorse-raider"] }, you: { monsters: ["vorse-raider"], deck: ["vorse-raider"] } });
		expect(botMove(state, EXPERT, seeded(1))).toMatchObject({ type: "place", card: "trap-hole", row: "backrow" });
	});

	it("keeps a hand trap in the hand while it has a monster, and Sets it as a last wall", () => {
		const covered = board({ full: true, phase: "main1", turnNumber: 3, turn: "rival", rival: { hand: ["ash-blossom-joyous-spring"], monsters: ["vorse-raider"], deck: ["vorse-raider"] }, you: { monsters: ["vorse-raider"], deck: ["vorse-raider"] } });
		expect(botMove(covered, EXPERT, seeded(1))).not.toMatchObject({ type: "place" });
		const exposed = board({ full: true, phase: "main1", turnNumber: 3, turn: "rival", rival: { hand: ["ash-blossom-joyous-spring"], deck: ["vorse-raider"] }, you: { monsters: ["vorse-raider"], deck: ["vorse-raider"] } });
		expect(botMove(exposed, EXPERT, seeded(1))).toMatchObject({ type: "place", card: "ash-blossom-joyous-spring", row: "monsters" });
	});

	it("answers a card that searches the Deck with Ash Blossom & Joyous Spring", () => {
		const state = board({ full: true, phase: "main1", turnNumber: 3, you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman", "vorse-raider"] }, rival: { hand: ["ash-blossom-joyous-spring"], deck: ["vorse-raider"] } });
		const searching = after(state, { type: "place", card: "reinforcement-of-the-army", row: "backrow", zone: 0, pick: "elemental-hero-sparkman" });
		expect(searching.pending?.kind).toBe("spell");
		expect(botMove(searching, EXPERT, seeded(1))).toEqual({ type: "hand", card: "ash-blossom-joyous-spring" });
	});

	it("answers the Summon of a monster with an effect to use with Effect Veiler, not the Summon of a plain one", () => {
		const start = (card: "magicians-rod" | "vorse-raider") => after(board({ full: true, phase: "main1", turnNumber: 3, you: { hand: [card], deck: ["dark-magical-curtain", "vorse-raider"] }, rival: { hand: ["effect-veiler"], deck: ["vorse-raider"] } }), { type: "place", card, row: "monsters", zone: 0, tributes: [] });
		const rod = start("magicians-rod");
		expect(rod.pending?.kind).toBe("summon");
		expect(botMove(rod, EXPERT, seeded(1))).toEqual({ type: "hand", card: "effect-veiler", target: 0 });
		expect(start("vorse-raider").pending).toBeNull();
	});
});

describe("the bot keeps Effect Veiler", () => {
	it("when the only monster with an effect has nothing left to negate", () => {
		const state = board({ full: true, phase: "main1", turnNumber: 3, you: { hand: ["vorse-raider"], monsters: [null, "magicians-rod"], deck: ["vorse-raider"] }, rival: { hand: ["effect-veiler"], backrow: ["torrential-tribute"], deck: ["vorse-raider"] } });
		const summoned = after(state, { type: "place", card: "vorse-raider", row: "monsters", zone: 0, tributes: [] });
		expect(summoned.pending?.kind).toBe("summon");
		expect(botMove(summoned, EXPERT, seeded(1))).not.toMatchObject({ type: "hand" });
	});
});
