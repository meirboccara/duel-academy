// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { JuniorPlay } from "./junior-play";

/* As under next dev: the developer tools are in the build. */
vi.mock("../dev/dev-slot", async () => {
	const panel = await import("../dev/dev-panel");
	return { DEV_TOOLS: true, DevPanelSlot: panel.DevPanel, DevLevelBarSlot: panel.DevLevelBar };
});

beforeEach(() => {
	window.localStorage.clear();
	window.localStorage.setItem("duel-academy-language", "en");
	window.localStorage.setItem("academy-ygo:junior:play:v1:dorm", JSON.stringify({ version: 1, dorm: "slifer" }));
});
afterEach(cleanup);

describe("Junior under next dev", () => {
	it("opens a level far ahead at once, with the developer bar under the board", async () => {
		const user = userEvent.setup();
		render(
			<LanguageProvider>
				<JuniorPlay />
			</LanguageProvider>,
		);
		await user.click(await screen.findByRole("button", { name: "Developer tools" }));
		await user.selectOptions(screen.getByRole("combobox", { name: "Level" }), "st-damage");
		await user.click(screen.getByRole("button", { name: "Open it" }));
		expect(screen.getByRole("heading", { level: 2, name: "The Damage Step" })).toBeTruthy();
		expect(screen.getByRole("group", { name: "Developer tools for this level" })).toBeTruthy();
	});
});
