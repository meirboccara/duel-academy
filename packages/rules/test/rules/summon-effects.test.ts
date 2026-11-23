import { describe, expect, it } from "vitest";
import { canBeRevived, canSpecialSummon, cardsIn, cites, type Duel, moveCard, specialSummon } from "../../src";
import { codes, offered, play, position } from "./fixtures";
import { summonCards } from "./summon-fixtures";

/**
 * Step 8: Summons made by card effects. An effect that Special Summons a monster (`specialSummon`) raises `summoned` and opens no
 * window; an effect that performs a Summon (`summonByEffect`: "Synchro Summon using...", "Normal Summon 1 monster") opens the
 * Summon's window when it was Chain Link 1, in either player's turn; and locks on Summons.
 */
function board(spec: Omit<Parameters<typeof position>[0], "defs">): { duel: Duel; log: string[] } {
	const log: string[] = [];
	const duel = position({ ...spec, defs: summonCards(log), rival: { ...spec.rival, faceupSpells: [...(spec.rival?.faceupSpells ?? []), "spy"] } });
	log.length = 0;
	return { duel, log };
}
const monster = (duel: Duel, code: string, side: "you" | "rival" = "you") => cardsIn(duel, side, "monster").find((card) => card.code === code)!;

describe("a monster Special Summoned by an effect", () => {
	it(`${cites("rules", "negate-summon-built-in-only")} ${cites("rules", "special-summon-position")} is Summoned: "when Summoned" effects trigger; the player chooses its position; and no card that negates a Summon can answer`, () => {
		const { duel, log } = board({ options: { everyWindow: true }, you: { hand: ["reborn"], graveyard: ["lv4"] }, rival: { set: ["warning"], monsters: ["summon-watcher"] } });
		const placing = play(duel, "activate reborn > lv4", "pass", "pass");
		expect(offered(placing)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
		const done = play(placing, "place 1");
		expect(monster(done, "lv4")).toMatchObject({ slot: 1, face: "up", position: "attack" });
		// (The spy also sees the listing's dry runs of the Spell being placed: those lines are left out.)
		expect(log.filter((line) => line !== "moved reborn hand>spell")).toEqual(["moved lv4 graveyard>monster", "summoned lv4 special by effect", "moved reborn spell>graveyard"]);
		// The watcher's trigger is on a chain; the rival's "would be Summoned" card is not offered: the monster is already Summoned.
		expect(done.chain.map((link) => link.card.code)).toEqual(["summon-watcher"]);
		expect(done.summoning).toBeNull();
		expect(offered(play(done, "pass"))).toEqual(["pass"]);
	});
	it(`${cites("rules", "revived-extra-to-main")} the public operation Summons to the zone given and does nothing when the monster cannot be Summoned there`, () => {
		const { duel } = board({ you: { monsters: ["lv3"], graveyard: ["lv4"] } });
		const id = duel.piles.you.graveyard[0]!;
		expect(canSpecialSummon(duel, "you", id)).toBe(true);
		expect(specialSummon(duel, "you", id, { slot: 3, position: "defense" }).cards[id]).toMatchObject({ zone: "monster", slot: 3, position: "defense" });
		// Zone 0 is taken, and an Extra Monster Zone is not for a monster from the Graveyard: the duel is returned as it was.
		expect(specialSummon(duel, "you", id, { slot: 0 })).toBe(duel);
		expect(specialSummon(duel, "you", id, { slot: 5 })).toBe(duel);
		// To the other player's field.
		expect(specialSummon(duel, "rival", id).cards[id]).toMatchObject({ zone: "monster", controller: "rival", owner: "you", slot: 0 });
	});
});

describe("properly Summoned", () => {
	it(`${cites("rules", "properly-summoned-first")} a Synchro Monster an effect Special Summons from the Extra Deck was not Synchro Summoned: once in the Graveyard it cannot be Special Summoned from there`, () => {
		const { duel } = board({ you: { extra: ["synchro-5"] } });
		const id = duel.piles.you.extra[0]!;
		const summoned = specialSummon(duel, "you", id);
		expect(summoned.cards[id]).toMatchObject({ zone: "monster", proper: false, summonedBy: null });
		const buried = moveCard(summoned, id, { zone: "graveyard" });
		expect(canBeRevived(buried, id)).toBe(false);
		expect(canSpecialSummon(buried, "you", id)).toBe(false);
		// Back in the Extra Deck and Synchro Summoned for real, it would be: the mark is the Summon's, not the card's.
		expect(canBeRevived(duel, id)).toBe(true);
	});
});

describe("a monster that must first be Summoned by its own procedure", () => {
	it(`${cites("rules", "special-summon-monsters-need-proper")} a Ritual Monster in the hand cannot be Special Summoned by another card's effect, nor Pendulum Summoned`, () => {
		const { duel } = board({ you: { hand: ["hand-summon", "ritual-8", "lv4"], faceupSpells: ["scale-1"] } });
		const ritual = duel.piles.you.hand[1]!;
		expect(canSpecialSummon(duel, "you", ritual)).toBe(false);
		// Only the ordinary monster is a candidate: it is taken without asking.
		expect(codes(play(duel, "activate hand-summon", "place 0"), "you", "monster")).toEqual(["lv4"]);
		expect(offered(board({ you: { hand: ["hand-summon", "ritual-8"] } }).duel)).toEqual(["pass", "set hand-summon"]);
		// Scales 1 and 9 would take a Level 8 monster: the Ritual Monster is not one a Pendulum Summon can Summon.
		const scaled = board({ you: { hand: ["ritual-8", "lv8"], faceupSpells: ["scale-1", "scale-9"] } }).duel;
		const pendulum = play(moveCard(scaled, scaled.piles.you.spell[1]!, { zone: "spell", slot: 4 }), "pendulum-summon");
		expect(offered(pendulum)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
	});
});

describe("an effect that performs a Summon", () => {
	it(`${cites("rules", "summon-by-effect-chain-link-1")} as Chain Link 1: the Synchro Summon is attempted once the chain has resolved, and a card that negates a Summon can answer it`, () => {
		const { duel, log } = board({ you: { monsters: ["quick-tuner", "lv3"], extra: ["synchro-5"] }, rival: { set: ["warning"] } });
		// "Synchro Summon using this card as material": the materials are forced; the zone and position are asked while the effect resolves.
		const placing = play(duel, "activate quick-tuner");
		expect(offered(placing)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4", "place 5", "place 6"]);
		const asked = play(placing, "place 0");
		// The chain is over; the Summon has not succeeded yet, and the rival may negate it.
		expect(asked.chain).toEqual([]);
		expect(asked.summoning).toMatchObject({ cards: [asked.piles.you.extra[0]], kind: "synchro" });
		expect(offered(asked)).toEqual(["activate warning", "pass"]);
		const done = play(asked, "pass");
		expect(monster(done, "synchro-5")).toMatchObject({ slot: 0, proper: true, summonedBy: "synchro" });
		const negated = play(asked, "activate warning");
		expect(codes(negated, "you", "graveyard").sort()).toEqual(["lv3", "quick-tuner", "synchro-5"]);
		expect(log.filter((line) => line.startsWith("summoned"))).toEqual(["summoned synchro-5 special synchro"]);
	});
	it(`${cites("rules", "summon-by-effect-chain-link-2")} from Chain Link 2: the Summon is made while the chain resolves, and cannot be answered`, () => {
		const { duel, log } = board({ you: { hand: ["filler"], monsters: ["quick-tuner", "lv3"], extra: ["synchro-5"] }, rival: { set: ["warning"] } });
		// Your Quick-Play Spell is Chain Link 1, the Tuner's effect Chain Link 2.
		const done = play(duel, "activate filler", "activate quick-tuner", "place 0");
		expect(monster(done, "synchro-5")).toMatchObject({ slot: 0, proper: true });
		// The Synchro Summon happened before Chain Link 1 resolved, and the rival's card was never offered.
		expect(log.indexOf("summoned synchro-5 special synchro")).toBeLessThan(log.indexOf("filler"));
		expect(log).not.toContain("warning");
		expect(done.summoning).toBeNull();
	});
	it(`${cites("rules", "summon-by-effect-chain-link-1")} works on the opponent's turn: a Quick Effect Synchro Summons in the rival's Main Phase`, () => {
		const { duel } = board({ turn: "rival", you: { monsters: ["quick-tuner", "lv3"], extra: ["synchro-5"] } });
		// The turn player passes in the open game state: you may use a fast effect.
		const done = play(duel, "pass", "activate quick-tuner", "place 5");
		expect(done.turn).toMatchObject({ player: "rival", phase: "main1" });
		expect(monster(done, "synchro-5")).toMatchObject({ slot: 5, summonedBy: "synchro" });
	});
	it(`${cites("rules", "tribute-summon-by-effect")} a Normal or Tribute Summon performed by an effect as Chain Link 1 can be answered too, and does not use the turn's Normal Summon`, () => {
		const { duel, log } = board({ you: { hand: ["extra-summon", "lv6", "lv3"], monsters: ["lv4"] }, rival: { set: ["warning"] } });
		// lv3 (no Tribute) or lv6 (Tributing lv4).
		const asked = play(duel, "activate extra-summon");
		expect(offered(asked)).toEqual(["choose lv3", "choose lv6"]);
		const window = play(asked, "choose lv6", "place 0");
		expect(offered(window)).toEqual(["activate warning", "pass"]);
		const done = play(window, "pass");
		expect(monster(done, "lv6")).toMatchObject({ slot: 0, face: "up" });
		expect(log.slice(1)).toEqual(["moved lv4 monster>graveyard tributed", "moved extra-summon spell>graveyard", "moved lv6 hand>monster", "summoned lv6 normal tribute"]);
		// The turn's own Normal Summon is still there.
		expect(offered(done)).toContain("summon lv3");
		expect(codes(play(window, "activate warning"), "you", "graveyard").sort()).toEqual(["extra-summon", "lv4", "lv6"]);
	});
});

describe("a lock on Summons", () => {
	it(`${cites("rules", "summon-lock-stops")} ${cites("rules", "summon-lock-stops-activation")} "cannot Special Summon": no Synchro, Xyz, Link or Pendulum Summon is offered, no effect that could only Special Summon can be activated, and a Normal Summon still is`, () => {
		const spec = { you: { hand: ["lv4", "reborn", "poly", "cyber"], monsters: ["tuner-2", "lv3"], graveyard: ["lv4-b"], extra: ["synchro-5", "link-2", "fusion-many"] } };
		const free = board(spec).duel;
		expect(offered(free)).toEqual(expect.arrayContaining(["special-summon synchro-5", "special-summon link-2", "special-summon cyber", "activate reborn > lv4-b", "activate poly"]));
		const locked = board({ ...spec, rival: { faceupSpells: ["no-special"] } }).duel;
		expect(offered(locked)).toEqual(["change-position lv3", "change-position tuner-2", "pass", "set cyber", "set lv4", "set poly", "set reborn", "summon cyber", "summon lv4"]);
		// The public operation does not Summon either.
		expect(specialSummon(locked, "you", locked.piles.you.graveyard[0]!)).toBe(locked);
	});
	it(`${cites("rules", "summon-lock-stops")} ${cites("rules", "summon-lock-set-allowed")} a lock on some monsters stops their Normal Summon and Flip Summon, not their Set`, () => {
		const { duel } = board({ you: { hand: ["lv4", "lv3"], facedown: ["lv4", "lv2"], faceupSpells: ["no-lv4"] } });
		expect(offered(duel)).toEqual(["flip-summon lv2", "pass", "set lv3", "set lv4", "summon lv3"]);
		// The Set monster of that name can still be moved around by effects, but not Flip Summoned later.
		const set = play(duel, "set lv4");
		expect(codes(set, "you", "monster")).toEqual(["lv4", "lv2", "lv4"]);
		const next = moveCard(set, set.piles.you.spell[0]!, { zone: "graveyard" });
		// With the lock gone, the monster Set on an earlier turn can be Flip Summoned.
		expect(offered(next)).toEqual(["flip-summon lv2", "flip-summon lv4", "pass"]);
	});
});
