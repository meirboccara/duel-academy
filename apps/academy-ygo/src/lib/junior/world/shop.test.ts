import { describe, expect, it } from "vitest";
import { cardArtUrl } from "../play/card-art";
import { LEVELS } from "../play/levels";
import { emptyPlayProgress, recordSolve, type PlayProgress } from "../play/progress";
import { RARITIES, RARITY_PRICE, SHOP_CARDS, buy, buyItem, giveItem, loadShop, mergeShop, takeOff, wear, rarityOf, loadPurchases, priceOf, shopKeyFor, spentOnItems, starsEarned, starsLeft, starsWon } from "./shop";

function memory(initial: Record<string, string> = {}) {
	const data = { ...initial };
	return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => void (data[key] = value) };
}
const KEY = shopKeyFor("academy-ygo:junior:play:v1");
const perfect = { tries: 1, firstTry: true, clean: true, hints: 0, slips: [] };
const helped = { tries: 2, firstTry: false, clean: false, hints: 1, slips: [] };
const solved = (count: number, result = perfect): PlayProgress => LEVELS.slice(0, count).reduce((p, level) => recordSolve(p, level.id, result), emptyPlayProgress());

describe("stars", () => {
	it("are earned by playing: one per mission, and one more for a mission done on the first try", () => {
		expect(starsEarned(emptyPlayProgress())).toBe(0);
		expect(starsEarned(solved(3, helped))).toBe(3);
		expect(starsEarned(solved(3))).toBe(6);
	});
	it("give two more for each finished island", () => {
		/* Island 1 has five missions: 5, then 2 for the island. Islands 1 and 2 (ten missions): 10 + 2 + 2. */
		expect(starsEarned(solved(5, helped))).toBe(7);
		expect(starsEarned(solved(10, helped))).toBe(14);
		expect(starsEarned(solved(4, helped))).toBe(4);
	});
	it("give two for a real duel instead of one", () => {
		/* "Rival's duel" is a whole duel and its island's only mission: 2 for the duel, 1 for the first try, 2 for the island. */
		expect(starsEarned(recordSolve(emptyPlayProgress(), "w7-duel", perfect))).toBe(5);
		expect(starsEarned(recordSolve(emptyPlayProgress(), "w7-duel", helped))).toBe(4);
	});
	it("says what a solve won, and why: the island finished, or a real duel", () => {
		expect(starsWon(solved(3), solved(4), "w1-clash-2")).toEqual({ stars: 2, island: false, duel: false });
		expect(starsWon(solved(4), solved(5), "w1-tie")).toEqual({ stars: 4, island: true, duel: false });
		expect(starsWon(solved(5), solved(5), "w1-tie")).toEqual({ stars: 0, island: false, duel: false });
		const duel = recordSolve(emptyPlayProgress(), "w7-duel", helped);
		expect(starsWon(emptyPlayProgress(), duel, "w7-duel")).toEqual({ stars: 4, island: true, duel: true });
	});
	it("left to spend are the earned ones minus the price of the cards bought", () => {
		const cheap = SHOP_CARDS[0]!;
		expect(starsLeft(solved(5), [cheap.card])).toBe(12 - cheap.price);
		expect(starsLeft(solved(5), ["not-a-shop-card"])).toBe(12);
		expect(starsLeft(solved(1), ["dark-magician-girl"])).toBe(0);
	});
});

describe("the shop", () => {
	it("sells cards with official art, each once, and nothing random", () => {
		expect(SHOP_CARDS.length).toBeGreaterThanOrEqual(12);
		for (const item of SHOP_CARDS) {
			expect(cardArtUrl(item.card), item.card).not.toBeNull();
			expect(item.price).toBeGreaterThan(0);
		}
		expect(new Set(SHOP_CARDS.map((item) => item.card)).size).toBe(SHOP_CARDS.length);
		expect(priceOf("dark-magician-girl")).toBeGreaterThan(priceOf("watapon")!);
	});

	it("prices each card by its rarity: the rarer, the more stars, and every rarity has cards", () => {
		const tiers = RARITIES.map((rarity) => RARITY_PRICE[rarity]);
		expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
		expect(new Set(tiers).size).toBe(RARITIES.length);
		for (const rarity of RARITIES) expect(SHOP_CARDS.some((item) => item.rarity === rarity), rarity).toBe(true);
		for (const item of SHOP_CARDS) expect(item.price, item.card).toBe(RARITY_PRICE[item.rarity]);
		expect(rarityOf("dark-magician-girl")).toBe("ultra");
		expect(rarityOf("watapon")).toBe("common");
	});

	it("buys a card when there are enough stars, and remembers it for this save", () => {
		const storage = memory();
		const progress = solved(10);
		const result = buy(storage, KEY, progress, "watapon");
		expect(result).toEqual({ ok: true, bought: ["watapon"] });
		expect(loadPurchases(storage, KEY)).toEqual(["watapon"]);
		expect(starsLeft(progress, loadPurchases(storage, KEY))).toBe(24 - priceOf("watapon")!);
	});

	it("refuses a card already owned, one not for sale, or one that costs more stars than are left", () => {
		const storage = memory();
		buy(storage, KEY, solved(10), "watapon");
		expect(buy(storage, KEY, solved(10), "watapon")).toEqual({ ok: false, reason: "owned" });
		expect(buy(storage, KEY, solved(10), "dark-magician")).toEqual({ ok: false, reason: "not-for-sale" });
		expect(buy(storage, KEY, solved(1, helped), "dark-magician-girl")).toEqual({ ok: false, reason: "too-few-stars" });
	});

	it("keeps another tab's purchase when buying, and never spends a star twice", () => {
		const storage = memory();
		const progress = solved(10);
		buy(storage, KEY, progress, "watapon");
		/* This tab still thinks nothing was bought; the stored list is read again before writing. */
		const result = buy(storage, KEY, progress, "petit-moth");
		expect(result).toEqual({ ok: true, bought: ["watapon", "petit-moth"] });
	});

	it("sells things for the figure too: they cost stars, and buying cards keeps them", () => {
		const storage = memory();
		const progress = solved(5); /* 12 stars */
		expect(buyItem(storage, KEY, progress, "shirt-red")).toEqual({ ok: true, shop: { cards: [], items: ["shirt-red"], wear: {} } });
		expect(buy(storage, KEY, progress, "watapon")).toEqual({ ok: true, bought: ["watapon"] });
		expect(loadShop(storage, KEY)).toEqual({ cards: ["watapon"], items: ["shirt-red"], wear: {} });
		/* 12 − 3 (shirt) − 4 (Watapon) = 5 left: a 6-star sword is too dear, a 5-star helmet is not. */
		expect(starsLeft(progress, ["watapon"], ["shirt-red"])).toBe(5);
		expect(buyItem(storage, KEY, progress, "held-sword")).toEqual({ ok: false, reason: "too-few-stars" });
		expect(buyItem(storage, KEY, progress, "shirt-red")).toEqual({ ok: false, reason: "owned" });
		expect(buyItem(storage, KEY, progress, "a-crown")).toEqual({ ok: false, reason: "not-for-sale" });
		expect(buy(storage, KEY, progress, "pot-of-greed")).toEqual({ ok: false, reason: "too-few-stars" });
	});

	it("puts on only what was bought, one thing per place, and takes it off again", () => {
		const storage = memory();
		const progress = solved(10);
		buyItem(storage, KEY, progress, "shirt-red");
		buyItem(storage, KEY, progress, "hat-wizard");
		expect(wear(storage, KEY, "shirt-red")).toEqual({ shirt: "shirt-red" });
		expect(wear(storage, KEY, "hat-wizard")).toEqual({ shirt: "shirt-red", hat: "hat-wizard" });
		expect(wear(storage, KEY, "held-sword")).toBeNull();
		expect(takeOff(storage, KEY, "shirt")).toEqual({ hat: "hat-wizard" });
		expect(loadShop(storage, KEY).wear).toEqual({ hat: "hat-wizard" });
	});

	it("gives a present for free and puts it on at once (the dorm's cap), keeping the rest of the outfit", () => {
		const storage = memory();
		buyItem(storage, KEY, solved(10), "shirt-red");
		wear(storage, KEY, "shirt-red");
		const before = starsLeft(solved(10), [], loadShop(storage, KEY).items);
		expect(giveItem(storage, KEY, "hat-cap-ra")).toEqual({ cards: [], items: ["shirt-red", "hat-cap-ra"], wear: { shirt: "shirt-red", hat: "hat-cap-ra" } });
		expect(starsLeft(solved(10), [], loadShop(storage, KEY).items)).toBe(before);
		expect(giveItem(storage, KEY, "a-crown")).toBeNull();
	});

	it("merges a loaded copy into this save: never fewer things, and what is worn here stays worn", () => {
		const storage = memory();
		buyItem(storage, KEY, solved(10), "shirt-red");
		wear(storage, KEY, "shirt-red");
		expect(mergeShop(storage, KEY, { cards: ["watapon"], items: ["shirt-blue", "hat-wizard"], wear: { shirt: "shirt-blue", hat: "hat-wizard" } })).toBe(true);
		expect(loadShop(storage, KEY)).toEqual({ cards: ["watapon"], items: ["shirt-red", "shirt-blue", "hat-wizard"], wear: { shirt: "shirt-red", hat: "hat-wizard" } });
	});

	it("reads a broken or unknown list as nothing bought, and drops cards it does not sell", () => {
		expect(loadShop(memory({ [KEY]: JSON.stringify({ version: 1, cards: ["watapon"], items: ["shirt-red", "nope"], wear: { shirt: "shirt-red", hat: "hat-wizard", held: 3 } }) }), KEY)).toEqual({ cards: ["watapon"], items: ["shirt-red"], wear: { shirt: "shirt-red" } });
		expect(loadPurchases(memory({ [KEY]: "{oops" }), KEY)).toEqual([]);
		expect(loadPurchases(memory({ [KEY]: JSON.stringify({ version: 1, cards: ["watapon", "nope", 3] }) }), KEY)).toEqual(["watapon"]);
		expect(loadPurchases(undefined, KEY)).toEqual([]);
	});
});

describe("things a figure can no longer wear", () => {
	it("gives back the stars of a held thing bought for a figure it does not suit", () => {
		/* A sword (6) and a red shirt (3), bought when every figure could hold a sword. */
		const items = ["held-sword", "shirt-red"];
		expect(spentOnItems(items)).toBe(9);
		expect(spentOnItems(items, "knight")).toBe(9);
		expect(spentOnItems(items, "mage")).toBe(3);
		expect(spentOnItems(["held-broom", "held-balloon", "nope"], "explorer")).toBe(0);
		/* A dorm's cap was a present: it never costs anything. */
		expect(spentOnItems(["hat-cap-ra"], "witch")).toBe(0);
	});

	it("counts the refund in the stars left, only when the figure is named", () => {
		/* Five first-try missions and their island: 12 stars. */
		expect(starsLeft(solved(5), [], ["held-sword"], "mage")).toBe(12);
		expect(starsLeft(solved(5), [], ["held-sword"], "knight")).toBe(6);
		expect(starsLeft(solved(5), [], ["held-sword"])).toBe(6);
	});

	it("buys with the stars given back, and never a thing the figure cannot wear or a gift", () => {
		const storage = memory({ [KEY]: JSON.stringify({ cards: [], items: ["held-big-sword"], wear: {} }) });
		/* 12 stars, 10 of them once spent on a great sword: the Mage has them back and can afford the fire staff. */
		expect(buyItem(storage, KEY, solved(5), "held-fire-staff")).toEqual({ ok: false, reason: "too-few-stars" });
		expect(buyItem(storage, KEY, solved(5), "held-sword", "mage")).toEqual({ ok: false, reason: "not-for-sale" });
		expect(buyItem(storage, KEY, solved(5), "hat-cap-ra", "mage")).toEqual({ ok: false, reason: "not-for-sale" });
		expect(buyItem(storage, KEY, solved(5), "held-fire-staff", "mage")).toMatchObject({ ok: true, shop: { items: ["held-big-sword", "held-fire-staff"] } });
		expect(starsLeft(solved(5), [], loadShop(storage, KEY).items, "mage")).toBe(0);
	});
});
