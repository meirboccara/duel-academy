"use client";

import { Anchor, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, Sailboat, Store } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { ControlsCopy } from "@/lib/junior/world/controls-copy";
import type { Direction, MapAction, MapControls } from "@/lib/junior/world/controls";

/*
 * Thumb-sized: 56 px on a phone, 76 px on a tablet (an iPad held in both hands), where the pad sits in a bottom
 * corner. `tablet:` (globals.css) is a wide screen that is not a phone on its side (that one stays small, the map needs the height).
 */
const PAD = "pointer-events-auto grid h-14 w-14 touch-none select-none place-items-center rounded-full border-2 border-white/80 bg-ink-950/50 text-white shadow-lg backdrop-blur-sm [-webkit-touch-callout:none] active:scale-95 active:bg-gold-400/70 tablet:h-[4.75rem] tablet:w-[4.75rem] tablet:border-4";
const ARROWS: Record<Direction, typeof ArrowUp> = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight };
const SPOTS: Record<Direction, string> = { up: "col-start-2 row-start-1", left: "col-start-1 row-start-2", right: "col-start-3 row-start-2", down: "col-start-2 row-start-3" };

/**
 * The direction pad of the map, for a finger, a mouse or a keyboard: pressing and holding a direction walks the
 * figure (or steers the boat) that way until it is let go. Directions follow the screen, so the pad is never mirrored
 * in Hebrew.
 */
export function MovePad({ controls, copy }: { controls: MapControls; copy: ControlsCopy }) {
	const release = () => controls.send({ type: "release" });
	return (
		<div role="group" aria-label={copy.pad} dir="ltr" className="pointer-events-none grid grid-cols-3 grid-rows-3 gap-0.5">
			{(Object.keys(ARROWS) as Direction[]).map((direction) => {
				const Icon = ARROWS[direction];
				const hold = () => controls.send({ type: "hold", direction });
				return (
					<button
						key={direction}
						type="button"
						aria-label={copy.directions[direction]}
						className={`${PAD} ${SPOTS[direction]}`}
						onPointerDown={(event) => {
							event.currentTarget.setPointerCapture?.(event.pointerId);
							hold();
						}}
						onPointerUp={release}
						onPointerCancel={release}
						onLostPointerCapture={release}
						onKeyDown={(event) => {
							if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
								event.preventDefault();
								hold();
							}
						}}
						onKeyUp={(event) => (event.key === "Enter" || event.key === " ") && release()}
						onBlur={release}
						onContextMenu={(event) => event.preventDefault()}
					>
						<Icon className="h-7 w-7 tablet:h-10 tablet:w-10" aria-hidden />
					</button>
				);
			})}
		</div>
	);
}

const ICONS: Record<Exclude<MapAction, null>, typeof Play> = { board: Sailboat, land: Anchor, enter: Play, shop: Store };

/** The one action button: what it does depends on where the figure stands (the scene says). Hidden when there is nothing to do. */
export function ActionButton({ controls, copy }: { controls: MapControls; copy: ControlsCopy }) {
	const action = useSyncExternalStore(controls.subscribeAction, controls.action, () => null);
	if (!action) return null;
	const Icon = ICONS[action];
	return (
		<button type="button" onClick={() => controls.send({ type: "action" })} className="pointer-events-auto flex min-h-20 min-w-20 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-full border-4 border-white/80 bg-gold-400 px-2 text-ink-950 shadow-[0_0_24px_rgba(255,216,74,0.6)] [-webkit-touch-callout:none] active:scale-95 motion-safe:animate-pulse tablet:min-h-28 tablet:min-w-28">
			<Icon className="h-8 w-8 tablet:h-11 tablet:w-11" aria-hidden />
			<span className="max-w-24 text-center text-xs font-bold leading-tight tablet:text-sm">{copy.actions[action]}</span>
		</button>
	);
}
