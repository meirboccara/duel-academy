import { QUIZ_QUESTIONS, SORT_CARDS, type QuizId, type SortId } from "./mission1";

export const STORY_IDS = ["cub", "stats", "level", "spark", "chameleon", "recap"] as const;
export type StoryId = (typeof STORY_IDS)[number];

export type Step =
	| { kind: "intro" }
	| { kind: "story"; id: StoryId; number: number; total: number }
	| { kind: "sort"; cardId: SortId; number: number; total: number }
	| { kind: "quiz"; questionId: QuizId; number: number; total: number }
	| { kind: "badge" };

/** The whole mission in order: intro, story pages, card sort, quiz, badge. */
export const STEPS: readonly Step[] = [
	{ kind: "intro" },
	...STORY_IDS.map((id, index): Step => ({ kind: "story", id, number: index + 1, total: STORY_IDS.length })),
	...SORT_CARDS.map((card, index): Step => ({ kind: "sort", cardId: card.id, number: index + 1, total: SORT_CARDS.length })),
	...QUIZ_QUESTIONS.map((question, index): Step => ({ kind: "quiz", questionId: question.id, number: index + 1, total: QUIZ_QUESTIONS.length })),
	{ kind: "badge" },
];
export const LAST_STEP = STEPS.length - 1;
