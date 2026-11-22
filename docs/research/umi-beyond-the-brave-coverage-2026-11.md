# Umi from Beyond the Brave (Atlantis, with Atlantean and Mermail): tournament lists for the October 19, 2026 format, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #14, "Umi deck from Beyond the Brave for Mako"):** Mako plays an Umi deck (A Legendary Ocean / "Umi" support) built on the cards of the **Beyond the Brave** set, with Atlantean, plus Mermail if it fits. Identify the set from Konami's product page and what it adds for Umi, then find up to 10 lists legal under the Forbidden & Limited List effective 2026-10-19. Owner's source rule: recent tournament lists where they exist; otherwise lists by pros, deck guides or other strong builds, each cited and labelled. Audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md) do, and note shared staples.
>
> **Sourcing rule (same as the earlier notes):** the product, its release date and its themes cite Konami's product page. Set contents, tournament metadata, compositions and printed texts/types are YGOPRODeck's (curated Tournament Meta Decks records and card API), not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** the main note, [blue-eyes-dark-time-wizard-coverage-2026-11.md](./blue-eyes-dark-time-wizard-coverage-2026-11.md) and the Dark Magician note (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim).

## 0. Findings and scope

**Five current tournament lists exist, all of the same Beyond the Brave "Atlantis" engine, and none is playable automatically.** In the current format YGOPRODeck has exactly **five** TCG Tournament Meta Decks that play the new Atlantis cards (October 24 – November 8, 2026), all legal, all selected. They are named *Atlantis Mermail* (3), *Atlantis* (1) and *Ashtra Atlantis* (1). All five also play the Atlantean cards, and three play the Mermail cards, so the brief's "with Atlantean, plus Mermail if it fits" describes them exactly. Together they contain **81 identifiable unique cards across Main, Extra and Side: 0 scripted & automatic, 5 present but partial, 76 absent** (one of them, Deep Sea Diva, absent but writable as data today). This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed Umi card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Umi / Atlantis (5 lists) | 66 | 0 (0%) | 4 | 62 | 0 / 5 / 76 of 81 |

- **Beyond the Brave's Umi support is an "Atlantis" theme in which the monsters become "Umi".** Konami's product page: "all these cards (except Atlantis itself) have their names become "Umi" while on the field". The set adds 10 Atlantis/Daedalus cards plus two cards that also reward "Umi" (§1). **No list plays Umi itself or A Legendary Ocean**: the "Umi" they count are their own Atlantis monsters, Advent of Atlantis in the Spell & Trap Zone, and two Link Monsters.
- **Nothing of the theme is in Academy.** Academy's only Umi card is the plain Field Spell (`cards.ts:390`), which none of the lists plays. The Atlantis core needs mechanics the engine lacks (§1 lists six), chiefly names that change only in one location, a "card that mentions X" search filter, Levels that change, and Link Summons with fewer materials.
- **15 cards are in the Main or Extra Deck of all five lists.** Of those, 1 is partial (Ash Blossom) and 14 are absent: Advent of Atlantis, Atlantean Dragoons, Atlantis, City of the Sea Dragon, Call of Atlantis, First Penguin, Levia-Dragon of Atlantis - Daedalus, Monster Arms of Atlantis, Poseidra, the Storming Atlantean, Siren Vortex of Atlantis, Warchief of Atlantis, Azure Ocean Dragon Lord - Neo-Daedalus Rage, Levia-Dragoon - Daedalus, Marincess Coral Anemone, Poseidra Abyss, the Atlantean Dragon Lord.
- **Shared staples.** Of the 81 cards, **23 were already audited** in at least one of the 14 archetypes of the three earlier notes; the other **58 are new to the audits**. The top of the ranking is the usual one: Ash Blossom, Droll & Lock Bird, Ghost Ogre and Mulcharmy Fuwalos (Partial) and Mulcharmy Purulia (Absent) are in all 14 archetypes and here (§3). 11 cards are also in this round's other note, [shining-sarcophagus-coverage-2026-11.md](./shining-sarcophagus-coverage-2026-11.md): all generic staples.

### Beyond the Brave: the product, and what it adds for Umi

Konami's [Beyond the Brave product page](https://www.yugioh-card.com/eu/product/beyond-the-brave/) (Konami Europe) gives **"Release Date: 8 October 2026"**, a 100-card core booster (10 Secret Rares, 14 Ultra Rares, 26 Super Rares, 50 Commons; "Set contents and names are subject to change"). Its Umi paragraph, verbatim in substance: *Atlantis, City of the Sea Dragon* lowers all monster Levels in both players' hands and fields by 1, lets you Link Summon *Azure Ocean Dragon Lord - Neo-Daedalus Rage* or *Levia-Dragoon - Daedalus* with 1 less material, and returns itself from the GY; "all these cards (except Atlantis itself) have their names become "Umi" while on the field"; "There are 3 more monsters that become "Umi" and mention Atlantis (plus the Advent of Atlantis Continuous Spell Card)". The same page lists *Fisherman of Legend* among Joey's Dark Time Wizard cards. The set list (BETB-EN001–EN100) is YGOPRODeck's [card API, `cardset=Beyond the Brave`](https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=Beyond%20the%20Brave&misc=yes); 100 cards returned.

The 12 Beyond the Brave cards whose text names "Umi" or Atlantis (texts from that API):

| Set code | Card | Kind | What it does with "Umi" | In the 5 lists |
| --- | --- | --- | --- | --- |
| BETB-EN058 | Atlantis, City of the Sea Dragon | Field Spell | −1 Level to every monster in both hands and fields while a monster that mentions it is on the field; "Daedalus" Link Summons need 1 fewer material; returns from the GY if you control "Umi" | all 5 |
| BETB-EN060 | Advent of Atlantis | Continuous Spell | Its name becomes "Umi" in the Spell & Trap Zone; places Atlantis **or "Umi"** from the Deck in the Field Zone; searches a Level 7 Sea Serpent when sent to the GY | all 5 |
| BETB-EN059 | Call of Atlantis | Normal Spell | Searches a monster that mentions Atlantis; banish from GY while you control "Umi": WATER +500 | all 5 |
| BETB-EN076 | Daedalus Maelstrom | Counter Trap | Negates a Summon while you control Atlantis; GY effect sends a face-up "Umi" | 4 (2 in the Side) |
| BETB-EN013 | Levia-Dragon of Atlantis - Daedalus | Level 7 Sea Serpent | Becomes "Umi" on the field; Summons itself if you control Atlantis or "Umi"; sends up to 3 "Umi" to search that many Atlantis cards | all 5 |
| BETB-EN014 | Warchief of Atlantis | Level 5 Sea Serpent | Becomes "Umi"; discard: search an Atlantis Spell/Trap; revives itself if you control "Umi" | all 5 |
| BETB-EN015 | Monster Arms of Atlantis | Level 4 Sea Serpent | Becomes "Umi"; revives an Atlantis monster; negates a monster effect by sending an "Umi" | all 5 |
| BETB-EN016 | Siren Vortex of Atlantis | Level 4 Sea Serpent | Becomes "Umi"; sends an Atlantis card from the Deck; Summons a WATER monster if you control "Umi" | all 5 |
| BETB-EN046 | Azure Ocean Dragon Lord - Neo-Daedalus Rage | Link-4 | Becomes "Umi"; revives up to 3 Atlantis monsters; sends every non-"Umi" card on the field to the GY | all 5 |
| BETB-EN047 | Levia-Dragoon - Daedalus | Link-3 | Becomes "Umi"; Summons an Atlantis monster from the Deck; makes the opponent discard and redraw their hand | all 5 |
| BETB-EN029 | Coralianectes, the Luminous Cradle Dragon | Level 7 Sea Serpent | While you control "Umi", WATER Link Monsters cannot be targeted | none |
| BETB-EN004 | Fisherman of Legend | Level 4 Warrior | Summons itself if "Umi" or a card that mentions Dark Time Wizard is on the field | U1 (Side); also the K9 / Radiant Typhoon Dark Time Wizard lists |

The first ten are the theme. Coralianectes and Fisherman of Legend are the set's other two "Umi" cards. Fisherman of Legend was already audited (Dark Time Wizard note: Absent). Beyond the Brave also supplies the **Ashtra** cards in U1 and the WATER Link Monster **Archidux, the Squid Sorcerer** in U1 and U4. The ten theme cards make 9–20 of each list's Main+Extra copies (U1 20 of 55, U2 12 of 65, U3 19 of 55, U4 14 of 75, U5 9 of 57).

**"Atlantean" here is the older archetype**, not the new Atlantis cards: Atlantean Dragoons and Poseidra, the Storming Atlantean (all five), Neptabyss, the Atlantean Prince (four), Abyssrhine, the Atlantean Spirit (four; "always treated as a "Mermail" card"), Atlantean Heavy Infantry (two), and Poseidra Abyss, the Atlantean Dragon Lord (Extra Deck of all five). **Mermail fits** and three lists are named for it: Mermail Abyssteus and Mermail Shadow Squad (treated as "Atlantean") in U2, U4 and U5, Mermail Abysspike in U2 and U4, and Mermail Abyssgaios in the Extra Deck of U1, U2 and U5. U3 is the pure Atlantis build (Fish Sonar, First Penguin, Skull Meister); U1 adds the Ashtra Trap package.

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026". All five selected events are dated **October 24 – November 8, 2026**.

- **Name searches** (`getDecks.php?name=<name>&_sft_category=Tournament Meta Decks`): `Umi` returned 4 records, all one to four years old (Kashtira Umi, Colombia National Championship 2025; Umi, Oklahoma and Buenos Aires WCQ Regionals; Mystic Umi), so none is in the format. `Atlantis` returned exactly the five selected lists. `Daedalus` and `Sea Serpent` returned no deck. `Atlantean` and `Mermail` (offsets 0–40) returned *Atlantean Mermail* records: two are in the format and legal but play no Beyond the Brave card (see Excluded).
- **Recent scan:** 520 Tournament Meta Deck records (offsets 0–500 without `name`; deck numbers 736580–746021; events September 26 – November 22, 2026, 423 of them on or after October 19) were scanned by the passcodes of the 12 cards in the table above. **The ten Atlantis cards appear in exactly the five selected lists.** Fisherman of Legend also appears in five current K9 / Radiant Typhoon Dark Time Wizard lists (and one from October 17), which the Dark Time Wizard note already audits.
- **Source kind:** all five are **recent tournament lists** (top cuts of WCQ Regionals), so the owner's fallback sources (pros, guides, other builds) were not needed. This is all the current-format data YGOPRODeck has for the theme, not a census of the format.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited). **All five selected lists pass**: none plays a Forbidden card or exceeds a limit, and no card exceeds 3 copies. The only card on the list that appears here is Droll & Lock Bird (Limited), 1 copy in U2–U5. Every card has a TCG release date in YGOPRODeck's card data; Beyond the Brave's are October 2026. This does not certify region legality. No list has unrevealed `???` slots.

**Excluded:** [Atlantean Mermail 742132](https://ygoprodeck.com/deck/atlantean-mermail-742132) (Bremen WCQ Regional, October 31, 2026, Winner, 113 players) and [Atlantean Mermail 745254](https://ygoprodeck.com/deck/atlantean-mermail-745254) (Gothenburg WCQ Regional, November 7, 2026, Top 4, 27 players) are legal and current, but contain **no** Beyond the Brave card; they are the Atlantean + Mermail deck without the Atlantis engine. [Atlantean Mermail 739425](https://ygoprodeck.com/deck/atlantean-mermail-739425) (Chaguanas, October 18) is outside the format.

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition. "Absent — data only" remains Absent in totals.
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 5 of the 81 names matched (Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos, Infinite Impermanence), and all 5 have a `cards.ts` entry, so no card here is art-only. Academy's *Kairyu-Shin* (`card-art.ts:145`) is a different card from *Ocean Dragon Lord - Kairyu-Shin*.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/1/0` = U1/U2/U3/U4/U5). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the earlier notes for the 23 cards they already audited. The 58 cards new to the audits were tagged here by reading each fetched text, with the Step taken from the highest step its needs require (the key below). `script` means card scripting **after its listed shared engine work exists**. `card-deep` flags work beyond the original plan (columns, monsters-as-backrow and the reverse, control vs ownership, Tokens, counters, monsters as Equips, dice).
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts test/engine-chain.test.ts test/engine-masters.test.ts` in `packages/cards` gave 7 files and 129 tests passed. The tests cited in the Notes pass, but they do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What is in Academy for this deck

- **Umi** (`cards.ts:390`): a Field Spell with `field-boost` (Fish, Sea Serpent, Thunder and Aqua +200, Machine and Pyro −200), applied at `engine.ts:462-473`, tested at `packages/cards/test/engine-masters.test.ts:75-76`. Mako's deck in the app plays 3 (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:29-32`). **None of the five lists plays it**, but Advent of Atlantis may place "Umi" from the Deck, so it would be a legal target if a list added it.
- **The staple hand traps** are present and partial, as in the earlier notes: Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos, Infinite Impermanence (Side only here).
- **Everything else is absent**, including the whole Atlantis, Atlantean and Mermail card pool. Against today's code, the theme's own mechanics are missing at these points:
  1. **A name that changes in one location only.** Each Atlantis monster is "Umi" *while on the field*, Advent *while in the Spell & Trap Zone*. Academy's `nameAs` is "while on the field or in the GY" (`catalogue.ts:453`), and `named` reads it only for monsters (`catalogue.ts:508`), so a Spell cannot be another card by name. A face-up "Umi" also has to count as a Field Spell *and* as a monster for "if you control "Umi"" conditions; `Condition` checks a filter on face-up monsters (`catalogue.ts:244-246`).
  2. **"A card that mentions Atlantis."** The predicate exists (`mentions`, `catalogue.ts:504`) but data-written cards cannot filter on it (`CardFilter`, `catalogue.ts:166-192`). Call of Atlantis, Warchief, Levia-Dragon, Siren Vortex, Monster Arms and both Link Monsters need it. (Same gap as the Dark Magician note.)
  3. **Levels that change.** Atlantis (−1 to every Level in hands and fields) and Mermail Shadow Squad (WATER monsters become Level 7) change Levels; Synchro and Xyz Summons read the printed `level` (`engine.ts:2162-2166`), and no effect in the vocabulary changes it (`catalogue.ts:199-230`).
  4. **Fewer Link materials.** Atlantis lets a "Daedalus" Link Summon use 1 fewer material; the Link procedure counts materials against the printed rating (`engine.ts:2167-2174`).
  5. **Costs that start effects.** Atlantean Dragoons, Heavy Infantry, Neptabyss and Mermail Shadow Squad trigger when "sent to the GY to activate a WATER monster's effect". Data costs are only discard-self, banish-self, send-self or discard (`catalogue.ts:275`), and the GY watcher has no cause (`catalogue.ts:238`).
  6. **Negating a Summon.** Daedalus Maelstrom is a Counter Trap against a Summon. Academy's Counter Traps negate a Spell, a Trap or a monster effect only (`catalogue.ts:156`; `engine.ts:1462-1467`), and Summons are answered only by Trap Hole, Bottomless and Torrential (`engine.ts:553`).

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot. Mako's deck in the app is Academy's own and is not any of these lists; no live deck was changed.

### Mechanism key (ours, from the main note)

| Code | Required mechanism / extension | Plan step | Repo evidence for current boundary |
| --- | --- | --- | --- |
| CHAIN / HAND | Full fast-effect priority, legal origins, activation vs effect negation, arbitrary responses | 1 | `engine.ts:1277-1299`, `:1482-1533`, `:2631` |
| TRIG / LOCK | General event provenance, simultaneous triggers, delayed effects, turn/Duel restrictions | 2 | `catalogue.ts:231-283`; `engine.ts:1234-1242` |
| VOCAB / GY / BANISH | Multi-choice actions, costs, filters (including "a card that mentions X", names that change by location, and Level changes), return/banish/Set, effects in GY/banishment | 3 | `catalogue.ts:166-283`, `effects.ts:46-59` |
| CONT | Activated/continuous Field and Continuous Spell/Trap effects | 3 | `catalogue.ts:45-163`, `:489-499` |
| RITUAL / FUS-EFF | General Ritual tributes and GY banish; Fusion by effect from Deck/GY/opponent field | 3 | `catalogue.ts:140-143` |
| FUS-MAT / SYN / XYZ / LINK / PEND | Material predicates, alternate procedures, material transfer and reduction, proper summon, arrow/scale effects | 4 | `catalogue.ts:337-342`, `:390-407`; `engine.ts:2081-2202` |
| ZONE / MONSPELL / CONTROL | Columns/centre/Extra Monster Zone conditions, monsters as backrow (and Traps that become monsters), control vs ownership and opponent's cards | Beyond original plan; add to 3/4 | `engine.ts:1628` explicitly omits columns; `catalogue.ts:199-230` actions lack these |
| TOKEN / CTR / EQ-MON / DICE | Token identity, counters, monsters as Equips, dice | Beyond original plan | `catalogue.ts:199-230`, `:372-475`; no general facilities of these kinds |

RITUAL, FUS-EFF, FUS-MAT, PEND, TOON and DICE do not occur here. Among the 81 cards still to build, the most frequent needs are VOCAB (72), TRIG (47), CHAIN (34), GY (28), LOCK (19), BANISH (17). SYN (12) and LINK (11) carry the Extra Deck: the deck Link Summons its two Daedalus monsters every game and Synchro Summons WATER toolbox monsters.

## 2. Coverage (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Umi / Atlantis (Atlantean, Mermail) | 5 | 66 | 0 | 4 | 62 | 0% | 6% | 15 | 0 / 5 / 76 of 81 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): U1 32 cards, 0 automatic, 2 partial, 6 of 55 copies; U2 40 cards, 0 automatic, 4 partial, 9 of 65 copies; U3 31 cards, 0 automatic, 4 partial, 10 of 55 copies; U4 43 cards, 0 automatic, 4 partial, 10 of 75 copies; U5 37 cards, 0 automatic, 3 partial, 7 of 57 copies. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started.

## 3. Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side)

"Of the 14" counts archetypes in the earlier notes' samples: the main note's 11 (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there), Blue-Eyes and Dark Time Wizard, and Dark Magician Light and Darkness Ritual. Every card here is also played by this deck. Ranked by that count, then by name. All 23 are generic staples or Extra Deck toolbox cards, except Fisherman of Legend, Foolish Graverobber and Ashtra's Domain (Beyond the Brave cards the Dark Time Wizard note audited).

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | 12 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | Hey, Space Trunade! | 11 | Angelechy, Elfnote, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | VOCAB | Step 3 | script |
| 8 | S:P Little Knight | 11 | Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 9 | Skull Meister | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 10 | Typhoon | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 11 | The Great Gallant Bandit | 10 | Angelechy, Elfnote, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 12 | Pot of Sloth | 9 | Angelechy, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | LOCK, VOCAB | Step 3 | script |
| 13 | Infinite Impermanence | 6 | Angelechy, Elfnote, Toon, Branded, Blue-Eyes, Dark Time Wizard | Partial | ZONE | beyond plan | card-deep |
| 14 | Dominus Impulse | 5 | Angelechy, Toon, Unchained, Sky Striker, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 15 | Artifact Lancea | 4 | Branded Dracotail, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |
| 16 | Adamancipator Risen - Dragite | 2 | Elfnote, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 17 | Angelechy Enlisted | 2 | Angelechy, Toon | Absent | VOCAB, SYN, ZONE, CONTROL | Step 4 + beyond plan | card-deep |
| 18 | Haggard Lizardose | 2 | Elfnote, Light and Darkness Ritual | Absent | VOCAB, LINK | Step 4 | script |
| 19 | Ashtra's Domain | 1 | Dark Time Wizard | Absent | CHAIN, VOCAB, SYN, MONSPELL | Step 4 + beyond plan | card-deep |
| 20 | Fisherman of Legend | 1 | Dark Time Wizard | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 21 | Foolish Graverobber | 1 | Dark Time Wizard | Absent | CHAIN, VOCAB, GY, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 22 | Ravenous Crocodragon Archethys | 1 | Elfnote | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 23 | Snake-Eyes Vengeance Dragon | 1 | Angelechy | Absent | CHAIN, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |

**Shared with this round's Shining Sarcophagus note (11 cards):** Ash Blossom & Joyous Spring, Dominus Impulse, Droll & Lock Bird, Ghost Ogre & Snow Rabbit, Infinite Impermanence, Mulcharmy Fuwalos, Mulcharmy Purulia, Nibiru, the Primal Being, S:P Little Knight, Skull Meister, Typhoon.

**New to the audits (58 cards):** the ten Atlantis cards; the Atlantean and Mermail cards (Abyssrhine, Neptabyss, Atlantean Dragoons, Atlantean Heavy Infantry, Poseidra, Poseidra Abyss, Abysstrite, Mermail Abyssteus, Abysspike, Shadow Squad, Abyssgaios, Mermail King - Neptabyss, Abyss-scale of the Mizuchi); the WATER engine and toolbox (First Penguin, Royal Penguins Garden, Fish Sonar, Superancient Deepsea King Coelacanth, Gluttonous Reptolphin Greethys, the Deep Sea cards, Moulinglacia, Brionac, White Aura Monoceros, Icejade Gymir Aegirine, LeVirtue Dragon, Virtue Stream, Marincess, Archidux and the rest); U1's Ashtra package; and Side Deck cards.

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

Lists (YGOPRODeck "Tournament Meta Decks", TCG; all are recent tournament lists):

1. [Ashtra Atlantis](https://ygoprodeck.com/deck/ashtra-atlantis-743646): Brazilia WCQ Regional - November 8th 2026, **Top 4** (48 players); 40 Main / 15 Extra / 15 Side.
2. [Atlantis Mermail](https://ygoprodeck.com/deck/atlantis-mermail-743467): Montevideo WCQ Regional - November 7th 2026, **Top 4** (73 players); 50 Main / 15 Extra / 15 Side.
3. [Atlantis](https://ygoprodeck.com/deck/atlantis-742556): South Park WCQ Regional - October 25th 2026, **Top 8** (99 players); 40 Main / 15 Extra / 15 Side.
4. [Atlantis Mermail](https://ygoprodeck.com/deck/atlantis-mermail-741038): Klein Rönnau WCQ Regional - October 25th 2026, **Top 4** (144 players, approx.); 60 Main / 15 Extra / 15 Side.
5. [Atlantis Mermail](https://ygoprodeck.com/deck/atlantis-mermail-740779): Linz WCQ Regional - October 24th 2026, **Top 8** (42 players); 42 Main / 15 Extra / 15 Side.

| Card | Copies (U1/U2/U3/U4/U5) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 0/1/1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 3/3/3/3/2 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 1/3/3/3/3 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Infinite Impermanence | 2/0/3/0/0 (side) | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Abyssrhine, the Atlantean Spirit | 1/2/0/3/3 | Absent | CHAIN, LOCK, VOCAB, GY, BANISH | Step 3 | script | Two-card Tribute cost from hand/field; "add or Special Summon" choice. |
| Advent of Atlantis | 3/2/2/2/1 | Absent | TRIG, VOCAB, CONT | Step 3 | script | Name becomes "Umi" only in the Spell & Trap Zone; places a Field Spell from the Deck (it can place Academy's Umi, `cards.ts:390`). |
| Ashtra's Domain | 1/0/0/0/0 | Absent | CHAIN, VOCAB, SYN, MONSPELL | Step 4 + beyond plan | card-deep | A Trap that becomes a monster (the reverse of MONSPELL). |
| Ashtrashen - Gate to the Worlds Beyond | 1/0/0/0/0 | Absent | TRIG, VOCAB, CONT | Step 3 | script | Targets face-down cards; "either player Sets a card" trigger. |
| Atlantean Dragoons | 2/3/1/3/3 | Absent | TRIG, VOCAB | Step 3 | script | Trigger when sent to the GY as a cost for a WATER monster's effect: needs cost provenance. |
| Atlantean Heavy Infantry | 0/0/0/1/1 | Absent | TRIG, VOCAB | Step 3 | script | Extra Normal Summon; same cost-provenance trigger. |
| Atlantis, City of the Sea Dragon | 1/1/1/1/1 | Absent | VOCAB, GY, CONT, LINK | Step 4 | script | Lowers every Level in both hands and fields while a monster that mentions it is on the field; Link Summons of "Daedalus" with 1 fewer material; returns itself from the GY if you control "Umi". |
| Call of Atlantis | 3/1/3/1/1 | Absent | VOCAB, GY, BANISH | Step 3 | script | Search by "mentions"; conditional negation; GY banish boost. |
| Daedalus Maelstrom | 0/1/1/1/1 (main+side) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script | Counter Trap that negates a Summon (Academy's Counter Traps negate only a Spell, Trap or monster effect: `catalogue.ts:156`, `engine.ts:1466`). |
| Deep Sea Minstrel | 0/1/0/3/3 (main+side) | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script | Looks at the opponent's hand; banishes until the End Phase; places a card on top or bottom of the Deck. |
| Dominus Impulse | 0/3/3/3/3 | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| First Penguin | 2/3/3/3/3 (main+side) | Absent | LOCK, VOCAB | Step 3 | script | Reveals an Extra Deck monster; becomes a Tuner; flips itself face-down. |
| Fish Sonar | 0/0/3/0/0 | Absent | VOCAB | Step 3 | script | Search of a monster that mentions "Umi" or a WATER Normal Monster, then a Deck Special Summon if "Umi" is on the field. |
| Gluttonous Reptolphin Greethys | 0/1/0/1/0 | Absent | TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script | Level bound by the opponent's hand size. |
| Levia-Dragon of Atlantis - Daedalus | 2/1/1/1/1 | Absent | VOCAB, GY | Step 3 | script | Cost of up to 3 face-up "Umi" for as many searches by "mentions"; name "Umi" on the field only. |
| Mermail Abysspike | 0/2/0/2/0 | Absent | VOCAB | Step 3 | script | Cost: discard a WATER monster (Academy's data cost is any card, `catalogue.ts:275`). |
| Mermail Abyssteus | 0/2/0/2/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Mermail Shadow Squad | 0/3/0/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Changes Levels; cost-provenance trigger. |
| Mikumari the Banisher Ashtra | 2/0/0/0/0 | Absent | TRIG, VOCAB, GY | Step 3 | script | Summons itself by returning a face-down card to the hand or Extra Deck. |
| Monster Arms of Atlantis | 1/1/2/1/1 (main+side) | Absent | CHAIN, VOCAB, GY, BANISH | Step 3 | script | Negates a monster effect; cost banishes itself from field or GY and sends a face-up "Umi". |
| Moulinglacia the Elemental Lord | 0/1/0/1/1 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Random discard from the opponent's hand. |
| Mulcharmy Purulia | 2/2/0/3/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Neptabyss, the Atlantean Prince | 3/3/0/3/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Nibiru, the Primal Being | 2/2/3/3/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Poseidra, the Storming Atlantean | 3/2/2/3/3 (main+side) | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Royal Penguins Garden | 0/3/2/0/0 (main+side) | Absent | VOCAB, CONT | Step 3 | script |  |
| Siren Vortex of Atlantis | 3/2/3/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script | Sends a card that mentions Atlantis from the Deck. |
| Skull Meister | 3/0/3/0/0 | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Superancient Deepsea King Coelacanth | 0/1/0/1/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script | Special Summons "as many as possible". |
| The Great Gallant Bandit | 0/0/0/3/3 (main+side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Warchief of Atlantis | 3/1/3/3/1 | Absent | VOCAB, GY | Step 3 | script | Discard-self search of a Spell/Trap that mentions Atlantis. |
| Yoa the Plague Ashtra | 1/0/0/0/0 | Absent | CHAIN, VOCAB | Step 3 | script | Sets an "Ashtra" Spell/Trap from the Deck; changes Levels. |
| Abysstrite, the Atlantean Spirit | 0/1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, XYZ | Step 4 | script | Sets an "Abyss-" Trap from the Deck. |
| Adamancipator Risen - Dragite | 0/1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Angelechy Enlisted | 0/0/1/0/0 (extra) | Absent | VOCAB, SYN, ZONE, CONTROL | Step 4 + beyond plan | card-deep |  |
| Archidux, the Squid Sorcerer | 1/0/0/1/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, LINK | Step 4 | script |  |
| Ashtraya Mikumari-no-Mikoto | 1/0/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH, SYN | Step 4 | script | Sets a Trap from the GY or banishment. |
| Azure Ocean Dragon Lord - Neo-Daedalus Rage | 2/2/2/2/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script | Name "Umi" on the field only; revives up to 3 to pointed zones; Quick Effect sends every non-"Umi" card on the field to the GY. |
| Brionac, Dragon of the Ice Barrier | 0/1/1/0/0 (extra) | Absent | VOCAB, SYN | Step 4 | script | Discard any number, bounce that many. |
| Brionac, the Magical Ice Dragon | 1/0/0/1/0 (extra) | Absent | TRIG, VOCAB, SYN | Step 4 | script |  |
| Deep Sea Prima Donna | 0/1/0/1/1 (extra) | Absent | TRIG, VOCAB, BANISH, SYN | Step 4 | script | Adds an opponent's banished card to their hand. |
| Deep Sea Repetiteur | 0/1/1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script | Synchro recipe names Deep Sea Diva (`synchroTuner` exists, `catalogue.ts:447`). |
| Draco Berserker of the Tenyi | 1/0/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script |  |
| Eria the Water Charmer, Gentle | 1/0/0/0/0 (extra) | Absent | TRIG, VOCAB, GY, LINK, CONTROL | Step 4 + beyond plan | card-deep | Special Summons from the opponent's GY to your field. |
| Graydle Dragon | 0/0/0/0/1 (extra) | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script | Counts WATER Synchro materials. |
| Haggard Lizardose | 0/1/0/0/0 (extra) | Absent | VOCAB, LINK | Step 4 | script |  |
| Icejade Gymir Aegirine | 0/1/0/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script |  |
| Levia-Dragoon - Daedalus | 2/1/2/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script | Discards the opponent's whole hand and redraws; no responses. |
| LeVirtue Dragon | 0/1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, XYZ | Step 4 | script | Moves Xyz materials between monsters. |
| Marincess Coral Anemone | 1/1/1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Marincess Great Bubble Reef | 1/0/0/0/0 (extra) | Absent | TRIG, VOCAB, BANISH, LINK | Step 4 | script |  |
| Mermail Abyssgaios | 1/1/0/0/1 (extra) | Absent | CHAIN, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Mermail King - Neptabyss | 0/0/0/0/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script | Equips an "Abyss-" Equip Spell to itself. |
| Poseidra Abyss, the Atlantean Dragon Lord | 1/1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, XYZ | Step 4 | script | Alternative Xyz procedure with material transfer. |
| Ravenous Crocodragon Archethys | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| S:P Little Knight | 1/0/1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Snake-Eyes Vengeance Dragon | 0/0/1/0/0 (extra) | Absent | CHAIN, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Snowdust Giant | 0/0/0/1/0 (extra) | Absent | VOCAB, XYZ, CTR | Step 4 + beyond plan | card-deep | Ice Counters. |
| Toadally Awesome | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, XYZ, CONTROL | Step 4 + beyond plan | card-deep | Sets the negated opponent's card on your field. |
| White Aura Monoceros | 0/1/0/1/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, SYN | Step 4 | script |  |
| Worldsea Dragon Zealantis | 1/0/0/0/0 (extra) | Absent | CHAIN, VOCAB, BANISH, LINK, ZONE, CONTROL | Step 4 + beyond plan | card-deep | Returns banished monsters to their owners' fields; co-linked count. |
| Xyz Armor Torpedo | 0/0/1/0/0 (extra) | Absent | LOCK, XYZ, EQ-MON | Step 4 + beyond plan | card-deep | Works while equipped. |
| Abyss-scale of the Mizuchi | 0/0/0/0/1 (side) | Absent | CHAIN, TRIG, VOCAB, CONT | Step 3 | script | Equip Spell that negates an opponent's Spell effect as it resolves. |
| Anti-Magic Arrows | 0/0/0/0/3 (side) | Absent | CHAIN, TRIG, LOCK | Step 2 | script | Start-of-Battle-Phase timing; no responses. |
| Artifact Lancea | 0/2/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Deep Sea Aria | 0/0/0/1/0 (side) | Absent | VOCAB, BANISH | Step 3 | script | Banish-from-GY cost. |
| Deep Sea Diva | 0/0/0/3/1 (side) | Absent — data only | — | — | data | Fits the existing vocabulary: `when: "normal-summoned"`, `optional`, `{ do: "special", from: ["deck"], filter: { type: "sea-serpent", maxLevel: 3 } }` (`catalogue.ts:203`, `:261`), plus `tuner`. |
| Fisherman of Legend | 1/0/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Foolish Graverobber | 2/0/0/0/0 (side) | Absent | CHAIN, VOCAB, GY, BANISH, CONTROL | Step 3 + beyond plan | card-deep | Special Summons from either GY to your field and Sets from the opponent's GY: ownership vs control. |
| Heat Wave | 0/3/0/0/0 (side) | Absent | TRIG, LOCK | Step 2 | script | Start-of-Main-Phase-1 timing; Summon lock until your next Draw Phase. |
| Hey, Space Trunade! | 0/1/0/2/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Ocean Dragon Lord - Kairyu-Shin | 0/0/0/1/0 (side) | Absent | LOCK, VOCAB | Step 3 | script | Not Academy's Kairyu-Shin Normal Monster (`card-art.ts:145`, a different card). |
| Pot of Sloth | 0/2/2/2/0 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Spell Shattering Arrow | 1/0/0/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Typhoon | 3/3/3/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Virtue Stream | 0/0/1/1/0 (side) | Absent | VOCAB, GY, BANISH | Step 3 | script |  |

## 5. Unverified, exclusions and interpretation limits

1. **"Umi deck" means the Atlantis engine here.** No current list is named "Umi" and none plays the card Umi or A Legendary Ocean. The five lists are the only current ones built on Beyond the Brave's "Umi" cards, which is what issue #14 asks for. If the owner wants the card Umi in Mako's deck, Advent of Atlantis can place it, and Fish Sonar (U3) and Ocean Dragon Lord - Kairyu-Shin (U4 Side) mention it; but no recorded list does this.
2. **Release date.** Konami's European product page gives 8 October 2026. The US page was not reachable at the URL tried (`/en/products/beyond-the-brave/`, HTTP 404), so a one-day regional difference was not checked. It does not affect legality: every event is October 24 or later.
3. **No list after November 8, 2026.** The name search and the 520-record scan agree. YGOPRODeck's records are curated and may lag.
4. **Excluded but relevant:** the two current *Atlantean Mermail* lists (§0) are the nearest legal alternative without Beyond the Brave cards. Their unique cards are not audited here.
5. **Per-card mechanism tags are triage (ours).** The 23 cards already audited keep their earlier tags verbatim, including the main note's acknowledged keyword-assisted over- and under-tagging. The 58 new tags were assigned by reading each text. Judgment calls: a name that changes only in one location, a Level change and a "mentions" filter are tagged VOCAB; Link material reduction is tagged LINK; a trigger from being sent as a cost is tagged TRIG; Special Summoning from the opponent's GY (Eria), Setting an opponent's card (Toadally Awesome) and returning monsters to their owners' fields (Worldsea Dragon Zealantis) are tagged CONTROL; "linked" and co-linked conditions are tagged ZONE. Deep Sea Diva is "Absent — data only" because its whole text fits the existing data vocabulary.
6. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§0, "Reading the audit"), but no new conformance tests were written. Scripted & automatic is an operational classification, not certification against every Konami ruling.
7. **Card API normalization:** every passcode of the five lists resolved through `card_images` to an English name, with no unknown IDs.
8. **Source independence:** event, date, placement and player counts are YGOPRODeck's curated records ("approx." where it says so), not corroborated with organizers. Event dates in each record's description, not the relative "N weeks ago" ages, govern inclusion. Player names in the records are not reproduced here.
9. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-23. Deck URL, event, date and placement are attached to each selected list in §4.

- Konami: [Beyond the Brave product page](https://www.yugioh-card.com/eu/product/beyond-the-brave/) (release date, contents, Atlantis paragraph); [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); set list `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=Beyond%20the%20Brave&misc=yes`; deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=<name>&_sft_category=Tournament%20Meta%20Decks` for `Umi`, `Atlantis`, `Daedalus`, `Atlantean`, `Mermail`, `Sea Serpent`; the recent scan used the same endpoint without `name`, `offset=0,20,…,500`. Event and placement come from each record's `deck_description` and `tournament*` fields. Card API `cardinfo.php?id=<passcodes>&misc=yes` in batches; Appendix A links each name to an exact-name query. No downloaded content was executed.
- Repo primary sources: `packages/engine/src/{engine,catalogue,effects,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, the tests listed in "Reading the audit", and Mako's deck `apps/academy-ygo/src/lib/junior/play/master-decks.ts:29-32`. The earlier notes' tags were read from their §4 tables.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first finish the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For this deck specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note: general priority and response origins, event batches, turn restrictions; plus triggers from "sent as a cost" | Ash, Droll, Ogre, Fuwalos; Monster Arms' negation; the Atlantean cost triggers | Purulia, Nibiru (after Tokens), Abyssrhine's GY draw |
| 1 | Step 3 vocabulary: names that change by location (field only, Spell & Trap Zone only) and are read for Spells too; "if you control "Umi"" over monsters and Spells; a "mentions [card]" filter in `CardFilter`; Field Spell placed from the Deck | **The Atlantis Main Deck core:** Advent, Call, Warchief, Levia-Dragon, Siren Vortex, Monster Arms (all five lists) | 6 cards, all in every list |
| 2 | Step 3 Level changes, and Step 4 Link material reduction | Atlantis, City of the Sea Dragon; Mermail Shadow Squad; the WATER Synchro and Xyz lines | Atlantis is in all five lists |
| 3 | Step 4 Link Summons with "4 monsters" / "3 WATER monsters", pointed-zone revival (exists, `catalogue.ts:203`), and the Atlantean Xyz | Neo-Daedalus Rage, Levia-Dragoon (all five), Poseidra Abyss (all five), Abysstrite | Per card |
| 4 | Atlantean and Mermail packages | Atlantean Dragoons, Poseidra, Neptabyss, Abyssrhine; Abyssteus, Abysspike | Only if the Mermail variant (U2/U4/U5) is wanted |

**For Mako, the realistic target is U3 (pure Atlantis) or the shared core of all five.** The 14 absent cards in every list are the six Atlantis Main Deck monsters and Spells, Atlantis itself, the two Daedalus Link Monsters, Atlantean Dragoons, Poseidra, First Penguin, Marincess Coral Anemone and Poseidra Abyss. None of the 13 `card-deep` cards (Infinite Impermanence, Ashtra's Domain, Nibiru, the Primal Being, The Great Gallant Bandit, Angelechy Enlisted, Eria the Water Charmer, Gentle, Snake-Eyes Vengeance Dragon, Snowdust Giant, Toadally Awesome, Worldsea Dragon Zealantis, Xyz Armor Torpedo, Artifact Lancea, Foolish Graverobber) is in the Main or Extra Deck of all five lists. Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for U1 … U5, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Umi / Atlantis — zone inventory

| Card / API text | API type | U1 M/E/S | U2 M/E/S | U3 M/E/S | U4 M/E/S | U5 M/E/S |
| --- | --- | --- | --- | --- | --- | --- |
| [Abyss-scale of the Mizuchi](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Abyss-scale%20of%20the%20Mizuchi) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 |
| [Abyssrhine, the Atlantean Spirit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Abyssrhine%2C%20the%20Atlantean%20Spirit) | Effect Monster | 1/0/0 | 2/0/0 | 0/0/0 | 3/0/0 | 3/0/0 |
| [Abysstrite, the Atlantean Spirit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Abysstrite%2C%20the%20Atlantean%20Spirit) | XYZ Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Adamancipator Risen - Dragite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Adamancipator%20Risen%20-%20Dragite) | Synchro Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Advent of Atlantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Advent%20of%20Atlantis) | Spell Card | 3/0/0 | 2/0/0 | 2/0/0 | 2/0/0 | 1/0/0 |
| [Angelechy Enlisted](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Enlisted) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Anti-Magic Arrows](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Anti-Magic%20Arrows) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Archidux, the Squid Sorcerer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Archidux%2C%20the%20Squid%20Sorcerer) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Ashtra's Domain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ashtra%27s%20Domain) | Trap Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ashtrashen - Gate to the Worlds Beyond](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ashtrashen%20-%20Gate%20to%20the%20Worlds%20Beyond) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ashtraya Mikumari-no-Mikoto](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ashtraya%20Mikumari-no-Mikoto) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Atlantean Dragoons](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Atlantean%20Dragoons) | Effect Monster | 2/0/0 | 3/0/0 | 1/0/0 | 3/0/0 | 3/0/0 |
| [Atlantean Heavy Infantry](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Atlantean%20Heavy%20Infantry) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 |
| [Atlantis, City of the Sea Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Atlantis%2C%20City%20of%20the%20Sea%20Dragon) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Azure Ocean Dragon Lord - Neo-Daedalus Rage](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Azure%20Ocean%20Dragon%20Lord%20-%20Neo-Daedalus%20Rage) | Link Monster | 0/2/0 | 0/2/0 | 0/2/0 | 0/2/0 | 0/1/0 |
| [Brionac, Dragon of the Ice Barrier](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Brionac%2C%20Dragon%20of%20the%20Ice%20Barrier) | Synchro Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Brionac, the Magical Ice Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Brionac%2C%20the%20Magical%20Ice%20Dragon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Call of Atlantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Call%20of%20Atlantis) | Spell Card | 3/0/0 | 1/0/0 | 3/0/0 | 1/0/0 | 1/0/0 |
| [Daedalus Maelstrom](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Daedalus%20Maelstrom) | Trap Card | 0/0/0 | 0/0/1 | 1/0/0 | 1/0/0 | 0/0/1 |
| [Deep Sea Aria](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deep%20Sea%20Aria) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Deep Sea Diva](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deep%20Sea%20Diva) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/1 |
| [Deep Sea Minstrel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deep%20Sea%20Minstrel) | Tuner Monster | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/2 | 1/0/2 |
| [Deep Sea Prima Donna](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deep%20Sea%20Prima%20Donna) | Synchro Tuner Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Deep Sea Repetiteur](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deep%20Sea%20Repetiteur) | Synchro Tuner Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 0/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Draco Berserker of the Tenyi](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Draco%20Berserker%20of%20the%20Tenyi) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Eria the Water Charmer, Gentle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Eria%20the%20Water%20Charmer%2C%20Gentle) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [First Penguin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=First%20Penguin) | Effect Monster | 2/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 2/0/1 |
| [Fish Sonar](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fish%20Sonar) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Fisherman of Legend](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fisherman%20of%20Legend) | Effect Monster | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Foolish Graverobber](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Graverobber) | Trap Card | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 2/0/1 | 3/0/0 | 3/0/0 | 0/0/2 |
| [Gluttonous Reptolphin Greethys](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gluttonous%20Reptolphin%20Greethys) | Tuner Monster | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Graydle Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Graydle%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Haggard Lizardose](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Haggard%20Lizardose) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Heat Wave](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Heat%20Wave) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Icejade Gymir Aegirine](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Icejade%20Gymir%20Aegirine) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 0/0/2 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Levia-Dragon of Atlantis - Daedalus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Levia-Dragon%20of%20Atlantis%20-%20Daedalus) | Effect Monster | 2/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Levia-Dragoon - Daedalus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Levia-Dragoon%20-%20Daedalus) | Link Monster | 0/2/0 | 0/1/0 | 0/2/0 | 0/1/0 | 0/1/0 |
| [LeVirtue Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=LeVirtue%20Dragon) | XYZ Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Marincess Coral Anemone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Marincess%20Coral%20Anemone) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Marincess Great Bubble Reef](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Marincess%20Great%20Bubble%20Reef) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mermail Abyssgaios](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mermail%20Abyssgaios) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Mermail Abysspike](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mermail%20Abysspike) | Effect Monster | 0/0/0 | 2/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Mermail Abyssteus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mermail%20Abyssteus) | Effect Monster | 0/0/0 | 2/0/0 | 0/0/0 | 2/0/0 | 3/0/0 |
| [Mermail King - Neptabyss](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mermail%20King%20-%20Neptabyss) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Mermail Shadow Squad](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mermail%20Shadow%20Squad) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/0 | 3/0/0 | 3/0/0 |
| [Mikumari the Banisher Ashtra](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mikumari%20the%20Banisher%20Ashtra) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Monster Arms of Atlantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Monster%20Arms%20of%20Atlantis) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/1 | 1/0/0 | 1/0/0 |
| [Moulinglacia the Elemental Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Moulinglacia%20the%20Elemental%20Lord) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 0/0/1 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/2 | 2/0/0 | 0/0/0 | 3/0/0 | 3/0/0 |
| [Neptabyss, the Atlantean Prince](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neptabyss%2C%20the%20Atlantean%20Prince) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/0 | 3/0/0 | 3/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/2 | 0/0/2 | 0/0/3 | 3/0/0 | 0/0/0 |
| [Ocean Dragon Lord - Kairyu-Shin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ocean%20Dragon%20Lord%20-%20Kairyu-Shin) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Poseidra Abyss, the Atlantean Dragon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Poseidra%20Abyss%2C%20the%20Atlantean%20Dragon%20Lord) | XYZ Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Poseidra, the Storming Atlantean](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Poseidra%2C%20the%20Storming%20Atlantean) | Effect Monster | 2/0/1 | 2/0/0 | 2/0/0 | 3/0/0 | 2/0/1 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/2 | 0/0/2 | 0/0/2 | 0/0/0 |
| [Ravenous Crocodragon Archethys](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ravenous%20Crocodragon%20Archethys) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Royal Penguins Garden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Royal%20Penguins%20Garden) | Spell Card | 0/0/0 | 3/0/0 | 0/0/2 | 0/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Siren Vortex of Atlantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Siren%20Vortex%20of%20Atlantis) | Effect Monster | 3/0/0 | 2/0/0 | 3/0/0 | 1/0/0 | 1/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 3/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Snake-Eyes Vengeance Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Snake-Eyes%20Vengeance%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Snowdust Giant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Snowdust%20Giant) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Spell Shattering Arrow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spell%20Shattering%20Arrow) | Spell Card | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Superancient Deepsea King Coelacanth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Superancient%20Deepsea%20King%20Coelacanth) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/3 |
| [Toadally Awesome](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Toadally%20Awesome) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/3 | 0/0/3 | 0/0/3 | 0/0/0 |
| [Virtue Stream](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Virtue%20Stream) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/1 | 0/0/0 |
| [Warchief of Atlantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Warchief%20of%20Atlantis) | Effect Monster | 3/0/0 | 1/0/0 | 3/0/0 | 3/0/0 | 1/0/0 |
| [White Aura Monoceros](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=White%20Aura%20Monoceros) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Worldsea Dragon Zealantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Worldsea%20Dragon%20Zealantis) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Xyz Armor Torpedo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Xyz%20Armor%20Torpedo) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Yoa the Plague Ashtra](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Yoa%20the%20Plague%20Ashtra) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
