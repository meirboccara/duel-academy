# Trainer and starter decks closer to today's meta: what MAMS brings, and what Junior can play

> **Date of observation:** 2026-11-23. Every web page and API response cited below was fetched for this note. This
> repository was read on `main` at HEAD `0f8f64d`, with uncommitted edits in `engine.ts`, `levels.ts`, `masters.ts`,
> `masters.test.ts`, `session.ts`, the three `copy-*.ts`, `junior-play.tsx` (+ test), the world files, `map-places.ts`
> and `docs/academy-junior-play.md`, plus two untracked tests (none in `cards.ts`, `effects.ts`, `card-art.*`,
> `master-decks.ts`, `starters.ts` or `packs/`); line numbers are from the working tree.
> **Nature of this document:** a research note. No code was changed, nothing was installed, committed or published.
> Deck lists and card data were downloaded into a temporary folder outside the repo and processed with throwaway
> scripts; the proposed decks were checked by such a script for 40 cards, Extra ≤ 15, ≤ 3 copies and the TCG list in
> `card-art.ts`.
>
> **The request (owner, verbatim):** "Improve decks trainer and starter deck of junior to match more meta decks
> existing today based on the character playing. For example, kaiba will be blue eyes with all new cards from mams,
> yami yugi with dark magician curtain, joey with time wizard and the extra should be more complete like 15 cards
> instead to have only 5. Research meta decks and adapt to reflect those players"
>
> **Standing owner rules applied:** anime-faithful decks, non-anime filler allowed; every card must be played
> *exactly* by the rules engine ("left out, never changed"); 40 Main, Extra up to 15, max 3 copies, TCG Forbidden &
> Limited List (`masters.ts:97-137`).
>
> **Sourcing rule used:** claims about this repo cite `file:line`. Meta claims cite YGOPRODeck deck pages in the curated
> "Tournament Meta Decks" category (TCG), with event and placement as YGOPRODeck lists them. Set and card facts
> (passcodes, text, Types, Link Arrows, TCG banlist status) come from the YGOPRODeck API (`cardsets.php`,
> `cardinfo.php`). Inferences, archetype choices for characters with no meta deck, and every proposed list are
> labelled **(ours)**. What could not be confirmed is in [§8](#8-unverified).
>
> **Relation to existing notes.** [meta-archetypes-coverage.md](./meta-archetypes-coverage.md) (2026-11-22) already
> analyses Toon, Light and Darkness Ritual (Dark Magician), Destiny HERO, Dark Time Wizard and Blue-Eyes card by card;
> this note reuses it and does not repeat those tables. [duel-engine-meta-cards.md](./duel-engine-meta-cards.md) §6
> "Status (2026-11-23)" describes what the vocabulary in `effects.ts` can do today; §2 below states the limits that
> decide "data now".

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | What is "MAMS"? | **Magnificent Maestros**, set code **MAMS**, a 125-card TCG set released **2026-11-12** (YGOPRODeck `cardsets.php`). It brings new **Blue-Eyes** cards (Blue-Eyes White Dragon, the White Phantom Beast; Deep-Eyes White Dragon, the Blue Abyss; The Guiding Flute of Summoning Dragons; Blue-Eyes Toon Ultimate Dragon) plus Kaibaman the Legend as a reprint, a new **Toon** wave (Funny Dark Rabbit, Animimicat, Evil Box, Dark-Eyes Illusionist Faceless Mage, Perfect Toon World, Mind Scan) and a new **Witchcrafter** wave, which is why videos are titled "Witchcrafter vs Toon post MAMS" (§1). |
| 2 | Can Kaiba get "all new cards from MAMS"? | **Not under the "played exactly" rule.** None of the five MAMS Blue-Eyes cards fits the current vocabulary: each needs at least one missing mechanism (a hand trigger on "added from the Deck", a "destroy all" data action, an attack lock, a trigger on *another* card going to the GY, a Type filter, a Contact-Fusion procedure). Deep-Eyes' first effect alone is pure data, but its second is not, so the card stays out (§1.2). |
| 3 | How much of today's meta lists can Junior play? | Per list, 0 to 8 of 31-44 unique Main+Extra cards are already in Academy (all of them hand traps, staples or the archetype's oldest cards). **Only one other card of the 15 lists is data now: Frostosaurus, a Normal Monster** (Ryu-Ge list, used for Rex); the only near-misses are Deep Sea Diva and Fossil Dig (need a Type filter) and Deep-Eyes (half data) (§2, Appendix A). |
| 4 | What can be added as data now? | **16 cards**, none of them meta-defining: **Protector with Eyes of Blue** (the one real Blue-Eyes engine card that fits the vocabulary), three generic Extra Deck monsters with no effect that the engine can Summon (**Scrap Archfiend**, **Gagagigo the Risen**, **Traffic Ghost**), five no-effect Fusions from the characters' own era (**Kwagar Hercules, Deepsea Shark, Kaiser Dragon, Pragtical, Soul Hunter**) their six Normal Monster materials, and Frostosaurus, a Normal Monster from the Ryu-Ge list (§6). |
| 5 | Do the proposed decks reach 40 + 15? | **Yes, all 13 trainers and 3 starters** (§4, §5): every Extra Deck has 15 cards, each Summonable from that deck's own cards by the engine's Fusion/Synchro/Xyz/Link rules. The Main Decks move toward the meta through the hand traps and staples Junior already plays exactly (Ash Blossom, Ghost Ogre, Effect Veiler, Droll & Lock Bird, Infinite Impermanence, Solemn Strike) and the archetype cards that exist (Sage, The White Stone of Legend, Dark Magical Curtain ×3, Magician's Rod ×3, Shadow Mist, Malicious, Toon Table of Contents). |
| 6 | What would bring the real meta cards in? **(ours)** | Small, general engine additions, ranked by cards unlocked in §7: a **Type (race) filter** and **"Level N or higher"** in `CardFilter`; **Flip Summon** in the `summoned` trigger; **"Tribute this card"** as a cost; **Quick Effects on the opponent's turn** for data monsters; a **"destroy" data action**; **free-chain data Traps**; **"add from GY" action**; triggers on **other** cards' events. |

## 1. MAMS = Magnificent Maestros

### 1.1 Identification

YGOPRODeck's set list (`https://db.ygoprodeck.com/api/v7/cardsets.php`) has exactly one set with code `MAMS`:
`{"set_name":"Magnificent Maestros","set_code":"MAMS","num_of_cards":125,"tcg_date":"2026-11-12"}`. The card query
`cardinfo.php?cardset=Magnificent Maestros` returned 124 cards (one short of the set size; §8). It sits after
*Beyond the Brave* (BETB, 2026-10-08) and *Ultimate Tournament Pack 2* (UP02, 2026-11-05) and before *Glorious Victors*
(GLVI, 2026-12-03) in the same list.

Themes in the set, by the cards' archetype field: Blue-Eyes, Toon, Witchcrafter (Marka, Terracottan, Celebration,
Walpurgis, Distortion, Madame Rilliona, Pupils, plus Madame Verre and Vice-Madame reprints), Unchained (Oni of Shara,
Oni of Shyma, Zealot - Kamra, Firelord of Yama, Soul of Abominable Rage, Hunger, Reincarnation of the Unchained),
the "Four Heavenly Dragons" (Clear Wing Synchro, Dark Rebellion Xyz, Starving Venom Fusion), Cyber Dragon
(the Luminous Mech Dragon, Cyber End Dragon the Final Strike Dragon, Future Fusion Nova), Red Dragon Archfiend
(Red Nova Dragon - Burning Soul, Red Dragon Archfiend's Chains, Crimson Dragon Quetzalcoatl), Dark Tuners
(Catastrogue, Nightmare Hand), Borrel/Rokket, Galaxy-Eyes. The new Witchcrafter and Toon waves arriving together
explain the "Witchcrafter vs Toon post MAMS" video title **(ours)**.

### 1.2 MAMS cards for the trainers' archetypes, with exact text and verdict

Text is YGOPRODeck's English text. "Verdict" applies the strict rule of §2.

| Set code | Card (passcode) | New / reprint | For | Verdict | What the vocabulary cannot express |
| --- | --- | --- | --- | --- | --- |
| MAMS-EN001 | Blue-Eyes White Dragon, the White Phantom Beast (30397786) | new (TCG 2026-11-12) | Kaiba | **engine** | Trigger in the hand on "added from the Deck to your hand" or "a monster you control is destroyed by battle"; "destroy all monsters your opponent controls" as a data action; "only attack directly with Blue-Eyes" lock; Quick Effect negation with a discard cost. |
| MAMS-EN002 | Deep-Eyes White Dragon, the Blue Abyss (67886895) | new | Kaiba | **engine** (half data) | Effect 1 is data (see below). Effect 2: trigger on *another* card ("Blue-Eyes" Ritual Monster or BEWD) being sent to your GY, from hand or GY; "ATK becomes that monster's"; "banish it when it leaves the field". The card is always treated as "Blue-Eyes", which the name-based `archetype` filter would also miss (`effects.ts:19`). |
| MAMS-EN003 | The Guiding Flute of Summoning Dragons (93871599) | new | Kaiba | **engine** | Type filters (Spellcaster on the field, Dragon in the Deck), "Level 5 or higher", a conditional second Summon of the same name, a Type lock, a GY effect "if sent there this turn" in Main Phase 2. |
| MAMS-EN043 | Blue-Eyes Toon Ultimate Dragon (71808988) | new | Kaiba / Pegasus | **engine** | Contact-Fusion procedure (shuffle materials from hand/field/GY), Toon status, "add from GY", banish during damage calculation. |
| MAMS-EN083 | Kaibaman the Legend (67768675) | reprint (TCG 2025-07-03) | Kaiba | **engine** | "Show 3 BEWD" condition; a GY trigger on *your* Special Summon of BEWD; banish-self cost from GY on that trigger. |
| MAMS-EN120 | Blue-Eyes Toon Dragon (53183600) | reprint | Pegasus | **engine** | Toon World status and summon procedure, attack cost of 500 LP. Already art-only in Academy (`card-art.json`), not in `CARDS`. |
| MAMS-EN039 | Funny Dark Rabbit (45536531) | new | Pegasus | **engine** | Treated as Toon while Toon World is on the field; an extra Normal Summon; "take" a Toon Field/Continuous Spell (add *or* place it) — a choice of destination. |
| MAMS-EN040 | Animimicat (72921536) | new | Pegasus | **engine** | Quick Effect in the Main Phase; Tribute cost (of either side's monster); "mentions Toon World" filter; ignoring Summoning conditions. |
| MAMS-EN041 | Evil Box (8915275) | new | Pegasus | **engine** | Condition "you control Toon World"; add *or* Set a Toon Trap; Quick Effect that targets a card in either GY. |
| MAMS-EN042 | Dark-Eyes Illusionist Faceless Mage (34314989) | new | Pegasus | **engine** | Modal discard effect; "place face-up" a Continuous Trap; "add from GY then Special Summon"; battle indestructibility for both monsters. |
| MAMS-EN044 | Perfect Toon World (7293697) | new | Pegasus | **engine** | Field Spell whose name becomes "Toon World"; ignition from the Field Zone ("thrice per turn"); "mentions" filter; banish-during-resolution. |
| MAMS-EN045 | Mind Scan (34298391) | new | Pegasus | **engine** | Revealed hand, declared card name, continuous negation. |
| MAMS-EN102 | Toon Table of Contents (89997728) | reprint | Pegasus | **already in Academy** as data (`cards.ts:682`); TCG Limited (`card-art.ts`). | — |
| MAMS-EN104 | Toon Bookmark (91500017) | reprint, TCG Limited | Pegasus | **engine** | "Specifically lists Toon World" filter; destruction replacement from the GY. |
| MAMS-EN069-072, 076, 121 | Toon Barrel Dragon, Toon Buster Blader, Red-Eyes Toon Dragon, Toon Dark Magician, Toon Black Luster Soldier, Toon Dark Magician Girl | reprints | Pegasus | **engine** | Toon World status ("Step 5" in `meta-archetypes-coverage.md` §2). |
| MAMS-EN007 | Crimson Dragon Quetzalcoatl (29053656) | new | Yusei | **engine** | ATK from other Synchros; mass revival + lock; Quick negation by returning a Synchro to the Extra Deck. |
| MAMS-EN008 | Red Nova Dragon - Burning Soul (65541655) | new | (Jack, not a trainer) | **engine** | "2 Tuners + 1 non-Tuner"; alternative procedure; once per Duel. |
| MAMS-EN009 | Red Dragon Archfiend's Chains (92936364) | new | (Jack) | **engine** | Reveal-based Continuous Trap. |
| MAMS-EN060 | Neo the Magic Swordsman (50930991) | reprint | (Yugi era) | **data** (Normal Monster) | — (not used below: no deck needs a Level 4 LIGHT Spellcaster Normal). |
| MAMS-EN053-059, 073, 100, 124-125 | Unchained cards | new/reprint | Bakura (proxy, §4.6) | **engine** | Triggers on destruction, Link-based procedures, locks. |

Exact text of the Kaiba and new Pegasus cards (YGOPRODeck):

- **Blue-Eyes White Dragon, the White Phantom Beast** — Effect Monster, Dragon/LIGHT, Level 8, 3000/2500. "When this
  card is added from the Deck to your hand, or a monster you control is destroyed by battle: You can reveal this card in
  your hand; Special Summon it. If this card is Special Summoned from the hand or Deck: You can destroy all monsters
  your opponent controls, also you can only attack directly with "Blue-Eyes" monsters for the rest of this turn. You
  can only use each of the preceding effects of "Blue-Eyes White Dragon, the White Phantom Beast" once per turn. When a
  card or effect is activated that targets this card on the field (Quick Effect): You can discard 1 card; negate that
  effect."
- **Deep-Eyes White Dragon, the Blue Abyss** — Effect Monster, Dragon/LIGHT, Level 10, 0/0. "(This card is always
  treated as a "Blue-Eyes" card.) You can discard this card; add 1 Level 1 LIGHT Tuner from your Deck to your hand. If a
  "Blue-Eyes" Ritual Monster(s) and/or "Blue-Eyes White Dragon" is sent to your GY (except during the Damage Step): You
  can target 1 of them; Special Summon this card from your GY (if it was there when the monster was sent) or hand (even
  if not), and if you do, its ATK becomes that monster's, also banish it when it leaves the field. You can only use each
  effect of "Deep-Eyes White Dragon, the Blue Abyss" once per turn."
  *Effect 1 alone would be* `{ when: "ignition", from: "hand", cost: "discard-self", once: "name", actions: [{ do: "search", filter: { level: 1, attribute: "LIGHT", tuner: true } }] }`.
- **The Guiding Flute of Summoning Dragons** — Normal Spell. "If a Spellcaster monster is on the field: Special Summon
  1 Level 5 or higher Dragon monster from your Deck, then if your opponent controls 2 or more monsters, you can Special
  Summon 1 monster from your Deck with the same name as the Summoned monster, also you cannot Special Summon for the
  rest of this turn, except Dragon or Spellcaster monsters. During your Main Phase 2, if this card is in your GY because
  it was sent there this turn: You can banish it; draw 1 card. You can only use each effect of "The Guiding Flute of
  Summoning Dragons" once per turn."
- **Blue-Eyes Toon Ultimate Dragon** — Toon Monster (Extra Deck), Dragon/LIGHT, Level 12, 4500/3800. ""Blue-Eyes Toon
  Dragon" + 2 Toon monsters / Must be Special Summoned (from your Extra Deck) by shuffling the above cards from your
  hand, field, and/or GY into the Deck/Extra Deck. Your Toon monsters can attack directly. Once per turn, during your
  Main Phase: You can add 1 "Toon" card, or 1 card that mentions a "Toon" card by name, from your GY to your hand. If
  your Toon monster is attacked, during damage calculation: You can banish it until the end of the Damage Step."
- **Kaibaman the Legend** — Tuner, Warrior/LIGHT, Level 1, 200/700. "If this card is Normal or Special Summoned: You
  can show 3 "Blue-Eyes White Dragon" in your hand, Deck, face-up field, and/or GY, then Special Summon 1 "Blue-Eyes
  White Dragon" from your hand, Deck, or GY. If you Special Summon "Blue-Eyes White Dragon" while this card is in your
  GY (except during the Damage Step): You can banish this card; add 1 "Blue-Eyes" monster from your Deck to your hand.
  You can only use each effect of "Kaibaman the Legend" once per turn."
- **Funny Dark Rabbit** — Effect, Beast/DARK, Level 4, 1100/1500. "This card is treated as a Toon monster while "Toon
  World" is on the field. After you Normal or Special Summon this card, you can Normal Summon 1 monster that mentions
  "Toon World" during your Main Phase this turn, in addition to your Normal Summon/Set (you can only gain this effect
  once per turn). Once per turn, during your Main Phase: You can take 1 "Toon" Field or Continuous Spell from your Deck
  and either add it to your hand or place it face-up on your field."
- **Animimicat** — Effect, Beast/DARK, Level 1, 0/0. "This card is treated as a Toon monster while "Toon World" is on
  the field. During the Main Phase (Quick Effect): You can Tribute 1 monster (if you control "Toon World", you can
  Tribute 1 monster your opponent controls instead), and if you do, Special Summon 1 monster that mentions "Toon World"
  from your hand or Deck, ignoring its Summoning conditions. You can only use this effect of "Animimicat" once per
  turn."
- **Evil Box** — Effect, Fiend/DARK, Level 6, 2300/2000. "This card is treated as a Toon monster while "Toon World" is
  on the field. If this card is in your hand and you control "Toon World": You can Special Summon this card, then you can
  add to your hand or Set 1 "Toon" Trap from your Deck. You can only use this effect of "Evil Box" once per turn. Once
  per turn (Quick Effect): You can target 1 card in either GY; place it on the bottom of the Deck."
- **Dark-Eyes Illusionist Faceless Mage** — Effect, Illusion/DARK, Level 4, 0/0. "If this card battles a monster,
  neither can be destroyed by that battle. You can discard this card, then activate 1 of these effects (but you can
  only use each effect of "Dark-Eyes Illusionist Faceless Mage" once per turn); ● Place 1 "Mind Scan" from your hand or
  Deck, face-up on your field. ● Add 1 other monster that mentions "Toon World" from your GY to your hand, then you can
  Special Summon it, ignoring its Summoning conditions."
- **Perfect Toon World** — Field Spell. "This card's name becomes "Toon World" while in the Field Zone. Once per turn,
  during your Main Phase: You can add 1 "Toon" card, or 1 card that mentions a "Toon" card by name, from your Deck to
  your hand. You can only use this effect of "Perfect Toon World" thrice per turn. If another card's effect activates,
  at the start of its resolution, you can banish 1 Toon monster you control until immediately after that effect
  resolves (each unique original monster name can only be banished once per turn, by you, by this effect of "Perfect
  Toon World")."
- **Mind Scan** — Continuous Trap. "While you have a "Toon" card in your field or GY, your opponent must keep their hand
  revealed, also you can look at their Set cards at any time. If you have a Toon monster and a "Toon" Spell in your
  field and/or GY: You can declare 1 card name (you cannot declare a name whose effect has been activated in a current
  Chain); until the end of this turn while this card is face-up, negate the activated effects of cards with that
  original name. You can only use this effect of "Mind Scan" once per turn."

The two Primite Blue-Eyes lists already play White Phantom Beast (1 copy) and Deep-Eyes (3 copies) (§4.12), so these
MAMS cards are part of today's Blue-Eyes meta, not only collector reprints.

## 2. What "can be added as data now" means here

A card counts as **data now** only if every sentence of its text is one of these, with nothing left over:

- **Monster effects** (`DataEffect`, `cards.ts:164-182`): an ignition effect in its owner's Main Phase from the field,
  hand or GY; or a trigger right after *this card* is Summoned (Normal and/or Special — **not Flip**: the engine scans
  only `summoned` and `special` events, `engine.ts:868`) or sent to the GY (`engine.ts:877`). Optional ("You can") or
  not. Costs: only "discard this card" and "banish this card from your GY" (`engine.ts:829-841`). Once per turn: by
  name, shared across the card's effects, or per copy.
- **Actions** (`cards.ts:152-162`): add from Deck to hand; Special Summon from hand/Deck/GY (in Attack Position,
  `engine.ts:933-944`); send from Deck to GY; target one of *your own* monsters and send it to the GY; draw. One chosen
  card and one target per effect; a step that does nothing stops the next ("and if you do").
- **Filters** (`cards.ts:127-145`, `effects.ts:14-32`): exact card, name contains (archetype), kind, Spell/Trap icon,
  exact Level, Level N or lower, Attribute, Tuner, Effect Monster, Normal Monster, "except". **No Monster Type
  (race), no "Level N or higher", no ATK/DEF, no "mentions".**
- **Spells as data** (`cards.ts:124`, `engine.ts:1554-1558`): a Normal Spell (or a Quick-Play used on its own turn) with
  those actions, an optional cost from `Cost` (`cards.ts:373-384`) and "You can only activate 1 per turn". **A Trap
  written as data cannot be activated**: Traps only answer an attack, a Spell or a Summon from a fixed list
  (`TRAP_ANSWERS`, `engine.ts:536`), so "free-chain" Traps such as Red-Eyes Spirit or Stardust Flash are not data.
- **Normal Monsters** and **Extra Deck monsters with no effect** are data: one `real(...)` line plus a
  `card-art.json` entry. The engine Summons a Fusion from named or described materials with Polymerization
  (`cards.ts:296-298`), a Synchro from exactly one Tuner plus non-Tuners whose Levels add up (optionally a named Tuner
  or a non-Tuner name prefix, `engine.ts:1867-1876`), an Xyz from N monsters of one Level (`engine.ts:1877-1879`), a
  Link from a material count with Link Ratings counting as 1 or their rating (`engine.ts:1880-1888`, `:570-578`).

What this leaves out, and why almost no meta card fits: Quick Effects of data monsters, hand traps written as data,
"destroy" or "banish" as actions, cards on the opponent's side as targets, add from GY, Type filters, summon
procedures ("Special Summon this card by…"), "for the rest of this turn" locks written as data, Fusion by card effect,
material filters on Fusion/Synchro/Xyz monsters ("2 Tuners", "1 EARTH Tuner"), and effects of Extra Deck monsters
other than the hand-written ones already in `cards.ts`.

**The Extra Deck toolbox (ours).** A screening of all 14 684 cards of the YGOPRODeck API (every card whose text is
only material lines, or only sentences of the shapes above, then read by hand) found that the generic Extra Deck
monsters the engine can Summon exactly are few:

| Card | Frame | Recipe as printed | In Academy |
| --- | --- | --- | --- |
| Gaia Knight, the Force of Earth | Synchro 6 | 1 Tuner + 1 or more non-Tuner monsters | yes (`cards.ts:473`) |
| **Scrap Archfiend** (45815891) | Synchro 7 | 1 Tuner + 1 or more non-Tuner monsters | **no — add** |
| Gem-Knight Pearl | Xyz R4 | 2 Level 4 monsters | yes (`cards.ts:474`) |
| Number 39: Utopia | Xyz R4 | 2 Level 4 monsters (+ hand-written detach) | yes (`cards.ts:475`) |
| **Gagagigo the Risen** (9053187) | Xyz R4 | 3 Level 4 monsters | **no — add** |
| Gaia Dragon, the Thunder Charger | Xyz R7 | 2 Level 7 monsters (its Rank 5/6 procedure left out) | yes (`cards.ts:633`) |
| LANphorhynchus | Link-2 | 2 monsters | yes (`cards.ts:476`) |
| Gaia Saber, the Lightning Shadow | Link-3 | 2+ monsters | yes (`cards.ts:672`) |
| **Traffic Ghost** (41248270) | Link-3 | 3 monsters; arrows Bottom-Left, Bottom, Bottom-Right | **no — add** |
| Link Spider | Link-1 | 1 Normal Monster (+ data effect) | yes (`cards.ts:673`) |

Naturia Leodrake ("1 EARTH Tuner + 1 or more non-Tuner EARTH monsters"), Sea Monster of Theseus ("2 Tuners"), Road
Warrior (Type filter in its effect) and Berserker of the Tenyi ("including a Link Monster") were rejected: their
material or effect needs a filter the engine does not have. These generic monsters are what turns a 5-card Extra Deck
into 15 without breaking the rule; they are not anime cards, so the owner's "non-anime filler OK" covers them.

## 3. Archetype per character, and the meta list used

Lists are YGOPRODeck "Tournament Meta Decks" (TCG), found with the deck search the site's own page uses
(`https://ygoprodeck.com/api/decks/getDecks.php?name=<archetype>&_sft_category=Tournament%20Meta%20Decks`). "Listed"
is the relative age YGOPRODeck showed on 2026-11-23. Counts are unique Main+Extra cards; "in Academy" means in `CARDS`
(Stardust Dragon is only in `card-art.json`, not playable).

| Trainer | Archetype today **(ours, where no character deck exists)** | Meta list used (event, placement, listed) | Unique cards | In Academy |
| --- | --- | --- | ---: | ---: |
| Seto Kaiba | Blue-Eyes (Primite Blue-Eyes; MAMS) | [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-745513) — Spanish Fork WCQ Regional (2026-11-14), Top 4; 1 week | 34 | 8 |
| Atem (Yami Yugi) | Dark Magician + Dark Magical Curtain (Dark Magician Light and Darkness Ritual) | [Dark Magician L&D Ritual](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-739201) — Santiago WCQ Regional, **Winner**; 1 month. Also [741304](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741304) (Medellin, Runner-Up) and [741086](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741086) (Santo Domingo, Runner-Up) | 38 | 6 |
| Arkana | Dark Magician (same family; Arkana's anime "Dark Magic Curtain") | [741304](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741304) — Medellin WCQ Regional, Runner-Up; 4 weeks | 37 | 5 |
| Yugi Muto | Magnet Warriors (Yugi's Alpha/Beta/Gamma; Magna Warriors) | [Adamancipator Magnet Warrior](https://ygoprodeck.com/deck/adamancipator-magnet-warrior-745240) — Weston-Super-Mare WCQ Regional, Runner-Up; 2 weeks. Pure: [Magnet Warrior](https://ygoprodeck.com/deck/magnet-warrior-725120) — San Fernando WCQ, Top 8; 3 months | 35 | 0 |
| Joey Wheeler | Dark Time Wizard series (Time Wizard, Red-Eyes) | [K9 Dark Time Wizard](https://ygoprodeck.com/deck/k9-dark-time-wizard-743935) — Brasilia WCQ Regional (2026-11-08), Runner-Up; 2 weeks | 35 | 6 |
| Maximillion Pegasus | Toon (post-MAMS) | [Toon](https://ygoprodeck.com/deck/toon-745046) — The Side Deck Remote Duel WCQ Regional (2026-11-15), **Winner**; 1 week | 36 | 7 |
| Jaden Yuki | HERO (only Destiny HERO tops; no Elemental HERO list in the category) | [Destiny HERO](https://ygoprodeck.com/deck/destiny-hero-745166) — Honolulu WCQ Regional (2026-11-07), **Winner**; 2 weeks | 39 | 7 |
| Yusei Fudo | Synchron / Junk / Stardust | [Synchron](https://ygoprodeck.com/deck/synchron-744497) — Christchurch WCQ Regional, Top 4; 2 weeks | 44 | 6 (+ Stardust Dragon art only) |
| Mako Tsunami | Water / Fish (Atlantean Mermail) **(ours)** | [Atlantean Mermail](https://ygoprodeck.com/deck/atlantean-mermail-742132) — Bremen WCQ Regional, **Winner**; 3 weeks | 37 | 2 |
| Rex Raptor | Dinosaurs **(ours)**; no topping Dinosaur list in the last 6 months | [Ryu-Ge Dinosaurs](https://ygoprodeck.com/deck/ryu-ge-dinosaurs-704104) — Exeter WCQ Regional, Top 8; 7 months | 41 | 3 |
| Weevil Underwood | Insects **(ours)**; no topping Insect list in years | [Enforcer Beetrooper](https://ygoprodeck.com/deck/enforcer-beetrooper-278295) — Liège WCQ Regional, Top 8; 4 years | 32 | 3 |
| Yami Bakura | DARK Fiends **(ours)**; no Necrofear/Destiny Board deck tops; Unchained got MAMS support | [Unchained](https://ygoprodeck.com/deck/unchained-745829) — Hoorn WCQ Regional, Top 4; 1 day | 32 | 3 |
| Yami Marik | Fiend bosses **(ours)**; no Ra list tops | [Sacred Beasts](https://ygoprodeck.com/deck/sacred-beasts-745516) — Bonn WCQ Regional, **Winner**; 1 week | 31 | 5 |

Every card of these 15 lists, with copies and either **[Academy]** or the mechanism codes it lacks, is in
[Appendix A](#appendix-a-the-meta-lists-card-by-card). Apart from cards already in Academy, the screening found no card
of these lists that is data now (§2) except Frostosaurus (a Normal Monster); the closest are Deep Sea Diva and Fossil
Dig (Type filter) and Deep-Eyes (§1.2).

## 4. Proposed trainer decks (ours)

Each list is checked: 40 Main, 15 Extra, ≤ 3 copies, the TCG list in `card-art.ts` (Droll & Lock Bird, Monster
Reborn, One for One, Foolish Burial, Reinforcement of the Army, Toon Table of Contents, Harpie's Feather Duster are
Limited and appear once). Cards to add are in **bold** and in §6. Extra Deck recipes name the deck cards that make each
monster Summonable. Copies are `card ×n`.

"Meta left out" = unique Main+Extra cards of the meta list that the proposal does not play; all of them need engine
work, except the few already in Academy that a basic or anime-faithful deck does not use (named).

### 4.1 Seto Kaiba — Blue-Eyes (expert)

- **Main (40):** Blue-Eyes White Dragon ×3, Blue-Eyes Alternative White Dragon ×2, Sage with Eyes of Blue ×3, The
  White Stone of Legend ×3, **Protector with Eyes of Blue ×2**, Effect Veiler ×3, Ash Blossom & Joyous Spring ×3, Ghost
  Ogre & Snow Rabbit ×3, Droll & Lock Bird ×1; Polymerization ×2, Trade-In ×2, Silver's Cry ×1, Burst Stream of
  Destruction ×1, Monster Reborn ×1, One for One ×1, Foolish Burial ×1, Enemy Controller ×2, Ancient Rules ×1;
  Infinite Impermanence ×3, Solemn Strike ×1, Mirror Force ×1.
- **Extra (15):** Blue-Eyes Spirit Dragon ×3 (L1 Tuner Sage/White Stone/Protector/Veiler + BEWD or Alternative),
  Blue-Eyes Twin Burst Dragon ×3 and Blue-Eyes Ultimate Dragon ×3 (Polymerization), Gaia Saber ×2, LANphorhynchus ×2,
  **Traffic Ghost ×2**.
- **From the meta list:** Sage ×3, BEWD, Effect Veiler ×3, Ash ×3, Ghost Ogre ×3, Droll, Infinite Impermanence (2→3),
  Blue-Eyes Spirit Dragon ×3. **Left out: 26** — Maiden of White, Deep-Eyes, White Phantom Beast, Primite Dragon Ether
  Beryl, Primite Lordly Lode, Primite Drillbeam, Wishes for Eyes of Blue, Bingo Machine Go!!!, Roar of the Blue-Eyed
  Dragons, Mausoleum of White, True Light, Majesty of the White Dragons, Dominus Purge, Bystial Magnamhut, Mulcharmy
  Fuwalos, Pot of Prosperity; Extra: Spirit with Eyes of Blue, Blue-Eyes Ultimate Spirit Dragon, Neo Blue-Eyes Ultimate
  Dragon, Blue-Eyes Tyrant Dragon, Psychic End Punisher, Lightstorm Dragon, Ancient Fairy Life Dragon, Black Rose
  Moonlight Dragon, Hieratic Seal of the Heavenly Spheres, S:P Little Knight. Why: hand/GY triggers on other events,
  Rituals, Fusion by effect, Type filters, Quick Effects of Synchros/Links (`meta-archetypes-coverage.md` §6).
- **Versus today** (`master-decks.ts:70-74`): Vorse Raider, La Jinn, X-Head Cannon, Luster Dragon #2, Shrink and the
  older filler leave for the modern Blue-Eyes engine and hand traps; Extra 6 → 15. The anime touch stays (Ultimate,
  Twin Burst, Burst Stream, Silver's Cry, Enemy Controller). The `packs/blue-eyes` deck (`packs/blue-eyes/pack.ts`)
  is close; this one keeps Kaiba's anime Spells.

### 4.2 Atem (Yami Yugi) — Dark Magician with Dark Magical Curtain (expert)

- **Main (40):** Dark Magician ×3, Dark Magician Girl ×2, Curse of Dragon ×1, Gaia the Fierce Knight ×1, Summoned
  Skull ×2, Kuriboh ×1, Buster Blader ×1, Black Luster Soldier ×1, Magician's Rod ×3, Ash ×3, Ghost Ogre ×3, Droll ×1;
  Black Luster Ritual ×1, Dark Magical Curtain ×3, Monster Reborn ×1, Swords of Revealing Light ×1, Dark Hole ×1,
  Polymerization ×2, Thousand Knives ×1, Dark Magic Attack ×1; Mirror Force ×2, Magic Cylinder ×2, Infinite
  Impermanence ×2, Solemn Strike ×1.
- **Extra (15):** Dark Paladin ×2 (DM + Buster Blader), Dark Magician the Dragon Knight ×1 (DM + Curse of Dragon),
  Dark Magician Girl the Dragon Knight ×1 (DMG + Curse of Dragon), Gaia the Dragon Champion ×1, Gaia Dragon the Thunder
  Charger ×2 (2 DM), Gaia Knight ×1 (Ash or Ghost Ogre + Magician's Rod), **Scrap Archfiend ×1** (Ash + Rod + Kuriboh),
  LANphorhynchus ×2, Gaia Saber ×2, **Traffic Ghost ×1**, Link Spider ×1 (DM as its Normal material).
- **From the meta list (739201):** Dark Magician, Dark Magical Curtain ×3, Magician's Rod ×3, Ash ×3, Ghost Ogre ×3,
  Droll. **Left out: 32** (Light and Darkness Ritual and its two Ritual Monsters, Black Chaos, Illusion of Chaos,
  Skull Archfiend of Chaos, Griffoh, Kuriboh - Multiply!, Dark Magician the Pharaoh's Servant, Ragged Records of Rites,
  The Gaze of Timaeus, Dominus Impulse, Mind Shuffle, the Link/Fusion Extra Deck…): Rituals with GY banish, Fusion by
  effect, Quick Effects from the hand, locks (`meta-archetypes-coverage.md` §3).
- **Versus today** (`master-decks.ts:75-79`): Curtain 2 → 3 (meta count), Rod 3 kept, Ghost Ogre in, Sage's Stone,
  Dark Burning Attack, Valkyria, Book of Moon, Veiler, Bottomless, Torrential, Harpie's Feather Duster, Upstart out;
  Extra 5 → 15.

### 4.3 Arkana — Dark Magician (medium)

- **Main (40):** Dark Magician ×3, Magician's Rod ×3, Magician's Valkyria ×2, Lady of Faith (`night-bat`) ×2, Buster
  Blader ×1, Ash ×3, Ghost Ogre ×3, Effect Veiler ×2, Droll ×1; Dark Magic Curtain ×3, Dark Magical Curtain ×3,
  Thousand Knives ×2, Monster Reborn ×1, Polymerization ×2, Dark Magic Attack ×1, Book of Moon ×1, Swords of Revealing
  Light ×1, Dark Hole ×1; Infinite Impermanence ×2, Mirror Force ×1, Solemn Strike ×1, Torrential Tribute ×1.
- **Extra (15):** Dark Paladin ×2, Gaia Dragon the Thunder Charger ×2, Gaia Knight ×2 (Ash + Rod), **Scrap Archfiend
  ×2** (Ghost Ogre + Valkyria), Gem-Knight Pearl ×1 and Utopia ×1 (2 Valkyria), LANphorhynchus ×2, Gaia Saber ×2,
  **Traffic Ghost ×1**.
- **From the meta list (741304):** Dark Magician, Dark Magical Curtain ×3, Ash ×3, Ghost Ogre, Droll. **Left out: 32**,
  same reasons as Atem.
- **Versus today** (`master-decks.ts:35-39`): the anime core (DM, Dark Magic Curtain, Thousand Knives) stays; the
  Normal-Monster filler (Faceless Mage, Mystical Elf, Saggi, equips, Spark Dash, Thunder Clap) gives way to Rod and hand
  traps; Extra 0 → 15.

### 4.4 Yugi Muto — Magnet Warriors and Dark Magician (strong)

- **Main (40):** as today (`master-decks.ts:50-54`): Dark Magician ×2, Dark Magician Girl ×2, Alpha/Beta/Gamma the
  Magnet Warrior ×2 each, Curse of Dragon ×2, Queen's Knight ×3, Summoned Skull ×2, Buster Blader, Obnoxious Celtic
  Guard, Gaia the Fierce Knight, Kuriboh, Black Luster Soldier + Ritual, Magician's Valkyria, Magician's Rod ×2, Ash,
  Effect Veiler; Swords, Thousand Knives, Monster Reborn, Polymerization ×2, Upstart Goblin, Sage's Stone, Dark Magical
  Curtain ×2, Dark Magic Attack, Dark Burning Attack; Bottomless Trap Hole.
- **Extra (15):** Gaia the Dragon Champion ×2, Dark Paladin ×1, DM the Dragon Knight ×1, DMG the Dragon Knight ×1,
  Gem-Knight Pearl ×2 and Utopia ×1 (Magnet Warriors, Queen's Knight), **Gagagigo the Risen ×1** (3 Magnet Warriors),
  Gaia Dragon the Thunder Charger ×1, Gaia Knight ×1 (Ash + Rod), **Scrap Archfiend ×1** (Ash + a Magnet Warrior),
  Link Spider ×1, Gaia Saber ×1, LANphorhynchus ×1.
- **Meta left out: all 35** of the Adamancipator Magnet Warrior list (Academy has none of them). Today's Magnet cards
  need: Quick Effects on the opponent's turn with a "Tribute this card" cost (Alpha/Beta/Gamma the *Electro*magnet
  Warrior, Omega Plus, Tellusion), summon procedures (Linear Magnum ±, Tellusion, Valkyrion, Berserkion), a modal
  Spell with Fusion by shuffling (Magnet Bonding), "and if you do / also" locks (Magnet Induction), "add or Special
  Summon" from GY (Sigma Plus), name copying (Epsilon). Beta the *Electro*magnet Warrior's first effect is pure data
  (search a Level 4 or lower "Magnet Warrior"), but its Quick Effect is not, so it stays out.

### 4.5 Joey Wheeler — Time Wizard / Dark Time Wizard, Red-Eyes (medium)

- **Main (40):** the anime cards of today (`master-decks.ts:31`, 34 cards: Alligator's Sword ×3, Axe Raider ×3, Baby
  Dragon ×3, Garoozis ×2, Red-Eyes ×2, Masaki ×2, Flame Manipulator ×2, Hayabusa Knight ×2, Time Wizard ×2, Rocket
  Warrior ×2, Mad Sword Beast, Jinzo, Lava/Swamp Battleguard, Polymerization ×2, Salamandra, Legendary Sword, Harpie's
  Feather Duster, Raigeki, Monster Reborn) + Dark Time Wizard ×2, Meteor Dragon ×1, Effect Veiler ×2, Infinite
  Impermanence ×1.
- **Extra (15):** Flame Swordsman ×2, Alligator's Sword Dragon ×2, Thousand Dragon ×2, Meteor Black Dragon ×1, Gaia
  Dragon the Thunder Charger ×1 (2 Red-Eyes), Gaia Knight ×1 (Veiler + Garoozis or a Battleguard), **Scrap Archfiend
  ×1** (Veiler + Jinzo), Gem-Knight Pearl ×1, Utopia ×1, Link Spider ×1, Gaia Saber ×1, LANphorhynchus ×1.
- **From the meta list:** Dark Time Wizard (2 of 3; coin mode only, `cards.ts:649`), Effect Veiler, Infinite
  Impermanence. **Left out: 32** — the whole Dark Time Wizard series (Alligator's Dragon Knight, Swiftwind Panther
  Warrior, Fisherman of Legend, Sleepy Scapegoats, Graceful & Skull Dice, Foolish Graverobber, Red-Eyes Black Dragon
  Exceed), the K9 engine, Nibiru, Phantom Knights, Xyz Extra Deck; plus Ash, Ghost Ogre and Droll, which are in Academy
  but left for Joey's anime slots. Why: `meta-archetypes-coverage.md` §5 (reveal procedures, "mentions" filter,
  Tokens, dice, Fusion procedures).
- **Versus today**: Inferno Fire Blast, Trap Hole and Swift Scarecrow make room for Veiler ×2 (which also opens
  Synchros) and Impermanence; Extra 7 → 15.

### 4.6 Yami Bakura — Fiends of the occult (medium)

- **Main (40):** the anime cards of today (`master-decks.ts:41`: Headless Knight ×3, Earl of Demise ×3, Doma ×2,
  Earthbound Spirit ×3, Happy Lover, Lady of Faith ×2, Souls of the Forgotten ×3, Gross Ghost ×3, Portrait's Secret ×3,
  Monster Reborn, Just Desserts ×2) + Upstart Goblin, **Lord of the Lamp ×2**, **Invader from Another Dimension ×2**,
  Polymerization ×2, Ryu-Kishin Powered ×1, Widespread Ruin ×2, Book of Moon, Trap Hole ×2, D.D. Crow.
- **Extra (15):** **Soul Hunter ×2** (Lord of the Lamp + Invader), Gem-Knight Pearl ×2, **Gagagigo the Risen ×2**,
  Utopia ×1 (Level 4 Fiends), LANphorhynchus ×2, Gaia Saber ×2, **Traffic Ghost ×2**, Link Spider ×2 (Normal Fiends).
- **Meta left out: 32** (Unchained souls, onis, twins, Abomination's Prison, Reincarnation, the Unchained Links,
  Knightmares…; Ash, Ghost Ogre, Droll unused to keep the anime deck): triggers on destruction, Link procedures, locks.
  No Bakura-themed archetype (Dark Necrofear, Destiny Board) tops today; Unchained is a stand-in for "DARK Fiends with
  MAMS support" **(ours)**.

### 4.7 Maximillion Pegasus — Toon (strong)

- **Main (40):** the anime cards of today (`master-decks.ts:46`, 25 cards) + Toon Table of Contents ×1, Ash ×2, Ghost
  Ogre ×2, Effect Veiler ×2, Droll ×1, Infinite Impermanence ×2, Mirror Force, Magic Cylinder, Upstart Goblin, Book of
  Moon, Forbidden Chalice.
- **Extra (15):** **Scrap Archfiend ×2** (Ash + Red Archery Girl), Gaia Knight ×2 (Veiler + Faceless Mage), Gaia
  Dragon the Thunder Charger ×1 (2 Ryu-Ran), Gem-Knight Pearl ×2, Utopia ×1, **Gagagigo the Risen ×1**,
  LANphorhynchus ×2, Gaia Saber ×2, **Traffic Ghost ×1**, Link Spider ×1.
- **From the meta list:** Ash, Ghost Ogre, Veiler, Droll, Toon Table of Contents (it can only find Toon Alligator,
  the one "Toon" card in Academy), Infinite Impermanence. **Left out: 30** — every Toon card of the list (Funny Dark
  Rabbit, Animimicat, Evil Box, Dark-Eyes Faceless Mage, Perfect Toon World, Toon Bookmark, Toon Terror, Mind Scan),
  Rainbow Bridge Bifrost, Piri Reis Map, Pot of Prosperity, Instant Fusion, Typhoon, Dominus Impulse, the Extra Deck;
  plus Terraforming (no Field Spell to find). Why: the "Toon World" status (`meta-archetypes-coverage.md` §2, Step 5).
- **Versus today**: Storming Mirror Force, Swords, Dark Hole, Bottomless, Torrential, a Forbidden Chalice and a Book
  of Moon leave for the meta hand traps; Extra 0 → 15.

### 4.8 Jaden Yuki — HERO (strong)

- **Main (40):** Elemental HERO Avian ×2, Burstinatrix ×3, Clayman ×2, Sparkman ×3, Neos ×1, Bladedge ×1, Shadow Mist
  ×3, Blazeman ×3, Destiny HERO - Malicious ×2, Ash ×3, Ghost Ogre ×2, Droll ×1; Polymerization ×3, Fusion Sage ×1,
  Monster Reborn ×1, The Warrior Returning Alive ×1, E - Emergency Call ×2, Reinforcement of the Army ×1, A Hero Lives
  ×1, Foolish Burial ×1 (sends Shadow Mist or Malicious); HERO Barrier ×1, Infinite Impermanence ×2.
- **Extra (15):** Flame Wingman ×2, Shining Flare Wingman ×1, Thunder Giant ×2, Rampart Blaster ×1, Great Tornado ×1,
  Nova Master ×1, Gaia ×1, Gem-Knight Pearl ×1, Utopia ×1, **Gagagigo the Risen ×1**, **Scrap Archfiend ×1** (Ash +
  Sparkman), Gaia Knight ×1 (Ash + Avian), Gaia Saber ×1.
- **From the meta list:** Destiny HERO - Malicious ×2, Polymerization, Reinforcement, Ash ×3, Ghost Ogre ×2, Droll.
  **Left out: 33** — Doom Overlord, Dark City at Midnight, Fusion Destiny, every other Destiny HERO, Masked HEROes,
  Mask Change, Sabatiel, Dominus Impulse, the D-HERO Fusions and Xtra HERO Links; plus Terraforming (no Field Spell).
  Why: `meta-archetypes-coverage.md` §4.
- **Versus today** (`master-decks.ts:55-59`): Shadow Mist, Malicious, more Blazeman and the meta hand traps replace
  Sticky Vine, one HERO Barrier, Chalice, Smashing Ground, Storming Mirror Force, Dark Hole; Extra 10 → 15. The
  `packs/hero` deck is the "meta-lite" sibling.

### 4.9 Yusei Fudo — Synchron (strong)

- **Main (40):** Junk Synchron ×3, Flamvell Guard ×3, Unicycular ×3, Sonic Chick ×3, Shield Wing ×2, Fortress Warrior
  ×2, Dash Warrior ×2, Tri-Horned Dragon ×1, Tune Warrior ×3, Giant Soldier of Stone ×3, Ash ×3, Ghost Ogre ×2, Effect
  Veiler ×2, Droll ×1; Monster Reborn ×1, Reinforcement of the Army ×1, Book of Moon ×1; Infinite Impermanence ×2,
  Negate Attack ×1, Swift Scarecrow (monster) ×1.
- **Extra (15):** Junk Warrior ×3 (Junk Synchron + Level 2s), Gaia Knight ×3 (Junk Synchron + Dash Warrior),
  **Scrap Archfiend ×3** (Junk Synchron + Giant Soldier + Unicycular, or Ash + Tune Warrior's partners), LANphorhynchus
  ×2, Gaia Saber ×2, **Traffic Ghost ×1**, Link Spider ×1.
- **From the meta list:** Junk Synchron, Reinforcement, Ash ×3, Ghost Ogre ×2, Droll. **Left out: 39** — Stardust
  Synchron, Junk Meister, Scrap/Assault/Jet/Starjunk/Revolution/Wheel Synchron, Junk Armor, Full-Speed Warrior,
  Stardust Trail, Junk Signal, Synchro Fellowship/Rumble/Overtake, Stardust Illumination, Assault Zone, Forbidden
  Droplet, Triple Tactics Thrust, Heavy Slump, Nibiru, Ghost Belle, Terraforming, and the whole Synchro Extra Deck
  (Stardust Dragon and its forms, Red Supernova/Hypernova, Crimson Dragon, Cosmic Blazar, Junk Speeder, Jet Warrior,
  Scrap Warrior…). Why: Synchro Summons by card effect, effects of Synchro Monsters (Quick negations, "when Synchro
  Summoned"), Type filters, GY revival targets.
- **Versus today** (`master-decks.ts:60-64`): Spark Dash, Sticky Vine, Smashing Ground, Upstart, Bottomless out for
  hand traps; Extra 5 → 15.

### 4.10 Mako Tsunami — sea monsters (basic)

- **Main (40):** the anime cards of today (`master-decks.ts:26`, 25 cards) + 7 Colored Fish ×3, Giant Red Seasnake ×2,
  Crazy Fish ×1, **Tongyo ×2**, Bottom Dweller ×2, Polymerization ×2, Raigeki ×1, Trap Hole ×1, Torrential Tribute ×1.
- **Extra (15):** **Deepsea Shark ×3** (Bottom Dweller + Tongyo), **Gagagigo the Risen ×3** (a WATER Reptile; 3 Level
  4 sea monsters), Gem-Knight Pearl ×2, Utopia ×1, LANphorhynchus ×2, Gaia Saber ×2, Link Spider ×1, **Traffic Ghost
  ×1**.
- **Meta left out: all 37** of Atlantean Mermail (Atlanteans, Mermails, Deep Sea Diva/Minstrel, Tidal, Coelacanth,
  Water Synchros/Xyz/Links; Ash and Droll unused at the basic tier). Why: discard-as-cost triggers ("if sent to the GY
  to activate a WATER monster's effect"), Type filters (Deep Sea Diva: "1 Level 3 or lower Sea Serpent"), Quick Effects.

### 4.11 Rex Raptor — Dinosaurs and dragons (basic)

- **Main (40):** the anime cards of today (`master-decks.ts:16`, 25 cards) + Fairy Dragon ×3, **Winged Dragon,
  Guardian of the Fortress #1 ×3**, **Flame Viper ×2**, **Frostosaurus ×2**, Raise Body Heat ×1, Raigeki ×1, Dark
  Hole ×1, Trap Hole ×2.
- **Extra (15):** Bracchio-raidus ×3, **Kaiser Dragon ×2** (Winged Dragon #1 + Fairy Dragon), **Pragtical ×2**
  (Trakodon + Flame Viper), Gem-Knight Pearl ×2, Utopia ×1, **Gagagigo the Risen ×1**, LANphorhynchus ×1, Gaia Saber
  ×1, **Traffic Ghost ×1**, Link Spider ×1.
- **From the meta list:** Frostosaurus (a Normal Monster, the one card of all 15 lists that is data now and not yet in
  Academy). **Meta left out: 40** of Ryu-Ge Dinosaurs (Ryu-Ge Pendulum/Ritual monsters, Oviraptor, Babycerasaurus,
  Fossil Dig, Double Evolution Pill, Evolzar Xyz…; Ash, Droll, Terraforming unused). Why: Pendulum Rituals, destroy-by-effect
  triggers, Type filters (Fossil Dig, Souleating Oviraptor).

### 4.12 Weevil Underwood — Insects (basic)

- **Main (40):** the anime cards of today (`master-decks.ts:21`, 29 cards) + **Kuwagata α ×2**, Polymerization ×2,
  Giant Flea ×1, Forest ×3, Swords of Revealing Light ×1, Trap Hole ×2.
- **Extra (15):** **Kwagar Hercules ×3** (Kuwagata α + Hercules Beetle), Gem-Knight Pearl ×2, Utopia ×2, **Gagagigo
  the Risen ×1**, LANphorhynchus ×2, Gaia Saber ×2, **Traffic Ghost ×1**, Link Spider ×2.
- **Meta left out: 31** of Enforcer Beetrooper (Beetroopers, Battlewasps, Resonance Insect, Retaliating "C",
  Gokipole…; only Link Spider used). The list is four years old: no Insect deck has topped since **(ours, from the
  search)**. Why: Type filters ("Insect monster"), Tokens, Synchro/Link effects.

### 4.13 Yami Marik — Fiends (expert)

- **Main (40):** Gil Garth ×3, Melchid ×3, Bowganian ×3, Legendary Fiend ×2, Ryu-Kishin Powered ×3, The Earl of
  Demise ×2, Summoned Skull ×2, Ash ×3, Ghost Ogre ×3, Effect Veiler ×3, Droll ×1; Monster Reborn ×1, Upstart Goblin
  ×1, Dark Hole ×1, Raigeki ×1, Book of Moon ×1; Mirror Force ×2, Malevolent Catastrophe ×2, Solemn Strike ×1, Just
  Desserts ×1, Torrential Tribute ×1.
- **Extra (15):** Gaia Knight ×2 (Ash + Bowganian), **Scrap Archfiend ×3** (Ash or Ghost Ogre + Gil Garth), Gem-Knight
  Pearl ×2, Utopia ×1, **Gagagigo the Risen ×1**, LANphorhynchus ×2, Gaia Saber ×2, **Traffic Ghost ×1**, Link Spider
  ×1.
- **From the meta list:** Ash ×3, Ghost Ogre ×3, Effect Veiler ×3, Droll (exactly the Sacred Beasts list's hand
  traps) and Link Spider. **Left out: 26** — the Sacred Beasts and their support (Martyr, Summoner, Released,
  Thunderclap, Fallen Paradise, Combined Assault), The Great Gallant Bandit, Card of the Soul, Lightning Crash, Fuwalos,
  the Fusion/Link Extra Deck. Why: summon procedures, Type filters, locks. Marik's own god, The Winged Dragon of Ra, is
  art-only in Academy (`card-art.json`).
- **Versus today** (`master-decks.ts:65-69`): Widespread Ruin, Storming Mirror Force, Chalice, Bottomless ×2 out;
  Ash 2→3, Veiler 1→3, Ghost Ogre, Solemn Strike in; Extra 0 → 15.

## 5. Proposed starter decks (ours)

The starters keep their legend and Extra Deck (`starters.ts:34-58`); changes are small, toward the same meta cards.

- **warrior (Dark Magician).** Main: today's list with Spark Dash ×1, Trap Hole ×1, Sakuretsu Armor ×1 out and Ghost
  Ogre ×2, Infinite Impermanence ×1 in (Dark Magician ×3, DMG ×2, Rod ×3, Valkyria, Buster Blader ×2, Curse of Dragon,
  Gaia, Summoned Skull, Red-Eyes, Tune Warrior ×2, Ash ×2, Veiler, Ghost Ogre ×2; Polymerization ×3, Dark Magical Curtain
  ×2, Sage's Stone, Dark Magic Attack, Thousand Knives ×2, Monster Reborn, Dark Hole, Swords; Magic Cylinder, Negate
  Attack, Mirror Force, Bottomless, Torrential, Impermanence). Extra (13 → 15): + **Scrap Archfiend ×1** (Ash or Tune
  Warrior + Valkyria) and Gaia Saber ×1.
- **dragon (Blue-Eyes).** Main: Flamvell Guard ×2, Battle Fader, X-Head Cannon, Spark Dash ×2, Thunder Clap out; Sage
  ×3, White Stone of Legend ×2, **Protector with Eyes of Blue ×1**, Ghost Ogre ×1 in. Extra (11 → 15): + **Gagagigo the
  Risen ×1** (3 Vorse Raider/La Jinn), **Scrap Archfiend ×1** (Ash + Vorse Raider), Gaia Saber ×1, **Traffic Ghost ×1**.
- **hero (Elemental HERO).** Main: Book of Moon, Forbidden Chalice, HERO Barrier, Magic Cylinder, Sakuretsu Armor, Trap
  Hole out; Shadow Mist ×3, Ghost Ogre ×2, Effect Veiler +1 in. Extra stays 15, Utopia → **Scrap Archfiend** (Ash +
  Sparkman).

All three pass the same check (40 / 15 / copies / TCG list).

## 6. Cards to add as data

Each needs an entry in `card-art.json` (passcode below), `pnpm --filter academy-ygo cards:art`, a `cards.ts` line, and
names in the three copy files. "Used by" counts trainers + starters of §4-§5.

| Card | Passcode | Kind | Proposed `cards.ts` entry | Used by |
| --- | ---: | --- | --- | ---: |
| **Scrap Archfiend** | 45815891 | Synchro 7, Fiend/EARTH, 2700/1800, no effect | `real("scrap-archfiend")` (frame `synchro` from card-art; generic "1 Tuner + 1 or more non-Tuner") | 11 |
| **Traffic Ghost** | 41248270 | Link-3, Cyberse/DARK, 1800, no effect | `real("traffic-ghost", { link: 3, arrows: ["bottom-left", "bottom", "bottom-right"], linkMaterials: { min: 2, max: 3 } })` — "3 monsters": 3 materials, or 2 with a Link-2 counting as 2 (`engine.ts:570-578`) | 11 |
| **Gagagigo the Risen** | 9053187 | Xyz R4, Reptile/WATER, 2950/2800, no effect | `real("gagagigo-the-risen", { level: 0, rank: 4, xyz: { level: 4, count: 3 } })` | 9 |
| **Protector with Eyes of Blue** | 72855441 | Tuner, Spellcaster/LIGHT, L1, 800/1300 | `real("protector-with-eyes-of-blue", { tuner: true, effects: [ { when: "normal-summoned", optional: true, actions: [{ do: "special", from: ["hand"], filter: { level: 1, attribute: "LIGHT", tuner: true } }] }, { when: "ignition", once: "name", actions: [{ do: "send-target", filter: { effect: true } }, { do: "special", from: ["hand"], filter: { kind: "monster", archetype: "Blue-Eyes" } }] } ] })` — same shape as Sage (`cards.ts:684-690`); "When … Normal Summoned" cannot miss timing here because the Summon is the last thing that happened | 2 |
| **Kwagar Hercules** | 95144193 | Fusion, Insect/EARTH, L6, 1900/1700 | `real("kwagar-hercules", { fusion: ["kuwagata-alpha", "hercules-beetle"] })` | 1 |
| **Kuwagata α** | 60802233 | Normal, Insect/EARTH, L4 | `real("kuwagata-alpha")` | 1 |
| **Deepsea Shark** | 28593363 | Fusion, Fish/WATER, L5, 1900/1600 | `real("deepsea-shark", { fusion: ["bottom-dweller", "tongyo"] })` | 1 |
| **Tongyo** | 69572024 | Normal, Fish/WATER, L4 | `real("tongyo")` | 1 |
| **Kaiser Dragon** | 94566432 | Fusion, Dragon/LIGHT, L7, 2300/2000 | `real("kaiser-dragon", { fusion: ["winged-dragon-guardian-of-the-fortress-1", "fairy-dragon"] })` | 1 |
| **Winged Dragon, Guardian of the Fortress #1** | 87796900 | Normal, Dragon/WIND, L4 | `real("winged-dragon-guardian-of-the-fortress-1")` | 1 |
| **Pragtical** | 33691040 | Fusion, Dinosaur/EARTH, L5, 1900/1500 | `real("pragtical", { fusion: ["trakodon", "flame-viper"] })` | 1 |
| **Flame Viper** | 2830619 | Normal, Pyro/EARTH, L2 | `real("flame-viper")` | 1 |
| **Soul Hunter** | 72869010 | Fusion, Fiend/DARK, L6, 2200/1800 | `real("soul-hunter", { fusion: ["lord-of-the-lamp", "invader-from-another-dimension"] })` | 1 |
| **Lord of the Lamp** | 99510761 | Normal, Fiend/DARK, L4 | `real("lord-of-the-lamp")` | 1 |
| **Invader from Another Dimension** | 28450915 | Normal, Fiend/DARK, L4 | `real("invader-from-another-dimension")` | 1 |
| **Frostosaurus** | 6631034 | Normal, Dinosaur/WATER, L6, 2600/1700 | `real("frostosaurus")` | 1 |

None is on the TCG Forbidden & Limited List (YGOPRODeck `banlist_info`, read 2026-11-23).

**Checked and rejected** (they look like data but are not, strictly): Armageddon Knight ("When this card is
Summoned" includes Flip Summon, which the `summoned` trigger does not see, `engine.ts:868`); Kaibaman ("Tribute this
card" cost); Black Dragon's Chick (cost "send this face-up card to the GY"); Red-Eyes Spirit and Stardust Flash (free
Traps, §2); Dark Magic Veil and Summoner's Art (Type filter / "Level 5 or higher"); Deep Sea Diva, Mermaid Shark, Fossil
Dig, Bonfire, Lightning Crash (Type filter); Beta/Alpha/Gamma the Electromagnet Warrior and Delta the Magnet Warrior
(first effect data, second not); Junk Forward ("if you control no monsters" is not Academy's `special: "alone"`); The
Flute of Summoning Kuriboh ("add *or* Special Summon"); Evil HERO Sinister Necrom (data, but no Evil HERO it could call
is playable).

### The 10 to add first

1. Scrap Archfiend (45815891) — the Level 7 Synchro that 11 decks reach with Ash/Ghost Ogre/Veiler/Junk Synchron.
2. Traffic Ghost (41248270) — a third generic Link for 11 Extra Decks.
3. Gagagigo the Risen (9053187) — the 3-material Rank 4 for 9 decks.
4. Protector with Eyes of Blue (72855441) — the only real Blue-Eyes engine card that is data today (Kaiba, dragon
   starter).
5. Kuwagata α (60802233) and 6. Kwagar Hercules (95144193) — Weevil's first Fusion.
7. Tongyo (69572024) and 8. Deepsea Shark (28593363) — Mako's first Fusion.
9. Winged Dragon, Guardian of the Fortress #1 (87796900) and 10. Kaiser Dragon (94566432) — a second Fusion for Rex.

Then Flame Viper + Pragtical (Rex), Lord of the Lamp + Invader + Soul Hunter (Bakura).

## 7. Small engine additions that would bring real meta cards in (ours)

Ranked by how many cards of §1.2 and Appendix A they finish *alone* or nearly alone; each is a field or a branch in the
existing vocabulary, not a new system.

| Addition | Where | Unlocks (examples) |
| --- | --- | --- |
| `type` (Monster Type) in `CardFilter` | `cards.ts:127`, `effects.ts:14` | Fossil Dig, Deep Sea Diva, Mermaid Shark, Dark Magic Veil, Bonfire; half of Guiding Flute; needed by most Dinosaur/Insect/Fish/Synchron cards |
| `minLevel` in `CardFilter` | same | Summoner's Art; with `type`, Guiding Flute's first Summon |
| Flip Summon in `when: "summoned"` | `engine.ts:868` | Armageddon Knight and every "When this card is Summoned" card |
| Cost `"tribute-self"` / `"send-self"` | `cards.ts:174`, `engine.ts:829-841` | Kaibaman, Black Dragon's Chick, Skilled Dark Magician's last step |
| Quick Effects for data monsters (opponent's turn) | `DataEffect.when`, chain windows | Alpha/Beta/Gamma the Electromagnet Warrior (with tribute-self), Swiftwind Panther Warrior, Fisherman of Legend |
| Free-chain data Traps | `TRAP_ANSWERS` / Trap activation | Red-Eyes Spirit, Stardust Flash, Foolish Graverobber's first half |
| Action `"add-from-gy"` | `Action` | Master with Eyes of Blue, Magician's Rod's GY half, Sigma Plus, Kaibaman's second half |
| Action `"destroy"` (all foe monsters / one target) | `Action` | White Phantom Beast's Summon effect, Jinzo - Energy Shocker |
| Trigger on another card's event (sent to GY, added from Deck) | `afterTriggers`, `engine.ts:862-886` | Deep-Eyes effect 2, White Phantom Beast, Kaibaman effect 2 |

With the first four alone, Kaibaman, Fossil Dig, Deep Sea Diva, Mermaid Shark, Dark Magic Veil and Armageddon Knight
become data; Kaiba's MAMS cards still need the last three rows.

## 8. Unverified

- **Konami's product page for MAMS** was not opened (the yugioh-card.com products page is rendered by script and gave
  no text to a plain fetch). Set name, code, size and date are YGOPRODeck's.
- **124 vs 125 cards**: the set record says 125, the card query returned 124; one card (maybe a variant listed under
  another name) was not identified.
- **Event dates** of lists other than those already dated in `meta-archetypes-coverage.md` are not given by the API;
  the "listed" ages are YGOPRODeck's relative labels on the day of observation.
- **Character → archetype** for Mako, Rex, Weevil, Bakura and Marik is our choice; none of them has a character deck
  in today's meta.
- **Mechanism codes in Appendix A** come from a keyword pass over each card's text (as in
  `meta-archetypes-coverage.md` §11.5) and were not each read by hand; the "data now" verdicts in §1.2, §2 and §6 were
  read by hand.
- **TCG banlist** is YGOPRODeck's `banlist_info` and `card-art.ts`'s copy of it; a list that predates a change (the
  Santiago list plays Droll & Lock Bird ×2, now Limited) was not re-dated.
- **Gameplay**: the proposals were checked for legality and Summonability by recipe, not played; bot strength by tier
  (`masters.ts:55-77`) was not simulated with the new lists.

## Sources

Fetched for this note (2026-11-23).

- YGOPRODeck set list: `https://db.ygoprodeck.com/api/v7/cardsets.php`.
- YGOPRODeck card API: `https://db.ygoprodeck.com/api/v7/cardinfo.php` with `cardset=Magnificent Maestros&misc=yes`,
  `id=<passcodes of the 15 lists>&misc=yes`, and the full card list (no parameter) for the screening; parameters as in
  the [API guide](https://ygoprodeck.com/api-guide/).
- YGOPRODeck deck search: `https://ygoprodeck.com/api/decks/getDecks.php?name=<archetype>&_sft_category=Tournament%20Meta%20Decks`
  for Blue-Eyes, Dark Magician, Magnet, Time Wizard, Toon, HERO, Synchron, Mermail, Ryu-Ge, Dinosaur, Beetrooper,
  Unchained, Sacred Beasts (and empty results for Red-Eyes, Insect, Elemental HERO, Kairyu, Junk, Battlewasp).
- Deck pages: [745513](https://ygoprodeck.com/deck/primite-blue-eyes-745513),
  [739201](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-739201),
  [741304](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741304),
  [741086](https://ygoprodeck.com/deck/dark-magician-light-and-darkness-ritual-741086),
  [745240](https://ygoprodeck.com/deck/adamancipator-magnet-warrior-745240),
  [725120](https://ygoprodeck.com/deck/magnet-warrior-725120),
  [743935](https://ygoprodeck.com/deck/k9-dark-time-wizard-743935),
  [745046](https://ygoprodeck.com/deck/toon-745046),
  [745166](https://ygoprodeck.com/deck/destiny-hero-745166),
  [744497](https://ygoprodeck.com/deck/synchron-744497),
  [742132](https://ygoprodeck.com/deck/atlantean-mermail-742132),
  [704104](https://ygoprodeck.com/deck/ryu-ge-dinosaurs-704104),
  [278295](https://ygoprodeck.com/deck/enforcer-beetrooper-278295),
  [745829](https://ygoprodeck.com/deck/unchained-745829),
  [745516](https://ygoprodeck.com/deck/sacred-beasts-745516).
- This repo: `apps/academy-ygo/src/lib/junior/play/cards.ts`, `effects.ts`, `engine.ts`, `card-art.ts`,
  `card-art.json`, `master-decks.ts`, `starters.ts`, `masters.ts`, `packs/`; `docs/research/meta-archetypes-coverage.md`,
  `docs/research/duel-engine-meta-cards.md`.

## Appendix A: the meta lists, card by card

Copies, the card, its TCG status when restricted, and either **[Academy]** (playable today) or the mechanisms it lacks
(keyword pass, §8). Codes as in `meta-archetypes-coverage.md` §1: CHAIN (Quick Effects, negation, Traps, Quick-Play),
HAND (from the hand on the opponent's turn), TRIG (event triggers), LOCK (turn locks, restrictions, unaffected), GY
(effects from or on the GY), FUS-EFF (Fusion by card effect), RITUAL, PROC (summon procedure), TYPE-FILTER (a Monster
Type in a filter), DESTROY (destruction as an action), TOKEN, DICE/COIN, CONT (Continuous/Field Spell or Trap), SYN,
XYZ, LINK, FUS-MAT, PEND (frames whose own effects or material filters are missing); OTHER: no keyword matched, but the text is not one of the data shapes of §2 either (the screening rejected it).

### Enforcer Beetrooper (deck 278295)
- **Main (42):** 3× Resonance Insect (TRIG TYPE-FILTER); 3× Retaliating "C" (HAND TRIG TYPE-FILTER); 2× Gokipole (TRIG TYPE-FILTER DESTROY); 1× Doom Dozer (TRIG LOCK PROC TYPE-FILTER); 1× Battlewasp - Arbalest the Rapidfire (TRIG GY TYPE-FILTER DESTROY); 3× Battlewasp - Sting the Poison (CHAIN TRIG TYPE-FILTER); 3× Battlewasp - Pin the Bullseye (TRIG TYPE-FILTER); 3× Beetrooper Scale Bomber (CHAIN HAND TRIG TYPE-FILTER DESTROY); 1× Beetrooper Assault Roller (TRIG GY PROC TYPE-FILTER DESTROY); 2× Beetrooper Sting Lancer (CHAIN TRIG GY TYPE-FILTER); 1× Heavy Beetrooper Mighty Neptune (TRIG PROC TYPE-FILTER DESTROY); 2× Beetrooper Descent (TYPE-FILTER DESTROY TOKEN); 1× Destiny HERO - Celestial (TRIG GY DESTROY); 1× Destiny HERO - Dasher (TRIG); 2× Fusion Destiny (TRIG LOCK FUS-EFF DESTROY); 1× Called by the Grave, Forbidden (CHAIN); 3× Triple Tactics Talent, Forbidden (TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 3× Ghost Belle & Haunted Mansion (CHAIN HAND TRIG GY); 3× Infinite Impermanence **[Academy]**.
- **Extra (15):** 1× Inzektor Picofalena (TRIG GY TYPE-FILTER LINK); 2× Beetrooper Armor Horn (TRIG LOCK GY TYPE-FILTER LINK); 2× Seraphim Papillion (CHAIN TRIG GY TYPE-FILTER LINK); 1× Giant Beetrooper Invincible Atlas (LOCK TYPE-FILTER DESTROY LINK); 1× Salamangreat Almiraj (CHAIN LOCK GY DESTROY LINK); 1× Link Spider **[Academy]**; 2× Predaplant Verte Anaconda, Forbidden (CHAIN LOCK LINK); 1× Wynn the Wind Charmer, Verdant (DESTROY LINK); 1× Knightmare Unicorn (TRIG LINK); 1× Accesscode Talker (TRIG LOCK DESTROY LINK); 1× Apollousa, Bow of the Goddess, Forbidden (CHAIN TOKEN LINK); 1× Destiny HERO - Destroyer Phoenix Enforcer (CHAIN TRIG GY DESTROY FUS-MAT).

### Dark Magician Light and Darkness Ritual (deck 741304)
- **Main (41):** 1× Black Luster Soldier - Soldier of Light and Darkness (TRIG LOCK RITUAL DESTROY); 1× Magician of Dark Chaos - Black Chaos (TRIG LOCK GY RITUAL DESTROY); 1× Dark Magician **[Academy]**; 1× Dark Magician, the Pharaoh's Servant (CHAIN TRIG DESTROY); 3× Black Chaos (LOCK GY PROC); 1× Skull Archfiend of Chaos (TRIG); 1× Griffoh, Limited (CHAIN HAND RITUAL); 2× Kuriboh - Multiply! (CHAIN HAND TRIG); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 2× Nibiru, the Primal Being (CHAIN TOKEN); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Ghost Ogre & Snow Rabbit **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 1× Light and Darkness Ritual (TRIG GY RITUAL); 3× Dark Magical Curtain **[Academy]**; 1× Spell Shattering Sword (CHAIN TRIG DESTROY); 1× The Gaze of Timaeus (TRIG FUS-EFF); 3× Ragged Records of Rites (GY); 3× Super Polymerization (FUS-EFF); 3× Pot of Sloth (LOCK); 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY); 1× Mind Shuffle (CHAIN HAND TRIG LOCK CONT).
- **Extra (15):** 1× Dark Magician of Destruction (TRIG TYPE-FILTER FUS-MAT); 1× Master of Chaos (TRIG GY DESTROY FUS-MAT); 1× Starving Venom Fusion Dragon (TRIG DESTROY TOKEN FUS-MAT); 1× Predaplant Dragostapelia (CHAIN FUS-MAT); 1× Mixousia the Confounder (CHAIN HAND TRIG GY TYPE-FILTER FUS-MAT); 1× Elder Entity Norden (CHAIN TRIG FUS-MAT); 1× Garura, Wings of Resonant Life (TRIG FUS-MAT); 1× Mudragon of the Swamp (CHAIN FUS-MAT); 1× Relinquished Anima (TOKEN LINK); 1× Accesscode Talker (TRIG LOCK DESTROY LINK); 1× Selene, Queen of the Master Magicians (CHAIN TRIG TYPE-FILTER LINK); 1× Artemis, the Magistus Moon Maiden (TRIG TYPE-FILTER LINK); 1× Dharc the Dark Charmer, Gloomy (DESTROY LINK); 1× I:P Masquerena (CHAIN HAND LOCK DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK).

### Dark Magician Light and Darkness Ritual (deck 741086)
- **Main (40):** 1× Black Luster Soldier - Soldier of Light and Darkness (TRIG LOCK RITUAL DESTROY); 1× Magician of Dark Chaos - Black Chaos (TRIG LOCK GY RITUAL DESTROY); 1× Illusion of Chaos (CHAIN HAND TRIG GY RITUAL); 1× Dark Magician **[Academy]**; 1× Dark Magician, the Pharaoh's Servant (CHAIN TRIG DESTROY); 3× Black Chaos (LOCK GY PROC); 1× Celtic Mystic (TRIG LOCK); 2× Skull Archfiend of Chaos (TRIG); 1× Griffoh, Limited (CHAIN HAND RITUAL); 2× Kuriboh - Multiply! (CHAIN HAND TRIG); 1× Magician's Rod **[Academy]**; 1× The Great Gallant Bandit (CHAIN TRIG DESTROY); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 1× Nibiru, the Primal Being (CHAIN TOKEN); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Ghost Ogre & Snow Rabbit **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 1× Light and Darkness Ritual (TRIG GY RITUAL); 3× Dark Magical Curtain **[Academy]**; 1× Dark Magical Circle (TRIG CONT); 1× The Gaze of Timaeus (TRIG FUS-EFF); 3× Ragged Records of Rites (GY); 1× Super Polymerization (FUS-EFF); 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY); 1× Mind Shuffle (CHAIN HAND TRIG LOCK CONT).
- **Extra (15):** 1× Dark Magician of Destruction (TRIG TYPE-FILTER FUS-MAT); 1× Dark Paladin **[Academy]**; 1× Master of Chaos (TRIG GY DESTROY FUS-MAT); 1× Chaos Angel (TRIG LOCK DESTROY SYN); 1× Relinquished Anima (TOKEN LINK); 1× Accesscode Talker (TRIG LOCK DESTROY LINK); 1× Selene, Queen of the Master Magicians (CHAIN TRIG TYPE-FILTER LINK); 1× Mediclius the Extraordinary Power Patron (CHAIN LINK); 1× A Bao A Qu, the Lightless Shadow (CHAIN TRIG GY TYPE-FILTER DESTROY LINK); 1× Dharc the Dark Charmer, Gloomy (DESTROY LINK); 1× Miasma Necromancer (TRIG LOCK GY TYPE-FILTER LINK); 1× I:P Masquerena (CHAIN HAND LOCK DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Garura, Wings of Resonant Life (TRIG FUS-MAT); 1× Mixousia the Confounder (CHAIN HAND TRIG GY TYPE-FILTER FUS-MAT).

### Dark Magician Light and Darkness Ritual (deck 739201)
- **Main (44):** 1× Black Luster Soldier - Soldier of Light and Darkness (TRIG LOCK RITUAL DESTROY); 1× Magician of Dark Chaos - Black Chaos (TRIG LOCK GY RITUAL DESTROY); 2× Illusion of Chaos (CHAIN HAND TRIG GY RITUAL); 1× Dark Magician **[Academy]**; 1× Dark Magician, the Pharaoh's Servant (CHAIN TRIG DESTROY); 3× Black Chaos (LOCK GY PROC); 1× Skull Archfiend of Chaos (TRIG); 3× Griffoh, Limited (CHAIN HAND RITUAL); 2× Kuriboh - Multiply! (CHAIN HAND TRIG); 3× Magician's Rod **[Academy]**; 1× Magicians' Souls, Forbidden (TRIG GY TYPE-FILTER); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 3× Ghost Ogre & Snow Rabbit **[Academy]**; 2× Droll & Lock Bird, Limited **[Academy]**; 1× Light and Darkness Ritual (TRIG GY RITUAL); 1× Spell Shattering Sword (CHAIN TRIG DESTROY); 1× The Gaze of Timaeus (TRIG FUS-EFF); 3× Dark Magical Curtain **[Academy]**; 3× Ragged Records of Rites (GY); 1× The Fallen & The Virtuous (TRIG DESTROY); 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY); 1× Mind Shuffle (CHAIN HAND TRIG LOCK CONT).
- **Extra (15):** 1× Ecclesia and the Dark Dragon (CHAIN TRIG GY SYN); 1× Albion the Branded Dragon, Forbidden (TRIG FUS-MAT); 1× Dark Magician of Destruction (TRIG TYPE-FILTER FUS-MAT); 1× Red-Eyes Dark Dragoon, Forbidden (CHAIN DESTROY FUS-MAT); 1× Relinquished Anima (TOKEN LINK); 1× Firewall Dragon (CHAIN TRIG TYPE-FILTER DESTROY LINK); 1× Selene, Queen of the Master Magicians (CHAIN TRIG TYPE-FILTER LINK); 1× Cyberse Contract Witch (TRIG GY LINK); 1× Zenna's Deceiving Doll Maidens, Forbidden (TRIG GY LINK); 1× Underworld Goddess of the Closed World (CHAIN TRIG LOCK GY LINK); 1× Charmer Quartet in Bloom, Forbidden (CHAIN LOCK GY LINK); 1× Dharc the Dark Charmer, Gloomy (DESTROY LINK); 1× W:P Fancy Ball (CHAIN HAND TRIG LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Cross-Sheep, Forbidden (TRIG GY LINK).

### Atlantean Mermail (deck 742132)
- **Main (41):** 3× Abyssrhine, the Atlantean Spirit (CHAIN HAND LOCK GY TYPE-FILTER); 3× Neptabyss, the Atlantean Prince (TRIG); 2× Mermail Abysspike (TRIG); 2× Poseidra, the Storming Atlantean (TRIG); 3× Mermail Abyssteus (OTHER); 3× Atlantean Dragoons (TRIG TYPE-FILTER); 3× Mermail Shadow Squad (TRIG LOCK); 1× Atlantean Heavy Infantry (TRIG TYPE-FILTER DESTROY); 1× Superancient Deepsea King Coelacanth (CHAIN HAND TYPE-FILTER DESTROY); 1× Gluttonous Reptolphin Greethys (TRIG LOCK GY TYPE-FILTER); 1× Butterfly Fish (TRIG LOCK GY); 1× Deep Sea Diva (TRIG TYPE-FILTER); 1× Deep Sea Minstrel (TRIG GY); 1× Moulinglacia the Elemental Lord (TRIG GY PROC); 1× General Raiho of the Ice Barrier (CHAIN); 1× Tidal, Dragon Ruler of Waterfalls (TRIG TYPE-FILTER); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 2× Mulcharmy Purulia (CHAIN HAND TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 1× Pot of Prosperity, Limited (LOCK); 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY).
- **Extra (15):** 1× Poseidra Abyss, the Atlantean Dragon Lord (TYPE-FILTER XYZ); 1× Mermail Abyssgaios (CHAIN LOCK XYZ); 1× Abysstrite, the Atlantean Spirit (TRIG GY TYPE-FILTER XYZ); 1× LeVirtue Dragon (TRIG GY TYPE-FILTER XYZ); 1× Ravenous Crocodragon Archethys (CHAIN TRIG DESTROY SYN); 1× Adamancipator Risen - Dragite (CHAIN TRIG GY TYPE-FILTER DESTROY SYN); 1× Lancea, Ancestral Dragon of the Ice Mountain (SYN); 1× White Aura Monoceros (TRIG LOCK GY TYPE-FILTER DESTROY SYN); 1× White Aura Porpoise (TRIG GY TYPE-FILTER DESTROY SYN); 1× Deep Sea Prima Donna (TRIG SYN); 1× Swordsoul Supreme Sovereign - Chengying (TRIG GY DESTROY SYN); 1× Haggard Lizardose (LINK); 1× Abyss Keeper (TRIG TYPE-FILTER LINK); 1× Marincess Coral Anemone (TRIG LOCK GY LINK); 1× Mermail King - Neptabyss (TRIG TYPE-FILTER DESTROY LINK).

### Ryu-Ge Dinosaurs (deck 704104)
- **Main (50):** 3× Sosei Ryu-Ge Mistva (TRIG RITUAL PROC DESTROY PEND); 3× Tensei Ryu-Ge Anva (CHAIN TRIG LOCK DESTROY PEND); 2× Kairo Ryu-Ge Emva (GY); 2× Genro Ryu-Ge Hakva (OTHER); 3× Souleating Oviraptor (TRIG TYPE-FILTER DESTROY); 1× Xeno Meteorus (TRIG LOCK TYPE-FILTER DESTROY); 1× Ultimate Conductor Tyranno (PROC TYPE-FILTER DESTROY); 1× Miscellaneousaurus, Limited (HAND TRIG LOCK TYPE-FILTER DESTROY); 1× Giant Rex (TRIG TYPE-FILTER); 3× Babycerasaurus (TRIG TYPE-FILTER DESTROY); 1× Petiteranodon (TRIG LOCK TYPE-FILTER DESTROY); 2× Animadorned Archosaur (TRIG TYPE-FILTER DESTROY); 1× Dinowrestler Pankratops (CHAIN HAND DESTROY); 1× Frostosaurus (**data: Normal Monster**, 6631034); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Droll & Lock Bird, Limited **[Academy]**; 3× Fossil Dig (TYPE-FILTER); 2× Double Evolution Pill (TYPE-FILTER); 1× Ryu-Ge Realm - Dino Domains (CHAIN CONT); 1× Ryu-Ge Realm - Wyrm Winds (CHAIN CONT); 3× Ryu-Ge Rising (GY); 3× Ryu-Ge War Zone (TRIG LOCK TYPE-FILTER CONT); 2× The Melody of Awakening Dragon (TYPE-FILTER); 1× Terraforming, Limited **[Academy]**; 1× Called by the Grave, Forbidden (CHAIN).
- **Extra (15):** 1× Varudras, the Final Bringer of the End Times, Forbidden (CHAIN TRIG DESTROY XYZ); 1× Steamed Sabersaurus (TYPE-FILTER DESTROY XYZ); 1× Evolzar Lars (CHAIN TRIG XYZ); 1× Evolzar Dolkka (CHAIN HAND TYPE-FILTER DESTROY XYZ); 1× Evolzar Laggia (CHAIN HAND TYPE-FILTER DESTROY XYZ); 1× Galaxy-Eyes Full Armor Photon Dragon (DESTROY XYZ); 1× Galaxy-Eyes Cipher Blade Dragon (GY DESTROY XYZ); 1× Galaxy-Eyes Cipher X Dragon (TRIG GY TYPE-FILTER XYZ); 1× Superdreadnought Rail Cannon Gustav Max, Limited (XYZ); 1× Superdreadnought Rail Cannon Juggernaut Liebe (LOCK TYPE-FILTER XYZ); 1× Super Starslayer TY-PHON - Sky Crisis (LOCK XYZ); 1× Swordsoul Supreme Sovereign - Chengying (TRIG GY DESTROY SYN); 1× Pentestag (LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Underworld Goddess of the Closed World (CHAIN TRIG LOCK GY LINK).

### Sacred Beasts (deck 745516)
- **Main (40):** 3× Calamity of the Sacred Beasts - Hamon, Lord of Striking Thunder (TRIG PROC DESTROY); 3× Infinity of the Sacred Beasts - Raviel, Lord of Phantasms (CHAIN PROC DESTROY); 1× Inferno of the Sacred Beasts - Uria, Lord of Searing Flames (CHAIN PROC DESTROY); 3× Martyr of the Sacred Beasts (TRIG GY); 1× Summoner of the Sacred Beasts (GY); 3× The Great Gallant Bandit (CHAIN TRIG DESTROY); 3× Ash Blossom & Joyous Spring **[Academy]**; 3× Ghost Ogre & Snow Rabbit **[Academy]**; 3× Effect Veiler **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Sacred Beasts Released (TRIG LOCK GY TYPE-FILTER); 3× Sacred Beasts Thunderclap (TRIG GY CONT); 2× Fallen Paradise of the Sacred Beasts (TRIG LOCK CONT); 2× Card of the Soul (OTHER); 2× Lightning Crash (LOCK TYPE-FILTER); 1× Sacred Beasts Combined Assault (CHAIN GY FUS-EFF DESTROY).
- **Extra (15):** 1× The Chaotic Phantasmal Sacred Beasts (CHAIN LOCK DESTROY FUS-MAT); 2× Thunder Dragon Colossus (LOCK GY TYPE-FILTER DESTROY FUS-MAT); 1× Angelechy Shatranga (TRIG SYN); 1× Perfectron Hydradrive Dragon, Limited (TRIG LOCK GY DESTROY LINK); 1× Firewall Dragon (CHAIN TRIG TYPE-FILTER DESTROY LINK); 1× Codebreaker Virus Berserker (TRIG DESTROY LINK); 1× Codebreaker Virus Swordsman (TRIG DESTROY LINK); 1× V-LAN Hydra (LOCK TOKEN LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Relinquished Anima (TOKEN LINK); 1× Barricadeborg Blocker (TRIG LOCK GY DESTROY LINK); 1× Link Spider **[Academy]**; 1× Linkuriboh, Limited (CHAIN TRIG GY LINK); 1× Secure Gardna (LOCK LINK).

### Unchained (deck 745829)
- **Main (40):** 3× Unchained Soul of Sharvara (CHAIN TRIG LOCK TYPE-FILTER DESTROY); 1× Unchained Soul of Shyama (TRIG GY TYPE-FILTER DESTROY); 1× Abominable Unchained Soul (TRIG DESTROY); 3× Unchained Zealot - Kamra (TRIG DESTROY); 3× Unchained Oni of Shyma (TRIG LOCK TYPE-FILTER DESTROY); 3× Unchained Oni of Shara (CHAIN HAND GY TYPE-FILTER DESTROY); 3× Unchained Twins - Aruha (TRIG LOCK TYPE-FILTER DESTROY); 1× Unchained Twins - Rakea (CHAIN TRIG LOCK TYPE-FILTER DESTROY); 1× Unchained Twins - Sarama (TRIG GY DESTROY); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Ghost Ogre & Snow Rabbit **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 3× Abomination's Prison (DESTROY); 3× Reincarnation of the Unchained (TRIG GY DESTROY CONT); 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY); 1× Unchained Hunger (CHAIN DESTROY); 1× Abominable Chamber of the Unchained (CHAIN DESTROY); 1× Escape of the Unchained (CHAIN DESTROY).
- **Extra (15):** 3× Unchained Soul Lord of Yama (TRIG GY TYPE-FILTER DESTROY LINK); 1× Unchained Firelord of Yama (TRIG LOCK GY TYPE-FILTER DESTROY LINK); 1× Unchained Soul of Abominable Rage (CHAIN TRIG GY TYPE-FILTER DESTROY LINK); 1× Unchained Soul of Rage (CHAIN HAND TRIG GY TYPE-FILTER DESTROY LINK); 1× Unchained Soul of Anguish (TRIG GY TYPE-FILTER DESTROY LINK); 1× Unchained Abomination (TRIG DESTROY LINK); 1× Knightmare Unicorn (TRIG LINK); 1× Knightmare Phoenix (TRIG LOCK DESTROY LINK); 1× A Bao A Qu, the Lightless Shadow (CHAIN TRIG GY TYPE-FILTER DESTROY LINK); 1× Underworld Goddess of the Closed World (CHAIN TRIG LOCK GY LINK); 1× Muckraker From the Underworld (LOCK GY TYPE-FILTER DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Super Starslayer TY-PHON - Sky Crisis (LOCK XYZ).

### Primite Blue-Eyes (deck 745513)
- **Main (45):** 3× Sage with Eyes of Blue **[Academy]**; 3× Maiden of White (CHAIN HAND TRIG GY); 3× Deep-Eyes White Dragon, the Blue Abyss (GY); 2× Blue-Eyes White Dragon **[Academy]**; 1× Blue-Eyes White Dragon, the White Phantom Beast (CHAIN TRIG LOCK DESTROY); 1× Primite Dragon Ether Beryl (TRIG GY); 1× Bystial Magnamhut, Limited (CHAIN TRIG TYPE-FILTER); 1× Droll & Lock Bird, Limited **[Academy]**; 3× Effect Veiler **[Academy]**; 3× Ash Blossom & Joyous Spring **[Academy]**; 3× Ghost Ogre & Snow Rabbit **[Academy]**; 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Primite Lordly Lode (TRIG LOCK GY CONT); 1× Primite Drillbeam (CHAIN GY TOKEN); 3× Wishes for Eyes of Blue (GY); 1× Bingo Machine, Go!!! (OTHER); 1× Pot of Prosperity, Limited (LOCK); 1× Roar of the Blue-Eyed Dragons (LOCK GY FUS-EFF TYPE-FILTER); 1× Mausoleum of White (GY CONT); 1× True Light (CHAIN GY DESTROY CONT); 1× Majesty of the White Dragons (CHAIN GY RITUAL DESTROY); 3× Dominus Purge (CHAIN TRIG LOCK GY DESTROY); 2× Infinite Impermanence **[Academy]**.
- **Extra (15):** 3× Spirit with Eyes of Blue (CHAIN TRIG LOCK GY TYPE-FILTER LINK); 1× Hieratic Seal of the Heavenly Spheres (CHAIN TRIG TYPE-FILTER LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Psychic End Punisher (LOCK SYN); 1× Lightstorm Dragon (TRIG LOCK GY DESTROY SYN); 1× Ancient Fairy Life Dragon (TRIG SYN); 1× Black Rose Moonlight Dragon (TRIG SYN); 1× Blue-Eyes Ultimate Spirit Dragon (CHAIN TRIG GY TYPE-FILTER DESTROY SYN); 3× Blue-Eyes Spirit Dragon **[Academy]**; 1× Neo Blue-Eyes Ultimate Dragon (CHAIN HAND DESTROY FUS-MAT); 1× Blue-Eyes Tyrant Dragon (GY TYPE-FILTER FUS-MAT).

### Destiny HERO (deck 745166)
- **Main (45):** 3× Destiny HERO - Doom Overlord (TRIG LOCK); 1× Destiny HERO - Destro-Dogma (CHAIN HAND TRIG GY FUS-EFF PROC); 1× Destiny HERO - Dreadnought Servant (TRIG GY DESTROY); 1× Destiny HERO - Dreadmaster (TRIG LOCK GY DESTROY); 1× Destiny HERO - Dogma (TRIG PROC); 1× Destiny HERO - Plasma (PROC); 1× Destiny HERO - Celestial (TRIG GY DESTROY); 1× Destiny HERO - Dark Angel (CHAIN TRIG GY DESTROY); 1× Destiny HERO - Denier (TRIG GY); 2× Destiny HERO - Malicious **[Academy]**; 1× Masked HERO Dusk Crow (TRIG GY); 1× Masked HERO Furnace (TRIG LOCK GY); 3× Winged Kuriboh Sabatiel LV10 (CHAIN HAND LOCK); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 2× Nibiru, the Primal Being (CHAIN TOKEN); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Ghost Ogre & Snow Rabbit **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 3× Dark City at Midnight (TRIG TYPE-FILTER DESTROY CONT); 3× Fusion Destiny (TRIG LOCK FUS-EFF DESTROY); 1× Mask Change (OTHER); 1× D - Force (TRIG LOCK DESTROY CONT); 2× Polymerization **[Academy]**; 1× Super Polymerization (FUS-EFF); 1× Reinforcement of the Army, Limited **[Academy]**; 1× Terraforming, Limited **[Academy]**; 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY).
- **Extra (15):** 1× Destiny HERO - Destroyer Phoenix Enforcer (CHAIN TRIG GY DESTROY FUS-MAT); 2× Destiny HERO - Dreadnought Master (TRIG FUS-MAT); 1× Destiny HERO - Dominance (TRIG GY DESTROY FUS-MAT); 2× Destiny HERO - Dystopia (CHAIN TRIG GY DESTROY FUS-MAT); 1× Destiny HERO - Dusktopia (CHAIN HAND TRIG DESTROY FUS-MAT); 1× Destiny HERO - Dangerous (CHAIN GY FUS-MAT); 1× Masked HERO Dark Law (PROC FUS-MAT); 1× Contrast HERO Chaos (CHAIN LOCK FUS-MAT); 1× Favorite HERO Shining Flare Wingman (TRIG GY DESTROY FUS-MAT); 1× Favorite HERO Flame Wingman (CHAIN HAND TRIG DESTROY FUS-MAT); 1× Skyborne Blue Cularsaw (CHAIN TRIG GY TYPE-FILTER FUS-MAT); 2× Xtra HERO Cross Crusader (TRIG LOCK GY TYPE-FILTER LINK).

### Adamancipator Magnet Warrior (deck 745240)
- **Main (42):** 3× Conduction Warrior Linear Magnum Plus Minus (TRIG PROC DESTROY); 3× Magnet Warrior Sigma Minus (CHAIN TRIG FUS-EFF TYPE-FILTER); 1× Magnet Warrior Sigma Plus (TRIG GY); 1× Magnet Warrior Omega Plus (CHAIN TRIG TYPE-FILTER DESTROY); 2× Beta The Electromagnet Warrior (CHAIN HAND TRIG); 1× Epsilon The Magnet Warrior (TRIG GY); 1× Tellusion the Magna Warrior (CHAIN HAND GY PROC DESTROY); 3× Adamancipator Conductor (TRIG TYPE-FILTER); 3× Adamancipator Researcher (TRIG TYPE-FILTER); 1× Adamancipator Seeker (TRIG TYPE-FILTER); 1× Adamancipator Analyzer (TYPE-FILTER); 1× Adamancipator Crystal - Tiamite (TRIG GY TYPE-FILTER); 3× Half Slice of Nickeline (TRIG TYPE-FILTER); 3× Koa'ki Meiru Guardian (CHAIN HAND TRIG TYPE-FILTER DESTROY); 1× Koa'ki Meiru Supplier (TRIG TYPE-FILTER); 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Mulcharmy Purulia (CHAIN HAND TRIG); 3× Magnet Bonding (FUS-EFF TYPE-FILTER); 1× Magnet Induction (TRIG LOCK DESTROY); 3× Adamancipator Mates (TRIG GY); 1× Adamancipator Signs (GY TYPE-FILTER).
- **Extra (15):** 1× Conduction Warrior Plasma Magnum (CHAIN TRIG TYPE-FILTER FUS-MAT); 1× Flux Ochsenfeld (CHAIN HAND TRIG LOCK TYPE-FILTER FUS-MAT); 1× Gallant Granite (TYPE-FILTER XYZ); 1× Proxy F Magician (FUS-EFF LINK); 1× I:P Masquerena (CHAIN HAND LOCK DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× Adamancipator Luminous (CHAIN TRIG TOKEN LINK); 1× Crystron Halqifibrax Prism (CHAIN TRIG LOCK TOKEN LINK); 1× Dragunity Lord - Georgius (CHAIN TRIG LOCK LINK); 2× Dragunity Knight - Luin (TRIG GY SYN); 1× Dragunity Knight - Areadbhair (CHAIN TRIG GY DESTROY SYN); 1× Adamancipator Risen - Dragite (CHAIN TRIG GY TYPE-FILTER DESTROY SYN); 1× Adamancipator Risen - Raptite (CHAIN HAND GY TYPE-FILTER SYN); 1× Adamancipator Risen - Tiamite (CHAIN TRIG GY TYPE-FILTER SYN).

### Magnet Warrior (deck 725120)
- **Main (42):** 1× Tellusion the Magna Warrior (CHAIN HAND GY PROC DESTROY); 3× Conduction Warrior Linear Magnum Plus Minus (TRIG PROC DESTROY); 3× Magnet Warrior Sigma Minus (CHAIN TRIG FUS-EFF TYPE-FILTER); 2× Magnet Warrior Sigma Plus (TRIG GY); 1× Magnet Warrior Omega Plus (CHAIN TRIG TYPE-FILTER DESTROY); 1× Epsilon The Magnet Warrior (TRIG GY); 3× Beta The Electromagnet Warrior (CHAIN HAND TRIG); 3× Duoterion (TRIG GY); 1× Adamancipator Researcher (TRIG TYPE-FILTER); 1× Koa'ki Meiru Supplier (TRIG TYPE-FILTER); 1× Koa'ki Meiru Guardian (CHAIN HAND TRIG TYPE-FILTER DESTROY); 2× Droll & Lock Bird, Limited **[Academy]**; 3× Mulcharmy Fuwalos (CHAIN HAND TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Ghost Ogre & Snow Rabbit **[Academy]**; 2× Ghost Belle & Haunted Mansion (CHAIN HAND TRIG GY); 1× Nibiru, the Primal Being (CHAIN TOKEN); 3× Magnet Bonding (FUS-EFF TYPE-FILTER); 1× Magnet Induction (TRIG LOCK DESTROY); 1× Triple Tactics Talent, Forbidden (TRIG); 1× Called by the Grave, Forbidden (CHAIN); 3× Super Polymerization (FUS-EFF).
- **Extra (15):** 1× Naturia Beast, Forbidden (CHAIN DESTROY SYN); 1× Garura, Wings of Resonant Life (TRIG FUS-MAT); 1× Sea Monster of Theseus (FUS-MAT); 1× Mudragon of the Swamp (CHAIN FUS-MAT); 1× Flux Ochsenfeld (CHAIN HAND TRIG LOCK TYPE-FILTER FUS-MAT); 2× Conduction Warrior Plasma Magnum (CHAIN TRIG TYPE-FILTER FUS-MAT); 1× Number 55: Gogogo Goliath (TYPE-FILTER XYZ); 1× Gallant Granite (TYPE-FILTER XYZ); 1× Evilswarm Exciton Knight (CHAIN DESTROY XYZ); 1× Underworld Goddess of the Closed World (CHAIN TRIG LOCK GY LINK); 1× Gorgon of Zilofthonia (CHAIN LOCK DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 1× I:P Masquerena (CHAIN HAND LOCK DESTROY LINK); 1× Cross-Sheep, Forbidden (TRIG GY LINK).

### Synchron (deck 744497)
- **Main (45):** 2× Stardust Synchron (TRIG LOCK); 3× Junk Meister (TRIG LOCK); 1× Scrap Synchron (DESTROY); 1× Assault Synchron (LOCK GY TYPE-FILTER); 1× Jet Synchron (TRIG GY); 1× Starjunk Synchron (CHAIN TRIG LOCK GY DESTROY); 1× Junk Synchron **[Academy]**; 1× Revolution Synchron (TRIG GY TYPE-FILTER); 1× Wheel Synchron (LOCK GY); 1× Junk Armor (TRIG); 1× Assault Sonic Warrior (TRIG LOCK); 1× Full-Speed Warrior (TRIG); 1× Stardust Trail (TRIG TOKEN); 2× Nibiru, the Primal Being (CHAIN TOKEN); 3× Ash Blossom & Joyous Spring **[Academy]**; 2× Ghost Ogre & Snow Rabbit **[Academy]**; 2× Ghost Belle & Haunted Mansion (CHAIN HAND TRIG GY); 1× Droll & Lock Bird, Limited **[Academy]**; 1× Synchro Fellowship (GY); 1× Synchro Rumble (LOCK GY TYPE-FILTER DESTROY); 3× Junk Signal (TRIG LOCK); 1× Synchro Overtake, Limited (LOCK); 1× Stardust Illumination (GY); 3× Duel Evolution - Assault Zone (TRIG LOCK DESTROY CONT); 3× Forbidden Droplet (CHAIN LOCK); 3× Triple Tactics Thrust (TRIG LOCK); 1× Terraforming, Limited **[Academy]**; 1× Reinforcement of the Army, Limited **[Academy]**; 1× Heavy Slump (CHAIN TRIG).
- **Extra (15):** 1× Accel Synchro Stardust Dragon (CHAIN TRIG LOCK GY SYN); 1× Stardust Dragon [art only]; 1× Stardust Dragon - Victim Sanctuary (CHAIN TRIG LOCK GY DESTROY SYN); 1× Bystial Dis Pater (CHAIN TRIG TYPE-FILTER DESTROY SYN); 1× Red Supernova Dragon (CHAIN TRIG GY DESTROY SYN); 1× Red Hypernova Dragon (CHAIN LOCK GY DESTROY SYN); 1× Crimson Dragon (CHAIN TRIG TYPE-FILTER SYN); 1× Cosmic Blazar Dragon (CHAIN TRIG DESTROY SYN); 1× Virtual World Kyubi - Shenshen (TRIG GY SYN); 1× Scrap Warrior (CHAIN TRIG SYN); 1× Jet Warrior (TRIG SYN); 1× Junk Speeder (TRIG LOCK SYN); 1× Chaos Angel (TRIG LOCK DESTROY SYN); 1× T.G. Hyper Librarian, Limited (TRIG SYN); 1× Garden Rose Maiden (TRIG GY TYPE-FILTER SYN).

### K9 Dark Time Wizard (deck 743935)
- **Main (41):** 3× Alligator's Dragon Knight (TRIG); 3× Swiftwind Panther Warrior (CHAIN); 1× Fisherman of Legend (TRIG DESTROY); 3× The Phantom Knights of Doomed Soleret (TRIG GY); 3× K9-17 Izuna (CHAIN TRIG); 2× K9-66b Lantern (TRIG LOCK GY); 1× K9-66a Jokul, Limited (LOCK); 1× K9-ØØ Lupis (CHAIN HAND); 3× Ash Blossom & Joyous Spring **[Academy]**; 3× Ghost Ogre & Snow Rabbit **[Academy]**; 3× Effect Veiler **[Academy]**; 2× Nibiru, the Primal Being (CHAIN TOKEN); 1× Droll & Lock Bird, Limited **[Academy]**; 3× Dark Time Wizard **[Academy]**; 1× K9-X Forced Release (GY DESTROY); 1× "A Case for K9", Limited (CHAIN TRIG DESTROY CONT); 1× Graceful & Skull Dice (TRIG LOCK GY DESTROY DICE/COIN); 1× Sleepy Scapegoats (LOCK DESTROY TOKEN); 1× The Phantom Knights of Umbrage Veil (CHAIN GY); 1× Foolish Graverobber (CHAIN GY); 3× Infinite Impermanence **[Academy]**.
- **Extra (15):** 1× K9-X "Werewolf" (CHAIN TRIG XYZ); 1× K9-66X "Jacks" (TRIG DESTROY XYZ); 1× K9-17 "Ripper" (CHAIN TRIG XYZ); 1× CXyz N.As.Ch. Knight (TRIG DESTROY XYZ); 1× N.As.H. Knight (CHAIN DESTROY XYZ); 1× Number 104: Masquerade (CHAIN XYZ); 1× Number C104: Umbral Horror Masquerade (CHAIN TRIG DESTROY XYZ); 1× CXyz Hope Chaos Barian Dragon (LOCK XYZ); 1× Divine Arsenal AA-ZEUS - Sky Thunder (CHAIN DESTROY XYZ); 1× M-X-Saber Invoker (TRIG TYPE-FILTER DESTROY XYZ); 1× Chronomaly Vimana (CHAIN GY XYZ); 1× I:P Masquerena (CHAIN HAND LOCK DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK); 2× Red-Eyes Black Dragon Exceed (TRIG DESTROY FUS-MAT).

### Toon (deck 745046)
- **Main (40):** 3× Funny Dark Rabbit (OTHER); 3× Animimicat (CHAIN); 1× Dark-Eyes Illusionist Faceless Mage (GY DESTROY); 1× Evil Box (CHAIN TRIG); 3× Ash Blossom & Joyous Spring **[Academy]**; 3× Ghost Ogre & Snow Rabbit **[Academy]**; 3× Effect Veiler **[Academy]**; 1× Droll & Lock Bird, Limited **[Academy]**; 3× Perfect Toon World (CONT); 1× Toon Table of Contents, Limited **[Academy]**; 1× Toon Bookmark, Limited (GY DESTROY); 3× Rainbow Bridge Bifrost (OTHER); 1× Piri Reis Map (LOCK); 1× Pot of Prosperity, Limited (LOCK); 1× Instant Fusion, Limited (TRIG LOCK FUS-EFF DESTROY); 1× Terraforming, Limited **[Academy]**; 3× Infinite Impermanence **[Academy]**; 3× Dominus Impulse (CHAIN TRIG LOCK GY DESTROY); 2× Typhoon (CHAIN DESTROY); 1× Toon Terror (CHAIN DESTROY); 1× Mind Scan (CHAIN TRIG CONT).
- **Extra (15):** 1× Odin, Father of the Aesir (TRIG LOCK GY DESTROY SYN); 1× Chaos Angel (TRIG LOCK DESTROY SYN); 1× Psychic End Punisher (LOCK SYN); 1× Dark Rebellion Xyz Dragon, Four Heavenly Dragons (CHAIN TRIG DESTROY XYZ); 1× Evilswarm Ophion (LOCK XYZ); 1× Evilswarm Exciton Knight (CHAIN DESTROY XYZ); 1× Exosister Karmael (CHAIN TRIG XYZ); 1× Divine Arsenal AA-ZEUS - Sky Thunder (CHAIN DESTROY XYZ); 1× Super Starslayer TY-PHON - Sky Crisis (LOCK XYZ); 1× Millennium-Eyes Restrict (CHAIN LOCK FUS-MAT); 1× Relinquished Anima (TOKEN LINK); 1× Prototype Sky Striker Ace - Amatsu (CHAIN TRIG DESTROY LINK); 1× Sky Striker Ace - Azalea (TRIG GY DESTROY LINK); 1× Dharc the Dark Charmer, Gloomy (DESTROY LINK); 1× S:P Little Knight (CHAIN TRIG LOCK LINK).
