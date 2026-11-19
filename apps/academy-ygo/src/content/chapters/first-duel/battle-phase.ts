import type { Lesson } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { facedown, lesson, slide, normalMonster, SRC } from "@/content/helpers";

const bronzeGuard = normalMonster("Bronze Guard", 4, 1500, 1200);
const bronzeGuardDefense = { ...SAMPLE.bronzeSoldier, position: "defense" } as const;
const gigantDefense = { ...SAMPLE.gigantGuardian, position: "defense" } as const;

export const battlePhaseLesson: Lesson = lesson({
	id: "battle-phase",
	chapterId: "first-duel",
	title: "The Battle Phase",
	description: "How attacks work, how ATK and DEF are compared, and exactly how much damage is dealt.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"battle-intro",
			"The Battle Phase decides fights",
			"After Main Phase 1, you may move to the Battle Phase and attack. Remember that the first player cannot attack on the first turn of the duel.",
			{
				template: "timeline",
				variant: "phases",
				items: [
					{ label: "Draw" },
					{ label: "Standby" },
					{ label: "Main 1", tone: "gold" },
					{ label: "Battle", tone: "red" },
					{ label: "Main 2", tone: "gold" },
					{ label: "End" },
				],
				active: 3,
			},
			"The turn timeline with the Battle Phase highlighted after Main Phase 1.",
		),
		slide(
			"battle-steps",
			"Four steps of battle",
			"Each attack goes through steps: Start of Battle, Battle Step where you pick an attacker and target, Damage Step where numbers are compared, and End of Battle.",
			{
				template: "timeline",
				variant: "battle",
				items: [
					{ label: "Start", sub: "Phase begins", tone: "white" },
					{ label: "Battle Step", sub: "Declare attack", tone: "gold" },
					{ label: "Damage Step", sub: "Compare numbers", tone: "red" },
					{ label: "End", sub: "Phase ends", tone: "purple" },
				],
				active: 1,
			},
			"A battle timeline: Start of the Battle Phase, Battle Step to declare an attack, Damage Step to compare numbers, then End of the Battle Phase.",
			"Keep the details of Damage Step timing for the chain chapters. Beginners need only know that numbers are compared after the attack is declared.",
		),
		slide(
			"battle-declare-attack",
			"Declare an attack",
			"Choose one of your Attack Position monsters and a monster on the opponent's side to attack. Each of your monsters can attack once per Battle Phase.",
			{
				template: "duel-field",
				half: "both",
				highlight: [
					{ zone: "mm3", side: "you" },
					{ zone: "mm3", side: "opponent" },
				],
				cards: [
					{ zone: "mm3", side: "you", card: SAMPLE.middleTitan },
					{ zone: "mm3", side: "opponent", card: SAMPLE.flameCaster },
				],
				arrows: [
					{ from: { zone: "mm3", side: "you" }, to: { zone: "mm3", side: "opponent" }, label: "Attack" },
				],
			},
			"Middle Titan on your side attacks Flame Caster on the opponent's side, shown with an arrow labelled Attack.",
		),
		slide(
			"battle-direct-attack",
			"Direct attack: no monsters to block",
			"If your opponent controls no monsters, your monster can attack them directly. The opponent takes damage equal to the attacker's ATK, with no comparison at all.",
			{
				template: "numeric",
				terms: [
					{ value: 8000, label: "Opponent LP", tone: "blue" },
					{ value: 2000, label: "Middle Titan ATK", tone: "red" },
				],
				op: "-",
				result: { value: 6000, label: "New LP", tone: "gold" },
				cards: [SAMPLE.middleTitan],
				lifePoints: { before: [8000, 8000], after: [8000, 6000] },
			},
			"A direct attack by Middle Titan: opponent's 8000 Life Points minus 2000 ATK equals 6000.",
		),
		slide(
			"battle-atk-vs-atk",
			"Attack Position versus Attack Position",
			"Both ATK values are compared. The higher number survives, and the lower one is destroyed. The owner of the destroyed monster takes the difference as battle damage.",
			{
				template: "numeric",
				terms: [
					{ value: 2000, label: "Middle Titan ATK", tone: "gold" },
					{ value: 1500, label: "Bronze Soldier ATK", tone: "blue" },
				],
				op: "-",
				result: { value: 500, label: "Damage to defender", tone: "red" },
				cards: [SAMPLE.middleTitan, SAMPLE.bronzeSoldier],
				lifePoints: { before: [8000, 8000], after: [8000, 7500] },
				footnote: "Bronze Soldier is destroyed. Its owner loses 500 LP.",
			},
			"Middle Titan with 2000 ATK attacks Bronze Soldier with 1500 ATK. The difference of 500 is damage to the defender, and Bronze Soldier is destroyed.",
		),
		slide(
			"battle-equal-atk",
			"Equal ATK: both destroyed",
			"When two attacking-position monsters have the same ATK, both are destroyed and neither player takes damage. The difference is 0, so no Life Points are lost.",
			{
				template: "numeric",
				terms: [
					{ value: 1500, label: "Bronze Soldier ATK", tone: "gold" },
					{ value: 1500, label: "Bronze Guard ATK", tone: "blue" },
				],
				op: "=",
				result: { value: 0, label: "Damage", tone: "green" },
				cards: [SAMPLE.bronzeSoldier, bronzeGuard],
				lifePoints: { before: [8000, 8000], after: [8000, 8000] },
				footnote: "Both monsters are destroyed.",
			},
			"Bronze Soldier and Bronze Guard both have 1500 ATK. Both are destroyed and no one takes damage.",
		),
		slide(
			"battle-vs-defense-win",
			"Attacking a Defense Position monster",
			"Compare the attacker's ATK to the defender's DEF. If ATK is higher, the defender is destroyed but nobody takes damage, because Defense Position protects Life Points.",
			{
				template: "numeric",
				terms: [
					{ value: 1500, label: "Bronze Soldier ATK", tone: "red" },
					{ value: 1200, label: "Defender DEF", tone: "blue" },
				],
				op: ">",
				result: { value: 0, label: "Damage", tone: "green" },
				cards: [SAMPLE.bronzeSoldier, bronzeGuardDefense],
				lifePoints: { before: [8000, 8000], after: [8000, 8000] },
				footnote: "ATK 1500 is greater than DEF 1200. Defender destroyed, no damage.",
			},
			"Bronze Soldier attacks a sideways Bronze Soldier. 1500 ATK exceeds 1200 DEF, so the defender is destroyed but no damage is dealt.",
		),
		slide(
			"battle-vs-defense-lose",
			"When the attacker is too weak",
			"If ATK is lower than the defender's DEF, nothing is destroyed, but the attacker's controller takes the difference. Attacking Gigant Guardian's 2000 DEF with 1500 ATK costs you 500 Life Points.",
			{
				template: "numeric",
				terms: [
					{ value: 2000, label: "Gigant Guardian DEF", tone: "blue" },
					{ value: 1500, label: "Bronze Soldier ATK", tone: "red" },
				],
				op: "-",
				result: { value: 500, label: "Damage to attacker's owner", tone: "red" },
				cards: [SAMPLE.bronzeSoldier, gigantDefense],
				lifePoints: { before: [8000, 8000], after: [7500, 8000] },
				footnote: "No monster is destroyed. You lose 500 LP.",
			},
			"Bronze Soldier with 1500 ATK attacks Gigant Guardian sideways with 2000 DEF. Nothing is destroyed and the attacker's owner loses 500 Life Points.",
			"This rule is the main reason players do not attack into higher DEF monsters without a plan.",
		),
		slide(
			"battle-facedown",
			"Attacking a face-down monster",
			"When you attack a Set monster, it is flipped face-up before numbers are compared. Then the same ATK versus DEF rules apply as for any Defense Position monster.",
			{
				template: "sequence",
				step: 1,
				of: 2,
				action: "Attack a Set monster, which flips face-up before damage",
				scene: {
					monsters: [null, null, facedown(SAMPLE.bronzeSoldier), null, null],
					result: bronzeGuardDefense,
				},
				motion: "flip",
			},
			"A face-down monster is flipped face-up when attacked, revealing Bronze Soldier in Defense Position before the ATK versus DEF comparison.",
		),
		slide(
			"battle-limits",
			"Battle rules to remember",
			"Each monster attacks only once per Battle Phase. A monster must be in Attack Position to attack, and you are never forced to attack. After attacking, it cannot change position.",
			{
				template: "illustration",
				cards: [SAMPLE.middleTitan, SAMPLE.bronzeSoldier],
				chips: [
					{ label: "1 attack per monster", tone: "gold" },
					{ label: "Attack Position only", tone: "red" },
					{ label: "Attacking is optional", tone: "green" },
				],
			},
			"Middle Titan and Bronze Soldier with notes: one attack each per Battle Phase, Attack Position only, and attacking is optional.",
		),
		slide(
			"battle-win",
			"Reaching 0 Life Points",
			"When a player's Life Points reach 0, the duel ends immediately and the other player wins. Here the opponent has 1500 LP, so Middle Titan's 2000 direct attack finishes it.",
			{
				template: "numeric",
				terms: [
					{ value: 1500, label: "Opponent LP", tone: "blue" },
					{ value: 2000, label: "Middle Titan ATK", tone: "red" },
				],
				op: "-",
				result: { value: 0, label: "LP (never below 0)", tone: "gold" },
				cards: [SAMPLE.middleTitan],
				lifePoints: { before: [8000, 1500], after: [8000, 0] },
				footnote: "1500 minus 2000 is below zero, so LP is shown as 0.",
			},
			"Middle Titan's 2000 ATK direct attack against 1500 Life Points leaves the opponent at 0, and you win the duel.",
		),
	],
});
