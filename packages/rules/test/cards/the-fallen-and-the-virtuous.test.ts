import { describe, expect, it } from "vitest";
import { addModifier, cites, moveCard, negateCardEffects, printedFacts, belongsTo } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { nextTurn } from "../rules/continuous-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { all, find, resolve } from "./sky-striker-fixtures";
import { board6, effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";

const card = "the-fallen-and-the-virtuous";
const DESTROY = 0;
const REVIVE = 1;
const activate = `activate ${card}`;
/** The activations of the card on offer, as labels (an Extra Deck monster sent as the cost is written `~`, a target `>`). */
const labels = (duel: Parameters<typeof offered>[0]) => offered(duel).filter((label) => label.startsWith(activate));

describe("The Fallen & The Virtuous, written as effect records", () => {
	it(`${cites("the-fallen-and-the-virtuous", "facts")} ${cites("the-fallen-and-the-virtuous", "archetypes")} is a Quick-Play Spell, always a "Branded" and "Dogmatika" card, mentioning "Fallen of Albaz" and itself`, () => {
		const duel = board6({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "The Fallen & The Virtuous", archetypes: ["Branded", "Dogmatika"], mentions: ["Fallen of Albaz", "The Fallen & The Virtuous"] });
		// In the hand, on the field and in the GY alike.
		for (const place of [{ hand: [card] }, { graveyard: [card] }, { faceupSpells: [card] }]) {
			const there = board6(place);
			expect(belongsTo(there, find(there, card).id, "Branded") && belongsTo(there, find(there, card).id, "Dogmatika")).toBe(true);
		}
	});
	it(`${cites("the-fallen-and-the-virtuous", "notes-not-effect")} the archetypes are not an effect: they hold while the card's effects are negated`, () => {
		const start = board6({ faceupSpells: [card] });
		const negated = negateCardEffects(start, find(start, card).id, start.turn.number);
		expect(negated).not.toBe(start);
		expect(belongsTo(negated, find(negated, card).id, "Branded")).toBe(true);
		expect(belongsTo(negated, find(negated, card).id, "Dogmatika")).toBe(true);
		// The facts are on the definition, not on one of its effect records.
		expect(start.defs[card]!.effects!.every((effect) => !("archetypes" in effect))).toBe(true);
	});

	describe("the choice of an effect", () => {
		it(`${cites("the-fallen-and-the-virtuous", "choose")} ${cites("the-fallen-and-the-virtuous", "notes-mode")} ${cites("the-fallen-and-the-virtuous", "qa-categories-by-mode")} the effect is chosen when the card is activated, and the other one is not applied; only the second counts as an effect that Special Summons, the first does not`, () => {
			const start = board6({ hand: [card], graveyard: ["fixture-ecclesia"], extra: ["fixture-albaz-a"] }, { monsters: ["fixture-filler"], graveyard: ["fixture-big"] });
			expect(effectsOffered(start, card)).toEqual([DESTROY, REVIVE]);
			const destroying = playEffect(start, card, DESTROY, "fixture-filler");
			expect(destroying.chain[0]!).toMatchObject({ effect: DESTROY, categories: ["send-to-graveyard", "destroy"] });
			const reviving = playEffect(start, card, REVIVE, "fixture-big");
			expect(reviving.chain[0]!).toMatchObject({ effect: REVIVE, categories: ["special-summon"] });
			expect(destroying.chain[0]!.categories).not.toContain("special-summon");
			expect(reviving.chain[0]!.categories).not.toContain("destroy");
			// The first effect leaves the GY monsters where they are.
			const done = resolve(destroying);
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-big", "fixture-filler"].sort());
			expect(codes(done, "you", "monster")).toEqual([]);
		});
	});

	describe("the first effect: send, then destroy", () => {
		const start = { hand: [card], extra: ["fixture-albaz-a", "fixture-albaz-b", "fixture-extra-plain"], faceupSpells: ["fixture-ss-spell"], facedown: ["fixture-filler"] };
		it(`${cites("the-fallen-and-the-virtuous", "destroy")} ${cites("the-fallen-and-the-virtuous", "notes-mentions")} sends 1 monster of the Extra Deck whose text names "Fallen of Albaz" as the cost (any other Extra Deck monster is not offered), then destroys a face-up card on the field of either player`, () => {
			const duel = board6(start, { monsters: ["fixture-big"], set: ["fixture-trap"] });
			expect(labels(duel)).toEqual([
				`${activate} ~ fixture-albaz-a > fixture-big`,
				`${activate} ~ fixture-albaz-a > fixture-ss-spell`,
				`${activate} ~ fixture-albaz-b > fixture-big`,
				`${activate} ~ fixture-albaz-b > fixture-ss-spell`,
			]);
			const chained = play(duel, `${activate} ~ fixture-albaz-b > fixture-big`);
			// The cost is paid when the card is activated.
			expect(find(chained, "fixture-albaz-b").zone).toBe("graveyard");
			expect(find(chained, "fixture-albaz-a").zone).toBe("extra");
			const done = resolve(chained);
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(find(done, "fixture-ss-spell").zone).toBe("spell");
			expect(find(done, "fixture-trap").zone).toBe("spell");
		});
		it(`${cites("the-fallen-and-the-virtuous", "notes-mentions")} reads the real Extra Deck card that names "Fallen of Albaz" ("The Dragon that Devours the Dogma"), and not one that does not`, () => {
			const duel = board6({ hand: [card], extra: ["the-dragon-that-devours-the-dogma", "fixture-extra-plain"] }, { monsters: ["fixture-big"] });
			expect(labels(duel)).toEqual([`${activate} ~ the-dragon-that-devours-the-dogma > fixture-big`]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "notes-mentions")} the real "Ecclesia and the Dark Dragon" (its text names "Fallen of Albaz") is a legal cost; once in the Graveyard it is an "Ecclesia" monster for the revival mode, next turn, but not itself a legal target (it was never Summoned properly)`, () => {
			const ecclesia = "ecclesia-and-the-dark-dragon";
			const start = board6({ hand: [card, card], extra: [ecclesia], graveyard: ["fixture-filler"] }, { monsters: ["fixture-big"] });
			expect(new Set(labels(start))).toEqual(new Set([`${activate} ~ ${ecclesia} > fixture-big`]));
			// In the same turn the revival mode is not on offer: no "Ecclesia" monster yet, and one copy a turn.
			expect(effectsOffered(start, card)).toEqual([DESTROY]);
			const done = resolve(play(start, `${activate} ~ ${ecclesia} > fixture-big`));
			expect(find(done, ecclesia)).toMatchObject({ zone: "graveyard", proper: false });
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(effectsOffered(done, card)).toEqual([]);
			// Next turn (the player's own): the second copy's revival mode sees the "Ecclesia" monster in the Graveyard, and offers every monster of either Graveyard but that one.
			const later = nextTurn(done, done.turn.number + 2);
			expect(effectsOffered(later, card)).toEqual([REVIVE]);
			expect(new Set(labels(later))).toEqual(new Set([`${activate} > fixture-big`, `${activate} > fixture-filler`]));
		});
		it(`${cites("the-fallen-and-the-virtuous", "notes-ecclesia")} the real "Ecclesia and the Dark Dragon" face-up in the Monster Zone enables the revival mode; face-down it does not`, () => {
			const ecclesia = "ecclesia-and-the-dark-dragon";
			const up = board6({ hand: [card], monsters: [ecclesia] }, { graveyard: ["fixture-big"] });
			expect(effectsOffered(up, card)).toEqual([REVIVE]);
			expect(labels(up)).toEqual([`${activate} > fixture-big`]);
			expect(effectsOffered(board6({ hand: [card], facedown: [ecclesia] }, { graveyard: ["fixture-big"] }), card)).toEqual([]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "destroy")} cannot be activated with no such monster in the Extra Deck, or with no face-up card to target`, () => {
			expect(effectsOffered(board6({ hand: [card], extra: ["fixture-extra-plain"] }, { monsters: ["fixture-big"] }), card)).toEqual([]);
			expect(effectsOffered(board6({ hand: [card], extra: ["fixture-albaz-a"] }, { set: ["fixture-trap"] }), card)).toEqual([]);
			expect(effectsOffered(board6({ hand: [card], extra: ["fixture-albaz-a"] }, { monsters: ["fixture-big"] }), card)).toEqual([DESTROY]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "destroy")} a monster sent to the GY is a cost, so it is not paid when the Graveyard banishes what is sent`, () => {
			const duel = board6({ hand: [card], extra: ["fixture-albaz-a"] }, { monsters: ["fixture-big"] });
			const banishing = addModifier(duel, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
			expect(effectsOffered(banishing, card)).toEqual([]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "notes-not-itself")} cannot target itself (Set, it is the only face-up card once it is activated: nothing to target)`, () => {
			const alone = board6({ set: [card], extra: ["fixture-albaz-a"] });
			expect(labels(alone)).toEqual([]);
			// With another face-up card, only that card is a target, never this one.
			expect(labels(board6({ set: [card], extra: ["fixture-albaz-a"], monsters: ["fixture-filler"] }))).toEqual([`${activate} ~ fixture-albaz-a > fixture-filler`]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "notes-face-down-target")} destroys a monster that was turned face-down after it was targeted, and only that one`, () => {
			const duel = board6({ hand: [card], extra: ["fixture-albaz-a"] }, { monsters: ["fixture-filler", "fixture-big"], set: ["fixture-flipper"] });
			const chained = play(duel, `${activate} ~ fixture-albaz-a > fixture-filler`);
			const flipped = play(chained, "activate fixture-flipper > fixture-filler");
			expect(flipped.chain).toHaveLength(2);
			const done = resolve(flipped);
			expect(find(done, "fixture-filler").zone).toBe("graveyard");
			expect(find(done, "fixture-big").zone).toBe("monster");
		});
	});

	describe("the second effect: Special Summon from either Graveyard", () => {
		it(`${cites("the-fallen-and-the-virtuous", "revive")} ${cites("the-fallen-and-the-virtuous", "notes-ecclesia")} needs an "Ecclesia" monster in the player's Graveyard or face-up in their Monster Zone (not face-down, not in the other player's field or Graveyard)`, () => {
			const target = { graveyard: ["fixture-big"] };
			expect(effectsOffered(board6({ hand: [card], ...target }), card)).toEqual([]);
			expect(effectsOffered(board6({ hand: [card], graveyard: ["fixture-big", "fixture-ecclesia"] }), card)).toEqual([REVIVE]);
			expect(effectsOffered(board6({ hand: [card], monsters: ["fixture-ecclesia"] }, { graveyard: ["fixture-big"] }), card)).toEqual([REVIVE]);
			expect(effectsOffered(board6({ hand: [card], facedown: ["fixture-ecclesia"] }, { graveyard: ["fixture-big"] }), card)).toEqual([]);
			expect(effectsOffered(board6({ hand: [card] }, { monsters: ["fixture-ecclesia"], graveyard: ["fixture-big", "fixture-ecclesia"] }), card)).toEqual([]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "revive")} targets 1 monster in either Graveyard and Special Summons it to the player's field, in a zone the player chooses`, () => {
			const duel = board6({ hand: [card], graveyard: ["fixture-ecclesia", "fixture-filler", "fixture-trap"] }, { graveyard: ["fixture-big"] });
			expect(labels(duel)).toEqual([`${activate} > fixture-big`, `${activate} > fixture-ecclesia`, `${activate} > fixture-filler`]);
			const asked = resolve(play(duel, `${activate} > fixture-big`));
			expect(offered(asked)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
			const done = play(asked, "place 2");
			expect(find(done, "fixture-big")).toMatchObject({ zone: "monster", controller: "you", slot: 2, face: "up" });
			expect(codes(done, "rival", "graveyard")).toEqual([]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "revive")} cannot Special Summon an Extra Deck monster that was never Summoned properly (one sent there by the first effect), nor a Spell or Trap`, () => {
			const duel = board6({ hand: [card], extra: ["fixture-albaz-a"], graveyard: ["fixture-ecclesia", "fixture-filler"] });
			const sent = moveCard(duel, find(duel, "fixture-albaz-a").id, { zone: "graveyard" });
			expect(labels(sent)).toEqual([`${activate} > fixture-ecclesia`, `${activate} > fixture-filler`]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "revive")} does nothing when the target left the Graveyard before it resolves`, () => {
			const duel = board6({ hand: [card], graveyard: ["fixture-ecclesia", "fixture-big"] });
			const chained = play(duel, `${activate} > fixture-big`);
			// The target is taken out of the Graveyard by the opponent's answer (made as a board change): it is a new card.
			const gone = moveCard(chained, find(chained, "fixture-big").id, { zone: "banished" });
			const done = resolve(gone);
			expect(codes(done, "you", "monster")).toEqual([]);
			expect(find(done, "fixture-big").zone).toBe("banished");
		});
	});

	describe("not in the Damage Step", () => {
		it(`${cites("the-fallen-and-the-virtuous", "notes-no-damage-step")} neither effect is activated in the Damage Step, though both are in the Battle Step before it`, () => {
			const rival = board6({ set: [card], graveyard: ["fixture-ecclesia", "fixture-big"], extra: ["fixture-albaz-a"] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle");
			const declared = play(rival, "attack fixture-filler directly");
			expect(effectsOffered(play(declared, "pass"), card)).toEqual([DESTROY, REVIVE]);
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			expect(effectsOffered(mine, card)).toEqual([]);
		});
	});

	describe("only 1 per turn", () => {
		const two = (extra: object = {}) => board6({ hand: [card, card], graveyard: ["fixture-ecclesia", "fixture-big"], extra: ["fixture-albaz-a", "fixture-albaz-b"], ...extra }, { monsters: ["fixture-filler"], set: ["counter"] });
		it(`${cites("the-fallen-and-the-virtuous", "once")} using one effect leaves neither for the other copies, whichever was used`, () => {
			const first = resolve(playEffect(two(), card, DESTROY, "fixture-filler"));
			expect(first.asking).toBeFalsy();
			expect(all(first, card).filter((entry) => entry.zone === "hand")).toHaveLength(1);
			expect(effectsOffered(first, card)).toEqual([]);
			const second = resolve(playEffect(two(), card, REVIVE, "fixture-big"));
			const placed = second.asking ? play(second, "place 0") : second;
			expect(effectsOffered(placed, card)).toEqual([]);
		});
		it(`${cites("the-fallen-and-the-virtuous", "once")} a negated activation gives the use back (an activation, not an effect, is what is limited)`, () => {
			const negated = resolve(play(playEffect(two(), card, DESTROY, "fixture-filler"), "activate counter"));
			expect(find(negated, "fixture-filler").zone).toBe("monster");
			expect(effectsOffered(negated, card)).toEqual([DESTROY, REVIVE]);
		});
	});
});
