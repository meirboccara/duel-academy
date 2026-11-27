import type { CardInstance, Duel, Link, Side } from "../duel";

/** "1 card on the field": any card of the fields of `sides` (both by default), face-up or face-down, a Field Zone card included. */
export const cardsOnField = (duel: Duel, sides: readonly Side[] = ["you", "rival"]): number[] => sides.flatMap((side) => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field]);

/** "A face-up monster on the field": face-up in a Monster Zone of either player. */
export const faceUpMonsters = (duel: Duel): number[] => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up");

/**
 * The cards a link targeted, in the order they were chosen, `undefined` for one that is no longer the card targeted. It reads as `targetsOf`
 * (src/effects.ts), except for a monster that was only turned face-down since: Konami's notes on S:P Little Knight and on Ecclesia and the Dark
 * Dragon process a target that is face-down Defense Position at resolution (it is banished, or shuffled, face-down), where `targetsOf` forgets it
 * because turning it face-down made it a new card. A monster that was turned face-down is the same card there, and nothing else is: a single
 * move that leaves it in the Monster Zone, face-down.
 */
export function stillTargeted(duel: Duel, link: Link): (CardInstance | undefined)[] {
	return link.targets.map((id, at) => {
		const now = duel.cards[id]!;
		if (now.moves === link.targetMoves[at]) return now;
		return now.moves === link.targetMoves[at]! + 1 && now.zone === "monster" && now.face === "down" ? now : undefined;
	});
}

/**
 * The cards that were activated (a Spell or Trap Card whose activation put it on the field) and are still to be sent to the Graveyard once the
 * Chain resolves: they cannot be returned to the hand or the Deck by an effect that is part of the same Chain (Konami's notes on Ecclesia and
 * the Dark Dragon, with a Set Normal Trap or Quick-Play Spell activated in the same Chain). A Continuous card, a Field Spell and an Equip Card
 * that equips a monster stay on the field and are not in this list. Read from this turn's activations, as `resolveChain` sweeps them.
 */
export function leavingAfterChain(duel: Duel): Set<number> {
	return new Set(
		duel.activations
			.filter(({ card, effect }) => {
				const now = duel.cards[card.id]!;
				const record = duel.defs[card.code]?.effects?.[effect];
				return now.moves === card.moves && now.zone === "spell" && now.face === "up" && now.equippedTo === null && record?.type === "activation" && record.stays !== true && duel.defs[card.code]?.kind !== "monster";
			})
			.map(({ card }) => card.id),
	);
}
