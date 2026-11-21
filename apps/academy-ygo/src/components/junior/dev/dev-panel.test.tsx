// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEV_DEFAULTS } from "@/lib/junior/dev/dev-tools";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { masterLevelId } from "@/lib/junior/play/masters";
import { DevLevelBar, DevPanel, type DevActions } from "./dev-panel";

afterEach(cleanup);

const actions = (): DevActions => ({ onOpen: vi.fn(), onUnlockTo: vi.fn(), onFinishIsland: vi.fn(), onFinishAll: vi.fn(), onResetProgress: vi.fn(), onResetDeck: vi.fn(), onSettings: vi.fn() });

describe("the developer tools panel", () => {
	it("opens from the wrench and opens any level, locked or not", async () => {
		const user = userEvent.setup();
		const spy = actions();
		render(<DevPanel copy={PLAY_COPY.en} settings={DEV_DEFAULTS} actions={spy} />);
		await user.click(screen.getByRole("button", { name: "Developer tools" }));
		await user.selectOptions(screen.getByRole("combobox", { name: "Level" }), masterLevelId("atem"));
		await user.click(screen.getByRole("button", { name: "Open it" }));
		expect(spy.onOpen).toHaveBeenCalledWith(masterLevelId("atem"));
		await user.click(screen.getByRole("button", { name: "Solve everything before it" }));
		expect(spy.onUnlockTo).toHaveBeenCalledWith(masterLevelId("atem"));
		await user.selectOptions(screen.getByRole("combobox", { name: "Island" }), "steps");
		await user.click(screen.getByRole("button", { name: "Finish up to this island" }));
		expect(spy.onFinishIsland).toHaveBeenCalledWith("steps");
	});
	it("sets up the masters' duels: every card, who starts, the trainer's level", async () => {
		const user = userEvent.setup();
		const spy = actions();
		render(<DevPanel copy={PLAY_COPY.en} settings={DEV_DEFAULTS} actions={spy} />);
		await user.click(screen.getByRole("button", { name: "Developer tools" }));
		await user.click(screen.getByRole("checkbox"));
		expect(spy.onSettings).toHaveBeenLastCalledWith({ ...DEV_DEFAULTS, allCards: true });
		await user.selectOptions(screen.getByRole("combobox", { name: "Who starts a duel" }), "rival");
		expect(spy.onSettings).toHaveBeenLastCalledWith({ ...DEV_DEFAULTS, first: "rival" });
		await user.selectOptions(screen.getByRole("combobox", { name: "Trainer level" }), "expert");
		expect(spy.onSettings).toHaveBeenLastCalledWith({ ...DEV_DEFAULTS, tier: "expert" });
	});
	it("in a level, offers the solution only where there is one", () => {
		const { rerender } = render(<DevLevelBar canSolve onSolve={vi.fn()} onBotTurn={vi.fn()} onWin={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Play the solution" })).toBeTruthy();
		rerender(<DevLevelBar canSolve={false} onSolve={vi.fn()} onBotTurn={vi.fn()} onWin={vi.fn()} />);
		expect(screen.queryByRole("button", { name: "Play the solution" })).toBeNull();
	});
});
