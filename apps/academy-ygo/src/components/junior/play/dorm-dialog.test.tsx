// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DormDialog } from "./dorm-dialog";

afterEach(cleanup);

describe("choosing a dorm", () => {
	it("shows the three dorms with their leader and card, and joins the one picked", async () => {
		const user = userEvent.setup();
		const onChoose = vi.fn();
		render(<DormDialog locale="en" onChoose={onChoose} onClose={() => undefined} />);
		const dialog = screen.getByRole("dialog", { name: "Choose your dorm" });
		for (const name of ["Slifer Red", "Ra Yellow", "Obelisk Blue"]) expect(within(dialog).getByRole("button", { name: new RegExp(`^Join ${name}`) })).toBeTruthy();
		expect(within(dialog).getByText(/like Alexis Rhodes/)).toBeTruthy();
		await user.click(within(dialog).getByRole("button", { name: /^Join Ra Yellow/ }));
		expect(onChoose).toHaveBeenCalledWith("ra");
	});
	it("speaks French and Hebrew too, keeping the dorm names as in the anime in Hebrew", () => {
		render(<DormDialog locale="fr" onChoose={() => undefined} onClose={() => undefined} />);
		expect(screen.getByRole("button", { name: /^Rejoindre Obelisk Bleu/ })).toBeTruthy();
		cleanup();
		render(<DormDialog locale="he" onChoose={() => undefined} onClose={() => undefined} />);
		expect(screen.getByRole("button", { name: /Slifer Red/ })).toBeTruthy();
	});
});
