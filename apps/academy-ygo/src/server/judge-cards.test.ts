import { describe, expect, it } from "vitest";
import { likePattern, printedNumber } from "./judge-cards";

describe("reading YGOProJudge's card list", () => {
	it("finds a card by the number printed on it, leading zero and spaces included", () => {
		expect(printedNumber("05318639")).toBe(5318639);
		expect(printedNumber("0531 8639")).toBe(5318639);
		expect(printedNumber("Mystical")).toBeNull();
		expect(printedNumber("12")).toBeNull();
	});

	it("treats % and _ typed in the search box as letters", () => {
		expect(likePattern(" 100%_ ")).toBe("%100\\%\\_%");
	});
});
