import { describe, expect, it } from "vitest";
import { act, type Action, type CardDef, cites, CARD_DEFS, legalActions, moveCard } from "../../src";
import { negationCards } from "../rules/negation-fixtures";
import { codes, offered, plainCards, play, position } from "../rules/fixtures";

const card = "infinite-impermanence";

describe("Infinite Impermanence, written as an effect record", () => {
	it(`${cites("infinite-impermanence", "negate")} a Set Infinite Impermanence negates the effects of a face-up monster: it can still activate its effect, which then does nothing`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["plain-spell"], monsters: ["ignition"] }, rival: { set: [card] } });
		// Your Set starts nothing; the rival answers with the Set Trap, targeting your monster.
		const negated = play(start, "set plain-spell", `activate ${card} > ignition`);
		expect(codes(negated, "rival", "graveyard")).toEqual([card]);
		expect(offered(negated)).toContain("activate ignition");
		const done = play(negated, "activate ignition");
		expect(log).toEqual([]);
		expect(done.chain).toEqual([]);
	});
	it(`${cites("rules", "negated-effect-on-chain-not-applied")} chained to the monster's own effect, it stops every part of that effect`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { monsters: ["bell"] }, rival: { set: [card] } });
		const done = play(start, "activate bell", `activate ${card} > bell`);
		expect(log).toEqual([]);
		expect(codes(done, "rival", "graveyard")).toEqual([card]);
		expect(done.chain).toEqual([]);
	});
	it(`${cites("infinite-impermanence", "negate")} the negation lasts until the end of the turn: on its controller's next turn the effect applies`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { monsters: ["ignition"] }, rival: { set: [card] } });
		let duel = play(start, "activate ignition", `activate ${card} > ignition`);
		expect(log).toEqual([]);
		// Still negated in the End Phase of that turn; applies again on the owner's next turn.
		for (let guard = 0; guard < 40 && !(duel.turn.number === 5 && duel.turn.phase === "main1"); guard++) duel = play(duel, "pass");
		expect(duel.turn).toMatchObject({ player: "you", number: 5, phase: "main1" });
		duel = play(duel, "activate ignition");
		expect(log).toEqual(["ignition"]);
	});
	it(`${cites("rules", "negated-monster-state")} a monster turned face-down is a new card: it is no longer negated once it is face-up again`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["reset"], monsters: ["ignition"] }, rival: { set: [card] } });
		const negated = play(start, "activate ignition", `activate ${card} > ignition`);
		expect(log).toEqual([]);
		const done = play(negated, "activate reset", "activate ignition");
		expect(log).toEqual(["ignition"]);
		expect(done.chain).toEqual([]);
	});
	it(`${cites("rules", "impermanence-negates-effect-activated-in-monster-zone")} a negated monster that is its own cost still activates: the cost is paid and the effect does nothing`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["plain-spell"], monsters: ["blazer"] }, rival: { set: [card] } });
		const negated = play(start, "set plain-spell", `activate ${card} > blazer`);
		const done = play(negated, "activate blazer");
		expect(codes(done, "you", "banished")).toEqual(["blazer"]);
		expect(log).toEqual([]);
	});
	it(`${cites("rules", "impermanence-only-monster-zone")} only effects activated in the Monster Zone are negated: a negated monster sent to the Graveyard still triggers there`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, you: { hand: ["dust"], monsters: ["critter"] }, rival: { set: [card] } });
		const negated = play(start, "activate dust", `activate ${card} > critter`);
		// The Impermanence answered Dust's activation and negated Critter first; Dust then sends Critter to the Graveyard.
		expect(codes(negated, "you", "graveyard")).toEqual(["critter", "dust"]);
		expect(log).toEqual(["critter"]);
	});
	it(`${cites("infinite-impermanence", "negate")} ${cites("rules", "impermanence-target-limits")} targets only a face-up monster whose effects can still be negated: not a face-down one, a Normal Monster or one already negated`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const start = position({ defs, you: { hand: ["plain-spell"], monsters: ["ignition", "normal-4", "effect-b"], facedown: ["monster"] }, rival: { set: [card, card] } });
		const first = play(start, "set plain-spell");
		expect([...new Set(offered(first))]).toEqual([`activate ${card} > effect-b`, `activate ${card} > ignition`, "pass"]);
		const again = play(first, `activate ${card} > ignition`, "pass");
		// "ignition" is negated now.
		expect([...new Set(offered(again))]).toEqual([`activate ${card} > effect-b`, "pass"]);
	});
	it(`${cites("infinite-impermanence", "hand")} ${cites("rules", "impermanence-hand-activation")} ${cites("rules", "impermanence-hand-either-turn")} can be activated from the hand when you control no cards, in either turn, not when you control a card`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const bare = position({ defs, you: { monsters: ["ignition"] }, rival: { hand: [card] } });
		expect(offered(play(bare, "activate ignition"))).toEqual([`activate ${card} > ignition`, "pass"]);
		const holding = position({ defs, options: { everyWindow: true }, you: { monsters: ["ignition"] }, rival: { hand: [card], set: ["spell-b"] } });
		expect(offered(play(holding, "activate ignition"))).toEqual(["pass"]);
		// In the rival's own turn too, in response to their effect.
		const own = position({ defs, turn: "rival", you: { hand: [card] }, rival: { monsters: ["ignition", "effect-b"] } });
		expect(offered(play(own, "activate ignition"))).toEqual([`activate ${card} > effect-b`, `activate ${card} > ignition`, "pass"]);
	});
	it(`${cites("rules", "cannot-be-negated-checked-at-resolution")} the negation of a card's own effects is checked against "cannot be negated" when the immune effect resolves`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const guarded = position({ defs, you: { monsters: ["immune-monster", "effect-b"] }, rival: { set: [card] } });
		play(play(guarded, "activate immune-monster", `activate ${card} > immune-monster`), "pass");
		expect(log).toEqual(["immune-monster"]);
		log.length = 0;
		const alone = position({ defs, you: { monsters: ["immune-monster"] }, rival: { set: [card] } });
		play(alone, "activate immune-monster", `activate ${card} > immune-monster`);
		expect(log).toEqual([]);
	});
	it(`${cites("rules", "impermanence-no-cards-summon-not-on-field")} the monster being Summoned is not on the field yet: with no other card, it can be activated from the hand against the Summon's negation`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const sides = { hand: ["normal-4", card] };
		const bare = position({ defs, you: sides, rival: { set: ["solemn-judgment"], monsters: ["ignition"] } });
		// That the Summon is over once this chain has resolved is YGOProJudge's lead only (see summon.test.ts); nothing here depends on it
		// except that the Summon does not succeed while the chain is open.
		const negated = play(bare, "summon normal-4", "activate solemn-judgment");
		expect(offered(negated)).toEqual([`activate ${card} > ignition`, "pass"]);
		// With a card of yours on the field, it is not offered.
		const holding = position({ defs, options: { everyWindow: true }, you: { ...sides, set: ["spell-b"] }, rival: { set: ["solemn-judgment"], monsters: ["ignition"] } });
		expect(offered(play(holding, "summon normal-4", "pass", "activate solemn-judgment"))).toEqual(["pass"]);
	});
});

describe("Infinite Impermanence's column (step 7)", () => {
	const columnCards = (log: string[]): Record<string, CardDef> => ({
		...CARD_DEFS,
		...negationCards(log),
		...plainCards(log),
		// Wonder Wand's shape: a Spell that stays on the field, whose effect sends itself to the Graveyard as its cost.
		wand: {
			code: "wand",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "ignition", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: (duel) => (log.push("wand"), duel) },
			],
		},
		umi: { code: "umi", kind: "spell", facts: { icon: "field" }, effects: [{ type: "activation", operation: (duel) => (log.push("umi"), duel) }] },
	});
	/** Your "ignition" monster; the rival's Impermanence Set in their Spell & Trap Zone 0 (column 4 as you see it); your Set Traps in your zones 4 and 3. */
	const board = (log: string[], hand: string[] = []) => {
		let duel = position({ defs: columnCards(log), you: { monsters: ["ignition"], set: ["trap", "other-trap"], faceupSpells: ["wand"], hand }, rival: { set: [card], hand: ["other-trap"] } });
		const [trap, otherTrap] = duel.piles.you.spell.filter((id) => duel.cards[id]!.face === "down");
		const wand = duel.piles.you.spell.find((id) => duel.cards[id]!.code === "wand")!;
		duel = moveCard(duel, trap!, { zone: "spell", face: "down", slot: 4 });
		duel = moveCard(duel, otherTrap!, { zone: "spell", face: "down", slot: 3 });
		return moveCard(duel, wand, { zone: "spell", slot: 1 });
	};
	it(`${cites("infinite-impermanence", "column")} ${cites("infinite-impermanence", "column-notes")} a Set one that negated its target also negates, for the rest of the turn, the Spell and Trap effects in its column on both sides, cards that arrive there later included, and no other column`, () => {
		const log: string[] = [];
		const negated = play(board(log, ["spell"]), "activate ignition", `activate ${card} > ignition`, "pass");
		expect(log).toEqual([]);
		expect(codes(negated, "rival", "graveyard")).toEqual([card]);
		// Your Trap in the same column (your zone 4) is negated; the one in the next column (zone 3) is not.
		play(negated, "activate trap", "pass");
		expect(log).toEqual([]);
		play(negated, "activate other-trap", "pass");
		expect(log).toEqual(["other-trap"]);
		// The rival's Trap Set later in their zone 0, the same column on their side, is negated too.
		const rivalTrap = negated.piles.rival.hand[0]!;
		const rivalSet = moveCard(negated, rivalTrap, { zone: "spell", face: "down", slot: 0 });
		log.length = 0;
		play(rivalSet, "activate other-trap", "activate other-trap", "pass");
		expect(log).toEqual(["other-trap"]);
		// A Spell placed in that column afterwards is negated too (once the game state is open again).
		log.length = 0;
		const open = play(negated, "pass");
		const spell = legalActions(open).find((action) => action.type === "activate" && open.cards[action.card]!.code === "spell")!;
		expect((spell as { zones?: readonly number[] }).zones).toContain(0);
		play(act(open, { ...spell, zone: 0 } as Action), "pass");
		expect(log).toEqual(["spell"]);
		log.length = 0;
		// Your zone 0 is column 0: not the column. Move the Trap away so zone 4 is free, then place the Spell there.
		const cleared = moveCard(open, open.piles.you.spell.find((id) => open.cards[id]!.slot === 4)!, { zone: "graveyard" });
		const again = legalActions(cleared).find((action) => action.type === "activate" && cleared.cards[action.card]!.code === "spell")!;
		play(act(cleared, { ...again, zone: 4 } as Action), "pass");
		expect(log).toEqual([]);
	});
	it(`${cites("infinite-impermanence", "wand-column-effect")} an effect activated by a Spell in that column is negated even when the Spell left as its cost; the Field Zone is in no column`, () => {
		const log: string[] = [];
		const start = board(log, ["umi"]);
		const wand = start.piles.you.spell.find((id) => start.cards[id]!.code === "wand")!;
		// Put the Wand in the column: the Trap in zone 4 goes to zone 0, the Wand to zone 4.
		const trap = start.piles.you.spell.find((id) => start.cards[id]!.slot === 4)!;
		const swapped = moveCard(moveCard(start, trap, { zone: "spell", face: "down", slot: 0 }), wand, { zone: "spell", slot: 4 });
		const negated = play(swapped, "activate ignition", `activate ${card} > ignition`, "pass", "pass");
		play(negated, "activate wand", "pass");
		expect(log).toEqual([]);
		play(negated, "activate umi", "pass");
		expect(log).toEqual(["umi"]);
	});
	it(`${cites("infinite-impermanence", "column-notes")} no column is negated when it was activated from the hand, or when its target's effects were not negated, and the negation of the column ends with the turn`, () => {
		const log: string[] = [];
		// From the hand (the rival controls no card).
		const fromHand = position({ defs: columnCards(log), you: { monsters: ["ignition"], set: ["trap"] }, rival: { hand: [card] } });
		const trap = fromHand.piles.you.spell[0]!;
		const placed = moveCard(fromHand, trap, { zone: "spell", face: "down", slot: 4 });
		const handNegated = play(placed, "activate ignition", `activate ${card} > ignition`, "pass");
		expect(handNegated.modifiers.filter((modifier) => typeof modifier.affects === "function")).toEqual([]);
		// Its target left before it resolved: nothing is negated, its column included.
		const gone = play(board(log, ["reset"]), "activate reset");
		expect(gone.modifiers).toEqual([]);
		// The next turn, the column is free again.
		let duel = play(board(log), "activate ignition", `activate ${card} > ignition`, "pass");
		for (let guard = 0; guard < 40 && !(duel.turn.number === 5 && duel.turn.phase === "main1"); guard++) duel = play(duel, "pass");
		log.length = 0;
		play(duel, "activate trap", "pass");
		expect(log).toEqual(["trap"]);
	});
});
