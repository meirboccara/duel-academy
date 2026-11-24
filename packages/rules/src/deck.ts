import { type CardInstance, cardsIn, type Duel, moveCards, type Side, type Zone } from "./duel";
import { ask } from "./effects";
import { raiseEvent } from "./events";
import { createRng, type Rng } from "./rng";

/**
 * Real-deck readiness (step 4 work): Deck operations, reveals and Life Points gained. Every random choice is drawn from the Duel's
 * seeded RNG (`Duel.rng`), whose state moves on with it, so a Duel replayed from the same setup and actions shuffles and picks the same
 * way (spec: "all randomness comes from the board's seeded RNG").
 */

/** Runs `use` with the Duel's RNG and returns the Duel with the RNG moved on. */
function withRng<T>(duel: Duel, use: (rng: Rng) => T): { readonly duel: Duel; readonly value: T } {
	const rng = createRng(duel.rng.seed, duel.rng.state);
	const value = use(rng);
	return { duel: { ...duel, rng: { seed: duel.rng.seed, state: rng.state } }, value };
}

/**
 * Shuffles a player's Deck with the Duel's RNG. The cards stay the same cards (a shuffle is not a move: `moves` is unchanged and no
 * `moved` event is raised); what was revealed of that Deck is hidden again.
 */
export function shuffleDeck(duel: Duel, side: Side): Duel {
	const deck = [...duel.piles[side].deck];
	if (deck.length < 2) return forgetDeckReveals(duel, side);
	const { duel: next } = withRng(duel, (rng) => {
		for (let i = deck.length - 1; i > 0; i--) {
			const j = rng.int(i + 1);
			[deck[i], deck[j]] = [deck[j]!, deck[i]!];
		}
	});
	return forgetDeckReveals({ ...next, piles: { ...next.piles, [side]: { ...next.piles[side], deck } } }, side);
}

/** Shuffles the Deck of every owner among `cards` that is now in its Deck ("shuffle them into the Deck"). */
export function shuffleDecksOf(duel: Duel, cards: readonly number[]): Duel {
	const owners = new Set(cards.filter((id) => duel.cards[id]!.zone === "deck").map((id) => duel.cards[id]!.owner));
	return [...owners].reduce(shuffleDeck, duel);
}

/**
 * Picks `count` different cards of `from` at random ("discard 1 random card", "a random card from your Deck"), with the Duel's RNG. Fewer
 * candidates than `count`: all of them. The Duel returned has the RNG moved on; nothing is moved.
 */
export function pickRandom(duel: Duel, from: readonly number[], count = 1): { readonly duel: Duel; readonly picked: readonly number[] } {
	const left = [...new Set(from)];
	if (left.length === 0 || count <= 0) return { duel, picked: [] };
	const { duel: next, value } = withRng(duel, (rng) => {
		const picked: number[] = [];
		while (picked.length < count && left.length > 0) picked.push(left.splice(rng.int(left.length), 1)[0]!);
		return picked;
	});
	return { duel: next, picked: value };
}

/** A card shown to both players, known while it stays where it was shown: same `moves`, same zone, and in a Deck the same place in it. */
export interface Revealed {
	readonly id: number;
	readonly moves: number;
	readonly zone: Zone;
	/** In a Deck: its place from the top when revealed (a draw from above it, a shuffle or a new order hides it again). */
	readonly at: number | null;
}

/**
 * Reveals cards to both players (a cost, or part of an effect: "reveal 1 card in your hand"): a public `revealed` event, and the cards are
 * known to both players while they stay where they were revealed (`viewFor` shows them; a re-dealt world keeps them).
 */
export function revealCards(duel: Duel, player: Side, ids: readonly number[]): Duel {
	if (ids.length === 0) return duel;
	const shown = ids.map((id) => duel.cards[id]!);
	const entries = shown.map((card): Revealed => ({ id: card.id, moves: card.moves, zone: card.zone, at: card.zone === "deck" ? duel.piles[card.owner].deck.indexOf(card.id) : null }));
	// Reveals that no longer hold are dropped as new ones come, so the list stays small.
	const kept = duel.revealed.filter((entry) => stillRevealed(duel, entry) && !ids.includes(entry.id));
	return raiseEvent({ ...duel, revealed: [...kept, ...entries] }, { type: "revealed", player, cards: shown });
}

/** Is the card still where it was revealed? */
export function stillRevealed(duel: Duel, entry: Revealed): boolean {
	const card = duel.cards[entry.id]!;
	if (card.moves !== entry.moves || card.zone !== entry.zone) return false;
	return entry.at === null || duel.piles[card.owner].deck[entry.at] === card.id;
}

/** The ids of the cards revealed that are still where they were revealed. */
export const revealedNow = (duel: Duel): number[] => duel.revealed.filter((entry) => stillRevealed(duel, entry)).map((entry) => entry.id);

function forgetDeckReveals(duel: Duel, side: Side): Duel {
	const kept = duel.revealed.filter((entry) => !(entry.zone === "deck" && duel.cards[entry.id]!.owner === side));
	return kept.length === duel.revealed.length ? duel : { ...duel, revealed: kept };
}

/**
 * "Excavate the top N cards of your Deck": they are revealed to both players and stay on top of the Deck until the effect does something
 * with them. Returns the Duel and the cards (from the top); fewer when the Deck has fewer.
 */
export function excavate(duel: Duel, side: Side, count: number): { readonly duel: Duel; readonly cards: readonly number[] } {
	const cards = duel.piles[side].deck.slice(0, Math.max(0, count));
	return { duel: revealCards(duel, side, cards), cards };
}

/**
 * "Place them on the bottom of the Deck in any order": the player picks the cards one at a time (`choose`); each goes to the bottom
 * under the ones before it, so the last one picked is the bottom card. The last card is placed without asking. `then` goes on after.
 * The cards are placed at the same time (one batch) once the order is chosen.
 */
export function askBottomOrder(duel: Duel, player: Side, ids: readonly number[], then: (duel: Duel) => Duel = (board) => board): Duel {
	const step = (board: Duel, order: readonly number[]): Duel => {
		const left = ids.filter((id) => !order.includes(id));
		if (left.length <= 1) return then(moveCards(board, [...order, ...left], { zone: "deck", at: "bottom" }));
		return ask(board, player, left, (next, picked) => step(next, [...order, picked]));
	};
	return step(duel, []);
}

/** The cards of a player's Deck, from the top (a convenience over `cardsIn`). */
export const deckCards = (duel: Duel, side: Side): CardInstance[] => cardsIn(duel, side, "deck");

/**
 * Gains Life Points ("your opponent gains 1000 LP"): a public `lp-gained` event, which a card worded "when ... gains LP" can answer.
 * Damage by an effect is `loseLp` (src/life.ts), the same loss as battle damage, which decides the Duel at 0; paying LP is `payLp`.
 */
export function gainLp(duel: Duel, side: Side, amount: number): Duel {
	if (amount <= 0) return duel;
	return raiseEvent({ ...duel, lp: { ...duel.lp, [side]: duel.lp[side] + amount } }, { type: "lp-gained", player: side, amount });
}
