/**
 * Local viewing progress. Keys are chapter / lesson ids from the curriculum.
 * Safe to call on the server: every function no-ops when `window` is missing.
 */

const STORAGE_KEY = "academy-ygo:progress:v1";

export interface LessonProgress {
	lessonId: string;
	chapterId: string;
	/** Last slide index the student opened (0-based). */
	slideIndex: number;
	/** True once the student reached the final slide. */
	completed: boolean;
	updatedAt: number;
}

export interface ProgressStore {
	lessons: Record<string, LessonProgress>;
	/** Most recently opened lesson path: chapterId / lessonId. */
	lastViewed?: { chapterId: string; lessonId: string; slideIndex: number };
}

function emptyStore(): ProgressStore {
	return { lessons: {} };
}

function read(): ProgressStore {
	if (typeof window === "undefined") return emptyStore();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyStore();
		const parsed = JSON.parse(raw) as ProgressStore;
		if (!parsed || typeof parsed !== "object" || !parsed.lessons) return emptyStore();
		return parsed;
	} catch {
		return emptyStore();
	}
}

function write(store: ProgressStore): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	} catch {
		/* quota / private mode — ignore */
	}
}

export function getProgress(): ProgressStore {
	return read();
}

export function getLessonProgress(lessonId: string): LessonProgress | undefined {
	return read().lessons[lessonId];
}

export function saveLessonProgress(input: {
	lessonId: string;
	chapterId: string;
	slideIndex: number;
	totalSlides: number;
}): LessonProgress {
	const store = read();
	const previous = store.lessons[input.lessonId];
	const completed =
		Boolean(previous?.completed) || input.slideIndex >= Math.max(0, input.totalSlides - 1);
	const next: LessonProgress = {
		lessonId: input.lessonId,
		chapterId: input.chapterId,
		slideIndex: Math.max(0, Math.min(input.slideIndex, Math.max(0, input.totalSlides - 1))),
		completed,
		updatedAt: Date.now(),
	};
	store.lessons[input.lessonId] = next;
	store.lastViewed = {
		chapterId: input.chapterId,
		lessonId: input.lessonId,
		slideIndex: next.slideIndex,
	};
	write(store);
	return next;
}

export function chapterProgress(
	chapterId: string,
	lessonIds: string[],
): { completed: number; total: number; percent: number } {
	const store = read();
	const completed = lessonIds.filter((id) => store.lessons[id]?.completed).length;
	const total = lessonIds.length;
	return {
		completed,
		total,
		percent: total === 0 ? 0 : Math.round((completed / total) * 100),
	};
}

export function clearProgress(): void {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(STORAGE_KEY);
}
