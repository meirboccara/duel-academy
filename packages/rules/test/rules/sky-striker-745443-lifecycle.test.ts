import { expect, it } from "vitest";
import { act, CARD_DEFS, cites, type DeckEntry, type Duel, findNamed, legalActions, actionName, READINESS_DECKS, startDuel } from "../../src";

const SKY_STRIKER = READINESS_DECKS.find((deck) => deck.id === 745443)!;
const BLUE_EYES = READINESS_DECKS.find((deck) => deck.id === 746021)!;

/** The exact manifest: every copy by its registered code, none replaced or dropped. */
function exact(entries: readonly DeckEntry[]): string[] {
	return entries.flatMap((entry) => {
		if (entry.code === undefined || CARD_DEFS[entry.code] === undefined) throw new Error(`no registered code for ${entry.name}`);
		expect(CARD_DEFS[entry.code]!.facts?.name).toBe(entry.name);
		return Array<string>(entry.count).fill(entry.code);
	});
}

const lists = () => ({ you: { deck: exact(SKY_STRIKER.main), extra: exact(SKY_STRIKER.extra) }, rival: { deck: exact(BLUE_EYES.main), extra: exact(BLUE_EYES.extra) } });
const counts = (codes: readonly string[]) => codes.reduce<Record<string, number>>((all, code) => ({ ...all, [code]: (all[code] ?? 0) + 1 }), {});
const codesOf = (duel: Duel, ids: readonly number[]) => ids.map((id) => duel.cards[id]!.code);
const names = (duel: Duel) => legalActions(duel).map((action) => actionName(duel, action));

/** Passes every offered decision until `done`. */
function passUntil(duel: Duel, done: (duel: Duel) => boolean): Duel {
	for (let guard = 0; guard < 400 && !done(duel); guard++) duel = act(duel, { type: "pass" });
	expect(done(duel)).toBe(true);
	return duel;
}

/** Plays a named move; fails the test with what was offered when it is not legal. */
function play(duel: Duel, step: string): Duel {
	const action = findNamed(duel, step);
	if (!action) throw new Error(`"${step}" is not legal; offered: ${names(duel).join(" | ")}`);
	return act(duel, action);
}

it(`${cites("rules", "opening-hand-five")} ${cites("rules", "no-draw-first-turn")} ${cites("rules", "normal-draw-or-lose")} plays Sky Striker 745443 exactly against Blue-Eyes 746021: 40/15 and 43/15 cards, five-card hands, no first draw, then one normal draw a turn`, () => {
	const setup = lists();
	expect([setup.you.deck.length, setup.you.extra.length, setup.rival.deck.length, setup.rival.extra.length]).toEqual([40, 15, 43, 15]);
	const start = startDuel({ seed: 1, defs: CARD_DEFS, ...setup });
	for (const side of ["you", "rival"] as const) {
		const { deck, extra } = setup[side];
		expect(start.piles[side].hand).toHaveLength(5);
		expect(start.piles[side].deck).toHaveLength(deck.length - 5);
		expect(counts([...codesOf(start, start.piles[side].hand), ...codesOf(start, start.piles[side].deck)])).toEqual(counts(deck));
		expect(counts(codesOf(start, start.piles[side].extra))).toEqual(counts(extra));
	}
	expect(start.waiting).toEqual([]);

	const main1 = passUntil(start, (duel) => duel.turn.phase === "main1");
	expect(main1.piles.you.hand).toEqual(start.piles.you.hand);
	const turnTwo = passUntil(main1, (duel) => duel.turn.number === 2);
	expect(turnTwo.piles.rival.hand).toEqual([...start.piles.rival.hand, start.piles.rival.deck[0]]);
	const turnThree = passUntil(turnTwo, (duel) => duel.turn.number === 3);
	expect(turnThree.piles.you.hand).toEqual([...start.piles.you.hand, start.piles.you.deck[0]]);
	expect(turnThree.piles.you.deck).toHaveLength(34);
	expect(turnThree.drewByEffect).toEqual([]);
	expect(turnThree.winner).toBeNull();
});

it(`${cites("sky-striker-ace-raye", "summon")} ${cites("sky-striker-ace-raye", "notes-not-link-summon")} ${cites("infinite-impermanence", "hand")} from the seeded opening hand, Raye Tributes itself for Kagari in an Extra Monster Zone, and the Blue-Eyes player may answer from the hand with Infinite Impermanence`, () => {
	// Seed 1: Sky Striker opens Raye, Widow Anchor, Pot of Sloth, Raigeki, Radiant Typhoon Vision; Blue-Eyes holds Infinite Impermanence and no Set card.
	let duel = passUntil(startDuel({ seed: 1, defs: CARD_DEFS, ...lists() }), (duel) => duel.turn.phase === "main1");
	expect(codesOf(duel, duel.piles.rival.hand)).toContain("infinite-impermanence");
	duel = play(duel, "summon sky-striker-ace-raye");
	duel = play(duel, "activate sky-striker-ace-raye #1");
	duel = passUntil(duel, (duel) => duel.asking !== null);
	expect(names(duel)).toContain("choose sky-striker-ace-kagari");
	// Azalea and Zeke ("Must be Link Summoned") are not offered: Raye's Summon is not a Link Summon.
	expect(names(duel).some((name) => name.includes("sky-striker-ace-azalea") || name.includes("sky-striker-ace-zeke"))).toBe(false);
	duel = play(duel, "choose sky-striker-ace-kagari");
	duel = play(duel, "place 5");
	expect(codesOf(duel, duel.piles.you.graveyard)).toEqual(["sky-striker-ace-raye"]);
	const kagari = duel.piles.you.monster.find((id) => duel.cards[id]!.code === "sky-striker-ace-kagari")!;
	expect(duel.cards[kagari]).toMatchObject({ slot: 5, face: "up", proper: false });

	// Sky Striker keeps priority first; once it passes, the Blue-Eyes player may activate Infinite Impermanence from the hand on Kagari.
	duel = play(duel, "pass");
	expect(duel.priority.holder).toBe("rival");
	expect(names(duel)).toContain("activate infinite-impermanence > sky-striker-ace-kagari");
	duel = play(duel, "activate infinite-impermanence > sky-striker-ace-kagari");
	duel = passUntil(duel, (duel) => duel.chain.length === 0 && duel.priority.holder === "you");
	expect(codesOf(duel, duel.piles.rival.graveyard)).toEqual(["infinite-impermanence"]);
	expect(duel.modifiers.some((modifier) => modifier.layer.kind === "negate")).toBe(true);
	expect(duel.winner).toBeNull();
});

it(`${cites("upstart-goblin", "text")} ${cites("rules", "normal-draw-or-lose")} Upstart Goblin's draw is a draw by card effect; the next turn's normal draw is not`, () => {
	// Seed 10: Sky Striker opens with Upstart Goblin.
	let duel = passUntil(startDuel({ seed: 10, defs: CARD_DEFS, ...lists() }), (duel) => duel.turn.phase === "main1");
	const top = duel.piles.you.deck[0]!;
	duel = play(duel, "activate upstart-goblin");
	duel = passUntil(duel, (duel) => duel.chain.length === 0 && duel.priority.holder === "you" && duel.piles.you.hand.includes(top));
	expect(duel.drewByEffect).toEqual(["you"]);
	expect(duel.lp.rival).toBe(9000);
	const turnTwo = passUntil(duel, (duel) => duel.turn.number === 2);
	expect(turnTwo.drewByEffect).toEqual([]);
	expect(turnTwo.piles.rival.hand).toHaveLength(6);
});
