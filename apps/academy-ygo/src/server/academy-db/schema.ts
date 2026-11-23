import { integer, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { LOCALES } from "../../lib/i18n/locales";

/** Duel Academy's own database (`ACADEMY_DATABASE_URL`). Nothing here lives in YGOProJudge's database. */

export const explanationStatus = pgEnum("explanation_status", ["draft", "checked"]);

/**
 * A card explained for children, one row per card and language. Drafted offline by Claude run as an agent in the
 * terminal (never while a page loads); `draft` until a grown-up checks it. No game words such as "target", "chain" or
 * "cost": the text says what they mean in plain words, written for that language (docs/research/card-search-and-kid-explanations.md §E.7).
 */
export const cardKidExplanations = pgTable(
	"card_kid_explanations",
	{
		/** The card's passcode (YGOPRODeck id), as in YGOProJudge's `cards` table. */
		passcode: integer("passcode").notNull(),
		locale: text("locale", { enum: LOCALES }).notNull(),
		text: text("text").notNull(),
		status: explanationStatus("status").notNull().default("draft"),
		/** Which model drafted it, and which version of the instructions. */
		model: text("model"),
		promptVersion: integer("prompt_version"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [unique("card_kid_explanations_card_locale").on(table.passcode, table.locale)],
);
