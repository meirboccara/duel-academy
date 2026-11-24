import { describe, expect, it } from "vitest";
import { atk, banishWhenItLeaves, cites, destroyCard, flipFaceDown, type Duel, type GameEvent, materialsOf, negateCardEffects, redeal, viewFor } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec, rival: SideSpec = {}): Duel => position({ defs: gapCards(), you, rival });
/** Answers every question left with its first candidate (the materials and zones of a Summon). */
function settle(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 8 && next.asking; guard++) next = play(next, offered(next).find((name) => name !== "pass")!);
	return next;
}
/** The leaver Special Summoned by its own effect, with `hand` beside it. */
const summoned = (hand: string[], more: SideSpec = {}): Duel => settle(play(board({ hand: ["fixture-leaver", ...hand], ...more }), "activate fixture-leaver"));
const where = (duel: Duel): string => Object.values(duel.cards).find((card) => card.code === "fixture-leaver")!.zone;

/**
 * "... also banish it when it leaves the field" (`banishWhenItLeaves`, src/modifiers.ts): what a resolved effect leaves on a monster.
 * Deep-Eyes White Dragon, the Blue Abyss (text, and Konami's Japanese notes, OCG only); made-up cards with the same wording.
 */
describe("a monster that is banished when it leaves the field", () => {
	it(`${cites("rules", "banish-when-it-leaves-text")} destroyed by a card effect, it is banished instead of going to the GY, and the move still says it was destroyed`, () => {
		const up = summoned(["fixture-smite"]);
		expect(where(up)).toBe("monster");
		const done = play(up, "activate fixture-smite > fixture-leaver");
		expect(where(done)).toBe("banished");
		// The same destruction done directly, to read its event (the chain above has resolved and its events are no longer "live").
		const moved = destroyCard(up, up.piles.you.monster[0]!, { destruction: { cause: "game-mechanic" } }).live.slice().reverse().find((event): event is Extract<GameEvent, { type: "moved" }> => event.type === "moved" && event.before.code === "fixture-leaver");
		expect([moved?.reason, moved?.after.zone, moved?.after.face]).toEqual(["destroyed", "banished", "up"]);
	});
	it(`${cites("rules", "banish-when-it-leaves-text")} sent to the GY by an effect, it is banished instead`, () => {
		expect(where(play(summoned(["fixture-bury"]), "activate fixture-bury > fixture-leaver"))).toBe("banished");
	});
	it(`${cites("rules", "banish-when-it-leaves-text")} returned to the hand or shuffled into the Deck, it is banished instead (YGOProJudge only, no source cited)`, () => {
		expect(where(play(summoned(["fixture-bounce"]), "activate fixture-bounce > fixture-leaver"))).toBe("banished");
		expect(where(play(summoned(["fixture-spin"]), "activate fixture-spin > fixture-leaver"))).toBe("banished");
	});
	it(`${cites("rules", "xyz-material-not-on-the-field")} used as Xyz Material it is not banished: it becomes a material (YGOProJudge only for "not banished"; RB10 for effects that activate)`, () => {
		const ready = summoned([], { monsters: ["fixture-plain"], extra: ["fixture-xyz-4"] });
		const stacked = settle(play(ready, "special-summon fixture-xyz-4"));
		const monster = stacked.piles.you.monster[0]!;
		expect(codes(stacked, "you", "monster")).toEqual(["fixture-xyz-4"]);
		expect(materialsOf(stacked, monster).map((id) => stacked.cards[id]!.code).sort()).toEqual(["fixture-leaver", "fixture-plain"]);
		expect(where(stacked)).toBe("material");
	});
	it(`${cites("rules", "banish-when-it-leaves-ends-face-down")} once it is no longer face-up in the Monster Zone the state is over: flipped face-down, then destroyed, it goes to the GY`, () => {
		const down = play(summoned(["fixture-book", "fixture-smite"]), "activate fixture-book > fixture-leaver", "pass");
		expect(Object.values(down.cards).find((card) => card.code === "fixture-leaver")!.face).toBe("down");
		expect(where(play(down, "activate fixture-smite > fixture-leaver"))).toBe("graveyard");
	});
	it(`${cites("rules", "own-lasting-effect-stops-while-negated")} what its own effect left on it (its ATK) stops applying while its effects are negated, and applies again afterwards`, () => {
		const up = summoned([]);
		const id = up.piles.you.monster[0]!;
		expect(atk(up, id)).toBe(3000);
		const negated = negateCardEffects(up, id, up.turn.number);
		expect(atk(negated, id)).toBe(0);
		expect(atk({ ...negated, modifiers: negated.modifiers.filter((modifier) => modifier.layer.kind !== "negate") }, id)).toBe(3000);
	});
	it("once the monster is no longer that card (it left the field, or was turned face-down), the state is not kept: no dead modifier stays in the Duel", () => {
		const duel = board({ hand: ["fixture-smite"], monsters: ["fixture-plain"] });
		const id = duel.piles.you.monster[0]!;
		const marked = banishWhenItLeaves(duel, id);
		expect(marked.modifiers.map((modifier) => modifier.layer.kind)).toEqual(["leaves"]);
		const gone = play(marked, "activate fixture-smite > fixture-plain");
		expect([codes(gone, "you", "banished"), gone.modifiers]).toEqual([["fixture-plain"], []]);
		expect(flipFaceDown(marked, id).modifiers).toEqual([]);
		// Another card's state is untouched by that move.
		const two = board({ hand: ["fixture-smite"], monsters: ["fixture-plain", "fixture-giant"] });
		const both = two.piles.you.monster.reduce((next, monster) => banishWhenItLeaves(next, monster), two);
		const one = play(both, "activate fixture-smite > fixture-plain");
		expect(one.modifiers.map((modifier) => (typeof modifier.affects === "function" ? null : one.cards[modifier.affects.card]!.code))).toEqual(["fixture-giant"]);
	});
	it("the bot's view and a re-dealt world keep the state: the monster is still banished when it leaves", () => {
		const up = summoned(["fixture-smite"]);
		const world = redeal(viewFor(up, "you"), 5);
		expect(where(play(world, "activate fixture-smite > fixture-leaver"))).toBe("banished");
	});
});
