# Arkana's Dark Magician: "evil" Dark Magician lists for the October 19, 2026 format, the Arkana artwork, and engine coverage

> **Date of observation:** data fetched 2026-11-23 (just after midnight, local time), note written 2026-11-23. Working tree on `main`, HEAD `7d5587d`; `packages/` has no uncommitted changes. Only this research note was added; no code, commits, branches, GitHub activity or publication. Downloaded data, card pictures and analysis scripts were kept in the system temporary directory outside the repository; Python ran with `-I`.
>
> **Request (task brief for GitHub issue #15, "Dark Magician lists with the evil Dark Magician cards for Arkana"):** Arkana plays Dark Magician plus the "evil" Dark Magician cards (Dark Magician of Chaos, Dark Magician of Destruction, the Magician of Black Chaos family, and similar), distinct from Atem's Dark Magician Light and Darkness Ritual hybrid ([dark-magician-ritual-coverage-2026-11.md](./dark-magician-ritual-coverage-2026-11.md)). Find up to 10 lists legal under Konami's Forbidden & Limited List effective 2026-10-19: recent tournament lists where they exist, otherwise lists by pros, deck guides or other strong builds, citing each and saying which kind it is. Check every count against that list and audit every Main/Extra/Side card against the engine exactly as [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) does. Also: which official alternate artwork of Dark Magician matches Arkana's red/pink anime Dark Magician, its passcode/image id, and whether Academy's art pipeline has or could pick it.
>
> **Sourcing rule (same as the earlier notes):** compositions and dates are YGOPRODeck's deck records (deck API and each deck page's `datePublished`); printed texts and types are its card API, not an independent Konami ruling audit. Banlist claims cite Konami; artwork-to-printing claims cite Konami's card database, with Yugipedia (a wiki, secondary) for the naming. Repo claims cite `file:line`. Mechanic tags, estimates and priorities are **(ours)**. Unconfirmed points are in §6.
>
> **Builds on:** the three earlier coverage notes (method, mechanism key, and the verdicts and tags of every card they already audited, reused verbatim).

## 0. Findings and scope

**No tournament list exists for this deck, so all five lists are user-built.** Among the 480 most recent TCG "Tournament Meta Decks" records on YGOPRODeck (423 of them from events on or after October 19, 2026), **not one** plays Dark Magician of Chaos, Magician of Black Chaos, Chaos Form or Magician of Chaos; Magician of Black Chaos MAX appears once, in a Side Deck of Atem's Azamina hybrid. The "evil" Dark Magician cards only exist in current-format **non-tournament** lists, so the selection uses the owner's fallback: one deck guide, one theorycraft build with a written game plan, two builds their authors filed as "Meta Decks", and one casual Azamina variant (§1). All five are legal under the October 19 list and were published October 24 – November 8, 2026.

**None is playable automatically.** The five lists hold **106 identifiable unique cards across Main, Extra and Side: 3 scripted & automatic, 11 present but partial, 92 absent.** This counts unique cards; it is not a win probability, not weighted by copies, and not a share of every printed Dark Magician card.

| Sample | Main+Extra unique | Automatic | Partial | Absent | All zones incl. Side |
| --- | ---: | ---: | ---: | ---: | --- |
| Arkana: Dark Magician with the Chaos ("evil") cards (5 lists) | 95 | 3 (3%) | 10 | 82 | 3 / 11 / 92 of 106 |

- **What makes it Arkana's deck, and what Academy has of it.** The shared "evil" core is the **Chaos Form** Ritual line (Chaos Form, Magician of Black Chaos MAX, Magician of Chaos), **Dark Magician of Destruction** and Master of Chaos, with Illusion of Chaos as the searcher. All of it is absent. Chaos Form needs what Light and Darkness Ritual needs, a general Ritual procedure; Academy's Ritual Spells still name one monster and a minimum Level total (`cards.ts:65`, `:391`; `catalogue.ts:140-143`).
- **Dark Magician of Chaos and Magician of Black Chaos are in none of the five lists**, and in no legal current-format list found (§6.2). They are unlimited (not on Konami's list), so Academy could still add them for Arkana's anime identity: their texts need TRIG, LOCK, VOCAB, GY, BANISH (Dark Magician of Chaos) and RITUAL, VOCAB (Magician of Black Chaos, with "Black Magic Ritual") **(ours)**.
- **12 cards are in the Main or Extra Deck of all five lists**: Dark Magician and Dark Magician Girl (automatic), Ash Blossom, Dark Magical Curtain and Magician's Rod (partial), and Chaos Form, Dark Magician of Destruction, Dark Magician, the Pharaoh's Servant, Illusion of Chaos, Cyberse Contract Witch, I:P Masquerena and S:P Little Knight (absent).
- **Distinct from Atem, but not separate.** 51 of the 106 cards are also in Atem's four Dark Magician Light and Darkness Ritual lists: the Dark Magician core (Pharaoh's Servant, Curtain, Rod, Gaze of Timaeus, Secrets of Dark Magic, Soul Servant, Dark Magical Circle, Illusion of Chaos, Master of Chaos, Dark Magician of Destruction, Timaeus the United Magical Dragon) and the hand traps. What Arkana's lists add is the Chaos Form line, Dark Magician Girl, Eternal Soul and Magician's Salvation, Magicians' Combination, and a Shining Sarcophagus package (L1). Two of the five (L3, L4) still carry a small Light and Darkness Ritual package; L1, L2 and L5 do not.
- **Shared staples.** 62 of the 106 cards were already audited in at least one of the 14 archetypes of the earlier notes, and one more (Spiritualism) only in the main note's excluded Blitzclique sample; the top of the ranking is unchanged (Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos partial; Mulcharmy Purulia absent; §4). **43 are new to the audits.**
- **The Arkana artwork exists and Academy does not have it** (§2): Dark Magician's **third** official artwork, password **36996508**, is the red-armour, dark-skinned version used by Pandora/Arkana. YGOPRODeck serves it as an alternate image id of Dark Magician. Academy's only Dark Magician picture is the original (`card-art.json:48`, image 46986414). The pipeline can fetch it without code changes; showing it only for Arkana needs one decision (§2).

## 1. Selection and legality

Konami's [Forbidden & Limited List page dated October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) states "Effective from October 19, 2026". Its Advanced Format column was parsed in full: 256 entries (156 Forbidden, 93 Limited, 7 Semi-Limited), the same counts as the Dark Magician note.

**Tournament search (none found).** The YGOPRODeck deck API was read for the 480 most recent TCG Tournament Meta Decks (`getDecks.php?_sft_category=Tournament Meta Decks`, offsets 0–460; deck numbers 738587–746021; events October 3 – November 22, 2026), and every list was scanned by card name. Results, counting a list once per card:

| Card | Lists from events on or after Oct 19 | Earlier lists (Oct 3–18) |
| --- | ---: | ---: |
| Dark Magician of Chaos | 0 | 0 |
| Magician of Black Chaos | 0 | 0 |
| Chaos Form | 0 | 0 |
| Magician of Chaos | 0 | 0 |
| Magician of Black Chaos MAX | 1 (Side Deck of Atem's L1, deck 742716) | 0 |
| Dark Magician of Destruction | 25 (Atem's hybrids, Elfnote, Pendulum Magician, Witchcrafter toolboxes) | 13 |

The same scan finds Dark Magician itself only in Atem's four hybrids (the Dark Magician note, §0). A web search for a 2026 TCG guide to a Magician of Black Chaos MAX / Chaos Form Dark Magician deck found none (only older or Master Duel/Rush material).

**Fallback search (what was selected).** YGOPRODeck's deck search was read by name for `Dark Magician` (offsets 0–400, all categories), `Chaos` (0–200), `Dark Magician of Chaos`, `Black Chaos`, `Chaos Magician` and `Arkana`. Selection rule **(ours)**: a TCG Advanced Format list (not Master Duel, Genesys, Speed Duel, OCG, Domain or anime-only categories), published on or after October 19, 2026, legal under the October 19 list, with Dark Magician and at least one of the Chaos ("evil") cards in its Main or Extra Deck, preferring lists with a written plan and lists without Atem's Light and Darkness Ritual core.

| # | List (YGOPRODeck) | Category on the site | Kind (owner's rule) | Published | Main / Extra / Side | Its "evil" cards |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | [Dark Magician](https://ygoprodeck.com/deck/dark-magician-741401) | Non-Meta Decks | **Deck guide**: a written guide in the description (strategy, "Magician of Black Chaos MAX turn-skip lock" with Secrets of Dark Magic, Eternal Soul / Dark Magical Circle loop, Shining Sarcophagus synergy) | 2026-10-28 | 45 / 15 / 15 | MAX, Magician of Chaos, Chaos Form, DM of Destruction, Master of Chaos |
| L2 | [Dark Magician Ritual](https://ygoprodeck.com/deck/dark-magician-ritual-740665) | Theorycrafting Decks | **Strong build with a short game plan** ("set Secrets of Dark Magic and Gaze with a Chaos MAX or Murakumo in hand to play on the opponent's turn going first") | 2026-10-25 | 43 / 15 / 11 | MAX, Chaos Form, DM of Destruction, Master of Chaos, Dark Cavalry |
| L3 | [Max Dark Magician](https://ygoprodeck.com/deck/max-dark-magician-740538) | Meta Decks (the submitter's claim, not a result) | **Other strong build** ("Can turbo out Black Chaos Max"); also a small Light and Darkness Ritual package | 2026-10-24 | 49 / 15 / 15 | MAX, Chaos Form, DM of Destruction, Master of Chaos, Magician of Dark Chaos - Black Chaos |
| L4 | [The Dark Magicians](https://ygoprodeck.com/deck/the-dark-magicians-741615) | Meta Decks (the submitter's claim) | **Other strong build**, no write-up; also a Light and Darkness Ritual package | 2026-10-29 | 44 / 15 / 15 | MAX, Magician of Chaos, Chaos Form, DM of Destruction, Master of Chaos, BLS - Legendary Swordsman |
| L5 | [Dark Magician Azamina](https://ygoprodeck.com/deck/dark-magician-azamina-743375) | Non-Meta Decks | **Other build**, casual (its description says "Non-méta deck"): Dark Magician with an Azamina/Diabell engine | 2026-11-08 | 41 / 15 / 0 | Magician of Chaos, Chaos Form, DM of Destruction |

None of the five is a tournament result or a list by an identified professional player. Player and author names are not reproduced here; the deck links identify them.

**Legality screen.** Names and counts across Main + Extra + Side were compared with the Advanced Format column. **All five pass**: no Forbidden card, no card over its limit, no card over 3 copies. Cards on the list that appear, always within limit: Droll & Lock Bird (Limited, 1 copy, L1, L3, L4, L5) and Griffoh (Limited, 1 copy, L3, L4). This does not certify region or release legality. No list has unknown passcodes.

**Excluded, with the reason:**

- [Dark Magician 3 unfertig](https://ygoprodeck.com/deck/dark-magician-3-unfertig-743732), the only current list found that plays **Dark Magician of Chaos**: illegal (3 Magicians' Souls, Forbidden), and its title marks it unfinished.
- [Rolad DM Chaos Max Lock](https://ygoprodeck.com/deck/rolad-dm-chaos-max-lock-740874) (legal, Meta Decks): a Light and Darkness Ritual list with one Chaos Form and one MAX, so it is Atem's deck, not Arkana's.
- [Dark Magician Magia](https://ygoprodeck.com/deck/dark-magician-magia-744918) (legal): Chaos Form and MAX only in the Side Deck.
- [Dragon Master Magia Stun](https://ygoprodeck.com/deck/dragon-master-magia-stun-740076) (legal): a Blue-Eyes / Dark Magician hybrid built around Dragon Master Magia.
- Every Master Duel, Genesys, Domain, Speed Duel and OCG list, and every list published before October 19.

## 2. The Arkana artwork of Dark Magician

**Which artwork.** Dark Magician has nine artworks in YGOPRODeck's card API (`card_images` of Dark Magician: 46986420, 46986421, 46986414, 46986415, 46986416, 46986417, 46986418, 46986419, 36996508; the API now lists 46986420 first). Viewing the nine cropped pictures, only **36996508** shows Dark Magician with **red armour with yellow trim, a purple robe, dark skin and silver hair**: the version Pandora (Arkana in the English anime) uses. Yugipedia names it so: its page [Dark Magician (Arkana)](https://yugipedia.com/wiki/Dark_Magician_(Arkana)) gives **password 36996508**, and [Card Artworks:Dark Magician](https://yugipedia.com/wiki/Card_Artworks:Dark_Magician) ("Arkana artwork") describes this exclusive palette and says it is the third OCG / fifth TCG artwork, taken from manga chapter 162. (Yugipedia is a wiki; the next point checks it against Konami.)

**Konami's own record.** Konami's [card database entry for Dark Magician](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4041&request_locale=en) (card id 4041, the same card, one name) lists each TCG printing with an illustration index (`pack_iid_N`). Illustration **3** is exactly the four printings Yugipedia lists for the Arkana card: **YGLD-ENB02** *Yugi's Legendary Decks* (2015-11-13), **SBC1-ENG01** and **SBC1-ENG10** *Speed Duel: Streets of Battle City* (2023-08-25), and **RA04-EN106** *Quarter Century Stampede* (2025-04-11). So the Arkana picture is an official TCG printing of the same card, Dark Magician, legal wherever Dark Magician is.

**Is it in Academy?** No.

- Academy's Dark Magician is `"dark-magician": { "card": 46986414, "image": 46986414 }` (`packages/cards/src/card-art.json:48`), generated into `card-art.ts:72`. `apps/academy-ygo/public/cards/` holds `46986414-160.webp` and `46986414-480.webp` and nothing for 36996508. No file in the repo mentions 36996508.
- The app shows one picture per card id: `cardArtUrl(id)` returns `/cards/${CARD_ART[id].image}-${size}.webp` (`apps/academy-ygo/src/lib/junior/play/card-pictures.ts:6-8`), used by the 3D board (`board3d/card-textures.ts:86`), the deck builder and the dialogs.

**Can the pipeline pick it?** Yes, without changing the script. `build-art.mjs` already separates a card from its picture: each entry of `card-art.json` has a `card` (whose facts are fetched) and an `image` (the picture downloaded once from `images.ygoprodeck.com/images/cards_cropped/${entry.image}.jpg`, `build-art.mjs:66-72`, then converted to two WebP sizes, `:73-77`). Facts are indexed under every picture id of a card (`build-art.mjs:60-61`), so `card: 46986414, image: 36996508` (or `card: 36996508`) resolves to the same printed facts. The decision is where the picture goes **(ours)**:

| Option | What changes | Cost / risk |
| --- | --- | --- |
| A. Swap the picture of `dark-magician` | `card-art.json:48` `image` → 36996508, rerun `pnpm --filter academy-ygo cards:art` | One line, but Yugi's and Atem's Dark Magician also turn red |
| B. A second card id, e.g. `dark-magician-arkana`, `image: 36996508`, in `cards.ts` as Dark Magician with `nameAs: "dark-magician"` | New entries in `card-art.json` and `cards.ts` | The engine compares some names by id, not by `named`: Dark Magical Curtain looks for `"dark-magician"` exactly (`engine.ts:2534`, `:2559`), deck copies are counted per id (`apps/academy-ygo/src/lib/junior/play/deck-record.ts:67`), and `nameAs` makes the card count as having rules text (`catalogue.ts:559`). Each needs `named`, or a player could hold 3 + 3 "Dark Magician" |
| C. A picture choice outside the rules: the app picks the Arkana picture for Dark Magician when Arkana owns it | `cardArtUrl` (or the board's texture lookup) takes an owner or art variant; `card-art.json` keeps a second image for the same card | No rules change; the picture is per owner, like a sleeve |

Option C keeps the engine untouched and is the closest to what the card is: the same card with another official picture.

## 3. What is in Academy for this deck

**Reading the audit.** The conventions are the main note's, unchanged ([its "Reading the audit"](./meta-decks-engine-coverage-2026-11.md#reading-the-audit)):

- `cards.ts` = `packages/cards/src/cards.ts`; `card-art.ts`/`card-art.json` are in the same directory. `engine.ts`, `catalogue.ts`, `effects.ts`, `bot.ts` = `packages/engine/src/`.
- **Scripted & automatic:** the printed operation is represented and resolved, within Academy's supported board/rules. **Partial:** a script exists but a printed use, effect or timing case is missing. **Absent:** no playable definition.
- **Absence evidence for every Absent row:** a full join by English printed name and by passcode/alternate-image id against `card-art.json`, `card-art.ts:25-327` and the playable registry `cards.ts:27-399`, exported at `cards.ts:401-409`; the engine only obtains that supplied catalogue (`catalogue.ts:21-38`; `packages/cards/src/index.ts:9`). 14 of the 106 names matched, and all 14 have a `cards.ts` entry, so no card here is art-only.
- **Copies** are per list, Main+Extra+Side combined (`3/0/2/1/0` = L1/L2/L3/L4/L5). The zone label shows where the card appears across the lists; exact zone counts are in Appendix A. Percentages use Main+Extra; the last column counts all zones.
- **Needs/Step/Work are (ours).** They are copied verbatim from the earlier notes for the 63 cards they already audited (62 in the 14 archetypes, plus Spiritualism from the main note's Blitzclique sample). The 43 new cards were tagged from each fetched text with the main note's keyword rules, then read and corrected by hand (for example: a "reveal this card in your hand" ignition effect is not a hand trap, so not HAND; placing monsters as Continuous Spells is MONSPELL). `script` means card scripting **after its listed shared engine work exists**; `card-deep` flags work beyond the original plan.
- **Tests run:** `npx vitest run test/engine-effects.test.ts test/engine-extra.test.ts test/engine-hand.test.ts test/engine-set.test.ts test/engine-open.test.ts test/engine-chain.test.ts test/engine-masters.test.ts test/engine-summons.test.ts` in `packages/cards`: 8 files, 161 tests passed. The tests cited in the Notes pass but do not cover every printed case; the verdicts remain static code/text comparisons.

**Present cards.**

- **Dark Magician** (`cards.ts:93`) and **Dark Magician Girl** (`cards.ts:208`): scripted & automatic. Dark Magician Girl's "300 ATK for every Dark Magician or Magician of Black Chaos in the GY" is counted with `named` (`engine.ts:524`); only Dark Magician can count today, as Magician of Black Chaos is absent.
- **Dark Magic Attack** (`cards.ts:253`): scripted & automatic (L1 Side, L5 Main).
- **Dark Magician the Dragon Knight** (`cards.ts:230`): **Partial**, new to the audits. Its recipe, name and protection against the opponent's mass Spell/Trap destruction exist (`engine.ts:2309-2317`); the "cannot target" half does not, and its name change is not limited to the field and GY (`catalogue.ts:508`).
- **Dark Magical Curtain, Magician's Rod, Dark Paladin**, and the generic **Ash Blossom, Droll & Lock Bird, Ghost Ogre, Mulcharmy Fuwalos, Effect Veiler, Infinite Impermanence, D.D. Crow**: Partial, with the earlier notes' verdicts and notes (§5).
- **Not in these lists:** Academy's other Dark Magician cards (Thousand Knives, Dark Magic Curtain, Sage's Stone, Dark Burning Attack, the Dark Magician Girl Dragon Knight, Magician's Valkyria; `cards.ts:379`, `:251-252`, `:254`, `:231`, `:248`) appear in none of the five lists. Academy's live Arkana deck (`apps/academy-ygo/src/lib/junior/play/master-decks.ts:39-43`) is its own and was not changed.

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

TOON and DICE do not occur here. Among the 103 cards still to build (Partial or Absent), the most frequent needs are VOCAB (91), TRIG (60), LOCK (54) and CHAIN (52), then GY (38) and BANISH (17). RITUAL (13) is the deck's engine: Chaos Form, Magician of Black Chaos MAX, Magician of Chaos, Illusion of Chaos and Secrets of Dark Magic are all Ritual cards.

## 4. Coverage and shared cards

| Archetype | Lists | Cards (Main+Extra) | Scripted & automatic | Partial | Absent | Automatic % | In Academy % | Side-only cards | All cards incl. Side: automatic / partial / absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Arkana: Dark Magician with the Chaos cards | 5 | 95 | 3 | 10 | 82 | 3% | 14% | 11 | 3 / 11 / 92 of 106 |

"In Academy" includes Partial. Per list (Main+Extra unique cards, then copies of present cards out of all Main+Extra copies): L1 41 cards, 2 automatic, 8 partial, 20 of 60 copies; L2 38, 2 / 6, 17 of 58; L3 44, 2 / 8, 20 of 64; L4 41, 2 / 6, 16 of 59; L5 43, 3 / 6, 17 of 56. Copies of partial cards are not playable as printed; this only shows how much of each list Academy has started.

**Cards shared with the 14 archetypes of the earlier notes (Main, Extra or Side).** "Of the 14" counts the main note's 11 archetypes (Blitzclique excluded, as there), Blue-Eyes and Dark Time Wizard, and Atem's Dark Magician Light and Darkness Ritual. Ranked by that count, then by name.

| Rank | Card | Of the 14 | Which of the 14 | Status | Needs | Step | Work |
| ---: | --- | ---: | --- | --- | --- | --- | --- |
| 1 | Ash Blossom & Joyous Spring | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 2 | Droll & Lock Bird | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 3 | Ghost Ogre & Snow Rabbit | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, HAND | Step 1 | script |
| 4 | Mulcharmy Fuwalos | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG | Step 2 | script |
| 5 | Mulcharmy Purulia | 14 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 6 | Nibiru, the Primal Being | 12 | Angelechy, Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |
| 7 | S:P Little Knight | 11 | Elfnote, Toon, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |
| 8 | The Great Gallant Bandit | 10 | Angelechy, Elfnote, Artmage, Unchained, Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Blue-Eyes, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |
| 9 | Pot of Sloth | 9 | Angelechy, Toon, Artmage, Light and Darkness Ritual, Radiant Typhoon, Sky Striker, Sacred Beast, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | LOCK, VOCAB | Step 3 | script |
| 10 | Effect Veiler | 8 | Angelechy, Elfnote, Toon, Branded Dracotail, Branded, Sacred Beast, Blue-Eyes, Dark Time Wizard | Partial | CHAIN | Step 1 | script |
| 11 | Super Polymerization | 7 | Artmage, Radiant Typhoon, Sky Striker, Branded Dracotail, Branded, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |
| 12 | Garura, Wings of Resonant Life | 6 | Artmage, Radiant Typhoon, Sky Striker, Branded, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 13 | Infinite Impermanence | 6 | Angelechy, Elfnote, Toon, Branded, Blue-Eyes, Dark Time Wizard | Partial | ZONE | beyond plan | card-deep |
| 14 | Mudragon of the Swamp | 6 | Artmage, Radiant Typhoon, Sky Striker, Branded, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |
| 15 | Super Starslayer TY-PHON - Sky Crisis | 6 | Toon, Unchained, Radiant Typhoon, Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | LOCK, VOCAB, XYZ | Step 4 | script |
| 16 | I:P Masquerena | 5 | Toon, Artmage, Light and Darkness Ritual, Dark Time Wizard, Dark Magician Light and Darkness Ritual | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |
| 17 | Accesscode Talker | 4 | Toon, Light and Darkness Ritual, Sky Striker, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 18 | Dharc the Dark Charmer, Gloomy | 4 | Elfnote, Artmage, Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, LINK | Step 4 | script |
| 19 | Number 90: Galaxy-Eyes Photon Lord | 4 | Elfnote, Artmage, Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |
| 20 | Relinquished Anima | 4 | Light and Darkness Ritual, Radiant Typhoon, Sacred Beast, Dark Magician Light and Darkness Ritual | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |
| 21 | Chaos Angel | 3 | Angelechy, Toon, Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |
| 22 | Forbidden Droplet | 3 | Sky Striker, Blue-Eyes, Dark Time Wizard | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |
| 23 | Ghost Belle & Haunted Mansion | 3 | Sacred Beast, Blue-Eyes, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB | Step 3 | script |
| 24 | Triple Tactics Thrust | 3 | Unchained, Sky Striker, Dark Time Wizard | Absent | VOCAB | Step 3 | script |
| 25 | Black Chaos | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | LOCK, VOCAB, GY | Step 3 | script |
| 26 | Black Luster Soldier - Soldier of Light and Darkness | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |
| 27 | Cyberse Contract Witch | 2 | Sacred Beast, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |
| 28 | Dark Magical Curtain | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Partial | — | — | data |
| 29 | Dark Magician of Destruction | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 30 | Griffoh | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, VOCAB, RITUAL | Step 3 | script |
| 31 | Kuriboh - Multiply! | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |
| 32 | Light and Darkness Ritual | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | VOCAB, GY, RITUAL | Step 3 | script |
| 33 | Magician of Dark Chaos - Black Chaos | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |
| 34 | Mind Shuffle | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, CONT | Step 3 | script |
| 35 | Mulcharmy Meowls | 2 | Light and Darkness Ritual, Blue-Eyes | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |
| 36 | Ragged Records of Rites | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 37 | Selene, Queen of the Master Magicians | 2 | Toon, Dark Magician Light and Darkness Ritual | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |
| 38 | Skull Archfiend of Chaos | 2 | Light and Darkness Ritual, Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |
| 39 | Underworld Goddess of the Closed World | 2 | Unchained, Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |
| 40 | Azamina Mu Rcielago | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 41 | Centur-Ion Auxila | 1 | Toon | Absent | TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |
| 42 | Crimson Dragon | 1 | Blue-Eyes | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |
| 43 | D.D. Crow | 1 | Dark Time Wizard | Partial | CHAIN | Step 1 | script |
| 44 | Dark Magical Circle | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, BANISH, CONT | Step 3 | script |
| 45 | Dark Magician | 1 | Dark Magician Light and Darkness Ritual | Scripted & automatic | — | — | — |
| 46 | Dark Magician, the Pharaoh's Servant | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB | Step 3 | script |
| 47 | Dark Paladin | 1 | Dark Magician Light and Darkness Ritual | Partial | CHAIN | Step 1 | script |
| 48 | Deception of the Sinful Spoils | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 49 | Diabellstar the Black Witch | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY | Step 3 | script |
| 50 | Illusion of Chaos | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB, GY, RITUAL | Step 3 | script |
| 51 | Magician of Black Chaos MAX | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |
| 52 | Magician's Rod | 1 | Dark Magician Light and Darkness Ritual | Partial | CHAIN, TRIG, GY | Step 3 | script |
| 53 | Magistus Chorozo | 1 | Toon | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 54 | Master of Chaos | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |
| 55 | Secrets of Dark Magic | 1 | Dark Magician Light and Darkness Ritual | Absent | VOCAB, RITUAL, FUS-EFF | Step 3 | script |
| 56 | Snake-Eyes Vengeance Dragon | 1 | Angelechy | Absent | CHAIN, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |
| 57 | Soul Servant | 1 | Dark Magician Light and Darkness Ritual | Absent | VOCAB, GY, BANISH | Step 3 | script |
| 58 | The Gaze of Timaeus | 1 | Dark Magician Light and Darkness Ritual | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF | Step 3 | script |
| 59 | The Hallowed Azamina | 1 | Dark Magician Light and Darkness Ritual | Absent | VOCAB, GY, FUS-EFF | Step 3 | script |
| 60 | Timaeus the United Magical Dragon | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |
| 61 | W:P Fancy Ball | 1 | Dark Magician Light and Darkness Ritual | Absent | CHAIN, VOCAB, BANISH, LINK, CONTROL | Step 4 + beyond plan | card-deep |
| 62 | WANTED: Seeker of Sinful Spoils | 1 | Dark Magician Light and Darkness Ritual | Absent | VOCAB, GY, BANISH | Step 3 | script |

**New to the audits (43 cards):** the Chaos Form line (Chaos Form, Magician of Chaos, Black Luster Soldier - Legendary Swordsman, Black Luster Soldier - Soldier of Chaos, Dragon Master Magia), the Dark Magician / Dark Magician Girl cards Atem's lists do not play (Dark Magician Girl, Dark Magic Attack, Dark Magician the Dragon Knight, Dark Magician the Magician of Black Magic, Dark Magician Girl the Magician's Apprentice, Bond Between Teacher and Student, Eternal Soul, Magician's Salvation, Magicians' Combination, Dark Magic Talisman, The Dark Magicians, Dark Cavalry, Ebon Illusion Magician, Sorcerer of Dark Magic), the Shining Sarcophagus package (Shining Sarcophagus, Future Silence, Gandora-G the Dragon of Destruction), other Ritual support (Preparation of Rites, Miracle Raven, Ruler of the End of the World, Ame no Murakumo no Mitsurugi, Herald of Mirage Lights, Dyna Mondo), L5's Azamina/Diabell package, and Extra Deck options (Clear Wing Synchro Dragon, Crimson Blade Dragon, Muddy Mudragon, Number 11: Big Eye, Gorgon of Zilofthonia, Poplar of the White Forest, Saint Azamina, Azamina, Azamina Moa Regina) and Eradicator Epidemic Virus.

## 5. Card-by-card union

Rows are ordered Scripted & automatic, Partial, Absent; within each, Main cards first, then Extra-only, then Side-only.

| Card | Copies (L1/L2/L3/L4/L5) | Status | Needs | Step | Work | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Dark Magic Attack | 1/0/0/0/1 (main+side) | Scripted & automatic | — | — | — | `clear-backrow` scope `foe`, `needs: "dark-magician"` (`cards.ts:253`): checked on activation and again on resolution (`engine.ts:1822`, `:3185-3188`); Dark Magician the Dragon Knight counts through `named` (`catalogue.ts:508`). Tested at `packages/cards/test/engine-set.test.ts:141`. |
| Dark Magician | 1/1/1/2/1 | Scripted & automatic | — | — | — | Normal Monster, printed 2500/2100 Level 7 (`cards.ts:93`; printed facts `card-art.ts:72`). |
| Dark Magician Girl | 1/1/1/1/1 | Scripted & automatic | — | — | — | `gains` 300 per "Dark Magician" or "Magician of Black Chaos" in both GYs (`cards.ts:208`, counted by `named` at `engine.ts:524`). Magician of Black Chaos is not in Academy, so only Dark Magician (and cards whose name becomes it) can count. Tested at `packages/cards/test/engine-masters.test.ts:119`. |
| Ash Blossom & Joyous Spring | 3/3/3/3/3 | Partial | CHAIN | Step 1 | script | `hand: "ash"` (`cards.ts:268`): answers a pending Spell or a data-written monster effect by category (`engine.ts:1288`, `:555-558`). Missing: Trap activations and effects of the older monster tags; it only sees what Academy can activate. Academy also counts draws as Ash targets (`effects.ts:91`); see Unverified. |
| Dark Magical Curtain | 3/3/3/3/3 | Partial | — | — | data | `curtain` (`cards.ts:250`, resolved at `engine.ts:2542-2567`): each player Special Summons 1 DARK Spellcaster from the hand or Deck, then Dark Magician or Dark Magician Girl adds a Spell/Trap that mentions "Dark Magician" (`mentions`, `catalogue.ts:504`); once per turn, a free Quick-Play (`engine.ts:563`). Missing: the engine chooses both players' monsters and the added card (`engine.ts:2526-2540`, `:2562`), so neither "can" is a choice; "neither player can activate their effects this turn" is not applied. Tested at `packages/cards/test/engine-set.test.ts:122-130` and `engine-open.test.ts:22-50`. Tags kept from the main note (see §5). |
| Droll & Lock Bird | 1/0/1/1/1 | Partial | CHAIN, TRIG | Step 2 | script | `hand: "droll"` (`cards.ts:270`): offered when the turn player adds from the Deck outside the Draw Phase (`engine.ts:1234-1242`, `:1292`), then the `deck-to-hand` lock (`engine.ts:2691-2693`, `:1227`). Missing: use on its owner’s own turn: `afterAdding` only watches the turn player (`engine.ts:1237`) and hand effects are only for the non-turn player (`engine.ts:2631`). |
| Effect Veiler | 0/1/0/2/0 (main+side) | Partial | CHAIN | Step 1 | script | `hand: "veiler"` only while something is pending in the opponent's Main Phase (`engine.ts:1295`); also at the open moment after a draw or phase entry (`engine.ts:1168-1175`, commit 1b04b7c). Still not unrestricted open priority between actions. |
| Ghost Ogre & Snow Rabbit | 0/3/0/0/2 (main+side) | Partial | CHAIN, HAND | Step 1 | script | `hand: "ogre"`: only a monster on the field activating (`engine.ts:1294`); the "face-up Spell/Trap activates its effect" half and use from the field are missing. |
| Infinite Impermanence | 3/3/3/2/3 (main+side) | Partial | ZONE | beyond plan | card-deep | `impermanence` (`cards.ts:355`, `engine.ts:1630-1644`): negates, from hand if you control no cards; the column lock is left out (`engine.ts:1628`). |
| Magician's Rod | 3/3/3/2/2 | Partial | CHAIN, TRIG, GY | Step 3 | script | `summonSearch: "Dark Magician"` (`cards.ts:362`): after its Normal Summon (`engine.ts:1998`) add 1 Spell/Trap whose printed text quotes "Dark Magician" (`engine.ts:2001-2018`, `mentions` at `catalogue.ts:504`), once per turn. Missing: the GY effect (on the opponent's turn, when you activate a Spell/Trap, Tribute a Spellcaster to add it back). Tested at `packages/cards/test/engine-hand.test.ts:136-170`. |
| Mulcharmy Fuwalos | 3/2/3/3/0 (main+side) | Partial | CHAIN, TRIG | Step 2 | script | `hand: "fuwalos"` (`cards.ts:271`): "control no cards" and 1 other Mulcharmy (`engine.ts:1290`); draws (`engine.ts:1184-1200`) and the End Phase shuffle (`:1206-1225`). Missing: a Pendulum Summon from the Extra Deck is a separate `pendulum` event (`engine.ts:2135`) that `:1189` does not count; a second resolved copy adds no second lock (`:2689`); not usable on its owner’s own turn (`:2631`). |
| Dark Magician the Dragon Knight | 1/1/1/1/0 (extra+side) | Partial | LOCK, VOCAB | Step 3 | script | Fusion of `dark-magician` + any Dragon (`cards.ts:230`; materials by `named`, `engine.ts:477`); `nameAs: "dark-magician"`; `guardsBackrow` stops the opponent's mass destruction of its controller's Spells/Traps (`engine.ts:2309-2317`, `:1872`). Missing: the "cannot target" half (only `clearBackrow` reads `guarded`), and the name change applies in every location, not only on the field and in the GY (`catalogue.ts:508`). Tested at `packages/cards/test/engine-extra.test.ts:21`. |
| Dark Paladin | 1/1/1/0/0 (extra+side) | Partial | CHAIN | Step 1 | script | `cards.ts:229`: Fusion of `dark-magician` + `buster-blader`; `all-dragons` gain counts Dragons on both fields and in both GYs (`engine.ts:526-530`); `negate-spell` discards 1 card, negates and destroys the Spell (`engine.ts:2469-2493`). Missing: it only answers the opponent's pending Spell (`engine.ts:2471`, `:2361`), not a Spell its own controller activates, and only inside the one-answer model. Tested at `packages/cards/test/engine-extra.test.ts:43-48`. In these lists it is summoned by The Gaze of Timaeus or Secrets of Dark Magic (both absent), not Polymerization. |
| D.D. Crow | 0/0/0/2/0 (side) | Partial | CHAIN | Step 1 | script | `hand: "crow"` (`cards.ts:361`): only offered while a pending Spell targets a card in its user's GY (`engine.ts:1296`, `:2704-2712`); not a free Quick Effect at any time. |
| Ame no Murakumo no Mitsurugi | 0/1/0/0/0 | Absent | CHAIN, TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |  |
| Black Chaos | 0/0/3/3/0 | Absent | LOCK, VOCAB, GY | Step 3 | script |  |
| Black Luster Soldier - Legendary Swordsman | 0/0/0/1/0 | Absent | TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |  |
| Black Luster Soldier - Soldier of Light and Darkness | 0/0/1/0/0 | Absent | TRIG, LOCK, VOCAB, RITUAL | Step 3 | script |  |
| Bond Between Teacher and Student | 0/0/0/0/1 | Absent | LOCK, VOCAB, GY | Step 3 | script | "If you control Dark Magician" exists (`needs`); the Special Summon from hand, Deck or GY and the Set from the Deck do not. |
| Chaos Form | 1/1/1/1/1 | Absent | VOCAB, GY, BANISH, RITUAL | Step 3 | script | The Ritual Spell of the Chaos family: any "Chaos" or "Black Luster Soldier" Ritual Monster, Tributes whose Levels exactly equal its Level, and/or banish Dark Magician or Blue-Eyes White Dragon from the GY. Academy's Ritual Spells name one monster and a minimum total (`cards.ts:65`, `:391`; `catalogue.ts:140-143`). |
| Curse of Diabell | 0/0/0/0/1 | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Dark Magic Talisman | 0/1/1/0/0 | Absent | CHAIN, TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Dark Magical Circle | 1/2/1/0/1 | Absent | TRIG, VOCAB, BANISH, CONT | Step 3 | script | Look at the top 3 and reorder; banish trigger when Dark Magician is Summoned. |
| Dark Magician Girl the Magician's Apprentice | 3/0/0/0/1 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script | Name becomes "Dark Magician Girl" after its own Special Summon; part of the Shining Sarcophagus package. |
| Dark Magician the Magician of Black Magic | 1/0/0/0/0 | Absent | TRIG, LOCK, VOCAB | Step 3 | script | Name becomes "Dark Magician" on the field only: a location-limited `nameAs`. |
| Dark Magician, the Pharaoh's Servant | 3/2/3/3/1 | Absent | CHAIN, VOCAB | Step 3 | script | Name becomes "Dark Magician" on the field and in the GY: Academy's `nameAs` (`catalogue.ts:453`, read by `named` at `:508`) applies in every location, so it would need a location condition; reveal cost; Set from Deck; Quick Effect with a discard cost. |
| Deception of the Sinful Spoils | 0/0/0/0/1 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Diabellstar the Black Witch | 0/0/0/0/3 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Diabellstar Vengeance | 0/0/0/0/1 | Absent | CHAIN, LOCK, VOCAB, GY, BANISH | Step 3 | script |  |
| Diabellze the White Witch | 0/0/0/0/1 | Absent | TRIG, LOCK, VOCAB, GY | Step 3 | script |  |
| Elzette, Azamina of the White Forest | 0/0/0/0/1 | Absent | TRIG, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| Eternal Soul | 1/0/1/1/1 | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, CONT | Step 3 | script | Continuous Trap: Dark Magician unaffected by the opponent's effects; Special Summon Dark Magician, or add Dark Magic Attack or Thousand Knives (both already scripted). |
| Filia Diabell | 0/0/0/0/1 | Absent | TRIG, LOCK, VOCAB, BANISH | Step 3 | script |  |
| Future Silence | 1/0/0/0/0 | Absent | LOCK, VOCAB | Step 3 | script |  |
| Gandora-G the Dragon of Destruction | 1/0/0/0/0 | Absent | LOCK, VOCAB, BANISH | Step 3 | script |  |
| Griffoh | 0/0/1/1/0 | Absent | CHAIN, HAND, VOCAB, RITUAL | Step 3 | script |  |
| Illusion of Chaos | 3/3/3/2/2 | Absent | CHAIN, VOCAB, GY, RITUAL | Step 3 | script |  |
| Kuriboh - Multiply! | 0/3/3/1/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Light and Darkness Ritual | 0/0/1/1/0 | Absent | VOCAB, GY, RITUAL | Step 3 | script |  |
| Magician of Black Chaos MAX | 1/1/1/1/0 | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script | The "evil" Chaos boss: Ritual Summoned with Chaos Form; on Special Summon, Tribute 1 monster so the opponent cannot activate monster effects this turn; on battle destruction, add a Spell from the GY. |
| Magician of Chaos | 1/1/0/1/1 (main+side) | Absent | CHAIN, TRIG, VOCAB, GY, RITUAL | Step 3 | script | Ritual Monster (Chaos Form) whose name becomes "Dark Magician" on the field and in the GY: Academy's `nameAs` has no location (`catalogue.ts:508`). |
| Magician of Dark Chaos - Black Chaos | 0/0/1/1/0 | Absent | TRIG, LOCK, VOCAB, GY, RITUAL | Step 3 | script |  |
| Magician's Salvation | 1/0/1/1/1 | Absent | TRIG, LOCK, VOCAB, GY, CONT | Step 3 | script |  |
| Magicians' Combination | 1/0/0/0/0 | Absent | CHAIN, TRIG, VOCAB, GY, CONT | Step 3 | script |  |
| Mind Shuffle | 0/0/1/0/0 | Absent | CHAIN, TRIG, LOCK, VOCAB, CONT | Step 3 | script |  |
| Miracle Raven | 0/0/0/1/0 | Absent | LOCK, VOCAB, RITUAL, PEND | Step 4 | script |  |
| Nibiru, the Primal Being | 2/2/3/3/0 (main+side) | Absent | CHAIN, HAND, TRIG, VOCAB, TOKEN, CONTROL | Step 3 + beyond plan | card-deep |  |
| Preparation of Rites | 0/2/3/0/0 | Absent | VOCAB, GY | Step 3 | script |  |
| Ragged Records of Rites | 0/2/3/2/0 | Absent | TRIG, VOCAB, GY | Step 3 | script |  |
| Secrets of Dark Magic | 1/2/1/1/0 | Absent | VOCAB, RITUAL, FUS-EFF | Step 3 | script | A choice of a Fusion Summon or a Ritual Summon, each including Dark Magician or Dark Magician Girl. |
| Shining Sarcophagus | 2/0/0/0/1 | Absent | LOCK, VOCAB, GY, CONT | Step 3 | script |  |
| Skull Archfiend of Chaos | 0/0/1/2/0 | Absent | TRIG, VOCAB, GY, BANISH | Step 3 | script |  |
| Soul Servant | 1/3/1/3/0 (main+side) | Absent | VOCAB, GY, BANISH | Step 3 | script | Places a card on top of the Deck. |
| Super Polymerization | 0/3/0/0/0 | Absent | CHAIN, LOCK, VOCAB, FUS-EFF | Step 3 | script |  |
| The Gaze of Timaeus | 2/1/1/2/0 | Absent | TRIG, LOCK, VOCAB, GY, FUS-EFF | Step 3 | script | Fusion Summon by shuffling one named material from field or GY; delayed banish. |
| The Great Gallant Bandit | 0/0/1/0/0 | Absent | CHAIN, TRIG, VOCAB, BANISH, CONTROL | Step 3 + beyond plan | card-deep |  |
| The Hallowed Azamina | 0/0/0/0/1 | Absent | VOCAB, GY, FUS-EFF | Step 3 | script |  |
| WANTED: Seeker of Sinful Spoils | 0/0/0/0/3 | Absent | VOCAB, GY, BANISH | Step 3 | script |  |
| Accesscode Talker | 1/1/0/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| Azamina | 0/0/0/0/1 (extra) | Absent | LOCK, VOCAB, FUS-MAT | Step 4 | script |  |
| Azamina Moa Regina | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Azamina Mu Rcielago | 0/0/0/0/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Black Luster Soldier - Soldier of Chaos | 0/0/0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, LINK | Step 4 | script |  |
| Centur-Ion Auxila | 0/0/1/0/0 (extra) | Absent | TRIG, LOCK, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Chaos Angel | 0/1/0/0/1 (extra+side) | Absent | TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Clear Wing Synchro Dragon | 0/0/1/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, SYN | Step 4 | script |  |
| Crimson Blade Dragon | 0/0/1/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, SYN | Step 4 | script |  |
| Crimson Dragon | 0/0/1/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, SYN | Step 4 | script |  |
| Cyberse Contract Witch | 1/1/1/1/1 (extra) | Absent | TRIG, VOCAB, GY, LINK | Step 4 | script |  |
| Dark Cavalry | 0/1/0/0/0 (extra) | Absent | CHAIN, TRIG, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Dark Magician of Destruction | 1/1/1/1/1 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Dharc the Dark Charmer, Gloomy | 0/1/0/1/0 (extra) | Absent | TRIG, VOCAB, LINK | Step 4 | script |  |
| Dragon Master Magia | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Dyna Mondo | 1/1/1/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| Ebon Illusion Magician | 0/0/0/1/0 (extra) | Absent | TRIG, LOCK, VOCAB, BANISH, XYZ | Step 4 | script |  |
| Garura, Wings of Resonant Life | 0/1/0/0/0 (extra) | Absent | TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Gorgon of Zilofthonia | 0/0/0/0/1 (extra) | Absent | LOCK, VOCAB, LINK | Step 4 | script |  |
| Herald of Mirage Lights | 0/0/0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 | script |  |
| I:P Masquerena | 1/1/1/1/1 (extra) | Absent | CHAIN, LOCK, VOCAB, LINK | Step 4 | script |  |
| Magistus Chorozo | 0/0/1/0/1 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Master of Chaos | 1/1/1/1/0 (extra) | Absent | TRIG, VOCAB, GY, BANISH, FUS-MAT | Step 4 | script |  |
| Muddy Mudragon | 0/0/0/0/1 (extra) | Absent | LOCK, VOCAB, SYN | Step 4 | script |  |
| Mudragon of the Swamp | 0/1/0/0/0 (extra) | Absent | CHAIN, LOCK, FUS-MAT | Step 4 | script |  |
| Number 11: Big Eye | 0/0/0/1/0 (extra) | Absent | LOCK, VOCAB, XYZ, CONTROL | Step 4 + beyond plan | card-deep |  |
| Number 90: Galaxy-Eyes Photon Lord | 1/0/0/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, XYZ | Step 4 | script |  |
| Poplar of the White Forest | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, SYN, MONSPELL | Step 4 + beyond plan | card-deep |  |
| Relinquished Anima | 0/0/0/1/0 (extra) | Absent | LINK, EQ-MON | Step 4 + beyond plan | card-deep |  |
| S:P Little Knight | 1/1/1/1/1 (extra) | Absent | CHAIN, TRIG, VOCAB, LINK | Step 4 | script |  |
| Saint Azamina | 0/0/0/0/1 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, BANISH, FUS-MAT | Step 4 | script |  |
| Selene, Queen of the Master Magicians | 1/1/0/0/0 (extra) | Absent | CHAIN, HAND, TRIG, LOCK, VOCAB, GY, LINK, CTR | Step 4 + beyond plan | card-deep |  |
| Snake-Eyes Vengeance Dragon | 0/0/0/0/1 (extra) | Absent | CHAIN, VOCAB, MONSPELL | Step 3 + beyond plan | card-deep |  |
| Super Starslayer TY-PHON - Sky Crisis | 1/0/0/0/0 (extra) | Absent | LOCK, VOCAB, XYZ | Step 4 | script |  |
| The Dark Magicians | 1/1/0/1/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, GY, FUS-MAT | Step 4 | script |  |
| Timaeus the United Magical Dragon | 1/1/1/1/0 (extra) | Absent | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 | script |  |
| Underworld Goddess of the Closed World | 0/1/0/0/0 (extra) | Absent | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 | script |  |
| W:P Fancy Ball | 1/0/1/0/0 (extra) | Absent | CHAIN, VOCAB, BANISH, LINK, CONTROL | Step 4 + beyond plan | card-deep | Link Summons using a monster the opponent controls. |
| Eradicator Epidemic Virus | 3/0/0/0/0 (side) | Absent | CHAIN, TRIG, LOCK, VOCAB | Step 3 | script |  |
| Forbidden Droplet | 0/0/0/3/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Ghost Belle & Haunted Mansion | 2/0/0/3/0 (side) | Absent | CHAIN, HAND, VOCAB | Step 3 | script |  |
| Mulcharmy Meowls | 3/0/0/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB, BANISH | Step 3 | script |  |
| Mulcharmy Purulia | 3/0/3/0/0 (side) | Absent | CHAIN, HAND, TRIG, VOCAB | Step 3 | script |  |
| Pot of Sloth | 0/0/3/0/0 (side) | Absent | LOCK, VOCAB | Step 3 | script |  |
| Ruler of the End of the World | 0/1/0/0/0 (side) | Absent | LOCK, VOCAB, BANISH, RITUAL | Step 3 | script |  |
| Sorcerer of Dark Magic | 1/0/0/0/0 (side) | Absent | CHAIN, LOCK, VOCAB | Step 3 | script |  |
| Spiritualism | 0/0/3/0/0 (side) | Absent | CHAIN, VOCAB | Step 3 | script |  |
| Triple Tactics Thrust | 2/0/0/0/0 (side) | Absent | VOCAB | Step 3 | script |  |

## 6. Unverified, exclusions and interpretation limits

1. **No tournament evidence for this deck.** The fallback lists are user submissions. YGOPRODeck's "Meta Decks" category (L3, L4) is the submitter's own label, not a result; L1 is a guide by its author, not by an identified professional. The owner's rule allows this ("otherwise lists by pros, deck guides or other strong builds"); the strength of these builds is not established by any event.
2. **Dark Magician of Chaos.** Among all lists read (480 tournament records and 708 Dark Magician / Chaos / Arkana name-search records), the only current-format TCG list with Dark Magician of Chaos is illegal (§1). The search covers YGOPRODeck only; a list elsewhere is not covered.
3. **Light and Darkness Ritual in L3 and L4.** Kept because their authors built them around Magician of Black Chaos MAX and Chaos Form, and because without them the sample would rest on three lists, one casual. If "distinct from Atem" means no Light and Darkness Ritual at all, the Arkana-shaped lists are **L1, L2 and L5**.
4. **The artwork identification** rests on looking at YGOPRODeck's picture 36996508, on Yugipedia's naming, and on Konami's illustration index 3 matching Yugipedia's printings exactly. Konami's database page does not print the passcode next to the illustration; 36996508 as that artwork's password is from YGOPRODeck and Yugipedia.
5. **Per-card mechanism tags are triage (ours).** The 63 cards already audited keep their earlier tags verbatim, including Dark Magical Curtain's (the Dark Magician note §5.4 explains why that tag may be low). The 43 new tags are judgment calls; Dragon Master Magia, Gorgon of Zilofthonia and Eradicator Epidemic Virus are harder than their tags suggest.
6. **Present-card verdicts are static code/text comparisons.** The cited tests pass (§3), but no new conformance tests were written.
7. **Card API normalization:** every passcode of the five lists resolved through `card_images` to an English name; none is unknown.
8. **Dates** are each deck page's `datePublished` (L1 2026-10-28, L2 2026-10-25, L3 2026-10-24, L4 2026-10-29, L5 2026-11-08); a list can be edited after publication (L1, L3 and L5 were, the same day).

## 7. Prioritized implementation proposal (ours)

The main note's order still holds (its §6): first the Step 1–2 foundations behind the shared partial staples, then the vocabulary (Step 3), then summon procedures (Step 4). For Arkana specifically:

| Priority | Deep engine assignment | What it unlocks here | Then scripting |
| --- | --- | --- | --- |
| 0 | The Arkana picture (§2, option C): no engine work | Arkana's Dark Magician looks like Arkana's | One `card-art.json` image and an owner-aware picture lookup |
| 1 | Steps 1–2 as in the main note | Ash, Droll, Ogre, Fuwalos, Veiler, D.D. Crow; Dark Paladin's negation; Curtain's restriction; Rod's GY effect | Kuriboh - Multiply!, Illusion of Chaos's Quick Effect |
| 2 | Step 3 Ritual: a Ritual Spell for a family of monsters ("Chaos" or "Black Luster Soldier"), Tributes that **exactly** equal, and banishing Dark Magician or Blue-Eyes from the GY as Levels; location-limited name changes | **The Chaos core:** Chaos Form, Magician of Black Chaos MAX, Magician of Chaos, Illusion of Chaos; with Light and Darkness Ritual's procedure for Atem | Then Dark Magician of Chaos and Magician of Black Chaos (with Black Magic Ritual) if Arkana should play them |
| 3 | Step 3 vocabulary shared with Atem: the "mentions [card]" filter, Set from Deck, reveal costs | Pharaoh's Servant, Soul Servant, Dark Magical Circle, Eternal Soul, Magician's Salvation, Bond Between Teacher and Student | Per card |
| 4 | Step 4 Fusion material predicates | Dark Magician of Destruction, Master of Chaos, Timaeus the United Magical Dragon, The Dark Magicians, Dark Cavalry | Per card |

**For Arkana, the realistic target is L1 or L2 without its Link toolbox.** Its Dark Magician half is the same Step 3 work as Atem's; its Chaos half needs a Ritual procedure only slightly different from Light and Darkness Ritual's. None of the 12 cards in all five lists is `card-deep`. The 10 `card-deep` cards are toolbox and staple cards (Nibiru, The Great Gallant Bandit, Infinite Impermanence, Number 11: Big Eye, Poplar of the White Forest, Selene, Relinquished Anima, W:P Fancy Ball, Snake-Eyes Vengeance Dragon, Centur-Ion Auxila). These are sample counts, not format-wide play rates.

## Sources and reproducibility

Fetched 2026-11-23.

- Konami: [Forbidden & Limited List effective October 19, 2026](https://www.yugioh-card.com/en/limited/list_2026-10-19/) (Advanced Format column; 256 entries parsed). [Card database, Dark Magician (cid 4041)](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4041&request_locale=en) (printings with illustration index).
- YGOPRODeck: [API guide](https://ygoprodeck.com/api-guide/); deck search `https://ygoprodeck.com/api/decks/getDecks.php?name=<name>&offset=<n>` (names above) and `…?_sft_category=Tournament%20Meta%20Decks&offset=0,20,…,460`; each selected deck's page for `datePublished`/`dateModified`; full card API `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` (14,684 cards) for names, types, texts and image ids; cropped pictures `https://images.ygoprodeck.com/images/cards_cropped/<id>.jpg` for the nine Dark Magician artworks (viewed only, kept outside the repo). Appendix A links each name to an exact-name query. No downloaded content was executed.
- Yugipedia (wiki, secondary): [Dark Magician (Arkana)](https://yugipedia.com/wiki/Dark_Magician_(Arkana)), [Card Artworks:Dark Magician](https://yugipedia.com/wiki/Card_Artworks:Dark_Magician), read through its MediaWiki API.
- Repo primary sources: `packages/engine/src/{engine,effects,catalogue,bot}.ts`, `packages/cards/src/{cards,card-art,index}.ts`, `card-art.json`, `apps/academy-ygo/scripts/cards/build-art.mjs`, `apps/academy-ygo/src/lib/junior/play/{card-pictures,master-decks,deck-record}.ts`, `apps/academy-ygo/src/components/junior/play/board3d/card-textures.ts`, the tests named in §3, and the earlier notes' §4 tables.

## Appendix A. Exact zone counts and card-text/type sources

Each entry: `Main/Extra/Side` for L1 … L5, in the list order of §1. Type labels are API types; they are not proof of summon support.

| Card / API text | API type | L1 M/E/S | L2 M/E/S | L3 M/E/S | L4 M/E/S | L5 M/E/S |
| --- | --- | --- | --- | --- | --- | --- |
| [Accesscode Talker](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Accesscode%20Talker) | Link Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ame no Murakumo no Mitsurugi](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ame%20no%20Murakumo%20no%20Mitsurugi) | Ritual Effect Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ash Blossom & Joyous Spring](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ash%20Blossom%20%26%20Joyous%20Spring) | Tuner Monster | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Azamina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Azamina) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Azamina Moa Regina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Azamina%20Moa%20Regina) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Azamina Mu Rcielago](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Azamina%20Mu%20Rcielago) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Black Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Chaos) | Effect Monster | 0/0/0 | 0/0/0 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Black Luster Soldier - Legendary Swordsman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Luster%20Soldier%20-%20Legendary%20Swordsman) | Ritual Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Black Luster Soldier - Soldier of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Luster%20Soldier%20-%20Soldier%20of%20Chaos) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Black Luster Soldier - Soldier of Light and Darkness](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Black%20Luster%20Soldier%20-%20Soldier%20of%20Light%20and%20Darkness) | Ritual Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Bond Between Teacher and Student](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Bond%20Between%20Teacher%20and%20Student) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Centur-Ion Auxila](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Centur-Ion%20Auxila) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Chaos Angel](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Angel) | Synchro Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Chaos Form](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Chaos%20Form) | Spell Card | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Clear Wing Synchro Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Clear%20Wing%20Synchro%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Crimson Blade Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crimson%20Blade%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Crimson Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Crimson%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Curse of Diabell](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Curse%20of%20Diabell) | Trap Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Cyberse Contract Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Cyberse%20Contract%20Witch) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [D.D. Crow](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=D.D.%20Crow) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Dark Cavalry](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Cavalry) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dark Magic Attack](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magic%20Attack) | Spell Card | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Dark Magic Talisman](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magic%20Talisman) | Trap Card | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Dark Magical Circle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Circle) | Spell Card | 1/0/0 | 2/0/0 | 1/0/0 | 0/0/0 | 1/0/0 |
| [Dark Magical Curtain](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magical%20Curtain) | Spell Card | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 | 3/0/0 |
| [Dark Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician) | Normal Monster | 1/0/0 | 1/0/0 | 1/0/0 | 2/0/0 | 1/0/0 |
| [Dark Magician Girl](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20Girl) | Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dark Magician Girl the Magician's Apprentice](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20Girl%20the%20Magician%27s%20Apprentice) | Effect Monster | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Dark Magician of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20of%20Destruction) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Dark Magician the Dragon Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20the%20Dragon%20Knight) | Fusion Monster | 0/1/0 | 0/0/1 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Dark Magician the Magician of Black Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%20the%20Magician%20of%20Black%20Magic) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Dark Magician, the Pharaoh's Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Magician%2C%20the%20Pharaoh%27s%20Servant) | Effect Monster | 3/0/0 | 2/0/0 | 3/0/0 | 3/0/0 | 1/0/0 |
| [Dark Paladin](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dark%20Paladin) | Fusion Monster | 0/1/0 | 0/0/1 | 0/1/0 | 0/0/0 | 0/0/0 |
| [Deception of the Sinful Spoils](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Deception%20of%20the%20Sinful%20Spoils) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Dharc the Dark Charmer, Gloomy](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dharc%20the%20Dark%20Charmer%2C%20Gloomy) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Diabellstar the Black Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diabellstar%20the%20Black%20Witch) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
| [Diabellstar Vengeance](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diabellstar%20Vengeance) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Diabellze the White Witch](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Diabellze%20the%20White%20Witch) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Dragon Master Magia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dragon%20Master%20Magia) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Droll & Lock Bird](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Droll%20%26%20Lock%20Bird) | Effect Monster | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Dyna Mondo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Dyna%20Mondo) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Ebon Illusion Magician](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ebon%20Illusion%20Magician) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Effect Veiler](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Effect%20Veiler) | Tuner Monster | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/2 | 0/0/0 |
| [Elzette, Azamina of the White Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Elzette%2C%20Azamina%20of%20the%20White%20Forest) | Effect Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Eradicator Epidemic Virus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Eradicator%20Epidemic%20Virus) | Trap Card | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Eternal Soul](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Eternal%20Soul) | Trap Card | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Filia Diabell](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Filia%20Diabell) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Forbidden Droplet](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Forbidden%20Droplet) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Future Silence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Future%20Silence) | Spell Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Gandora-G the Dragon of Destruction](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gandora-G%20the%20Dragon%20of%20Destruction) | Effect Monster | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Garura, Wings of Resonant Life](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Garura%2C%20Wings%20of%20Resonant%20Life) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Ghost Belle & Haunted Mansion](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Belle%20%26%20Haunted%20Mansion) | Tuner Monster | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 |
| [Ghost Ogre & Snow Rabbit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ghost%20Ogre%20%26%20Snow%20Rabbit) | Tuner Monster | 0/0/0 | 2/0/1 | 0/0/0 | 0/0/0 | 2/0/0 |
| [Gorgon of Zilofthonia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Gorgon%20of%20Zilofthonia) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Griffoh](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Griffoh) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Herald of Mirage Lights](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Herald%20of%20Mirage%20Lights) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [I:P Masquerena](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=I%3AP%20Masquerena) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Illusion of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Illusion%20of%20Chaos) | Ritual Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 2/0/0 | 2/0/0 |
| [Infinite Impermanence](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Infinite%20Impermanence) | Trap Card | 3/0/0 | 3/0/0 | 3/0/0 | 0/0/2 | 3/0/0 |
| [Kuriboh - Multiply!](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Kuriboh%20-%20Multiply%21) | Effect Monster | 0/0/0 | 1/0/2 | 0/0/3 | 1/0/0 | 0/0/0 |
| [Light and Darkness Ritual](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Light%20and%20Darkness%20Ritual) | Spell Card | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Magician of Black Chaos MAX](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Black%20Chaos%20MAX) | Ritual Effect Monster | 1/0/0 | 1/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Magician of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Chaos) | Ritual Effect Monster | 1/0/0 | 0/0/1 | 0/0/0 | 1/0/0 | 1/0/0 |
| [Magician of Dark Chaos - Black Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%20of%20Dark%20Chaos%20-%20Black%20Chaos) | Ritual Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Magician's Rod](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%27s%20Rod) | Effect Monster | 3/0/0 | 3/0/0 | 3/0/0 | 2/0/0 | 2/0/0 |
| [Magician's Salvation](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magician%27s%20Salvation) | Spell Card | 1/0/0 | 0/0/0 | 1/0/0 | 1/0/0 | 1/0/0 |
| [Magicians' Combination](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magicians%27%20Combination) | Trap Card | 1/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Magistus Chorozo](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Magistus%20Chorozo) | Fusion Monster | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/1/0 |
| [Master of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Master%20of%20Chaos) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Mind Shuffle](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mind%20Shuffle) | Trap Card | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [Miracle Raven](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Miracle%20Raven) | Pendulum Effect Ritual Monster | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 |
| [Muddy Mudragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Muddy%20Mudragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Mudragon of the Swamp](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mudragon%20of%20the%20Swamp) | Fusion Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mulcharmy Fuwalos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Fuwalos) | Effect Monster | 3/0/0 | 0/0/2 | 3/0/0 | 3/0/0 | 0/0/0 |
| [Mulcharmy Meowls](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Meowls) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Mulcharmy Purulia](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Mulcharmy%20Purulia) | Effect Monster | 0/0/3 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Nibiru, the Primal Being](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Nibiru%2C%20the%20Primal%20Being) | Effect Monster | 2/0/0 | 2/0/0 | 0/0/3 | 0/0/3 | 0/0/0 |
| [Number 11: Big Eye](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2011%3A%20Big%20Eye) | XYZ Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Number 90: Galaxy-Eyes Photon Lord](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Number%2090%3A%20Galaxy-Eyes%20Photon%20Lord) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Poplar of the White Forest](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Poplar%20of%20the%20White%20Forest) | Synchro Tuner Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Pot of Sloth](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Pot%20of%20Sloth) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Preparation of Rites](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Preparation%20of%20Rites) | Spell Card | 0/0/0 | 2/0/0 | 3/0/0 | 0/0/0 | 0/0/0 |
| [Ragged Records of Rites](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ragged%20Records%20of%20Rites) | Spell Card | 0/0/0 | 2/0/0 | 3/0/0 | 2/0/0 | 0/0/0 |
| [Relinquished Anima](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Relinquished%20Anima) | Link Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [Ruler of the End of the World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Ruler%20of%20the%20End%20of%20the%20World) | Ritual Effect Monster | 0/0/0 | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| [S:P Little Knight](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=S%3AP%20Little%20Knight) | Link Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 |
| [Saint Azamina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Saint%20Azamina) | Fusion Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Secrets of Dark Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Secrets%20of%20Dark%20Magic) | Spell Card | 1/0/0 | 2/0/0 | 1/0/0 | 1/0/0 | 0/0/0 |
| [Selene, Queen of the Master Magicians](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Selene%2C%20Queen%20of%20the%20Master%20Magicians) | Link Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Shining Sarcophagus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Shining%20Sarcophagus) | Spell Card | 2/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Skull Archfiend of Chaos](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Skull%20Archfiend%20of%20Chaos) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 2/0/0 | 0/0/0 |
| [Snake-Eyes Vengeance Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Snake-Eyes%20Vengeance%20Dragon) | Synchro Monster | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/1/0 |
| [Sorcerer of Dark Magic](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Sorcerer%20of%20Dark%20Magic) | Effect Monster | 0/0/1 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Soul Servant](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Soul%20Servant) | Spell Card | 1/0/0 | 2/0/1 | 1/0/0 | 3/0/0 | 0/0/0 |
| [Spiritualism](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Spiritualism) | Spell Card | 0/0/0 | 0/0/0 | 0/0/3 | 0/0/0 | 0/0/0 |
| [Super Polymerization](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Polymerization) | Spell Card | 0/0/0 | 3/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Super Starslayer TY-PHON - Sky Crisis](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Super%20Starslayer%20TY-PHON%20-%20Sky%20Crisis) | XYZ Monster | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [The Dark Magicians](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Dark%20Magicians) | Fusion Monster | 0/1/0 | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 |
| [The Gaze of Timaeus](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Gaze%20of%20Timaeus) | Spell Card | 2/0/0 | 1/0/0 | 1/0/0 | 2/0/0 | 0/0/0 |
| [The Great Gallant Bandit](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Great%20Gallant%20Bandit) | Effect Monster | 0/0/0 | 0/0/0 | 1/0/0 | 0/0/0 | 0/0/0 |
| [The Hallowed Azamina](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=The%20Hallowed%20Azamina) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 1/0/0 |
| [Timaeus the United Magical Dragon](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Timaeus%20the%20United%20Magical%20Dragon) | Fusion Monster | 0/1/0 | 0/1/0 | 0/1/0 | 0/1/0 | 0/0/0 |
| [Triple Tactics Thrust](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Triple%20Tactics%20Thrust) | Spell Card | 0/0/2 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [Underworld Goddess of the Closed World](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Underworld%20Goddess%20of%20the%20Closed%20World) | Link Monster | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 | 0/0/0 |
| [W:P Fancy Ball](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=W%3AP%20Fancy%20Ball) | Link Monster | 0/1/0 | 0/0/0 | 0/1/0 | 0/0/0 | 0/0/0 |
| [WANTED: Seeker of Sinful Spoils](https://db.ygoprodeck.com/api/v7/cardinfo.php?name=WANTED%3A%20Seeker%20of%20Sinful%20Spoils) | Spell Card | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 3/0/0 |
