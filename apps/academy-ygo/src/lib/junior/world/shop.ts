import { LEVELS, WORLD_IDS } from "../play/levels";
import { MASTER_STARS, masterLevelId, type MasterId } from "../play/masters";
import type { PlayProgress } from "../play/progress";
import { islandStatus } from "./status";
import type { Avatar } from "@/lib/junior/profiles";
import { type Outfit, type WardrobeSlot, suits, wardrobeItem } from "./wardrobe";

/**
 * Grandpa's game shop (Solomon Muto's shop in the anime), on the first island. Missions earn stars; stars buy cards
 * for the binder. Every card is shown with its price before it is bought, and there is nothing random to buy (no
 * packs): the child always knows what they get. Stars are not stored: they are computed from the solved levels, so they
 * can never be lost or doubled. Only the list of cards bought is stored, per save, beside the play record.
 */
export const SHOP_ISLAND = 0;

/**
 * The rarities, like the real cards' foils, from the plainest to the rarest. The rarer the card, the more stars it
 * costs and the more it shines (frame, foil and reveal) in the shop and the binder.
 */
export const RARITIES = ["common", "rare", "super", "ultra", "secret"] as const;
export type Rarity = (typeof RARITIES)[number];
export const RARITY_PRICE: Readonly<Record<Rarity, number>> = { common: 4, rare: 7, super: 10, ultra: 15, secret: 20 };

export interface ShopCard {
	card: string;
	rarity: Rarity;
	price: number;
	/** On sale only once this trainer of the masters' island has been beaten: the shop opens new cards as the child goes on. */
	unlock?: MasterId;
}
const sell = (rarity: Rarity, cards: readonly string[], unlock?: MasterId): ShopCard[] => cards.map((card) => ({ card, rarity, price: RARITY_PRICE[rarity], ...(unlock ? { unlock } : {}) }));

/** What the shop sells, cheapest first: friendly, famous cards of the first series. Prices in stars, by rarity. */
export const SHOP_CARDS: readonly ShopCard[] = [
	...sell("common", ["watapon", "petit-moth", "hane-hane", "marshmallon", "celtic-guardian"]),
	...sell("rare", ["pot-of-greed", "scapegoat", "magician-of-faith", "baby-dragon", "harpie-lady", "big-shield-gardna"]),
	...sell("super", ["winged-kuriboh", "swords-of-revealing-light", "gaia-the-fierce-knight", "mirror-force"]),
	...sell("ultra", ["summoned-skull", "toon-dark-magician-girl", "blue-eyes-toon-dragon", "dark-magician-girl"]),
	...sell("secret", ["red-eyes-black-dragon"]),
	/* Each trainer beaten on the masters' island puts some of the cards of their deck on sale. */
	...sell("common", ["two-headed-king-rex"], "rex-raptor"),
	...sell("rare", ["serpent-night-dragon"], "rex-raptor"),
	...sell("common", ["hercules-beetle"], "weevil-underwood"),
	...sell("rare", ["laser-cannon-armor"], "weevil-underwood"),
	...sell("common", ["kairyu-shin"], "mako-tsunami"),
	...sell("rare", ["umi"], "mako-tsunami"),
	...sell("common", ["axe-raider"], "joey-wheeler"),
	...sell("super", ["jinzo", "dark-time-wizard"], "joey-wheeler"),
	...sell("common", ["book-of-secret-arts"], "arkana"),
	...sell("rare", ["thousand-knives"], "arkana"),
	...sell("common", ["the-earl-of-demise"], "yami-bakura"),
	...sell("rare", ["just-desserts"], "yami-bakura"),
	...sell("common", ["parrot-dragon"], "maximillion-pegasus"),
	...sell("rare", ["shine-palace"], "maximillion-pegasus"),
	...sell("common", ["alpha-the-magnet-warrior", "beta-the-magnet-warrior", "gamma-the-magnet-warrior"], "yugi-muto"),
	...sell("super", ["buster-blader"], "yugi-muto"),
	...sell("common", ["elemental-hero-avian", "elemental-hero-burstinatrix"], "jaden-yuki"),
	...sell("rare", ["elemental-hero-sparkman"], "jaden-yuki"),
	...sell("rare", ["junk-synchron"], "yusei-fudo"),
	...sell("super", ["junk-warrior"], "yusei-fudo"),
	...sell("rare", ["bowganian"], "yami-marik"),
	...sell("super", ["legendary-fiend"], "yami-marik"),
	...sell("rare", ["vorse-raider"], "seto-kaiba"),
	...sell("ultra", ["luster-dragon-2", "blue-eyes-alternative-white-dragon"], "seto-kaiba"),
	...sell("super", ["magic-cylinder", "dark-magical-curtain"], "atem"),
	...sell("ultra", ["gaia-the-dragon-champion"], "atem"),
	/* Cards played in tournaments: hand traps, Traps that answer a Summon, and searchers. */
	...sell("rare", ["trap-hole"], "rex-raptor"),
	...sell("super", ["torrential-tribute"], "mako-tsunami"),
	...sell("rare", ["swift-scarecrow"], "joey-wheeler"),
	...sell("super", ["magicians-rod"], "arkana"),
	...sell("rare", ["dd-crow", "battle-fader"], "yami-bakura"),
	...sell("super", ["bottomless-trap-hole"], "maximillion-pegasus"),
	...sell("rare", ["e-emergency-call", "elemental-hero-blazeman"], "jaden-yuki"),
	...sell("super", ["a-hero-lives"], "jaden-yuki"),
	...sell("super", ["reinforcement-of-the-army"], "yusei-fudo"),
	...sell("ultra", ["effect-veiler"], "yusei-fudo"),
	...sell("secret", ["ash-blossom-joyous-spring"], "seto-kaiba"),
];
/** Is this card on sale for this child: always, or once its trainer is beaten. */
export const onSale = (item: ShopCard, progress: PlayProgress): boolean => !item.unlock || masterLevelId(item.unlock) in progress.levels;
const BY_CARD = new Map(SHOP_CARDS.map((item) => [item.card, item]));
export const priceOf = (card: string): number | undefined => BY_CARD.get(card)?.price;
export const rarityOf = (card: string): Rarity | undefined => BY_CARD.get(card)?.rarity;

/** Stars for a finished island, and for a mission that is a real duel (instead of one). */
export const ISLAND_STARS = 2;
export const DUEL_STARS = 2;
const DUELS = new Set(LEVELS.filter((level) => level.open).map((level) => level.id));
/** A trainer of the masters' island beaten the first time: more stars, to buy the cards the shop opens. */
const MASTER_DUELS = new Set(LEVELS.filter((level) => level.duel).map((level) => level.id));

/**
 * One star per mission solved (two for a real duel), one more when it was solved on the first try, and two for each
 * finished island.
 */
export function starsEarned(progress: PlayProgress): number {
	const missions = Object.entries(progress.levels).reduce((sum, [id, record]) => sum + (MASTER_DUELS.has(id) ? MASTER_STARS : DUELS.has(id) ? DUEL_STARS : 1) + (record.firstTry ? 1 : 0), 0);
	return missions + ISLAND_STARS * WORLD_IDS.filter((world) => islandStatus(progress, world) === "done").length;
}
/** What one solve of `levelId` won, from the record before it to the record after: shown on the map. */
export function starsWon(before: PlayProgress, after: PlayProgress, levelId: string): { stars: number; island: boolean; duel: boolean } {
	const stars = starsEarned(after) - starsEarned(before);
	const world = LEVELS.find((level) => level.id === levelId)?.world;
	const island = stars > 0 && !!world && islandStatus(before, world) !== "done" && islandStatus(after, world) === "done";
	return { stars, island, duel: stars > 0 && DUELS.has(levelId) };
}

/**
 * The stars a save has spent on things for its figure. With the save's `avatar`, a thing that figure cannot wear
 * (bought when it was still sold to every figure) costs nothing: its stars come back.
 */
export function spentOnItems(items: readonly string[], avatar?: Avatar): number {
	return items.reduce((sum, id) => {
		const item = wardrobeItem(id);
		return sum + (item && (!avatar || suits(item, avatar)) ? item.price : 0);
	}, 0);
}

/** The stars not spent yet: earned, minus the cards and the things for the figure bought. Pass the save's `avatar` so that things it cannot wear are not counted (see `spentOnItems`). */
export function starsLeft(progress: PlayProgress, bought: readonly string[], items: readonly string[] = [], avatar?: Avatar): number {
	const spent = bought.reduce((sum, card) => sum + (priceOf(card) ?? 0), 0) + spentOnItems(items, avatar);
	/* Never below zero: a loaded copy can bring things bought with stars this save has not earned yet. */
	return Math.max(0, starsEarned(progress) - spent);
}

/** What was bought lives beside the save's play record, under its own key: the play record's format never changes. */
export const shopKeyFor = (playKey: string) => `${playKey}:shop`;

/** One save's shop record: the cards bought, the things for the figure bought, and what the figure wears. */
export interface ShopRecord {
	cards: string[];
	items: string[];
	wear: Outfit;
}
const EMPTY: ShopRecord = { cards: [], items: [], wear: {} };
const known = (list: unknown, has: (id: string) => boolean): string[] => (Array.isArray(list) ? [...new Set(list.filter((id): id is string => typeof id === "string" && has(id)))] : []);

/**
 * Forgiving: a missing or broken record is "nothing bought"; what the shop does not sell is dropped, and the figure
 * wears only things bought, each in its own place.
 */
export function loadShop(storage: Pick<Storage, "getItem"> | undefined, key: string): ShopRecord {
	try {
		const raw = storage?.getItem(key);
		return raw ? parseShop(JSON.parse(raw)) : { ...EMPTY, wear: {} };
	} catch {
		return { ...EMPTY, wear: {} };
	}
}
/** Keeps only what this build sells, from a stored record or a save code. */
export function parseShop(raw: unknown): ShopRecord {
	const data = (typeof raw === "object" && raw !== null ? raw : {}) as { cards?: unknown; items?: unknown; wear?: unknown };
	const items = known(data.items, (id) => !!wardrobeItem(id));
	const wear: Outfit = {};
	if (data.wear && typeof data.wear === "object") {
		for (const [slot, id] of Object.entries(data.wear as Record<string, unknown>)) {
			if (typeof id === "string" && items.includes(id) && wardrobeItem(id)?.slot === slot) wear[slot as WardrobeSlot] = id;
		}
	}
	return { cards: known(data.cards, (card) => BY_CARD.has(card)), items, wear };
}

/**
 * Loading a copy into this save: what was bought is the union of both, never fewer; what is worn here stays, and
 * the copy's outfit fills only the places where nothing is worn. False when the storage is full.
 */
export function mergeShop(storage: Pick<Storage, "getItem" | "setItem">, key: string, incoming: Partial<ShopRecord>): boolean {
	const here = loadShop(storage, key);
	const items = [...new Set([...here.items, ...(incoming.items ?? [])])];
	return save(storage, key, parseShop({ cards: [...here.cards, ...(incoming.cards ?? [])], items, wear: { ...incoming.wear, ...here.wear } }));
}
/** The cards bought, for the binder. */
export const loadPurchases = (storage: Pick<Storage, "getItem"> | undefined, key: string): string[] => loadShop(storage, key).cards;

function save(storage: Pick<Storage, "setItem">, key: string, record: ShopRecord): boolean {
	try {
		storage.setItem(key, JSON.stringify({ version: 1, ...record }));
		return true;
	} catch {
		return false;
	}
}

type Refused = { ok: false; reason: "not-for-sale" | "owned" | "too-few-stars" | "storage" };
export type Bought = { ok: true; bought: string[] } | Refused;
/** Buys one card. The stored record is read again first, so a purchase made in another tab is kept and counted. */
export function buy(storage: Pick<Storage, "getItem" | "setItem">, key: string, progress: PlayProgress, card: string, avatar?: Avatar): Bought {
	const price = priceOf(card);
	const item = BY_CARD.get(card);
	if (price === undefined || !item || !onSale(item, progress)) return { ok: false, reason: "not-for-sale" };
	const record = loadShop(storage, key);
	if (record.cards.includes(card)) return { ok: false, reason: "owned" };
	if (starsLeft(progress, record.cards, record.items, avatar) < price) return { ok: false, reason: "too-few-stars" };
	const cards = [...record.cards, card];
	return save(storage, key, { ...record, cards }) ? { ok: true, bought: cards } : { ok: false, reason: "storage" };
}

/** Buys one thing for the figure, the same way as a card. With the save's `avatar`, only a thing that figure can wear and that is sold (not a gift) can be bought. */
export function buyItem(storage: Pick<Storage, "getItem" | "setItem">, key: string, progress: PlayProgress, id: string, avatar?: Avatar): { ok: true; shop: ShopRecord } | Refused {
	const item = wardrobeItem(id);
	if (!item || (avatar && (item.gift || !suits(item, avatar)))) return { ok: false, reason: "not-for-sale" };
	const record = loadShop(storage, key);
	if (record.items.includes(id)) return { ok: false, reason: "owned" };
	if (starsLeft(progress, record.cards, record.items, avatar) < item.price) return { ok: false, reason: "too-few-stars" };
	const shop = { ...record, items: [...record.items, id] };
	return save(storage, key, shop) ? { ok: true, shop } : { ok: false, reason: "storage" };
}

/** A present (the dorm's cap): owned without spending stars, and worn at once. Null when unknown or not saved. */
export function giveItem(storage: Pick<Storage, "getItem" | "setItem">, key: string, id: string): ShopRecord | null {
	const item = wardrobeItem(id);
	if (!item) return null;
	const record = loadShop(storage, key);
	const shop = { ...record, items: record.items.includes(id) ? record.items : [...record.items, id], wear: { ...record.wear, [item.slot]: id } };
	return save(storage, key, shop) ? shop : null;
}

/** Puts on a thing bought, in its place (a new hat replaces the old one). Null when it was not bought or not saved. */
export function wear(storage: Pick<Storage, "getItem" | "setItem">, key: string, id: string): Outfit | null {
	const item = wardrobeItem(id);
	const record = loadShop(storage, key);
	if (!item || !record.items.includes(id)) return null;
	const outfit = { ...record.wear, [item.slot]: id };
	return save(storage, key, { ...record, wear: outfit }) ? outfit : null;
}
/** Takes off what is worn in one place: the figure's own look comes back there. */
export function takeOff(storage: Pick<Storage, "getItem" | "setItem">, key: string, slot: WardrobeSlot): Outfit | null {
	const record = loadShop(storage, key);
	const { [slot]: _gone, ...outfit } = record.wear;
	return save(storage, key, { ...record, wear: outfit }) ? outfit : null;
}
