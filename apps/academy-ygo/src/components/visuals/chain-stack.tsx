"use client";

import type { Tone } from "@/lib/lesson-types";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface ChainLinkItem {
	label: string;
	sub?: string;
	tone?: Tone;
}

export interface ChainStackProps {
	items: ChainLinkItem[];
	active: number;
	/** "build" stacks CL1 at bottom; "resolve" emphasises reverse order. */
	mode?: "build" | "resolve";
	className?: string;
}

const TONE: Record<Tone, string> = {
	gold: "border-gold-400 bg-gold-500/20 text-gold-400",
	blue: "border-arcane-400 bg-arcane-500/20 text-arcane-300",
	purple: "border-violet-400 bg-violet-500/20 text-violet-400",
	green: "border-spell bg-spell/20 text-[#7ddea8]",
	red: "border-ember-400 bg-ember-500/20 text-ember-400",
	white: "border-white/50 bg-white/10 text-fg",
};

export function ChainStack({ items, active, mode = "build", className }: ChainStackProps) {
	const { t } = useLanguage();
	const resolveHint = mode === "resolve";
	return (
		<div className={cn("flex w-full max-w-xl flex-col gap-2", className)} role="list" aria-label={t("Chain stack")}>
			{resolveHint && (
				<p className="mb-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
					{t("Resolve last → first")}
				</p>
			)}
			{[...items].reverse().map((item, revIdx) => {
				const index = items.length - 1 - revIdx;
				const on = index === active;
				const tone = item.tone ?? (index === 0 ? "gold" : index === 1 ? "blue" : "purple");
				const resolving = resolveHint && on;
				return (
					<div
						key={`${item.label}-${index}`}
						role="listitem"
						aria-current={on ? "step" : undefined}
						className={cn(
							"flex items-stretch gap-3 rounded-xl border px-4 py-3 transition-all",
							TONE[tone],
							on ? "scale-[1.02] shadow-[0_0_24px_rgba(240,196,90,0.35)]" : "opacity-70",
							resolving && "ring-2 ring-gold-400",
						)}
					>
						<div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-ink-950/60">
							<span className="text-[0.65rem] font-semibold uppercase tracking-wider text-fg-muted">{t("CL")}</span>
							<span className="font-display text-2xl leading-none">{index + 1}</span>
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-semibold text-fg">{item.label}</p>
							{item.sub && <p className="text-sm text-fg-muted">{item.sub}</p>}
						</div>
						{resolving && (
							<span className="self-center rounded-full bg-gold-500/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-gold-400">
								{t("Resolving")}
							</span>
						)}
					</div>
				);
			})}
			{mode === "build" && (
				<p className="mt-1 text-center text-xs text-fg-muted">{t("Chain Link 1 is at the bottom — built first, resolves last.")}</p>
			)}
		</div>
	);
}
