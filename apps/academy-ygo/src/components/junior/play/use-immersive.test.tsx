// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useImmersive } from "./use-immersive";

afterEach(cleanup);

let toggle: () => Promise<unknown> = async () => undefined;
function Screen() {
	toggle = useImmersive().toggle;
	return null;
}

describe("the game's full screen", () => {
	it("is one for the title screen and the islands: it lasts while either is shown and ends with the last", async () => {
		const title = render(<Screen />);
		const islands = render(<Screen />);
		await act(async () => {
			await toggle();
		});
		expect(document.documentElement.dataset.immersive).toBe("on");
		/* One of the two gone: the other still holds it. */
		islands.unmount();
		expect(document.documentElement.dataset.immersive).toBe("on");
		/* Off to the lessons: the game is gone, and so is its full screen. */
		title.unmount();
		expect(document.documentElement.dataset.immersive).toBeUndefined();
	});

	it("turns off with a second press", async () => {
		render(<Screen />);
		await act(async () => {
			await toggle();
		});
		await act(async () => {
			await toggle();
		});
		expect(document.documentElement.dataset.immersive).toBeUndefined();
	});
});
