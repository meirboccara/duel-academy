import { effectMonster, lesson, slide, synchroMonster, SRC } from "@/content/helpers";
import { SAMPLE } from "@/lib/sample-cards";

const tuner = SAMPLE.sparkTuner;
const knight = SAMPLE.ironKnight;
const nova = SAMPLE.novaDragon;
const swift = synchroMonster("Swift Lancer", 5, 2100, 1600, { text: "1 Tuner + 1+ non-Tuner monsters" });
const bigTuner = effectMonster("Bell Tuner", 2, 800, 500, { attribute: "WIND", monsterType: "Fairy / Tuner / Effect", badge: "Tuner", text: "A Tuning monster." });
const plain = effectMonster("Squire Scout", 3, 1200, 900, { attribute: "EARTH" });

export const synchroSummoningLesson = lesson({
	id: "synchro-summoning",
	chapterId: "extra-deck",
	title: "Synchro Summoning",
	description: "Add one Tuner and non-Tuner monsters until their Levels equal a Synchro Monster, then send them to the Graveyard and summon it.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"synchro-what",
			"Synchro Means Tuning Levels Together",
			"A Synchro Summon uses one Tuner monster and one or more other monsters on your field. Their Levels are added together and must equal the Synchro Monster's Level.",
			{ template: "illustration", cards: [tuner, knight, nova], chips: [{ label: "1 Tuner", tone: "gold" }, { label: "+ non-Tuner(s)", tone: "blue" }, { label: "= Synchro Level", tone: "white" }] },
			"Spark Tuner and Iron Knight beside Nova Dragon, with chips for one Tuner, non-Tuners and equals the Synchro Level.",
		),
		slide(
			"synchro-frame",
			"The White Synchro Frame",
			"Synchro Monsters have a white frame, Level stars, and text such as 1 Tuner + 1 or more non-Tuner monsters. They are kept in the Extra Deck.",
			{ template: "card-anatomy", card: nova, highlight: ["frame", "level", "effect"], labels: [{ part: "frame", text: "White Synchro frame" }, { part: "level", text: "Level 8" }, { part: "effect", text: "Material requirement" }] },
			"Nova Dragon with its white frame, Level 8 stars and material text highlighted.",
		),
		slide(
			"synchro-tuner-badge",
			"What a Tuner Is",
			"A Tuner is a monster with Tuner in its type line. A Synchro Summon needs exactly one Tuner among its materials. The other materials must not be Tuners.",
			{ template: "card-anatomy", card: tuner, highlight: ["type", "level"], labels: [{ part: "type", text: "Thunder / Tuner / Effect" }, { part: "level", text: "Level 3" }] },
			"Spark Tuner with its Tuner type line and Level 3 highlighted.",
		),
		slide(
			"synchro-math-basic",
			"The Level Math: 3 + 5 = 8",
			"Spark Tuner is Level 3 and Iron Knight is Level 5. Add them: 3 plus 5 equals 8. That matches Nova Dragon, a Level 8 Synchro Monster.",
			{ template: "numeric", terms: [{ value: 3, label: "Spark Tuner", tone: "gold" }, { value: 5, label: "Iron Knight", tone: "blue" }], op: "+", result: { value: 8, label: "Nova Dragon Level", tone: "white" }, cards: [tuner, knight, nova] },
			"Level 3 plus Level 5 equals Level 8 for Nova Dragon.",
		),
		slide(
			"synchro-board",
			"Materials Must Be on Your Field",
			"Synchro Materials come from your Monster Zones, face-up. A monster in your hand cannot be used. Put the Tuner and the other monster onto the field first.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "mm2" }, { zone: "mm3" }], cards: [{ zone: "mm2", card: tuner }, { zone: "mm3", card: knight }], callout: "Materials: face-up on your field." },
			"Your field with Spark Tuner and Iron Knight face-up in adjacent Monster Zones.",
		),
		slide(
			"synchro-step-1",
			"Step One: Choose the Materials",
			"During your Main Phase, announce a Synchro Summon. Choose one Tuner and the non-Tuner monsters that give the right total. No Spell Card is needed.",
			{ template: "sequence", step: 1, of: 3, action: "Choose Spark Tuner and Iron Knight as Synchro Materials.", scene: { monsters: [tuner, knight, null, null, null], materials: [tuner, knight] } },
			"Step one of three: Spark Tuner and Iron Knight are selected as Synchro Materials.",
		),
		slide(
			"synchro-step-2",
			"Step Two: Materials Go to the Graveyard",
			"Both materials are sent to the Graveyard. This counts as a Synchro Summon cost. The Synchro Monster is not yet on the field at this moment.",
			{ template: "sequence", step: 2, of: 3, action: "Send both materials to the Graveyard.", scene: { materials: [{ ...tuner, ghost: true }, { ...knight, ghost: true }], graveyard: [tuner, knight] }, motion: "field-to-graveyard" },
			"Step two of three: Spark Tuner and Iron Knight move to the Graveyard.",
		),
		slide(
			"synchro-step-3",
			"Step Three: Nova Dragon Arrives",
			"Nova Dragon is Special Summoned from the Extra Deck to an Extra Monster Zone, or to a zone pointed to by a Link Monster. It uses no Normal Summon.",
			{ template: "sequence", step: 3, of: 3, action: "Special Summon Nova Dragon from the Extra Deck.", scene: { result: nova, graveyard: [tuner, knight] }, motion: "materials-to-result" },
			"Step three of three: Nova Dragon appears as the Synchro result while materials rest in the Graveyard.",
		),
		slide(
			"synchro-other-sums",
			"Other Legal Totals",
			"Different materials can make different Synchro Monsters. A Level 2 Tuner plus a Level 3 monster makes Level 5, enough for Swift Lancer. Always add every material.",
			{ template: "numeric", terms: [{ value: 2, label: "Bell Tuner", tone: "gold" }, { value: 3, label: "Squire Scout", tone: "blue" }], op: "+", result: { value: 5, label: "Swift Lancer Level", tone: "white" }, cards: [bigTuner, plain, swift] },
			"Level 2 plus Level 3 equals Level 5 for Swift Lancer.",
		),
		slide(
			"synchro-wrong-sum",
			"When the Math Does Not Work",
			"If the total is 7 or 9 when you need 8, the Synchro Summon is illegal. You may not summon a Synchro Monster whose Level differs from the exact total of the materials.",
			{ template: "numeric", terms: [{ value: 3, label: "Spark Tuner", tone: "gold" }, { value: 4, label: "Level 4 monster", tone: "blue" }], op: "vs", result: { value: 8, label: "Needed for Nova Dragon", tone: "red" }, footnote: "3 + 4 = 7, which is not 8, so this Synchro Summon is illegal." },
			"Numeric comparison showing 3 plus 4 equals 7, which does not match the required Level 8.",
		),
		slide(
			"synchro-recap",
			"Synchro Summon Checklist",
			"One face-up Tuner and the right non-Tuners on your field, Level total equals the Synchro Monster, send them to the Graveyard, then Special Summon to a legal zone.",
			{ template: "illustration", cards: [tuner, knight, nova], chips: [{ label: "1 Tuner only", tone: "gold" }, { label: "Levels add up", tone: "blue" }, { label: "Materials to GY", tone: "red" }] },
			"Spark Tuner, Iron Knight and Nova Dragon with chips for one Tuner, levels add up and materials to the Graveyard.",
		),
	],
});
