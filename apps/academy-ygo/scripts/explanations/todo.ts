/**
 * Lists cards that still need an explanation for children in a language, with their printed words, for Claude to
 * draft in the terminal (docs/kid-explanations-guide.md). Reads YGOProJudge's cards (read-only) and Duel Academy's
 * explanations; writes nothing to either database.
 *
 *   pnpm explanations:todo --locale fr --limit 50 [--passcodes 5318639,14087893] [--out todo-fr.json]
 */
import { writeFile } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { academyDb } from "../../src/server/academy-db/index";
import { cardKidExplanations } from "../../src/server/academy-db/schema";
import { findCard, searchCards } from "../../src/server/judge-cards";
import { isLocale, LOCALES } from "../../src/lib/i18n/locales";

async function main() {
	function option(name: string): string | undefined {
		const at = process.argv.indexOf(`--${name}`);
		return at === -1 ? undefined : process.argv[at + 1];
	}

	const locale = option("locale");
	if (!isLocale(locale)) {
		console.error(`--locale must be one of ${LOCALES.join(", ")}`);
		process.exit(2);
	}
	const limit = Number(option("limit") ?? 50);
	const wanted = option("passcodes")?.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);

	/* The cards to look at: the ones asked for, or the list in name order, a page at a time. */
	const candidates = [];
	if (wanted?.length) {
		for (const passcode of wanted) {
			const card = await findCard(passcode);
			if (card) candidates.push(card);
			else console.warn(`No card with passcode ${passcode}`);
		}
	} else {
		for (let page = 1; candidates.length < limit * 4; page++) {
			const { cards } = await searchCards("", page);
			if (cards.length === 0) break;
			candidates.push(...cards);
		}
	}

	const done = new Set(
		(
			await academyDb()
				.select({ passcode: cardKidExplanations.passcode })
				.from(cardKidExplanations)
				.where(and(eq(cardKidExplanations.locale, locale), inArray(cardKidExplanations.passcode, candidates.map((card) => card.passcode))))
		).map((row) => row.passcode),
	);
	const todo = candidates.filter((card) => !done.has(card.passcode)).slice(0, limit);
	const out = option("out") ?? `explanations-todo-${locale}.json`;
	await writeFile(out, JSON.stringify({ locale, cards: todo.map(({ passcode, name, nameFr, text }) => ({ passcode, name, nameFr, printed: text })) }, null, "\t"));
	console.log(`${todo.length} card(s) to explain in "${locale}" written to ${out}`);
	process.exit(0);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
