"use client";

import type { ComparisonPanel, ComparisonVisual, LessonSlide } from "@/lib/lesson-types";
import { EducationalCard } from "@/components/visuals/educational-card";
import { LifePoints } from "@/components/visuals/life-points";
import { useLanguage } from "@/lib/i18n/provider";
import { SlideShell } from "@/components/slides/slide-shell";
import { TONE_CHIP } from "@/components/visuals/tone";
import { cn } from "@/lib/cn";
import { ArrowRight } from "lucide-react";

function Panel({ panel, heading }: { panel: ComparisonPanel; heading: string }) {
	return (
		<div
			className={cn(
				"flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border p-3 text-center stage:min-w-[12rem] stage:gap-3 stage:rounded-2xl stage:p-4",
				TONE_CHIP[panel.tone ?? "gold"],
			)}
		>
			<span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-80 stage:text-xs stage:tracking-[0.2em]">{heading}</span>
			<p className="font-display text-[0.95rem] leading-tight text-fg stage:text-lg">{panel.label}</p>
			{panel.lifePoints && <LifePoints you={panel.lifePoints[0]} opponent={panel.lifePoints[1]} size="md" />}
			<div className="flex flex-wrap justify-center gap-2">
				{panel.cards.map((card, i) => (
					<EducationalCard key={`${card.name}-${i}`} card={card} size="sm" />
				))}
			</div>
			{panel.note && <p className="text-center text-xs leading-snug text-fg-muted stage:text-sm">{panel.note}</p>}
		</div>
	);
}

export function ComparisonSlide({ slide }: { slide: LessonSlide & { visual: ComparisonVisual } }) {
	const { visual } = slide;
	const { t } = useLanguage();
	const [beforeH, afterH] = visual.headings ?? [t("Before"), t("After")];
	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			{/* Phone: the two panels sit side by side with the arrow label under them. */}
			<div className="grid w-full grid-cols-2 items-stretch gap-2 stage:flex stage:flex-row stage:items-center stage:justify-center stage:gap-4">
				<Panel panel={visual.before} heading={beforeH} />
				<div className="order-last col-span-2 flex items-center justify-center gap-2 text-gold-400 stage:order-none stage:flex-col stage:gap-1">
					<ArrowRight className="h-5 w-5 rtl:rotate-180 stage:h-8 stage:w-8" aria-hidden />
					{visual.arrowLabel && <span className="text-xs font-bold uppercase tracking-wider">{visual.arrowLabel}</span>}
				</div>
				<Panel panel={visual.after} heading={afterH} />
			</div>
		</SlideShell>
	);
}
