import { effectMonster, fusionMonster, lesson, normalMonster, ritualMonster, slide, spell, synchroMonster, xyzMonster, SRC } from "@/content/helpers";
import { SAMPLE } from "@/lib/sample-cards";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const titan = effectMonster("Middle Titan", 5, 2000, 1500, { attribute: "EARTH", text: "Requires 1 Tribute to Normal Summon." });
const recycler = effectMonster("Grave Recycler", 4, 1300, 1100, { attribute: "DARK", text: "You can Special Summon this card from your GY." });
const portal = effectMonster("Hand Portal", 4, 1400, 1000, { attribute: "LIGHT", text: "If you control no monsters: You can Special Summon this card from your hand." });
const unity = fusionMonster("Unity Beast", 6, 2200, 1800, { text: "\"Bronze Soldier\" + \"Flame Caster\"" });
const nova = synchroMonster("Nova Dragon", 8, 2800, 2000, { text: "1 Tuner + 1+ non-Tuner monsters" });
const raider = xyzMonster("Ranked Raider", 4, 2400, 1600, { text: "2 Level 4 monsters" });
const sentinel = ritualMonster("Ritual Sentinel", 7, 2500, 2000);
const combine = spell("Combine Spell", "normal", { text: "Fusion Summon 1 Fusion Monster." });

export const specialSummoningLesson = lesson({
	id: "special-summoning",
	chapterId: "spells-and-traps",
	title: "Special Summoning",
	description: "Learn how Special Summons differ from Normal Summons, where monsters can come from, and why Extra Deck summons are always Special Summons.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"ss-vs-ns",
			"Special Summon Versus Normal Summon",
			"You get one Normal Summon or Set each turn. Special Summons are different: card effects and Extra Deck methods put monsters on the field without using that one Normal Summon.",
			{ template: "comparison", headings: ["Normal Summon", "Special Summon"], before: { label: "Once per turn", cards: [soldier], note: "Uses your Normal Summon", tone: "gold" }, after: { label: "No Normal count", cards: [portal, recycler], note: "As often as effects allow", tone: "green" }, arrowLabel: "Different rules" },
			"Left: a Normal Summon that uses the once-per-turn Normal Summon. Right: Special Summon monsters that do not.",
		),
		slide(
			"ss-sources",
			"Where Special Summons Come From",
			"A Special Summon can pull a monster from your hand, Deck, Graveyard, Extra Deck or banished cards. The effect text always says which place is allowed.",
			{ template: "illustration", cards: [portal, recycler, unity], chips: [{ label: "Hand", tone: "gold" }, { label: "Graveyard", tone: "blue" }, { label: "Extra Deck", tone: "purple" }, { label: "Deck / Banished", tone: "green" }] },
			"Three monsters representing Special Summons from the hand, Graveyard and Extra Deck, with chips for each source.",
		),
		slide(
			"ss-from-hand",
			"Special Summon From the Hand",
			"Some monsters Special Summon themselves from the hand when a condition is met, such as controlling no monsters. You still place them in a Monster Zone like any other summon.",
			{ template: "sequence", step: 1, of: 2, action: "Special Summon Hand Portal from the hand because you control no monsters.", scene: { hand: [portal, soldier], monsters: [null, null, null, null, null] }, motion: "hand-to-field" },
			"Step one of two: Hand Portal moves from the hand toward an empty Monster Zone.",
		),
		slide(
			"ss-from-gy",
			"Special Summon From the Graveyard",
			"Many effects revive monsters from the Graveyard. The monster returns to the field face-up. If it was never properly Summoned first, some Extra Deck monsters cannot be revived.",
			{ template: "sequence", step: 2, of: 2, action: "Special Summon Grave Recycler from the Graveyard to the field.", scene: { graveyard: [], monsters: [recycler, null, null, null, null] }, motion: "hand-to-field" },
			"Step two of two: Grave Recycler appears in a Monster Zone after being Special Summoned from the Graveyard.",
			"Fusion, Synchro, Xyz and Link Monsters usually must be properly Summoned first before they can be Special Summoned from the Graveyard.",
		),
		slide(
			"ss-extra-deck",
			"Extra Deck Summons Are Special Summons",
			"Fusion, Synchro, Xyz, Pendulum from the Extra Deck, and Link Summons are all Special Summons. They do not use your Normal Summon, but each method has its own materials and rules.",
			{ template: "illustration", cards: [unity, nova, raider, SAMPLE.portalGuide], chips: [{ label: "Fusion", tone: "purple" }, { label: "Synchro", tone: "white" }, { label: "Xyz", tone: "blue" }, { label: "Link", tone: "green" }] },
			"Four Extra Deck monsters: Fusion, Synchro, Xyz and Link, each a Special Summon method.",
			"Chapter 3 teaches each Extra Deck method in full. Ritual Summons are also Special Summons, but Ritual Monsters live in the Main Deck.",
		),
		slide(
			"ss-and-tribute",
			"Tribute Is Not the Same Thing",
			"Tributing for a high-Level Normal Summon is still a Normal Summon. Tributing for a Ritual Spell is part of a Ritual Special Summon. Same cost idea, different summon type.",
			{ template: "comparison", headings: ["Tribute Summon", "Ritual Special Summon"], before: { label: "Normal Summon", cards: [titan, soldier], note: "Uses your Normal Summon", tone: "gold" }, after: { label: "Ritual", cards: [sentinel, spell("Sentinel Ceremony", "ritual")], note: "Special Summon", tone: "purple" }, arrowLabel: "Both tribute" },
			"Left: Tributing for Middle Titan as a Normal Summon. Right: Ritual Spell and Ritual Sentinel as a Special Summon.",
		),
		slide(
			"ss-no-limit",
			"How Many Special Summons?",
			"There is no built-in once-per-turn limit on Special Summons. Only card text, once-per-turn clauses, and empty Monster Zones stop you. Some cards say you cannot Special Summon.",
			{ template: "numeric", terms: [{ value: 1, label: "Normal Summon per turn", tone: "gold" }, { value: "many", label: "Special Summons", tone: "green" }], op: "vs", footnote: "Empty zones and card text are the real limits." },
			"Numeric comparison: one Normal Summon per turn versus many Special Summons allowed by effects.",
		),
		slide(
			"ss-conditions",
			"Conditions Versus Costs",
			"Some Special Summons need a condition, like controlling no monsters. Others ask for a cost, like discarding a card. Conditions are checked; costs are paid when you activate the effect.",
			{ template: "illustration", cards: [portal, recycler], chips: [{ label: "Condition: check first", tone: "blue" }, { label: "Cost: pay on activate", tone: "red" }] },
			"Two Special Summon monsters with chips distinguishing conditions from costs.",
		),
		slide(
			"ss-face-up-default",
			"Most Special Summons Are Face-Up",
			"Unless the effect says otherwise, a Special Summon is face-up. You usually choose Attack or Defense Position. Face-down Special Summons only happen when the card text allows it.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "mm2" }, { zone: "mm4" }], cards: [{ zone: "mm2", card: { ...portal, position: "attack" } }, { zone: "mm4", card: { ...recycler, position: "defense" } }], callout: "Face-up Attack or Defense unless text says otherwise." },
			"Your field with one Special Summoned monster in Attack Position and another in face-up Defense Position.",
		),
		slide(
			"ss-with-spell",
			"Spells That Special Summon",
			"Many Spells Special Summon for you. Combine Spell Fusion Summons from the Extra Deck. Other Spells revive from the Graveyard or call monsters from the Deck. Read the destination carefully.",
			{ template: "sequence", step: 2, of: 2, action: "Combine Spell resolves: materials leave, Unity Beast is Special Summoned.", scene: { materials: [soldier, SAMPLE.flameCaster], result: unity, spellTraps: [combine, null, null, null, null], graveyard: [soldier, SAMPLE.flameCaster] }, motion: "materials-to-result" },
			"Combine Spell on the field with materials becoming Unity Beast through a Fusion Special Summon.",
		),
		slide(
			"ss-summary",
			"Special Summon Checklist",
			"Ask four questions: which place does it come from, what condition or cost is required, which zone can it enter, and does any card stop Special Summons right now.",
			{ template: "illustration", cards: [portal, recycler, unity, sentinel], chips: [{ label: "Source", tone: "gold" }, { label: "Cost or condition", tone: "red" }, { label: "Zone", tone: "blue" }, { label: "Locks", tone: "purple" }] },
			"Four Special Summon monsters with chips for source, cost or condition, zone and locks.",
		),
	],
});
