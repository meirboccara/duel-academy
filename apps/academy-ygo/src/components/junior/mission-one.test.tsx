// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, LanguageSwitcher } from "@/lib/i18n/provider";
import { MissionOne } from "./mission-one";

beforeEach(() => {
	window.localStorage.clear();
	document.documentElement.lang = "en";
	document.documentElement.dir = "ltr";
});
afterEach(() => {
	cleanup();
	document.documentElement.lang = "en";
	document.documentElement.dir = "ltr";
});

function setup() {
	const user = userEvent.setup();
	render(<LanguageProvider><LanguageSwitcher /><MissionOne /></LanguageProvider>);
	return user;
}
const heading = () => screen.getByRole("heading", { level: 2 });
const feedback = () => within(screen.getByRole("main")).getByRole("status");

describe("mission 1 intro and story", () => {
	it("opens on an intro and walks six story pages", async () => {
		const user = setup();
		expect(screen.getByRole("heading", { level: 1, name: /Deck wakes up/i })).toBeTruthy();
		await user.click(screen.getByRole("button", { name: /start/i }));
		for (let page = 1; page <= 6; page++) {
			expect(screen.getByText(`Story ${page} of 6`)).toBeTruthy();
			if (page < 6) await user.click(screen.getByRole("button", { name: /next/i }));
		}
		expect(screen.getByRole("button", { name: /next/i })).toBeTruthy();
	});

	it("moves focus to the new heading on every step change", async () => {
		const user = setup();
		await user.click(screen.getByRole("button", { name: /start/i }));
		expect(document.activeElement).toBe(heading());
		await user.click(screen.getByRole("button", { name: /next/i }));
		expect(document.activeElement).toBe(heading());
	});
});

async function toSort(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: /start/i }));
	for (let page = 1; page <= 6; page++) await user.click(screen.getByRole("button", { name: /next/i }));
}
const pick = (name: string) => screen.getByRole("button", { name });

describe("mission 1 card sort", () => {
	it("shows one card at a time with no Next until the sort is right", async () => {
		const user = setup();
		await toSort(user);
		expect(screen.getByText("Card 1 of 6")).toBeTruthy();
		expect(heading().textContent).toBe("Pocket Cub");
		expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
	});

	it("explains a wrong answer kindly, allows unlimited retries, then lets the child continue", async () => {
		const user = setup();
		await toSort(user);
		await user.click(pick("Spell"));
		expect(feedback().textContent).toMatch(/Not a Spell/);
		await user.click(pick("Trap"));
		expect(feedback().textContent).toMatch(/Not a Trap/);
		expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
		await user.click(pick("Monster"));
		expect(feedback().textContent).toMatch(/Correct!/);
		expect(document.activeElement).toBe(screen.getByRole("button", { name: /next/i }));
		await user.click(screen.getByRole("button", { name: /next/i }));
		expect(screen.getByText("Card 2 of 6")).toBeTruthy();
		expect(document.activeElement).toBe(heading());
	});

	it("shows Level, ATK and DEF with left-to-right numbers on Monster cards only", async () => {
		const user = setup();
		await toSort(user);
		expect(screen.getByText("ATK").nextElementSibling?.textContent).toBe("1200");
		await user.click(pick("Monster"));
		await user.click(screen.getByRole("button", { name: /next/i }));
		expect(heading().textContent).toBe("Spark Dash");
		expect(screen.queryByText("ATK")).toBeNull();
	});
});

async function sortAll(user: ReturnType<typeof userEvent.setup>) {
	await toSort(user);
	for (const kind of ["Monster", "Spell", "Trap", "Monster", "Spell", "Trap"]) {
		await user.click(pick(kind));
		await user.click(screen.getByRole("button", { name: /next/i }));
	}
}

describe("mission 1 quiz, badge and replay", () => {
	it("asks three explained questions with retries, then shows the badge", async () => {
		const user = setup();
		await sortAll(user);
		expect(screen.getByText("Question 1 of 3")).toBeTruthy();
		await user.click(pick("Play it face-up right away, like a Normal Spell."));
		expect(feedback().textContent).toMatch(/Normal Trap has to be Set face-down first/);
		expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
		await user.click(pick("Set it face-down and let it wait."));
		expect(feedback().textContent).toMatch(/Correct!/);
		await user.click(screen.getByRole("button", { name: /next/i }));

		expect(screen.getByText("Question 2 of 3")).toBeTruthy();
		await user.click(pick("How many stars it has."));
		expect(feedback().textContent).toMatch(/stars show the Level/);
		await user.click(pick("How strong it is when it attacks."));
		await user.click(screen.getByRole("button", { name: /next/i }));

		expect(screen.getByText("Question 3 of 3")).toBeTruthy();
		await user.click(pick("It is Set face-down and must wait a turn."));
		expect(feedback().textContent).toMatch(/Normal Trap/);
		await user.click(pick("You play it on your turn, it does its job, then it goes away."));
		await user.click(screen.getByRole("button", { name: /next/i }));

		expect(heading().textContent).toBe("Deck Waker badge");
		expect(document.activeElement).toBe(heading());
	});

	it("offers Play again and a link back to the home page on the badge page", async () => {
		const user = setup();
		await sortAll(user);
		for (const answer of ["Set it face-down and let it wait.", "How strong it is when it attacks.", "You play it on your turn, it does its job, then it goes away."]) {
			await user.click(pick(answer));
			await user.click(screen.getByRole("button", { name: /next/i }));
		}
		expect(screen.getByRole("link", { name: "Back to home" }).getAttribute("href")).toBe("/");
		await user.click(screen.getByRole("button", { name: "Play again" }));
		expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
		expect(document.activeElement).toBe(heading());
	});
});

const languageSelect = () => screen.getByRole("combobox");

describe("mission 1 language", () => {
	it("keeps the step and the shown answer when the language changes, in French then Hebrew", async () => {
		const user = setup();
		await toSort(user);
		await user.click(pick("Spell"));
		await user.selectOptions(languageSelect(), "fr");
		expect(await screen.findByText("Carte 1 sur 6")).toBeTruthy();
		expect(heading().textContent).toBe("Ourson de Poche");
		expect(feedback().textContent).toMatch(/Ce n’est pas une Magie/);
		expect(document.documentElement.dir).toBe("ltr");
		await user.click(pick("Monstre"));
		await user.selectOptions(languageSelect(), "he");
		expect(await screen.findByText("קלף 1 מתוך 6")).toBeTruthy();
		expect(feedback().textContent).toMatch(/נכון!/);
		expect(document.documentElement.dir).toBe("rtl");
		await user.click(screen.getByRole("button", { name: "הבא" }));
		expect(screen.getByText("קלף 2 מתוך 6")).toBeTruthy();
	});

	it("shows Hebrew numbers left to right inside the right-to-left page", async () => {
		const user = setup();
		await toSort(user);
		await user.selectOptions(languageSelect(), "he");
		await screen.findByText("קלף 1 מתוך 6");
		const atk = screen.getByText("ATK").nextElementSibling?.querySelector("bdi");
		expect(atk?.getAttribute("dir")).toBe("ltr");
		expect(atk?.textContent).toBe("1200");
	});

	it("opens in the saved language", async () => {
		window.localStorage.setItem("duel-academy-language", "fr");
		setup();
		expect(await screen.findByRole("heading", { level: 1, name: /Le Deck se réveille/ })).toBeTruthy();
	});
});

const QUIZ_RIGHT = ["Set it face-down and let it wait.", "How strong it is when it attacks.", "You play it on your turn, it does its job, then it goes away."];
async function finish(user: ReturnType<typeof userEvent.setup>) {
	await sortAll(user);
	for (const answer of QUIZ_RIGHT) {
		await user.click(pick(answer));
		await user.click(screen.getByRole("button", { name: /next/i }));
	}
}
const JUNIOR_KEY = "academy-ygo:junior:mission1:v1";
const saved = () => JSON.parse(window.localStorage.getItem(JUNIOR_KEY) ?? "null");

describe("mission 1 local mastery", () => {
	it("remembers mastery after a reload and keeps it through a replay with wrong answers", async () => {
		const user = setup();
		expect(screen.queryByText(/already earned/)).toBeNull();
		await finish(user);
		expect(saved().sort.correct).toHaveLength(6);
		expect(saved().quiz.correct).toHaveLength(3);
		cleanup();

		const again = setup();
		expect(await screen.findByText(/already earned the Deck Waker badge/)).toBeTruthy();
		await again.click(screen.getByRole("button", { name: /start/i }));
		for (let page = 1; page <= 6; page++) await again.click(screen.getByRole("button", { name: /next/i }));
		await again.click(pick("Trap"));
		expect(saved().sort.correct).toContain("pocket-cub");
		expect(saved().sort.correct).toHaveLength(6);
		cleanup();
		setup();
		expect(await screen.findByText(/already earned/)).toBeTruthy();
	});

	it("does not call a half-finished mission mastered, and a wrong answer alone saves no mastery", async () => {
		const user = setup();
		await toSort(user);
		await user.click(pick("Spell"));
		await user.click(pick("Monster"));
		expect(saved().sort.correct).toEqual(["pocket-cub"]);
		cleanup();
		setup();
		await screen.findByRole("button", { name: /start/i });
		expect(screen.queryByText(/already earned/)).toBeNull();
	});

	it("starts clean when the saved data is damaged", async () => {
		window.localStorage.setItem(JUNIOR_KEY, "{broken");
		setup();
		expect(await screen.findByRole("button", { name: /start/i })).toBeTruthy();
		expect(screen.queryByText(/already earned/)).toBeNull();
	});

	it("leaves the adult academy progress alone", async () => {
		window.localStorage.setItem("academy-ygo:progress:v1", "ADULT");
		const user = setup();
		await finish(user);
		expect(window.localStorage.getItem("academy-ygo:progress:v1")).toBe("ADULT");
	});

	it("still works from start to badge when storage throws or is missing", async () => {
		const original = Object.getOwnPropertyDescriptor(window, "localStorage");
		Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
		try {
			const user = setup();
			await finish(user);
			expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Deck Waker badge");
		} finally {
			if (original) Object.defineProperty(window, "localStorage", original);
		}
	});
});

function mockReducedMotion(matches: boolean) {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: (query: string) => ({ matches: matches && query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }),
	});
}
const motionRoot = () => screen.getByRole("main");
const movingElements = () => motionRoot().querySelectorAll('[class*="animate-"], [class*="transition"]');
const calmToggle = () => screen.getByRole("button", { name: /calm mode/i });

describe("mission 1 calm mode", () => {
	afterEach(() => void Reflect.deleteProperty(window, "matchMedia"));

	it("moves by default and stops all motion when calm mode is on, and remembers the choice", async () => {
		const user = setup();
		await user.click(screen.getByRole("button", { name: /start/i }));
		expect(calmToggle().getAttribute("aria-pressed")).toBe("false");
		expect(motionRoot().getAttribute("data-motion")).toBe("on");
		expect(movingElements().length).toBeGreaterThan(0);
		await user.click(calmToggle());
		expect(calmToggle().getAttribute("aria-pressed")).toBe("true");
		expect(motionRoot().getAttribute("data-motion")).toBe("off");
		expect(movingElements()).toHaveLength(0);
		for (let page = 1; page <= 6; page++) await user.click(screen.getByRole("button", { name: /next/i }));
		expect(movingElements()).toHaveLength(0);
		expect(saved().calm).toBe(true);
		cleanup();
		setup();
		await waitForCalm();
	});

	it("also stops motion when the device asks for reduced motion, without changing the toggle", async () => {
		mockReducedMotion(true);
		setup();
		expect(await screen.findByText(/device also asks for less motion/)).toBeTruthy();
		expect(motionRoot().getAttribute("data-motion")).toBe("off");
		expect(calmToggle().getAttribute("aria-pressed")).toBe("false");
		expect(movingElements()).toHaveLength(0);
	});
});

async function waitForCalm() {
	await screen.findByText("Calm mode");
	await vi.waitFor(() => expect(calmToggle().getAttribute("aria-pressed")).toBe("true"));
}

describe("mission 1 keyboard and touch", () => {
	it("can be played with the keyboard alone", async () => {
		const user = setup();
		await toSort(user);
		const monster = pick("Monster");
		for (let presses = 0; presses < 12 && document.activeElement !== monster; presses++) await user.tab();
		expect(document.activeElement).toBe(monster);
		await user.keyboard(" ");
		expect(feedback().textContent).toMatch(/Correct!/);
		expect(document.activeElement).toBe(screen.getByRole("button", { name: /next/i }));
		await user.keyboard("{Enter}");
		expect(screen.getByText("Card 2 of 6")).toBeTruthy();
	});

	it("gives every control in the mission at least 48px of height (min-h-12)", async () => {
		const user = setup();
		for (const check of [async () => {}, async () => user.click(screen.getByRole("button", { name: /start/i })), async () => { for (let i = 0; i < 6; i++) await user.click(screen.getByRole("button", { name: /next/i })); }]) {
			await check();
			for (const control of within(screen.getByRole("main")).queryAllByRole("button").concat(within(screen.getByRole("main")).queryAllByRole("link"))) {
				expect(control.className, control.textContent ?? "").toMatch(/min-h-12/);
			}
		}
	});
});

const validRecord = (extra: Record<string, unknown> = {}) =>
	JSON.stringify({ version: 1, sort: { correct: [] }, quiz: { correct: [] }, calm: false, ...extra });
const ALL_SORT = ["pocket-cub", "spark-dash", "fog-snare", "moss-beetle", "glow-charm", "sticky-vine"];
const ALL_QUIZ = ["trap-first", "atk", "spell-now"];

describe("mission 1 first render and saved data", () => {
	it("never renders with motion on when a calm choice is saved", async () => {
		window.localStorage.setItem(JUNIOR_KEY, validRecord({ calm: true }));
		const seen: string[] = [];
		const read = (root: ParentNode) => root.querySelectorAll("[data-motion]").forEach((el) => seen.push(el.getAttribute("data-motion") ?? ""));
		const observer = new MutationObserver((records) => {
			for (const record of records) {
				if (record.type === "attributes" && record.target instanceof Element) seen.push(record.oldValue ?? "", record.target.getAttribute("data-motion") ?? "");
				record.addedNodes.forEach((node) => node instanceof Element && (node.hasAttribute("data-motion") && seen.push(node.getAttribute("data-motion") ?? ""), read(node)));
			}
		});
		observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ["data-motion"] });
		setup();
		await vi.waitFor(() => expect(calmToggle().getAttribute("aria-pressed")).toBe("true"));
		await Promise.resolve();
		observer.disconnect();
		expect(seen.length).toBeGreaterThan(0);
		expect(seen.every((value) => value === "off")).toBe(true);
	});

	it("does not write anything on load", async () => {
		const raw = validRecord({ sort: { answered: ["pocket-cub"], correct: ["pocket-cub"] } });
		window.localStorage.setItem(JUNIOR_KEY, raw);
		setup();
		await screen.findByRole("button", { name: /start/i });
		expect(window.localStorage.getItem(JUNIOR_KEY)).toBe(raw);
	});

	it("keeps an unknown-version record intact, even after playing", async () => {
		const raw = JSON.stringify({ version: 2, future: { stars: 9 } });
		window.localStorage.setItem(JUNIOR_KEY, raw);
		const user = setup();
		await screen.findByRole("button", { name: /start/i });
		expect(window.localStorage.getItem(JUNIOR_KEY)).toBe(raw);
		await user.click(calmToggle());
		await sortAll(user);
		expect(window.localStorage.getItem(JUNIOR_KEY)).toBe(raw);
		expect(screen.getByText("Question 1 of 3")).toBeTruthy();
	});
});

describe("mission 1 in several tabs", () => {
	it("keeps answers another tab saved when this tab saves", async () => {
		const user = setup();
		await toSort(user);
		window.localStorage.setItem(JUNIOR_KEY, validRecord({ sort: { correct: ["spark-dash"] } }));
		await user.click(pick("Monster"));
		expect([...saved().sort.correct].sort()).toEqual(["pocket-cub", "spark-dash"]);
	});

	it("picks up mastery and calm from another tab through the storage event", async () => {
		setup();
		await screen.findByRole("button", { name: /start/i });
		expect(screen.queryByText(/already earned/)).toBeNull();
		window.localStorage.setItem(JUNIOR_KEY, validRecord({ sort: { correct: ALL_SORT }, quiz: { correct: ALL_QUIZ }, calm: true }));
		act(() => void window.dispatchEvent(new StorageEvent("storage", { key: JUNIOR_KEY })));
		expect(await screen.findByText(/already earned/)).toBeTruthy();
		expect(calmToggle().getAttribute("aria-pressed")).toBe("true");
		expect(motionRoot().getAttribute("data-motion")).toBe("off");
	});

	it("ignores storage events for other keys and for records it cannot read", async () => {
		setup();
		await screen.findByRole("button", { name: /start/i });
		window.localStorage.setItem(JUNIOR_KEY, JSON.stringify({ version: 2 }));
		act(() => void window.dispatchEvent(new StorageEvent("storage", { key: JUNIOR_KEY })));
		act(() => void window.dispatchEvent(new StorageEvent("storage", { key: "other" })));
		expect(calmToggle().getAttribute("aria-pressed")).toBe("false");
		expect(screen.queryByText(/already earned/)).toBeNull();
	});
});
