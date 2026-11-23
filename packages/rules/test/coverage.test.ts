import { describe, expect, it } from "vitest";
import { type CardSources, coverage, type SourceRecord } from "../src";

const read = "2026-11-23";
const db = (cid: number, lang = "en") => `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cid}&request_locale=${lang}`;

/** A made-up card with one printed effect and two rulings, one of them pending. */
const pot: CardSources = {
	code: "pot",
	cid: 4844,
	french: { text: "Piochez 2 cartes.", url: db(4844, "fr"), read },
	sources: [
		{ id: "draw", kind: "card-text", cid: 4844, url: db(4844), read, quote: "Draw 2 cards." },
		{ id: "qa-chain", kind: "jp-qa", cid: 4844, fid: 1, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=1", read, quote: "チェーンできます。" },
		{ id: "qa-other", kind: "jp-qa", cid: 4844, fid: 2, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=2", read, quote: "別のカードとの裁定。" },
	],
	effects: ["draw"],
	rulings: [{ source: "qa-chain" }, { source: "qa-other", pending: "needs a card Academy doesn't have yet" }],
};
const file = (text: string) => ({ path: "test/pot.test.ts", text });
const fullTests = file(`it(\`\${cites("pot", "draw")} draws two\`); it(\`\${cites("pot", "qa-chain")} can be chained to\`);`);

describe("coverage: the definition of done, checked over cards and their tests", () => {
	it("passes a card whose every printed effect and listed ruling has a citing test, and lists pending rulings apart", () => {
		expect(coverage([pot], [fullTests])).toEqual({ gaps: [], pending: [{ card: "pot", source: "qa-other", reason: "needs a card Academy doesn't have yet" }] });
	});
	it("reports an effect or a ruling no test cites", () => {
		const { gaps } = coverage([pot], [file(`it(\`\${cites("pot", "qa-chain")} x\`)`)]);
		expect(gaps).toEqual([{ card: "pot", problem: "effect-untested", source: "draw" }]);
		expect(coverage([pot], [file(`it(\`\${cites("pot", "draw")} x\`)`)]).gaps).toEqual([{ card: "pot", problem: "ruling-untested", source: "qa-chain" }]);
	});
	it("does not count a pending ruling as covered, even when a test cites it", () => {
		const { pending } = coverage([pot], [file(`${fullTests.text} it(\`\${cites("pot", "qa-other")} x\`)`)]);
		expect(pending).toHaveLength(1);
	});
	it("reports a printed part that waits for a later step as pending, never as covered, even when a test cites it", () => {
		const partial: CardSources = { ...pot, sources: [...pot.sources, { id: "column", kind: "card-text", cid: 4844, url: db(4844), read, quote: "...in this column are negated." }], deferred: [{ source: "column", step: 7, reason: "columns" }] };
		const withCitation = file(`${fullTests.text} it(\`\${cites("pot", "column")} x\`)`);
		expect(coverage([partial], [fullTests]).gaps).toEqual([]);
		expect(coverage([partial], [withCitation]).pending).toEqual([
			{ card: "pot", source: "column", reason: "step 7: columns" },
			{ card: "pot", source: "qa-other", reason: "needs a card Academy doesn't have yet" },
		]);
	});
	it("reports a deferred part that is also listed as an effect, or that names no source", () => {
		const both: CardSources = { ...pot, deferred: [{ source: "draw", step: 6, reason: "x" }] };
		expect(coverage([both], [fullTests]).gaps).toEqual([{ card: "pot", problem: "deferred-and-covered", source: "draw" }]);
		const unknown: CardSources = { ...pot, deferred: [{ source: "ghost", step: 6, reason: "x" }] };
		expect(coverage([unknown], [fullTests]).gaps).toEqual([{ card: "pot", problem: "unknown-source", source: "ghost" }]);
	});
	it("reports missing French text", () => {
		const { french: _french, ...noFrench } = pot;
		expect(coverage([noFrench], [fullTests]).gaps).toEqual([{ card: "pot", problem: "french-missing" }]);
	});
	it("reports a test that cites an unknown card or source, with its file", () => {
		const gaps = coverage([pot], [fullTests, file(`it(\`\${cites("pot", "typo")} \${cites("ghost", "draw")} x\`)`)]).gaps;
		expect(gaps).toEqual([
			{ card: "pot", problem: "unknown-citation", source: "typo", file: "test/pot.test.ts" },
			{ card: "ghost", problem: "unknown-citation", source: "draw", file: "test/pot.test.ts" },
		]);
	});
	it("only counts citations in the titles of tests that run: not skipped, not todo, not in comments or bodies", () => {
		for (const text of [
			`it.skip(\`\${cites("pot", "draw")} x\`); it(\`\${cites("pot", "qa-chain")} y\`)`,
			`it.todo(\`\${cites("pot", "draw")} x\`); test(\`\${cites("pot", "qa-chain")} y\`)`,
			`xit(\`\${cites("pot", "draw")} x\`); it(\`\${cites("pot", "qa-chain")} y\`)`,
			`// it(\`\${cites("pot", "draw")} x\`)\nit(\`\${cites("pot", "qa-chain")} y\`)`,
			`it("no citation", () => { cites("pot", "draw"); }); it(\`\${cites("pot", "qa-chain")} y\`)`,
		]) {
			expect(coverage([pot], [file(text)]).gaps).toEqual([{ card: "pot", problem: "effect-untested", source: "draw" }]);
		}
		expect(coverage([pot], [file(`it.only(\`\${cites("pot", "draw")} x\`); test(\`\${cites("pot", "qa-chain")} y\`)`)]).gaps).toEqual([]);
	});
	it("reports a citation it cannot read, because its card and source must be written as literals", () => {
		expect(coverage([pot], [file(`${fullTests.text} it(\`\${cites(CODE, "draw")} x\`)`)]).gaps).toEqual([{ card: "?", problem: "citation-unreadable", file: "test/pot.test.ts" }]);
	});
	it("checks the French text's Konami page and date read", () => {
		const gaps = coverage([{ ...pot, french: { text: "Piochez 2 cartes.", url: "https://db.ygoresources.com/data/card/4844", read: "someday" } }], [fullTests]).gaps;
		expect(gaps).toEqual([{ card: "pot", problem: "french-invalid", details: ["read-invalid", "url-not-konami"] }]);
	});
	it("reports a source that points at another card, and a source id used twice", () => {
		const other = { ...pot, sources: pot.sources.map((s) => (s.id === "draw" ? { ...s, cid: 4041 } : s)) };
		expect(coverage([other], [fullTests]).gaps).toEqual([{ card: "pot", problem: "source-other-card", source: "draw" }]);
		const twice = { ...pot, sources: [...pot.sources, { ...pot.sources[1]!, fid: 3 }] };
		expect(coverage([twice], [fullTests]).gaps).toEqual([{ card: "pot", problem: "duplicate-source", source: "qa-chain" }]);
	});
	it("checks a rule recorded twice for being well formed too, and refuses a card whose code is the rules' own", () => {
		const rule = { id: "open", kind: "tcg-rule" as const, url: "https://www.yugioh-card.com/en/play/fast-effect-timing/", read, quote: "open game state" };
		const ruleTest = file(`it(\`\${cites("rules", "open")} x\`)`);
		const gaps = coverage([], [ruleTest], [rule, { ...rule, url: "https://yugipedia.com/x" }]).gaps;
		expect(gaps).toEqual([
			{ card: "rules", problem: "duplicate-source", source: "open" },
			{ card: "rules", problem: "source-invalid", source: "open", details: ["url-not-konami"] },
		]);
		expect(coverage([{ ...pot, code: "rules" }], [fullTests]).gaps).toContainEqual({ card: "rules", problem: "reserved-code" });
	});
	it("reports a malformed source record, and an effect or ruling naming a source the card doesn't list", () => {
		const broken: CardSources = { ...pot, sources: pot.sources.map((s) => (s.id === "draw" ? { ...s, quote: "" } : s)), effects: ["draw", "missing"] };
		expect(coverage([broken], [fullTests]).gaps).toEqual([
			{ card: "pot", problem: "source-invalid", source: "draw", details: ["quote-missing"] },
			{ card: "pot", problem: "unknown-source", source: "missing" },
		]);
	});
});

describe("coverage: rule tests cite the rule sources", () => {
	const page = "https://www.yugioh-card.com/en/play/fast-effect-timing/";
	const rules: SourceRecord[] = [
		{ id: "open-state", kind: "tcg-rule", url: page, read, quote: "This is when the game state is open" },
		{ id: "who-goes-next", kind: "tcg-rule", url: page, read, quote: "The player who did NOT activate the effect." },
	];
	const ruleTests = { path: "test/rules/chain.test.ts", text: `it(\`\${cites("rules", "open-state")} \${cites("rules", "who-goes-next")} x\`)` };

	it("passes when every rule record is well formed and cited by a running test, next to the card checks", () => {
		expect(coverage([pot], [fullTests, ruleTests], rules).gaps).toEqual([]);
	});
	it("reports a rule no test cites, and a citation of a rule that is not in the registry", () => {
		expect(coverage([], [{ path: "t.test.ts", text: `it(\`\${cites("rules", "open-state")} \${cites("rules", "typo")} x\`)` }], rules).gaps).toEqual([
			{ card: "rules", problem: "rule-untested", source: "who-goes-next" },
			{ card: "rules", problem: "unknown-citation", source: "typo", file: "t.test.ts" },
		]);
	});
	it("reports a malformed rule record and a rule id used twice", () => {
		const broken: SourceRecord[] = [{ ...rules[0]!, url: "https://yugipedia.com/wiki/Fast_effect_timing", read: "2026-02-30" }, rules[1]!, rules[1]!];
		expect(coverage([], [ruleTests], broken).gaps).toEqual([
			{ card: "rules", problem: "source-invalid", source: "open-state", details: ["read-invalid", "url-not-konami"] },
			{ card: "rules", problem: "duplicate-source", source: "who-goes-next" },
		]);
	});
	it("still reports a rule citation as unknown when no rule registry is given", () => {
		expect(coverage([], [ruleTests]).gaps).toHaveLength(2);
	});
});
