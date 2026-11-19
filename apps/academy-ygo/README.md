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

## Deploy

Vercel project `academy-ygo` (Root Directory `apps/academy-ygo`, Node 24.x), **not** connected to GitHub.
CI in `.github/workflows/academy-ygo.yaml` typechecks, tests, then `vercel pull` / `vercel build` /
`vercel deploy --prebuilt` on pushes to `main` or `feature/**` that touch this app. `main` uses the
`prod` GitHub Environment; feature branches use `Develop` (Preview).

Environment secrets (both `prod` and `Develop`): `VERCEL_TOKEN`, `ACADEMY_VERCEL_ORG_ID`,
`ACADEMY_VERCEL_PROJECT_ID`. No app runtime env vars — the site is fully static.

`vercel.json` sets a filtered install and turns Git deployments off.
