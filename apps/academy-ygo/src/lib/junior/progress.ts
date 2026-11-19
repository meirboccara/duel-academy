import { QUIZ_QUESTIONS, SORT_CARDS } from "./mission1";

/** Separate from the adult academy progress and from the language key. */
export const JUNIOR_PROGRESS_KEY = "academy-ygo:junior:mission1:v1";
const VERSION = 1;

export type AnswerKind = "sort" | "quiz";
export interface JuniorProgress {
	version: 1;
	/** Ids answered correctly at least once. Only ever grows. */
	sort: { correct: string[] };
	quiz: { correct: string[] };
	calm: boolean;
}
export type JuniorStorage = Pick<Storage, "getItem" | "setItem">;
export interface StoredProgress {
	progress: JuniorProgress;
	/** False when a record exists that this version cannot fully understand: it must not be overwritten. */
	writable: boolean;
}

const KNOWN_IDS: Record<AnswerKind, ReadonlySet<string>> = {
	sort: new Set(SORT_CARDS.map((card) => card.id)),
	quiz: new Set(QUIZ_QUESTIONS.map((question) => question.id)),
};

export function emptyProgress(): JuniorProgress {
	return { version: VERSION, sort: { correct: [] }, quiz: { correct: [] }, calm: false };
}

/** Records a correct answer. A wrong answer, a repeat or an unknown id returns the same object. */
export function recordAnswer(progress: JuniorProgress, kind: AnswerKind, id: string, correct: boolean): JuniorProgress {
	if (!correct || !KNOWN_IDS[kind].has(id) || progress[kind].correct.includes(id)) return progress;
	return { ...progress, [kind]: { correct: [...progress[kind].correct, id] } };
}

export function isMastered(progress: JuniorProgress): boolean {
	return (
		SORT_CARDS.every((card) => progress.sort.correct.includes(card.id)) &&
		QUIZ_QUESTIONS.every((question) => progress.quiz.correct.includes(question.id))
	);
}

/** Combines two records: correct answers only grow, and calm takes `change`'s value. */
export function mergeProgress(base: JuniorProgress, change: JuniorProgress): JuniorProgress {
	const union = (x: string[], y: string[]) => [...new Set([...x, ...y])];
	return {
		version: VERSION,
		sort: { correct: union(base.sort.correct, change.sort.correct) },
		quiz: { correct: union(base.quiz.correct, change.quiz.correct) },
		calm: change.calm,
	};
}

function correctIds(kind: AnswerKind, value: unknown): string[] | null {
	if (typeof value !== "object" || value === null) return null;
	const list = (value as Record<string, unknown>).correct;
	if (!Array.isArray(list) || !list.every((id) => typeof id === "string" && KNOWN_IDS[kind].has(id))) return null;
	return [...new Set(list as string[])];
}
/** Strict parse of one saved record (an old `answered` field is ignored). Null means it must not be trusted or overwritten. */
function parseProgress(raw: unknown): JuniorProgress | null {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
	const data = raw as Record<string, unknown>;
	const sort = correctIds("sort", data.sort);
	const quiz = correctIds("quiz", data.quiz);
	if (data.version !== VERSION || !sort || !quiz || typeof data.calm !== "boolean") return null;
	return { version: VERSION, sort: { correct: sort }, quiz: { correct: quiz }, calm: data.calm };
}

export function loadProgress(storage: JuniorStorage | undefined): StoredProgress {
	if (!storage) return { progress: emptyProgress(), writable: false };
	try {
		const raw = storage.getItem(JUNIOR_PROGRESS_KEY);
		if (raw === null || raw === undefined) return { progress: emptyProgress(), writable: true };
		const parsed = parseProgress(JSON.parse(raw));
		return parsed ? { progress: parsed, writable: true } : { progress: emptyProgress(), writable: false };
	} catch {
		return { progress: emptyProgress(), writable: false };
	}
}

/**
 * Saves a change made by the child. It re-reads the latest stored record first so another tab's answers are kept.
 * Returns the merged progress, or null when nothing was written (storage missing or throwing, or an unknown record in place).
 */
export function saveProgress(storage: JuniorStorage | undefined, change: JuniorProgress): JuniorProgress | null {
	const latest = loadProgress(storage);
	if (!storage || !latest.writable) return null;
	const merged = mergeProgress(latest.progress, change);
	try {
		storage.setItem(JUNIOR_PROGRESS_KEY, JSON.stringify(merged));
		return merged;
	} catch {
		return null;
	}
}
