import type { LessonSlide } from "@/lib/lesson-types";
import { IllustrationSlide } from "@/components/slides/illustration-slide";
import { CardAnatomySlide } from "@/components/slides/card-anatomy-slide";
import { DuelFieldSlide } from "@/components/slides/duel-field-slide";
import { TimelineSlide } from "@/components/slides/timeline-slide";
import { SequenceSlide } from "@/components/slides/sequence-slide";
import { ComparisonSlide } from "@/components/slides/comparison-slide";
import { NumericSlide } from "@/components/slides/numeric-slide";

export function SlideRenderer({ slide }: { slide: LessonSlide }) {
	switch (slide.visual.template) {
		case "illustration":
			return <IllustrationSlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "illustration" }> }} />;
		case "card-anatomy":
			return <CardAnatomySlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "card-anatomy" }> }} />;
		case "duel-field":
			return <DuelFieldSlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "duel-field" }> }} />;
		case "timeline":
			return <TimelineSlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "timeline" }> }} />;
		case "sequence":
			return <SequenceSlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "sequence" }> }} />;
		case "comparison":
			return <ComparisonSlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "comparison" }> }} />;
		case "numeric":
			return <NumericSlide slide={slide as LessonSlide & { visual: Extract<LessonSlide["visual"], { template: "numeric" }> }} />;
		default: {
			const _exhaustive: never = slide.visual;
			void _exhaustive;
			return null;
		}
	}
}
