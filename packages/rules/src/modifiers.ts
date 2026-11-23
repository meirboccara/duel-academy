import { type CardInstance, changeControl, destroyCard, type Duel, freeSlots, type Side } from "./duel";
import { askZone, type CardDef, type EffectRecord, inFieldRange, rangeOf } from "./effects";
import { cardColumn } from "./zones";

/**
 * Step 6 of docs/rules-core-spec.md: continuous effects as one list of timestamped modifiers, read as queries.
 *
 * Two sources feed every query:
 * - **Lasting modifiers**, `Duel.modifiers`: what a resolved effect leaves for a while ("until the end of this turn"): the negation
 *   of a card's effects, Shrink, a lock, a control change. Each has a `stamp` (the order they began to apply).
 * - **Continuous records** (`EffectRecord.type: "continuous"`): the card's own effect, read from the cards on the field when asked,
 *   never stored. A card is a source while it is face-up on the field, its effect is not negated and its `condition` holds, so a
 *   card that moves, turns face-down or is negated simply stops counting (RB10, "Continuous Effect": "ends once that monster is
 *   gone or is no longer face-up"). Its stamp is the moment it came face-up on the field (`CardInstance.since`).
 */

export type Stat = "atk" | "def" | "level";

/**
 * What a lock stops. `add-to-hand`: adding a card from the Main Deck to the hand (a draw, a search). `summon` (step 8): Summoning
 * a monster, in the `ways` the layer names (default: every way) and for the monsters its `only` accepts (default: every monster).
 */
export type LockKind = "add-to-hand" | "summon";

/** The ways of Summoning a lock can stop: a Normal Summon (Tribute Summons included), a Flip Summon, a Special Summon of any kind. A Set is not a Summon. */
export type SummonWay = "normal" | "flip" | "special";

export type Layer =
	/** "Its original ATK becomes halved": replaces the original value (and so any earlier "becomes"). */
	| { readonly kind: "base"; readonly stat: "atk" | "def"; readonly to: (original: number) => number }
	/** "Its ATK becomes 0", "its Level becomes 4": the value, from now on. */
	| { readonly kind: "set"; readonly stat: Stat; readonly to: number | ((duel: Duel, target: CardInstance) => number) }
	/** "Gains 300 ATK for each ...", "loses 800 ATK": added on top, read again on every query. */
	| { readonly kind: "add"; readonly stat: Stat; readonly by: number | ((duel: Duel, source: CardInstance | null, target: CardInstance) => number) }
	/** The card's effects are negated: its continuous effects and the effects it activates in the Monster Zone. */
	| { readonly kind: "negate" }
	/** "Neither player can ...": a lock on the players it names. */
	| { readonly kind: "lock"; readonly what: LockKind; readonly who: Side | "both"; readonly ways?: readonly SummonWay[]; readonly only?: (duel: Duel, card: CardInstance) => boolean }
	/** Bookkeeping for a control change that lasts: the card goes back to its owner when it ends. */
	| { readonly kind: "control"; readonly to: Side };

/** Which cards a modifier reaches: one card as it was (`moves` frozen: a card that moved is a new card), or any card the filter accepts. */
export type Affects = { readonly card: number; readonly moves: number } | ((duel: Duel, target: CardInstance, source: CardInstance | null) => boolean);

export interface Modifier {
	/** The place in the order the modifiers began to apply: a higher stamp applies later. */
	readonly stamp: number;
	readonly affects: Affects;
	/** The number of the turn at whose end it stops. */
	readonly until: number;
	readonly layer: Layer;
}

/** Adds a lasting modifier, stamped now. */
export function addModifier(duel: Duel, modifier: Omit<Modifier, "stamp">): Duel {
	const stamp = duel.clock + 1;
	return { ...duel, clock: stamp, modifiers: [...duel.modifiers, { ...modifier, stamp }] };
}

const reaches = (duel: Duel, affects: Affects, target: CardInstance, source: CardInstance | null): boolean =>
	typeof affects === "function" ? affects(duel, target, source) : affects.card === target.id && affects.moves === target.moves;

/** The modifiers that end with turn number `endedTurn` are gone (a control change still standing is given back first). */
export function withoutEnded(duel: Duel, endedTurn: number): Duel {
	// Between two turns nobody is asked: a monster still to give back (taken during the End Phase) takes its owner's first free zone.
	const returned = returnControl(duel, endedTurn, false);
	return returned.modifiers.some((modifier) => modifier.until <= endedTurn) ? { ...returned, modifiers: returned.modifiers.filter((modifier) => modifier.until > endedTurn) } : returned;
}

/**
 * The End Phase of turn number `turn` begins: each control change "until the End Phase" ends, and the card goes back to the player it
 * was taken from, if it is still the card that was taken (`moves` unchanged); it is then a new card for them (record
 * `control-until-end-phase`). That player chooses one of their free Main Monster Zones (Konami's notes; a monster from an Extra Monster
 * Zone goes to a Main Monster Zone, record `control-extra-zone-to-main`): the duel returned may be asking them (`Duel.asking`, `place`),
 * one card after the other. With no free Main Monster Zone the monster is destroyed: YGOProJudge (no source cited), no Konami page read.
 */
export function returnControl(duel: Duel, turn: number, choose = true): Duel {
	const ending = duel.modifiers.filter((modifier) => modifier.layer.kind === "control" && modifier.until <= turn);
	if (ending.length === 0) return duel;
	return giveBack({ ...duel, modifiers: duel.modifiers.filter((modifier) => !ending.includes(modifier)) }, ending, choose);
}

function giveBack(duel: Duel, ending: readonly Modifier[], choose: boolean): Duel {
	const [modifier, ...rest] = ending;
	if (!modifier) return duel;
	if (modifier.layer.kind !== "control" || typeof modifier.affects === "function") return giveBack(duel, rest, choose);
	const card = duel.cards[modifier.affects.card]!;
	if (card.moves !== modifier.affects.moves || card.zone !== "monster") return giveBack(duel, rest, choose);
	const to = modifier.layer.to;
	const zones = freeSlots(duel, to, "monster");
	if (zones.length === 0) return giveBack(destroyCard(duel, card.id), rest, choose);
	const back = (board: Duel, slot: number) => giveBack(changeControl(board, card.id, to, slot), rest, choose);
	return zones.length === 1 || !choose ? back(duel, zones[0]!) : askZone(duel, to, zones, back);
}

/**
 * "Take control of that monster until the End Phase": the card moves to `side`'s field now (a new card for them: what was applied to
 * it before ends, record `negated-monster-state`), and goes back when the End Phase of turn number `until` begins (`returnControl`). Control stays a
 * physical move (design D3): piles are kept by controller. The card must be on the field and controlled by the other player.
 */
export function takeControl(duel: Duel, id: number, side: Side, until: number): Duel {
	const before = duel.cards[id]!;
	const zones = freeSlots(duel, side, "monster");
	if (before.zone !== "monster" || before.controller === side) return duel;
	// With no free Main Monster Zone left when it resolves, the monster is destroyed by the game's rules and sent to its owner's
	// Graveyard; a card that takes control needs a free zone to be activated at all (its condition). YGOProJudge's chat answer only
	// (asked 2026-11-23, no source cited).
	if (zones.length === 0) return destroyCard(duel, id);
	// The player taking it chooses a free Main Monster Zone, also for a monster in an Extra Monster Zone (record `control-extra-zone-to-main`).
	const take = (board: Duel, slot: number) => {
		const taken = changeControl(board, id, side, slot);
		return addModifier(taken, { affects: { card: id, moves: taken.cards[id]!.moves }, until, layer: { kind: "control", to: before.controller } });
	};
	return zones.length === 1 ? take(duel, zones[0]!) : askZone(duel, side, zones, take);
}

/**
 * Negates the effects of a card on the field until the end of turn number `until` (the current turn: "until the end of this
 * turn"). It is the card as it is now; the card must be face-up in the Monster Zone, or nothing happens.
 */
export function negateCardEffects(duel: Duel, id: number, until: number): Duel {
	const card = duel.cards[id]!;
	if (card.zone !== "monster" || card.face !== "up") return duel;
	return addModifier(duel, { affects: { card: id, moves: card.moves }, until, layer: { kind: "negate" } });
}

/**
 * Step 7: "for the rest of this turn, all other Spell/Trap effects in this column are negated" (Infinite Impermanence). The column is
 * the one `source` is in now (Konami's notes: where the card is when it applies); every other card in a Spell & Trap Zone of that
 * column, on either side, is negated until the end of turn `until`, those that come there later included. A Spell or Trap effect
 * activated there stays negated if its card leaves as the cost (`negatedWhere`).
 */
export function negateColumn(duel: Duel, source: number, until: number): Duel {
	const column = cardColumn(duel.cards[source]!);
	if (column === null) return duel;
	const self = duel.cards[source]!;
	const other = (target: CardInstance) => target.id !== source || target.moves !== self.moves;
	return addModifier(duel, { affects: (_duel, target) => target.zone === "spell" && other(target) && cardColumn(target) === column, until, layer: { kind: "negate" } });
}

/**
 * Step 7: is a card negated where it was, as it was (`card` is a snapshot, as a link holds it): by a lasting negation of a place (a
 * column), even if the card has left since. Konami's Q&A on Wonder Wand and Infinite Impermanence: an effect activated in the column is
 * negated though the card was sent to the Graveyard as its cost.
 */
export function negatedWhere(duel: Duel, card: CardInstance): boolean {
	return duel.modifiers.some((modifier) => modifier.layer.kind === "negate" && typeof modifier.affects === "function" && modifier.affects(duel, card, null));
}

const printed = (duel: Duel, id: number, stat: Stat): number => duel.defs[duel.cards[id]!.code]?.facts?.[stat] ?? 0;

/** One modifier that reaches a card, with the card it comes from (`null` for a lasting modifier). */
interface Entry {
	readonly stamp: number;
	readonly layer: Layer;
	readonly source: CardInstance | null;
}

/** The codes of the cards that have a continuous record, per `defs` (shared by every duel, never changed). */
const continuousCodes = new WeakMap<object, ReadonlySet<string>>();

function codesWithContinuous(defs: Duel["defs"]): ReadonlySet<string> {
	let found = continuousCodes.get(defs);
	if (!found) {
		found = new Set(Object.values(defs).filter((def: CardDef) => def.effects?.some((effect) => effect.type === "continuous")).map((def) => def.code));
		continuousCodes.set(defs, found);
	}
	return found;
}

/** Nothing can change anything: no lasting modifier, no card with a continuous record. Every query answers at once. */
const quiet = (duel: Duel): boolean => duel.modifiers.length === 0 && codesWithContinuous(duel.defs).size === 0;

const ON_FIELD_PILES = ["monster", "spell", "field"] as const;

/**
 * The modifiers that reach the card now, oldest first: the lasting ones and those of the continuous records of the cards on the
 * field. `seen`: the cards whose negation is being worked out (a source is asked whether it is itself negated; a card already
 * being asked about counts as not negated, so two negators of each other cannot loop; no Konami page says what they do).
 */
function entriesFor(duel: Duel, target: CardInstance, seen: ReadonlySet<number>): Entry[] {
	const found: Entry[] = [];
	for (const modifier of duel.modifiers) if (reaches(duel, modifier.affects, target, null)) found.push({ stamp: modifier.stamp, layer: modifier.layer, source: null });
	const codes = codesWithContinuous(duel.defs);
	if (codes.size > 0) {
		for (const side of ["you", "rival"] as const) {
			for (const zone of ON_FIELD_PILES) {
				for (const id of duel.piles[side][zone]) {
					const source = duel.cards[id]!;
					if (source.face !== "up" || !codes.has(source.code)) continue;
					for (const record of duel.defs[source.code]!.effects!) {
						if (record.type !== "continuous" || !appliesNow(duel, source, record, seen)) continue;
						if (record.affects ? !record.affects(duel, target, source) : source.id !== target.id) continue;
						for (const layer of record.modifies!(duel, source)) found.push({ stamp: source.since, layer, source });
					}
				}
			}
		}
	}
	return found.sort((a, b) => a.stamp - b.stamp);
}

/** Does a continuous record of a face-up card apply now: the condition holds and the card's effects are not negated. */
function appliesNow(duel: Duel, source: CardInstance, record: EffectRecord, seen: ReadonlySet<number>): boolean {
	// Step 7: a monster card's effect works from the zone its range names (the Monster Zone, or a Pendulum Zone).
	if (!inFieldRange(duel.defs[source.code], source, rangeOf(record))) return false;
	if (record.condition && !record.condition(duel, { player: source.controller, card: source })) return false;
	return seen.has(source.id) || !negatedBy(duel, source, seen);
}

function negatedBy(duel: Duel, card: CardInstance, seen: ReadonlySet<number>): boolean {
	return entriesFor(duel, card, new Set(seen).add(card.id)).some((entry) => entry.layer.kind === "negate");
}

/**
 * Is the card negated by a lasting negation ("negate its effects until the end of this turn"), as it is now? The link of an effect
 * the card activates is marked negated at activation then, so a monster that is its own cost is negated too (Konami's Q&A on
 * Infinite Impermanence, record `impermanence-negates-effect-activated-in-monster-zone`). A continuous negation (Skill Drain) is
 * not: it is read when the effect resolves, and a monster no longer face-up in the Monster Zone is not negated then
 * (Skill Drain's notes, record `skill-drain-left-the-zone`).
 */
export function isNegatedLasting(duel: Duel, id: number): boolean {
	if (duel.modifiers.length === 0) return false;
	const card = duel.cards[id]!;
	return duel.modifiers.some((modifier) => modifier.layer.kind === "negate" && reaches(duel, modifier.affects, card, null));
}

/** Are the effects of this card on the field negated: by a lasting negation of the card as it is now, or by a continuous effect. A new card (it moved since) is not. */
export function isNegated(duel: Duel, id: number): boolean {
	if (quiet(duel)) return false;
	return negatedBy(duel, duel.cards[id]!, new Set());
}

const NOBODY: ReadonlySet<number> = new Set();

const amount = (value: number | ((duel: Duel, source: CardInstance | null, target: CardInstance) => number), duel: Duel, source: CardInstance | null, target: CardInstance) => (typeof value === "function" ? value(duel, source, target) : value);

/**
 * The value of ATK or DEF: the printed value (the original), then the `base` and `set` modifiers in the order they began to
 * apply, a later one replacing what the earlier ones gave (a `base` replaces the original and the value, a `set` only the
 * value), then every `add` on top, read again each time. Konami's Japanese Q&A, OCG only: see src/continuous-sources.ts.
 * Not below 0 (the old engine's clamp; no Konami page read).
 */
function statOf(duel: Duel, id: number, stat: "atk" | "def"): number {
	const target = duel.cards[id]!;
	let original = printed(duel, id, stat);
	if (quiet(duel)) return original;
	let value = original;
	const entries = entriesFor(duel, target, NOBODY);
	for (const { layer } of entries) {
		if (layer.kind === "base" && layer.stat === stat) {
			original = layer.to(original);
			value = original;
		} else if (layer.kind === "set" && layer.stat === stat) value = typeof layer.to === "function" ? layer.to(duel, target) : layer.to;
	}
	for (const { layer, source } of entries) if (layer.kind === "add" && layer.stat === stat) value += amount(layer.by, duel, source, target);
	return Math.max(0, value);
}

/** The ATK with only the printed value and the changes of the original ATK: what a card that quotes the "original ATK" reads. */
export function originalAtk(duel: Duel, id: number): number {
	const target = duel.cards[id]!;
	let original = printed(duel, id, "atk");
	for (const { layer } of entriesFor(duel, target, NOBODY)) if (layer.kind === "base" && layer.stat === "atk") original = layer.to(original);
	return original;
}

export const atk = (duel: Duel, id: number): number => statOf(duel, id, "atk");
export const def = (duel: Duel, id: number): number => statOf(duel, id, "def");
/**
 * The Level: the printed one, then the `set` and `add` modifiers in the order they began to apply, a `set` replacing what came before
 * and an `add` counted from there. Backed by YGOProJudge only (asked 2026-11-23, no source cited); no Konami page was found.
 */
export function level(duel: Duel, id: number): number {
	let value = printed(duel, id, "level");
	if (quiet(duel)) return value;
	const target = duel.cards[id]!;
	for (const { layer, source } of entriesFor(duel, target, NOBODY)) {
		if (layer.kind === "set" && layer.stat === "level") value = typeof layer.to === "function" ? layer.to(duel, target) : layer.to;
		else if (layer.kind === "add" && layer.stat === "level") value += amount(layer.by, duel, source, target);
	}
	return value;
}

/**
 * Does a lock of this kind apply now: a lasting lock, or a continuous one of a card that is face-up on the field and not negated?
 * `who` is the player whose card or effect is stopped (a lock "for both players" stops anyone).
 */
export function locked(duel: Duel, what: LockKind, who?: Side, also?: (layer: Extract<Layer, { kind: "lock" }>) => boolean): boolean {
	if (quiet(duel)) return false;
	const stops = (layer: Layer) => layer.kind === "lock" && layer.what === what && (layer.who === "both" || who === undefined || layer.who === who) && (!also || also(layer));
	if (duel.modifiers.some((modifier) => stops(modifier.layer))) return true;
	const codes = codesWithContinuous(duel.defs);
	if (codes.size === 0) return false;
	for (const side of ["you", "rival"] as const) {
		for (const zone of ON_FIELD_PILES) {
			for (const id of duel.piles[side][zone]) {
				const source = duel.cards[id]!;
				if (source.face !== "up" || !codes.has(source.code)) continue;
				for (const record of duel.defs[source.code]!.effects!) {
					// The layers are read first: whether the source applies (is it negated?) is the costly question, asked only of a record that locks.
					if (record.type === "continuous" && record.modifies!(duel, source).some(stops) && appliesNow(duel, source, record, NOBODY)) return true;
				}
			}
		}
	}
	return false;
}

/**
 * Step 8: is `who` stopped from Summoning `card` this way ("you cannot Special Summon monsters, except DARK monsters")? A lock stops
 * the Summon, whoever would perform it: the player's action is not offered and an effect does not Summon the monster (Konami's
 * card FAQ on Rivalry of Warlords and Gozen Match, record `summon-lock-stops`). A Set is not a Summon and is never stopped by it
 * (`summon-lock-set-allowed`).
 */
export function summonLocked(duel: Duel, who: Side, card: CardInstance, way: SummonWay): boolean {
	if (quiet(duel)) return false;
	return locked(duel, "summon", who, (layer) => (layer.ways === undefined || layer.ways.includes(way)) && (layer.only === undefined || layer.only(duel, card)));
}
