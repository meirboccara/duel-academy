import { describe, expect, it } from "vitest";
import { atk, CARD_DEFS, type CardDef, canSpecialSummon, changeControl, cites, type Duel, flipFaceDown, moveCard, printedFacts, specialSummon } from "../../src";
import { battleCards, toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesExtraFixtures, fixtureLog, settle } from "./blue-eyes-extra-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "stardust-sifr-divine-dragon";
const gaps = gapCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...battleCards(),
	...blueEyesFixtures,
	...extraDeckFixtures,
	...blueEyesExtraFixtures,
	...Object.fromEntries(["fixture-smite"].map((code) => [code, gaps[code]!])),
};
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const effect = `activate ${card}`;
/** The rival's turn, `fixture-smite` Set twice for them, the dragon and what `you` adds on the field. */
const theirTurn = (you: SideSpec = {}, rival: SideSpec = {}) => board({ monsters: [card, "fixture-plain-4"], ...you }, { set: ["fixture-smite", "fixture-smite"], ...rival }, { everyWindow: true }, "rival");
/** The rival's Quick-Play Spell destroys `code` (a monster you control), and both pass. */
const smite = (duel: Duel, code: string): Duel => play(duel, `activate fixture-smite > ${code}`, "pass", "pass");
const onField = (duel: Duel, code: string): boolean => find(duel, code).zone === "monster";

describe("Stardust Sifr Divine Dragon, written as effect records", () => {
	it(`${cites("stardust-sifr-divine-dragon", "facts")} is a LIGHT Dragon Synchro Effect Monster of Level 12 with 4000 ATK and 4000 DEF, a "Stardust" monster`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Stardust Sifr Divine Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 12, atk: 4000, def: 4000, archetypes: ["Stardust"] });
	});

	it(`${cites("stardust-sifr-divine-dragon", "procedure")} is Synchro Summoned with 1 Tuner Synchro Monster and 2 or more non-Tuner Synchro Monsters whose Levels add up to 12, sent to the Graveyard`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["fixture-synchro-tuner-4", "fixture-synchro-4", "fixture-synchro-4-b"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		expect(summons(board({ monsters: ["fixture-synchro-tuner-2", "fixture-synchro-2", "fixture-synchro-4", "fixture-synchro-4-b"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		// A Tuner that is not a Synchro Monster, a non-Tuner that is not, only one non-Tuner, a total that is not 12.
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-synchro-4", "fixture-synchro-4-b"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-synchro-tuner-4", "fixture-synchro-4", "fixture-plain-4"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-synchro-tuner-4", "fixture-synchro-4-b", "fixture-synchro-6"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-synchro-tuner-4", "fixture-synchro-4"], extra: [card] }))).toEqual([]);
		const done = play(board({ monsters: ["fixture-synchro-tuner-4", "fixture-synchro-4", "fixture-synchro-4-b"], extra: [card] }), `special-summon ${card}`, "place 5");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-synchro-4", "fixture-synchro-4-b", "fixture-synchro-tuner-4"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
	});

	it(`${cites("stardust-sifr-divine-dragon", "must-synchro")} ${cites("stardust-sifr-divine-dragon", "notes-must-synchro")} ${cites("stardust-sifr-divine-dragon", "qa-spirit-dragon")} can only be Special Summoned by a Synchro Summon: an effect that just Special Summons it from the Extra Deck cannot, "Blue-Eyes Spirit Dragon"'s Tribute effect cannot (Konami's Q&A fid 18150)`, () => {
		const start = board({ hand: ["fixture-extra-call"], extra: [card] });
		expect(canSpecialSummon(start, "you", find(start, card).id)).toBe(false);
		// Properly Summoned once, it still cannot come back from the Graveyard by an effect.
		const summoned = specialSummon(start, "you", find(start, card).id, { kind: "synchro", slot: 5 });
		const buried = moveCard(summoned, find(start, card).id, { zone: "graveyard" });
		expect(canSpecialSummon(buried, "you", find(start, card).id)).toBe(false);
		// "Blue-Eyes Spirit Dragon" Tributes itself: of its two candidates in the Extra Deck, only the other LIGHT Dragon Synchro Monster is Summoned.
		const spirit = board({ extra: ["blue-eyes-spirit-dragon", card, "fixture-synchro-dragon-8"] }, {}, { everyWindow: true });
		const spirited = specialSummon(spirit, "you", find(spirit, "blue-eyes-spirit-dragon").id, { kind: "synchro", slot: 5 });
		const asked = settle(play(spirited, "activate blue-eyes-spirit-dragon"));
		expect(find(asked, "fixture-synchro-dragon-8").zone).toBe("monster");
		expect(find(asked, card).zone).toBe("extra");
	});

	describe("its Continuous Effect", () => {
		it(`${cites("stardust-sifr-divine-dragon", "protect")} ${cites("stardust-sifr-divine-dragon", "notes-protect-field")} ${cites("stardust-sifr-divine-dragon", "qa-protect-everything")} the first time each card its controller controls would be destroyed each turn by a card effect, it is not destroyed: monsters, itself, face-down cards, Spells and Traps; the second time it is`, () => {
			const start = theirTurn({ monsters: [card, "fixture-plain-4"], facedown: ["fixture-plain-5"], set: ["fixture-trap-smite"] });
			const first = smite(start, "fixture-plain-4");
			expect(onField(first, "fixture-plain-4")).toBe(true);
			const second = smite(first, "fixture-plain-4");
			expect(onField(second, "fixture-plain-4")).toBe(false);
			// Itself, and a face-down monster: each has its own first time.
			expect(onField(smite(start, card), card)).toBe(true);
			expect(onField(smite(start, "fixture-plain-5"), "fixture-plain-5")).toBe(true);
			// A Set Spell or Trap Card (destroyed here by "Mystical Space Typhoon"), once.
			const typhoon = board({ monsters: [card], set: ["fixture-trap-smite"] }, { set: ["mystical-space-typhoon", "mystical-space-typhoon"] }, { everyWindow: true }, "rival");
			const once = play(typhoon, "activate mystical-space-typhoon > fixture-trap-smite", "pass", "pass");
			expect(find(once, "fixture-trap-smite").zone).toBe("spell");
			const twice = play(once, "activate mystical-space-typhoon > fixture-trap-smite", "pass", "pass");
			expect(find(twice, "fixture-trap-smite").zone).toBe("graveyard");
		});
		it(`${cites("stardust-sifr-divine-dragon", "protect")} also protects by battle, the first time: the monster survives its destruction by battle, and the damage is still dealt`, () => {
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, turn: "rival", you: { monsters: [card, "small"] }, rival: { monsters: ["big"] } });
			const fought = toStep(play(start, "attack big > small"), null);
			expect(onField(fought, "small")).toBe(true);
			expect(fought.lp.you).toBe(8000 - 1400);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-skill-drain")} is a Continuous Effect: with "Skill Drain" applying it is negated and nothing is protected (Konami's Q&A fid 16066)`, () => {
			const start = theirTurn({ faceupSpells: ["skill-drain"] });
			expect(onField(smite(start, "fixture-plain-4"), "fixture-plain-4")).toBe(false);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-flipped-dragon")} when it is turned face-down and face-up again its effect applies anew, so each card is protected once more (Konami's Q&A fid 16067)`, () => {
			const start = theirTurn({}, { set: ["fixture-smite", "fixture-smite", "fixture-smite"] });
			const first = smite(start, "fixture-plain-4");
			expect(onField(first, "fixture-plain-4")).toBe(true);
			const id = find(first, card).id;
			const flipped = moveCard(flipFaceDown(first, id), id, { zone: "monster", face: "up" });
			const second = smite(flipped, "fixture-plain-4");
			expect(onField(second, "fixture-plain-4")).toBe(true);
			const third = smite(second, "fixture-plain-4");
			expect(onField(third, "fixture-plain-4")).toBe(false);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-flipped-card")} a card protected once that is then turned face-down is not protected again that turn (Konami's Q&A fid 16068)`, () => {
			const start = theirTurn();
			const first = smite(start, "fixture-plain-4");
			const flipped = flipFaceDown(first, find(first, "fixture-plain-4").id);
			expect(find(flipped, "fixture-plain-4")).toMatchObject({ zone: "monster", face: "down" });
			const second = smite(flipped, "fixture-plain-4");
			expect(onField(second, "fixture-plain-4")).toBe(false);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-two-dragons")} with two of them, each card is still protected only once a turn (Konami's Q&A fid 16069)`, () => {
			const start = theirTurn({ monsters: [card, card, "fixture-plain-4"] });
			const first = smite(start, "fixture-plain-4");
			expect(onField(first, "fixture-plain-4")).toBe(true);
			const second = smite(first, "fixture-plain-4");
			expect(onField(second, "fixture-plain-4")).toBe(false);
		});
		// The use is each dragon's own: fid 16069 has both effects applied to the first destruction (so both are used), and fid 16067 has an effect that
		// applies anew protect once more. No Konami page read speaks of a second dragon that arrives later, or of a control change: the two tests below follow from those Q&A, and
		// YGOProJudge agreed once shown them (asked 2026-11-25; its first answer, with no source, was the opposite).
		it(`${cites("stardust-sifr-divine-dragon", "qa-two-dragons")} ${cites("stardust-sifr-divine-dragon", "qa-flipped-dragon")} a second dragon Summoned after a card was protected applies its own effect, not yet applied to that card this turn: the card is protected once more, then destroyed`, () => {
			const start = theirTurn({ extra: [card] }, { set: ["fixture-smite", "fixture-smite", "fixture-smite"] });
			const first = smite(start, "fixture-plain-4");
			expect(onField(first, "fixture-plain-4")).toBe(true);
			const late = specialSummon(first, "you", first.piles.you.extra[0]!, { kind: "synchro" });
			expect(codes(late, "you", "monster").filter((code) => code === card)).toHaveLength(2);
			const second = smite(late, "fixture-plain-4");
			expect(onField(second, "fixture-plain-4")).toBe(true);
			expect(onField(smite(second, "fixture-plain-4"), "fixture-plain-4")).toBe(false);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-two-dragons")} ${cites("stardust-sifr-divine-dragon", "qa-flipped-dragon")} a card protected once whose control then passes to a player with a dragon of their own is protected once by that dragon`, () => {
			const start = board({ monsters: [card, "fixture-plain-4"], set: ["fixture-smite", "fixture-smite"] }, { monsters: [card], set: ["fixture-smite"] }, { everyWindow: true }, "rival");
			const first = smite(start, "fixture-plain-4");
			expect(onField(first, "fixture-plain-4")).toBe(true);
			const taken = changeControl(first, find(first, "fixture-plain-4").id, "rival");
			expect(find(taken, "fixture-plain-4")).toMatchObject({ zone: "monster", controller: "rival" });
			const mine: Duel = { ...taken, turn: { ...taken.turn, player: "you" }, priority: { holder: "you", passed: [], open: true } };
			const second = smite(mine, "fixture-plain-4");
			expect(onField(second, "fixture-plain-4")).toBe(true);
			expect(onField(smite(second, "fixture-plain-4"), "fixture-plain-4")).toBe(false);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-negate-and-destroy")} does not protect a Spell or Trap Card whose activation is negated and which is destroyed with it, as that is not a destruction of a card on the field (Konami's Q&A fid 23488)`, () => {
			const start = board({ monsters: [card], set: ["fixture-trap-smite"] }, { monsters: ["fixture-plain-4"], set: ["solemn-judgment"] }, { everyWindow: true });
			const activated = play(start, "activate fixture-trap-smite > fixture-plain-4", "activate solemn-judgment");
			const done = settle(activated);
			expect(codes(done, "you", "graveyard")).toEqual(["fixture-trap-smite"]);
			expect(codes(done, "rival", "monster")).toEqual(["fixture-plain-4"]);
		});
	});

	describe("its negation", () => {
		const aimer = (rival: SideSpec = {}) => theirTurn({}, rival);
		it(`${cites("stardust-sifr-divine-dragon", "negate")} ${cites("stardust-sifr-divine-dragon", "notes-negate-quick")} ${cites("stardust-sifr-divine-dragon", "notes-negate-direct-chain")} ${cites("stardust-sifr-divine-dragon", "notes-negate-resolution")} when the opponent activates a monster effect, negates that effect and destroys 1 card on the field of the player's choice`, () => {
			fixtureLog.length = 0;
			const start = aimer({ monsters: ["fixture-field-quick-a", "fixture-plain-5"] });
			const activated = play(start, "activate fixture-field-quick-a");
			expect(own(activated, effect)).toEqual([effect]);
			const answered = play(activated, effect, "pass", "pass");
			// Every card on the field is a choice, either side's, face-up or not.
			expect([...new Set(offered(answered))].sort()).toEqual(["choose fixture-field-quick-a", "choose fixture-plain-4", "choose fixture-plain-5", "choose fixture-smite", `choose ${card}`].sort());
			expect(offered(answered).filter((label) => label === "choose fixture-smite")).toHaveLength(2);
			const done = settle(play(answered, "choose fixture-plain-5"));
			expect(fixtureLog).toEqual([]);
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-plain-5"]);
			expect(codes(done, "rival", "monster")).toEqual(["fixture-field-quick-a"]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-hand-graveyard")} also negates an effect the opponent activated in the hand or in the Graveyard (Konami's Q&A fid 16064)`, () => {
			const hand = play(aimer({ hand: ["fixture-hand-quick"] }), "activate fixture-hand-quick");
			expect(own(hand, effect)).toEqual([effect]);
			const graveyard = play(aimer({ graveyard: ["fixture-gy-ignition"] }), "activate fixture-gy-ignition");
			expect(own(graveyard, effect)).toEqual([effect]);
			fixtureLog.length = 0;
			settle(play(play(graveyard, effect, "pass", "pass"), `choose ${card}`));
			expect(fixtureLog).toEqual([]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-hand-graveyard")} must choose itself when it is the only card on the field (Konami's Q&A fid 16064), and the protection then spares it`, () => {
			const start = board({ monsters: [card] }, { hand: ["fixture-hand-quick"] }, { everyWindow: true }, "rival");
			const activated = play(start, "activate fixture-hand-quick");
			const asked = play(activated, effect, "pass", "pass");
			// Nothing to choose: it is the only card on the field.
			expect(offered(asked).some((label) => label.startsWith("choose"))).toBe(false);
			const done = settle(asked);
			expect(find(done, card).zone).toBe("monster");
			expect(done.spared).toHaveLength(1);
		});
		it(`${cites("stardust-sifr-divine-dragon", "negate")} is not offered against the effect of a Spell or Trap Card, or one of its controller's own effects`, () => {
			const spell = play(aimer({ hand: ["fixture-normal-spell"] }), "activate fixture-normal-spell");
			expect(own(spell, effect)).toEqual([]);
			const mine = board({ monsters: [card, "fixture-field-quick-a"] }, { monsters: ["fixture-plain-5"] }, { everyWindow: true });
			expect(own(play(mine, "activate fixture-field-quick-a"), effect)).toEqual([]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-negate-one-link")} negates that Chain Link's effect only, not the other effects of the card (Konami's Q&A fid 16063)`, () => {
			fixtureLog.length = 0;
			const start = aimer({ monsters: ["fixture-boss", "fixture-plain-5"] });
			const boss = find(start, "fixture-boss");
			expect(atk(start, boss.id)).toBe(1500);
			const done = settle(play(play(play(start, "activate fixture-boss"), effect, "pass", "pass"), "choose fixture-plain-5"));
			expect(fixtureLog).toEqual([]);
			expect(atk(done, boss.id)).toBe(1500);
			// Its Quick Effect still works afterwards (another turn is not needed: the effect is not negated).
			expect(own(done, "activate fixture-boss")).toEqual(["activate fixture-boss"]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "once")} can be used once per turn`, () => {
			const start = aimer({ monsters: ["fixture-field-quick-a", "fixture-field-quick-b", "fixture-plain-5"] });
			const first = settle(play(play(play(start, "activate fixture-field-quick-a"), effect, "pass", "pass"), "choose fixture-plain-5"));
			const second = play(first, "activate fixture-field-quick-b");
			expect(own(second, effect)).toEqual([]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "notes-negate-no-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = position({ defs, phase: "battle", options: { everyWindow: true }, you: { monsters: ["huge", card] }, rival: { monsters: ["big", "pump"] } });
			const inStep = toStep(play(start, "attack huge > big"), "start");
			const rivalActs = play(inStep, "pass");
			expect(rivalActs.priority.holder).toBe("rival");
			const pumped = play(rivalActs, "activate pump");
			expect(pumped.chain.map((link) => link.card.code)).toEqual(["pump"]);
			expect(own(pumped, effect)).toEqual([]);
		});
	});

	describe("its Special Summon from the Graveyard", () => {
		const graveyardBoard = (you: SideSpec = {}) => board({ graveyard: [card, "fixture-stardust-8", "fixture-stardust-4", "fixture-stardust-9", "fixture-plain-8-wind"], ...you }, {}, { everyWindow: true });
		it(`${cites("stardust-sifr-divine-dragon", "revive")} ${cites("stardust-sifr-divine-dragon", "notes-revive-ignition")} banishes itself from the Graveyard, targets 1 Level 8 or lower "Stardust" monster in the Graveyard and Special Summons it, in its controller's Main Phase`, () => {
			const duel = graveyardBoard();
			// Level 9 and a monster that is not "Stardust" are left out.
			expect(own(duel, effect)).toEqual([`${effect} > fixture-stardust-4`, `${effect} > fixture-stardust-8`]);
			const done = settle(play(duel, `${effect} > fixture-stardust-8`));
			expect(find(done, card).zone).toBe("banished");
			expect(find(done, "fixture-stardust-8")).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
			// Not in the opponent's turn.
			const theirTurn = board({ graveyard: [card, "fixture-stardust-8"] }, { monsters: ["fixture-field-quick-a"] }, { everyWindow: true }, "rival");
			expect(own(play(theirTurn, "activate fixture-field-quick-a"), effect)).toEqual([]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "notes-revive-synchro")} a Synchro Monster can be the target only if it was Synchro Summoned before`, () => {
			const start = board({ extra: ["fixture-stardust-synchro-8"], graveyard: [card] });
			const never = moveCard(start, find(start, "fixture-stardust-synchro-8").id, { zone: "graveyard" });
			expect(own(never, effect)).toEqual([]);
			const summoned = specialSummon(start, "you", find(start, "fixture-stardust-synchro-8").id, { kind: "synchro", slot: 5 });
			const buried = moveCard(summoned, find(start, "fixture-stardust-synchro-8").id, { zone: "graveyard" });
			expect(own(buried, effect)).toEqual([`${effect} > fixture-stardust-synchro-8`]);
			expect(find(settle(play(buried, `${effect} > fixture-stardust-synchro-8`)), "fixture-stardust-synchro-8").zone).toBe("monster");
		});
		it(`${cites("stardust-sifr-divine-dragon", "qa-target-gone")} the target that is no longer in the Graveyard when it resolves is not Special Summoned (Konami's Q&A fid 16060)`, () => {
			const duel = graveyardBoard();
			const activated = play(duel, `${effect} > fixture-stardust-8`);
			const gone = moveCard(activated, find(activated, "fixture-stardust-8").id, { zone: "banished" });
			const done = settle(gone);
			expect(find(done, "fixture-stardust-8").zone).toBe("banished");
			expect(codes(done, "you", "monster")).toEqual([]);
		});
		it(`${cites("stardust-sifr-divine-dragon", "revive")} is not offered with no Level 8 or lower "Stardust" monster in the Graveyard`, () => {
			expect(own(board({ graveyard: [card, "fixture-stardust-9", "fixture-plain-8-wind"] }), effect)).toEqual([]);
			expect(own(board({ hand: [card], graveyard: ["fixture-stardust-8"] }), effect)).toEqual([]);
		});
	});
});
