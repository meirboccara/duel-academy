# Stardust Synchro for Yusei: lists for the October 19, 2026 format, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (from the task brief for GitHub issue #18, "Stardust Synchro lists for Yusei"):** Yusei plays a **Stardust** Synchro deck: Stardust Dragon and its support, with the Junk/Synchron engine the lists use. Build a pool of up to 10 lists legal under the Forbidden & Limited List effective 2026-10-19. Source rule set by the owner: recent tournament lists where they exist; otherwise lists by pros, deck guides or other strong builds, each cited, each labelled with its kind. Check every card count against Konami's list, then audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) and [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md) do, and note the shared staples.
>
> **Sourcing rule (same as the earlier notes):** tournament metadata and compositions are YGOPRODeck's records (its curated "Tournament Meta Decks", or, where said, a user's own deck page); printed texts/types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are separated in §5.
>
> **Builds on:** the three earlier coverage notes ([meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md), [blue-eyes-dark-time-wizard-coverage-2026-11.md](./blue-eyes-dark-time-wizard-coverage-2026-11.md), [dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md)): method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim. [trainer-meta-decks.md](./trainer-meta-decks.md) §4.9 used L1 below for Yusei's current Academy deck.

## 0. Findings and scope

**Only one current tournament list exists, and no list is playable automatically.** YGOPRODeck has exactly **one** curated TCG Tournament Meta Deck of a Stardust / Junk Synchron deck dated on or after October 19, 2026: *Synchron*, Christchurch WCQ Regional, November 7, Top 4 (L1). Because one tournament list is not a pool, the owner's fallback applies: **one player-submitted tournament list** (L2, a self-reported 10th place at the Matamoros Regional Qualifier, October 24) and **five community builds** uploaded or edited after October 19 (L3–L7). No list by a named pro and no current deck guide could be found or read (§5). All seven are legal under the October 19 list. Together they contain **107 identifiable unique cards across Main, Extra and Side: 5 scripted & automatic, 6 present but partial, 96 absent.** This counts unique cards. It is not a win probability, not weighted by copies, and not a share of every printed Stardust or Synchron card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Stardust Synchro (7 lists: 1 tournament, 1 player-reported tournament, 5 community) | 88 | 4 (5%) | 6 | 78 | 5 / 6 / 96 of 107 |

- **Stardust Dragon itself is not playable.** It is in the Extra Deck of all seven lists, and Academy has only its picture and printed facts (`card-art.ts:83`), no `cards.ts` entry. Its plain "1 Tuner + 1+ non-Tuner monsters" recipe would fit Academy's Synchro procedure (`engine.ts:2154-2163`); its Quick Effect (Tribute itself to negate a destroying effect) and its End Phase return do not exist.
- **The Junk/Synchron half is the part Academy already started, with one card.** Junk Synchron is **Scripted & automatic** (`cards.ts:220`, `engine.ts:2019-2036`), and Reinforcement of the Army fetches it. Everything else that makes these lists run is absent: Junk Meister, Stardust Synchron, Scrap/Jet/Starjunk/Assault/Wheel Synchron, Junk Armor, Synchro Fellowship, Junk Signal, Synchro Emergency, and the Synchro toolbox (Accel Synchro Stardust Dragon, Junk Speeder, Scrap Warrior, Crimson Dragon).
- **19 cards are in the Main or Extra Deck of all seven lists.** 2 are automatic (Junk Synchron, Reinforcement of the Army) and 17 are absent: Assault Sonic Warrior, Assault Synchron, Duel Evolution - Assault Zone, Full-Speed Warrior, Jet Synchron, Junk Armor, Junk Meister, Junk Signal, Scrap Synchron, Stardust Synchron, Starjunk Synchron, Synchro Fellowship, Accel Synchro Stardust Dragon, Crimson Dragon, Junk Speeder, Scrap Warrior, Stardust Dragon. No hand trap is in all seven, because L6 plays none.
- **The engine's Synchro Summon is the main blocker, not the cards' effects alone.** Academy's Synchro Summon takes exactly one Tuner from the field, in the turn player's Main Phase, and only checks a named Tuner (`synchroTuner`) or a non-Tuner name prefix (`engine.ts:2137-2163`). These lists rely on what it lacks: an archetype Tuner ("1 'Synchron' Tuner"), Tuner substitutes, materials from the hand, Synchro Tuners as material, several Tuners, Synchro Summons during the opponent's Main Phase or by a card's effect, and Summons "treated as a Synchro Summon". SYN is needed by 31 of the 101 cards still to build.
- **Shared staples.** Of the 107 cards, **38 were already audited** in at least one of the 14 archetypes of the three earlier notes. The top of the ranking is unchanged: Ash Blossom, Droll & Lock Bird, Ghost Ogre and Mulcharmy Fuwalos (Partial) and Mulcharmy Purulia (Absent) are in all 14 archetypes and in this deck (§3). **69 cards are new to the audits**: the whole Junk/Synchron/Stardust package and most of its Synchro Extra Deck.

### Current TCG format and selection

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026".

- **Tournament search:** `getDecks.php?name=Synchron&_sft_category=Tournament Meta Decks` was read for offsets 0, 20 and 40 (offset 60 returned no decks), and `name=Stardust` (2 records, both from 2024). Three Synchron-named records are dated on or after October 19: [744497 Synchron](https://ygoprodeck.com/deck/synchron-744497) (Christchurch, November 7), [744495 Synchron Ashtra](https://ygoprodeck.com/deck/synchron-ashtra-744495) (Christchurch, November 7) and [741310 Synchron Kewl Tune](https://ygoprodeck.com/deck/synchron-kewl-tune-741310) (The Side Deck Remote Duel, October 25). Only 744497 is a Stardust deck. The other two are legal but play neither Stardust Dragon nor Junk Synchron: they splash Jet/Revolution/Starjunk Synchron into Ashtra and Kewl Tune engines. The other Synchron records are dated October 11 or earlier.
- **Recent scan:** 420 Tournament Meta Deck records (offsets 0–400 without `name`; deck numbers 740574–746021, events October 19 – November 22, 2026) were scanned by deck name and by every card name containing Stardust, Synchron or Junk (plus Crimson Dragon, Red Supernova/Hypernova and Cosmic Blazar). **Stardust Dragon and Junk Synchron are in exactly one list, 744497.** The other hits are single Synchros splashed into other decks (Stardust Dragon - Victim Sanctuary in Ashtra and Branded lists, Accel Synchro Stardust Dragon in Ars Magna Elfnote, Crimson Dragon in Angelechy and Primite Blue-Eyes, Stardust Dragon in one Angelechy list); none plays the Stardust/Synchron engine.
- **Fallback, as the owner's rule allows:** a search of all YGOPRODeck deck categories for `Stardust`, `Synchron`, `Junk` and `Yusei` (offsets 0–40 each) and a web search for current guides and pro lists. The kept lists are those that (a) were uploaded or last edited after October 19, 2026, (b) pass the legality screen, (c) play Stardust Dragon with the Junk Synchron engine, and (d) have a complete Main and 15-card Extra Deck. Casual builds without the competitive core (no hand traps, Tuning/Doppelwarrior engines), a superseded October list by the same author as L3, and a build with a Forbidden card were left out (§5).
- **Variants:** L1, L2, L4 and L5 are the competitive Junk Meister / Duel Evolution - Assault Zone build with hand traps; L2 and L4 add a Bystial pair, L5 three Fydraulis Harmonia. L3 is the same build with Infinite Impermanence and Effect Veiler. **L6 and L7 lean furthest toward Stardust**, the character fit: L6 plays the Majestic package (Converging Wills Dragon, Majestic Dragon, Majestic Star Dragon, Shooting Majestic Star Dragon), Cosmic Quasar and Shooting Quasar Dragon, and Stardust Sifr Divine Dragon; L7 plays Stardust Warrior, Shooting Star Dragon, Stardust Sifr Divine Dragon and Victim Sanctuary. This is the current-format data that could be found, not a census of the format.

**Legality screen.** For each list, names and counts across Main + Extra + Side were compared with the Advanced Format column of that official page: all 256 entries were parsed (156 Forbidden, 93 Limited, 7 Semi-Limited). **All seven selected lists pass**: none plays a Forbidden card or exceeds a limit, and no card exceeds 3 copies. Cards on the list that appear here, all Limited and always at 1 copy: Reinforcement of the Army (all seven), Droll & Lock Bird (L1, L3, L4, L5, L7), Terraforming (L1, L3, L7), T.G. Hyper Librarian (L1, L2, L5), Synchro Overtake (L1), Bystial Druiswurm and Bystial Magnamhut (L2, L4), Harpie's Feather Duster (L2), Solemn Judgment (L3), PSY-Framegear Gamma (L5), Foolish Burial (L7). Every card's TCG release date in the card API is on or before November 23, 2026. This does not certify region legality. No list has unrevealed `???` slots.

**Excluded lists fail the same screen:** the last two pure Synchron tournament tops before the format, [731631 Vire](https://ygoprodeck.com/deck/synchron-731631) (September 6, Top 8) and [717418 Knoxville](https://ygoprodeck.com/deck/synchron-717418) (June 6, Top 8), play Called by the Grave, Triple Tactics Talent, Crystal Wing Synchro Dragon and PSY-Framelord Omega (Forbidden; Vire also Anti-Spell Fragrance) and 2 Droll & Lock Bird (Limited). The current OCG lists ([744077](https://ygoprodeck.com/deck/synchron-744077), 3rd Motsu-kai; [735596](https://ygoprodeck.com/deck/synchron-735596)) play Maxx "C", Baronne de Fleur, Herald of the Arc Light and other cards Forbidden in the TCG.

### Reading the audit

The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition; a picture is insufficient. "Absent — data only" remains Absent in totals (one card, PSY-Frame Driver, keeps that tag from the main note).
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image ID against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399` (`PRINTED` built at `cards.ts:404`). The engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). Only 12 of the 107 names matched. 11 have a `cards.ts` entry; **Stardust Dragon is art-only** (`card-art.ts:83`), hence Absent.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/…` = L1/L2/L3/…). The zone label shows where the card appears across the lists. Exact zone counts are in Appendix A. Percentages use Main+Extra, and the last column counts all zones.
- **Needs/Step/Work are (ours)**, a triage map. They are copied verbatim from the earlier notes for the 38 cards they already audited; the notes on present cards were re-checked against today's code (§1). The 69 cards new to the audits were tagged here by reading each fetched text. `script` means card scripting **after its listed shared engine work exists**. `card-deep` flags work beyond the original plan (columns, monsters-as-backrow and the reverse, control vs ownership, Tokens, counters, monsters as Equips, dice).
- **Tests run:** `npx vitest run test/engine-masters.test.ts test/engine-effects.test.ts test/engine-hand.test.ts test/engine-open.test.ts` in `packages/cards` gave 4 files and 78 tests passed, including Junk Synchron's (`engine-masters.test.ts:172-188`). The tests do not cover every printed case. The verdicts remain static code/text comparisons.

## 1. What is in Academy for this deck

- **Junk Synchron** (`cards.ts:220`; `engine.ts:1998`, `:2019-2036`): **Scripted & automatic**. Right after its Normal Summon, it Special Summons a Level 2 or lower monster from its owner's GY in Defense Position with its effects negated, as printed (no once-per-turn on this card). It is the named Tuner of Academy's Junk Warrior (`cards.ts:227`, checked at `engine.ts:2158`).
- **The Synchro Summon** (`engine.ts:2137-2200`): declared in the Main Phase with face-up monsters on the field (`:2141`, `needMain` at `:1718-1722`); exactly one Tuner and at least one other monster, Levels summing exactly (`:2156-2163`); a named Tuner (`synchroTuner`, `catalogue.ts:447`) or a non-Tuner id prefix (`synchroNonTuner`, `:451`). So Stardust Dragon, Scrap Warrior ("Scrap Synchron" + …), Jet Warrior and Junk Warrior Extreme have recipes Academy can already check, while Junk Speeder ("1 'Synchron' Tuner"), Shooting Star Dragon ("1 Tuner Synchro Monster + 'Stardust Dragon'"), Stardust Warrior, the Quasar and Majestic Dragons and Red Supernova/Hypernova (3–4 Tuners) do not.
- **Generic Spells:** Reinforcement of the Army (`cards.ts:368`, Level 4 or lower Warrior, `catalogue.ts:334`), Terraforming (`cards.ts:328`), Foolish Burial (`cards.ts:331`) and Harpie's Feather Duster (`cards.ts:377`) are **Scripted & automatic**, as in the earlier notes. Reinforcement can fetch Junk Synchron; its other targets here (Junk Meister, Starjunk Synchron, Junk Armor, Junk Converter, Assault Sonic Warrior, Full-Speed Warrior) are absent. Terraforming's only target in its three lists, Duel Evolution - Assault Zone, is absent.
- **Hand traps:** Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos, Effect Veiler and Infinite Impermanence are **Partial**, with the limits the main note sets out (its §1), unchanged in today's code.
- **"Mentions" exists in the engine but not in the data vocabulary** (as the Dark Magician note found): `mentions(card, name)` (`catalogue.ts:504`) reads a quoted name in the printed text, but a data-written card cannot filter on it (`CardFilter`, `catalogue.ts:166-193`). Stardust Synchron, Junk Signal, Full-Speed Warrior, Synchro Fellowship, Scrap Warrior, Assault Sonic Warrior and Majestic Mirage all filter on "mentions 'Stardust Dragon'" or "mentions 'Junk Warrior'".
- **Close to the data vocabulary but not there:** Tuning's search fits data `search` with `archetype` + `tuner` (`catalogue.ts:168-175`, `:201`), but "send the top card of your Deck to the GY" has no action; Emergency Teleport's Summon fits data `special` (`:203`), but not its End Phase banishment; the data `lock` restricts Special Summons by Monster Type only (`:223`), not "from the Extra Deck, except Synchro Monsters", which almost every Synchron card applies; `special-self` already has `banishOnLeave` (`:228`).
- **Not in these lists:** the other Synchron/Junk cards Academy plays in its own Yusei deck (Junk Warrior, Gaia Knight, Scrap Archfiend, Tune Warrior, the anime Level 2s) appear in **none** of the seven lists.

The bot only searches legal moves (`bot.ts:123-184`), so no absent rule can be patched by a smarter bot. Yusei's deck in the app (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:64-68`) is Academy's own and is not any of these lists; no live deck was changed.

### Mechanism key (ours, from the main note)

| Code | Required mechanism / extension | Plan step | Repo evidence for current boundary |
| --- | --- | --- | --- |
| CHAIN / HAND | Full fast-effect priority, legal origins, activation vs effect negation, arbitrary responses | 1 | `engine.ts:1277-1299`, `:1482-1533`, `:2631` |
| TRIG / LOCK | General event provenance, simultaneous triggers, delayed effects, turn/Duel restrictions | 2 | `catalogue.ts:231-283`; `engine.ts:1234-1242` |
| VOCAB / GY / BANISH | Multi-choice actions, costs, filters (including "a card that mentions X", Level changes), return/banish/Set, effects in GY/banishment | 3 | `catalogue.ts:166-283`, `effects.ts:46-59` |
| CONT | Activated/continuous Field and Continuous Spell/Trap effects | 3 | `catalogue.ts:45-163`, `:489-499` |
| RITUAL / FUS-EFF | General Ritual tributes and GY banish; Fusion by effect from Deck/GY/opponent field | 3 | `catalogue.ts:140-143` |
| FUS-MAT / SYN / XYZ / LINK / PEND | Material predicates, alternate procedures, material transfer, proper summon, arrow/scale effects | 4 | `catalogue.ts:337-342`, `:390-407`; `engine.ts:2081-2202` |
| ZONE / MONSPELL / CONTROL | Columns/centre/Extra Monster Zone conditions, monsters as backrow (and Traps that become monsters), control vs ownership and opponent's cards | Beyond original plan; add to 3/4 | `engine.ts:1628` explicitly omits columns; `catalogue.ts:199-230` actions lack these |
| TOKEN / CTR / EQ-MON / DICE | Token identity, counters, monsters as Equips, dice | Beyond original plan | `catalogue.ts:199-230`, `:372-475`; no general facilities of these kinds |

RITUAL, FUS-EFF, FUS-MAT, XYZ, LINK, PEND, TOON, MONSPELL, EQ-MON and DICE do not occur here; ZONE only through Infinite Impermanence. Among the 101 cards still to build, the most frequent needs are VOCAB (92), TRIG (63) and CHAIN (51), then LOCK (44), GY (40), BANISH (35) and **SYN (31)**. SYN here means the Synchro procedures listed in §0, which this deck needs far more than any of the 14 earlier archetypes. 8 cards are `card-deep`: Nibiru, The Great Gallant Bandit, Infinite Impermanence, Stardust Trail (Stardust Token), Bystial Dis Pater (Summons a banished monster of either player), Kurikara Divincarnate, Black Garden and Synchro World (Signal Counters).

## 2. Coverage (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Stardust Synchro | 7 | 88 | 4 | 6 | 78 | 5% | 11% | 19 | 5 / 6 / 96 of 107 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): L1 44 cards, 3 automatic, 3 partial, 9 of 60 copies; L2 42 cards, 2 / 3, 9 of 60; L3 35 cards, 3 / 5, 18 of 55; L4 43 cards, 2 / 4, 9 of 55; L5 40 cards, 2 / 4, 12 of 58; L6 41 cards, 2 / 0, 3 of 55; L7 44 cards, 4 / 3, 12 of 59. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started. L6, the most Stardust-heavy list, has only Junk Synchron and Reinforcement of the Army.

## 3. Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side)

"Of the 14" counts archetypes in the earlier notes' samples: the main note's 11 (Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast; Blitzclique excluded, as there), Blue-Eyes, Dark Time Wizard, and Dark Magician Light and Darkness Ritual. Every card here is also played by this deck. Ranked by that count, then by name. Rows 1–16 are the shared staples (hand traps, Solemns, Typhoon, Pot of Sloth, Evenly Matched, Harpie's Feather Duster); the rest are side cards, generic Spells and the generic Synchros other decks splash (Crimson Dragon, Cosmic Blazar Dragon, Zalen, Black Rose Dragon, Stardust Sifr Divine Dragon, Golden Cloud Beast - Malong, Chaos Angel).

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | 12 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | Skull Meister | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 8 | Typhoon | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 9 | The Great Gallant Bandit | 10 | Angelechy, Elfnote, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 10 | Pot of Sloth | 9 | Angelechy, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | LOCK, VOCAB | Step 3 | script |
| 11 | Effect Veiler | 8 | Angelechy, Elfnote, Toon, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Partial | CHAIN | Step 1 | script |
| 12 | Solemn Accusation | 8 | Toon, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 13 | Evenly Matched | 7 | Toon, Artmage, Radiant Typhoon, Branded Dracotail, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 14 | Harpie's Feather Duster | 7 | Toon, Unchained, Sky Striker, Branded Dracotail, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 15 | Solemn Judgment | 7 | Elfnote, Toon, Unchained, Sky Striker, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 16 | Infinite Impermanence | 6 | Angelechy, Elfnote, Toon, Branded, Blue-Eyes, Dark Time Wizard | Partial | ZONE | beyond plan | card-deep |
| 17 | PSY-Frame Driver | 4 | Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent — data only | — | — | data |
| 18 | PSY-Framegear Gamma | 4 | Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |
| 19 | Chaos Angel | 3 | Angelechy, Toon, Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |
| 20 | Forbidden Droplet | 3 | Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 21 | Ghost Belle & Haunted Mansion | 3 | Sacred Beast, Blue-Eyes, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 22 | Terraforming | 3 | Angelechy, Toon, Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 23 | Triple Tactics Thrust | 3 | Unchained, Sky Striker, Dark Time Wizard | Absent | VOCAB | Step 3 | script |
| 24 | Adamancipator Risen - Dragite | 2 | Elfnote, Dark Time Wizard | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 25 | Forbidden Crown | 2 | Sky Striker, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 26 | Psychic End Punisher | 2 | Elfnote, Blue-Eyes | Absent | LOCK, VOCAB | Step 3 | script |
| 27 | Reinforcement of the Army | 2 | Sky Striker, Dark Time Wizard | Scripted & automatic | — | — | — |
| 28 | Black Rose Dragon | 1 | Elfnote | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 29 | Bystial Magnamhut | 1 | Blue-Eyes | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |
| 30 | Cosmic Blazar Dragon | 1 | Blue-Eyes | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script |
| 31 | Crimson Dragon | 1 | Blue-Eyes | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |
| 32 | Different Dimension Ground | 1 | Dark Time Wizard | Absent | CHAIN, LOCK, BANISH | Step 3 | script |
| 33 | Foolish Burial | 1 | Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 34 | Fydraulis Harmonia | 1 | Blue-Eyes | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |
| 35 | Golden Cloud Beast - Malong | 1 | Blue-Eyes | Absent | TRIG, VOCAB, SYN | Step 4 | script |
| 36 | Lightning Storm | 1 | Sky Striker | Absent | VOCAB | Step 3 | script |
| 37 | Stardust Sifr Divine Dragon | 1 | Blue-Eyes | Absent | CHAIN, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script |
| 38 | Zalen the Shackled Dragon | 1 | Elfnote | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |

**New to the audits (69 cards):** the Synchron Tuners (Stardust, Scrap, Assault, Jet, Starjunk, Junk, Revolution, Wheel, Steam, Accel Synchron), the Junk monsters (Junk Meister, Junk Armor, Junk Converter), the Warriors (Assault Sonic, Full-Speed), Stardust Trail, Crossroad Sonic Chick, Lefty and Righty Driver, Psi-Reflector, Omni Dragon Brotaur, Converging Wills Dragon, Majestic Dragon, Bystial Druiswurm, Kurikara Divincarnate; the Spells and Traps (Synchro Fellowship, Synchro Rumble, Junk Signal, Synchro Overtake, Stardust Illumination, Duel Evolution - Assault Zone, Synchro Emergency, Heavy Slump, Emergency Teleport, Dark Ruler No More, Tuning, Arrive in Light, Black Garden, Synchro World, Majestic Mirage, Gravity Collapse); and the Extra Deck (Stardust Dragon, Accel Synchro Stardust Dragon, Stardust Dragon - Victim Sanctuary, Stardust Warrior, Stardust Charge Warrior, Shooting Star Dragon, Shooting Majestic Star Dragon, Majestic Star Dragon, Cosmic Quasar Dragon, Shooting Quasar Dragon, Shooting Riser Dragon, Red Supernova Dragon, Red Hypernova Dragon, Crimson Dragon Quetzalcoatl, Bystial Dis Pater, Junk Speeder, Scrap Warrior, Jet Warrior, Junk Warrior Extreme, T.G. Hyper Librarian, Garden Rose Maiden, Virtual World Kyubi - Shenshen, Silvera, Rciela, Juraishin, Rage Rose Witch, Arms of Genex Return Zero, Draco Berserker of the Tenyi).

## 4. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

Lists (each with its kind; all fetched from YGOPRODeck on 2026-11-23):

1. **Tournament list (curated).** [Synchron](https://ygoprodeck.com/deck/synchron-744497): YGOPRODeck "Tournament Meta Decks" (TCG), Christchurch WCQ Regional - November 7th 2026, **Top 4** (15 players); 45 Main / 15 Extra / 15 Side. The only current-format Stardust/Synchron tournament list YGOPRODeck has; the list [trainer-meta-decks.md](./trainer-meta-decks.md) §4.9 used for Yusei.
2. **Tournament list, player-reported (not curated).** [Synchron](https://ygoprodeck.com/deck/synchron-740963): a user's deck in YGOPRODeck's "Meta Decks" category whose primer reads "10th Place Matamoros Regional Qualifier October 24 2026"; uploaded about three weeks before observation. YGOPRODeck's curated records have the Matamoros WCQ Regional of October 24, 2026 (e.g. [741518](https://ygoprodeck.com/deck/ars-magna-elfnote-741518), Top 8), but only its Top 8; the 10th place is not corroborated. 45 / 15 / 15.
3. **Community build.** [Synchron November 2026](https://ygoprodeck.com/deck/synchron-november-2026-745449): "Non-Meta Decks" category, uploaded about four days before observation (≈ November 19); primer "Speen into first place" (no event named). Same author's [October list](https://ygoprodeck.com/deck/synchron-october-2026-741765) is superseded by it. 40 / 15 / 15.
4. **Community build.** [Synchron Deck October 2026 (Post MAMO)](https://ygoprodeck.com/deck/synchron-deck-october-2026-post-mamo-743503): "Non-Meta Decks", uploaded about a week before observation; primer "the deck I run right now". 40 / 15 / 15.
5. **Community build.** [Synchron Pure](https://ygoprodeck.com/deck/synchron-pure-743416): "Non-Meta Decks", uploaded about two weeks before observation; no primer. 43 / 15 / 15.
6. **Community build (Stardust-heavy).** [stardust-synchron post MaMo](https://ygoprodeck.com/deck/stardust-synchron-post-mamo-730615): "Meta Decks" category, first uploaded about two months before observation, last edited 2026-11-19 (its deck history). 40 / 15 / 5 (an incomplete Side Deck, as recorded).
7. **Community build (Stardust-heavy).** [Junk From The Stars](https://ygoprodeck.com/deck/junk-from-the-stars-741623): "Non-Meta Decks", uploaded about three weeks before observation. 44 / 15 / 0 (no Side Deck).

| Card | Copies (L1/L2/L3/L4/L5/L6/L7) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Foolish Burial | 0/0/0/0/0/0/1 | Scripted & automatic | — | — | — | Data `mill` of any monster (`cards.ts:331`), resolved at `engine.ts:1058-1065`. |
| Junk Synchron | 2/1/1/2/1/2/2 (main+side) | Scripted & automatic | — | — | — | `summonRevive: { maxLevel: 2 }` (`cards.ts:220`), resolved at `engine.ts:2019-2036`: right after its Normal Summon, Special Summon a Level 2 or lower monster from your own GY in Defense Position with its effects negated; usable as the named Tuner of Junk Warrior (`synchroTuner`, `engine.ts:2158`). Tested at `packages/cards/test/engine-masters.test.ts:172-188`. The Synchros here that need a "Synchron" or this named Tuner (Junk Speeder, Junk Warrior Extreme) are absent. |
| Reinforcement of the Army | 1/1/1/1/1/1/1 | Scripted & automatic | — | — | — | `search-pick` pool `low-warrior` (`cards.ts:368`; Level 4 or lower Warrior, `catalogue.ts:334`). Its targets here: Junk Synchron (present) and the absent Junk Meister, Starjunk Synchron, Junk Armor, Junk Converter, Assault Sonic Warrior and Full-Speed Warrior. |
| Terraforming | 1/0/1/0/0/0/1 | Scripted & automatic | — | — | — | Data `search` of a Field Spell (`cards.ts:328`). In the three lists that play it (L1, L3, L7) its only target is Duel Evolution - Assault Zone, which is absent. |
| Harpie's Feather Duster | 0/1/0/0/0/0/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3/3/3/0/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/0/1/1/1/0/1 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/0/3/2/0/0/0 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 2/1/3/2/3/0/0 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 0/0/3/2/0/0/0 (main+side) | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 0/3/3/2/3/0/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Arrive in Light | 0/0/0/0/0/1/0 | Absent | TRIG, LOCK, VOCAB, CONT | Step 3 | script | Places a card on top of the Deck. |
| Assault Sonic Warrior | 1/1/1/1/1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Assault Synchron | 1/1/1/1/1/2/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Lock lasts while it is face-up; GY trigger on a Dragon Synchro being Tributed or banished. |
| Black Garden | 0/0/0/0/0/1/0 | Absent | TRIG, VOCAB, GY, CONT, TOKEN, CONTROL | Step 3 + beyond plan | card-deep | Gives Tokens to the opponent's field. |
| Bystial Druiswurm | 0/1/0/1/0/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Bystial Magnamhut | 0/1/0/1/0/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Converging Wills Dragon | 0/0/0/0/0/1/0 | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script | Name becomes "Majestic Dragon" on the field and in the GY; draw trigger. |
| Crossroad Sonic Chick | 0/0/0/0/0/0/1 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Duel Evolution - Assault Zone | 3/3/3/1/1/3/3 | Absent | LOCK, VOCAB, GY, CONT | Step 3 | script | Its "/Assault Mode" effects need Assault Mode Activate, which no list plays. The only Field Spell of the lists that play Terraforming (L1, L3, L7). |
| Emergency Teleport | 3/3/0/3/3/0/0 (main+side) | Absent | TRIG, VOCAB, BANISH | Step 3 | script | The Summon itself fits data `special` (`catalogue.ts:203`); the End Phase banishment does not. |
| Forbidden Droplet | 3/2/0/2/0/0/0 (main+side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Full-Speed Warrior | 1/1/1/1/1/1/1 | Absent | TRIG, VOCAB | Step 3 | script | ATK gain only during your Battle Phase, for monsters that mention "Junk Warrior". |
| Fydraulis Harmonia | 0/0/0/0/3/0/0 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 2/0/2/2/0/0/0 (main+side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Heavy Slump | 1/1/0/0/1/0/0 (main+side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Jet Synchron | 1/1/1/1/1/2/1 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script | "Sent to the GY as Synchro Material" trigger. |
| Junk Armor | 1/2/1/1/1/1/1 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | "Added to your hand, except by drawing" trigger; continuous protection from targeting. |
| Junk Converter | 0/0/0/0/0/2/3 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Junk Meister | 3/3/3/3/3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Reveal-a-Synchro cost; search a "Junk" card; lower a Level by up to 2. |
| Junk Signal | 3/2/2/2/2/3/2 | Absent | CHAIN, LOCK, VOCAB, GY | Step 3 | script | Second mode answers a response to your Synchro Monster's effect. |
| Lefty Driver | 0/0/0/0/0/0/1 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Majestic Dragon | 0/0/0/0/0/1/0 | Absent | SYN | Step 4 | script | Only a material restriction. |
| Mulcharmy Purulia | 0/3/3/2/3/0/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 2/0/0/0/0/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Omni Dragon Brotaur | 0/0/0/0/0/1/0 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Psi-Reflector | 1/1/0/1/1/0/0 (main+side) | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Revolution Synchron | 1/1/0/1/0/1/0 | Absent | LOCK, VOCAB, GY, SYN | Step 4 | script | Synchro Material from the hand; once per Duel; Level becomes 1. |
| Righty Driver | 0/0/0/0/0/0/2 | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script |  |
| Scrap Synchron | 1/1/1/1/1/2/1 | Absent | VOCAB, GY, BANISH, SYN | Step 4 | script | Substitutes for any "Synchron" Tuner; Synchro Material from the hand; destruction replacement. |
| Stardust Illumination | 1/0/0/0/0/1/1 | Absent | VOCAB, GY, BANISH | Step 3 | script |  |
| Stardust Synchron | 2/2/2/2/2/3/2 | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Search of a Spell/Trap that mentions "Stardust Dragon" (a `mentions` filter, as Magician's Rod uses); Tribute cost; Synchro-only Extra Deck lock. |
| Stardust Trail | 1/0/0/0/0/1/1 | Absent | TRIG, VOCAB, GY, BANISH, TOKEN | Step 3 + beyond plan | card-deep | Stardust Token. |
| Starjunk Synchron | 1/1/1/1/1/1/1 | Absent | LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script |  |
| Steam Synchron | 0/0/0/1/0/1/0 (main+side) | Absent | CHAIN, SYN | Step 4 | script | Synchro Summon during the opponent's Main Phase. |
| Synchro Emergency | 0/3/3/3/3/3/2 (main+side) | Absent | CHAIN, HAND, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script | Trap from the hand; Synchro Summon by effect. |
| Synchro Fellowship | 1/1/2/1/1/2/1 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script | Adds 2 different cards at once, then a discard; GY effect grants an extra Normal Summon. |
| Synchro Overtake | 1/0/0/0/0/0/0 | Absent | LOCK, VOCAB, GY | Step 3 | script | Reads the materials printed on a revealed Synchro Monster. |
| Synchro Rumble | 1/1/0/1/1/1/1 | Absent | LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Synchro World | 0/0/0/0/0/1/0 | Absent | TRIG, VOCAB, GY, CONT, CTR | Step 3 + beyond plan | card-deep | Signal Counters. |
| Triple Tactics Thrust | 3/1/0/0/3/0/0 (main+side) | Absent | VOCAB | Step 3 | script |  |
| Tuning | 0/0/0/0/0/0/1 | Absent | VOCAB | Step 3 | script | The search fits data `search` with `archetype` + `tuner` (`catalogue.ts:168-175`, `:201`); "send the top card of your Deck to the GY" has no action. |
| Wheel Synchron | 1/1/0/1/1/1/1 | Absent | LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script | May be treated as a non-Tuner; grants an immediate extra Normal Summon. |
| Accel Synchro Stardust Dragon | 1/1/1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script | Quick Effect Synchro Summon in the Main Phase; a Summon "treated as a Synchro Summon". |
| Accel Synchron | 0/0/0/0/0/1/0 (extra) | Absent | CHAIN, LOCK, VOCAB, SYN | Step 4 | script | Synchro Tuner; Synchro Summon during the opponent's Main Phase. |
| Arms of Genex Return Zero | 0/0/0/1/0/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script |  |
| Black Rose Dragon | 0/1/0/1/1/0/0 (extra) | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Bystial Dis Pater | 1/1/1/1/1/0/1 (extra+side) | Absent | CHAIN, VOCAB, BANISH, SYN, CONTROL | Step 4 + beyond plan | card-deep | Summons a banished monster of either player to your field. |
| Chaos Angel | 1/0/0/0/0/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Cosmic Blazar Dragon | 1/0/0/0/0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script |  |
| Cosmic Quasar Dragon | 0/0/0/0/0/1/0 (extra) | Absent | CHAIN, VOCAB, BANISH, SYN | Step 4 | script |  |
| Crimson Dragon | 1/1/1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Crimson Dragon Quetzalcoatl | 0/0/1/0/0/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Garden Rose Maiden | 1/0/0/1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Golden Cloud Beast - Malong | 0/0/0/0/1/0/0 (extra) | Absent | TRIG, VOCAB, SYN | Step 4 | script |  |
| Jet Warrior | 1/1/1/0/1/0/1 (extra+side) | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script | Named Tuner "Jet Synchron" fits `synchroTuner`. |
| Junk Speeder | 1/1/1/1/1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script | "1 'Synchron' Tuner": an archetype Tuner, not one named card. |
| Junk Warrior Extreme | 0/0/0/0/0/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script | Named Tuner "Junk Synchron" fits `synchroTuner`; its own Summon of a "Junk" Synchro is "treated as a Synchro Summon". |
| Juraishin, the Cursed Thunder God | 0/0/1/1/1/0/0 (extra+side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Majestic Star Dragon | 0/1/0/0/0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, SYN | Step 4 | script | Copies an opponent's monster's effect: harder than its tags suggest. |
| Psychic End Punisher | 0/1/1/1/1/0/0 (extra+side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Rage Rose Witch | 0/0/0/1/1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Rciela, Sinister Soul of the White Forest | 0/0/1/0/0/0/0 (extra) | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Red Hypernova Dragon | 1/0/0/0/0/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script | 4 Tuners + Synchro non-Tuners. |
| Red Supernova Dragon | 1/0/0/0/0/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, BANISH, SYN | Step 4 | script | 3 Tuners + Synchro non-Tuners. |
| Scrap Warrior | 1/1/1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script | Named Tuner "Scrap Synchron" fits `synchroTuner` (`catalogue.ts:447`). |
| Shooting Majestic Star Dragon | 0/1/1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script | "Majestic Dragon" + non-Tuners including a Dragon Synchro. |
| Shooting Quasar Dragon | 0/0/0/0/0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Shooting Riser Dragon | 0/0/0/0/0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Shooting Star Dragon | 0/0/0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, SYN | Step 4 | script | "1 Tuner Synchro Monster + 'Stardust Dragon'". |
| Silvera, Wolf Tamer of the White Forest | 0/1/1/0/0/0/0 (extra) | Absent | TRIG, VOCAB | Step 3 | script |  |
| Stardust Charge Warrior | 0/1/0/1/0/1/0 (extra+side) | Absent | TRIG, VOCAB | Step 3 | script |  |
| Stardust Dragon | 1/1/1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script | Art and printed facts only (`card-art.ts:83`), no `cards.ts` entry. Its plain 1 Tuner + 1+ non-Tuner recipe fits Academy's Synchro procedure (`engine.ts:2154-2163`); its Quick negation of destroying effects, Tribute cost and End Phase return do not exist. |
| Stardust Dragon - Victim Sanctuary | 1/0/2/1/0/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script | Summons a "Stardust" Synchro from the Extra Deck, not as a Synchro Summon. |
| Stardust Sifr Divine Dragon | 0/0/0/0/0/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, GY, BANISH, SYN | Step 4 | script |  |
| Stardust Warrior | 0/0/1/1/0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, SYN | Step 4 | script | Synchro Tuner + Synchro non-Tuners; negates a Summon. |
| T.G. Hyper Librarian | 1/1/0/0/1/0/0 (extra) | Absent | TRIG, VOCAB | Step 3 | script | Watches any player's Synchro Summon; `specialSummoned` watches only yours, with no Summon type (`catalogue.ts:240`). |
| Virtual World Kyubi - Shenshen | 1/0/0/0/1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script | Replaces every "sent from the field to the GY" with banishment. |
| Zalen the Shackled Dragon | 0/1/1/1/1/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Adamancipator Risen - Dragite | 0/0/0/1/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Dark Ruler No More | 1/0/0/0/0/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Different Dimension Ground | 0/1/0/0/0/0/0 (side) | Absent | CHAIN, LOCK, BANISH | Step 3 | script |  |
| Draco Berserker of the Tenyi | 0/0/0/1/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Evenly Matched | 3/1/0/0/3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Forbidden Crown | 0/0/0/1/0/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Gravity Collapse | 0/0/0/0/1/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script | Counter Trap that negates a Summon. |
| Kurikara Divincarnate | 2/0/0/0/0/0/0 (side) | Absent | TRIG, VOCAB, GY, CONTROL | Step 3 + beyond plan | card-deep | Tributes the opponent's monsters; Summons from the opponent's GY. |
| Lightning Storm | 2/0/0/0/0/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Majestic Mirage | 0/0/0/0/1/0/0 (side) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, CONT | Step 3 | script |  |
| Pot of Sloth | 0/3/0/0/0/0/0 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| PSY-Frame Driver | 0/0/0/0/1/0/0 (side) | Absent — data only | — | — | data | Normal Monster; not in `cards.ts`, `card-art.ts` or `card-art.json` (tag kept from the main note). |
| PSY-Framegear Gamma | 0/0/0/0/1/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Skull Meister | 2/0/3/0/2/0/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Accusation | 0/3/0/0/0/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 0/0/1/0/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 0/2/0/0/0/0/0 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Typhoon | 0/2/3/0/0/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

## 5. Unverified, exclusions and interpretation limits

1. **One tournament list.** Under the owner's rule, recent tournament lists come first; there is exactly one current Stardust/Synchron tournament list (L1, Top 4 of a 15-player event). L2's result is the player's own claim on their deck page. L3–L7 are community builds: their strength is not evidenced by results. They were kept because they play the same core as L1 (L2–L5) or the Stardust package that fits Yusei (L6, L7). If the pool must hold only tournament lists, it is L1 (and L2, if a self-reported placement counts).
2. **No pro list or deck guide was found that could be used.** The [TCG Contender Synchron guide](https://tcgcontender.com/yugioh/decks/tcg/synchron) (search snippet: updated November 2026, tier 4) refused both a direct fetch and the fetch tool (HTTP 403, Cloudflare), so its list could not be read or checked. [KotaCards' Synchron page](https://kotacards.com/deck.php?d=Synchron) shows the Knoxville June list, which is illegal now (§0). Dueling Nexus pages are user decks on older banlists (one plays Maxx "C"). Master Duel Meta and Duel Links Meta lists are for other games with other lists. Genesys, Edison, Domain and OCG lists are other formats.
3. **Community builds left out:** [741722](https://ygoprodeck.com/deck/synchron-stardust-engine-741722) plays Level Eater (Forbidden); [745561](https://ygoprodeck.com/deck/synchron-745561), [744214](https://ygoprodeck.com/deck/synchron-fun-744214), [741670](https://ygoprodeck.com/deck/stardust-synchrons-741670), [740865](https://ygoprodeck.com/deck/stardust-synchron-740865) and [744196](https://ygoprodeck.com/deck/stardust-junker-744196) are legal casual builds (Tuning/Doppelwarrior or Stardust Wurm engines, no Side Deck or no hand traps) that lack L1's core; 741765 is superseded by L3. Older and anime-themed "Yusei" decks were not considered (pre-format, or not Advanced Format).
4. **Dates.** YGOPRODeck shows only relative ages for user decks ("3 weeks ago"); the approximate dates in §4 are derived from them and the observation date. L6's last edit date comes from its deck history.
5. **Per-card mechanism tags are triage (ours).** The 38 cards already audited keep their earlier tags verbatim, including the main note's acknowledged keyword-assisted over- and under-tagging. The 69 new tags were assigned by reading each text. They are judgment calls. Examples: "you cannot Special Summon from the Extra Deck, except Synchro Monsters" is tagged LOCK; a Level change and a "mentions" filter are VOCAB; "sent to the GY as Synchro Material" and "if a monster is Synchro Summoned" are TRIG; any Synchro procedure Academy's `extraSummon` cannot check (archetype Tuner, Tuner substitute, hand material, Synchro Tuner material, several Tuners, Synchro Summon by effect or in the opponent's turn, "treated as a Synchro Summon", "must first be Synchro Summoned") is SYN; Stardust Dragon has no SYN because its recipe already fits. Majestic Star Dragon's copying of an opponent's effect is harder than its tags suggest.
6. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§0, "Reading the audit"), but no new conformance tests were written. Scripted & automatic is an operational classification, not certification against every Konami ruling.
7. **Card API normalization:** all 108 passcodes of the seven lists resolved through `card_images` to 107 English names, with no unknown IDs.
8. **Source independence:** L1's event, date, placement and player count are YGOPRODeck's curated record, not corroborated with organizers; L2–L7 are user uploads. Player and user names are not reproduced here.
9. **Copy counts:** rows combine zones, and Appendix A keeps zone-specific counts. Coverage counts unique names, not copies. The shared ranking counts archetypes, not decks.

## Sources and reproducibility

Fetched 2026-11-23. Deck URL, kind, event, date and placement are attached to each selected list in §4.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=<name>&_sft_category=Tournament%20Meta%20Decks` for `Synchron` (offsets 0–60), `Synchro`, `Stardust`, `Stardust Dragon`, `Junk`, `Junk Speeder`, `Yusei`; the recent scan used the same endpoint without `name`, `offset=0,20,…,400`; the fallback search used it without `_sft_category` for `Stardust`, `Synchron`, `Junk`, `Yusei` (offsets 0–40). Event and placement come from each record's `deck_description` and `tournament*` fields, and for L2/L6 from the deck page. Card API: `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` (full database, for passcodes, texts, types and TCG release dates); Appendix A links each name to an exact-name query. No downloaded content was executed.
- Web (fallback search, §5): [TCG Contender Synchron guide](https://tcgcontender.com/yugioh/decks/tcg/synchron) (403), [KotaCards Synchron decks](https://kotacards.com/deck.php?d=Synchron), [Dueling Nexus "Synchron Deck 2026"](https://duelingnexus.com/blog/synchron-deck-2026/).
- Repo primary sources: `packages/engine/src/{engine,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, the tests `packages/cards/test/engine-{masters,effects,hand,open}.test.ts`, and Academy's own Yusei deck in `apps/academy-ygo/src/lib/junior/play/master-decks.ts:64-68`. The earlier notes' tags were read from their §4 tables (Blitzclique appendix excluded).

## 6. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first finish the Step 1–2 foundations behind the shared Partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For this deck specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | Steps 1–2 as in the main note, plus Synchro event provenance: "sent to the GY as Synchro Material", "if a monster is Synchro Summoned", "if a monster you control is Tributed", delayed "banish it when it leaves the field" | Ash, Droll, Ogre, Fuwalos, Veiler; Jet Synchron's search, Assault Sonic Warrior's ATK, T.G. Hyper Librarian, Stardust Trail's Summon | Purulia, Ghost Belle, Nibiru (after Tokens) |
| 1 | Step 3 vocabulary: a "mentions [card]" filter in `CardFilter` (the predicate exists, `catalogue.ts:504`), Level changes, reveal/Tribute costs, the "Extra Deck except Synchro Monsters" lock, multi-card adds, an extra Normal Summon, top-of-Deck mill | **The Junk engine:** Junk Meister, Stardust Synchron, Full-Speed Warrior, Junk Armor, Assault Synchron, Synchro Fellowship, Synchro Rumble, Junk Signal, Tuning; and **Stardust Dragon** (Quick negation with a Tribute cost, End Phase return), Scrap Warrior, Jet Warrior | Most are in all seven lists |
| 2 | Step 4 Synchro procedures: archetype Tuners, Tuner substitutes, hand materials, treat-as-non-Tuner, Synchro Tuners as material, several Tuners, Synchro Summon by effect and in the opponent's Main Phase, "treated as a Synchro Summon", "must first be Synchro Summoned" | Junk Speeder, Scrap/Starjunk/Wheel/Revolution Synchron, Accel Synchro Stardust Dragon, Synchro Emergency, Crimson Dragon; then the Stardust boss line: Shooting Star, Stardust Warrior, Shooting Majestic Star, Victim Sanctuary, the Quasars | Per card |
| 3 | `card-deep` extensions | Stardust Trail (Token), Bystial Dis Pater, Black Garden, Synchro World, Kurikara, Nibiru, The Great Gallant Bandit, Infinite Impermanence's column | Only where a chosen list needs them |

**For Yusei, the realistic target is L1's core.** The 19 cards in all seven lists are the Junk engine, Stardust Synchron and five Synchros; after Priority 1 the engine could play its Main Deck effects, but not its Summons: even Junk Speeder, Accel Synchro Stardust Dragon and Crimson Dragon (in all seven) need Priority 2. Stardust Dragon itself needs only Priority 1, because its recipe already fits. The Stardust-heavy builds (L6, L7) add more Priority 2 work (Shooting Star, Stardust Warrior, Quasar and Majestic Dragons) and two `card-deep` cards (Black Garden, Synchro World in L6; Stardust Trail in L6 and L7). Those are sample counts, not format-wide play rates.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … L7, in the list order of §4. Type labels are API types; they are not proof of summon support.

### Stardust Synchro — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S | L5 M/E/S | L6 M/E/S | L7 M/E/S |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Accel Synchro Stardust Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accel%20Synchro%20Stardust%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Accel Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accel%20Synchron) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Adamancipator Risen - Dragite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Adamancipator%20Risen%20-%20Dragite) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Arms of Genex Return Zero](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Arms%20of%20Genex%20Return%20Zero) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Arrive in Light](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Arrive%20in%20Light) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 3/0/0 |
| [Assault Sonic Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Assault%20Sonic%20Warrior) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Assault Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Assault%20Synchron) | Tuner Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 | 1/0/0 |
| [Black Garden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Garden) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Black Rose Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Rose%20Dragon) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Bystial Dis Pater](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Bystial%20Dis%20Pater) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/1 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Bystial Druiswurm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Bystial%20Druiswurm) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Bystial Magnamhut](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Bystial%20Magnamhut) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Chaos Angel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Angel) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Converging Wills Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Converging%20Wills%20Dragon) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Cosmic Blazar Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Blazar%20Dragon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Cosmic Quasar Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Quasar%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Crimson Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crimson%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Crimson Dragon Quetzalcoatl](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crimson%20Dragon%20Quetzalcoatl) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Crossroad Sonic Chick](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crossroad%20Sonic%20Chick) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Dark Ruler No More](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Ruler%20No%20More) | Spell Card | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Different Dimension Ground](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Different%20Dimension%20Ground) | Trap Card | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Draco Berserker of the Tenyi](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Draco%20Berserker%20of%20the%20Tenyi) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/1 | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 |
| [Duel Evolution - Assault Zone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Duel%20Evolution%20-%20Assault%20Zone) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 1/0/0 | 1/0/0 | 3/0/0 | 3/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Emergency Teleport](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Emergency%20Teleport) | Spell Card | 0/0/3 | 3/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/3 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Foolish Burial](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Forbidden Crown](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Crown) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 3/0/0 | 2/0/0 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Full-Speed Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Full-Speed%20Warrior) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Fydraulis Harmonia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fydraulis%20Harmonia) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Garden Rose Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garden%20Rose%20Maiden) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 2/0/0 | 0/0/0 | 0/0/2 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 2/0/0 | 1/0/0 | 3/0/0 | 1/0/1 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Golden Cloud Beast - Malong](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Golden%20Cloud%20Beast%20-%20Malong) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Gravity Collapse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gravity%20Collapse) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Heavy Slump](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Heavy%20Slump) | Trap Card | 1/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 0/0/0 | 0/0/0 | 3/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Jet Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jet%20Synchron) | Tuner Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 | 1/0/0 |
| [Jet Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jet%20Warrior) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/1/0 |
| [Junk Armor](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Armor) | Effect Monster | 1/0/0 | 2/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Junk Converter](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Converter) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 | 3/0/0 |
| [Junk Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Meister) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Junk Signal](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Signal) | Spell Card | 3/0/0 | 2/0/0 | 2/0/0 | 2/0/0 | 2/0/0 | 3/0/0 | 2/0/0 |
| [Junk Speeder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Speeder) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Junk Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Synchron) | Tuner Monster | 1/0/1 | 1/0/0 | 1/0/0 | 1/0/1 | 1/0/0 | 2/0/0 | 2/0/0 |
| [Junk Warrior Extreme](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junk%20Warrior%20Extreme) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Juraishin, the Cursed Thunder God](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Juraishin%2C%20the%20Cursed%20Thunder%20God) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Kurikara Divincarnate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kurikara%20Divincarnate) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Lefty Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lefty%20Driver) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Lightning Storm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lightning%20Storm) | Spell Card | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Majestic Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Majestic%20Dragon) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Majestic Mirage](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Majestic%20Mirage) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Majestic Star Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Majestic%20Star%20Dragon) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 0/0/0 | 3/0/0 | 3/0/0 | 2/0/0 | 3/0/0 | 0/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/3 | 2/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Omni Dragon Brotaur](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Omni%20Dragon%20Brotaur) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Psi-Reflector](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Psi-Reflector) | Tuner Monster | 0/0/1 | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [PSY-Frame Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Frame%20Driver) | Normal Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [PSY-Framegear Gamma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Gamma) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 |
| [Psychic End Punisher](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Psychic%20End%20Punisher) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/1 | 0/0/1 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Rage Rose Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rage%20Rose%20Witch) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Rciela, Sinister Soul of the White Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rciela%2C%20Sinister%20Soul%20of%20the%20White%20Forest) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Red Hypernova Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Red%20Hypernova%20Dragon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Red Supernova Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Red%20Supernova%20Dragon) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Reinforcement of the Army](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Reinforcement%20of%20the%20Army) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Revolution Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Revolution%20Synchron) | Tuner Monster | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Righty Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Righty%20Driver) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 2/0/0 |
| [Scrap Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Scrap%20Synchron) | Tuner Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 | 1/0/0 |
| [Scrap Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Scrap%20Warrior) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Shooting Majestic Star Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shooting%20Majestic%20Star%20Dragon) | Synchro Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Shooting Quasar Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shooting%20Quasar%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Shooting Riser Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shooting%20Riser%20Dragon) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Shooting Star Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shooting%20Star%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Silvera, Wolf Tamer of the White Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Silvera%2C%20Wolf%20Tamer%20of%20the%20White%20Forest) | Synchro Tuner Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Stardust Charge Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Charge%20Warrior) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Stardust Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Stardust Dragon - Victim Sanctuary](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Dragon%20-%20Victim%20Sanctuary) | Synchro Monster | 0/1/0 | 0/0/0 | 0/2/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Stardust Illumination](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Illumination) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 |
| [Stardust Sifr Divine Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Sifr%20Divine%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 |
| [Stardust Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Synchron) | Tuner Monster | 2/0/0 | 2/0/0 | 2/0/0 | 2/0/0 | 2/0/0 | 3/0/0 | 2/0/0 |
| [Stardust Trail](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Trail) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 |
| [Stardust Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Stardust%20Warrior) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Starjunk Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Starjunk%20Synchron) | Tuner Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Steam Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Steam%20Synchron) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/1 | 0/0/0 |
| [Synchro Emergency](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Synchro%20Emergency) | Trap Card | 0/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/3 | 2/0/0 |
| [Synchro Fellowship](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Synchro%20Fellowship) | Spell Card | 1/0/0 | 1/0/0 | 2/0/0 | 1/0/0 | 1/0/0 | 2/0/0 | 1/0/0 |
| [Synchro Overtake](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Synchro%20Overtake) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Synchro Rumble](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Synchro%20Rumble) | Spell Card | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Synchro World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Synchro%20World) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [T.G. Hyper Librarian](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=T.G.%20Hyper%20Librarian) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Terraforming](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Terraforming) | Spell Card | 1/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 3/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Tuning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tuning) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/0 | 0/0/2 | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Virtual World Kyubi - Shenshen](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Virtual%20World%20Kyubi%20-%20Shenshen) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Wheel Synchron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Wheel%20Synchron) | Tuner Monster | 1/0/0 | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Zalen the Shackled Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Zalen%20the%20Shackled%20Dragon) | Synchro Tuner Monster | 0/0/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 |
