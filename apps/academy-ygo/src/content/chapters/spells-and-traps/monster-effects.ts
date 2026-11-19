import { effectMonster, facedown, lesson, normalMonster, slide, spell, trap, SRC } from "@/content/helpers";
import type { CardSpec } from "@/lib/lesson-types";

const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE", text: "Once per turn: You can destroy 1 Spell/Trap on the field." });
const scout = effectMonster("Hand Scout", 3, 1000, 1000, { attribute: "WIND", text: "When this card is Normal Summoned: You can add 1 Level 3 monster from your Deck to your hand." });
const guard = effectMonster("Swift Guard", 4, 1200, 1800, { attribute: "LIGHT", text: "Quick Effect: Discard this card; negate the activation of a monster effect." });
const banner = effectMonster("Banner Bearer", 4, 1400, 1000, { attribute: "EARTH", text: "All Warrior monsters you control gain 300 ATK." });
const trickster = effectMonster("Mask Trickster", 3, 700, 1100, { attribute: "DARK", monsterType: "Fiend / Flip / Effect", text: "FLIP: Target 1 monster your opponent controls; destroy it." });
const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const rival = effectMonster("Rival Raider", 4, 1800, 1000);
const recycler = effectMonster("Grave Recycler", 4, 1300, 1100, { attribute: "DARK", text: "You can send 1 card from your hand to the GY: Special Summon this card from your GY." });
const mender = spell("Mending Draught", "normal", { text: "Gain 1000 LP." });
const sealTrap = trap("Seal Counter", "counter", { text: "Negate the activation of a Spell/Trap Card." });

const kinds: CardSpec[] = [caster, scout, guard, banner, trickster];

export const monsterEffectsLesson = lesson({
	id: "monster-effects",
	chapterId: "spells-and-traps",
	title: "Monster Effects",
	description: "Meet the five kinds of monster effects, then learn costs, targeting, destroying, negating and Special Summoning in plain words.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"effect-monster-anatomy",
			"Where the Effect Lives",
			"An Effect Monster has a text box with one or more abilities. The orange frame shows it has effects, and the text tells you when and how each ability can be used.",
			{ template: "card-anatomy", card: caster, highlight: ["effect", "frame"], labels: [{ part: "effect", text: "Effect text box" }, { part: "frame", text: "Orange frame: Effect Monster" }] },
			"A schematic Effect Monster with the text box and orange frame highlighted and labelled.",
			"Normal Monsters have a white or yellow frame and only flavor text, so they have no effects to learn.",
		),
		slide(
			"five-effect-kinds",
			"The Five Kinds of Monster Effects",
			"Effects come in five types: Ignition, Trigger, Quick, Continuous and Flip. The text itself tells you which type you have, so learn the wording and you can read any card.",
			{ template: "illustration", cards: kinds, chips: [{ label: "Ignition", tone: "gold" }, { label: "Trigger", tone: "blue" }, { label: "Quick", tone: "green" }, { label: "Continuous", tone: "purple" }, { label: "Flip", tone: "red" }] },
			"Five Effect Monsters, one for each effect type: Ignition, Trigger, Quick, Continuous and Flip.",
		),
		slide(
			"ignition-effect",
			"Ignition Effects: You Start Them",
			"An Ignition Effect is activated by you, on your own turn, during your Main Phase while the chain is empty. Text like Once per turn: You can destroy 1 card is the usual sign.",
			{ template: "timeline", variant: "phases", items: [{ label: "Draw" }, { label: "Standby" }, { label: "Main 1", sub: "Ignition effects", tone: "gold" }, { label: "Battle" }, { label: "Main 2", sub: "Ignition effects", tone: "gold" }, { label: "End" }], active: 2, cards: [caster] },
			"A turn timeline with Main Phase 1 and Main Phase 2 highlighted as the times when Ignition Effects can be activated.",
			"Ignition Effects are Spell Speed 1. They also cannot be used in the middle of a chain.",
		),
		slide(
			"trigger-effect",
			"Trigger Effects: Something Happened",
			"A Trigger Effect activates after an event, such as being Summoned, destroyed or sent to the Graveyard. It then goes on a chain. It can happen on either turn.",
			{ template: "timeline", variant: "steps", items: [{ label: "Normal Summon", sub: "Hand Scout is summoned", tone: "gold" }, { label: "Trigger activates", sub: "When Summoned", tone: "blue" }, { label: "Effect resolves", sub: "Add a monster from the Deck", tone: "green" }], active: 1, cards: [scout] },
			"Three steps: Hand Scout is Normal Summoned, its Trigger Effect activates, and the effect resolves to add a monster from the Deck to the hand.",
			"Trigger Effects are Spell Speed 1. If the trigger text says When and the event is not the last thing to happen, an optional effect can miss its timing. If says If, it does not. Detailed timing is an advanced topic.",
		),
		slide(
			"quick-effect",
			"Quick Effects: Fast Like a Trap",
			"A Quick Effect is Spell Speed 2. You can activate it on either player's turn, including in response to another effect. Many Quick Effects negate or protect.",
			{ template: "illustration", cards: [guard], chips: [{ label: "Spell Speed 2", tone: "green" }, { label: "Either turn", tone: "gold" }, { label: "Can respond", tone: "blue" }] },
			"A Quick Effect monster with chips: Spell Speed 2, either turn, can respond.",
		),
		slide(
			"continuous-effect",
			"Continuous Effects: Always On",
			"A Continuous Effect does not activate and never starts a chain. It simply applies for as long as the monster is face-up on the field, such as boosting other monsters.",
			{ template: "comparison", before: { label: "Banner Bearer alone", cards: [{ ...soldier, monsterType: "Warrior / Normal", atk: 1500 }], note: "Warrior ATK 1500" }, after: { label: "Banner Bearer face-up", cards: [{ ...soldier, atk: 1800 }, banner], note: "Warrior ATK 1500 + 300 = 1800", tone: "green" }, arrowLabel: "Always on" },
			"Left, a Warrior with 1500 ATK. Right, the same Warrior with Banner Bearer on the field showing 1800 ATK.",
			"Because Continuous Effects do not activate, they cannot be negated by negating an activation. They can still be negated by a card that negates effects while they are on the field.",
		),
		slide(
			"flip-effect",
			"Flip Effects: Turn It Face-Up",
			"A Flip Effect triggers when the monster is turned face-up, for example by a Flip Summon, or when it is flipped by an attack. You need a face-down monster first.",
			{ template: "sequence", step: 2, of: 2, action: "Flip Summon the face-down monster; its FLIP effect activates.", scene: { monsters: [{ ...trickster, position: "attack" }, null, null, null, null] }, motion: "flip" },
			"Step two of two: a face-down monster is flipped face-up in Attack Position and its FLIP effect activates.",
			"Flip Effects are Trigger Effects. A monster is Set face-down in Defense Position first, then Flip Summoned on a later turn.",
		),
		slide(
			"effect-costs",
			"Costs: Pay Before You Use It",
			"A cost is something you must pay to activate an effect, like discarding a card or paying Life Points. The cost is paid immediately, even if the opponent negates the effect.",
			{ template: "numeric", terms: [{ value: 8000, label: "Your LP", tone: "gold" }, { value: 1000, label: "Cost: pay LP", tone: "red" }], op: "-", result: { value: 7000, label: "LP after paying", tone: "green" }, lifePoints: { before: [8000, 8000], after: [7000, 8000] }, footnote: "Costs are paid on activation. A negated effect still cost you." },
			"Subtraction showing 8000 Life Points minus a 1000 Life Point cost equals 7000 Life Points.",
			"Text with a colon, like Discard 1 card: Draw 2 cards, shows a cost before the colon. Text without a colon, such as You can discard 1 card, is not a cost but part of resolution.",
		),
		slide(
			"effect-targeting",
			"Targeting: Choose Before It Resolves",
			"When an effect says target, you choose its target when you activate it. If the target is gone or invalid when it resolves, the effect does nothing to it.",
			{ template: "duel-field", highlight: [{ zone: "mm2" }, { zone: "mm3", side: "opponent" }], cards: [{ zone: "mm2", card: trickster }, { zone: "mm3", side: "opponent", card: rival }], arrows: [{ from: { zone: "mm2" }, to: { zone: "mm3", side: "opponent" }, label: "Target" }], callout: "Choose the target on activation." },
			"Your monster at the second Monster Zone with an arrow labelled Target pointing at an opponent monster.",
		),
		slide(
			"effect-destroy",
			"Destroy Sends to the Graveyard",
			"Destroy means a card on the field is sent to the Graveyard. It is different from banishing it or returning it to the hand. Some cards protect against destruction only.",
			{ template: "sequence", step: 2, of: 2, action: "The targeted monster is destroyed and goes to the Graveyard.", scene: { monsters: [null, null, null, null, null], graveyard: [rival] }, motion: "field-to-graveyard" },
			"Step two of two: the destroyed monster leaves its Monster Zone and lands in the Graveyard.",
			"Many effects say send to the GY, banish or return to the hand instead of destroy, and those do not trigger destroy protection.",
		),
		slide(
			"effect-negate",
			"Negate: Stop an Activation or an Effect",
			"To negate the activation stops that card from taking effect, and often destroys it. To negate the effect leaves the card where it is but removes what it would do.",
			{ template: "comparison", headings: ["Negate the activation", "Negate the effect"], before: { label: "Seal Counter", cards: [sealTrap, mender], note: "Stops the card from resolving", tone: "purple" }, after: { label: "Swift Guard", cards: [guard], note: "Keeps the card but voids its effect", tone: "green" }, arrowLabel: "Different timing" },
			"Left, a Counter Trap negating a Spell activation. Right, a monster negating an effect. Both stop what a card would do.",
			"Lesson 2.4 shows a full chain where each form of negation resolves.",
		),
		slide(
			"effect-special-summon",
			"Effects That Special Summon",
			"Many effects put monsters on your field without a Normal Summon. This is a Special Summon. It can come from the hand, the Deck, the Graveyard or elsewhere.",
			{ template: "sequence", step: 2, of: 2, action: "Special Summon Grave Recycler from the Graveyard to the field.", scene: { graveyard: [recycler], monsters: [recycler, null, null, null, null] }, motion: "hand-to-field" },
			"Step two of two: a monster moves from the Graveyard onto the Monster Zone by Special Summon.",
			"Special Summons do not count against your one Normal Summon each turn. See lesson 2.5 for more.",
		),
		slide(
			"once-per-turn",
			"Once Per Turn and Hard Limits",
			"Once per turn means each copy of the card can use that effect once. Some cards say you can only use that effect of a card with this name once per turn, which is stricter.",
			{ template: "illustration", cards: [caster], chips: [{ label: "Once per turn: per copy", tone: "gold" }, { label: "Name limit: all copies", tone: "red" }] },
			"A monster with chips: Once per turn applies per copy, name limit applies to all copies.",
			"A card name once-per-turn limit shares across all copies, including one in the Graveyard if text says so.",
		),
		slide(
			"reading-effect-text",
			"Read the Whole Effect Text",
			"Read the condition, the cost before the colon, the target, and what happens after. A may or can means optional. Must means the effect is not optional. Each word matters.",
			{ template: "illustration", cards: [{ ...scout, text: "When this card is Normal Summoned: You can add 1 Level 3 monster from your Deck to your hand." }], chips: [{ label: "When: trigger", tone: "blue" }, { label: "You can: optional", tone: "green" }, { label: "Colon: cost first", tone: "gold" }] },
			"A monster card with chips explaining that When marks a trigger, You can is optional, and a colon separates cost from effect.",
		),
		slide(
			"effects-in-action",
			"Putting It Together",
			"Your Bronze Soldier is on the field. You activate Flame Caster's Ignition Effect, target the opponent's Set card, and destroy it. Costs paid, target chosen, effect resolves.",
			{ template: "duel-field", highlight: [{ zone: "mm1" }, { zone: "st2", side: "opponent" }], cards: [{ zone: "mm1", card: caster }, { zone: "mm2", card: soldier }, { zone: "st2", side: "opponent", card: facedown(trap("Hidden Card", "normal"), "facedown-spelltrap") }], arrows: [{ from: { zone: "mm1" }, to: { zone: "st2", side: "opponent" }, label: "Destroy" }], callout: "Ignition effect: target, then destroy." },
			"Flame Caster on your field with an arrow labelled Destroy pointing at the opponent's face-down Spell and Trap Zone card.",
		),
	],
});
