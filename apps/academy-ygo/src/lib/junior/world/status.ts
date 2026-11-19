import { LEVELS, WORLD_IDS, levelsOf, type WorldId } from "@/lib/junior/play/levels";
import { isSolved, isUnlocked, nextLevel, type PlayProgress } from "@/lib/junior/play/progress";

/** What an island shows: under mist until its first level opens, then open, then done with all its levels solved. */
export type IslandStatus = "locked" | "open" | "done";
/** What a stop shows. "next" is the one open level not solved yet: the child's next step. */
export type StopStatus = "locked" | "next" | "solved" | "star";

export function islandStatus(progress: PlayProgress, world: WorldId): IslandStatus {
	const levels = levelsOf(world);
	if (levels.every((level) => isSolved(progress, level.id))) return "done";
	return levels.some((level) => isUnlocked(progress, level.id)) ? "open" : "locked";
}

export function stopStatus(progress: PlayProgress, levelId: string): StopStatus {
	const record = progress.levels[levelId];
	if (record) return record.clean ? "star" : "solved";
	return isUnlocked(progress, levelId) ? "next" : "locked";
}

/** The island of the child's next level; the last island once everything is solved. */
export function currentIsland(progress: PlayProgress): WorldId {
	return nextLevel(progress)?.world ?? LEVELS.at(-1)?.world ?? WORLD_IDS[0];
}
