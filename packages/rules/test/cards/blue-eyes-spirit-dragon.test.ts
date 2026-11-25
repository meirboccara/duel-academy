import { describe, expect, it } from "vitest";
import { belongsTo, CARD_DEFS, type CardDef, cites, type Duel, printedFacts } from "../../src";
import { battleCards, toStep } from "../rules/battle-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { summonExtrasCards } from "../rules/summon-extras-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { blueEyesExtraFixtures, fixtureLog, returnedFromBanishment, settle, toPhase } from "./blue-eyes-extra-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";
import { flipFaceDown, moveCard, specialSummon } from "../../src";

const card = "blue-eyes-spirit-dragon";
const extras = summonExtrasCards();
const gaps = gapCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...battleCards(),
	...blueEyesFixtures,
	...extraDeckFixtures,
	...blueEyesExtraFixtures,
	...Object.fromEntries(["fixture-twin-call", "fixture-ace-a", "fixture-ace-b"].map((code) => [code, extras[code]!])),
	"fixture-crow": gaps["fixture-crow"]!,
};
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const effect = `activate ${card}`;
/** Blue-Eyes Spirit Dragon Synchro Summoned (Effect Veiler, a Level 1 Tuner, and Blue-Eyes White Dragon, Level 8), the Summon having succeeded. */
const summoned = (you: SideSpec = {}, rival: SideSpec = {}, options = { everyWindow: true }, turn: "you" | "rival" = "you"): Duel =>
	play(board({ monsters: ["effect-veiler", "blue-eyes-white-dragon"], extra: [card], ...you }, rival, options, turn), `special-summon ${card}`, "place 5", "pass", "pass");
const lightDragons = ["fixture-synchro-dragon-8", "fixture-synchro-dragon-8-b"];

describe("Blue-Eyes Spirit Dragon, written as effect records", () => {
	it(`${cites("blue-eyes-spirit-dragon", "facts")} is a LIGHT Dragon Synchro Effect Monster of Level 9 with 2500 ATK and 3000 DEF, that mentions itself`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Blue-Eyes Spirit Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 9, atk: 2500, def: 3000, archetypes: ["Blue-Eyes"], mentions: ["Blue-Eyes Spirit Dragon"] });
	});

	it(`${cites("blue-eyes-spirit-dragon", "notes-archetype")} is a "Blue-Eyes" monster`, () => {
		const duel = board({ extra: [card] });
		expect(belongsTo(duel, find(duel, card).id, "Blue-Eyes")).toBe(true);
	});

	it(`${cites("blue-eyes-spirit-dragon", "procedure")} is Synchro Summoned with 1 Tuner and 1 or more non-Tuner "Blue-Eyes" monsters whose Levels add up to 9, sent to the Graveyard`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["effect-veiler", "blue-eyes-white-dragon"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-blue-eyes-small", "fixture-blue-eyes-small"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		// A non-Tuner that is not a "Blue-Eyes" monster, two Tuners, no Tuner, a total that is not 9.
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-other-dragon"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-blue-eyes-small", "fixture-other-dragon"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-tuner-5"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-blue-eyes-effect", "fixture-blue-eyes-normal"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-2", "fixture-blue-eyes-effect"], extra: [card] }))).toEqual([]);
		const done = summoned();
		expect(codes(done, "you", "graveyard").sort()).toEqual(["blue-eyes-white-dragon", "effect-veiler"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
	});

	describe("its Continuous Effect", () => {
		const twin = { hand: ["fixture-twin-call", "fixture-ace-a", "fixture-ace-b"] };
		const twins = (duel: Duel) => offered(duel).filter((label) => label.startsWith("activate fixture-twin-call"));
		it(`${cites("blue-eyes-spirit-dragon", "lock")} ${cites("blue-eyes-spirit-dragon", "notes-lock-field")} stops both players from Special Summoning 2 or more monsters at the same time while it is face-up in the Monster Zone`, () => {
			expect(twins(board(twin))).toEqual(["activate fixture-twin-call"]);
			// Its controller, and the other player, are both stopped; one monster at a time is not.
			expect(twins(board({ ...twin, monsters: [card] }))).toEqual([]);
			expect(twins(board(twin, { monsters: [card] }))).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "notes-lock-field")} does not apply in the Extra Deck, the Graveyard or the hand, or face-down`, () => {
			expect(twins(board({ ...twin, extra: [card] }))).toEqual(["activate fixture-twin-call"]);
			expect(twins(board({ ...twin, graveyard: [card] }))).toEqual(["activate fixture-twin-call"]);
			expect(twins(board({ hand: [...twin.hand, card] }))).toEqual(["activate fixture-twin-call"]);
			expect(twins(board({ ...twin, facedown: [card] }))).toEqual(["activate fixture-twin-call"]);
		});
	});

	describe("its negation", () => {
		const rivalTurn = (you: SideSpec = {}, rival: SideSpec = {}) => board({ monsters: [card], ...you }, rival, { everyWindow: true }, "rival");
		const negates = (duel: Duel) => own(duel, effect);
		it(`${cites("blue-eyes-spirit-dragon", "negate")} ${cites("blue-eyes-spirit-dragon", "notes-negate-quick")} ${cites("blue-eyes-spirit-dragon", "notes-negate-direct-chain")} negates the activation of an effect of a card in the GY, chained to it`, () => {
			fixtureLog.length = 0;
			const start = rivalTurn({}, { graveyard: ["fixture-gy-ignition"] });
			const activated = play(start, "activate fixture-gy-ignition");
			expect(activated.chain.map((link) => link.card.code)).toEqual(["fixture-gy-ignition"]);
			expect(negates(activated)).toEqual([effect]);
			const done = settle(play(activated, effect));
			expect(fixtureLog).toEqual([]);
			expect(done.chain).toEqual([]);
			// Left alone, the effect is applied.
			const unanswered = play(play(start, "activate fixture-gy-ignition"), "pass", "pass");
			expect(fixtureLog).toEqual(["gy-ignition"]);
			expect(unanswered.chain).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "negate")} answers an effect of the Graveyard of either player, and the effect of a Spell Card there`, () => {
			// Its own controller's Graveyard.
			const mineTurn = board({ monsters: [card], graveyard: ["fixture-gy-ignition"] }, {}, { everyWindow: true });
			const mine = play(mineTurn, "activate fixture-gy-ignition", "pass");
			expect(negates(mine)).toEqual([effect]);
			// A Spell Card's Quick Effect in the Graveyard.
			const spell = play(rivalTurn({}, { graveyard: ["fixture-gy-spell"] }), "activate fixture-gy-spell");
			expect(negates(spell)).toEqual([effect]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "qa-gy-cost")} also answers a Graveyard effect whose cost banishes its own card, which was in the Graveyard when it was activated (Konami's Q&A fid 18175)`, () => {
			fixtureLog.length = 0;
			const activated = play(rivalTurn({}, { graveyard: ["fixture-gy-banisher"] }), "activate fixture-gy-banisher");
			expect(codes(activated, "rival", "banished")).toEqual(["fixture-gy-banisher"]);
			expect(negates(activated)).toEqual([effect]);
			settle(play(activated, effect));
			expect(fixtureLog).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "qa-negation-still-applies")} the negation applies although the card whose effect was activated is no longer in the Graveyard when it resolves (Konami's Q&A fid 18172)`, () => {
			fixtureLog.length = 0;
			const start = rivalTurn({}, { graveyard: ["fixture-gy-ignition"], set: ["fixture-crow"] });
			const negated = play(play(start, "activate fixture-gy-ignition"), effect);
			// The opponent answers by banishing the card from the Graveyard before the negation resolves.
			const banished = play(negated, "activate fixture-crow > fixture-gy-ignition");
			const done = settle(banished);
			expect(codes(done, "rival", "banished")).toEqual(["fixture-gy-ignition"]);
			expect(fixtureLog).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "qa-true-light")} answers the Trigger Effect of a card sent to the Graveyard, such as "True Light" destroyed on the field: the monsters it would destroy stay (Konami's Q&A fid 24155)`, () => {
			const start = rivalTurn({ faceupSpells: ["true-light"], monsters: [card, "fixture-plain-4"] }, { set: ["mystical-space-typhoon"] });
			const destroyed = play(start, "activate mystical-space-typhoon > true-light", "pass", "pass");
			expect(find(destroyed, "true-light").zone).toBe("graveyard");
			// The Trigger Effect of "True Light" is on the Chain: the opponent is asked first, and passes; then the Quick Effect can be chained to it.
			expect(destroyed.chain.map((link) => [link.card.code, link.card.zone])).toEqual([["true-light", "graveyard"]]);
			const window = play(destroyed, "pass");
			expect(negates(window)).toEqual([effect]);
			const done = settle(play(window, effect));
			expect(codes(done, "you", "monster").sort()).toEqual(["fixture-plain-4", card].sort());
		});
		it(`${cites("blue-eyes-spirit-dragon", "negate")} is not offered against an effect activated from the hand or on the field`, () => {
			expect(negates(play(rivalTurn({}, { hand: ["fixture-hand-quick"] }), "activate fixture-hand-quick"))).toEqual([]);
			expect(negates(play(rivalTurn({}, { monsters: ["fixture-field-ignition"] }), "activate fixture-field-ignition"))).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "notes-negate-direct-chain")} can only be chained directly to the effect of a card in the GY: not once another Chain Link is on it`, () => {
			const start = rivalTurn({ monsters: [card, "fixture-field-quick-a"] }, { graveyard: ["fixture-gy-ignition"], monsters: ["fixture-field-quick-b"] });
			const first = play(start, "activate fixture-gy-ignition");
			expect(negates(first)).toEqual([effect]);
			const covered = play(play(first, "activate fixture-field-quick-a"), "activate fixture-field-quick-b");
			expect(covered.chain.map((link) => link.card.code)).toEqual(["fixture-gy-ignition", "fixture-field-quick-a", "fixture-field-quick-b"]);
			expect(covered.priority.holder).toBe("you");
			expect(negates(covered)).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "negate")} can be used once per turn`, () => {
			fixtureLog.length = 0;
			const start = rivalTurn({ monsters: [card, "fixture-field-quick-a"] }, { graveyard: ["fixture-gy-ignition", "fixture-gy-spell"] });
			const done = settle(play(play(start, "activate fixture-gy-ignition"), effect));
			expect(fixtureLog).toEqual([]);
			expect(find(done, card).zone).toBe("monster");
			const second = play(done, "activate fixture-gy-spell");
			expect(negates(second)).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "notes-negate-damage-step")} can also be activated in the Damage Step`, () => {
			fixtureLog.length = 0;
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: ["huge", card] }, rival: { monsters: ["big"], graveyard: ["fixture-gy-effect-before"] } });
			const before = toStep(play(start, "attack huge > big"), "before");
			expect(before.chain.map((link) => link.card.code)).toEqual(["fixture-gy-effect-before"]);
			expect(before.priority.holder).toBe("you");
			expect(negates(before)).toEqual([effect]);
			toStep(play(before, effect), null);
			expect(fixtureLog).toEqual([]);
		});
	});

	describe("its Tribute effect", () => {
		const fresh = (you: SideSpec = {}, rival: SideSpec = {}) => summoned({ extra: [card, ...lightDragons], ...you }, rival, { everyWindow: true });
		it(`${cites("blue-eyes-spirit-dragon", "tribute")} ${cites("blue-eyes-spirit-dragon", "notes-tribute-quick")} Tributes this Synchro Summoned card to Special Summon a LIGHT Dragon Synchro Monster from the Extra Deck in Defense Position, in either player's turn`, () => {
			const duel = fresh();
			expect(own(duel, effect)).toEqual([effect]);
			const paid = play(duel, effect);
			expect(codes(paid, "you", "graveyard")).toContain(card);
			const asked = play(paid, "pass", "pass");
			expect(offered(asked)).toEqual(["choose fixture-synchro-dragon-8", "choose fixture-synchro-dragon-8-b"]);
			const chosen = play(asked, "choose fixture-synchro-dragon-8-b");
			expect(offered(chosen).every((label) => label.startsWith("place"))).toBe(true);
			const done = play(chosen, offered(chosen)[0]!);
			expect(find(done, "fixture-synchro-dragon-8-b")).toMatchObject({ zone: "monster", face: "up", position: "defense" });
			expect(codes(done, "you", "graveyard")).toContain(card);
			// In the opponent's turn too (it is a Quick Effect): once the opponent acts, the effect is offered in the window they leave.
			const theirs = toPhase(fresh({}, { monsters: ["fixture-field-ignition"] }), "end");
			let turn = theirs;
			for (let guard = 0; guard < 40 && !(turn.turn.player === "rival" && turn.turn.phase === "main1" && turn.priority.open && turn.priority.holder === "rival"); guard++) turn = play(turn, "pass");
			expect(turn.turn.player).toBe("rival");
			const acted = play(turn, "activate fixture-field-ignition");
			expect(own(acted, effect)).toEqual([effect]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "tribute")} Summons only a LIGHT Dragon Synchro Monster, other than "Blue-Eyes Spirit Dragon"`, () => {
			const extra = [card, card, "fixture-synchro-warrior-8", "fixture-dark-synchro-dragon", "fixture-light-fusion-dragon", "fixture-light-xyz-dragon", "fixture-synchro-dragon-7"];
			const asked = play(fresh({ extra }), effect, "pass", "pass");
			// The other copy of Blue-Eyes Spirit Dragon (a LIGHT Dragon Synchro Monster) is left out: only one monster is left to Summon, so none is asked for.
			expect(offered(asked).every((label) => label.startsWith("place"))).toBe(true);
			const placed = play(asked, offered(asked)[0]!);
			expect(codes(placed, "you", "monster")).toContain("fixture-synchro-dragon-7");
			expect(find(placed, card).zone).toBe("graveyard");
			expect(codes(placed, "you", "extra").sort()).toEqual([card, "fixture-dark-synchro-dragon", "fixture-light-fusion-dragon", "fixture-light-xyz-dragon", "fixture-synchro-warrior-8"]);
			// With no such monster the effect is not activated.
			expect(own(fresh({ extra: [card, card, "fixture-synchro-warrior-8", "fixture-dark-synchro-dragon", "fixture-light-fusion-dragon"] }), effect)).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "tribute")} is activated with the zone the Tribute frees: with every Main Monster Zone taken, it is Summoned in the Extra Monster Zone`, () => {
			const fill = summoned({ extra: [card, ...lightDragons], hand: ["fixture-plain-4", "fixture-plain-5"], monsters: ["effect-veiler", "blue-eyes-white-dragon", "fixture-plain-1", "fixture-plain-2", "fixture-plain-3"] });
			const full = ["fixture-plain-4", "fixture-plain-5"].reduce((duel, code) => moveCard(duel, find(duel, code).id, { zone: "monster", face: "up" }), fill);
			expect(codes(full, "you", "monster")).toHaveLength(6);
			expect(find(full, card)).toMatchObject({ zone: "monster", slot: 5 });
			expect(own(full, effect)).toEqual([effect]);
			const done = settle(play(full, effect));
			expect(find(done, "fixture-synchro-dragon-8")).toMatchObject({ zone: "monster", slot: 5, position: "defense" });
		});
		it(`${cites("blue-eyes-spirit-dragon", "tribute")} destroys the monster during the End Phase of this turn`, () => {
			const summonedIn = settle(play(fresh(), effect));
			const monster = find(summonedIn, "fixture-synchro-dragon-8");
			expect(monster.zone).toBe("monster");
			expect(summonedIn.delayed).toHaveLength(1);
			const end = toPhase(summonedIn, "end");
			expect(codes(end, "you", "monster")).toContain("fixture-synchro-dragon-8");
			expect(offered(end)).toEqual(["apply blue-eyes-spirit-dragon"]);
			const applied = play(end, "apply blue-eyes-spirit-dragon");
			expect(codes(applied, "you", "monster")).not.toContain("fixture-synchro-dragon-8");
			expect(codes(applied, "you", "graveyard")).toContain("fixture-synchro-dragon-8");
			expect(applied.chain).toEqual([]);
			// Destroyed by this card's effect (the card as it was).
			expect(applied.live.find((event) => event.type === "moved" && event.reason === "destroyed")).toMatchObject({ destruction: { cause: "effect", source: { code: card }, player: "you" } });
		});
		it(`${cites("blue-eyes-spirit-dragon", "tribute")} destroys nothing if the monster has left the field and come back as another card`, () => {
			const summonedIn = settle(play(fresh(), effect));
			const gone = moveCard(moveCard(summonedIn, find(summonedIn, "fixture-synchro-dragon-8").id, { zone: "graveyard" }), find(summonedIn, "fixture-synchro-dragon-8").id, { zone: "banished" });
			const end = toPhase(gone, "end");
			expect(offered(end)).toEqual(["pass"]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "notes-tribute-no-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: ["huge"], extra: [card, ...lightDragons] }, rival: { monsters: ["big"] } });
			// Synchro Summoned by its procedure (the Summon itself is not the point: the Battle Phase is).
			const synchro = specialSummon(start, "you", find(start, card).id, { kind: "synchro", slot: 5 });
			expect(find(synchro, card)).toMatchObject({ zone: "monster", summonedBy: "synchro" });
			const declared = play(synchro, "attack huge > big");
			expect(own(declared, effect)).toEqual([effect]);
			const inStep = toStep(declared, "start");
			expect(inStep.battle?.step).toBe("start");
			expect(own(inStep, effect)).toEqual([]);
			expect(own(toStep(inStep, "before"), effect)).toEqual([]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "notes-tribute-after-face-down")} ${cites("blue-eyes-spirit-dragon", "notes-tribute-after-banish")} ${cites("blue-eyes-spirit-dragon", "qa-synchro-flipped")} is still "Synchro Summoned" after being turned face-down and back face-up, or banished temporarily and returned`, () => {
			const base = fresh();
			const id = find(base, card).id;
			const flipped = moveCard(flipFaceDown(base, id), id, { zone: "monster", face: "up" });
			expect(find(flipped, card)).toMatchObject({ face: "up", summonedBy: "synchro" });
			expect(own(flipped, effect)).toEqual([effect]);
			const back = returnedFromBanishment(base, id);
			expect(find(back, card)).toMatchObject({ zone: "monster", face: "up", summonedBy: "synchro" });
			expect(own(back, effect)).toEqual([effect]);
		});
		it(`${cites("blue-eyes-spirit-dragon", "notes-tribute-not-from-graveyard")} cannot be activated by a card that was Special Summoned from the GY, or that is on the field without having been Synchro Summoned`, () => {
			// Not Synchro Summoned: put on the field by an effect that Special Summons it from the Extra Deck.
			expect(own(board({ monsters: [card], extra: [...lightDragons] }, {}, { everyWindow: true }), effect)).toEqual([]);
			// Synchro Summoned, sent to the GY, then Special Summoned from there.
			const base = fresh({ hand: ["fixture-grave-call"] });
			const sent = moveCard(base, find(base, card).id, { zone: "graveyard" });
			const revived = settle(play(sent, "activate fixture-grave-call"));
			expect(find(revived, card)).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
			expect(own(revived, effect)).toEqual([]);
		});
	});
});
