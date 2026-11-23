import type { CardInstance, Duel, Link, Side } from "./duel";
import type { EffectRecord, OnceScope } from "./effects";

/**
 * Step 4 of docs/rules-core-spec.md: the once-per-turn limits, in five scopes (see `OnceScope` in effects.ts). The
 * uses are keys in three lists: those of this turn, of the whole Duel, and of the chain being built.
 */
export interface Used {
	readonly turn: readonly string[];
	readonly duel: readonly string[];
	readonly chain: readonly string[];
}

export const NOTHING_USED: Used = Object.freeze({ turn: Object.freeze([]), duel: Object.freeze([]), chain: Object.freeze([]) });

type Bucket = keyof Used;
const BUCKETS: Record<OnceScope, Bucket> = { instance: "turn", name: "turn", activation: "turn", duel: "duel", chain: "chain" };

/**
 * The key of one use of an effect, or `null` when it has no limit. Always read on the card as it is before it is
 * activated (a Spell or Trap Card not yet placed), so that checking and spending use the same key. An `instance` limit
 * tells a copy apart by its id and its `moves`: a card that has moved is a new card, with no use. This is how the core
 * reads it; YGOProJudge (the owner's rules site, no source cited) says the same, no Konami page was found. Every other
 * scope is by player and name (YGOProJudge too): both players may each use their own.
 */
export function keyOf(effect: EffectRecord, player: Side, card: CardInstance, index: number): string | null {
	const once = effect.once;
	if (!once) return null;
	const base = once.key ?? `${card.code}:${index}`;
	return once.scope === "instance" ? `instance:${card.id}.${card.moves}:${once.key ?? index}` : `${once.scope}:${player}:${base}`;
}

/** Has this use already been spent? */
export const isSpent = (duel: Duel, effect: EffectRecord, key: string | null): boolean => key !== null && duel.used[BUCKETS[effect.once!.scope]].includes(key);

/** Records that the effect was activated. */
export function spend(duel: Duel, effect: EffectRecord, key: string | null): Duel {
	if (key === null) return duel;
	const bucket = BUCKETS[effect.once!.scope];
	return { ...duel, used: { ...duel.used, [bucket]: [...duel.used[bucket], key] } };
}

/**
 * The activation of `link` was negated: its own use is given back, once, and only for a "You can only activate 1 ..."
 * limit. That a negated activation gives the use back for that wording, and not for the others, is YGOProJudge's
 * answer (no source cited); no Konami page was found.
 */
export function refund(duel: Duel, link: Link, effect: EffectRecord): Duel {
	if (effect.once?.scope !== "activation" || link.spent === null || link.activationNegated) return duel;
	const bucket = BUCKETS.activation;
	const at = duel.used[bucket].indexOf(link.spent);
	return at < 0 ? duel : { ...duel, used: { ...duel.used, [bucket]: duel.used[bucket].filter((_, i) => i !== at) } };
}

/** A new turn: the limits of the turn are lifted. */
export const newTurn = (duel: Duel): Duel => (duel.used.turn.length === 0 ? duel : { ...duel, used: { ...duel.used, turn: [] } });

/** The chain has resolved: "once per Chain" limits are lifted. */
export const endChain = (duel: Duel): Duel => (duel.used.chain.length === 0 ? duel : { ...duel, used: { ...duel.used, chain: [] } });
