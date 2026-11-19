import type { Locale } from "@/lib/i18n/locales";
import type { Avatar } from "@/lib/junior/profiles";

/**
 * Things for the child's figure, sold in Grandpa's shop beside the cards: a shirt colour, a cape colour, a hat and
 * something to hold. Every item comes from the KayKit packs the figures are made from (CC0), or is a colour laid
 * over a part of the figure, so nothing new has to be drawn. The six figures share one skeleton, so a thing made
 * for one hangs on another.
 *
 * What a figure holds is its own: the Knight's blades and shields, the Mage's staffs and books, the Rogue's daggers
 * and crossbows, the Star's wands, the Witch's brooms and brews, the Explorer's lantern and compass. No held thing
 * is sold to two figures. The `special` ones cost more and carry a little magic in 3D (a flame, sparks, bubbles:
 * see `HELD_EXTRA` in `outfit-look.ts`). A held thing bought before this rule by a figure it no longer suits is
 * kept in the save, unseen, and its stars are given back (`starsLeft` in `shop.ts`).
 *
 * Not every thing suits every figure, though. An item with `only` is sold to those figures alone: the star wand,
 * the broom and the pink colours came with the girls and are theirs, and a hat is not offered to a figure whose
 * hair it cannot cover. A figure is never offered the hat it already wears. `wardrobeFor` gives the list for one
 * figure; `suits` answers for one item. Ids are kept in saves: an id is never renamed or removed.
 *
 * A `gift` is never sold: the cap of a dorm is given to the child who chooses that dorm (`shop.ts` adds it to the
 * things owned and puts it on). The shop lists it only once it is owned, so it can be taken off and put back.
 *
 * The 3D side (`components/junior/world/hero.tsx` and `scripts/world/build-heroes.mjs`) turns an `Outfit` into
 * meshes: `HAT_MESH`, `HELD_MESH` and `CAPE_MESH` name the packs' mesh nodes, `SHIRT_COLOURS` and `CAPE_COLOURS`
 * the tints.
 */

export type WardrobeSlot = "shirt" | "cape" | "hat" | "held";
export const WARDROBE_SLOTS: readonly WardrobeSlot[] = ["shirt", "cape", "hat", "held"];

/** What the figure wears: an item id per slot, or nothing (the figure's own look). */
export type Outfit = Partial<Record<WardrobeSlot, string>>;

export interface WardrobeItem {
	id: string;
	slot: WardrobeSlot;
	price: number;
	name: Record<Locale, string>;
	/** A shirt or cape colour, or the colour laid over a dorm's cap, as `#rrggbb`. */
	colour?: string;
	/** Given, never sold: the shop shows it only to a child who owns it. Its price is 0. */
	gift?: boolean;
	/** A thing with a visible magic effect on the figure. */
	special?: boolean;
	/** The figures this is sold to and shown on. Left out: all of them. */
	only?: readonly Avatar[];
}

/** The three girls. */
export const GIRLS: readonly Avatar[] = ["star", "witch", "explorer"];
/** The hat or helmet each figure's own file carries. The Rogue's hood, the Star's bows and the Explorer's cap are part of the head. */
export const OWN_HAT: Readonly<Record<Avatar, string | null>> = { knight: "Knight_Helmet", mage: "Mage_Hat", rogue: null, star: null, witch: "Witch_Hat", explorer: null };
/** The figures whose own file carries a cape. The others are lent the Knight's, from the wardrobe file, when they wear a cape colour. */
export const OWN_CAPE: Readonly<Record<Avatar, boolean>> = { knight: true, mage: true, rogue: true, star: false, witch: false, explorer: false };
/** The cape lent to a figure that has none. */
export const CAPE_MESH = "Knight_Cape";

const colour = (slot: "shirt" | "cape", id: string, hex: string, price: number, name: Record<Locale, string>, only?: readonly Avatar[]): WardrobeItem => ({ id: `${slot}-${id}`, slot, price, colour: hex, name, ...(only && { only }) });

/** Shirt colours: laid over the figure's body. */
export const SHIRT_COLOURS: readonly WardrobeItem[] = [
	colour("shirt", "red", "#d94040", 3, { en: "Red shirt", fr: "Chemise rouge", he: "חולצה אדומה" }),
	colour("shirt", "blue", "#3f6fd9", 3, { en: "Blue shirt", fr: "Chemise bleue", he: "חולצה כחולה" }),
	colour("shirt", "green", "#3fa85a", 3, { en: "Green shirt", fr: "Chemise verte", he: "חולצה ירוקה" }),
	colour("shirt", "purple", "#8a4fd0", 3, { en: "Purple shirt", fr: "Chemise violette", he: "חולצה סגולה" }),
	colour("shirt", "gold", "#e8b931", 6, { en: "Gold shirt", fr: "Chemise dorée", he: "חולצה זהובה" }),
	colour("shirt", "pink", "#ee6fa9", 3, { en: "Pink outfit", fr: "Tenue rose", he: "בגד ורוד" }, GIRLS),
	colour("shirt", "turquoise", "#27b5ad", 3, { en: "Turquoise outfit", fr: "Tenue turquoise", he: "בגד טורקיז" }, GIRLS),
];
/** Cape colours: laid over the cape. */
export const CAPE_COLOURS: readonly WardrobeItem[] = [
	colour("cape", "red", "#c0303a", 3, { en: "Red cape", fr: "Cape rouge", he: "גלימה אדומה" }),
	colour("cape", "blue", "#2f58c0", 3, { en: "Blue cape", fr: "Cape bleue", he: "גלימה כחולה" }),
	colour("cape", "black", "#2a2a33", 5, { en: "Black cape", fr: "Cape noire", he: "גלימה שחורה" }),
	colour("cape", "gold", "#e0b02a", 6, { en: "Gold cape", fr: "Cape dorée", he: "גלימה זהובה" }),
	colour("cape", "pink", "#e85c9c", 4, { en: "Pink cape", fr: "Cape rose", he: "גלימה ורודה" }, GIRLS),
];
/** Hats, by the pack's mesh node. */
export const HAT_MESH: Readonly<Record<string, string>> = { "hat-helmet": "Knight_Helmet", "hat-wizard": "Mage_Hat", "hat-cap-slifer": "Dorm_Cap", "hat-cap-ra": "Dorm_Cap", "hat-cap-obelisk": "Dorm_Cap" };
/** The three dorms' caps are one peaked cap, built by `build-heroes.mjs`, in the dorm's colour (the same as `DORM_INFO` in `dorm.ts`). Every figure can wear one. */
const cap = (dorm: string, hex: string, name: Record<Locale, string>): WardrobeItem => ({ id: `hat-cap-${dorm}`, slot: "hat", price: 0, colour: hex, gift: true, name });
/* In Hebrew the dorm keeps its English name, held left-to-right inside the right-to-left line. */
export const DORM_CAPS: readonly WardrobeItem[] = [
	cap("slifer", "#d23a3a", { en: "Slifer Red cap", fr: "Casquette Slifer Rouge", he: "כובע \u2066Slifer Red\u2069" }),
	cap("ra", "#e8b931", { en: "Ra Yellow cap", fr: "Casquette Ra Jaune", he: "כובע \u2066Ra Yellow\u2069" }),
	cap("obelisk", "#2f62c9", { en: "Obelisk Blue cap", fr: "Casquette Obelisk Bleu", he: "כובע \u2066Obelisk Blue\u2069" }),
];
/** Things held, by the mesh node of `hero-wardrobe.glb`. Several things can share a mesh: the fire staff is the staff, with a flame. */
export const HELD_MESH: Readonly<Record<string, string>> = {
	"held-sword": "1H_Sword",
	"held-shield": "Round_Shield",
	"held-big-sword": "2H_Sword",
	"held-flame-sword": "1H_Sword",
	"held-holy-shield": "Badge_Shield",
	"held-wand": "1H_Wand",
	"held-staff": "2H_Staff",
	"held-book": "Spellbook_open",
	"held-glow-book": "Spellbook_open",
	"held-ice-staff": "2H_Staff",
	"held-fire-staff": "2H_Staff",
	"held-lightning-staff": "2H_Staff",
	"held-crossbow": "1H_Crossbow",
	"held-dagger": "Knife",
	"held-smoke-bomb": "Throwable",
	"held-shadow-daggers": "Knife",
	"held-venom-crossbow": "2H_Crossbow",
	"held-star-wand": "MagicalGirl_Wand",
	"held-balloon": "balloon_dog_blue",
	"held-heart-wand": "MagicalGirl_Wand",
	"held-rainbow-wand": "MagicalGirl_Wand",
	"held-broom": "Broom",
	"held-mushroom": "Mushroom",
	"held-cauldron": "Cauldron",
	"held-sparkle-broom": "Broom",
	"held-basket": "Basket_Mushrooms",
	"held-spyglass": "Explorer_Spyglass",
	"held-lantern": "Explorer_Lantern",
	"held-compass": "Explorer_Compass",
};

const held = (id: string, only: Avatar, price: number, name: Record<Locale, string>, special = false): WardrobeItem => ({ id: `held-${id}`, slot: "held", price, name, only: [only], ...(special && { special }) });
/** What each figure can hold: its own things only, the plain ones first. The first seven ids and the next four were once sold to more figures. */
export const HELD: readonly WardrobeItem[] = [
	held("shield", "knight", 5, { en: "Round shield", fr: "Bouclier rond", he: "מגן עגול" }),
	held("sword", "knight", 6, { en: "Sword", fr: "Épée", he: "חרב" }),
	held("big-sword", "knight", 10, { en: "Great sword", fr: "Grande épée", he: "חרב גדולה" }),
	held("flame-sword", "knight", 12, { en: "Flaming sword", fr: "Épée de feu", he: "חרב אש" }, true),
	held("holy-shield", "knight", 12, { en: "Shining shield", fr: "Bouclier de lumière", he: "מגן אור" }, true),

	held("wand", "mage", 4, { en: "Magic wand", fr: "Baguette magique", he: "שרביט קסמים" }),
	held("book", "mage", 4, { en: "Spell book", fr: "Livre de sorts", he: "ספר לחשים" }),
	held("staff", "mage", 6, { en: "Magic staff", fr: "Bâton magique", he: "מטה קסמים" }),
	held("glow-book", "mage", 9, { en: "Glowing spell book", fr: "Grimoire lumineux", he: "ספר לחשים זוהר" }, true),
	held("ice-staff", "mage", 10, { en: "Ice staff", fr: "Bâton de glace", he: "מטה קרח" }, true),
	held("fire-staff", "mage", 12, { en: "Fire staff", fr: "Bâton de feu", he: "מטה אש" }, true),
	held("lightning-staff", "mage", 12, { en: "Lightning staff", fr: "Bâton de foudre", he: "מטה ברק" }, true),

	held("dagger", "rogue", 5, { en: "Dagger", fr: "Dague", he: "פגיון" }),
	held("crossbow", "rogue", 8, { en: "Crossbow", fr: "Arbalète", he: "קשת מוצלבת" }),
	held("smoke-bomb", "rogue", 9, { en: "Smoke bomb", fr: "Bombe fumigène", he: "פצצת עשן" }, true),
	held("shadow-daggers", "rogue", 11, { en: "Shadow daggers", fr: "Dagues de l'ombre", he: "פגיונות צל" }, true),
	held("venom-crossbow", "rogue", 12, { en: "Venom crossbow", fr: "Arbalète à venin", he: "קשת ארס" }, true),

	held("balloon", "star", 3, { en: "Balloon dog", fr: "Chien en ballon", he: "כלב בלון" }),
	held("star-wand", "star", 7, { en: "Star wand", fr: "Baguette étoile", he: "שרביט כוכב" }),
	held("heart-wand", "star", 11, { en: "Heart wand", fr: "Baguette des cœurs", he: "שרביט לבבות" }, true),
	held("rainbow-wand", "star", 12, { en: "Rainbow wand", fr: "Baguette arc-en-ciel", he: "שרביט קשת בענן" }, true),

	held("mushroom", "witch", 3, { en: "Forest mushroom", fr: "Champignon des bois", he: "פטריית יער" }),
	held("broom", "witch", 8, { en: "Flying broom", fr: "Balai volant", he: "מטאטא מעופף" }),
	held("cauldron", "witch", 11, { en: "Bubbling cauldron", fr: "Chaudron bouillonnant", he: "קדרה מבעבעת" }, true),
	held("sparkle-broom", "witch", 12, { en: "Stardust broom", fr: "Balai d'étoiles", he: "מטאטא אבק כוכבים" }, true),

	held("basket", "explorer", 5, { en: "Mushroom basket", fr: "Panier de champignons", he: "סל פטריות" }),
	held("spyglass", "explorer", 5, { en: "Spyglass", fr: "Longue-vue", he: "משקפת" }),
	held("lantern", "explorer", 10, { en: "Glowing lantern", fr: "Lanterne lumineuse", he: "פנס זוהר" }, true),
	held("compass", "explorer", 12, { en: "Magic compass", fr: "Boussole magique", he: "מצפן קסום" }, true),
];

export const WARDROBE: readonly WardrobeItem[] = [
	...SHIRT_COLOURS,
	...CAPE_COLOURS,
	/* Hats go over hair, not through it: the Explorer's cap is part of her head, and the Star's bows would pierce a brim. */
	{ id: "hat-helmet", slot: "hat", price: 5, name: { en: "Knight's helmet", fr: "Casque de chevalier", he: "קסדת אביר" }, only: ["knight", "mage", "rogue", "star", "witch"] },
	{ id: "hat-wizard", slot: "hat", price: 5, name: { en: "Wizard's hat", fr: "Chapeau de magicien", he: "כובע קוסם" }, only: ["knight", "mage", "rogue", "witch"] },
	...DORM_CAPS,
	...HELD,
];

const BY_ID = new Map(WARDROBE.map((item) => [item.id, item]));
export const wardrobeItem = (id: string): WardrobeItem | undefined => BY_ID.get(id);

/** Can this figure wear the item? Not when it is kept for others, and not when it is the hat the figure already has on. */
export function suits(item: WardrobeItem, avatar: Avatar): boolean {
	if (item.only && !item.only.includes(avatar)) return false;
	return !(item.slot === "hat" && OWN_HAT[avatar] !== null && HAT_MESH[item.id] === OWN_HAT[avatar]);
}
/** What the shop shows one figure, in catalog order: what suits it, and of the gifts only those in `owned`. */
export const wardrobeFor = (avatar: Avatar, owned: readonly string[] = []): WardrobeItem[] => WARDROBE.filter((item) => suits(item, avatar) && (!item.gift || owned.includes(item.id)));
