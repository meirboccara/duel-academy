import type { Avatar } from "@/lib/junior/profiles";
import { CAPE_MESH, HAT_MESH, HELD_MESH, OWN_CAPE, OWN_HAT, suits, wardrobeItem, type Outfit, type WardrobeSlot } from "./wardrobe";

/**
 * What an `Outfit` means for the 3D figure, worked out without any 3D: which colours go over the body and the cape,
 * whether the figure keeps the hat it came with, and which meshes of `public/world/hero-wardrobe.glb` hang from
 * which bone. `hero.tsx` and `outfit-preview.tsx` only carry it out.
 *
 * An item id that is not in the catalog (an old save, a typo), or that this figure cannot wear (it was bought for
 * another figure of the same save), is simply not worn: the figure keeps its own look for that slot.
 */

export { OWN_HAT };

/** Bones of the shared skeleton a wardrobe mesh can hang from, as three.js names them (it drops the dot of `handslot.r`). */
export type OutfitBone = "head" | "chest" | "handslotr" | "handslotl";

/**
 * The hand each held thing was made for. The shields and the open book are left-hand pieces in the pack: put in the
 * right hand they would face backwards, so they stay on the left. Small things carried rather than wielded (the
 * basket, the cauldron, the lantern) go in the left hand too, which the idle pose holds lower and stiller.
 */
const LEFT = ["Round_Shield", "Badge_Shield", "Spellbook_open", "Knife_Offhand", "Basket_Mushrooms", "Mushroom", "Cauldron", "balloon_dog_blue", "Explorer_Lantern", "Explorer_Compass"];
const HELD_BONE: Readonly<Record<string, OutfitBone>> = Object.fromEntries(LEFT.map((mesh) => [mesh, "handslotl"]));

/** The name three.js gives a bone of the pack: letters, digits and underscores only. */
export const boneName = (name: string): string => name.replace(/[^\w]/g, "");

/**
 * Small corrections so a piece made for one figure sits well on another, or reads better in a child's hand. They
 * were set by eye; the piece is scaled, turned and moved about its bone.
 */
export interface OutfitFit {
	scale?: number;
	/** A turn about the bone's axes, in radians: first about x, then y, then z. */
	turn?: readonly [number, number, number];
	/** A move along the bone's axes, in the figure's units (it is about 2.2 tall). */
	move?: readonly [number, number, number];
}
/** Hats that need room on a head they were not made for: thick hair would come through the brim. */
/* The dorm cap is small, to sit on top of the head; the tufts of the Knight and the Star would come through its crown. */
const HAT_FIT: Readonly<Partial<Record<Avatar, Readonly<Record<string, OutfitFit>>>>> = { knight: { Mage_Hat: { scale: 1.16 }, Dorm_Cap: { scale: 1.07 } }, star: { Dorm_Cap: { scale: 1.13 } } };
/**
 * The idle pose lets a weapon hang forward and down, as a fighter at rest would; seen from the front, a child would
 * hardly see what was bought. So the blades and the wands are raised, the staff and the broom are stood upright
 * like a walking stick, and the crossbow, which would point at the ground, points ahead.
 */
const RAISED: OutfitFit = { turn: [0, 0, Math.PI / 3] };
const UPRIGHT: OutfitFit = { turn: [0, 0, Math.PI / 2] };
/** The same in the left hand, which is the right hand's mirror: the basket hangs from its handle and the balloon dog stands on the hand. */
const UPRIGHT_LEFT: OutfitFit = { turn: [0, 0, -Math.PI / 2] };
const HELD_FIT: Readonly<Record<string, OutfitFit>> = {
	"1H_Sword": RAISED,
	"2H_Sword": RAISED,
	"1H_Wand": RAISED,
	"2H_Staff": UPRIGHT,
	"1H_Crossbow": UPRIGHT,
	/* The star is flat: it is first turned to face the child. */
	MagicalGirl_Wand: { turn: [0, Math.PI / 2, Math.PI / 3] },
	/* The broom stands on its bristles: it is lifted so they rest on the ground instead of going through it. */
	Broom: { turn: [0, 0, Math.PI / 2], move: [-0.6, 0, 0] },
	Basket_Mushrooms: UPRIGHT_LEFT,
	balloon_dog_blue: UPRIGHT_LEFT,
	Knife: RAISED,
	Knife_Offhand: { turn: [0, 0, -Math.PI / 3] },
	"2H_Crossbow": UPRIGHT,
	Mushroom: UPRIGHT_LEFT,
	/* The cauldron is a floor piece of the Witch's pack: made small, it is a pot carried by hand. */
	Cauldron: { scale: 0.45, turn: [0, 0, -Math.PI / 2] },
	Explorer_Lantern: UPRIGHT_LEFT,
	Explorer_Compass: UPRIGHT_LEFT,
	Explorer_Spyglass: RAISED,
};

/**
 * A little magic drawn on a held thing, by `hero.tsx`: glowing shapes that move (and stay still under reduced
 * motion). `at` is where, in the piece's own space before its fit; with `to`, the effect runs along the line
 * between the two (a blade, a broom's bristles). Sizes are in the figure's units.
 *
 * flame: tongues rising; sparks: a crackle of short flashes; orbit: shards circling a glowing heart; twinkle:
 * stars that light up and fade; hearts: small hearts floating up; rainbow: a wheel of seven colours; bubbles and
 * smoke: rising; lamp: a steady glow that flickers.
 */
export type EffectKind = "flame" | "sparks" | "orbit" | "twinkle" | "hearts" | "rainbow" | "bubbles" | "smoke" | "lamp";
export interface OutfitEffect {
	kind: EffectKind;
	at: readonly [number, number, number];
	to?: readonly [number, number, number];
	/** The main colour, and the colour of the glowing heart when it differs. */
	colour: string;
	second?: string;
	/** The size of one piece of the effect. About 0.08 when left out. */
	size?: number;
}
/** What a held thing has beyond its mesh: a colour laid over it, its magic, and a second piece for the other hand. */
interface HeldExtra {
	tint?: string;
	effects?: readonly OutfitEffect[];
	also?: { mesh: string; effects?: readonly OutfitEffect[] };
}
/** The head of the Mage's staff, where its magic burns. */
const STAFF_TIP = [-0.02, 1.08, 0] as const;
const WAND_TIP = [0, 0.8, 0] as const;
const SHADOW: OutfitEffect = { kind: "smoke", at: [0, 0.25, 0], to: [0, 0.9, 0], colour: "#4a2a8a", size: 0.11 };
const HELD_EXTRA: Readonly<Record<string, HeldExtra>> = {
	"held-flame-sword": { effects: [{ kind: "flame", at: [0, 0.3, 0], to: [0, 1.3, 0], colour: "#ff6a1a", second: "#ffd23a", size: 0.17 }] },
	"held-holy-shield": { tint: "#f2c94c", effects: [{ kind: "twinkle", at: [-0.35, -0.4, 0.3], to: [0.35, 0.4, 0.3], colour: "#fff3b0", size: 0.17 }, { kind: "lamp", at: [0, 0, 0.3], colour: "#ffe27a", size: 0.12 }] },
	"held-glow-book": { effects: [{ kind: "orbit", at: [0, 0.6, 0], colour: "#ffe9a8", second: "#b98cff", size: 0.1 }] },
	"held-ice-staff": { effects: [{ kind: "orbit", at: STAFF_TIP, colour: "#ffffff", second: "#8fe3ff", size: 0.16 }] },
	"held-fire-staff": { effects: [{ kind: "flame", at: STAFF_TIP, colour: "#ff6a1a", second: "#ffd23a", size: 0.19 }] },
	"held-lightning-staff": { effects: [{ kind: "sparks", at: STAFF_TIP, colour: "#ffffff", second: "#5cc8ff", size: 0.19 }] },
	"held-smoke-bomb": { effects: [{ kind: "smoke", at: [0, 0.45, 0], colour: "#c3c6d0", size: 0.14 }] },
	"held-shadow-daggers": { effects: [SHADOW], also: { mesh: "Knife_Offhand", effects: [SHADOW] } },
	"held-venom-crossbow": { effects: [{ kind: "bubbles", at: [0.95, 0.08, 0], colour: "#7be04a", size: 0.09 }, { kind: "lamp", at: [0.95, 0.08, 0], colour: "#7be04a", size: 0.07 }] },
	"held-heart-wand": { tint: "#ff7fb8", effects: [{ kind: "hearts", at: WAND_TIP, colour: "#ff4f9a", size: 0.16 }] },
	"held-rainbow-wand": { effects: [{ kind: "rainbow", at: WAND_TIP, colour: "#ffffff", size: 0.12 }] },
	"held-cauldron": { effects: [{ kind: "bubbles", at: [0, 0.8, 0], colour: "#7be04a", size: 0.25 }] },
	"held-sparkle-broom": { effects: [{ kind: "twinkle", at: [0, -0.8, 0], to: [0, -1.5, 0], colour: "#ffe27a", size: 0.16 }] },
	"held-lantern": { effects: [{ kind: "lamp", at: [0, 0.2, 0], colour: "#ffb53a", second: "#fff1b8", size: 0.12 }] },
	"held-compass": { effects: [{ kind: "orbit", at: [0, 0.14, 0], colour: "#ffe27a", second: "#ff5a5a", size: 0.09 }] },
};

export interface OutfitAttachment {
	/** The mesh node in `hero-wardrobe.glb`. */
	mesh: string;
	bone: OutfitBone;
	fit?: OutfitFit;
	/** `#rrggbb` laid over this piece: the cape lent to a figure that has none, a dorm's cap, a special held thing. */
	tint?: string;
	/** The magic drawn on this piece. */
	effects?: readonly OutfitEffect[];
}

export interface OutfitLook {
	/** `#rrggbb` laid over the body, or null for the figure's own colours. */
	shirt: string | null;
	/** `#rrggbb` laid over the figure's own cape. Null also for a figure without one: its cape is in `attach`. */
	cape: string | null;
	/** The figure's own hat or helmet shows. Always false for a figure that has none. */
	ownHat: boolean;
	/** Meshes of the wardrobe file to hang on the figure: at most one hat, one cape and one held thing (two pieces for a pair of daggers). */
	attach: OutfitAttachment[];
}

export function outfitLook(avatar: Avatar, outfit: Outfit | undefined): OutfitLook {
	/** The catalog item worn in a slot, when it is one this figure can wear. */
	const worn = (slot: WardrobeSlot) => {
		const item = outfit?.[slot] ? wardrobeItem(outfit[slot]) : undefined;
		return item?.slot === slot && suits(item, avatar) ? item : undefined;
	};
	const tint = (slot: "shirt" | "cape"): string | null => {
		const hex = worn(slot)?.colour;
		return hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : null;
	};
	const own = OWN_HAT[avatar];
	const hatItem = worn("hat");
	const heldItem = worn("held");
	const hat = hatItem ? HAT_MESH[hatItem.id] : undefined;
	const held = heldItem ? HELD_MESH[heldItem.id] : undefined;
	const cape = tint("cape");
	const attach: OutfitAttachment[] = [];
	/* The hat the figure came with is already on its head: nothing to fetch for it. */
	if (hat && hat !== own) attach.push({ mesh: hat, bone: "head", ...(HAT_FIT[avatar]?.[hat] && { fit: HAT_FIT[avatar][hat] }), ...(hatItem?.colour && { tint: hatItem.colour }) });
	if (cape && !OWN_CAPE[avatar]) attach.push({ mesh: CAPE_MESH, bone: "chest", tint: cape });
	const extra = heldItem ? HELD_EXTRA[heldItem.id] : undefined;
	const hold = (mesh: string, effects?: readonly OutfitEffect[]) => attach.push({ mesh, bone: HELD_BONE[mesh] ?? "handslotr", ...(HELD_FIT[mesh] && { fit: HELD_FIT[mesh] }), ...(extra?.tint && { tint: extra.tint }), ...(effects && { effects }) });
	if (held) hold(held, extra?.effects);
	if (held && extra?.also) hold(extra.also.mesh, extra.also.effects);
	return { shirt: tint("shirt"), cape: OWN_CAPE[avatar] ? cape : null, ownHat: !!own && (!hat || hat === own), attach };
}

/** One string per look: the 3D side redoes its work only when this changes, not on every new `outfit` object. */
export const lookKey = (look: OutfitLook): string => [look.shirt ?? "", look.cape ?? "", look.ownHat ? "own" : "", ...look.attach.map((item) => `${item.mesh}@${item.bone}${item.tint ?? ""}${(item.effects ?? []).map((effect) => effect.kind + effect.colour).join("")}`)].join("|");
