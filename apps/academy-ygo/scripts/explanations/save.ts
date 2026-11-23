/**
 * Saves explanations for children drafted in the terminal into Duel Academy's own database, as drafts. Re-saving a card
 * and language replaces its text and makes it a draft again (a changed text has to be checked again).
 *
 *   pnpm explanations:save explanations-fr.json
 *
 * The file: { "model": "claude-…", "promptVersion": 2, "explanations": [{ "passcode": 5318639, "locale": "fr", "text": "… {answer} …" }] }
 * The text is stored with its `{tokens}`; pages turn them into the shared sentences (src/lib/card-search/phrases.ts).
 */
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { academyDb } from "../../src/server/academy-db/index";
import { cardKidExplanations } from "../../src/server/academy-db/schema";
import { checkExplanation } from "../../src/lib/card-search/phrases";
import { isLocale, type Locale } from "../../src/lib/i18n/locales";

async function main() {
	type Entry = { passcode: number; locale: Locale; text: string };

	const path = process.argv[2];
	if (!path) {
		console.error("Usage: pnpm explanations:save <file.json>");
		process.exit(2);
	}
	const file = JSON.parse(await readFile(path, "utf8")) as { model?: string; promptVersion?: number; explanations: Entry[] };

	const problems: string[] = [];
	for (const entry of file.explanations) {
		if (!Number.isInteger(entry.passcode) || entry.passcode <= 0) problems.push(`bad passcode ${entry.passcode}`);
		if (!isLocale(entry.locale)) {
			problems.push(`${entry.passcode}: bad locale ${entry.locale}`);
			continue;
		}
		if (!entry.text?.trim()) problems.push(`${entry.passcode}/${entry.locale}: empty text`);
		/* Unknown {tokens}, a shared sentence written by hand, game words. */
		for (const problem of checkExplanation(entry.text ?? "", entry.locale)) problems.push(`${entry.passcode}/${entry.locale}: ${problem}`);
	}
	if (problems.length) {
		console.error(`Nothing saved:\n  ${problems.join("\n  ")}`);
		process.exit(1);
	}

	await academyDb()
		.insert(cardKidExplanations)
		.values(file.explanations.map((entry) => ({ ...entry, text: entry.text.trim(), status: "draft" as const, model: file.model ?? null, promptVersion: file.promptVersion ?? null })))
		.onConflictDoUpdate({
			target: [cardKidExplanations.passcode, cardKidExplanations.locale],
			set: { text: sql`excluded.text`, status: "draft", model: sql`excluded.model`, promptVersion: sql`excluded.prompt_version`, updatedAt: sql`now()` },
		});
	console.log(`Saved ${file.explanations.length} explanation(s) as drafts.`);
	process.exit(0);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
