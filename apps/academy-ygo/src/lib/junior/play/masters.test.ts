import { describe, expect, it } from "vitest";
import { seeded } from "./bot";
import { cardOf, inExtraDeck } from "./cards";
import { levelById } from "./levels";
import { MASTERS, MASTER_LP, deckProblems, duelSetup, masterDeck, masterLevelId, shuffled } from "./masters";
import { STARTERS } from "./starters";
import { hint, next, play, start, type Session } from "./session";

describe("the masters' decks", () => {
	it.each(MASTERS.map((master) => [master] as const))("%s has a legal deck: 40 cards, up to 3 copies, an Extra Deck of up to 15", (master) => {
		expect(deckProblems(masterDeck(master))).toEqual([]);
	});
	it.each(Object.keys(STARTERS).map((starter) => [starter] as const))("the starter deck %s is legal", (starter) => {
		expect(deckProblems(STARTERS[starter as keyof typeof STARTERS].deck)).toEqual([]);
	});
	it("keeps Extra Deck monsters out of the Main Deck", () => {
		for (const master of MASTERS) expect(masterDeck(master).main.filter(inExtraDeck)).toEqual([]);
	});
});

describe("a duel against a trainer", () => {
	it("shuffles both Decks from a seed, deals five cards each and starts at 8000 Life Points", () => {
		const setup = duelSetup("seto-kaiba", STARTERS.dragon.deck, seeded(42));
		expect(setup.you?.hand).toHaveLength(5);
		expect(setup.rival?.deck).toHaveLength(35);
		expect([setup.you?.lp, setup.rival?.lp]).toEqual([MASTER_LP, MASTER_LP]);
		expect(duelSetup("seto-kaiba", STARTERS.dragon.deck, seeded(42))).toEqual(setup);
		expect(shuffled([1, 2, 3, 4, 5, 6, 7, 8], seeded(1)).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	/** Plays a whole duel: the trainer with its bot, the child with the hints. */
	function duel(master: (typeof MASTERS)[number], seed: number): Session {
		const base = levelById(masterLevelId(master))!;
		let session = start({ ...base, duel: { master, seed }, setup: duelSetup(master, STARTERS.warrior.deck, seeded(seed)) });
		for (let step = 0; step < 4000 && (session.status === "playing" || session.status === "answer" || session.status === "rival"); step++) {
			if (session.status === "rival") session = next(session);
			else {
				const { move } = hint(session);
				const after = move ? play(session, move) : session;
				session = after.rejected || !move ? play(session, session.board.pending ? { type: "pass" } : { type: "phase", to: "end" }) : after;
			}
		}
		return session;
	}
	it.each([
		["rex-raptor", 3],
		["seto-kaiba", 11],
		["atem", 5],
	] as const)("against %s (seed %i) is played to the end by the rules engine, and someone wins", (master, seed) => {
		const done = duel(master, seed);
		expect(done.board.winner).not.toBeNull();
		expect(done.status === "solved" || done.status === "failed").toBe(true);
	});
	it("only ever holds real cards in the trainer's hand", () => {
		const session = start({ ...levelById(masterLevelId("joey-wheeler"))!, setup: duelSetup("joey-wheeler", STARTERS.hero.deck, seeded(9)) });
		for (const card of session.board.rival.hand) expect(cardOf(card)).toBeTruthy();
	});
});

describe("the trainer bot", () => {
	it("attacks with every monster before playing a card in the Battle Phase", async () => {
		const { botMove } = await import("./bot");
		const { apply, board } = await import("./engine");
		let state = board({ full: true, turn: "rival", phase: "battle", you: { lp: 8000 }, rival: { hand: ["pot-of-greed"], deck: ["pocket-cub", "pocket-cub"], monsters: ["iron-boar", "river-otter", "thorn-fox"] } });
		for (let step = 0; step < 6 && state.turn === "rival"; step++) {
			const result = apply(state, botMove(state, { aggression: 1, skill: 1, caution: 1 }, seeded(1)));
			if (!result.ok) break;
			state = result.board;
		}
		expect(state.you.lp).toBe(8000 - 1700 - 1500 - 1400);
	});
});
