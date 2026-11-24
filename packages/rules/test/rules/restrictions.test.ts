import { describe, expect, it } from "vitest";
import { act, activationLocked, canBeBanished, type Duel, FOREVER, locked, untilEndOfNextTurnOf } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "./fixtures";
import { readinessCards } from "./readiness-fixtures";

const options = { everyWindow: true };

/** Passes for both players until the turn number is `turn` (in its Draw Phase). */
function toTurn(duel: Duel, turn: number): Duel {
	let next = duel;
	for (let guard = 0; next.turn.number < turn && guard < 200; guard++) next = play(next, "pass");
	return next;
}

/**
 * Restrictions distinct from negation, as locks (src/modifiers.ts). No Konami page states these in general terms: what each lock stops
 * is the printed wording of the made-up card; what it does not stop follows YGOProJudge's answers (asked 2026-11-24, no source cited).
 */
/** Passes until the turn player holds priority in an open game state of `phase`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"]): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

describe("activation prohibitions", () => {
	it("\"your opponent cannot activate monster effects\" stops their monster effects on the field and in the hand, not their Spells, and not the player who applied it", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-no-monster-effects"], monsters: ["fixture-dark-quick"] }, rival: { hand: ["fixture-hand-quick"], set: ["fixture-plain-quick-play"], monsters: ["fixture-light-quick"] } });
		expect(offered(play(start, "pass"))).toEqual(["activate fixture-hand-quick", "activate fixture-light-quick", "activate fixture-plain-quick-play", "pass"]);
		const locked = play(start, "activate fixture-no-monster-effects", "pass", "pass");
		// The player who applied it still has their own monster's effect.
		expect(offered(locked)).toContain("activate fixture-dark-quick");
		expect(offered(play(locked, "pass"))).toEqual(["activate fixture-plain-quick-play", "pass"]);
	});
	it("a prohibition is not a negation: an effect already on the chain when the lock begins still resolves", () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, turn: "rival", you: { set: ["fixture-no-monster-effects"] }, rival: { monsters: ["fixture-light-quick"] } });
		play(start, "activate fixture-light-quick", "activate fixture-no-monster-effects", "pass", "pass");
		expect(log).toEqual(["fixture-light-quick"]);
	});
	it("\"this turn\" ends with the turn: the opponent's monster effects are offered again next turn", () => {
		const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-no-monster-effects"] }, rival: { monsters: ["fixture-light-quick"] } });
		const applied = play(start, "activate fixture-no-monster-effects", "pass", "pass");
		expect(locked(applied, "activate")).toBe(true);
		const next = toTurn(applied, 4);
		expect(locked(next, "activate")).toBe(false);
		expect(offered(next)).toContain("activate fixture-light-quick");
	});
	it("a prohibition by card name stops the card's activation for both players, and \"for the rest of this Duel\" outlives its source and the turns", () => {
		const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-name-ban", "fixture-plain-quick-play"] }, rival: { set: ["fixture-plain-quick-play", "fixture-plain-trap"] } });
		const applied = play(start, "activate fixture-name-ban", "pass", "pass");
		// The source has left the field (a Quick-Play Spell goes to the GY once the chain has resolved).
		expect(codes(applied, "you", "graveyard")).toEqual(["fixture-name-ban"]);
		expect(offered(applied)).not.toContain("activate fixture-plain-quick-play");
		expect(offered(play(applied, "pass"))).toEqual(["activate fixture-plain-trap", "pass"]);
		const later = toTurn(applied, 9);
		expect(applied.modifiers.map((modifier) => modifier.until)).toEqual([FOREVER]);
		expect(later.modifiers).toHaveLength(1);
		expect(offered(toTurn(later, 10)).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-plain-trap"]);
	});
	it("a continuous prohibition by Attribute applies while its card is face-up on the field, and by Type to both players", () => {
		const start = position({ defs: readinessCards(), options, you: { faceupSpells: ["fixture-no-light-effects"], hand: ["fixture-aimed-destroy"], monsters: ["fixture-light-quick"] }, rival: { monsters: ["fixture-light-quick", "fixture-dark-quick"] } });
		// Yours is not stopped ("your opponent cannot"); the rival's LIGHT monster is, its DARK monster is not.
		expect(offered(start)).toContain("activate fixture-light-quick");
		expect(offered(play(start, "pass"))).toEqual(["activate fixture-dark-quick", "pass"]);
		const fiends = position({ defs: readinessCards(), options, you: { faceupSpells: ["fixture-no-fiend-effects"], hand: ["fixture-hand-quick"], monsters: ["fixture-dark-quick", "fixture-light-quick"] }, rival: { monsters: ["fixture-dark-quick"] } });
		expect(offered(fiends).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-light-quick"]);
		expect(offered(play(fiends, "pass"))).toEqual(["pass"]);
	});
	it("\"effects of Special Summoned monsters\" tells a Special Summoned monster from a Normal Summoned one, \"until the end of your next turn\"", () => {
		const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-light-quick", "fixture-dark-quick", "fixture-summon-from-hand", "fixture-no-special-summoned-effects"] } });
		// The first monster of the hand is Special Summoned by the Spell, the other Normal Summoned.
		const special = toPhase(play(start, "activate fixture-summon-from-hand", "pass", "pass"), "main1");
		const both = play(special, "summon fixture-dark-quick", "pass", "pass");
		expect(offered(both)).toEqual(expect.arrayContaining(["activate fixture-light-quick", "activate fixture-dark-quick"]));
		const applied = play(both, "activate fixture-no-special-summoned-effects", "pass", "pass");
		expect(offered(applied).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-dark-quick"]);
		// Applied in your turn 3: it lasts through the opponent's turn 4 and your turn 5, and is gone in turn 6.
		expect(untilEndOfNextTurnOf(start, "you")).toBe(5);
		expect(untilEndOfNextTurnOf(start, "rival")).toBe(4);
		const turn5 = toPhase(toTurn(applied, 5), "main1");
		expect(turn5.turn).toMatchObject({ number: 5, phase: "main1" });
		expect(offered(turn5).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-dark-quick"]);
		const turn6 = play(toTurn(applied, 6), "pass");
		expect(offered(turn6)).toEqual(expect.arrayContaining(["activate fixture-light-quick", "activate fixture-dark-quick"]));
	});
	it("answers the public query for one attempt", () => {
		const defs = readinessCards();
		const start = position({ defs, options, you: { hand: ["fixture-no-monster-effects"] }, rival: { monsters: ["fixture-light-quick"] } });
		const applied = play(start, "activate fixture-no-monster-effects", "pass", "pass");
		const card = applied.cards[applied.piles.rival.monster[0]!]!;
		expect(activationLocked(start, { player: "rival", card }, 0, defs["fixture-light-quick"]!.effects![0]!)).toBe(false);
		expect(activationLocked(applied, { player: "rival", card }, 0, defs["fixture-light-quick"]!.effects![0]!)).toBe(true);
	});
});

describe("other restrictions", () => {
	it("\"you cannot draw cards by card effects\": a draw by an effect is not done; the other player still draws", () => {
		const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-no-draw", "fixture-draw-one"], deck: ["fixture-vanilla"] }, rival: { set: ["fixture-draw-one"], deck: ["fixture-vanilla"] } });
		const applied = play(start, "activate fixture-no-draw", "pass", "pass");
		const tried = play(applied, "activate fixture-draw-one", "pass", "pass");
		expect(codes(tried, "you", "hand")).toEqual([]);
		expect(codes(tried, "you", "deck")).toEqual(["fixture-vanilla"]);
		const theirs = play(tried, "pass", "activate fixture-draw-one", "pass", "pass");
		expect(codes(theirs, "rival", "hand")).toEqual(["fixture-vanilla"]);
	});
	it("a card that only draws needs the draw to be possible: under \"cannot draw by card effects\" Pot of Greed and Upstart Goblin are not offered, a search still is, and a card whose draws come later (Mulcharmy) still is", () => {
		const defs = { ...REAL_CARDS, ...readinessCards() };
		const hand = ["pot-of-greed", "upstart-goblin", "terraforming", "mulcharmy-fuwalos"];
		const activations = (duel: Duel) => offered(duel).filter((name) => name.startsWith("activate"));
		const start = position({ defs, options, you: { hand, deck: ["umi", "normal-4", "normal-4"] }, rival: { set: ["fixture-no-draw-for-opponent", "fixture-no-add-for-opponent"] } });
		expect(activations(start)).toEqual(["activate mulcharmy-fuwalos", "activate pot-of-greed", "activate terraforming", "activate upstart-goblin"]);
		// The draw lock: the cards that only draw are not offered; adding a card by a search is not a draw.
		const noDraw = play(start, "pass", "activate fixture-no-draw-for-opponent", "pass", "pass", "pass", "pass");
		expect(noDraw.priority).toMatchObject({ holder: "you", open: true });
		expect(activations(noDraw)).toEqual(["activate mulcharmy-fuwalos", "activate terraforming"]);
		expect(() => act(noDraw, { type: "activate", card: noDraw.piles.you.hand[0]!, effect: 0, targets: [] })).toThrow(/not a legal action/);
		// The add-to-hand lock stops a draw too (a draw adds a card from the Deck), and the search with it.
		const noAdd = play(start, "pass", "activate fixture-no-add-for-opponent", "pass", "pass", "pass", "pass");
		expect(activations(noAdd)).toEqual(["activate mulcharmy-fuwalos"]);
	});
	it("\"cards in your GY cannot be banished\": an effect does not banish them, the other GY is banished, and a cost can ask first", () => {
		const start = position({ defs: readinessCards(), options, you: { faceupSpells: ["fixture-gy-guard"], hand: ["fixture-gy-vacuum"], graveyard: ["fixture-vanilla"] }, rival: { graveyard: ["fixture-big"] } });
		expect(canBeBanished(start, start.piles.you.graveyard[0]!)).toBe(false);
		expect(canBeBanished(start, start.piles.rival.graveyard[0]!)).toBe(true);
		const done = play(start, "activate fixture-gy-vacuum", "pass", "pass");
		expect(codes(done, "you", "graveyard")).toEqual(["fixture-vanilla", "fixture-gy-vacuum"]);
		expect(codes(done, "rival", "banished")).toEqual(["fixture-big"]);
	});
	it("\"cannot attack\": the monster declares no attack; \"cannot attack directly\": it attacks monsters only", () => {
		const empty = position({ defs: readinessCards(), options, phase: "battle", you: { monsters: ["fixture-pacifist", "fixture-no-direct", "fixture-vanilla"] } });
		expect(offered(empty)).toEqual(["attack fixture-vanilla directly", "pass"]);
		const guarded = position({ defs: readinessCards(), options, phase: "battle", you: { monsters: ["fixture-pacifist", "fixture-no-direct"] }, rival: { monsters: ["fixture-vanilla"] } });
		expect(offered(guarded)).toEqual(["attack fixture-no-direct > fixture-vanilla", "pass"]);
	});
	it("a lasting \"it cannot attack until the end of your next turn\" follows the card as it is: gone when the turn after next begins, and at once if the card becomes a new card", () => {
		const start = position({ defs: readinessCards(), options, turn: "rival", phase: "main1", you: { set: ["fixture-pin"] }, rival: { monsters: ["fixture-vanilla", "fixture-big"] } });
		const pinned = play(start, "pass", "activate fixture-pin > fixture-vanilla", "pass", "pass");
		const battle = toPhase(pinned, "battle");
		expect(battle.turn).toMatchObject({ number: 3, phase: "battle" });
		expect(offered(battle)).toEqual(["attack fixture-big directly", "pass"]);
		// Applied in the rival's turn 3 by you: it lasts through your turn 4 and ends there; in the rival's turn 5 the monster attacks again.
		const turn5 = toPhase(toTurn(pinned, 5), "battle");
		expect(turn5.turn).toMatchObject({ number: 5, phase: "battle" });
		expect(offered(turn5)).toEqual(["attack fixture-big directly", "attack fixture-vanilla directly", "pass"]);
	});
});
