# Academy Junior pilot: Mission 1

Direct route: `/junior` in `apps/academy-ygo` (dev: `http://localhost:3220/junior`). There is no link to it from the
homepage or the Academy on purpose; it is a pilot. Design source: `docs/research/kids-interactive-academy.md` section 10.

## Scope

"The Deck wakes up": intro, 6 short story pages (cub = Monster, spark = Spell, chameleon = Trap, reading Level, ATK
and DEF), 6 one-at-a-time card sorts, 3 explained quiz questions, a badge, then Play again or back to the Academy.

- Every right and wrong answer has an explanation. Wrong answers cost nothing, retries are unlimited, and Next
  appears only after a correct answer.
- Mastery means all six sorts and all three quiz questions were answered correctly at least once. It is saved in
  the browser only and a later wrong answer never removes it. Reloading restarts the flow; steps are not resumed.
- The teaching is limited to Normal Spells and Normal Traps and says so, to avoid false general rules.
- Art is original geometric SVG (Pip the cub, Zip the spark, Mimi the chameleon). No borrowed names, cards or art.
- English, French and Hebrew come from `src/lib/junior/mission1-copy.ts` (`Record<Locale, Copy>`) keyed by
  `useLanguage().locale`. The existing dictionaries are untouched. The page-level language switcher in the root
  layout drives it, and changing language keeps the step and the shown answer.
- Accessibility: native buttons (keyboard), 48px minimum controls, focus moves to the new heading on each step,
  `aria-live` feedback with icon plus words, logical RTL, left-to-right numbers, max width 960px, portrait first.
- Calm mode: a persisted `aria-pressed` toggle. Motion is off when calm is on or the device asks for reduced
  motion (`data-motion="off"` on the page root). There is no audio, drag, account, backend or network call.
- Storage: own key `academy-ygo:junior:mission1:v1`, saving only correct answers and the calm choice (an old
  `answered` field is ignored). Parsed defensively (shape, types, version, unknown ids). Nothing is written on load, and an
  unknown, newer or damaged record is never overwritten (persistence is skipped, the mission runs in memory). Each save
  re-reads the latest record and merges, so correct answers and mastery never go back across tabs; a `storage` event
  brings other tabs' progress and calm in. Motion stays off until saved calm and the device setting are known, so calm
  never flashes. Missing or throwing storage works in memory. Adult academy progress is not touched.

## Layout

- `src/lib/junior/`: `mission1.ts` (answers), `mission1-copy.ts` (copy), `progress.ts` (storage), `flow.ts` (steps)
- `src/components/junior/`: `mission-one.tsx`, `choice-step.tsx`, `sort-card.tsx`, `mission-art.tsx`, `calm-toggle.tsx`
- `src/app/junior/page.tsx`
- Shared edits: `package.json` and `pnpm-lock.yaml` (jsdom 24, Testing Library react 16, dom 10, user-event 14) and
  `vitest.config.mts` (include `src/**/*.test.{ts,tsx}`, esbuild automatic JSX). Rendered tests opt into jsdom with a
  `// @vitest-environment jsdom` docblock; the default environment stays node.

## Test evidence

Tests were written one behavior at a time at two seams: the answer and progress functions, and the rendered mission
(real `LanguageProvider` and `LanguageSwitcher`, real async French and Hebrew loads, `document.dir` reset).
Each slice failed first (missing module or missing behavior) and then passed. Result on 2026-11-17:
`vitest run` for the whole academy app 12 files, 146 tests passing; `tsc --noEmit` clean; `next build` succeeds
with `/junior` prerendered static. Run: `cd apps/academy-ygo && node node_modules/vitest/vitest.mjs run`.

## Caveats

- French and Hebrew copy was written by the model, not by a native speaker. A native review is needed before real
  children use it (terms follow the site's existing French and Hebrew card vocabulary).
- Not yet tried with children; the research doc recommends testing this single mission first.
