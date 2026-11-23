import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const options = { everyWindow: true };
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
});
