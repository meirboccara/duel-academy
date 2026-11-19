// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { apply, board } from "@/lib/junior/play/engine";
import { BEAT, BoardStage } from "./board-stage";

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("the board while an effect plays", () => {
	it("shows the new ATK when the gain is shown, not before", () => {
		vi.useFakeTimers();
		const before = board({ you: { hand: ["spark-dash"], monsters: ["pocket-cub"] } });
		const result = apply(before, { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 });
		if (!result.ok) throw new Error(result.reason);
		const copy = PLAY_COPY.en;
		const view = render(<BoardStage board={before} events={[]} copy={copy} moving />);
		view.rerender(<BoardStage board={result.board} events={result.events} copy={copy} moving />);
		const zone = () => screen.getByRole("img", { name: /^Your Monster Zone 1/ });
		/* The screen reader hears the real number at once; the picture waits for the "▲ +500". */
		expect(zone().getAttribute("aria-label")).toContain("ATK 1700");
		expect(zone().textContent).toContain("ATK 1200");
		act(() => void vi.advanceTimersByTime((BEAT + 0.1) * 1000));
		expect(zone().textContent).toContain("ATK 1200");
		act(() => void vi.advanceTimersByTime(0.2 * 1000));
		expect(zone().textContent).toContain("ATK 1700");
	});

	it("with motion off, shows the new ATK at once", () => {
		const before = board({ you: { hand: ["spark-dash"], monsters: ["pocket-cub"] } });
		const result = apply(before, { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 });
		if (!result.ok) throw new Error(result.reason);
		const view = render(<BoardStage board={before} events={[]} copy={PLAY_COPY.en} moving={false} />);
		view.rerender(<BoardStage board={result.board} events={result.events} copy={PLAY_COPY.en} moving={false} />);
		expect(screen.getByRole("img", { name: /^Your Monster Zone 1/ }).textContent).toContain("ATK 1700");
	});
});
