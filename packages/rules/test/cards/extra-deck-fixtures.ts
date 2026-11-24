import type { CardDef, Duel } from "../../src";

/**
 * Made-up cards that stand in for cards the Extra Deck batch needs and that are not written (every code starts with `fixture-`; none is
 * registered in CARD_DEFS or CARD_SOURCES): Synchro and Link materials of every Level, the "Ancient Fairy Dragon" family, "World of Spirits",
 * "Eternal Sunshine", Spells and Traps that mention "Crimson Dragon", and Extra Deck monsters to be Summoned by Crimson Dragon. A test must never
 * read one as the real card.
 */
const inert = (duel: Duel) => duel;
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts, ...more });
const spellOrTrap = (code: string, kind: "spell" | "trap" | "quick-play", facts: NonNullable<CardDef["facts"]>): CardDef => ({ code, kind, facts, effects: [{ type: "activation", condition: () => false, operation: inert }] });
const plain = (level: number): CardDef => monster(`fixture-plain-${level}`, { name: `Fixture Plain ${level}`, attribute: "EARTH", monsterType: "Warrior", level, atk: level * 300, def: level * 100, normal: true });
const tuner = (level: number): CardDef => monster(`fixture-tuner-${level}`, { name: `Fixture Tuner ${level}`, attribute: "LIGHT", monsterType: "Fairy", level, atk: 0, def: 0, tuner: true, effect: true });
const synchro = (code: string, level: number, monsterType: "Dragon" | "Warrior", more: Partial<NonNullable<CardDef["facts"]>> = {}): CardDef =>
	monster(code, { name: code, attribute: "LIGHT", monsterType, level, atk: 2000, def: 2000, frame: "synchro", effect: true, ...more }, { procedure: { kind: "synchro" } });

export const extraDeckFixtures: Record<string, CardDef> = Object.fromEntries(
	[
		...[1, 2, 3, 4, 5, 6, 7, 8].map(plain),
		...[1, 2, 3, 4, 5].map(tuner),
		// Level 4 or lower Dragons and Spellcasters (Link materials of Spirit with Eyes of Blue), a Level 5 Dragon, a Level 4 Warrior.
		monster("fixture-dragon-4", { name: "Fixture Dragon 4", attribute: "WIND", monsterType: "Dragon", level: 4, atk: 1500, def: 1000, normal: true }),
		monster("fixture-dragon-5", { name: "Fixture Dragon 5", attribute: "WIND", monsterType: "Dragon", level: 5, atk: 1800, def: 1000, normal: true }),
		monster("fixture-spellcaster-4", { name: "Fixture Spellcaster 4", attribute: "DARK", monsterType: "Spellcaster", level: 4, atk: 1500, def: 1000, effect: true }),
		// A "Blue-Eyes" monster that is not a Dragon (the Type is not part of the archetype): what Spirit with Eyes of Blue's restriction can stop.
		monster("fixture-blue-eyes-non-dragon", { name: "Fixture Blue-Eyes Non-Dragon", attribute: "LIGHT", monsterType: "Warrior", level: 4, atk: 1800, def: 1000, effect: true, archetypes: ["Blue-Eyes"] }),
		monster("fixture-warrior-4", { name: "Fixture Warrior 4", attribute: "EARTH", monsterType: "Warrior", level: 4, atk: 1500, def: 1000, normal: true }),
		// "Ancient Fairy Dragon" stands in by its printed name; a monster that mentions it; one that does not.
		monster("fixture-ancient-fairy-dragon", { name: "Ancient Fairy Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 6, atk: 2100, def: 3000, effect: true }),
		monster("fixture-mentions-ancient-fairy-dragon", { name: "Fixture Mentions Ancient Fairy Dragon", attribute: "LIGHT", monsterType: "Fairy", level: 4, atk: 1000, def: 1000, effect: true, mentions: ["Ancient Fairy Dragon"] }),
		monster("fixture-bystander", { name: "Fixture Bystander", attribute: "LIGHT", monsterType: "Fairy", level: 4, atk: 1000, def: 1000, effect: true }),
		// Spells by name: "World of Spirits" (a Continuous Spell stand-in), "Eternal Sunshine".
		spellOrTrap("fixture-world-of-spirits", "spell", { name: "World of Spirits" }),
		spellOrTrap("fixture-eternal-sunshine", "spell", { name: "Eternal Sunshine" }),
		// LIGHT Beast, Plant and Fairy monsters, and ones that are not: a DARK Beast, a LIGHT Dragon, a LIGHT Warrior.
		monster("fixture-light-beast", { name: "Fixture Light Beast", attribute: "LIGHT", monsterType: "Beast", level: 4, atk: 1500, def: 1000, effect: true }),
		monster("fixture-light-plant", { name: "Fixture Light Plant", attribute: "LIGHT", monsterType: "Plant", level: 4, atk: 1500, def: 1000, effect: true }),
		monster("fixture-light-fairy", { name: "Fixture Light Fairy", attribute: "LIGHT", monsterType: "Fairy", level: 4, atk: 1500, def: 1000, effect: true }),
		monster("fixture-dark-beast", { name: "Fixture Dark Beast", attribute: "DARK", monsterType: "Beast", level: 4, atk: 1500, def: 1000, effect: true }),
		monster("fixture-light-dragon", { name: "Fixture Light Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1500, def: 1000, effect: true }),
		monster("fixture-light-warrior", { name: "Fixture Light Warrior", attribute: "LIGHT", monsterType: "Warrior", level: 4, atk: 1500, def: 1000, effect: true }),
		// Spells and Traps that mention "Crimson Dragon" in their text, and one that only has "Crimson" in its own name.
		spellOrTrap("fixture-crimson-spell", "spell", { name: "Fixture Crimson Spell", mentions: ["Crimson Dragon"] }),
		spellOrTrap("fixture-crimson-trap", "trap", { name: "Fixture Crimson Trap", mentions: ["Crimson Dragon"] }),
		spellOrTrap("fixture-crimson-name", "spell", { name: "Crimson Dragon Fixture Name" }),
		monster("fixture-crimson-monster", { name: "Fixture Crimson Monster", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1000, def: 1000, effect: true, mentions: ["Crimson Dragon"] }),
		// Synchro Monsters: Level 7 and 8 Dragons (targets and Summons of Crimson Dragon), a Level 8 Warrior, a Level 6 Dragon, a Level 12 Dragon.
		synchro("fixture-synchro-dragon-7", 7, "Dragon"),
		synchro("fixture-synchro-dragon-7-b", 7, "Dragon"),
		synchro("fixture-synchro-dragon-8", 8, "Dragon"),
		synchro("fixture-synchro-dragon-8-b", 8, "Dragon"),
		synchro("fixture-synchro-warrior-8", 8, "Warrior"),
		synchro("fixture-synchro-dragon-6", 6, "Dragon"),
		synchro("fixture-synchro-dragon-12", 12, "Dragon"),
		// A Synchro Monster that can only be Special Summoned by its own procedure ("Must be Synchro Summoned").
		monster("fixture-must-be-synchro-dragon-8", { name: "Fixture Must Be Synchro Dragon 8", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 3000, frame: "synchro", effect: true }, { procedure: { kind: "synchro" }, summon: { onlyByOwnProcedure: true } }),
		// A Normal Monster as such, to count in the Graveyard.
		monster("fixture-normal-3", { name: "Fixture Normal 3", attribute: "EARTH", monsterType: "Warrior", level: 3, atk: 1000, def: 1000, normal: true }),
	].map((def) => [def.code, def]),
);
