import type { DuelFieldVisual, LessonSlide } from "@/lib/lesson-types";
import { DuelField } from "@/components/visuals/duel-field";
import { SlideShell } from "@/components/slides/slide-shell";

export function DuelFieldSlide({ slide }: { slide: LessonSlide & { visual: DuelFieldVisual } }) {
	const { visual } = slide;
	return (
		<SlideShell title={slide.title} description={slide.description} alt={slide.alt}>
			<div className="w-full max-w-4xl">
				<DuelField
					highlight={visual.highlight}
					cards={visual.cards}
					arrows={visual.arrows}
					half={visual.half}
					hand={visual.showHand}
					labelAll={visual.labelAll}
					linkedZones={visual.linkedZones}
					callout={visual.callout}
				/>
			</div>
		</SlideShell>
	);
}
