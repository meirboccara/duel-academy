"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Direction, MapControls } from "@/lib/junior/world/controls";
import type { Point } from "@/lib/junior/world/hex";
import { keyDirection } from "@/lib/junior/world/walk-graph";

/**
 * What the child is pressing, from the keyboard and from the on-screen direction pad alike: the figure and the boat
 * both read it. Kept out of React, it is read every frame.
 */
export interface MapInput {
	/** The direction held down (x east, z south, as seen on screen), or null. */
	held: Point | null;
	/** What holds it: a key's name, or "pad". */
	heldBy: string;
	/** A fresh press, not yet acted on. */
	once: Point | null;
}

const PAD: Record<Direction, Point> = { up: { x: 0, z: -1 }, down: { x: 0, z: 1 }, left: { x: -1, z: 0 }, right: { x: 1, z: 0 } };

/** Text fields keep their keys. */
const isTyping = (element: Element | null) => element instanceof HTMLElement && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));
/** On these, Enter and Space already do something. */
const isPressable = (element: Element | null) => element instanceof HTMLElement && (["BUTTON", "A", "SUMMARY"].includes(element.tagName) || element.hasAttribute("role"));

/**
 * Listens to the direction pad (through `controls`) and to the keyboard.
 *
 * The arrow keys and W A S D are read only while the map is what the child is using: the map is on screen and
 * shown, no dialog is open, and the keyboard's focus is nowhere (the page) or on something inside the map that is
 * not a text field. Then the key is taken (the page does not scroll); anywhere else the keys do what they always
 * do. E does what the action button does; so do Enter and Space when no button has the focus.
 *
 * `onInput` is called on every press (to draw a frame); `onAction` does the action and says whether there was one.
 */
export function useMapInput(controls: MapControls | undefined, onInput: () => void, onAction: () => boolean) {
	const { gl } = useThree();
	const input = useRef<MapInput>({ held: null, heldBy: "", once: null });
	const woke = useRef(onInput);
	woke.current = onInput;
	const acted = useRef(onAction);
	acted.current = onAction;

	useEffect(() => {
		const canvas = gl.domElement;
		const map = canvas.closest("section") ?? canvas.parentElement;
		const state = input.current;
		let onScreen = true;
		const observer = new IntersectionObserver(
			([entry]) => {
				onScreen = (entry?.intersectionRatio ?? 0) >= 0.5;
			},
			{ threshold: [0, 0.5, 1] },
		);
		observer.observe(canvas);
		const shown = () => onScreen && canvas.clientWidth > 0 && canvas.clientHeight > 0;
		const mine = () => {
			if (!shown()) return false;
			if (document.querySelector('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]')) return false;
			const active = document.activeElement;
			if (!active || active === document.body || active === document.documentElement) return true;
			return !!map?.contains(active) && !isTyping(active);
		};
		const down = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
			const key = event.key.toLowerCase();
			if (key === "e" || key === "enter" || key === " ") {
				if (event.repeat || !mine() || (key !== "e" && isPressable(document.activeElement))) return;
				if (acted.current()) event.preventDefault();
				return;
			}
			const direction = keyDirection(event.key);
			if (!direction || !mine()) return;
			event.preventDefault();
			state.held = direction;
			state.heldBy = key;
			state.once = direction;
			woke.current();
		};
		const up = (event: KeyboardEvent) => {
			if (event.key.toLowerCase() === state.heldBy) state.held = null;
		};
		const drop = () => {
			state.held = null;
			state.once = null;
		};
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		window.addEventListener("blur", drop);
		const stop = controls?.listen((command) => {
			if (command.type === "release") {
				if (state.heldBy === "pad") state.held = null;
				return;
			}
			if (!shown()) return;
			if (command.type === "action") {
				acted.current();
				return;
			}
			state.held = PAD[command.direction];
			state.heldBy = "pad";
			state.once = state.held;
			woke.current();
		});
		return () => {
			observer.disconnect();
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
			window.removeEventListener("blur", drop);
			stop?.();
			drop();
		};
	}, [gl, controls]);
	return input;
}
