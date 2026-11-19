"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { FULLSCREEN_EVENTS, canFullscreen, enterFullscreen, exitFullscreen, fullscreenElement } from "@/lib/fullscreen";

/** How full screen went: the browser's own, or only the site's header and footer hidden (an iPhone, or refused). */
export type ImmersiveResult = "native" | "page" | "off";

/*
 * One full screen for the whole game, shared by the title screen (which turns it on with Continue or New game and
 * off when the child comes back to it) and the islands (whose button switches it). It also ends when the last of
 * them is gone (the child left for the lessons) or when the browser's own full screen ends (Escape, a swipe).
 */
let on = false;
/* Whether the browser's full screen was given: only then does its ending turn the game's off. */
let native = false;
let users = 0;
const listeners = new Set<() => void>();

function setOn(next: boolean) {
	on = next;
	const html = document.documentElement;
	if (next) html.dataset.immersive = "on";
	else delete html.dataset.immersive;
	for (const listener of listeners) listener();
}
function onBrowserChange() {
	if (native && !fullscreenElement(document)) {
		native = false;
		setOn(false);
	}
}
function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * The game's full screen. Turned on, it hides the site's header and footer (`html[data-immersive]`, see
 * `globals.css`) so the islands and the duels take the whole page, and asks the browser for real full screen, turned
 * sideways where the device allows it.
 */
export function useImmersive() {
	const current = useSyncExternalStore(
		subscribe,
		() => on,
		() => false,
	);

	useEffect(() => {
		users += 1;
		if (users === 1) for (const name of FULLSCREEN_EVENTS) document.addEventListener(name, onBrowserChange);
		return () => {
			users -= 1;
			if (users > 0) return;
			for (const name of FULLSCREEN_EVENTS) document.removeEventListener(name, onBrowserChange);
			if (native) {
				native = false;
				void exitFullscreen(document);
			}
			if (on) setOn(false);
		};
	}, []);

	const leave = useCallback(async (): Promise<ImmersiveResult> => {
		if (!on && !native) return "off";
		native = false;
		setOn(false);
		await exitFullscreen(document);
		return "off";
	}, []);
	/* Must be called from a tap or a key press: browsers give full screen only then. */
	const enter = useCallback(async (): Promise<ImmersiveResult> => {
		if (on) return native ? "native" : "page";
		setOn(true);
		const given = canFullscreen(document) && (await enterFullscreen(document.documentElement));
		/* Left again while the browser was still going full screen (a quick tap on the house): undo it. */
		if (!on) {
			if (given) await exitFullscreen(document);
			return "off";
		}
		native = given;
		if (given) {
			/* Android turns the game sideways; elsewhere this is refused, and the "turn your screen" notice stays the guide. */
			const orientation = screen.orientation as ScreenOrientation & { lock?: (to: string) => Promise<void> };
			try {
				await orientation?.lock?.("landscape");
			} catch {
				/* Not allowed here. */
			}
		}
		return given ? "native" : "page";
	}, []);
	const toggle = useCallback(() => (on ? leave() : enter()), [enter, leave]);

	return { on: current, enter, leave, toggle };
}
