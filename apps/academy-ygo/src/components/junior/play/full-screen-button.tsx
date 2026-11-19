"use client";

import { Maximize, Minimize } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { useImmersive } from "./use-immersive";

/** How long the Home Screen tip stays up. */
const TIP_TIME = 9000;
/** Played from a Home Screen icon: there are no browser bars to hide, so no tip. */
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * The game's Full screen switch: round on the map's corner, a labelled button in the list view and on the title
 * screen. Where the browser has no full screen (an iPhone), a short tip tells a grown-up how a Home Screen icon
 * loses the browser's bars too.
 */
export function FullScreenButton({ locale, round = false, className = "" }: { locale: Locale; round?: boolean; className?: string }) {
	const words = CONTROLS_COPY[locale];
	const immersive = useImmersive();
	const [tip, setTip] = useState(false);
	useEffect(() => {
		if (!tip) return;
		const timer = window.setTimeout(() => setTip(false), TIP_TIME);
		return () => window.clearTimeout(timer);
	}, [tip]);
	const toggle = () => {
		void immersive.toggle().then((how) => setTip(how === "page" && !standalone()));
	};
	const Icon = immersive.on ? Minimize : Maximize;
	return (
		<>
			{round ? (
				<button type="button" aria-pressed={immersive.on} aria-label={words.fullScreen} title={immersive.on ? words.leaveFullScreen : words.fullScreen} onClick={toggle} className={`pointer-events-auto grid h-12 w-12 place-items-center rounded-full border-2 text-white backdrop-blur-sm ${immersive.on ? "border-gold-400 bg-gold-400/40" : "border-white/70 bg-ink-950/55"} ${className}`}>
					<Icon className="h-6 w-6" aria-hidden />
				</button>
			) : (
				<button type="button" aria-pressed={immersive.on} onClick={toggle} className={`inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 py-2 font-semibold text-fg ${immersive.on ? "border-gold-400 bg-gold-400/20" : "border-white/25"} ${className}`}>
					<Icon className="h-5 w-5" aria-hidden />
					{words.fullScreen}
				</button>
			)}
			{tip && (
				<p role="status" dir="auto" className="fixed inset-x-4 top-4 z-40 mx-auto max-w-md rounded-2xl border-2 border-gold-400 bg-ink-950/90 px-4 py-2 text-center text-fg shadow-lg">
					{words.fullScreenTip}
				</p>
			)}
		</>
	);
}
