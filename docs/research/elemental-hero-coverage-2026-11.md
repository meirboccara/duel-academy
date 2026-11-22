# Elemental HERO for Jaden: lists for the October 19, 2026 format, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (task brief for GitHub issue #17, "Elemental HERO lists for Jaden"):** find up to 10 Elemental HERO lists legal under Konami's Forbidden & Limited List effective 2026-10-19: recent tournament lists where they exist, otherwise lists by pros, deck guides or other strong builds, citing each and saying which kind it is. Check every count against that list and audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md) do; note shared staples.
>
> **Sourcing rule (same as the earlier notes):** compositions, events and dates are YGOPRODeck's records (deck API, tournament fields, and each deck page's `datePublished`); printed texts and types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic tags, estimates and priorities are **(ours)**. Unconfirmed points are in §5.
>
> **Builds on:** the three earlier coverage notes (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim). The Arkana note of the same date ([arkana-dark-magician-coverage-2026-11.md](./arkana-dark-magician-coverage-2026-11.md)) was written alongside; its cards are not counted here.

## 0. Findings and scope

**No legal tournament list plays an Elemental HERO monster, so all four lists are user-built.** YGOPRODeck has eight TCG Tournament Meta Decks named *Destiny HERO* from events on or after October 19, 2026 (October 24 – November 15), but they play **no** "Elemental HERO" monster: their HERO cards are Destiny HEROes, Masked HEROes, Xtra HEROes, Contrast HERO Chaos (only *treated as* an Elemental HERO), Fusion Destiny and Mask Change. The last tournament lists named *HERO* that do play Elemental HEROes (Plymouth, September 26, 2026, Top 4; Charlottetown, June 20; Las Vegas, May 16, Winner) are **illegal** under the October 19 list (§1). So the selection uses the owner's fallback: four current-format builds, from a self-described competitive list to a casual pure Elemental HERO list (§1). All four are legal and were published October 28 – November 21, 2026.

**None is playable automatically.** The four lists hold **97 identifiable unique cards across Main, Extra and Side: 10 scripted & automatic, 7 present but partial, 80 absent.** This counts unique cards; it is not a win probability, not weighted by copies, and not a share of every printed HERO card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Elemental HERO (4 lists) | 88 | 10 (11%) | 7 | 71 | 10 / 7 / 80 of 97 |

- **Academy already has the searchers, not the engine.** Polymerization, E - Emergency Call, A Hero Lives, Elemental HERO Shadow Mist, Destiny HERO - Malicious, Elemental HERO Neos, Reinforcement of the Army and Foolish Burial are scripted & automatic; Blazeman (its second effect) and Gaia (its target) are partial. This is the best start of any deck audited so far: 11% automatic, where the earlier samples range from 0% to 9% (Sky Striker), and Atem's and Arkana's Dark Magician decks are at 4% and 3%. What is absent is what the modern deck does: **Elemental HERO Stratos** (in all four lists), **Vision HERO Vyon**, **Miracle Ejector** (all four), **Mask Change** and the **Masked HEROes** (all four), **Fusion Destiny**, **Miracle Fusion** and **Favorite Contact** (all four), and the modern Elemental HERO Fusions (**Sunrise**, **Flame Wingman - Infernal Rage**, **Thunder Giant - Voltic Thunder**, all four).
- **Jaden's classic cards are in none of the lists.** Avian, Burstinatrix, Clayman, Sparkman, Bladedge, Flame Wingman, Shining Flare Wingman, Thunder Giant, Rampart Blaster and Hero Barrier, which Academy's Jaden deck plays (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:59-63`), appear in no selected list. The modern deck keeps the names, not the cards: its Flame Wingman and Thunder Giant are the new "- Infernal Rage" and "- Voltic Thunder" Fusions and the "Favorite HERO" Flame Wingman, all absent.
- **17 cards are in the Main or Extra Deck of all four lists**: A Hero Lives, Elemental HERO Neos and Polymerization (automatic), Ash Blossom (partial), and Elemental HERO Stratos, Miracle Ejector, EN Shuffle, Mask Change, Miracle Fusion, Favorite Contact, Masked HERO Dusk Crow, Fountain and Furnace, Masked HERO Dark Law, Elemental HERO Sunrise, Flame Wingman - Infernal Rage and Thunder Giant - Voltic Thunder (absent).
- **The deck is a Fusion deck in the engine's terms.** Among the 87 cards still to build, FUS-MAT (26) and FUS-EFF (15) come right after the general needs (VOCAB, LOCK, TRIG, GY, CHAIN): "2 Elemental HERO monsters with different Attributes", "2 Masked HERO monsters", Contact Fusions that shuffle Neos and Neo-Spacians back, Mask Change's Attribute-matched summon, and Fusion Summons from the Deck (Fusion Destiny), GY or banishment (Miracle Fusion, Parallel World Fusion).
- **Shared staples.** Only 20 of the 97 cards were audited before in one of the 14 archetypes of the earlier notes: the hand traps (Ash, Droll, Ogre, Fuwalos partial; Purulia absent), Typhoon, Solemn Judgment, Super Polymerization, Cosmic Cyclone, Infinite Impermanence, the two Favorite HERO Fusions, Forbidden Droplet and Crown, and the scripted Terraforming, Reinforcement of the Army and Foolish Burial (§3). **77 cards are new to the audits.**

## 1. Selection and legality

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026". Its Advanced Format column was parsed in full: 256 entries (156 Forbidden, 93 Limited, 7 Semi-Limited).

**Tournament search.** `getDecks.php?name=HERO&_sft_category=Tournament Meta Decks` was read for offsets 0, 20 and 40 (all 46 records, newest first) and `name=Elemental` (none). The 480 most recent TCG Tournament Meta Decks (offsets 0–460; deck numbers 738587–746021; events October 3 – November 22, 2026; 423 of them on or after October 19) were scanned by card name.

- **Current format:** eight *Destiny HERO* lists ([745438](https://ygoprodeck.com/deck/destiny-hero-745438), [745432](https://ygoprodeck.com/deck/destiny-hero-745432), [745166](https://ygoprodeck.com/deck/destiny-hero-745166), [744820](https://ygoprodeck.com/deck/destiny-hero-744820), [743381](https://ygoprodeck.com/deck/destiny-hero-743381), [742581](https://ygoprodeck.com/deck/destiny-hero-742581), [741082](https://ygoprodeck.com/deck/destiny-hero-741082), [740742](https://ygoprodeck.com/deck/destiny-hero-740742); events October 24 – November 15, 2026, including a Winner at Honolulu and at Wien), all legal, and none with an "Elemental HERO" monster; no other current list has one either. They are Destiny HERO decks, not Elemental HERO decks, so they were not selected (§5.1). (One more, [739651](https://ygoprodeck.com/deck/destiny-hero-739651), was played October 17 and is illegal.)
- **Last Elemental HERO tournament lists, all illegal under the October 19 list:** [735257](https://ygoprodeck.com/deck/hero-735257) Plymouth WCQ Regional, September 26, 2026, Top 4 (Called by the Grave, Crossout Designator and Triple Tactics Talent are Forbidden; 2 Droll & Lock Bird, Limited); [717793](https://ygoprodeck.com/deck/hero-717793) Charlottetown, June 20, 2026, Top 8 (Called by the Grave, Number 41: Bagooska the Terribly Tired Tapir, Triple Tactics Talent); [711870](https://ygoprodeck.com/deck/hero-711870) Las Vegas, May 16, 2026, Winner (six violations). Older ones are older formats.

**Fallback search (what was selected).** YGOPRODeck's deck search was read by name for `HERO` (offsets 0–300, all categories) and `Elemental HERO` (0–20): 364 records. Selection rule **(ours)**: a TCG Advanced Format list (not Master Duel, Genesys, Speed Duel, Edison, GOAT, Domain, OCG or anime categories), published on or after October 19, 2026, legal under the October 19 list, built on Elemental HERO monsters (at least Neos or Stratos and Elemental HERO Fusions in the Extra Deck), preferring lists that say what they are for.

| # | List (YGOPRODeck) | Category on the site | Kind (owner's rule) | Published | Main / Extra / Side |
| --- | --- | --- | --- | --- | --- |
| L1 | [HERO - Competitive (December 2026)](https://ygoprodeck.com/deck/hero-competitive-december-2026-745749) | Non-Meta Decks | **Other strong build**, by a content creator: the description calls it "HERO Deck Competitive for December 2026" and points to the author's YouTube channel; not a tournament result, and the author is not an identified professional | 2026-11-21 | 50 / 15 / 2 |
| L2 | [60 Card Heroes October 2026](https://ygoprodeck.com/deck/60-card-heroes-october-2026-741343) | Non-Meta Decks | **Other strong build**: "Adapted this from Master Duel, and made it so it's compatible with the TCG Forbidden list"; a 60-card HERO build with Vision, Masked and Evil HERO packages | 2026-10-28 (edited 2026-11-02) | 60 / 15 / 15 |
| L3 | [Hero November 2026](https://ygoprodeck.com/deck/hero-november-2026-743639) | Non-Meta Decks | **Other build**, no write-up: Elemental HERO with the current Destiny HERO tournament core (Doom Overlord, Dark City at Midnight, Destro-Dogma) | 2026-11-09 | 56 / 15 / 15 |
| L4 | [Elemental HERO](https://ygoprodeck.com/deck/elemental-hero-745560) | Non-Meta Decks | **Other build**, casual, no write-up: the only pure Elemental HERO list (Neos, Masked HERO and Elemental HERO Fusions; no Destiny HERO) | 2026-11-19 | 40 / 15 / 0 |

None of the four is a tournament result or a list by an identified professional player; there is no deck guide among the current lists. Author names are not reproduced here; the deck links identify them.

**Legality screen.** Names and counts across Main + Extra + Side were compared with the Advanced Format column. **All four pass**: no Forbidden card, no card over its limit, no card over 3 copies. Cards on the list that appear, always within limit (Limited, 1 copy): Reinforcement of the Army (all four), Foolish Burial (L1, L2, L3), Droll & Lock Bird (L1, L2), and in L3 Chicken Game, Set Rotation, Solemn Judgment and Terraforming. This does not certify region or release legality. No list has unknown passcodes.

**Excluded, with the reason:** [HERO Pre-MAMO](https://ygoprodeck.com/deck/hero-pre-mamo-728873) ("got 2nd at locals"; published August 25, 2026): illegal (Called by the Grave and Crossout Designator Forbidden, 2 Droll & Lock Bird). Of the other current-format HERO user lists, those with a Forbidden card or an over-limit count (for example *Super Hero* 742937–742940, *Heroes* 738868) were dropped, and the legal ones that are Destiny HERO first ([HERO](https://ygoprodeck.com/deck/hero-740715), [D Hero](https://ygoprodeck.com/deck/d-hero-741464)) or a casual mix without a plan ([HEROs](https://ygoprodeck.com/deck/heros-743325)) were not needed: L1–L4 already cover the Elemental HERO core.

## 2. What is in Academy for this deck

**Reading the audit.** The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition.
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image id against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`; the engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). 17 of the 97 names matched, and all 17 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/1` = L1/L2/L3/L4). The zone label shows where the card appears across the lists; exact zone counts are in Appendix A. Percentages use Main+Extra; the last column counts all zones.
- **Needs/Step/Work are (ours).** Copied verbatim from the earlier notes for the 20 cards they already audited. The 77 new cards were tagged from each fetched text with the main note's keyword rules, then read and corrected by hand (for example: a "reveal this card in your hand" ignition effect is not a hand trap, so not HAND; Vision HERO Faris places a monster as a Continuous Trap, MONSPELL; Destiny HERO - Plasma equips the opponent's monster, CONTROL and EQ-MON; Masked HEROes "must be Special Summoned with Mask Change", an alternate procedure, FUS-MAT). `script` means card scripting **after its listed shared engine work exists**; `card-deep` flags work beyond the original plan.
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts test/engine-chain.test.ts test/engine-masters.test.ts test/engine-summons.test.ts` in `packages/cards`: 8 files, 161 tests passed. The tests cited in the Notes pass but do not cover every printed case; the verdicts remain static code/text comparisons.

**Present cards new to the audits** (the others keep the earlier notes' verdicts; full notes in §4):

- **Polymerization** (`cards.ts:67`), **E - Emergency Call** (`:369`), **A Hero Lives** (`:370`), **Elemental HERO Shadow Mist** (`:348-353`), **Destiny HERO - Malicious** (`:347`), **Elemental HERO Neos** (`:179`) and **Elemental HERO Great Tornado** (`:238`, L4's Extra Deck): scripted & automatic.
- **Elemental HERO Blazeman** (`cards.ts:363`): Partial. Its Polymerization search works (`engine.ts:700-720`); its second effect (send an "Elemental HERO" from the Deck, copy its Attribute and ATK/DEF, Fusion-only lock) does not exist.
- **Elemental HERO Gaia** (`cards.ts:364`; L4's Extra Deck): Partial. The engine halves the opponent's strongest monster instead of the target the player chooses (`engine.ts:3363-3374`).
- **"Elemental HERO" is an id prefix in Academy.** A Hero Lives, E - Emergency Call and the Fusion materials `{ prefix: "elemental-hero-" }` test the card id (`catalogue.ts:330-336`, `:337-342`), not the printed name or a "treated as" line. Miracle Ejector and Contrast HERO Chaos are "always treated as an Elemental HERO card", so they need a flag like the existing `treatedAs` for Blue-Eyes (`effects.ts:19`). Shadow Mist's `HERO` search filters on the printed name (`effects.ts:19`), which is right.
- **Not in these lists:** Jaden's classic cards that Academy scripts (Avian, Burstinatrix, Clayman, Sparkman, Bladedge, Flame Wingman, Shining Flare Wingman, Thunder Giant, Rampart Blaster, Nova Master, Fusion Sage, The Warrior Returning Alive, Hero Barrier, Elemental Recharge; `cards.ts:175-178`, `:217`, `:225`, `:236-240`, `:382-383`, `:397-398`). Academy's live Jaden deck (`master-decks.ts:59-63`) is its own and was not changed.

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot.

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

RITUAL, SYN, XYZ, PEND, TOON, TOKEN, CTR and DICE do not occur here. Among the 87 cards still to build (Partial or Absent), the most frequent needs are VOCAB (82), LOCK (54), TRIG (53), GY (32) and CHAIN (29), then **FUS-MAT (26)**, BANISH (22) and **FUS-EFF (15)**. Only 5 cards are `card-deep`: Infinite Impermanence, Destiny HERO - Plasma, Destiny HERO - Dark Angel, Vision HERO Faris and Vision HERO Increase.

## 3. Coverage and shared cards

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Elemental HERO | 4 | 88 | 10 | 7 | 71 | 11% | 19% | 9 | 10 / 7 / 80 of 97 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): L1 41 cards, 8 automatic, 6 partial, 27 of 65 copies; L2 50, 5 / 3, 17 of 75; L3 47, 7 / 3, 21 of 71; L4 43, 7 / 3, 13 of 55. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started.

**Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side).** "Of the 14" counts the main note's 11 archetypes (Blitzclique excluded, as there), Blue-Eyes and Dark Time Wizard, and Atem's Dark Magician Light and Darkness Ritual. Ranked by that count, then by name.

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Typhoon | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 7 | Solemn Judgment | 7 | Elfnote, Toon, Unchained, Sky Striker, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 8 | Super Polymerization | 7 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |
| 9 | Cosmic Cyclone | 6 | Sky Striker, Branded Dracotail, Branded, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 10 | Infinite Impermanence | 6 | Angelechy, Elfnote, Toon, Branded, Blue-Eyes, Dark Time Wizard | Partial | ZONE | beyond plan | card-deep |
| 11 | Favorite HERO Flame Wingman | 3 | Radiant Typhoon, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |
| 12 | Forbidden Droplet | 3 | Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 13 | Ghost Belle & Haunted Mansion | 3 | Sacred Beast, Blue-Eyes, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 14 | Terraforming | 3 | Angelechy, Toon, Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 15 | Triple Tactics Thrust | 3 | Unchained, Sky Striker, Dark Time Wizard | Absent | VOCAB | Step 3 | script |
| 16 | Favorite HERO Shining Flare Wingman | 2 | Branded, Dark Time Wizard | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |
| 17 | Forbidden Crown | 2 | Sky Striker, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 18 | Reinforcement of the Army | 2 | Sky Striker, Dark Time Wizard | Scripted & automatic | — | — | — |
| 19 | Foolish Burial | 1 | Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 20 | Set Rotation | 1 | Angelechy | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |

**New to the audits (77 cards):** the Elemental HERO core (Stratos, Neos, Shadow Mist, Blazeman, Liquid Soldier, Solid Soldier, Spirit of Neos, Miracle Ejector, A Hero Lives, E - Emergency Call, EN Shuffle, Polymerization, Miracle Fusion, Favorite Contact, Neos Fusion, Parallel World Fusion, Double Fusion, Fusion Substitute), its Fusions (Sunrise, Flame Wingman - Infernal Rage, Thunder Giant - Voltic Thunder, Shining Neos Wingman, Absolute Zero, Escuridao, The Shining, Gaia, Great Tornado, Clay Guardian, Wake Up Your Elemental HERO) and Contact Fusions with the Neo-Spacians (Aqua Neos, Cosmo Neos, Nebula Neos; Aqua Dolphin, Dark Panther, Grand Mole), the Masked HERO package (Mask Change, Form Change, Dusk Crow, Fountain, Furnace, Dark Law, Acid, Anki, Atomic, Blast, Contrast HERO Chaos), the Vision HEROes (Vyon, Faris, Increase, Trinity), the Destiny HEROes and their Spells (Malicious, Denier, Plasma, Dark Angel, Destro-Dogma, Doom Overlord, Dreadmaster, Dreadnought Servant, Destroyer Phoenix Enforcer, Dreadnought Master, Fusion Destiny, Dark City at Midnight, D - Force), the Evil HERO package of L2 (Adusted Gold, Vicious Claws, Dead-End Prison, Darkest Knight, Malicious Bane, Evil Assault, Dark Contact), the Xtra HERO Links (Cross Crusader, Dread Decimator, Infernal Devicer, Wonder Driver), Winged Kuriboh Sabatiel LV10, Chicken Game and Dark Ruler No More.

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

| Card | Copies (L1/L2/L3/L4) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| A Hero Lives | 3/3/3/1 | Scripted & automatic | — | — | — | `deck-summon` pool `low-elemental-hero`, cost `half-lp` (`cards.ts:370`): "control no face-up monsters" checked (`engine.ts:1852-1858`), resolved at `:3190-3203`; the pool is a Level 4 or lower Main Deck monster whose id starts `elemental-hero-` (`catalogue.ts:330-336`). Tested at `packages/cards/test/engine-hand.test.ts:125`, `:186`. A card only *treated as* "Elemental HERO" (Miracle Ejector) would not match the id prefix; none is in Academy yet. |
| Destiny HERO - Malicious | 3/3/3/0 | Scripted & automatic | — | — | — | Data effect from the GY, cost `banish-self`, Special Summon a copy from the Deck (`cards.ts:347`). Tested at `packages/cards/test/engine-effects.test.ts:79`. |
| E - Emergency Call | 2/1/0/2 (main+side) | Scripted & automatic | — | — | — | `search-pick` pool `elemental-hero` (`cards.ts:369`; `catalogue.ts:330-336`; `engine.ts:1852`, `:3190-3200`). Tested at `packages/cards/test/engine-hand.test.ts:125`. Same id-prefix caveat as A Hero Lives. |
| Elemental HERO Neos | 1/1/1/1 | Scripted & automatic | — | — | — | Normal Monster, printed 2500/2000 Level 7 (`cards.ts:179`, `real()`; printed facts in `card-art.ts`). |
| Elemental HERO Shadow Mist | 1/1/0/2 | Scripted & automatic | — | — | — | Data effects (`cards.ts:348-353`): on Special Summon add a "Change" Quick-Play, when sent to the GY add a "HERO" monster, one shared use per turn (`once: "shared"`, `engine.ts:806`; name filter `effects.ts:19`). Tested at `packages/cards/test/engine-effects.test.ts:87`. Its first effect has no target in Academy (Mask Change is absent). |
| Foolish Burial | 1/1/1/0 (main+side) | Scripted & automatic | — | — | — | Data `mill` of any monster (`cards.ts:331`), resolved at `engine.ts:1058-1065`; Ash sees it as `mill` (`effects.ts:49`, `:67`). Tested at `packages/cards/test/engine-effects.test.ts:29-30`. |
| Polymerization | 2/2/2/1 | Scripted & automatic | — | — | — | `fusion` (`cards.ts:67`): materials from the hand or field checked by `checkFusion` (`engine.ts:1892`), resolved at `engine.ts:3326-3352`. Material predicates are a name, Type, Attribute or id prefix (`catalogue.ts:337-342`): enough for Academy's own Fusions, not for most Fusions of these lists. Tested at `packages/cards/test/engine-summons.test.ts:79`. |
| Reinforcement of the Army | 1/1/1/1 (main+side) | Scripted & automatic | — | — | — | `search-pick` pool `low-warrior` (`cards.ts:368`). |
| Terraforming | 0/0/1/0 | Scripted & automatic | — | — | — | Data `search` of a Field Spell (`cards.ts:328`). Its only target here, Dark City at Midnight (L3), is absent. |
| Elemental HERO Great Tornado | 0/0/0/1 (extra) | Scripted & automatic | — | — | — | Fusion of an `elemental-hero-` monster + a WIND monster (`cards.ts:238`), `onFusion: "halve-foes"` (`engine.ts:3353-3361`). Tested at `packages/cards/test/engine-extra.test.ts:101`. |
| Ash Blossom & Joyous Spring | 3/3/3/1 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/0/0 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Elemental HERO Blazeman | 1/1/0/2 (main+side) | Partial | LOCK, VOCAB | Step 3 | script | `summonAdd: "polymerization"` (`cards.ts:363`): on Normal or Special Summon it adds Polymerization, once per turn, and opens a moment to answer it (`engine.ts:700-720`). Missing: its second effect (send an "Elemental HERO" from the Deck to the GY, copy its Attribute and ATK/DEF, Fusion-only Special Summon lock). Tested at `packages/cards/test/engine-hand.test.ts:143`, `engine-chain.test.ts:60`. |
| Ghost Ogre & Snow Rabbit | 2/0/3/0 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 3/0/0/0 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3/0 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Elemental HERO Gaia | 0/0/0/1 (extra) | Partial | VOCAB | Step 3 | script | Fusion of an `elemental-hero-` monster + an EARTH monster (`cards.ts:364`), `onFusion: "gaia"` (`engine.ts:3363-3374`). Missing: the target is not chosen; the engine takes the opponent's strongest face-up monster. Tested at `packages/cards/test/engine-hand.test.ts:143`, `:170`. |
| Chicken Game | 0/0/1/0 | Absent | CHAIN, VOCAB, CONT | Step 3 | script |  |
| D - Force | 0/0/1/0 | Absent | TRIG, LOCK, VOCAB, GY, CONT | Step 3 | script |  |
| Dark City at Midnight | 0/0/3/0 | Absent | TRIG, LOCK, VOCAB, CONT | Step 3 | script |  |
| Dark Contact | 0/1/0/0 | Absent | LOCK, VOCAB, BANISH, FUS-EFF | Step 3 | script |  |
| Dark Ruler No More | 0/0/0/1 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Destiny HERO - Denier | 1/1/0/0 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Destiny HERO - Destro-Dogma | 0/0/1/0 | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, BANISH, FUS-EFF | Step 3 | script |  |
| Destiny HERO - Doom Overlord | 0/0/2/0 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Destiny HERO - Dreadmaster | 0/0/1/0 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Destiny HERO - Dreadnought Servant | 0/0/1/0 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Destiny HERO - Plasma | 0/1/1/0 | Absent | CHAIN, LOCK, VOCAB, CONTROL, EQ-MON | Step 3 + beyond plan | card-deep |  |
| Double Fusion | 0/0/0/1 | Absent | VOCAB, FUS-EFF | Step 3 | script |  |
| Elemental HERO Liquid Soldier | 0/1/0/2 (main+side) | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Elemental HERO Solid Soldier | 0/0/0/2 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Elemental HERO Spirit of Neos | 0/0/1/2 | Absent | HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Elemental HERO Stratos | 2/3/3/3 (main+side) | Absent | TRIG, VOCAB | Step 3 | script | On Summon, a choice: destroy Spells/Traps up to the number of HEROes, or add a "HERO" monster (a `search` with a `HERO` name filter exists, `effects.ts:19`; the choice between two effects does not, `catalogue.ts:195-197`). |
| EN Shuffle | 1/1/1/1 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Evil Assault | 0/1/0/0 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Evil HERO Adusted Gold | 0/1/0/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Evil HERO Dead-End Prison | 0/1/0/0 | Absent | TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Evil HERO Vicious Claws | 0/1/0/0 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Favorite Contact | 1/1/1/1 | Absent | CHAIN, TRIG, LOCK, VOCAB, BANISH | Step 3 | script |  |
| Forbidden Crown | 0/2/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Forbidden Droplet | 3/3/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Form Change | 0/0/0/1 | Absent | VOCAB | Step 3 | script |  |
| Fusion Destiny | 3/3/3/0 | Absent | TRIG, LOCK, VOCAB, FUS-EFF | Step 3 | script | Fusion Summon using the hand or **Deck** as material, delayed destruction, DARK "HERO" lock. |
| Fusion Substitute | 0/0/0/1 | Absent | VOCAB, GY, BANISH, FUS-EFF | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 0/2/0/0 | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Mask Change | 1/1/1/2 | Absent | VOCAB | Step 3 | script | Quick-Play: send a "HERO" you control to the GY, then Special Summon a "Masked HERO" with the same Attribute (an alternate summon procedure). |
| Masked HERO Dusk Crow | 1/1/1/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Masked HERO Fountain | 1/1/1/2 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Masked HERO Furnace | 1/1/1/2 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Miracle Ejector | 2/3/3/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Treated as an "Elemental HERO" card: Academy's pools use id prefixes (`catalogue.ts:335`), so it needs a `treatedAs`-style flag (exists for Blue-Eyes, `effects.ts:19`). |
| Miracle Fusion | 1/1/1/2 | Absent | VOCAB, BANISH, FUS-EFF | Step 3 | script |  |
| Mulcharmy Purulia | 0/1/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Neo-Spacian Aqua Dolphin | 1/1/1/0 | Absent | VOCAB | Step 3 | script |  |
| Neo-Spacian Dark Panther | 0/0/1/0 | Absent | TRIG, VOCAB | Step 3 | script | Copies an opponent's monster's name and effects: harder than its tags suggest. |
| Neo-Spacian Grand Mole | 0/0/1/0 | Absent | VOCAB | Step 3 | script |  |
| Neos Fusion | 0/0/0/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Parallel World Fusion | 0/0/0/1 | Absent | LOCK, VOCAB, BANISH, FUS-EFF | Step 3 | script |  |
| Set Rotation | 0/0/1/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Super Polymerization | 1/2/3/1 (main+side) | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Vision HERO Faris | 0/3/0/0 | Absent | TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Vision HERO Increase | 0/2/0/0 | Absent | TRIG, LOCK, VOCAB, GY, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Vision HERO Vyon | 1/2/0/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Send a "HERO" from the Deck to the GY on Summon; banish a "HERO" from the GY to add Polymerization. |
| Winged Kuriboh Sabatiel LV10 | 3/3/3/0 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script | Reveal it and pay half LP to add Polymerization; Quick Effect from the hand at 1000 LP or less. |
| Contrast HERO Chaos | 2/2/2/0 (extra+side) | Absent | CHAIN, LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script | "2 Masked HERO monsters"; treated as "Elemental HERO"; once per turn negates a face-up card. |
| Destiny HERO - Destroyer Phoenix Enforcer | 1/1/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Destiny HERO - Dreadnought Master | 0/0/1/0 (extra) | Absent | TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Elemental HERO Absolute Zero | 0/0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Elemental HERO Clay Guardian | 0/0/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Elemental HERO Cosmo Neos | 0/0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Elemental HERO Escuridao | 0/0/0/1 (extra) | Absent | LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Elemental HERO Flame Wingman - Infernal Rage | 1/1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script | Not the Flame Wingman Academy has (`cards.ts:225`): "2 Elemental HERO monsters with different Attributes". |
| Elemental HERO Nebula Neos | 0/0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Elemental HERO Shining Neos Wingman | 1/1/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Elemental HERO Sunrise | 1/1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Elemental HERO The Shining | 0/0/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Elemental HERO Thunder Giant - Voltic Thunder | 1/1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Evil HERO Darkest Knight | 0/1/0/0 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Favorite HERO Flame Wingman | 1/1/1/0 (extra+side) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script | Not the Flame Wingman Academy has (`cards.ts:225`). |
| Favorite HERO Shining Flare Wingman | 1/1/1/0 (extra+side) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Masked HERO Acid | 0/0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Masked HERO Anki | 0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Masked HERO Atomic | 0/1/0/1 (extra+side) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Masked HERO Dark Law | 2/2/1/1 (extra+side) | Absent | TRIG, LOCK, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Vision HERO Trinity | 0/1/0/0 (extra) | Absent | LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Wake Up Your Elemental HERO | 0/1/1/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Xtra HERO Cross Crusader | 2/2/2/0 (extra+side) | Absent | TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Xtra HERO Infernal Devicer | 1/1/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Xtra HERO Wonder Driver | 1/1/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Cosmic Cyclone | 0/0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Destiny HERO - Dark Angel | 1/1/1/0 (side) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Elemental HERO Aqua Neos | 0/1/0/0 (side) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Evil HERO Malicious Bane | 0/1/0/0 (side) | Absent | LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Masked HERO Blast | 0/1/0/0 (side) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Solemn Judgment | 0/0/1/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Triple Tactics Thrust | 0/0/2/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Typhoon | 0/0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Xtra HERO Dread Decimator | 0/1/0/0 (side) | Absent | VOCAB, GY, LINK | Step 4 | script |  |

## 5. Unverified, exclusions and interpretation limits

1. **Why the Destiny HERO tournament lists are not Jaden's lists.** They are the only current tournament HERO decks, they are legal, and they share Fusion Destiny, Mask Change, the Masked HEROes, Contrast HERO Chaos and Destiny HERO - Malicious with L1–L3. But the issue asks for Elemental HERO, Jaden's monsters, and these lists play none. If the owner prefers tournament evidence over the archetype, the eight Destiny HERO lists are the nearest legal option (and Destiny HERO is Aster Phoenix's deck in the anime, not Jaden's).
2. **No tournament evidence for the selected lists.** All four are user submissions; "Non-Meta Decks" is the site's category, not a judgement of strength. L1's "competitive" and L2's Master Duel origin are their authors' statements. The strength of these builds is not established by any event.
3. **Coverage of the search.** YGOPRODeck only (364 HERO name-search records and 480 tournament records); a list published elsewhere is not covered. A web search found only Master Duel and fan pages for 2026 HERO lists.
4. **Per-card mechanism tags are triage (ours).** The 20 cards already audited keep their earlier tags verbatim. The 77 new tags are judgment calls; Neo-Spacian Dark Panther (copies an opponent's monster's effects), Destiny HERO - Dark Angel (summons to the opponent's field) and Favorite Contact (summons a Fusion Monster ignoring its conditions by placing materials on the bottom of the Deck) are harder than their tags suggest.
5. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§2), but no new conformance tests were written.
6. **Card API normalization:** every passcode of the four lists resolved through `card_images` to an English name; none is unknown.
7. **Dates** are each deck page's `datePublished` (L1 2026-11-21, L2 2026-10-28, L3 2026-11-09, L4 2026-11-19); L2 was edited on 2026-11-02, after the October 19 list took effect, and was checked as it stands.

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first the Step 1–2 foundations behind the shared partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For Jaden specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | A "treated as an Elemental HERO card" flag in the pools and Fusion material prefixes (`catalogue.ts:330-342`; `treatedAs` exists, `effects.ts:19`) | Miracle Ejector, Contrast HERO Chaos counted by A Hero Lives, E - Emergency Call and Elemental HERO Fusions | Small, and it keeps the present searchers right as cards are added |
| 1 | Step 3 vocabulary: a choice between two effects, "send from the Deck", "a Spell/Trap that mentions an Elemental HERO" (the "mentions" filter Atem's and Arkana's notes also need), Set from Deck | **Elemental HERO Stratos** (all four lists), Vision HERO Vyon, Miracle Ejector, Blazeman's second effect, Liquid Soldier, Solid Soldier, Spirit of Neos, EN Shuffle | Per card; Stratos alone gives Jaden a real searcher |
| 2 | Step 4 Fusion material predicates: "2 Elemental HERO monsters with different Attributes", "2 HERO monsters with different Attributes", "Elemental HERO Neos + 1 Wingman Fusion Monster", "1 HERO + 1 WATER" | Sunrise, Flame Wingman - Infernal Rage, Thunder Giant - Voltic Thunder (all four lists), Shining Neos Wingman, Absolute Zero, Escuridao, The Shining | Their own effects are Step 2–3 |
| 3 | Step 3 Fusion by effect: materials from the Deck (Fusion Destiny), the GY or banishment by banishing/shuffling (Miracle Fusion, Parallel World Fusion), Favorite Contact's placement on the bottom of the Deck | Miracle Fusion and Favorite Contact (all four), Fusion Destiny (three) | With priority 2 |
| 4 | Step 4 alternate procedures: Mask Change's Attribute-matched summon, Contact Fusion | The Masked HERO package (all four lists), the Neos Contact Fusions | Masked HERO Dusk Crow, Fountain, Furnace |

**For Jaden, the realistic target is L4 or L1 without its Destiny HERO and Xtra HERO parts.** The present searchers (E - Emergency Call, A Hero Lives, Shadow Mist, Polymerization) already work; Stratos and the modern Elemental HERO Fusions are the shortest path to a modern deck that still looks like Jaden's. Only 5 cards are `card-deep`, and none of the 17 cards in all four lists is. These are sample counts, not format-wide play rates.

## Sources and reproducibility

Fetched 2026-11-23.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=HERO&_sft_category=Tournament%20Meta%20Decks&offset=0,20,40`, `…?name=HERO&offset=0,20,…,300`, `…?name=Elemental%20HERO&offset=0,20`, and `…?_sft_category=Tournament%20Meta%20Decks&offset=0,20,…,460`; each selected or excluded deck's page for `datePublished`/`dateModified`; full card API `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` for names, types and texts. Event, date and placement of tournament lists come from each record's `deck_description` and `tournament*` fields. Appendix A links each name to an exact-name query. No downloaded content was executed.
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, `apps/academy-ygo/src/lib/junior/play/master-decks.ts`, the tests named in §2, and the earlier notes' §4 tables.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … L4, in the list order of §1. Type labels are API types; they are not proof of summon support.

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S |
| --- | --- | --- | --- | --- | --- |
| [A Hero Lives](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=A%20Hero%20Lives) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 1/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 1/0/0 |
| [Chicken Game](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chicken%20Game) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Contrast HERO Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Contrast%20HERO%20Chaos) | Fusion Monster | 0/2/0 | 0/1/1 | 0/2/0 | 0/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [D - Force](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=D%20-%20Force) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Dark City at Midnight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20City%20at%20Midnight) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Dark Contact](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Contact) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Dark Ruler No More](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Ruler%20No%20More) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Destiny HERO - Dark Angel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Dark%20Angel) | Effect Monster | 0/0/1 | 0/0/1 | 0/0/1 | 0/0/0 |
| [Destiny HERO - Denier](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Denier) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Destiny HERO - Destro-Dogma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Destro-Dogma) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Destiny HERO - Destroyer Phoenix Enforcer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Destroyer%20Phoenix%20Enforcer) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Destiny HERO - Doom Overlord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Doom%20Overlord) | Effect Monster | 0/0/0 | 0/0/0 | 2/0/0 | 0/0/0 |
| [Destiny HERO - Dreadmaster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Dreadmaster) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Destiny HERO - Dreadnought Master](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Dreadnought%20Master) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Destiny HERO - Dreadnought Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Dreadnought%20Servant) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Destiny HERO - Malicious](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Malicious) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Destiny HERO - Plasma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Destiny%20HERO%20-%20Plasma) | Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Double Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Double%20Fusion) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [E - Emergency Call](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=E%20-%20Emergency%20Call) | Spell Card | 2/0/0 | 0/0/1 | 0/0/0 | 2/0/0 |
| [Elemental HERO Absolute Zero](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Absolute%20Zero) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Aqua Neos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Aqua%20Neos) | Fusion Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Elemental HERO Blazeman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Blazeman) | Effect Monster | 1/0/0 | 0/0/1 | 0/0/0 | 2/0/0 |
| [Elemental HERO Clay Guardian](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Clay%20Guardian) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Cosmo Neos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Cosmo%20Neos) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Elemental HERO Escuridao](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Escuridao) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Flame Wingman - Infernal Rage](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Flame%20Wingman%20-%20Infernal%20Rage) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Elemental HERO Gaia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Gaia) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Great Tornado](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Great%20Tornado) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Liquid Soldier](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Liquid%20Soldier) | Effect Monster | 0/0/0 | 0/0/1 | 0/0/0 | 2/0/0 |
| [Elemental HERO Nebula Neos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Nebula%20Neos) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Elemental HERO Neos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Neos) | Normal Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Elemental HERO Shadow Mist](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Shadow%20Mist) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 | 2/0/0 |
| [Elemental HERO Shining Neos Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Shining%20Neos%20Wingman) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Solid Soldier](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Solid%20Soldier) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 |
| [Elemental HERO Spirit of Neos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Spirit%20of%20Neos) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 2/0/0 |
| [Elemental HERO Stratos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Stratos) | Effect Monster | 2/0/0 | 2/0/1 | 3/0/0 | 3/0/0 |
| [Elemental HERO Sunrise](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Sunrise) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Elemental HERO The Shining](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20The%20Shining) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Elemental HERO Thunder Giant - Voltic Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elemental%20HERO%20Thunder%20Giant%20-%20Voltic%20Thunder) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [EN Shuffle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=EN%20Shuffle) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Evil Assault](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20Assault) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Evil HERO Adusted Gold](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20HERO%20Adusted%20Gold) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Evil HERO Darkest Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20HERO%20Darkest%20Knight) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Evil HERO Dead-End Prison](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20HERO%20Dead-End%20Prison) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Evil HERO Malicious Bane](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20HERO%20Malicious%20Bane) | Fusion Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Evil HERO Vicious Claws](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20HERO%20Vicious%20Claws) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Favorite Contact](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20Contact) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Favorite HERO Flame Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Flame%20Wingman) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/1 | 0/0/0 |
| [Favorite HERO Shining Flare Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Shining%20Flare%20Wingman) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/1 | 0/0/0 |
| [Foolish Burial](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial) | Spell Card | 1/0/0 | 0/0/1 | 1/0/0 | 0/0/0 |
| [Forbidden Crown](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Crown) | Spell Card | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Form Change](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Form%20Change) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Fusion Destiny](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fusion%20Destiny) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Fusion Substitute](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fusion%20Substitute) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 2/0/0 | 0/0/0 | 3/0/0 | 0/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mask Change](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mask%20Change) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Masked HERO Acid](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Acid) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Masked HERO Anki](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Anki) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Masked HERO Atomic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Atomic) | Fusion Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/1/0 |
| [Masked HERO Blast](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Blast) | Fusion Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Masked HERO Dark Law](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Dark%20Law) | Fusion Monster | 0/2/0 | 0/1/1 | 0/1/0 | 0/1/0 |
| [Masked HERO Dusk Crow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Dusk%20Crow) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Masked HERO Fountain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Fountain) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Masked HERO Furnace](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masked%20HERO%20Furnace) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Miracle Ejector](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Miracle%20Ejector) | Effect Monster | 2/0/0 | 3/0/0 | 3/0/0 | 1/0/0 |
| [Miracle Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Miracle%20Fusion) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Neo-Spacian Aqua Dolphin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neo-Spacian%20Aqua%20Dolphin) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Neo-Spacian Dark Panther](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neo-Spacian%20Dark%20Panther) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Neo-Spacian Grand Mole](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neo-Spacian%20Grand%20Mole) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Neos Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Neos%20Fusion) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Parallel World Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Parallel%20World%20Fusion) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Polymerization) | Spell Card | 2/0/0 | 2/0/0 | 2/0/0 | 1/0/0 |
| [Reinforcement of the Army](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Reinforcement%20of%20the%20Army) | Spell Card | 1/0/0 | 0/0/1 | 1/0/0 | 1/0/0 |
| [Set Rotation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Set%20Rotation) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/1 | 2/0/0 | 0/0/3 | 1/0/0 |
| [Terraforming](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Terraforming) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Vision HERO Faris](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vision%20HERO%20Faris) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Vision HERO Increase](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vision%20HERO%20Increase) | Effect Monster | 0/0/0 | 2/0/0 | 0/0/0 | 0/0/0 |
| [Vision HERO Trinity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vision%20HERO%20Trinity) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Vision HERO Vyon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vision%20HERO%20Vyon) | Effect Monster | 1/0/0 | 2/0/0 | 0/0/0 | 1/0/0 |
| [Wake Up Your Elemental HERO](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Wake%20Up%20Your%20Elemental%20HERO) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Winged Kuriboh Sabatiel LV10](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Winged%20Kuriboh%20Sabatiel%20LV10) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Xtra HERO Cross Crusader](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Xtra%20HERO%20Cross%20Crusader) | Link Monster | 0/2/0 | 0/1/1 | 0/2/0 | 0/0/0 |
| [Xtra HERO Dread Decimator](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Xtra%20HERO%20Dread%20Decimator) | Link Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Xtra HERO Infernal Devicer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Xtra%20HERO%20Infernal%20Devicer) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Xtra HERO Wonder Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Xtra%20HERO%20Wonder%20Driver) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
