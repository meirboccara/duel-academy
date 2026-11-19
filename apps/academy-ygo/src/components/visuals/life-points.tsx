"use client";

import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export interface LifePointsProps {
	you: number;
	opponent?: number;
	labels?: [string, string];
	className?: string;
	size?: "md" | "lg";
}

function Counter({
	value,
	label,
	tone,
	size,
}: {
	value: number;
	label: string;
	tone: "gold" | "ember";
	size: "md" | "lg";
}) {
	const { t } = useLanguage();
	return (
		<div
			className={cn(
				"flex flex-col items-center rounded-xl border px-3 py-2.5 shadow-lg stage:rounded-2xl stage:px-6 stage:py-4",
				tone === "gold"
					? "border-gold-400/50 bg-gradient-to-b from-gold-500/20 to-ink-900/80"
					: "border-ember-400/50 bg-gradient-to-b from-ember-500/20 to-ink-900/80",
				size === "lg" ? "min-w-[8rem] stage:min-w-[10rem]" : "min-w-[6.5rem] stage:min-w-[8rem]",
			)}
		>
			<span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-fg-muted stage:text-xs stage:tracking-[0.2em]">{label}</span>
			<span
				className={cn(
					"font-display tabular-nums leading-none",
					size === "lg" ? "text-4xl stage:text-6xl" : "text-3xl stage:text-4xl",
					tone === "gold" ? "text-gold-400" : "text-ember-400",
				)}
			>
				{value.toLocaleString()}
			</span>
			<span className="mt-1 text-[0.6rem] uppercase tracking-wider text-fg-muted stage:text-[0.7rem]">{t("Life Points")}</span>
		</div>
	);
}

export function LifePoints({ you, opponent, labels, className, size = "lg" }: LifePointsProps) {
	const { t } = useLanguage();
	const names = labels ?? [t("You"), t("Opponent")];
	const dual = opponent !== undefined;
	return (
		<div
			dir="ltr"
			className={cn("flex flex-wrap items-center justify-center gap-2 stage:gap-6", className)}
			role="group"
			aria-label={dual ? `${t("Life Points")}: ${names[0]} ${you}, ${names[1]} ${opponent}` : `${t("Life Points")}: ${you}`}
		>
			<Counter value={you} label={names[0]} tone="gold" size={size} />
			{dual && (
				<>
					<span aria-hidden className="font-display text-lg text-fg-muted stage:text-2xl">
						{t("vs")}
					</span>
					<Counter value={opponent} label={names[1]} tone="ember" size={size} />
				</>
			)}
		</div>
	);
}
