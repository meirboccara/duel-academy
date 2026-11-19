import { describe, expect, it } from "vitest";
import { levelsOf } from "@/lib/junior/play/levels";
import { emptyPlayProgress, type PlayProgress } from "@/lib/junior/play/progress";
import { currentIsland, islandStatus, stopStatus } from "./status";

const solve = (progress: PlayProgress, ids: string[], clean = false): PlayProgress => ({
	...progress,
	levels: { ...progress.levels, ...Object.fromEntries(ids.map((id) => [id, { clean, firstTry: false }])) },
});
const wake = levelsOf("wake").map((level) => level.id);
const shield = levelsOf("shield").map((level) => level.id);

describe("island and stop status", () => {
	it("starts on the first island, open, with every other island still locked", () => {
		const fresh = emptyPlayProgress();
		expect(currentIsland(fresh)).toBe("wake");
		expect(islandStatus(fresh, "wake")).toBe("open");
		expect(islandStatus(fresh, "shield")).toBe("locked");
		expect(islandStatus(fresh, "final")).toBe("locked");
	});

	it("opens stops one after the other: the first is next, the rest locked", () => {
		const fresh = emptyPlayProgress();
		expect(stopStatus(fresh, wake[0]!)).toBe("next");
		expect(stopStatus(fresh, wake[1]!)).toBe("locked");
	});

	it("shows a solved stop as solved, or as a star when it was solved without a hint", () => {
		const progress = solve(solve(emptyPlayProgress(), [wake[0]!], true), [wake[1]!]);
		expect(stopStatus(progress, wake[0]!)).toBe("star");
		expect(stopStatus(progress, wake[1]!)).toBe("solved");
		expect(stopStatus(progress, wake[2]!)).toBe("next");
	});

	it("marks an island done once all its stops are solved, and moves the child on to the next one", () => {
		const progress = solve(emptyPlayProgress(), wake);
		expect(islandStatus(progress, "wake")).toBe("done");
		expect(islandStatus(progress, "shield")).toBe("open");
		expect(currentIsland(progress)).toBe("shield");
		expect(stopStatus(progress, shield[0]!)).toBe("next");
	});

	it("leaves an already solved stop open to replay while the next one waits", () => {
		const progress = solve(emptyPlayProgress(), [...wake, shield[0]!]);
		expect(stopStatus(progress, wake[2]!)).toBe("solved");
		expect(stopStatus(progress, shield[1]!)).toBe("next");
	});
});
