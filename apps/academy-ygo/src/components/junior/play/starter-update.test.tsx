// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { PLAY_PROGRESS_KEY, emptyPlayProgress } from "@/lib/junior/play/progress";
import { STARTER_EDITION, STARTERS } from "@/lib/junior/play/starters";
import { useEffect } from "react";
import { JuniorPlay } from "./junior-play";

/* Without 3D: the island world says it cannot draw, so the page shows its list of levels. */
vi.mock("../world/island-world", () => ({
	IslandWorld: ({ onAvailable }: { onAvailable: (ok: boolean) => void }) => {
		useEffect(() => onAvailable(false), [onAvailable]);
		return null;
	},
}));

const DECK_KEY = `${PLAY_PROGRESS_KEY}:deck`;
/** A Deck saved with the first edition of the Blue-Eyes starter (no edition in the record). */
const OLD_DECK = { version: 1, starter: "dragon", main: ["blue-eyes-white-dragon", "flamvell-guard", "x-head-cannon"], extra: ["blue-eyes-spirit-dragon"] };

beforeEach(() => {
	window.localStorage.clear();
	window.localStorage.setItem("duel-academy-language", "en");
	window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), dorm: "slifer" }));
	window.localStorage.setItem(DECK_KEY, JSON.stringify(OLD_DECK));
});
afterEach(cleanup);

const open = () => {
	const user = userEvent.setup();
	render(
		<LanguageProvider>
			<JuniorPlay />
		</LanguageProvider>,
	);
	return user;
};
const saved = () => JSON.parse(window.localStorage.getItem(DECK_KEY) ?? "null");

describe("a new edition of the starter Decks, offered to a child who already has one", () => {
	it("shows the new cards; taking it makes the new starter the child's Deck", async () => {
		const user = open();
		const offer = await screen.findByRole("dialog", { name: "A new starter Deck!" });
		expect(within(offer).getByText("Sage with Eyes of Blue")).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Take the new Deck" }));
		expect(saved()).toMatchObject({ starter: "dragon", main: STARTERS.dragon.deck.main, edition: STARTER_EDITION });
		expect(screen.queryByText("A new starter Deck!")).toBeNull();
	});
	it("keeping their own Deck leaves it as it is, and it is not offered again", async () => {
		const user = open();
		await user.click(await screen.findByRole("button", { name: "Keep my Deck" }));
		expect(saved()).toMatchObject({ starter: "dragon", main: OLD_DECK.main, edition: STARTER_EDITION });
		cleanup();
		open();
		await screen.findAllByRole("button");
		expect(screen.queryByText("A new starter Deck!")).toBeNull();
	});
});
