// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroRoom, type HeroRoomProps } from "./hero-room";

afterEach(cleanup);

/* jsdom has no PointerEvent: without one a dragged finger loses its position. A mouse event with a pointer id stands in. */
if (typeof window.PointerEvent === "undefined") {
	class PointerEvent extends MouseEvent {
		pointerId: number;
		constructor(type: string, init: PointerEventInit = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 0;
		}
	}
	window.PointerEvent = PointerEvent as unknown as typeof window.PointerEvent;
}

const setup = (over: Partial<HeroRoomProps> = {}) => {
	const user = userEvent.setup();
	const props: HeroRoomProps = {
		avatar: "knight",
		items: ["shirt-red", "hat-cap-ra", "held-broom"],
		wear: { shirt: "shirt-red" },
		locale: "en",
		onWear: vi.fn(),
		onTakeOff: vi.fn(),
		onClose: vi.fn(),
		pages: [{ id: "cards", title: "Cards", content: <p>The album</p> }],
		...over,
	};
	render(<HeroRoom {...props} />);
	return { user, props };
};

describe("my hero, a pause menu", () => {
	it("opens on the Equipment page and turns to the next page and back", async () => {
		const { user } = setup();
		const menu = screen.getByRole("dialog", { name: "My hero" });
		expect(within(menu).getByRole("heading", { name: "Equipment" })).toBeTruthy();
		await user.click(within(menu).getByRole("button", { name: "Next page: Cards" }));
		expect(within(menu).getByRole("heading", { name: "Cards" })).toBeTruthy();
		expect(within(menu).getByText("The album")).toBeTruthy();
		await user.keyboard("q");
		expect(within(menu).getByRole("heading", { name: "Equipment" })).toBeTruthy();
	});

	it("shows by place everything this character can wear: owned lit, the rest still to buy", () => {
		setup();
		/* The broom is for the girls: the Knight does not see it. */
		expect(screen.queryByRole("button", { name: /broom/i })).toBeNull();
		expect(screen.getByRole("button", { name: "Red shirt" }).getAttribute("aria-pressed")).toBe("true");
		const sword = screen.getByRole("button", { name: /^Sword, in Grandpa's shop: 6 ★/ });
		expect(sword.getAttribute("aria-disabled")).toBe("true");
	});

	it("puts on and takes off with a tap", async () => {
		const { user, props } = setup();
		await user.click(screen.getByRole("button", { name: "Ra Yellow cap" }));
		expect(props.onWear).toHaveBeenCalledWith("hat-cap-ra");
		await user.click(screen.getByRole("button", { name: "Red shirt" }));
		expect(props.onTakeOff).toHaveBeenCalledWith("shirt");
		await user.click(screen.getByRole("button", { name: /^Sword/ }));
		expect(props.onWear).not.toHaveBeenCalledWith("held-sword");
	});

	it("moves a cursor with the arrow keys, says what is under it, and puts it on with Enter", async () => {
		const { user, props } = setup();
		screen.getByRole("button", { name: "Red shirt" }).focus();
		await user.keyboard("{ArrowRight}");
		expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^Blue shirt, in Grandpa's shop: 3 ★/);
		expect(screen.getByRole("status").textContent).toMatch(/Blue shirt/);
		await user.keyboard("{ArrowDown}{ArrowDown}{ArrowLeft}");
		/* Down twice from the 2nd square of Shirts, then left: the 2nd square of Hats, the Ra Yellow cap owned there. */
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Ra Yellow cap");
		screen.getByRole("button", { name: "Ra Yellow cap" }).focus();
		await user.keyboard("{Enter}");
		expect(props.onWear).toHaveBeenCalledWith("hat-cap-ra");
	});

	it("shows its own look as worn when what is worn there does not suit this character", () => {
		setup({ wear: { held: "held-broom" } });
		const held = screen.getByRole("region", { name: "To hold" });
		expect(within(held).getByRole("button", { name: "Own look" }).getAttribute("aria-pressed")).toBe("true");
	});

	it("offers the characters only while the character may still change", async () => {
		const onAvatar = vi.fn();
		const { user } = setup({ onAvatar });
		await user.click(screen.getByRole("radio", { name: "Witch" }));
		expect(onAvatar).toHaveBeenCalledWith("witch");
		cleanup();
		setup({ characterLocked: true });
		expect(screen.queryByRole("radio")).toBeNull();
		expect(screen.getByText(/Your character stays the same once the first mission is done/)).toBeTruthy();
	});

	it("makes the characters one tab stop, chosen with the arrow keys", async () => {
		const onAvatar = vi.fn();
		const { user } = setup({ onAvatar });
		const knight = screen.getByRole("radio", { name: "Knight" });
		expect(screen.getAllByRole("radio").filter((radio) => radio.tabIndex === 0)).toEqual([knight]);
		knight.focus();
		await user.keyboard("{ArrowRight}");
		expect(onAvatar).toHaveBeenCalledWith("mage");
	});

	it("turns the hero on its stand with the buttons and by dragging across it", async () => {
		const preview = vi.fn((_avatar: string, _outfit: object, heading: number) => <p>Hero turned {heading.toFixed(2)}</p>);
		const { user } = setup({ preview });
		expect(screen.getByText("Hero turned 0.00")).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Turn the hero right" }));
		expect(screen.getByText(`Hero turned ${(Math.PI / 4).toFixed(2)}`)).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Turn the hero left" }));
		expect(screen.getByText("Hero turned 0.00")).toBeTruthy();
		const stage = screen.getByTestId("hero-stage");
		fireEvent.pointerDown(stage, { clientX: 100, pointerId: 1 });
		fireEvent.pointerMove(stage, { clientX: 200, pointerId: 1 });
		fireEvent.pointerUp(stage, { pointerId: 1 });
		fireEvent.pointerMove(stage, { clientX: 400, pointerId: 1 });
		/* A hundred pixels to the right: 1.2 radians, and moving after letting go does nothing. */
		expect(screen.getByText("Hero turned 1.20")).toBeTruthy();
		/* Pressing a turn button is not the start of a drag. */
		fireEvent.pointerDown(screen.getByRole("button", { name: "Turn the hero right" }), { clientX: 0, pointerId: 2 });
		fireEvent.pointerMove(stage, { clientX: 500, pointerId: 2 });
		expect(screen.getByText("Hero turned 1.20")).toBeTruthy();
	});

	it("has no turn buttons on the still picture", () => {
		setup();
		expect(screen.queryByRole("button", { name: /Turn the hero/ })).toBeNull();
	});

	it("turns the page with the Q and E keys by place, as on a Hebrew keyboard", () => {
		setup({ locale: "he" });
		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ק", code: "KeyE" }));
		});
		expect(screen.getByRole("heading", { name: "Cards" })).toBeTruthy();
	});
});
