import { activationNegated, type CardDef, type EffectRecord, moveCard, moveCards, negateActivation, negateEffect, raiseEvent } from "../../src";

/**
 * Made-up cards for the step 5 tests (negation). Each writes its code in `log` when its effect is applied.
 */
export function negationCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => {
		log.push(code);
		return duel;
	};
	const cards: CardDef[] = [
		{ code: "monster", kind: "monster" },
		// "When a monster is Summoned": a mandatory trigger.
		{ code: "summon-watcher", kind: "monster", effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "summoned", operation: logs("summon-watcher") }] },
		// "Special Summon 1 monster from your hand": a Summon performed by an effect.
		{
			code: "summon-spell",
			kind: "spell",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
						const id = duel.piles[link.player].hand.find((held) => duel.defs[duel.cards[held]!.code]?.kind === "monster");
						if (id === undefined) return duel;
						const moved = moveCard(duel, id, { zone: "monster", face: "up" });
						return raiseEvent(moved, { type: "summoned", card: moved.cards[id]!, how: "special" });
					},
				},
			],
		},
		// A Spell whose activation cannot be negated.
		{ code: "sturdy", kind: "spell", effects: [{ type: "activation", activationCannotBeNegated: true, operation: logs("sturdy") }] },
		// A Spell whose activation cannot be negated while its controller controls a monster.
		{ code: "conditional-activation", kind: "spell", effects: [{ type: "activation", activationCannotBeNegated: (duel, link) => duel.piles[link.player].monster.length > 0, operation: logs("conditional-activation") }] },
		// A Spell whose effect cannot be negated.
		{ code: "sturdy-effect", kind: "spell", effects: [{ type: "activation", effectCannotBeNegated: true, operation: logs("sturdy-effect") }] },
		{ code: "plain-spell", kind: "spell", effects: [{ type: "activation", operation: logs("plain-spell") }] },
		// A Spell whose effect cannot be negated while its controller has a monster (the printed condition of the Q&A's card).
		{ code: "conditional", kind: "spell", effects: [{ type: "activation", effectCannotBeNegated: (duel, link) => duel.piles[link.player].monster.length > 0, operation: logs("conditional") }] },
		// A Counter Trap that sends its controller's monsters to the Graveyard.
		{
			code: "purge",
			kind: "counter-trap",
			effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, link) => (log.push("purge"), moveCards(duel, duel.piles[link.player].monster, { zone: "graveyard" })) }],
		},
		// A monster with an Ignition Effect; the second copy has a cost (banishes itself), the first none; the third says "then you cannot Special Summon".
		{ code: "ignition", kind: "monster", effects: [{ type: "ignition", operation: logs("ignition") }] },
		// "When a card is sent from the field to the GY": see below. A monster that never has its effect negated by its own cost.
		// An Ignition Effect in two parts: "search ...", then "after activating this effect, you cannot ...".
		{ code: "bell", kind: "monster", effects: [{ type: "ignition", operation: (duel) => (log.push("bell-search", "bell-restriction"), duel) }] },
		// "Turn your monsters face-down, then face-up": each becomes a new card.
		{
			code: "reset",
			kind: "spell",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
						const mine = duel.piles[link.player].monster;
						return mine.reduce((next, id) => moveCard(moveCard(next, id, { zone: "monster", face: "down" }), id, { zone: "monster", face: "up" }), duel);
					},
				},
			],
		},
		{ code: "spell-b", kind: "spell", effects: [{ type: "activation", operation: logs("spell-b") }] },
		// "When a monster would be Summoned: You can ...": answers the Summon and negates nothing.
		{ code: "summon-dud", kind: "counter-trap", effects: [{ type: "activation", answersSummon: true, condition: (duel) => duel.chain.length === 0 && duel.summoning !== null, operation: logs("summon-dud") }] },
		// A Quick Effect that has nothing to do with the Summon.
		{ code: "bystander", kind: "monster", effects: [{ type: "quick", operation: logs("bystander") }] },
		// "If you control no monsters, you can Special Summon this card (from your hand)": a built-in Special Summon.
		{ code: "cyber", kind: "monster", facts: { level: 5 }, builtInSummon: { how: "special", condition: (duel, { player }) => duel.piles[player].monster.length === 0 } },
		// An Ignition Effect used once per turn by name, from the field.
		{ code: "ignition-once", kind: "monster", effects: [{ type: "ignition", once: { scope: "name" }, operation: logs("ignition-once") }] },
		// Obelisk's printed "This card's Normal Summon cannot be negated", on a Level 4 monster.
		{ code: "unstoppable", kind: "monster", facts: { level: 4 }, summon: { cannotBeNegated: ["normal"] } },
		{ code: "normal-4", kind: "monster", facts: { level: 4, normal: true } },
		{ code: "effect-b", kind: "monster", facts: { effect: true } },
		// "Sweep: send all monsters to the GY."
		{ code: "dust", kind: "spell", effects: [{ type: "activation", operation: (duel) => moveCards(duel, [...duel.piles.you.monster, ...duel.piles.rival.monster], { zone: "graveyard" }) }] },
		// "When this card is sent to the GY: ..." (Critter): a mandatory trigger activated in the Graveyard.
		{
			code: "critter",
			kind: "monster",
			effects: [{ type: "trigger", range: "graveyard", mandatory: true, event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.after.zone === "graveyard", operation: logs("critter") }],
		},
		// An Ignition Effect that cannot be negated while its controller controls another monster.
		{ code: "immune-monster", kind: "monster", effects: [{ type: "ignition", effectCannotBeNegated: (duel, link) => duel.piles[link.player].monster.length > 1, operation: logs("immune-monster") }] },
		// A monster whose hand Quick Effect discards itself as the cost.
		{ code: "hand-monster", kind: "monster", effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: logs("hand-monster") }] },
		// A monster whose hand Quick Effect has no cost: the card stays in the hand while its effect is on the chain.
		{ code: "hand-keeper", kind: "monster", effects: [{ type: "quick", range: "hand", operation: logs("hand-keeper") }] },
		// A Continuous Spell on the field with an Ignition Effect.
		{ code: "lamp", kind: "spell", effects: [{ type: "ignition", operation: logs("lamp") }] },
		// "You can banish this card; ... You can only use this effect of [name] once per turn.": the cost is banishing itself.
		{ code: "blazer", kind: "monster", effects: [{ type: "ignition", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }), once: { scope: "name" }, operation: logs("blazer") }] },
		// "When a monster is sent from the field to the GY": a mandatory trigger.
		{
			code: "monster-watcher",
			kind: "monster",
			effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "moved" && event.before.zone === "monster" && event.after.zone === "graveyard", operation: logs("monster-watcher") }],
		},
		// "When a card is sent from the field to the GY": a mandatory trigger.
		{
			code: "field-watcher",
			kind: "monster",
			effects: [{ type: "trigger", mandatory: true, event: (duel, event) => event.type === "moved" && event.after.zone === "graveyard" && event.before.zone === "spell" && duel.defs[event.before.code]?.kind === "spell" && event.negated !== true, operation: logs("field-watcher") }],
		},
		// "When a Spell/Trap Card is activated: negate the activation, and if you do, log a destruction."
		{
			code: "jammer",
			kind: "counter-trap",
			effects: [
				{
					type: "activation",
					condition: (duel) => duel.chain.length > 0,
					operation: (duel, link) => {
						const next = negateActivation(duel, link.answers!);
						if (activationNegated(next, link.answers!)) log.push("destroyed");
						log.push("jammer");
						return next;
					},
				},
			],
		},
		// "When a card or effect is activated: negate the effect."
		{
			code: "effect-jammer",
			kind: "counter-trap",
			effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, link) => (log.push("effect-jammer"), negateEffect(duel, link.answers!)) }],
		},
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}
