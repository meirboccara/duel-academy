# Duel Academy for children aged 8–12: an interactive, anime-style, story-led way to learn the game

> **Date of observation:** 2026-11-16. Every web page and API record cited below was fetched that day, unless a
> line says otherwise.
> The repository was read on `main` at HEAD `6ed188b`, with a **dirty working tree**: another session was adding
> English / French / Hebrew translation to `apps/academy-ygo` while this note was written (21 modified files and the
> new `src/lib/i18n/` folder, all uncommitted). Code claims below describe the files as they stood that day.
> **Nature of this document:** a feasibility and design research note. No code was changed.
>
> **The request (owner, verbatim):** "If possible to do interactive like anime to learn children between 8-12 to
> learn yugioh but with funs. Maybe have some fun interaction to add for learning or quizz". The owner later added
> that the inspiration for the format is the CNCF *Illustrated Children's Guide to Kubernetes* (Phippy): a style they
> like, although "the final form could be something else" (§3).
>
> **Sourcing rule used:** every external claim is followed by the source that owns it: Konami's own sites, the
> regulators' own texts (FTC, EUR-Lex, legislation.gov.uk), W3C, MDN, the library vendors' own documentation, the npm
> registry, and the original research papers. Papers are cited by DOI. Where the publisher refused the request, the
> abstract was read from the OpenAlex record of that DOI, and this is said. Anything that could not be confirmed is
> listed in [§13](#13-unverified--could-not-confirm) and is not stated as fact. Proposals are labelled **(ours)**.
> Sizes and heights marked **(derived)** are worked out from CSS classes, not measured on a device.
>
> **This is not legal advice.** §8 reports what the rights holders and regulators publish. Decisions on intellectual
> property and children's privacy need a qualified lawyer.
>
> **Relation to existing notes.** [beginner-training-matches.md](./beginner-training-matches.md) (fetched 2026-10-11)
> already covers Konami's *For Beginners* videos, the Duel Academy store programme, demo events, Speed Duel and Rush
> Duel in detail. This note re-fetched the key pages and builds on that one without repeating it.
> **File naming.** `docs/research/` uses an undated topic slug per note, in English, with a "Date of observation"
> header. This note follows that convention.

---

## 1. Short answer

**Yes, it is feasible, and the academy is a good base for it.** The site is already a static Next.js app with typed
lesson data, original schematic cards, an animation library, local-only progress and no accounts. What it lacks for
children is everything that makes learning active: today it is a 324-slide presentation with no question, no
character, no sound and no reward.

**Recommended shape (ours):**

- **A separate "Junior" track**, not a rewrite of the existing four chapters. The current lessons stay as the
  reference course for older learners and teachers.
- **Short illustrated story chapters in the spirit of the Phippy books**, with a small cast of **original**
  characters that each stand for one game concept (the Monster, the Spell, the Trap, the turn, Life Points, the
  chain). One idea per page, one or two short sentences, the picture carries the meaning.
- **Every story chapter ends with something to do**: a quiz with an explained answer, a battle-damage mini-game, a
  "put the card in the right zone" board, and later small puzzle duels. A storybook alone cannot teach a game whose
  rules must be practised; the interaction is what turns the story into learning (§3.3, §5).
- **Anime feel through presentation, not through borrowed material**: character sprites with a few expressions,
  speech bubbles, speed-line and impact effects, a rival, a mentor, all built with CSS and the `motion` library the
  app already ships. No new runtime is needed for a first version (§7).
- **A small rule subset**: card types, the turn, Normal Summon and Tribute, battle positions and damage, Life
  Points, basic Spells and Traps, then a two-link chain. No Extra Deck in the Junior track (§4).
- **Keep the privacy posture the site already has**: no account, no leaderboard, no analytics, progress stored only
  in the browser. That posture is what keeps children's-privacy law simple (§8.2).
- **Everything visual and audible must be original.** Nothing published by Konami grants permission to use card
  art, anime characters or music, and the Phippy licence covers the Phippy characters, not the idea (§3.4, §8.1).

The main cost is **art and writing**, not code: a cast of characters with expressions, a few backgrounds, and
child-level text in three languages.

---

## 2. What the academy has today

### 2.1 Stack

- `apps/academy-ygo/package.json`: Next.js 16.3.2, React 19.2.8, Tailwind CSS 4, `motion` ^14.0.0 (14.0.0
  installed), `lucide-react`, `clsx`, Vitest. No other runtime dependency.
- `apps/academy-ygo/README.md`: "the site is fully static", "Progress is stored locally in the browser
  (`src/lib/progress.ts`), no account or backend", deployed to Vercel by `.github/workflows/academy-ygo.yaml`.
- Fonts are Cinzel (display) and Source Sans 3 (body) through `next/font/google`
  (`src/app/layout.tsx`). Next.js self-hosts these: "no requests are sent to Google by the browser"
  (`node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`, line 96).
- No analytics, tag manager or third-party script was found in `apps/academy-ygo/src` or its `package.json`.

### 2.2 Content model

- Lessons are plain typed data, "no JSX, no functions" (`src/lib/lesson-types.ts`, lines 1–5). A slide names one
  of **seven templates**: `illustration`, `card-anatomy`, `duel-field`, `timeline`, `sequence`, `comparison`,
  `numeric` (`lesson-types.ts`, lines 226–233). `src/components/slides/slide-renderer.tsx` picks the component.
- Each slide has a title, a description of "~20-35 words, beginner friendly", an `alt` text for screen readers and
  optional `speakerNotes` (`lesson-types.ts`, lines 237–247).
- Four chapters, 28 lessons, 324 slides (`src/content/chapters/`): *The First Duel* (9 lessons, audience "Never
  played before"), *Spells, Traps & Monster Effects* (6), *Extra Deck & Advanced Summoning* (7), *Advanced Duel
  Rules* (6).
- Cards are schematic and original: "Names are original teaching examples — not real printed cards. Artwork is
  never used" (`src/lib/sample-cards.ts`, lines 1–4). The home page footer says "Duel Academy is an unofficial
  educational project" (`src/app/page.tsx`, line 113).

### 2.3 Building blocks that interactions can reuse

| Component | File | What it already draws |
| --- | --- | --- |
| Educational card | `src/components/visuals/educational-card.tsx` | A card frame with name, Level, ATK/DEF, text, position, highlightable parts |
| Duel field | `src/components/visuals/duel-field.tsx` | Both halves of the field, every zone addressable by `ZoneId`, highlights, arrows, a hand |
| Life Points | `src/components/visuals/life-points.tsx` | Two Life Point totals, before and after |
| Phase timeline | `src/components/visuals/phase-timeline.tsx` | The six phases with one active |
| Chain stack | `src/components/visuals/chain-stack.tsx` | Numbered chain links, building and resolving |
| Numeric slide | `src/components/slides/numeric-slide.tsx` | "2000 − 1500 = 500" battle arithmetic with cards |
| Lesson player | `src/components/academy/lesson-player.tsx` | Slide navigation, keyboard, full screen, notes, progress save, slide transition with `motion` |

### 2.4 What is missing for an 8–12 audience

- **No interaction at all.** The only inputs are Previous, Next, the progress dots, notes and full screen. No slide
  asks a question; no file under `src/components` contains a quiz.
- **No character, story, sound or voice.** `public/` does not exist; there is no image or audio asset.
- **No feedback or reward.** A lesson counts as "completed" when the last slide is opened
  (`src/lib/progress.ts`, lines 66–67), which measures viewing, not understanding.
- **Text written for adults.** Descriptions are 20–35 words and use rulebook vocabulary (for example "Damage
  Step", `src/content/chapters/first-duel/battle-phase.ts`, line 38).
- **Motion is minimal.** One 0.22 s slide transition in the lesson player, which respects `useReducedMotion`, and a
  global `prefers-reduced-motion` rule in `src/app/globals.css` (lines 99–108).
- **Keyboard-first presentation controls.** The hint line is about arrow keys, Space, N and F; the layout is a
  16:9 canvas (`globals.css`, `.slide-canvas`).
- **Translation is in progress, not finished.** The uncommitted `src/lib/i18n/` supports `en`, `fr` and `he`, sets
  `lang` and `dir` on the document (`provider.tsx`, lines 52–53) and translates lesson data by text field name
  (`localize.ts`). See §9.3 for what this implies.

---

## 3. The owner's reference: the Phippy books (CNCF)

### 3.1 What the format actually does

Sources: <https://www.cncf.io/phippy/the-childrens-illustrated-guide-to-kubernetes/>,
<https://www.cncf.io/phippy/>, <https://www.cncf.io/phippy/phippy-goes-to-the-zoo-book/>.

- **A storybook, start to finish.** *The Illustrated Children's Guide to Kubernetes* was written by Matt Butcher
  and Karen Chu and illustrated by Bailey Beougher. It opens "Once upon a time there was an app named Phippy" and
  ends with Phippy who "lived happily ever after". It is dedicated to "all the parents who try to explain software
  engineering to their children".
- **A hero with a problem.** Phippy is "a simple PHP app" on shared hosting who wants her own environment. Each
  scene gives her one new problem and one new concept that solves it: a kindly whale suggests a container; a
  captain with a ship made of rafts takes containers aboard; labels are "nametags"; she wants to clone herself, so
  she learns about replication controllers; Goldie gives her a present and she cries "I love the present, but I
  have nowhere to put it!", which introduces volumes; she wants privacy, which introduces namespaces.
- **One concept per scene, in story order.** The page runs through about a dozen scenes: environment, containers,
  Kubernetes, labels, pods, replication controllers, services, volumes, namespaces.
- **Very little text.** Most scenes have one to three short story sentences next to an illustration, and several
  add a short plain explanation of the concept beside the story.
- **Characters that stand for things.** On the series page, "Each character represents a CNCF project": Phippy is
  "The PHP Giraffe", Goldie "The Go Gopher", Captain Kube "The Kubernetes Owl", Zee "The etcd Zebra", Hazel "The
  Helm Hedgehog", and so on for nineteen characters. Each has a one-line personality ("often mistaken for being
  angry, but it's really just his eyebrows!").
- **The second book makes the metaphor even more direct.** In *Phippy Goes to the Zoo*, Zee is bored, so Aunt
  Phippy takes her to a zoo where each enclosure holds animals that behave like one Kubernetes object: meerkats
  that are replaced whenever one falls off a ledge are ReplicaSets, raccoons that sleep and periodically do a task
  are CronJobs, creatures you can only see with decoder glasses are Secrets. Each scene is one picture, two to five
  story sentences and a one-or-two-sentence "Description of…" box.
- **A series, not one book.** The series page lists nine storybooks and two "workshop books" that add a hands-on
  activity (*Phippy's AI Friend* with a Scratch workshop, *Phippy's Sonic Band* with Sonic Pi). CNCF itself
  therefore pairs the story with an activity when the goal is to make the reader do something.

### 3.2 Why it works as teaching

- **A character is easier to remember than a definition.** The behaviour of the animal is the definition: the
  meerkat that always gets replaced *is* the rule. For a game, this fits well, because every Yu-Gi-Oh! concept is a
  behaviour ("a Trap waits face-down and acts on the opponent's turn").
- **Characters help younger learners more.** A meta-analysis of 43 studies (3,088 participants) on on-screen
  characters that support instruction found a small positive effect on learning, larger for K-12 learners than for
  post-secondary ones; characters that communicated through **text** helped more than narrated ones (Schroeder,
  Adesope & Gilbert 2013, DOI [10.2190/EC.49.1.a](https://doi.org/10.2190/EC.49.1.a); abstract read from OpenAlex).
- **Picture plus a few words is the recommended combination.** The US Institute of Education Sciences practice
  guide recommends to "Combine graphics with verbal descriptions" and to "Connect and integrate abstract and
  concrete representations of concepts" (Pashler et al. 2007, both rated moderate evidence,
  <https://ies.ed.gov/ncee/wwc/PracticeGuide/1>).
- **Low reading load suits this age.** In Nielsen Norman Group's usability studies with 125 children aged 3–12,
  older children scan text, and "we observed kids skipping the long paragraphs of instructions"
  (<https://www.nngroup.com/articles/childrens-websites-usability-issues/>). One idea per page is also the
  segmenting advice of multimedia-learning research (Mayer & Moreno 2003, DOI
  [10.1207/S15326985EP3801_6](https://doi.org/10.1207/S15326985EP3801_6); only the abstract was read, see §13).
- **A problem and a resolution give each concept a reason to exist.** The reader meets the need first ("nowhere to
  put it") and the concept second. This is the order a game tutorial also wants: "my monster is too weak" comes
  before "Tribute Summon".

### 3.3 Where a passive storybook falls short for a game

- **Reading about a rule is not the same as recalling or applying it.** In three experiments with fourth-grade
  children (mean age 10.0), practising retrieval beat re-studying the same material every time (free recall 0.55
  against 0.44, and 0.42 against 0.28) (Karpicke, Blunt & Smith 2016, *Frontiers in Psychology* 7:350,
  <https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00350/full>). The IES guide rates
  "Use quizzes to re-expose students to key content" as **strong evidence**.
- **A game has procedures and arithmetic.** Knowing who the Trap character is does not teach a child to compute
  2000 − 1500 or to pick the legal zone. The IES guide recommends to "Interleave worked example solutions with
  problem-solving exercises" (moderate evidence). The story page is the worked example; the interaction is the
  exercise.
- **A rich story can even get in the way.** A meta-analysis of digital learning games for K–16 found that games
  with no or thin story depth outperformed those with medium story depth, that schematic visuals did better than
  realistic ones (g = 0.48 against −0.01), and that more "contextualization" was linked to smaller learning
  effects (Clark, Tanner-Smith & Killingsworth 2016, *Review of Educational Research* 86(1),
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC4748544/>). The authors note that several of these differences weaken
  after statistical controls, so this is a caution, not a rule: keep the story **short and in service of the
  concept**, as Phippy does, and keep the cards schematic, as the academy already does.
- **CNCF's own answer is the same.** Its "workshop books" add an activity to the story (§3.1).

So the Phippy format is the right **carrier** for a concept, and the interaction or quiz at the end of each chapter
is the part that makes the child use it. §10 turns this into a concrete proposal.

### 3.4 Licence of the Phippy material, and what to borrow

- The series page states that the characters (except Goldie) are "owned by The Linux Foundation, on behalf of the
  Cloud Native Computing Foundation" and "licensed under the Creative Commons Attribution License"; you can "remix,
  transform, and build upon the material for any purpose, even commercially". Attribution must include the text
  "phippy.io" and, online, "a link to https://phippy.io". Goldie "is based on the Go Gopher, created by Renee
  French" and is under CC-BY 3.0. The book pages repeat: "They are licensed under Creative Commons Attribution
  (CC-BY)." The page links the Linux Foundation trademark-usage page for trademark questions
  (<https://www.cncf.io/phippy/>).
- The licence deed the page links, CC BY 4.0, allows to "copy and redistribute the material in any medium or
  format for any purpose, even commercially" and to adapt it, on the condition of "appropriate credit", a link to
  the licence and an indication of changes, "but not in any way that suggests the licensor endorses you or your
  use" (<https://creativecommons.org/licenses/by/4.0/>).
- **What this means for the project (ours).** The licence would allow reusing Phippy art with attribution, but
  there is no reason to: a giraffe that stands for PHP teaches nothing about a card game, and mixing another
  organisation's characters into a Yu-Gi-Oh! learning site would confuse both. **Borrow the format idea only**
  (character-as-concept, one idea per page, problem then resolution, very little text) and create original
  characters and art. A format idea is not what the licence covers, so no attribution is legally required for
  that; a short "inspired by" credit would still be a fair courtesy. The same "original only" rule follows, for a
  different reason, from the Konami side (§8.1): there the material is simply not licensed for reuse at all.

---

## 4. What to teach and in what order (Konami's own beginner material)

### 4.1 What Konami itself teaches first

- **The official beginner order.** Konami's *For Beginners* page (<https://www.yugioh-card.com/eu/forbeginners/>,
  offered in English, French, German, Italian and Spanish) splits thirteen videos into two levels. "Beginner - The
  Basics of Dueling": 1 Getting Started, 2 The Flow of a Duel, 3 All About Monsters, 4 In the Heat of the Battle,
  5 More Main Phase Actions. "Advanced Beginner - Strategy and Summoning": 6 Special Spells and Traps, 7 Chains
  and Chaining, then Ritual, Fusion, Synchro, Xyz, Pendulum and Link.
- **What a first demo must cover.** Konami's Demo Judge FAQ (<https://www.yugioh-card.com/en/judges/demo-faq/>)
  says a demo should explain card types, card features, the phases of a turn, card interactions, Life Point
  damage and how the game is won, and that "The basic rules, components of the game, and some experience playing
  are generally all that need to be covered."
- **Short, winnable, and adapted to age.** Same FAQ: "A demo should generally not exceed 10–15 minutes." Let the
  participant win, because "nothing turns a prospective player off more than losing the game the first time they
  try it." And: "Tailor the demo to the age of the demo participant. If you are demoing to a 10-year-old, try to
  simplify things a bit more than you would demoing to a 25-year-old." Demo kits "typically" contain "20-card demo
  decks".
- **Speed Duel is Konami's simplified entry format.** "Welcome to Speed Dueling, the perfect introduction to the
  Yu‑Gi‑Oh! TRADING CARD GAME!" and "Both players start with 4,000 Life Points."
  (<https://www.yugioh-card.com/eu/play/speed-duel-beginners-guide/>). The same page says the standard game
  "features bigger Decks and a larger Dueling Field, with special Card Zones for additional monster types", and
  that "Yu‑Gi‑Oh! Duel Links features an interactive tutorial called Duel School." The Speed Duel details (three
  Monster Zones, three Spell & Trap Zones, 20–30 card Decks, no Main Phase 2) are in the earlier note, §4.4,
  fetched 2026-10-11.
- **Rush Duel simplifies differently.** Konami Japan's how-to-play page
  (<https://www.konami.com/yugioh/rushduel/howto/>) keeps 8000 Life Points and 40–60 cards, but lets a player
  Normal Summon any number of monsters per turn ("1ターンに何体でも通常召喚できる") and draw up to five cards every
  turn ("毎ターン手札が５枚になるようにドローする"). Rush Duel is a different game with its own cards, so it is a
  reference for *how* Konami simplifies, not a rule set to teach here.
- **Konami's video games teach by playing and by quizzing.** Duel Links: "Follow the tutorial to learn the basic
  controls of Duel Links!", "Duel Quizzes will teach you how to Duel!", "Keep Dueling and your character will
  level up!" (<https://www.konami.com/yugioh/duel_links/en/guide/>). Master Duel: "Solo Mode includes "Tutorial"
  and "Duel Strategy"", "Master the basic rules of the game as you play!", with Guide 1 "Monster Cards and Spell
  Cards Basics" and Guide 2 "Trap Card Basics" before any Extra Deck guide
  (<https://www.konami.com/yugioh/masterduel/us/en/>).
- **Konami's own 2026 store programme uses challenges and a tracker.** The Duel Academy events in EMEA give
  newcomers a Progression Guide with challenges ("Summon a monster", "Set a Trap card and activate it on your
  opponent's turn") and an Activity Tracker, and end with a completion certificate (earlier note, §3, fetched
  2026-10-11; not re-fetched today).

### 4.2 The minimal rule subset for the Junior track (ours)

Following Konami's own "Beginner" level and demo content:

1. **The three card types** and how to read a Monster (name, Level, ATK, DEF).
2. **Winning**: Life Points, and reducing the opponent's to 0.
3. **The turn**: Draw, Standby, Main 1, Battle, Main 2, End, taught as "draw, play, fight, finish" first.
4. **Putting a monster on the field**: one Normal Summon or Set per turn; Tributes for Level 5 and higher.
5. **Attack Position and Defense Position**, and the three battle outcomes with their arithmetic.
6. **Direct attacks.**
7. **Spells** (play on your turn) and **Traps** (Set first, use later, also on the opponent's turn).
8. **A two-link chain**: the last card played resolves first.

Left out of the Junior track: all Extra Deck summoning, Pendulum, Spell Speeds by number, the Damage Step
sub-steps, missed timing, and deck-building limits. These stay in the existing chapters 3 and 4.

For practice duels, **4000 Life Points and small fixed Decks** are the Konami-backed choice (Speed Duel, demo
kits). Whether to also use the three-zone Speed Duel board is an open question (§12): it is simpler, but the
existing `duel-field.tsx` draws the five-zone board with Extra Monster Zones.

---

## 5. Learning design for ages 8–12

| Finding | Source | What it means here (ours) |
| --- | --- | --- |
| Quizzing after study improves memory in children of about 10; it worked when the children could answer most first attempts (75–87 % initial success), and the benefit did not depend on reading comprehension or processing speed in that sample. | Karpicke, Blunt & Smith 2016 (URL in §3.3) | End every chapter with a short quiz. Make first questions easy or hinted so that most children succeed. |
| "Use quizzes to re-expose students to key content" (strong evidence). "Space learning over time" (moderate). "Interleave worked example solutions with problem-solving exercises" (moderate). "Ask deep explanatory questions" (strong). | Pashler et al. 2007, IES practice guide | Bring earlier concepts back in later quizzes. Alternate a shown example with a similar problem. Ask "why did the Trap win?" and not only "which card?". |
| In computer-based learning, feedback that explains produced larger effects than feedback that only says right or wrong or only shows the answer; delayed feedback did worse, and timing mattered in primary and secondary school. | Van der Kleij, Feskens & Eggen 2015, *Review of Educational Research*, DOI [10.3102/0034654314564881](https://doi.org/10.3102/0034654314564881) (abstract read from OpenAlex) | Answer immediately, and always say why in one sentence, for right and wrong answers alike. |
| Digital games improved learning against non-game teaching (g = 0.33). Multiple sessions mattered (g = 0.44) while single sessions did not (g = 0.08); total play time was unrelated to the effect. Scaffolding beyond points raised the effect. | Clark, Tanner-Smith & Killingsworth 2016 | Many short missions over several days, not one long sitting. Hints and explanations matter more than points. |
| Gamification has small positive effects on cognitive (g = .49), motivational (g = .36) and behavioural (g = .25) learning outcomes; "Inclusion of game fiction and combining competition with collaboration were particularly effective" for behavioural outcomes. | Sailer & Homner 2019, *Educational Psychology Review*, DOI [10.1007/s10648-019-09498-w](https://doi.org/10.1007/s10648-019-09498-w) (abstract read from OpenAlex) | A story frame and a friendly rival are justified. Badges are a modest help, not the core. Prefer "beat the rival character together with your partner monster" to player-against-player ranking. |
| On-screen teaching characters help K-12 learners more than adults. | Schroeder, Adesope & Gilbert 2013 | A mentor character and concept characters suit this age. |
| Children aged 9–12 scan text and skip long instructions; children like animation and sound; they "reacted negatively to content designed for children" a grade below their own ("This website is for babies"); age targeting needs "very fine-grained distinctions", at minimum 3–5, 6–8 and 9–12; children cannot tell advertising from content. | Sherwin & Nielsen 2019, Nielsen Norman Group, three studies, 125 children aged 3–12 | The 8–12 band straddles two of NN/g's groups. Design for 9–12 (so it does not look babyish, which the anime tone helps) and support 8-year-olds with shorter text and optional voice. No advertising, and keep outbound links away from the child's path. |
| Konami: a first demo "should generally not exceed 10–15 minutes" and should be simplified for a 10-year-old. | Demo Judge FAQ | One mission should fit well inside 10 minutes. |

**Session length.** No primary source was found that gives a tested session length for this age band (§13). The
figure to design to is Konami's own 10–15 minute demo limit, cut into missions of roughly 5–8 minutes (ours).

**Reading load (ours).** At most two short sentences per story page and one sentence of feedback, against 20–35
words per slide today. Game terms stay official ("Attack Position") but are introduced one at a time, each by a
character.

---

## 6. Interaction and quiz mechanics that fit

Effort is for one developer in this stack, including tests, **excluding art and translation**: **S** up to about
a day, **M** two to four days, **L** one to two weeks. These are rough estimates (ours).

| # | Mechanic | What it teaches | Why it suits 8–12 | Cost in this repo |
| --- | --- | --- | --- | --- |
| A | **Quiz slide with explained answer** (tap one of two to four choices; choices can be cards) | Any fact or rule; card reading | Retrieval practice works at this age (Karpicke 2016); explained, immediate feedback (Van der Kleij 2015). Konami's Duel Links uses "Duel Quizzes". | **S–M.** A new `quiz` member in the `SlideVisualConfig` union, one slide component, reuse of `educational-card.tsx`. New text fields must be added to the translation field list in `i18n/localize.ts`. |
| B | **Battle calculator** ("Who wins? How much damage?") | ATK against ATK, ATK against DEF, direct attack, Life Point subtraction | Short, repeatable arithmetic at primary-school level with instant result; varied examples can be generated from `sample-cards.ts` so no two rounds are the same. | **S–M.** Reuses `numeric-slide.tsx` and `life-points.tsx`; add number choices and a Life Point count-down animation. |
| C | **Put the card in the right zone** (drag, with tap-then-tap as an equal alternative) | Zones, Summon against Set, where Spells and Traps go | Physical, game-like; NN/g notes children prefer touch. | **M.** `duel-field.tsx` already addresses every zone and highlights them. Dragging needs `motion`'s drag and a non-drag alternative (WCAG 2.5.7, §9.1). |
| D | **Sort the cards** (Monster / Spell / Trap, later Normal / Effect) | Card types by frame colour and layout | Fast, low reading, good first mission. | **S–M.** Same drop logic as C with three buckets. |
| E | **Order puzzle** (phases of the turn; steps of a Tribute Summon) | The turn structure; procedures | Turns a list to memorise into a puzzle. | **S.** Reuses `phase-timeline.tsx`. |
| F | **Puzzle duel, "what would you play?"** (a fixed board, a small hand, win or survive this turn) | Applying several rules together; planning | The step from knowing to playing; Konami's 2-Player Starter Set teaches with "a scripted (non-randomized) Duel" (earlier note §4.1). | **M** per engine-free version: each puzzle is a small scripted decision tree in lesson data. Using `packages/duel-engine` for free play was not assessed here (§13). |
| G | **Story duel against a rival** (scripted, stacked Deck, 4000 LP, the child wins) | A whole short duel from draw to victory | "Try to let the demo participant win" (Konami). Game fiction and a rival raise engagement (Sailer & Homner 2019). | **L.** Needs F's machinery plus turn flow, opponent turns and dialogue. |
| H | **Illustrated story pages with concept characters** (the Phippy layer, §3, §10) | Introduces each concept and why it exists | Characters help K-12 learners (Schroeder 2013); picture plus few words (IES); low reading load (NN/g). | **M** code (a `story` slide: background, one or two sprites, a speech bubble, tap to continue). **Art is the real cost.** |
| I | **Local badges and a rank ladder** ("Rookie → Duelist → Academy Champion") | Nothing directly; marks progress | Small positive effect of gamification; Konami's own Duel Academy uses a tracker and a certificate. | **S.** Extend `progress.ts` (still `localStorage`). A printable certificate is a nice end point. |
| J | **Chain-order puzzle** ("which card resolves first?") | Last in, first out | A puzzle is the natural form of this rule; keep it to two or three links. | **M.** Reuses `chain-stack.tsx`. Late in the track. |
| K | **Read-aloud voice** (browser speech synthesis, or recorded audio) | Supports weaker readers | Helps the 8-year-old end of the band. Note that text-based characters did better than narrated ones in Schroeder 2013, so voice is a support, not a replacement for text. | **S** for speech synthesis, with uncertain voice quality and availability per language (§7.3). Recorded audio costs recording in three languages. |
| L | **Sound effects** (summon, attack, correct, wrong) with a mute button | Feedback and fun | "Kids expected some sites to play sound or have animation" (NN/g). | **S.** A few short original audio files; must start only after a tap (§7.3). |

**Not recommended (ours):**

- **Public leaderboards and player names.** They need an identifier and a server, which moves the site into
  children's-privacy law (§8.2), and rank children against each other.
- **Daily streaks and "come back tomorrow" pressure.** They are a retention device, not a learning one, and
  privacy regulators treat nudging children as a design concern (§8.2, not fully verified, §13). Spacing can be
  achieved more gently by having later missions revisit earlier concepts.
- **Timed quizzes.** A time limit triggers WCAG 2.2.1 Timing Adjustable (§9.1) and adds pressure for slower
  readers.
- **Free-text input, chat, or uploads.** They collect personal information by design.

---

## 7. Anime-style presentation on the web, technically

### 7.1 What "anime-style" needs

Looking at what the request describes, the feel comes from a short list of devices (ours): characters with a few
expressions who talk in speech bubbles; a mentor and a rival; a dramatic beat when a monster is summoned or
attacks (a zoom, speed lines, an impact flash, a shake); bright cut-in panels; a victory pose. None of these needs
video or frame-by-frame animation. They are layered still images moved and faded by code, which is how
visual-novel scenes work.

### 7.2 Options compared

| Option | First-party source | Weight | Authoring effort | Reduced motion | Fit |
| --- | --- | --- | --- | --- | --- |
| **CSS transitions and keyframes** | MDN, [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) ("Baseline: Widely available") | None | Low for simple effects | One media query; the app already has a global rule | Speed lines, flashes, idle bobbing of a sprite |
| **Web Animations API** | MDN, [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API): `Element.animate()` is "A shortcut method for creating and playing an animation on an element" | None | Medium (imperative) | Must be checked in code | One-off sequenced effects |
| **`motion`** (already installed, 14.0.0; latest on npm is 14.14.0, <https://registry.npmjs.org/motion/latest>) | <https://motion.dev/docs/react-accessibility>, <https://motion.dev/docs/react-reduce-bundle-size>, <https://motion.dev/docs/react-drag> | Already in the bundle: the docs say the `motion` component cannot be tree-shaken "any smaller than 43kb". `LazyMotion` brings the first render to "just over 5kb", plus "+24kb" for `domAnimation` or "+38kb" for `domMax`, which is the one that includes "pan/drag gestures and layout animations". | Low; the lesson player already uses it | `<MotionConfig reducedMotion="user">` makes components "automatically disable transform and layout animations" while keeping values such as opacity; `useReducedMotion()` is already used in `lesson-player.tsx` | **The default choice.** Enter and exit of sprites, drag for interactions C and D, layout animation for cards moving between zones |
| **React `<ViewTransition>`** | `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (ships with the installed Next.js) | None | Medium; a newer API | Through CSS | Morphing a card from the hand to the field between two slides |
| **Rive** | <https://rive.app/docs/runtimes/react/react>, <https://rive.app/docs/runtimes/web/canvas-vs-webgl.md> | A new dependency plus a WebAssembly runtime. `@rive-app/webgl2` is "the recommended" package; `@rive-app/canvas-lite` is "the smallest web package" but drops text, layout, audio, scripting and Vector Feathering. The docs give **no sizes**. Browsers cap the number of WebGL contexts per page. | **High**: characters must be rigged in the Rive editor | Not covered by the pages read; must be handled by hand | Only if a character needs real state-driven animation (blinking, reacting). Not needed for a first version |
| **Lottie / dotLottie** | <https://registry.npmjs.org/lottie-web/latest> (5.13.0), <https://registry.npmjs.org/@lottiefiles/dotlottie-react/latest> (0.22.2) | A new dependency | **High**: animations are exported from After Effects ("After Effects plugin for exporting animations…") | Must be handled by hand | Pre-made celebration effects at most. Rendering details were not confirmed (§13) |
| **Layered sprites, visual-novel style** | No library; plain images plus one of the rows above | Image weight only | Code low; **art is the cost** | Sprites simply appear without sliding | **The recommended way to show characters** |

**Recommendation (ours).** Stay on CSS plus `motion`. It adds no dependency, the team already uses it, and it
covers dialogue scenes, drag interactions and battle effects. Wrap the app in `MotionConfig reducedMotion="user"`:
the global CSS rule in `globals.css` shortens CSS animations and transitions, but it does not govern animations
that a JavaScript library drives, so the library-level setting is the reliable one (the split between the two is
our reading of the two docs, not a tested result). Consider Rive only later, for one hero character, after
measuring its real download size on a phone.

**Tablets and phones.** Animate only `transform` and `opacity`, keep sprites as optimised SVG or WebP, and avoid
many simultaneous effects. No device measurement was made for this note.

### 7.3 Sound and voice

- **Audio must start after a tap.** MDN: media will be allowed to autoplay only if, among other cases, "The user
  has interacted with the site (by clicking, tapping, pressing keys, etc.)", and Web Audio playback "outside the
  context of handling a user input event is subject to autoplay rules"
  (<https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay>). A "Start" button on each mission solves
  this.
- **Speech synthesis exists in every modern browser, but the voices belong to the device.** MDN lists
  `SpeechSynthesis` as "Baseline: Widely available" since September 2018; `getVoices()` returns the voices
  "available on the current device" (<https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis>). Whether
  a given tablet has a French or a Hebrew voice, and how it pronounces "Tribute Summon", cannot be known in
  advance (§13). Treat read-aloud as an optional button and fall back silently when no voice matches the language.
- **Music and effects must be original or properly licensed** (§8.1).

---

## 8. Legal and safety constraints

**Not legal advice.** This section reports published texts and draws cautious design conclusions.

### 8.1 Intellectual property

**What Konami publishes.**

- **No fan-content licence was found.** Searching Konami's sites did not turn up any policy that permits fans to
  use card images, card art, anime characters or music (§13 for the limits of that search).
- **The texts that were found reserve everything.**
  - Yu-Gi-Oh! Card Store terms of use, Konami Digital Entertainment, Inc., "Last Updated: August 26, 2023"
    (<https://legal.konami.com/kdeus/yugioh/terms/tou/en/>). They cover that store site only, but state Konami's
    position: "You may not use our copyrightable content without our express prior written permission", and "Our
    trade names, trademarks and service marks include "KONAMI", and "YU-GI-OH!", and any associated logos. You may
    not use our trade names, trademarks, service marks or logos in connection with any product".
  - yugioh.com terms of use, Konami Cross Media NY, Inc. (the anime side), posted June 7, 2019
    (<https://www.yugioh.com/news/terms-of-use>): "No Content, in whole or in part, may be copied, reproduced,
    republished, uploaded, posted", and the prohibition includes "creating montages, wallpaper, merchandise, video
    mash-ups, even if you provide these for free." Also: "You cannot use any Trademarks for any reason without
    obtaining the prior written permission of KCM."
  - The Community Code of Conduct (<https://www.yugioh-card.com/en/about/code-of-conduct/>) does not grant any
    use of Konami material. It forbids "Names impersonating KONAMI, its intellectual properties, and/or KONAMI
    employees."

**What must be original (ours, cautious reading).**

- **All art**: characters, monsters, backgrounds, card illustrations, effects. No screenshots, no card scans, no
  anime stills, no traced or "in the style of a specific character" designs. The academy already follows this for
  cards.
- **All characters and story.** No Yugi, Kaiba, Kuriboh or any named anime or card character, and no look-alikes.
  The concept characters proposed in §10 must be new designs.
- **All music, sound effects and voices.** No anime themes or game audio.
- **Card names used as examples.** The academy uses invented names such as "Bronze Soldier". Each invented name
  should be checked against the official card database before release, so that it does not collide with a real
  card (not done for this note, §13).

**What can be referenced (ours, and the part that most needs a lawyer).**

- **The rules themselves, in the project's own words**, with links to Konami's rulebook as the lessons already do.
- **The game's vocabulary** ("Normal Summon", "Life Points") is needed to teach the game at all.
- **The name "Yu-Gi-Oh!" to say what the site teaches**, with a visible statement that the site is unofficial.
  The footer already says so. Whether this kind of descriptive use is acceptable in each country is a legal
  question this note cannot settle.

**Two existing risks worth flagging.**

- **The name "Duel Academy".** Konami runs its own beginner programme under exactly this name in EMEA since 2026
  (earlier note §3, fetched 2026-10-11). A child-facing site with the same name, teaching the same game, could be
  taken for the official programme. This deserves a decision before the Junior track draws more attention (§12).
- **Embedding Konami's videos.** The earlier note discusses embedding the *For Beginners* videos. A child-facing
  track should not embed third-party players, for the privacy reasons in §8.2.

### 8.2 Children's privacy

**COPPA (United States).** Source: the FTC's own COPPA FAQ, dated July 2020 with later edits
(<https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>).

- **Who is covered.** "The Rule applies to operators of commercial websites and online services" directed to
  children under 13, and to general-audience operators with "actual knowledge" that they collect personal
  information from children under 13. "Foreign-based websites and online services must comply with COPPA if they
  are directed to children in the United States".
- **Would the Junior track be "directed to children"?** The factors include "the use of animated characters or
  child-oriented activities and incentives", subject matter, visual content and audio. A track built for ages 8–12
  with cartoon characters clearly meets them.
- **What counts as personal information.** Among others, "A persistent identifier that can be used to recognize a
  user over time" and "A photograph, video, or audio file, where such file contains a child's image or voice".
- **Data that never leaves the device.** The FAQ says "You are not collecting personal information simply because
  your app interacts with personal information" stored on the device when the app does not transmit it. This is
  the situation of the current `localStorage` progress.
- **Analytics.** Persistent identifiers used only for "support for the internal operations" are exempt from
  parental consent; this covers "activities necessary for the site or service to maintain or analyze its
  functioning", but it "does not include behavioral advertising". Push notifications count as online contact
  information.
- **The Rule was amended on April 22, 2025** (stated in the FAQ). The amended regulation text could not be read
  (§13).

**GDPR Article 8 (European Union).** Source: Regulation (EU) 2016/679 on EUR-Lex
(<https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679>).

- Article 8(1): "Where point (a) of Article 6(1) applies, in relation to the offer of information society
  services directly to a child, the processing of the personal data of a child shall be lawful where the child is
  at least 16 years old. Where the child is below the age of 16 years, such processing shall be lawful only if and
  to the extent that consent is given or authorised by the holder of parental responsibility over the child."
  Member States may set a lower age, "not below 13 years".
- Article 8(2): the controller "shall make reasonable efforts to verify" that parental consent, "taking into
  consideration available technology".
- Recital 38: "Children merit specific protection with regard to their personal data, as they may be less aware
  of the risks, consequences and safeguards concerned". Recital 30 names "internet protocol addresses, cookie
  identifiers" as online identifiers that can be associated with a person.
- Article 8 applies when **consent** is the legal basis. A site that asks for no consent because it processes no
  personal data of its own does not reach it. The age each Member State chose was not checked (§13).

**UK Age Appropriate Design Code.** The ICO's pages refused the request, so the Code's text and its fifteen
standards could not be read (§13). What was confirmed is its legal basis: section 123 of the Data Protection Act
2018 requires a code "on standards of age-appropriate design of relevant information society services which are
likely to be accessed by children", where relevant services are those "which involve the processing of personal
data to which the UK GDPR applies" (<https://www.legislation.gov.uk/ukpga/2018/12/section/123>). So the Code, too,
bites where personal data is processed.

**What this implies for features (ours).**

| Feature | Position |
| --- | --- |
| **Accounts, e-mail, nicknames** | Avoid. They are the point where parental consent, verification and data-subject rights start. |
| **Saving progress** | Keep it in `localStorage` as today. To move progress to another device, offer a "progress code" that the child copies by hand or a file export, never a server. |
| **Analytics** | Prefer none. If usage figures are needed, use aggregate counts with no cookie and no persistent identifier, and get this reviewed. |
| **Leaderboards, sharing, chat, comments** | Avoid in the Junior track. |
| **Voice input, camera, uploads** | Avoid. A child's voice or image is personal information under COPPA. |
| **Third-party embeds and scripts** (video players, fonts from a CDN, social widgets, ads) | Avoid. Each one sends the child's IP address and often cookies to another company. Fonts are already self-hosted. |
| **Outbound links** (the lessons' `sources` links to Konami) | Move them to a clearly marked "for parents and teachers" page. NN/g found children cannot tell advertising from content. |
| **Hosting** | The host necessarily sees IP addresses. What Vercel logs and for how long was not checked (§13). A short, plain privacy notice written for parents is worth having even when the site itself stores nothing. |

Israeli privacy law was not researched, although Hebrew is one of the site's languages (§13).

---

## 9. Accessibility and language

### 9.1 WCAG 2.2 criteria that matter for animated, child-facing content

Source: <https://www.w3.org/TR/WCAG22/> and
<https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html>.

| Criterion | Text (quoted) | Consequence here (ours) |
| --- | --- | --- |
| **2.3.1 Three Flashes or Below Threshold (A)** | "Web pages do not contain anything that flashes more than three times in any one second period", or the flash is below the general and red flash thresholds. | Anime impact effects are the risk. One flash per hit, never a strobe, no large saturated-red flashing. |
| **2.2.2 Pause, Stop, Hide (A)** | "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it". | Idle character animation (bobbing, blinking) that loops beside text needs an off switch, or must stop within five seconds. |
| **2.3.3 Animation from Interactions (AAA)** | "Motion animation triggered by interaction can be disabled, unless the animation is essential." | Honour `prefers-reduced-motion` and add an in-app "calm mode" toggle, since a child may not control the device settings. |
| **1.4.2 Audio Control (A)** | Applies "If any audio on a web page plays automatically for more than 3 seconds": there must be a way to pause, stop or control its volume. | A visible mute button from the first screen; no background music by default. |
| **2.2.1 Timing Adjustable (A)** | "For each time limit that is set by the content, at least one of the following is true" (turn off, adjust, extend, and exceptions). | Do not time quizzes (§6). |
| **2.5.7 Dragging Movements (AA)** | "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging". | Every drag interaction also works as tap the card, then tap the zone. |
| **2.5.8 Target Size (Minimum) (AA)** and **2.5.5 (Enhanced) (AAA)** | "at least 24 by 24 CSS pixels"; "at least 44 by 44 CSS pixels". | Aim for the 44-pixel level for children on tablets. Today the progress dots are 24 px (`progress-indicator.tsx`, `h-6 w-6`) and the Previous / Next buttons are about 40 px high (**derived** from `px-5 py-2.5 text-sm`). |
| **3.1.5 Reading Level (AAA)** | Applies "When text requires reading ability more advanced than the lower secondary education level". | The audience is primary-school age, so the target is below what WCAG asks: short sentences, common words, one new term at a time. |
| **1.3.4 Orientation (AA)** | "Content does not restrict its view and operation to a single display orientation." | The 16:9 slide canvas favours landscape; story pages and quizzes should also work upright on a phone. |
| **3.1.1 Language of Page (A)**, **3.1.2 Language of Parts (AA)** | "The default human language of each web page can be programmatically determined." | See §9.3. |
| **3.3.1 Error Identification (A)** | "If an input error is automatically detected, the item that is in error is identified". | A wrong answer is shown as wrong with text and an icon, not by colour alone, and explained. |

The existing habit of giving every slide an `alt` description (`lesson-types.ts`, line 244) should extend to story
pages and interactions: each needs a text equivalent of what the picture shows and of the result.

### 9.2 What the site already does well

- Every slide carries an `alt` text.
- A global reduced-motion rule and `useReducedMotion` in the lesson player.
- Visible focus outlines (`globals.css`, lines 72–75) and full keyboard control of the player.

### 9.3 Language (English, French, Hebrew)

- **Official terminology exists for French, not for Hebrew, as far as could be confirmed.** Konami's *For
  Beginners* page is offered in English, French, German, Italian and Spanish. No official Hebrew version of the
  game's terms was found (§13). The Hebrew track therefore needs a decision on each term: keep the English term,
  transliterate it, or translate it (§12).
- **New text fields must be registered for translation.** `i18n/localize.ts` translates only an allow-list of
  field names (`title`, `description`, `label`, `text`…). Quiz fields such as a question, choices and feedback
  must be added to that list, or they will stay in English.
- **Right-to-left layout.** W3C: "Add `dir="rtl"` to the html tag any time the overall document direction is
  right-to-left", and "Do *not* use CSS to apply base direction in HTML pages"
  (<https://www.w3.org/International/questions/qa-html-dir>). The i18n provider already sets `lang` and `dir` on
  the document in the browser, but `layout.tsx` renders `<html lang="en">` on the server, so the first paint of a
  Hebrew page is English and left-to-right until the script runs. For new interactions, decide deliberately what
  mirrors: the reading order of a story page and the direction of "next" should mirror; the duel field and the
  arithmetic (2000 − 1500 = 500) should not.
- **Mixed-direction text.** Latin card names and numbers inside Hebrew sentences need isolation (the `bdi`
  element), or punctuation and numbers can jump to the wrong side.
- **Fonts.** Neither configured font has Hebrew letters: in the font data shipped with the installed Next.js,
  Cinzel lists only `latin` and `latin-ext`, and Source Sans 3 lists Cyrillic, Greek, Latin and Vietnamese
  (`next/dist/compiled/@next/font/dist/google/font-data.json`). Hebrew text therefore falls back to a system
  font today, and the display style is lost. The same data lists Hebrew-capable families such as Rubik, Heebo
  and Assistant.
- **Voice.** Speech-synthesis voices are per language and per device (§7.3).
- **Text length.** French runs longer than English and Hebrew shorter; speech bubbles must grow with the text.
- **Art without baked-in text.** Keep words out of the illustrations so that one picture serves three languages.

---

## 10. Proposal: an illustrated story layer with something to do in every chapter (ours)

### 10.1 The shape

A **Junior track** made of short **missions**. Each mission has three parts:

1. **Story** (about six to ten pages, one idea per page, one or two sentences, tap to continue). A concept
   character has a problem; the concept solves it. This is the Phippy part.
2. **Try it** (two or three interactions from §6: sort, place, calculate, order).
3. **Quiz** (three to five questions with explained answers, at least one of which revisits an earlier mission),
   then a badge.

The anime presentation is the skin of all three parts: the characters speak in bubbles with a few expressions, a
summon or an attack gets a short dramatic beat, the rival shows up to challenge the child, and the mentor explains
a wrong answer kindly.

### 10.2 A cast where each character is one concept (examples, not final designs)

These are placeholders to show the method. Names and designs must be original, must not resemble any existing
card or anime character, and should be checked against the official card database.

| Character | Concept it embodies | Behaviour that *is* the rule |
| --- | --- | --- |
| A small armoured cub, the child's partner | **Monster** | Has two numbers on its shield (ATK, DEF). Stands tall to fight (Attack Position) or crouches behind the shield (Defense Position). |
| A quick green spark | **Spell** | Acts at once, on your own turn, then is gone. Green is already the Spell colour in the site's theme. |
| A patient pink chameleon | **Trap** | Hides face-down first, waits, and springs out during the *opponent's* turn. |
| A clockwork owl with six chimes | **The turn** | Rings six times in the same order every turn: draw, standby, main, battle, main again, end. |
| A lantern keeper | **Life Points** | The flame starts at full height and shrinks with every hit; when it goes out, the duel is over. |
| A tower of stacking turtles | **The chain** | Each new turtle climbs on top; the last one up is the first one to jump off. |
| A caretaker crow | **Graveyard** | Collects used and destroyed cards and keeps them safe; sometimes something comes back. |
| A boastful but fair rival | The opponent | Gives every mission a reason and the final duel a face. |
| A calm mentor | The teacher | Speaks the one-sentence explanations after each answer. |

### 10.3 Mission list

| # | Mission | Concept character | Rule content (§4.2) | Ends with |
| --- | --- | --- | --- | --- |
| 1 | The Deck wakes up | Cub, spark, chameleon | Three card types; reading a Monster | Sort the cards (D); quiz (A) |
| 2 | The lantern | Lantern keeper | Life Points; how to win | Battle calculator, direct attacks only (B) |
| 3 | Six chimes | Clockwork owl | The phases of a turn | Order puzzle (E); quiz |
| 4 | Onto the field | Cub | Normal Summon, Set, Tribute, zones | Put the card in the right zone (C) |
| 5 | Stand or crouch | Cub and rival | Positions; the three battle outcomes | Battle calculator, full (B); first puzzle duel (F) |
| 6 | Spark and chameleon | Spark, chameleon | Spells now; Traps later and on the opponent's turn | "Can I play it now?" quiz (A); zone placing (C) |
| 7 | The turtle tower | Turtles | A two-link chain | Chain-order puzzle (J) |
| 8 | The rival's challenge | Everyone | A whole short duel | Story duel (G); certificate (I) |

Missions 1 to 5 match Konami's "Beginner - The Basics of Dueling" level; 6 and 7 are the first two "Advanced
Beginner" topics; nothing from the Extra Deck is included.

### 10.4 Ranked shortlist

Ranked by learning value for the effort, in the order they should be built. Scores are 1 (low) to 5 (high);
effort uses the scale of §6 and excludes art and translation.

| Rank | Item | Learning value | Fun | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | **Quiz slide with explained answer** (A) | 5 | 3 | S–M | Low. Only risk is questions that are too hard; keep first-try success high. |
| 2 | **Battle calculator** (B) | 5 | 4 | S–M | Low. |
| 3 | **Illustrated story pages with concept characters** (H, the Phippy layer) | 3 alone, 5 as the frame for 1, 2, 4 | 5 | M code, **L art** | Medium. Art cost and consistency; look-alike risk with existing characters (§8.1); a story that grows too long (§3.3). |
| 4 | **Put the card in the right zone** (C) | 4 | 4 | M | Low to medium. Needs a non-drag alternative and careful right-to-left behaviour. |
| 5 | **Sort the cards** and **order puzzle** (D, E) | 3 | 4 | S–M | Low. |
| 6 | **Puzzle duels, "what would you play?"** (F) | 5 | 5 | M each, after a first M of machinery | Medium. Content-heavy; every puzzle must be rules-correct. |
| 7 | **Local badges, rank ladder, certificate** (I) | 2 | 4 | S | Low while it stays local. Rewards should mark mastery, not time spent. |
| 8 | **Sound effects with mute** (L) | 1 | 4 | S | Low. Original audio only; starts after a tap. |
| 9 | **Read-aloud voice** (K) | 3 for weaker readers | 3 | S (synthesis) to L (recorded, three languages) | Medium. Voice quality and availability vary by device and language. |
| 10 | **Chain-order puzzle** (J) | 4 | 3 | M | Low. Late content. |
| 11 | **Story duel against the rival** (G) | 4 | 5 | L | Medium to high. The largest build; depends on 3 and 6. |
| — | Leaderboards, streaks, timed quizzes, accounts | — | — | — | **Not recommended** (§6, §8.2, §9.1). |

**Where the story layer sits.** On its own a storybook is passive and ranks third for learning. It ranks first for
the feel the owner asked for, and it multiplies the value of ranks 1, 2 and 4 by giving each exercise a reason.
A sensible first slice is therefore **one complete mission** (mission 1 or 2) with a story, one interaction and a
quiz, to test the format with real children before drawing the whole cast.

### 10.5 How it fits the existing code

- **Lesson data.** New slide templates (`story`, `quiz`, `battle-quiz`, `place-card`, `sort`, `order`) join the
  `SlideVisualConfig` union in `lesson-types.ts`; the lesson player and progress store are reused.
- **Progress.** `progress.ts` gains "answered correctly" per interaction, so that completion means the child
  succeeded, not that the last slide was opened. Still `localStorage` only.
- **Layout.** Story and quiz slides need a portrait-friendly layout and larger touch targets than the 16:9
  presentation canvas.
- **Assets.** A new `public/` folder for original sprites and audio.
- **A dedicated route** (for example `/junior`) keeps the adult presentation untouched.

---

## 11. Constraints and risks

| Area | Risk | Mitigation |
| --- | --- | --- |
| **IP: art, characters, music** | Any Konami art, anime character, music or look-alike. Nothing found grants permission (§8.1). | Original everything; a written rule for whoever draws; name check against the card database. |
| **IP: naming** | "Duel Academy" is also the name of Konami's official beginner programme (§8.1). | Decide on the name with legal advice; keep the "unofficial" statement prominent. |
| **Children's privacy** | Any account, identifier, analytics cookie, embed or leaderboard brings COPPA, GDPR and the UK Code into play (§8.2). | Keep the no-backend posture; local progress only; no third-party requests; a short notice for parents. |
| **Photosensitivity and motion** | Anime-style flashes and shakes (§9.1). | One flash per hit, no strobe; reduced-motion support plus an in-app calm mode. |
| **Reading level** | Rulebook language defeats the purpose. | Two sentences per page; one new term at a time; test with children. |
| **Translation** | Three languages multiply text, voice and review; Hebrew has no confirmed official terminology and no font support today (§9.3). | Decide the Hebrew term policy first; text-free art; a Hebrew-capable font. |
| **Rules accuracy** | Simplifying for children can teach something false. | Simplify by leaving things out, not by changing rules; keep each mission's sources. |
| **Art cost** | The cast and its expressions are the largest single cost. | Start with one mission and three characters; schematic style (which the evidence in §3.3 favours anyway). |
| **Shared working tree** | The i18n work in progress touches the same components. | Build the Junior track in new files and a new route. |

---

## 12. Open questions for the owner

1. **Which part of the Phippy guide do you like most**: the characters that each stand for one idea, the short
   story with a problem and a happy ending, the drawing style, or the brevity (one idea and a few words per page)?
   You said the final form could be something else, so the answer decides what must be kept.
2. **How "anime" should it look?** Speech-bubble scenes with expressive still characters (cheap, recommended), or
   truly animated characters (needs an animator and probably Rive)?
3. **Who makes the art?** A commissioned illustrator, your own drawings, or generated images? Each has a
   different cost and a different rights situation, and generated art carries a higher risk of resembling existing
   characters.
4. **A separate Junior track, or replace chapter 1?** This note assumes a separate track.
5. **Which board for children's practice duels**: the full five-zone board the site already draws, or a
   three-zone, 4000 Life Point board like Konami's Speed Duel?
6. **Where will children use it**: tablet, phone, or a classroom screen with an adult? This decides touch-target
   size, orientation and whether voice matters.
7. **Is "no account, progress on this device only" acceptable**, including for a child who changes device? It is
   what keeps the privacy side simple.
8. **Voice**: none, the device's synthetic voice, or recorded voices in three languages?
9. **Hebrew game terms**: keep the English terms, transliterate, or translate?
10. **The name "Duel Academy"**: keep it, given that Konami uses the same name for its official programme?
11. **Is the site commercial in any way** (ads, sales, links to a shop)? COPPA speaks of "commercial websites",
    and the answer changes the legal reading.
12. **Can a few children of the right age test the first mission?** One round of testing will say more than any
    source in this note.

---

## 13. Unverified / could not confirm

- **UK Age Appropriate Design Code.** `ico.org.uk` answered 403 to every request, including the PDF. The Code's
  text and its fifteen standards were **not read**. Statements in §6 and §8.2 about nudging and the Code's scope
  rest on section 123 of the Data Protection Act 2018 only, plus general knowledge that must be checked.
- **COPPA regulation text.** `ecfr.gov` redirected to a block page. Only the FTC's FAQ was read. The content of
  the 22 April 2025 amendments was not verified, and the FAQ predates them in most of its answers.
- **GDPR national ages of consent** (which Member State chose 13, 14, 15 or 16) were not checked.
- **Israeli privacy law** was not researched.
- **A Konami fan-content or video policy.** One web search and three first-party pages found none that permits
  reuse. A search result mentioned Konami video guidelines for creators in Japan; the first-party page was not
  located or read. Absence of a policy was not proven.
- **Official age rating of the card game**, and whether Konami publishes anything specifically for under-13
  players, were not found on the pages read.
- **Official Hebrew terminology** for the game: none found; not proven absent.
- **The earlier note's facts** about Konami's Duel Academy store programme, the 2-Player Starter Set and the Speed
  Duel zone counts were fetched on 2026-10-11 and not re-fetched today.
- **Research papers read only as abstracts** (through OpenAlex, publishers blocked or not attempted): Sailer &
  Homner 2019; Van der Kleij et al. 2015; Schroeder et al. 2013; Mayer & Moreno 2003. The segmenting principle is
  attributed to the last from its title and abstract only. Read in full text: Karpicke et al. 2016 and Clark et
  al. 2016 (first 100,000 characters of the latter).
- **Hanus & Fox 2015**, "Assessing the effects of gamification in the classroom…" (DOI
  10.1016/j.compedu.2014.08.019), often cited for negative effects of badges and leaderboards: the abstract was
  not available, so it is **not used** as evidence here.
- **The Education Endowment Foundation's feedback page** answered 403 and is not cited.
- **Session length and attention span** for ages 8–12: no primary source found. The 5–8 minute mission length is
  our choice, bounded by Konami's 10–15 minute demo limit.
- **Download sizes of Rive and Lottie.** The vendors' pages give no sizes; npm "unpacked size" figures cover
  whole packages with several builds and are not what a browser downloads, so they are not quoted. dotLottie's
  rendering method and reduced-motion handling were not confirmed (its documentation URL had moved).
- **`motion` documentation and version.** The size figures are those of the documentation site on the day, for
  the current release; the app has 14.0.0 installed and they were not measured against it.
- **CSS reduced-motion rule against JavaScript-driven animation** (§7.2): reasoned from the two docs, not tested.
- **Speech synthesis**: whether it needs a user gesture, and which voices exist for French and Hebrew on common
  tablets, were not confirmed.
- **What the host (Vercel) logs** for a static site, and for how long, was not checked.
- **`packages/duel-engine` as the basis for free-play puzzle duels** was not assessed.
- **Device performance and touch-target sizes** were not measured; pixel figures are derived from class names.
- **The example character concepts and names in §10.2** were not checked against existing cards or characters.
- **Phippy book page count and exact words per page** were described from the web page's text, not counted from
  the PDF.

---

## Appendix: primary sources consulted (all accessed 2026-11-16)

**CNCF / Creative Commons**
- <https://www.cncf.io/phippy/the-childrens-illustrated-guide-to-kubernetes/>
- <https://www.cncf.io/phippy/>
- <https://www.cncf.io/phippy/phippy-goes-to-the-zoo-book/>
- <https://creativecommons.org/licenses/by/4.0/>

**Konami**
- <https://www.yugioh-card.com/eu/forbeginners/>
- <https://www.yugioh-card.com/en/judges/demo-faq/>
- <https://www.yugioh-card.com/eu/play/speed-duel-beginners-guide/>
- <https://www.yugioh-card.com/en/rulebook/>
- <https://www.konami.com/yugioh/rushduel/howto/>
- <https://www.konami.com/yugioh/duel_links/en/guide/>
- <https://www.konami.com/yugioh/masterduel/us/en/>
- <https://legal.konami.com/kdeus/yugioh/terms/tou/en/>
- <https://www.yugioh.com/news/terms-of-use>
- <https://www.yugioh-card.com/en/about/code-of-conduct/>

**Regulators and standards**
- <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>
- <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679>
- <https://www.legislation.gov.uk/ukpga/2018/12/section/123>
- <https://www.w3.org/TR/WCAG22/>
- <https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html>
- <https://www.w3.org/International/questions/qa-html-dir>

**Research**
- Karpicke, Blunt & Smith 2016: <https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00350/full>
- Clark, Tanner-Smith & Killingsworth 2016: <https://pmc.ncbi.nlm.nih.gov/articles/PMC4748544/>
- Pashler et al. 2007 (IES): <https://ies.ed.gov/ncee/wwc/PracticeGuide/1>
- Sherwin & Nielsen 2019 (NN/g): <https://www.nngroup.com/articles/childrens-websites-usability-issues/>
- Sailer & Homner 2019: <https://doi.org/10.1007/s10648-019-09498-w> (via `api.openalex.org`)
- Van der Kleij, Feskens & Eggen 2015: <https://doi.org/10.3102/0034654314564881> (via `api.openalex.org`)
- Schroeder, Adesope & Gilbert 2013: <https://doi.org/10.2190/EC.49.1.a> (via `api.openalex.org`)
- Mayer & Moreno 2003: <https://doi.org/10.1207/S15326985EP3801_6> (via `api.openalex.org`)

**Web platform and libraries**
- <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- <https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API>
- <https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis>
- <https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay>
- <https://motion.dev/docs/react-accessibility>, <https://motion.dev/docs/react-reduce-bundle-size>, <https://motion.dev/docs/react-drag>
- <https://rive.app/docs/runtimes/react/react>, <https://rive.app/docs/runtimes/web/web-js>, <https://rive.app/docs/runtimes/web/canvas-vs-webgl.md>
- <https://registry.npmjs.org/motion/latest>, <https://registry.npmjs.org/lottie-web/latest>, <https://registry.npmjs.org/@lottiefiles/dotlottie-react/latest>, <https://registry.npmjs.org/@rive-app/react-canvas-lite/latest>
- Next.js documentation shipped with the installed package: `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` and `01-app/02-guides/view-transitions.md`
