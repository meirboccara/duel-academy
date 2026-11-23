import { describe, expect, it } from "vitest";
import { cardsIn, cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const options = { everyWindow: true };

describe("Terraforming, written as an effect record", () => {
	it(`${cites("terraforming", "text")} ${cites("rules", "search-needs-a-card")} cannot be activated with no Field Spell in the Deck, and declares that it searches`, () => {
		expect(offered(position({ defs, options, you: { hand: ["terraforming"], deck: ["celtic-guardian"] } }))).toEqual(["pass", "set terraforming"]);
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi", "celtic-guardian"] } });
		expect(offered(start)).toEqual(["activate terraforming", "pass", "set terraforming"]);
		expect(play(start, "activate terraforming").chain[0]!.categories).toEqual(["search"]);
	});
	it(`${cites("terraforming", "text")} adds the Field Spell from the Deck to the hand`, () => {
		const done = play(position({ defs, options, you: { hand: ["terraforming"], deck: ["umi", "celtic-guardian"] } }), "activate terraforming", "pass", "pass");
		expect(codes(done, "you", "hand")).toEqual(["umi"]);
		expect(codes(done, "you", "graveyard")).toEqual(["terraforming"]);
	});
	it(`${cites("terraforming", "text")} ${cites("rules", "choice-at-resolution")} lets the player choose which Field Spell when it resolves: it does not target`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi", "other-field", "celtic-guardian"] } });
		const activated = play(start, "activate terraforming");
		expect(activated.chain[0]!.targets).toEqual([]);
		const asked = play(activated, "pass", "pass");
		expect(offered(asked)).toEqual(["choose other-field", "choose umi"]);
		const done = play(asked, "choose other-field");
		expect(codes(done, "you", "hand")).toEqual(["other-field"]);
		expect(cardsIn(done, "you", "deck").map((c) => c.code).sort()).toEqual(["celtic-guardian", "umi"]);
	});
});
