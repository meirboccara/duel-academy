import { describe, expect, it, vi } from "vitest";
import { createMapControls, type MapCommand } from "./controls";

describe("the map's controls", () => {
	it("pass each command from the buttons to the scene, to every listener until it leaves", () => {
		const controls = createMapControls();
		const heard: MapCommand[] = [];
		const leave = controls.listen((command) => heard.push(command));
		controls.send({ type: "hold", direction: "up" });
		controls.send({ type: "release" });
		leave();
		controls.send({ type: "action" });
		expect(heard).toEqual([{ type: "hold", direction: "up" }, { type: "release" }]);
	});

	it("tell the buttons what the action button does now, and only when it changes", () => {
		const controls = createMapControls();
		const changed = vi.fn();
		controls.subscribeAction(changed);
		expect(controls.action()).toBeNull();
		controls.setAction("board");
		controls.setAction("board");
		expect(controls.action()).toBe("board");
		expect(changed).toHaveBeenCalledTimes(1);
		controls.setAction(null);
		expect(changed).toHaveBeenCalledTimes(2);
	});
});
