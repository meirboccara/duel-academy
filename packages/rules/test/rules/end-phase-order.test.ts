import { describe, expect, it } from "vitest";
import { banishTemporarily, type CardDef, cites, type Duel, gainLp, other, specialSummon, takeControl, targetsOf } from "../../src";
import { offered, play, position, type SideSpec } from "./fixtures";

/**
 * S5 and S6 of docs/rules-core/sky-striker-gaps.md: what the two players do in the End Phase, and in which order.
 * - S5: "During the End Phase: You can ..." (`EffectRecord.during` with `eitherTurn`): also offered to the player whose turn it is
 *   not, once the turn player has passed (Konami's Japanese Q&A fid 11533, OCG only).
 * - S6: control taken "until the End Phase" is given back as a mandatory End Phase process of the player who took it, which they
 *   order around their other End Phase effects (fid 11555, OCG only).
 * Made-up cards: Graveyard effects of the End Phase (The Dragon that Devours the Dogma's kind for either turn, Albion's kind for its
 * player's own turn), a monster with Sky Striker Ace - Shizuku's End Phase effect, Mind Control and S:P Little Knight's banishment.
 */
function cards(log: string[]): Record<string, CardDef> {
	return {
		"fixture-a": { code: "fixture-a", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
		// "During the End Phase, if this card is in your GY: You can gain 500 LP." (either player's turn)
		"fixture-dogma": { code: "fixture-dogma", kind: "monster", facts: { level: 8, atk: 3000, def: 2500 }, effects: [{ type: "trigger", range: "graveyard", during: "end", eitherTurn: true, once: { scope: "name" }, operation: (duel, link) => gainLp(duel, link.player, 500) }] },
		// "During your End Phase, if this card is in your GY: You can gain 300 LP."
		"fixture-albion": { code: "fixture-albion", kind: "monster", facts: { level: 8, atk: 2500, def: 2000 }, effects: [{ type: "trigger", range: "graveyard", during: "end", once: { scope: "name" }, operation: (duel, link) => gainLp(duel, link.player, 300) }] },
		// "Once per turn, during the End Phase, if this card was Special Summoned this turn: You can ...".
		"fixture-shizuku": {
			code: "fixture-shizuku",
			kind: "monster",
			facts: { frame: "link", link: 1, arrows: ["top-right"], atk: 1500 },
			effects: [{ type: "trigger", during: "end", eitherTurn: true, once: { scope: "instance", acrossMoves: true }, condition: (duel, { card }) => card.specialSummoned && card.summonedTurn === duel.turn.number, operation: (duel, link) => (log.push(`shizuku of ${link.player}`), duel) }],
		},
		// "Target 1 monster your opponent controls; take control of it until the End Phase."
		"fixture-mind": { code: "fixture-mind", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[other(player)].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => takeControl(board, card.id, link.player, board.turn.number, link), duel) }] },
		// "Target 1 monster on the field; banish it until the End Phase."
		"fixture-blink": { code: "fixture-blink", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => banishTemporarily(duel, targetsOf(duel, link).map((card) => card.id), link, { phase: "end", turn: duel.turn.number }) }] },
	};
}

const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;

/** Passes until the turn player holds priority in the open game state of the End Phase. */
function toEnd(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === "end" && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 50; guard++) next = play(next, "pass");
	return next;
}

describe("optional effects of the End Phase for the player whose turn it is not (S5)", () => {
	const end = (you: SideSpec, rival: SideSpec, turn: "you" | "rival"): Duel => toEnd(position({ defs: cards([]), you, rival, turn, phase: "main2" }));
	it(`${cites("rules", "end-phase-other-player-next")} "During the End Phase: You can ..." is offered to the other player once the turn player has passed, and is activated as Chain Link 1`, () => {
		const start = end({ graveyard: ["fixture-dogma"] }, {}, "rival");
		expect([start.turn.player, start.priority.holder, offered(start)]).toEqual(["rival", "rival", ["pass"]]);
		const yours = play(start, "pass");
		expect([yours.priority.holder, yours.turn.phase, offered(yours)]).toEqual(["you", "end", ["activate fixture-dogma", "pass"]]);
		const done = play(yours, "activate fixture-dogma");
		expect([done.lp.you, done.turn.number, done.turn.phase]).toEqual([8500, 3, "end"]);
		// Used: the turn player has priority again in the same End Phase, and it is not offered a second time.
		expect([done.priority.holder, offered(done)]).toEqual(["rival", ["pass"]]);
		expect(play(done, "pass").turn.number).toBe(4);
	});
	it(`${cites("rules", "end-phase-other-player-next")} declined, the turn ends; an effect worded "during your End Phase" is not offered in the opponent's turn`, () => {
		const start = end({ graveyard: ["fixture-dogma", "fixture-albion"] }, {}, "rival");
		const yours = play(start, "pass");
		expect(offered(yours)).toEqual(["activate fixture-dogma", "pass"]);
		expect(play(yours, "pass").turn).toMatchObject({ number: 4, player: "you" });
	});
	it(`${cites("rules", "end-phase-turn-player-first")} ${cites("rules", "end-phase-mandatory-process-owed")} ${cites("rules", "end-phase-optional-after-mandatory")} the turn player acts first and may wait; the other player then does what they must; the turn player may still activate their optional effect afterwards`, () => {
		// Your turn: your "fixture-albion" is in your GY; the rival banished your monster until the End Phase with their Set card.
		const start = position({ defs: cards([]), phase: "main2", you: { monsters: ["fixture-a"], graveyard: ["fixture-albion"] }, rival: { set: ["fixture-blink"] } });
		const gone = play(start, "pass", "activate fixture-blink > fixture-a");
		const mine = toEnd(gone);
		expect(offered(mine)).toEqual(["activate fixture-albion", "pass"]);
		// You do not activate it yet. The rival now has priority and owes the return: here they cannot pass first (the core is stricter
		// than fid 11533, which lets them wait until both players have passed).
		const theirs = play(mine, "pass");
		expect([theirs.priority.holder, offered(theirs)]).toEqual(["rival", ["apply fixture-blink"]]);
		const back = play(theirs, "apply fixture-blink", "place 0");
		expect(back.cards[idOf(back, "fixture-a")]).toMatchObject({ zone: "monster", controller: "you" });
		// Priority is yours again in the same End Phase, and the optional effect is still open.
		expect([back.turn.phase, back.priority.holder, offered(back)]).toEqual(["end", "you", ["activate fixture-albion", "pass"]]);
		expect(play(back, "activate fixture-albion").lp.you).toBe(8300);
	});
});

describe("control taken until the End Phase is given back as an End Phase process (S6)", () => {
	/** Your turn: the rival Special Summoned "fixture-shizuku" this turn, and you took control of it until the End Phase. */
	function taken(log: string[]): Duel {
		const placed = position({ defs: cards(log), you: { hand: ["fixture-mind"] }, rival: { extra: ["fixture-shizuku"] } });
		const start = { ...specialSummon(placed, "rival", idOf(placed, "fixture-shizuku")), live: [], waiting: [] };
		const mine = play(start, "activate fixture-mind > fixture-shizuku", "place 0");
		expect(mine.cards[idOf(mine, "fixture-shizuku")]).toMatchObject({ controller: "you", summonedTurn: 3 });
		return toEnd(mine);
	}
	it(`${cites("rules", "control-return-ordered-by-taker")} ${cites("rules", "control-return-then-controller-activates")} the player who took it chooses what to do first; given back first, the monster's End Phase effect is its controller's to activate`, () => {
		const log: string[] = [];
		const end = taken(log);
		// Still yours as the End Phase begins; the return is owed (no "pass"), and the monster's effect is yours to activate first.
		expect(end.cards[idOf(end, "fixture-shizuku")]!.controller).toBe("you");
		expect(offered(end)).toEqual(["activate fixture-shizuku", "apply fixture-shizuku"]);
		const asked = play(end, "apply fixture-shizuku");
		expect(asked.asking).toMatchObject({ player: "rival" });
		const back = play(asked, "place 3");
		expect(back.cards[idOf(back, "fixture-shizuku")]).toMatchObject({ controller: "rival", slot: 3 });
		expect([back.turn.phase, back.priority.holder, offered(back)]).toEqual(["end", "you", ["pass"]]);
		const theirs = play(back, "pass");
		expect([theirs.priority.holder, offered(theirs)]).toEqual(["rival", ["activate fixture-shizuku", "pass"]]);
		play(theirs, "activate fixture-shizuku");
		expect(log).toEqual(["shizuku of rival"]);
	});
	it(`${cites("rules", "control-return-ordered-by-taker")} ${cites("rules", "control-return-then-controller-activates")} activated first by the player who took it, the effect cannot be activated again by its controller once it is given back`, () => {
		const log: string[] = [];
		const used = play(taken(log), "activate fixture-shizuku");
		expect(log).toEqual(["shizuku of you"]);
		// The return is still owed in this End Phase.
		expect([used.turn.phase, offered(used)]).toEqual(["end", ["apply fixture-shizuku"]]);
		const back = play(used, "apply fixture-shizuku", "place 0");
		expect(back.cards[idOf(back, "fixture-shizuku")]!.controller).toBe("rival");
		// The rival has nothing to activate: when you pass, the turn ends.
		expect(play(back, "pass").turn.number).toBe(4);
		expect(log).toEqual(["shizuku of you"]);
	});
});
