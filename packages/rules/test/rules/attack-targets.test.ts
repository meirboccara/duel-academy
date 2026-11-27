import { describe, expect, it } from "vitest";
import { atk, type CardDef, type CardInstance, cites, type Duel, type Layer, negateCardEffects, other } from "../../src";
import { offered, play, position, type SideSpec } from "./fixtures";

/** A Continuous Effect of a face-up monster that restricts attack targets: `only` names the monsters that cannot be selected. */
const restricting = (code: string, atkValue: number, only: (duel: Duel, source: CardInstance, target: CardInstance) => boolean, closesDirect = false): CardDef => ({
	code,
	kind: "monster",
	facts: { level: 4, atk: atkValue, def: 0 },
	effects: [{ type: "continuous", modifies: (_duel, source): Layer[] => [{ kind: "lock", what: "attack-target", who: other(source.controller), only: (duel, target) => only(duel, source, target), ...(closesDirect ? { closesDirect: true as const } : {}) }] }],
});

/**
 * Restrictions on attack targets (the `attack-target` lock, src/modifiers.ts; read by the Battle Step listing, src/battle.ts). Made-up
 * cards with the wordings of Konami's Japanese Q&A fids 23993 and 13862 (listed under Sky Striker Ace - Hayate, OCG only).
 */
const CARDS: Record<string, CardDef> = {
	"fixture-attacker": { code: "fixture-attacker", kind: "monster", facts: { level: 4, atk: 1800, def: 0 } },
	// "Can attack directly." (Sky Striker Ace - Hayate's first effect, a Continuous Effect: its notes.)
	"fixture-direct": { code: "fixture-direct", kind: "monster", facts: { level: 4, atk: 1500, def: 0 }, effects: [{ type: "continuous", modifies: () => [{ kind: "attack", allows: { what: "directly" } }] }] },
	"fixture-small": { code: "fixture-small", kind: "monster", facts: { level: 4, atk: 500, def: 0 } },
	"fixture-big": { code: "fixture-big", kind: "monster", facts: { level: 4, atk: 2500, def: 0 } },
	// "Your opponent cannot target other monsters for attacks." (Double Iris Knight Astram's wording.)
	"fixture-taunt": restricting("fixture-taunt", 1000, (_duel, source, target) => target.id !== source.id),
	// "Your opponent cannot target this card for attacks."
	"fixture-shy": restricting("fixture-shy", 1000, (_duel, source, target) => target.id === source.id),
	// "Your opponent cannot target other "fixture-brigade" monsters for attacks." (Skyfang Brigade - Dyna's wording.)
	"fixture-brigade": restricting("fixture-brigade", 1000, (_duel, source, target) => target.code === "fixture-brigade" && target.id !== source.id),
	// "Your opponent can only target the monster(s) with the highest ATK you control for attacks." (Fighting Spirit Image's wording.)
	// A Continuous Trap: "while this card is face-up, your opponent cannot target monsters you control for attacks" (made up; the
	// attack-target part of The Phantom Knights' Fog Blade, for fid 10015).
	"fixture-fog": {
		code: "fixture-fog",
		kind: "trap",
		effects: [{ type: "activation", stays: true, operation: (duel) => duel }, { type: "continuous", modifies: (_duel, source): Layer[] => [{ kind: "lock", what: "attack-target", who: other(source.controller) }] }],
	},
	"fixture-image": restricting(
		"fixture-image",
		0,
		(duel, source, target) => {
			const highest = Math.max(...duel.piles[source.controller].monster.map((id) => atk(duel, id)));
			return atk(duel, target.id) !== highest;
		},
		true,
	),
};

/** Your Battle Step (turn 3), with `you` attacking `rival`. */
const battle = (you: SideSpec, rival: SideSpec): Duel => position({ defs: CARDS, you, rival, phase: "battle" });
const attacks = (duel: Duel) => offered(duel).filter((name) => name.startsWith("attack"));

describe("restrictions on attack targets", () => {
	it(`${cites("rules", "target-other-monsters-direct-open")} "your opponent cannot target other monsters for attacks": only that monster can be attacked; a monster that can attack directly still may (fid 23993, case A)`, () => {
		const duel = battle({ monsters: ["fixture-attacker", "fixture-direct"] }, { monsters: ["fixture-taunt", "fixture-small"] });
		expect(attacks(duel)).toEqual(["attack fixture-attacker > fixture-taunt", "attack fixture-direct > fixture-taunt", "attack fixture-direct directly"]);
	});
	it(`${cites("rules", "only-target-closes-direct")} "your opponent can only target the highest ATK monster for attacks": the choice itself is restricted, so not even a monster that can attack directly attacks directly (fid 23993, case B)`, () => {
		const duel = battle({ monsters: ["fixture-attacker", "fixture-direct"] }, { monsters: ["fixture-image", "fixture-small", "fixture-big"] });
		expect(attacks(duel)).toEqual(["attack fixture-attacker > fixture-big", "attack fixture-direct > fixture-big"]);
	});
	it(`${cites("rules", "no-target-selectable")} ${cites("rules", "no-target-direct-attacker-still-direct")} when no monster can be selected the opponent still controls monsters: no direct attack without a permission, but a monster that can attack directly may (fid 13862)`, () => {
		const duel = battle({ monsters: ["fixture-attacker", "fixture-direct"] }, { monsters: ["fixture-brigade", "fixture-brigade"] });
		expect(attacks(duel)).toEqual(["attack fixture-direct directly"]);
	});
	it('"your opponent cannot target this card for attacks": the other monsters can be attacked, and no direct attack opens (RB10: the opponent controls a monster)', () => {
		const duel = battle({ monsters: ["fixture-attacker"] }, { monsters: ["fixture-shy", "fixture-small"] });
		expect(attacks(duel)).toEqual(["attack fixture-attacker > fixture-small"]);
		expect(attacks(battle({ monsters: ["fixture-attacker"] }, { monsters: ["fixture-shy"] }))).toEqual([]);
	});
	it("a restriction is a Continuous Effect of its card: negated, or the card face-down, it restricts nothing; it never restricts its own controller's attacks", () => {
		const duel = battle({ monsters: ["fixture-attacker"] }, { monsters: ["fixture-taunt", "fixture-small"] });
		const negated = negateCardEffects(duel, duel.piles.rival.monster[0]!, duel.turn.number);
		expect(attacks(negated)).toEqual(["attack fixture-attacker > fixture-small", "attack fixture-attacker > fixture-taunt"]);
		const own = battle({ monsters: ["fixture-taunt", "fixture-attacker"] }, { monsters: ["fixture-small", "fixture-big"] });
		expect(attacks(own)).toEqual(["attack fixture-attacker > fixture-big", "attack fixture-attacker > fixture-small", "attack fixture-taunt > fixture-big", "attack fixture-taunt > fixture-small"]);
	});
	it(`${cites("rules", "target-lock-after-declaration")} a restriction that begins after the attack was declared neither stops nor replays it, nor makes it direct: damage is calculated as usual (fid 10015)`, () => {
		const start = battle({ monsters: ["fixture-attacker", "fixture-direct"] }, { monsters: ["fixture-small", "fixture-big"], set: ["fixture-fog"] });
		let duel = play(start, "attack fixture-attacker > fixture-small");
		while (duel.priority.holder !== "rival") duel = play(duel, "pass");
		duel = play(duel, "activate fixture-fog");
		const fog = duel.piles.rival.spell[0]!;
		while (duel.battle !== null) duel = play(duel, "pass");
		expect(duel.cards[fog]!.face).toBe("up");
		// The battle happened: 1800 against 500, the target destroyed, 1300 damage.
		expect(duel.lp).toEqual({ you: 8000, rival: 6700 });
		expect(duel.piles.rival.monster.map((id) => duel.cards[id]!.code)).toEqual(["fixture-big"]);
		// The restriction applies from now on: the monster left cannot be attacked; one that can attack directly still may (fid 13862).
		expect(attacks(duel)).toEqual(["attack fixture-direct directly"]);
	});
	// Unresolved: no Konami page found. YGOProJudge lead (chat 0d2b43ee, 2026-11-27, no source cited, ungraded): a replay. Not applied
	// until a Konami source settles it; the core today lets the direct attack go on.
	it.todo('a "can only target ... for attacks" restriction (closesDirect) that begins after a direct attack was declared');
});
