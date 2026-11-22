// @vitest-environment jsdom
import { board } from "@duel-academy/engine";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { PhaseBar, TurnBanner } from "./mini-board";

/** The rival's turn on screen, as card games show it: a banner for its turn and each phase, the phase it is in lit. */
afterEach(cleanup);
const en = PLAY_COPY.en;

describe("the turn banner", () => {
	it("announces the rival's turn in its red, and the child's in blue", () => {
		const { container, rerender } = render(<TurnBanner events={[{ type: "turn", side: "rival" }]} copy={en} moving={false} answering={false} />);
		expect(container.querySelector("[data-turn-banner='rival']")?.textContent).toBe(en.turnBanner("rival"));
		rerender(<TurnBanner events={[{ type: "phase", side: "rival", phase: "end" }, { type: "turn", side: "you" }]} copy={en} moving={false} answering={false} />);
		expect(container.querySelector("[data-turn-banner='you']")?.textContent).toBe("Your turn!");
	});
	it("names each phase the rival enters, not the child's own (the phase bar shows those)", () => {
		const { container, rerender } = render(<TurnBanner events={[{ type: "phase", side: "rival", phase: "battle" }]} copy={en} moving={false} answering={false} />);
		expect(container.textContent).toBe(en.phases.battle);
		rerender(<TurnBanner events={[{ type: "phase", side: "you", phase: "battle" }]} copy={en} moving={false} answering={false} />);
		expect(container.textContent).toBe("");
	});
	it("goes once its beat is over, so it never stays on an old step; the chance to answer stays", () => {
		vi.useFakeTimers();
		const turn = [{ type: "turn", side: "you" }] as const;
		const { container, rerender } = render(<TurnBanner events={turn} copy={en} moving={false} answering={false} />);
		expect(container.textContent).toBe("Your turn!");
		act(() => void vi.advanceTimersByTime(2000));
		expect(container.textContent).toBe("");
		rerender(<TurnBanner events={turn} copy={en} moving={false} answering />);
		act(() => void vi.advanceTimersByTime(5000));
		expect(container.textContent).toBe("Your chance!");
		vi.useRealTimers();
	});
	it("tells the child when it is their chance to answer", () => {
		const { container } = render(<TurnBanner events={[{ type: "window", side: "you", kind: "attack" }]} copy={en} moving={false} answering />);
		expect(container.querySelector("[data-turn-banner='chance']")?.textContent).toBe("Your chance!");
	});
});

describe("the phase bar during the rival's turn", () => {
	it("lights the phase the rival is in, and lets the child tap none", () => {
		render(<PhaseBar bar="six" board={board({ turn: "rival", phase: "battle" })} copy={en} enabled={false} onDraw={() => {}} onPhase={() => {}} />);
		const battle = screen.getByRole("button", { name: en.phases.battle });
		expect(battle.getAttribute("aria-current")).toBe("step");
		expect(battle.className).toContain("border-ember-400");
		expect(screen.getAllByRole("button").every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
	});
});
