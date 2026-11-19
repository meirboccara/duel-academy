"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getProgress } from "@/lib/progress";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface ContinueTarget {
	chapterId: string;
	lessonId: string;
	lessonTitle: string;
}

/**
 * Reads the last viewed lesson from localStorage after hydration.
 * `lessons` is the list of valid lessons (so stale progress never links to a missing page).
 */
export function ContinueLearningButton({ lessons, className }: { lessons: ContinueTarget[]; className?: string }) {
	const { t, localize } = useLanguage();
	const [target, setTarget] = useState<(ContinueTarget & { slideIndex: number }) | null>(null);

	useEffect(() => {
		const last = getProgress().lastViewed;
		if (!last) return;
		const match = lessons.find((l) => l.chapterId === last.chapterId && l.lessonId === last.lessonId);
		if (match) setTarget({ ...match, slideIndex: last.slideIndex });
	}, [lessons]);

	if (!target) return null;
	const shown = localize(target);
	return (
		<Link
			href={`/academy/${target.chapterId}/${target.lessonId}`}
			className={cn(
				"inline-flex items-center gap-3 rounded-full border border-arcane-400/50 bg-arcane-500/10 px-6 py-3 font-semibold text-arcane-300 transition hover:bg-arcane-500/20",
				className,
			)}
		>
			<Play className="h-4 w-4 rtl:rotate-180" aria-hidden />
			<span>
				{t("Continue:")} <span className="text-fg">{shown.lessonTitle}</span>
			</span>
		</Link>
	);
}
