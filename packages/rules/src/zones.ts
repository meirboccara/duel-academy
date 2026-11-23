import { type CardInstance, type Duel, EXTRA_MONSTER_SLOTS, freeSlots, MONSTER_ZONES, moveCard, occupant, type Side } from "./duel";
import { type Arrow, inFieldRange } from "./effects";

/**
 * Step 7 of docs/rules-core-spec.md: board queries over the exact zones (`CardInstance.slot`), from either player's side.
 *
 * Columns: the five vertical lines of zones, each holding one Main Monster Zone and one Spell & Trap Zone of each player; the
 * shared Extra Monster Zones are in the second and fourth columns, the Field Zone in none (RB10's game mat; YGOProJudge's reading of
 * "column", no Konami sentence defines it). A player's left is the other player's right, so column `c` for one is `4 - c` for the other.
 */

/** The column of a card's zone as `you` see it, or `null` when it is not in a Main Monster, Extra Monster or Spell & Trap Zone. */
export function cardColumn(card: CardInstance): number | null {
	return absoluteColumn(card);
}

function absoluteColumn(card: CardInstance): number | null {
	if (card.slot === null || (card.zone !== "monster" && card.zone !== "spell")) return null;
	if (card.zone === "monster" && card.slot >= MONSTER_ZONES) return card.slot === MONSTER_ZONES ? 1 : 3;
	return card.controller === "you" ? card.slot : 4 - card.slot;
}

/** The Pendulum Zones: the leftmost and rightmost Spell & Trap Zones, shared with ordinary Spells and Traps (RB10). */
export const PENDULUM_SLOTS: readonly number[] = [0, 4];

const seenBy = (column: number, viewer: Side): number => (viewer === "you" ? column : 4 - column);

/** The column (0 to 4, from `viewer`'s left) of the zone the card is in; `null` off the field or in the Field Zone. */
export function columnOf(duel: Duel, id: number, viewer: Side = "you"): number | null {
	const column = absoluteColumn(duel.cards[id]!);
	return column === null ? null : seenBy(column, viewer);
}

/** The cards of both players in column `column` (from `viewer`'s left): Monster Zones, Extra Monster Zones and Spell & Trap Zones. */
export function cardsInColumn(duel: Duel, column: number, viewer: Side = "you"): number[] {
	const wanted = seenBy(column, viewer);
	const found: number[] = [];
	for (const side of ["you", "rival"] as const) {
		for (const zone of ["monster", "spell"] as const) for (const id of duel.piles[side][zone]) if (absoluteColumn(duel.cards[id]!) === wanted) found.push(id);
	}
	return found;
}

/** Are the two cards in the same column? A card in the Field Zone or off the field is in no column. */
export function sameColumn(duel: Duel, a: number, b: number): boolean {
	const column = absoluteColumn(duel.cards[a]!);
	return column !== null && column === absoluteColumn(duel.cards[b]!);
}

/** A Monster Zone: a player's Main Monster Zone (0 to 4 from their left) or one of the shared Extra Monster Zones (5 and 6, as `you` see them). */
export interface ZoneRef {
	readonly side: Side | "shared";
	readonly slot: number;
}

/** Rows as `you` see the field: your Main Monster Zones 0, the Extra Monster Zones 1, the rival's Main Monster Zones 2. */
const STEP: Readonly<Record<Arrow, readonly [number, number]>> = {
	"top-left": [1, -1],
	top: [1, 0],
	"top-right": [1, 1],
	left: [0, -1],
	right: [0, 1],
	"bottom-left": [-1, -1],
	bottom: [-1, 0],
	"bottom-right": [-1, 1],
};

/** Where a card in a Monster Zone stands as `you` see the field: [row, column]. */
function cell(card: CardInstance): readonly [number, number] | null {
	if (card.zone !== "monster" || card.slot === null) return null;
	if (card.slot >= MONSTER_ZONES) return [1, card.slot === MONSTER_ZONES ? 1 : 3];
	return card.controller === "you" ? [0, card.slot] : [2, 4 - card.slot];
}

/** The Monster Zone at [row, column], if there is one there. */
function zoneAt(row: number, column: number): ZoneRef | null {
	if (column < 0 || column > 4) return null;
	if (row === 0) return { side: "you", slot: column };
	if (row === 2) return { side: "rival", slot: 4 - column };
	if (row === 1 && (column === 1 || column === 3)) return { side: "shared", slot: column === 1 ? MONSTER_ZONES : MONSTER_ZONES + 1 };
	return null;
}

const ORDER = { you: 0, shared: 1, rival: 2 } as const;

/**
 * The Monster Zones a Link Monster's arrows point to (RB10, Link Arrows): the zones next to its own, on either player's side, read with
 * the card upright for its controller (so the rival's arrows are turned round). Arrows that point at a Spell & Trap Zone or at the
 * empty middle of the Extra Monster Zone row point to no Monster Zone. A card that is not a face-up Link Monster on the field points nowhere.
 */
export function pointedZones(duel: Duel, id: number): ZoneRef[] {
	const card = duel.cards[id]!;
	const arrows = duel.defs[card.code]?.facts?.arrows;
	const at = cell(card);
	if (!arrows || !at || card.face !== "up") return [];
	const turn = card.controller === "you" ? 1 : -1;
	const zones: ZoneRef[] = [];
	for (const arrow of arrows) {
		const [rows, columns] = STEP[arrow];
		const zone = zoneAt(at[0] + rows * turn, at[1] + columns * turn);
		if (zone) zones.push(zone);
	}
	return zones.sort((a, b) => ORDER[a.side] - ORDER[b.side] || a.slot - b.slot);
}

/** The Monster Zone a card is in, or `null`. */
export function zoneOf(duel: Duel, id: number): ZoneRef | null {
	const card = duel.cards[id]!;
	if (card.zone !== "monster" || card.slot === null) return null;
	return card.slot >= MONSTER_ZONES ? { side: "shared", slot: card.slot } : { side: card.controller, slot: card.slot };
}

const sameZone = (a: ZoneRef, b: ZoneRef) => a.side === b.side && a.slot === b.slot;

/** Does Link Monster `from` point to the zone card `to` is in? */
export function pointsTo(duel: Duel, from: number, to: number): boolean {
	const zone = zoneOf(duel, to);
	return zone !== null && pointedZones(duel, from).some((pointed) => sameZone(pointed, zone));
}

/** Are two Link Monsters co-linked: does each point to the other (RB10), whoever controls them? */
export const coLinked = (duel: Duel, a: number, b: number): boolean => a !== b && pointsTo(duel, a, b) && pointsTo(duel, b, a);

const linkMonsters = (duel: Duel): number[] => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => pointedZones(duel, id).length > 0);

/** A player's Main Monster Zones that a Link Monster (of either player) points to, from their left. */
export function linkedZones(duel: Duel, side: Side): number[] {
	const slots = new Set<number>();
	for (const id of linkMonsters(duel)) for (const zone of pointedZones(duel, id)) if (zone.side === side) slots.add(zone.slot);
	return [...slots].sort((a, b) => a - b);
}

/** Is the monster "linked": pointed to by a Link Monster, or a Link Monster pointing to a monster (RB10)? */
export function isLinked(duel: Duel, id: number): boolean {
	const monsters = [...duel.piles.you.monster, ...duel.piles.rival.monster];
	return monsters.some((other) => other !== id && (pointsTo(duel, other, id) || pointsTo(duel, id, other)));
}

const free = (duel: Duel, side: Side, slot: number): boolean => occupant(duel, side, "monster", slot) === null;

/** Must this card, Summoned from where it is now, go to an Extra Monster Zone or a linked zone? A Link Monster or a face-up Pendulum Monster from the Extra Deck. */
function needsArrows(duel: Duel, card: CardInstance): boolean {
	if (card.zone !== "extra") return false;
	const facts = duel.defs[card.code]?.facts;
	return facts?.frame === "link" || (facts?.pendulum !== undefined && card.face === "up");
}

/**
 * Would `card` placed in Extra Monster Zone `slot` complete a path of co-linked monsters to `first`, the player's other Extra Monster
 * Zone monster? Backed by YGOProJudge only (2026-11-23, no source cited): the path may pass through the opponent's monsters.
 */
function completesExtraLink(duel: Duel, side: Side, card: CardInstance, slot: number, first: number): boolean {
	if (duel.defs[card.code]?.facts?.frame !== "link") return false;
	const placed = moveCard(duel, card.id, { zone: "monster", controller: side, face: "up", slot });
	const monsters = [...placed.piles.you.monster, ...placed.piles.rival.monster];
	const reached = new Set([card.id]);
	const queue = [card.id];
	while (queue.length > 0) {
		const at = queue.shift()!;
		if (at === first) return true;
		for (const next of monsters) {
			if (!reached.has(next) && coLinked(placed, at, next)) {
				reached.add(next);
				queue.push(next);
			}
		}
	}
	return false;
}

/**
 * The zones a player may Summon `id` to from where it is now, from their left (Main 0 to 4, then the Extra Monster Zones 5 and 6):
 * - A Link Monster or face-up Pendulum Monster from the Extra Deck: a free Extra Monster Zone, or a free Main Monster Zone a Link
 *   Monster points to (RB10; still so after the 2021 update, record `link-pendulum-still-restricted`).
 * - A Fusion, Synchro or Xyz Monster from the Extra Deck: any free Main Monster Zone, or a free Extra Monster Zone (2021 update).
 * - Any other monster, an Extra Deck monster coming back from the Graveyard or banishment included: a free Main Monster Zone.
 * A player who already has a monster in an Extra Monster Zone cannot use the other one (RB10), unless the Link Monster placed there
 * completes a co-linked path to it (Extra Link: YGOProJudge only).
 */
export function summonZones(duel: Duel, side: Side, id: number): number[] {
	const card = duel.cards[id]!;
	const fromExtra = card.zone === "extra";
	const main = freeSlots(duel, side, "monster");
	const restricted = needsArrows(duel, card);
	const zones = restricted ? main.filter((slot) => linkedZones(duel, side).includes(slot)) : main;
	if (!fromExtra) return zones;
	const mine = duel.piles[side].monster.find((other) => (duel.cards[other]!.slot ?? 0) >= MONSTER_ZONES);
	for (const slot of EXTRA_MONSTER_SLOTS) {
		if (!free(duel, side, slot)) continue;
		if (mine === undefined || completesExtraLink(duel, side, card, slot, mine)) zones.push(slot);
	}
	return zones;
}

/**
 * The zones a card from the hand may be placed in as a Spell or Trap Card, from the player's left: a free Spell & Trap Zone; for a
 * Pendulum Monster, a free Pendulum Zone (the leftmost or rightmost Spell & Trap Zone, RB10); for a Field Spell, the Field Zone (0),
 * always, since the one there is sent to the Graveyard (RB10).
 */
export function placingZones(duel: Duel, side: Side, id: number): number[] {
	const def = duel.defs[duel.cards[id]!.code];
	if (def?.facts?.icon === "field") return [0];
	const free = freeSlots(duel, side, "spell");
	return def?.kind === "monster" ? free.filter((slot) => PENDULUM_SLOTS.includes(slot)) : free;
}

/** The cards in a player's Pendulum Zones: Pendulum Monsters face-up in their leftmost or rightmost Spell & Trap Zone, left first. */
export function pendulumZones(duel: Duel, side: Side): number[] {
	return duel.piles[side].spell.filter((id) => inFieldRange(duel.defs[duel.cards[id]!.code], duel.cards[id]!, "pendulum")).sort((a, b) => duel.cards[a]!.slot! - duel.cards[b]!.slot!);
}
