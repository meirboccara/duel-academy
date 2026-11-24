import { describe, expect, it } from "vitest";
import { CARD_DEFS, type CardDef, cites, type Duel, equip, negateCardEffects, printedFacts, revealedNow } from "../../src";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { primiteFixtures } from "./primite-fixtures";

const card = "primite-drillbeam";
const gaps = gapCards();
const log: string[] = [];
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...primiteFixtures,
	"fixture-banner": gaps["fixture-banner"]!,
	"fixture-banner-immune": gaps["fixture-banner-immune"]!,
	// A Normal Spell that logs, and a monster with a Quick Effect on the field that logs.
	"fixture-logging-spell": { code: "fixture-logging-spell", kind: "spell", effects: [{ type: "activation", operation: (duel) => (log.push("fixture-logging-spell"), duel) }] },
	"fixture-logging-quick": { code: "fixture-logging-quick", kind: "monster", facts: { name: "Fixture Logging Quick", level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "quick", operation: (duel) => (log.push("fixture-logging-quick"), duel) }] },
	// A Quick-Play Spell: "Reveal 1 card in your hand" (a cost of its own, to reveal the same card again in the same Chain).
	"fixture-revealer": { code: "fixture-revealer", kind: "quick-play", effects: [{ type: "activation", cost: { pick: (duel, { player, card: self }) => duel.piles[player].hand.filter((id) => id !== self.id).map((id) => [id]), pay: (duel) => duel }, operation: (duel) => duel }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const idOf = (duel: Duel, code: string) => find(duel, code).id;
/** Takes the first zone offered while an effect asks for one (`place`), passing while the chain resolves, until the game state is open again. */
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0 || !next.priority.open) next = play(next, "pass");
		else break;
	}
	return next;
};
const drill = (duel: Duel): string[] => own(duel, `activate ${card}`);
const NORMAL = "fixture-normal-4";
const TARGET = "fixture-effect-4";

describe("Primite Drillbeam, written as effect records", () => {
	it(`${cites("primite-drillbeam", "facts")} is a Quick-Play Spell, a "Primite" card`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, idOf(duel, card))).toEqual({ name: "Primite Drillbeam", archetypes: ["Primite"], mentions: ["Primite Drillbeam"] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
	});

	describe("its cost and its target", () => {
		it(`${cites("primite-drillbeam", "reveal")} shows 1 "Primite" card or 1 Normal Monster of the hand, other than "Primite Drillbeam", to activate: a way of its own for each, and no activation with none to show`, () => {
			const hand = [card, card, "fixture-primite-spell", NORMAL, "fixture-effect-4", "fixture-plain-spell"];
			const start = board({ hand }, { monsters: [TARGET] });
			// Each Drillbeam of the hand has the same two ways; the other Drillbeam is not one of the cards to show.
			expect([...new Set(drill(start))]).toEqual([`activate ${card} ~ fixture-primite-spell > ${TARGET}`, `activate ${card} ~ ${NORMAL} > ${TARGET}`].sort());
			expect(drill(start).some((label) => label.includes(`~ ${card}`))).toBe(false);
			// None to show, nothing on the field to do without: not activated.
			expect(drill(board({ hand: [card, "fixture-effect-4", "fixture-plain-spell"] }, { monsters: [TARGET] }))).toEqual([]);
			const done = play(start, `activate ${card} ~ ${NORMAL} > ${TARGET}`);
			expect(revealedNow(done)).toContain(idOf(done, NORMAL));
		});
		it(`${cites("primite-drillbeam", "reveal-free")} ${cites("primite-drillbeam", "notes-free")} activates without showing a card while the player controls a face-up Normal Monster or a face-up Level 5 or higher "Primite" monster`, () => {
			const free = (you: SideSpec) => drill(board({ hand: [card], ...you }, { monsters: [TARGET] }));
			expect(free({ monsters: [NORMAL] })).toEqual([`activate ${card} > ${TARGET}`]);
			expect(free({ monsters: ["fixture-primite-5"] })).toEqual([`activate ${card} > ${TARGET}`, `activate ${card} > fixture-primite-5`].sort());
			// A Level 4 "Primite" Effect Monster, a Level 5 monster that is not "Primite", a face-down monster: none of them.
			expect(free({ monsters: ["fixture-primite-4"] })).toEqual([]);
			expect(free({ monsters: ["fixture-blue-eyes-effect"] })).toEqual([]);
			expect(free({ facedown: [NORMAL] })).toEqual([]);
			expect(free({ facedown: ["fixture-primite-5"] })).toEqual([]);
			// With a card to show as well, both ways are offered.
			expect(drill(board({ hand: [card, NORMAL], monsters: [NORMAL] }, { monsters: [TARGET] }))).toEqual([`activate ${card} > ${TARGET}`, `activate ${card} ~ ${NORMAL} > ${TARGET}`].sort());
		});
		it(`${cites("primite-drillbeam", "target")} ${cites("primite-drillbeam", "notes-targets")} targets 1 face-up card on the field, not a face-down card, a card whose effects are already negated, or a monster that has no effect`, () => {
			let start = board({ hand: [card, NORMAL], monsters: ["fixture-primite-4"] }, { monsters: [TARGET, NORMAL, "fixture-ignition-monster"], faceupSpells: ["fixture-banner"], set: ["fixture-plain-spell"] });
			start = negateCardEffects(start, idOf(start, "fixture-ignition-monster"), start.turn.number);
			// A Spell on the field and the effect monsters (mine and theirs) are targets; a Set card, a Normal Monster (it has no effect) and the negated monster are not.
			expect(drill(start).map((label) => label.split(" > ")[1]).sort()).toEqual(["fixture-banner", TARGET, "fixture-primite-4"].sort());
		});
		it(`${cites("primite-drillbeam", "qa-equip-normal")} can target, negate and banish a Normal Monster that is an Equip Card (treated as an Equip Spell)`, () => {
			const start = board({ hand: [card, NORMAL] }, { monsters: [TARGET], faceupSpells: ["fixture-normal-6"] });
			const equipped = equip(start, idOf(start, "fixture-normal-6"), idOf(start, TARGET));
			expect(drill(equipped)).toContain(`activate ${card} ~ ${NORMAL} > fixture-normal-6`);
			const done = play(equipped, `activate ${card} ~ ${NORMAL} > fixture-normal-6`);
			expect(codes(done, "rival", "banished")).toEqual(["fixture-normal-6"]);
			expect(codes(done, "rival", "monster")).toEqual([TARGET]);
		});
		it(`${cites("primite-drillbeam", "qa-reveal-again")} lets a card shown as its cost be shown again for another effect in the same Chain`, () => {
			const start = board({ hand: [card, NORMAL, "fixture-revealer"] }, { monsters: [TARGET] });
			const chained = play(start, `activate ${card} ~ ${NORMAL} > ${TARGET}`);
			expect(own(chained, "activate fixture-revealer")).toContain(`activate fixture-revealer ~ ${NORMAL}`);
		});
	});

	describe("its effect", () => {
		it(`${cites("primite-drillbeam", "target")} ${cites("primite-drillbeam", "notes-negate-then-banish")} negates the effects of the target and, if it did, banishes it; a card unaffected by it is neither`, () => {
			const start = board({ hand: [card, NORMAL] }, { monsters: [TARGET], faceupSpells: ["fixture-banner", "fixture-banner-immune"] });
			const monster = play(start, `activate ${card} ~ ${NORMAL} > ${TARGET}`);
			expect(codes(monster, "rival", "banished")).toEqual([TARGET]);
			const spell = play(start, `activate ${card} ~ ${NORMAL} > fixture-banner`);
			expect([codes(spell, "rival", "banished"), codes(spell, "rival", "spell")]).toEqual([["fixture-banner"], ["fixture-banner-immune"]]);
			const kept = play(start, `activate ${card} ~ ${NORMAL} > fixture-banner-immune`);
			expect([codes(kept, "rival", "banished"), codes(kept, "rival", "spell")]).toEqual([[], ["fixture-banner", "fixture-banner-immune"]]);
		});
		it(`${cites("primite-drillbeam", "target")} negates the effect of a Spell Card it is chained to as well as banishing it (YGOProJudge's answer only, asked 2026-11-24, no source cited and no Konami page read: it is a lead)`, () => {
			log.length = 0;
			const start = board({ set: [card], hand: [NORMAL] }, { hand: ["fixture-logging-spell"] }, { everyWindow: true }, "rival");
			const chained = play(start, "activate fixture-logging-spell");
			const mine = chained.priority.holder === "you" ? chained : play(chained, "pass");
			const answered = play(mine, `activate ${card} ~ ${NORMAL} > fixture-logging-spell`);
			let done = answered;
			for (let guard = 0; guard < 10 && done.chain.length > 0; guard++) done = play(done, "pass");
			expect(codes(done, "rival", "banished")).toEqual(["fixture-logging-spell"]);
			expect(log).toEqual([]);
		});
		it(`${cites("primite-drillbeam", "target")} leaves the effect a monster activated resolving when the monster is banished in response (the core's reading: only a Spell Card's effect is part of the card; no source cited)`, () => {
			log.length = 0;
			const start = board({ set: [card], hand: [NORMAL] }, { monsters: ["fixture-logging-quick"] }, { everyWindow: true }, "rival");
			const chained = play(start, "activate fixture-logging-quick");
			const mine = chained.priority.holder === "you" ? chained : play(chained, "pass");
			let done = play(mine, `activate ${card} ~ ${NORMAL} > fixture-logging-quick`);
			for (let guard = 0; guard < 10 && done.chain.length > 0; guard++) done = play(done, "pass");
			expect(codes(done, "rival", "banished")).toEqual(["fixture-logging-quick"]);
			expect(log).toEqual(["fixture-logging-quick"]);
		});
	});

	describe("its Graveyard effect", () => {
		const grave = (you: SideSpec = {}, rival: SideSpec = {}, turn: "you" | "rival" = "you") => board({ graveyard: [card], monsters: ["fixture-primite-normal"], ...you }, rival, {}, turn);
		it(`${cites("primite-drillbeam", "set")} ${cites("primite-drillbeam", "notes-set-gy")} Sets itself from the GY during the player's Main Phase if they control a face-up "Primite" monster, and it cannot be activated that turn`, () => {
			const start = grave();
			expect(drill(start)).toEqual([`activate ${card}`]);
			const done = settle(play(start, `activate ${card}`));
			expect(find(done, card)).toMatchObject({ zone: "spell", face: "down" });
			expect(done.setThisTurn).toContain(idOf(done, card));
			// A Quick-Play Spell Set this turn is not activated this turn; one Set earlier is.
			expect(drill(board({ setThisTurn: [card], monsters: [NORMAL] }, { monsters: [TARGET] }))).toEqual([]);
			expect(drill(board({ set: [card], monsters: [NORMAL] }, { monsters: [TARGET] }))).toEqual([`activate ${card} > ${TARGET}`]);
			// No face-up "Primite" monster, a face-down one, or the opponent's turn: not offered.
			expect(drill(board({ graveyard: [card], monsters: [NORMAL] }))).toEqual([]);
			expect(drill(board({ graveyard: [card], facedown: ["fixture-primite-normal"] }))).toEqual([]);
			expect(drill(grave({}, {}, "rival"))).toEqual([]);
			// With no free Spell & Trap Zone it cannot be Set.
			expect(drill(board({ graveyard: [card], monsters: ["fixture-primite-normal"], faceupSpells: ["fixture-plain-spell", "fixture-plain-spell", "fixture-plain-spell", "fixture-plain-spell", "fixture-plain-spell"] }))).toEqual([]);
		});
		it(`${cites("primite-drillbeam", "once")} lets each effect be used once per turn, by name: the effect from the hand and the one from the GY are two uses`, () => {
			const start = board({ hand: [card, NORMAL], graveyard: [card], monsters: ["fixture-primite-normal"] }, { monsters: [TARGET] });
			expect(drill(start)).toHaveLength(3);
			// The Set effect used: the GY copy has none left, the hand copy still has its own.
			const set = settle(play(start, `activate ${card}`));
			expect(Object.values(set.cards).filter((entry) => entry.code === card).map((entry) => entry.zone).sort()).toEqual(["hand", "spell"]);
			expect(drill(set)).toEqual([`activate ${card} > ${TARGET}`, `activate ${card} ~ ${NORMAL} > ${TARGET}`].sort());
			// The other way round: the negation used, the Set effect is still free.
			const negated = settle(play(start, `activate ${card} > ${TARGET}`));
			// Both Drillbeams are in the GY now, each with its Set effect.
			expect(drill(negated)).toEqual([`activate ${card}`, `activate ${card}`]);
		});
	});
});
