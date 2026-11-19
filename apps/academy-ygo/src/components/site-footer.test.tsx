// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/provider";
import { SiteFooter } from "./site-footer";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	window.localStorage.clear();
});

function renderAt(path: string) {
	pathname.current = path;
	render(<LanguageProvider><SiteFooter /></LanguageProvider>);
	return within(screen.getByRole("contentinfo"));
}

describe("site footer", () => {
	it("says the site is not endorsed by Konami", () => {
		const footer = renderAt("/");
		expect(footer.getByText(/not affiliated with or endorsed by Konami/)).toBeTruthy();
	});

	it("links to YGOPRODeck, YGOProJudge and DuelingTCG in a new tab", () => {
		const footer = renderAt("/");
		const expected = { YGOPRODeck: "https://ygoprodeck.com/", YGOProJudge: "https://ygoprojudge.com/", DuelingTCG: "https://duelingtcg.com/" };
		for (const [name, href] of Object.entries(expected)) {
			const link = footer.getByRole("link", { name: new RegExp(name) });
			expect(link.getAttribute("href")).toBe(href);
			expect(link.getAttribute("target")).toBe("_blank");
			expect(link.getAttribute("rel")).toBe("noopener noreferrer");
		}
	});

	it("shows the copyright with the current year", () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2031-03-04T12:00:00Z"));
		const footer = renderAt("/");
		expect(footer.getByText(/© 2031 Duel Academy/)).toBeTruthy();
	});

	it("keeps outbound links off the Junior mission", () => {
		const footer = renderAt("/junior");
		expect(footer.queryAllByRole("link")).toEqual([]);
		expect(footer.getByText(/not affiliated with or endorsed by Konami/)).toBeTruthy();
	});
});
