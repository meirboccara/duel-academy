# November meta decks: engine coverage

> **Date of observation:** 2026-11-22. Working tree on `main`, HEAD `7d5587d`. Only this research note was added; no code, commits, branches or publication. Downloaded data and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Owner's request (verbatim):** "Research every top meta deck recently. Angelechy, Elfnote, Toon, Artmage, Unchained, Light and darkness ritual, Radiant typhoon, Sky striker, Branded Dracotail, Branded, Check, Sacred Beast. Search at least 3 decks and at most 10 decks per archetype on the current format. Check every card and see if the engine handle every of those cards."
>
> **Sourcing rule:** tournament metadata and compositions below are YGOPRODeck's own curated Tournament Meta Decks records; printed texts/types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami. Repo claims cite `file:line`. Mechanic classification, estimates and priorities are **(ours)**. Unconfirmed points are explicitly separated below.
>
> **Builds on:** [meta-archetypes-coverage.md](./meta-archetypes-coverage.md), [duel-engine-meta-cards.md](./duel-engine-meta-cards.md), [trainer-meta-decks.md](./trainer-meta-decks.md), and [hand-cards-and-commands.md](./hand-cards-and-commands.md). This refresh uses current package paths and code, not their earlier coverage numbers. The engine-plan note includes a status section dated 2026-11-23; this note does not assume that date is today's state.

## 0. Findings and scope

**No complete tournament deck in this sample is playable automatically.** There are **33 selected lists across the 11 identified requested archetypes**, exactly three per archetype, and **345 identifiable unique cards including Side Decks: 8 scripted & automatic, 8 present but partial, 329 absent**. This is unique-card coverage, not probability of winning, copy-weighted coverage, or percentage of the whole archetype's printed cards. Side cards are included in the detailed tables and all-card totals.

**“Check” remains unidentified.** No confident substitution was made. An additional three **Blitzclique** lists are audited separately as a speculative candidate, excluded from the primary coverage and shared-card rankings. “Check” therefore has zero verified lists; each of the other eleven has three. The sampled lists are recent curated tops, not proof that every archetype is Tier 1 or an exhaustive census of the entire meta.

### Current TCG format and selection

Konami's [current-list index](https://www.yugioh-card.com/en/limited/) points to the [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/). The latter explicitly says “Effective from October 19, 2026”; its Perfectron Hydradrive Dragon change takes effect with Magnificent Maestros on November 11, 2026, hence is already effective on the observation date. All selected events are November 1–22, 2026. The note retains event names containing “2027” only as event-season names, never as an event date.

The search endpoint returns 20 records per page even with `limit=100`. Selection was from recent returned records, inspecting actual deck names (a Toon query also finds **Saskatoon**, which is not Toon), with pure builds preferred except archetypes currently represented by named hybrids. Artmage and Elfnote use Ars Magna variants; Light and Darkness Ritual uses three Ars Magna Power Patron variants. Branded is Despia Branded, separate from Branded Dracotail. Sky Striker includes YCS Orlando Top 16 as a large-event example. Copies/placements/events below come directly from each linked deck's search record. This is a reproducible sample, not a claim of statistically representative selection.

**Legality screen:** names/counts across Main + Extra + Side were compared with the Advanced Format columns on that official page. No *known* card in the 33 accepted lists exceeded the listed limit. This is not certification of every release/region rule. One sideboard contains unrevealed slots (see Unverified). The earlier note's [AG3 Light and Darkness Ritual list](https://ygoprodeck.com/deck/light-and-darkness-ritual-745851) was rejected: it contains Maxx “C”, Albion the Branded Dragon and Called by the Grave despite their Forbidden status, plus three Griffoh and two Branded in High Spirits against Limited status. Its TCG category cannot override the official list.

### Reading the audit

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`. `shop.ts` = `apps/academy-ygo/src/lib/junior/world/shop.ts`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. It does not mean every possible interaction with absent cards has been tested. **Partial:** script exists but a printed use, effect, or timing case is missing. **Absent:** no playable definition; a picture or shop item is insufficient. “Absent — data only” remains Absent in totals.
- Absence evidence for **every Absent row**: full inventory join by English printed name and passcode/alternate-image ID against `packages/cards/src/card-art.json`, `card-art.ts:25-327`, and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`. The engine obtains only that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts`). This shared negative-search evidence applies to all absent rows, not a fictitious line claiming each absent name.
- Per-list counts are **Main+Extra+Side combined** (`3/0/2` = L1/L2/L3); zone labels tell where a card appears across the lists. Exact zone-specific counts are additionally preserved in the compact inventory appendix. A card in both Main and Side is counted once in the union.
- Primary percentages use Main+Extra to remain comparable with the earlier note; the final column gives exact all-zone counts. “In Academy” includes Partial. Unknown sideboard placeholders are excluded, not treated as playable cards.
- **Needs/Step/Work are (ours), a triage map rather than a proof that the highest numbered step alone completes a card.** Several existing mechanics need generalization, not creation from zero. `script` means card scripting **after its listed shared engine work exists**, not implementable today. `card-deep` flags specialized geometry/ownership/continuous-monster/Token/counter/equip rules; even a `script` card can need difficult shared foundation work.

## 1. What changed in the engine

The old “one pending answer” description is no longer the complete picture. There is a `chain` and Spell Speed 3, but `addLink` offers **only Counter Traps** above an answer (`engine.ts:1482-1495`), and `answerLink` rejects anything else (`:1523-1533`). It is not yet general alternating fast-effect priority. This particularly blocks chaining Mystical Space Typhoon to Radiant Typhoon Quick-Plays, multiple hand traps, and reactive archetype effects.

Quick-Plays from hand now work in the owner's phases (`engine.ts:1782-1793`). The non-turn player receives an open moment after draw/phase entry (`:1168-1175`), including Veiler in Main Phase. Response eligibility still uses small explicit lists (`:559-563`), and own-turn hand effects are not generalized (`:2627-2633`).

**Fuwalos is present, not absent:** `cards.ts:271`; condition/activation count `engine.ts:1290`, draws `:1184-1200`, End Phase trim `:1206-1225`. It is conservatively **Partial** here: only the non-turn player can use it (`:2631`), two resolved copies collapse into one lock (`:2689`), and Pendulum Summons emit `pendulum` (`:2135`) rather than the `special` events inspected at `:1189`. Those are static-code findings **(ours)**, not test executions. Droll similarly watches only additions to the turn player's hand (`:1237`), so its own-turn use after the opponent adds is missing.

Data effects already have searches, milling, recovery, Special Summons and per-name/per-copy/shared once-per-turn (`catalogue.ts:199-283`, `effects.ts:13-91`). But one choice and one target are the basic model (`catalogue.ts:195-197`); arbitrary branching, multi-targets, continuous activated effects, banishment-origin effects and broad costs need extension. A generic Ritual still names one monster (`catalogue.ts:140-143`); Fusion material predicates have Type/Attribute/prefix (`:337-342`), not all relational/variable recipes. Synchro/Xyz validation is constrained (`engine.ts:2154-2170`). Link rating and arrows exist (`catalogue.ts:390-400`, `engine.ts:2171` onward); Link cards are not all blocked merely for being Links.

The bot searches legal moves, and answers from resulting boards (`bot.ts:123-184`), so absent rules cannot be patched by a smarter bot. App-side `master-decks.ts`, `starters.ts`, `masters.ts` and `packs/index.ts:21-23` contain Academy's decks/meta-lite packs, not any of these imported tournament lists. Packs are Blue-Eyes and HERO. No live deck was changed.

### Mechanism key and source anchors (ours)

| Code | Required mechanism / extension | Plan step | Repo evidence for current boundary |
| --- | --- | --- | --- |
| CHAIN / HAND | Full fast-effect priority, legal origins, activation vs effect negation, arbitrary responses | 1 | `engine.ts:1277-1299`, `:1482-1533`, `:2631` |
| TRIG / LOCK | General event provenance, simultaneous triggers, delayed effects, turn/Duel restrictions | 2 | `catalogue.ts:231-283`; `engine.ts:1234-1242` |
| VOCAB / GY / BANISH | Multi-choice actions, costs, filters, return/banish/Set, effects in GY/banishment | 3 | `catalogue.ts:166-283`, `effects.ts:46-59` |
| CONT | Activated/continuous Field and Continuous Spell/Trap effects | 3 | `catalogue.ts:45-163`, `:489-499` |
| RITUAL / FUS-EFF | General Ritual tributes and GY banish; Fusion by effect from Deck/GY/opponent field | 3 | `catalogue.ts:140-143` |
| FUS-MAT / SYN / XYZ / LINK / PEND | Material predicates, alternate procedures, material transfer, proper summon, arrow/scale effects | 4 | `catalogue.ts:337-342`, `:390-407`; `engine.ts:2081-2202` |
| TOON | Toon subtype, conditional naming, Toon World dependencies | 5 | Existing `Toon Table` only filters names (`effects.ts:19`); no modern Toon core definitions in `cards.ts:27-399` |
| ZONE / MONSPELL / CONTROL | Columns/centre/adjacency, monsters as backrow, control vs ownership and opponent summons | Beyond original plan; add to 3/4 | `engine.ts:1628` explicitly omits columns; `catalogue.ts:199-230` actions lack these |
| TOKEN / CTR / EQ-MON / DICE | Token identity, counters, monsters as Equips, dice | Beyond original plan | `catalogue.ts:199-230`, `:372-475`; no general facilities of these kinds |

Unlike the old note, **Elfnote itself is a centre-zone/Synchro deck**; its sampled Ars Magna package adds Pendulum cards. Angelechy is not just Synchro summoning: its cards become Continuous Spells, impose column/activation restrictions, and exchange control. Radiant Typhoon's Marine Eidolon also needs monsters-as-Continuous-Spells. These are from the fetched texts, not inferred solely from archetype names.


## 2. Coverage per archetype (Main + Extra Deck unique cards; Side-only cards counted separately)

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Angelechy | 3 | 33 | 2 | 6 | 25 | 6% | 24% | 11 | 2 / 6 / 36 of 44 |
| Elfnote | 3 | 44 | 0 | 6 | 38 | 0% | 14% | 9 | 0 / 6 / 47 of 53 |
| Toon | 3 | 69 | 2 | 6 | 61 | 3% | 12% | 11 | 3 / 6 / 71 of 80 |
| Artmage | 3 | 57 | 0 | 4 | 53 | 0% | 7% | 4 | 0 / 4 / 57 of 61 |
| Unchained | 3 | 36 | 0 | 4 | 32 | 0% | 11% | 9 | 1 / 4 / 40 of 45 |
| Light and Darkness Ritual | 3 | 56 | 0 | 5 | 51 | 0% | 9% | 5 | 0 / 5 / 56 of 61 |
| Radiant Typhoon | 3 | 36 | 0 | 3 | 33 | 0% | 8% | 8 | 0 / 4 / 40 of 44 |
| Sky Striker | 3 | 43 | 4 | 4 | 35 | 9% | 19% | 10 | 5 / 5 / 43 of 53 |
| Branded Dracotail | 3 | 45 | 0 | 5 | 40 | 0% | 11% | 7 | 1 / 5 / 46 of 52 |
| Branded | 3 | 50 | 0 | 6 | 44 | 0% | 12% | 11 | 0 / 6 / 55 of 61 |
| Sacred Beast | 3 | 36 | 1 | 5 | 30 | 3% | 17% | 11 | 2 / 5 / 40 of 47 |
| **Unique across all zones (not Main+Extra)** | 33 | 345 | 8 | 8 | 329 | 2% | 5% | | |

## 3. Shared cards ranked by the number of archetypes playing them (Main, Extra or Side)

| Rank | Card | Archetypes (of 11) | Which | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 11 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | 9 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | Typhoon | 9 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Sky Striker, Branded, Sacred Beast | Absent | CHAIN, VOCAB | Step 3 | script |
| 8 | Hey, Space Trunade! | 8 | Angelechy, Elfnote, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded | Absent | VOCAB | Step 3 | script |
| 9 | S:P Little Knight | 8 | Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 10 | Skull Meister | 8 | Angelechy, Elfnote, Toon, Artmage, Unchained, Branded Dracotail, Branded, Sacred Beast | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 11 | Pot of Sloth | 7 | Angelechy, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast | Absent | LOCK, VOCAB | Step 3 | script |
| 12 | The Great Gallant Bandit | 7 | Angelechy, Elfnote, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 13 | Effect Veiler | 6 | Angelechy, Elfnote, Toon, Branded Dracotail, Branded, Sacred Beast | Partial | CHAIN | Step 1 | script |
| 14 | Harpie's Feather Duster | 5 | Toon, Unchained, Sky Striker, Branded Dracotail, Sacred Beast | Scripted & automatic | — | — | — |
| 15 | Solemn Accusation | 5 | Toon, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 16 | Super Polymerization | 5 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |
| 17 | Dominus Impulse | 4 | Angelechy, Toon, Unchained, Sky Striker | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |
| 18 | Elder Entity Norden | 4 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 19 | Evenly Matched | 4 | Toon, Artmage, Radiant Typhoon, Branded Dracotail | Absent | CHAIN, VOCAB | Step 3 | script |
| 20 | Garura, Wings of Resonant Life | 4 | Artmage, Radiant Typhoon, Sky Striker, Branded | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 21 | Gordian Slicer | 4 | Artmage, Unchained, Light and Darkness Ritual, Sacred Beast | Absent | CHAIN, VOCAB | Step 3 | script |
| 22 | Infinite Impermanence | 4 | Angelechy, Elfnote, Toon, Branded | Partial | ZONE | beyond plan | card-deep |
| 23 | Mudragon of the Swamp | 4 | Artmage, Radiant Typhoon, Sky Striker, Branded | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |
| 24 | Solemn Judgment | 4 | Elfnote, Toon, Unchained, Sky Striker | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |
| 25 | Super Starslayer TY-PHON - Sky Crisis | 4 | Toon, Unchained, Radiant Typhoon, Sky Striker | Absent | LOCK, VOCAB, XYZ | Step 4 | script |
| 26 | Accesscode Talker | 3 | Toon, Light and Darkness Ritual, Sky Striker | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 27 | Ars Magna "Citrinitas" | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, VOCAB, CONT | Step 3 | script |
| 28 | Ars Magna "Philosophorum" | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, VOCAB, GY | Step 3 | script |
| 29 | Ars Magna the Corruption and the Purification | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, VOCAB, BANISH | Step 3 | script |
| 30 | Ars Magna the Division and the Union | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |
| 31 | Ars Magna the Finite and the Infinite | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, BANISH | Step 3 | script |
| 32 | Artmage Diactorus | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH, FUS-MAT | Step 4 | script |
| 33 | Cosmic Cyclone | 3 | Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, VOCAB | Step 3 | script |
| 34 | Dharc the Dark Charmer, Gloomy | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 35 | Dominus Spark | 3 | Angelechy, Toon, Branded | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 36 | Ecclesia and the Dark Dragon | 3 | Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |
| 37 | Hyperinvoked Aeon | 3 | Artmage, Branded Dracotail, Branded | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 38 | I:P Masquerena | 3 | Toon, Artmage, Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 39 | Junoldo the Shadespirit Power Patron | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | VOCAB, PEND | Step 4 | script |
| 40 | Junora the Power Patron of Tuning | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, TRIG, SYN, ZONE | Step 4 + beyond plan | card-deep |
| 41 | Lava Golem | 3 | Radiant Typhoon, Sky Striker, Branded | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |
| 42 | Mediclius the Extraordinary Power Patron | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 43 | Medius the Pure | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 44 | Mistaken Arrest | 3 | Elfnote, Unchained, Branded | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 45 | Number 38: Hope Harbinger Dragon Titanic Galaxy | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |
| 46 | Number 90: Galaxy-Eyes Photon Lord | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |
| 47 | Pendulum Treasure | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | VOCAB, PEND | Step 4 | script |
| 48 | Prohibited Power Patron Portal - Terminus | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | LOCK, VOCAB, GY | Step 3 | script |
| 49 | Purification Power Patron | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |
| 50 | Relinquished Anima | 3 | Light and Darkness Ritual, Radiant Typhoon, Sacred Beast | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |
| 51 | Sky Striker Ace - Azalea | 3 | Toon, Artmage, Sky Striker | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |
| 52 | The Dragon that Devours the Dogma | 3 | Sky Striker, Branded Dracotail, Branded | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |
| 53 | The Fallen & The Virtuous | 3 | Sky Striker, Branded Dracotail, Branded | Absent | CHAIN, VOCAB | Step 3 | script |
| 54 | The Winged Dragon of Ra - Sphere Mode | 3 | Angelechy, Artmage, Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |
| 55 | Theorealize | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | VOCAB, GY | Step 3 | script |
| 56 | Theorealized Medius | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, VOCAB | Step 3 | script |
| 57 | Vidolium the Unstable Power Patron of Unity | 3 | Elfnote, Artmage, Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, PEND | Step 4 | script |


## 4. Card-by-card unions


### Angelechy

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Angelechy](https://ygoprodeck.com/deck/angelechy-746009): Bordeaux WCQ Regional - November 22nd 2026, **Top 8** (64 players, approx.); 40 Main / 15 Extra / 15 Side.
2. [Angelechy](https://ygoprodeck.com/deck/angelechy-746001): Münster WCQ Regional - November 21st 2026, **Top 8** (74 players); 40 Main / 15 Extra / 15 Side.
3. [Angelechy](https://ygoprodeck.com/deck/angelechy-745997): Doha WCQ Regional - November 20th 2026, **Runner-Up** (39 players); 40 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Pot of Desires | 0/1/0 | Scripted & automatic | — | — | — | cost `banish-deck` 10, `draw` 2, `onePerTurn` (`cards.ts:64`). |
| Terraforming | 1/1/1 | Scripted & automatic | — | — | — | data `search` of a Field Spell (`cards.ts:328`). |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/3/3 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 3/0/0 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Foolish Burial Goods | 3/3/3 | Absent — data only | — | — | data | Fits the existing vocabulary: `{ do: "mill", filter: { kind: "spell" } }` + a trap alternative (`anyOf`) and `onePerTurn` (`catalogue.ts:205`, `:191`). |
| Angelechy Brilliant Move | 1/0/1 | Absent | VOCAB, GY, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Disturbance | 1/1/1 | Absent | CHAIN, TRIG, VOCAB, GY, ZONE, CONTROL | Step 3 + beyond plan | card-deep |  |
| Angelechy Endgame Problem | 1/1/1 | Absent | TRIG, VOCAB, CONT, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Opening to e4 | 3/3/3 | Absent | CHAIN, TRIG, LOCK, VOCAB, ZONE, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Opposition | 3/3/3 | Absent | LOCK, VOCAB, GY, BANISH, MONSPELL, CONTROL | Step 3 + beyond plan | card-deep |  |
| Angelechy Problem | 3/3/3 | Absent | TRIG, VOCAB, CONT, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Strategy Score | 3/3/3 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Angelechy Verdict | 2/2/2 | Absent | CHAIN, VOCAB, GY, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Dominus Impulse | 2/3/3 | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dominus Purge | 3/3/3 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Set Rotation | 1/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Angelechy Bastion | 2/2/2 (extra) | Absent | LOCK, VOCAB, ZONE, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Castellan | 1/1/1 (extra) | Absent | VOCAB, ZONE, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Destrier | 2/2/2 (extra) | Absent | TRIG, VOCAB, ZONE, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Angelechy Enlisted | 2/2/2 (extra) | Absent | VOCAB, SYN, ZONE, CONTROL | Step 4 + beyond plan | card-deep |  |
| Angelechy Seneschal | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Angelechy Shatranga | 2/2/2 (extra) | Absent | VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Assault Blackwing - Kusanagi the Gathering Storm | 1/1/1 (extra) | Absent | TRIG, SYN | Step 4 | script |  |
| Black-Winged Assault Dragon | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN, CTR | Step 4 + beyond plan | card-deep |  |
| Centur-Ion Legatia | 1/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Chaos Angel | 1/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Masterflare Hyperion | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, GY, SYN | Step 4 | script |  |
| Satellite Warrior | 0/0/1 (extra) | Absent | TRIG, VOCAB, GY, SYN | Step 4 | script |  |
| Snake-Eyes Vengeance Dragon | 0/0/1 (extra) | Absent | CHAIN, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Dominus Spark | 0/1/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 2/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Inspector Boarder | 3/3/3 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 3/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 0/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Pot of Sloth | 2/0/3 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Rainbow Bridge Bifrost | 0/2/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Skull Meister | 0/3/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 2/0/3 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| The Winged Dragon of Ra - Sphere Mode | 0/3/0 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Typhoon | 3/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

### Elfnote

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Ars Magna Elfnote](https://ygoprodeck.com/deck/ars-magna-elfnote-746000): Sofia WCQ Regional - November 21st 2026, **Top 4** (90 players); 40 Main / 15 Extra / 15 Side.
2. [Ars Magna Elfnote](https://ygoprodeck.com/deck/ars-magna-elfnote-745831): Ljubljana WCQ Regional - November 21st 2026, **Top 8** (50 players); 40 Main / 15 Extra / 15 Side.
3. [Ars Magna Elfnote](https://ygoprodeck.com/deck/ars-magna-elfnote-745826): Hoorn WCQ Regional - November 21st 2026, **Top 4** (64 players, approx.); 41 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 3/0/3 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 3/3/3 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Ars Magna "Citrinitas" | 2/2/2 | Absent | CHAIN, VOCAB, CONT | Step 3 | script |  |
| Ars Magna the Corruption and the Purification | 1/2/1 (main+side) | Absent | TRIG, VOCAB, BANISH | Step 3 | script |  |
| Ars Magna the Division and the Union | 1/1/1 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Ars Magna the Finite and the Infinite | 1/2/1 | Absent | TRIG, LOCK, VOCAB, BANISH | Step 3 | script |  |
| Elfnote Fortuna | 1/1/1 | Absent | CHAIN, HAND, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Elfnote Lucina | 3/3/3 | Absent | CHAIN, HAND, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Elfnote Power Patron | 2/2/2 | Absent | CHAIN, TRIG, LOCK, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Elfnote Regina | 3/3/3 | Absent | CHAIN, HAND, TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Elfnotes: Rhapsodia of Madness | 1/1/1 | Absent | CHAIN, VOCAB, CONT, ZONE | Step 3 + beyond plan | card-deep |  |
| Junoldo the Shadespirit Power Patron | 1/1/1 | Absent | VOCAB, PEND | Step 4 | script |  |
| Medius the Pure | 2/2/2 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Pendulum Treasure | 0/2/2 (main+side) | Absent | VOCAB, PEND | Step 4 | script |  |
| Prohibited Power Patron Portal - Terminus | 1/1/1 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Theorealize | 1/0/1 | Absent | VOCAB, GY | Step 3 | script |  |
| Theorealize Past Lull | 1/1/1 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Theorealized Medius | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Typhoon | 3/3/3 (main+side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Vidolium the Unstable Power Patron of Unity | 2/2/2 | Absent | TRIG, LOCK, VOCAB, GY, PEND | Step 4 | script |  |
| Adamancipator Risen - Dragite | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Arcanite Magician | 1/1/1 (extra) | Absent | TRIG, VOCAB, SYN, CTR | Step 4 + beyond plan | card-deep |  |
| Artmage Diactorus | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Black Rose Dragon | 0/1/0 (extra) | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Dharc the Dark Charmer, Gloomy | 1/0/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Diabell, Queen of the White Forest | 1/1/0 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH, SYN | Step 4 | script |  |
| Elfnote June Pride | 1/1/1 (extra) | Absent | CHAIN, HAND, LOCK, VOCAB, SYN, ZONE | Step 4 + beyond plan | card-deep |  |
| Elfnote Seraphim Strelitzia | 1/1/1 (extra) | Absent | CHAIN, HAND, LOCK, VOCAB, GY, SYN, ZONE | Step 4 + beyond plan | card-deep |  |
| Haggard Lizardose | 0/0/1 (extra) | Absent | VOCAB, LINK | Step 4 | script |  |
| Junora the Power Patron of Tuning | 1/1/1 (extra) | Absent | CHAIN, TRIG, SYN, ZONE | Step 4 + beyond plan | card-deep |  |
| Kewl Tune RS | 1/0/0 (extra) | Absent | CHAIN, VOCAB, GY, SYN | Step 4 | script |  |
| Mediclius the Extraordinary Power Patron | 1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Number 38: Hope Harbinger Dragon Titanic Galaxy | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Number 90: Galaxy-Eyes Photon Lord | 1/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Psychic End Punisher | 1/1/1 (extra) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Purification Power Patron | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Ravenous Crocodragon Archethys | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| S:P Little Knight | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| The Executor of the Underworld - Pluto | 1/1/1 (extra) | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Zalen the Shackled Dragon | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Ars Magna "Philosophorum" | 0/0/1 (side) | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Hey, Space Trunade! | 3/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Mistaken Arrest | 3/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 2/3/1 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 2/3/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Skull Meister | 0/3/2 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Judgment | 0/0/1 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 2/0/3 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Veidos the Eruption Dragon of Extinction | 0/3/3 (side) | Absent | CHAIN, HAND, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |

### Toon

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Toon](https://ygoprodeck.com/deck/toon-745998): Doha WCQ Regional - November 20th 2026, **Winner** (39 players); 44 Main / 15 Extra / 15 Side.
2. [Tri-Brigade Toon](https://ygoprodeck.com/deck/tri-brigade-toon-745818): Hoorn WCQ Regional - November 21st 2026, **Top 8** (64 players, approx.); 41 Main / 15 Extra / 15 Side.
3. [Toon](https://ygoprodeck.com/deck/toon-745159): Lima WCQ Regional - November 15th 2026, **Top 4** (200 players, approx.); 40 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Terraforming | 1/1/1 | Scripted & automatic | — | — | — | data `search` of a Field Spell (`cards.ts:328`). |
| Toon Table of Contents | 1/1/1 | Scripted & automatic | — | — | — | data `search` archetype "Toon" (`cards.ts:330`); the archetype filter is "name contains" (`effects.ts:19`). |
| Harpie's Feather Duster | 0/1/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/3/3 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 3/3/3 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Animimicat | 3/2/3 | Absent | CHAIN, HAND, VOCAB, TOON | Step 5 | card-deep |  |
| Blue-Eyes Toon Dragon | 1/0/0 | Absent | TRIG, LOCK, VOCAB, TOON | Step 5 | card-deep | Art and text only (`card-art.ts:103`), sold in the shop (`apps/academy-ygo/src/lib/junior/world/shop.ts:38`); no entry in `cards.ts`, so it cannot be played. |
| Dark-Eyes Illusionist Faceless Mage | 1/1/1 | Absent | VOCAB, GY, TOON | Step 5 | card-deep |  |
| Dominus Impulse | 3/0/3 | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dominus Spark | 0/0/2 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Evil Box | 1/1/1 | Absent | CHAIN, HAND, VOCAB, TOON | Step 5 | card-deep |  |
| Fire Formation - Tenki | 0/2/0 | Absent | TRIG, VOCAB, CONT | Step 3 | script |  |
| Funny Dark Rabbit | 3/3/3 | Absent | VOCAB, TOON | Step 5 | card-deep |  |
| Mind Scan | 1/1/1 | Absent | CHAIN, VOCAB, CONT | Step 3 | script |  |
| Perfect Toon World | 3/3/3 | Absent | TRIG, VOCAB, CONT, TOON | Step 5 | card-deep |  |
| Piri Reis Map | 3/1/2 (main+side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Pot of Prosperity | 1/1/1 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Rainbow Bridge Bifrost | 3/0/3 | Absent | VOCAB | Step 3 | script |  |
| Skull Meister | 3/3/0 (main+side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Toon Bookmark | 1/1/1 | Absent | TRIG, VOCAB, GY, TOON | Step 5 | card-deep |  |
| Toon Dark Magician | 1/0/0 | Absent | VOCAB, TOON | Step 5 | card-deep |  |
| Toon Terror | 1/1/1 | Absent | CHAIN, VOCAB, TOON | Step 5 | card-deep |  |
| Tri-Brigade Fraktall | 0/3/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Tri-Brigade Kitt | 0/1/0 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Tri-Brigade Nervall | 0/1/0 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Tri-Brigade Springans Kitt | 0/1/0 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Typhoon | 3/0/2 (main+side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Accesscode Talker | 0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Ancient Warriors Oath - Double Dragon Lords | 0/1/0 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, LINK | Step 4 | script |  |
| Angelechy Enlisted | 1/0/0 (extra) | Absent | VOCAB, SYN, ZONE, CONTROL | Step 4 + beyond plan | card-deep |  |
| Arc Rebellion Xyz Dragon | 0/0/1 (extra) | Absent | CHAIN, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Blue-Eyes Toon Ultimate Dragon | 2/0/0 (extra) | Absent | VOCAB, GY | Step 3 | script |  |
| Centur-Ion Auxila | 1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Centur-Ion Legatia | 1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Chaos Angel | 1/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Chimera the King of Phantom Beasts | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Cooky★Yummy Way | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, SYN | Step 4 | script |  |
| Crystron Halqifibrax Prism | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK, TOKEN | Step 4 + beyond plan | card-deep |  |
| Dark Rebellion Xyz Dragon, Four Heavenly Dragons | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Divine Arsenal AA-ZEUS - Sky Thunder | 0/0/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Dragunity Knight - Luin | 1/0/0 (extra) | Absent | TRIG, VOCAB, SYN, EQ-MON | Step 4 + beyond plan | card-deep |  |
| Dragunity Lord - Georgius | 1/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Evilswarm Exciton Knight | 0/0/1 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Evilswarm Ophion | 0/0/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| Exosister Karmael | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, BANISH, XYZ | Step 4 | script |  |
| Fabled Levilazebul | 0/0/1 (extra) | Absent | CHAIN, VOCAB, GY, CONTROL | Step 3 + beyond plan | card-deep |  |
| I:P Masquerena | 1/0/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Magistus Chorozo | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Odin, Father of the Aesir | 0/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script |  |
| Rahamu, Envoy of the Sacred Tome | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Raider's Knight | 0/0/1 (extra) | Absent | TRIG, VOCAB, XYZ | Step 4 | script |  |
| S:P Little Knight | 1/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Salamangreat Almiraj | 0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Scareclaw Light-Heart | 0/1/0 (extra) | Absent | TRIG, VOCAB, GY, LINK, ZONE | Step 4 + beyond plan | card-deep |  |
| Scareclaw Tri-Heart | 0/1/0 (extra) | Absent | LOCK, VOCAB, LINK, ZONE | Step 4 + beyond plan | card-deep |  |
| Selene, Queen of the Master Magicians | 1/0/0 (extra) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |  |
| Sky Striker Ace - Azalea | 0/0/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/0/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| Tornado Dragon | 1/0/1 (extra) | Absent | CHAIN, VOCAB, XYZ | Step 4 | script |  |
| Tri-Brigade Arms Bucephalus II | 0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Tri-Brigade Arms Mouser | 0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Tri-Brigade Bearbrumm the Rampant Rampager | 0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, LINK | Step 4 | script |  |
| Tri-Brigade Ferrijit the Barren Blossom | 0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Tri-Brigade Rugal the Silver Sheller | 0/1/0 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Tri-Brigade Shuraig the Ominous Omen | 0/2/0 (extra) | Absent | TRIG, VOCAB, BANISH, LINK | Step 4 | script |  |
| Yummy★Snatchy | 0/1/0 (extra) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Evenly Matched | 3/1/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 0/1/2 (side) | Absent | VOCAB | Step 3 | script |  |
| Illusion Gate | 0/1/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Mind Crush | 3/0/2 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 2/3/1 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 3/0/2 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Pot of Sloth | 1/0/2 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Solemn Accusation | 0/3/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 0/1/1 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Tri-Brigade Revolt | 0/1/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

### Artmage

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Ars Magna Power Patron Artmage](https://ygoprodeck.com/deck/ars-magna-power-patron-artmage-745976): Ljubljana WCQ Regional - November 21st 2026, **Top 8** (50 players); 43 Main / 15 Extra / 15 Side.
2. [Ars Magna Power Patron Artmage](https://ygoprodeck.com/deck/ars-magna-power-patron-artmage-745973): Hoorn WCQ Regional - November 21st 2026, **Winner** (64 players, approx.); 42 Main / 15 Extra / 15 Side.
3. [Ars Magna Power Patron Artmage](https://ygoprodeck.com/deck/ars-magna-power-patron-artmage-745277): Lima WCQ Regional - November 15th 2026, **Top 4** (200 players, approx.); 42 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 0/3/3 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Ars Magna "Citrinitas" | 1/2/2 | Absent | CHAIN, VOCAB, CONT | Step 3 | script |  |
| Ars Magna the Corruption and the Purification | 1/1/1 | Absent | TRIG, VOCAB, BANISH | Step 3 | script |  |
| Ars Magna the Division and the Union | 1/1/1 (main+side) | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Ars Magna the Finite and the Infinite | 2/1/1 (main+side) | Absent | TRIG, LOCK, VOCAB, BANISH | Step 3 | script |  |
| Artmage Academic Arcane Arts Acropolis | 1/1/1 | Absent | LOCK, VOCAB, CONT | Step 3 | script |  |
| Artmage Finmel | 2/2/1 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Artmage Graflare | 1/1/1 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Artmage Impasto -Recapture- | 1/1/1 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Artmage Litera | 1/1/1 | Absent | CHAIN, HAND, VOCAB, GY | Step 3 | script |  |
| Artmage Pact -Awakening- | 1/1/1 | Absent | CHAIN, LOCK, VOCAB, GY | Step 3 | script |  |
| Artmage Power Patron | 2/2/1 | Absent | CHAIN, HAND, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Artmage Vandalism -Assault- | 1/1/1 | Absent | TRIG, VOCAB, CONT | Step 3 | script |  |
| Artmage Varnish -Alteration- | 1/1/1 | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Evenly Matched | 2/0/0 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Gordian Slicer | 2/0/0 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 0/3/3 (main+side) | Absent | VOCAB | Step 3 | script |  |
| Junoldo the Shadespirit Power Patron | 0/1/1 | Absent | VOCAB, PEND | Step 4 | script |  |
| Jupredo the Shademachine Power Patron | 1/1/1 | Absent | VOCAB, PEND | Step 4 | script |  |
| Medius the Pure | 3/2/3 (main+side) | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Mulcharmy Purulia | 3/3/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nervedo the Shadebeast Power Patron | 3/2/3 (main+side) | Absent | CHAIN, VOCAB, PEND | Step 4 | script |  |
| Pendulum Treasure | 3/3/3 (main+side) | Absent | VOCAB, PEND | Step 4 | script |  |
| Pot of Sloth | 2/2/0 (main+side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Prohibited Power Patron Portal - Terminus | 1/1/1 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Super Polymerization | 3/0/0 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Great Gallant Bandit | 3/3/3 (main+side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Theorealize | 1/0/0 | Absent | VOCAB, GY | Step 3 | script |  |
| Theorealize Liberation | 0/1/0 | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Theorealize Past Lull | 1/1/1 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Theorealized Medius | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Typhoon | 3/3/3 (main+side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Vidolium the Unstable Power Patron of Unity | 2/2/2 | Absent | TRIG, LOCK, VOCAB, GY, PEND | Step 4 | script |  |
| Artmage Diactorus | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Artmage Non-Finito | 2/2/2 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Beyond the Pendulum | 0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK, ZONE | Step 4 + beyond plan | card-deep |  |
| Dharc the Dark Charmer, Gloomy | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Elder Entity Norden | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Garura, Wings of Resonant Life | 1/0/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Hyperinvoked Aeon | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| I:P Masquerena | 0/0/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Junora the Power Patron of Tuning | 0/1/1 (extra) | Absent | CHAIN, TRIG, SYN, ZONE | Step 4 + beyond plan | card-deep |  |
| Jupiter the Power Patron of Destruction | 0/0/1 (extra) | Absent | TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| Mediclius the Extraordinary Power Patron | 1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Mudragon of the Swamp | 1/0/0 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Nerva the Power Patron of Creation | 1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Number 38: Hope Harbinger Dragon Titanic Galaxy | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Number 90: Galaxy-Eyes Photon Lord | 1/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Odd-Eyes Absolute Dragon | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| Odd-Eyes Vortex Dragon | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Predaplant Dragostapelia | 1/1/1 (extra) | Absent | CHAIN, VOCAB, FUS-MAT, CTR | Step 4 + beyond plan | card-deep |  |
| Purification Power Patron | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| S:P Little Knight | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Azalea | 0/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Ars Magna "Philosophorum" | 1/1/0 (side) | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Nibiru, the Primal Being | 0/0/2 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Skull Meister | 0/0/3 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| The Winged Dragon of Ra - Sphere Mode | 0/1/0 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |

### Unchained

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Unchained](https://ygoprodeck.com/deck/unchained-745829): Hoorn WCQ Regional - November 21st 2026, **Top 4** (64 players, approx.); 40 Main / 15 Extra / 15 Side.
2. [Unchained](https://ygoprodeck.com/deck/unchained-745552): Lima WCQ Regional - November 15th 2026, **Top 8** (200 players, approx.); 40 Main / 15 Extra / 15 Side.
3. [Unchained](https://ygoprodeck.com/deck/unchained-745032): Zoetermeer WCQ Regional - November 15th 2026, **Top 4** (50 players, approx.); 40 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Harpie's Feather Duster | 0/1/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 3/3/3 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Abominable Chamber of the Unchained | 1/0/1 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Abominable Unchained Soul | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Abomination's Prison | 3/3/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Dominus Impulse | 3/3/3 (main+side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Escape of the Unchained | 1/2/2 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 3/3/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Pot of Prosperity | 0/1/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Reincarnation of the Unchained | 3/3/3 | Absent | TRIG, VOCAB, CONT | Step 3 | script |  |
| Triple Tactics Thrust | 0/1/0 | Absent | VOCAB | Step 3 | script |  |
| Unchained Hunger | 1/1/2 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Unchained Oni of Shara | 3/1/3 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script |  |
| Unchained Oni of Shyma | 3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Unchained Soul of Sharvara | 3/3/3 | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Unchained Soul of Shyama | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Unchained Twins - Aruha | 3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Unchained Twins - Rakea | 1/1/1 | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Unchained Twins - Sarama | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Unchained Zealot - Kamra | 3/3/3 (main+side) | Absent | TRIG, VOCAB | Step 3 | script |  |
| A Bao A Qu, the Lightless Shadow | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Goblin's Crazy Beast | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, XYZ | Step 4 | script |  |
| Knightmare Phoenix | 1/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Knightmare Unicorn | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Muckraker From the Underworld | 1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| S:P Little Knight | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 1/0/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| Unchained Abomination | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Unchained Firelord of Yama | 1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Unchained Soul Lord of Yama | 3/3/3 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Unchained Soul of Abominable Rage | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Unchained Soul of Anguish | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Unchained Soul of Rage | 1/2/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Underworld Goddess of the Closed World | 1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Gordian Slicer | 3/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Mistaken Arrest | 0/3/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 0/2/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Skull Meister | 0/2/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Solemn Accusation | 1/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 1/0/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 3/0/3 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Typhoon | 3/3/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

### Light and Darkness Ritual

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Ars Magna Power Patron Light and Darkness Ritual](https://ygoprodeck.com/deck/ars-magna-power-patron-light-and-darkness-ritual-745990): Sofia WCQ Regional - November 21st 2026, **Top 4** (90 players); 60 Main / 15 Extra / 15 Side.
2. [Ars Magna Power Patron Light and Darkness Ritual](https://ygoprodeck.com/deck/ars-magna-power-patron-light-and-darkness-ritual-745732): Doha WCQ Regional - November 20th 2026, **Top 4** (39 players); 55 Main / 15 Extra / 15 Side.
3. [Ars Magna Power Patron Light and Darkness Ritual](https://ygoprodeck.com/deck/ars-magna-power-patron-light-and-darkness-ritual-745726): Toronto WCQ Regional - November 14th 2026, **Top 8** (215 players); 60 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Dark Magical Curtain | 1/1/3 (main+side) | Partial | — | — | data | `curtain`: the engine picks for the player (`docs/academy-junior-masters-plan.md`). |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 3/3/3 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Ars Magna "Citrinitas" | 2/2/2 | Absent | CHAIN, VOCAB, CONT | Step 3 | script |  |
| Ars Magna the Corruption and the Purification | 1/1/1 | Absent | TRIG, VOCAB, BANISH | Step 3 | script |  |
| Ars Magna the Division and the Union | 1/1/1 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Ars Magna the Finite and the Infinite | 3/3/3 | Absent | TRIG, LOCK, VOCAB, BANISH | Step 3 | script |  |
| Artmage Impasto -Recapture- | 1/1/1 (main+side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Artmage Vandalism -Assault- | 1/1/1 | Absent | TRIG, VOCAB, CONT | Step 3 | script |  |
| Black Chaos | 3/3/3 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Black Luster Soldier - Soldier of Light and Darkness | 1/1/0 (main+side) | Absent | TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |  |
| Gordian Slicer | 3/0/0 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Griffoh | 1/1/1 | Absent | CHAIN, HAND, VOCAB, RITUAL | Step 3 | script |  |
| Hey, Space Trunade! | 3/3/3 | Absent | VOCAB | Step 3 | script |  |
| Junoldo the Shadespirit Power Patron | 1/0/1 | Absent | VOCAB, PEND | Step 4 | script |  |
| Jupredo the Shademachine Power Patron | 1/1/1 | Absent | VOCAB, PEND | Step 4 | script |  |
| Kuriboh - Multiply! | 3/3/3 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Light and Darkness Ritual | 1/1/1 | Absent | VOCAB, GY, RITUAL | Step 3 | script |  |
| Magician of Dark Chaos - Black Chaos | 1/1/1 | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |  |
| Medius the Pure | 2/2/3 (main+side) | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Mind Shuffle | 1/1/1 | Absent | CHAIN, TRIG, LOCK, VOCAB, CONT | Step 3 | script |  |
| Mulcharmy Purulia | 3/3/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nervedo the Shadebeast Power Patron | 2/2/3 | Absent | CHAIN, VOCAB, PEND | Step 4 | script |  |
| Nibiru, the Primal Being | 3/2/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Pendulum Treasure | 3/2/3 | Absent | VOCAB, PEND | Step 4 | script |  |
| Pot of Sloth | 0/3/3 (main+side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Prohibited Power Patron Portal - Terminus | 1/1/1 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Ragged Records of Rites | 3/3/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Skull Archfiend of Chaos | 1/1/1 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| The Great Gallant Bandit | 3/3/3 (main+side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| The Winged Dragon of Ra - Sphere Mode | 0/0/3 | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Theorealize | 1/1/1 | Absent | VOCAB, GY | Step 3 | script |  |
| Theorealize Liberation | 1/1/1 | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Theorealized Medius | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Vidolium the Unstable Power Patron of Unity | 3/2/3 | Absent | TRIG, LOCK, VOCAB, GY, PEND | Step 4 | script |  |
| Witch of the Black Forest | 1/1/1 | Absent | LOCK, VOCAB | Step 3 | script |  |
| A Bao A Qu, the Lightless Shadow | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Accesscode Talker | 0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Artemis, the Magistus Moon Maiden | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| Artmage Diactorus | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Artmage Non-Finito | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Dark Magician of Destruction | 1/1/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Dharc the Dark Charmer, Gloomy | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Haggard Lizardose | 0/0/1 (extra) | Absent | VOCAB, LINK | Step 4 | script |  |
| I:P Masquerena | 1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Junora the Power Patron of Tuning | 1/0/1 (extra) | Absent | CHAIN, TRIG, SYN, ZONE | Step 4 + beyond plan | card-deep |  |
| Knightmare Unicorn | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Mediclius the Extraordinary Power Patron | 1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Nerva the Power Patron of Creation | 1/1/0 (extra) | Absent | CHAIN, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Number 38: Hope Harbinger Dragon Titanic Galaxy | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Number 90: Galaxy-Eyes Photon Lord | 0/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Purification Power Patron | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Relinquished Anima | 1/1/1 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| S:P Little Knight | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Ars Magna "Philosophorum" | 1/1/1 (side) | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Mulcharmy Meowls | 3/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Solemn Accusation | 0/2/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Spell Shattering Sword | 1/1/1 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Typhoon | 3/3/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

### Radiant Typhoon

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Radiant Typhoon](https://ygoprodeck.com/deck/radiant-typhoon-745273): Bonn WCQ Regional - November 15th 2026, **Top 4** (446 players); 40 Main / 15 Extra / 15 Side.
2. [Radiant Typhoon](https://ygoprodeck.com/deck/radiant-typhoon-745053): Toronto WCQ Regional - November 14th 2026, **Runner-Up** (215 players); 40 Main / 15 Extra / 15 Side.
3. [Radiant Typhoon](https://ygoprodeck.com/deck/radiant-typhoon-744983): Warsaw WCQ Regional - November 14th 2026, **Top 8** (36 players); 40 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Mulcharmy Fuwalos | 3/3/3 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Ghost Ogre & Snow Rabbit | 3/0/3 (side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Fire Formation - Tenki | 1/1/0 | Absent | TRIG, VOCAB, CONT | Step 3 | script |  |
| Mystical Space Typhoon | 3/3/3 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Noble Knight's Shield-Bearer | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Pot of Extravagance | 2/0/2 | Absent | VOCAB | Step 3 | script |  |
| Radiant Typhoon Ascendance | 2/3/3 (main+side) | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Radiant Typhoon Chant | 1/1/1 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Eldam | 3/3/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Fonix, the Great Flame | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Radiant Typhoon Krosea | 3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Radiant Typhoon Mandate | 1/1/1 | Absent | CHAIN, TRIG, VOCAB, CONT | Step 3 | script |  |
| Radiant Typhoon Manifestation | 1/3/3 (main+side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Meghala | 2/3/2 (main+side) | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Radiant Typhoon Swen | 3/3/3 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Radiant Typhoon Varuroon, the Vibrant Vortex | 1/1/1 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script |  |
| Radiant Typhoon Vision | 3/3/3 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Shiina, Twin Tempests of Celestial Thunder | 3/3/3 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Super Polymerization | 3/3/3 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Elder Entity Norden | 1/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Favorite HERO Flame Wingman | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Garura, Wings of Resonant Life | 1/1/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Greatfly | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Hraesvelgr, the Desperate Doom Eagle | 0/1/1 (extra) | Absent | CHAIN, VOCAB, LINK | Step 4 | script |  |
| Maple Maiden | 1/1/1 (extra) | Absent | TRIG, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Mudragon of the Swamp | 1/1/1 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Phantom Fortress Enterblathnir | 1/1/2 (extra) | Absent | VOCAB, XYZ | Step 4 | script |  |
| Possessed Destiny - Wynn | 1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, FUS-MAT, CONTROL | Step 4 + beyond plan | card-deep |  |
| Radiant Typhoon Varuroon, the Marine Eidolon | 3/2/3 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Relinquished Anima | 0/1/0 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| Ritual Beast Ulti-Reirautari | 1/1/0 (extra) | Absent | CHAIN, HAND, LOCK, VOCAB, BANISH, LINK | Step 4 | script |  |
| S:P Little Knight | 1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/1/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| Totem Bird | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, XYZ | Step 4 | script |  |
| Wynn the Wind Charmer, Verdant | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Evenly Matched | 0/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 3/0/0 (side) | Absent | VOCAB | Step 3 | script |  |
| Lava Golem | 0/0/3 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Mulcharmy Purulia | 3/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Pot of Sloth | 2/3/3 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Solemn Accusation | 0/3/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 3/3/0 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |

### Sky Striker

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Sky Striker](https://ygoprodeck.com/deck/sky-striker-745443): Warsaw WCQ Regional - November 14th 2026, **Top 8** (36 players); 40 Main / 15 Extra / 15 Side.
2. [Sky Striker](https://ygoprodeck.com/deck/sky-striker-743939): Ecublens WCQ Regional - November 1st 2026, **Runner-Up** (57 players); 40 Main / 15 Extra / 15 Side.
3. [Sky Striker](https://ygoprodeck.com/deck/sky-striker-743591): YCS Orlando - November 7th 2026, **Top 16** (1417 players); 41 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Pot of Desires | 0/3/3 | Scripted & automatic | — | — | — | cost `banish-deck` 10, `draw` 2, `onePerTurn` (`cards.ts:64`). |
| Raigeki | 3/0/0 | Scripted & automatic | — | — | — | `destroy-all` (`cards.ts:373`). |
| Reinforcement of the Army | 0/1/1 | Scripted & automatic | — | — | — | `search-pick` pool `low-warrior` (`cards.ts:368`). |
| Upstart Goblin | 3/3/3 | Scripted & automatic | — | — | — | `draw-then-gift` (`cards.ts:82`). |
| Harpie's Feather Duster | 1/0/0 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 0/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 3/2/3 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Solemn Strike | 0/2/0 (side) | Partial | CHAIN | Step 1 | script | Counter Trap, Spell Speed 3, negates a monster effect (`cards.ts:358`, `engine.ts:1463-1467`); the "would be Special Summoned" half is missing. |
| Dominus Impulse | 0/0/3 (main+side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Forbidden Crown | 2/3/0 (main+side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Forbidden Droplet | 3/0/2 (main+side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Lightning Storm | 2/1/0 (main+side) | Absent | VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 3/0/0 | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Mystical Space Typhoon | 1/1/1 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Pot of Sloth | 2/3/3 (main+side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Radiant Typhoon Vision | 3/3/3 | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Sky Striker Ace - Raye | 3/3/3 | Absent | CHAIN, TRIG, VOCAB, GY, ZONE | Step 3 + beyond plan | card-deep |  |
| Sky Striker Ace - Roze | 2/2/2 | Absent | CHAIN, TRIG, VOCAB, GY, ZONE | Step 3 + beyond plan | card-deep |  |
| Sky Striker Mecha - Hornet Drones | 0/1/1 | Absent | CHAIN, VOCAB, TOKEN | Step 3 + beyond plan | card-deep |  |
| Sky Striker Mecha - Shark Cannon | 1/1/1 (main+side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Sky Striker Mecha - Widow Anchor | 1/3/3 | Absent | CHAIN, TRIG, CONTROL | Step 2 + beyond plan | card-deep |  |
| Sky Striker Mobilize - Engage! | 2/2/2 | Absent | VOCAB | Step 3 | script |  |
| Sky Striker Mobilize - Linkage! | 3/3/3 | Absent | CHAIN, LOCK, VOCAB, ZONE | Step 3 + beyond plan | card-deep |  |
| Sky Striker Special Maneuver - Lemnisgate! | 2/2/1 | Absent | CHAIN, VOCAB, GY | Step 3 | script |  |
| Super Polymerization | 0/0/3 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Fallen & The Virtuous | 3/3/0 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Triple Tactics Thrust | 0/1/2 (main+side) | Absent | VOCAB | Step 3 | script |  |
| Accesscode Talker | 0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Ecclesia and the Dark Dragon | 1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Elder Entity Norden | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Garura, Wings of Resonant Life | 0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Mudragon of the Swamp | 0/0/1 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Prototype Sky Striker Ace - Amatsu | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| S:P Little Knight | 1/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Azalea | 1/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Sky Striker Ace - Camellia | 0/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK, CONTROL | Step 4 + beyond plan | card-deep |  |
| Sky Striker Ace - Hayate | 2/1/1 (extra) | Absent | VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Kagari | 3/3/3 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Shizuku | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace - Zeke | 1/0/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Sky Striker Ace = Zero | 3/3/2 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/1/0 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| The Dragon that Devours the Dogma | 1/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Cosmic Cyclone | 3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 0/0/1 (side) | Absent | VOCAB | Step 3 | script |  |
| Illusion Gate | 0/0/1 (side) | Absent | VOCAB | Step 3 | script |  |
| Lava Golem | 0/2/0 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Solemn Accusation | 2/2/1 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 0/1/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Surgical Striker - H.A.M.P. | 1/0/0 (side) | Absent | TRIG, VOCAB | Step 3 | script |  |
| Typhoon | 0/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |

### Branded Dracotail

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Branded Dracotail](https://ygoprodeck.com/deck/branded-dracotail-745821): Hoorn WCQ Regional - November 21st 2026, **Runner-Up** (64 players, approx.); 40 Main / 15 Extra / 15 Side.
2. [Branded Dracotail](https://ygoprodeck.com/deck/branded-dracotail-745063): Toronto WCQ Regional - November 14th 2026, **Top 4** (215 players); 40 Main / 15 Extra / 15 Side.
3. [Branded Dracotail](https://ygoprodeck.com/deck/branded-dracotail-744501): Guayaquil WCQ Regional - November 8th 2026, **Top 8** (200 players, approx.); 44 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Harpie's Feather Duster | 0/0/1 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/0 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/0/3 | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Aluber the Jester of Despia | 3/1/2 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Blazing Cartesia, the Virtuous | 2/2/2 | Absent | CHAIN, HAND, TRIG, VOCAB, GY, FUS-EFF | Step 3 | script |  |
| Branded Fusion | 1/1/1 | Absent | LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Branded Opening | 1/1/1 | Absent | CHAIN, TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Branded in High Spirits | 1/1/1 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Crowley, the Gifted Magistus | 0/1/0 | Absent | TRIG, VOCAB, FUS-EFF | Step 3 | script |  |
| Dogmatika Ecclesia, the Virtuous | 1/0/0 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dracotail Faimena | 3/3/3 | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF | Step 3 | script |  |
| Dracotail Flame | 1/1/1 | Absent | CHAIN, VOCAB, GY, BANISH | Step 3 | script |  |
| Dracotail Lukias | 2/2/2 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Dracotail Mululu | 1/1/1 | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Dracotail Pan | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Dracotail Phryxul | 1/0/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Dracotail Sting | 1/1/1 | Absent | CHAIN, VOCAB, GY, BANISH | Step 3 | script |  |
| Dracotail Urgula | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Fallen of Albaz | 1/1/1 | Absent | TRIG, VOCAB, FUS-EFF | Step 3 | script |  |
| Fallen of the White Dragon | 2/2/2 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Guiding Quem, the Virtuous | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Incredible Ecclesia, the Virtuous | 1/1/2 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script |  |
| Ketu Dracotail | 1/1/1 | Absent | VOCAB, FUS-EFF | Step 3 | script |  |
| Rahu Dracotail | 1/1/1 | Absent | LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Super Polymerization | 0/3/3 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Fallen & The Virtuous | 3/3/3 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Alba-Lenatus the Abyss Dragon | 0/1/1 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Dracotail Arthalion | 2/2/2 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Dracotail Gulamel | 1/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Ecclesia and the Dark Dragon | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Elder Entity Norden | 0/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Granguignol the Dusk Dragon | 1/1/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Hyperinvoked Aeon | 1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Khaos Starsource Dragon | 1/0/0 (extra) | Absent | TRIG, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Lubellion the Searing Dragon | 1/0/1 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Mirrorjade the Iceblade Dragon | 1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Mixousia the Confounder | 1/1/1 (extra) | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Rindbrumm the Striking Dragon | 1/1/1 (extra) | Absent | CHAIN, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Secreterion Dragon | 1/1/1 (extra) | Absent | LOCK, VOCAB, BANISH | Step 3 | script |  |
| The Dragon that Devours the Dogma | 1/1/2 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| The Three Champions of Swordsoul | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Titaniklad the Ash Dragon | 1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Zoroa, the Magistus Verethragna | 0/1/0 (extra) | Absent | CHAIN, VOCAB, FUS-MAT, EQ-MON | Step 4 + beyond plan | card-deep |  |
| Artifact Lancea | 3/0/3 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Cosmic Cyclone | 3/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Evenly Matched | 0/0/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 3/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 3/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Skull Meister | 3/0/2 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |

### Branded

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Despia Branded](https://ygoprodeck.com/deck/despia-branded-745828): Hoorn WCQ Regional - November 21st 2026, **Top 8** (64 players, approx.); 45 Main / 15 Extra / 15 Side.
2. [Despia Branded](https://ygoprodeck.com/deck/despia-branded-745139): Bonn WCQ Regional - November 15th 2026, **Top 8** (446 players); 42 Main / 15 Extra / 15 Side.
3. [Despia Branded](https://ygoprodeck.com/deck/despia-branded-744492): Carcassonne WCQ Regional - November 8th 2026, **Top 4** (48 players); 41 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 3/3/2 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 2/0/0 | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| PSY-Frame Driver | 1/0/0 (side) | Absent — data only | — | — | data | Normal Monster: `real()` entry plus card-art (as in `meta-archetypes-coverage.md` §10.1). |
| Aluber the Jester of Despia | 3/3/3 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Blazing Cartesia, the Virtuous | 1/1/2 | Absent | CHAIN, HAND, TRIG, VOCAB, GY, FUS-EFF | Step 3 | script |  |
| Branded Fusion | 1/1/1 | Absent | LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Branded Opening | 1/1/1 | Absent | CHAIN, TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Branded Retribution | 0/1/0 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Branded in High Spirits | 1/1/1 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Cocatorium the Heavy Metal Avian | 1/0/0 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Dogmatika Ecclesia, the Virtuous | 1/1/1 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dominus Spark | 2/0/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Fallen of Albaz | 1/1/1 | Absent | TRIG, VOCAB, FUS-EFF | Step 3 | script |  |
| Fallen of the White Dragon | 2/2/2 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Gold Sarcophagus | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Guiding Quem, the Virtuous | 1/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Ido the Supreme Magical Force | 0/0/1 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Incredible Ecclesia, the Virtuous | 2/2/2 | Absent | CHAIN, HAND, TRIG, VOCAB, GY | Step 3 | script |  |
| Nadir Servant | 3/3/3 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Skull Meister | 3/0/0 (main+side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Small World | 3/0/0 | Absent | VOCAB | Step 3 | script |  |
| Springans Kitt | 0/2/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Super Polymerization | 0/3/3 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Fallen & The Virtuous | 3/3/3 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| The Golden Swordsoul | 0/1/0 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Tri-Brigade Mercourier | 1/1/1 | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Tri-Brigade Springans Kitt | 1/1/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Alba-Lenatus the Abyss Dragon | 1/0/0 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Albion the Sanctifire Dragon | 0/0/1 (extra) | Absent | CHAIN, LOCK, VOCAB, GY, FUS-MAT, ZONE | Step 4 + beyond plan | card-deep |  |
| Borreload Furious Dragon | 1/0/0 (extra) | Absent | CHAIN, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Despian Quaeritis | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Ecclesia and the Dark Dragon | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Favorite HERO Shining Flare Wingman | 0/0/1 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Granguignol the Dusk Dragon | 1/1/2 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Hyperinvoked Aeon | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Lubellion the Searing Dragon | 1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Mirrorjade the Iceblade Dragon | 1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Mixousia the Confounder | 1/1/1 (extra) | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Mudragon of the Swamp | 0/1/0 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Predaplant Dragostapelia | 0/1/0 (extra) | Absent | CHAIN, VOCAB, FUS-MAT, CTR | Step 4 + beyond plan | card-deep |  |
| Rindbrumm the Striking Dragon | 1/1/1 (extra) | Absent | CHAIN, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Secreterion Dragon | 1/0/0 (extra) | Absent | LOCK, VOCAB, BANISH | Step 3 | script |  |
| Sprind the Irondash Dragon | 1/1/0 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT, ZONE | Step 4 + beyond plan | card-deep |  |
| The Dragon that Devours the Dogma | 2/2/2 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| The Three Champions of Swordsoul | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Titaniklad the Ash Dragon | 1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Cosmic Cyclone | 0/0/1 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Hey, Space Trunade! | 0/0/1 (side) | Absent | VOCAB | Step 3 | script |  |
| Lava Golem | 0/3/0 (side) | Absent | TRIG, LOCK, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Mistaken Arrest | 3/3/3 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 3/3/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 0/2/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| PSY-Framegear Delta | 3/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| PSY-Framegear Gamma | 1/0/0 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Typhoon | 0/3/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Veidos the Eruption Dragon of Extinction | 2/0/0 (side) | Absent | CHAIN, HAND, VOCAB, CONTROL | Step 3 + beyond plan | card-deep |  |
| Garura, Wings of Resonant Life | 0/1/1 (extra+side) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |

### Sacred Beast

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Sacred Beasts](https://ygoprodeck.com/deck/sacred-beasts-745516): Bonn WCQ Regional - November 15th 2026, **Winner** (446 players); 40 Main / 15 Extra / 15 Side.
2. [Sacred Beasts](https://ygoprodeck.com/deck/sacred-beasts-745030): Bonn WCQ Regional - November 15th 2026, **Runner-Up** (446 players); 40 Main / 15 Extra / 15 Side.
3. [Sacred Beasts](https://ygoprodeck.com/deck/sacred-beasts-743946): Weston-Super-Mare WCQ Regional - November 8th 2026, **Winner** (46 players); 41 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Link Spider | 1/1/1 (extra) | Scripted & automatic | — | — | — | Link-1, arrow, "1 Normal Monster", data ignition to the pointed zone (`cards.ts:274-279`). |
| Harpie's Feather Duster | 0/0/1 (side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe` (`cards.ts:377`). |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 3/3/3 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 3/3/3 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| PSY-Frame Driver | 1/0/1 (side) | Absent — data only | — | — | data | Normal Monster: `real()` entry plus card-art (as in `meta-archetypes-coverage.md` §10.1). |
| Calamity of the Sacred Beasts - Hamon, Lord of Striking Thunder | 3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Card of the Soul | 3/3/3 (main+side) | Absent | VOCAB | Step 3 | script |  |
| Codebreaker Zero Day | 0/1/1 | Absent | TRIG, VOCAB | Step 3 | script |  |
| Fallen Paradise of the Sacred Beasts | 2/2/3 (main+side) | Absent | LOCK, VOCAB, BANISH, CONT | Step 3 | script |  |
| Inferno of the Sacred Beasts - Uria, Lord of Searing Flames | 2/1/2 (main+side) | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Infinity of the Sacred Beasts - Raviel, Lord of Phantasms | 3/3/3 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Lightning Crash | 3/3/0 (main+side) | Absent | VOCAB | Step 3 | script |  |
| Martyr of the Sacred Beasts | 3/3/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Nibiru, the Primal Being | 1/0/3 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Sacred Beasts Combined Assault | 1/1/1 | Absent | CHAIN, VOCAB, GY, FUS-EFF | Step 3 | script |  |
| Sacred Beasts Released | 3/3/3 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Sacred Beasts Thunderclap | 3/3/3 | Absent | TRIG, VOCAB, GY, CONT | Step 3 | script |  |
| Summoner of the Sacred Beasts | 1/1/1 | Absent | VOCAB, GY | Step 3 | script |  |
| The Great Gallant Bandit | 3/3/0 | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Allied Code Talker @Ignister | 0/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Angelechy Shatranga | 1/0/0 (extra) | Absent | VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Barricadeborg Blocker | 1/1/1 (extra) | Absent | TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Codebreaker Virus Berserker | 1/1/1 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Codebreaker Virus Swordsman | 1/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Cyberse Contract Witch | 0/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Firewall Dragon | 1/1/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, LINK | Step 4 | script |  |
| G Golem Crystal Heart | 0/1/1 (extra) | Absent | VOCAB, LINK, CTR | Step 4 + beyond plan | card-deep |  |
| Linkuriboh | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Perfectron Hydradrive Dragon | 1/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Relinquished Anima | 1/0/0 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| S:P Little Knight | 1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Secure Gardna | 1/1/1 (extra) | Absent | LOCK, VOCAB, LINK | Step 4 | script |  |
| The Chaotic Phantasmal Sacred Beasts | 1/1/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Thunder Dragon Colossus | 2/1/2 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| V-LAN Hydra | 1/1/1 (extra) | Absent | LOCK, VOCAB, LINK, TOKEN | Step 4 + beyond plan | card-deep |  |
| Ghost Belle & Haunted Mansion | 0/0/2 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Gordian Slicer | 3/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 2/2/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| PSY-Framegear Delta | 2/0/3 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| PSY-Framegear Gamma | 1/0/1 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Pot of Sloth | 0/3/0 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Skull Meister | 0/0/3 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Thunder King, the Lightningstrike Kaiju | 0/1/0 (side) | Absent | LOCK, VOCAB, CTR | Step 3 + beyond plan | card-deep |  |
| Typhoon | 2/3/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |


## 5. Unverified, exclusions and interpretation limits

1. **“Check”: no confident identity.** Exact TCG tournament-name queries `Check`, `Chec`, `Czech`, `Chick` returned no decks. A 300-record recent TCG scan returned no “Check”. **Blitzclique** is a weak phonetic/shorthand candidate (10 pure lists in that scan); **Angelechy** is chess-themed (Opening to e4, Shatranga), but is already separately requested; **Shark** is another possible phonetic typo, although the search's latest result was November 2025, not this format. Card-name search `fname=check` returned Checkker, Checkmate, Checksum Dragon, DNA Checkup and The Forceful Checkpoint—not a tournament archetype identification. None warrants silently substituting a deck. Ask the owner for a link or spelling. Candidate Blitzclique below is explicitly not counted as the twelfth requested deck.
2. **Unrevealed Side Deck:** Branded Dracotail Toronto [745063](https://ygoprodeck.com/deck/branded-dracotail-745063) uses `???`, whose API description says it is an intentionally unrevealed tournament-profile placeholder. All 15 Side Deck slots in that list are unrevealed and cannot be checked and are excluded from unique-card totals. A completely checked 75-card list cannot be claimed for it.
3. **Per-card mechanism tags are triage (ours).** All fetched descriptions were read, but initial tagging was keyword-assisted; it can over-tag “Token” exclusions, a normal Synchro recipe or references to banishment, and under-tag inherited effects or summon procedures. Specialized overrides were made, including Relinquished Anima (Equip, not Token creation) and The Great Gallant Bandit (opponent Tributes). Do not use cumulative unlock totals as a delivery guarantee; the final note deliberately omits those model-derived forecasts.
4. **No executable conformance tests** were run. Present-card status is static code/text comparison. Scripted & automatic is an operational classification of existing code, not certification against all Konami rulings. Fuwalos/Droll limitations are explicit to prevent equating their new presence with full printed-text coverage.
5. **Card API normalization:** passcodes were resolved through `card_images` and English names; alternate Ash/Ogre art otherwise produces false “Absent” results. Name-batching also returned **Mind Scan (Skill Card)** alongside Mind Scan; the Skill was excluded because no selected passcode references it. Old rejected-list-only cards are excluded too. Blue-Eyes Toon Dragon is art/shop-only, hence **Absent**, not partial gameplay.
6. **Source independence:** tournament event/date/placement assertions are YGOPRODeck's curated records, not individually corroborated with organizers. Some records have relative publication ages inconsistent with same-day events; event dates—not relative ages—govern inclusion. The official banlist and card limits were screened; language-region release legality and every official FAQ were not.
7. **Ash and draws:** the old research notes questioned this. This audit does not label draws alone as a scripting bug: drawing adds a card from the Deck to the hand, and `effects.ts:91` includes draw. A dedicated official FAQ verification was not performed. The Partial verdict instead rests on actual activation/origin/chain coverage.
8. **Copy counts:** rows combine zones; the appendix preserves zone-specific counts. Coverage counts unique names, not card copies; a 1-of and a 3-of each count once. Shared rankings count archetypes, not decks or events, and exclude Blitzclique.

## Sources and reproducibility

Fetched 2026-11-22. Deck URLs/event/date/placement are attached to each selected list above and below.

- Konami: [current list index](https://www.yugioh-card.com/en/limited/), [2026-10-19 list](https://www.yugioh-card.com/en/limited/list_2026-10-19/).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/), [card API](https://db.ygoprodeck.com/api/v7/cardinfo.php). First batch by passcode to resolve exact names, then `name=Name1|Name2|...&misc=yes` in batches of 15; every card name in the appendix links to an exact-name query. Types/texts used in the needs mapping came from those responses. No external data was executed.
- Deck search: `https://ygoprodeck.com/api/decks/getDecks.php?name=<URL-encoded name>&_sft_category=Tournament%20Meta%20Decks`; recent scan additionally used `offset=0,20,...,280`. Selected lists are the numbered L1/L2/L3 in each section. Exact and candidate queries are recorded in Unverified.
- Additional ambiguous-name search: [YGOPRODeck price check deck](https://ygoprodeck.com/deck/price-check-deck-738637) is a non-meta personal list, not evidence for “Check” as an archetype; [card-name search](https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=check).
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art}.ts`, `card-art.json`, and app `src/lib/junior/play/{master-decks,starters,masters}.ts`, `packs/`. See exact line anchors throughout.

## Appendix A. Provisional Blitzclique audit—not an identification of “Check”

Excluded from all main summary and shared rankings. Three current-format lists, 58 unique known cards including Side: 0 automatic, 4 Partial, 54 Absent. Main+Extra: 48 cards, 0 automatic, 4 Partial, 44 Absent. If the owner meant this deck, the analysis is ready; otherwise discard this appendix.

### Blitzclique (unconfirmed Check candidate)

Lists (YGOPRODeck "Tournament Meta Decks", TCG):

1. [Blitzclique](https://ygoprodeck.com/deck/blitzclique-745161): Duluth WCQ Regional - November 15th 2026, **Top 8** (152 players); 40 Main / 15 Extra / 15 Side.
2. [Blitzclique](https://ygoprodeck.com/deck/blitzclique-744999): Zoetermeer WCQ Regional - November 15th 2026, **Top 8** (50 players, approx.); 41 Main / 15 Extra / 15 Side.
3. [Blitzclique](https://ygoprodeck.com/deck/blitzclique-745135): Nancy WCQ Regional - November 14th 2026, **Top 8** (75 players); 40 Main / 15 Extra / 15 Side.

| Card | Copies (L1/L2/L3) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Droll & Lock Bird | 1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Ghost Ogre & Snow Rabbit | 3/2/2 | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Mulcharmy Fuwalos | 3/3/3 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Foolish Burial Goods | 2/0/0 (main+side) | Absent — data only | — | — | data | Fits the existing vocabulary: `{ do: "mill", filter: { kind: "spell" } }` + a trap alternative (`anyOf`) and `onePerTurn` (`catalogue.ts:205`, `:191`). |
| Blitzclique - Breakaway | 3/3/3 | Absent | CHAIN, TRIG, VOCAB, GY | Step 3 | script |  |
| Blitzclique - Steppleader | 1/1/1 | Absent | TRIG, VOCAB, GY, CONT | Step 3 | script |  |
| Blitzclique Alternator | 2/2/2 | Absent | CHAIN, VOCAB, GY, CONT | Step 3 | script |  |
| Blitzclique Overvolt | 1/1/1 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Blitzclique Return Stroke | 1/1/1 (main+side) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, CONT | Step 3 | script |  |
| Crackle Blitzclique | 3/3/3 | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Dominus Purge | 3/3/0 | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Emi Blitzclique | 1/1/1 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Grain Blitzclique | 3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| Hideout in the Sky, Coulomb | 3/3/3 | Absent | TRIG, VOCAB, GY, CONT, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Lightning Crash | 2/3/3 | Absent | VOCAB | Step 3 | script |  |
| Pot of Extravagance | 0/2/0 | Absent | VOCAB | Step 3 | script |  |
| Pot of Prosperity | 1/0/1 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Surge Blitzclique | 3/3/3 | Absent | TRIG, LOCK, VOCAB | Step 3 | script |  |
| The Fallen & The Virtuous | 0/0/3 | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Whisker Blitzclique | 3/3/3 | Absent | CHAIN, HAND, LOCK, VOCAB | Step 3 | script |  |
| Alba-Lenatus the Abyss Dragon | 1/0/0 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Angelechy Enlisted | 1/3/0 (extra) | Absent | VOCAB, SYN, ZONE, CONTROL | Step 4 + beyond plan | card-deep |  |
| Aussa the Earth Charmer, Immovable | 1/2/0 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Centur-Ion Legatia | 0/2/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Chimeratech Fortress Dragon | 1/0/0 (extra) | Absent | VOCAB, FUS-MAT | Step 4 | script |  |
| Chimeratech Megafleet Dragon | 1/0/0 (extra) | Absent | VOCAB, FUS-MAT, ZONE | Step 4 + beyond plan | card-deep |  |
| Coral Dragon | 1/0/0 (extra) | Absent | VOCAB | Step 3 | script |  |
| Ecclesia and the Dark Dragon | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Fata Dragna | 0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Favorite HERO Flame Wingman | 0/0/1 (extra) | Absent | CHAIN, HAND, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Favorite HERO Shining Flare Wingman | 0/0/1 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Garura, Wings of Resonant Life | 0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Khaos Starsource Dragon | 0/0/1 (extra) | Absent | TRIG, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Mixousia the Confounder | 0/0/1 (extra) | Absent | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Mudragon of the Swamp | 0/0/1 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Odin, Father of the Aesir | 1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script |  |
| Predaplant Triphyoverutum | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, FUS-MAT, CTR | Step 4 + beyond plan | card-deep |  |
| Psychic End Punisher | 1/0/0 (extra) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Relinquished Anima | 1/0/0 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| S:P Little Knight | 1/2/0 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Snake-Eyes Vengeance Dragon | 1/1/0 (extra) | Absent | CHAIN, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Starving Venom Fusion Dragon | 0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT, TOKEN | Step 4 + beyond plan | card-deep |  |
| Starving Venom Fusion Dragon, Four Heavenly Dragons | 0/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 | script |  |
| Super Starslayer TY-PHON - Sky Crisis | 2/3/1 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| The Dragon that Devours the Dogma | 0/0/2 (extra) | Absent | TRIG, LOCK, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Thunder Dragon Colossus | 1/2/1 (extra) | Absent | TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Underworld Goddess of the Closed World | 1/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Artifact Lancea | 0/0/3 (side) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Gordian Slicer | 3/3/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Mulcharmy Purulia | 3/2/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Nibiru, the Primal Being | 0/0/3 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Pot of Sloth | 0/0/3 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Solemn Judgment | 0/1/0 (side) | Absent | CHAIN, TRIG, VOCAB | Step 3 | script |  |
| Spiritualism | 0/2/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| The Great Gallant Bandit | 3/3/0 (side) | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| Thunder King Rai-Oh | 1/1/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Typhoon | 3/3/3 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |


## Appendix B. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 ; L2 ; L3. Passcodes canonicalized to names. Type labels are API types; they are not proof of summon support. This also preserves the unrevealed slot count.

### Angelechy — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Angelechy Bastion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Bastion) | Synchro Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [Angelechy Brilliant Move](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Brilliant%20Move) | Spell Card | 1/0/0 | 0/0/0 | 1/0/0 |
| [Angelechy Castellan](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Castellan) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Angelechy Destrier](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Destrier) | Synchro Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [Angelechy Disturbance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Disturbance) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Angelechy Endgame Problem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Endgame%20Problem) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Angelechy Enlisted](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Enlisted) | Synchro Tuner Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [Angelechy Opening to e4](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Opening%20to%20e4) | Trap Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Angelechy Opposition](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Opposition) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Angelechy Problem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Problem) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Angelechy Seneschal](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Seneschal) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Angelechy Shatranga](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Shatranga) | Synchro Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [Angelechy Strategy Score](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Strategy%20Score) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Angelechy Verdict](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Verdict) | Trap Card | 2/0/0 | 2/0/0 | 2/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Assault Blackwing - Kusanagi the Gathering Storm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Assault%20Blackwing%20-%20Kusanagi%20the%20Gathering%20Storm) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Black-Winged Assault Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black-Winged%20Assault%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Centur-Ion Legatia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Centur-Ion%20Legatia) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Chaos Angel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Angel) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 2/0/0 | 3/0/0 | 3/0/0 |
| [Dominus Purge](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Purge) | Trap Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dominus Spark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Spark) | Trap Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 3/0/0 | 3/0/0 |
| [Foolish Burial Goods](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial%20Goods) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/2 | 0/0/0 | 0/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 3/0/0 | 0/0/0 | 0/0/0 |
| [Inspector Boarder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Inspector%20Boarder) | Effect Monster | 0/0/3 | 0/0/3 | 0/0/3 |
| [Masterflare Hyperion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Masterflare%20Hyperion) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Pot of Desires](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Desires) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/2 | 0/0/0 | 0/0/3 |
| [Rainbow Bridge Bifrost](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rainbow%20Bridge%20Bifrost) | Spell Card | 0/0/0 | 0/0/2 | 0/0/0 |
| [Satellite Warrior](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Satellite%20Warrior) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Set Rotation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Set%20Rotation) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 |
| [Snake-Eyes Vengeance Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Snake-Eyes%20Vengeance%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Terraforming](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Terraforming) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/3 |
| [The Winged Dragon of Ra - Sphere Mode](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Winged%20Dragon%20of%20Ra%20-%20Sphere%20Mode) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/3 | 0/0/0 |
### Elfnote — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Adamancipator Risen - Dragite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Adamancipator%20Risen%20-%20Dragite) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Arcanite Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Arcanite%20Magician) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ars Magna "Citrinitas"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20%22Citrinitas%22) | Spell Card | 2/0/0 | 2/0/0 | 2/0/0 |
| [Ars Magna "Philosophorum"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20%22Philosophorum%22) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Ars Magna the Corruption and the Purification](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Corruption%20and%20the%20Purification) | Effect Monster | 1/0/0 | 1/0/1 | 1/0/0 |
| [Ars Magna the Division and the Union](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Division%20and%20the%20Union) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ars Magna the Finite and the Infinite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Finite%20and%20the%20Infinite) | Effect Monster | 1/0/0 | 2/0/0 | 1/0/0 |
| [Artmage Diactorus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Diactorus) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Black Rose Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Rose%20Dragon) | Synchro Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Dharc the Dark Charmer, Gloomy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dharc%20the%20Dark%20Charmer%2C%20Gloomy) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Diabell, Queen of the White Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diabell%2C%20Queen%20of%20the%20White%20Forest) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 3/0/0 | 0/0/0 | 3/0/0 |
| [Elfnote Fortuna](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnote%20Fortuna) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Elfnote June Pride](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnote%20June%20Pride) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Elfnote Lucina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnote%20Lucina) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Elfnote Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnote%20Power%20Patron) | Tuner Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Elfnote Regina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnote%20Regina) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Elfnote Seraphim Strelitzia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnote%20Seraphim%20Strelitzia) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Elfnotes: Rhapsodia of Madness](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elfnotes%3A%20Rhapsodia%20of%20Madness) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Haggard Lizardose](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Haggard%20Lizardose) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Junoldo the Shadespirit Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junoldo%20the%20Shadespirit%20Power%20Patron) | Pendulum Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Junora the Power Patron of Tuning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junora%20the%20Power%20Patron%20of%20Tuning) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Kewl Tune RS](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kewl%20Tune%20RS) | Synchro Tuner Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Mediclius the Extraordinary Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mediclius%20the%20Extraordinary%20Power%20Patron) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Medius the Pure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Medius%20the%20Pure) | Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Mistaken Arrest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mistaken%20Arrest) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/2 | 0/0/3 | 0/0/1 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/2 | 0/0/3 | 0/0/0 |
| [Number 38: Hope Harbinger Dragon Titanic Galaxy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2038%3A%20Hope%20Harbinger%20Dragon%20Titanic%20Galaxy) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Number 90: Galaxy-Eyes Photon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2090%3A%20Galaxy-Eyes%20Photon%20Lord) | XYZ Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Pendulum Treasure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pendulum%20Treasure) | Spell Card | 0/0/0 | 0/0/2 | 1/0/1 |
| [Prohibited Power Patron Portal - Terminus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Prohibited%20Power%20Patron%20Portal%20-%20Terminus) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Psychic End Punisher](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Psychic%20End%20Punisher) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Purification Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Purification%20Power%20Patron) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ravenous Crocodragon Archethys](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ravenous%20Crocodragon%20Archethys) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/2 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [The Executor of the Underworld - Pluto](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Executor%20of%20the%20Underworld%20-%20Pluto) | Synchro Tuner Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/3 |
| [Theorealize](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize) | Spell Card | 1/0/0 | 0/0/0 | 1/0/0 |
| [Theorealize Past Lull](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize%20Past%20Lull) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Theorealized Medius](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealized%20Medius) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 3/0/0 | 0/0/3 |
| [Veidos the Eruption Dragon of Extinction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Veidos%20the%20Eruption%20Dragon%20of%20Extinction) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/3 |
| [Vidolium the Unstable Power Patron of Unity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vidolium%20the%20Unstable%20Power%20Patron%20of%20Unity) | Pendulum Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Zalen the Shackled Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Zalen%20the%20Shackled%20Dragon) | Synchro Tuner Monster | 0/0/0 | 0/1/0 | 0/0/0 |
### Toon — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ancient Warriors Oath - Double Dragon Lords](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ancient%20Warriors%20Oath%20-%20Double%20Dragon%20Lords) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Angelechy Enlisted](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Enlisted) | Synchro Tuner Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Animimicat](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Animimicat) | Effect Monster | 3/0/0 | 2/0/0 | 3/0/0 |
| [Arc Rebellion Xyz Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Arc%20Rebellion%20Xyz%20Dragon) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Blue-Eyes Toon Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20Toon%20Dragon) | Toon Monster | 1/0/0 | 0/0/0 | 0/0/0 |
| [Blue-Eyes Toon Ultimate Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20Toon%20Ultimate%20Dragon) | Toon Monster | 0/2/0 | 0/0/0 | 0/0/0 |
| [Centur-Ion Auxila](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Centur-Ion%20Auxila) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Centur-Ion Legatia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Centur-Ion%20Legatia) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Chaos Angel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Angel) | Synchro Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Chimera the King of Phantom Beasts](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chimera%20the%20King%20of%20Phantom%20Beasts) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Cooky★Yummy Way](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cooky%E2%98%85Yummy%20Way) | Synchro Tuner Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Crystron Halqifibrax Prism](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crystron%20Halqifibrax%20Prism) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Dark Rebellion Xyz Dragon, Four Heavenly Dragons](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Rebellion%20Xyz%20Dragon%2C%20Four%20Heavenly%20Dragons) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Dark-Eyes Illusionist Faceless Mage](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark-Eyes%20Illusionist%20Faceless%20Mage) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Divine Arsenal AA-ZEUS - Sky Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Divine%20Arsenal%20AA-ZEUS%20-%20Sky%20Thunder) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 3/0/0 | 0/0/0 | 3/0/0 |
| [Dominus Spark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Spark) | Trap Card | 0/0/0 | 0/0/0 | 2/0/0 |
| [Dragunity Knight - Luin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dragunity%20Knight%20-%20Luin) | Synchro Tuner Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Dragunity Lord - Georgius](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dragunity%20Lord%20-%20Georgius) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 3/0/0 | 3/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/3 | 0/0/1 | 0/0/0 |
| [Evil Box](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evil%20Box) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Evilswarm Exciton Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evilswarm%20Exciton%20Knight) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Evilswarm Ophion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evilswarm%20Ophion) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Exosister Karmael](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Exosister%20Karmael) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Fabled Levilazebul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fabled%20Levilazebul) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Fire Formation - Tenki](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20Formation%20-%20Tenki) | Spell Card | 0/0/0 | 2/0/0 | 0/0/0 |
| [Funny Dark Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Funny%20Dark%20Rabbit) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 0/0/1 | 0/0/2 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Illusion Gate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Illusion%20Gate) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Magistus Chorozo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magistus%20Chorozo) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Mind Crush](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mind%20Crush) | Trap Card | 0/0/3 | 0/0/0 | 0/0/2 |
| [Mind Scan](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mind%20Scan) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/3 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/2 | 0/0/3 | 0/0/1 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/2 |
| [Odin, Father of the Aesir](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Odin%2C%20Father%20of%20the%20Aesir) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Perfect Toon World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Perfect%20Toon%20World) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Piri Reis Map](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Piri%20Reis%20Map) | Spell Card | 3/0/0 | 1/0/0 | 1/0/1 |
| [Pot of Prosperity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Prosperity) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/1 | 0/0/0 | 0/0/2 |
| [Rahamu, Envoy of the Sacred Tome](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rahamu%2C%20Envoy%20of%20the%20Sacred%20Tome) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Raider's Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Raider%27s%20Knight) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Rainbow Bridge Bifrost](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rainbow%20Bridge%20Bifrost) | Spell Card | 3/0/0 | 0/0/0 | 3/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Salamangreat Almiraj](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Salamangreat%20Almiraj) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Scareclaw Light-Heart](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Scareclaw%20Light-Heart) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Scareclaw Tri-Heart](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Scareclaw%20Tri-Heart) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Selene, Queen of the Master Magicians](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Selene%2C%20Queen%20of%20the%20Master%20Magicians) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 3/0/0 | 0/0/3 | 0/0/0 |
| [Sky Striker Ace - Azalea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Azalea) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/0 | 0/0/1 | 0/0/1 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Terraforming](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Terraforming) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Toon Bookmark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Toon%20Bookmark) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Toon Dark Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Toon%20Dark%20Magician) | Toon Monster | 1/0/0 | 0/0/0 | 0/0/0 |
| [Toon Table of Contents](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Toon%20Table%20of%20Contents) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Toon Terror](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Toon%20Terror) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Tornado Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tornado%20Dragon) | XYZ Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Tri-Brigade Arms Bucephalus II](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Arms%20Bucephalus%20II) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Tri-Brigade Arms Mouser](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Arms%20Mouser) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Tri-Brigade Bearbrumm the Rampant Rampager](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Bearbrumm%20the%20Rampant%20Rampager) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Tri-Brigade Ferrijit the Barren Blossom](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Ferrijit%20the%20Barren%20Blossom) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Tri-Brigade Fraktall](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Fraktall) | Effect Monster | 0/0/0 | 3/0/0 | 0/0/0 |
| [Tri-Brigade Kitt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Kitt) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [Tri-Brigade Nervall](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Nervall) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [Tri-Brigade Revolt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Revolt) | Trap Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Tri-Brigade Rugal the Silver Sheller](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Rugal%20the%20Silver%20Sheller) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Tri-Brigade Shuraig the Ominous Omen](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Shuraig%20the%20Ominous%20Omen) | Link Monster | 0/0/0 | 0/2/0 | 0/0/0 |
| [Tri-Brigade Springans Kitt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Springans%20Kitt) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/0 | 1/0/1 |
| [Yummy★Snatchy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Yummy%E2%98%85Snatchy) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
### Artmage — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Ars Magna "Citrinitas"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20%22Citrinitas%22) | Spell Card | 1/0/0 | 2/0/0 | 2/0/0 |
| [Ars Magna "Philosophorum"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20%22Philosophorum%22) | Trap Card | 0/0/1 | 0/0/1 | 0/0/0 |
| [Ars Magna the Corruption and the Purification](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Corruption%20and%20the%20Purification) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ars Magna the Division and the Union](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Division%20and%20the%20Union) | Effect Monster | 1/0/0 | 0/0/1 | 1/0/0 |
| [Ars Magna the Finite and the Infinite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Finite%20and%20the%20Infinite) | Effect Monster | 1/0/1 | 1/0/0 | 1/0/0 |
| [Artmage Academic Arcane Arts Acropolis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Academic%20Arcane%20Arts%20Acropolis) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Artmage Diactorus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Diactorus) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Artmage Finmel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Finmel) | Effect Monster | 2/0/0 | 2/0/0 | 1/0/0 |
| [Artmage Graflare](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Graflare) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Artmage Impasto -Recapture-](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Impasto%20-Recapture-) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Artmage Litera](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Litera) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Artmage Non-Finito](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Non-Finito) | Fusion Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [Artmage Pact -Awakening-](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Pact%20-Awakening-) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Artmage Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Power%20Patron) | Effect Monster | 2/0/0 | 2/0/0 | 1/0/0 |
| [Artmage Vandalism -Assault-](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Vandalism%20-Assault-) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Artmage Varnish -Alteration-](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Varnish%20-Alteration-) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 0/0/3 | 0/0/3 | 3/0/0 |
| [Beyond the Pendulum](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Beyond%20the%20Pendulum) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Dharc the Dark Charmer, Gloomy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dharc%20the%20Dark%20Charmer%2C%20Gloomy) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Elder Entity Norden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elder%20Entity%20Norden) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 2/0/0 | 0/0/0 | 0/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 0/0/0 | 0/0/3 | 3/0/0 |
| [Gordian Slicer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gordian%20Slicer) | Spell Card | 2/0/0 | 0/0/0 | 0/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 3/0/0 | 0/0/3 |
| [Hyperinvoked Aeon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hyperinvoked%20Aeon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Junoldo the Shadespirit Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junoldo%20the%20Shadespirit%20Power%20Patron) | Pendulum Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 |
| [Junora the Power Patron of Tuning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junora%20the%20Power%20Patron%20of%20Tuning) | Synchro Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Jupiter the Power Patron of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jupiter%20the%20Power%20Patron%20of%20Destruction) | XYZ Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Jupredo the Shademachine Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jupredo%20the%20Shademachine%20Power%20Patron) | Pendulum Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Mediclius the Extraordinary Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mediclius%20the%20Extraordinary%20Power%20Patron) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Medius the Pure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Medius%20the%20Pure) | Effect Monster | 2/0/1 | 2/0/0 | 2/0/1 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 2/0/1 | 0/0/3 |
| [Nerva the Power Patron of Creation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nerva%20the%20Power%20Patron%20of%20Creation) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Nervedo the Shadebeast Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nervedo%20the%20Shadebeast%20Power%20Patron) | Pendulum Effect Monster | 3/0/0 | 2/0/0 | 2/0/1 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/2 |
| [Number 38: Hope Harbinger Dragon Titanic Galaxy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2038%3A%20Hope%20Harbinger%20Dragon%20Titanic%20Galaxy) | XYZ Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Number 90: Galaxy-Eyes Photon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2090%3A%20Galaxy-Eyes%20Photon%20Lord) | XYZ Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Odd-Eyes Absolute Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Odd-Eyes%20Absolute%20Dragon) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Odd-Eyes Vortex Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Odd-Eyes%20Vortex%20Dragon) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Pendulum Treasure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pendulum%20Treasure) | Spell Card | 3/0/0 | 3/0/0 | 2/0/1 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 2/0/0 | 0/0/2 | 0/0/0 |
| [Predaplant Dragostapelia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Predaplant%20Dragostapelia) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Prohibited Power Patron Portal - Terminus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Prohibited%20Power%20Patron%20Portal%20-%20Terminus) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Purification Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Purification%20Power%20Patron) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Sky Striker Ace - Azalea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Azalea) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 3/0/0 | 0/0/0 | 0/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/3 | 3/0/0 | 2/0/1 |
| [The Winged Dragon of Ra - Sphere Mode](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Winged%20Dragon%20of%20Ra%20-%20Sphere%20Mode) | Effect Monster | 0/0/0 | 0/0/1 | 0/0/0 |
| [Theorealize](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 |
| [Theorealize Liberation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize%20Liberation) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Theorealize Past Lull](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize%20Past%20Lull) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Theorealized Medius](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealized%20Medius) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/3 | 3/0/0 |
| [Vidolium the Unstable Power Patron of Unity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vidolium%20the%20Unstable%20Power%20Patron%20of%20Unity) | Pendulum Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
### Unchained — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [A Bao A Qu, the Lightless Shadow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=A%20Bao%20A%20Qu%2C%20the%20Lightless%20Shadow) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Abominable Chamber of the Unchained](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Abominable%20Chamber%20of%20the%20Unchained) | Trap Card | 1/0/0 | 0/0/0 | 1/0/0 |
| [Abominable Unchained Soul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Abominable%20Unchained%20Soul) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Abomination's Prison](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Abomination%27s%20Prison) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 3/0/0 | 3/0/0 | 0/0/3 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Escape of the Unchained](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Escape%20of%20the%20Unchained) | Trap Card | 1/0/0 | 2/0/0 | 2/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 2/0/1 | 3/0/0 | 0/0/3 |
| [Goblin's Crazy Beast](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Goblin%27s%20Crazy%20Beast) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Gordian Slicer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gordian%20Slicer) | Spell Card | 0/0/3 | 0/0/0 | 0/0/3 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Knightmare Phoenix](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Knightmare%20Phoenix) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Knightmare Unicorn](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Knightmare%20Unicorn) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mistaken Arrest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mistaken%20Arrest) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 |
| [Muckraker From the Underworld](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Muckraker%20From%20the%20Underworld) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/3 | 3/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/0 |
| [Pot of Prosperity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Prosperity) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Reincarnation of the Unchained](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Reincarnation%20of%20the%20Unchained) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/1 | 0/0/0 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/1 | 0/0/0 | 0/0/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/3 | 0/0/3 |
| [Unchained Abomination](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Abomination) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Unchained Firelord of Yama](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Firelord%20of%20Yama) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Unchained Hunger](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Hunger) | Trap Card | 1/0/0 | 1/0/0 | 2/0/0 |
| [Unchained Oni of Shara](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Oni%20of%20Shara) | Effect Monster | 3/0/0 | 1/0/0 | 3/0/0 |
| [Unchained Oni of Shyma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Oni%20of%20Shyma) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Unchained Soul Lord of Yama](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Soul%20Lord%20of%20Yama) | Link Monster | 0/3/0 | 0/3/0 | 0/3/0 |
| [Unchained Soul of Abominable Rage](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Soul%20of%20Abominable%20Rage) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Unchained Soul of Anguish](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Soul%20of%20Anguish) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Unchained Soul of Rage](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Soul%20of%20Rage) | Link Monster | 0/1/0 | 0/2/0 | 0/1/0 |
| [Unchained Soul of Sharvara](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Soul%20of%20Sharvara) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Unchained Soul of Shyama](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Soul%20of%20Shyama) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Unchained Twins - Aruha](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Twins%20-%20Aruha) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Unchained Twins - Rakea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Twins%20-%20Rakea) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Unchained Twins - Sarama](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Twins%20-%20Sarama) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Unchained Zealot - Kamra](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Unchained%20Zealot%20-%20Kamra) | Effect Monster | 3/0/0 | 2/0/1 | 3/0/0 |
| [Underworld Goddess of the Closed World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Underworld%20Goddess%20of%20the%20Closed%20World) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
### Light and Darkness Ritual — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [A Bao A Qu, the Lightless Shadow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=A%20Bao%20A%20Qu%2C%20the%20Lightless%20Shadow) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ars Magna "Citrinitas"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20%22Citrinitas%22) | Spell Card | 2/0/0 | 2/0/0 | 2/0/0 |
| [Ars Magna "Philosophorum"](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20%22Philosophorum%22) | Trap Card | 0/0/1 | 0/0/1 | 0/0/1 |
| [Ars Magna the Corruption and the Purification](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Corruption%20and%20the%20Purification) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ars Magna the Division and the Union](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Division%20and%20the%20Union) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ars Magna the Finite and the Infinite](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ars%20Magna%20the%20Finite%20and%20the%20Infinite) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Artemis, the Magistus Moon Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artemis%2C%20the%20Magistus%20Moon%20Maiden) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Artmage Diactorus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Diactorus) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Artmage Impasto -Recapture-](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Impasto%20-Recapture-) | Trap Card | 1/0/0 | 0/0/1 | 0/0/1 |
| [Artmage Non-Finito](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Non-Finito) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Artmage Vandalism -Assault-](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artmage%20Vandalism%20-Assault-) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 0/0/3 |
| [Black Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Chaos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Black Luster Soldier - Soldier of Light and Darkness](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Luster%20Soldier%20-%20Soldier%20of%20Light%20and%20Darkness) | Ritual Effect Monster | 0/0/1 | 1/0/0 | 0/0/0 |
| [Dark Magical Curtain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Curtain) | Spell Card | 1/0/0 | 1/0/0 | 1/0/2 |
| [Dark Magician of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20of%20Destruction) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Dharc the Dark Charmer, Gloomy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dharc%20the%20Dark%20Charmer%2C%20Gloomy) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 0/0/3 |
| [Gordian Slicer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gordian%20Slicer) | Spell Card | 3/0/0 | 0/0/0 | 0/0/0 |
| [Griffoh](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Griffoh) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Haggard Lizardose](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Haggard%20Lizardose) | Link Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Junoldo the Shadespirit Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junoldo%20the%20Shadespirit%20Power%20Patron) | Pendulum Effect Monster | 1/0/0 | 0/0/0 | 1/0/0 |
| [Junora the Power Patron of Tuning](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Junora%20the%20Power%20Patron%20of%20Tuning) | Synchro Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Jupredo the Shademachine Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Jupredo%20the%20Shademachine%20Power%20Patron) | Pendulum Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Knightmare Unicorn](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Knightmare%20Unicorn) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Kuriboh - Multiply!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kuriboh%20-%20Multiply%21) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Light and Darkness Ritual](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Light%20and%20Darkness%20Ritual) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Magician of Dark Chaos - Black Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Dark%20Chaos%20-%20Black%20Chaos) | Ritual Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Mediclius the Extraordinary Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mediclius%20the%20Extraordinary%20Power%20Patron) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Medius the Pure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Medius%20the%20Pure) | Effect Monster | 2/0/0 | 2/0/0 | 2/0/1 |
| [Mind Shuffle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mind%20Shuffle) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Meowls](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Meowls) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 2/0/1 | 3/0/0 |
| [Nerva the Power Patron of Creation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nerva%20the%20Power%20Patron%20of%20Creation) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Nervedo the Shadebeast Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nervedo%20the%20Shadebeast%20Power%20Patron) | Pendulum Effect Monster | 2/0/0 | 2/0/0 | 3/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/3 | 2/0/0 | 0/0/0 |
| [Number 38: Hope Harbinger Dragon Titanic Galaxy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2038%3A%20Hope%20Harbinger%20Dragon%20Titanic%20Galaxy) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Number 90: Galaxy-Eyes Photon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2090%3A%20Galaxy-Eyes%20Photon%20Lord) | XYZ Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Pendulum Treasure](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pendulum%20Treasure) | Spell Card | 3/0/0 | 2/0/0 | 3/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/3 | 3/0/0 |
| [Prohibited Power Patron Portal - Terminus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Prohibited%20Power%20Patron%20Portal%20-%20Terminus) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Purification Power Patron](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Purification%20Power%20Patron) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ragged Records of Rites](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragged%20Records%20of%20Rites) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Skull Archfiend of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Archfiend%20of%20Chaos) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/0 | 0/0/2 | 0/0/0 |
| [Spell Shattering Sword](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spell%20Shattering%20Sword) | Spell Card | 0/0/1 | 0/0/1 | 0/0/1 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 3/0/0 | 0/0/3 | 3/0/0 |
| [The Winged Dragon of Ra - Sphere Mode](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Winged%20Dragon%20of%20Ra%20-%20Sphere%20Mode) | Effect Monster | 0/0/0 | 0/0/0 | 3/0/0 |
| [Theorealize](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Theorealize Liberation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealize%20Liberation) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Theorealized Medius](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Theorealized%20Medius) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/3 | 0/0/3 |
| [Vidolium the Unstable Power Patron of Unity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Vidolium%20the%20Unstable%20Power%20Patron%20of%20Unity) | Pendulum Effect Monster | 3/0/0 | 2/0/0 | 3/0/0 |
| [Witch of the Black Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Witch%20of%20the%20Black%20Forest) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
### Radiant Typhoon — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Elder Entity Norden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elder%20Entity%20Norden) | Fusion Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 |
| [Favorite HERO Flame Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Flame%20Wingman) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Fire Formation - Tenki](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fire%20Formation%20-%20Tenki) | Spell Card | 1/0/0 | 1/0/0 | 0/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 0/0/3 | 0/0/0 | 0/0/3 |
| [Greatfly](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Greatfly) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 |
| [Hraesvelgr, the Desperate Doom Eagle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hraesvelgr%2C%20the%20Desperate%20Doom%20Eagle) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Lava Golem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lava%20Golem) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Maple Maiden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Maple%20Maiden) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 0/0/3 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 |
| [Mystical Space Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mystical%20Space%20Typhoon) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Noble Knight's Shield-Bearer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Noble%20Knight%27s%20Shield-Bearer) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Phantom Fortress Enterblathnir](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Phantom%20Fortress%20Enterblathnir) | XYZ Monster | 0/1/0 | 0/1/0 | 0/2/0 |
| [Possessed Destiny - Wynn](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Possessed%20Destiny%20-%20Wynn) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Pot of Extravagance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Extravagance) | Spell Card | 2/0/0 | 0/0/0 | 2/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/2 | 0/0/3 | 0/0/3 |
| [Radiant Typhoon Ascendance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Ascendance) | Spell Card | 2/0/0 | 3/0/0 | 2/0/1 |
| [Radiant Typhoon Chant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Chant) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Radiant Typhoon Eldam](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Eldam) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Radiant Typhoon Fonix, the Great Flame](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Fonix%2C%20the%20Great%20Flame) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Radiant Typhoon Krosea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Krosea) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Radiant Typhoon Mandate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Mandate) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Radiant Typhoon Manifestation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Manifestation) | Spell Card | 1/0/0 | 3/0/0 | 2/0/1 |
| [Radiant Typhoon Meghala](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Meghala) | Effect Monster | 1/0/1 | 3/0/0 | 1/0/1 |
| [Radiant Typhoon Swen](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Swen) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Radiant Typhoon Varuroon, the Marine Eidolon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Varuroon%2C%20the%20Marine%20Eidolon) | Link Monster | 0/3/0 | 0/2/0 | 0/3/0 |
| [Radiant Typhoon Varuroon, the Vibrant Vortex](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Varuroon%2C%20the%20Vibrant%20Vortex) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Radiant Typhoon Vision](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Vision) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ritual Beast Ulti-Reirautari](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ritual%20Beast%20Ulti-Reirautari) | Link Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Shiina, Twin Tempests of Celestial Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shiina%2C%20Twin%20Tempests%20of%20Celestial%20Thunder) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/0 | 0/0/3 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/3 | 0/0/3 | 0/0/0 |
| [Totem Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Totem%20Bird) | XYZ Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Wynn the Wind Charmer, Verdant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Wynn%20the%20Wind%20Charmer%2C%20Verdant) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
### Sky Striker — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/3 | 0/0/0 | 0/0/0 |
| [Dominus Impulse](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Impulse) | Trap Card | 0/0/0 | 0/0/0 | 1/0/2 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 |
| [Ecclesia and the Dark Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ecclesia%20and%20the%20Dark%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Elder Entity Norden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elder%20Entity%20Norden) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Forbidden Crown](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Crown) | Spell Card | 0/0/2 | 3/0/0 | 0/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 0/0/3 | 0/0/0 | 2/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 0/0/3 | 2/0/0 | 3/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/1 | 0/0/0 | 0/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Illusion Gate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Illusion%20Gate) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Lava Golem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lava%20Golem) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/0 |
| [Lightning Storm](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lightning%20Storm) | Spell Card | 2/0/0 | 0/0/1 | 0/0/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 0/0/3 | 0/0/3 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 3/0/0 | 0/0/0 | 0/0/0 |
| [Mystical Space Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mystical%20Space%20Typhoon) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Pot of Desires](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Desires) | Spell Card | 0/0/0 | 3/0/0 | 3/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 2/0/0 | 0/0/3 | 0/0/3 |
| [Prototype Sky Striker Ace - Amatsu](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Prototype%20Sky%20Striker%20Ace%20-%20Amatsu) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Radiant Typhoon Vision](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Radiant%20Typhoon%20Vision) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Raigeki](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Raigeki) | Spell Card | 3/0/0 | 0/0/0 | 0/0/0 |
| [Reinforcement of the Army](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Reinforcement%20of%20the%20Army) | Spell Card | 0/0/0 | 1/0/0 | 1/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Sky Striker Ace - Azalea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Azalea) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Sky Striker Ace - Camellia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Camellia) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Sky Striker Ace - Hayate](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Hayate) | Link Monster | 0/2/0 | 0/1/0 | 0/1/0 |
| [Sky Striker Ace - Kagari](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Kagari) | Link Monster | 0/3/0 | 0/3/0 | 0/3/0 |
| [Sky Striker Ace - Raye](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Raye) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Sky Striker Ace - Roze](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Roze) | Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Sky Striker Ace - Shizuku](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Shizuku) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Sky Striker Ace - Zeke](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20-%20Zeke) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Sky Striker Ace = Zero](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Ace%20%3D%20Zero) | Link Monster | 0/3/0 | 0/3/0 | 0/2/0 |
| [Sky Striker Mecha - Hornet Drones](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mecha%20-%20Hornet%20Drones) | Spell Card | 0/0/0 | 1/0/0 | 1/0/0 |
| [Sky Striker Mecha - Shark Cannon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mecha%20-%20Shark%20Cannon) | Spell Card | 1/0/0 | 1/0/0 | 0/0/1 |
| [Sky Striker Mecha - Widow Anchor](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mecha%20-%20Widow%20Anchor) | Spell Card | 1/0/0 | 3/0/0 | 3/0/0 |
| [Sky Striker Mobilize - Engage!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mobilize%20-%20Engage%21) | Spell Card | 2/0/0 | 2/0/0 | 2/0/0 |
| [Sky Striker Mobilize - Linkage!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Mobilize%20-%20Linkage%21) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Sky Striker Special Maneuver - Lemnisgate!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sky%20Striker%20Special%20Maneuver%20-%20Lemnisgate%21) | Spell Card | 2/0/0 | 2/0/0 | 1/0/0 |
| [Solemn Accusation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Accusation) | Trap Card | 0/0/2 | 0/0/2 | 0/0/1 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Solemn Strike](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Strike) | Trap Card | 0/0/0 | 0/0/2 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Surgical Striker - H.A.M.P.](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Surgical%20Striker%20-%20H.A.M.P.) | Effect Monster | 0/0/1 | 0/0/0 | 0/0/0 |
| [The Dragon that Devours the Dogma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dragon%20that%20Devours%20the%20Dogma) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [The Fallen & The Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Fallen%20%26%20The%20Virtuous) | Spell Card | 3/0/0 | 3/0/0 | 0/0/0 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 0/0/0 | 0/0/1 | 2/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/0 | 0/0/0 | 0/0/3 |
| [Upstart Goblin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Upstart%20Goblin) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
### Branded Dracotail — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [???](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=%3F%3F%3F) | Fusion Monster | 0/0/0 | 0/0/15 | 0/0/0 |
| [Alba-Lenatus the Abyss Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Alba-Lenatus%20the%20Abyss%20Dragon) | Fusion Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Aluber the Jester of Despia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Aluber%20the%20Jester%20of%20Despia) | Effect Monster | 3/0/0 | 1/0/0 | 2/0/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Blazing Cartesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blazing%20Cartesia%2C%20the%20Virtuous) | Tuner Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Branded Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20Fusion) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Branded Opening](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20Opening) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Branded in High Spirits](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20in%20High%20Spirits) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/3 | 0/0/0 | 0/0/3 |
| [Crowley, the Gifted Magistus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crowley%2C%20the%20Gifted%20Magistus) | Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [Dogmatika Ecclesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogmatika%20Ecclesia%2C%20the%20Virtuous) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 |
| [Dracotail Arthalion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Arthalion) | Fusion Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [Dracotail Faimena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Faimena) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dracotail Flame](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Flame) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dracotail Gulamel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Gulamel) | Fusion Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Dracotail Lukias](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Lukias) | Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Dracotail Mululu](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Mululu) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dracotail Pan](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Pan) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dracotail Phryxul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Phryxul) | Effect Monster | 1/0/0 | 0/0/0 | 1/0/0 |
| [Dracotail Sting](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Sting) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dracotail Urgula](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dracotail%20Urgula) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 0/0/0 |
| [Ecclesia and the Dark Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ecclesia%20and%20the%20Dark%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 0/0/0 | 3/0/0 |
| [Elder Entity Norden](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elder%20Entity%20Norden) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Evenly Matched](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Evenly%20Matched) | Trap Card | 0/0/0 | 0/0/0 | 0/0/3 |
| [Fallen of Albaz](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fallen%20of%20Albaz) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Fallen of the White Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fallen%20of%20the%20White%20Dragon) | Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Granguignol the Dusk Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Granguignol%20the%20Dusk%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Guiding Quem, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Guiding%20Quem%2C%20the%20Virtuous) | Tuner Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Hyperinvoked Aeon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hyperinvoked%20Aeon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Incredible Ecclesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Incredible%20Ecclesia%2C%20the%20Virtuous) | Tuner Monster | 1/0/0 | 1/0/0 | 2/0/0 |
| [Ketu Dracotail](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ketu%20Dracotail) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Khaos Starsource Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Khaos%20Starsource%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Lubellion the Searing Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lubellion%20the%20Searing%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/1/0 |
| [Mirrorjade the Iceblade Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mirrorjade%20the%20Iceblade%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mixousia the Confounder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mixousia%20the%20Confounder) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 |
| [Rahu Dracotail](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rahu%20Dracotail) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Rindbrumm the Striking Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rindbrumm%20the%20Striking%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Secreterion Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Secreterion%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/2 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 3/0/0 | 3/0/0 |
| [The Dragon that Devours the Dogma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dragon%20that%20Devours%20the%20Dogma) | Fusion Monster | 0/1/0 | 0/1/0 | 0/2/0 |
| [The Fallen & The Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Fallen%20%26%20The%20Virtuous) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [The Three Champions of Swordsoul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Three%20Champions%20of%20Swordsoul) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Titaniklad the Ash Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Titaniklad%20the%20Ash%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Zoroa, the Magistus Verethragna](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Zoroa%2C%20the%20Magistus%20Verethragna) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 |
### Branded — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Alba-Lenatus the Abyss Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Alba-Lenatus%20the%20Abyss%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Albion the Sanctifire Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Albion%20the%20Sanctifire%20Dragon) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Aluber the Jester of Despia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Aluber%20the%20Jester%20of%20Despia) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Blazing Cartesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blazing%20Cartesia%2C%20the%20Virtuous) | Tuner Monster | 1/0/0 | 1/0/0 | 2/0/0 |
| [Borreload Furious Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Borreload%20Furious%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Branded Fusion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20Fusion) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Branded Opening](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20Opening) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Branded Retribution](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20Retribution) | Trap Card | 0/0/0 | 1/0/0 | 0/0/0 |
| [Branded in High Spirits](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Branded%20in%20High%20Spirits) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Cocatorium the Heavy Metal Avian](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cocatorium%20the%20Heavy%20Metal%20Avian) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 |
| [Cosmic Cyclone](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cosmic%20Cyclone) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Despian Quaeritis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Despian%20Quaeritis) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Dogmatika Ecclesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dogmatika%20Ecclesia%2C%20the%20Virtuous) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dominus Spark](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Spark) | Trap Card | 2/0/0 | 0/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ecclesia and the Dark Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ecclesia%20and%20the%20Dark%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 3/0/0 | 2/0/1 | 2/0/0 |
| [Fallen of Albaz](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fallen%20of%20Albaz) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Fallen of the White Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fallen%20of%20the%20White%20Dragon) | Effect Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Favorite HERO Shining Flare Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Shining%20Flare%20Wingman) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/1 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Gold Sarcophagus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gold%20Sarcophagus) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Granguignol the Dusk Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Granguignol%20the%20Dusk%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/2/0 |
| [Guiding Quem, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Guiding%20Quem%2C%20the%20Virtuous) | Tuner Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Hey, Space Trunade!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hey%2C%20Space%20Trunade%21) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Hyperinvoked Aeon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hyperinvoked%20Aeon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Ido the Supreme Magical Force](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ido%20the%20Supreme%20Magical%20Force) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 |
| [Incredible Ecclesia, the Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Incredible%20Ecclesia%2C%20the%20Virtuous) | Tuner Monster | 2/0/0 | 2/0/0 | 2/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 2/0/0 | 0/0/0 | 0/0/0 |
| [Lava Golem](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lava%20Golem) | Effect Monster | 0/0/0 | 0/0/3 | 0/0/0 |
| [Lubellion the Searing Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lubellion%20the%20Searing%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mirrorjade the Iceblade Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mirrorjade%20the%20Iceblade%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mistaken Arrest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mistaken%20Arrest) | Spell Card | 0/0/3 | 0/0/3 | 0/0/3 |
| [Mixousia the Confounder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mixousia%20the%20Confounder) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/3 | 0/0/3 |
| [Nadir Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nadir%20Servant) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/2 | 0/0/3 |
| [PSY-Frame Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Frame%20Driver) | Normal Monster | 0/0/1 | 0/0/0 | 0/0/0 |
| [PSY-Framegear Delta](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Delta) | Tuner Monster | 0/0/3 | 0/0/0 | 0/0/0 |
| [PSY-Framegear Gamma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Gamma) | Tuner Monster | 0/0/1 | 0/0/0 | 0/0/0 |
| [Predaplant Dragostapelia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Predaplant%20Dragostapelia) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 |
| [Rindbrumm the Striking Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Rindbrumm%20the%20Striking%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Secreterion Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Secreterion%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 1/0/2 | 0/0/0 | 0/0/0 |
| [Small World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Small%20World) | Spell Card | 3/0/0 | 0/0/0 | 0/0/0 |
| [Sprind the Irondash Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sprind%20the%20Irondash%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Springans Kitt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Springans%20Kitt) | Effect Monster | 0/0/0 | 2/0/0 | 1/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 3/0/0 | 3/0/0 |
| [The Dragon that Devours the Dogma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dragon%20that%20Devours%20the%20Dogma) | Fusion Monster | 0/2/0 | 0/2/0 | 0/2/0 |
| [The Fallen & The Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Fallen%20%26%20The%20Virtuous) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [The Golden Swordsoul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Golden%20Swordsoul) | Tuner Monster | 0/0/0 | 1/0/0 | 0/0/0 |
| [The Three Champions of Swordsoul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Three%20Champions%20of%20Swordsoul) | Synchro Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Titaniklad the Ash Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Titaniklad%20the%20Ash%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Tri-Brigade Mercourier](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Mercourier) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Tri-Brigade Springans Kitt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Tri-Brigade%20Springans%20Kitt) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/0 | 0/0/3 | 0/0/3 |
| [Veidos the Eruption Dragon of Extinction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Veidos%20the%20Eruption%20Dragon%20of%20Extinction) | Effect Monster | 0/0/2 | 0/0/0 | 0/0/0 |
### Sacred Beast — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Allied Code Talker @Ignister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Allied%20Code%20Talker%20%40Ignister) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Angelechy Shatranga](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Shatranga) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Barricadeborg Blocker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Barricadeborg%20Blocker) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Calamity of the Sacred Beasts - Hamon, Lord of Striking Thunder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Calamity%20of%20the%20Sacred%20Beasts%20-%20Hamon%2C%20Lord%20of%20Striking%20Thunder) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Card of the Soul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Card%20of%20the%20Soul) | Spell Card | 2/0/1 | 2/0/1 | 3/0/0 |
| [Codebreaker Virus Berserker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Codebreaker%20Virus%20Berserker) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Codebreaker Virus Swordsman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Codebreaker%20Virus%20Swordsman) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Codebreaker Zero Day](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Codebreaker%20Zero%20Day) | Effect Monster | 0/0/0 | 1/0/0 | 1/0/0 |
| [Cyberse Contract Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cyberse%20Contract%20Witch) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 3/0/0 | 2/0/1 | 3/0/0 |
| [Fallen Paradise of the Sacred Beasts](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fallen%20Paradise%20of%20the%20Sacred%20Beasts) | Spell Card | 2/0/0 | 2/0/0 | 2/0/1 |
| [Firewall Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Firewall%20Dragon) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [G Golem Crystal Heart](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=G%20Golem%20Crystal%20Heart) | Link Monster | 0/0/0 | 0/1/0 | 0/1/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/0 | 0/0/0 | 0/0/2 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Gordian Slicer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gordian%20Slicer) | Spell Card | 0/0/3 | 0/0/3 | 0/0/0 |
| [Harpie's Feather Duster](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Harpie%27s%20Feather%20Duster) | Spell Card | 0/0/0 | 0/0/0 | 0/0/1 |
| [Inferno of the Sacred Beasts - Uria, Lord of Searing Flames](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Inferno%20of%20the%20Sacred%20Beasts%20-%20Uria%2C%20Lord%20of%20Searing%20Flames) | Effect Monster | 1/0/1 | 1/0/0 | 2/0/0 |
| [Infinity of the Sacred Beasts - Raviel, Lord of Phantasms](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinity%20of%20the%20Sacred%20Beasts%20-%20Raviel%2C%20Lord%20of%20Phantasms) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Lightning Crash](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lightning%20Crash) | Spell Card | 2/0/1 | 2/0/1 | 0/0/0 |
| [Link Spider](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Link%20Spider) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Linkuriboh](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Linkuriboh) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Martyr of the Sacred Beasts](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Martyr%20of%20the%20Sacred%20Beasts) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/2 | 0/0/2 | 0/0/3 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/1 | 0/0/0 | 3/0/0 |
| [PSY-Frame Driver](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Frame%20Driver) | Normal Monster | 0/0/1 | 0/0/0 | 0/0/1 |
| [PSY-Framegear Delta](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Delta) | Tuner Monster | 0/0/2 | 0/0/0 | 0/0/3 |
| [PSY-Framegear Gamma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=PSY-Framegear%20Gamma) | Tuner Monster | 0/0/1 | 0/0/0 | 0/0/1 |
| [Perfectron Hydradrive Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Perfectron%20Hydradrive%20Dragon) | Link Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/3 | 0/0/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Sacred Beasts Combined Assault](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sacred%20Beasts%20Combined%20Assault) | Trap Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Sacred Beasts Released](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sacred%20Beasts%20Released) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Sacred Beasts Thunderclap](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sacred%20Beasts%20Thunderclap) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Secure Gardna](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Secure%20Gardna) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [Skull Meister](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Meister) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Summoner of the Sacred Beasts](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Summoner%20of%20the%20Sacred%20Beasts) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [The Chaotic Phantasmal Sacred Beasts](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Chaotic%20Phantasmal%20Sacred%20Beasts) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 3/0/0 | 3/0/0 | 0/0/0 |
| [Thunder Dragon Colossus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Thunder%20Dragon%20Colossus) | Fusion Monster | 0/2/0 | 0/1/0 | 0/2/0 |
| [Thunder King, the Lightningstrike Kaiju](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Thunder%20King%2C%20the%20Lightningstrike%20Kaiju) | Effect Monster | 0/0/0 | 0/0/1 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/2 | 0/0/3 | 0/0/0 |
| [V-LAN Hydra](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=V-LAN%20Hydra) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 |
### Blitzclique (unconfirmed Check candidate) — zone inventory

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S |
| --- | --- | --- | --- | --- |
| [Alba-Lenatus the Abyss Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Alba-Lenatus%20the%20Abyss%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Angelechy Enlisted](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Angelechy%20Enlisted) | Synchro Tuner Monster | 0/1/0 | 0/3/0 | 0/0/0 |
| [Artifact Lancea](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Artifact%20Lancea) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Aussa the Earth Charmer, Immovable](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Aussa%20the%20Earth%20Charmer%2C%20Immovable) | Link Monster | 0/1/0 | 0/2/0 | 0/0/0 |
| [Blitzclique - Breakaway](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blitzclique%20-%20Breakaway) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Blitzclique - Steppleader](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blitzclique%20-%20Steppleader) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Blitzclique Alternator](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blitzclique%20Alternator) | Trap Card | 2/0/0 | 2/0/0 | 2/0/0 |
| [Blitzclique Overvolt](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blitzclique%20Overvolt) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 |
| [Blitzclique Return Stroke](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blitzclique%20Return%20Stroke) | Trap Card | 0/0/1 | 1/0/0 | 1/0/0 |
| [Centur-Ion Legatia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Centur-Ion%20Legatia) | Synchro Monster | 0/0/0 | 0/2/0 | 0/0/0 |
| [Chimeratech Fortress Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chimeratech%20Fortress%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Chimeratech Megafleet Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chimeratech%20Megafleet%20Dragon) | Fusion Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Coral Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Coral%20Dragon) | Synchro Tuner Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Crackle Blitzclique](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crackle%20Blitzclique) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dominus Purge](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dominus%20Purge) | Trap Card | 3/0/0 | 3/0/0 | 0/0/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Ecclesia and the Dark Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ecclesia%20and%20the%20Dark%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Emi Blitzclique](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Emi%20Blitzclique) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 |
| [Fata Dragna](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Fata%20Dragna) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Favorite HERO Flame Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Flame%20Wingman) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Favorite HERO Shining Flare Wingman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Favorite%20HERO%20Shining%20Flare%20Wingman) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Foolish Burial Goods](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Foolish%20Burial%20Goods) | Spell Card | 1/0/1 | 0/0/0 | 0/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 3/0/0 | 2/0/0 | 2/0/0 |
| [Gordian Slicer](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gordian%20Slicer) | Spell Card | 0/0/3 | 0/0/3 | 0/0/3 |
| [Grain Blitzclique](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Grain%20Blitzclique) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Hideout in the Sky, Coulomb](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Hideout%20in%20the%20Sky%2C%20Coulomb) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 |
| [Khaos Starsource Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Khaos%20Starsource%20Dragon) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Lightning Crash](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Lightning%20Crash) | Spell Card | 2/0/0 | 3/0/0 | 3/0/0 |
| [Mixousia the Confounder](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mixousia%20the%20Confounder) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/2 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/3 |
| [Odin, Father of the Aesir](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Odin%2C%20Father%20of%20the%20Aesir) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Pot of Extravagance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Extravagance) | Spell Card | 0/0/0 | 2/0/0 | 0/0/0 |
| [Pot of Prosperity](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Prosperity) | Spell Card | 1/0/0 | 0/0/0 | 1/0/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 |
| [Predaplant Triphyoverutum](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Predaplant%20Triphyoverutum) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Psychic End Punisher](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Psychic%20End%20Punisher) | Synchro Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/2/0 | 0/0/0 |
| [Snake-Eyes Vengeance Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Snake-Eyes%20Vengeance%20Dragon) | Synchro Monster | 0/1/0 | 0/1/0 | 0/0/0 |
| [Solemn Judgment](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Solemn%20Judgment) | Trap Card | 0/0/0 | 0/0/1 | 0/0/0 |
| [Spiritualism](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spiritualism) | Spell Card | 0/0/0 | 0/0/2 | 0/0/0 |
| [Starving Venom Fusion Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Starving%20Venom%20Fusion%20Dragon) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Starving Venom Fusion Dragon, Four Heavenly Dragons](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Starving%20Venom%20Fusion%20Dragon%2C%20Four%20Heavenly%20Dragons) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/2/0 | 0/3/0 | 0/1/0 |
| [Surge Blitzclique](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Surge%20Blitzclique) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |
| [The Dragon that Devours the Dogma](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dragon%20that%20Devours%20the%20Dogma) | Fusion Monster | 0/0/0 | 0/0/0 | 0/2/0 |
| [The Fallen & The Virtuous](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Fallen%20%26%20The%20Virtuous) | Spell Card | 0/0/0 | 0/0/0 | 3/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/3 | 0/0/3 | 0/0/0 |
| [Thunder Dragon Colossus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Thunder%20Dragon%20Colossus) | Fusion Monster | 0/1/0 | 0/2/0 | 0/1/0 |
| [Thunder King Rai-Oh](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Thunder%20King%20Rai-Oh) | Effect Monster | 0/0/1 | 0/0/1 | 0/0/0 |
| [Typhoon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Typhoon) | Trap Card | 0/0/3 | 0/0/3 | 0/0/3 |
| [Underworld Goddess of the Closed World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Underworld%20Goddess%20of%20the%20Closed%20World) | Link Monster | 0/1/0 | 0/0/0 | 0/0/0 |
| [Whisker Blitzclique](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Whisker%20Blitzclique) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 |

## 6. Prioritized implementation proposal (ours)

Keep the five-step plan, but finish its partially implemented foundations before declaring a “meta pack” complete. Do not import text as if it were effect code.

| Priority | Deep engine assignment | Cards / archetypes unlocked | Then straightforward scripting assignment |
| --- | --- | --- | --- |
| 0 | Stabilize actor/priority, costs paid on activation, arbitrary Speed-2 chains, effect vs activation negation; make open moments symmetric (Step 1) | Complete Ash, Veiler, Ghost Ogre; Skull Meister; every reactive archetype | Define hand/field/GY predicates and response actions; tests for each origin and negated activation |
| 1 | Event batches with summon origin/count, effects that stack, delayed expiry and per-name/use locks (Step 2) | Complete Fuwalos and Droll; Mulcharmy Purulia/Meowls; destruction and material triggers | Share Mulcharmy template with source predicates; Nibiru only after Tokens/opponent-field support |
| 2 | Multi-choice/multi-target action interpreter, costs, conditional sequences, Set/place, bounce/bottom-deck, banish/temporary return, name/attribute/type filters (Step 3) | Typhoon, MST, Hey Space Trunade, Pot of Sloth, Cosmic Cyclone, Thrust, most searches and GY recursion | First board breakers and searches, then Branded/Dracotail/Unchained/Artmage core entries; Foolish Burial Goods and PSY-Frame Driver are cheap now |
| 3 | Fusion/Ritual sources and material predicates, alternate summon procedures, Link opponent materials, Xyz transfer/detach, summon-method metadata (Steps 3–4) | Super Polymerization; Branded Fusion/Rahu/Faimena; Light and Darkness Ritual; S:P; TY-PHON; Unchained Rage; generic Extra Deck | Recipes and effects per card once legality/action contracts are tested, not new engine branches per card |
| 4 | Continuous layers, replacement effects, control/ownership, columns/centre zones, monster-as-backrow, Tokens and counters (extend Steps 3–4) | Infinite Impermanence column; Angelechy; Elfnote; Radiant Typhoon Marine Eidolon; Nibiru; Selene/Dragostapelia; Toon World interactions | Archetype-specific conditions and triggers atop shared rules; integrate full packs only after end-to-end tests |
| 5 | Deterministic duel-suite tests, bot branching budget and teaching settings (Step 5) | All eleven requested decks, not just opening combo demos | Three sourced deck fixtures per archetype, card text/data/localization/art, tutor persona, regression cases |

**Rough responsibility split:** stronger rules work is the shared chain/timing/state/summon/continuous-layer infrastructure above; lighter scripting is card definitions and tests once those contracts exist. Almost every absent Effect Monster requires more than a registry entry today. Avoid assigning a card as “easy” merely because it is a Normal Spell: Small World, Pot of Prosperity and Gordian Slicer need nontrivial choice, face-down banishment and timing. Conversely, do not rebuild Link Summoning merely to add a straightforward material recipe—the engine already has it.

**First card batches:** finish the four ubiquitous partial staples (Ash, Droll, Ogre, Fuwalos), then Purulia (11 archetypes), Typhoon (9), Skull Meister (8), S:P (8), Hey Space Trunade (8), Pot of Sloth (7). Nibiru (9) and The Great Gallant Bandit (7) have high payoff but belong with opponent-material/Token work, not a quick card-data batch. Super Polymerization (5) is the Fusion integration target. These frequencies are sample counts, not format-wide play rates.

**Acceptance gates:** a card passes only with legal/illegal activation tests, cost vs effect tests, response and negation cases, full printed once-per-turn/use limits, correct origin/ownership/zone tracking, and all Main/Extra/Side entries resolved. A deck passes only once those rules work together; no percentage threshold substitutes for that.

