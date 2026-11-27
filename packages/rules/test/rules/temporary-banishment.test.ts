import { describe, expect, it } from "vitest";
import { banishTemporarily, type CardDef, changeControl, cites, type Due, type Duel, flipFaceDown, flipFaceUp, type Link, nextPhaseTurn, other, specialSummon, takeControl, targetsOf } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";

/**
 * S2 of docs/rules-core/sky-striker-gaps.md: temporary banishment (`banishTemporarily`, src/temporary.ts): "banish it until the End
 * Phase", "until your opponent's next End Phase". Made-up cards: Quick-Play Spells with S:P Little Knight's and Sky Striker Ace -
 * Zeke's wording, a monster with "If this card is sent to the GY", a monster with Sky Striker Ace - Shizuku's End Phase condition,
 * and a recorder of Summons and returns. Konami's Japanese notes on Zeke, S:P Little Knight and Ecclesia and the Dark Dragon, and Q&A
 * fids 8571, 24001, 24029, 11586, 16743, 17476 and 24032 (OCG only).
 */
function cards(log: string[]): Record<string, CardDef> {
	const monsters = (duel: Duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster];
	const blink = (code: string, count: number, due: (duel: Duel, link: Link) => Due): CardDef => ({
		code,
		kind: "quick-play",
		effects: [{ type: "activation", target: monsters, targetCount: { min: count, max: count }, operation: (duel, link) => banishTemporarily(duel, targetsOf(duel, link).map((card) => card.id), link, due(duel, link)) }],
	});
	const thisEndPhase = (duel: Duel): Due => ({ phase: "end", turn: duel.turn.number });
	const plain = (code: string): CardDef => ({ code, kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } });
	return {
		"fixture-a": plain("fixture-a"),
		"fixture-b": plain("fixture-b"),
		// "Target 1 monster on the field; banish it until the End Phase."
		"fixture-blink": blink("fixture-blink", 1, thisEndPhase),
		// "Target 2 monsters on the field; banish both until the End Phase."
		"fixture-blink-two": blink("fixture-blink-two", 2, thisEndPhase),
		// "Target 1 monster on the field; banish it until your opponent's next End Phase."
		"fixture-blink-far": blink("fixture-blink-far", 1, (duel, link) => ({ phase: "end", turn: nextPhaseTurn(duel, "end", other(link.player)) })),
		// "If this card is sent to the GY: ..." (mandatory, so that it would show).
		"fixture-garura": {
			code: "fixture-garura",
			kind: "monster",
			facts: { level: 4, atk: 1000, def: 1000 },
			effects: [{ type: "trigger", range: "graveyard", mandatory: true, event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.after.zone === "graveyard", operation: (duel) => (log.push("garura"), duel) }],
		},
		"fixture-fusion": { code: "fixture-fusion", kind: "monster", facts: { frame: "fusion", level: 8, atk: 3000, def: 2500 } },
		"fixture-synchro": { code: "fixture-synchro", kind: "monster", facts: { frame: "synchro", level: 8, atk: 2500, def: 2500 } },
		"fixture-immune": { code: "fixture-immune", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects" }] }] },
		// "Once per turn, during the End Phase, if this card was Special Summoned this turn: You can ...".
		"fixture-shizuku": {
			code: "fixture-shizuku",
			kind: "monster",
			facts: { frame: "link", link: 1, arrows: ["top-right"], atk: 1500 },
			effects: [{ type: "trigger", during: "end", eitherTurn: true, once: { scope: "instance", acrossMoves: true }, condition: (duel, { card }) => card.specialSummoned && card.summonedTurn === duel.turn.number, operation: (duel) => (log.push("shizuku"), duel) }],
		},
		// "Target 1 monster your opponent controls; take control of it until the End Phase."
		"fixture-mind": { code: "fixture-mind", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[other(player)].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => takeControl(board, card.id, link.player, board.turn.number, link), duel) }] },
		// "Special Summon 1 monster from your hand."
		"fixture-fill": { code: "fixture-fill", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => { const id = duel.piles[link.player].hand.find((card) => duel.defs[duel.cards[card]!.code]?.kind === "monster"); return id === undefined ? duel : specialSummon(duel, link.player, id); } }] },
		// Notes every Summon, and every monster that comes to a Monster Zone from banishment (with the batch of its move).
		"fixture-recorder": {
			code: "fixture-recorder",
			kind: "monster",
			facts: { level: 1, atk: 0, def: 0 },
			effects: [
				{
					type: "trigger",
					event: (_duel, event) => {
						if (event.type === "summoned") log.push(`summoned ${event.card.code}`);
						if (event.type === "moved" && event.before.zone === "banished" && event.after.zone === "monster") log.push(`back ${event.after.code} batch ${event.batch}`);
						return false;
					},
					operation: (duel) => duel,
				},
			],
		},
	};
}

const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;
const board = (log: string[], you: SideSpec, rival: SideSpec = {}): Duel => position({ defs: cards(log), you, rival });

/** Passes until the turn player holds priority in an open game state of `phase`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"], turn = duel.turn.number): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.number === turn && next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

/** A monster of the player's Extra Deck, Special Summoned by an effect this turn; nothing of the setup is "the last thing that happened". */
function summonedFromExtra(duel: Duel, side: "you" | "rival", code: string): Duel {
	return { ...specialSummon(duel, side, idOf(duel, code)), live: [], waiting: [] };
}

describe("temporary banishment (S2)", () => {
	it(`${cites("rules", "temporary-banishment-return")} ${cites("rules", "temporary-banishment-zone-chosen-by-controller")} "until your opponent's next End Phase": the monster comes back then, as a process of the effect's player that starts no chain and is not a Summon, to a Main Monster Zone of the player who controlled it (who chooses the zone), in the position it had`, () => {
		const log: string[] = [];
		const start = board(log, { hand: ["fixture-blink-far"], monsters: ["fixture-recorder"] }, { defense: ["fixture-b"] });
		const b = idOf(start, "fixture-b");
		const gone = play(start, "activate fixture-blink-far > fixture-b");
		expect(gone.cards[b]).toMatchObject({ zone: "banished", face: "up" });
		expect(gone.delayed).toMatchObject([{ player: "you", mandatory: true, due: { phase: "end", turn: 4 } }]);
		// Not in this turn's End Phase: nothing is owed there.
		expect(offered(toPhase(gone, "end"))).toEqual(["pass"]);
		// The rival's End Phase (turn 4): the rival first, then you, who must do it.
		const theirEnd = toPhase(gone, "end", 4);
		expect([theirEnd.turn.player, offered(theirEnd)]).toEqual(["rival", ["pass"]]);
		const yours = play(theirEnd, "pass");
		expect([yours.priority.holder, offered(yours)]).toEqual(["you", ["apply fixture-blink-far"]]);
		const asked = play(yours, "apply fixture-blink-far");
		// No chain; the player who controlled it chooses the zone.
		expect(asked.chain).toEqual([]);
		expect(asked.asking).toMatchObject({ player: "rival" });
		expect(offered(asked)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
		const back = play(asked, "place 3");
		expect(back.cards[b]).toMatchObject({ zone: "monster", controller: "rival", slot: 3, face: "up", position: "defense" });
		// Not a Special Summon: no `summoned` event, no Summon noted for the turn.
		expect(log).toEqual([expect.stringMatching(/^back fixture-b batch \d+$/)]);
		expect(back.summons).toEqual([]);
		expect(back.cards[b]!.specialSummoned).toBe(false);
		expect([back.turn.number, back.turn.phase, back.delayed]).toEqual([4, "end", []]);
	});
	it(`${cites("rules", "temporary-banishment-face-down")} a face-down monster is banished face-down and comes back in face-down Defense Position`, () => {
		const start = board([], { hand: ["fixture-blink"] }, { facedown: ["fixture-b"] });
		const b = idOf(start, "fixture-b");
		const gone = play(start, "activate fixture-blink > fixture-b");
		expect(gone.cards[b]).toMatchObject({ zone: "banished", face: "down" });
		const back = play(toPhase(gone, "end"), "apply fixture-blink", "place 0");
		expect(back.cards[b]).toMatchObject({ zone: "monster", controller: "rival", face: "down", position: "defense" });
	});
	it(`${cites("rules", "temporary-banishment-unaffected-stays")} a target that is unaffected by the effect stays; the other one is still banished, and comes back`, () => {
		const start = board([], { hand: ["fixture-blink-two"], monsters: ["fixture-a"] }, { monsters: ["fixture-immune"] });
		const gone = play(start, "activate fixture-blink-two > fixture-a > fixture-immune");
		expect(codes(gone, "rival", "monster")).toEqual(["fixture-immune"]);
		expect(codes(gone, "you", "banished")).toEqual(["fixture-a"]);
		const back = play(toPhase(gone, "end"), "apply fixture-blink-two", "place 2");
		expect(back.cards[idOf(back, "fixture-a")]).toMatchObject({ zone: "monster", controller: "you", slot: 2 });
	});
	it(`${cites("rules", "temporary-banishment-return-together")} the monsters banished by one effect come back at the same time, each player choosing the zone of theirs`, () => {
		const log: string[] = [];
		const start = board(log, { hand: ["fixture-blink-two"], monsters: ["fixture-a", "fixture-recorder"] }, { monsters: ["fixture-b"] });
		const gone = play(start, "activate fixture-blink-two > fixture-a > fixture-b");
		const end = toPhase(gone, "end");
		// The effect's player cannot let the End Phase pass before it is done.
		expect(offered(end)).toEqual(["apply fixture-blink-two"]);
		const first = play(end, "apply fixture-blink-two");
		expect(first.asking).toMatchObject({ player: "you" });
		// Nothing is back until both zones are chosen.
		expect(first.cards[idOf(first, "fixture-a")]!.zone).toBe("banished");
		const second = play(first, "place 4");
		expect(second.asking).toMatchObject({ player: "rival" });
		expect(second.cards[idOf(second, "fixture-a")]!.zone).toBe("banished");
		const back = play(second, "place 1");
		expect(back.cards[idOf(back, "fixture-a")]).toMatchObject({ zone: "monster", controller: "you", slot: 4 });
		expect(back.cards[idOf(back, "fixture-b")]).toMatchObject({ zone: "monster", controller: "rival", slot: 1 });
		const batches = log.map((line) => /^back (\S+) batch (\d+)$/.exec(line)!);
		expect(batches.map((match) => match[1])).toEqual(["fixture-a", "fixture-b"]);
		expect(batches[0]![2]).toBe(batches[1]![2]);
	});
	it(`${cites("rules", "temporary-banishment-return-together")} ${cites("rules", "temporary-banishment-placed-not-sent")} a monster that cannot come back is placed in the GY, which is not "sent to the GY"; the other one still comes back`, () => {
		const log: string[] = [];
		const start = board(log, { hand: ["fixture-blink-two"], monsters: ["fixture-a"] }, { hand: ["fixture-b"], set: ["fixture-fill"], monsters: ["fixture-garura", "fixture-b", "fixture-b", "fixture-b", "fixture-b"] });
		// The rival fills the zone their monster left: none is free in the End Phase.
		const gone = play(start, "activate fixture-blink-two > fixture-a > fixture-garura", "pass", "activate fixture-fill");
		expect(codes(gone, "rival", "monster")).toHaveLength(5);
		const back = play(toPhase(gone, "end"), "apply fixture-blink-two", "place 0");
		expect(back.cards[idOf(back, "fixture-a")]).toMatchObject({ zone: "monster", controller: "you" });
		expect(back.cards[idOf(back, "fixture-garura")]).toMatchObject({ zone: "graveyard" });
		expect(log).toEqual([]);
		expect(back.chain).toEqual([]);
	});
	it(`${cites("rules", "temporary-banishment-one-zone-pick")} ${cites("rules", "temporary-banishment-placed-not-sent")} with one zone for two monsters, their player picks the one that comes back; the other is placed in the GY, not sent`, () => {
		const log: string[] = [];
		const start = board(log, { hand: ["fixture-blink-two", "fixture-fill", "fixture-b"], monsters: ["fixture-a", "fixture-garura", "fixture-b", "fixture-b", "fixture-b"] });
		const gone = play(start, "activate fixture-blink-two > fixture-a > fixture-garura", "pass", "activate fixture-fill");
		expect(codes(gone, "you", "monster")).toHaveLength(4);
		const asked = play(toPhase(gone, "end"), "apply fixture-blink-two");
		expect(asked.asking).toMatchObject({ player: "you" });
		expect(offered(asked)).toEqual(["choose fixture-a", "choose fixture-garura"]);
		const back = play(asked, "choose fixture-a");
		expect(back.cards[idOf(back, "fixture-a")]).toMatchObject({ zone: "monster", controller: "you" });
		expect(back.cards[idOf(back, "fixture-garura")]).toMatchObject({ zone: "graveyard" });
		expect(log).toEqual([]);
	});
	it(`${cites("rules", "temporary-banishment-no-zone-graveyard")} with no usable Main Monster Zone when it would come back, the monster is placed in the GY from banishment`, () => {
		const start = board([], { hand: ["fixture-blink", "fixture-fill", "fixture-b"], monsters: ["fixture-a", "fixture-b", "fixture-b", "fixture-b", "fixture-b"] });
		const gone = play(start, "activate fixture-blink > fixture-a", "pass", "activate fixture-fill");
		expect(codes(gone, "you", "monster")).toHaveLength(5);
		const back = play(toPhase(gone, "end"), "apply fixture-blink");
		expect(back.asking).toBeNull();
		expect(back.cards[idOf(back, "fixture-a")]).toMatchObject({ zone: "graveyard" });
		expect(codes(back, "you", "monster")).toHaveLength(5);
	});
	it(`${cites("rules", "temporary-banishment-not-a-summon")} a Fusion Monster that was not properly Summoned comes back too: it is not a Special Summon`, () => {
		const log: string[] = [];
		const start = board(log, { hand: ["fixture-blink"], monsters: ["fixture-recorder"] }, { monsters: ["fixture-fusion"] });
		const fusion = idOf(start, "fixture-fusion");
		expect(start.cards[fusion]!.proper).toBe(false);
		const back = play(toPhase(play(start, "activate fixture-blink > fixture-fusion"), "end"), "apply fixture-blink", "place 0");
		expect(back.cards[fusion]).toMatchObject({ zone: "monster", controller: "rival", proper: false });
		expect(log.filter((line) => line.startsWith("summoned"))).toEqual([]);
		expect(back.summons).toEqual([]);
	});
	it(`${cites("rules", "from-extra-deck-kept-through-temporary-banishment")} ${cites("rules", "from-extra-deck-lost-face-down")} a monster Special Summoned from the Extra Deck is still one after a temporary banishment, and no longer one once turned face-down (still a Special Summoned monster)`, () => {
		const start = summonedFromExtra(board([], { hand: ["fixture-blink"], extra: ["fixture-synchro"] }), "you", "fixture-synchro");
		const synchro = idOf(start, "fixture-synchro");
		expect(start.cards[synchro]).toMatchObject({ zone: "monster", specialSummoned: true, summonedFrom: "extra", summonedTurn: 3 });
		const back = play(toPhase(play(start, "activate fixture-blink > fixture-synchro"), "end"), "apply fixture-blink", "place 0");
		expect(back.cards[synchro]).toMatchObject({ zone: "monster", specialSummoned: true, summonedFrom: "extra" });
		const flipped = flipFaceUp(flipFaceDown(start, synchro), synchro);
		expect(flipped.cards[synchro]).toMatchObject({ zone: "monster", face: "up", specialSummoned: true, summonedFrom: null });
	});
	it(`${cites("rules", "temporary-banishment-control-without-duration-kept")} a monster whose control was taken with no duration comes back to the player who had taken it`, () => {
		const placed = board([], { hand: ["fixture-blink"] }, { monsters: ["fixture-b"] });
		const b = idOf(placed, "fixture-b");
		const start = { ...changeControl(placed, b, "you"), live: [], waiting: [] };
		const asked = play(toPhase(play(start, "activate fixture-blink > fixture-b"), "end"), "apply fixture-blink");
		expect(asked.asking).toMatchObject({ player: "you" });
		const back = play(asked, "place 1");
		expect(back.cards[b]).toMatchObject({ zone: "monster", controller: "you", owner: "rival", slot: 1 });
		expect(back.asking).toBeNull();
	});
	it(`${cites("rules", "temporary-banishment-control-with-duration-ends")} a control change "until the End Phase" ends with the banishment: back on the field, the monster goes to its previous controller at once`, () => {
		const start = board([], { hand: ["fixture-mind", "fixture-blink-far"] }, { monsters: ["fixture-b"] });
		const b = idOf(start, "fixture-b");
		const taken = play(start, "activate fixture-mind > fixture-b", "pass", "place 0");
		expect(taken.cards[b]).toMatchObject({ controller: "you" });
		const gone = play(taken, "activate fixture-blink-far > fixture-b");
		expect(gone.modifiers.filter((modifier) => modifier.layer.kind === "control")).toEqual([]);
		// Nothing to give back in this turn's End Phase: the monster is banished.
		expect(offered(toPhase(gone, "end"))).toEqual(["pass"]);
		const yours = play(toPhase(gone, "end", 4), "pass");
		const asked = play(yours, "apply fixture-blink-far");
		// It comes back to the player who controlled it when it was banished...
		expect(asked.asking).toMatchObject({ player: "you" });
		const handed = play(asked, "place 2");
		// ... and the control goes back at once, the rival choosing the zone.
		expect(handed.asking).toMatchObject({ player: "rival" });
		const back = play(handed, "place 4");
		expect(back.cards[b]).toMatchObject({ zone: "monster", controller: "rival", slot: 4 });
	});
	it(`${cites("rules", "summoned-this-turn-needs-face-up-since")} a monster that was temporarily banished is a new card for "if this card was Special Summoned this turn": it must have stayed face-up in the Monster Zone since`, () => {
		const log: string[] = [];
		const start = summonedFromExtra(board(log, { hand: ["fixture-blink"], extra: ["fixture-shizuku"] }), "you", "fixture-shizuku");
		const shizuku = idOf(start, "fixture-shizuku");
		expect(start.cards[shizuku]).toMatchObject({ zone: "monster", slot: 5 });
		// Left alone, its End Phase effect can be activated.
		expect(offered(toPhase(start, "end"))).toContain("activate fixture-shizuku");
		const end = toPhase(play(start, "activate fixture-blink > fixture-shizuku"), "end");
		expect(offered(end)).toEqual(["apply fixture-blink"]);
		const back = play(end, "apply fixture-blink", "place 2");
		// From the Extra Monster Zone it comes back to a Main Monster Zone.
		expect(back.cards[shizuku]).toMatchObject({ zone: "monster", controller: "you", slot: 2, summonedTurn: 0 });
		expect([back.turn.phase, offered(back)]).toEqual(["end", ["pass"]]);
	});
});
