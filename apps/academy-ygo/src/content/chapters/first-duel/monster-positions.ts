import type { Lesson } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { facedown, lesson, slide, SRC } from "@/content/helpers";

const defense = { ...SAMPLE.bronzeSoldier, position: "defense" } as const;

export const monsterPositionsLesson: Lesson = lesson({
	id: "monster-positions",
	chapterId: "first-duel",
	title: "Monster Positions",
	description: "Attack Position, Defense Position, face-down cards, and how to change between them.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"position-attack",
			"Attack Position: upright and ready",
			"A face-up monster standing vertically is in Attack Position. It can attack on your turn, and when attacked it defends using its ATK number, so Bronze Soldier uses 1500.",
			{
				template: "illustration",
				cards: [SAMPLE.bronzeSoldier],
				chips: [
					{ label: "Face-up, vertical", tone: "gold" },
					{ label: "Uses ATK", tone: "red" },
					{ label: "Can attack", tone: "green" },
				],
			},
			"Bronze Soldier standing upright and face-up, labelled Attack Position, uses ATK, can attack.",
		),
		slide(
			"position-defense",
			"Defense Position: turned sideways",
			"A face-up monster turned sideways is in Defense Position. It cannot attack, but when attacked it defends using its DEF number, so Bronze Soldier uses 1200 instead of 1500.",
			{
				template: "illustration",
				cards: [defense],
				chips: [
					{ label: "Face-up, sideways", tone: "blue" },
					{ label: "Uses DEF", tone: "blue" },
					{ label: "Cannot attack", tone: "red" },
				],
			},
			"Bronze Soldier turned sideways and face-up, labelled Defense Position, uses DEF, cannot attack.",
		),
		slide(
			"position-facedown",
			"Face-down Defense Position",
			"A Set monster lies sideways and face-down. Your opponent cannot see its card, name, ATK or DEF. It defends using its DEF, and flips face-up when attacked.",
			{
				template: "illustration",
				cards: [facedown(SAMPLE.bronzeSoldier)],
				chips: [
					{ label: "Face-down, sideways", tone: "purple" },
					{ label: "Hidden info", tone: "white" },
					{ label: "Flips when attacked", tone: "gold" },
				],
			},
			"A face-down card turned sideways in Defense Position, with the identity hidden.",
		),
		slide(
			"position-compare",
			"Attack versus Defense",
			"Attack Position is for aggression and uses ATK. Defense Position protects your Life Points and uses DEF. Pick the position that suits the stats you want in battle.",
			{
				template: "comparison",
				headings: ["Attack Position", "Defense Position"],
				before: {
					label: "ATK 1500",
					cards: [SAMPLE.bronzeSoldier],
					note: "Can attack. Defends with ATK 1500.",
					tone: "red",
				},
				after: {
					label: "DEF 1200",
					cards: [defense],
					note: "Cannot attack. Defends with DEF 1200.",
					tone: "blue",
				},
				arrowLabel: "switch",
			},
			"Left: Bronze Soldier upright with ATK 1500, able to attack. Right: Bronze Soldier sideways with DEF 1200, unable to attack.",
		),
		slide(
			"position-change",
			"Changing position",
			"During your Main Phase, you may switch one of your face-up monsters between Attack and Defense. Each monster can change once per turn, never on the turn it was summoned, and not after it attacked.",
			{
				template: "comparison",
				headings: ["Before", "After"],
				before: {
					label: "Attack Position",
					cards: [SAMPLE.flameCaster],
					note: "Main Phase: you choose to change.",
					tone: "red",
				},
				after: {
					label: "Defense Position",
					cards: [{ ...SAMPLE.flameCaster, position: "defense" }],
					note: "Turned sideways; now defends with DEF 800.",
					tone: "blue",
				},
				arrowLabel: "change once",
			},
			"Flame Caster is turned from Attack Position upright to Defense Position sideways during the Main Phase, once only.",
			"A monster that was Normal Summoned or Set this turn cannot change position until a later turn. A monster that attacked cannot change position either.",
		),
		slide(
			"position-flip-summon",
			"Flip Summon: reveal a Set monster",
			"A face-down monster can be Flip Summoned during your Main Phase, on a later turn. You turn it face-up in Attack Position. A Flip Summon does not use your Normal Summon.",
			{
				template: "sequence",
				step: 1,
				of: 1,
				action: "Flip Summon the Set monster into Attack Position",
				scene: {
					monsters: [null, null, facedown(SAMPLE.bronzeSoldier), null, null],
					result: SAMPLE.bronzeSoldier,
				},
				motion: "flip",
			},
			"A face-down Defense Position monster turns face-up into Attack Position as Bronze Soldier, by Flip Summon.",
			"A Set monster cannot be flipped on the same turn it was Set. A Flip Summon is different from a Normal Summon, so you can still Normal Summon afterwards.",
		),
		slide(
			"position-spelltrap",
			"Spell and Trap cards also go face-down",
			"Spells and Traps are Set face-down in the Spell and Trap Zones, too. They are not Positions like monsters have, they just hide until you flip them face-up by activating them.",
			{
				template: "duel-field",
				half: "you",
				highlight: [
					{ zone: "st2", side: "you" },
					{ zone: "st4", side: "you" },
				],
				cards: [
					{ zone: "st2", side: "you", card: { ...SAMPLE.mirrorBarrier, position: "facedown-spelltrap" } },
					{ zone: "st4", side: "you", card: { ...SAMPLE.counterSeal, position: "facedown-spelltrap" } },
				],
				callout: "Hidden until activated",
			},
			"Two face-down Trap cards Set in your second and fourth Spell and Trap Zones.",
		),
	],
});
