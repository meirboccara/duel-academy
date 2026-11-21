import { describe, expect, it } from "vitest";
import { buy, onSale, SHOP_CARDS, starsEarned } from "../world/shop";
import { addCard, deckReady, deckable, loadDeck, parseDeck, refreshDeck, removeCard, saveDeck, startWith, starterCards } from "./deck-record";
import { MASTER_STARS, masterLevelId } from "./masters";
import { emptyPlayProgress, type PlayProgress } from "./progress";

const memory = () => {
	const data = new Map<string, string>();
	return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
};

describe("the child's Deck", () => {
	it("starts empty, and becomes the starter chosen, whose cards join the binder", () => {
		const storage = memory();
		expect(loadDeck(storage, "k:deck").starter).toBeNull();
		const deck = startWith("dragon");
		expect(saveDeck(storage, "k:deck", deck)).toBe(true);
		expect(loadDeck(storage, "k:deck")).toEqual(deck);
		expect(starterCards(deck)).toContain("blue-eyes-white-dragon");
	});
	it("keeps only real cards from a stored record, and no deck without a starter", () => {
		expect(parseDeck({ starter: "hero", main: ["pocket-cub", "not-a-card", 3], extra: ["elemental-hero-flame-wingman"] })).toEqual({ starter: "hero", main: ["pocket-cub"], extra: ["elemental-hero-flame-wingman"] });
		expect(parseDeck({ main: ["pocket-cub"] }).main).toEqual([]);
		expect(parseDeck("broken").starter).toBeNull();
	});
	it("adds a card where it belongs, up to 3 copies and 40 cards, and takes one out", () => {
		const deck = startWith("hero");
		expect(addCard(deck, "elemental-hero-avian")).toBe(deck);
		const lighter = removeCard(deck, "elemental-hero-avian");
		expect(lighter.main).toHaveLength(39);
		expect(addCard(lighter, "elemental-hero-avian").main).toHaveLength(40);
		expect(addCard(removeCard(deck, "elemental-hero-flame-wingman"), "elemental-hero-flame-wingman").extra).toHaveLength(deck.extra.length);
	});
	it("becomes the starter's new Deck when it was saved with cards the binder no longer has or a Forbidden card", () => {
		const fresh = startWith("dragon");
		const owned = new Set(deckable(starterCards(fresh)));
		const old = { ...fresh, main: [...fresh.main.slice(1), "pot-of-greed" as const] };
		expect(refreshDeck(old, owned)).toEqual(fresh);
		const edited = addCard(removeCard(fresh, "vorse-raider"), "x-head-cannon");
		expect(refreshDeck(edited, owned)).toBe(edited);
	});
	it("is ready to duel only with a legal deck of cards the child owns", () => {
		const deck = startWith("warrior");
		const owned = new Set(deckable(starterCards(deck)));
		expect(deckReady(deck, owned)).toBe(true);
		expect(deckReady(removeCard(deck, "celtic-guardian"), owned)).toBe(false);
		expect(deckReady(deck, new Set())).toBe(false);
	});
});

describe("the shop and the masters' island", () => {
	const beaten = (progress: PlayProgress, ...ids: string[]): PlayProgress => ({ ...progress, levels: { ...progress.levels, ...Object.fromEntries(ids.map((id) => [id, { firstTry: false, clean: true }])) } });
	it("opens a trainer's cards once that trainer is beaten", () => {
		const item = SHOP_CARDS.find((card) => card.card === "junk-synchron")!;
		expect(onSale(item, emptyPlayProgress())).toBe(false);
		expect(onSale(item, beaten(emptyPlayProgress(), masterLevelId("yusei-fudo")))).toBe(true);
		const rich = beaten(emptyPlayProgress(), ...Array.from({ length: 30 }, (_, index) => `x${index}`));
		expect(buy(memory(), "k:shop", rich, "junk-synchron")).toEqual({ ok: false, reason: "not-for-sale" });
	});
	it("gives more stars for beating a trainer the first time", () => {
		expect(starsEarned(beaten(emptyPlayProgress(), masterLevelId("rex-raptor")))).toBe(MASTER_STARS);
	});
});
