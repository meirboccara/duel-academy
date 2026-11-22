# Junior duels: how to play many more meta cards, and what project-meir's duel apps can teach us

> **Date of observation:** 2026-11-22. Every web page cited below was fetched that day. This repository was read on
> `main` at HEAD `bee4bf7`, with uncommitted edits in `masters.ts`, `junior-play.tsx` and the world files (none in
> `engine.ts`, `cards.ts` or `bot.ts`); line numbers are from the working tree. The reference repo
> `D:\Documents\Projet Meir\project-meir` was read at HEAD `a46aa42`.
> **Nature of this document:** a research note. No code was changed, nothing was installed, run or published.
>
> **The request (owner, verbatim):** "How to improve the duel battle ? You can check how it has been scripted on
> project-meir duel-nextjs apps. Like that we can integrate more meta cards."
>
> **Sourcing rule used:** claims about either repo cite `file:line` (project-meir paths are given from its root).
> Claims about real Yu-Gi-Oh! rules, card text, the banlist or the meta cite Konami's own pages (yugioh-card.com,
> db.yugioh-card.com, yugiohblog.konami.com). The YGOPRODeck API guide is cited for API facts only. Proposals and
> inferences are labelled **(ours)**. Anything that could not be confirmed at a primary source is listed in
> [§7](#7-unverified--could-not-confirm) and is not stated as fact.
>
> **Relation to existing notes.** [academy-phases-spells-traps-endgame.md](./academy-phases-spells-traps-endgame.md)
> §5.3-§5.6 already compared the two engines (on 2026-11-20) and advised against porting project-meir's engine. This
> note does not repeat that table; it goes one level deeper (how each side represents an *effect*), updates it for what
> was built since (`docs/academy-junior-masters-plan.md`, sections of 2026-11-21 and 2026-11-22), and answers the new
> question: what to change so that *meta* cards fit. Rules background (zones, Extra Deck methods, PSCT) is in
> [junior-zones-extra-deck-card-reading.md](./junior-zones-extra-deck-card-reading.md); effect animations in
> [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §2.

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | How is a card effect "scripted" in project-meir's duel-nextjs? | **It is not.** The duel engine there is a *manual* simulator (DuelingBook style): players carry out effects by hand, and the engine only checks turn structure, zones and common rules (`docs/adr/0001-duel-simulator-architecture.md:33-36`, `:65-66`). What *is* written per card lives on the bot side: per-archetype "kits" (TypeScript plays carried out by hand), a table of what each effect does (for judging hand traps), an "answer catalog" of negations, and per-card effect data for the "Duel help" hints. |
| 2 | Is there an engine to port, then? | **No effect engine to port.** Duel Academy's Junior engine is already the more *automatic* of the two: it resolves every effect itself, for 241 cards. project-meir's useful parts are **designs and data shapes**, not code to drop in. |
| 3 | What limits meta cards in Junior today? | Three things in the engine, not the card list: (a) each effect is a hand-written tag with its own branch in a 2 518-line engine; (b) a "chain" is one pending moment answered once, by the non-turn player only, so at most two links; (c) there is no general trigger system ("if this card is Summoned / sent to the GY / added to the hand…"). Every hand trap that dominates today's meta needs (b) or (c). |
| 4 | Recommended direction **(ours)** | Keep Junior's engine and its child-first rules. Inside it: **(1) a real chain stack with Spell Speeds, (2) triggers driven by the events the engine already emits, (3) a small effect vocabulary (actions + filters + costs + "once per turn") that new cards are written in as data**, so a card needs no new engine branch. Borrow project-meir's *shapes* (`EffectTraits`, the answer catalog's outcomes, `DataEffect`'s `once: "name" \| "copy"`), not its code. |
| 5 | First step **(ours)** | The chain stack (§5, Step 1). It unlocks Ash Blossom against monster effects, Ghost Ogre & Snow Rabbit, Infinite Impermanence and Effect Veiler at any moment, which are in nearly every top list at the last YCS (§4.1), and it is the base every later step builds on. |

---

## 1. How academy-ygo represents cards and effects today

### 1.1 Card facts are data; effects are hand-written

- **Printed facts** (Level, ATK, DEF, Type, Attribute, frame, text, banlist status) come from YGOPRODeck, fetched once by
  `apps/academy-ygo/scripts/cards/build-art.mjs:1-9` into the generated `card-art.ts`, listed in `card-art.json`.
  `real(id, rest)` builds a monster from them and only its effect is written by hand
  (`apps/academy-ygo/src/lib/junior/play/cards.ts:314-328`).
- **Effects are a closed union of named tags.** `Effect` (Spells and Traps) has about 55 kinds, each one a card or a
  small family: `"curtain"` (Dark Magical Curtain), `"fire-blast"` (Inferno Fire Blast), `"storm-force"`, `"ruin"`,
  `"trap-hole"`, `"bottomless"`, `"torrential"`… (`cards.ts:6-113`).
- **Monster effects are ~45 optional fields** on `MonsterCard`, most of them one card each: `rocket` (Rocket Warrior),
  `shields` (Magician's Valkyria), `summonSearch` (Magician's Rod), `summonAdd` (Blazeman), `onFusion: "gaia"`,
  `negatesGraveyard` (Blue-Eyes Spirit Dragon)… (`cards.ts:200-292`). Hand traps are one more tag each:
  `HandEffect = "no-battle-damage" | "ash" | "veiler" | "scarecrow" | "fader" | "crow"` (`cards.ts:155`); monster
  "acts" another (`Act`, `cards.ts:176-184`).
- **The whole list:** 241 card entries in `CARDS` (`cards.ts:343-627`), ~61 of them Spells/Traps.

So **every new effect costs**: a tag, the engine branches that read it, legality in `legalPlays`, an answer rule if it
answers something, copy in three languages (`copy-en.ts`, `copy-fr.ts`, `copy-he.ts`), a cue if it needs a picture
(`cues.ts:77` maps only four destroy tags to a strike style), and tests. That is why the 2026-11-22 build lists more
cards *left out* than added: "Not playable exactly, so not in any deck: the Primite, Sage/Maiden/Wishes, Illusion of
Chaos, Soul Servant, Fusion Destiny, Stratos, Masked HEROes, Droll & Lock Bird, Mulcharmy Fuwalos, Ghost Ogre, Infinite
Impermanence, Nibiru" (`docs/academy-junior-masters-plan.md`, section "Tournament decks, hand traps, Traps that answer
a Summon").

### 1.2 The engine: pure, complete, but shaped around one answer

- **Pure reducer.** `apply(board, move)` copies the board, runs the move and returns the new board plus typed events,
  or a refusal reason (`engine.ts:2406-2415`). 48 event kinds (`GameEvent`, `engine.ts:227-310`) feed the
  animations (`cues.ts:1-8`: "a pure function of the board before, the events and the board after"). This is a strong
  base and should be kept.
- **One pending moment, not a chain.** `Board.pending` is a single `Pending`: an attack, a Spell, or a Summon
  (`engine.ts:91-99`). Only the player who is *not* the turn player may answer it (`canAnswer`, `engine.ts:1362-1403`,
  `const who = other(s.turn)` at `:1366`), and what can answer what is a fixed table of tags:
  `TRAP_ANSWERS = { attack: [...13 tags], spell: ["return-to-hand"], summon: ["trap-hole", "bottomless", "torrential"] }`
  (`engine.ts:474`). Chains "stay at two links" (`docs/academy-junior-play.md`, "Rules: what is left out").
- **Ash Blossom is judged by a tag list.** `ashHits` accepts a Spell whose tag is search, deck-summon, draw or curtain,
  and refuses every monster effect (`engine.ts:476-482`). So Ash cannot answer Magician's Rod, Blazeman or any monster
  starter, which is what it is played against in real duels.
- **Triggers are special cases.** `Board.triggers` holds only monsters "sent to the GY" with a damage/LP trigger
  (`engine.ts:121`, resolved in `fireTriggers`, `:685-713`, with a careful "When… you can" missing-the-timing rule);
  `summonTrigger` holds one "When this card is Normal Summoned" monster (`engine.ts:125`). There is no "when a card is
  added to the hand", "when your opponent Special Summons", "when an effect is activated in the GY" event to hang a
  card on.
- **Once per turn** is a list of strings, `"side:card"` (`engine.ts:117`), with ad-hoc keys like
  `` `${who}:${zone}:${slot.card}:act` `` (`:1398`). No distinction between "once per turn" per copy and per name.

### 1.3 The bot: search over legal moves, which is the right base

- `legalPlays` builds every candidate move, runs `apply` on each and keeps the ones that succeed
  (`engine.ts:2438-2518`); `botMove` scores the resulting boards with a persona (`bot.ts:1-28`, `evaluate` `:55`,
  `botMove` `:125`). "Card effects are carried out by the rules engine, exactly as for the child" (`bot.ts:8`).
- Consequence **(ours)**: any card the engine can play, the trainers can play, with no per-deck bot code. This is the
  big advantage over project-meir, where each deck needs a hand-written bot (§2.3).
- Limit: candidates are enumerated exhaustively (`MOST_MATERIALS = 3`, `engine.ts:2418`; every Deck card for a
  search, `:2480`). Meta decks with many searchers and multi-step combos will multiply candidates; a turn of
  "search, then Summon, then search again" needs `plans` depth (`bot.ts:25`).

### 1.4 Tests

14 `engine-*.test.ts` files with about 220 cases (counted with `grep -c "it(\|test("`), plus `cues.test.ts`,
`bot-hand.test.ts`, `masters.test.ts` (banlist and deck checks) and the simulated trainer duels reported in
`docs/academy-junior-masters-plan.md`. Rules are tested as rules; there is no per-card "this text is implemented"
coverage check.

---

## 2. How project-meir's duel-nextjs / duel-server handle effects

### 2.1 The engine: manual by design

- `packages/duel-engine` is "a manual simulator with a rules assistant… card effects are carried out by the players by
  hand: 'special summon this', 'send that to the GY'" (`packages/duel-engine/RULES.md:3-5`). Rules are **hard** (never
  overridable) or **soft** (an effect may bend them; the player resends with `override: true` and both see the claim)
  (`RULES.md:7-15`). ADR-0001 says plainly: "Card effects are not automated. Automating them would mean a card-script
  engine (EDOPro's approach), a different product" (`docs/adr/0001-duel-simulator-architecture.md:65-66`).
- **Chain:** a real multi-link stack, `chain: ChainLink[]` (`packages/duel-engine/src/duel/state.ts:42`); a link is
  `{ number, cardId, seat, kind: "card" | "effect", passcode }` (`src/types.ts:248-256`). `activateEffect` "adds a chain
  link… No other checks" and `resolveChain` resolves the newest link; Normal Spells/Traps stay on the field until the
  whole chain has resolved (`RULES.md`, "Spells and Traps"; `src/duel/rules/spell-trap.ts:121`, `:143`). There is no
  Spell Speed check in the engine (searched `spellSpeed|speed` in `packages/duel-engine/src`: no match).
- **Extra Deck** procedures are checked as soft rules: Synchro Levels and one Tuner, Xyz Rank, Link Rating with Link
  monsters counting 1 or their rating, Link Arrows for zone placement, EMZ limit, Pendulum scales
  (`RULES.md`, "Extra Deck summon procedures", "Pendulum Summon"). This is the most complete *rules* reference for
  Junior to compare against.
- **duel-server** (`apps/duel-server`) runs the same engine authoritatively in Colyseus rooms; it holds no card logic
  (`src/duel-session.ts`, `src/rooms/DuelRoom.ts`; ADR-0001 decision 4).
- **Card data:** the whole pool (~14.7k cards) from YGOPRODeck, ingested daily into Postgres, art mirrored
  (`apps/duel-nextjs/README.md`, "Operations"). Banlists are their own data with a sync and an Admin
  (`docs/adr/0006-owned-banlists.md`).

### 2.2 Where per-card knowledge lives (bot and help side)

| Layer | What it holds | Where |
| --- | --- | --- |
| Text reader | Regexes over Konami's problem-solving card text: where an effect is used from (hand/GY/banished/field) and when (ignition, quick, Summon procedure, "if Summoned"). "A reading, not a script." | `apps/duel-nextjs/src/client/duel/effect-text.ts:1-93` |
| Effect data | Per card, hand-written: `spot`, `timing`, `does` (one line), `once: "name" \| "copy"`, `cost: "discard" \| "tribute"`, `needs(ctx)`, `trigger` event | `src/client/duel/effect-data.ts:8-80` |
| What an effect does | `EffectTraits`: `deck`, `draw`, `search`, `gy`, `summons`, `from` — used to judge Ash Blossom, Ghost Belle, Dominus Purge against it | `src/client/training/bot-kit.ts:143-160`; table `known-effects.ts:1-74`; helpers `searches()`, `revives()`… in `effects/effect-kit.ts:39-74` |
| Answer catalog | Every negation once, with an outcome: `negates-activation`, `negates-effect`, `negates-card`, `negates-name`, `instead`; a rule may read the board | `src/client/training/answers/answer-card.ts:21-75`; ADR `docs/adr/0005-answer-catalog-and-archetype-kits.md:231-247` |
| Archetype folders | `cards.ts` (passcodes, notes), `effects.ts`, `answers.ts`, `rules.ts`, `floodgates.ts`, `kit.ts` (plays), `test-cards.ts` | `src/client/training/archetypes/<name>/` (13 folders: angelechy, ars-magna, blue-eyes, centur-ion, elfnote, mitsurugi, primite, rolad, staples, toon, destiny-hero, time-wizard, course) |
| Kits / bots | Each play is "one card's effect carried out by hand", a `plan(key, ...tasks)` of Intents (`activateSpell`, `openDeck`, `moveCard`…) | e.g. `archetypes/staples/kit.ts:41-100`; `bot-kit.ts:177`; bot classes of 1 700-3 100 lines (`ars-magna-bot.ts`, `training-bot.ts`) |
| Taught Lines | A closed vocabulary of steps a Teacher records by playing; replay-checked on the engine | `docs/adr/0004-teaching-the-training-duel-bots.md:86-127`; `src/client/training/lines.ts` |

About 34 000 lines of non-test TypeScript under `src/client/training/` and 53 test files there. That is the real cost
of "meta cards" in a manual engine: each meta deck is a bot of its own.

### 2.3 AI

Scripted heuristic bots per deck (WindBot-style ordered plays), plus the hand-trap kit, plus Lines taught by people and
drafted from replays by an AI reviewer that never writes moves (`ADR-0004` §8). No search over moves: the engine
cannot simulate effects, so it cannot enumerate legal effect plays (project-meir
`docs/research/duel-bots-and-ai.md` §7.2 table; §7.4 "Legal-Intent enumeration… **No**").

### 2.4 Siblings, briefly

- `D:\Documents\Projet Meir\ygolib`: a small Bun/TypeScript prototype with one class per card (`canBePlayed`,
  `canBeActivated`, `onEnterZone`, `resolve`), 16 cards (`src/library/monsters/izuna.ts:1-88`), several effects
  stubbed (`izuna.ts:54-57` "Can send K9 card…" with an empty body). Not the source of duel-nextjs's engine and not
  mature enough to reuse.
- `yugioh`, `ygo-3d`, `judge-ygo`: a web app, 3D/Blender assets, and the YGOPROJudge rules-AI service. No duel effect
  engine relevant here (directory listings only).
- **EDOPro / ocgcore** (outside the workspace) is the fully scripted reference: every card a Lua script; project-meir's
  notes record it as AGPL (`project-meir/docs/research/modern-duel-simulator-stack.md:713`) and its card scripts as Lua
  5.3 run by ocgcore (`project-meir/docs/research/duel-bots-and-ai.md:185-190`).

---

## 3. Side by side, for the meta-card question

| | Junior (academy-ygo) | duel-nextjs (project-meir) |
| --- | --- | --- |
| Who resolves effects | The engine, automatically (child-friendly) | The players by hand; bots by their own kits |
| Effect representation | Closed tag union + per-card fields, branches in `engine.ts` | None in the engine; bot-side tables (`EffectTraits`, catalog, kits) |
| Chain | One pending moment, ≤ 2 links, only the non-turn player answers | Unlimited LIFO stack, no Spell Speed check |
| Triggers | Two special cases | Duel help *reminds* of triggers; nobody runs them |
| Legal moves | Full enumeration by trial (`legalPlays`) | Common rules only; effects free-form |
| Bot | Generic search over the engine; any playable card works | One hand-written bot per deck |
| Card pool | 241 curated, effects as printed or left out | ~14.7k, any card (manual) |
| Child cues | One event → one animation, built in | Adult simulator, log text |

**Conclusion (ours):** Junior already has the hard part project-meir avoided (automatic resolution + search bot). What
it lacks is *generality* in three places (chain, triggers, effect vocabulary). project-meir offers good *vocabulary*
for those (traits, outcomes, once-per-name), not an implementation.

---

## 4. The meta today, and what its cards need

### 4.1 What is played (Konami's own pages)

- **Forbidden & Limited List effective 2026-10-19** (yugioh-card.com, `list_2026-10-19`): Called by the Grave, Maxx "C",
  Pot of Greed, Crossout Designator, Elfnote Tinia, Ame no Habakiri no Mitsurugi, Triple Tactics Talent are Forbidden
  (Advanced). Droll & Lock Bird, Foolish Burial, Reinforcement of the Army, Terraforming, Branded in High Spirits are
  Limited. Ash Blossom & Joyous Spring, Infinite Impermanence, Nibiru the Primal Being, Mulcharmy Fuwalos, Ghost Ogre
  & Snow Rabbit, Effect Veiler are not on the list (unlimited). Junior's banlist data should be checked against this
  date (its build of 2026-11-22 did not open Konami's page, per `docs/academy-junior-masters-plan.md`).
- **YCS Orlando Advanced, Top 32** (Konami blog, posted 2026-11-08). The page lists decks without names; reading the
  main decks gives about 12 Elfnote/Ars Magna, 10 Angelechy, 3 Sky Striker, 2 Shade/Ars Magna, and one each of Radiant
  Typhoon, Magistus/Fairy Tail, Invoked, Artmage, DoomZ (archetypes inferred from card names, see §7). **Hand traps:**
  Ash Blossom and Droll & Lock Bird in nearly every list, Ghost Ogre & Snow Rabbit in most (often 3), Effect Veiler in a
  minority, Ghost Mourner & Moonlit Chill in a few.

### 4.2 What those cards ask of an engine (card text from db.yugioh-card.com)

| Card | What the text needs | Junior today |
| --- | --- | --- |
| Ash Blossom & Joyous Spring | Quick Effect from the hand when a card *or effect* is activated that adds from the Deck to the hand, Special Summons from the Deck, or sends from the Deck to the GY; negate that effect; once per turn | Spells only (`engine.ts:476-482`) |
| Droll & Lock Bird | Quick Effect when a card is added from the Main Deck to the opponent's hand outside the Draw Phase; for the rest of the turn neither player can add from the Main Deck to the hand | No "added to hand" event, no lingering lock |
| Ghost Ogre & Snow Rabbit | Quick Effect, from hand or field, when a monster or face-up Spell/Trap activates an effect: destroy that card; once per turn | No answer to monster effects; no chain link on top of an effect |
| Infinite Impermanence | Trap, target a face-up monster the opponent controls, negate its effects this turn; column clause if Set; from the hand if you control no cards | Effect Veiler's `negatedTurn` exists (`engine.ts:47`), but no Trap from the hand, no columns |
| Effect Veiler | In the opponent's Main Phase, any time | Offered only when a Spell is activated or a monster Summoned (`masters-plan`, 2026-11-22 "Left out") |

The pattern **(ours)**: the meta's interaction is *chaining to monster effects*, *triggers on hand/Deck/GY events*, and
*locks for the rest of the turn*. None of these is a single card's quirk; each is a mechanism.

### 4.3 What the decks themselves ask (project-meir's notes, not primary)

project-meir describes Angelechy as "Fairy Synchro Monsters… that place them in the Spell & Trap Zone as face-up
Continuous Spells, each with a trigger when placed and a floodgate while it stays"
(`apps/duel-nextjs/src/client/training/archetypes/angelechy/cards.ts:1-6`, citing its `docs/research/angelechy-combos.md`),
and Ars Magna is played with Power Patron/Artmage cards and Pendulum treasure cards (`archetypes/ars-magna/cards.ts`).
**(ours)** These are long combo decks with floodgates; they are poor first lessons for children and the most expensive
to automate. They belong at the end of the plan, as "meta-lite" versions if at all.

---

## 5. Options

| Option | What it means | Effort | Tests | Child cues | Bundle | Licence | Verdict (ours) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Port duel-nextjs's engine | Replace Junior's engine with `@khol/duel-engine` | Very high: it does not resolve effects, so every Junior effect would have to be rebuilt on top, plus undo/hints/refusal reasons | Lose ~220 rule cases, gain its rules tests | Lost: its events describe manual moves, not "lightning destroys" | +~7k lines (zero deps, MIT) | MIT (`packages/duel-engine/package.json`) | **No.** Already advised against (academy-phases-spells-traps-endgame.md §5.6); the facts have not changed |
| B. Share a package | Extract a common `ygo-rules` package for both repos | High, and the repos are now separate (`CLAUDE.md`: "Moved out of `meirboccara/project-meir`") | Shared | — | — | Both owned | **Not now.** The engines disagree on the core (manual vs automatic); share data (banlist JSON, card facts), not code |
| C. Adopt a Lua/ocgcore engine | Run EDOPro's core (WASM) with its scripts | Very high; Lua in the browser; a different rules UX | Inherit theirs | Must map ~100s of messages to cues | Large (core + scripts) | AGPL (project-meir note, §2.4) | **No** for a closed child app; licence and UX both against |
| D. **Effect vocabulary inside Junior's engine** | Keep `apply`/events/bot; add chain stack, trigger bus, and effects as data built from ~20 actions | Medium, incremental; each step usable alone | Keep all current tests; add one per action and a per-card coverage test | Each action already maps to an event → cue; new cards animate for free | Small (data) | Ours | **Yes** |
| E. Keep adding tags | Status quo | Low per card, rising | Per card | Per card | Small | Ours | Works for anime decks; does not scale to meta |

What to borrow from project-meir for option D **(ours)**:
- `EffectTraits` (`bot-kit.ts:143-160`) as the *categories* every effect declares, derived automatically from its
  actions, so Ash/Droll/Ghost Belle judge any card, not a tag list.
- The answer catalog's outcomes (`answer-card.ts:21`) as the negate action's modes: activation, effect, card, instead.
- `DataEffect.once: "name" | "copy"` (`effect-data.ts:22-24`) for hard vs soft once per turn.
- Archetype folders with `test-cards.ts` copied from the card database (ADR-0005 addendum) as the layout for meta
  packs.
- The bot-match arena idea (`bot-match-run.ts`; ADR-0005 consequences) — Junior already simulates trainer duels; make
  it a CI check per pack.
- `effect-text.ts`'s PSCT regexes as a *drafting aid* for writing a card's effect entry, never as the engine.

---

## 6. Incremental plan (ours)

Each step keeps the child rules intact: the levels of islands 1-18 stay on the small board and their limits; the new
mechanisms appear on the masters' island and in a later "meta" island. Each step ends with the simulated trainer duels
("no duel got stuck") and a per-card test.

### Step 1: a real chain stack with Spell Speeds (first)

- Replace `pending: Pending | null` with `chain: Link[]` plus the open moment kind (attack, Summon, activation).
  Both players get a chance to respond in turn; resolve LIFO; Spell Speed 1/2/3 (Counter Trap only answered by
  Counter Trap: Rulebook v10 p. 45 as cited in project-meir `docs/adr/0004…:145`). Keep "depth ≤ N" as a teaching
  option per level, so islands 6 and 8 still teach a two-link chain.
- Monster effects (hand, field, GY) create links, so answers can target *effects*, not only Spells.
- **Unlocks:** Ash Blossom against monster effects (Magician's Rod, Blazeman, Sage with Eyes of Blue-style starters),
  Ghost Ogre & Snow Rabbit, Effect Veiler at any moment of the opponent's Main Phase, Infinite Impermanence (with
  "from the hand if you control no cards"), Solemn-style Counter Traps, Blue-Eyes Spirit Dragon's GY negation on a
  real link. These are the most-played hand traps at YCS Orlando (§4.1).
- Child cues: a visible chain "tower" already exists as a concept (island 6, Turtle tower); show it with numbered
  links and resolve them top-down with the existing cues.

### Step 2: triggers from events

- Turn the 48 `GameEvent`s into trigger sources: "if Summoned / Normal Summoned / Special Summoned", "if sent to the GY",
  "if added from the Deck to the hand (except Draw Phase)", "if your opponent Special Summons", "if destroyed by battle",
  "at the End Phase". Generalise `fireTriggers` (`engine.ts:685-713`) and `summonTrigger` (`:125`) into one queue,
  keeping the "When… you can" missing-the-timing rule already taught.
- Add "for the rest of this turn" locks as board flags with an expiry (Droll's lock, "you cannot Special Summon except…").
- **Unlocks:** Droll & Lock Bird, Mulcharmy-style draw-on-Summon cards (text not checked, §7), Nibiru-style "after the
  5th Summon" (not checked), on-Summon searchers of every modern starter, "if this card is sent to the GY: add…" floaters.

### Step 3: effects as data (the vocabulary)

- An effect entry: `{ from: hand|field|gy|banished, speed, condition, cost, targets, actions[], once: name|copy|null,
  trigger? }`. ~20 actions: `search(filter)`, `specialSummon(from, filter, position)`, `sendToGy(from, filter)`,
  `banish`, `destroy`, `negate(mode)`, `draw(n)`, `discard`, `changeStats`, `returnToHand`, `attach/detach`, `burn`,
  `gainLp`, `setFromDeck`, `lock(kind, until)`. Filters: name, "lists [name]" (`mentions`, `cards.ts:330`), archetype
  (YGOPRODeck returns an `archetype` field and filter: "Filter the cards by archetype (Dark Magician, Prank-Kids,
  Blue-Eyes, etc)", API guide), Type, Attribute, Level range.
- Categories (`deck`, `search`, `gy`, `summons`, `draw`) are *computed* from actions, so Ash/Droll/Ghost Belle judge any
  card; this removes `ashHits` (`engine.ts:476-482`) and `TRAP_ANSWERS` (`:474`).
- Migrate the existing tags one by one behind the same tests; each action emits the events `cues.ts` already draws.
- Copy: one generated line per action in three languages ("adds 1 'Blue-Eyes' monster from the Deck to the hand") plus
  the card's real text, so a new card needs no hand-written sentence to be playable.
- **Unlocks (teachable, already wanted by the owner's decks):** Sage with Eyes of Blue / Maiden / Wishes and Primite
  for Blue-Eyes; Soul Servant, Illusion of Chaos for Dark Magician; Fusion Destiny, Stratos, Mask Change-style cards for
  HEROes (all on the 2026-11-22 "left out" list). Then the simpler meta engines: Sky Striker (Spell-heavy) and Invoked
  (Fusion from field/GY), both in the YCS Orlando Top 32.

### Step 4: Extra Deck generality

- Generic material filters for every method; Link Arrows and the "zone a Link points to" placement (today "only one
  Link Monster exists", `docs/academy-junior-play.md`); Link monsters as materials counting 1 or their rating (project-meir
  `RULES.md` has the rule written down); Pendulum from the Extra Deck.
- **Unlocks:** generic Link-2/3 staples most meta decks run, and the Extra Deck halves of Sky Striker and the Ars Magna
  family.

### Step 5: meta packs, last

- Archetype folders (project-meir's layout) with their effect entries, a deck, a trainer persona, and a bot-arena run
  in CI. Angelechy (monsters as Continuous Spells, floodgates) and Elfnote/Ars Magna (Pendulum + many hard once-per-turn
  effects) come last; consider "meta-lite" lists with the hand traps and staples but shorter combos, for children.
- Bot: keep search, add move pruning (one representative per search target class, time budget per move) as candidates
  grow (§1.3).

### Order and payoff

| Step | Mechanism | Cards it unlocks (examples) | Risk |
| --- | --- | --- | --- |
| 1 | Chain stack + Spell Speed | Ash (full), Ghost Ogre, Veiler (full), Infinite Impermanence, Counter Traps | Medium: touches `canAnswer`, `resolvePending`, the UI's answer prompt |
| 2 | Event triggers + turn locks | Droll, on-Summon searchers, GY floaters | Medium |
| 3 | Effect vocabulary | Blue-Eyes/DM/HERO modern support, Sky Striker, Invoked | High effort, low risk if migrated behind tests |
| 4 | Extra Deck generality | Link staples, Sky Striker/Ars Magna Extra Decks | Medium |
| 5 | Meta packs | Angelechy, Elfnote/Ars Magna, Shade | High; teachability questionable |

---

### Status (2026-11-23)

What was built from this plan, on `main`:

| Step | Done | Left out, for later |
| --- | --- | --- |
| 1 | Chain links above what is pending, Spell Speed 3 Counter Traps (Solemn Strike, Seven Tools of the Bandit, Magic Jammer), a moment for a monster's activated effect, Ash Blossom against monster effects, Ghost Ogre & Snow Rabbit, Infinite Impermanence, a per-level `chainLimit`. | Effect Veiler at any time of the opponent's Main Phase (no open priority without a moment); Solemn Strike's "would be Special Summoned" half; Impermanence's column lock. |
| 2 | The "added from the Deck" moment and Droll & Lock Bird; "for the rest of this turn" locks (`Board.locks`). | The older `fireTriggers`/`summonTrigger` code is not folded into the new trigger handling. |
| 3 | `effects.ts` vocabulary (filters, choice, target, categories), data Spells and monster effects (ignition from field/hand/GY, Summon and sent-to-GY triggers), Ash judged by categories; Terraforming, One for One, Toon Table of Contents, Foolish Burial, Sage with Eyes of Blue, The White Stone of Legend, Destiny HERO - Malicious, Elemental HERO Shadow Mist. | Migrating the older tags; one choice per effect; conditional "then, if…" steps (Sky Striker Mobilize - Engage!). |
| 4 | Link Arrows and placement, Link material rules (count as 1 or the rating), Pendulum from the Extra Deck; Gaia Saber, Link Spider. | Arrows toward the other player (co-links), Fusion/Synchro/Xyz material filters as data. |
| 5 | `packs/` with a folder per archetype (Blue-Eyes, HERO meta-lite): deck, engine cards, persona; legality and pack-against-pack tests. | Wiring packs into an island or the trainers; Angelechy, Ars Magna and the other tournament engines; move pruning (not needed yet: a pack duel takes seconds). |

## 7. Unverified / could not confirm

- **Archetype tally of YCS Orlando.** Konami's Top 32 page lists cards, not deck names; the archetypes were inferred from
  card names by a summariser and not checked list by list. Placements were not on that page.
- **Does a draw count for Ash Blossom?** Junior treats Pot of Greed-style draws as Ash targets (`engine.ts:479`);
  project-meir's bots say "a draw is not adding a card from the Deck to the hand (Ash Blossom does not answer it)"
  (`bot-kit.ts:150`), while its own WindBot note lists "do not negate Upstart Goblin" (`windbot-and-training-bot-decks.md`
  §2.9), which implies it can. The two repos disagree; Konami's card FAQ was not opened. Settle before Step 3.
- **Mulcharmy Fuwalos, Nibiru, Solemn Strike, Ghost Mourner, Sky Striker and Invoked card texts** were not read today;
  their placement in the plan is from memory of how they work.
- **Rulebook v10 p. 45** (Spell Speed 3) is cited through project-meir's ADR-0004, not re-read today.
- **Infinite Impermanence and Ghost Ogre texts** were read on db.yugioh-card.com as summaries (the page tool would not
  quote them whole); the details in §4.2 follow those summaries.
- **Angelechy / Ars Magna mechanics** are project-meir's description, not Konami text.
- **ocgcore / EDOPro licence** is AGPL per project-meir's earlier note; the LICENSE files were not read.
- Junior's banlist data was not compared card by card against the 2026-10-19 list.

## Sources

- Konami, Forbidden & Limited List effective 2026-10-19: <https://www.yugioh-card.com/en/limited/list_2026-10-19/>
  (index <https://www.yugioh-card.com/en/limited/>)
- Konami, YCS Orlando Advanced Main Event Top 32 Deck Lists (2026-11-08):
  <https://yugiohblog.konami.com/2026/ycs/ycs-orlando-advanced-main-event-top-32-deck-lists/>
- Konami card database (searches for Ash Blossom, Droll & Lock Bird, Ghost Ogre, Infinite Impermanence):
  <https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=en>
- Official Rulebook v10 (as cited by the notes above): <https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf>
- YGOPRODeck API guide (archetype filter, `desc` field, 20 requests/s, no hot-linking): <https://ygoprodeck.com/api-guide/>
