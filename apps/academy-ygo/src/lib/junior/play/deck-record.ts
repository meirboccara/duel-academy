import { inExtraDeck, type CardId } from "@duel-academy/engine";
import { CARDS } from "@duel-academy/cards";
import { EXTRA_DECK, MAIN_DECK, MOST_COPIES, copiesAllowed, deckProblems, type Deck } from "./masters";
import { PAST_STARTER_CARDS, STARTER_EDITION, STARTERS, STARTER_IDS, type StarterId } from "./starters";

/**
 * The child's Deck for the masters' island, beside the save's play record under its own key (the play record's format
 * never changes). Empty until a starter deck is chosen; then the child edits it freely with the cards of the binder.
 */
export interface DeckRecord {
	starter: StarterId | null;
	main: CardId[];
	extra: CardId[];
	/** The edition of the starter Decks the child last saw (starters.ts `STARTER_EDITION`); 1 for a Deck saved before editions. */
	edition?: number;
}
export const NO_DECK: DeckRecord = { starter: null, main: [], extra: [] };
export const deckKeyFor = (playKey: string) => `${playKey}:deck`;

const isCard = (card: unknown): card is CardId => typeof card === "string" && card in CARDS;
/** Forgiving: a missing or broken record is "no deck yet"; unknown cards are dropped. */
export function parseDeck(raw: unknown): DeckRecord {
	const data = (typeof raw === "object" && raw !== null ? raw : {}) as { starter?: unknown; main?: unknown; extra?: unknown; edition?: unknown };
	const starter = STARTER_IDS.find((id) => id === data.starter) ?? null;
	if (!starter) return { ...NO_DECK };
	const list = (value: unknown) => (Array.isArray(value) ? value.filter(isCard) : []);
	const edition = typeof data.edition === "number" && Number.isInteger(data.edition) && data.edition > 0 ? data.edition : 1;
	return { starter, main: list(data.main), extra: list(data.extra), edition };
}
export function loadDeck(storage: Pick<Storage, "getItem"> | undefined | null, key: string): DeckRecord {
	try {
		const raw = storage?.getItem(key);
		return raw ? parseDeck(JSON.parse(raw)) : { ...NO_DECK };
	} catch {
		return { ...NO_DECK };
	}
}
export function saveDeck(storage: Pick<Storage, "setItem"> | undefined | null, key: string, record: DeckRecord): boolean {
	try {
		storage?.setItem(key, JSON.stringify({ version: 1, ...record }));
		return !!storage;
	} catch {
		return false;
	}
}
/** Choosing a starter: its deck becomes the child's, and its cards join the binder. */
export const startWith = (starter: StarterId): DeckRecord => ({ starter, main: [...STARTERS[starter].deck.main], extra: [...STARTERS[starter].deck.extra], edition: STARTER_EDITION });
/** The cards of the starter chosen: they are in the binder from then on. */
export const starterCards = (record: DeckRecord): CardId[] =>
	record.starter ? [...new Set([...STARTERS[record.starter].deck.main, ...STARTERS[record.starter].deck.extra, ...PAST_STARTER_CARDS[record.starter]])] : [];
/**
 * A newer edition of the child's starter Deck: the cards it brings that the child's Deck does not have, to show when it
 * is offered. Null when there is nothing new to offer (no starter yet, or this edition already seen).
 */
export function starterUpdate(record: DeckRecord): { starter: StarterId; added: CardId[] } | null {
	if (!record.starter || (record.edition ?? 1) >= STARTER_EDITION) return null;
	const mine = new Set([...record.main, ...record.extra]);
	const fresh = STARTERS[record.starter].deck;
	return { starter: record.starter, added: [...new Set([...fresh.main, ...fresh.extra])].filter((card) => !mine.has(card)) };
}
/** The child keeps their own Deck: the new edition is not offered again. */
export const keepOwnDeck = (record: DeckRecord): DeckRecord => ({ ...record, edition: STARTER_EDITION });

/** The cards of the binder that can go in a deck: real cards the rules engine plays, owned by the child. */
export const deckable = (binder: readonly string[]): CardId[] => [...new Set(binder.filter(isCard))];
/** How many copies of a card are in the deck, Main and Extra together. */
export const copiesOf = (deck: Deck, card: CardId) => [...deck.main, ...deck.extra].filter((item) => item === card).length;
/** Adds a copy where it belongs (Extra Deck monsters to the Extra Deck), within the limits; the same deck when it cannot. */
export function addCard(deck: DeckRecord, card: CardId): DeckRecord {
	if (copiesOf(deck, card) >= Math.min(MOST_COPIES, copiesAllowed(card))) return deck;
	if (inExtraDeck(card)) return deck.extra.length >= EXTRA_DECK ? deck : { ...deck, extra: [...deck.extra, card] };
	return deck.main.length >= MAIN_DECK ? deck : { ...deck, main: [...deck.main, card] };
}
/** Takes one copy out. */
export function removeCard(deck: DeckRecord, card: CardId): DeckRecord {
	const from = inExtraDeck(card) ? deck.extra : deck.main;
	const at = from.lastIndexOf(card);
	if (at < 0) return deck;
	const rest = from.filter((_, index) => index !== at);
	return inExtraDeck(card) ? { ...deck, extra: rest } : { ...deck, main: rest };
}
/**
 * A Deck saved before the starter Decks or the banlist changed can hold cards the binder no longer has, or too many
 * copies of a now Limited or Forbidden card: it becomes the chosen starter's new Deck. Any other Deck stays as it is.
 */
export function refreshDeck(deck: DeckRecord, owned: ReadonlySet<string>): DeckRecord {
	if (!deck.starter) return deck;
	const problems = deckProblems(deck, owned);
	return problems.includes("not-owned") || problems.includes("banlist") ? startWith(deck.starter) : deck;
}
/** Ready to duel: a starter was chosen and the deck follows the rules with cards the child owns. */
export const deckReady = (deck: DeckRecord, owned: ReadonlySet<string>) => !!deck.starter && deckProblems(deck, owned).length === 0;
