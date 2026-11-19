import type { Lesson } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { lesson, slide, SRC } from "@/content/helpers";

export const welcomeLesson: Lesson = lesson({
	id: "welcome",
	chapterId: "first-duel",
	title: "Welcome to Yu-Gi-Oh!",
	description: "What the game is, how you win, and what a deck is made of, explained from zero.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"welcome-what-is-it",
			"A card game played as a duel",
			"Yu-Gi-Oh! is a strategy card game for two players. Each duelist builds a deck, summons monsters, plays Spells and Traps, and tries to outsmart the opponent turn by turn.",
			{
				template: "illustration",
				motif: "duelists",
				chips: [
					{ label: "2 duelists", tone: "gold" },
					{ label: "1 deck each", tone: "blue" },
					{ label: "Take turns", tone: "green" },
				],
			},
			"Two duelists face each other across a table, each with their own deck. Labels read: 2 duelists, 1 deck each, take turns.",
			"Keep the tone light. Nobody needs to know any card yet. The only goal of this slide is to say that a duel is two people alternating turns.",
		),
		slide(
			"welcome-life-points",
			"Everyone starts with 8000 Life Points",
			"Life Points, written LP, measure how close you are to losing. Both duelists begin at 8000. Battle damage and some card effects make that number go down.",
			{
				template: "illustration",
				motif: "life-points",
				lifePoints: [8000, 8000],
				chips: [
					{ label: "Start: 8000 LP", tone: "gold" },
					{ label: "Damage lowers LP", tone: "red" },
				],
			},
			"Two Life Point counters, one for you and one for your opponent, both showing 8000.",
		),
		slide(
			"welcome-how-to-win",
			"How a duel is won",
			"The most common win is reducing the opponent's Life Points to 0. You also win if the opponent must draw a card but their deck is empty, or if a card effect says so.",
			{
				template: "illustration",
				motif: "victory",
				chips: [
					{ label: "Opponent at 0 LP", tone: "gold" },
					{ label: "Opponent cannot draw", tone: "blue" },
					{ label: "Special win effect", tone: "purple" },
				],
			},
			"A victory banner with three ways to win: opponent reaches 0 Life Points, opponent cannot draw, or a special card effect.",
			"Special win conditions are rare and printed on the card. Beginners only need to remember the first two.",
		),
		slide(
			"welcome-your-deck",
			"Your deck is your toolbox",
			"A Main Deck holds 40 to 60 cards. You may also bring an Extra Deck and a Side Deck of up to 15 cards each. Most beginners start with exactly 40 cards.",
			{
				template: "illustration",
				motif: "decks",
				chips: [
					{ label: "Main Deck: 40-60", tone: "gold" },
					{ label: "Extra Deck: 0-15", tone: "purple" },
					{ label: "Side Deck: 0-15", tone: "blue" },
				],
			},
			"Three stacks of cards: a Main Deck of 40 to 60 cards, an Extra Deck of up to 15, and a Side Deck of up to 15.",
			"The Side Deck is only used between games of a match. Casual duels can ignore it.",
		),
		slide(
			"welcome-three-card-types",
			"Three kinds of cards",
			"Monsters fight for you and attack. Spells are powerful actions you usually play on your own turn. Traps are Set face-down and spring a surprise at the right moment.",
			{
				template: "illustration",
				motif: "cards-three",
				cards: [SAMPLE.bronzeSoldier, SAMPLE.polymerization, SAMPLE.mirrorBarrier],
			},
			"Three schematic cards side by side: a Monster card named Bronze Soldier, a Spell card named Combine Spell, and a Trap card named Mirror Barrier.",
		),
		slide(
			"welcome-curriculum",
			"Your path through the Academy",
			"This course starts with the basics in Chapter 1, then builds toward chains, Extra Deck summons and strategy. Each lesson is short and ends with a clear skill.",
			{
				template: "illustration",
				motif: "curriculum",
				chips: [
					{ label: "Cards", tone: "gold" },
					{ label: "Field", tone: "blue" },
					{ label: "Turns", tone: "green" },
					{ label: "Battle", tone: "red" },
				],
			},
			"A curriculum path with stops labelled Cards, Field, Turns and Battle, representing the lessons of Chapter 1.",
		),
		slide(
			"welcome-ready",
			"Ready for your first duel",
			"By the end of this chapter you will know every card type, every zone, each phase of a turn, and you will have watched a complete beginner duel from start to finish.",
			{
				template: "illustration",
				motif: "welcome",
				lifePoints: [8000, 8000],
				chips: [
					{ label: "9 short lessons", tone: "gold" },
					{ label: "No experience needed", tone: "green" },
				],
			},
			"A welcome banner with both Life Point counters at 8000 and chips reading: 9 short lessons, no experience needed.",
		),
	],
});
