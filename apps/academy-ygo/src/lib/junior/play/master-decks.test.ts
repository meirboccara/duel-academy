import { describe, expect, it } from "vitest";
import { botMove, seeded } from "./bot";
import { actor, apply, board, type Board, type Move, type Setup } from "./engine";
import { MASTER_LP, OPENING_HAND, PERSONAS, masterDeck, shuffled, type Deck, type MasterId } from "./masters";
import { STARTERS } from "./starters";

/** The trainers' decks built from today's tournament lists: two trainers' bots finish a duel, and no move is refused. */
const MOST_MOVES = 2500;

function duel(first: { deck: Deck; master: MasterId }, second: { deck: Deck; master: MasterId }, seed: number): Board {
	const random = seeded(seed);
	const deal = (deck: Deck) => {
		const cards = shuffled(deck.main, random);
		return { lp: MASTER_LP, hand: cards.slice(0, OPENING_HAND), deck: cards.slice(OPENING_HAND), extra: [...deck.extra] };
	};
	let state = board({ full: true, seed, turnNumber: 1, phase: "draw", you: deal(first.deck), rival: deal(second.deck) });
	for (let move = 0; move < MOST_MOVES && !state.winner; move++) {
		const persona = PERSONAS[actor(state) === "you" ? first.master : second.master];
		const chosen = botMove(state, persona, random);
		const result = apply(state, chosen);
		if (!result.ok) throw new Error(`move ${move} refused (${result.reason}): ${JSON.stringify(chosen)}`);
		state = result.board;
	}
	return state;
}

const META: readonly MasterId[] = ["seto-kaiba", "atem", "arkana", "yugi-muto", "joey-wheeler", "maximillion-pegasus", "jaden-yuki", "yusei-fudo"];
const trainer = (master: MasterId) => ({ deck: masterDeck(master), master });

describe("trainer against trainer", () => {
	it.each(META.map((master, index) => [master, META[(index + 1) % META.length] as MasterId] as const))("%s against %s ends with a winner, every move accepted", (first, second) => {
		const done = duel(trainer(first), trainer(second), META.indexOf(first) + 1);
		expect(done.winner).not.toBeNull();
	}, 240000);
});

describe("starter against trainer", () => {
	it.each([
		["warrior", "atem"],
		["dragon", "seto-kaiba"],
		["hero", "jaden-yuki"],
	] as const)("the %s starter against %s ends with a winner, every move accepted", (starter, master) => {
		const done = duel({ deck: STARTERS[starter].deck, master }, trainer(master), 7);
		expect(done.winner).not.toBeNull();
	}, 240000);
});

describe("the cards these decks brought in", () => {
	const mat = (setup: Setup) => board({ full: true, ...setup });
	const reason = (state: Board, move: Move) => {
		const result = apply(state, move);
		return result.ok ? "accepted" : result.reason;
	};
	const play = (state: Board, ...moves: Move[]) =>
		moves.reduce((current, move) => {
			const result = apply(current, move);
			if (!result.ok) throw new Error(`refused: ${result.reason}`);
			return result.board;
		}, state);
	it("Scrap Archfiend: 1 Tuner + 1 or more non-Tuner monsters, Levels totalling 7", () => {
		const extra = { type: "extra", card: "scrap-archfiend", materials: [0, 1, 2] } as Move;
		expect(play(mat({ you: { monsters: ["junk-synchron", "giant-soldier-of-stone", "unicycular"], extra: ["scrap-archfiend"] } }), extra).you.monsters.some((slot) => slot?.card === "scrap-archfiend")).toBe(true);
		expect(reason(mat({ you: { monsters: ["giant-soldier-of-stone", "giant-soldier-of-stone", "unicycular"], extra: ["scrap-archfiend"] } }), extra)).toBe("needs-one-tuner");
		expect(reason(mat({ you: { monsters: ["junk-synchron", "giant-soldier-of-stone", "flamvell-guard"], extra: ["scrap-archfiend"] } }), extra)).toBe("needs-one-tuner");
	});
	it("Gagagigo the Risen: 3 Level 4 monsters, not 2", () => {
		const three = play(mat({ you: { monsters: ["vorse-raider", "vorse-raider", "la-jinn-the-mystical-genie-of-the-lamp"], extra: ["gagagigo-the-risen"] } }), { type: "extra", card: "gagagigo-the-risen", materials: [0, 1, 2] });
		expect(three.you.monsters.find((slot) => slot?.card === "gagagigo-the-risen")?.materials).toHaveLength(3);
		expect(reason(mat({ you: { monsters: ["vorse-raider", "vorse-raider"], extra: ["gagagigo-the-risen"] } }), { type: "extra", card: "gagagigo-the-risen", materials: [0, 1] })).toBe("wrong-levels");
	});
	it("Traffic Ghost: 3 monsters, or a Link-2 counted as 2 and 1 more", () => {
		expect(reason(mat({ you: { monsters: ["vorse-raider", "vorse-raider", "unicycular"], extra: ["traffic-ghost"] } }), { type: "extra", card: "traffic-ghost", materials: [0, 1, 2] })).toBe("accepted");
		expect(reason(mat({ you: { monsters: ["vorse-raider", "vorse-raider"], extra: ["traffic-ghost"] } }), { type: "extra", card: "traffic-ghost", materials: [0, 1] })).toBe("link-count");
	});
	it("Protector with Eyes of Blue: Normal Summoned, it calls a Level 1 LIGHT Tuner from the hand; it sends an Effect Monster to call a Blue-Eyes from the hand, once per turn", () => {
		const summoned = play(mat({ you: { hand: ["protector-with-eyes-of-blue", "effect-veiler", "blue-eyes-white-dragon"] } }), { type: "place", card: "protector-with-eyes-of-blue", row: "monsters", zone: 0, tributes: [] } as Move);
		expect(summoned.triggered).toEqual([{ side: "you", card: "protector-with-eyes-of-blue", effect: 0, zone: 0 }]);
		const called = play(summoned, { type: "effect", card: "protector-with-eyes-of-blue", effect: 0, zone: 0, pick: "effect-veiler" } as Move);
		expect(called.you.monsters.filter(Boolean).map((slot) => slot?.card)).toEqual(["protector-with-eyes-of-blue", "effect-veiler"]);
		const zone = called.you.monsters.findIndex((slot) => slot?.card === "effect-veiler");
		const blue = play(called, { type: "effect", card: "protector-with-eyes-of-blue", effect: 1, zone: 0, target: zone, pick: "blue-eyes-white-dragon" } as Move);
		expect(blue.you.graveyard).toContain("effect-veiler");
		expect(blue.you.monsters.some((slot) => slot?.card === "blue-eyes-white-dragon")).toBe(true);
		expect(reason(blue, { type: "effect", card: "protector-with-eyes-of-blue", effect: 1, zone: 0, target: 0, pick: "blue-eyes-white-dragon" } as Move)).toBe("once-per-turn");
	});
});
