import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { PLAY_PROGRESS_KEY, album, emptyPlayProgress, isUnlocked, loadPlayProgress, mergePlayProgress, nextLevel, recordSolve, ruleMastery, savePlayProgress, type PlayProgress, type PlayStorage } from "./progress";
import type { Outcome } from "./session";

const clean: Outcome = { tries: 1, firstTry: true, clean: true, hints: 0, slips: [] };
const hinted: Outcome = { tries: 2, firstTry: false, clean: false, hints: 1, slips: ["monster-in-the-way"] };
const solve = (progress: PlayProgress, ids: string[], result = clean) => ids.reduce((current, id) => recordSolve(current, id, result), progress);
function memory(initial?: string): PlayStorage & { value: string | null } {
	return {
		value: initial ?? null,
		getItem() {
			return this.value;
		},
		setItem(_key: string, value: string) {
			this.value = value;
		},
	};
}

describe("recording a solved level", () => {
	it("keeps the best result and counts the rules that were broken", () => {
		const first = recordSolve(emptyPlayProgress(), "w2-lantern", hinted);
		expect(first.levels["w2-lantern"]).toEqual({ clean: false, firstTry: false });
		expect(first.slips).toEqual({ "monster-in-the-way": 1 });
		const better = recordSolve(first, "w2-lantern", clean);
		expect(better.levels["w2-lantern"]).toEqual({ clean: true, firstTry: true });
		expect(recordSolve(better, "w2-lantern", hinted).levels["w2-lantern"]).toEqual({ clean: true, firstTry: true });
	});
	it("ignores a level it does not know", () => {
		const progress = emptyPlayProgress();
		expect(recordSolve(progress, "nope", clean)).toBe(progress);
	});
});

describe("what opens and what counts as mastered", () => {
	it("opens levels one after the other", () => {
		const fresh = emptyPlayProgress();
		expect(isUnlocked(fresh, "w1-field")).toBe(true);
		expect(isUnlocked(fresh, "w1-field-2")).toBe(false);
		expect(nextLevel(fresh)?.id).toBe("w1-field");
		const one = solve(fresh, ["w1-field"]);
		expect(isUnlocked(one, "w1-field-2")).toBe(true);
		expect(nextLevel(one)?.id).toBe("w1-field-2");
		expect(nextLevel(solve(fresh, LEVELS.map((level) => level.id)))).toBeUndefined();
	});
	it("masters a rule only when a later level used it again without a hint", () => {
		const fresh = emptyPlayProgress();
		expect(ruleMastery(fresh, "battle")).toBe("new");
		const taught = solve(fresh, ["w1-clash"]);
		expect(ruleMastery(taught, "battle")).toBe("met");
		expect(ruleMastery(solve(taught, ["w1-clash-2"], hinted), "battle")).toBe("met");
		expect(ruleMastery(solve(taught, ["w1-clash-2"]), "battle")).toBe("mastered");
	});
	it("collects the cards of solved levels into the album", () => {
		expect(album(emptyPlayProgress())).toEqual([]);
		expect(album(solve(emptyPlayProgress(), ["w1-field"]))).toEqual(["pocket-cub", "glow-charm", "sticky-vine"]);
	});
});

describe("saving in the browser", () => {
	it("round-trips, and merges with what another tab saved", () => {
		const storage = memory();
		expect(loadPlayProgress(storage)).toEqual({ progress: emptyPlayProgress(), writable: true });
		savePlayProgress(storage, solve(emptyPlayProgress(), ["w1-field"], hinted));
		const merged = savePlayProgress(storage, { ...solve(emptyPlayProgress(), ["w1-field-2"]), calm: true });
		expect(Object.keys(merged?.levels ?? {})).toEqual(["w1-field", "w1-field-2"]);
		expect(merged?.slips).toEqual({ "monster-in-the-way": 1 });
		expect(loadPlayProgress(storage).progress).toEqual(merged);
		expect(merged?.calm).toBe(true);
	});
	it("never goes back when merging", () => {
		const done = solve(emptyPlayProgress(), ["w1-field"]);
		expect(mergePlayProgress(done, solve(emptyPlayProgress(), ["w1-field"], hinted)).levels["w1-field"]).toEqual({ clean: true, firstTry: true });
	});
	it.each([
		["damaged text", "{oops"],
		["a newer version", JSON.stringify({ ...emptyPlayProgress(), version: 2 })],
		["an unknown level", JSON.stringify({ ...emptyPlayProgress(), levels: { "w99-x": { clean: true, firstTry: true } } })],
		["a wrong type", JSON.stringify({ ...emptyPlayProgress(), calm: "yes" })],
	])("does not trust or overwrite %s", (_name, raw) => {
		const storage = memory(raw);
		expect(loadPlayProgress(storage)).toEqual({ progress: emptyPlayProgress(), writable: false });
		expect(savePlayProgress(storage, solve(emptyPlayProgress(), ["w1-field"]))).toBeNull();
		expect(storage.value).toBe(raw);
	});
	it("works in memory when storage is missing or throws", () => {
		expect(loadPlayProgress(undefined).writable).toBe(false);
		const broken: PlayStorage = {
			getItem() {
				throw new Error("blocked");
			},
			setItem() {
				throw new Error("blocked");
			},
		};
		expect(loadPlayProgress(broken)).toEqual({ progress: emptyPlayProgress(), writable: false });
		expect(savePlayProgress(broken, emptyPlayProgress())).toBeNull();
	});
	it("uses its own key", () => {
		expect(PLAY_PROGRESS_KEY).toBe("academy-ygo:junior:play:v1");
	});
});
