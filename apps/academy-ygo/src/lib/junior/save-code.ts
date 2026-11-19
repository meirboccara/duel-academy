import { isLocale, type Locale } from "@/lib/i18n/locales";
import { LEVELS } from "./play/levels";
import type { LevelRecord, PlayProgress } from "./play/progress";
import { DEFAULT_AVATAR, cleanName, isAvatar, type Avatar } from "./profiles";
import { parseShop } from "./world/shop";
import type { Outfit } from "./world/wardrobe";
import { type Dorm, isDorm } from "./world/dorm";

/**
 * "Save a copy" and "Load a copy": one child's save as a text code, to keep in Notes, Mail or a file, and to load in
 * another browser (a Home Screen app, a new iPad, a cleared Safari). Format: `DA1.<payload>.<check>`, where payload is
 * base64url of the UTF-8 JSON `{ v: 1, name, avatar, play, shop, items, wear, dorm, locale }` and check is the 32-bit FNV-1a hash of the payload in
 * 8 hex digits. The check only catches a code cut or changed when copied; the code is not secret and holds the nickname.
 */
export interface SaveData {
	name: string;
	avatar: Avatar;
	play: PlayProgress;
	/** Cards bought in Grandpa's shop. Missing in codes made before the shop: nothing bought. */
	shop?: string[];
	/** Things for the figure bought there, and what it wears. Missing in older codes: nothing. */
	items?: string[];
	wear?: Outfit;
	/** The dorm chosen; null or missing (older codes) when none yet. */
	dorm?: Dorm | null;
	/** The save's own language; null or missing (older codes) when it follows the site's. */
	locale?: Locale | null;
}
export type Decoded = { ok: true; save: SaveData } | { ok: false; reason: "not-a-code" | "damaged" };

const PREFIX = "DA1";
const LEVEL_IDS = new Set(LEVELS.map((level) => level.id));

function fnv1a(text: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, "0");
}
function toBase64Url(text: string): string {
	let binary = "";
	for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(payload: string): string {
	const binary = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
	return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeSave(save: SaveData): string {
	const payload = toBase64Url(JSON.stringify({ v: 1, name: save.name, avatar: save.avatar, play: save.play, shop: save.shop ?? [], items: save.items ?? [], wear: save.wear ?? {}, dorm: save.dorm ?? null, locale: save.locale ?? null }));
	return `${PREFIX}.${payload}.${fnv1a(payload)}`;
}

/** Keeps only what this build knows, so the strict play-record parser never rejects a loaded save. */
function cleanPlay(raw: unknown): PlayProgress {
	const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
	const levels: Record<string, LevelRecord> = {};
	if (typeof data.levels === "object" && data.levels !== null)
		for (const [id, value] of Object.entries(data.levels)) {
			if (!LEVEL_IDS.has(id) || typeof value !== "object" || value === null) continue;
			const { clean, firstTry } = value as Record<string, unknown>;
			if (typeof clean === "boolean" && typeof firstTry === "boolean") levels[id] = { clean, firstTry };
		}
	const slips: Record<string, number> = {};
	if (typeof data.slips === "object" && data.slips !== null)
		for (const [reason, count] of Object.entries(data.slips)) if (typeof count === "number" && Number.isInteger(count) && count >= 0) slips[reason] = count;
	return { version: 1, levels, slips, calm: data.calm === true, sound: data.sound === true };
}

export function decodeSave(input: string): Decoded {
	const code = input.replace(/\s+/g, "");
	const parts = code.split(".");
	if (parts.length !== 3 || parts[0] !== PREFIX || !/^[0-9a-f]{8}$/.test(parts[2]!)) return { ok: false, reason: "not-a-code" };
	const [, payload, check] = parts as [string, string, string];
	if (fnv1a(payload) !== check) return { ok: false, reason: "damaged" };
	try {
		const data = JSON.parse(fromBase64Url(payload)) as Record<string, unknown>;
		if (data.v !== 1) return { ok: false, reason: "damaged" };
		const avatar = isAvatar(data.avatar) ? data.avatar : DEFAULT_AVATAR;
		const shop = parseShop({ cards: data.shop, items: data.items, wear: data.wear });
		return { ok: true, save: { name: cleanName(typeof data.name === "string" ? data.name : ""), avatar, play: cleanPlay(data.play), shop: shop.cards, items: shop.items, wear: shop.wear, dorm: isDorm(data.dorm) ? data.dorm : null, locale: isLocale(data.locale) ? data.locale : null } };
	} catch {
		return { ok: false, reason: "damaged" };
	}
}
