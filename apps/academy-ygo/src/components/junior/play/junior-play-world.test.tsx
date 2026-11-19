// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { PLAY_PROGRESS_KEY } from "@/lib/junior/play/progress";
import { JuniorPlay } from "./junior-play";

/* jsdom has no WebGL: stand in for the 3D world with one that says it is shown and offers its Play button. */
vi.mock("../world/island-world", () => ({
	IslandWorld: ({ onAvailable, onOpen, corner }: { onAvailable: (ok: boolean) => void; onOpen: (id: string) => void; corner?: ReactNode }) => {
		useEffect(() => onAvailable(true), [onAvailable]);
		return (
			<section aria-label="Island map">
				{corner}
				<button type="button" onClick={() => onOpen("w1-field")}>
					Play on the map
				</button>
			</section>
		);
	},
}));

beforeEach(() => {
	window.localStorage.clear();
	window.localStorage.setItem("duel-academy-language", "en");
});
afterEach(cleanup);

function setup() {
	const user = userEvent.setup();
	render(
		<LanguageProvider>
			<JuniorPlay />
		</LanguageProvider>,
	);
	return user;
}

describe("the Junior home with the island world", () => {
	it("is the map alone: no list of worlds, no intro and no second Play button below it", async () => {
		setup();
		const map = await screen.findByRole("region", { name: "Island map" });
		expect(map).toBeTruthy();
		expect(screen.queryByRole("heading", { level: 2, name: /The Deck wakes up/ })).toBeNull();
		expect(screen.queryByRole("button", { name: "Fill the field" })).toBeNull();
		expect(screen.queryByRole("button", { name: /^Play: / })).toBeNull();
		expect(screen.queryByRole("button", { name: "Calm mode" })).toBeNull();
	});

	it("puts the sound switch on the map, and keeps it once a level is open", async () => {
		const user = setup();
		const map = await screen.findByRole("region", { name: "Island map" });
		await user.click(within(map).getByRole("button", { name: "Voice and sounds" }));
		expect(JSON.parse(window.localStorage.getItem(PLAY_PROGRESS_KEY) ?? "null")).toMatchObject({ sound: true });
		await user.click(within(map).getByRole("button", { name: "Play on the map" }));
		expect(screen.getByRole("heading", { level: 2, name: "Fill the field" })).toBeTruthy();
		expect(screen.getAllByRole("button", { name: "Voice and sounds" })).toHaveLength(1);
	});
});
