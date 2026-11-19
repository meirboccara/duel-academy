import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { STORY_IDS } from "./flow";
import { CARD_KINDS, OPTION_IDS, QUIZ_IDS, SORT_IDS } from "./mission1";
import { COPY } from "./mission1-copy";

describe("mission 1 copy", () => {
	it.each(LOCALES)("has complete, non-empty %s text for every step, card, option and explanation", (locale) => {
		const copy = COPY[locale];
		const strings: string[] = [
			copy.pageTitle, copy.kicker, copy.introText, copy.masteredNote, copy.start, copy.next, copy.sortPrompt,
			copy.level, copy.atk, copy.def, copy.right, copy.notYet, copy.tryAgain, copy.calm, copy.calmHint, copy.calmDevice,
			copy.badgeTitle, copy.badgeText, copy.badgeArt, copy.replay, copy.back,
			copy.storyStep(1, 6), copy.sortStep(1, 6), copy.quizStep(1, 3),
			...CARD_KINDS.map((kind) => copy.kinds[kind]),
			...STORY_IDS.flatMap((id) => [copy.story[id].title, copy.story[id].text, copy.story[id].art]),
			...SORT_IDS.flatMap((id) => [copy.cards[id].name, copy.cards[id].text, ...CARD_KINDS.map((kind) => copy.cards[id].explain[kind])]),
			...QUIZ_IDS.flatMap((id) => [copy.quiz[id].question, ...OPTION_IDS.flatMap((option) => [copy.quiz[id].options[option].text, copy.quiz[id].options[option].explain])]),
		];
		for (const text of strings) expect(text.trim().length).toBeGreaterThan(0);
		expect(STORY_IDS).toHaveLength(6);
	});

	it("keeps French and Hebrew actually translated", () => {
		expect(COPY.fr.cards["pocket-cub"].name).not.toBe(COPY.en.cards["pocket-cub"].name);
		expect(COPY.he.story.cub.text).toMatch(/[\u0590-\u05FF]/);
		expect(COPY.he.quiz.atk.question).toMatch(/[\u0590-\u05FF]/);
	});
});
