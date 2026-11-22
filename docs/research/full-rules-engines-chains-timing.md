# Full-rules engines: chains, timing, and what Duel Academy's engine would need

> **Date of observation:** 2026-11-22/23. This repo was read on `main` (HEAD `7d5587d`, with uncommitted edits outside
> `packages/engine`). Line numbers for `engine.ts`, `catalogue.ts`, `effects.ts` are from the working tree. Only this note
> was added: no code, commits, branches, issues or publication. Downloads (git clones, Konami PDFs/pages) were kept in
> the system temp directory (`%TEMP%\fullrules-research`), outside the repository; Python ran with `-I`.
>
> **Question (GitHub issue #3, as given):** how do existing full-rules Yu-Gi-Oh! engines, mainly **ygopro-core** (C++,
> Lua card scripts) and Konami's own rulebook/rule documents, represent: chains and Spell Speed priority, missing the
> timing ("when" vs "if"), simultaneous triggers / SEGOC, costs vs effects, activation vs effect negation, once per
> turn, continuous effects/layering, Summon procedures, Monster Zone columns, control vs ownership? What would our engine
> need to match them, and can code or card-script data be reused under each licence in a closed/commercial
> children's web app? The owner chose **full tournament rules** for meta decks.
>
> **Sourcing rule:** source code is cited as `repo@commit:file:line`; Konami as URL plus printed page. Anything that is
> an interpretation, recommendation or a reading of our code's behaviour without running it is labelled **(ours)**.
> What could not be confirmed is in [§7](#7-could-not-confirm). This is not legal advice; licence verdicts are a
> reading of the licence files.
>
> **Builds on:** [duel-engine-meta-cards.md](./duel-engine-meta-cards.md) (Option C "adopt ocgcore" rejected there on an
> *unverified* AGPL claim, its §7) and §1 of [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md)
> (mechanism codes CHAIN/HAND, TRIG/LOCK, VOCAB, CONT, FUS/SYN/XYZ/LINK/PEND, ZONE/CONTROL).

### Sources read (pinned)

| Short name | Repository / document | Commit or version | Licence (verified how) |
| --- | --- | --- | --- |
| **core-F** | [Fluorohydride/ygopro-core](https://github.com/Fluorohydride/ygopro-core) (YGOPro's core, "ocgcore") | `6a56aa0` (2026-11-20) | **MIT** — `LICENSE` ("Copyright (c) 2015 Fluorohydride"); GitHub API `license.spdx_id = MIT` |
| **core-E** | [edo9300/ygopro-core](https://github.com/edo9300/ygopro-core) (EDOPro's core, fork of core-F) | `e7f3e9b` (2026-11-21) | **AGPL-3.0-or-later** — `LICENSE:1-19` + `COPYING`; source headers `SPDX-License-Identifier: AGPL-3.0-or-later` (34 files); `LICENSE:21-45` keeps core-F's MIT notice for the upstream part |
| **scripts-F** | [Fluorohydride/ygopro-scripts](https://github.com/Fluorohydride/ygopro-scripts) | `7aaa890` (2026-11-18) | **GPL-2.0** — `LICENSE:1-2` ("Version 2, June 1991"); GitHub API `GPL-2.0` |
| **scripts-PI** | [ProjectIgnis/CardScripts](https://github.com/ProjectIgnis/CardScripts) (EDOPro's scripts) | `d3ac03b` (2026-11-22) | **AGPL-3.0-or-later** — `COPYING`; `README.md:36-51` "Copyright (C) 2020 Project Ignis contributors… GNU Affero General Public License… version 3… or (at your option) any later version" |
| BabelCDB | [ProjectIgnis/BabelCDB](https://github.com/ProjectIgnis/BabelCDB) (card databases, `cards.cdb`) | root listing via GitHub API | **No licence file**; GitHub API reports none |
| YGOPro client | [Fluorohydride/ygopro](https://github.com/Fluorohydride/ygopro) | GitHub API only | GPL-2.0 (API) |
| **RB10** | Konami, Official Rulebook v10: <https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf> (31 PDF pages, two printed pages each) | v10 | Konami copyright |
| **FET** | Konami, "Fast Effect Timing": <https://www.yugioh-card.com/en/play/fast-effect-timing/> (+ chart `T-Flowchart_EN-US.jpg`) | fetched 2026-11-22 | Konami |
| **R2021** | Konami, "2021 Rules Update": <https://www.yugioh-card.com/en/play/2021_rules_update/> | fetched 2026-11-22 | Konami |
| **UCT3–7** | Konami EU, "Understanding Card Text" parts 3–7: <https://www.yugioh-card.com/eu/play/understanding-card-text/> | fetched 2026-11-22 | Konami |

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | How does ygopro-core model the rules? | A **generic effect system**: every card ability is an `effect` object with a *type* (Activate, Ignition, Trigger-optional/forced, Quick-optional/forced, Continuous, Single/Field…), flags, a count limit, and four Lua callbacks — `condition`, `cost`, `target`, `operation` (core-F `effect.h:30-71`). The core owns the chain stack, priority, trigger collection (SEGOC), missing the timing, negation, once-per-turn counters and continuous-effect evaluation; card scripts only *declare* effects. |
| 2 | Is Konami's model the same? | On the points Konami publishes, yes: Spell Speeds 1–3 and "equal or greater" responses (RB10 p. 44-45), turn-player priority and passing (RB10 p. 48; FET chart), SEGOC order (RB10 p. 50), costs paid before activation and not refunded (RB10 glossary "Pay a Cost"), "when … you can" can miss the timing (UCT6, UCT7), trigger lost if its card changes location before it can activate (R2021). ygopro-core encodes each of these explicitly (§2). |
| 3 | Biggest gap in our engine **(ours)** | Ours has a *pending moment* plus links above it, where only Counter Traps can be added generically and other answers come from fixed lists; triggers fire one by one (non-turn player's optional ones automatically); costs and the searched card are chosen at activation; once-per-turn is string keys; ATK is a sum; one Extra Monster Zone per player; no columns; control is an `owner?` field. Matching full rules means replacing these with ygopro-like *generic* mechanisms — not adding more tags. |
| 4 | Can we reuse code? | **ygopro-core (Fluorohydride) is MIT**: copying/porting is permitted in a closed app with the copyright notice kept. **EDOPro's core and both card-script repos are copyleft (AGPL-3.0+, GPL-2.0)**: not usable in a closed app (§6). Card text/names in any database are Konami's. Game rules themselves are not copyrightable, so re-implementing the *rules model* from Konami's documents (and from reading code, as ideas) is fine. |
| 5 | Recommended path **(ours)** | Keep our TypeScript engine (pure reducer, events → cues, search bot). Re-shape its core on ygopro's proven decomposition: one chain of links with per-link flags; a priority loop following Konami's FET chart; an event queue with trigger lists (forced/optional × turn/non-turn, "when"/"if" flag) and a break point for missing the timing; effects as `{type, speed, range, condition, cost, target, operation, once}` data; continuous effects queried with timestamps. Use core-F (MIT) as a *reference* for edge cases; write card data ourselves (do not import Lua scripts). |

---

## 1. The model in one picture

ygopro-core's processor is a state machine of "process units" (`core-F processor.cpp:37` `field::process()`), with
these units relevant here:

| Unit | What it does | Where |
| --- | --- | --- |
| `process_instant_event` | For each raised event: run Continuous effects; collect **forced** triggers into `new_fchain`, **optional** into `new_ochain`, forced Quick into `quick_f_chain`; remember the event for "delayed" ("if") effects | `processor.cpp:1825-1956` |
| `process_point_event` | At a point where triggers may activate: build the **SEGOC chain** — turn player's forced, opponent's forced, turn player's optional, opponent's optional — then hand priority on | `processor.cpp:1294-1521` |
| `process_quick_effect` | One **priority window** for one player: list every effect that may activate now (responses to events, free-chain effects, delayed quick effects); on a pass, offer the other player; two passes in a row close the window | `processor.cpp:1598-1823` |
| `add_chain` | Activate: move the card, mark once-per-turn, **pay cost**, **choose targets**, then `break_effect()` and raise `EVENT_CHAINING` (so responses can see it) | `processor.cpp:4011-4294` |
| `solve_chain` | Resolve the top link: skip if **activation negated**; else if **effect negated/disabled** do nothing; else run `operation`; then the next link | `processor.cpp:4394-4606` |
| `break_effect` | The "something else happened" point: every optional trigger **without** the "if" flag is dropped and the client is told it **missed the timing** | `processor.cpp:4607-4627` |

Konami's equivalent is prose: RB10 pp. 44-50 and the FET chart. Each row below maps the two.

---

## 2. Topic by topic: Konami, ygopro-core, Duel Academy

### 2.1 Chains, Spell Speed, priority

**Konami.**
- "There are Spell Speeds from 1 to 3. You can only respond with an effect if it is Spell Speed 2 or higher, and has an
  equal or greater Spell Speed than the effect on the Chain Link before it." SS1: Normal/Equip/Continuous/Field/Ritual
  Spells, Ignition/Trigger/Flip effects — "cannot be Chain Link 2 or higher, unless multiple Spell Speed 1 effects are
  activated simultaneously". SS2: Traps, Quick-Play Spells, Quick Effects. SS3: Counter Traps; "Only another Spell
  Speed 3 card may be used to respond" (RB10 p. 45).
- "If a card's effect is activated, the opponent is always given a chance to respond… If your opponent does not respond,
  you may activate a second effect and create a Chain to your own card's activation. Both players continue to add effects
  to the Chain until they both wish to add nothing else, then you resolve… starting with the last card that was
  activated" (RB10 p. 44; example with Heavy Storm / Threatening Roar / Seven Tools, p. 46-47).
- "The turn player always starts with Priority… After a card's activation, and at the end of each phase or step,
  Priority passes to the opponent" (RB10 p. 48).
- FET: the game state is "open" only when "the Turn Player has the chance… AND passes to the opponent AND the opponent
  then passes back AND no Chain is currently being formed". After the turn player activates, "the player who did NOT
  activate the effect" goes next; after an action that does not start a Chain (Summon, Set, attack declaration) or after
  a Chain resolves, if a trigger exists the chain rules apply, otherwise the turn player, then the opponent (FET chart
  boxes A–E). Actions that only happen in an open state include Normal Summon, Set, Special Summons that do not start a
  Chain, position changes, attack declaration, Ignition effects, SS1 Spells (FET).
- "Summoning a monster, Tributing, changing a monster's battle position and paying costs are not effect activations…
  you cannot respond to those actions using a Chain" (RB10 p. 51, "Actions which cannot be Chained to").

**ygopro-core.**
- Spell Speed is *derived*, not stored: `effect::get_speed()` returns 1 for Trigger/Ignition, 2 for Quick, and for an
  Activate effect 2 for a Quick-Play, 1 for other Spells, 3 for a Counter Trap, 2 for other Traps (`core-F effect.cpp:768-789`).
- Can it go on the Chain now? `effect::is_chainable(tp)`: SS1 card activations refuse if a chain exists; otherwise the
  effect's speed must be ≥ the top link's (`effect.cpp:586-616`, the `sp < …rbegin()->triggering_effect->get_speed()`
  test). A hand optional trigger may join a chain unless the top is SS3 (same lines). Card-imposed *chain limits*
  (Lua functions, "your opponent cannot activate cards in response") are checked in the same function.
- Priority alternation is literal: `process_quick_effect` case 3 — on an activation, push `ADD_CHAIN` then another
  `QUICK_EFFECT` for `1 - priority`, resetting both `infos.priorities`; on a pass, set `priorities[priority] = 1` and,
  unless both have passed, offer the other player (`processor.cpp:1795-1818`). Point-event step 9 hands the first
  window to the turn player when no chain exists, otherwise to the player who did not activate the last link
  (`processor.cpp:1488-1497`) — exactly the FET rule.
- A link is a `struct chain` with the triggering effect, player, controller, location, sequence, position, a snapshot
  of the card's state, the target cards, the event that started it, `opinfos` (declared categories), `flag`, and who/what
  disabled it (`core-F field.h:54-78`). Chain flags: `CHAIN_DISABLE_ACTIVATE`, `CHAIN_DISABLE_EFFECT`,
  `CHAIN_CONTINUOUS_CARD`, `CHAIN_FORCED`… (`field.h:659-665`).

**Duel Academy today** (`packages/engine/src`).
- `Board.pending` is one moment (`attack | spell | summon | effect | added | open`, `engine.ts:94-114`) and
  `Board.chain: ChainLink[]` holds links 2+ (`engine.ts:126-145`, `:161-164`); a link's `speed` is `2 | 3` only
  (`:136`). `actor()` gives the move to the opponent of the top link, or the non-turn player while something is pending
  (`engine.ts:546-550`).
- `addLink` gives the other player a window only if `counterReady` (a Set Counter Trap that fits) — so after a Spell
  Speed 2 answer only a Counter Trap can be added, and `answerLink` rejects anything else (`engine.ts:1482-1533`).
  Which hand effects may answer which pending moment is a fixed list in `handReady` (`engine.ts:1277-1300`) and Trap
  answers a table (`TRAP_ANSWERS`, `engine.ts:553`). The answering player is always `other(s.turn)` in `handEffect`
  (`engine.ts:2631`). The turn player's own data effect opens a window only if `who === s.turn && !s.pending`
  (`engine.ts:912-919`); otherwise it resolves at once.
- `chainLimit` (`engine.ts:163-164`) is a deliberate teaching limit; keep it **(ours)**.

**Gap (ours).** No general rule "any effect whose speed ≥ top link may respond, alternating players until two passes";
no turn-player self-chaining; no SS1 Chain Link 1 started by the non-turn player's trigger; answers are enumerated by
card tag rather than by `speed + condition`.

### 2.2 Missing the timing: "when" vs "if"

**Konami.**
- UCT7: certain Trigger and fast effects "might only be usable in response to a triggering event that was 'the last
  thing that happened'. (This is usually the case for cards that 'CAN' be used 'WHEN' something happens…)". With
  "THEN", the later action is the last thing that happened (Heraldry Change example: after it, "neither player can
  activate cards like Torrential Tribute that activate 'WHEN' a monster is Summoned").
- UCT6: "because it uses 'and Special Summon' instead of 'then Special Summon'… pitching a card and Summoning… happen
  simultaneously. This means that you will not miss the timing for any 'when… you can' optional effects of the card
  you sent to the Graveyard".
- R2021: a Trigger Effect whose condition was met but which is "saved for later" (in the middle of a chain or card
  effect) does **not** activate if its card's location (field, GY, hand, banished, Deck) changed in between.

**ygopro-core.**
- "If" vs "When" is one flag: `EFFECT_FLAG_DELAY` (`core-F effect.h:204`). A script for an optional "When …: You can"
  trigger omits it; an "If …: You can" adds it. Example, scripts-PI `official/c7084129.lua` (Magician's Rod): its
  "When this card is Normal Summoned" search is `EFFECT_TYPE_SINGLE+EFFECT_TYPE_TRIGGER_O` with no property (lines 6-13),
  its GY effect has `SetProperty(EFFECT_FLAG_DELAY)` (lines 16-23).
- Missing the timing is `break_effect()`: every entry of `new_ochain` (optional triggers) **without** `EFFECT_FLAG_DELAY`
  is erased and `MSG_MISSED_EFFECT` is sent (`processor.cpp:4607-4627`). It is called by scripts at "then"
  (`Duel.BreakEffect`, `libduel.cpp:1783-1786`), after activation costs/targets (`add_chain` case 9,
  `processor.cpp:4258`), before each link resolves (`solve_chain` case 1, `:4425`), and inside some operations
  (`operations.cpp:1786, 2369, 2864`). Forced triggers (`new_fchain`) are never dropped this way.
- "If" effects use a separate event list: events are pushed to `delayed_activate_event` and spliced into `full_event`
  at the next point event (`processor.cpp:1937`, `:1305`); delayed effects are then checked against all of them
  (`:1709-1737`), so they survive later actions.
- The R2021 location rule is `check_trigger_effect`: under `MASTER_RULE_2020` a trigger stays valid only while the card
  keeps its *relation* to the pending chain entry (`field.cpp:3641-3659`); relations are cleared when the card moves
  (`card.cpp:2106-2108`, `clear_relate_effect()`).

**Duel Academy today.**
- The old `Trigger` (`catalogue.ts:304-316`) carries `word: "when" | "if"` and `forced`, resolved in `fireTriggers`
  after the move. Data effects (`DataEffect.when`, `catalogue.ts:256-261`) have no when/if distinction; they are
  collected per move in `afterTriggers` (`engine.ts:928-962`) and are offered "now, and only now" via
  `Board.triggered` (`engine.ts:180-181`).

**Gap (ours).** One timing flag on every optional trigger, and "break" points at "then", after costs, and between
chain links. The R2021 location rule needs card identity across moves (an instance id), which our `CardId` (a card
*name* id) cannot express.

### 2.3 Simultaneous triggers and SEGOC

**Konami.** "If effects of Spell Speed 1 cards (like Trigger Effects) are activated at the same time, they will be
resolved in a special Chain. This Chain is made starting with the turn player's mandatory effects… Then the opponent
continues the Chain with their mandatory effects in any order. Afterwards, the turn player adds their optional effects
in any order, and finally the opponent adds their optional effects in any order" (RB10 p. 50). Also: "where both
players resolve an effect simultaneously, the turn player resolves the effect first" (same page).

**ygopro-core.** `process_point_event` implements exactly this order: case 2–3 loop over `new_fchain_s` with
`core.current_player` = turn player, then switch to `1 - infos.turn_player` when the turn player has none left
(`processor.cpp:1315-1370`); case 4–6 do the same for `new_ochain_s` (optional) with a "use this effect?" prompt
(`:1371-1448`). Each chosen trigger is pushed to `new_chains` and `ADD_CHAIN` runs, so the triggers form one chain the
players can then respond to (case 9 opens the quick-effect window, `:1488-1497`). Triggers whose controller changed
are re-attributed to the current controller (`:1324-1327`).

**Duel Academy today.** `afterTriggers` gathers started effects per round, puts the turn player's optional ones in
`Board.triggered` for a later choice, and **auto-activates everything else**, including the non-turn player's optional
effects, "with the first card that fits" (`engine.ts:956-961`, `autoActivate` `:1004-1014`). Each activation runs on
its own (`activate`, `:877-921`), not as one SEGOC chain.

**Gap (ours).** A trigger queue split into four lists and assembled into one chain in Konami's order, with the
opponent choosing their own optional triggers; then the normal priority loop on top.

### 2.4 Costs vs effects; targets vs choices at resolution

**Konami.** "Activation text (red) is separated from the card effects (blue) by a semicolon… everything after the
conditions is divided between what happens when you activate the card (red text, before the semicolon) and what
happens when the card resolves" (UCT3). "Costs are always paid at activation. If the card tells you to pay, discard,
Tribute, or destroy in the activation text (before the semicolon), it's a cost" (UCT4). "You have to pay any costs
before you declare the activation… Even if the activation of the card is negated, you cannot get a refund of the cost"
(RB10 glossary "Pay a Cost", p. 52-53).

**ygopro-core.** `cost`, `target` and `operation` are separate callbacks (`effect.h:63-67`). `add_chain` runs cost
(case 7, `processor.cpp:4238-4247`), then target (case 8, `:4248-4256`), then raises `EVENT_BECOME_TARGET` for
targeted cards and `EVENT_CHAINING` (case 9, `:4257-4293`). Each callback has a `chk==0` "can I?" mode used for
legality without side effects (e.g. scripts-F `c14558127.lua:26-30`, Ash's discard cost). Non-targeted choices
(which card to search) are made **in `operation`**, at resolution (scripts-PI `official/c26202165.lua`, Sangan:
`Duel.SelectMatchingCard` inside `s.operation`). The target step also declares *operation info* —
`Duel.SetOperationInfo(0,CATEGORY_TOHAND,nil,1,tp,LOCATION_DECK)` — stored on the link (`chain.opinfos`,
`field.h:72`) so other cards can judge "an effect that would add from the Deck" (Ash's condition reads it,
scripts-PI `official/c14558127.lua:19-38`).

**Duel Academy today.** `DataEffect.cost` is one of four tags (`catalogue.ts:271-275`); costs are paid inside
`activate` before the window opens (`engine.ts:893-907`), which matches Konami. But the card a search will add (`pick`)
and the target are chosen **at activation** and stored on the pending run (`engine.ts:909`; `catalogue.ts:195-198`:
"A step that chooses a card uses the effect's one chosen card (`pick`)"). Categories are computed from the actions
(`effects.ts:63-72`) — the right idea, close to ygopro's categories + opinfo.

**Gap (ours).** General costs (multiple, LP, Tribute, banish from hand/field, detach), the `chk` dry-run pattern for
legality (our `stepsReady` is a partial equivalent, `engine.ts:782-801`), and moving non-target choices to resolution
(this changes what Ash/Droll answer: e.g. a search with an empty Deck at resolution).

### 2.5 Negating an activation vs negating an effect

**Konami.** RB10's chain example: Seven Tools "negates the activation of 'Threatening Roar'" (p. 47). UCT5: cards
that "negate the Summon" can only negate a built-in Summon, "Spell & Trap Cards that Summon, as well as
Trigger/Flip/Ignition/Quick Effects that Summon, cannot be negated by cards that 'negate the Summon'. Because they
aren't Summons – they're effects."

**ygopro-core.** Three distinct operations:
- **Negate the activation** — `field::negate_chain` sets `CHAIN_DISABLE_ACTIVATE` (`operations.cpp:16-40`); at
  resolution the link is skipped entirely, an OATH once-per-turn is refunded, and `EVENT_CHAIN_NEGATED` is raised
  (`processor.cpp:4411-4423`). Seven Tools: `Duel.NegateActivation(ev)` (scripts-F `c3819470.lua:28-30`).
- **Negate the effect (of this chain link)** — `field::disable_chain` sets `CHAIN_DISABLE_EFFECT`
  (`operations.cpp:41-60`); the card was still activated, but `operation` is not run, `EVENT_CHAIN_DISABLED` is raised
  (`processor.cpp:4450-4460`). Ash: `Duel.NegateEffect(ev)` (scripts-F `c14558127.lua:35-37`).
- **Negate a card's effects on the field** (Effect Veiler, Impermanence) — not a chain operation but continuous
  effects `EFFECT_DISABLE` / `EFFECT_DISABLE_EFFECT` placed on the card (scripts-F `c97268402.lua:39-45`); a link
  whose card is disabled when it resolves is also not applied (`STATUS_DISABLED` check, `processor.cpp:4452`).
- "Cannot be negated" is split too: `EFFECT_FLAG_CANNOT_INACTIVATE` (activation) checked by `is_chain_negatable`,
  `EFFECT_FLAG_CANNOT_DISABLE` (effect) checked by `is_chain_disablable` (`field.cpp:3435-3474`; flags `effect.h:197-198`, `:211-212`).

**Duel Academy today.** Links carry one `negatedBy` (`engine.ts:143-144`); Counter Traps negate the activation and
destroy (`engine.ts:1549-1556`, `:1604-1612`); `Pending.effect.negated` and `Action {do: "negate"}`
(`catalogue.ts:229-230`, `engine.ts:1103-1107`) cover "negate that effect"; `negatedTurn` covers Veiler/Impermanence
on the field (`engine.ts:47-48`). A negated answer still spends its once-per-turn (`spendNegated`, `engine.ts:1581-1603`).

**Gap (ours).** Make the two link flags explicit (activation-negated vs effect-negated) on *every* link, with
"cannot be negated" flags; refund only OATH-style limits; "negate the Summon" as a separate moment (Solemn Strike's
"would be Summoned" half is listed as left out in duel-engine-meta-cards.md Status).

### 2.6 Once per turn

**Konami.** The documents read show the printed forms ("Once per turn:", UCT4/UCT6 examples; R2021: "you can only
Special Summon X once per turn" counts only successful Summons) but **no official definition** of "You can only use
this effect of [name] once per turn" vs "Once per turn" was found in the pages read (§7).

**ygopro-core.** `Effect.SetCountLimit(count, code, flags)` (`libeffect.cpp:167-184`):
- No code → a **per-effect-object** counter (`count_limit`), recharged every turn (`processor.cpp:3735-3738`) **and
  whenever the card changes location/face** (`card::reset_effect_count`, called on leave/to-field/set,
  `card.cpp:2119-2122`, `:2186-2191`). That is the "soft" once per turn of each copy.
- A code (usually the card's passcode, `SetCountLimit(1,id)`) → a **per-player counter keyed by code**
  (`field::get_effect_code`/`add_effect_code`, `field.cpp:1353-1385`), cleared at each turn start
  (`processor.cpp:3697-3699`). Shared codes (`{id,1}`) give "1 of these effects"; the same code on several effects of
  one card gives "only 1 [name] effect per turn".
- Modifiers: `EFFECT_COUNT_CODE_OATH` (counts only if the activation is not negated — refunded at
  `processor.cpp:4412-4415`), `EFFECT_COUNT_CODE_DUEL` (once per Duel, separate map), `EFFECT_COUNT_CODE_CHAIN` (once per
  chain, cleared when a chain ends, `:1514-1516`), `EFFECT_COUNT_CODE_SINGLE` (per card instance) (`effect.h:136-139`;
  `check_count_limit`/`dec_count` `effect.cpp:163-181`, `:670-685`). Usage in scripts-PI `official/`: `(1,id)` 4 323
  times, `(1)` 3 187, `(1,{id,1})` 2 461, `(1,id,EFFECT_COUNT_CODE_OATH)` 1 109, `(1,id,EFFECT_COUNT_CODE_DUEL)` 45
  (grep count over `official/*.lua`).
- The counter is spent at activation (`peffect->dec_count(tp)` in `process_point_event`/`process_quick_effect`, e.g.
  `processor.cpp:1364`, `:1441`, `:1805`).

**Duel Academy today.** `Board.used: string[]` (`engine.ts:170-171`); `DataEffect.once: "name" | "shared" | "copy"`
→ keys `side:card:effect-i`, `side:card:effects`, `side:card:effect-i:zone-z` (`engine.ts:802-807`); hand traps use
ad-hoc keys like `${who}:ash` (`engine.ts:1288`). **(ours, static reading):** the "copy" key is tied to the zone, so
a copy that leaves and comes back to the same zone in the same turn stays "used", unlike ygopro's reset on leaving; there
is no OATH, per-Duel or per-chain scope.

### 2.7 Continuous effects and "layering"

**Konami.** RB10 names Continuous Effects as a kind of monster effect (pp. 8-9) and Artemis is explained as a Continuous
Effect in UCT6, but the documents read publish **no ordering rule** for several continuous ATK changes (§7).

**ygopro-core.** Continuous effects are effect objects of type Single/Field/Equip/Target/Xyz-material, found by
`card::filter_effect`, which gathers them and sorts by `effect_sort_id` — initial single effects first, then by
creation id, i.e. a **timestamp** (`card.cpp:2625-2636`, `effect.cpp:15-21`). `card::get_atk_def` (`card.cpp:730-…`)
then applies them in groups: base value (`get_base_atk_def`), single `SET_ATTACK`, then in timestamp order
`UPDATE_ATTACK` (split into self vs other sources), `SET_ATTACK`, `SET_ATTACK_FINAL` (with "wicked"/"option"
sub-classes), `SWAP_AD`, then repeat-updates; levels/ranks work the same way with `UPDATE_LEVEL` / `CHANGE_LEVEL`
(`card.cpp:985-1048`). Values are cached per query (`temp.attack`) to break recursion. Control is also a continuous
effect: `refresh_control_status` takes the newest `EFFECT_SET_CONTROL` (`card.cpp:2208-2224`).

**Duel Academy today.** `atkOf = base + boost + bonus + fieldBonus + spellBonus + gainsOf`, clamped at 0
(`engine.ts:536-537`); each term is a hand-written reader (`spellBonus` `:502-514`, `gainsOf` `:516-535`). No "becomes
X", "original ATK", halving, or order.

**Gap (ours).** A list of active continuous modifiers (source, kind: set-base / add / set-final / swap, timestamp,
affected filter, duration) evaluated by one function; Continuous Spells/Traps and monsters-as-Continuous-Spells
(Angelechy, Marine Eidolon in meta-decks-engine-coverage §1) become sources of such modifiers and of floodgates.

### 2.8 Summon procedures

**Konami.** RB10 pp. 12-25 describe Link (pp. 12-15, incl. "Link Monsters count as 1 OR their own Link Rating", p. 15),
Pendulum (pp. 16-17: scales in the leftmost/rightmost Spell & Trap Zones; Pendulum Monsters going to the GY go face-up
to the Extra Deck; from the Extra Deck only to the EMZ or a zone a Link points to), Xyz (pp. 18-19), Synchro (pp.
20-21), Fusion and Ritual (pp. 22-25). R2021: Fusion, Synchro and Xyz may now go to any Main Monster Zone; the EMZ /
link-pointed restriction remains for Link and Pendulum-from-Extra-Deck. UCT5: built-in Summons (with "(from …)") can be
negated by "negate the Summon"; Summons by effects cannot; "must first be Special Summoned" monsters must be properly
Summoned before they can be revived.

**ygopro-core.** The core knows only *types* (`SUMMON_TYPE_FUSION … LINK`, `card.h:420-432`), the hooks
`EFFECT_SPSUMMON_PROC` / `EFFECT_SPSUMMON_PROC_G` (`effect.h:311`, `:495`), `EFFECT_SPSUMMON_CONDITION`,
`EFFECT_REVIVE_LIMIT` and `STATUS_PROC_COMPLETE` ("properly Summoned", `card.cpp:3214`). The procedures are **Lua
library code**, attached by each card script: scripts-F `procedure.lua` — `AddSynchroProcedure` (line 60),
`AddXyzProcedure` (485), `AddFusionProcMix` (862), `AddRitualProcUltimate`/`Greater` (1750, 1906),
`EnablePendulumAttribute` (1948), `AddLinkProcedure` (2128); scripts-PI `proc_synchro.lua:32`, `proc_xyz.lua:30`,
`proc_link.lua:9`, `proc_fusion.lua:53`, `proc_pendulum.lua`, `proc_ritual.lua` (3 878 lines in total for the six).
Each registers a `condition/target/operation` triple on `EFFECT_SPSUMMON_PROC` with `SetValue(SUMMON_TYPE_…)`. The
2020 Extra Deck zone rule is in the core (`field.cpp:825`).

**Duel Academy today.** Procedures are engine branches: Fusion recipes by name or `FusionMaterial` predicate
(`catalogue.ts:337-342`, `:399-400`), Xyz `{level,count}` (`:401-402`), Link materials/rating/arrows (`:387-396`,
`linkRatingFits` `engine.ts:587-595`), Pendulum scales (`engine.ts:538-544`), the R2021 zone rule
(`engine.ts:2111-2112`, `:2177-2182`), `proper` for revive limits (`engine.ts:172-173`); Ritual names one monster
(`catalogue.ts:140-141`).

**Gap (ours).** Procedures as data per card (materials as filters with counts, Synchro tuner/non-tuner sums, Xyz
alternative procedures, material-count effects), "Summon by effect" vs "built-in Summon" distinguished for negation.

### 2.9 Monster Zone columns, EMZ, links

**Konami.** "If 2 Extra Monster Zones are available, you can choose either one" (RB10 p. 12); a monster in the
opponent's EMZ is still theirs; "If you take control of your opponent's monster in the Extra Monster Zone, it moves to
your Main Monster Zone. When it goes back… to their Main Monster Zone" (p. 15). (Columns are used by card text only,
e.g. Infinite Impermanence; no rulebook page was found defining "column", §7.)

**ygopro-core.** Each player has `list_mzone` (7 slots: 0-4 Main, 5-6 the two shared EMZ) and `list_szone`
(0-4, 5 Field, Pendulum in 0/4 under current rules) (`field.h:88-90`). Zones are bit masks: own zones in the low 16 bits,
the opponent's shifted by 16. `card::get_column_zone` computes a column as the same index on one's own side and
`4 - seq` on the opponent's, with EMZ 5 above Main 1 and EMZ 6 above Main 3 (`card.cpp:1448-1480`);
`card::get_linked_zone` maps each of the 8 arrows to own and opponent zones, including EMZ ↔ opponent's Main Zones
(`card.cpp:1287-1330`); there are mutual-link ("co-link") helpers (`card.h:279-280`).

**Duel Academy today.** One EMZ per player at index 5 of `monsters` (`engine.ts:10-13`, `:76-77`); `arrowTarget`
returns only same-side zones and treats the EMZ as above Main zone 1 (`engine.ts:567-582`); "arrows toward the other
player (co-links)" and Impermanence's column lock are left out (`engine.ts:1627-1628`).

**Gap (ours).** Two shared EMZ slots on one board coordinate system, column/adjacency functions, cross-side arrows.

### 2.10 Control vs ownership

**Konami.** "Cards you 'control' are the cards in your Monster Zone, Spell & Trap Zone, Field Zone, and Pendulum
Zone… If a player takes control of a card from their opponent, move it to the new controller's side… If sent to the
Graveyard, or returned to the hand or Deck, it is always returned to the Graveyard / hand / Deck of the original
owner" (RB10 glossary "Control / Possess", p. 52-53). Xyz Materials stay attached if the Xyz Monster's control
changes (RB10 p. 51).

**ygopro-core.** A card has `owner` and `current.controler` (`card.h:155-160`); control is an `EFFECT_SET_CONTROL`
continuous effect created by `field::set_control` with reset conditions (`field.cpp:474-495`), the newest one
winning (`card.cpp:2208-2224`); `field::get_control` checks Main Monster Zone space and legality
(`operations.cpp:872-…`); destinations use `pcard->owner` (e.g. `operations.cpp:220-243`). Effects are executed by
the *controller* at trigger time (`process_point_event` re-attributes, `processor.cpp:1324-1327`).

**Duel Academy today.** `MonsterSlot.owner?: Side` "when it is not its controller's" (`engine.ts:51-52`),
`borrowed` Xyz materials (`:33-34`), `ownerOf` for materials (`:1347-1348`). No effect that changes control and no
duration for it.

---

## 3. What our engine would need, ordered (ours)

This refines the mechanism codes of meta-decks-engine-coverage §1 with ygopro's structure. Each step keeps `apply`,
`GameEvent` → cues and `legalPlays`/bot search.

| Step | Change | ygopro reference (MIT, core-F) | Unblocks (from earlier notes) |
| --- | --- | --- | --- |
| A. Card instances | Give each physical card a stable instance id with `owner`, `controller`, location, face, and a "moved" counter. Needed for R2021, soft once-per-turn reset, control. | `card.h:155-160` (`previous`, `current`, `owner`) | ZONE/CONTROL, LOCK |
| B. One chain + priority loop | Replace `pending` + `chain` with `chain: Link[]` (link 1 included). A `Link` = {player, card instance, effect ref, speed, location/controller snapshot, targets, declared categories, flags `activationNegated` / `effectNegated`}. A priority state {player, passedBy}. Implement the FET chart: open state → turn player; after activation → other player; two passes → resolve top; after resolution → triggers, then turn player. Responses legal iff `speed ≥ top.speed` and their condition holds. Keep `chainLimit` as a teaching cap. | `struct chain` `field.h:54-78`; `get_speed` `effect.cpp:768-789`; `is_chainable` `:586-616`; `process_quick_effect` `processor.cpp:1598-1823` | CHAIN/HAND (Ash vs anything, MST on Quick-Plays, multiple hand traps, own-turn hand effects, Veiler at any time) |
| C. Event queue + SEGOC | Every engine action raises typed events (we already emit them). Collect triggers into four lists (forced/optional × turn/non-turn); build the SEGOC chain in Konami's order; the non-turn player chooses their own optional triggers (today they auto-fire, `engine.ts:959-960`). | `process_instant_event` `processor.cpp:1825-1956`; `process_point_event` `:1294-1521` | TRIG/LOCK |
| D. Missing the timing | `timing: "when" \| "if"` on optional triggers; a `breakEffect()` at "then", after cost/target, before each link resolves; "if" effects remember events until the next point. | `EFFECT_FLAG_DELAY`; `break_effect` `processor.cpp:4607-4627` | Correct "When… you can" for every new trigger card |
| E. Effect record | `{ type: activate\|ignition\|trigger\|quick\|continuous, range, event?, timing?, condition, cost, target, operation, once }` where cost/target have a dry-run mode and operation makes non-target choices at resolution. Categories stay computed from actions (`effects.ts:63-72`) and are frozen on the link at activation (opinfo). | `effect.h:30-71`; `add_chain` `processor.cpp:4238-4294` | VOCAB, GY/BANISH |
| F. Negation | Two link flags + "cannot be negated" flags; negate-Summon as a moment of its own; disabled-on-field as a continuous modifier. | `operations.cpp:16-60`; `field.cpp:3435-3474` | Solemn Strike's Summon half, Impermanence |
| G. Once per turn | Counter scopes: per effect instance (reset on move), per player+code (hard, "1 [name] effect"), OATH (refund if activation negated), Duel, chain. Spend at activation. | `libeffect.cpp:167-184`; `effect.cpp:163-181, 670-685`; `field.cpp:1353-1385` | every meta card ("You can only use each effect of X once per turn") |
| H. Continuous modifiers | One list of active modifiers with timestamps; `atkOf/defOf/levelOf/controllerOf/isNegated` become queries over it, in ygopro's group order (base → set → add → set-final). Floodgates ("neither player can…") are modifiers too. | `card.cpp:730-…` (`get_atk_def`), `:2625-2636`; `effect.cpp:15-21` | CONT, Angelechy, monsters-as-Continuous-Spells |
| I. Zones | Board coordinates: 5 Main + 2 shared EMZ + 5 S/T + Field per side; column = same index / `4-i` across; arrows across sides; EMZ control moves to Main Zone. | `get_column_zone` `card.cpp:1448-1480`; `get_linked_zone` `:1287-1330` | ZONE, Impermanence column, co-links |
| J. Procedures as data | Material specs per Extra Deck card (filters, counts, tuner/non-tuner, Link-rating rule, alternative Xyz), Ritual "greater/equal", Fusion-by-effect from Deck/GY/opponent; built-in vs effect Summon. | scripts-F `procedure.lua` (read as rules reference only; GPL-2.0) | FUS-MAT/SYN/XYZ/LINK/PEND/RITUAL |

Order **(ours)**: A → B → C/D → E/G → F → H → I → J. B is the heart (it touches `canAnswer`, `resolvePending`,
`addLink`, the UI prompt and every hand trap); A and H are the expensive refactors because `CardId` is used as both card
name and identity throughout. Bot search cost will rise with free priority windows; ygopro's own clients prompt "chain?"
only when a hint timing applies (`spe_effect`, `check_hint_timing`, `processor.cpp:1752-1794`), a pattern worth copying
for both the child UI and the bot's move generator.

---

## 4. Differences between the two ygopro cores worth knowing

- core-E (EDOPro) restructured the processor into typed units (`Processors::PointEvent`, `QuickEffect`, `AddChain`,
  `SolveChain`; `processor.cpp:492-555`, `:587`) and renumbered count-code flags (`effect_constants.h:16-19`:
  OATH=0x1, DUEL=0x2, SINGLE=0x4, CHAIN=0x8). The concepts above are the same (`effect.cpp:126, 511, 579, 694`;
  `operations.cpp:20, 46`).
- scripts-PI and scripts-F are **not interchangeable** with the other core (core-E README: "It is incompatible with
  forks not derived from this one").
- Both encode Ash Blossom as a Quick-Optional on `EVENT_CHAINING` from the hand, hard once per turn by passcode, cost
  discard, condition reading the link's declared categories (draw included) and `Duel.NegateEffect` (scripts-F
  `c14558127.lua:1-37`; scripts-PI `official/c14558127.lua:1-45`). This is how they settle the "does Ash answer a
  draw?" question that duel-engine-meta-cards.md §7 left open — **as their interpretation, not a Konami ruling**.

---

## 5. Konami documents, at a glance

| Topic | Where Konami says it |
| --- | --- |
| Spell Speeds, responses | RB10 p. 44-45 |
| Chain building/resolution, example | RB10 p. 44, 46-47 |
| Turn player priority, passing at phase end | RB10 p. 48; FET |
| Open game state, who goes next | FET (text + chart boxes A–E) |
| SEGOC; simultaneous resolution order | RB10 p. 50 |
| Actions that cannot be chained to | RB10 p. 51 |
| Costs; no refund on negation | RB10 p. 52-53 glossary "Pay a Cost"; UCT4 |
| Conditions : activation ; resolution (PSCT) | UCT3, UCT4 |
| "When… you can" / last thing that happened; THEN vs AND | UCT6, UCT7 |
| Trigger lost when its card moved first | R2021 |
| Summon negation only of built-in Summons | UCT5 |
| EMZ (2, either), control of EMZ monster, Link materials | RB10 p. 12-15 |
| Pendulum Summon / Extra Deck face-up | RB10 p. 16-17 |
| Fusion/Synchro/Xyz to any Main Zone (2021) | R2021 |
| Control vs possession; owner's GY/hand/Deck | RB10 p. 52-53 glossary |

---

## 6. Licences and reuse for a closed, commercial children's web app

| What | Licence (verified) | Can a closed app use it? (ours, not legal advice) |
| --- | --- | --- |
| **Fluorohydride/ygopro-core** (C++ core) | MIT | **Yes**, including translating parts to TypeScript, provided "the above copyright notice and this permission notice shall be included in all copies or substantial portions" (`LICENSE`). Practical limits: it is C++ (WASM build or port), and does nothing without card scripts, which are copyleft. Best use: a **reference** for edge cases; if any function is ported, add the MIT notice to a `THIRD_PARTY_NOTICES` file. |
| **edo9300/ygopro-core** (EDOPro core) | AGPL-3.0-or-later (MIT for the inherited upstream portion) | **No.** Distributing it to browsers (WASM) is conveying under AGPL; a modified version served over a network must offer its source to every user (`COPYING` §13, lines 540-548). Do not copy code from it; consult core-F (MIT) for the same logic instead. |
| **ProjectIgnis/CardScripts** (EDOPro Lua scripts, `proc_*.lua`) | AGPL-3.0-or-later | **No.** Do not import, translate mechanically or ship. |
| **Fluorohydride/ygopro-scripts** (YGOPro Lua scripts, `procedure.lua`) | GPL-2.0 | **No** for shipping: any distribution (including JS/WASM bundles sent to browsers) brings GPL-2.0 obligations to the combined work. |
| ProjectIgnis/BabelCDB (`cards.cdb`) | No licence file | **No**: no grant means all rights reserved; it also contains Konami's card text. |
| Third-party WASM builds of a core (e.g. `n1xx1/ocgcore-wasm`, MIT per GitHub search) | wrapper MIT | **(ours)** a wrapper's licence does not relicense the core it compiles; if it builds EDOPro's core, the AGPL applies. Its build was not inspected (§7). |
| Game rules themselves | — | Not protected: "The idea for a game is not protected by copyright… the methods for playing it are not protected by copyright" (U.S. Copyright Office, <https://www.copyright.gov/register/tx-games.html>). Re-implementing SEGOC order, Spell Speed tests, once-per-turn scopes, etc. from Konami's documents is free; Konami's *text* (rulebook prose, card text) is protected expression. |

**Verdict (ours).** Nothing copyleft can be reused. The only code that could legally be reused is core-F (MIT), and
it is more valuable as a design reference than as code (language, and dependence on GPL/AGPL scripts). Card behaviour
must be written by us as data; reading open scripts to *understand a ruling* is reading ideas, but to keep a clean
provenance **(ours)**: write card data from Konami's card text and official FAQs, not by transcribing Lua scripts, and
record the source of each card's entry.

---

## 7. Could not confirm

- **Konami's own definitions of "hard" vs "soft" once per turn**, and of whether "Once per turn" resets when a card
  leaves and returns: not found in RB10, FET, R2021 or UCT2-7. §2.6 describes ygopro's model only.
- **Konami's continuous-effect ordering ("layering")** for ATK/DEF changes: not found in the English documents read.
  ygopro's timestamp + group order (§2.7) is its implementation, not checked against an official rule; the OCG's
  Japanese rule documents were not read.
- **The "upcoming piece of our Advanced Gameplay web section" on strict activation timing** promised in UCT7 was not
  found; the missing-timing rule here rests on UCT6, UCT7 and R2021.
- **A rulebook definition of "column"**: not found in RB10 (it appears in card text). The column geometry in §2.9 is
  ygopro's.
- **Pendulum Zone indices in core-F** (Spell & Trap zones 0/4 under the current Master Rule vs dedicated slots in older
  rules) were not traced line by line.
- **core-F's licence history** (whether it was ever under another licence): only the current `LICENSE` and GitHub's
  API were checked; the clone was shallow.
- **Third-party WASM ports' contents and licences** were only seen in GitHub search results.
- **RB10 is older than the 2020-2021 rule changes**; where they differ, R2021 was preferred. No newer rulebook PDF was
  found on the rulebook page (it links v10, a Speed Duel guide and a Structure Deck guide).
- **Behaviour of our engine** in §2 (e.g. non-turn optional triggers auto-firing, "copy" once-per-turn not resetting)
  is from reading the code, not from running tests.

## Sources

- Fluorohydride/ygopro-core @ `6a56aa0`: <https://github.com/Fluorohydride/ygopro-core> — `LICENSE`, `effect.h`,
  `effect.cpp`, `field.h`, `field.cpp`, `processor.cpp`, `operations.cpp`, `card.h`, `card.cpp`, `libeffect.cpp`, `libduel.cpp`
- edo9300/ygopro-core @ `e7f3e9b`: <https://github.com/edo9300/ygopro-core> — `LICENSE`, `COPYING`, `README.md`,
  `processor.cpp`, `processor_unit.h`, `effect.cpp`, `effect_constants.h`, `operations.cpp`
- Fluorohydride/ygopro-scripts @ `7aaa890`: <https://github.com/Fluorohydride/ygopro-scripts> — `LICENSE`,
  `procedure.lua`, `c14558127.lua`, `c3819470.lua`, `c97268402.lua`
- ProjectIgnis/CardScripts @ `d3ac03b`: <https://github.com/ProjectIgnis/CardScripts> — `COPYING`, `README.md`,
  `CONTRIBUTING.md`, `proc_*.lua`, `official/c14558127.lua`, `official/c26202165.lua`, `official/c7084129.lua`
- GitHub REST API repository metadata (licence fields) for the repos above, ProjectIgnis/BabelCDB, Fluorohydride/ygopro, edo9300/edopro
- Konami, Official Rulebook v10: <https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf> (index <https://www.yugioh-card.com/en/rulebook/>)
- Konami, Fast Effect Timing: <https://www.yugioh-card.com/en/play/fast-effect-timing/>
- Konami, 2021 Rules Update: <https://www.yugioh-card.com/en/play/2021_rules_update/>
- Konami, Understanding Card Text parts 3-7: <https://www.yugioh-card.com/eu/play/understanding-card-text/part-3-conditions-activations-and-effects/>,
  <https://www.yugioh-card.com/eu/play/understanding-card-text/part-4-the-clues-on-your-cards/>,
  <https://www.yugioh-card.com/eu/play/understanding-card-text/part-5-special-summons/>,
  <https://www.yugioh-card.com/eu/play/understanding-card-text/part-6-finding-clues-in-turbo-pack-6-and-generation-force/>,
  <https://www.yugioh-card.com/eu/play/understanding-card-text/part-7-conjunction-functions/>
- U.S. Copyright Office, Games: <https://www.copyright.gov/register/tx-games.html>
