import { describe, expect, it } from "vitest";
import { cardsIn, cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs, recordCards } from "../rules/fixtures";
import { readinessCards } from "../rules/readiness-fixtures";

const options = { everyWindow: true };
const card = "dd-crow";

describe("D.D. Crow, written as an effect record", () => {
	it(`${cites("dd-crow", "text")} is a Quick Effect from the hand that targets 1 card in the opponent's Graveyard, and only there`, () => {
		const mine = position({ defs, options, you: { hand: [card], graveyard: ["umi"] } });
		expect(offered(mine)).toEqual(["pass"]);
		const start = position({ defs, options, you: { hand: [card], graveyard: ["umi"] }, rival: { graveyard: ["terraforming", "celtic-guardian"] } });
		expect(offered(start)).toEqual([`activate ${card} > celtic-guardian`, `activate ${card} > terraforming`, "pass"]);
	});
	it(`${cites("dd-crow", "text")} discards itself first, then banishes the target when it resolves`, () => {
		const start = position({ defs, options, you: { hand: [card] }, rival: { graveyard: ["terraforming"] } });
		const aimed = play(start, `activate ${card} > terraforming`);
		expect(codes(aimed, "you", "graveyard")).toEqual([card]);
		expect(aimed.chain[0]!.targets).toEqual([cardsIn(start, "rival", "graveyard")[0]!.id]);
		const done = play(aimed, "pass", "pass");
		expect(codes(done, "rival", "banished")).toEqual(["terraforming"]);
		expect(codes(done, "rival", "graveyard")).toEqual([]);
	});
	it(`${cites("dd-crow", "text")} can be used on the opponent's turn, in answer to an activation`, () => {
		const start = position({ defs, options, turn: "rival", you: { hand: [card] }, rival: { hand: ["terraforming"], deck: ["umi"], graveyard: ["celtic-guardian"] }, phase: "main1" });
		const searched = play(start, "activate terraforming");
		expect(offered(searched)).toEqual([`activate ${card} > celtic-guardian`, "pass"]);
	});
	it("leaves alone a target that left the Graveyard and came back as a new card (a core reading of that target, no Konami record)", () => {
		const start = position({ defs: { ...defs, ...recordCards() }, options, you: { hand: [card] }, rival: { set: ["recycle-graveyard"], graveyard: ["terraforming"] } });
		const done = play(start, `activate ${card} > terraforming`, "activate recycle-graveyard", "pass", "pass");
		expect(codes(done, "rival", "banished")).toEqual([]);
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["recycle-graveyard", "terraforming"]);
	});
	it(`${cites("rules", "unaffected-targeted-not-applied")} ${cites("rules", "unaffected-sent-as-cost")} a card unaffected by the opponent's card effects can be targeted and is not banished by the effect; a cost still banishes it`, () => {
		const log: string[] = [];
		const start = position({ defs: { ...defs, ...readinessCards(log) }, options, you: { hand: [card, "fixture-banish-cost"] }, rival: { faceupSpells: ["fixture-gy-immune"], graveyard: ["terraforming"] } });
		// The discard is paid and the card is targeted, but the banishment is not applied to it.
		const done = play(start, `activate ${card} > terraforming`, "pass", "pass");
		expect(codes(done, "you", "graveyard")).toEqual([card]);
		expect(codes(done, "rival", "graveyard")).toEqual(["terraforming"]);
		expect(codes(done, "rival", "banished")).toEqual([]);
		// A cost is not an effect: the same card is banished to pay one.
		const paid = play(done, "activate fixture-banish-cost ~ terraforming", "pass", "pass");
		expect(codes(paid, "rival", "banished")).toEqual(["terraforming"]);
		expect(log).toEqual(["fixture-banish-cost"]);
	});
});
