# Duel Academy (academy-ygo)

Visual Yu-Gi-Oh! TCG training presentation. Lessons are typed data (`src/lib/lesson-types.ts`); each slide
names a template and the renderer in `src/components/slides/` draws it with schematic educational cards
(original names, no real artwork). That beginner course is no longer linked: the site's home (`/`) is the Junior
course for children, which uses official card art and the anime characters as trainers
(`docs/academy-junior-world.md`, `docs/academy-junior-play.md`).

## Run

```bash
pnpm --filter academy-ygo dev        # http://localhost:3220
pnpm --filter academy-ygo typecheck
pnpm --filter academy-ygo test:ci
pnpm --filter academy-ygo build
```

## Structure

- `src/content/chapters/<chapter>/` lessons per chapter; `src/content/chapters/index.ts` is the registry.
- `src/components/visuals/` card, duel field, Life Points, chain stack, phase timeline, summoning diagram.
- `src/components/slides/` one component per slide template plus `slide-renderer.tsx`.
- `src/components/academy/` lesson player (keyboard, fullscreen, notes, progress), cards, toolbar.
- Progress is stored locally in the browser (`src/lib/progress.ts`), no account or backend.

Player keys: Left/Right/Space, Home/End, N (notes), F (full screen), Esc.

## Card search

`/card-search` (header link "Cards") finds any card by name. `/card-search/<passcode>` shows the card, its
explanation for children in the reader's language, the printed words, and a link to its YGOProJudge page.

- **Cards:** YGOProJudge's database (`cards` table of the `ygo-judge` repo), read-only (`CARDS_DATABASE_URL`). Duel
  Academy never writes or migrates there.
- **Pictures:** through ygoprojudge.com's image service (`src/lib/card-search/links.ts`), as YGOProJudge shows them.
- **Explanations for children:** Duel Academy's own database (`ACADEMY_DATABASE_URL`, `src/server/academy-db/`),
  drafted offline by Claude in the terminal: [docs/kid-explanations-guide.md](../../docs/kid-explanations-guide.md).

Local setup (Docker):

```bash
cp .env.example .env.local
pnpm db:up                       # Postgres on :5434 with the `ygojudge` and `academy` databases
pnpm db:migrate                  # Duel Academy's table
```

Fill the local YGOProJudge copy (`ygojudge` database). **Do not run ygo-judge's `npm run db:migrate` for this**: its
`scripts/migrate.ts` loads `ygo-judge/.env.local` with `override: true`, so it ignores a local `DATABASE_URL` and
migrates the database named in that file. Instead:

```bash
# YGOProJudge's migrations, in journal order, straight into the local container
cd ../../../ygo-judge   # the ygo-judge repo
python3 -c 'import json;[print(e["tag"]) for e in json.load(open("drizzle/meta/_journal.json"))["entries"]]' |
  while read tag; do docker exec -i duel-academy-postgres psql -U academy -d ygojudge -v ON_ERROR_STOP=1 -q < "drizzle/$tag.sql" || break; done
# the cards (English + French names): call YGOProJudge's sync with the local address only, from outside the repo,
# e.g. a one-off script that imports lib/cards/sync.ts and refuses any DATABASE_URL other than localhost:5434/ygojudge
```

Without the databases the rest of the site still works; the card pages say the card book is closed.

## Deploy

Vercel project `academy-ygo` (Root Directory `apps/academy-ygo`, Node 24.x), **not** connected to GitHub.
CI in `.github/workflows/academy-ygo.yaml` typechecks, tests, then `vercel pull` / `vercel build` /
`vercel deploy --prebuilt` on pushes to `main` or `feature/**` that touch this app. `main` uses the
`prod` GitHub Environment; feature branches use `Develop` (Preview).

Environment secrets (both `prod` and `Develop`): `VERCEL_TOKEN`, `ACADEMY_VERCEL_ORG_ID`,
`ACADEMY_VERCEL_PROJECT_ID`. Runtime env vars: `CARDS_DATABASE_URL` (read-only) and `ACADEMY_DATABASE_URL`, for the card search only (its pages render on the server); the rest of the site is static.

`vercel.json` sets a filtered install and turns Git deployments off.
