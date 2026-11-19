"use client";

import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, StickyNote } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface PresentationToolbarProps {
	chapterLabel: string;
	lessonTitle: string;
	notesAvailable: boolean;
	notesOpen: boolean;
	onToggleNotes: () => void;
	fullscreen: boolean;
	onToggleFullscreen: () => void;
	className?: string;
}

const btn =
	"inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 text-sm text-fg transition-colors hover:bg-white/10 aria-pressed:border-gold-400 aria-pressed:text-gold-400 sm:h-auto sm:px-3 sm:py-1.5";

export function PresentationToolbar({
	chapterLabel,
	lessonTitle,
	notesAvailable,
	notesOpen,
	onToggleNotes,
	fullscreen,
	onToggleFullscreen,
	className,
}: PresentationToolbarProps) {
	const { t } = useLanguage();
	return (
		<div className={cn("flex w-full items-center justify-between gap-3", className)}>
			<div className="flex min-w-0 items-center gap-3">
				<Link href="/academy" className={btn} aria-label={t("Back to the Academy")}>
					<ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
					<span className="hidden sm:inline">{t("Academy")}</span>
				</Link>
				<div className="min-w-0">
					<p className="truncate text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-400 sm:text-[0.65rem] sm:tracking-[0.2em]">
						{chapterLabel}
					</p>
					<p className="truncate font-display text-[0.95rem] text-fg sm:text-sm">{lessonTitle}</p>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<LanguageSwitcher />
				{notesAvailable && (
					<button type="button" className={btn} aria-pressed={notesOpen} onClick={onToggleNotes}>
						<StickyNote className="h-4 w-4" aria-hidden />
						<span className="hidden sm:inline">{t("Notes")}</span>
					</button>
				)}
				<button
					type="button"
					className={btn}
					aria-pressed={fullscreen}
					onClick={onToggleFullscreen}
					aria-label={fullscreen ? t("Exit full screen") : t("Enter full screen")}
				>
					{fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
					<span className="hidden sm:inline">{fullscreen ? t("Exit") : t("Full screen")}</span>
				</button>
			</div>
		</div>
	);
}
