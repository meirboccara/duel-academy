import type { IllustrationVisual, LessonSlide } from "@/lib/lesson-types";
import { EducationalCard } from "@/components/visuals/educational-card";
import { LifePoints } from "@/components/visuals/life-points";
import { SlideShell } from "@/components/slides/slide-shell";
import { TONE_CHIP } from "@/components/visuals/tone";
import { cn } from "@/lib/cn";
import {
	BookOpen,
	Coins,
	Crown,
	Gavel,
	Layers,
	Scale,
	Shield,
	Shuffle,
	Swords,
	Trophy,
	Users,
	Sparkles,
} from "lucide-react";

const MOTIF_ICON: Record<NonNullable<IllustrationVisual["motif"]>, typeof Swords> = {
	duelists: Users,
	decks: Layers,
	"life-points": Shield,
	victory: Trophy,
	"draw-loss": BookOpen,
	"cards-three": Sparkles,
	curriculum: BookOpen,
	welcome: Crown,
	scales: Scale,
	tribute: Swords,
	shuffle: Shuffle,
	coin: Coins,
	judge: Gavel,
	match: Trophy,
};

export function IllustrationSlide({ slide }: { slide: LessonSlide & { visual: IllustrationVisual } }) {
	const { visual } = slide;
	const Motif = visual.motif ? MOTIF_ICON[visual.motif] : Sparkles;
	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			<div className="flex w-full flex-col items-center gap-5 stage:gap-6">
				{visual.motif && (
					<div className="flex h-16 w-16 items-center justify-center rounded-full border border-arcane-400/40 bg-arcane-500/15 text-arcane-300 stage:h-24 stage:w-24">
						<Motif className="h-8 w-8 stage:h-12 stage:w-12" aria-hidden />
					</div>
				)}
				{visual.lifePoints && <LifePoints you={visual.lifePoints[0]} opponent={visual.lifePoints[1]} size="md" />}
				{visual.cards && visual.cards.length > 0 && (
					<div className="flex flex-wrap items-end justify-center gap-4">
						{visual.cards.map((card, i) => (
							<EducationalCard key={`${card.name}-${i}`} card={card} size="md" />
						))}
					</div>
				)}
				{visual.chips && visual.chips.length > 0 && (
					<ul className="flex flex-wrap justify-center gap-2">
						{visual.chips.map((chip) => (
							<li
								key={chip.label}
								className={cn("rounded-full border px-3 py-1 text-sm font-semibold", TONE_CHIP[chip.tone ?? "gold"])}
							>
								{chip.label}
							</li>
						))}
					</ul>
				)}
			</div>
		</SlideShell>
	);
}
