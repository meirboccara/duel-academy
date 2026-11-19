import { T } from "@/lib/i18n/t";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chapters, getChapter, lessonHref } from "@/content/chapters";

interface Props {
	params: Promise<{ chapter: string }>;
}

export function generateStaticParams() {
	return chapters.map((c) => ({ chapter: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { chapter } = await params;
	const found = getChapter(chapter);
	return { title: found ? `Chapter ${found.number}: ${found.title}` : "Chapter" };
}

export default async function ChapterPage({ params }: Props) {
	const { chapter: chapterId } = await params;
	const chapter = getChapter(chapterId);
	if (!chapter) notFound();

	return (
		<main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
			<nav aria-label="Breadcrumb" className="mb-6 text-sm text-fg-muted">
				<Link href="/academy" className="hover:text-gold-400">
					<T>Academy</T>
				</Link>{" "}
				/ <span className="text-fg"><T>Chapter</T> {chapter.number}</span>
			</nav>
			<header className="mb-10">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400"><T>Chapter</T> {chapter.number}</p>
				<h1 className="font-display text-4xl text-fg md:text-5xl"><T>{chapter.title}</T></h1>
				<p className="mt-3 text-fg-muted"><T>{chapter.description}</T></p>
				<p className="mt-2 text-xs uppercase tracking-wider text-fg-muted"><T>{chapter.audience}</T></p>
			</header>
			{chapter.lessons.length === 0 ? (
				<p className="rounded-xl border border-white/10 bg-surface/60 p-6 text-fg-muted">
					<T>Lessons for this chapter are coming soon.</T>
				</p>
			) : (
				<ol className="space-y-3">
					{chapter.lessons.map((lesson, i) => (
						<li key={lesson.id}>
							<Link
								href={lessonHref(chapter.id, lesson.id)}
								className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-surface/60 p-5 transition hover:border-gold-400/50 hover:bg-surface-raised/80"
							>
								<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/50 font-display text-lg text-gold-400">
									{i + 1}
								</span>
								<div className="min-w-0 flex-1">
									<h2 className="font-display text-lg text-fg group-hover:text-gold-400"><T>{lesson.title}</T></h2>
									<p className="text-sm text-fg-muted"><T>{lesson.description}</T></p>
								</div>
								<span className="shrink-0 text-xs text-fg-muted">{lesson.slides.length} <T>Slides</T></span>
							</Link>
						</li>
					))}
				</ol>
			)}
		</main>
	);
}
