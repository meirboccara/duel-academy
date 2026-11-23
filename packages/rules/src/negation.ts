import type { Duel, Link, Side } from "./duel";
import { effectOf, rangeOf } from "./effects";
import { isNegated } from "./modifiers";

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
	return hitByCardNegation(duel, link) && isNegated(duel, link.card.id) && !immune(duel, link, "effect");
}

/** Does the player control no cards at all: no monster, Spell, Trap or Field Spell on their side of the field? A monster being Summoned is not on the field yet. */
export function controlsNoCards(duel: Duel, player: Side): boolean {
	return duel.piles[player].monster.length + duel.piles[player].spell.length + duel.piles[player].field.length === 0;
}
