"use client";

import { useEffect, useState } from "react";
import { chapterProgress } from "@/lib/progress";
import type { Chapter } from "@/lib/lesson-types";
import { useLanguage } from "@/lib/i18n/provider";
import { ChapterCard } from "@/components/academy/chapter-card";

/** Client wrapper: reads completed-lesson counts from localStorage after hydration. */
export function ChapterCardWithProgress({ chapter }: { chapter: Chapter }) {
	const { localize } = useLanguage();
	const [completed, setCompleted] = useState(0);
	useEffect(() => {
		setCompleted(
			chapterProgress(
				chapter.id,
				chapter.lessons.map((l) => l.id),
			).completed,
		);
	}, [chapter]);
	return <ChapterCard chapter={localize(chapter)} completed={completed} />;
}
