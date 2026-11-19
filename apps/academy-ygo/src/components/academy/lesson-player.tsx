"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Lesson } from "@/lib/lesson-types";
import { getLessonProgress, saveLessonProgress } from "@/lib/progress";
import { classifySwipe, type TouchPoint } from "@/lib/swipe";
import { useLanguage } from "@/lib/i18n/provider";
import { dirOf } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";
import { SlideRenderer } from "@/components/slides/slide-renderer";
import { SlideNavigation } from "@/components/academy/slide-navigation";
import { ProgressIndicator } from "@/components/academy/progress-indicator";
import { ProgressSegments } from "@/components/academy/progress-segments";
import { PresentationToolbar } from "@/components/academy/presentation-toolbar";

export interface LessonPlayerProps {
	lesson: Lesson;
	chapterNumber: number;
	chapterTitle: string;
	/** Where to go when the last slide is finished (next lesson or the Academy overview). */
	nextHref: string;
	nextLabel: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function isActivatable(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.closest("button, a, summary, [role='button']") !== null;
}

export function LessonPlayer({ lesson: sourceLesson, chapterNumber, chapterTitle, nextHref, nextLabel }: LessonPlayerProps) {
	const { locale, t, localize } = useLanguage();
	const rtl = dirOf(locale) === "rtl";
	/* Same ids and slide count in every language, so the slide index survives a language change. */
	const lesson = useMemo(() => localize(sourceLesson), [localize, sourceLesson]);
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const total = lesson.slides.length;
	const rootRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const touchStart = useRef<TouchPoint | null>(null);
	const [index, setIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [notesOpen, setNotesOpen] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const [restored, setRestored] = useState(false);

	const slide = lesson.slides[index];

	/* Restore the last slide (unless the lesson was already completed: then start over). */
	useEffect(() => {
		const saved = getLessonProgress(lesson.id);
		if (saved && !saved.completed && saved.slideIndex > 0 && saved.slideIndex < total) {
			setIndex(saved.slideIndex);
		}
		setRestored(true);
	}, [lesson.id, total]);

	/* Persist progress after the restore step so we never overwrite it with slide 0. */
	useEffect(() => {
		if (!restored || total === 0) return;
		saveLessonProgress({ lessonId: lesson.id, chapterId: lesson.chapterId, slideIndex: index, totalSlides: total });
	}, [restored, index, lesson.id, lesson.chapterId, total]);

	const goTo = useCallback(
		(next: number) => {
			setIndex((current) => {
				const clamped = Math.max(0, Math.min(total - 1, next));
				setDirection(clamped >= current ? 1 : -1);
				return clamped;
			});
		},
		[total],
	);

	const next = useCallback(() => {
		if (index >= total - 1) {
			saveLessonProgress({ lessonId: lesson.id, chapterId: lesson.chapterId, slideIndex: total - 1, totalSlides: total });
			router.push(nextHref);
			return;
		}
		goTo(index + 1);
	}, [index, total, goTo, router, nextHref, lesson.id, lesson.chapterId]);

	const prev = useCallback(() => goTo(index - 1), [goTo, index]);

	const toggleFullscreen = useCallback(() => {
		const el = rootRef.current;
		if (!fullscreen) {
			setFullscreen(true);
			el?.requestFullscreen?.().catch(() => {
				/* CSS full-screen layout still applies */
			});
		} else {
			setFullscreen(false);
			if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
		}
	}, [fullscreen]);

	/* Keep state in sync when the browser leaves native full screen (e.g. Esc). */
	useEffect(() => {
		const onChange = () => {
			if (!document.fullscreenElement) setFullscreen(false);
		};
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	/* Lock page scroll while presenting. */
	useEffect(() => {
		if (!fullscreen) return;
		document.body.classList.add("presentation-lock");
		return () => document.body.classList.remove("presentation-lock");
	}, [fullscreen]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
			if (isTypingTarget(e.target)) return;
			switch (e.key) {
				case "ArrowRight":
					e.preventDefault();
					if (rtl) prev();
					else next();
					break;
				case "ArrowLeft":
					e.preventDefault();
					if (rtl) next();
					else prev();
					break;
				case " ":
				case "Spacebar":
					if (isActivatable(e.target)) return;
					e.preventDefault();
					if (e.shiftKey) prev();
					else next();
					break;
				case "Home":
					e.preventDefault();
					goTo(0);
					break;
				case "End":
					e.preventDefault();
					goTo(total - 1);
					break;
				case "Escape":
					if (fullscreen) {
						setFullscreen(false);
						if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
					}
					break;
				case "n":
				case "N":
					setNotesOpen((v) => !v);
					break;
				case "f":
				case "F":
					toggleFullscreen();
					break;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [next, prev, goTo, total, fullscreen, toggleFullscreen, rtl]);

	/* A new slide starts at its top on phones, where the slide area scrolls. */
	useEffect(() => {
		stageRef.current?.scrollTo({ top: 0 });
	}, [index]);

	/* Swipes on the slide move between slides; a drag that starts on a button or link is left to that control. */
	const onTouchStart = (e: TouchEvent) => {
		const t = e.touches[0];
		const swipeable = e.touches.length === 1 && t && !isActivatable(e.target);
		touchStart.current = swipeable ? { x: t.clientX, y: t.clientY } : null;
	};

	const onTouchEnd = (e: TouchEvent) => {
		const start = touchStart.current;
		const t = e.changedTouches[0];
		touchStart.current = null;
		if (!start || !t) return;
		const intent = classifySwipe(start, { x: t.clientX, y: t.clientY });
		if (intent === "next") next();
		else if (intent === "prev") prev();
	};

	if (!slide) {
		return (
			<div className="mx-auto max-w-xl p-10 text-center text-fg-muted">
				{t("This lesson has no slides yet.")}
			</div>
		);
	}

	const notes = slide.speakerNotes;
	const isLast = index === total - 1;
	const titles = lesson.slides.map((s) => s.title);

	return (
		<div
			ref={rootRef}
			className={cn(
				/* Phone: a full-height deck (bar, scrolling slide, docked controls). Desktop: a padded 16:9 stage. */
				"flex h-dvh flex-col bg-ink-950 stage:gap-3 stage:p-5",
				fullscreen ? "fixed inset-0 z-50 w-screen overflow-hidden" : "mx-auto w-full max-w-[1400px] stage:h-auto stage:min-h-dvh",
			)}
		>
			<div className="shrink-0 border-b border-white/8 bg-ink-950/95 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] stage:border-0 stage:bg-transparent stage:p-0">
				<PresentationToolbar
					chapterLabel={`${t("Chapter")} ${chapterNumber} · ${localize({ title: chapterTitle }).title}`}
					lessonTitle={lesson.title}
					notesAvailable={lesson.slides.some((s) => Boolean(s.speakerNotes))}
					notesOpen={notesOpen}
					onToggleNotes={() => setNotesOpen((v) => !v)}
					fullscreen={fullscreen}
					onToggleFullscreen={toggleFullscreen}
				/>
				<ProgressSegments className="mt-1 stage:hidden" total={total} current={index} titles={titles} onSelect={goTo} />
			</div>

			<div
				ref={stageRef}
				onTouchStart={onTouchStart}
				onTouchEnd={onTouchEnd}
				className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-4 stage:items-center stage:justify-center stage:overflow-visible stage:pb-0"
			>
				<div
					className="stage-frame w-full overflow-x-clip stage:overflow-visible [&>div>article]:w-full!"
				>
					<AnimatePresence mode="wait" initial={false} custom={direction}>
						<motion.div
							key={slide.id}
							custom={direction}
							initial={reduceMotion ? false : { opacity: 0, x: direction * 24 }}
							animate={{ opacity: 1, x: 0 }}
							exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
							transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
						>
							<SlideRenderer slide={slide} />
						</motion.div>
					</AnimatePresence>
				</div>

				{notesOpen && (
					<aside
						aria-label={t("Speaker notes")}
						className="mx-3 mt-4 rounded-xl border border-violet-400/40 bg-violet-500/10 p-4 text-sm leading-relaxed text-fg stage:mx-auto stage:w-full stage:max-w-3xl"
					>
						<p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">{t("Speaker notes")}</p>
						{notes ? <p>{notes}</p> : <p className="text-fg-muted">{t("No notes for this slide.")}</p>}
					</aside>
				)}
			</div>

			<div className="pb-home-indicator shrink-0 border-t border-white/8 bg-ink-900/95 px-4 pt-3 backdrop-blur stage:flex stage:flex-col stage:items-center stage:gap-3 stage:border-0 stage:bg-transparent stage:p-0 stage:pb-1">
				<div className="hidden w-full stage:block">
					<ProgressIndicator total={total} current={index} titles={titles} onSelect={goTo} />
				</div>
				{isLast && <p className="mb-2 text-center text-xs text-fg-muted stage:order-last stage:mb-0">{t("Lesson complete. Continue to move on.")}</p>}
				<SlideNavigation
					index={index}
					total={total}
					onPrev={prev}
					onNext={next}
					finishLabel={t(nextLabel)}
				/>
				<p className="hidden text-[0.7rem] text-fg-muted stage:block">
					{t("Keys: ← → or Space to move, Home / End, N notes, F full screen, Esc to exit")}
				</p>
			</div>
		</div>
	);
}
