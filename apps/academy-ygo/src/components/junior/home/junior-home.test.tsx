// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { LEVELS } from "@/lib/junior/play/levels";
import { PLAY_PROGRESS_KEY, emptyPlayProgress } from "@/lib/junior/play/progress";
import { PROFILES_KEY, slotKey } from "@/lib/junior/profiles";
import { encodeSave } from "@/lib/junior/save-code";
import { JuniorHome } from "./junior-home";

/* No 3D in these tests: the island world says it cannot draw, so the list of levels is the map. */
vi.mock("../world/island-world", () => ({
	IslandWorld: ({ onAvailable }: { onAvailable: (ok: boolean) => void }) => {
		useEffect(() => onAvailable(false), [onAvailable]);
		return null;
	},
}));

beforeEach(() => {
	window.localStorage.clear();
	window.localStorage.setItem("duel-academy-language", "en");
	window.history.replaceState(null, "", "/");
});
afterEach(cleanup);

const first = LEVELS[0]!.id;
const solvedRecord = (count: number) => JSON.stringify({ ...emptyPlayProgress(), levels: Object.fromEntries(LEVELS.slice(0, count).map((level) => [level.id, { clean: true, firstTry: true }])) });
const profiles = () => JSON.parse(window.localStorage.getItem(PROFILES_KEY) ?? "null");
const button = (name: string | RegExp) => screen.getByRole("button", { name });
/** The game, and a stand-in for leaving it for another page under the same layout. */
function GameOrQuiz() {
	const [gone, setGone] = useState(false);
	return gone ? (
		<p>Quiz</p>
	) : (
		<>
			<button type="button" onClick={() => setGone(true)}>
				leave
			</button>
			<JuniorHome />
		</>
	);
}
function setup() {
	const user = userEvent.setup();
	render(
		<LanguageProvider>
			<JuniorHome />
		</LanguageProvider>,
	);
	return user;
}
async function newChild(user: ReturnType<typeof userEvent.setup>, avatar: RegExp, name?: string) {
	await user.click(button(/New game/));
	await user.click(await screen.findByRole("radio", { name: avatar }));
	await user.click(button("OK"));
	if (name) await user.type(screen.getByLabelText("Nickname"), name);
	await user.click(button(name ? "OK" : "Skip"));
	await screen.findByRole("button", { name: /Back to the title screen/ });
}

describe("the title screen", () => {
	it("renders the same on the server as before the saves are read: title, tagline, buttons and three neutral places", () => {
		const html = renderToString(
			<LanguageProvider>
				<JuniorHome />
			</LanguageProvider>,
		);
		expect(html).toContain("Learn Yu-Gi-Oh! by playing.");
		expect(html).toMatch(/<button[^>]*disabled[^>]*>.*Continue/);
		expect(html.match(/data-slot-placeholder/g)).toHaveLength(3);
	});

	it("on a first visit shows New game, a disabled Continue and three empty places", async () => {
		setup();
		expect(screen.getByRole("heading", { level: 1, name: "Duel Academy" })).toBeTruthy();
		expect(await screen.findAllByRole("button", { name: /Empty: new game/ })).toHaveLength(3);
		expect((button("Continue") as HTMLButtonElement).disabled).toBe(true);
		expect(button("New game")).toBeTruthy();
	});

	it("New game: a character, a nickname, then the map; the save is kept for next time", async () => {
		const user = setup();
		await newChild(user, /Mage/, "Noa");
		expect(profiles().slots[0]).toMatchObject({ name: "Noa", avatar: "mage" });
		expect(profiles().last).toBe(1);
		cleanup();
		setup();
		const tile = await screen.findByRole("button", { name: /Play as Noa/ });
		expect(tile.textContent).toMatch(/0 of 18 islands/);
		expect(tile.textContent).toMatch(/today/);
		expect((button("Continue") as HTMLButtonElement).disabled).toBe(false);
	});

	it("a second child gets slot 2, and the first child's progress is untouched", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, solvedRecord(3));
		const user = setup();
		expect(await screen.findByRole("button", { name: /Play as Duelist 1/ })).toBeTruthy();
		await newChild(user, /Rogue/);
		expect(profiles().slots[1]).toMatchObject({ name: "", avatar: "rogue" });
		expect(window.localStorage.getItem(slotKey(2))).toBeNull();
		expect(window.localStorage.getItem(PLAY_PROGRESS_KEY)).toBe(solvedRecord(3));
	});

	it("Continue opens the save played last", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, solvedRecord(1));
		window.localStorage.setItem(slotKey(2), solvedRecord(2));
		const at = new Date().toISOString();
		window.localStorage.setItem(PROFILES_KEY, JSON.stringify({ version: 1, slots: [{ name: "A", avatar: "knight", createdAt: at, playedAt: at }, { name: "B", avatar: "mage", createdAt: at, playedAt: at }, null], last: 2 }));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Continue" }));
		expect(await screen.findByRole("button", { name: /Back to the title screen.*\(now B\)/ })).toBeTruthy();
	});

	it("with three saves, New game asks which to replace, and the confirmation keeps by default", async () => {
		const at = new Date().toISOString();
		const p = (name: string) => ({ name, avatar: "knight", createdAt: at, playedAt: at });
		window.localStorage.setItem(PROFILES_KEY, JSON.stringify({ version: 1, slots: [p("A"), p("B"), p("C")], last: 1 }));
		window.localStorage.setItem(slotKey(2), solvedRecord(2));
		const user = setup();
		await screen.findByRole("button", { name: /Play as B/ });
		await user.click(button("New game"));
		expect(screen.getByText("All three places are taken. Choose a save to replace.")).toBeTruthy();
		await user.click(button("Replace B"));
		const dialog = screen.getByRole("dialog", { name: "Replace B's save?" });
		expect(within(dialog).getByText(/This loses 2 levels/)).toBeTruthy();
		expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Keep" }));
		await user.click(within(dialog).getByRole("button", { name: "Keep" }));
		expect(profiles().slots[1].name).toBe("B");
		await user.click(button("New game"));
		await user.click(button("Replace B"));
		await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Replace" }));
		await user.click(await screen.findByRole("radio", { name: /Knight/ }));
		await user.click(button("OK"));
		await user.type(screen.getByLabelText("Nickname"), "Dan");
		await user.click(button("OK"));
		await screen.findByRole("button", { name: /Back to the title screen.*\(now Dan\)/ });
		expect(profiles().slots[1].name).toBe("Dan");
		expect(window.localStorage.getItem(slotKey(2))).toBeNull();
	});

	it("plays in full screen from New game, and the house button goes back to the title screen out of it", async () => {
		const user = setup();
		/* The title screen has no full screen of its own. */
		expect(screen.queryByRole("button", { name: /Full screen/ })).toBeNull();
		await newChild(user, /Knight/, "Zoé");
		expect(document.documentElement.dataset.immersive).toBe("on");
		await user.click(button(/Back to the title screen/));
		expect(await screen.findByRole("button", { name: /Play as Zoé/ })).toBeTruthy();
		expect(document.documentElement.dataset.immersive).toBeUndefined();
		expect(screen.queryByRole("button", { name: /Full screen/ })).toBeNull();
		await user.click(button("Continue"));
		expect(document.documentElement.dataset.immersive).toBe("on");
	});

	it("in a browser that cannot keep anything, shows one Play button and says so", async () => {
		const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		setup();
		expect(await screen.findByText("This browser will not keep your progress.")).toBeTruthy();
		expect(button("Play")).toBeTruthy();
		expect(screen.queryByRole("button", { name: /Empty: new game/ })).toBeNull();
		/* Played without a save, the game still has its way back to the title screen, out of full screen. */
		const user = userEvent.setup();
		await user.click(button("Play"));
		expect(document.documentElement.dataset.immersive).toBe("on");
		await user.click(await screen.findByRole("button", { name: "Back to the title screen: Continue or New game" }));
		expect(await screen.findByText("This browser will not keep your progress.")).toBeTruthy();
		expect(document.documentElement.dataset.immersive).toBeUndefined();
		spy.mockRestore();
	});
});

describe("managing a save", () => {
	it("loads a copy into a new save from the title screen, with its nickname and character", async () => {
		const code = encodeSave({ name: "Noa", avatar: "rogue", play: { ...emptyPlayProgress(), levels: { [first]: { clean: true, firstTry: false } } }, locale: "he" });
		const user = setup();
		await screen.findAllByRole("button", { name: /Empty: new game/ });
		await user.click(button("Load a copy"));
		const dialog = within(screen.getByRole("dialog"));
		await user.click(dialog.getByLabelText("Save code"));
		await user.paste(code);
		await user.click(dialog.getByRole("button", { name: "Load" }));
		await user.click(dialog.getByRole("button", { name: "OK" }));
		/* The copy brings the child's own language with it. */
		expect(profiles().slots[0]).toMatchObject({ name: "Noa", avatar: "rogue", locale: "he" });
		expect(JSON.parse(window.localStorage.getItem(slotKey(1))!).levels[first]).toEqual({ clean: true, firstTry: false });
		expect(await screen.findByRole("button", { name: /Play as Noa/ })).toBeTruthy();
	});

	it("merges a loaded copy into an existing save, after showing what it holds", async () => {
		const code = encodeSave({ name: "Noa", avatar: "rogue", play: { ...emptyPlayProgress(), levels: { [first]: { clean: true, firstTry: true } } } });
		const at = new Date().toISOString();
		window.localStorage.setItem(PROFILES_KEY, JSON.stringify({ version: 1, slots: [{ name: "A", avatar: "knight", createdAt: at, playedAt: at }, null, null], last: 1 }));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Manage A's save" }));
		const dialog = screen.getByRole("dialog", { name: "A's save" });
		await user.click(within(dialog).getByRole("button", { name: "Load a copy" }));
		await user.click(within(dialog).getByLabelText("Save code"));
		await user.paste(code);
		await user.click(within(dialog).getByRole("button", { name: "Load" }));
		expect(within(dialog).getByText("Noa: 1 level")).toBeTruthy();
		await user.click(within(dialog).getByRole("button", { name: "OK" }));
		expect(JSON.parse(window.localStorage.getItem(PLAY_PROGRESS_KEY)!).levels[first]).toEqual({ clean: true, firstTry: true });
	});

	it("lets a save change character only until its first mission is done", async () => {
		const at = new Date().toISOString();
		window.localStorage.setItem(PROFILES_KEY, JSON.stringify({ version: 1, slots: [{ name: "A", avatar: "knight", createdAt: at, playedAt: at }, { name: "B", avatar: "mage", createdAt: at, playedAt: at }, null], last: 1 }));
		window.localStorage.setItem(slotKey(2), solvedRecord(1));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Manage A's save" }));
		expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Change character" })).toBeTruthy();
		await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
		await user.click(screen.getByRole("button", { name: "Manage B's save" }));
		const dialog = within(screen.getByRole("dialog"));
		expect(dialog.queryByRole("button", { name: "Change character" })).toBeNull();
		expect(dialog.getByText(/stays the same once the first mission is done/)).toBeTruthy();
	});

	it("gives each save its own language, shown while it is played, without changing the site's", async () => {
		const at = new Date().toISOString();
		window.localStorage.setItem(PROFILES_KEY, JSON.stringify({ version: 1, slots: [{ name: "A", avatar: "knight", createdAt: at, playedAt: at }, null, null], last: 1 }));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Manage A's save" }));
		const dialog = within(screen.getByRole("dialog"));
		await user.selectOptions(dialog.getByLabelText("Language of this save"), "fr");
		expect(profiles().slots[0].locale).toBe("fr");
		await user.click(dialog.getByRole("button", { name: "Close" }));
		/* The title screen stays in the site's language. */
		expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
		await user.click(button("Continue"));
		expect(await screen.findByRole("button", { name: /^Retour à l’écran titre/ })).toBeTruthy();
		expect(document.documentElement.lang).toBe("fr");
		expect(window.localStorage.getItem("duel-academy-language")).toBe("en");
		await user.click(button(/^Retour à l’écran titre/));
		expect(await screen.findByRole("button", { name: "Continue" })).toBeTruthy();
		expect(document.documentElement.lang).toBe("en");
	});

	it("asks for the save's language at New game: the site's unless another is chosen", async () => {
		const user = setup();
		await user.click(button(/New game/));
		await user.click(await screen.findByRole("radio", { name: /Witch/ }));
		await user.click(button("OK"));
		expect((screen.getByLabelText("Language of this save") as HTMLSelectElement).value).toBe("site");
		await user.selectOptions(screen.getByLabelText("Language of this save"), "fr");
		await user.click(button("Skip"));
		expect(profiles().slots[0]).toMatchObject({ avatar: "witch", locale: "fr" });
		expect(await screen.findByRole("button", { name: /^Retour à l’écran titre/ })).toBeTruthy();
		expect(window.localStorage.getItem("duel-academy-language")).toBe("en");
	});

	it("gives the site its language back when the game is left for another page", async () => {
		const at = new Date().toISOString();
		window.localStorage.setItem(PROFILES_KEY, JSON.stringify({ version: 1, slots: [{ name: "A", avatar: "knight", createdAt: at, playedAt: at, locale: "fr" }, null, null], last: 1 }));
		const user = userEvent.setup();
		const page = render(
			<LanguageProvider>
				<GameOrQuiz />
			</LanguageProvider>,
		);
		await user.click(await screen.findByRole("button", { name: "Continue" }));
		await screen.findByRole("button", { name: /^Retour à l’écran titre/ });
		/* Off to the quiz: the game unmounts, the layout's language stays. */
		await user.click(screen.getByRole("button", { name: "leave" }));
		await waitFor(() => expect(document.documentElement.lang).toBe("en"));
		page.unmount();
	});

	it("refuses a damaged code with a plain message", async () => {
		const code = encodeSave({ name: "Noa", avatar: "rogue", play: emptyPlayProgress() });
		window.localStorage.setItem(PLAY_PROGRESS_KEY, solvedRecord(1));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Manage Duelist 1's save" }));
		const dialog = within(screen.getByRole("dialog"));
		await user.click(dialog.getByRole("button", { name: "Load a copy" }));
		await user.click(dialog.getByLabelText("Save code"));
		await user.paste(code.slice(0, 20) + code.slice(21));
		await user.click(dialog.getByRole("button", { name: "Load" }));
		expect(dialog.getByText("This code is damaged: part of it is missing. Copy it again.")).toBeTruthy();
	});

	it("deletes a save only after a confirmation", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, solvedRecord(1));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Manage Duelist 1's save" }));
		await user.click(button("Delete"));
		await act(async () => {
			await user.click(within(screen.getByRole("dialog", { name: "Delete Duelist 1's save?" })).getByRole("button", { name: "Delete" }));
		});
		expect(window.localStorage.getItem(PLAY_PROGRESS_KEY)).toBeNull();
		expect(await screen.findAllByRole("button", { name: /Empty: new game/ })).toHaveLength(3);
	});

	it("shows the save code to copy", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, solvedRecord(1));
		const user = setup();
		await user.click(await screen.findByRole("button", { name: "Manage Duelist 1's save" }));
		await user.click(button("Save a copy"));
		const field = screen.getByRole("textbox", { name: "Save code" }) as HTMLTextAreaElement;
		expect(field.value).toMatch(/^DA1\./);
	});
});
