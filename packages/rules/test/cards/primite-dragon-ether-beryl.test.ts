import { describe, expect, it } from "vitest";
import { ask, askSpecialSummon, CARD_DEFS, type CardDef, cites, type Duel, moveCard, printedFacts } from "../../src";
import { nextTurn, toPhase } from "../rules/continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { primiteFixtures } from "./primite-fixtures";

const card = "primite-dragon-ether-beryl";
const fixtures: Record<string, CardDef> = { ...blueEyesFixtures, ...primiteFixtures };
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
/** Passes while the game state is not open (the chain is over). */
const reopen = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 4 && !next.priority.open; guard++) next = play(next, "pass");
	return next;
};
/** Takes the first card or zone offered while an effect asks. */
const asked = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 10 && next.asking; guard++) next = play(next, offered(next).find((entry) => entry.startsWith("choose") || entry.startsWith("place"))!);
	return next;
};
/** Your next Standby Phase, with the trigger point of the phase reached (the first pass after it begins). */
const nextStandby = (duel: Duel, turns = 2): Duel => toPhase(nextTurn(duel, duel.turn.number + turns), "standby");
const NORMAL = "fixture-normal-4";

describe("Primite Dragon Ether Beryl, written as effect records", () => {
	it(`${cites("primite-dragon-ether-beryl", "facts")} is an EARTH Dragon Effect Monster of Level 4 with 1600 ATK and 0 DEF, a "Primite" card`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Primite Dragon Ether Beryl", attribute: "EARTH", monsterType: "Dragon", level: 4, atk: 1600, def: 0, archetypes: ["Primite"], mentions: ["Primite Dragon Ether Beryl"] });
	});

	describe("its Normal Summon trigger", () => {
		const summonable = (deck: string[], you: SideSpec = {}) => board({ hand: [card], deck, ...you });
		it(`${cites("primite-dragon-ether-beryl", "set")} ${cites("primite-dragon-ether-beryl", "notes-set-trigger")} Sets 1 "Primite" Spell/Trap from the Deck face-down when it is Normal Summoned, the card and the zone chosen by the player`, () => {
			const start = summonable(["fixture-primite-spell", "fixture-primite-trap", "fixture-plain-spell", "fixture-primite-normal", NORMAL]);
			const summoned = play(start, `summon ${card}`);
			// A trigger of the Monster Zone, put on the chain after the Summon succeeded.
			expect(own(summoned, `activate ${card}`)).toEqual([`activate ${card}`]);
			const choosing = play(summoned, `activate ${card}`);
			// Only the "Primite" Spell/Trap Cards: not a "Primite" monster, not a Spell/Trap of another family.
			expect(offered(choosing)).toEqual(["choose fixture-primite-spell", "choose fixture-primite-trap"]);
			const done = asked(play(choosing, "choose fixture-primite-trap"));
			expect(find(done, "fixture-primite-trap")).toMatchObject({ zone: "spell", face: "down" });
			expect(done.setThisTurn).toContain(find(done, "fixture-primite-trap").id);
			// The player may decline the optional trigger.
			expect(offered(summoned)).toContain("pass");
			// It cannot be activated with no "Primite" Spell/Trap in the Deck (rule `search-needs-a-card`'s reading for a Set).
			expect(own(play(summonable(["fixture-plain-spell", "fixture-primite-5"]), `summon ${card}`), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-dragon-ether-beryl", "set")} does not trigger when it is Special Summoned (a made-up monster with an "if Special Summoned" trigger shows that the Summon is noticed)`, () => {
			const withControl: Record<string, CardDef> = {
				...defs,
				"fixture-special-trigger": { code: "fixture-special-trigger", kind: "monster", effects: [{ type: "trigger", timing: "if", event: (_duel, event, { card: self }) => event.type === "summoned" && event.how === "special" && event.card.id === self.id, operation: (duel) => duel }] },
				// A Normal Spell: "Special Summon 1 monster from your hand."
				"fixture-revive": { code: "fixture-revive", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].hand.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster"), (board, picked) => askSpecialSummon(board, link.player, picked)) }] },
			};
			const start = position({ defs: withControl, you: { hand: ["fixture-revive", card, "fixture-special-trigger"], deck: ["fixture-primite-spell"] } });
			const summoned = (code: string) => asked(play(start, "activate fixture-revive", `choose ${code}`));
			expect(own(summoned("fixture-special-trigger"), "activate fixture-special-trigger")).toEqual(["activate fixture-special-trigger"]);
			expect(own(summoned(card), `activate ${card}`)).toEqual([]);
		});
	});

	describe("its Tribute effect", () => {
		it(`${cites("primite-dragon-ether-beryl", "tribute")} ${cites("primite-dragon-ether-beryl", "notes-tribute-ignition")} Tributes itself, as a cost, to send 1 Normal Monster from the Deck to the GY, as an Ignition Effect of the Monster Zone`, () => {
			const start = board({ monsters: [card], deck: [NORMAL, "fixture-effect-4", "fixture-primite-normal"] });
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const chosen = play(start, `activate ${card}`);
			// The cost is paid at activation: it is in the GY already; the Normal Monster is chosen when the effect resolves.
			expect(find(chosen, card).zone).toBe("graveyard");
			expect(offered(chosen)).toEqual(["choose fixture-normal-4", "choose fixture-primite-normal"]);
			const done = asked(play(chosen, "choose fixture-primite-normal"));
			expect(codes(done, "you", "graveyard").sort()).toEqual([card, "fixture-primite-normal"].sort());
			// Not with no Normal Monster in the Deck, not from the hand, not in the opponent's turn.
			expect(own(board({ monsters: [card], deck: ["fixture-effect-4"] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ hand: [card], deck: [NORMAL] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ monsters: [card], deck: [NORMAL] }, {}, { everyWindow: true }, "rival"), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-dragon-ether-beryl", "once")} can be used once per turn by name: another copy cannot, and the Normal Summon effect has no such limit`, () => {
			const start = board({ monsters: [card, card], deck: [NORMAL, NORMAL] });
			expect(own(start, `activate ${card}`)).toHaveLength(2);
			const used = reopen(asked(play(start, `activate ${card}`)));
			expect(own(used, `activate ${card}`)).toEqual([]);
		});
	});

	describe("its Standby Phase effect", () => {
		const grave = (you: SideSpec = {}, rival: SideSpec = {}) => board({ graveyard: [card], ...you }, rival);
		it(`${cites("primite-dragon-ether-beryl", "retrieve")} ${cites("primite-dragon-ether-beryl", "notes-retrieve-conditions")} adds itself from the GY to the hand during its controller's Standby Phase if they have a face-up Normal Monster in the Monster Zone or a Normal Monster in the GY`, () => {
			const inGrave = nextStandby(grave({ graveyard: [card, NORMAL] }));
			expect(own(inGrave, `activate ${card}`)).toEqual([`activate ${card}`]);
			const added = play(inGrave, `activate ${card}`);
			expect(codes(reopen(added), "you", "hand")).toEqual([card]);
			expect(codes(reopen(added), "you", "graveyard")).toEqual([NORMAL]);
			// A face-up Normal Monster in the Monster Zone is enough.
			expect(own(nextStandby(grave({ monsters: [NORMAL] })), `activate ${card}`)).toEqual([`activate ${card}`]);
			// A face-down one is not a Normal Monster you have; neither is an Effect Monster or the card itself.
			expect(own(nextStandby(grave({ facedown: [NORMAL], monsters: ["fixture-effect-4"], graveyard: [card, "fixture-effect-4"] })), `activate ${card}`)).toEqual([]);
			expect(own(nextStandby(grave()), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-dragon-ether-beryl", "retrieve")} is not offered in the opponent's Standby Phase, nor from the hand`, () => {
			const rivalStandby = nextStandby(grave({ graveyard: [card, NORMAL] }), 1);
			expect(rivalStandby.turn.player).toBe("rival");
			expect(own(rivalStandby, `activate ${card}`)).toEqual([]);
			expect(own(nextStandby(board({ hand: [card], graveyard: [NORMAL] })), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("primite-dragon-ether-beryl", "retrieve")} can also be activated later in that Standby Phase, once a Normal Monster reached the GY there (YGOProJudge only, asked 2026-11-26, no source cited)`, () => {
			const start = nextStandby(grave({ deck: [NORMAL] }));
			expect([start.turn.phase, own(start, `activate ${card}`)]).toEqual(["standby", []]);
			// A Normal Monster is sent from the Deck to the GY during the Standby Phase (a move standing for a resolved effect).
			const id = start.piles.you.deck.find((entry) => start.cards[entry]!.code === NORMAL)!;
			const later = moveCard(start, id, { zone: "graveyard" });
			expect(own(later, `activate ${card}`)).toEqual([`activate ${card}`]);
			expect(codes(reopen(play(later, `activate ${card}`)), "you", "hand")).toEqual([card]);
		});
		it(`${cites("primite-dragon-ether-beryl", "once")} lets the Standby Phase effect be used once per turn by name: a second copy in the GY has no use left that turn`, () => {
			const start = nextStandby(grave({ graveyard: [card, card, NORMAL] }));
			expect(own(start, `activate ${card}`)).toHaveLength(2);
			const first = reopen(play(start, `activate ${card}`));
			expect(own(first, `activate ${card}`)).toEqual([]);
		});
	});
});
