import type { Chapter, Lesson } from "@/lib/lesson-types";
import { firstDuelChapter } from "./first-duel";
import { spellsAndTrapsChapter } from "./spells-and-traps";
import { extraDeckChapter } from "./extra-deck";
import { advancedRulesChapter } from "./advanced-rules";

export const chapters: Chapter[] = [
	firstDuelChapter,
	spellsAndTrapsChapter,
	extraDeckChapter,
	advancedRulesChapter,
].sort((a, b) => a.number - b.number);

export function getChapter(chapterId: string): Chapter | undefined {
	return chapters.find((c) => c.id === chapterId);
}

export function getLesson(chapterId: string, lessonId: string): Lesson | undefined {
	return getChapter(chapterId)?.lessons.find((l) => l.id === lessonId);
}

export interface LessonRef {
	chapter: Chapter;
	lesson: Lesson;
}

/** Lessons flattened in curriculum order. */
export function allLessons(): LessonRef[] {
	return chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })));
}

/** Previous / next lesson across chapter boundaries. */
export function getAdjacentLesson(
	chapterId: string,
	lessonId: string,
): { prev: LessonRef | null; next: LessonRef | null } {
	const flat = allLessons();
	const i = flat.findIndex((r) => r.chapter.id === chapterId && r.lesson.id === lessonId);
	if (i === -1) return { prev: null, next: null };
	return { prev: flat[i - 1] ?? null, next: flat[i + 1] ?? null };
}

export function allLessonParams(): { chapter: string; lesson: string }[] {
	return allLessons().map(({ chapter, lesson }) => ({ chapter: chapter.id, lesson: lesson.id }));
}

export function lessonHref(chapterId: string, lessonId: string): string {
	return `/academy/${chapterId}/${lessonId}`;
}
