import { type CardInstance, changeControl, destroyCard, type Duel, freeSlots, type Side } from "./duel";
import { askZone, type CardDef, cardTypeOf, type EffectContext, type EffectRecord, inFieldRange, rangeOf } from "./effects";
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
 * What a lock stops. A lock is a restriction, never a negation: what is already on the chain still resolves.
 * - `add-to-hand`: adding a card from the Main Deck to the hand (a draw, a search).
 * - `summon` (step 8): Summoning a monster, in the `ways` the layer names (default: every way) and for the monsters its `only` accepts
 *   (default: every monster).
 * - `activate`: activating a card or an effect that `stops` accepts (by name, kind of card, Attribute, Type, "effects of Special
 *   Summoned monsters"...; default: every activation). `who`: the player who would activate.
 * - `draw`: drawing by a card effect (`drawCards`); the draw is not done. `who`: the player who would draw.
 * - `banish-from-graveyard`: "cannot be banished from the GY": the cards `only` accepts (default: all) in the Graveyard of `who`.
 *   With `banisher: "opponent"` ("your opponent cannot banish cards from your GY"): only when the other player would banish them.
 * - `attack` / `attack-directly`: the monsters `only` accepts (default: all) controlled by `who` cannot declare an attack / a direct attack.
 * - `summon-together`: "cannot Special Summon 2 or more monsters at the same time": `who` Special Summons one monster at a time
 *   (`specialSummonTogether` Summons nothing, a Pendulum Summon is of one monster).
 */
export type LockKind = "add-to-hand" | "summon" | "activate" | "draw" | "banish-from-graveyard" | "attack" | "attack-directly" | "summon-together";

/** An activation a lock may stop: who activates, which card (as it is before it is placed), and which of its effects. */
export interface ActivationAttempt extends EffectContext {
	readonly def: CardDef;
	readonly effect: EffectRecord;
	readonly index: number;
}

/**
 * The card effect that does something: the card as it was when activated, the player who activated it and which effect. A resolving
 * `Link` is one; a delayed effect or a watch gives its own (`source`).
 */
export interface EffectSource {
	readonly card: CardInstance;
	readonly player: Side;
	readonly effect?: number;
}

/**
 * What a protection is about: being chosen as a target, being destroyed by a card effect, being destroyed by battle, or card effects
 * altogether ("unaffected by ..."): then an effect is not applied to the card (it is not destroyed, moved, negated, taken or changed
 * by it), but the card can still be targeted (Konami's Q&A, record `unaffected-targeted-not-applied`).
 */
export type Shield = "target" | "effect-destruction" | "battle-destruction" | "effects";

/**
 * What a monster is allowed beyond the one attack per turn on a monster, or directly when the opponent controls none (RB10):
 * - `times`: "can make a second attack during each Battle Phase" (`count: 2`), "up to 3 attacks": that many attacks in all. With
 *   `monstersOnly` ("can make up to 2 attacks on monsters during each Battle Phase"): the attacks after the first must be on monsters,
 *   and there are none after a direct attack.
 * - `all-monsters`: "can attack all monsters your opponent controls, once each": after its first attack, it may attack each monster it
 *   has not attacked yet, never directly, and not at all once it has declared a direct attack (Konami's Japanese Q&A fid 16016).
 * - `directly`: "can attack directly": a direct attack is open while the opponent controls monsters.
 * - `in-defense`: "can attack while in face-up Defense Position": it may declare an attack in face-up Defense Position, and its DEF
 *   is then used as its ATK for damage calculation.
 * A permission is a Continuous Effect of a card, or what a resolved effect leaves (`addModifier`): negated or gone, it no longer allows.
 * A direct attack whose permission is lost before the Damage Step is replayed (fid 16016, case D); lost in the Damage Step, it ends
 * with no damage calculation (YGOProJudge only, asked 2026-11-24, no source cited).
 */
export type AttackAllowance =
	| { readonly what: "times"; readonly count: number; readonly monstersOnly?: true }
	| { readonly what: "all-monsters" }
	| { readonly what: "directly" }
	| { readonly what: "in-defense" };

/** The lock layer (see `LockKind`). */
export type LockLayer = Extract<Layer, { kind: "lock" }>;
type PermitLayer = Extract<Layer, { kind: "permit" }>;
type DamageLayer = Extract<Layer, { kind: "damage" }>;
/** Layers about a player, not about the cards a modifier reaches: read by `playerLayersNow`, never by a card's own queries. */
const aboutPlayers = (layer: Layer): layer is LockLayer | PermitLayer | DamageLayer => layer.kind === "lock" || layer.kind === "permit" || layer.kind === "damage";
type ProtectLayer = Extract<Layer, { kind: "protect" }>;

/** "For the rest of this Duel": a modifier that no turn ends. It needs no source on the field: lasting modifiers never do. */
export const FOREVER = Number.POSITIVE_INFINITY;

/**
 * "Until the end of your next turn" (`player`: "you"), as the number of the turn at whose end it stops: the player's next turn after
 * the current one. Applied in their own turn 3 it lasts through turn 5; applied in the opponent's turn 3, through turn 4
 * (YGOProJudge's answer, asked 2026-11-24, no source cited). "This turn" is `duel.turn.number`.
 */
export const untilEndOfNextTurnOf = (duel: Duel, player: Side): number => duel.turn.number + (duel.turn.player === player ? 2 : 1);

/** "Your opponent's card effects": the effect was activated by the player who does not control the card. */
export const fromOpponent = (_duel: Duel, by: EffectSource, target: CardInstance): boolean => by.player !== target.controller;
/** "Trap effects": the effect of a Trap Card (Counter Traps included). */
export const fromTraps = (duel: Duel, by: EffectSource): boolean => duel.defs[by.card.code]?.kind === "trap" || duel.defs[by.card.code]?.kind === "counter-trap";
/** "Spell effects": the effect of a Spell Card, a monster treated as an Equip Spell included (`cardTypeOf`). */
export const fromSpells = (duel: Duel, by: EffectSource): boolean => cardTypeOf(duel, by.card) === "spell";
/**
 * "Activated effects" ("unaffected by your opponent's activated effects": Psychic End Punisher): the effect was activated (it is, or
 * was, a Chain Link: what it does when it resolves, and what it leaves behind), not a Continuous Effect read from a card on the field
 * nor what an Equip Card gives. Combine with another filter: `(duel, by, target) => fromOpponent(duel, by, target) && fromActivated(duel, by)`.
 */
export const fromActivated = (_duel: Duel, by: EffectSource): boolean => by.effect !== undefined;
/** "Other cards' effects": any card but the protected one. */
export const fromOtherCards = (_duel: Duel, by: EffectSource, target: CardInstance): boolean => by.card.id !== target.id;

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
	| { readonly kind: "lock"; readonly what: LockKind; readonly who: Side | "both"; readonly ways?: readonly SummonWay[]; readonly only?: (duel: Duel, card: CardInstance) => boolean; readonly stops?: (duel: Duel, attempt: ActivationAttempt) => boolean; readonly banisher?: "opponent" }
	/**
	 * A protection of the cards the modifier reaches: `against` what, `from` which effects (default: every effect; `fromOpponent`,
	 * `fromTraps`, `fromOtherCards`). `firstEachTurn`: "the first time each would be destroyed each turn, it is not destroyed"
	 * (only for the two destructions): each card is spared once a turn (`Duel.spared`).
	 */
	| { readonly kind: "protect"; readonly against: Shield | readonly Shield[]; readonly from?: (duel: Duel, by: EffectSource, target: CardInstance) => boolean; readonly firstEachTurn?: true }
	/**
	 * A permission for a player (`who`), beyond what the rules give: `normal-summon`: "you can Normal Summon 1 [monster] in addition to
	 * your Normal Summon/Set", for the monsters `only` accepts (default: any). One such Summon per turn, whatever gives it
	 * (`Duel.extraNormalSummoned`; Konami's notes on Mausoleum of White, OCG only).
	 */
	| { readonly kind: "permit"; readonly what: "normal-summon"; readonly who: Side; readonly only?: (duel: Duel, card: CardInstance) => boolean }
	/**
	 * "Any damage your opponent takes is halved" (`who`: the player who takes it): battle damage and effect damage alike
	 * (`damageFor`, src/life.ts). Several of them do not add up: the damage is halved once (Konami's Japanese Q&A fid 23511, OCG only).
	 */
	| { readonly kind: "damage"; readonly who: Side; readonly halved: true }
	/** A permission about attacks, for the monsters the modifier reaches (see `AttackAllowance`; src/battle.ts reads it). */
	| { readonly kind: "attack"; readonly allows: AttackAllowance }
	/** Bookkeeping for a control change that lasts: the card goes back to its owner when it ends. */
	| { readonly kind: "control"; readonly to: Side }
	/**
	 * "Banish it when it leaves the field" (`banishWhenItLeaves`): the card it reaches, leaving the field for the Graveyard, the hand,
	 * the Deck or the Extra Deck, is banished instead (face-up). Read by every move (`leavesFieldTo`).
	 */
	| { readonly kind: "leaves"; readonly to: "banished" };

/** Which cards a modifier reaches: one card as it was (`moves` frozen: a card that moved is a new card), or any card the filter accepts. */
export type Affects = { readonly card: number; readonly moves: number } | ((duel: Duel, target: CardInstance, source: CardInstance | null) => boolean);

export interface Modifier {
	/** The place in the order the modifiers began to apply: a higher stamp applies later. */
	readonly stamp: number;
	readonly affects: Affects;
	/** The number of the turn at whose end it stops. */
	readonly until: number;
	readonly layer: Layer;
	/** The effect that left it (pass the resolving link): a card unaffected by that effect is not reached by it. */
	readonly by?: EffectSource;
	/**
	 * Step 11: the modifier is the effect of this Equip Card (its id), given by the effect that equipped it ("as an Equip Spell that
	 * gives it 400 ATK", `equipMonster` in src/equips.ts). It reaches the monster that card is equipped to, as an effect of that card:
	 * not while the card's effects are negated, and not for a monster unaffected by it. It is removed when the card stops being equipped.
	 */
	readonly equip?: number;
	/**
	 * What the card's own effect left on the card itself ("Special Summon this card, and if you do, its ATK becomes ..."): it stops
	 * applying while that card's effects are negated, and applies again afterwards. Only with `affects` naming one card. Konami's
	 * Japanese notes on Deep-Eyes White Dragon, the Blue Abyss (OCG only, record `own-lasting-effect-stops-while-negated`).
	 */
	readonly own?: true;
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
	if (zones.length === 0) return giveBack(destroyCard(duel, card.id, { destruction: { cause: "game-mechanic" } }), rest, choose);
	const back = (board: Duel, slot: number) => giveBack(changeControl(board, card.id, to, slot), rest, choose);
	return zones.length === 1 || !choose ? back(duel, zones[0]!) : askZone(duel, to, zones, back);
}

/**
 * "Take control of that monster until the End Phase": the card moves to `side`'s field now (a new card for them: what was applied to
 * it before ends, record `negated-monster-state`), and goes back when the End Phase of turn number `until` begins (`returnControl`). Control stays a
 * physical move (design D3): piles are kept by controller. The card must be on the field and controlled by the other player.
 */
export function takeControl(duel: Duel, id: number, side: Side, until: number, by?: EffectSource): Duel {
	const before = duel.cards[id]!;
	// A monster unaffected by the effect that would take it stays where it is.
	if (by && unaffectedBy(duel, id, by)) return duel;
	const zones = freeSlots(duel, side, "monster");
	if (before.zone !== "monster" || before.controller === side) return duel;
	// With no free Main Monster Zone left when it resolves, the monster is destroyed by the game's rules and sent to its owner's
	// Graveyard; a card that takes control needs a free zone to be activated at all (its condition). YGOProJudge's chat answer only
	// (asked 2026-11-23, no source cited).
	if (zones.length === 0) return destroyCard(duel, id, { destruction: { cause: "game-mechanic" } });
	// The player taking it chooses a free Main Monster Zone, also for a monster in an Extra Monster Zone (record `control-extra-zone-to-main`).
	const take = (board: Duel, slot: number) => {
		const taken = changeControl(board, id, side, slot);
		return addModifier(taken, { affects: { card: id, moves: taken.cards[id]!.moves }, until, layer: { kind: "control", to: before.controller } });
	};
	return zones.length === 1 ? take(duel, zones[0]!) : askZone(duel, side, zones, take);
}

/**
 * Negates the effects of a card on the field until the end of turn number `until` (the current turn: "until the end of this
 * turn"). It is the card as it is now; the card must be face-up on the field (a monster in the Monster Zone, or a Spell or Trap Card
 * in a Spell & Trap Zone or the Field Zone: "target 1 face-up card on the field; negate its effects", Primite Drillbeam), or nothing
 * happens and the Duel given comes back as it is: what an "and if you do" reads.
 */
export function negateCardEffects(duel: Duel, id: number, until: number, by?: EffectSource): Duel {
	const card = duel.cards[id]!;
	if (card.face !== "up" || (card.zone !== "monster" && card.zone !== "spell" && card.zone !== "field")) return duel;
	// `by`: the effect that negates; a monster unaffected by it is not negated.
	if (by && unaffectedBy(duel, id, by)) return duel;
	return addModifier(duel, { affects: { card: id, moves: card.moves }, until, layer: { kind: "negate" }, ...(by ? { by } : {}) });
}

/**
 * Step 7: "for the rest of this turn, all other Spell/Trap effects in this column are negated" (Infinite Impermanence). The column is
 * the one `source` is in now (Konami's notes: where the card is when it applies); every other card in a Spell & Trap Zone of that
 * column, on either side, is negated until the end of turn `until`, those that come there later included. A Spell or Trap effect
 * activated there stays negated if its card leaves as the cost (`negatedWhere`). `by`: the effect that negates (the resolving link):
 * a card in the column that is unaffected by it is not negated while it is.
 */
export function negateColumn(duel: Duel, source: number, until: number, by?: EffectSource): Duel {
	const column = cardColumn(duel.cards[source]!);
	if (column === null) return duel;
	const self = duel.cards[source]!;
	const other = (target: CardInstance) => target.id !== source || target.moves !== self.moves;
	return addModifier(duel, { affects: (_duel, target) => target.zone === "spell" && other(target) && cardColumn(target) === column, until, layer: { kind: "negate" }, ...(by ? { by } : {}) });
}

/**
 * Step 7: is a card negated where it was, as it was (`card` is a snapshot, as a link holds it): by a lasting negation of a place (a
 * column), even if the card has left since. Konami's Q&A on Wonder Wand and Infinite Impermanence: an effect activated in the column is
 * negated though the card was sent to the Graveyard as its cost. A card still there that is unaffected by the negating effect is not
 * negated (the core's reading of "unaffected", as `shielded` in src/chain.ts; no Konami page read for a column).
 */
export function negatedWhere(duel: Duel, card: CardInstance): boolean {
	// What an Equip Card gives (`Modifier.equip`) is no negation of a place: it is read with the card's other effects (`isNegated`).
	return duel.modifiers.some((modifier) => modifier.layer.kind === "negate" && modifier.equip === undefined && typeof modifier.affects === "function" && modifier.affects(duel, card, null) && !(modifier.by && stillUnaffected(duel, card, modifier.by)));
}

/** The card is still on the field as it was (it has not moved since the snapshot) and is unaffected by the effect `by`. */
function stillUnaffected(duel: Duel, card: CardInstance, by: EffectSource): boolean {
	const now = duel.cards[card.id]!;
	return now.moves === card.moves && now.face === "up" && unaffectedBy(duel, now.id, by);
}

const printed = (duel: Duel, id: number, stat: Stat): number => duel.defs[duel.cards[id]!.code]?.facts?.[stat] ?? 0;

/** One modifier that reaches a card, with the card it comes from (`null` for a lasting modifier). */
interface Entry {
	readonly stamp: number;
	readonly layer: Layer;
	readonly source: CardInstance | null;
	/** The effect it comes from, when known: the continuous effect's card, or the effect that left a lasting modifier (`Modifier.by`). */
	readonly by: EffectSource | null;
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
	for (const modifier of duel.modifiers) {
		if (aboutPlayers(modifier.layer)) continue;
		if (modifier.equip !== undefined) {
			// What an Equip Card was given to do (step 11): its own effect, for the monster it is equipped to, while it is not negated.
			const source = duel.cards[modifier.equip]!;
			if (source.equippedTo !== target.id || (!seen.has(source.id) && negatedBy(duel, source, seen))) continue;
			found.push({ stamp: modifier.stamp, layer: modifier.layer, source, by: { card: source, player: source.controller } });
		} else if (reaches(duel, modifier.affects, target, null)) {
			// The card's own lasting effect on itself (`Modifier.own`) is one of its effects: not applied while they are negated. A card
			// already being asked about counts as not negated, as for every source (`seen`).
			if (modifier.own && !seen.has(target.id) && negatedBy(duel, target, seen)) continue;
			found.push({ stamp: modifier.stamp, layer: modifier.layer, source: null, by: modifier.by ?? null });
		}
	}
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
						for (const layer of record.modifies!(duel, source)) if (!aboutPlayers(layer)) found.push({ stamp: source.since, layer, source, by: { card: source, player: source.controller } });
					}
				}
			}
		}
	}
	return unaffectedDropped(duel, target, found).sort((a, b) => a.stamp - b.stamp);
}

const covers = (layer: Layer, against: Shield): layer is ProtectLayer => layer.kind === "protect" && (typeof layer.against === "string" ? layer.against === against : layer.against.includes(against));

/**
 * "Unaffected by ... effects": what reaches the card from an effect it is unaffected by does not apply to it (an ATK change, a
 * negation). Only modifiers whose effect is known are dropped (`Modifier.by`, or a continuous effect's own card); the protections
 * themselves stay.
 *
 * One ordering is read (`appliedFirst`): a continuous negation that was already applying when the card's own "unaffected" effect began
 * (Skill Drain face-up before the monster came face-up) is not dropped by that effect: it negates the card, its "unaffected" effect
 * included, until the negation stops applying. In the other order the card is unaffected by it. Konami's Japanese Q&A fid 23897 (OCG
 * only; records `skill-drain-first-negates-own-immunity`, `own-immunity-first-skill-drain-not-applied`); YGOProJudge answered the same
 * (asked 2026-11-24). The page is about Skill Drain and a monster's own unconditional effect: the core applies it to any continuous
 * negation read from a card on the field (an inference for cards other than Skill Drain), and to nothing else. It is not a general
 * rule of order between protections and effects: a protection given by another card, a lasting protection, and anything that is not
 * a negation are read as before.
 */
function unaffectedDropped(duel: Duel, target: CardInstance, entries: Entry[]): Entry[] {
	const shields = entries.filter((entry) => covers(entry.layer, "effects"));
	if (shields.length === 0) return entries;
	const immuneTo = (entry: Entry) =>
		shields.some((shield) => {
			if (appliedFirst(entry, shield, target)) return false;
			const from = (shield.layer as ProtectLayer).from;
			return from === undefined || from(duel, entry.by!, target);
		});
	return entries.filter((entry) => entry.layer.kind === "protect" || entry.by === null || !immuneTo(entry));
}

/**
 * Was this continuous negation (of a card on the field, `source`) applying before the card's own continuous "unaffected" effect
 * (`shield`, whose source is the card itself) began? Both stamps are the moment their card came face-up on the field. A conditional
 * "unaffected" effect counts from then too, not from the moment its condition began to hold (no page read for that case).
 */
const appliedFirst = (negation: Entry, shield: Entry, target: CardInstance): boolean => negation.layer.kind === "negate" && negation.source !== null && shield.source?.id === target.id && negation.stamp < shield.stamp;

/** One bit per kind of layer a question may ask about without reading the field (`layerKindsNow`). */
const PROTECT_BIT = 1;
const ATTACK_BIT = 2;
const LEAVES_BIT = 4;
const EVERY_KIND = PROTECT_BIT | ATTACK_BIT | LEAVES_BIT;
const bitOf = (layer: Layer): number => (layer.kind === "protect" ? PROTECT_BIT : layer.kind === "attack" ? ATTACK_BIT : layer.kind === "leaves" ? LEAVES_BIT : 0);
const kindsCache = new WeakMap<Duel, number>();

/**
 * Which of the kinds of layer asked about per card (protections, attack permissions) could apply in this Duel now: those of the
 * lasting modifiers, and those the continuous records of the face-up cards on the field give (whether or not each applies). Read once
 * per Duel value, so that a question about a kind nobody has looks no further: the listing asks for every target candidate and every
 * attacker.
 */
function layerKindsNow(duel: Duel): number {
	if (quiet(duel)) return 0;
	const cached = kindsCache.get(duel);
	if (cached !== undefined) return cached;
	let found = 0;
	for (const modifier of duel.modifiers) found |= bitOf(modifier.layer);
	const codes = codesWithContinuous(duel.defs);
	// Once every kind is found there is nothing more to learn: the rest of the field is not read.
	if (codes.size > 0 && found !== EVERY_KIND) {
		field: for (const side of ["you", "rival"] as const) {
			for (const zone of ON_FIELD_PILES) {
				for (const id of duel.piles[side][zone]) {
					const source = duel.cards[id]!;
					if (source.face !== "up" || !codes.has(source.code)) continue;
					for (const record of duel.defs[source.code]!.effects!) {
						if (record.type !== "continuous") continue;
						for (const layer of record.modifies!(duel, source)) found |= bitOf(layer);
						if (found === EVERY_KIND) break field;
					}
				}
			}
		}
	}
	kindsCache.set(duel, found);
	return found;
}

/**
 * Could any protection apply in this Duel now: a lasting one, or a continuous record of a face-up card on the field that gives one?
 * Read once per Duel value; when there is none, no protection query looks any further (the listing asks for every target candidate).
 */
export const anyShield = (duel: Duel): boolean => (layerKindsNow(duel) & PROTECT_BIT) !== 0;

const NO_ENTRIES: Entry[] = [];

/** The protections of this kind that reach the card now and hold against the effect `by` (`null`: battle, which no `from` filters). */
function shieldsOf(duel: Duel, target: CardInstance, against: Shield, by: EffectSource | null): Entry[] {
	if (!anyShield(duel)) return NO_ENTRIES;
	return entriesFor(duel, target, NOBODY).filter((entry) => {
		if (!covers(entry.layer, against)) return false;
		return by === null || entry.layer.from === undefined || entry.layer.from(duel, by, target);
	});
}

/**
 * Is the card unaffected by this effect ("unaffected by Trap effects", "by other cards' effects")? Read when the effect would be
 * applied to it. Destruction, moves attributed to an effect (`moveCard`'s `effect`), control changes, the negation of its effects
 * and of its activations all ask it; a cost, a Summon procedure and battle do not (Konami's Q&A, record `unaffected-sent-as-cost`).
 */
export function unaffectedBy(duel: Duel, id: number, by: EffectSource): boolean {
	if (quiet(duel)) return false;
	return shieldsOf(duel, duel.cards[id]!, "effects", by).length > 0;
}

/**
 * Can the effect `by` choose the card as a target? "Cannot be targeted by your opponent's card effects" is applied to the player who
 * would target, not to the card (Konami's Q&A, record `cannot-be-targeted-restricts-the-player`): it is asked when the targets are
 * listed and checked at activation (src/activation.ts), and an effect that does not target is not stopped by it.
 */
export function canBeTargetedBy(duel: Duel, id: number, by: EffectSource): boolean {
	if (quiet(duel)) return true;
	return shieldsOf(duel, duel.cards[id]!, "target", by).length === 0;
}

/**
 * The card would be destroyed, by the card effect `by` or by battle (`by` `null`): the Duel when it is NOT destroyed (with the use of
 * a "first time each turn" protection recorded), or `null` when nothing protects it and it is destroyed. "Cannot be destroyed by card
 * effects" and "unaffected" stop an effect's destruction, "cannot be destroyed by battle" battle's; none stops a card being sent to
 * the Graveyard, banished or Tributed otherwise (YGOProJudge's answer, asked 2026-11-24, no source cited). A "first time" protection
 * is used only when nothing else protects the card, once per card and turn, battle and effects alike; a card that moved is a new card
 * with a first time of its own (YGOProJudge again).
 */
export function spareDestruction(duel: Duel, id: number, how: "effect" | "battle", by: EffectSource | null): Duel | null {
	if (quiet(duel)) return null;
	const target = duel.cards[id]!;
	if (how === "effect" && by && shieldsOf(duel, target, "effects", by).length > 0) return duel;
	const shields = shieldsOf(duel, target, how === "effect" ? "effect-destruction" : "battle-destruction", by);
	if (shields.length === 0) return null;
	if (shields.some((entry) => !(entry.layer as ProtectLayer).firstEachTurn)) return duel;
	for (const entry of shields) {
		const key = `${entry.stamp}:${entry.source?.id ?? "lasting"}:${target.id}.${target.moves}`;
		if (!duel.spared.includes(key)) return { ...duel, spared: [...duel.spared, key] };
	}
	return null;
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
 * (Skill Drain's notes, record `skill-drain-left-the-zone`). Nor is the negation an Equip Card gives its monster (step 11,
 * `Modifier.equip`): it is that card's own effect while it is equipped, read like a continuous one when the effect resolves
 * (`isNegated`), so that it stops while the Equip Card is negated and never reaches a monster unaffected by it (the core's reading).
 */
export function isNegatedLasting(duel: Duel, id: number): boolean {
	if (duel.modifiers.length === 0) return false;
	const card = duel.cards[id]!;
	// A negation left by an effect the card is unaffected by does not reach it (as in every other query: `unaffectedDropped`).
	return duel.modifiers.some((modifier) => modifier.layer.kind === "negate" && modifier.equip === undefined && reaches(duel, modifier.affects, card, null) && !(modifier.by && unaffectedBy(duel, id, modifier.by)));
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

/** A lock that applies now, with the card whose continuous effect it is (`null` for a lasting one). */
interface LockEntry {
	readonly layer: LockLayer;
	readonly source: CardInstance | null;
}

const NO_LOCKS: readonly LockEntry[] = Object.freeze([]);
const NO_PERMITS: readonly PermitLayer[] = Object.freeze([]);
const NO_DAMAGE: readonly DamageLayer[] = Object.freeze([]);
/** The layers about players that apply in a Duel: the locks, the permissions, and the changes of the damage a player takes. */
interface PlayerLayers {
	readonly locks: readonly LockEntry[];
	readonly permits: readonly PermitLayer[];
	readonly damage: readonly DamageLayer[];
}
const NO_PLAYER_LAYERS: PlayerLayers = Object.freeze({ locks: NO_LOCKS, permits: NO_PERMITS, damage: NO_DAMAGE });
/** The locks and permissions of a Duel, read once per Duel value (a Duel never changes): every listing asks about them for each effect it offers. */
const playerCache = new WeakMap<Duel, PlayerLayers>();

/** Every lock that applies now: the lasting ones, and the continuous ones of cards face-up on the field that are not negated. */
const locksNow = (duel: Duel): readonly LockEntry[] => playerLayersNow(duel).locks;

/** The codes of the cards with a restriction "the turn you activate this card" (`EffectRecord.oath`), per `defs`. */
const oathCodes = new WeakMap<object, ReadonlySet<string>>();

function codesWithOath(defs: Duel["defs"]): ReadonlySet<string> {
	let found = oathCodes.get(defs);
	if (!found) {
		found = new Set(Object.values(defs).filter((def: CardDef) => def.effects?.some((effect) => effect.oath !== undefined)).map((def) => def.code));
		oathCodes.set(defs, found);
	}
	return found;
}

/** Could an activation of this turn have left a restriction for the turn (`EffectRecord.oath`)? */
const anyOath = (duel: Duel): boolean => duel.activations.length > 0 && codesWithOath(duel.defs).size > 0;

/** No lock and no permission can apply: no modifier, no continuous card, no activation that swore anything for the turn. */
const noPlayerLayers = (duel: Duel): boolean => quiet(duel) && !anyOath(duel);

/**
 * Every lock and permission that applies now: the lasting ones, the continuous ones of cards face-up on the field that are not
 * negated, and what the cards and effects activated this turn swore when activated (`EffectRecord.oath`), unless that activation was
 * negated.
 */
function playerLayersNow(duel: Duel): PlayerLayers {
	if (noPlayerLayers(duel)) return NO_PLAYER_LAYERS;
	const cached = playerCache.get(duel);
	if (cached) return cached;
	const found: LockEntry[] = [];
	let permits: PermitLayer[] | null = null;
	if (anyOath(duel)) {
		for (const activation of duel.activations) {
			const oath = activation.negated ? undefined : duel.defs[activation.card.code]?.effects?.[activation.effect]?.oath;
			if (oath) for (const layer of oath(duel, activation)) found.push({ layer, source: null });
		}
	}
	let damage: DamageLayer[] | null = null;
	for (const modifier of duel.modifiers) {
		if (modifier.layer.kind === "lock") found.push({ layer: modifier.layer, source: null });
		else if (modifier.layer.kind === "permit") (permits ??= []).push(modifier.layer);
		else if (modifier.layer.kind === "damage") (damage ??= []).push(modifier.layer);
	}
	const codes = codesWithContinuous(duel.defs);
	if (codes.size > 0) {
		for (const side of ["you", "rival"] as const) {
			for (const zone of ON_FIELD_PILES) {
				for (const id of duel.piles[side][zone]) {
					const source = duel.cards[id]!;
					if (source.face !== "up" || !codes.has(source.code)) continue;
					for (const record of duel.defs[source.code]!.effects!) {
						if (record.type !== "continuous") continue;
						// The layers are read first: whether the source applies (is it negated?) is the costly question, asked only of a record that locks.
						const layers = record.modifies!(duel, source).filter(aboutPlayers);
						if (layers.length === 0 || !appliesNow(duel, source, record, NOBODY)) continue;
						for (const layer of layers) {
							if (layer.kind === "lock") found.push({ layer, source });
							else if (layer.kind === "permit") (permits ??= []).push(layer);
							else (damage ??= []).push(layer);
						}
					}
				}
			}
		}
	}
	const result: PlayerLayers = found.length === 0 && permits === null && damage === null ? NO_PLAYER_LAYERS : { locks: found.length === 0 ? NO_LOCKS : found, permits: permits ?? NO_PERMITS, damage: damage ?? NO_DAMAGE };
	playerCache.set(duel, result);
	return result;
}

/**
 * Is the damage `who` takes halved now ("any damage your opponent takes is halved": a lasting modifier, or a Continuous Effect of a
 * card face-up on the field that is not negated)? However many such effects apply, the damage is halved once (`damageFor`).
 */
export function damageHalved(duel: Duel, who: Side): boolean {
	const { damage } = playerLayersNow(duel);
	return damage.length > 0 && damage.some((layer) => layer.who === who);
}

/**
 * May `who` Normal Summon this monster "in addition to their Normal Summon/Set" now: an effect that says so applies for them and
 * accepts the monster, and no additional Normal Summon was made this turn. Konami's notes on Mausoleum of White (OCG only; records
 * `extra-normal-summon-one-per-turn`, `extra-normal-summon-controller-only`): only one such effect is applied in a turn, whatever
 * gives it; YGOProJudge answered the same for the TCG (asked 2026-11-24, no source cited).
 */
export function extraNormalSummon(duel: Duel, who: Side, card: CardInstance): boolean {
	if (duel.extraNormalSummoned) return false;
	const { permits } = playerLayersNow(duel);
	return permits.length > 0 && permits.some((layer) => layer.what === "normal-summon" && layer.who === who && (layer.only === undefined || layer.only(duel, card)));
}

/**
 * Does a lock of this kind apply now: a lasting lock, or a continuous one of a card that is face-up on the field and not negated?
 * `who` is the player whose card or effect is stopped (a lock "for both players" stops anyone).
 */
export function locked(duel: Duel, what: LockKind, who?: Side, also?: (layer: LockLayer) => boolean): boolean {
	const locks = locksNow(duel);
	if (locks.length === 0) return false;
	return locks.some(({ layer }) => layer.what === what && (layer.who === "both" || who === undefined || layer.who === who) && (!also || also(layer)));
}

/**
 * Is `ctx.player` stopped from activating this card or effect now ("your opponent cannot activate monster effects", "neither player
 * can activate cards or effects with that name")? Asked by the listing and by trigger effects alike (`activationWays`).
 */
export function activationLocked(duel: Duel, ctx: EffectContext, index: number, effect: EffectRecord): boolean {
	if (locksNow(duel).length === 0) return false;
	const def = duel.defs[ctx.card.code];
	if (!def) return false;
	const attempt: ActivationAttempt = { player: ctx.player, card: ctx.card, def, effect, index };
	return locked(duel, "activate", ctx.player, (layer) => layer.stops === undefined || layer.stops(duel, attempt));
}

const NO_ALLOWANCES: readonly AttackAllowance[] = Object.freeze([]);

/** The attack permissions that reach this monster now (`AttackAllowance`): none in a Duel with no modifier and no continuous card. */
export function attackAllowances(duel: Duel, id: number): readonly AttackAllowance[] {
	if ((layerKindsNow(duel) & ATTACK_BIT) === 0) return NO_ALLOWANCES;
	let found: AttackAllowance[] | null = null;
	for (const { layer } of entriesFor(duel, duel.cards[id]!, NOBODY)) if (layer.kind === "attack") (found ??= []).push(layer.allows);
	return found ?? NO_ALLOWANCES;
}

/**
 * "... also banish it when it leaves the field": from now on the card `id`, as it is now (face-up on the field), is banished instead
 * when it would leave the field for the Graveyard, the hand, the Deck or the Extra Deck, whatever makes it leave (an effect, a cost,
 * a Tribute, battle). `by`: the effect that says so (the resolving link). It lasts while the card is that card: turned face-down or
 * moved to another kind of zone it is a new card and the state is over (Konami's Japanese notes on Deep-Eyes White Dragon, the Blue
 * Abyss, OCG only: record `banish-when-it-leaves-ends-face-down`). A monster that becomes an Xyz Material is not banished (RB10: it is
 * no longer on the field, but its "leaves the field" effects do not activate; that the banishment does not apply either, and that a
 * return to the hand or the Deck is replaced, are YGOProJudge's answers only, asked 2026-11-24, no source cited).
 */
export function banishWhenItLeaves(duel: Duel, id: number, by?: EffectSource): Duel {
	const card = duel.cards[id]!;
	if (card.face !== "up" || (card.zone !== "monster" && card.zone !== "spell" && card.zone !== "field")) return duel;
	return addModifier(duel, { affects: { card: id, moves: card.moves }, until: FOREVER, layer: { kind: "leaves", to: "banished" }, ...(by ? { by } : {}) });
}

/** Where a card that is leaving the field goes instead of where it was sent (`banishWhenItLeaves`): `"banished"`, or `null` (nothing replaces the move). */
export function leavesFieldTo(duel: Duel, card: CardInstance): "banished" | null {
	if ((layerKindsNow(duel) & LEAVES_BIT) === 0) return null;
	return entriesFor(duel, card, NOBODY).some((entry) => entry.layer.kind === "leaves") ? "banished" : null;
}

/** Is this monster stopped from declaring an attack ("cannot attack"), or with `directly` a direct attack ("cannot attack directly")? */
export function attackLocked(duel: Duel, card: CardInstance, directly = false): boolean {
	if (locksNow(duel).length === 0) return false;
	const on = (layer: LockLayer) => layer.only === undefined || layer.only(duel, card);
	return locked(duel, "attack", card.controller, on) || (directly && locked(duel, "attack-directly", card.controller, on));
}

/**
 * Is `who` stopped from Special Summoning 2 or more monsters at the same time (Blue-Eyes Spirit Dragon's wording)? Konami's Japanese
 * Q&A fid 18176 (OCG only; records `summon-together-lock`, `summon-together-lock-at-resolution`): an effect that must Summon two or
 * more at once cannot be activated, and Summons none if the lock began to apply in its chain.
 */
export const summonTogetherLocked = (duel: Duel, who: Side): boolean => locksNow(duel).length > 0 && locked(duel, "summon-together", who);

/**
 * Is this card of a Graveyard stopped from being banished ("cannot be banished from the GY")? `by`: the player who would banish it
 * (the player of the effect, or of the cost): a lock worded "your opponent cannot banish cards from your GY" (`banisher: "opponent"`)
 * stops only the other player. With nobody named, such a lock stops the banishment too: the core cannot tell that the owner is the
 * one banishing, and a lock that could be passed by not saying who acts would stop nothing (the core's choice, no page read). Every
 * banishment from a Graveyard therefore says who does it: an effect by its link (`moveCard`'s `effect`), a cost or a Summon
 * procedure by its player (`moveCard`'s `player`, `canBeBanished`'s `by`).
 */
export function banishLocked(duel: Duel, card: CardInstance, by?: Side): boolean {
	if (locksNow(duel).length === 0) return false;
	return locked(duel, "banish-from-graveyard", card.owner, (layer) => (layer.only === undefined || layer.only(duel, card)) && (layer.banisher === undefined || by !== card.owner));
}

/**
 * Can the card be banished from where it is? What a cost that banishes asks before it is paid (a move that a lock stops is simply not
 * done, which would leave a cost unpaid). Only a card in a Graveyard can be stopped today. `by`: the player who would banish it
 * (see `banishLocked`: the player who pays the cost; left out, a lock on the opponent alone stops it too); an effect that targets a
 * card to banish it asks too.
 */
export const canBeBanished = (duel: Duel, id: number, by?: Side): boolean => !(duel.cards[id]!.zone === "graveyard" && banishLocked(duel, duel.cards[id]!, by));

/** Is `who` stopped from drawing by a card effect ("cannot draw cards by card effects"), or from adding from the Deck at all? */
export const drawLocked = (duel: Duel, who: Side): boolean => locked(duel, "draw", who) || locked(duel, "add-to-hand", who);

/**
 * Step 8: is `who` stopped from Summoning `card` this way ("you cannot Special Summon monsters, except DARK monsters")? A lock stops
 * the Summon, whoever would perform it: the player's action is not offered and an effect does not Summon the monster (Konami's
 * card FAQ on Rivalry of Warlords and Gozen Match, record `summon-lock-stops`). A Set is not a Summon and is never stopped by it
 * (`summon-lock-set-allowed`).
 */
export function summonLocked(duel: Duel, who: Side, card: CardInstance, way: SummonWay): boolean {
	if (noPlayerLayers(duel)) return false;
	return locked(duel, "summon", who, (layer) => (layer.ways === undefined || layer.ways.includes(way)) && (layer.only === undefined || layer.only(duel, card)));
}
