import { asc, eq, ilike, or, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { PAGE_SIZE } from "@/lib/card-search/links";

/**
 * YGOProJudge's card list, read-only. YGOProJudge (the `ygo-judge` repo) owns this table and fills it from YGOPRODeck
 * (`cards:sync`); Duel Academy is only a reader: it never creates, changes or migrates anything in that database.
 * This copy of the table's shape (ygo-judge `db/schema.ts`, `cards`) is for typed reads only.
 */
export const judgeCards = pgTable("cards", {
	passcode: integer("passcode").primaryKey(),
	name: text("name").notNull(),
	/** French printed name; null for cards never printed in French (ygo-judge migration 0039). */
	nameFr: text("name_fr"),
	desc: text("desc").notNull(),
	archetype: text("archetype"),
	syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
});

export type JudgeCard = { passcode: number; name: string; nameFr: string | null; text: string };

/** What the card search reads of a card. */
const CARD_FIELDS = { passcode: judgeCards.passcode, name: judgeCards.name, nameFr: judgeCards.nameFr, text: judgeCards.desc };

const globalForJudge = globalThis as unknown as { judgePool?: Pool };

function judgeDb(): NodePgDatabase {
	const url = process.env.CARDS_DATABASE_URL;
	if (!url) throw new Error("CARDS_DATABASE_URL is not set (read-only address of YGOProJudge's database)");
	globalForJudge.judgePool ??= new Pool({ connectionString: url, max: 5 });
	return drizzle(globalForJudge.judgePool);
}

/** `%` and `_` typed by a child are letters, not wildcards. */
export function likePattern(query: string): string {
	return `%${query.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * The number printed at the bottom left of a card (its passcode, 8 digits, e.g. "05318639"): a child can copy it from
 * the card in their hand without knowing how to spell the name, whatever language the card is printed in.
 */
export function printedNumber(query: string): number | null {
	const digits = query.replace(/\s/g, "");
	return /^\d{5,10}$/.test(digits) && Number(digits) > 0 ? Number(digits) : null;
}

/**
 * Cards whose English or French name contains `query` (YGOProJudge has trigram indexes on both), or the card with that
 * printed number, a page at a time.
 */
export async function searchCards(query: string, page: number): Promise<{ cards: JudgeCard[]; total: number }> {
	const db = judgeDb();
	const number = printedNumber(query);
	const where = number !== null ? eq(judgeCards.passcode, number) : query.trim() ? or(ilike(judgeCards.name, likePattern(query)), ilike(judgeCards.nameFr, likePattern(query))) : undefined;
	const [rows, counted] = await Promise.all([
		db
			.select(CARD_FIELDS)
			.from(judgeCards)
			.where(where)
			.orderBy(asc(judgeCards.name))
			.limit(PAGE_SIZE)
			.offset(Math.max(0, page - 1) * PAGE_SIZE),
		db.select({ total: sql<number>`count(*)::int` }).from(judgeCards).where(where),
	]);
	return { cards: rows, total: counted[0]?.total ?? 0 };
}

export async function findCard(passcode: number): Promise<JudgeCard | null> {
	const [row] = await judgeDb()
		.select(CARD_FIELDS)
		.from(judgeCards)
		.where(eq(judgeCards.passcode, passcode))
		.limit(1);
	return row ?? null;
}
