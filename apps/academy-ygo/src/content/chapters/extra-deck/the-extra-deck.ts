import { effectMonster, fusionMonster, linkMonster, lesson, pendulum, ritualMonster, slide, synchroMonster, xyzMonster, SRC } from "@/content/helpers";

const unity = fusionMonster("Unity Beast", 6, 2200, 1800, { text: "\"Bronze Soldier\" + \"Flame Caster\"" });
const nova = synchroMonster("Nova Dragon", 8, 2800, 2000, { text: "1 Tuner + 1+ non-Tuner monsters" });
const raider = xyzMonster("Ranked Raider", 4, 2400, 1600, { text: "2 Level 4 monsters" });
const portal = linkMonster("Portal Guide", 2, 1400, ["SW", "SE"], { text: "2 monsters" });
const scale = pendulum(effectMonster("Scale Mage", 4, 1500, 1000, { attribute: "WATER", monsterType: "Spellcaster / Pendulum / Effect" }), 2, 2, "Once per turn: Draw 1 card.");
const sentinel = ritualMonster("Ritual Sentinel", 7, 2500, 2000);

export const theExtraDeckLesson = lesson({
	id: "the-extra-deck",
	chapterId: "extra-deck",
	title: "The Extra Deck",
	description: "Discover the separate face-down deck of powerful monsters, what it can hold, and the basic rules for bringing them to the field.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"extra-deck-zone",
			"A Second Deck of Special Monsters",
			"The Extra Deck is a separate stack of cards, kept face-down beside your Main Deck. It holds powerful monsters that cannot be drawn or Normal Summoned.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "extra" }, { zone: "deck" }], callout: "Extra Deck: separate from the Main Deck." },
			"Your half of the field with the Extra Deck zone and the Main Deck zone highlighted as two separate stacks.",
		),
		slide(
			"extra-deck-size",
			"Zero to Fifteen Cards",
			"You may have no Extra Deck at all, or up to 15 cards. Limits still apply: you can include at most three copies of a card with the same name across all your decks.",
			{ template: "numeric", terms: [{ value: 0, label: "Minimum", tone: "blue" }, { value: 15, label: "Maximum", tone: "purple" }], op: "range", footnote: "Extra Deck: 0 to 15 cards." },
			"A range from 0 to 15 cards for the Extra Deck size.",
			"The Main Deck is 40 to 60 cards. The Side Deck is 0 to 15 cards. Extra Deck and Side Deck are counted separately.",
		),
		slide(
			"extra-deck-five-types",
			"Five Kinds of Extra Deck Monsters",
			"Fusion, Synchro, Xyz and Link Monsters live in the Extra Deck. Pendulum Monsters can also be there while face-up, but they start in the Main Deck like other monsters.",
			{ template: "illustration", cards: [unity, nova, raider, portal], chips: [{ label: "Fusion", tone: "purple" }, { label: "Synchro", tone: "white" }, { label: "Xyz", tone: "blue" }, { label: "Link", tone: "green" }] },
			"Four Extra Deck monsters: Fusion, Synchro, Xyz and Link, with chips naming each type.",
			"Pendulum Monsters are Main Deck cards. They only go to the Extra Deck face-up when they leave the field or are placed there by effects.",
		),
		slide(
			"extra-deck-face-down",
			"Hidden but Countable",
			"Your Extra Deck is kept face-down and you may look at it any time. Your opponent normally cannot look, but they can still see how many cards it contains.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "extra" }], callout: "Face-down, but you can always look.", cards: [{ zone: "extra", card: { ...unity, position: "facedown-defense" } }] },
			"The Extra Deck zone highlighted, holding a face-down stack of cards.",
		),
		slide(
			"extra-deck-never-drawn",
			"You Never Draw From It",
			"Draw Phase draws come only from your Main Deck. Extra Deck monsters are never in your hand and cannot be Normal Summoned or Set. They must be Special Summoned.",
			{ template: "comparison", headings: ["Main Deck monster", "Extra Deck monster"], before: { label: "Drawn, Normal Summon", cards: [effectMonster("Bronze Scout", 4, 1500, 1200)], note: "Hand then field", tone: "gold" }, after: { label: "Never drawn", cards: [unity], note: "Special Summon only", tone: "purple" }, arrowLabel: "Different route" },
			"Left: a Main Deck monster drawn and Normal Summoned. Right: an Extra Deck monster that is never drawn and is Special Summoned.",
		),
		slide(
			"extra-deck-materials",
			"Materials Pay the Price",
			"To summon an Extra Deck monster you use other monsters, called materials. Each type has its own materials and method, and the card tells you exactly what they are.",
			{ template: "sequence", step: 2, of: 3, action: "Use the listed materials; the Extra Deck monster is Special Summoned.", scene: { materials: [effectMonster("Bronze Scout", 4, 1500, 1200), effectMonster("Flame Caster", 4, 1600, 800)], result: raider }, motion: "materials-to-result" },
			"Materials move toward a single Extra Deck monster that will be Special Summoned.",
		),
		slide(
			"extra-monster-zone",
			"The Extra Monster Zones",
			"The field has two shared Extra Monster Zones in the center. Each player may use either one. Extra Deck monsters summoned from the Extra Deck must normally land there.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "emz-right" }], cards: [{ zone: "emz-left", card: nova }], callout: "Two shared center zones." },
			"The field with the two center Extra Monster Zones highlighted and Nova Dragon placed in the left one.",
			"Both players share the same two Extra Monster Zones. Only one monster of each player can generally use an Extra Monster Zone at a time.",
		),
		slide(
			"extra-linked-zones",
			"Link Arrows Open More Zones",
			"A zone that a Link Monster's arrow points to also counts. An Extra Deck monster may be Special Summoned from the Extra Deck to a zone pointed to by a Link Monster.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "mm1" }, { zone: "mm2" }], cards: [{ zone: "emz-left", card: portal }], linkedZones: [{ zone: "mm1" }, { zone: "mm2" }], callout: "Link arrows point to usable Main Monster Zones." },
			"A Link Monster in the left Extra Monster Zone pointing its arrows at two of your Main Monster Zones, which become valid for Extra Deck summons.",
		),
		slide(
			"extra-deck-leaves",
			"Leaving the Field",
			"A Fusion, Synchro, Xyz or Link Monster that is destroyed goes to the Graveyard like any monster. A face-up Pendulum Monster leaving the field goes to the Extra Deck instead.",
			{ template: "comparison", headings: ["Fusion, Synchro, Xyz, Link", "Pendulum"], before: { label: "Destroyed", cards: [nova], note: "Goes to the Graveyard", tone: "blue" }, after: { label: "Face-up leaves", cards: [scale], note: "Goes to the Extra Deck", tone: "purple" }, arrowLabel: "Different destination" },
			"Left: a destroyed Synchro goes to the Graveyard. Right: a face-up Pendulum leaving the field goes to the Extra Deck.",
		),
		slide(
			"extra-deck-no-ritual",
			"Rituals Are Not Extra Deck Monsters",
			"Ritual Monsters stay in your Main Deck and are drawn into your hand like any monster. Only Fusion, Synchro, Xyz and Link Monsters start in the Extra Deck.",
			{ template: "comparison", headings: ["Main Deck", "Extra Deck"], before: { label: "Ritual", cards: [sentinel], note: "Drawn to hand, then Ritual Summoned", tone: "gold" }, after: { label: "Extra Deck types", cards: [unity, nova, raider, portal], note: "Special Summoned from Extra Deck", tone: "purple" }, arrowLabel: "Different zones" },
			"Left: a Ritual Monster belongs to the Main Deck. Right: Fusion, Synchro, Xyz and Link monsters belong to the Extra Deck.",
		),
		slide(
			"extra-deck-colors",
			"Reading Extra Deck Frames",
			"A purple frame is Fusion, white is Synchro, black is Xyz, and dark blue is Link. Check the card type line to confirm. Each uses stars, rank or link rating differently.",
			{ template: "card-anatomy", card: unity, highlight: ["frame", "type"], labels: [{ part: "frame", text: "Frame colour shows the type" }, { part: "type", text: "Type line: Fusion" }], compare: [nova, raider, portal] },
			"A Fusion Monster card with frame and type highlighted, shown beside Synchro, Xyz and Link examples.",
		),
		slide(
			"extra-deck-recap",
			"Extra Deck in Four Facts",
			"Zero to fifteen cards. Face-down and never drawn. Special Summoned using materials. Placed in Extra Monster Zones or zones a Link Monster points to. Remember these four.",
			{ template: "illustration", cards: [unity, nova, raider, portal], chips: [{ label: "0 to 15 cards", tone: "purple" }, { label: "Never drawn", tone: "red" }, { label: "Materials needed", tone: "gold" }, { label: "EMZ or linked zone", tone: "green" }] },
			"Four Extra Deck monsters with four chips summarising size, never drawn, materials and zones.",
		),
	],
});
