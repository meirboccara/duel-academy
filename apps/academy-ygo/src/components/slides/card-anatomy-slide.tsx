"use client";

import type { CardAnatomyVisual, CardPart, LessonSlide } from "@/lib/lesson-types";
import { EducationalCard } from "@/components/visuals/educational-card";
import { useLanguage } from "@/lib/i18n/provider";
import { SlideShell } from "@/components/slides/slide-shell";

export function CardAnatomySlide({ slide }: { slide: LessonSlide & { visual: CardAnatomyVisual } }) {
	const { t } = useLanguage();
	const { visual } = slide;
	const markers: Partial<Record<CardPart, number>> = {};
	visual.labels?.forEach((label, i) => {
		markers[label.part] = i + 1;
	});
	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			<div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:justify-center lg:gap-10">
				<div className="flex flex-wrap items-end justify-center gap-4">
					<EducationalCard
						card={visual.card}
						size="lg"
						highlight={visual.highlight}
						markers={Object.keys(markers).length ? markers : undefined}
						focus={visual.highlight.length > 0}
					/>
					{visual.compare?.map((card, i) => (
						<EducationalCard key={`${card.name}-${i}`} card={card} size="md" />
					))}
				</div>
				{visual.labels && visual.labels.length > 0 && (
					<ol className="max-w-sm space-y-2">
						{visual.labels.map((label, i) => (
							<li key={`${label.part}-${i}`} className="flex items-start gap-3 text-sm">
								<span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">
									{i + 1}
								</span>
								<span className="text-fg">
									<span className="font-semibold capitalize text-gold-400">{t(label.part)}</span>
									{" — "}
									{label.text}
								</span>
							</li>
						))}
					</ol>
				)}
			</div>
		</SlideShell>
	);
}
