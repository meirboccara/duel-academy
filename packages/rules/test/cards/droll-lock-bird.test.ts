import { describe, expect, it } from "vitest";
import { cites, moveCard } from "../../src";
import { continuousCards, nextTurn } from "../rules/continuous-fixtures";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";

const card = "droll-lock-bird";
const defs = { ...REAL_CARDS, ...continuousCards() };

describe("Droll & Lock Bird, written as an effect record", () => {
	it(`${cites("droll-lock-bird", "text")} is a Quick Effect from the hand, offered once the opponent has added a card from the Deck to their hand outside the Draw Phase`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming"], deck: ["umi"] } });
		// The rival, the turn player, has priority first after the chain; holding no response, they pass at once, and Droll is offered.
		expect(offered(play(start, "activate terraforming"))).toContain(`activate ${card}`);
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
		const locked = play(start, "activate terraforming", `activate ${card}`);
		expect(codes(locked, "you", "graveyard")).toEqual([card]);
		// Both players' cards stay in their Decks.
		const mine = moveCard(locked, locked.piles.you.deck[0]!, { zone: "hand" });
		expect(codes(mine, "you", "hand")).toEqual([]);
		const theirs = moveCard(locked, locked.piles.rival.deck[0]!, { zone: "hand" });
		expect(theirs.piles.rival.hand).toEqual(locked.piles.rival.hand);
		// It is a lock for this turn only.
		const later = nextTurn(locked, 5);
		const free = moveCard(later, later.piles.you.deck[0]!, { zone: "hand" });
		expect(codes(free, "you", "hand")).toHaveLength(codes(later, "you", "hand").length + 1);
	});
	it(`${cites("droll-lock-bird", "draws-fail")} an effect that draws as one part of what it does can still be activated under the lock, and draws nothing`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming", "draw-one"], deck: ["umi", "celtic-guardian"] } });
		const locked = play(start, "activate terraforming", `activate ${card}`);
		const drew = play(locked, "activate draw-one");
		expect(codes(drew, "rival", "graveyard")).toContain("draw-one");
		expect(codes(drew, "rival", "hand")).toEqual(codes(locked, "rival", "hand").filter((code) => code !== "draw-one"));
	});
	it(`${cites("droll-lock-bird", "other-parts")} a card that does something besides adding is played in full under the lock: only the add is not done`, () => {
		const log: string[] = [];
		const withLog = { ...REAL_CARDS, ...continuousCards(log) };
		const start = position({ defs: withLog, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming", "two-part"], deck: ["umi", "celtic-guardian"] } });
		const locked = play(start, "activate terraforming", `activate ${card}`);
		const played = play(locked, "activate two-part");
		expect(log).toEqual(["two-part"]);
		expect(codes(played, "rival", "deck")).toEqual(codes(locked, "rival", "deck"));
	});
	// YGOProJudge only (asked 2026-11-23, no source cited): a card whose effect is the add itself (Terraforming, Pot of Greed) cannot be
	// activated under the lock. Konami's Q&A on Drish (fid 24396, record `drish`, pending) shows the same per-card call for one bullet.
	it("Terraforming and Pot of Greed, which are there to add from the Deck, cannot be activated under the lock (YGOProJudge lead)", () => {
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming", "pot-of-greed"], deck: ["umi", "celtic-guardian", "celtic-guardian"] } });
		expect(offered(play(start, "activate terraforming"))).toContain(`activate ${card}`);
		const locked = play(start, "activate terraforming", `activate ${card}`);
		expect(offered(locked)).not.toContain("activate pot-of-greed");
		expect(offered(start)).toContain("activate pot-of-greed");
	});
	it(`${cites("droll-lock-bird", "text")} raises nothing for what was added before the chain: only adds of the chain that just resolved linger`, () => {
		// The rival searches, you let it pass; the add is then no longer the last thing that happened.
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming", "idle"], deck: ["umi"] } });
		const passed = play(start, "activate terraforming", "pass");
		expect(offered(play(passed, "set idle"))).not.toContain(`activate ${card}`);
	});
	it(`${cites("droll-lock-bird", "notes")} can be activated after the whole chain when the card was added in the middle of it`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card, "filler-b"] }, rival: { hand: ["filler", "quick-search"], deck: ["umi"] } });
		// Chain Link 1: the rival's filler; 2: yours; 3: the rival's search, which resolves first, then the other two resolve
		// (nobody holds another response, so the chain resolves at once).
		const chained = play(start, "activate filler", "activate filler-b", "activate quick-search");
		expect(chained.chain).toEqual([]);
		expect(offered(chained)).toContain(`activate ${card}`);
	});
});
