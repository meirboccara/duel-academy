import { type Duel, moveCard } from "../duel";
import type { EffectContext } from "../effects";

/** "Discard this card" / "send this card from your hand to the GY": the cost of a hand effect. */
export const sendThisToGraveyard = (duel: Duel, { card }: EffectContext): Duel => moveCard(duel, card.id, { zone: "graveyard" });

/** What the core reads of a card in the hand or Deck (its `facts`). */
export const factsOf = (duel: Duel, id: number) => duel.defs[duel.cards[id]!.code]?.facts;

/** The ids of the Spells and Traps on the field of both players: the Spell & Trap piles and the Field Zones. */
export const spellsAndTraps = (duel: Duel): number[] => [...duel.piles.you.spell, ...duel.piles.rival.spell, ...duel.piles.you.field, ...duel.piles.rival.field];

/** An Effect Monster: a monster card with effects that is not (treated as) a Normal Monster. A monster with no effect record is not one. */
export const isEffectMonster = (duel: Duel, id: number): boolean => {
	const def = duel.defs[duel.cards[id]!.code];
	return def?.kind === "monster" && def.facts?.normal !== true && (def.facts?.effect === true || (def.effects?.length ?? 0) > 0);
};
