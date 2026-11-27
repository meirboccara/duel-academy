import { describe, expect, it } from "vitest";
import { cites, type Duel, moveCard, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, lastingLines, offered, play } from "../rules/fixtures";
import { activations, board, find, resolve, threeSpells } from "./sky-striker-fixtures";

const card = "sky-striker-mecha-shark-cannon";
const activate = (target: string) => `activate ${card} > ${target}`;
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));

describe("Sky Striker Mecha - Shark Cannon, written as effect records", () => {
	it(`${cites("sky-striker-mecha-shark-cannon", "facts")} is a Quick-Play Spell, a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Mecha - Shark Cannon", archetypes: ["Sky Striker"], mentions: ["Sky Striker Mecha - Shark Cannon"] });
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "condition")} needs no monster of the player in the Main Monster Zone (the Extra Monster Zone does not count), and targets 1 monster in the opponent's Graveyard`, () => {
		const rival = { graveyard: ["fixture-filler", "fixture-other-spell", "fixture-big"] };
		expect(activations(board({ hand: [card] }, rival), card)).toEqual([activate("fixture-big"), activate("fixture-filler")].sort());
		expect(activations(board({ hand: [card], monsters: ["fixture-normal"] }, rival), card)).toEqual([]);
		expect(activations(board({ hand: [card], extraZone: ["fixture-link"] }, rival), card)).toHaveLength(2);
		// Only the opponent's Graveyard, and only a monster.
		expect(activations(board({ hand: [card], graveyard: ["fixture-filler"] }, { graveyard: ["fixture-other-spell"] }), card)).toEqual([]);
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "banish")} banishes the target, face-up, when the player has fewer than 3 Spells in the Graveyard (no choice is offered)`, () => {
		const start = board({ hand: [card], graveyard: threeSpells.slice(0, 2) }, { graveyard: ["fixture-filler"] });
		const done = resolve(play(start, activate("fixture-filler")));
		expect(codes(done, "rival", "graveyard")).toEqual([]);
		expect(find(done, "fixture-filler")).toMatchObject({ zone: "banished", face: "up" });
		expect(done.asking).toBeFalsy();
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "summon-instead")} with 3 or more Spells in the Graveyard the player may Special Summon the target to their field instead of banishing it; declining banishes it`, () => {
		const start = board({ hand: [card], graveyard: threeSpells }, { graveyard: ["fixture-filler"] });
		const asked = resolve(play(start, activate("fixture-filler")));
		expect(offered(asked)).toContain(`choose ${card}`);
		const summoned = play(asked, `choose ${card}`, "place 0");
		expect(find(summoned, "fixture-filler")).toMatchObject({ zone: "monster", face: "up", controller: "you" });
		expect(codes(summoned, "rival", "graveyard")).toEqual([]);
		const declined = play(asked, "pass");
		expect(find(declined, "fixture-filler")).toMatchObject({ zone: "banished" });
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "summon-instead")} the Special Summon is not offered for a monster that cannot be Special Summoned (an Extra Deck monster never properly Summoned): it is banished`, () => {
		const start = board({ hand: [card], graveyard: threeSpells }, { graveyard: ["fixture-link"] });
		const done = resolve(play(start, activate("fixture-link")));
		expect(find(done, "fixture-link")).toMatchObject({ zone: "banished" });
		expect(done.asking).toBeFalsy();
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "cannot-attack")} ${cites("sky-striker-mecha-shark-cannon", "notes-cannot-attack")} the monster Special Summoned cannot attack as long as it stays face-up in the Monster Zone; the other monsters still do`, () => {
		// Next to a monster of the same code, to be sure it is the card that cannot attack and not its name.
		const start = board({ hand: [card], graveyard: threeSpells, extraZone: ["fixture-filler"] }, { graveyard: ["fixture-filler"] });
		const both = play(resolve(play(start, activate("fixture-filler"))), `choose ${card}`, "place 1");
		const inBattle = { ...both, turn: { ...both.turn, phase: "battle" as const }, priority: { holder: "you" as const, passed: [], open: true } };
		const id = (code: string) => Object.values(inBattle.cards).filter((entry) => entry.code === code && entry.zone === "monster").map((entry) => entry.id);
		expect(id("fixture-filler")).toHaveLength(2);
		// Exactly one of the two can attack (directly, the opponent controlling none).
		expect(attacks(inBattle)).toEqual(["attack fixture-filler directly"]);
		// The line names the monster and the card it comes from, and goes once that monster has left the field.
		const summonedId = Object.values(both.cards).find((entry) => entry.code === "fixture-filler" && entry.zone === "monster" && entry.slot === 1)!.id;
		expect(lastingLines(inBattle)).toEqual([`both players cannot attack with that monster: fixture-filler (${card}), for the rest of the Duel`]);
		expect(lastingLines(moveCard(inBattle, summonedId, { zone: "graveyard" }))).toEqual([]);
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "notes-no-damage-step")} cannot be activated in the Damage Step (a Quick-Play Spell that changes no ATK or DEF), but can in the Battle Step before it`, () => {
		const start = board({ set: [card] }, { monsters: ["fixture-filler"], graveyard: ["fixture-big"] }, {}, "rival", "battle");
		const declared = play(start, "attack fixture-filler directly");
		expect(activations(play(declared, "pass"), card)).toEqual([activate("fixture-big")]);
		const damage = toStep(declared, "start");
		const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
		expect(mine.battle?.step).toBe("start");
		expect(activations(mine, card)).toEqual([]);
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "summon-instead")} ${cites("sky-striker-mecha-shark-cannon", "qa-iron-wall")} with banishing impossible (Imperial Iron Wall) it cannot be activated with fewer than 3 Spells in the Graveyard; with 3 or more the monster is Special Summoned, with no banishing offered (Konami's Q&A fid 8227)`, () => {
		const wall = { faceupSpells: ["fixture-iron-wall"] };
		const few = board({ hand: [card], graveyard: threeSpells.slice(0, 2) }, { graveyard: ["fixture-filler"], ...wall });
		expect(activations(few, card)).toEqual([]);
		const many = board({ hand: [card], graveyard: threeSpells }, { graveyard: ["fixture-filler"], ...wall });
		expect(activations(many, card)).toEqual([activate("fixture-filler")]);
		const resolved = resolve(play(many, activate("fixture-filler")));
		expect(offered(resolved)).not.toContain(`choose ${card}`);
		const done = play(resolved, "place 0");
		expect(find(done, "fixture-filler")).toMatchObject({ zone: "monster", face: "up", controller: "you" });
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "banish")} ${cites("sky-striker-mecha-shark-cannon", "qa-iron-wall")} a monster that cannot be banished is no target even with 3 Spells when it also cannot be Special Summoned (Konami's Q&A fid 8227)`, () => {
		const start = board({ hand: [card], graveyard: threeSpells }, { graveyard: ["fixture-link"], faceupSpells: ["fixture-iron-wall"] });
		expect(activations(start, card)).toEqual([]);
	});

	it(`${cites("sky-striker-mecha-shark-cannon", "banish")} ${cites("sky-striker-mecha-shark-cannon", "qa-warning")} counts as an effect that includes a Special Summon for the opponent's response even with fewer than 3 Spells in the Graveyard (Konami's Q&A fid 21761)`, () => {
		const start = board({ hand: [card], graveyard: threeSpells.slice(0, 2) }, { graveyard: ["fixture-filler"], set: ["fixture-ss-warning"] });
		const chained = play(start, activate("fixture-filler"));
		expect(offered(chained)).toContain("activate fixture-ss-warning");
		const done = resolve(play(chained, "activate fixture-ss-warning"));
		// The activation was negated and the Spell destroyed: the target stays in the Graveyard (not banished).
		expect(find(done, "fixture-filler")).toMatchObject({ zone: "graveyard", owner: "rival" });
		expect(find(done, card).zone).toBe("graveyard");
	});
});
