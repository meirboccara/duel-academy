import { expect, it } from "vitest";
import { act, addModifier, cites, createDuel, FOREVER, legalActions, startDuel, type Duel } from "../../src";

const setup = { seed: 17, you: { deck: Array.from({ length: 8 }, (_, i) => `you-${i}`), extra: ["extra"] }, rival: { deck: Array.from({ length: 8 }, (_, i) => `rival-${i}`) } };

function until(duel: Duel, done: (duel: Duel) => boolean): Duel {
	for (let steps = 0; steps < 100 && !done(duel); steps++) {
		const pass = legalActions(duel).find((action) => action.type === "pass");
		if (!pass) throw new Error("No legal pass before destination");
		duel = act(duel, pass);
	}
	expect(done(duel)).toBe(true);
	return duel;
}

it(`${cites("rules", "opening-hand-five")} deals five from each shuffled Deck before turn one, without changing the low-level fixture constructor`, () => {
	const fixture = createDuel(setup);
	const duel = startDuel(setup);
	for (const side of ["you", "rival"] as const) {
		expect(fixture.piles[side].hand).toEqual([]);
		expect(duel.piles[side].hand).toEqual(fixture.piles[side].deck.slice(0, 5));
		expect(duel.piles[side].deck).toEqual(fixture.piles[side].deck.slice(5));
	}
	expect(duel.piles.you.extra).toEqual(fixture.piles.you.extra);
	expect(duel.turn).toEqual({ player: "you", number: 1, phase: "draw" });
	expect(duel.drewByEffect).toEqual([]);
	expect(startDuel(setup)).toEqual(duel);
});

it(`${cites("rules", "no-draw-first-turn")} ${cites("rules", "normal-draw-or-lose")} has no first-turn draw, then the next turn player normally draws one before acting`, () => {
	const start = startDuel(setup);
	const turnOne = until(start, (duel) => duel.turn.phase === "standby");
	expect(turnOne.piles.you.hand).toEqual(start.piles.you.hand);
	expect(turnOne.piles.you.deck).toEqual(start.piles.you.deck);

	const turnTwo = until(turnOne, (duel) => duel.turn.number === 2);
	expect(turnTwo.turn).toEqual({ player: "rival", number: 2, phase: "draw" });
	expect(turnTwo.piles.rival.hand).toEqual([...start.piles.rival.hand, start.piles.rival.deck[0]]);
	expect(turnTwo.piles.rival.deck).toEqual(start.piles.rival.deck.slice(1));
	expect(turnTwo.priority).toEqual({ holder: "rival", passed: [], open: true });
	expect(turnTwo.drewByEffect).toEqual([]);
});

it("offers added-to-hand triggers for a normal draw, but never for the opening hand", () => {
	const watcher = { code: "watcher", kind: "monster" as const, effects: [{ type: "trigger" as const, range: "hand" as const, event: (_duel: Duel, event: import("../../src").GameEvent, ctx: import("../../src").EffectContext) => event.type === "added-to-hand" && event.card.id === ctx.card.id, operation: (duel: Duel, link: import("../../src").Link) => ({ ...duel, lp: { ...duel.lp, [link.player]: duel.lp[link.player] + 500 } }) }] };
	const start = startDuel({ seed: 1, defs: { watcher }, you: { deck: Array(6).fill("watcher") }, rival: { deck: Array(6).fill("watcher") }, options: { everyWindow: true } });
	expect(start.waiting).toEqual([]);
	expect(start.live).toEqual([]);
	expect(legalActions(start)).toEqual([{ type: "pass" }]);
	let drawn = until(start, (duel) => duel.turn.number === 2);
	const trigger = legalActions(drawn).find((action) => action.type === "activate");
	expect(trigger).toMatchObject({ card: start.piles.rival.deck[0], effect: 0 });
	drawn = act(drawn, trigger!);
	drawn = until(drawn, (duel) => duel.lp.rival === 8500);
	expect(drawn.drewByEffect).toEqual([]);
	expect(drawn.piles.rival.hand).toHaveLength(6);
});

it(`${cites("rules", "normal-draw-or-lose")} loses on a normal draw from an empty Deck, without treating it as a draw by card effect`, () => {
	const start = startDuel({ seed: 2, you: { deck: Array(6).fill("you") }, rival: { deck: Array(5).fill("rival") } });
	const lost = until(start, (duel) => duel.winner !== null);
	expect(lost.turn).toMatchObject({ player: "rival", number: 2, phase: "draw" });
	expect(lost.winner).toBe("you");
	expect(lost.piles.rival.hand).toHaveLength(5);
	expect(lost.drewByEffect).toEqual([]);
	expect(legalActions(lost)).toEqual([]);
});

it("ignores a card-effect draw lock, but obeys an add-from-Deck lock that still applies", () => {
	const reach = (lock: "draw" | "add-to-hand") => {
		const start = startDuel({ ...setup, first: "rival" });
		const locked = addModifier(start, { affects: () => false, until: FOREVER, layer: { kind: "lock", what: lock, who: "you" } });
		return until(locked, (duel) => duel.turn.number === 2);
	};
	const start = startDuel({ ...setup, first: "rival" });
	expect(reach("draw").piles.you.hand).toEqual([...start.piles.you.hand, start.piles.you.deck[0]]);
	expect(reach("draw").drewByEffect).toEqual([]);
	const stopped = reach("add-to-hand");
	expect(stopped.piles.you.hand).toEqual(start.piles.you.hand);
	expect(stopped.winner).toBeNull();
});

it("the normal draw is followed by the turn player's fast-effect window", () => {
	const duel = until(startDuel({ ...setup, options: { everyWindow: true } }), (duel) => duel.turn.number === 2);
	expect(duel.priority).toEqual({ holder: "rival", passed: [], open: false });
	const next = act(duel, { type: "pass" });
	expect(next.turn.phase).toBe("draw");
	expect(next.priority.holder).toBe("you");
	expect(act(next, { type: "pass" }).priority.open).toBe(true);
});
