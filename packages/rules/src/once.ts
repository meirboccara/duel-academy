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
 * tells a copy apart by its id and its `moves`: a card that has moved is a new card, with no use (YGOProJudge, the owner's
 * rules site, no source cited; no Konami page found). Every other scope is by player and name: a second copy is blocked
 * (`once-name-second-copy`) and, for `duel`, each player has their own (`duel-per-player-control`); for the others that
 * both players may each use their own is YGOProJudge's answer too.
 */
export function keyOf(effect: EffectRecord, player: Side, card: CardInstance, index: number): string | null {
	const once = effect.once;
	if (!once) return null;
	const base = once.key ?? `${card.code}:${index}`;
	return once.scope === "instance" ? `instance:${card.id}.${card.moves}:${once.key ?? index}` : `${once.scope}:${player}:${base}`;
}

/** The `defs` whose shared limits were found to agree (the definitions are shared by every Duel and never changed). */
const agreed = new WeakSet<object>();

/**
 * A limit several effects share (`Once.key`) has one count: each effect reads its own `times` when it is checked, so effects
 * sharing a key with different `times` would disagree on whether the limit is reached. That is a mistake in the cards, not
 * something to ignore: it throws. Read once per `defs`. An `instance` limit is per copy, so its key is shared within one card only.
 */
function checkSharedLimits(defs: Duel["defs"]): void {
	if (agreed.has(defs)) return;
	const limits = new Map<string, { readonly times: number; readonly code: string }>();
	for (const def of Object.values(defs)) {
		for (const effect of def.effects ?? []) {
			const once = effect.once;
			if (once?.key === undefined) continue;
			const limit = once.scope === "instance" ? `instance:${def.code}:${once.key}` : `${once.scope}:${once.key}`;
			const times = once.times ?? 1;
			const first = limits.get(limit);
			if (!first) limits.set(limit, { times, code: def.code });
			else if (first.times !== times) throw new Error(`${def.code}: effects that share the once-per-turn key "${once.key}" (with ${first.code}) must allow the same number of uses (times ${first.times} and ${times})`);
		}
	}
	agreed.add(defs);
}

/** Has this use already been spent? */
export function isSpent(duel: Duel, effect: EffectRecord, key: string | null): boolean {
	if (key === null) return false;
	if (effect.once!.key !== undefined) checkSharedLimits(duel.defs);
	const used = duel.used[BUCKETS[effect.once!.scope]];
	const times = effect.once!.times ?? 1;
	if (times === 1) return used.includes(key);
	// "Twice per turn": every activation noted its use; the limit is reached once there are that many.
	let count = 0;
	for (const spent of used) if (spent === key && ++count >= times) return true;
	return false;
}

/** Records that the effect was activated. */
export function spend(duel: Duel, effect: EffectRecord, key: string | null): Duel {
	if (key === null) return duel;
	const bucket = BUCKETS[effect.once!.scope];
	return { ...duel, used: { ...duel.used, [bucket]: [...duel.used[bucket], key] } };
}

/**
 * The activation of `link` was negated: its own use is given back, once, and only for a "You can only activate 1 ..."
 * limit (`activate-one-unless-negated`, `activate-negated-can-again`). The other wordings are spent at activation and
 * stay spent (`use-negated-activation-spent`, `duel-use-spent-even-if-negated`); for "Once per turn:" that is YGOProJudge's
 * answer only (no source cited).
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
