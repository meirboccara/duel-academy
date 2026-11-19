// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { SiteHeader } from "./site-header";

afterEach(() => {
	cleanup();
	window.localStorage.clear();
});

function renderHeader() {
	render(
		<LanguageProvider>
			<SiteHeader />
		</LanguageProvider>,
	);
	return screen.getByRole("banner");
}

describe("site header", () => {
	it("leads home through the site's name, the children's game", () => {
		renderHeader();
		expect(screen.getByRole("link", { name: "Duel Academy" }).getAttribute("href")).toBe("/");
	});

	it("no longer offers the beginner course or a separate home link", () => {
		renderHeader();
		expect(screen.queryByRole("link", { name: "Beginner" })).toBeNull();
		expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
		expect(screen.getAllByRole("link")).toHaveLength(2);
	});

	it("offers to support the project on Patreon, in a new tab", () => {
		renderHeader();
		const patreon = screen.getByRole("link", { name: /Support us on Patreon/ });
		expect(patreon.getAttribute("href")).toBe("https://www.patreon.com/c/kholygo");
		expect(patreon.getAttribute("target")).toBe("_blank");
		expect(patreon.getAttribute("rel")).toContain("noopener");
		expect(patreon.textContent).toContain("(opens in a new tab)");
	});

	it("keeps the language switcher", () => {
		renderHeader();
		expect(screen.getByRole("combobox", { name: "Language" })).toBeTruthy();
	});
});
