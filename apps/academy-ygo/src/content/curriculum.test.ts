import { describe, expect, it } from "vitest";
import { allLessonParams, allLessons, chapters, getAdjacentLesson, getChapter, getLesson } from "@/content/chapters";

const lessons = allLessons();

describe("curriculum registry", () => {
	it("has unique, ordered chapters", () => {
		const ids = chapters.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		const numbers = chapters.map((c) => c.number);
		expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
	});

	it("has unique lesson ids within a chapter and lessons point at their chapter", () => {
		for (const chapter of chapters) {
			const ids = chapter.lessons.map((l) => l.id);
			expect(new Set(ids).size, `duplicate lesson id in ${chapter.id}`).toBe(ids.length);
			for (const lesson of chapter.lessons) expect(lesson.chapterId).toBe(chapter.id);
		}
	});

	it("resolves lessons and params", () => {
		expect(allLessonParams()).toHaveLength(lessons.length);
		for (const { chapter, lesson } of lessons) {
			expect(getChapter(chapter.id)).toBe(chapter);
			expect(getLesson(chapter.id, lesson.id)).toBe(lesson);
		}
		expect(getLesson("nope", "nope")).toBeUndefined();
	});

	it("links adjacent lessons across the curriculum", () => {
		lessons.forEach((ref, i) => {
			const { prev, next } = getAdjacentLesson(ref.chapter.id, ref.lesson.id);
			expect(prev?.lesson.id ?? null).toBe(lessons[i - 1]?.lesson.id ?? null);
			expect(next?.lesson.id ?? null).toBe(lessons[i + 1]?.lesson.id ?? null);
		});
	});
});

describe("lesson structure", () => {
	for (const { chapter, lesson } of lessons) {
		describe(`${chapter.id}/${lesson.id}`, () => {
			it("has a title, description and slides", () => {
				expect(lesson.title.trim()).not.toBe("");
				expect(lesson.description.trim()).not.toBe("");
				expect(lesson.slides.length).toBeGreaterThan(0);
			});

			it("has unique slide ids and consistent templates", () => {
				const ids = lesson.slides.map((s) => s.id);
				expect(new Set(ids).size).toBe(ids.length);
				for (const slide of lesson.slides) {
					expect(slide.visual.template, slide.id).toBe(slide.type);
					expect(slide.title.trim(), slide.id).not.toBe("");
					expect(slide.description.trim(), slide.id).not.toBe("");
					expect(slide.alt.trim(), slide.id).not.toBe("");
				}
			});
		});
	}
});
