"use client";

import type { LessonSlide, TimelineVisual } from "@/lib/lesson-types";
import { ChainStack } from "@/components/visuals/chain-stack";
import { PhaseTimeline } from "@/components/visuals/phase-timeline";
import { EducationalCard } from "@/components/visuals/educational-card";
import { useLanguage } from "@/lib/i18n/provider";
import { SlideShell } from "@/components/slides/slide-shell";
import { cn } from "@/lib/cn";
import { TONE_CHIP } from "@/components/visuals/tone";

export function TimelineSlide({ slide }: { slide: LessonSlide & { visual: TimelineVisual } }) {
	const { t } = useLanguage();
	const { visual } = slide;
	const isChain = visual.variant === "chain-build" || visual.variant === "chain-resolve";
	const isPhases = visual.variant === "phases";

	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			<div className="flex w-full flex-col items-center gap-6">
				{isPhases && <PhaseTimeline items={visual.items} active={visual.active} skipped={visual.skipped} />}
				{isChain && (
					<ChainStack
						items={visual.items}
						active={visual.active}
						mode={visual.variant === "chain-resolve" ? "resolve" : "build"}
					/>
				)}
				{(visual.variant === "battle" || visual.variant === "steps") && (
					<ol className="flex w-full max-w-3xl flex-wrap justify-center gap-3">
						{visual.items.map((item, i) => {
							const on = i === visual.active;
							const skipped = visual.skipped?.includes(i);
							return (
								<li
									key={`${item.label}-${i}`}
									aria-current={on ? "step" : undefined}
									className={cn(
										"flex min-w-[7rem] flex-1 flex-col rounded-xl border px-4 py-3",
										on ? TONE_CHIP[item.tone ?? "gold"] : "border-white/15 bg-surface/50 text-fg-muted",
										skipped && "line-through opacity-40",
									)}
								>
									<span className="text-xs font-bold uppercase tracking-wider opacity-70">{t("Step")} {i + 1}</span>
									<span className="font-semibold text-fg">{item.label}</span>
									{item.sub && <span className="text-sm text-fg-muted">{item.sub}</span>}
								</li>
							);
						})}
					</ol>
				)}
				{visual.cards && visual.cards.length > 0 && (
					<div className="flex flex-wrap justify-center gap-3">
						{visual.cards.map((card, i) => (
							<EducationalCard key={`${card.name}-${i}`} card={card} size="sm" />
						))}
					</div>
				)}
			</div>
		</SlideShell>
	);
}
