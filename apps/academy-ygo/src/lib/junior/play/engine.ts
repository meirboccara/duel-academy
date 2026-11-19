import { FORBIDDEN_ONE, cardOf, inExtraDeck, monsterOf, spellTarget, tributesFor, type CardId, type Effect } from "./cards";

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
	/** Whose card it is, when it is not its controller's: it goes back to its owner's Graveyard. */
	owner?: Side;
}
/** A face-down Trap, or (`up`) a Pendulum Monster face-up in a Pendulum Zone. */
export interface BackSlot {
	card: CardId;
	setThisTurn: boolean;
	up?: true;
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
}
/** A card used to Summon another: from the hand (by name) or from a Monster Zone. */
export type Material = { from: "hand"; card: CardId } | { from: "field"; zone: number };
/** A moment where the other player may answer, with a Set Trap or a Quick Effect, before things go on. */
export type Pending =
	| { kind: "attack"; attacker: number; target: number | "direct"; noDamage?: true }
	| { kind: "spell"; card: CardId; target?: number; grave?: { side: Side; index: number }; summon?: CardId; materials?: Material[] };
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
}

export type Move =
	| { type: "draw" }
	| { type: "phase"; to: Phase }
	/**
	 * Play a card from the hand into a zone: a Monster is Normal Summoned (or, with `special`, Special Summoned by its
	 * own text), a Spell is activated, a Trap is Set, a Pendulum Monster placed in a Pendulum Zone becomes a Scale.
	 * `grave` is the Graveyard card a Spell targets; `summon` and `materials` are the choices of a Ritual or Fusion Summon.
	 */
	| { type: "place"; card: CardId; row: Row; zone: number; tributes?: number[]; target?: number; discard?: CardId; grave?: { side: Side; index: number }; summon?: CardId; materials?: Material[]; special?: true }
	| { type: "position"; zone: number }
	| { type: "attack"; attacker: number; target: number | "direct" }
	/** Flip a Set Trap in answer to the opponent. */
	| { type: "spring"; zone: number; target?: number }
	/** Use the effect of one of your Monsters, on a face-up monster your opponent controls when it targets. */
	| { type: "ability"; zone: number; target?: number }
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
	| "not-properly-summoned";

/** How a monster was Special Summoned. */
export type SummonWay = "revive" | "ritual" | "fusion" | "synchro" | "xyz" | "link" | "own";
export type GameEvent =
	| { type: "drew"; side: Side; card: CardId }
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
	| { type: "boosted"; side: Side; card: CardId; amount: number; atk: number }
	| { type: "destroyed"; side: Side; card: CardId }
	| { type: "no-effect"; card: CardId }
	| { type: "position"; side: Side; card: CardId; position: Position }
	| { type: "attack-declared"; side: Side; attacker: CardId; target: CardId | null }
	| { type: "window"; side: Side; kind: Pending["kind"] }
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
	return { you: side(setup.you, full), rival: side(setup.rival, full), full, turn: setup.turn ?? "you", turnNumber: setup.turnNumber ?? 3, phase, strict: setup.strict ?? false, drawn: phase !== "draw", summonUsed: false, pendulumUsed: false, pending: null, winner: null, used: [], proper: [], triggers: [] };
}

export const other = (who: Side): Side => (who === "you" ? "rival" : "you");
/** How many Main Monster Zones (and Spell & Trap Zones) each player has on this board. */
export const mainZones = (state: Board): number => (state.full ? FULL_ZONES : ZONES);
/** What the Field Spells on the field add to this monster's ATK and DEF. "On the field" means both players' monsters. */
function fieldBonus(card: CardId, state: Board): number {
	const type = monsterOf(card).type;
	if (!type) return 0;
	let bonus = 0;
	for (const who of [state.you, state.rival]) {
		const effect = who.field ? cardOf(who.field) : null;
		if (effect?.kind === "spell" && effect.effect.type === "field-boost" && effect.effect.types.includes(type)) bonus += effect.effect.amount;
	}
	return bonus;
}
export const atkOf = (slot: MonsterSlot, state: Board) => Math.max(0, monsterOf(slot.card).atk + slot.boost + fieldBonus(slot.card, state));
export const defOf = (slot: MonsterSlot, state: Board) => monsterOf(slot.card).def + fieldBonus(slot.card, state);
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
const TRAP_ANSWERS: Record<Pending["kind"], Effect["type"][]> = { attack: ["weaken-attacker", "stop-attack", "destroy-attacker", "banish-attacker"], spell: ["return-to-hand"] };

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
		this.move(move);
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
		return slot.card;
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
			/* "If…" always gets its chance; "When…" only when going to the GY was the last thing that happened. */
			if (trigger.word === "when" && after) {
				this.events.push({ type: "missed", side, card, last: after });
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
				return this.spring(move.zone, move.target);
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
		if (to === "end") this.endTurn();
	}
	private endTurn(): void {
		const s = this.state;
		for (const who of [s.you, s.rival]) {
			for (const slot of who.monsters) if (slot) Object.assign(slot, { attacked: false, summoned: false, moved: false, boost: 0 });
			for (const slot of who.backrow) if (slot) slot.setThisTurn = false;
		}
		s.turn = other(s.turn);
		s.turnNumber += 1;
		s.phase = "draw";
		s.drawn = false;
		s.summonUsed = false;
		s.pendulumUsed = false;
		s.used = [];
		this.events.push({ type: "turn", side: s.turn });
	}
	/** Main Phase is needed. Outside strict play the phase follows the move. */
	private needMain(): void {
		const s = this.state;
		if (isMain(s.phase)) return;
		if (!this.auto || s.phase === "end") reject("not-main-phase");
		s.phase = s.phase === "battle" ? "main2" : "main1";
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
		this.needMain();
		if (!inField && me.backrow[move.zone]) reject("zone-taken");
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
		if ((effect.type === "destroy-all" || effect.type === "destroy-lowest") && !s[other(s.turn)].monsters.some(Boolean)) reject("nothing-to-hit");
		const rest = me.hand.filter((_, index) => index !== at);
		const buried = effect.type === "revive" && move.grave ? s[move.grave.side].graveyard[move.grave.index] : undefined;
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
		s.pending = { kind: "spell", card: move.card, ...(target === undefined ? {} : { target }), ...(move.grave ? { grave: move.grave } : {}), ...(move.summon ? { summon: move.summon } : {}), ...(move.materials ? { materials: move.materials } : {}) };
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
				for (const under of slot.materials ?? []) this.toGraveyard(s.turn, under, null);
			} else this.leave(s.turn, zone, "graveyard", "summon");
		}
		me.extra.splice(at, 1);
		me.monsters[wanted] = standing(move.card, { summoned: true, ...(info.frame === "xyz" ? { materials: cards, ...(borrowed.length > 0 ? { borrowed } : {}) } : {}) });
		s.proper.push(`${s.turn}:${move.card}`);
		this.events.push({ type: "special", side: s.turn, card: move.card, zone: wanted, how: info.frame, materials: cards });
	}

	private position(zone: number): void {
		const slot = this.me.monsters[zone];
		if (!slot) return reject("no-monster");
		/* Link Monsters have no DEF and are never in Defense Position. */
		if (monsterOf(slot.card).link) reject("link-no-defense");
		this.needMain();
		if (slot.summoned) reject("just-summoned");
		if (slot.attacked) reject("already-attacked");
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
		const defender = target === "direct" ? null : (them.monsters[target] ?? null);
		if (target === "direct" && them.monsters.some(Boolean)) reject("monster-in-the-way");
		if (target !== "direct" && !defender) reject("no-target");
		s.phase = "battle";
		slot.attacked = true;
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

	/** Does the other player have a Set Trap, a ready Quick Effect or a material to detach that may answer what is pending? */
	private canAnswer(): boolean {
		const s = this.state;
		const pending = s.pending;
		if (!pending) return false;
		const who = other(s.turn);
		const mine = s[who];
		const trap = mine.backrow.some((slot) => {
			if (!slot || slot.setThisTurn) return false;
			const card = cardOf(slot.card);
			return card.kind === "trap" && TRAP_ANSWERS[pending.kind].includes(card.effect.type) && (card.effect.type !== "return-to-hand" || mine.monsters.some(Boolean));
		});
		const quick = s[s.turn].monsters.some(Boolean) && mine.monsters.some((slot) => !!slot && monsterOf(slot.card).ability?.quick === true && !this.spent(who, slot.card));
		const detach = pending.kind === "attack" && mine.monsters.some((slot) => !!slot && !!monsterOf(slot.card).detach && (slot.materials?.length ?? 0) > 0);
		const hand = pending.kind === "attack" && mine.hand.some((card) => {
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
		if (monsterOf(slot.card).detach) return this.detach(who, slot);
		const ability = monsterOf(slot.card).ability;
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

	private spring(zone: number, target?: number): void {
		const s = this.state;
		const owner = s.pending ? other(s.turn) : s.turn;
		const mine = s[owner];
		const slot = mine.backrow[zone];
		if (!slot) return reject("nothing-to-answer");
		if (slot.setThisTurn) reject("trap-just-set");
		const pending = s.pending;
		if (!pending) return reject("nothing-to-answer");
		const card = cardOf(slot.card);
		if (card.kind !== "trap" || !TRAP_ANSWERS[pending.kind].includes(card.effect.type)) return reject("cannot-answer-that");
		const saved = card.effect.type === "return-to-hand" && target !== undefined ? (mine.monsters[target] ?? null) : null;
		if (card.effect.type === "return-to-hand" && !saved) reject("no-target");
		mine.backrow[zone] = null;
		this.toGraveyard(owner, slot.card, null);
		this.events.push({ type: "sprung", side: owner, card: slot.card });
		if (pending.kind === "attack") {
			const attacker = this.me.monsters[pending.attacker];
			if (!attacker) return;
			if (card.effect.type === "stop-attack") {
				s.pending = null;
				this.events.push({ type: "attack-stopped", attacker: attacker.card });
				return;
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

	private resolvePending(): void {
		const s = this.state;
		const pending = s.pending;
		s.pending = null;
		if (!pending) return;
		if (pending.kind === "spell") return this.resolveSpell(pending);
		const me = this.me;
		const them = s[other(s.turn)];
		const attacker = me.monsters[pending.attacker];
		if (!attacker) return;
		const atk = atkOf(attacker, s);
		if (pending.target === "direct") {
			if (pending.noDamage) return;
			this.events.push({ type: "direct", side: s.turn, attacker: attacker.card, amount: atk });
			return this.damage(other(s.turn), atk);
		}
		const defender = them.monsters[pending.target];
		if (!defender) return;
		const value = defender.position === "attack" ? atkOf(defender, s) : defOf(defender, s);
		const destroyed: { side: Side; card: CardId }[] = [];
		let damage: { side: Side; amount: number } | null = null;
		if (atk > value) {
			destroyed.push({ side: other(s.turn), card: defender.card });
			if (defender.position === "attack") damage = { side: other(s.turn), amount: atk - value };
		} else if (atk < value) {
			damage = { side: s.turn, amount: value - atk };
			if (defender.position === "attack") destroyed.push({ side: s.turn, card: attacker.card });
		} else if (defender.position === "attack") {
			destroyed.push({ side: s.turn, card: attacker.card }, { side: other(s.turn), card: defender.card });
		}
		/* "You take no battle damage from that battle": the battle still happens, the monsters are still destroyed. */
		if (pending.noDamage && damage?.side === other(s.turn)) damage = null;
		this.events.push({ type: "battle", side: s.turn, attacker: attacker.card, attackerValue: atk, defender: defender.card, defenderValue: value, defenderPosition: defender.position, damage, destroyed });
		/* Damage is calculated first; destroyed monsters go to the Graveyard after, as the last thing of the battle. */
		if (damage) this.damage(damage.side, damage.amount);
		for (const lost of destroyed) this.leave(lost.side, lost.side === s.turn ? pending.attacker : pending.target, "graveyard");
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
		this.toGraveyard(s.turn, pending.card, null);
		const nothing = () => {
			this.events.push({ type: "no-effect", card: pending.card });
		};
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
				if (info.effect.type === "ritual") for (const materials of picks(fodder, 1, MOST_MATERIALS)) ways.push({ ...base, materials });
				if (info.effect.type === "fusion") for (const summon of new Set(who.extra)) for (const materials of picks(fodder, 2, MOST_MATERIALS)) ways.push({ ...base, summon, materials });
				const discards = info.cost?.type === "discard" ? [...new Set(others)] : [];
				candidates.push(...(info.cost?.type === "discard" ? ways.flatMap((move) => discards.map((discard): Move => ({ ...move, discard }))) : ways));
			}
		}
		for (const card of new Set(who.extra)) for (const materials of picks(held, 1, MOST_MATERIALS)) candidates.push({ type: "extra", card, materials });
		if (scalesOf(state, actor(state)) && !state.pendulumUsed) {
			const monsters = who.hand.filter((card) => cardOf(card).kind === "monster");
			for (const cards of picks(monsters, 1, main)) candidates.push({ type: "pendulum", cards });
		}
		for (const zone of held) {
			candidates.push({ type: "ability", zone }, ...monsterZones.map((target): Move => ({ type: "ability", zone, target })));
			candidates.push({ type: "position", zone }, { type: "attack", attacker: zone, target: "direct" }, ...monsterZones.map((target): Move => ({ type: "attack", attacker: zone, target })));
		}
	}
	const seen = new Set<string>();
	return candidates.filter((move) => {
		const key = JSON.stringify(move);
		if (seen.has(key)) return false;
		seen.add(key);
		return apply(state, move).ok;
	});
}
