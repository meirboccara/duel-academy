import type { Tone } from "@/lib/lesson-types";

export const TONE_CHIP: Record<Tone, string> = {
	gold: "border-gold-400/60 bg-gold-500/15 text-gold-400",
	blue: "border-arcane-400/60 bg-arcane-500/15 text-arcane-300",
	purple: "border-violet-400/60 bg-violet-500/15 text-violet-400",
	green: "border-spell/60 bg-spell/15 text-[#7ddea8]",
	red: "border-ember-400/60 bg-ember-500/15 text-ember-400",
	white: "border-white/40 bg-white/10 text-fg",
};

export const TONE_TEXT: Record<Tone, string> = {
	gold: "text-gold-400",
	blue: "text-arcane-300",
	purple: "text-violet-400",
	green: "text-[#7ddea8]",
	red: "text-ember-400",
	white: "text-fg",
};
