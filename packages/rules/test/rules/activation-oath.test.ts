import { describe, expect, it } from "vitest";
import { cites, drawLocked, drewByEffect, type Duel, redeal, viewFor } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const deck = ["fixture-plain", "fixture-plain", "fixture-plain"];
function board(you: SideSpec, rival: SideSpec = {}, log: string[] = []): Duel {
	return position({ defs: gapCards(log), options: { everyWindow: true }, you: { deck, ...you }, rival });
}
/** Passes until the game state is open again for the turn player. */
function settled(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 8 && !(next.priority.open && next.chain.length === 0); guard++) next = play(next, "pass");
	return next;
}

/**
 * "You cannot draw cards by card effects the turn you activate this card" (`EffectRecord.oath`, `drewByEffect`): not an effect but
 * a condition of the activation, applied from the moment the card is activated. Pot of Prosperity's text, Konami's Japanese notes and
 * Q&A fid 23378 (OCG only); made-up cards with the same wording.
 */
describe("a restriction for the turn a card is activated", () => {
	it(`${cites("rules", "oath-text")} ${cites("rules", "oath-from-activation")} from the moment the card is activated, before it resolves, its player cannot draw by card effects: a draw card cannot be chained to it`, () => {
		const duel = board({ hand: ["fixture-prosper", "fixture-draw-quick"] });
		expect(offered(duel)).toContain("activate fixture-draw-quick");
		const activated = play(duel, "activate fixture-prosper", "pass");
		expect([activated.chain.length, activated.priority.holder]).toEqual([1, "you"]);
		expect(drawLocked(activated, "you")).toBe(true);
		expect(drawLocked(activated, "rival")).toBe(false);
		expect(offered(activated)).toEqual(["pass"]);
		const resolved = settled(activated);
		expect(offered(resolved).filter((name) => name.startsWith("activate"))).toEqual([]);
	});
	it(`${cites("rules", "oath-not-after-a-draw")} it cannot be activated in a turn in which its player already drew by a card effect`, () => {
		const duel = board({ hand: ["fixture-prosper", "fixture-draw-quick"] });
		expect(drewByEffect(duel, "you")).toBe(false);
		const drawn = settled(play(duel, "activate fixture-draw-quick"));
		expect([drewByEffect(drawn, "you"), drewByEffect(drawn, "rival")]).toEqual([true, false]);
		expect(codes(drawn, "you", "hand")).toEqual(["fixture-prosper", "fixture-plain"]);
		expect(offered(drawn)).not.toContain("activate fixture-prosper");
	});
	it(`${cites("rules", "oath-activation-negated-lifts")} if its activation is negated, its player can draw by card effects again that turn`, () => {
		const log: string[] = [];
		const duel = board({ hand: ["fixture-prosper", "fixture-draw-quick"] }, { set: ["fixture-negate-activation"] }, log);
		const negated = settled(play(duel, "activate fixture-prosper", "activate fixture-negate-activation"));
		expect(log).toEqual([]);
		expect(drawLocked(negated, "you")).toBe(false);
		expect(offered(negated)).toContain("activate fixture-draw-quick");
	});
	it(`${cites("rules", "oath-effect-negated-stays")} if only its effect is negated, its player still cannot draw by card effects that turn`, () => {
		const log: string[] = [];
		const duel = board({ hand: ["fixture-prosper", "fixture-draw-quick"] }, { set: ["fixture-negate-the-effect"] }, log);
		const negated = settled(play(duel, "activate fixture-prosper", "activate fixture-negate-the-effect"));
		expect(log).toEqual([]);
		expect(drawLocked(negated, "you")).toBe(true);
		expect(offered(negated)).not.toContain("activate fixture-draw-quick");
	});
	it(`${cites("rules", "oath-text")} the restriction and the record of the draw end with the turn`, () => {
		const duel = board({ hand: ["fixture-prosper", "fixture-draw-quick"] });
		let next = settled(play(duel, "activate fixture-prosper"));
		expect(drawLocked(next, "you")).toBe(true);
		for (let guard = 0; guard < 40 && next.turn.number === duel.turn.number; guard++) next = play(next, "pass");
		expect(next.turn.number).toBe(duel.turn.number + 1);
		expect(drawLocked(next, "you")).toBe(false);
		const drawn = settled(play(duel, "activate fixture-draw-quick"));
		let later = drawn;
		for (let guard = 0; guard < 40 && later.turn.number === duel.turn.number; guard++) later = play(later, "pass");
		expect(drewByEffect(later, "you")).toBe(false);
	});
	it("the bot's view and a re-dealt world keep the restriction", () => {
		const activated = play(board({ hand: ["fixture-prosper", "fixture-draw-quick"] }), "activate fixture-prosper", "pass");
		expect(drawLocked(viewFor(activated, "rival").duel, "you")).toBe(true);
		expect(drawLocked(redeal(viewFor(activated, "you"), 3), "you")).toBe(true);
	});
});
