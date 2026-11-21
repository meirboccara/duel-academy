import { FORBIDDEN_ONE, attributeOf, cardOf, inExtraDeck, isQuickPlay, monsterOf, spellTarget, staysOnField, tributesFor, type CardId, type Effect, type MonsterCard } from "./cards";

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
	| { kind: "spell"; card: CardId; target?: number; grave?: { side: Side; index: number }; summon?: CardId; materials?: Material[]; zone?: number };
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
	summonTrigger: { side: Side; zone: number } | null;
}

export type Move =
	| { type: "draw" }
	| { type: "phase"; to: Phase }
	/**
	 * Play a card from the hand into a zone: a Monster is Normal Summoned (or, with `special`, Special Summoned by its
	 * own text), a Spell is activated, a Trap is Set, a Pendulum Monster placed in a Pendulum Zone becomes a Scale.
	 * `grave` is the Graveyard card a Spell targets; `summon` and `materials` are the choices of a Ritual or Fusion Summon.
	 */
	| { type: "place"; card: CardId; row: Row; zone: number; tributes?: number[]; target?: number; discard?: CardId; grave?: { side: Side; index: number }; summon?: CardId; materials?: Material[]; special?: true; set?: true }
	| { type: "position"; zone: number }
	| { type: "attack"; attacker: number; target: number | "direct" }
	/**
	 * Flip a Set card: a Trap or a Quick-Play Spell in answer to the opponent, a Set Quick-Play Spell on your own turn,
	 * or a Continuous Trap that targets a monster in your Graveyard (`grave`) in your own Main Phase.
	 */
	| { type: "spring"; zone: number; target?: number; grave?: { side: Side; index: number } }
	/** Use the effect of one of your Monsters: on a face-up monster your opponent controls when it targets, or on a monster in your Graveyard (`grave`, Junk Synchron). */
	| { type: "ability"; zone: number; target?: number; grave?: { side: Side; index: number } }
	/** Synchro, Xyz or Link Summon a monster from the Extra Deck with monsters in these zones. */
	| { type: "extra"; card: CardId; materials: number[]; zone?: number }
	/** Pendulum Summon these monsters from the hand, all at once. */
	| { type: "pendulum"; cards: CardId[] }
	/** Use a Quick Effect of a monster in your hand. */
	| { type: "hand"; card: CardId }
	| { type: "pass" };

export type Reason =
	| "duel-over"
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
	| "jinzo-lock";

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
	/** A card goes to its owner's hand from the Deck or the Graveyard. */
	| { type: "added"; side: Side; card: CardId; from: "deck" | "graveyard" }
	/** ATK gained or lost: until the end of the turn (no `lasting`), for the Damage Step only, or for good. */
	| { type: "boosted"; side: Side; card: CardId; amount: number; atk: number; lasting?: "damage-step" | "for-good" }
	| { type: "destroyed"; side: Side; card: CardId }
	| { type: "no-effect"; card: CardId }
	| { type: "position"; side: Side; card: CardId; position: Position }
	| { type: "attack-declared"; side: Side; attacker: CardId; target: CardId | null }
	| { type: "window"; side: Side; kind: Pending["kind"]; step?: "damage" }
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
	| { type: "won"; side: Side };

/** What happened right after a card went to the Graveyard in the same action: the card it paid for was activated, or the monster it was used for was Summoned. */
export type After = "activation" | "summon";
export type Result = { ok: true; board: Board; events: GameEvent[] } | { ok: false; reason: Reason };

export type MonsterSetup = CardId | { card: CardId; position?: Position; materials?: readonly CardId[] } | null;
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
	return standing(item.card, { position: item.position ?? "attack", ...(item.materials ? { materials: [...item.materials] } : {}) });
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
		extraUp: [],
	};
}
export function board(setup: Setup = {}): Board {
	const phase = setup.phase ?? "main1";
	const full = setup.full ?? false;
	return { you: side(setup.you, full), rival: side(setup.rival, full), full, turn: setup.turn ?? "you", turnNumber: setup.turnNumber ?? 3, phase, strict: setup.strict ?? false, drawn: phase !== "draw", summonUsed: false, pendulumUsed: false, pending: null, winner: null, used: [], proper: [], triggers: [], standbyDone: phase !== "draw", summonTrigger: null };
}

export const other = (who: Side): Side => (who === "you" ? "rival" : "you");
/** What a monster on the field can do now: its card, or nothing while its effects are negated. */
export const live = (slot: MonsterSlot): MonsterCard | null => (slot.negated ? null : monsterOf(slot.card));
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
	if (gains.per === "in-graveyards") return [...state.you.graveyard, ...state.rival.graveyard].filter((card) => gains.cards.includes(card)).length * gains.amount;
	if (gains.per === "allies") return mine.monsters.filter((other) => !!other && other !== slot && gains.cards.includes(other.card)).length * gains.amount;
	if (gains.per === "small-hand") return mine.hand.length <= 1 ? gains.amount : 0;
	const dragon = (card: CardId) => cardOf(card).kind === "monster" && monsterOf(card).type === "dragon";
	return (foe.monsters.filter((other) => !!other && dragon(other.card)).length + foe.graveyard.filter(dragon).length) * gains.amount;
}
export const atkOf = (slot: MonsterSlot, state: Board) => Math.max(0, monsterOf(slot.card).atk + slot.boost + (slot.bonus ?? 0) + fieldBonus(slot.card, state) + spellBonus(slot, state, "atk") + gainsOf(slot, state, "atk"));
export const defOf = (slot: MonsterSlot, state: Board) => Math.max(0, monsterOf(slot.card).def + fieldBonus(slot.card, state) + spellBonus(slot, state, "def") + gainsOf(slot, state, "def"));
/** The two Pendulum Zones are the leftmost and rightmost Spell & Trap Zones. The Scales set there, low then high, or null. */
export function scalesOf(state: Board, who: Side): { low: number; high: number } | null {
	const row = state[who].backrow;
	const scales = [row[0], row[row.length - 1]].flatMap((slot) => (slot?.up ? [monsterOf(slot.card).scale ?? 0] : []));
	const [a, b] = scales;
	return a === undefined || b === undefined ? null : { low: Math.min(a, b), high: Math.max(a, b) };
}
/** The player who has to act now: the turn player, or the other one while they may answer. */
export const actor = (state: Board): Side => (state.pending ? other(state.turn) : state.turn);
const isMain = (phase: Phase) => phase === "main1" || phase === "main2";
const after = (a: Phase, b: Phase) => PHASES.indexOf(a) > PHASES.indexOf(b);
const TRAP_ANSWERS: Record<Pending["kind"], Effect["type"][]> = { attack: ["weaken-attacker", "stop-attack", "destroy-attacker", "banish-attacker", "reinforce", "negate-attack", "mirror-force", "magic-cylinder", "just-desserts", "clear-backrow", "recharge"], spell: ["return-to-hand"] };
/** What a Set Quick-Play Spell can do in answer: make one of its owner's monsters stronger, or destroy an opponent's monster. */
const QUICK_ANSWERS: Effect["type"][] = ["boost", "destroy"];
/** A Trap whose target is one of its owner's monsters needs one on the field. */
const needsOwnMonster = (effect: Effect["type"]) => effect === "return-to-hand" || effect === "reinforce";

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
	constructor(source: Board) {
		this.state = structuredClone(source);
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
		this.state.summonTrigger = null;
		if (move.type === "ability" && move.grave) this.summonRevive(trigger, move.zone, move.grave);
		else this.move(move);
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
	/** A card goes to its owner's Graveyard. `followedBy` is what happens right after it in the same action, if anything. */
	private toGraveyard(who: Side, card: CardId, followedBy: After | null): void {
		this.state[who].graveyard.push(card);
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
		if (to === "banished") s[owner].banished.push({ card: slot.card, faceDown: false });
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
				return this.ability(move.zone, move.target);
			case "extra":
				return this.extraSummon(move);
			case "pendulum":
				return this.pendulumSummon(move.cards);
			case "hand":
				return this.handEffect(move.card);
			case "pass":
				if (!s.pending) reject("nothing-to-answer");
				return this.resolvePending();
		}
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
			for (const slot of who.monsters) if (slot) Object.assign(slot, { attacked: false, summoned: false, moved: false, boost: 0, attackCount: 0 });
			for (const slot of who.backrow) if (slot) slot.setThisTurn = false;
		}
		s.turn = other(s.turn);
		s.turnNumber += 1;
		s.phase = "draw";
		s.drawn = false;
		s.summonUsed = false;
		s.pendulumUsed = false;
		s.standbyDone = false;
		s.used = [];
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
			/* A Ritual Monster is only ever Special Summoned by its Ritual Spell. */
			if (card.frame) reject("special-only");
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
			if (card.kind !== "spell" || !isQuickPlay(move.card)) reject("cannot-set");
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
		const target = needsTarget ? (move.target ?? -1) : effect.type === "destroy-lowest" ? move.target : undefined;
		const targetSlot = !needsTarget || target === undefined ? null : (s[targetSide].monsters[target] ?? null);
		if (needsTarget && !targetSlot) reject("no-target");
		/* "Equip only to a Warrior monster." "Equip only to a FIRE monster." */
		if (effect.type === "equip" && effect.only && targetSlot && monsterOf(targetSlot.card).type !== effect.only) reject("equip-only");
		if (effect.type === "equip" && effect.attribute && targetSlot && attributeOf(targetSlot.card) !== effect.attribute) reject("equip-only");
		/* "If you control [Dark Magician]:" */
		if (effect.type === "destroy" && effect.needs && !me.monsters.some((held) => held?.card === effect.needs)) reject("condition-not-met");
		if (effect.type === "wipe" && !s.you.monsters.some(Boolean) && !s.rival.monsters.some(Boolean)) reject("nothing-to-hit");
		if (effect.type === "clear-backrow") {
			const sides = effect.scope === "all" ? [s.you, s.rival] : [s[other(s.turn)]];
			if (!sides.some((who) => who.backrow.some(Boolean) || who.field)) reject("nothing-to-hit");
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
			if (monsterOf(buried).frame && !s.proper.includes(`${move.grave?.side}:${buried}`)) reject("not-properly-summoned");
			if (this.landing() < 0) reject("no-free-zone");
		}
		if (effect.type === "draw-then-gift" && me.deck.length < 1) reject("deck-too-small");
		if (effect.type === "ritual") this.checkRitual(move, effect, rest);
		if (effect.type === "fusion") this.checkFusion(move, rest);
		/* A cost is paid while the card is activated: the card to discard must be another card in the hand. */
		if (card.cost?.type === "discard" && (!move.discard || !rest.includes(move.discard))) reject("cost-needed");
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
		if (card.cost?.type === "banish-deck") {
			const gone = me.deck.splice(0, card.cost.count);
			me.banished.push(...gone.map((item) => ({ card: item, faceDown: true })));
			this.events.push({ type: "banished", side: s.turn, cards: gone, faceDown: true });
		}
		s.pending = { kind: "spell", card: move.card, ...(target === undefined ? {} : { target }), ...(move.grave ? { grave: move.grave } : {}), ...(move.summon ? { summon: move.summon } : {}), ...(move.materials ? { materials: move.materials } : {}), ...((staysOnField(move.card) && !inField) || effect.type === "swords" ? { zone: move.zone } : {}) };
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
		if ([...cards].sort().join() !== [...recipe].sort().join()) reject("wrong-materials");
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
		me.monsters[move.zone] = standing(move.card, { summoned: true });
		s.summonUsed = true;
		this.events.push({ type: "summoned", side: s.turn, card: move.card, zone: move.zone, tributes: gone });
		if (monsterOf(move.card).summonRevive) s.summonTrigger = { side: s.turn, zone: move.zone };
	}
	/** Junk Synchron, right after its Normal Summon: Special Summon a low-Level monster from its owner's Graveyard in Defense Position, its effects negated. */
	private summonRevive(trigger: Board["summonTrigger"], zone: number, grave: { side: Side; index: number }): void {
		const s = this.state;
		const slot = this.me.monsters[zone];
		const revive = slot ? live(slot)?.summonRevive : undefined;
		if (!trigger || trigger.side !== s.turn || trigger.zone !== zone || !slot || !revive) return reject("nothing-to-answer");
		const found = grave.side === s.turn ? this.me.graveyard[grave.index] : undefined;
		if (!found || cardOf(found).kind !== "monster" || monsterOf(found).level > revive.maxLevel || monsterOf(found).level < 1) return reject("no-target");
		if (monsterOf(found).frame && !s.proper.includes(`${s.turn}:${found}`)) reject("not-properly-summoned");
		const landed = this.landing();
		if (landed < 0) return reject("no-free-zone");
		this.me.graveyard.splice(grave.index, 1);
		this.me.monsters[landed] = standing(found, { summoned: true, position: "defense", negated: true });
		this.events.push({ type: "ability", side: s.turn, card: slot.card, target: found }, { type: "special", side: s.turn, card: found, zone: landed, how: "revive", materials: [], from: s.turn });
	}
	/** "If only your opponent controls a monster, you can Special Summon this card (from your hand)." No colon, no semicolon: no Chain. */
	private ownSummon(move: Extract<Move, { type: "place" }>, at: number): void {
		const s = this.state;
		const me = this.me;
		if (monsterOf(move.card).special !== "alone") reject("no-ability");
		if (me.monsters.some(Boolean) || !s[other(s.turn)].monsters.some(Boolean)) reject("condition-not-met");
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
		const pool = [...me.hand];
		if (cards.length === 0) reject("wrong-materials");
		for (const card of cards) {
			const at = pool.indexOf(card);
			if (at < 0) reject("not-in-hand");
			pool.splice(at, 1);
			const info = cardOf(card);
			if (info.kind !== "monster") return reject("wrong-materials");
			if (info.level <= scales.low || info.level >= scales.high) reject("level-not-between");
		}
		const main = mainZones(s);
		const free = me.monsters.flatMap((slot, zone) => (zone < main && !slot ? [zone] : []));
		if (free.length < cards.length) reject("no-free-zone");
		cards.forEach((card, index) => {
			me.hand.splice(me.hand.indexOf(card), 1);
			me.monsters[free[index] ?? 0] = standing(card, { summoned: true });
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
		const used = slots.flatMap((slot) => (slot ? [monsterOf(slot.card)] : []));
		if (info.frame === "fusion") reject("needs-spell");
		if (info.frame === "synchro") {
			/* 1 Tuner + 1 or more non-Tuner monsters, Levels exactly equal. A Rank or a Link Rating is not a Level. */
			if (used.filter((item) => item.tuner).length !== 1 || used.length < 2) reject("needs-one-tuner");
			/* "[Junk Synchron] + 1 or more non-Tuner monsters": that Tuner and no other. */
			if (info.synchroTuner && !slots.some((slot) => slot?.card === info.synchroTuner)) reject("wrong-materials");
			if (used.some((item) => item.level <= 0)) reject("wrong-materials");
			if (used.reduce((sum, item) => sum + item.level, 0) !== info.level) reject("levels-not-equal");
		} else if (info.frame === "xyz" && info.xyz) {
			const recipe = info.xyz;
			if (used.length !== recipe.count || used.some((item) => item.level !== recipe.level)) reject("wrong-levels");
		} else if (info.frame === "link") {
			if (!s.full) reject("wrong-zone");
			if (used.length !== info.link) reject("link-count");
		} else reject("not-in-extra");
		/* A Link Monster goes to the Extra Monster Zone. The others may go to any Main Monster Zone, or to the Extra Monster Zone. */
		const freeAfter = (zone: number) => zone >= 0 && zone < me.monsters.length && (!me.monsters[zone] || zones.includes(zone));
		const wanted = info.frame === "link" ? EXTRA_ZONE : (move.zone ?? this.landing(zones));
		if (info.frame === "link" && move.zone !== undefined && move.zone !== EXTRA_ZONE) reject("extra-zone");
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
		if (slot.position === "defense") reject("defense-cannot-attack");
		if (slot.attacked) reject("already-attacked");
		/* Swords of Revealing Light: "your opponent's monsters cannot declare an attack". */
		if (them.backrow.some((back) => !!back?.open && cardOf(back.card).kind === "spell" && (cardOf(back.card) as { effect: Effect }).effect.type === "swords")) reject("swords-lock");
		const defender = target === "direct" ? null : (them.monsters[target] ?? null);
		if (target === "direct" && them.monsters.some(Boolean) && !this.attacksDirectly(slot, them)) reject("monster-in-the-way");
		if (target !== "direct" && !defender) reject("no-target");
		s.phase = "battle";
		this.standby();
		/* "This card can make a second attack during each Battle Phase." */
		slot.attackCount = (slot.attackCount ?? 0) + 1;
		slot.attacked = slot.attackCount >= (live(slot)?.attacks ?? 1);
		this.events.push({ type: "attack-declared", side: s.turn, attacker: slot.card, target: defender?.card ?? null });
		let aimed = target;
		if (defender && aimed !== "direct" && monsterOf(defender.card).detach && (defender.materials?.length ?? 0) === 0) {
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
		return them.monsters.every((other) => !other || direct.includes(attributeOf(other.card) ?? "DIVINE"));
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
	/** Destroy every Spell and Trap of these players, Field Spells too. */
	private clearBackrow(sides: readonly Side[]): void {
		for (const who of sides) {
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
				if (!isQuickPlay(slot.card) || !QUICK_ANSWERS.includes(card.effect.type) || (damageStep && card.effect.type !== "boost")) return false;
				return card.effect.type === "boost" ? mine.monsters.some(Boolean) : s[s.turn].monsters.some(Boolean);
			}
			if (damageStep || trapsLocked(s)) return false;
			return card.kind === "trap" && TRAP_ANSWERS[pending.kind].includes(card.effect.type) && (!needsOwnMonster(card.effect.type) || mine.monsters.some(Boolean));
		});
		const quick = !damageStep && s[s.turn].monsters.some(Boolean) && mine.monsters.some((slot) => !!slot && live(slot)?.ability?.quick === true && !this.spent(who, slot.card));
		const detach = !damageStep && pending.kind === "attack" && mine.monsters.some((slot) => !!slot && !!live(slot)?.detach && (slot.materials?.length ?? 0) > 0);
		const hand = damageStep && mine.hand.some((card) => {
			const info = cardOf(card);
			return info.kind === "monster" && !!info.hand;
		});
		return trap || quick || detach || hand;
	}
	private spent(who: Side, card: CardId): boolean {
		return monsterOf(card).ability?.oncePerTurn === true && this.state.used.includes(`${who}:${card}`);
	}

	/**
	 * A Monster's effect. A Quick Effect may be used in answer to the opponent or on your own turn;
	 * any other effect only in your own Main Phase with nothing pending.
	 */
	private ability(zone: number, target?: number): void {
		const s = this.state;
		const who = s.pending ? other(s.turn) : s.turn;
		const slot = s[who].monsters[zone];
		if (!slot) return reject("no-monster");
		if (s.pending?.kind === "attack" && s.pending.step === "damage") return reject("damage-step-closed");
		if (live(slot)?.detach) return this.detach(who, slot);
		const ability = live(slot)?.ability;
		if (!ability) return reject("no-ability");
		if (!ability.quick) {
			if (who !== s.turn) reject("not-quick");
			this.needMain();
		}
		if (this.spent(who, slot.card)) reject("once-per-turn");
		const victim = target === undefined ? null : (s[other(who)].monsters[target] ?? null);
		if (!victim) return reject("no-target");
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
	private handEffect(card: CardId): void {
		const s = this.state;
		const pending = s.pending;
		if (pending?.kind !== "attack") return reject("nothing-to-answer");
		/* "During damage calculation": not yet in the Battle Step. */
		if (pending.step !== "damage") return reject("not-damage-step");
		const who = other(s.turn);
		const at = s[who].hand.indexOf(card);
		if (at < 0) reject("not-in-hand");
		const info = cardOf(card);
		if (info.kind !== "monster" || !info.hand) reject("no-ability");
		s[who].hand.splice(at, 1);
		this.toGraveyard(who, card, "activation");
		this.events.push({ type: "hand-effect", side: who, card });
		pending.noDamage = true;
		this.resolvePending();
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
		if (card.kind !== "trap" || !TRAP_ANSWERS[pending.kind].includes(card.effect.type)) return reject("cannot-answer-that");
		if (pending.kind === "attack" && pending.step === "damage") return reject("damage-step-closed");
		const saved = needsOwnMonster(card.effect.type) && target !== undefined ? (mine.monsters[target] ?? null) : null;
		if (needsOwnMonster(card.effect.type) && !saved) reject("no-target");
		mine.backrow[zone] = null;
		this.toGraveyard(owner, slot.card, null);
		this.events.push({ type: "sprung", side: owner, card: slot.card });
		if (pending.kind === "attack") {
			const attacker = this.me.monsters[pending.attacker];
			if (!attacker) return;
			const needs = card.effect.type === "stop-attack" ? card.effect.needs : undefined;
			if (needs && !mine.monsters.some((held) => !!held && held.card.startsWith(needs))) {
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
				this.clearBackrow([s.turn, owner]);
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
		/* A two-link chain: the Trap was activated last, so it resolves first. */
		this.events.push({ type: "chain", link: 2, side: owner, card: slot.card }, { type: "resolve", link: 2, card: slot.card });
		if (saved && target !== undefined) {
			this.leave(owner, target, "hand");
			this.events.push({ type: "returned", side: owner, card: saved.card });
		}
		this.events.push({ type: "resolve", link: 1, card: pending.card });
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
		if (!QUICK_ANSWERS.includes(effect.type)) return reject("cannot-answer-that");
		if (s.pending.kind === "attack" && s.pending.step === "damage" && effect.type !== "boost") return reject("damage-step-closed");
		const aimed = effect.type === "boost" ? owner : other(owner);
		const victim = target === undefined ? null : (s[aimed].monsters[target] ?? null);
		if (!victim || target === undefined) return reject("no-target");
		const pending = s.pending;
		mine.backrow[zone] = null;
		this.events.push({ type: "activated", side: owner, card: slot.card, target: victim.card });
		if (pending.kind === "spell") this.events.push({ type: "chain", link: 2, side: owner, card: slot.card }, { type: "resolve", link: 2, card: slot.card });
		this.toGraveyard(owner, slot.card, null);
		if (effect.type === "boost") {
			victim.boost += effect.amount;
			this.events.push({ type: "boosted", side: aimed, card: victim.card, amount: effect.amount, atk: atkOf(victim, s) });
		} else if (effect.type === "destroy") {
			this.leave(aimed, target, "graveyard");
			this.events.push({ type: "destroyed", side: aimed, card: victim.card });
			if (effect.skipDraw) mine.skipDraw = true;
		}
		if (pending.kind === "spell") this.events.push({ type: "resolve", link: 1, card: pending.card });
		/* The attacking monster is gone: its attack never happens. */
		if (pending.kind === "attack" && !s[s.turn].monsters[pending.attacker]) {
			s.pending = null;
			return;
		}
		this.resolvePending();
	}
	/** Call of the Haunted: "Activate this card by targeting 1 monster in your GY; Special Summon that target in Attack Position." It stays, linked to the monster. */
	private haunt(zone: number, grave?: { side: Side; index: number }): void {
		const s = this.state;
		const me = this.me;
		this.needMain();
		const found = grave && grave.side === s.turn ? me.graveyard[grave.index] : undefined;
		if (!grave || !found || cardOf(found).kind !== "monster") return reject("no-target");
		if (monsterOf(found).frame && !s.proper.includes(`${s.turn}:${found}`)) reject("not-properly-summoned");
		const landed = this.landing();
		if (landed < 0) return reject("no-free-zone");
		const slot = me.backrow[zone];
		if (!slot) return reject("nothing-to-answer");
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
		if (pending.kind === "spell") return this.resolveSpell(pending);
		if (pending.step !== "damage" && this.me.monsters[pending.attacker]) {
			/* The Battle Step is over: on to the Damage Step, where the defender may still act before damage is calculated. */
			s.pending = { ...pending, step: "damage" };
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
			const amount = atk + (bonus && !bonus.vs ? bonus.amount : 0);
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
		const guarded = (who: Side) => [attacker, defender].some((slot) => !!live(slot)?.noBattleDamage && (who === s.turn) === (slot === attacker));
		if (damage && guarded(damage.side)) damage = null;
		/* "Cannot be destroyed by battle with a monster that has 1900 or more ATK." "Once per turn, this card cannot be destroyed by battle." */
		destroyed = destroyed.filter((lost) => {
			const slot = lost.side === s.turn ? attacker : defender;
			const immune = live(slot)?.battleImmune;
			if (!immune) return true;
			const foeAtk = lost.side === s.turn ? value : atk;
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
	}
	private resolveSpell(pending: Extract<Pending, { kind: "spell" }>): void {
		const s = this.state;
		const card = cardOf(pending.card);
		if (card.kind !== "spell") return;
		const effect = card.effect;
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
		if (effect.type === "clear-backrow") return this.clearBackrow(effect.scope === "all" ? [s.turn, other(s.turn)] : [other(s.turn)]);
		if (effect.type === "search") {
			const at = this.me.deck.indexOf(effect.card as CardId);
			if (at < 0) return nothing();
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
			const zones = foe.monsters.flatMap((slot, zone) => (slot ? [zone] : []));
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
			const values = foe.monsters.flatMap((slot, zone) => (slot ? [{ zone, atk: atkOf(slot, s) }] : []));
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
			return;
		}
		const owner = spellTarget(pending.card) === "own" ? s.turn : other(s.turn);
		const slot = pending.target === undefined ? null : (s[owner].monsters[pending.target] ?? null);
		if (!slot || pending.target === undefined) {
			/* The target left the field before the Spell resolved. */
			return nothing();
		}
		if (effect.type === "boost") {
			slot.boost += effect.amount;
			this.events.push({ type: "boosted", side: owner, card: slot.card, amount: effect.amount, atk: atkOf(slot, s) });
		} else if (effect.type === "destroy") {
			this.leave(owner, pending.target, "graveyard");
			this.events.push({ type: "destroyed", side: owner, card: slot.card });
			if (effect.skipDraw) this.me.skipDraw = true;
			if (effect.foeGains) {
				/* "…then your opponent gains 1000 LP." */
				const foe = s[other(s.turn)];
				foe.lp += effect.foeGains;
				this.events.push({ type: "gained", side: other(s.turn), amount: effect.foeGains, lp: foe.lp });
			}
		}
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

export function apply(state: Board, move: Move): Result {
	const play = new Play(state);
	try {
		play.run(move);
	} catch (error) {
		if (error instanceof Rejected) return { ok: false, reason: error.reason };
		throw error;
	}
	return { ok: true, board: play.state, events: play.events };
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
		for (const zone of backZones.filter((at) => who.backrow[at])) candidates.push({ type: "spring", zone }, ...monsterZones.map((target): Move => ({ type: "spring", zone, target })));
		for (const zone of held) candidates.push({ type: "ability", zone }, ...monsterZones.map((target): Move => ({ type: "ability", zone, target })));
		for (const card of new Set(who.hand)) candidates.push({ type: "hand", card });
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
					for (const zone of places) candidates.push({ type: "place", card, row: "monsters", zone, tributes });
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
				if (info.effect.type === "ritual") for (const materials of picks(fodder, 1, MOST_MATERIALS)) ways.push({ ...base, materials });
				if (info.effect.type === "fusion") for (const summon of new Set(who.extra)) for (const materials of picks(fodder, 2, MOST_MATERIALS)) ways.push({ ...base, summon, materials });
				if (isQuickPlay(card)) ways.push({ ...base, set: true });
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
			const monsters = who.hand.filter((card) => cardOf(card).kind === "monster");
			for (const cards of picks(monsters, 1, main)) candidates.push({ type: "pendulum", cards });
		}
		const trigger = state.summonTrigger;
		if (trigger && trigger.side === actor(state)) who.graveyard.forEach((_, index) => candidates.push({ type: "ability", zone: trigger.zone, grave: { side: trigger.side, index } }));
		for (const zone of held) {
			candidates.push({ type: "ability", zone }, ...monsterZones.map((target): Move => ({ type: "ability", zone, target })));
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
