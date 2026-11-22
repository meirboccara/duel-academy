// @vitest-environment jsdom
import { board } from "@duel-academy/engine";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
