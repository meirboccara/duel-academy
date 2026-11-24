import { describe, expect, it } from "vitest";
import { ask, askSpecialSummon, banishWhenItLeaves, CARD_DEFS, type CardDef, cites, type Duel, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "lightstorm-dragon";
const gaps = gapCards();
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...extraDeckFixtures,
	...Object.fromEntries(["fixture-smite", "fixture-bury", "fixture-giant"].map((code) => [code, gaps[code]!])),
	// A Spell: "Special Summon 1 monster from your Extra Deck" (not a Synchro Summon).
	"fixture-extra-revive": { code: "fixture-extra-revive", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].extra, (board, picked) => askSpecialSummon(board, link.player, picked)) }] },
	// A Quick-Play Spell that changes ATK (so it can be activated in the Damage Step) and Special Summons 1 monster from the Extra Deck.
	"fixture-rush-summon": {
		code: "fixture-rush-summon",
		kind: "quick-play",
		effects: [{ type: "activation", categories: ["change-atk", "special-summon"], operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].extra, (board, picked) => askSpecialSummon(board, link.player, picked)) }],
	},
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const mine = (duel: Duel): Duel => (duel.priority.holder === "you" ? duel : play(duel, "pass"));
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
/** Passes until the player is offered `label` (at most a few windows). */
const untilOffered = (duel: Duel, label: string): Duel => {
	let next = duel;
	for (let guard = 0; guard < 14 && !(next.priority.holder === "you" && offered(next).some((entry) => entry.startsWith(label))); guard++) next = play(next, "pass");
	return next;
};
const effect = `activate ${card}`;
/** Lightstorm Dragon Special Summoned from the Extra Deck by an effect, the Summon having succeeded. */
const summoned = (you: SideSpec = {}, rival: SideSpec = {}): Duel => settle(play(board({ hand: ["fixture-extra-revive"], extra: [card], ...you }, rival, { everyWindow: true }), "activate fixture-extra-revive"));
const spellsOnField = { faceupSpells: ["fixture-crimson-spell", "fixture-crimson-trap"] };

describe("Lightstorm Dragon, written as effect records", () => {
	it(`${cites("lightstorm-dragon", "facts")} is a LIGHT Dragon Synchro Effect Monster of Level 9 with 2700 ATK and 3000 DEF, that mentions itself`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Lightstorm Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 9, atk: 2700, def: 3000, mentions: ["Lightstorm Dragon"] });
	});

	it(`${cites("lightstorm-dragon", "procedure")} is Synchro Summoned with 1 Tuner and 1 or more non-Tuner monsters whose Levels add up to 9, sent to the Graveyard`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-plain-5"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-plain-4", "fixture-plain-4"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-tuner-1", "fixture-plain-4"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-plain-4", "fixture-plain-5"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-plain-6"], extra: [card] }))).toEqual([]);
		const done = play(board({ monsters: ["fixture-tuner-4", "fixture-plain-5"], extra: [card] }), `special-summon ${card}`, "place 5");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-plain-5", "fixture-tuner-4"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
	});

	describe("its destroying effect", () => {
		it(`${cites("lightstorm-dragon", "destroy")} ${cites("lightstorm-dragon", "notes-destroy-field")} targets Spells/Traps on the field, up to the number of Normal Monsters in the player's GY +1, and destroys them: an optional Trigger Effect when it is Special Summoned`, () => {
			// Two Normal Monsters in the GY: up to 3 targets; the Effect Monster and the opponent's Normal Monster do not count.
			const duel = summoned({ ...spellsOnField, graveyard: ["fixture-plain-1", "fixture-plain-2", "fixture-effect-4"] }, { set: ["fixture-other-spell"], graveyard: ["fixture-plain-3"] });
			const labels = own(duel, effect);
			// 3 Spells/Traps on the field: every set of 1 to 3 of them, 7 in all.
			expect(labels).toHaveLength(7);
			expect(labels.some((label) => label.split(" > ").length === 4)).toBe(true);
			expect(labels.some((label) => label.split(" > ").length === 5)).toBe(false);
			const all = labels.find((label) => label.split(" > ").length === 4)!;
			const done = settle(play(duel, all));
			expect(codes(done, "you", "spell")).toEqual([]);
			expect(codes(done, "rival", "spell")).toEqual([]);
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-crimson-spell", "fixture-crimson-trap", "fixture-effect-4", "fixture-extra-revive", "fixture-plain-1", "fixture-plain-2"]);
		});
		it(`${cites("lightstorm-dragon", "destroy")} ${cites("lightstorm-dragon", "notes-destroy-no-normal")} targets 1 card when there is no Normal Monster in the GY, face-up or Set, in either Spell & Trap Zone or the Field Zone`, () => {
			const duel = summoned({ ...spellsOnField, set: ["fixture-other-spell"], graveyard: ["fixture-effect-4"] }, { faceupSpells: ["umi"] });
			const labels = own(duel, effect);
			expect(labels.every((label) => label.split(" > ").length === 2)).toBe(true);
			expect(labels.map((label) => label.split(" > ")[1]).sort()).toEqual(["fixture-crimson-spell", "fixture-crimson-trap", "fixture-other-spell", "umi"]);
			const done = settle(play(duel, `${effect} > umi`));
			expect(codes(done, "rival", "field")).toEqual([]);
			expect(codes(done, "rival", "graveyard")).toEqual(["umi"]);
		});
		it(`${cites("lightstorm-dragon", "destroy")} is not offered with no Spell/Trap on the field, nor for a Special Summon of another monster`, () => {
			expect(own(summoned({}, {}), effect)).toEqual([]);
			const other = settle(play(board({ hand: ["fixture-extra-revive"], extra: ["fixture-synchro-dragon-8"], faceupSpells: ["fixture-crimson-spell"], monsters: [card] }, {}, { everyWindow: true }), "activate fixture-extra-revive"));
			expect(own(other, effect)).toEqual([]);
		});
		it(`${cites("lightstorm-dragon", "notes-destroy-damage-step")} can be activated in the Damage Step`, () => {
			const start = board({ set: ["fixture-rush-summon"], monsters: ["fixture-plain-2"], extra: [card], ...spellsOnField }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-giant > fixture-plain-2");
			const chained = settle(play(mine(toStep(declared, "start")), "activate fixture-rush-summon"));
			expect(find(chained, card).zone).toBe("monster");
			expect(chained.battle?.step).toBe("start");
			expect(own(mine(chained), effect).length).toBeGreaterThan(0);
		});
		it(`${cites("lightstorm-dragon", "once")} can be used once per turn, apart from the other effect`, () => {
			const duel = summoned({ ...spellsOnField, graveyard: ["fixture-crimson-trap"] });
			const done = settle(play(duel, `${effect} > fixture-crimson-spell`));
			expect(codes(done, "you", "spell")).toEqual(["fixture-crimson-trap"]);
			// The destroying effect is used: not offered again, whichever way it was Summoned.
			expect(own(done, effect)).toEqual([]);
		});
	});

	describe("its Set effect", () => {
		const SET = `${effect} > `;
		/** Lightstorm Dragon destroyed by the opponent's Quick-Play Spell in the opponent's turn; the opponent's turn goes on, the player to be offered the trigger. */
		const destroyed = (you: SideSpec = {}, rival: SideSpec = {}, extra: Partial<Parameters<typeof board>[2]> = {}): Duel => {
			const start = board({ monsters: [card], graveyard: ["pot-of-greed", "solemn-judgment", "fixture-effect-4"], deck: ["fixture-plain-2", "fixture-plain-3"], ...you }, { hand: ["fixture-smite"], graveyard: ["raigeki"], ...rival }, { everyWindow: true, ...extra }, "rival");
			return untilOffered(settle(play(start, `activate fixture-smite > ${card}`)), effect);
		};
		it(`${cites("lightstorm-dragon", "set")} ${cites("lightstorm-dragon", "notes-set-graveyard")} Sets 1 Spell/Trap of the player's GY face-down when it is destroyed by a card effect: a Trigger Effect of the Graveyard, the target in the player's GY only`, () => {
			const duel = destroyed();
			expect(find(duel, card).zone).toBe("graveyard");
			expect(own(duel, effect)).toEqual([`${SET}pot-of-greed`, `${SET}solemn-judgment`]);
			const done = settle(play(duel, `${SET}pot-of-greed`));
			expect(find(done, "pot-of-greed")).toMatchObject({ zone: "spell", face: "down", controller: "you" });
		});
		it(`${cites("lightstorm-dragon", "set")} Sets a Field Spell in the Field Zone, and is not offered with no Spell/Trap in the GY`, () => {
			const field = settle(play(destroyed({ graveyard: ["mausoleum-of-white"] }), `${SET}mausoleum-of-white`));
			expect(find(field, "mausoleum-of-white")).toMatchObject({ zone: "field", face: "down" });
			expect(own(destroyed({ graveyard: ["fixture-effect-4"] }), effect)).toEqual([]);
		});
		it(`${cites("lightstorm-dragon", "set")} cannot be activated unless the player controls a Normal Monster, the Set card only: a face-up one does it, a face-down one does not, and a copy in the hand is free (YGOProJudge's answer for the card it follows, asked 2026-11-24, no source cited)`, () => {
			const set = settle(play(destroyed({ hand: ["pot-of-greed"] }), `${SET}pot-of-greed`));
			const myTurn = (duel: Duel): Duel => {
				let next = duel;
				for (let guard = 0; guard < 40 && !(next.turn.player === "you" && next.turn.phase === "main1" && next.priority.open && next.turn.number > duel.turn.number); guard++) next = play(next, "pass");
				return next;
			};
			const later = myTurn(set);
			// The copy in the hand is activated; the Set one cannot be.
			const labels = offered(later).filter((label) => label.startsWith("activate pot-of-greed"));
			expect(labels).toEqual(["activate pot-of-greed"]);
			expect(find(later, "pot-of-greed").zone).not.toBe("spell");
			const setOne = Object.values(later.cards).find((entry) => entry.code === "pot-of-greed" && entry.zone === "spell")!;
			expect(setOne.face).toBe("down");
			// Without the copy in the hand: nothing; with a face-down Normal Monster: nothing; with a face-up one: it can be activated.
			const bare = myTurn(settle(play(destroyed(), `${SET}pot-of-greed`)));
			expect(offered(bare).filter((label) => label.startsWith("activate pot-of-greed"))).toEqual([]);
			const withNormal = myTurn(settle(play(destroyed({ monsters: [card, "fixture-plain-1"] }), `${SET}pot-of-greed`)));
			expect(offered(withNormal).filter((label) => label.startsWith("activate pot-of-greed"))).toEqual(["activate pot-of-greed"]);
			const faceDown = myTurn(settle(play(destroyed({ monsters: [card], facedown: ["fixture-plain-1"] }), `${SET}pot-of-greed`)));
			expect(offered(faceDown).filter((label) => label.startsWith("activate pot-of-greed"))).toEqual([]);
		});
		it(`${cites("lightstorm-dragon", "set")} stops only the Set card's own activation: once it is face-up, its other effects can be activated with no Normal Monster`, () => {
			const start = destroyed({ graveyard: ["mausoleum-of-white"], monsters: [card, "fixture-plain-1", "fixture-effect-4"], hand: ["fixture-bury"] });
			const set = settle(play(start, `${SET}mausoleum-of-white`));
			expect(find(set, "mausoleum-of-white")).toMatchObject({ zone: "field", face: "down" });
			let later = set;
			for (let guard = 0; guard < 40 && !(later.turn.player === "you" && later.turn.phase === "main1" && later.priority.open && later.turn.number > set.turn.number); guard++) later = play(later, "pass");
			// With a Normal Monster, the Field Spell is activated (its own activation).
			const active = settle(play(later, "activate mausoleum-of-white"));
			expect(find(active, "mausoleum-of-white")).toMatchObject({ zone: "field", face: "up" });
			// The Normal Monster leaves: the face-up card's ignition effect can still be activated.
			const gone0 = settle(play(active, "activate fixture-bury > fixture-plain-1"));
			let gone = gone0;
			for (let guard = 0; guard < 4 && !gone.priority.open; guard++) gone = play(gone, "pass");
			expect(codes(gone, "you", "monster")).not.toContain("fixture-plain-1");
			expect(own(gone, "activate mausoleum-of-white")).not.toEqual([]);
		});
		it(`${cites("lightstorm-dragon", "set")} ${cites("lightstorm-dragon", "notes-set-damage-step")} is offered when it is destroyed by battle, in the Damage Step`, () => {
			const start = board({ monsters: [card], graveyard: ["pot-of-greed"] }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, `attack fixture-giant > ${card}`);
			const trigger = untilOffered(toStep(declared, "end"), effect);
			expect(trigger.battle).not.toBeNull();
			expect(own(trigger, effect)).toEqual([`${SET}pot-of-greed`]);
		});
		it(`${cites("lightstorm-dragon", "set")} is not offered when it is sent to the GY without being destroyed`, () => {
			const start = board({ monsters: [card], hand: ["fixture-bury"], graveyard: ["pot-of-greed"] }, {}, { everyWindow: true });
			const done = settle(play(start, `activate fixture-bury > ${card}`));
			expect(find(done, card).zone).toBe("graveyard");
			expect(own(done, effect)).toEqual([]);
		});
		it(`${cites("lightstorm-dragon", "notes-set-graveyard")} is offered from banishment when it was destroyed and banished face-up`, () => {
			const start = board({ monsters: [card], graveyard: ["pot-of-greed"] }, { hand: ["fixture-smite"] }, { everyWindow: true }, "rival");
			const marked = banishWhenItLeaves(start, find(start, card).id);
			const done = untilOffered(settle(play(marked, `activate fixture-smite > ${card}`)), effect);
			expect(find(done, card)).toMatchObject({ zone: "banished", face: "up" });
			expect(own(done, effect)).toEqual([`${SET}pot-of-greed`]);
		});
		it(`${cites("lightstorm-dragon", "once")} can be used once per turn: a second copy destroyed in the same turn does not trigger it`, () => {
			const start = board({ monsters: [card, card], graveyard: ["pot-of-greed", "solemn-judgment"] }, { hand: ["fixture-smite", "fixture-smite"] }, { everyWindow: true }, "rival");
			const first = untilOffered(settle(play(start, `activate fixture-smite > ${card}`)), effect);
			const used = settle(play(first, `${SET}pot-of-greed`));
			const second = settle(play(used.priority.holder === "rival" ? used : play(used, "pass"), `activate fixture-smite > ${card}`));
			expect(codes(second, "you", "graveyard").filter((code) => code === card)).toHaveLength(2);
			let guard = 0;
			let next = second;
			while (guard++ < 8 && next.priority.holder !== "you") next = play(next, "pass");
			expect(own(next, effect)).toEqual([]);
		});
	});
});
