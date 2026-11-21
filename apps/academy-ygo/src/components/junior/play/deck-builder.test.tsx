// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { deckable, startWith, starterCards } from "@/lib/junior/play/deck-record";
import { DeckBuilder } from "./deck-builder";

afterEach(cleanup);

function open(extraOwned: string[] = []) {
	const deck = startWith("dragon");
	const onSave = vi.fn();
	render(<DeckBuilder deck={deck} owned={deckable([...starterCards(deck), ...extraOwned])} copy={PLAY_COPY.en} locale="en" onSave={onSave} onClose={vi.fn()} />);
	return { user: userEvent.setup(), onSave, deck };
}
const binder = () => within(screen.getByRole("region", { name: "Your binder" }));
const panel = () => within(document.querySelector("[data-deck-card]") as HTMLElement);

describe("the Deck builder", () => {
	it("shows the Deck and the binder as card pictures, with the counts of the Deck", () => {
		const { deck } = open();
		expect(screen.getByRole("heading", { level: 2, name: "Your Deck for the masters" })).toBeTruthy();
		expect(screen.getAllByText(/Main Deck: 40 of 40/).length).toBeGreaterThan(0);
		expect(screen.getByText("Your Deck is ready!")).toBeTruthy();
		expect(within(screen.getByRole("region", { name: "Your Deck" })).getAllByRole("button")).toHaveLength(40 + deck.extra.length);
	});
	it("filters the binder by kind and by name", async () => {
		const { user } = open();
		await user.click(binder().getByRole("button", { name: "Traps" }));
		expect(binder().getByRole("button", { name: /^Read Mirror Force/ })).toBeTruthy();
		expect(binder().queryByRole("button", { name: /^Read Vorse Raider/ })).toBeNull();
		await user.click(binder().getByRole("button", { name: "All" }));
		await user.type(screen.getByRole("searchbox", { name: "Search for a card" }), "vorse");
		expect(binder().getAllByRole("button", { name: /^Read / })).toHaveLength(1);
		await user.clear(screen.getByRole("searchbox", { name: "Search for a card" }));
		await user.type(screen.getByRole("searchbox", { name: "Search for a card" }), "zzz");
		expect(screen.getByText("No card matches.")).toBeTruthy();
	});
	it("shows the tapped card large, with its text, and adds or takes out a copy", async () => {
		const { user, onSave } = open();
		await user.click(binder().getByRole("button", { name: /^Read Mirror Force/ }));
		expect(panel().getByRole("heading", { level: 3, name: "Mirror Force" })).toBeTruthy();
		expect(panel().getByText("Normal Trap")).toBeTruthy();
		expect(panel().getByText(/Destroy all your opponent's Attack Position monsters/)).toBeTruthy();
		/* A full Deck: nothing can be added until a card is taken out. */
		expect((panel().getByRole("button", { name: "Add Mirror Force" }) as HTMLButtonElement).disabled).toBe(true);
		await user.click(panel().getByRole("button", { name: "Take out Mirror Force" }));
		expect(screen.getAllByText(/Main Deck: 39 of 40/).length).toBeGreaterThan(0);
		expect((screen.getByRole("button", { name: "Keep this Deck" }) as HTMLButtonElement).disabled).toBe(true);
		await user.click(panel().getByRole("button", { name: "Add Mirror Force" }));
		await user.click(screen.getByRole("button", { name: "Keep this Deck" }));
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave.mock.calls[0]![0].main).toHaveLength(40);
	});
	it("follows the Forbidden & Limited List: a Limited card stops at 1 copy, and a Forbidden one cannot be added", async () => {
		const { user } = open(["pot-of-greed"]);
		await user.click(binder().getByRole("button", { name: /^Read Monster Reborn/ }));
		expect(panel().getByText("Limited: 1 copy")).toBeTruthy();
		await user.click(binder().getByRole("button", { name: /^Read Mirror Force/ }));
		await user.click(panel().getByRole("button", { name: "Take out Mirror Force" }));
		await user.click(binder().getByRole("button", { name: /^Read Monster Reborn/ }));
		expect((panel().getByRole("button", { name: "Add Monster Reborn" }) as HTMLButtonElement).disabled).toBe(true);
		await user.click(binder().getByRole("button", { name: /^Read Pot of Greed/ }));
		expect(panel().getByText("Forbidden: 0 copies")).toBeTruthy();
		expect((panel().getByRole("button", { name: "Add Pot of Greed" }) as HTMLButtonElement).disabled).toBe(true);
	});
});
