import { describe, expect, it } from "vitest";
import { cardArtUrl } from "../play/card-art";
import { LEVELS, WORLD_IDS, levelsOf } from "../play/levels";
import { emptyPlayProgress, recordSolve, type PlayProgress } from "../play/progress";
import { DORMS, DORM_INFO, DORM_ISLAND, dormKeyFor, dormToChoose, loadDorm, saveDorm } from "./dorm";
import { binder, dormLines, islandCardUrls, islandTrainer, islandTrainerPictures, rewardCards } from "./trainers";

function memory(initial: Record<string, string> = {}) {
	const data = { ...initial };
	return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => void (data[key] = value) };
}
const KEY = dormKeyFor("academy-ygo:junior:play:v1");
const win = { tries: 1, firstTry: true, clean: true, hints: 0, slips: [] };
/** Every level up to and including the last one of `world`. */
const solvedThrough = (world: (typeof WORLD_IDS)[number]): PlayProgress => {
	const last = LEVELS.indexOf(levelsOf(world).at(-1)!);
	return LEVELS.slice(0, last + 1).reduce((p, level) => recordSolve(p, level.id, win), emptyPlayProgress());
};

describe("the dorms of Duel Academy", () => {
	it("are Slifer Red, Ra Yellow and Obelisk Blue, each with its Egyptian God card and a leader", () => {
		expect(DORMS).toEqual(["slifer", "ra", "obelisk"]);
		expect(DORM_INFO.slifer).toMatchObject({ card: "slifer-the-sky-dragon", leader: "jaden-yuki" });
		expect(DORM_INFO.ra).toMatchObject({ card: "the-winged-dragon-of-ra", leader: "bastion-misawa" });
		expect(DORM_INFO.obelisk).toMatchObject({ card: "obelisk-the-tormentor", leader: "alexis-rhodes" });
		for (const dorm of DORMS) expect(cardArtUrl(DORM_INFO[dorm].card), dorm).not.toBeNull();
	});

	it("are chosen once the first island is finished, and only once", () => {
		expect(dormToChoose(emptyPlayProgress(), null)).toBe(false);
		expect(dormToChoose(solvedThrough("wake"), null)).toBe(true);
		expect(dormToChoose(solvedThrough("wake"), "ra")).toBe(false);
	});

	it("are remembered per save, and a broken or unknown choice reads as none", () => {
		const storage = memory();
		expect(loadDorm(storage, KEY)).toBeNull();
		expect(saveDorm(storage, KEY, "obelisk")).toBe(true);
		expect(loadDorm(storage, KEY)).toBe("obelisk");
		expect(loadDorm(memory({ [KEY]: "{oops" }), KEY)).toBeNull();
		expect(loadDorm(memory({ [KEY]: JSON.stringify({ version: 1, dorm: "pink" }) }), KEY)).toBeNull();
		expect(loadDorm(undefined, KEY)).toBeNull();
	});

	it("send their leader to the tower island, who gives the dorm's card when it is finished", () => {
		expect(islandTrainer(DORM_ISLAND, null)).toEqual({ trainers: [], cards: [] });
		expect(islandTrainer(DORM_ISLAND, "slifer")).toEqual({ trainers: ["jaden-yuki"], cards: ["slifer-the-sky-dragon"] });
		const before = solvedThrough(WORLD_IDS[WORLD_IDS.indexOf(DORM_ISLAND) - 1]!);
		const after = solvedThrough(DORM_ISLAND);
		expect(rewardCards(before, "ra")).not.toContain("the-winged-dragon-of-ra");
		expect(rewardCards(after, "ra")).toContain("the-winged-dragon-of-ra");
		expect(rewardCards(after, null)).not.toContain("the-winged-dragon-of-ra");
		expect(binder(after, [], "ra")).toContain("the-winged-dragon-of-ra");
		const tower = WORLD_IDS.indexOf(DORM_ISLAND);
		expect(islandTrainerPictures("obelisk")[tower]).toBe("/trainers/alexis-rhodes-512.webp");
		expect(islandTrainerPictures(null)[tower]).toBeNull();
		expect(islandCardUrls(before, "obelisk")[tower]).toBe("/cards/10000000-480.webp");
	});

	it("give the leader something to say in every language", () => {
		for (const locale of ["en", "fr", "he"] as const)
			for (const dorm of DORMS) {
				expect(dormLines(locale, dorm).hello, `${locale} ${dorm}`).toBeTruthy();
				expect(dormLines(locale, dorm).done, `${locale} ${dorm}`).toBeTruthy();
			}
		expect(dormLines("en", "slifer").done).toMatch(/Slifer the Sky Dragon/);
	});
});
