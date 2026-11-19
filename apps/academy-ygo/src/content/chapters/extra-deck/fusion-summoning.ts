import { effectMonster, fusionMonster, lesson, normalMonster, slide, spell, SRC } from "@/content/helpers";
import { SAMPLE } from "@/lib/sample-cards";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE" });
const unity = fusionMonster("Unity Beast", 6, 2200, 1800, {
	text: '"Bronze Soldier" + "Flame Caster"',
	monsterType: "Beast / Fusion / Effect",
});
const combine = spell("Combine Spell", "normal", { text: "Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field as Fusion Material." });
const contact = fusionMonster("Contact Titan", 7, 2600, 2000, {
	text: "Must be Special Summoned (from your Extra Deck) by sending the above cards from your field to the GY.",
	monsterType: "Warrior / Fusion / Effect",
});

export const fusionSummoningLesson = lesson({
	id: "fusion-summoning",
	chapterId: "extra-deck",
	title: "Fusion Summoning",
	description: "Learn how Fusion Materials merge into one Extra Deck monster, usually with a Polymerization-like Spell that sends the materials to the Graveyard.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"fusion-what",
			"Fusion Means Combining Materials",
			"A Fusion Summon merges listed materials into one Fusion Monster from your Extra Deck. The materials leave, and the new monster appears as a Special Summon.",
			{ template: "illustration", cards: [soldier, caster, unity], chips: [{ label: "Materials", tone: "gold" }, { label: "Merge", tone: "purple" }, { label: "Fusion Monster", tone: "purple" }] },
			"Bronze Soldier and Flame Caster beside Unity Beast, with chips for materials, merge and Fusion Monster.",
		),
		slide(
			"fusion-frame",
			"The Purple Fusion Frame",
			"Fusion Monsters have a purple frame and a type line that says Fusion. Their text lists the materials you need, often by exact card name or by monster type.",
			{ template: "card-anatomy", card: unity, highlight: ["frame", "type", "effect"], labels: [{ part: "frame", text: "Purple Fusion frame" }, { part: "type", text: "Beast / Fusion / Effect" }, { part: "effect", text: "Materials listed here" }] },
			"Unity Beast with purple frame, Fusion type line and material text highlighted.",
		),
		slide(
			"fusion-materials-named",
			"Named Materials Must Match",
			"If the text lists Bronze Soldier plus Flame Caster, you need those exact cards as materials. Substitutes only work when a card specifically allows them.",
			{ template: "numeric", terms: [{ value: "Bronze Soldier", label: "Material 1", tone: "gold" }, { value: "Flame Caster", label: "Material 2", tone: "red" }], op: "+", result: { value: "Unity Beast", label: "Fusion Monster", tone: "purple" }, cards: [soldier, caster, unity] },
			"Numeric addition of Bronze Soldier plus Flame Caster equals Unity Beast.",
		),
		slide(
			"fusion-spell-step",
			"Activate the Fusion Spell",
			"Most Fusion Summons start with a Normal Spell like Combine Spell. You activate it during your Main Phase, then choose legal materials from the places the Spell allows.",
			{ template: "sequence", step: 1, of: 4, action: "Activate Combine Spell from your hand during your Main Phase.", scene: { hand: [combine, soldier, caster], spellTraps: [null, null, null, null, null] }, motion: "hand-to-field" },
			"Step one of four: Combine Spell moves from the hand toward a Spell and Trap Zone.",
		),
		slide(
			"fusion-choose-materials",
			"Choose Materials From Hand or Field",
			"Combine Spell uses monsters from your hand or field. Reveal or select the listed materials. They are not yet gone; they leave when the Spell resolves.",
			{ template: "sequence", step: 2, of: 4, action: "Choose Bronze Soldier and Flame Caster as Fusion Materials.", scene: { hand: [soldier], monsters: [caster, null, null, null, null], spellTraps: [combine, null, null, null, null], materials: [soldier, caster] } },
			"Step two of four: materials selected from hand and field while Combine Spell is active.",
		),
		slide(
			"fusion-materials-to-gy",
			"Materials Go to the Graveyard",
			"When a Polymerization-like Spell resolves, the Fusion Materials are typically sent to the Graveyard. Then the Fusion Monster is Special Summoned from the Extra Deck.",
			{ template: "sequence", step: 3, of: 4, action: "Send the materials to the Graveyard as Combine Spell resolves.", scene: { materials: [{ ...soldier, ghost: true }, { ...caster, ghost: true }], graveyard: [soldier, caster], spellTraps: [combine, null, null, null, null] }, motion: "field-to-graveyard" },
			"Step three of four: Bronze Soldier and Flame Caster are sent to the Graveyard as Fusion Materials.",
			"Other Fusion methods can banish materials or send them from the Deck. Always read the Spell or monster text.",
		),
		slide(
			"fusion-monster-arrives",
			"The Fusion Monster Appears",
			"Unity Beast is Special Summoned from the Extra Deck to an Extra Monster Zone, or to a Main Monster Zone a Link Monster points to. Combine Spell then goes to the Graveyard.",
			{ template: "sequence", step: 4, of: 4, action: "Special Summon Unity Beast from the Extra Deck.", scene: { result: unity, graveyard: [soldier, caster, combine], materials: [] }, motion: "materials-to-result" },
			"Step four of four: Unity Beast appears as the Fusion Summon result while materials and Combine Spell rest in the Graveyard.",
		),
		slide(
			"fusion-on-field",
			"Fusion Summon on the Duel Field",
			"After the Summon, Unity Beast occupies an Extra Monster Zone. The materials are gone from hand and field. You did not use your Normal Summon for this.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "graveyard" }], cards: [{ zone: "emz-left", card: unity }, { zone: "graveyard", card: soldier }], callout: "Fusion Summon is a Special Summon." },
			"Unity Beast in the left Extra Monster Zone with materials in the Graveyard.",
		),
		slide(
			"fusion-contact",
			"Contact Fusion Without a Spell",
			"Some Fusion Monsters Special Summon themselves by sending listed materials from the field to the Graveyard, with no Polymerization Spell. The monster text itself is the method.",
			{ template: "comparison", headings: ["With Combine Spell", "Contact style"], before: { label: "Spell required", cards: [combine, unity], note: "Spell sends materials", tone: "purple" }, after: { label: "Monster method", cards: [contact], note: "Send materials; no Spell", tone: "gold" }, arrowLabel: "Two styles" },
			"Left: Fusion with Combine Spell. Right: a Contact-style Fusion Monster that summons itself by sending materials.",
		),
		slide(
			"fusion-proper-summon",
			"Properly Fusion Summoned First",
			"If Unity Beast later goes to the Graveyard, you usually cannot revive it unless it was properly Fusion Summoned first. Shortcuts that dump it without summoning do not count.",
			{ template: "comparison", headings: ["Proper Fusion Summon", "Never properly summoned"], before: { label: "Can revive later", cards: [unity], note: "Was Fusion Summoned", tone: "green" }, after: { label: "Cannot revive", cards: [{ ...unity, ghost: true }], note: "Sent without summoning", tone: "red" }, arrowLabel: "Check history" },
			"Left: a properly Fusion Summoned monster that can later be revived. Right: a Fusion Monster that never was, shown ghosted.",
		),
		slide(
			"fusion-vs-ritual",
			"Fusion Versus Ritual",
			"Fusion Monsters start in the Extra Deck. Ritual Monsters start in the Main Deck. Both are Special Summons that use tributes or materials, but they live in different places.",
			{ template: "comparison", headings: ["Fusion", "Ritual"], before: { label: "Extra Deck", cards: [unity, combine], note: "Materials + Spell", tone: "purple" }, after: { label: "Main Deck", cards: [SAMPLE.ritualSentinel, spell("Sentinel Ceremony", "ritual")], note: "Monster + Ritual Spell in hand", tone: "gold" }, arrowLabel: "Different decks" },
			"Left: Fusion Monster and Combine Spell from the Extra Deck path. Right: Ritual Monster and Ritual Spell from the Main Deck path.",
		),
		slide(
			"fusion-recap",
			"Fusion Summon Checklist",
			"Have the Fusion Monster in the Extra Deck, a legal method, and matching materials. Send materials as the method says, then Special Summon to a legal Extra Deck zone.",
			{ template: "illustration", cards: [soldier, caster, combine, unity], chips: [{ label: "Materials match", tone: "gold" }, { label: "Method resolves", tone: "blue" }, { label: "Special Summon", tone: "purple" }] },
			"Materials, Combine Spell and Unity Beast with chips for matching materials, method resolves and Special Summon.",
		),
	],
});
