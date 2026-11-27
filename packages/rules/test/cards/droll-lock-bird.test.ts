import { describe, expect, it } from "vitest";
import { breakEffect, type CardDef, cites, drawCards, type Duel, gainLp, moveCard, other, printedFacts } from "../../src";
import { battleCards, toStep } from "../rules/battle-fixtures";
import { continuousCards, nextTurn } from "../rules/continuous-fixtures";
import { codes, offered, play, position, REAL_CARDS, type SideSpec } from "../rules/fixtures";

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
	it(`${cites("droll-lock-bird", "notes")} raises nothing after a chain for a card added just before it (outside any chain), though Droll could have answered that add then`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["filler"], deck: ["umi"] } });
		// The rival adds a card outside a chain (as a lingering draw does), then starts a chain that adds nothing; you let it resolve.
		const added = moveCard(start, start.piles.rival.deck[0]!, { zone: "hand" });
		const started = play(added, "activate filler");
		expect(offered(started)).toContain(`activate ${card}`);
		const resolved = play(started, "pass");
		expect(resolved.chain).toEqual([]);
		expect(offered(resolved)).not.toContain(`activate ${card}`);
	});
	it(`${cites("droll-lock-bird", "notes")} can be activated after the whole chain when the card was added in the middle of it`, () => {
		const start = position({ defs, turn: "rival", you: { hand: [card, "filler-b"] }, rival: { hand: ["filler", "quick-search"], deck: ["umi"] } });
		// Chain Link 1: the rival's filler; 2: yours; 3: the rival's search, which resolves first, then the other two resolve
		// (nobody holds another response, so the chain resolves at once).
		const chained = play(start, "activate filler", "activate filler-b", "activate quick-search");
		expect(chained.chain).toEqual([]);
		expect(offered(chained)).toContain(`activate ${card}`);
	});
	it(`${cites("droll-lock-bird", "notes")} ${cites("rules", "then-is-sequential")} is offered after the chain when the link that drew went on to something else after "then" (the notes make no exception)`, () => {
		// A made-up Normal Spell: "Draw 1 card, then your opponent gains 1000 LP" (Upstart Goblin's shape).
		const drawThenGain: CardDef = { code: "fixture-draw-then-gain", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => gainLp(breakEffect(drawCards(duel, link.player, 1)), other(link.player), 1000) }] };
		const start = position({ defs: { ...defs, "fixture-draw-then-gain": drawThenGain }, turn: "rival", you: { hand: [card] }, rival: { hand: ["fixture-draw-then-gain"], deck: ["umi"] } });
		const resolved = play(start, "activate fixture-draw-then-gain");
		expect(resolved.chain).toEqual([]);
		expect(codes(resolved, "rival", "hand")).toEqual(["umi"]);
		expect(resolved.lp.you).toBe(9000);
		expect(offered(resolved)).toContain(`activate ${card}`);
	});
	// Duel 002 (docs/rules-core/duel-testing/duel-002.md): Droll was not offered after Upstart Goblin. The real cards of the two decks that add from
	// the Deck and then go on after "then": each answer below finishes the effect (Engage!'s optional draw declined).
	it.each([
		["upstart-goblin", { hand: ["upstart-goblin"], deck: ["umi"] }, {}, []],
		["pot-of-sloth", { hand: ["pot-of-sloth"], deck: ["umi", "other-field"] }, { monsters: ["normal-4", "normal-4-b"] }, ["choose umi"]],
		["radiant-typhoon-vision", { hand: ["radiant-typhoon-vision"], deck: ["umi", "normal-4"] }, {}, []],
		["sky-striker-mobilize-engage", { hand: ["sky-striker-mobilize-engage"], deck: ["sky-striker-ace-raye", "umi"], graveyard: ["raigeki", "raigeki", "raigeki"] }, {}, ["pass"]],
	] satisfies [string, SideSpec, SideSpec, string[]][])(`${cites("droll-lock-bird", "notes")} is offered after the chain of %s, which adds from the Deck and then does more`, (adder, rival, mine, answers) => {
		const start = position({ defs, turn: "rival", you: { ...mine, hand: [card] }, rival });
		const resolved = play(start, `activate ${adder}`, ...answers);
		expect(resolved.chain).toEqual([]);
		expect(resolved.asking).toBeNull();
		expect(offered(resolved)).toContain(`activate ${card}`);
	});
});

describe("Droll & Lock Bird: identity, scope and the Damage Step", () => {
	const answer = `activate ${card}`;
	const adder = (flag: boolean): CardDef => ({
		code: "fixture-adds-from-deck",
		kind: "monster",
		facts: { level: 4, atk: 0, def: 0 },
		effects: [{ type: "quick", ...(flag ? { damageStep: true as const } : {}), operation: (duel, link) => moveCard(duel, duel.piles[link.player].deck[0]!, { zone: "hand" }) }],
	});
	const scoped = { ...battleCards(), "fixture-adds-from-deck": adder(true) };
	const mine = (duel: Duel) => offered(duel).filter((label) => label === answer);

	it(`${cites("droll-lock-bird", "facts")} is a WIND Spellcaster Effect Monster, Level 1, 0 ATK and 0 DEF`, () => {
		const duel = position({ defs, you: { hand: [card] } });
		expect(printedFacts(duel, duel.piles.you.hand[0]!)).toEqual({ name: "Droll & Lock Bird", attribute: "WIND", monsterType: "Spellcaster", level: 1, atk: 0, def: 0 });
		expect(duel.defs[card]!.kind).toBe("monster");
	});
	it(`${cites("droll-lock-bird", "notes-hand")} ${cites("droll-lock-bird", "text")} is used from the hand only: face-up on the field, it is not offered`, () => {
		const field = position({ defs, turn: "rival", you: { monsters: [card] }, rival: { hand: ["terraforming"], deck: ["umi"] } });
		expect(mine(play(field, "activate terraforming"))).toEqual([]);
		const held = position({ defs, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming"], deck: ["umi"] } });
		expect(mine(play(held, "activate terraforming"))).toEqual([answer]);
	});
	it(`${cites("droll-lock-bird", "text")} is also offered in its controller's own turn, when the opponent adds a card from the Deck then (the text names no turn)`, () => {
		const start = position({ defs, you: { hand: [card] }, rival: { deck: ["umi"] } });
		const added = moveCard(start, start.piles.rival.deck[0]!, { zone: "hand" });
		expect(offered({ ...added, priority: { holder: "you", passed: [], open: false } })).toContain(answer);
	});
	it(`${cites("droll-lock-bird", "notes-damage-step")} is not offered during the Damage Step, though the opponent adds a card there; the same Quick Effect in the Main Phase is answered`, () => {
		const main = position({ defs: scoped, turn: "rival", you: { hand: [card] }, rival: { monsters: ["fixture-adds-from-deck"], deck: ["umi"] } });
		expect(mine(play(main, "activate fixture-adds-from-deck", "pass", "pass"))).toEqual([answer]);
		const battle = position({ defs: scoped, turn: "rival", phase: "battle", options: { everyWindow: true }, you: { hand: [card], monsters: ["big"] }, rival: { monsters: ["huge", "fixture-adds-from-deck"], deck: ["umi"] } });
		const damage = toStep(play(battle, "attack huge > big"), "before");
		expect(damage.battle?.step).toBe("before");
		const added = play(damage, "activate fixture-adds-from-deck", "pass", "pass");
		expect(codes(added, "rival", "hand")).toEqual(["umi"]);
		expect(added.battle?.step).toBe("before");
		expect(mine(added)).toEqual([]);
	});
});
