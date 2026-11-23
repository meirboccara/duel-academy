import type { CardInstance, Duel, Link, Side } from "./duel";
import type { GameEvent } from "./events";

/**
 * PROVISIONAL effect shape, just enough for step 2 (one chain + the priority loop). Step 4 of docs/rules-core-spec.md
 * replaces it with real effect records ({ type, range, event, timing, condition, cost, target, operation, once }),
 * with dry runs for costs and targets, choices made at resolution, and once-per-turn limits. Nothing here is meant to
 * be kept: no card of `CARD_SOURCES` is written with it, only test and benchmark fixtures.
 */
export type SpellSpeed = 1 | 2 | 3;

/** Who is activating, and with which card (as it is now, before it is placed or any cost is paid). */
export interface EffectContext {
	readonly player: Side;
	readonly card: CardInstance;
}

/** A card's own reaction to something that happened: a typed event (src/events.ts). */
export type EventMatcher = (duel: Duel, event: GameEvent, ctx: EffectContext) => boolean;

export interface Effect {
	/**
	 * `card`: activating the Spell or Trap Card itself. Its Spell Speed and where it can be activated from follow from
	 * the kind of card (see `CardDef.kind`), as the rulebook gives them.
	 * `effect`: activating an effect of a card that stays where it is: a monster in the hand (a "hand trap") or a
	 * face-up card on the field. It states its own `speed` and `from`.
	 * `trigger`: a Trigger Effect (Spell Speed 1), put on a chain at a trigger point after `on` matched an event; see
	 * `mandatory`, `timing` and `from`. It is never listed as an ordinary action.
	 */
	readonly activates: "card" | "effect" | "trigger";
	/** For `activates: "effect"`: 1 (Ignition) or 2 (Quick Effect). */
	readonly speed?: SpellSpeed;
	/**
	 * Where the card must be. `field` means face-up on its controller's field. For `activates: "effect"`, only `hand`
	 * and `field` are offered; a trigger can come from any of the four (default `field`).
	 */
	readonly from?: "hand" | "field" | "graveyard" | "banished";
	/** Trigger: the event it triggers on; or, for a fast effect, the event it can answer while that is the last thing that happened. */
	readonly on?: EventMatcher;
	/** Trigger: a mandatory ("you must") effect, or optional ("you can"). Default optional. */
	readonly mandatory?: boolean;
	/**
	 * Trigger: "when ... you can" misses the timing unless the event is the last thing that happened; "if ... you can"
	 * does not (default "when"). A mandatory trigger never misses it.
	 */
	readonly timing?: "when" | "if";
	/** What the effect would do, frozen on the link ("search", "draw"...). */
	readonly categories?: readonly string[];
	/** The activation condition, over the duel and its chain. Absent: always met. */
	readonly condition?: (duel: Duel, ctx: EffectContext) => boolean;
	/** The cards that may be targeted. When present, exactly one is chosen at activation, and one is needed. */
	readonly targets?: (duel: Duel, ctx: EffectContext) => readonly number[];
	/** Paid at activation, after the card is placed and before the link is added; never refunded. */
	readonly cost?: { readonly can?: (duel: Duel, ctx: EffectContext) => boolean; readonly pay: (duel: Duel, ctx: EffectContext) => Duel };
	/**
	 * Applies the effect when its link resolves. `index` is the link's place in `duel.chain`, which still holds this
	 * link and those below it. To negate, it calls `negateActivation` or `negateEffect` on a lower link.
	 */
	readonly resolve: (duel: Duel, link: Link, index: number) => Duel;
}

export interface CardDef {
	readonly code: string;
	/**
	 * What kind of card it is, which fixes how the card itself is activated:
	 * - `spell`: Spell Speed 1, from the hand or Set, in its controller's Main Phase.
	 * - `quick-play`: Spell Speed 2, from the hand in its controller's turn, or Set (not the turn it was Set).
	 * - `trap`: Spell Speed 2, only Set, not the turn it was Set. `counter-trap`: the same at Spell Speed 3.
	 * Continuous, Equip, Field and Ritual cards are not told apart yet.
	 */
	readonly kind: "monster" | "spell" | "quick-play" | "trap" | "counter-trap";
	readonly effects?: readonly Effect[];
}

/** The Spell Speed of an effect of a card: fixed by the kind of card for a card activation, stated otherwise. */
export function speedOf(def: CardDef, effect: Effect): SpellSpeed {
	if (effect.activates === "effect") return effect.speed ?? 1;
	if (def.kind === "counter-trap") return 3;
	return def.kind === "spell" ? 1 : 2;
}
