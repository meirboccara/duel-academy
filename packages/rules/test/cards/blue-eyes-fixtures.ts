import type { CardDef, Duel } from "../../src";

/**
 * Made-up cards that stand in for cards of the Blue-Eyes list that are not written yet (every code starts with `fixture-`; none is
 * registered in CARD_DEFS or CARD_SOURCES). Named for what they are: a test must never read one as the real card.
 */
const inert = (duel: Duel) => duel;
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts, ...more });
const spellOrTrap = (code: string, kind: "spell" | "trap" | "quick-play", facts: NonNullable<CardDef["facts"]>): CardDef => ({ code, kind, facts, effects: [{ type: "activation", condition: () => false, operation: inert }] });

export const blueEyesFixtures: Record<string, CardDef> = Object.fromEntries(
	[
		// "Blue-Eyes" monsters that are not Blue-Eyes White Dragon: a Normal Monster, an Effect Monster, a small one.
		monster("fixture-blue-eyes-normal", { name: "Fixture Blue-Eyes Normal", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, normal: true, archetypes: ["Blue-Eyes"] }),
		monster("fixture-blue-eyes-effect", { name: "Fixture Blue-Eyes Effect", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, effect: true, archetypes: ["Blue-Eyes"] }),
		monster("fixture-blue-eyes-small", { name: "Fixture Blue-Eyes Small", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1500, def: 1000, normal: true, archetypes: ["Blue-Eyes"] }),
		// A monster that is not "Blue-Eyes" and is not named Blue-Eyes White Dragon.
		monster("fixture-other-dragon", { name: "Fixture Other Dragon", attribute: "DARK", monsterType: "Dragon", level: 8, atk: 2800, def: 2000, normal: true }),
		// Normal Monsters of Level 6 and 4 (Mausoleum of White), an Effect Monster of Level 4 with no effect written.
		monster("fixture-normal-6", { name: "Fixture Normal 6", attribute: "EARTH", monsterType: "Warrior", level: 6, atk: 2000, def: 1000, normal: true }),
		monster("fixture-normal-4", { name: "Fixture Normal 4", attribute: "EARTH", monsterType: "Warrior", level: 4, atk: 1000, def: 1000, normal: true }),
		monster("fixture-effect-4", { name: "Fixture Effect 4", attribute: "EARTH", monsterType: "Warrior", level: 4, atk: 1000, def: 1000, effect: true }),
		// Level 1 monsters: a LIGHT Tuner (neither Sage nor Maiden nor Effect Veiler), a LIGHT non-Tuner, a DARK Tuner.
		monster("fixture-light-tuner", { name: "Fixture Light Tuner", attribute: "LIGHT", monsterType: "Fairy", level: 1, atk: 0, def: 0, tuner: true, effect: true }),
		monster("fixture-light-1", { name: "Fixture Light 1", attribute: "LIGHT", monsterType: "Fairy", level: 1, atk: 0, def: 0, normal: true }),
		monster("fixture-dark-tuner", { name: "Fixture Dark Tuner", attribute: "DARK", monsterType: "Fiend", level: 1, atk: 0, def: 0, tuner: true, effect: true }),
		// Spells and Traps by what their text says. A Roar of the Blue-Eyed Dragons stand-in mentions the name; the archetype alone is not a mention.
		spellOrTrap("fixture-roar", "spell", { name: "Fixture Roar", mentions: ["Blue-Eyes White Dragon"] }),
		spellOrTrap("fixture-roar-other", "spell", { name: "Fixture Roar Other", mentions: ["Blue-Eyes White Dragon"] }),
		spellOrTrap("fixture-ultimate-trap", "trap", { name: "Fixture Ultimate Trap", mentions: ["Blue-Eyes Ultimate Dragon"] }),
		spellOrTrap("fixture-ultimate-quick", "quick-play", { name: "Fixture Ultimate Quick", mentions: ["Blue-Eyes White Dragon"] }),
		spellOrTrap("fixture-archetype-spell", "spell", { name: "Fixture Archetype Spell", archetypes: ["Blue-Eyes"] }),
		spellOrTrap("fixture-other-spell", "spell", { name: "Fixture Other Spell", mentions: ["Dark Magician"] }),
		monster("fixture-mentioning-monster", { name: "Fixture Mentioning Monster", attribute: "LIGHT", monsterType: "Spellcaster", level: 4, atk: 0, def: 0, mentions: ["Blue-Eyes White Dragon"] }),
		// Burst Stream of Destruction stands in by its printed name only: Mausoleum of White adds it by name.
		spellOrTrap("fixture-burst-stream", "spell", { name: "Burst Stream of Destruction" }),
	].map((def) => [def.code, def]),
);
