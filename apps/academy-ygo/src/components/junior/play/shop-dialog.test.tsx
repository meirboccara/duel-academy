// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { priceOf } from "@/lib/junior/world/shop";
import { ShopDialog } from "./shop-dialog";

afterEach(cleanup);
const setup = (stars: number, bought: string[] = [], onBuy = vi.fn(() => true)) => {
	const user = userEvent.setup();
	render(<ShopDialog stars={stars} bought={bought} copy={PLAY_COPY.en} locale="en" onBuy={onBuy} onClose={() => undefined} />);
	return { user, onBuy };
};

describe("Grandpa's game shop", () => {
	it("greets the child, shows the stars to spend and every card with its price", () => {
		setup(7);
		const dialog = screen.getByRole("dialog", { name: "Grandpa's game shop" });
		expect(within(dialog).getByText(/7 stars/)).toBeTruthy();
		expect(within(dialog).getByRole("button", { name: /Watapon, Common, 4 ★/ })).toBeTruthy();
		expect(within(dialog).getByRole("button", { name: /^Dark Magician Girl, Ultra Rare, 15 ★/ })).toBeTruthy();
		expect(within(dialog).getByRole("button", { name: /Red-Eyes Black Dragon, Secret Rare, 20 ★/ })).toBeTruthy();
	});

	it("buys a card the child can afford, after showing it large", async () => {
		const { user, onBuy } = setup(7);
		await user.click(screen.getByRole("button", { name: /Watapon, Common, 4 ★/ }));
		await user.click(screen.getByRole("button", { name: "Buy for 4 ★" }));
		expect(onBuy).toHaveBeenCalledWith("watapon");
		expect(screen.getByText("Watapon is in your binder!")).toBeTruthy();
		expect(screen.queryByText(/A rare card!/)).toBeNull();
	});

	it("rewards a rare card with a bigger cheer", async () => {
		const { user } = setup(20);
		await user.click(screen.getByRole("button", { name: /^Mirror Force, Super Rare,/ }));
		await user.click(screen.getByRole("button", { name: "Buy for 10 ★" }));
		expect(screen.getByRole("status").textContent).toContain("A rare card! Look how it shines!");
	});

	it("says how many more stars a card needs, and never lets it be bought", async () => {
		const { user, onBuy } = setup(3);
		await user.click(screen.getByRole("button", { name: /^Dark Magician Girl,/ }));
		expect(screen.getByText(`${priceOf("dark-magician-girl")! - 3} more ★ needed`)).toBeTruthy();
		expect(screen.queryByRole("button", { name: /Buy for/ })).toBeNull();
		expect(onBuy).not.toHaveBeenCalled();
	});

	it("sells things for the hero in its own tab: buy, put on, take off", async () => {
		const user = userEvent.setup();
		const onBuy = vi.fn(() => true);
		const onWear = vi.fn();
		const onTakeOff = vi.fn();
		const props = { stars: 10, bought: [], copy: PLAY_COPY.en, locale: "en" as const, onBuy: () => true, onClose: () => undefined };
		const { rerender } = render(<ShopDialog {...props} wardrobe={{ avatar: "knight", items: [], wear: {}, onBuy, onWear, onTakeOff }} />);
		await user.click(screen.getByRole("tab", { name: "For your hero" }));
		await user.click(screen.getByRole("button", { name: /^Red shirt, 3 ★/ }));
		await user.click(screen.getByRole("button", { name: "Buy for 3 ★" }));
		expect(onBuy).toHaveBeenCalledWith("shirt-red");
		rerender(<ShopDialog {...props} wardrobe={{ avatar: "knight", items: ["shirt-red"], wear: {}, onBuy, onWear, onTakeOff }} />);
		await user.click(screen.getByRole("button", { name: "Put it on" }));
		expect(onWear).toHaveBeenCalledWith("shirt-red");
		rerender(<ShopDialog {...props} wardrobe={{ avatar: "knight", items: ["shirt-red"], wear: { shirt: "shirt-red" }, onBuy, onWear, onTakeOff }} />);
		await user.click(screen.getByRole("button", { name: "Take it off" }));
		expect(onTakeOff).toHaveBeenCalledWith("shirt");
	});

	it("marks a card already bought", () => {
		setup(30, ["watapon"]);
		expect(screen.getByRole("button", { name: /Watapon, Common, In your binder/ })).toBeTruthy();
	});
});
