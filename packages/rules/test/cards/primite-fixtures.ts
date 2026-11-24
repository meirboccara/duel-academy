import { type CardDef, type Duel, effectDestruction, destroyCard, targetsOf } from "../../src";

/**
 * Made-up cards that stand in for cards of the Blue-Eyes list that are not written, or for cards a test needs around the "Primite" cards
 * (every code starts with `fixture-`; none is registered in CARD_DEFS or CARD_SOURCES). A test must never read one as the real card.
 */
const inert = (duel: Duel) => duel;
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts, ...more });
const spellOrTrap = (code: string, kind: "spell" | "trap" | "quick-play", facts: NonNullable<CardDef["facts"]>): CardDef => ({ code, kind, facts, effects: [{ type: "activation", condition: () => false, operation: inert }] });

const cards: CardDef[] = [
	// "Primite" monsters: a Normal Monster, an Effect Monster of Level 5, an Effect Monster of Level 4.
	monster("fixture-primite-normal", { name: "Fixture Primite Normal", attribute: "EARTH", monsterType: "Dragon", level: 4, atk: 1000, def: 1000, normal: true, archetypes: ["Primite"] }),
	monster("fixture-primite-5", { name: "Fixture Primite 5", attribute: "EARTH", monsterType: "Dragon", level: 5, atk: 2000, def: 1000, effect: true, archetypes: ["Primite"] }),
	monster("fixture-primite-4", { name: "Fixture Primite 4", attribute: "EARTH", monsterType: "Dragon", level: 4, atk: 1500, def: 1000, effect: true, archetypes: ["Primite"] }),
	// "Primite" Spells and Traps, and a Field Spell.
	spellOrTrap("fixture-primite-spell", "spell", { name: "Fixture Primite Spell", archetypes: ["Primite"] }),
	spellOrTrap("fixture-primite-trap", "trap", { name: "Fixture Primite Trap", archetypes: ["Primite"] }),
	spellOrTrap("fixture-primite-quick", "quick-play", { name: "Fixture Primite Quick", archetypes: ["Primite"] }),
	spellOrTrap("fixture-plain-spell", "spell", { name: "Fixture Plain Spell" }),
	// A Ritual Monster with no effect (a monster that is not a Normal Monster and has no effect).
	{ code: "fixture-ritual-vanilla", kind: "monster", facts: { name: "Fixture Ritual Vanilla", frame: "ritual", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 2800, def: 2400 }, procedure: { kind: "ritual" } },
	// An Effect Monster with an Ignition Effect on the field (the effect does nothing).
	{ code: "fixture-ignition-monster", kind: "monster", facts: { name: "Fixture Ignition Monster", attribute: "EARTH", monsterType: "Warrior", level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "ignition", operation: inert }] },
	// A Quick-Play Spell: "Destroy 1 Spell/Trap on the field" (it targets the first one it finds; made up).
	{
		code: "fixture-spell-breaker",
		kind: "quick-play",
		facts: { name: "Fixture Spell Breaker" },
		effects: [{ type: "activation", target: (duel) => [...duel.piles.you.spell, ...duel.piles.rival.spell], operation: (duel, link) => { const target = targetsOf(duel, link)[0]; return target ? destroyCard(duel, target.id, { destruction: effectDestruction(link) }) : duel; } }],
	},
];

export const primiteFixtures: Record<string, CardDef> = Object.fromEntries(cards.map((def) => [def.code, def]));
