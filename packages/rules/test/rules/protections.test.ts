import { describe, expect, it } from "vitest";
import { atk, cites, type Duel, type GameEvent, isNegated } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "./fixtures";
import { readinessCards } from "./readiness-fixtures";

const options = { everyWindow: true };

/** Passes until the turn player holds priority in an open game state of `phase`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"]): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}
const monster = (duel: Duel, code: string) => Object.values(duel.cards).find((card) => card.code === code)!;

/**
 * The protection layer (src/modifiers.ts, `protect`). Konami's Japanese Q&A (OCG only) is cited where a page was read; the rest
 * follows YGOProJudge's answers (asked 2026-11-24, no source cited) and says so in the title.
 */
describe("cannot be targeted", () => {
	it(`${cites("rules", "cannot-be-targeted-restricts-the-player")} "cannot be targeted by your opponent's card effects" restricts the opponent's choice of targets, not its controller's`, () => {
		const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-aimed-destroy"], monsters: ["fixture-vanilla"] }, rival: { set: ["fixture-aimed-destroy"], monsters: ["fixture-untargetable", "fixture-big"] } });
		expect(offered(start).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-aimed-destroy > fixture-big", "activate fixture-aimed-destroy > fixture-vanilla"]);
		// Its controller may target it.
		expect(offered(play(start, "pass")).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-aimed-destroy > fixture-big", "activate fixture-aimed-destroy > fixture-untargetable", "activate fixture-aimed-destroy > fixture-vanilla"]);
	});
	it("an effect that does not target still reaches a monster that cannot be targeted (YGOProJudge only)", () => {
		const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-destroy-all"] }, rival: { monsters: ["fixture-untargetable"] } });
		expect(codes(play(start, "activate fixture-destroy-all", "pass", "pass"), "rival", "graveyard")).toEqual(["fixture-untargetable"]);
	});
});

describe("cannot be destroyed", () => {
	it("\"cannot be destroyed by card effects\": not destroyed by an effect, still sent to the GY or banished by one, and still destroyed by battle (YGOProJudge only)", () => {
		const defs = readinessCards();
		const start = position({ defs, options, you: { hand: ["fixture-destroy-all", "fixture-send-all"], monsters: ["fixture-big"] }, rival: { monsters: ["fixture-effect-proof"] } });
		const kept = play(start, "activate fixture-destroy-all", "pass", "pass");
		expect(codes(kept, "rival", "monster")).toEqual(["fixture-effect-proof"]);
		expect(codes(kept, "you", "graveyard")).toEqual(["fixture-big", "fixture-destroy-all"]);
		expect(codes(play(kept, "activate fixture-send-all", "pass", "pass"), "rival", "graveyard")).toEqual(["fixture-effect-proof"]);
		const battle = position({ defs, options, phase: "battle", you: { monsters: ["fixture-big"] }, rival: { monsters: ["fixture-effect-proof"] } });
		const fought = toPhase(play(battle, "attack fixture-big > fixture-effect-proof"), "battle");
		expect(codes(fought, "rival", "graveyard")).toEqual(["fixture-effect-proof"]);
	});
	it("\"cannot be destroyed by battle\": it stays on the field after losing a battle, its controller still takes the damage, and an effect still destroys it (YGOProJudge only)", () => {
		const defs = readinessCards();
		const battle = position({ defs, options, phase: "battle", you: { monsters: ["fixture-big"], hand: ["fixture-destroy-all"] }, rival: { monsters: ["fixture-battle-proof"] } });
		const fought = toPhase(play(battle, "attack fixture-big > fixture-battle-proof"), "battle");
		expect(codes(fought, "rival", "monster")).toEqual(["fixture-battle-proof"]);
		expect(fought.lp.rival).toBe(8000 - 1500);
		expect(codes(play(fought, "activate fixture-destroy-all", "pass", "pass"), "rival", "graveyard")).toEqual(["fixture-battle-proof"]);
	});
	it("\"the first time each would be destroyed each turn, it is not destroyed\": per monster, by battle or by effect alike, again next turn, and again for a card that became a new card (YGOProJudge only)", () => {
		const defs = readinessCards();
		const start = position({ defs, options, turn: "rival", rival: { hand: ["fixture-destroy-all", "fixture-destroy-all", "fixture-destroy-all"] }, you: { faceupSpells: ["fixture-first-time-field"], monsters: ["fixture-vanilla", "fixture-big"] } });
		const first = play(start, "activate fixture-destroy-all", "pass", "pass");
		expect(codes(first, "you", "monster")).toEqual(["fixture-vanilla", "fixture-big"]);
		expect(first.spared).toHaveLength(2);
		// The second destruction of the turn destroys both.
		const second = play(first, "activate fixture-destroy-all", "pass", "pass");
		expect(codes(second, "you", "monster")).toEqual([]);
		// Battle counts as the first time too; then an effect destroys it.
		const battle = position({ defs, options, turn: "rival", phase: "battle", rival: { monsters: ["fixture-big"], set: ["fixture-destroy-all"] }, you: { faceupSpells: ["fixture-first-time-field"], monsters: ["fixture-vanilla"] } });
		const fought = toPhase(play(battle, "attack fixture-big > fixture-vanilla"), "battle");
		expect(codes(fought, "you", "monster")).toEqual(["fixture-vanilla"]);
		expect(fought.lp.you).toBe(8000 - 1000);
		expect(codes(play(fought, "activate fixture-destroy-all", "pass", "pass"), "you", "monster")).toEqual([]);
		// A new turn: the first time again.
		const nextTurn = toPhase(toPhase(first, "end"), "main1");
		expect(nextTurn.turn.number).toBe(4);
		expect(nextTurn.spared).toEqual([]);
	});
});

describe("cards destroyed or moved at the same time are judged on the board before any of them left", () => {
	const orders = (protector: string) => [[protector, "fixture-vanilla", "fixture-big"], ["fixture-vanilla", protector, "fixture-big"], ["fixture-vanilla", "fixture-big", protector]];
	it("Raigeki destroys the monster that protects the others and not the monsters it protects, wherever it stands among them (the core's reading of simultaneous destruction; YGOProJudge only)", () => {
		for (const monsters of orders("fixture-guardian")) {
			const start = position({ defs: { ...readinessCards(), ...REAL_CARDS }, options, you: { hand: ["raigeki"] }, rival: { monsters } });
			const done = play(start, "activate raigeki", "pass", "pass");
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-guardian"]);
			expect(codes(done, "rival", "monster")).toEqual(monsters.filter((code) => code !== "fixture-guardian"));
			// One group: the destroyed monster's `moved` event carries the batch and Raigeki's attribution.
			const moved = done.live.filter((event): event is Extract<GameEvent, { type: "moved" }> => event.type === "moved" && event.reason === "destroyed");
			expect(moved.map((event) => [event.after.code, event.batch !== undefined, event.destruction?.cause === "effect" && event.destruction.source.code])).toEqual([["fixture-guardian", true, "raigeki"]]);
		}
	});
	it("a \"first time each turn\" protection given by a monster destroyed at the same time is used once for each monster it protected, in any order; the next destruction of the turn destroys them", () => {
		for (const monsters of orders("fixture-first-guardian")) {
			const start = position({ defs: { ...readinessCards(), ...REAL_CARDS }, options, you: { hand: ["raigeki", "raigeki"] }, rival: { monsters } });
			const first = play(start, "activate raigeki", "pass", "pass");
			expect(codes(first, "rival", "graveyard")).toEqual(["fixture-first-guardian"]);
			expect(first.spared).toHaveLength(2);
			expect(codes(play(first, "pass", "pass", "activate raigeki", "pass", "pass"), "rival", "monster")).toEqual([]);
		}
		// With the protection staying on the field (a Field Spell): each monster is spared once, then destroyed by the second Raigeki.
		const field = position({ defs: { ...readinessCards(), ...REAL_CARDS }, options, you: { hand: ["raigeki", "raigeki"] }, rival: { faceupSpells: ["fixture-first-time-field"], monsters: ["fixture-vanilla", "fixture-big"] } });
		const spared = play(field, "activate raigeki", "pass", "pass");
		expect(codes(spared, "rival", "monster")).toEqual(["fixture-vanilla", "fixture-big"]);
		expect(spared.spared).toHaveLength(2);
		expect(codes(play(spared, "pass", "pass", "activate raigeki", "pass", "pass"), "rival", "monster")).toEqual([]);
	});
	it("an effect that banishes every monster at once banishes the monster that makes the others unaffected, and not those, in any order", () => {
		for (const monsters of orders("fixture-aegis")) {
			const start = position({ defs: readinessCards(), options, you: { hand: ["fixture-banish-all"] }, rival: { monsters } });
			const done = play(start, "activate fixture-banish-all", "pass", "pass");
			expect(codes(done, "rival", "banished")).toEqual(["fixture-aegis"]);
			expect(codes(done, "rival", "monster")).toEqual(monsters.filter((code) => code !== "fixture-aegis"));
		}
	});
});

describe("unaffected by card effects", () => {
	it(`${cites("rules", "unaffected-targeted-not-applied")} an unaffected monster can still be targeted; the effect is simply not applied to it: not destroyed, banished, negated or taken`, () => {
		const defs = readinessCards();
		const start = position({ defs, options, you: { hand: ["fixture-aimed-destroy", "fixture-banish-all", "fixture-negate-aimed", "fixture-steal", "fixture-boost-all"] }, rival: { monsters: ["fixture-immune"] } });
		expect(offered(start)).toContain("activate fixture-aimed-destroy > fixture-immune");
		let next = play(start, "activate fixture-aimed-destroy > fixture-immune", "pass", "pass");
		next = play(next, "activate fixture-banish-all", "pass", "pass");
		next = play(next, "activate fixture-negate-aimed > fixture-immune", "pass", "pass");
		next = play(next, "activate fixture-steal > fixture-immune", "pass", "pass");
		next = play(next, "activate fixture-boost-all", "pass", "pass");
		expect(codes(next, "rival", "monster")).toEqual(["fixture-immune"]);
		const immune = monster(next, "fixture-immune");
		expect(isNegated(next, immune.id)).toBe(false);
		// "All monsters gain 1000 ATK": not this one.
		expect(atk(next, immune.id)).toBe(1000);
	});
	it("a continuous effect of another card does not reach an unaffected monster: Skill Drain negates the monster next to it, not it", () => {
		const start = position({ defs: { ...readinessCards(), ...REAL_CARDS }, options, you: { faceupSpells: ["skill-drain"], monsters: ["fixture-immune", "fixture-light-quick"] } });
		expect(isNegated(start, monster(start, "fixture-light-quick").id)).toBe(true);
		expect(isNegated(start, monster(start, "fixture-immune").id)).toBe(false);
	});
	for (const immune of ["fixture-immune", "fixture-trap-immune"]) {
		it(`${cites("rules", "skill-drain-first-negates-own-immunity")} Skill Drain already applying when ${immune} is Summoned negates its own "unaffected" effect: it is negated and other effects reach it, until Skill Drain is gone`, () => {
			const log: string[] = [];
			const defs = { ...readinessCards(log), ...REAL_CARDS };
			const start = position({ defs, options, you: { faceupSpells: ["skill-drain"], hand: [immune, "fixture-boost-all"] }, rival: { set: ["mystical-space-typhoon"] } });
			const summoned = play(start, `summon ${immune}`, "pass", "pass");
			const id = monster(summoned, immune).id;
			expect(summoned.cards[id]!.zone).toBe("monster");
			expect(isNegated(summoned, id)).toBe(true);
			// Its effect can be activated and is negated when it resolves.
			const used = play(summoned, `activate ${immune}`, "pass", "pass");
			expect(log).toEqual([]);
			// Its immunity is negated too: "all monsters gain 1000 ATK" reaches it.
			const boosted = play(used, "activate fixture-boost-all", "pass", "pass");
			expect(atk(boosted, id)).toBe(2000);
			// Skill Drain leaves the field: the monster's "unaffected" effect applies from then on.
			const freed = play(boosted, "pass", "activate mystical-space-typhoon > skill-drain", "pass", "pass");
			expect(codes(freed, "you", "graveyard")).toContain("skill-drain");
			expect(isNegated(freed, id)).toBe(false);
			// The Spell's boost no longer reaches a monster unaffected by other cards' effects; one unaffected by Trap effects keeps it.
			expect(atk(freed, id)).toBe(immune === "fixture-immune" ? 1000 : 2000);
			play(freed, "pass", "pass", `activate ${immune}`, "pass", "pass");
			expect(log).toEqual([immune]);
		});
		it(`${cites("rules", "own-immunity-first-skill-drain-not-applied")} ${immune} face-up before Skill Drain is activated stays unaffected by it: not negated, whoever controls Skill Drain`, () => {
			for (const controller of ["you", "rival"] as const) {
				const log: string[] = [];
				const defs = { ...readinessCards(log), ...REAL_CARDS };
				const start = position({ defs, options, you: { monsters: [immune, "fixture-light-quick"], ...(controller === "you" ? { set: ["skill-drain"] } : {}) }, rival: controller === "rival" ? { set: ["skill-drain"] } : {} });
				const on = controller === "you" ? play(start, "activate skill-drain", "pass", "pass") : play(start, "pass", "activate skill-drain", "pass", "pass");
				expect(isNegated(on, monster(on, immune).id)).toBe(false);
				expect(isNegated(on, monster(on, "fixture-light-quick").id)).toBe(true);
				play(on, ...(controller === "you" ? [] : ["pass", "pass"]), `activate ${immune}`, "pass", "pass");
				expect(log).toEqual([immune]);
			}
		});
	}
	it("\"unaffected by Trap effects\" stops a Trap's effect and lets a Spell's through", () => {
		const defs = readinessCards();
		const start = position({ defs, options, you: { hand: ["fixture-aimed-destroy"], set: ["fixture-aimed-destroy-trap"] }, rival: { monsters: ["fixture-trap-immune"] } });
		const trapped = play(start, "activate fixture-aimed-destroy-trap > fixture-trap-immune", "pass", "pass");
		expect(codes(trapped, "rival", "monster")).toEqual(["fixture-trap-immune"]);
		expect(codes(play(trapped, "activate fixture-aimed-destroy > fixture-trap-immune", "pass", "pass"), "rival", "graveyard")).toEqual(["fixture-trap-immune"]);
	});
	it(`${cites("rules", "unaffected-sent-as-cost")} a cost is not an effect: an unaffected monster can be Tributed to pay one, and it still battles`, () => {
		const defs = readinessCards();
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, you: { hand: ["fixture-tribute-cost"], monsters: ["fixture-immune"] } });
		const paid = play(start, "activate fixture-tribute-cost ~ fixture-immune", "pass", "pass");
		expect(codes(paid, "you", "graveyard")).toEqual(["fixture-immune", "fixture-tribute-cost"]);
		expect(log).toEqual(["fixture-tribute-cost"]);
		// Battle is not a card effect: it is destroyed by battle.
		const battle = position({ defs, options, phase: "battle", you: { monsters: ["fixture-big"] }, rival: { monsters: ["fixture-immune"] } });
		expect(codes(toPhase(play(battle, "attack fixture-big > fixture-immune"), "battle"), "rival", "graveyard")).toEqual(["fixture-immune"]);
	});
	it(`${cites("rules", "unaffected-activation-not-negated-on-field")} a Counter Trap does not negate the activation of a monster on the field that is unaffected by it, but does once the monster has left as its own cost`, () => {
		const log: string[] = [];
		const start = position({ defs: readinessCards(log), options, turn: "rival", you: { set: ["fixture-counter", "fixture-counter"] }, rival: { monsters: ["fixture-immune", "fixture-immune-leaver"] } });
		const stayed = play(start, "activate fixture-immune", "activate fixture-counter", "pass", "pass");
		expect(log).toEqual(["fixture-counter", "fixture-immune"]);
		const left = play(stayed, "pass", "pass", "activate fixture-immune-leaver", "activate fixture-counter", "pass", "pass");
		// The second Counter Trap negated the activation: the effect was not applied.
		expect(log).toEqual(["fixture-counter", "fixture-immune", "fixture-counter"]);
		expect(codes(left, "rival", "banished")).toEqual(["fixture-immune-leaver"]);
	});
});
