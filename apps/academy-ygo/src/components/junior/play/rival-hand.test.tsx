// @vitest-environment jsdom
import { board } from "@duel-academy/engine";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { MiniBoard } from "./mini-board";

/** The rival's hand, as every card game on screen shows it: one card back per card it holds, at its side of the board. */
afterEach(cleanup);

describe("the rival's hand on the board", () => {
	it.each([false, true])("shows one card back per card the rival holds, and how many (whole mat: %s)", (full) => {
		const state = board({ full, rival: { hand: ["iron-boar", "mud-toad", "pot-of-greed"] } });
		const { container, getAllByText } = render(<MiniBoard board={state} copy={PLAY_COPY.en} moving={false} onZone={() => {}} />);
		const hand = container.querySelector("[data-spot='rival-hand']");
		expect(hand?.querySelectorAll("[data-card-back]")).toHaveLength(3);
		expect(hand?.textContent).toContain("3");
		/* The words are still there for a screen reader. */
		expect(getAllByText(/hand: 3 cards/).length).toBeGreaterThan(0);
	});
	it("shows no card back when the rival's hand is empty", () => {
		const { container } = render(<MiniBoard board={board({ rival: { hand: [] } })} copy={PLAY_COPY.en} moving={false} onZone={() => {}} />);
		expect(container.querySelectorAll("[data-card-back]")).toHaveLength(0);
	});
});
