"use client";

import type { CardSpec } from "@/lib/lesson-types";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { EducationalCard } from "@/components/visuals/educational-card";
import { ArrowRight } from "lucide-react";

export type SummonMethod = "fusion" | "synchro" | "xyz" | "link" | "ritual" | "pendulum";

export interface SummoningDiagramProps {
	materials: CardSpec[];
	result?: CardSpec;
	method?: SummonMethod;
	label?: string;
	className?: string;
}

const METHOD_LABEL: Record<SummonMethod, string> = {
	fusion: "Fusion Summon",
	synchro: "Synchro Summon",
	xyz: "Xyz Summon",
	link: "Link Summon",
	ritual: "Ritual Summon",
	pendulum: "Pendulum Summon",
};

export function SummoningDiagram({ materials, result, method, label, className }: SummoningDiagramProps) {
	const { t } = useLanguage();
	const title = label ?? t(method ? METHOD_LABEL[method] : "Summon");
	return (
		<div
			className={cn("flex w-full flex-col items-center gap-4", className)}
			role="group"
			aria-label={`${title}: ${materials.map((m) => m.name).join(" + ")}${result ? ` → ${result.name}` : ""}`}
		>
			<p className="font-display text-sm uppercase tracking-[0.25em] text-gold-400">{title}</p>
			<div dir="ltr" className="flex flex-wrap items-center justify-center gap-3 stage:gap-5">
				<div className="flex flex-wrap items-center justify-center gap-2">
					{materials.map((card, i) => (
						<div key={`${card.name}-${i}`} className="flex items-center gap-2">
							{i > 0 && (
								<span aria-hidden className="font-display text-xl text-fg-muted">
									+
								</span>
							)}
							<EducationalCard card={card} size="sm" decorative />
						</div>
					))}
				</div>
				{result && (
					<>
						<span className="flex items-center gap-1 text-gold-400" aria-hidden>
							<ArrowRight className="h-6 w-6" />
						</span>
						<EducationalCard card={result} size="md" />
					</>
				)}
			</div>
		</div>
	);
}
