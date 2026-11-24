import { describe, expect, it } from "vitest";
import { addModifier, atk, belongsTo, CARD_DEFS, type CardDef, cites, type Duel, moveCards, negateCardEffects, printedFacts } from "../../src";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "deep-eyes-white-dragon";
const BEWD = "blue-eyes-white-dragon";
const gaps = gapCards();
const ritual = (code: string, name: string, archetypes: string[]): CardDef => ({ code, kind: "monster", facts: { name, frame: "ritual", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 2800, def: 2400, ...(archetypes.length > 0 ? { archetypes } : {}) }, procedure: { kind: "ritual" } });
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...Object.fromEntries(["fixture-bury", "fixture-bury-all", "fixture-smite", "fixture-bounce", "fixture-book", "fixture-giant"].map((code) => [code, gaps[code]!])),
	// A Ritual Monster that is a "Blue-Eyes" monster, and one that is not.
	"fixture-blue-eyes-ritual": ritual("fixture-blue-eyes-ritual", "Fixture Blue-Eyes Ritual", ["Blue-Eyes"]),
	"fixture-other-ritual": ritual("fixture-other-ritual", "Fixture Other Ritual", []),
	// A Quick-Play Spell: "Banish every monster in both GYs."
	"fixture-vacuum": { code: "fixture-vacuum", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => moveCards(duel, [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster"), { zone: "banished" }) }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
/** Resolves the chain and answers the questions of the effect with the first offer, stopping at anything else (a trigger offered, the open state). */
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
/** Passes step by step (only when the player is the one to act, the other's windows too), and says whether `label` was offered to the player at any moment. */
const everOffered = (duel: Duel, label: string, passes = 16): boolean => {
	let next = duel;
	for (let guard = 0; guard < passes; guard++) {
		if (next.priority.holder === "you" && offered(next).some((entry) => entry.startsWith(label))) return true;
		next = play(next, "pass");
	}
	return false;
};
const TUNER = "fixture-light-tuner";
const revive = (label: string) => `activate ${card} > ${label}`;
/** The player sends the monster `code` they control to the GY with a Quick-Play Spell of their hand (the Deep-Eyes is in the hand with it). */
const sendOne = (code: string, you: SideSpec = {}) => settle(play(board({ hand: [card, "fixture-bury"], monsters: [code], ...you }), `activate fixture-bury > ${code}`));

describe("Deep-Eyes White Dragon, the Blue Abyss, written as effect records", () => {
	it(`${cites("deep-eyes-white-dragon", "facts")} is a LIGHT Dragon Effect Monster of Level 10 with 0 ATK and 0 DEF, that mentions "Blue-Eyes White Dragon"`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Deep-Eyes White Dragon, the Blue Abyss", attribute: "LIGHT", monsterType: "Dragon", level: 10, atk: 0, def: 0, archetypes: ["Blue-Eyes"], mentions: ["Blue-Eyes White Dragon", "Deep-Eyes White Dragon, the Blue Abyss"] });
	});
	it(`${cites("deep-eyes-white-dragon", "treated")} ${cites("deep-eyes-white-dragon", "notes-treated")} is a "Blue-Eyes" card in every place, and still when its effects are negated (it is not an effect)`, () => {
		const hand = board({ hand: [card] });
		expect(belongsTo(hand, find(hand, card).id, "Blue-Eyes")).toBe(true);
		const field = board({ monsters: [card] });
		const negated = negateCardEffects(field, find(field, card).id, field.turn.number);
		expect(negated).not.toBe(field);
		expect(belongsTo(negated, find(negated, card).id, "Blue-Eyes")).toBe(true);
	});

	describe("its discard effect", () => {
		it(`${cites("deep-eyes-white-dragon", "search")} ${cites("deep-eyes-white-dragon", "notes-search-ignition")} ${cites("rules", "search-needs-a-card")} discards itself to add 1 Level 1 LIGHT Tuner from the Deck to the hand, an Ignition Effect of the hand, the card chosen when it resolves; not with none to add`, () => {
			const start = board({ hand: [card], deck: [TUNER, "fixture-light-1", "fixture-dark-tuner", "fixture-normal-4", "effect-veiler"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const asked = play(start, `activate ${card}`);
			expect(find(asked, card).zone).toBe("graveyard");
			// "Level 1 LIGHT Tuner": not a Level 1 LIGHT monster that is no Tuner, not a DARK Tuner.
			expect(offered(asked)).toEqual([`choose ${TUNER}`, "choose effect-veiler"].sort());
			const done = settle(play(asked, `choose ${TUNER}`));
			expect(codes(done, "you", "hand")).toEqual([TUNER]);
			expect(own(board({ hand: [card], deck: ["fixture-light-1", "fixture-dark-tuner"] }), `activate ${card}`)).toEqual([]);
			// Not while cards cannot be added from the Deck to the hand; not from the field; not in the opponent's turn.
			const locked = addModifier(board({ hand: [card], deck: [TUNER] }), { affects: () => true, until: 3, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			expect(own(locked, `activate ${card}`)).toEqual([]);
			expect(own(board({ monsters: [card], deck: [TUNER] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ hand: [card], deck: [TUNER] }, {}, { everyWindow: true }, "rival"), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("deep-eyes-white-dragon", "once")} lets the discard effect be used once per turn, by name`, () => {
			const start = board({ hand: [card, card], deck: [TUNER, TUNER] });
			expect(own(start, `activate ${card}`)).toHaveLength(2);
			const used = settle(play(start, `activate ${card}`));
			let open = used;
			for (let guard = 0; guard < 4 && !open.priority.open; guard++) open = play(open, "pass");
			expect(own(open, `activate ${card}`)).toEqual([]);
		});
	});

	describe("its Special Summon trigger", () => {
		it(`${cites("deep-eyes-white-dragon", "revive")} ${cites("deep-eyes-white-dragon", "notes-trigger-places")} Special Summons itself from the hand when a "Blue-Eyes White Dragon" is sent to the player's GY, targeting it; its ATK becomes the target's`, () => {
			const sent = sendOne(BEWD);
			expect(own(sent, `activate ${card}`)).toEqual([revive(BEWD)]);
			const done = settle(play(sent, revive(BEWD)));
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
			expect(atk(done, find(done, card).id)).toBe(3000);
			// The card is the player's choice: declining is possible.
			expect(offered(sent)).toContain("pass");
		});
		it(`${cites("deep-eyes-white-dragon", "revive")} triggers for a "Blue-Eyes" Ritual Monster (its ATK then becomes that one's), and not for another "Blue-Eyes" monster, another Ritual Monster, or a monster sent to the opponent's GY`, () => {
			const ritualSent = sendOne("fixture-blue-eyes-ritual");
			expect(own(ritualSent, `activate ${card}`)).toEqual([revive("fixture-blue-eyes-ritual")]);
			expect(atk(settle(play(ritualSent, revive("fixture-blue-eyes-ritual"))), find(ritualSent, card).id)).toBe(2800);
			expect(own(sendOne("fixture-blue-eyes-normal"), `activate ${card}`)).toEqual([]);
			expect(own(sendOne("fixture-other-ritual"), `activate ${card}`)).toEqual([]);
			// The opponent's own Dragon sent to their GY (they play the Spell in their turn): not "your GY".
			const theirs = board({ hand: [card] }, { hand: ["fixture-bury"], monsters: [BEWD] }, { everyWindow: true }, "rival");
			const sentByThem = settle(play(theirs, `activate fixture-bury > ${BEWD}`));
			expect(codes(sentByThem, "rival", "graveyard").sort()).toEqual([BEWD, "fixture-bury"].sort());
			expect(own(sentByThem.priority.holder === "you" ? sentByThem : play(sentByThem, "pass"), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("deep-eyes-white-dragon", "revive")} is still Special Summoned, with its ATK unchanged, when the targeted monster has left the GY before the effect resolves (YGOProJudge's answer only, asked 2026-11-24, no source cited)`, () => {
			const sent = settle(play(board({ hand: [card, "fixture-bury"], monsters: [BEWD] }, { set: ["fixture-vacuum"] }, { everyWindow: true }), `activate fixture-bury > ${BEWD}`));
			const activated = play(sent, revive(BEWD));
			// In response the opponent banishes the targeted monster from the GY.
			const answered = play(activated.priority.holder === "rival" ? activated : play(activated, "pass"), "activate fixture-vacuum");
			const done = settle(answered);
			expect(codes(done, "you", "banished")).toEqual([BEWD]);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
			expect(atk(done, find(done, card).id)).toBe(0);
		});
		it(`${cites("deep-eyes-white-dragon", "notes-gy-first")} Special Summons itself from the GY only if it was already there when the monster was sent, not when both were sent at the same time`, () => {
			const before = sendOne(BEWD, { hand: ["fixture-bury"], graveyard: [card] });
			expect(own(before, `activate ${card}`)).toEqual([revive(BEWD)]);
			expect(find(settle(play(before, revive(BEWD))), card).zone).toBe("monster");
			// Both on the field, both sent together by a Spell that sends every monster: the one in the GY was not there first.
			const together = settle(play(board({ hand: ["fixture-bury-all"], monsters: [BEWD, card] }), "activate fixture-bury-all"));
			expect(codes(together, "you", "graveyard").sort()).toEqual([BEWD, card, "fixture-bury-all"].sort());
			expect(own(together, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("deep-eyes-white-dragon", "notes-damage-step")} cannot be activated for a monster sent to the GY in the Damage Step`, () => {
			const start = board({ hand: [card], monsters: [BEWD] }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, `attack fixture-giant > ${BEWD}`);
			// The monster is destroyed and sent to the GY in the Damage Step: at no window of the battle, nor after it, is the effect offered.
			expect(everOffered(declared, `activate ${card}`)).toBe(false);
			let after = declared;
			for (let guard = 0; guard < 12 && codes(after, "you", "graveyard").length === 0; guard++) after = play(after, "pass");
			expect(codes(after, "you", "graveyard")).toEqual([BEWD]);
		});
		it(`${cites("deep-eyes-white-dragon", "once")} lets the trigger be used once per turn, by name, whichever copy`, () => {
			const first = sendOne(BEWD, { hand: [card, card, "fixture-bury", "fixture-bury"], monsters: [BEWD, BEWD] });
			const summoned = settle(play(first, revive(BEWD)));
			const second = settle(play(summoned, `activate fixture-bury > ${BEWD}`));
			expect(own(second, `activate ${card}`)).toEqual([]);
		});
	});

	describe("while it is on the field after that Summon", () => {
		/** Deep-Eyes Special Summoned by its effect for a "Blue-Eyes White Dragon", with the Spells of the hand to move it around. */
		const summoned = (hand: string[]) => settle(play(sendOne(BEWD, { hand: [card, "fixture-bury", ...hand] }), revive(BEWD)));
		it(`${cites("deep-eyes-white-dragon", "revive")} banishes it instead when it leaves the field (destroyed here)`, () => {
			const duel = summoned(["fixture-smite"]);
			const done = settle(play(duel, `activate fixture-smite > ${card}`));
			expect(find(done, card).zone).toBe("banished");
		});
		it(`${cites("deep-eyes-white-dragon", "notes-atk-negated")} loses the ATK of the target when its effects are negated`, () => {
			const duel = summoned([]);
			const id = find(duel, card).id;
			expect(atk(duel, id)).toBe(3000);
			expect(atk(negateCardEffects(duel, id, duel.turn.number), id)).toBe(0);
		});
		it(`${cites("deep-eyes-white-dragon", "notes-leave-ends")} is no longer banished when it leaves the field once it has been turned face-down, and goes to the GY (Konami's notes)`, () => {
			const duel = summoned(["fixture-book", "fixture-smite"]);
			const down = settle(play(duel, `activate fixture-book > ${card}`));
			expect(find(down, card)).toMatchObject({ zone: "monster", face: "down" });
			const done = settle(play(down, `activate fixture-smite > ${card}`));
			expect(find(done, card).zone).toBe("graveyard");
		});
		it(`${cites("deep-eyes-white-dragon", "revive")} is banished instead when it is returned to the hand (YGOProJudge's answer only, asked 2026-11-24, no source cited)`, () => {
			const duel = summoned(["fixture-bounce"]);
			const done = settle(play(duel, `activate fixture-bounce > ${card}`));
			expect(find(done, card).zone).toBe("banished");
		});
	});
});
