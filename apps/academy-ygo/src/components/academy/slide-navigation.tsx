"use client";

import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface SlideNavigationProps {
	index: number;
	total: number;
	onPrev: () => void;
	onNext: () => void;
	/** Label for the final-slide action, e.g. "Next lesson". */
	finishLabel?: string;
	className?: string;
}

/*
 * Phone: a thumb dock — round Previous, the count, and a wide Next that fills the rest.
 * Desktop: two pills around the count.
 */
const base =
	"inline-flex h-12 items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 stage:h-auto stage:px-5 stage:py-2.5";

export function SlideNavigation({ index, total, onPrev, onNext, finishLabel, className }: SlideNavigationProps) {
	const { t } = useLanguage();
	const last = index >= total - 1;
	return (
		<nav aria-label={t("Slide navigation")} className={cn("mx-auto flex w-full max-w-lg items-center gap-3 stage:w-auto stage:max-w-none stage:justify-center stage:gap-4", className)}>
			<button
				type="button"
				onClick={onPrev}
				disabled={index <= 0}
				aria-label={t("Previous slide")}
				className={cn(base, "w-12 shrink-0 border-white/20 bg-white/5 text-fg hover:bg-white/10 stage:w-auto")}
			>
				<ChevronLeft className="h-5 w-5 rtl:rotate-180 stage:h-4 stage:w-4" aria-hidden />
				<span className="hidden stage:inline">{t("Previous")}</span>
			</button>
			<span className="min-w-[3.5rem] text-center text-sm tabular-nums text-fg-muted stage:min-w-[5rem]" aria-live="polite">
				{index + 1} / {total}
			</span>
			<button
				type="button"
				onClick={onNext}
				className={cn(
					base,
					"min-w-0 flex-1 border-gold-400 bg-gold-500 px-4 text-base text-ink-950 shadow-[0_6px_24px_rgba(212,160,23,0.35)] hover:bg-gold-400 stage:flex-none stage:text-sm stage:shadow-none",
				)}
			>
				{last ? (
					<>
						<span className="truncate">{finishLabel ?? t("Finish")}</span> <Check className="h-4 w-4 shrink-0" aria-hidden />
					</>
				) : (
					<>
						{t("Next")} <ChevronRight className="h-5 w-5 rtl:rotate-180 stage:h-4 stage:w-4" aria-hidden />
					</>
				)}
			</button>
		</nav>
	);
}
