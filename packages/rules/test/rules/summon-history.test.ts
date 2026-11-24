import { describe, expect, it } from "vitest";
import { canSpecialSummon, cites, type Duel, moveCard, specialSummon, summonedCount, viewFor } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const idsOf = (duel: Duel, code: string): number[] => Object.values(duel.cards).filter((card) => card.code === code).map((card) => card.id);
/** The opponent's turn 3, in which they Special Summon these monsters from where they are; then the Duel at your Main Phase 1 of turn `turn`. */
function afterTheirTurn(you: SideSpec, rival: SideSpec, summon: (duel: Duel) => Duel, turn = 4): Duel {
	let duel = summon(position({ defs: gapCards(), turn: "rival", you, rival }));
	for (let guard = 0; guard < 80 && !(duel.turn.number === turn && duel.turn.phase === "main1"); guard++) duel = play(duel, "pass");
	return duel;
}
const twoFromExtra = (duel: Duel): Duel => idsOf(duel, "fixture-synchro").reduce((next, id) => specialSummon(next, "rival", id), duel);
const TYPHON = "special-summon fixture-typhon";

/**
 * "During the turn, or turn after, your opponent Special Summoned 2 or more monsters from the Extra Deck, you can also Xyz Summon this
 * card by using 1 monster you control with the highest ATK ... If you do, you cannot Normal or Special Summon for the rest of this
 * turn": the Summons of this turn and the last one are noted (`summonedCount`), and an alternative Xyz Summon can leave something
 * behind (`ifYouDo`). Super Starslayer TY-PHON - Sky Crisis (text); made-up cards with the same wording.
 */
describe("the Summons of this turn and the last, and an Xyz alternative with a consequence", () => {
	it(`${cites("rules", "summons-of-the-turn-text")} the turn after the opponent Special Summoned 2 monsters from the Extra Deck, the alternative Xyz Summon is open; with 1, or with 2 from elsewhere, it is not`, () => {
		const mine = { monsters: ["fixture-giant", "fixture-plain"], extra: ["fixture-typhon"] };
		const open = afterTheirTurn(mine, { extra: ["fixture-synchro", "fixture-synchro"] }, twoFromExtra);
		expect([summonedCount(open, { player: "rival", turn: 3, from: "extra", how: "special" }), summonedCount(open, { player: "rival", turn: 4 }), summonedCount(open, { player: "you", turn: 3 })]).toEqual([2, 0, 0]);
		expect(offered(open)).toContain(TYPHON);
		const one = afterTheirTurn(mine, { extra: ["fixture-synchro"] }, twoFromExtra);
		expect(offered(one)).not.toContain(TYPHON);
		const fromGraveyard = afterTheirTurn(mine, { graveyard: ["fixture-plain", "fixture-plain"] }, (duel) => duel.piles.rival.graveyard.reduce((next, id) => specialSummon(next, "rival", id), duel));
		expect([summonedCount(fromGraveyard, { player: "rival", turn: 3 }), summonedCount(fromGraveyard, { player: "rival", turn: 3, from: "extra" })]).toEqual([2, 0]);
		expect(offered(fromGraveyard)).not.toContain(TYPHON);
	});
	it(`${cites("rules", "summons-of-the-turn-text")} in the same turn too; two turns later no longer, and a monster that left since still counts`, () => {
		const mine = { monsters: ["fixture-giant"], extra: ["fixture-typhon"] };
		const sameTurn = twoFromExtra(position({ defs: gapCards(), you: mine, rival: { extra: ["fixture-synchro", "fixture-synchro"] } }));
		expect(offered(sameTurn)).toContain(TYPHON);
		const gone = idsOf(sameTurn, "fixture-synchro").reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), sameTurn);
		expect(offered(gone)).toContain(TYPHON);
		const later = afterTheirTurn(mine, { extra: ["fixture-synchro", "fixture-synchro"] }, twoFromExtra, 6);
		expect([later.turn.player, offered(later).includes(TYPHON), later.summons.length]).toEqual(["you", false, 0]);
	});
	it(`${cites("rules", "xyz-alternative-if-you-do-text")} the monster with the highest ATK is the material (the player chooses among tied ones), and afterwards its player cannot Normal or Special Summon that turn`, () => {
		const open = afterTheirTurn({ hand: ["fixture-plain", "fixture-leaver"], monsters: ["fixture-giant", "fixture-plain"], extra: ["fixture-typhon"] }, { extra: ["fixture-synchro", "fixture-synchro"] }, twoFromExtra);
		expect(offered(open)).toEqual(expect.arrayContaining(["summon fixture-plain", "activate fixture-leaver", TYPHON]));
		let done = play(open, TYPHON);
		// The 4000 ATK monster is the only legal material: nothing is asked but the zone.
		for (let guard = 0; guard < 4 && done.asking; guard++) {
			expect(done.asking.zones).toBe(true);
			done = play(done, offered(done)[0]!);
		}
		for (let guard = 0; guard < 4 && !done.priority.open; guard++) done = play(done, "pass");
		expect([codes(done, "you", "monster").sort(), codes(done, "you", "material")]).toEqual([["fixture-plain", "fixture-typhon"], ["fixture-giant"]]);
		// No Normal Summon is offered any more (a Set still is), and an effect Special Summons nothing.
		expect(offered(done)).not.toContain("summon fixture-plain");
		expect(offered(done)).toContain("set fixture-plain");
		expect(canSpecialSummon(done, "you", idsOf(done, "fixture-leaver")[0]!)).toBe(false);
		expect(canSpecialSummon(open, "you", idsOf(open, "fixture-leaver")[0]!)).toBe(true);
		const tied = afterTheirTurn({ monsters: ["fixture-giant", "fixture-giant"], extra: ["fixture-typhon"] }, { extra: ["fixture-synchro", "fixture-synchro"] }, twoFromExtra);
		expect(offered(play(tied, TYPHON))).toEqual(["choose fixture-giant", "choose fixture-giant"]);
	});
	it("the notes are public: the opponent's view keeps them", () => {
		const open = afterTheirTurn({ extra: ["fixture-typhon"] }, { extra: ["fixture-synchro", "fixture-synchro"] }, twoFromExtra);
		expect(summonedCount(viewFor(open, "you").duel, { player: "rival", turn: 3, from: "extra" })).toBe(2);
	});
});
