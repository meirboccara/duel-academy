"use client";

import type { Tone } from "@/lib/lesson-types";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface PhaseItem {
	label: string;
	sub?: string;
	tone?: Tone;
}

export interface PhaseTimelineProps {
	items: PhaseItem[];
	active: number;
	skipped?: number[];
	className?: string;
}

const DEFAULT_PHASES: PhaseItem[] = [
	{ label: "Draw", sub: "DP" },
	{ label: "Standby", sub: "SP" },
	{ label: "Main 1", sub: "M1" },
	{ label: "Battle", sub: "BP" },
	{ label: "Main 2", sub: "M2" },
	{ label: "End", sub: "EP" },
];

const TONE_DOT: Record<Tone, string> = {
	gold: "bg-gold-400",
	blue: "bg-arcane-400",
	purple: "bg-violet-400",
	green: "bg-spell",
	red: "bg-ember-400",
	white: "bg-white",
};

export function PhaseTimeline({ items, active, skipped = [], className }: PhaseTimelineProps) {
	const { t } = useLanguage();
	const phases = items.length ? items : DEFAULT_PHASES;
	const skip = new Set(skipped);
	return (
		<ol
			dir="ltr"
			className={cn("flex w-full flex-wrap items-stretch justify-center gap-2 stage:gap-3", className)}
			aria-label={t("Turn phases")}
		>
			{phases.map((phase, i) => {
				const on = i === active;
				const isSkip = skip.has(i);
				const tone = phase.tone ?? "gold";
				return (
					<li
						key={`${phase.label}-${i}`}
						aria-current={on ? "step" : undefined}
						className={cn(
							"relative flex min-w-[5.5rem] flex-1 flex-col items-center rounded-xl border px-3 py-4 text-center transition-all",
							on
								? "border-gold-400 bg-gold-500/20 shadow-[0_0_24px_rgba(240,196,90,0.4)]"
								: "border-white/15 bg-surface/60",
							isSkip && "opacity-40",
						)}
					>
						<span className={cn("mb-2 h-2.5 w-2.5 rounded-full", on ? TONE_DOT[tone] : "bg-fg-muted/50")} aria-hidden />
						<span className={cn("font-display text-lg", on ? "text-gold-400" : "text-fg")}>
							{items.length ? phase.label : t(phase.label)}
						</span>
						{phase.sub && <span className="mt-1 text-xs uppercase tracking-wider text-fg-muted">{phase.sub}</span>}
						{isSkip && (
							<span className="mt-2 rounded-full border border-ember-400/60 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-ember-400">
								{t("Skipped")}
							</span>
						)}
						{i < phases.length - 1 && (
							<span
								aria-hidden
								className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-white/20 stage:block"
							/>
						)}
					</li>
				);
			})}
		</ol>
	);
}
