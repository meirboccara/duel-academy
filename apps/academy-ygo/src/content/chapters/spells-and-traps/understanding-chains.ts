import { effectMonster, facedown, lesson, normalMonster, slide, spell, trap, SRC } from "@/content/helpers";

const combine = spell("Combine Spell", "normal", { text: "Fusion Summon 1 Fusion Monster." });
const strike = spell("Sudden Strike", "quick-play", { text: "Target 1 face-up monster; it gains 700 ATK until the end of this turn." });
const mirror = trap("Mirror Barrier", "normal", { text: "When an opponent's monster declares an attack: Negate the attack." });
const seal = trap("Seal Counter", "counter", { text: "When a Spell/Trap Card is activated: Negate the activation, and if you do, destroy it." });
const hold = trap("Lasting Snare", "continuous", { text: "Continuous Trap." });
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE", text: "Once per turn: You can destroy 1 Spell/Trap." });
const guard = effectMonster("Swift Guard", 4, 1200, 1800, { attribute: "LIGHT", text: "Quick Effect: Negate the activation of a monster effect." });
const scout = effectMonster("Hand Scout", 3, 1000, 1000, { attribute: "WIND", text: "When this card is Normal Summoned: Add 1 Level 3 monster from your Deck to your hand." });
const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const rival = effectMonster("Rival Raider", 4, 1800, 1000);

export const understandingChainsLesson = lesson({
	id: "understanding-chains",
	chapterId: "spells-and-traps",
	title: "Understanding Chains",
	description: "See how effects stack into a chain, how Spell Speeds decide what can answer what, and why chains always resolve from the last link back to the first.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"what-is-a-chain",
			"A Chain Is a Stack of Effects",
			"When one card answers another, they form a chain. Each new answer is a higher link. Nothing resolves until both players agree that no one is adding another link.",
			{ template: "illustration", cards: [combine, strike, seal], chips: [{ label: "Link 1 starts", tone: "blue" }, { label: "Link 2 answers", tone: "green" }, { label: "Link 3 answers", tone: "red" }] },
			"Three cards representing three chain links: a Normal Spell, a Quick-Play Spell, and a Counter Trap.",
			"Think of a chain like a stack of plates: the last plate you put on is the first one you take off.",
		),
		slide(
			"chain-link-one",
			"Link 1: Someone Starts It",
			"Any effect that can be activated while the game is idle can start a chain as Link 1. Spell Speed 1 effects usually start chains. They cannot be used as answers.",
			{ template: "timeline", variant: "chain-build", items: [{ label: "Link 1", sub: "Combine Spell activated", tone: "blue" }], active: 0, cards: [{ ...combine, order: 1 }] },
			"A chain-build timeline showing only Link 1: Combine Spell activated.",
		),
		slide(
			"chain-link-two",
			"Link 2: An Answer Is Added",
			"Your opponent can respond with a Spell Speed 2 or higher effect. That answer becomes Link 2. The original card is still waiting; it has not resolved yet.",
			{ template: "timeline", variant: "chain-build", items: [{ label: "Link 1", sub: "Combine Spell", tone: "blue" }, { label: "Link 2", sub: "Sudden Strike answers", tone: "green" }], active: 1, cards: [{ ...combine, order: 1 }, { ...strike, order: 2 }] },
			"Chain-build timeline with Link 1 Combine Spell and Link 2 Sudden Strike answering it.",
		),
		slide(
			"chain-link-three",
			"Link 3: Counter Traps Can Climb Higher",
			"Only Spell Speed 3 can answer a Counter Trap, and Counter Traps themselves can answer Spell Speed 2. Seal Counter becomes Link 3 and threatens to stop the Spell.",
			{ template: "timeline", variant: "chain-build", items: [{ label: "Link 1", sub: "Combine Spell", tone: "blue" }, { label: "Link 2", sub: "Sudden Strike", tone: "green" }, { label: "Link 3", sub: "Seal Counter", tone: "red" }], active: 2, cards: [{ ...combine, order: 1 }, { ...strike, order: 2 }, { ...seal, order: 3 }] },
			"Chain-build timeline with three links: Combine Spell, Sudden Strike, and Seal Counter as Link 3.",
		),
		slide(
			"both-pass",
			"Both Players Pass: Building Ends",
			"After each new link, players get a chance to answer. When both players pass in a row, the chain is complete. Then it resolves from the highest link down to Link 1.",
			{ template: "timeline", variant: "chain-build", items: [{ label: "Link 1", sub: "Combine Spell", tone: "blue" }, { label: "Link 2", sub: "Sudden Strike", tone: "green" }, { label: "Link 3", sub: "Seal Counter", tone: "red" }, { label: "Both pass", sub: "Chain is locked", tone: "gold" }], active: 3, cards: [{ ...combine, order: 1 }, { ...strike, order: 2 }, { ...seal, order: 3 }] },
			"Chain-build timeline ending with both players passing, locking a three-link chain.",
		),
		slide(
			"resolve-link-three",
			"Resolve Last First: Link 3",
			"Resolution always starts at the last link. Seal Counter resolves first: it negates the activation of Sudden Strike and destroys that Spell before Sudden Strike ever applies.",
			{ template: "timeline", variant: "chain-resolve", items: [{ label: "Link 3 resolves", sub: "Seal Counter: negate Sudden Strike", tone: "red" }, { label: "Link 2", sub: "Waiting", tone: "green" }, { label: "Link 1", sub: "Waiting", tone: "blue" }], active: 0, cards: [{ ...seal, order: 3 }, { ...strike, order: 2 }, { ...combine, order: 1 }] },
			"Chain-resolve timeline highlighting Link 3: Seal Counter negates Sudden Strike.",
		),
		slide(
			"resolve-link-two",
			"Link 2 Fails Because It Was Negated",
			"Because Seal Counter negated the activation of Sudden Strike, Link 2 does nothing when its turn comes. The card never applies its ATK boost.",
			{ template: "timeline", variant: "chain-resolve", items: [{ label: "Link 3 done", sub: "Negated Link 2", tone: "red" }, { label: "Link 2", sub: "Does not apply", tone: "green" }, { label: "Link 1", sub: "Still waiting", tone: "blue" }], active: 1, cards: [{ ...seal, order: 3 }, { ...strike, order: 2, ghost: true }, { ...combine, order: 1 }] },
			"Chain-resolve timeline with Link 2 marked as not applying because its activation was negated.",
		),
		slide(
			"resolve-link-one",
			"Link 1 Finally Resolves",
			"Combine Spell was never negated, so when Link 1 resolves it still happens. The Fusion Summon goes through even though the middle of the chain failed.",
			{ template: "timeline", variant: "chain-resolve", items: [{ label: "Link 3 done", tone: "red" }, { label: "Link 2 skipped", tone: "green" }, { label: "Link 1 resolves", sub: "Combine Spell Fusion Summons", tone: "blue" }], active: 2, cards: [{ ...combine, order: 1 }] },
			"Chain-resolve timeline highlighting Link 1 resolving successfully after Link 2 was skipped.",
			"Negating one link does not automatically cancel the whole chain. Each link is checked on its own.",
		),
		slide(
			"spell-speed-overview",
			"Spell Speeds Decide Who Can Answer",
			"Spell Speed 1 starts chains. Spell Speed 2 answers Speed 1 or 2. Spell Speed 3 answers anything and can only be answered by another Speed 3. Memorise this ladder.",
			{ template: "numeric", terms: [{ value: 1, label: "Spells, Ignition, Trigger", tone: "blue" }, { value: 2, label: "Quick-Play, Traps, Quick Effects", tone: "green" }, { value: 3, label: "Counter Traps only", tone: "red" }], op: "<", footnote: "A card may answer equal or higher speed only. Speed 1 never answers." },
			"Numeric comparison of Spell Speeds 1, 2 and 3 with what belongs in each group.",
		),
		slide(
			"speed-one-cannot-answer",
			"Spell Speed 1 Cannot Respond",
			"A Normal Spell, Continuous Spell activation, Ignition Effect or Trigger Effect cannot be used as an answer in a chain. They only start a fresh chain when nothing else is pending.",
			{ template: "comparison", headings: ["Can start a chain", "Cannot answer"], before: { label: "Speed 1 starts", cards: [combine, caster], note: "Only when no chain is open", tone: "blue" }, after: { label: "Speed 2+ answer", cards: [strike, mirror, seal], note: "These can respond", tone: "green" }, arrowLabel: "Different roles" },
			"Left: Spell Speed 1 cards that start chains. Right: Spell Speed 2 and 3 cards that can answer.",
		),
		slide(
			"speed-two-answers",
			"Spell Speed 2 Is the Everyday Answer",
			"Quick-Play Spells, Normal and Continuous Traps, and Quick Effects are Spell Speed 2. They answer Speeds 1 and 2, and they form most of the mid-chain action you will see.",
			{ template: "illustration", cards: [strike, mirror, hold, guard], chips: [{ label: "Quick-Play", tone: "green" }, { label: "Normal Trap", tone: "purple" }, { label: "Continuous Trap", tone: "purple" }, { label: "Quick Effect", tone: "gold" }] },
			"Four Spell Speed 2 cards: a Quick-Play Spell, a Normal Trap, a Continuous Trap and a Quick Effect monster.",
		),
		slide(
			"speed-three-counters",
			"Spell Speed 3: Counter Traps Only",
			"Counter Traps sit alone at Spell Speed 3. They can answer anything, and the only legal response to a Counter Trap is another Counter Trap. That makes them the final word in many chains.",
			{ template: "illustration", cards: [seal], chips: [{ label: "Answers anything", tone: "red" }, { label: "Only answered by Counter", tone: "purple" }] },
			"A Counter Trap with chips: answers anything, and only another Counter Trap can answer it.",
		),
		slide(
			"negate-activation",
			"Negate the Activation",
			"Negating the activation means that chain link never successfully activates. The card usually does not apply, and many Counter Traps also destroy that card. The rest of the chain continues.",
			{ template: "sequence", step: 1, of: 2, action: "Seal Counter negates the activation of Sudden Strike and destroys it.", scene: { spellTraps: [seal, null, null, null, null], graveyard: [strike] }, motion: "field-to-graveyard" },
			"Seal Counter on the field while Sudden Strike is sent to the Graveyard after its activation is negated.",
		),
		slide(
			"negate-effect",
			"Negate the Effect",
			"Negating the effect leaves the card where it is, but voids what that effect would do when it resolves. The activation still happened; only the result is cancelled.",
			{ template: "comparison", headings: ["Negate activation", "Negate effect"], before: { label: "Activation stopped", cards: [seal, strike], note: "Card usually destroyed", tone: "red" }, after: { label: "Effect voided", cards: [guard, caster], note: "Card stays; result cancelled", tone: "green" }, arrowLabel: "Two kinds" },
			"Left: negate activation with a Counter Trap destroying a Spell. Right: negate effect with a Quick Effect monster, leaving the other card in place.",
		),
		slide(
			"fast-effect-timing",
			"Who Gets to Answer First",
			"After an action, the turn player usually has the first chance to activate a fast effect. Then the opponent may answer. Players keep alternating until both pass.",
			{ template: "timeline", variant: "steps", items: [{ label: "Action happens", sub: "Summon or activation", tone: "gold" }, { label: "Turn player", sub: "First chance to respond", tone: "blue" }, { label: "Opponent", sub: "May answer", tone: "red" }, { label: "Both pass", sub: "Resolve the chain", tone: "green" }], active: 1 },
			"Four timing steps: an action happens, the turn player may respond, the opponent may answer, then both pass and the chain resolves.",
			"This is the Fast Effect Timing chart in beginner form. Tournament play uses the full official chart.",
		),
		slide(
			"simultaneous-triggers",
			"Two Triggers at Once",
			"If two Trigger Effects meet their condition at the same time, the turn player's mandatory effects go first as a group, then the opponent's. Optional effects follow the same turn-player-first order.",
			{ template: "timeline", variant: "chain-build", items: [{ label: "Event", sub: "Both monsters summoned", tone: "gold" }, { label: "Turn player Trigger", sub: "Link 1", tone: "blue" }, { label: "Opponent Trigger", sub: "Link 2", tone: "red" }], active: 1, cards: [{ ...scout, order: 1 }, { ...rival, order: 2 }] },
			"Chain-build timeline where two Trigger Effects meet the same event and the turn player's Trigger becomes Link 1.",
		),
		slide(
			"chain-on-field",
			"A Chain Across the Duel Field",
			"You activate Flame Caster. Your opponent flips Mirror Barrier in response. You then flip Seal Counter. The field shows three cards waiting for reverse resolution.",
			{ template: "duel-field", highlight: [{ zone: "mm2" }, { zone: "st2", side: "opponent" }, { zone: "st1" }], cards: [{ zone: "mm2", card: { ...caster, order: 1 } }, { zone: "st2", side: "opponent", card: { ...mirror, order: 2 } }, { zone: "st1", card: { ...seal, order: 3 } }, { zone: "mm3", side: "opponent", card: rival }], callout: "Resolve 3, then 2, then 1." },
			"Duel field with three chain links marked by order numbers on Flame Caster, Mirror Barrier and Seal Counter.",
		),
		slide(
			"missing-the-timing",
			"Optional Triggers Can Miss Timing",
			"An optional Trigger that says When can miss its chance if something else happened after its event before it could activate. Triggers that say If do not miss that way.",
			{ template: "comparison", headings: ["When (optional)", "If (optional)"], before: { label: "When", cards: [scout], note: "Can miss if not the last thing", tone: "red" }, after: { label: "If", cards: [effectMonster("Steady Scout", 3, 900, 900, { text: "If this card is Summoned: You can draw 1 card." })], note: "Still activates later in the window", tone: "green" }, arrowLabel: "Wording matters" },
			"Comparison of optional When wording that can miss timing versus optional If wording that does not.",
			"Beginners only need the idea: read When versus If carefully. Full SEGOC details come later.",
		),
		slide(
			"chain-block-summary",
			"Build Forward, Resolve Backward",
			"Remember the two motions: build upward with answers, then resolve downward from the last link. Speeds gate who may speak. Negation can stop one link without erasing the others.",
			{ template: "illustration", cards: [{ ...combine, order: 1 }, { ...strike, order: 2 }, { ...seal, order: 3 }], chips: [{ label: "Build: 1 then 2 then 3", tone: "gold" }, { label: "Resolve: 3 then 2 then 1", tone: "green" }] },
			"Three ordered chain-link cards with chips: build 1-2-3, resolve 3-2-1.",
		),
		slide(
			"practice-chain",
			"Practice: Attack, Trap, Counter",
			"Rival Raider attacks Bronze Soldier. You activate Mirror Barrier as Link 1. Opponent has no Counter Trap. Both pass. Mirror Barrier resolves and the attack is negated.",
			{ template: "sequence", step: 2, of: 2, action: "Mirror Barrier resolves: the attack is negated.", scene: { monsters: [soldier, null, null, null, null], spellTraps: [mirror, null, null, null, null], lifePoints: [8000, 8000] }, motion: "flip" },
			"Bronze Soldier safe on the field with Mirror Barrier face-up after resolving and negating an attack. Life Points unchanged at 8000 each.",
			"If the opponent had Seal Counter, it would become Link 2, resolve first, and Mirror Barrier would never negate the attack.",
		),
	],
});
