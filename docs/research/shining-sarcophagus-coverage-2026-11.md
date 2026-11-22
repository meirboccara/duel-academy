# Shining Sarcophagus: lists legal under the October 19, 2026 Forbidden & Limited List, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #16, "Shining Sarcophagus lists for Yugi"):** up to 10 Shining Sarcophagus lists legal under the Forbidden & Limited List effective 2026-10-19. Owner's source rule: recent tournament lists where they exist; otherwise lists by pros, deck guides or other strong builds, each cited and labelled with its kind. Audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md) do, and note shared staples.
>
> **Sourcing rule (same as the earlier notes):** compositions and printed texts/types are YGOPRODeck's (deck records and card API), not an independent Konami ruling audit; tournament records elsewhere cite their site. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** the main note, [blue-eyes-dark-time-wizard-coverage-2026-11.md](./blue-eyes-dark-time-wizard-coverage-2026-11.md) and the Dark Magician note (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim).

## 0. Findings and scope

**No Shining Sarcophagus list from a tournament, a pro or a guide site is legal in the current format; the three lists below are community builds, and none is playable automatically.** The October 19, 2026 list made Forbidden cards the recent Shining Sarcophagus tops relied on (Magicians' Souls, Red-Eyes Dark Dragoon, Zenna's Deceiving Doll Maidens, Charmer Quartet in Bloom, Cross-Sheep, Secret Village of the Spellcasters and others), and neither YGOPRODeck nor Yugiohmeta.com records a TCG top with Shining Sarcophagus since. Following the owner's fallback rule, the pool is **three community builds posted on YGOPRODeck after October 19**, all legal, all playing the Shining Sarcophagus engine (Shining Sarcophagus, Dark Magician Girl the Magician's Apprentice, Gandora-G the Dragon of Destruction, Future Silence) inside a Dark Magician or Orcust deck. One of them (S2) is written up as a deck guide by its author. **None has a recorded result**, so "strong" is the author's claim, not a fact. Together they contain **84 identifiable unique cards across Main, Extra and Side: 5 scripted & automatic, 9 present but partial, 70 absent.** This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Shining Sarcophagus (3 community lists) | 66 | 4 (6%) | 8 | 54 | 5 / 9 / 70 of 84 |

- **The Shining Sarcophagus engine is entirely absent.** Shining Sarcophagus, Dark Magician Girl the Magician's Apprentice, Gandora-G and Future Silence are in all three lists and none is in Academy. They need a "card that mentions Shining Sarcophagus" filter, a Continuous Spell with an ignition search and a trigger on the opponent's Special Summon from the GY, a self-Summon that renames the card, and Gandora-G's "pay half your LP; destroy and banish every other card, then Summon from the Deck and raise its Level" (§1).
- **The Dark Magician half is where Academy is.** Dark Magician, Dark Magician Girl and Dark Magician the Dragon Knight are scripted & automatic; Dark Paladin, Magician's Rod and Dark Magical Curtain are partial. 37 of the 84 cards are also in the Dark Magician Light and Darkness Ritual note's sample, which is Atem's target.
- **13 cards are in the Main or Extra Deck of all three lists.** Of those, 4 are partial (Ash Blossom, Droll & Lock Bird, Mulcharmy Fuwalos, Dark Paladin) and 9 are absent: Dark Magician Girl the Magician's Apprentice, Future Silence, Gandora-G the Dragon of Destruction, Shining Sarcophagus, The Gaze of Timaeus, Dark Magician of Destruction, I:P Masquerena, S:P Little Knight, W:P Fancy Ball.
- **Shared staples.** Of the 84 cards, **46 were already audited** in at least one of the 14 archetypes of the three earlier notes; the other **38 are new to the audits** (3 of them present in `cards.ts`: Dark Magician Girl, Dark Magic Attack, Dark Magician the Dragon Knight). The top of the ranking is the usual one: Ash Blossom, Droll & Lock Bird, Ghost Ogre and Mulcharmy Fuwalos (Partial) and Mulcharmy Purulia (Absent) are in all 14 archetypes and here (§3). 11 cards are also in this round's other note, [umi-beyond-the-brave-coverage-2026-11.md](./umi-beyond-the-brave-coverage-2026-11.md): all generic staples.

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026". Its newly Forbidden cards include Magicians' Souls, Red-Eyes Dark Dragoon, Albion the Branded Dragon, Azamina Ilia Silvia, Charmer Quartet in Bloom, Cross-Sheep, Zenna's Deceiving Doll Maidens, Crystal Wing Synchro Dragon and Secret Village of the Spellcasters; Griffoh became Limited.

The sources were tried in the owner's order:

1. **Recent tournament lists: none legal.**
   - YGOPRODeck `getDecks.php?name=Shining Sarcophagus&_sft_category=Tournament Meta Decks` (and `name=Sarcophagus`) returned 20 TCG records from May 2024 to **October 10, 2026**; the newest is [738229, Louisville WCQ Regional, October 10, Top 8](https://ygoprodeck.com/deck/shining-sarcophagus-dark-magician-light-and-darkness-ritual-738229). The recent scan of 520 Tournament Meta Deck records (offsets 0–500; events September 26 – November 22, 2026, 423 of them on or after October 19) was searched by the passcodes of Shining Sarcophagus (79791878), Gandora-G (2333466) and Dark Magician Girl the Magician's Apprentice (2501624): **only 738229 plays any of them.**
   - The nine newest of those records (May 9 – October 10, 2026) all **fail** the October 19 list: each plays between 4 and 11 Forbidden cards or over-limit copies (for example 738229: Magicians' Souls, Called by the Grave, Albion, 2 Red-Eyes Dark Dragoon, Zenna's, Charmer Quartet, Cross-Sheep, 3 Secret Village, 3 Griffoh, 2 Droll & Lock Bird). The three Genesys-format records (Olathe, Paris, Spanish Fork) are another format and also fail it (Magicians' Souls, Aerial Eater, Varudras, Crystal Wing).
   - [Yugiohmeta.com](https://www.yugiohmeta.com/tier-list/deck-types/Shining%20Sarcophagus)'s API returned 837 top decks created October 24 – November 22, 2026. Three play Shining Sarcophagus, and all three are **OCG** community events (POI CS #20, October 24; Azara CS Nagoya #5, October 25; Dragon Star Shop Tournament, November 14), each with Maxx "C", Magicians' Souls and Red-Eyes Dark Dragoon, which are Forbidden in the TCG. Its "Shining Sarcophagus" deck type itself has three tops, the newest from May 2025.
2. **Lists by pros: none found.** No TCG article or pro deck profile of Shining Sarcophagus dated after October 19 was found by web search (TCGplayer, YGOrganization, Konami's database).
3. **Deck guides: none legal.** [Dueling Nexus, "Shining Sarcophagus Deck 2026"](https://duelingnexus.com/blog/shining-sarcophagus-deck-2026/) (a user deck by DK1102, "2026.10 OCG" banlist, last updated October 11) plays Magicians' Souls, Maxx "C", Triple Tactics Talent, Crossout Designator, Red-Eyes Dark Dragoon and Charmer Quartet in Bloom. A [Konami card-database user deck "Shining Sarcophagus"](https://www.db.yugioh-card.com/yugiohdb/member_deck.action?cgid=8b43eb1bd921be9fc401d998086ed29e&dno=74&request_locale=en) plays Dimension Shifter, Called by the Grave, There Can Be Only One and Crystal Wing Synchro Dragon. Neither is legal.
4. **Other builds: three selected.** YGOPRODeck user decks of every category were read for `name=Dark Magician`, `Magician`, `Yugi`, `Sarc`, `Sarcophagus`, `Silent Magician` and `Gandora` back to deck number 740000 (about October 19), and every deck containing Shining Sarcophagus was screened: 16 decks posted from about October 19 on (Master Duel, Domain-format and OCG decks excluded). Eleven pass the Forbidden & Limited screen; one of those (743569) fails on release legality. The three selected are those whose Main Deck plays the whole engine (Shining Sarcophagus, the Apprentice, Gandora-G, Future Silence) with a complete Extra and Side Deck:
   - **S1** [Shining Sarc Orcust (October 2026)](https://ygoprodeck.com/deck/shining-sarc-orcust-october-2026-740291): category "Meta Decks", published 2026-10-23; 40 Main / 15 Extra / 15 Side. Kind: **other build (community, labelled meta by its author)**, an Orcust hybrid like the spring 2026 Shining Sarcophagus Orcust tops.
   - **S2** [Dark Magician](https://ygoprodeck.com/deck/dark-magician-741401): category "Non-Meta Decks", published 2026-10-28; 45 Main / 15 Extra / 15 Side. Kind: **deck guide (community)**: the record carries the author's written guide ("Core Strategy", "Key Interactions & Combos", a section on "Shining Sarcophagus & Retrained Synergy" and the reasons for its card count). Not a pro.
   - **S3** [Shinig sarc x DM](https://ygoprodeck.com/deck/shinig-sarc-x-dm-744461): category "Non-Meta Decks", published 2026-11-13, updated 2026-11-15; 46 Main / 15 Extra / 15 Side. Kind: **other build (community)**, the only one with 3 Shining Sarcophagus.
   - Legal but not selected: [744918](https://ygoprodeck.com/deck/dark-magician-magia-744918) (Dark Magician Magia, 2 Shining Sarcophagus, close to S2), [744458](https://ygoprodeck.com/deck/rolad-sarcophagus-shinning-744458) ("Meta Decks", 1 Shining Sarcophagus, 11-card Extra Deck, no Side Deck), [743645](https://ygoprodeck.com/deck/casual-dark-magician-girls-743645) (Fun/Casual, no Side Deck), [743375](https://ygoprodeck.com/deck/dark-magician-azamina-743375), [742434](https://ygoprodeck.com/deck/azamina-magician-742434) and [742017](https://ygoprodeck.com/deck/rolling-magician-742017) (1–2 Shining Sarcophagus, no Side Deck), [740900](https://ygoprodeck.com/deck/magician-deck-but-bad-740900) (58 cards; titled "magician deck but bad"). [743569 Shining Sarc X Yugi Deck](https://ygoprodeck.com/deck/shining-sarc-x-yugi-deck-743569), the only pure Shining Sarcophagus build and the most Yugi-like, is **not TCG-legal**: it plays three OCG-only cards (Gandora-X the Blackmetal Rampaging Dragon, Gigarays Gandora the Dragon of Destruction, Silent Magician, the Silent Fighter) and has a 1-card Extra Deck.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited). **All three selected lists pass**: none plays a Forbidden card or exceeds a limit, and no card exceeds 3 copies. Cards on the list that appear here, always within limit: Limited, 1 copy: Droll & Lock Bird (all three), Foolish Burial and Solemn Judgment (S1). Every card has a TCG release date in YGOPRODeck's card data. This does not certify region legality. No list has unrevealed `???` slots.

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition. "Absent — data only" remains Absent in totals (none occurs here).
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 14 of the 84 names matched, and all 14 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2` = S1/S2/S3). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the earlier notes for the 46 cards they already audited. The 38 cards new to the audits were tagged here by reading each fetched text, with the Step taken from the highest step its needs require (the key below); the three present ones were checked against the code. `script` means card scripting **after its listed shared engine work exists**. `card-deep` flags work beyond the original plan (columns, monsters-as-backrow and the reverse, control vs ownership, Tokens, counters, monsters as Equips, dice).
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts test/engine-chain.test.ts test/engine-masters.test.ts` in `packages/cards` gave 7 files and 129 tests passed. The tests cited in the Notes pass, but they do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What is in Academy for this deck

- **Scripted & automatic:** Dark Magician (`cards.ts:93`; S2, S3), Dark Magician Girl (`cards.ts:208`; S2), Dark Magician the Dragon Knight (`cards.ts:230`; Extra Deck of S2, S3), Dark Magic Attack (`cards.ts:253`; S2 Side), Foolish Burial (`cards.ts:331`; S1). Dark Magician Girl, Dark Magician the Dragon Knight and Dark Magic Attack are new to the audits; their Notes in §4 give the code and tests.
- **Partial**, with the earlier notes' verdicts: Dark Paladin (Extra Deck of all three), Magician's Rod (S2), Dark Magical Curtain (S2, S3), Solemn Strike (S1 Side), and the staple hand traps.
- **The Shining Sarcophagus engine is absent**, and these are the mechanics it needs against today's code:
  1. **"A card that mentions Shining Sarcophagus."** Shining Sarcophagus searches one; Future Silence searches a monster that mentions it; Gandora-G Summons one from the Deck; the Apprentice gains ATK per one in the GYs. The predicate exists (`mentions`, `catalogue.ts:504`) but data-written cards cannot filter on it (`CardFilter`, `catalogue.ts:166-192`).
  2. **A Continuous Spell that acts.** Shining Sarcophagus has a Main Phase search and a trigger when the opponent Special Summons from the GY (cost: discard a Spell), and cannot be destroyed by monster effects. Academy's Continuous Spells are fixed effect types (`catalogue.ts:144-149`); data effects on Spells only work from the GY (`catalogue.ts:497-498`).
  3. **Names that change in one way only.** Dark Magician the Magician of Black Magic is "Dark Magician" *on the field* only; the Apprentice becomes "Dark Magician Girl" only when Summoned by its own discard procedure. Academy's `nameAs` is always on, on the field and in the GY (`catalogue.ts:453`, `:508`).
  4. **Gandora-G:** ATK per banished card, a self-Summon while you control Shining Sarcophagus, and "pay half your LP; destroy as many other cards on the field as possible, and if you do, banish them, then Special Summon 1 Level 7 or lower monster that mentions "Shining Sarcophagus" from your Deck, and increase its Level". Academy has `half-lp` only as a Spell cost (`catalogue.ts:484`) and no Level change (Synchro and Xyz read the printed `level`, `engine.ts:2162-2166`).
- **Not in these lists:** the other Yugi cards Academy has scripted for Yugi's deck (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:54-58`), for example Thousand Knives, Sage's Stone, Dark Burning Attack, Magician's Valkyria and the Magnet Warriors, appear in **none** of the three lists. The classic Shining Sarcophagus monsters (Gadget Trio, Silent Magician Zero, Silent Swordsman Zero, Moremarshmallon, Stronghold the Hidden Fortress, Turn Silence, Ties That Bind) are also in none of them; only Archfiend's Advent appears (S3 Side).

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot. Yugi's deck in the app is Academy's own and is not any of these lists; no live deck was changed.

### Mechanism key (ours, from the main note)

| Code | Required mechanism / extension | Plan step | Repo evidence for current boundary |
| --- | --- | --- | --- |
| CHAIN / HAND | Full fast-effect priority, legal origins, activation vs effect negation, arbitrary responses | 1 | `engine.ts:1277-1299`, `:1482-1533`, `:2631` |
| TRIG / LOCK | General event provenance, simultaneous triggers, delayed effects, turn/Duel restrictions | 2 | `catalogue.ts:231-283`; `engine.ts:1234-1242` |
| VOCAB / GY / BANISH | Multi-choice actions, costs, filters (including "a card that mentions X" and names that change by location), return/banish/Set, effects in GY/banishment | 3 | `catalogue.ts:166-283`, `effects.ts:46-59` |
| CONT | Activated/continuous Field and Continuous Spell/Trap effects | 3 | `catalogue.ts:45-163`, `:489-499` |
| RITUAL / FUS-EFF | General Ritual tributes and GY banish; Fusion by effect from Deck/GY/opponent field | 3 | `catalogue.ts:140-143` |
| FUS-MAT / SYN / XYZ / LINK / PEND | Material predicates, alternate procedures, material transfer, proper summon, arrow/scale effects | 4 | `catalogue.ts:337-342`, `:390-407`; `engine.ts:2081-2202` |
| ZONE / MONSPELL / CONTROL | Columns/centre/Extra Monster Zone conditions, linked status, monsters as backrow (and Traps that become monsters), control vs ownership and opponent's cards | Beyond original plan; add to 3/4 | `engine.ts:1628` explicitly omits columns; `catalogue.ts:199-230` actions lack these |
| TOKEN / CTR / EQ-MON / DICE | Token identity, counters, monsters as Equips, dice | Beyond original plan | `catalogue.ts:199-230`, `:372-475`; no general facilities of these kinds |

SYN, PEND, TOON, MONSPELL, EQ-MON and DICE do not occur here. Among the 79 cards still to build, the most frequent needs are VOCAB (70), CHAIN (42), TRIG (41), GY (25), LOCK (21), BANISH (17).

## 2. Coverage (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Shining Sarcophagus (community builds) | 3 | 66 | 4 | 8 | 54 | 6% | 18% | 18 | 5 / 9 / 70 of 84 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): S1 33 cards, 1 automatic, 5 partial, 11 of 55 copies; S2 41 cards, 3 automatic, 7 partial, 20 of 60 copies; S3 35 cards, 2 automatic, 6 partial, 16 of 61 copies. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started.

## 3. Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side)

"Of the 14" counts archetypes in the earlier notes' samples: the main note's 11 (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there), Blue-Eyes and Dark Time Wizard, and Dark Magician Light and Darkness Ritual. Every card here is also played by this deck. Ranked by that count, then by name. Below the generic staples, most rows are the Dark Magician package shared only with the Dark Magician note.

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | 12 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | S:P Little Knight | 11 | Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 8 | Skull Meister | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 9 | Typhoon | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 10 | Evenly Matched | 7 | Toon, Artmage, Radiant Typhoon, Branded Dracotail, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 11 | Solemn Judgment | 7 | Elfnote, Toon, Unchained, Sky Striker, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 12 | Cosmic Cyclone | 6 | Sky Striker, Branded Dracotail, Branded, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 13 | Infinite Impermanence | 6 | Angelechy, Elfnote, Toon, Branded, Blue-Eyes, Dark Time Wizard | Partial | ZONE | beyond plan | card-deep |
| 14 | Super Starslayer TY-PHON - Sky Crisis | 6 | Toon, Unchained, Radiant Typhoon, Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | LOCK, VOCAB, XYZ | Step 4 | script |
| 15 | Dominus Impulse | 5 | Angelechy, Toon, Unchained, Sky Striker, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 16 | I:P Masquerena | 5 | Toon, Artmage, Light and Darkness Ritual, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 17 | Accesscode Talker | 4 | Toon, Light and Darkness Ritual, Sky Striker, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 18 | Dominus Spark | 4 | Angelechy, Toon, Branded, Blue-Eyes | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 19 | Number 90: Galaxy-Eyes Photon Lord | 4 | Elfnote, Artmage, Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |
| 20 | Forbidden Droplet | 3 | Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 21 | Ghost Belle & Haunted Mansion | 3 | Sacred Beast, Blue-Eyes, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 22 | Lava Golem | 3 | Radiant Typhoon, Sky Striker, Branded | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |
| 23 | Radiant Typhoon Vision | 3 | Radiant Typhoon, Sky Striker, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 24 | Triple Tactics Thrust | 3 | Unchained, Sky Striker, Dark Time Wizard | Absent | VOCAB | Step 3 | script |
| 25 | Cyberse Contract Witch | 2 | Sacred Beast, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |
| 26 | Dark Magical Curtain | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Partial | — | — | data |
| 27 | Dark Magician of Destruction | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 28 | Kuriboh - Multiply! | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 29 | Mulcharmy Meowls | 2 | Light and Darkness Ritual, Blue-Eyes | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |
| 30 | Selene, Queen of the Master Magicians | 2 | Toon, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |
| 31 | Solemn Strike | 2 | Sky Striker, Dark Time Wizard | Partial | CHAIN | Step 1 | script |
| 32 | Underworld Goddess of the Closed World | 2 | Unchained, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 33 | Dark Magical Circle | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, BANISH, CONT | Step 3 | script |
| 34 | Dark Magician | 1 | Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 35 | Dark Magician, the Pharaoh's Servant | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 36 | Dark Paladin | 1 | Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 37 | Foolish Burial | 1 | Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 38 | Illusion of Chaos | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB, GY, RITUAL | Step 3 | script |
| 39 | Magician of Black Chaos MAX | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |
| 40 | Magician's Rod | 1 | Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG, GY | Step 3 | script |
| 41 | Master of Chaos | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |
| 42 | Secrets of Dark Magic | 1 | Dark Magician Light and Darkness Ritual | Absent | VOCAB, RITUAL, FUS-EFF | Step 3 | script |
| 43 | Soul Servant | 1 | Dark Magician Light and Darkness Ritual | Absent | VOCAB, GY, BANISH | Step 3 | script |
| 44 | The Gaze of Timaeus | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF | Step 3 | script |
| 45 | Timaeus the United Magical Dragon | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 46 | W:P Fancy Ball | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB, BANISH, LINK, CONTROL | Step 4 + beyond plan | card-deep |

**Shared with this round's Umi note (11 cards):** Ash Blossom & Joyous Spring, Dominus Impulse, Droll & Lock Bird, Ghost Ogre & Snow Rabbit, Infinite Impermanence, Mulcharmy Fuwalos, Mulcharmy Purulia, Nibiru, the Primal Being, S:P Little Knight, Skull Meister, Typhoon.

**New to the audits (38 cards):** the Shining Sarcophagus engine (Shining Sarcophagus, Dark Magician Girl the Magician's Apprentice, Gandora-G, Future Silence, Dark Magician the Magician of Black Magic, Archfiend's Advent); Dark Magician cards the earlier lists did not play (Dark Magician Girl, Dark Magician the Dragon Knight, Dark Magic Attack, Magician of Chaos, Chaos Form, Eternal Soul, Magician's Salvation, Magicians' Combination, The Dark Magicians, Dark Cavalry, Quintet Magician, Sorcerer of Dark Magic, Dyna Mondo, Destined Rivals); S1's Orcust package (Orcust and World Legacy monsters, Orcustrated Babel, Orcust Crescendo, Galatea, Galatea-I, Longirsu, Enlilgirsu, Dingirsu, The Zombie Vampire); and Side Deck cards (Dark Ruler No More, Eradicator Epidemic Virus, Spellbound, Red-Eyes Flare Metal Dragon).

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

Lists (YGOPRODeck user decks, TCG format; none has a tournament result):

1. [Shining Sarc Orcust (October 2026)](https://ygoprodeck.com/deck/shining-sarc-orcust-october-2026-740291): published 2026-10-23, category "Meta Decks"; **other build (community)**; 40 Main / 15 Extra / 15 Side.
2. [Dark Magician](https://ygoprodeck.com/deck/dark-magician-741401): published 2026-10-28, category "Non-Meta Decks"; **deck guide (community)**; 45 Main / 15 Extra / 15 Side.
3. [Shinig sarc x DM](https://ygoprodeck.com/deck/shinig-sarc-x-dm-744461): published 2026-11-13, updated 2026-11-15, category "Non-Meta Decks"; **other build (community)**; 46 Main / 15 Extra / 15 Side.

| Card | Copies (S1/S2/S3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Dark Magician | 0/1/1 | Scripted & automatic | — | — | — | Normal Monster, printed 2500/2100 Level 7 (`cards.ts:93`; printed facts `card-art.ts:72`). |
| Dark Magician Girl | 0/1/0 | Scripted & automatic | — | — | — | `gains: in-graveyards` of Dark Magician and Magician of Black Chaos (`cards.ts:208`), counted in both GYs through `named` (`engine.ts:524`, `catalogue.ts:508`), so Dark Magician the Dragon Knight and other `nameAs` cards count. Tested at `packages/cards/test/engine-masters.test.ts:120`. |
| Foolish Burial | 1/0/0 | Scripted & automatic | — | — | — | Data `mill` of any monster (`cards.ts:331`), resolved at `engine.ts:1058-1065`; Ash sees it as `mill` (`effects.ts:49`, `:67`). Tested at `packages/cards/test/engine-effects.test.ts:29-30`. |
| Dark Magician the Dragon Knight | 0/1/1 (extra) | Scripted & automatic | — | — | — | Fusion of Dark Magician + 1 Dragon, `nameAs: "dark-magician"`, `guardsBackrow` (`cards.ts:230`; `engine.ts:2309-2316`, `:1872`). Academy has no effect that targets a Spell/Trap, so the "cannot target" half has nothing to stop. Tested at `packages/cards/test/engine-extra.test.ts:22-27`. |
| Dark Magic Attack | 0/1/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe`, `needs: "dark-magician"` (`cards.ts:253`), checked through `controls`/`named` (`engine.ts:1822`, `:646-648`). Tested at `packages/cards/test/engine-set.test.ts:145-146`. |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Dark Magical Curtain | 0/3/3 | Partial | — | — | data | `curtain` (`cards.ts:250`, resolved at `engine.ts:2542-2567`): each player Special Summons 1 DARK Spellcaster from the hand or Deck, then Dark Magician or Dark Magician Girl adds a Spell/Trap that mentions "Dark Magician" (`mentions`, `catalogue.ts:504`); once per turn, a free Quick-Play (`engine.ts:563`). Missing: the engine chooses both players' monsters and the added card (`engine.ts:2526-2540`, `:2562`), so neither "can" is a choice; "neither player can activate their effects this turn" is not applied. Tested at `packages/cards/test/engine-set.test.ts:122-130` and `engine-open.test.ts:22-50`. Tags kept from the main note (see §5). |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 2/0/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 0/3/0 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Magician's Rod | 0/3/0 | Partial | CHAIN, TRIG, GY | Step 3 | script | `summonSearch: "Dark Magician"` (`cards.ts:362`): after its Normal Summon (`engine.ts:1998`) add 1 Spell/Trap whose printed text quotes "Dark Magician" (`engine.ts:2001-2018`, `mentions` at `catalogue.ts:504`), once per turn. Missing: the GY effect (on the opponent's turn, when you activate a Spell/Trap, Tribute a Spellcaster to add it back). Tested at `packages/cards/test/engine-hand.test.ts:136-170`. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Dark Paladin | 1/1/1 (extra) | Partial | CHAIN | Step 1 | script | `cards.ts:229`: Fusion of `dark-magician` + `buster-blader`; `all-dragons` gain counts Dragons on both fields and in both GYs (`engine.ts:526-530`); `negate-spell` discards 1 card, negates and destroys the Spell (`engine.ts:2469-2493`). Missing: it only answers the opponent's pending Spell (`engine.ts:2471`, `:2361`), not a Spell its own controller activates, and only inside the one-answer model. Tested at `packages/cards/test/engine-extra.test.ts:43-48`. In these lists it is summoned by The Gaze of Timaeus or Secrets of Dark Magic (both absent), not Polymerization. |
| Solemn Strike | 2/0/0 (side) | Partial | CHAIN | Step 1 | script | Counter Trap, Spell Speed 3, negates a monster effect (`cards.ts:358`, `engine.ts:1463-1467`); the "would be Special Summoned" half is missing. |
| Chaos Form | 0/1/0 | Absent | VOCAB, GY, BANISH, RITUAL | Step 3 | script | Any "Chaos"/"Black Luster Soldier" Ritual Monster; may banish Dark Magician from the GY as Levels. |
| Dark Magical Circle | 0/1/0 | Absent | TRIG, VOCAB, BANISH, CONT | Step 3 | script | Look at the top 3 and reorder; banish trigger when Dark Magician is Summoned. |
| Dark Magician Girl the Magician's Apprentice | 3/3/3 | Absent | TRIG, VOCAB | Step 3 | script | Discard-cost self Summon that renames it "Dark Magician Girl"; searches Shining Sarcophagus; ATK by monsters that mention it. |
| Dark Magician the Magician of Black Magic | 0/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script | Name "Dark Magician" on the field only (Academy's `nameAs` holds on the field and in the GY, `catalogue.ts:453`); Sets a Spell/Trap that mentions Dark Magician from the Deck. |
| Dark Magician, the Pharaoh's Servant | 0/3/3 | Absent | CHAIN, VOCAB | Step 3 | script | Name becomes "Dark Magician" on the field and in the GY: Academy's `nameAs` (`catalogue.ts:453`, read by `named` at `:508`) applies in every location, so it would need a location condition; reveal cost; Set from Deck; Quick Effect with a discard cost. |
| Dominus Impulse | 3/0/0 | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dominus Spark | 2/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Eternal Soul | 0/1/1 | Absent | TRIG, VOCAB, GY, CONT | Step 3 | script | Continuous Trap: unaffected Dark Magician; leave-field wipe. |
| Forbidden Droplet | 2/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Future Silence | 2/1/3 | Absent | VOCAB | Step 3 | script | Search by "mentions"; Battle Phase draw-to-6 branch. |
| Gandora-G the Dragon of Destruction | 1/1/1 | Absent | VOCAB, BANISH | Step 3 | script | Pay half LP; destroy and banish every other card; Special Summon from the Deck and raise its Level. |
| Girsu, the Orcust Mekk-Knight | 3/0/0 | Absent | TRIG, VOCAB, ZONE, CONTROL, TOKEN | Step 3 + beyond plan | card-deep | Column condition; a Token on each player's field. |
| Illusion of Chaos | 0/3/3 | Absent | CHAIN, VOCAB, GY, RITUAL | Step 3 | script |  |
| Kuriboh - Multiply! | 0/0/1 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Magician of Black Chaos MAX | 0/1/0 | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |  |
| Magician of Chaos | 0/1/1 | Absent | CHAIN, TRIG, VOCAB, RITUAL | Step 3 | script | Name "Dark Magician" on the field and in the GY (matches `nameAs`, `catalogue.ts:453`). |
| Magician's Salvation | 0/1/1 | Absent | TRIG, VOCAB, GY, CONT | Step 3 | script | Sets Eternal Soul from the Deck. |
| Magicians' Combination | 0/1/0 | Absent | CHAIN, TRIG, VOCAB, GY, CONT | Step 3 | script |  |
| Nibiru, the Primal Being | 2/2/1 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Orcust Crescendo | 1/0/0 | Absent | CHAIN, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Orcust Cymbal Skeleton | 2/0/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script | Lock by Attribute (DARK); Academy's `lock` is by Type (`catalogue.ts:223`). |
| Orcust Harp Horror | 3/0/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script | As Cymbal Skeleton. |
| Orcust Knightmare | 2/0/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Orcustrated Babel | 1/0/0 | Absent | CHAIN, VOCAB, GY, CONT | Step 3 | script | Turns GY effects into Quick Effects. |
| Radiant Typhoon Vision | 0/0/3 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Secrets of Dark Magic | 0/1/3 | Absent | VOCAB, RITUAL, FUS-EFF | Step 3 | script | A choice of a Fusion Summon or a Ritual Summon, each including Dark Magician or Dark Magician Girl. |
| Shining Sarcophagus | 2/2/3 | Absent | TRIG, VOCAB, CONT | Step 3 | script | Continuous Spell: search by "mentions"; trigger on the opponent's Special Summon from the GY with a Spell-discard cost; cannot be destroyed by monster effects. |
| Soul Servant | 0/1/3 | Absent | VOCAB, GY, BANISH | Step 3 | script | Places a card on top of the Deck. |
| The Gaze of Timaeus | 1/2/2 | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF | Step 3 | script | Fusion Summon by shuffling one named material from field or GY; delayed banish. |
| World Legacy - "World Crown" | 1/0/0 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script | Special Summon to a pointed zone (`to: "pointed"` exists, `catalogue.ts:203`). |
| World Legacy - "World Wand" | 1/0/0 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Accesscode Talker | 0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Cyberse Contract Witch | 0/1/0 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Dark Cavalry | 0/0/1 (extra) | Absent | CHAIN, VOCAB, FUS-MAT | Step 4 | script |  |
| Dark Magician of Destruction | 1/1/2 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Dingirsu, the Orcust of the Evening Star | 2/0/0 (extra) | Absent | TRIG, VOCAB, BANISH, XYZ | Step 4 | script | Alternative Xyz with a Link Monster; destruction replacement. |
| Dyna Mondo | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Enlilgirsu, the Orcust Mekk-Knight | 1/0/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, LINK, ZONE, CONTROL | Step 4 + beyond plan | card-deep | Takes control; Extra Monster Zone condition. |
| Galatea, the Orcust Automaton | 2/0/0 (extra) | Absent | VOCAB, BANISH, LINK, ZONE | Step 4 + beyond plan | card-deep | "This linked card"; Sets an "Orcust" Spell/Trap from the Deck. |
| Galatea-I, the Orcust Automaton | 2/0/0 (extra) | Absent | LOCK, VOCAB, GY, BANISH, LINK | Step 4 | script |  |
| I:P Masquerena | 1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Longirsu, the Orcust Orchestrator | 1/0/0 (extra) | Absent | VOCAB, BANISH, LINK, ZONE | Step 4 + beyond plan | card-deep | Linked conditions. |
| Master of Chaos | 0/1/1 (extra) | Absent | TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Number 90: Galaxy-Eyes Photon Lord | 1/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Quintet Magician | 0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script | "5 Spellcaster monsters with different names". |
| Red-Eyes Flare Metal Dragon | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| S:P Little Knight | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Selene, Queen of the Master Magicians | 0/1/0 (extra) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/1/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| The Dark Magicians | 0/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| The Zombie Vampire | 1/0/0 (extra) | Absent | VOCAB, GY, XYZ, CONTROL | Step 4 + beyond plan | card-deep | Uses opponent-owned monsters as Level 8; Special Summons from either GY. |
| Timaeus the United Magical Dragon | 0/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Underworld Goddess of the Closed World | 0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| W:P Fancy Ball | 1/1/1 (extra) | Absent | CHAIN, VOCAB, BANISH, LINK, CONTROL | Step 4 + beyond plan | card-deep | Link Summons using a monster the opponent controls. |
| Archfiend's Advent | 0/0/1 (side) | Absent | TRIG, VOCAB, CONTROL | Step 3 + beyond plan | card-deep | Takes control of an opponent's monster until the End Phase. |
| Cosmic Cyclone | 3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Dark Ruler No More | 2/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Destined Rivals | 0/0/1 (side) | Absent | VOCAB | Step 3 | script | Negates every face-up opponent monster if you control Blue-Eyes White Dragon or Dark Magician. |
| Eradicator Epidemic Virus | 0/3/0 (side) | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Declares a card type; checks draws over three turns. |
| Evenly Matched | 0/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 0/2/3 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Lava Golem | 0/0/3 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Mulcharmy Meowls | 0/3/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Mulcharmy Purulia | 0/3/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Skull Meister | 2/0/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Judgment | 1/0/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Sorcerer of Dark Magic | 0/1/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Spellbound | 0/0/3 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Triple Tactics Thrust | 0/2/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Typhoon | 3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

## 5. Unverified, exclusions and interpretation limits

1. **The pool rests on the owner's last fallback.** No Shining Sarcophagus list from a tournament, a pro or a published guide is legal under the October 19 list (§0). The three lists are community builds with no result. If the owner prefers a list with a result, the nearest is [738229](https://ygoprodeck.com/deck/shining-sarcophagus-dark-magician-light-and-darkness-ritual-738229) (Louisville, October 10, Top 8), which is **illegal now** (ten violations) and would have to be rebuilt; this note does not rebuild lists.
2. **Search coverage.** YGOPRODeck user decks are many; the read covered the listed names back to about October 19, not every deck. A legal build named without any of those words would be missed. Web searches found no TCG pro list or post-October-19 guide; a video deck profile would not be found that way.
3. **Hybrids, not the pure deck.** All three lists splash the Shining Sarcophagus engine into Dark Magician (S2, S3) or Orcust (S1), like every Shining Sarcophagus tournament top since 2026. The pure "Silent Magician / Gadget" build that matches Yugi's anime cards best exists only as 743569, which is not TCG-legal.
4. **Per-card mechanism tags are triage (ours).** The 46 cards already audited keep their earlier tags verbatim, including the main note's acknowledged keyword-assisted over- and under-tagging. The 38 new tags were assigned by reading each text. Judgment calls: a "card that mentions X" filter, a name that changes only on the field and Gandora-G's Level increase are tagged VOCAB; Archfiend's Advent's and Enlilgirsu's control changes, The Zombie Vampire's opponent-owned materials and Girsu's Token on the opponent's field are tagged CONTROL; "linked", column and Extra Monster Zone conditions are tagged ZONE.
5. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§0, "Reading the audit"), but no new conformance tests were written. Dark Magician the Dragon Knight is Scripted & automatic because Academy has no effect that targets a Spell or Trap; once one exists, its "cannot target" half needs a rule. Scripted & automatic is an operational classification, not certification against every Konami ruling.
6. **Card API normalization:** every passcode of the three lists resolved through `card_images` to an English name, with no unknown IDs. Every card has a TCG release date; 743569's three OCG-only cards have none.
7. **Source independence:** deck records are user submissions; their publication dates are the pages' `datePublished` fields. Author names are not reproduced here.
8. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-23.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column and "New" remarks; 256 entries parsed); [card-database user deck](https://www.db.yugioh-card.com/yugiohdb/member_deck.action?cgid=8b43eb1bd921be9fc401d998086ed29e&dno=74&request_locale=en) (checked, not selected).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); `getDecks.php?name=<name>&_sft_category=Tournament%20Meta%20Decks` for `Shining Sarcophagus` and `Sarcophagus`; the 520-record recent scan without `name` (`offset=0,20,…,500`); `getDecks.php?name=<name>&offset=…` without a category for `Shining Sarcophagus`, `Sarcophagus`, `Sarc`, `Dark Magician`, `Magician`, `Yugi`, `Silent Magician`, `Gandora`; card API `cardinfo.php?id=<passcodes>&misc=yes` in batches (TCG dates from `misc_info`); the selected decks' pages for `datePublished`/`dateModified`. Appendix A links each name to an exact-name query.
- Yugiohmeta.com: `https://www.yugiohmeta.com/api/v1/deck-types?name=Shining%20Sarcophagus`, `…/top-decks?deckType=<id>` and `…/top-decks?created[$gte]=2026-10-19&limit=1000`.
- Dueling Nexus: [Shining Sarcophagus Deck 2026](https://duelingnexus.com/blog/shining-sarcophagus-deck-2026/) (checked, not selected). No downloaded content was executed.
- Repo primary sources: `packages/engine/src/{engine,catalogue,effects,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, the tests listed in "Reading the audit", and Yugi's deck `apps/academy-ygo/src/lib/junior/play/master-decks.ts:54-58`. The earlier notes' tags were read from their §4 tables.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first finish the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For this deck specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note: general priority and response origins, event batches, turn restrictions | Ash, Droll, Ogre, Fuwalos; Dark Paladin's negation of any Spell; Dark Magical Curtain's restriction; Solemn Strike's Summon half | Purulia, Nibiru (after Tokens) |
| 1 | Step 3 vocabulary: a "mentions [card]" filter in `CardFilter`; Continuous Spells with ignition and trigger effects; names that change on the field only, or after a given Summon; a self-Summon by discarding | **The Shining Sarcophagus engine:** Shining Sarcophagus, Dark Magician Girl the Magician's Apprentice, Future Silence (all three lists), Dark Magician the Magician of Black Magic (S2, S3) | 4 cards; the Dark Magician note's Priority 1 is the same filter |
| 2 | Step 3 "pay half your LP" as a monster cost, mass destroy-and-banish, Level increase, ATK per banished card | Gandora-G the Dragon of Destruction (all three) | 1 card |
| 3 | The Dark Magician core of the Dark Magician note (its Priorities 1–3) | Pharaoh's Servant, Illusion of Chaos, Secrets of Dark Magic, The Gaze of Timaeus, Soul Servant; Dark Magician of Destruction, Master of Chaos, Timaeus (S2, S3) | Shared with Atem's target |
| 4 | Step 4 Link toolbox | I:P Masquerena, S:P Little Knight (all three); W:P Fancy Ball (all three, `card-deep`) | Per card |
| 5 | The Orcust package | S1 only | Only if that variant is wanted |

**For Yugi, the realistic target is S2 or S3 with the four-card engine.** Their Dark Magician half is the Dark Magician note's work, and the Shining Sarcophagus engine adds four cards whose needs are mostly Step 3 vocabulary. Of the 11 `card-deep` cards (Infinite Impermanence, Girsu, the Orcust Mekk-Knight, Nibiru, the Primal Being, Enlilgirsu, the Orcust Mekk-Knight, Galatea, the Orcust Automaton, Longirsu, the Orcust Orchestrator, Selene, Queen of the Master Magicians, The Zombie Vampire, W:P Fancy Ball, Archfiend's Advent, Lava Golem), only W:P Fancy Ball is in the Main or Extra Deck of all three lists. Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for S1 … S3, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Shining Sarcophagus — zone inventory

| Card / API text | API type | S1 M/E/S | S2 M/E/S | S3 M/E/S |
| --- | --- | --- | --- | --- |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Archfiend's Advent](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Archfiend%27s%20Advent) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/1 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Chaos Form](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Form) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 |
| [Cyberse Contract Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cyberse%20Contract%20Witch) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Dark Cavalry](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Cavalry) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Dark Magic Attack](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magic%20Attack) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Dark Magical Circle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Circle) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Dark Magical Curtain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Curtain) | Spell Card | 0/0/0 | 3/0/0 | 3/0/0 |
| [Dark Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician) | Normal Monster | 0/0/0 | 1/0/0 | 1/0/0 |
| [Dark Magician Girl](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20Girl) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [Dark Magician Girl the Magician's Apprentice](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20Girl%20the%20Magician%27s%20Apprentice) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dark Magician of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20of%20Destruction) | Fusion Monster | 0/1/0 | 0/1/0 | 0/2/0 |
| [Dark Magician the Dragon Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20the%20Dragon%20Knight) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Dark Magician the Magician of Black Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20the%20Magician%20of%20Black%20Magic) | Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 |
| [Dark Magician, the Pharaoh's Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%2C%20the%20Pharaoh%27s%20Servant) | Effect Monster | 0/0/0 | 3/0/0 | 3/0/0 |
| [Dark Paladin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Paladin) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Dark Ruler No More](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Ruler%20No%20More) | Spell Card | 0/0/2 | 0/0/0 | 0/0/0 |
| [Destined Rivals](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destined%20Rivals) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Dingirsu, the Orcust of the Evening Star](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dingirsu%2C%20the%20Orcust%20of%20the%20Evening%20Star) | XYZ Monster | 0/2/0 | 0/0/0 | 0/0/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 3/0/0 | 0/0/0 | 0/0/0 |
| [Dominus Spark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Spark) | Trap Card | 2/0/0 | 0/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dyna Mondo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dyna%20Mondo) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Enlilgirsu, the Orcust Mekk-Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Enlilgirsu%2C%20the%20Orcust%20Mekk-Knight) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Eradicator Epidemic Virus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Eradicator%20Epidemic%20Virus) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 |
| [Eternal Soul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Eternal%20Soul) | Trap Card | 0/0/0 | 1/0/0 | 1/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/0 | 0/0/3 |
| [Foolish Burial](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 2/0/0 | 0/0/0 | 0/0/0 |
| [Future Silence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Future%20Silence) | Spell Card | 2/0/0 | 1/0/0 | 3/0/0 |
| [Galatea, the Orcust Automaton](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Galatea%2C%20the%20Orcust%20Automaton) | Link Monster | 0/2/0 | 0/0/0 | 0/0/0 |
| [Galatea-I, the Orcust Automaton](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Galatea-I%2C%20the%20Orcust%20Automaton) | Link Monster | 0/2/0 | 0/0/0 | 0/0/0 |
| [Gandora-G the Dragon of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gandora-G%20the%20Dragon%20of%20Destruction) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/0 | 0/0/2 | 0/0/3 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 2/0/0 | 0/0/0 | 3/0/0 |
| [Girsu, the Orcust Mekk-Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Girsu%2C%20the%20Orcust%20Mekk-Knight) | Effect Monster | 3/0/0 | 0/0/0 | 0/0/0 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Illusion of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Illusion%20of%20Chaos) | Ritual Effect Monster | 0/0/0 | 3/0/0 | 3/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 0/0/0 | 3/0/0 | 0/0/0 |
| [Kuriboh - Multiply!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kuriboh%20-%20Multiply%21) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 |
| [Lava Golem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lava%20Golem) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Longirsu, the Orcust Orchestrator](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Longirsu%2C%20the%20Orcust%20Orchestrator) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Magician of Black Chaos MAX](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Black%20Chaos%20MAX) | Ritual Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [Magician of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Chaos) | Ritual Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 |
| [Magician's Rod](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%27s%20Rod) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/0 |
| [Magician's Salvation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%27s%20Salvation) | Spell Card | 0/0/0 | 1/0/0 | 1/0/0 |
| [Magicians' Combination](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magicians%27%20Combination) | Trap Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Master of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Master%20of%20Chaos) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Meowls](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Meowls) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/2 | 2/0/0 | 0/0/1 |
| [Number 90: Galaxy-Eyes Photon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2090%3A%20Galaxy-Eyes%20Photon%20Lord) | XYZ Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Orcust Crescendo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Orcust%20Crescendo) | Trap Card | 1/0/0 | 0/0/0 | 0/0/0 |
| [Orcust Cymbal Skeleton](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Orcust%20Cymbal%20Skeleton) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 |
| [Orcust Harp Horror](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Orcust%20Harp%20Horror) | Effect Monster | 3/0/0 | 0/0/0 | 0/0/0 |
| [Orcust Knightmare](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Orcust%20Knightmare) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 |
| [Orcustrated Babel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Orcustrated%20Babel) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 |
| [Quintet Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Quintet%20Magician) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Radiant Typhoon Vision](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Vision) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 |
| [Red-Eyes Flare Metal Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Red-Eyes%20Flare%20Metal%20Dragon) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Secrets of Dark Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Secrets%20of%20Dark%20Magic) | Spell Card | 0/0/0 | 1/0/0 | 3/0/0 |
| [Selene, Queen of the Master Magicians](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Selene%2C%20Queen%20of%20the%20Master%20Magicians) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Shining Sarcophagus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shining%20Sarcophagus) | Spell Card | 2/0/0 | 2/0/0 | 3/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/1 | 0/0/0 | 0/0/0 |
| [Solemn Strike](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Strike) | Trap Card | 0/0/2 | 0/0/0 | 0/0/0 |
| [Sorcerer of Dark Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sorcerer%20of%20Dark%20Magic) | Effect Monster | 0/0/0 | 0/0/1 | 0/0/0 |
| [Soul Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Soul%20Servant) | Spell Card | 0/0/0 | 1/0/0 | 3/0/0 |
| [Spellbound](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spellbound) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [The Dark Magicians](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dark%20Magicians) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [The Gaze of Timaeus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Gaze%20of%20Timaeus) | Spell Card | 1/0/0 | 2/0/0 | 2/0/0 |
| [The Zombie Vampire](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Zombie%20Vampire) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Timaeus the United Magical Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Timaeus%20the%20United%20Magical%20Dragon) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 0/0/0 | 0/0/2 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/0 | 0/0/0 |
| [Underworld Goddess of the Closed World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Underworld%20Goddess%20of%20the%20Closed%20World) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [W:P Fancy Ball](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=W%3AP%20Fancy%20Ball) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [World Legacy - "World Crown"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=World%20Legacy%20-%20%22World%20Crown%22) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 |
| [World Legacy - "World Wand"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=World%20Legacy%20-%20%22World%20Wand%22) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 |
