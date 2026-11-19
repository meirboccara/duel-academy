import { describe, expect, it } from "vitest";
import { LEVELS } from "./play/levels";
import { PLAY_PROGRESS_KEY, emptyPlayProgress, loadPlayProgress, recordSolve, savePlayProgress } from "./play/progress";
import { dormKeyFor } from "./world/dorm";
import { shopKeyFor } from "./world/shop";
import { PROFILES_KEY, cleanName, createSlot, deleteSlot, firstEmptySlot, isSameSave, loadProfiles, slotKey, slotStorage, touchSlot, updateSlot, type SlotStorage } from "./profiles";

function memoryStorage(initial: Record<string, string> = {}): SlotStorage & { data: Record<string, string> } {
	const data: Record<string, string> = { ...initial };
	return {
		data,
		getItem: (key) => (key in data ? data[key]! : null),
		setItem: (key, value) => {
			data[key] = String(value);
		},
		removeItem: (key) => {
			delete data[key];
		},
	};
}
const solved = (ids: string[]) => ids.reduce((p, id) => recordSolve(p, id, { tries: 1, firstTry: true, clean: true, hints: 0, slips: [] }), emptyPlayProgress());
const firstTwo = LEVELS.slice(0, 2).map((level) => level.id);
const NOW = new Date("2026-11-19T10:00:00.000Z");

describe("the profile list", () => {
	it("starts with three empty slots on a new device", () => {
		const profiles = loadProfiles(memoryStorage());
		expect(profiles.slots).toEqual([null, null, null]);
		expect(profiles.last).toBeNull();
	});

	it("shows today's single save as slot 1 with every solved level, without moving it", () => {
		const storage = memoryStorage({ [PLAY_PROGRESS_KEY]: JSON.stringify(solved(firstTwo)) });
		const profiles = loadProfiles(storage);
		expect(profiles.slots[0]).toMatchObject({ name: "", avatar: "knight", legacy: true });
		expect(profiles.slots[1]).toBeNull();
		expect(profiles.last).toBe(1);
		expect(slotKey(1)).toBe(PLAY_PROGRESS_KEY);
		expect(Object.keys(loadPlayProgress(slotStorage(storage, 1)).progress.levels)).toEqual(firstTwo);
	});

	it("treats a broken list as empty, never throws, and keeps the legacy slot", () => {
		const storage = memoryStorage({ [PROFILES_KEY]: "{not json", [PLAY_PROGRESS_KEY]: JSON.stringify(solved(firstTwo)) });
		const profiles = loadProfiles(storage);
		expect(profiles.slots[0]).not.toBeNull();
		expect(profiles.slots.slice(1)).toEqual([null, null]);
		expect(loadProfiles(memoryStorage({ [PROFILES_KEY]: JSON.stringify({ version: 1, slots: "x", last: 9 }) })).slots).toEqual([null, null, null]);
	});

	it("drops bad entries and falls back on an unknown avatar", () => {
		const raw = { version: 1, slots: [{ name: "Noa", avatar: "dragon", createdAt: "a", playedAt: "b" }, { name: 3 }, null], last: 1 };
		const profiles = loadProfiles(memoryStorage({ [PROFILES_KEY]: JSON.stringify(raw) }));
		expect(profiles.slots[0]).toMatchObject({ name: "Noa", avatar: "knight" });
		expect(profiles.slots[1]).toBeNull();
		expect(profiles.last).toBe(1);
	});
});

describe("slots", () => {
	it("keeps each child's progress under its own key; slots 2 and 3 never touch today's key", () => {
		const storage = memoryStorage({ [PLAY_PROGRESS_KEY]: JSON.stringify(solved(firstTwo)) });
		createSlot(storage, 2, { name: "Zoé", avatar: "mage" }, NOW);
		savePlayProgress(slotStorage(storage, 2), solved([LEVELS[0]!.id]));
		expect(Object.keys(loadPlayProgress(slotStorage(storage, 2)).progress.levels)).toEqual([LEVELS[0]!.id]);
		expect(Object.keys(JSON.parse(storage.data[PLAY_PROGRESS_KEY]!).levels)).toEqual(firstTwo);
		expect(storage.data[`${PLAY_PROGRESS_KEY}:slot-2`]).toBeDefined();
		expect(loadPlayProgress(slotStorage(storage, 3)).progress.levels).toEqual({});
	});

	it("creates a profile, remembers it as last, and records when it was played", () => {
		const storage = memoryStorage();
		const created = createSlot(storage, 1, { name: "  Noa  ", avatar: "rogue" }, NOW);
		expect(created.slots[0]).toEqual({ name: "Noa", avatar: "rogue", createdAt: NOW.toISOString(), playedAt: NOW.toISOString() });
		expect(created.last).toBe(1);
		const later = new Date("2026-11-20T10:00:00.000Z");
		expect(touchSlot(storage, 1, later).slots[0]?.playedAt).toBe(later.toISOString());
		expect(loadProfiles(storage).slots[0]?.playedAt).toBe(later.toISOString());
	});

	it("deleting or replacing a save also forgets the cards bought with it", () => {
		const storage = memoryStorage();
		createSlot(storage, 2, { name: "A", avatar: "knight" }, NOW);
		storage.setItem(shopKeyFor(slotKey(2)), JSON.stringify({ version: 1, cards: ["watapon"] }));
		createSlot(storage, 2, { name: "B", avatar: "mage" }, NOW);
		expect(storage.data[shopKeyFor(slotKey(2))]).toBeUndefined();
		storage.setItem(shopKeyFor(slotKey(2)), JSON.stringify({ version: 1, cards: ["watapon"] }));
		deleteSlot(storage, 2);
		expect(storage.data[shopKeyFor(slotKey(2))]).toBeUndefined();
	});
	it("deleting a save also forgets its dorm", () => {
		const storage = memoryStorage();
		createSlot(storage, 2, { name: "A", avatar: "knight" }, NOW);
		storage.setItem(dormKeyFor(slotKey(2)), JSON.stringify({ version: 1, dorm: "ra" }));
		deleteSlot(storage, 2);
		expect(storage.data[dormKeyFor(slotKey(2))]).toBeUndefined();
	});

	it("creating over an existing slot wipes the old child's progress", () => {
		const storage = memoryStorage();
		createSlot(storage, 2, { name: "A", avatar: "knight" }, NOW);
		savePlayProgress(slotStorage(storage, 2), solved(firstTwo));
		createSlot(storage, 2, { name: "B", avatar: "mage" }, new Date("2026-11-21T00:00:00.000Z"));
		expect(loadPlayProgress(slotStorage(storage, 2)).progress.levels).toEqual({});
		expect(loadProfiles(storage).slots[1]?.name).toBe("B");
	});

	it("deleting slot 1 removes today's key and empties the slot", () => {
		const storage = memoryStorage({ [PLAY_PROGRESS_KEY]: JSON.stringify(solved(firstTwo)) });
		loadProfiles(storage);
		const after = deleteSlot(storage, 1);
		expect(after.slots[0]).toBeNull();
		expect(storage.data[PLAY_PROGRESS_KEY]).toBeUndefined();
		expect(loadProfiles(storage).slots[0]).toBeNull();
	});

	it("finds the first empty slot, or none when all three are taken", () => {
		const storage = memoryStorage();
		expect(firstEmptySlot(loadProfiles(storage))).toBe(1);
		createSlot(storage, 1, { name: "", avatar: "knight" }, NOW);
		createSlot(storage, 3, { name: "", avatar: "knight" }, NOW);
		expect(firstEmptySlot(loadProfiles(storage))).toBe(2);
		createSlot(storage, 2, { name: "", avatar: "knight" }, NOW);
		expect(firstEmptySlot(loadProfiles(storage))).toBeNull();
	});

	it("tells a stale tab that its save was replaced", () => {
		const storage = memoryStorage();
		const first = createSlot(storage, 2, { name: "A", avatar: "knight" }, NOW).slots[1]!.createdAt;
		expect(isSameSave(loadProfiles(storage), 2, first)).toBe(true);
		createSlot(storage, 2, { name: "B", avatar: "knight" }, new Date("2026-11-21T00:00:00.000Z"));
		expect(isSameSave(loadProfiles(storage), 2, first)).toBe(false);
		deleteSlot(storage, 2);
		expect(isSameSave(loadProfiles(storage), 2, first)).toBe(false);
	});
});

describe("a save's own language", () => {
	it("follows the site until one is chosen, keeps it through play, and can follow the site again", () => {
		const storage = memoryStorage();
		createSlot(storage, 1, { name: "Noa", avatar: "star" }, new Date("2026-11-01T10:00:00Z"));
		expect(loadProfiles(storage).slots[0]?.locale).toBeUndefined();
		updateSlot(storage, 1, { locale: "he" });
		touchSlot(storage, 1, new Date("2026-11-02T10:00:00Z"));
		updateSlot(storage, 1, { name: "Noé" });
		expect(loadProfiles(storage).slots[0]).toMatchObject({ name: "Noé", locale: "he" });
		updateSlot(storage, 1, { locale: null });
		expect(loadProfiles(storage).slots[0]?.locale).toBeUndefined();
	});

	it("ignores a language it does not know", () => {
		const at = "2026-11-01T10:00:00.000Z";
		const storage = memoryStorage({ [PROFILES_KEY]: JSON.stringify({ version: 1, slots: [{ name: "A", avatar: "mage", createdAt: at, playedAt: at, locale: "de" }, null, null], last: 1 }) });
		expect(loadProfiles(storage).slots[0]?.locale).toBeUndefined();
	});
});

describe("cleaning a nickname", () => {
	it("keeps Hebrew and French letters", () => {
		expect(cleanName("נועה")).toBe("נועה");
		expect(cleanName("Zoé")).toBe("Zoé");
		expect(cleanName("Zoé")).toBe("Zoé");
	});
	it("removes emoji and symbols, folds spaces, keeps hyphen and apostrophe", () => {
		expect(cleanName("Léo 🐉!!")).toBe("Léo");
		expect(cleanName("  Jean   -Paul\n")).toBe("Jean -Paul");
		expect(cleanName("D'Artagnan")).toBe("D'Artagnan");
		expect(cleanName("Zo😀é")).toBe("Zoé");
	});
	it("cuts at 12 characters as the reader sees them", () => {
		expect(cleanName("abcdefghijklmnop")).toBe("abcdefghijkl");
		expect(Array.from(cleanName("נועהנועהנועהנועה")).length).toBe(12);
	});
});
