import { describe, expect, it } from "vitest";
import { atk, canSpecialSummon, cites, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board, find, resolve, threeSpells } from "./sky-striker-fixtures";

const card = "sky-striker-ace-kagari";
const summon = `special-summon ${card}`;
const recover = (target: string) => `activate ${card} > ${target}`;

describe("Sky Striker Ace - Kagari, written as effect records", () => {
	it(`${cites("sky-striker-ace-kagari", "facts")} is a FIRE Machine Link 1 Effect Monster, 1500 ATK, arrow at the top left, a "Sky Striker Ace" and a "Sky Striker" card`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Ace - Kagari", attribute: "FIRE", monsterType: "Machine", frame: "link", link: 1, arrows: ["top-left"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace - Kagari"] });
		expect(duel.defs[card]!.kind).toBe("monster");
	});

	describe("its Link Summon and its limit", () => {
		it(`${cites("sky-striker-ace-kagari", "procedure")} needs 1 face-up "Sky Striker Ace" monster that is not FIRE as the Link Material, and sends it to the Graveyard`, () => {
			expect(offered(board({ monsters: ["fixture-ace-dark"], extra: [card] }))).toContain(summon);
			expect(offered(board({ monsters: ["fixture-ace-wind"], extra: [card] }))).toContain(summon);
			// A FIRE Ace, a monster that is not an Ace, and two monsters are no material.
			expect(offered(board({ monsters: ["fixture-ace-fire"], extra: [card] }))).not.toContain(summon);
			expect(offered(board({ monsters: ["fixture-filler"], extra: [card] }))).not.toContain(summon);
			expect(offered(board({ monsters: ["fixture-ace-dark", "fixture-ace-light"], extra: [card] }))).toContain(summon);
			const done = resolve(play(board({ monsters: ["fixture-ace-dark"], extra: [card] }), summon, "place 5"));
			expect(find(done, "fixture-ace-dark").zone).toBe("graveyard");
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", slot: 5, summonedBy: "link" });
		});
		it(`${cites("sky-striker-ace-kagari", "once")} ${cites("sky-striker-ace-kagari", "notes-not-effect")} ${cites("sky-striker-ace-kagari", "notes-any-summon")} only 1 "Sky Striker Ace - Kagari" can be Special Summoned each turn, by its procedure or an effect, and it is not an effect: negating the monster does not lift it`, () => {
			const start = board({ extra: [card, card] });
			const [first, second] = start.piles.you.extra;
			const done = specialSummon(start, "you", first!, { slot: 5 });
			expect(canSpecialSummon(done, "you", second!)).toBe(false);
			expect(canSpecialSummon(negateCardEffects(done, first!, done.turn.number), "you", second!)).toBe(false);
			const both = board({ monsters: ["fixture-ace-dark", "fixture-ace-light"], extra: [card, card] });
			expect(offered(both)).toContain(summon);
			const linked = resolve(play(both, summon, "choose fixture-ace-dark", "place 5"));
			// A material is left for the second one: only the limit stops it.
			expect(linked.piles.you.monster.map((id) => linked.cards[id]!.code).filter((code) => code.startsWith("fixture-ace"))).toEqual(["fixture-ace-light"]);
			expect(offered(linked)).not.toContain(summon);
		});
	});

	describe("its Trigger Effect", () => {
		const start = () => board({ extra: [card], monsters: ["fixture-ace-dark"], graveyard: ["fixture-ss-spell", "fixture-ss-monster", "fixture-other-spell", "fixture-trap", "fixture-ss-spell-b"] });
		it(`${cites("sky-striker-ace-kagari", "recover")} ${cites("sky-striker-ace-kagari", "notes-trigger")} when it is Special Summoned, targets 1 "Sky Striker" Spell in the Graveyard and adds it to the hand: not a monster, a Trap or a Spell of another name`, () => {
			const summoned = resolve(play(start(), summon, "place 5"));
			expect(offered(summoned).filter((label) => label.startsWith("activate"))).toEqual([recover("fixture-ss-spell"), recover("fixture-ss-spell-b")].sort());
			const done = resolve(play(summoned, recover("fixture-ss-spell-b")));
			expect(codes(done, "you", "hand")).toEqual(["fixture-ss-spell-b"]);
			expect(find(done, "fixture-ss-spell-b").zone).toBe("hand");
		});
		it(`${cites("sky-striker-ace-kagari", "recover")} is only a Graveyard of its controller: the opponent's "Sky Striker" Spells are not targets`, () => {
			const summoned = resolve(play(board({ extra: [card], monsters: ["fixture-ace-dark"] }, { graveyard: ["fixture-ss-spell"] }), summon, "place 5"));
			expect(offered(summoned).filter((label) => label.startsWith("activate"))).toEqual([]);
		});
		it(`${cites("sky-striker-ace-kagari", "notes-damage-step")} it can be activated in the Damage Step: Special Summoned there by a Counter Trap, the effect is offered at the next trigger point`, () => {
			const rivalAttack = board({ set: ["fixture-summon-counter"], extra: [card], graveyard: ["fixture-ss-spell"] }, { monsters: ["fixture-big"] }, {}, "rival", "battle");
			const declared = play(rivalAttack, "attack fixture-big directly");
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			const summoned = resolve(play(mine, "activate fixture-summon-counter"));
			expect(find(summoned, card)).toMatchObject({ zone: "monster", face: "up" });
			expect(summoned.battle?.step).toBe("start");
			expect(offered(summoned)).toContain(recover("fixture-ss-spell"));
		});
	});

	describe("its Continuous Effect", () => {
		it(`${cites("sky-striker-ace-kagari", "atk")} ${cites("sky-striker-ace-kagari", "notes-continuous")} gains 100 ATK for each Spell in its controller's Graveyard, Spells of any name and kind, no monster or Trap; negated, it gains nothing`, () => {
			const none = board({ extraZone: [card] });
			const id = find(none, card).id;
			expect(atk(none, id)).toBe(1500);
			const some = board({ extraZone: [card], graveyard: [...threeSpells, "fixture-trap", "fixture-filler"] });
			expect(atk(some, id)).toBe(1800);
			expect(atk(negateCardEffects(some, id, some.turn.number), id)).toBe(1500);
			// The opponent's Graveyard is not counted.
			expect(atk(board({ extraZone: [card] }, { graveyard: threeSpells }), id)).toBe(1500);
		});
	});
});
