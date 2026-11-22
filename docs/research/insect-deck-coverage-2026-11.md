# The best Insect deck for Weevil Underwood: choice, lists legal under the October 19, 2026 list, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #13, "Best Insect deck for Weevil"):** compare today's Insect-type candidate archetypes (Beetrooper and others), pick the strongest with evidence, then find its lists for a pool of up to 10 lists legal under Konami's Forbidden & Limited List effective 2026-10-19. The owner's source rule: recent tournament lists where they exist; otherwise lists by pros, deck guides or other strong builds, each cited and labelled with its kind. Check every card count against the October 19 list, then audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md) do, and note the shared staples.
>
> **Sourcing rule (same as the earlier notes):** tournament metadata and compositions are YGOPRODeck's records (curated "Tournament Meta Decks", or user-submitted where §4 says so) and one Dueling Nexus deck profile; printed texts, Types and archetypes are YGOPRODeck's card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** the main note, [blue-eyes-dark-time-wizard-coverage-2026-11.md](./blue-eyes-dark-time-wizard-coverage-2026-11.md) and the Dark Magician note (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim), and the companion [fire-king-coverage-2026-11.md](./fire-king-coverage-2026-11.md), written in the same session with the same method (it first tagged Forbidden Chalice and Dark Ruler No More). [trainer-meta-decks.md](./trainer-meta-decks.md) §4.12 used Enforcer Beetrooper (2022) for Weevil; that list is illegal today (§0).

## 0. Findings and scope

**Choice: Beetrooper, in its Battlewasp hybrid (the "Beetrooper Battlewasp" Insect deck).** No Insect deck placed in the current format, so "strongest" rests on the archetypes' whole record (table below). Among archetypes whose monsters are all Insects and whose cards reward the Insect Type, **Beetrooper is the only one with Advanced-format tournament tops** (8 on YGOPRODeck, November 2021 – May 2022, including 2nd at the EU Remote Duel YCS and Top 4 at the NA Remote Duel YCS) **and the only one with a win since 2024** (1st place, 47th Yu-Gi-Oh TTZ CS, OCG, August 3, 2024, as *Beetrooper Battlewasp*). Every modern build found, tournament or community, is the same hybrid: Battlewasp Synchros and Beetrooper Fusion/Link pieces glued by generic Insects (Resonance Insect, Beargram, Supply Soldier of the Indestructible Insects, the Ragnaraika Insects). Traptrix and Ragnaraika have more and newer tops, but they are Plant-majority or Insect/Plant/Reptile decks whose cards ask for Trap Holes or "Insect, Plant, or Reptile", so they are listed as the owner's alternative, not chosen (§5).

**No tournament list of the current format exists, and none of the chosen deck's tournament lists is legal today.** So the pool falls back to **strong builds**: one **self-reported local Genesys tournament win** whose list passes the Advanced list (L1, Battlewasp-led, December 13, 2025) and three **community builds** (L2 and L4 on YGOPRODeck, L3 a Dueling Nexus deck profile). None is a pro's list or a written deck guide: none was found (§5).

Together the four contain **74 identifiable unique cards across Main, Extra and Side: 3 scripted & automatic, 5 present but partial, 66 absent.** This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed Insect card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Beetrooper Battlewasp (4 lists) | 69 | 3 (4%) | 5 | 61 | 3 / 5 / 66 of 74 |

- **The whole Insect engine is absent.** No Beetrooper, Battlewasp, Ragnaraika, Inzektor, Krawler or "Indestructible Insects" card is in Academy. The only Insect card present is Killer Needle, a Normal Monster (automatic; L2 plays 1). The three cards in the Main or Extra Deck of all four lists, Beargram, Shelled Emperor of the Forest Crown, Beetrooper Sting Lancer and Number 3: Cicada King, are absent. The four lists vary widely: L3 is nearly pure Battlewasp and L4 pure Beetrooper.
- **What the deck needs is Insect-aware summoning:** Synchro Summons with "1 Insect Tuner" and monsters "treated as a Tuner" (Battlewasp), Fusion Summons of an Insect by card effect (Beetrooper Landing, Supply Soldier), Insect Link Monsters with Summon locks, Beetrooper Tokens, and many "banish an Insect from the GY" costs. Academy already filters by Type (`type` in `CardFilter`, `catalogue.ts:166-193`; "insect" is in `MONSTER_TYPES`, `catalogue.ts:287`), but its Synchro recipe only names one Tuner or a name prefix for non-Tuners (`engine.ts:2157-2161`), its Fusion effect is plain Polymerization (`catalogue.ts:143`), and it has no Tokens.
- **Shared staples.** Of the 74 cards, **10 were already audited** in at least one of the 14 archetypes of the three earlier notes. The partial Ash Blossom, Ghost Ogre, Effect Veiler and Infinite Impermanence and the automatic Terraforming and Foolish Burial lead (§3). **64 cards are new to the audits** (2 of them were first tagged in the Fire King note). Nine cards are shared with the Fire King note's lists.

### Choosing the Insect deck

Candidates are every archetype with at least 3 Insect monsters in YGOPRODeck's card database, read on 2026-11-23, plus the "Indestructible Insects" support. Tops are YGOPRODeck deck records (TCG Advanced unless stated), from `getDecks.php?name=<archetype>` by category.

| Candidate | Monsters by Type (API) | Advanced tops on YGOPRODeck | Latest Advanced top | Other formats | Legal tournament list today |
| --- | --- | ---: | --- | --- | --- |
| **Beetrooper** | 10 Insect | 8 (Nov 2021 – May 2022) | Liège WCQ Regional, May 1, 2022, Top 8 | OCG: Beetrooper Battlewasp 1st, TTZ CS, Aug 3, 2024 (32 players); Beetrooper Top 4, Jul 9, 2023 | None (all 8 Advanced and both OCG lists fail) |
| Battlewasp | 12 Insect | 0 | — | OCG: Top 4, Waseda Festival CS, Nov 8, 2026 (34 players), with OCG-only Reindsurm and Forbidden Maxx "C"; Genesys: self-reported 1st, Ijuí, Dec 13, 2025 | Only the Genesys list (L1) |
| Inzektor | 14 Insect | 0 | — | none on record | — |
| Krawler | 11 Insect | 0 | — | none on record | — |
| Digital Bug | 8 Insect | 0 | — | none on record | — |
| Traptrix | 9 Plant, 6 Insect | 42 (Nov 2021 – Feb 2026) | Oklahoma WCQ Regional, Feb 8, 2026, Top 8 (180 players) | OCG tops to Aug 2025 | 1 old list (Ljubljana WCQ, Feb 2023, Top 4); the 2025–2026 lists fail |
| Ragnaraika | 4 Insect, 3 Reptile, 2 Plant | 17 (May – Sep 2024) | The Side Deck Remote Duel WCQ, Sep 29, 2024, Top 4; Germany Nationals 2024 1st | OCG tops to Jan 2025 | None |
| Naturia | 18 Plant, 12 Insect, 8 other | 19 on the first page (Apr 2023 – Mar 2024, mostly Runick Naturia) | Waterford WCQ Regional, Mar 30, 2024, Top 8 | — | None |

- **Current format:** of the 423 TCG tournament records dated October 19 – November 22, 2026 (§ selection below), none is an Insect deck. The only Insect monsters played are generic: Greatfly in the Radiant Typhoon lists and Kuzuha the Hex Ashtra in Ashtra lists (plus Maxx "C" in one list that is illegal under the October 19 list).
- **Why not Battlewasp alone:** its two results are a store-level Genesys win reported by the uploader and an OCG Top 4 built on Reindsurm, whose cards have an OCG release of October 31, 2026 and no TCG release in the card API. Its strongest legal lists are already the hybrid's (L1, L3).
- **Why Beetrooper Battlewasp and not pure Beetrooper:** the 2024 OCG win, and every list found since, combine the two. L4 is kept as the pure Beetrooper build so that the pool covers both shapes.

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026".

- **Recent scan:** 480 Tournament Meta Deck records (offsets 0–460 without `name`; deck numbers 738587–746021), of which 423 are events dated October 19 – November 22, 2026, were scanned for Insect monsters (API `race`) in every zone. Results above.
- **Tournament lists of the chosen deck:** `name=Beetrooper` returned 8 TCG and 2 OCG Tournament Meta Decks, `name=Battlewasp` 2 OCG (one is the 2024 hybrid), and the Genesys category none. All fail the October 19 list: the TCG ones play Called by the Grave, Triple Tactics Talent, Predaplant Verte Anaconda, Apollousa, Crystron Halqifibrax, Dimensional Barrier (all Forbidden) or 2–3 Droll & Lock Bird; the OCG ones play 1–3 Maxx "C".
- **Fallback, strong builds:** the unfiltered searches `name=Beetrooper` and `name=Battlewasp` (offsets 0–20 each), `name=Insect` (0–20) and `name=Bug` (0) gave 114 unique decks of every category. Goat, Edison, Domain, anime and casual lists were set aside as other formats or not strong builds. The selected four are legal, full Advanced builds of the hybrid or of Beetrooper: [674571](https://ygoprodeck.com/deck/battlewasp-genesys-luan-1-place-iju%C3%AD-13-12-2025-674571) (the only one with a reported result; 18,102 views, the most viewed Insect deck read), [735797](https://ygoprodeck.com/deck/beetrooper-735797) (the newest legal Beetrooper Battlewasp build, about one month old), [Dueling Nexus "EATN Battlewasp"](https://duelingnexus.com/blog/battlewasp-deck-2026/) (a deck profile of the hybrid built for the February 2026 TCG list, still legal) and [731251](https://ygoprodeck.com/deck/beetrooper-731251) (pure Beetrooper, about two months old, written for Master Duel but TCG-legal).
- **Not taken, illegal:** the OCG [744005](https://ygoprodeck.com/deck/battlewasp-744005) and [516644](https://ygoprodeck.com/deck/beetrooper-battlewasp-516644); YGOPRODeck community hybrids such as [678637](https://ygoprodeck.com/deck/beetrooper-battlewasp-678637) (3 Droll & Lock Bird) and the Weevil-themed [720154](https://ygoprodeck.com/deck/weevil-underwood-battlewasp-cocoon-low-rogue-720154) and [720157](https://ygoprodeck.com/deck/weevil-underwood-inzektor-swarm-high-rogue-720157) (Called by the Grave, 2 Droll); the [Dueling Nexus "Beetrooper Battlewasp Deck 2025"](https://duelingnexus.com/blog/beetrooper-battlewasp-deck-2025/) (Triple Tactics Talent, 3 Droll, 3 Solemn Judgment); and a [Konami Card Database member deck "Beetrooper Ragnaraika Battlewasp"](https://www.db.yugioh-card.com/yugiohdb/member_deck.action?cgid=ee63ed159ee60eca1d2fbad9ce2e7122&dno=86&request_locale=en), which Konami's own page flags for Called by the Grave and a second Droll.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited), and every one of the 256 names matched a YGOPRODeck card name exactly. **All four selected lists pass**: none plays a Forbidden card or exceeds a limit, and no card exceeds 3 copies. Cards on the list that appear here, always 1 copy: Terraforming, Foolish Burial and Gold Sarcophagus (L2). Every card has a TCG release date in the card API. This does not certify region or release legality. L3's names come from the Dueling Nexus page and were matched exactly to the card API.

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition. "Absent — data only" remains Absent in totals: here, Shiny Black "C" Squadder, a Normal Monster that only needs its printed numbers.
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 8 of the 74 names matched, and all 8 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/1` = L1/L2/L3/L4). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the earlier notes for the 10 cards they already audited, and from the Fire King note for Forbidden Chalice and Dark Ruler No More. The other new cards were tagged here by reading each fetched text; their Step and Work follow from the codes by the key (the highest step among the codes; `card-deep` and "beyond plan" when a beyond-plan code is present). `script` means card scripting **after its listed shared engine work exists**.
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts test/engine-masters.test.ts` in `packages/cards` gave 6 files and 117 tests passed. The tests cited in the Notes pass, but they do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What is in Academy for this deck

- **Insects in Academy are the anime ones.** Academy's own Weevil deck (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:24-28`) is Basic Insect, Big Insect, Flying Kamakiri #2, Gokibore, Hercules Beetle, Killer Needle, Leghul, Skull-Mark Ladybug, Insect Soldiers of the Sky and Laser Cannon Armor. Of these, only **Killer Needle** (`cards.ts:123`) is in these lists (L2, 1 copy), automatic as a Normal Monster.
- **Present and automatic:** Killer Needle, Terraforming (`cards.ts:328`; its only target here, Beetrooper Formation, is absent) and Foolish Burial (`cards.ts:331`), both in L2.
- **Present but partial:** Ash Blossom, Effect Veiler, Ghost Ogre and Infinite Impermanence (as in the earlier notes, re-read against today's code), and Forbidden Chalice (only the opponent's monster can be targeted; see the Fire King note).
- **What already helps.** The data vocabulary can filter Insects (`type`), Levels, Attributes and archetypes by name (`catalogue.ts:166-193`), search, Special Summon from the hand, Deck or GY, mill, and lock Special Summons to some Types (`do: "lock"`, `catalogue.ts:219-223`). Fusion Materials can be "an Insect" (`FusionMaterial.type`, `catalogue.ts:337-342`). Synchro, Xyz and Link Summons exist (`engine.ts:2138-2202`).
- **What is missing for the Insect core (ours, from the texts against the code):**
  1. **Synchro recipes and Tuner changes.** "1 Insect Tuner + 1 or more non-Tuner monsters" (Halberd, Sachi) cannot be written: `synchroTuner` names one card and `synchroNonTuner` is a name prefix (`catalogue.ts:447-451`, `engine.ts:2157-2161`). "Treat it as a Tuner" (Battlewasp Wind, Sachi, Dart, Diabolantis) and "reduce its Level" (Rapier, Krawler Soma) have no action.
  2. **Fusion by card effect with a filter**: Beetrooper Landing and Supply Soldier Fusion Summon only an Insect, and Supply Soldier does it from a monster's effect; Academy's Fusion effect is plain Polymerization (`catalogue.ts:143`) and Fusion Monsters need a Spell (`engine.ts:2153`).
  3. **Banish and banished cards**: Assault Roller, Beargram, Mighty Neptune, Armor Horn, Light Flapper, Ballista, Grand Partisan and Cruel Saturnas pay with or use banished Insects; data actions have no banish step and no banished zone effects (`catalogue.ts:199-230`).
  4. **Tokens**: Beetrooper Descent, Formation, Squad and Praying Mantis Summon Tokens; Academy has no Token facility.
  5. **Monster Quick Effects and hand Quick Effects** (Sting the Poison, Scale Bomber, Sting Lancer, Supply Soldier, Number 3: Cicada King, Heavy Cavalry): the CHAIN/HAND foundation of Step 1.
  6. **Monsters as Equips** (Inzektor Picofalena, Parasite Paranoid, Cocoon of Ultra Evolution, Ultimate Great Insect): beyond the original plan.
- **Not in these lists:** Weevil's anime Insects above, other than Killer Needle. No live deck was changed.

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot.

### Mechanism key (ours, from the main note)

| Code | Required mechanism / extension | Plan step | Repo evidence for current boundary |
| --- | --- | --- | --- |
| CHAIN / HAND | Full fast-effect priority, legal origins, activation vs effect negation, arbitrary responses | 1 | `engine.ts:1277-1299`, `:1482-1533`, `:2631` |
| TRIG / LOCK | General event provenance, simultaneous triggers, delayed effects, turn/Duel restrictions | 2 | `catalogue.ts:231-283`; `engine.ts:1234-1242` |
| VOCAB / GY / BANISH | Multi-choice actions, costs, filters, return/banish/Set, effects in GY/banishment | 3 | `catalogue.ts:166-283`, `effects.ts:46-59` |
| CONT | Activated/continuous Field and Continuous Spell/Trap effects | 3 | `catalogue.ts:45-163`, `:489-499` |
| RITUAL / FUS-EFF | General Ritual tributes and GY banish; Fusion by effect from Deck/GY/opponent field | 3 | `catalogue.ts:140-143` |
| FUS-MAT / SYN / XYZ / LINK / PEND | Material predicates, alternate procedures, material transfer, proper summon, arrow/scale effects | 4 | `catalogue.ts:337-342`, `:390-407`; `engine.ts:2081-2202` |
| ZONE / MONSPELL / CONTROL | Columns/centre/Extra Monster Zone conditions, monsters as backrow (and Traps that become monsters), control vs ownership and opponent's cards | Beyond original plan; add to 3/4 | `engine.ts:1628` explicitly omits columns; `catalogue.ts:199-230` actions lack these |
| TOKEN / CTR / EQ-MON / DICE | Token identity, counters, monsters as Equips, dice | Beyond original plan | `catalogue.ts:199-230`, `:372-475`; no general facilities of these kinds |

RITUAL, PEND, TOON, MONSPELL and DICE do not occur here. Among the 70 cards still to build (partial or absent, excluding the data-only Normal Monster), the most frequent needs are VOCAB (66), TRIG (41), GY (28), BANISH (26), CHAIN (25) and LOCK (23). SYN (7), LINK (8) and FUS-MAT (4) are few in number but they are how the deck ends its turns; TOKEN (4), EQ-MON (4), CTR (3) and CONTROL (3) make 14 cards `card-deep`.

## 2. Coverage (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Beetrooper Battlewasp | 4 | 69 | 3 | 5 | 61 | 4% | 12% | 5 | 3 / 5 / 66 of 74 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): L1 29 cards, 0 automatic, 3 partial, 9 of 56 copies; L2 38 cards, 3 / 1, 4 of 55 copies; L3 32 cards, 0 / 0, 0 of 66 copies; L4 27 cards, 0 / 3, 7 of 55 copies. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started. L3 has no card in Academy.

## 3. Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side)

"Of the 14" counts archetypes in the earlier notes' samples: the main note's 11 (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there), Blue-Eyes, Dark Time Wizard, and Dark Magician (the Dark Magician Light and Darkness Ritual note). Every card here is also played by this deck. Ranked by that count, then by name.

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Partial | CHAIN | Step 1 | script |
| 2 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Partial | CHAIN, HAND | Step 1 | script |
| 3 | S:P Little Knight | 11 | Artmage, Blue-Eyes, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 4 | Effect Veiler | 8 | Angelechy, Blue-Eyes, Branded, Branded Dracotail, Dark Time Wizard, Elfnote, Sacred Beast, Toon | Partial | CHAIN | Step 1 | script |
| 5 | Infinite Impermanence | 6 | Angelechy, Blue-Eyes, Branded, Dark Time Wizard, Elfnote, Toon | Partial | ZONE | beyond plan | card-deep |
| 6 | Forbidden Droplet | 3 | Blue-Eyes, Dark Time Wizard, Sky Striker | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 7 | Lava Golem | 3 | Branded, Radiant Typhoon, Sky Striker | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |
| 8 | Terraforming | 3 | Angelechy, Dark Magician, Toon | Scripted & automatic | — | — | — |
| 9 | Foolish Burial | 1 | Dark Magician | Scripted & automatic | — | — | — |
| 10 | Gold Sarcophagus | 1 | Branded | Absent | TRIG, VOCAB | Step 3 | script |

**Shared with the Fire King note's lists (9 cards):** Ash Blossom & Joyous Spring, Effect Veiler, Ghost Ogre & Snow Rabbit, Infinite Impermanence, Forbidden Chalice (Partial), Dark Ruler No More, Forbidden Droplet, Lava Golem and S:P Little Knight (Absent).

**New to the audits (64 cards):** the Beetrooper cards (Scout Buggy, Scale Bomber, Assault Roller, Sting Lancer, Light Flapper, Mighty Neptune, Descent, Formation, Landing, Squad, Fly & Sting, Armor Horn, Invincible Atlas, Cruel Saturnas, Absolute Hercules); the Battlewasp cards (Sting the Poison, Rapier, Pin, Twinbow, Arbalest, Dart, Wind, Nest, Azusa, Ballista, Grand Partisan, Halberd, Hama, Sachi, Revival Swarm, Summoning Swarm); the generic Insects (Resonance Insect, Gokipole, Beargram, Supply Soldier and Heavy Cavalry of the Indestructible Insects, Ragnaraika Wicked Butterfly, Samurai Beetle, Mantis Monk and Stag Sovereign, Krawler Soma, Praying Mantis, Parasite Paranoid, Retaliating "C", Sneaky "C", Shiny Black "C" Squadder, Killer Needle, Kumongous, Diabolantis, Number 3: Cicada King, Inzektor Picofalena, Seraphim Papillion, Traptrix Allomerus and Atypus, Ultimate Great Insect); and Insect support and tech (Armed Rebeellion, Insect Invitation, Giant Ballpark, Cocoon of Ultra Evolution, Galaxy Cyclone, Twin Twisters, Trap Stun, Dark Ruler No More, Forbidden Chalice).

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

Lists (each labelled with its kind under the owner's rule):

1. [Battlewasp Genesys, 1st place Ijuí 13.12.2025](https://ygoprodeck.com/deck/battlewasp-genesys-luan-1-place-iju%C3%AD-13-12-2025-674571) — **self-reported local Genesys tournament win** (YGOPRODeck user-filed "Genesys Decks", uploaded by a local Yu-Gi-Oh! community account; the title gives 1st place at Ijuí on December 13, 2025; no player count); 41 Main / 15 Extra / 15 Side. Battlewasp-led hybrid with Beetrooper, Indestructible Insects and Ragnaraika. Passes the Advanced list.
2. [Beetrooper](https://ygoprodeck.com/deck/beetrooper-735797) — **community build** (Advanced; user-filed "Non-Meta Decks", no event, about one month old); 40 / 15 / 0. Beetrooper-led hybrid.
3. [EATN Battlewasp](https://duelingnexus.com/blog/battlewasp-deck-2026/) — **community build, published as a Dueling Nexus deck profile** (a user deck written up by the site; built for the February 2026 TCG list, shared 2026-03-31, updated 2026-04-13; no event); 51 / 15 / 0. Battlewasp-led, with Beetrooper, Parasite Paranoid, Cocoon of Ultra Evolution and Ultimate Great Insect.
4. [Beetrooper](https://ygoprodeck.com/deck/beetrooper-731251) — **community build** (user-filed "Master Duel Decks", about two months old; written for Master Duel, legal under the October 19 TCG list); 40 / 15 / 0. Pure Beetrooper.

| Card | Copies (L1/L2/L3/L4) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Foolish Burial | 0/1/0/0 | Scripted & automatic | — | — | — | Data `mill` of any monster (`cards.ts:331`), resolved at `engine.ts:1058-1065`; Ash sees it as `mill` (`effects.ts:49`, `:67`). Tested at `packages/cards/test/engine-effects.test.ts:29-30`. |
| Killer Needle | 0/1/0/0 | Scripted & automatic | — | — | — | Normal Monster with its printed numbers (`cards.ts:123`; printed facts `card-art.ts:133`). |
| Terraforming | 0/1/0/0 | Scripted & automatic | — | — | — | Data `search` of a Field Spell (`cards.ts:328`). Its only target here, Beetrooper Formation, is absent. |
| Ash Blossom & Joyous Spring | 3/0/0/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Effect Veiler | 3/0/0/0 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Forbidden Chalice | 0/1/0/0 | Partial | VOCAB | Step 3 | script | `chalice` (`cards.ts:261`), resolved at `engine.ts:2590-2593`: +400 ATK and effects negated for the turn; a Quick-Play answer (`engine.ts:560-561`). Missing: the printed target is 'face-up monster on the field', but `spellTarget` only lets it target the opponent's monster (`catalogue.ts:534`). |
| Ghost Ogre & Snow Rabbit | 3/0/0/1 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 0/0/0/3 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Armed Rebeellion | 3/1/0/0 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Special Summons an Insect from the hand or Deck, then sends a monster you control; Insect-only lock. |
| Battlewasp - Arbalest the Rapidfire | 2/1/3/0 | Absent | TRIG, VOCAB, GY | Step 3 | script | Trigger when destroyed by an opponent's card. |
| Battlewasp - Dart the Hunter | 0/0/3/0 | Absent | HAND, TRIG, LOCK, VOCAB | Step 3 | script | Discarded from the hand after a battle; makes another Insect a Tuner. |
| Battlewasp - Nest | 0/0/3/0 | Absent | CHAIN, TRIG, VOCAB, CONT, CTR | Step 3 + beyond plan | card-deep | Counters on a Continuous Trap; ends the Battle Phase. |
| Battlewasp - Pin the Bullseye | 2/1/3/0 | Absent | VOCAB | Step 3 | script | Special Summons itself from the hand; burn per copy. |
| Battlewasp - Rapier the Onslaught | 3/3/3/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script | Discard cost; places Battlewasp Wind from the Deck; GY banish lowers a Level. |
| Battlewasp - Sting the Poison | 3/3/3/0 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script | Search on Summon; Quick negation with a Tribute cost. |
| Battlewasp - Twinbow the Attacker | 2/1/3/0 | Absent | LOCK, VOCAB | Step 3 | script | Special Summons itself from the hand; second attack. |
| Battlewasp Wind | 2/2/3/0 | Absent | TRIG, VOCAB, CONT | Step 3 | script | 'Twice per turn' trigger; treats an Insect as a Tuner. |
| Beargram, Shelled Emperor of the Forest Crown | 1/1/1/1 | Absent | CHAIN, LOCK, VOCAB, GY, BANISH | Step 3 | script | Summon condition by banishing 3 Insects/Plants from the hand or GY; the opponent cannot answer with monster effects. |
| Beetrooper Assault Roller | 0/1/3/3 | Absent | TRIG, VOCAB, BANISH | Step 3 | script | Special Summon by banishing an Insect from the GY. |
| Beetrooper Descent | 0/1/0/3 | Absent | VOCAB, TOKEN | Step 3 + beyond plan | card-deep | Beetrooper Token. |
| Beetrooper Fly & Sting | 1/1/0/2 | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script | Counter Trap against a monster effect; Sets itself from the GY. |
| Beetrooper Formation | 0/2/0/2 | Absent | TRIG, VOCAB, GY, CONT, TOKEN | Step 3 + beyond plan | card-deep | Field Spell; Beetrooper Token. |
| Beetrooper Landing | 1/0/2/3 | Absent | VOCAB, GY, BANISH, FUS-EFF | Step 3 | script | Fusion Summon of an Insect from the hand or field; returns from the GY. |
| Beetrooper Light Flapper | 0/0/0/3 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Adds from the GY and banishment; negates an attack. |
| Beetrooper Scale Bomber | 0/0/2/2 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script | Special Summons itself from the hand when an Insect is Summoned; Quick destruction. |
| Beetrooper Scout Buggy | 0/3/1/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Summons a copy of itself from the hand, Deck or GY. |
| Beetrooper Squad | 0/0/0/1 | Absent | CHAIN, VOCAB, TOKEN | Step 3 + beyond plan | card-deep | Beetrooper Tokens. |
| Beetrooper Sting Lancer | 1/1/2/2 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script | Quick Effect from the hand; places cards from both GYs on the bottom of the Decks. |
| Cocoon of Ultra Evolution | 0/0/2/0 | Absent | CHAIN, VOCAB, GY, BANISH, EQ-MON | Step 3 + beyond plan | card-deep | Tributes an Insect equipped with an Equip Card, from either field. |
| Forbidden Droplet | 0/0/0/3 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Giant Ballpark | 0/0/1/0 | Absent | CHAIN, TRIG, VOCAB, GY, CONT | Step 3 | script |  |
| Gokipole | 1/1/1/0 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Gold Sarcophagus | 0/1/0/0 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Heavy Beetrooper Mighty Neptune | 0/1/0/2 | Absent | TRIG, VOCAB, BANISH | Step 3 | script | Summon condition by shuffling 3 banished Insects into the Deck. |
| Insect Invitation | 0/1/0/0 | Absent | TRIG, VOCAB, GY, BANISH, CONT | Step 3 | script | Changes the Type of the opponent's monsters. |
| Krawler Soma | 0/0/1/0 | Absent | VOCAB, GY | Step 3 | script | Face-down Defense Position; Summons Krawlers by Level reduction. |
| Parasite Paranoid | 0/0/3/0 | Absent | CHAIN, HAND, TRIG, VOCAB, EQ-MON | Step 3 + beyond plan | card-deep | Equips itself from the hand to any face-up monster and changes its Type. |
| Praying Mantis | 0/1/0/0 | Absent | TRIG, VOCAB, GY, BANISH, TOKEN | Step 3 + beyond plan | card-deep | Baby Mantis Token. |
| Ragnaraika Samurai Beetle | 0/1/0/0 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Ragnaraika Wicked Butterfly | 2/0/0/0 | Absent | TRIG, VOCAB, BANISH | Step 3 | script | Delayed draw in the End Phase. |
| Resonance Insect | 2/2/0/3 | Absent | TRIG, VOCAB, BANISH | Step 3 | script |  |
| Retaliating "C" | 3/0/0/0 | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, BANISH | Step 3 | script |  |
| Revival Swarm | 0/0/3/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Shiny Black "C" Squadder | 0/0/3/0 | Absent — data only | — | — | data | Normal Monster: printed numbers only. |
| Summoning Swarm | 0/0/2/0 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Supply Soldier of the Indestructible Insects | 3/1/0/0 | Absent | CHAIN, HAND, LOCK, VOCAB, FUS-EFF | Step 3 | script | Quick Summon from the hand that negates; Fusion Summon by its own effect. |
| Trap Stun | 0/2/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Twin Twisters | 0/3/0/0 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Battlewasp - Azusa the Ghost Bow | 0/0/2/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, SYN | Step 4 | script | Synchro Tuner; effect-damage trigger. |
| Battlewasp - Ballista the Armageddon | 1/0/1/0 (extra) | Absent | TRIG, VOCAB, BANISH, SYN | Step 4 | script | Banishes all Insects from the GY; Summons 3 banished Insects. |
| Battlewasp - Grand Partisan the Revolution | 2/0/2/0 (extra) | Absent | TRIG, VOCAB, BANISH, SYN | Step 4 | script | Effect when banished. |
| Battlewasp - Halberd the Charge | 0/0/2/0 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script | '1 Insect Tuner'; Quick Effect during damage calculation. |
| Battlewasp - Hama the Conquering Bow | 1/0/1/0 (extra) | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script | Second attack if Synchro Summoned with a Synchro Monster. |
| Battlewasp - Sachi the Ceremonial Bow | 3/0/2/0 (extra) | Absent | TRIG, VOCAB, SYN | Step 4 | script | '1 Insect Tuner'; becomes a Tuner; extra Normal Summon. |
| Beetrooper Armor Horn | 0/3/0/3 (extra) | Absent | LOCK, VOCAB, GY, BANISH, LINK | Step 4 | script | Extra Normal Summon right after it resolves; revives from the GY. |
| Beetrooper Cruel Saturnas | 1/1/0/2 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Diabolantis the Menacing Mantis | 2/0/1/0 (extra) | Absent | TRIG, VOCAB, SYN | Step 4 | script |  |
| Giant Beetrooper Invincible Atlas | 0/3/0/2 (extra) | Absent | LOCK, VOCAB, LINK | Step 4 | script |  |
| Heavy Cavalry of the Indestructible Insects | 2/1/0/1 (extra) | Absent | CHAIN, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Inzektor Picofalena | 0/2/0/1 (extra) | Absent | TRIG, VOCAB, GY, LINK, EQ-MON | Step 4 + beyond plan | card-deep | Equips a monster from the Deck as an Equip Spell. |
| Number 3: Cicada King | 1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| Ragnaraika Mantis Monk | 0/1/0/0 (extra) | Absent | LOCK, VOCAB, GY, BANISH, LINK | Step 4 | script |  |
| Ragnaraika Stag Sovereign | 0/1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| S:P Little Knight | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Seraphim Papillion | 0/0/0/1 (extra) | Absent | CHAIN, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |  |
| Traptrix Allomerus | 1/0/0/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, XYZ, CONTROL | Step 4 + beyond plan | card-deep | Special Summons an opponent's monster to your field. |
| Traptrix Atypus | 0/1/0/0 (extra) | Absent | LOCK, VOCAB, BANISH, LINK | Step 4 | script |  |
| Ultimate Great Insect | 0/1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, FUS-MAT, EQ-MON | Step 4 + beyond plan | card-deep | Alternative Summon by Tributing an Insect equipped with an Equip Card. |
| Ultra Beetrooper Absolute Hercules | 1/0/2/2 (extra) | Absent | TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script | '4 Insect monsters'; unaffected until the end of your next turn. |
| Dark Ruler No More | 3/0/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script | Mass negation for the turn, no damage for the opponent, no monster effects in response. |
| Galaxy Cyclone | 3/0/0/0 (side) | Absent | VOCAB, GY, BANISH | Step 3 | script |  |
| Kumongous, the Sticky String Kaiju | 3/0/0/0 (side) | Absent | TRIG, VOCAB, CONTROL, CTR | Step 3 + beyond plan | card-deep | Summoned to the opponent's field; Kaiju Counters. |
| Lava Golem | 3/0/0/0 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Sneaky "C" | 3/0/0/0 (side) | Absent | HAND, TRIG, VOCAB | Step 3 | script | Face-down Defense Summon from the hand; delayed End Phase flip. |

## 5. Unverified, exclusions and interpretation limits

1. **The choice depends on what "an Insect deck" means.** Here it means an archetype whose monsters are Insects and whose cards reward the Insect Type, which fits Weevil. If the owner accepts a deck whose monsters are partly Insects, **Traptrix** is stronger on the record (42 Advanced tops, the latest February 8, 2026; its Main Deck monsters are mostly the Insects Myrmeleo, Mantis and Arachnocampa, and its Trap Holes echo Weevil's traps) and **Ragnaraika** had the best peak (Germany Nationals 2024 1st, YCS Lille 2024 2nd). Neither has a legal tournament list today: the 2025–2026 Traptrix lists play Called by the Grave plus Albion or Dimensional Barrier (Forbidden), and every Ragnaraika list plays Triple Tactics Talent (Forbidden).
2. **No current-format tournament list and no pro list.** The owner's first source does not exist for any Insect deck today. No pro deck profile or written deck guide for the October 19 list was found (web searches on 2026-11-23: YGOPRODeck, Dueling Nexus, CardCluster, which refused automated access, Game8 and the Master Duel/Duel Links Meta sites, which cover other formats). If the owner wants only tournament lists, Weevil has **no** eligible list; the nearest is L1, from Genesys.
3. **L1's result is self-reported.** It is a user-filed deck (not YGOPRODeck's curated tournament category) whose title states the event, date and placing; there is no player count, and it was not corroborated. It is a Genesys list, built under points, not the Advanced list, though it passes the Advanced list.
4. **Community builds are self-filed.** L2 and L4 report no result, and L4 was written for Master Duel (another format with its own list); L3 is a Dueling Nexus user's deck. They were chosen as the legal, complete hybrid and pure-Beetrooper builds, not because they won.
5. **The comparison table counts YGOPRODeck records.** They are curated and may lag; tops outside YGOPRODeck (for example local events) are not counted. "Monsters by Type" counts every card YGOPRODeck tags with the archetype, by its API `race`.
6. **Per-card mechanism tags are triage (ours).** The 10 cards already audited keep their earlier tags verbatim. The 64 new tags were assigned by reading each text. They are judgment calls. Examples: "treat as a Tuner" and "reduce its Level" are VOCAB; "1 Insect Tuner" is SYN; Beetrooper and Baby Mantis Tokens are TOKEN; Inzektor and Parasite equips are EQ-MON; Summoning to the opponent's field (Kumongous) and taking the opponent's monster (Traptrix Allomerus) are CONTROL; Kaiju and Battlewasp Nest counters are CTR. "If this card in its owner's possession/control is destroyed" (Arbalest, Mighty Neptune) was not tagged CONTROL.
7. **Ash Blossom's note** (copied from the earlier notes) says Academy counts draws as Ash targets (`effects.ts:91`); the Dark Magician note's §5 discusses it.
8. **Present-card verdicts are static code/text comparisons.** The cited tests pass (see "Reading the audit"), but no new conformance tests were written. Scripted & automatic is an operational classification, not certification against every Konami ruling.
9. **Card API normalization:** every passcode of the YGOPRODeck lists resolved to an English name through `card_images` (no unknown IDs); every L3 name matched the card API exactly; every card has a TCG release date.
10. **Source independence:** event, date, placement and player counts are YGOPRODeck's or Dueling Nexus's records, not corroborated with organizers. Event dates in each record's description, not the relative "N weeks ago" ages, govern inclusion. Player names are not reproduced (L1's URL contains one).
11. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-23. Deck URL, event, date and placement are attached to each selected list in §4.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=<name>&_sft_category=<category>&offset=<n>` for `Beetrooper`, `Battlewasp`, `Inzektor`, `Krawler`, `Digital Bug`, `Traptrix` (offsets 0–40), `Ragnaraika` (0–40), `Naturia`, `Insect` and `Moth` with `Tournament Meta Decks`, `Tournament Meta Decks OCG` and `Tournament Meta Decks (Genesys)`, and without a category for `Beetrooper`, `Battlewasp`, `Insect` (0–20), `Inzektor`, `Traptrix`, `Ragnaraika` and `Bug`. The recent scan used the same endpoint without `name`, `offset=0,20,…,460`. Card data: `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` (full database, 14,684 cards; archetype Type counts and release dates). Appendix A links each name to an exact-name query. No downloaded content was executed.
- Dueling Nexus: [Battlewasp Deck 2026](https://duelingnexus.com/blog/battlewasp-deck-2026/) (L3) and [Beetrooper Battlewasp Deck 2025](https://duelingnexus.com/blog/beetrooper-battlewasp-deck-2025/) (excluded). Konami Card Database member deck (excluded), linked in §0.
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, the tests `packages/cards/test/engine-{effects,extra,hand,set,open,masters}.test.ts`, and Academy's own Weevil deck `apps/academy-ygo/src/lib/junior/play/master-decks.ts:24-28`. The earlier notes' tags were read from their §3–§4 tables.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For this deck specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note: general priority and response origins, event batches, turn restrictions | Ash, Ogre, Veiler; monster Quick Effects (Sting the Poison, Scale Bomber, Cicada King, Heavy Cavalry) and Quick Summons from the hand (Sting Lancer, Supply Soldier, Retaliating "C") | Beetrooper Fly & Sting |
| 1 | Step 3 vocabulary: banish as a cost and an effect, banished-zone effects, Level changes, "treat as a Tuner", self-Summon from the hand with a condition, Insect-only Summon locks | Beetrooper Scout Buggy, Assault Roller, Mighty Neptune, Light Flapper; Battlewasp Sting, Rapier, Pin, Twinbow, Arbalest, Wind; Resonance Insect, Gokipole, Beargram, Armed Rebeellion | The Main Deck engines of both halves |
| 2 | Step 3 Fusion by effect with a Type filter, from the hand or field and from a monster's effect | Beetrooper Landing, Supply Soldier; then Cruel Saturnas, Heavy Cavalry, Absolute Hercules (Step 4 materials) | L1, L2, L4's Fusion turns |
| 3 | Step 4 Synchro "1 Insect Tuner" and Link "2 Insect monsters" with their Summon locks | Battlewasp Sachi, Halberd, Hama, Grand Partisan, Ballista, Azusa, Diabolantis; Armor Horn, Invincible Atlas, Ragnaraika Links | L1 and L3's Synchro turns |
| 4 | Beyond the plan: Tokens; monsters as Equips | Beetrooper Descent, Formation, Squad, Praying Mantis; Inzektor Picofalena, Parasite Paranoid, Cocoon of Ultra Evolution, Ultimate Great Insect | Only if those cards are wanted |

**For Weevil, the realistic target is a Battlewasp-and-Beetrooper core without Tokens and Equips.** L1's Main Deck has no Token and no Equip card (its only `card-deep` cards are Traptrix Allomerus in the Extra Deck and Lava Golem and Kumongous on the Side), so its Main Deck needs Steps 1–4 and nothing beyond the plan. L2 and L4 lean on Beetrooper Tokens (Descent, Formation, Squad, Praying Mantis) and Inzektor Picofalena's equip, and L3 on Equips (Parasite Paranoid, Cocoon of Ultra Evolution, Ultimate Great Insect). Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … L4, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Beetrooper Battlewasp — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S |
| --- | --- | --- | --- | --- | --- |
| [Armed Rebeellion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Armed%20Rebeellion) | Spell Card | 3/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Battlewasp - Arbalest the Rapidfire](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Arbalest%20the%20Rapidfire) | Effect Monster | 2/0/0 | 1/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp - Azusa the Ghost Bow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Azusa%20the%20Ghost%20Bow) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/2/0 | 0/0/0 |
| [Battlewasp - Ballista the Armageddon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Ballista%20the%20Armageddon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Battlewasp - Dart the Hunter](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Dart%20the%20Hunter) | Effect Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp - Grand Partisan the Revolution](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Grand%20Partisan%20the%20Revolution) | Synchro Monster | 0/2/0 | 0/0/0 | 0/2/0 | 0/0/0 |
| [Battlewasp - Halberd the Charge](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Halberd%20the%20Charge) | Synchro Monster | 0/0/0 | 0/0/0 | 0/2/0 | 0/0/0 |
| [Battlewasp - Hama the Conquering Bow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Hama%20the%20Conquering%20Bow) | Synchro Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Battlewasp - Nest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Nest) | Trap Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp - Pin the Bullseye](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Pin%20the%20Bullseye) | Effect Monster | 2/0/0 | 1/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp - Rapier the Onslaught](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Rapier%20the%20Onslaught) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp - Sachi the Ceremonial Bow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Sachi%20the%20Ceremonial%20Bow) | Synchro Monster | 0/3/0 | 0/0/0 | 0/2/0 | 0/0/0 |
| [Battlewasp - Sting the Poison](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Sting%20the%20Poison) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp - Twinbow the Attacker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20-%20Twinbow%20the%20Attacker) | Effect Monster | 2/0/0 | 1/0/0 | 3/0/0 | 0/0/0 |
| [Battlewasp Wind](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Battlewasp%20Wind) | Spell Card | 2/0/0 | 2/0/0 | 3/0/0 | 0/0/0 |
| [Beargram, Shelled Emperor of the Forest Crown](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beargram%2C%20Shelled%20Emperor%20of%20the%20Forest%20Crown) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Beetrooper Armor Horn](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Armor%20Horn) | Link Monster | 0/0/0 | 0/3/0 | 0/0/0 | 0/3/0 |
| [Beetrooper Assault Roller](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Assault%20Roller) | Effect Monster | 0/0/0 | 1/0/0 | 3/0/0 | 3/0/0 |
| [Beetrooper Cruel Saturnas](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Cruel%20Saturnas) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/2/0 |
| [Beetrooper Descent](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Descent) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 3/0/0 |
| [Beetrooper Fly & Sting](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Fly%20%26%20Sting) | Trap Card | 1/0/0 | 1/0/0 | 0/0/0 | 2/0/0 |
| [Beetrooper Formation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Formation) | Spell Card | 0/0/0 | 2/0/0 | 0/0/0 | 2/0/0 |
| [Beetrooper Landing](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Landing) | Spell Card | 1/0/0 | 0/0/0 | 2/0/0 | 3/0/0 |
| [Beetrooper Light Flapper](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Light%20Flapper) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Beetrooper Scale Bomber](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Scale%20Bomber) | Effect Monster | 0/0/0 | 0/0/0 | 2/0/0 | 2/0/0 |
| [Beetrooper Scout Buggy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Scout%20Buggy) | Effect Monster | 0/0/0 | 3/0/0 | 1/0/0 | 3/0/0 |
| [Beetrooper Squad](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Squad) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Beetrooper Sting Lancer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beetrooper%20Sting%20Lancer) | Effect Monster | 1/0/0 | 1/0/0 | 2/0/0 | 2/0/0 |
| [Cocoon of Ultra Evolution](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cocoon%20of%20Ultra%20Evolution) | Spell Card | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Dark Ruler No More](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Ruler%20No%20More) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Diabolantis the Menacing Mantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diabolantis%20the%20Menacing%20Mantis) | Synchro Monster | 0/2/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Foolish Burial](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Chalice](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Chalice) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Galaxy Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Galaxy%20Cyclone) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Giant Ballpark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Giant%20Ballpark) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Giant Beetrooper Invincible Atlas](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Giant%20Beetrooper%20Invincible%20Atlas) | Link Monster | 0/0/0 | 0/3/0 | 0/0/0 | 0/2/0 |
| [Gokipole](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gokipole) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Gold Sarcophagus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gold%20Sarcophagus) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Heavy Beetrooper Mighty Neptune](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Heavy%20Beetrooper%20Mighty%20Neptune) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 2/0/0 |
| [Heavy Cavalry of the Indestructible Insects](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Heavy%20Cavalry%20of%20the%20Indestructible%20Insects) | Fusion Monster | 0/2/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Insect Invitation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Insect%20Invitation) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Inzektor Picofalena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Inzektor%20Picofalena) | Link Monster | 0/0/0 | 0/2/0 | 0/0/0 | 0/1/0 |
| [Killer Needle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Killer%20Needle) | Normal Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Krawler Soma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Krawler%20Soma) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Kumongous, the Sticky String Kaiju](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kumongous%2C%20the%20Sticky%20String%20Kaiju) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Lava Golem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lava%20Golem) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Number 3: Cicada King](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%203%3A%20Cicada%20King) | XYZ Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Parasite Paranoid](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Parasite%20Paranoid) | Effect Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Praying Mantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Praying%20Mantis) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Ragnaraika Mantis Monk](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragnaraika%20Mantis%20Monk) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Ragnaraika Samurai Beetle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragnaraika%20Samurai%20Beetle) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Ragnaraika Stag Sovereign](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragnaraika%20Stag%20Sovereign) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Ragnaraika Wicked Butterfly](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragnaraika%20Wicked%20Butterfly) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Resonance Insect](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Resonance%20Insect) | Effect Monster | 2/0/0 | 2/0/0 | 0/0/0 | 3/0/0 |
| [Retaliating "C"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Retaliating%20%22C%22) | Effect Monster | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Revival Swarm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Revival%20Swarm) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Seraphim Papillion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Seraphim%20Papillion) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Shiny Black "C" Squadder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shiny%20Black%20%22C%22%20Squadder) | Normal Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Sneaky "C"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sneaky%20%22C%22) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Summoning Swarm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Summoning%20Swarm) | Spell Card | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Supply Soldier of the Indestructible Insects](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Supply%20Soldier%20of%20the%20Indestructible%20Insects) | Effect Monster | 3/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Terraforming](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Terraforming) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Trap Stun](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Trap%20Stun) | Trap Card | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 |
| [Traptrix Allomerus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Traptrix%20Allomerus) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Traptrix Atypus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Traptrix%20Atypus) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Twin Twisters](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Twin%20Twisters) | Spell Card | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Ultimate Great Insect](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ultimate%20Great%20Insect) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ultra Beetrooper Absolute Hercules](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ultra%20Beetrooper%20Absolute%20Hercules) | Fusion Monster | 0/1/0 | 0/0/0 | 0/2/0 | 0/2/0 |
