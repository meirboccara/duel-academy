import type { CSSProperties } from "react";
import type { Spot } from "@/lib/junior/play/cues";

/** Seconds one beat of an effect lasts. A scene lasts several beats. */
export const BEAT = 0.65;

/** A spot on the board, measured: its box, relative to the stage. `found` is false when the board does not show it. */
export interface Place {
	x: number;
	y: number;
	w: number;
	h: number;
	cx: number;
	cy: number;
	found: boolean;
}
export type Finder = (spot: Spot) => Place;
export const place = (x: number, y: number, w: number, h: number, found: boolean): Place => ({ x, y, w, h, cx: x + w / 2, cy: y + h / 2, found });

export const COLOR = {
	gold: "var(--color-gold-400)",
	arcane: "var(--color-arcane-400)",
	violet: "var(--color-violet-400)",
	deepViolet: "var(--color-violet-500)",
	ember: "var(--color-ember-400)",
	green: "var(--color-spell)",
	white: "#ffffff",
	blue: "var(--color-ritual)",
	link: "var(--color-link)",
	ice: "#bfe3ff",
	tuner: "#5be3a0",
} as const;

export const at = (left: number, top: number, extra: CSSProperties = {}): CSSProperties => ({ position: "absolute", left, top, ...extra });
/** Something centred on a point. */
export const centred = (cx: number, cy: number, size: number, extra: CSSProperties = {}): CSSProperties => at(cx - size / 2, cy - size / 2, { width: size, height: size, ...extra });
export const FADE = [0, 1, 1, 0];
export const TIMES = [0, 0.2, 0.75, 1];
/** The size of a card flying over the board: as big as a card in a zone. */
export interface CardSize {
	w: number;
	h: number;
}
