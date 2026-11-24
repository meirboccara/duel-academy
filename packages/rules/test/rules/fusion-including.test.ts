import { describe, expect, it } from "vitest";
import { cites, type Duel } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec): Duel => position({ defs: gapCards(), you: { graveyard: ["fixture-roar"], extra: ["fixture-twin"], ...you } });

/**
 * "Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field, including a "Blue-Eyes" monster"
 * (`FusionOptions.check`): a rule of the effect over the whole set of materials, beside the Fusion Monster's own. Roar of the
 * Blue-Eyed Dragons (text), whose effect is activated in the GY; made-up cards with the same wording.
 */
describe("a Fusion Summon whose effect asks for a material", () => {
	it(`${cites("rules", "fusion-including-text")} with no such monster among the materials it could use, the effect cannot be activated`, () => {
		expect(offered(board({ hand: ["fixture-plain", "fixture-plain"] }))).not.toContain("activate fixture-roar");
		expect(offered(board({ hand: ["fixture-plain", "fixture-white"] }))).toContain("activate fixture-roar");
	});
	it(`${cites("rules", "fusion-including-text")} the materials chosen must include one: it is taken without asking when it is the only one, and a set without it is never offered`, () => {
		const duel = board({ hand: ["fixture-plain", "fixture-white"], monsters: ["fixture-plain"] });
		const asked = play(duel, "activate fixture-roar");
		// The spell is banished as the cost; the "Fixture White Dragon" is in every legal set, so only the second material is asked.
		expect(codes(asked, "you", "banished")).toEqual(["fixture-roar"]);
		expect(offered(asked)).toEqual(["choose fixture-plain", "choose fixture-plain"]);
		let done = play(asked, "choose fixture-plain");
		for (let guard = 0; guard < 4 && done.asking; guard++) done = play(done, offered(done).find((name) => name !== "pass")!);
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-plain", "fixture-white"]);
		const twin = Object.values(done.cards).find((card) => card.code === "fixture-twin")!;
		expect([twin.zone, twin.summonedBy, twin.proper]).toEqual(["monster", "fusion", true]);
	});
	it(`${cites("rules", "fusion-including-text")} with two such monsters either can be the one: both are offered, and two of them are a legal set`, () => {
		const duel = board({ hand: ["fixture-white", "fixture-white-b", "fixture-plain"] });
		const asked = play(duel, "activate fixture-roar");
		expect(offered(asked)).toEqual(["choose fixture-plain", "choose fixture-white", "choose fixture-white-b"]);
		// Once the plain monster is chosen, the second material must be one of the two.
		expect(offered(play(asked, "choose fixture-plain"))).toEqual(["choose fixture-white", "choose fixture-white-b"]);
	});
});
