import { type CardInstance, type Destruction, type DamageStep, type Duel, isOnField, type Link, type MoveReason, type Phase, type Position, type Side, type SummonKind, type Zone } from "./duel";
import { type CardDef, effectOf, inFieldRange, rangeOf } from "./effects";
import { runWatches } from "./delayed";
import type { EffectSource } from "./modifiers";

/**
 * Step 3 of docs/rules-core-spec.md: typed events. Every move of a card raises `moved`; effects raise the others with
 * `raiseEvent`. An event is looked at by the trigger effects of every card in the place they trigger from.
 */
export type GameEvent =
	/** A card became a new card by moving (zone, control or flipped face-down): `before` and `after` are its two states.
	 * Cards moved at the same time (`moveCards`) share a `batch`. `negated`: a Spell or Trap Card whose activation was
	 * negated, or a monster whose Summon was negated, going to the Graveyard: Konami does not treat it as sent from the
	 * field (rule records `negated-card-not-from-field`, `negated-summon-not-from-field`). `reason: "destroyed"`: the card was
	 * destroyed (`destroyCard`); a card sent to the Graveyard otherwise (discarded, sent by an effect, Tributed) has none.
	 * `effect`: the move was done by the processing of this card effect (the card as it was when activated, and its player): a card it
	 * destroyed, banished, returned to the hand or the Deck, sent or Tributed. Absent for a cost, a Summon procedure, a rule of the game,
	 * battle, and a monster an effect used as the material of a Summon (`leftFieldBy` reads it for "leaves the field by ... effect"). */
	| { readonly type: "moved"; readonly before: CardInstance; readonly after: CardInstance; readonly batch?: number; readonly negated?: true; readonly reason?: MoveReason; readonly usedFor?: SummonKind; readonly by?: "battle"; readonly destruction?: Destruction; readonly effect?: EffectSource }
	/** A card went to a hand from another zone (a draw, a search, a recovery): `card` is the card in the hand, `from` where it was. Raised after its `moved`. */
	| { readonly type: "added-to-hand"; readonly card: CardInstance; readonly from: Zone; readonly batch?: number }
	/**
	 * A Summon succeeded. Step 8: `kind` is the procedure (a Tribute, Fusion, Synchro, Xyz, Link, Ritual or Pendulum Summon); `by:
	 * "effect"`: a card effect put the monster on the field (Monster Reborn, Polymerization), not an action of the player.
	 * `player`: who Summoned it (the player who performed the Summon, whoever owns the monster); `from`: where the monster was;
	 * `batch`: shared by the monsters Summoned at the same time (a Pendulum Summon). The core's Summons always give the three.
	 * `materials`: the materials (or Tributes) of the Summon, each as it was before it was used ("if this card is Link Summoned using a
	 * ... Link Monster as material"); the monster keeps the same list (`CardInstance.summonMaterials`).
	 */
	| { readonly type: "summoned"; readonly card: CardInstance; readonly how: "normal" | "flip" | "special"; readonly kind?: SummonKind; readonly by?: "effect"; readonly player?: Side; readonly from?: Zone; readonly batch?: number; readonly materials?: readonly CardInstance[] }
	/** Step 8: a face-up monster's battle position was changed, by its controller or by an effect; `from` is the position it had. */
	| { readonly type: "position-changed"; readonly card: CardInstance; readonly from: Position }
	/** Step 6b: an attack was declared (`target` `null`: a direct attack). */
	| { readonly type: "attack-declared"; readonly attacker: CardInstance; readonly target: CardInstance | null }
	/** Step 6b: a timing of the Damage Step begins. */
	| { readonly type: "damage-step"; readonly step: DamageStep }
	/** Step 6b: the attack reached damage calculation: the monsters "battled" (RB10). */
	| { readonly type: "battled"; readonly attacker: CardInstance; readonly target: CardInstance | null }
	| { readonly type: "battle-damage"; readonly player: Side; readonly amount: number }
	/** A monster was flipped face-up: the attack target (step 6b: before damage calculation; the event is raised after it), a Flip Summon or a card effect (step 8). */
	| { readonly type: "flipped"; readonly card: CardInstance }
	/** Cards were shown to both players by `player` (src/deck.ts: a reveal, an excavation). */
	| { readonly type: "revealed"; readonly player: Side; readonly cards: readonly CardInstance[] }
	/** A player gained Life Points (src/deck.ts, `gainLp`). */
	| { readonly type: "lp-gained"; readonly player: Side; readonly amount: number }
	/** A phase starts; `player` is the turn player. The Battle Phase's `phase` event is its Start Step beginning. */
	| { readonly type: "phase"; readonly phase: Phase; readonly player: Side }
	/** The Battle Phase's End Step begins (src/chain.ts, `Duel.battleStep`): "at the end of the Battle Phase". `player` is the turn player. */
	| { readonly type: "battle-step"; readonly step: "end"; readonly player: Side };

/**
 * "Leaves the field by a card effect": the effect whose processing made the card of this `moved` event leave the field (`null` for
 * any other event). The card was on the field and is no longer on it: destroyed, banished, returned to the hand or the Deck, sent to
 * the Graveyard or Tributed by the effect. `null` when it left as a cost, by a Summon procedure, by battle or by a rule of the game,
 * when an effect used it as the material of a Summon, when it only moved to a Spell & Trap Zone or became an Xyz Material (it has not
 * left the field), and for a card whose activation or Summon was negated (it never was on the field). Konami's Japanese Q&A fids
 * 23614 and 23445 (OCG only; records `left-field-by-effect-processing`, `left-field-by-effect-kinds`,
 * `left-field-not-spell-zone-or-material`, `left-field-as-material-not-by-effect`). "By an opponent's card effect": compare the
 * effect's `player` with `event.before.controller`, the player who controlled the card when it left (fid 8161, record
 * `left-field-controller-then`).
 */
export function leftFieldBy(event: GameEvent): EffectSource | null {
	if (event.type !== "moved" || event.effect === undefined || event.negated) return null;
	if (!isOnField(event.before.zone) || isOnField(event.after.zone) || event.after.zone === "material") return null;
	return event.effect;
}

/** A trigger effect whose condition was met by `event`; `card` is the card as it was then (id and `moves`). */
export interface Waiting {
	readonly card: CardInstance;
	/** The index of the trigger effect in the card's effects. */
	readonly effect: number;
	readonly event: GameEvent;
	/**
	 * At a trigger point: every event this one activation stands for (`EffectContext.triggered`): `event` and the others that met the
	 * same effect's condition (for an "each time" effect, those of the same batch). Absent while it waits.
	 */
	readonly events?: readonly GameEvent[];
}

interface Listening {
	/** The codes of the cards with a trigger effect. */
	readonly triggers: readonly string[];
	/** Does a card care about events: trigger effects, or effects that wait for one (`event`)? */
	readonly listensToEvents: boolean;
}

const listening = new WeakMap<object, Listening>();

function listeners(defs: Duel["defs"]): Listening {
	let found = listening.get(defs);
	if (!found) {
		const triggers: string[] = [];
		let listensToEvents = false;
		for (const def of Object.values(defs)) {
			for (const effect of def.effects ?? []) {
				if (effect.type === "trigger") triggers.push(def.code);
				if (effect.type === "trigger" || effect.event) listensToEvents = true;
			}
		}
		found = { triggers, listensToEvents };
		listening.set(defs, found);
	}
	return found;
}

/** Is the card where a trigger effect says it triggers from? Default: face-up on the field. */
function placedFor(def: CardDef | undefined, card: CardInstance, range: ReturnType<typeof rangeOf>): boolean {
	switch (range) {
		case "hand":
			return card.zone === "hand";
		case "graveyard":
			return card.zone === "graveyard";
		case "banished":
			return card.zone === "banished";
		default:
			return inFieldRange(def, card, range);
	}
}

/**
 * What happened during the last `act` (src/chain.ts), in the order it happened: every event raised, and the marks the core leaves for
 * what no event says (a chain link that begins to resolve, the end of a chain's resolution, a lasting effect that begins, a group of
 * moves that is a draw). Read by the seat log only (src/match.ts), so that it follows the real order of the moves; no rule reads it.
 * `act` starts it empty. `lp`: the Life Points at that point, which the log compares to say who gained or lost LP in each link.
 */
export type StoryEntry =
	| GameEvent
	| { readonly type: "link-resolves"; readonly index: number; readonly link: Link; readonly negated: "activation" | "effect" | "card" | null; readonly lp: Readonly<Record<Side, number>> }
	| { readonly type: "chain-resolved"; readonly lp: Readonly<Record<Side, number>> }
	| { readonly type: "modifier-added"; readonly stamp: number }
	/** The activation or the effect of the chain link at `index` was negated (`negateActivation`, `negateEffect`). */
	| { readonly type: "link-negated"; readonly index: number; readonly what: "activation" | "effect" }
	/** A delayed effect or a watch was left for later (src/delayed.ts): something a link did that has no line of its own. */
	| { readonly type: "scheduled" }
	/** The moves of `batch` are a draw (`drawCards`, the normal draw: `normal`), not an add from the Deck. */
	| { readonly type: "draw"; readonly batch: number; readonly normal?: true }
	/** `picked` cards were picked at random among `of` (`pickRandom`): the log says so, naming no card (which ones may be hidden). */
	| { readonly type: "random-pick"; readonly picked: number; readonly of: number };

/** Adds `entry` to the story of the last `act` (`StoryEntry`). */
export const tell = (duel: Duel, entry: StoryEntry): Duel => ({ ...duel, story: [...duel.story, entry] });

/**
 * Notes that something happened. Each trigger effect whose card is in place and whose condition the event meets is
 * kept in `waiting` until the next trigger point, when it can be put on a chain. The event is also "live": the last
 * thing that happened, which effects that answer an event (`event`) can respond to.
 */
export function raiseEvent(duel: Duel, event: GameEvent): Duel {
	const noted = noteEvent(tell(duel, event), event);
	// Lingering operations ("each time ..., immediately ...") are applied at once, with no Chain Link (src/delayed.ts).
	return noted.watches.length === 0 ? noted : runWatches(noted, event);
}

function noteEvent(duel: Duel, event: GameEvent): Duel {
	const { triggers, listensToEvents } = listeners(duel.defs);
	if (!listensToEvents) return duel;
	let waiting = duel.waiting;
	if (triggers.length > 0) {
		for (const card of Object.values(duel.cards)) {
			if (!triggers.includes(card.code)) continue;
			const effects = duel.defs[card.code]!.effects!;
			for (let index = 0; index < effects.length; index++) {
				const effect = effects[index]!;
				if (effect.type !== "trigger" || !placedFor(duel.defs[card.code], card, rangeOf(effect)) || !effect.event?.(duel, event, { player: card.controller, card })) continue;
				if (arrivedWith(duel, card, event)) continue;
				waiting = [...waiting, { card, effect: index, event }];
			}
		}
	}
	return { ...duel, live: [...duel.live, event], waiting };
}

/**
 * Did the card come to where it is at the same time as what happened to another card (one `batch` of `moveCards`)? It was not there
 * yet: an effect that triggers from the hand, the Graveyard or banishment "if [another card] is sent ..." is not triggered by a card
 * sent together with it (Konami's Japanese notes on Deep-Eyes White Dragon, the Blue Abyss, OCG only: record
 * `trigger-from-gy-needs-card-there-first`). The card's own move still triggers its own effects.
 */
function arrivedWith(duel: Duel, card: CardInstance, event: GameEvent): boolean {
	if (event.type !== "moved" || event.batch === undefined || event.after.id === card.id || isOnField(card.zone)) return false;
	return duel.live.some((earlier) => earlier.type === "moved" && earlier.batch === event.batch && earlier.after.id === card.id && earlier.after.moves === card.moves);
}

/** Mandatory triggers and "if" triggers stay for the next trigger point, however much happens before it. */
const outlastsBreak = (duel: Duel, waiting: Waiting) => {
	const effect = effectOf(duel, waiting);
	return effect.mandatory === true || effect.timing === "if";
};

/** Optional "when" triggers wait for nothing else to have happened: forget them (they missed the timing). */
export function dropWhen(duel: Duel): Duel {
	return duel.waiting.every((waiting) => outlastsBreak(duel, waiting)) ? duel : { ...duel, waiting: duel.waiting.filter((waiting) => outlastsBreak(duel, waiting)) };
}

/**
 * Something else happens now: what happened so far is no longer "the last thing that happened". Optional "when"
 * triggers miss the timing, and a fast effect can no longer answer the earlier events. A card effect calls it between
 * the parts of a "then"; the core calls it before each link resolves and after a cost is paid.
 *
 * While a chain resolves (`chain` not empty), the cards added to a hand so far are kept in `lingering` instead of being
 * forgotten: an effect that `lingers` (Droll & Lock Bird) may still answer them once the whole chain has resolved, whatever
 * happened after them in the chain, a later link or the part of the same link after "then". Konami's Japanese notes on Droll
 * (record `notes`) say it can be activated after the chain in which the opponent added the card, with no exception for what
 * followed. Outside a chain the break ends that window too.
 */
export function breakEffect(duel: Duel): Duel {
	const dropped = dropWhen(duel);
	if (dropped.live.length === 0 && dropped.lingering.length === 0) return dropped;
	if (dropped.chain.length === 0) return { ...dropped, live: [], lingering: [] };
	const added = dropped.live.filter((event) => event.type === "added-to-hand" && !dropped.lingering.includes(event));
	return { ...dropped, live: [], lingering: added.length === 0 ? dropped.lingering : [...dropped.lingering, ...added] };
}

/**
 * The break the core makes before each link of a chain resolves (`resolveChain`): it sets nothing aside. What the link before raised
 * has already been carried by `resolveChain`, and what happened before the chain (a draw by a lingering operation, then the chain's
 * activations) is not an add "in the chain" that Droll may answer after it.
 */
export function breakBeforeLink(duel: Duel): Duel {
	const dropped = dropWhen(duel);
	return dropped.live.length === 0 && dropped.lingering.length === 0 ? dropped : { ...dropped, live: [], lingering: [] };
}
