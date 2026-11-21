// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import type { Level } from "@/lib/junior/play/levels";
import { LevelPlayer } from "./level-player";

afterEach(cleanup);

const base = { world: "masters", uses: [], bar: "six", goal: { type: "destroy-all" }, solution: [] } as const;
const show = (level: Level) => render(<LevelPlayer level={level} number={1} total={1} copy={PLAY_COPY.en} locale="en" moving={false} sound={false} solvedBefore hasNext={false} onSolved={vi.fn()} onNext={vi.fn()} onExit={vi.fn()} />);

describe("a card chosen in the Deck", () => {
	it("is offered by a Spell that searches: only the cards it may take, each once", async () => {
		const user = userEvent.setup();
		const level: Level = { ...base, id: "search-test", setup: { full: true, strict: true, phase: "main1", you: { hand: ["reinforcement-of-the-army"], deck: ["elemental-hero-sparkman", "elemental-hero-sparkman", "dark-magician", "elemental-hero-neos"] }, rival: { monsters: ["shadow-wolf"] } } };
		const { container } = show(level);
		await user.click(screen.getByRole("button", { name: /Reinforcement of the Army/ }));
		expect(screen.getByRole("status").textContent).toMatch(/Choose the card to take from your Deck/);
		expect([...container.querySelectorAll("[data-search]")].map((button) => button.getAttribute("data-search"))).toEqual(["elemental-hero-sparkman"]);
		await user.click(container.querySelector<HTMLElement>("[data-search]")!);
		expect(screen.getByRole("status").textContent).toMatch(/Elemental HERO Sparkman/);
		expect(container.querySelector("[data-search]")).toBeNull();
	});

	it("is offered by Magician's Rod right after its Normal Summon", async () => {
		const user = userEvent.setup();
		const level: Level = { ...base, id: "rod-test", setup: { full: true, strict: true, phase: "main1", you: { hand: ["magicians-rod"], deck: ["dark-magical-curtain", "raigeki", "dark-magician"] }, rival: { monsters: ["shadow-wolf"] } } };
		const { container } = show(level);
		await user.click(screen.getByRole("button", { name: /Magician's Rod/ }));
		await user.click(screen.getByRole("button", { name: /^Your Main Monster Zone 1/ }));
		await user.click(screen.getByRole("button", { name: "Use its effect" }));
		expect([...container.querySelectorAll("[data-search]")].map((button) => button.getAttribute("data-search"))).toEqual(["dark-magical-curtain"]);
		await user.click(container.querySelector<HTMLElement>("[data-search]")!);
		expect(screen.getByRole("status").textContent).toMatch(/Dark Magical Curtain/);
	});
});

describe("Effect Veiler in the hand", () => {
	it("answers the rival's Spell by tapping the rival's Effect Monster", async () => {
		const user = userEvent.setup();
		const level: Level = { ...base, id: "veiler-test", goal: { type: "hold", lp: 4000, keep: [] }, setup: { full: true, strict: true, turn: "rival", you: { hand: ["effect-veiler"], monsters: ["river-otter"] }, rival: { hand: ["thunder-clap"], monsters: ["dark-magician-girl-the-dragon-knight"] } }, rival: [[{ do: "spell", card: "thunder-clap", target: "river-otter" }]] };
		show(level);
		for (let step = 0; step < 6 && screen.queryByRole("button", { name: "Nox's turn: next" }); step++) await user.click(screen.getByRole("button", { name: "Nox's turn: next" }));
		await user.click(screen.getByRole("button", { name: /Effect Veiler/ }));
		expect(screen.queryByRole("button", { name: "Use its effect from the hand" })).toBeNull();
		await user.click(screen.getByRole("button", { name: /^Nox's Main Monster Zone 1/ }));
		expect(screen.getByRole("status").textContent).toMatch(/Effect Veiler/);
	});
});
