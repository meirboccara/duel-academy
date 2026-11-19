"use client";

import { Component, createContext, useCallback, useLayoutEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";

/**
 * What the 3D duel mat needs from the page around it. A level that can draw 3D puts a `Board3dContext` around its
 * board: the board (the level's own, or the one of a demonstration) then shows its mat in 3D inside `slot`, the big
 * area the level keeps for it, and keeps its HTML twin for the keyboard and for screen readers. With no context
 * (no WebGL, a test, the child chose the flat board) the board is the HTML one, exactly as before.
 */
export interface Board3d {
	/** Where the 3D mat is drawn. Null until the page has laid it out. */
	slot: HTMLElement | null;
	locale: Locale;
	/** The 3D scene broke or lost its graphics context: the page goes back to the HTML board. */
	fail: () => void;
}
export const Board3dContext = createContext<Board3d | null>(null);

let known: boolean | null = null;
/** True when this browser can draw WebGL. Checked once, in the browser only. */
export function canDraw3d(): boolean {
	if (known !== null) return known;
	try {
		const canvas = document.createElement("canvas");
		known = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
	} catch {
		known = false;
	}
	return known;
}

const VIEW_KEY = "academy-ygo:junior:board-view";
/** The child's (or a parent's) choice of the flat board, kept on this device. */
function readFlat(): boolean {
	try {
		return window.localStorage.getItem(VIEW_KEY) === "2d";
	} catch {
		return false;
	}
}

/**
 * Whether the 3D mat can be drawn here and whether it is wanted. `ready` is false on the server, in a test and until
 * the browser has been asked, and the board is then the HTML one. Asked before the first paint, so the HTML board
 * does not flash on a device that draws 3D.
 */
export function useBoard3d(): { ready: boolean; flat: boolean; setFlat: (flat: boolean) => void; fail: () => void } {
	const [state, setState] = useState<{ ready: boolean; flat: boolean }>({ ready: false, flat: false });
	useLayoutEffect(() => {
		if (canDraw3d()) setState({ ready: true, flat: readFlat() });
	}, []);
	const setFlat = useCallback((flat: boolean) => {
		try {
			window.localStorage.setItem(VIEW_KEY, flat ? "2d" : "3d");
		} catch {
			/* Not kept: the choice still holds for this level. */
		}
		setState((before) => ({ ...before, flat }));
	}, []);
	const fail = useCallback(() => {
		known = false;
		setState({ ready: false, flat: false });
	}, []);
	return { ...state, setFlat, fail };
}

/** Any failure inside the 3D scene hides it and tells the page, which puts the HTML board back. */
export class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch() {
		this.props.onError();
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

/** The few words the 3D mat adds to the page. */
/** The names printed in the zones of the 3D mat, as on a real playmat. Hebrew keeps the English words of the cards. */
type ZoneWords = Record<"monsters" | "emz" | "backrow" | "pendulum" | "field" | "graveyard" | "deck" | "extra" | "banished", string>;
const ZONES_EN: ZoneWords = { monsters: "Monster", emz: "Extra Monster", backrow: "Spell & Trap", pendulum: "Pendulum", field: "Field", graveyard: "Graveyard", deck: "Deck", extra: "Extra Deck", banished: "Banished" };
const ZONES_FR: ZoneWords = { monsters: "Monstre", emz: "Monstre Extra", backrow: "Magie & Piège", pendulum: "Pendule", field: "Terrain", graveyard: "Cimetière", deck: "Deck", extra: "Extra Deck", banished: "Bannies" };
export const BOARD3D_COPY: Record<Locale, { flat: string; solid: string; loading: string; you: string; rival: string; zones: ZoneWords }> = {
	en: { flat: "Flat board", solid: "3D board", loading: "Setting the table…", you: "You", rival: "Rival", zones: ZONES_EN },
	fr: { flat: "Plateau à plat", solid: "Plateau 3D", loading: "On installe la table…", you: "Toi", rival: "Rival", zones: ZONES_FR },
	he: { flat: "לוח שטוח", solid: "לוח תלת־ממדי", loading: "מסדרים את השולחן…", you: "אתה", rival: "יריב", zones: ZONES_EN },
};
