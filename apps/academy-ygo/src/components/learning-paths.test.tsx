// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { LearningPaths } from "./learning-paths";

afterEach(() => {
	cleanup();
	window.localStorage.clear();
});

function renderPaths() {
	render(<LanguageProvider><LearningPaths /></LanguageProvider>);
	return within(screen.getByRole("region", { name: "Choose your path" }));
}

describe("learning paths on the landing page", () => {
	it("offers the beginner course and the junior mission side by side", () => {
		const section = renderPaths();
		expect(section.getByRole("heading", { level: 3, name: "Beginner" })).toBeTruthy();
		expect(section.getByRole("heading", { level: 3, name: "Junior" })).toBeTruthy();
	});

	it("sends the beginner path to the academy and the junior path to the junior mission", () => {
		const section = renderPaths();
		expect(section.getByRole("link", { name: /Start the course/ }).getAttribute("href")).toBe("/academy");
		expect(section.getByRole("link", { name: /Start Mission 1/ }).getAttribute("href")).toBe("/junior");
	});
});
