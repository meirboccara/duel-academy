import { describe, expect, it } from "vitest";
import { type CardDef, cites, type DamageStep, type Duel, type EffectRecord, negateActivation } from "../../src";
import { battleCards, toStep } from "./battle-fixtures";
import { offered, play, position, type SideSpec } from "./fixtures";

/**
 * Quick Effects whose Konami notes say they "can also be activated in the Damage Step" (`EffectRecord.damageStep`, a flag set per
 * record; src/battle.ts): monsters' Quick Effects that negate an activation. Made-up cards only; the sources are Konami's Japanese
 * notes, Q&A and rulebook (OCG only), in src/damage-step-sources.ts. No Konami page found states it as a general rule.
 */
const log: string[] = [];
const logs = (text: string): EffectRecord["operation"] => (duel) => (log.push(text), duel);
const TIMINGS: readonly DamageStep[] = ["start", "before", "after", "end"];

/** "When an effect of a card in the GY is activated (Quick Effect): You can negate the activation." */
const negatesGraveyardActivation = (damageStep?: true): EffectRecord => ({
	type: "quick",
	...(damageStep ? { damageStep } : {}),
	condition: (duel) => duel.chain.at(-1)?.card.zone === "graveyard",
	operation: (duel, _link, index) => negateActivation(duel, index - 1),
});
const monster = (code: string, effects: EffectRecord[]): CardDef => ({ code, kind: "monster", facts: { level: 4, atk: 0, def: 0 }, effects });
/** In the GY: a mandatory Trigger Effect at one timing of the Damage Step. */
const inGraveyardAt = (step: DamageStep): CardDef =>
	monster(`fixture-gy-effect-at-${step}`, [{ type: "trigger", range: "graveyard", mandatory: true, event: (_duel, event) => event.type === "damage-step" && event.step === step, operation: logs(`gy-effect-at-${step}`) }]);

const defs: Record<string, CardDef> = {
	...battleCards(),
	"fixture-gy-negator-in-damage-step": monster("fixture-gy-negator-in-damage-step", [negatesGraveyardActivation(true)]),
	"fixture-gy-negator-unflagged": monster("fixture-gy-negator-unflagged", [negatesGraveyardActivation()]),
	// A Normal Trap with the same negation, wrongly flagged: the notes read are all about monsters' Quick Effects.
	"fixture-gy-negator-trap": { code: "fixture-gy-negator-trap", kind: "trap", effects: [{ ...negatesGraveyardActivation(true), type: "activation" }] },
	...Object.fromEntries(TIMINGS.map((step) => [`fixture-gy-effect-at-${step}`, inGraveyardAt(step)])),
};
/** Your `huge` attacks the rival's `target`; the rival's Graveyard effects activate in the Damage Step, and you hold the negators. */
const attack = (you: SideSpec, rival: SideSpec, target = "big"): Duel =>
	play(position({ defs, phase: "battle", options: { everyWindow: true }, you: { ...you, monsters: ["huge", ...(you.monsters ?? [])] }, rival: { ...rival, monsters: [target] } }), `attack huge > ${target}`);
const negators = (duel: Duel): string[] => offered(duel).filter((label) => label.includes("negator"));

describe("effects that can also be activated in the Damage Step", () => {
	it(`${cites("rules", "spirit-dragon-negation-in-damage-step")} ${cites("rules", "spirit-dragon-summon-not-in-damage-step")} ${cites("rules", "ocg-damage-step-start-list")} a Quick Effect that negates the activation of an effect in the GY, flagged for the Damage Step, is offered there in a Chain to that effect; the same effect unflagged is not`, () => {
		log.length = 0;
		const declared = attack({ monsters: ["fixture-gy-negator-in-damage-step", "fixture-gy-negator-unflagged"] }, { graveyard: ["fixture-gy-effect-at-before"] });
		const before = toStep(declared, "before");
		expect(before.chain.map((link) => link.card.code)).toEqual(["fixture-gy-effect-at-before"]);
		expect(before.priority.holder).toBe("you");
		expect(negators(before)).toEqual(["activate fixture-gy-negator-in-damage-step"]);
		toStep(play(before, "activate fixture-gy-negator-in-damage-step"), "after");
		expect(log).toEqual([]);
	});
	/** Flagged, the negation is offered at `step` in a Chain to the Graveyard effect activated there, and negates it; unflagged, it is not offered. */
	const negatesAt = (step: DamageStep): void => {
		log.length = 0;
		const window = toStep(attack({ monsters: ["fixture-gy-negator-in-damage-step", "fixture-gy-negator-unflagged"] }, { graveyard: [`fixture-gy-effect-at-${step}`] }), step);
		expect([step, window.chain.map((link) => link.card.code)]).toEqual([step, [`fixture-gy-effect-at-${step}`]]);
		expect([step, negators(window)]).toEqual([step, ["activate fixture-gy-negator-in-damage-step"]]);
		toStep(play(window, "activate fixture-gy-negator-in-damage-step"), null);
		expect([step, log]).toEqual([step, []]);
	};
	// The notes of the three cards say "in the Damage Step" and name no timing.
	it(`${cites("rules", "ultimate-spirit-dragon-negation-in-damage-step")} ${cites("rules", "neo-ultimate-dragon-negation-in-damage-step")} flagged, it is offered at the start of the Damage Step and before damage calculation`, () => {
		negatesAt("start");
		negatesAt("before");
	});
	// Inferred: no Konami page read shows such a monster effect after damage calculation or at the end of the Damage Step. The notes
	// name no timing, and Q&A fid 12836 shows one chained during damage calculation (a timing the core has no window for), so it is
	// not held to "up until the start of damage calculation"; YGOProJudge agrees (2026-11-25, no source).
	it(`${cites("rules", "monster-negation-during-damage-calculation")} flagged, it is offered past the start of damage calculation too: after damage calculation and at the end of the Damage Step (inferred)`, () => {
		negatesAt("after");
		negatesAt("end");
	});
	// Inferred the same way: the end of the Damage Step is where a monster destroyed by battle activates its effect in the GY.
	it(`${cites("rules", "spirit-dragon-negation-in-damage-step")} ${cites("rules", "destruction-sent-at-end")} at the end of the Damage Step it negates the effect of a monster destroyed by that battle and sent to the GY (inferred timing)`, () => {
		const fallen: string[] = [];
		const cards = { ...defs, ...battleCards(fallen) };
		const start = position({ defs: cards, phase: "battle", options: { everyWindow: true }, you: { monsters: ["huge", "fixture-gy-negator-in-damage-step"] }, rival: { monsters: ["fallen"] } });
		const end = toStep(play(start, "attack huge > fallen"), "end");
		expect(end.chain.map((link) => [link.card.code, link.card.zone])).toEqual([["fallen", "graveyard"]]);
		expect(negators(end)).toEqual(["activate fixture-gy-negator-in-damage-step"]);
		// Unanswered, the effect is applied; answered, its activation is negated.
		toStep(end, null);
		expect(fallen).toEqual(["fallen"]);
		fallen.length = 0;
		toStep(play(end, "activate fixture-gy-negator-in-damage-step"), null);
		expect(fallen).toEqual([]);
	});
	it(`${cites("rules", "damage-step-activation-limit")} the flag is read on a Quick Effect only: a Normal Trap flagged the same way stays under the rulebook's limit`, () => {
		const declared = attack({ monsters: ["fixture-gy-negator-in-damage-step"], set: ["fixture-gy-negator-trap"] }, { graveyard: ["fixture-gy-effect-at-before"] });
		const before = toStep(declared, "before");
		expect(before.chain.map((link) => link.card.code)).toEqual(["fixture-gy-effect-at-before"]);
		expect(negators(before)).toEqual(["activate fixture-gy-negator-in-damage-step"]);
	});
});
