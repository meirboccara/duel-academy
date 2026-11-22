import { describe, expect, it } from "vitest";
import { CARD_IDS } from "@duel-academy/cards";
import { LEVELS, levelById, levelsOf } from "../play/levels";
import { masterLevelId } from "../play/masters";
import { emptyPlayProgress, isUnlocked } from "../play/progress";
import { botTurn, forceWin, next, playOut, start } from "../play/session";
import { DEV_DEFAULTS, devDuelLevel, devToolsOn, loadDev, parseDev, saveDev, solvedBefore, solvedThrough } from "./dev-tools";

const memory = () => {
	const data = new Map<string, string>();
	return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
};

describe("the developer tools", () => {
	it("exist only when the app runs with next dev", () => {
		expect(devToolsOn("development")).toBe(true);
		expect(devToolsOn("production")).toBe(false);
		expect(devToolsOn("test")).toBe(false);
	});
	it("mark every level before one as solved, so that level opens", () => {
		const id = masterLevelId("seto-kaiba");
		const progress = solvedBefore(emptyPlayProgress(), id);
		expect(isUnlocked(progress, id)).toBe(true);
		expect(id in progress.levels).toBe(false);
		expect(Object.keys(progress.levels)).toHaveLength(LEVELS.findIndex((level) => level.id === id));
	});
	it("mark a whole island solved, and everything before it", () => {
		const progress = solvedThrough(emptyPlayProgress(), "icons");
		for (const level of levelsOf("icons")) expect(level.id in progress.levels).toBe(true);
		expect(levelsOf("ritual")[0]!.id in progress.levels).toBe(false);
	});
	it("keep their settings in the browser, forgiving a broken record", () => {
		const storage = memory();
		expect(loadDev(storage)).toEqual(DEV_DEFAULTS);
		saveDev(storage, { ...DEV_DEFAULTS, allCards: true, first: "rival", tier: "expert" });
		expect(loadDev(storage)).toEqual({ allCards: true, first: "rival", tier: "expert" });
		expect(parseDev({ first: "nobody", tier: "godlike", allCards: "yes" })).toEqual(DEV_DEFAULTS);
	});
	it("deal a duel with the chosen first player and trainer level", () => {
		const base = levelById(masterLevelId("rex-raptor"))!;
		const level = devDuelLevel(base, { allCards: false, first: "you", tier: "expert" });
		expect(level.setup.turn).toBe("you");
		expect(level.duel?.persona?.plans).toBe(2);
		expect(devDuelLevel(base, DEV_DEFAULTS)).toBe(base);
	});
	it("give every card in the game when asked", () => {
		expect(CARD_IDS.length).toBeGreaterThan(200);
	});
});

describe("the developer shortcuts in a level", () => {
	it("play a level's recorded solution to the end, the rival's turns included", () => {
		const level = levelById("w4-counter")!;
		expect(playOut(start(level), level.solution).status).toBe("solved");
	});
	it("win at once, to see what a win gives", () => {
		const won = forceWin(next(start(levelById("w7-duel")!)));
		expect(won.status).toBe("solved");
		expect(won.board.winner).toBe("you");
	});
	it("leave a try that is already over as it ended", () => {
		const failed = { ...start(levelById("w7-duel")!), status: "failed" as const };
		expect(forceWin(failed)).toBe(failed);
	});
	it("let the bot play the child's turn, until the turn passes", () => {
		const level = levelById("w7-duel")!;
		const first = start(level);
		const after = botTurn(first);
		expect(after.board.turnNumber).toBeGreaterThan(first.board.turnNumber);
		expect(after.stats).toEqual(first.stats);
	});
});
