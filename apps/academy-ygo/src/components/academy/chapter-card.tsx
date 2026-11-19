"use client";

import type { Chapter, Tone } from "@/lib/lesson-types";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { TONE_CHIP } from "@/components/visuals/tone";

export interface ChapterCardProps {
	chapter: Chapter;
	completed?: number;
	className?: string;
}

const ACCENT_BORDER: Record<Tone, string> = {
	gold: "hover:border-gold-400/60",
	blue: "hover:border-arcane-400/60",
	purple: "hover:border-violet-400/60",
	green: "hover:border-spell/60",
	red: "hover:border-ember-400/60",
	white: "hover:border-white/50",
};

export function ChapterCard({ chapter, completed = 0, className }: ChapterCardProps) {
	const { t } = useLanguage();
	const total = chapter.lessons.length;
	const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
	const firstLesson = chapter.lessons[0];
	const href = firstLesson ? `/academy/${chapter.id}/${firstLesson.id}` : `/academy/${chapter.id}`;

	return (
		<Link
			href={href}
			className={cn(
				"group flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface/70 p-6 transition",
				ACCENT_BORDER[chapter.accent],
				"hover:bg-surface-raised/80",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider", TONE_CHIP[chapter.accent])}>
					{t("Chapter")} {chapter.number}
				</span>
				<span className="text-xs text-fg-muted">{total} {total === 1 ? t("lesson") : t("lessons")}</span>
			</div>
			<div>
				<h3 className="font-display text-2xl text-fg group-hover:text-gold-400">{chapter.title}</h3>
				<p className="mt-2 text-sm leading-relaxed text-fg-muted">{chapter.description}</p>
			</div>
			<p className="text-xs uppercase tracking-wider text-fg-muted">{chapter.audience}</p>
			{total > 0 && (
				<div className="mt-auto">
					<div className="mb-1 flex justify-between text-xs text-fg-muted">
						<span>
							{completed}/{total} {t("complete")}
						</span>
						<span>{percent}%</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={t("Chapter progress")} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
						<div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${percent}%` }} />
					</div>
				</div>
			)}
		</Link>
	);
}
