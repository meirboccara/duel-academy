import { describe, expect, it } from "vitest";
import { act, changePosition, cites, flipFaceDown, flipFaceUp, legalActions, loseLp, PASS, type Duel } from "../../src";
import { battleCards, toStep } from "./battle-fixtures";
import { nextTurn } from "./continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "./fixtures";

const defs = battleCards();
const every = { everyWindow: true };
/** Your turn, Battle Phase, the game state open. */
const battle = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs, phase: "battle", options, you, rival });
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));

describe("declaring an attack", () => {
	it(`${cites("rules", "no-battle-first-turn")} the player who goes first cannot attack on the Duel's first turn`, () => {
		const start = battle({ monsters: ["big"] });
		expect(attacks({ ...start, turn: { ...start.turn, number: 1 } })).toEqual([]);
		expect(attacks(start)).toEqual(["attack big directly"]);
	});
	it(`${cites("rules", "battle-phase-four-steps")} attacks are declared only in the Battle Phase, and the Battle Step comes back after each attack`, () => {
		expect(attacks(position({ defs, you: { monsters: ["big", "small"] } }))).toEqual([]);
		const first = play(battle({ monsters: ["big", "small"] }), "attack big directly");
		expect(first.battle).toBeNull();
		expect(attacks(first)).toEqual(["attack small directly"]);
	});
	it(`${cites("rules", "attack-declaration")} ${cites("rules", "attack-is-no-chain-action")} the declaration starts no chain; the turn player may respond first, then the opponent`, () => {
		const declared = play(battle({ monsters: ["big"] }, { monsters: ["small"] }, every), "attack big > small");
		expect(declared.chain).toEqual([]);
		expect(declared.battle?.step).toBe("declared");
		expect(declared.priority).toEqual({ holder: "you", passed: [], open: false });
		expect(play(declared, "pass").priority.holder).toBe("rival");
	});
	it(`${cites("rules", "attack-declaration")} a monster attacks one of the opponent's monsters, face-up or face-down; directly only when the opponent has none`, () => {
		expect(attacks(battle({ monsters: ["big"] }, { monsters: ["small"], facedown: ["even"] }))).toEqual(["attack big > even", "attack big > small"]);
		expect(attacks(battle({ monsters: ["big"] }))).toEqual(["attack big directly"]);
	});
	it(`${cites("rules", "one-attack-per-monster")} each face-up Attack Position monster attacks once a turn; a Defense Position or face-down one does not`, () => {
		const start = battle({ monsters: ["big"], defense: ["huge"], facedown: ["even"] });
		expect(attacks(start)).toEqual(["attack big directly"]);
		const done = play(start, "attack big directly");
		expect(attacks(done)).toEqual([]);
		// On your next turn it may attack again.
		expect(attacks(toBattlePhase(nextTurn(done, 5)))).toEqual(["attack big directly"]);
	});
});

// YGOProJudge only (chat, asked 2026-11-23, no source cited): turned face-down and face-up again where it stands, the monster is
// still the card that declared an attack this turn.
describe("a monster that attacked and was turned face-down and face-up again (YGOProJudge lead)", () => {
	it("cannot declare another attack that turn", () => {
		const done = play(battle({ monsters: ["big"] }), "attack big directly");
		const id = done.piles.you.monster[0]!;
		const again = flipFaceUp(flipFaceDown(done, id), id, "attack");
		expect(again.cards[id]!.face).toBe("up");
		expect(attacks(again)).toEqual([]);
	});
});

/** Passes until the Battle Phase of the current turn. */
function toBattlePhase(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && next.turn.phase !== "battle"; guard++) next = play(next, "pass");
	return next;
}

describe("damage calculation", () => {
	it(`${cites("rules", "damage-atk-vs-atk")} ATK against ATK: the higher destroys the lower and the difference is battle damage; equal ATK destroys both, with no damage`, () => {
		const higher = play(battle({ monsters: ["big"] }, { monsters: ["small"] }), "attack big > small");
		expect([codes(higher, "rival", "graveyard"), higher.lp.rival, higher.lp.you]).toEqual([["small"], 6600, 8000]);
		const lower = play(battle({ monsters: ["small"] }, { monsters: ["big"] }), "attack small > big");
		expect([codes(lower, "you", "graveyard"), lower.lp.you, lower.lp.rival]).toEqual([["small"], 6600, 8000]);
		const tie = play(battle({ monsters: ["big"] }, { monsters: ["big"] }), "attack big > big");
		expect([codes(tie, "you", "graveyard"), codes(tie, "rival", "graveyard"), tie.lp]).toEqual([["big"], ["big"], { you: 8000, rival: 8000 }]);
	});
	it(`${cites("rules", "zero-atk-destroys-nothing")} two Attack Position monsters with 0 ATK destroy nothing`, () => {
		const zero = play(battle({ monsters: ["blank"] }, { monsters: ["blank"] }), "attack blank > blank");
		expect([codes(zero, "you", "monster"), codes(zero, "rival", "monster")]).toEqual([["blank"], ["blank"]]);
	});
	it(`${cites("rules", "damage-atk-vs-def")} ATK against DEF: higher destroys with no damage, equal does nothing, lower costs the attacker's controller the difference`, () => {
		const through = play(battle({ monsters: ["big"] }, { defense: ["small"] }), "attack big > small");
		expect([codes(through, "rival", "graveyard"), through.lp]).toEqual([["small"], { you: 8000, rival: 8000 }]);
		const equal = play(battle({ monsters: ["even"] }, { defense: ["even"] }), "attack even > even");
		expect([codes(equal, "rival", "monster"), codes(equal, "you", "monster"), equal.lp]).toEqual([["even"], ["even"], { you: 8000, rival: 8000 }]);
		const wall = play(battle({ monsters: ["big"] }, { defense: ["huge"] }), "attack big > huge");
		expect([codes(wall, "rival", "monster"), codes(wall, "you", "monster"), wall.lp.you]).toEqual([["huge"], ["big"], 7500]);
	});
	it(`${cites("rules", "damage-direct")} a direct attack takes the attacker's full ATK from the opponent's LP`, () => {
		expect(play(battle({ monsters: ["big"] }), "attack big directly").lp.rival).toBe(6000);
	});
	it(`${cites("rules", "lp-zero-wins-both-draw")} a player at 0 LP loses and nothing more is offered; both at 0 at the same time is a draw`, () => {
		const start = battle({ monsters: ["big"] });
		const won = play({ ...start, lp: { you: 8000, rival: 1500 } }, "attack big directly");
		expect([won.lp.rival, won.winner]).toEqual([0, "you"]);
		expect(legalActions(won)).toEqual([]);
		expect(() => act(won, PASS)).toThrow();
		// Damage to both players at once (an effect's, not a battle's): both reach 0 together.
		const both = loseLp({ ...start, lp: { you: 0, rival: 500 } }, "rival", 500);
		expect(both.winner).toBe("draw");
	});
});

describe("the Damage Step, timing by timing", () => {
	it(`${cites("rules", "damage-step-timings")} the timings come in order: start, before damage calculation, after it, end; each is a trigger point`, () => {
		const log: string[] = [];
		const watched = position({ defs: battleCards(log), phase: "battle", you: { monsters: ["big", "at-start", "at-before", "at-after", "at-end"] }, rival: { monsters: ["small"] } });
		play(watched, "attack big > small");
		expect(log).toEqual(["at-start", "at-before", "at-after", "at-end"]);
	});
	it(`${cites("rules", "damage-step-timings")} ${cites("rules", "destruction-sent-at-end")} a monster destroyed by battle is still on the field after damage calculation and goes to the Graveyard at the end of the Damage Step, destroyed by battle`, () => {
		const log: string[] = [];
		const start = position({ defs: battleCards(log), phase: "battle", options: every, you: { monsters: ["big"] }, rival: { monsters: ["fallen"] } });
		const after = toStep(play(start, "attack big > fallen"), "after");
		expect(after.lp.rival).toBe(6500);
		expect(codes(after, "rival", "monster")).toEqual(["fallen"]);
		const end = toStep(after, "end");
		expect(codes(end, "rival", "graveyard")).toEqual(["fallen"]);
		// Its "destroyed by battle and sent to the GY" trigger goes on a chain at the end of the Damage Step.
		expect(end.chain.map((link) => end.cards[link.card.id]!.code)).toEqual(["fallen"]);
		toStep(end, null);
		expect(log).toEqual(["fallen"]);
	});
	it(`${cites("rules", "destruction-sent-at-end")} an optional "when ... destroyed by battle" effect does not miss the timing: it is offered at the end of the Damage Step`, () => {
		const log: string[] = [];
		const start = position({ defs: battleCards(log), phase: "battle", you: { monsters: ["big"] }, rival: { monsters: ["fallen-when"] } });
		const end = play(start, "attack big > fallen-when");
		expect(end.battle?.step).toBe("end");
		expect(offered(end)).toContain("activate fallen-when");
		play(end, "activate fallen-when");
		expect(log).toEqual(["fallen-when"]);
	});
	it(`${cites("rules", "flip-trigger-after-calc")} a target flipped face-up still has its flip effect when damage calculation does not happen (the attacker left)`, () => {
		const log: string[] = [];
		const start = position({ defs: battleCards(log), phase: "battle", options: every, you: { monsters: ["pump"] }, rival: { facedown: ["flip-watcher"], set: ["solemn-strike"] } });
		const before = toStep(play(start, "attack pump > flip-watcher"), "before");
		const struck = play(before, "activate pump", "activate solemn-strike", "pass", "pass");
		const over = toStep(struck, null);
		expect(codes(over, "you", "graveyard")).toEqual(["pump"]);
		expect(log).toEqual(["flip"]);
	});
	it(`${cites("rules", "flip-face-up-before-calc")} ${cites("rules", "flip-trigger-after-calc")} a face-down target is flipped face-up in Defense Position before damage calculation; its flip effect waits until after it`, () => {
		const log: string[] = [];
		const start = position({ defs: battleCards(log), phase: "battle", options: every, you: { monsters: ["big"] }, rival: { facedown: ["flip-watcher"] } });
		const before = toStep(play(start, "attack big > flip-watcher"), "before");
		const target = Object.values(before.cards).find((card) => card.code === "flip-watcher")!;
		expect([target.face, target.position]).toEqual(["up", "defense"]);
		expect(log).toEqual([]);
		const after = toStep(before, "after");
		expect(after.chain.map((link) => after.cards[link.card.id]!.code)).toEqual(["flip-watcher"]);
		expect(log).toEqual([]);
		// 2000 against DEF 1800: destroyed, no damage.
		expect(after.lp).toEqual({ you: 8000, rival: 8000 });
		const over = toStep(after, null);
		expect(log).toEqual(["flip"]);
		expect(codes(over, "rival", "graveyard")).toEqual(["flip-watcher"]);
	});
	it(`${cites("rules", "battled-needs-calc")} a monster has battled only once its attack reached damage calculation`, () => {
		const log: string[] = [];
		const watchedDefs = battleCards(log);
		play(position({ defs: watchedDefs, phase: "battle", you: { monsters: ["battle-watcher"] }, rival: { monsters: ["small"] } }), "attack battle-watcher > small");
		expect(log).toEqual(["battled"]);
		log.length = 0;
		// The target leaves before the Damage Step: a replay, no battle.
		const replayed = play(position({ defs: watchedDefs, phase: "battle", you: { monsters: ["battle-watcher"] }, rival: { monsters: ["small"], set: ["vanish"] } }), "attack battle-watcher > small", "activate vanish");
		expect(replayed.battle).toBeNull();
		expect(log).toEqual([]);
	});
});

describe("what can be activated in the Damage Step", () => {
	const guarded = (options = every) => battle({ monsters: ["big"] }, { monsters: ["pump"], set: ["plain-trap", "shrink", "infinite-impermanence"], hand: ["hand-quick"] }, options);
	it(`${cites("rules", "damage-step-activation-limit")} at its start and before damage calculation, only Counter Traps and effects that directly change ATK or DEF`, () => {
		// In the Battle Step, after the declaration, anything fast may answer.
		const declared = play(guarded(), "attack big > pump", "pass");
		expect(offered(declared)).toEqual(expect.arrayContaining(["activate plain-trap", "activate hand-quick", "activate shrink > big", "activate pump"]));
		for (const step of ["start", "before"] as const) {
			const window = play(toStep(declared, step), "pass");
			expect(window.priority.holder).toBe("rival");
			const labels = offered(window);
			expect(labels).toEqual(expect.arrayContaining(["activate shrink > big", "activate pump"]));
			expect(labels.filter((label) => /plain-trap|hand-quick|infinite-impermanence/.test(label))).toEqual([]);
		}
	});
	it(`${cites("rules", "damage-step-activation-limit")} after damage calculation and at the end of the Damage Step, none of them`, () => {
		const declared = play(battle({ monsters: ["huge"] }, { monsters: ["pump"], set: ["shrink"] }, every), "attack huge > pump");
		for (const step of ["after", "end"] as const) {
			const window = play(toStep(declared, step), "pass");
			expect(window.priority.holder).toBe("rival");
			expect(offered(window)).toEqual(["pass"]);
		}
	});
	it(`${cites("rules", "impermanence-not-in-damage-step")} Infinite Impermanence answers in the Battle Step, not in the Damage Step`, () => {
		const declared = play(guarded(), "attack big > pump", "pass");
		expect(offered(declared)).toContain("activate infinite-impermanence > big");
		expect(offered(play(toStep(declared, "before"), "pass"))).not.toContain("activate infinite-impermanence > big");
	});
	it(`${cites("rules", "solemn-strike-in-damage-step")} ${cites("solemn-strike", "text")} a Counter Trap negates a monster effect before damage calculation`, () => {
		// Your pump attacks; before damage calculation you raise its ATK, and the rival's Solemn Strike negates it and destroys it.
		const start = battle({ monsters: ["pump"] }, { monsters: ["big"], set: ["solemn-strike"] }, every);
		const before = toStep(play(start, "attack pump > big"), "before");
		const struck = play(before, "activate pump", "activate solemn-strike", "pass", "pass");
		expect(codes(struck, "you", "graveyard")).toEqual(["pump"]);
		const over = toStep(struck, null);
		// The attacker is gone: no damage calculation, no damage.
		expect(over.lp).toEqual({ you: 8000, rival: 6500 });
		expect(codes(over, "rival", "monster")).toEqual(["big"]);
	});
	it(`${cites("rules", "defense-attacker-stops")} an attacker changed to Defense Position before damage calculation can no longer attack: no damage calculation, the Damage Step ends`, () => {
		const start = battle({ monsters: ["big"] }, { monsters: ["small"] }, every);
		const before = toStep(play(start, "attack big > small"), "before");
		const attacker = before.battle!.attacker.id;
		const turned = changePosition(before, attacker, "defense");
		const over = toStep(turned, null);
		expect(over.lp).toEqual({ you: 8000, rival: 8000 });
		expect([codes(over, "you", "monster"), codes(over, "rival", "monster")]).toEqual([["big"], ["small"]]);
	});
	it(`${cites("rules", "damage-step-activation-limit")} ${cites("rules", "damage-atk-vs-atk")} an ATK change before damage calculation changes the result (ATK is read at damage calculation)`, () => {
		const start = battle({ monsters: ["huge"] }, { monsters: ["big"], set: ["shrink"] }, every);
		const before = play(toStep(play(start, "attack huge > big"), "before"), "pass");
		const done = toStep(play(before, "activate shrink > huge", "pass", "pass"), null);
		// 3000 halved to 1500 against 2000: the attacker is destroyed and you take 500.
		expect([codes(done, "you", "graveyard"), done.lp.you, codes(done, "rival", "monster")]).toEqual([["huge"], 7500, ["big"]]);
	});
});

describe("replays", () => {
	it(`${cites("rules", "replay")} when the target leaves before the Damage Step, the attacker may attack again, or another monster, and the first stays used if another attacks`, () => {
		const start = battle({ monsters: ["big", "small"] }, { monsters: ["even"], set: ["vanish"] });
		const replayed = play(start, "attack big > even", "activate vanish");
		expect(replayed.battle).toBeNull();
		expect(attacks(replayed)).toEqual(["attack big directly", "attack small directly"]);
		const other = play(replayed, "attack small directly");
		expect(other.lp.rival).toBe(7400);
		expect(attacks(other)).toEqual([]);
		// Or the same monster again.
		expect(play(replayed, "attack big directly").lp.rival).toBe(6000);
	});
	it(`${cites("rules", "replay-causes")} another of the opponent's monsters leaving is not a replay: the attack goes on`, () => {
		const start = battle({ monsters: ["big"] }, { monsters: ["small", "even"], set: ["shed"] });
		const done = play(start, "attack big > small", "activate shed");
		expect(done.battle).toBeNull();
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["even", "shed", "small"]);
		expect(done.lp.rival).toBe(6600);
	});
	it(`${cites("rules", "replay")} ${cites("rules", "replay-causes")} when a new monster comes to the opponent's side before the Damage Step, the attack is replayed`, () => {
		const start = battle({ monsters: ["big"] }, { monsters: ["small"], set: ["reinforce"], hand: ["even"] });
		const replayed = play(start, "attack big > small", "activate reinforce");
		expect(replayed.battle).toBeNull();
		expect(replayed.lp).toEqual({ you: 8000, rival: 8000 });
		expect(attacks(replayed)).toEqual(["attack big > even", "attack big > small"]);
	});
});
