import {
	addModifier,
	ask,
	askUpTo,
	type CardDef,
	type CardInstance,
	delay,
	delayedDestruction,
	destroyCard,
	drawCards,
	type Duel,
	effectDestruction,
	type EffectRecord,
	FOREVER,
	fromOpponent,
	fromOtherCards,
	fromTraps,
	moveCard,
	moveCards,
	negateActivation,
	negateCardEffects,
	nextPhaseTurn,
	other,
	printedFacts,
	specialSummon,
	takeControl,
	targetsOf,
	untilEndOfNextTurnOf,
	watch,
} from "../../src";

/**
 * Made-up cards for the real-deck readiness slice (restrictions, protections, delayed effects, lingering operations). None is a real
 * card: every code starts with `fixture-`, and none is registered in CARD_SOURCES. Each writes its code in `log` when its effect is applied.
 */
export function readinessCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => {
		log.push(code);
		return duel;
	};
	const monstersOf = (duel: Duel, side: "you" | "rival") => duel.piles[side].monster;
	const allMonsters = (duel: Duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster];
	const isMonster = (duel: Duel, card: CardInstance) => duel.defs[card.code]?.kind === "monster";
	const cards: CardDef[] = [
		{ code: "fixture-vanilla", kind: "monster", facts: { name: "Fixture Vanilla", level: 4, atk: 1500, def: 1000, normal: true } },
		{ code: "fixture-big", kind: "monster", facts: { name: "Fixture Big", level: 4, atk: 2500, def: 2000, normal: true } },
		// A LIGHT Fairy and a DARK Fiend, each with a Quick Effect on the field.
		{ code: "fixture-light-quick", kind: "monster", facts: { name: "Fixture Light Quick", attribute: "LIGHT", monsterType: "Fairy", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "quick", operation: logs("fixture-light-quick") }] },
		{ code: "fixture-dark-quick", kind: "monster", facts: { name: "Fixture Dark Quick", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "quick", operation: logs("fixture-dark-quick") }] },
		// A monster with a Quick Effect in the hand.
		{ code: "fixture-hand-quick", kind: "monster", facts: { name: "Fixture Hand Quick", attribute: "DARK", monsterType: "Fiend", level: 1 }, effects: [{ type: "quick", range: "hand", operation: logs("fixture-hand-quick") }] },
		{ code: "fixture-plain-quick-play", kind: "quick-play", facts: { name: "Fixture Plain Quick-Play" }, effects: [{ type: "activation", operation: logs("fixture-plain-quick-play") }] },
		{ code: "fixture-plain-trap", kind: "trap", facts: { name: "Fixture Plain Trap" }, effects: [{ type: "activation", operation: logs("fixture-plain-trap") }] },

		// --- Restrictions ---
		// "For the rest of this turn, your opponent cannot activate monster effects."
		{
			code: "fixture-no-monster-effects",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: () => false, until: duel.turn.number, by: link, layer: { kind: "lock", what: "activate", who: other(link.player), stops: (_duel, attempt) => attempt.def.kind === "monster" } }) }],
		},
		// "For the rest of this Duel, neither player can activate cards or effects of "Fixture Plain Quick-Play"."
		{
			code: "fixture-name-ban",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: () => false, until: FOREVER, by: link, layer: { kind: "lock", what: "activate", who: "both", stops: (_duel, attempt) => attempt.def.facts?.name === "Fixture Plain Quick-Play" } }) }],
		},
		// A Continuous Spell: "Your opponent cannot activate the effects of LIGHT monsters." (while it is face-up on the field)
		{
			code: "fixture-no-light-effects",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: (_duel, source) => [{ kind: "lock", what: "activate", who: other(source.controller), stops: (_board, attempt) => attempt.def.kind === "monster" && attempt.def.facts?.attribute === "LIGHT" }] },
			],
		},
		// A Continuous Spell: "Neither player can activate the effects of Fiend monsters."
		{
			code: "fixture-no-fiend-effects",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: () => [{ kind: "lock", what: "activate", who: "both", stops: (_board, attempt) => attempt.def.kind === "monster" && attempt.def.facts?.monsterType === "Fiend" }] },
			],
		},
		// "Until the end of your next turn, neither player can activate the effects of Special Summoned monsters on the field."
		{
			code: "fixture-no-special-summoned-effects",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => addModifier(duel, { affects: () => false, until: untilEndOfNextTurnOf(duel, link.player), by: link, layer: { kind: "lock", what: "activate", who: "both", stops: (_duel, attempt) => attempt.card.zone === "monster" && attempt.card.specialSummoned } }),
				},
			],
		},
		// "Special Summon 1 monster from your hand."
		{
			code: "fixture-summon-from-hand",
			kind: "spell",
			effects: [{ type: "activation", operation: (duel, link) => { const id = duel.piles[link.player].hand.find((held) => isMonster(duel, duel.cards[held]!)); return id === undefined ? duel : specialSummon(duel, link.player, id); } }],
		},
		// "You cannot draw cards by card effects for the rest of this turn."
		{ code: "fixture-no-draw", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: () => false, until: duel.turn.number, by: link, layer: { kind: "lock", what: "draw", who: link.player } }) }] },
		// "Your opponent cannot draw cards by card effects for the rest of this turn." / "... cannot add cards from the Deck to the hand ..."
		{ code: "fixture-no-draw-for-opponent", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: () => false, until: duel.turn.number, by: link, layer: { kind: "lock", what: "draw", who: other(link.player) } }) }] },
		{ code: "fixture-no-add-for-opponent", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: () => false, until: duel.turn.number, by: link, layer: { kind: "lock", what: "add-to-hand", who: other(link.player) } }) }] },
		// A monster: "Your opponent cannot draw cards by card effects." (while it is face-up on the field)
		{ code: "fixture-no-draw-monster", kind: "monster", facts: { name: "Fixture No-Draw Monster", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", affects: () => false, modifies: (_duel, source) => [{ kind: "lock", what: "draw", who: other(source.controller) }] }] },
		// "Draw 1 card." (drawn by a card effect)
		{ code: "fixture-draw-one", kind: "quick-play", effects: [{ type: "activation", categories: ["draw"], operation: (duel, link) => drawCards(duel, link.player, 1) }] },
		// A Continuous Spell: "Cards in your GY cannot be banished."
		{
			code: "fixture-gy-guard",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: (_duel, source) => [{ kind: "lock", what: "banish-from-graveyard", who: source.controller }] },
			],
		},
		// "Banish all cards from both GYs."
		{ code: "fixture-gy-vacuum", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard], { zone: "banished", effect: link }) }] },
		// "This card cannot attack." / "This card cannot attack directly."
		{ code: "fixture-pacifist", kind: "monster", facts: { name: "Fixture Pacifist", level: 4, atk: 2000, def: 0 }, effects: [{ type: "continuous", modifies: (_duel, source) => [{ kind: "lock", what: "attack", who: source.controller, only: (_board, card) => card.id === source.id }] }] },
		{ code: "fixture-no-direct", kind: "monster", facts: { name: "Fixture No Direct", level: 4, atk: 2000, def: 0 }, effects: [{ type: "continuous", modifies: (_duel, source) => [{ kind: "lock", what: "attack-directly", who: source.controller, only: (_board, card) => card.id === source.id }] }] },
		// "Target 1 monster; it cannot attack until the end of your next turn."
		{
			code: "fixture-pin",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					target: allMonsters,
					operation: (duel, link) => {
						const target = targetsOf(duel, link)[0];
						if (!target) return duel;
						const { id, moves } = target;
						return addModifier(duel, { affects: { card: id, moves }, until: untilEndOfNextTurnOf(duel, link.player), by: link, layer: { kind: "lock", what: "attack", who: "both", only: (_board, card) => card.id === id && card.moves === moves } });
					},
				},
			],
		},

		// --- Protections ---
		// "Cannot be targeted by your opponent's card effects."
		{ code: "fixture-untargetable", kind: "monster", facts: { name: "Fixture Untargetable", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "target", from: fromOpponent }] }] },
		// "Cannot be destroyed by card effects." / "Cannot be destroyed by battle."
		{ code: "fixture-effect-proof", kind: "monster", facts: { name: "Fixture Effect-Proof", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effect-destruction" }] }] },
		{ code: "fixture-battle-proof", kind: "monster", facts: { name: "Fixture Battle-Proof", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "battle-destruction" }] }] },
		// "Unaffected by Trap effects." / "Unaffected by other cards' effects."
		{ code: "fixture-trap-immune", kind: "monster", facts: { name: "Fixture Trap-Immune", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromTraps }] }, { type: "quick", operation: logs("fixture-trap-immune") }] },
		{ code: "fixture-immune", kind: "monster", facts: { name: "Fixture Immune", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromOtherCards }] }, { type: "quick", operation: logs("fixture-immune") }] },
		// The same monster whose Quick Effect costs banishing itself (it is no longer on the field when the chain resolves).
		{
			code: "fixture-immune-leaver",
			kind: "monster",
			facts: { name: "Fixture Immune Leaver", level: 4, atk: 1000, def: 1000 },
			effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromOtherCards }] }, { type: "quick", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }), operation: logs("fixture-immune-leaver") }],
		},
		// A Continuous Spell: "Cards in your GY are unaffected by your opponent's card effects."
		{
			code: "fixture-gy-immune",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: (_duel, target, source) => target.zone === "graveyard" && target.owner === source.controller, modifies: () => [{ kind: "protect", against: "effects", from: fromOpponent }] },
			],
		},
		// "Banish 1 card from your opponent's GY; ..." (the banishment is the cost)
		{ code: "fixture-banish-cost", kind: "quick-play", effects: [{ type: "activation", cost: { pick: (duel, { player }) => duel.piles[other(player)].graveyard.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "banished" }) }, operation: logs("fixture-banish-cost") }] },
		// A Field Spell: "The first time each monster you control would be destroyed each turn, by battle or card effect, it is not destroyed."
		{
			code: "fixture-first-time-field",
			kind: "spell",
			facts: { icon: "field" },
			effects: [
				{ type: "activation", operation: (duel) => duel },
				{ type: "continuous", affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller, modifies: () => [{ kind: "protect", against: ["effect-destruction", "battle-destruction"], firstEachTurn: true }] },
			],
		},
		// "Other monsters you control cannot be destroyed by card effects." / the same, "the first time each turn" / "... are unaffected by your opponent's card effects."
		...([["fixture-guardian", { kind: "protect", against: "effect-destruction" }], ["fixture-first-guardian", { kind: "protect", against: "effect-destruction", firstEachTurn: true }], ["fixture-aegis", { kind: "protect", against: "effects", from: fromOpponent }]] as const).map(([code, layer]): CardDef => ({
			code,
			kind: "monster",
			facts: { name: code, level: 4, atk: 1000, def: 1000 },
			effects: [{ type: "continuous", affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller && target.id !== source.id, modifies: () => [layer] }],
		})),
		// Effects aimed at monsters: destroy (targeting), destroy all (not targeting), banish, negate, take control; as a Quick-Play Spell or a Trap.
		{ code: "fixture-aimed-destroy", kind: "quick-play", effects: [{ type: "activation", target: allMonsters, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => destroyCard(board, card.id, { destruction: effectDestruction(link) }), duel) }] },
		{ code: "fixture-aimed-destroy-trap", kind: "trap", effects: [{ type: "activation", target: allMonsters, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => destroyCard(board, card.id, { destruction: effectDestruction(link) }), duel) }] },
		{ code: "fixture-destroy-all", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => allMonsters(duel).reduce((board, id) => destroyCard(board, id, { destruction: effectDestruction(link) }), duel) }] },
		{ code: "fixture-banish-all", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, allMonsters(duel), { zone: "banished", effect: link }) }] },
		{ code: "fixture-send-all", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, allMonsters(duel), { zone: "graveyard", effect: link }) }] },
		{ code: "fixture-negate-aimed", kind: "quick-play", effects: [{ type: "activation", target: (duel) => allMonsters(duel).filter((id) => duel.cards[id]!.face === "up"), operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => negateCardEffects(board, card.id, board.turn.number, link), duel) }] },
		{ code: "fixture-steal", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => monstersOf(duel, other(player)), operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => takeControl(board, card.id, link.player, board.turn.number, link), duel) }] },
		// "All monsters gain 1000 ATK until the end of this turn."
		{ code: "fixture-boost-all", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: (_board, target) => target.zone === "monster", until: duel.turn.number, by: link, layer: { kind: "add", stat: "atk", by: 1000 } }) }] },
		// A Counter Trap: "When a monster effect is activated: negate the activation, and if you do, destroy that card."
		{
			code: "fixture-counter",
			kind: "counter-trap",
			effects: [{ type: "activation", condition: (duel) => { const top = duel.chain[duel.chain.length - 1]; return top !== undefined && duel.defs[top.card.code]?.kind === "monster"; }, operation: (duel, _link, index) => (log.push("fixture-counter"), negateActivation(duel, index - 1)) }],
		},
		// "Tribute 1 monster; ..." (a cost) and "send 1 monster you control to the GY" as a cost.
		{ code: "fixture-tribute-cost", kind: "quick-play", effects: [{ type: "activation", cost: { pick: (duel, { player }) => monstersOf(duel, player).map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard", reason: "tributed" }) }, operation: logs("fixture-tribute-cost") }] },

		// --- Delayed effects ---
		// "Target 1 monster; destroy it during the End Phase of this turn." (not an activation then; tied to that card)
		{
			code: "fixture-doom",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					target: allMonsters,
					operation: (duel, link) => {
						const target = targetsOf(duel, link)[0];
						if (!target) return duel;
						return delay(duel, link, { due: { phase: "end", turn: duel.turn.number }, card: target, mandatory: true, apply: (board, self) => (log.push(`fixture-doom destroys ${target.code}`), destroyCard(board, target.id, { destruction: delayedDestruction(self) })) });
					},
				},
			],
		},
		// "Target 1 monster; banish it, then Special Summon it to its owner's field." (it comes back as a new card)
		{
			code: "fixture-blink",
			kind: "quick-play",
			effects: [{ type: "activation", target: allMonsters, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => specialSummon(moveCard(board, card.id, { zone: "banished", effect: link }), card.owner, card.id), duel) }],
		},
		// "During the End Phase of this turn, send 1 card from your hand to the GY." (mandatory, with a choice)
		{
			code: "fixture-end-discard",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					operation: (duel, link) =>
						delay(duel, link, { due: { phase: "end", turn: duel.turn.number }, mandatory: true, apply: (board, self) => askUpTo(board, self.player, board.piles[self.player].hand, { min: 1, max: 1 }, (next, picked) => (log.push(`fixture-end-discard discards ${picked.map((id) => next.cards[id]!.code).join(",")}`), moveCards(next, picked, { zone: "graveyard" }))) }),
				},
			],
		},
		// "During the End Phase of this turn, you can draw 1 card." (optional)
		{ code: "fixture-end-draw", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => delay(duel, link, { due: { phase: "end", turn: duel.turn.number }, mandatory: false, apply: (board, self) => (log.push("fixture-end-draw"), drawCards(board, self.player, 1)) }) }] },
		// "During your opponent's next End Phase, gain nothing but a line in the log." / "At the start of the next Standby Phase, ..."
		{ code: "fixture-rival-end", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => delay(duel, link, { due: { phase: "end", turn: nextPhaseTurn(duel, "end", other(link.player)) }, mandatory: true, apply: (board) => (log.push(`fixture-rival-end on turn ${board.turn.number}`), board) }) }] },
		{ code: "fixture-next-standby", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => delay(duel, link, { due: { phase: "standby", turn: nextPhaseTurn(duel, "standby") }, mandatory: true, apply: (board) => (log.push(`fixture-next-standby on turn ${board.turn.number}`), board) }) }] },
		// A mandatory "during the End Phase" Trigger Effect, for the ordering tests.
		{ code: "fixture-end-trigger", kind: "monster", facts: { name: "Fixture End Trigger", level: 4, atk: 0, def: 0 }, effects: [{ type: "trigger", mandatory: true, event: (duel, event, { card }) => event.type === "phase" && event.phase === "end" && duel.turn.player === card.controller, operation: logs("fixture-end-trigger") }] },

		// --- Lingering operations that are not activations ---
		// "For the rest of this turn, each time your opponent Special Summons a monster(s), immediately draw 1 card."
		{
			code: "fixture-summon-watch",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => watch(duel, link, { until: duel.turn.number, event: (_board, event, self) => event.type === "summoned" && event.how === "special" && (event.player ?? event.card.controller) === other(self.player), apply: (board, self) => (log.push("fixture-summon-watch draws"), drawCards(board, self.player, 1)) }),
				},
			],
		},
		// "Special Summon 1 monster from your Deck" (as a Quick-Play Spell), and "Special Summon up to 2 monsters from your hand" (at the same time).
		{ code: "fixture-summon-from-deck", kind: "quick-play", effects: [{ type: "activation", categories: ["summon-from-deck"], operation: (duel, link) => { const id = duel.piles[link.player].deck.find((held) => isMonster(duel, duel.cards[held]!)); return id === undefined ? duel : specialSummon(duel, link.player, id); } }] },
		// "Send 1 card from your hand to the GY, then draw 1 card." (the card is chosen when it resolves)
		{ code: "fixture-discard-then-draw", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].hand, (board, picked) => drawCards(moveCard(board, picked, { zone: "graveyard" }), link.player, 1)) }] },
		// Writes the size of the rival's hand when it resolves.
		{ code: "fixture-count-hand", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => (log.push(`rival hand ${duel.piles.rival.hand.length}`), duel) }] },
	];
	void printedFacts;
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}
