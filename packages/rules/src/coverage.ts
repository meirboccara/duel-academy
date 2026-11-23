import { isKonamiUrl, isRealDate, type SourceProblem, type SourceRecord, validateSource } from "./sources";

/**
 * What a card owes the definition of done (wayfinder ticket #9): one test per printed effect, one per ruling that can
 * arise with Academy's cards, official French text. Lives next to the card as data; `coverage` checks it.
 */
export interface CardSources {
	/** Academy's id for the card. */
	code: string;
	/** Konami's card id. */
	cid: number;
	/** Official French text (from YGOResources), with the Konami page it matches and the date it was read. */
	french?: { text: string; url: string; read: string };
	sources: SourceRecord[];
	/** One source per printed effect (costs and conditions included). */
	effects: string[];
	/**
	 * Printed parts of the card the core does not apply yet, each a source of this card and the step that adds it. They are
	 * reported as pending, never as covered (a test citing one does not make it done), and must not also be in `effects`.
	 */
	deferred?: { source: string; step: number; reason: string }[];
	/** Rulings; a pending one involves a card Academy doesn't have yet. */
	rulings: { source: string; pending?: string }[];
}

export interface TestFile {
	path: string;
	text: string;
}

export type CoverageGap =
	| { card: string; problem: "effect-untested" | "deferred-and-covered" | "ruling-untested" | "rule-untested" | "unknown-source" | "source-other-card" | "duplicate-source"; source: string }
	| { card: string; problem: "source-invalid"; source: string; details: SourceProblem[] }
	| { card: string; problem: "french-missing" | "reserved-code" }
	| { card: string; problem: "french-invalid"; details: SourceProblem[] }
	| { card: string; problem: "unknown-citation"; source: string; file: string }
	| { card: "?"; problem: "citation-unreadable"; file: string };

export interface CoverageReport {
	gaps: CoverageGap[];
	pending: { card: string; source: string; reason: string }[];
}

/** What rule tests cite: cites("rules", "<id>") names a record of the rule registry (src/rule-sources.ts). */
export const RULES = "rules";

/**
 * How a test names what it checks: put it in the title of a test that runs, with both arguments written as literals,
 * e.g. it(`${cites("pot-of-greed", "draw")} draws 2`). Citations in skipped or todo tests, comments or test bodies
 * don't count.
 */
export const cites = (card: string, source: string) => `[${card}#${source}]`;

/** The title of a running test: it(...) / test(...), optionally .only; not it.skip, it.todo or xit. */
const TEST_TITLE = /\b(?:it|test)(?:\.only)?\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
const CITATION = /cites\(\s*["'](?<card>[^"']+)["']\s*,\s*["'](?<source>[^"']+)["']\s*\)/g;
const LINE_COMMENT = /(^|\s)\/\/.*$/gm;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;

function readCitations(file: TestFile) {
	const code = file.text.replace(BLOCK_COMMENT, "").replace(LINE_COMMENT, "$1");
	const found: { card: string; source: string; file: string }[] = [];
	let unreadable = false;
	for (const title of code.matchAll(TEST_TITLE)) {
		const text = title[1]!;
		const readable = [...text.matchAll(CITATION)];
		if (readable.length < text.split("cites(").length - 1) unreadable = true;
		for (const match of readable) found.push({ card: match.groups!.card!, source: match.groups!.source!, file: file.path });
	}
	return { found, unreadable };
}

/**
 * Checks the cards against their tests. With `rules` (the rule registry), also checks that every rule record is well
 * formed, has its own id and is cited by a running test, and that each cites("rules", ...) names a record.
 */
export function coverage(cards: readonly CardSources[], tests: readonly TestFile[], rules?: readonly SourceRecord[]): CoverageReport {
	const read = tests.map((file) => ({ file, ...readCitations(file) }));
	const citations = read.flatMap((entry) => entry.found);
	const cited = new Set(citations.map((citation) => `${citation.card}#${citation.source}`));
	const gaps: CoverageGap[] = [];
	const pending: CoverageReport["pending"] = [];

	for (const card of cards) {
		if (card.code === RULES) gaps.push({ card: RULES, problem: "reserved-code" });
		const known = new Set<string>();
		for (const source of card.sources) {
			if (known.has(source.id)) gaps.push({ card: card.code, problem: "duplicate-source", source: source.id });
			known.add(source.id);
			const details = validateSource(source);
			if (details.length > 0) gaps.push({ card: card.code, problem: "source-invalid", source: source.id, details });
			if (source.kind !== "tcg-rule" && source.cid !== undefined && source.cid !== card.cid) gaps.push({ card: card.code, problem: "source-other-card", source: source.id });
		}
		for (const part of card.deferred ?? []) {
			if (!known.has(part.source)) gaps.push({ card: card.code, problem: "unknown-source", source: part.source });
			else if (card.effects.includes(part.source)) gaps.push({ card: card.code, problem: "deferred-and-covered", source: part.source });
			else pending.push({ card: card.code, source: part.source, reason: `step ${part.step}: ${part.reason}` });
		}
		const listed = [...card.effects, ...card.rulings.map((ruling) => ruling.source)];
		for (const source of listed) if (!known.has(source)) gaps.push({ card: card.code, problem: "unknown-source", source });
		for (const source of card.effects) {
			if (known.has(source) && !cited.has(`${card.code}#${source}`)) gaps.push({ card: card.code, problem: "effect-untested", source });
		}
		for (const ruling of card.rulings) {
			if (ruling.pending !== undefined) pending.push({ card: card.code, source: ruling.source, reason: ruling.pending });
			else if (known.has(ruling.source) && !cited.has(`${card.code}#${ruling.source}`)) gaps.push({ card: card.code, problem: "ruling-untested", source: ruling.source });
		}
		if (!card.french || card.french.text.trim() === "") gaps.push({ card: card.code, problem: "french-missing" });
		else {
			const details: SourceProblem[] = [];
			if (!isRealDate(card.french.read)) details.push("read-invalid");
			if (!isKonamiUrl(card.french.url)) details.push("url-not-konami");
			if (details.length > 0) gaps.push({ card: card.code, problem: "french-invalid", details });
		}
	}

	const ruleIds = new Set<string>();
	for (const rule of rules ?? []) {
		const duplicate = ruleIds.has(rule.id);
		if (duplicate) gaps.push({ card: RULES, problem: "duplicate-source", source: rule.id });
		ruleIds.add(rule.id);
		const details = validateSource(rule);
		if (details.length > 0) gaps.push({ card: RULES, problem: "source-invalid", source: rule.id, details });
		if (!duplicate && !cited.has(`${RULES}#${rule.id}`)) gaps.push({ card: RULES, problem: "rule-untested", source: rule.id });
	}

	const byCode = new Map(cards.map((card) => [card.code, card]));
	for (const citation of citations) {
		if (rules && citation.card === RULES && ruleIds.has(citation.source)) continue;
		const card = byCode.get(citation.card);
		if (!card || !card.sources.some((source) => source.id === citation.source)) {
			gaps.push({ card: citation.card, problem: "unknown-citation", source: citation.source, file: citation.file });
		}
	}
	for (const entry of read) if (entry.unreadable) gaps.push({ card: "?", problem: "citation-unreadable", file: entry.file.path });
	return { gaps, pending };
}
