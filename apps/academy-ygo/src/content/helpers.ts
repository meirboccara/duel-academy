import type { CardSpec, LessonSlide, Lesson, SlideVisualConfig, SourceRef } from "@/lib/lesson-types";

/** Official sources shared by many lessons. */
export const SRC = {
	rulebook: { label: "Official Yu-Gi-Oh! Rulebook (Version 10)", url: "https://www.yugioh-card.com/en/rulebook/" },
	beginners: { label: "Konami — For Beginners", url: "https://www.yugioh-card.com/eu/forbeginners/" },
	demo: { label: "Konami — Demo Events", url: "https://www.yugioh-card.com/eu/event/demo-events/" },
	rulesFaq: { label: "Yu-Gi-Oh! Rule Book — Basic Rules", url: "https://www.yugioh-card.com/eu/play/rules/" },
} satisfies Record<string, SourceRef>;

/* Card factories: schematic cards with original names, no artwork. */

export const normalMonster = (name: string, level: number, atk: number, def: number, extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "normal", level, atk, def, attribute: "EARTH", monsterType: "Warrior / Normal", text: "Flavor text only. No effect.", ...extra,
});

export const effectMonster = (name: string, level: number, atk: number, def: number, extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "effect", level, atk, def, attribute: "DARK", monsterType: "Spellcaster / Effect", text: "Has an effect.", ...extra,
});

export const fusionMonster = (name: string, level: number, atk: number, def: number, extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "fusion", level, atk, def, attribute: "DARK", monsterType: "Dragon / Fusion / Effect", ...extra,
});

export const synchroMonster = (name: string, level: number, atk: number, def: number, extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "synchro", level, atk, def, attribute: "LIGHT", monsterType: "Warrior / Synchro / Effect", ...extra,
});

export const xyzMonster = (name: string, rank: number, atk: number, def: number, extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "xyz", rank, atk, def, attribute: "DARK", monsterType: "Machine / Xyz / Effect", ...extra,
});

export const linkMonster = (name: string, link: number, atk: number, arrows: CardSpec["arrows"], extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "link", link, atk, arrows, attribute: "LIGHT", monsterType: "Cyberse / Link / Effect", ...extra,
});

export const ritualMonster = (name: string, level: number, atk: number, def: number, extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "ritual", level, atk, def, attribute: "LIGHT", monsterType: "Warrior / Ritual / Effect", ...extra,
});

export const spell = (name: string, subtype: NonNullable<CardSpec["subtype"]> = "normal", extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "spell", subtype, ...extra,
});

export const trap = (name: string, subtype: NonNullable<CardSpec["subtype"]> = "normal", extra: Partial<CardSpec> = {}): CardSpec => ({
	name, kind: "trap", subtype, ...extra,
});

export const pendulum = (base: CardSpec, left: number, right: number, text?: string): CardSpec => ({
	...base, pendulum: { left, right, text },
});

export const facedown = (card: CardSpec, position: CardSpec["position"] = "facedown-defense"): CardSpec => ({ ...card, position });

/** Concise slide builder keeping content files short. */
export function slide<V extends SlideVisualConfig>(
	id: string,
	title: string,
	description: string,
	visual: V,
	alt: string,
	speakerNotes?: string,
): LessonSlide {
	return { id, type: visual.template, title, description, visual, alt, speakerNotes };
}

export function lesson(input: Omit<Lesson, "slides"> & { slides: LessonSlide[] }): Lesson {
	return input;
}
