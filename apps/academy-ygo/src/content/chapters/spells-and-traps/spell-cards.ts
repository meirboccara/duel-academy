import { effectMonster, lesson, ritualMonster, slide, spell, normalMonster, facedown, SRC } from "@/content/helpers";

const combine = spell("Combine Spell", "normal", { text: "Fusion Summon 1 Fusion Monster from your Extra Deck." });
const bladeBoost = spell("Blade Boost", "equip", { text: "The equipped monster gains 400 ATK." });
const aura = spell("Steady Aura", "continuous", { text: "While face-up: your monsters gain 100 ATK." });
const storm = spell("Storm Territory", "field", { text: "All WIND monsters gain 200 ATK/DEF." });
const strike = spell("Sudden Strike", "quick-play", { text: "Target 1 face-up monster; it gains 700 ATK until the end of this turn." });
const ceremony = spell("Sentinel Ceremony", "ritual", { text: "Ritual Summon Ritual Monsters. Tribute monsters from hand or field." });
const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE" });

export const spellCardsLesson = lesson({
	id: "spell-cards",
	chapterId: "spells-and-traps",
	title: "Spell Cards",
	description: "Learn the six kinds of Spell Cards, when you can use them, and why a Quick-Play Spell cannot be used the turn you Set it.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"what-is-a-spell",
			"What a Spell Card Does",
			"Spell Cards are green cards that support your plan. They draw cards, summon monsters, boost attack points, or change the field. You play most of them during your own turn.",
			{ template: "illustration", cards: [combine, bladeBoost, storm], chips: [{ label: "Green frame", tone: "green" }, { label: "Your Main Phase", tone: "gold" }, { label: "Six types", tone: "blue" }] },
			"Three green Spell Cards: a Normal Spell, an Equip Spell and a Field Spell, with chips reading Green frame, Your Main Phase and Six types.",
			"Spells are not monsters: they have no ATK or DEF and are never Summoned. They are activated.",
		),
		slide(
			"activating-from-hand",
			"Activating a Spell From Your Hand",
			"During your Main Phase you can activate a Spell straight from your hand. Place it face-up in a Spell and Trap Zone, announce it, and it starts a chain.",
			{ template: "sequence", step: 1, of: 3, action: "Activate the Spell from your hand during your Main Phase.", scene: { hand: [combine, soldier], spellTraps: [null, null, null, null, null] }, motion: "hand-to-field" },
			"Step one of three: a Spell Card moves from the hand to a Spell and Trap Zone to be activated.",
			"Normal, Equip, Continuous, Field and Ritual Spells are all Spell Speed 1: they are activated during your own Main Phase when the chain is empty.",
		),
		slide(
			"normal-spell",
			"Normal Spells: Use Once, Then Leave",
			"A Normal Spell is the simplest type. You activate it, its effect resolves, and then it goes to the Graveyard. It stays on the field only while resolving.",
			{ template: "sequence", step: 3, of: 3, action: "After resolving, the Normal Spell is sent to the Graveyard.", scene: { spellTraps: [null, null, null, null, null], graveyard: [combine] }, motion: "field-to-graveyard" },
			"Step three of three: the resolved Normal Spell moves from the Spell and Trap Zone to the Graveyard.",
		),
		slide(
			"continuous-spell",
			"Continuous Spells: Stay on the Field",
			"A Continuous Spell stays face-up in its zone after you activate it, and its effect keeps applying. It leaves only when destroyed or when its own text says so.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "st2" }], cards: [{ zone: "st2", card: aura }, { zone: "mm2", card: soldier }], callout: "Stays on the field while it is face-up." },
			"Your field with a Continuous Spell face-up in the second Spell and Trap Zone and a monster in the second Monster Zone.",
		),
		slide(
			"equip-spell",
			"Equip Spells: Attach to a Monster",
			"An Equip Spell attaches to one face-up monster and changes it, usually raising its attack. If that monster leaves the field, the Equip Spell is sent to the Graveyard.",
			{ template: "comparison", before: { label: "Before Equip", cards: [{ ...soldier, atk: 1500 }] }, after: { label: "After Blade Boost", cards: [{ ...soldier, atk: 1900 }, bladeBoost], note: "ATK 1500 + 400 = 1900", tone: "green" }, arrowLabel: "Equip" },
			"Before: a monster with 1500 ATK. After: the same monster with Blade Boost attached, showing 1900 ATK.",
			"The equipped monster must be face-up when you activate the Equip Spell. Equip Spells take up a Spell and Trap Zone while they stay.",
		),
		slide(
			"field-spell",
			"Field Spells: One for the Whole Duel Field",
			"Field Spells go in the special Field Zone, not a Spell and Trap Zone. Each player can have one at a time. A new Field Spell replaces the old one.",
			{ template: "duel-field", highlight: [{ zone: "field" }], cards: [{ zone: "field", card: storm }], callout: "Field Zone: one Field Spell per player." },
			"The duel field with the Field Zone highlighted and Storm Territory placed in it.",
			"Each player has their own Field Zone, so both players can control a Field Spell at once. Playing a second one yourself replaces your first.",
		),
		slide(
			"quick-play-spell",
			"Quick-Play Spells: Spell Speed 2",
			"Quick-Play Spells are the fast Spells. You can activate one from your hand on your turn, or from the field on either turn, to answer your opponent.",
			{ template: "illustration", cards: [strike], chips: [{ label: "Spell Speed 2", tone: "green" }, { label: "Hand: your turn", tone: "gold" }, { label: "Field: any turn", tone: "blue" }] },
			"A Quick-Play Spell with chips: Spell Speed 2, Hand: your turn, Field: any turn.",
			"Quick-Play Spells are a Spell Speed 2 effect, so they can respond to an effect at Spell Speed 1 or 2.",
		),
		slide(
			"quick-play-set",
			"The Set Rule for Quick-Play Spells",
			"If you Set a Quick-Play Spell, you cannot activate it that same turn. It must wait for the next turn. From your hand you can use it right away.",
			{ template: "sequence", step: 1, of: 2, action: "You Set Sudden Strike face-down. It cannot be activated this turn.", scene: { hand: [strike], spellTraps: [facedown(strike, "facedown-spelltrap"), null, null, null, null] }, motion: "hand-to-field" },
			"Step one of two: Sudden Strike is Set face-down in a Spell and Trap Zone; it cannot be activated during the turn it was Set.",
			"This is the key difference from activating from the hand: the hand version has no waiting. The Set version needs one full turn change.",
		),
		slide(
			"quick-play-next-turn",
			"Set It, Wait, Then Surprise",
			"From the next turn on, a Set Quick-Play Spell can be activated during either player's turn. That lets you surprise an opponent mid-turn, just like a Trap Card.",
			{ template: "comparison", headings: ["Turn it was Set", "Next turn onward"], before: { label: "Same turn", cards: [facedown(strike, "facedown-spelltrap")], note: "Cannot activate", tone: "red" }, after: { label: "Later turns", cards: [strike], note: "Can activate on any turn", tone: "green" }, arrowLabel: "A turn passes" },
			"Left panel: a face-down Quick-Play Spell the turn it is Set, which cannot be activated. Right panel: the same card on later turns, able to activate.",
		),
		slide(
			"ritual-spell",
			"Ritual Spells: Summon From Your Hand",
			"A Ritual Spell is used to Ritual Summon a Ritual Monster. Both the Ritual Monster and the Spell begin in your hand, and you tribute monsters to pay for it.",
			{ template: "illustration", cards: [ceremony, ritualMonster("Ritual Sentinel", 7, 2500, 2000)], chips: [{ label: "Ritual Monster: Main Deck", tone: "purple" }, { label: "Tribute to match Level", tone: "gold" }] },
			"A Ritual Spell next to a Ritual Monster, with chips: Ritual Monster in the Main Deck, Tribute to match Level.",
			"Ritual Monsters are kept in the Main Deck, never the Extra Deck. Lesson 3.7 covers Ritual Summoning in full.",
		),
		slide(
			"spell-types-overview",
			"The Six Spell Types Side by Side",
			"Normal Spells resolve and go away. Continuous, Equip and Field Spells stay. Quick-Play Spells are fast. Ritual Spells summon Ritual Monsters. Learn the icon to know the type.",
			{ template: "illustration", cards: [combine, aura, bladeBoost, storm, strike, ceremony], chips: [{ label: "Normal: one use", tone: "green" }, { label: "Continuous, Equip, Field: stay", tone: "blue" }, { label: "Quick-Play: fast", tone: "gold" }] },
			"Six Spell Cards in a row: Normal, Continuous, Equip, Field, Quick-Play and Ritual, with chips that summarise how each group behaves.",
		),
		slide(
			"spell-speed-one-vs-two",
			"Spell Speed 1 Versus Spell Speed 2",
			"Most Spells are Spell Speed 1 and can only start a chain. Quick-Play Spells are Spell Speed 2 and can answer another effect. A higher speed can answer a lower or equal one.",
			{ template: "numeric", terms: [{ value: 1, label: "Normal, Continuous, Equip, Field, Ritual", tone: "blue" }, { value: 2, label: "Quick-Play Spells", tone: "green" }], op: "vs", footnote: "A Spell Speed 1 effect cannot respond to another effect." },
			"Comparison of Spell Speed 1 for most Spells and Spell Speed 2 for Quick-Play Spells.",
			"Lesson 2.4 explains all three speeds with full chains.",
		),
		slide(
			"zone-limit",
			"Five Zones, Five Spells and Traps",
			"You have five Spell and Trap Zones. Continuous Spells, Equip Spells and any Set cards use them up. Normal Spells use a zone only while resolving.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "st1" }, { zone: "st2" }, { zone: "st3" }, { zone: "st4" }, { zone: "st5" }], cards: [{ zone: "st1", card: aura }, { zone: "st2", card: bladeBoost }, { zone: "mm1", card: caster }], callout: "Only 5 Spell and Trap Zones." },
			"Your five Spell and Trap Zones highlighted, with two of them filled by a Continuous Spell and an Equip Spell.",
			"A Spell or Trap Zone is occupied by every card that stays face-up or face-down there, so choose carefully which ones to keep there.",
		),
	],
});
