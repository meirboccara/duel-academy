import { describe, expect, it } from "vitest";
import { atk, cites, type Duel, isNegated, negateCardEffects } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec, log: string[] = [], rival: SideSpec = {}): Duel => position({ defs: gapCards(log), you, rival });
const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;

/**
 * "Target 1 face-up card on the field; negate its effects, and if you do, banish it": the negation of a card's effects
 * (`negateCardEffects`) also reaches a face-up Spell or Trap Card on the field. Primite Drillbeam (text, and Konami's Japanese notes,
 * OCG only); made-up cards with the same wording.
 */
describe("negating the effects of a face-up Spell or Trap on the field", () => {
	it(`${cites("rules", "negate-face-up-card-text")} a face-up Continuous Spell whose effects are negated stops applying its Continuous Effect, until the negation ends`, () => {
		const duel = board({ faceupSpells: ["fixture-banner"], monsters: ["fixture-plain"] });
		const monster = idOf(duel, "fixture-plain");
		const banner = idOf(duel, "fixture-banner");
		expect([atk(duel, monster), isNegated(duel, banner)]).toEqual([1500, false]);
		const negated = negateCardEffects(duel, banner, duel.turn.number);
		expect([atk(negated, monster), isNegated(negated, banner)]).toEqual([1000, true]);
		expect(atk({ ...negated, modifiers: [] }, monster)).toBe(1500);
	});
	it(`${cites("rules", "negate-face-up-card-text")} an effect it activates on the field while negated is activated and resolves without effect`, () => {
		const log: string[] = [];
		const duel = board({ faceupSpells: ["fixture-banner"] }, log);
		const negated = negateCardEffects(duel, idOf(duel, "fixture-banner"), duel.turn.number);
		expect(offered(negated)).toContain("activate fixture-banner");
		play(negated, "activate fixture-banner");
		expect(log).toEqual([]);
		play(duel, "activate fixture-banner");
		expect(log).toEqual(["fixture-banner"]);
	});
	it(`${cites("rules", "negate-then-banish-if-negated")} "negate its effects, and if you do, banish it": a Spell that is negated is banished; one unaffected by the effect is neither negated nor banished`, () => {
		const duel = board({ hand: ["fixture-drill"] }, [], { faceupSpells: ["fixture-banner", "fixture-banner-immune"], monsters: ["fixture-plain"] });
		expect(offered(duel)).toEqual(["activate fixture-drill > fixture-banner", "activate fixture-drill > fixture-banner-immune", "activate fixture-drill > fixture-plain", "pass", "set fixture-drill"]);
		const done = play(duel, "activate fixture-drill > fixture-banner");
		expect([codes(done, "rival", "banished"), codes(done, "rival", "spell")]).toEqual([["fixture-banner"], ["fixture-banner-immune"]]);
		const kept = play(duel, "activate fixture-drill > fixture-banner-immune");
		expect([codes(kept, "rival", "banished"), codes(kept, "rival", "spell")]).toEqual([[], ["fixture-banner", "fixture-banner-immune"]]);
	});
	it("a face-down card, and a card that is not on the field, are not negated", () => {
		const duel = board({ set: ["fixture-banner"], graveyard: ["fixture-banner"] });
		const [set] = duel.piles.you.spell;
		const [buried] = duel.piles.you.graveyard;
		expect(negateCardEffects(duel, set!, duel.turn.number)).toBe(duel);
		expect(negateCardEffects(duel, buried!, duel.turn.number)).toBe(duel);
	});
});
