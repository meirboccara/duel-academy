"use client";

import type { LessonSlide, NumericTerm, NumericVisual, Tone } from "@/lib/lesson-types";
import { EducationalCard } from "@/components/visuals/educational-card";
import { LifePoints } from "@/components/visuals/life-points";
import { useLanguage } from "@/lib/i18n/provider";
import { SlideShell } from "@/components/slides/slide-shell";
import { TONE_TEXT } from "@/components/visuals/tone";
import { cn } from "@/lib/cn";

function Term({ term }: { term: NumericTerm }) {
	return (
		<div className="flex flex-col items-center gap-1">
			<span className={cn("font-display text-4xl tabular-nums stage:text-5xl", TONE_TEXT[term.tone ?? "gold"])}>
				{term.value}
			</span>
			{term.label && <span className="text-xs uppercase tracking-wider text-fg-muted">{term.label}</span>}
		</div>
	);
}

function Op({ op }: { op: NumericVisual["op"] }) {
	const label = op === "range" ? "…" : op;
	return <span className="font-display text-3xl text-fg-muted stage:text-4xl">{label}</span>;
}

function NumberLine({
	min,
	max,
	scales,
	legal,
}: {
	min: number;
	max: number;
	scales: [number, number];
	legal: number[];
}) {
	const { t } = useLanguage();
	const legalSet = new Set(legal);
	const [lo, hi] = scales[0] <= scales[1] ? scales : [scales[1], scales[0]];
	const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
	return (
		<div dir="ltr" className="w-full max-w-2xl" role="img" aria-label={`${t("Pendulum Scales")} ${lo} / ${hi}; ${t("Legal Levels")} ${legal.join(", ")}`}>
			<div className="mb-2 flex justify-between text-xs text-fg-muted">
				<span>{t("Scale")} {lo}</span>
				<span>{t("Legal Levels")}</span>
				<span>{t("Scale")} {hi}</span>
			</div>
			<div className="flex items-end justify-between gap-1">
				{nums.map((n) => {
					const isScale = n === lo || n === hi;
					const isLegal = legalSet.has(n);
					return (
						<div key={n} className="flex flex-1 flex-col items-center gap-1">
							<div
								className={cn(
									"w-full rounded-t-md transition-colors",
									isScale ? "h-12 bg-arcane-400" : isLegal ? "h-9 bg-gold-500/80" : "h-5 bg-white/15",
								)}
							/>
							<span className={cn("text-xs font-semibold", isScale || isLegal ? "text-fg" : "text-fg-muted")}>
								{n}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function NumericSlide({ slide }: { slide: LessonSlide & { visual: NumericVisual } }) {
	const { t } = useLanguage();
	const { visual } = slide;
	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			<div className="flex w-full flex-col items-center gap-6">
				{visual.lifePoints && (
					<div className="flex flex-col items-center gap-3 stage:flex-row stage:gap-8">
						<div className="flex flex-col items-center gap-1">
							<span className="text-xs uppercase tracking-wider text-fg-muted">{t("Before")}</span>
							<LifePoints you={visual.lifePoints.before[0]} opponent={visual.lifePoints.before[1]} size="md" />
						</div>
						<div className="flex flex-col items-center gap-1">
							<span className="text-xs uppercase tracking-wider text-fg-muted">{t("After")}</span>
							<LifePoints you={visual.lifePoints.after[0]} opponent={visual.lifePoints.after[1]} size="md" />
						</div>
					</div>
				)}

				{visual.terms.length > 0 && (
					<div dir="ltr" className="flex flex-wrap items-center justify-center gap-3 stage:gap-5">
						{visual.terms.map((term, i) => (
							<div key={i} className="flex items-center gap-3 stage:gap-5">
								{i > 0 && <Op op={visual.op} />}
								<Term term={term} />
							</div>
						))}
						{visual.result && (
							<>
								<span className="font-display text-3xl text-fg-muted stage:text-4xl">=</span>
								<Term term={visual.result} />
							</>
						)}
					</div>
				)}

				{visual.numberLine && <NumberLine {...visual.numberLine} />}

				{visual.cards && visual.cards.length > 0 && (
					<div className="flex flex-wrap justify-center gap-3">
						{visual.cards.map((card, i) => (
							<EducationalCard key={`${card.name}-${i}`} card={card} size="sm" />
						))}
					</div>
				)}

				{visual.footnote && <p className="max-w-xl text-center text-sm text-fg-muted">{visual.footnote}</p>}
			</div>
		</SlideShell>
	);
}
