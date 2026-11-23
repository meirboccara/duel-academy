import { describe, expect, it } from "vitest";
import { cites, moveCard } from "../../src";
import { continuousCards, nextTurn } from "../rules/continuous-fixtures";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";

const card = "droll-lock-bird";
const defs = { ...REAL_CARDS, ...continuousCards() };

describe("Droll & Lock Bird, written as an effect record", () => {
	it(`${cites("droll-lock-bird", "text")} is a Quick Effect from the hand, offered once the opponent has added a card from the Deck to their hand outside the Draw Phase`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming"], deck: ["umi"] } });
		// The rival, the turn player, has priority first after the chain; Droll is offered to the opponent once they pass.
		expect(offered(play(start, "activate terraforming", "pass"))).toContain(`activate ${card}`);
		// Before anything was added, it is not offered.
		expect(offered(position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming"], deck: ["umi"] } }))).not.toContain(`activate ${card}`);
	});
	it(`${cites("droll-lock-bird", "text")} is not offered for a card its own controller adds, nor in the Draw Phase, nor when the card comes from elsewhere than the Deck`, () => {
		const own = play(position({ defs, you: { hand: [card, "terraforming"], deck: ["umi"] } }), "activate terraforming", "pass");
		expect(codes(own, "you", "hand")).toContain("umi");
		expect(offered(own)).not.toContain(`activate ${card}`);
		// In the Draw Phase the opponent's draw does not count.
		const drawPhase = position({ defs, turn: "rival", phase: "draw", you: { hand: [card] }, rival: { deck: ["umi"] } });
		const drew = moveCard(drawPhase, drawPhase.piles.rival.deck[0]!, { zone: "hand" });
		expect(offered({ ...drew, priority: { holder: "you", passed: ["rival"], open: false } })).not.toContain(`activate ${card}`);
		// A card added from the Graveyard is not "from the Main Deck".
		const recovered = position({ defs, turn: "rival", you: { hand: [card] }, rival: { graveyard: ["umi"] } });
		const back = moveCard(recovered, recovered.piles.rival.graveyard[0]!, { zone: "hand" });
		expect(offered({ ...back, priority: { holder: "you", passed: ["rival"], open: false } })).not.toContain(`activate ${card}`);
	});
	it(`${cites("droll-lock-bird", "text")} sends itself to the Graveyard, and for the rest of this turn no card is added from either Deck to the hand`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card], deck: ["umi"] }, rival: { hand: ["terraforming", "pot-of-greed"], deck: ["umi", "celtic-guardian", "celtic-guardian"] } });
		const locked = play(start, "activate terraforming", "pass", `activate ${card}`);
		expect(codes(locked, "you", "graveyard")).toEqual([card]);
		// Both players' cards stay in their Decks.
		const mine = moveCard(locked, locked.piles.you.deck[0]!, { zone: "hand" });
		expect(codes(mine, "you", "hand")).toEqual([]);
		const theirs = moveCard(locked, locked.piles.rival.deck[0]!, { zone: "hand" });
		expect(theirs.piles.rival.hand).toEqual(locked.piles.rival.hand);
		// The rival's Pot of Greed is still played in full as far as it goes: it can be activated, and draws nothing.
		const pot = play(locked, "pass", "pass", "activate pot-of-greed");
		expect(codes(pot, "rival", "graveyard")).toContain("pot-of-greed");
		expect(codes(pot, "rival", "hand")).toEqual(codes(locked, "rival", "hand").filter((code) => code !== "pot-of-greed"));
		// It is a lock for this turn only.
		const later = nextTurn(locked, 5);
		const free = moveCard(later, later.piles.you.deck[0]!, { zone: "hand" });
		expect(codes(free, "you", "hand")).toHaveLength(codes(later, "you", "hand").length + 1);
	});
	it(`${cites("droll-lock-bird", "notes")} can be activated after the whole chain when the card was added in the middle of it`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card, "filler-b"] }, rival: { hand: ["filler", "quick-search"], deck: ["umi"] } });
		// Chain Link 1: the rival's filler; 2: yours; 3: the rival's search, which resolves first, then the other two resolve.
		const chained = play(start, "activate filler", "activate filler-b", "activate quick-search", "pass");
		expect(chained.chain).toEqual([]);
		expect(offered(chained)).toContain(`activate ${card}`);
	});
});
