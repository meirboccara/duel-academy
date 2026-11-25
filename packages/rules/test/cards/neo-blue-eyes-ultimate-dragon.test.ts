import { describe, expect, it } from "vitest";
import { CARD_DEFS, type CardDef, cites, type Duel, flipFaceDown, moveCard, moveCards, printedFacts, specialSummon } from "../../src";
import { battleCards, toStep } from "../rules/battle-fixtures";
import { equipCards } from "../rules/equip-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesExtraFixtures, fixtureLog, settle } from "./blue-eyes-extra-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";

const card = "neo-blue-eyes-ultimate-dragon";
const equips = equipCards();
const gaps = gapCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...battleCards(),
	...blueEyesFixtures,
	...blueEyesExtraFixtures,
	"fixture-polymerization": equips["fixture-polymerization"]!,
	...Object.fromEntries(["fixture-smite", "fixture-giant"].map((code) => [code, gaps[code]!])),
};
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
/** The distinct actions offered that start with `label` (the same card to send can be offered once per copy). */
const own = (duel: Duel, label: string) => [...new Set(offered(duel).filter((entry) => entry.startsWith(label)))];
const again = `activate ${card} ~ fixture-blue-eyes-fusion`;
const attacks = (duel: Duel) => [...new Set(offered(duel).filter((label) => label.startsWith("attack")))];
/** Passes until the attack in progress reaches the timing `step` of its Damage Step. */
const until = (duel: Duel, step: string): Duel => {
	let next = duel;
	for (let guard = 0; guard < 30 && next.battle?.step !== step; guard++) next = play(next, "pass");
	return next;
};
/** Passes until the attack in progress is over. */
const over = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 30 && next.battle; guard++) next = play(next, "pass");
	return next;
};
/**
 * The dragon Fusion Summoned (the Summon is not the point: `specialSummon` with kind "fusion" marks it as the procedure does) in your Battle Phase,
 * with `fixture-blue-eyes-fusion` Extra Deck monsters to send, against the rival's `small` (600) and `even` (1000).
 */
const fought = (you: SideSpec = {}, rival: SideSpec = {}, prepare: (duel: Duel) => Duel = (duel) => duel): Duel => {
	const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { extra: [card, "fixture-blue-eyes-fusion", "fixture-blue-eyes-fusion", "fixture-blue-eyes-fusion"], ...you }, rival: { monsters: ["small", "even"], ...rival } });
	return prepare(specialSummon(start, "you", find(start, card).id, { kind: "fusion" }));
};
const toEnd = (duel: Duel, target = "small"): Duel => until(play(duel, `attack ${card} > ${target}`), "end");

describe("Neo Blue-Eyes Ultimate Dragon, written as effect records", () => {
	it(`${cites("neo-blue-eyes-ultimate-dragon", "facts")} ${cites("neo-blue-eyes-ultimate-dragon", "notes-archetype")} is a LIGHT Dragon Fusion Effect Monster of Level 12 with 4500 ATK and 3800 DEF, a "Blue-Eyes" monster that mentions "Blue-Eyes White Dragon"`, () => {
		const duel = position({ defs, you: { extra: [card] } });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Neo Blue-Eyes Ultimate Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "fusion", level: 12, atk: 4500, def: 3800, archetypes: ["Blue-Eyes"], mentions: ["Blue-Eyes White Dragon"] });
	});

	it(`${cites("neo-blue-eyes-ultimate-dragon", "procedure")} is Fusion Summoned with 3 "Blue-Eyes White Dragon"`, () => {
		const fuse = (you: SideSpec) => own(position({ defs, you: { hand: ["fixture-polymerization"], extra: [card], ...you } }), "activate fixture-polymerization");
		expect(fuse({ monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"] })).toEqual(["activate fixture-polymerization"]);
		// From the hand and the field alike.
		expect(fuse({ hand: ["fixture-polymerization", "blue-eyes-white-dragon"], monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"] })).toEqual(["activate fixture-polymerization"]);
		// Two of them and another "Blue-Eyes" monster, or only two.
		expect(fuse({ monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "fixture-blue-eyes-normal"] })).toEqual([]);
		expect(fuse({ monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"] })).toEqual([]);
		const start = position({ defs, you: { hand: ["fixture-polymerization"], monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"], extra: [card] } });
		const done = settle(play(start, "activate fixture-polymerization"));
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "fusion" });
		expect(codes(done, "you", "graveyard").filter((code) => code === "blue-eyes-white-dragon")).toHaveLength(3);
	});

	describe("its attack-again effect", () => {
		it(`${cites("neo-blue-eyes-ultimate-dragon", "attack-again")} ${cites("neo-blue-eyes-ultimate-dragon", "notes-attack-field")} ${cites("neo-blue-eyes-ultimate-dragon", "notes-attack-cost")} at the end of the Damage Step, if this Fusion Summoned card attacked and is the only face-up card its controller controls, sends 1 "Blue-Eyes" Fusion Monster from the Extra Deck to the GY, and can attack again in a row`, () => {
			const end = toEnd(fought());
			expect(own(end, "activate")).toEqual([again]);
			// Without the effect it cannot attack again; with it, it can, in a row.
			expect(attacks(over(end))).toEqual([]);
			const used = over(settle(play(end, again)));
			expect(codes(used, "you", "graveyard")).toEqual(["fixture-blue-eyes-fusion"]);
			expect(codes(used, "you", "extra").sort()).toEqual(["fixture-blue-eyes-fusion", "fixture-blue-eyes-fusion"]);
			expect(attacks(used)).toEqual([`attack ${card} > even`]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "attack-again")} the cost is a "Blue-Eyes" Fusion Monster: not a Fusion Monster that is not "Blue-Eyes", nor a "Blue-Eyes" Synchro Monster`, () => {
			expect(own(toEnd(fought({ extra: [card, "fixture-light-fusion-dragon", "fixture-blue-eyes-synchro"] })), "activate")).toEqual([]);
			expect(own(toEnd(fought({ extra: [card, "fixture-light-fusion-dragon", "fixture-blue-eyes-fusion"] })), "activate")).toEqual([again]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "attack-again")} needs it to be the only face-up card its controller controls: another monster, or a face-up Spell or Trap Card, stops it; Set cards do not`, () => {
			expect(own(toEnd(fought({ monsters: ["fixture-plain-1"] })), "activate")).toEqual([]);
			expect(own(toEnd(fought({ faceupSpells: ["fixture-continuous-spell"] })), "activate")).toEqual([]);
			expect(own(toEnd(fought({ set: ["fixture-trap-smite"], facedown: ["fixture-plain-2"] })), "activate")).toEqual([again]);
			// The opponent's cards do not count.
			expect(own(toEnd(fought({}, { faceupSpells: ["fixture-continuous-spell"] })), "activate")).toEqual([again]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "attack-again")} needs the card to have been Fusion Summoned: put on the field otherwise, it cannot`, () => {
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: [card], extra: ["fixture-blue-eyes-fusion"] }, rival: { monsters: ["small"] } });
			expect(own(until(play(start, `attack ${card} > small`), "end"), "activate")).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "notes-attack-must-remain")} cannot be activated by a card that was destroyed by that battle and left the Monster Zone`, () => {
			const end = toEnd(fought({}, { monsters: ["fixture-titan"] }), "fixture-titan");
			expect(find(end, card).zone).toBe("graveyard");
			expect(own(end, "activate")).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "notes-attack-after-flip-banish")} is still "Fusion Summoned" after being turned face-down and face-up again, or banished temporarily and returned`, () => {
			const flipped = fought({}, {}, (duel) => {
				const id = find(duel, card).id;
				return moveCard(flipFaceDown(duel, id), id, { zone: "monster", face: "up", position: "attack" });
			});
			expect(find(flipped, card)).toMatchObject({ face: "up", summonedBy: "fusion" });
			expect(own(toEnd(flipped), "activate")).toEqual([again]);
			const returned = fought({}, {}, (duel) => {
				const id = find(duel, card).id;
				return moveCard(moveCards(duel, [id], { zone: "banished" }), id, { zone: "monster", face: "up", position: "attack" });
			});
			expect(find(returned, card)).toMatchObject({ zone: "monster", summonedBy: "fusion" });
			expect(own(toEnd(returned), "activate")).toEqual([again]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "qa-call-of-the-haunted")} a card Fusion Summoned, sent to the Graveyard and Special Summoned from there is no longer "Fusion Summoned": it cannot (Konami's Q&A fid 19157)`, () => {
			const start = position({ defs, options: { everyWindow: true }, you: { hand: ["fixture-grave-call"], extra: [card, "fixture-blue-eyes-fusion"] }, rival: { monsters: ["small"] } });
			const id = find(start, card).id;
			const buried = moveCard(specialSummon(start, "you", id, { kind: "fusion" }), id, { zone: "graveyard" });
			const back = settle(play(buried, "activate fixture-grave-call"));
			expect(find(back, card)).toMatchObject({ zone: "monster", face: "up", specialSummoned: true, summonedBy: null });
			// On to the Battle Phase.
			const inBattle: Duel = { ...back, turn: { ...back.turn, phase: "battle" }, priority: { holder: "you", passed: [], open: true } };
			expect(own(toEnd(inBattle), "activate")).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "qa-divine-punishment")} the attack target destroyed in the Damage Step by an effect, so that no damage calculation is performed, the dragon still attacked: it can be activated (Konami's Q&A fid 19155)`, () => {
			fixtureLog.length = 0;
			const start = fought({ set: ["fixture-wrath"] }, { monsters: ["fixture-catastor"] });
			const before = toStep(play(start, `attack ${card} > fixture-catastor`), "before");
			expect(before.chain.map((link) => link.card.code)).toEqual(["fixture-catastor"]);
			const answered = play(before, "activate fixture-wrath");
			const end = until(answered, "end");
			expect(fixtureLog).toEqual([]);
			expect(codes(end, "rival", "graveyard")).toEqual(["fixture-catastor"]);
			// No damage calculation was performed.
			expect(end.battle?.fought).toBeUndefined();
			expect(own(end, "activate")).toEqual([again]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "attack-again")} banished in the Damage Step of its attack and returned to the Monster Zone before damage calculation, it is a new card that did not attack: it cannot`, () => {
			const before = toStep(play(fought(), `attack ${card} > small`), "before");
			const id = find(before, card).id;
			const returned = moveCard(moveCards(before, [id], { zone: "banished" }), id, { zone: "monster", face: "up", position: "attack" });
			expect(find(returned, card)).toMatchObject({ zone: "monster", face: "up", summonedBy: "fusion" });
			const end = until(returned, "end");
			expect(end.battle?.step).toBe("end");
			expect(own(end, "activate")).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "once")} can be used twice per turn`, () => {
			let duel = fought({}, { monsters: ["fixture-giant", "fixture-giant", "fixture-giant"] });
			for (let use = 0; use < 2; use++) {
				const end = toEnd(duel, "fixture-giant");
				expect(own(end, "activate")).toEqual([again]);
				duel = over(settle(play(end, again)));
				expect(attacks(duel)).toEqual([`attack ${card} > fixture-giant`]);
			}
			const third = toEnd(duel, "fixture-giant");
			expect(own(third, "activate")).toEqual([]);
			expect(codes(third, "you", "graveyard")).toEqual(["fixture-blue-eyes-fusion", "fixture-blue-eyes-fusion"]);
			expect(codes(third, "rival", "monster")).toEqual([]);
		});
	});

	describe("its Quick Effect in the Graveyard", () => {
		const theirTurn = (you: SideSpec = {}, rival: SideSpec = {}) => position({ defs, turn: "rival", options: { everyWindow: true }, you: { graveyard: [card], monsters: ["fixture-blue-eyes-effect", "fixture-plain-4"], ...you }, rival });
		const negate = `activate ${card}`;
		it(`${cites("neo-blue-eyes-ultimate-dragon", "negate")} ${cites("neo-blue-eyes-ultimate-dragon", "notes-gy-quick")} ${cites("neo-blue-eyes-ultimate-dragon", "notes-gy-target-includes")} when a card or effect is activated that targets a "Blue-Eyes" monster its controller controls, banishes itself from the GY, negates the activation and destroys that card`, () => {
			const duel = play(theirTurn({}, { set: ["fixture-smite"] }), "activate fixture-smite > fixture-blue-eyes-effect");
			expect(own(duel, "activate")).toEqual([negate]);
			const done = settle(play(duel, negate));
			expect(codes(done, "you", "banished")).toEqual([card]);
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-smite"]);
			expect(find(done, "fixture-blue-eyes-effect").zone).toBe("monster");
			// Left alone, the Spell destroys the monster.
			const alone = settle(play(duel, "pass"));
			expect(find(alone, "fixture-blue-eyes-effect").zone).toBe("graveyard");
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "negate")} answers a monster's effect and a Trap Card as well, and an effect whose targets only include the monster`, () => {
			const monster = play(theirTurn({}, { monsters: ["fixture-aimer"] }), "activate fixture-aimer > fixture-blue-eyes-effect");
			expect(own(monster, "activate")).toEqual([negate]);
			const trap = play(theirTurn({}, { set: ["fixture-trap-smite"] }), "activate fixture-trap-smite > fixture-blue-eyes-effect");
			expect(own(trap, "activate")).toEqual([negate]);
			const pair = play(theirTurn({}, { set: ["fixture-pair-spell"] }), "activate fixture-pair-spell > fixture-blue-eyes-effect > fixture-plain-4");
			expect(own(pair, "activate")).toEqual([negate]);
			const destroyed = settle(play(monster, negate));
			// "Destroy that card": the monster whose effect was negated is destroyed, and its effect is not applied.
			expect(codes(destroyed, "rival", "graveyard")).toEqual(["fixture-aimer"]);
			expect(fixtureLog.includes("aimer")).toBe(false);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "negate")} is not offered when the target is not a "Blue-Eyes" monster, not controlled by its controller, or not face-up in the Monster Zone`, () => {
			expect(own(play(theirTurn({}, { set: ["fixture-smite"] }), "activate fixture-smite > fixture-plain-4"), "activate")).toEqual([]);
			// The opponent's own "Blue-Eyes" monster.
			expect(own(play(theirTurn({}, { set: ["fixture-smite"], monsters: ["fixture-blue-eyes-small"] }), "activate fixture-smite > fixture-blue-eyes-small"), "activate")).toEqual([]);
			// An effect that targets nothing.
			expect(own(play(theirTurn({}, { hand: ["fixture-normal-spell"] }), "activate fixture-normal-spell"), "activate")).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "notes-gy-quick")} is offered only from the Graveyard: not in the hand, banished or on the field`, () => {
			const set = (you: SideSpec) => play(theirTurn(you, { set: ["fixture-smite"] }), "activate fixture-smite > fixture-blue-eyes-effect");
			expect(own(set({ graveyard: [], hand: [card] }), "activate")).toEqual([]);
			expect(own(set({ graveyard: [], monsters: ["fixture-blue-eyes-effect", card] }), "activate")).toEqual([]);
			const base = theirTurn({}, { set: ["fixture-smite"] });
			const away = moveCard(base, find(base, card).id, { zone: "banished" });
			expect(own(play(away, "activate fixture-smite > fixture-blue-eyes-effect"), "activate")).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "notes-gy-direct-chain")} can only be chained directly to the card or effect that targets: not once another Chain Link is on it`, () => {
			const start = theirTurn({ monsters: ["fixture-blue-eyes-effect", "fixture-field-quick-a"] }, { set: ["fixture-smite"], monsters: ["fixture-field-quick-b"] });
			const first = play(start, "activate fixture-smite > fixture-blue-eyes-effect");
			expect(own(first, "activate")).toEqual(["activate fixture-field-quick-a", negate]);
			const covered = play(play(first, "activate fixture-field-quick-a"), "activate fixture-field-quick-b");
			expect(covered.chain).toHaveLength(3);
			expect(own(covered, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("neo-blue-eyes-ultimate-dragon", "notes-gy-damage-step")} can also be activated in the Damage Step`, () => {
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: ["fixture-blue-eyes-effect"], graveyard: [card] }, rival: { monsters: ["big"], set: ["fixture-droplet"] } });
			const inStep = toStep(play(start, "attack fixture-blue-eyes-effect > big"), "start");
			expect(inStep.battle?.step).toBe("start");
			const rivalActs = play(inStep, "pass");
			const targeted = play(rivalActs, "activate fixture-droplet > fixture-blue-eyes-effect");
			expect(targeted.chain.map((link) => link.card.code)).toEqual(["fixture-droplet"]);
			expect(own(targeted, "activate")).toEqual([negate]);
			const done = settle(play(targeted, negate));
			expect(codes(done, "you", "banished")).toEqual([card]);
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-droplet"]);
		});
	});
});
