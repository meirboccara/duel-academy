// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import type { Level } from "@/lib/junior/play/levels";
import { LevelPlayer } from "./level-player";

afterEach(cleanup);

const level: Level = {
	id: "act-cost-test",
	world: "masters",
	uses: [],
	bar: "six",
	goal: { type: "destroy-all" },
	setup: { full: true, strict: true, phase: "main1", you: { hand: ["pocket-cub"], monsters: ["dark-magician-girl-the-dragon-knight"] }, rival: { monsters: ["shadow-wolf"] } },
	solution: [],
};

describe("a monster's effect paid with a card from the hand", () => {
	it("is used by tapping the monster, its effect, the target, then the card to pay with", async () => {
		const user = userEvent.setup();
		render(<LevelPlayer level={level} number={1} total={1} copy={PLAY_COPY.en} locale="en" moving={false} sound={false} solvedBefore hasNext={false} onSolved={vi.fn()} onNext={vi.fn()} onExit={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /^Your Main Monster Zone 1: Dark Magician Girl the Dragon Knight/ }));
		await user.click(screen.getByRole("button", { name: "Use its effect" }));
		await user.click(screen.getByRole("button", { name: /^Nox's Main Monster Zone 1: Judge Man/ }));
		expect(screen.getByRole("status").textContent).toMatch(/Pay the cost/);
		await user.click(screen.getByRole("button", { name: /Silver Fang/ }));
		expect(screen.getByRole("status").textContent).toMatch(/Judge Man is destroyed/);
	});
});
