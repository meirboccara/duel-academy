import { effectMonster, lesson, normalMonster, ritualMonster, slide, spell, SRC } from "@/content/helpers";

const sentinel = ritualMonster("Ritual Sentinel", 7, 2500, 2000, { text: 'You can Ritual Summon this card with "Sentinel Ceremony".' });
const ceremony = spell("Sentinel Ceremony", "ritual", { text: 'Ritual Summon "Ritual Sentinel". Tribute monsters from your hand or field whose total Levels equal or exceed 7.' });
const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const scout = effectMonster("Hand Scout", 3, 1000, 1000, { attribute: "WIND" });
const titan = effectMonster("Middle Titan", 5, 2000, 1500, { attribute: "EARTH" });
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE" });

export const ritualSummoningLesson = lesson({
	id: "ritual-summoning",
	chapterId: "extra-deck",
	title: "Ritual Summoning",
	description: "Ritual Monsters live in the Main Deck, not the Extra Deck. Use a Ritual Spell and Tribute monsters to Special Summon them from your hand.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"ritual-main-deck",
			"Ritual Monsters Are Main Deck Cards",
			"Despite being a special summoning method, Ritual Monsters are kept in your Main Deck. You draw them into your hand. They are not Extra Deck monsters.",
			{ template: "comparison", headings: ["Main Deck", "Extra Deck"], before: { label: "Ritual Monster", cards: [sentinel], note: "Drawn into your hand", tone: "gold" }, after: { label: "Fusion, Synchro, Xyz, Link", cards: [], note: "Never drawn", tone: "purple" }, arrowLabel: "Different decks" },
			"Left: a Ritual Monster belongs to the Main Deck and is drawn. Right: Extra Deck monsters are never drawn.",
			"The Extra Deck holds only Fusion, Synchro, Xyz and Link Monsters, plus face-up Pendulum Monsters.",
		),
		slide(
			"ritual-frame",
			"The Blue Ritual Frame",
			"Ritual Monsters have a blue frame, Level stars, ATK and DEF, and a type line that says Ritual. Their text names the Ritual Spell that summons them.",
			{ template: "card-anatomy", card: sentinel, highlight: ["frame", "level", "type", "effect"], labels: [{ part: "frame", text: "Blue Ritual frame" }, { part: "level", text: "Level 7" }, { part: "type", text: "Warrior / Ritual / Effect" }, { part: "effect", text: "Names its Ritual Spell" }] },
			"Ritual Sentinel with its blue frame, Level 7, type line and effect text highlighted.",
		),
		slide(
			"ritual-pieces",
			"You Need Three Pieces",
			"A Ritual Summon needs a Ritual Monster in your hand, a matching Ritual Spell, and monsters to Tribute. Without all three pieces, the summon cannot happen.",
			{ template: "illustration", cards: [ceremony, sentinel, soldier, scout], chips: [{ label: "Ritual Spell", tone: "gold" }, { label: "Ritual Monster in hand", tone: "purple" }, { label: "Tribute monsters", tone: "blue" }] },
			"Ritual Spell and Ritual Monster in hand with Tribute monsters and chips naming each piece.",
		),
		slide(
			"ritual-activate",
			"Step One: Activate the Ritual Spell",
			"During your Main Phase, activate Sentinel Ceremony from your hand. It goes on the chain, and the Tributes are chosen as it resolves.",
			{ template: "sequence", step: 1, of: 4, action: "Activate Sentinel Ceremony from your hand.", scene: { hand: [ceremony, sentinel, soldier, scout], spellTraps: [null, null, null, null, null] }, motion: "hand-to-field" },
			"Step one of four: the Ritual Spell moves from the hand to a Spell and Trap Zone.",
		),
		slide(
			"ritual-level-math",
			"Step Two: Tribute Enough Levels",
			"Ritual Sentinel is Level 7. Choose Tributes whose Levels add up to at least 7. Bronze Soldier is Level 4 and Hand Scout is Level 3. Together that is exactly 7.",
			{ template: "numeric", terms: [{ value: 4, label: "Bronze Soldier", tone: "gold" }, { value: 3, label: "Hand Scout", tone: "blue" }], op: "+", result: { value: 7, label: "Meets Level 7", tone: "green" }, cards: [soldier, scout, sentinel] },
			"Level 4 plus Level 3 equals 7, enough to Ritual Summon a Level 7 monster.",
		),
		slide(
			"ritual-exceed",
			"More Than Enough Is Allowed",
			"Tributes must equal or exceed the Ritual Monster's Level. Middle Titan is Level 5 and Flame Caster is Level 4, making 9. That is legal, but you lose both monsters.",
			{ template: "numeric", terms: [{ value: 5, label: "Middle Titan", tone: "gold" }, { value: 4, label: "Flame Caster", tone: "blue" }], op: "+", result: { value: 9, label: "At least 7: legal", tone: "green" }, cards: [titan, caster, sentinel], footnote: "9 is 7 or more, so the summon is legal." },
			"Level 5 plus Level 4 equals 9, which is more than the required 7, so it is legal.",
		),
		slide(
			"ritual-tribute-gy",
			"Step Three: Tributes Go to the Graveyard",
			"The chosen monsters are sent to the Graveyard as Tributes, from your hand or field as the Spell allows. They are used up to pay the Level cost.",
			{ template: "sequence", step: 3, of: 4, action: "Tribute Bronze Soldier and Hand Scout.", scene: { materials: [{ ...soldier, ghost: true }, { ...scout, ghost: true }], graveyard: [soldier, scout], spellTraps: [ceremony, null, null, null, null] }, motion: "field-to-graveyard" },
			"Step three of four: both Tribute monsters move to the Graveyard while the Ritual Spell resolves.",
		),
		slide(
			"ritual-arrives",
			"Step Four: Ritual Sentinel Arrives",
			"Ritual Sentinel is Special Summoned from your hand to a Main Monster Zone, face-up. It is a Special Summon, so it does not use your Normal Summon.",
			{ template: "sequence", step: 4, of: 4, action: "Special Summon Ritual Sentinel from your hand.", scene: { monsters: [sentinel, null, null, null, null], graveyard: [soldier, scout, ceremony] }, motion: "hand-to-field" },
			"Step four of four: Ritual Sentinel appears in a Main Monster Zone from the hand.",
		),
		slide(
			"ritual-vs-extra",
			"Ritual Versus Extra Deck Summons",
			"A Ritual Monster comes from your hand to any free Main Monster Zone. Extra Deck monsters need an Extra Monster Zone or a linked zone. Rituals need neither.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "mm3" }, { zone: "hand" }], cards: [{ zone: "mm3", card: sentinel }], showHand: [ceremony, sentinel], callout: "Main Deck monster, Main Monster Zone, from the hand." },
			"Your field with Ritual Sentinel in a Main Monster Zone and a Ritual Spell and Ritual Monster shown in the hand.",
		),
	],
});
