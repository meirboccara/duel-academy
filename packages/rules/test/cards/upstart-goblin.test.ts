import { describe, expect, it } from "vitest";
import { type CardDef, cites, type Duel, moveCard } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";

const card = "upstart-goblin";
const options = { everyWindow: true };

/**
 * Made-up cards around it: a Quick-Play Spell the rival Sets to send the top card of your Deck to the GY in response, and a monster of
 * yours with an optional "when a card is added from your Deck to your hand: you can ..." trigger.
 */
const log: string[] = [];
const defs: Record<string, CardDef> = {
	...REAL_CARDS,
	"mill-your-top": { code: "mill-your-top", kind: "quick-play", effects: [{ type: "activation", operation: (duel: Duel) => (duel.piles.you.deck[0] === undefined ? duel : moveCard(duel, duel.piles.you.deck[0], { zone: "graveyard" })) }] },
	"draw-watcher": {
		code: "draw-watcher",
		kind: "monster",
		effects: [{ type: "trigger", timing: "when", event: (_duel, event, { player }) => event.type === "added-to-hand" && event.from === "deck" && event.card.owner === player, operation: (duel) => (log.push("draw-watcher"), duel) }],
	},
};

describe("Upstart Goblin, written as an effect record", () => {
	it(`${cites("upstart-goblin", "text")} draws 1 card, then the opponent gains 1000 LP; it has no once-per-turn limit`, () => {
		const start = position({ defs, you: { hand: [card, card], deck: ["umi", "other-field"] } });
		const once = play(start, `activate ${card}`);
		expect(codes(once, "you", "hand").filter((code) => code !== card)).toEqual([start.cards[start.piles.you.deck[0]!]!.code]);
		expect(once.lp).toEqual({ you: 8000, rival: 9000 });
		const twice = play(once, `activate ${card}`);
		expect(twice.lp.rival).toBe(10000);
		expect(codes(twice, "you", "deck")).toEqual([]);
	});
	it(`${cites("upstart-goblin", "notes-deck")} can be activated only while its controller has a card in the Deck`, () => {
		expect(offered(position({ defs, you: { hand: [card] } }))).not.toContain(`activate ${card}`);
		expect(offered(position({ defs, you: { hand: [card], deck: ["umi"] } }))).toContain(`activate ${card}`);
	});
	it(`${cites("upstart-goblin", "notes-sequence")} the opponent gains LP only if the card was drawn: with the Deck emptied in response, nothing happens`, () => {
		const start = position({ defs, options, you: { hand: [card], deck: ["umi"] }, rival: { set: ["mill-your-top"] } });
		const done = play(start, `activate ${card}`, "activate mill-your-top", "pass", "pass");
		expect(done.chain).toEqual([]);
		expect(codes(done, "you", "graveyard").sort()).toEqual([card, "umi"].sort());
		expect(done.lp.rival).toBe(8000);
	});
	it(`${cites("upstart-goblin", "notes-sequence")} the draw and the LP gain do not happen at the same time: an optional "when" trigger on the draw misses the timing`, () => {
		log.length = 0;
		const start = position({ defs, you: { hand: [card, "pot-of-greed"], monsters: ["draw-watcher"], deck: ["umi", "other-field", "normal-4"] } });
		const after = play(start, `activate ${card}`);
		expect(after.lp.rival).toBe(9000);
		expect(offered(after).some((label) => label.includes("draw-watcher") && label.startsWith("activate"))).toBe(false);
		// A draw that is the last thing to happen (Pot of Greed) lets it trigger.
		const drew = play(start, "activate pot-of-greed");
		expect(offered(drew)).toContain("activate draw-watcher");
	});
	it("cannot be activated while Droll & Lock Bird's lock applies (YGOProJudge's answer only, asked 2026-11-24, no source cited)", () => {
		const start = position({ defs, turn: "rival", you: { hand: ["droll-lock-bird"] }, rival: { hand: ["terraforming", card], deck: ["umi", "normal-4"] } });
		const locked = play(start, "activate terraforming", "activate droll-lock-bird");
		expect(locked.chain).toEqual([]);
		// The game state is open again (the rival could Set it), and it is still not offered.
		expect(locked.priority.open).toBe(true);
		expect(offered(locked)).toContain(`set ${card}`);
		expect(offered(locked)).not.toContain(`activate ${card}`);
	});
});
