# Academy Junior: analytics on Vercel, card-effect animations, rewards and progression, parent login

> **Date of observation:** 2026-11-18. Every web page and API record cited below was fetched that day, unless a line
> says otherwise. The repository was read on `main` at HEAD `cd07378`. Other sessions may have been editing the tree;
> code claims describe the files as they stood that day.
> **Nature of this document:** a research note. No code was changed, nothing was installed, run or published.
>
> **The request (owner, verbatim):**
>
> 1. "Would like to put some analytics to see what happens with children. Could it be done with Vercel ? Yes go for
>    research. No so skip."
> 2. "Would like more animation instead of reading the card. A card that add 500 health point, should show a nice
>    animation with the card increasing hp. A thunder card destroying monster, it will be a thunder."
> 3. "It's nice to have so much lessons for children but some children can be piss to not achieve something and just
>    pass to a mission after another mission. Should think how reward and do a nice progression for children."
> 4. "Parents that have multiple children playing and progression. Would like to do something with login. Is it
>    possible ?"
>
> **Sourcing rule used:** each external claim is followed by the source that owns it (the vendor's own docs or
> source, the regulator's own text, the paper by DOI). Claims about this repo cite `file:line`. Papers say how much
> was read: **[abstract]** means the abstract only, through `api.openalex.org`. Proposals and inferences are
> labelled **(ours)**. Whatever could not be confirmed at a primary source is listed in
> [§7](#7-unverified--could-not-confirm) and is not stated as fact.
>
> **This is not legal advice.** §1.5 and §4.4 report what the regulators publish. A product for children that
> stores or sends data needs a qualified lawyer before launch.
>
> **Relation to existing notes.** [kids-interactive-academy.md](./kids-interactive-academy.md) (§8.2 children's
> privacy) and [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) (§3.3 rewards, §5 animation
> libraries and licences) already cover part of this ground. This note cites them instead of repeating them, and says
> where it changes their position: both said "no analytics, no account". Questions 1 and 4 reverse that, so the
> conditions matter.

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | Analytics with Vercel? | **Yes.** The academy is a Vercel project. Page views work on any plan; the per-mission events that answer the owner's question need the **Pro** plan (custom events are not on Hobby). It gives anonymous totals, not the path of one child. A privacy notice for parents is needed first. |
| 2 | Animations instead of reading the card? | **Yes, and cheaply.** The Junior engine already emits one typed event per thing that happens (`gained`, `destroyed`, `lp`, ...). The animation library (`motion`) is already installed. No new dependency and no bought asset is needed. Keep the one text line for accessibility. |
| 3 | Rewards and progression? | **Yes, with care.** The app already has stars, an album, rule mastery and two certificates. The gaps found: levels unlock strictly one by one (a stuck child has no way round), and the Hint button gives every move (a child can finish all 74 levels without learning). The research supports small, informative, unexpected rewards and argues against streaks and promised prizes. |
| 4 | Parent login with several children? | **Possible, but it is the expensive one.** The academy has no server, database or login today. Several children on one device can be done with no account at all (local profiles). Progress across devices needs a parent account, a database and parental-consent duties. Do the local profiles first. |

**One finding to read before anything else:** the phrase "offline mode" in the task does not apply to the academy.
The offline mode lives in the other app, `apps/duel-nextjs` (`apps/duel-nextjs/scripts/build-offline-shell.mjs`,
`apps/duel-nextjs/src/client/offline/`). `apps/academy-ygo/src` has no service worker and no manifest (searched for
`serviceWorker`, `manifest`, `navigator.onLine`: no match). The academy keeps working after load because it is static
and stores progress in `localStorage`, but it cannot be opened without a connection.

---

## 1. Analytics with Vercel

### 1.1 Can it be done? Yes

- The academy is its own Vercel project, `academy-ygo`, Root Directory `apps/academy-ygo`, built on the GitHub runner
  and uploaded with `vercel pull` / `vercel build` / `vercel deploy --prebuilt`
  (`apps/academy-ygo/README.md`, section "Deploy"; `.github/workflows/academy-ygo.yaml`; `apps/academy-ygo/vercel.json`).
- It is Next.js `16.3.2` with the App Router and React `19.2.8` (`apps/academy-ygo/package.json`). Vercel documents
  this case: install `@vercel/analytics`, add `<Analytics />` from `@vercel/analytics/next` to the root layout, and
  enable Web Analytics in the dashboard (<https://vercel.com/docs/analytics/quickstart>, `last_updated` 2026-06-08).
  The root layout is `apps/academy-ygo/src/app/layout.tsx:24-35`.
- No analytics exists today in either app (no `@vercel/analytics`, `speed-insights`, `gtag`, `posthog` or `plausible`
  in `apps/academy-ygo` or `apps/duel-nextjs` sources and `package.json`).
- One thing to check on the first deploy: version 2 of the package gets its script and intake URLs from a build-time
  configuration that "Vercel configures ... for you" (<https://vercel.com/docs/analytics/package>, "Dynamic
  configuration"). The docs do not say whether a build made on a GitHub runner with `vercel build` receives it the
  same way (§7). The quickstart's test is a request to `/<unique-path>/view` in the Network tab.

### 1.2 Plans, prices and limits (Vercel's own pricing page)

Source: <https://vercel.com/docs/analytics/limits-and-pricing> (`last_updated` 2026-08-25) and
<https://vercel.com/docs/analytics/custom-events> (`last_updated` 2026-06-26).

| | Hobby | Pro | Pro + Web Analytics Plus |
| --- | --- | --- | --- |
| Events | 50,000 / month included; collection pauses beyond | $0.03 per 1,000 events | $0.03 per 1,000 events |
| Custom events | **Not available** | Included | Included |
| Properties per custom event | none | **2** | 8 |
| Reporting window | 1 month | 12 months | 24 months |
| Add-on price | | | $10 / month per team |

- "Custom Events are available on Enterprise and Pro plans" (custom-events page). An event is "either an
  automatically tracked page view or a custom event"; usage is shared across all projects of the account.
- Custom data limits: "Nested objects are not supported", allowed values are strings, numbers, booleans and null, and
  no event name, key or value "longer than 255 characters".
- Which plan the owner's Vercel account is on is not in the repo (§6).
- Cost order of magnitude **(ours)**: a child who plays all 74 levels with about four events per level sends about
  300 events, under one cent at the Pro rate.

**What Hobby alone would show.** Only page views. Junior play is one route: `/junior` renders `JuniorPlay`
(`apps/academy-ygo/src/app/junior/page.tsx`), and the open level is React state, not a URL
(`apps/academy-ygo/src/components/junior/play/junior-play.tsx:35`, `:90-93`). So on Hobby the dashboard would say
how many visits `/junior` had and nothing about missions. A way to get a funnel without custom events **(ours)**: give
each level its own path (for example `/junior/<level-id>`), so that page views per path become the funnel. That is a
routing change, not a small one.

### 1.3 What it can and cannot answer about children

Vercel's privacy page says the data is "used for aggregated statistics only" and that a visitor is "identified by a
hash created from the incoming request", whose session "is automatically discarded after 24 hours"
(<https://vercel.com/docs/analytics/privacy-policy>, `last_updated` 2026-06-26). From that, and from the property
limits above **(ours)**:

| Question | Answerable? | How |
| --- | --- | --- |
| How many children start and finish each level (drop-off per level) | Yes | Count of `level_start` against `level_solved`, split by the level property. |
| Which level loses the most children | Yes | Same counts, read as a funnel by hand. No built-in funnel feature was seen on the pages read (§7). |
| How often a level is failed, hinted, retried | Yes, as totals | One event per fail and per hint, or a bucketed `tries` property on `level_solved`. |
| Which rule children break most | Yes | `slip` events with the rule as the property. |
| Time spent on a level | Only as a bucket we send | A property such as `time: "1-3min"`. Vercel does not measure it. |
| What one child did across a week | **No** | No lasting identifier: the visitor hash is discarded after 24 hours. |
| Do children come back the next day | **No** | Same reason. |
| Per-child or per-family reports | **No**, and it should not be done here | See §4.5. |

### 1.4 What is stored, and the offline case

- **No cookie.** "without using any third-party cookies, instead end users are identified by a hash created from the
  incoming request" (privacy page). The page does not say what the hash is made of (§7).
- **Stored with every data point** (privacy page table): event timestamp, URL, dynamic path, referrer, filtered query
  parameters, geolocation (country, region, city), device OS and version, browser and version, device type, script
  version.
- **The package itself writes nothing to cookies or `localStorage`** and has no retry or offline queue in its entry
  file; `track()` only pushes onto `window.va` (source:
  <https://raw.githubusercontent.com/vercel/analytics/main/packages/web/src/generic.ts>). The script that Vercel
  serves was not read, so whether an event made without a connection is retried is unknown (§7). Assume it is lost
  **(ours)**. For the academy this matters little today, since the academy has no offline mode (§0).
- **`beforeSend`** can change or drop any event; "Returning `null` will ignore the event and no data will be sent"
  (<https://vercel.com/docs/analytics/package>). This is the hook for a parent's opt-out switch **(ours)**.
- **Custom events must not carry personal information.** Vercel: "you may want to prevent sending sensitive or
  personal information, such as email addresses, to Vercel" (privacy page). For this app: never a nickname, a
  profile id, or free text **(ours)**.

### 1.5 Children's privacy: what the regulators' texts say

Vercel's privacy page makes no statement about children or COPPA; it says the product is "designed ... to align with
leading data protection authority guidance" and that recording is "anonymous". That is Vercel's description, not a
regulator's finding.

- **United States, COPPA (16 CFR part 312,
  <https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312>, read through the eCFR renderer;
  FTC FAQ <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>).**
  - It applies to "commercial" sites directed to children; "Foreign-based websites and online services must comply
    with COPPA if they are directed to children in the United States" (FAQ B.7). Whether the academy is commercial
    is an open question from both earlier notes (§6).
  - Personal information includes persistent identifiers such as "a customer number held in a cookie, an IP address"
    (FAQ C.5; § 312.2).
  - There is an exception from parental consent "Where an operator collects a persistent identifier and no other
    personal information" and uses it "for the sole purpose of providing support for the internal operations of the
    website" (§ 312.5(c)(7)). Internal operations include activities that "maintain or analyze its functioning"
    (FAQ J.5 to J.7), and not behavioural advertising (FAQ J.8). The exception still requires the online notice.
  - The site answers for third parties: "you are responsible for the collection of personal information from your
    users, no matter who is doing the collection" (FAQ D.9).
  - Reading **(ours)**: aggregate level counts through Vercel fit the internal-operations exception, provided no
    other personal information is collected and a privacy notice says so. This needs a lawyer's confirmation.
- **European Union, GDPR.** Article 8 (parental consent below 16, or a national age not below 13) applies when
  consent is the legal basis; quoted in [kids-interactive-academy.md](./kids-interactive-academy.md) §8.2 from
  EUR-Lex. Recital 30 names internet protocol addresses as online identifiers, and Recital 38 says "Children merit
  specific protection with regard to their personal data, as they may be less aware of the risks"
  (<https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679>). Analytics without consent would
  rest on another legal basis, legitimate interests, whose text gives extra weight to the data subject being a child
  (Article 6(1)(f); not re-read today, §7).
- **France.** The age is fifteen. Below it, consent "est donné conjointement par le mineur concerné et le ou les
  titulaires de l'autorité parentale", and information must be in "termes clairs et simples, aisément
  compréhensibles par le mineur" (Loi n° 78-17, article 45,
  <https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037823135>). The CNIL's conditions for audience
  measurement without consent could not be read (HTTP 503, §7), so whether Vercel's method qualifies in France is
  **not established here**.
- **Israel.** No primary source could be read (the Privacy Protection Authority's site refused the request). See §7.

**Consequences (ours).**

1. Write a short privacy notice for parents before turning anything on. Today the docs promise "Nothing is sent
   anywhere" (`docs/academy-junior-play.md:42`) and the code comment says "Progress lives in this browser only"
   (`junior-play.tsx:27`). Analytics changes that promise.
2. Send only level ids, rule ids and buckets. No free text, no profile.
3. Add an "off" switch for parents, wired to `beforeSend`.
4. Consider the cheaper first step in §5: watch three to five children play. `docs/academy-junior-play.md:151`
   says the course was "Not tried with children".

### 1.6 Proposed event list, mapped to the real structure

The structure: 17 worlds (`WORLD_IDS`, `apps/academy-ygo/src/lib/junior/play/levels.ts:8`), 74 levels each with an
`id`, a `world`, an optional `teaches` rule and `uses` rules (`levels.ts:36-57`), 28 rules (`RULE_IDS`,
`levels.ts:5`). One try already produces the numbers needed: `Outcome { tries, firstTry, clean, hints, slips }`
(`session.ts:246-257`), the fail reason (`session.ts:19`) and each refused move's rule (`session.ts:94`).

Designed for the Pro limit of two properties **(ours)**:

| Event | When (code seam) | Property 1 | Property 2 |
| --- | --- | --- | --- |
| `level_start` | `open(id)` in `junior-play.tsx:90-93` | `level` (id) | `replay` (boolean: already solved) |
| `level_solved` | `onSolved` in `junior-play.tsx:94` | `level` | `how`: `first_try`, `clean`, `hinted` |
| `level_failed` | status becomes `failed` (`session.ts:71`) | `level` | `reason` (`FailReason`) |
| `level_left` | "Back to the map" before solving (`onExit`) | `level` | `tries` bucket: `1`, `2-3`, `4+` |
| `slip` | a refused move (`session.ts:94`) | `level` | `rule` (the `Reason`) |
| `hint` | `showHint` (`level-player.tsx:132-138`) | `level` | `auto` (boolean: shown after three fails, `level-player.tsx:140`) |
| `demo` | the "Watch first" theatre opens or is skipped | `rule` | `how`: `auto`, `asked`, `skipped` |
| `certificate` | the certificate is shown or printed (`level-player.tsx:561-565`) | `level` | `printed` (boolean) |
| `setting` | calm or sound toggled (`junior-play.tsx:104`, `:114-117`) | `name` | `on` (boolean) |

The language can be added by sending it inside `how` or as a separate rare event, since two properties are full. With
the Plus add-on (8 properties) `locale`, `world` and `tries` fit on every event.

For the slide-based adult academy the natural events are `lesson_start` and `lesson_done` with `chapter` and
`lesson`, taken from `saveLessonProgress` (`apps/academy-ygo/src/lib/progress.ts:58-83`). Those lessons are separate
routes (`src/app/academy/[chapter]/[lesson]/page.tsx`), so page views already show most of it on any plan.

**Alternative without Vercel's custom events (ours).** `apps/duel-nextjs` already records course statistics itself,
on the user's row (`apps/duel-nextjs/src/server/auth/course-stats.ts:11`). The academy could do the same only after
it has a server, which is question 4.

---

## 2. Card-effect animations

### 2.1 How an effect is presented today

- **The "reading" step.** After each move the player shows one sentence built from the engine's events:
  `narrateAll(copy, session.events)` (`level-player.tsx:87`), rendered in the `aria-live` box
  (`level-player.tsx:407-412`). For a Life Point gain the sentence is "You gain 500 Life Points: 4500 now."
  (`copy-en.ts:423-424`); for a destruction "... is destroyed and goes to the Graveyard." (`copy-en.ts:427-428`).
- **The card's own text** is printed in the reader panel when a card is picked (`level-player.tsx:430-445`).
- **What already moves:** a card scaling in when it lands and rotating to Defense Position
  (`mini-board.tsx:207`, `:286`), the battle banner with the subtraction (`ClashBanner`, `mini-board.tsx:476-510`),
  and the Life Point bar, a CSS width transition of 700 ms (`mini-board.tsx:169`). Sound is a Web Audio tone per kind
  of event (`level-player.tsx:100-104`).
- **What does not move:** a Spell or Trap effect. A destroyed monster simply is not in the next board. Nothing links
  the card that was played to its result. The owner's two examples exist as cards: `glow-charm`, "gain 500 LP"
  (`cards.ts:133`) and `thunder-clap`, "destroy" (`cards.ts:135`).

### 2.2 What the engine exposes

Everything an animation layer needs is already typed. `apply(board, move)` returns the next board and a list of
`GameEvent` (`engine.ts:227`). The events (`engine.ts:170-223`) include:

- `activated { side, card, target? }`, `chain`, `resolve { link, card }`: which card is acting.
- `gained { side, amount, lp }` and `lp { side, from, to }`: the Life Point change with both numbers.
- `boosted { side, card, amount, atk }`: ATK up or down.
- `destroyed { side, card }`, `banished { side, cards, faceDown }`, `returned`, `to-extra`, `detached`.
- `special { how: "revive" | "ritual" | "fusion" | "synchro" | "xyz" | "link" | "own", materials }`, `summoned`,
  `pendulum`, `scale`, `field`.
- `battle { attackerValue, defenderValue, damage, destroyed }`, `direct`, `attack-stopped`, `sprung`.

Each Spell and Trap also has a typed effect category (`Effect`, `cards.ts:4-36`): `gain-lp`, `boost`, `destroy`,
`destroy-all`, `destroy-lowest`, `destroy-attacker`, `banish-attacker`, `weaken-attacker`, `stop-attack`,
`return-to-hand`, `revive`, `field-boost`, `draw`, `draw-then-gift`, `ritual`, `fusion`.

Two gaps **(ours)**:

1. `destroyed` carries the card but not its zone or its cause. The zone can be found in the board before the move
   (the session keeps earlier boards in `past`, `session.ts:51`). The cause is the card of the preceding `activated`
   or `resolve` event. Adding `zone` and `by` to the event would be cleaner; that is an engine change.
2. All events of one move arrive together and are narrated as one sentence. Animations need an order and a pace:
   a small queue that plays cue after cue, then shows the sentence.

### 2.3 Options for this stack

| Option | Cost in bundle | Reduced motion | Fit |
| --- | --- | --- | --- |
| **CSS keyframes / Web Animations API** | None. `Element.animate()` is "one of the most performant ways to animate on the Web, letting the browser make its own internal optimizations" (<https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API>). | Already handled: `globals.css:127` cuts every animation and transition under `prefers-reduced-motion`, and the page sets `data-motion` (`junior-play.tsx:100`). | Flashes, glows, a bolt drawn by `stroke-dashoffset`, a floating "+500". |
| **`motion`** (installed, `^14.0.0`, `apps/academy-ygo/package.json`) | Already paid: `mini-board.tsx:3` imports `motion`, which cannot be tree-shaken below "43kb". `useAnimate` adds 3.3 kb (mini, WAAPI only) or 23 kb (hybrid, sequences and motion values) (<https://motion.dev/docs/react-reduce-bundle-size>; the page gives no date or version). | `MotionConfig reducedMotion` is already set from calm mode and the device (`junior-play.tsx:99`). Note: it disables "transform and layout animations, while preserving ... `opacity` and `backgroundColor`" (<https://motion.dev/docs/react-accessibility>), so a flash made of opacity must also check the `moving` flag. | Sequenced cues, a counting Life Point number (a motion value), exit animations for destroyed cards (`AnimatePresence`, not used yet). **Recommended.** |
| **Lottie / dotLottie** | A player plus one file per effect. Sizes not verified (§7). | Must be handled by us. | Ready-made effects. Licence and originality concerns: see [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) §5.2. |
| **Rive** | A WebAssembly runtime. Rive's web page shows it loaded from unpkg (<https://rive.app/docs/runtimes/web/web-js>); it would have to be self-hosted to avoid a third-party request from a children's page. Sizes not stated on that page (§7). | The page "doesn't mention reduced motion". | Reactive characters. Too much for effects. |
| **Canvas particles** (`canvas-confetti`, Pixi) | New dependency or a large one. | Ours to handle. | A win celebration at most. The earlier note advises against a canvas board. |

**Recommendation (ours):** `motion` plus CSS and inline SVG, drawn by us. No new dependency, no downloaded asset,
works with the existing calm mode, and nothing is fetched from a third party.

### 2.4 Proposed mapping: effect category to animation (ours)

| Engine event (and card category) | Animation | Notes |
| --- | --- | --- |
| `activated` (any Spell or Trap) | The card lifts from the hand or flips in its zone and glows for half a second. | Shows which card acts. Links cause to effect. |
| `gained` (`gain-lp`, `draw-then-gift`) | Sparkles travel from the card to the lantern; the number counts from the old value to the new one; a green "+500" floats up; the bar fills. | The owner's first example. `gained.amount` and `gained.lp` give both numbers. |
| `lp` going down (`battle`, `direct`, `trigger`) | The lantern shakes once; a red "−500"; the number counts down. | The bar already drains. |
| `destroyed` after `destroy`, `destroy-all`, `destroy-lowest` | A bolt drawn from the top of the board to the zone, one white flash on that zone, the card cracks and slides to the Graveyard pile. | The owner's second example. For `destroy-all`, the bolts go one zone after another. |
| `destroyed` after `destroy-attacker` (Sakuretsu Armor) | A burst at the attacker's zone, then the same slide to the Graveyard. | Different picture, same ending, so "destroyed" always looks the same. |
| `destroyed` in `battle` | Keep the clash banner; add the same crack and slide. | |
| `banished` (`banish-attacker`, Pot of Desires cost) | The card shrinks into a swirl and lands on the banished pile, not the Graveyard. | The rule taught in world 9 is exactly this difference. |
| `boosted` (`boost`, `weaken-attacker`, `field-boost`) | The ATK number ticks up (gold) or down (grey) with a small arrow. | |
| `attack-stopped` (`stop-attack`) | The attacker moves forward and bounces back off a vine. | |
| `returned` (`return-to-hand`) | The card slides from its zone back to the hand. | |
| `special` with `how: "revive"` | The card rises from the Graveyard pile to its zone. | |
| `special` with `fusion`, `ritual`, `synchro`, `xyz`, `link` | The materials slide together into one point; the new monster appears there. Xyz: the materials slide under it. | Shows where materials go, which worlds 10 to 14 teach. |
| `chain` / `resolve` | Already shown by the turtle tower. Play each link's effect as it resolves. | |

Rules for all of them **(ours, from the cited limits)**:

- **One flash, never a strobe.** WCAG 2.3.1 (Level A): "Web pages do not contain anything that flashes more than
  three times in any one second period" (<https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html>).
  A thunder effect is where this is easiest to break. One flash, on one zone, not the whole screen.
- **Keep the sentence.** The `aria-live` line is how a screen reader and calm mode get the result. Show it after the
  motion, not instead of it. This also matches the finding that animation teaches best without a paragraph beside it
  ([junior-mode-playful-learning.md](./junior-mode-playful-learning.md) §5.1).
- **Short.** About one second per cue, and a tap skips it. The demonstrations wait for a tap already.
- **Evidence caveat.** Effects make a game look better; they do not reliably make children learn or play better
  (Hicks et al. 2019, and the "seductive details" review, both in the earlier note §3.3 and §5.1). The effects above
  are all "representational": each shows what the rule did. A purely decorative effect is the kind to avoid.

### 2.5 Where the seam goes (ours)

1. A pure function in `src/lib/junior/play/`, for example `effectCues(events, boardBefore, boardAfter)`, returning a
   list of cues (`{ kind: "lp-gain", side, from, to }`, `{ kind: "bolt", side, zone }`, ...). It is testable the same
   way as the engine, with no rendering.
2. One component, a sibling of `ClashBanner`, placed over the board at `level-player.tsx:402-405` and in the
   demonstrations at `demo-theatre.tsx:47-49`. It receives the cues and the `moving` flag and plays them in order.
3. `Lantern` (`mini-board.tsx:159-173`) gets the counting number. Zones get an exit animation.
4. `sound.ts` already makes tones with Web Audio and no audio file; a thunder sound can be a short noise burst made
   the same way.

### 2.6 Asset licensing

- Card pictures today are emoji characters drawn by the device's own font (`cards.ts`, `art` fields), so no image is
  shipped. The same holds for effects drawn as our own SVG and CSS.
- Do not copy Konami's card art, anime effects or sounds: see [kids-interactive-academy.md](./kids-interactive-academy.md)
  §8.1 and [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) §6.4.
- A downloaded Lottie or Rive file brings its own licence and an uploader's claim of originality (earlier note
  §5.2). Drawing the dozen effects ourselves avoids the question.

---

## 3. Rewards and progression

### 3.1 What exists today

| Mechanic | Where |
| --- | --- |
| A level is marked solved (check) or solved without a hint (star) | `junior-play.tsx:169`, `:179`; `LevelRecord { clean, firstTry }`, `progress.ts:13-18` |
| "Solved on the first try" is stored, shown only on the result line | `progress.ts:17`; `level-player.tsx:417-420` |
| After a hinted solve: "Solved with a hint. Play it again to earn the star." | `copy-en.ts:293` |
| Levels unlock strictly in order, one at a time, across all 17 worlds | `isUnlocked`, `progress.ts:106-111` |
| A list of the 28 rules: not met, met, "used again without help" | `ruleMastery`, `progress.ts:116-127`; `junior-play.tsx:188-205` |
| An album of the cards from solved levels | `album`, `progress.ts:129-139`; `junior-play.tsx:206-221` |
| A printable certificate after the two whole duels (worlds 7 and 17) | `level-player.tsx:556-566` |
| The Hint button shows the next move of a solving line | `hint`, `session.ts:237-239`; `level-player.tsx:132-138` |
| After three failed tries the next move is shown without asking | `level-player.tsx:140` |
| "Show me" replays the demonstration | `level-player.tsx`, near line 590 |
| How often each rule was broken is stored, and no screen uses it | `slips`, `progress.ts:23-24`; not read in `junior-play.tsx` |
| No timer, streak, score or leaderboard, by design | `docs/academy-junior-play.md:43` |

Two gaps follow from the code **(ours)**. They match the two ways to read the owner's sentence (§6, question 5):

- **A stuck child cannot go on.** With one level open at a time, a child who cannot solve level 12 sees 62 locked
  buttons. The only way forward is the Hint button.
- **A hurried child can pass everything.** Pressing Hint repeatedly gives every move of every level. Such a child
  finishes the course with check marks and no stars, having practised nothing. The research has a name for this.

### 3.2 What the research says, and how strong it is

| Finding | Source | Strength |
| --- | --- | --- |
| Children who were promised a reward for an activity they already liked chose it less afterwards. Children who got the same reward as a surprise did not. | Lepper, Greene & Nisbett 1973, *J. Pers. Soc. Psychol.* 28(1), DOI [10.1037/h0035519](https://doi.org/10.1037/h0035519) **[abstract]** | One field experiment with preschool children and drawing. Classic and often replicated in spirit, but far from a learning game. |
| Across 128 experiments, expected tangible rewards lowered free-choice interest, more for children; positive feedback raised it. | Deci, Koestner & Ryan 1999, DOI [10.1037/0033-2909.125.6.627](https://doi.org/10.1037/0033-2909.125.6.627), quoted in [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) §3.3 **[abstract]** | Strong for laboratory rewards. Disputed: Cameron, Banko & Pierce 2001 answered under the title "Pervasive negative effects of rewards on intrinsic motivation: The myth continues" (DOI [10.1007/BF03392017](https://doi.org/10.1007/BF03392017); title only, not read, §7). Transfer to in-game stars is an inference. |
| People keep going when three needs are met: "competence, autonomy, and relatedness". | Ryan & Deci 2000, *American Psychologist* 55(1), DOI [10.1037/0003-066X.55.1.68](https://doi.org/10.1037/0003-066X.55.1.68) **[abstract]**; applied to video games in Przybylski, Rigby & Ryan 2010, DOI [10.1037/a0019440](https://doi.org/10.1037/a0019440) **[abstract]** | A theory with broad support, not a recipe. It tells what to check a reward against. |
| Gamification (points, badges and the like) has small positive effects on learning (g = .49), motivation (g = .36) and behaviour (g = .25); the motivation and behaviour effects were "less stable" in the rigorous studies. Game fiction helped. | Sailer & Homner 2020, *Educ. Psychol. Rev.*, DOI [10.1007/s10648-019-09498-w](https://doi.org/10.1007/s10648-019-09498-w) **[abstract]** | Meta-analysis, mostly older students. Says gamification can work, not which element. |
| Mastery learning (move on only after showing mastery) improves results, "stronger on the weaker students", but "may increase student time", and self-paced versions "often reduce the completion rates". | Kulik, Kulik & Bangert-Drowns 1990, *Rev. Educ. Res.* 60(2), DOI [10.3102/00346543060002265](https://doi.org/10.3102/00346543060002265) **[abstract]** | Meta-analysis of 108 studies, classrooms from upper elementary to college. The completion warning is from college classes. |
| Letting learners struggle before teaching helps overall (g = 0.36), but for "second to fifth graders" the effect favoured teaching first. | Sinha & Kapur 2021, *Rev. Educ. Res.*, DOI [10.3102/00346543211019105](https://doi.org/10.3102/00346543211019105) **[abstract]** | Meta-analysis, 53 studies. For the younger half of the 8 to 12 audience it supports the current "Watch first" design. |
| "Gaming the system" (using hints and feedback to advance without thinking) is the off-task behaviour most strongly linked to lower learning, and is better explained by "learned helplessness or performance orientation" than by lack of interest. | Baker et al. 2004, CHI '04, DOI [10.1145/985692.985741](https://doi.org/10.1145/985692.985741) **[abstract]** | Correlational, middle-school maths tutor. Directly about the second gap in §3.1. |
| Coaching students on how they use help changed their help use, "but not ... better learning outcomes". On-demand help is "helpful under certain circumstances". | Aleven et al. 2016, *IJAIED*, DOI [10.1007/s40593-015-0089-1](https://doi.org/10.1007/s40593-015-0089-1) **[abstract]** | One research programme reviewing itself. Warns against expecting much from clever hint policing. |
| Children praised for intelligence showed, after a failure, "less task persistence, less task enjoyment" than children praised for effort. | Mueller & Dweck 1998, *J. Pers. Soc. Psychol.* 75(1), DOI [10.1037/0022-3514.75.1.33](https://doi.org/10.1037/0022-3514.75.1.33) **[abstract]** | Six studies with fifth graders (the target age). Later replications of mindset effects are smaller; not checked here. |
| Children play longer when a game is easier; the most engaging settings taught slowest. | Lomas et al. 2013, quoted in the earlier note §3.3 **[abstract]** | Large online experiments, one maths game. |
| Learning is fastest at about 85 % success. | Wilson et al. 2019, *Nature Communications*, DOI [10.1038/s41467-019-12552-4](https://doi.org/10.1038/s41467-019-12552-4) **[abstract]** | A mathematical result for learning algorithms, shown on neural networks. **Not** evidence about children; a rule of thumb only. |

**What this adds up to (ours):**

- A reward should tell the child something true about what they did (competence), should not be a promised prize for
  getting through (Lepper; Deci), and should leave a choice (autonomy).
- A child who hints through everything is more likely discouraged than lazy (Baker). The answer is an easier way to
  succeed, not a penalty.
- Gating on mastery helps weak learners but costs time and completions (Kulik). A hard gate on every level is the
  risky form of it.
- Daily streaks were already rejected in both earlier notes. The UK children's code has a standard on "nudge
  techniques" that is the regulator's view of such mechanics; its page could not be read (HTTP 403, §7).

### 3.3 Options fitted to the 17 worlds and 74 levels (ours)

| # | Option | For | Against / cost |
| --- | --- | --- | --- |
| A | **Open a way round.** Keep the order, but leave two or three levels open at once, or open the first level of the next world as soon as a world is half solved. | Autonomy. Removes the dead end. Small change in `isUnlocked`. | A child may leave hard levels behind. Mark them "come back later" and count them. |
| B | **A hint ladder.** First tap: name the rule ("Remember: one Normal Summon per turn"). Second: highlight the card. Third: show the move. The automatic hint after three fails starts at step one. | Keeps a failing child thinking one step longer. The reasons already exist as text (`copy.reasons`). | More copy in three languages. Aleven warns the gain may be small. |
| C | **A second chance at the star, right away.** After a hinted solve, offer the same rule on a slightly different board. | Turns "gaming" into practice. The star then means "did it alone once". | Needs variant boards: content work for 74 levels, or for the 28 teaching levels only. |
| D | **Make rule mastery the main progression.** A rank that rises with rules "used again without help" (the 28-rule list already computes it), shown at the top of the map instead of at the bottom. | Rewards what was learned, not how many levels were passed. Almost free. | A child who hinted through sees a low rank. Word it as "rules to win back", not as a grade. |
| E | **World badges with two tiers.** A world is "finished" when all its levels are solved and "mastered" when all are starred. Worlds 5, 7 and 17 (puzzles and duels) are natural bosses. | A reason to replay. Short horizons (2 to 10 levels) suit children. | A completion-contingent reward: keep it informational, do not announce a prize in advance. |
| F | **Surprise album cards.** A special version of a card appears when its rule becomes mastered, without being promised. | The unexpected-reward condition of Lepper's study did no harm. Uses the existing album. | Stops being a surprise after the second time. |
| G | **A soft gate before the two duels.** Suggest (not force) replaying the rules still "met" before world 7 and world 17: "Three rules to warm up first?" | Mastery learning where it counts, without locking. | One more screen. |
| H | **Rusty-rule replays.** Use the stored `slips` to propose one earlier level: "This rule tripped you twice. Try it again?" | Uses data already collected and unused. Spaced practice. | Must stay optional. |
| I | **Praise that names the action or the effort.** "You found it on the third try." "You won with a Trap." Never "You are so smart". | Mueller & Dweck. The result line already differs by outcome (`level-player.tsx:417-420`). | Copy work in three languages. |
| J | **Show the first-try mark on the map** (a third tier above the star). | Data already stored. | Pushes toward perfection and away from experimenting. **Not recommended** for this age. |
| K | **Streaks, daily goals, timers, leaderboards.** | Raise return visits. | Rejected in both earlier notes; pressure, not learning. **Not recommended.** |
| L | **A summary for parents** (rules mastered, rules that trip the child). | Relatedness: a parent who can say "show me your Trap level". Works locally on the same device. | Across devices it needs question 4. |

A small first set **(ours)**: A, B, D and I change little code and no stored data. C is the real answer to "pass
mission after mission", and it costs content. Measure before and after with the events of §1.6 (`hint`,
`level_left`, `how: hinted`), or by watching children.

---

## 4. Parent login with several children

### 4.1 Is it possible on this stack?

Yes, but everything would be new for the academy.

- **The academy has no backend.** "Progress is stored locally in the browser ... no account or backend" and "No app
  runtime env vars — the site is fully static" (`apps/academy-ygo/README.md`). Its dependencies are Next, React,
  `motion`, `clsx` and `lucide-react` only (`apps/academy-ygo/package.json`).
- **Progress lives in three `localStorage` keys:** `academy-ygo:junior:play:v1` (`play/progress.ts:10`),
  `academy-ygo:junior:mission1:v1` (`junior/progress.ts:4`) and `academy-ygo:progress:v1` (`lib/progress.ts:6`).
- **The other app has accounts, of a different kind.** `apps/duel-nextjs` has its own login: a username and an
  scrypt password hash, with no e-mail column (`apps/duel-nextjs/src/server/db/schema/schema.ts:417-424`), bearer
  sessions of seven days stored as a SHA-256 (`apps/duel-nextjs/src/server/auth/sessions.ts:10-15`), on Postgres
  through `drizzle-orm` (`apps/duel-nextjs/package.json`). It is a separate Vercel project on a separate origin, so
  neither its session nor its storage is visible to the academy. Which Postgres host it uses is not in the repo (§6).
- Next.js on Vercel can serve route handlers next to static pages, so adding a small API to the academy is a normal
  step. It ends "fully static" and adds a database and secrets to the deploy workflow.

### 4.2 The no-account step: child profiles on one device (ours)

If the need is "two or three children share the family tablet", no login is required:

- A profile picker (an avatar and a nickname the parent types), stored locally.
- One progress record per profile: the storage key gets the profile id. The parse, merge and save functions already
  take the storage as an argument (`play/progress.ts:81-103`).
- The existing record becomes the first profile.
- An export / import file or code moves a profile to another device by hand, as
  [kids-interactive-academy.md](./kids-interactive-academy.md) §8.2 proposed.

Nothing is sent, so the legal position stays as it is today. The FTC's FAQ says data that stays on the device is not
"collected" (quoted in the earlier note §8.2). What it does not give: progress on a second device without a manual
step, and recovery when the browser's storage is cleared.

### 4.3 A parent account with child profiles: candidates

The shape is the same with every candidate **(ours)**: only the parent has credentials; a child never types an
e-mail or a password; after the parent signs in, the device shows a profile picker. Tables: `child_profile
(id, parent_id, nickname, avatar)` and `junior_progress (profile_id, data, updated_at)`.

| Candidate | What its own docs say | Fit |
| --- | --- | --- |
| **Better Auth** | Runs inside the app with your own database; adapters for Drizzle with provider `pg`; App Router handler at `/app/api/auth/[...all]/route.ts`; e-mail and password built in, magic link as a plugin (<https://www.better-auth.com/docs/installation>). An **anonymous plugin** gives a session without e-mail and, when the user later signs up, calls `onLinkAccount` with `anonymousUser` and `newUser` so data can be moved; the anonymous record is then deleted by default (<https://www.better-auth.com/docs/plugins/anonymous>). | Best match for the repo's Postgres and Drizzle habits. Data stays in the owner's database. The licence was not on the page read (§7). |
| **Auth.js** | Its home page says: "The Auth.js project is now part of Better Auth" (<https://authjs.dev/>). | Choose Better Auth directly for new work **(ours)**. |
| **Neon Auth** | "a managed authentication service built on Better Auth"; users and sessions are stored "in your database under the neon_auth schema" (<https://neon.com/docs/auth/overview>). Price, limits, sign-in methods and supported plugins were not on the page read (§7). | Only if the database is, or becomes, Neon. |
| **Clerk** | Hosted. Free up to 50,000 monthly retained users per app; Pro $25 a month (<https://clerk.com/pricing>). | Fast to add. The parent's account data sits with a third company, which must then appear in the privacy notice. Child profiles would still be our own tables. |
| **Reuse the duel app's login** | Username and password, no e-mail (`schema.ts:417-424`). | One identity for both apps is attractive. But there is no e-mail for consent or recovery, the code lives in another deployment, and it would tie a children's product to an account system built for duelists with staff roles and bans. |

### 4.4 Reconciling with the progress already in the browser

- **The merge already exists and is safe to run on a server.** `mergePlayProgress` keeps a level solved if either
  side has it, keeps the best of `clean` and `firstTry`, and takes the larger slip count
  (`play/progress.ts:45-52`). Applying it in any order, or twice, gives the same result for levels and slips. So
  "local and server differ" has a fixed answer: merge, never overwrite. Only `calm` and `sound` are last-writer-wins,
  and those can stay per device.
- **First sign-in on a device with progress.** Ask once: "Whose progress is on this device?" and attach it to the
  chosen child. Do not merge it into every child. Do not delete the local copy.
- **The browser stays the working copy.** Play writes locally first, as today, and syncs when a connection exists.
  The course then keeps working when the server does not answer.
- **A trap in the current parser.** A stored record containing a level id this build does not know is rejected as a
  whole and treated as not writable (`play/progress.ts:63`, `:87`). With a server, an old cached page could receive
  progress containing newer level ids and stop saving. Sync must drop unknown ids on the way in, or the parser must
  tolerate them.
- **Shared devices.** After the parent signs in, the session on a child's tablet should allow play and nothing else:
  changing e-mail, deleting profiles and seeing the other children's details should ask for the password again.

### 4.5 The legal side of storing children's data under a parent's account

Sources as in §1.5.

- **COPPA.** A Junior course is plainly "directed to children" (factors quoted in the earlier note §8.2). Once play
  data is sent to a server and tied to a profile, personal information is collected from a child, and "verifiable
  parental consent" is required first. The method must be "reasonably calculated ... to ensure that the person
  providing consent is the child's parent" (§ 312.5(b)(1)). The listed methods include a signed form, a payment-card
  transaction, a call or video with trained staff, an identity check, and "email plus", which is allowed only when
  the child's information is not disclosed (§ 312.5(b)(2)); "you must take an additional confirming step", such as a
  second e-mail after a delay (FTC FAQ). The parent's e-mail may be collected first for the sole purpose of giving
  notice and getting consent (§ 312.5(c)(1)). Parents must be able to review what was collected (FAQ K.2). Data "may
  not be retained indefinitely" and a written retention policy is required (§ 312.10). An operator may not make a
  child's participation depend on disclosing more than "is reasonably necessary" (§ 312.7). The Rule "was amended on
  April 22, 2025" (FAQ banner); the compliance dates were not read (§7). All of this applies if the site is
  commercial and reaches children in the United States (§6).
- **GDPR.** A profile with progress, linked to a parent's e-mail, is personal data of the child even with a made-up
  nickname. If consent is the basis, below the national age it must be "given or authorised by the holder of
  parental responsibility", and the controller "shall make reasonable efforts to verify" this (Article 8, quoted in
  the earlier note §8.2). A parent who creates the account and the profiles is the natural way to meet it **(ours)**.
- **France.** Below fifteen the consent is joint: child and parent together (article 45, §1.5), and the information
  must be understandable by the child. In the product **(ours)**: a short screen in child's words, shown when the
  profile is first used.
- **Israel.** Not verified at a primary source (§7).
- **Data minimisation in practice (ours):** the parent's e-mail and nothing else about the parent; per child an
  avatar, a nickname the parent chooses (advise against the real name), and the progress record. No birth date, no
  photo, no free text typed by the child, no child e-mail. A "delete this child" and a "delete everything" button.
  A stated period after which unused accounts are removed.

### 4.6 How this meets question 1

- **Keep the two apart.** Vercel Web Analytics stays anonymous and aggregate: no profile id, no nickname, no parent
  id in any event (§1.4). It answers "where do children in general get stuck".
- **"What did my child do" is a product feature, not analytics.** It is read from the child's own progress record
  (rules mastered, slips) and shown to the signed-in parent (option L in §3.3). It needs no Vercel event.
- **Per-child behaviour analysis by the owner** (sequences, time, replays tied to a profile) would be a third thing:
  it is profiling of identified children. It would need its own mention in the notice and the consent, and nothing in
  the owner's request requires it.

---

## 5. Suggested order of work (ours)

1. **Card-effect animations (question 2).** No legal exposure, no new dependency, a small seam, visible to children
   at once. Start with the owner's two examples: Life Point gain and the thunder destruction.
2. **Progression fixes that stay local (question 3):** options A, B, D and I. Then decide on C (variant boards).
3. **Watch three to five children play**, with the animations and the new progression. It answers much of question 1
   for no cost and no data, and both earlier notes asked for it.
4. **Child profiles on one device (question 4, §4.2).** No server.
5. **Anonymous analytics (question 1),** after a privacy notice for parents exists and the plan question is settled.
   If the owner prefers to see numbers before changing the progression, this can move up to step 2; the notice still
   comes first.
6. **Parent account and sync (question 4, §4.3)** last, with legal advice, and only if profiles on one device prove
   not enough.

---

## 6. Open questions for the owner

1. **Which Vercel plan is the account on?** Custom events need Pro (§1.2). On Hobby, are page views enough, or is a
   route per level acceptable?
2. **Is the academy commercial in any way** (ads, shop links, a paid tier, a link to the duel app's paid features)?
   COPPA turns on it. This question is still open from both earlier notes.
3. **Which countries are the children in?** French and Hebrew content suggests France and Israel; are children in the
   United States expected?
4. **Do you accept ending the promise "nothing is sent anywhere"** for the Junior course, with a notice for parents
   and an off switch?
5. **Which problem is the bigger one for rewards:** children who get stuck and give up, or children who rush through
   with hints and learn little? §3.3 treats both; the first set of options depends on the answer.
6. **May a child skip a level?** (Option A.)
7. **For animations, how long is acceptable per effect,** and should the text line stay visible for sighted children
   or only for screen readers and calm mode?
8. **For several children: is one shared device the real case, or several devices?** It decides between §4.2 (no
   account) and §4.3 (parent account).
9. **Should the academy and the duel app share one account,** or stay separate? And which Postgres host does the duel
   app use (it decides whether Neon Auth is an option)?
10. **Who writes the privacy notice and reviews consent?** A lawyer is needed before step 5 or 6 of §5.

---

## 7. Unverified / could not confirm

- **CNIL (France):** the pages on audience measurement without consent and on the eight recommendations for minors
  returned HTTP 503. Whether Vercel Web Analytics meets the French exemption from consent is not established.
- **Israel:** the Privacy Protection Authority's site returned HTTP 403. Only law-firm summaries were found (not
  cited as fact): they say there is no separate children's privacy law, that consent for a minor (under 18) goes
  through a parent or guardian under the Legal Capacity and Guardianship Law, and that Amendment 13 to the Protection
  of Privacy Law tightened consent. None of this was confirmed at a primary source.
- **UK ICO children's code, "nudge techniques" standard:** HTTP 403, not read (as in the earlier note).
- **GDPR Articles 5, 6 and 25:** the EUR-Lex page was cut before the articles; Article 8 and the recitals are quoted
  from the earlier note's reading and today's partial read. Article 6(1)(f) is cited from memory of the text.
- **COPPA rule text:** read through the eCFR renderer with a tool that shortened quotations, so only short quoted
  phrases are given; paragraph numbers should be checked against the eCFR page before relying on them. The 2025
  amendments' compliance dates were not read.
- **Vercel:** what the visitor hash is built from; whether the served script retries events sent without a
  connection; whether a `vercel build` on a GitHub runner receives the version 2 dynamic configuration; whether the
  dashboard has a funnel view (none was seen on the pages read; the Web Analytics API page was not read); how
  "filtered" query parameters are filtered; what Vercel's general hosting logs keep.
- **Motion bundle sizes:** the docs page gives no date or version; the numbers may predate `motion` 14.
- **Lottie and Rive runtime sizes:** not stated on the pages read. Rive's default source for its WebAssembly file was
  not confirmed, only that the docs page shows unpkg.
- **Better Auth licence; Neon Auth price, limits, sign-in methods and plugin support (including the anonymous
  plugin):** not on the pages read.
- **Papers:** all read as abstracts only. For Hanus & Fox 2015 (a classroom study often cited for badges and
  leaderboards lowering motivation, DOI 10.1016/j.compedu.2014.08.019), Mekler et al. 2017 (DOI
  10.1016/j.chb.2015.08.048) and Cameron, Banko & Pierce 2001, no abstract could be retrieved; they are not used as
  evidence. Later replication results for Mueller & Dweck 1998 were not checked.
- **Code line numbers** in `level-player.tsx` around the "Show me" button (near 590) and the board placement
  (402-405) were read from partial listings and may be off by a few lines.

---

## Appendix: primary sources consulted (all accessed 2026-11-18)

- Vercel docs: `/docs/analytics/quickstart`, `/custom-events`, `/limits-and-pricing`, `/privacy-policy`, `/package`;
  source `vercel/analytics`, `packages/web/src/generic.ts` (GitHub, `main`).
- FTC: "Complying with COPPA: Frequently Asked Questions"; 16 CFR part 312 (eCFR).
- EUR-Lex: Regulation (EU) 2016/679 (recitals 26, 30, 38 today; Article 8 from the earlier note).
- Légifrance: Loi n° 78-17 du 6 janvier 1978, article 45.
- W3C: Understanding WCAG 2.2, SC 2.3.1. MDN: "Using the Web Animations API".
- Motion docs: "Reduce bundle size", "Accessibility". Rive docs: web runtime page.
- Better Auth docs: "Installation", "Anonymous" plugin. Auth.js home page. Neon docs: Auth overview. Clerk pricing.
- OpenAlex API (abstracts): Lepper et al. 1973; Ryan & Deci 2000; Przybylski et al. 2010; Sailer & Homner 2020;
  Kulik et al. 1990; Sinha & Kapur 2021; Baker et al. 2004; Aleven et al. 2016; Mueller & Dweck 1998; Wilson et al.
  2019.
- This repository at `cd07378`: `apps/academy-ygo` (sources, `README.md`, `package.json`, `vercel.json`),
  `.github/workflows/academy-ygo.yaml`, `docs/academy-junior-play.md`, `docs/academy-junior-pilot.md`, and for
  comparison `apps/duel-nextjs` (auth, schema, offline shell).
