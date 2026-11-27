import { askUpTo } from "./choices";
import { type Due, delay } from "./delayed";
import { type CardInstance, changeControl, destroyCard, type Duel, type Face, freeSlots, moveCard, moveCardHeld, moveCards, other, type Position, type Side, type Zone } from "./duel";
import { askZone } from "./effects";
import { type GameEvent, raiseEvent } from "./events";
import type { EffectSource } from "./modifiers";

/**
 * Temporary banishment: "banish it until the End Phase", "until your opponent's next End Phase", "banish this card (until the End
 * Phase)" (S:P Little Knight, Sky Striker Ace - Zeke, Ecclesia and the Dark Dragon). Konami's Japanese notes on those cards and Q&A
 * (OCG only; the records are in src/sky-striker-gap-sources.ts):
 *
 * - The monster is banished face-up, or face-down when it is face-down (`temporary-banishment-face-down`). A monster unaffected by the
 *   effect stays, and the others are still banished (`temporary-banishment-unaffected-stays`).
 * - It comes back in the phase named (`due`) as a mandatory process of the effect's player, with no Chain Link, and it is not a Summon
 *   (`temporary-banishment-return`, `temporary-banishment-not-a-summon`): a delayed effect (`delay`, src/delayed.ts), applied by that
 *   player with an `apply` action when they hold priority in that phase, around their other effects of the phase (fid 11533).
 * - It goes to a Main Monster Zone of the player who controlled it when it was banished, that player choosing the zone
 *   (`temporary-banishment-zone-chosen-by-controller`), in the battle position and with the face it had.
 * - The monsters banished by one effect come back at the same time: each player's zones are chosen first, then all are placed, their
 *   `moved` events sharing one batch (`temporary-banishment-return-together`). A monster that cannot come back (no free Main Monster
 *   Zone) is placed in its owner's Graveyard, which is not "sent to the GY" (`temporary-banishment-placed-not-sent`,
 *   `temporary-banishment-no-zone-graveyard`); with fewer zones than monsters, their player picks which come back
 *   (`temporary-banishment-one-zone-pick`).
 * - Back on the field it is a new card (its `moves` and `fieldEntries` changed): an effect applied to it before no longer is, its
 *   once-per-turn uses are new, and it has not "stayed face-up since it was Summoned" (`summonedTurn` is 0:
 *   `summoned-this-turn-needs-face-up-since`). It is still properly Summoned, a Special Summoned monster and "Special Summoned from the
 *   Extra Deck" if it was (`from-extra-deck-kept-through-temporary-banishment`).
 * - A control change with a duration ("until the End Phase") ends with the banishment: the monster comes back to the player who
 *   controlled it when it was banished and goes to its previous controller at once; a control change with no duration is kept
 *   (`temporary-banishment-control-with-duration-ends`, `temporary-banishment-control-without-duration-kept`).
 *
 * The core's own readings (no page read): only a free Main Monster Zone decides whether a monster "can come back" (an effect that
 * limits how many monsters a player may control is not asked); when the monsters of both players come back, the turn player chooses
 * first; the player who picks which of several monsters comes back is the one whose zones they return to (fid 24029 has one player);
 * a face-up and a face-down monster banished by one effect are two groups of moves, one after the other.
 */

/** One monster banished temporarily: the card as it is while banished, and what it comes back with. */
interface Gone {
	readonly id: number;
	/** Its `moves` while banished: once it has moved again, it is no longer the card that was banished, and does not come back. */
	readonly moves: number;
	/** The player who controlled it when it was banished: it comes back to their field. */
	readonly controller: Side;
	readonly face: Face;
	readonly position: Position;
	readonly specialSummoned: boolean;
	readonly summonedFrom: Zone | null;
	/** It was held by a control change with a duration: the player it goes back to at once when it returns. */
	readonly giveBackTo?: Side;
}

const mark = (duel: Duel, id: number, change: Partial<CardInstance>): Duel => ({ ...duel, cards: { ...duel.cards, [id]: { ...duel.cards[id]!, ...change } } });

/**
 * The effect `by` (the resolving link) banishes these monsters until `due`: "until the End Phase" is `{ phase: "end", turn:
 * duel.turn.number }`, "until your opponent's next End Phase" `{ phase: "end", turn: nextPhaseTurn(duel, "end", other(player)) }`.
 * Only monsters in a Monster Zone are banished; one that is unaffected by `by` stays. They come back together in that phase (see the
 * module's notes). An "and if you do" reads the card afterwards (`duel.cards[id].zone === "banished"`).
 */
export function banishTemporarily(duel: Duel, ids: readonly number[], by: EffectSource, due: Due): Duel {
	const monsters = [...new Set(ids)].map((id) => duel.cards[id]!).filter((card) => card.zone === "monster");
	if (monsters.length === 0) return duel;
	const source: EffectSource = { card: by.card, player: by.player, ...(by.effect === undefined ? {} : { effect: by.effect }) };
	// A control change with a duration that holds the monster ends with the banishment (fid 17476, case B).
	const heldBy = (card: CardInstance) => duel.modifiers.find((modifier) => modifier.layer.kind === "control" && typeof modifier.affects !== "function" && modifier.affects.card === card.id && modifier.affects.moves === card.moves);
	let next = duel;
	for (const face of ["up", "down"] as const) next = moveCards(next, monsters.filter((card) => card.face === face).map((card) => card.id), { zone: "banished", face, effect: source });
	const gone: Gone[] = [];
	for (const card of monsters) {
		const now = next.cards[card.id]!;
		if (now.zone !== "banished" || now.moves === card.moves) continue;
		const held = heldBy(card);
		if (held) next = { ...next, modifiers: next.modifiers.filter((modifier) => modifier !== held) };
		gone.push({ id: card.id, moves: now.moves, controller: card.controller, face: card.face, position: card.position, specialSummoned: card.specialSummoned, summonedFrom: card.summonedFrom, ...(held && held.layer.kind === "control" ? { giveBackTo: held.layer.to } : {}) });
	}
	if (gone.length === 0) return next;
	const still = (board: Duel): Gone[] => gone.filter((entry) => board.cards[entry.id]!.zone === "banished" && board.cards[entry.id]!.moves === entry.moves);
	return delay(next, source, { due, mandatory: true, condition: (board) => still(board).length > 0, apply: (board) => comeBack(board, still(board)) });
}

/** A monster coming back: its zone is chosen. */
interface Return {
	readonly entry: Gone;
	readonly slot: number;
}

/**
 * The monsters come back: for each player (the turn player first), which of theirs come back when there are fewer free Main Monster
 * Zones than monsters, and the zone of each; then all are placed at the same time, the others are placed in the Graveyard, and a
 * monster that was held by a control change with a duration goes to its previous controller.
 */
function comeBack(duel: Duel, gone: readonly Gone[]): Duel {
	const sides: readonly Side[] = [duel.turn.player, other(duel.turn.player)];
	const plan = (board: Duel, at: number, returns: readonly Return[], lost: readonly Gone[]): Duel => {
		const side = sides[at];
		if (side === undefined) return land(board, returns, lost);
		const theirs = gone.filter((entry) => entry.controller === side);
		const free = freeSlots(board, side, "monster");
		const room = Math.min(theirs.length, free.length);
		return askUpTo(board, side, theirs.map((entry) => entry.id), { min: room, max: room }, (chosen, picked) => {
			const back = theirs.filter((entry) => picked.includes(entry.id));
			const rest = theirs.filter((entry) => !picked.includes(entry.id));
			return zones(chosen, side, back, free, [], (placed, found) => plan(placed, at + 1, [...returns, ...found], [...lost, ...rest]));
		});
	};
	return plan(duel, 0, [], []);
}

/** The player chooses a zone for each of their monsters in turn, among the zones not yet given. */
function zones(duel: Duel, side: Side, entries: readonly Gone[], free: readonly number[], found: readonly Return[], then: (duel: Duel, found: readonly Return[]) => Duel): Duel {
	const entry = entries[found.length];
	if (entry === undefined) return then(duel, found);
	const left = free.filter((slot) => !found.some((taken) => taken.slot === slot));
	return askZone(duel, side, left, (board, slot) => zones(board, side, entries, free, [...found, { entry, slot }], then));
}

/** Every zone is chosen: the monsters are placed at the same time (one batch), then their events are raised. */
function land(duel: Duel, returns: readonly Return[], lost: readonly Gone[]): Duel {
	const batch = duel.batches + 1;
	let next: Duel = { ...duel, batches: batch };
	const events: GameEvent[] = [];
	for (const { entry, slot } of returns) {
		const placed = moveCardHeld(next, entry.id, { zone: "monster", controller: entry.controller, slot, face: entry.face, position: entry.face === "down" ? "defense" : entry.position }, batch);
		// Not a Summon, but still the Special Summoned monster it was, from where it was Summoned (fid 16743, case B).
		next = mark(placed.duel, entry.id, { specialSummoned: entry.specialSummoned, summonedFrom: entry.face === "up" ? entry.summonedFrom : null });
		const now = next.cards[entry.id]!;
		for (const event of placed.events) events.push(event.type === "moved" && event.after.id === entry.id ? { ...event, after: now } : event);
	}
	// A monster with no zone to come back to is placed in the Graveyard: not sent there, so nothing is raised (fids 24001, 24029).
	for (const entry of lost) next = moveCard(next, entry.id, { zone: "graveyard", placed: true });
	for (const event of events) next = raiseEvent(next, event);
	return handBack(next, returns.map((back) => back.entry).filter((entry) => entry.giveBackTo !== undefined));
}

/**
 * A control change with a duration ended while the monster was banished: back on the field, it goes to its previous controller at
 * once, who chooses the zone (fid 17476, case B). With no free Main Monster Zone there it is destroyed, as for any control given back
 * (YGOProJudge only, see `returnControl` in src/modifiers.ts).
 */
function handBack(duel: Duel, entries: readonly Gone[]): Duel {
	const [entry, ...rest] = entries;
	if (!entry) return duel;
	const card = duel.cards[entry.id]!;
	const to = entry.giveBackTo!;
	if (card.zone !== "monster" || card.controller === to) return handBack(duel, rest);
	const free = freeSlots(duel, to, "monster");
	if (free.length === 0) return handBack(destroyCard(duel, card.id, { destruction: { cause: "game-mechanic" } }), rest);
	return askZone(duel, to, free, (board, slot) => handBack(changeControl(board, card.id, to, slot), rest));
}
