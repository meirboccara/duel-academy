/**
 * Where a rule or a card's behaviour comes from (definition of done, wayfinder ticket #9). Each test cites one record.
 * - `card-text`: the card's official text on Konami's card database (needs the Konami card id, `cid`).
 * - `tcg-rule`: the TCG rulebook or one of Konami's rules pages.
 * - `jp-qa`: a Q&A entry of Konami's Japanese database for the card (needs `cid` and the Q&A id, `fid`).
 * The record always points at Konami's own page; an aggregator is at most where the text was fetched from.
 */
export type SourceKind = "card-text" | "tcg-rule" | "jp-qa";

export interface SourceRecord {
	/** Unique within its card (or rule set): what tests cite. */
	id: string;
	kind: SourceKind;
	cid?: number;
	fid?: number;
	url: string;
	/** The date the page was read, YYYY-MM-DD. */
	read: string;
	/** A short quote in the page's own language. */
	quote: string;
}

export type SourceProblem = "cid-missing" | "fid-missing" | "read-invalid" | "quote-missing" | "url-not-konami";

const KONAMI_HOSTS = ["www.db.yugioh-card.com", "db.yugioh-card.com", "www.yugioh-card.com", "yugioh-card.com", "img.yugioh-card.com"];

export function isKonamiUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" && KONAMI_HOSTS.includes(parsed.hostname);
	} catch {
		return false;
	}
}

export function isRealDate(text: string): boolean {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
	if (!match) return false;
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateSource(record: SourceRecord): SourceProblem[] {
	const problems: SourceProblem[] = [];
	if (record.kind !== "tcg-rule" && record.cid === undefined) problems.push("cid-missing");
	if (record.kind === "jp-qa" && record.fid === undefined) problems.push("fid-missing");
	if (!isRealDate(record.read)) problems.push("read-invalid");
	if (record.quote.trim() === "") problems.push("quote-missing");
	if (!isKonamiUrl(record.url)) problems.push("url-not-konami");
	return problems;
}

/** The Konami card database page of a card (`cid`), in English or French. */
export const konamiCardUrl = (cid: number, locale: "en" | "fr"): string => `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cid}&request_locale=${locale}`;
