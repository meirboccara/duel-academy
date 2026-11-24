import { describe, expect, it } from "vitest";
import { cites, damageFor, type Duel, type GameEvent, redeal, viewFor, watch } from "../../src";
import { play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec, phase: "main1" | "battle" = "main1"): Duel => position({ defs: gapCards(), phase, you });
/** Passes until the game state is open again for the turn player. */
function settled(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 12 && !(next.priority.open && next.chain.length === 0 && !next.battle); guard++) next = play(next, "pass");
	return next;
}

/**
 * "For the rest of this turn after this card resolves, any damage your opponent takes is halved" (the `damage` layer, `damageFor`,
 * src/modifiers.ts and src/life.ts). Pot of Prosperity (text, Konami's Japanese notes and Q&A fid 23511, OCG only); made-up cards.
 */
describe("damage a player takes is halved", () => {
	it(`${cites("rules", "damage-halved-text")} ${cites("rules", "damage-halved-at-resolution")} once the effect has resolved, effect damage to that player is halved for the rest of the turn; the other player's is not`, () => {
		const duel = board({ hand: ["fixture-halver", "fixture-burn", "fixture-burn", "fixture-self-burn"] });
		expect(settled(play(duel, "activate fixture-burn")).lp).toEqual({ you: 8000, rival: 7000 });
		const halved = play(duel, "activate fixture-halver", "pass");
		expect([damageFor(halved, "rival", 1000), damageFor(halved, "you", 1000)]).toEqual([500, 1000]);
		const burned = settled(play(settled(play(halved, "activate fixture-burn")), "activate fixture-self-burn"));
		expect(burned.lp).toEqual({ you: 7000, rival: 7500 });
	});
	it(`${cites("rules", "damage-halved-text")} battle damage is halved too, and the battle-damage event carries the damage really taken`, () => {
		const duel = board({ hand: ["fixture-halver"], monsters: ["fixture-white"] });
		const halved = settled(play(duel, "activate fixture-halver"));
		let seen: GameEvent | undefined;
		const spy = watch({ ...halved, turn: { ...halved.turn, phase: "battle" } }, { card: halved.cards[1]!, player: "you" }, { until: halved.turn.number, event: (_duel, event) => event.type === "battle-damage", apply: (next, _self, event) => ((seen = event), next) });
		const done = settled(play(spy, "attack fixture-white directly"));
		expect(done.lp).toEqual({ you: 8000, rival: 6500 });
		expect(seen).toMatchObject({ type: "battle-damage", player: "rival", amount: 1500 });
	});
	it(`${cites("rules", "damage-halved-does-not-stack")} two such effects do not add up: the damage is halved once`, () => {
		const duel = board({ hand: ["fixture-halver", "fixture-halver", "fixture-burn"] });
		const twice = settled(play(settled(play(duel, "activate fixture-halver")), "activate fixture-halver"));
		expect(twice.modifiers.filter((modifier) => modifier.layer.kind === "damage")).toHaveLength(2);
		expect(settled(play(twice, "activate fixture-burn")).lp.rival).toBe(7500);
	});
	it(`${cites("rules", "damage-halved-text")} it ends with the turn; half of an odd amount is rounded up (the core's reading, no page read)`, () => {
		const duel = board({ hand: ["fixture-halver", "fixture-burn-odd"] });
		const halved = settled(play(duel, "activate fixture-halver"));
		expect(damageFor(halved, "rival", 1025)).toBe(513);
		expect(settled(play(halved, "activate fixture-burn-odd")).lp.rival).toBe(8000 - 513);
		let later = halved;
		for (let guard = 0; guard < 40 && later.turn.number === duel.turn.number; guard++) later = play(later, "pass");
		expect(damageFor(later, "rival", 1000)).toBe(1000);
	});
	it("the bot's view and a re-dealt world keep it", () => {
		const halved = settled(play(board({ hand: ["fixture-halver", "fixture-burn"] }), "activate fixture-halver"));
		expect(damageFor(viewFor(halved, "rival").duel, "rival", 1000)).toBe(500);
		expect(damageFor(redeal(viewFor(halved, "rival"), 9), "rival", 1000)).toBe(500);
	});
});
