import { expect, it } from "vitest";
import { act, CARD_DEFS, type Duel, type DeckEntry, legalActions, READINESS_DECKS, startDuel } from "../../src";

const PHANTOM = "blue-eyes-white-dragon-the-white-phantom-beast";
const manifest = READINESS_DECKS.find((deck) => deck.id === 746021)!;

/** The exact manifest: every copy by its registered code, none replaced or dropped. */
function exact(entries: readonly DeckEntry[]): string[] {
	return entries.flatMap((entry) => {
		if (entry.code === undefined || CARD_DEFS[entry.code] === undefined) throw new Error(`746021 has no registered code for ${entry.name}`);
		expect(CARD_DEFS[entry.code]!.facts?.name).toBe(entry.name);
		return Array<string>(entry.count).fill(entry.code);
	});
}

const counts = (codes: readonly string[]) => codes.reduce<Record<string, number>>((all, code) => ({ ...all, [code]: (all[code] ?? 0) + 1 }), {});
const codesOf = (duel: Duel, ids: readonly number[]) => ids.map((id) => duel.cards[id]!.code);

/** Passes every offered decision (hand traps, Phantom Beast's optional trigger) until `done`. */
function passUntil(duel: Duel, done: (duel: Duel) => boolean): Duel {
	for (let guard = 0; guard < 400 && !done(duel); guard++) duel = act(duel, { type: "pass" });
	expect(done(duel)).toBe(true);
	return duel;
}

it("plays Blue-Eyes 746021 exactly: 43/15 cards, five-card hands, no first draw, then normal draws that can trigger White Phantom Beast", () => {
	const main = exact(manifest.main);
	const extra = exact(manifest.extra);
	expect([main.length, extra.length]).toEqual([43, 15]);
	// Seed 76: "you" opens with White Phantom Beast, and it is the rival's first normal draw.
	const start = startDuel({ seed: 76, defs: CARD_DEFS, you: { deck: main, extra }, rival: { deck: main, extra } });

	for (const side of ["you", "rival"] as const) {
		expect(start.piles[side].hand).toHaveLength(5);
		expect(start.piles[side].deck).toHaveLength(38);
		expect(counts([...codesOf(start, start.piles[side].hand), ...codesOf(start, start.piles[side].deck)])).toEqual(counts(main));
		expect(counts(codesOf(start, start.piles[side].extra))).toEqual(counts(extra));
	}
	// In the opening hand it is not "added from the Deck" during the Duel: nothing waits, nothing is offered for it.
	expect(codesOf(start, start.piles.you.hand)).toContain(PHANTOM);
	expect(start.waiting).toEqual([]);
	expect(legalActions(start).some((action) => action.type === "activate" && start.cards[action.card]!.code === PHANTOM)).toBe(false);

	const standby = passUntil(start, (duel) => duel.turn.phase === "standby");
	expect(standby.piles.you.hand).toEqual(start.piles.you.hand);

	const drawn = start.piles.rival.deck[0]!;
	expect(start.cards[drawn]!.code).toBe(PHANTOM);
	const turnTwo = passUntil(standby, (duel) => duel.turn.number === 2);
	expect(turnTwo.turn).toEqual({ player: "rival", number: 2, phase: "draw" });
	expect(turnTwo.piles.rival.hand).toEqual([...start.piles.rival.hand, drawn]);
	expect(turnTwo.drewByEffect).toEqual([]);
	expect(legalActions(turnTwo)).toContainEqual(expect.objectContaining({ type: "activate", card: drawn, effect: 0 }));

	const turnThree = passUntil(turnTwo, (duel) => duel.turn.number === 3);
	expect(turnThree.piles.you.hand).toEqual([...start.piles.you.hand, start.piles.you.deck[0]]);
	expect(turnThree.piles.you.deck).toHaveLength(37);
	expect(turnThree.winner).toBeNull();
});
