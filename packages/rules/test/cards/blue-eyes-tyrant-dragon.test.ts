import { describe, expect, it } from "vitest";
import { banishWhenItLeaves, canSpecialSummon, CARD_DEFS, type CardDef, cites, type Duel, equipMonster, moveCard, moveCards, printedFacts, specialSummon } from "../../src";
import { battleCards } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { equipCards } from "../rules/equip-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesExtraFixtures, settle } from "./blue-eyes-extra-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "blue-eyes-tyrant-dragon";
const gaps = gapCards();
const equips = equipCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...battleCards(),
	...blueEyesFixtures,
	...blueEyesExtraFixtures,
	...Object.fromEntries(["fixture-eyes-fusion", "fixture-eyes-synchro", "fixture-polymerization", "fixture-little-dragon", "fixture-vanilla"].map((code) => [code, equips[code]!])),
	...Object.fromEntries(["fixture-giant", "fixture-smite"].map((code) => [code, gaps[code]!])),
};
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, phase: "main1" | "battle" = "main1") => position({ defs, options, phase, you, rival });
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const effect = `activate ${card}`;
/** Passes until the attack in progress reaches the Damage Step timing `step`. */
const until = (duel: Duel, step: string): Duel => {
	let next = duel;
	for (let guard = 0; guard < 30 && next.battle?.step !== step; guard++) next = play(next, "pass");
	return next;
};
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));
const traps = ["solemn-judgment", "infinite-impermanence"];

describe("Blue-Eyes Tyrant Dragon, written as effect records", () => {
	it(`${cites("blue-eyes-tyrant-dragon", "facts")} is a LIGHT Dragon Fusion Effect Monster of Level 8 with 3400 ATK and 2900 DEF, that mentions "Blue-Eyes White Dragon"`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Blue-Eyes Tyrant Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "fusion", level: 8, atk: 3400, def: 2900, archetypes: ["Blue-Eyes"], mentions: ["Blue-Eyes White Dragon"] });
	});

	describe("its Summoning condition", () => {
		const fuse = (you: SideSpec) => own(board({ hand: ["fixture-polymerization"], extra: [card], ...you }), "activate fixture-polymerization");
		it(`${cites("blue-eyes-tyrant-dragon", "procedure")} is Fusion Summoned with "Blue-Eyes White Dragon" and 1 Dragon monster`, () => {
			expect(fuse({ monsters: ["blue-eyes-white-dragon", "fixture-little-dragon"] })).toEqual(["activate fixture-polymerization"]);
			// A second "Blue-Eyes White Dragon" is a Dragon monster too.
			expect(fuse({ monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"] })).toEqual(["activate fixture-polymerization"]);
			// The Dragon with a monster that is not one, or two Dragons that are not "Blue-Eyes White Dragon", or the Dragon alone.
			expect(fuse({ monsters: ["blue-eyes-white-dragon", "fixture-vanilla"] })).toEqual([]);
			expect(fuse({ monsters: ["fixture-little-dragon", "fixture-blue-eyes-effect"] })).toEqual([]);
			expect(fuse({ monsters: ["blue-eyes-white-dragon"] })).toEqual([]);
			const start = board({ hand: ["fixture-polymerization"], monsters: ["blue-eyes-white-dragon", "fixture-little-dragon"], extra: [card] });
			const done = play(start, "activate fixture-polymerization");
			const summoned = settle(done);
			expect(find(summoned, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "fusion" });
			expect(codes(summoned, "you", "graveyard").sort()).toEqual(["blue-eyes-white-dragon", "fixture-little-dragon", "fixture-polymerization"]);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "alternative")} ${cites("blue-eyes-tyrant-dragon", "notes-alternative-not-effect")} ${cites("blue-eyes-tyrant-dragon", "notes-alternative-not-fusion")} is Special Summoned from the Extra Deck by Tributing a "Blue-Eyes White Dragon" equipped with a Fusion Monster: a way of Summoning it, not an effect, and not a Fusion Summon`, () => {
			const equipped = (extra: string[] = [card, "fixture-eyes-fusion"], you: SideSpec = {}) => {
				const start = board({ monsters: ["blue-eyes-white-dragon"], extra, ...you });
				const withEquip = extra.includes("fixture-eyes-fusion") ? equipMonster(start, find(start, "fixture-eyes-fusion").id, find(start, "blue-eyes-white-dragon").id, { player: "you", slot: 4 }) : start;
				return { ...withEquip, live: [], waiting: [] } as Duel;
			};
			const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
			expect(summons(equipped())).toEqual([`special-summon ${card}`]);
			// Equipped with nothing, or with a monster that is not a Fusion Monster, or a "Blue-Eyes White Dragon" that is not the one equipped.
			expect(summons(equipped([card]))).toEqual([]);
			expect(summons(equipped([card, "fixture-eyes-synchro"]))).toEqual([]);
			const duel = equipped();
			const done = play(duel, `special-summon ${card}`, "place 0");
			expect(codes(done, "you", "graveyard")).toContain("blue-eyes-white-dragon");
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, specialSummoned: true, summonedBy: null });
			expect(done.chain).toEqual([]);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "notes-extra-deck-only")} ${cites("blue-eyes-tyrant-dragon", "qa-mutation")} comes from the Extra Deck only by those two ways: an effect that just Special Summons from the Extra Deck does not Summon it, and from the Graveyard it follows the rule of Fusion Monsters`, () => {
			const start = board({ hand: ["fixture-extra-call"], extra: [card] });
			expect(canSpecialSummon(start, "you", find(start, card).id)).toBe(false);
			const called = play(start, "activate fixture-extra-call", "pass", "pass");
			expect(find(called, card).zone).toBe("extra");
			// Never properly Summoned: it cannot be Special Summoned from the Graveyard either.
			const buried = moveCard(start, find(start, card).id, { zone: "graveyard" });
			expect(canSpecialSummon(buried, "you", find(buried, card).id)).toBe(false);
		});
	});

	describe("its Continuous Effects", () => {
		const onField = (you: SideSpec = {}, rival: SideSpec = {}, options = {}) => board({ monsters: [card], ...you }, rival, { everyWindow: true, ...options });
		it(`${cites("blue-eyes-tyrant-dragon", "unaffected")} ${cites("blue-eyes-tyrant-dragon", "notes-unaffected-field")} is unaffected by Trap Cards and Trap effects: a Trap that destroys it, or negates its effects, does nothing to it`, () => {
			const duel = play(onField({}, { set: ["fixture-trap-smite"] }), "pass");
			expect(own(duel, "activate fixture-trap-smite")).toEqual([`activate fixture-trap-smite > ${card}`]);
			const targeted = play(duel, `activate fixture-trap-smite > ${card}`, "pass", "pass");
			expect(find(targeted, card).zone).toBe("monster");
			// Infinite Impermanence: its negation does not apply either.
			const negated = settle(play(play(onField({}, { set: ["infinite-impermanence"] }), "pass"), `activate infinite-impermanence > ${card}`));
			expect(find(negated, card).zone).toBe("monster");
		});
		it(`${cites("blue-eyes-tyrant-dragon", "unaffected")} is still affected by a Spell effect and by a monster effect`, () => {
			const spell = play(onField({}, { set: ["fixture-smite"] }, {}), "pass");
			expect(own(spell, "activate fixture-smite")).toEqual([`activate fixture-smite > ${card}`]);
			const done = play(spell, `activate fixture-smite > ${card}`, "pass", "pass");
			expect(find(done, card).zone).toBe("graveyard");
			const nullified = play(play(onField({}, { set: ["fixture-droplet"] }), "pass"), `activate fixture-droplet > ${card}`, "pass", "pass");
			// Its effects are negated: it can no longer attack all monsters (the other Continuous Effect), checked in the next test.
			expect(nullified.modifiers.some((modifier) => modifier.layer.kind === "negate")).toBe(true);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "qa-skill-drain-before")} ${cites("blue-eyes-tyrant-dragon", "qa-skill-drain-after")} with "Skill Drain" already applying when it is Summoned, "unaffected" is negated; with "Skill Drain" activated after, it is not affected by it`, () => {
			// Skill Drain already face-up on the field: this card arrives, its effects are negated, a Trap destroys it.
			const first = board({ faceupSpells: ["skill-drain"], extra: [card] }, { set: ["fixture-trap-smite"] }, { everyWindow: true });
			const placed = moveCard(first, find(first, card).id, { zone: "monster", face: "up" });
			const drained = play(placed, "pass");
			const smite = play(drained, `activate fixture-trap-smite > ${card}`, "pass", "pass");
			expect(find(smite, card).zone).toBe("graveyard");
			// This card first, Skill Drain activated afterwards: it is not affected by it, and keeps its effects.
			const second = board({ monsters: [card], set: ["skill-drain"] }, { set: ["fixture-trap-smite"] }, { everyWindow: true });
			const activated = play(second, "activate skill-drain", "pass", "pass");
			expect(find(activated, "skill-drain").zone).toBe("spell");
			const rivalTurn = settleToRival(activated);
			const keeps = play(rivalTurn, `activate fixture-trap-smite > ${card}`, "pass", "pass");
			expect(find(keeps, card).zone).toBe("monster");
		});
		it(`${cites("blue-eyes-tyrant-dragon", "attack-all")} ${cites("blue-eyes-tyrant-dragon", "notes-attack-all-field")} can attack all monsters the opponent controls, once each`, () => {
			const start = board({ monsters: [card] }, { monsters: ["big", "small", "fixture-giant"] }, { everyWindow: true }, "battle");
			expect(attacks(start)).toEqual([`attack ${card} > big`, `attack ${card} > fixture-giant`, `attack ${card} > small`]);
			const first = play(start, `attack ${card} > small`, "pass", "pass", "pass", "pass");
			const afterFirst = until(first, "end");
			const done = (() => {
				let next = afterFirst;
				for (let guard = 0; guard < 8 && next.battle; guard++) next = play(next, "pass");
				return next;
			})();
			// The monster it attacked is left out, and no direct attack once it has attacked a monster.
			expect(attacks(done)).toEqual([`attack ${card} > big`, `attack ${card} > fixture-giant`]);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "qa-attack-all-direct")} cannot attack directly after attacking a monster, nor attack a monster after a direct attack (Konami's Q&A fid 16016)`, () => {
			const alone = board({ monsters: [card] }, {}, { everyWindow: true }, "battle");
			expect(attacks(alone)).toEqual([`attack ${card} directly`]);
			const withMonsters = board({ monsters: [card] }, { monsters: ["big", "small"] }, { everyWindow: true }, "battle");
			expect(attacks(withMonsters)).not.toContain(`attack ${card} directly`);
			const afterAttack = (() => {
				let next = play(withMonsters, `attack ${card} > big`);
				for (let guard = 0; guard < 12 && next.battle; guard++) next = play(next, "pass");
				return next;
			})();
			expect(attacks(afterAttack)).toEqual([`attack ${card} > small`]);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "qa-multi-attack-negated")} when its effects are negated at a second declaration it can no longer make that attack; negated in the Damage Step, the battle goes on (Konami's Q&A fid 11046)`, () => {
			const start = board({ monsters: [card], hand: ["fixture-droplet"] }, { monsters: ["big", "small"] }, { everyWindow: true }, "battle");
			// Negated before the second attack is declared: only the first attack was made, and no second one is offered.
			const first = (() => {
				let next = play(start, `attack ${card} > big`);
				for (let guard = 0; guard < 12 && next.battle; guard++) next = play(next, "pass");
				return next;
			})();
			expect(attacks(first)).toEqual([`attack ${card} > small`]);
			const negated = play(first, "activate fixture-droplet > " + card, "pass", "pass");
			expect(attacks(negated)).toEqual([]);
			// Negated in the Damage Step of the second attack: the battle continues and damage calculation is performed.
			const declared = play(first, `attack ${card} > small`);
			const inStep = until(declared, "start");
			const answered = play(inStep.priority.holder === "you" ? inStep : play(inStep, "pass"), `activate fixture-droplet > ${card}`);
			const resolved = (() => {
				let next = answered;
				for (let guard = 0; guard < 12 && next.battle !== null && !next.battle?.fought; guard++) next = play(next, "pass");
				return next;
			})();
			expect(resolved.battle?.fought).toBe(true);
			// The first attack, on "big" (2000), cost the rival 1400; the second, with its ATK halved to 1700 against "small" (600), 1100.
			expect(resolved.lp.rival).toBe(8000 - 1400 - 1100);
		});
	});

	describe("its Set effect", () => {
		const fought = (you: SideSpec = {}, rival: SideSpec = {}, prepare: (duel: Duel) => Duel = (duel) => duel, target = "big"): Duel => {
			const start = prepare(board({ monsters: [card], graveyard: [...traps, "mystical-space-typhoon", "effect-veiler"], ...you }, { monsters: [target], ...rival }, { everyWindow: true }, "battle"));
			return until(play(start, `attack ${card} > ${target}`), "end");
		};
		it(`${cites("blue-eyes-tyrant-dragon", "set")} ${cites("blue-eyes-tyrant-dragon", "notes-set-field")} at the end of the Damage Step, if it battled and is still on the field, targets 1 Trap in the Graveyard and Sets it`, () => {
			const end = fought();
			expect(find(end, card).zone).toBe("monster");
			// Only the Traps of the Graveyard are targets: not the Spell, not the monster.
			expect(own(end, effect)).toEqual([`${effect} > infinite-impermanence`, `${effect} > solemn-judgment`]);
			const done = settle(play(end, `${effect} > infinite-impermanence`));
			const set = find(done, "infinite-impermanence");
			expect(set).toMatchObject({ zone: "spell", face: "down", controller: "you" });
			expect(done.setThisTurn).toContain(set.id);
			expect(codes(done, "you", "graveyard").sort()).toEqual(["effect-veiler", "mystical-space-typhoon", "solemn-judgment"]);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "set")} is offered only if it battled: not when another monster attacked, and not with no Trap in the Graveyard or no free Spell & Trap Zone`, () => {
			const other = board({ monsters: [card, "huge"], graveyard: traps }, { monsters: ["big"] }, { everyWindow: true }, "battle");
			expect(own(until(play(other, "attack huge > big"), "end"), effect)).toEqual([]);
			expect(own(fought({ graveyard: ["mystical-space-typhoon", "effect-veiler"] }), effect)).toEqual([]);
			const crowded = board({ monsters: [card], graveyard: traps, set: ["plain-trap", "plain-trap", "plain-trap", "plain-trap", "plain-trap"] }, { monsters: ["big"] }, { everyWindow: true }, "battle");
			expect(own(until(play(crowded, `attack ${card} > big`), "end"), effect)).toEqual([]);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "notes-set-graveyard")} destroyed by that battle and sent to the Graveyard, it is activated in the Graveyard`, () => {
			const end = fought({}, {}, (duel) => duel, "fixture-giant");
			expect(find(end, card).zone).toBe("graveyard");
			expect(own(end, effect)).toEqual([`${effect} > infinite-impermanence`, `${effect} > solemn-judgment`]);
			const done = settle(play(end, `${effect} > solemn-judgment`));
			expect(find(done, "solemn-judgment")).toMatchObject({ zone: "spell", face: "down" });
		});
		it(`${cites("blue-eyes-tyrant-dragon", "notes-set-banished")} destroyed by that battle and banished face-up, it is activated while banished`, () => {
			const end = fought({}, {}, (duel) => banishWhenItLeaves(duel, find(duel, card).id), "fixture-giant");
			expect(find(end, card)).toMatchObject({ zone: "banished", face: "up" });
			expect(own(end, effect)).toEqual([`${effect} > infinite-impermanence`, `${effect} > solemn-judgment`]);
			const done = settle(play(end, `${effect} > infinite-impermanence`));
			expect(find(done, "infinite-impermanence").zone).toBe("spell");
		});
		it(`${cites("blue-eyes-tyrant-dragon", "notes-set-banished")} destroyed by that battle and banished face-down, it cannot be activated: only a card banished face-up can`, () => {
			const start = board({ monsters: [card], graveyard: traps }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "battle");
			const after = until(play(start, `attack ${card} > fixture-giant`), "after");
			expect(after.battle?.destroyed.map((ref) => ref.id)).toEqual([find(after, card).id]);
			// The destruction by battle sends it to banishment face-down instead of the Graveyard (no card of the core does it: the move is made here).
			const banished = (face: "up" | "down") => until(moveCards(after, [find(after, card).id], { zone: "banished", face, reason: "destroyed", by: "battle", destruction: { cause: "battle" } }), "end");
			const end = banished("down");
			expect(find(end, card)).toMatchObject({ zone: "banished", face: "down" });
			expect(own(end, effect)).toEqual([]);
			// Control: the same move face-up, and it is offered.
			expect(own(banished("up"), effect)).toHaveLength(2);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "once")} ${cites("blue-eyes-tyrant-dragon", "qa-once-after-destruction")} can be used once per turn, also from the Graveyard when it was used on the field earlier in that turn and the card was then destroyed in another battle (Konami's Q&A fid 23394)`, () => {
			const start = board({ monsters: [card], graveyard: traps }, { monsters: ["big", "fixture-giant"] }, { everyWindow: true }, "battle");
			const firstEnd = until(play(start, `attack ${card} > big`), "end");
			expect(own(firstEnd, effect)).toHaveLength(2);
			const used = settle(play(firstEnd, `${effect} > infinite-impermanence`));
			let next = used;
			for (let guard = 0; guard < 12 && next.battle; guard++) next = play(next, "pass");
			// The second attack, on the monster that destroys it: destroyed by battle, in the Graveyard at the end of the Damage Step.
			const second = until(play(next, `attack ${card} > fixture-giant`), "end");
			expect(find(second, card).zone).toBe("graveyard");
			expect(own(second, effect)).toEqual([]);
			// Control: with no use made earlier in the turn, it is offered from the Graveyard.
			expect(own(fought({}, {}, (duel) => duel, "fixture-giant"), effect)).toHaveLength(2);
		});
		it(`${cites("blue-eyes-tyrant-dragon", "once")} a card that used the effect, returned to the Extra Deck and was Special Summoned again that turn is a new card: it can use it again`, () => {
			const start = board({ monsters: [card], graveyard: traps }, { monsters: ["big", "big"] }, { everyWindow: true }, "battle");
			const firstEnd = until(play(start, `attack ${card} > big`), "end");
			let next = settle(play(firstEnd, `${effect} > infinite-impermanence`));
			for (let guard = 0; guard < 12 && next.battle; guard++) next = play(next, "pass");
			const id = find(next, card).id;
			const back = specialSummon(moveCard(next, id, { zone: "extra" }), "you", id, { kind: "fusion" });
			expect(find(back, card)).toMatchObject({ zone: "monster", face: "up" });
			const secondEnd = until(play(back, `attack ${card} > big`), "end");
			expect(own(secondEnd, effect)).toEqual([`${effect} > solemn-judgment`]);
		});
	});
});

/** Passes until it is the rival's turn and they hold priority in an open game state of their Main Phase 1. */
function settleToRival(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 60 && !(next.turn.player === "rival" && next.turn.phase === "main1" && next.priority.open && next.priority.holder === "rival"); guard++) next = play(next, "pass");
	return next;
}
