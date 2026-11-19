/** Language-free facts of Junior Mission 1: which card is which kind, which quiz option is right. */
export const CARD_KINDS = ["monster", "spell", "trap"] as const;
export type CardKind = (typeof CARD_KINDS)[number];

export const SORT_IDS = ["pocket-cub", "spark-dash", "fog-snare", "moss-beetle", "glow-charm", "sticky-vine"] as const;
export type SortId = (typeof SORT_IDS)[number];

export interface SortCard {
	id: SortId;
	kind: CardKind;
	/** Only Monsters show Level, ATK and DEF. */
	stats?: { level: number; atk: number; def: number };
}

export const SORT_CARDS: readonly SortCard[] = [
	{ id: "pocket-cub", kind: "monster", stats: { level: 3, atk: 1200, def: 800 } },
	{ id: "spark-dash", kind: "spell" },
	{ id: "fog-snare", kind: "trap" },
	{ id: "moss-beetle", kind: "monster", stats: { level: 4, atk: 1000, def: 1800 } },
	{ id: "glow-charm", kind: "spell" },
	{ id: "sticky-vine", kind: "trap" },
];

export function checkSortAnswer(cardId: string, kind: CardKind): boolean {
	return SORT_CARDS.some((card) => card.id === cardId && card.kind === kind);
}

export const OPTION_IDS = ["a", "b", "c"] as const;
export type OptionId = (typeof OPTION_IDS)[number];

export const QUIZ_IDS = ["trap-first", "atk", "spell-now"] as const;
export type QuizId = (typeof QUIZ_IDS)[number];

export interface QuizQuestion {
	id: QuizId;
	correct: OptionId;
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
	{ id: "trap-first", correct: "b" },
	{ id: "atk", correct: "a" },
	{ id: "spell-now", correct: "c" },
];

export function checkQuizAnswer(questionId: string, option: OptionId): boolean {
	return QUIZ_QUESTIONS.some((question) => question.id === questionId && question.correct === option);
}
