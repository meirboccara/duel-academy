import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	chapterProgress,
	clearProgress,
	getLessonProgress,
	getProgress,
	saveLessonProgress,
} from "@/lib/progress";

class MemoryStorage {
	private data = new Map<string, string>();
	getItem(key: string) {
		return this.data.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.data.set(key, value);
	}
	removeItem(key: string) {
		this.data.delete(key);
	}
}

describe("progress", () => {
	beforeEach(() => {
		(globalThis as unknown as { window: unknown }).window = { localStorage: new MemoryStorage() };
	});
	afterEach(() => {
		delete (globalThis as unknown as { window?: unknown }).window;
	});

	it("is empty by default", () => {
		expect(getProgress()).toEqual({ lessons: {} });
		expect(getLessonProgress("nope")).toBeUndefined();
	});

	it("saves and restores the slide index and last viewed lesson", () => {
		saveLessonProgress({ lessonId: "l1", chapterId: "c1", slideIndex: 2, totalSlides: 5 });
		const restored = getLessonProgress("l1");
		expect(restored?.slideIndex).toBe(2);
		expect(restored?.completed).toBe(false);
		expect(getProgress().lastViewed).toEqual({ chapterId: "c1", lessonId: "l1", slideIndex: 2 });
	});

	it("marks a lesson complete on the last slide and keeps it complete", () => {
		saveLessonProgress({ lessonId: "l1", chapterId: "c1", slideIndex: 4, totalSlides: 5 });
		expect(getLessonProgress("l1")?.completed).toBe(true);
		saveLessonProgress({ lessonId: "l1", chapterId: "c1", slideIndex: 0, totalSlides: 5 });
		expect(getLessonProgress("l1")?.completed).toBe(true);
	});

	it("clamps the slide index into range", () => {
		saveLessonProgress({ lessonId: "l1", chapterId: "c1", slideIndex: 99, totalSlides: 3 });
		expect(getLessonProgress("l1")?.slideIndex).toBe(2);
		saveLessonProgress({ lessonId: "l2", chapterId: "c1", slideIndex: -4, totalSlides: 3 });
		expect(getLessonProgress("l2")?.slideIndex).toBe(0);
	});

	it("computes chapter progress", () => {
		saveLessonProgress({ lessonId: "a", chapterId: "c", slideIndex: 1, totalSlides: 2 });
		saveLessonProgress({ lessonId: "b", chapterId: "c", slideIndex: 0, totalSlides: 2 });
		expect(chapterProgress("c", ["a", "b"])).toEqual({ completed: 1, total: 2, percent: 50 });
		expect(chapterProgress("c", [])).toEqual({ completed: 0, total: 0, percent: 0 });
	});

	it("clears progress", () => {
		saveLessonProgress({ lessonId: "a", chapterId: "c", slideIndex: 1, totalSlides: 2 });
		clearProgress();
		expect(getProgress()).toEqual({ lessons: {} });
	});

	it("survives corrupt storage", () => {
		(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
			"academy-ygo:progress:v1",
			"{not json",
		);
		expect(getProgress()).toEqual({ lessons: {} });
	});
});

describe("progress on the server", () => {
	it("no-ops without window", () => {
		expect(getProgress()).toEqual({ lessons: {} });
		expect(() => clearProgress()).not.toThrow();
		expect(saveLessonProgress({ lessonId: "x", chapterId: "c", slideIndex: 0, totalSlides: 1 }).lessonId).toBe("x");
	});
});
