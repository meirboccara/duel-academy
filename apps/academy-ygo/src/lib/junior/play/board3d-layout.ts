import type { Spot } from "./cues";
import { EXTRA_ZONE, FULL_ZONES, ZONES, type Row, type Side } from "@duel-academy/engine";

/**
 * Where everything stands on the 3D duel mat, in the mat's own units (one card is 1 wide). A pure plan: the scene
 * draws it and the effects are placed with it, so both always agree.
 *
 * It is always the real playmat, for every level, so the child learns where everything lives: for each player five
 * Main Monster Zones, five Spell & Trap Zones (the two at the ends are also the Pendulum Zones), the Field Zone, the
 * Graveyard, the Deck, the Extra Deck and the banished cards, and between the players the two Extra Monster Zones.
 * The child's half is near the camera (+z) and reads as on a real mat: Field Zone and Extra Deck on the left,
 * Graveyard and Deck on the right. The rival's half is the same mat turned around, as the child sees it across a
 * table: the rival's Deck is far left, its zone 1 is on the right. A level played on the small board uses the three
 * middle zones of each row; the places it does not use are there but `quiet`.
 */
export interface Point3 {
	x: number;
	y: number;
	z: number;
}

/** A card is 59 by 86, lying on the mat: `w` across, `h` away from the player, `t` thick. */
export const CARD = { w: 1, h: 1.45, t: 0.05 } as const;
/** Zones are almost square, as on a real mat, so a monster turned to Defense Position still fits its zone. */
export const CELL = { w: 1.72, d: 1.72 } as const;
/** The tile drawn for a zone, a little smaller than its cell. */
export const TILE = { w: 1.56, d: 1.56 } as const;

export type PlaceKind = "monsters" | "backrow" | "field" | "graveyard" | "extra" | "banished" | "deck";
export interface MatPlace {
	/** The same name the HTML board gives the place (`data-spot`); a place the level's board does not have gets a name of its own. */
	key: string;
	kind: PlaceKind;
	side: Side;
	/** For zones: the place in its row on the level's board. -1 for a zone that board does not have. */
	zone: number;
	x: number;
	z: number;
	/** Printed on the mat but not part of this level: shown dimmed, never tapped. */
	quiet: boolean;
	/** An Extra Monster Zone. */
	extraZone: boolean;
	/** One of the two Spell & Trap Zones that are also Pendulum Zones. */
	pendulum: boolean;
}
export interface MatLayout {
	full: boolean;
	places: readonly MatPlace[];
	byKey: ReadonlyMap<string, MatPlace>;
	/** The edges of the tiles. */
	minX: number;
	maxX: number;
	minZ: number;
	maxZ: number;
	/** Where the middle of the child's hand is held, in front of the mat, and how much bigger than on the mat its cards are. */
	hand: Point3;
	handScale: number;
}

const zoneName = (side: Side, row: Row, zone: number) => `${side}-${row}-${zone}`;
const COLUMNS = FULL_ZONES + 2;
const ROWS = 5;

/** The real mat, seven places wide and five deep. `full` says whether the level plays on the whole of it or on its three middle zones. */
export function matLayout(full: boolean): MatLayout {
	const places: MatPlace[] = [];
	const xOf = (column: number) => (column - (COLUMNS - 1) / 2) * CELL.w;
	const zOf = (row: number) => (row - (ROWS - 1) / 2) * CELL.d;
	const add = (kind: PlaceKind, side: Side, zone: number, column: number, row: number, key: string, more: { quiet?: boolean; extraZone?: boolean; pendulum?: boolean } = {}) =>
		places.push({ key, kind, side, zone, x: xOf(column), z: zOf(row), quiet: more.quiet ?? false, extraZone: more.extraZone ?? false, pendulum: more.pendulum ?? false });
	/* The small board's three zones are the middle three of the five. */
	const shift = (FULL_ZONES - ZONES) / 2;
	for (const side of ["rival", "you"] as const) {
		const mine = side === "you";
		/* The rival's half is the child's half turned around the middle of the mat. */
		const column = (own: number) => (mine ? own : COLUMNS - 1 - own);
		const back = mine ? 4 : 0;
		const front = mine ? 3 : 1;
		add("extra", side, 0, column(0), back, `${side}-extra`, { quiet: !full });
		add("deck", side, 0, column(6), back, `${side}-deck`);
		add("field", side, 0, column(0), front, zoneName(side, "field", 0), { quiet: !full });
		add("graveyard", side, 0, column(6), front, `${side}-graveyard`);
		add("banished", side, 0, column(6), 2, `${side}-banished`, { quiet: !full });
		for (let slot = 0; slot < FULL_ZONES; slot++) {
			const zone = full ? slot : slot - shift;
			const used = zone >= 0 && zone < (full ? FULL_ZONES : ZONES);
			for (const [row, at] of [["backrow", back], ["monsters", front]] as const) add(row, side, used ? zone : -1, column(slot + 1), at, used ? zoneName(side, row, zone) : `${side}-${row}-spare-${slot}`, { quiet: !used, pendulum: row === "backrow" && (slot === 0 || slot === FULL_ZONES - 1) });
		}
		/* The child's Extra Monster Zone is the left one, the rival's the right one, as the HTML mat has them. */
		add("monsters", side, full ? EXTRA_ZONE : -1, mine ? 2 : 4, 2, full ? zoneName(side, "monsters", EXTRA_ZONE) : `${side}-monsters-spare-extra`, { quiet: !full, extraZone: true });
	}
	const minX = xOf(0) - TILE.w / 2;
	const maxX = xOf(COLUMNS - 1) + TILE.w / 2;
	const minZ = zOf(0) - TILE.d / 2;
	const maxZ = zOf(ROWS - 1) + TILE.d / 2;
	const handScale = 1.35;
	return { full, places, byKey: new Map(places.map((item) => [item.key, item])), minX, maxX, minZ, maxZ, hand: { x: (minX + maxX) / 2, y: HAND_LIFT, z: maxZ + 0.35 + (CARD.h * handScale) / 2 }, handScale };
}

/** Cards in the hand are held up and leaning back, facing the camera. */
export const HAND_LIFT = 0.55;
export const HAND_TILT = 0.5;

/** Where each card of a hand of `count` cards is held: side by side, closing up (and overlapping) when there are many. */
export function handSlots(layout: MatLayout, count: number): Point3[] {
	if (count <= 0) return [];
	const wide = CARD.w * layout.handScale;
	const room = layout.maxX - layout.minX - wide;
	const step = count === 1 ? 0 : Math.min(wide + 0.12, room / (count - 1));
	/* Each card a hair higher than the one before, so overlapping cards never fight for the same pixels. */
	return Array.from({ length: count }, (_, index) => ({ x: layout.hand.x + (index - (count - 1) / 2) * step, y: layout.hand.y + index * 0.012, z: layout.hand.z }));
}

/** The name of a spot of the effects, as the mat knows it. */
export function placeKey(spot: Spot): string {
	if (spot.at === "zone") return zoneName(spot.side, spot.row, spot.zone);
	if (spot.at === "lantern") return `${spot.side}-lantern`;
	if (spot.at === "pile") return `${spot.side}-${spot.pile}`;
	return "center";
}

/**
 * Where a spot of the effects is on the mat. A spot the mat does not show (the rival's hand, a player's Life Points)
 * is placed at its owner's edge, and `found` says it is not a real place.
 */
export function spotPoint(layout: MatLayout, spot: Spot): Point3 & { found: boolean } {
	const middle = (layout.minX + layout.maxX) / 2;
	if (spot.at === "center") return { x: middle, y: 0, z: (layout.minZ + layout.maxZ) / 2, found: true };
	const edge = spot.side === "you" ? layout.maxZ + 0.7 : layout.minZ - 0.7;
	if (spot.at === "lantern") return { x: middle, y: 0, z: edge, found: false };
	if (spot.at === "pile" && spot.pile === "hand") return spot.side === "you" ? { ...layout.hand, found: true } : { x: middle, y: HAND_LIFT, z: layout.minZ - 1.4, found: false };
	const known = layout.byKey.get(placeKey(spot));
	if (known) return { x: known.x, y: 0, z: known.z, found: true };
	return { x: layout.maxX + 0.4, y: 0, z: edge, found: false };
}

/**
 * The points the camera must keep in view: the corners of the mat with a small margin, and the hand held up in front
 * of it. The far edge is taken high: a card flying to the rival's Graveyard stays in the picture, and the mat stays
 * clear of the Life Points shown in the top corners of the screen.
 */
export function framePoints(layout: MatLayout): Point3[] {
	const pad = 0.3;
	const near = layout.hand.z + (CARD.h * layout.handScale) / 2;
	const out: Point3[] = [];
	for (const x of [layout.minX - pad, layout.maxX + pad]) {
		out.push({ x, y: 0, z: layout.minZ - pad }, { x, y: 1.2, z: layout.minZ - pad }, { x, y: 0, z: near }, { x, y: HAND_LIFT + 0.75, z: layout.hand.z - (CARD.h * layout.handScale) / 2 + 0.3 });
	}
	return out;
}
