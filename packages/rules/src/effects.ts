import type { CardInstance, Duel, Link, Position, Side } from "./duel";
import type { GameEvent } from "./events";
import type { Layer } from "./modifiers";

/**
 * Step 4 of docs/rules-core-spec.md: effect records. A card is data: a `CardDef` with one `EffectRecord` per printed
 * effect, `{ type, range, event, timing, condition, cost, target, operation, once }` (plus what the core needs to tell
 * apart: `mandatory`, `each`, `categories`). The records are plain values shared by every duel and never changed.
 *
 * How a record is played (src/activation.ts, src/chain.ts, src/triggers.ts):
 * - Listing: `condition`, then the `once` limit, then a dry run of the `cost` (it is run on the immutable duel and the
 *   result thrown away), then the `target` candidates read on the board the cost would leave.
 * - Activating: the card is placed (for `type: "activation"`), the cost is paid for real, the target is checked again
 *   on the paid board, the link freezes `categories`, and the `once` limit is spent.
 * - Resolving: `operation` runs; it may ask its player for a choice that is not a target (`ask`).
 */
export type SpellSpeed = 1 | 2 | 3;

/** Who is activating, and with which card (as it is now, before it is placed or any cost is paid). */
export interface EffectContext {
	readonly player: Side;
	readonly card: CardInstance;
}

/** A card's own reaction to something that happened: a typed event (src/events.ts). */
export type EventMatcher = (duel: Duel, event: GameEvent, ctx: EffectContext) => boolean;

/**
 * Where the card must be for the effect: `field` means face-up on its controller's field (for a monster card, in the Monster Zone);
 * `pendulum` (step 7), a Pendulum Monster's Pendulum Effect: face-up in a Pendulum Zone.
 */
export type Range = "hand" | "field" | "graveyard" | "banished" | "pendulum";

/**
 * How often an effect may be used, as the printed wording says it (each wording has a card-text record in
 * src/rule-sources.ts). What the core does with each is sourced by Konami's Japanese Q&A (records named below), except
 * the starred parts, which rest on YGOProJudge (the owner's rules site, no source cited):
 * - `instance`: "Once per turn:". Each copy has its own use, and a card that has become a new card (it moved) has not
 *   used it (*). A negated activation does not give it back (*).
 * - `name`: "You can only use this effect of [name] once per turn." By player and effect, not by copy (`once-name-second-copy`);
 *   spent at activation, a negated activation or effect does not give it back (`use-negated-activation-spent`,
 *   `effect-negated-still-activated`). That the other player's copy has a use of its own is (*).
 * - `activation`: "You can only activate 1 [name] per turn." As `name`, but a negated activation gives the use back
 *   (`activate-one-unless-negated`, `activate-negated-can-again`); a negated effect does not (`effect-negated-still-activated`).
 * - `duel`: "once per Duel": as `name`, for the whole Duel, spent even if negated (`duel-use-spent-even-if-negated`), per
 *   player (`duel-per-player-control`, `duel-per-player-effect-used`).
 * - `chain`: "once per Chain": as `name`, until the chain it was put on has resolved, per player (*): no Konami page found.
 * `key` lets several effects share one limit ("You can only use 1 [name] effect per turn"); the default is the card
 * code and the effect's place in the card.
 */
export type OnceScope = "instance" | "name" | "activation" | "duel" | "chain";
export interface Once {
	readonly scope: OnceScope;
	readonly key?: string;
}

/**
 * A choice made while an effect resolves that is not a target: "add 1 Field Spell from your Deck" (the player picks the
 * card). `ask` returns the duel as it stands with the question in `duel.asking`; the chain waits for the answer, and
 * `then` continues from the duel with the card picked and may ask again. With one candidate there is nothing to choose
 * and `then` runs at once; with none the effect does nothing more.
 */
export const ask = (duel: Duel, player: Side, from: readonly number[], then: (duel: Duel, picked: number) => Duel): Duel => ({ ...duel, asking: { links: [], player, from, then } });

/**
 * Step 7: a zone chosen while an effect resolves ("Special Summon it to your zone this card points to"): as `ask`, with zones (from the
 * player's left) instead of cards; `legalActions` lists them as `place`. With one zone nothing is asked; with none, `then` is not run.
 */
export const askZone = (duel: Duel, player: Side, zones: readonly number[], then: (duel: Duel, zone: number) => Duel): Duel => ({ ...duel, asking: { links: [], player, from: zones, then, zones: true } });

/**
 * Step 8: the zone and the battle position of a monster being Special Summoned by an effect (RB10: "your choice of face-up Attack
 * Position or face-up Defense Position"): as `askZone`, each `place` listing the `positions` open; the player names one with
 * `position` (default: the first). Nothing is asked with one zone and one position.
 */
export const askPlace = (duel: Duel, player: Side, zones: readonly number[], positions: readonly Position[], then: (duel: Duel, zone: number, position: Position) => Duel): Duel => ({
	...duel,
	asking: { links: [], player, from: zones, then: (board, zone, position) => then(board, zone, position ?? positions[0] ?? "attack"), zones: true, positions },
});

/**
 * A cost the player chooses how to pay: `pick` lists the ways (each a list of cards, e.g. one card of the hand for
 * "discard 1 card"; default: one way, with no card), and `pay` pays one of them, giving the duel with it paid or `null`
 * if that way cannot be paid. Every way is a separate action, combined with the targets read after paying it.
 * `can` is an optional cheap pre-check run before the dry run: it must never say no to a cost that can be paid.
 */
export interface CostSpec {
	readonly can?: (duel: Duel, ctx: EffectContext) => boolean;
	readonly pick?: (duel: Duel, ctx: EffectContext) => readonly (readonly number[])[];
	readonly pay: (duel: Duel, ctx: EffectContext, picked: readonly number[]) => Duel | null;
}

export type Cost = ((duel: Duel, ctx: EffectContext) => Duel | null) | CostSpec;

/**
 * "Cannot be negated" as a condition read when the negation takes effect, not a flag (Konami's Japanese Q&A on a card
 * whose activation and effect cannot be negated while a monster is in its linked zone, record
 * `cannot-be-negated-checked-at-resolution`): for "negate the activation" and "negate the effect" it is read when the
 * negating effect resolves; for a negation of the card's own effects (Infinite Impermanence), when the immune effect
 * itself resolves.
 */
export type Immunity = boolean | ((duel: Duel, link: Link) => boolean);

export interface EffectRecord {
	/**
	 * For `activation`: "if ..., you can activate this card from your hand", as well as the way its kind allows. The card is
	 * placed face-up in a free Spell & Trap Zone and activated, in either player's turn (a Trap that was never Set has no
	 * "not the turn it was Set" limit). Konami's notes on Infinite Impermanence: it is not an effect of the card.
	 */
	readonly handIf?: (duel: Duel, ctx: EffectContext) => boolean;
	/**
	 * Worded "when a monster(s) would be Summoned": it answers the Summon in progress. Only such effects can be activated in the
	 * Summon's window (YGOProJudge's lead, no Konami page found); anything else waits until the Summon has succeeded.
	 */
	readonly answersSummon?: boolean;
	/**
	 * `activation` of a Continuous Spell or Trap Card (step 6): the card stays on the field face-up after the chain, instead of being
	 * sent to the Graveyard. Its continuous effect is another record, `type: "continuous"`.
	 */
	readonly stays?: boolean;
	/**
	 * The effect is there to add a card from the Main Deck to the hand (a search, a draw): it cannot be activated while that is locked
	 * (Droll & Lock Bird). A card that does something else, or adds later (Maxx "C"), leaves it unset: it is activated, and only the add is
	 * not done (Konami's Japanese Q&A, Droll's records `draws-fail`, `other-parts`). Which cards need it: YGOProJudge (no source cited,
	 * 2026-11-23) for Terraforming and Pot of Greed; Konami's Q&A on Drish (fid 24396) shows the same per-card call for one bullet.
	 */
	readonly requiresAddToHand?: boolean;
	/** "This activation cannot be negated." */
	readonly activationCannotBeNegated?: Immunity;
	/** "This effect cannot be negated." */
	readonly effectCannotBeNegated?: Immunity;
	/**
	 * `activation`: activating the Spell or Trap Card itself (Spell Speed from the kind of card, see `CardDef.kind`; where
	 * it can be activated from follows the rulebook). `ignition`: an Ignition Effect of a card that stays where it is
	 * (Spell Speed 1, the owner's Main Phase, nothing else going on). `quick`: a Quick Effect (Spell Speed 2).
	 * `trigger`: a Trigger Effect (Spell Speed 1), put on a chain at a trigger point after `event` matched; never
	 * listed as an ordinary action.
	 */
	readonly type: "activation" | "ignition" | "quick" | "trigger" | "continuous";
	/** For `ignition`, `quick` and `trigger`; default `field`. Ignored for `activation`. */
	readonly range?: Range;
	/**
	 * `event` of a Quick Effect worded "If ...": it may also answer an event of the chain that has just resolved, in the first window
	 * after it (`Duel.lingering`), not only the last thing that happened. Konami's Japanese notes on Droll & Lock Bird (OCG only).
	 */
	readonly lingers?: boolean;
	/** Trigger: the event it triggers on; for a card activation or Quick Effect, the event it can answer while that is the last thing that happened. */
	readonly event?: EventMatcher;
	/**
	 * Trigger: "when ... you can" misses the timing unless the event is the last thing that happened; "if ... you can"
	 * does not (default "when"). A mandatory trigger never misses it.
	 */
	readonly timing?: "when" | "if";
	/** Trigger: a mandatory ("you must") effect, or optional ("you can"). Default optional. */
	readonly mandatory?: boolean;
	/**
	 * Trigger worded "each time ...": it activates once for every time its condition was met at the trigger point, not
	 * once (Konami's Japanese Q&A, rule records `each-time-counts-events` and `each-time-across-chain`).
	 */
	readonly each?: boolean;
	/**
	 * What the effect would do ("search", "draw"...), so another card can respond to "an effect that would...". Frozen
	 * on the link when the effect is activated: a function is read once then, on the board the cost left and with the
	 * targets chosen, and never again.
	 */
	readonly categories?: readonly string[] | ((duel: Duel, ctx: EffectContext, targets: readonly number[]) => readonly string[]);
	/** The activation condition, over the duel and its chain. Absent: always met. */
	readonly condition?: (duel: Duel, ctx: EffectContext) => boolean;
	/**
	 * The cost, paid at activation after the card is placed and before the link is added; never refunded. Either a
	 * function returning the duel with the cost paid (or `null` when it cannot be paid): one way to pay. Or a `CostSpec`
	 * with the player's choice of cards ("discard 1 card"). The listing runs it as a dry run on the immutable duel,
	 * so nothing is spent.
	 */
	readonly cost?: Cost;
	/**
	 * The cards that may be targeted, read on the duel with the cost paid (a cost can remove a target or make one). The
	 * player chooses `targetCount` of them at activation (one, unless it says otherwise).
	 */
	readonly target?: (duel: Duel, ctx: EffectContext) => readonly number[];
	/**
	 * How many cards are targeted: `{ min: 2, max: 2 }` "target 2 ...", `{ min: 1, max: 2 }` "target up to 2",
	 * `{ min: 0, max: 1 }` "you can target 1" (the effect may be activated with no target). Default one. Each legal
	 * combination is its own action, and the choice is checked again after the cost is paid.
	 */
	readonly targetCount?: { readonly min: number; readonly max: number };
	/**
	 * Applies the effect when its link resolves. `index` is the link's place in `duel.chain`, which still holds this
	 * link and those below it. To negate, it calls `negateActivation` or `negateEffect` on a lower link; to make the
	 * player choose a card that is not a target, it returns `ask(...)`.
	 */
	readonly operation: (duel: Duel, link: Link, index: number) => Duel;
	/** The once-per-turn (or Duel, or chain) limit, as printed. */
	readonly once?: Once;
	/**
	 * `continuous` (step 6): what the effect does while it applies, as modifiers (src/modifiers.ts). It is never activated or put on a
	 * chain: it is read from the board when a query asks, while the card is face-up on the field (`range` `field`), its effects are
	 * not negated and `condition` holds. Its stamp is the moment the card came face-up on the field.
	 */
	readonly modifies?: (duel: Duel, source: CardInstance) => readonly Layer[];
	/** `continuous`: which cards the modifiers reach; default the source card itself. */
	readonly affects?: (duel: Duel, target: CardInstance, source: CardInstance) => boolean;
}

/** A Link Arrow as printed, read with the card upright for its controller. */
export type Arrow = "top-left" | "top" | "top-right" | "left" | "right" | "bottom-left" | "bottom" | "bottom-right";

/** What a card says about itself that the core reads: its Spell or Trap icon, a monster's printed Level, ATK and DEF, a Normal Monster. */
export interface Facts {
	/** The Spell icon: a Field Spell goes to the Field Zone (step 7), an Equip Spell is equipped to a monster. */
	readonly icon?: "field" | "equip";
	/** An Extra Deck monster's frame (step 7: where it may be Summoned from the Extra Deck). */
	readonly frame?: "fusion" | "synchro" | "xyz" | "link" | "ritual";
	/** Step 8: a Tuner monster. */
	readonly tuner?: true;
	/** Step 8: an Xyz Monster's Rank (it has no Level). */
	readonly rank?: number;
	/** Step 8: a Link Monster's Link Rating (it has no Level and no DEF). */
	readonly link?: number;
	/** A Link Monster's arrows. */
	readonly arrows?: readonly Arrow[];
	/** A Pendulum Monster: it can be placed in a Pendulum Zone, and goes face-up to the Extra Deck instead of the Graveyard from the field. */
	readonly pendulum?: { readonly scale: number };
	readonly level?: number;
	/** The printed ATK and DEF: the original ATK and DEF (RB10, Glossary). */
	readonly atk?: number;
	readonly def?: number;
	readonly normal?: true;
}

/** Who is Summoning what: the player, and the monster to be Summoned as it is now (in the Extra Deck, the hand...). */
export interface MaterialContext {
	readonly player: Side;
	readonly summoned: CardInstance;
}

export type MaterialFilter = (duel: Duel, card: CardInstance, ctx: MaterialContext) => boolean;

/** One line of a material "recipe": "1 Tuner", "1+ non-Tuner Dragon monsters", "2 Level 4 monsters". A card fills one slot. */
export interface MaterialSlot {
	readonly filter?: MaterialFilter;
	readonly min: number;
	readonly max: number;
}

/** A rule over the whole set of materials ("with different names"). */
export type MaterialCheck = (duel: Duel, cards: readonly CardInstance[], ctx: MaterialContext) => boolean;

/** "2+ Effect Monsters", "2 Level 4 monsters": how many, and which. */
export interface MaterialCount {
	readonly min: number;
	/** Default: `min` (for a Link Monster: its Link Rating). */
	readonly max?: number;
	readonly filter?: MaterialFilter;
}

/**
 * Step 8 of docs/rules-core-spec.md: a monster's Summon procedure, as data (src/procedures.ts plays it). The card writes only what
 * is printed on it; the kind adds its own rule:
 * - `synchro`: 1 Tuner and 1 or more non-Tuner monsters (or what `tuner` / `nonTuner` / `nonTuners` say), face-up on your field,
 *   whose Levels add up to the Synchro Monster's Level; sent to the Graveyard.
 * - `xyz`: 2 face-up monsters you control whose Level is the Rank (or what `materials` says), which become its Xyz Materials.
 *   `alternatives`: the other ways printed on the card ("you can also Xyz Summon this card by using a Rank 4 Xyz Monster you
 *   control as material"), each with its `condition`; `transfer`: "(Transfer its materials to this card.)".
 * - `link`: face-up monsters you control that count for the Link Rating, a Link Monster for 1 or for its own Rating; sent to the
 *   Graveyard.
 * - `fusion`: the Fusion Materials listed. Not an action: the effect that Fusion Summons says where the materials come from and
 *   where they go (`fusionSummon`). `contact`: "Must first be Special Summoned (from your Extra Deck) by sending the above cards you
 *   control to the GY": an action too, with no card effect, the materials going `to`.
 * - `ritual`: a Ritual Monster, Summoned by a Ritual Spell (`ritualSummon`).
 */
export type Procedure =
	| { readonly kind: "synchro"; readonly tuner?: MaterialFilter; readonly nonTuner?: MaterialFilter; readonly nonTuners?: { readonly min: number; readonly max?: number }; readonly check?: MaterialCheck }
	| { readonly kind: "xyz"; readonly materials?: MaterialCount; readonly check?: MaterialCheck; readonly alternatives?: readonly { readonly materials: MaterialCount; readonly condition?: (duel: Duel, ctx: MaterialContext) => boolean; readonly transfer?: true }[] }
	| { readonly kind: "link"; readonly materials: MaterialCount; readonly check?: MaterialCheck }
	| { readonly kind: "fusion"; readonly materials: readonly MaterialSlot[]; readonly check?: MaterialCheck; readonly contact?: { readonly to: "graveyard" | "banished" | "deck" } }
	| { readonly kind: "ritual" };

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
	readonly facts?: Facts;
	readonly effects?: readonly EffectRecord[];
	/**
	 * "You can Special Summon this card (from your hand)": a built-in Special Summon, an action that starts no chain, in an open game
	 * state, into a free Monster Zone, when `condition` holds. Step 5 only; the Summon procedures as data are step 8.
	 */
	readonly builtInSummon?: { readonly how: "special"; readonly condition?: (duel: Duel, ctx: EffectContext) => boolean };
	/** Step 8: the Summon procedure of an Extra Deck or Ritual Monster, as data. */
	readonly procedure?: Procedure;
	/** Obelisk: "This card's Normal Summon cannot be negated": the negating cards are not even offered against such a Summon. */
	/** Step 8: `cannotBeNormalSummoned`: "Cannot be Normal Summoned/Set" (a Ritual Monster or an Extra Deck monster never can be, with no need to say so). */
	readonly summon?: { readonly cannotBeNegated?: readonly ("normal" | "special")[]; readonly cannotBeNormalSummoned?: true };
	/**
	 * Printed parts of the card the core does not apply yet (for Infinite Impermanence, `"column"`: step 7). The card is
	 * playable but not done. This is the card as the game imports it (step 10's port refuses a card that has any); its
	 * `CardSources.deferred` names the same parts at test time, and a definition-of-done test checks the two agree.
	 */
	readonly unmodelled?: readonly string[];
}

/** The Spell Speed of an effect of a card: fixed by the kind of card for a card activation, by the type otherwise. */
export function speedOf(def: CardDef, effect: EffectRecord): SpellSpeed {
	if (effect.type === "quick") return 2;
	if (effect.type !== "activation") return 1;
	if (def.kind === "counter-trap") return 3;
	// A Pendulum Monster activated as a Spell Card in a Pendulum Zone: Spell Speed 1, as a Spell Card (step 7).
	return def.kind === "spell" || def.kind === "monster" ? 1 : 2;
}

/** The effect a link or a waiting trigger points at: the card's code and the effect's index in its card. */
export const effectOf = (duel: Duel, from: { readonly card: CardInstance; readonly effect: number }): EffectRecord => duel.defs[from.card.code]!.effects![from.effect]!;

/**
 * The cards a link targeted that are still the cards it targeted: a target that left where it was and came back (it
 * moved, so it is a new card) is no longer "that target". An operation reads its targets through this. (UCT4: "that
 * target" has to still meet the targeting requirements; a card that became a new card is not the same one: R2021 and step 1.)
 */
export const targetsOf = (duel: Duel, link: Link): CardInstance[] => link.targets.flatMap((id, i) => (duel.cards[id]!.moves === link.targetMoves[i] ? [duel.cards[id]!] : []));

/**
 * Is a face-up card on the field where an effect of range `field` or `pendulum` applies? A monster card's `field` effects work in the
 * Monster Zone only, its `pendulum` ones only in a Pendulum Zone (the leftmost or rightmost Spell & Trap Zone); a Spell or Trap Card's
 * `field` effects anywhere on the field.
 */
export function inFieldRange(def: CardDef | undefined, card: CardInstance, range: Range): boolean {
	if (card.face !== "up") return false;
	if (range === "pendulum") return def?.facts?.pendulum !== undefined && card.zone === "spell" && (card.slot === 0 || card.slot === 4);
	if (range !== "field") return false;
	if (def?.kind === "monster") return card.zone === "monster";
	return card.zone === "monster" || card.zone === "spell" || card.zone === "field";
}

/** Where the card must be for the effect: the field unless the record says otherwise. */
export const rangeOf = (effect: EffectRecord): Range => effect.range ?? "field";
