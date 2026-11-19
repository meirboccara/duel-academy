import type { Lesson } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { lesson, slide, SRC } from "@/content/helpers";

export const preparingDuelLesson: Lesson = lesson({
	id: "preparing-duel",
	chapterId: "first-duel",
	title: "Preparing a Duel",
	description: "Every step between sitting down and the first turn: shuffling, deciding who starts, and drawing.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"prep-gather",
			"Bring your decks and a counter",
			"Each duelist needs a legal Main Deck, an optional Extra Deck, and a way to track Life Points, such as paper, a calculator or an app. A coin or die helps too.",
			{
				template: "illustration",
				motif: "decks",
				chips: [
					{ label: "Main Deck", tone: "gold" },
					{ label: "Extra Deck", tone: "purple" },
					{ label: "LP counter", tone: "green" },
				],
			},
			"Two duelists' decks laid out with labels for Main Deck, Extra Deck and a Life Point counter.",
		),
		slide(
			"prep-shuffle",
			"Shuffle, then offer a cut",
			"Shuffle your Main Deck well, then offer it to your opponent. They may shuffle or cut it, but they may not look at the cards. Fairness matters in every duel.",
			{
				template: "illustration",
				motif: "shuffle",
				chips: [
					{ label: "Shuffle your deck", tone: "gold" },
					{ label: "Opponent may cut", tone: "blue" },
					{ label: "No peeking", tone: "red" },
				],
			},
			"A shuffling deck of cards with labels: shuffle your deck, opponent may cut, no peeking.",
		),
		slide(
			"prep-decide-who-chooses",
			"Decide who chooses the turn order",
			"Flip a coin, roll a die, or play Rock-Paper-Scissors. The winner chooses whether to take the first turn or the second turn. The loser has no say.",
			{
				template: "illustration",
				motif: "coin",
				chips: [
					{ label: "Coin or die", tone: "gold" },
					{ label: "Winner chooses", tone: "green" },
				],
			},
			"A coin being flipped, with labels saying coin or die, and the winner chooses.",
		),
		slide(
			"prep-first-or-second",
			"Going first or second",
			"The first player acts before the opponent can respond but cannot attack on turn one. The second player draws a card on their first turn. Both choices can be strong.",
			{
				template: "comparison",
				headings: ["Go first", "Go second"],
				before: {
					label: "First player",
					cards: [SAMPLE.bronzeSoldier],
					note: "Builds a board. No draw, no attack on turn 1.",
					tone: "gold",
				},
				after: {
					label: "Second player",
					cards: [SAMPLE.flameCaster],
					note: "Draws on turn 1 and may attack on turn 2 of the duel.",
					tone: "blue",
				},
				arrowLabel: "choose",
			},
			"Two panels. First player builds a board but does not draw or attack on turn one. Second player draws a card and sees what the opponent built.",
		),
		slide(
			"prep-life-points",
			"Set Life Points to 8000",
			"Once the turn order is chosen, both duelists set their Life Points to 8000. Keep the counter visible to both players so nobody forgets the score.",
			{
				template: "numeric",
				terms: [
					{ value: 8000, label: "You", tone: "gold" },
					{ value: 8000, label: "Opponent", tone: "blue" },
				],
				op: "vs",
				lifePoints: { before: [8000, 8000], after: [8000, 8000] },
				footnote: "Standard TCG duel: 8000 LP each",
			},
			"Two Life Point counters, 8000 for you versus 8000 for your opponent.",
			"Some casual formats use 4000 LP. The official rule is 8000.",
		),
		slide(
			"prep-draw-five",
			"Draw five cards",
			"Each duelist draws five cards from the top of their Main Deck. That is your starting hand. There is no mulligan, so you play with what you draw.",
			{
				template: "sequence",
				step: 1,
				of: 2,
				action: "Draw 5 cards from your Main Deck",
				scene: {
					hand: [SAMPLE.bronzeSoldier, SAMPLE.flameCaster, SAMPLE.middleTitan, SAMPLE.mirrorBarrier, SAMPLE.polymerization],
					lifePoints: [8000, 8000],
				},
				motion: "hand-to-field",
			},
			"A starting hand of five cards: Bronze Soldier, Flame Caster, Middle Titan, Mirror Barrier and Combine Spell. Both players show 8000 Life Points.",
		),
		slide(
			"prep-place-decks",
			"Place your decks on the field",
			"Put your Main Deck face-down in the Deck Zone and your Extra Deck face-down in the Extra Deck Zone. Your Graveyard starts empty. The field is ready.",
			{
				template: "duel-field",
				half: "both",
				highlight: [
					{ zone: "deck", side: "you" },
					{ zone: "extra", side: "you" },
					{ zone: "deck", side: "opponent" },
					{ zone: "extra", side: "opponent" },
				],
				callout: "Decks placed, Graveyards empty",
			},
			"The full field with both players' Deck Zones and Extra Deck Zones lit, ready for the first turn.",
		),
		slide(
			"prep-first-turn-rules",
			"Special rules for turn one",
			"The very first turn of the duel is special: the first player does not draw a card, and cannot enter the Battle Phase. The second player's first turn follows normal rules.",
			{
				template: "timeline",
				variant: "phases",
				items: [
					{ label: "Draw", sub: "Skipped", tone: "red" },
					{ label: "Standby" },
					{ label: "Main 1", tone: "gold" },
					{ label: "Battle", sub: "Skipped", tone: "red" },
					{ label: "Main 2" },
					{ label: "End" },
				],
				active: 2,
				skipped: [0, 3],
			},
			"A timeline of the six phases in order, Draw through End. On the first player's first turn, Draw Phase and Battle Phase are marked skipped.",
			"Be precise: the first player skips the draw, and cannot attack on that first turn. Everything else works as normal.",
		),
		slide(
			"prep-begin",
			"Say hello and start",
			"Greet your opponent, state that you are ready, and the first player begins with the Standby Phase. Good sportsmanship is part of the game from the first second.",
			{
				template: "illustration",
				motif: "match",
				lifePoints: [8000, 8000],
				chips: [
					{ label: "Ready to duel", tone: "gold" },
					{ label: "Good luck, have fun", tone: "green" },
				],
			},
			"A match banner with both players at 8000 Life Points and the message: ready to duel, good luck, have fun.",
			"Note: the first player has no Draw Phase draw, but still passes through Draw and Standby Phases in order.",
		),
	],
});
