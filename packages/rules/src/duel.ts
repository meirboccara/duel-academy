import { createRng } from "./rng";

/**
 * Step 1 of docs/rules-core-spec.md: every physical card is its own instance. A card's code says what it is; its id
 * says which copy it is. Owner and controller are kept apart, and `moves` counts every move, so later steps can tell a
 * card that left and came back from the one that was there before (the 2021 rule on moved cards, per-copy once per
 * turn). Zones are coarse here; step 7 adds the exact layout.
 */
export type Side = "you" | "rival";
export type Zone = "deck" | "hand" | "extra" | "monster" | "spell" | "field" | "graveyard" | "banished";
export type Face = "up" | "down";

export interface CardInstance {
	readonly id: number;
	readonly code: string;
	readonly owner: Side;
	/** Who controls it. Off the field, always the owner. */
	readonly controller: Side;
	readonly zone: Zone;
	readonly face: Face;
	/**
	 * How many times it has become a new card: each change of zone, change of control, or flip face-down on the field.
	 * A move within the same zone (another Monster Zone, a change to face-up) does not count.
	 */
	readonly moves: number;
	/** It starts in the Extra Deck, and goes back there instead of the Deck or the hand. */
	readonly extraDeck: boolean;
}

export interface Duel {
	readonly cards: Readonly<Record<number, CardInstance>>;
	/** The ids in each pile, in order: index 0 is the top of the Deck. A card sits in its controller's pile. */
	readonly piles: Readonly<Record<Side, Readonly<Record<Zone, readonly number[]>>>>;
	readonly rng: { readonly seed: number; readonly state: number };
}

export interface DeckSetup {
	deck: readonly string[];
	extra?: readonly string[];
}

const ZONES: readonly Zone[] = ["deck", "hand", "extra", "monster", "spell", "field", "graveyard", "banished"];
const ON_FIELD: ReadonlySet<Zone> = new Set(["monster", "spell", "field"]);
const FACE_DOWN_BY_DEFAULT: ReadonlySet<Zone> = new Set(["deck", "hand", "extra"]);

const emptyPiles = (): Record<Zone, number[]> => Object.fromEntries(ZONES.map((zone) => [zone, []])) as unknown as Record<Zone, number[]>;

export const isOnField = (zone: Zone) => ON_FIELD.has(zone);

export function createDuel(setup: { seed: number; you: DeckSetup; rival: DeckSetup }): Duel {
	const rng = createRng(setup.seed);
	const cards: Record<number, CardInstance> = {};
	const piles = { you: emptyPiles(), rival: emptyPiles() };
	let nextId = 1;
	for (const side of ["you", "rival"] as const) {
		for (const zone of ["deck", "extra"] as const) {
			for (const code of setup[side][zone] ?? []) {
				const id = nextId++;
				cards[id] = { id, code, owner: side, controller: side, zone, face: "down", moves: 0, extraDeck: zone === "extra" };
				piles[side][zone].push(id);
			}
		}
		const deck = piles[side].deck;
		for (let i = deck.length - 1; i > 0; i--) {
			const j = rng.int(i + 1);
			[deck[i], deck[j]] = [deck[j]!, deck[i]!];
		}
	}
	return { cards, piles, rng: { seed: setup.seed, state: rng.state } };
}

/** The cards in a player's pile, in order (the top of the Deck first). */
export function cardsIn(duel: Duel, side: Side, zone: Zone): CardInstance[] {
	return duel.piles[side][zone].map((id) => duel.cards[id]!);
}

function instance(duel: Duel, id: number): CardInstance {
	const found = duel.cards[id];
	if (!found) throw new Error(`no card with id ${id}`);
	return found;
}

function place(duel: Duel, before: CardInstance, after: CardInstance, at: "top" | "bottom"): Duel {
	const without = duel.piles[before.controller][before.zone].filter((other) => other !== before.id);
	const piles = { you: { ...duel.piles.you }, rival: { ...duel.piles.rival } };
	piles[before.controller][before.zone] = without;
	const target = piles[after.controller][after.zone].filter((other) => other !== before.id);
	piles[after.controller][after.zone] = after.zone === "deck" && at === "top" ? [before.id, ...target] : [...target, before.id];
	return { ...duel, cards: { ...duel.cards, [before.id]: after }, piles };
}

/**
 * Moves a card. It keeps its id and owner. Off the field it goes to its owner's pile and its owner controls it again;
 * an Extra Deck monster sent to the Deck or the hand goes back to the Extra Deck. Onto the field it stays with its
 * controller, unless `controller` puts it on the other player's field. Default face: down in the Deck, hand and Extra
 * Deck, up elsewhere. A card goes on top of the Deck unless `at: "bottom"`.
 */
export function moveCard(duel: Duel, id: number, to: { zone: Zone; face?: Face; at?: "top" | "bottom"; controller?: Side }): Duel {
	const before = instance(duel, id);
	if (to.controller !== undefined && !isOnField(to.zone)) throw new Error("a controller can be chosen only on the field");
	const zone = before.extraDeck && (to.zone === "deck" || to.zone === "hand") ? "extra" : to.zone;
	const controller = isOnField(zone) ? (to.controller ?? before.controller) : before.owner;
	const face = to.face ?? (FACE_DOWN_BY_DEFAULT.has(zone) ? "down" : "up");
	const flippedDown = isOnField(zone) && before.face === "up" && face === "down";
	const renewed = zone !== before.zone || controller !== before.controller || flippedDown;
	return place(duel, before, { ...before, zone, face, controller, moves: before.moves + (renewed ? 1 : 0) }, to.at ?? "top");
}

/** Gives control of a card on the field to a player: it becomes a new card for them. Its owner never changes. */
export function changeControl(duel: Duel, id: number, side: Side): Duel {
	const before = instance(duel, id);
	if (!isOnField(before.zone)) throw new Error(`card ${id} is not on the field`);
	if (before.controller === side) return duel;
	return place(duel, before, { ...before, controller: side, moves: before.moves + 1 }, "top");
}
