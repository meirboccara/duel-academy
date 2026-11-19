import type { Lesson } from "@/lib/lesson-types";
import { SRC, lesson, slide } from "@/content/helpers";

export const matchesTournamentsLesson: Lesson = lesson({
	id: "matches-tournaments",
	chapterId: "advanced-rules",
	title: "Understanding Matches and Tournaments",
	description:
		"How Duels group into Matches, how to use your Side Deck, when to call a Judge, and how to be a good opponent at an event.",
	sources: [SRC.rulebook, SRC.demo],
	slides: [
		slide(
			"mt-match",
			"A Match Is Best of Three",
			"A Match is made of up to three Duels. The first player to win two Duels wins the Match. Each Duel is played with all the normal rules.",
			{
				template: "illustration",
				motif: "match",
				chips: [
					{ label: "Up to 3 Duels", tone: "gold" },
					{ label: "First to 2 wins", tone: "green" },
				],
			},
			"A match symbol with chips: Up to 3 Duels and First to 2 wins.",
			"If a Duel ends in a draw, how it counts towards the Match is decided by event rules, which are separate from the game rules.",
		),
		slide(
			"mt-first-turn",
			"Who Goes First",
			"In the first Duel, players decide who goes first, usually with a coin toss or dice roll. In later Duels, the player who lost the previous Duel decides who goes first.",
			{
				template: "illustration",
				motif: "coin",
				chips: [
					{ label: "Duel 1: coin toss", tone: "gold" },
					{ label: "Later: loser chooses", tone: "blue" },
				],
			},
			"A coin symbol with chips: Duel 1 coin toss and Later Duels: loser chooses.",
			"The method for the first Duel may be set by an event organizer. The rule for later Duels comes from the official rules.",
		),
		slide(
			"mt-side-deck",
			"Using the Side Deck",
			"Between Duels in a Match you may swap cards between your Main or Extra Deck and your Side Deck. Your Decks must stay legal in size after swapping.",
			{
				template: "illustration",
				motif: "shuffle",
				chips: [
					{ label: "Between Duels only", tone: "gold" },
					{ label: "Keep Decks legal", tone: "green" },
				],
			},
			"A shuffle symbol with chips: Between Duels only and Keep Decks legal.",
			"You cannot swap in the middle of a Duel. Some events require an exact match with a registered decklist, so ask the organizer.",
		),
		slide(
			"mt-public-info",
			"Open Information",
			"Cards in the Graveyard and face-up banished cards are open information. You may look at them. Hidden cards, like your hand and face-down cards, stay private until revealed.",
			{
				template: "duel-field",
				highlight: [
					{ zone: "graveyard", side: "opponent" },
					{ zone: "banished", side: "opponent" },
				],
				callout: "You may look at these",
			},
			"A duel field with the opponent's Graveyard and banished zone lit up, with a callout that you may look at them.",
			"Ask politely before looking at an opponent's cards, and do not touch their Deck or hand without permission.",
		),
		slide(
			"mt-communicate",
			"Communicate Your Plays",
			"Say what you are doing as you do it, and pause for responses. Clear communication prevents confusion about which phase you are in and which effects are being used.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Say your action", tone: "blue" },
					{ label: "Pause", sub: "opponent may respond", tone: "gold" },
					{ label: "Continue", tone: "green" },
				],
				active: 1,
			},
			"A three-step timeline: say your action, pause for the opponent to respond, then continue.",
			"This is good etiquette and not a specific tournament rule. Judges at events can help with unclear situations.",
		),
		slide(
			"mt-judge",
			"Ask a Judge",
			"If you are unsure about a rule or something unusual happens, stop and call a Judge. Do not argue or try to fix it on your own. A Judge can make a decision.",
			{
				template: "illustration",
				motif: "judge",
				chips: [
					{ label: "Stop playing", tone: "red" },
					{ label: "Call a Judge", tone: "gold" },
					{ label: "Follow the decision", tone: "green" },
				],
			},
			"A judge symbol with chips: Stop playing, Call a Judge, and Follow the decision.",
			"Calling a Judge is normal and is not a sign of cheating. You can ask for help even when no one broke a rule.",
		),
		slide(
			"mt-rules-vs-policy",
			"Game Rules Versus Event Policy",
			"Game rules explain how cards work. Event policy covers things like time limits and procedures. They can differ between events, so the organizer's rules for that event apply.",
			{
				template: "comparison",
				before: { label: "Game rules", cards: [], note: "Same everywhere: phases, chains, battle", tone: "blue" },
				after: { label: "Event policy", cards: [], note: "Set by the organizer: schedule, procedures", tone: "gold" },
				arrowLabel: "Know both",
				headings: ["Game", "Event"],
			},
			"Two panels: Game rules, the same everywhere, and Event policy, set by the organizer and varying from event to event.",
			"This lesson deliberately does not list penalties or time limits. Those differ by event, so read the policy provided for yours.",
		),
		slide(
			"mt-etiquette",
			"Good Sportsmanship",
			"Be honest, be patient and be respectful. Greet your opponent, keep Life Points clear, and accept results graciously. A friendly Duel is more fun for both players.",
			{
				template: "illustration",
				motif: "duelists",
				chips: [
					{ label: "Greet your opponent", tone: "gold" },
					{ label: "Track LP clearly", tone: "blue" },
					{ label: "Be respectful", tone: "green" },
				],
			},
			"Two duelists with chips: Greet your opponent, Track LP clearly and Be respectful.",
			"Keeping a written Life Point record helps avoid disagreements, and many players use a pen and paper or a calculator.",
		),
		slide(
			"mt-decklist",
			"Decklists and Card Sleeves",
			"Some events ask for a written decklist, or for sleeves that look the same on the back. That is event policy, so read the organizer's instructions before you arrive.",
			{
				template: "illustration",
				motif: "decks",
				chips: [
					{ label: "Decklist: if required", tone: "gold" },
					{ label: "Check event info", tone: "blue" },
				],
			},
			"A deck symbol with chips: Decklist if required and Check event info.",
			"Whether a decklist or particular sleeves are needed differs by event. This lesson does not state a universal requirement.",
		),
		slide(
			"mt-prepare",
			"Before Your First Event",
			"Pack your Deck, Extra Deck, Side Deck, something to track Life Points, and anything the organizer asks for. Arrive early and read the event information.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Check the event info", tone: "blue" },
					{ label: "Pack your Decks", tone: "gold" },
					{ label: "Arrive early", tone: "green" },
				],
				active: 0,
			},
			"A three-step timeline: check the event info, pack your Decks, arrive early.",
			"Start with a local or demo event if you are new. The Konami demo events page lists friendly places to try the game.",
		),
	],
});
