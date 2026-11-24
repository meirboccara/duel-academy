import { expect, it } from "vitest";
import { createDuel, moveCard, printedFacts, hasPrintedName, belongsTo, mentionsCard, type CardDef } from "../src";

it("explicit printed identity survives movement; codes and text fragments do not imply membership", () => {
	// Synthetic identity fixture, not a registered real card or a dynamic name-changing rule.
	const fixture: CardDef = { code: "not-a-blue-eyes", kind: "monster", facts: {
		name: "Test Light Tuner", attribute: "LIGHT", monsterType: "Spellcaster", level: 1, tuner: true,
		archetypes: ["Test Family"], mentions: ["Blue-Eyes White Dragon"], atk: 0, def: 0,
	} };
	const start = createDuel({ seed: 1, you: { deck: [fixture.code, "unknown"] }, rival: { deck: [] }, defs: { [fixture.code]: fixture } });
	const moved = moveCard(start, 1, { zone: "graveyard" });
	expect(printedFacts(moved, 1)).toMatchObject({ name: "Test Light Tuner", attribute: "LIGHT", monsterType: "Spellcaster", level: 1, tuner: true });
	expect(hasPrintedName(moved, 1, "Test Light Tuner")).toBe(true);
	expect(hasPrintedName(moved, 1, "Blue-Eyes White Dragon")).toBe(false);
	expect(belongsTo(moved, 1, "Test Family")).toBe(true);
	expect(belongsTo(moved, 1, "Blue-Eyes")).toBe(false);
	expect(mentionsCard(moved, 1, "Blue-Eyes White Dragon")).toBe(true);
	expect(mentionsCard(moved, 1, "Blue-Eyes")).toBe(false);
	expect(printedFacts(start, 2)).toBeUndefined();
	expect(printedFacts(start, 1)).toEqual(printedFacts(moved, 1));
});

it("answers unknown, not a crash, for an id that is not on the board (review)", () => {
	const duel = createDuel({ seed: 1, you: { deck: [] }, rival: { deck: [] }, defs: {} });
	expect(printedFacts(duel, 999)).toBeUndefined();
	expect(hasPrintedName(duel, 999, "Blue-Eyes White Dragon")).toBe(false);
});
