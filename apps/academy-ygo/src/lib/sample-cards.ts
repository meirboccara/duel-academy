/**
 * Schematic educational cards. Names are original teaching examples — not real printed cards.
 * Artwork is never used; frames and numbers carry the lesson.
 */

import type { CardSpec } from "./lesson-types";

export const SAMPLE = {
	bronzeSoldier: {
		name: "Bronze Soldier",
		kind: "normal",
		level: 4,
		atk: 1500,
		def: 1200,
		attribute: "EARTH",
		monsterType: "Warrior",
		text: "A steadfast warrior of the academy grounds.",
	} satisfies CardSpec,

	flameCaster: {
		name: "Flame Caster",
		kind: "effect",
		level: 4,
		atk: 1600,
		def: 800,
		attribute: "FIRE",
		monsterType: "Spellcaster / Effect",
		text: "Once per turn: You can destroy 1 Spell/Trap on the field.",
	} satisfies CardSpec,

	gigantGuardian: {
		name: "Gigant Guardian",
		kind: "effect",
		level: 7,
		atk: 2500,
		def: 2000,
		attribute: "EARTH",
		monsterType: "Warrior / Effect",
		text: "Requires 2 Tributes to Normal Summon.",
	} satisfies CardSpec,

	middleTitan: {
		name: "Middle Titan",
		kind: "effect",
		level: 5,
		atk: 2000,
		def: 1500,
		attribute: "EARTH",
		monsterType: "Warrior / Effect",
		text: "Requires 1 Tribute to Normal Summon.",
	} satisfies CardSpec,

	sparkTuner: {
		name: "Spark Tuner",
		kind: "effect",
		level: 3,
		atk: 1000,
		def: 600,
		attribute: "LIGHT",
		monsterType: "Thunder / Tuner / Effect",
		badge: "Tuner",
		text: "A Tuning monster used for Synchro Summons.",
	} satisfies CardSpec,

	ironKnight: {
		name: "Iron Knight",
		kind: "effect",
		level: 5,
		atk: 1900,
		def: 1400,
		attribute: "EARTH",
		monsterType: "Warrior / Effect",
	} satisfies CardSpec,

	novaDragon: {
		name: "Nova Dragon",
		kind: "synchro",
		level: 8,
		atk: 2800,
		def: 2000,
		attribute: "LIGHT",
		monsterType: "Dragon / Synchro / Effect",
		text: "1 Tuner + 1+ non-Tuner monsters",
	} satisfies CardSpec,

	unityBeast: {
		name: "Unity Beast",
		kind: "fusion",
		level: 6,
		atk: 2200,
		def: 1800,
		attribute: "DARK",
		monsterType: "Beast / Fusion / Effect",
		text: "\"Bronze Soldier\" + \"Flame Caster\"",
	} satisfies CardSpec,

	rankedRaider: {
		name: "Ranked Raider",
		kind: "xyz",
		rank: 4,
		atk: 2400,
		def: 1600,
		attribute: "DARK",
		monsterType: "Warrior / Xyz / Effect",
		text: "2 Level 4 monsters",
	} satisfies CardSpec,

	portalGuide: {
		name: "Portal Guide",
		kind: "link",
		link: 2,
		atk: 1400,
		def: "—",
		attribute: "DARK",
		monsterType: "Cyberse / Link / Effect",
		arrows: ["SW", "SE"],
		text: "2 monsters",
	} satisfies CardSpec,

	ritualSentinel: {
		name: "Ritual Sentinel",
		kind: "ritual",
		level: 7,
		atk: 2500,
		def: 2000,
		attribute: "LIGHT",
		monsterType: "Warrior / Ritual / Effect",
		text: "You can Ritual Summon this card with \"Sentinel Ceremony\".",
	} satisfies CardSpec,

	polymerization: {
		name: "Combine Spell",
		kind: "spell",
		subtype: "normal",
		text: "Fusion Summon 1 Fusion Monster from your Extra Deck.",
	} satisfies CardSpec,

	swordBoost: {
		name: "Blade Boost",
		kind: "spell",
		subtype: "equip",
		text: "The equipped monster gains 400 ATK.",
	} satisfies CardSpec,

	stormField: {
		name: "Storm Territory",
		kind: "spell",
		subtype: "field",
		text: "All WIND monsters gain 200 ATK/DEF.",
	} satisfies CardSpec,

	quickStrike: {
		name: "Sudden Strike",
		kind: "spell",
		subtype: "quick-play",
		text: "Target 1 face-up monster; it gains 700 ATK until the end of this turn.",
	} satisfies CardSpec,

	mirrorBarrier: {
		name: "Mirror Barrier",
		kind: "trap",
		subtype: "normal",
		text: "When an opponent's monster declares an attack: Negate the attack.",
	} satisfies CardSpec,

	counterSeal: {
		name: "Seal Counter",
		kind: "trap",
		subtype: "counter",
		text: "When a Spell/Trap Card is activated: Negate the activation, and if you do, destroy it.",
	} satisfies CardSpec,

	pendulumLeft: {
		name: "Scale Mage",
		kind: "effect",
		level: 4,
		atk: 1500,
		def: 1000,
		attribute: "WATER",
		monsterType: "Spellcaster / Pendulum / Effect",
		pendulum: { left: 2, right: 2, text: "Once per turn: Draw 1 card." },
	} satisfies CardSpec,

	pendulumRight: {
		name: "Scale Knight",
		kind: "effect",
		level: 4,
		atk: 1700,
		def: 1200,
		attribute: "EARTH",
		monsterType: "Warrior / Pendulum / Effect",
		pendulum: { left: 7, right: 7, text: "Monsters you control gain 200 ATK." },
	} satisfies CardSpec,
} as const;
