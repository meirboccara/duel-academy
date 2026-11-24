import { type Duel, freeSlots, isOnField, moveCard, type Side } from "./duel";
import { askZone } from "./effects";
import type { EffectSource } from "./modifiers";

/**
 * Setting a Spell or Trap by a card effect: "Set 1 [archetype] Spell/Trap from your Deck", "You can Set this card from your GY",
 * "target 1 Trap in your GY; Set it" (Primite Dragon Ether Beryl, Primite Drillbeam, Blue-Eyes Tyrant Dragon, Lightstorm Dragon).
 *
 * The card goes face-down to a Spell & Trap Zone of the player whose effect Sets it (a Field Spell to their Field Zone, the one
 * already there being sent to the Graveyard: RB10, one Field Spell a side), from wherever it is off the field: a Deck, a hand, a
 * Graveyard, banishment. It is then a card Set this turn (`Duel.setThisTurn`): a Trap or a Quick-Play Spell cannot be activated in
 * the turn it was Set (RB10), whoever or whatever Set it; a Normal Spell can. A card whose effect says otherwise ("it can be activated
 * this turn") takes it out of `setThisTurn` itself; one that adds a condition ("but it cannot be activated unless ...") adds an
 * `activate` lock (src/modifiers.ts).
 */

/** Is the card a Spell or Trap Card that is not on the field (a monster is never Set this way)? */
function settable(duel: Duel, id: number): boolean {
	const card = duel.cards[id];
	const kind = card && duel.defs[card.code]?.kind;
	return card !== undefined && kind !== undefined && kind !== "monster" && !isOnField(card.zone) && card.zone !== "material";
}

const isFieldSpell = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.facts?.icon === "field";

/** The zones of `player` the card could be Set in by an effect: their free Spell & Trap Zones, or the Field Zone (`[0]`) for a Field Spell. None for a card that cannot be Set. */
export function setZones(duel: Duel, player: Side, id: number): readonly number[] {
	if (!settable(duel, id)) return [];
	return isFieldSpell(duel, id) ? [0] : freeSlots(duel, player, "spell");
}

/**
 * Could an effect of `player` Set this card now: a Spell or Trap Card off the field, and a zone for it (a free Spell & Trap Zone; a
 * Field Spell always has the Field Zone)? What the activation condition of such an effect asks. `reserved`: zones that will be taken
 * before the Set (the card the effect is activated with, placed from the hand).
 */
export const canSetByEffect = (duel: Duel, player: Side, id: number, reserved = 0): boolean => {
	const zones = setZones(duel, player, id);
	return isFieldSpell(duel, id) ? zones.length > 0 : zones.length > reserved;
};

/**
 * Sets the card for `player` (see above), in `slot` or their first free Spell & Trap Zone. `effect`: the effect that Sets it (the
 * resolving link): a card unaffected by it stays where it is. Nothing happens to a card that cannot be Set or when no zone is free.
 */
export function setByEffect(duel: Duel, player: Side, id: number, options: { readonly slot?: number; readonly effect?: EffectSource } = {}): Duel {
	const zones = setZones(duel, player, id);
	if (zones.length === 0 || (options.slot !== undefined && !zones.includes(options.slot))) return duel;
	const field = isFieldSpell(duel, id);
	const moved = moveCard(duel, id, { zone: field ? "field" : "spell", face: "down", controller: player, ...(field ? {} : { slot: options.slot ?? zones[0]! }), ...(options.effect ? { effect: options.effect } : {}) });
	// Not Set after all (a card unaffected by the effect): nothing is noted.
	if (!isOnField(moved.cards[id]!.zone)) return moved;
	return { ...moved, setThisTurn: [...moved.setThisTurn, id] };
}

/** As `setByEffect`, the player choosing the Spell & Trap Zone when more than one is free (`place`); `then` continues afterwards. */
export function askSetByEffect(duel: Duel, player: Side, id: number, options: { readonly effect?: EffectSource; readonly then?: (duel: Duel) => Duel } = {}): Duel {
	const then = options.then ?? ((board: Duel) => board);
	const zones = setZones(duel, player, id);
	if (zones.length === 0) return then(duel);
	const set = (board: Duel, slot: number) => then(setByEffect(board, player, id, { slot, ...(options.effect ? { effect: options.effect } : {}) }));
	return zones.length === 1 ? set(duel, zones[0]!) : askZone(duel, player, zones, set);
}
