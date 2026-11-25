// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { LEVELS } from "@/lib/junior/play/levels";
import { MASTERS, MASTER_SHORT_NAMES, masterLevelId, masterPicture } from "@/lib/junior/play/masters";
import { emptyPlayProgress, type PlayProgress } from "@/lib/junior/play/progress";
import { IslandWorld } from "./island-world";

/* jsdom has no WebGL: the canvas check is told yes, and the 3D scene itself is left out. */
vi.mock("./world-scene", () => ({ default: () => null }));
beforeEach(() => {
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

/** Every level before this one solved: the map opens on its island. */
const reached = (levelId: string): PlayProgress => ({
	...emptyPlayProgress(),
	levels: Object.fromEntries(LEVELS.slice(0, LEVELS.findIndex((level) => level.id === levelId)).map((level) => [level.id, { clean: true, firstTry: true }])),
});
const show = (progress: PlayProgress) => render(<IslandWorld progress={progress} copy={PLAY_COPY.en} locale="en" moving={false} hidden={false} onOpen={vi.fn()} onAvailable={vi.fn()} />);

describe("the masters' island on the map", () => {
	it("shows every trainer to duel by face and name, the ones still locked too", async () => {
		show(reached(masterLevelId("joey-wheeler")));
		const stops = within(await screen.findByRole("list", { name: "Levels on this island" })).getAllByRole("button");
		expect(stops).toHaveLength(MASTERS.length);
		MASTERS.forEach((master, index) => {
			const stop = stops[index]!;
			expect(stop.querySelector("img")?.getAttribute("src")).toBe(masterPicture(master));
			expect(stop.textContent).toContain(MASTER_SHORT_NAMES[master]);
		});
		/* Rex, Weevil and Mako beaten, Joey next, the others locked: every face is still there to see. */
		expect(stops[3]!.getAttribute("aria-label")).toMatch(/Joey Wheeler.*your next level/);
		expect(stops[12]!.hasAttribute("disabled")).toBe(true);
	});

	it("puts the next trainer's face on the Play button", async () => {
		show(reached(masterLevelId("joey-wheeler")));
		const play = await screen.findByRole("button", { name: /^Play: Duel: Joey Wheeler/ });
		expect(play.querySelector("img")?.getAttribute("src")).toBe(masterPicture("joey-wheeler"));
	});

	it("keeps the numbered stops on an island without duels", async () => {
		show(reached("w1-field"));
		const stops = within(await screen.findByRole("list", { name: "Levels on this island" })).getAllByRole("button");
		expect(stops[0]!.textContent).toBe("1");
		expect(stops[0]!.querySelector("img")).toBeNull();
	});
});
