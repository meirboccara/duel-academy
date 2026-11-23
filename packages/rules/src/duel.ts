import type { CardDef, SpellSpeed } from "./effects";
import { type GameEvent, raiseEvent, type Waiting } from "./events";
import { NOTHING_USED, type Used } from "./once";
import { locked, type Modifier } from "./modifiers";
import type { Building } from "./triggers";
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
	/** Step 6: the stamp (`Duel.clock`) of the moment it came face-up on the field: when its continuous effects began to apply. */
	readonly since: number;
}

/** Step 2 only tells a Main Phase from the others; steps inside the Battle Phase come later. */
export type Phase = "draw" | "standby" | "main1" | "battle" | "main2" | "end";
export const PHASES: readonly Phase[] = ["draw", "standby", "main1", "battle", "main2", "end"];

/**
 * One activation on the chain (step 2 of docs/rules-core-spec.md). Link 1 is `chain[0]`; the last link is the top.
 * Everything a later link or the resolution needs is frozen here when the card or effect is activated.
 */
export interface Link {
	/** Who activated it. */
	readonly player: Side;
	/** The card as it was when activated (placed face-up for a card activation, before any cost): id, zone, `moves`. */
	readonly card: CardInstance;
	/** Which effect of the card: its index in the card's `effects`. */
	readonly effect: number;
	readonly speed: SpellSpeed;
	/** The cards chosen as targets at activation. */
	readonly targets: readonly number[];
	/** Each target's `moves` at activation: a target that has moved since is a new card and is no longer the target (`targetsOf`). */
	readonly targetMoves: readonly number[];
	/**
	 * The link on top of the chain when this was activated: the one it responds to (its place in `duel.chain`). `null` for
	 * Chain Link 1, and for a trigger effect put on a chain at a trigger point, which answers nothing. Chain links only ever
	 * go on top, so this is the link right below it today; it is kept so that an effect that negates "the effect it answered"
	 * negates this link and never another once step 5 can change the chain from below.
	 */
	readonly answers: number | null;
	/** The once-per-turn use this activation spent (its key in `duel.used`), if its effect has a limit. */
	readonly spent: string | null;
	/** What the effect declared it would do ("search", "draw"...), so another card can respond to "an effect that would...". */
	readonly categories: readonly string[];
	/** The activation itself was negated: the link does nothing, as if the card had not been activated. */
	readonly activationNegated: boolean;
	/** The activation stands, but the effect is not applied. */
	readonly effectNegated: boolean;
}

/**
 * Who may act now, following Konami's Fast Effect Timing chart.
 * `open`: the game state is open (box A): the turn player is free to take any action, and if both players pass the
 * turn moves on. It closes on any action and opens again once both players have passed with no chain.
 * `passed`: who has passed since the last activation or action; when both have, the chain resolves.
 */
export interface Priority {
	readonly holder: Side;
	readonly passed: readonly Side[];
	readonly open: boolean;
}

/** Teaching options limit what a player is offered; they never change how a card resolves. */
export interface TeachingOptions {
	/** The most links a chain may have; nothing is offered beyond it. `null`: no limit. */
	readonly chainLimit: number | null;
	/**
	 * `false` (the default): a player with nothing to respond with passes automatically, so a response window only
	 * shows when they hold a legal response. `true`: every chance to respond is shown, even when only "pass" is legal.
	 */
	readonly everyWindow: boolean;
}

export interface Duel {
	readonly cards: Readonly<Record<number, CardInstance>>;
	/** The ids in each pile, in order: index 0 is the top of the Deck. A card sits in its controller's pile. */
	readonly piles: Readonly<Record<Side, Readonly<Record<Zone, readonly number[]>>>>;
	readonly rng: { readonly seed: number; readonly state: number };
	readonly turn: { readonly player: Side; readonly number: number; readonly phase: Phase };
	readonly chain: readonly Link[];
	readonly priority: Priority;
	/** The Spells and Traps Set this turn (ids): a Trap or a Quick-Play Spell among them cannot be activated yet. */
	readonly setThisTurn: readonly number[];
	readonly options: TeachingOptions;
	/** The last things that happened (step 3): events since the last break, which a fast effect may still answer. */
	readonly live: readonly GameEvent[];
	/**
	 * Step 6: the `added-to-hand` events of the chain that has just resolved, which an effect marked `lingers` may still answer (Droll & Lock Bird: Konami's
	 * notes say it can be activated after the chain in which the card was added). Cleared by the next break or activation.
	 */
	readonly lingering: readonly GameEvent[];
	/** Trigger effects whose condition was met and which wait for the next trigger point. */
	readonly waiting: readonly Waiting[];
	/** While trigger effects are being put on a chain: whose choice it is is in `priority.holder`. */
	readonly building: Building | null;
	/** The once-per-turn (Duel, chain) uses so far (step 4). */
	readonly used: Used;
	/** Life Points: 8000 each (step 5, for the costs of cards such as Solemn Judgment; no damage yet). */
	readonly lp: Readonly<Record<Side, number>>;
	/** The Summon being attempted, which a "would be Summoned" effect can answer: it succeeds when both players pass in a row with no chain. */
	readonly summoning: Summoning | null;
	/** The turn player has used their Normal Summon this turn (a Normal Set of a monster is not in step 5, and `set` does not touch this). */
	readonly normalSummoned: boolean;
	/**
	 * Step 6: what resolved effects leave behind for a while (negation of a card's effects, Shrink, Droll & Lock Bird's lock, a
	 * control change), as one list. `clock` stamps them in the order they began to apply. The continuous effects of cards on the
	 * field are not in the list: they are read from the board when asked (src/modifiers.ts).
	 */
	readonly modifiers: readonly Modifier[];
	/** The last stamp given: modifiers and cards that came face-up on the field take the next one. */
	readonly clock: number;
	/** While a link resolves and its effect waits for a choice that is not a target: the whole chain, and the choice. */
	readonly asking: Asking | null;
	/** How many groups of simultaneous moves (`moveCards`) have happened: the last one's number tags its events. */
	readonly batches: number;
	/** What each card code does, as effect records (src/effects.ts): shared by reference, never copied, never changed. */
	readonly defs: Readonly<Record<string, CardDef>>;
}

/** The Summon in progress: it has been attempted and has not succeeded yet (step 5). The monster stays where it was, not on the field. */
export interface Summoning {
	readonly player: Side;
	readonly cards: readonly number[];
	readonly how: "normal" | "special";
	/** A negator took: the Summon will not succeed. */
	readonly negated: boolean;
}

/** A chain resolving, paused on a choice of its effect's player (`legalActions` lists the candidates as `choose`). */
export interface Asking {
	/** The whole chain as activated, for what happens to its cards once it has resolved (filled in when the chain pauses). */
	readonly links: readonly Link[];
	readonly player: Side;
	readonly from: readonly number[];
	readonly then: (duel: Duel, picked: number) => Duel;
	/** The events the links resolved before it raised (step 6, `Duel.lingering`): kept across the pause. */
	readonly carried?: readonly GameEvent[];
}

export interface DeckSetup {
	deck: readonly string[];
	extra?: readonly string[];
}

export interface DuelSetup {
	seed: number;
	you: DeckSetup;
	rival: DeckSetup;
	/** Who takes the first turn. Default: "you". */
	first?: Side;
	defs?: Readonly<Record<string, CardDef>>;
	options?: Partial<TeachingOptions>;
}

/** Each player starts a Duel with 8000 LP (RB10, "Life Points"). */
export const STARTING_LP = 8000;

/** Priority in a closed game state with nobody having passed: after an action or a chain, `holder` may use a fast effect first. */
export const closedPriority = (holder: Side): Priority => ({ holder, passed: [], open: false });

/** Step 7 gives the exact zones; until then a side holds at most five monsters. */
export const MONSTER_ZONES = 5;

export const other = (side: Side): Side => (side === "you" ? "rival" : "you");

const ZONES: readonly Zone[] = ["deck", "hand", "extra", "monster", "spell", "field", "graveyard", "banished"];
const ON_FIELD: ReadonlySet<Zone> = new Set(["monster", "spell", "field"]);
const FACE_DOWN_BY_DEFAULT: ReadonlySet<Zone> = new Set(["deck", "hand", "extra"]);

const emptyPiles = (): Record<Zone, number[]> => Object.fromEntries(ZONES.map((zone) => [zone, []])) as unknown as Record<Zone, number[]>;

export const isOnField = (zone: Zone) => ON_FIELD.has(zone);

/** A new duel: both Decks shuffled, turn 1, Draw Phase, the game state open. Nothing is drawn yet. */
export function createDuel(setup: DuelSetup): Duel {
	const rng = createRng(setup.seed);
	const cards: Record<number, CardInstance> = {};
	const piles = { you: emptyPiles(), rival: emptyPiles() };
	let nextId = 1;
	for (const side of ["you", "rival"] as const) {
		for (const zone of ["deck", "extra"] as const) {
			for (const code of setup[side][zone] ?? []) {
				const id = nextId++;
				cards[id] = { id, code, owner: side, controller: side, zone, face: "down", moves: 0, extraDeck: zone === "extra", since: 0 };
				piles[side][zone].push(id);
			}
		}
		const deck = piles[side].deck;
		for (let i = deck.length - 1; i > 0; i--) {
			const j = rng.int(i + 1);
			[deck[i], deck[j]] = [deck[j]!, deck[i]!];
		}
	}
	const first = setup.first ?? "you";
	const options: TeachingOptions = { chainLimit: null, everyWindow: false, ...setup.options };
	if (options.chainLimit !== null && !(Number.isInteger(options.chainLimit) && options.chainLimit >= 1)) {
		throw new RangeError(`a teaching chain limit needs at least one link, got ${options.chainLimit}`);
	}
	return {
		cards,
		piles,
		rng: { seed: setup.seed, state: rng.state },
		turn: { player: first, number: 1, phase: "draw" },
		chain: [],
		priority: { holder: first, passed: [], open: true },
		setThisTurn: [],
		options,
		live: [],
		lingering: [],
		waiting: [],
		building: null,
		used: NOTHING_USED,
		lp: { you: STARTING_LP, rival: STARTING_LP },
		summoning: null,
		normalSummoned: false,
		modifiers: [],
		clock: 0,
		asking: null,
		batches: 0,
		defs: setup.defs ?? {},
	};
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
export function moveCard(duel: Duel, id: number, to: MoveTo): Duel {
	return move(duel, id, to, undefined);
}

/** `negated`: the move of a Spell or Trap Card whose activation was negated, or of a monster whose Summon was negated (`GameEvent`). */
type MoveTo = { zone: Zone; face?: Face; at?: "top" | "bottom"; controller?: Side; negated?: true; reason?: "destroyed" };

/**
 * Destroys a card: it goes to the Graveyard and the move says it was destroyed (`moved.reason`), which "when destroyed" triggers
 * look at. `negated`: the card never reached the field (a negated activation or Summon). Konami: destroying is an action that
 * sends a card to the Graveyard (rule record `trigger-sent-to-graveyard`).
 */
export function destroyCard(duel: Duel, id: number, options: { negated?: true } = {}): Duel {
	return move(duel, id, { zone: "graveyard", reason: "destroyed", ...options }, undefined);
}

/**
 * Moves several cards at the same time, as one effect does ("send all monsters ... to the Graveyard"). Each moves like
 * `moveCard` and raises its own `moved` event, all sharing one `batch`, so an "each time" trigger counts them once.
 */
export function moveCards(duel: Duel, ids: readonly number[], to: MoveTo): Duel {
	if (ids.length === 0) return duel;
	const batch = duel.batches + 1;
	return ids.reduce((next, id) => move(next, id, to, batch), { ...duel, batches: batch });
}

function move(duel: Duel, id: number, to: MoveTo, batch: number | undefined): Duel {
	const before = instance(duel, id);
	if (before.zone === "deck" && to.zone === "hand" && locked(duel, "add-to-hand", before.owner)) return duel;
	if (to.controller !== undefined && !isOnField(to.zone)) throw new Error("a controller can be chosen only on the field");
	const zone = before.extraDeck && (to.zone === "deck" || to.zone === "hand") ? "extra" : to.zone;
	const controller = isOnField(zone) ? (to.controller ?? before.controller) : before.owner;
	const face = to.face ?? (FACE_DOWN_BY_DEFAULT.has(zone) ? "down" : "up");
	const flippedDown = isOnField(zone) && before.face === "up" && face === "down";
	const renewed = zone !== before.zone || controller !== before.controller || flippedDown;
	// A card that comes face-up on the field starts to apply its continuous effects now (a move in the same zone, face-up, does not restart them).
	const cameUp = isOnField(zone) && face === "up" && (before.face === "down" || !isOnField(before.zone) || controller !== before.controller);
	const after = { ...before, zone, face, controller, moves: before.moves + (renewed ? 1 : 0), since: cameUp ? duel.clock + 1 : before.since };
	const placed = place(duel, before, after, to.at ?? "top");
	const moved = cameUp ? { ...placed, clock: placed.clock + 1 } : placed;
	if (!renewed) return moved;
	const raised = raiseEvent(moved, { type: "moved", before, after, batch, ...(to.negated ? { negated: true as const } : {}), ...(to.reason ? { reason: to.reason } : {}) });
	return zone === "hand" && before.zone !== "hand" ? raiseEvent(raised, { type: "added-to-hand", card: after, from: before.zone, ...(batch === undefined ? {} : { batch }) }) : raised;
}

/** Gives control of a card on the field to a player: it becomes a new card for them. Its owner never changes. */
export function changeControl(duel: Duel, id: number, side: Side): Duel {
	const before = instance(duel, id);
	if (!isOnField(before.zone)) throw new Error(`card ${id} is not on the field`);
	if (before.controller === side) return duel;
	const after = { ...before, controller: side, moves: before.moves + 1, since: before.face === "up" ? duel.clock + 1 : before.since };
	const placed = place(duel, before, after, "top");
	return raiseEvent(before.face === "up" ? { ...placed, clock: placed.clock + 1 } : placed, { type: "moved", before, after });
}
