import { describe, expect, it } from "vitest";
import { type SourceRecord, validateSource } from "../src";

const cardText: SourceRecord = {
	id: "text",
	kind: "card-text",
	cid: 4041,
	url: "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4041&request_locale=en",
	read: "2026-11-23",
	quote: "The ultimate wizard in terms of attack and defense.",
};

describe("validateSource: every test cites one well-formed source record", () => {
	it("accepts a card text, a TCG rule and a Japanese Q&A that carry what they need", () => {
		expect(validateSource(cardText)).toEqual([]);
		expect(
			validateSource({ id: "psct", kind: "tcg-rule", url: "https://www.yugioh-card.com/en/play/psct/", read: "2026-11-22", quote: "A colon (:) means that what comes before it is an activation condition" }),
		).toEqual([]);
		expect(
			validateSource({ id: "qa-1", kind: "jp-qa", cid: 4041, fid: 12345, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=12345", read: "2026-11-22", quote: "「ブラック・マジシャン」は通常モンスターです。" }),
		).toEqual([]);
	});
	it("accepts a page of the official OCG rulebook, which is about no card", () => {
		const page: SourceRecord = { id: "ocg-rulebook", kind: "ocg-rule", url: "https://www.yugioh-card.com/japan/howto/data/rulebook_masterrule20200401_ver1.0.pdf", read: "2026-11-25", quote: "基本的に、その他のカードはカウンター罠以外は発動できません。" };
		expect(validateSource(page)).toEqual([]);
	});
	it("needs the Konami card id for card text, and the Q&A id too for a Japanese ruling", () => {
		const { cid: _cid, ...noCid } = cardText;
		expect(validateSource(noCid)).toEqual(["cid-missing"]);
		expect(validateSource({ ...cardText, kind: "jp-qa" })).toEqual(["fid-missing"]);
	});
	it("needs a real date read and a quote", () => {
		expect(validateSource({ ...cardText, read: "2026-13-40" })).toEqual(["read-invalid"]);
		expect(validateSource({ ...cardText, read: "23/11/2026" })).toEqual(["read-invalid"]);
		expect(validateSource({ ...cardText, quote: "  " })).toEqual(["quote-missing"]);
	});
	it("only cites Konami's own pages, never an aggregator", () => {
		expect(validateSource({ ...cardText, url: "https://db.ygoresources.com/data/card/4041" })).toEqual(["url-not-konami"]);
		expect(validateSource({ ...cardText, url: "http://www.db.yugioh-card.com/x" })).toEqual(["url-not-konami"]);
		expect(validateSource({ ...cardText, url: "not a url" })).toEqual(["url-not-konami"]);
	});
});
