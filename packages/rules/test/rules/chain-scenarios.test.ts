import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "./fixtures";

/**
 * Real cards on the chain, through legalActions and act only. Response windows work as in a real duel here: a player
 * who holds no legal response is passed for.
 */
describe("Ash Blossom & Joyous Spring against Terraforming", () => {
	const start = () => position({ defs, you: { hand: ["terraforming"], deck: ["umi", "celtic-guardian"] }, rival: { hand: ["ash-blossom"] } });

	it(`${cites("rules", "search-needs-a-card")} Terraforming adds a Field Spell when nothing answers it, and cannot be activated with no Field Spell in the Deck`, () => {
		const unanswered = play(position({ defs, you: { hand: ["terraforming"], deck: ["umi", "celtic-guardian"] } }), "activate terraforming");
		expect(codes(unanswered, "you", "hand")).toEqual(["umi"]);
		expect(codes(unanswered, "you", "graveyard")).toEqual(["terraforming"]);
		expect(offered(position({ defs, you: { hand: ["terraforming"], deck: ["celtic-guardian"] } }))).toEqual(["pass", "set terraforming"]);
	});
	it(`${cites("rules", "response-speed")} offers Ash Blossom from the hand in response to the search, and negates it: nothing is added, both cards go to the Graveyard`, () => {
		const asked = play(start(), "activate terraforming");
		expect(asked.priority.holder).toBe("rival");
		expect(offered(asked)).toEqual(["activate ash-blossom", "pass"]);
		const answered = play(asked, "activate ash-blossom");
		expect(answered.chain).toEqual([]);
		expect(codes(answered, "you", "hand")).toEqual([]);
		expect(codes(answered, "you", "deck").sort()).toEqual(["celtic-guardian", "umi"]);
		expect(codes(answered, "you", "graveyard")).toEqual(["terraforming"]);
		expect(codes(answered, "rival", "graveyard")).toEqual(["ash-blossom"]);
		expect(answered.priority).toEqual({ holder: "you", passed: [], open: true });
	});
	it("does not offer Ash Blossom against an effect that takes nothing from the Deck, nor with no chain", () => {
		const duel = position({ defs, you: { hand: ["mystical-space-typhoon"] }, rival: { hand: ["ash-blossom"], set: ["umi"] } });
		const typhoon = play(duel, "activate mystical-space-typhoon > umi");
		expect(typhoon.chain).toEqual([]);
		expect(codes(typhoon, "rival", "graveyard")).toEqual(["umi"]);
		expect(codes(typhoon, "rival", "hand")).toEqual(["ash-blossom"]);
	});
});

describe("Mystical Space Typhoon chained to a Quick-Play Spell", () => {
	it(`${cites("rules", "destroyed-still-resolves")} destroys the Quick-Play Spell on the chain, whose effect is still applied`, () => {
		const start = position({ defs, you: { hand: ["mystical-space-typhoon"] }, rival: { set: ["mystical-space-typhoon", "umi"] } });
		const yours = play(start, "activate mystical-space-typhoon > umi");
		expect(yours.priority.holder).toBe("rival");
		expect(offered(yours)).toEqual(["activate mystical-space-typhoon > mystical-space-typhoon", "activate mystical-space-typhoon > umi", "pass"]);
		const answered = play(yours, "activate mystical-space-typhoon > mystical-space-typhoon");
		expect(answered.chain).toEqual([]);
		// Link 2 destroyed your Typhoon; link 1 still destroyed its target.
		expect(codes(answered, "you", "graveyard")).toEqual(["mystical-space-typhoon"]);
		expect(codes(answered, "rival", "graveyard")).toEqual(["umi", "mystical-space-typhoon"]);
		expect([codes(answered, "you", "spell"), codes(answered, "rival", "spell")]).toEqual([[], []]);
	});
	it(`${cites("rules", "quick-play")} cannot answer with a Mystical Space Typhoon Set this turn, or from the hand in the opponent's turn`, () => {
		const start = position({ defs, turn: "rival", you: { hand: ["mystical-space-typhoon"] }, rival: { hand: ["mystical-space-typhoon"], setThisTurn: ["mystical-space-typhoon"] } });
		expect(offered(start)).toEqual(["activate mystical-space-typhoon > mystical-space-typhoon", "pass", "set mystical-space-typhoon"]);
		const after = play(start, "activate mystical-space-typhoon > mystical-space-typhoon");
		expect(after.chain).toEqual([]);
		expect(codes(after, "you", "hand")).toEqual(["mystical-space-typhoon"]);
	});
});

describe("hand effects", () => {
	it(`${cites("rules", "response-speed")} ${cites("rules", "chain-resolves-backwards")} builds one chain with three hand effects and resolves it backwards: D.D. Crow banishes D.D. Crow, D.D. Crow banishes Ash Blossom, Ash Blossom still negates Terraforming`, () => {
		const start = position({ defs, you: { hand: ["terraforming", "dd-crow"], deck: ["umi"] }, rival: { hand: ["ash-blossom", "dd-crow"] } });
		const searched = play(start, "activate terraforming");
		// Your Graveyard is empty: the rival's D.D. Crow has no target yet.
		expect(offered(searched)).toEqual(["activate ash-blossom", "pass"]);
		const ash = play(searched, "activate ash-blossom");
		expect(ash.priority.holder).toBe("you");
		expect(offered(ash)).toEqual(["activate dd-crow > ash-blossom", "pass"]);
		const crow = play(ash, "activate dd-crow > ash-blossom");
		expect(crow.priority.holder).toBe("rival");
		expect(crow.chain.map((link) => [link.player, link.card.code, link.speed])).toEqual([["you", "terraforming", 1], ["rival", "ash-blossom", 2], ["you", "dd-crow", 2]]);
		expect(offered(crow)).toEqual(["activate dd-crow > dd-crow", "pass"]);
		const done = play(crow, "activate dd-crow > dd-crow");
		expect(done.chain).toEqual([]);
		expect(codes(done, "you", "banished")).toEqual(["dd-crow"]);
		expect(codes(done, "rival", "banished")).toEqual(["ash-blossom"]);
		expect(codes(done, "rival", "graveyard")).toEqual(["dd-crow"]);
		expect(codes(done, "you", "graveyard")).toEqual(["terraforming"]);
		expect(codes(done, "you", "hand")).toEqual([]);
		expect(codes(done, "you", "deck")).toEqual(["umi"]);
	});
	it(`${cites("rules", "fast-effects-either-turn")} lets you use Ash Blossom from your hand in your own turn, against the rival's Needlebug Nest`, () => {
		const deck = ["celtic-guardian", "celtic-guardian", "celtic-guardian", "celtic-guardian", "celtic-guardian", "umi"];
		const start = position({ defs, you: { hand: ["ash-blossom"] }, rival: { set: ["needlebug-nest"], deck } });
		// Nothing to answer yet: Ash Blossom is not offered in an open game state.
		expect(offered(start)).toEqual(["pass"]);
		const rival = play(start, "pass");
		expect(rival.priority.holder).toBe("rival");
		const nest = play(rival, "activate needlebug-nest");
		expect(nest.priority.holder).toBe("you");
		expect(offered(nest)).toEqual(["activate ash-blossom", "pass"]);
		const negated = play(nest, "activate ash-blossom");
		expect(codes(negated, "rival", "deck")).toHaveLength(6);
		expect(codes(negated, "rival", "graveyard")).toEqual(["needlebug-nest"]);
		expect(codes(negated, "you", "graveyard")).toEqual(["ash-blossom"]);
		expect(negated.turn).toEqual({ player: "you", number: 3, phase: "main1" });
		// Left alone, Needlebug Nest sends five cards.
		const resolved = play(nest, "pass");
		expect(codes(resolved, "rival", "deck")).toHaveLength(1);
		expect(codes(resolved, "rival", "graveyard")).toHaveLength(6);
	});
});
