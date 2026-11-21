import type { MatLayout, MatPlace } from "./board3d-layout";
import { cardOf, monsterOf, type CardId } from "./cards";
import { cardType, type PlayCopy } from "./copy";
import { EXTRA_ZONE, atkOf, defOf, type Board, type MonsterSlot, type Row, type Side } from "./engine";

/**
 * What the 3D mat shows for a board, place by place: the same cards, numbers and choices as the HTML board, and a tap
 * exactly where the HTML board has a button. The 3D scene only draws this list; it knows no rule.
 */

/** What is painted on a card. */
export interface FaceSpec {
	card: CardId;
	name: string;
	/** The line under the picture: ATK, or DEF in Defense Position, or the kind of a Spell or Trap. */
	line: string;
	/** A second, smaller line: a Pendulum Scale, the Xyz Materials, the Level. */
	note?: string;
	/** On the mat a zone is small on the screen: the card shows its picture and its number only, both bigger. The name is in the zone's label and in the sentence beside the mat. */
	compact?: true;
}
export interface CardView {
	/** Changes when another card takes the place: the new one then arrives. */
	id: string;
	/** Null for a face-down card. */
	face: FaceSpec | null;
	/** The name on the back of the child's own face-down card. */
	backName?: string;
	/** Defense Position: the card is turned sideways. */
	turned: boolean;
	/** Xyz Materials under it. */
	under: number;
	/** It appears after this many seconds, while an effect plays. */
	delay: number;
	/** The face it keeps showing for some seconds: the numbers before the effect that changes them. */
	hold?: { face: FaceSpec; delay: number };
}
export type PlaceState = "plain" | "glow" | "chosen";
export interface PlaceView {
	place: MatPlace;
	state: PlaceState;
	/** Missing where the HTML board has no button. */
	tap?: () => void;
	/** Printed on the mat but not part of this level: dimmed, and never tapped. */
	quiet: boolean;
	card?: CardView;
	/** A pile: how many cards, and what its top card shows (null: a face-down card). */
	pile?: { count: number; top: FaceSpec | null };
	/** A pile a card is flying to: it keeps showing what it held before the move, for this many seconds. */
	pileHold?: { count: number; top: FaceSpec | null; delay: number };
}

/**
 * Holds back the piles that cards are still flying to: a Graveyard shows a destroyed monster on top when the monster
 * lands there, not while it is still on its way. `before` is the mat as it was, `arrivals` when the last card lands
 * in each place, in seconds.
 */
export function holdPiles(now: readonly PlaceView[], before: readonly PlaceView[], arrivals: ReadonlyMap<string, number>): PlaceView[] {
	if (arrivals.size === 0) return [...now];
	const was = new Map(before.map((item) => [item.place.key, item]));
	return now.map((item) => {
		const delay = arrivals.get(item.place.key);
		const old = was.get(item.place.key)?.pile;
		return delay !== undefined && item.pile && old && old.count < item.pile.count ? { ...item, pileHold: { ...old, delay } } : item;
	});
}

const stars = (count: number) => "★".repeat(Math.min(count, 12));

/** A card as printed, for the hand and the piles: both numbers of a monster, the kind of a Spell or Trap. */
export function printedFace(copy: PlayCopy, card: CardId): FaceSpec {
	const info = cardOf(card);
	const name = copy.cards[card].name;
	if (info.kind !== "monster") return { card, name, line: cardType(copy, card) };
	const grade = info.link ? `🔗 ${info.link}` : info.rank ? `${copy.rank} ${info.rank}` : stars(info.level);
	return { card, name, line: info.link ? `${copy.atk} ${info.atk}` : `${info.atk} / ${info.def}`, note: info.scale !== undefined ? `${grade}  ◈${info.scale}` : grade };
}

/** A monster on the field: the number that counts in its position, as it is now or as given. */
export function monsterFace(copy: PlayCopy, board: Board, slot: MonsterSlot, numbers?: { atk: number; def: number }): FaceSpec {
	const info = monsterOf(slot.card);
	const atk = numbers?.atk ?? atkOf(slot, board);
	const def = numbers?.def ?? defOf(slot, board);
	const note = slot.materials ? "▬".repeat(slot.materials.length) || "∅" : info.scale !== undefined ? `◈${info.scale}` : undefined;
	return { card: slot.card, name: copy.cards[slot.card].name, line: slot.position === "defense" ? `${copy.def} ${def}` : `${copy.atk} ${atk}`, ...(note ? { note } : {}), compact: true };
}

export interface MatViewInput {
	board: Board;
	copy: PlayCopy;
	layout: MatLayout;
	glow?: ReadonlySet<string> | undefined;
	chosen?: ReadonlySet<string> | undefined;
	/** Monster Zones a card lands in while an effect plays, with the seconds to wait. */
	landing?: ReadonlyMap<string, number> | undefined;
	/** Monsters that keep their old numbers for some seconds. */
	holding?: ReadonlyMap<string, { atk: number; def: number; delay: number }> | undefined;
	onZone?: ((side: Side, row: Row, zone: number) => void) | undefined;
	onPile?: ((side: Side, pile: "graveyard" | "extra" | "banished") => void) | undefined;
}

export function matView({ board, copy, layout, glow, chosen, landing, holding, onZone, onPile }: MatViewInput): PlaceView[] {
	return layout.places.map((place): PlaceView => {
		const { key, kind, side, zone } = place;
		const mine = board[side];
		/* A zone the level's board does not have: printed on the mat, nothing more. */
		if (zone < 0) return { place, state: "plain", quiet: true };
		const quiet = place.quiet;
		const state: PlaceState = quiet ? "plain" : chosen?.has(key) ? "chosen" : glow?.has(key) ? "glow" : "plain";
		const zoneTap = (row: Row, active: boolean) => (onZone && active && !quiet ? { tap: () => onZone(side, row, zone) } : {});
		switch (kind) {
			case "monsters": {
				const slot = mine.monsters[zone];
				const hold = slot ? holding?.get(key) : undefined;
				/* A face-down monster shows the back of a card, sideways; only its controller reads its name. */
				const card: CardView | undefined = !slot
					? undefined
					: slot.faceDown
						? { id: `${key}:down`, face: null, ...(side === "you" ? { backName: copy.cards[slot.card].name } : {}), turned: true, under: 0, delay: landing?.get(key) ?? 0 }
						: { id: `${key}:${slot.card}`, face: monsterFace(copy, board, slot), turned: slot.position === "defense", under: slot.materials?.length ?? 0, delay: landing?.get(key) ?? 0, ...(hold ? { hold: { face: monsterFace(copy, board, slot, hold), delay: hold.delay } } : {}) };
				return { place, state, quiet, ...zoneTap("monsters", true), ...(card ? { card } : {}) };
			}
			case "backrow": {
				const slot = mine.backrow[zone];
				/* A Pendulum Monster in a Pendulum Zone is face-up and shows its Scale; a Continuous or Equip card is face-up; anything else here is Set face-down. */
				const card: CardView | undefined = !slot
					? undefined
					: slot.up
						? { id: `${key}:${slot.card}`, face: { card: slot.card, name: copy.cards[slot.card].name, line: `${copy.scale} ${monsterOf(slot.card).scale ?? 0}`, compact: true }, turned: false, under: 0, delay: 0 }
						: slot.open
							? { id: `${key}:${slot.card}`, face: { ...printedFace(copy, slot.card), compact: true }, turned: false, under: 0, delay: 0 }
							: { id: `${key}:${slot.card}`, face: null, ...(side === "you" ? { backName: copy.cards[slot.card].name } : {}), turned: false, under: 0, delay: 0 };
				/* Nothing can be done with the rival's Spell & Trap row: it is shown, not offered as a control. */
				return { place, state, quiet, ...zoneTap("backrow", side === "you"), ...(card ? { card } : {}) };
			}
			case "field": {
				const held = mine.field;
				return { place, state, quiet, ...zoneTap("field", side === "you"), ...(held ? { card: { id: `${key}:${held}`, face: { ...printedFace(copy, held), compact: true }, turned: false, under: 0, delay: 0 } } : {}) };
			}
			case "deck":
				/* On the small board a Deck is only part of the level when the level uses one. */
				return { place, state: "plain", quiet: !board.full && mine.deck.length === 0, pile: { count: mine.deck.length, top: null } };
			case "graveyard": {
				const top = mine.graveyard.at(-1);
				/* Only the whole mat lets a pile be opened. */
				return { place, state, quiet: false, ...(onPile && board.full ? { tap: () => onPile(side, "graveyard") } : {}), pile: { count: mine.graveyard.length, top: top ? printedFace(copy, top) : null } };
			}
			case "banished": {
				const top = mine.banished.at(-1);
				return { place, state, quiet, ...(onPile && !quiet ? { tap: () => onPile(side, "banished") } : {}), pile: { count: mine.banished.length, top: top && !top.faceDown ? printedFace(copy, top.card) : null } };
			}
			case "extra": {
				const count = mine.extra.length + mine.extraUp.length;
				const up = mine.extraUp.at(-1);
				/* The Extra Deck is face-down: its owner may look through it, the opponent may not. */
				return { place, state, quiet, ...(onPile && side === "you" && !quiet ? { tap: () => onPile(side, "extra") } : {}), pile: { count, top: up ? printedFace(copy, up) : null } };
			}
		}
	});
}
