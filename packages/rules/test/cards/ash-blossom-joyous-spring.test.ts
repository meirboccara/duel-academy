import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS, recordCards } from "../rules/fixtures";

const options = { everyWindow: true };
const defs = { ...REAL_CARDS, ...recordCards() };
const card = "ash-blossom-joyous-spring";

describe("Ash Blossom & Joyous Spring, written as an effect record", () => {
	it(`${cites("ash-blossom-joyous-spring", "text")} is offered against an effect that includes a search, a Special Summon from the Deck or a send from the Deck, and costs a discard`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi", "other-field"] }, rival: { hand: [card] } });
		const searched = play(start, "activate terraforming");
		expect(offered(searched)).toEqual([`activate ${card}`, "pass"]);
		const negated = play(searched, `activate ${card}`);
		// The cost was paid at activation: Ash Blossom is in the Graveyard before anything resolves.
		expect(codes(negated, "rival", "graveyard")).toEqual([card]);
		expect(negated.chain.map((link) => [link.card.code, link.effectNegated, link.activationNegated])).toEqual([["terraforming", false, false], [card, false, false]]);
		const done = play(negated, "pass", "pass");
		// "negate that effect": nothing is added, and the Spell Card whose effect it was still goes to the Graveyard.
		expect(codes(done, "you", "hand")).toEqual([]);
		expect(codes(done, "you", "graveyard")).toEqual(["terraforming"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "text")} is not offered against an effect that includes none of the three: a draw, a destruction`, () => {
		const drawn = position({ defs, options, you: { hand: ["pot-of-greed"], deck: ["umi", "other-field"] }, rival: { hand: [card] } });
		expect(offered(play(drawn, "activate pot-of-greed"))).toEqual(["pass"]);
		const typhoon = position({ defs, options, you: { hand: ["mystical-space-typhoon"] }, rival: { hand: [card], set: ["umi"] } });
		expect(offered(play(typhoon, "activate mystical-space-typhoon > umi"))).toEqual(["pass"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "text")} can be used once per turn: a second copy is not offered once the first has been used`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], set: ["needlebug-nest"], deck: ["umi", "other-field"] }, rival: { hand: [card, card] } });
		const first = play(start, "activate terraforming", `activate ${card}`);
		// Needlebug Nest (send from the Deck) is also an effect Ash Blossom answers, but this turn's limit is spent.
		const nest = play(first, "activate needlebug-nest");
		expect(nest.chain.map((link) => link.card.code)).toEqual(["terraforming", card, "needlebug-nest"]);
		expect(offered(nest)).toEqual(["pass"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "negated-effect-activation-stands")} negates the effect and not the activation: the card was activated, so what that took stays`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi"] }, rival: { hand: [card] } });
		const negated = play(start, "activate terraforming", `activate ${card}`, "pass", "pass");
		// Ice Bell's Q&A: the effect of the Ash Blossom target is not applied, but its activation was made.
		expect(codes(negated, "you", "deck")).toEqual(["umi"]);
		expect(codes(negated, "you", "graveyard")).toEqual(["terraforming"]);
		expect(negated.chain).toEqual([]);
	});
	// Structural, not a Konami ruling: chain links only ever go on top, so this passes with the old `index - 1` too. It
	// records that a link freezes which link it answered, which only matters once step 5 can change the chain below it.
	it("records on its link which link it answered, and negates that one whatever is chained on top of it", () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], set: ["log-quick"], deck: ["umi"] }, rival: { hand: [card] } });
		const answered = play(start, "activate terraforming", `activate ${card}`);
		expect(answered.chain.map((link) => link.answers)).toEqual([null, 0]);
		const topped = play(answered, "activate log-quick");
		expect(topped.chain.map((link) => link.answers)).toEqual([null, 0, 1]);
		const done = play(topped, "pass", "pass");
		expect(codes(done, "you", "hand")).toEqual([]);
		expect(codes(done, "you", "deck")).toEqual(["umi"]);
	});
});
