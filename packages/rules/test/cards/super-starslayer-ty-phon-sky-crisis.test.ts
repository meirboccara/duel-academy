import { describe, expect, it } from "vitest";
import { addModifier, attach, CARD_DEFS, type CardDef, canSpecialSummon, cites, type Duel, moveCard, printedFacts, specialSummon } from "../../src";
import { battleCards } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, lastingLines, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesExtraFixtures, settle } from "./blue-eyes-extra-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "super-starslayer-ty-phon-sky-crisis";
const gaps = gapCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...battleCards(),
	...blueEyesFixtures,
	...extraDeckFixtures,
	...blueEyesExtraFixtures,
	...Object.fromEntries(["fixture-giant"].map((code) => [code, gaps[code]!])),
};
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const idsOf = (duel: Duel, code: string): number[] => Object.values(duel.cards).filter((entry) => entry.code === code).map((entry) => entry.id);
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const effect = `activate ${card}`;
const summon = `special-summon ${card}`;
const twoFromExtra = (duel: Duel): Duel => idsOf(duel, "fixture-synchro-dragon-8").concat(idsOf(duel, "fixture-synchro-dragon-8-b")).reduce((next, id) => specialSummon(next, "rival", id), duel);
/** The opponent's turn 3, in which they Special Summon 2 monsters from the Extra Deck; then your Main Phase 1 of turn 4 (or the same turn, `later` false). */
function afterTheirTurn(you: SideSpec, rival: SideSpec = { extra: ["fixture-synchro-dragon-8", "fixture-synchro-dragon-8-b"] }, summons: (duel: Duel) => Duel = twoFromExtra): Duel {
	let duel = summons(position({ defs, options: { everyWindow: true }, turn: "rival", you, rival }));
	for (let guard = 0; guard < 80 && !(duel.turn.number === 4 && duel.turn.phase === "main1"); guard++) duel = play(duel, "pass");
	return duel;
}
/** Passes until the game state is open for the turn player again (the windows after a Summon). */
const open = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 8 && !(next.priority.open && next.priority.holder === next.turn.player && next.chain.length === 0 && !next.asking); guard++) next = play(next, "pass");
	return next;
};
/** Plays the alternative Summon: the zone chosen, the Summon let through. */
const alternative = (duel: Duel): Duel => {
	let done = play(duel, summon);
	for (let guard = 0; guard < 6 && (done.asking || !done.priority.open); guard++) done = play(done, offered(done).find((label) => label.startsWith("place") || label.startsWith("choose")) ?? "pass");
	return done;
};

describe("Super Starslayer TY-PHON - Sky Crisis, written as effect records", () => {
	it(`${cites("super-starslayer-ty-phon-sky-crisis", "facts")} is a DARK Fiend Xyz Effect Monster of Rank 12 with 2900 ATK and 2900 DEF`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Super Starslayer TY-PHON - Sky Crisis", attribute: "DARK", monsterType: "Fiend", frame: "xyz", rank: 12, atk: 2900, def: 2900 });
	});

	it(`${cites("super-starslayer-ty-phon-sky-crisis", "procedure")} is Xyz Summoned with 2 Level 12 monsters, which become its Xyz Materials`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["fixture-level-12-a", "fixture-level-12-b"], extra: [card] }))).toEqual([summon]);
		expect(summons(board({ monsters: ["fixture-level-12-a", "fixture-plain-8"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-level-12-a"], extra: [card] }))).toEqual([]);
		const done = play(board({ monsters: ["fixture-level-12-a", "fixture-level-12-b"], extra: [card] }), summon, "place 5");
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "xyz" });
		expect(codes(done, "you", "material").sort()).toEqual(["fixture-level-12-a", "fixture-level-12-b"]);
	});

	describe("its alternative Xyz Summon", () => {
		const mine: SideSpec = { monsters: ["fixture-giant", "fixture-plain-1"], extra: [card] };
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "alternative")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-alternative-not-effect")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-alternative-proper")} during the turn, or turn after, the opponent Special Summoned 2 or more monsters from the Extra Deck, it is Xyz Summoned by using 1 monster its controller controls with the highest ATK, the materials transferred`, () => {
			const attached = (duel: Duel) => attach(duel, find(duel, "fixture-light-xyz-dragon").id, find(duel, "fixture-plain-2").id);
			const start = afterTheirTurn({ monsters: ["fixture-light-xyz-dragon", "fixture-plain-1"], graveyard: ["fixture-plain-2"], extra: [card] });
			const duel = attached({ ...start });
			expect(own(duel, "special-summon")).toEqual([summon]);
			const done = alternative(duel);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "xyz" });
			// The Xyz Monster of the highest ATK (2500) is the material, and its own material goes under this card with it.
			expect(codes(done, "you", "monster").sort()).toEqual(["fixture-plain-1", card]);
			expect(codes(done, "you", "material").sort()).toEqual(["fixture-light-xyz-dragon", "fixture-plain-2"]);
			expect(done.cards[find(done, "fixture-plain-2").id]!.attachedTo).toBe(find(done, card).id);
			// The same turn too.
			const same = twoFromExtra(position({ defs, you: mine, rival: { extra: ["fixture-synchro-dragon-8", "fixture-synchro-dragon-8-b"] } }));
			expect(own(same, "special-summon")).toEqual([summon]);
			// With 1 such Summon, or 2 from elsewhere, or two turns later, it is not open.
			expect(own(afterTheirTurn(mine, { extra: ["fixture-synchro-dragon-8"] }), "special-summon")).toEqual([]);
			expect(own(afterTheirTurn(mine, { graveyard: ["fixture-plain-1", "fixture-plain-2"] }, (next) => next.piles.rival.graveyard.reduce((board, id) => specialSummon(board, "rival", id), next)), "special-summon")).toEqual([]);
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "alternative")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-alternative-highest")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-alternative-zero")} the highest ATK is the material, the player choosing among tied monsters, also when that ATK is 0`, () => {
			const tied = afterTheirTurn({ monsters: ["fixture-giant", "fixture-giant", "fixture-plain-1"], extra: [card] });
			expect(offered(play(tied, summon))).toEqual(["choose fixture-giant", "choose fixture-giant"]);
			const zero = afterTheirTurn({ monsters: ["blank"], extra: [card] });
			expect(own(zero, "special-summon")).toEqual([summon]);
			// Not a lower-ATK monster: with one monster of 4000 and another of 1500, only the first can be the material.
			const done = alternative(afterTheirTurn({ monsters: ["fixture-giant", "fixture-plain-5"], extra: [card] }));
			expect(codes(done, "you", "material")).toEqual(["fixture-giant"]);
			expect(codes(done, "you", "monster").sort()).toEqual(["fixture-plain-5", card].sort());
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "notes-alternative-main-phase")} is a Summon of the Main Phase only, as the Xyz Summon with the printed materials is`, () => {
			const start = afterTheirTurn(mine);
			expect(own(start, "special-summon")).toEqual([summon]);
			const inBattle = { ...start, turn: { ...start.turn, phase: "battle" as const } };
			expect(own(inBattle, "special-summon")).toEqual([]);
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "if-you-do")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-if-you-do-not-effect")} afterwards its controller cannot Normal or Special Summon for the rest of the turn, although the Summon itself can be made after a Normal Summon this turn`, () => {
			const start = afterTheirTurn({ hand: ["fixture-plain-4", "fixture-extra-call"], monsters: ["fixture-giant"], extra: [card, "fixture-synchro-dragon-8"] });
			// A Normal Summon was made first: the alternative Summon is still offered (it is not an effect and not a Summon of the hand).
			const normal = open(play(start, "summon fixture-plain-4", "pass", "pass"));
			expect(own(normal, summon)).toEqual([summon]);
			const done = alternative(start);
			expect(own(done, "summon")).toEqual([]);
			expect(own(done, "special-summon")).toEqual([]);
			expect(canSpecialSummon(done, "you", find(done, "fixture-plain-4").id)).toBe(false);
			expect(codes(done, "you", "hand")).toContain("fixture-extra-call");
			// The lock ends with the turn.
			let next = done;
			for (let guard = 0; guard < 80 && next.turn.number === 4; guard++) next = play(next, "pass");
			expect(canSpecialSummon(next, "you", find(next, "fixture-plain-4").id)).toBe(true);
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "qa-set-after")} the monster can still be Set afterwards, as a Set is not a Summon (Konami's Q&A fid 24169), but not Special Summoned face-down`, () => {
			const done = alternative(afterTheirTurn({ hand: ["fixture-plain-4"], monsters: ["fixture-giant"], extra: [card] }));
			expect(own(done, "set fixture-plain-4")).toEqual(["set fixture-plain-4"]);
			expect(own(done, "summon fixture-plain-4")).toEqual([]);
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "qa-extra-normal-summon")} no effect that gives an additional Normal Summon can be used after it: "Mausoleum of White"'s Summon is not offered (Konami's Q&A fid 17215)`, () => {
			const start = afterTheirTurn({ hand: ["effect-veiler"], faceupSpells: ["mausoleum-of-white"], monsters: ["fixture-giant"], extra: [card] });
			expect(own(start, "summon effect-veiler")).toContain("summon effect-veiler additional");
			const done = alternative(start);
			expect(own(done, "summon effect-veiler")).toEqual([]);
		});
	});

	describe("its Continuous Effect", () => {
		const duelWith = (typhon: boolean, you: SideSpec = {}, rival: SideSpec = {}): Duel => {
			const start = board({ extra: [card], ...you }, rival, { everyWindow: true });
			return typhon ? specialSummon(start, "you", find(start, card).id, { kind: "xyz", slot: 5 }) : start;
		};
		const activations = (duel: Duel) => offered(duel).filter((label) => label.startsWith("activate"));
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "lock")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-lock-field")} while this Xyz Summoned monster is on the field, neither player can activate the effects of monsters with 3000 or more ATK (monsters on the field only: YGOProJudge only)`, () => {
			const you: SideSpec = { monsters: ["fixture-strong-quick", "fixture-weak-quick"], hand: ["fixture-strong-quick"] };
			expect(activations(duelWith(false, you))).toEqual(["activate fixture-strong-quick", "activate fixture-strong-quick", "activate fixture-weak-quick"]);
			// The one on the field is stopped; the one in the hand is not (YGOProJudge only: a monster in the card text's sense is on the field).
			expect(activations(duelWith(true, you))).toEqual(["activate fixture-strong-quick", "activate fixture-weak-quick"]);
			// The other player's monsters are stopped as well.
			const theirs = duelWith(true, {}, { monsters: ["fixture-strong-quick", "fixture-weak-quick"] });
			const theirTurn = { ...theirs, turn: { ...theirs.turn, player: "rival" as const }, priority: { holder: "rival" as const, passed: [], open: true } };
			expect(activations(theirTurn)).toEqual(["activate fixture-weak-quick"]);
			expect(theirTurn.turn.player).toBe("rival");
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "lock")} says in the card's words what its Continuous Effect stops (a continuous effect is not on the board's lasting list, so its layer is put there as a lasting one)`, () => {
			const duel = duelWith(true);
			const layer = defs[card]!.effects!.find((record) => record.type === "continuous")!.modifies!(duel, find(duel, card))[0]!;
			expect(lastingLines(addModifier(duel, { affects: () => false, until: 3, layer })).join("\n")).toContain("both players cannot activate the effects of monsters with 3000 or more ATK");
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "notes-lock-both")} stops a monster that is unaffected by monster effects as well, and does not stop a Spell or Trap Card`, () => {
			const you: SideSpec = { monsters: ["fixture-strong-immune"], hand: ["fixture-normal-spell"] };
			expect(activations(duelWith(true, you))).toEqual(["activate fixture-normal-spell"]);
			expect(activations(duelWith(false, you)).sort()).toEqual(["activate fixture-normal-spell", "activate fixture-strong-immune"]);
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "notes-lock-field")} applies only to the Xyz Summoned card: put on the field otherwise, it stops nothing`, () => {
			const start = board({ monsters: [card, "fixture-strong-quick"] }, {}, { everyWindow: true });
			expect(activations(start)).toEqual(["activate fixture-strong-quick"]);
		});
	});

	describe("its Xyz Material effect", () => {
		const summoned = (you: SideSpec = {}, rival: SideSpec = {}): Duel => open(play(board({ monsters: ["fixture-level-12-a", "fixture-level-12-b"], extra: [card], ...you }, rival, { everyWindow: true }), summon, "place 5", "pass", "pass"));
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "detach")} ${cites("super-starslayer-ty-phon-sky-crisis", "notes-detach-field")} detaches 1 material from this card to return 1 monster from the field to the hand, once per turn`, () => {
			const duel = summoned({}, { monsters: ["fixture-plain-5"], facedown: ["fixture-plain-6"] });
			expect(find(duel, card).zone).toBe("monster");
			expect(codes(duel, "you", "material")).toHaveLength(2);
			expect(own(duel, effect).sort()).toEqual([`${effect} ~ fixture-level-12-a`, `${effect} ~ fixture-level-12-b`]);
			const asked = play(duel, `${effect} ~ fixture-level-12-a`, "pass", "pass");
			// Every monster on the field is a choice, this card and a face-down one included.
			expect(offered(asked).sort()).toEqual([`choose ${card}`, "choose fixture-plain-5", "choose fixture-plain-6"].sort());
			const done = settle(play(asked, "choose fixture-plain-6"));
			expect(codes(done, "you", "graveyard")).toEqual(["fixture-level-12-a"]);
			expect(codes(done, "rival", "hand")).toEqual(["fixture-plain-6"]);
			expect(codes(done, "you", "material")).toEqual(["fixture-level-12-b"]);
			expect(own(done, effect)).toEqual([]);
		});
		it(`${cites("super-starslayer-ty-phon-sky-crisis", "detach")} needs a material to detach`, () => {
			const duel = summoned();
			const empty = idsOf(duel, "fixture-level-12-a").concat(idsOf(duel, "fixture-level-12-b")).reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), duel);
			expect(own(empty, effect)).toEqual([]);
		});
	});
});
