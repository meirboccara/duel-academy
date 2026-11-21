import { LEVELS, levelsOf, type Level, type WorldId } from "../play/levels";
import { PERSONAS, TIERS, MASTERS, MASTER_TIER, type Tier } from "../play/masters";
import type { PlayProgress } from "../play/progress";

/**
 * Developer tools for testing Junior on one's own machine: open any level, mark islands solved, own every card,
 * set up a trainer duel. They exist only under `next dev` (NODE_ENV "development"); a production build never shows them.
 */
export const devToolsOn = (env: string | undefined = process.env.NODE_ENV): boolean => env === "development";

/** The developer settings, kept in this browser only. */
export interface DevSettings {
	/** Every playable card is in the binder, for the Deck editor. */
	allCards: boolean;
	/** Who starts a trainer duel: chosen, or the coin toss (null). */
	first: "you" | "rival" | null;
	/** Every trainer plays at this level, or at its own (null). */
	tier: Tier | null;
}
export const DEV_DEFAULTS: DevSettings = { allCards: false, first: null, tier: null };
export const DEV_KEY = "academy-ygo:junior:dev";

export function parseDev(raw: unknown): DevSettings {
	const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
	return {
		allCards: data.allCards === true,
		first: data.first === "you" || data.first === "rival" ? data.first : null,
		tier: TIERS.find((tier) => tier === data.tier) ?? null,
	};
}
export function loadDev(storage: Pick<Storage, "getItem"> | undefined | null): DevSettings {
	try {
		const raw = storage?.getItem(DEV_KEY);
		return raw ? parseDev(JSON.parse(raw)) : { ...DEV_DEFAULTS };
	} catch {
		return { ...DEV_DEFAULTS };
	}
}
export function saveDev(storage: Pick<Storage, "setItem"> | undefined | null, settings: DevSettings): void {
	try {
		storage?.setItem(DEV_KEY, JSON.stringify(settings));
	} catch {
		/* A browser that keeps nothing: the settings last for this visit. */
	}
}

const solved = (progress: PlayProgress, ids: readonly string[]): PlayProgress => ({ ...progress, levels: { ...progress.levels, ...Object.fromEntries(ids.filter((id) => !(id in progress.levels)).map((id) => [id, { clean: true, firstTry: true }])) } });
/** Every level before this one solved: this one opens, and the islands before it are finished. */
export function solvedBefore(progress: PlayProgress, levelId: string): PlayProgress {
	const at = LEVELS.findIndex((level) => level.id === levelId);
	return solved(progress, LEVELS.slice(0, Math.max(0, at)).map((level) => level.id));
}
/** Every level up to the end of this island solved. */
export function solvedThrough(progress: PlayProgress, world: WorldId): PlayProgress {
	const last = levelsOf(world).at(-1);
	if (!last) return progress;
	return solved(progress, LEVELS.slice(0, LEVELS.indexOf(last) + 1).map((level) => level.id));
}

/** A trainer duel as the developer settings want it: who starts, and the trainer's level. The same level when nothing is set. */
export function devDuelLevel(level: Level, settings: DevSettings): Level {
	if (!level.duel || (!settings.first && !settings.tier)) return level;
	const persona = settings.tier ? { ...PERSONAS[level.duel.master], ...PERSONAS[MASTERS.find((master) => MASTER_TIER[master] === settings.tier) ?? level.duel.master], aggression: PERSONAS[level.duel.master].aggression } : undefined;
	return { ...level, setup: { ...level.setup, ...(settings.first ? { turn: settings.first } : {}) }, duel: { ...level.duel, ...(persona ? { persona } : {}) } };
}
