"use client";

import type { CardSpec, LessonSlide, SequenceVisual } from "@/lib/lesson-types";
import { EducationalCard } from "@/components/visuals/educational-card";
import { LifePoints } from "@/components/visuals/life-points";
import { SummoningDiagram } from "@/components/visuals/summoning-diagram";
import { useLanguage } from "@/lib/i18n/provider";
import { SlideShell } from "@/components/slides/slide-shell";
import { ArrowDown, ArrowRight } from "lucide-react";

function Row({ label, cards, emptySlots }: { label: string; cards?: (CardSpec | null)[]; emptySlots?: number }) {
	const slots = cards ?? Array.from({ length: emptySlots ?? 0 }, () => null);
	if (!slots.length) return null;
	return (
		<div className="flex flex-col items-center gap-2">
			<span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">{label}</span>
			<div className="flex flex-wrap items-end justify-center gap-2">
				{slots.map((card, i) =>
					card ? (
						<EducationalCard key={`${card.name}-${i}`} card={card} size="sm" decorative />
					) : (
						<div
							key={`empty-${i}`}
							aria-hidden
							className="h-[7.5em] w-[5.2em] rounded-md border border-dashed border-white/20 bg-white/5"
							style={{ fontSize: "6.5px" }}
						/>
					),
				)}
			</div>
		</div>
	);
}

export function SequenceSlide({ slide }: { slide: LessonSlide & { visual: SequenceVisual } }) {
	const { t } = useLanguage();
	const { visual } = slide;
	const { scene } = visual;
	const materialsToResult = visual.motion === "materials-to-result" && scene.materials && scene.result;

	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			<div className="flex w-full flex-col items-center gap-4">
				<div className="flex max-w-full items-center gap-3 rounded-2xl border border-gold-400/40 bg-gold-500/10 px-4 py-1.5 stage:rounded-full">
					<span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gold-400">
						{t("Step")} {visual.step} / {visual.of}
					</span>
					<span className="text-sm font-semibold text-fg">{visual.action}</span>
				</div>

				{scene.lifePoints && <LifePoints you={scene.lifePoints[0]} opponent={scene.lifePoints[1]} size="md" />}

				{materialsToResult ? (
					<SummoningDiagram materials={scene.materials!} result={scene.result} label={visual.action} />
				) : (
					<div className="flex w-full flex-col items-center gap-5">
						{scene.hand && <Row label={t("Hand")} cards={scene.hand} />}
						{visual.motion === "hand-to-field" && <ArrowDown className="h-5 w-5 text-gold-400" aria-hidden />}
						{scene.monsters && <Row label={t("Monsters")} cards={scene.monsters} />}
						{scene.spellTraps && <Row label={t("Spells / Traps")} cards={scene.spellTraps} />}
						{(visual.motion === "field-to-graveyard" || visual.motion === "to-banished" || visual.motion === "to-extra") && (
							<div className="flex items-center gap-2 text-gold-400">
								<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
								<span className="text-xs font-bold uppercase tracking-wider">
									{visual.motion === "field-to-graveyard"
										? t("To Graveyard")
										: visual.motion === "to-banished"
											? t("Banished")
											: t("Extra Deck")}
								</span>
							</div>
						)}
						{scene.graveyard && <Row label={t("Graveyard")} cards={scene.graveyard} />}
						{scene.materials && scene.result && (
							<SummoningDiagram materials={scene.materials} result={scene.result} label={visual.action} />
						)}
						{scene.extra?.map((block) => (
							<Row key={block.label} label={block.label} cards={block.cards} />
						))}
						{visual.motion === "flip" && <p className="text-sm font-semibold text-arcane-300">{t("Flip — face-down → face-up")}</p>}
					</div>
				)}
			</div>
		</SlideShell>
	);
}
