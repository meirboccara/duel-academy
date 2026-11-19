import { T } from "@/lib/i18n/t";
import type { Metadata } from "next";
import Link from "next/link";
import { chapters } from "@/content/chapters";
import { ChapterCardWithProgress } from "@/components/academy/chapter-progress";
import { ContinueLearningButton } from "@/components/academy/continue-learning-button";

export const metadata: Metadata = { title: "The Academy" };

export default function AcademyPage() {
	const lessons = chapters.flatMap((c) =>
		c.lessons.map((l) => ({ chapterId: c.id, lessonId: l.id, lessonTitle: l.title })),
	);
	return (
		<main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
			<nav aria-label="Breadcrumb" className="mb-6 text-sm text-fg-muted">
				<Link href="/" className="hover:text-gold-400">
					Duel Academy
				</Link>{" "}
				/ <span className="text-fg"><T>Academy</T></span>
			</nav>
			<header className="mb-10 flex flex-wrap items-end justify-between gap-6">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400"><T>Choose your chapter</T></p>
					<h1 className="font-display text-4xl text-fg md:text-5xl"><T>The Academy</T></h1>
					<p className="mt-3 max-w-2xl text-fg-muted">
						<T>Four chapters take you from your first card to exact rulings. Each lesson is a short full-screen presentation.</T>
					</p>
				</div>
				<ContinueLearningButton lessons={lessons} />
			</header>
			<div className="grid gap-5 md:grid-cols-2">
				{chapters.map((chapter) => (
					<ChapterCardWithProgress key={chapter.id} chapter={chapter} />
				))}
			</div>
		</main>
	);
}
