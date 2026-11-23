import type { CardInstance, DamageStep, Duel, Phase, Side, Zone } from "./duel";
import { type CardDef, effectOf, inFieldRange, rangeOf } from "./effects";

/**
 * Step 3 of docs/rules-core-spec.md: typed events. Every move of a card raises `moved`; effects raise the others with
 * `raiseEvent`. An event is looked at by the trigger effects of every card in the place they trigger from.
 */
export type GameEvent =
	/** A card became a new card by moving (zone, control or flipped face-down): `before` and `after` are its two states.
	 * Cards moved at the same time (`moveCards`) share a `batch`. `negated`: a Spell or Trap Card whose activation was
	 * negated, or a monster whose Summon was negated, going to the Graveyard: Konami does not treat it as sent from the
	 * field (rule records `negated-card-not-from-field`, `negated-summon-not-from-field`). `reason: "destroyed"`: the card was
	 * destroyed (`destroyCard`); a card sent to the Graveyard otherwise (discarded, sent by an effect, Tributed) has none. */
	| { readonly type: "moved"; readonly before: CardInstance; readonly after: CardInstance; readonly batch?: number; readonly negated?: true; readonly reason?: "destroyed"; readonly by?: "battle" }
	/** A card went to a hand from another zone (a draw, a search, a recovery): `card` is the card in the hand, `from` where it was. Raised after its `moved`. */
	| { readonly type: "added-to-hand"; readonly card: CardInstance; readonly from: Zone; readonly batch?: number }
	| { readonly type: "summoned"; readonly card: CardInstance; readonly how: "normal" | "flip" | "special" }
	/** Step 6b: an attack was declared (`target` `null`: a direct attack). */
	| { readonly type: "attack-declared"; readonly attacker: CardInstance; readonly target: CardInstance | null }
	/** Step 6b: a timing of the Damage Step begins. */
	| { readonly type: "damage-step"; readonly step: DamageStep }
	/** Step 6b: the attack reached damage calculation: the monsters "battled" (RB10). */
	| { readonly type: "battled"; readonly attacker: CardInstance; readonly target: CardInstance | null }
	| { readonly type: "battle-damage"; readonly player: Side; readonly amount: number }
	/** Step 6b: a monster was flipped face-up (the attack target, before damage calculation; the event is raised after it). */
	| { readonly type: "flipped"; readonly card: CardInstance }
	/** A phase starts; `player` is the turn player. */
	| { readonly type: "phase"; readonly phase: Phase; readonly player: Side };

/** A trigger effect whose condition was met by `event`; `card` is the card as it was then (id and `moves`). */
export interface Waiting {
	readonly card: CardInstance;
	/** The index of the trigger effect in the card's effects. */
	readonly effect: number;
	readonly event: GameEvent;
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
 * Notes that something happened. Each trigger effect whose card is in place and whose condition the event meets is
 * kept in `waiting` until the next trigger point, when it can be put on a chain. The event is also "live": the last
 * thing that happened, which effects that answer an event (`event`) can respond to.
 */
export function raiseEvent(duel: Duel, event: GameEvent): Duel {
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
				waiting = [...waiting, { card, effect: index, event }];
			}
		}
	}
	return { ...duel, live: [...duel.live, event], waiting };
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
 */
export function breakEffect(duel: Duel): Duel {
	const dropped = dropWhen(duel);
	return dropped.live.length === 0 && dropped.lingering.length === 0 ? dropped : { ...dropped, live: [], lingering: [] };
}
