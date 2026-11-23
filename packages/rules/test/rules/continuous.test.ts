import { describe, expect, it } from "vitest";
import { atk, cites, def, isNegated, level, locked, originalAtk } from "../../src";
import { type Duel, type Link, moveCard } from "../../src";
import { nextTurn, toPhase } from "./continuous-fixtures";
import { codes, offered, play, position, REAL_CARDS } from "./fixtures";
import { continuousCards } from "./continuous-fixtures";

const defs = continuousCards();
const options = { everyWindow: true };

/** The id of the only card with this code on the side. */
const idOf = (duel: ReturnType<typeof position>, code: string) => Object.values(duel.cards).find((card) => card.code === code)!.id;

describe("ATK, DEF and Level are queries over the board", () => {
	it(`${cites("rules", "atk-original-glossary")} a monster's ATK, DEF and Level are the printed ones, and its original ATK too`, () => {
		const start = position({ defs, you: { monsters: ["big"] } });
		const id = idOf(start, "big");
		expect([atk(start, id), def(start, id), level(start, id), originalAtk(start, id)]).toEqual([2000, 1000, 4, 2000]);
	});
});

describe("ATK changes: the original ATK first, the rest on top, a later 'becomes' over an earlier one", () => {
	const shrinkDefs = { ...defs, ...REAL_CARDS };
	it(`${cites("rules", "shrink-recomputes-losses")} a loss that was there before Shrink is added on top of the halved original ATK`, () => {
		const start = position({ defs: shrinkDefs, options, you: { hand: ["drain", "shrink"], monsters: ["tower"] } });
		const lowered = play(start, "activate drain > tower", "pass", "pass");
		expect(atk(lowered, idOf(lowered, "tower"))).toBe(2400);
		const done = play(lowered, "activate shrink > tower", "pass", "pass");
		expect(atk(done, idOf(done, "tower"))).toBe(800);
	});
	it(`${cites("rules", "set-then-shrink")} a later change of the original ATK beats an earlier 'becomes 0'`, () => {
		const start = position({ defs: shrinkDefs, options, you: { hand: ["zero", "shrink"], monsters: ["huge"] } });
		const zeroed = play(start, "activate zero > huge", "pass", "pass");
		expect(atk(zeroed, idOf(zeroed, "huge"))).toBe(0);
		const done = play(zeroed, "activate shrink > huge", "pass", "pass");
		expect(atk(done, idOf(done, "huge"))).toBe(1500);
	});
});

describe("two continuous effects that change the same ATK: the later one wins, and the older comes back when the later one stops applying", () => {
	/** Brings a face-up Spell to the field again, so its effect began to apply last. */
	const later = (duel: ReturnType<typeof position>, code: string) => {
		const id = idOf(duel, code);
		return moveCard(moveCard(duel, id, { zone: "spell", face: "down" }), id, { zone: "spell", face: "up" });
	};
	const board = () => position({ defs, you: { monsters: ["blank"], faceupSpells: ["set-spell", "double-spell"] } });
	// The cards are made up (an Equip Card waits for step 7): "set-spell" makes the ATK 2500, "double-spell" doubles the original
	// ATK while its controller has fewer Life Points than the opponent (Megamorph's wording).
	it(`${cites("rules", "set-vs-original-later-wins-a")} a 'becomes' that began later wins over a change of the original ATK, whatever the Life Points`, () => {
		const start = later(board(), "set-spell");
		const id = idOf(start, "blank");
		expect(atk(start, id)).toBe(2500);
		expect(atk({ ...start, lp: { you: 100, rival: 8000 } }, id)).toBe(2500);
	});
	it(`${cites("rules", "set-vs-original-later-wins-b")} a change of the original ATK that began later wins while it applies, and the older 'becomes' is back when it does not`, () => {
		const start = later(board(), "double-spell");
		const id = idOf(start, "blank");
		// Equal Life Points: the doubling changes nothing, so the 'becomes' is what is read.
		expect(atk(start, id)).toBe(2500);
		// Fewer Life Points: the doubling of the original ATK (0) is the later effect, so the ATK is 0.
		expect(atk({ ...start, lp: { you: 100, rival: 8000 } }, id)).toBe(0);
	});
});

describe("a monster whose effects are negated has its continuous effects switched off too", () => {
	const negating = { ...REAL_CARDS, ...defs };
	it(`${cites("rules", "impermanence-only-monster-zone")} Infinite Impermanence takes away Muka Muka's gain until the end of the turn: the effects that apply while it is in the Monster Zone are negated`, () => {
		const start = position({ defs: negating, you: { monsters: ["muka-muka"], hand: ["idle", "small", "small"] }, rival: { set: ["infinite-impermanence"] } });
		const id = idOf(start, "muka-muka");
		expect(atk(start, id)).toBe(1500);
		const negated = play(start, "set idle", "activate infinite-impermanence > muka-muka");
		expect(isNegated(negated, id)).toBe(true);
		expect([atk(negated, id), def(negated, id)]).toEqual([600, 300]);
		// When the turn is over the negation is over, and the gain applies again.
		const later = nextTurn(negated, 4);
		expect(isNegated(later, id)).toBe(false);
		expect(atk(later, id)).toBe(600 + 300 * later.piles.you.hand.length);
	});
});

describe("a negated floodgate is off, and applies again once the negation ends", () => {
	const withDrain = { ...REAL_CARDS, ...defs };
	it(`${cites("rules", "negated-floodgate-returns")} a monster's lock is off while Skill Drain negates it, and back the moment Skill Drain has left the field`, () => {
		const start = position({ defs: withDrain, you: { monsters: ["no-search"], deck: ["umi", "celtic-guardian"] }, rival: { faceupSpells: ["skill-drain"] } });
		expect(isNegated(start, idOf(start, "no-search"))).toBe(true);
		expect(locked(start, "add-to-hand")).toBe(false);
		const added = moveCard(start, start.piles.you.deck[0]!, { zone: "hand" });
		expect(added.piles.you.hand).toHaveLength(1);
		const gone = moveCard(added, idOf(added, "skill-drain"), { zone: "graveyard" });
		expect(locked(gone, "add-to-hand")).toBe(true);
		const tried = moveCard(gone, gone.piles.you.deck[0]!, { zone: "hand" });
		expect(tried.piles.you.hand).toEqual(gone.piles.you.hand);
	});
});

describe("a lock on one player", () => {
	const all = { ...REAL_CARDS, ...defs };
	it(`${cites("droll-lock-bird", "text")} stops only that player: the other may still add from the Deck and activate a search`, () => {
		const start = position({ defs: all, you: { hand: ["pot-of-greed"], monsters: ["their-search-locked"], deck: ["umi", "celtic-guardian", "celtic-guardian"] }, rival: { deck: ["umi"] } });
		expect([locked(start, "add-to-hand", "you"), locked(start, "add-to-hand", "rival")]).toEqual([false, true]);
		expect(offered(start)).toContain("activate pot-of-greed");
		const theirs = moveCard(start, start.piles.rival.deck[0]!, { zone: "hand" });
		expect(theirs.piles.rival.hand).toEqual([]);
		const mine = moveCard(start, start.piles.you.deck[0]!, { zone: "hand" });
		expect(mine.piles.you.hand).toHaveLength(2);
	});
});

describe("the added-to-hand event", () => {
	// Droll & Lock Bird listens to events, so the duel keeps them (`live`).
	const listening = { ...REAL_CARDS, ...defs };
	it(`${cites("droll-lock-bird", "text")} a card that goes to the hand says where it came from: the Deck for a draw or a search, the Graveyard for a recovery`, () => {
		const start = position({ defs: listening, you: { deck: ["umi"], graveyard: ["celtic-guardian"] } });
		const searched = moveCard(start, start.piles.you.deck[0]!, { zone: "hand" });
		expect(searched.live.filter((event) => event.type === "added-to-hand").map((event) => event.type === "added-to-hand" && event.from)).toEqual(["deck"]);
		const recovered = moveCard(start, start.piles.you.graveyard[0]!, { zone: "hand" });
		expect(recovered.live.filter((event) => event.type === "added-to-hand").map((event) => event.type === "added-to-hand" && event.from)).toEqual(["graveyard"]);
	});
});

describe("control changes that last", () => {
	const all = { ...REAL_CARDS, ...defs };
	it(`${cites("rules", "control-until-end-phase")} a monster taken until the End Phase goes back to its owner as the End Phase begins, and what applied to it before ended when it changed hands`, () => {
		const start = position({ defs: all, options, you: { hand: ["shrink", "take-control"] }, rival: { monsters: ["huge"] } });
		const shrunk = play(start, "activate shrink > huge", "pass", "pass");
		expect(atk(shrunk, idOf(shrunk, "huge"))).toBe(1500);
		// Step 7: you choose the Main Monster Zone it comes to, and the rival the one it goes back to.
		const taken = play(shrunk, "activate take-control > huge", "pass", "pass", "place 2");
		const id = idOf(taken, "huge");
		expect(codes(taken, "you", "monster")).toEqual(["huge"]);
		expect([taken.cards[id]!.controller, taken.cards[id]!.owner]).toEqual(["you", "rival"]);
		// It is a new card for its new controller: Shrink was applied to the card as it was.
		expect(atk(taken, id)).toBe(3000);
		// Still yours until the End Phase, back to the rival as it begins.
		expect(codes(toPhase(taken, "main2"), "you", "monster")).toEqual(["huge"]);
		const back = play(toPhase(taken, "end"), "place 4");
		expect(back.cards[id]!.slot).toBe(4);
		expect(back.turn.number).toBe(3);
		expect(codes(back, "rival", "monster")).toEqual(["huge"]);
		expect(codes(back, "you", "monster")).toEqual([]);
		expect(back.modifiers.filter((modifier) => modifier.layer.kind === "control")).toEqual([]);
	});
	it(`${cites("rules", "control-read-at-resolution")} a monster taken by a link that resolved first counts as yours when a later link resolves`, () => {
		const start = position({ defs: all, you: { hand: ["offer-up", "take-control"], monsters: ["big"] }, rival: { monsters: ["huge"] } });
		// Chain Link 1: offer-up ("send 1 monster you control"); Chain Link 2: take-control, which resolves first.
		const asked = play(start, "activate offer-up", "activate take-control > huge", "place 1");
		expect(offered(asked)).toEqual(["choose big", "choose huge"]);
		const sent = play(asked, "choose huge");
		expect(codes(sent, "rival", "graveyard")).toContain("huge");
	});
	// YGOProJudge only (chat, asked 2026-11-23, no source cited): with no free Main Monster Zone the card cannot be activated; if the
	// zones fill up before it resolves, the monster is destroyed by the game's rules and sent to the Graveyard.
	it("a card that takes control cannot be activated with no free Main Monster Zone (YGOProJudge lead)", () => {
		const start = position({ defs: all, options, you: { set: ["take-control"], monsters: ["big", "big", "big", "big", "big"] }, rival: { monsters: ["huge"] } });
		expect(offered(start)).not.toContain("activate take-control > huge");
	});
	it("a monster taken when no Main Monster Zone is left by then is destroyed and sent to its owner's Graveyard (YGOProJudge lead)", () => {
		const fill = { ...all, "fill-zone": { code: "fill-zone", kind: "trap" as const, effects: [{ type: "activation" as const, operation: (duel: Duel, link: Link) => moveCard(duel, duel.piles[link.player].hand[0]!, { zone: "monster", face: "up" }) }] } };
		const start = position({ defs: fill, options, you: { hand: ["small"], set: ["take-control", "fill-zone"], monsters: ["big", "big", "big", "big"] }, rival: { monsters: ["huge"] } });
		// Chain Link 1: take-control; Chain Link 2: you fill your last Main Monster Zone; then take-control resolves with no zone left.
		const done = play(start, "activate take-control > huge", "pass", "activate fill-zone", "pass", "pass");
		expect(codes(done, "you", "monster")).toHaveLength(5);
		expect(codes(done, "rival", "graveyard")).toEqual(["huge"]);
		expect(done.modifiers.filter((modifier) => modifier.layer.kind === "control")).toEqual([]);
	});
	it("a monster that left the field before the End Phase does not come back to its owner's field", () => {
		const start = position({ defs: all, options, you: { hand: ["take-control", "offer-up"] }, rival: { monsters: ["huge"] } });
		const taken = play(start, "activate take-control > huge", "pass", "pass", "place 0");
		const sent = play(taken, "activate offer-up", "pass", "pass");
		const later = nextTurn(sent, 4);
		expect(codes(later, "rival", "graveyard")).toEqual(["huge"]);
		expect(codes(later, "rival", "monster")).toEqual([]);
	});
});

// YGOProJudge only (asked 2026-11-23, sessions q-lvl1/q-lvl2, no source cited): no Konami page on the order of Level changes was found.
describe("Level changes (YGOProJudge lead only)", () => {
	const all = { ...REAL_CARDS, ...defs };
	it("the Level is the printed one, then each 'becomes' and each raise in the order they began to apply", () => {
		const start = position({ defs: all, options, you: { hand: ["level-up", "level-eight", "level-up"], monsters: ["big"] } });
		const raised = play(start, "activate level-up > big", "pass", "pass");
		expect(level(raised, idOf(raised, "big"))).toBe(6);
		const set = play(raised, "activate level-eight > big", "pass", "pass");
		expect(level(set, idOf(set, "big"))).toBe(8);
		const again = play(set, "activate level-up > big", "pass", "pass");
		expect(level(again, idOf(again, "big"))).toBe(10);
		expect(level(nextTurn(again, 4), idOf(again, "big"))).toBe(4);
	});
});

describe("pending (design D2)", () => {
	// Konami says an older lasting "halved" (Gale) or a monster's own original-ATK effect (Apollousa) does not come back when Shrink
	// ends (fids 7944, 22612); the core brings back whatever still applies. Not built: no card of ours needs it (owner decision D2).
	it.todo("an older lasting change of the original ATK does not come back when a later one (Shrink) ends");
});
