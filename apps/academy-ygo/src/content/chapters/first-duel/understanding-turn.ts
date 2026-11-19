import type { Lesson, TimelineVisual } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { lesson, slide, SRC } from "@/content/helpers";

const phases = (active: number, skipped?: number[]): TimelineVisual => ({
	template: "timeline",
	variant: "phases",
	items: [
		{ label: "Draw", sub: "Draw 1", tone: "blue" },
		{ label: "Standby", sub: "Upkeep effects", tone: "white" },
		{ label: "Main 1", sub: "Summon and play", tone: "gold" },
		{ label: "Battle", sub: "Attack", tone: "red" },
		{ label: "Main 2", sub: "Set up", tone: "gold" },
		{ label: "End", sub: "Hand limit 6", tone: "purple" },
	],
	active,
	skipped,
});

export const understandingTurnLesson: Lesson = lesson({
	id: "understanding-turn",
	chapterId: "first-duel",
	title: "Understanding a Turn",
	description: "The six phases of a turn, in order, and what you can do in each one.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"turn-overview",
			"Six phases make a turn",
			"Every turn follows the same order: Draw, Standby, Main Phase 1, Battle, Main Phase 2, End. Only the player whose turn it is acts in the phases, one after another.",
			phases(0),
			"A timeline of six phases: Draw, Standby, Main 1, Battle, Main 2 and End, with the Draw Phase highlighted first.",
		),
		slide(
			"turn-draw-phase",
			"Draw Phase: take one card",
			"At the start of your turn, you draw 1 card from the top of your Main Deck. If you have no cards left to draw, you lose the duel.",
			phases(0),
			"The timeline with the Draw Phase highlighted: draw one card.",
			"Players cannot play normal cards in this phase. Only Quick-Play and Trap-style responses are possible, which is a later topic.",
		),
		slide(
			"turn-standby-phase",
			"Standby Phase: a short pause",
			"Few cards act here at first. Some effects say 'during your Standby Phase', such as paying an upkeep cost. If nothing triggers, simply move on to Main Phase 1.",
			phases(1),
			"The timeline with the Standby Phase highlighted, described as upkeep effects.",
		),
		slide(
			"turn-main-phase-1",
			"Main Phase 1: build your board",
			"This is where you Normal Summon or Set a monster, activate Spells, Set Traps, and change monster positions. You can do these in any order, many times.",
			phases(2),
			"The timeline with Main Phase 1 highlighted: summon, play Spells and Set cards.",
			"Reminder: you can only Normal Summon or Set one monster per turn. Spells and Trap Sets have no such limit.",
		),
		slide(
			"turn-battle-phase",
			"Battle Phase: attack",
			"Your monsters in Attack Position may attack the opponent's monsters or their Life Points directly. Each monster attacks once, if it was on the field at the start of the Battle Phase.",
			phases(3),
			"The timeline with the Battle Phase highlighted: attack with your monsters.",
		),
		slide(
			"turn-main-phase-2",
			"Main Phase 2: finish your plan",
			"After battling, you get a second Main Phase with the same options as the first. Many players save their Normal Summon for here, so the opponent sees fewer cards while you attack.",
			phases(4),
			"The timeline with Main Phase 2 highlighted: summon or play cards after battle.",
		),
		slide(
			"turn-end-phase",
			"End Phase: tidy up and pass",
			"The turn ends here. If you hold more than six cards, discard down to six. Effects that last until the end of the turn stop, and then your opponent's turn begins.",
			phases(5),
			"The timeline with the End Phase highlighted: discard down to six cards and pass the turn.",
			"Discards go to the Graveyard. 'Until the end of this turn' effects, like Sudden Strike, wear off here.",
		),
		slide(
			"turn-first-turn-exceptions",
			"The first turn is different",
			"On the first player's first turn, they skip the Draw Phase draw and cannot enter the Battle Phase. Turn two onward, both duelists follow all six phases normally.",
			phases(2, [0, 3]),
			"The timeline marking the Draw Phase and the Battle Phase as skipped for the first player's first turn, with Main Phase 1 active.",
			"Technically the phases still pass in order, but the first player draws nothing and cannot declare an attack.",
		),
		slide(
			"turn-passing",
			"Turns alternate until someone wins",
			"After your End Phase, your opponent runs all six phases of their own turn. Cards you Set earlier, like Traps, can now be used against them. Then the turn returns to you.",
			{
				template: "comparison",
				headings: ["Your turn", "Opponent's turn"],
				before: {
					label: "You act",
					cards: [SAMPLE.bronzeSoldier],
					note: "You summon, attack, then pass.",
					tone: "gold",
				},
				after: {
					label: "They act",
					cards: [SAMPLE.flameCaster],
					note: "They draw, summon, attack.",
					tone: "blue",
				},
				arrowLabel: "pass",
			},
			"Two panels showing turn passing: you summon Bronze Soldier then pass, the opponent summons Flame Caster on their own turn.",
		),
		slide(
			"turn-recap",
			"The turn in one sentence",
			"Draw, wait, build, fight, finish, pass. If you remember those six verbs you remember the whole turn. Next lesson, you will learn the most important Main Phase action.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Draw", tone: "blue" },
					{ label: "Standby", tone: "white" },
					{ label: "Main 1", tone: "gold" },
					{ label: "Battle", tone: "red" },
					{ label: "Main 2", tone: "gold" },
					{ label: "End", tone: "purple" },
				],
				active: 2,
			},
			"A steps timeline summarising the turn: Draw, Standby, Main 1, Battle, Main 2, End.",
		),
	],
});
