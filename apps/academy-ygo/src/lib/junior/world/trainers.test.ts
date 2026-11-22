import { describe, expect, it } from "vitest";
import { cardArtUrl } from "@/lib/junior/play/card-pictures";
import { CARD_IDS } from "@duel-academy/cards";
import { LEVELS, WORLD_IDS, levelsOf } from "../play/levels";
import { album, emptyPlayProgress, recordSolve, type PlayProgress } from "../play/progress";
import { DISPLAY_CARDS, ISLAND_TRAINERS, binder, islandCardUrls, rewardCards, TRAINER_LINES } from "./trainers";

const win = { tries: 1, firstTry: true, clean: true, hints: 0, slips: [] };
const solveUpTo = (worldIndex: number): PlayProgress => {
	const last = levelsOf(WORLD_IDS[worldIndex]!).at(-1)!;
	return LEVELS.slice(0, LEVELS.indexOf(last) + 1).reduce((p, level) => recordSolve(p, level.id, win), emptyPlayProgress());
};

describe("the island trainers", () => {
	it("pairs Joey Wheeler with Time Wizard on the Read the card island", () => {
		expect(ISLAND_TRAINERS.reading).toMatchObject({ trainers: ["joey-wheeler"], cards: ["time-wizard"] });
	});
	it("gives Yugi's grandfather Exodia, and Blue-Eyes White Dragon to Kaiba only", () => {
		expect(ISLAND_TRAINERS.wake).toEqual({ trainers: ["solomon-muto"], cards: ["exodia-the-forbidden-one"] });
		for (const world of WORLD_IDS) if (ISLAND_TRAINERS[world].cards.includes("blue-eyes-white-dragon")) expect(ISLAND_TRAINERS[world].trainers, world).toContain("seto-kaiba");
		for (const locale of ["en", "fr", "he"] as const) expect(TRAINER_LINES[locale].wake?.hello, locale).toMatch(/Exodia|Éxodia/);
	});
	it("has Grandpa tell the child, on the first island, what his shop sells: cards and things for the hero", () => {
		expect(TRAINER_LINES.en.wake?.hello).toMatch(/shop/);
		expect(TRAINER_LINES.en.wake?.hello).toMatch(/cards/);
		expect(TRAINER_LINES.en.wake?.hello).toMatch(/hat|clothes|outfit/);
		expect(TRAINER_LINES.fr.wake?.hello).toMatch(/boutique/);
		expect(TRAINER_LINES.he.wake?.hello).toMatch(/חנות/);
	});
	it("gives every signature card official art and either a playable card or a display card", () => {
		for (const world of WORLD_IDS)
			for (const card of ISLAND_TRAINERS[world].cards) {
				expect(cardArtUrl(card), card).not.toBeNull();
				expect((CARD_IDS as string[]).includes(card) || card in DISPLAY_CARDS, card).toBe(true);
			}
	});
	it("has a greeting and a finished line in the three languages for every island with a trainer", () => {
		for (const world of WORLD_IDS) {
			if (!ISLAND_TRAINERS[world].trainers.length) continue;
			for (const locale of ["en", "fr", "he"] as const) {
				expect(TRAINER_LINES[locale][world]?.hello, `${locale} ${world}`).toBeTruthy();
				expect(TRAINER_LINES[locale][world]?.done, `${locale} ${world}`).toBeTruthy();
			}
		}
	});
});

describe("the reward cards", () => {
	it("are earned when an island is finished, and nothing new is stored", () => {
		expect(rewardCards(emptyPlayProgress())).toEqual([]);
		const reading = WORLD_IDS.indexOf("reading");
		expect(rewardCards(solveUpTo(reading - 1))).not.toContain("time-wizard");
		expect(rewardCards(solveUpTo(reading))).toContain("time-wizard");
	});
	it("join the binder after the cards played with, without doubles", () => {
		const progress = solveUpTo(WORLD_IDS.indexOf("friend"));
		const cards = binder(progress);
		expect(cards.slice(0, album(progress).length)).toEqual(album(progress));
		expect(cards).toContain("dark-magician");
		expect(new Set(cards).size).toBe(cards.length);
	});
	it("show on each island that is not asleep", () => {
		const urls = islandCardUrls(emptyPlayProgress());
		expect(urls).toHaveLength(WORLD_IDS.length);
		/* Island 1: Grandpa's Exodia the Forbidden One (card 33396948). */
		expect(urls[0]).toBe("/cards/33396948-480.webp");
		expect(urls[WORLD_IDS.indexOf("reading")]).toBeNull();
	});
});
