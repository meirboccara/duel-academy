"use client";

import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { PLAY_COPY, VOICE_LOCALE, narrateAll, type PlayCopy } from "@/lib/junior/play/copy";
import { DEMOS, type RuleId } from "@/lib/junior/play/levels";
import { demoFrames } from "@/lib/junior/play/session";
import { speak } from "@/lib/junior/play/sound";
import { BoardStage } from "./board-stage";
import { ChainTower, ClashBanner } from "./mini-board";

interface DemoTheatreProps {
	rule: RuleId;
	copy: PlayCopy;
	locale: Locale;
	moving: boolean;
	sound: boolean;
	onDone: () => void;
}
/**
 * "Watch first": a short run of the board showing one rule, made of the same pieces the child will play with.
 * It waits for a tap after every step, so the child sets the pace, and it can be watched again.
 */
export function DemoTheatre({ rule, copy, locale, moving, sound, onDone }: DemoTheatreProps) {
	const frames = useMemo(() => demoFrames(DEMOS[rule]), [rule]);
	const [index, setIndex] = useState(0);
	const frame = frames[index] ?? frames[0];
	const last = index >= frames.length - 1;
	const line = frame ? narrateAll(copy, frame.events) : "";
	const mainRef = useRef<HTMLButtonElement>(null);
	/* Hebrew is spoken in English, like the cards. */
	const spokenLine = frame ? narrateAll(PLAY_COPY[VOICE_LOCALE[locale]], frame.events) : "";
	useEffect(() => {
		if (sound && spokenLine) speak(spokenLine, VOICE_LOCALE[locale]);
	}, [sound, spokenLine, locale]);
	useEffect(() => {
		mainRef.current?.focus();
	}, [last, index]);
	if (!frame) return null;
	return (
		<section aria-labelledby="demo-title" className="space-y-4 rounded-2xl border-2 border-arcane-400 p-4">
			<h3 id="demo-title" className="font-display text-xl text-fg">
				{copy.watchFirst}: {copy.rules[rule]}
			</h3>
			<p className="text-sm font-semibold text-gold-400">{copy.demoStep(index + 1, frames.length)}</p>
			<BoardStage board={frame.board} events={frame.events} copy={copy} moving={moving} />
			<ClashBanner events={frame.events} copy={copy} moving={moving} />
			<ChainTower events={frame.events} board={frame.board} copy={copy} />
			<p role="status" aria-live="polite" className="min-h-12 text-lg text-fg">
				{line}
			</p>
			<div className="flex flex-wrap gap-3">
				{last ? (
					<button ref={mainRef} type="button" onClick={onDone} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950">
						<Play className="h-5 w-5 rtl:rotate-180" aria-hidden />
						{copy.demoDone}
					</button>
				) : (
					<button ref={mainRef} type="button" onClick={() => setIndex((current) => current + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950">
						{copy.demoNext}
						<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
					</button>
				)}
				{index > 0 && (
					<button type="button" onClick={() => setIndex(0)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-white/25 px-4 py-2 font-semibold text-fg">
						<RotateCcw className="h-5 w-5" aria-hidden />
						{copy.demoAgain}
					</button>
				)}
				{!last && (
					<button type="button" onClick={onDone} className="inline-flex min-h-12 items-center rounded-xl border-2 border-white/25 px-4 py-2 font-semibold text-fg">
						{copy.demoDone}
					</button>
				)}
			</div>
		</section>
	);
}
