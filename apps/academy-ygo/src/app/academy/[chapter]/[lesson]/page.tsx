import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allLessonParams, getAdjacentLesson, getChapter, getLesson, lessonHref } from "@/content/chapters";
import { LessonPlayer } from "@/components/academy/lesson-player";

interface Props {
	params: Promise<{ chapter: string; lesson: string }>;
}

export function generateStaticParams() {
	return allLessonParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { chapter, lesson } = await params;
	const found = getLesson(chapter, lesson);
	return found ? { title: found.title, description: found.description } : { title: "Lesson" };
}

export default async function LessonPage({ params }: Props) {
	const { chapter: chapterId, lesson: lessonId } = await params;
	const chapter = getChapter(chapterId);
	const lesson = getLesson(chapterId, lessonId);
	if (!chapter || !lesson) notFound();

	const { next } = getAdjacentLesson(chapterId, lessonId);

	return (
		<main>
			<LessonPlayer
				lesson={lesson}
				chapterNumber={chapter.number}
				chapterTitle={chapter.title}
				nextHref={next ? lessonHref(next.chapter.id, next.lesson.id) : "/academy"}
				nextLabel={next ? "Next lesson" : "Finish"}
			/>
		</main>
	);
}
