import { describe, expect, it } from "vitest";
import { ask, askSpecialSummon, CARD_DEFS, type CardDef, cites, type Duel, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "crimson-dragon";
const gaps = gapCards();
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...extraDeckFixtures,
	...Object.fromEntries(["fixture-smite", "fixture-book", "fixture-weaken", "fixture-giant"].map((code) => [code, gaps[code]!])),
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
/** Crimson Dragon Synchro Summoned with a Level 4 Tuner and a Level 8 monster, the Summon having succeeded. */
const summoned = (you: SideSpec = {}, rival: SideSpec = {}): Duel => {
	const start = board({ monsters: ["fixture-tuner-4", "fixture-plain-8"], extra: [card], ...you }, rival, { everyWindow: true });
	return play(start, `special-summon ${card}`, "place 5", "pass", "pass");
};
const effect = `activate ${card}`;

describe("Crimson Dragon, written as effect records", () => {
	it(`${cites("crimson-dragon", "facts")} is a LIGHT Dragon Synchro Effect Monster of Level 12 with 0 ATK and 0 DEF, that mentions "Crimson Dragon"`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Crimson Dragon", attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 12, atk: 0, def: 0, mentions: ["Crimson Dragon"] });
	});

	it(`${cites("crimson-dragon", "procedure")} is Synchro Summoned with 1 Tuner and 1 or more non-Tuner monsters whose Levels add up to 12, sent to the Graveyard`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-plain-8"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-plain-5", "fixture-plain-6"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		// Two Tuners, or no Tuner, or a total that is not 12.
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-tuner-4", "fixture-plain-4"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-plain-4", "fixture-plain-8"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-plain-7"], extra: [card] }))).toEqual([]);
		const done = play(board({ monsters: ["fixture-tuner-4", "fixture-plain-8"], extra: [card] }), `special-summon ${card}`, "place 5");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-plain-8", "fixture-tuner-4"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
	});

	describe("its search", () => {
		const deck = ["fixture-crimson-spell", "fixture-crimson-trap", "fixture-crimson-name", "fixture-crimson-monster", "fixture-other-spell"];
		it(`${cites("crimson-dragon", "search")} ${cites("crimson-dragon", "notes-search-field")} ${cites("crimson-dragon", "notes-mentions")} adds 1 Spell/Trap that mentions "Crimson Dragon" in its text from the Deck, an optional Trigger Effect when it is Special Summoned`, () => {
			const duel = summoned({ deck });
			expect(own(duel, effect)).toEqual([effect]);
			const asked = play(duel, effect, "pass", "pass");
			// A Spell and a Trap that mention it; not a card with it only in its name, not a monster, not another Spell.
			expect(offered(asked)).toEqual(["choose fixture-crimson-spell", "choose fixture-crimson-trap"]);
			const done = play(asked, "choose fixture-crimson-trap");
			expect(codes(done, "you", "hand")).toEqual(["fixture-crimson-trap"]);
		});
		it(`${cites("crimson-dragon", "search")} is offered whatever Special Summon put it on the field, and not with no such card in the Deck`, () => {
			const start = board({ hand: ["fixture-extra-revive"], extra: [card], deck }, {}, { everyWindow: true });
			expect(own(settle(play(start, "activate fixture-extra-revive")), effect)).toEqual([effect]);
			expect(own(summoned({ deck: ["fixture-other-spell", "fixture-crimson-name"] }), effect)).toEqual([]);
		});
		it(`${cites("crimson-dragon", "search")} ${cites("crimson-dragon", "notes-search-damage-step")} can be activated in the Damage Step, when it is Special Summoned by an effect that can be activated there`, () => {
			const start = board({ set: ["fixture-rush-summon"], monsters: ["fixture-plain-2"], extra: [card], deck }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-giant > fixture-plain-2");
			const inStep = mine(toStep(declared, "start"));
			expect(inStep.battle?.step).toBe("start");
			const chained = settle(play(inStep, "activate fixture-rush-summon"));
			expect(find(chained, card).zone).toBe("monster");
			expect(chained.battle?.step).toBe("start");
			expect(own(mine(chained), effect)).toEqual([effect]);
		});
		it(`${cites("crimson-dragon", "once")} can be used once per turn, apart from the other effect`, () => {
			const start = board({ hand: ["fixture-extra-revive"], monsters: ["fixture-synchro-dragon-8"], extra: [card, "fixture-synchro-dragon-8-b"], deck }, {}, { everyWindow: true });
			const done = settle(play(settle(play(start, "activate fixture-extra-revive")), effect));
			expect(codes(done, "you", "hand").length).toBe(1);
			expect(own(done, effect)).toEqual([`activate ${card} > fixture-synchro-dragon-8`]);
		});
	});

	describe("its Quick Effect", () => {
		const extra = [card, "fixture-synchro-dragon-7-b", "fixture-synchro-dragon-8-b", "fixture-synchro-warrior-8", "fixture-synchro-dragon-6"];
		const onField = (you: SideSpec = {}, rival: SideSpec = {}, turn: "you" | "rival" = "you") => board({ monsters: [card, "fixture-synchro-dragon-7"], extra, ...you }, rival, { everyWindow: true }, turn);
		it(`${cites("crimson-dragon", "return")} ${cites("crimson-dragon", "notes-quick-field")} targets a Level 7 or higher Synchro Monster, returns itself to the Extra Deck and Special Summons a Dragon Synchro Monster of the same Level from the Extra Deck, in either player's turn`, () => {
			const duel = onField();
			expect(own(duel, effect)).toEqual([`activate ${card} > fixture-synchro-dragon-7`]);
			const chained = play(duel, `activate ${card} > fixture-synchro-dragon-7`);
			expect(chained.chain[0]!.targets).toEqual([find(duel, "fixture-synchro-dragon-7").id]);
			const done = settle(play(chained, "pass"));
			expect(find(done, card)).toMatchObject({ zone: "extra", face: "down" });
			// The Level 7 Dragon Synchro Monster; not the Level 8 ones or the Level 6 one.
			expect(find(done, "fixture-synchro-dragon-7-b")).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
			expect(codes(done, "you", "monster").sort()).toEqual(["fixture-synchro-dragon-7", "fixture-synchro-dragon-7-b"]);
			// In the opponent's turn too, and the Synchro Monster of either side is a target.
			const theirTurn = onField({}, {}, "rival");
			expect(own(theirTurn.priority.holder === "you" ? theirTurn : play(theirTurn, "pass"), effect)).toEqual([`activate ${card} > fixture-synchro-dragon-7`]);
			const theirs = board({ monsters: [card], extra }, { monsters: ["fixture-synchro-warrior-8"] }, { everyWindow: true });
			expect(own(theirs, effect)).toEqual([`activate ${card} > fixture-synchro-warrior-8`]);
		});
		it(`${cites("crimson-dragon", "return")} lets the player choose among the Dragon Synchro Monsters of that Level in the Extra Deck, and only those`, () => {
			const duel = board({ monsters: [card, "fixture-synchro-warrior-8"], extra: [card, "fixture-synchro-dragon-8", "fixture-synchro-dragon-8-b", "fixture-synchro-warrior-8", "fixture-synchro-dragon-7-b"] }, {}, { everyWindow: true });
			const asked = play(duel, `activate ${card} > fixture-synchro-warrior-8`, "pass", "pass");
			expect(offered(asked)).toEqual(["choose fixture-synchro-dragon-8", "choose fixture-synchro-dragon-8-b"]);
			expect(find(play(settle(play(asked, "choose fixture-synchro-dragon-8-b")), "pass"), "fixture-synchro-dragon-8-b").zone).toBe("monster");
		});
		it(`${cites("crimson-dragon", "return")} targets only a face-up Synchro Monster of Level 7 or higher other than "Crimson Dragon"`, () => {
			// A Level 6 Synchro Monster, a Level 7 monster that is not a Synchro Monster, a face-down Synchro Monster, another "Crimson Dragon".
			const none = board({ monsters: [card, "fixture-synchro-dragon-6", "fixture-plain-7"], facedown: ["fixture-synchro-dragon-7"], extra }, {}, { everyWindow: true });
			expect(own(none, effect)).toEqual([]);
			const other = board({ monsters: [card, card], extra }, {}, { everyWindow: true });
			expect(own(other, effect)).toEqual([]);
		});
		it(`${cites("crimson-dragon", "return")} cannot be activated with no Dragon Synchro Monster of the Level of the target in the Extra Deck`, () => {
			expect(own(onField({ extra: [card, "fixture-synchro-warrior-8", "fixture-synchro-dragon-8-b"] }), effect)).toEqual([]);
			// A Dragon of that Level in the Deck or the hand is no Extra Deck monster.
			expect(own(onField({ extra: [card], hand: ["fixture-synchro-dragon-7-b"], deck: ["fixture-synchro-dragon-7-b"] }), effect)).toEqual([]);
		});
		it(`${cites("crimson-dragon", "treated")} ${cites("crimson-dragon", "return")} Special Summons the monster as a Synchro Summon: a monster that must be Synchro Summoned can be chosen, and a Synchro Summon trigger answers it`, () => {
			const duel = board({ monsters: [card, "fixture-synchro-warrior-8"], extra: [card, "ancient-fairy-life-dragon", "fixture-must-be-synchro-dragon-8"], deck: ["fixture-plain-1"] }, {}, { everyWindow: true });
			const asked = play(duel, `activate ${card} > fixture-synchro-warrior-8`, "pass", "pass");
			expect(offered(asked)).toEqual(["choose ancient-fairy-life-dragon", "choose fixture-must-be-synchro-dragon-8"]);
			const done = play(asked, "choose ancient-fairy-life-dragon");
			const placed = offered(done).find((label) => label.startsWith("place"))!;
			const summoned = play(done, placed);
			expect(find(summoned, "ancient-fairy-life-dragon")).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
			// "If this card is Synchro Summoned": Ancient Fairy Life Dragon's draw is offered.
			expect(own(settle(summoned), "activate ancient-fairy-life-dragon")).toEqual(["activate ancient-fairy-life-dragon"]);
			const must = play(play(asked, "choose fixture-must-be-synchro-dragon-8"), offered(play(asked, "choose fixture-must-be-synchro-dragon-8")).find((label) => label.startsWith("place"))!);
			expect(find(must, "fixture-must-be-synchro-dragon-8").zone).toBe("monster");
		});
		it(`${cites("crimson-dragon", "qa-treated-summon")} gives no window to negate the Summon: a Summon performed by the effect (treated as a Synchro Summon) cannot be answered with "Solemn Judgment" (Konami's Q&A fid 12750)`, () => {
			const start = onField({}, { set: ["solemn-judgment"] });
			let next = play(start, `activate ${card} > fixture-synchro-dragon-7`);
			for (let guard = 0; guard < 10; guard++) {
				expect(offered(next).filter((label) => label.startsWith("activate solemn-judgment"))).toEqual([]);
				if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
				else if (next.chain.length > 0 || next.priority.holder === "rival") next = play(next, "pass");
				else break;
			}
			expect(find(next, "fixture-synchro-dragon-7-b").zone).toBe("monster");
		});
		it(`${cites("crimson-dragon", "notes-simultaneous")} the return and the Summon are done at the same time: the monster can take the Extra Monster Zone this card leaves, and "Crimson Dragon" itself is not an Extra Deck monster to Summon`, () => {
			const start = board({ extraZone: [card], monsters: ["fixture-synchro-dragon-12"], extra: ["fixture-synchro-dragon-12"] }, {}, { everyWindow: true });
			// The target is a Level 12 Synchro Monster; the only Level 12 Dragon Synchro Monster in the Extra Deck before the return is another card (a second "Crimson Dragon").
			expect(own(start, effect)).toEqual([`activate ${card} > fixture-synchro-dragon-12`]);
			// The Extra Monster Zone is the only zone an Extra Deck monster may go to: the one this card leaves.
			const alone = board({ extraZone: [card], monsters: ["fixture-synchro-warrior-8", "fixture-plain-1", "fixture-plain-2", "fixture-plain-3", "fixture-plain-4"], extra: [card, "fixture-synchro-dragon-8-b"] }, { extraZone: ["fixture-plain-1"] }, { everyWindow: true });
			expect(own(alone, effect)).toEqual([`activate ${card} > fixture-synchro-warrior-8`]);
			const asked = play(alone, `activate ${card} > fixture-synchro-warrior-8`, "pass", "pass");
			expect(offered(asked)).toEqual(["place 5"]);
			expect(find(play(asked, "place 5"), "fixture-synchro-dragon-8-b")).toMatchObject({ zone: "monster", slot: 5 });
			// Only "Crimson Dragon" itself at that Level: nothing to Summon, so no activation.
			expect(own(board({ extraZone: [card], monsters: ["fixture-synchro-dragon-12"], extra: [] }, {}, { everyWindow: true }), effect)).toEqual([]);
		});
		it(`${cites("crimson-dragon", "notes-resolution")} returns itself even when it has been turned face-down in response (in any battle position), and Summons the monster`, () => {
			const start = onField({}, { set: ["fixture-book"] });
			const chained = play(start, `activate ${card} > fixture-synchro-dragon-7`);
			const done = settle(play(chained, "activate fixture-book > crimson-dragon"));
			expect(find(done, card)).toMatchObject({ zone: "extra", face: "down" });
			expect(find(done, "fixture-synchro-dragon-7-b").zone).toBe("monster");
		});
		it(`${cites("crimson-dragon", "notes-resolution")} only returns itself when the target has left the field or is no longer face-up, and does nothing at all when it has left the Monster Zone`, () => {
			const gone = settle(play(play(onField({}, { set: ["fixture-smite"] }), `activate ${card} > fixture-synchro-dragon-7`), "activate fixture-smite > fixture-synchro-dragon-7"));
			expect(find(gone, card)).toMatchObject({ zone: "extra", face: "down" });
			expect(codes(gone, "you", "monster")).toEqual([]);
			const faceDown = settle(play(play(onField({}, { set: ["fixture-book"] }), `activate ${card} > fixture-synchro-dragon-7`), "activate fixture-book > fixture-synchro-dragon-7"));
			expect(find(faceDown, card).zone).toBe("extra");
			expect(find(faceDown, "fixture-synchro-dragon-7-b").zone).toBe("extra");
			// Destroyed in response: it is in the Graveyard, not returned, and nothing is Summoned.
			const destroyed = settle(play(play(onField({}, { set: ["fixture-smite"] }), `activate ${card} > fixture-synchro-dragon-7`), `activate fixture-smite > ${card}`));
			expect(find(destroyed, card).zone).toBe("graveyard");
			expect(codes(destroyed, "you", "monster")).toEqual(["fixture-synchro-dragon-7"]);
		});
		it(`${cites("crimson-dragon", "notes-no-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = board({ monsters: [card, "fixture-synchro-dragon-7"], extra }, { monsters: ["fixture-giant"], hand: [] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, `attack fixture-giant > ${card}`);
			expect(own(mine(declared), effect)).toEqual([`activate ${card} > fixture-synchro-dragon-7`]);
			expect(own(mine(toStep(declared, "start")), effect)).toEqual([]);
		});
		it(`${cites("crimson-dragon", "once")} can be used once per turn: a second copy cannot, whatever the first one did`, () => {
			const start = board({ monsters: [card, card, "fixture-synchro-dragon-7"], extra: [card, "fixture-synchro-dragon-7-b", "fixture-synchro-dragon-7-b"] }, {}, { everyWindow: true });
			const first = settle(play(start, `activate ${card} > fixture-synchro-dragon-7`, "pass"));
			expect(own(first, effect)).toEqual([]);
		});
	});
});
