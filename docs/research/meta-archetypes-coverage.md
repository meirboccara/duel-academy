# Seven meta archetypes: which of their cards Duel Academy Junior already plays

> **Date of observation:** 2026-11-22. Every web page and API response cited below was fetched that day. This
> repository was read on `main` at HEAD `bee4bf7`, with uncommitted edits in `masters.ts`, `masters.test.ts`,
> `junior-play.tsx`, the world files and `map-places.ts` (none in `cards.ts`, `card-art.*`, `engine.ts`,
> `master-decks.ts` or `starters.ts`); line numbers are from the working tree.
> **Nature of this document:** a research note. No code was changed, nothing was installed or committed, nothing was
> published. The deck lists, card ids and card texts were downloaded into a temporary folder outside the repo and
> processed with throwaway scripts.
>
> **The request (owner, verbatim):** "If you take those meta archetypes : Toon, Rolad, Destiny Hero, Dark time wizard,
> Blue eyes, radiant typhoon, branded. Review those decks meta on ygoprodeck and check if all cards has been already
> scripted and auto in academy"
>
> **Clarifications (owner):** "Rolad" = "Light and darkness ritual". "Dark time wizard" = "The new deck from beyond of
> the brave and archetype dark time wizard with all card related". "radiant typhoon" = the Radiant Typhoon archetype;
> "branded" = Branded / Despia / Fallen of Albaz; "Destiny Hero" = Destiny HERO; "Toon"; "Blue eyes" = Blue-Eyes.
>
> **Sourcing rule used:** claims about this repo cite `file:line`. Meta claims (which lists topped, where, when) cite
> the YGOPRODeck deck pages, whose "Tournament Meta Decks" category is curated by YGOPRODeck ("current-level Meta Decks
> ... curated lists that cannot be uploaded by regular users", text of each deck page). Card text, types and release
> data come from the YGOPRODeck card API (`db.ygoprodeck.com/api/v7/cardinfo.php`); the two cards the owner named
> ("Dark Time Wizard", "Light and Darkness Ritual") were also checked on Konami's database (db.yugioh-card.com).
> Inferences and proposals are labelled **(ours)**. What could not be confirmed is in [§12](#12-unverified).
>
> **Relation to existing notes.** [duel-engine-meta-cards.md](./duel-engine-meta-cards.md) (same day) explains why
> meta cards do not fit Junior's engine today and proposes a five-step plan (§6 there: Step 1 chain stack, Step 2
> event triggers and turn locks, Step 3 effects as data, Step 4 Extra Deck generality, Step 5 meta packs). This note
> measures that gap on seven concrete decks and maps each missing card to the step that would unlock it.

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | Are all the cards of these seven meta decks scripted and automatic in Academy? | **No. Almost none are.** Of the 266 unique Main/Extra Deck cards in the 15 representative lists, **3 are automated** (Polymerization, Reinforcement of the Army, Blue-Eyes White Dragon) and **5 are in Academy but simplified** (Ash Blossom & Joyous Spring, Effect Veiler, Dark Magical Curtain, Dark Time Wizard, Blue-Eyes Spirit Dragon). Every other card is missing, and all of those but one Side Deck Normal Monster need engine work, not just data. Per deck, Academy holds 3-10% of the list (§1). |
| 2 | What is "Rolad"? | The **Light and Darkness Ritual** archetype (YGOPRODeck's own deck name), from *Chaos Origins* (CORI; TCG 2026-07-02, OCG 2026-04-25 per the card API). Its Ritual Spell "Light and Darkness Ritual" Ritual Summons **Magician of Dark Chaos - Black Chaos** or **Black Luster Soldier - Soldier of Light and Darkness** and can banish monsters from the GY as Tribute (Konami DB, cid 22993). In TCG it tops mostly as **Ars Magna (Power Patron) Light and Darkness Ritual** (e.g. Warsaw WCQ 1st, Madrid WCQ 1st); the other plausible reading is the **Branded Light and Darkness Ritual** hybrid (Oklahoma City WCQ 2nd), covered partly in §3 and §8. The classic Black Luster Soldier/Black Luster Ritual pair that Academy already has (`cards.ts:381-382`) appears in none of the lists. |
| 3 | What is "Dark time wizard"? | The **Dark Time Wizard** series introduced in the set **Beyond the Brave** (BETB; TCG 2026-10-08, OCG 2026-07-18): the Quick-Play Spell "Dark Time Wizard" (BETB-EN052) and the cards that mention it (Alligator's Dragon Knight, Fisherman of Legend, Jinzo - Energy Shocker, Swiftwind Panther Warrior, Red-Eyes Black Dragon Exceed, Sleepy Scapegoats, Graceful & Skull Dice, Foolish Graverobber, Reversal Box), plus the OCG-only Invincible Rocket Warrior and The Legendary Insect Queen. In TCG it tops as an engine inside **K9** and **Radiant Typhoon** decks; a pure build topped in the OCG (2nd Motsu CS, 2nd place). All 12 are in §5, including the two that no list plays. |
| 4 | Which engine mechanisms unlock the most of these cards? | **(1) the effect vocabulary (Step 3): 190 cards** need Deck/hand/field actions with archetype filters; **(2) the chain stack with Spell Speeds and Quick Effects (Step 1): 157**; **(3) event triggers (Step 2): 125**; then GY effects (114, Step 3) and turn locks (84, Step 2). Counts overlap, because most cards need several (§9). |
| 5 | How far does the §6 plan get? **(ours)** | Fully playable unique cards: 13 after Step 1, 26 after Step 2, **163 after Step 3**, **272 after Step 4**, 279 after Step 5; 11 need things outside the plan (Tokens, dice, counters, control change). Per deck, Steps 1-4 reach 85-100% of the lists (§1). Step 1 alone completes few cards but is a prerequisite for most. |
| 6 | What can be added right now as data only? | **One card**: PSY-Frame Driver (a Normal Monster, Side Deck of Toon and Dark Time Wizard lists). Six more need one small, local change each (a new `DeckPool`, a "destroy 1 Spell/Trap" tag, a modal Spell); see §10. |

## 1. Summary

Counts are **unique cards** across the representative lists of each deck, Main + Extra Deck (Side-only cards are listed in each section but kept out of these totals). "Coverage" is Automated ÷ cards; "in Academy" is (Automated + Partial) ÷ cards.

| Deck | Cards in lists (Main+Extra) | Side-only | Automated | Partial | Missing — data | Missing — engine | Coverage | In Academy | Fully playable after Step 3 | after Step 4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Toon | 55 | 10 | 0 | 2 | 0 | 53 | 0% | 4% | 21 (38%) | 47 (85%) |
| "Rolad" = Light and Darkness Ritual | 67 | 13 | 0 | 3 | 0 | 64 | 0% | 4% | 36 (54%) | 63 (94%) |
| Destiny HERO | 44 | 8 | 2 | 1 | 0 | 41 | 5% | 7% | 28 (64%) | 41 (93%) |
| "Dark time wizard" = Dark Time Wizard | 81 | 13 | 0 | 3 | 0 | 78 | 0% | 4% | 41 (51%) | 77 (95%) |
| Blue-Eyes | 39 | 11 | 1 | 3 | 0 | 35 | 3% | 10% | 24 (62%) | 37 (95%) |
| Radiant Typhoon | 38 | 6 | 0 | 1 | 0 | 37 | 0% | 3% | 21 (55%) | 37 (97%) |
| Branded | 51 | 11 | 0 | 2 | 0 | 49 | 0% | 4% | 34 (67%) | 51 (100%) |
| **Sum of the 7 decks** (a staple counts once per deck) | 375 | 72 | 3 | 15 | 0 | 357 | 1% | 5% | | |
| **Unique across all 7** | 266 | 29 | 3 | 5 | 0 | 258 | 1% | 3% | | |

"Fully playable after Step N" assumes Steps 1..N of the §6 plan in `duel-engine-meta-cards.md` are built, and counts a card when every mechanism it needs belongs to a step ≤ N (cards that also need a mechanism outside the plan, such as Tokens, are never counted). Partial cards whose missing part is listed count from the step of that part.

**Codes** used in the "Needs" columns, with the §6 step of `duel-engine-meta-cards.md` that brings each:
CHAIN chain stack, Spell Speed, Quick Effects, negation (Step 1); HAND hand traps (Step 1); TRIG event triggers
(Step 2); LOCK turn locks and continuous restrictions (Step 2); VOCAB effect vocabulary: Deck/hand/field actions with
filters and costs (Step 3); GY effects used from the GY or banishment (Step 3); RITUAL general Ritual (Step 3); FUS-EFF
Fusion Summon by card effect from other zones (Step 3); CONT Continuous/Field Spells-Traps with activated effects
(Step 3); FUS-MAT Fusion with described materials (Step 4); SYN generic Synchro (Step 4); XYZ Xyz materials and detach
(Step 4); LINK Link Monsters and Arrows (Step 4); TOON "Toon World" status (Step 5); TOKEN, DICE, CTR (counters),
CONTROL (Summon to or control of the opponent's field), EQ-MON (monsters as Equip Spells): not in §6, shown as
"beyond §6". The Step column is the highest step among a card's codes.

**Status**: Automated = in Academy, its printed effect fully resolved by the engine; Partial = in Academy, simplified
(the note says what is missing); Missing — data = fits the existing effect types; Missing — engine = needs the listed
mechanisms.

## 2. Toon

Lists used (YGOPRODeck, category "Tournament Meta Decks"):

1. [Tri-Brigade Toon](https://ygoprodeck.com/deck/tri-brigade-toon-745141): Oklahoma City WCQ Regional - November 14th 2026, **1st Place**; 45 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-17.
2. [Toon](https://ygoprodeck.com/deck/toon-745046): The Side Deck Remote Duel WCQ Regional - November 15th 2026, **1st Place**; 40 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-16.

Modern Toon is built on cards that *mention* "Toon World" and are "treated as a Toon monster while 'Toon World' is on the field" (Funny Dark Rabbit, Animimicat, Evil Box), searched by the Field Spell Perfect Toon World, whose "name becomes 'Toon World' while in the Field Zone" (YGOPRODeck card text). No classic Toon monster is played: Academy's Toon Alligator (`cards.ts:482`, a Normal Monster in Pegasus's deck) is not in any list. List 1 is a Tri-Brigade hybrid, which brings a Link-heavy Extra Deck; list 2 is pure Toon with a generic Extra Deck. The Toon cards also need Step 5 **(ours)**: a card whose name becomes another card's name exists only for monsters today (`nameAs`, `cards.ts`), and "treated as Toon while ... on the field" is a new kind of condition.

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3 | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| Effect Veiler | 3/3 | Partial | CHAIN | Step 1 | `hand: "veiler"`: only in answer to a pending Summon/Spell in the opponent's Main Phase (`engine.ts:628`), not at any moment of it. |
| Animimicat | 2/3 (main+side) | Missing — engine | CHAIN, HAND, TOON | Step 5 |  |
| Dark-Eyes Illusionist Faceless Mage | 1/1 | Missing — engine | GY, TOON | Step 5 |  |
| Dominus Impulse | 0/3 | Missing — engine | CHAIN, LOCK, GY | Step 3 |  |
| Droll & Lock Bird | 1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Evil Box | 1/1 | Missing — engine | CHAIN, VOCAB, TOON | Step 5 |  |
| Fire Formation - Tenki | 3/0 | Missing — engine | TRIG, VOCAB, CONT | Step 3 |  |
| Funny Dark Rabbit | 3/3 | Missing — engine | VOCAB, TOON | Step 5 | Treated as a Toon while Toon World is on the field; extra Normal Summon; takes a Toon Field/Continuous Spell from Deck. |
| Ghost Ogre & Snow Rabbit | 3/3 | Missing — engine | CHAIN, HAND | Step 1 | Destroy a card whose effect was activated on the field. |
| Infinite Impermanence | 3/3 | Missing — engine | CHAIN, LOCK | Step 2 | Negate a face-up monster; from the hand if you control no cards; column lock if Set. |
| Instant Fusion | 0/1 | Missing — engine | TRIG, FUS-EFF | Step 3 |  |
| Mind Scan | 1/1 | Missing — engine | CHAIN, CONT | Step 3 |  |
| Mulcharmy Fuwalos | 3/3 (main+side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Perfect Toon World | 3/3 | Missing — engine | VOCAB, CONT, TOON | Step 5 | Name becomes "Toon World" in the Field Zone; Deck search up to 3 times a turn; banish a Toon while another effect resolves. |
| Piri Reis Map | 0/1 | Missing — engine | LOCK, VOCAB | Step 3 |  |
| Pot of Prosperity | 1/1 | Missing — engine | LOCK, VOCAB | Step 3 | Banish 3 or 6 from the Extra Deck face-down, look at that many cards, add 1; halved damage. |
| Rainbow Bridge Bifrost | 3/3 | Missing — engine | VOCAB | Step 3 |  |
| Skull Meister | 2/3 (main+side) | Missing — engine | CHAIN, HAND | Step 1 |  |
| Terraforming | 1/1 | Missing — engine | VOCAB | Step 3 | "Add 1 Field Spell from your Deck": `search-pick` with a new pool that accepts Spells. |
| Toon Bookmark | 1/1 | Missing — engine | VOCAB, GY, TOON | Step 5 |  |
| Toon Table of Contents | 1/1 | Missing — engine | VOCAB | Step 3 | "Add 1 'Toon' card from your Deck": `search-pick` with a new DeckPool (`inPool` only accepts monsters today, `cards.ts`). |
| Toon Terror | 1/1 | Missing — engine | CHAIN, TOON | Step 5 | Counter Trap: negate a Spell/Trap or monster effect while you control Toon World and a Toon. |
| Tri-Brigade Fraktall | 3/0 | Missing — engine | LOCK, VOCAB, GY | Step 3 |  |
| Tri-Brigade Kitt | 1/0 | Missing — engine | TRIG, LOCK, VOCAB, GY | Step 3 |  |
| Tri-Brigade Nervall | 1/0 | Missing — engine | TRIG, LOCK, VOCAB, GY | Step 3 |  |
| Tri-Brigade Springans Kitt | 1/0 | Missing — engine | TRIG, LOCK, GY | Step 3 |  |
| Typhoon | 3/2 (side+main) | Missing — engine | CHAIN, VOCAB | Step 3 | Destroy 1 face-up Spell/Trap; may be activated from the hand under a condition. |
| Accesscode Talker | 1/0 (extra) | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 |  |
| Ancient Warriors Oath - Double Dragon Lords | 1/0 (extra) | Missing — engine | CHAIN, HAND, TRIG, VOCAB, LINK | Step 4 |  |
| Chaos Angel | 1/1 (extra) | Missing — engine | TRIG, VOCAB, SYN | Step 4 |  |
| Chimera the King of Phantom Beasts | 1/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Dark Rebellion Xyz Dragon, Four Heavenly Dragons | 0/1 (extra) | Missing — engine | CHAIN, TRIG, XYZ | Step 4 |  |
| Dharc the Dark Charmer, Gloomy | 0/1 (extra) | Missing — engine | VOCAB, LINK | Step 4 |  |
| Divine Arsenal AA-ZEUS - Sky Thunder | 0/1 (extra) | Missing — engine | CHAIN, HAND, XYZ | Step 4 |  |
| Evilswarm Exciton Knight | 0/1 (extra) | Missing — engine | CHAIN, XYZ | Step 4 |  |
| Evilswarm Ophion | 0/1 (extra) | Missing — engine | VOCAB, XYZ | Step 4 |  |
| Exosister Karmael | 0/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, XYZ | Step 4 |  |
| Lunalight Liger Dancer | 1/0 (extra) | Missing — engine | CHAIN, LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Millennium-Eyes Restrict | 0/1 (extra) | Missing — engine | CHAIN, FUS-MAT | Step 4 |  |
| Odin, Father of the Aesir | 1/1 (extra) | Missing — engine | TRIG, VOCAB, GY, SYN | Step 4 |  |
| Prototype Sky Striker Ace - Amatsu | 0/1 (extra) | Missing — engine | CHAIN, LOCK, LINK | Step 4 |  |
| Psychic End Punisher | 0/1 (extra) | Missing — engine | VOCAB, SYN | Step 4 |  |
| Relinquished Anima | 0/1 (extra) | Missing — engine | LINK, TOKEN | Step 4 + beyond §6 |  |
| S:P Little Knight | 0/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Salamangreat Almiraj | 1/0 (extra) | Missing — engine | CHAIN, GY, LINK | Step 4 |  |
| Sky Striker Ace - Azalea | 0/1 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, LINK | Step 4 |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/1 (extra) | Missing — engine | LOCK, XYZ | Step 4 |  |
| Tri-Brigade Arms Bucephalus II | 1/0 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, LINK | Step 4 |  |
| Tri-Brigade Arms Mouser | 1/0 (extra) | Missing — engine | TRIG, LOCK, VOCAB, LINK | Step 4 |  |
| Tri-Brigade Bearbrumm the Rampant Rampager | 1/0 (extra) | Missing — engine | TRIG, LOCK, VOCAB, LINK | Step 4 |  |
| Tri-Brigade Ferrijit the Barren Blossom | 1/0 (extra) | Missing — engine | TRIG, LOCK, LINK | Step 4 |  |
| Tri-Brigade Rugal the Silver Sheller | 1/0 (extra) | Missing — engine | CHAIN, HAND, TRIG, LINK | Step 4 |  |
| Tri-Brigade Shuraig the Ominous Omen | 2/0 (extra) | Missing — engine | TRIG, VOCAB, LINK | Step 4 |  |
| Yummy★Snatchy | 1/0 (extra) | Missing — engine | CHAIN, HAND, TRIG, LOCK, LINK | Step 4 |  |
| PSY-Frame Driver | 1/0 (side) | Missing — data | — | — | Normal Monster: one `real("psy-frame-driver")` line plus its card-art entry. |
| Hey, Space Trunade! | 2/0 (side) | Missing — engine | VOCAB | Step 3 | Return up to 2 cards to the hand; each player puts as many from hand on the Deck bottom. |
| Mulcharmy Purulia | 3/3 (side) | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on the opponent's Normal Summons/Special Summons from the hand (limit); hand shuffle at End Phase. |
| One for One | 1/0 (side) | Missing — engine | VOCAB | Step 3 | Cost: send a monster from hand; SS a Level 1 monster from hand or Deck. |
| PSY-Framegear Delta | 2/0 (side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| PSY-Framegear Gamma | 1/0 (side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| Solemn Judgment | 0/1 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: pay half LP; negate a Summon or a Spell/Trap activation. |
| Solemn Warning | 0/3 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: negate a Summon or an effect that would Summon. |
| Tri-Brigade Revolt | 1/0 (side) | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Veidos the Eruption Dragon of Extinction | 0/2 (side) | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 |  |

## 3. "Rolad" = Light and Darkness Ritual

Lists used (YGOPRODeck, category "Tournament Meta Decks"):

1. [Ars Magna Light and Darkness Ritual](https://ygoprodeck.com/deck/ars-magna-light-and-darkness-ritual-744985): Warsaw WCQ Regional - November 14th 2026, **1st Place**; 45 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-16.
2. [Light and Darkness Ritual](https://ygoprodeck.com/deck/light-and-darkness-ritual-745851): AG3 Ranking - November 9th 2026, **2nd Place**; 42 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-21.

**Identification.** YGOPRODeck names the deck "Light and Darkness Ritual" (and its hybrids "Ars Magna ... Light and Darkness Ritual", "Branded Light and Darkness Ritual", "Mitsurugi Light and Darkness Ritual"); the YGOPRODeck card API gives the archetype field "Light and Darkness Ritual" for Light and Darkness Ritual, Black Chaos, Magician of Dark Chaos - Black Chaos and Black Luster Soldier - Soldier of Light and Darkness. Of the 20 results on page 1 of YGOPRODeck's TCG tournament search for the name (events 2026-10-31 to 2026-11-20), 13 are Ars Magna variants (including two 1st places: Warsaw and Madrid WCQ), 4 are Branded hybrids, 1 is pure, 1 Azamina Dark Magician and 1 Runick Angelechy. So the lists used are the Warsaw 1st (Ars Magna) and the purest recent topping list (AG3 Ranking 2nd). The Branded hybrid (Oklahoma City WCQ 2nd, [deck](https://ygoprodeck.com/deck/branded-light-and-darkness-ritual-745056)) shares its Branded half with §8. The Ritual itself needs a general Ritual in Junior: today's `ritual` tag names one monster and Tributes from hand or field only (`cards.ts:102`, `:381`), while Light and Darkness Ritual chooses between two monsters and can banish from the GY (Konami DB, cid 22993).

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/2 | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| Dark Magical Curtain | 1/0 | Partial | — | — | `curtain`: the engine picks the monster and the Spell/Trap for the player (`docs/academy-junior-masters-plan.md`, "Left out or simplified"); otherwise as printed. |
| Effect Veiler | 2/3 | Partial | CHAIN | Step 1 | `hand: "veiler"`: only in answer to a pending Summon/Spell in the opponent's Main Phase (`engine.ts:628`), not at any moment of it. |
| Albion the Shrouded Dragon | 0/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Ars Magna "Citrinitas" | 1/0 | Missing — engine | CHAIN, VOCAB, CONT | Step 3 |  |
| Ars Magna the Corruption and the Purification | 1/0 | Missing — engine | TRIG, LOCK, VOCAB | Step 3 |  |
| Ars Magna the Division and the Union | 1/0 | Missing — engine | TRIG, VOCAB, GY | Step 3 |  |
| Ars Magna the Finite and the Infinite | 2/0 | Missing — engine | TRIG, LOCK, VOCAB | Step 3 |  |
| Black Chaos | 3/2 | Missing — engine | LOCK, VOCAB, GY, CONT | Step 3 | SS procedure (shuffle a Ritual Monster); places a L&D Continuous Trap; banish 2 once per turn. |
| Black Luster Soldier - Soldier of Light and Darkness | 1/1 | Missing — engine | TRIG, VOCAB, RITUAL | Step 3 | Unaffected by opponent's non-targeting activated effects; on SS banish 1; second attack. |
| Branded in High Spirits | 0/2 | Missing — engine | CHAIN, TRIG, VOCAB, GY | Step 3 |  |
| Bystial Magnamhut | 0/1 | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| Celtic Mystic | 0/1 | Missing — engine | LOCK | Step 2 |  |
| Crimson Call | 0/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Droll & Lock Bird | 1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Fallen of Albaz | 0/1 | Missing — engine | LOCK, FUS-EFF | Step 3 |  |
| Fallen of the White Dragon | 0/2 | Missing — engine | LOCK, VOCAB | Step 3 |  |
| Fydraulis Harmonia | 0/3 | Missing — engine | CHAIN, HAND, LOCK | Step 2 |  |
| Ghost Ogre & Snow Rabbit | 3/2 | Missing — engine | CHAIN, HAND | Step 1 | Destroy a card whose effect was activated on the field. |
| Griffoh | 1/3 | Missing — engine | CHAIN, HAND, VOCAB, RITUAL | Step 3 | Discard (Quick Effect): no damage, or Set a L&D Quick-Play/Trap from Deck; counts as a whole Ritual Tribute. |
| Incredible Ecclesia, the Virtuous | 0/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK, GY | Step 3 |  |
| Kuriboh - Multiply! | 2/0 | Missing — engine | CHAIN, HAND, VOCAB, TOKEN | Step 3 + beyond §6 |  |
| Light and Darkness Ritual | 1/1 | Missing — engine | VOCAB, GY, RITUAL | Step 3 | Ritual Spell for 2 Ritual Monsters; Tribute from hand/field and/or banish from GY; GY recursion. Junior's `ritual` tag names one monster and only Tributes. |
| Magician of Dark Chaos - Black Chaos | 1/1 | Missing — engine | TRIG, VOCAB, GY, RITUAL | Step 3 | Unaffected by opponent's non-targeting effects; protects your Spells/Traps; on SS add a Spell from GY; banish face-down. |
| Maxx "C" | 0/1 | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on each opponent Special Summon. |
| Medius the Pure | 2/0 | Missing — engine | VOCAB, GY | Step 3 |  |
| Mind Shuffle | 2/1 | Missing — engine | CHAIN, LOCK, VOCAB, CONT | Step 3 |  |
| Mulcharmy Fuwalos | 3/3 | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Pot of Prosperity | 1/0 | Missing — engine | LOCK, VOCAB | Step 3 | Banish 3 or 6 from the Extra Deck face-down, look at that many cards, add 1; halved damage. |
| Ragged Records of Rites | 3/3 | Missing — engine | VOCAB, GY | Step 3 |  |
| Skull Archfiend of Chaos | 2/2 | Missing — engine | TRIG, VOCAB, GY | Step 3 | SS from hand/GY by recycling 3 cards incl. a L&D card; sent to GY: search a Ritual Monster. |
| Super Polymerization | 3/0 | Missing — engine | CHAIN, LOCK, FUS-EFF | Step 3 |  |
| The Fallen & The Virtuous | 0/3 | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Theorealize | 1/0 | Missing — engine | VOCAB, GY | Step 3 |  |
| Theorealize Liberation | 1/0 | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Theorealized Medius | 2/0 | Missing — engine | TRIG, VOCAB | Step 3 |  |
| Witch of the Black Forest | 1/0 | Missing — engine | TRIG, LOCK, VOCAB | Step 3 |  |
| Accesscode Talker | 1/0 (extra) | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, LINK | Step 4 |  |
| Albion the Branded Dragon | 0/1 (extra) | Missing — engine | TRIG, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Chaos Angel | 0/1 (extra) | Missing — engine | TRIG, VOCAB, SYN | Step 4 |  |
| Dark Magician of Destruction | 1/0 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Despian Luluwalilith | 0/1 (extra) | Missing — engine | CHAIN, TRIG, LOCK, GY, SYN | Step 4 |  |
| Dharc the Dark Charmer, Gloomy | 1/0 (extra) | Missing — engine | VOCAB, LINK | Step 4 |  |
| Ecclesia and the Dark Dragon | 0/1 (extra) | Missing — engine | CHAIN, VOCAB, GY, SYN | Step 4 |  |
| Favorite HERO Flame Wingman | 1/0 (extra) | Missing — engine | CHAIN, HAND, TRIG, FUS-EFF, FUS-MAT | Step 4 |  |
| Garura, Wings of Resonant Life | 1/0 (extra) | Missing — engine | TRIG, FUS-MAT | Step 4 |  |
| Golden Cloud Beast - Malong | 0/1 (extra) | Missing — engine | TRIG, SYN | Step 4 |  |
| Granguignol the Dusk Dragon | 0/1 (extra) | Missing — engine | TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| I:P Masquerena | 1/0 (extra) | Missing — engine | CHAIN, LINK | Step 4 |  |
| Lubellion the Searing Dragon | 0/1 (extra) | Missing — engine | TRIG, LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Mediclius the Extraordinary Power Patron | 1/0 (extra) | Missing — engine | CHAIN, VOCAB, LINK | Step 4 |  |
| Mirrorjade the Iceblade Dragon | 0/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Mudragon of the Swamp | 1/0 (extra) | Missing — engine | CHAIN, LOCK, FUS-MAT | Step 4 |  |
| Number 90: Galaxy-Eyes Photon Lord | 1/0 (extra) | Missing — engine | CHAIN, VOCAB, XYZ | Step 4 |  |
| Predaplant Dragostapelia | 1/0 (extra) | Missing — engine | CHAIN, FUS-MAT, CTR | Step 4 + beyond §6 |  |
| Purification Power Patron | 1/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, GY, LINK | Step 4 |  |
| Relinquished Anima | 1/0 (extra) | Missing — engine | LINK, TOKEN | Step 4 + beyond §6 |  |
| Rindbrumm the Striking Dragon | 0/1 (extra) | Missing — engine | CHAIN, VOCAB, GY, FUS-MAT | Step 4 |  |
| S:P Little Knight | 1/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Selene, Queen of the Master Magicians | 1/0 (extra) | Missing — engine | CHAIN, HAND, TRIG, GY, LINK, CTR | Step 4 + beyond §6 |  |
| Stardust Spark Dragon | 0/1 (extra) | Missing — engine | CHAIN, SYN | Step 4 |  |
| Storm-Bane Dragon Destorbim | 0/1 (extra) | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, GY, SYN | Step 4 |  |
| The Crimson King | 0/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, SYN | Step 4 |  |
| The Dragon that Devours the Dogma | 0/1 (extra) | Missing — engine | TRIG, VOCAB, GY, FUS-MAT | Step 4 |  |
| Titaniklad the Ash Dragon | 0/1 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| W:P Fancy Ball | 1/0 (extra) | Missing — engine | CHAIN, LOCK, VOCAB, LINK | Step 4 |  |
| Wind Pegasus @Ignister | 0/1 (extra) | Missing — engine | VOCAB, GY, SYN | Step 4 |  |
| Appointer of the Red Lotus | 0/3 (side) | Missing — engine | CHAIN | Step 1 |  |
| Artifact Lancea | 3/0 (side) | Missing — engine | CHAIN, HAND, LOCK, VOCAB | Step 3 |  |
| Bystial Druiswurm | 0/1 (side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| Called by the Grave | 0/2 (side) | Missing — engine | CHAIN, VOCAB | Step 3 | Banish a monster in the opponent's GY; negate effects of that name until the next turn. |
| Cosmic Cyclone | 3/0 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Evenly Matched | 0/1 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Lava Golem | 2/2 (side) | Missing — engine | TRIG, CONTROL | Step 2 + beyond §6 | SS to the opponent's field by Tributing 2 of their monsters; Standby burn. |
| Mulcharmy Purulia | 0/3 (side) | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on the opponent's Normal Summons/Special Summons from the hand (limit); hand shuffle at End Phase. |
| Nibiru, the Primal Being | 2/0 (side) | Missing — engine | CHAIN, HAND, TRIG, TOKEN, CONTROL | Step 2 + beyond §6 | After the opponent's 5th Summon: Tribute all monsters, give the opponent a Token. |
| Pot of Sloth | 2/3 (side) | Missing — engine | LOCK | Step 2 |  |
| Solemn Accusation | 1/0 (side) | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |
| Solemn Judgment | 1/0 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: pay half LP; negate a Summon or a Spell/Trap activation. |
| Solemn Strike | 1/0 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: negate a Summon or a monster effect. |

## 4. Destiny HERO

Lists used (YGOPRODeck, category "Tournament Meta Decks"):

1. [Destiny HERO](https://ygoprodeck.com/deck/destiny-hero-743381): Wien WCQ Regional - November 7th 2026, **1st Place**; 42 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-08.
2. [Destiny HERO](https://ygoprodeck.com/deck/destiny-hero-745166): Honolulu WCQ Regional - November 7th 2026, **1st Place**; 45 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-17.

Both lists are near-identical pure Destiny HERO builds (Doom Overlord, Dark City at Midnight, Fusion Destiny, the Destiny HERO Fusions and Xtra HERO Links). Academy's HEROes are Elemental HEROes (Jaden's deck, `master-decks.ts`); none of them is played here. Polymerization and Reinforcement of the Army are the only automated cards of all seven decks besides Blue-Eyes White Dragon.

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Polymerization | 2/2 | Automated | — | — | `fusion`: materials from hand or field. |
| Reinforcement of the Army | 1/1 | Automated | — | — | `search-pick`, pool `low-warrior` (Level 4 or lower Warrior). |
| Ash Blossom & Joyous Spring | 3/3 | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| D - Force | 0/1 | Missing — engine | TRIG, LOCK, VOCAB, GY, CONT | Step 3 |  |
| Dark City at Midnight | 3/3 | Missing — engine | TRIG, VOCAB, CONT | Step 3 |  |
| Destiny HERO - Celestial | 0/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Destiny HERO - Dark Angel | 1/1 | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Destiny HERO - Denier | 1/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Destiny HERO - Destro-Dogma | 1/1 | Missing — engine | CHAIN, HAND, LOCK, VOCAB, GY, FUS-EFF | Step 3 |  |
| Destiny HERO - Dogma | 0/1 | Missing — engine | TRIG, VOCAB | Step 3 | SS by Tributing 3 incl. a D-HERO; halves LP at the opponent's next Standby Phase. |
| Destiny HERO - Doom Overlord | 3/3 | Missing — engine | LOCK, VOCAB | Step 3 | On Summon banish 1 until the next Standby; send a D-HERO from Deck to search Dark City; DARK HERO lock. |
| Destiny HERO - Dreadmaster | 1/1 | Missing — engine | TRIG, LOCK, GY | Step 3 |  |
| Destiny HERO - Dreadnought Servant | 1/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Destiny HERO - Malicious | 2/2 | Missing — engine | VOCAB, GY | Step 3 |  |
| Destiny HERO - Plasma | 1/1 (side+main) | Missing — engine | CHAIN | Step 1 |  |
| Dominus Impulse | 3/3 | Missing — engine | CHAIN, LOCK, GY | Step 3 |  |
| Dominus Spark | 3/2 (main+side) | Missing — engine | CHAIN, LOCK, VOCAB, GY | Step 3 |  |
| Droll & Lock Bird | 1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Fusion Destiny | 3/3 | Missing — engine | TRIG, LOCK, FUS-EFF | Step 3 |  |
| Ghost Ogre & Snow Rabbit | 3/2 | Missing — engine | CHAIN, HAND | Step 1 | Destroy a card whose effect was activated on the field. |
| Mask Change | 1/1 | Missing — engine | CHAIN | Step 1 |  |
| Masked HERO Dusk Crow | 1/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Masked HERO Furnace | 1/1 | Missing — engine | LOCK, VOCAB, GY | Step 3 |  |
| Mulcharmy Fuwalos | 3/3 | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Nibiru, the Primal Being | 3/2 (side+main) | Missing — engine | CHAIN, HAND, TRIG, TOKEN, CONTROL | Step 2 + beyond §6 | After the opponent's 5th Summon: Tribute all monsters, give the opponent a Token. |
| Pot of Prosperity | 1/0 | Missing — engine | LOCK, VOCAB | Step 3 | Banish 3 or 6 from the Extra Deck face-down, look at that many cards, add 1; halved damage. |
| Super Polymerization | 0/3 (main+side) | Missing — engine | CHAIN, LOCK, FUS-EFF | Step 3 |  |
| Terraforming | 1/1 | Missing — engine | VOCAB | Step 3 | "Add 1 Field Spell from your Deck": `search-pick` with a new pool that accepts Spells. |
| Winged Kuriboh Sabatiel LV10 | 3/3 | Missing — engine | CHAIN, HAND, LOCK, VOCAB | Step 3 |  |
| Contrast HERO Chaos | 1/1 (extra) | Missing — engine | CHAIN, FUS-EFF, FUS-MAT | Step 4 |  |
| Destiny HERO - Dangerous | 0/1 (extra) | Missing — engine | CHAIN, HAND, VOCAB, GY, FUS-MAT | Step 4 |  |
| Destiny HERO - Destroyer Phoenix Enforcer | 2/1 (extra) | Missing — engine | CHAIN, TRIG, GY, FUS-MAT | Step 4 |  |
| Destiny HERO - Dominance | 1/1 (extra) | Missing — engine | GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Destiny HERO - Dreadnought Master | 2/2 (extra) | Missing — engine | TRIG, LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Destiny HERO - Dusktopia | 1/1 (extra) | Missing — engine | CHAIN, HAND, TRIG, FUS-EFF, FUS-MAT | Step 4 |  |
| Destiny HERO - Dystopia | 1/2 (extra) | Missing — engine | CHAIN, TRIG, GY, FUS-MAT | Step 4 |  |
| Favorite HERO Flame Wingman | 0/1 (extra) | Missing — engine | CHAIN, HAND, TRIG, FUS-EFF, FUS-MAT | Step 4 |  |
| Favorite HERO Shining Flare Wingman | 0/1 (extra) | Missing — engine | TRIG, GY, FUS-MAT | Step 4 |  |
| Masked HERO Dark Law | 1/1 (extra) | Missing — engine | VOCAB, FUS-MAT | Step 4 |  |
| Predaplant Dragostapelia | 1/0 (extra) | Missing — engine | CHAIN, FUS-MAT, CTR | Step 4 + beyond §6 |  |
| Skyborne Blue Cularsaw | 1/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, GY, FUS-EFF, FUS-MAT, EQ-MON | Step 4 + beyond §6 |  |
| Xtra HERO Cross Crusader | 2/2 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, LINK | Step 4 |  |
| Xtra HERO Dread Decimator | 1/0 (extra) | Missing — engine | GY, LINK | Step 4 |  |
| Xtra HERO Wonder Driver | 1/0 (extra) | Missing — engine | CHAIN, TRIG, GY, LINK | Step 4 |  |
| Artifact Lancea | 0/3 (side) | Missing — engine | CHAIN, HAND, LOCK, VOCAB | Step 3 |  |
| Hey, Space Trunade! | 0/2 (side) | Missing — engine | VOCAB | Step 3 | Return up to 2 cards to the hand; each player puts as many from hand on the Deck bottom. |
| Mulcharmy Purulia | 3/0 (side) | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on the opponent's Normal Summons/Special Summons from the hand (limit); hand shuffle at End Phase. |
| Pot of Sloth | 2/0 (side) | Missing — engine | LOCK | Step 2 |  |
| Solemn Accusation | 0/2 (side) | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |
| Solemn Judgment | 1/1 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: pay half LP; negate a Summon or a Spell/Trap activation. |
| The Great Gallant Bandit | 2/0 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Typhoon | 2/3 (side) | Missing — engine | CHAIN, VOCAB | Step 3 | Destroy 1 face-up Spell/Trap; may be activated from the hand under a condition. |

## 5. "Dark time wizard" = Dark Time Wizard (Beyond the Brave)

Lists used (YGOPRODeck, category "Tournament Meta Decks", the third one "Tournament Meta Decks OCG"):

1. [K9 Dark Time Wizard](https://ygoprodeck.com/deck/k9-dark-time-wizard-743935): Brazilia WCQ Regional - November 8th 2026, **2nd Place**; 41 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-10.
2. [Dark Time Wizard Radiant Typhoon](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-742563): Guadalajara WCQ Regional - November 1st 2026, **2nd Place**; 40 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-03.
3. [Dark Time Wizard](https://ygoprodeck.com/deck/dark-time-wizard-743117): 2nd Motsu CS - November 1st 2026, **2nd Place**; 40 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-07.

**Identification.** "Dark Time Wizard" is a Quick-Play Spell first printed in *Beyond the Brave* (BETB-EN052; YGOPRODeck card API: TCG 2026-10-08, OCG 2026-07-18); YGOPRODeck lists it under the archetype "Magician", and returns the cards that mention it under the archetype "Dark Time Wizard". The three lists cover how it is played: as an engine in K9 (Brasilia WCQ 2nd), in Radiant Typhoon (Guadalajara WCQ 2nd), and pure (2nd Motsu CS, OCG). The TCG lists play only DTW itself plus Alligator's Dragon Knight, Swiftwind Panther Warrior, Fisherman of Legend, Graceful & Skull Dice, Sleepy Scapegoats, Foolish Graverobber and Red-Eyes Black Dragon Exceed; the OCG list adds Invincible Rocket Warrior and The Legendary Insect Queen (OCG-only, 2026-10-31).

**All related cards** (the owner asked for "all card related"), whether a list plays them or not:

| Card | Where from (API) | In a list? | Status in Academy | Needs | Step |
| --- | --- | --- | --- | --- | --- |
| Dark Time Wizard | BETB-EN052 | 3/3/3 | Partial: coin mode only (`cards.ts:565`) | VOCAB, TRIG | Step 3 |
| Alligator's Dragon Knight | BETB-EN002 | 3/0/3 | Missing | VOCAB, TRIG | Step 3 |
| Fisherman of Legend | BETB-EN004 | 1/0/0 | Missing | CHAIN, TRIG, VOCAB | Step 3 |
| Jinzo - Energy Shocker | BETB-EN003 | no | Missing. Its name becomes "Jinzo" (Academy has `nameAs` and Jinzo's `noTraps`, `cards.ts:521`), but its Trap lock is conditional and its on-Summon destruction is a trigger | TRIG, LOCK, VOCAB | Step 3 |
| Swiftwind Panther Warrior | BETB (set list) | 3/0/3 | Missing | CHAIN, VOCAB | Step 3 |
| Red-Eyes Black Dragon Exceed | BETB (set list) | 2/1/1 (extra) | Missing; one material, Red-Eyes Black Dragon, is in Academy | TRIG, FUS-MAT | Step 4 |
| Sleepy Scapegoats | BETB-EN054 | 1/0/3 | Missing | TOKEN, CHAIN, VOCAB, LOCK | beyond §6 |
| Graceful & Skull Dice | BETB-EN053 | 1/1/3 | Missing | DICE, CHAIN, TRIG, GY | beyond §6 |
| Foolish Graverobber | BETB-EN070 | 1/0/1 | Missing | CHAIN, VOCAB, GY | Step 3 |
| Reversal Box | BETB-EN071 | no | Missing | CHAIN, CONT, CTR, DICE (coin) | beyond §6 |
| Invincible Rocket Warrior | OCG only, 2026-10-31 | 0/0/3 | Missing (Academy's Rocket Warrior is a different card) | CHAIN, VOCAB, LOCK | Step 3 |
| The Legendary Insect Queen | OCG only, 2026-10-31 | 0/0/3 (extra) | Missing | FUS-MAT, TOKEN, TRIG, GY | beyond §6 |

Academy already has the older cards this series points back to: Time Wizard (`cards.ts:558`), Thousand Dragon, Red-Eyes Black Dragon, Jinzo, Rocket Warrior and Umi (Fisherman of Legend's condition, `cards.ts:617`). The planning note `docs/academy-junior-masters-plan.md` records that Dark Time Wizard's first effect was left out because "no card in the game mentions it"; the series above is what that effect searches.

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3/2 (main+side) | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| Dark Time Wizard | 3/3/3 | Partial | TRIG, VOCAB | Step 3 | `coin-wipe` (`cards.ts:565`): only the coin effect. Missing: the search mode (add a card that mentions DTW, End Phase return from GY) and "each effect once per turn" (Junior: 1 activation per turn). |
| Effect Veiler | 3/0/3 | Partial | CHAIN | Step 1 | `hand: "veiler"`: only in answer to a pending Summon/Spell in the opponent's Main Phase (`engine.ts:628`), not at any moment of it. |
| "A Case for K9" | 1/0/0 | Missing — engine | CHAIN, TRIG, VOCAB, CONT | Step 3 |  |
| Alligator's Dragon Knight | 3/0/3 | Missing — engine | TRIG, VOCAB | Step 3 | Direct attacker; self-SS by revealing a DTW card; on Summon add 2 DTW Spells/Traps, then discard. |
| Dominus Purge | 0/3/2 (side+main) | Missing — engine | CHAIN, LOCK, VOCAB, GY | Step 3 |  |
| Dominusteer Rosepamela | 0/0/1 | Missing — engine | CHAIN, HAND, VOCAB | Step 3 |  |
| Droll & Lock Bird | 1/1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Fisherman of Legend | 1/0/0 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 | SS from hand in answer to an opponent's monster effect or attack; on SS destroy 1, End Phase return to hand. |
| Foolish Graverobber | 1/0/1 | Missing — engine | CHAIN, VOCAB, GY | Step 3 | Send a DTW card from Deck, then may SS from either GY; banish from GY to Set a Spell/Trap. |
| Forbidden Crown | 0/2/0 | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Forbidden Droplet | 0/1/0 | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Ghost Ogre & Snow Rabbit | 3/0/3 | Missing — engine | CHAIN, HAND | Step 1 | Destroy a card whose effect was activated on the field. |
| Graceful & Skull Dice | 1/1/3 | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, GY, DICE | Step 3 + beyond §6 | Two die rolls for ATK/DEF changes; GY effect on the opponent's Summon. |
| Infinite Impermanence | 3/0/0 | Missing — engine | CHAIN, LOCK | Step 2 | Negate a face-up monster; from the hand if you control no cards; column lock if Set. |
| Invincible Rocket Warrior | 0/0/3 | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 | Cannot be destroyed by card effects; SS from hand by sending a DTW Spell/Trap; search on attack declaration. |
| K9-17 Izuna | 3/0/0 | Missing — engine | CHAIN, HAND, VOCAB | Step 3 |  |
| K9-66a Jokul | 1/0/0 | Missing — engine | VOCAB | Step 3 |  |
| K9-66b Lantern | 2/0/0 | Missing — engine | VOCAB, GY | Step 3 |  |
| K9-ØØ Lupis | 1/0/0 | Missing — engine | CHAIN, HAND, LOCK, VOCAB | Step 3 |  |
| K9-X Forced Release | 1/0/0 | Missing — engine | CHAIN, GY | Step 3 |  |
| Maxx "C" | 0/0/1 | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on each opponent Special Summon. |
| Mystical Space Typhoon | 0/3/0 | Missing — engine | CHAIN, VOCAB | Step 3 | Destroy 1 Spell/Trap: no Junior effect destroys a single Spell/Trap; chaining it needs Step 1. |
| Nibiru, the Primal Being | 2/0/3 | Missing — engine | CHAIN, HAND, TRIG, TOKEN, CONTROL | Step 2 + beyond §6 | After the opponent's 5th Summon: Tribute all monsters, give the opponent a Token. |
| Noble Knight's Shield-Bearer | 0/1/0 | Missing — engine | VOCAB, GY | Step 3 |  |
| Radiant Typhoon Ascendance | 0/2/0 | Missing — engine | CHAIN, TRIG, VOCAB, GY | Step 3 |  |
| Radiant Typhoon Chant | 0/1/0 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 |  |
| Radiant Typhoon Eldam | 0/3/0 | Missing — engine | LOCK, VOCAB, GY | Step 3 |  |
| Radiant Typhoon Fonix, the Great Flame | 0/1/0 | Missing — engine | CHAIN, GY | Step 3 |  |
| Radiant Typhoon Krosea | 0/3/0 | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |
| Radiant Typhoon Mandate | 0/1/0 | Missing — engine | CHAIN, TRIG, GY, CONT | Step 3 |  |
| Radiant Typhoon Manifestation | 0/1/0 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 |  |
| Radiant Typhoon Meghala | 0/1/0 | Missing — engine | CHAIN, LOCK, VOCAB, GY | Step 3 |  |
| Radiant Typhoon Swen | 0/3/0 | Missing — engine | LOCK, VOCAB, GY | Step 3 | Self-SS if MST is in GY or opponent has no Spells/Traps; on Summon search a RT Spell/Trap or MST. |
| Radiant Typhoon Varuroon, the Vibrant Vortex | 0/1/0 | Missing — engine | CHAIN, HAND, GY | Step 3 |  |
| Radiant Typhoon Vision | 0/3/3 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 | Modal Quick-Play (draw 2 then discard, or add MST); Sets itself if destroyed by MST. |
| Shiina, Twin Tempests of Celestial Thunder | 0/3/0 | Missing — engine | CHAIN, HAND | Step 1 |  |
| Sleepy Scapegoats | 1/0/3 | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, TOKEN | Step 3 + beyond §6 | 4 Sheep Tokens, then SS Swiftwind Panther Warrior from Deck; Token as destruction substitute. |
| Super Polymerization | 0/3/0 (main+side) | Missing — engine | CHAIN, LOCK, FUS-EFF | Step 3 |  |
| Swiftwind Panther Warrior | 3/0/3 | Missing — engine | CHAIN, HAND, VOCAB | Step 3 | Quick Effect: Tribute 1, then SS a DTW monster from hand/Deck or send a DTW Spell/Trap to the GY. |
| The Fallen & The Virtuous | 0/0/2 | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| The Great Gallant Bandit | 0/3/3 (main+side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| The Phantom Knights of Doomed Soleret | 3/0/0 | Missing — engine | LOCK, VOCAB, GY | Step 3 |  |
| The Phantom Knights of Umbrage Veil | 1/0/0 | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Albion the Branded Dragon | 0/0/1 (extra) | Missing — engine | TRIG, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Black Rose Dragon | 0/0/1 (extra) | Missing — engine | TRIG, VOCAB, GY, SYN | Step 4 |  |
| Blackwing - Nothung the Starlight | 0/0/1 (extra) | Missing — engine | TRIG, SYN | Step 4 |  |
| Chronomaly Vimana | 1/0/0 (extra) | Missing — engine | CHAIN, GY, XYZ | Step 4 |  |
| Cooky★Yummy Way | 0/0/1 (extra) | Missing — engine | CHAIN, TRIG, GY, SYN | Step 4 |  |
| CXyz Hope Chaos Barian Dragon | 1/0/0 (extra) | Missing — engine | XYZ | Step 4 |  |
| CXyz N.As.Ch. Knight | 1/0/0 (extra) | Missing — engine | XYZ | Step 4 |  |
| Divine Arsenal AA-ZEUS - Sky Thunder | 1/0/0 (extra) | Missing — engine | CHAIN, HAND, XYZ | Step 4 |  |
| Ecclesia and the Dark Dragon | 0/0/1 (extra) | Missing — engine | CHAIN, VOCAB, GY, SYN | Step 4 |  |
| Elder Entity Norden | 0/1/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, FUS-MAT | Step 4 |  |
| Favorite HERO Flame Wingman | 0/1/0 (extra) | Missing — engine | CHAIN, HAND, TRIG, FUS-EFF, FUS-MAT | Step 4 |  |
| Favorite HERO Shining Flare Wingman | 0/1/0 (extra) | Missing — engine | TRIG, GY, FUS-MAT | Step 4 |  |
| Garura, Wings of Resonant Life | 0/1/0 (extra) | Missing — engine | TRIG, FUS-MAT | Step 4 |  |
| Greatfly | 0/1/0 (extra) | Missing — engine | TRIG, GY, LINK | Step 4 |  |
| Hraesvelgr, the Desperate Doom Eagle | 0/1/0 (extra) | Missing — engine | CHAIN, LINK | Step 4 |  |
| I:P Masquerena | 1/0/0 (extra) | Missing — engine | CHAIN, LINK | Step 4 |  |
| Infernal Strike Fighter | 0/0/1 (extra) | Missing — engine | CHAIN, TRIG, GY, SYN | Step 4 |  |
| K9-17 "Ripper" | 1/0/0 (extra) | Missing — engine | CHAIN, VOCAB, XYZ | Step 4 |  |
| K9-66X "Jacks" | 1/0/0 (extra) | Missing — engine | TRIG, XYZ | Step 4 |  |
| K9-X "Werewolf" | 1/0/0 (extra) | Missing — engine | CHAIN, VOCAB, XYZ | Step 4 |  |
| Link Spider | 0/0/1 (extra) | Missing — engine | LINK | Step 4 |  |
| Linkuriboh | 0/0/1 (extra) | Missing — engine | CHAIN, GY, LINK | Step 4 |  |
| M-X-Saber Invoker | 1/0/0 (extra) | Missing — engine | TRIG, VOCAB, XYZ | Step 4 |  |
| Maple Maiden | 0/1/0 (extra) | Missing — engine | TRIG, SYN | Step 4 |  |
| Mudragon of the Swamp | 0/1/0 (extra) | Missing — engine | CHAIN, LOCK, FUS-MAT | Step 4 |  |
| N.As.H. Knight | 1/0/0 (extra) | Missing — engine | CHAIN, XYZ | Step 4 |  |
| Number 104: Masquerade | 1/0/0 (extra) | Missing — engine | CHAIN, XYZ | Step 4 |  |
| Number C104: Umbral Horror Masquerade | 1/0/0 (extra) | Missing — engine | CHAIN, TRIG, XYZ | Step 4 |  |
| Phantom Fortress Enterblathnir | 0/1/0 (extra) | Missing — engine | VOCAB, XYZ | Step 4 |  |
| Radiant Typhoon Varuroon, the Marine Eidolon | 0/2/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Red-Eyes Black Dragon Exceed | 2/1/1 (extra) | Missing — engine | TRIG, LOCK, FUS-EFF, FUS-MAT | Step 4 | Red-Eyes Black Dragon + 1 DTW monster, or SS by Tribute on a turn DTW destroyed a monster; unaffected by opponent's activated Spells/monster effects. |
| S:P Little Knight | 1/1/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/0/1 (extra) | Missing — engine | LOCK, XYZ | Step 4 |  |
| The Legendary Insect Queen | 0/0/3 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, FUS-EFF, FUS-MAT, TOKEN | Step 4 + beyond §6 | Fusion, or SS by Tributing DTW monsters / Level 1 EARTH Tokens; on SS adds 2 DTW cards from GY/banishment. |
| Topologic Trisbaena | 0/0/1 (extra) | Missing — engine | TRIG, VOCAB, LINK | Step 4 |  |
| Totem Bird | 0/1/0 (extra) | Missing — engine | CHAIN, XYZ | Step 4 |  |
| Wynn the Wind Charmer, Verdant | 0/1/0 (extra) | Missing — engine | VOCAB, LINK | Step 4 |  |
| Harpie's Feather Duster | 0/0/1 (side) | Automated | — | — | `clear-backrow`, scope `foe`. |
| PSY-Frame Driver | 1/0/0 (side) | Missing — data | — | — | Normal Monster: one `real("psy-frame-driver")` line plus its card-art entry. |
| Ghost Mourner & Moonlit Chill | 2/0/0 (side) | Missing — engine | CHAIN, TRIG, LOCK | Step 2 |  |
| Hey, Space Trunade! | 0/1/2 (side) | Missing — engine | VOCAB | Step 3 | Return up to 2 cards to the hand; each player puts as many from hand on the Deck bottom. |
| Mulcharmy Fuwalos | 0/3/3 (side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Mulcharmy Purulia | 0/0/3 (side) | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on the opponent's Normal Summons/Special Summons from the hand (limit); hand shuffle at End Phase. |
| PSY-Framegear Delta | 3/0/0 (side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| PSY-Framegear Gamma | 1/0/0 (side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| Shared Ride | 0/2/0 (side) | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Skull Meister | 2/0/0 (side) | Missing — engine | CHAIN, HAND | Step 1 |  |
| Solemn Accusation | 3/2/2 (side) | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |
| Solemn Judgment | 0/0/1 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: pay half LP; negate a Summon or a Spell/Trap activation. |
| Typhoon | 3/0/0 (side) | Missing — engine | CHAIN, VOCAB | Step 3 | Destroy 1 face-up Spell/Trap; may be activated from the hand under a condition. |

## 6. Blue-Eyes

Lists used (YGOPRODeck, category "Tournament Meta Decks"):

1. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-745513): Spanish Fork WCQ Regional - November 14th 2026, **Top 4**; 45 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-19.
2. [Primite Blue-Eyes](https://ygoprodeck.com/deck/primite-blue-eyes-744628): UAE Open 2027 - November 8th 2026, **Top 4**; 44 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-14.

Both lists are **Primite Blue-Eyes** (every TCG topping list with "Blue-Eyes" in its name on the first page of YGOPRODeck's search since mid-March 2026 is Primite Blue-Eyes). Academy's Blue-Eyes (Kaiba's deck and the starter) is the anime set: Blue-Eyes White Dragon, Alternative, Twin Burst, Ultimate and Spirit Dragon. Spirit Dragon is the one Extra Deck card of these lists that Academy already plays, simplified. The modern engine (Sage with Eyes of Blue, Maiden of White, Wishes for Eyes of Blue, Spirit with Eyes of Blue, Primite) is the same set that `duel-engine-meta-cards.md` §6 Step 3 names as its first target.

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Blue-Eyes White Dragon | 2/2 | Automated | — | — | Normal Monster. |
| Ash Blossom & Joyous Spring | 3/3 | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| Effect Veiler | 3/1 | Partial | CHAIN | Step 1 | `hand: "veiler"`: only in answer to a pending Summon/Spell in the opponent's Main Phase (`engine.ts:628`), not at any moment of it. |
| Bingo Machine, Go!!! | 1/0 | Missing — engine | VOCAB | Step 3 |  |
| Blue-Eyes White Dragon, the White Phantom Beast | 1/0 | Missing — engine | CHAIN, HAND, TRIG, LOCK, VOCAB | Step 3 |  |
| Bystial Magnamhut | 1/1 | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 |  |
| Deep-Eyes White Dragon, the Blue Abyss | 3/0 | Missing — engine | VOCAB, GY | Step 3 |  |
| Dominus Purge | 3/3 | Missing — engine | CHAIN, LOCK, VOCAB, GY | Step 3 |  |
| Droll & Lock Bird | 1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Ghost Ogre & Snow Rabbit | 3/3 | Missing — engine | CHAIN, HAND | Step 1 | Destroy a card whose effect was activated on the field. |
| Infinite Impermanence | 2/3 | Missing — engine | CHAIN, LOCK | Step 2 | Negate a face-up monster; from the hand if you control no cards; column lock if Set. |
| Maiden of White | 3/3 | Missing — engine | CHAIN, HAND, TRIG, GY | Step 3 |  |
| Majesty of the White Dragons | 1/1 | Missing — engine | CHAIN, VOCAB, GY, RITUAL | Step 3 |  |
| Mausoleum of White | 1/1 | Missing — engine | TRIG, VOCAB, GY, CONT | Step 3 |  |
| Mulcharmy Fuwalos | 3/3 | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Neo Kaiser Sea Horse | 0/1 | Missing — engine | TRIG, VOCAB | Step 3 |  |
| Nibiru, the Primal Being | 2/2 (side+main) | Missing — engine | CHAIN, HAND, TRIG, TOKEN, CONTROL | Step 2 + beyond §6 | After the opponent's 5th Summon: Tribute all monsters, give the opponent a Token. |
| Pot of Prosperity | 1/1 | Missing — engine | LOCK, VOCAB | Step 3 | Banish 3 or 6 from the Extra Deck face-down, look at that many cards, add 1; halved damage. |
| Primite Dragon Ether Beryl | 1/3 | Missing — engine | TRIG, VOCAB, GY | Step 3 |  |
| Primite Drillbeam | 1/1 | Missing — engine | CHAIN, VOCAB, GY, TOKEN | Step 3 + beyond §6 |  |
| Primite Lordly Lode | 3/3 | Missing — engine | TRIG, LOCK, VOCAB, GY, CONT | Step 3 |  |
| Roar of the Blue-Eyed Dragons | 1/1 | Missing — engine | LOCK, VOCAB, GY, FUS-EFF | Step 3 |  |
| Sage with Eyes of Blue | 3/3 | Missing — engine | TRIG, VOCAB | Step 3 |  |
| True Light | 1/1 | Missing — engine | CHAIN, LOCK, VOCAB, GY, CONT | Step 3 |  |
| Wishes for Eyes of Blue | 3/3 | Missing — engine | VOCAB, GY | Step 3 |  |
| Blue-Eyes Spirit Dragon | 3/3 (extra) | Partial | CHAIN | Step 1 | Synchro (`synchroNonTuner`), `oneAtATime` and `tribute-synchro` are in; the GY negation only stops a sent-to-GY monster trigger (`engine.ts:694`), not any GY effect; the Tribute is not a Quick Effect on the opponent's turn. |
| Ancient Fairy Life Dragon | 1/1 (extra) | Missing — engine | TRIG, VOCAB, SYN | Step 4 |  |
| Azure-Eyes Silver Dragon | 0/1 (extra) | Missing — engine | TRIG, LOCK, GY, SYN | Step 4 |  |
| Black Rose Moonlight Dragon | 1/0 (extra) | Missing — engine | TRIG, SYN | Step 4 |  |
| Blue-Eyes Tyrant Dragon | 1/1 (extra) | Missing — engine | GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Blue-Eyes Ultimate Spirit Dragon | 1/1 (extra) | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, GY, SYN | Step 4 |  |
| Cosmic Blazar Dragon | 0/1 (extra) | Missing — engine | CHAIN, VOCAB, SYN | Step 4 |  |
| Crimson Dragon | 0/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, SYN | Step 4 |  |
| Hieratic Seal of the Heavenly Spheres | 1/1 (extra) | Missing — engine | CHAIN, HAND, LINK | Step 4 |  |
| Lightstorm Dragon | 1/1 (extra) | Missing — engine | TRIG, GY, SYN | Step 4 |  |
| Neo Blue-Eyes Ultimate Dragon | 1/1 (extra) | Missing — engine | CHAIN, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Psychic End Punisher | 1/1 (extra) | Missing — engine | VOCAB, SYN | Step 4 |  |
| S:P Little Knight | 1/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Spirit with Eyes of Blue | 3/2 (extra) | Missing — engine | CHAIN, TRIG, LOCK, VOCAB, GY, LINK | Step 4 |  |
| Artifact Lancea | 3/0 (side) | Missing — engine | CHAIN, HAND, LOCK, VOCAB | Step 3 |  |
| Dragon's Mind | 0/3 (side) | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Evenly Matched | 3/0 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Hey, Space Trunade! | 0/3 (side) | Missing — engine | VOCAB | Step 3 | Return up to 2 cards to the hand; each player puts as many from hand on the Deck bottom. |
| Maple Maiden | 1/0 (side) | Missing — engine | TRIG, SYN | Step 4 |  |
| Mistaken Arrest | 0/3 (side) | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Shiina, Twin Tempests of Celestial Thunder | 3/0 (side) | Missing — engine | CHAIN, HAND | Step 1 |  |
| Skull Meister | 0/3 (side) | Missing — engine | CHAIN, HAND | Step 1 |  |
| Solemn Accusation | 2/0 (side) | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |
| Solemn Judgment | 1/0 (side) | Missing — engine | CHAIN | Step 1 | Counter Trap: pay half LP; negate a Summon or a Spell/Trap activation. |
| The Great Gallant Bandit | 0/3 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |

## 7. Radiant Typhoon

Lists used (YGOPRODeck, category "Tournament Meta Decks"):

1. [Radiant Typhoon](https://ygoprodeck.com/deck/radiant-typhoon-744500): Christchurch WCQ Regional - November 7th 2026, **1st Place**; 40 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-13.
2. [Radiant Typhoon](https://ygoprodeck.com/deck/radiant-typhoon-745053): Toronto WCQ Regional - November 14th 2026, **2nd Place**; 40 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-16.

Both lists are pure Radiant Typhoon. The archetype is built around Mystical Space Typhoon (its monsters Special Summon themselves "if you have 'Mystical Space Typhoon' in your GY", its Spells Set themselves when destroyed by it; YGOPRODeck card text), so even the base card needs a "destroy 1 Spell/Trap" action Junior does not have, and the deck's whole plan needs the chain stack (Step 1): it destroys its own Quick-Play Spells in response to activate them again.

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3 | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| Droll & Lock Bird | 1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Fire Formation - Tenki | 0/1 | Missing — engine | TRIG, VOCAB, CONT | Step 3 |  |
| Forbidden Crown | 2/0 | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Mulcharmy Fuwalos | 3/3 (main+side) | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Mystical Space Typhoon | 3/3 | Missing — engine | CHAIN, VOCAB | Step 3 | Destroy 1 Spell/Trap: no Junior effect destroys a single Spell/Trap; chaining it needs Step 1. |
| Noble Knight's Shield-Bearer | 1/1 | Missing — engine | VOCAB, GY | Step 3 |  |
| Radiant Typhoon Ascendance | 2/3 | Missing — engine | CHAIN, TRIG, VOCAB, GY | Step 3 |  |
| Radiant Typhoon Chant | 1/1 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 |  |
| Radiant Typhoon Eldam | 3/3 | Missing — engine | LOCK, VOCAB, GY | Step 3 |  |
| Radiant Typhoon Fonix, the Great Flame | 1/1 | Missing — engine | CHAIN, GY | Step 3 |  |
| Radiant Typhoon Krosea | 3/3 | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |
| Radiant Typhoon Mandate | 1/1 | Missing — engine | CHAIN, TRIG, GY, CONT | Step 3 |  |
| Radiant Typhoon Manifestation | 1/3 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 |  |
| Radiant Typhoon Meghala | 2/3 | Missing — engine | CHAIN, LOCK, VOCAB, GY | Step 3 |  |
| Radiant Typhoon Swen | 3/3 | Missing — engine | LOCK, VOCAB, GY | Step 3 | Self-SS if MST is in GY or opponent has no Spells/Traps; on Summon search a RT Spell/Trap or MST. |
| Radiant Typhoon Varuroon, the Vibrant Vortex | 1/1 | Missing — engine | CHAIN, HAND, GY | Step 3 |  |
| Radiant Typhoon Vision | 3/3 | Missing — engine | CHAIN, TRIG, VOCAB | Step 3 | Modal Quick-Play (draw 2 then discard, or add MST); Sets itself if destroyed by MST. |
| Shiina, Twin Tempests of Celestial Thunder | 2/3 | Missing — engine | CHAIN, HAND | Step 1 |  |
| Super Polymerization | 2/3 | Missing — engine | CHAIN, LOCK, FUS-EFF | Step 3 |  |
| The Great Gallant Bandit | 2/3 (main+side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Favorite HERO Flame Wingman | 1/1 (extra) | Missing — engine | CHAIN, HAND, TRIG, FUS-EFF, FUS-MAT | Step 4 |  |
| Favorite HERO Shining Flare Wingman | 1/0 (extra) | Missing — engine | TRIG, GY, FUS-MAT | Step 4 |  |
| Garura, Wings of Resonant Life | 1/1 (extra) | Missing — engine | TRIG, FUS-MAT | Step 4 |  |
| Greatfly | 1/1 (extra) | Missing — engine | TRIG, GY, LINK | Step 4 |  |
| Hraesvelgr, the Desperate Doom Eagle | 1/1 (extra) | Missing — engine | CHAIN, LINK | Step 4 |  |
| Maple Maiden | 1/1 (extra) | Missing — engine | TRIG, SYN | Step 4 |  |
| Mudragon of the Swamp | 1/1 (extra) | Missing — engine | CHAIN, LOCK, FUS-MAT | Step 4 |  |
| Odin, Father of the Aesir | 1/0 (extra) | Missing — engine | TRIG, VOCAB, GY, SYN | Step 4 |  |
| Phantom Fortress Enterblathnir | 0/1 (extra) | Missing — engine | VOCAB, XYZ | Step 4 |  |
| Radiant Typhoon Varuroon, the Marine Eidolon | 3/2 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Relinquished Anima | 0/1 (extra) | Missing — engine | LINK, TOKEN | Step 4 + beyond §6 |  |
| Ritual Beast Ulti-Reirautari | 0/1 (extra) | Missing — engine | CHAIN, HAND, LOCK, VOCAB, LINK | Step 4 |  |
| S:P Little Knight | 1/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, LINK | Step 4 |  |
| Super Starslayer TY-PHON - Sky Crisis | 0/1 (extra) | Missing — engine | LOCK, XYZ | Step 4 |  |
| Totem Bird | 1/1 (extra) | Missing — engine | CHAIN, XYZ | Step 4 |  |
| Underworld Goddess of the Closed World | 1/0 (extra) | Missing — engine | CHAIN, TRIG, GY, LINK | Step 4 |  |
| Wynn the Wind Charmer, Verdant | 1/1 (extra) | Missing — engine | VOCAB, LINK | Step 4 |  |
| Dimensional Fissure | 3/0 (side) | Missing — engine | VOCAB, CONT | Step 3 |  |
| Evenly Matched | 3/3 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Lightning Storm | 2/0 (side) | Missing — engine | VOCAB | Step 3 | Modal: opponent's Attack Position monsters or their Spells/Traps; only if you control no face-up cards. |
| Mistaken Arrest | 2/0 (side) | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Pot of Sloth | 2/3 (side) | Missing — engine | LOCK | Step 2 |  |
| Solemn Accusation | 3/3 (side) | Missing — engine | CHAIN, LOCK, VOCAB | Step 3 |  |

## 8. Branded (Despia / Fallen of Albaz)

Lists used (YGOPRODeck, category "Tournament Meta Decks"):

1. [Despia Branded](https://ygoprodeck.com/deck/despia-branded-744492): Carcassonne WCQ Regional - November 8th 2026, **Top 4**; 41 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-13.
2. [Branded Dracotail](https://ygoprodeck.com/deck/branded-dracotail-744499): Christchurch WCQ Regional - November 7th 2026, **2nd Place**; 40 Main / 15 Extra / 15 Side; published on YGOPRODeck 2026-11-13.

List 1 is Despia Branded, list 2 Branded Dracotail; the Branded Light and Darkness Ritual hybrid is in §3's notes. Every Extra Deck card is a Fusion Monster, but almost all are summoned by Branded Fusion / Super Polymerization style effects that use the Deck, the opponent's field or the GY as material sources (FUS-EFF, Step 3) and describe their materials (FUS-MAT, Step 4). Junior's Polymerization takes materials from hand or field only (`cards.ts:104`, `:383`).

Copies are given per list in the order above (`3/0` = 3 in list 1, none in list 2); a zone in brackets means the card is not (only) in the Main Deck.

| Card | Copies | Status | Needs | Step | Note |
| --- | --- | --- | --- | --- | --- |
| Ash Blossom & Joyous Spring | 3/3 | Partial | CHAIN | Step 1 | `hand: "ash"`: negates only a Spell that searches, Special Summons from the Deck or draws (`engine.ts:476-481`, `:627`); not monster effects, not "send from Deck to GY"; only at the one pending moment. |
| Effect Veiler | 2/0 | Partial | CHAIN | Step 1 | `hand: "veiler"`: only in answer to a pending Summon/Spell in the opponent's Main Phase (`engine.ts:628`), not at any moment of it. |
| Aluber the Jester of Despia | 3/1 | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Blazing Cartesia, the Virtuous | 2/2 | Missing — engine | CHAIN, HAND, TRIG, GY, FUS-EFF | Step 3 |  |
| Branded Fusion | 1/1 | Missing — engine | LOCK, FUS-EFF | Step 3 |  |
| Branded in High Spirits | 1/1 | Missing — engine | CHAIN, TRIG, VOCAB, GY | Step 3 |  |
| Branded Opening | 1/1 | Missing — engine | CHAIN, LOCK, VOCAB, GY | Step 3 |  |
| Dogmatika Ecclesia, the Virtuous | 1/1 | Missing — engine | TRIG, LOCK, VOCAB | Step 3 |  |
| Dracotail Faimena | 0/3 | Missing — engine | CHAIN, HAND, TRIG, VOCAB, FUS-EFF | Step 3 |  |
| Dracotail Flame | 0/1 | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Dracotail Horn | 0/1 | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Dracotail Lukias | 0/2 | Missing — engine | TRIG, VOCAB, FUS-EFF | Step 3 |  |
| Dracotail Mululu | 0/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK, VOCAB, FUS-EFF | Step 3 |  |
| Dracotail Pan | 0/1 | Missing — engine | TRIG, VOCAB, GY, FUS-EFF | Step 3 |  |
| Dracotail Phryxul | 0/1 | Missing — engine | TRIG, VOCAB, GY, FUS-EFF | Step 3 |  |
| Dracotail Urgula | 0/1 | Missing — engine | TRIG, VOCAB, GY, FUS-EFF | Step 3 |  |
| Droll & Lock Bird | 1/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK | Step 2 | After a card is added from Deck to hand outside the Draw Phase: none for the rest of the turn. |
| Fallen of Albaz | 1/1 | Missing — engine | LOCK, FUS-EFF | Step 3 |  |
| Fallen of the White Dragon | 2/2 | Missing — engine | LOCK, VOCAB | Step 3 |  |
| Ghost Ogre & Snow Rabbit | 3/2 | Missing — engine | CHAIN, HAND | Step 1 | Destroy a card whose effect was activated on the field. |
| Gold Sarcophagus | 1/0 | Missing — engine | VOCAB | Step 3 |  |
| Guiding Quem, the Virtuous | 1/1 | Missing — engine | TRIG, VOCAB, GY | Step 3 |  |
| Ido the Supreme Magical Force | 1/0 | Missing — engine | TRIG | Step 2 |  |
| Incredible Ecclesia, the Virtuous | 2/1 | Missing — engine | CHAIN, HAND, TRIG, LOCK, GY | Step 3 |  |
| Infinite Impermanence | 0/3 | Missing — engine | CHAIN, LOCK | Step 2 | Negate a face-up monster; from the hand if you control no cards; column lock if Set. |
| Ketu Dracotail | 0/1 | Missing — engine | VOCAB, FUS-EFF | Step 3 |  |
| Mulcharmy Fuwalos | 3/3 | Missing — engine | CHAIN, HAND, TRIG, VOCAB | Step 3 | Draws on the opponent's Special Summons from Deck/Extra Deck; hand shuffle at End Phase. |
| Nadir Servant | 3/0 | Missing — engine | LOCK, VOCAB, GY | Step 3 |  |
| Rahu Dracotail | 0/1 | Missing — engine | LOCK, FUS-EFF | Step 3 |  |
| Springans Kitt | 1/0 | Missing — engine | VOCAB, GY | Step 3 |  |
| Super Polymerization | 3/3 (main+side) | Missing — engine | CHAIN, LOCK, FUS-EFF | Step 3 |  |
| The Fallen & The Virtuous | 3/3 | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Tri-Brigade Mercourier | 1/0 | Missing — engine | CHAIN, HAND, VOCAB | Step 3 |  |
| Tri-Brigade Springans Kitt | 1/0 | Missing — engine | TRIG, LOCK, GY | Step 3 |  |
| Albion the Sanctifire Dragon | 1/1 (extra) | Missing — engine | CHAIN, LOCK, GY, FUS-MAT | Step 4 |  |
| Despian Quaeritis | 1/0 (extra) | Missing — engine | CHAIN, LOCK, VOCAB, FUS-MAT | Step 4 |  |
| Dracotail Arthalion | 0/2 (extra) | Missing — engine | TRIG, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Dracotail Gulamel | 0/1 (extra) | Missing — engine | CHAIN, VOCAB, GY, FUS-MAT | Step 4 |  |
| Ecclesia and the Dark Dragon | 1/1 (extra) | Missing — engine | CHAIN, VOCAB, GY, SYN | Step 4 |  |
| Favorite HERO Shining Flare Wingman | 1/0 (extra) | Missing — engine | TRIG, GY, FUS-MAT | Step 4 |  |
| Granguignol the Dusk Dragon | 2/1 (extra) | Missing — engine | TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Hyperinvoked Aeon | 1/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Khaos Starsource Dragon | 0/1 (extra) | Missing — engine | TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Lubellion the Searing Dragon | 1/1 (extra) | Missing — engine | TRIG, LOCK, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Mirrorjade the Iceblade Dragon | 1/1 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, FUS-EFF, FUS-MAT | Step 4 |  |
| Mixousia the Confounder | 1/1 (extra) | Missing — engine | CHAIN, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Rindbrumm the Striking Dragon | 1/0 (extra) | Missing — engine | CHAIN, VOCAB, GY, FUS-MAT | Step 4 |  |
| Secreterion Dragon | 0/1 (extra) | Missing — engine | LOCK, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| The Dragon that Devours the Dogma | 2/2 (extra) | Missing — engine | TRIG, VOCAB, GY, FUS-MAT | Step 4 |  |
| The Three Champions of Swordsoul | 1/0 (extra) | Missing — engine | CHAIN, TRIG, VOCAB, GY, SYN | Step 4 |  |
| Titaniklad the Ash Dragon | 1/1 (extra) | Missing — engine | TRIG, LOCK, VOCAB, GY, FUS-EFF, FUS-MAT | Step 4 |  |
| Harpie's Feather Duster | 0/1 (side) | Automated | — | — | `clear-backrow`, scope `foe`. |
| Cosmic Cyclone | 1/0 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Dracotail Sting | 0/1 (side) | Missing — engine | CHAIN, VOCAB, GY | Step 3 |  |
| Evenly Matched | 0/3 (side) | Missing — engine | CHAIN, VOCAB | Step 3 |  |
| Garura, Wings of Resonant Life | 1/0 (side) | Missing — engine | TRIG, FUS-MAT | Step 4 |  |
| Hey, Space Trunade! | 1/0 (side) | Missing — engine | VOCAB | Step 3 | Return up to 2 cards to the hand; each player puts as many from hand on the Deck bottom. |
| Mistaken Arrest | 3/0 (side) | Missing — engine | CHAIN, LOCK | Step 2 |  |
| Mulcharmy Purulia | 3/2 (side) | Missing — engine | CHAIN, HAND, TRIG | Step 2 | Draws on the opponent's Normal Summons/Special Summons from the hand (limit); hand shuffle at End Phase. |
| Nibiru, the Primal Being | 3/2 (side) | Missing — engine | CHAIN, HAND, TRIG, TOKEN, CONTROL | Step 2 + beyond §6 | After the opponent's 5th Summon: Tribute all monsters, give the opponent a Token. |
| Triple Tactics Thrust | 0/3 (side) | Missing — engine | VOCAB | Step 3 |  |
| Typhoon | 3/0 (side) | Missing — engine | CHAIN, VOCAB | Step 3 | Destroy 1 face-up Spell/Trap; may be activated from the hand under a condition. |

## 9. Engine mechanisms ranked by the cards they unlock

Over the 295 unique cards of all lists (266 without Side-only cards), 290 need engine work or finish a Partial card (263 without Side-only). A card usually needs several mechanisms, so the counts overlap: "cards that need it" is how many cards stay unplayable while that mechanism is missing.

| Rank | Code | Mechanism | §6 step | Cards that need it (all) | Main+Extra only |
| ---: | --- | --- | --- | ---: | ---: |
| 1 | VOCAB | Effect vocabulary: Deck/hand/field actions with archetype filters (search, summon, send, banish, Set, costs) | Step 3 | 190 | 173 |
| 2 | CHAIN | Chain stack, Spell Speed, Quick Effects, negation | Step 1 | 157 | 137 |
| 3 | TRIG | Event triggers (on Summon, sent to GY, End Phase, opponent Summons) | Step 2 | 125 | 118 |
| 4 | GY | Effects activated from the GY or banishment | Step 3 | 114 | 111 |
| 5 | LOCK | Turn locks and continuous restrictions | Step 2 | 84 | 78 |
| 6 | HAND | Hand traps (effect from the hand on the opponent's turn) | Step 1 | 41 | 36 |
| 7 | FUS-EFF | Fusion Summon by card effect (from Deck/GY/banished, other zones) | Step 3 | 39 | 39 |
| 8 | FUS-MAT | Fusion Monsters with described materials | Step 4 | 38 | 38 |
| 9 | LINK | Link Monsters and Link Arrows | Step 4 | 34 | 34 |
| 10 | SYN | Generic Synchro | Step 4 | 23 | 23 |
| 11 | XYZ | Xyz materials and detach costs | Step 4 | 19 | 19 |
| 12 | CONT | Continuous / Field Spells-Traps with activated effects | Step 3 | 14 | 13 |
| 13 | TOON | "Toon World" status (treated as Toon, name-becoming Field Spell) | Step 5 | 7 | 7 |
| 14 | TOKEN | Tokens | not in §6 | 6 | 6 |
| 15 | RITUAL | General Ritual (several monsters, GY banish as Tribute, Ritual Monster effects) | Step 3 | 5 | 5 |
| 16 | CTR | Counters on cards | not in §6 | 2 | 2 |
| 17 | CONTROL | Summon to / control of the opponent's field | not in §6 | 2 | 1 |
| 18 | EQ-MON | Monsters equipped as Equip Spells | not in §6 | 1 | 1 |
| 19 | DICE | Dice rolls | not in §6 | 1 | 1 |

Cumulative effect of the plan, on the same unique cards (cards needing engine work or Partial):

| After | Fully playable (all) | Main+Extra only |
| --- | ---: | ---: |
| Step 1 | 13 of 290 | 9 of 263 |
| Step 2 | 26 of 290 | 17 of 263 |
| Step 3 | 163 of 290 | 137 of 263 |
| Step 4 | 272 of 290 | 246 of 263 |
| Step 5 | 279 of 290 | 253 of 263 |
| never, within §6 | 11 (need Tokens, dice, counters, control change or monsters as Equips) | 10 |

## 10. What could be added now

### 10.1 As data only (no engine change)

| Card | Deck(s) | How |
| --- | --- | --- |
| PSY-Frame Driver | Toon (Side), Dark Time Wizard (Side) | A Normal Monster: an entry in `card-art.json` (passcode 49036338 per the YGOPRODeck API), `pnpm --filter academy-ygo cards:art`, then `"psy-frame-driver": real("psy-frame-driver")` in `cards.ts`, plus the three copy files. |

That is the only one. Every other missing card has at least one effect that no existing tag in `cards.ts:6-113`
expresses.

### 10.2 One small, local change each **(ours)**

These are not "data only", but each needs one new value or one new tag in the existing style, with no new engine
mechanism. They are listed because they are cheap, not because they make any deck playable.

| Card | Deck(s) | Change |
| --- | --- | --- |
| Toon Table of Contents | Toon | "Add 1 'Toon' card from your Deck": a `search-pick` with a new `DeckPool` value; `inPool` (`cards.ts:159`) accepts only Main Deck monsters today, so it must also accept Spells/Traps. |
| Terraforming | Toon, Destiny HERO | "Add 1 Field Spell from your Deck": same, a pool of Field Spells. |
| Mystical Space Typhoon, Typhoon | Radiant Typhoon, Dark Time Wizard, Toon, Destiny HERO, Branded | A new "destroy 1 Spell/Trap on the field" tag (Junior only has "destroy all of them", `clear-backrow`). Used on your own turn only until Step 1; Typhoon's "from the hand" condition is extra. |
| Lightning Storm | Radiant Typhoon (Side) | A modal Spell: its two modes are close to `destroy-all` (but only Attack Position monsters) and `clear-backrow` scope `foe`; the condition "if you control no face-up cards" and the mode choice are new. |
| One for One | Toon (Side) | `call` names one card (`cards.ts:22`); this needs "1 Level 1 monster" as a filter and "send 1 monster from your hand" as a cost (`Cost` has only discard, half LP, banish from Deck). |
| Dark Time Wizard, first effect | Dark Time Wizard | The search half fits a `search-pick` whose pool is "cards that mention 'Dark Time Wizard'", which `mentions()` (`cards.ts:330`) can already answer; the End Phase return from the GY needs Step 2. Only useful once the cards it searches exist. |

## 11. Method and limits

1. **Lists.** YGOPRODeck's deck search (the `/api/decks/getDecks.php` endpoint its own search page calls) was queried
   by deck name in the categories "Tournament Meta Decks" (TCG) and "Tournament Meta Decks OCG". For each archetype the
   newest topping TCG lists were taken (1st/2nd place first), plus an OCG list where the TCG has no pure build (Dark
   Time Wizard). Each deck page was downloaded and its Main, Extra and Side sections parsed (card name, passcode, copies).
2. **Card data.** All 297 passcodes were sent to `cardinfo.php?id=...&misc=yes`; alternate-art passcodes were merged to
   the card's main id (295 unique cards).
3. **Academy match.** By passcode against `card-art.json` (272 entries; the `card` field) and by English name against
   `card-art.ts`. Both gave the same 9 cards. No renamed-id card (the Red Medicine kind) matched.
4. **Status of Academy cards.** Read by hand: the card's entry in `cards.ts`, its printed text in `card-art.ts`, and the
   engine branch (`engine.ts` lines cited in the tables).
5. **Mechanisms of missing cards.** A keyword pass over each card's English text and type assigned mechanism codes
   (for example "Quick Effect", Quick-Play, Traps and "negate" → CHAIN; "If this card is ... Summoned", "is sent to the
   GY", "End Phase" → TRIG; "from your Deck" → VOCAB; Link/Xyz/Synchro type → LINK/XYZ/SYN), then about 50 cards were
   read and corrected by hand (the archetype cores, the hand traps, the Dark Time Wizard series, and every card the pass
   left without a code). The **Step** column is the highest §6 step among a card's codes; "beyond §6" means a code the
   plan does not cover. Precision is that of a keyword pass: a card can carry one code too many or too few (§12), so
   treat the per-card codes as a first sort, and the totals in §1 and §9 as orders of magnitude.

## 12. Unverified

- **Per-card mechanism codes** were not each checked against the card text; see §11.5. The hand-read cards carry a note.
- **"Most played" Light and Darkness Ritual variant.** Based on the first page (20 results, events 2026-10-31 to 2026-11-20) of
  YGOPRODeck's TCG tournament search for the name on 2026-11-22, not on a full count or a tier list.
- **Gearfried the Steel Knight and Time Engine.** A search-result summary of Yugipedia's "Dark Time Wizard (series)"
  page named Gearfried the Steel Knight and Time Engine among the series' key cards; their YGOPRODeck texts do not
  mention "Dark Time Wizard" (Time Engine is a Metalmorph card from 2024), so they are left out. Yugipedia was not
  opened.
- **Swiftwind Panther Warrior and Red-Eyes Black Dragon Exceed** are in YGOPRODeck's *Beyond the Brave* set listing but
  their set codes were not read; they are not in the API's "Dark Time Wizard" archetype field either (they mention the
  card, which is how they were found).
- **Black Luster Soldier - Soldier of Light and Darkness** is EARTH in the YGOPRODeck data, not LIGHT; "light and
  darkness" is the deck's theme, not its Attributes.
- **Ash Blossom and draws.** Junior treats a draw Spell as something Ash can negate (`engine.ts:480`); Ash's printed
  text (`card-art.ts:284`, from YGOPRODeck) lists adding from the Deck, Special Summoning from the Deck and sending from the Deck
  to the GY. Already raised in `duel-engine-meta-cards.md` §7; not settled here.
- **Release dates** (TCG/OCG) are YGOPRODeck's `misc_info` fields, not Konami's product pages.
- **Konami's database** was opened only for Dark Time Wizard (cid 23374) and Light and Darkness Ritual (cid 22993);
  every other card text is YGOPRODeck's.

## Sources

Fetched 2026-11-22.

- YGOPRODeck deck search API used by its search page: `https://ygoprodeck.com/api/decks/getDecks.php?&name=<archetype>&_sft_category=Tournament%20Meta%20Decks` (and `...%20OCG`).
- Deck lists (YGOPRODeck, Tournament Meta Decks):
  [tri-brigade-toon-745141](https://ygoprodeck.com/deck/tri-brigade-toon-745141),
  [toon-745046](https://ygoprodeck.com/deck/toon-745046),
  [ars-magna-light-and-darkness-ritual-744985](https://ygoprodeck.com/deck/ars-magna-light-and-darkness-ritual-744985),
  [light-and-darkness-ritual-745851](https://ygoprodeck.com/deck/light-and-darkness-ritual-745851),
  [branded-light-and-darkness-ritual-745056](https://ygoprodeck.com/deck/branded-light-and-darkness-ritual-745056) (context only),
  [destiny-hero-743381](https://ygoprodeck.com/deck/destiny-hero-743381),
  [destiny-hero-745166](https://ygoprodeck.com/deck/destiny-hero-745166),
  [k9-dark-time-wizard-743935](https://ygoprodeck.com/deck/k9-dark-time-wizard-743935),
  [dark-time-wizard-radiant-typhoon-742563](https://ygoprodeck.com/deck/dark-time-wizard-radiant-typhoon-742563),
  [dark-time-wizard-743117](https://ygoprodeck.com/deck/dark-time-wizard-743117),
  [primite-blue-eyes-745513](https://ygoprodeck.com/deck/primite-blue-eyes-745513),
  [primite-blue-eyes-744628](https://ygoprodeck.com/deck/primite-blue-eyes-744628),
  [radiant-typhoon-744500](https://ygoprodeck.com/deck/radiant-typhoon-744500),
  [radiant-typhoon-745053](https://ygoprodeck.com/deck/radiant-typhoon-745053),
  [despia-branded-744492](https://ygoprodeck.com/deck/despia-branded-744492),
  [branded-dracotail-744499](https://ygoprodeck.com/deck/branded-dracotail-744499).
- YGOPRODeck card API: `https://db.ygoprodeck.com/api/v7/cardinfo.php` with `id=` (all 297 passcodes), `archetype=Dark Time Wizard`, `cardset=Beyond the Brave`, `fname=` and `misc=yes`; parameters as documented in the [API guide](https://ygoprodeck.com/api-guide/).
- Konami card database: [Dark Time Wizard](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=23374&request_locale=en), [Light and Darkness Ritual](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=22993&request_locale=en).
- This repo: `apps/academy-ygo/src/lib/junior/play/cards.ts`, `card-art.ts`, `card-art.json`, `engine.ts`, `master-decks.ts`; `docs/academy-junior-masters-plan.md`; `docs/research/duel-engine-meta-cards.md`.
