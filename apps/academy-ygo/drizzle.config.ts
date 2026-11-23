import type { Config } from "drizzle-kit";

/* drizzle-kit does not read .env.local itself (Next.js does, for the app). */
try {
	process.loadEnvFile(".env.local");
} catch {
	/* No file: the variable comes from the environment. */
}

/**
 * Migrations for Duel Academy's own database only (`ACADEMY_DATABASE_URL`). YGOProJudge's database is read-only for
 * Duel Academy and is never migrated from here.
 */
export default {
	schema: "./src/server/academy-db/schema.ts",
	out: "./src/server/academy-db/migrations",
	dialect: "postgresql",
	dbCredentials: { url: process.env.ACADEMY_DATABASE_URL ?? "" },
} satisfies Config;
