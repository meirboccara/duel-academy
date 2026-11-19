import { effectMonster, facedown, lesson, normalMonster, slide, spell, trap, SRC } from "@/content/helpers";

const mirror = trap("Mirror Barrier", "normal", { text: "When an opponent's monster declares an attack: Negate the attack." });
const hold = trap("Lasting Snare", "continuous", { text: "Each turn, the first attacking monster loses 500 ATK." });
const seal = trap("Seal Counter", "counter", { text: "When a Spell/Trap Card is activated: Negate the activation, and if you do, destroy it." });
const strike = spell("Sudden Strike", "quick-play", { text: "Target 1 face-up monster; it gains 700 ATK until the end of this turn." });
const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const raider = effectMonster("Rival Raider", 4, 1800, 1000, { attribute: "DARK" });

export const trapCardsLesson = lesson({
	id: "trap-cards",
	chapterId: "spells-and-traps",
	title: "Trap Cards",
	description: "Learn how Traps are Set, when they wake up, and how Normal, Continuous and Counter Traps differ.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"what-is-a-trap",
			"What a Trap Card Does",
			"Trap Cards are purple cards that wait face-down. They spring a surprise during your opponent's turn, or yours, when the right moment arrives. They are about timing and bluffing.",
			{ template: "illustration", cards: [mirror, hold, seal], chips: [{ label: "Purple frame", tone: "purple" }, { label: "Set face-down", tone: "gold" }, { label: "Surprise timing", tone: "red" }] },
			"Three purple Trap Cards: Normal, Continuous and Counter, with chips Purple frame, Set face-down and Surprise timing.",
			"Unlike Spells, Traps can never be activated from the hand. They must be Set first.",
		),
		slide(
			"set-a-trap",
			"Setting a Trap Card",
			"To use a Trap, first Set it: place it face-down in a Spell and Trap Zone during your Main Phase. Your opponent sees a back-facing card and cannot know what it does.",
			{ template: "sequence", step: 1, of: 2, action: "Set the Trap face-down in a Spell and Trap Zone.", scene: { hand: [mirror, soldier], spellTraps: [facedown(mirror, "facedown-spelltrap"), null, null, null, null] }, motion: "hand-to-field" },
			"Step one of two: a Trap Card is placed face-down in a Spell and Trap Zone.",
		),
		slide(
			"trap-waits-a-turn",
			"A Trap Waits One Turn",
			"A Trap cannot be activated the turn it was Set. It becomes ready from the next turn, which can be your opponent's very next turn. After that it is ready every turn.",
			{ template: "comparison", headings: ["Turn it was Set", "Next turn onward"], before: { label: "Same turn", cards: [facedown(mirror, "facedown-spelltrap")], note: "Not ready yet", tone: "red" }, after: { label: "Later turns", cards: [mirror], note: "Ready to activate", tone: "green" }, arrowLabel: "A turn passes" },
			"Left: a face-down Trap the turn it was Set, not ready. Right: the same Trap on a later turn, ready to flip.",
			"Some Trap Cards have text that lets them activate the turn they were Set, but that is an exception printed on the card.",
		),
		slide(
			"normal-trap",
			"Normal Traps: One Surprise",
			"A Normal Trap flips face-up when you activate it, applies its effect, and is then sent to the Graveyard. It is a single-use surprise at Spell Speed 2.",
			{ template: "sequence", step: 2, of: 2, action: "The Trap resolves and goes to the Graveyard.", scene: { spellTraps: [null, null, null, null, null], graveyard: [mirror] }, motion: "field-to-graveyard" },
			"Step two of two: a resolved Normal Trap is sent from the Spell and Trap Zone to the Graveyard.",
		),
		slide(
			"continuous-trap",
			"Continuous Traps: Keep Working",
			"A Continuous Trap stays face-up after it is activated, and its effect keeps applying. Like a Continuous Spell, it remains until it is destroyed or its text removes it.",
			{ template: "duel-field", highlight: [{ zone: "st3" }], cards: [{ zone: "st3", card: hold }, { zone: "mm3", card: soldier }, { zone: "mm3", side: "opponent", card: raider }], callout: "A Continuous Trap stays face-up." },
			"The field with a face-up Continuous Trap in your third Spell and Trap Zone, your monster, and an opponent monster facing it.",
		),
		slide(
			"counter-trap",
			"Counter Traps: Spell Speed 3",
			"Counter Traps are the fastest cards in the game. Their purple frame has a counter icon. Only another Counter Trap can respond to one, and most of them negate something.",
			{ template: "illustration", cards: [seal], chips: [{ label: "Spell Speed 3", tone: "red" }, { label: "Only Counter Traps answer", tone: "purple" }] },
			"A Counter Trap with chips: Spell Speed 3, and only Counter Traps can answer.",
		),
		slide(
			"speed-ladder",
			"The Spell Speed Ladder",
			"Spell Speed 1 is slowest. Speed 2 is Quick-Play Spells, Normal Traps, Continuous Traps and many monster effects. Speed 3 is Counter Traps only. A card can answer equal or higher speeds.",
			{ template: "numeric", terms: [{ value: 3, label: "Counter Traps", tone: "red" }, { value: 2, label: "Traps, Quick-Play, Quick Effects", tone: "green" }, { value: 1, label: "Spells, Ignition, Trigger", tone: "blue" }], op: ">", footnote: "Higher speed can respond to lower or equal. Lower cannot respond to higher." },
			"A ladder reading 3 greater than 2 greater than 1: Spell Speed 3 for Counter Traps, 2 for Traps and Quick-Plays, 1 for Spells and basic effects.",
			"Speed 1 effects can only be activated when no chain is being built. Lesson 2.4 explores this in detail.",
		),
		slide(
			"trap-timeline",
			"A Trap in Action: Negating an Attack",
			"Your opponent declares an attack. You flip your Set Mirror Barrier in response. It resolves before the battle continues, negating the attack and sparing your monster.",
			{ template: "timeline", variant: "steps", items: [{ label: "Opponent attacks", sub: "Attack declared", tone: "red" }, { label: "You activate the Trap", sub: "Flip Mirror Barrier", tone: "purple" }, { label: "Trap resolves", sub: "Attack negated", tone: "green" }, { label: "Battle goes on", sub: "No damage dealt", tone: "gold" }], active: 1, cards: [mirror] },
			"Four steps: the opponent declares an attack, you activate your Trap, it resolves and negates the attack, and battle continues with no damage.",
		),
		slide(
			"trap-vs-quick-play",
			"Traps Versus Quick-Play Spells",
			"Both are Spell Speed 2 and both can be Set and used next turn. The big difference is that you can activate a Quick-Play Spell from your hand on your turn, but never a Trap.",
			{ template: "comparison", headings: ["Quick-Play Spell", "Trap Card"], before: { label: "Spell", cards: [strike], note: "Hand on your turn: yes", tone: "green" }, after: { label: "Trap", cards: [mirror], note: "From hand: never", tone: "purple" }, arrowLabel: "Both Speed 2" },
			"Left, a Quick-Play Spell that can be played from the hand on your turn. Right, a Trap that cannot be activated from the hand.",
		),
		slide(
			"bluffing-traps",
			"Bluff and Read Your Opponent",
			"A face-down card is a question mark. You can Set a Trap you never plan to use, and your opponent has to guess. Each Set card also uses one of your five zones.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "st1" }, { zone: "st2" }, { zone: "st3" }], cards: [{ zone: "st1", card: facedown(mirror, "facedown-spelltrap") }, { zone: "st2", card: facedown(seal, "facedown-spelltrap") }, { zone: "st3", card: facedown(strike, "facedown-spelltrap") }], callout: "Three face-down cards: which is a Trap?" },
			"Three face-down cards in your Spell and Trap Zones. One is a Trap, one a Counter Trap, one a Quick-Play Spell, and the opponent cannot tell which.",
			"A Set Quick-Play Spell looks identical to a Set Trap, so it makes a good bluff.",
		),
		slide(
			"trap-removal",
			"Traps Can Be Destroyed Face-Down",
			"A Set Trap is not safe. Cards that destroy Spell and Trap Cards can target it before it flips. Activating a Trap in time often means answering that threat.",
			{ template: "illustration", cards: [facedown(mirror, "facedown-spelltrap"), effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE", text: "Once per turn: You can destroy 1 Spell/Trap on the field." })], chips: [{ label: "Destroy effects", tone: "red" }, { label: "Flip in response", tone: "purple" }] },
			"A face-down Trap beside a monster that can destroy Spells and Traps, with chips: destroy effects and flip in response.",
		),
	],
});
