import { type Action, type Placing, takes } from "./action";
import { act, legalActions } from "./chain";
import { type CardInstance, type DeckSetup, type Duel, type Face, isStill, type Link, type MoveReason, type Phase, type Position, type Side, startDuel, type SummonKind, type TeachingOptions, type Zone } from "./duel";
import type { CardDef, EffectRecord } from "./effects";
import type { StoryEntry, Waiting } from "./events";
import { atk, def, level, type LockLayer, type Modifier, type SummonWay } from "./modifiers";
import { tributesNeeded } from "./procedures";
import { decider } from "./bot/bot";
import { actionName, type NamedAction, pickNamed } from "./bot/names";
import { HIDDEN, type View, viewFor } from "./bot/view";

/**
 * The duel harness (GitHub issue #1, "Duel setup"): a seeded Duel started by `startDuel` (opening hands, normal draws, deck-out) that
 * two players play from their own seats. A seat shows one player's view (`viewFor`) and, when it is their decision, their legal moves
 * named from that view (`actionName`), so a name never shows a card the player cannot see. Every move played is logged once, with the
 * name each seat gives it: the log is shared, each seat reading its own names.
 */

/** What starts a match, as plain data (no card records): the same setup and defs always deal the same Duel. */
export interface MatchSetup {
	readonly seed: number;
	readonly you: DeckSetup;
	readonly rival: DeckSetup;
	readonly first?: Side;
	readonly options?: Partial<TeachingOptions>;
}

/** A move played: when, by whom, the action itself (plain data, for the replay), and the name each seat gives it. */
export interface LogEntry {
	readonly turn: number;
	readonly phase: Phase;
	readonly side: Side;
	readonly action: Action;
	readonly seen: Readonly<Record<Side, string>>;
	/** In order, passes made for players with no legal response during this move. Absent in older records. */
	readonly passes?: readonly Side[];
	/** When each of `passes` was made (turn and phase), in the same order; derived, not kept in the record. */
	readonly passedAt?: readonly { readonly turn: number; readonly phase: Phase }[];
	/** What each seat reads of what the move did (the changes of the Duel, `describeChange`); derived, so not kept in the record. Absent when there is nothing to read. */
	readonly notes?: Readonly<Record<Side, readonly string[]>>;
	/** For an attack: the Life Points before it, which the battle summary reads damage from; derived, not kept in the record. */
	readonly lpBefore?: Readonly<Record<Side, number>>;
}

/**
 * What the players disagree about (a ruling, a move offered or missing), raised by either seat at any point: `at` is how many moves had
 * been logged. It is settled once, with the ruling and its sources (`via`: a Konami page, a YGOProJudge answer, which is a lead only when it
 * cites no Konami source, or the owner's decision). The core goes on as it is; a ruling against it is a rules issue to fix.
 */
export interface Dispute {
	readonly at: number;
	readonly turn: number;
	readonly phase: Phase;
	readonly by: Side;
	readonly claim: string;
	readonly ruling: Ruling | null;
}

/**
 * What a seat reads of a dispute: its own in full (claim and ruling); of the other seat's only a notice, with no claim and no
 * ruling text, so a hidden card named in a claim never reaches the opponent.
 */
export type SeatDispute =
	| Dispute
	| { readonly at: number; readonly turn: number; readonly phase: Phase; readonly by: Side; readonly notice: "the opponent raised a dispute (open)" | "the opponent raised a dispute (settled)" };

export interface Ruling {
	readonly decision: string;
	readonly via: "konami" | "ygoprojudge" | "owner";
	readonly sources: readonly string[];
	/** The YGOProJudge chat, when it was asked. */
	readonly session?: string;
}

export interface Match {
	readonly setup: MatchSetup;
	readonly duel: Duel;
	readonly log: readonly LogEntry[];
	readonly disputes: readonly Dispute[];
}

/** A logged move as one seat reads it. */
export interface SeatLogEntry {
	readonly turn: number;
	readonly phase: Phase;
	readonly side: Side;
	readonly name: string;
	/** What the move did, as this seat reads it (no card it cannot see is named); absent when there is nothing to read. */
	readonly notes?: readonly string[];
	/** Passes made for players with no legal response during this move, in order; absent when there were none. */
	readonly auto?: readonly { readonly side: Side; readonly name: string }[];
}

/** What a seat reads for a pass the Duel made for a player who could only pass. Reveals no card. */
export const AUTO_PASS = "pass (no legal response)";

/**
 * A card as a seat reads it: `ref` says where it is ("rival spell 3": controller, zone, then the slot on the field, the place in the
 * pile elsewhere, 0 first), `code` what it is (`HIDDEN` when the seat cannot see it), then what anyone sees of it. Never the engine's
 * card id: `createDuel` numbers the cards in the order of the Deck lists, before the shuffle, so with the list an id names the card.
 */
export interface SeatCard {
	readonly ref: string;
	readonly code: string;
	readonly face: Face;
	/** On the field: its zone (from its controller's left; the Extra Monster Zones are 5 and 6, as `CardInstance.slot`). */
	readonly slot?: number;
	/** In the Monster Zone: its battle position, and, face-up and seen, its ATK and DEF as they are now. */
	readonly position?: Position;
	readonly atk?: number;
	/** Absent for a Link Monster: it has no DEF. */
	readonly def?: number;
	/** A face-up monster seen, from its printed facts: its Level now (Level monsters), its Rank (Xyz), its Link Rating (Link), its Attribute and its Type. */
	readonly level?: number;
	readonly rank?: number;
	readonly link?: number;
	readonly attribute?: string;
	readonly monsterType?: string;
	/** Lasting modifiers on this monster, with their source and how long they last ("ATK +500 (card), until the end of turn 3"). */
	readonly modifiers?: readonly string[];
	/** The card it equips, or the Xyz Monster it is attached to as material (their `ref`). */
	readonly equippedTo?: string;
	readonly attachedTo?: string;
}

/** One player's side as a seat reads it. The Deck is only counted. */
export interface SeatPlayer {
	readonly lp: number;
	readonly hand: readonly SeatCard[];
	readonly deck: number;
	readonly extra: readonly SeatCard[];
	readonly monsters: readonly SeatCard[];
	readonly spells: readonly SeatCard[];
	readonly field: readonly SeatCard[];
	readonly graveyard: readonly SeatCard[];
	readonly banished: readonly SeatCard[];
	readonly materials: readonly SeatCard[];
}

/** A chain link as a seat reads it: who activated it, the card (activated, so shown), its targets by their `ref` now and the code of each (`HIDDEN` when the seat cannot see it). */
export interface SeatLink {
	readonly player: Side;
	readonly ref: string;
	readonly code: string;
	readonly effect: number;
	readonly targets: readonly string[];
	readonly targetCodes: readonly string[];
}

/**
 * What a seat shows of the board: plain data read from the masked Duel of `viewFor`, through an allow-list. Not the Duel itself: no card
 * id (`SeatCard.ref` instead), no card snapshot carried by events, no RNG, no pools the hidden cards are dealt from (`View.unknown`), and
 * only the waiting Trigger Effects of cards the seat can see.
 */
export interface SeatView {
	readonly side: Side;
	readonly turn: { readonly player: Side; readonly number: number; readonly phase: Phase };
	readonly winner: Side | "draw" | null;
	readonly players: Readonly<Record<Side, SeatPlayer>>;
	readonly chain: readonly SeatLink[];
	readonly waiting: readonly { readonly ref: string; readonly code: string; readonly effect: number }[];
	/** Lasting effects in force (locks, negations, modifiers a resolved effect left), said from this seat; their source is named only if the seat sees it. */
	readonly lasting: readonly string[];
	/** The Summon being attempted: who, and the monsters (shown to both players while it is). */
	readonly summoning: { readonly player: Side; readonly cards: readonly string[] } | null;
	/** The attack in progress: the attacker, its target (`null`: a direct attack) and its step. */
	readonly battle: { readonly attacker: string; readonly target: string | null; readonly step: string } | null;
}

/** One player's seat: what they see, whether it is their decision, the names of their legal moves (none when it is not), and the log as they read it. */
export interface Seat {
	readonly side: Side;
	readonly view: SeatView;
	readonly toAct: boolean;
	readonly moves: readonly string[];
	/** What each move does, in the order of `moves` (a label never carries it): empty when it is not this seat's decision. */
	readonly details: readonly string[];
	readonly log: readonly SeatLogEntry[];
	/** This seat's own disputes whole, the other seat's as a notice only (`SeatDispute`). */
	readonly disputes: readonly SeatDispute[];
}

export function openMatch(setup: MatchSetup, defs: Readonly<Record<string, CardDef>>): Match {
	return { setup, duel: startDuel({ ...setup, defs }), log: [], disputes: [] };
}

/**
 * The view's Duel with each hidden card that a move may name told apart by where it is, as both players see it: a face-down card on
 * the field by its zone, "?(rival spell 3)" (controller, zone, slot from the controller's left); a face-down banished card by its place
 * among the banished cards, "?(rival banished 0)" (the first banished is 0). Two such cards are two different moves, so they get two
 * names. Other hidden cards stay "?" (`playMove` refuses a name that then stands for several moves).
 */
function located(seen: Duel): Duel {
	const cards = { ...seen.cards };
	for (const card of Object.values(seen.cards)) {
		if (card.code !== HIDDEN) continue;
		if (card.zone === "monster" || card.zone === "spell" || card.zone === "field") cards[card.id] = { ...card, code: `${HIDDEN}(${card.controller} ${card.zone} ${card.slot})` };
		else if (card.zone === "banished") cards[card.id] = { ...card, code: `${HIDDEN}(${card.controller} banished ${seen.piles[card.controller].banished.indexOf(card.id)})` };
	}
	return { ...seen, cards };
}

/**
 * The name `side` gives a move once it is played: a card is named if the seat sees it before the move or right after it (a card Summoned
 * or activated from the hand is shown; a card Set stays hidden).
 */
function nameAfter(before: Duel, after: Duel, side: Side, action: Action): string {
	const seen = viewFor(before, side).duel;
	const then = viewFor(after, side).duel;
	const cards = { ...seen.cards };
	for (const [id, card] of Object.entries(seen.cards)) if (card.code === HIDDEN && then.cards[Number(id)]?.code !== HIDDEN) cards[Number(id)] = before.cards[Number(id)]!;
	return actionName(located({ ...seen, cards }), action);
}

/** The legal moves of `side` with the names that seat gives them, in the order of `legalActions`; the view is read once. */
function namedMoves(duel: Duel, side: Side): NamedAction[] {
	const seen = located(viewFor(duel, side).duel);
	return legalActions(duel).map((action) => ({ name: actionName(seen, action), action }));
}

/* ------------------------------------------------------------------------------------------------------------------------------ *
 * Move details: what a move does, said beside its label. The label (`moves`) is the move's name and never changes (`--expect` and
 * `replayMatch` read it); the detail is read from the Duel and the log of the match, from the acting seat's point of view, and names a
 * card only if that seat sees it.
 * ------------------------------------------------------------------------------------------------------------------------------ */

const PILE_NAME: Readonly<Record<Zone, string>> = { deck: "Deck", hand: "hand", extra: "Extra Deck", monster: "Monster Zone", spell: "Spell & Trap Zone", field: "Field Zone", graveyard: "Graveyard", banished: "banished cards", material: "Xyz materials" };
const SUMMON_NAME: Readonly<Record<SummonKind, string>> = { tribute: "Tribute Summon", fusion: "Fusion Summon", synchro: "Synchro Summon", xyz: "Xyz Summon", link: "Link Summon", ritual: "Ritual Summon", pendulum: "Pendulum Summon" };
const HAND_LIMIT = 6;

/** The zone of the field by its kind: "Main Monster Zone 2", "Extra Monster Zone 5 (shared)", "Spell & Trap Zone 0", "Field Zone". */
function fieldZoneName(zone: "monster" | "spell" | "field", slot: number): string {
	if (zone === "field") return "Field Zone";
	if (zone === "spell") return `Spell & Trap Zone ${slot}`;
	return slot >= 5 ? `Extra Monster Zone ${slot} (shared)` : `Main Monster Zone ${slot}`;
}

/** What a seat can say about a card: its code when the seat sees it (before or after), else "a card". */
function namer(before: Duel, after: Duel | null, side: Side): (id: number) => string {
	const seenBefore = viewFor(before, side).duel;
	const seenAfter = after && viewFor(after, side).duel;
	return (id) => {
		const code = seenBefore.cards[id]?.code;
		if (code !== undefined && code !== HIDDEN) return code;
		const later = seenAfter?.cards[id]?.code;
		return later !== undefined && later !== HIDDEN ? later : "a card";
	};
}

/** Where a card is, said by `side`: "your Extra Deck (no. 3)", "the opponent's Main Monster Zone 1", "your hand (no. 1)". */
function placeName(duel: Duel, side: Side, id: number): string {
	const card = duel.cards[id]!;
	const owner = card.controller === side ? "your" : "the opponent's";
	if (card.zone === "monster" || card.zone === "spell" || card.zone === "field") return `${owner} ${fieldZoneName(card.zone, card.slot ?? 0)}`;
	return `${owner} ${PILE_NAME[card.zone]} (no. ${duel.piles[card.controller][card.zone].indexOf(id) + 1})`;
}

/** The kind of an effect: a Normal Spell, a Quick-Play Spell, a Trap, a Quick Effect... */
function effectKind(def: CardDef, effect: EffectRecord): string {
	switch (effect.type) {
		case "activation":
			if (def.kind === "quick-play") return "Quick-Play Spell";
			if (def.kind === "counter-trap") return "Counter Trap";
			if (def.kind === "trap") return effect.stays ? "Continuous Trap" : "Trap";
			if (def.kind === "monster") return "Pendulum Effect";
			return effect.stays ? "Continuous Spell" : def.facts?.icon === "field" ? "Field Spell" : def.facts?.icon === "equip" ? "Equip Spell" : "Normal Spell";
		case "ignition":
			return "Ignition Effect";
		case "quick":
			return "Quick Effect";
		case "trigger":
			return effect.mandatory ? "mandatory Trigger Effect" : "optional Trigger Effect";
		default:
			return "continuous effect";
	}
}

/** How often an effect may be used, as its record says it. */
function onceText(effect: EffectRecord): string | null {
	if (!effect.once) return null;
	const times = effect.once.times && effect.once.times > 1 ? `${effect.once.times} times ` : "";
	switch (effect.once.scope) {
		case "instance":
			return `${times}once per turn (this card)`;
		case "name":
			return `${times}once per turn (by card name)`;
		case "activation":
			return `${times}one activation per turn (by card name)`;
		case "duel":
			return "once per Duel";
		default:
			return "once per Chain";
	}
}

/** An effect whose record has no category (duel 006 #8): what that means for the player, the categories being what responses read. */
const NO_CATEGORY = "no effect category (a card that answers one, as Ash Blossom answers a search, cannot answer this effect)";
/** A cost the log cannot read (its payment failed on the copy, or threw). */
const UNREADABLE_COST = "cost (what it does cannot be read before it is paid)";

/** Costs have no declarative kind (`CostSpec` is executable code). As the legality check does, pay on an immutable copy, then
 * describe only observable moves/reveals. Do not infer a discard from a card merely leaving the hand, or a reveal from no movement. */
function describeCost(duel: Duel, side: Side, card: CardInstance, effect: EffectRecord, picked: readonly number[], name: (id: number) => string): string {
	const cost = effect.cost;
	if (!cost) return "";
	try {
		const ctx = { player: side, card };
		const after = typeof cost === "function" ? cost(duel, ctx) : cost.pay(duel, ctx, picked);
		if (!after) return UNREADABLE_COST;
		const parts: string[] = [];
		for (const was of Object.values(duel.cards)) {
			const now = after.cards[was.id]!;
			const event = [...after.live].reverse().find((each) => each.type === "moved" && each.after.id === now.id && each.after.moves === now.moves);
			const reason = event?.type === "moved" ? event.reason : undefined;
			let verb: string | null = null;
			if (now.moves !== was.moves && (now.zone !== was.zone || now.zone === "deck")) {
				verb = reason === "discarded" ? "discarded" : reason === "tributed" ? "Tributed" : now.zone === "graveyard" ? "sent to the Graveyard" : now.zone === "banished" ? "banished" : now.zone === "deck" ? "shuffled into the Deck" : null;
			} else if (after.revealed.some((entry) => entry.id === now.id && entry.moves === now.moves) && !duel.revealed.some((entry) => entry.id === now.id && entry.moves === now.moves)) {
				verb = `revealed${now.zone === "hand" ? " (it stays in the hand)" : ""}`;
			}
			if (verb) parts.push(`${name(now.id)} is ${verb}`);
		}
		const lp = duel.lp[side] - after.lp[side];
		if (lp > 0) parts.push(`pay ${lp} LP`);
		if (parts.length) return `cost: ${parts.join(", ")}`;
		// Nothing changed at all: the free way of a cost (Drillbeam's "without revealing a card"). Something changed the words above miss: unreadable.
		const untouched = after.lp.you === duel.lp.you && after.lp.rival === duel.lp.rival && after.revealed.length === duel.revealed.length && Object.values(duel.cards).every((was) => {
			const now = after.cards[was.id]!;
			return now.moves === was.moves && now.zone === was.zone && now.face === was.face && now.position === was.position;
		});
		return untouched ? "cost: nothing is paid this way (no card moved or revealed, no LP paid)" : UNREADABLE_COST;
	} catch {
		return UNREADABLE_COST;
	}
}

/** A cost paid with cards chosen one at a time: what it would do to the first candidates, as the example of what each chosen card suffers. */
function chosenNextCost(duel: Duel, side: Side, card: CardInstance, effect: EffectRecord, count: number, name: (id: number) => string): string {
	const spec = effect.cost;
	let sample: number[] = [];
	try {
		sample = spec && typeof spec !== "function" && spec.choose ? spec.choose.from(duel, { player: side, card }).slice(0, count) : [];
	} catch {
		sample = [];
	}
	const said = sample.length > 0 && spec && typeof spec !== "function" ? describeCost(duel, side, card, effect, sample, name) : "";
	return said.startsWith("cost: ") ? `cost (each card chosen next), for example ${said.slice(6)}` : "cost (cards chosen next, what is done to them is not readable)";
}

/**
 * What an activation is, said from the records the core has: the effect's number, its kind, where the card is, what the effect does by
 * its categories, its limit, its mode, its declaration and its targets. `CardDef` carries no printed text, so the text is not here.
 */
function describeActivation(duel: Duel, side: Side, action: Extract<Action, { type: "activate" }>, name: (id: number) => string): string {
	const card = duel.cards[action.card]!;
	const def = duel.defs[card.code];
	const effect = def?.effects?.[action.effect];
	if (!def || !effect) return `activate ${name(action.card)}`;
	// On the field, the zone too: two copies of one card face-up give the same move label, and the zone tells them apart (duel 006 #7).
	const origin = card.zone === "monster" || card.zone === "spell" || card.zone === "field" ? `the field (${placeName(duel, side, action.card)})` : `the ${PILE_NAME[card.zone]}`;
	const mode = action.mode === undefined ? undefined : effect.modes?.[action.mode];
	const wanted = mode?.categories ?? effect.categories;
	let categories: readonly string[] = [];
	try {
		categories = typeof wanted === "function" ? wanted(duel, { player: side, card }, action.targets) : wanted ?? [];
	} catch {
		categories = [];
	}
	const limit = onceText(effect);
	const parts = [
		`effect ${action.effect + 1} of ${def.effects!.length}: ${effectKind(def, effect)} from ${origin}`,
		...(effect.modes && action.mode !== undefined ? [`option ${action.mode + 1} of ${effect.modes.length}`] : []),
		categories.length > 0 ? `does: ${categories.join(", ")}` : NO_CATEGORY,
		...(limit ? [limit] : []),
		...(action.declared ? [`declares ${action.declared.value}`] : []),
		...(action.targets.length > 0 ? [`targets ${action.targets.map((id) => `${name(id)} (${placeName(duel, side, id)})`).join(", ")}`] : []),
		...(action.pay !== undefined ? [`pays with ${action.pay} card${action.pay === 1 ? "" : "s"} chosen next`] : []),
		...((action.paid ?? []).length > 0 ? [`pays with ${action.paid!.map(name).join(", ")}`] : []),
		...(effect.cost ? [action.pay !== undefined ? chosenNextCost(duel, side, card, effect, action.pay, name) : describeCost(duel, side, card, effect, action.paid ?? [], name)] : []),
	];
	return parts.join("; ");
}

/**
 * The move that began the question the seat is asked (a choice, a zone, a declaration), read back from the log: the first logged move
 * before the answers given so far. `null` when the question did not follow a move (a rule of the game asked it).
 */
function askOrigin(match: Match): LogEntry | null {
	let at = match.log.length - 1;
	const answer = (entry: LogEntry | undefined) => entry !== undefined && (entry.action.type === "choose" || entry.action.type === "place" || entry.action.type === "declare");
	while (at >= 0) {
		if (answer(match.log[at])) at--;
		else if (match.log[at]!.action.type === "pass" && answer(match.log[at - 1])) at--;
		else break;
	}
	return at >= 0 ? match.log[at]! : null;
}

/** What the question the seat is asked is for. */
function askingPurpose(match: Match, name: (id: number) => string): string {
	const { duel } = match;
	const asking = duel.asking!;
	if (asking.links.length > 0 && duel.chain.length > 0) {
		const link = duel.chain.at(-1)!;
		return `for the effect of ${name(link.card.id)} (chain link ${duel.chain.length}) that is resolving`;
	}
	const action = askOrigin(match)?.action;
	const named = action && "card" in action ? name(action.card) : "a card";
	if (action?.type === "summon" || action?.type === "set") {
		const card = duel.cards[action.card]!;
		const def = duel.defs[card.code];
		if (card.zone === "extra" && def?.procedure) return `materials for the ${SUMMON_NAME[def.procedure.kind]} of ${named}`;
		const needed = tributesNeeded(def?.facts?.level ?? 0);
		return `Tributes for the ${action.type === "set" ? "Tribute Set" : "Tribute Summon"} of ${named} (${needed} Tribute${needed === 1 ? "" : "s"} in all)`;
	}
	if (action?.type === "activate") return action.pay !== undefined ? `to pay the cost of ${named} (${action.pay} card${action.pay === 1 ? "" : "s"} in all)` : `for ${named}`;
	if (action?.type === "apply") return `for the delayed effect of ${named}`;
	if (action?.type === "pendulum-summon") return "for the Pendulum Summon";
	if (duel.turn.phase === "end" && duel.piles[asking.player].hand.length > HAND_LIMIT) return `to discard down to ${HAND_LIMIT} cards (hand limit)`;
	return "asked by a rule of the game or an effect (no logged move led here)";
}

/** What a `place` does, by playing it on a copy of the Duel: the zone's kind, the card that goes there and how. */
function describePlace(duel: Duel, side: Side, zone: number, positions: readonly Position[] | undefined): string {
	let after: Duel | null = null;
	try {
		// Every window shown: the dry-run stops at the first one. The passes `act` would make for a player with no legal response, and so
		// how far the copy goes, depend on cards the seat may not see (whether the opponent holds a response).
		after = act({ ...duel, options: { ...duel.options, everyWindow: true } }, { type: "place", zone, ...(positions ? { positions } : {}) });
	} catch {
		after = null;
	}
	// A preview may inspect the resulting placement, but must not learn identities revealed only by that hypothetical move.
	const say = namer(duel, null, side);
	const options = positions && positions.length > 1 ? ` (position: ${positions.join(" or ")})` : "";
	if (after) {
		for (const card of Object.values(after.cards)) {
			const was = duel.cards[card.id]!;
			if ((card.zone === was.zone && card.controller === was.controller) || card.slot !== zone || (card.zone !== "monster" && card.zone !== "spell" && card.zone !== "field")) continue;
			// A monster that stays in the Monster Zone but changes hands (a control change taking its zone, or giving it back).
			if (card.zone === was.zone) return `${fieldZoneName(card.zone, zone)}: control of ${say(card.id)} changes to ${card.controller === side ? "you" : "the opponent"}${options}`;
			const how = card.zone === "monster" ? (card.face === "down" ? "Set" : card.summonedBy ? SUMMON_NAME[card.summonedBy] : card.specialSummoned ? "Special Summon" : "Normal Summon") : null;
			return `${fieldZoneName(card.zone, zone)}: ${how ? `${how} of ${say(card.id)}` : `${say(card.id)} is placed here`}${options}`;
		}
		const summoning = after.summoning;
		const at = summoning?.slots?.indexOf(zone) ?? -1;
		if (summoning && at >= 0) return `${fieldZoneName("monster", zone)}: ${summoning.kind ? SUMMON_NAME[summoning.kind] : summoning.how === "special" ? "Special Summon" : "Normal Summon"} of ${say(summoning.cards[at]!)}${options}`;
	}
	// The kind of zone (Main Monster or Spell & Trap) is not in the question, so only an Extra Monster Zone (5, 6) is named by its kind.
	return `${zone >= 5 ? fieldZoneName("monster", zone) : `zone ${zone}`}${options}`;
}

/** A "you can" question (`askMay`), as its accept and decline moves say it: the card offered is the effect's own card, not a pick. */
function optionalPart(match: Match, name: (id: number) => string): string {
	const purpose = askingPurpose(match, name);
	return `the optional part ("you can") ${purpose.startsWith("for ") ? `of ${purpose.slice(4)}` : `asked ${purpose}`}`;
}

/** What `pass` does here, from the priority state alone (the Window line of the board says more). */
function describePass(match: Match, name: (id: number) => string): string {
	const { duel } = match;
	if (duel.asking?.may) return `pass: decline ${optionalPart(match, name)}`;
	if (duel.asking) return `pass: these are all the cards chosen (${askingPurpose(match, name)})`;
	if (duel.building) return "pass: decline the optional Trigger Effects that are left";
	if (duel.chain.length > 0) return "pass: do not respond, the chain resolves";
	if (duel.summoning) return "pass: do not respond, the Summon succeeds";
	if (duel.battle) return "pass: do not respond, the attack goes on to its next step";
	return "pass priority: with the opponent's pass too, the game moves on (next step or phase)";
}

/** The detail of one legal move of `side`, said from that seat. */
function describeMove(match: Match, side: Side, action: Action, name: (id: number) => string, mayPass = false): string {
	const { duel } = match;
	switch (action.type) {
		case "pass":
			return describePass(match, name);
		case "place":
			return describePlace(duel, side, action.zone, action.positions);
		case "choose":
			if (duel.asking?.may) return `accept ${optionalPart(match, name)}; pass declines it`;
			return `choose ${name(action.card)} from ${placeName(duel, side, action.card)}: ${askingPurpose(match, name)}${mayPass ? "; optional choice: pass to decline or stop choosing" : ""}`;
		case "declare":
			return `declare ${action.declaration.kind} ${action.declaration.value}: ${askingPurpose(match, name)}`;
		case "activate":
			return describeActivation(duel, side, action, name);
		case "summon": {
			const card = duel.cards[action.card]!;
			const def = duel.defs[card.code];
			const who = name(action.card);
			if (card.zone === "extra" && def?.procedure) return `${SUMMON_NAME[def.procedure.kind]} of ${who} from the Extra Deck${action.way ? `, by ${action.way}` : ""}: you then choose the materials and the zone`;
			if (action.how === "special") return `Special Summon ${who} from ${placeName(duel, side, action.card)} (its own rule), then choose its zone`;
			const needed = tributesNeeded(def?.facts?.level ?? 0);
			if (needed > 0) return `Tribute Summon of ${who} (Level ${def?.facts?.level}): needs ${needed} Tribute${needed === 1 ? "" : "s"}, face-up Attack Position${action.extra ? "; an additional Normal Summon" : ""}`;
			return `Normal Summon ${who} face-up in Attack Position${action.extra ? " (an additional Normal Summon)" : ""}`;
		}
		case "set": {
			const def = duel.defs[duel.cards[action.card]!.code];
			const who = name(action.card);
			if (def?.kind === "monster") {
				const needed = tributesNeeded(def.facts?.level ?? 0);
				return `Set ${who} face-down in Defense Position${needed > 0 ? ` (a Tribute Set: needs ${needed} Tribute${needed === 1 ? "" : "s"})` : ""}`;
			}
			return def?.facts?.icon === "field" ? `Set ${who} face-down in the Field Zone` : `Set ${who} face-down in a Spell & Trap Zone`;
		}
		case "flip-summon":
			return `Flip Summon ${name(action.card)}: it turns face-up in Attack Position`;
		case "change-position":
			return `change ${name(action.card)} to ${duel.cards[action.card]!.position === "attack" ? "Defense" : "Attack"} Position (once per turn)`;
		case "pendulum-summon":
			return "Pendulum Summon (once per turn): you then choose the monsters, one at a time, each with its zone";
		case "attack": {
			const power = atk(duel, action.card);
			if (action.target === null) return `${name(action.card)} (ATK ${power}) attacks directly: the opponent takes ${power} damage if nothing stops it`;
			const target = duel.cards[action.target]!;
			return `${name(action.card)} (ATK ${power}) attacks ${name(action.target)} (${placeName(duel, side, action.target)}${target.face === "up" ? `, ${target.position === "attack" ? `ATK ${atk(duel, action.target)}` : `DEF ${def(duel, action.target)}`}` : ", face-down"})`;
		}
		case "apply": {
			const delayed = duel.delayed.find((each) => each.stamp === action.delayed);
			if (!delayed) return `apply what is owed for ${name(action.card)} (control given back)`;
			return `apply the delayed effect of ${name(delayed.source.id)} (effect ${delayed.effect + 1}), due in the ${delayed.due.phase} phase of turn ${delayed.due.turn}, ${delayed.mandatory ? "mandatory" : "optional"}${delayed.card ? `, about ${name(delayed.card.id)}` : ""}`;
		}
	}
}

/** The details of the moves of `side`, in the order of `legalActions` (the order of `moves`). */
function detailsOf(match: Match, side: Side, actions: readonly Action[]): string[] {
	const name = namer(match.duel, null, side);
	const mayPass = match.duel.asking !== null && actions.some((action) => action.type === "pass");
	return actions.map((action) => describeMove(match, side, action, name, mayPass));
}

/* ------------------------------------------------------------------------------------------------------------------------------ *
 * Log notes: what a move did, read by comparing the Duel before and after each step of it (the action, then each pass the Duel made
 * for a player with no legal response). The engine keeps no history, only the cards' states, so the notes come from those: where a card
 * was and is, who gained or lost Life Points, what the chain held. Each seat reads its own notes: a card is named only if the seat sees it
 * before the step or after it (a face-down card that lies in the Graveyard is seen), and a card a player draws is only counted for the
 * other player.
 * ------------------------------------------------------------------------------------------------------------------------------ */

const SUMMONED: Readonly<Record<SummonKind, string>> = { tribute: "Tribute Summoned", fusion: "Fusion Summoned", synchro: "Synchro Summoned", xyz: "Xyz Summoned", link: "Link Summoned", ritual: "Ritual Summoned", pendulum: "Pendulum Summoned" };

/** What `describeChange` may be told about the step: the move that began it, and the Life Points when the battle in progress began. */
export interface ChangeContext {
	readonly action?: Action;
	readonly battleStart?: Readonly<Record<Side, number>> | null;
}

/** Where a card is, said by `seat`: a pile with its owner, a zone of the field with its kind (the Extra Monster Zones are shared). */
function whereIs(card: CardInstance, seat: Side): string {
	const owner = card.controller === seat ? "your" : "the opponent's";
	if (card.zone === "monster" || card.zone === "spell" || card.zone === "field") {
		const zone = fieldZoneName(card.zone, card.slot ?? 0);
		return card.zone === "monster" && (card.slot ?? 0) >= 5 ? zone : `${owner} ${zone}`;
	}
	return `${owner} ${PILE_NAME[card.zone]}`;
}

const SUMMON_WAY_NAME: Readonly<Record<SummonWay, string>> = { normal: "Normal Summon", flip: "Flip Summon", special: "Special Summon" };
const CONDITIONAL_LOCK = "conditional lock, see the numbered moves, they list what the engine allows";

/**
 * What a lock stops, said by `seat`, with its limit: the `ways` of a Summon, the activations or monsters a filter (`only`, `stops`) picks.
 * A filter is code, not data, so a lock with one and no `describe` says only that it is conditional and points to the numbered moves
 * (which list what the engine allows); `describe` (what the lock stops, said after the verb) is used when the card gives one.
 */
function describeLock(layer: LockLayer, seat: Side, who: (side: Side | "both") => string): string {
	const filtered = layer.only !== undefined || layer.stops !== undefined;
	const limit = (stem: string, noun: string) => (layer.describe !== undefined ? `${stem} ${layer.describe}` : filtered ? `${stem} some ${noun}: ${CONDITIONAL_LOCK}` : `${stem} ${noun}`);
	const player = who(layer.who);
	switch (layer.what) {
		case "summon":
			return `${player} cannot ${limit(layer.ways?.map((way) => SUMMON_WAY_NAME[way]).join(" or ") ?? "Summon", "monsters")}`;
		case "activate":
			return `${player} cannot ${limit("activate", "cards or effects")}`;
		case "draw":
			return `${player} cannot ${limit("draw", "cards by card effects")}`;
		case "add-to-hand":
			return `${player} cannot ${limit("add", "cards from the Deck to the hand")}`;
		case "banish-from-graveyard":
			if (layer.banisher === "opponent" && layer.who !== "both") return layer.who === seat ? `the opponent cannot ${limit("banish", "cards from your Graveyard")}` : `you cannot ${limit("banish", "cards from the opponent's Graveyard")}`;
			return `${player} cannot ${limit("banish", "cards from the Graveyard")}`;
		case "attack":
		case "attack-directly": {
			const stem = layer.what === "attack" ? "attack" : "attack directly";
			return `${player} cannot ${layer.describe !== undefined ? `${stem} ${layer.describe}` : filtered ? `${stem} with some monsters: ${CONDITIONAL_LOCK}` : stem}`;
		}
		case "summon-together":
			return `${player} cannot Special Summon 2 or more monsters at the same time`;
		case "attack-target":
			return `${player} cannot choose ${layer.describe ?? `some monsters${filtered ? `: ${CONDITIONAL_LOCK}` : ""}`} as attack targets`;
	}
}

/** A modifier that is still in force, said by `seat`; `null` when there is nothing to say of its kind. */
function describeLasting(duel: Duel, modifier: Modifier, seat: Side, name: (id: number) => string, showTarget = true): string {
	const layer = modifier.layer;
	const who = (side: Side | "both") => (side === "both" ? "both players" : side === seat ? "you" : "the opponent");
	const target = typeof modifier.affects === "function" ? null : duel.cards[modifier.affects.card];
	const on = target && showTarget ? ` on ${name(target.id)}` : "";
	let what: string;
	switch (layer.kind) {
		case "add": {
			let amount: number | null = null;
			try {
				amount = typeof layer.by === "number" ? layer.by : target ? layer.by(duel, modifier.by?.card ?? null, target) : null;
			} catch {
				amount = null;
			}
			what = `${layer.stat.toUpperCase()} ${amount === null ? "changed" : amount >= 0 ? `+${amount}` : `${amount}`}${on}`;
			break;
		}
		case "set":
			what = `${layer.stat.toUpperCase()} becomes ${typeof layer.to === "number" ? layer.to : "a new value"}${on}`;
			break;
		case "base":
			what = `original ${layer.stat.toUpperCase()} changed${on}`;
			break;
		case "negate":
			what = target && showTarget ? `the effects of ${name(target.id)} are negated` : target ? "effects negated" : "card effects are negated";
			break;
		case "lock":
			what = `${describeLock(layer, seat, who)}${modifier.about ? `: ${name(modifier.about.card)}` : ""}`;
			break;
		case "protect":
			what = `protected${on} against ${(typeof layer.against === "string" ? [layer.against] : layer.against).join(", ")}`;
			break;
		case "permit":
			what = `${who(layer.who)} may make an additional Normal Summon`;
			break;
		case "damage":
			what = `${who(layer.who)} takes half damage`;
			break;
		case "redirect":
			what = "cards sent to the Graveyard are banished instead";
			break;
		case "attack":
			what = `attack permission (${layer.allows.what})${on}`;
			break;
		case "control":
			what = `control${on} goes back to ${who(layer.to)} when this ends`;
			break;
		default:
			what = `banished instead if it leaves the field${on}`;
	}
	const source = modifier.by ? ` (${name(modifier.by.card.id)})` : "";
	const until = modifier.until === Number.POSITIVE_INFINITY ? "for the rest of the Duel" : `until the end of turn ${modifier.until}`;
	return `${what}${source}, ${until}`;
}

/** A card as the masked Duel of a seat names it: its code, or "a card" when the seat cannot see it. */
const maskedName = (duel: Duel) => (id: number): string => {
	const code = duel.cards[id]?.code;
	return code === undefined || code === HIDDEN ? "a card" : code;
};

/**
 * The lasting effects in force, said by `seat` from its masked Duel (a lock a resolved effect left, a negation, an ATK boost): both
 * players' effects, each with the card it comes from if the seat sees it. The continuous effects of cards on the field are not
 * in the Duel's list of modifiers (the core reads them from the board when asked), so they are not here.
 */
function lastingEffects(duel: Duel, seat: Side): string[] {
	const name = maskedName(duel);
	const who = (side: Side) => (side === seat ? "you" : "the opponent");
	return [
		// A modifier about one card as it was (`moves` frozen) reaches nothing once that card has moved (a new card): not listed.
		...duel.modifiers.filter((modifier) => modifier.equip === undefined && stillAbout(duel, modifier)).map((modifier) => describeLasting(duel, modifier, seat, name)),
		// A watch ("each time ..., until the end of this turn": a Mulcharmy) and a delayed effect hold code, not data: only their card, owner and time are said.
		...duel.watches.map((each) => `${name(each.source.id)} effect ${each.effect + 1}: lasting effect of ${who(each.player)}, applied each time its condition happens, until the end of turn ${each.until}`),
		// The core keeps a delayed effect about a card to the end of its phase, but once that card has moved nothing is offered or owed (`dueNow`): not listed.
		...duel.delayed.filter((each) => !each.card || isStill(duel, each.card)).map((each) => `${name(each.source.id)} effect ${each.effect + 1}: ${who(each.player)} will apply a ${each.mandatory ? "mandatory" : "optional"} delayed effect in the ${each.due.phase} phase of turn ${each.due.turn}`),
	];
}

/** Is the card a modifier is about (`affects` naming one card, or `about`) still that card? */
function stillAbout(duel: Duel, modifier: Modifier): boolean {
	const ref = typeof modifier.affects === "function" ? modifier.about : modifier.affects;
	return ref === undefined || duel.cards[ref.card]?.moves === ref.moves;
}

/** The lasting modifiers of ATK, DEF and Level, negation and protection on a monster, said by `seat`: "ATK +500 (card), until the end of turn 3". */
function monsterModifiers(duel: Duel, id: number, seat: Side): string[] {
	const name = maskedName(duel);
	const card = duel.cards[id]!;
	const lines: string[] = [];
	for (const modifier of duel.modifiers) {
		if (modifier.equip !== undefined) continue;
		const reaches = typeof modifier.affects === "function" ? safely(() => modifier.affects instanceof Function && modifier.affects(duel, card, null)) : modifier.affects.card === card.id && modifier.affects.moves === card.moves;
		if (!reaches || modifier.layer.kind === "control" || modifier.layer.kind === "lock" || modifier.layer.kind === "damage" || modifier.layer.kind === "redirect" || modifier.layer.kind === "permit") continue;
		lines.push(describeLasting(duel, { ...modifier, affects: { card: id, moves: card.moves } }, seat, name, false));
	}
	return lines;
}

const safely = (read: () => boolean): boolean => {
	try {
		return read();
	} catch {
		return false;
	}
};

/** The entries of `after.story` that `before` has not: what happened from one to the other (`Duel.story`). */
function storyBetween(before: Duel, after: Duel): readonly StoryEntry[] {
	const old = before.story;
	const now = after.story;
	if (now === old) return [];
	const shares = old.length > 0 && now.length >= old.length && old.every((entry, at) => now[at] === entry);
	return shares ? now.slice(old.length) : now;
}

const NEGATED_LINK: Readonly<Record<"activation" | "effect" | "card", string>> = { activation: " (its activation was negated)", effect: " (its effect was negated)", card: " (its card's effects are negated)" };

/**
 * What one change of the Duel (a move, or one pass made for a player with no legal response) did, as `seat` reads it. When the core
 * told what happened (`Duel.story`), in that order: each chain link as it resolves, then what it did (cards that moved, one hop at a
 * time, Life Points, lasting effects), the next link after; a link that did nothing a seat can read says so. Then, read from the two
 * states: flips and battle positions, moves the story does not tell (a Duel changed by hand, a card placed by a rule), negations, the
 * end of a battle, the end of the Duel, new chain links. Only what the Duel records: no card is named that the seat does not see.
 */
export function describeChange(before: Duel, after: Duel, seat: Side, context: ChangeContext = {}): string[] {
	const who = (side: Side) => (side === seat ? "you" : "the opponent");
	let names: ((id: number) => string) | null = null;
	const name = (id: number) => (names ??= namer(before, after, seat))(id);
	const lines: string[] = [];
	const sameLink = (x: Link, y: Link) => x.card.id === y.card.id && x.card.moves === y.card.moves && x.effect === y.effect && x.player === y.player;
	const story = storyBetween(before, after);
	const negatedByNote = (link: Link) => after.activations.some((made) => made.negated && made.card.id === link.card.id && made.card.moves === link.card.moves && made.effect === link.effect);

	// The chain: the links added are said at the end; with no story (a Duel changed by hand), the links that resolved, the top one first.
	let shared = 0;
	while (shared < before.chain.length && shared < after.chain.length && sameLink(before.chain[shared]!, after.chain[shared]!)) shared++;
	if (story.length === 0) {
		for (let at = before.chain.length - 1; at >= shared; at--) {
			const link = before.chain[at]!;
			lines.push(`chain link ${at + 1} resolves: ${link.card.code}${negatedByNote(link) ? NEGATED_LINK.activation : ""}`);
		}
	}

	// Cards that moved, from the cards' own states.
	const moved: { readonly was: CardInstance; readonly now: CardInstance }[] = [];
	if (before.cards !== after.cards) {
		for (const key of Object.keys(after.cards)) {
			const now = after.cards[Number(key)]!;
			const was = before.cards[Number(key)];
			if (!was || was === now) continue;
			if (was.zone !== now.zone || was.controller !== now.controller) moved.push({ was, now });
			else if (now.zone === "monster" && was.face === "down" && now.face === "up") lines.push(`${name(now.id)} is flipped face-up in ${whereIs(now, seat)}`);
			else if (now.zone === "monster" && was.position !== now.position) lines.push(`${name(now.id)} changes to ${now.position === "attack" ? "Attack" : "Defense"} Position`);
		}
	}
	const own = (id: number) => context.action !== undefined && "card" in context.action && context.action.card === id && (context.action.type === "set" || context.action.type === "activate");
	/** The line of one move of a card, from `was` to `now` (`from`: where it is said to come from); `null` for the card a move activates or Sets. */
	const moveLine = (was: CardInstance, now: CardInstance, reason: MoveReason | undefined, from: string): string | null => {
		const to = whereIs(now, seat);
		switch (now.zone) {
			case "graveyard":
				return `${name(now.id)} ${reason === "destroyed" ? "is destroyed and sent to the Graveyard" : reason === "discarded" ? "is discarded to the Graveyard" : reason === "tributed" ? "is Tributed (sent to the Graveyard)" : "is sent to the Graveyard"} from ${from}`;
			case "banished":
				return `${name(now.id)} is banished from ${from}`;
			case "monster": {
				if (was.zone === "monster") return `control of ${name(now.id)} changes to ${who(now.controller)}`;
				if (now.face === "down") return `${name(now.id)} is Set in ${to} from ${from}`;
				// How it was Summoned may be noted on the card once the Summon is done: read there while it is still that card.
				// Gone again within the step: the card as it was when it left (the snapshot of its next move), which carries that note.
				const current = after.cards[now.id]!;
				const leaving = story.find((each) => each.type === "moved" && each.before.id === now.id && each.before.moves === now.moves);
				const card = current.moves === now.moves ? current : leaving?.type === "moved" ? leaving.before : now;
				const how = card.summonedBy ? SUMMONED[card.summonedBy] : card.specialSummoned || was.zone !== "hand" ? "Special Summoned" : "Normal Summoned";
				const using = card.summonedBy && card.summonMaterials.length > 0 ? ` using ${card.summonMaterials.map((material) => name(material.id)).join(", ")}` : "";
				return `${name(now.id)} is ${how} to ${to} from ${from}${using}`;
			}
			case "spell":
			case "field":
				return own(now.id) ? null : `${name(now.id)} is ${now.face === "down" ? "Set" : "placed"} in ${to} from ${from}`;
			case "material":
				return `${name(now.id)} becomes material of ${now.attachedTo === null ? "a monster" : name(now.attachedTo)}`;
			default:
				return `${name(now.id)} returns to ${to} from ${from}`;
		}
	};
	/** Cards that went from a Deck to their owner's hand together: a draw (named to its player only, counted for the other), or an add. */
	const addLine = (side: Side, ids: readonly number[], drew: boolean, turn: string): string => {
		const plural = `${ids.length} card${ids.length === 1 ? "" : "s"}`;
		if (side === seat) return drew ? `${turn}you draw ${ids.map(name).join(", ")}` : `you add ${ids.map(name).join(", ")} from the Deck to the hand`;
		return drew ? `${turn}the opponent draws ${plural}` : `the opponent adds ${plural} from the Deck to the hand`;
	};
	/** The LP lines from `from` to `to` (`hit`: the players who took battle damage); how many there are. */
	const lpLines = (from: Readonly<Record<Side, number>>, to: Readonly<Record<Side, number>>, hit: ReadonlySet<Side>): number => {
		let said = 0;
		for (const side of ["you", "rival"] as const) {
			const change = to[side] - from[side];
			if (change === 0) continue;
			const battle = change < 0 && (before.battle !== null || hit.has(side));
			lines.push(`LP: ${who(side)} ${from[side]} -> ${to[side]} (${change > 0 ? "+" : ""}${change}${battle ? ", battle damage" : ""})`);
			said++;
		}
		return said;
	};

	// What the story tells, in its order.
	const told = new Set<number>();
	const toldModifiers = new Set<number>();
	const toldNegations = new Set<number>();
	let lp = before.lp;
	if (story.length > 0) {
		const draws = new Map<number, boolean>();
		const hit = new Set<Side>();
		// What a link may do that the story does not tell (a Summon left for the chain's end, an attack again): then "nothing" is not said.
		const quiet = after.summoning === before.summoning && after.again === before.again && after.replay === before.replay;
		let segment: { readonly line: number; readonly gone: boolean; busy: boolean } | null = null;
		// Each card's `moves` as the story has told it so far: a target is judged where the link's marker is, not at the end of the step.
		const movesSoFar = new Map<number, number>();
		const targetGone = (link: Link) => link.targets.length > 0 && link.targets.every((id, at) => (movesSoFar.get(id) ?? before.cards[id]?.moves) !== link.targetMoves[at]);
		const flush = (to: Readonly<Record<Side, number>>) => {
			if (lpLines(lp, to, hit) > 0 && segment) segment.busy = true;
			lp = to;
			hit.clear();
		};
		const close = () => {
			if (segment && !segment.busy && quiet) {
				lines[segment.line] += segment.gone ?"; nothing happens (its target is no longer there)" : "; nothing happens";
			}
			segment = null;
		};
		for (let at = 0; at < story.length; at++) {
			const entry = story[at]!;
			switch (entry.type) {
				case "link-resolves":
					flush(entry.lp);
					close();
					segment = { line: lines.length, gone: targetGone(entry.link), busy: false };
					lines.push(`chain link ${entry.index + 1} resolves: ${entry.link.card.code}${entry.negated ? NEGATED_LINK[entry.negated] : negatedByNote(entry.link) ? NEGATED_LINK.activation : ""}`);
					break;
				case "chain-resolved":
					flush(entry.lp);
					close();
					break;
				case "draw":
					draws.set(entry.batch, entry.normal === true);
					break;
				case "link-negated": {
					// The link is still on the chain: it resolves after the one negating it.
					const link = before.chain[entry.index] ?? after.chain[entry.index];
					if (link) {
						toldNegations.add(link.card.id);
						lines.push(`the ${entry.what} of ${link.card.code} (chain link ${entry.index + 1}) is negated`);
					}
					if (segment) segment.busy = true;
					break;
				}
				case "modifier-added": {
					toldModifiers.add(entry.stamp);
					const modifier = after.modifiers.find((each) => each.stamp === entry.stamp);
					if (modifier && modifier.equip === undefined) lines.push(`lasting effect begins: ${describeLasting(after, modifier, seat, name)}`);
					if (segment) segment.busy = true;
					break;
				}
				case "random-pick":
					// Never which cards: the picked ones may be hidden from this seat (duel 006 #6).
					lines.push(`${entry.picked} card${entry.picked === 1 ? " is" : "s are"} picked at random from ${entry.of}`);
					if (segment) segment.busy = true;
					break;
				case "battle-damage":
					hit.add(entry.player);
					if (segment) segment.busy = true;
					break;
				case "moved": {
					if (segment) segment.busy = true;
					const { before: was, after: now } = entry;
					movesSoFar.set(now.id, now.moves);
					if (was.zone === now.zone && was.controller === now.controller) break;
					told.add(now.id);
					if (was.zone === "deck" && now.zone === "hand") {
						// The cards of one group that went from the Deck to the hand together: one line.
						const ids = [now.id];
						for (let next = at + 1; next < story.length; next++) {
							const more = story[next]!;
							if (more.type === "added-to-hand") continue;
							if (more.type !== "moved" || entry.batch === undefined || more.batch !== entry.batch || more.before.zone !== "deck" || more.after.zone !== "hand" || more.after.controller !== now.controller) break;
							ids.push(more.after.id);
							told.add(more.after.id);
							at = next;
						}
						const drew = entry.batch !== undefined && draws.has(entry.batch);
						lines.push(addLine(now.controller, ids, drew, drew && draws.get(entry.batch!) ? `turn ${after.turn.number} Draw Phase: ` : ""));
						break;
					}
					const line = moveLine(was, now, entry.reason, whereIs(was, seat));
					if (line) lines.push(line);
					break;
				}
				default:
					if (segment) segment.busy = true;
			}
		}
		flush(after.lp);
		// A link still resolving (it waits for a choice) has not finished: nothing is said yet of what it did.
		if (after.asking) segment = null;
		close();
	}

	// Cards that moved with nothing in the story to tell it (a Duel changed by hand, a card placed by a rule): from where they were to where they are.
	const untold = moved.filter(({ now }) => !told.has(now.id));
	const taken = new Set<number>();
	for (const side of ["you", "rival"] as const) {
		const added = untold.filter(({ was, now }) => was.zone === "deck" && now.zone === "hand" && now.controller === side);
		if (added.length === 0) continue;
		for (const { now } of added) taken.add(now.id);
		const top = before.piles[side].deck.slice(0, added.length);
		const drew = added.every(({ now }) => top.includes(now.id));
		lines.push(addLine(side, added.map(({ now }) => now.id), drew, drew && before.turn.number !== after.turn.number ? `turn ${after.turn.number} Draw Phase: ` : ""));
	}
	for (const { was, now } of untold) {
		if (taken.has(now.id)) continue;
		// A card that went onto the field and left it again within this one step (`fieldEntries` counts each arrival): said in two lines,
		// and its last move is from the field, not from where it started.
		const onField = (zone: CardInstance["zone"]) => zone === "monster" || zone === "spell" || zone === "field";
		const through = !onField(was.zone) && !onField(now.zone) && now.fieldEntries > was.fieldEntries;
		if (through) lines.push(`${name(now.id)} is ${now.summonedBy ? SUMMONED[now.summonedBy] : was.zone === "extra" ? "Special Summoned" : "put on the field"} from ${whereIs(was, seat)}`);
		const event = after.live.find((each) => each.type === "moved" && each.after.id === now.id && each.after.moves === now.moves) ?? before.live.find((each) => each.type === "moved" && each.after.id === now.id && each.after.moves === now.moves);
		const line = moveLine(was, now, event && event.type === "moved" ? event.reason : undefined, through ? "the field" : whereIs(was, seat));
		if (line) lines.push(line);
	}

	// Life Points the story has not told.
	lpLines(lp, after.lp, new Set(after.live.flatMap((each) => (each.type === "battle-damage" ? [each.player] : []))));

	// Negations: an activation negated, effects negated for a while (those the story has not told).
	if (before.turn.number === after.turn.number) {
		after.activations.forEach((made, at) => {
			if (made.negated && !before.activations[at]?.negated && !toldNegations.has(made.card.id)) lines.push(`${made.card.code}'s activation is negated`);
		});
	}
	const known = new Set(before.modifiers.map((modifier) => modifier.stamp));
	for (const modifier of after.modifiers) {
		if (!known.has(modifier.stamp) && !toldModifiers.has(modifier.stamp) && modifier.equip === undefined) lines.push(`lasting effect begins: ${describeLasting(after, modifier, seat, name)}`);
	}

	// The end of an attack: one summary line with the damage.
	if (before.battle !== null && after.battle === null) {
		const { attacker, target, destroyed } = before.battle;
		const start = context.battleStart ?? before.lp;
		const hurt = (["you", "rival"] as const).filter((side) => start[side] > after.lp[side]).map((side) => `${who(side)} took ${start[side] - after.lp[side]} damage`);
		const gone = destroyed.length > 0 ? `; ${destroyed.map((card) => name(card.id)).join(", ")} destroyed` : "";
		// The target left the field before damage calculation (not destroyed by this battle): a replay when the rules give one (duel 006 #9).
		const left = target !== null && !destroyed.some((card) => card.id === target.id) && after.cards[target.id]!.moves !== target.moves;
		const replayed = after.replay !== null && after.replay.id === attacker.id && after.replay.moves === attacker.moves;
		// A replay has other causes (a new monster on the opponent's side, a lost direct-attack permission): "left" only when it did.
		const outcome =
			hurt.length > 0
				? hurt.join(", ")
				: replayed
					? left
						? "the attack target left the field: no damage calculation, and the attack may be redirected (a replay)"
						: "no damage calculation; the attack may be redirected (a replay)"
					: left
						? "the attack target left the field: no damage calculation"
						: "no damage";
		lines.push(`battle: ${name(attacker.id)} attacked ${target ? name(target.id) : "directly"}; ${outcome}${gone}`);
	}
	if (!before.winner && after.winner) lines.push(after.winner === "draw" ? "the duel is over: a draw" : `the duel is over: ${after.winner === seat ? "you win" : "the opponent wins"}`);

	// New chain links.
	for (let at = shared; at < after.chain.length; at++) {
		const link = after.chain[at]!;
		lines.push(`chain link ${at + 1}: ${link.card.code} activated by ${who(link.player)}`);
	}
	return lines;
}

/** Each seat's notes for a move: the changes of every step it went through. Absent for a seat with nothing to read. */
function notesOf(match: Match, before: Duel, steps: readonly Duel[], action: Action): Readonly<Record<Side, readonly string[]>> | undefined {
	let battleStart: Readonly<Record<Side, number>> | null = null;
	if (before.battle !== null) for (let at = match.log.length - 1; at >= 0 && battleStart === null; at--) battleStart = match.log[at]!.lpBefore ?? null;
	const notes: Record<Side, string[]> = { you: [], rival: [] };
	let previous = before;
	steps.forEach((step, at) => {
		if (previous.battle === null && step.battle !== null) battleStart = previous.lp;
		for (const side of ["you", "rival"] as const) notes[side].push(...describeChange(previous, step, side, { ...(at === 0 ? { action } : {}), battleStart }));
		previous = step;
	});
	return notes.you.length === 0 && notes.rival.length === 0 ? undefined : notes;
}

const PHASE_LABEL: Readonly<Record<Phase, string>> = { draw: "Draw Phase", standby: "Standby Phase", main1: "Main Phase 1", battle: "Battle Phase", main2: "Main Phase 2", end: "End Phase" };

/**
 * The passes of a move, as lines: one line per seat and moment (turn and phase), consecutive or not, with a count ("pass (no legal
 * response) x5"). A pass made in another turn or phase than the move's (the next turn's Draw Phase after an End Phase pass) says when.
 */
function collapsePasses(entry: LogEntry): { readonly side: Side; readonly name: string }[] {
	const counts = new Map<string, { side: Side; when: string; count: number }>();
	entry.passes!.forEach((side, at) => {
		const moment = entry.passedAt?.[at];
		const when = moment && (moment.turn !== entry.turn || moment.phase !== entry.phase) ? `, turn ${moment.turn} ${PHASE_LABEL[moment.phase]}` : "";
		const key = `${side}${when}`;
		const found = counts.get(key);
		if (found) found.count++;
		else counts.set(key, { side, when, count: 1 });
	});
	return [...counts.values()].map(({ side, when, count }) => ({ side, name: `${AUTO_PASS}${count === 1 ? "" : ` x${count}`}${when}` }));
}

/** Where a card is, as both players can say it: controller, zone, then its slot on the field or its place in its pile. */
function refOf(duel: Duel, id: number): string {
	const card = duel.cards[id]!;
	const at = card.slot ?? duel.piles[card.controller][card.zone].indexOf(id);
	return `${card.controller} ${card.zone} ${at}`;
}

/** The seat's part of a view (`SeatView`): an allow-list read from the masked Duel, every card named by where it is. */
/** A chain target that left where it was (it moved, so it is a new card, `targetsOf`): shown as gone, not as a live reference. */
export const GONE = "gone";

function seatView(view: View): SeatView {
	const { duel } = view;
	const lasting = lastingEffects(duel, view.side);
	const card = (id: number): SeatCard => {
		const seen = duel.cards[id]!;
		const field = seen.zone === "monster" || seen.zone === "spell" || seen.zone === "field";
		const stats = seen.zone === "monster" && seen.face === "up" && seen.code !== HIDDEN;
		const facts = stats ? duel.defs[seen.code]?.facts : undefined;
		const modifiers = stats && duel.modifiers.length > 0 ? monsterModifiers(duel, id, view.side) : [];
		return {
			ref: refOf(duel, id),
			code: seen.code,
			face: seen.face,
			...(field && seen.slot !== null ? { slot: seen.slot } : {}),
			...(seen.zone === "monster" ? { position: seen.position } : {}),
			...(stats ? { atk: atk(duel, id), ...(facts?.link === undefined ? { def: def(duel, id) } : {}) } : {}),
			...(facts?.level === undefined ? {} : { level: level(duel, id) }),
			...(facts?.rank === undefined ? {} : { rank: facts.rank }),
			...(facts?.link === undefined ? {} : { link: facts.link }),
			...(facts?.attribute === undefined ? {} : { attribute: facts.attribute }),
			...(facts?.monsterType === undefined ? {} : { monsterType: facts.monsterType }),
			...(modifiers.length > 0 ? { modifiers } : {}),
			...(seen.equippedTo !== null ? { equippedTo: refOf(duel, seen.equippedTo) } : {}),
			...(seen.attachedTo !== null ? { attachedTo: refOf(duel, seen.attachedTo) } : {}),
		};
	};
	const player = (who: Side): SeatPlayer => {
		const pile = duel.piles[who];
		return { lp: duel.lp[who], hand: pile.hand.map(card), deck: pile.deck.length, extra: pile.extra.map(card), monsters: pile.monster.map(card), spells: pile.spell.map(card), field: pile.field.map(card), graveyard: pile.graveyard.map(card), banished: pile.banished.map(card), materials: pile.material.map(card) };
	};
	const seen = (entry: Waiting) => duel.cards[entry.card.id]?.code !== HIDDEN;
	const waiting = [...duel.waiting, ...(duel.building?.remaining ?? [])].filter(seen).map((entry) => ({ ref: refOf(duel, entry.card.id), code: entry.card.code, effect: entry.effect }));
	const { battle, summoning } = duel;
	return {
		side: view.side,
		turn: { ...duel.turn },
		winner: duel.winner,
		players: { you: player("you"), rival: player("rival") },
		chain: duel.chain.map((link) => ({ player: link.player, ref: refOf(duel, link.card.id), code: link.card.code, effect: link.effect, targets: link.targets.map((id, at) => (duel.cards[id]!.moves === link.targetMoves[at] ? refOf(duel, id) : GONE)), targetCodes: link.targets.map((id) => duel.cards[id]!.code) })),
		waiting,
		lasting,
		summoning: summoning && { player: summoning.player, cards: summoning.cards.map((id) => refOf(duel, id)) },
		battle: battle && { attacker: refOf(duel, battle.attacker.id), target: battle.target && refOf(duel, battle.target.id), step: battle.step },
	};
}

export function seatFor(match: Match, side: Side): Seat {
	const toAct = decider(match.duel) === side;
	return {
		side,
		view: seatView(viewFor(match.duel, side)),
		toAct,
		moves: toAct ? namedMoves(match.duel, side).map((move) => move.name) : [],
		details: toAct ? detailsOf(match, side, legalActions(match.duel)) : [],
		log: match.log.map((entry) => ({ turn: entry.turn, phase: entry.phase, side: entry.side, name: entry.seen[side], ...(entry.notes?.[side]?.length ? { notes: entry.notes[side] } : {}), ...(entry.passes?.length ? { auto: collapsePasses(entry) } : {}) })),
		disputes: match.disputes.map((entry): SeatDispute => (entry.by === side ? entry : { at: entry.at, turn: entry.turn, phase: entry.phase, by: entry.by, notice: entry.ruling ? "the opponent raised a dispute (settled)" : "the opponent raised a dispute (open)" })),
	};
}

/**
 * Plays the move `step` names (a name of `seatFor(match, side).moves`, optionally with " @z" and " as attack|defense", as `findNamed`).
 * Throws when `side` is not to act, when the name is not offered, or when it is ambiguous: offered for several moves that name a card
 * the seat cannot see ("?"), which only `playIndex` tells apart. The match given is not changed.
 */
export function playMove(match: Match, side: Side, step: string): Match {
	const { duel } = match;
	if (decider(duel) !== side) throw new Error(notYourDecision(side, decider(duel)));
	const moves = namedMoves(duel, side);
	const action = pickNamed(moves, step);
	if (!action) throw new Error(`"${step}" is not legal for ${side}; offered: ${moves.map((move) => move.name).join(" | ")}`);
	const { name } = moves.find((move) => takes(move.action, action))!;
	if (UNPLACED.test(name) && moves.filter((move) => move.name === name).length > 1) throw new Error(`"${name}" is ambiguous for ${side}: it stands for several moves on cards ${side} cannot see; play one by its index`);
	return played(match, side, action);
}

/** A name with a hidden card that `located` could not place: a bare "?". */
const UNPLACED = /(^| )\?( |$)/;

/** What `playIndex` may add to the move it picks: the name the seat read at that index, and the zone and battle position, as in `playMove`. */
export interface IndexedChoice {
	readonly expect?: string;
	readonly zone?: number;
	readonly position?: Position;
}

/**
 * Plays move `index` (from 0) of `seatFor(match, side).moves`, which lists the legal actions in their order: two moves with one name
 * are still two indexes. `expect`: the name the seat read at that index; another name there (a stale board) is refused. `zone` and
 * `position` must be among those the move offers. Throws otherwise; the match given is not changed.
 */
export function playIndex(match: Match, side: Side, index: number, choice: IndexedChoice = {}): Match {
	const { duel } = match;
	if (decider(duel) !== side) throw new Error(notYourDecision(side, decider(duel)));
	const moves = namedMoves(duel, side);
	const move = Number.isSafeInteger(index) && index >= 0 ? moves[index] : undefined;
	if (!move) throw new Error(moves.length === 0 ? `no move ${index}: this board has no moves` : `no move ${index}: this board has ${moves.length} move${moves.length === 1 ? "" : "s"} (0 to ${moves.length - 1})`);
	if (choice.expect !== undefined && move.name !== choice.expect) throw new Error(staleIndex(moves, index, choice.expect));
	const action = pickNamed([move], `${move.name}${choice.zone === undefined ? "" : ` @${choice.zone}`}${choice.position === undefined ? "" : ` as ${choice.position}`}`);
	if (!action) throw new Error(refusedPlacement(move, choice));
	return played(match, side, action);
}

/** Why a seat that does not hold the decision cannot move: who does. */
function notYourDecision(side: Side, holder: Side | null): string {
	return `${side} does not hold the decision; ${holder === null ? "nobody acts (the Duel is over)" : `${holder} ${holder === "you" ? "act" : "acts"} now`}`;
}

/** A stale index: what the board has there, and where the label expected is now (or that no move has it). */
function staleIndex(moves: readonly NamedAction[], index: number, expected: string): string {
	const now = moves.flatMap((each, at) => (each.name === expected ? [at] : []));
	const first = `move ${index} is ${JSON.stringify(moves[index]!.name)}, expected ${JSON.stringify(expected)}`;
	if (now.length > 0) return `${first}; the board changed since you read it: ${JSON.stringify(expected)} is now move${now.length === 1 ? "" : "s"} ${now.join(", ")}`;
	const listed = moves.slice(0, 12).map((each, at) => `${at} ${each.name}`).join(" | ");
	return `${first}; no move of this board has that label (moves: ${listed}${moves.length > 12 ? " | ..." : ""})`;
}

/** Why a zone or a battle position asked for with a move is refused: what the move offers instead. */
function refusedPlacement(move: NamedAction, choice: IndexedChoice): string {
	const { action, name } = move;
	if (action.type !== "summon" && action.type !== "set" && action.type !== "activate") return `${JSON.stringify(name)} takes no zone or position`;
	const { zones, positions } = action as Placing;
	if (choice.zone !== undefined && !zones?.includes(choice.zone)) return zones && zones.length > 0 ? `zone ${choice.zone} is not open for ${JSON.stringify(name)} (open: ${zones.join(", ")})` : `${JSON.stringify(name)} takes no zone here (the zone is asked afterwards)`;
	if (choice.position !== undefined) return `position ${choice.position} is not offered for ${JSON.stringify(name)} (${positions && positions.length > 0 ? `offered: ${positions.join(", ")}` : action.type === "summon" && action.how === "normal" ? "a Normal Summon is face-up Attack Position" : "only Attack Position"})`;
	return "placement is not legal for the selected move";
}

/** The match once `side` has played `action` (legal), logged with each seat's name for it. */
function played(match: Match, side: Side, action: Action): Match {
	const { duel } = match;
	const next = act(duel, action);
	const { passes, passedAt, steps } = autoPasses(duel, action, next);
	const notes = notesOf(match, duel, steps, action);
	const entry: LogEntry = { turn: duel.turn.number, phase: duel.turn.phase, side, action, seen: { you: nameAfter(duel, next, "you", action), rival: nameAfter(duel, next, "rival", action) }, ...(passes.length ? { passes, passedAt } : {}), ...(notes ? { notes } : {}), ...(action.type === "attack" ? { lpBefore: duel.lp } : {}) };
	return { ...match, duel: next, log: [...match.log, entry] };
}

/**
 * The passes `act` made on behalf of players during `action`, in order (the holder of priority at each). `act` stops its auto-pass loop
 * when `everyWindow` is on, so with it on the Duel just after the action is the whole result: that one is replayed here, then passed
 * one step at a time (still with every window shown) until `next`, the Duel `act` returned, is reached. Nothing but `act` is called.
 * `steps`: the Duels the move went through, the last one `next` itself (what `describeChange` compares, two by two).
 */
function autoPasses(duel: Duel, action: Action, next: Duel): { passes: Side[]; passedAt: { turn: number; phase: Phase }[]; steps: Duel[] } {
	if (duel.options.everyWindow) return { passes: [], passedAt: [], steps: [next] };
	const shown = (each: Duel): Duel => ({ ...each, options: { ...each.options, everyWindow: true } });
	// The story (`Duel.story`) tells what one `act` did: `next` holds the whole move's, each step only its own, so it is not compared.
	const target = JSON.stringify({ ...next, story: [] });
	const passes: Side[] = [];
	const passedAt: { turn: number; phase: Phase }[] = [];
	let current = act(shown(duel), action);
	const steps: Duel[] = [current];
	let reached = false;
	for (let guard = 0; guard < 200 && !(reached = JSON.stringify({ ...current, options: next.options, story: [] }) === target); guard++) {
		const who = decider(current);
		if (who === null) break;
		passes.push(who);
		passedAt.push({ turn: current.turn.number, phase: current.turn.phase });
		current = act(current, { type: "pass" });
		steps.push(current);
	}
	// The last step is `next` itself, with the story of that step only (or none, read from the states, if the steps did not reach it).
	steps[steps.length - 1] = { ...next, story: reached ? current.story : [] };
	return { passes, passedAt, steps };
}

/** Raises a dispute from `side`'s seat; it does not need priority. */
export function raiseDispute(match: Match, side: Side, claim: string): Match {
	const { turn } = match.duel;
	return { ...match, disputes: [...match.disputes, { at: match.log.length, turn: turn.number, phase: turn.phase, by: side, claim, ruling: null }] };
}

/** Settles dispute `index` (from 0) with its ruling. Throws when there is no such dispute or it is already settled. */
export function settleDispute(match: Match, index: number, ruling: Ruling): Match {
	const dispute = match.disputes[index];
	if (!dispute) throw new Error(`no dispute ${index}`);
	if (dispute.ruling) throw new Error(`dispute ${index} is already settled`);
	return { ...match, disputes: match.disputes.map((each, i) => (i === index ? { ...each, ruling } : each)) };
}

/** What a match is, as plain data (JSON): its setup, its log and its disputes. `replayMatch` rebuilds the match from it. */
export interface MatchRecord {
	readonly setup: MatchSetup;
	readonly log: readonly LogEntry[];
	readonly disputes: readonly Dispute[];
}

/** The record keeps what the players played and each seat's names; what a move did (`notes`, `lpBefore`, `passedAt`) is derived again by `replayMatch`. */
export const matchRecord = (match: Match): MatchRecord => ({ setup: match.setup, log: match.log.map(({ notes: _notes, lpBefore: _lpBefore, passedAt: _passedAt, ...entry }) => entry), disputes: match.disputes });

/**
 * The match a record leads to, its moves played again from the setup. Throws at the first move that is not legal where it is replayed,
 * or whose names are no longer those logged (the rules or a card changed since): a replay never silently plays another game.
 */
export function replayMatch(record: MatchRecord, defs: Readonly<Record<string, CardDef>>): Match {
	let match = openMatch(record.setup, defs);
	record.log.forEach((entry, index) => {
		const label = `move ${index + 1} (${entry.side}: ${entry.seen[entry.side]})`;
		if (decider(match.duel) !== entry.side || !legalActions(match.duel).some((listed) => takes(listed, entry.action))) throw new Error(`${label} is not legal where it is replayed`);
		match = played(match, entry.side, entry.action);
		const now = match.log.at(-1)!.seen;
		if (now.you !== entry.seen.you || now.rival !== entry.seen.rival) throw new Error(`${label} was logged as ${JSON.stringify(entry.seen)}, it is now ${JSON.stringify(now)}`);
	});
	return { ...match, disputes: record.disputes };
}
