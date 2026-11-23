import { negateActivationAndDestroy } from "../chain";
import type { Cost, EffectRecord } from "../effects";
import { effectOf } from "../effects";
import type { Duel, Link } from "../duel";
import { negateSummonAndDestroy, summonNegatable } from "../summon";

/** Is the link the activation of a Spell or Trap Card (not of an effect of one that is on the field, and not a monster's)? */
export const isSpellTrapCardActivation = (duel: Duel, link: Link): boolean => effectOf(duel, link).type === "activation" && duel.defs[link.card.code]!.kind !== "monster";

/** Is the link an effect of a monster (an Ignition, Quick or Trigger Effect, from the field or the hand)? */
export const isMonsterEffect = (duel: Duel, link: Link): boolean => effectOf(duel, link).type !== "activation" && duel.defs[link.card.code]!.kind === "monster";

/**
 * The shared shape of Solemn Judgment and Solemn Strike: a Counter Trap with two halves, told apart by whether it answers a
 * link. With an empty chain it answers the Summon in progress (`summon`: only a Special Summon, or any); with a chain, the
 * link on top if `activation` says so. Both negate and, if that took, destroy; the cost is paid at activation.
 */
export function summonOrActivationNegator(options: { cost: Cost; summon?: "special"; activation: (duel: Duel, top: Link) => boolean }): EffectRecord {
	return {
		type: "activation",
		answersSummon: true,
		condition: (duel) => (duel.chain.length === 0 ? summonNegatable(duel, options.summon) : options.activation(duel, duel.chain[duel.chain.length - 1]!)),
		cost: options.cost,
		operation: (duel, link) => (link.answers === null ? negateSummonAndDestroy(duel) : negateActivationAndDestroy(duel, link.answers)),
	};
}
