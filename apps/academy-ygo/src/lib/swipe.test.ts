import { describe, expect, it } from "vitest";
import { classifySwipe } from "@/lib/swipe";

describe("classifySwipe", () => {
	it("reads a long leftward drag as next slide and a rightward one as previous", () => {
		expect(classifySwipe({ x: 300, y: 400 }, { x: 180, y: 410 })).toBe("next");
		expect(classifySwipe({ x: 80, y: 400 }, { x: 220, y: 395 })).toBe("prev");
	});

	it("ignores taps and short jitters", () => {
		expect(classifySwipe({ x: 200, y: 400 }, { x: 200, y: 400 })).toBeNull();
		expect(classifySwipe({ x: 200, y: 400 }, { x: 170, y: 402 })).toBeNull();
	});

	it("leaves diagonal, mostly vertical drags to page scrolling", () => {
		expect(classifySwipe({ x: 300, y: 600 }, { x: 220, y: 380 })).toBeNull();
		expect(classifySwipe({ x: 100, y: 200 }, { x: 180, y: 290 })).toBeNull();
	});
});
