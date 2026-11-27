import { describe, expect, it } from "vitest";
import { cites, flipFaceDown, isNegated, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { nextTurn } from "../rules/continuous-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { activations, board, find, resolve, threeSpells } from "./sky-striker-fixtures";

const card = "sky-striker-mecha-widow-anchor";
const aim = (target: string) => `activate ${card} > ${target}`;

describe("Sky Striker Mecha - Widow Anchor, written as effect records", () => {
	it(`${cites("sky-striker-mecha-widow-anchor", "facts")} is a Quick-Play Spell, a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Mecha - Widow Anchor", archetypes: ["Sky Striker"], mentions: ["Sky Striker Mecha - Widow Anchor"] });
	});

	describe("its activation", () => {
		it(`${cites("sky-striker-mecha-widow-anchor", "condition")} needs no monster of the player in a Main Monster Zone (the Extra Monster Zone does not count)`, () => {
			const rival = { monsters: ["fixture-filler"] };
			expect(activations(board({ hand: [card] }, rival), card)).toEqual([aim("fixture-filler")]);
			expect(activations(board({ hand: [card], monsters: ["fixture-normal"] }, rival), card)).toEqual([]);
			expect(activations(board({ hand: [card], facedown: ["fixture-normal"] }, rival), card)).toEqual([]);
			expect(activations(board({ hand: [card], extraZone: ["fixture-link"] }, rival), card)).toEqual([aim("fixture-filler"), aim("fixture-link")].sort());
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "notes-targets")} targets 1 face-up Effect Monster on the field, either side: not a Normal Monster, not a face-down monster`, () => {
			const start = board({ hand: [card], extraZone: ["fixture-link"] }, { monsters: ["fixture-filler", "fixture-normal"], facedown: ["fixture-drawer"] });
			expect(activations(start, card)).toEqual([aim("fixture-filler"), aim("fixture-link")].sort());
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "notes-no-damage-step")} cannot be activated in the Damage Step, but can in the Battle Step before it`, () => {
			const rival = board({ set: [card] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle");
			const declared = play(rival, "attack fixture-filler directly");
			expect(activations(play(declared, "pass"), card)).toEqual([aim("fixture-filler")]);
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			expect(activations(mine, card)).toEqual([]);
		});
	});

	describe("when it resolves", () => {
		it(`${cites("sky-striker-mecha-widow-anchor", "negate")} negates the effects of the target until the end of this turn (fewer than 3 Spells: nothing else, nothing asked), and they apply again the next turn`, () => {
			const start = board({ hand: [card], graveyard: threeSpells.slice(0, 2) }, { monsters: ["fixture-filler"] });
			const id = find(start, "fixture-filler").id;
			const done = resolve(play(start, aim("fixture-filler")));
			expect(isNegated(done, id)).toBe(true);
			expect(done.asking).toBeFalsy();
			expect(find(done, "fixture-filler").controller).toBe("rival");
			expect(isNegated(nextTurn(done, done.turn.number + 1), id)).toBe(false);
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "notes-nothing-if-not-face-up")} nothing happens when the target is no longer face-up in the Monster Zone when it resolves`, () => {
			const start = board({ hand: [card], graveyard: threeSpells }, { monsters: ["fixture-filler"] });
			const id = find(start, "fixture-filler").id;
			const chained = play(start, aim("fixture-filler"));
			const down = resolve(flipFaceDown(chained, id));
			expect(isNegated(down, id)).toBe(false);
			expect(down.asking).toBeFalsy();
			expect(find(down, "fixture-filler").controller).toBe("rival");
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "control")} ${cites("sky-striker-mecha-widow-anchor", "notes-then")} with 3 or more Spells in the Graveyard the player may then take control of the target until the End Phase, after the negation; declining leaves it`, () => {
			const start = board({ hand: [card], graveyard: threeSpells }, { monsters: ["fixture-filler"] });
			const id = find(start, "fixture-filler").id;
			const asked = resolve(play(start, aim("fixture-filler")));
			// The negation is done first (the two parts are not simultaneous).
			expect(isNegated(asked, id)).toBe(true);
			expect(offered(asked)).toContain(`choose ${card}`);
			const taken = play(asked, `choose ${card}`);
			const placed = taken.asking ? play(taken, "place 0") : taken;
			expect(find(placed, "fixture-filler")).toMatchObject({ controller: "you", zone: "monster" });
			// The negation stands while the player controls the monster (YGOProJudge only; no Konami page settles it).
			expect(isNegated(placed, id)).toBe(true);
			expect(find(play(asked, "pass"), "fixture-filler").controller).toBe("rival");
			// Until the End Phase: it goes back to its controller, and the negation lasts to the end of the turn.
			const later = nextTurn(placed, placed.turn.number + 1);
			expect(find(later, "fixture-filler")).toMatchObject({ controller: "rival", zone: "monster" });
			expect(isNegated(later, id)).toBe(false);
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "control")} ${cites("sky-striker-mecha-widow-anchor", "negate")} the control goes back in the End Phase and the monster is still negated for the rest of that turn (YGOProJudge only)`, () => {
			const start = board({ hand: [card], graveyard: threeSpells }, { monsters: ["fixture-filler"] }, {}, "you", "main2");
			const id = find(start, "fixture-filler").id;
			const taken = play(resolve(play(start, aim("fixture-filler"))), `choose ${card}`, "place 0");
			expect(find(taken, "fixture-filler")).toMatchObject({ controller: "you" });
			// Both players pass, up to the End Phase where the control goes back.
			let end = taken;
			for (let guard = 0; guard < 6 && end.turn.phase !== "end"; guard++) end = play(end, "pass");
			expect([end.turn.phase, offered(end)]).toEqual(["end", ["apply fixture-filler"]]);
			const back = play(end, "apply fixture-filler", "place 2");
			expect(find(back, "fixture-filler")).toMatchObject({ controller: "rival", zone: "monster" });
			expect([back.turn.phase, isNegated(back, id)]).toEqual(["end", true]);
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "control")} no control is offered over a monster the player already controls (an Effect Monster of their Extra Monster Zone is negated only)`, () => {
			const start = board({ hand: [card], graveyard: threeSpells, extraZone: ["fixture-link"] });
			const done = resolve(play(start, aim("fixture-link")));
			expect(isNegated(done, find(start, "fixture-link").id)).toBe(true);
			expect(done.asking).toBeFalsy();
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "control")} can take control of a monster of an Extra Monster Zone: it goes to a free Main Monster Zone`, () => {
			const start = board({ hand: [card], graveyard: threeSpells }, { extraZone: ["fixture-link"] });
			const asked = resolve(play(start, aim("fixture-link")));
			const taken = play(asked, `choose ${card}`);
			const placed = taken.asking ? play(taken, "place 0") : taken;
			expect(find(placed, "fixture-link")).toMatchObject({ controller: "you", zone: "monster", slot: 0 });
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "qa-negated-cost")} an effect of the negated monster activated in the Monster Zone stays negated though its cost removed the monster`, () => {
			const start = board({ hand: [card] }, { monsters: ["fixture-drawer"], deck: ["fixture-filler", "fixture-big"] });
			const done = resolve(play(start, aim("fixture-drawer")));
			const answered = resolve(play(done.priority.holder === "rival" ? done : play(done, "pass"), "activate fixture-drawer"));
			// The cost was paid (the monster is in the Graveyard) and nothing was drawn.
			expect(codes(answered, "rival", "graveyard")).toEqual(["fixture-drawer"]);
			expect(codes(answered, "rival", "hand")).toEqual([]);
			// Without the negation the same effect draws 1 card.
			const free = board({ hand: [card] }, { monsters: ["fixture-drawer"], deck: ["fixture-filler", "fixture-big"] });
			const drawn = resolve(play(free.priority.holder === "rival" ? free : play(free, "pass"), "activate fixture-drawer"));
			expect(codes(drawn, "rival", "hand")).toHaveLength(1);
		});
	});
});
