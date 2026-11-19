import type { Lesson, TimelineVisual } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { lesson, slide, SRC } from "@/content/helpers";

const setTrap = { ...SAMPLE.mirrorBarrier, position: "facedown-spelltrap" } as const;

const phases = (active: number, skipped?: number[]): TimelineVisual => ({
	template: "timeline",
	variant: "phases",
	items: [
		{ label: "Draw", tone: "blue" },
		{ label: "Standby", tone: "white" },
		{ label: "Main 1", tone: "gold" },
		{ label: "Battle", tone: "red" },
		{ label: "Main 2", tone: "gold" },
		{ label: "End", tone: "purple" },
	],
	active,
	skipped,
});

export const firstCompleteDuelLesson: Lesson = lesson({
	id: "first-complete-duel",
	chapterId: "first-duel",
	title: "Your First Complete Duel",
	description: "Follow a short duel turn by turn and see every rule from this chapter in action.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"duel-meet",
			"Meet the duelists",
			"You will follow You and Opponent. You won the coin flip and chose to go first. Both start at 8000 Life Points and have drawn five cards.",
			{
				template: "illustration",
				motif: "duelists",
				lifePoints: [8000, 8000],
				chips: [
					{ label: "You go first", tone: "gold" },
					{ label: "5-card hands", tone: "blue" },
				],
			},
			"You and Opponent face off, both at 8000 Life Points. You go first and both hold five cards.",
		),
		slide(
			"duel-setup",
			"The field is ready",
			"Decks and Extra Decks are in place, the Graveyards are empty, and no monsters, Spells or Traps are on the field yet. Everything begins from a clean board.",
			{
				template: "duel-field",
				half: "both",
				highlight: [
					{ zone: "deck", side: "you" },
					{ zone: "deck", side: "opponent" },
				],
				showHand: [SAMPLE.bronzeSoldier, SAMPLE.middleTitan, SAMPLE.mirrorBarrier, SAMPLE.polymerization, SAMPLE.flameCaster],
				callout: "Your opening hand of five",
			},
			"A clean field with both Deck Zones lit, and your hand of five: Bronze Soldier, Middle Titan, Mirror Barrier, Combine Spell and Flame Caster.",
		),
		slide(
			"duel-t1-no-draw",
			"Turn 1: no draw, no attack",
			"As the first player, you skip your draw and cannot attack. You still move through Standby and Main Phase 1, where all your preparing happens on this turn.",
			phases(2, [0, 3]),
			"The timeline for Turn 1 with Draw and Battle phases skipped and Main Phase 1 active.",
		),
		slide(
			"duel-t1-summon",
			"Turn 1: Normal Summon Bronze Soldier",
			"In Main Phase 1, you Normal Summon Bronze Soldier, Level 4, with no Tribute. It lands in a Main Monster Zone in Attack Position and uses your Normal Summon.",
			{
				template: "sequence",
				step: 1,
				of: 2,
				action: "Normal Summon Bronze Soldier",
				scene: {
					hand: [SAMPLE.middleTitan, SAMPLE.mirrorBarrier, SAMPLE.polymerization, SAMPLE.flameCaster],
					monsters: [null, SAMPLE.bronzeSoldier, null, null, null],
					lifePoints: [8000, 8000],
				},
				motion: "hand-to-field",
			},
			"Bronze Soldier moves from a hand of five cards into your Main Monster Zone. Four cards remain in hand.",
		),
		slide(
			"duel-t1-set-trap",
			"Turn 1: Set Mirror Barrier",
			"Next you Set Mirror Barrier face-down in a Spell and Trap Zone. Setting a Trap is free and not limited to once per turn. It can be used starting next turn.",
			{
				template: "sequence",
				step: 2,
				of: 2,
				action: "Set Mirror Barrier face-down",
				scene: {
					hand: [SAMPLE.middleTitan, SAMPLE.polymerization, SAMPLE.flameCaster],
					monsters: [null, SAMPLE.bronzeSoldier, null, null, null],
					spellTraps: [null, setTrap, null, null, null],
				},
				motion: "hand-to-field",
			},
			"Mirror Barrier lies face-down in your Spell and Trap Zone behind Bronze Soldier. Three cards remain in hand.",
		),
		slide(
			"duel-t1-end",
			"Turn 1: End Phase",
			"You have three cards in hand, under the six-card limit, so nothing is discarded. You pass the turn. The Battle Phase was skipped, so you went straight from Main Phase 1 to Main Phase 2 and then here.",
			phases(5, [3]),
			"The timeline at the End Phase of turn one with the Battle Phase marked as skipped.",
		),
		slide(
			"duel-t2-draw",
			"Turn 2: Opponent draws",
			"Opponent begins by drawing one card, going from five to six cards. As the second player, they draw on their very first turn and are allowed to enter the Battle Phase.",
			phases(0),
			"The timeline at the Draw Phase for the opponent's first turn: they draw a card and hold six.",
		),
		slide(
			"duel-t2-summon",
			"Turn 2: Opponent summons Flame Caster",
			"Opponent Normal Summons Flame Caster, Level 4 with 1600 ATK, in Attack Position. That is stronger than your Bronze Soldier's 1500 ATK, so an attack looks tempting.",
			{
				template: "duel-field",
				half: "both",
				highlight: [
					{ zone: "mm2", side: "you" },
					{ zone: "mm3", side: "opponent" },
					{ zone: "st2", side: "you" },
				],
				cards: [
					{ zone: "mm2", side: "you", card: SAMPLE.bronzeSoldier },
					{ zone: "st2", side: "you", card: setTrap },
					{ zone: "mm3", side: "opponent", card: SAMPLE.flameCaster },
				],
				callout: "1600 ATK versus 1500 ATK",
			},
			"Your Bronze Soldier and Set Trap face an opponent's newly summoned Flame Caster with 1600 ATK.",
		),
		slide(
			"duel-t2-attack",
			"Turn 2: Opponent attacks",
			"Opponent enters the Battle Phase and declares an attack with Flame Caster on Bronze Soldier. This is the moment your Set Mirror Barrier was waiting for.",
			{
				template: "duel-field",
				half: "both",
				highlight: [
					{ zone: "mm3", side: "opponent" },
					{ zone: "mm2", side: "you" },
					{ zone: "st2", side: "you" },
				],
				cards: [
					{ zone: "mm2", side: "you", card: SAMPLE.bronzeSoldier },
					{ zone: "st2", side: "you", card: setTrap },
					{ zone: "mm3", side: "opponent", card: SAMPLE.flameCaster },
				],
				arrows: [
					{ from: { zone: "mm3", side: "opponent" }, to: { zone: "mm2", side: "you" }, label: "Attack declared" },
				],
			},
			"The opponent's Flame Caster attacks your Bronze Soldier. Your face-down Mirror Barrier is ready to respond.",
		),
		slide(
			"duel-t2-trap",
			"Turn 2: Mirror Barrier negates the attack",
			"You flip Mirror Barrier face-up and activate it. The attack is negated: no damage is dealt and no monster is destroyed. After resolving, the Trap goes to the Graveyard.",
			{
				template: "comparison",
				headings: ["Attack declared", "After Mirror Barrier"],
				before: {
					label: "1600 vs 1500",
					cards: [SAMPLE.flameCaster, SAMPLE.bronzeSoldier],
					lifePoints: [8000, 8000],
					note: "Bronze Soldier would be destroyed. You would lose 100 LP.",
					tone: "red",
				},
				after: {
					label: "Attack negated",
					cards: [SAMPLE.flameCaster, SAMPLE.bronzeSoldier],
					lifePoints: [8000, 8000],
					note: "Both survive. Mirror Barrier goes to the Graveyard.",
					tone: "green",
				},
				arrowLabel: "negate",
			},
			"Before: Flame Caster with 1600 ATK would beat Bronze Soldier with 1500 ATK and deal 100 damage. After: the attack is negated, both survive, and Life Points stay at 8000.",
			"If the attack had gone through, the difference 1600 minus 1500 would be 100 damage to You and Bronze Soldier would be destroyed.",
		),
		slide(
			"duel-t3-draw-hand",
			"Turn 3: You draw and plan",
			"On your turn you draw 1 card, giving you four in hand. You hold Middle Titan, Level 5. Bronze Soldier can be your Tribute, so Middle Titan can be summoned.",
			{
				template: "sequence",
				step: 1,
				of: 3,
				action: "Draw 1 card and plan a Tribute Summon",
				scene: {
					hand: [SAMPLE.middleTitan, SAMPLE.polymerization, SAMPLE.flameCaster, SAMPLE.bronzeSoldier],
					monsters: [null, SAMPLE.bronzeSoldier, null, null, null],
					lifePoints: [8000, 8000],
				},
			},
			"Your hand of four cards including Middle Titan, with Bronze Soldier on the field ready to be a Tribute.",
		),
		slide(
			"duel-t3-tribute",
			"Turn 3: Tribute Summon Middle Titan",
			"You Tribute Bronze Soldier, sending it to the Graveyard, and Normal Summon Middle Titan. Level 5 needs exactly 1 Tribute, and this uses your Normal Summon for the turn.",
			{
				template: "sequence",
				step: 2,
				of: 3,
				action: "Tribute Bronze Soldier to Summon Middle Titan",
				scene: {
					hand: [SAMPLE.polymerization, SAMPLE.flameCaster, SAMPLE.bronzeSoldier],
					monsters: [null, { ...SAMPLE.bronzeSoldier, ghost: true }, null, null, null],
					graveyard: [SAMPLE.mirrorBarrier],
					result: SAMPLE.middleTitan,
				},
				motion: "field-to-graveyard",
			},
			"Bronze Soldier is dimmed as the Tribute and Middle Titan is placed on the field. Mirror Barrier already sits in the Graveyard.",
		),
		slide(
			"duel-t3-battle",
			"Turn 3: Battle Flame Caster",
			"Now in the Battle Phase, Middle Titan with 2000 ATK attacks Flame Caster with 1600 ATK. The difference is 400, so Flame Caster is destroyed and Opponent takes 400 damage.",
			{
				template: "numeric",
				terms: [
					{ value: 2000, label: "Middle Titan ATK", tone: "gold" },
					{ value: 1600, label: "Flame Caster ATK", tone: "blue" },
				],
				op: "-",
				result: { value: 400, label: "Battle damage", tone: "red" },
				cards: [SAMPLE.middleTitan, SAMPLE.flameCaster],
				lifePoints: { before: [8000, 8000], after: [8000, 7600] },
			},
			"Middle Titan's 2000 ATK minus Flame Caster's 1600 ATK equals 400 damage. Opponent's Life Points go from 8000 to 7600.",
		),
		slide(
			"duel-t3-result",
			"Where the duel stands",
			"After three turns, You have Middle Titan on the field and 8000 LP. Opponent has no monsters and 7600 LP. The duel continues until someone reaches 0 Life Points.",
			{
				template: "comparison",
				headings: ["You", "Opponent"],
				before: {
					label: "You",
					cards: [SAMPLE.middleTitan],
					lifePoints: [8000, 7600],
					note: "8000 LP. Middle Titan on the field.",
					tone: "gold",
				},
				after: {
					label: "Opponent",
					cards: [{ ...SAMPLE.flameCaster, ghost: true }],
					lifePoints: [8000, 7600],
					note: "7600 LP. Flame Caster destroyed.",
					tone: "blue",
				},
				arrowLabel: "continues",
			},
			"You hold Middle Titan at 8000 Life Points. Opponent's Flame Caster is gone and they are at 7600.",
		),
		slide(
			"duel-recap",
			"What you just saw",
			"You saw the first-turn limits, a Normal Summon, a Set Trap, an attack negated, a Tribute Summon and battle damage. You now know the core loop of every duel.",
			{
				template: "illustration",
				motif: "curriculum",
				chips: [
					{ label: "First-turn limits", tone: "gold" },
					{ label: "Normal Summon", tone: "green" },
					{ label: "Set Trap", tone: "purple" },
					{ label: "Tribute Summon", tone: "blue" },
					{ label: "Battle damage", tone: "red" },
				],
			},
			"A recap list of the concepts from this duel: first-turn limits, Normal Summon, Set Trap, Tribute Summon and battle damage.",
		),
	],
});
