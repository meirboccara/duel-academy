import { describe, expect, it } from "vitest";
import { type CardDef, type Duel, gainLp, moveCard } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";

/**
 * "During your Standby Phase: You can ..." (`EffectRecord.during`, `phaseTriggers` in src/chain.ts): an optional Trigger Effect of the
 * phase, offered to the turn player in the open game state of that phase, as Chain Link 1, not only as it begins. YGOProJudge's answer
 * only (asked 2026-11-26, chat closed; no source cited, and the Fast Effect Timing page it named says nothing on it): no Konami page
 * read. Made-up cards: Primite Dragon Ether Beryl's kind of Graveyard effect, a field effect with no once-per-turn limit, and
 * Quick-Play Spells that send a card from the Deck to the GY.
 */
function cards(): Record<string, CardDef> {
	const normalThere = (duel: Duel, player: "you" | "rival") => [...duel.piles[player].monster, ...duel.piles[player].graveyard].some((id) => duel.cards[id]!.code === "fixture-normal");
	const sendFromDeck = (code: string, what: string): CardDef => ({
		code,
		kind: "quick-play",
		effects: [{ type: "activation", operation: (duel, link) => { const id = duel.piles[link.player].deck.find((card) => duel.cards[card]!.code === what); return id === undefined ? duel : moveCard(duel, id, { zone: "graveyard", effect: link }); } }],
	});
	return {
		// "During your Standby Phase, if you have a "fixture-normal" in your field or GY: You can add this card from the GY to your hand."
		"fixture-frog": {
			code: "fixture-frog",
			kind: "monster",
			facts: { level: 4, atk: 0, def: 0 },
			effects: [{ type: "trigger", range: "graveyard", during: "standby", once: { scope: "name" }, condition: (duel, { player }) => normalThere(duel, player), operation: (duel, link) => moveCard(duel, link.card.id, { zone: "hand", effect: link }) }],
		},
		// "During your Standby Phase: You can gain 500 LP." (no limit of its own).
		"fixture-well": { code: "fixture-well", kind: "monster", facts: { level: 4, atk: 0, def: 0 }, effects: [{ type: "trigger", during: "standby", operation: (duel, link) => gainLp(duel, link.player, 500) }] },
		"fixture-normal": { code: "fixture-normal", kind: "monster", facts: { level: 4, atk: 0, def: 0, normal: true } },
		"fixture-send-normal": sendFromDeck("fixture-send-normal", "fixture-normal"),
		"fixture-send-frog": sendFromDeck("fixture-send-frog", "fixture-frog"),
	};
}

/** Your Standby Phase (turn 3), reached from the Draw Phase: the game state open, you first. */
const standby = (you: SideSpec, rival: SideSpec = {}, turn: "you" | "rival" = "you"): Duel => play(position({ defs: cards(), you, rival, turn, phase: "draw" }), "pass");

describe("optional Trigger Effects of a phase (\"During your Standby Phase: You can ...\")", () => {
	it("are offered in the open game state of the phase, and activated as Chain Link 1 (YGOProJudge only)", () => {
		const duel = standby({ graveyard: ["fixture-frog", "fixture-normal"] });
		expect([duel.turn.phase, duel.priority.open, duel.priority.holder]).toEqual(["standby", true, "you"]);
		expect(offered(duel)).toEqual(["activate fixture-frog", "pass"]);
		const done = play(duel, "activate fixture-frog");
		expect(codes(done, "you", "hand")).toEqual(["fixture-frog"]);
	});
	it("can be activated later in the phase once their condition holds there (YGOProJudge only)", () => {
		const duel = standby({ graveyard: ["fixture-frog"], set: ["fixture-send-normal"], deck: ["fixture-normal"] });
		expect(offered(duel)).toEqual(["activate fixture-send-normal", "pass"]);
		const after = play(duel, "activate fixture-send-normal");
		expect(after.turn.phase).toBe("standby");
		expect(offered(after)).toContain("activate fixture-frog");
	});
	it("can be activated by a card that arrived where it activates from during the phase (YGOProJudge only)", () => {
		const duel = standby({ graveyard: ["fixture-normal"], set: ["fixture-send-frog"], deck: ["fixture-frog"] });
		expect(offered(duel)).not.toContain("activate fixture-frog");
		expect(offered(play(duel, "activate fixture-send-frog"))).toContain("activate fixture-frog");
	});
	it("once per phase for the card, even with no limit of its own; gone once the phase is over; never in the opponent's Standby Phase", () => {
		const duel = standby({ monsters: ["fixture-well"] });
		const used = play(duel, "activate fixture-well");
		expect([used.lp.you, used.turn.phase, offered(used)]).toEqual([8500, "standby", ["pass"]]);
		expect(play(duel, "pass").turn.phase).toBe("main1");
		expect(offered(play(duel, "pass"))).not.toContain("activate fixture-well");
		expect(offered(standby({ monsters: ["fixture-well"] }, {}, "rival"))).not.toContain("activate fixture-well");
	});
});
