"use client";

import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface ProgressSegmentsProps {
	total: number;
	current: number;
	titles?: string[];
	onSelect: (index: number) => void;
	className?: string;
}

/**
 * Phone progress: one thin segment per slide, filled up to the current one.
 * Each segment is a tall, invisible tap target so the strip stays thin but easy to hit.
 */
export function ProgressSegments({ total, current, titles, onSelect, className }: ProgressSegmentsProps) {
	const { t } = useLanguage();
	return (
		<ol className={cn("flex w-full items-center gap-1", className)} aria-label={t("Slides")}>
			{Array.from({ length: total }).map((_, i) => {
				const on = i === current;
				return (
					<li key={i} className="min-w-0 flex-1">
						<button
							type="button"
							onClick={() => onSelect(i)}
							aria-label={`${t("Go to slide")} ${i + 1}${titles?.[i] ? `: ${titles[i]}` : ""}`}
							aria-current={on ? "step" : undefined}
							className="flex h-5 w-full items-center rounded-sm"
						>
							<span
								className={cn(
									"block h-[3px] w-full rounded-full transition-colors duration-300",
									on ? "bg-gold-400 shadow-[0_0_8px_rgba(240,196,90,0.8)]" : i < current ? "bg-gold-500/70" : "bg-white/15",
								)}
							/>
						</button>
					</li>
				);
			})}
		</ol>
	);
}
