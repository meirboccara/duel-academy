"use client";

import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface ProgressIndicatorProps {
	total: number;
	current: number;
	titles?: string[];
	onSelect: (index: number) => void;
	className?: string;
}

export function ProgressIndicator({ total, current, titles, onSelect, className }: ProgressIndicatorProps) {
	const { t } = useLanguage();
	const percent = total <= 1 ? 100 : Math.round((current / (total - 1)) * 100);
	return (
		<div className={cn("flex w-full flex-col items-center gap-2", className)}>
			<div
				role="progressbar"
				aria-label={t("Lesson progress")}
				aria-valuemin={1}
				aria-valuemax={total}
				aria-valuenow={current + 1}
				className="h-1 w-full max-w-3xl overflow-hidden rounded-full bg-white/10"
			>
				<div
					className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-[width] duration-300"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<ol className="flex flex-wrap items-center justify-center gap-1.5" aria-label={t("Slides")}>
				{Array.from({ length: total }).map((_, i) => {
					const on = i === current;
					return (
						<li key={i}>
							<button
								type="button"
								onClick={() => onSelect(i)}
								aria-label={`${t("Go to slide")} ${i + 1}${titles?.[i] ? `: ${titles[i]}` : ""}`}
								aria-current={on ? "step" : undefined}
								title={titles?.[i]}
								className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-2"
							>
								<span
									className={cn(
										"block rounded-full transition-all",
										on ? "h-3 w-3 bg-gold-400 shadow-[0_0_10px_rgba(240,196,90,0.7)]" : i < current ? "h-2 w-2 bg-gold-600" : "h-2 w-2 bg-white/25",
									)}
								/>
							</button>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
