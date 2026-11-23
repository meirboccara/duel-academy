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
	/** Step 6b: its battle position in the Monster Zone (face-down monsters are in Defense Position). Elsewhere, `attack`. */
	readonly position: Position;
	/**
	 * Step 7: its exact zone on the field, `null` off the field. Main Monster and Spell & Trap Zones: 0 to 4 from the controller's left.
	 * Extra Monster Zones: 5 and 6, the two shared zones as seen by `you` (5 over your second column, 6 over your fourth), whoever controls
	 * the monster there. Field Zone: 0.
	 */
	readonly slot: number | null;
	/** Step 7: the monster this Equip Card is equipped to (its id), `null` when it equips nothing. */
	readonly equippedTo: number | null;
}

export type Position = "attack" | "defense";

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
	/** Step 7: a Spell or Trap Card activated from where it was Set (face-down on the field), not from the hand. */
	readonly wasSet: boolean;
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
	/** Step 6b: the attack in progress, from its declaration to the end of its Damage Step (src/battle.ts). */
	readonly battle: Battle | null;
	/** Step 6b: the monsters that have declared an attack this turn, each as it was (a card that moved is a new card). */
	readonly attacked: readonly CardRef[];
	/** Step 6b: after a replay, the monster that may declare an attack again although it already has. */
	readonly replay: CardRef | null;
	/** Step 6b: who won (`draw` when both reached 0 LP at the same time). Once set, nothing more is offered. */
	readonly winner: Side | "draw" | null;
	/** How many groups of simultaneous moves (`moveCards`) have happened: the last one's number tags its events. */
	readonly batches: number;
	/** What each card code does, as effect records (src/effects.ts): shared by reference, never copied, never changed. */
	readonly defs: Readonly<Record<string, CardDef>>;
}

/** A card as it was: its id and its `moves` then. It is still that card while its `moves` has not changed. */
export interface CardRef {
	readonly id: number;
	readonly moves: number;
}

export const refOf = (card: CardInstance): CardRef => ({ id: card.id, moves: card.moves });
/** Is the card still the one referred to (it has not moved since)? */
export const isStill = (duel: Duel, ref: CardRef): boolean => duel.cards[ref.id]!.moves === ref.moves;

/** The Damage Step's timings (Konami's Damage Step Rules): start, before damage calculation, after it, end. Damage calculation itself has no window here. */
export type DamageStep = "start" | "before" | "after" | "end";

/** An attack: `step` is `declared` in the Battle Step (after the declaration), then each timing of the Damage Step. */
export interface Battle {
	readonly attacker: CardRef;
	/** The attack target, or `null` for a direct attack. */
	readonly target: CardRef | null;
	/** The opponent's monsters when the attack was declared: a new one there before the Damage Step causes a replay. */
	readonly defenders: readonly CardRef[];
	readonly step: "declared" | DamageStep;
	/** Decided at damage calculation, sent to the Graveyard at the end of the Damage Step (Damage Step Rules). */
	readonly destroyed: readonly CardRef[];
	/** The attack target flipped face-up before damage calculation: its "when flipped" effects wait until after it. */
	readonly flipped: CardRef | null;
}

/** The Summon in progress: it has been attempted and has not succeeded yet (step 5). The monster stays where it was, not on the field. */
export interface Summoning {
	readonly player: Side;
	readonly cards: readonly number[];
	readonly how: "normal" | "special";
	/** Step 7: the zone each monster was Summoned to (from the player's left), chosen when the Summon was attempted. */
	readonly slots?: readonly number[];
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
	/** Step 7: `from` holds zones (from the player's left), not cards: the choice is a `place` action. */
	readonly zones?: true;
	/** Step 7: a choice asked outside a chain (a monster going back to its owner): what happens once it is answered, instead of the chain. */
	readonly resume?: (duel: Duel) => Duel;
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

/** Each player has 5 Main Monster Zones and 5 Spell & Trap Zones (RB10); the two Extra Monster Zones (slots 5 and 6) are shared. */
export const MONSTER_ZONES = 5;
export const SPELL_ZONES = 5;
export const EXTRA_MONSTER_SLOTS: readonly number[] = [5, 6];

/** The card in an exact zone, if any: an Extra Monster Zone slot is looked up on both sides of the field. */
export function occupant(duel: Duel, side: Side, zone: "monster" | "spell" | "field", slot: number): CardInstance | null {
	const sides: readonly Side[] = zone === "monster" && slot >= MONSTER_ZONES ? ["you", "rival"] : [side];
	for (const owner of sides) {
		for (const id of duel.piles[owner][zone]) if (duel.cards[id]!.slot === slot) return duel.cards[id]!;
	}
	return null;
}

/** The free Main Monster Zones or Spell & Trap Zones of a player, from their left. */
export function freeSlots(duel: Duel, side: Side, zone: "monster" | "spell"): number[] {
	const taken = new Set(duel.piles[side][zone].map((id) => duel.cards[id]!.slot));
	const free: number[] = [];
	for (let slot = 0; slot < (zone === "monster" ? MONSTER_ZONES : SPELL_ZONES); slot++) if (!taken.has(slot)) free.push(slot);
	return free;
}

const slotsOf = (zone: Zone): number => (zone === "monster" ? MONSTER_ZONES + EXTRA_MONSTER_SLOTS.length : zone === "spell" ? SPELL_ZONES : 1);

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
				cards[id] = { id, code, owner: side, controller: side, zone, face: "down", moves: 0, extraDeck: zone === "extra", since: 0, position: "attack", slot: null, equippedTo: null };
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
		battle: null,
		attacked: [],
		replay: null,
		winner: null,
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
/** `position`: in the Monster Zone (default: Defense Position face-down, else the position it had there, else Attack Position). `by`: a destruction by battle. */
/** `slot`: the exact zone on the field (step 7); by default the zone it is in when it stays in the same zone, else the first free one. */
type MoveTo = { zone: Zone; face?: Face; at?: "top" | "bottom"; controller?: Side; negated?: true; reason?: "destroyed"; by?: "battle"; position?: Position; slot?: number };

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
	// RB10: a Pendulum Monster Card on the field that would be sent to the Graveyard is placed face-up on its owner's Extra Deck instead.
	// A card whose activation was negated was never on the field (record `negated-card-not-from-field`): it goes to the Graveyard.
	const pendulumOut = to.zone === "graveyard" && !to.negated && isOnField(before.zone) && duel.defs[before.code]?.facts?.pendulum !== undefined;
	const zone = pendulumOut ? "extra" : before.extraDeck && (to.zone === "deck" || to.zone === "hand") ? "extra" : to.zone;
	const controller = isOnField(zone) ? (to.controller ?? before.controller) : before.owner;
	const face = pendulumOut ? "up" : (to.face ?? (FACE_DOWN_BY_DEFAULT.has(zone) ? "down" : "up"));
	const flippedDown = isOnField(zone) && before.face === "up" && face === "down";
	const renewed = zone !== before.zone || controller !== before.controller || flippedDown;
	// A card that comes face-up on the field starts to apply its continuous effects now (a move in the same zone, face-up, does not restart them).
	const cameUp = isOnField(zone) && face === "up" && (before.face === "down" || !isOnField(before.zone) || controller !== before.controller);
	const position: Position = zone !== "monster" ? "attack" : (to.position ?? (face === "down" ? "defense" : before.zone === "monster" ? before.position : "attack"));
	const slot = isOnField(zone) ? slotFor(duel, before, zone as "monster" | "spell" | "field", controller, to.slot) : null;
	// RB10: to use another Field Spell, the previous one is sent to the Graveyard (the core does it when the new one is placed).
	const previousField = zone === "field" ? occupant(duel, controller, "field", 0) : null;
	if (previousField && previousField.id !== before.id) duel = move(duel, previousField.id, { zone: "graveyard" }, batch);
	const after = { ...before, zone, face, controller, position, slot, equippedTo: renewed && !(before.zone === "spell" && zone === "spell" && face === "up" && !flippedDown) ? null : before.equippedTo, moves: before.moves + (renewed ? 1 : 0), since: cameUp ? duel.clock + 1 : before.since };
	const placed = place(duel, before, after, to.at ?? "top");
	const moved = cameUp ? { ...placed, clock: placed.clock + 1 } : placed;
	if (!renewed) return moved;
	const raised = raiseEvent(moved, { type: "moved", before, after, batch, ...(to.negated ? { negated: true as const } : {}), ...(to.reason ? { reason: to.reason } : {}), ...(to.by ? { by: to.by } : {}) });
	const added = zone === "hand" && before.zone !== "hand" ? raiseEvent(raised, { type: "added-to-hand", card: after, from: before.zone, ...(batch === undefined ? {} : { batch }) }) : raised;
	// RB10: if the equipped monster is destroyed, flipped face-down or removed from the field, its Equip Cards are destroyed.
	const unequipped = before.zone === "monster" && before.face === "up" && (zone !== "monster" || face === "down");
	return unequipped ? equipsOf(added, before.id).reduce((next, equipId) => move(next, equipId, { zone: "graveyard", reason: "destroyed" }, undefined), added) : added;
}

/** The Equip Cards on the field equipped to the monster `id`. */
export function equipsOf(duel: Duel, id: number): number[] {
	const found: number[] = [];
	for (const side of ["you", "rival"] as const) for (const zone of ["spell", "monster"] as const) for (const other of duel.piles[side][zone]) if (duel.cards[other]!.equippedTo === id) found.push(other);
	return found;
}

/**
 * Equips the Equip Card `equipId` to the monster `monsterId` (RB10, Equip Spell Cards): the Equip Card stays in its Spell & Trap Zone,
 * linked to that monster. Nothing happens unless the Equip Card is face-up in a Spell & Trap Zone and the monster face-up in a Monster
 * Zone: an Equip Spell left unequipped is then sent to the Graveyard after the chain like any other Spell (YGOProJudge, no source cited).
 * The link ends when the Equip Card leaves (`move`); the Equip Card is destroyed when the monster leaves or turns face-down.
 */
export function equip(duel: Duel, equipId: number, monsterId: number | null): Duel {
	const card = duel.cards[equipId]!;
	if (monsterId === null || card.zone !== "spell" || card.face !== "up") return duel;
	const monster = duel.cards[monsterId]!;
	if (monster.zone !== "monster" || monster.face !== "up") return duel;
	return { ...duel, cards: { ...duel.cards, [equipId]: { ...card, equippedTo: monsterId } } };
}

/** The exact zone a card goes to: the one asked for (in range and free), or the one it is in, or the first free one. */
function slotFor(duel: Duel, before: CardInstance, zone: "monster" | "spell" | "field", controller: Side, asked: number | undefined): number {
	if (asked !== undefined) {
		if (!Number.isInteger(asked) || asked < 0 || asked >= slotsOf(zone)) throw new Error(`no slot ${asked} in the ${zone} zone`);
		const there = occupant(duel, controller, zone, asked);
		if (there && there.id !== before.id) throw new Error(`the ${zone} zone ${asked} of ${controller} is occupied`);
		return asked;
	}
	if (before.zone === zone && before.controller === controller && before.slot !== null) return before.slot;
	if (zone === "field") return 0;
	const free = freeSlots(duel, controller, zone);
	if (free.length === 0) throw new Error(`${controller} has no free ${zone} zone`);
	return free[0]!;
}

/** Gives control of a card on the field to a player: it becomes a new card for them. Its owner never changes. */
export function changeControl(duel: Duel, id: number, side: Side, slot?: number): Duel {
	const before = instance(duel, id);
	if (!isOnField(before.zone)) throw new Error(`card ${id} is not on the field`);
	if (before.controller === side) return duel;
	// A monster in an Extra Monster Zone moves to a Main Monster Zone of its new controller, and back to one of its owner's (RB10).
	if (slot !== undefined && before.zone === "monster" && slot >= MONSTER_ZONES) throw new Error("a monster whose control changes goes to a Main Monster Zone");
	const placedSlot = slotFor(duel, { ...before, slot: null }, before.zone as "monster" | "spell" | "field", side, slot);
	// A Field Spell given to a player replaces theirs: RB10, one Field Spell a side (the one there is sent to the Graveyard).
	const previousField = before.zone === "field" ? occupant(duel, side, "field", 0) : null;
	if (previousField) duel = move(duel, previousField.id, { zone: "graveyard" }, undefined);
	const after = { ...before, controller: side, slot: placedSlot, moves: before.moves + 1, since: before.face === "up" ? duel.clock + 1 : before.since };
	const placed = place(duel, before, after, "top");
	return raiseEvent(before.face === "up" ? { ...placed, clock: placed.clock + 1 } : placed, { type: "moved", before, after });
}
