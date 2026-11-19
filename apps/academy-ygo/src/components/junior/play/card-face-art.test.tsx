// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { CardFace } from "./mini-board";

afterEach(cleanup);

describe("a card's picture", () => {
	it("is the official art, from our own copy, when the card has it", () => {
		const { container } = render(<CardFace card="dark-magician" copy={PLAY_COPY.en} />);
		const img = container.querySelector("img");
		expect(img?.getAttribute("src")).toBe("/cards/46986414-160.webp");
		expect(img?.getAttribute("srcset")).toContain("/cards/46986414-480.webp 480w");
		expect(img?.getAttribute("alt")).toBe("");
		expect(container.innerHTML).not.toContain("ygoprodeck");
	});
	it("stays the emoji on an original card", () => {
		const { container } = render(<CardFace card="spark-dash" copy={PLAY_COPY.en} compact />);
		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toContain("⚡");
	});
	it("shows the art in a compact zone too", () => {
		const { container } = render(<CardFace card="blue-eyes-white-dragon" copy={PLAY_COPY.en} compact />);
		expect(container.querySelector("img")?.getAttribute("src")).toBe("/cards/89631139-160.webp");
	});
});
