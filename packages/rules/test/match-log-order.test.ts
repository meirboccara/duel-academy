import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CARD_DEFS, describeChange, type Link, type Match, type MatchRecord, moveCard, openMatch, playMove, replayMatch, seatFor, type Side, tell } from "../src";
import { renderSeat, seatBoard } from "../src/agent-play";
import { board as ssBoard } from "./cards/sky-striker-fixtures";

/**
 * The seat log follows the order in which things really happened (duel 006, findings 4 and 5): a card drawn and discarded by one
 * resolution is logged as drawn, then discarded from the hand; what a chain link does is logged under that link, before the next one
 * resolves. Each seat still reads only what it may see.
 */

const SETUP = { seed: 1, you: { deck: [] }, rival: { deck: [] } };
const matchOf = (duel: Match["duel"]): Match => ({ setup: SETUP, duel, log: [], disputes: [] });
const toAct = (match: Match): Side => (seatFor(match, "you").toAct ? "you" : "rival");
/** Passes from whichever seat is to act while a chain is open. */
const passChain = (match: Match): Match => {
	for (let guard = 0; guard < 12 && match.duel.chain.length > 0; guard++) match = playMove(match, toAct(match), "pass");
	return match;
};
const notes = (match: Match, side: Side, from: number): string[] => seatFor(match, side).log.slice(from).flatMap((entry) => entry.notes ?? []);

describe("the seat log follows the real order of the moves", () => {
	it("a card drawn and then discarded by the same resolution is logged as drawn, then discarded from the hand; the opponent only counts the draw", () => {
		let match = matchOf(ssBoard({ hand: ["radiant-typhoon-vision"], deck: ["lightning-storm", "radiant-typhoon-vision"] }));
		match = playMove(match, "you", "activate radiant-typhoon-vision #1");
		const from = match.log.length;
		match = passChain(match);
		expect(notes(match, "you", from)).toEqual([
			"chain link 1 resolves: radiant-typhoon-vision",
			"you draw lightning-storm, radiant-typhoon-vision",
			"radiant-typhoon-vision is discarded to the Graveyard from your hand",
			"radiant-typhoon-vision is sent to the Graveyard from your Spell & Trap Zone 0",
		]);
		expect(notes(match, "rival", from)).toEqual([
			"chain link 1 resolves: radiant-typhoon-vision",
			"the opponent draws 2 cards",
			"radiant-typhoon-vision is discarded to the Graveyard from the opponent's hand",
			"radiant-typhoon-vision is sent to the Graveyard from the opponent's Spell & Trap Zone 0",
		]);
		expect(JSON.stringify(seatFor(match, "rival"))).not.toContain("lightning-storm");
		expect(renderSeat(seatBoard(match, "rival"))).not.toContain("lightning-storm");
	});

	it("what chain link 2 does is logged under it, before chain link 1 resolves", () => {
		let match = matchOf(ssBoard({ hand: ["upstart-goblin"], deck: ["raigeki"] }, { set: ["fixture-summon-counter"], extra: ["fixture-ace-light"] }));
		match = playMove(match, "you", "activate upstart-goblin");
		match = playMove(match, "rival", "activate fixture-summon-counter");
		const from = match.log.length;
		match = passChain(match);
		expect(notes(match, "you", from)).toEqual([
			"chain link 2 resolves: fixture-summon-counter",
			"fixture-ace-light is Special Summoned to Extra Monster Zone 5 (shared) from the opponent's Extra Deck",
			"chain link 1 resolves: upstart-goblin",
			"you draw raigeki",
			"LP: the opponent 8000 -> 9000 (+1000)",
			"upstart-goblin is sent to the Graveyard from your Spell & Trap Zone 0",
			"fixture-summon-counter is sent to the Graveyard from the opponent's Spell & Trap Zone 0",
		]);
		expect(notes(match, "rival", from)).toEqual([
			"chain link 2 resolves: fixture-summon-counter",
			"fixture-ace-light is Special Summoned to Extra Monster Zone 5 (shared) from your Extra Deck",
			"chain link 1 resolves: upstart-goblin",
			"the opponent draws 1 card",
			"LP: you 8000 -> 9000 (+1000)",
			"upstart-goblin is sent to the Graveyard from the opponent's Spell & Trap Zone 0",
			"fixture-summon-counter is sent to the Graveyard from your Spell & Trap Zone 0",
		]);
		expect(JSON.stringify(seatFor(match, "rival").log)).not.toContain("raigeki");
	});

	it("a negated link says it was negated, when, and that it then does nothing", () => {
		let match = matchOf(ssBoard({ hand: ["upstart-goblin"], deck: ["raigeki"] }, { hand: ["ash-blossom-joyous-spring"] }));
		match = playMove(match, "you", "activate upstart-goblin");
		match = playMove(match, "rival", "activate ash-blossom-joyous-spring");
		const from = match.log.length;
		match = passChain(match);
		expect(notes(match, "you", from)).toEqual([
			"chain link 2 resolves: ash-blossom-joyous-spring",
			"the effect of upstart-goblin (chain link 1) is negated",
			"chain link 1 resolves: upstart-goblin (its effect was negated); nothing happens",
			"upstart-goblin is sent to the Graveyard from your Spell & Trap Zone 0",
		]);
	});

	it("an effect that negates a card, then banishes it, is logged in that order", () => {
		let match = matchOf(ssBoard({ monsters: ["fixture-filler"] }, { hand: ["primite-drillbeam"], monsters: ["fixture-normal"] }, {}, "rival"));
		match = playMove(match, "rival", "activate primite-drillbeam #1 > fixture-filler");
		const from = match.log.length;
		match = passChain(match);
		expect(notes(match, "you", from)).toEqual([
			"chain link 1 resolves: primite-drillbeam",
			"lasting effect begins: the effects of fixture-filler are negated (primite-drillbeam), until the end of turn 3",
			"fixture-filler is banished from your Main Monster Zone 0",
			"primite-drillbeam is sent to the Graveyard from the opponent's Spell & Trap Zone 0",
		]);
	});

	it("a pass made for a player in the next turn's Draw Phase says when it was made, so it does not read as part of the End Phase", () => {
		const setup = { seed: 3, you: { deck: Array<string>(14).fill("sky-striker-ace-raye") }, rival: { deck: Array<string>(14).fill("raigeki") } };
		let match = openMatch(setup, CARD_DEFS);
		for (let guard = 0; guard < 30 && match.duel.turn.number === 1; guard++) match = playMove(match, toAct(match), "pass");
		const end = seatFor(match, "rival").log.at(-1)!;
		expect(end).toMatchObject({ turn: 1, phase: "end", side: "you", name: "pass", notes: ["turn 2 Draw Phase: you draw raigeki"] });
		expect(end.auto).toEqual([
			{ side: "rival", name: "pass (no legal response)" },
			{ side: "rival", name: "pass (no legal response), turn 2 Draw Phase" },
			{ side: "you", name: "pass (no legal response), turn 2 Draw Phase" },
		]);
	});

	it("duel 006 as recorded: a link whose target left, and one that found nothing to do, each say that nothing happens", () => {
		const match = replayMatch(JSON.parse(readFileSync(new URL("../../../docs/rules-core/duel-testing/duel-006.json", import.meta.url), "utf8")) as MatchRecord, CARD_DEFS);
		const all = seatFor(match, "you").log.flatMap((entry) => entry.notes ?? []);
		expect(all).toContain("chain link 1 resolves: the-fallen-and-the-virtuous; nothing happens (its target is no longer there)");
		expect(all).toContain("chain link 2 resolves: majesty-of-the-white-dragons; nothing happens");
		// Spirit Dragon (chain link 2) Summons before chain link 1 resolves.
		const summon = all.indexOf("blue-eyes-ultimate-spirit-dragon is Special Summoned to the opponent's Main Monster Zone 1 from the opponent's Extra Deck");
		expect(summon).toBeGreaterThan(all.indexOf("chain link 2 resolves: blue-eyes-spirit-dragon"));
		expect(summon).toBeLessThan(all.indexOf("chain link 1 resolves: the-fallen-and-the-virtuous; nothing happens (its target is no longer there)"));
	});

	it("a link whose target was still there when it resolved does not say the target was gone, though a later link of the same step moves it", () => {
		const before = ssBoard({ hand: ["raigeki", "pot-of-greed"] }, { monsters: ["fixture-filler"] });
		const target = before.cards[before.piles.rival.monster[0]!]!;
		const card = (code: string) => before.cards[before.piles.you.hand.find((id) => before.cards[id]!.code === code)!]!;
		const link = (code: string, targets: readonly number[]): Link => ({ player: "you", card: card(code), effect: 0, speed: 1, targets, targetMoves: targets.map((id) => before.cards[id]!.moves), answers: null, spent: null, categories: [], activationNegated: false, effectNegated: false, wasSet: false });
		const second = link("pot-of-greed", [target.id]);
		const first = link("raigeki", []);
		// Chain link 2 (targeting the monster) does nothing visible; then chain link 1 sends the monster to the Graveyard.
		let after = tell({ ...before, story: [] }, { type: "link-resolves", index: 1, link: second, negated: null, lp: before.lp });
		after = tell(after, { type: "link-resolves", index: 0, link: first, negated: null, lp: before.lp });
		after = moveCard(after, target.id, { zone: "graveyard" });
		const lines = describeChange({ ...before, story: [] }, after, "you");
		expect(lines.slice(0, 2)).toEqual(["chain link 2 resolves: pot-of-greed; nothing happens", "chain link 1 resolves: raigeki"]);
	});

	it("a monster Summoned and gone again within one step is said with the Summon noted on it while it was there", () => {
		const before = { ...ssBoard({ extra: ["sky-striker-ace-hayate"] }), story: [] };
		const id = before.piles.you.extra[0]!;
		let after = moveCard(before, id, { zone: "monster", slot: 5, face: "up" });
		// The Summon is noted on the card once it is done (here by hand: a Link Summon), then the monster leaves in the same step.
		after = { ...after, cards: { ...after.cards, [id]: { ...after.cards[id]!, summonedBy: "link" as const } } };
		after = moveCard(after, id, { zone: "graveyard" });
		expect(describeChange(before, after, "you").slice(0, 2)).toEqual([
			"sky-striker-ace-hayate is Link Summoned to Extra Monster Zone 5 (shared) from your Extra Deck",
			"sky-striker-ace-hayate is sent to the Graveyard from Extra Monster Zone 5 (shared)",
		]);
	});
});
