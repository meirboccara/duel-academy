/**
 * The on-screen controls of the island map (a direction pad and one action button, for iPad, iPhone and computer)
 * and the 3D scene talk through this small object: the buttons send commands, the scene says what the action button
 * does at the figure's place. One per map; the scene and the buttons never import each other.
 */
export type Direction = "up" | "down" | "left" | "right";
export type MapCommand =
	/** A button pressed and held: walk (or steer the boat) that way until `release`. */
	| { type: "hold"; direction: Direction }
	| { type: "release" }
	/** The action button: what it does is `action()`. */
	| { type: "action" };
/** What the action button does where the figure is: board the boat, go ashore, enter a level's zone, open the shop. */
export type MapAction = "board" | "land" | "enter" | "shop" | null;

export interface MapControls {
	send(command: MapCommand): void;
	listen(listener: (command: MapCommand) => void): () => void;
	action(): MapAction;
	setAction(action: MapAction): void;
	/** For `useSyncExternalStore`. */
	subscribeAction(listener: () => void): () => void;
}

export function createMapControls(): MapControls {
	const listeners = new Set<(command: MapCommand) => void>();
	const watchers = new Set<() => void>();
	let current: MapAction = null;
	return {
		send: (command) => listeners.forEach((listener) => listener(command)),
		listen(listener) {
			listeners.add(listener);
			return () => void listeners.delete(listener);
		},
		action: () => current,
		setAction(action) {
			if (action === current) return;
			current = action;
			watchers.forEach((watcher) => watcher());
		},
		subscribeAction(listener) {
			watchers.add(listener);
			return () => void watchers.delete(listener);
		},
	};
}
