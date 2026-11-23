import { eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { expandPhrases } from "@/lib/card-search/phrases";
import type { Locale } from "@/lib/i18n/locales";
import * as schema from "./schema";

const globalForAcademy = globalThis as unknown as { academyPool?: Pool };

export function academyDb(): NodePgDatabase<typeof schema> {
	const url = process.env.ACADEMY_DATABASE_URL;
	if (!url) throw new Error("ACADEMY_DATABASE_URL is not set (Duel Academy's own database)");
	globalForAcademy.academyPool ??= new Pool({ connectionString: url, max: 5 });
	return drizzle(globalForAcademy.academyPool, { schema });
}

export type KidExplanation = { text: string; checked: boolean };

/**
 * A card's explanations, by language, as a child reads them: stored `{tokens}` become the shared sentences, so every
 * card says the same thing the same way. The page shows only the reader's language.
 */
export async function kidExplanations(passcode: number): Promise<Partial<Record<Locale, KidExplanation>>> {
	const rows = await academyDb()
		.select({ locale: schema.cardKidExplanations.locale, text: schema.cardKidExplanations.text, status: schema.cardKidExplanations.status })
		.from(schema.cardKidExplanations)
		.where(eq(schema.cardKidExplanations.passcode, passcode));
	return Object.fromEntries(rows.map((row) => [row.locale, { text: expandPhrases(row.text, row.locale), checked: row.status === "checked" }]));
}
