import type { Lesson } from "@/lib/lesson-types";
import { SRC, effectMonster, fusionMonster, lesson, normalMonster, slide, spell, trap } from "@/content/helpers";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE" });
const combine = spell("Combine Spell", "normal", { text: "Fusion Summon 1 Fusion Monster from your Extra Deck." });
const barrier = trap("Mirror Barrier", "normal", { text: "When an opponent's monster declares an attack: Negate the attack." });
const unity = fusionMonster("Unity Beast", 6, 2200, 1800);

export const deckBuildingLesson: Lesson = lesson({
	id: "deck-building",
	chapterId: "advanced-rules",
	title: "Deck Building",
	description:
		"Build your first legal Deck: sizes, copy limits, the Extra and Side Decks, and how to think about a plan without strict formulas.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"db-sizes",
			"Deck Sizes",
			"A Main Deck holds 40 to 60 cards. The Extra Deck and Side Deck each hold 0 to 15 cards. These limits apply to the cards you bring to a match.",
			{
				template: "numeric",
				terms: [
					{ value: "40", label: "Main Deck minimum", tone: "gold" },
					{ value: "60", label: "Main Deck maximum", tone: "gold" },
				],
				op: "range",
				footnote: "Extra Deck: 0 to 15 cards. Side Deck: 0 to 15 cards.",
			},
			"A range from 40 to 60 cards for the Main Deck, with a footnote that the Extra Deck and Side Deck each hold 0 to 15 cards.",
			"These limits are in the official rulebook. Specific events may also require a decklist, check the event rules.",
		),
		slide(
			"db-copies",
			"Three Copies, With Exceptions",
			"You can include up to three copies of a card with the same name across your Main, Extra and Side Decks combined. The Forbidden and Limited List can lower that to two, one or zero.",
			{
				template: "illustration",
				cards: [soldier, soldier, soldier],
				chips: [
					{ label: "Max 3 by name", tone: "gold" },
					{ label: "Check the current list", tone: "blue" },
				],
			},
			"Three copies of the same monster card with chips: Max 3 by name and Check the current list.",
			"The Forbidden and Limited List is updated periodically by Konami. Always check the current version for the format you play.",
		),
		slide(
			"db-plan",
			"Start With a Plan",
			"Pick one main idea, such as a monster type or a way of winning, then add cards that support it. A focused plan is easier to play than a pile of unrelated strong cards.",
			{
				template: "illustration",
				cards: [caster, combine],
				chips: [
					{ label: "One main idea", tone: "gold" },
					{ label: "Cards that support it", tone: "green" },
				],
			},
			"A monster and a Spell that work together with chips: One main idea and Cards that support it.",
			"Beginners often start from a Structure Deck, which already follows a plan, and then change cards gradually.",
		),
		slide(
			"db-roles",
			"Cards Play Different Roles",
			"Some cards help you start plays, some extend them, and some interact with what your opponent does. A deck usually needs several roles, not just one kind of card.",
			{
				template: "illustration",
				cards: [soldier, combine, barrier],
				chips: [
					{ label: "Start", tone: "gold" },
					{ label: "Extend", tone: "blue" },
					{ label: "Interact", tone: "purple" },
				],
			},
			"A monster, a Spell and a Trap with chips: Start, Extend and Interact, representing three roles cards can play in a Deck.",
			"The same card can play more than one role depending on the situation. These are teaching labels, not official game terms.",
		),
		slide(
			"db-consistency",
			"Why Many Players Use 40",
			"A smaller Main Deck means you draw your key cards more often. Many players choose 40, but a larger Deck can be valid if the plan needs room. There is no single correct number.",
			{
				template: "numeric",
				terms: [
					{ value: 40, label: "Cards", tone: "gold" },
					{ value: 60, label: "Cards", tone: "blue" },
				],
				op: "vs",
				footnote: "Fewer cards makes each card appear more often on average.",
			},
			"Comparison of a 40-card Deck and a 60-card Deck. The smaller Deck shows each card more often on average.",
			"This is a general idea and not a rule. A specific strategy may benefit from more cards, so treat it as a starting point.",
		),
		slide(
			"db-ratios",
			"No Universal Ratio",
			"How many monsters, Spells and Traps you play depends on your plan. Two different Decks can both be good with very different numbers. Test and adjust instead of copying a formula.",
			{
				template: "comparison",
				before: { label: "Monster-heavy plan", cards: [soldier, caster], note: "More monsters, fewer Spells", tone: "gold" },
				after: { label: "Spell-heavy plan", cards: [combine, barrier], note: "More Spells and Traps", tone: "blue" },
				arrowLabel: "Both can work",
				headings: ["Plan A", "Plan B"],
			},
			"Two example plans: one with more monsters and one with more Spells and Traps. A label says both can work.",
			"Beware advice that claims one fixed ratio is always right. It usually comes from a specific Deck and a specific time.",
		),
		slide(
			"db-extra",
			"The Extra Deck",
			"Fusion, Synchro, Xyz and Link Monsters live in the Extra Deck, along with Pendulum Monsters that are sent there face-up. Each one needs the right materials from your Main Deck.",
			{
				template: "illustration",
				motif: "decks",
				cards: [unity],
				chips: [
					{ label: "0 to 15 cards", tone: "gold" },
					{ label: "Needs materials", tone: "blue" },
				],
			},
			"A Fusion Monster beside a deck symbol with chips: 0 to 15 cards and Needs materials.",
			"Do not fill the Extra Deck just because you can. Only include monsters your Main Deck can actually summon.",
		),
		slide(
			"db-side",
			"The Side Deck",
			"The Side Deck holds up to 15 extra cards you can swap in between games in a Match. Swaps keep your Main and Extra Decks legal in size.",
			{
				template: "illustration",
				motif: "shuffle",
				chips: [
					{ label: "0 to 15 cards", tone: "gold" },
					{ label: "Swap between games", tone: "blue" },
				],
			},
			"A shuffle symbol with chips: 0 to 15 cards and Swap between games.",
			"Specific swap rules, such as keeping the Side Deck the same size, can be part of event policy. Check the rules of the event.",
		),
		slide(
			"db-testing",
			"Test and Adjust",
			"Play practice games, note which cards you never want to draw, and which you always need. Small changes after testing are usually better than rebuilding the whole Deck.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Build", tone: "blue" },
					{ label: "Play", tone: "gold" },
					{ label: "Note problems", tone: "red" },
					{ label: "Adjust", tone: "green" },
				],
				active: 1,
			},
			"A four-step loop: build, play, note problems, adjust, with the Play step highlighted.",
			"Change only a few cards at a time so you know which change made a difference.",
		),
		slide(
			"db-first-deck",
			"Your First Deck",
			"Start from a Structure Deck, learn how its cards work together, then swap in cards you like. A Deck you understand well will beat a Deck you copied but cannot play.",
			{
				template: "illustration",
				motif: "decks",
				chips: [
					{ label: "Start simple", tone: "green" },
					{ label: "Understand each card", tone: "blue" },
					{ label: "Improve slowly", tone: "gold" },
				],
			},
			"A deck symbol with three chips: Start simple, Understand each card and Improve slowly.",
			"Remember to check the current Forbidden and Limited List and the card pool allowed for any event you plan to enter.",
		),
	],
});
