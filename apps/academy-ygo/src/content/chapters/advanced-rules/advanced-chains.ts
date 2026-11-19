import type { Lesson } from "@/lib/lesson-types";
import { SRC, effectMonster, lesson, slide, spell, trap } from "@/content/helpers";

const quick = spell("Quick Response", "quick-play", { text: "Target 1 monster; it gains 500 ATK until the end of this turn." });
const counter = trap("Cancel Seal", "counter", { text: "When a card or effect is activated: Negate the activation." });
const normalTrap = trap("Snare Line", "normal", { text: "When your opponent Summons a monster: Destroy it." });
const normalSpell = spell("Plain Boost", "normal", { text: "Draw 2 cards." });

export const advancedChainsLesson: Lesson = lesson({
	id: "advanced-chains",
	chapterId: "advanced-rules",
	title: "Advanced Chains and Timing",
	description:
		"Go deeper into Spell Speeds, chain windows, priority, and what really happens when an activation is negated.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"ac-spell-speed",
			"Spell Speeds Decide Responses",
			"Speed 1 cards cannot respond to anything. Speed 2 can respond to Speed 1 or 2. Speed 3, Counter Traps, can respond to anything but only another Counter Trap can respond to them.",
			{
				template: "illustration",
				cards: [normalSpell, quick, counter],
				chips: [
					{ label: "Speed 1: no response", tone: "white" },
					{ label: "Speed 2: Speed 1-2", tone: "blue" },
					{ label: "Speed 3: Counter Trap", tone: "purple" },
				],
			},
			"Three schematic cards: a Normal Spell at Speed 1, a Quick-Play Spell at Speed 2 and a Counter Trap at Speed 3, with chips explaining which speeds can respond.",
			"Normal Spells and monster ignition effects are Speed 1. Quick-Play Spells, Normal Traps, and Quick Effects are Speed 2. Counter Traps are Speed 3.",
		),
		slide(
			"ac-chain-build",
			"Building the Chain",
			"Each activation becomes a new Chain Link, numbered in order. After each one, both players get a chance to respond. The chain keeps growing until nobody wants to add more.",
			{
				template: "timeline",
				variant: "chain-build",
				items: [
					{ label: "Chain Link 1", sub: "Plain Boost", tone: "blue" },
					{ label: "Chain Link 2", sub: "Quick Response", tone: "gold" },
					{ label: "Chain Link 3", sub: "Cancel Seal", tone: "purple" },
				],
				active: 2,
				cards: [normalSpell, quick, counter],
			},
			"A timeline with three Chain Links being built in order: Plain Boost, Quick Response, then Cancel Seal, with the third link currently active.",
			"Chain Link numbers are assigned in order of activation. Responses can only be added if the new card has a high enough Spell Speed.",
		),
		slide(
			"ac-chain-resolve",
			"Resolving in Reverse",
			"Once the chain closes, it resolves from the highest Chain Link down to Chain Link 1. Each effect resolves completely before the next one begins.",
			{
				template: "timeline",
				variant: "chain-resolve",
				items: [
					{ label: "Link 3 first", sub: "Cancel Seal", tone: "purple" },
					{ label: "Link 2 next", sub: "Quick Response", tone: "gold" },
					{ label: "Link 1 last", sub: "Plain Boost", tone: "blue" },
				],
				active: 0,
				cards: [counter, quick, normalSpell],
			},
			"A resolution timeline: Chain Link 3 resolves first, then Link 2, and finally Link 1, which was the first card activated.",
			"Last in, first out. If Link 3 negates Link 2's activation, Link 2 never resolves, and Link 1 will still resolve afterwards.",
		),
		slide(
			"ac-windows",
			"Windows to Respond",
			"After any activation, the opponent of the activating player gets the first chance to respond. If they pass, the original player may add another link. When both pass, the chain resolves.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Activate", sub: "Player A", tone: "blue" },
					{ label: "Opponent may respond", sub: "Player B", tone: "red" },
					{ label: "Player A may respond again", tone: "blue" },
					{ label: "Both pass", sub: "chain resolves", tone: "green" },
				],
				active: 1,
			},
			"A four-step timeline: Player A activates, Player B may respond, Player A may respond to that, and when both pass the chain resolves.",
			"Passing priority back and forth is how a chain finishes. Announcing a response clearly helps everyone know the window is still open.",
		),
		slide(
			"ac-priority",
			"Priority and Fast Effects",
			"The turn player has priority to activate effects first in each window. The opponent can only act once the turn player passes or acts, which is why timing order matters.",
			{
				template: "duel-field",
				highlight: [
					{ zone: "mm3", side: "you" },
					{ zone: "st3", side: "opponent" },
				],
				cards: [
					{ zone: "mm3", side: "you", card: effectMonster("Active Mage", 4, 1500, 1000) },
					{ zone: "st3", side: "opponent", card: { ...normalTrap, position: "facedown-spelltrap" } },
				],
				arrows: [{ from: { zone: "mm3", side: "you" }, to: { zone: "st3", side: "opponent" }, label: "You act first" }],
				callout: "Turn player has priority",
			},
			"A duel field where the turn player's monster has priority, with an arrow toward the opponent's face-down Trap that can only respond afterwards.",
			"Priority does not stop the opponent from responding to a chain. It only decides who gets to act first when the game state allows effects.",
		),
		slide(
			"ac-triggers-after-chain",
			"Triggers Wait for the Chain",
			"If an event happens while a chain is resolving, trigger effects do not join that chain. They wait until it finishes, then start a new chain with their own Chain Links.",
			{
				template: "sequence",
				step: 2,
				of: 3,
				action: "Chain finishes resolving. New triggers from events during resolution now form a new chain.",
				scene: {
					monsters: [effectMonster("Echo Scout", 3, 1000, 800), null, null, null, null],
					graveyard: [normalSpell],
				},
			},
			"A scene after a chain resolves. Echo Scout, summoned during resolution, now waits to start a new chain with its trigger effect.",
			"Triggers that occur from events inside a chain resolution are placed on the next chain, not the current one. Quick Effects, however, can still respond within the chain.",
		),
		slide(
			"ac-negate-activation",
			"Negate the Activation",
			"Negating an activation stops that effect from happening at all. It must be done in response, and the negated card is still treated as having been activated for its costs.",
			{
				template: "sequence",
				step: 2,
				of: 2,
				action: "Seal Counter responds. The original Spell's activation is negated and its effect does not resolve.",
				scene: {
					spellTraps: [{ ...counter, order: 2 }, { ...normalSpell, order: 1 }, null, null, null],
					graveyard: [],
				},
				motion: "field-to-graveyard",
			},
			"A Counter Trap in Chain Link 2 negates the activation of a Spell in Chain Link 1. The Spell's effect does not resolve.",
			"Cards say negate the activation, and if you do, destroy it. The and if you do part only happens if the negation succeeded.",
		),
		slide(
			"ac-negate-effect",
			"Negate the Effect, Not the Activation",
			"Negate the effect is different: the card was activated, so its costs and anything that cares about activation still count, but its effect does not apply when it resolves.",
			{
				template: "comparison",
				before: { label: "Negate activation", cards: [normalSpell], note: "Stops the effect; activation itself negated", tone: "red" },
				after: { label: "Negate effect", cards: [{ ...normalSpell, ghost: true }], note: "Activation counted; effect does not apply", tone: "gold" },
				arrowLabel: "vs",
				headings: ["Activation", "Effect"],
			},
			"Two panels. One shows a Spell with its activation negated. The other shows a Spell whose effect is negated but whose activation still counted.",
			"Cards that negate effects of monsters on the field are a different category: they stop an effect applying, and are not tied to a specific chain link.",
		),
		slide(
			"ac-negate-summon",
			"Summon Negation Windows",
			"Some Normal, Flip and Special Summons can be responded to before they succeed. Summons that happen during an effect's resolution cannot be negated as Summons; the effect is the target.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Summon declared", sub: "window opens", tone: "blue" },
					{ label: "Respond", sub: "Speed 2+", tone: "purple" },
					{ label: "Summon succeeds", sub: "new triggers", tone: "green" },
				],
				active: 1,
			},
			"A three-step timeline: a Summon is declared and a window opens, players may respond at Speed 2 or higher, then the Summon succeeds and triggers follow.",
			"Only Summons that do not happen inside a chain's resolution give this window. For Summons within an effect, respond to the effect instead.",
		),
		slide(
			"ac-chain-restrictions",
			"When You Cannot Respond",
			"Some effects restrict responses, saying opponent cannot activate cards or effects in response. This does not stop a chain from existing, it limits what can be added to it.",
			{
				template: "illustration",
				cards: [effectMonster("Silent Seer", 4, 1800, 1200, { text: "Your opponent cannot activate cards or effects in response to this effect." })],
				chips: [
					{ label: "Limits responses", tone: "red" },
					{ label: "Not a negation", tone: "blue" },
				],
			},
			"A monster whose text says the opponent cannot activate cards or effects in response, with chips noting that this limits responses rather than negating.",
			"Such a restriction applies to responses to that effect only, which is why it is different from a continuous effect that negates.",
		),
	],
});
