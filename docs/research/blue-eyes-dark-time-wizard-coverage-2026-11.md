# Blue-Eyes and Dark Time Wizard: tournament lists for the October 19, 2026 format, and engine coverage

> **Date of observation:** data fetched 2026-11-22 (late evening, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #2, "Refresh the Blue-Eyes and Dark Time Wizard tournament lists for the October 19, 2026 format"):** find 3–10 current-format TCG tournament lists each for **Blue-Eyes** and **Dark Time Wizard / Red-Eyes**, legal under the Forbidden & Limited List effective 2026-10-19; audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) does; list the cards these two share with that note's 11 archetypes.
>
> **Sourcing rule (same as the main note):** tournament metadata and compositions are YGOPRODeck's own curated "Tournament Meta Decks" records; printed texts/types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) (method, mechanism key, verdicts and tags of every card it already audited, reused verbatim) and [meta-archetypes-coverage.md](./meta-archetypes-coverage.md) §5–6 (the pre-refresh Dark Time Wizard and Blue-Eyes audits, whose card statuses are superseded here).

## 0. Findings and scope

**No list in this sample is playable automatically.** **15 lists**: 5 Blue-Eyes (all *Primite Blue-Eyes*) and 10 Dark Time Wizard (K9, Radiant Typhoon and Sky Striker hybrids). They contain **175 identifiable unique cards across Main, Extra and Side: 8 scripted & automatic, 11 present but partial, 156 absent**. This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed card in either archetype.

| Archetype | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Blue-Eyes | 54 | 3 (6%) | 8 | 43 | 3 / 8 / 64 of 75 |
| Dark Time Wizard | 100 | 3 (3%) | 7 | 90 | 5 / 9 / 112 of 126 |

- **Blue-Eyes is the archetype Academy is closest to.** The engine-side Blue-Eyes core added since the pre-refresh note now covers Sage with Eyes of Blue and Deep-Eyes White Dragon (both scripted & automatic) and the White Phantom Beast (partial). However, the deck's starters and extenders are still absent: Maiden of White, Wishes for Eyes of Blue, Mausoleum of White, True Light, the Primite cards, Roar of the Blue-Eyed Dragons and Spirit with Eyes of Blue. The Blue-Eyes cards Academy scripted most recently (Kaibaman the Legend, Protector with Eyes of Blue, The White Stone of Legend, The Guiding Flute of Summoning Dragons: `cards.ts:286`, `:339`, `:346`, `:313`) appear in **none** of these five lists.
- **Dark Time Wizard has not moved.** The card itself is still only its coin mode (`cards.ts:249`). Every card its search mode would fetch is absent: Alligator's Dragon Knight, Swiftwind Panther Warrior, Fisherman of Legend, Foolish Graverobber, Graceful & Skull Dice, Sleepy Scapegoats, Reversal Box, Jinzo - Energy Shocker and Red-Eyes Black Dragon Exceed. The vocabulary also has no "card that mentions X" filter (`catalogue.ts:166-193`).
- **"Red-Eyes" in this archetype means Red-Eyes Black Dragon Exceed only.** It is in the Extra Deck of all 10 lists. No list plays Red-Eyes Black Dragon (in Academy, `cards.ts:112`); they Summon the Exceed through its alternative procedure. No current-format TCG Tournament Meta Deck is named "Red-Eyes" (§5).
- **Shared staples.** Of the 175 cards, **93 also appear in at least one of the main note's 11 archetypes**. 26 are played by both Blue-Eyes and Dark Time Wizard. The top of the ranking is unchanged: Ash Blossom, Droll & Lock Bird, Ghost Ogre and Mulcharmy Fuwalos (Partial) and Mulcharmy Purulia (Absent) are in all 11 + both of these. After them come Nibiru (9 + both), Hey, Space Trunade!, S:P Little Knight and Skull Meister (8 + both), and The Great Gallant Bandit (7 + both) (§3).

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026" and "The previous (September 21, 2026) list will remain in effect until October 19, 2026". Its Perfectron Hydradrive Dragon change waited for Magnificent Maestros on November 11, 2026; no list here plays that card. Every selected event is dated **October 24 – November 21, 2026**. "UAE Open 2027" is the event's season name, not its date (November 8, 2026).

- **Blue-Eyes:** `getDecks.php?name=Blue-Eyes&_sft_category=Tournament Meta Decks` returned 20 records, all Primite Blue-Eyes except one *Odion Blue-Eyes* from March 2026. Exactly **five are dated on or after October 19, 2026**, and all five are selected. A broader `name=Eyes` query returned the same Primite Blue-Eyes records. Both lists of the pre-refresh note ([745513](https://ygoprodeck.com/deck/primite-blue-eyes-745513), [744628](https://ygoprodeck.com/deck/primite-blue-eyes-744628)) are among the five.
- **Dark Time Wizard:** `name=Dark Time Wizard` returned 11 records. **Ten are dated on or after October 19, 2026**, and all ten are selected (the maximum the brief allows). Excluded: [K9 Dark Time Wizard, YCS Houston, October 17, 2026](https://ygoprodeck.com/deck/k9-dark-time-wizard-739396), played under the previous list. Of the three lists in the pre-refresh note, two are kept ([743935](https://ygoprodeck.com/deck/k9-dark-time-wizard-743935), [742563](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-742563)). The third, 2nd Motsu CS, was OCG and is dropped.
- **Recent scan:** 360 Tournament Meta Deck records (offsets 0–340, events October 25 – November 21, 2026) were scanned by deck name and by passcode. Names: no other "Eyes", "Red-Eyes" or "Time Wizard" deck. Passcodes: Dark Time Wizard appears in one more list, [Radiant Typhoon 743478](https://ygoprodeck.com/deck/radiant-typhoon-743478) (Weston-Super-Mare, November 8, 2026). It was left out because it is named and curated as Radiant Typhoon; the main note's Radiant Typhoon sample is three other lists.
- **Variants:** the five Blue-Eyes lists are one variant (Primite). The ten DTW lists are hybrids. L1, L2, L5, L6 and L9 run K9, and L1 and L9 also run Radiant Typhoon. L4, L7, L8 and L10 run Radiant Typhoon. L3 runs Sky Striker. This is a reproducible sample of recent curated tops, not a census of the format.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited). **All 15 lists pass**: none plays a Forbidden card or exceeds a limit. Cards on the list that appear here, always within limit: Limited, 1 copy: Bystial Magnamhut, Droll & Lock Bird, Pot of Prosperity, PSY-Framegear Gamma, Solemn Judgment, K9-66a Jokul, "A Case for K9", Radiant Typhoon Chant, Harpie's Feather Duster, Reinforcement of the Army. Semi-Limited, 2 copies: Sky Striker Mobilize - Engage!. This does not certify region or release legality. No list has unrevealed `???` slots.

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition. "Absent — data only" remains Absent in totals.
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 19 of the 175 names matched. All 19 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/…` = L1/L2/L3/…). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the main note for every card it already audited (93 cards, including PSY-Frame Driver's data-only row). The 75 cards new to this audit were tagged here by reading each fetched text. `script` means card scripting **after its listed shared engine work exists**. `card-deep` flags work beyond the original plan (columns, monsters-as-backrow and the reverse, control vs ownership, Tokens, counters, monsters as Equips, dice).
- **One difference from the main note:** the existing tests for present cards were run. `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts` in `packages/cards` gave 3 files and 55 tests passed. The tests cited in the Notes pass, but they do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What changed since the pre-refresh audit

[meta-archetypes-coverage.md](./meta-archetypes-coverage.md) §5–6 marked almost every card in these decks "Missing". It also cited engine lines that no longer hold. Against today's code:

- **Blue-Eyes core, now in `cards.ts` as data effects:** Sage with Eyes of Blue (`cards.ts:332-338`) and Deep-Eyes White Dragon (`:300-312`) are **Scripted & automatic**. The White Phantom Beast (`:293-299`) is **Partial**: its targeted Quick Effect answers only a Spell (`engine.ts:838-842`). This rests on the data vocabulary's watched events (`catalogue.ts:231-243`: added from Deck, destroyed by battle, sent to GY, Special Summoned, targeted) and its `special-self`/`destroy-foes`/`lock`/`negate` actions (`catalogue.ts:212-230`).
- **Staple hand traps, now Partial rather than Missing:** Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos and Infinite Impermanence, with the limits the main note sets out (its §1). Ash Blossom and Effect Veiler keep Partial, with current line anchors.
- **Blue-Eyes Spirit Dragon:** still Partial. The GY negation is automatic and only stops an older `trigger` monster (`engine.ts:1363-1368`), so it cannot negate the new data-written GY effects such as Kaibaman's.
- **Dark Time Wizard:** unchanged, coin mode only (`cards.ts:249`, `engine.ts:2962-2981`).
- **Newly present in these lists:** D.D. Crow (Partial, `cards.ts:361`), plus Raigeki, Upstart Goblin, Pot of Desires, Reinforcement of the Army and Harpie's Feather Duster (Scripted & automatic, as in the main note), all in the Sky Striker or K9 hybrid and side decks.

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot. The app's own Blue-Eyes decks (Kaiba's deck, the starter, the Blue-Eyes pack) are Academy's and are not any of these tournament lists; no live deck was changed.

### Mechanism key (ours, from the main note)

| Code | Required mechanism / extension | Plan step | Repo evidence for current boundary |
| --- | --- | --- | --- |
| CHAIN / HAND | Full fast-effect priority, legal origins, activation vs effect negation, arbitrary responses | 1 | `engine.ts:1277-1299`, `:1482-1533`, `:2631` |
| TRIG / LOCK | General event provenance, simultaneous triggers, delayed effects, turn/Duel restrictions | 2 | `catalogue.ts:231-283`; `engine.ts:1234-1242` |
| VOCAB / GY / BANISH | Multi-choice actions, costs, filters (including "a card that mentions X" and declared names), return/banish/Set, effects in GY/banishment | 3 | `catalogue.ts:166-283`, `effects.ts:46-59` |
| CONT | Activated/continuous Field and Continuous Spell/Trap effects | 3 | `catalogue.ts:45-163`, `:489-499` |
| RITUAL / FUS-EFF | General Ritual tributes and GY banish; Fusion by effect from Deck/GY/opponent field | 3 | `catalogue.ts:140-143` |
| FUS-MAT / SYN / XYZ / LINK / PEND | Material predicates, alternate procedures, material transfer, proper summon, arrow/scale effects | 4 | `catalogue.ts:337-342`, `:390-407`; `engine.ts:2081-2202` |
| ZONE / MONSPELL / CONTROL | Columns/centre/Extra Monster Zone conditions, monsters as backrow (and Traps that become monsters), control vs ownership and opponent's cards | Beyond original plan; add to 3/4 | `engine.ts:1628` explicitly omits columns; `catalogue.ts:199-230` actions lack these |
| TOKEN / CTR / EQ-MON / DICE | Token identity, counters, monsters as Equips, dice | Beyond original plan | `catalogue.ts:199-230`, `:372-475`; no general facilities of these kinds |

TOON and PEND do not occur in these two archetypes. Two tags are stretched here, and the Notes say so: MONSPELL for Ashtra's Domain and The Phantom Knights of Umbrage Veil (Traps that become monsters), and ZONE for Hieratic Seal's Extra Monster Zone condition. DICE is the decisive gap for Dark Time Wizard: Graceful & Skull Dice is in **all ten** lists and Reversal Box in four.

## 2. Coverage per archetype (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Blue-Eyes | 5 | 54 | 3 | 8 | 43 | 6% | 20% | 21 | 3 / 8 / 64 of 75 |
| Dark Time Wizard | 10 | 100 | 3 | 7 | 90 | 3% | 10% | 26 | 5 / 9 / 112 of 126 |
| **Unique across both (all zones, not Main+Extra)** | 15 | 175 | 8 | 11 | 156 | 5% | 11% | | |
"In Academy" includes Partial. The per-archetype rows count each archetype on its own; the last row is the union of both, over all zones.

## 3. Cards shared with the main note's 11 archetypes (Main, Extra or Side)

"Of the 11" counts archetypes in the main note's samples (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there). "Played here by" says which of these two archetypes plays the card. Ranked by the 11-archetype count, then by name. Rows 1–13 and the Partial/automatic rows are the shared staples; many lower rows come from DTW's Radiant Typhoon and Sky Striker hybrids, which reuse those archetypes' own cards.

| Rank | Card | Played here by | Of the 11 | Which of the 11 | Status | Needs | Step | Work |
| ---: | --- | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | Blue-Eyes, Dark Time Wizard | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | Blue-Eyes, Dark Time Wizard | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | Blue-Eyes, Dark Time Wizard | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | Blue-Eyes, Dark Time Wizard | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | Blue-Eyes, Dark Time Wizard | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | Blue-Eyes, Dark Time Wizard | 9 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | Typhoon | Dark Time Wizard | 9 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast | Absent | CHAIN, VOCAB | Step 3 | script |
| 8 | Hey, Space Trunade! | Blue-Eyes, Dark Time Wizard | 8 | Angelechy, Elfnote, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded | Absent | VOCAB | Step 3 | script |
| 9 | S:P Little Knight | Blue-Eyes, Dark Time Wizard | 8 | Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 10 | Skull Meister | Blue-Eyes, Dark Time Wizard | 8 | Angelechy, Elfnote, Toon, Artmage, Unchained, Branded Dracotail, Branded, Sacred Beast | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 11 | Pot of Sloth | Dark Time Wizard | 7 | Angelechy, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast | Absent | LOCK, VOCAB | Step 3 | script |
| 12 | The Great Gallant Bandit | Blue-Eyes, Dark Time Wizard | 7 | Angelechy, Elfnote, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 13 | Effect Veiler | Blue-Eyes, Dark Time Wizard | 6 | Angelechy, Elfnote, Toon, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN | Step 1 | script |
| 14 | Harpie's Feather Duster | Dark Time Wizard | 5 | Toon, Unchained, Sky Striker, Branded Dracotail, Sacred Beast | Scripted & automatic | — | — | — |
| 15 | Solemn Accusation | Blue-Eyes, Dark Time Wizard | 5 | Toon, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 16 | Super Polymerization | Dark Time Wizard | 5 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |
| 17 | Elder Entity Norden | Dark Time Wizard | 4 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 18 | Evenly Matched | Blue-Eyes, Dark Time Wizard | 4 | Toon, Artmage, Radiant Typhoon, Branded Dracotail | Absent | CHAIN, VOCAB | Step 3 | script |
| 19 | Garura, Wings of Resonant Life | Dark Time Wizard | 4 | Artmage, Radiant Typhoon, Sky Striker, Branded | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 20 | Infinite Impermanence | Blue-Eyes, Dark Time Wizard | 4 | Angelechy, Elfnote, Toon, Branded | Partial | ZONE | beyond plan | card-deep |
| 21 | Mudragon of the Swamp | Dark Time Wizard | 4 | Artmage, Radiant Typhoon, Sky Striker, Branded | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |
| 22 | Solemn Judgment | Blue-Eyes, Dark Time Wizard | 4 | Elfnote, Toon, Unchained, Sky Striker | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 23 | Super Starslayer TY-PHON - Sky Crisis | Blue-Eyes, Dark Time Wizard | 4 | Toon, Unchained, Radiant Typhoon, Sky Striker | Absent | LOCK, VOCAB, XYZ | Step 4 | script |
| 24 | Cosmic Cyclone | Blue-Eyes, Dark Time Wizard | 3 | Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, VOCAB | Step 3 | script |
| 25 | Dominus Spark | Blue-Eyes | 3 | Angelechy, Toon, Branded | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 26 | Ecclesia and the Dark Dragon | Blue-Eyes | 3 | Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |
| 27 | I:P Masquerena | Dark Time Wizard | 3 | Toon, Artmage, Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 28 | Mediclius the Extraordinary Power Patron | Dark Time Wizard | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 29 | Mistaken Arrest | Blue-Eyes | 3 | Elfnote, Unchained, Branded | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 30 | Sky Striker Ace - Azalea | Dark Time Wizard | 3 | Toon, Artmage, Sky Striker | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |
| 31 | The Dragon that Devours the Dogma | Blue-Eyes | 3 | Sky Striker, Branded Dracotail, Branded | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |
| 32 | The Fallen & The Virtuous | Blue-Eyes | 3 | Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, VOCAB | Step 3 | script |
| 33 | Dogmatika Ecclesia, the Virtuous | Blue-Eyes | 2 | Branded Dracotail, Branded | Absent | TRIG, LOCK, VOCAB | Step 3 | script |
| 34 | Fire Formation - Tenki | Dark Time Wizard | 2 | Toon, Radiant Typhoon | Absent | TRIG, VOCAB, CONT | Step 3 | script |
| 35 | Mixousia the Confounder | Dark Time Wizard | 2 | Branded Dracotail, Branded | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |
| 36 | Mystical Space Typhoon | Dark Time Wizard | 2 | Radiant Typhoon, Sky Striker | Absent | CHAIN, VOCAB | Step 3 | script |
| 37 | Pot of Desires | Dark Time Wizard | 2 | Angelechy, Sky Striker | Scripted & automatic | — | — | — |
| 38 | Pot of Prosperity | Blue-Eyes, Dark Time Wizard | 2 | Toon, Unchained | Absent | LOCK, VOCAB | Step 3 | script |
| 39 | PSY-Frame Driver | Blue-Eyes, Dark Time Wizard | 2 | Branded, Sacred Beast | Absent — data only | — | — | data |
| 40 | PSY-Framegear Delta | Dark Time Wizard | 2 | Branded, Sacred Beast | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 41 | PSY-Framegear Gamma | Blue-Eyes, Dark Time Wizard | 2 | Branded, Sacred Beast | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |
| 42 | Radiant Typhoon Vision | Dark Time Wizard | 2 | Radiant Typhoon, Sky Striker | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 43 | Triple Tactics Thrust | Dark Time Wizard | 2 | Unchained, Sky Striker | Absent | VOCAB | Step 3 | script |
| 44 | Adamancipator Risen - Dragite | Dark Time Wizard | 1 | Elfnote | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 45 | Artifact Lancea | Blue-Eyes, Dark Time Wizard | 1 | Branded Dracotail | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |
| 46 | Divine Arsenal AA-ZEUS - Sky Thunder | Dark Time Wizard | 1 | Toon | Absent | CHAIN, HAND, TRIG, VOCAB, XYZ | Step 4 | script |
| 47 | Dominus Purge | Blue-Eyes, Dark Time Wizard | 1 | Angelechy | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 48 | Favorite HERO Flame Wingman | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |
| 49 | Favorite HERO Shining Flare Wingman | Dark Time Wizard | 1 | Branded | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |
| 50 | Forbidden Crown | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 51 | Forbidden Droplet | Blue-Eyes, Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 52 | Ghost Belle & Haunted Mansion | Blue-Eyes | 1 | Sacred Beast | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 53 | Greatfly | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 54 | Hraesvelgr, the Desperate Doom Eagle | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, VOCAB, LINK | Step 4 | script |
| 55 | Maple Maiden | Blue-Eyes, Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |
| 56 | Mulcharmy Meowls | Blue-Eyes | 1 | Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |
| 57 | Noble Knight's Shield-Bearer | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 58 | Phantom Fortress Enterblathnir | Dark Time Wizard | 1 | Radiant Typhoon | Absent | VOCAB, XYZ | Step 4 | script |
| 59 | Pot of Extravagance | Dark Time Wizard | 1 | Radiant Typhoon | Absent | VOCAB | Step 3 | script |
| 60 | Prototype Sky Striker Ace - Amatsu | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 61 | Psychic End Punisher | Blue-Eyes | 1 | Elfnote | Absent | LOCK, VOCAB | Step 3 | script |
| 62 | Radiant Typhoon Ascendance | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |
| 63 | Radiant Typhoon Chant | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 64 | Radiant Typhoon Eldam | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB | Step 3 | script |
| 65 | Radiant Typhoon Fonix, the Great Flame | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 66 | Radiant Typhoon Krosea | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, LOCK, VOCAB | Step 3 | script |
| 67 | Radiant Typhoon Mandate | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, TRIG, VOCAB, CONT | Step 3 | script |
| 68 | Radiant Typhoon Manifestation | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 69 | Radiant Typhoon Meghala | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, LOCK, VOCAB | Step 3 | script |
| 70 | Radiant Typhoon Swen | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB | Step 3 | script |
| 71 | Radiant Typhoon Varuroon, the Marine Eidolon | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 72 | Radiant Typhoon Varuroon, the Vibrant Vortex | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script |
| 73 | Raigeki | Dark Time Wizard | 1 | Sky Striker | Scripted & automatic | — | — | — |
| 74 | Reinforcement of the Army | Dark Time Wizard | 1 | Sky Striker | Scripted & automatic | — | — | — |
| 75 | Shiina, Twin Tempests of Celestial Thunder | Blue-Eyes, Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 76 | Sky Striker Ace - Camellia | Dark Time Wizard | 1 | Sky Striker | Absent | TRIG, VOCAB, GY, LINK, CONTROL | Step 4 + beyond plan | card-deep |
| 77 | Sky Striker Ace - Hayate | Dark Time Wizard | 1 | Sky Striker | Absent | VOCAB, LINK | Step 4 | script |
| 78 | Sky Striker Ace - Kagari | Dark Time Wizard | 1 | Sky Striker | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 79 | Sky Striker Ace - Raye | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, TRIG, VOCAB, GY, ZONE | Step 3 + beyond plan | card-deep |
| 80 | Sky Striker Ace - Roze | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, TRIG, VOCAB, GY, ZONE | Step 3 + beyond plan | card-deep |
| 81 | Sky Striker Ace - Shizuku | Dark Time Wizard | 1 | Sky Striker | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 82 | Sky Striker Ace - Zeke | Dark Time Wizard | 1 | Sky Striker | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 83 | Sky Striker Ace = Zero | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 84 | Sky Striker Mecha - Shark Cannon | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, VOCAB | Step 3 | script |
| 85 | Sky Striker Mecha - Widow Anchor | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, TRIG, CONTROL | Step 2 + beyond plan | card-deep |
| 86 | Sky Striker Mobilize - Engage! | Dark Time Wizard | 1 | Sky Striker | Absent | VOCAB | Step 3 | script |
| 87 | Sky Striker Mobilize - Linkage! | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, LOCK, VOCAB, ZONE | Step 3 + beyond plan | card-deep |
| 88 | Sky Striker Special Maneuver - Lemnisgate! | Dark Time Wizard | 1 | Sky Striker | Absent | CHAIN, VOCAB, GY | Step 3 | script |
| 89 | Solemn Strike | Dark Time Wizard | 1 | Sky Striker | Partial | CHAIN | Step 1 | script |
| 90 | Surgical Striker - H.A.M.P. | Dark Time Wizard | 1 | Sky Striker | Absent | TRIG, VOCAB | Step 3 | script |
| 91 | Totem Bird | Dark Time Wizard | 1 | Radiant Typhoon | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |
| 92 | Upstart Goblin | Dark Time Wizard | 1 | Sky Striker | Scripted & automatic | — | — | — |
| 93 | Wynn the Wind Charmer, Verdant | Dark Time Wizard | 1 | Radiant Typhoon | Absent | TRIG, VOCAB, LINK | Step 4 | script |

**Played by both Blue-Eyes and Dark Time Wizard (26 cards):** Ash Blossom & Joyous Spring, Droll & Lock Bird, Effect Veiler, Ghost Ogre & Snow Rabbit, Infinite Impermanence, Mulcharmy Fuwalos (all Partial); PSY-Frame Driver (Absent — data only); Artifact Lancea, Cosmic Cyclone, Dominus Purge, Evenly Matched, Forbidden Droplet, Hey, Space Trunade!, Maple Maiden, Mulcharmy Purulia, Nibiru, the Primal Being, Pot of Prosperity, PSY-Framegear Gamma, S:P Little Knight, Shiina, Twin Tempests of Celestial Thunder, Skull Meister, Solemn Accusation, Solemn Judgment, Solemn Warning, Super Starslayer TY-PHON - Sky Crisis, The Great Gallant Bandit (Absent). Of these, only **Solemn Warning** is in none of the 11 archetypes.

**New to the audits:** 41 Blue-Eyes names and 42 Dark Time Wizard names appear in none of the 11 archetypes' samples. They are the archetype cards themselves (Primite, "with Eyes of Blue"/"of White", K9, the Dark Time Wizard series), their Synchro/Xyz toolboxes, and a few side cards (Sales Ban, Dimensional Fissure, Different Dimension Ground, Champion's Vigilance, Solemn Warning, Shared Ride, Ghost Mourner).

## 4. Card-by-card unions

Rows are ordered Scripted & automatic, Partial, data only, Absent; within each, Main cards first, then Extra-only, then Side-only.

### Blue-Eyes

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-746021): Centurion WCQ Regional - November 21st 2026, **Winner** (30 players, approx.); 43 Main / 15 Extra / 15 Side.
2. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-745513): Spanish Fork WCQ Regional - November 14th 2026, **Top 4** (70 players); 45 Main / 15 Extra / 15 Side.
3. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-744628): UAE Open 2027 - November 8th 2026, **Top 4** (33 players); 44 Main / 15 Extra / 15 Side.
4. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-741079): Santo Domingo WCQ Regional - October 25th 2026, **Top 4** (58 players); 40 Main / 15 Extra / 15 Side.
5. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-741316): Seattle WCQ Regional - October 24th 2026, **Top 8** (120 players); 60 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3/L4/L5) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Blue-Eyes White Dragon | 2/2/2/2/2 | Scripted & automatic | — | — | — | Normal Monster, printed 3000/2500 Dragon (`cards.ts:94`). |
| Deep-Eyes White Dragon, the Blue Abyss | 3/3/0/0/0 | Scripted & automatic | — | — | — | Data effects (`cards.ts:300-312`), `treatedAs: "Blue-Eyes"` (`effects.ts:19`): discard to search a Level 1 LIGHT Tuner; `sentToGy` watch skipping the Damage Step and simultaneous sends (`engine.ts:992-999`); `special-self` with `atkOfThat`/`banishOnLeave` (`engine.ts:1086-1097`). Tested at `engine-effects.test.ts:175-195`. Academy has no "Blue-Eyes" Ritual Monster, so that half of the trigger is never met. |
| Sage with Eyes of Blue | 3/3/3/3/3 | Scripted & automatic | — | — | — | Data effects (`cards.ts:332-338`): on Normal Summon, search a Level 1 LIGHT Tuner except itself; discard itself, send an Effect Monster you control (`send-target`, `engine.ts:1066`), then Special Summon a "Blue-Eyes" from the Deck, once per name. Tested at `packages/cards/test/engine-effects.test.ts:56-73`. |
| Ash Blossom & Joyous Spring | 3/3/3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Blue-Eyes White Dragon, the White Phantom Beast | 1/1/0/0/0 | Partial | CHAIN | Step 1 | script | Data effects (`cards.ts:293-299`): self-Special Summon when added from the Deck or when an ally is destroyed by battle (`engine.ts:988-989`); from hand/Deck, `destroy-foes` (`:1130`) and the direct-attack `lock` (`:1140`). Missing: its targeted Quick Effect only answers a turn-player Spell aimed at it with nothing chained (`engine.ts:838-842`), not a Trap, a monster effect or a Quick-Play. Tested at `engine-effects.test.ts:196-226`. |
| Droll & Lock Bird | 1/1/1/1/1 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 3/3/1/2/1 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 3/2/3/3/0 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3/3/3 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Blue-Eyes Spirit Dragon | 2/3/3/3/2 (extra) | Partial | CHAIN | Step 1 | script | `cards.ts:235`: `synchroNonTuner`, no simultaneous Special Summons (`engine.ts:2090`), the Tribute (`engine.ts:2426-2437`, also offered in answer at `:2362`). Missing: the GY negation is applied automatically and only to an older `trigger` monster sent to the GY (`engine.ts:1363-1368`). It does not cover data-written GY effects (`from: "graveyard"`, e.g. Kaibaman, Deep-Eyes) and is not optional. Tested at `packages/cards/test/engine-extra.test.ts:74-125`. |
| PSY-Frame Driver | 1/0/0/0/0 (side) | Absent — data only | — | — | data | Normal Monster: `real()` entry plus card-art (as in `meta-archetypes-coverage.md` §10.1). |
| Bingo Machine, Go!!! | 1/1/0/0/3 | Absent | VOCAB | Step 3 | script |  |
| Blue-Eyes Jet Dragon | 0/0/0/1/1 (main+side) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Bystial Magnamhut | 1/1/1/1/1 | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Dogmatika Ecclesia, the Virtuous | 0/0/0/0/1 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dominus Purge | 3/3/3/3/3 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Dominus Spark | 0/0/0/0/3 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Fydraulis Harmonia | 0/0/0/0/3 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 0/0/0/2/0 | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Maiden of White | 3/3/3/3/3 | Absent | CHAIN, TRIG, VOCAB, GY, CONT | Step 3 | script |  |
| Majesty of the White Dragons | 1/1/1/1/1 | Absent | VOCAB, GY, BANISH, RITUAL | Step 3 | script | Ritual Summon from banishing itself; Academy has no "Blue-Eyes" Ritual Monster to summon. |
| Mausoleum of White | 1/1/1/1/1 | Absent | VOCAB, GY, CONT | Step 3 | script |  |
| Mulcharmy Purulia | 3/0/0/0/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Neo Kaiser Sea Horse | 0/0/1/1/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 0/2/2/2/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Pot of Prosperity | 1/1/1/0/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Primite Dragon Ether Beryl | 1/1/3/3/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Primite Drillbeam | 1/1/1/1/1 | Absent | CHAIN, VOCAB, GY, BANISH | Step 3 | script | "except a Token" is only an exclusion; no Token handling needed. |
| Primite Lordly Lode | 3/3/3/2/3 | Absent | LOCK, VOCAB, CONT | Step 3 | script |  |
| Roar of the Blue-Eyed Dragons | 1/1/1/1/1 | Absent | LOCK, VOCAB, GY, BANISH, FUS-EFF | Step 3 | script |  |
| The Fallen & The Virtuous | 0/0/0/0/3 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| True Light | 1/1/1/1/1 | Absent | TRIG, LOCK, VOCAB, CONT | Step 3 | script |  |
| Ultimate Fusion | 0/0/0/0/1 | Absent | CHAIN, VOCAB, GY, FUS-EFF | Step 3 | script |  |
| Wishes for Eyes of Blue | 3/3/3/3/3 | Absent | VOCAB, GY, BANISH, EQ-MON | Step 3 + beyond plan | card-deep | Its GY effect equips an Extra Deck Blue-Eyes as an Equip Spell. |
| Ancient Fairy Life Dragon | 1/1/1/1/1 (extra) | Absent | TRIG, VOCAB, SYN | Step 4 | script |  |
| Azure-Eyes Silver Dragon | 0/0/1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script |  |
| Black Rose Moonlight Dragon | 0/1/0/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Blue-Eyes Tyrant Dragon | 1/1/1/2/1 (extra) | Absent | LOCK, VOCAB, GY, FUS-MAT, EQ-MON | Step 4 + beyond plan | card-deep | Fusion by effect works through Ultimate Fusion/Roar; its alternative procedure Tributes a Blue-Eyes White Dragon equipped with a Fusion Monster. |
| Blue-Eyes Ultimate Spirit Dragon | 1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script |  |
| Cosmic Blazar Dragon | 0/0/1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script |  |
| Crimson Dragon | 1/0/1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Despian Luluwalilith | 0/0/0/0/1 (extra) | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script |  |
| Ecclesia and the Dark Dragon | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Golden Cloud Beast - Malong | 0/0/0/0/1 (extra) | Absent | TRIG, VOCAB, SYN | Step 4 | script |  |
| Hieratic Seal of the Heavenly Spheres | 2/1/1/2/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, LINK, ZONE | Step 4 + beyond plan | card-deep | Usable only in the Extra Monster Zone. |
| Lightstorm Dragon | 1/1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script |  |
| Lyna the Light Charmer, Lustrous | 0/0/0/0/1 (extra) | Absent | TRIG, VOCAB, GY, LINK, CONTROL | Step 4 + beyond plan | card-deep | Special Summons from the opponent's GY to a pointed zone. |
| Neo Blue-Eyes Ultimate Dragon | 1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Psychic End Punisher | 1/1/1/0/0 (extra) | Absent | LOCK, VOCAB | Step 3 | script |  |
| S:P Little Knight | 0/1/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Spirit with Eyes of Blue | 2/3/2/2/2 (extra) | Absent | LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Stardust Sifr Divine Dragon | 1/0/0/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 1/0/0/0/0 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| The Dragon that Devours the Dogma | 0/0/0/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Artifact Lancea | 0/3/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Champion's Vigilance | 0/0/0/2/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Cosmic Cyclone | 0/0/0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Dogmatika Fleurdelis, the Knighted | 0/0/0/0/1 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Dragon's Mind | 0/0/3/0/3 (side) | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Evenly Matched | 0/3/0/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Forbidden Droplet | 0/0/0/0/3 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 0/0/3/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Maple Maiden | 0/1/0/0/0 (side) | Absent | TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Mistaken Arrest | 0/0/3/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Mulcharmy Meowls | 0/0/0/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Primite Scream | 0/0/0/0/1 (side) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| PSY-Framegear Gamma | 1/0/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Sales Ban | 0/0/0/3/0 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Shiina, Twin Tempests of Celestial Thunder | 0/3/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Skull Meister | 0/0/3/0/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Accusation | 0/2/0/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 1/1/0/1/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Solemn Warning | 3/0/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 3/0/3/0/0 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |

### Dark Time Wizard

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [K9 Radiant Typhoon Dark Time Wizard](https://ygoprodeck.com/deck/k9-radiant-typhoon-dark-time-wizard-745980): Spijkenisse WCQ Regional - November 14th 2026, **Top 8** (37 players); 49 Main / 15 Extra / 15 Side.
2. [K9 Dark Time Wizard](https://ygoprodeck.com/deck/k9-dark-time-wizard-744876): Roeselare WCQ Regional - November 15th 2026, **Top 8** (37 players, approx.); 41 Main / 15 Extra / 15 Side.
3. [Dark Time Wizard Sky Striker](https://ygoprodeck.com/deck/dark-time-wizard-sky-striker-744248): Weston-Super-Mare WCQ Regional - November 8th 2026, **Top 8** (46 players); 40 Main / 15 Extra / 15 Side.
4. [Dark Time Wizard Radiant Typhoon](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-744243): Bern WCQ Regional - November 7th 2026, **Top 8** (93 players); 40 Main / 15 Extra / 15 Side.
5. [K9 Dark Time Wizard](https://ygoprodeck.com/deck/k9-dark-time-wizard-743935): Brazilia WCQ Regional - November 8th 2026, **Runner-Up** (48 players); 41 Main / 15 Extra / 15 Side.
6. [K9 Dark Time Wizard](https://ygoprodeck.com/deck/k9-dark-time-wizard-743462): Montevideo WCQ Regional - November 7th 2026, **Top 8** (73 players); 47 Main / 15 Extra / 15 Side.
7. [Dark Time Wizard Radiant Typhoon](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-742563): Guadalajara WCQ Regional - November 1st 2026, **Runner-Up** (300 players, approx.); 40 Main / 15 Extra / 15 Side.
8. [Dark Time Wizard Radiant Typhoon](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-742398): Halifax WCQ Regional - October 31st 2026, **Top 4** (100 players, approx.); 40 Main / 15 Extra / 15 Side.
9. [K9 Radiant Typhoon Dark Time Wizard](https://ygoprodeck.com/deck/k9-radiant-typhoon-dark-time-wizard-741293): Medellin WCQ Regional - October 25th 2026, **Top 4** (180 players, approx.); 44 Main / 15 Extra / 15 Side.
10. [Dark Time Wizard Radiant Typhoon](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-741252): Medellin WCQ Regional - October 25th 2026, **Top 8** (180 players, approx.); 40 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3/L4/L5/L6/L7/L8/L9/L10) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Pot of Desires | 0/0/3/0/0/0/0/0/0/0 | Scripted & automatic | — | — | — | cost `banish-deck` 10, `draw` 2, `onePerTurn` (`cards.ts:64`). |
| Reinforcement of the Army | 0/0/1/0/0/0/0/0/0/0 | Scripted & automatic | — | — | — | `search-pick` pool `low-warrior` (`cards.ts:368`). |
| Upstart Goblin | 0/0/3/0/0/0/0/0/0/0 | Scripted & automatic | — | — | — | `draw-then-gift` (`cards.ts:82`). |
| Harpie's Feather Duster | 0/1/0/0/0/0/0/0/0/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Raigeki | 0/0/1/0/0/0/0/0/0/0 (side) | Scripted & automatic | — | — | — | `destroy-all` (`cards.ts:373`). |
| Ash Blossom & Joyous Spring | 3/3/3/3/3/3/3/3/3/3 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Dark Time Wizard | 3/3/3/3/3/3/3/3/3/3 | Partial | VOCAB | Step 3 | script | `coin-wipe` (`cards.ts:249`, `engine.ts:2962-2981`): the coin mode, burning half the destroyed monsters' original ATK; free Quick-Play (`engine.ts:563`). Missing: the search mode (add a card that mentions Dark Time Wizard, End Phase return from GY): `CardFilter` has no "mentions" predicate (`catalogue.ts:166-193`) and Academy has no card that mentions it. `onePerTurn` (`engine.ts:1806`) allows one activation per turn rather than one use of each effect. |
| Droll & Lock Bird | 1/1/1/1/1/1/1/1/1/1 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/0/3/0/3/0/0/0/0/0 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3/0/3/3/0/2/3/3 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 0/0/0/0/3/0/0/0/0/0 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3/3/0/3/3/3/3/3 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| D.D. Crow | 0/0/0/0/0/2/0/0/0/0 (side) | Partial | CHAIN | Step 1 | script | `hand: "crow"` (`cards.ts:361`): only offered while a pending Spell targets a card in its user's GY (`engine.ts:1296`, `:2704-2712`); not a free Quick Effect at any time. |
| Solemn Strike | 0/0/0/0/0/1/0/0/0/0 (side) | Partial | CHAIN | Step 1 | script | Counter Trap, Spell Speed 3, negates a monster effect (`cards.ts:358`, `engine.ts:1463-1467`); the "would be Special Summoned" half is missing. |
| PSY-Frame Driver | 0/0/0/0/1/0/0/0/0/0 (side) | Absent — data only | — | — | data | Normal Monster: `real()` entry plus card-art (as in `meta-archetypes-coverage.md` §10.1). |
| "A Case for K9" | 1/1/0/0/1/1/0/0/1/0 | Absent | TRIG, LOCK, VOCAB, GY, CONT | Step 3 | script |  |
| Alligator's Dragon Knight | 3/3/0/0/3/3/0/0/3/0 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Chaotic Elements | 0/0/0/0/0/2/0/0/0/0 | Absent | VOCAB, GY, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Fire Formation - Tenki | 0/1/0/0/0/0/0/0/0/0 | Absent | TRIG, VOCAB, CONT | Step 3 | script |  |
| Fisherman of Legend | 1/1/0/0/1/1/0/0/1/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Foolish Graverobber | 1/1/0/1/1/1/0/0/1/0 (main+side) | Absent | CHAIN, VOCAB, GY, BANISH, CONTROL | Step 3 + beyond plan | card-deep | Special Summons from either GY to your field and Sets from the opponent's GY: ownership vs control. |
| Forbidden Crown | 0/0/0/0/0/1/2/0/0/2 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Forbidden Droplet | 3/0/0/3/0/0/1/0/0/2 (main+side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Graceful & Skull Dice | 2/3/1/1/1/3/1/1/3/1 | Absent | CHAIN, TRIG, VOCAB, BANISH, DICE | Step 3 + beyond plan | card-deep | Two die rolls. |
| Jinzo - Energy Shocker | 1/1/0/0/0/0/0/0/1/0 (main+side) | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| K9-17 Izuna | 3/3/0/0/3/3/0/0/3/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| K9-66a Jokul | 1/1/0/0/1/1/0/0/1/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| K9-66b Lantern | 1/1/0/0/2/2/0/0/1/0 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| K9-LC Release Restraint | 1/0/0/0/0/0/0/0/0/0 | Absent | CHAIN, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| K9-X Forced Release | 1/1/0/0/1/1/0/0/1/0 | Absent | CHAIN, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| K9-ØØ Lupis | 1/1/0/0/1/1/0/0/1/0 | Absent | CHAIN, HAND, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| Mulcharmy Purulia | 3/2/0/0/0/0/0/3/0/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Mystical Space Typhoon | 1/0/1/3/0/0/3/3/1/3 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 2/3/2/0/2/3/0/0/2/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Noble Knight's Shield-Bearer | 0/0/0/1/0/0/1/1/0/0 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Pot of Extravagance | 0/0/0/2/0/0/0/2/0/2 | Absent | VOCAB | Step 3 | script |  |
| Pot of Prosperity | 0/1/0/0/0/0/0/0/0/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Radiant Typhoon Ascendance | 0/0/0/2/0/0/2/3/0/2 (main+side) | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Radiant Typhoon Chant | 1/0/0/1/0/0/1/1/1/1 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Eldam | 2/0/0/3/0/0/3/3/2/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Fonix, the Great Flame | 0/0/0/1/0/0/1/1/0/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Radiant Typhoon Krosea | 0/0/0/3/0/0/3/3/0/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Radiant Typhoon Mandate | 0/0/0/1/0/0/1/1/0/1 | Absent | CHAIN, TRIG, VOCAB, CONT | Step 3 | script |  |
| Radiant Typhoon Manifestation | 0/0/0/2/0/0/1/2/0/1 (main+side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Meghala | 0/0/0/2/0/0/1/2/0/2 (main+side) | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Radiant Typhoon Swen | 2/0/0/3/0/0/3/3/1/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Varuroon, the Vibrant Vortex | 0/0/0/1/0/0/1/1/0/1 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script |  |
| Radiant Typhoon Vision | 3/0/3/3/0/3/3/3/1/3 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Reversal Box | 1/1/0/0/0/1/0/0/1/0 | Absent | CHAIN, VOCAB, CONT, CTR, DICE | Step 3 + beyond plan | card-deep | Die-rolled counters and a coin toss. |
| Shiina, Twin Tempests of Celestial Thunder | 0/2/0/3/0/0/3/3/0/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Sky Striker Ace - Raye | 0/0/3/0/0/0/0/0/0/0 | Absent | CHAIN, TRIG, VOCAB, GY, ZONE | Step 3 + beyond plan | card-deep |  |
| Sky Striker Ace - Roze | 0/0/1/0/0/0/0/0/0/0 | Absent | CHAIN, TRIG, VOCAB, GY, ZONE | Step 3 + beyond plan | card-deep |  |
| Sky Striker Mecha - Shark Cannon | 0/0/1/0/0/0/0/0/0/0 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Sky Striker Mecha - Widow Anchor | 0/0/3/0/0/0/0/0/0/0 | Absent | CHAIN, TRIG, CONTROL | Step 2 + beyond plan | card-deep |  |
| Sky Striker Mobilize - Engage! | 0/0/2/0/0/0/0/0/0/0 | Absent | VOCAB | Step 3 | script |  |
| Sky Striker Mobilize - Linkage! | 0/0/3/0/0/0/0/0/0/0 | Absent | CHAIN, LOCK, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Sky Striker Special Maneuver - Lemnisgate! | 0/0/2/0/0/0/0/0/0/0 | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Sleepy Scapegoats | 2/2/0/0/1/1/0/0/2/0 (main+side) | Absent | CHAIN, LOCK, VOCAB, TOKEN | Step 3 + beyond plan | card-deep | Sheep Tokens, and Tokens as a destruction substitute. |
| Super Polymerization | 0/0/0/0/0/3/3/0/2/0 (main+side) | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Swiftwind Panther Warrior | 3/3/0/0/3/3/0/0/3/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 0/0/0/3/0/0/3/0/1/3 (main+side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| The Phantom Knights of Doomed Soleret | 0/0/0/0/3/0/0/0/0/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| The Phantom Knights of Umbrage Veil | 0/0/0/0/1/0/0/0/0/0 | Absent | VOCAB, GY, BANISH, XYZ, MONSPELL | Step 4 + beyond plan | card-deep | A Trap that becomes a monster (the reverse of MONSPELL). |
| Adamancipator Risen - Dragite | 0/0/0/0/0/0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Chronomaly Vimana | 0/0/0/0/1/0/0/0/0/0 (extra) | Absent | CHAIN, VOCAB, GY, XYZ | Step 4 | script |  |
| CXyz Hope Chaos Barian Dragon | 1/1/0/0/1/1/0/0/1/0 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| CXyz N.As.Ch. Knight | 1/1/0/0/1/1/0/0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Divine Arsenal AA-ZEUS - Sky Thunder | 1/1/0/0/1/1/0/0/1/0 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Elder Entity Norden | 0/0/0/0/0/0/1/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Favorite HERO Flame Wingman | 0/0/0/0/0/0/1/0/1/0 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Favorite HERO Shining Flare Wingman | 0/0/0/0/0/0/1/0/0/0 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Garura, Wings of Resonant Life | 0/0/0/0/0/1/1/0/1/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Greatfly | 0/0/0/1/0/0/1/1/0/2 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Hraesvelgr, the Desperate Doom Eagle | 0/0/0/1/0/0/1/1/0/1 (extra) | Absent | CHAIN, VOCAB, LINK | Step 4 | script |  |
| I:P Masquerena | 1/1/0/0/1/1/0/0/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| K9-17 "Ripper" | 2/2/0/0/1/1/0/0/2/0 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| K9-66X "Jacks" | 1/0/0/0/1/0/0/0/0/0 (extra) | Absent | TRIG, VOCAB, XYZ | Step 4 | script |  |
| K9-X "Ripper/M" | 1/0/0/0/0/0/0/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, XYZ | Step 4 | script |  |
| K9-X "Werewolf" | 1/1/0/0/1/1/0/0/1/0 (extra) | Absent | CHAIN, VOCAB, BANISH, XYZ | Step 4 | script |  |
| M-X-Saber Invoker | 1/0/0/0/1/0/0/0/1/0 (extra) | Absent | VOCAB, XYZ | Step 4 | script |  |
| Maple Maiden | 0/1/0/1/0/0/1/1/0/1 (extra) | Absent | TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Mediclius the Extraordinary Power Patron | 1/0/0/0/0/0/0/0/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Mixousia the Confounder | 0/0/0/0/0/1/0/0/0/0 (extra) | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Mudragon of the Swamp | 0/0/0/0/0/1/1/0/1/0 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| N.As.H. Knight | 1/1/0/0/1/1/0/0/1/0 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Number 104: Masquerade | 0/1/0/0/1/1/0/0/0/0 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Number 75: Bamboozling Gossip Shadow | 0/0/0/0/0/0/0/1/0/1 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Number C104: Umbral Horror Masquerade | 1/1/0/0/1/1/0/0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Number C104: Umbral Horror Masquerade Victory | 0/1/0/0/0/0/0/0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Phantom Fortress Enterblathnir | 0/0/0/2/0/0/1/2/0/1 (extra) | Absent | VOCAB, XYZ | Step 4 | script |  |
| Prototype Sky Striker Ace - Amatsu | 0/0/1/0/0/0/0/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Radiant Typhoon Varuroon, the Marine Eidolon | 0/0/0/3/0/0/2/3/0/3 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Red-Eyes Black Dragon Exceed | 1/2/1/2/2/1/1/2/1/2 (extra) | Absent | TRIG, LOCK, VOCAB, FUS-MAT, CONTROL | Step 4 + beyond plan | card-deep | Its alternative procedure Tributes a monster on *either* field during a turn Dark Time Wizard destroyed a monster; no list plays its named material Red-Eyes Black Dragon, which Academy has (`cards.ts:112`). |
| S:P Little Knight | 0/1/1/1/1/1/1/1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Azalea | 0/0/1/0/0/0/0/0/0/0 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Sky Striker Ace - Camellia | 0/0/1/0/0/0/0/0/0/0 (extra) | Absent | TRIG, VOCAB, GY, LINK, CONTROL | Step 4 + beyond plan | card-deep |  |
| Sky Striker Ace - Hayate | 0/0/1/0/0/0/0/0/0/0 (extra) | Absent | VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Kagari | 0/0/3/0/0/0/0/0/0/0 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Shizuku | 0/0/1/0/0/0/0/0/0/0 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Zeke | 0/0/1/0/0/0/0/0/0/0 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace = Zero | 0/0/3/0/0/0/0/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/0/1/1/0/0/0/0/0/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| Totem Bird | 0/0/0/2/0/0/1/2/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Vallon, the Super Psy Skyblaster | 1/0/0/0/0/1/0/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Wynn the Wind Charmer, Verdant | 0/0/0/1/0/0/1/1/0/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Artifact Lancea | 0/0/0/0/0/3/0/0/3/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Ashtra's Domain | 0/0/1/0/0/0/0/0/0/0 (side) | Absent | CHAIN, VOCAB, SYN, MONSPELL | Step 4 + beyond plan | card-deep | A Trap that becomes a monster (the reverse of MONSPELL). |
| Cosmic Cyclone | 0/2/2/0/0/0/0/0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Different Dimension Ground | 0/0/0/0/0/1/0/0/0/0 (side) | Absent | CHAIN, LOCK, BANISH | Step 3 | script |  |
| Dimensional Fissure | 0/3/0/0/0/0/0/0/0/0 (side) | Absent | LOCK, BANISH, CONT | Step 3 | script |  |
| Dominus Purge | 0/0/0/3/0/0/3/3/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Engraver of the Mark | 2/0/0/0/0/0/0/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Evenly Matched | 0/0/0/0/0/0/0/0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Ghost Mourner & Moonlit Chill | 0/0/0/0/2/0/0/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 3/1/1/0/0/3/1/0/0/1 (side) | Absent | VOCAB | Step 3 | script |  |
| Pot of Sloth | 0/1/0/3/0/3/0/3/2/1 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| PSY-Framegear Delta | 0/0/0/0/3/0/0/0/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| PSY-Framegear Gamma | 0/0/0/0/1/0/0/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Shared Ride | 0/0/0/0/0/0/2/0/0/0 (side) | Absent | CHAIN, TRIG, LOCK | Step 2 | script |  |
| Skull Meister | 0/0/0/0/2/0/0/0/0/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Accusation | 3/0/0/0/3/0/2/0/0/3 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 1/0/1/0/0/1/0/1/1/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Solemn Warning | 0/0/0/0/0/1/0/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Surgical Striker - H.A.M.P. | 0/0/1/0/0/0/0/0/0/0 (side) | Absent | TRIG, VOCAB | Step 3 | script |  |
| Triple Tactics Thrust | 0/0/3/0/0/0/0/0/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Typhoon | 2/3/0/0/3/0/0/0/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |


## 5. Unverified, exclusions and interpretation limits

1. **"Red-Eyes": no current-format list by that name.** `getDecks.php` with `name=Red-Eyes`, `Red Eyes`, `Red-Eyes ` and `Red-Eyes Dark` (Tournament Meta Decks) all returned "No decks matching your query". A 360-record scan of recent lists found no Red-Eyes deck name. In the Dark Time Wizard lists, Red-Eyes Black Dragon Exceed (all 10 Extra Decks) is the only Red-Eyes card. That is consistent with the brief's "Dark Time Wizard / Red-Eyes" meaning the DTW deck, but this note did not ask the owner. If a Red-Eyes Main Deck build was meant, it is not in YGOPRODeck's current tournament records.
2. **Excluded but relevant:** [Radiant Typhoon 743478](https://ygoprodeck.com/deck/radiant-typhoon-743478) plays Dark Time Wizard and Red-Eyes Black Dragon Exceed but is named and curated as Radiant Typhoon. [YCS Houston 739396](https://ygoprodeck.com/deck/k9-dark-time-wizard-739396) is K9 DTW but was played on October 17, 2026, under the September 21 list. The one older *Odion Blue-Eyes* record (March 2026) is outside the format.
3. **Per-card mechanism tags are triage (ours).** The 93 cards already in the main note keep its tags verbatim, including its acknowledged keyword-assisted over- and under-tagging. The 75 new tags were assigned by reading each text, not from a keyword pass. They are still judgment calls. Examples: a "card that mentions Dark Time Wizard" filter is tagged VOCAB; tributing a monster on *either* field (Red-Eyes Black Dragon Exceed) is tagged CONTROL, as the main note did for The Great Gallant Bandit; Primite Drillbeam's "except a Token" is an exclusion, not Token handling (the pre-refresh note tagged it TOKEN).
4. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§0, "Reading the audit"), but no new conformance tests were written. Scripted & automatic is an operational classification, not certification against every Konami ruling. Deep-Eyes is classed automatic even though one half of its trigger, a "Blue-Eyes" Ritual Monster sent to the GY, can never happen in Academy today.
5. **Card API normalization:** all 177 passcodes resolved through `card_images` to 175 English names, with no unknown IDs. Alternate-art passcodes were folded together; for example, Ash Blossom has more than one.
6. **Source independence:** event, date, placement and player counts are YGOPRODeck's curated records ("approx." where it says so), not corroborated with organizers. The Seattle list's 60-card Main Deck is as recorded. Event dates, not the relative "N weeks ago" ages, govern inclusion.
7. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-22. Deck URL, event, date and placement are attached to each selected list in §4.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=<name>&_sft_category=Tournament%20Meta%20Decks` for `Blue-Eyes`, `Eyes`, `Dark Time Wizard`, `Time Wizard`, `Red-Eyes`, `Red Eyes`, `Red-Eyes Dark`, `Primite`. The recent scan used the same endpoint without `name`, `offset=0,20,…,340`. Event and placement come from each record's `deck_description`. Card API: `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=<30 passcodes>&misc=yes` in six batches; Appendix A links each name to an exact-name query. No downloaded content was executed.
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, and the tests `packages/cards/test/engine-{effects,extra,hand}.test.ts`. See the exact line anchors throughout.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first finish the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For these two decks specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note: general priority and response origins, event batches | Ash, Droll, Ogre, Fuwalos, Veiler, D.D. Crow, Solemn Strike; the White Phantom Beast's and Spirit Dragon's answers (any targeting effect, any GY activation) | Purulia, Skull Meister, Nibiru (after Tokens), Ghost Mourner, Bystial Magnamhut |
| 1 | Step 3 vocabulary: put/Set from Deck, declared names, "mentions [card]" filter, Continuous/Field activated effects, GY banish costs | **Blue-Eyes Main Deck:** Maiden of White, Wishes for Eyes of Blue (minus its Equip half), Mausoleum of White, True Light, Primite Lordly Lode/Drillbeam/Ether Beryl, Bingo Machine. **DTW:** Dark Time Wizard's search mode, Alligator's Dragon Knight, Swiftwind Panther Warrior, Foolish Graverobber (minus the opponent's GY), Fisherman of Legend, Jinzo - Energy Shocker | Blue-Eyes first: 24 cards are in the Main/Extra of all five lists, and 6 of them are already in Academy (2 automatic, 4 partial) |
| 2 | Step 3–4 summon procedures: Fusion by effect (Roar, Ultimate Fusion), Ritual from GY (Majesty), Link-1 with Tribute effects (Spirit with Eyes of Blue), general Synchro toolbox | Blue-Eyes Extra Deck: Tyrant, Neo Blue-Eyes Ultimate, Ultimate Spirit, Lightstorm, Ancient Fairy Life, Hieratic Seal | Recipes and effects per card |
| 3 | Step 4 Xyz: material transfer, detach costs, "treated as an Xyz Summon" | The K9 package (5 of 10 DTW lists): K9 Xyz, N.As.H./CXyz, C104 | Per card |
| 4 | Beyond the plan: dice, Tokens, counters, ownership vs control, Equip monsters | **Graceful & Skull Dice (10/10 DTW lists)**, Sleepy Scapegoats (5/10), Reversal Box (4/10), Red-Eyes Black Dragon Exceed's alternative procedure (10/10), Wishes' and Tyrant's Equip halves | Only after deterministic dice/coin tests |

**Blue-Eyes is the realistic next tournament deck; Dark Time Wizard is not.** The Blue-Eyes core can be finished with Step 3 vocabulary plus a few Step 4 Extra Deck procedures. Dark Time Wizard's identity cards need beyond-plan work: dice in every list, a Token Spell in half, and an alternative procedure for its Red-Eyes boss. Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … Ln, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Blue-Eyes — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S | L5 M/E/S |
| --- | --- | --- | --- | --- | --- | --- |
| [Ancient Fairy Life Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ancient%20Fairy%20Life%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Azure-Eyes Silver Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Azure-Eyes%20Silver%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Bingo Machine, Go!!!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Bingo%20Machine%2C%20Go%21%21%21) | Spell Card | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Black Rose Moonlight Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Rose%20Moonlight%20Dragon) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Blue-Eyes Jet Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20Jet%20Dragon) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 1/0/0 |
| [Blue-Eyes Spirit Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20Spirit%20Dragon) | Synchro Monster | 0/2/0 | 0/3/0 | 0/3/0 | 0/3/0 | 0/2/0 |
| [Blue-Eyes Tyrant Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20Tyrant%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/2/0 | 0/1/0 |
| [Blue-Eyes Ultimate Spirit Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20Ultimate%20Spirit%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Blue-Eyes White Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20White%20Dragon) | Normal Monster | 2/0/0 | 2/0/0 | 2/0/0 | 2/0/0 | 2/0/0 |
| [Blue-Eyes White Dragon, the White Phantom Beast](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20White%20Dragon%2C%20the%20White%20Phantom%20Beast) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Bystial Magnamhut](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Bystial%20Magnamhut) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Champion's Vigilance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Champion%27s%20Vigilance) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Cosmic Blazar Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Blazar%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Crimson Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crimson%20Dragon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Deep-Eyes White Dragon, the Blue Abyss](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deep-Eyes%20White%20Dragon%2C%20the%20Blue%20Abyss) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Despian Luluwalilith](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Despian%20Luluwalilith) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Dogmatika Ecclesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogmatika%20Ecclesia%2C%20the%20Virtuous) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Dogmatika Fleurdelis, the Knighted](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogmatika%20Fleurdelis%2C%20the%20Knighted) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 |
| [Dominus Purge](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Purge) | Trap Card | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dominus Spark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Spark) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Dragon's Mind](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dragon%27s%20Mind) | Trap Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/3 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 0/0/1 |
| [Ecclesia and the Dark Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ecclesia%20and%20the%20Dark%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 3/0/0 | 3/0/0 | 1/0/0 | 2/0/0 | 1/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Fydraulis Harmonia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fydraulis%20Harmonia) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Golden Cloud Beast - Malong](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Golden%20Cloud%20Beast%20-%20Malong) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Hieratic Seal of the Heavenly Spheres](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hieratic%20Seal%20of%20the%20Heavenly%20Spheres) | Link Monster | 0/2/0 | 0/1/0 | 0/1/0 | 0/2/0 | 0/1/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 3/0/0 | 2/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Lightstorm Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lightstorm%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Lyna the Light Charmer, Lustrous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lyna%20the%20Light%20Charmer%2C%20Lustrous) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Maiden of White](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Maiden%20of%20White) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Majesty of the White Dragons](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Majesty%20of%20the%20White%20Dragons) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Maple Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Maple%20Maiden) | Synchro Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mausoleum of White](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mausoleum%20of%20White) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Mistaken Arrest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mistaken%20Arrest) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 0/0/3 | 3/0/0 | 3/0/0 | 0/0/3 | 3/0/0 |
| [Mulcharmy Meowls](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Meowls) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Neo Blue-Eyes Ultimate Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neo%20Blue-Eyes%20Ultimate%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Neo Kaiser Sea Horse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neo%20Kaiser%20Sea%20Horse) | Tuner Monster | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 3/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/2 | 2/0/0 | 0/0/2 | 3/0/0 |
| [Pot of Prosperity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Prosperity) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Primite Dragon Ether Beryl](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Primite%20Dragon%20Ether%20Beryl) | Effect Monster | 1/0/0 | 1/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Primite Drillbeam](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Primite%20Drillbeam) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Primite Lordly Lode](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Primite%20Lordly%20Lode) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 2/0/0 | 3/0/0 |
| [Primite Scream](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Primite%20Scream) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 |
| [PSY-Frame Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Frame%20Driver) | Normal Monster | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [PSY-Framegear Gamma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Gamma) | Tuner Monster | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Psychic End Punisher](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Psychic%20End%20Punisher) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Roar of the Blue-Eyed Dragons](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Roar%20of%20the%20Blue-Eyed%20Dragons) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sage with Eyes of Blue](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sage%20with%20Eyes%20of%20Blue) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Sales Ban](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sales%20Ban) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Shiina, Twin Tempests of Celestial Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shiina%2C%20Twin%20Tempests%20of%20Celestial%20Thunder) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/1 | 0/0/1 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Solemn Warning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Warning) | Trap Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Spirit with Eyes of Blue](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spirit%20with%20Eyes%20of%20Blue) | Link Monster | 0/2/0 | 0/3/0 | 0/2/0 | 0/2/0 | 0/2/0 |
| [Stardust Sifr Divine Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Sifr%20Divine%20Dragon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [The Dragon that Devours the Dogma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dragon%20that%20Devours%20the%20Dogma) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [The Fallen & The Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Fallen%20%26%20The%20Virtuous) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [True Light](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=True%20Light) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ultimate Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ultimate%20Fusion) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Wishes for Eyes of Blue](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Wishes%20for%20Eyes%20of%20Blue) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |

### Dark Time Wizard — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S | L5 M/E/S | L6 M/E/S | L7 M/E/S | L8 M/E/S | L9 M/E/S | L10 M/E/S |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ["A Case for K9"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=%22A%20Case%20for%20K9%22) | Spell Card | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Adamancipator Risen - Dragite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Adamancipator%20Risen%20-%20Dragite) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Alligator's Dragon Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Alligator%27s%20Dragon%20Knight) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/3 | 3/0/0 | 3/0/0 | 0/0/3 |
| [Ashtra's Domain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ashtra%27s%20Domain) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Chaotic Elements](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaotic%20Elements) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Chronomaly Vimana](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chronomaly%20Vimana) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/0 | 0/0/2 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [CXyz Hope Chaos Barian Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=CXyz%20Hope%20Chaos%20Barian%20Dragon) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [CXyz N.As.Ch. Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=CXyz%20N.As.Ch.%20Knight) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [D.D. Crow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=D.D.%20Crow) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dark Time Wizard](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Time%20Wizard) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Different Dimension Ground](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Different%20Dimension%20Ground) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dimensional Fissure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dimensional%20Fissure) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Divine Arsenal AA-ZEUS - Sky Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Divine%20Arsenal%20AA-ZEUS%20-%20Sky%20Thunder) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Dominus Purge](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Purge) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 0/0/1 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Elder Entity Norden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elder%20Entity%20Norden) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Engraver of the Mark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Engraver%20of%20the%20Mark) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Favorite HERO Flame Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Flame%20Wingman) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Favorite HERO Shining Flare Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Shining%20Flare%20Wingman) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Fire Formation - Tenki](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20Formation%20-%20Tenki) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Fisherman of Legend](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fisherman%20of%20Legend) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Foolish Graverobber](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Graverobber) | Trap Card | 0/0/1 | 1/0/0 | 0/0/0 | 0/0/1 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Forbidden Crown](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Crown) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 2/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 2/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ghost Mourner & Moonlit Chill](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Mourner%20%26%20Moonlit%20Chill) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/2 | 3/0/0 | 0/0/3 |
| [Graceful & Skull Dice](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Graceful%20%26%20Skull%20Dice) | Spell Card | 2/0/0 | 3/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 3/0/0 | 1/0/0 | 1/0/0 | 3/0/0 | 1/0/0 |
| [Greatfly](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Greatfly) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/2/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/3 | 0/0/1 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/1 |
| [Hraesvelgr, the Desperate Doom Eagle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hraesvelgr%2C%20the%20Desperate%20Doom%20Eagle) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Jinzo - Energy Shocker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jinzo%20-%20Energy%20Shocker) | Effect Monster | 1/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [K9-17 "Ripper"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-17%20%22Ripper%22) | XYZ Monster | 0/2/0 | 0/2/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/2/0 | 0/0/0 |
| [K9-17 Izuna](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-17%20Izuna) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [K9-66a Jokul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-66a%20Jokul) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [K9-66b Lantern](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-66b%20Lantern) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [K9-66X "Jacks"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-66X%20%22Jacks%22) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [K9-LC Release Restraint](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-LC%20Release%20Restraint) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [K9-X "Ripper/M"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-X%20%22Ripper%2FM%22) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [K9-X "Werewolf"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-X%20%22Werewolf%22) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [K9-X Forced Release](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-X%20Forced%20Release) | Spell Card | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [K9-ØØ Lupis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=K9-%C3%98%C3%98%20Lupis) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [M-X-Saber Invoker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=M-X-Saber%20Invoker) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Maple Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Maple%20Maiden) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Mediclius the Extraordinary Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mediclius%20the%20Extraordinary%20Power%20Patron) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mixousia the Confounder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mixousia%20the%20Confounder) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/3 | 0/0/3 | 0/0/0 | 3/0/0 | 0/0/3 | 3/0/0 | 3/0/0 | 0/0/3 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 3/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Mystical Space Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mystical%20Space%20Typhoon) | Spell Card | 1/0/0 | 0/0/0 | 1/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 1/0/0 | 3/0/0 |
| [N.As.H. Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=N.As.H.%20Knight) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 2/0/0 | 3/0/0 | 0/0/2 | 0/0/0 | 2/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Noble Knight's Shield-Bearer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Noble%20Knight%27s%20Shield-Bearer) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Number 104: Masquerade](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%20104%3A%20Masquerade) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Number 75: Bamboozling Gossip Shadow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2075%3A%20Bamboozling%20Gossip%20Shadow) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Number C104: Umbral Horror Masquerade](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%20C104%3A%20Umbral%20Horror%20Masquerade) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Number C104: Umbral Horror Masquerade Victory](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%20C104%3A%20Umbral%20Horror%20Masquerade%20Victory) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Phantom Fortress Enterblathnir](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Phantom%20Fortress%20Enterblathnir) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/2/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/2/0 | 0/0/0 | 0/1/0 |
| [Pot of Desires](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Desires) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Pot of Extravagance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Extravagance) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 | 2/0/0 |
| [Pot of Prosperity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Prosperity) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/3 | 0/0/2 | 0/0/1 |
| [Prototype Sky Striker Ace - Amatsu](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Prototype%20Sky%20Striker%20Ace%20-%20Amatsu) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [PSY-Frame Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Frame%20Driver) | Normal Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [PSY-Framegear Delta](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Delta) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [PSY-Framegear Gamma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Gamma) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Radiant Typhoon Ascendance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Ascendance) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 2/0/1 | 0/0/0 | 2/0/0 |
| [Radiant Typhoon Chant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Chant) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Radiant Typhoon Eldam](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Eldam) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 2/0/0 | 3/0/0 |
| [Radiant Typhoon Fonix, the Great Flame](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Fonix%2C%20the%20Great%20Flame) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 |
| [Radiant Typhoon Krosea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Krosea) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 3/0/0 |
| [Radiant Typhoon Mandate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Mandate) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 |
| [Radiant Typhoon Manifestation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Manifestation) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/1 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/1 | 0/0/0 | 1/0/0 |
| [Radiant Typhoon Meghala](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Meghala) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/1 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/1 | 0/0/0 | 2/0/0 |
| [Radiant Typhoon Swen](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Swen) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 1/0/0 | 3/0/0 |
| [Radiant Typhoon Varuroon, the Marine Eidolon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Varuroon%2C%20the%20Marine%20Eidolon) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/3/0 | 0/0/0 | 0/0/0 | 0/2/0 | 0/3/0 | 0/0/0 | 0/3/0 |
| [Radiant Typhoon Varuroon, the Vibrant Vortex](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Varuroon%2C%20the%20Vibrant%20Vortex) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 |
| [Radiant Typhoon Vision](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Vision) | Spell Card | 3/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 1/0/0 | 3/0/0 |
| [Raigeki](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Raigeki) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Red-Eyes Black Dragon Exceed](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Red-Eyes%20Black%20Dragon%20Exceed) | Fusion Monster | 0/1/0 | 0/2/0 | 0/1/0 | 0/2/0 | 0/2/0 | 0/1/0 | 0/1/0 | 0/2/0 | 0/1/0 | 0/2/0 |
| [Reinforcement of the Army](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Reinforcement%20of%20the%20Army) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Reversal Box](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Reversal%20Box) | Trap Card | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Shared Ride](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shared%20Ride) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Shiina, Twin Tempests of Celestial Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shiina%2C%20Twin%20Tempests%20of%20Celestial%20Thunder) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 3/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Azalea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Azalea) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Camellia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Camellia) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Hayate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Hayate) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Kagari](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Kagari) | Link Monster | 0/0/0 | 0/0/0 | 0/3/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Raye](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Raye) | Effect Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Roze](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Roze) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Shizuku](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Shizuku) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace - Zeke](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Zeke) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Ace = Zero](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20%3D%20Zero) | Link Monster | 0/0/0 | 0/0/0 | 0/3/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Mecha - Shark Cannon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mecha%20-%20Shark%20Cannon) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Mecha - Widow Anchor](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mecha%20-%20Widow%20Anchor) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Mobilize - Engage!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mobilize%20-%20Engage%21) | Spell Card | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Mobilize - Linkage!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mobilize%20-%20Linkage%21) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sky Striker Special Maneuver - Lemnisgate!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Special%20Maneuver%20-%20Lemnisgate%21) | Spell Card | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Sleepy Scapegoats](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sleepy%20Scapegoats) | Spell Card | 2/0/0 | 1/0/1 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 1/0/1 | 0/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/1 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/1 | 0/0/1 | 0/0/0 |
| [Solemn Strike](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Strike) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Solemn Warning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Warning) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 2/0/1 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Surgical Striker - H.A.M.P.](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Surgical%20Striker%20-%20H.A.M.P.) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Swiftwind Panther Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Swiftwind%20Panther%20Warrior) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/1 | 3/0/0 |
| [The Phantom Knights of Doomed Soleret](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Phantom%20Knights%20of%20Doomed%20Soleret) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [The Phantom Knights of Umbrage Veil](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Phantom%20Knights%20of%20Umbrage%20Veil) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Totem Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Totem%20Bird) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/2/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/2/0 | 0/0/0 | 0/1/0 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/2 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Upstart Goblin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Upstart%20Goblin) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Vallon, the Super Psy Skyblaster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vallon%2C%20the%20Super%20Psy%20Skyblaster) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Wynn the Wind Charmer, Verdant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Wynn%20the%20Wind%20Charmer%2C%20Verdant) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 |
