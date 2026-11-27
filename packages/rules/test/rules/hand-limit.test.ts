import { expect, it } from "vitest";
import { act, type CardDef, cites, createDuel, delay, type Duel, legalActions, startDuel } from "../../src";

// Ten different codes a side (no card records): only the turn's structure acts on them.
const deck = (side: string) => Array.from({ length: 10 }, (_, i) => `${side}-${i}`);
const setup = { seed: 9, you: { deck: deck("you") }, rival: { deck: deck("rival") } };

function passUntil(duel: Duel, done: (duel: Duel) => boolean): Duel {
	for (let guard = 0; guard < 200 && !done(duel); guard++) duel = act(duel, { type: "pass" });
	expect(done(duel)).toBe(true);
	return duel;
}

it(`${cites("rules", "hand-limit-six")} at the end of the End Phase, a turn player with more than 6 cards in hand discards, one card of their choice at a time, down to 6; then the turn passes`, () => {
	// The rival draws in turns 2 and 4: 7 cards in hand at the end of turn 4. With 6 at the end of turn 3, "you" discard nothing.
	const start = startDuel(setup);
	const turnFour = passUntil(start, (duel) => duel.turn.number === 4);
	expect(turnFour.piles.you.hand).toHaveLength(6);
	expect(turnFour.piles.you.graveyard).toEqual([]);

	const asked = passUntil(turnFour, (duel) => duel.asking !== null || duel.turn.number === 5);
	expect(asked.turn).toMatchObject({ player: "rival", number: 4, phase: "end" });
	const hand = asked.piles.rival.hand;
	expect(hand).toHaveLength(7);
	expect(legalActions(asked)).toEqual(hand.map((card) => ({ type: "choose", card })));

	const chosen = hand[3]!;
	const discarded = act(asked, { type: "choose", card: chosen });
	expect(discarded.piles.rival.graveyard).toEqual([chosen]);
	expect(discarded.piles.rival.hand).toEqual(hand.filter((id) => id !== chosen));
	expect(discarded.turn).toEqual({ player: "you", number: 5, phase: "draw" });
	expect(discarded.piles.you.hand).toHaveLength(7);
	expect(discarded.asking).toBeNull();
});

/**
 * A made-up monster (no real card): "If this card is sent from the hand to the GY: [something]" (mandatory). Its operation notes the
 * turn and phase it resolves in, and the batch of the move that triggered it (cards moved at the same time share one).
 */
const discardWatch = (log: string[]): CardDef => ({
	code: "fixture-discard-watch",
	kind: "monster",
	facts: { level: 1, atk: 0, def: 0 },
	effects: [
		{
			type: "trigger",
			mandatory: true,
			range: "graveyard",
			event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.before.zone === "hand" && event.after.zone === "graveyard",
			operation: (duel, link) => (log.push(`turn ${duel.turn.number} ${duel.turn.phase}, batch ${(link.triggered ?? []).map((event) => (event.type === "moved" ? event.batch : "-")).join("+")}`), duel),
		},
	],
});

it(`${cites("rules", "hand-limit-six")} ${cites("rules", "hand-discard-trigger-activates")} several cards over the limit are selected one at a time, then discarded together; their Trigger Effects are chained and resolved in that End Phase, before the turn passes`, () => {
	const log: string[] = [];
	const start = startDuel({ ...setup, you: { deck: Array<string>(14).fill("fixture-discard-watch") }, defs: { "fixture-discard-watch": discardWatch(log) } });
	// Four more cards put in the hand of the first player during turn 1 (as a draw by an effect would): 9 cards, 3 over the limit.
	const extra = start.piles.you.deck.slice(0, 4);
	const crowded: Duel = {
		...start,
		piles: { ...start.piles, you: { ...start.piles.you, deck: start.piles.you.deck.slice(4), hand: [...start.piles.you.hand, ...extra] } },
		cards: { ...start.cards, ...Object.fromEntries(extra.map((id) => [id, { ...start.cards[id]!, zone: "hand" as const }])) },
	};
	let duel = passUntil(crowded, (duel) => duel.asking !== null);
	expect(duel.turn).toMatchObject({ player: "you", number: 1, phase: "end" });
	const hand = duel.piles.you.hand;
	// "Select and discard": the cards are selected one at a time; none leaves the hand before the last is selected.
	for (let picked = 0; picked < 3; picked++) {
		expect(duel.asking?.player).toBe("you");
		expect(duel.asking?.from).toEqual(hand.slice(picked));
		expect(duel.piles.you.hand).toEqual(hand);
		expect(duel.piles.you.graveyard).toEqual([]);
		duel = act(duel, { type: "choose", card: hand[picked]! });
	}
	expect(duel.piles.you.hand).toEqual(hand.slice(3));
	expect(duel.piles.you.graveyard).toEqual(hand.slice(0, 3));
	// Their Trigger Effects go on a chain at once, still in the End Phase of turn 1.
	expect(duel.turn).toMatchObject({ player: "you", number: 1, phase: "end" });
	for (let guard = 0; guard < 40 && duel.turn.number === 1; guard++) duel = act(duel, legalActions(duel).find((action) => action.type !== "pass") ?? { type: "pass" });
	expect(log).toHaveLength(3);
	const batches = new Set(log.map((line) => line.replace(/^turn 1 end, batch /, "")));
	expect(log.every((line) => line.startsWith("turn 1 end, batch "))).toBe(true);
	// One discard: the three moves share one batch.
	expect(batches.size).toBe(1);
	expect([...batches][0]).toMatch(/^\d+$/);
	expect(duel.piles.you.hand).toHaveLength(6);
	expect(duel.turn).toMatchObject({ player: "rival", number: 2, phase: "draw" });
});

/**
 * Made-up cards (no real card). "fixture-scarm", after Scarm, Malebranche of the Burning Abyss and Graff: "If this card is sent from the
 * hand to the GY: [nothing]" (mandatory, so the hand size discard sets off a chain), and "During the End Phase of the turn this card was
 * sent to the GY: You can [nothing]". "fixture-hand-quick": a Quick Effect activated from the hand, with no limit.
 */
const closingCards = (log: string[]): Record<string, CardDef> => ({
	"fixture-scarm": {
		code: "fixture-scarm",
		kind: "monster",
		facts: { level: 3, atk: 0, def: 0 },
		effects: [
			{ ...discardWatch(log).effects![0]! },
			{ type: "trigger", range: "graveyard", during: "end", condition: (duel, { card }) => duel.cards[card.id]!.sentTurn === duel.turn.number, operation: (duel) => (log.push("end phase effect"), duel) },
		],
	},
	"fixture-hand-quick": { code: "fixture-hand-quick", kind: "monster", facts: { level: 1, atk: 0, def: 0 }, effects: [{ type: "quick", range: "hand", operation: (duel) => (log.push("hand quick"), duel) }] },
});

/** Turn 1's End Phase, "you" with 9 cards (3 over the limit), all "fixture-scarm"; the rival holds "fixture-hand-quick" cards. Asked which to discard. */
function crowdedEndPhase(log: string[]): Duel {
	const start = startDuel({ ...setup, you: { deck: Array<string>(14).fill("fixture-scarm") }, rival: { deck: Array<string>(10).fill("fixture-hand-quick") }, defs: closingCards(log) });
	const extra = start.piles.you.deck.slice(0, 4);
	const crowded: Duel = {
		...start,
		piles: { ...start.piles, you: { ...start.piles.you, deck: start.piles.you.deck.slice(4), hand: [...start.piles.you.hand, ...extra] } },
		cards: { ...start.cards, ...Object.fromEntries(extra.map((id) => [id, { ...start.cards[id]!, zone: "hand" as const }])) },
	};
	const asked = passUntil(crowded, (duel) => duel.asking !== null);
	expect(asked.turn).toMatchObject({ player: "you", number: 1, phase: "end" });
	return asked;
}

/** Plays on from `duel` until turn 2 begins, noting every activation offered on the way: who, with how many links on the chain, which effect. */
function offersUntilTurnTwo(duel: Duel): { offers: { player: string; links: number; code: string; effect: number }[]; next: Duel } {
	const offers: { player: string; links: number; code: string; effect: number }[] = [];
	for (let guard = 0; guard < 60 && duel.turn.number === 1; guard++) {
		const legal = legalActions(duel);
		if (!duel.building && !duel.asking) for (const action of legal) if (action.type === "activate") offers.push({ player: duel.priority.holder, links: duel.chain.length, code: duel.cards[action.card]!.code, effect: action.effect });
		// Trigger Effects being put on the chain are chosen; anything else offered is passed.
		duel = act(duel, duel.building || duel.asking ? legal.find((action) => action.type !== "pass") ?? { type: "pass" } : { type: "pass" });
	}
	expect(duel.turn.number).toBe(2);
	return { offers, next: duel };
}

const discardThree = (duel: Duel): Duel => {
	const hand = duel.piles.you.hand;
	for (let picked = 0; picked < 3; picked++) duel = act(duel, { type: "choose", card: hand[picked]! });
	return duel;
};

it(`${cites("rules", "hand-adjustment-end-phase-effect-closed")} ${cites("rules", "hand-discard-trigger-activates")} a card sent to the GY by the hand size discard cannot activate its "during the End Phase" effect, even once the chain of the discard's Trigger Effects has resolved`, () => {
	const log: string[] = [];
	const discarded = discardThree(crowdedEndPhase(log));
	expect(discarded.chain.length + (discarded.building ? 1 : 0)).toBeGreaterThan(0);
	const { offers } = offersUntilTurnTwo(discarded);
	expect(offers.filter((offer) => offer.code === "fixture-scarm" && offer.effect === 1)).toEqual([]);
	expect(log.filter((line) => line.startsWith("turn 1 end"))).toHaveLength(3);
	expect(log).not.toContain("end phase effect");
});

it(`${cites("rules", "hand-discard-trigger-activates")} the chain the hand size discard sets off can be answered; once it has resolved, no new chain starts in that End Phase and the turn passes (the core's reading: no Konami page); the next turn is as any other`, () => {
	const log: string[] = [];
	const { offers, next } = offersUntilTurnTwo(discardThree(crowdedEndPhase(log)));
	// The rival may answer the discard's chain with a Quick Effect from the hand...
	expect(offers.some((offer) => offer.player === "rival" && offer.code === "fixture-hand-quick" && offer.links > 0)).toBe(true);
	// ...but nobody is offered anything as Chain Link 1 once it has resolved.
	expect(offers.filter((offer) => offer.links === 0)).toEqual([]);
	expect(next.turn).toEqual({ player: "rival", number: 2, phase: "draw" });
	// Turn 2: the rival's Quick Effect from the hand is offered again with nothing on the chain.
	expect(legalActions(next).some((action) => action.type === "activate" && next.cards[action.card]!.code === "fixture-hand-quick")).toBe(true);
	expect(next.chain).toEqual([]);
});

/**
 * A made-up monster (no real card): "If this card is sent from the hand to the GY: during the End Phase of this turn, [something]"
 * (a mandatory delayed process, as "banish it until the End Phase" or "destroy it during the End Phase" leave), and "... you can
 * [something else]" (an optional one). Both are noted in `log` when applied.
 */
const discardDelays = (log: string[]): CardDef => ({
	code: "fixture-discard-delay",
	kind: "monster",
	facts: { level: 1, atk: 0, def: 0 },
	effects: [
		{
			...discardWatch(log).effects![0]!,
			operation: (duel, link) => {
				const due = { phase: "end" as const, turn: duel.turn.number };
				const owed = delay(duel, link, { due, mandatory: true, apply: (board) => (log.push(`mandatory on turn ${board.turn.number} ${board.turn.phase}`), board) });
				return delay(owed, link, { due, mandatory: false, apply: (board) => (log.push("optional"), board) });
			},
		},
	],
});

it("a mandatory delayed process the hand size discard's chain leaves for that End Phase is still applied before the turn passes; an optional one is not offered (the closing, the core's reading: no Konami page)", () => {
	const log: string[] = [];
	const start = startDuel({ ...setup, you: { deck: Array<string>(14).fill("fixture-discard-delay") }, defs: { "fixture-discard-delay": discardDelays(log) } });
	const extra = start.piles.you.deck.slice(0, 4);
	const crowded: Duel = {
		...start,
		piles: { ...start.piles, you: { ...start.piles.you, deck: start.piles.you.deck.slice(4), hand: [...start.piles.you.hand, ...extra] } },
		cards: { ...start.cards, ...Object.fromEntries(extra.map((id) => [id, { ...start.cards[id]!, zone: "hand" as const }])) },
	};
	let duel = discardThree(passUntil(crowded, (duel) => duel.asking !== null));
	// The discard's chain is built and resolved; each link leaves its two delayed processes.
	for (let guard = 0; guard < 40 && (duel.building || duel.asking || duel.chain.length > 0); guard++) duel = act(duel, duel.building || duel.asking ? legalActions(duel).find((action) => action.type !== "pass") ?? { type: "pass" } : { type: "pass" });
	expect(duel.turn).toMatchObject({ player: "you", number: 1, phase: "end" });
	expect(duel.closing).toBe(true);
	// The three mandatory ones are owed: no pass, and nothing but them (the optional ones and fresh chains stay closed).
	for (let applied = 0; applied < 3; applied++) {
		const legal = legalActions(duel);
		expect(legal.length).toBe(3 - applied);
		expect(legal.every((action) => action.type === "apply")).toBe(true);
		duel = act(duel, legal[0]!);
	}
	expect(log.filter((line) => line.startsWith("mandatory"))).toEqual(["mandatory on turn 1 end", "mandatory on turn 1 end", "mandatory on turn 1 end"]);
	const next = passUntil(duel, (duel) => duel.turn.number === 2);
	expect(log).not.toContain("optional");
	expect(next.turn).toEqual({ player: "rival", number: 2, phase: "draw" });
	expect(next.delayed).toEqual([]);
});

it("a low-level fixture Duel (`createDuel`, no normal draws) keeps any hand size, as before", () => {
	const fixture = createDuel(setup);
	const handed: Duel = { ...fixture, piles: { ...fixture.piles, you: { ...fixture.piles.you, hand: fixture.piles.you.deck.slice(0, 8), deck: fixture.piles.you.deck.slice(8) } }, cards: { ...fixture.cards, ...Object.fromEntries(fixture.piles.you.deck.slice(0, 8).map((id) => [id, { ...fixture.cards[id]!, zone: "hand" as const }])) } };
	const next = passUntil(handed, (duel) => duel.turn.number === 2);
	expect(next.piles.you.hand).toHaveLength(8);
});
