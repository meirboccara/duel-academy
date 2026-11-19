import { effectMonster, lesson, normalMonster, pendulum, slide, SRC } from "@/content/helpers";
import { SAMPLE } from "@/lib/sample-cards";

const scaleLeft = SAMPLE.pendulumLeft;
const scaleRight = SAMPLE.pendulumRight;
const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const scout = effectMonster("Hand Scout", 3, 1000, 1000, { attribute: "WIND" });
const titan = SAMPLE.middleTitan;
const caster = SAMPLE.flameCaster;
const scaleMagePend = pendulum(
	effectMonster("Scale Mage", 4, 1500, 1000, { attribute: "WATER", monsterType: "Spellcaster / Pendulum / Effect" }),
	2,
	2,
	"Once per turn: Draw 1 card.",
);

export const pendulumSummoningLesson = lesson({
	id: "pendulum-summoning",
	chapterId: "extra-deck",
	title: "Pendulum Summoning",
	description: "Place two Pendulum Scales, then Special Summon many monsters whose Levels sit strictly between those scales, all at once.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"pendulum-what",
			"Pendulum Cards Are Dual Purpose",
			"A Pendulum Monster can be Summoned as a monster, or placed in a Pendulum Zone as a Spell-like Scale. Two Scales open a window for a mass Special Summon once per turn.",
			{ template: "illustration", cards: [scaleLeft, scaleRight], chips: [{ label: "Monster or Scale", tone: "purple" }, { label: "Two Scales needed", tone: "gold" }, { label: "Once per turn", tone: "green" }], motif: "scales" },
			"Two Pendulum Monsters with chips: Monster or Scale, two Scales needed, once per turn.",
		),
		slide(
			"pendulum-anatomy",
			"Reading a Pendulum Card",
			"Pendulum Monsters show two Scale numbers on the left and right of the card. The blue box is the Pendulum Effect used while in a Pendulum Zone. Below that is the monster effect.",
			{ template: "card-anatomy", card: scaleLeft, highlight: ["scale", "effect", "frame"], labels: [{ part: "scale", text: "Pendulum Scale 2" }, { part: "effect", text: "Pendulum text while Scaled" }, { part: "frame", text: "Still an Effect Monster" }] },
			"Scale Mage with Scale numbers, Pendulum text and frame highlighted.",
		),
		slide(
			"pendulum-zones",
			"The Two Pendulum Zones",
			"You have a left and a right Pendulum Zone at the ends of your Spell and Trap row. Place one Pendulum Monster face-up in each zone to set both Scales.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "pz-left" }, { zone: "pz-right" }], cards: [{ zone: "pz-left", card: scaleLeft }, { zone: "pz-right", card: scaleRight }], callout: "Left Scale and Right Scale." },
			"Your field with Scale Mage in the left Pendulum Zone and Scale Knight in the right Pendulum Zone.",
		),
		slide(
			"pendulum-place-scale",
			"Placing a Scale Is Not a Summon",
			"Putting a Pendulum Monster into a Pendulum Zone is activating it as a Spell Card in that zone. It is not a Normal Summon or a Special Summon of that monster.",
			{ template: "sequence", step: 1, of: 3, action: "Place Scale Mage face-up in your left Pendulum Zone.", scene: { hand: [scaleLeft, scaleRight, soldier], extra: [{ label: "Pendulum Zones", cards: [scaleLeft] }] }, motion: "hand-to-field" },
			"Step one of three: Scale Mage moves from the hand into a Pendulum Zone.",
		),
		slide(
			"pendulum-two-scales",
			"You Need Two Different Scale Numbers",
			"With Scale 2 on the left and Scale 7 on the right, the open window is Levels 3, 4, 5 and 6. Equal Scales give no legal Levels between them.",
			{ template: "numeric", terms: [{ value: 2, label: "Left Scale", tone: "blue" }, { value: 7, label: "Right Scale", tone: "purple" }], op: "range", numberLine: { min: 1, max: 8, scales: [2, 7], legal: [3, 4, 5, 6] }, footnote: "Levels strictly between the Scales are legal." },
			"Number line from 1 to 8 with Scales at 2 and 7, highlighting legal Levels 3 through 6.",
		),
		slide(
			"pendulum-number-line",
			"The Number Line Between Scales",
			"Pendulum Summoning Special Summons monsters whose Levels sit strictly between your Scales. Level equal to a Scale is never legal. Scale 2 and Scale 7 never allow Level 2 or Level 7.",
			{ template: "numeric", terms: [{ value: 3, label: "Hand Scout", tone: "gold" }, { value: 4, label: "Bronze Soldier", tone: "blue" }, { value: 5, label: "Middle Titan", tone: "green" }], op: "range", numberLine: { min: 1, max: 8, scales: [2, 7], legal: [3, 4, 5, 6] }, cards: [scout, soldier, titan], footnote: "All of these Levels sit between 2 and 7." },
			"Number line with Scales 2 and 7, and example monsters at Levels 3, 4 and 5 inside the window.",
		),
		slide(
			"pendulum-from-hand",
			"Pendulum Summon From Hand",
			"Once per turn, during your Main Phase, you may Pendulum Summon any number of monsters from your hand whose Levels fit between the Scales. Place them in your Main Monster Zones.",
			{ template: "sequence", step: 2, of: 3, action: "Pendulum Summon Bronze Soldier and Hand Scout from the hand.", scene: { hand: [soldier, scout, caster], monsters: [null, null, null, null, null], extra: [{ label: "Scales 2 and 7", cards: [scaleLeft, scaleRight] }] }, motion: "hand-to-field" },
			"Step two of three: monsters with legal Levels leave the hand for Monster Zones while Scales stay set.",
		),
		slide(
			"pendulum-from-extra",
			"Also From the Face-Up Extra Deck",
			"Face-up Pendulum Monsters in your Extra Deck can also be Pendulum Summoned if their Levels fit. They must go to an Extra Monster Zone or a zone a Link Monster points to.",
			{ template: "sequence", step: 3, of: 3, action: "Pendulum Summon a face-up Pendulum Monster from the Extra Deck to a legal Extra Deck zone.", scene: { result: scaleMagePend, extra: [{ label: "Face-up Extra Deck", cards: [scaleMagePend] }, { label: "Scales", cards: [scaleLeft, scaleRight] }] }, motion: "to-extra" },
			"Step three of three: a face-up Pendulum Monster leaves the Extra Deck to be Pendulum Summoned.",
		),
		slide(
			"pendulum-leaves-field",
			"Destroyed Pendulums Go Face-Up Extra",
			"When a face-up Pendulum Monster leaves the field, it goes to the Extra Deck face-up instead of the Graveyard. From there it can be Pendulum Summoned again later.",
			{ template: "comparison", headings: ["Normal monster destroyed", "Pendulum monster destroyed"], before: { label: "To Graveyard", cards: [soldier], note: "Goes to GY", tone: "blue" }, after: { label: "To Extra Deck", cards: [scaleLeft], note: "Face-up Extra Deck", tone: "purple" }, arrowLabel: "Different zone" },
			"Left: a destroyed Normal Monster goes to the Graveyard. Right: a destroyed Pendulum Monster goes face-up to the Extra Deck.",
		),
		slide(
			"pendulum-scale-destroyed",
			"A Scale Can Be Destroyed Too",
			"Pendulum Zone cards are treated like Spells while Scaled. If a Scale is destroyed, it also goes face-up to the Extra Deck, and your Pendulum window may collapse.",
			{ template: "sequence", step: 2, of: 2, action: "The right Scale is destroyed and goes face-up to the Extra Deck.", scene: { extra: [{ label: "Pendulum Zones", cards: [scaleLeft] }, { label: "Face-up Extra", cards: [scaleRight] }] }, motion: "to-extra" },
			"The right Scale leaves its Pendulum Zone and lands face-up in the Extra Deck.",
		),
		slide(
			"pendulum-once",
			"Only Once Per Turn",
			"You may Pendulum Summon only once per turn. That one action can bring out several monsters at once from hand and face-up Extra Deck, as long as each Level fits.",
			{ template: "numeric", terms: [{ value: 1, label: "Pendulum Summon per turn", tone: "gold" }, { value: "many", label: "Monsters in that Summon", tone: "green" }], op: "vs", footnote: "One Pendulum Summon action; many monsters inside it." },
			"One Pendulum Summon per turn versus many monsters allowed in that single Summon.",
		),
		slide(
			"pendulum-main-deck",
			"Pendulums Start in the Main Deck",
			"Pendulum Monsters are Main Deck cards. You draw them, then either Summon them as monsters or place them as Scales. They only join the Extra Deck face-up after leaving the field.",
			{ template: "comparison", headings: ["Main Deck start", "Face-up Extra later"], before: { label: "Drawn normally", cards: [scaleLeft, scaleRight], note: "Begin in Main Deck", tone: "gold" }, after: { label: "After leaving field", cards: [scaleMagePend], note: "Face-up Extra Deck", tone: "purple" }, arrowLabel: "Later" },
			"Left: Pendulum Monsters start in the Main Deck. Right: after leaving the field they sit face-up in the Extra Deck.",
		),
		slide(
			"pendulum-field-snapshot",
			"A Full Pendulum Board",
			"Scales 2 and 7 are set. You Pendulum Summon Hand Scout, Bronze Soldier and Middle Titan into Main Monster Zones in one action. All Levels sit between the Scales.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "pz-left" }, { zone: "pz-right" }, { zone: "mm1" }, { zone: "mm2" }, { zone: "mm3" }], cards: [{ zone: "pz-left", card: scaleLeft }, { zone: "pz-right", card: scaleRight }, { zone: "mm1", card: scout }, { zone: "mm2", card: soldier }, { zone: "mm3", card: titan }], callout: "One Pendulum Summon: three monsters." },
			"Your field with both Scales set and three monsters Pendulum Summoned into Main Monster Zones.",
		),
		slide(
			"pendulum-recap",
			"Pendulum Summon Checklist",
			"Set two Scales with different numbers, find Levels strictly between them, Special Summon from hand and face-up Extra Deck once per turn, and remember destroyed Pendulums go face-up Extra.",
			{ template: "illustration", cards: [scaleLeft, scaleRight, soldier, scout], chips: [{ label: "Two Scales", tone: "purple" }, { label: "Between only", tone: "gold" }, { label: "Once per turn", tone: "green" }, { label: "Face-up Extra", tone: "blue" }], motif: "scales" },
			"Pendulum Scales and monsters with chips for two Scales, between only, once per turn and face-up Extra.",
		),
	],
});
