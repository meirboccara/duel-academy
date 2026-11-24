import { describe, expect, it } from "vitest";
import { CARD_DEFS, type CardDef, cites, destroyCard, type Duel, effectDestruction, negateActivation, negateEffect, targetsOf } from "../../src";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "true-light";
const BEWD = "blue-eyes-white-dragon";
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	// A Quick-Play Spell: "Target 1 monster on the field; send it to the GY" (an opponent's effect that targets), and a Trap Card mentioning the name.
	"fixture-targeter": { code: "fixture-targeter", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel) => duel }] },
	"fixture-mentioning-trap": { code: "fixture-mentioning-trap", kind: "trap", facts: { name: "Fixture Mentioning Trap", mentions: ["Blue-Eyes White Dragon"] }, effects: [{ type: "activation", operation: (duel) => duel }] },
	// A Field Spell that mentions the name (to be Set from the Deck).
	"fixture-mentioning-field": { code: "fixture-mentioning-field", kind: "spell", facts: { name: "Fixture Mentioning Field", icon: "field", mentions: ["Blue-Eyes White Dragon"] }, effects: [{ type: "activation", stays: true, operation: (duel) => duel }] },
	"fixture-other-field": { code: "fixture-other-field", kind: "spell", facts: { name: "Fixture Other Field", icon: "field" }, effects: [{ type: "activation", stays: true, operation: (duel) => duel }] },
	// A Quick-Play Spell that directly changes ATK (so it can be activated in the Damage Step) and destroys 1 Spell/Trap on the field: made up, to destroy a Spell/Trap there.
	"fixture-damage-step-breaker": { code: "fixture-damage-step-breaker", kind: "quick-play", effects: [{ type: "activation", categories: ["change-atk"], target: (duel) => [...duel.piles.you.spell, ...duel.piles.rival.spell], operation: (duel, link) => { const t = targetsOf(duel, link)[0]; return t ? destroyCard(duel, t.id, { destruction: effectDestruction(link) }) : duel; } }] },
	// Counter Traps: "negate the activation" and "negate the effect" of the last link.
	"fixture-activation-negator": { code: "fixture-activation-negator", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateActivation(duel, index - 1) }] },
	"fixture-effect-negator": { code: "fixture-effect-negator", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const toMain = (duel: Duel, by: number): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};

describe("True Light, written as effect records", () => {
	describe("its continuous protection", () => {
		it(`${cites("true-light", "protect")} ${cites("true-light", "notes-continuous")} stops the opponent's card effects from targeting "Blue-Eyes White Dragon" in your Monster Zone while it is face-up, and nothing else`, () => {
			const you: SideSpec = { faceupSpells: [card], monsters: [BEWD, "fixture-other-dragon", "fixture-effect-4"] };
			const targeting = (duel: Duel) => offered(duel).filter((label) => label.startsWith("activate fixture-targeter"));
			// The opponent cannot target the Dragon; its other monsters, and its own monsters, are still targets.
			const against = board(you, { hand: ["fixture-targeter"], monsters: [BEWD] }, {}, "rival");
			expect(targeting(against)).toEqual(["activate fixture-targeter > blue-eyes-white-dragon", "activate fixture-targeter > fixture-effect-4", "activate fixture-targeter > fixture-other-dragon"]);
			// Yours can target it.
			const own = board({ ...you, hand: ["fixture-targeter"] });
			expect(targeting(own)).toContain("activate fixture-targeter > blue-eyes-white-dragon");
			// No protection while it is Set: the card does not apply face-down.
			const set = board({ set: [card], monsters: [BEWD] }, { hand: ["fixture-targeter"] }, {}, "rival");
			expect(targeting(set)).toEqual(["activate fixture-targeter > blue-eyes-white-dragon"]);
			// Not in your hand or Graveyard ("in your Monster Zone"), and the protection does not reach a monster of the opponent.
			expect(targeting(board({ faceupSpells: [card], hand: [BEWD] }, { hand: ["fixture-targeter"], monsters: [BEWD] }, {}, "rival"))).toEqual(["activate fixture-targeter > blue-eyes-white-dragon"]);
		});
		it(`${cites("true-light", "protect")} does not stop an effect that does not target (Raigeki destroys the Dragon), and ends when the card leaves the field`, () => {
			const start = board({ faceupSpells: [card], monsters: [BEWD] }, { hand: ["raigeki"] }, {}, "rival");
			expect(codes(play(start, "activate raigeki"), "you", "graveyard")).toEqual([BEWD]);
			// A Dragon that is not named Blue-Eyes White Dragon is no concern of it.
			expect(offered(board({ faceupSpells: [card], monsters: ["fixture-blue-eyes-normal"] }, { hand: ["fixture-targeter"] }, {}, "rival"))).toContain("activate fixture-targeter > fixture-blue-eyes-normal");
		});
	});

	describe("its activation", () => {
		it(`${cites("true-light", "notes-activation-only")} can be activated as the card alone with no condition, and it stays face-up; the effect is then still free to use`, () => {
			const start = board({ set: [card] });
			expect(offered(start)).toEqual(expect.arrayContaining([`activate ${card}`]));
			// Nothing in the hand, Graveyard or Deck: no way to use the effect with it.
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const done = play(start, `activate ${card}`);
			expect(codes(done, "you", "spell")).toEqual([card]);
			expect(find(done, card).face).toBe("up");
			expect(codes(done, "you", "graveyard")).toEqual([]);
		});
		it(`${cites("true-light", "notes-activation-with-effect")} ${cites("true-light", "choose")} ${cites("true-light", "notes-mode")} can be activated with its effect in the same Chain Link when the effect's condition is met, choosing 1 of the 2 effects as it is activated`, () => {
			const start = board({ set: [card], hand: [BEWD], deck: ["fixture-roar"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`, `activate ${card} :0`, `activate ${card} :1`]);
			// Only the effect whose condition holds is offered.
			expect(own(board({ set: [card], hand: [BEWD] }), `activate ${card}`)).toEqual([`activate ${card}`, `activate ${card} :0`]);
			expect(own(board({ set: [card], deck: ["fixture-roar"] }), `activate ${card}`)).toEqual([`activate ${card}`, `activate ${card} :1`]);
			// With neither, only the card alone.
			expect(own(board({ set: [card] }), `activate ${card}`)).toEqual([`activate ${card}`]);
			const chosen = play(start, `activate ${card} :0`, "place 0");
			expect(chosen.chain).toEqual([]);
			expect(find(chosen, card)).toMatchObject({ zone: "spell", face: "up" });
			expect(codes(chosen, "you", "monster")).toEqual([BEWD]);
		});
		it(`${cites("true-light", "notes-mode")} does not offer the Set mode when the only card it could Set is another "True Light": the activated card is face-up when the effect resolves, so that name is excluded`, () => {
			const alone = board({ set: [card], deck: [card] });
			expect(own(alone, `activate ${card}`)).toEqual([`activate ${card}`]);
			// With another card to Set, the mode is offered and the second "True Light" is not what it Sets.
			const other = board({ set: [card], deck: [card, "fixture-roar"] });
			expect(own(other, `activate ${card}`)).toEqual([`activate ${card}`, `activate ${card} :1`]);
		});
		it(`${cites("true-light", "notes-effect-in-zone")} lets its effect be activated later, from the face-up card in the Spell & Trap Zone, as a Chain Link the opponent can respond to, in the player's own Main Phase`, () => {
			const start = board({ faceupSpells: [card], hand: [BEWD] }, { set: ["fixture-effect-negator"] }, { everyWindow: true });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card} :0`]);
			const chained = play(start, `activate ${card} :0`);
			expect(chained.chain.map((link) => [link.card.code, link.card.zone])).toEqual([[card, "spell"]]);
			expect(offered(chained)).toEqual(["activate fixture-effect-negator", "pass"]);
			// Not in the opponent's turn, and not from the Graveyard.
			expect(own(board({ faceupSpells: [card], hand: [BEWD] }, {}, {}, "rival"), `activate ${card}`)).toEqual([]);
			expect(own(board({ graveyard: [card], hand: [BEWD] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("true-light", "once")} lets the effect be used once per turn in all, by the activation with the effect or by the face-up card, the card alone not counting`, () => {
			// The card alone first, then its effect: both allowed in the same turn.
			const start = board({ set: [card], hand: [BEWD] });
			const alone = play(start, `activate ${card}`);
			expect(own(alone, `activate ${card}`)).toEqual([`activate ${card} :0`]);
			const used = play(alone, `activate ${card} :0`, "place 0");
			expect(codes(used, "you", "monster")).toEqual([BEWD]);
			expect(own(used, `activate ${card}`)).toEqual([]);
			// With the effect in the activation, the face-up card has none left this turn; two turns later it has again.
			const spare = board({ set: [card], hand: [BEWD], deck: ["fixture-roar"] });
			const withEffect = play(spare, `activate ${card} :0`, "place 0");
			expect(own(withEffect, `activate ${card}`)).toEqual([]);
			expect(own(toMain(withEffect, 2), `activate ${card}`)).toEqual([`activate ${card} :1`]);
			// A second copy shares the limit (by name).
			const copies = board({ set: [card, card], hand: [BEWD, BEWD] });
			expect(own(play(copies, `activate ${card} :0`, "pass", "choose blue-eyes-white-dragon", "place 0"), `activate ${card} :`)).toEqual([]);
		});
	});

	describe("its effects", () => {
		it(`${cites("true-light", "summon")} ${cites("true-light", "notes-summon-no-target")} Special Summons 1 "Blue-Eyes White Dragon" from the hand or Graveyard, chosen when the effect resolves (no target), to the zone and position the player chooses`, () => {
			const start = board({ faceupSpells: [card], hand: [BEWD, "fixture-blue-eyes-normal"], graveyard: [BEWD] });
			// The action names no target.
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card} :0`]);
			const asked = play(start, `activate ${card} :0`);
			expect(offered(asked).sort()).toEqual(["choose blue-eyes-white-dragon", "choose blue-eyes-white-dragon"]);
			const hand = start.piles.you.hand[0]!;
			const grave = start.piles.you.graveyard[0]!;
			const fromGrave = play(asked, "choose blue-eyes-white-dragon", "place 2");
			expect([codes(fromGrave, "you", "monster"), fromGrave.cards[hand]!.zone, fromGrave.cards[grave]!.zone].flat()).toHaveLength(3);
			expect(fromGrave.piles.you.monster).toHaveLength(1);
			// Another monster of the name is no choice: only "Blue-Eyes White Dragon"; and nothing to Summon, no way to activate this effect.
			expect(own(board({ faceupSpells: [card], hand: ["fixture-blue-eyes-normal"] }), `activate ${card}`)).toEqual([]);
			// No free Monster Zone: the effect cannot be activated.
			expect(own(board({ faceupSpells: [card], hand: [BEWD], monsters: ["fixture-normal-4", "fixture-normal-4", "fixture-normal-4", "fixture-normal-4", "fixture-normal-4"] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("true-light", "set")} ${cites("true-light", "qa-set-name")} Sets 1 Spell/Trap from the Deck that mentions "Blue-Eyes White Dragon" under a name that no face-up card you control and no card in your Graveyard has; a Set card of that name does not stop it`, () => {
			const deck = ["fixture-roar", "fixture-roar-other", "fixture-mentioning-trap", "fixture-other-spell", "fixture-mentioning-monster", "fixture-archetype-spell"];
			const start = board({ faceupSpells: [card], deck });
			const asked = play(start, `activate ${card} :1`);
			// Not a card that names the archetype or another card, not a monster that mentions it.
			expect(offered(asked)).toEqual(["choose fixture-mentioning-trap", "choose fixture-roar", "choose fixture-roar-other"]);
			// A face-up card of that name you control, or one in your Graveyard, takes the name out; a Set card does not (Konami's Q&A fid 23374).
			const withNames = board({ faceupSpells: [card, "fixture-roar"], graveyard: ["fixture-mentioning-trap"], set: ["fixture-roar-other"], deck: [...deck, "fixture-roar", "fixture-roar-other", "fixture-mentioning-trap"] });
			expect(offered(play(withNames, `activate ${card} :1`))).toEqual(["choose fixture-roar-other", "choose fixture-roar-other"]);
			// Face-up on the field after being activated in response: that counts, and the Set is refused (the second part of the same Q&A).
			const lone = board({ faceupSpells: [card, "fixture-roar"], deck: ["fixture-roar"] });
			expect(own(lone, `activate ${card}`)).toEqual([]);
			// A free Spell & Trap Zone is needed (the card takes the zone it is Set in).
			expect(own(board({ faceupSpells: [card, "fixture-other-spell", "fixture-other-spell", "fixture-other-spell", "fixture-other-spell"], deck: ["fixture-roar"] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("true-light", "set")} puts the card face-down in a Spell & Trap Zone and, being a Trap Card Set this turn, it cannot be activated this turn`, () => {
			const start = board({ faceupSpells: [card], deck: ["fixture-mentioning-trap"] });
			const done = play(start, `activate ${card} :1`);
			expect(find(done, "fixture-mentioning-trap")).toMatchObject({ zone: "spell", face: "down", controller: "you" });
			expect(own(done, "activate fixture-mentioning-trap")).toEqual([]);
			// The turn after, it can.
			expect(own(toMain(done, 2), "activate fixture-mentioning-trap")).toEqual(["activate fixture-mentioning-trap"]);
		});
		it(`${cites("true-light", "set")} Sets a Field Spell in the Field Zone, the one that was there going to the Graveyard (the rulebook's one Field Spell a side)`, () => {
			const start = board({ faceupSpells: [card, "fixture-other-field"], deck: ["fixture-mentioning-field"] });
			expect(codes(start, "you", "field")).toEqual(["fixture-other-field"]);
			const done = play(start, `activate ${card} :1`);
			expect(codes(done, "you", "field")).toEqual(["fixture-mentioning-field"]);
			expect(find(done, "fixture-mentioning-field").face).toBe("down");
			expect(codes(done, "you", "graveyard")).toEqual(["fixture-other-field"]);
		});
	});

	describe("when it is sent to the Graveyard", () => {
		it(`${cites("true-light", "destroy")} ${cites("true-light", "notes-destroy-mandatory")} destroys all monsters you control, face-down ones too and not the opponent's, as a mandatory trigger when this face-up card is sent from the Spell & Trap Zone to the GY`, () => {
			const start = board({ faceupSpells: [card], monsters: [BEWD, "fixture-effect-4"], facedown: ["fixture-normal-4"] }, { hand: ["mystical-space-typhoon"], monsters: ["fixture-other-dragon"] }, {}, "rival");
			const done = play(start, "activate mystical-space-typhoon > true-light");
			// It goes on the chain by itself (mandatory), and resolves.
			expect(codes(done, "you", "monster")).toEqual([]);
			expect(codes(done, "you", "graveyard").sort()).toEqual([BEWD, card, "fixture-effect-4", "fixture-normal-4"].sort());
			expect(codes(done, "rival", "monster")).toEqual(["fixture-other-dragon"]);
		});
		it(`${cites("true-light", "notes-destroy-face-up-only")} does not trigger when it was Set, nor when its activation was negated (the card was never sent from the Spell & Trap Zone)`, () => {
			// Set, destroyed by the opponent: nothing happens.
			const set = board({ set: [card], monsters: [BEWD] }, { hand: ["mystical-space-typhoon"] }, {}, "rival");
			// The player holds priority with a Set Trap: they pass and the chain resolves.
			const destroyed = play(set, "activate mystical-space-typhoon > true-light", "pass");
			expect(codes(destroyed, "you", "graveyard")).toEqual([card]);
			expect(codes(destroyed, "you", "monster")).toEqual([BEWD]);
			// Its activation negated: it goes to the Graveyard and nothing is destroyed.
			const negated = play(board({ set: [card], monsters: ["fixture-effect-4"], hand: [BEWD] }, { set: ["fixture-activation-negator"] }, { everyWindow: true }), `activate ${card} :0`, "activate fixture-activation-negator", "pass", "pass");
			expect(codes(negated, "you", "graveyard")).toEqual([card]);
			expect(codes(negated, "you", "monster")).toEqual(["fixture-effect-4"]);
		});
		it(`${cites("true-light", "notes-destroy-damage-step")} triggers even when it is sent to the Graveyard during the Damage Step`, () => {
			const start = position({ defs, turn: "rival", phase: "battle", options: { everyWindow: true }, you: { faceupSpells: [card], monsters: [BEWD, "fixture-effect-4"], set: ["fixture-damage-step-breaker"] }, rival: { monsters: ["fixture-other-dragon"] } });
			const declared = play(start, "attack fixture-other-dragon > fixture-effect-4");
			const inStep = toStep(declared, "start");
			expect(inStep.battle?.step).toBe("start");
			// In the Damage Step only a card that changes ATK/DEF can be activated: the made-up breaker is one.
			const holder = inStep.priority.holder === "you" ? inStep : play(inStep, "pass");
			expect(offered(holder)).toContain("activate fixture-damage-step-breaker > true-light");
			const chained = play(holder, "activate fixture-damage-step-breaker > true-light", "pass", "pass");
			// The breaker resolved, True Light went to the Graveyard, and its trigger is on the chain, in the Damage Step.
			expect(chained.battle?.step).toBe("start");
			expect(chained.chain.map((link) => link.card.code)).toEqual([card]);
			const done = play(chained, "pass", "pass");
			expect(codes(done, "you", "monster")).toEqual([]);
			expect(codes(done, "you", "graveyard")).toEqual(expect.arrayContaining([card, BEWD]));
		});
		it(`${cites("true-light", "qa-activation-negated")} stays on the field when only the effect of the face-up card is negated, and does not destroy anything (Konami's Q&A: the activation of the effect is negated, the card remains)`, () => {
			const start = board({ faceupSpells: [card], monsters: ["fixture-effect-4"], hand: [BEWD] }, { set: ["fixture-activation-negator"] }, { everyWindow: true });
			const done = play(start, `activate ${card} :0`, "activate fixture-activation-negator", "pass", "pass");
			expect(codes(done, "you", "spell")).toEqual([card]);
			expect(codes(done, "you", "monster")).toEqual(["fixture-effect-4"]);
			expect(codes(done, "you", "graveyard")).toEqual([]);
		});
	});
});
