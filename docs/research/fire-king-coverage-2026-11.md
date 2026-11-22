# Fire King for Rex Raptor: lists legal under the October 19, 2026 list, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #12, "Fire King lists for Rex"):** each master plays one character-fitting deck, drawn from a pool of up to 10 lists legal under Konami's Forbidden & Limited List effective 2026-10-19. The owner's source rule: recent tournament lists where they exist; otherwise lists by pros, deck guides or other strong builds, each cited and labelled with its kind. Check every card count against the October 19 list, then audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md) do, and note the shared staples. Rex plays Fire King by the owner's decision of 2026-11-23 (map issue #1, ticket #7).
>
> **Sourcing rule (same as the earlier notes):** tournament metadata and compositions are YGOPRODeck's records (curated "Tournament Meta Decks", or user-submitted where §4 says so); printed texts/types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** the main note, [blue-eyes-dark-time-wizard-coverage-2026-11.md](./blue-eyes-dark-time-wizard-coverage-2026-11.md) and the Dark Magician note (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim). The companion [insect-deck-coverage-2026-11.md](./insect-deck-coverage-2026-11.md) was written in the same session with the same method.

## 0. Findings and scope

**No Fire King tournament list of the current format exists, and no Advanced-format Fire King tournament list on record is legal today.** YGOPRODeck has 80 TCG "Tournament Meta Decks" records with "Fire King" in the name (November 2024 to August 15, 2026); the newest is from August, and **all 80 fail the October 19 list** (65 play the now-Forbidden Called by the Grave, 61 have 2–3 Droll & Lock Bird, now Limited). No Fire King list placed in the 423 TCG tournament records dated October 19 – November 22, 2026. So, under the owner's rule, the pool falls back to **strong builds**, in this order: two **Genesys-format tournament tops** whose cards also pass the Advanced list (L1 Managua Genesys Regional, October 10, 2026, Top 4; L2 a store Genesys event, March 19, 2026, Top 8), and two **community builds** made for the current Advanced format (L3, the most-viewed legal Fire King list on YGOPRODeck, in its "Meta Decks" category; L4, a pure Fire King list submitted two weeks ago). None of the four is a pro's list or a written deck guide: none was found for the current list (§5).

Together the four contain **87 identifiable unique cards across Main, Extra and Side: 4 scripted & automatic, 8 present but partial, 75 absent.** This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed Fire King card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Fire King (4 lists) | 69 | 3 (4%) | 8 | 58 | 4 / 8 / 75 of 87 |

- **The whole Fire King engine is absent.** The 10 cards in the Main or Extra Deck of all four lists are exactly the archetype's core, and all 10 are absent: Sacred Fire King Garunix, Fire King High Avatar Garunix, Fire King High Avatar Kirin, Fire King Courtier Ulcanix, Legendary Fire King Ponix, Fire King Avatar Arvata, Fire King Island, Fire King Sanctuary, Fire King Sky Burn and Garunix Eternity, Hyang of the Fire Kings. No Fire King card has a picture or a definition in Academy (§1).
- **What the deck needs is one engine idea: destroying your own cards on purpose, and reacting to that.** Nearly every core card either destroys a FIRE monster in the hand, Deck or field as a cost or effect, or starts when "a monster that was originally FIRE is destroyed by battle or card effect", or comes back "during the next Standby Phase after this card was destroyed". Academy's data vocabulary has no "destroy this chosen card" step (only "destroy all monsters your opponent controls", `catalogue.ts:213`), no "destroyed by card effect" event watch (`catalogue.ts:232-243` lists added / destroyed by battle / sent to GY / Special Summoned / targeted), and no delayed "next Standby Phase" effect (`engine.ts:1729-1745` only runs fixed per-turn gains and burns). That is TRIG + VOCAB work (Step 2–3), the same foundation every other note asks for.
- **The Jurrac half fits Rex's Dinosaurs.** L1–L3 are Jurrac Fire King: Jurrac Megalo, Jurrac Astero and Jurrac Meteor (absent) bring Dinosaur Synchros; L3 adds Fossil Dig (automatic), Ultimate Conductor Tyranno, Miscellaneousaurus and Xeno Meteorus. L4 is the pure Fire King build.
- **Shared staples.** Of the 87 cards, **30 were already audited** in at least one of the 14 archetypes of the three earlier notes (the main note's 11, Blue-Eyes, Dark Time Wizard and Dark Magician Light and Darkness Ritual). The partial hand traps (Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos) are in all 14 and here; Effect Veiler, Infinite Impermanence, D.D. Crow and Harpie's Feather Duster also recur (§3). **57 cards are new to the audits**, 4 of them already in Academy (Dark Hole, Fossil Dig and One for One automatic; Forbidden Chalice partial). Nine cards are shared with the Insect note's lists (§3).

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026". Selection, newest first:

- **Advanced tournament lists:** `getDecks.php?name=Fire King&_sft_category=Tournament Meta Decks` was read for offsets 0–60 (80 records, newest first). The newest are [727421](https://ygoprodeck.com/deck/jurrac-fire-king-727421) (Asuncion WCQ Regional, August 15, 2026, Top 4) and [713826](https://ygoprodeck.com/deck/jurrac-fire-king-713826) (Bosnia & Herzegovina National Championship, May 23, 2026, 1st Place). Every record fails the October 19 list (see the legality screen), so none could be taken.
- **Recent scan:** 480 Tournament Meta Deck records (offsets 0–460 without `name`; deck numbers 738587–746021), of which 423 are events dated October 19 – November 22, 2026, were scanned for any card whose name or archetype is Fire King. Only one Fire King card appears: 1 Garunix Eternity in the Extra Deck of a Blitzclique list (742714). No Fire King deck placed.
- **Fallback 1, Genesys tournament tops.** `_sft_category=Tournament Meta Decks (Genesys)` returned 8 Fire King records (October 2025 – November 8, 2026). Genesys is a separate Konami format with a points system, not the Advanced Format, so these are labelled "Genesys tournament list". Only three of them pass the Advanced list; the other five play Original Sinful Spoils - Snake-Eye, Forbidden in Advanced. The two most recent legal ones were taken: [740121](https://ygoprodeck.com/deck/jurrac-fire-king-740121) and [701198](https://ygoprodeck.com/deck/jurrac-fire-king-701198). The third, [666940](https://ygoprodeck.com/deck/jurrac-fire-king-666940) (r/Yugioh Discord Genesys Playoffs, October 26, 2025, Top 4), is legal but a year old and adds nothing to the core; it is left as a reserve.
- **Fallback 2, community builds for the current format.** The unfiltered search `getDecks.php?name=Fire King` was read for offsets 0–80 (the 100 newest Fire King decks of any category). Master Duel, Domain, Goat and HAT lists were set aside as other formats. Of the Advanced lists submitted or edited since the October 19 list, two full 40/15/15 lists pass it and are not casual or test decks: [728806](https://ygoprodeck.com/deck/p%C3%A1jaro-quema-maiz-728806) ("Meta Decks" category, edited about a month ago, 6,367 views, the most viewed legal Advanced Fire King list among the 100 read) and [743250](https://ygoprodeck.com/deck/pure-fire-kings-743250) (submitted two weeks ago, edited last week). Neither reports a result; YGOPRODeck users file these categories themselves.
- **Searched but not used:** web searches for current Fire King deck guides and pro lists found only Dueling Nexus user lists built for the February–June 2026 lists, KotaCards' page (which republishes the Hungarian Open and Bosnia lists, both illegal now, and rates the deck Tier 4), and Master Duel pages (another format). See §5.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited), and every one of the 256 names matched a YGOPRODeck card name exactly. **All four selected lists pass**: none plays a Forbidden card or exceeds a limit, and no card exceeds 3 copies. Cards on the list that appear here, always 1 copy: Droll & Lock Bird and Linkuriboh (L3, L4), Miscellaneousaurus, One for One and Harpie's Feather Duster (L3). Every card has a TCG release date in the card API. This does not certify region or release legality.

**The 80 Advanced tournament records fail the same screen.** Most often: Called by the Grave (Forbidden) in 65, Droll & Lock Bird above 1 in 61, Triple Tactics Talent (Forbidden) in 35, Dimensional Barrier (Forbidden) in 31, Bonfire above 1 (Limited) in 26 and the Azamina/Snake-Eye Forbidden cards in the 2024 lists.

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition. "Absent — data only" remains Absent in totals (none occurs here).
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 12 of the 87 names matched, and all 12 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/1` = L1/L2/L3/L4). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the earlier notes for the 30 cards they already audited. The 57 cards new to the audits were tagged here by reading each fetched text; their Step and Work follow from the codes by the key (the highest step among the codes; `card-deep` and "beyond plan" when a beyond-plan code is present). `script` means card scripting **after its listed shared engine work exists**.
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts test/engine-masters.test.ts` in `packages/cards` gave 6 files and 117 tests passed. The tests cited in the Notes pass, but they do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What is in Academy for this deck

- **No Fire King card.** The join in "Reading the audit" found none of the 13 Fire King cards of these lists in `card-art.json`, `card-art.ts` or `cards.ts`. The Jurrac cards are absent too.
- **Present and automatic:** Dark Hole (`cards.ts:374`; destroys every monster, `engine.ts:3175-3184`), Fossil Dig (`cards.ts:324`, a data search of a Level 6 or lower Dinosaur), One for One (`cards.ts:329`) and Harpie's Feather Duster (`cards.ts:377`, L3's Side Deck).
- **Present but partial:** the hand traps Ash Blossom, Droll & Lock Bird, Effect Veiler, Ghost Ogre, Mulcharmy Fuwalos and D.D. Crow, Infinite Impermanence (all as in the earlier notes, re-read against today's code), and Forbidden Chalice: `chalice` (`cards.ts:261`, `engine.ts:2590-2593`) can only target the opponent's monster (`spellTarget`, `catalogue.ts:534`), while the printed card targets any face-up monster.
- **What already helps.** The data vocabulary can already filter "FIRE" (`attribute`) and "Beast, Beast-Warrior or Winged Beast" (`anyOf` of `type`, `catalogue.ts:166-193`), search, Special Summon from the hand, Deck or GY, and start an effect when a card is sent to the GY (`sentToGy`, `catalogue.ts:232-243`, matched at `engine.ts:993-1000`). Xyz Summons exist with a fixed material count (`engine.ts:2164-2166`), Synchro Summons with one Tuner, exact Levels and an optional named Tuner or name-prefix non-Tuners (`engine.ts:2154-2163`).
- **What is missing for the Fire King core (ours, from the texts against the code):**
  1. A "destroy 1 chosen card" step from the hand, the Deck or the field, as a cost or an effect (Ulcanix, Kirin, Sacred Garunix, Island, Arvata, Rangbali). Data actions only have `destroy-foes` (`catalogue.ts:213`, `engine.ts:1130`).
  2. A "destroyed by battle or card effect" event with provenance (whose card, originally FIRE, "destroyed and sent to the GY"), watched from the hand and the GY (Sacred Garunix, Ponix, Barong, Rangbali, Kirin, Ulcanix, High Avatar Garunix, Garunix Eternity). Only `destroyedByBattle: "ally"` exists, from the hand (`engine.ts:989`).
  3. Delayed effects "during the next Standby Phase after this card was destroyed" (High Avatar Garunix, Ponix, Barong). The Standby Phase only applies fixed monster effects (`engine.ts:1729-1745`).
  4. Quick Effects from the hand in the Main Phase (Kirin) and monster Quick Effects that negate an activation (Arvata, Rangbali): the CHAIN/HAND foundation of Step 1.
  5. Destruction replacement (Sanctuary, Sky Burn) and an Xyz Summon during the opponent's turn (Sanctuary); Extra Deck Summons are Main Phase only (`engine.ts:2141`), and "2+ Level 8 monsters" (Garunix Eternity) needs a variable material count.
- **Not in these lists:** Academy's own Rex Raptor deck (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:19-23`, the anime Dinosaurs) is unrelated to these lists; no live deck was changed.

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

RITUAL, PEND, TOON and DICE do not occur here. Among the 83 cards still to build (partial or absent), the most frequent needs are VOCAB (72), CHAIN (47) and TRIG (39), then LOCK (23), GY (21) and HAND (18). XYZ (12) and LINK (11) are mostly the toolbox Extra Deck; the Fire King core itself needs only XYZ for Garunix Eternity and Sanctuary.

## 2. Coverage (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Fire King | 4 | 69 | 3 | 8 | 58 | 4% | 16% | 18 | 4 / 8 / 75 of 87 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): L1 30 cards, 0 automatic, 3 partial, 7 of 56 copies; L2 31 cards, 0 / 0, 0 of 55 copies; L3 32 cards, 2 / 4, 13 of 55 copies; L4 28 cards, 1 / 4, 12 of 55 copies. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started. L2 has no card in Academy in its Main or Extra Deck.

## 3. Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side)

"Of the 14" counts archetypes in the earlier notes' samples: the main note's 11 (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there), Blue-Eyes, Dark Time Wizard, and Dark Magician (the Dark Magician Light and Darkness Ritual note). Every card here is also played by this deck. Ranked by that count, then by name. Status and tags are the earlier notes' (§4 has the code notes).

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 14 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 14 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Nibiru, the Primal Being | 12 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Sacred Beast, Toon, Unchained | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 6 | S:P Little Knight | 11 | Artmage, Blue-Eyes, Dark Magician, Dark Time Wizard, Elfnote, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Sky Striker, Toon, Unchained | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 7 | Skull Meister | 11 | Angelechy, Artmage, Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Elfnote, Sacred Beast, Toon, Unchained | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 8 | Effect Veiler | 8 | Angelechy, Blue-Eyes, Branded, Branded Dracotail, Dark Time Wizard, Elfnote, Sacred Beast, Toon | Partial | CHAIN | Step 1 | script |
| 9 | Evenly Matched | 7 | Artmage, Blue-Eyes, Branded Dracotail, Dark Magician, Dark Time Wizard, Radiant Typhoon, Toon | Absent | CHAIN, VOCAB | Step 3 | script |
| 10 | Harpie's Feather Duster | 7 | Branded Dracotail, Dark Magician, Dark Time Wizard, Sacred Beast, Sky Striker, Toon, Unchained | Scripted & automatic | — | — | — |
| 11 | Super Polymerization | 7 | Artmage, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Radiant Typhoon, Sky Striker | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |
| 12 | Cosmic Cyclone | 6 | Blue-Eyes, Branded, Branded Dracotail, Dark Magician, Dark Time Wizard, Sky Striker | Absent | CHAIN, VOCAB | Step 3 | script |
| 13 | Garura, Wings of Resonant Life | 6 | Artmage, Branded, Dark Magician, Dark Time Wizard, Radiant Typhoon, Sky Striker | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 14 | Infinite Impermanence | 6 | Angelechy, Blue-Eyes, Branded, Dark Time Wizard, Elfnote, Toon | Partial | ZONE | beyond plan | card-deep |
| 15 | Mudragon of the Swamp | 6 | Artmage, Branded, Dark Magician, Dark Time Wizard, Radiant Typhoon, Sky Striker | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |
| 16 | Accesscode Talker | 4 | Dark Magician, Light and Darkness Ritual, Sky Striker, Toon | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 17 | Artifact Lancea | 4 | Blue-Eyes, Branded Dracotail, Dark Magician, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |
| 18 | Relinquished Anima | 4 | Dark Magician, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |
| 19 | Forbidden Droplet | 3 | Blue-Eyes, Dark Time Wizard, Sky Striker | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 20 | Ghost Belle & Haunted Mansion | 3 | Blue-Eyes, Dark Magician, Sacred Beast | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 21 | Lava Golem | 3 | Branded, Radiant Typhoon, Sky Striker | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |
| 22 | Mystical Space Typhoon | 3 | Dark Time Wizard, Radiant Typhoon, Sky Striker | Absent | CHAIN, VOCAB | Step 3 | script |
| 23 | Divine Arsenal AA-ZEUS - Sky Thunder | 2 | Dark Time Wizard, Toon | Absent | CHAIN, HAND, TRIG, VOCAB, XYZ | Step 4 | script |
| 24 | Pot of Extravagance | 2 | Dark Time Wizard, Radiant Typhoon | Absent | VOCAB | Step 3 | script |
| 25 | Underworld Goddess of the Closed World | 2 | Dark Magician, Unchained | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 26 | D.D. Crow | 1 | Dark Time Wizard | Partial | CHAIN | Step 1 | script |
| 27 | Evilswarm Exciton Knight | 1 | Toon | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |
| 28 | Lightning Storm | 1 | Sky Striker | Absent | VOCAB | Step 3 | script |
| 29 | Linkuriboh | 1 | Sacred Beast | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |
| 30 | Tornado Dragon | 1 | Toon | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |

**Shared with the Insect note's lists (9 cards):** Ash Blossom & Joyous Spring, Effect Veiler, Ghost Ogre & Snow Rabbit, Infinite Impermanence (Partial), Forbidden Chalice (Partial, new to the audits), Dark Ruler No More (Absent, new), Forbidden Droplet, Lava Golem and S:P Little Knight (Absent).

**New to the audits (57 cards):** the Fire King core (Sacred Fire King Garunix, Fire King High Avatar Garunix, Fire King High Avatar Kirin, Fire King Courtier Ulcanix, Legendary Fire King Ponix, Fire King Avatar Arvata, Barong and Rangbali, Fire King Island, Fire King Sanctuary, Fire King Sky Burn, Circle of the Fire Kings, Garunix Eternity, Hyang of the Fire Kings); the Jurrac/Dinosaur package (Jurrac Megalo, Jurrac Astero, Jurrac Meteor, Fossil Dig, Ground Xeno, Miscellaneousaurus, Ultimate Conductor Tyranno, Xeno Meteorus, Dogoran, the Mad Flame Kaiju); FIRE Link and Xyz toolbox (Hiita the Fire Charmer, Ablaze, Promethean Princess, the two Salamangreats, Coach King Giantrainer, Dingirsu, Castel, Diamond Dire Wolf, Kikinagashi Fucho, Lyrilusc - Recital Starling, Number 105, Wind Pegasus @Ignister, Update Jammer, Worldsea Dragon Zealantis); L2's Dogmatika, Rescue-ACE and Hecahands package and its Fossil Fusions; and Genesys-style tech (Forbidden Chalice, Final Bringer of the End Times, Firestorms Over Atlantis, Alpha, the Master of Beasts, Dark Hole, Dark Ruler No More, Herald of the Abyss, Gnomaterial, Mask of Restrict, Non-Fusion Area, The Eye of Truth, Ultimate Slayer, Seventh Tachyon, One for One).

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

Lists (each labelled with its kind under the owner's rule):

1. [Jurrac Fire King](https://ygoprodeck.com/deck/jurrac-fire-king-740121) — **Genesys tournament list** (YGOPRODeck "Tournament Meta Decks (Genesys)", curated): Managua Genesys Regional – October 10th 2026, **Top 4** (40 players); 41 Main / 15 Extra / 15 Side. Passes the Advanced list.
2. [Jurrac Fire King](https://ygoprodeck.com/deck/jurrac-fire-king-701198) — **Genesys tournament list** (same category): Super Heroes Comic Cards and Games Genesys Celebration – March 19th 2026, **Top 8** (19 players); 40 / 15 / 15. Passes the Advanced list.
3. [Pájaro Quema Maiz](https://ygoprodeck.com/deck/p%C3%A1jaro-quema-maiz-728806) — **community build** (Advanced; user-filed "Meta Decks", no event, a Jurrac Fire King list; submitted about two months ago, edited about one month ago, 6,367 views); 40 / 15 / 15.
4. [Pure Fire Kings](https://ygoprodeck.com/deck/pure-fire-kings-743250) — **community build** (Advanced; user-filed "Non-Meta Decks", no event; submitted two weeks ago, edited one week ago); 40 / 15 / 15.

| Card | Copies (L1/L2/L3/L4) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Dark Hole | 2/3/0/3 (main+side) | Scripted & automatic | — | — | — | `wipe` (`cards.ts:374`), resolved at `engine.ts:3175-3184`: every monster on the field is destroyed. Tested at `packages/cards/test/engine-masters.test.ts:21`. |
| Fossil Dig | 0/0/3/0 | Scripted & automatic | — | — | — | Data `search` of a Level 6 or lower Dinosaur (`cards.ts:324`). Tested at `packages/cards/test/engine-effects.test.ts:108-110`. Its targets here, Jurrac Megalo and Miscellaneousaurus, are absent. |
| One for One | 0/0/1/0 | Scripted & automatic | — | — | — | Cost `discard` of a monster, then data `special` of a Level 1 monster from the hand or Deck (`cards.ts:329`; cost checks `engine.ts:1894-1897`). Tested at `packages/cards/test/engine-effects.test.ts:34-39`. The printed cost is 'send', not 'discard'; Academy records a `discarded` event (`engine.ts:1905-1909`) that no rule reads today (see §5). |
| Harpie's Feather Duster | 0/0/1/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 0/0/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| D.D. Crow | 2/0/0/0 | Partial | CHAIN | Step 1 | script | `hand: "crow"` (`cards.ts:361`): only offered while a pending Spell targets a card in its user's GY (`engine.ts:1296`, `:2704-2712`); not a free Quick Effect at any time. |
| Droll & Lock Bird | 0/0/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/0/0/3 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Forbidden Chalice | 3/0/0/0 | Partial | VOCAB | Step 3 | script | `chalice` (`cards.ts:261`), resolved at `engine.ts:2590-2593`: +400 ATK and effects negated for the turn; a Quick-Play answer (`engine.ts:560-561`). Missing: the printed target is 'face-up monster on the field', but `spellTarget` only lets it target the opponent's monster (`catalogue.ts:534`). |
| Ghost Ogre & Snow Rabbit | 2/0/0/2 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 0/0/2/2 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 0/0/3/0 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Alpha, the Master of Beasts | 1/0/0/0 | Absent | LOCK, VOCAB | Step 3 | script | Summon condition from the hand that compares total ATK; returns monsters of both sides to the hand. |
| Circle of the Fire Kings | 1/1/0/3 | Absent | CHAIN, VOCAB | Step 3 | script | Destroys your own FIRE monster (a 'destroyed by card effect' event for the Fire Kings) and revives another. |
| Dogmatika Fleurdelis, the Thunderbolt | 0/2/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script | Quick Effect from the hand; Sets a Trap from the Deck that can be activated this turn. |
| Dogmatika Punishment | 0/1/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script | Sends from the Extra Deck as part of the effect. |
| Dogoran, the Mad Flame Kaiju | 1/3/0/2 (main+side) | Absent | VOCAB, CONTROL, CTR | Step 3 + beyond plan | card-deep | Summoned to the opponent's field by Tributing their monster; Kaiju Counters. |
| Final Bringer of the End Times | 2/2/0/0 | Absent | CHAIN, VOCAB | Step 3 | script | Destroys one of your monsters with an opponent's card. |
| Fire King Avatar Arvata | 1/1/1/2 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script | Quick negation of a monster effect paid by destroying a FIRE monster in the hand or field; 'destroyed and sent to the GY' revival. |
| Fire King Avatar Barong | 1/1/0/0 | Absent | HAND, TRIG, VOCAB | Step 3 | script | Hand trigger when a Fire King is destroyed by a card effect; search at the next Standby Phase (delayed). |
| Fire King Avatar Rangbali | 1/1/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script | Hand trigger when a Fire King is destroyed by a card effect; Quick negation of a Spell/Trap activation. |
| Fire King Courtier Ulcanix | 3/1/3/3 | Absent | TRIG, VOCAB | Step 3 | script | Destroys a FIRE monster in the hand or field, searches a FIRE Beast/Beast-Warrior/Winged Beast and copies its Level; when destroyed and sent, Summons High Avatar Garunix from the Deck. |
| Fire King High Avatar Garunix | 1/1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script | Revives itself at the next Standby Phase after a card-effect destruction and destroys all other monsters; battle-destruction trigger. |
| Fire King High Avatar Kirin | 3/3/3/3 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script | Quick Effect from the hand in the Main Phase (destroys a FIRE monster to Special Summon itself); when destroyed and sent, revives a Fire King then destroys 1 card. |
| Fire King Island | 2/2/2/3 | Absent | TRIG, VOCAB, CONT | Step 3 | script | Field Spell ignition effects (destroy then search; Special Summon from the hand); destroys all your monsters if it leaves face-up. |
| Fire King Sanctuary | 3/3/2/3 | Absent | CHAIN, TRIG, VOCAB, CONT, XYZ | Step 4 | script | Places Fire King Island from the Deck; destruction replacement; Xyz Summon on the opponent's turn right after they Special Summon. |
| Fire King Sky Burn | 2/2/1/1 | Absent | CHAIN, VOCAB, GY | Step 3 | script | Destroys equal numbers on both sides; GY replacement for Fire King destruction. |
| Firestorms Over Atlantis | 0/1/0/0 | Absent | VOCAB, GY, BANISH | Step 3 | script |  |
| Ground Xeno | 3/0/2/0 | Absent | VOCAB, GY, BANISH, FUS-EFF | Step 3 | script | Search, then destroy a card in the hand; GY Fusion Summon of a Dinosaur. |
| Hecahands Godos | 0/3/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB, GY, CONTROL | Step 3 + beyond plan | card-deep | Special Summons from the opponent's GY to your field. |
| Jurrac Megalo | 3/3/3/0 | Absent | TRIG, VOCAB | Step 3 | script | Special Summons itself from the hand; discard 2, draw 2; when destroyed, sends a Jurrac from the Deck or Extra Deck. |
| Legendary Fire King Ponix | 3/3/3/3 | Absent | HAND, TRIG, VOCAB, GY | Step 3 | script | Hand trigger when a monster that was originally FIRE is destroyed; returns to the hand at the next Standby Phase. |
| Miscellaneousaurus | 0/0/1/0 | Absent | CHAIN, HAND, LOCK, VOCAB, GY, BANISH | Step 3 | script | Quick discard from the hand in either Main Phase; a variable banish cost sets the Level summoned. |
| Nibiru, the Primal Being | 0/0/3/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Pot of Extravagance | 0/1/0/0 | Absent | VOCAB | Step 3 | script |  |
| Rescue-ACE Fire Attacker | 0/1/0/0 | Absent | HAND, TRIG, VOCAB | Step 3 | script |  |
| Rescue-ACE Impulse | 0/3/0/0 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Sacred Fire King Garunix | 3/3/3/3 | Absent | HAND, TRIG, VOCAB, GY | Step 3 | script | Special Summons itself from the hand or GY when a monster that was originally FIRE is destroyed; destroys a FIRE monster in the hand, Deck or field. |
| Seventh Tachyon | 0/1/0/0 | Absent | LOCK, VOCAB | Step 3 | script | Reveal cost; places a card on top of the Deck. |
| Ultimate Conductor Tyranno | 0/0/1/0 | Absent | CHAIN, VOCAB, GY, BANISH | Step 3 | script | Summon condition by banishing 2 Dinosaurs; attacks all monsters. |
| Xeno Meteorus | 0/0/1/0 | Absent | HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Accesscode Talker | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Castel, the Skyblaster Musketeer | 1/0/0/0 (extra) | Absent | VOCAB, XYZ | Step 4 | script | Face-down Defense; shuffles a card into the Deck. |
| Coach King Giantrainer | 0/1/0/0 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script | 3 Level 8 materials; draw-and-reveal up to three times per turn; no Battle Phase. |
| Diamond Dire Wolf | 1/0/0/0 (extra) | Absent | VOCAB, XYZ | Step 4 | script |  |
| Dingirsu, the Orcust of the Evening Star | 2/1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, XYZ | Step 4 | script | Alternative Xyz procedure with an Orcust Link; destruction replacement by detaching. |
| Divine Arsenal AA-ZEUS - Sky Thunder | 0/0/0/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Evilswarm Exciton Knight | 1/0/0/0 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Fossil Machine Skull Wagon | 0/1/0/0 (extra) | Absent | VOCAB, GY, BANISH, FUS-EFF, FUS-MAT | Step 4 | script | Must first be Summoned with Fossil Fusion, which is not in these lists. |
| Fossil Warrior Skull Knight | 0/1/0/0 (extra) | Absent | VOCAB, GY, BANISH, FUS-EFF, FUS-MAT | Step 4 | script | Must first be Summoned with Fossil Fusion, which is not in these lists. |
| Garunix Eternity, Hyang of the Fire Kings | 3/3/2/3 (extra) | Absent | TRIG, VOCAB, GY, XYZ | Step 4 | script | '2+ Level 8 monsters' (Academy's Xyz recipe is an exact count, `engine.ts:2164-2166`); revives Fire Kings up to the number of materials it had. |
| Garura, Wings of Resonant Life | 0/0/1/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Hiita the Fire Charmer, Ablaze | 0/0/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK, ZONE, CONTROL | Step 4 + beyond plan | card-deep | Special Summons from the opponent's GY to a zone it points to. |
| Jurrac Astero | 2/3/2/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH, SYN | Step 4 | script | Negates a Summon; Sets a Jurrac Spell/Trap; Special Summons Jurrac Meteor treated as a Synchro Summon. |
| Jurrac Meteor | 2/3/2/0 (extra) | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script | '1 Jurrac Tuner + 2 or more non-Tuner Dinosaur monsters'; destroys all cards on the field. |
| Kikinagashi Fucho | 1/0/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, XYZ | Step 4 | script | Unaffected by other cards' effects. |
| Linkuriboh | 0/0/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Lyrilusc - Recital Starling | 1/0/0/0 (extra) | Absent | TRIG, VOCAB, XYZ | Step 4 | script |  |
| Mudragon of the Swamp | 0/0/1/0 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Number 105: Battlin' Boxer Star Cestus | 0/1/0/0 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Promethean Princess, Bestower of Flames | 0/0/1/2 (extra) | Absent | TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Relinquished Anima | 0/0/0/1 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| S:P Little Knight | 0/0/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Salamangreat Raging Phoenix | 0/0/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Salamangreat Sunlight Wolf | 0/0/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, LINK, ZONE | Step 4 + beyond plan | card-deep | Triggers on a Summon to a zone it points to. |
| Tornado Dragon | 1/0/0/0 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Underworld Goddess of the Closed World | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Update Jammer | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Wind Pegasus @Ignister | 0/1/0/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, SYN | Step 4 | script |  |
| Worldsea Dragon Zealantis | 0/0/1/0 (extra) | Absent | CHAIN, VOCAB, BANISH, LINK, CONTROL | Step 4 + beyond plan | card-deep | Banishes all monsters and returns them to their owners' fields. |
| Artifact Lancea | 0/0/0/2 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Cosmic Cyclone | 2/0/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Dark Ruler No More | 0/0/0/3 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script | Mass negation for the turn, no damage for the opponent, no monster effects in response. |
| Evenly Matched | 0/0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Forbidden Droplet | 0/0/3/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 0/0/0/2 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Gnomaterial | 2/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Herald of the Abyss | 3/0/0/0 (side) | Absent | LOCK, VOCAB | Step 3 | script | Declares a Type and an Attribute; the opponent chooses what to send. |
| Lava Golem | 0/0/0/1 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Lightning Storm | 0/0/2/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Mask of Restrict | 2/0/0/0 (side) | Absent | CHAIN, LOCK, CONT | Step 3 | script |  |
| Mystical Space Typhoon | 0/3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Non-Fusion Area | 0/3/0/0 (side) | Absent | CHAIN, LOCK, CONT | Step 3 | script |  |
| Skull Meister | 3/0/0/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Super Polymerization | 0/0/3/0 (side) | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Eye of Truth | 1/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB, CONT | Step 3 | script | The opponent's hand stays revealed. |
| Ultimate Slayer | 0/3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script | No monster effects in response; sends from the Extra Deck. |

## 5. Unverified, exclusions and interpretation limits

1. **No current-format tournament list and no pro list.** The owner's first source does not exist for Fire King today: the deck's last Advanced top recorded by YGOPRODeck is August 15, 2026, and that list and every earlier one are illegal now. No pro deck profile or written guide for the October 19 list was found (web searches on 2026-11-23: YGOPRODeck, KotaCards, Dueling Nexus, Master Duel Meta, Game8). If the owner wants only the first kind of source, Rex has **no** eligible list; the nearest are [727421](https://ygoprodeck.com/deck/jurrac-fire-king-727421) and [713826](https://ygoprodeck.com/deck/jurrac-fire-king-713826), each illegal by one Called by the Grave plus Albion the Branded Dragon (727421) or a second Droll & Lock Bird (713826). Removing those cards was not done: the method keeps lists exact.
2. **Genesys lists are another format.** L1 and L2 were built under Genesys points, not the Advanced list; they pass the Advanced list but are shaped by Genesys costs (few hand traps; Forbidden Chalice, Final Bringer, Ground Xeno, D.D. Crow). They are tournament-proven, but not in the Advanced metagame. L2 is from March 2026 and from a 19-player store event.
3. **Community builds are self-filed.** L3's "Meta Decks" and L4's "Non-Meta Decks" categories are chosen by the uploading user, not curated by YGOPRODeck; neither reports a result. L3 closely follows the Advanced tournament builds (Ash, Fuwalos, Impermanence, Jurrac, the FIRE Link toolbox, Super Polymerization side) with only legal counts. L4 omits the Jurrac engine and adds three Dark Hole and three Nibiru.
4. **Other legal lists not taken:** [666940](https://ygoprodeck.com/deck/jurrac-fire-king-666940) (Genesys, October 2025, Top 4) as a reserve; [737031](https://ygoprodeck.com/deck/fire-king-learn-to-play-737031) (a store's "Learn to Play" Fire King list, legal, Genesys-shaped); and casual, test, Master Duel and Domain/Goat/HAT lists.
5. **Per-card mechanism tags are triage (ours).** The 30 cards already audited keep their earlier tags verbatim, including the main note's acknowledged keyword-assisted over- and under-tagging. The 57 new tags were assigned by reading each text. They are judgment calls. Examples: "destroy 1 FIRE monster in your hand or Deck" and "destroyed by card effect" triggers are tagged VOCAB and TRIG; "a monster that was originally FIRE" is tagged TRIG (event provenance); Summoning to the opponent's field (Dogoran) and from the opponent's GY to your field (Hecahands Godos, Hiita) are CONTROL; Kaiju Counters are CTR; "to the zone this card points to" is ZONE.
6. **One for One's cost.** The card says "Send 1 monster from your hand to the GY"; Academy's cost is a discard and records a `discarded` event (`engine.ts:1905-1909`). No rule reads that event today, so the difference is invisible in play and the card is kept automatic. A future "if discarded" card would make it Partial.
7. **Ash Blossom's note** (copied from the earlier notes) says Academy counts draws as Ash targets (`effects.ts:91`); the Dark Magician note's §5 discusses it.
8. **Present-card verdicts are static code/text comparisons.** The cited tests pass (see "Reading the audit"), but no new conformance tests were written. Scripted & automatic is an operational classification, not certification against every Konami ruling.
9. **Card API normalization:** every passcode of the selected lists resolved to an English name through `card_images` (no unknown IDs), and every card has a TCG release date.
10. **Source independence:** event, date, placement and player counts are YGOPRODeck's records, not corroborated with organizers. Event dates in each record's description, not the relative "N weeks ago" ages, govern inclusion. Player names are not reproduced.
11. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-23. Deck URL, event, date and placement are attached to each selected list in §4.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=Fire%20King&_sft_category=<category>&offset=<n>` with `Tournament Meta Decks` (offsets 0–60), `Tournament Meta Decks OCG` and `Tournament Meta Decks (Genesys)` (offset 0), and without a category (offsets 0–80). The recent scan used the same endpoint without `name`, `offset=0,20,…,460`. Card data: `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` (full database, 14,684 cards); Appendix A links each name to an exact-name query. No downloaded content was executed.
- Web pages read and not used as lists: [KotaCards, Fire King](https://kotacards.com/deck.php?d=Fire+King), [Dueling Nexus, Jurrac Fire King Deck 2026](https://duelingnexus.com/blog/jurrac-fire-king-deck-2026/) (February 2026 list), [Master Duel Meta, Fire King](https://www.masterduelmeta.com/tier-list/deck-types/Fire%20King).
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, the tests `packages/cards/test/engine-{effects,extra,hand,set,open,masters}.test.ts`, and Academy's own Rex deck `apps/academy-ygo/src/lib/junior/play/master-decks.ts:19-23`. The earlier notes' tags were read from their §3–§4 tables.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For this deck specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note: general priority and response origins, event batches, turn restrictions | Ash, Droll, Ogre, Fuwalos, Veiler, D.D. Crow; monster Quick Effects that negate (Arvata, Rangbali) and Quick Effects from the hand (Kirin) | Nibiru (after Tokens), Gnomaterial, Skull Meister |
| 1 | Step 2 **destruction events**: "destroyed by battle or card effect" with provenance (whose card, originally FIRE, sent to the GY), watched from the hand and the GY; delayed "next Standby Phase" effects | Sacred Fire King Garunix, Legendary Fire King Ponix, High Avatar Garunix, Barong, Rangbali, Kirin's and Ulcanix's GY effects | The whole recursion loop of the archetype |
| 2 | Step 3 vocabulary: "destroy 1 chosen card" from the hand, Deck or field as cost or effect; destruction replacement; place a Field Spell from the Deck | Ulcanix, Sacred Garunix, Island, Sanctuary, Sky Burn, Circle of the Fire Kings; Forbidden Chalice on either side | The 10 core cards in all four lists, plus Circle |
| 3 | Step 4: Xyz with "2+" materials and an Xyz Summon on the opponent's turn (Sanctuary); Synchro with "1 Jurrac Tuner + 2+ non-Tuner Dinosaurs" | Garunix Eternity; Jurrac Astero and Meteor | Then the FIRE Link toolbox (Hiita, Promethean Princess, Salamangreats) per card |

**For Rex, the realistic target is the pure Fire King core plus Jurrac (L3's shape).** Its core needs no beyond-plan mechanism: every Fire King card is `script` work after Steps 1–3 and the Xyz extension. The 10 `card-deep` cards are generic staples and toolbox cards (Nibiru, Lava Golem, Artifact Lancea, Infinite Impermanence's columns, Relinquished Anima, Dogoran, Hecahands Godos, Hiita, Salamangreat Sunlight Wolf, Worldsea Dragon Zealantis); none of them is in all four lists. Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … L4, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Fire King — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S |
| --- | --- | --- | --- | --- | --- |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Alpha, the Master of Beasts](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Alpha%2C%20the%20Master%20of%20Beasts) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 |
| [Castel, the Skyblaster Musketeer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Castel%2C%20the%20Skyblaster%20Musketeer) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Circle of the Fire Kings](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Circle%20of%20the%20Fire%20Kings) | Spell Card | 1/0/0 | 1/0/0 | 0/0/0 | 3/0/0 |
| [Coach King Giantrainer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Coach%20King%20Giantrainer) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/3 |
| [D.D. Crow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=D.D.%20Crow) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dark Hole](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Hole) | Spell Card | 0/0/2 | 0/0/3 | 0/0/0 | 3/0/0 |
| [Dark Ruler No More](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Ruler%20No%20More) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 |
| [Diamond Dire Wolf](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diamond%20Dire%20Wolf) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dingirsu, the Orcust of the Evening Star](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dingirsu%2C%20the%20Orcust%20of%20the%20Evening%20Star) | XYZ Monster | 0/2/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Divine Arsenal AA-ZEUS - Sky Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Divine%20Arsenal%20AA-ZEUS%20-%20Sky%20Thunder) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Dogmatika Fleurdelis, the Thunderbolt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogmatika%20Fleurdelis%2C%20the%20Thunderbolt) | Effect Monster | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 |
| [Dogmatika Punishment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogmatika%20Punishment) | Trap Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Dogoran, the Mad Flame Kaiju](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogoran%2C%20the%20Mad%20Flame%20Kaiju) | Effect Monster | 1/0/0 | 0/0/3 | 0/0/0 | 0/0/2 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Evilswarm Exciton Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evilswarm%20Exciton%20Knight) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Final Bringer of the End Times](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Final%20Bringer%20of%20the%20End%20Times) | Spell Card | 2/0/0 | 2/0/0 | 0/0/0 | 0/0/0 |
| [Fire King Avatar Arvata](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Avatar%20Arvata) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Fire King Avatar Barong](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Avatar%20Barong) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Fire King Avatar Rangbali](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Avatar%20Rangbali) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Fire King Courtier Ulcanix](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Courtier%20Ulcanix) | Effect Monster | 3/0/0 | 1/0/0 | 3/0/0 | 3/0/0 |
| [Fire King High Avatar Garunix](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20High%20Avatar%20Garunix) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Fire King High Avatar Kirin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20High%20Avatar%20Kirin) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Fire King Island](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Island) | Spell Card | 2/0/0 | 2/0/0 | 2/0/0 | 3/0/0 |
| [Fire King Sanctuary](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Sanctuary) | Spell Card | 3/0/0 | 3/0/0 | 2/0/0 | 3/0/0 |
| [Fire King Sky Burn](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20King%20Sky%20Burn) | Spell Card | 2/0/0 | 2/0/0 | 1/0/0 | 1/0/0 |
| [Firestorms Over Atlantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Firestorms%20Over%20Atlantis) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Chalice](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Chalice) | Spell Card | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Fossil Dig](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fossil%20Dig) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Fossil Machine Skull Wagon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fossil%20Machine%20Skull%20Wagon) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Fossil Warrior Skull Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fossil%20Warrior%20Skull%20Knight) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Garunix Eternity, Hyang of the Fire Kings](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garunix%20Eternity%2C%20Hyang%20of%20the%20Fire%20Kings) | XYZ Monster | 0/3/0 | 0/3/0 | 0/2/0 | 0/3/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/2 |
| [Gnomaterial](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gnomaterial) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ground Xeno](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ground%20Xeno) | Spell Card | 3/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Hecahands Godos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hecahands%20Godos) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Herald of the Abyss](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Herald%20of%20the%20Abyss) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Hiita the Fire Charmer, Ablaze](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hiita%20the%20Fire%20Charmer%2C%20Ablaze) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 0/0/0 | 0/0/0 | 2/0/0 | 2/0/0 |
| [Jurrac Astero](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jurrac%20Astero) | Synchro Monster | 0/2/0 | 0/3/0 | 0/2/0 | 0/0/0 |
| [Jurrac Megalo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jurrac%20Megalo) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Jurrac Meteor](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jurrac%20Meteor) | Synchro Monster | 0/2/0 | 0/3/0 | 0/2/0 | 0/0/0 |
| [Kikinagashi Fucho](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kikinagashi%20Fucho) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Lava Golem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lava%20Golem) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 |
| [Legendary Fire King Ponix](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Legendary%20Fire%20King%20Ponix) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Lightning Storm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lightning%20Storm) | Spell Card | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Linkuriboh](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Linkuriboh) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Lyrilusc - Recital Starling](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lyrilusc%20-%20Recital%20Starling) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mask of Restrict](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mask%20of%20Restrict) | Trap Card | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Miscellaneousaurus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Miscellaneousaurus) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Mystical Space Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mystical%20Space%20Typhoon) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 | 3/0/0 |
| [Non-Fusion Area](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Non-Fusion%20Area) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Number 105: Battlin' Boxer Star Cestus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%20105%3A%20Battlin%27%20Boxer%20Star%20Cestus) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [One for One](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=One%20for%20One) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Pot of Extravagance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Extravagance) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Promethean Princess, Bestower of Flames](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Promethean%20Princess%2C%20Bestower%20of%20Flames) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/2/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Rescue-ACE Fire Attacker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rescue-ACE%20Fire%20Attacker) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Rescue-ACE Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rescue-ACE%20Impulse) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Sacred Fire King Garunix](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sacred%20Fire%20King%20Garunix) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Salamangreat Raging Phoenix](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Salamangreat%20Raging%20Phoenix) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Salamangreat Sunlight Wolf](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Salamangreat%20Sunlight%20Wolf) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Seventh Tachyon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Seventh%20Tachyon) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [The Eye of Truth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Eye%20of%20Truth) | Trap Card | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Tornado Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tornado%20Dragon) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ultimate Conductor Tyranno](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ultimate%20Conductor%20Tyranno) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Ultimate Slayer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ultimate%20Slayer) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Underworld Goddess of the Closed World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Underworld%20Goddess%20of%20the%20Closed%20World) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Update Jammer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Update%20Jammer) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Wind Pegasus @Ignister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Wind%20Pegasus%20%40Ignister) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Worldsea Dragon Zealantis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Worldsea%20Dragon%20Zealantis) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Xeno Meteorus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Xeno%20Meteorus) | Tuner Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
