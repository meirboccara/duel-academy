import { describe, expect, it } from "vitest";
import { extractTranslatedLiterals } from "@/lib/i18n/extract-ui-strings";

describe("extractTranslatedLiterals", () => {
	it("finds string literals passed to t(), in any quote style", () => {
		const source = `
			<span>{t("Speaker notes")}</span>
			<p>{t('Lesson complete.')}</p>
			<p>{t(\`No notes for this slide.\`)}</p>
		`;
		expect(extractTranslatedLiterals(source)).toEqual(["Speaker notes", "Lesson complete.", "No notes for this slide."]);
	});

	it("finds a literal in either branch of a conditional", () => {
		expect(extractTranslatedLiterals(`{open ? t("Exit full screen") : t("Enter full screen")}`)).toEqual(["Exit full screen", "Enter full screen"]);
	});

	it("keeps escaped quotes and unicode", () => {
		expect(extractTranslatedLiterals(String.raw`t("Say \"hi\" →")`)).toEqual(['Say "hi" →']);
	});

	it("ignores dynamic arguments, other functions that end in t, and member calls", () => {
		const source = `t(label.part) t(nextLabel) set("x") split("a") obj.t("nope") t(\`a \${b}\`)`;
		expect(extractTranslatedLiterals(source)).toEqual([]);
	});

	it("ignores comments and decodes literal escapes across multiline calls", () => {
		expect(extractTranslatedLiterals('// t("not a call")\n t /* note */ ("Line\\nTwo")')).toEqual(["Line\nTwo"]);
	});

	it("takes the first argument only", () => {
		expect(extractTranslatedLiterals(`t("Rank", "ignored")`)).toEqual(["Rank"]);
	});
});
