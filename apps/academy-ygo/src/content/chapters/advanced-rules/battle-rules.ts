import type { Lesson } from "@/lib/lesson-types";
import { SRC, effectMonster, facedown, lesson, normalMonster, slide, spell } from "@/content/helpers";

const attacker = normalMonster("Bronze Soldier", 4, 1500, 1200);
const bigAttacker = effectMonster("Gigant Guardian", 7, 2500, 2000, { attribute: "EARTH", monsterType: "Warrior / Effect" });
const defender = normalMonster("Wall Warden", 4, 1000, 2000);
const piercer = effectMonster("Spear Lancer", 4, 1900, 1000, {
	monsterType: "Warrior / Effect",
	text: "If this card attacks a Defense Position monster, inflict piercing battle damage to your opponent.",
});
const unbreakable = effectMonster("Stone Bastion", 4, 1200, 1800, {
	monsterType: "Rock / Effect",
	text: "This card cannot be destroyed by battle.",
});
const flipper = effectMonster("Flip Watcher", 3, 500, 500, {
	monsterType: "Spellcaster / Flip / Effect",
	text: "FLIP: Draw 1 card.",
});

export const battleRulesLesson: Lesson = lesson({
	id: "battle-rules",
	chapterId: "advanced-rules",
	title: "Battle Rules in Detail",
	description:
		"Walk through the Battle Phase step by step, from declaring an attack to the Damage Step, including replays and special battle effects.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"br-overview",
			"Four Steps in the Battle Phase",
			"The Battle Phase has a Start Step, then Battle Steps and Damage Steps for each attack, then an End Step. Understanding these steps tells you when cards can be played.",
			{
				template: "timeline",
				variant: "battle",
				items: [
					{ label: "Start Step", tone: "blue" },
					{ label: "Battle Step", sub: "attack declared", tone: "gold" },
					{ label: "Damage Step", tone: "red" },
					{ label: "End Step", tone: "green" },
				],
				active: 0,
			},
			"A timeline of the Battle Phase: Start Step, Battle Step, Damage Step and End Step, with the Start Step highlighted.",
			"A single Battle Phase can contain many Battle Steps and Damage Steps, one for each attack declared.",
		),
		slide(
			"br-start-step",
			"Start Step",
			"The Battle Phase begins with a Start Step. Effects that say at the start of the Battle Phase activate here, before any attack is declared.",
			{
				template: "timeline",
				variant: "battle",
				items: [
					{ label: "Start Step", sub: "no attack yet", tone: "blue" },
					{ label: "Battle Step", tone: "gold" },
					{ label: "Damage Step", tone: "red" },
					{ label: "End Step", tone: "green" },
				],
				active: 0,
			},
			"The same Battle Phase timeline with the Start Step active and a note that no attack has been declared yet.",
			"If neither player acts, the turn player moves into the Battle Step and may declare their first attack.",
		),
		slide(
			"br-declare",
			"Declaring an Attack",
			"In the Battle Step the turn player picks one of their monsters in Attack Position and chooses a target. Cards that say when an attack is declared respond now.",
			{
				template: "duel-field",
				highlight: [
					{ zone: "mm2", side: "you" },
					{ zone: "mm2", side: "opponent" },
				],
				cards: [
					{ zone: "mm2", side: "you", card: attacker },
					{ zone: "mm2", side: "opponent", card: defender },
				],
				arrows: [{ from: { zone: "mm2", side: "you" }, to: { zone: "mm2", side: "opponent" }, label: "Attack declared" }],
				callout: "Battle Step",
			},
			"A duel field where Bronze Soldier on your side declares an attack on an opponent monster, with an arrow labelled Attack declared.",
			"Each monster can normally attack once per Battle Phase. Declaring an attack is also when attack-triggered effects can be activated.",
		),
		slide(
			"br-direct",
			"Direct Attacks",
			"If your opponent controls no monsters, your monster can attack directly. Battle damage equal to the attacker's ATK is dealt to their Life Points.",
			{
				template: "numeric",
				terms: [
					{ value: 8000, label: "Opponent LP", tone: "white" },
					{ value: 1500, label: "Direct attack", tone: "red" },
				],
				op: "-",
				result: { value: 6500, label: "New LP", tone: "gold" },
				cards: [attacker],
				lifePoints: { before: [8000, 8000], after: [8000, 6500] },
			},
			"A direct attack of 1500 ATK reduces the opponent's Life Points from 8000 to 6500.",
			"A direct attack is only possible when the opponent controls no monsters, unless a card allows attacking directly.",
		),
		slide(
			"br-replay",
			"The Replay",
			"If, after an attack is declared, the number of monsters your opponent controls changes before damage calculation, a replay occurs. The attacker may choose a new target or cancel the attack.",
			{
				template: "sequence",
				step: 2,
				of: 2,
				action: "Opponent's monster leaves before damage. A replay lets the attacker pick a new target or cancel.",
				scene: {
					monsters: [attacker, null, null, null, null],
					graveyard: [defender],
				},
				motion: "field-to-graveyard",
			},
			"After the defending monster leaves the field, a replay lets the attacker choose a new target or cancel the attack.",
			"A replay also happens when a monster is added to the opponent's field. The attack is not cancelled automatically, the attacker simply decides again.",
		),
		slide(
			"br-damage-steps",
			"Five Parts of the Damage Step",
			"The Damage Step has five parts: start, before damage calculation, damage calculation, after damage calculation, and end. Each part permits different kinds of actions.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Start", tone: "blue" },
					{ label: "Before calculation", sub: "flip face-down", tone: "gold" },
					{ label: "Damage calculation", tone: "red" },
					{ label: "After calculation", tone: "purple" },
					{ label: "End", tone: "green" },
				],
				active: 2,
			},
			"A five-step timeline of the Damage Step with damage calculation highlighted: start, before calculation, calculation, after calculation, end.",
			"These sub-steps decide what may be activated. A face-down defender is flipped face-up before damage calculation.",
		),
		slide(
			"br-damage-restrictions",
			"Damage Step Restrictions",
			"During the Damage Step only a limited set of cards can be activated: Counter Traps, effects that change ATK or DEF, and cards that say they can be activated in the Damage Step.",
			{
				template: "illustration",
				cards: [spell("Sudden Strike", "quick-play", { text: "Target 1 face-up monster; it gains 700 ATK until the end of this turn." })],
				chips: [
					{ label: "Counter Traps", tone: "purple" },
					{ label: "ATK/DEF changes", tone: "gold" },
					{ label: "Others: usually no", tone: "red" },
				],
			},
			"A Quick-Play Spell that boosts ATK, with chips showing what can be activated in the Damage Step: Counter Traps, ATK or DEF changes, and few others.",
			"ATK or DEF changes are only allowed before damage calculation. Check the exact timing on a card: some cards state exceptions explicitly.",
		),
		slide(
			"br-atk-vs-atk",
			"Attack Against Attack",
			"When two Attack Position monsters battle, the higher ATK wins. The weaker monster is destroyed and its controller takes the difference. If ATK is equal, both monsters are destroyed.",
			{
				template: "numeric",
				terms: [
					{ value: 2500, label: "Attacker ATK", tone: "gold" },
					{ value: 1500, label: "Defender ATK", tone: "blue" },
				],
				op: "-",
				result: { value: 1000, label: "Damage to defender", tone: "red" },
				cards: [bigAttacker, attacker],
				lifePoints: { before: [8000, 8000], after: [8000, 7000] },
			},
			"A 2500 ATK attacker battles a 1500 ATK defender. The defender is destroyed and its controller loses 1000 Life Points.",
			"Equal ATK destroys both monsters and causes no battle damage. Destruction in battle happens after damage calculation.",
		),
		slide(
			"br-atk-vs-def",
			"Attack Against Defense",
			"If the attacker's ATK is higher than the Defense Position monster's DEF, the defender is destroyed and no damage is dealt. If it is lower, the attacker's controller takes the difference.",
			{
				template: "numeric",
				terms: [
					{ value: 1500, label: "Attacker ATK", tone: "gold" },
					{ value: 2000, label: "Defender DEF", tone: "blue" },
				],
				op: "vs",
				result: { value: 500, label: "Damage to attacker's controller", tone: "red" },
				cards: [attacker, defender],
				lifePoints: { before: [8000, 8000], after: [7500, 8000] },
			},
			"A 1500 ATK monster attacks a 2000 DEF monster. Nothing is destroyed and the attacker's controller takes 500 battle damage.",
			"Equal ATK and DEF means no destruction and no damage. Defense Position monsters cause damage to the attacker only when DEF is higher.",
		),
		slide(
			"br-piercing",
			"Piercing Battle Damage",
			"Piercing means that when the attacker destroys a Defense Position monster, damage equal to ATK minus DEF is dealt. It only works when the card says so.",
			{
				template: "numeric",
				terms: [
					{ value: 1900, label: "Attacker ATK", tone: "gold" },
					{ value: 1000, label: "Defender DEF", tone: "blue" },
				],
				op: "-",
				result: { value: 900, label: "Piercing damage", tone: "red" },
				cards: [piercer, normalMonster("Short Wall", 3, 800, 1000, { position: "defense" })],
				lifePoints: { before: [8000, 8000], after: [8000, 7100] },
			},
			"A 1900 ATK piercing monster destroys a 1000 DEF defender and inflicts 900 piercing battle damage to the opponent.",
			"Without a piercing effect, attacking a Defense Position monster with higher ATK deals no damage at all.",
		),
		slide(
			"br-cannot-be-destroyed",
			"Cannot Be Destroyed by Battle",
			"Such a monster is not destroyed after battle, but battle damage is still calculated and dealt unless the card says otherwise. It does not prevent being sent to the Graveyard by other means.",
			{
				template: "comparison",
				before: { label: "Before battle", cards: [unbreakable], lifePoints: [8000, 8000], tone: "blue" },
				after: { label: "After battle", cards: [unbreakable], lifePoints: [8000, 7500], note: "Still on the field; damage applied", tone: "green" },
				arrowLabel: "Attacked by 2300 ATK",
				headings: ["Before", "After"],
			},
			"A Stone Bastion that cannot be destroyed by battle stays on the field after being attacked, but its controller still loses Life Points.",
			"Destroy protection only covers the kind of destruction it names. It does not stop effects that send, banish or tribute.",
		),
		slide(
			"br-flip-battle",
			"Attacking a Face-Down Monster",
			"A face-down Defense Position monster is turned face-up before damage calculation. Then the battle is resolved with its DEF, and any Flip effect activates after damage calculation.",
			{
				template: "sequence",
				step: 2,
				of: 3,
				action: "Face-down monster is flipped face-up; Flip Watcher's Flip effect triggers after damage calculation.",
				scene: {
					monsters: [facedown(flipper), null, null, null, null],
				},
				motion: "flip",
			},
			"A face-down Defense Position monster is flipped face-up when attacked. Its Flip effect will activate after damage calculation.",
			"Flip effects triggered by an attack are not stopped by the monster's destruction in the same battle, because they are resolved after damage calculation.",
		),
	],
});
