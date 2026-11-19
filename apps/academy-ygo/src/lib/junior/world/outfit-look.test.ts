import { describe, expect, it } from "vitest";
import { AVATARS } from "@/lib/junior/profiles";
import { boneName, lookKey, outfitLook } from "./outfit-look";
import { CAPE_MESH, DORM_CAPS, GIRLS, HAT_MESH, HELD, HELD_MESH, suits, WARDROBE, wardrobeFor, wardrobeItem } from "./wardrobe";

describe("outfitLook", () => {
	it("leaves the figure as it came when nothing is worn", () => {
		expect(outfitLook("knight", undefined)).toEqual({ shirt: null, cape: null, ownHat: true, attach: [] });
		expect(outfitLook("mage", {})).toEqual({ shirt: null, cape: null, ownHat: true, attach: [] });
		expect(outfitLook("rogue", {})).toEqual({ shirt: null, cape: null, ownHat: false, attach: [] });
	});

	it("reads the shirt and cape colours from the catalog", () => {
		const look = outfitLook("rogue", { shirt: "shirt-red", cape: "cape-gold" });
		expect(look.shirt).toBe("#d94040");
		expect(look.cape).toBe("#e0b02a");
	});

	it("does not take a cape colour for a shirt, nor an unknown id", () => {
		expect(outfitLook("knight", { shirt: "cape-red", cape: "nope", hat: "nope", held: "nope" })).toEqual({ shirt: null, cape: null, ownHat: true, attach: [] });
	});

	it("swaps the hat: the figure's own goes, the other hangs from the head", () => {
		expect(outfitLook("knight", { hat: "hat-wizard" })).toMatchObject({ ownHat: false, attach: [{ mesh: "Mage_Hat", bone: "head" }] });
		expect(outfitLook("mage", { hat: "hat-helmet" })).toMatchObject({ ownHat: false, attach: [{ mesh: "Knight_Helmet", bone: "head" }] });
		expect(outfitLook("rogue", { hat: "hat-wizard" })).toMatchObject({ ownHat: false, attach: [{ mesh: "Mage_Hat", bone: "head" }] });
	});

	it("keeps the figure's own hat when that very hat is chosen, and fetches nothing for it", () => {
		expect(outfitLook("knight", { hat: "hat-helmet" })).toMatchObject({ ownHat: true, attach: [] });
		expect(outfitLook("mage", { hat: "hat-wizard" })).toMatchObject({ ownHat: true, attach: [] });
	});

	it("puts held things in the right hand, the shield and the book in the left", () => {
		expect(outfitLook("knight", { held: "held-sword" }).attach).toMatchObject([{ mesh: "1H_Sword", bone: "handslotr" }]);
		expect(outfitLook("knight", { held: "held-shield" }).attach).toEqual([{ mesh: "Round_Shield", bone: "handslotl" }]);
		expect(outfitLook("mage", { held: "held-book" }).attach).toEqual([{ mesh: "Spellbook_open", bone: "handslotl" }]);
	});

	it("widens the wizard hat for the Knight only, and stands the staff upright", () => {
		expect(outfitLook("knight", { hat: "hat-wizard" }).attach[0]?.fit?.scale).toBeGreaterThan(1);
		expect(outfitLook("rogue", { hat: "hat-wizard" }).attach[0]?.fit).toBeUndefined();
		expect(outfitLook("mage", { held: "held-staff" }).attach[0]?.fit?.turn).toEqual([0, 0, Math.PI / 2]);
		expect(outfitLook("knight", { held: "held-shield" }).attach[0]?.fit).toBeUndefined();
	});

	it("gives every hat and held item of the catalog a mesh, and shows it on every figure it is sold to", () => {
		for (const item of WARDROBE.filter((entry) => entry.slot === "hat" || entry.slot === "held")) {
			expect(HAT_MESH[item.id] ?? HELD_MESH[item.id], item.id).toBeTruthy();
			for (const avatar of AVATARS) {
				const look = outfitLook(avatar, { [item.slot]: item.id });
				/* A pair of daggers is two pieces, one for each hand. */
				expect(look.attach.length, `${item.id} on ${avatar}`).toBe(!suits(item, avatar) ? 0 : item.id === "held-shadow-daggers" ? 2 : 1);
			}
		}
	});

	it("does not put on a thing kept for other figures: the figure keeps its own look", () => {
		expect(outfitLook("knight", { shirt: "shirt-pink", cape: "cape-pink", held: "held-broom" })).toEqual({ shirt: null, cape: null, ownHat: true, attach: [] });
		expect(outfitLook("explorer", { hat: "hat-helmet" })).toEqual({ shirt: null, cape: null, ownHat: false, attach: [] });
		expect(outfitLook("star", { hat: "hat-wizard" }).attach).toEqual([]);
	});

	it("keeps the Witch's own hat until she wears another", () => {
		expect(outfitLook("witch", {}).ownHat).toBe(true);
		expect(outfitLook("witch", { hat: "hat-wizard" })).toMatchObject({ ownHat: false, attach: [{ mesh: "Mage_Hat", bone: "head" }] });
	});

	it("puts a dorm's cap, in the dorm's colour, on any of the six figures in place of its own hat", () => {
		for (const avatar of AVATARS) {
			expect(outfitLook(avatar, { hat: "hat-cap-slifer" }), avatar).toMatchObject({ ownHat: false, attach: [{ mesh: "Dorm_Cap", bone: "head", tint: "#d23a3a" }] });
		}
		expect(outfitLook("mage", { hat: "hat-cap-ra" }).attach[0]?.tint).toBe("#e8b931");
		expect(outfitLook("witch", { hat: "hat-cap-obelisk" }).attach[0]?.tint).toBe("#2f62c9");
		/* A plain hat keeps its own colours. */
		expect(outfitLook("rogue", { hat: "hat-helmet" }).attach[0]?.tint).toBeUndefined();
	});

	it("tints the cape a figure has, and lends a tinted one to a figure without", () => {
		expect(outfitLook("knight", { cape: "cape-red" })).toMatchObject({ cape: "#c0303a", attach: [] });
		for (const girl of GIRLS) expect(outfitLook(girl, { cape: "cape-pink" }), girl).toMatchObject({ cape: null, attach: [{ mesh: CAPE_MESH, bone: "chest", tint: "#e85c9c" }] });
		expect(outfitLook("star", { shirt: "shirt-turquoise" }).shirt).toBe("#27b5ad");
	});

	it("puts the basket and the balloon dog in the left hand, the star wand and the broom in the right", () => {
		expect(outfitLook("explorer", { held: "held-basket" }).attach).toMatchObject([{ mesh: "Basket_Mushrooms", bone: "handslotl" }]);
		expect(outfitLook("star", { held: "held-balloon" }).attach).toMatchObject([{ mesh: "balloon_dog_blue", bone: "handslotl" }]);
		expect(outfitLook("star", { held: "held-star-wand" }).attach).toMatchObject([{ mesh: "MagicalGirl_Wand", bone: "handslotr" }]);
		expect(outfitLook("witch", { held: "held-broom" }).attach[0]).toMatchObject({ mesh: "Broom", bone: "handslotr", fit: { move: [-0.6, 0, 0] } });
	});
});

describe("wardrobeFor", () => {
	const ids = (avatar: (typeof AVATARS)[number]) => wardrobeFor(avatar).map((item) => item.id);

	it("keeps the girls' things for the girls and offers the rest to everyone", () => {
		for (const id of ["shirt-pink", "shirt-turquoise", "cape-pink"]) {
			for (const avatar of AVATARS) expect(ids(avatar).includes(id), `${id} for ${avatar}`).toBe(GIRLS.includes(avatar));
		}
		for (const avatar of AVATARS) expect(ids(avatar)).toEqual(expect.arrayContaining(["shirt-red", "cape-gold"]));
	});

	it("never offers a figure the hat it already wears, nor a hat its hair would come through", () => {
		expect(ids("knight").filter((id) => id.startsWith("hat-"))).toEqual(["hat-wizard"]);
		expect(ids("mage").filter((id) => id.startsWith("hat-"))).toEqual(["hat-helmet"]);
		expect(ids("rogue").filter((id) => id.startsWith("hat-"))).toEqual(["hat-helmet", "hat-wizard"]);
		expect(ids("star").filter((id) => id.startsWith("hat-"))).toEqual(["hat-helmet"]);
		expect(ids("witch").filter((id) => id.startsWith("hat-"))).toEqual(["hat-helmet", "hat-wizard"]);
		expect(ids("explorer").filter((id) => id.startsWith("hat-"))).toEqual([]);
	});

	it("never lists a dorm's cap for sale: it shows once it is owned, for every figure", () => {
		expect(DORM_CAPS.map((item) => item.id)).toEqual(["hat-cap-slifer", "hat-cap-ra", "hat-cap-obelisk"]);
		for (const item of DORM_CAPS) expect(item, item.id).toMatchObject({ slot: "hat", price: 0, gift: true });
		for (const avatar of AVATARS) {
			expect(ids(avatar).filter((id) => id.startsWith("hat-cap-")), avatar).toEqual([]);
			expect(wardrobeFor(avatar, ["hat-cap-ra", "shirt-red"]).map((item) => item.id).filter((id) => id.startsWith("hat-cap-")), avatar).toEqual(["hat-cap-ra"]);
		}
		/* Owning a thing does not make a figure wear what is kept for others. */
		expect(wardrobeFor("knight", ["held-broom"]).some((item) => item.id === "held-broom")).toBe(false);
		expect(WARDROBE.filter((item) => item.gift).map((item) => item.id)).toEqual(DORM_CAPS.map((item) => item.id));
	});

	it("names avatars that exist, keeps the ids of the first catalog, and prices everything from 3 to 10 stars", () => {
		for (const item of WARDROBE) {
			for (const avatar of item.only ?? []) expect(AVATARS, item.id).toContain(avatar);
			expect(item.price, item.id).toBeGreaterThanOrEqual(item.gift ? 0 : 3);
			expect(item.price, item.id).toBeLessThanOrEqual(item.gift ? 0 : item.special ? 12 : 10);
			for (const name of Object.values(item.name)) expect(name.trim(), item.id).not.toBe("");
		}
		expect(new Set(WARDROBE.map((item) => item.id)).size).toBe(WARDROBE.length);
		for (const id of ["shirt-red", "shirt-blue", "shirt-green", "shirt-purple", "shirt-gold", "cape-red", "cape-blue", "cape-black", "cape-gold", "hat-helmet", "hat-wizard", "held-wand", "held-book", "held-shield", "held-sword", "held-staff", "held-crossbow", "held-big-sword"]) {
			expect(wardrobeItem(id), id).toBeDefined();
		}
	});
});

describe("what each figure holds", () => {
	const heldBy = (avatar: (typeof AVATARS)[number]) => wardrobeFor(avatar).filter((item) => item.slot === "held");

	it("gives every figure at least four things of its own, two of them special, and shares none", () => {
		for (const avatar of AVATARS) {
			expect(heldBy(avatar).length, avatar).toBeGreaterThanOrEqual(4);
			expect(heldBy(avatar).filter((item) => item.special).length, avatar).toBeGreaterThanOrEqual(2);
		}
		for (const item of HELD) expect(item.only, item.id).toHaveLength(1);
		expect(WARDROBE.filter((item) => item.slot === "held")).toEqual(HELD);
		expect(HELD.reduce((sum, item) => sum + AVATARS.filter((avatar) => suits(item, avatar)).length, 0)).toBe(HELD.length);
	});

	it("keeps the Mage to staffs, wands and books, and the blades to the Knight", () => {
		expect(heldBy("mage").map((item) => item.id)).toEqual(["held-wand", "held-book", "held-staff", "held-glow-book", "held-ice-staff", "held-fire-staff", "held-lightning-staff"]);
		expect(heldBy("knight").map((item) => item.id)).toEqual(["held-shield", "held-sword", "held-big-sword", "held-flame-sword", "held-holy-shield"]);
		expect(outfitLook("mage", { held: "held-sword" }).attach).toEqual([]);
	});

	it("prices every special thing above the dearest plain thing of the same figure, bar the Knight's great sword", () => {
		for (const avatar of AVATARS) {
			const plain = Math.max(...heldBy(avatar).filter((item) => !item.special && item.id !== "held-big-sword").map((item) => item.price));
			for (const item of heldBy(avatar).filter((thing) => thing.special)) expect(item.price, item.id).toBeGreaterThan(plain);
		}
	});

	it("draws magic on every special thing and none on a plain one", () => {
		for (const item of HELD) {
			const [avatar] = item.only ?? [];
			if (!avatar) throw new Error(item.id);
			const effects = outfitLook(avatar, { held: item.id }).attach.flatMap((piece) => piece.effects ?? []);
			expect(effects.length > 0, item.id).toBe(!!item.special);
			for (const effect of effects) expect(effect.colour, item.id).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it("tells the three staffs apart: fire, lightning and ice on the same staff", () => {
		const magic = (id: string) => outfitLook("mage", { held: id }).attach[0];
		expect(magic("held-fire-staff")).toMatchObject({ mesh: "2H_Staff", effects: [{ kind: "flame" }] });
		expect(magic("held-lightning-staff")).toMatchObject({ mesh: "2H_Staff", effects: [{ kind: "sparks" }] });
		expect(magic("held-ice-staff")).toMatchObject({ mesh: "2H_Staff", effects: [{ kind: "orbit" }] });
		expect(magic("held-staff")?.effects).toBeUndefined();
		expect(new Set(["held-staff", "held-fire-staff", "held-lightning-staff", "held-ice-staff"].map((id) => lookKey(outfitLook("mage", { held: id })))).size).toBe(4);
	});

	it("puts a shadow dagger in each hand, and colours the heart wand and the shining shield", () => {
		expect(outfitLook("rogue", { held: "held-shadow-daggers" }).attach).toMatchObject([{ mesh: "Knife", bone: "handslotr", effects: [{ kind: "smoke" }] }, { mesh: "Knife_Offhand", bone: "handslotl", effects: [{ kind: "smoke" }] }]);
		expect(outfitLook("star", { held: "held-heart-wand" }).attach[0]).toMatchObject({ mesh: "MagicalGirl_Wand", tint: "#ff7fb8", effects: [{ kind: "hearts" }] });
		expect(outfitLook("knight", { held: "held-holy-shield" }).attach[0]).toMatchObject({ mesh: "Badge_Shield", bone: "handslotl", tint: "#f2c94c" });
	});
});

describe("lookKey", () => {
	it("is the same for two equal outfits and differs when a slot changes", () => {
		expect(lookKey(outfitLook("knight", { shirt: "shirt-red" }))).toBe(lookKey(outfitLook("knight", { shirt: "shirt-red" })));
		expect(lookKey(outfitLook("knight", { shirt: "shirt-red" }))).not.toBe(lookKey(outfitLook("knight", { shirt: "shirt-blue" })));
		expect(lookKey(outfitLook("knight", { hat: "hat-wizard" }))).not.toBe(lookKey(outfitLook("knight", {})));
		expect(lookKey(outfitLook("star", { cape: "cape-pink" }))).not.toBe(lookKey(outfitLook("star", { cape: "cape-red" })));
		expect(lookKey(outfitLook("rogue", { hat: "hat-cap-ra" }))).not.toBe(lookKey(outfitLook("rogue", { hat: "hat-cap-slifer" })));
	});
});

describe("boneName", () => {
	it("names bones as three.js does", () => {
		expect(boneName("handslot.r")).toBe("handslotr");
		expect(boneName("head")).toBe("head");
	});
});
