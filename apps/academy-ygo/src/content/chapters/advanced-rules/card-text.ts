import type { Lesson } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { SRC, effectMonster, lesson, slide, spell, trap } from "@/content/helpers";

const discarder = effectMonster("Cost Courier", 4, 1500, 1000, {
	text: "You can discard 1 card; draw 1 card.",
});
const trigger = effectMonster("Echo Scout", 3, 1000, 800, {
	text: "When this card is Summoned: You can add 1 monster from your Deck to your hand.",
});
const ifTrigger = effectMonster("Steady Scout", 3, 1000, 800, {
	text: "If this card is Summoned: You can add 1 monster from your Deck to your hand.",
});
const hardOpt = effectMonster("Hard Limit Mage", 4, 1600, 1000, {
	text: 'You can only use this effect of "Hard Limit Mage" once per turn.',
});
const softOpt = effectMonster("Soft Limit Mage", 4, 1600, 1000, {
	text: "Once per turn: You can draw 1 card.",
});
const targeter = spell("Pointing Finger", "quick-play", {
	text: "Target 1 monster you control; it gains 500 ATK until the end of this turn.",
});
const nonTargeter = spell("Wide Wave", "normal", {
	text: "Destroy all monsters your opponent controls.",
});

export const cardTextLesson: Lesson = lesson({
	id: "card-text",
	chapterId: "advanced-rules",
	title: "Understanding Card Text",
	description:
		"Learn to read card text like a rulebook: conditions, costs, targets, limits, and the small words that change everything.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"ct-reading-order",
			"Card Text Has a Grammar",
			"Every effect follows a pattern: when it can be used, what you pay, and what it does. Reading in that order prevents most misunderstandings about how a card works.",
			{
				template: "illustration",
				cards: [discarder],
				chips: [
					{ label: "Condition", tone: "blue" },
					{ label: "Cost", tone: "gold" },
					{ label: "Effect", tone: "green" },
				],
			},
			"A schematic effect monster card with three chips beside it labelled Condition, Cost and Effect, showing the order in which text is read.",
			"Teach the habit: read the whole text once, then split it into activation requirements, cost, then effect. Many disputes at the table come from skipping this.",
		),
		slide(
			"ct-colon-semicolon",
			"Colon and Semicolon",
			"Text before a colon is what is needed to activate, including any cost. The semicolon separates a cost from the effect. Whatever follows is the effect that applies on resolution.",
			{
				template: "card-anatomy",
				card: discarder,
				highlight: ["effect"],
				labels: [
					{ part: "effect", text: "Cost: discard 1 card; Effect: draw 1" },
				],
			},
			"A schematic effect monster whose text reads: You can discard 1 card; draw 1 card. A label marks the discard as the cost and the draw as the effect.",
			"Punctuation is how Konami separates costs and requirements from effects. A colon introduces the effect after the activation requirement. A semicolon after a cost marks the start of the effect.",
		),
		slide(
			"ct-cost-vs-effect",
			"Costs Are Paid, Effects Can Fail",
			"A cost is paid when you activate and stays paid even if your opponent negates the effect afterwards. An effect only happens if it resolves. That difference matters for planning your plays.",
			{
				template: "comparison",
				before: {
					label: "On activation",
					cards: [discarder],
					note: "Discard 1 card (cost paid)",
					tone: "gold",
				},
				after: {
					label: "If negated",
					cards: [{ ...discarder, ghost: true }],
					note: "No draw, but the card stays discarded",
					tone: "red",
				},
				arrowLabel: "Negated",
				headings: ["Activate", "Resolve"],
			},
			"Two panels. On activation the cost of discarding a card is paid. After the effect is negated, no card is drawn but the discarded card stays in the Graveyard.",
			"Costs are not refunded if the effect is negated or fails. This is also why you check whether you can actually pay a cost before trying to activate.",
		),
		slide(
			"ct-targeting",
			"Targeting Needs the Word",
			"An effect targets only if its text says target. Targets are chosen on activation. If a target is gone or no longer legal on resolution, the effect does nothing to it.",
			{
				template: "comparison",
				before: { label: "Targets", cards: [targeter], note: 'Says "Target 1 monster"', tone: "blue" },
				after: { label: "Does not target", cards: [nonTargeter], note: "Affects all, no choice made", tone: "green" },
				arrowLabel: "vs",
				headings: ["Targeting", "Non-targeting"],
			},
			"Two cards compared. One Spell says Target 1 monster you control and chooses a target on activation. The other destroys all opponent monsters and chooses nothing.",
			"Protection like cannot be targeted only stops effects that use the word target. It does not stop an effect that destroys all monsters.",
		),
		slide(
			"ct-mandatory-optional",
			"Mandatory or Optional",
			"The words You can mean the effect is optional. Without them, the effect is mandatory and must be used when its condition is met. Mandatory trigger effects are put on a chain automatically.",
			{
				template: "illustration",
				cards: [discarder, { ...SAMPLE.flameCaster, text: "At the end of the turn: Destroy this card." }],
				chips: [
					{ label: "You can = optional", tone: "green" },
					{ label: "No can = mandatory", tone: "red" },
				],
			},
			"Two schematic monsters. One says You can discard and is optional. The other says At the end of the turn destroy this card with no choice, so it is mandatory.",
			"A mandatory effect must be used even if it hurts you, provided it can be. Optional effects can be skipped, but they may miss their window.",
		),
		slide(
			"ct-opt",
			"Once Per Turn: Soft and Hard",
			'Soft limit: Once per turn applies to that one card. Hard limit: You can only use this effect of "Name" once per turn counts all copies by name, even if cards leave and return.',
			{
				template: "comparison",
				before: { label: "Soft", cards: [softOpt], note: "One use per card, per turn", tone: "blue" },
				after: { label: "Hard", cards: [hardOpt], note: "One use per name, per turn", tone: "gold" },
				arrowLabel: "Limits",
				headings: ["Once per turn", "Name once per turn"],
			},
			"Two monsters. The first has a soft once per turn limit tied to the individual card. The second has a hard limit that applies to every card with that name.",
			"The hard version is written with the card's name in quotation marks. A second copy of the card, or the same card returning, cannot reuse a hard limited effect in the same turn.",
		),
		slide(
			"ct-when-if",
			"When Versus If",
			'"When X, you can" is optional and only works if X is the last thing to happen. "If X, you can" also works when X happened earlier. This difference is called timing.',
			{
				template: "comparison",
				before: { label: "When", cards: [trigger], note: "Must be the last event to trigger", tone: "red" },
				after: { label: "If", cards: [ifTrigger], note: "Works even if more happened after", tone: "green" },
				arrowLabel: "Timing",
				headings: ["When ...you can", "If ...you can"],
			},
			"Two similar monsters. The When version triggers only when the Summon is the last thing to happen. The If version still triggers even if other events followed.",
			"Optional when effects are the ones that can miss timing. Mandatory when effects do not miss timing, and neither do optional or mandatory if effects.",
		),
		slide(
			"ct-missing-timing",
			"Missing the Timing",
			"If an effect Summons a monster and then does more in the same resolution, the Summon is not the last event. An optional When trigger on that monster cannot activate.",
			{
				template: "sequence",
				step: 1,
				of: 2,
				action: "A card Special Summons Echo Scout, then also destroys a card. Summon is no longer the last event.",
				scene: {
					hand: [spell("Summon And Strike", "normal", { text: "Special Summon 1 monster; then destroy 1 card." })],
					monsters: [trigger, null, null, null, null],
				},
				motion: "hand-to-field",
			},
			"A Spell is activated and Special Summons Echo Scout, then continues to destroy a card. Because the Summon was not the last event, the optional When trigger misses its timing.",
			"Missing timing depends on the wording of the card that caused the event. If the Summon is the last thing that happened during the resolution, the When trigger still works.",
		),
		slide(
			"ct-simultaneous",
			"Several Triggers at Once",
			"When multiple trigger effects occur together, the turn player's mandatory effects go first, then the opponent's mandatory, then optional ones in the same order, all into one chain.",
			{
				template: "timeline",
				variant: "steps",
				items: [
					{ label: "Turn player", sub: "mandatory", tone: "gold" },
					{ label: "Opponent", sub: "mandatory", tone: "red" },
					{ label: "Turn player", sub: "optional", tone: "gold" },
					{ label: "Opponent", sub: "optional", tone: "red" },
				],
				active: 0,
			},
			"A four-step timeline for ordering triggers: turn player mandatory, opponent mandatory, turn player optional, then opponent optional.",
			"This ordering is commonly called SEGOC. Each player chooses the order of their own effects, and they all join the same chain as successive chain links.",
		),
		slide(
			"ct-then-and",
			"Then, And If You Do, Also",
			"Words like then and and if you do tie parts of an effect together: the second part only happens if the first part really did. Also stands apart and does not depend on it.",
			{
				template: "illustration",
				chips: [
					{ label: "then: after first part", tone: "blue" },
					{ label: "and if you do: needs first", tone: "gold" },
					{ label: "also: independent", tone: "green" },
				],
				cards: [spell("Linked Steps", "normal", { text: "Discard 1 card, then draw 1 card." })],
			},
			"A Spell reading Discard 1 card, then draw 1 card, with chips explaining that then and and if you do require the first part and also is independent.",
			"If the first part cannot be done or is negated, then or and if you do effects stop there. An also effect continues even if the first part failed.",
		),
		slide(
			"ct-recap",
			"Read Before You Act",
			"Before activating or responding, ask: what is the condition, what is the cost, does it target, is it optional, and is it limited? Asking a Judge is better than guessing.",
			{
				template: "illustration",
				motif: "judge",
				chips: [
					{ label: "Condition and cost", tone: "blue" },
					{ label: "Targets or not", tone: "gold" },
					{ label: "When or if", tone: "green" },
					{ label: "Soft or hard limit", tone: "purple" },
				],
			},
			"A judge symbol with four chips listing the checklist: condition and cost, targets or not, when or if, soft or hard limit.",
			"Always read the exact text, not a summary from memory. Card text is the final authority on how an effect behaves.",
		),
	],
});
