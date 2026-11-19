import { isLocale, type Locale } from "@/lib/i18n/locales";
import { PLAY_PROGRESS_KEY, type PlayStorage } from "./play/progress";
import { dormKeyFor } from "./world/dorm";
import { shopKeyFor } from "./world/shop";

/**
 * Up to three children play on one device, each in a save slot. Each slot's play record lives under its own key
 * and is read by the unchanged strict code in `play/progress.ts`; slot 1 keeps the key used before slots existed,
 * so no progress moves. A small, forgiving profile list holds what is not progress: nickname, character, dates.
 * Nothing here leaves the device.
 */
export const PROFILES_KEY = "academy-ygo:junior:profiles:v1";
export const SLOTS = [1, 2, 3] as const;
export type Slot = (typeof SLOTS)[number];
/** The first three are the Adventurers; the last three are the girls. A save keeps the id, so ids never change. */
export const AVATARS = ["knight", "mage", "rogue", "star", "witch", "explorer"] as const;
export type Avatar = (typeof AVATARS)[number];
export const NAME_MAX = 12;

export interface Profile {
	/** Cleaned nickname. Empty means "show the default name". */
	name: string;
	avatar: Avatar;
	/** ISO date-time. Also identifies this save: a slot deleted and created again gets a new value. */
	createdAt: string;
	/** ISO date-time of the last time the slot was opened. */
	playedAt: string;
	/** A save from before slots existed, found under today's key: no character was chosen yet. Never stored. */
	legacy?: true;
	/** The language this child plays in. Left out: the site's language, whatever it is. */
	locale?: Locale;
}
export interface Profiles {
	version: 1;
	/** Index 0 is slot 1. Null is an empty slot. */
	slots: [Profile | null, Profile | null, Profile | null];
	/** The slot opened last, for "Continue". */
	last: Slot | null;
}
/** Removing a slot needs `removeItem`, so the slot code takes the full storage shape. */
export type SlotStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const slotKey = (slot: Slot) => (slot === 1 ? PLAY_PROGRESS_KEY : `${PLAY_PROGRESS_KEY}:slot-${slot}`);

/** The storage `progress.ts` expects, pointed at one slot's key. */
export function slotStorage(storage: Pick<Storage, "getItem" | "setItem">, slot: Slot): PlayStorage {
	const key = slotKey(slot);
	return { getItem: () => storage.getItem(key), setItem: (_key, value) => storage.setItem(key, value) };
}

/** The character of a save whose choice is unknown (a save from before slots, or an unknown value). */
export const DEFAULT_AVATAR: Avatar = "knight";
const LEGACY_CREATED = "legacy";
const isSlot = (value: unknown): value is Slot => value === 1 || value === 2 || value === 3;
/** The character is chosen for good once the first mission is done (the owner's rule): it can change only before. */
export const characterLocked = (levelsSolved: number) => levelsSolved > 0;
export const isAvatar = (value: unknown): value is Avatar => typeof value === "string" && (AVATARS as readonly string[]).includes(value);

function parseProfile(raw: unknown): Profile | null {
	if (typeof raw !== "object" || raw === null) return null;
	const data = raw as Record<string, unknown>;
	if (typeof data.name !== "string" || typeof data.createdAt !== "string" || typeof data.playedAt !== "string") return null;
	return { name: cleanName(data.name), avatar: isAvatar(data.avatar) ? data.avatar : DEFAULT_AVATAR, createdAt: data.createdAt, playedAt: data.playedAt, ...(isLocale(data.locale) && { locale: data.locale }) };
}
/** What a profile keeps of itself when it is written again: its language, when it has one. */
const ownLocale = (profile: Profile) => (profile.locale ? { locale: profile.locale } : {});

function readStored(storage: Pick<Storage, "getItem">): Profiles {
	const empty: Profiles = { version: 1, slots: [null, null, null], last: null };
	try {
		const raw = storage.getItem(PROFILES_KEY);
		if (!raw) return empty;
		const data = JSON.parse(raw) as Record<string, unknown>;
		if (typeof data !== "object" || data === null || !Array.isArray(data.slots)) return empty;
		const slots = SLOTS.map((slot) => parseProfile((data.slots as unknown[])[slot - 1])) as Profiles["slots"];
		return { version: 1, slots, last: isSlot(data.last) && slots[data.last - 1] ? data.last : null };
	} catch {
		return empty;
	}
}

/** The three slots. Never throws; a missing or broken list is empty. A play record found under today's key with no entry shows as slot 1. */
export function loadProfiles(storage: Pick<Storage, "getItem">): Profiles {
	const profiles = readStored(storage);
	if (!profiles.slots[0]) {
		let legacy = false;
		try {
			legacy = storage.getItem(PLAY_PROGRESS_KEY) !== null;
		} catch {
			legacy = false;
		}
		if (legacy) {
			profiles.slots[0] = { name: "", avatar: DEFAULT_AVATAR, createdAt: LEGACY_CREATED, playedAt: "", legacy: true };
			/* The only save there is: "Continue" opens it. */
			profiles.last ??= 1;
		}
	}
	return profiles;
}

function write(storage: SlotStorage, profiles: Profiles): Profiles {
	const stored = { ...profiles, slots: profiles.slots.map((profile) => (profile ? { name: profile.name, avatar: profile.avatar, createdAt: profile.createdAt, playedAt: profile.playedAt, ...ownLocale(profile) } : null)) };
	try {
		storage.setItem(PROFILES_KEY, JSON.stringify(stored));
	} catch {
		/* A full or blocked storage: play goes on, the list is rebuilt next time. */
	}
	return profiles;
}
const withSlot = (profiles: Profiles, slot: Slot, profile: Profile | null): Profiles => {
	const slots = [...profiles.slots] as Profiles["slots"];
	slots[slot - 1] = profile;
	return { ...profiles, slots };
};

/** Removes what a save keeps beside its profile: its play record, what it bought with its stars, and its dorm. */
function forget(storage: SlotStorage, slot: Slot) {
	for (const key of [slotKey(slot), shopKeyFor(slotKey(slot)), dormKeyFor(slotKey(slot))])
		try {
			storage.removeItem(key);
		} catch {
			/* already gone */
		}
}

/** A new save in `slot`, in its own language when one is given. Whatever was there before, progress included, is gone. */
export function createSlot(storage: SlotStorage, slot: Slot, choice: { name: string; avatar: Avatar; locale?: Locale | null }, now: Date = new Date()): Profiles {
	forget(storage, slot);
	const at = now.toISOString();
	const profile: Profile = { name: cleanName(choice.name), avatar: choice.avatar, createdAt: at, playedAt: at, ...(choice.locale && { locale: choice.locale }) };
	return write(storage, { ...withSlot(loadProfiles(storage), slot, profile), last: slot });
}

/** Changes the nickname, the character or the language (null: the site's again) of an existing save. A legacy slot 1 becomes a stored profile. */
export function updateSlot(storage: SlotStorage, slot: Slot, change: { name?: string; avatar?: Avatar; locale?: Locale | null }, now: Date = new Date()): Profiles {
	const profiles = loadProfiles(storage);
	const current = profiles.slots[slot - 1];
	if (!current) return profiles;
	const createdAt = current.legacy ? now.toISOString() : current.createdAt;
	const locale = change.locale === undefined ? current.locale : change.locale;
	const next: Profile = { name: change.name === undefined ? current.name : cleanName(change.name), avatar: change.avatar ?? current.avatar, createdAt, playedAt: current.playedAt || now.toISOString(), ...(locale && { locale }) };
	return write(storage, withSlot(profiles, slot, next));
}

/** Marks `slot` as opened now and as the one "Continue" opens. */
export function touchSlot(storage: SlotStorage, slot: Slot, now: Date = new Date()): Profiles {
	const profiles = loadProfiles(storage);
	const current = profiles.slots[slot - 1];
	if (!current) return profiles;
	const createdAt = current.legacy ? now.toISOString() : current.createdAt;
	return write(storage, { ...withSlot(profiles, slot, { name: current.name, avatar: current.avatar, createdAt, playedAt: now.toISOString(), ...ownLocale(current) }), last: slot });
}

/** Removes a save: its play record and its profile. */
export function deleteSlot(storage: SlotStorage, slot: Slot): Profiles {
	forget(storage, slot);
	const profiles = withSlot(loadProfiles(storage), slot, null);
	return write(storage, { ...profiles, last: profiles.last === slot ? null : profiles.last });
}

export const firstEmptySlot = (profiles: Profiles): Slot | null => SLOTS.find((slot) => !profiles.slots[slot - 1]) ?? null;

/** False when the save a page opened was deleted or replaced since, in another tab: that page must stop saving. */
export const isSameSave = (profiles: Profiles, slot: Slot, createdAt: string) => profiles.slots[slot - 1]?.createdAt === createdAt;

/** Letters of any alphabet, marks, digits, space, hyphen and apostrophe; NFC; single spaces; at most 12 characters. */
export function cleanName(raw: string): string {
	const kept = raw
		.normalize("NFC")
		.replace(/\s+/g, " ")
		.replace(/[^\p{L}\p{M}\p{N} '’-]/gu, "")
		.replace(/ {2,}/g, " ")
		.trim();
	return Array.from(kept).slice(0, NAME_MAX).join("").trim();
}
