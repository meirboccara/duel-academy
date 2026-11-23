import type { Duel, Link, Side } from "./duel";
import { effectOf, rangeOf } from "./effects";

/**
 * Step 5 of docs/rules-core-spec.md: negation. The pieces that are not about the chain live here; the chain's own
 * `negateActivation` / `negateEffect` are in chain.ts.
 */

/** Is the link's activation (or effect) one that cannot be negated, read on the duel as it is now? */
export function immune(duel: Duel, link: Link, kind: "activation" | "effect"): boolean {
	const record = effectOf(duel, link);
	const flag = kind === "activation" ? record.activationCannotBeNegated : record.effectCannotBeNegated;
	return typeof flag === "function" ? flag(duel, link) : flag === true;
}

/**
 * Negates the effects of a card on the field until the end of turn number `until` (the current turn: "until the end of this
 * turn"). It is the card as it is now; the card must be face-up in the Monster Zone, or nothing happens.
 */
export function negateCardEffects(duel: Duel, id: number, until: number): Duel {
	const card = duel.cards[id]!;
	if (card.zone !== "monster" || card.face !== "up") return duel;
	const lastStamp = duel.negations.length === 0 ? 0 : duel.negations[duel.negations.length - 1]!.stamp;
	return { ...duel, negations: [...duel.negations, { card: id, moves: card.moves, until, stamp: lastStamp + 1 }] };
}

/** Are the effects of this card on the field negated? A new card (it moved since) is not. */
export function isNegated(duel: Duel, id: number): boolean {
	if (duel.negations.length === 0) return false;
	const card = duel.cards[id]!;
	return duel.negations.some((negation) => negation.card === id && negation.moves === card.moves);
}

/** Is the effect one that is activated in the Monster Zone (so the negation of the card's effects reaches it)? */
export function hitByCardNegation(duel: Duel, link: Pick<Link, "card" | "effect">): boolean {
	const record = effectOf(duel, link);
	return record.type !== "activation" && rangeOf(record) === "field";
}

/**
 * Does the negation of the card's own effects stop this link now? Read when the link comes up for resolution: the card
 * is still the card that was negated, and its effect does not say it cannot be negated (read now, when the immune effect resolves).
 */
export function cardNegated(duel: Duel, link: Link): boolean {
	return duel.negations.length > 0 && hitByCardNegation(duel, link) && isNegated(duel, link.card.id) && !immune(duel, link, "effect");
}

/** The negations that last past the end of the turn that has just ended. */
export function withoutEnded(duel: Duel, endedTurn: number): Duel {
	return duel.negations.some((negation) => negation.until <= endedTurn) ? { ...duel, negations: duel.negations.filter((negation) => negation.until > endedTurn) } : duel;
}

/** Does the player control no cards at all: no monster, Spell, Trap or Field Spell on their side of the field? A monster being Summoned is not on the field yet. */
export function controlsNoCards(duel: Duel, player: Side): boolean {
	return duel.piles[player].monster.length + duel.piles[player].spell.length + duel.piles[player].field.length === 0;
}
