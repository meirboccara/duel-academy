# Dark Magician Light and Darkness Ritual: tournament lists for the October 19, 2026 format, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #11, "Current Dark Magician Light and Darkness Ritual lists for Atem"):** find 3–10 current TCG tournament lists of the deck YGOPRODeck names **"Dark Magician Light and Darkness Ritual"**, legal under the Forbidden & Limited List effective 2026-10-19; include the earlier hybrids cited in [trainer-meta-decks.md](./trainer-meta-decks.md) §3 (YGOPRODeck decks 739201, 741304, 741086) only if their event is on or after 2026-10-19 and they are legal; audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [blue-eyes-dark-time-wizard-coverage-2026-11.md](./blue-eyes-dark-time-wizard-coverage-2026-11.md) do; say which cards are shared with the 13 archetypes those two notes audited.
>
> **Sourcing rule (same as the earlier notes):** tournament metadata and compositions are YGOPRODeck's own curated "Tournament Meta Decks" records; printed texts/types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** the two notes above (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim except where §1 says otherwise).

## 0. Findings and scope

**Four current lists exist, and none is playable automatically.** YGOPRODeck has exactly **four** TCG Tournament Meta Decks of the Dark Magician / Light and Darkness Ritual hybrid dated on or after October 19, 2026, and all four are legal and selected. Only **two** carry the exact name "Dark Magician Light and Darkness Ritual" (Medellin and Santo Domingo, both October 25). The other two are the same hybrid with an extra engine in front of the name: *Azamina* (San Salvador, November 1, Winner) and *Kashtira Horus* (Seattle, October 24). No Dark Magician list of any name was recorded after November 1, 2026. Together the four contain **92 identifiable unique cards across Main, Extra and Side: 4 scripted & automatic, 7 present but partial, 81 absent.** This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed Dark Magician card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Dark Magician Light and Darkness Ritual (4 lists) | 77 | 3 (4%) | 7 | 67 | 4 / 7 / 81 of 92 |

- **The Dark Magician half is the part Academy already started.** Dark Magician (automatic), Dark Magical Curtain, Magician's Rod and Dark Paladin (partial) are in `cards.ts`, and the engine already has a "mentions [card name]" test on printed text (`catalogue.ts:504`), used by Curtain and Rod. Everything else that makes the deck run is absent: Dark Magician, the Pharaoh's Servant, The Gaze of Timaeus, Secrets of Dark Magic, Illusion of Chaos, and the Chaos Fusions (Master of Chaos, Dark Magician of Destruction, Timaeus the United Magical Dragon).
- **The Light and Darkness Ritual half is entirely absent**, exactly as in the main note: Light and Darkness Ritual, Black Luster Soldier - Soldier of Light and Darkness, Magician of Dark Chaos - Black Chaos, Black Chaos, Skull Archfiend of Chaos, Ragged Records of Rites, Griffoh, Mind Shuffle, Kuriboh - Multiply!. Academy's Ritual Spells still name one monster and one Level total (`cards.ts:65`, `:391`; `catalogue.ts:140-143`).
- **22 cards are in the Main or Extra Deck of all four lists.** Of those, 1 is automatic (Dark Magician), 5 are partial (Dark Magical Curtain, Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos) and 16 are absent.
- **Shared staples.** Of the 92 cards, **57 were already audited** in at least one of the 13 archetypes of the two earlier notes. 33 of them are in the main note's own *Light and Darkness Ritual* sample (the Ars Magna Power Patron variant). The top of the ranking is unchanged: Ash Blossom, Droll & Lock Bird, Ghost Ogre and Mulcharmy Fuwalos (Partial) and Mulcharmy Purulia (Absent) are in all 13 archetypes and in this deck (§3). **35 cards are new to the audits**: the Dark Magician core, its Chaos Fusions, and the Azamina/Sinful Spoils, Horus and Kashtira packages of the two named variants.

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026". All four selected events are dated **October 24 – November 1, 2026**.

- **Deck search:** `getDecks.php?name=Dark Magician&_sft_category=Tournament Meta Decks` was read for offsets 0, 20, 40 and 60 (newest first). Every record whose name contains "Dark Magician Light and Darkness Ritual" and whose event is on or after October 19 was taken: [742716](https://ygoprodeck.com/deck/azamina-dark-magician-light-and-darkness-ritual-742716), [741304](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741304), [741086](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741086), [741509](https://ygoprodeck.com/deck/kashtira-horus-dark-magician-light-and-darkness-ritual-741509). The newest Dark Magician record of any name is 742716 (November 1). The other records on those pages are dated October 18 or earlier (YCS Houston, Santiago, Ramsgate, Monterrey and older), so they were played under the September 21 list.
- **Recent scan:** 420 Tournament Meta Deck records (offsets 0–400 without `name`; deck numbers 740574–746021, events October 19 – November 21, 2026) were scanned by deck name and by the passcodes of Dark Magician (46986414), Dark Magician, the Pharaoh's Servant (88570003), Dark Magical Curtain (41350417) and Light and Darkness Ritual (33599853). **Dark Magician is in exactly the four selected lists.** Dark Magical Curtain and Light and Darkness Ritual also appear in many Ars Magna Power Patron, Branded and other Light and Darkness Ritual lists, which the main note already samples; none of those plays Dark Magician.
- **The three earlier hybrids:** [741304 Medellin](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741304) and [741086 Santo Domingo](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741086) are kept (October 25, legal). [739201 Santiago](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-739201), the list `trainer-meta-decks.md` uses for Atem, is **excluded**: its event was October 17, 2026, and it is not legal under the October 19 list (see the legality screen).
- **Variants:** L2 and L3 are the exact-name build. L1 adds an Azamina / Sinful Spoils package (Diabellstar, WANTED, The Hallowed Azamina, Azamina Mu Rcielago). L4 is a 60-card build with Kashtira and a Horus / King's Sarcophagus package. This is all the current-format data YGOPRODeck has for this hybrid, not a census of the format.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited). **All four selected lists pass**: none plays a Forbidden card or exceeds a limit, and no card exceeds 3 copies. Cards on the list that appear here, always within limit: Limited, 1 copy: Griffoh (all four), Droll & Lock Bird (all four), Solemn Judgment (L1, L3, L4), Harpie's Feather Duster (L3), Terraforming and Foolish Burial (L4). This does not certify region or release legality. No list has unrevealed `???` slots.

**Excluded list 739201 fails the same screen:** it plays seven cards that are Forbidden on the October 19 list (Called by the Grave, Magicians' Souls, Albion the Branded Dragon, Red-Eyes Dark Dragoon, Zenna's Deceiving Doll Maidens, Charmer Quartet in Bloom, Cross-Sheep) and exceeds two limits (3 Griffoh and 2 Droll & Lock Bird, both Limited).

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition. "Absent — data only" remains Absent in totals (none occurs here).
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 11 of the 92 names matched, and all 11 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/1` = L1/L2/L3/L4). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the earlier notes for the 57 cards they already audited, except for the notes on present cards, which were re-checked against today's code (§1). The 35 cards new to the audits were tagged here by reading each fetched text. `script` means card scripting **after its listed shared engine work exists**. `card-deep` flags work beyond the original plan (columns, monsters-as-backrow and the reverse, control vs ownership, Tokens, counters, monsters as Equips, dice).
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts` in `packages/cards` gave 5 files and 91 tests passed. The tests cited in the Notes pass, but they do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What is in Academy for this deck

- **Dark Magician** (`cards.ts:93`): a Normal Monster with its printed numbers; **Scripted & automatic**, like Blue-Eyes White Dragon in the earlier note.
- **Dark Magical Curtain** (`cards.ts:250`; `engine.ts:2542-2567`): **Partial**. The main note's row cited only a plan document; against the code, each player Special Summons 1 DARK Spellcaster from the hand or Deck and Dark Magician then adds a Spell/Trap that mentions it. The engine picks every monster and card (`engine.ts:2526-2540`, `:2562`), and the printed "neither player can activate their effects this turn" is not applied. It can be activated from the hand in the Draw and Standby Phases and flipped in answer (`engine.ts:563`, `:2345`; tests `engine-open.test.ts:22-50`).
- **Magician's Rod** (`cards.ts:362`; `engine.ts:1998-2018`): **Partial**. Its Normal Summon search of a Spell/Trap that mentions "Dark Magician" works; its GY effect does not exist.
- **Dark Paladin** (`cards.ts:229`; `engine.ts:526-530`, `:2469-2493`): **Partial**. Its Fusion recipe, ATK gain and discard-to-negate a Spell exist, but it only negates the opponent's Spell.
- **Foolish Burial** (`cards.ts:331`) and **Terraforming** (`cards.ts:328`): **Scripted & automatic** data effects. Terraforming has no target here: its only Field Spell in these lists, Walls of the Imperial Tomb, is absent.
- **"Mentions" exists in the engine but not in the data vocabulary.** `mentions(card, name)` (`catalogue.ts:504`) reads the printed text for a quoted name. Only the hard-coded Curtain and Rod use it. A data-written card cannot yet filter on it (`CardFilter`, `catalogue.ts:166-193`), and that filter is what Pharaoh's Servant, Dark Magical Circle, Soul Servant, Illusion of Chaos and Celtic Mystic need.
- **Not in these lists:** the other Dark Magician cards Academy has scripted (Dark Magician Girl, Dark Magic Curtain, Sage's Stone, Dark Magic Attack, Dark Burning Attack, Thousand Knives, the Dragon Knights, Magicians' Valkyria: `cards.ts:208`, `:230-231`, `:248`, `:251-254`, `:379`) appear in **none** of the four lists.

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot. Atem's and Arkana's decks in the app are Academy's own and are not these tournament lists; no live deck was changed.

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

TOON, PEND and DICE do not occur here. Among the cards still to build, the most frequent needs are VOCAB (79 of 88), TRIG (58) and CHAIN (44), then GY (28) and LOCK (25). RITUAL (7) and FUS-EFF (7) are few in number but they are the deck's engine: every list plays Light and Darkness Ritual (Ritual Summons) and The Gaze of Timaeus (Fusion Summons by effect).

## 2. Coverage (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Dark Magician Light and Darkness Ritual | 4 | 77 | 3 | 7 | 67 | 4% | 13% | 15 | 4 / 7 / 81 of 92 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): L1 44 cards, 1 automatic, 7 partial, 16 of 66 copies; L2 37 cards, 1 / 5, 13 of 56 copies; L3 40 cards, 1 / 7, 15 of 55 copies; L4 48 cards, 3 / 5, 16 of 75 copies. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started.

## 3. Cards shared with the 13 archetypes of the earlier notes (Main, Extra or Side)

"Of the 13" counts archetypes in the earlier notes' samples: the main note's 11 (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there) plus Blue-Eyes and Dark Time Wizard. Every card here is also played by this deck. Ranked by that count, then by name. Rows 1–13 and the Partial/automatic rows are the shared staples; rows 41–57 are mostly the Light and Darkness Ritual core, shared only with the main note's Ars Magna Power Patron Light and Darkness Ritual lists.

| Rank | Card | Of the 13 | Which of the 13 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 13 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 13 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 13 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 13 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 13 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | Hey, Space Trunade! | 10 | Angelechy, Elfnote, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded, Blue-Eyes, Dark Time Wizard | Absent | VOCAB | Step 3 | script |
| 8 | S:P Little Knight | 10 | Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 9 | Skull Meister | 10 | Angelechy, Elfnote, Toon, Artmage, Unchained, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 10 | Typhoon | 10 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast, Dark Time Wizard | Absent | CHAIN, VOCAB | Step 3 | script |
| 11 | The Great Gallant Bandit | 9 | Angelechy, Elfnote, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 12 | Pot of Sloth | 8 | Angelechy, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Dark Time Wizard | Absent | LOCK, VOCAB | Step 3 | script |
| 13 | Solemn Accusation | 7 | Toon, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 14 | Evenly Matched | 6 | Toon, Artmage, Radiant Typhoon, Branded Dracotail, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, VOCAB | Step 3 | script |
| 15 | Harpie's Feather Duster | 6 | Toon, Unchained, Sky Striker, Branded Dracotail, Sacred Beast, Dark Time Wizard | Scripted & automatic | — | — | — |
| 16 | Solemn Judgment | 6 | Elfnote, Toon, Unchained, Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 17 | Super Polymerization | 6 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |
| 18 | Cosmic Cyclone | 5 | Sky Striker, Branded Dracotail, Branded, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, VOCAB | Step 3 | script |
| 19 | Elder Entity Norden | 5 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 20 | Garura, Wings of Resonant Life | 5 | Artmage, Radiant Typhoon, Sky Striker, Branded, Dark Time Wizard | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 21 | Mudragon of the Swamp | 5 | Artmage, Radiant Typhoon, Sky Striker, Branded, Dark Time Wizard | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |
| 22 | Dominus Impulse | 4 | Angelechy, Toon, Unchained, Sky Striker | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 23 | I:P Masquerena | 4 | Toon, Artmage, Light and Darkness Ritual, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 24 | Mediclius the Extraordinary Power Patron | 4 | Elfnote, Artmage, Light and Darkness Ritual, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 25 | Mistaken Arrest | 4 | Elfnote, Unchained, Branded, Blue-Eyes | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 26 | Accesscode Talker | 3 | Toon, Light and Darkness Ritual, Sky Striker | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 27 | Artifact Lancea | 3 | Branded Dracotail, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |
| 28 | Dharc the Dark Charmer, Gloomy | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 29 | Maple Maiden | 3 | Radiant Typhoon, Blue-Eyes, Dark Time Wizard | Absent | TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |
| 30 | Mixousia the Confounder | 3 | Branded Dracotail, Branded, Dark Time Wizard | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |
| 31 | Number 90: Galaxy-Eyes Photon Lord | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |
| 32 | Relinquished Anima | 3 | Light and Darkness Ritual, Radiant Typhoon, Sacred Beast | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |
| 33 | Shiina, Twin Tempests of Celestial Thunder | 3 | Radiant Typhoon, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 34 | A Bao A Qu, the Lightless Shadow | 2 | Unchained, Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, GY, LINK | Step 4 | script |
| 35 | Chaos Angel | 2 | Angelechy, Toon | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |
| 36 | Favorite HERO Flame Wingman | 2 | Radiant Typhoon, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |
| 37 | Ghost Belle & Haunted Mansion | 2 | Sacred Beast, Blue-Eyes | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 38 | Predaplant Dragostapelia | 2 | Artmage, Branded | Absent | CHAIN, VOCAB, FUS-MAT, CTR | Step 4 + beyond plan | card-deep |
| 39 | Solemn Warning | 2 | Blue-Eyes, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 40 | Terraforming | 2 | Angelechy, Toon | Scripted & automatic | — | — | — |
| 41 | Artemis, the Magistus Moon Maiden | 1 | Light and Darkness Ritual | Absent | TRIG, VOCAB, LINK, EQ-MON | Step 4 + beyond plan | card-deep |
| 42 | Black Chaos | 1 | Light and Darkness Ritual | Absent | LOCK, VOCAB, GY | Step 3 | script |
| 43 | Black Luster Soldier - Soldier of Light and Darkness | 1 | Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |
| 44 | Cyberse Contract Witch | 1 | Sacred Beast | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |
| 45 | Dark Magical Curtain | 1 | Light and Darkness Ritual | Partial | — | — | data |
| 46 | Dark Magician of Destruction | 1 | Light and Darkness Ritual | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 47 | Griffoh | 1 | Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB, RITUAL | Step 3 | script |
| 48 | Kuriboh - Multiply! | 1 | Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 49 | Light and Darkness Ritual | 1 | Light and Darkness Ritual | Absent | VOCAB, GY, RITUAL | Step 3 | script |
| 50 | Magician of Dark Chaos - Black Chaos | 1 | Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |
| 51 | Mind Shuffle | 1 | Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, CONT | Step 3 | script |
| 52 | Ragged Records of Rites | 1 | Light and Darkness Ritual | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 53 | Selene, Queen of the Master Magicians | 1 | Toon | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |
| 54 | Skull Archfiend of Chaos | 1 | Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |
| 55 | Spell Shattering Sword | 1 | Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 56 | Underworld Goddess of the Closed World | 1 | Unchained | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 57 | Witch of the Black Forest | 1 | Light and Darkness Ritual | Absent | LOCK, VOCAB | Step 3 | script |

**In the main note's Light and Darkness Ritual sample too (33 cards):** the hand traps and the Ritual core (Light and Darkness Ritual, Black Luster Soldier - Soldier of Light and Darkness, Magician of Dark Chaos - Black Chaos, Black Chaos, Skull Archfiend of Chaos, Ragged Records of Rites, Griffoh, Kuriboh - Multiply!, Mind Shuffle, Witch of the Black Forest, Dark Magical Curtain, Dark Magician of Destruction) and its Link toolbox. So scripting the Light and Darkness Ritual core serves both samples.

**New to the audits (35 cards):** Dark Magician, Dark Magician, the Pharaoh's Servant, Magician's Rod, Dark Paladin, Dark Magical Circle, Soul Servant, The Gaze of Timaeus, Secrets of Dark Magic, Illusion of Chaos, Magician of Black Chaos MAX, Master of Chaos, Timaeus the United Magical Dragon, Celtic Mystic, Foolish Burial, Fleeting Phantom Mask Master, Nightmare Hands, Guardian Chimera, Starving Venom Fusion Dragon, Axon Kicker Oracle, Miasma Necromancer, W:P Fancy Ball; L1's Azamina package (Diabellstar the Black Witch, WANTED: Seeker of Sinful Spoils, Sinful Spoils of the White Forest, Deception of the Sinful Spoils, The Hallowed Azamina, Azamina Mu Rcielago); L4's Kashtira and Horus packages (Kashtira Fenrir, Kashtira Unicorn, Kashtira Birth, King's Sarcophagus, Walls of the Imperial Tomb, Imsety, Hapi, Duamutef).

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Azamina Dark Magician Light and Darkness Ritual](https://ygoprodeck.com/deck/azamina-dark-magician-light-and-darkness-ritual-742716): San Salvador WCQ Regional - November 1st 2026, **Winner** (150 players, approx.); 51 Main / 15 Extra / 15 Side.
2. [Dark Magician Light and Darkness Ritual](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741304): Medellin WCQ Regional - October 25th 2026, **Runner-Up** (180 players, approx.); 41 Main / 15 Extra / 15 Side.
3. [Dark Magician Light and Darkness Ritual](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741086): Santo Domingo WCQ Regional - October 25th 2026, **Runner-Up** (58 players); 40 Main / 15 Extra / 15 Side.
4. [Kashtira Horus Dark Magician Light and Darkness Ritual](https://ygoprodeck.com/deck/kashtira-horus-dark-magician-light-and-darkness-ritual-741509): Seattle WCQ Regional - October 24th 2026, **Top 8** (120 players); 60 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3/L4) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Dark Magician | 1/1/1/1 | Scripted & automatic | — | — | — | Normal Monster, printed 2500/2100 Level 7 (`cards.ts:93`; printed facts `card-art.ts:72`). |
| Foolish Burial | 0/0/0/1 | Scripted & automatic | — | — | — | Data `mill` of any monster (`cards.ts:331`), resolved at `engine.ts:1058-1065`; Ash sees it as `mill` (`effects.ts:49`, `:67`). Tested at `packages/cards/test/engine-effects.test.ts:29-30`. |
| Terraforming | 0/0/0/1 | Scripted & automatic | — | — | — | Data `search` of a Field Spell (`cards.ts:328`). Only Walls of the Imperial Tomb would be its target here, and that is absent. |
| Harpie's Feather Duster | 0/0/1/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Dark Magical Curtain | 3/3/3/3 | Partial | — | — | data | `curtain` (`cards.ts:250`, resolved at `engine.ts:2542-2567`): each player Special Summons 1 DARK Spellcaster from the hand or Deck, then Dark Magician or Dark Magician Girl adds a Spell/Trap that mentions "Dark Magician" (`mentions`, `catalogue.ts:504`); once per turn, a free Quick-Play (`engine.ts:563`). Missing: the engine chooses both players' monsters and the added card (`engine.ts:2526-2540`, `:2562`), so neither "can" is a choice; "neither player can activate their effects this turn" is not applied. Tested at `packages/cards/test/engine-set.test.ts:122-130` and `engine-open.test.ts:22-50`. Tags kept from the main note (see §5). |
| Droll & Lock Bird | 1/1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 3/3/2/3 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Magician's Rod | 1/0/1/0 | Partial | CHAIN, TRIG, GY | Step 3 | script | `summonSearch: "Dark Magician"` (`cards.ts:362`): after its Normal Summon (`engine.ts:1998`) add 1 Spell/Trap whose printed text quotes "Dark Magician" (`engine.ts:2001-2018`, `mentions` at `catalogue.ts:504`), once per turn. Missing: the GY effect (on the opponent's turn, when you activate a Spell/Trap, Tribute a Spellcaster to add it back). Tested at `packages/cards/test/engine-hand.test.ts:136-170`. |
| Mulcharmy Fuwalos | 3/3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Dark Paladin | 1/0/1/0 (extra) | Partial | CHAIN | Step 1 | script | `cards.ts:229`: Fusion of `dark-magician` + `buster-blader`; `all-dragons` gain counts Dragons on both fields and in both GYs (`engine.ts:526-530`); `negate-spell` discards 1 card, negates and destroys the Spell (`engine.ts:2469-2493`). Missing: it only answers the opponent's pending Spell (`engine.ts:2471`, `:2361`), not a Spell its own controller activates, and only inside the one-answer model. Tested at `packages/cards/test/engine-extra.test.ts:43-48`. In these lists it is summoned by The Gaze of Timaeus or Secrets of Dark Magic (both absent), not Polymerization. |
| Black Chaos | 2/3/3/3 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Black Luster Soldier - Soldier of Light and Darkness | 1/1/1/1 | Absent | TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |  |
| Celtic Mystic | 1/0/1/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Reveal-the-hand condition on cards that mention "Light and Darkness Ritual"; Special Summons a Ritual Monster from the hand (not a Ritual Summon). |
| Dark Magical Circle | 0/0/1/0 | Absent | TRIG, VOCAB, BANISH, CONT | Step 3 | script | Look at the top 3 and reorder; banish trigger when Dark Magician is Summoned. |
| Dark Magician, the Pharaoh's Servant | 1/1/1/1 | Absent | CHAIN, VOCAB | Step 3 | script | Name becomes "Dark Magician" on the field and in the GY: Academy's `nameAs` (`catalogue.ts:453`, read by `named` at `:508`) applies in every location, so it would need a location condition; reveal cost; Set from Deck; Quick Effect with a discard cost. |
| Deception of the Sinful Spoils | 1/0/0/0 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Diabellstar the Black Witch | 3/0/0/0 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Dominus Impulse | 0/3/3/3 | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Duamutef, Blessing of Horus | 0/0/0/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Fleeting Phantom Mask Master | 0/0/0/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Once per Duel GY effect; Type change. |
| Griffoh | 1/1/1/1 | Absent | CHAIN, HAND, VOCAB, RITUAL | Step 3 | script |  |
| Hapi, Guidance of Horus | 0/0/0/1 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Illusion of Chaos | 1/0/1/0 | Absent | CHAIN, VOCAB, GY, RITUAL | Step 3 | script |  |
| Imsety, Glory of Horus | 0/0/0/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Kashtira Birth | 0/0/0/1 | Absent | TRIG, VOCAB, GY, BANISH, CONT | Step 3 | script | Face-down banishment. |
| Kashtira Fenrir | 0/0/0/2 | Absent | TRIG, VOCAB, BANISH | Step 3 | script | Face-down banishment. |
| Kashtira Unicorn | 0/0/0/3 | Absent | TRIG, VOCAB, BANISH | Step 3 | script | Looks at and banishes from the opponent's Extra Deck, face-down. |
| King's Sarcophagus | 0/0/0/1 | Absent | TRIG, LOCK, VOCAB, CONT | Step 3 | script | "Up to four times per turn". |
| Kuriboh - Multiply! | 3/2/2/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Light and Darkness Ritual | 1/1/1/2 | Absent | VOCAB, GY, RITUAL | Step 3 | script |  |
| Magician of Dark Chaos - Black Chaos | 1/1/1/1 | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |  |
| Mind Shuffle | 1/1/1/2 | Absent | CHAIN, TRIG, LOCK, VOCAB, CONT | Step 3 | script |  |
| Mulcharmy Purulia | 3/3/2/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 3/3/2/2 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Nightmare Hands | 0/0/0/1 | Absent | TRIG, VOCAB, GY, BANISH, CONTROL | Step 3 + beyond plan | card-deep | Special Summons from the opponent's GY to your field. |
| Pot of Sloth | 0/3/2/0 (main+side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Ragged Records of Rites | 3/3/3/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Secrets of Dark Magic | 1/0/0/0 | Absent | VOCAB, RITUAL, FUS-EFF | Step 3 | script | A choice of a Fusion Summon or a Ritual Summon, each including Dark Magician or Dark Magician Girl. |
| Sinful Spoils of the White Forest | 1/0/0/0 | Absent | TRIG, VOCAB, GY, FUS-EFF | Step 3 | script |  |
| Skull Archfiend of Chaos | 2/1/2/2 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Soul Servant | 1/0/0/0 | Absent | VOCAB, GY, BANISH | Step 3 | script | Places a card on top of the Deck. |
| Spell Shattering Sword | 1/1/1/1 (main+side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Super Polymerization | 0/3/1/3 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Gaze of Timaeus | 1/1/1/1 | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF | Step 3 | script | Fusion Summon by shuffling one named material from field or GY; delayed banish. |
| The Great Gallant Bandit | 3/0/1/2 | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| The Hallowed Azamina | 1/0/0/0 | Absent | VOCAB, GY, FUS-EFF | Step 3 | script |  |
| Walls of the Imperial Tomb | 0/0/0/1 | Absent | TRIG, VOCAB, CONT | Step 3 | script | Field Spell whose name becomes "King's Sarcophagus". |
| WANTED: Seeker of Sinful Spoils | 3/0/0/0 | Absent | VOCAB, GY, BANISH | Step 3 | script |  |
| A Bao A Qu, the Lightless Shadow | 1/0/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Accesscode Talker | 1/1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Artemis, the Magistus Moon Maiden | 0/1/0/0 (extra) | Absent | TRIG, VOCAB, LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| Axon Kicker Oracle | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Azamina Mu Rcielago | 1/0/0/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Chaos Angel | 0/0/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Cyberse Contract Witch | 1/0/0/0 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Dark Magician of Destruction | 1/1/1/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Dharc the Dark Charmer, Gloomy | 1/1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Elder Entity Norden | 0/1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Favorite HERO Flame Wingman | 0/0/0/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Garura, Wings of Resonant Life | 0/1/1/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Guardian Chimera | 1/0/0/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| I:P Masquerena | 1/1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Maple Maiden | 0/0/0/1 (extra) | Absent | TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Master of Chaos | 1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Mediclius the Extraordinary Power Patron | 1/0/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Miasma Necromancer | 0/0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Mixousia the Confounder | 0/1/1/0 (extra) | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Mudragon of the Swamp | 0/1/0/1 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Number 90: Galaxy-Eyes Photon Lord | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Predaplant Dragostapelia | 0/1/0/0 (extra) | Absent | CHAIN, VOCAB, FUS-MAT, CTR | Step 4 + beyond plan | card-deep |  |
| Relinquished Anima | 0/1/1/0 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| S:P Little Knight | 1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Selene, Queen of the Master Magicians | 1/1/1/0 (extra) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |  |
| Starving Venom Fusion Dragon | 0/1/0/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script | Copies an opponent's monster's name and effects: harder than its tags suggest. |
| Timaeus the United Magical Dragon | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Underworld Goddess of the Closed World | 1/0/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| W:P Fancy Ball | 1/0/0/0 (extra) | Absent | CHAIN, VOCAB, BANISH, LINK, CONTROL | Step 4 + beyond plan | card-deep | Link Summons using a monster the opponent controls. |
| Artifact Lancea | 0/3/0/2 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Cosmic Cyclone | 3/3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Evenly Matched | 0/0/2/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 0/0/1/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 0/0/0/2 (side) | Absent | VOCAB | Step 3 | script |  |
| Magician of Black Chaos MAX | 1/0/0/0 (side) | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |  |
| Mistaken Arrest | 3/0/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Shiina, Twin Tempests of Celestial Thunder | 0/0/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Skull Meister | 0/0/2/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Accusation | 2/0/1/2 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 1/0/1/1 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Solemn Warning | 0/0/1/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Typhoon | 0/3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Witch of the Black Forest | 1/1/0/0 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |

## 5. Unverified, exclusions and interpretation limits

1. **Only two lists carry the exact name.** The brief names the deck "Dark Magician Light and Darkness Ritual". Two current lists have exactly that name (L2, L3). L1 and L4 were added because YGOPRODeck names them as the same hybrid with one more engine in front ("Azamina …", "Kashtira Horus …"), they play the same Dark Magician + Light and Darkness Ritual core (all 22 cards of §0 are in all four), and without them the sample would be below three. This is the same choice the Dark Time Wizard note made for its K9 and Radiant Typhoon hybrids. If only the exact name counts, there are **two** current lists, and L1 (Winner, November 1) and L4 are the nearest legal options.
2. **No list after November 1, 2026.** The deck search and the 420-record scan agree: the hybrid's last recorded top is November 1. YGOPRODeck's records are curated and may lag; a list from a later event that YGOPRODeck has not entered is not covered.
3. **Excluded but relevant:** [739201](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-739201) (Santiago, October 17, Winner), used for Atem in `trainer-meta-decks.md` §3, is outside the format and illegal under it (§0). Records from YCS Houston (October 17) and older events (*Azamina Mitsurugi …*, *Dark Magician Yummy*, *Shining Sarcophagus …*) are also outside the format. The other Light and Darkness Ritual lists of the scan play Dark Magical Curtain but not Dark Magician.
4. **Dark Magical Curtain's tags.** The verdict and tags (Partial, —, —, data) are the main note's, kept verbatim as the method requires. Against today's code the missing parts are a player choice and the "neither player can activate their effects this turn" restriction, which by the key would be TRIG/LOCK (Step 2) rather than data only. The note in §4 gives the code evidence; the tag is left for the owner to correct in the main note.
5. **Per-card mechanism tags are triage (ours).** The 57 cards already audited keep their earlier tags verbatim, including the main note's acknowledged keyword-assisted over- and under-tagging. The 35 new tags were assigned by reading each text. They are judgment calls. Examples: a "card that mentions X" filter is tagged VOCAB; Special Summoning from the opponent's GY (Nightmare Hands) and Link Summoning with the opponent's monster (W:P Fancy Ball) are tagged CONTROL; face-down banishment (Kashtira) is tagged BANISH; Starving Venom's copying of an opponent's effects is tagged only TRIG, VOCAB, FUS-MAT, but it is harder than that suggests.
6. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§0, "Reading the audit"), but no new conformance tests were written. Scripted & automatic is an operational classification, not certification against every Konami ruling.
7. **Card API normalization:** all 102 passcodes of the five fetched lists (the four selected plus 739201) resolved through `card_images` to English names, with no unknown IDs. The API returns one image ID for Dark Magician (46986414), so the passcode scan used that one.
8. **Source independence:** event, date, placement and player counts are YGOPRODeck's curated records ("approx." where it says so), not corroborated with organizers. L4's 60-card Main Deck is as recorded. Event dates in each record's description, not the relative "N weeks ago" ages, govern inclusion. Player names in the records are not reproduced here.
9. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-23. Deck URL, event, date and placement are attached to each selected list in §4.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=<name>&_sft_category=Tournament%20Meta%20Decks` for `Dark Magician` (offsets 0–60), `Light and Darkness Ritual` and `Magician`. The recent scan used the same endpoint without `name`, `offset=0,20,…,400`. Event and placement come from each record's `deck_description` and `tournament*` fields. Card API: `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=<30 passcodes>&misc=yes` in four batches; Appendix A links each name to an exact-name query. No downloaded content was executed.
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, the tests `packages/cards/test/engine-{effects,extra,hand,set,open}.test.ts`, and Academy's own Dark Magician decks in `apps/academy-ygo/src/lib/junior/play/master-decks.ts:39-43` (Arkana), `:54-58` (Yugi Muto) and `:79-83` (Atem). See the exact line anchors throughout. The earlier notes' tags were read from their §4 tables.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first finish the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For this deck specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note: general priority and response origins, event batches, turn restrictions | Ash, Droll, Ogre, Fuwalos; Dark Paladin's negation of any Spell; Dark Magical Curtain's restriction; Magician's Rod's GY effect | Purulia, Nibiru (after Tokens), Kuriboh - Multiply!, Illusion of Chaos's Quick Effect |
| 1 | Step 3 vocabulary: a "mentions [card]" filter in `CardFilter` (the predicate already exists, `catalogue.ts:504`), Set from Deck, reveal costs, place on top of the Deck, name changes limited to field and GY | **The Dark Magician core:** Dark Magician, the Pharaoh's Servant, Dark Magical Circle, Soul Servant, Illusion of Chaos's search, Celtic Mystic | 5 cards; only Pharaoh's Servant is in all four lists |
| 2 | Step 3 Ritual and Fusion by effect: a Ritual Spell for any Ritual Monster that mentions it, Tributes from hand or field with "equal or exceed", GY banish; Fusion by shuffling one named material (Gaze), and a Spell that chooses Fusion or Ritual (Secrets) | **The Light and Darkness Ritual core:** Light and Darkness Ritual, Black Luster Soldier - Soldier of Light and Darkness, Magician of Dark Chaos - Black Chaos, Ragged Records of Rites, Griffoh; The Gaze of Timaeus, Secrets of Dark Magic | These also serve the main note's Light and Darkness Ritual sample (§3) |
| 3 | Step 4 Fusion material predicates ("Dark Magician" + a Chaos Ritual Monster; "Dark Magician or Dark Magician Girl" + a Dragon or Spellcaster) and the Link toolbox | Master of Chaos, Dark Magician of Destruction, Timaeus the United Magical Dragon; Dharc, I:P Masquerena, S:P Little Knight, Accesscode Talker (all four lists) | Per card |
| 4 | The variant packages | Azamina/Sinful Spoils (L1 only), Kashtira and Horus (L4 only) | Only if those variants are wanted |

**For Atem, the realistic target is the exact-name build (L2/L3).** Its Dark Magician half needs Step 3 vocabulary that is small and close to what Curtain and Rod already do. Its Light and Darkness Ritual half needs the general Ritual procedure, which the main note's Light and Darkness Ritual sample needs too. Neither half needs work beyond the original plan. The 10 `card-deep` cards are generic staples and toolbox monsters (Nibiru, The Great Gallant Bandit, Artifact Lancea, Nightmare Hands, and the Extra Deck options Selene, Relinquished Anima, Artemis, W:P Fancy Ball, Maple Maiden and Predaplant Dragostapelia); none of them is in the Main or Extra Deck of all four lists. Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … L4, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Dark Magician Light and Darkness Ritual — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S |
| --- | --- | --- | --- | --- | --- |
| [A Bao A Qu, the Lightless Shadow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=A%20Bao%20A%20Qu%2C%20the%20Lightless%20Shadow) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Artemis, the Magistus Moon Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artemis%2C%20the%20Magistus%20Moon%20Maiden) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/2 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Axon Kicker Oracle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Axon%20Kicker%20Oracle) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Azamina Mu Rcielago](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Azamina%20Mu%20Rcielago) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Black Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Chaos) | Effect Monster | 2/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Black Luster Soldier - Soldier of Light and Darkness](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Luster%20Soldier%20-%20Soldier%20of%20Light%20and%20Darkness) | Ritual Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Celtic Mystic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Celtic%20Mystic) | Effect Monster | 1/0/0 | 0/0/0 | 1/0/0 | 3/0/0 |
| [Chaos Angel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Angel) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/3 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Cyberse Contract Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cyberse%20Contract%20Witch) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dark Magical Circle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Circle) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Dark Magical Curtain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Curtain) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dark Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician) | Normal Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dark Magician of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20of%20Destruction) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Dark Magician, the Pharaoh's Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%2C%20the%20Pharaoh%27s%20Servant) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dark Paladin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Paladin) | Fusion Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Deception of the Sinful Spoils](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deception%20of%20the%20Sinful%20Spoils) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dharc the Dark Charmer, Gloomy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dharc%20the%20Dark%20Charmer%2C%20Gloomy) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Diabellstar the Black Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diabellstar%20the%20Black%20Witch) | Effect Monster | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 0/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Duamutef, Blessing of Horus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Duamutef%2C%20Blessing%20of%20Horus) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Elder Entity Norden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elder%20Entity%20Norden) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Favorite HERO Flame Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Flame%20Wingman) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Fleeting Phantom Mask Master](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fleeting%20Phantom%20Mask%20Master) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Foolish Burial](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 2/0/1 | 2/0/0 | 3/0/0 |
| [Griffoh](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Griffoh) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Guardian Chimera](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Guardian%20Chimera) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Hapi, Guidance of Horus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hapi%2C%20Guidance%20of%20Horus) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Illusion of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Illusion%20of%20Chaos) | Ritual Effect Monster | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Imsety, Glory of Horus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Imsety%2C%20Glory%20of%20Horus) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Kashtira Birth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kashtira%20Birth) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Kashtira Fenrir](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kashtira%20Fenrir) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 |
| [Kashtira Unicorn](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kashtira%20Unicorn) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [King's Sarcophagus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=King%27s%20Sarcophagus) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Kuriboh - Multiply!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kuriboh%20-%20Multiply%21) | Effect Monster | 3/0/0 | 2/0/0 | 2/0/0 | 0/0/0 |
| [Light and Darkness Ritual](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Light%20and%20Darkness%20Ritual) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Magician of Black Chaos MAX](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Black%20Chaos%20MAX) | Ritual Effect Monster | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Magician of Dark Chaos - Black Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Dark%20Chaos%20-%20Black%20Chaos) | Ritual Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Magician's Rod](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%27s%20Rod) | Effect Monster | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Maple Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Maple%20Maiden) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Master of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Master%20of%20Chaos) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mediclius the Extraordinary Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mediclius%20the%20Extraordinary%20Power%20Patron) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Miasma Necromancer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Miasma%20Necromancer) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Mind Shuffle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mind%20Shuffle) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Mistaken Arrest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mistaken%20Arrest) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mixousia the Confounder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mixousia%20the%20Confounder) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 3/0/0 | 0/0/3 | 0/0/2 | 0/0/3 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/3 | 2/0/1 | 1/0/1 | 0/0/2 |
| [Nightmare Hands](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nightmare%20Hands) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Number 90: Galaxy-Eyes Photon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2090%3A%20Galaxy-Eyes%20Photon%20Lord) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 3/0/0 | 0/0/2 | 0/0/0 |
| [Predaplant Dragostapelia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Predaplant%20Dragostapelia) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Ragged Records of Rites](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragged%20Records%20of%20Rites) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Secrets of Dark Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Secrets%20of%20Dark%20Magic) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Selene, Queen of the Master Magicians](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Selene%2C%20Queen%20of%20the%20Master%20Magicians) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Shiina, Twin Tempests of Celestial Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shiina%2C%20Twin%20Tempests%20of%20Celestial%20Thunder) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Sinful Spoils of the White Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sinful%20Spoils%20of%20the%20White%20Forest) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Skull Archfiend of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Archfiend%20of%20Chaos) | Effect Monster | 2/0/0 | 1/0/0 | 2/0/0 | 2/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/2 | 0/0/0 | 0/0/1 | 0/0/2 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/1 | 0/0/0 | 0/0/1 | 0/0/1 |
| [Solemn Warning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Warning) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Soul Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Soul%20Servant) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Spell Shattering Sword](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spell%20Shattering%20Sword) | Spell Card | 0/0/1 | 1/0/0 | 0/0/1 | 1/0/0 |
| [Starving Venom Fusion Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Starving%20Venom%20Fusion%20Dragon) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 3/0/0 | 1/0/0 | 3/0/0 |
| [Terraforming](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Terraforming) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [The Gaze of Timaeus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Gaze%20of%20Timaeus) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 3/0/0 | 0/0/0 | 1/0/0 | 2/0/0 |
| [The Hallowed Azamina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Hallowed%20Azamina) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Timaeus the United Magical Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Timaeus%20the%20United%20Magical%20Dragon) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Underworld Goddess of the Closed World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Underworld%20Goddess%20of%20the%20Closed%20World) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [W:P Fancy Ball](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=W%3AP%20Fancy%20Ball) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Walls of the Imperial Tomb](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Walls%20of%20the%20Imperial%20Tomb) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [WANTED: Seeker of Sinful Spoils](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=WANTED%3A%20Seeker%20of%20Sinful%20Spoils) | Spell Card | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Witch of the Black Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Witch%20of%20the%20Black%20Forest) | Effect Monster | 0/0/1 | 0/0/1 | 0/0/0 | 0/0/0 |
