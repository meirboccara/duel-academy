import type { Persona } from "./bot";
import { inExtraDeck, type CardId } from "./cards";
import type { Setup } from "./engine";
import { MASTER_DECKS } from "./master-decks";

/**
 * The masters' island, after the Nox duel: every trainer duels the child with an anime deck, as a bot (`bot.ts`).
 * The owner's decisions (docs/research/academy-phases-spells-traps-endgame.md §5.8): 13 trainers, Yugi and Atem
 * apart, 40-card decks and an Extra Deck of up to 15, shuffled, 8000 Life Points; every trainer must be beaten, and
 * any can be challenged again.
 */
export const MASTERS = ["rex-raptor", "weevil-underwood", "mako-tsunami", "joey-wheeler", "arkana", "yami-bakura", "maximillion-pegasus", "yugi-muto", "jaden-yuki", "yusei-fudo", "yami-marik", "seto-kaiba", "atem"] as const;
export type MasterId = (typeof MASTERS)[number];

/** As spelled in the English anime, in Latin letters in every language. */
export const MASTER_NAMES: Record<MasterId, string> = {
	"rex-raptor": "Rex Raptor",
	"weevil-underwood": "Weevil Underwood",
	"mako-tsunami": "Mako Tsunami",
	"joey-wheeler": "Joey Wheeler",
	arkana: "Arkana",
	"yami-bakura": "Yami Bakura",
	"maximillion-pegasus": "Maximillion Pegasus",
	"yugi-muto": "Yugi Muto",
	"jaden-yuki": "Jaden Yuki",
	"yusei-fudo": "Yusei Fudo",
	"yami-marik": "Yami Marik",
	"seto-kaiba": "Seto Kaiba",
	atem: "Atem",
};

/**
 * The trainers' levels (the owner's choice): the first ones are really basic, then medium, strong, and expert.
 * A basic trainer often plays a weaker move and sometimes forgets its Traps; an expert always plays its best.
 */
export const TIERS = ["basic", "medium", "strong", "expert"] as const;
export type Tier = (typeof TIERS)[number];
export const MASTER_TIER: Record<MasterId, Tier> = {
	"rex-raptor": "basic",
	"weevil-underwood": "basic",
	"mako-tsunami": "basic",
	"joey-wheeler": "medium",
	arkana: "medium",
	"yami-bakura": "medium",
	"maximillion-pegasus": "strong",
	"yugi-muto": "strong",
	"jaden-yuki": "strong",
	"yusei-fudo": "strong",
	"yami-marik": "expert",
	"seto-kaiba": "expert",
	atem: "expert",
};
const TIER_PLAY: Record<Tier, Omit<Persona, "aggression">> = {
	basic: { skill: 0.25, caution: 0.2, answers: 0.5 },
	medium: { skill: 0.6, caution: 0.7, answers: 0.8 },
	strong: { skill: 0.85, caution: 1, answers: 1 },
	expert: { skill: 1, caution: 1.2, answers: 1 },
};
/** How much each trainer goes for the opponent's Life Points: Kaiba and Rex attack, Yugi and Weevil wait. */
const AGGRESSION: Record<MasterId, number> = {
	"rex-raptor": 1.6,
	"weevil-underwood": 0.9,
	"mako-tsunami": 1.1,
	"joey-wheeler": 1.4,
	arkana: 1,
	"yami-bakura": 1.2,
	"maximillion-pegasus": 1,
	"yugi-muto": 0.9,
	"jaden-yuki": 1.3,
	"yusei-fudo": 1,
	"yami-marik": 1.3,
	"seto-kaiba": 1.7,
	atem: 1.1,
};
export const PERSONAS = Object.fromEntries(MASTERS.map((master) => [master, { aggression: AGGRESSION[master], ...TIER_PLAY[MASTER_TIER[master]] }])) as Record<MasterId, Persona>;


export const MAIN_DECK = 40;
export const EXTRA_DECK = 15;
export const MOST_COPIES = 3;
export const MASTER_LP = 8000;
export const OPENING_HAND = 5;
/** Stars for beating a trainer the first time. A rematch is for fun: stars are earned once. */
export const MASTER_STARS = 5;

export interface Deck {
	main: readonly CardId[];
	extra: readonly CardId[];
}
export const masterDeck = (master: MasterId): Deck => MASTER_DECKS[master];
export const masterLevelId = (master: MasterId) => `ms-${master}`;
/** The trainer's official character art (scripts/trainers/build-portraits.mjs): Atem is drawn as Yami Yugi. */
export const masterPicture = (master: MasterId, height: 256 | 512 = 256) => `/trainers/${master === "atem" ? "yami-yugi" : master}-${height}.webp`;
export const masterOfLevel = (levelId: string): MasterId | null => MASTERS.find((master) => masterLevelId(master) === levelId) ?? null;

/** What is wrong with a deck, if anything: the size of each part, copies, and cards in the wrong part. */
export type DeckProblem = "main-size" | "extra-size" | "too-many-copies" | "extra-in-main" | "main-in-extra" | "not-owned";
export function deckProblems(deck: Deck, owned?: ReadonlySet<string>): DeckProblem[] {
	const problems = new Set<DeckProblem>();
	if (deck.main.length !== MAIN_DECK) problems.add("main-size");
	if (deck.extra.length > EXTRA_DECK) problems.add("extra-size");
	const counts = new Map<CardId, number>();
	for (const card of [...deck.main, ...deck.extra]) counts.set(card, (counts.get(card) ?? 0) + 1);
	if ([...counts.values()].some((count) => count > MOST_COPIES)) problems.add("too-many-copies");
	if (deck.main.some(inExtraDeck)) problems.add("extra-in-main");
	if (deck.extra.some((card) => !inExtraDeck(card))) problems.add("main-in-extra");
	if (owned && [...counts.keys()].some((card) => !owned.has(card))) problems.add("not-owned");
	return [...problems];
}

/** The cards in a random order, from a seed (Fisher-Yates). */
export function shuffled<T>(cards: readonly T[], random: () => number): T[] {
	const out = [...cards];
	for (let index = out.length - 1; index > 0; index--) {
		const other = Math.floor(random() * (index + 1));
		[out[index], out[other]] = [out[other] as T, out[index] as T];
	}
	return out;
}

/**
 * The board of a duel against a trainer: both Decks shuffled, five cards in each hand, 8000 Life Points, the whole
 * mat, and a coin toss for who goes first. The player who goes first does not draw on that turn.
 */
export function duelSetup(master: MasterId, mine: Deck, random: () => number): Setup {
	const theirs = masterDeck(master);
	const deal = (deck: Deck) => {
		const cards = shuffled(deck.main, random);
		return { lp: MASTER_LP, hand: cards.slice(0, OPENING_HAND), deck: cards.slice(OPENING_HAND), extra: [...deck.extra] };
	};
	const you = deal(mine);
	const rival = deal(theirs);
	return { full: true, strict: true, phase: "draw", turnNumber: 1, turn: random() < 0.5 ? "you" : "rival", you, rival };
}
