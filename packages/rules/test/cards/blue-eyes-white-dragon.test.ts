import { describe, expect, it } from "vitest";
import { atk, CARD_DEFS, CARD_SOURCES, type CardDef, cites, def, level, printedFacts } from "../../src";
import { offered, plainCards, play, position } from "../rules/fixtures";

const card = "blue-eyes-white-dragon";
// A made-up Level 4 Normal Monster to Tribute (the only card around it that is not a real card).
const filler: CardDef = { code: "fixture-filler", kind: "monster", facts: { name: "Fixture Filler", level: 4, atk: 1000, def: 1000, normal: true } };
const defs: Record<string, CardDef> = { ...CARD_DEFS, [filler.code]: filler };

describe("Blue-Eyes White Dragon, a Normal Monster", () => {
	it(`${cites("blue-eyes-white-dragon", "text")} has the flavour text of Konami's page as its printed text and no effect: it is a Normal Monster, not an Effect Monster`, () => {
		const text = "This legendary dragon is a powerful engine of destruction. Virtually invincible, very few have faced this awesome creature and lived to tell the tale.";
		expect(CARD_DEFS[card]!.effects ?? []).toEqual([]);
		expect(printedFacts(position({ defs, you: { hand: [card] } }), 1)!.normal).toBe(true);
		expect(CARD_SOURCES.find((entry) => entry.code === card)!.sources.find((source) => source.id === "text")!.quote).toBe(text);
	});
	it(`${cites("blue-eyes-white-dragon", "facts")} is a LIGHT Dragon of Level 8 with 3000 ATK and 2500 DEF, a "Blue-Eyes" monster by its name, mentioning no card`, () => {
		const start = position({ defs, you: { monsters: [card] } });
		expect(printedFacts(start, 1)).toEqual({ name: "Blue-Eyes White Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, normal: true, archetypes: ["Blue-Eyes"] });
		const id = start.piles.you.monster[0]!;
		expect([level(start, id), atk(start, id), def(start, id)]).toEqual([8, 3000, 2500]);
	});
	it(`${cites("blue-eyes-white-dragon", "facts")} needs 2 Tributes for a Normal Summon (Level 8), and can be Normal Set the same way`, () => {
		const one = position({ defs, you: { hand: [card], monsters: [filler.code] } });
		expect(offered(one).filter((label) => label.includes(card))).toEqual([]);
		const two = position({ defs, you: { hand: [card], monsters: [filler.code, filler.code] } });
		expect(offered(two).filter((label) => label.includes(card)).sort()).toEqual([`set ${card}`, `summon ${card}`]);
		const done = play(two, `summon ${card}`);
		expect(done.asking).not.toBeNull();
	});
	it(`${cites("blue-eyes-white-dragon", "facts")} is no legal target for an effect that needs an Effect Monster (Effect Veiler): it has no effect`, () => {
		const all = { ...defs, ...plainCards() };
		const start = position({ defs: all, turn: "rival", you: { hand: ["effect-veiler"] }, rival: { monsters: ["field-quick", card] }, options: { everyWindow: true } });
		const answered = play(start, "activate field-quick");
		// The Normal Monster is not offered; the Effect Monster beside it is.
		expect(offered(answered)).toEqual(["activate effect-veiler > field-quick", "pass"]);
	});
});
