import { describe, expect, it } from "vitest";
import { QUIZ_QUESTIONS, SORT_CARDS, checkQuizAnswer, checkSortAnswer } from "./mission1";

describe("mission 1 answers", () => {
	it("has six cards to sort and three quiz questions", () => {
		expect(SORT_CARDS).toHaveLength(6);
		expect(QUIZ_QUESTIONS).toHaveLength(3);
	});

	it("accepts the right kind for a card and rejects the others", () => {
		expect(checkSortAnswer("pocket-cub", "monster")).toBe(true);
		expect(checkSortAnswer("pocket-cub", "spell")).toBe(false);
		expect(checkSortAnswer("pocket-cub", "trap")).toBe(false);
		expect(checkSortAnswer("spark-dash", "spell")).toBe(true);
		expect(checkSortAnswer("fog-snare", "trap")).toBe(true);
		expect(checkSortAnswer("fog-snare", "monster")).toBe(false);
	});

	it("treats an unknown card as wrong", () => {
		expect(checkSortAnswer("nope", "monster")).toBe(false);
	});

	it("accepts exactly one option per quiz question", () => {
		expect(checkQuizAnswer("trap-first", "b")).toBe(true);
		expect(checkQuizAnswer("trap-first", "a")).toBe(false);
		expect(checkQuizAnswer("atk", "a")).toBe(true);
		expect(checkQuizAnswer("atk", "c")).toBe(false);
		expect(checkQuizAnswer("spell-now", "c")).toBe(true);
		expect(checkQuizAnswer("spell-now", "b")).toBe(false);
		expect(checkQuizAnswer("nope", "a")).toBe(false);
	});
});
