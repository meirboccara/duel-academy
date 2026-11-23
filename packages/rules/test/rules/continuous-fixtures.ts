import { addModifier, moveCard, type CardDef, type Duel, type EffectRecord, type Layer, other, targetsOf } from "../../src";
import { play } from "./fixtures";

/** Passes until the first phase of turn number `turn` (the game state open). */
export function nextTurn(duel: Duel, turn: number): Duel {
	let next = duel;
	for (let guard = 0; guard < 60 && next.turn.number < turn; guard++) next = play(next, "pass");
	return next;
}

/** Made-up cards for the step 6 tests (continuous effects, ATK order, locks). They are not registered in CARD_SOURCES. */
export function continuousCards(log: string[] = []): Record<string, CardDef> {
	/** A Quick-Play Spell that targets a face-up monster and leaves `layer` on it until the end of this turn. */
	const lasting = (code: string, layer: Layer): CardDef => ({
		code,
		kind: "quick-play",
		effects: [
			{
				type: "activation",
				target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up"),
				operation: (duel, link) => {
					const target = targetsOf(duel, link)[0];
					return target ? addModifier(duel, { affects: { card: target.id, moves: target.moves }, until: duel.turn.number, layer }) : duel;
				},
			} satisfies EffectRecord,
		],
	});
	const cards: CardDef[] = [
		// "Loses 800 ATK until the end of the turn", and "its ATK becomes 0 until the end of the turn".
		lasting("drain", { kind: "add", stat: "atk", by: -800 }),
		lasting("zero", { kind: "set", stat: "atk", to: 0 }),
		// An ignition effect that writes in `log` when it is applied.
		{ code: "ping", kind: "monster", effects: [{ type: "ignition", operation: (duel) => (log.push("ping"), duel) }] },
		// An ignition effect whose cost sends the monster to the Graveyard: it is no longer in the Monster Zone when the effect resolves.
		{ code: "cost-ping", kind: "monster", effects: [{ type: "ignition", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: (duel) => (log.push("cost-ping"), duel) }] },
		// A monster with a Continuous Effect "gains 500 ATK": another code than Muka Muka, so a test can tell the two apart.
		{ code: "muka-muka-rival", kind: "monster", facts: { level: 2, atk: 600, def: 300 }, effects: [{ type: "continuous", range: "field", operation: (duel) => duel, modifies: () => [{ kind: "add", stat: "atk", by: 500 }] }] },
		// Hand monsters with a Quick Effect that discards the card: two that do nothing, and one that adds the top card of its controller's Deck to the hand.
		...["filler", "filler-b"].map((code): CardDef => ({ code, kind: "monster", effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: (duel) => duel }] })),
		{
			code: "quick-search",
			kind: "monster",
			effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), categories: ["search"], operation: (duel, link) => moveCard(duel, duel.piles[link.player].deck[0]!, { zone: "hand" }) }],
		},
		{ code: "blank", kind: "monster", facts: { level: 4, atk: 0, def: 0 } },
		// Continuous Spells that reach the "blank" monsters of their controller.
		{
			code: "set-spell",
			kind: "spell",
			effects: [{ type: "continuous", range: "field", operation: (duel) => duel, affects: (duel, target, source) => target.code === "blank" && target.controller === source.controller, modifies: () => [{ kind: "set", stat: "atk", to: 2500 }] }],
		},
		{
			code: "double-spell",
			kind: "spell",
			effects: [
				{
					type: "continuous",
					range: "field",
					operation: (duel) => duel,
					affects: (duel, target, source) => target.code === "blank" && target.controller === source.controller,
					modifies: (duel, source) => (duel.lp[source.controller] < duel.lp[other(source.controller)] ? [{ kind: "base", stat: "atk", to: (original) => original * 2 }] : []),
				},
			],
		},
		{ code: "tower", kind: "monster", facts: { level: 8, atk: 3200, def: 2000 } },
		{ code: "monster", kind: "monster" },
		// A Spell with no effect: something to Set, so the opponent gets priority.
		{ code: "idle", kind: "spell" },
		{ code: "big", kind: "monster", facts: { level: 4, atk: 2000, def: 1000 } },
		{ code: "small", kind: "monster", facts: { level: 2, atk: 600, def: 300 } },
		{ code: "huge", kind: "monster", facts: { level: 8, atk: 3000, def: 2500 } },
	];
	return Object.fromEntries(cards.map((card) => [card.code, card]));
}
