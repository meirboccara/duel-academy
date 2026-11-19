import { effectMonster, lesson, normalMonster, slide, xyzMonster, SRC } from "@/content/helpers";
import { SAMPLE } from "@/lib/sample-cards";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = SAMPLE.flameCaster;
const raider = SAMPLE.rankedRaider;
const titan = SAMPLE.middleTitan;
const shield = effectMonster("Plate Warden", 3, 1000, 1800, { attribute: "EARTH" });
const lowXyz = xyzMonster("Rank Three Rook", 3, 1800, 1400, { text: "2 Level 3 monsters" });
const raiderWithEffect = xyzMonster("Ranked Raider", 4, 2400, 1600, { text: "Detach 1 material: Target 1 monster your opponent controls; it loses 500 ATK until end of turn." });

export const xyzSummoningLesson = lesson({
	id: "xyz-summoning",
	chapterId: "extra-deck",
	title: "Xyz Summoning",
	description: "Stack monsters of the same Level beneath a Rank, then detach them as costs for powerful effects. Xyz Monsters have Ranks, not Levels.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"xyz-what",
			"Xyz Means Overlay",
			"An Xyz Summon uses two or more monsters of the same Level and stacks them beneath an Xyz Monster. Those stacked cards are called Xyz Materials, and they stay on the field attached.",
			{ template: "illustration", cards: [soldier, caster, raider], chips: [{ label: "Same Level", tone: "gold" }, { label: "Overlay", tone: "blue" }, { label: "Xyz Monster", tone: "white" }] },
			"Bronze Soldier and Flame Caster beside Ranked Raider, with chips for same Level, overlay and Xyz Monster.",
		),
		slide(
			"xyz-frame",
			"The Black Xyz Frame and Rank Stars",
			"Xyz Monsters have a black frame and stars on the left called Rank. A Rank is not a Level. Xyz Monsters have no Level and Level effects ignore them.",
			{ template: "card-anatomy", card: raider, highlight: ["frame", "level", "effect"], labels: [{ part: "frame", text: "Black Xyz frame" }, { part: "level", text: "Rank 4, not Level" }, { part: "effect", text: "Requirement: 2 Level 4 monsters" }] },
			"Ranked Raider with its black frame, Rank 4 stars and material text highlighted.",
		),
		slide(
			"xyz-rank-vs-level",
			"Rank Versus Level",
			"Level is on Main Deck and Synchro monsters. Rank is the Xyz version, shown on the left in reversed order. A Rank 4 Xyz needs two Level 4 materials, but it is never Level 4 itself.",
			{ template: "card-anatomy", card: caster, highlight: ["level"], labels: [{ part: "level", text: "Level 4" }], compare: [raider] },
			"Level 4 Flame Caster compared with Rank 4 Ranked Raider, which has Rank instead of Level.",
		),
		slide(
			"xyz-requirement",
			"Same Level, Specific Count",
			"The requirement reads like 2 Level 4 monsters. All materials must share that exact Level. Level 3 and Level 4 cannot be mixed. The count must also match.",
			{ template: "numeric", terms: [{ value: 4, label: "Bronze Soldier Level", tone: "gold" }, { value: 4, label: "Flame Caster Level", tone: "blue" }], op: "=", result: { value: "Rank 4", label: "Ranked Raider", tone: "white" }, cards: [soldier, caster, raider], footnote: "Both Level 4, so both can overlay a Rank 4 Xyz." },
			"Two Level 4 monsters match, leading to Rank 4 Ranked Raider.",
		),
		slide(
			"xyz-wrong-level",
			"Mixed Levels Do Not Work",
			"A Level 3 and a Level 4 monster are not the same Level. They cannot be Xyz Materials together for Ranked Raider, because the materials must match exactly.",
			{ template: "numeric", terms: [{ value: 3, label: "Plate Warden", tone: "gold" }, { value: 4, label: "Flame Caster", tone: "blue" }], op: "vs", footnote: "3 is not equal to 4: illegal Xyz Summon.", cards: [shield, caster] },
			"Level 3 versus Level 4: the Levels differ, so an Xyz Summon is illegal.",
		),
		slide(
			"xyz-board",
			"Materials Start on Your Field",
			"Both materials must be face-up on your field. Put the two Level 4 monsters in Monster Zones, then begin the Xyz Summon during your Main Phase. No Spell needed.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "mm2" }, { zone: "mm3" }], cards: [{ zone: "mm2", card: soldier }, { zone: "mm3", card: caster }], callout: "Two Level 4 monsters, face-up." },
			"Your field with two Level 4 monsters face-up in adjacent Monster Zones.",
		),
		slide(
			"xyz-step-overlay",
			"Overlay: Stack Them Underneath",
			"The Xyz Monster is placed from your Extra Deck, and the materials slide underneath it. They are not sent to the Graveyard: they stay attached as Xyz Materials.",
			{ template: "sequence", step: 2, of: 3, action: "Overlay Bronze Soldier and Flame Caster under Ranked Raider.", scene: { materials: [soldier, caster], result: raider }, motion: "materials-to-result" },
			"Step two of three: two monsters slide beneath Ranked Raider as Xyz Materials.",
		),
		slide(
			"xyz-after",
			"Materials Are Not in the Graveyard",
			"After the Summon, the materials are attached to the Xyz Monster, not in the Graveyard. They are no longer separate monsters on the field and they do not count as cards in your Graveyard.",
			{ template: "comparison", headings: ["Synchro", "Xyz"], before: { label: "Materials to GY", cards: [SAMPLE.novaDragon], note: "Materials go to the Graveyard", tone: "blue" }, after: { label: "Materials stay", cards: [{ ...raider, order: 2 }], note: "2 Xyz Materials attached", tone: "purple" }, arrowLabel: "Different fate" },
			"Left: Synchro materials go to the Graveyard. Right: Xyz materials stay attached beneath the monster.",
		),
		slide(
			"xyz-detach",
			"Detach Materials to Use Effects",
			"Many Xyz effects cost one or more Xyz Materials. You detach them and send them to the Graveyard. Fewer materials means fewer uses, so each overlay matters.",
			{ template: "sequence", step: 3, of: 3, action: "Detach 1 Xyz Material: the opponent's monster loses 500 ATK.", scene: { result: { ...raiderWithEffect, order: 1 }, graveyard: [soldier] }, motion: "field-to-graveyard" },
			"Step three of three: one material is detached and sent to the Graveyard to pay for an effect.",
		),
		slide(
			"xyz-count",
			"Count the Materials",
			"A common Xyz Monster starts with two materials. Each detach lowers the count by one. Cards like Ranked Raider with 2 materials can usually activate their effect twice.",
			{ template: "numeric", terms: [{ value: 2, label: "Starting materials", tone: "gold" }, { value: 1, label: "Detach 1", tone: "red" }], op: "-", result: { value: 1, label: "Materials left", tone: "green" }, cards: [raiderWithEffect] },
			"Two Xyz Materials minus one detach leaves one material.",
		),
		slide(
			"xyz-no-level",
			"Xyz Monsters Have No Level",
			"Effects that mention Level do not apply to Xyz Monsters. A Level 4 effect cannot target a Rank 4 Xyz. Also, Xyz Monsters cannot be used as Synchro materials by Level.",
			{ template: "comparison", headings: ["Level 4 monster", "Rank 4 Xyz"], before: { label: "Has a Level", cards: [caster], note: "Level effects apply", tone: "gold" }, after: { label: "Has a Rank", cards: [raider], note: "Level effects ignore it", tone: "purple" }, arrowLabel: "No Level" },
			"Left: a Level 4 monster affected by Level effects. Right: a Rank 4 Xyz that Level effects ignore.",
		),
		slide(
			"xyz-position",
			"Xyz Monsters Are Special Summoned",
			"An Xyz Summon is a Special Summon from the Extra Deck to an Extra Monster Zone, or to a Main Monster Zone a Link Monster points to. It does not use your Normal Summon.",
			{ template: "duel-field", highlight: [{ zone: "emz-right" }], cards: [{ zone: "emz-right", card: raider }], callout: "Extra Monster Zone for Extra Deck summons." },
			"Ranked Raider placed in the right Extra Monster Zone after an Xyz Summon.",
		),
		slide(
			"xyz-recap",
			"Xyz Summon Checklist",
			"Two or more face-up monsters of the same Level, an Xyz Monster whose Rank and count match, materials overlaid beneath it, and effects paid by detaching materials.",
			{ template: "illustration", cards: [soldier, caster, raider], chips: [{ label: "Same Level", tone: "gold" }, { label: "Rank, not Level", tone: "purple" }, { label: "Detach for effects", tone: "red" }] },
			"Two Level 4 monsters and Ranked Raider with chips: same Level, Rank not Level, detach for effects.",
		),
	],
});
