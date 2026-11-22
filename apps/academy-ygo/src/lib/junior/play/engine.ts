import { ashCategories, cardCategories, categoriesOf, type Category, choiceOf, effectsOf, fits as fitsFilter, targetOf } from "./effects";
import { FORBIDDEN_ONE, attributeOf, cardOf, fusionOnly, hasRulesText, inExtraDeck, inPool, isEffectMonster, isQuickPlay, mentions, monsterOf, named, spellTarget, staysOnField, tributesFor, type Action, type Arrow, type CardId, type DataEffect, type Effect, type FusionMaterial, type MonsterCard } from "./cards";

/**
 * The Junior duel board. The small board has three Monster Zones and three Spell & Trap Zones per side; the whole
 * mat has five of each, plus a Field Zone, an Extra Deck, banished cards and one Extra Monster Zone per player.
 * A pure rules module: `apply` takes a board and a move and returns the next board plus what happened,
 * or the reason the move is not allowed. Rules are simplified by leaving things out, never by changing them.
 */
export const ZONES = 3;
export const FULL_ZONES = 5;
/** On the whole mat, the place of a player's Extra Monster Zone in `monsters`, after the five Main Monster Zones. */
export const EXTRA_ZONE = FULL_ZONES;
export const START_LP = 4000;
export type Side = "you" | "rival";
export const PHASES = ["draw", "standby", "main1", "battle", "main2", "end"] as const;
export type Phase = (typeof PHASES)[number];
export type Position = "attack" | "defense";
export type Row = "monsters" | "backrow" | "field";

export interface MonsterSlot {
	card: CardId;
	position: Position;
	attacked: boolean;
	/** Summoned this turn: its battle position cannot be changed yet. */
	summoned: boolean;
	/** Battle position already changed this turn. */
	moved: boolean;
	/** ATK gained or lost until the end of the turn. */
	boost: number;
	/** Xyz Materials: the cards under an Xyz Monster. They are not on the field. */
	materials?: CardId[];
	/** Those of the materials that belong to the opponent: they go to the opponent's Graveyard. */
	borrowed?: CardId[];
	/** ATK gained for good, by its own effect (Legendary Fiend, Junk Warrior). */
	bonus?: number;
	/** Its effects are negated (Junk Synchron's Special Summon). */
	negated?: true;
	/** Attacks declared this turn, for a monster that can attack twice. */
	attackCount?: number;
	/** DEF lost for good (Great Tornado halving it). */
	defBonus?: number;
	/** "…but destroy it during the End Phase of this turn" (Blue-Eyes Spirit Dragon's Special Summon). */
	doomed?: true;
	/** Set, or turned, face-down: always in Defense Position, with no effect, until it is flipped face-up. */
	faceDown?: true;
	/** Its effects are negated until the end of this turn (Forbidden Chalice, Effect Veiler). */
	negatedTurn?: true;
	/** Battle Fader Summoned by its own effect: "banish it when it leaves the field". */
	banishOnLeave?: true;
	/** Whose card it is, when it is not its controller's: it goes back to its owner's Graveyard. */
	owner?: Side;
}
/**
 * A face-down Spell or Trap, or (`up`) a Pendulum Monster face-up in a Pendulum Zone, or (`open`) a Spell or Trap
 * that stays face-up once it has resolved: a Continuous or Equip card.
 */
export interface BackSlot {
	card: CardId;
	setThisTurn: boolean;
	up?: true;
	open?: true;
	/** An Equip Spell: the Monster Zone, on the same side, of the monster it is equipped to. */
	equip?: number;
	/** A Continuous Trap that Special Summoned a monster: that monster's Monster Zone, on the same side. */
	haunt?: number;
	/** Swords of Revealing Light: the opponent's End Phases since it was activated. */
	turns?: number;
	/** Activated and waiting on the Chain: it cannot be used again before it resolves. */
	chained?: true;
}
export interface SideState {
	lp: number;
	hand: CardId[];
	deck: CardId[];
	/** Main Monster Zones, then on the whole mat the Extra Monster Zone. */
	monsters: (MonsterSlot | null)[];
	backrow: (BackSlot | null)[];
	graveyard: CardId[];
	/** The Field Spell in the Field Zone. */
	field: CardId | null;
	/** Banished cards are neither on the field nor in the Graveyard. */
	banished: { card: CardId; faceDown: boolean }[];
	/** The Extra Deck, face-down. */
	extra: CardId[];
	/** Pendulum Monsters that left the field: face-up on the Extra Deck. */
	extraUp: CardId[];
	/** "Skip your next Draw Phase": this player's next turn starts without a draw. */
	skipDraw?: true;
}
/** A card used to Summon another: from the hand (by name) or from a Monster Zone. */
export type Material = { from: "hand"; card: CardId } | { from: "field"; zone: number };
/** A moment where the other player may answer, with a Set Trap or a Quick Effect, before things go on. */
export type Pending =
	/**
	 * An attack, in its step: the Battle Step, right after it is declared ("When an opponent's monster declares an
	 * attack"), then the Damage Step, before damage is calculated (Kuriboh, ATK boosts). Rulebook v10 pp. 37-39.
	 */
	| { kind: "attack"; attacker: number; target: number | "direct"; noDamage?: true; step?: "damage" }
	| { kind: "spell"; card: CardId; target?: number; grave?: { side: Side; index: number }; summon?: CardId; materials?: Material[]; zone?: number; pick?: CardId; negated?: true }
	/** The turn player has just Summoned these monsters: the other player may answer the Summon (Trap Hole, Effect Veiler). */
	| { kind: "summon"; zones: number[]; how: "normal" | "flip" | "special" }
	/**
	 * A monster's effect was activated (Blazeman: "If this card is Summoned: You can add…"): the other player may answer
	 * it (Ash Blossom, Ghost Ogre, Solemn Strike) before it resolves. `then`: the Summon moment that waits behind it.
	 */
	| { kind: "effect"; side: Side; card: CardId; zone: number; run: EffectRun; negated?: true; then?: { zones: number[]; how: "normal" | "flip" | "special" } }
	/** Cards were just added from the Deck to this player's hand outside the Draw Phase: the other player may answer (Droll & Lock Bird). */
	| { kind: "added"; side: Side };
/** "For the rest of this turn…": a rule a card set, until the turn ends. */
export type TurnLock = { kind: "deck-to-hand"; by: CardId };
/** What a monster's activated effect does when it resolves: add a card (Blazeman), or the steps of an effect written as data. */
export type EffectRun = { do: "add"; card: CardId } | { do: "data"; effect: number; pick?: CardId; target?: number };
/**
 * A card activated in answer that waits on the Chain while the other player may answer it in turn: the last one
 * activated resolves first (Rulebook v10 pp. 44-45). Chain Link 1 is what is pending; these are links 2 and up.
 */
export interface ChainLink {
	side: Side;
	card: CardId;
	/** What was activated, for the cards that answer it: a monster's effect, a Spell, or a Trap. */
	what: "monster" | "spell" | "trap";
	/** Spell Speed: 3 for a Counter Trap, which only another Counter Trap can answer; 2 otherwise. */
	speed: 2 | 3;
	/** The answer played when it resolves (a hand trap, a Trap). A Counter Trap has none: it negates the link below it. */
	move?: Move;
	/** The Spell & Trap Zone it was activated in. */
	zone?: number;
	/** Taken from the hand: it goes back there just before it resolves, and to the Graveyard if it is negated. */
	fromHand?: true;
	/** Negated by this card, which resolved above it. */
	negatedBy?: CardId;
}
export interface Board {
	you: SideState;
	rival: SideState;
	/** The whole mat instead of the small board. */
	full: boolean;
	turn: Side;
	turnNumber: number;
	phase: Phase;
	/** True when the turn player moves through the phases by hand. Otherwise phases follow the moves. */
	strict: boolean;
	drawn: boolean;
	summonUsed: boolean;
	/** One Pendulum Summon per turn. */
	pendulumUsed: boolean;
	pending: Pending | null;
	/** Answers waiting on top of what is pending, Chain Link 2 first. Empty unless an answer could itself be answered. */
	chain: ChainLink[];
	/** The most Chain Links a level allows (2: one answer, nothing on top of it); null for no limit. */
	chainLimit: number | null;
	/** Rules cards set "for the rest of this turn"; cleared when the turn ends. */
	locks: TurnLock[];
	winner: Side | null;
	/** Once-per-turn effects already used this turn, as "side:card". */
	used: string[];
	/** Ritual and Extra Deck monsters that were Summoned in their own way, as "owner:card": only those can come back from a Graveyard. */
	proper: string[];
	/** Monsters that went to the Graveyard with an "If/When… sent to the GY" effect, waiting for the Chain to resolve. */
	triggers: { side: Side; card: CardId; after: After | null }[];
	/** The turn player's Standby Phase effects have happened this turn. */
	standbyDone: boolean;
	/** A monster just Normal Summoned whose "When this card is Normal Summoned: You can…" may be used now, and only now. */
	summonTrigger: { side: Side; zone: number; card?: CardId } | null;
	/** Effects written as data that something just started ("If this card is Summoned / sent to the GY: You can…"): their owner may use them now, and only now. */
	triggered: { side: Side; card: CardId; effect: number; zone?: number }[];
	/** The state of the duel's random numbers (coin tosses, shuffling a Deck after a search): the same seed gives the same duel. */
	rng: number;
	/** Monsters the turn player has Summoned this turn (a Set is not a Summon), and whether a card forbids any more ("You cannot Summon other monsters the turn you activate this card"). */
	summons: number;
	summonLock: boolean;
}

export type Move =
	| { type: "draw" }
	| { type: "phase"; to: Phase }
	/**
	 * Play a card from the hand into a zone: a Monster is Normal Summoned (or, with `special`, Special Summoned by its
	 * own text), a Spell is activated, a Trap is Set, a Pendulum Monster placed in a Pendulum Zone becomes a Scale.
	 * `grave` is the Graveyard card a Spell targets; `summon` and `materials` are the choices of a Ritual or Fusion Summon.
	 * With `set`, a Monster is Normal Set face-down in Defense Position, and a Quick-Play Spell is Set. `pick` is the
	 * card of the hand a Spell Special Summons (Ancient Rules).
	 */
	| { type: "place"; card: CardId; row: Row; zone: number; tributes?: number[]; target?: number; discard?: CardId; grave?: { side: Side; index: number }; summon?: CardId; materials?: Material[]; special?: true; set?: true; pick?: CardId }
	| { type: "position"; zone: number }
	| { type: "attack"; attacker: number; target: number | "direct" }
	/**
	 * Flip a Set card: a Trap or a Quick-Play Spell in answer to the opponent, a Set Quick-Play Spell on your own turn,
	 * or a Continuous Trap that targets a monster in your Graveyard (`grave`) in your own Main Phase.
	 */
	| { type: "spring"; zone: number; target?: number; grave?: { side: Side; index: number }; discard?: CardId }
	/** Use the effect of one of your Monsters: on a face-up monster your opponent controls when it targets, or on a monster in your Graveyard (`grave`, Junk Synchron). */
	| { type: "ability"; zone: number; target?: number; grave?: { side: Side; index: number }; discard?: CardId; pick?: CardId }
	/** Synchro, Xyz or Link Summon a monster from the Extra Deck with monsters in these zones. */
	| { type: "extra"; card: CardId; materials: number[]; zone?: number }
	/** Pendulum Summon these monsters from the hand, all at once. */
	| { type: "pendulum"; cards: CardId[] }
	/** Use a Quick Effect of a monster in your hand. */
	| { type: "hand"; card: CardId; target?: number }
	/**
	 * Use an effect written as data: `effect` is its place on the card. The card is on the field (`zone`), in the hand,
	 * or in the Graveyard. `pick` is the card it chooses, `target` the Monster Zone it targets.
	 */
	| { type: "effect"; card: CardId; effect: number; zone?: number; pick?: CardId; target?: number }
	| { type: "pass" };

export type Reason =
	| "duel-over"
	| "deck-locked"
	| "answer-first"
	| "not-in-hand"
	| "wrong-zone"
	| "zone-taken"
	| "summon-used"
	| "wrong-tributes"
	| "not-main-phase"
	| "no-target"
	| "draw-first"
	| "already-drew"
	| "first-turn-no-draw"
	| "cannot-go-back"
	| "first-turn-no-battle"
	| "not-battle-phase"
	| "no-monster"
	| "defense-cannot-attack"
	| "already-attacked"
	| "monster-in-the-way"
	| "trap-just-set"
	| "nothing-to-answer"
	| "cannot-answer-that"
	| "just-summoned"
	| "position-used"
	| "cost-needed"
	| "nothing-to-hit"
	| "no-ability"
	| "not-quick"
	| "once-per-turn"
	| "extra-zone"
	| "field-zone"
	| "no-free-zone"
	| "one-per-turn"
	| "deck-too-small"
	| "no-ritual-monster"
	| "wrong-materials"
	| "levels-too-low"
	| "too-many-tributes"
	| "not-in-extra"
	| "needs-spell"
	| "needs-one-tuner"
	| "levels-not-equal"
	| "wrong-levels"
	| "link-count"
	| "link-no-defense"
	| "no-material"
	| "pendulum-zone"
	| "no-scales"
	| "pendulum-used"
	| "level-not-between"
	| "condition-not-met"
	| "special-only"
	| "not-properly-summoned"
	| "equip-only"
	| "cannot-set"
	| "not-damage-step"
	| "damage-step-closed"
	| "swords-lock"
	| "jinzo-lock"
	| "one-at-a-time"
	| "summon-locked"
	| "cannot-attack-that";

/** How a monster was Special Summoned. */
export type SummonWay = "revive" | "ritual" | "fusion" | "synchro" | "xyz" | "link" | "own";
export type GameEvent =
	| { type: "drew"; side: Side; card: CardId }
	/** A Draw Phase skipped, as a card said. */
	| { type: "skip-draw"; side: Side }
	| { type: "phase"; side: Side; phase: Phase }
	| { type: "turn"; side: Side }
	| { type: "summoned"; side: Side; card: CardId; zone: number; tributes: CardId[] }
	/** A Special Summon. `materials` are the cards used; `from` is whose Graveyard it came from. */
	| { type: "special"; side: Side; card: CardId; zone: number; how: SummonWay; materials: CardId[]; from?: Side }
	| { type: "activated"; side: Side; card: CardId; target?: CardId }
	| { type: "discarded"; side: Side; card: CardId }
	| { type: "ability"; side: Side; card: CardId; target: CardId }
	/** An "If/When… sent to the GY" effect gets its chance and is used. */
	| { type: "trigger"; side: Side; card: CardId; word: "when" | "if"; amount: number }
	/** A "When…" effect missed its chance: going to the GY was not the last thing; `last` is what came after it. */
	| { type: "missed"; side: Side; card: CardId; last: After }
	| { type: "set"; side: Side; card: CardId; zone: number }
	/** A monster was Normal Set: face-down in Defense Position. */
	| { type: "set-monster"; side: Side; card: CardId; zone: number }
	/** A face-down monster is face-up again: Flip Summoned, attacked, or by a card's effect. */
	| { type: "flipped"; side: Side; card: CardId; how: "summon" | "attack" | "effect"; zone?: number }
	/** A face-up monster was turned face-down, in Defense Position. */
	| { type: "turned-down"; side: Side; card: CardId }
	/** A coin was tossed and called by `side`. */
	| { type: "coin"; side: Side; card: CardId; right: boolean }
	/** A Continuous Spell resolved and stays face-up in its zone. */
	| { type: "stays"; side: Side; card: CardId }
	/** An Equip Spell is now equipped to this monster. */
	| { type: "equipped"; side: Side; card: CardId; target: CardId }
	/** The Battle Phase ended at once, as a card said. */
	| { type: "battle-ended"; side: Side }
	/** A Field Spell is face-up in the Field Zone and stays. */
	| { type: "field"; side: Side; card: CardId }
	| { type: "banished"; side: Side; cards: CardId[]; faceDown: boolean }
	/** A Pendulum Monster left the field: face-up on the Extra Deck instead of the Graveyard. */
	| { type: "to-extra"; side: Side; card: CardId }
	/** An Xyz Material was detached, as a cost, and sent to the Graveyard. */
	| { type: "detached"; side: Side; card: CardId; material: CardId }
	/** A Pendulum Monster was placed in a Pendulum Zone. */
	| { type: "scale"; side: Side; card: CardId; zone: number; scale: number }
	| { type: "pendulum"; side: Side; cards: CardId[]; low: number; high: number }
	/** A Quick Effect used from the hand by discarding the card. */
	| { type: "hand-effect"; side: Side; card: CardId }
	| { type: "gained"; side: Side; amount: number; lp: number }
	/** A card's effect inflicts damage (not battle damage): `side` is the player who inflicts it. */
	| { type: "burned"; side: Side; card: CardId; amount: number }
	/** An activation was negated (`card`), by a monster's effect (`by`). */
	| { type: "negated"; side: Side; card: CardId; by: CardId }
	/** A card goes to its owner's hand from the Deck or the Graveyard. */
	| { type: "added"; side: Side; card: CardId; from: "deck" | "graveyard" }
	/** ATK gained or lost: until the end of the turn (no `lasting`), for the Damage Step only, or for good. */
	| { type: "boosted"; side: Side; card: CardId; amount: number; atk: number; lasting?: "damage-step" | "for-good" }
	| { type: "destroyed"; side: Side; card: CardId }
	| { type: "no-effect"; card: CardId }
	| { type: "position"; side: Side; card: CardId; position: Position }
	/** `hidden`: the target is a face-down monster, so it is not named. */
	| { type: "attack-declared"; side: Side; attacker: CardId; target: CardId | null; hidden?: true; zone?: number }
	| { type: "window"; side: Side; kind: Pending["kind"] | "chain"; step?: "damage" }
	/** The attack goes on to the Damage Step, and the defending player may act there. */
	| { type: "damage-step"; side: Side }
	| { type: "sprung"; side: Side; card: CardId }
	| { type: "attack-stopped"; attacker: CardId }
	| { type: "returned"; side: Side; card: CardId }
	| { type: "chain"; link: number; side: Side; card: CardId }
	| { type: "resolve"; link: number; card: CardId }
	| {
			type: "battle";
			side: Side;
			attacker: CardId;
			attackerValue: number;
			defender: CardId;
			defenderValue: number;
			defenderPosition: Position;
			damage: { side: Side; amount: number } | null;
			destroyed: { side: Side; card: CardId }[];
	  }
	| { type: "direct"; side: Side; attacker: CardId; amount: number }
	| { type: "lp"; side: Side; from: number; to: number }
	| { type: "deck-out"; side: Side }
	/** All five pieces of the Forbidden One are in this player's hand. */
	| { type: "exodia"; side: Side }
	/** A card was sent to the Graveyard by an effect, from the Deck or the field (not destroyed). */
	| { type: "sent"; side: Side; card: CardId; from: "deck" | "field" }
	/** An effect written as data was activated. */
	| { type: "effect-used"; side: Side; card: CardId }
	/** A card set a rule for the rest of the turn (Droll & Lock Bird: nothing more is added from a Deck to a hand). */
	| { type: "locked"; side: Side; card: CardId }
	| { type: "won"; side: Side };

/** What happened right after a card went to the Graveyard in the same action: the card it paid for was activated, or the monster it was used for was Summoned. */
export type After = "activation" | "summon";
export type Result = { ok: true; board: Board; events: GameEvent[] } | { ok: false; reason: Reason };

export type MonsterSetup = CardId | { card: CardId; position?: Position; materials?: readonly CardId[]; faceDown?: boolean } | null;
export interface SideSetup {
	lp?: number;
	hand?: readonly CardId[];
	deck?: readonly CardId[];
	monsters?: readonly MonsterSetup[];
	/** The whole mat only: the monster in the Extra Monster Zone. */
	emz?: MonsterSetup;
	/** Traps Set on an earlier turn. */
	backrow?: readonly (CardId | null)[];
	graveyard?: readonly CardId[];
	extra?: readonly CardId[];
	/** Pendulum Monsters face-up in the Extra Deck, ready to be Pendulum Summoned from there. */
	extraUp?: readonly CardId[];
	field?: CardId;
}
export interface Setup {
	you?: SideSetup;
	rival?: SideSetup;
	/** The whole mat: five zones a row, Field Zone, Extra Deck and Extra Monster Zone. */
	full?: boolean;
	turn?: Side;
	turnNumber?: number;
	phase?: Phase;
	strict?: boolean;
	/** The seed of the duel's coin tosses. */
	seed?: number;
	/** The most Chain Links allowed (a teaching limit). */
	chainLimit?: number;
}

function fill<T, U>(list: readonly (T | null)[] | undefined, count: number, make: (item: T) => U): (U | null)[] {
	return Array.from({ length: count }, (_, zone) => {
		const item = list?.[zone];
		return item == null ? null : make(item);
	});
}
const standing = (card: CardId, extra: Partial<MonsterSlot> = {}): MonsterSlot => ({ card, position: "attack", attacked: false, summoned: false, moved: false, boost: 0, ...extra });
function monsterSlot(item: Exclude<MonsterSetup, null>): MonsterSlot {
	if (typeof item === "string") return standing(item);
	return standing(item.card, { position: item.faceDown ? "defense" : (item.position ?? "attack"), ...(item.materials ? { materials: [...item.materials] } : {}), ...(item.faceDown ? { faceDown: true } : {}) });
}
function side(setup: SideSetup = {}, full: boolean): SideState {
	const count = full ? FULL_ZONES : ZONES;
	const monsters = fill(setup.monsters, count, monsterSlot);
	if (full) monsters.push(setup.emz ? monsterSlot(setup.emz) : null);
	return {
		lp: setup.lp ?? START_LP,
		hand: [...(setup.hand ?? [])],
		deck: [...(setup.deck ?? [])],
		monsters,
		backrow: fill(setup.backrow, count, (card): BackSlot => ({ card, setThisTurn: false })),
		graveyard: [...(setup.graveyard ?? [])],
		field: setup.field ?? null,
		banished: [],
		extra: [...(setup.extra ?? [])],
		extraUp: [...(setup.extraUp ?? [])],
	};
}
export function board(setup: Setup = {}): Board {
	const phase = setup.phase ?? "main1";
	const full = setup.full ?? false;
	return { you: side(setup.you, full), rival: side(setup.rival, full), full, turn: setup.turn ?? "you", turnNumber: setup.turnNumber ?? 3, phase, strict: setup.strict ?? false, drawn: phase !== "draw", summonUsed: false, pendulumUsed: false, pending: null, chain: [], chainLimit: setup.chainLimit ?? null, locks: [], winner: null, used: [], proper: [], triggers: [], standbyDone: phase !== "draw", summonTrigger: null, triggered: [], rng: (setup.seed ?? 1) >>> 0, summons: 0, summonLock: false };
}

export const other = (who: Side): Side => (who === "you" ? "rival" : "you");
/** What a monster on the field can do now: its card, or nothing while its effects are negated. */
export const live = (slot: MonsterSlot): MonsterCard | null => (slot.negated || slot.negatedTurn || slot.faceDown ? null : monsterOf(slot.card));
/** One step of the duel's random numbers: the next state, and a number from 0 up to (not including) `below`. */
function roll(rng: number, below: number): { rng: number; value: number } {
	const next = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
	return { rng: next, value: (next >>> 8) % below };
}
/** Jinzo: "Trap Cards, and their effects on the field, cannot be activated." */
export const trapsLocked = (state: Board): boolean => [state.you, state.rival].some((who) => who.monsters.some((slot) => !!slot && !!live(slot)?.noTraps));
/** How many Main Monster Zones (and Spell & Trap Zones) each player has on this board. */
export const mainZones = (state: Board): number => (state.full ? FULL_ZONES : ZONES);
/** What the Field Spells on the field add to this monster's ATK and DEF. "On the field" means both players' monsters. */
function fieldBonus(card: CardId, state: Board): number {
	const type = monsterOf(card).type;
	if (!type) return 0;
	let bonus = 0;
	for (const who of [state.you, state.rival]) {
		const effect = who.field ? cardOf(who.field) : null;
		if (effect?.kind !== "spell" || effect.effect.type !== "field-boost") continue;
		if (effect.effect.types.includes(type)) bonus += effect.effect.amount;
		if (effect.effect.minus?.includes(type)) bonus -= effect.effect.amount;
	}
	return bonus;
}
/** Does this card fit this Fusion Material: by name ("Dark Magician", also a card whose name becomes it), or described. */
function fits(card: CardId, material: string | FusionMaterial): boolean {
	if (typeof material === "string") return named(card, material);
	const info = cardOf(card);
	if (info.kind !== "monster") return false;
	return (!material.type || info.type === material.type) && (!material.attribute || attributeOf(card) === material.attribute) && (!material.prefix || card.startsWith(material.prefix));
}
/** Are these exactly the Fusion Materials: one card for each, in some order. */
export function fusionFits(cards: readonly CardId[], recipe: readonly (string | FusionMaterial)[]): boolean {
	if (cards.length !== recipe.length) return false;
	const place = (index: number, used: readonly boolean[]): boolean => {
		if (index === recipe.length) return true;
		const material = recipe[index];
		if (material === undefined) return false;
		return cards.some((card, at) => !used[at] && fits(card, material) && place(index + 1, used.map((taken, other) => taken || other === at)));
	};
	return place(0, cards.map(() => false));
}
/** Where a monster stands: its controller and Monster Zone. */
function placeOf(slot: MonsterSlot, state: Board): { side: Side; zone: number } | null {
	for (const side of ["you", "rival"] as const) {
		const zone = state[side].monsters.indexOf(slot);
		if (zone >= 0) return { side, zone };
	}
	return null;
}
/** What face-up Equip and Continuous Spells add to this monster: its Equips, and a Banner during its controller's Battle Phase. */
function spellBonus(slot: MonsterSlot, state: Board, stat: "atk" | "def"): number {
	const at = placeOf(slot, state);
	if (!at) return 0;
	let bonus = 0;
	for (const back of state[at.side].backrow) {
		if (!back?.open) continue;
		const info = cardOf(back.card);
		if (info.kind !== "spell") continue;
		if (info.effect.type === "equip" && back.equip === at.zone) bonus += stat === "atk" ? info.effect.atk : info.effect.def;
		if (info.effect.type === "banner" && stat === "atk" && state.turn === at.side && state.phase === "battle") bonus += info.effect.amount;
	}
	return bonus;
}
/** "Gains [n] ATK for each…": what the monster's own effect adds now. */
function gainsOf(slot: MonsterSlot, state: Board, stat: "atk" | "def"): number {
	const gains = live(slot)?.gains;
	const at = gains ? placeOf(slot, state) : null;
	if (!gains || !at) return 0;
	const mine = state[at.side];
	const foe = state[other(at.side)];
	if (gains.per === "hand") return mine.hand.length * gains.amount;
	if (stat === "def") return 0;
	if (gains.per === "in-graveyards") return [...state.you.graveyard, ...state.rival.graveyard].filter((card) => gains.cards.some((name) => named(card, name))).length * gains.amount;
	if (gains.per === "graveyard-prefix") return mine.graveyard.filter((card) => card.startsWith(gains.prefix)).length * gains.amount;
	if (gains.per === "all-dragons") {
		const isDragon = (card: CardId) => cardOf(card).kind === "monster" && monsterOf(card).type === "dragon";
		const onField = [state.you, state.rival].flatMap((who) => who.monsters.flatMap((other) => (other ? [other.card] : [])));
		return [...onField, ...state.you.graveyard, ...state.rival.graveyard].filter(isDragon).length * gains.amount;
	}
	if (gains.per === "allies") return mine.monsters.filter((other) => !!other && other !== slot && gains.cards.includes(other.card)).length * gains.amount;
	if (gains.per === "small-hand") return mine.hand.length <= 1 ? gains.amount : 0;
	const dragon = (card: CardId) => cardOf(card).kind === "monster" && monsterOf(card).type === "dragon";
	return (foe.monsters.filter((other) => !!other && dragon(other.card)).length + foe.graveyard.filter(dragon).length) * gains.amount;
}
export const atkOf = (slot: MonsterSlot, state: Board) => Math.max(0, monsterOf(slot.card).atk + slot.boost + (slot.bonus ?? 0) + fieldBonus(slot.card, state) + spellBonus(slot, state, "atk") + gainsOf(slot, state, "atk"));
export const defOf = (slot: MonsterSlot, state: Board) => Math.max(0, monsterOf(slot.card).def + (slot.defBonus ?? 0) + fieldBonus(slot.card, state) + spellBonus(slot, state, "def") + gainsOf(slot, state, "def"));
/** The two Pendulum Zones are the leftmost and rightmost Spell & Trap Zones. The Scales set there, low then high, or null. */
export function scalesOf(state: Board, who: Side): { low: number; high: number } | null {
	const row = state[who].backrow;
	const scales = [row[0], row[row.length - 1]].flatMap((slot) => (slot?.up ? [monsterOf(slot.card).scale ?? 0] : []));
	const [a, b] = scales;
	return a === undefined || b === undefined ? null : { low: Math.min(a, b), high: Math.max(a, b) };
}
/** The player who has to act now: the turn player, or the other one while they may answer. */
export function actor(state: Board): Side {
	const top = state.chain.at(-1);
	if (top) return other(top.side);
	return state.pending ? other(state.turn) : state.turn;
}
const isMain = (phase: Phase) => phase === "main1" || phase === "main2";
const after = (a: Phase, b: Phase) => PHASES.indexOf(a) > PHASES.indexOf(b);
const TRAP_ANSWERS: Record<Pending["kind"], Effect["type"][]> = { attack: ["weaken-attacker", "stop-attack", "destroy-attacker", "banish-attacker", "reinforce", "negate-attack", "mirror-force", "magic-cylinder", "just-desserts", "clear-backrow", "recharge", "storm-force", "ruin"], spell: ["return-to-hand"], summon: ["trap-hole", "bottomless", "torrential"], effect: [], added: [] };
/** What Ash Blossom & Joyous Spring can negate: an effect that adds a card from the Deck to the hand or Special Summons from the Deck. */
function ashHits(card: CardId): boolean {
	const categories = cardCategories(card);
	return ashCategories.some((category) => categories.has(category));
}
/** What a Set Quick-Play Spell can do in answer, on a monster it targets; the ones that change ATK also in the Damage Step. */
const QUICK_ANSWERS: Effect["type"][] = ["boost", "destroy", "shrink", "chalice", "book", "switch"];
const DAMAGE_STEP_QUICK: Effect["type"][] = ["boost", "shrink", "chalice"];
/** Quick-Play Spells with no target that can also be flipped in answer. */
const QUICK_FREE: Effect["type"][] = ["coin-wipe", "curtain"];
/** A Trap whose target is one of its owner's monsters needs one on the field. */
const needsOwnMonster = (effect: Effect["type"]) => effect === "return-to-hand" || effect === "reinforce";

/** Seen from its player, the Extra Monster Zone sits above Main Monster Zone 1 (the left one of the two, as on the mat). */
const EXTRA_ABOVE = 1;
/**
 * The zone of the same player a Link Monster in `zone` points to with this arrow, or null (an arrow off the mat, or to
 * the other player's side). Main Monster Zones 0 to 4 run from left to right.
 */
function arrowTarget(zone: number, arrow: Arrow): number | null {
	if (zone === EXTRA_ZONE) {
		const below: Partial<Record<Arrow, number>> = { "bottom-left": EXTRA_ABOVE - 1, bottom: EXTRA_ABOVE, "bottom-right": EXTRA_ABOVE + 1 };
		return below[arrow] ?? null;
	}
	if (arrow === "left") return zone > 0 ? zone - 1 : null;
	if (arrow === "right") return zone < FULL_ZONES - 1 ? zone + 1 : null;
	const up: Partial<Record<Arrow, number>> = { "top-right": EXTRA_ABOVE - 1, top: EXTRA_ABOVE, "top-left": EXTRA_ABOVE + 1 };
	return up[arrow] === zone ? EXTRA_ZONE : null;
}
/**
 * Can these materials make this Link Rating? Each counts as 1; a Link Monster may count as its Link Rating instead
 * (Rulebook: a Link Monster used as material counts as 1 material or as many as its Link Rating).
 */
function linkRatingFits(materials: readonly MonsterCard[], rating: number): boolean {
	let sums = new Set([materials.length]);
	for (const material of materials) {
		const extra = (material.link ?? 1) - 1;
		if (extra <= 0) continue;
		sums = new Set([...sums, ...[...sums].map((sum) => sum + extra)]);
	}
	return sums.has(rating);
}

class Rejected extends Error {
	constructor(readonly reason: Reason) {
		super(reason);
	}
}
function reject(reason: Reason): never {
	throw new Rejected(reason);
}

/** One move in progress, on a private copy of the board. */
class Play {
	readonly state: Board;
	readonly events: GameEvent[] = [];
	/** Set while an answer that waited on the Chain resolves: it is played at once, not put on the Chain again. */
	resolving = false;
	/** Every card that went to a Graveyard during this move, in order: for "If this card is sent to the GY" effects. */
	private readonly sentToGraveyard: { side: Side; card: CardId }[] = [];
	constructor(
		source: Board,
		private readonly forced: { coin?: boolean } = {},
	) {
		this.state = structuredClone(source);
	}
	/** "Toss a coin and call it": true when it is called right. Tossed with the duel's seed, unless the result is given (the bots weigh both). */
	private coin(who: Side, card: CardId): boolean {
		const s = this.state;
		const tossed = roll(s.rng, 2);
		s.rng = tossed.rng;
		const right = this.forced.coin ?? tossed.value === 0;
		this.events.push({ type: "coin", side: who, card, right });
		return right;
	}
	/** A Deck is shuffled after a card was taken from it. */
	private shuffle(deck: CardId[]): void {
		const s = this.state;
		for (let index = deck.length - 1; index > 0; index--) {
			const rolled = roll(s.rng, index + 1);
			s.rng = rolled.rng;
			[deck[index], deck[rolled.value]] = [deck[rolled.value] as CardId, deck[index] as CardId];
		}
	}
	/** A Summon by the turn player (not a Set): refused when a card forbids any more this turn, and counted. */
	private summoning(): void {
		if (this.state.summonLock) reject("summon-locked");
		this.state.summons += 1;
	}
	/** Does this player control a face-up monster with this name (or, for an archetype, whose name starts with it)? */
	private controls(who: Side, name: string, archetype = false): boolean {
		return this.state[who].monsters.some((slot) => !!slot && !slot.faceDown && (named(slot.card, name) || (archetype && slot.card.startsWith(name))));
	}
	/** A face-down monster is flipped face-up. */
	private flip(who: Side, slot: MonsterSlot, how: "summon" | "attack" | "effect"): void {
		if (!slot.faceDown) return;
		delete slot.faceDown;
		this.events.push({ type: "flipped", side: who, card: slot.card, how, zone: this.state[who].monsters.indexOf(slot) });
	}
	private get me() {
		return this.state[this.state.turn];
	}
	private get auto() {
		return !this.state.strict || this.state.turn === "rival";
	}

	run(move: Move): void {
		/* "When this card is Normal Summoned: You can…": only right after the Summon. */
		const trigger = this.state.summonTrigger;
		/* While the other player answers the Summon itself, the monster's own "When… Summoned" effect still waits. */
		if (this.state.pending?.kind !== "summon") this.state.summonTrigger = null;
		const triggered = this.state.triggered;
		if (!this.state.pending) this.state.triggered = [];
		if (move.type === "effect") this.useEffect(move, triggered);
		else if (move.type === "ability" && move.grave) this.summonRevive(trigger, move.zone, move.grave);
		else if (move.type === "ability" && move.pick) this.summonSearch(trigger, move.zone, move.pick);
		else this.move(move);
		this.afterSummons();
		this.afterTriggers();
		this.afterAdding();
		/* The monster whose "When… Summoned" effect was waiting lost its effects in answer to its Summon (Effect Veiler). Destroyed (Trap Hole), its effect still happens. */
		const waiting = this.state.summonTrigger;
		const summoned = waiting ? this.state[waiting.side].monsters[waiting.zone] : null;
		if (waiting && summoned && (!waiting.card || summoned.card === waiting.card) && !live(summoned)) this.state.summonTrigger = null;
		/* Effects that wait for the Graveyard get their chance once nothing is left to resolve. */
		if (!this.state.pending && !this.state.winner) this.fireTriggers();
		/* "…in your hand, you win the Duel": no Life Points, no Chain. Checked once the move is done. */
		for (const who of [this.state.turn, other(this.state.turn)]) {
			if (this.state.winner) break;
			if (FORBIDDEN_ONE.every((piece) => this.state[who].hand.includes(piece))) {
				this.events.push({ type: "exodia", side: who });
				this.win(who);
			}
		}
	}
	/**
	 * Once a move is done: what a monster does "if it is Summoned" (Blazeman), then, when the turn player Summoned
	 * monsters and the other player can answer a Summon, the moment to do so.
	 */
	private afterSummons(): void {
		const s = this.state;
		if (s.winner) return;
		const zones: number[] = [];
		let how: "normal" | "flip" | "special" = "special";
		let opened: Extract<Pending, { kind: "effect" }> | null = null;
		for (const event of this.events) {
			if (event.type !== "summoned" && event.type !== "special" && !(event.type === "flipped" && event.how === "summon")) continue;
			if (event.zone === undefined) continue;
			const slot = s[event.side].monsters[event.zone];
			if (!slot || slot.card !== event.card) continue;
			/* "If this card is Normal or Special Summoned: You can add 1 [Polymerization] from your Deck to your hand." */
			const add = event.type === "flipped" ? undefined : live(slot)?.summonAdd;
			const at = add ? s[event.side].deck.indexOf(add as CardId) : -1;
			/* "You can only use 1 [Elemental HERO Blazeman] effect per turn, and only once that turn." */
			const once = `${event.side}:${event.card}:add`;
			if (add && at >= 0 && !s.used.includes(once) && !this.deckLocked()) {
				s.used.push(once);
				/* The effect is activated: the other player may answer it before the card is added (Ash Blossom, Solemn Strike). */
				const effect: Extract<Pending, { kind: "effect" }> = { kind: "effect", side: event.side, card: event.card, zone: event.zone, run: { do: "add", card: add as CardId } };
				if (!s.pending && !opened && event.side === s.turn && isMain(s.phase)) {
					s.pending = effect;
					if (this.canAnswer()) opened = effect;
					else s.pending = null;
				}
				if (opened !== effect) this.addFromDeck(event.side, add as CardId);
			}
			if (event.side !== s.turn) continue;
			zones.push(event.zone);
			if (event.type === "summoned") how = "normal";
			else if (event.type === "flipped") how = "flip";
		}
		if (opened) {
			/* The Summon's own moment waits until the effect has resolved. */
			if (zones.length > 0) opened.then = { zones, how };
			this.events.push({ type: "window", side: other(s.turn), kind: "effect" });
			return;
		}
		/* A Summon in the middle of a battle (a card flipped during an attack) gets no such moment: the battle is already over. */
		if (zones.length === 0 || s.pending || !isMain(s.phase)) return;
		this.openSummon(zones, how);
	}
	/** The other player may answer the turn player's Summon, when they have something to answer it with. */
	private openSummon(zones: number[], how: "normal" | "flip" | "special"): void {
		const s = this.state;
		const still = zones.filter((zone) => !!s[s.turn].monsters[zone]);
		if (still.length === 0 || s.winner) return;
		s.pending = { kind: "summon", zones: still, how };
		if (this.canAnswer()) this.events.push({ type: "window", side: other(s.turn), kind: "summon" });
		else s.pending = null;
	}
	/** Does the monster's effect that is pending do one of these things? */
	private effectHits(pending: Extract<Pending, { kind: "effect" }>, categories: readonly Category[]): boolean {
		const run = pending.run;
		const found: Set<Category> = run.do === "add" ? new Set<Category>(["search"]) : categoriesOf(effectsOf(pending.card)[run.effect]?.actions ?? []);
		return categories.some((category) => found.has(category));
	}
	/**
	 * The zones of this player its Link Monsters point to. `leaving`: zones whose monsters are about to leave the field
	 * (the materials of a Summon): they point to nothing any more.
	 */
	private pointed(who: Side, leaving: readonly number[] = []): Set<number> {
		const out = new Set<number>();
		if (!this.state.full) return out;
		this.state[who].monsters.forEach((slot, zone) => {
			if (!slot || slot.faceDown || leaving.includes(zone)) return;
			for (const target of this.pointedBy(who, zone)) out.add(target);
		});
		return out;
	}
	/** The zones of its own player the monster in this zone points to: none unless it is a Link Monster. */
	private pointedBy(who: Side, zone: number | undefined): number[] {
		const slot = zone === undefined ? null : this.state[who].monsters[zone];
		if (!slot || !this.state.full || zone === undefined) return [];
		return (monsterOf(slot.card).arrows ?? []).flatMap((arrow) => {
			const target = arrowTarget(zone, arrow);
			return target === null ? [] : [target];
		});
	}
	/** The first free Main Monster Zone of this player, or -1. */
	private freeZone(who: Side): number {
		const s = this.state;
		return s[who].monsters.findIndex((slot, zone) => zone < mainZones(s) && !slot);
	}
	/** Can these steps start with this choice: the chosen card is where they look and fits, the target fits, there is room? */
	private stepsReady(who: Side, actions: readonly Action[], pick: CardId | undefined, target: number | undefined, self: CardId, zone?: number): boolean {
		const s = this.state;
		const mine = s[who];
		const choice = choiceOf(actions);
		if (choice) {
			/* "except [this card]" is in the filter when the card says so: Destiny HERO - Malicious calls another copy of itself. */
			if (!pick || !fitsFilter(pick, choice.filter)) return false;
			if (!choice.from.some((place) => mine[place].includes(pick))) return false;
		}
		const aim = targetOf(actions);
		if (aim) {
			const slot = target === undefined ? null : mine.monsters[target];
			if (!slot || slot.faceDown || !fitsFilter(slot.card, aim)) return false;
		}
		/* "To your zone this card points to": one of them must be free. */
		if (actions.some((action) => action.do === "special" && action.to === "pointed") && !this.pointedBy(who, zone).some((at) => !mine.monsters[at])) return false;
		/* A Special Summon needs a free zone, unless a monster sent from the field just before makes one. */
		if (actions.some((action) => action.do === "special") && this.freeZone(who) < 0 && !aim) return false;
		return true;
	}
	/** The keys that say an effect was used this turn: "once per turn" by name, or 1 effect of the card per turn. */
	private onceKeys(who: Side, card: CardId, index: number, effect: DataEffect, zone: number): string[] {
		if (effect.once === "name") return [`${who}:${card}:effect-${index}`];
		if (effect.once === "copy") return [`${who}:${card}:effect-${index}:zone-${zone}`];
		if (effect.once === "shared") return [`${who}:${card}:effects`];
		return [];
	}
	/** The player uses an effect written as data: an ignition effect in their Main Phase, or one that something just started. */
	private useEffect(move: Extract<Move, { type: "effect" }>, triggered: Board["triggered"]): void {
		const s = this.state;
		if (s.winner) reject("duel-over");
		if (s.pending) reject("answer-first");
		const who = s.turn;
		const effect = effectsOf(move.card)[move.effect];
		if (!effect) return reject("no-ability");
		const mine = s[who];
		let zone = -1;
		if (effect.when === "ignition") {
			this.needMain();
			const from = effect.from ?? "field";
			if (from === "field") {
				const slot = move.zone === undefined ? null : mine.monsters[move.zone];
				if (!slot || slot.card !== move.card || !live(slot)) return reject("no-ability");
				zone = move.zone as number;
			} else if (!mine[from].includes(move.card)) return reject(from === "hand" ? "not-in-hand" : "no-ability");
		} else {
			const ready = triggered.find((item) => item.side === who && item.card === move.card && item.effect === move.effect);
			if (!ready) return reject("nothing-to-answer");
			zone = ready.zone ?? -1;
			/* The other effects started at the same time may still be used next. */
			s.triggered = triggered.filter((item) => item !== ready);
		}
		this.activate(who, move.card, move.effect, zone, move.pick, move.target, false);
	}
	/**
	 * An effect written as data is activated: it counts as used and its cost is paid, then the other player may answer
	 * it, or it resolves at once. With `auto`, an effect that cannot start with this choice is skipped instead of refused.
	 */
	private activate(who: Side, card: CardId, index: number, zone: number, pick: CardId | undefined, target: number | undefined, auto: boolean): boolean {
		const s = this.state;
		const effect = effectsOf(card)[index];
		if (!effect) return false;
		const refuse = (reason: Reason): false => (auto ? false : reject(reason));
		const keys = this.onceKeys(who, card, index, effect, zone);
		if (keys.some((key) => s.used.includes(key))) return refuse("once-per-turn");
		if (!this.stepsReady(who, effect.actions, pick, target, card, zone)) return refuse("no-target");
		if (this.deckLocked() && choiceOf(effect.actions)?.from.includes("deck") && categoriesOf(effect.actions).has("search")) return refuse("deck-locked");
		const mine = s[who];
		if (effect.cost === "discard-self" && !mine.hand.includes(card)) return refuse("not-in-hand");
		if (effect.cost === "banish-self" && !mine.graveyard.includes(card)) return refuse("no-ability");
		const self = zone >= 0 ? mine.monsters[zone] : null;
		if (effect.cost === "send-self" && (!self || self.card !== card || self.faceDown)) return refuse("no-ability");
		s.used.push(...keys);
		if (effect.cost === "discard-self") {
			mine.hand.splice(mine.hand.indexOf(card), 1);
			this.toGraveyard(who, card, "activation");
			this.events.push({ type: "discarded", side: who, card });
		}
		if (effect.cost === "banish-self") {
			mine.graveyard.splice(mine.graveyard.lastIndexOf(card), 1);
			mine.banished.push({ card, faceDown: false });
			this.events.push({ type: "banished", side: who, cards: [card], faceDown: false });
		}
		if (effect.cost === "send-self") {
			this.events.push({ type: "sent", side: who, card, from: "field" });
			this.leave(who, zone, "graveyard", "activation");
		}
		this.events.push({ type: "effect-used", side: who, card });
		const run: EffectRun = { do: "data", effect: index, ...(pick ? { pick } : {}), ...(target === undefined ? {} : { target }) };
		const pending: Extract<Pending, { kind: "effect" }> = { kind: "effect", side: who, card, zone, run };
		/* The turn player's effect: the other player may answer it (Ash Blossom, Ghost Ogre, Solemn Strike) before it resolves. */
		if (who === s.turn && !s.pending && !this.resolving) {
			s.pending = pending;
			if (this.canAnswer()) {
				this.events.push({ type: "window", side: other(who), kind: "effect" });
				return true;
			}
			s.pending = null;
		}
		this.resolveEffect(pending);
		return true;
	}
	/**
	 * Once a move is done: effects written as data that what happened started ("If this card is Summoned", "If this card
	 * is sent to the GY"). The turn player may use an optional one now; any other happens by itself, with the first card
	 * that fits. What those effects do may start more.
	 */
	private afterTriggers(): void {
		const s = this.state;
		let scanned = 0;
		for (let round = 0; round < 8 && !s.winner; round++) {
			const started: Board["triggered"] = [];
			for (const event of this.events.slice(scanned)) {
				/* "When this card is Summoned" counts a Flip Summon too. */
				const flip = event.type === "flipped" && event.how === "summon";
				if ((event.type !== "summoned" && event.type !== "special" && !flip) || event.zone === undefined) continue;
				const slot = s[event.side].monsters[event.zone];
				if (!slot || slot.card !== event.card || !live(slot)) continue;
				effectsOf(event.card).forEach((effect, index) => {
					const when = effect.when === "summoned" || (effect.when === "normal-summoned" && event.type === "summoned") || (effect.when === "special-summoned" && event.type === "special");
					if (when) started.push({ side: event.side, card: event.card, effect: index, zone: event.zone });
				});
			}
			scanned = this.events.length;
			for (const sent of this.sentToGraveyard.splice(0)) effectsOf(sent.card).forEach((effect, index) => effect.when === "sent-to-gy" && started.push({ side: sent.side, card: sent.card, effect: index }));
			if (started.length === 0) return;
			for (const item of started) {
				const effect = effectsOf(item.card)[item.effect];
				if (!effect) continue;
				if (effect.optional && item.side === s.turn) s.triggered.push(item);
				else this.autoActivate(item);
			}
		}
	}
	/** A started effect that happens by itself: with the first card that fits its choice and its target. */
	private autoActivate(item: Board["triggered"][number]): void {
		const s = this.state;
		const effect = effectsOf(item.card)[item.effect];
		if (!effect) return;
		const mine = s[item.side];
		const choice = choiceOf(effect.actions);
		const aim = targetOf(effect.actions);
		const picks: (CardId | undefined)[] = choice ? [...new Set(choice.from.flatMap((place) => mine[place]))].filter((card) => fitsFilter(card, choice.filter)) : [undefined];
		const targets: (number | undefined)[] = aim ? mine.monsters.flatMap((slot, zone) => (slot && fitsFilter(slot.card, aim) ? [zone] : [])) : [undefined];
		for (const pick of picks) for (const target of targets) if (this.activate(item.side, item.card, item.effect, item.zone ?? -1, pick, target, true)) return;
	}
	/** The steps of an effect, in order. A step that finds nothing to do stops the ones after it ("and if you do"). */
	private runSteps(who: Side, actions: readonly Action[], source: CardId, pick?: CardId, target?: number, zone?: number): void {
		for (const action of actions) {
			if (this.state.winner) return;
			if (!this.runStep(who, action, pick, target, zone)) {
				this.events.push({ type: "no-effect", card: source });
				return;
			}
		}
	}
	private runStep(who: Side, action: Action, pick?: CardId, target?: number, source?: number): boolean {
		const s = this.state;
		const mine = s[who];
		switch (action.do) {
			case "search": {
				if (!pick || !fitsFilter(pick, action.filter) || !mine.deck.includes(pick) || this.deckLocked()) return false;
				this.addFromDeck(who, pick);
				return true;
			}
			case "mill": {
				const at = pick && fitsFilter(pick, action.filter) ? mine.deck.indexOf(pick) : -1;
				if (at < 0) return false;
				mine.deck.splice(at, 1);
				this.toGraveyard(who, pick as CardId, null);
				this.events.push({ type: "sent", side: who, card: pick as CardId, from: "deck" });
				return true;
			}
			case "send-target": {
				const slot = target === undefined ? null : mine.monsters[target];
				if (!slot || slot.faceDown || !fitsFilter(slot.card, action.filter)) return false;
				this.events.push({ type: "sent", side: who, card: slot.card, from: "field" });
				this.leave(who, target as number, "graveyard");
				return true;
			}
			case "special": {
				const place = pick && fitsFilter(pick, action.filter) ? action.from.find((at) => mine[at].includes(pick)) : undefined;
				const zone = action.to === "pointed" ? (this.pointedBy(who, source).find((at) => !mine.monsters[at]) ?? -1) : this.freeZone(who);
				if (!pick || !place || zone < 0) return false;
				const list = mine[place];
				list.splice(list.indexOf(pick), 1);
				if (place === "deck") this.shuffle(mine.deck);
				mine.monsters[zone] = standing(pick, { summoned: true });
				if (who === s.turn) s.summons += 1;
				this.events.push({ type: "special", side: who, card: pick, zone, how: "own", materials: [] });
				return true;
			}
			case "draw": {
				if (this.deckLocked()) return false;
				for (let count = 0; count < action.count; count++) {
					const top = mine.deck.shift();
					if (!top) {
						this.events.push({ type: "deck-out", side: who });
						this.win(other(who));
						return false;
					}
					mine.hand.push(top);
					this.events.push({ type: "drew", side: who, card: top });
				}
				return true;
			}
		}
	}
	/** "Cards cannot be added from either player's Main Deck to the hand" this turn (Droll & Lock Bird). */
	private deckLocked(): boolean {
		return this.state.locks.some((lock) => lock.kind === "deck-to-hand");
	}
	/**
	 * Once a move is done: cards were added from the Deck to the turn player's hand outside the Draw Phase (a search, a
	 * draw), and the other player holds a card that answers that (Droll & Lock Bird): the moment to use it.
	 */
	private afterAdding(): void {
		const s = this.state;
		if (s.pending || s.winner || s.phase === "draw") return;
		const added = this.events.some((event) => (event.type === "added" && event.from === "deck" && event.side === s.turn) || (event.type === "drew" && event.side === s.turn));
		if (!added) return;
		s.pending = { kind: "added", side: s.turn };
		if (this.canAnswer()) this.events.push({ type: "window", side: other(s.turn), kind: "added" });
		else s.pending = null;
	}
	/** A card is added from the Deck to the hand, and the Deck is shuffled. */
	private addFromDeck(who: Side, card: CardId): void {
		if (this.deckLocked()) return;
		const deck = this.state[who].deck;
		const at = deck.indexOf(card);
		if (at < 0) return;
		deck.splice(at, 1);
		this.shuffle(deck);
		this.state[who].hand.push(card);
		this.events.push({ type: "added", side: who, card, from: "deck" });
	}
	/**
	 * A monster's activated effect resolves, unless it was negated, or the monster lost its effects on the field before
	 * it resolved (Effect Veiler, Infinite Impermanence). Destroyed in answer (Ghost Ogre), its effect still resolves.
	 */
	private resolveEffect(pending: Extract<Pending, { kind: "effect" }>): void {
		const slot = pending.zone >= 0 ? this.state[pending.side].monsters[pending.zone] : null;
		const lost = !!slot && slot.card === pending.card && !live(slot);
		if (lost) this.events.push({ type: "no-effect", card: pending.card });
		else if (!pending.negated) {
			const run = pending.run;
			if (run.do === "add") this.addFromDeck(pending.side, run.card);
			else this.runSteps(pending.side, effectsOf(pending.card)[run.effect]?.actions ?? [], pending.card, run.pick, run.target, pending.zone >= 0 ? pending.zone : undefined);
		}
		if (pending.then && isMain(this.state.phase)) this.openSummon(pending.then.zones, pending.then.how);
	}
	/** The Battle Phase ends at once, as a card said. */
	private endBattle(): void {
		const s = this.state;
		if (s.phase !== "battle") return;
		s.phase = "main2";
		this.events.push({ type: "battle-ended", side: s.turn }, { type: "phase", side: s.turn, phase: "main2" });
	}
	/** Can this card of `who`'s hand be used now, in answer to what is pending? */
	private handReady(who: Side, card: CardId): boolean {
		const s = this.state;
		const pending = s.pending;
		const info = cardOf(card);
		const damageStep = pending?.kind === "attack" && pending.step === "damage";
		/* Infinite Impermanence: "If you control no cards, you can activate this card from your hand." */
		if (pending && info.kind === "trap" && info.effect.type === "impermanence") return !damageStep && !trapsLocked(s) && this.controlsNothing(who) && this.faceUpFoe();
		const effect = info.kind === "monster" ? info.hand : undefined;
		if (!pending || !effect) return false;
		if (effect === "no-battle-damage") return damageStep;
		if (damageStep) return false;
		if (effect === "ash") return ((pending.kind === "spell" && ashHits(pending.card)) || (pending.kind === "effect" && this.effectHits(pending, ashCategories))) && !s.used.includes(`${who}:ash`);
		/* Droll & Lock Bird: "If a card(s) is added from the Main Deck to your opponent's hand, except during the Draw Phase". */
		if (effect === "droll") return pending.kind === "added" && pending.side !== who && !this.deckLocked();
		/* Ghost Ogre & Snow Rabbit: "When a monster on the field activates its effect": that monster is still there. */
		if (effect === "ogre") return pending.kind === "effect" && s[pending.side].monsters[pending.zone]?.card === pending.card && !s.used.includes(`${who}:ogre`);
		if (effect === "veiler") return pending.kind !== "attack" && isMain(s.phase) && s[s.turn].monsters.some((slot) => !!slot && !slot.faceDown && isEffectMonster(slot.card));
		if (effect === "crow") return pending.kind === "spell" && pending.grave?.side === s.turn;
		const direct = pending.kind === "attack" && pending.target === "direct";
		if (effect === "scarecrow") return direct;
		return direct && s[who].monsters.some((slot, zone) => zone < mainZones(s) && !slot);
	}
	/** A card goes to its owner's Graveyard. `followedBy` is what happens right after it in the same action, if anything. */
	private toGraveyard(who: Side, card: CardId, followedBy: After | null): void {
		this.state[who].graveyard.push(card);
		this.sentToGraveyard.push({ side: who, card });
		const info = cardOf(card);
		if (info.kind === "monster" && info.trigger) this.state.triggers.push({ side: who, card, after: followedBy });
	}
	/**
	 * A monster leaves the field. Its Xyz Materials go to the Graveyard. A Pendulum Monster that would go to the
	 * Graveyard is placed face-up on the Extra Deck instead; an Extra Deck monster returned to the hand goes back to the Extra Deck.
	 */
	private leave(who: Side, zone: number, to: "graveyard" | "banished" | "hand", followedBy: After | null = null): CardId | null {
		const s = this.state;
		const slot = s[who].monsters[zone];
		if (!slot) return null;
		s[who].monsters[zone] = null;
		const owner = slot.owner ?? who;
		for (const material of slot.materials ?? []) this.toGraveyard(this.ownerOf(slot, material, owner), material, null);
		if (to === "banished" || slot.banishOnLeave) {
			s[owner].banished.push({ card: slot.card, faceDown: false });
			/* Battle Fader: "banish it when it leaves the field", wherever it was going. */
			if (to !== "banished") this.events.push({ type: "banished", side: owner, cards: [slot.card], faceDown: false });
		}
		else if (to === "hand") (inExtraDeck(slot.card) ? s[owner].extra : s[owner].hand).push(slot.card);
		else if (monsterOf(slot.card).scale !== undefined) {
			s[owner].extraUp.push(slot.card);
			this.events.push({ type: "to-extra", side: owner, card: slot.card });
		} else this.toGraveyard(owner, slot.card, followedBy);
		/* Then what was linked to it: an Equip Spell, the Continuous Trap that Summoned it. */
		this.unlink(who, zone);
		return slot.card;
	}
	/**
	 * A monster has left this zone: an Equip Spell equipped to it is destroyed, and so is the Continuous Trap that
	 * Special Summoned it ("When that monster is destroyed, destroy this card").
	 */
	private unlink(who: Side, zone: number): void {
		const row = this.state[who].backrow;
		row.forEach((back, at) => {
			if (!back?.open || (back.equip !== zone && back.haunt !== zone)) return;
			row[at] = null;
			this.toGraveyard(who, back.card, null);
			this.events.push({ type: "destroyed", side: who, card: back.card });
		});
	}
	/** Whose Graveyard an Xyz Material goes to: its owner's, which is the opponent's for a monster that was borrowed. */
	private ownerOf(slot: MonsterSlot, material: CardId, holder: Side): Side {
		const at = slot.borrowed?.indexOf(material) ?? -1;
		if (at < 0) return holder;
		slot.borrowed?.splice(at, 1);
		return other(holder);
	}
	private fireTriggers(): void {
		const s = this.state;
		const waiting = s.triggers;
		s.triggers = [];
		for (const { side, card, after } of waiting) {
			if (s.winner) return;
			const trigger = monsterOf(card).trigger;
			if (!trigger) continue;
			const foe = other(side);
			const spirit = s[foe].monsters.find((slot) => !!slot && !!live(slot)?.negatesGraveyard);
			const key = `${foe}:graveyard-negate`;
			if (spirit && !s.used.includes(key) && !(trigger.word === "when" && after && !trigger.forced)) {
				s.used.push(key);
				this.events.push({ type: "negated", side: foe, card, by: spirit.card });
				continue;
			}
			/* "If…" always gets its chance; "When… you can" only when going to the GY was the last thing that happened. */
			if (trigger.word === "when" && after && !trigger.forced) {
				this.events.push({ type: "missed", side, card, last: after });
				continue;
			}
			if (trigger.gain) {
				s[side].lp += trigger.gain;
				this.events.push({ type: "gained", side, amount: trigger.gain, lp: s[side].lp });
				continue;
			}
			this.events.push({ type: "trigger", side, card, word: trigger.word, amount: trigger.damage });
			this.damage(other(side), trigger.damage);
		}
	}
	private move(move: Move): void {
		const s = this.state;
		if (s.winner) reject("duel-over");
		if (s.chain.length > 0) return this.answerLink(move);
		if (s.pending && !this.resolving && (move.type === "spring" || move.type === "ability" || move.type === "hand")) {
			const link = this.linkOf(move);
			if (link) return this.addLink(link, move);
		}
		if (s.pending && move.type !== "spring" && move.type !== "ability" && move.type !== "hand" && move.type !== "pass") reject("answer-first");
		switch (move.type) {
			case "draw":
				return this.draw();
			case "phase":
				return this.toPhase(move.to);
			case "place":
				return this.place(move);
			case "position":
				return this.position(move.zone);
			case "attack":
				return this.attack(move.attacker, move.target);
			case "spring":
				return this.spring(move.zone, move.target, move.grave);
			case "ability":
				return this.ability(move.zone, move.target, move.discard);
			case "extra":
				return this.extraSummon(move);
			case "pendulum":
				return this.pendulumSummon(move.cards);
			case "hand":
				return this.handEffect(move.card, move.target);
			case "pass":
				if (!s.pending) reject("nothing-to-answer");
				return this.resolvePending();
		}
	}

	/**
	 * The answer this move activates, when it goes on the Chain instead of resolving at once: a Counter Trap always,
	 * any other answer only when the opponent could answer it in turn. Null: it is played at once, as always.
	 */
	private linkOf(move: Extract<Move, { type: "spring" | "ability" | "hand" }>): ChainLink | null {
		const s = this.state;
		const link = this.describe(other(s.turn), move);
		if (!link) return null;
		if (link.speed === 3) return link;
		if (!this.counterReady(s.turn, link, s.chain.length + 3)) return null;
		/* Checked as if it were played now: an answer that could not be made is refused, Chain or not. */
		const trial = new Play(s, this.forced);
		trial.resolving = true;
		trial.move(move);
		return link;
	}
	/** What an answering move activates: a monster's effect (from the hand or the field), a Trap, or a Quick-Play Spell. */
	private describe(who: Side, move: Extract<Move, { type: "spring" | "ability" | "hand" }>): ChainLink | null {
		const s = this.state;
		if (move.type === "hand") {
			const info = s[who].hand.includes(move.card) ? cardOf(move.card) : null;
			if (info?.kind === "monster" && info.hand) return { side: who, card: move.card, what: "monster", speed: 2, move, fromHand: true };
			if (info?.kind === "trap" && info.effect.type === "impermanence") return { side: who, card: move.card, what: "trap", speed: 2, move, fromHand: true };
			return null;
		}
		if (move.type === "ability") {
			const slot = s[who].monsters[move.zone];
			return slot ? { side: who, card: slot.card, what: "monster", speed: 2, move } : null;
		}
		const slot = s[who].backrow[move.zone];
		if (!slot || slot.up || slot.open || slot.chained) return null;
		const info = cardOf(slot.card);
		if (info.kind === "trap") return { side: who, card: slot.card, what: "trap", speed: info.effect.type === "counter" ? 3 : 2, move, zone: move.zone };
		return info.kind === "spell" && isQuickPlay(slot.card) ? { side: who, card: slot.card, what: "spell", speed: 2, move, zone: move.zone } : null;
	}
	/** What is pending, as a Counter Trap sees it: a Spell activated, a monster's effect activated, or nothing it can negate. */
	private pendingWhat(): ChainLink["what"] | null {
		const pending = this.state.pending;
		if (pending?.kind === "spell") return "spell";
		if (pending?.kind === "effect") return "monster";
		return null;
	}
	/** Does this Counter Trap negate what it would answer: the link below it, or what is pending? */
	private counterFits(card: CardId, below: ChainLink | null): boolean {
		const info = cardOf(card);
		if (info.kind !== "trap" || info.effect.type !== "counter") return false;
		return info.effect.negates === (below ? below.what : this.pendingWhat());
	}
	/** Could `who` answer with a Counter Trap that would be Chain Link `link`, on top of `below` (null: on what is pending)? */
	private counterReady(who: Side, below: ChainLink | null, link: number): boolean {
		const s = this.state;
		if (trapsLocked(s) || (s.chainLimit !== null && link > s.chainLimit)) return false;
		const mine = s[who];
		return mine.backrow.some((slot) => {
			if (!slot || slot.setThisTurn || slot.up || slot.open || slot.chained || !this.counterFits(slot.card, below)) return false;
			const info = cardOf(slot.card);
			const cost = info.kind === "monster" ? undefined : info.cost;
			if (cost?.type === "pay-lp") return mine.lp > cost.amount;
			if (cost?.type === "discard") return mine.hand.length > 0;
			return true;
		});
	}
	/** An answer goes on the Chain. The other player may answer it in turn; if they cannot, the Chain resolves. */
	private addLink(link: ChainLink, move: Move): void {
		const s = this.state;
		const below = s.chain.at(-1) ?? null;
		if (link.speed === 3) this.activateCounter(link, move, below);
		else if (link.fromHand) s[link.side].hand.splice(s[link.side].hand.indexOf(link.card), 1);
		else if (link.zone !== undefined) s[link.side].backrow[link.zone]!.chained = true;
		s.chain.push(link);
		this.events.push({ type: "chain", link: s.chain.length + 1, side: link.side, card: link.card });
		if (this.counterReady(other(link.side), link, s.chain.length + 2)) {
			this.events.push({ type: "window", side: other(link.side), kind: "chain" });
			return;
		}
		this.resolveChain();
	}
	/** A Counter Trap is flipped and its cost paid, as it is activated. */
	private activateCounter(link: ChainLink, move: Move, below: ChainLink | null): void {
		const s = this.state;
		const mine = s[link.side];
		const slot = link.zone === undefined ? null : mine.backrow[link.zone];
		if (move.type !== "spring" || !slot) return reject("nothing-to-answer");
		if (slot.setThisTurn) reject("trap-just-set");
		if (trapsLocked(s)) reject("jinzo-lock");
		if (!this.counterFits(slot.card, below)) reject("cannot-answer-that");
		if (s.chainLimit !== null && s.chain.length + 2 > s.chainLimit) reject("cannot-answer-that");
		const info = cardOf(slot.card);
		const cost = info.kind === "monster" ? undefined : info.cost;
		if (cost?.type === "pay-lp") {
			if (mine.lp <= cost.amount) reject("cost-needed");
			this.damage(link.side, cost.amount);
		}
		if (cost?.type === "discard") {
			const at = move.discard === undefined ? -1 : mine.hand.indexOf(move.discard);
			if (at < 0) reject("cost-needed");
			mine.hand.splice(at, 1);
			this.toGraveyard(link.side, move.discard as CardId, "activation");
			this.events.push({ type: "discarded", side: link.side, card: move.discard as CardId });
		}
		slot.chained = true;
		this.events.push({ type: "sprung", side: link.side, card: slot.card });
	}
	/** Who must act on the Chain may add a Counter Trap, or pass: then the Chain resolves, the last link first. */
	private answerLink(move: Move): void {
		const s = this.state;
		if (move.type === "pass") return this.resolveChain();
		if (move.type !== "spring") return reject("answer-first");
		const who = actor(s);
		const slot = s[who].backrow[move.zone];
		if (!slot || slot.up || slot.open || slot.chained) return reject("nothing-to-answer");
		const info = cardOf(slot.card);
		if (info.kind !== "trap" || info.effect.type !== "counter") return reject("cannot-answer-that");
		this.addLink({ side: who, card: slot.card, what: "trap", speed: 3, zone: move.zone }, move);
	}
	/** The Chain resolves, the last link first; then what was pending, unless an answer already did it. */
	private resolveChain(): void {
		const s = this.state;
		while (s.chain.length > 0) {
			if (s.winner) {
				s.chain = [];
				return;
			}
			const link = s.chain.pop() as ChainLink;
			const number = s.chain.length + 2;
			if (link.negatedBy) {
				this.spendNegated(link);
				continue;
			}
			if (link.speed === 3) {
				/* A Counter Trap negates the activation just below it, and destroys that card. */
				this.events.push({ type: "resolve", link: number, card: link.card });
				const below = s.chain.at(-1);
				if (below) {
					below.negatedBy = link.card;
					this.events.push({ type: "negated", side: link.side, card: below.card, by: link.card });
				} else this.negatePending(link);
				if (link.zone !== undefined) s[link.side].backrow[link.zone] = null;
				this.toGraveyard(link.side, link.card, null);
				continue;
			}
			/* The answer at the bottom of the Chain is played now, as it would have been at once; it resolves what was pending too. */
			if (link.fromHand) s[link.side].hand.push(link.card);
			const slot = link.zone === undefined ? null : s[link.side].backrow[link.zone];
			if (slot) delete slot.chained;
			this.resolving = true;
			try {
				this.move(link.move as Move);
			} catch (error) {
				if (!(error instanceof Rejected)) throw error;
				/* What it needed is gone: it resolves without effect. */
				this.events.push({ type: "no-effect", card: link.card });
				this.spendNegated(link);
				this.resolvePending();
			} finally {
				this.resolving = false;
			}
			return;
		}
		this.resolvePending();
	}
	/** A negated answer: the card still goes to the Graveyard, and a once-per-turn effect counts as used. A monster on the field is destroyed. */
	private spendNegated(link: ChainLink): void {
		const s = this.state;
		const mine = s[link.side];
		if (link.fromHand) {
			const at = mine.hand.indexOf(link.card);
			if (at >= 0) mine.hand.splice(at, 1);
			this.toGraveyard(link.side, link.card, "activation");
			const info = cardOf(link.card);
			if (info.kind === "monster" && (info.hand === "ash" || info.hand === "ogre")) s.used.push(`${link.side}:${info.hand}`);
			return;
		}
		if (link.zone !== undefined && mine.backrow[link.zone]?.card === link.card) {
			mine.backrow[link.zone] = null;
			this.toGraveyard(link.side, link.card, null);
			this.events.push({ type: "destroyed", side: link.side, card: link.card });
			return;
		}
		if (link.move?.type === "ability" && mine.monsters[link.move.zone]?.card === link.card) {
			this.events.push({ type: "destroyed", side: link.side, card: link.card });
			this.leave(link.side, link.move.zone, "graveyard");
		}
	}
	/** A Counter Trap at Chain Link 2 negates what was pending, "and if you do, destroy" the monster whose effect it was. */
	private negatePending(link: ChainLink): void {
		const s = this.state;
		const pending = s.pending;
		if (pending?.kind !== "spell" && pending?.kind !== "effect") return;
		pending.negated = true;
		this.events.push({ type: "negated", side: link.side, card: pending.card, by: link.card });
		if (pending.kind === "effect" && s[pending.side].monsters[pending.zone]?.card === pending.card) {
			this.events.push({ type: "destroyed", side: pending.side, card: pending.card });
			this.leave(pending.side, pending.zone, "graveyard");
		}
	}
	/** Does this player control no cards at all: no monster, no Spell or Trap, no Field Spell? */
	private controlsNothing(who: Side): boolean {
		const mine = this.state[who];
		return !mine.monsters.some(Boolean) && !mine.backrow.some(Boolean) && !mine.field;
	}
	/** Does the turn player control a face-up monster, for a card that targets one? */
	private faceUpFoe(): boolean {
		const s = this.state;
		return s[s.turn].monsters.some((slot) => !!slot && !slot.faceDown);
	}
	/**
	 * Infinite Impermanence: "Target 1 face-up monster your opponent controls; negate its effects (until the end of this
	 * turn)". Its column lock, for a Set copy, is left out of Junior.
	 */
	private impermanence(who: Side, target: number | undefined, from: { zone: number } | { hand: number }): void {
		const s = this.state;
		const victim = target === undefined ? null : (s[s.turn].monsters[target] ?? null);
		if (!victim || victim.faceDown) return reject("no-target");
		const mine = s[who];
		const card = "zone" in from ? mine.backrow[from.zone]?.card : mine.hand[from.hand];
		if (!card) return reject("nothing-to-answer");
		if ("zone" in from) mine.backrow[from.zone] = null;
		else mine.hand.splice(from.hand, 1);
		this.toGraveyard(who, card, null);
		this.events.push({ type: "sprung", side: who, card });
		victim.negatedTurn = true;
		this.events.push({ type: "negated", side: who, card: victim.card, by: card });
		this.resolvePending();
	}

	private draw(): void {
		const s = this.state;
		if (s.phase !== "draw" || s.drawn) reject("already-drew");
		if (s.turnNumber === 1) reject("first-turn-no-draw");
		s.drawn = true;
		const card = this.me.deck.shift();
		if (!card) {
			this.events.push({ type: "deck-out", side: s.turn });
			return this.win(other(s.turn));
		}
		this.me.hand.push(card);
		this.events.push({ type: "drew", side: s.turn, card });
	}

	private toPhase(to: Phase): void {
		const s = this.state;
		if (!after(to, s.phase)) reject("cannot-go-back");
		if (!this.auto && s.phase === "draw" && !s.drawn && s.turnNumber > 1) reject("draw-first");
		if (to === "battle" && s.turnNumber === 1) reject("first-turn-no-battle");
		if (to === "main2" && s.phase !== "battle") reject("not-battle-phase");
		s.phase = to;
		this.events.push({ type: "phase", side: s.turn, phase: to });
		this.standby();
		if (to === "end") this.endTurn();
	}
	private endTurn(): void {
		const s = this.state;
		for (const who of [s.turn, other(s.turn)] as const) {
			s[who].monsters.forEach((slot, zone) => {
				if (!slot?.doomed) return;
				this.events.push({ type: "destroyed", side: who, card: slot.card });
				this.leave(who, zone, "graveyard");
			});
		}
		/* Swords of Revealing Light: "destroy it during the End Phase of your opponent's 3rd turn". */
		const foe = other(s.turn);
		s[foe].backrow.forEach((slot, zone) => {
			if (!slot?.open || cardOf(slot.card).kind !== "spell") return;
			const info = cardOf(slot.card);
			if (info.kind !== "spell" || info.effect.type !== "swords") return;
			slot.turns = (slot.turns ?? 0) + 1;
			if (slot.turns >= 3) this.destroyBack(foe, zone);
		});
		for (const who of [s.you, s.rival]) {
			for (const slot of who.monsters) {
				if (!slot) continue;
				Object.assign(slot, { attacked: false, summoned: false, moved: false, boost: 0, attackCount: 0 });
				delete slot.negatedTurn;
			}
			for (const slot of who.backrow) if (slot) slot.setThisTurn = false;
		}
		s.turn = other(s.turn);
		s.turnNumber += 1;
		s.phase = "draw";
		s.drawn = false;
		s.summonUsed = false;
		s.pendulumUsed = false;
		s.summons = 0;
		s.summonLock = false;
		s.standbyDone = false;
		s.used = [];
		s.locks = [];
		this.events.push({ type: "turn", side: s.turn });
		if (this.me.skipDraw) {
			delete this.me.skipDraw;
			s.drawn = true;
			this.events.push({ type: "skip-draw", side: s.turn });
		}
	}
	/** Main Phase is needed. Outside strict play the phase follows the move. */
	private needMain(): void {
		const s = this.state;
		if (isMain(s.phase)) return;
		if (!this.auto || s.phase === "end") reject("not-main-phase");
		s.phase = s.phase === "battle" ? "main2" : "main1";
		this.standby();
	}
	/**
	 * The Standby Phase, once a turn, as soon as the turn has gone past the Draw Phase: "Once per turn, during your
	 * Standby Phase:" effects of the turn player's monsters happen (Bowganian, Legendary Fiend).
	 */
	private standby(): void {
		const s = this.state;
		if (s.standbyDone || s.phase === "draw") return;
		s.standbyDone = true;
		this.me.monsters.forEach((slot) => {
			const standby = slot ? live(slot)?.standby : undefined;
			if (!slot || !standby || s.winner) return;
			if (standby.gain) {
				slot.bonus = (slot.bonus ?? 0) + standby.gain;
				this.events.push({ type: "boosted", side: s.turn, card: slot.card, amount: standby.gain, atk: atkOf(slot, s), lasting: "for-good" });
			}
			if (standby.burn) {
				this.events.push({ type: "burned", side: s.turn, card: slot.card, amount: standby.burn });
				this.damage(other(s.turn), standby.burn);
			}
		});
	}
	/** The Main Monster Zone a Special Summoned monster lands in: a zone its materials just left, or the first empty one. -1 when there is none. */
	private landing(freed: readonly number[] = []): number {
		const main = mainZones(this.state);
		const left = freed.filter((zone) => zone < main).sort((a, b) => a - b)[0];
		if (left !== undefined) return left;
		return this.me.monsters.findIndex((slot, zone) => zone < main && !slot);
	}

	private place(move: Extract<Move, { type: "place" }>): void {
		const s = this.state;
		const me = this.me;
		const at = me.hand.indexOf(move.card);
		if (at < 0) reject("not-in-hand");
		const card = cardOf(move.card);
		const whole = Number.isInteger(move.zone) && move.zone >= 0;
		if (card.kind === "monster") {
			if (move.row === "backrow" && card.scale !== undefined) return this.setScale(move, at, card.scale);
			if (move.row === "field") reject("field-zone");
			if (move.row !== "monsters") reject("wrong-zone");
			if (!whole || move.zone >= me.monsters.length) reject("wrong-zone");
			if (move.zone >= mainZones(s)) reject("extra-zone");
			this.needMain();
			if (move.special) return this.ownSummon(move, at);
			/* A Ritual Monster is only ever Special Summoned by its Ritual Spell; some monsters say "Cannot be Normal Summoned/Set". */
			if (card.frame || card.noNormal) reject("special-only");
			return this.summon(move, at, card.level);
		}
		const inField = card.kind === "spell" && card.icon === "field";
		if (move.row === "monsters") reject("wrong-zone");
		/* A Field Spell goes in the Field Zone, and nothing else does. */
		if ((move.row === "field") !== inField) reject("field-zone");
		if (!inField && (!whole || move.zone >= me.backrow.length)) reject("wrong-zone");
		/* A Quick-Play Spell can be activated in the Battle Phase too; everything else from the hand waits for a Main Phase. */
		if (!(isQuickPlay(move.card) && !move.set && s.phase === "battle")) this.needMain();
		if (!inField && me.backrow[move.zone]) reject("zone-taken");
		if (move.set) {
			/* Of the Spells, only a Quick-Play Spell is Set here: it can then be activated on the opponent's turn. */
			if (card.kind !== "spell" || !isQuickPlay(move.card) || card.effect.type === "revive") reject("cannot-set");
			me.hand.splice(at, 1);
			me.backrow[move.zone] = { card: move.card, setThisTurn: true };
			this.events.push({ type: "set", side: s.turn, card: move.card, zone: move.zone });
			return;
		}
		if (card.kind === "trap") {
			me.hand.splice(at, 1);
			me.backrow[move.zone] = { card: move.card, setThisTurn: true };
			this.events.push({ type: "set", side: s.turn, card: move.card, zone: move.zone });
			return;
		}
		const effect = card.effect;
		if (card.onePerTurn && s.used.includes(`${s.turn}:${move.card}`)) reject("one-per-turn");
		const aim = spellTarget(move.card);
		const targetSide = aim === "own" ? s.turn : other(s.turn);
		const needsTarget = aim !== null;
		const target = needsTarget ? (move.target ?? -1) : effect.type === "destroy-lowest" || effect.type === "smash" ? move.target : undefined;
		const targetSlot = !needsTarget || target === undefined ? null : (s[targetSide].monsters[target] ?? null);
		if (needsTarget && !targetSlot) reject("no-target");
		/* "Target 1 face-up monster": a face-down monster cannot be chosen, unless the card says "1 monster". */
		if (targetSlot?.faceDown && !(effect.type === "destroy" && effect.anyFace)) reject("no-target");
		const foeUp = s[other(s.turn)].monsters.some((held) => !!held && !held.faceDown);
		if (effect.type === "fire-blast" && targetSlot && (!named(targetSlot.card, effect.name) || (targetSlot.attackCount ?? 0) > 0)) reject("condition-not-met");
		if (effect.type === "destroy-all" && effect.needs) {
			if (!this.controls(s.turn, effect.needs, effect.needs === "dark-magician-girl")) reject("condition-not-met");
			/* "[Blue-Eyes White Dragon] you control cannot attack the turn you activate this card": not once one has attacked. */
			if (effect.lockAttack && me.monsters.some((held) => !!held && named(held.card, effect.needs ?? "") && (held.attackCount ?? 0) > 0)) reject("condition-not-met");
		}
		if (effect.type === "clear-backrow" && effect.needs && !this.controls(s.turn, effect.needs)) reject("condition-not-met");
		if ((effect.type === "smash" || effect.type === "destroy-lowest" || (effect.type === "destroy-all" && effect.faceUp)) && !foeUp) reject("nothing-to-hit");
		if (effect.type === "coin-wipe" && !s.you.monsters.some(Boolean) && !s.rival.monsters.some(Boolean)) reject("nothing-to-hit");
		const summons = effect.type === "revive" || effect.type === "ritual" || effect.type === "fusion" || effect.type === "curtain" || effect.type === "hand-summon" || effect.type === "deck-summon" || (effect.type === "call" && !effect.lock);
		if (effect.type === "curtain" && (!this.darkCaster(s.turn, true) || this.landing() < 0)) reject("condition-not-met");
		if (effect.type === "call") {
			if (effect.needs && !this.controls(s.turn, effect.needs)) reject("condition-not-met");
			const there = (effect.from.includes("hand") && me.hand.includes(effect.card as CardId)) || (effect.from.includes("deck") && me.deck.includes(effect.card as CardId));
			if (!there || this.landing() < 0) reject("condition-not-met");
			/* "You cannot Summon other monsters the turn you activate this card (but you can Set)." */
			if (effect.lock && (s.summons > 0 || s.summonLock)) reject("summon-locked");
		}
		if (effect.type === "data") {
			/* "If you control no monsters in your Main Monster Zone:" */
			if (effect.needs === "no-main-monsters" && me.monsters.some((held, zone) => zone < mainZones(s) && !!held)) reject("condition-not-met");
			if (!this.stepsReady(s.turn, effect.actions, move.pick, move.target, move.card)) reject("no-target");
			if (this.deckLocked() && choiceOf(effect.actions)?.from.length === 1 && cardCategories(move.card).has("search")) reject("deck-locked");
		}
		/* Under Droll & Lock Bird's lock, a card that could only add from the Deck to the hand cannot be activated. */
		if (this.deckLocked() && (effect.type === "search" || effect.type === "search-pick" || effect.type === "draw" || effect.type === "draw-then-gift")) reject("deck-locked");
		if (effect.type === "hand-summon") {
			const pick = move.pick;
			if (!pick || pick === move.card || !me.hand.includes(pick) || cardOf(pick).kind !== "monster" || monsterOf(pick).level < effect.minLevel || hasRulesText(pick)) return reject("no-target");
			if (this.landing() < 0) reject("no-free-zone");
		}
		if (effect.type === "search-pick" || effect.type === "deck-summon") {
			const pick = move.pick;
			if (!pick || !me.deck.includes(pick) || !inPool(pick, effect.pool)) return reject("no-target");
			if (effect.type === "deck-summon") {
				/* "If you control no face-up monsters:" */
				if (me.monsters.some((held) => !!held && !held.faceDown)) reject("condition-not-met");
				if (this.landing() < 0) reject("no-free-zone");
			}
		}
		if (effect.type === "revive" && effect.dragonNormal) {
			const found = move.grave?.side === s.turn ? me.graveyard[move.grave.index] : undefined;
			if (!found || cardOf(found).kind !== "monster" || monsterOf(found).type !== "dragon" || hasRulesText(found)) return reject("no-target");
		}
		/* "Equip only to a Warrior monster." "Equip only to a FIRE monster." */
		if (effect.type === "equip" && effect.only && targetSlot && monsterOf(targetSlot.card).type !== effect.only) reject("equip-only");
		if (effect.type === "equip" && effect.attribute && targetSlot && attributeOf(targetSlot.card) !== effect.attribute) reject("equip-only");
		/* "If you control [Dark Magician]:" */
		if (effect.type === "destroy" && effect.needs && !me.monsters.some((held) => !!held && named(held.card, effect.needs ?? ""))) reject("condition-not-met");
		if (effect.type === "wipe" && !s.you.monsters.some(Boolean) && !s.rival.monsters.some(Boolean)) reject("nothing-to-hit");
		if (effect.type === "clear-backrow") {
			const sides = (effect.scope === "all" ? [s.turn, other(s.turn)] : [other(s.turn)]).filter((who) => who === s.turn || !this.guarded(who));
			if (!sides.some((who) => s[who].backrow.some(Boolean) || s[who].field)) reject("nothing-to-hit");
		}
		if (effect.type === "search" && !me.deck.includes(effect.card as CardId)) reject("condition-not-met");
		if (effect.type === "draw" && !card.cost && me.deck.length < effect.count) reject("deck-too-small");
		if (effect.type === "recover") {
			const found = move.grave?.side === s.turn ? me.graveyard[move.grave.index] : undefined;
			if (!found || cardOf(found).kind !== "monster" || monsterOf(found).type !== effect.monsterType) reject("no-target");
		}
		if ((effect.type === "destroy-all" || effect.type === "destroy-lowest") && !s[other(s.turn)].monsters.some(Boolean)) reject("nothing-to-hit");
		const rest = me.hand.filter((_, index) => index !== at);
		const buried = (effect.type === "revive" || effect.type === "recover") && move.grave ? s[move.grave.side].graveyard[move.grave.index] : undefined;
		if (effect.type === "revive") {
			if (!buried || cardOf(buried).kind !== "monster") return reject("no-target");
			/* A Ritual or Extra Deck monster must first have been Summoned in its own way. */
			if (monsterOf(buried).frame && (fusionOnly(buried) || !s.proper.includes(`${move.grave?.side}:${buried}`))) reject("not-properly-summoned");
			if (this.landing() < 0) reject("no-free-zone");
		}
		if (effect.type === "draw-then-gift" && me.deck.length < 1) reject("deck-too-small");
		if (effect.type === "ritual") this.checkRitual(move, effect, rest);
		if (effect.type === "fusion") this.checkFusion(move, rest);
		/* A cost is paid while the card is activated: the card to discard must be another card in the hand. */
		if (card.cost?.type === "discard" && (!move.discard || !rest.includes(move.discard))) reject("cost-needed");
		/* "Discard 1 Level 8 monster;" */
		if (card.cost?.type === "discard" && card.cost.level !== undefined && move.discard && (cardOf(move.discard).kind !== "monster" || monsterOf(move.discard).level !== card.cost.level)) reject("cost-needed");
		if (card.cost?.type === "discard" && card.cost.monster && move.discard && cardOf(move.discard).kind !== "monster") reject("cost-needed");
		if (summons) this.summoning();
		/* The whole cost, and room for what the effect does after it. */
		if (card.cost?.type === "banish-deck" && me.deck.length < card.cost.count + (effect.type === "draw" ? effect.count : 0)) reject("deck-too-small");
		me.hand.splice(at, 1);
		const aimed = targetSlot?.card ?? buried;
		this.events.push({ type: "activated", side: s.turn, card: move.card, ...(aimed ? { target: aimed } : {}) });
		if (card.onePerTurn) s.used.push(`${s.turn}:${move.card}`);
		if (card.cost?.type === "discard" && move.discard) {
			me.hand.splice(me.hand.indexOf(move.discard), 1);
			/* A cost: the card being activated happens right after it, so a "When…" effect misses its chance. */
			this.toGraveyard(s.turn, move.discard, "activation");
			this.events.push({ type: "discarded", side: s.turn, card: move.discard });
		}
		if (card.cost?.type === "half-lp") {
			const from = me.lp;
			me.lp = from - Math.floor(from / 2);
			this.events.push({ type: "lp", side: s.turn, from, to: me.lp });
		}
		if (effect.type === "call" && effect.lock) s.summonLock = true;
		if (card.cost?.type === "banish-deck") {
			const gone = me.deck.splice(0, card.cost.count);
			me.banished.push(...gone.map((item) => ({ card: item, faceDown: true })));
			this.events.push({ type: "banished", side: s.turn, cards: gone, faceDown: true });
		}
		s.pending = { kind: "spell", card: move.card, ...(target === undefined ? {} : { target }), ...(move.grave ? { grave: move.grave } : {}), ...(move.summon ? { summon: move.summon } : {}), ...(move.materials ? { materials: move.materials } : {}), ...(move.pick ? { pick: move.pick } : {}), ...((staysOnField(move.card) && !inField) || effect.type === "swords" ? { zone: move.zone } : {}) };
		if (this.canAnswer()) {
			this.events.push({ type: "chain", link: 1, side: s.turn, card: move.card }, { type: "window", side: other(s.turn), kind: "spell" });
			return;
		}
		this.resolvePending();
	}
	/** The cards a Ritual or Fusion Summon uses, checked against the hand (without the Spell itself) and the field. */
	private gather(materials: readonly Material[] | undefined, pool: CardId[]): { cards: CardId[]; zones: number[] } {
		const cards: CardId[] = [];
		const zones: number[] = [];
		for (const item of materials ?? []) {
			if (item.from === "hand") {
				const at = pool.indexOf(item.card);
				if (at < 0 || cardOf(item.card).kind !== "monster") reject("wrong-materials");
				pool.splice(at, 1);
				cards.push(item.card);
			} else {
				const slot = this.me.monsters[item.zone];
				if (!slot || zones.includes(item.zone)) return reject("wrong-materials");
				zones.push(item.zone);
				cards.push(slot.card);
			}
		}
		return { cards, zones };
	}
	/** "You must also Tribute monsters from your hand or field whose total Levels equal 8 or more." */
	private checkRitual(move: Extract<Move, { type: "place" }>, effect: Extract<Effect, { type: "ritual" }>, rest: readonly CardId[]): void {
		const pool = [...rest];
		const monster = pool.indexOf(effect.monster as CardId);
		if (monster < 0) reject("no-ritual-monster");
		pool.splice(monster, 1);
		const { cards, zones } = this.gather(move.materials, pool);
		const levels = cards.map((card) => monsterOf(card).level);
		/* An Xyz or Link Monster has no Level to count. */
		if (levels.some((level) => level <= 0)) reject("wrong-materials");
		const total = levels.reduce((sum, level) => sum + level, 0);
		if (total < effect.total) reject("levels-too-low");
		/* No Tribute beyond what is needed: if one could be left out, it must be. */
		if (levels.some((level) => total - level >= effect.total)) reject("too-many-tributes");
		if (this.landing(zones) < 0) reject("no-free-zone");
	}
	/** A Fusion Monster names its materials: exactly those cards, from the hand or the field. */
	private checkFusion(move: Extract<Move, { type: "place" }>, rest: readonly CardId[]): void {
		if (!move.summon || !this.me.extra.includes(move.summon)) return reject("not-in-extra");
		const recipe = monsterOf(move.summon).fusion;
		if (!recipe) return reject("wrong-materials");
		const { cards, zones } = this.gather(move.materials, [...rest]);
		if (!fusionFits(cards, recipe)) reject("wrong-materials");
		if (this.landing(zones) < 0) reject("no-free-zone");
	}
	private summon(move: Extract<Move, { type: "place" }>, at: number, level: number): void {
		const s = this.state;
		const me = this.me;
		if (s.summonUsed) reject("summon-used");
		const asked = move.tributes ?? [];
		const tributes = [...new Set(asked)];
		if (tributes.length !== tributesFor(level) || tributes.length !== asked.length || tributes.some((zone) => !me.monsters[zone])) reject("wrong-tributes");
		if (me.monsters[move.zone] && !tributes.includes(move.zone)) reject("zone-taken");
		const gone: CardId[] = [];
		/* Tributes: the Summon happens right after, so a "When…" effect misses its chance. */
		for (const zone of tributes) {
			const card = this.leave(s.turn, zone, "graveyard", "summon");
			if (card) gone.push(card);
		}
		me.hand.splice(at, 1);
		s.summonUsed = true;
		if (move.set) {
			/* A Normal Set: face-down in Defense Position. It uses the turn's Normal Summon, but it is not a Summon. */
			me.monsters[move.zone] = standing(move.card, { summoned: true, position: "defense", faceDown: true });
			this.events.push({ type: "set-monster", side: s.turn, card: move.card, zone: move.zone });
			return;
		}
		this.summoning();
		me.monsters[move.zone] = standing(move.card, { summoned: true });
		this.events.push({ type: "summoned", side: s.turn, card: move.card, zone: move.zone, tributes: gone });
		if (monsterOf(move.card).summonRevive || monsterOf(move.card).summonSearch) s.summonTrigger = { side: s.turn, zone: move.zone, card: move.card };
	}
	/** Magician's Rod, right after its Normal Summon: "You can add 1 Spell/Trap from your Deck to your hand, that specifically lists the card 'Dark Magician' in its text." Once per turn. */
	private summonSearch(trigger: Board["summonTrigger"], zone: number, pick: CardId): void {
		const s = this.state;
		if (s.pending) return reject("answer-first");
		const source = this.triggered(trigger, zone);
		const name = source?.info.summonSearch;
		if (!source || !name) return reject("nothing-to-answer");
		const key = `${s.turn}:${source.card}:search`;
		if (s.used.includes(key)) return reject("once-per-turn");
		if (this.deckLocked()) return reject("deck-locked");
		const at = this.me.deck.indexOf(pick);
		if (at < 0 || cardOf(pick).kind === "monster" || !mentions(pick, name)) return reject("no-target");
		s.used.push(key);
		this.me.deck.splice(at, 1);
		this.shuffle(this.me.deck);
		this.me.hand.push(pick);
		this.events.push({ type: "added", side: s.turn, card: pick, from: "deck" });
	}
	/** Junk Synchron, right after its Normal Summon: Special Summon a low-Level monster from its owner's Graveyard in Defense Position, its effects negated. */
	private summonRevive(trigger: Board["summonTrigger"], zone: number, grave: { side: Side; index: number }): void {
		const s = this.state;
		if (s.pending) return reject("answer-first");
		const source = this.triggered(trigger, zone);
		const revive = source?.info.summonRevive;
		if (!source || !revive) return reject("nothing-to-answer");
		const found = grave.side === s.turn ? this.me.graveyard[grave.index] : undefined;
		if (!found || cardOf(found).kind !== "monster" || monsterOf(found).level > revive.maxLevel || monsterOf(found).level < 1) return reject("no-target");
		if (monsterOf(found).frame && (fusionOnly(found) || !s.proper.includes(`${s.turn}:${found}`))) reject("not-properly-summoned");
		const landed = this.landing();
		if (landed < 0) return reject("no-free-zone");
		this.summoning();
		this.me.graveyard.splice(grave.index, 1);
		this.me.monsters[landed] = standing(found, { summoned: true, position: "defense", negated: true });
		this.events.push({ type: "ability", side: s.turn, card: source.card, target: found }, { type: "special", side: s.turn, card: found, zone: landed, how: "revive", materials: [], from: s.turn });
	}
	/**
	 * The monster whose "When this card is Normal Summoned" effect is waiting: still on the field with its effects, or
	 * already gone (destroyed in answer to its Summon: the effect still happens).
	 */
	private triggered(trigger: Board["summonTrigger"], zone: number): { card: CardId; info: MonsterCard } | null {
		if (!trigger || trigger.side !== this.state.turn || trigger.zone !== zone) return null;
		const slot = this.me.monsters[zone];
		if (slot && (!trigger.card || slot.card === trigger.card)) {
			const info = live(slot);
			return info ? { card: slot.card, info } : null;
		}
		return trigger.card ? { card: trigger.card, info: monsterOf(trigger.card) } : null;
	}
	/** "If only your opponent controls a monster, you can Special Summon this card (from your hand)." No colon, no semicolon: no Chain. */
	private ownSummon(move: Extract<Move, { type: "place" }>, at: number): void {
		const s = this.state;
		const me = this.me;
		const special = monsterOf(move.card).special;
		if (!special) return reject("no-ability");
		if (me.monsters[move.zone]) reject("zone-taken");
		if (special === "alone") {
			if (me.monsters.some(Boolean) || !s[other(s.turn)].monsters.some(Boolean)) reject("condition-not-met");
		} else {
			/* "…by revealing [Blue-Eyes White Dragon] in your hand. You can only Special Summon [this card] once per turn this way." */
			const key = `${s.turn}:${move.card}:reveal`;
			if (s.used.includes(key)) reject("once-per-turn");
			if (!me.hand.some((card) => card === special.reveal)) reject("condition-not-met");
			s.used.push(key);
		}
		this.summoning();
		me.hand.splice(at, 1);
		me.monsters[move.zone] = standing(move.card, { summoned: true });
		this.events.push({ type: "special", side: s.turn, card: move.card, zone: move.zone, how: "own", materials: [] });
	}
	/** A Pendulum Monster played as a Spell into the leftmost or rightmost Spell & Trap Zone: that zone becomes a Pendulum Zone. */
	private setScale(move: Extract<Move, { type: "place" }>, at: number, scale: number): void {
		const s = this.state;
		const me = this.me;
		if (!s.full || (move.zone !== 0 && move.zone !== me.backrow.length - 1)) reject("pendulum-zone");
		this.needMain();
		if (me.backrow[move.zone]) reject("zone-taken");
		me.hand.splice(at, 1);
		me.backrow[move.zone] = { card: move.card, setThisTurn: false, up: true };
		this.events.push({ type: "scale", side: s.turn, card: move.card, zone: move.zone, scale });
	}
	/** Once per turn, with a Scale in each Pendulum Zone: Special Summon any number of monsters from the hand whose Levels are between the two Scales. */
	private pendulumSummon(cards: readonly CardId[]): void {
		const s = this.state;
		const me = this.me;
		this.needMain();
		const scales = scalesOf(s, s.turn);
		if (!scales) return reject("no-scales");
		if (s.pendulumUsed) reject("pendulum-used");
		/* Blue-Eyes Spirit Dragon: "Neither player can Special Summon 2 or more monsters at the same time." */
		if (cards.length > 1 && [s.you, s.rival].some((who) => who.monsters.some((slot) => !!slot && !!live(slot)?.oneAtATime))) reject("one-at-a-time");
		const pool = [...me.hand];
		const up = [...me.extraUp];
		/* From the hand first; a card not there comes face-up from the Extra Deck. */
		const fromExtra: boolean[] = [];
		if (cards.length === 0) reject("wrong-materials");
		for (const card of cards) {
			const at = pool.indexOf(card);
			if (at >= 0) pool.splice(at, 1);
			else {
				const there = up.indexOf(card);
				if (there < 0) reject("not-in-hand");
				up.splice(there, 1);
			}
			fromExtra.push(at < 0);
			const info = cardOf(card);
			if (info.kind !== "monster") return reject("wrong-materials");
			if (info.level <= scales.low || info.level >= scales.high) reject("level-not-between");
		}
		const main = mainZones(s);
		const free = me.monsters.flatMap((slot, zone) => (zone < main && !slot ? [zone] : []));
		/* Face-up from the Extra Deck: only to the Extra Monster Zone or to a zone a Link Monster points to (Master Rule, April 2020). */
		const linked = s.full ? [EXTRA_ZONE, ...[...this.pointed(s.turn)].filter((zone) => zone !== EXTRA_ZONE).sort((a, b) => a - b)].filter((zone) => !me.monsters[zone]) : [];
		const taken = new Set<number>();
		const places = cards.map((_, index) => {
			if (!fromExtra[index]) return -1;
			const zone = linked.find((at) => !taken.has(at));
			if (zone === undefined) return reject("no-free-zone");
			taken.add(zone);
			return zone;
		});
		cards.forEach((_, index) => {
			if (fromExtra[index]) return;
			const zone = free.find((at) => !taken.has(at));
			if (zone === undefined) return reject("no-free-zone");
			taken.add(zone);
			places[index] = zone;
		});
		this.summoning();
		cards.forEach((card, index) => {
			const list = fromExtra[index] ? me.extraUp : me.hand;
			list.splice(list.indexOf(card), 1);
			me.monsters[places[index] ?? 0] = standing(card, { summoned: true });
		});
		s.pendulumUsed = true;
		this.events.push({ type: "pendulum", side: s.turn, cards: [...cards], low: scales.low, high: scales.high });
	}
	/** A Synchro, Xyz or Link Summon: declared in the Main Phase with monsters on the field. No Spell, no Chain. */
	private extraSummon(move: Extract<Move, { type: "extra" }>): void {
		const s = this.state;
		const me = this.me;
		this.needMain();
		const at = me.extra.indexOf(move.card);
		if (at < 0) reject("not-in-extra");
		const info = monsterOf(move.card);
		const zones = [...new Set(move.materials)];
		const slots = zones.map((zone) => me.monsters[zone] ?? null);
		if (zones.length !== move.materials.length || slots.some((slot) => !slot)) reject("wrong-materials");
		/* Materials on the field are face-up monsters. */
		if (slots.some((slot) => slot?.faceDown)) reject("wrong-materials");
		this.summoning();
		const used = slots.flatMap((slot) => (slot ? [monsterOf(slot.card)] : []));
		if (info.frame === "fusion") reject("needs-spell");
		if (info.frame === "synchro") {
			/* 1 Tuner + 1 or more non-Tuner monsters, Levels exactly equal. A Rank or a Link Rating is not a Level. */
			if (used.filter((item) => item.tuner).length !== 1 || used.length < 2) reject("needs-one-tuner");
			/* "[Junk Synchron] + 1 or more non-Tuner monsters": that Tuner and no other. */
			if (info.synchroTuner && !slots.some((slot) => slot?.card === info.synchroTuner)) reject("wrong-materials");
			/* "1 Tuner + 1 or more non-Tuner [Blue-Eyes] monsters". */
			const nonTuner = info.synchroNonTuner;
			if (nonTuner && slots.some((slot) => !!slot && !monsterOf(slot.card).tuner && !slot.card.startsWith(nonTuner))) reject("wrong-materials");
			if (used.some((item) => item.level <= 0)) reject("wrong-materials");
			if (used.reduce((sum, item) => sum + item.level, 0) !== info.level) reject("levels-not-equal");
		} else if (info.frame === "xyz" && info.xyz) {
			const recipe = info.xyz;
			if (used.length !== recipe.count || used.some((item) => item.level !== recipe.level)) reject("wrong-levels");
		} else if (info.frame === "link") {
			if (!s.full) reject("wrong-zone");
			const rating = info.link ?? 0;
			const rule = info.linkMaterials ?? { min: rating, max: rating };
			if (used.length < rule.min || used.length > (rule.max ?? rating)) reject("link-count");
			/* "1 Normal Monster", "2+ Effect Monsters". */
			const filter = rule.filter;
			if (filter && slots.some((slot) => !!slot && !fitsFilter(slot.card, filter))) reject("wrong-materials");
			if (!linkRatingFits(used, rating)) reject("link-count");
		} else reject("not-in-extra");
		/* A Link Monster goes to the Extra Monster Zone. The others may go to any Main Monster Zone, or to the Extra Monster Zone. */
		const freeAfter = (zone: number) => zone >= 0 && zone < me.monsters.length && (!me.monsters[zone] || zones.includes(zone));
		/* A Link Monster goes to the Extra Monster Zone, or to a Main Monster Zone a Link Monster points to (not one of its materials). */
		const linked = info.frame === "link" ? [EXTRA_ZONE, ...[...this.pointed(s.turn, zones)].filter((zone) => zone !== EXTRA_ZONE).sort((a, b) => a - b)] : [];
		if (info.frame === "link" && move.zone !== undefined && !linked.includes(move.zone)) reject("extra-zone");
		const wanted = info.frame === "link" ? (move.zone ?? linked.find((zone) => freeAfter(zone)) ?? EXTRA_ZONE) : (move.zone ?? this.landing(zones));
		if (wanted < 0) reject("no-free-zone");
		if (!freeAfter(wanted)) reject("zone-taken");
		const cards: CardId[] = [];
		const borrowed: CardId[] = [];
		for (const zone of zones) {
			const slot = me.monsters[zone];
			if (!slot) continue;
			cards.push(slot.card);
			if (slot.owner && slot.owner !== s.turn) borrowed.push(slot.card);
			if (info.frame === "xyz") {
				/* Xyz Materials go under the Xyz Monster, not to the Graveyard. */
				me.monsters[zone] = null;
				this.unlink(s.turn, zone);
				for (const under of slot.materials ?? []) this.toGraveyard(s.turn, under, null);
			} else this.leave(s.turn, zone, "graveyard", "summon");
		}
		me.extra.splice(at, 1);
		me.monsters[wanted] = standing(move.card, { summoned: true, ...(info.frame === "xyz" ? { materials: cards, ...(borrowed.length > 0 ? { borrowed } : {}) } : {}) });
		s.proper.push(`${s.turn}:${move.card}`);
		this.events.push({ type: "special", side: s.turn, card: move.card, zone: wanted, how: info.frame, materials: cards });
		const gain = info.synchroGain;
		const summoned = me.monsters[wanted];
		if (gain && summoned) {
			/* "If this card is Synchro Summoned: It gains ATK equal to the total ATK of all Level 2 or lower monsters you currently control." */
			const total = me.monsters.reduce((sum, slot) => (slot && slot !== summoned && monsterOf(slot.card).level > 0 && monsterOf(slot.card).level <= gain.maxLevel ? sum + atkOf(slot, s) : sum), 0);
			if (total > 0) {
				summoned.bonus = (summoned.bonus ?? 0) + total;
				this.events.push({ type: "boosted", side: s.turn, card: summoned.card, amount: total, atk: atkOf(summoned, s), lasting: "for-good" });
			}
		}
	}

	private position(zone: number): void {
		const slot = this.me.monsters[zone];
		if (!slot) return reject("no-monster");
		/* Link Monsters have no DEF and are never in Defense Position. */
		if (monsterOf(slot.card).link) reject("link-no-defense");
		this.needMain();
		if (slot.summoned) reject("just-summoned");
		if (slot.attacked || (slot.attackCount ?? 0) > 0) reject("already-attacked");
		if (slot.moved) reject("position-used");
		if (slot.faceDown) {
			/* A Flip Summon: face-up in Attack Position. Not on the turn the monster was Set. */
			this.summoning();
			slot.position = "attack";
			slot.moved = true;
			return this.flip(this.state.turn, slot, "summon");
		}
		slot.position = slot.position === "attack" ? "defense" : "attack";
		slot.moved = true;
		this.events.push({ type: "position", side: this.state.turn, card: slot.card, position: slot.position });
	}

	private attack(attacker: number, target: number | "direct"): void {
		const s = this.state;
		const them = s[other(s.turn)];
		if (s.turnNumber === 1) reject("first-turn-no-battle");
		if (s.phase !== "battle" && (!this.auto || after(s.phase, "battle"))) reject("not-battle-phase");
		const slot = this.me.monsters[attacker];
		if (!slot) return reject("no-monster");
		if (slot.position === "defense" && !(live(slot)?.defenseAttack && !them.monsters.some(Boolean))) reject("defense-cannot-attack");
		/* Twin Burst: "up to 2 attacks on monsters": a direct attack is its only one. */
		if (target === "direct" && live(slot)?.monstersOnly && (slot.attackCount ?? 0) > 0) reject("already-attacked");
		if (slot.attacked) reject("already-attacked");
		/* Swords of Revealing Light: "your opponent's monsters cannot declare an attack". */
		if (them.backrow.some((back) => !!back?.open && cardOf(back.card).kind === "spell" && (cardOf(back.card) as { effect: Effect }).effect.type === "swords")) reject("swords-lock");
		const defender = target === "direct" ? null : (them.monsters[target] ?? null);
		if (target === "direct" && them.monsters.some(Boolean) && !this.attacksDirectly(slot, them)) reject("monster-in-the-way");
		if (target !== "direct" && !defender) reject("no-target");
		/* Magician's Valkyria: "Monsters your opponent controls cannot target face-up Spellcaster monsters for attacks, except this one." */
		if (defender && !defender.faceDown) {
			const type = monsterOf(defender.card).type;
			if (type && them.monsters.some((guard) => !!guard && guard !== defender && live(guard)?.shields === type)) reject("cannot-attack-that");
		}
		s.phase = "battle";
		this.standby();
		/* "This card can make a second attack during each Battle Phase." */
		slot.attackCount = (slot.attackCount ?? 0) + 1;
		slot.attacked = slot.attackCount >= (live(slot)?.attacks ?? 1) || (target === "direct" && !!live(slot)?.monstersOnly);
		this.events.push({ type: "attack-declared", side: s.turn, attacker: slot.card, target: defender?.faceDown ? null : (defender?.card ?? null), ...(defender?.faceDown && target !== "direct" ? { hidden: true as const, zone: target } : {}) });
		let aimed = target;
		if (defender && aimed !== "direct" && live(defender)?.detach && (defender.materials?.length ?? 0) === 0) {
			/* "If this card is targeted for an attack, while it has no material: Destroy this card." The attack goes on only if nothing is left in the way. */
			this.events.push({ type: "destroyed", side: other(s.turn), card: defender.card });
			this.leave(other(s.turn), aimed, "graveyard");
			if (them.monsters.some(Boolean)) return;
			aimed = "direct";
		}
		s.pending = { kind: "attack", attacker, target: aimed };
		if (this.canAnswer()) {
			this.events.push({ type: "window", side: other(s.turn), kind: "attack" });
			return;
		}
		this.resolvePending();
	}

	/** "This monster may attack your opponent's Life Points directly": always, or while the opponent's face-up monsters all have one of these Attributes. */
	private attacksDirectly(slot: MonsterSlot, them: SideState): boolean {
		const direct = live(slot)?.direct;
		if (direct === true) return true;
		if (!direct) return false;
		return them.monsters.every((other) => !other || other.faceDown || direct.includes(attributeOf(other.card) ?? "DIVINE"));
	}
	/** A Spell or Trap is destroyed: to the Graveyard (a Pendulum Scale to the Extra Deck), and a Continuous Trap takes its monster with it. */
	private destroyBack(who: Side, zone: number): void {
		const row = this.state[who].backrow;
		const slot = row[zone];
		if (!slot) return;
		row[zone] = null;
		if (slot.up) {
			this.state[who].extraUp.push(slot.card);
			this.events.push({ type: "destroyed", side: who, card: slot.card }, { type: "to-extra", side: who, card: slot.card });
		} else {
			this.toGraveyard(who, slot.card, null);
			this.events.push({ type: "destroyed", side: who, card: slot.card });
		}
		/* Call of the Haunted: "When this card leaves the field, destroy that monster." */
		if (slot.haunt !== undefined && this.state[who].monsters[slot.haunt]) {
			const monster = this.state[who].monsters[slot.haunt];
			if (monster) this.events.push({ type: "destroyed", side: who, card: monster.card });
			this.leave(who, slot.haunt, "graveyard");
		}
	}
	/** Does this player control a face-up monster that keeps its Spells and Traps from the opponent's destruction? */
	private guarded(who: Side): boolean {
		return this.state[who].monsters.some((slot) => !!slot && !!live(slot)?.guardsBackrow);
	}
	/** Destroy every Spell and Trap of these players, Field Spells too. */
	private clearBackrow(sides: readonly Side[], by: Side = this.state.turn): void {
		for (const who of sides) {
			/* Dark Magician the Dragon Knight: its controller's Spells and Traps "cannot be destroyed by your opponent's card effects". */
			if (who !== by && this.guarded(who)) continue;
			this.state[who].backrow.forEach((_, zone) => this.destroyBack(who, zone));
			const field = this.state[who].field;
			if (field) {
				this.state[who].field = null;
				this.toGraveyard(who, field, null);
				this.events.push({ type: "destroyed", side: who, card: field });
			}
		}
	}
	/** Does the other player have a Set Trap, a ready Quick Effect or a material to detach that may answer what is pending? */
	private canAnswer(): boolean {
		const s = this.state;
		const pending = s.pending;
		if (!pending) return false;
		const who = other(s.turn);
		const mine = s[who];
		/* In the Damage Step only cards that change ATK, and cards that say so (Kuriboh), can be used. */
		const damageStep = pending.kind === "attack" && pending.step === "damage";
		const trap = mine.backrow.some((slot) => {
			if (!slot || slot.setThisTurn || slot.open || slot.up) return false;
			const card = cardOf(slot.card);
			if (card.kind === "spell") {
				const type = card.effect.type;
				/* A Set Quick-Play Spell is not offered in answer to a Summon (left out). */
				if (pending.kind === "summon") return false;
				if (!isQuickPlay(slot.card) || (damageStep && !DAMAGE_STEP_QUICK.includes(type))) return false;
				if (card.onePerTurn && s.used.includes(`${who}:${slot.card}`)) return false;
				if (type === "coin-wipe") return s.you.monsters.some(Boolean) || s.rival.monsters.some(Boolean);
				if (type === "curtain") return !!this.darkCaster(who, true) && mine.monsters.some((held, at) => at < mainZones(s) && !held);
				if (!QUICK_ANSWERS.includes(type)) return false;
				if (type === "boost") return mine.monsters.some((held) => !!held && !held.faceDown);
				return s[s.turn].monsters.some((held) => !!held && (!held.faceDown || (card.effect.type === "destroy" && !!card.effect.anyFace)));
			}
			if (damageStep || trapsLocked(s)) return false;
			if (card.kind === "trap" && card.effect.type === "impermanence") return this.faceUpFoe();
			if (pending.kind === "summon") return card.kind === "trap" && this.summonTrapFits(card.effect, pending);
			return card.kind === "trap" && TRAP_ANSWERS[pending.kind].includes(card.effect.type) && (!needsOwnMonster(card.effect.type) || mine.monsters.some((held) => !!held && (card.effect.type !== "reinforce" || !held.faceDown)));
		});
		const quick = !damageStep && s[s.turn].monsters.some(Boolean) && mine.monsters.some((slot) => !!slot && live(slot)?.ability?.quick === true && !this.spent(who, slot.card));
		const acts =
			!damageStep &&
			mine.monsters.some((slot, zone) => {
				const act = slot ? live(slot)?.act : undefined;
				if (!slot || !act) return false;
				if (act.kind === "negate-spell") return pending.kind === "spell" && mine.hand.length > 0;
				if (act.kind === "tribute-synchro") return s.proper.includes(`${who}:${slot.card}`) && mine.extra.some((card) => card !== slot.card && monsterOf(card).frame === "synchro" && monsterOf(card).type === "dragon" && attributeOf(card) === "LIGHT");
				if (act.kind !== "destroy") return false;
				return act.quick && mine.hand.length > 0 && s[s.turn].monsters.some((held) => !!held && !held.faceDown) && !s.used.includes(`${who}:${zone}:${slot.card}:act`);
			});
		const detach = !damageStep && pending.kind === "attack" && mine.monsters.some((slot) => !!slot && !!live(slot)?.detach && (slot.materials?.length ?? 0) > 0);
		const hand = mine.hand.some((card) => this.handReady(who, card));
		/* A Counter Trap that negates what is pending: a Spell, or a monster's effect. */
		const counter = !damageStep && this.counterReady(who, null, 2);
		return trap || quick || detach || hand || acts || counter;
	}
	private spent(who: Side, card: CardId): boolean {
		return monsterOf(card).ability?.oncePerTurn === true && this.state.used.includes(`${who}:${card}`);
	}

	/**
	 * A Monster's effect. A Quick Effect may be used in answer to the opponent or on your own turn;
	 * any other effect only in your own Main Phase with nothing pending.
	 */
	private ability(zone: number, target?: number, discard?: CardId): void {
		const s = this.state;
		const who = s.pending ? other(s.turn) : s.turn;
		const slot = s[who].monsters[zone];
		if (!slot) return reject("no-monster");
		if (s.pending?.kind === "attack" && s.pending.step === "damage") return reject("damage-step-closed");
		const act = live(slot)?.act;
		if (act) return this.act(who, zone, slot, act, target, discard);
		if (live(slot)?.detach) return this.detach(who, slot);
		const ability = live(slot)?.ability;
		if (!ability) return reject("no-ability");
		if (!ability.quick) {
			if (who !== s.turn) reject("not-quick");
			this.needMain();
		}
		if (this.spent(who, slot.card)) reject("once-per-turn");
		const victim = target === undefined ? null : (s[other(who)].monsters[target] ?? null);
		if (!victim || victim.faceDown) return reject("no-target");
		s.used.push(`${who}:${slot.card}`);
		this.events.push({ type: "ability", side: who, card: slot.card, target: victim.card });
		const pending = s.pending;
		const weaken = () => {
			victim.boost -= ability.weaken;
			this.events.push({ type: "boosted", side: other(who), card: victim.card, amount: -ability.weaken, atk: atkOf(victim, s) });
		};
		if (pending?.kind === "spell") {
			/* Chain Link 2 on top of the Spell: it resolves first. */
			this.events.push({ type: "chain", link: 2, side: who, card: slot.card }, { type: "resolve", link: 2, card: slot.card });
			weaken();
			this.events.push({ type: "resolve", link: 1, card: pending.card });
			return this.resolvePending();
		}
		weaken();
		if (pending) this.resolvePending();
	}
	/**
	 * A monster's own effect paid with a card from the hand (or, for Blue-Eyes Spirit Dragon, by Tributing it):
	 * destroy an opponent's face-up monster, negate a Spell, or Special Summon a LIGHT Dragon Synchro Monster.
	 */
	private act(who: Side, zone: number, slot: MonsterSlot, act: NonNullable<MonsterCard["act"]>, target?: number, discard?: CardId): void {
		const s = this.state;
		const pending = s.pending;
		const mine = s[who];
		const key = `${who}:${zone}:${slot.card}:act`;
		if (act.kind === "tribute-synchro") {
			/* "You can Tribute this Synchro Summoned card; Special Summon 1 LIGHT Dragon Synchro Monster from your Extra Deck in Defense Position, except [this card], but destroy it during the End Phase of this turn." */
			if (!s.proper.includes(`${who}:${slot.card}`)) return reject("not-properly-summoned");
			const called = mine.extra.find((card) => card !== slot.card && monsterOf(card).frame === "synchro" && monsterOf(card).type === "dragon" && attributeOf(card) === "LIGHT");
			if (!called) return reject("condition-not-met");
			this.leave(who, zone, "graveyard");
			mine.extra.splice(mine.extra.indexOf(called), 1);
			/* Another zone if there is one: an attack or a Spell aimed at Spirit Dragon must not hit the monster it calls. */
			const free = mine.monsters.findIndex((other, at) => at < mainZones(s) && at !== zone && !other);
			const landed = free >= 0 ? free : zone;
			mine.monsters[landed] = standing(called, { summoned: true, position: "defense", doomed: true });
			this.events.push({ type: "special", side: who, card: called, zone: landed, how: "own", materials: [slot.card] });
			if (pending?.kind === "attack" && pending.target === zone && who !== s.turn) {
				/* Its target has left the field: the attack does not go on (a replay is left out of Junior). */
				const attacker = s[s.turn].monsters[pending.attacker];
				s.pending = null;
				if (attacker) this.events.push({ type: "attack-stopped", attacker: attacker.card });
				return;
			}
			if (pending?.kind === "spell" && pending.target === zone && landed === zone) delete pending.target;
			if (pending) this.resolvePending();
			return;
		}
		if (act.kind === "coin" || act.kind === "destroy-free") {
			/* Not Quick Effects: in their controller's own Main Phase, once per turn, with no cost. */
			if (who !== s.turn || pending) return reject("not-quick");
			this.needMain();
			if (s.used.includes(key)) return reject("once-per-turn");
			if (act.kind === "destroy-free") {
				/* "Once per turn: You can target 1 monster your opponent controls; destroy it. This card cannot attack the turn this effect is activated." */
				const victim = target === undefined ? null : (s[other(who)].monsters[target] ?? null);
				if (!victim || target === undefined) return reject("no-target");
				if ((slot.attackCount ?? 0) > 0) return reject("already-attacked");
				s.used.push(key);
				slot.attacked = true;
				this.events.push({ type: "ability", side: who, card: slot.card, target: victim.card }, { type: "destroyed", side: other(who), card: victim.card });
				this.leave(other(who), target, "graveyard");
				return;
			}
			/* Time Wizard: "Once per turn: You can toss a coin and call it." */
			s.used.push(key);
			return this.timeWizard(who, this.coin(who, slot.card));
		}
		if (act.kind === "negate-spell") {
			/* "When a Spell Card is activated (Quick Effect): You can discard 1 card; negate the activation, and if you do, destroy it." */
			if (pending?.kind !== "spell" || who === s.turn) return reject("nothing-to-answer");
		} else {
			if (act.oncePerTurn && s.used.includes(key)) return reject("once-per-turn");
			if (!act.quick) {
				if (who !== s.turn || pending) reject("not-quick");
				this.needMain();
			}
		}
		const victim = act.kind === "destroy" && target !== undefined ? (s[other(who)].monsters[target] ?? null) : null;
		if (act.kind === "destroy" && (!victim || victim.faceDown)) return reject("no-target");
		/* Thunder Giant: "a face-up monster on the field with original ATK less than the ATK of this card". */
		if (act.kind === "destroy" && act.weaker && victim && monsterOf(victim.card).atk >= atkOf(slot, s)) return reject("condition-not-met");
		const at = discard === undefined ? -1 : mine.hand.indexOf(discard);
		if (at < 0) return reject("cost-needed");
		mine.hand.splice(at, 1);
		this.toGraveyard(who, discard as CardId, "activation");
		this.events.push({ type: "discarded", side: who, card: discard as CardId });
		if (act.kind === "negate-spell" && pending?.kind === "spell") {
			this.events.push({ type: "chain", link: 2, side: who, card: slot.card }, { type: "resolve", link: 2, card: slot.card }, { type: "negated", side: who, card: pending.card, by: slot.card });
			s.pending = null;
			/* The Spell is destroyed: a card that would have stayed goes to the Graveyard too. */
			this.toGraveyard(s.turn, pending.card, null);
			return;
		}
		if (act.kind === "destroy" && act.oncePerTurn) s.used.push(key);
		if (!victim || target === undefined) return;
		this.events.push({ type: "ability", side: who, card: slot.card, target: victim.card });
		if (pending?.kind === "spell") this.events.push({ type: "chain", link: 2, side: who, card: slot.card }, { type: "resolve", link: 2, card: slot.card });
		this.events.push({ type: "destroyed", side: other(who), card: victim.card });
		this.leave(other(who), target, "graveyard");
		if (!pending) return;
		if (pending.kind === "spell") this.events.push({ type: "resolve", link: 1, card: pending.card });
		/* The attacking monster is gone: its attack never happens. */
		if (pending.kind === "attack" && !s[s.turn].monsters[pending.attacker]) {
			s.pending = null;
			return;
		}
		this.resolvePending();
	}
	/** Time Wizard's coin. Right: "destroy all monsters your opponent controls". Wrong: "destroy as many monsters you control as possible, and if you do, take damage equal to half the total ATK those destroyed monsters had while face-up on the field". */
	private timeWizard(who: Side, right: boolean): void {
		const s = this.state;
		const hit = right ? other(who) : who;
		let total = 0;
		let destroyed = 0;
		s[hit].monsters.forEach((slot, zone) => {
			if (!slot) return;
			if (!slot.faceDown) total += atkOf(slot, s);
			destroyed++;
			this.events.push({ type: "destroyed", side: hit, card: slot.card });
			this.leave(hit, zone, "graveyard");
		});
		if (!right && destroyed > 0) this.damage(who, Math.floor(total / 2));
	}
	/** The DARK Spellcaster a player Special Summons with Dark Magical Curtain: from the hand or the Deck. Its activator takes Dark Magician or Dark Magician Girl when it can (for the card it brings); otherwise the one with the highest ATK. */
	private darkCaster(who: Side, activator: boolean): { card: CardId; from: "hand" | "deck" } | null {
		const side = this.state[who];
		const fits = (card: CardId) => {
			const info = cardOf(card);
			return info.kind === "monster" && !info.frame && !info.noNormal && info.type === "spellcaster" && attributeOf(card) === "DARK";
		};
		const pool = [...side.hand.filter(fits).map((card) => ({ card, from: "hand" as const })), ...side.deck.filter(fits).map((card) => ({ card, from: "deck" as const }))];
		if (activator) {
			for (const name of ["dark-magician", "dark-magician-girl"]) {
				const found = pool.find((item) => item.card === name);
				if (found) return found;
			}
		}
		return pool.sort((a, b) => monsterOf(b.card).atk - monsterOf(a.card).atk)[0] ?? null;
	}
	/** Dark Magical Curtain resolving for `by`. */
	private curtain(by: Side): void {
		const s = this.state;
		let called: CardId | null = null;
		for (const who of [by, other(by)] as const) {
			const pick = this.darkCaster(who, who === by);
			const zone = s[who].monsters.findIndex((slot, at) => at < mainZones(s) && !slot);
			if (!pick || zone < 0) continue;
			const side = s[who];
			if (pick.from === "hand") side.hand.splice(side.hand.indexOf(pick.card), 1);
			else {
				side.deck.splice(side.deck.indexOf(pick.card), 1);
				this.shuffle(side.deck);
			}
			side.monsters[zone] = standing(pick.card, { summoned: true });
			this.events.push({ type: "special", side: who, card: pick.card, zone, how: "own", materials: [] });
			if (who === by) called = pick.card;
		}
		if (called !== "dark-magician" && called !== "dark-magician-girl") return;
		/* "…you can add 1 Spell/Trap that mentions 'Dark Magician' from your Deck to your hand, except 'Dark Magical Curtain'." */
		const side = s[by];
		const found = side.deck.find((card) => card !== "dark-magical-curtain" && cardOf(card).kind !== "monster" && mentions(card, "Dark Magician"));
		if (!found || this.deckLocked()) return;
		side.deck.splice(side.deck.indexOf(found), 1);
		this.shuffle(side.deck);
		side.hand.push(found);
		this.events.push({ type: "added", side: by, card: found, from: "deck" });
	}
	/** What a Spell does to the monster it targets. `by` activated it; the monster is `aimed`'s, in this zone. */
	private hit(effect: Effect, by: Side, aimed: Side, zone: number, slot: MonsterSlot, card: CardId): void {
		const s = this.state;
		if (effect.type === "boost") {
			slot.boost += effect.amount;
			this.events.push({ type: "boosted", side: aimed, card: slot.card, amount: effect.amount, atk: atkOf(slot, s) });
		} else if (effect.type === "destroy") {
			this.leave(aimed, zone, "graveyard");
			this.events.push({ type: "destroyed", side: aimed, card: slot.card });
			if (effect.skipDraw) s[by].skipDraw = true;
			if (effect.foeGains) {
				/* "…then your opponent gains 1000 LP." */
				const foe = s[other(by)];
				foe.lp += effect.foeGains;
				this.events.push({ type: "gained", side: other(by), amount: effect.foeGains, lp: foe.lp });
			}
		} else if (effect.type === "shrink") {
			/* "Its original ATK becomes halved until the end of this turn." */
			const loss = Math.floor(monsterOf(slot.card).atk / 2);
			slot.boost -= loss;
			this.events.push({ type: "boosted", side: aimed, card: slot.card, amount: -loss, atk: atkOf(slot, s) });
		} else if (effect.type === "chalice") {
			slot.boost += effect.amount;
			slot.negatedTurn = true;
			this.events.push({ type: "boosted", side: aimed, card: slot.card, amount: effect.amount, atk: atkOf(slot, s) });
		} else if (effect.type === "book") {
			slot.position = "defense";
			slot.faceDown = true;
			this.events.push({ type: "turned-down", side: aimed, card: slot.card });
			/* An Equip Card is destroyed when its monster is flipped face-down. */
			s[aimed].backrow.forEach((back, at) => {
				if (back?.open && back.equip === zone) this.destroyBack(aimed, at);
			});
		} else if (effect.type === "switch") {
			slot.position = slot.position === "attack" ? "defense" : "attack";
			this.events.push({ type: "position", side: aimed, card: slot.card, position: slot.position });
		} else if (effect.type === "fire-blast") {
			/* "Inflict damage to your opponent equal to its original ATK. [It] cannot attack the turn you activate this card." */
			const amount = monsterOf(slot.card).atk;
			slot.attacked = true;
			this.events.push({ type: "burned", side: by, card, amount });
			this.damage(other(by), amount);
		}
	}
	/** "When a monster declares an attack: You can detach 1 material from this card; negate the attack." The detached card is the cost. */
	private detach(who: Side, slot: MonsterSlot): void {
		const s = this.state;
		const pending = s.pending;
		if (pending?.kind !== "attack") return reject("nothing-to-answer");
		const material = slot.materials?.pop();
		if (!material) return reject("no-material");
		this.toGraveyard(this.ownerOf(slot, material, slot.owner ?? who), material, "activation");
		this.events.push({ type: "detached", side: who, card: slot.card, material });
		const attacker = this.me.monsters[pending.attacker];
		s.pending = null;
		if (attacker) this.events.push({ type: "attack-stopped", attacker: attacker.card });
	}
	/** "(Quick Effect): You can discard this card; you take no battle damage from that battle." */
	private handEffect(card: CardId, target?: number): void {
		const s = this.state;
		const pending = s.pending;
		if (!pending) return reject("nothing-to-answer");
		const who = other(s.turn);
		const mine = s[who];
		const at = mine.hand.indexOf(card);
		if (at < 0) reject("not-in-hand");
		const info = cardOf(card);
		if (info.kind === "trap" && info.effect.type === "impermanence") {
			if (!this.handReady(who, card)) return reject("cannot-answer-that");
			return this.impermanence(who, target, { hand: at });
		}
		const effect = info.kind === "monster" ? info.hand : undefined;
		if (!effect) return reject("no-ability");
		if (effect === "no-battle-damage") {
			if (pending.kind !== "attack") return reject("nothing-to-answer");
			/* "During damage calculation": not yet in the Battle Step. */
			if (pending.step !== "damage") return reject("not-damage-step");
			mine.hand.splice(at, 1);
			this.toGraveyard(who, card, "activation");
			this.events.push({ type: "hand-effect", side: who, card });
			pending.noDamage = true;
			return this.resolvePending();
		}
		if (pending.kind === "attack" && pending.step === "damage") return reject("damage-step-closed");
		if (effect === "ash" && s.used.includes(`${who}:ash`)) return reject("once-per-turn");
		if (!this.handReady(who, card)) return reject("cannot-answer-that");
		/* Effect Veiler: "target 1 Effect Monster your opponent controls". */
		const victim = effect === "veiler" && target !== undefined ? (s[s.turn].monsters[target] ?? null) : null;
		if (effect === "veiler" && (!victim || victim.faceDown || !isEffectMonster(victim.card))) return reject("no-target");
		mine.hand.splice(at, 1);
		this.events.push({ type: "hand-effect", side: who, card });
		if (effect === "fader") {
			/* "You can Special Summon this card from your hand, then end the Battle Phase. If Summoned this way, banish it when it leaves the field." */
			const zone = mine.monsters.findIndex((slot, index) => index < mainZones(s) && !slot);
			mine.monsters[zone] = standing(card, { summoned: true, position: "defense", banishOnLeave: true });
			this.events.push({ type: "special", side: who, card, zone, how: "own", materials: [] });
			s.pending = null;
			return this.endBattle();
		}
		this.toGraveyard(who, card, "activation");
		if (effect === "scarecrow" && pending.kind === "attack") {
			/* "Negate the attack, then end the Battle Phase." */
			const attacker = s[s.turn].monsters[pending.attacker];
			s.pending = null;
			if (attacker) this.events.push({ type: "attack-stopped", attacker: attacker.card });
			return this.endBattle();
		}
		if (effect === "veiler" && victim) {
			victim.negatedTurn = true;
			this.events.push({ type: "negated", side: who, card: victim.card, by: card });
		}
		if (effect === "ash" && (pending.kind === "spell" || pending.kind === "effect")) {
			/* "Negate that effect": the card was activated and its cost stays paid, but it does nothing. */
			s.used.push(`${who}:ash`);
			pending.negated = true;
			this.events.push({ type: "negated", side: who, card: pending.card, by: card });
		}
		if (effect === "droll") {
			/* "For the rest of this turn, cards cannot be added from either player's Main Deck to the hand." */
			s.locks.push({ kind: "deck-to-hand", by: card });
			this.events.push({ type: "locked", side: who, card });
		}
		if (effect === "ogre" && pending.kind === "effect") {
			/* "Destroy that card on the field." Its effect was already activated: it still resolves. */
			s.used.push(`${who}:ogre`);
			if (s[pending.side].monsters[pending.zone]?.card === pending.card) {
				this.events.push({ type: "destroyed", side: pending.side, card: pending.card });
				this.leave(pending.side, pending.zone, "graveyard");
			}
		}
		if (effect === "crow" && pending.kind === "spell" && pending.grave) {
			/* "Target 1 card in your opponent's GY; banish that target": the card the Spell was aimed at. */
			const from = pending.grave;
			const [gone] = s[from.side].graveyard.splice(from.index, 1);
			delete pending.grave;
			if (gone) {
				s[from.side].banished.push({ card: gone, faceDown: false });
				this.events.push({ type: "banished", side: from.side, cards: [gone], faceDown: false });
			}
		}
		this.resolvePending();
	}
	/** Does this Trap answer this Summon? */
	private summonTrapFits(effect: Effect, pending: Extract<Pending, { kind: "summon" }>): boolean {
		const s = this.state;
		const summoned = pending.zones.flatMap((zone) => s[s.turn].monsters[zone] ?? []);
		if (effect.type === "torrential") return summoned.length > 0;
		/* "When your opponent Normal or Flip Summons 1 monster with 1000 or more ATK" */
		if (effect.type === "trap-hole") return pending.how !== "special" && summoned.length === 1 && atkOf(summoned[0]!, s) >= effect.minAtk;
		if (effect.type === "bottomless") return summoned.some((slot) => atkOf(slot, s) >= effect.minAtk);
		return false;
	}
	/** A Trap that answers a Summon resolves. */
	private summonTrap(effect: Effect, pending: Extract<Pending, { kind: "summon" }>): void {
		const s = this.state;
		s.pending = null;
		if (effect.type === "torrential") {
			for (const who of [s.turn, other(s.turn)] as const) {
				s[who].monsters.forEach((slot, zone) => {
					if (!slot) return;
					this.events.push({ type: "destroyed", side: who, card: slot.card });
					this.leave(who, zone, "graveyard");
				});
			}
			return;
		}
		for (const zone of pending.zones) {
			const slot = s[s.turn].monsters[zone];
			if (!slot) continue;
			if (effect.type === "trap-hole") {
				this.events.push({ type: "destroyed", side: s.turn, card: slot.card });
				this.leave(s.turn, zone, "graveyard");
			} else if (effect.type === "bottomless" && atkOf(slot, s) >= effect.minAtk) {
				/* "Destroy that monster(s), and if you do, banish it." */
				this.events.push({ type: "destroyed", side: s.turn, card: slot.card });
				this.leave(s.turn, zone, "banished");
				this.events.push({ type: "banished", side: slot.owner ?? s.turn, cards: [slot.card], faceDown: false });
			}
		}
	}

	private spring(zone: number, target?: number, grave?: { side: Side; index: number }): void {
		const s = this.state;
		const owner = s.pending ? other(s.turn) : s.turn;
		const mine = s[owner];
		const slot = mine.backrow[zone];
		/* A face-up card (a Pendulum Scale, a Continuous or Equip card) has nothing left to flip. */
		if (!slot || slot.up || slot.open) return reject("nothing-to-answer");
		if (slot.setThisTurn) reject("trap-just-set");
		const pending = s.pending;
		const card = cardOf(slot.card);
		if (card.kind === "spell") return this.springSpell(owner, zone, target);
		if (trapsLocked(s)) return reject("jinzo-lock");
		if (!pending) {
			/* Call of the Haunted, in your own Main Phase. Every other Trap here waits for the opponent to do something. */
			if (card.kind === "trap" && card.effect.type === "haunt") return this.haunt(zone, grave);
			return reject("nothing-to-answer");
		}
		if (pending.kind === "attack" && pending.step === "damage") return reject("damage-step-closed");
		if (card.kind === "trap" && card.effect.type === "impermanence") return this.impermanence(owner, target, { zone });
		if (card.kind !== "trap" || !TRAP_ANSWERS[pending.kind].includes(card.effect.type)) return reject("cannot-answer-that");
		if (pending.kind === "summon" && !this.summonTrapFits(card.effect, pending)) return reject("cannot-answer-that");
		const saved = needsOwnMonster(card.effect.type) && target !== undefined ? (mine.monsters[target] ?? null) : null;
		if (needsOwnMonster(card.effect.type) && !saved) reject("no-target");
		/* Reinforcements says "1 face-up monster"; Compulsory Evacuation Device "1 monster". */
		if (card.effect.type === "reinforce" && saved?.faceDown) reject("no-target");
		mine.backrow[zone] = null;
		this.toGraveyard(owner, slot.card, null);
		this.events.push({ type: "sprung", side: owner, card: slot.card });
		if (pending.kind === "attack") {
			const attacker = this.me.monsters[pending.attacker];
			if (!attacker) return;
			const needs = card.effect.type === "stop-attack" ? card.effect.needs : undefined;
			if (needs && !mine.monsters.some((held) => !!held && !held.faceDown && held.card.startsWith(needs))) {
				/* "You must control a face-up [Elemental HERO] monster to resolve this effect." */
				this.events.push({ type: "no-effect", card: slot.card });
				return this.resolvePending();
			}
			if (card.effect.type === "stop-attack") {
				s.pending = null;
				this.events.push({ type: "attack-stopped", attacker: attacker.card });
				/* "…negate that attack, and if you do, gain LP equal to that target's ATK." */
				if (card.effect.gain) {
					const amount = atkOf(attacker, s);
					mine.lp += amount;
					this.events.push({ type: "gained", side: owner, amount, lp: mine.lp });
				}
				return;
			}
			const effect = card.effect;
			if (effect.type === "mirror-force") {
				/* "Destroy all your opponent's Attack Position monsters": the attacker too, so its attack never happens. */
				s.pending = null;
				this.me.monsters.forEach((slot, zone) => {
					if (!slot || slot.position !== "attack") return;
					this.events.push({ type: "destroyed", side: s.turn, card: slot.card });
					this.leave(s.turn, zone, "graveyard");
				});
				return;
			}
			if (effect.type === "storm-force") {
				/* "Return all your opponent's Attack Position monsters to the hand": the attacker too. */
				this.me.monsters.forEach((held, at) => {
					if (!held || held.position !== "attack") return;
					this.leave(s.turn, at, "hand");
					this.events.push({ type: "returned", side: held.owner ?? s.turn, card: held.card });
				});
				/* An attacker in Defense Position (Rampart Blaster) stays, and its attack goes on. */
				if (!this.me.monsters[pending.attacker]) {
					s.pending = null;
					return;
				}
				return this.resolvePending();
			}
			if (effect.type === "ruin") {
				/* "Destroy the Attack Position monster your opponent controls with the highest ATK (your choice, if tied)": the attacker, when it is one of them. */
				const standingUp = this.me.monsters.flatMap((held, at) => (held && held.position === "attack" ? [{ at, atk: atkOf(held, s), card: held.card }] : []));
				const highest = Math.max(...standingUp.map((item) => item.atk));
				const chosen = standingUp.find((item) => item.atk === highest && item.at === pending.attacker) ?? standingUp.find((item) => item.atk === highest);
				if (chosen) {
					this.events.push({ type: "destroyed", side: s.turn, card: chosen.card });
					this.leave(s.turn, chosen.at, "graveyard");
				}
				if (!this.me.monsters[pending.attacker]) {
					s.pending = null;
					return;
				}
				return this.resolvePending();
			}
			if (effect.type === "magic-cylinder") {
				s.pending = null;
				this.events.push({ type: "attack-stopped", attacker: attacker.card });
				const amount = atkOf(attacker, s);
				this.events.push({ type: "burned", side: owner, card: slot.card, amount });
				return this.damage(s.turn, amount);
			}
			if (effect.type === "just-desserts") {
				const amount = effect.amount * this.me.monsters.filter(Boolean).length;
				this.events.push({ type: "burned", side: owner, card: slot.card, amount });
				this.damage(s.turn, amount);
				if (s.winner) return;
				return this.resolvePending();
			}
			if (effect.type === "clear-backrow") {
				this.clearBackrow([s.turn, owner], owner);
				return this.resolvePending();
			}
			if (effect.type === "recharge") {
				const amount = effect.amount * mine.monsters.filter((held) => !!held && held.card.startsWith(effect.prefix)).length;
				if (amount > 0) {
					mine.lp += amount;
					this.events.push({ type: "gained", side: owner, amount, lp: mine.lp });
				} else this.events.push({ type: "no-effect", card: slot.card });
				return this.resolvePending();
			}
			if (card.effect.type === "negate-attack") {
				/* A Counter Trap: "negate the attack, then end the Battle Phase." */
				s.pending = null;
				this.events.push({ type: "attack-stopped", attacker: attacker.card });
				if (s.phase === "battle") {
					s.phase = "main2";
					this.events.push({ type: "battle-ended", side: s.turn }, { type: "phase", side: s.turn, phase: "main2" });
				}
				return;
			}
			if (card.effect.type === "reinforce" && saved) {
				saved.boost += card.effect.amount;
				this.events.push({ type: "boosted", side: owner, card: saved.card, amount: card.effect.amount, atk: atkOf(saved, s) });
			}
			if (card.effect.type === "destroy-attacker" || card.effect.type === "banish-attacker") {
				/* The attacking monster leaves the field, so its attack never happens. Banished is not the Graveyard. */
				s.pending = null;
				if (card.effect.type === "destroy-attacker") {
					this.events.push({ type: "destroyed", side: s.turn, card: attacker.card });
					this.leave(s.turn, pending.attacker, "graveyard");
				} else {
					this.leave(s.turn, pending.attacker, "banished");
					this.events.push({ type: "banished", side: attacker.owner ?? s.turn, cards: [attacker.card], faceDown: false });
				}
				return;
			}
			if (card.effect.type === "weaken-attacker") {
				attacker.boost -= card.effect.amount;
				this.events.push({ type: "boosted", side: s.turn, card: attacker.card, amount: -card.effect.amount, atk: atkOf(attacker, s) });
			}
			return this.resolvePending();
		}
		if (pending.kind === "summon") return this.summonTrap(card.effect, pending);
		/* A two-link chain: the Trap was activated last, so it resolves first. */
		this.events.push({ type: "chain", link: 2, side: owner, card: slot.card }, { type: "resolve", link: 2, card: slot.card });
		if (saved && target !== undefined) {
			this.leave(owner, target, "hand");
			this.events.push({ type: "returned", side: owner, card: saved.card });
		}
		if (pending.kind !== "added") this.events.push({ type: "resolve", link: 1, card: pending.card });
		this.resolvePending();
	}

	/**
	 * A Set Quick-Play Spell. On your own turn, with nothing pending, it is activated as from the hand. In answer to the
	 * opponent it resolves at once, on top of what it answers: a boost lands before the battle, a destroyed attacker
	 * never attacks.
	 */
	private springSpell(owner: Side, zone: number, target?: number): void {
		const s = this.state;
		const mine = s[owner];
		const slot = mine.backrow[zone];
		const card = slot ? cardOf(slot.card) : null;
		if (!slot || card?.kind !== "spell") return reject("nothing-to-answer");
		if (!s.pending) {
			mine.backrow[zone] = null;
			mine.hand.push(slot.card);
			return this.place({ type: "place", card: slot.card, row: "backrow", zone, ...(target === undefined ? {} : { target }) });
		}
		const effect = card.effect;
		const pending = s.pending;
		if (pending.kind === "summon") return reject("cannot-answer-that");
		const free = QUICK_FREE.includes(effect.type);
		if (!free && !QUICK_ANSWERS.includes(effect.type)) return reject("cannot-answer-that");
		if (pending.kind === "attack" && pending.step === "damage" && !DAMAGE_STEP_QUICK.includes(effect.type)) return reject("damage-step-closed");
		if (card.onePerTurn && s.used.includes(`${owner}:${slot.card}`)) return reject("one-per-turn");
		const aimed = effect.type === "boost" ? owner : other(owner);
		const victim = free || target === undefined ? null : (s[aimed].monsters[target] ?? null);
		if (!free && (!victim || target === undefined || (victim.faceDown && !(effect.type === "destroy" && effect.anyFace)))) return reject("no-target");
		if (effect.type === "coin-wipe" && !s.you.monsters.some(Boolean) && !s.rival.monsters.some(Boolean)) return reject("nothing-to-hit");
		if (effect.type === "curtain" && (!this.darkCaster(owner, true) || !mine.monsters.some((held, at) => at < mainZones(s) && !held))) return reject("condition-not-met");
		mine.backrow[zone] = null;
		if (card.onePerTurn) s.used.push(`${owner}:${slot.card}`);
		this.events.push({ type: "activated", side: owner, card: slot.card, ...(victim ? { target: victim.card } : {}) });
		if (pending.kind === "spell") this.events.push({ type: "chain", link: 2, side: owner, card: slot.card }, { type: "resolve", link: 2, card: slot.card });
		this.toGraveyard(owner, slot.card, null);
		if (effect.type === "coin-wipe") this.coinWipe(owner, slot.card);
		else if (effect.type === "curtain") this.curtain(owner);
		else if (victim && target !== undefined) this.hit(effect, owner, aimed, target, victim, slot.card);
		if (s.winner) return;
		if (pending.kind === "spell") this.events.push({ type: "resolve", link: 1, card: pending.card });
		if (pending.kind === "attack") {
			/* The attacking monster is gone, or no longer in Attack Position: its attack never happens. */
			const attacker = s[s.turn].monsters[pending.attacker];
			if (!attacker || attacker.position === "defense") {
				s.pending = null;
				if (attacker) this.events.push({ type: "attack-stopped", attacker: attacker.card });
				return;
			}
		}
		this.resolvePending();
	}
	/** Dark Time Wizard's coin, tossed by `by`. */
	private coinWipe(by: Side, card: CardId): void {
		const s = this.state;
		const right = this.coin(by, card);
		const hit = right ? other(by) : by;
		let total = 0;
		let destroyed = 0;
		s[hit].monsters.forEach((slot, zone) => {
			if (!slot) return;
			total += monsterOf(slot.card).atk;
			destroyed++;
			this.events.push({ type: "destroyed", side: hit, card: slot.card });
			this.leave(hit, zone, "graveyard");
		});
		/* "…and if you do, inflict damage to your opponent equal to half the combined original ATK of those destroyed monsters." */
		if (right && destroyed > 0) {
			const amount = Math.floor(total / 2);
			this.events.push({ type: "burned", side: by, card, amount });
			this.damage(other(by), amount);
		}
	}
	/** Call of the Haunted: "Activate this card by targeting 1 monster in your GY; Special Summon that target in Attack Position." It stays, linked to the monster. */
	private haunt(zone: number, grave?: { side: Side; index: number }): void {
		const s = this.state;
		const me = this.me;
		this.needMain();
		const found = grave && grave.side === s.turn ? me.graveyard[grave.index] : undefined;
		if (!grave || !found || cardOf(found).kind !== "monster") return reject("no-target");
		if (monsterOf(found).frame && (fusionOnly(found) || !s.proper.includes(`${s.turn}:${found}`))) reject("not-properly-summoned");
		const landed = this.landing();
		if (landed < 0) return reject("no-free-zone");
		const slot = me.backrow[zone];
		if (!slot) return reject("nothing-to-answer");
		this.summoning();
		me.graveyard.splice(grave.index, 1);
		me.backrow[zone] = { card: slot.card, setThisTurn: false, open: true, haunt: landed };
		this.events.push({ type: "sprung", side: s.turn, card: slot.card });
		me.monsters[landed] = standing(found, { summoned: true });
		this.events.push({ type: "special", side: s.turn, card: found, zone: landed, how: "revive", materials: [], from: s.turn });
	}

	private resolvePending(): void {
		const s = this.state;
		const pending = s.pending;
		s.pending = null;
		if (!pending) return;
		if (pending.kind === "summon") return;
		if (pending.kind === "spell") return this.resolveSpell(pending);
		if (pending.kind === "effect") return this.resolveEffect(pending);
		if (pending.kind === "added") return;
		if (pending.step !== "damage" && this.me.monsters[pending.attacker]) {
			/* The Battle Step is over: on to the Damage Step, where the defender may still act before damage is calculated. */
			s.pending = { ...pending, step: "damage" };
			/* At its start, a face-down monster that is attacked is flipped face-up. */
			const hidden = pending.target === "direct" ? null : s[other(s.turn)].monsters[pending.target];
			if (hidden) this.flip(other(s.turn), hidden, "attack");
			if (this.canAnswer()) {
				this.events.push({ type: "damage-step", side: s.turn }, { type: "window", side: other(s.turn), kind: "attack", step: "damage" });
				return;
			}
			s.pending = null;
		}
		const me = this.me;
		const them = s[other(s.turn)];
		const attacker = me.monsters[pending.attacker];
		if (!attacker) return;
		const atk = atkOf(attacker, s);
		if (pending.target === "direct") {
			if (pending.noDamage) return;
			const bonus = live(attacker)?.attackBonus;
			/* Rampart Blaster attacking from Defense Position: "its ATK is halved during damage calculation only". */
			const halved = attacker.position === "defense" ? Math.floor(atk / 2) : atk;
			const amount = halved + (bonus && !bonus.vs ? bonus.amount : 0);
			if (amount !== atk) this.events.push({ type: "boosted", side: s.turn, card: attacker.card, amount: amount - atk, atk: amount, lasting: "damage-step" });
			this.events.push({ type: "direct", side: s.turn, attacker: attacker.card, amount });
			return this.damage(other(s.turn), amount);
		}
		const defender = them.monsters[pending.target];
		if (!defender) return;
		/* "If this card attacks [a WIND monster], it gains [n] ATK during the Damage Step only." */
		const bonus = live(attacker)?.attackBonus;
		const fought = atk + (bonus && (!bonus.vs || attributeOf(defender.card) === bonus.vs) ? bonus.amount : 0);
		/* Said before the monsters meet: the ATK on the card is not the one that fights. */
		if (fought !== atk) this.events.push({ type: "boosted", side: s.turn, card: attacker.card, amount: fought - atk, atk: fought, lasting: "damage-step" });
		return this.fight(pending, attacker, defender, fought);
	}
	/** Damage calculation between two monsters, then what the battle destroyed, last of all. */
	private fight(pending: Extract<Pending, { kind: "attack" }>, attacker: MonsterSlot, defender: MonsterSlot, atk: number): void {
		const s = this.state;
		if (pending.target === "direct") return;
		const value = defender.position === "attack" ? atkOf(defender, s) : defOf(defender, s);
		let destroyed: { side: Side; card: CardId }[] = [];
		let damage: { side: Side; amount: number } | null = null;
		if (atk > value) {
			destroyed.push({ side: other(s.turn), card: defender.card });
			if (defender.position === "attack") damage = { side: other(s.turn), amount: atk - value };
			/* "If this card attacks a Defense Position monster, inflict piercing battle damage." */
			else if (live(attacker)?.pierce) damage = { side: other(s.turn), amount: atk - value };
		} else if (atk < value) {
			damage = { side: s.turn, amount: value - atk };
			if (defender.position === "attack") destroyed.push({ side: s.turn, card: attacker.card });
		} else if (defender.position === "attack") {
			destroyed.push({ side: s.turn, card: attacker.card }, { side: other(s.turn), card: defender.card });
		}
		/* "You take no battle damage from that battle": the battle still happens, the monsters are still destroyed. */
		if (pending.noDamage && damage?.side === other(s.turn)) damage = null;
		/* "You take no battle damage from attacks involving this card." */
		/* Which of the two fighters a destroyed entry is: by side, since both may be the same card. */
		const isAttacker = (lost: { side: Side }) => lost.side === s.turn;
		/* Rocket Warrior: "During your Battle Phase, this card cannot be destroyed by battle and you take no battle damage from attacks involving this card." It only attacks in its controller's Battle Phase. */
		const rocket = live(attacker)?.rocket;
		const guarded = (who: Side) => (who === s.turn && !!rocket) || [attacker, defender].some((slot) => !!live(slot)?.noBattleDamage && (who === s.turn) === (slot === attacker));
		if (damage && guarded(damage.side)) damage = null;
		/* "Cannot be destroyed by battle with a monster that has 1900 or more ATK." "Once per turn, this card cannot be destroyed by battle." */
		destroyed = destroyed.filter((lost) => {
			const slot = lost.side === s.turn ? attacker : defender;
			if (slot === attacker && rocket) return false;
			const immune = live(slot)?.battleImmune;
			if (!immune) return true;
			const foeAtk = lost.side === s.turn ? value : atk;
			if (immune.always) return false;
			if (immune.fromAtk !== undefined && foeAtk >= immune.fromAtk) return false;
			if (immune.perTurn !== undefined) {
				const zone = lost.side === s.turn ? pending.attacker : pending.target;
				const key = `${lost.side}:${zone}:${slot.card}:battle`;
				if (s.used.filter((used) => used === key).length < immune.perTurn) {
					s.used.push(key);
					return false;
				}
			}
			return true;
		});
		this.events.push({ type: "battle", side: s.turn, attacker: attacker.card, attackerValue: atk, defender: defender.card, defenderValue: value, defenderPosition: defender.position, damage, destroyed });
		/* Damage is calculated first; destroyed monsters go to the Graveyard after, as the last thing of the battle. */
		if (damage) this.damage(damage.side, damage.amount);
		for (const lost of destroyed) this.leave(lost.side, lost.side === s.turn ? pending.attacker : pending.target, "graveyard");
		/* Flame Wingman: "When this card destroys a monster by battle and sends it to the GY: inflict damage equal to the ATK of the destroyed monster in the GY." */
		for (const [winner, loser, side] of [[attacker, defender, s.turn], [defender, attacker, other(s.turn)]] as const) {
			if (s.winner || !live(winner)?.battleBurn) continue;
			const beaten = destroyed.some((lost) => isAttacker(lost) === (loser === attacker));
			const standing = destroyed.some((lost) => isAttacker(lost) === (winner === attacker));
			if (!beaten || standing || !s[other(side)].graveyard.includes(loser.card)) continue;
			const amount = monsterOf(loser.card).atk;
			this.events.push({ type: "burned", side, card: winner.card, amount });
			this.damage(other(side), amount);
		}
		/* Rocket Warrior: "If this card attacks a monster, after damage calculation: That attack target loses 500 ATK until the end of this turn." */
		if (rocket && s[other(s.turn)].monsters[pending.target] === defender) {
			defender.boost -= rocket.weaken;
			this.events.push({ type: "boosted", side: other(s.turn), card: defender.card, amount: -rocket.weaken, atk: atkOf(defender, s) });
		}
		/* Nova Master: "If this card destroys an opponent's monster by battle: Draw 1 card." */
		for (const [winner, loser, side] of [[attacker, defender, s.turn], [defender, attacker, other(s.turn)]] as const) {
			if (s.winner || !live(winner)?.battleDraw || this.deckLocked()) continue;
			if (!destroyed.some((lost) => isAttacker(lost) === (loser === attacker))) continue;
			const top = s[side].deck.shift();
			if (!top) {
				/* "Draw 1 card" with no card left: like an empty Deck in the Draw Phase, that player loses. */
				this.events.push({ type: "deck-out", side });
				this.win(other(side));
				return;
			}
			s[side].hand.push(top);
			this.events.push({ type: "drew", side, card: top });
		}
		/* Twin Burst: the monster it attacked and did not destroy is banished, at the end of the Damage Step. */
		if (!s.winner && live(attacker)?.banishSurvivor && s[other(s.turn)].monsters[pending.target] === defender && s[s.turn].monsters[pending.attacker] === attacker) {
			const owner = defender.owner ?? other(s.turn);
			this.leave(other(s.turn), pending.target, "banished");
			this.events.push({ type: "banished", side: owner, cards: [defender.card], faceDown: false });
		}
	}
	private resolveSpell(pending: Extract<Pending, { kind: "spell" }>): void {
		const s = this.state;
		const card = cardOf(pending.card);
		if (card.kind !== "spell") return;
		const effect = card.effect;
		if (pending.negated) {
			/* Its effect was negated (Ash Blossom & Joyous Spring): the card goes to the Graveyard and does nothing. */
			if (effect.type === "deck-summon" || effect.type === "hand-summon" || (effect.type === "call" && !effect.lock)) s.summons = Math.max(0, s.summons - 1);
			this.toGraveyard(s.turn, pending.card, null);
			return;
		}
		if (effect.type === "field-boost") {
			/* A Field Spell stays face-up in the Field Zone. One per player: the one before goes to the Graveyard. */
			if (this.me.field) this.toGraveyard(s.turn, this.me.field, null);
			this.me.field = pending.card;
			this.events.push({ type: "field", side: s.turn, card: pending.card });
			return;
		}
		const nothing = () => {
			this.events.push({ type: "no-effect", card: pending.card });
		};
		if ((effect.type === "banner" || effect.type === "equip" || effect.type === "swords") && pending.zone !== undefined && !this.me.backrow[pending.zone]) {
			const target = effect.type === "equip" ? pending.target : undefined;
			const wearer = target === undefined ? null : this.me.monsters[target];
			if (effect.type === "equip" && (!wearer || target === undefined)) {
				/* The monster to equip left the field before the Spell resolved: the Spell goes to the Graveyard. */
				this.toGraveyard(s.turn, pending.card, null);
				return nothing();
			}
			this.me.backrow[pending.zone] = { card: pending.card, setThisTurn: false, open: true, ...(target === undefined ? {} : { equip: target }), ...(effect.type === "swords" ? { turns: 0 } : {}) };
			this.events.push(wearer ? { type: "equipped", side: s.turn, card: pending.card, target: wearer.card } : { type: "stays", side: s.turn, card: pending.card });
			/* Swords of Revealing Light: "If your opponent controls a face-down monster, flip all monsters they control face-up." */
			if (effect.type === "swords") for (const held of s[other(s.turn)].monsters) if (held) this.flip(other(s.turn), held, "effect");
			return;
		}
		this.toGraveyard(s.turn, pending.card, null);
		if (effect.type === "burn") {
			this.events.push({ type: "burned", side: s.turn, card: pending.card, amount: effect.amount });
			return this.damage(other(s.turn), effect.amount);
		}
		if (effect.type === "wipe") {
			for (const who of [s.turn, other(s.turn)] as const) {
				s[who].monsters.forEach((slot, zone) => {
					if (!slot) return;
					this.events.push({ type: "destroyed", side: who, card: slot.card });
					this.leave(who, zone, "graveyard");
				});
			}
			return;
		}
		if (effect.type === "clear-backrow") {
			/* "If you control [Dark Magician]:" is still true when the card resolves, or it does nothing. */
			if (effect.needs && !this.controls(s.turn, effect.needs)) return nothing();
			return this.clearBackrow(effect.scope === "all" ? [s.turn, other(s.turn)] : [other(s.turn)]);
		}
		if (effect.type === "search-pick" || effect.type === "deck-summon") {
			const at = pending.pick ? this.me.deck.indexOf(pending.pick) : -1;
			const zone = this.landing();
			if (!pending.pick || at < 0 || (effect.type === "deck-summon" && zone < 0) || (effect.type === "search-pick" && this.deckLocked())) return nothing();
			this.me.deck.splice(at, 1);
			this.shuffle(this.me.deck);
			if (effect.type === "search-pick") {
				this.me.hand.push(pending.pick);
				this.events.push({ type: "added", side: s.turn, card: pending.pick, from: "deck" });
			} else {
				this.me.monsters[zone] = standing(pending.pick, { summoned: true });
				this.events.push({ type: "special", side: s.turn, card: pending.pick, zone, how: "own", materials: [] });
			}
			return;
		}
		if (effect.type === "coin-wipe") return this.coinWipe(s.turn, pending.card);
		if (effect.type === "curtain") return this.curtain(s.turn);
		if (effect.type === "call") {
			const wanted = effect.card as CardId;
			const zone = this.landing();
			const from = effect.from.includes("hand") && this.me.hand.includes(wanted) ? "hand" : effect.from.includes("deck") && this.me.deck.includes(wanted) ? "deck" : null;
			if (!from || zone < 0 || (effect.needs && !this.controls(s.turn, effect.needs))) return nothing();
			if (from === "hand") this.me.hand.splice(this.me.hand.indexOf(wanted), 1);
			else {
				this.me.deck.splice(this.me.deck.indexOf(wanted), 1);
				this.shuffle(this.me.deck);
			}
			this.me.monsters[zone] = standing(wanted, { summoned: true });
			this.events.push({ type: "special", side: s.turn, card: wanted, zone, how: "own", materials: [] });
			return;
		}
		if (effect.type === "hand-summon") {
			const zone = this.landing();
			const at = pending.pick ? this.me.hand.indexOf(pending.pick) : -1;
			if (!pending.pick || at < 0 || zone < 0) return nothing();
			this.me.hand.splice(at, 1);
			this.me.monsters[zone] = standing(pending.pick, { summoned: true });
			this.events.push({ type: "special", side: s.turn, card: pending.pick, zone, how: "own", materials: [] });
			return;
		}
		if (effect.type === "smash") {
			/* The card chooses: the highest DEF among the opponent's face-up monsters. The player only chooses between monsters that are tied. */
			const foe = s[other(s.turn)];
			const values = foe.monsters.flatMap((slot, zone) => (slot && !slot.faceDown ? [{ zone, def: defOf(slot, s) }] : []));
			if (values.length === 0) return nothing();
			const highest = Math.max(...values.map((item) => item.def));
			const tied = values.filter((item) => item.def === highest).map((item) => item.zone);
			const zone = pending.target !== undefined && tied.includes(pending.target) ? pending.target : (tied[0] ?? 0);
			const slot = foe.monsters[zone];
			if (!slot) return nothing();
			this.events.push({ type: "destroyed", side: other(s.turn), card: slot.card });
			this.leave(other(s.turn), zone, "graveyard");
			return;
		}
		if (effect.type === "search") {
			const at = this.me.deck.indexOf(effect.card as CardId);
			if (at < 0 || this.deckLocked()) return nothing();
			const [found] = this.me.deck.splice(at, 1);
			if (!found) return nothing();
			this.me.hand.push(found);
			this.events.push({ type: "added", side: s.turn, card: found, from: "deck" });
			return;
		}
		if (effect.type === "recover") {
			const from = pending.grave;
			const found = from && from.side === s.turn ? this.me.graveyard[from.index] : undefined;
			if (!from || !found || cardOf(found).kind !== "monster") return nothing();
			this.me.graveyard.splice(from.index, 1);
			this.me.hand.push(found);
			this.events.push({ type: "added", side: s.turn, card: found, from: "graveyard" });
			return;
		}
		if (effect.type === "gain-lp") {
			this.me.lp += effect.amount;
			this.events.push({ type: "gained", side: s.turn, amount: effect.amount, lp: this.me.lp });
			return;
		}
		if (effect.type === "data") return this.runSteps(s.turn, effect.actions, pending.card, pending.pick, pending.target);
		if ((effect.type === "draw" || effect.type === "draw-then-gift") && this.deckLocked()) return nothing();
		if (effect.type === "draw" || effect.type === "draw-then-gift") {
			const count = effect.type === "draw" ? effect.count : 1;
			let drew = 0;
			for (let index = 0; index < count; index++) {
				const top = this.me.deck.shift();
				if (!top) break;
				this.me.hand.push(top);
				this.events.push({ type: "drew", side: s.turn, card: top });
				drew++;
			}
			/* "Draw 1 card, then…": the second part only happens after the first, and only if the first did. */
			if (effect.type === "draw-then-gift" && drew > 0) {
				const foe = s[other(s.turn)];
				foe.lp += effect.lp;
				this.events.push({ type: "gained", side: other(s.turn), amount: effect.lp, lp: foe.lp });
			}
			return;
		}
		if (effect.type === "destroy-all") {
			const foe = s[other(s.turn)];
			if (effect.needs && !this.controls(s.turn, effect.needs, effect.needs === "dark-magician-girl")) return nothing();
			const zones = foe.monsters.flatMap((slot, zone) => (slot && !(effect.faceUp && slot.faceDown) ? [zone] : []));
			/* "[Blue-Eyes White Dragon] you control cannot attack the turn you activate this card." */
			if (effect.lockAttack) for (const held of this.me.monsters) if (held && named(held.card, effect.needs ?? "")) held.attacked = true;
			if (zones.length === 0) return nothing();
			for (const zone of zones) {
				const slot = foe.monsters[zone];
				if (!slot) continue;
				this.leave(other(s.turn), zone, "graveyard");
				this.events.push({ type: "destroyed", side: other(s.turn), card: slot.card });
			}
			return;
		}
		if (effect.type === "destroy-lowest") {
			/* The card chooses: the lowest ATK. The player only chooses between monsters that are tied. */
			const foe = s[other(s.turn)];
			const values = foe.monsters.flatMap((slot, zone) => (slot && !slot.faceDown ? [{ zone, atk: atkOf(slot, s) }] : []));
			if (values.length === 0) return nothing();
			const lowest = Math.min(...values.map((item) => item.atk));
			const tied = values.filter((item) => item.atk === lowest).map((item) => item.zone);
			const zone = pending.target !== undefined && tied.includes(pending.target) ? pending.target : (tied[0] ?? 0);
			const slot = foe.monsters[zone];
			if (!slot) return nothing();
			this.events.push({ type: "destroyed", side: other(s.turn), card: slot.card });
			this.leave(other(s.turn), zone, "graveyard");
			return;
		}
		if (effect.type === "revive") {
			const from = pending.grave;
			const zone = this.landing();
			const found = from ? s[from.side].graveyard[from.index] : undefined;
			if (!from || !found || cardOf(found).kind !== "monster" || zone < 0) return nothing();
			s[from.side].graveyard.splice(from.index, 1);
			this.me.monsters[zone] = standing(found, { summoned: true, ...(from.side === s.turn ? {} : { owner: from.side }) });
			this.events.push({ type: "special", side: s.turn, card: found, zone, how: "revive", materials: [], from: from.side });
			return;
		}
		if (effect.type === "ritual" || effect.type === "fusion") {
			const summoned = effect.type === "ritual" ? (effect.monster as CardId) : pending.summon;
			const source = effect.type === "ritual" ? this.me.hand : this.me.extra;
			if (!summoned || !source.includes(summoned)) return nothing();
			const cards: CardId[] = [];
			const zones: number[] = [];
			for (const item of pending.materials ?? []) {
				if (item.from === "hand") {
					const at = this.me.hand.indexOf(item.card);
					if (at < 0) continue;
					this.me.hand.splice(at, 1);
					/* The Summon comes right after, so a "When…" effect misses its chance. */
					this.toGraveyard(s.turn, item.card, "summon");
					cards.push(item.card);
				} else {
					const gone = this.leave(s.turn, item.zone, "graveyard", "summon");
					if (!gone) continue;
					zones.push(item.zone);
					cards.push(gone);
				}
			}
			const zone = this.landing(zones);
			if (zone < 0) return nothing();
			source.splice(source.indexOf(summoned), 1);
			this.me.monsters[zone] = standing(summoned, { summoned: true });
			s.proper.push(`${s.turn}:${summoned}`);
			this.events.push({ type: "special", side: s.turn, card: summoned, zone, how: effect.type, materials: cards });
			if (effect.type === "fusion" && monsterOf(summoned).onFusion === "halve-foes") {
				/* "Halve the ATK and DEF of all face-up monsters your opponent currently controls." */
				for (const slot of s[other(s.turn)].monsters) {
					if (!slot || slot.faceDown) continue;
					const atkLoss = Math.floor(atkOf(slot, s) / 2);
					slot.bonus = (slot.bonus ?? 0) - atkLoss;
					slot.defBonus = (slot.defBonus ?? 0) - Math.floor(defOf(slot, s) / 2);
					this.events.push({ type: "boosted", side: other(s.turn), card: slot.card, amount: -atkLoss, atk: atkOf(slot, s), lasting: "for-good" });
				}
			}
			if (effect.type === "fusion" && monsterOf(summoned).onFusion === "gaia") {
				/* "Target 1 face-up monster your opponent controls; until the End Phase, its ATK is halved and this card gains the same amount of ATK." The strongest one is taken. */
				const foes = s[other(s.turn)].monsters.flatMap((slot) => (slot && !slot.faceDown ? [slot] : [])).sort((a, b) => atkOf(b, s) - atkOf(a, s));
				const victim = foes[0];
				const gaia = this.me.monsters[zone];
				if (victim && gaia) {
					const loss = Math.floor(atkOf(victim, s) / 2);
					victim.boost -= loss;
					gaia.boost += loss;
					this.events.push({ type: "boosted", side: other(s.turn), card: victim.card, amount: -loss, atk: atkOf(victim, s) }, { type: "boosted", side: s.turn, card: gaia.card, amount: loss, atk: atkOf(gaia, s) });
				}
			}
			return;
		}
		const owner = spellTarget(pending.card) === "own" ? s.turn : other(s.turn);
		const slot = pending.target === undefined ? null : (s[owner].monsters[pending.target] ?? null);
		if (!slot || pending.target === undefined) {
			/* The target left the field before the Spell resolved. */
			return nothing();
		}
		/* A monster turned face-down since the card was activated is no longer a face-up target. */
		if (slot.faceDown && !(effect.type === "destroy" && effect.anyFace)) return nothing();
		this.hit(effect, s.turn, owner, pending.target, slot, pending.card);
	}

	private damage(who: Side, amount: number): void {
		const target = this.state[who];
		const from = target.lp;
		target.lp = Math.max(0, from - amount);
		this.events.push({ type: "lp", side: who, from, to: target.lp });
		if (target.lp === 0) this.win(other(who));
	}
	private win(who: Side): void {
		this.state.winner = who;
		/* The duel is over: effects still waiting for the Graveyard never get their chance. */
		this.state.triggers = [];
		this.state.pending = null;
		this.events.push({ type: "won", side: who });
	}
}

/** `forced`: the result of a coin toss, given instead of tossed (the bots weigh both results; tests fix one). */
export function apply(state: Board, move: Move, forced: { coin?: boolean } = {}): Result {
	const play = new Play(state, forced);
	try {
		play.run(move);
	} catch (error) {
		if (error instanceof Rejected) return { ok: false, reason: error.reason };
		throw error;
	}
	return { ok: true, board: play.state, events: play.events };
}

/** Every way the turn player could use an effect written as data now: each choice of card and target that fits. */
export function effectMoves(state: Board): Move[] {
	const who = state.turn;
	const mine = state[who];
	const out: Move[] = [];
	const ways = (base: Extract<Move, { type: "effect" }>, actions: readonly Action[]) => {
		const choice = choiceOf(actions);
		const aim = targetOf(actions);
		const picks: (CardId | undefined)[] = choice ? [...new Set(choice.from.flatMap((place) => mine[place]))].filter((card) => fitsFilter(card, choice.filter)) : [undefined];
		const targets: (number | undefined)[] = aim ? mine.monsters.flatMap((slot, zone) => (slot && fitsFilter(slot.card, aim) ? [zone] : [])) : [undefined];
		for (const pick of picks) for (const target of targets) out.push({ ...base, ...(pick ? { pick } : {}), ...(target === undefined ? {} : { target }) });
	};
	mine.monsters.forEach((slot, zone) => {
		if (slot) effectsOf(slot.card).forEach((effect, index) => effect.when === "ignition" && (effect.from ?? "field") === "field" && ways({ type: "effect", card: slot.card, effect: index, zone }, effect.actions));
	});
	for (const place of ["hand", "graveyard"] as const) {
		for (const card of new Set(mine[place])) effectsOf(card).forEach((effect, index) => effect.when === "ignition" && effect.from === place && ways({ type: "effect", card, effect: index }, effect.actions));
	}
	for (const item of state.triggered) {
		const effect = effectsOf(item.card)[item.effect];
		if (item.side === who && effect) ways({ type: "effect", card: item.card, effect: item.effect, ...(item.zone === undefined ? {} : { zone: item.zone }) }, effect.actions);
	}
	return out;
}
/** The most monsters one Summon is tried with when every move is listed. No card in Junior play needs more. */
const MOST_MATERIALS = 3;
/** Every way to pick between `min` and `max` of these items, in order. */
function picks<T>(items: readonly T[], min: number, max: number): T[][] {
	const out: T[][] = [];
	const walk = (start: number, chosen: T[]) => {
		if (chosen.length >= min) out.push(chosen);
		if (chosen.length >= max) return;
		for (let index = start; index < items.length; index++) walk(index + 1, [...chosen, items[index] as T]);
	};
	walk(0, []);
	return out;
}
/**
 * Every move the acting player may make now. Boards are small enough to try them all.
 * On the whole mat a card is offered in the first empty zone only: which empty zone it takes changes nothing.
 */
export function legalMoves(state: Board): Move[] {
	return legalPlays(state).map((play) => play.move);
}
/** Every move the acting player may make now, each with the board it leads to and what happens on the way. */
export function legalPlays(state: Board): { move: Move; board: Board; events: GameEvent[] }[] {
	if (state.winner) return [];
	const who = state[actor(state)];
	const main = mainZones(state);
	const monsterZones = who.monsters.map((_, zone) => zone);
	const backZones = who.backrow.map((_, zone) => zone);
	const held = monsterZones.filter((zone) => who.monsters[zone]);
	const candidates: Move[] = [];
	if (state.pending) {
		candidates.push({ type: "pass" });
		for (const zone of backZones.filter((at) => who.backrow[at])) {
			candidates.push({ type: "spring", zone }, ...monsterZones.map((target): Move => ({ type: "spring", zone, target })));
			/* Magic Jammer: "Discard 1 card;". */
			const info = cardOf(who.backrow[zone]!.card);
			if (info.kind === "trap" && info.cost?.type === "discard") for (const discard of new Set(who.hand)) candidates.push({ type: "spring", zone, discard });
		}
		for (const zone of held) candidates.push({ type: "ability", zone }, ...monsterZones.map((target): Move => ({ type: "ability", zone, target })));
		for (const zone of held) if (who.monsters[zone] && monsterOf(who.monsters[zone]!.card).act) for (const discard of new Set(who.hand)) candidates.push({ type: "ability", zone, discard }, ...monsterZones.map((target): Move => ({ type: "ability", zone, target, discard })));
		const targets = (card: CardId) => {
			const info = cardOf(card);
			return (info.kind === "monster" && info.hand === "veiler") || (info.kind === "trap" && info.effect.type === "impermanence");
		};
		for (const card of new Set(who.hand)) candidates.push({ type: "hand", card }, ...(targets(card) ? monsterZones.map((target): Move => ({ type: "hand", card, target })) : []));
	} else {
		candidates.push({ type: "draw" }, ...PHASES.map((to): Move => ({ type: "phase", to })));
		const firstMonster = who.monsters.findIndex((slot, zone) => zone < main && !slot);
		const firstBack = who.backrow.findIndex((slot) => !slot);
		const backPlaces = state.full ? [firstBack].filter((zone) => zone >= 0) : backZones;
		for (const card of new Set(who.hand)) {
			const info = cardOf(card);
			if (info.kind === "monster") {
				for (const tributes of picks(held, tributesFor(info.level), tributesFor(info.level))) {
					const places = !state.full ? monsterZones : [tributes[0] ?? firstMonster].filter((zone) => zone >= 0);
					for (const zone of places) candidates.push({ type: "place", card, row: "monsters", zone, tributes }, { type: "place", card, row: "monsters", zone, tributes, set: true });
				}
				if (info.special && firstMonster >= 0) candidates.push({ type: "place", card, row: "monsters", zone: firstMonster, special: true });
				if (info.scale !== undefined) candidates.push({ type: "place", card, row: "backrow", zone: 0 }, { type: "place", card, row: "backrow", zone: who.backrow.length - 1 });
				continue;
			}
			if (info.kind === "spell" && info.icon === "field") {
				candidates.push({ type: "place", card, row: "field", zone: 0 });
				continue;
			}
			const others = who.hand.filter((_, index) => index !== who.hand.indexOf(card));
			const fodder: Material[] = [...[...new Set(others)].filter((item) => cardOf(item).kind === "monster").map((item): Material => ({ from: "hand", card: item })), ...held.map((zone): Material => ({ from: "field", zone }))];
			for (const zone of backPlaces) {
				const base: Extract<Move, { type: "place" }> = { type: "place", card, row: "backrow", zone };
				const ways: Extract<Move, { type: "place" }>[] = [base, ...monsterZones.map((target) => ({ ...base, target }))];
				if (info.effect.type === "revive") for (const side of ["you", "rival"] as const) state[side].graveyard.forEach((_, index) => ways.push({ ...base, grave: { side, index } }));
				if (info.effect.type === "recover") who.graveyard.forEach((_, index) => ways.push({ ...base, grave: { side: actor(state), index } }));
				if (info.effect.type === "hand-summon") for (const pick of new Set(others)) ways.push({ ...base, pick });
				if (info.effect.type === "data") {
					const choice = choiceOf(info.effect.actions);
					if (choice) for (const pick of new Set(choice.from.flatMap((place) => who[place]))) if (pick !== card) ways.push({ ...base, pick });
				}
				if (info.effect.type === "search-pick" || info.effect.type === "deck-summon") for (const pick of new Set(who.deck)) ways.push({ ...base, pick });
				if (info.effect.type === "ritual") for (const materials of picks(fodder, 1, MOST_MATERIALS)) ways.push({ ...base, materials });
				if (info.effect.type === "fusion") for (const summon of new Set(who.extra)) for (const materials of picks(fodder, 2, MOST_MATERIALS)) ways.push({ ...base, summon, materials });
				if (isQuickPlay(card) && info.effect.type !== "revive") ways.push({ ...base, set: true });
				const discards = info.cost?.type === "discard" ? [...new Set(others)] : [];
				candidates.push(...(info.cost?.type === "discard" ? ways.flatMap((move) => discards.map((discard): Move => ({ ...move, discard }))) : ways));
			}
		}
		for (const zone of backZones.filter((at) => who.backrow[at] && !who.backrow[at]?.up && !who.backrow[at]?.open)) {
			candidates.push({ type: "spring", zone }, ...monsterZones.map((target): Move => ({ type: "spring", zone, target })));
			who.graveyard.forEach((_, index) => candidates.push({ type: "spring", zone, grave: { side: actor(state), index } }));
		}
		for (const card of new Set(who.extra)) for (const materials of picks(held, 1, MOST_MATERIALS)) candidates.push({ type: "extra", card, materials });
		if (scalesOf(state, actor(state)) && !state.pendulumUsed) {
			const monsters = [...who.hand.filter((card) => cardOf(card).kind === "monster"), ...who.extraUp];
			for (const cards of picks(monsters, 1, main)) candidates.push({ type: "pendulum", cards });
		}
		candidates.push(...effectMoves(state));
		const trigger = state.summonTrigger;
		if (trigger && trigger.side === actor(state)) {
			who.graveyard.forEach((_, index) => candidates.push({ type: "ability", zone: trigger.zone, grave: { side: trigger.side, index } }));
			for (const pick of new Set(who.deck)) if (cardOf(pick).kind !== "monster") candidates.push({ type: "ability", zone: trigger.zone, pick });
		}
		for (const zone of held) {
			candidates.push({ type: "ability", zone }, ...monsterZones.map((target): Move => ({ type: "ability", zone, target })));
			if (who.monsters[zone] && monsterOf(who.monsters[zone]!.card).act) for (const discard of new Set(who.hand)) candidates.push(...monsterZones.map((target): Move => ({ type: "ability", zone, target, discard })));
			candidates.push({ type: "position", zone }, { type: "attack", attacker: zone, target: "direct" }, ...monsterZones.map((target): Move => ({ type: "attack", attacker: zone, target })));
		}
	}
	const seen = new Set<string>();
	const plays: { move: Move; board: Board; events: GameEvent[] }[] = [];
	for (const move of candidates) {
		const key = JSON.stringify(move);
		if (seen.has(key)) continue;
		seen.add(key);
		const result = apply(state, move);
		if (result.ok) plays.push({ move, board: result.board, events: result.events });
	}
	return plays;
}
