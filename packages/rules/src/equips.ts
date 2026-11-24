import { type CardInstance, type Duel, freeSlots, moveCard, type Side } from "./duel";
import { askZone } from "./effects";
import { addModifier, type EffectSource, FOREVER, type Layer, unaffectedBy } from "./modifiers";

/**
 * Step 11 of docs/rules-core-spec.md, monsters treated as Equip Cards only (Tokens, counters, dice and monsters treated as
 * Continuous Spells are not here). RB10, "Equip Cards": "sometimes Trap Cards or Monster Cards can become equipped to a monster.
 * Equipped Traps remain Trap Cards, but equipped monsters are considered to be Equip Spells."
 *
 * A monster equipped to another monster is its card, face-up in a Spell & Trap Zone of the player whose effect equipped it, with
 * `CardInstance.equippedTo` naming its monster (the relation of step 7's Equip Spells: `equipsOf`, destroyed with its monster). There
 * it is a Spell (`cardTypeOf`): what reads the Spell & Trap Zones finds it, what reads the Monster Zones does not, and its monster
 * effects (range `field`) do not apply. What is printed on it is still its own (`printedFacts`, `belongsTo`).
 */

/** Is the card an Equip Card now: face-up on the field and equipped to a monster (an Equip Spell, or a monster equipped to another)? */
export function isEquipCard(duel: Duel, id: number): boolean {
	const card = duel.cards[id];
	return card !== undefined && card.equippedTo !== null && card.face === "up" && card.zone === "spell";
}

/**
 * Could an effect of `player` equip the monster card `id` (from the Extra Deck, the Deck, the hand, the Graveyard, banishment or a
 * Monster Zone) to the monster `monsterId` now: a monster card that is not that monster, a face-up monster to equip, and a free Spell
 * & Trap Zone of `player` for it? The activation condition of an effect that equips a monster. A card already in a Spell & Trap Zone
 * cannot be: a monster equipped to a monster "cannot be moved to a different target" (RB10).
 */
export function canEquipMonster(duel: Duel, player: Side, id: number, monsterId: number): boolean {
	const card = duel.cards[id];
	const monster = duel.cards[monsterId];
	if (!card || !monster || id === monsterId || duel.defs[card.code]?.kind !== "monster") return false;
	if (monster.zone !== "monster" || monster.face !== "up") return false;
	if (card.zone === "spell" || card.zone === "field" || card.zone === "material") return false;
	return freeSlots(duel, player, "spell").length > 0;
}

/** What an effect that equips a monster says: who equips, and where the card goes. */
export interface EquipOptions {
	/** The player whose effect equips: the card goes to a Spell & Trap Zone of theirs, whoever controls the monster it equips. */
	readonly player: Side;
	/** The Spell & Trap Zone, from the player's left (default: the first free one). */
	readonly slot?: number;
	/** The effect that equips (pass the resolving link): a card that is unaffected by it is not moved. */
	readonly by?: EffectSource;
	/**
	 * What the card does as an Equip Card, as the effect that equips it says ("as an Equip Spell that gives it 400 ATK"): layers that
	 * reach the monster it is equipped to, for as long as it stays equipped (`Modifier.equip`). They are the Equip Card's own effect, a
	 * Spell effect: not applied while its effects are negated, nor to a monster unaffected by Spell effects (YGOProJudge only, asked
	 * 2026-11-24, no source cited). With none, the card is equipped and does nothing.
	 */
	readonly gives?: readonly EquipLayer[];
}

/** What an Equip Card may be given to do to its monster: anything but the layers about players (locks, permissions) and control. */
export type EquipLayer = Exclude<Layer, { kind: "lock" | "permit" | "control" | "damage" }>;

/**
 * An effect equips the monster card `id` to the monster `monsterId` ("equip 1 ... monster from your Extra Deck to that monster"): the
 * card is placed face-up in a Spell & Trap Zone of `player` as an Equip Card of that monster. Nothing happens, and the card stays
 * where it was, when it cannot be equipped (`canEquipMonster`) or the zone given is not free.
 */
export function equipMonster(duel: Duel, id: number, monsterId: number, options: EquipOptions): Duel {
	const { player, by } = options;
	if (!canEquipMonster(duel, player, id, monsterId) || (by && unaffectedBy(duel, id, by))) return duel;
	const free = freeSlots(duel, player, "spell");
	const slot = options.slot ?? free[0]!;
	if (!free.includes(slot)) return duel;
	const moved = moveCard(duel, id, { zone: "spell", face: "up", controller: player, slot, equippedTo: monsterId, ...(by ? { effect: by } : {}) });
	if (moved.cards[id]!.equippedTo !== monsterId || !options.gives) return moved;
	const reach = (board: Duel, target: CardInstance): boolean => board.cards[id]!.equippedTo === target.id;
	return options.gives.reduce((next, layer) => addModifier(next, { affects: reach, until: FOREVER, layer, equip: id }), moved);
}

/**
 * As `equipMonster`, the player choosing the Spell & Trap Zone when more than one is free. `then` continues once the card is equipped;
 * it is not run when the card could not be equipped.
 */
export function askEquipMonster(duel: Duel, player: Side, id: number, monsterId: number, options: Omit<EquipOptions, "player" | "slot"> & { readonly then?: (duel: Duel) => Duel } = {}): Duel {
	// Nothing is asked for a card the effect cannot equip, or cannot move.
	if (!canEquipMonster(duel, player, id, monsterId) || (options.by && unaffectedBy(duel, id, options.by))) return duel;
	return askZone(duel, player, freeSlots(duel, player, "spell"), (board, slot) => {
		const done = equipMonster(board, id, monsterId, { ...options, player, slot });
		return options.then && done !== board ? options.then(done) : done;
	});
}
