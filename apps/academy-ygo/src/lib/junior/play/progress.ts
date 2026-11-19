import { CARD_IDS, type CardId } from "./cards";
import { LEVELS, type Level, type RuleId } from "./levels";
import type { Outcome } from "./session";

/**
 * What the Junior course remembers, in this browser only. Nothing is asked of the child:
 * the record is read off the moves (solved, without a hint, on the first try, which rules were broken).
 * Separate from the adult academy progress and from the pilot's quiz record.
 */
export const PLAY_PROGRESS_KEY = "academy-ygo:junior:play:v1";
const VERSION = 1;

export interface LevelRecord {
	/** Solved at least once without a hint. */
	clean: boolean;
	/** Solved at least once with no failed try, refused move, step back or hint. */
	firstTry: boolean;
}
export interface PlayProgress {
	version: 1;
	/** Solved levels only. A record only ever gets better. */
	levels: Record<string, LevelRecord>;
	/** How often each rule was broken by a refused move. */
	slips: Record<string, number>;
	calm: boolean;
	sound: boolean;
}
export type PlayStorage = Pick<Storage, "getItem" | "setItem">;

const LEVEL_IDS = new Set(LEVELS.map((level) => level.id));

export function emptyPlayProgress(): PlayProgress {
	return { version: VERSION, levels: {}, slips: {}, calm: false, sound: false };
}

/** Adds a solved level and the rules broken on the way. An unknown level changes nothing. */
export function recordSolve(progress: PlayProgress, levelId: string, result: Outcome): PlayProgress {
	if (!LEVEL_IDS.has(levelId)) return progress;
	const before = progress.levels[levelId];
	const slips = { ...progress.slips };
	for (const slip of result.slips) slips[slip] = (slips[slip] ?? 0) + 1;
	return { ...progress, levels: { ...progress.levels, [levelId]: { clean: result.clean || !!before?.clean, firstTry: result.firstTry || !!before?.firstTry } }, slips };
}

/** Combines two records: solved levels and counts never go back; calm and sound take `change`'s value. */
export function mergePlayProgress(base: PlayProgress, change: PlayProgress): PlayProgress {
	const levels: Record<string, LevelRecord> = { ...base.levels };
	for (const [id, record] of Object.entries(change.levels)) levels[id] = { clean: record.clean || !!levels[id]?.clean, firstTry: record.firstTry || !!levels[id]?.firstTry };
	const slips: Record<string, number> = { ...base.slips };
	for (const [reason, count] of Object.entries(change.slips)) slips[reason] = Math.max(count, slips[reason] ?? 0);
	return { version: VERSION, levels, slips, calm: change.calm, sound: change.sound };
}

/** Strict parse of one saved record. Null means it must not be trusted or overwritten. */
function parse(raw: unknown): PlayProgress | null {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
	const data = raw as Record<string, unknown>;
	if (data.version !== VERSION || typeof data.calm !== "boolean" || typeof data.sound !== "boolean") return null;
	if (typeof data.levels !== "object" || data.levels === null || Array.isArray(data.levels)) return null;
	if (typeof data.slips !== "object" || data.slips === null || Array.isArray(data.slips)) return null;
	const levels: Record<string, LevelRecord> = {};
	for (const [id, value] of Object.entries(data.levels)) {
		if (!LEVEL_IDS.has(id) || typeof value !== "object" || value === null) return null;
		const { clean, firstTry } = value as Record<string, unknown>;
		if (typeof clean !== "boolean" || typeof firstTry !== "boolean") return null;
		levels[id] = { clean, firstTry };
	}
	const slips: Record<string, number> = {};
	for (const [reason, count] of Object.entries(data.slips)) {
		if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return null;
		slips[reason] = count;
	}
	return { version: VERSION, levels, slips, calm: data.calm, sound: data.sound };
}

export interface StoredPlayProgress {
	progress: PlayProgress;
	/** False when a record exists that this version cannot fully understand: it must not be overwritten. */
	writable: boolean;
}
export function loadPlayProgress(storage: PlayStorage | undefined): StoredPlayProgress {
	if (!storage) return { progress: emptyPlayProgress(), writable: false };
	try {
		const raw = storage.getItem(PLAY_PROGRESS_KEY);
		if (raw === null || raw === undefined) return { progress: emptyPlayProgress(), writable: true };
		const parsed = parse(JSON.parse(raw));
		return parsed ? { progress: parsed, writable: true } : { progress: emptyPlayProgress(), writable: false };
	} catch {
		return { progress: emptyPlayProgress(), writable: false };
	}
}
/** Saves a change merged with the latest stored record, so another tab's progress is kept. Null when nothing was written. */
export function savePlayProgress(storage: PlayStorage | undefined, change: PlayProgress): PlayProgress | null {
	const latest = loadPlayProgress(storage);
	if (!storage || !latest.writable) return null;
	const merged = mergePlayProgress(latest.progress, change);
	try {
		storage.setItem(PLAY_PROGRESS_KEY, JSON.stringify(merged));
		return merged;
	} catch {
		return null;
	}
}

export const isSolved = (progress: PlayProgress, levelId: string) => levelId in progress.levels;
/** Levels open in order: the first one, then each level once the one before it is solved. */
export function isUnlocked(progress: PlayProgress, levelId: string): boolean {
	const index = LEVELS.findIndex((level) => level.id === levelId);
	const before = LEVELS[index - 1];
	return index === 0 || (!!before && isSolved(progress, before.id));
}
export function nextLevel(progress: PlayProgress): Level | undefined {
	return LEVELS.find((level) => !isSolved(progress, level.id));
}

export type Mastery = "new" | "met" | "mastered";
/**
 * A rule is met once its teaching level is solved, and mastered once a later level that needs it
 * was solved without a hint: the rule was used again, unprompted.
 */
export function ruleMastery(progress: PlayProgress, rule: RuleId): Mastery {
	const taught = LEVELS.findIndex((level) => level.teaches === rule);
	const teacher = LEVELS[taught];
	if (!teacher || !isSolved(progress, teacher.id)) return "new";
	const reused = LEVELS.slice(taught + 1).some((level) => level.uses.includes(rule) && progress.levels[level.id]?.clean);
	return reused ? "mastered" : "met";
}

/** The cards the child has played with: every card of the child's side in a solved level. */
export function album(progress: PlayProgress): CardId[] {
	const seen = new Set<CardId>();
	for (const level of LEVELS) {
		if (!isSolved(progress, level.id)) continue;
		const mine = level.setup.you ?? {};
		for (const card of [...(mine.hand ?? []), ...(mine.deck ?? []), ...(mine.backrow ?? [])]) if (card) seen.add(card);
		for (const item of mine.monsters ?? []) if (item) seen.add(typeof item === "string" ? item : item.card);
	}
	return CARD_IDS.filter((card) => seen.has(card));
}
