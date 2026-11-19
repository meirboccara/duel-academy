import type { CardSpec, Lesson } from "@/lib/lesson-types";
import { SRC, effectMonster, lesson, normalMonster, slide, spell } from "@/content/helpers";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE" });
const titan = effectMonster("Middle Titan", 5, 2000, 1500, { attribute: "EARTH", monsterType: "Warrior / Effect" });
const token: CardSpec = { name: "Spirit Token", kind: "token", atk: 0, def: 0, attribute: "LIGHT", monsterType: "Fiend / Token" };
const equip = spell("Blade Boost", "equip", { text: "The equipped monster gains 400 ATK." });

export const commonMechanicsLesson: Lesson = lesson({
	id: "common-mechanics",
	chapterId: "advanced-rules",
	title: "Common Game Mechanics",
	description:
		"The exact words for moving cards, who owns and controls them, and other mechanics that appear in card text over and over.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"cm-why-words",
			"Exact Words Matter",
			"Destroy, send, Tribute, discard and banish are different actions. Cards react to specific words, so a card that stops destruction does not automatically stop the other four.",
			{
				template: "illustration",
				chips: [
					{ label: "Destroy", tone: "red" },
					{ label: "Send", tone: "blue" },
					{ label: "Tribute", tone: "gold" },
					{ label: "Discard", tone: "purple" },
					{ label: "Banish", tone: "white" },
				],
				motif: "tribute",
			},
			"A tribute symbol with five chips: Destroy, Send, Tribute, Discard and Banish, representing five different ways cards leave the field or hand.",
			"Several of these end with the card in the Graveyard, but they are still different events. Only the word on the card matters.",
		),
		slide(
			"cm-destroy",
			"Destroy",
			"A destroyed card is sent to the Graveyard because it was destroyed, by battle or by an effect. Cards that say cannot be destroyed prevent this, but not other ways of leaving.",
			{
				template: "sequence",
				step: 1,
				of: 1,
				action: "Flame Caster is destroyed by battle and goes to the Graveyard.",
				scene: { monsters: [caster, null, null, null, null], graveyard: [] },
				motion: "field-to-graveyard",
			},
			"Flame Caster is destroyed and moves from the monster zone to the Graveyard.",
			"Destroyed by battle and destroyed by effect are separate. Some cards trigger when a monster is destroyed by battle only.",
		),
		slide(
			"cm-send",
			"Send to the Graveyard",
			"Sending is a different action from destroying. A card that cannot be destroyed can still be sent to the Graveyard by a card that says send. Costs often send cards from the Deck or hand.",
			{
				template: "comparison",
				before: { label: "Destroy", cards: [soldier], note: "Blocked by cannot be destroyed", tone: "red" },
				after: { label: "Send", cards: [soldier], note: "Not blocked by that protection", tone: "blue" },
				arrowLabel: "Different words",
				headings: ["Destroy", "Send"],
			},
			"Two panels showing the same monster. Destroy is blocked by a destruction-protection effect, but Send to the Graveyard is a different action and is not blocked.",
			"The reverse is also true. A card that says cannot be sent to the Graveyard does not stop destruction by battle or effect in itself.",
		),
		slide(
			"cm-tribute",
			"Tribute (Release)",
			"A Tribute is a monster you give up to pay a cost or to Tribute Summon. It goes to the Graveyard, but it was not destroyed. A card that says Tribute needs a monster to pay it.",
			{
				template: "sequence",
				step: 1,
				of: 2,
				action: "Tribute Summon: send 1 monster as a Tribute to Normal Summon Middle Titan.",
				scene: {
					hand: [titan],
					monsters: [soldier, null, null, null, null],
					materials: [soldier],
					result: titan,
				},
				motion: "materials-to-result",
			},
			"Bronze Soldier is offered as a Tribute to Normal Summon Middle Titan from the hand.",
			"Tributed monsters are not destroyed, so destruction triggers do not apply. Some cards ask you to Tribute as a cost instead of for a Summon.",
		),
		slide(
			"cm-discard",
			"Discard",
			"Discard means sending a card from your hand to the Graveyard. It is often a cost, and the card must be in your hand. Cards sent from the field are not discarded.",
			{
				template: "sequence",
				step: 1,
				of: 1,
				action: "Discard 1 card from your hand to the Graveyard as a cost.",
				scene: { hand: [soldier, caster], graveyard: [] },
				motion: "field-to-graveyard",
			},
			"A hand with two cards. One of them is discarded to the Graveyard, as a cost.",
			"Only cards in the hand can be discarded. If the card text says send from the hand, it is also discard, but if it says send from the Deck, it is not.",
		),
		slide(
			"cm-banish",
			"Banish",
			"A banished card is removed from play. It does not go to the Graveyard and cannot be used again unless another card brings it back. Banished cards can be face-up or face-down.",
			{
				template: "sequence",
				step: 1,
				of: 1,
				action: "Flame Caster is banished from the field, away from the Graveyard.",
				scene: { monsters: [caster, null, null, null, null] },
				motion: "to-banished",
			},
			"A monster is banished from the monster zone and placed in the banished zone, separate from the Graveyard.",
			"Many cards check the Graveyard. Banished cards avoid those effects, but also cannot be recycled by cards that only look in the Graveyard.",
		),
		slide(
			"cm-return",
			"Return to Hand or Deck",
			"Returning sends a card from the field or Graveyard to a hand or Deck. A returned card is a new card to the game, so effects and counters on it are lost.",
			{
				template: "comparison",
				before: { label: "On the field", cards: [caster], note: "Has effects and counters", tone: "blue" },
				after: { label: "In the hand", cards: [caster], note: "A new card; markers gone", tone: "gold" },
				arrowLabel: "Return to hand",
				headings: ["Before", "After"],
			},
			"A monster on the field is returned to the hand, where it is treated as a new card without any previous effects.",
			"This resets once-per-turn counts for soft limits. Hard limits tied to the card name continue to apply.",
		),
		slide(
			"cm-owner-control",
			"Owner Versus Controller",
			"The owner is the player whose Deck the card started in. The controller is the player using it now. Control can change, but the card still returns to its owner's Graveyard or hand.",
			{
				template: "duel-field",
				highlight: [{ zone: "mm3", side: "opponent" }],
				cards: [{ zone: "mm3", side: "opponent", card: titan }],
				arrows: [{ from: { zone: "mm3", side: "opponent" }, to: { zone: "mm3", side: "you" }, label: "Control changes" }],
				callout: "Owner stays the same",
			},
			"An arrow from a card on the opponent's side to your side labelled Control changes. A callout says the owner stays the same.",
			"When a card whose controller differs from its owner is destroyed, it goes to its owner's Graveyard, not its controller's.",
		),
		slide(
			"cm-tokens",
			"Tokens",
			"Tokens are placeholder monsters created by effects. They are not cards from any Deck. If a token leaves the field, it disappears and does not stay in the Graveyard.",
			{
				template: "illustration",
				cards: [token],
				chips: [
					{ label: "Not from a Deck", tone: "white" },
					{ label: "Vanishes if it leaves", tone: "red" },
				],
			},
			"A schematic Token monster with chips: Not from a Deck and Vanishes if it leaves.",
			"Tokens can still be used as Tributes or materials for Summons, because they are monsters while on the field.",
		),
		slide(
			"cm-positions",
			"Changing Battle Position",
			"Each monster can change Battle Position once per turn, not on the turn it was Summoned or Set. Flip Summon turns a face-down monster face-up in Attack Position.",
			{
				template: "sequence",
				step: 1,
				of: 2,
				action: "A monster on the field switches from Attack Position to Defense Position.",
				scene: { monsters: [soldier, null, null, null, null] },
			},
			"A monster on the field changes from Attack Position to Defense Position.",
			"A monster that was Special Summoned or Set the previous turn can usually change position. Check any limits on the specific card.",
		),
		slide(
			"cm-equip",
			"Equip and Attachments",
			"An Equip Spell stays on the field attached to one monster. If that monster leaves the field or the Equip Card becomes illegal, the Equip Spell is sent to the Graveyard.",
			{
				template: "duel-field",
				highlight: [
					{ zone: "mm3", side: "you" },
					{ zone: "st3", side: "you" },
				],
				cards: [
					{ zone: "mm3", side: "you", card: soldier },
					{ zone: "st3", side: "you", card: equip },
				],
				arrows: [{ from: { zone: "st3", side: "you" }, to: { zone: "mm3", side: "you" }, label: "Equipped" }],
				callout: "Attached to 1 monster",
			},
			"A Blade Boost Equip Spell in the Spell/Trap zone linked by an arrow to the Bronze Soldier it is equipped to.",
			"If the equipped monster is destroyed or leaves, the Equip Spell has nothing to attach to and goes to the Graveyard.",
		),
		slide(
			"cm-target-vs-affect",
			"Cannot Be Targeted, Unaffected, Cannot Be Destroyed",
			"These are three different protections. Cannot be targeted stops only targeting. Cannot be destroyed stops only destruction. Unaffected stops the card from being affected by named effects.",
			{
				template: "illustration",
				chips: [
					{ label: "Not targeted", tone: "blue" },
					{ label: "Not destroyed", tone: "red" },
					{ label: "Unaffected", tone: "purple" },
				],
				cards: [effectMonster("Shielded Sage", 4, 1800, 1500)],
			},
			"A monster with three chips: Not targeted, Not destroyed, and Unaffected, showing three different kinds of protection.",
			"A card with all three protections is rare. Always read exactly which one applies to a particular card.",
		),
		slide(
			"cm-lp-cost-vs-damage",
			"Paying Life Points Versus Taking Damage",
			"Paying Life Points is a cost and not damage. Effects that reduce damage do not affect it. Effect damage and battle damage are different too, so cards that stop one do not stop the other.",
			{
				template: "numeric",
				terms: [
					{ value: 8000, label: "Your LP", tone: "white" },
					{ value: 1000, label: "LP paid as cost", tone: "gold" },
				],
				op: "-",
				result: { value: 7000, label: "New LP", tone: "red" },
				lifePoints: { before: [8000, 8000], after: [7000, 8000] },
			},
			"You pay 1000 Life Points as a cost, lowering your LP from 8000 to 7000. This is not damage.",
			"Cards that negate or halve damage do not apply to LP payments. Paying is only possible if you have enough Life Points.",
		),
		slide(
			"cm-summon-types",
			"Kinds of Summon",
			"Normal Summon, Tribute Summon, Flip Summon and Special Summon are different. A card that stops Special Summons does not stop a Normal Summon, and vice versa.",
			{
				template: "illustration",
				chips: [
					{ label: "Normal / Tribute", tone: "gold" },
					{ label: "Flip", tone: "blue" },
					{ label: "Special", tone: "purple" },
				],
				cards: [soldier, titan],
			},
			"Two monsters and three chips: Normal or Tribute Summon, Flip Summon and Special Summon, showing that they are separate kinds of Summon.",
			"A Tribute Summon is a Normal Summon with Tributes. Special Summons include Fusion, Synchro, Xyz, Link, Ritual and Pendulum Summons.",
		),
		slide(
			"cm-recap",
			"Say It the Card's Way",
			"When you describe what happens in a duel, use the exact verb from the card. Your opponent and a Judge then know exactly what rule applies.",
			{
				template: "illustration",
				motif: "judge",
				chips: [
					{ label: "Use exact verbs", tone: "gold" },
					{ label: "Owner or controller?", tone: "blue" },
					{ label: "Which Summon?", tone: "purple" },
				],
			},
			"A judge symbol with three chips: Use exact verbs, Owner or controller, and Which Summon.",
			"If an unfamiliar word appears on a card, read the Konami rulebook or ask a Judge before assuming it matches a word you already know.",
		),
	],
});
