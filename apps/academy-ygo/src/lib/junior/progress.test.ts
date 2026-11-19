import { describe, expect, it } from "vitest";
import { QUIZ_QUESTIONS, SORT_CARDS } from "./mission1";
import { JUNIOR_PROGRESS_KEY, emptyProgress, isMastered, loadProgress, mergeProgress, recordAnswer, saveProgress } from "./progress";

function masteredProgress() {
	let progress = emptyProgress();
	for (const card of SORT_CARDS) progress = recordAnswer(progress, "sort", card.id, true);
	for (const question of QUIZ_QUESTIONS) progress = recordAnswer(progress, "quiz", question.id, true);
	return progress;
}
function fakeStorage(initial: Record<string, string> = {}) {
	const data = { ...initial };
	return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) };
}
const record = (extra: Record<string, unknown>) =>
	JSON.stringify({ version: 1, sort: { correct: [] }, quiz: { correct: [] }, calm: false, ...extra });

describe("junior progress", () => {
	it("starts empty and not mastered", () => {
		expect(isMastered(emptyProgress())).toBe(false);
	});

	it("is mastered only once every sort card and quiz question was answered correctly", () => {
		expect(isMastered(masteredProgress())).toBe(true);
		let almost = emptyProgress();
		for (const card of SORT_CARDS) almost = recordAnswer(almost, "sort", card.id, true);
		expect(isMastered(almost)).toBe(false);
	});

	it("keeps a wrong answer from undoing a correct one, and a wrong answer changes nothing", () => {
		const mastered = masteredProgress();
		expect(recordAnswer(mastered, "quiz", "atk", false)).toBe(mastered);
		expect(isMastered(recordAnswer(mastered, "quiz", "atk", false))).toBe(true);
	});

	it("ignores answers for unknown ids and does not mutate its input", () => {
		const start = emptyProgress();
		expect(recordAnswer(start, "sort", "ghost", true)).toEqual(start);
		recordAnswer(start, "sort", "pocket-cub", true);
		expect(start.sort.correct).toEqual([]);
	});

	it("saves and reloads progress and the calm choice", () => {
		const storage = fakeStorage();
		saveProgress(storage, { ...masteredProgress(), calm: true });
		const loaded = loadProgress(storage).progress;
		expect(isMastered(loaded)).toBe(true);
		expect(loaded.calm).toBe(true);
	});

	it("reads old v1 records that still carry an answered list", () => {
		const raw = record({ sort: { answered: ["pocket-cub", "fog-snare"], correct: ["pocket-cub"] } });
		const loaded = loadProgress(fakeStorage({ [JUNIOR_PROGRESS_KEY]: raw }));
		expect(loaded.progress.sort.correct).toEqual(["pocket-cub"]);
		expect(loaded.writable).toBe(true);
	});

	it("treats unreadable, wrong-shape, wrong-version or hostile data as empty and not writable", () => {
		const bad = ["not json", "null", "[]", record({ version: 2 }), record({ sort: "x" }), record({ quiz: { correct: "atk" } }), record({ sort: { correct: ["pocket-cub", "ghost", 7] } })];
		for (const raw of bad) {
			const loaded = loadProgress(fakeStorage({ [JUNIOR_PROGRESS_KEY]: raw }));
			expect(loaded.writable, raw).toBe(false);
			expect(loaded.progress.sort.correct.filter((id) => id === "ghost")).toEqual([]);
		}
		expect(loadProgress(fakeStorage({ [JUNIOR_PROGRESS_KEY]: "not json" })).progress).toEqual(emptyProgress());
	});

	it("never overwrites a record it could not understand", () => {
		const raw = record({ version: 2, future: true });
		const storage = fakeStorage({ [JUNIOR_PROGRESS_KEY]: raw });
		expect(saveProgress(storage, masteredProgress())).toBeNull();
		expect(storage.data[JUNIOR_PROGRESS_KEY]).toBe(raw);
	});

	it("merges with what another tab saved: correct answers only grow, calm takes the new value", () => {
		const other = { ...recordAnswer(emptyProgress(), "sort", "spark-dash", true), calm: true };
		const storage = fakeStorage();
		saveProgress(storage, other);
		const mine = recordAnswer(emptyProgress(), "sort", "pocket-cub", true);
		const merged = saveProgress(storage, mine);
		expect([...(merged?.sort.correct ?? [])].sort()).toEqual(["pocket-cub", "spark-dash"]);
		expect(merged?.calm).toBe(false);
		expect(loadProgress(storage).progress).toEqual(merged);
	});

	it("merges two progress records monotonically", () => {
		const a = recordAnswer(emptyProgress(), "sort", "spark-dash", true);
		const b = { ...recordAnswer(emptyProgress(), "quiz", "atk", true), calm: true };
		const merged = mergeProgress(a, b);
		expect(merged.sort.correct).toEqual(["spark-dash"]);
		expect(merged.quiz.correct).toEqual(["atk"]);
		expect(merged.calm).toBe(true);
	});

	it("works with missing storage and with storage that throws", () => {
		const broken = {
			getItem: () => { throw new Error("blocked"); },
			setItem: () => { throw new Error("blocked"); },
		};
		expect(loadProgress(undefined).progress).toEqual(emptyProgress());
		expect(loadProgress(broken).progress).toEqual(emptyProgress());
		expect(() => saveProgress(undefined, emptyProgress())).not.toThrow();
		expect(() => saveProgress(broken, emptyProgress())).not.toThrow();
	});

	it("never touches the adult academy keys", () => {
		expect(JUNIOR_PROGRESS_KEY).not.toBe("duel-academy-language");
		expect(JUNIOR_PROGRESS_KEY).toMatch(/junior/);
	});
});
