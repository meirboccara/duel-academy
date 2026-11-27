import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { act, type Action, addModifier, ask, askZone, CARD_DEFS, type CardDef, createRng, delay, describeChange, type Duel, HIDDEN, legalActions, type Match, type MatchRecord, matchRecord, moveCard, moveCards, openMatch, type Placing, playMove, raiseDispute, READINESS_DECKS, redeal, replayMatch, revealCards, revealedNow, type Side, seatFor, settleDispute, takes, watch } from "../src";
import { playIndex, renderSeat, runCli, seatBoard } from "../src/agent-play";
import { board as ssBoard, resolve as ssResolve } from "./cards/sky-striker-fixtures";
import { play } from "./rules/fixtures";

/**
 * The hidden-information invariant of the seat output, tested as a difference: two Duels that differ only in what one seat cannot see
 * (the other seat's hand, both Decks' order and contents, face-down field and banished cards, the other seat's face-down Extra Deck, the
 * RNG) must give that seat byte-identical output: `seatFor` (view, moves, details, log, disputes), `seatBoard`, `renderSeat` (lasting
 * effects, chain, window line), the refusals of `playIndex`/`playMove`, and, for the next move played in both, the name and the notes it
 * logs for that seat and its board after. A variant swaps codes among the cards the seat cannot see (`visibleTo`, stated independently of
 * `viewFor`; dealt by `redeal`, so a face-down card keeps a code that fits its zone), and keeps what the seat knows anyway: cards it saw in
 * their present incarnation, cards revealed in it, the cards an open zone question will place. The notes are also checked as a function
 * over every move (`checkChange`). The next move may legitimately differ, and is then not compared, only when: it uses a card of the other
 * seat that the variant dealt differently, it showed the seat a swapped card, the automatic passes differ (whether a player holds a legal
 * response is decided by its hidden cards: by design of the auto-pass), or the public state after it differs (an effect read hidden cards,
 * e.g. a search that finds nothing). The counts of each are printed. This is evidence on sampled states, not a proof.
 */

const other = (side: Side): Side => (side === "you" ? "rival" : "you");
const SIDES = ["you", "rival"] as const;

const record = (name: string): MatchRecord => JSON.parse(readFileSync(new URL(`../../../docs/rules-core/duel-testing/${name}.json`, import.meta.url), "utf8")) as MatchRecord;

const flat = (id: number) => {
	const deck = READINESS_DECKS.find((manifest) => manifest.id === id)!;
	const codes = (entries: typeof deck.main) => entries.flatMap((entry) => Array<string>(entry.count).fill(entry.code!));
	return { deck: codes(deck.main), extra: codes(deck.extra) };
};

/**
 * Every card snapshot of the Duel (an object with `id`, `code`, `moves`) that stands for a card's present incarnation, recoded;
 * `everyIncarnation`: its snapshots of every incarnation (a card hidden before a move and after it, whatever it went through).
 */
function recode(duel: Duel, codes: ReadonlyMap<number, string>, everyIncarnation = false): Duel {
	const walk = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			let changed = false;
			const out = value.map((each) => {
				const next = walk(each);
				if (next !== each) changed = true;
				return next;
			});
			return changed ? out : value;
		}
		if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return value;
		const object = value as Record<string, unknown>;
		let out: Record<string, unknown> | null = null;
		for (const [key, each] of Object.entries(object)) {
			const next = walk(each);
			if (next !== each) (out ??= { ...object })[key] = next;
		}
		const { id, code, moves } = object;
		if (typeof id === "number" && typeof code === "string" && typeof moves === "number" && codes.has(id) && (everyIncarnation || duel.cards[id]?.moves === moves) && codes.get(id) !== code) (out ??= { ...object }).code = codes.get(id);
		return out ?? value;
	};
	const { defs, ...rest } = duel;
	return { ...(walk(rest) as Omit<Duel, "defs">), defs };
}

/**
 * The cards `viewer` may know now, stated here from the rules and independently of `viewFor` (a test that asked `viewFor` what is hidden
 * could never catch `viewFor` showing too much): a Deck is hidden from both players; a hand, a face-down Extra Deck and face-down banished
 * cards from the other player; a face-down card on the field from the player who does not control it. Known anyway: a card revealed and
 * still where it was revealed, the cards of the chain and of a question's resolving links, a monster being Summoned, and the candidates of
 * the seat's own question that lie in its own Deck (a search).
 */
function visibleTo(duel: Duel, viewer: Side): Set<number> {
	const known = new Set<number>(revealedNow(duel));
	for (const card of Object.values(duel.cards)) {
		const field = card.zone === "monster" || card.zone === "spell" || card.zone === "field";
		const hidden = card.zone === "deck" || (card.zone === "hand" && card.owner !== viewer) || ((card.zone === "extra" || card.zone === "banished") && card.owner !== viewer && card.face === "down") || (field && card.controller !== viewer && card.face === "down");
		if (!hidden) known.add(card.id);
	}
	for (const link of [...duel.chain, ...(duel.asking?.links ?? [])]) known.add(link.card.id);
	for (const id of duel.summoning?.cards ?? []) known.add(id);
	const asking = duel.asking;
	if (asking && asking.player === viewer && !asking.zones && !asking.declarations) for (const id of asking.from) if (duel.cards[id]?.zone === "deck" && duel.cards[id]!.owner === viewer) known.add(id);
	return known;
}

/** Incarnations ("id:moves") a seat has seen, along a game. */
type Seen = Readonly<Record<Side, Set<string>>>;
const noneSeen = (): Seen => ({ you: new Set(), rival: new Set() });
function remember(seen: Seen, duel: Duel): void {
	for (const side of SIDES) {
		for (const id of visibleTo(duel, side)) seen[side].add(`${id}:${duel.cards[id]!.moves}`);
	}
}

interface Variant {
	readonly duel: Duel;
	/** The cards whose code changed. */
	readonly swapped: readonly number[];
}

/**
 * The Duel with the codes of the cards `viewer` cannot see dealt again among themselves (`redeal`, seeded): same owner, same pool (Main
 * Deck or Extra Deck), a face-down card a code that fits its zone. Kept: cards the seat saw in this incarnation, cards revealed in it, and
 * the cards an open zone question will place (`placedBy`). `dynamic` (a variant the next move is played in): the RNG stays (a move
 * shuffles the same way) and the cards of pending triggers keep their code (the engine reads their effects); otherwise the RNG is reseeded
 * and pending triggers' cards are swapped too (what the seat reads of a trigger it cannot see must not depend on the card).
 */
function variant(duel: Duel, viewer: Side, seed: number, seen: ReadonlySet<string>, dynamic = false): Variant {
	const visible = visibleTo(duel, viewer);
	const pending = new Set([...(dynamic ? [...duel.waiting, ...(duel.building?.remaining ?? [])].map((entry) => entry.card.id) : []), ...placedBy(duel)]);
	const revealed = new Set(duel.revealed.filter((entry) => duel.cards[entry.id]?.moves === entry.moves).map((entry) => entry.id));
	const ids = Object.values(duel.cards)
		.filter((card) => !visible.has(card.id) && !seen.has(`${card.id}:${card.moves}`) && !revealed.has(card.id) && !pending.has(card.id))
		.map((card) => card.id);
	const { codes, rng } = deal(duel, viewer, ids, seed);
	const recoded = recode(duel, codes);
	return { duel: dynamic ? recoded : { ...recoded, rng }, swapped: ids.filter((id) => codes.get(id) !== duel.cards[id]!.code) };
}

/**
 * The cards an open zone question will put on the field: the effect that asks chose them by what they are (a monster of a given name from
 * the Deck), so another code for them would be a world the question's own choice rules out. Read by answering each zone on a copy.
 */
function placedBy(duel: Duel): number[] {
	if (!duel.asking?.zones) return [];
	const moved = new Set<number>();
	for (const zone of duel.asking.from) {
		try {
			const after = act(duel, { type: "place", zone });
			for (const card of Object.values(after.cards)) if (card.moves !== duel.cards[card.id]!.moves && (card.zone === "monster" || card.zone === "spell" || card.zone === "field")) moved.add(card.id);
		} catch {
			// A zone the copy cannot take tells nothing.
		}
	}
	return [...moved];
}

/** New codes for `ids`, dealt by `redeal` from their own codes: same owner and pool, a face-down card a code that fits its zone. */
function deal(duel: Duel, viewer: Side, ids: readonly number[], seed: number): { codes: Map<number, string>; rng: Duel["rng"] } {
	const cards = { ...duel.cards };
	const pools: Record<Side, { main: string[]; extra: string[] }> = { you: { main: [], extra: [] }, rival: { main: [], extra: [] } };
	for (const id of ids) {
		const card = duel.cards[id]!;
		pools[card.owner][card.extraDeck ? "extra" : "main"].push(card.code);
		cards[id] = { ...card, code: HIDDEN };
	}
	const dealt = redeal({ side: viewer, duel: { ...duel, cards }, unknown: pools }, seed);
	return { codes: new Map(ids.map((id) => [id, dealt.cards[id]!.code])), rng: dealt.rng };
}

const count = (found: Findings, what: string) => void (found.covered[what] = (found.covered[what] ?? 0) + 1);

/** Kinds of log notes, counted to say what the comparison exercised. */
const NOTE_KINDS: readonly (readonly [string, RegExp])[] = [
	["the opponent draws", /the opponent draws/],
	["the opponent adds from the Deck", /the opponent adds/],
	["Summoned using materials", /Summoned .* using /],
	["sent to the Graveyard", /sent to the Graveyard/],
	["destroyed", /destroyed/],
	["discarded", /discarded/],
	["Set", /is Set in/],
	["a card the seat cannot see", /\ba card\b/],
	["lasting effect begins", /lasting effect begins/],
	["battle", /^battle: /],
];

/** Kinds of move details, counted the same way. */
const DETAIL_KINDS: readonly (readonly [string, RegExp])[] = [
	["a cost", /cost/],
	["Tributes", /Tribute/],
	["materials", /materials/],
	["a placement", /[Zz]one \d/],
	["a choice", /^choose /],
	["targets", /targets /],
	["an attack", /attacks/],
];

/**
 * The notes of a move as a function (`describeChange`): the codes of the cards a seat sees neither before the move nor after it, dealt
 * again in both Duels alike, must not change what the seat reads. Every move is checked, none is explained away: nothing is played again.
 */
function checkChange(where: string, before: Duel, after: Duel, action: Action, seen: Seen, found: Findings): void {
	for (const viewer of SIDES) {
		const was = visibleTo(before, viewer);
		const now = visibleTo(after, viewer);
		const ids = Object.values(before.cards).filter((card) => !was.has(card.id) && !now.has(card.id) && !seen[viewer].has(`${card.id}:${card.moves}`)).map((card) => card.id);
		const { codes } = deal(before, viewer, ids, 31 + ids.length);
		found.changes++;
		const notes = describeChange(before, after, viewer, { action });
		for (const [kind, pattern] of NOTE_KINDS) if (notes.some((note) => pattern.test(note))) count(found, `note: ${kind}`);
		const said = (from: Duel, to: Duel) => ({ notes: JSON.stringify(describeChange(from, to, viewer, { action })) });
		found.leaks.push(...differences(`${where} notes, seat ${viewer}`, { notes: JSON.stringify(notes) }, said(recode(before, codes, true), recode(after, codes, true))));
	}
}

/** A refusal as text: the message thrown, or "ok". */
const refusal = (run: () => unknown): string => {
	try {
		run();
		return "ok";
	} catch (error) {
		return (error as Error).message;
	}
};

/** Everything a seat is shown of the present state, by channel. */
function seatOutput(match: Match, side: Side): Record<string, string> {
	const seat = seatFor(match, side);
	const board = seatBoard(match, side);
	const count = seat.moves.length;
	const refusals = [
		refusal(() => playIndex(match, side, count)),
		refusal(() => playIndex(match, side, 0, { expect: "no such label" })),
		refusal(() => playMove(match, side, "no such label")),
		// A label that stands for several moves on cards the seat cannot see is refused as ambiguous (never played here).
		...[...new Set(seat.moves.filter((name, at) => / \?( |$)/.test(name) && seat.moves.indexOf(name) !== at))].map((name) => refusal(() => playMove(match, side, name))),
		...seat.moves.map((_, index) => refusal(() => playIndex(match, side, index, { zone: 9 }))),
		...seat.moves.map((_, index) => refusal(() => playIndex(match, side, index, { position: "sideways" as "attack" }))),
	];
	return {
		view: JSON.stringify(seat.view),
		moves: JSON.stringify(seat.moves),
		details: JSON.stringify(seat.details),
		log: JSON.stringify(seat.log),
		disputes: JSON.stringify(seat.disputes),
		board: JSON.stringify(board),
		text: renderSeat(board),
		refusals: JSON.stringify(refusals),
	};
}

/** The channels that differ, with both values, as one line each (empty: none). */
function differences(where: string, base: Record<string, string>, varied: Record<string, string>): string[] {
	return Object.keys(base).filter((key) => base[key] !== varied[key]).map((key) => {
		const a = base[key]!;
		const b = varied[key]!;
		let at = 0;
		while (at < a.length && a[at] === b[at]) at++;
		const from = Math.max(0, at - 120);
		return `${where} [${key}] at ${at}\n  base:    ...${a.slice(from, at + 200)}\n  variant: ...${b.slice(from, at + 200)}`;
	});
}

/** Plays a given legal action by its index, as a seat would. */
function playAction(match: Match, side: Side, action: Action): Match | null {
	const index = legalActions(match.duel).findIndex((listed) => takes(listed, action));
	if (index < 0) return null;
	const { zone, position } = action as Placing;
	return playIndex(match, side, index, { ...(zone === undefined ? {} : { zone }), ...(position === undefined ? {} : { position }) });
}

/** What the seat sees of a Duel as engine state (not as output): each card's place, face, position and code if seen; LP, piles, chain, priority, question, battle, Summon, the triggers of cards it sees, winner. */
function publicState(duel: Duel, viewer: Side): string {
	const visible = visibleTo(duel, viewer);
	const cards = Object.values(duel.cards).map(({ id, code, zone, face, position, controller, slot }) => [id, visible.has(id) ? code : HIDDEN, zone, face, position, controller, slot]);
	return JSON.stringify({ cards, piles: duel.piles, lp: duel.lp, turn: duel.turn, chain: duel.chain.map((link) => [link.card.id, link.effect, link.targets]), priority: duel.priority, asking: duel.asking && [duel.asking.player, duel.asking.from], winner: duel.winner, battle: duel.battle, summoning: duel.summoning, waiting: [...duel.waiting, ...(duel.building?.remaining ?? [])].filter((entry) => visible.has(entry.card.id)).map((entry) => [entry.card.id, entry.effect]), building: duel.building !== null });
}

const isOpen = (duel: Duel) => duel.asking !== null || duel.building !== null || duel.chain.length > 0 || duel.summoning !== null || duel.battle !== null;

interface Probe {
	readonly at: string;
	readonly match: Match;
	readonly seen: Seen;
	/** The move played next from this state (the record's, or the generated game's), if any. */
	readonly next: { readonly side: Side; readonly action: Action } | null;
}

/** What the differential found: leaks (unexplained differences) and how much it compared. */
interface Findings {
	readonly leaks: string[];
	compared: number;
	changes: number;
	swapped: number;
	moved: number;
	explained: Record<string, number>;
	/** The situations the sampled states held, per seat (what the comparison exercised). */
	covered: Record<string, number>;
}
/** One line of what a run compared and what it explained (not an assertion: the evidence behind the empty leak list). */
const report = (name: string, found: Findings) => console.log(`${name}: ${JSON.stringify({ compared: found.compared, changes: found.changes, swapped: found.swapped, moved: found.moved, explained: found.explained, covered: found.covered })}`);
const findings = (): Findings => ({ leaks: [], compared: 0, changes: 0, swapped: 0, moved: 0, explained: {}, covered: {} });

/** The situations of a state that a seat's output reads hidden cards near: counted, to say what the comparison exercised. */
function situations(duel: Duel, viewer: Side): string[] {
	const visible = visibleTo(duel, viewer);
	const hiddenAmong = (ids: readonly number[]) => ids.some((id) => !visible.has(id));
	return [
		...(duel.asking?.player === viewer && !duel.asking.zones && !duel.asking.declarations ? ["the seat chooses among cards"] : []),
		...(duel.asking?.player === viewer && !duel.asking.zones && !duel.asking.declarations && hiddenAmong(duel.asking.from) ? ["the seat chooses among cards it cannot see"] : []),
		...(duel.asking?.zones ? ["a zone question"] : []),
		...(duel.chain.length > 0 ? ["a chain"] : []),
		...(duel.chain.some((link) => hiddenAmong(link.targets)) ? ["a chain target the seat cannot see"] : []),
		...(duel.building ? ["triggers being chained"] : []),
		...(duel.waiting.length > 0 ? ["waiting triggers"] : []),
		...(duel.summoning ? ["a Summon attempted"] : []),
		...(duel.battle ? ["a battle"] : []),
		...(duel.modifiers.length + duel.watches.length + duel.delayed.length > 0 ? ["lasting effects"] : []),
		...(Object.values(duel.cards).some((card) => card.zone !== "deck" && card.zone !== "hand" && !visible.has(card.id)) ? ["face-down cards the seat cannot see"] : []),
	];
}

/** The invariant at one state, for both seats, with two variants each; then the next move played in the base and in a variant. */
function check(probe: Probe, found: Findings): void {
	for (const viewer of SIDES) {
		for (const each of situations(probe.match.duel, viewer)) count(found, each);
		const base = seatOutput(probe.match, viewer);
		for (const [kind, pattern] of DETAIL_KINDS) if ((JSON.parse(base.details!) as string[]).some((detail) => pattern.test(detail))) count(found, `detail: ${kind}`);
		for (const seed of [1, 2]) {
			const varied = variant(probe.match.duel, viewer, seed * 7919 + found.compared, probe.seen[viewer]);
			found.compared++;
			found.swapped += varied.swapped.length;
			found.leaks.push(...differences(`${probe.at} seat ${viewer} seed ${seed}`, base, seatOutput({ ...probe.match, duel: varied.duel }, viewer)));
		}
		if (!probe.next) continue;
		// The next move, played in both worlds: the name and notes it logs for the viewer, and the board after, must agree unless the move
		// showed the viewer a card that differs between the worlds (a draw, a flip, a card sent to the Graveyard) or the automatic passes
		// differ (a player with a legal response in one world only: the hidden cards decide who may respond, by design).
		const varied = variant(probe.match.duel, viewer, 104729 + found.compared, probe.seen[viewer], true);
		const explain = (why: string) => void (found.explained[why] = (found.explained[why] ?? 0) + 1);
		const after = playAction(probe.match, probe.next.side, probe.next.action);
		let afterVaried: Match | null;
		try {
			afterVaried = playAction({ ...probe.match, duel: varied.duel }, probe.next.side, probe.next.action);
		} catch (error) {
			// The move's resolution read a card the variant dealt differently and found the world inconsistent (a cost no longer payable).
			if (probe.next.side === viewer) found.leaks.push(`${probe.at}: the viewer's next move fails in a world it cannot tell apart: ${(error as Error).message}`);
			else explain("the next move's resolution reads a swapped card of its player");
			continue;
		}
		if (!after) throw new Error(`${probe.at}: the next move is not legal in the base world`);
		if (!afterVaried) {
			// The other seat's move may use one of its own cards that the variant dealt it differently; the viewer's own moves cannot change.
			if (probe.next.side === viewer) found.leaks.push(`${probe.at}: the viewer's next move is not legal in a world it cannot tell apart`);
			else explain("the next move uses a swapped card of its player");
			continue;
		}
		const shown = (duel: Duel) => {
			const visible = visibleTo(duel, viewer);
			return varied.swapped.some((id) => visible.has(id));
		};
		const entry = after.log.at(-1)!;
		const entryVaried = afterVaried.log.at(-1)!;
		if (shown(after.duel) || shown(afterVaried.duel)) {
			explain("the move showed the viewer a swapped card");
			continue;
		}
		if (JSON.stringify(entry.passes ?? []) !== JSON.stringify(entryVaried.passes ?? [])) {
			explain("automatic passes differ (a legal response in one world only)");
			continue;
		}
		if (publicState(after.duel, viewer) !== publicState(afterVaried.duel, viewer)) {
			explain("the hidden cards changed what the move did (the public state after it differs)");
			continue;
		}
		found.moved++;
		const logged = (each: typeof entry) => ({ name: each.seen[viewer], notes: JSON.stringify(each.notes?.[viewer] ?? []) });
		found.leaks.push(...differences(`${probe.at} next move, seat ${viewer}`, { ...logged(entry), ...seatOutput(after, viewer) }, { ...logged(entryVaried), ...seatOutput(afterVaried, viewer) }));
	}
}

/** The states of a record, replayed move by move: every 5th, every open state (a question, triggers, a chain, a Summon, a battle) and the last. */
function* recordProbes(name: string, found: Findings): Generator<Probe> {
	const rec = record(name);
	let match = openMatch(rec.setup, CARD_DEFS);
	const seen = noneSeen();
	for (let at = 0; at <= rec.log.length; at++) {
		remember(seen, match.duel);
		const entry = rec.log[at];
		if (at % 5 === 0 || isOpen(match.duel) || !entry) yield { at: `${name} move ${at}`, match, seen, next: entry ? { side: entry.side, action: entry.action } : null };
		if (!entry) break;
		const next = playAction(match, entry.side, entry.action);
		if (!next) throw new Error(`${name} move ${at} is not legal where it is replayed`);
		expect(next.log.at(-1)!.seen).toEqual(entry.seen);
		checkChange(`${name} move ${at}`, match.duel, next.duel, entry.action, seen, found);
		match = next;
	}
}

/** A seeded game played by a seeded random policy (mostly not passing), sampled as the records are. */
function* generatedProbes(seed: number, first: Side, length: number, found: Findings): Generator<Probe> {
	let match = openMatch({ seed, first, you: flat(745443), rival: flat(746021) }, CARD_DEFS);
	const pick = createRng(seed);
	const seen = noneSeen();
	for (let at = 0; ; at++) {
		remember(seen, match.duel);
		const side = SIDES.find((each) => seatFor(match, each).toAct);
		if (!side || at >= length) {
			yield { at: `seed ${seed} move ${at}`, match, seen, next: null };
			return;
		}
		const legal = legalActions(match.duel);
		const active = legal.filter((action) => action.type !== "pass");
		const action = active.length > 0 && pick.int(5) > 0 ? active[pick.int(active.length)]! : legal[pick.int(legal.length)]!;
		if (at % 5 === 0 || isOpen(match.duel)) yield { at: `seed ${seed} move ${at}`, match, seen, next: { side, action } };
		const next = playAction(match, side, action)!;
		checkChange(`seed ${seed} move ${at}`, match.duel, next.duel, action, seen, found);
		match = next;
	}
}

describe("the seat output depends only on what the seat can see (differential)", () => {
	it("generated seeded games: sampled states give each seat the same output in every world it cannot tell apart", () => {
		const found = findings();
		// Seed 41 with the rival first reaches, at move 41, a zone question whose preview once read the opponent's hidden hand.
		for (const [seed, first, length] of [[5, "you", 150], [41, "rival", 45]] as const) for (const probe of generatedProbes(seed, first, length, found)) check(probe, found);
		report("generated", found);
		expect(found.leaks).toEqual([]);
	});

	for (const name of ["duel-001", "duel-003"]) {
		it(`${name}: sampled states give each seat the same output in every world it cannot tell apart`, () => {
			const found = findings();
			for (const probe of recordProbes(name, found)) check(probe, found);
			report(name, found);
			expect(found.leaks).toEqual([]);
		});
	}
});

/* ------------------------------------------------------------------------------------------------------------------------------ *
 * Targeted states: one per channel the games above may not reach (a seat choosing among cards it cannot see, a chain target it cannot
 * see, effects in force from a card it cannot see, a trigger waiting for a card it cannot see, a placement's dry-run, a cost that
 * reveals, a Summon being attempted, an attack on a face-down monster, a hand-size discard), each run through the same differential.
 * ------------------------------------------------------------------------------------------------------------------------------ */

/** Sky Striker 745443 ("you", first) against Blue-Eyes 746021. */
const SETUP = { seed: 1, you: flat(745443), rival: flat(746021) };
/** A rival with different hidden cards of each kind, so that a variant changes something. */
const RIVAL = { hand: ["true-light", "raigeki", "fixture-big"], deck: ["infinite-impermanence", "mystical-space-typhoon", "fixture-trap", "fixture-filler", "pot-of-greed", "majesty-of-the-white-dragons"] };
const at = (duel: Duel): Match => ({ setup: SETUP, duel, log: [], disputes: [] });
const passTo = (match: Match, done: (match: Match) => boolean): Match => {
	for (let guard = 0; guard < 80 && !done(match); guard++) match = playMove(match, SIDES.find((side) => seatFor(match, side).toAct)!, "pass");
	return match;
};
const mainPhase = () => passTo(openMatch(SETUP, CARD_DEFS), (match) => match.duel.turn.phase === "main1");

/** A probe of one state; the move played next is the first legal move of whoever decides (when someone does). */
function probeOf(name: string, match: Match): Probe {
	const seen = noneSeen();
	remember(seen, match.duel);
	const side = SIDES.find((each) => seatFor(match, each).toAct);
	return { at: name, match, seen, next: side ? { side, action: legalActions(match.duel)[0]! } : null };
}

function targetedProbes(): Probe[] {
	const probes: Probe[] = [];
	// Zero's resolution choice: the chooser's own Deck card is named, the opponent's Set card is not.
	{
		let duel = ssBoard({ extraZone: ["sky-striker-ace-zero"], deck: ["sky-striker-ace-raye"], graveyard: ["sky-striker-ace-roze"] }, { ...RIVAL, set: ["majesty-of-the-white-dragons", "fixture-trap"] });
		duel = ssResolve(play(duel, "activate sky-striker-ace-zero"));
		while (duel.asking?.zones) duel = play(duel, `place ${duel.asking.from[0]}`);
		probes.push(probeOf("Zero's choice among a Deck card and a Set card", at(play(duel, "choose sky-striker-ace-zero"))));
	}
	// A choice among the opponent's Set cards, then among cards of every place (own Deck, Graveyard, the opponent's hand, Deck, face-down banished, Set).
	{
		const duel = ssBoard({ hand: ["raigeki"], deck: ["mystical-space-typhoon", "pot-of-greed"], graveyard: ["pot-of-greed"] }, { ...RIVAL, set: ["majesty-of-the-white-dragons", "true-light"] });
		probes.push(probeOf("a choice among Set cards", at(ask(duel, "you", duel.piles.rival.spell, (board, id) => moveCard(board, id, { zone: "banished", face: "down" })))));
		const banished = moveCards(duel, duel.piles.rival.deck.slice(0, 2), { zone: "banished", face: "down" });
		const { you, rival } = banished.piles;
		probes.push(probeOf("a choice among cards of every place", at(ask(banished, "you", [...you.hand, ...you.deck, ...you.graveyard, ...rival.hand, ...rival.deck.slice(0, 2), ...rival.banished, ...rival.spell], (board) => board))));
	}
	// A chain whose target is a Set card the activating seat cannot see, and one whose target is a face-down banished card.
	{
		const duel = ssBoard({ hand: ["mystical-space-typhoon"] }, { ...RIVAL, set: ["true-light", "fixture-trap"] });
		probes.push(probeOf("a chain targeting a Set card", at(act(duel, legalActions(duel).find((action) => action.type === "activate")!))));
		const aimBanished: CardDef = { code: "fixture-banished-aim", kind: "quick-play", effects: [{ type: "activation", target: (board, { player }) => board.piles[other(player)].banished, operation: (board) => board }] };
		let banished = ssBoard({ hand: ["mystical-space-typhoon"] }, RIVAL);
		const mine = banished.piles.you.hand[0]!;
		banished = { ...banished, defs: { ...banished.defs, [aimBanished.code]: aimBanished }, cards: { ...banished.cards, [mine]: { ...banished.cards[mine]!, code: aimBanished.code } } };
		banished = moveCards(banished, banished.piles.rival.deck.slice(0, 3), { zone: "banished", face: "down" });
		probes.push(probeOf("a chain targeting a face-down banished card", at(act(banished, legalActions(banished).find((action) => action.type === "activate")!))));
	}
	// Effects in force from a card the other seat cannot see: a modifier on a monster, a lock, a watch and a delayed effect.
	{
		const match = playMove(mainPhase(), "you", "summon sky-striker-ace-raye");
		const raye = match.duel.piles.you.monster[0]!;
		const source = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		const by = { card: source, player: "you" as const, effect: 0 };
		let duel = addModifier(match.duel, { affects: { card: raye, moves: match.duel.cards[raye]!.moves }, until: 1, by, layer: { kind: "add", stat: "atk", by: 500 } });
		duel = addModifier(duel, { affects: () => false, until: 1, by, layer: { kind: "lock", what: "activate", who: "rival", stops: () => true, describe: "Spell Cards" } });
		duel = watch(duel, by, { until: 1, event: () => false, apply: (board) => board });
		duel = delay(duel, by, { due: { phase: "end", turn: 1 }, mandatory: true, apply: (board) => board });
		probes.push(probeOf("effects in force from a hand card", { ...match, duel }));
	}
	// Trigger Effects waiting for a card in each hand (as hand triggers would).
	{
		const match = mainPhase();
		const event = { type: "phase" as const, phase: "draw" as const, player: "you" as const };
		const waiting = [match.duel.piles.rival.hand[0]!, match.duel.piles.you.hand[0]!].map((id) => ({ card: match.duel.cards[id]!, effect: 0, event }));
		probes.push(probeOf("triggers waiting for hand cards", { ...match, duel: { ...match.duel, waiting } }));
	}
	// A placement whose dry-run would show a hidden card; a cost that reveals a card of the hand.
	{
		const duel = ssBoard({ hand: ["raigeki"] }, RIVAL);
		const id = duel.piles.rival.deck[0]!;
		probes.push(probeOf("a zone question placing a Deck card", at(askZone(duel, "you", [0, 1], (board, slot) => moveCard(board, id, { zone: "spell", slot, face: "up" })))));
		const reveal: CardDef = { code: "fixture-priv-reveal", kind: "spell", effects: [{ type: "activation", cost: { pick: (board, { player }) => board.piles[player].hand.map((each) => [each]), pay: (board, { player }, picked) => revealCards(board, player, picked) }, operation: (board) => board }] };
		const setup = { ...SETUP, you: { deck: Array<string>(8).fill(reveal.code) } };
		probes.push(probeOf("a cost that reveals a hand card", passTo(openMatch(setup, { ...CARD_DEFS, [reveal.code]: reveal }), (match) => match.duel.turn.phase === "main1")));
	}
	// A Summon being attempted (every window shown): the opponent is asked whether to answer it.
	{
		let match = passTo(openMatch({ ...SETUP, options: { everyWindow: true } }, CARD_DEFS), (each) => each.duel.turn.phase === "main1");
		match = playMove(playMove(match, "you", "summon sky-striker-ace-raye"), "you", "pass");
		probes.push(probeOf("a Summon being attempted", match));
	}
	// An attack on a face-down monster, in the Battle Phase.
	{
		const duel = ssBoard({ monsters: ["fixture-big"] }, { ...RIVAL, facedown: ["fixture-filler"] }, {}, "you", "battle");
		probes.push(probeOf("the Battle Phase with a face-down monster", at(duel)));
		const attack = legalActions(duel).find((action) => action.type === "attack" && action.target !== null);
		if (attack) probes.push(probeOf("an attack on a face-down monster", at(act(duel, attack))));
	}
	// A hand-size discard at the end of a turn.
	{
		const match = passTo(openMatch(SETUP, CARD_DEFS), (each) => each.duel.asking !== null || each.duel.turn.number > 6);
		if (match.duel.asking) probes.push(probeOf("a hand-size discard", match));
	}
	return probes;
}

describe("targeted channels give each seat the same output in every world it cannot tell apart", () => {
	it("each targeted state, both seats, two variants each, then its next move in both worlds", () => {
		const found = findings();
		const probes = targetedProbes();
		for (const probe of probes) {
			check(probe, found);
			if (probe.next) checkChange(probe.at, probe.match.duel, playAction(probe.match, probe.next.side, probe.next.action)!.duel, probe.next.action, probe.seen, found);
		}
		report("targeted", found);
		expect(found.leaks).toEqual([]);
		expect(probes).toHaveLength(13);
		for (const situation of ["the seat chooses among cards it cannot see", "a chain target the seat cannot see", "waiting triggers", "a Summon attempted", "a battle", "lasting effects", "a zone question"]) expect(found.covered[situation]).toBeGreaterThan(0);
	});

	it("disputes: the other seat's claim and ruling texts do not reach a seat; its own dispute reads the same in both worlds", () => {
		const match = mainPhase();
		const [first, second] = match.duel.piles.rival.hand.map((id) => match.duel.cards[id]!.code);
		const disputed = (claim: string, decision: string): Match => {
			let next = raiseDispute(raiseDispute(match, "rival", claim), "you", "Can Raye be answered here?");
			next = settleDispute(next, 0, { decision, via: "konami", sources: [`Q&A about ${decision}`] });
			return raiseDispute(next, "rival", `${claim} (again)`);
		};
		const a = disputed(`My hand holds ${first}`, `${first}: yes`);
		const b = disputed(`My hand holds ${second} and ${first}`, `${second}: no`);
		expect(differences("disputes, seat you", seatOutput(a, "you"), seatOutput(b, "you"))).toEqual([]);
		// The raiser reads its own claims, which differ: the comparison above is not vacuous.
		expect(seatOutput(a, "rival").disputes).not.toEqual(seatOutput(b, "rival").disputes);
	});
});

/* ------------------------------------------------------------------------------------------------------------------------------ *
 * The local driver (`runCli`), end to end over saved records: two worlds whose setups differ only in the order of the rival's Deck list
 * (the same seed then deals the rival other cards; the ids of "you"'s cards and its whole deal stay the same). Every window is shown, so
 * the rival's hidden cards never decide who may respond, and the rival only passes. Everything "you" is printed must be byte-identical
 * as long as no rival card the two worlds deal differently has been shown to "you".
 * ------------------------------------------------------------------------------------------------------------------------------ */

describe("the local driver prints a seat the same thing in two worlds it cannot tell apart", () => {
	it("show (JSON and text), move (compact, --json), the refusals and dispute, over a dozen moves", () => {
		const dir = mkdtempSync(join(tmpdir(), "hidden-information-"));
		try {
			const rival = flat(746021);
			const lists = [rival.deck, [...rival.deck].reverse()];
			let start = openMatch({ seed: 21, you: flat(745443), rival, options: { everyWindow: true } }, CARD_DEFS);
			start = passTo(start, (match) => match.duel.turn.phase === "main1");
			const files = lists.map((deck, world) => {
				const file = join(dir, `world-${world}.json`);
				writeFileSync(file, JSON.stringify(matchRecord({ ...start, setup: { ...start.setup, rival: { ...rival, deck } } })));
				return file;
			});
			const cli = (args: readonly string[]): string => {
				try {
					return runCli(args, CARD_DEFS);
				} catch (error) {
					return `refused: ${(error as Error).message}`;
				}
			};
			const both = (args: (file: string) => readonly string[]) => files.map((file) => cli(args(file)));
			const leaks: string[] = [];
			const same = (what: string, outputs: readonly string[]) => leaks.push(...differences(what, { out: outputs[0]! }, { out: outputs[1]! }));
			const replayed = () => files.map((file) => replayMatch(JSON.parse(readFileSync(file, "utf8")) as MatchRecord, CARD_DEFS));
			// The worlds really differ: the rival holds other cards.
			expect(seatFor(replayed()[0]!, "rival").view.players.rival.hand).not.toEqual(seatFor(replayed()[1]!, "rival").view.players.rival.hand);
			const pick = createRng(21);
			let steps = 0;
			for (; steps < 12; steps++) {
				const [one, two] = replayed();
				if (publicState(one!.duel, "you") !== publicState(two!.duel, "you") || one!.duel.winner || one!.duel.asking?.player === "rival") break;
				same(`step ${steps} show`, both((file) => ["show", file, "you"]));
				same(`step ${steps} show --text`, both((file) => ["show", file, "you", "--text"]));
				same(`step ${steps} index refused`, both((file) => ["move", file, "you", "99"]));
				same(`step ${steps} label refused`, both((file) => ["move", file, "you", "0", "--expect", "no such label"]));
				const moves = seatFor(one!, "you").moves;
				if (moves.length > 0) {
					const active = moves.flatMap((name, index) => (name === "pass" ? [] : [index]));
					const index = active.length > 0 && pick.int(4) > 0 ? active[pick.int(active.length)]! : pick.int(moves.length);
					same(`step ${steps} move ${moves[index]}`, both((file) => ["move", file, "you", String(index)]));
				} else {
					both((file) => ["move", file, "rival", "0", "--expect", "pass"]);
				}
			}
			expect(steps).toBeGreaterThanOrEqual(8);
			same("move --json", both((file) => ["move", file, "you", "0", "--json"]));
			same("dispute by you", both((file) => ["dispute", file, "you", "Is this window right?"]));
			const rivalHands = replayed().map((match) => match.duel.cards[match.duel.piles.rival.hand[0]!]!.code);
			files.forEach((file, world) => runCli(["dispute", file, "rival", `I hold ${rivalHands[world]}`], CARD_DEFS));
			same("show after the rival's dispute", both((file) => ["show", file, "you", "--text"]));
			expect(leaks).toEqual([]);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
