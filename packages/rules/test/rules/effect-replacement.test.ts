import { describe, expect, it } from "vitest";
import { cites, type Duel, type GameEvent } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { replaceCards } from "./replace-fixtures";

/** The opponent's turn (they activate their monster's effect), every window shown. */
function board(you: SideSpec, rival: SideSpec): { duel: Duel; log: string[]; defs: ReturnType<typeof replaceCards> } {
	const log: string[] = [];
	const defs = replaceCards(log);
	return { duel: position({ defs, turn: "rival", options: { everyWindow: true }, you, rival }), log, defs };
}
const DRAWER = "activate fixture-big-drawer ~ fixture-vanilla";
const hand = ["fixture-vanilla"];
const deck = ["fixture-big", "fixture-big", "fixture-big"];

/**
 * "The activated effect becomes '...'" (`replaceEffect`, src/chain.ts): the Chain Link keeps its activation, its cost and its
 * once-per-turn use; only what it does when it resolves is replaced, and it is still the effect of the player who activated it.
 * Prototype Sky Striker Ace - Amatsu's text (TCG) and Konami's Japanese notes and Q&A on it (OCG only).
 */
describe("replacing an effect on the chain", () => {
	it(`${cites("rules", "replace-effect-text")} ${cites("rules", "replace-effect-opponent-chooses")} the replaced link does the new thing and not what its card says; the player who activated it makes its choice`, () => {
		const { duel, log } = board({ extraZone: ["fixture-rewriter"], monsters: ["fixture-plain-ace"] }, { monsters: ["fixture-big-drawer"], hand, deck });
		const answered = play(duel, DRAWER, "activate fixture-rewriter");
		expect(answered.chain.map((link) => [link.card.code, link.player])).toEqual([["fixture-big-drawer", "rival"], ["fixture-rewriter", "you"]]);
		const asked = play(answered, "pass", "pass");
		// Chain Link 2 has resolved; Chain Link 1 now destroys 1 "Fixture Ace" Link Monster its player's opponent controls: its player chooses.
		expect([asked.asking?.player, offered(asked)]).toEqual(["rival", ["choose fixture-plain-ace", "choose fixture-rewriter"]]);
		const done = play(asked, "choose fixture-plain-ace");
		expect(log).toEqual(["fixture-rewriter", "replaced effect of fixture-big-drawer resolves for rival"]);
		expect([codes(done, "you", "graveyard"), codes(done, "you", "monster"), codes(done, "rival", "hand")]).toEqual([["fixture-plain-ace"], ["fixture-rewriter"], []]);
	});
	it(`${cites("rules", "replace-effect-text")} the link keeps its activation, its cost and its once-per-turn use: the cost stays paid and the effect cannot be activated again this turn`, () => {
		const { duel } = board({ extraZone: ["fixture-rewriter"] }, { monsters: ["fixture-big-drawer"], hand: ["fixture-vanilla", "fixture-vanilla"], deck });
		const done = play(duel, DRAWER, "activate fixture-rewriter", "pass", "pass");
		expect(codes(done, "rival", "graveyard")).toEqual(["fixture-vanilla"]);
		expect(done.activations.map((activation) => activation.card.code)).toEqual(["fixture-big-drawer", "fixture-rewriter"]);
		let open = done;
		for (let guard = 0; guard < 6 && !(open.priority.open && open.priority.holder === "rival"); guard++) open = play(open, "pass");
		expect(offered(open).filter((name) => name.startsWith("activate"))).toEqual([]);
	});
	it(`${cites("rules", "replace-effect-still-opponents-effect")} what it destroys is destroyed by the effect of the card that was activated, activated by its player`, () => {
		const { duel, log } = board({ extraZone: ["fixture-avenging-ace"], monsters: ["fixture-rewriter"] }, { monsters: ["fixture-big-drawer"], hand, deck });
		const done = play(duel, DRAWER, "activate fixture-rewriter", "pass", "pass", "choose fixture-avenging-ace");
		const destroyed = done.live.concat(done.waiting.map((waiting) => waiting.event)).find((event): event is Extract<GameEvent, { type: "moved" }> => event.type === "moved" && event.before.code === "fixture-avenging-ace");
		expect(destroyed?.destruction).toMatchObject({ cause: "effect", player: "rival", source: { code: "fixture-big-drawer" } });
		// Its "destroyed by your opponent's card effect" trigger is met.
		let next = done;
		for (let guard = 0; guard < 6 && !log.includes("fixture-avenging-ace"); guard++) next = play(next, "pass");
		expect(log).toContain("fixture-avenging-ace");
	});
	it(`${cites("rules", "replace-effect-nothing-done")} with nothing for the new effect to do when it resolves, neither it nor the original effect is applied`, () => {
		// The rewriter is the only "Fixture Ace" Link Monster, and is sent to the GY by Chain Link 3.
		const { duel, log } = board({ extraZone: ["fixture-rewriter"] }, { monsters: ["fixture-big-drawer"], hand, deck, set: ["fixture-send-all"] });
		const done = play(duel, DRAWER, "activate fixture-rewriter", "activate fixture-send-all", "pass", "pass");
		expect(done.asking).toBeNull();
		expect(log).toEqual(["fixture-rewriter", "replaced effect of fixture-big-drawer resolves for rival"]);
		expect([codes(done, "rival", "hand"), codes(done, "you", "graveyard")]).toEqual([[], ["fixture-rewriter"]]);
	});
	it(`${cites("rules", "replace-effect-not-applied-to-monster")} it is not applied to the monster: the effect of a monster unaffected by other cards' effects is replaced too`, () => {
		const { duel, log } = board({ extraZone: ["fixture-rewriter"] }, { monsters: ["fixture-immune-drawer"], hand, deck });
		const done = play(duel, "activate fixture-immune-drawer ~ fixture-vanilla", "activate fixture-rewriter", "pass", "pass");
		expect(log).toEqual(["fixture-rewriter", "replaced effect of fixture-immune-drawer resolves for rival"]);
		expect([codes(done, "you", "graveyard"), codes(done, "rival", "hand")]).toEqual([["fixture-rewriter"], []]);
	});
	it(`${cites("rules", "replace-effect-protected-choice")} a monster that cannot be destroyed by card effects may be chosen: it stays, and the effect has finished resolving`, () => {
		const { duel } = board({ extraZone: ["fixture-rewriter"], monsters: ["fixture-proof-ace"] }, { monsters: ["fixture-big-drawer"], hand, deck });
		const asked = play(duel, DRAWER, "activate fixture-rewriter", "pass", "pass");
		expect(offered(asked)).toEqual(["choose fixture-proof-ace", "choose fixture-rewriter"]);
		const done = play(asked, "choose fixture-proof-ace");
		expect([codes(done, "you", "monster").sort(), codes(done, "you", "graveyard"), codes(done, "rival", "hand"), done.chain.length]).toEqual([["fixture-proof-ace", "fixture-rewriter"], [], [], 0]);
	});
});

describe("replacement and negation", () => {
	it("the replacing effect's activation negated: nothing is replaced, and the original effect is applied (YGOProJudge only)", () => {
		const { duel, log } = board({ extraZone: ["fixture-rewriter"] }, { monsters: ["fixture-big-drawer"], hand, deck, set: ["fixture-counter"] });
		const done = play(duel, DRAWER, "activate fixture-rewriter", "activate fixture-counter", "pass", "pass");
		expect(log).toEqual(["fixture-counter", "fixture-big-drawer draws"]);
		expect([codes(done, "rival", "hand"), codes(done, "you", "monster")]).toEqual([["fixture-big", "fixture-big"], ["fixture-rewriter"]]);
	});
	it("the replaced link negated (its monster's effects negated by a later link): neither the new effect nor the original one is applied: it is still that monster's effect (YGOProJudge only)", () => {
		const { duel, log } = board({ extraZone: ["fixture-rewriter"], set: ["fixture-negate-aimed"] }, { monsters: ["fixture-big-drawer"], hand, deck });
		const done = play(duel, DRAWER, "activate fixture-rewriter", "pass", "activate fixture-negate-aimed > fixture-big-drawer", "pass", "pass");
		expect(log).toEqual(["fixture-rewriter"]);
		expect([done.asking, codes(done, "you", "monster"), codes(done, "rival", "hand")]).toEqual([null, ["fixture-rewriter"], []]);
	});
	it("the card's definition is not changed: the link alone carries the new effect, and the same effect activated again later does what its card says", () => {
		const { duel, log, defs } = board({ extraZone: ["fixture-rewriter"] }, { monsters: ["fixture-big-drawer"], hand: ["fixture-vanilla", "fixture-vanilla"], deck: [...deck, ...deck] });
		const operation = defs["fixture-big-drawer"]!.effects![0]!.operation;
		const answered = play(duel, DRAWER, "activate fixture-rewriter", "pass", "pass");
		expect(answered.defs).toBe(duel.defs);
		expect(defs["fixture-big-drawer"]!.effects![0]!.operation).toBe(operation);
		// The opponent's next turn: the rewriter is gone (it was destroyed), and the effect draws.
		let next = answered;
		for (let guard = 0; guard < 80 && !(next.turn.number === 5 && next.turn.phase === "main1" && next.priority.open); guard++) next = play(next, "pass");
		log.length = 0;
		play(next, DRAWER, "pass", "pass");
		expect(log).toEqual(["fixture-big-drawer draws"]);
	});
	it("an effect of a monster with less than 2000 ATK is not one the made-up card answers (its own condition), and it resolves as printed", () => {
		const { duel } = board({ extraZone: ["fixture-rewriter"] }, { monsters: ["fixture-small-drawer"], hand, deck });
		expect(offered(play(duel, "activate fixture-small-drawer ~ fixture-vanilla"))).toEqual(["pass"]);
	});
});
