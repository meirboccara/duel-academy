# Academy: a children-only site with Junior as the landing page

> **Date of observation:** 2026-11-19. Every web page cited below was fetched that day. The repository was read on
> `main` at HEAD `8a528d2`, with uncommitted changes from other sessions in the tree (five Junior files modified, one
> new test); code claims describe the files as they stood that day.
> **Nature of this document:** a research note, mostly a repo audit. No code was changed, nothing was installed,
> built, run or published. The test suite was not run.
>
> **The request (owner, verbatim):** "I would like to remove the 'accueil débutant' and keep the website only for
> children. So the landing page will be focused on Junior."
>
> **Sourcing rule used:** claims about this repo cite the file and line. Paths are relative to `apps/academy-ygo/`
> unless they start with `docs/`, `apps/` or `.github/`. External claims are followed by the source that owns them
> (the law's own text, the regulator's own page). Effort figures, proposals and inferences are labelled **(ours)**.
> Whatever could not be confirmed is listed in [§9](#9-unverified--could-not-confirm).
> **The legal parts are not legal advice.** They quote texts so the owner knows what to ask a lawyer.
>
> **Relation to existing notes.** [junior-3d-island-world.md](./junior-3d-island-world.md) proposes an island world
> as the Junior level-select; that screen would become the landing page under this decision (§5.6).
> [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §4 covers parent
> login, and [kids-interactive-academy.md](./kids-interactive-academy.md) §8.2 covers children's privacy. This note
> does not repeat them; it says what changes when the *whole* site is for children.

---

## 0. Short answer

- **What "accueil débutant" is in the code.** In French, the header shows three links: **Accueil**, **Débutant**,
  **Junior** (`src/lib/i18n/ui-fr.ts:78`, `src/components/site-header.tsx:17-20`). "Accueil" is the home page `/`,
  which today is a landing page *for the beginner course*. "Débutant" is the course itself, at `/academy`. So the
  phrase most likely means both: the beginner home page and the beginner course. One other reading exists (§1.2).
- **The change is small and safe.** Junior does not use any beginner code. The only thing Junior imports from
  outside its own folders is the language layer (§3.1). There is no database, no account, no analytics, no sitemap
  and no link from another app (§3.3). Nothing on a server has to migrate.
- **Recommended (ours): option (b), done in two steps.** Step 1: make Junior the landing page and remove the
  "Accueil" and "Débutant" links (half a day, easy to undo). Step 2: delete the beginner course code and its
  translations (one to three days). Git keeps the old course if it is ever wanted again.
- **What a children-only site needs that the repo does not have:** a short page for parents (who made this, what is
  stored, how to contact), a description and title written for the new audience, a friendly "page not found" page,
  and a decision on old `/academy` links (§5).
- **Legal position today is simple, and this change does not make it harder:** the site stores progress only in the
  child's browser and sends nothing (§5.5). It becomes harder only if accounts or analytics are added later.

---

## 1. What "accueil débutant" is

### 1.1 Every candidate found

Searched for `débutant`, `debutant`, `beginner`, `accueil`, `home`, `landing` in `apps/academy-ygo/src`.

| # | Candidate | Where | What it is |
| --- | --- | --- | --- |
| 1 | Header link **"Accueil"** (`Home`) → `/` | `src/components/site-header.tsx:18`; French label `src/lib/i18n/ui-fr.ts:78`; Hebrew `src/lib/i18n/ui-he.ts:78` | The home page. |
| 2 | Header link **"Débutant"** (`Beginner`) → `/academy` | `src/components/site-header.tsx:19`; same label lines | The beginner course. |
| 3 | The home page itself | `src/app/page.tsx:18-116` | A landing page for the beginner course: title "DUEL ACADEMY" (`:38-42`), button "Start Learning" → `/academy` (`:47-53`), "Continue" button reading beginner progress (`:54`), "jump to lesson 1" (`:58-60`), three topic boxes (`:84-94`), the four chapters (`:96-113`). Junior appears only as one of two cards (`:82`). |
| 4 | The **"Débutant"** card in "Choisissez votre parcours" | `src/components/learning-paths.tsx:11-19`; French text `src/lib/i18n/ui-fr.ts:79-82` | "Teens and adults · 4 chapters", button "Start the course" → `/academy`. |
| 5 | Site description "…for beginners…" / "…pour débutants…" | `src/lib/brand.ts:3-4`, used as `<meta description>` in `src/app/layout.tsx:14-17` and on the home page `src/app/page.tsx:44` | What search engines and link previews show. |
| 6 | "Retour à l'accueil" (`Back to home`) inside Junior | `src/lib/junior/play/copy-fr.ts:279` (link in `src/components/junior/play/junior-play.tsx:226-229`); `src/lib/junior/mission1-copy.ts:221` (links in `src/components/junior/mission-one.tsx:94`, `:168`) | Junior's link back to `/`. Not a page, but it points at the page being removed. |
| 7 | The beginner course pages | `src/app/academy/page.tsx`, `src/app/academy/[chapter]/page.tsx`, `src/app/academy/[chapter]/[lesson]/page.tsx` | 4 chapters, 28 lesson files under `src/content/chapters/`. |

The word "beginner" also appears inside lesson text and translations (`src/content/chapters/**`,
`src/lib/i18n/fr-content.json`, `he-content.json`); those are course content, not entry points.

### 1.2 Which one the owner most likely means

**Most likely (ours): candidates 1 to 5 and 7 together**, that is "the Accueil page and the Débutant section". The
two words sit next to each other in the French header, and the second sentence of the request ("keep the website
only for children") only makes sense if the course for "Teens and adults" (`learning-paths.tsx:16`) goes too.

Other readings, so the owner can correct us:

- **Narrow reading:** remove only the beginner *home page* (candidate 3) and keep the course reachable somewhere.
  This is option (c) in §6.
- **Unlikely reading:** the *Beginner course* of the other app, `apps/duel-nextjs` (`/welcome` and `/course`, see
  `apps/duel-nextjs/src/app/(site)/welcome/page.tsx:8`, `apps/duel-nextjs/src/app/course/page.tsx:9`). That app has
  no French text containing "débutant" (searched `apps/duel-nextjs/src`), and it is not a site "for children", so we
  do not think the request is about it. The older notes `beginner-course-meta-readiness.md`,
  `beginner-lessons-rules-audit.md` and `beginner-training-matches.md` are about that app, not the academy.

### 1.3 Domain docs

`CONTEXT-MAP.md` lists Coiffure, Duel and Hag Alarm; the academy has no entry and there is no
`apps/academy-ygo/CONTEXT.md`. No ADR in `docs/adr/` is about the academy or its audiences. The audience split is
written only in code: "Teens and adults · 4 chapters" and "Ages 8 to 12" (`src/components/learning-paths.tsx:16`,
`:25`).

---

## 2. Route map

The app has eight files under `src/app`. There is no `proxy.ts` / `middleware.ts`, no `robots`, `sitemap`,
`manifest`, `not-found`, `opengraph-image` or icon file, no `public/` folder, and `next.config.ts` defines no
redirects (`next.config.ts:5-13`). The language is not in the URL: it is chosen in the browser (§5.2).

| Route | File | Audience | What it renders | How people reach it |
| --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Beginner (teens, adults) | Beginner landing page, see §1.1 row 3 | Typing the address; header "Home" and brand link (`site-header.tsx:18`, `:26-28`); breadcrumb of `/academy` (`src/app/academy/page.tsx:17`); Junior's "Back to home" links (§1.1 row 6) |
| `/academy` | `src/app/academy/page.tsx` | Beginner | Chapter list with progress, "Continue" button | Header "Beginner"; home page buttons; lesson toolbar "Back to the Academy" (`src/components/academy/presentation-toolbar.tsx:37`); end of last lesson (`src/app/academy/[chapter]/[lesson]/page.tsx:34`) |
| `/academy/[chapter]` | `src/app/academy/[chapter]/page.tsx` | Beginner | Lesson list of one chapter. Static, one page per chapter (`:11-13`) | Chapter cards |
| `/academy/[chapter]/[lesson]` | `src/app/academy/[chapter]/[lesson]/page.tsx` | Beginner | Full-screen slide player (`:30-36`). Static, one page per lesson (`:10-12`) | Lesson lists; "Continue" button (`src/components/academy/continue-learning-button.tsx:35`) |
| `/junior` | `src/app/junior/page.tsx` | Child | Junior play: the map of 18 worlds and 79 levels, and the level player, in one Client Component (`src/components/junior/play/junior-play.tsx`) | Header "Junior" (`site-header.tsx:20`); the Junior card on the home page (`learning-paths.tsx:20-28`) |
| `/junior/quiz` | `src/app/junior/quiz/page.tsx` | Child | The older story-and-quiz pilot, "kept as an optional extra" (`:6`) | One link at the bottom of the Junior map (`junior-play.tsx:223-225`) |
| (all) | `src/app/layout.tsx` | Shared | `<html lang="en">`, fonts, `LanguageProvider`, header, footer (`:24-36`) | - |

There are no parent pages, no admin pages, no login page and no legal page.

Two small things the audit found:

- **The Junior card on the home page is out of date.** It says "story mission … Start Mission 1"
  (`learning-paths.tsx:25-27`), but `/junior` has been Junior play since the pilot moved to `/junior/quiz`
  (`docs/academy-junior-play.md:3-5`).
- **The footer hides its three outside links on Junior by checking the address**
  (`src/components/site-footer.tsx:17-18`, `:22`): "The Junior mission is for children: no links that leave the
  site on their path." If Junior is ever served at `/`, this check stops matching and children would see the links
  to YGOPRODeck, YGOProJudge and DuelingTCG (`site-footer.tsx:8-12`). A test guards the current behaviour
  (`src/components/site-footer.test.tsx:46-50`).

---

## 3. What is non-Junior today, and what depends on it

### 3.1 The key fact: Junior is self-contained

Every `@/…` import in `src/components/junior/**` and `src/lib/junior/**` that leaves the Junior folders goes to one
of two files: `@/lib/i18n/locales` and `@/lib/i18n/provider`. From the provider Junior reads only the current
language: `const { locale } = useLanguage()` (`junior-play.tsx:30`, `mission-one.tsx:32`). Junior has its own text
files (`src/lib/junior/play/copy-en.ts`, `copy-fr.ts`, `copy-he.ts`, `src/lib/junior/mission1-copy.ts`), its own
cards, engine and progress. Nothing in the beginner course imports Junior either. The two halves meet only in the
layout, the header, the footer and the home page.

### 3.2 Inventory

Sizes are counts of `.ts` / `.tsx` lines made on the day, for scale only.

| Thing | Where | Used by Junior? | Verdict |
| --- | --- | --- | --- |
| Beginner home page | `src/app/page.tsx` | No | **Replace** (the route `/` must still exist). |
| Course routes | `src/app/academy/**` (3 pages) | No | **Can be deleted.** |
| Lesson player, chapter cards, progress widgets | `src/components/academy/**` (8 files, about 650 lines) | No | **Can be deleted.** |
| Slide templates | `src/components/slides/**` (9 files, about 540 lines) | No | **Can be deleted.** |
| Schematic card, duel field, chain stack, timelines | `src/components/visuals/**` (7 files, about 1,000 lines) | No (Junior draws its own cards) | **Can be deleted.** |
| "Choose your path" section | `src/components/learning-paths.tsx` + test | No | **Can be deleted.** |
| Course content | `src/content/**` (35 files, about 4,600 lines; 4 chapters, 28 lessons) + `curriculum.test.ts` | No. One Junior test only writes the beginner storage key as a string to prove Junior leaves it alone (`src/components/junior/mission-one.test.tsx:230-233`); it imports nothing from the course | **Can be deleted.** |
| Lesson types, sample cards, swipe helper | `src/lib/lesson-types.ts`, `src/lib/sample-cards.ts`, `src/lib/swipe.ts` + test | No | **Can be deleted.** |
| Beginner progress store | `src/lib/progress.ts` + test; key `academy-ygo:progress:v1` (`:6`) | No | **Can be deleted** (see §3.4). |
| Lesson translations | `src/lib/i18n/fr-content.json` (319 KB), `he-content.json` (338 KB), `localize.ts` + test, `t.tsx` | No | **Can be deleted**, with a change to the provider (next row). |
| Language provider and switcher | `src/lib/i18n/provider.tsx` | **Yes** (`useLanguage`, and the switcher in the header) | **Keep, simplify.** Today it downloads the lesson translation file on every French or Hebrew visit, also on `/junior` (`provider.tsx:10-13`, `:37`, `:48-50`), although Junior never uses it. A children-only site can drop that download. |
| Languages, saved language | `src/lib/i18n/locales.ts`, `storage.ts` (+ tests); key `duel-academy-language` (`locales.ts:4`) | **Yes** | **Keep.** |
| Interface labels | `src/lib/i18n/ui.ts`, `ui-fr.ts`, `ui-he.ts` (90 lines each) | Only through the header and footer | **Keep, shrink** to the header, footer and language-switcher strings. |
| Translation coverage tests | `src/lib/i18n/coverage.test.ts` (reads `chapters` and both JSON files, `:2`, `:6-7`, `:22`, `:60-63`), `terminology-fr.test.ts` (reads `fr-content.json`), `extract-ui-strings.ts` + test | No | **Rework or delete.** Junior's own copy has its own tests (`src/lib/junior/play/copy.test.ts`). |
| Layout, global styles | `src/app/layout.tsx`, `src/app/globals.css` | **Yes** | **Keep.** `globals.css` has a `stage:` variant made for the lesson player (`globals.css:4`) that could go. |
| Header | `src/components/site-header.tsx` + test | **Yes** (shown on every page) | **Keep, change** (§5.4). |
| Footer | `src/components/site-footer.tsx` + test | **Yes** | **Keep, change** (§2, §5.3). |
| Brand strings | `src/lib/brand.ts` | Through the layout | **Keep, rewrite** tagline and description. |
| `cn` helper, `clsx` | `src/lib/cn.ts` | No (only the header and course use it) | Keep while the header uses it. |
| Packages `motion`, `lucide-react` | `package.json` | **Yes** | **Keep.** |

Rough scale **(ours)**: the beginner side is about 60 source files and about 6,800 lines plus 657 KB of translation
JSON. The Junior side is 46 files and about 10,800 lines. By a simple count of `it(` / `test(` calls, about 263
test cases are in Junior folders and about 57 outside them.

### 3.3 What does *not* exist (so nothing to migrate)

- **Database, accounts, login:** none. "Progress is stored locally in the browser … no account or backend" and "No
  app runtime env vars — the site is fully static" (`README.md`). `package.json` has no database, auth or analytics
  package.
- **Analytics:** none in `src/` or `package.json`.
- **SEO files:** no `robots`, `sitemap`, Open Graph image or manifest (§2). The only metadata is the title and
  description in `src/app/layout.tsx:14-17` and one title per page.
- **Links from other apps:** none. Outside the academy and `docs/`, the only mention is a code comment about
  Konami's own "Duel Academy" events (`apps/duel-nextjs/src/client/onboarding/course-decks.ts:7`).
- **CI:** `.github/workflows/academy-ygo.yaml` runs typecheck, tests and the Vercel build for the whole app; it
  names no route and needs no change.

### 3.4 Saved progress of existing beginner users

Beginner progress is one browser record, `academy-ygo:progress:v1` (`src/lib/progress.ts:6`). It never left the
visitor's device, so nobody "loses an account". After the course is removed, the record just stays unused in that
browser. It could be cleaned up with one line on load, but that is optional. Junior progress
(`academy-ygo:junior:play:v1`, `src/lib/junior/play/progress.ts:10`; `academy-ygo:junior:mission1:v1`,
`src/lib/junior/progress.ts:4`) and the saved language are not touched by any option below.

### 3.5 Documents that would go out of date

`apps/academy-ygo/README.md` (describes only the slide course), `docs/academy-french-terminology.md` (about the
course's French), `docs/academy-junior-play.md` and `docs/academy-junior-pilot.md` (routes and "back to the
Academy"). They would need a short update, not a rewrite.

---

## 4. What the beginner landing provides today, point by point

| Need | Today | For a Junior landing |
| --- | --- | --- |
| First-visit flow | Marketing page, then a choice of path (`src/app/page.tsx`) | The Junior map already shows where to start: levels open in order and the first is open (`docs/research/junior-3d-island-world.md` §1). A child who cannot read the page title still gets a big first button. No extra screen is needed **(ours)**. |
| Language choice | Switcher in the header on every page (`site-header.tsx:51`) | Keep it. See §5.2. |
| Login | None | None needed today. See §5.5. |
| Legal text | Two footer lines: unofficial project, not affiliated with Konami (`site-footer.tsx:44-45`), shown on Junior too (`site-footer.test.tsx:46-50`) | Keep. Add a parents' page (§5.3). |
| Navigation | Home / Beginner / Junior | Brand + language switcher only (§5.4). |

---

## 5. What a children-only landing needs

### 5.1 A landing that is the game, not a page about the game

The beginner home page explains the product to an adult. A child does not read that. The Junior map
(`junior-play.tsx`) can be the landing as it is. Text aimed at parents belongs on a separate parents' page.

### 5.2 Language: French, English, Hebrew

Works today without the beginner pages. The server sends `<html lang="en">` (`src/app/layout.tsx:26`); then the
browser picks the saved language, or the browser's language, or English (`src/lib/i18n/locales.ts:12-20`,
`provider.tsx:48-50`) and sets `lang` and `dir` (`provider.tsx:51-54`; Hebrew is right-to-left, `locales.ts:9-11`).

Two things to know:

- A French or Hebrew child sees English for a moment on first load, because the language is chosen in the browser.
  This is the same today.
- Search engines and link previews see only English, since the language is not in the address. Changing that
  (`/fr`, `/he`) is a separate, larger job and is not needed for this decision.

### 5.3 A page for parents (missing today)

The site has no page that says who runs it, what it stores and how to make contact. For a general site that is a
gap; for a site aimed only at children it is the first thing a parent or teacher looks for. Suggested content
**(ours)**: what the site is, that it is unofficial (the two footer lines), that progress stays in the browser and
nothing is sent (true today, §5.5), how to erase progress, a contact address, and the outside links that the footer
hides from children. [kids-interactive-academy.md](./kids-interactive-academy.md) §8.2 already suggested "a clearly
marked 'for parents and teachers' page". If option (c) is chosen, this page is also where the link to the old
course would live.

### 5.4 Header, title, description, 404

- **Header:** remove "Home" and "Beginner" (`site-header.tsx:17-20`). With one section left, a nav of one link is
  noise; keep the brand and the language switcher. Junior already has its own sound and calm buttons
  (`junior-play.tsx:104-123`).
- **"Back to home" inside Junior** (§1.1 row 6): remove the one on the map; the one in `/junior/quiz` should point
  at the map.
- **Title and description:** "Learn to Duel. Master the Rules." and "A visual … training presentation for beginners
  — full-screen educational slides…" (`src/lib/brand.ts:2-4`) describe the removed product. They need new text.
- **Page not found:** there is no `not-found` file, so a wrong address shows the framework's default page in
  English. Old `/academy/...` links would land there unless redirected (§6).

### 5.5 Privacy and consent for minors (brief; not legal advice)

**Today the site collects nothing itself.** No account, no analytics, no third-party script in `src/`; progress is
in `localStorage` (§3.3, §3.4). Making the site children-only does not change that.

What the texts say, so the owner knows where the lines are:

- **EU, GDPR Article 8** applies when *consent* is the legal basis for processing a child's personal data: "Where
  point (a) of Article 6(1) applies, in relation to the offer of information society services directly to a child,
  the processing of the personal data of a child shall be lawful where the child is at least 16 years old. Where
  the child is below the age of 16 years, such processing shall be lawful only if and to the extent that consent is
  given or authorised by the holder of parental responsibility over the child." Member States may set a lower age,
  "not below 13 years". The controller "shall make reasonable efforts to verify" it. Article 12(1) asks for "clear
  and plain language, in particular for any information addressed specifically to a child."
  (Regulation (EU) 2016/679, <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679>.)
- **France:** the age is fifteen. Below it, "le consentement est donné conjointement par le mineur concerné et le
  ou les titulaires de l'autorité parentale", and information must be "en des termes clairs et simples, aisément
  compréhensibles par le mineur" (loi n° 78-17 du 6 janvier 1978, article 45,
  <https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037823135>). The CNIL's own guidance pages could not
  be read (§9).
- **United States, COPPA:** the FTC's FAQ says the Rule applies to "operators of commercial websites and online
  services (including mobile apps and IoT devices) directed to children under 13" that collect personal
  information, and that "Foreign-based websites and online services must comply with COPPA if they are directed to
  children in the United States." The factors for "directed to children" include "the subject matter", "visual
  content" and "the use of animated characters or child-oriented activities and incentives". The same FAQ says data
  "stored on the device and … never transmitted" is not collected, and that the law covers commercial sites "and
  not … nonprofit entities". (<https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>.)
- **Israel:** no primary source could be read (§9).

What this means for the decision **(ours)**:

1. Today the site is "mixed audience with a children's section". After the change the **whole site** is plainly
   directed to children. That has no practical effect while nothing is collected.
2. It does matter later. Analytics, a parent login or child profiles on a server would then be added to a site
   that is 100% for children, so there is no "general audience" argument left. Those features are covered in
   [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §1.5 and §4.5,
   which advise a notice for parents and a lawyer before either.
3. A parent login is **not** needed for the landing page. If it comes, the parents' page of §5.3 is its natural
   entry, not the children's landing.

### 5.6 The island world as landing

[junior-3d-island-world.md](./junior-3d-island-world.md) §9 recommends a throwaway one-island test "on a separate
route so nothing existing is touched", and keeps the present list as the fallback. That fits this change: the
landing becomes "the Junior level-select", whatever it looks like. Do this change first with the present list; the
island can replace the list later without touching routes again **(ours)**. One extra point for a landing page:
the 3D engine is about 200 KB gzip plus the model (that note, §9, option C), and on a landing page it is paid on
the very first visit, so the list fallback and a fast first paint matter more than on an inner page.

---

## 6. Options

Effort is a rough estimate for one developer who knows this code **(ours)**. `redirects` in `next.config.ts` is
documented in the installed Next.js version
(`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`: `permanent: false`
gives a 307, `true` a 308 that browsers "cache … forever"). `AGENTS.md` asks to read those docs before writing
code, because this Next.js version differs from older ones.

| | (a) Redirect `/` to `/junior`, leave the course reachable but unlinked | (b) Junior is the site; delete the course | (c) Keep the course behind a small "for grown-ups" link |
| --- | --- | --- | --- |
| What changes | `/` redirects to `/junior`. Header loses "Home" and "Beginner". Junior loses "Back to home". New title and description. | Everything in (a), then delete all rows marked "Can be deleted" in §3.2, simplify the language provider, shrink the label files, add redirects for old `/academy` addresses, update docs. | Like (a), plus a parents' page with a link to `/academy`. The course keeps its own small header or breadcrumb. |
| Effort | About half a day | About 1.5 to 3 days in total (half a day for step 1, the rest for the deletion and the tests) | About 1 day, plus the cost of keeping the course alive |
| Existing URLs | All still work. `/` moves. | `/academy/...` stop working unless redirected to the landing. | All still work. |
| Saved progress | Nothing lost. | Beginner progress becomes unused (it only ever lived in the browser, §3.4). Junior progress untouched. | Nothing lost. |
| Tests that break | `site-header.test.tsx:22-34` (expects the three links). | Also: `learning-paths.test.tsx`, `curriculum.test.ts`, `progress.test.ts`, `swipe.test.ts`, `localize.test.ts`, `terminology-fr.test.ts` (deleted with their code); `coverage.test.ts` (rework); `site-footer.test.tsx:46-50` if Junior moves to `/`. | `site-header.test.tsx`; new tests for the parents' page. |
| Risk | Very low. Easy to undo. | Low. Junior imports nothing from the deleted code (§3.1), so the type checker will show any miss. The deletion is large but mechanical. | Low now, but a hidden course still has to pass 57 tests, keep 657 KB of translations and stay correct when rules change. A child can still reach adult pages with outside links. |
| Downsides | Dead code stays; French and Hebrew visitors still download the unused lesson translations (§3.2); the course is still public for anyone with the address, with outside links in its footer. | The course is gone from the site (still in git history). | The site is not "only for children". |
| Fits the request? | Half: the landing is Junior, but the course is not removed. | **Yes.** | No, unless the owner wants the narrow reading of §1.2. |

### Recommendation (ours)

**Option (b), reached through (a).** The request says "remove" and "only for children", and the audit shows the
removal is safe. Doing (a) first gives a visible result in half a day and a clean point to stop and look.

Safest order of work:

1. **Make Junior the landing** (this is option (a)). Keep Junior at `/junior` and send `/` there with a
   *temporary* redirect. Keeping the address means the footer's "no outside links for children" check, the Junior
   tests and the Junior docs all stay valid. Use a temporary redirect, not a permanent one, so browsers do not
   remember it if the island world later takes `/`.
2. **Header and links:** remove "Home" and "Beginner"; fix the "Back to home" links; update
   `site-header.test.tsx`.
3. **New title, tagline and description** in `src/lib/brand.ts`, in the three languages where they are shown.
4. **Stop here and look at the site.** Everything up to this point can be undone in minutes.
5. **Delete the course:** routes first (`src/app/academy/**`), then components, content and helpers; let the type
   checker and the tests show what is left. Then simplify `provider.tsx` (no lesson translation download), shrink
   `ui-fr.ts` / `ui-he.ts`, rework `coverage.test.ts`.
6. **Old addresses:** redirect `/academy` and `/academy/:path*` to the landing, and add a simple, friendly
   `not-found` page in the three languages.
7. **Parents' page** (§5.3) and the footer rule: once the whole site is for children, the footer should hide
   outside links everywhere and the parents' page should carry them.
8. **Docs:** `README.md`, `docs/academy-junior-play.md`, `docs/academy-junior-pilot.md`,
   `docs/academy-french-terminology.md`.
9. **Later, separately:** decide whether Junior moves from `/junior` to `/` (cosmetic), and the island world.

Other sessions are editing Junior files right now (five modified files in `git status` on the day). Steps 1 to 3
touch the header, the brand file and two Junior files; step 5 touches no Junior file.

---

## 7. Open questions for the owner

1. **Do we read "accueil débutant" correctly?** We think it means the home page ("Accueil") **and** the beginner
   course ("Débutant"), both removed. Yes or no?
2. **Delete the beginner course, or only hide it?** Deleting is cleaner. The old code stays in git history, so it
   can come back. Hiding keeps work to maintain.
3. **Old links to `/academy/...`:** send them to the Junior landing, or show "page not found"? Was the address of
   the course shared anywhere (school, friends, social networks)?
4. **Keep the name "Duel Academy"?** And what should the new short sentence under the name say, for children and
   parents? (The current one talks about slides for beginners.)
5. **Should the address stay `/junior`, or should the game be directly at `/`?** It changes nothing for children;
   `/junior` is less work and safer today.
6. **Keep the old quiz (`/junior/quiz`)?** It is only linked from the bottom of the Junior map.
7. **Do you want a small page for parents?** (Who made the site, what is stored, contact, outside links.) If yes:
   which contact e-mail, and in which languages?
8. **Outside links** (YGOPRODeck, YGOProJudge, DuelingTCG): today children do not see them on Junior. Remove them
   from the whole site, or keep them only on the parents' page?
9. **What ages exactly?** The site says "Ages 8 to 12" today. Is that still right? It matters for the wording and,
   later, for the law.
10. **Which countries are the children in?** France and Israel, others, the United States? (Still open from the
    earlier notes.)
11. **Is the site commercial in any way** (ads, shop links, a paid part, a link to the duel app)? (Still open from
    the earlier notes; the US rule depends on it.)
12. **Should the island world be the landing later?** If yes, we keep the first redirect temporary, as proposed.

---

## 8. What was checked and how

- Routes: listing of `src/app` (8 files). SEO and proxy files: searched by name at the app root and under `src/`.
- Dependencies between Junior and the rest: every `from "@/…"` import under `src/components/junior` and
  `src/lib/junior`, and every mention of `junior` outside those folders.
- Storage keys: search for `localStorage`, `STORAGE_KEY`, `_KEY =` in `src/`.
- Links from other workspaces: search for `academy-ygo`, `Duel Academy`, `localhost:3220` across the repo outside
  the app and `docs/research/`.
- Line and file counts: `wc` on the day; test counts by counting `it(` and `test(` (an approximation).

---

## 9. Unverified / could not confirm

- **CNIL (France):** the pages with the eight recommendations for minors online, including the one on parental
  consent below fifteen, returned HTTP 503 on two addresses. Only the law's text on Légifrance is cited.
- **Israel:** the Privacy Protection Authority's site returned HTTP 403. Nothing about Israeli law is stated here.
- **COPPA:** only the FTC's FAQ was read, not the Rule's text (16 CFR part 312) or its 2025 amendment. Quotations
  from the FAQ and from EUR-Lex were returned by a fetch tool in short segments; the wording matches the earlier
  notes but was not compared against a second copy.
- **Which GDPR legal basis applies to hosting logs** (the host sees IP addresses) was not looked at; the earlier
  note [kids-interactive-academy.md](./kids-interactive-academy.md) §13 lists it as unverified too.
- **Browser voice:** Junior can read lines aloud (`src/lib/junior/play/sound.ts`). Whether a given browser sends the
  text to an online voice service was not checked.
- **Production address and traffic:** the repo does not say which domain the academy is served on (an older open
  question asks about a custom domain, `docs/open-questions/2026-11-15-01h46.md`), whether search engines indexed
  `/academy`, or how many people use the course. So "what breaks for existing users" is answered for the code, not
  for real visitors.
- **Nothing was run.** The claim that the type checker and tests will catch a missed import in step 5 is how these
  tools normally behave, not something tried here.
- **Effort figures** are estimates, not measurements.

---

## Appendix: sources consulted (all accessed 2026-11-19)

- Regulation (EU) 2016/679, Articles 8 and 12(1): <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679>
- Loi n° 78-17 du 6 janvier 1978, article 45: <https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037823135>
- FTC, "Complying with COPPA: Frequently Asked Questions": <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>
- Next.js docs shipped with the installed package: `apps/academy-ygo/node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`
- Repo files named in the text, and the notes `junior-3d-island-world.md`, `academy-analytics-animation-rewards-login.md`,
  `kids-interactive-academy.md`, `junior-mode-playful-learning.md`, `docs/academy-junior-play.md`,
  `docs/academy-junior-pilot.md`.

## Owner decisions (2026-11-19)

Answers given by the owner after reading the summary of this note. They replace the matching open questions above.

- **Home page:** `/` becomes a real landing page focused on Junior, built to make visitors click into the game. It is not a bare redirect to `/junior`.
- **Beginner course:** the site is for children only (owner's original request: "remove accueil débutant and keep only for children the website"). Reading (ours): the course at `/academy` is removed, not only unlinked. To confirm before any deletion.
- **Parents' page:** none for now.
- **Outside links** (YGOPRODeck, YGOProJudge, DuelingTCG): they can stay.
- **Name:** "Duel Academy" is kept (owner answered "go"; reading ours).
- **Ages 8 to 12:** still right.

Consequence (ours): because outside links stay and there is no parents' page, steps 6 and 7 of the recommended order shrink to the `/academy/**` redirects and a `not-found` page. The footer check on `/junior` (`site-footer.tsx:17-18`) still decides where children see outside links, so it must be looked at again if the Junior landing at `/` should hide them.
