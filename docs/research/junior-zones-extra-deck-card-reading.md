# Junior: every zone, the Extra Deck and Ritual Summons, and reading a card

> **Date of observation:** 2026-11-17. Every web page, PDF and database record cited below was fetched that day.
> The repository was read on `main` at HEAD `907f435` (clean tree). Other sessions may edit the tree; code claims
> describe the files as they stood that day.
> **Nature of this document:** a research and design note. No code was changed and nothing was published.
>
> **The request (owner, lightly tidied):** for Junior, the children should also (1) learn every zone: Field Spell
> zone, Graveyard, banished, Extra Deck and the rest of the mat; (2) understand how to use the Extra Deck (Fusion,
> Synchro, Xyz, Link) and how to Ritual Summon; (3) learn how to read cards, possibly with questions about a
> specific card to check the player really read it (cost versus effect, Quick Effects, and others).
>
> **Sourcing rule used:** rules come from Konami's own documents: the TCG *Official Rulebook Version 10* (PDF), the
> *2021 Rules Update* page, the seven *Problem-Solving Card Text* (PSCT) articles, the *Fast Effect Timing* page, the
> Starter Deck *Beginner's Guide* and the *Speed Duel Guide*. Card text comes from Konami's card database
> (`db.yugioh-card.com`), English and French, copied from the fetched page. No wiki, forum or blog is the basis of
> any claim. Where Konami's documents are silent or contradict each other, the note says so; those points are
> collected in [§9](#9-unverified--could-not-confirm). Proposals and inferences are labelled **(ours)**.
>
> **How each source was read:** the PDFs were downloaded from Konami's servers and converted to text locally
> (`pdftotext`), then read; the web pages were downloaded and read as text. Diagrams inside the PDFs (the mat picture,
> card pictures, Link Arrows) do not survive text extraction, so nothing here relies on a picture.
>
> **Relation to existing notes.** [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) designed
> Junior play; [kids-interactive-academy.md](./kids-interactive-academy.md) covers audience, IP and privacy;
> [beginner-lessons-rules-audit.md](./beginner-lessons-rules-audit.md) records rules mistakes to avoid. This note
> does not repeat them.

---

## 1. Short answer

- **Junior today has a mat of two rows.** Three Monster Zones and three Spell & Trap Zones per side, a Deck count
  and a Graveyard count. There is no Field Zone, no Extra Deck, no Extra Monster Zone, no Pendulum Zone, no banished
  pile, no Special Summon of any kind, and the Graveyard cannot be opened. World 8 already teaches five card-reading
  rules (cost, Target, Quick Effect, once per turn, "When/If… you can") on invented cards (§2).
- **Zones: the published rulebook is out of date on one point that matters.** Rulebook v10 (2017) says Fusion,
  Synchro and Xyz Monsters go to the Extra Monster Zone. Konami's *2021 Rules Update* overrides it: they may be
  Summoned from the Extra Deck to **any Main Monster Zone**; only **Link Monsters and Pendulum Monsters Summoned from
  the Extra Deck** still need the Extra Monster Zone or a zone a Link Monster points to. Teach the 2021 rule (§3).
- **"Banished" is not a zone on the mat.** The rulebook has no banished zone; a banished card is "separated from the
  field", and PSCT Part 2 calls it "that special place not depicted on the Game Mat". Face-down banishing exists on
  card text (Pot of Desires) but no Konami rules document read here says who may look at such cards (§3, §9).
- **Extra Deck and Ritual: five procedures, each three steps in the rulebook.** Fusion needs a "Summoning card like
  Polymerization"; Synchro is exactly 1 Tuner plus non-Tuners with Levels adding up **exactly**; Xyz stacks
  same-Level monsters under the Xyz Monster and those materials "are not treated as cards on the field"; Link sends
  materials to the Graveyard, and Link Monsters "have no DEF and cannot ever be in Defense Position"; Ritual needs
  the Ritual Spell and the Ritual Monster in hand, and **the Ritual Spell's own text** says "equal 8 or more" or
  "equal exactly 6" (§4).
- **Card reading has one rule that unlocks most of the rest:** `CONDITIONS : ACTIVATION ; RESOLUTION` (PSCT Part 3).
  Before the colon is when; between colon and semicolon is what you do to activate (costs, targeting); after is what
  happens when it resolves. No colon and no semicolon on a monster means no Chain. "Then / also / and if you do /
  and" each have a defined meaning (PSCT Part 7) (§5).
- **Two card-reading rules Junior already teaches are not stated outright in any Konami TCG document read here:**
  that "If… you can" never misses its chance, and how the three "once per turn" wordings differ. Konami's articles
  support the "When… you can" half only. Both are standard play, but they are marked unverified (§9).
- **Eighteen candidate "did you read the card?" questions on real cards** with exact database text are in §5.4.
  Several Junior cards are already word-for-word real cards under another name (Spark Trade is Lightning Vortex
  without "face-up").
- **Recommended order (ours):** zones first (Graveyard, Field Zone, banished, Extra Deck), then Ritual, Fusion,
  Synchro, Xyz, Link (Konami's own beginner-video order), with the new card-reading levels spread across those
  worlds instead of a second reading block. Pendulum is named on the mat and not played (§6, §7).

---

## 2. What Junior teaches today, and the gap

Read in `apps/academy-ygo/src/lib/junior/play/` and `apps/academy-ygo/src/components/junior/play/`.

### 2.1 What exists

| Thing | Where | What it is |
| --- | --- | --- |
| The board | `engine.ts` (`ZONES = 3`, `START_LP = 4000`, `SideState`) | Per side: `lp`, `hand`, `deck`, `monsters[3]`, `backrow[3]`, `graveyard`. Nothing else. |
| What is drawn | `mini-board.tsx` (`MiniBoard`) | Two rows per side, the Life Point "lantern", and one line of text: Deck count, each Graveyard's **count**. The Graveyard's cards are not shown. |
| Moves | `engine.ts` (`Move`) | `draw`, `phase`, `place` (Normal Summon / activate Spell / Set Trap), `position`, `attack`, `spring` (flip a Set Trap), `ability` (one Monster effect), `pass`. |
| Effects | `cards.ts` (`Effect`, `Ability`, `Trigger`, `Cost`) | Gain LP, boost ATK, destroy 1 (targets), destroy all (no target), weaken attacker, stop attack, return to hand; one Monster effect ("target 1…; it loses 800 ATK", Quick or not, once per turn); one Graveyard trigger ("If/When this card is sent to the GY: You can inflict 500 damage"); one cost ("Discard 1 card;"). |
| Goals | `levels.ts` (`Goal`) | `place-all`, `destroy-all`, `win`, `hold`. |
| Rules taught | `levels.ts` (`RULE_IDS`) | `zones`, `battle`, `defense`, `direct`, `summon`, `tribute`, `phases`, `spell`, `trap`, `chain`, `cost`, `target`, `quick`, `once`, `timing`. |
| Card face | `mini-board.tsx` (`CardFace`) | Emoji, name, Level stars, ATK, DEF, kind (Monster / Spell / Trap), text. No Attribute, no Type line, no Spell/Trap icon, no frame colour beyond the three kinds. |
| Cards | `cards.ts` (25), text in `copy-{en,fr,he}.ts` | Invented names, real-card wording. |

`docs/academy-junior-play.md` lists what is left out on purpose: Set Monsters, Setting a Spell, **Special Summons**,
most Monster effects, chains longer than two links, the Damage Step. "Only Normal Spells and Normal Traps exist."

### 2.2 The gap against the three asks

| Ask | Covered today | Missing |
| --- | --- | --- |
| 1. Every zone | Monster Zones and Spell & Trap Zones (rule `zones`, levels `w1-field`, `w1-field-2`); the Graveyard as a counter | Field Zone and Field Spells; a Graveyard the child can open and take from; banished cards; the Deck as a zone with rules; Extra Deck; Extra Monster Zone; Pendulum Zones; the difference between Main Monster Zone and Extra Monster Zone |
| 2. Extra Deck and Ritual | Nothing. No Special Summon exists in the engine. | Fusion, Synchro, Xyz, Link, Ritual; Tuner; Rank; Link Rating and arrows; materials; "properly Summoned first" |
| 3. Reading cards | World 8: cost before `;` (`r-cost`, `r-paid`), Target (`r-target`), Quick Effect (`r-quick`, `r-main`), once per turn (`r-once`), "When/If… you can" (`r-when`, `r-last`), and a mixed level (`r-boss`) | The parts of a card (Attribute, Type line, icons, frame colours, Rank, Link Rating, Pendulum Scale); the colon as "condition"; "no colon, no Chain"; "then / also / and if you do / and"; "that target" versus "it"; the other two "once per turn" wordings; card-specific questions; any real card |

One mismatch to fix while extending: Junior's copy says "Monster Zone"; the current official name for the row of
five is **Main Monster Zone** (§3). With only one kind of Monster Zone on the board the short name was harmless;
once the Extra Monster Zone appears it is not.

---

## 3. The zones

### 3.1 Which document is current

- **Official Rulebook Version 10** is the rulebook Konami's English rulebook page links today
  ([page](https://www.yugioh-card.com/en/rulebook/),
  [PDF](https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf)). The PDF's own metadata gives a
  creation date of 2017-07-27. Page numbers below are the numbers printed in the rulebook.
- **2021 Rules Update** ([page](https://www.yugioh-card.com/en/play/2021_rules_update/)) says its changes "are in
  effect at in-person and remote duel events at all levels" and "will be incorporated into an upcoming rulebook
  update". No later rulebook is linked from the rulebook page, so v10 plus this page is the current rule set as far
  as Konami's English site shows.

### 3.2 Zone by zone

"Public" below means both players may know the contents. The rulebook's *Public Knowledge* entry (p. 50) lists
exactly four things: "The number of cards in a player's hand and Decks, the cards in their Graveyards, and each
player's current LP".

| Zone (official name) | How many | What goes there | Face / who may look | Rules a beginner needs | Source |
| --- | --- | --- | --- | --- | --- |
| **Main Monster Zone** | 5 per player | Monsters when they are played | Face-up Attack, face-up Defense or face-down Defense Position; "upright for Attack Position, and sideways for Defense Position" | "You can have up to 5 cards here." | Rulebook v10 p. 4 |
| **Extra Monster Zone** | 2 in all ("If 2 Extra Monster Zones are available", p. 13); "Normally, each player can only use 1 of these zones" | Monsters Summoned from the Extra Deck | Face-up | "A monster placed in this zone does not count towards the 5-monster limit of your Main Monster Zone." A monster there is still a monster its player controls: "you can't attack directly" past it. | Rulebook v10 pp. 5, 15 |
| **Spell & Trap Zone** | 5 per player | Spell and Trap Cards, "face-up to activate them, or… face-down" | Set cards are hidden | "You can have up to 5 cards here." | Rulebook v10 p. 4 |
| **Pendulum Zone** | 2: the leftmost and rightmost Spell & Trap Zones | A Pendulum Monster Card activated as a Spell | Face-up | "This causes the zone you use to also become a Pendulum Zone for as long as the Pendulum Monster Card is there." | Rulebook v10 pp. 4, 17 |
| **Field Zone** | 1 per player | Field Spell Cards | Face-up, or "placed face-down in the Field Zone, but… not active until flipped face-up" | "Each player can have 1 Field Spell Card on their own side of the field. To use another Field Spell, send your previous one to the Graveyard." "Field Spell Cards do not count towards the 5-card limit of your Spell & Trap Zone." "Many Field Spell effects apply to BOTH players." | Rulebook v10 pp. 5, 29 |
| **Graveyard (GY)** | 1 per player | "When Monster Cards are destroyed, and when Spell & Trap Cards are used, they're sent face-up to this space." | **Public.** "your opponent can look through yours at any time during the Duel" (ask first, p. 50) | "The order of the cards in the Graveyard should not be changed." "Graveyard is shortened in the card text to 'GY'." | Rulebook v10 pp. 4, 50 |
| **Deck** (the rulebook also writes "Deck Zone", p. 33; the deck itself is the "Main Deck", p. 2) | 1 per player; 40 to 60 cards | The Main Deck | Face-down. The number of cards is public, the cards are not. | "You draw cards from here." After a card makes you look through it, "shuffle it and put it back". Being unable to draw when you must loses the Duel (p. 32). | Rulebook v10 pp. 2, 5, 32, 50 |
| **Extra Deck** (also "Extra Deck Zone", p. 33) | 1 per player; 0 to 15 cards | Extra Deck monsters, face-down; plus face-up Pendulum Monsters (below) | "You can look at the cards in your own Extra Deck during the game." The count is public (p. 50). The rulebook gives only the owner the right to look, and lists nothing else about it as public knowledge. | "Extra Deck Monsters may be Summoned to the field from here using special methods." | Rulebook v10 pp. 2, 5 |
| **Banished** (not a zone on the mat) | n/a | Cards an effect banishes | Face-up unless the effect says "face-down" (Pot of Desires, §5.4 Q2) | "a card which is banished is separated from the field instead" of going to the Graveyard. Formerly "removed from play". | Rulebook v10 p. 52; PSCT Part 2 |
| **Hand** (not on the mat) | n/a | Cards drawn | Only the number of cards is listed as public knowledge | Starting hand 5 cards (p. 33); over 6 at the End Phase, discard down to 6 (p. 40). | Rulebook v10 pp. 33, 40, 50 |

"**The field**" is the two mats together (p. 4). The glossary narrows the phrase on cards: "When 'cards on the field'
is written in card text, it means all the cards on the Game Mat other than the Graveyard, Deck, and Extra Deck"
(p. 52). So the Graveyard, the Deck and the Extra Deck are places, but they are **not "on the field"**. That is the
single most useful sentence for a zones world: Dark Hole ("Destroy all monsters on the field.") touches neither
Graveyard.

"**Control**" and "**possess**" (p. 53): "Cards you 'control' are the cards in your Monster Zone, Spell & Trap Zone,
Field Zone, and Pendulum Zone." Possession adds "the cards in your hand, Deck, Extra Deck, Graveyard, your banished
cards… and Xyz Materials attached to monsters you control". A card sent to the Graveyard, hand or Deck "is always
returned to the Graveyard / hand / Deck of the original owner".

### 3.3 Where Extra Deck monsters may be placed (current rule)

Rulebook v10 says, for Xyz, Synchro and Fusion alike, to play the monster "in the Extra Monster Zone" and adds "If
there is a Link Monster on the field, you can [Xyz/Synchro/Fusion] Summon a monster in one of your zones it points
to" (pp. 19, 21, 22). **That is no longer the rule.** The 2021 Rules Update:

> "Fusion, Synchro, and Xyz Monsters can be first Summoned from the Extra Deck to any of your Main Monster Zones.
> They do not have to be Summoned to the Extra Monster Zone or a spot that a Link Monster is pointing to. You can
> still Summon a Fusion/Synchro/Xyz Monster from the Extra Deck to your Extra Monster Zone if you want to, though.
> (The restrictions requiring an Extra Monster Zone or Link Monster pointing still apply to Link Monsters and
> Pendulum Monsters that are Summoned from the Extra Deck.)"

So today:

| Summoned from the Extra Deck | May be placed in |
| --- | --- |
| Fusion, Synchro, Xyz Monster | Any Main Monster Zone of yours, or an Extra Monster Zone |
| Link Monster | An Extra Monster Zone, or a Main Monster Zone of yours that a Link Monster points to |
| Face-up Pendulum Monster (by Pendulum Summon) | An Extra Monster Zone, or a Main Monster Zone of yours that a Link Monster points to |

Still valid from v10 (p. 14): a monster that started in the Extra Deck and is later Summoned **from the Graveyard or
from being banished** goes to a Main Monster Zone and needs no Link Monster pointing.

The page says Konami had already applied some of these changes before it was published ("some of which have already
been in effect"). The page carries no date of its own beyond the "2021" in its title.

### 3.4 Pendulum Monsters and the Extra Deck

"Whenever one of your Pendulum Monster Cards on the field (regardless of which Zone it is in, or even if it is a
monster or not) would be sent to the Graveyard, place it face-up on your Extra Deck instead" (p. 17). The mat text
repeats it: Pendulum Monster Cards "that would be sent from the field to the Graveyard are placed face-up here"
(p. 5). Only **from the field**: a Pendulum Monster discarded from the hand goes to the Graveyard like any card
(this follows from the words "on the field"; the rulebook gives no separate sentence for it).

### 3.5 Three inconsistencies inside Konami's own documents

1. **Extra Deck contents.** Rulebook v10 p. 2 says the Extra Deck "consists of Xyz Monsters, Synchro Monsters and
   Fusion Monsters" and does not name Link Monsters, while pp. 12–13 Summon Link Monsters "from your Extra Deck",
   and the Starter Deck *Beginner's Guide* p. 1 says to separate "your purple Fusion Monster, white Synchro Monster,
   black Xyz Monster and dark blue Link Monster" and "Put them face-down in the spot marked 'Extra Deck'". Teach
   four kinds.
2. **Extra Monster Zone placement.** v10 against the 2021 Rules Update (§3.3). Teach the update.
3. **"Main Deck" in "Leaves the Field".** The 2021 Rules Update corrects p. 51: "'Main Deck' should be 'Deck' (and
   therefore also includes the Extra Deck)". Beyond Junior's scope; recorded so nobody quotes p. 51 unchanged.

---

## 4. The Extra Deck methods and the Ritual Summon

All five are Special Summons: "Pendulum Summons, Xyz Summons, Synchro Summons, Fusion Summons and Ritual Summons are
all Special Summons" (p. 25; that sentence does not name the Link Summon, which pp. 12–15 describe under the heading
"Special Summon to the Main Monster Zones"). "There is no limit to the number of times you
can… Special Summon during a turn" (p. 36), and a Special Summon does not use up the one Normal Summon or Set
(*Beginner's Guide* p. 6: "Special Summons are like a bonus!"). "Unless otherwise specified, a Special Summoned
monster is played onto the field in your choice of face-up Attack Position or face-up Defense Position" (p. 25).

One rule covers all of them afterwards (p. 25): a Synchro Monster sent from the Extra Deck to the Graveyard
"without being Synchro Summoned" cannot be Special Summoned from the Graveyard by a Spell, "because Synchro Monsters
have to be properly Special Summoned first". The rulebook gives the Synchro example only; PSCT Part 5 extends "must
first be Special Summoned" to "Xyz Summons, Synchro Summons, and Contact Fusions" when the Summon is negated.

In every step below, "Extra Monster Zone" in the v10 wording must be read with §3.3.

### 4.1 Fusion (Rulebook v10 p. 22)

- **What it is.** Fusion Monsters "are Summoned by using the specific monsters listed on the card (called Fusion
  Materials) combined with a Summoning card like Polymerization."
- **Steps.** (1) "If you have all the Fusion Materials listed on the Fusion Monster Card, in the places specified on
  your Summoning card, you can activate your Summoning card by placing it in your Spell & Trap Zone." (2) "Send the
  Fusion Materials to the Graveyard, then take the appropriate Fusion Monster from your Extra Deck and play it… in
  either face-up Attack or Defense Position." (3) "Finally, place your Summoning card in the Graveyard."
- **Where the materials come from.** From wherever the Summoning card says. Polymerization: "Fusion Summon 1 Fusion
  Monster from your Extra Deck, using monsters from your hand or field."
  ([cid 4837](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4837&request_locale=en))
- **Where the materials go.** The Graveyard, unless another effect sends them elsewhere: "send them to that other
  place, but the Fusion Summon still happens anyway" (p. 22, step 3).
- **Commonly mis-taught.** (a) Two monsters on the field do not fuse by themselves: a card effect does it. PSCT
  Part 5 does describe "Contact Fusions" that Summon without Polymerization, but only because that monster's own
  text says so. (b) The materials need not be on the field; with Polymerization the hand counts. (c) Activating
  Polymerization starts a Chain (it is a Spell Card: "activating a Spell Card always starts a Chain", PSCT Part 5),
  and the materials are sent when it **resolves** (no semicolon in its text, so nothing is done at activation).
- **Simple real cards.** Flame Swordsman, Level 5, 1800/1600, no effect: "\"Flame Manipulator\" + \"Masaki the
  Legendary Swordsman\"" ([cid 4021](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4021&request_locale=en));
  both materials are Normal Monsters (Level 3 and Level 4). Gaia the Dragon Champion: "\"Gaia The Fierce Knight\" +
  \"Curse of Dragon\"" ([cid 4043](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4043&request_locale=en)).

### 4.2 Synchro (Rulebook v10 pp. 20–21)

- **What it is.** Synchro Monsters "can be Synchro Summoned from the Extra Deck by sending 1 face-up 'Tuner' monster
  and any number of face-up non-Tuner monsters from your field to the Graveyard, when the sum of all their Levels is
  exactly equal to the Level of the Synchro Monster." A Tuner is recognised by its Type line: "look for 'Tuner' next
  to its Type".
- **Steps.** (1) "During your Main Phase, you can declare a Synchro Summon when the combined total Levels of 1
  face-up Tuner monster and any number of other face-up monsters you control are equal to the Level of the Synchro
  Monster you want". (2) "send the face-up Synchro Materials from your field to the Graveyard." (3) "take the
  Synchro Monster from your Extra Deck and play it… in face-up Attack or Defense Position."
- **The rulebook's own sum:** Level 3 Tuner + Level 2 non-Tuner = Level 5 (p. 21).
- **Commonly mis-taught.** (a) **Exactly one Tuner** by default; the rest are non-Tuners. The card's first line is
  the authority: Gaia Knight, the Force of Earth reads "1 Tuner + 1 or more non-Tuner monsters"
  ([cid 7697](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=7697&request_locale=en)); some
  Synchro Monsters name the Tuner, e.g. Junk Warrior: "\"Junk Synchron\" + 1+ non-Tuner monsters"
  ([cid 7696](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=7696&request_locale=en)).
  (b) The sum is **exact**, never "or more". (c) Materials must be **face-up on the field**, not in the hand.
  (d) No Spell is needed, and the Summon starts no Chain: PSCT Part 5 lists "Xyz Summons, Synchro Summons, and
  Contact Fusions" among built-in Summons that "[don't] start a Chain"; the Fast Effect Timing page lists
  "Perform a Special Summon that does not start a Chain (including Xyz Summon, Synchro Summon)".
- **Simple real cards.** Tune Warrior (Level 3, Tuner/Normal,
  [cid 7684](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=7684&request_locale=en)) +
  Giant Soldier of Stone (Level 3, Normal,
  [cid 4080](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4080&request_locale=en)) =
  Gaia Knight, the Force of Earth (Level 6, 2600/800, no effect).

### 4.3 Xyz (Rulebook v10 pp. 18–19, 51)

- **What it is.** "You can Summon an Xyz Monster whenever you control monsters that are the same Level." "Xyz
  Monsters have Ranks instead of Levels." The stars of an Xyz Monster "is the Rank of the monster, and is on left"
  (p. 6).
- **Steps.** (1) "Choose an Xyz Monster from your Extra Deck that you have the right Xyz Materials for. The Xyz
  Materials should be face-up on your field." (2) "During your Main Phase, declare that you are Xyz Summoning and
  stack the Xyz Materials on top of each other." (3) "Take the Xyz Monster from your Extra Deck and put it on top of
  the stacked Xyz Materials… in face-up Attack or Defense Position."
- **Detach.** "When an Xyz Monster tells you to 'detach' a material, take one of the stacked Xyz Material cards
  beneath your Xyz Monster and put it in the Graveyard." (p. 19)
- **Commonly mis-taught.** (a) The materials do **not** go to the Graveyard when you Summon; they go under the
  monster. (b) "Monsters that have become Xyz Materials are not treated as cards on the field." (p. 51) They cannot
  be attacked, targeted as monsters on the field, or counted as monsters you control. (c) "When an Xyz Monster
  leaves the field, all of the Xyz Materials attached to it are sent to the Graveyard." If it "is flipped face-down,
  or becomes controlled by the opponent", they stay attached (p. 51). (d) A Rank is not a Level: nothing in the
  rulebook lets a Rank be used where a Level is asked for, so an Xyz Monster cannot be a Synchro Material or be
  counted in a Ritual's total Levels (inference from "Ranks instead of Levels"; no sentence says it in so many
  words). (e) "Tokens cannot be used as an Xyz Material." (p. 49) (f) A monster that becomes an Xyz Material does not
  trigger its "leaves the field" effects (p. 51).
- **Simple real cards.** Gem-Knight Pearl, Rank 4, 2600/1900, no effect: "2 Level 4 monsters"
  ([cid 9601](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=9601&request_locale=en)).
  For detach: Number 39: Utopia, Rank 4: "2 Level 4 monsters / When a monster declares an attack: You can detach 1
  material from this card; negate the attack. If this card is targeted for an attack, while it has no material:
  Destroy this card." ([cid 9575](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=9575&request_locale=en))

### 4.4 Link (Rulebook v10 pp. 12–15)

- **What it is.** A Link Monster has a **Link Rating** ("the number of Link Arrows that monster has and the number
  of monsters needed to Summon it"), **Link Arrows**, and a materials line (the "recipe"). The database shows no
  Level and "DEF -" for Link Monsters.
- **Steps.** (1) "Check the materials of the Link Monster you want to Summon." (2) "During your Main Phase, declare
  that you are Link Summoning, send a number of face-up monsters from your field to the Graveyard equal to the Link
  Rating of that Link Monster. They must also match the material requirements listed in the monster's 'recipe'".
  (3) "Place the Link Monster from your Extra Deck in the Extra Monster Zone, or one of your Main Monster Zones that
  another Link Monster is pointing to."
- **Three goals** (p. 15): the amount of materials matches the Link Rating; the number of materials meets the number
  in the recipe; the materials match any other requirement in the recipe.
- **A Link Monster as material** (p. 14): "you can count it as either 1 monster, or as a number of monsters equal to
  its Link Rating."
- **Arrows.** "When a Link Monster's red arrow points to a monster, those monsters are 'linked'." Every Main Monster
  Zone a Link Monster points to can receive monsters from the Extra Deck (p. 14); after the 2021 update that matters
  for Link and Pendulum Monsters only (§3.3).
- **Commonly mis-taught.** (a) "Link Monsters have no DEF and cannot ever be in Defense Position. They can't be
  changed to Defense Position by a card effect. They can't even be flipped into face-down Defense Position." (p. 15)
  (b) They have a Link Rating, not a Level or a Rank: the rulebook never gives a Link Monster a Level, and the
  database lists "Link 2" where other monsters show a Level (again an inference that they cannot be Synchro or Xyz
  material by Level; no sentence in v10 says it). (c) A monster in the Extra Monster Zone still blocks direct
  attacks (p. 15). (d) Tokens can be Link Material (p. 15), unlike Xyz.
- **Simple real cards.** LANphorhynchus, Link 2, 1200 ATK, no effect: "2 monsters"
  ([cid 13530](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=13530&request_locale=en)).
  Link Spider, Link 1, 1000 ATK: "1 Normal Monster / Once per turn: You can Special Summon 1 Level 4 or lower Normal
  Monster from your hand to your zone this card points to."
  ([cid 13034](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=13034&request_locale=en)).
  Which way each card's arrows point was not read (the database shows them as a picture); see §9.

### 4.5 Ritual (Rulebook v10 pp. 23, 28)

- **What it is.** "Ritual Monsters are special monsters that are Special Summoned with a specific Ritual Spell Card,
  along with a required Tribute. Ritual Monster Cards are placed in the **Main Deck**". Ritual Spell Cards are used
  "in the same way as you would use Normal Spell Cards" (p. 28).
- **Steps.** (1) "When you have a Ritual Spell Card, along with the matching Ritual Monster Card, in your hand,
  along with the required Tribute (as listed on the Ritual Spell Card), you can activate the Ritual Spell Card,
  placing it in the Spell & Trap Zone." (2) "If the activation of the Ritual Spell Card is successful, Tribute
  monsters by sending them from your hand or the field to the Graveyard. The Ritual Spell Card will list the
  required amount to Tribute." (3) "After sending the Tributed monsters to the Graveyard, play the Ritual Monster
  Card in your Main Monster Zone in either face-up Attack or Defense Position. Finally, place the Ritual Spell Card
  in the Graveyard."
- **"Equal" or "or more" is on the card, not in the rulebook.** Exact database text:
  - Black Luster Ritual: "This card is used to Ritual Summon \"Black Luster Soldier\". You must also Tribute monsters
    from your hand or field whose total Levels equal 8 or more."
    ([cid 4676](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4676&request_locale=en))
  - White Dragon Ritual: "…whose total Levels equal 4 or more."
    ([cid 5601](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5601&request_locale=en))
  - Dawn of the Herald: "…You must also Tribute monsters from your hand or field whose total Levels equal exactly 6.…"
    ([cid 8834](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=8834&request_locale=en))
  - Black Illusion Ritual: "…You must also Tribute a monster from your hand or field whose Level is 1 or more."
    ([cid 4802](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4802&request_locale=en))
  - Advanced Ritual Art: "This card is used to Ritual Summon any 1 Ritual Monster. You must also send Normal Monsters
    from your Deck to the GY whose total Levels equal the Level of that Ritual Monster."
    ([cid 6996](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=6996&request_locale=en))
- **Commonly mis-taught.** (a) The Ritual Monster lives in the **Main Deck** and is Summoned **from the hand**, not
  from the Extra Deck, though it is blue-framed and "special". (b) The Tributes can come from the hand as well as
  the field (when the Ritual Spell says so, as all the above except Advanced Ritual Art do). (c) "Add up to the
  Level" is wrong as a general rule: the Ritual Spell decides (this repo already corrected that in
  [beginner-lessons-rules-audit.md](./beginner-lessons-rules-audit.md)). (d) The Tributes happen when the Ritual
  Spell **resolves** ("If the activation… is successful, Tribute"), so they are not a cost; none of the Ritual
  Spells above has a semicolon. (e) The Ritual Monster names its Spell: "You can Ritual Summon this card with
  \"Black Luster Ritual\"." ([cid 4370](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4370&request_locale=en))
- **Simple real cards.** Paladin of White Dragon is Level 4, so one Level 4 monster is enough
  ([cid 5600](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5600&request_locale=en));
  Black Luster Soldier, Level 8, 3000/2500, has no other effect.

### 4.6 Side by side

| | Lives in | Needs a Spell? | Materials from | Materials go to | The number that must match | Starts a Chain? |
| --- | --- | --- | --- | --- | --- | --- |
| Ritual | Main Deck (hand when Summoned) | Yes, its Ritual Spell | Hand or field (per the Spell) | Graveyard (Tributed) | Total Levels, "or more" or "exactly" per the Spell | Yes (the Spell) |
| Fusion | Extra Deck | Yes, "a Summoning card like Polymerization" | Where that card says (hand or field) | Graveyard | The named materials | Yes (the Spell) |
| Synchro | Extra Deck | No | Field, face-up | Graveyard | 1 Tuner + non-Tuners, Levels exactly equal | No |
| Xyz | Extra Deck | No | Field, face-up | Under the Xyz Monster | Same Level, the number the card says | No |
| Link | Extra Deck | No | Field, face-up | Graveyard | Count equal to the Link Rating, per the recipe | No |

The "Starts a Chain?" column: Spell activations always start one (PSCT Parts 3 and 5); Synchro and Xyz are named as
built-in Summons in PSCT Part 5 and on the Fast Effect Timing page. **Link is not named in either** (both pages
predate Link Monsters); "No" for Link is by analogy with the rulebook's identical "declare that you are Link
Summoning" procedure and is marked in §9.

---

## 5. Reading a card

### 5.1 The parts of a card

**Monster Cards** (Rulebook v10 pp. 6–7, "How to read a card"):

| Part | What the rulebook says |
| --- | --- |
| Card Name | "When a card name is mentioned in card text it appears in quotations. If cards have the same name, they are considered to be the same card." |
| Attribute | Six: DARK, EARTH, FIRE, LIGHT, WATER, WIND. "This Attribute is sometimes important for card effects." (The database also has DIVINE; v10 does not list it.) |
| Level | "Count the number of stars here to find out the monster's Level. For Xyz Monsters, the number of stars is the Rank of the monster, and is on left." |
| Type | "Monsters are divided into various Types. Some monsters with specific abilities will have additional information here too, next to their Type." This line is where "Tuner", "Fusion", "Synchro", "Xyz", "Link", "Ritual", "Pendulum", "Flip", "Effect" and "Normal" appear (database: e.g. "Warrior / Tuner / Normal"). |
| Card Number | "useful for collecting, and for sorting your collection" |
| ATK / DEF | Attack Points and Defense Points |
| Card Description | "Card effects are written here… Normally, the effects of monsters cannot be used while they are Set face-down on the field. Yellow Normal Monster Cards do not have effects, and have a description of them written here that does not affect the game." |

Additions for the special kinds:

- **Materials line.** The first line of a Fusion, Synchro, Xyz or Link Monster's text is its recipe (examples in
  §4). The rulebook calls it "the materials line or 'recipe'" for Link (p. 15).
- **Link Monsters** (p. 12): Link Arrows, Link Materials, LINK Rating. No DEF (p. 15).
- **Pendulum Monsters** (p. 16): a **Pendulum Effect** ("When you play this card as a Spell Card in your Pendulum
  Zone, this is its effect"), a **Pendulum Scale** ("a number that determines which monsters you can Special Summon
  during a Pendulum Summon") and a **Monster Effect** ("When you play this card as a regular Monster Card").
- **Frame colours.** *Beginner's Guide* p. 1–2: "purple Fusion Monster, white Synchro Monster, black Xyz Monster and
  dark blue Link Monster"; "Yellow Normal Monsters"; "Orange Effect Monsters". *Speed Duel Guide*: "Monsters with
  blue borders, like Relinquished, cannot be Summoned except by using the Spell explained on the monster" (Ritual).
  **Not found in the text of any Konami document read here:** the colours of Spell Cards, Trap Cards and Pendulum
  Monsters (they are shown as pictures only). See §9.

**Spell & Trap Cards** (Rulebook v10 pp. 26–27): Card Name; Type ("a Spell Card has the 'SPELL' symbol and a Trap
Card has the 'TRAP' symbol" in place of an Attribute); **Icon**: "There are 6 types of icons… Equip, Field,
Quick-Play, Ritual, Continuous, Counter. Spell and Trap Cards without an icon are called Normal Spell Cards or Normal
Trap Cards"; Card Description; Card Number. What each icon means (pp. 28–31; *Beginner's Guide* p. 15):

| Icon | On | Meaning in one line |
| --- | --- | --- |
| (none) Normal | Spell, Trap | Single use, then to the Graveyard |
| Continuous | Spell, Trap | "remain on the field once they are activated" |
| Equip | Spell | "give an extra effect to 1 face-up monster"; destroyed if that monster leaves |
| Field | Spell | "go in your Field Zone and stay there" |
| Quick-Play | Spell | "can be activated during any Phase of your turn"; Set first, usable on the opponent's turn, not the turn it was Set |
| Ritual | Spell | "used to perform Ritual Summons" |
| Counter | Trap | "normally activated in response to the activation of other cards"; Spell Speed 3 (p. 45) |

### 5.2 The four kinds of Monster effect (Rulebook v10 pp. 9–11)

| Kind | Rulebook wording | How to spot it on the card |
| --- | --- | --- |
| Continuous | "active while the Effect Monster Card is face-up on the field… there is no trigger for its activation" | No colon, no semicolon (PSCT Part 4: "No colon, no semicolon = no chain") |
| Ignition | "You use this type of effect just by declaring its activation during your Main Phase." | Has a `;` or `:`, no "(Quick Effect)", no "When/If" condition. Example on p. 10: "You can Tribute this card, then target 1 monster on the field; destroy that target." |
| Quick | "special monster effects that you can activate even during your opponent's turn. These types of effects have a Spell Speed of 2" | The words "(Quick Effect)" before the colon. Example on p. 10: "When an effect is activated (Quick Effect): You can target 1 card in your Graveyard; Special Summon it." |
| Trigger (incl. Flip) | "activated at specific times, such as 'during the Standby Phase' or 'when this monster is destroyed'"; Flip effects "start with the word 'FLIP:'" | A "When…" / "If…" / "During…" condition before the colon |

Spell Speeds (pp. 44–45): Speed 1 = Normal, Equip, Continuous, Field and Ritual Spells, and Ignition, Trigger and
Flip effects ("cannot be activated in response to any other effects"); Speed 2 = Normal and Continuous Traps,
Quick-Play Spells, Quick Effects; Speed 3 = Counter Traps.

### 5.3 The PSCT rules

Source for each: the article named. All seven are by Kevin Tewart on Konami's site, 2011–2012
([index](https://www.yugioh-card.com/en/play/psct/)).

**R1. Conditions : Activation ; Resolution** (Part 3). "Conditions… are now always followed by a colon (:).
Activation text… is separated from the card effects… by a semicolon (;). The basic structure is CONDITIONS :
ACTIVATION ; RESOLUTION." The rulebook glossary says the same (p. 52): "Text before the colon gives information on
conditions to activate the effect, and timing on when it happens. Text before a semi-colon is what you do when the
effect is activated. Text at the end of a sentence, after all colons and semi-colons, is what you do at resolution
of the effect."

**R2. What sits before the semicolon** (Part 3): "Anything that happens WHEN YOU ACTIVATE a card… This includes
things like costs and targeting." Order when activating (Part 3): "Make sure the green part (before the colon) is
being followed. Do the part in red (before the semicolon) if there is any. After that, other cards and effects can
be chained in response."

**R3. Costs** (Part 4): "Costs are always paid at activation. If the card tells you to pay, discard, Tribute, or
destroy in the activation text (before the semicolon), it's a cost." Rulebook p. 54: "Even if the activation of the
card is negated, you cannot get a refund of the cost that you have paid", and p. 51: "paying costs are not effect
activations and therefore you cannot respond to those actions using a Chain". Rulebook p. 53: "Costs that are needed
to activate an ability are not part of the effect."

**R4. Conditions are checked once** (Part 4): "Any activation conditions (written before the colon) only have to be
met when you activate the card. If something changes before the card resolves, and the conditions aren't met
anymore, it doesn't matter."

**R5. Colon or semicolon = Chain** (Part 3): "If there's a colon or semicolon in the text, that always means an
effect that starts a chain. If there is no colon or semicolon, the effect does NOT start a chain and cannot be
chained to." Exception stated in the same article: "Spells and Traps always start a chain at some point, because
activating the Spell/Trap starts a chain all by itself", even with neither mark. *Beginner's Guide* p. 16 tells new
players the same: "Monster effects that activate have a : or ; in their text, or sometimes both."

**R6. Targeting** (Parts 3, 4, 6). Targets are chosen at activation (R2). At resolution (Part 4): "if the effect
text (after the semicolon) still refers to a 'target', you have to double-check that any targeting requirements are
still met. Otherwise, if the card refers to the target using any other word (like 'it')… the targeting requirements
only had to be met when the target was originally targeted." And: "if the effect text refers to 'both'… you have to
be able to apply the effect to ALL of the targets." That a card which does not say "target" does not target is the
plain reading of R1–R2 and of every example in Parts 3–6, but **no sentence in the seven articles states it as a
rule** (§9).

**R7. Built-in Summons** (Part 5). A Summon whose text has no colon or semicolon and says where it comes from in
parentheses ("(from your hand)") "doesn't start a Chain". "Xyz Summons, Synchro Summons, and Contact Fusions are
also part of this group."

**R8. Conjunctions** (Part 7):

| Wording | Timing | What depends on what |
| --- | --- | --- |
| Do A, **then** do B | "B happens after A… in sequence, not simultaneously." | "A is required for B, but NOT vice-versa. If A does not happen, then stop. If B cannot happen, you still do A." |
| Do A, **also** do B | "Considered simultaneous." | "Neither is required for the other. Just do as much as you can!" |
| Do A, **and if you do**, do B | "Considered simultaneous." | "A is required for B, but NOT vice-versa." |
| Do A **and** B | "Considered simultaneous." | "BOTH are required. If you cannot do both, then you do nothing." |

Part 7 notes that a plain "and" is "pretty rare now".

**R9. "When… you can" and the last thing that happened** (Parts 6, 7). Part 7: a card "might only be usable in
response to a triggering event that was 'the last thing that happened'. (This is usually the case for cards that
'CAN' be used 'WHEN' something happens…)". Part 6, on Quickdraw Synchron: "because it uses 'and Special Summon'
instead of 'then Special Summon'… you will not miss the timing for any 'when… you can' optional effects of the card
you sent to the Graveyard". Part 7 promised "a lot more about effects with strict activation timing in an upcoming
piece of our Advanced Gameplay web section"; the Advanced Rules section today holds two pages (Fast Effect Timing;
a Rivalry of Warlords FAQ) and neither covers it. So Konami's articles establish that **optional "When" effects can
miss their chance**; that **"If" effects do not** is the counterpart every current card is written to, and Junior
already teaches it, but it is not stated in a Konami TCG document read here (§9).

**R10. Once per turn.** Three wordings are on current cards (all quoted in §5.4): "Once per turn:" (Gagaga
Magician, Link Spider), "You can only use this effect of \"Sangan\" once per turn.", and "You can only activate 1
\"Pot of Desires\" per turn." The PSCT articles show "Once per turn:" as part of the condition (Part 4, Zombie
Master) and do not explain how the three differ. The difference as played (the first is tracked per copy of the
card on the field; the second and third are by card name, so a second copy is also blocked) is what this repo's
[rules audit](./beginner-lessons-rules-audit.md) already applies, but **no Konami TCG source for it was found** (§9).

**R11. Quick Effects and whose turn it is** (Rulebook p. 10; Fast Effect Timing). Only "fast effects" (Spell Speed
2 or higher: "monster Quick Effects, Quick-Play Spell Cards, and Trap Cards") "can be activated by either player –
even during their opponent's turn". Activating "an Ignition Effect" or "a Spell Speed 1 Spell Card" is in the
page's list of actions that "can ONLY be performed when the game state is open" by the turn player.

**R12. Words changed in 2011** (Part 2), useful when a child meets an old card: "remove from play" is now "banish";
"is removed from the field" is now "leaves the field". The database still shows a few old texts (Ritual of Grace:
"remove from play this card from your Graveyard"; Dian Keto the Cure Master: "Increase your Life Points by 1000
points."), so "prefer a card whose database text is modern" is a selection rule for any real card shown to a child.

### 5.4 Candidate "did you read the card?" questions

Every card text below is the English text on Konami's database on 2026-11-17, copied whole unless "…" is shown.
"cid" links are `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=<cid>&request_locale=en`.
The questions, the wording for a child and the pairing of cards are **ours**; each answer names the rule from §5.3
or the rulebook page that makes it right. They are written as questions here; §6.3 gives the playable form.

| # | Card (cid) and exact text | Question | Right answer | Rule |
| --- | --- | --- | --- | --- |
| Q1 | **Lightning Vortex** (5217): "Discard 1 card; destroy all face-up monsters your opponent controls." | It is the last card in your hand. Can you play it? | No. The discard is before the `;`: you pay it to activate, and there is nothing left to discard. | R3 |
| Q2 | Lightning Vortex again | The rival answers with a card that negates it. Do you get your discarded card back? | No. | Rulebook p. 54 ("you cannot get a refund") |
| Q3 | **Pot of Desires** (12465): "Banish 10 cards from the top of your Deck, face-down; draw 2 cards. You can only activate 1 \"Pot of Desires\" per turn." | Where do the 10 cards go, and are they turned up? You have two copies: can you play both this turn? | They are banished (not to the Graveyard), face-down, when you activate. No: one per turn. | R3; rulebook p. 52 (banished); the card's last sentence (R10) |
| Q4 | **Seven Tools of the Bandit** (4863): "When a Trap Card is activated: Pay 1000 LP; negate the activation, and if you do, destroy it." | Point to the "when", the "price" and the "what happens". Can you use it against a Spell? | Before `:` / between `:` and `;` / after `;`. No: the condition says Trap Card. | R1, R3, R4 |
| Q5 | **Raigeki** (4343): "Destroy all monsters your opponent controls." and **Monster Reborn** (4842): "Target 1 monster in either GY; Special Summon it." | Which of the two makes you choose a card when you play it? | Monster Reborn: it says "Target", before the `;`. Raigeki chooses nothing. | R2, R6 |
| Q6 | Monster Reborn again | Whose Graveyard may you take from? | Yours or the rival's: "either GY". (Also shows that the Graveyard is public.) | Card text; rulebook p. 4 |
| Q7 | **Fissure** (4835): "Destroy the 1 face-up monster your opponent controls that has the lowest ATK (your choice, if tied)." | The rival has a 1000 ATK and a 2500 ATK monster. Can you destroy the 2500 one? | No. The card picks the lowest ATK; you choose only on a tie, and it never says "target". | Card text; R6 (inference, §9) |
| Q8 | **Kuriboh** (4064): "During damage calculation, if your opponent's monster attacks (Quick Effect): You can discard this card; you take no battle damage from that battle." and **Exiled Force** (5323): "You can Tribute this card, then target 1 monster on the field; destroy that target." | It is the rival's turn. Which effect can you use? | Kuriboh: "(Quick Effect)". Exiled Force has none, so only in your own Main Phase. | R11; rulebook p. 10 |
| Q9 | Kuriboh again | Where is Kuriboh when you use it, and what do you pay? | In your hand; you discard it (before the `;`). | R3 |
| Q10 | **Cyber Dragon** (6390): "If only your opponent controls a monster, you can Special Summon this card (from your hand)." and **Marauding Captain** (5318): "Monsters your opponent controls cannot target Warrior monsters for attacks, except this one. When this card is Normal Summoned: You can Special Summon 1 Level 4 or lower monster from your hand." | Which Special Summon can the rival answer with a Chain? | Marauding Captain's (a colon). Cyber Dragon's has no colon and no semicolon: no Chain. | R5, R7 (Cyber Dragon is Part 3's and Part 5's own example) |
| Q11 | **Sangan** (4054): "If this card is sent from the field to the GY: Add 1 monster with 1500 or less ATK from your Deck to your hand, but you cannot activate cards, or the effects of cards, with that name for the rest of this turn. You can only use this effect of \"Sangan\" once per turn." and **Peten the Dark Clown** (6085): "When this card is sent to the GY: You can banish this card from your GY; Special Summon 1 \"Peten the Dark Clown\" from your hand or Deck." | You Tribute one of them to Summon a Level 5 monster. Which effect still happens? | Sangan's ("If"). Peten says "When… You can", and the Summon came after it went to the Graveyard. | R9 for Peten; the "If" half is unverified against a Konami source (§9). Same lesson as Junior's `r-when`. |
| Q12 | Sangan again, from the hand | You discard Sangan from your hand. Does its effect happen? | No: "sent from the field to the GY". | Card text (the condition before `:`), R1 |
| Q13 | **Gagaga Magician** (9618): "Cannot be used as Synchro Material. You can only control 1 \"Gagaga Magician\". Once per turn: You can declare a Level from 1 to 8; this card becomes that Level until the end of this turn." | Can you change its Level twice in one turn? | No: "Once per turn". | R10 (first wording) |
| Q14 | **Upstart Goblin** (4895): "Draw 1 card, then your opponent gains 1000 LP." and **Bottomless Trap Hole** (5400): "When your opponent Summons a monster(s) with 1500 or more ATK: Destroy that monster(s) with 1500 or more ATK, and if you do, banish it." | Upstart Goblin: which happens first? Bottomless Trap Hole: the monster cannot be destroyed. Is it banished? | Draw first, then the gain ("then"). No: "and if you do" needs the destroy. | R8 |
| Q15 | **Mountain** (4338), Field Spell: "All Dragon, Winged Beast, and Thunder monsters on the field gain 200 ATK/DEF." | Where does it go? Does the rival's Dragon gain ATK too? | In the Field Zone. Yes: "on the field" is both sides. | Rulebook pp. 5, 29 ("apply to BOTH players") |
| Q16 | **Black Luster Ritual** (4676, text in §4.5) and **Dawn of the Herald** (8834, §4.5) | You hold a Level 4 and a Level 5 monster. For which Ritual can you Tribute both? | Black Luster Ritual (9 is "8 or more"). Not Dawn of the Herald ("exactly 6"). | Card text; rulebook p. 23 ("as listed on the Ritual Spell Card") |
| Q17 | **Gem-Knight Pearl** (9601): "2 Level 4 monsters" and **Gaia Knight, the Force of Earth** (7697): "1 Tuner + 1 or more non-Tuner monsters" (Level 6) | You control a Level 3 Tuner and a Level 3 non-Tuner. Which one can you Summon? | Gaia Knight (3 + 3 = 6, one Tuner). Not Pearl: it needs two Level 4. | Rulebook pp. 18–21 |
| Q18 | **LANphorhynchus** (13530): Link 2, ATK 1200, DEF "-", "2 monsters" | Can you turn it to Defense Position to protect your Life Points? | No. Link Monsters have no DEF and are never in Defense Position. | Rulebook p. 15 |

Harder, for a later tier (ours): **Trap Hole** (4836) "…Target that monster; destroy that target." against
**Sakuretsu Armor** (5799) "…Target the attacking monster; destroy that target." and **Raigeki Break** (5544)
"Discard 1 card, then target 1 card on the field; destroy it." for "that target" versus "it" (R6; Trap Hole is Part
4's own example); **D.D. Warrior Lady** (5719) "…You can banish that monster, also banish this card." for "also"
(R8); **Number 39: Utopia** for "detach" as a cost (§4.3).

### 5.5 Junior cards that already are real cards

Comparing `copy-en.ts` with the database text (ours):

| Junior card | Junior text | Real card with the same text |
| --- | --- | --- |
| Spark Trade | "Discard 1 card; destroy all monsters your opponent controls." | Lightning Vortex, which adds "face-up" |
| Glow Charm | "You gain 500 LP." | No identical modern text checked; Dian Keto the Cure Master's database text is pre-PSCT ("Increase your Life Points by 1000 points.") |
| Sticky Vine | "When an opponent's monster declares an attack: Negate the attack." | Same condition as Mirror Force / Sakuretsu Armor / Magic Cylinder; Negate Attack itself targets and "then end[s] the Battle Phase" |
| Spark Dash | "Target 1 face-up monster you control; it gains 500 ATK until the end of this turn." | Rush Recklessly (4905): "Target 1 face-up monster on the field; it gains 700 ATK until the end of this turn." |
| Busy Bee / Dozy Moth | "If / When this card is sent to the GY: You can inflict 500 damage to your opponent." | The Sangan / Peten the Dark Clown pair (Q11) |
| Thunder Clap | "Target 1 face-up monster your opponent controls; destroy it." | Same shape as Mystical Space Typhoon (4909) for Spells/Traps |

So the reading rules Junior teaches transfer to real cards word for word; what is missing is the child ever seeing
that they do.

---

## 6. Teaching options (ours)

Everything in this section is a proposal. "Engine" means `engine.ts` / `cards.ts` / `levels.ts`; every new `Move`
must also be listed by `legalMoves` (the hint and the per-level test both search over it), have an event sentence in
each of the three copy files (`copy.test.ts`), and a `Demo`.

### 6.1 Zones

| Option | What the child does | What the engine lacks |
| --- | --- | --- |
| **Z-A. "Where does it go?"** A sorting level on the full mat. | A card is shown; tap the zone it is played to or goes to (a Field Spell, a Trap to Set, a destroyed Monster, a banished card, a Fusion Monster before the duel). Wrong zone: the zone refuses with one line. | A full-mat view (Field Zone, Extra Deck, Extra Monster Zones, banished pile, Deck) even if most zones stay inert; a `place`-like move per destination; a goal "all cards in their zone". This is the existing `w1-field` idea widened, and the cheapest. |
| **Z-B. The Graveyard is a place you can use.** | Open your Graveyard (and the rival's), then a Monster Reborn-style Spell brings a monster back. A second level: the best monster is in the **rival's** Graveyard. | Graveyard contents shown and selectable; an effect "Special Summon from a GY" (the first Special Summon in the engine); `target` pointing at a Graveyard card. |
| **Z-C. A Field Spell changes the sums.** | Play a Mountain-style Field Spell; the board re-does the ATK numbers for both sides; then win a battle that was lost before. A second level: the rival benefits too; a third: playing a new Field Spell sends the old one to the Graveyard. | A `field` slot per side; a continuous modifier in `atkOf`; a monster Type or Attribute on cards to key it on (cards have neither today). |
| **Z-D. Banished is not the Graveyard.** | A puzzle with two removal cards: one destroys (the rival's Busy Bee-style Graveyard effect triggers, or the rival revives it), one banishes (nothing comes back). | A `banished` list per side; an effect "banish"; the Z-B revive to make the difference visible. |
| **Z-E. The Extra Deck is a second, open-to-you deck.** | Before the level: sort six cards into Main Deck and Extra Deck by frame colour and Type line. During play: open your Extra Deck any time; the rival's is closed. | `extraDeck` per side; a pre-duel sorting step (a new level kind); card `frame`/`type` data. Best merged into the first Fusion level. |
| **Z-F. Main and Extra Monster Zones.** | Only meaningful with Link: Summon a Link Monster to the Extra Monster Zone, then a second one where the first points. | Two Extra Monster Zones, arrows, a board wider than three zones. The most expensive; see §6.2 Link. |

Simplification that stays truthful (ours): Junior's three-zone rows are already a shortened mat. Naming the zones
correctly ("Main Monster Zone") and adding one Field Zone, one Graveyard, one banished pile, one Extra Deck per side
keeps the rule "simplified by leaving things out, never by changing them" from `engine.ts`. Pendulum Zones can be
drawn and named in Z-A without any Pendulum play.

### 6.2 Extra Deck methods and Ritual

Each method fits the existing "show, then do" shape: a demonstration by the engine, one level that does only the
Summon, one that needs it to win, then puzzles.

| Method | The playable core | Level ideas | What the engine lacks |
| --- | --- | --- | --- |
| **Ritual** | Activate the Ritual Spell from the hand, pick the Ritual Monster in the hand, tap Tributes (hand or field) until the Levels are enough; the board shows the running total against the number on the Spell. | (1) one Level 4 Tribute for a Level 4 Ritual Monster; (2) "8 or more": Level 4 + Level 5 works; (3) an "exactly" Spell where 4 + 5 is refused; (4) Tribute from the hand to keep the field. | Special Summon from hand by a Spell; a multi-select with a running total (the Tribute picker in `place` is close); cards with `ritual` data; refusal reasons ("levels-too-low", "levels-not-exact"). |
| **Fusion** | Activate a Polymerization-style Spell; choose the named materials from hand and field; they go to the Graveyard; the Fusion Monster comes from the Extra Deck. | (1) both materials on the field; (2) one in the hand; (3) the wrong pair is refused ("the card names its materials"); (4) win-this-turn needing the Fusion's ATK. | `extraDeck`; a Spell effect "fusion"; materials named by card id on the Fusion Monster; choosing the result from the Extra Deck. |
| **Synchro** | Tap the Synchro Monster in the Extra Deck; tap one Tuner and non-Tuners on the field; the board adds the stars; equal = Summon. | (1) 3 + 2 = 5, the rulebook's own example; (2) three monsters, pick the two that make 6; (3) two Tuners refused; (4) a sum one too high refused ("exactly"). | `extraDeck`; a `tuner` flag; a "synchro" move with material choice; reasons ("needs-one-tuner", "levels-not-equal"). No Spell and no Chain: simpler than Fusion in the engine. |
| **Xyz** | Tap the Xyz Monster; tap two same-Level monsters; they slide **under** it and the board shows a small stack. | (1) two Level 4 make a Rank 4; (2) Level 3 + Level 4 refused; (3) detach to use an effect, the material goes to the Graveyard; (4) the materials cannot be attacked or targeted: the rival's attack must hit the Xyz Monster. | `extraDeck`; `materials: CardId[]` on `MonsterSlot`; a "detach" cost; leaving the field sends materials to the Graveyard. |
| **Link** | Tap the Link Monster; tap as many monsters as its Link Rating; they go to the Graveyard; it lands in the Extra Monster Zone, upright, and can never turn sideways. | (1) two monsters for a Link 2; (2) "turn it to Defense" is refused with the reason; (3) with arrows: a second Link Monster where the first points. | `extraDeck`; no `def` and no Defense Position for Link cards (today every `MonsterCard` has `def`, and `position` assumes both positions); for (3) Extra Monster Zones and arrows, which the three-zone board has no room for. |

Two scopes for Link (ours): **Link-lite** teaches Link Rating = number of materials, no DEF, never Defense Position,
on the current board with one Extra Monster Zone drawn between the rows; **Link-full** adds arrows and the second
Link Monster. Link-lite is truthful (it leaves the arrow rule out, it does not change it) as long as no level lets
a second Extra Deck Link or Pendulum Monster be Summoned.

### 6.3 Card reading

| Option | What the child does | What the engine lacks |
| --- | --- | --- |
| **C-A. Anatomy by tapping.** | A large card is shown with a prompt: "Tap its Level", "Tap the word that says it is a Tuner", "Tap where its DEF would be" (a Link Monster: there is none). | A card-inspection level kind (no board); `attribute`, `type`, `frame`, `icon` on card data; a larger card face than `CardFace`. No rules-engine change. |
| **C-B. Colour the sentence.** | The card text is shown; the child taps the part that is the condition, the cost or target, and the effect. The punctuation lights up. PSCT Part 3 itself teaches with green / red / blue; reuse those three colours. | Card text stored as three spans per effect instead of one string (in all three languages); a tap-the-span component. No engine change. |
| **C-C. Read it or lose (the existing World 8 form).** | A board where the winning line depends on one word. Each question in §5.4 has such a form: Q1 as "your hand is one card", Q7 as "Fissure will hit the wrong monster", Q8 as the existing `r-quick`, Q11 as the existing `r-when`, Q14 as an Upstart-style "then". | Per question: Q1/Q2 work today (`cost-needed`); Q5–Q7 need a "lowest ATK, no target" effect; Q10 needs a built-in Special Summon and the rival able to answer a Monster effect; Q14 needs a two-part effect with an order. |
| **C-D. "Did you read it?" check before the move.** | The first time a card is played in a level, one short either/or about that card ("Will this card let you choose which monster?"), answered by tapping one of two **board outcomes**, not a text answer. | A prediction step in `session.ts`; two preview boards from `apply`. This is the closest to the owner's "questions about a specific card". |

The earlier research is against question screens ([junior-mode-playful-learning.md](./junior-mode-playful-learning.md)
§1, §3.1: the version where content was the core mechanic taught more than quizzes between play). C-C keeps to
that. C-A, C-B and C-D are questions in form; they are kept short, tied to the card on screen, and C-D is answered
by choosing an outcome. Whether the owner wants literal questions is open question 3.

### 6.4 Recommended order of introduction

**Sourced:** Konami's own beginner videos order the "Advanced Beginner" block as Special Spells and Traps, Chains,
**Ritual, Fusion, Synchro, Xyz, Pendulum, Link** ([For Beginners](https://www.yugioh-card.com/en/forbeginners/)).
The rulebook lists them in the reverse order, newest first (Link, Pendulum, Xyz, Synchro, Fusion, Ritual; v10
contents page). The Starter Deck *Beginner's Guide* teaches the mat only after battle, Spells and Traps (p. 17),
and the *Speed Duel Guide* introduces only Fusion and Ritual Monsters, by frame colour.

**Ours (judgement, not sourced):**

1. **World 9, "The whole mat"**: Z-B (Graveyard), Z-C (Field Zone), Z-D (banished), then Z-A as the recap on the
   full mat including the zones not yet used. The Graveyard first because every later method sends materials there.
2. **World 10, "Ritual"**: nothing new on the mat, only hand, field and Graveyard; it introduces "a Spell Summons a
   monster" and adding Levels. Card reading inside it: Q16 ("or more" against "exactly").
3. **World 11, "Fusion"**: adds the Extra Deck (Z-E) and frame colours (C-A). Reading: the materials line.
4. **World 12, "Synchro"**: adds Tuner (Type line, C-A) and exact sums. Reading: Q17.
5. **World 13, "Xyz"**: adds Rank, materials under the card, detach as a cost (ties back to World 8's cost rule).
6. **World 14, "Link-lite"**: adds the Extra Monster Zone, Link Rating, no DEF. Reading: Q18. Link-full (arrows)
   only if the board is widened.
7. **Card-reading additions spread through the above** plus one short world of C-B/C-C levels for the rules World 8
   lacks: the colon as condition (Q4, Q12), "no colon, no Chain" (Q10), "then / and if you do" (Q14), targeting
   against "lowest ATK" (Q5–Q7).
8. **Pendulum:** named on the mat in Z-A and in C-A (Pendulum Scale, two text boxes), not played. It needs two more
   zones, a second text box on cards, and the face-up Extra Deck rule; it is the method Konami's own Speed Duel
   material leaves out. Open question 5.

Why Ritual before Fusion although the owner listed it last (ours): it needs no new zone, so the child meets
"Special Summon by a Spell" before meeting the Extra Deck. Why Link last: it is the only method that changes what
the board must look like. Why not put all card reading first: World 8 already exists and the new reading points
(materials line, Tuner, Rank, "exactly") are only readable once the method is known.

Size (ours, a guess): three to five levels per world following the present pattern (demo, do it, use it, one or two
puzzles), so roughly 25 to 35 new levels on top of the present 42.

---

## 7. Language notes

### 7.1 French

Sources: Konami's French *Guide d'Apprentissage* PDF hosted on `yugioh-card.com/eu` (file name
`FR-YS17-Beginner-Guide.pdf`; it contains the beginner's guide followed by the full rules with Link Monsters), the
French *Livret de Règles Officiel Version 9.0* (pre-Link; text extraction worked this time, contrary to the note in
`docs/academy-french-terminology.md`), the French 2021 Rules Update page, and the French card database.

| English | French (official) | Source |
| --- | --- | --- |
| Main Monster Zone | **Zone Monstre Main** | Guide d'Apprentissage p. 17; 2021 Rules Update (fr) |
| Extra Monster Zone | **Zone Monstre Extra** | Guide p. 18; 2021 Rules Update (fr) |
| Spell & Trap Zone | **Zone Magie & Piège** | Guide p. 17; Livret v9 p. 4 |
| Pendulum Zone | **Zone Pendule** | Guide p. 17; Livret v9 p. 5 |
| Field Zone | **Zone Terrain** | Guide p. 18; Livret v9 p. 5 |
| Graveyard | **Cimetière** | Guide p. 17 |
| Deck / Deck Zone | **Deck** / **Zone Deck** | Guide p. 18; Livret v9 p. 5 |
| Extra Deck | **Extra Deck** (Livret v9: "Zone Extra Deck") | Guide p. 18 |
| the field | **le Terrain** | Guide p. 17 |
| banished / to banish | **banni(e)s** / **bannir**; "Cartes bannies (précédemment : retirées du jeu)" | Livret v9 glossary; Pot des Désirs: "Bannissez face verso…" |
| face-up / face-down | **face recto** / **face verso** | Guide p. 17 |
| Fusion Summon | **Invocation Fusion**; verb **Invoquer par Fusion**; **Matériels Fusion** (the Polymérisation card text says "Matériels de Fusion") | Guide p. 29; cid 4837 (fr) |
| Synchro Summon | **Invocation Synchro**; verb **Invoquer par Synchronisation**; **Syntoniseur** (Tuner); **Matériels Synchro** | Guide pp. 27–28 |
| Xyz Summon | **Invocation Xyz**; verb **Invoquer par Xyz**; **Rang**; **Matériels Xyz**; **détacher** | Guide pp. 25–26; cid 9575 (fr) |
| Link Summon | **Invocation Lien**; verb **Invoquer par Lien**; **Monstre Lien**; **Classification Lien** (Link Rating); **Flèches Lien**; **Matériels Lien**; the database shows "Lien 2" | Guide pp. 19–22; cid 13530 (fr) |
| Ritual Summon | **Invocation Rituelle** (Livret v9; Aube du Héraut's card text); verb **Invoquer Rituellement**; **Monstre Rituel**; **Carte Magie Rituelle**; **Sacrifier / Sacrifice** | Guide p. 30; Livret v9; cids 4676, 8834 (fr) |
| Pendulum Summon / Scale | **Invocation Pendule**, **Invoquer par Pendulation**; **Échelle Pendule** | Guide pp. 23–24 |
| Quick Effect | **Effet Rapide** | cid 4064 (fr) "(Effet Rapide)" |
| once per turn | **Une fois par tour :**; "Vous ne pouvez utiliser cet effet de \"Sangan\" qu'une fois par tour."; "Vous ne pouvez activer qu'1 \"Pot des Désirs\" par tour." | cids 13034, 4054, 12465 (fr) |
| When / If | **Lorsque… :** / **Si… :** | cids 6085, 4054 (fr) |
| then / and if you do | **puis** / **et si vous le faites** | cids 4812, 4863 (fr) |
| Target | **Ciblez** / **cibler**; "détruisez la cible" | cid 4909 (fr) |

This settles two terms `docs/academy-french-terminology.md` lists as unverified: **Classification Lien** and
**Pendulation** both appear in Konami's French guide. French card icons are written adjective-last in the database
("Normale Magie", "Jeu-Rapide Magie", "Terrain Magie", "Rituel Magie", "Contre Piège"); the rulebook prose says
"Carte Magie de Terrain", "Carte Magie Rituelle".

French punctuation on cards: a space before the colon and the semicolon ("Défaussez 1 carte ; détruisez…"), and a
lower-case letter after the colon ("…(Effet Rapide) : vous pouvez…"). The colon / semicolon rule itself is the same.
The French guide's own typos ("Vérfiez", "Envoyz") should not be copied.

### 7.2 Hebrew

No Hebrew cards exist. The owner's standing rule (and `docs/academy-junior-play.md`): Hebrew text keeps the English
card word beside the Hebrew one, card names stay English, and card text is printed in English with its Hebrew
meaning underneath. For this work that means every new term above (Main Monster Zone, Extra Monster Zone, Field
Zone, Graveyard / GY, banish, Extra Deck, Fusion / Synchro / Xyz / Link / Ritual Summon, Tuner, Rank, Link Rating,
material, detach, Tribute, Quick Effect, once per turn, target, then, also, and if you do) appears in English in
the Hebrew copy, and the punctuation lessons (C-B) are done on the English text, left-to-right. `copy.test.ts`
already enforces that each Hebrew line carries the English card words of its English line; new copy must pass it.

---

## 8. Open questions for the owner

1. **Real cards or invented cards?** The request says "questions about a specific card". Junior uses invented
   names and emoji art on purpose (IP, [kids-interactive-academy.md](./kids-interactive-academy.md) §8.1). Three
   ways: (a) keep invented cards whose text is word-for-word a real card's (as today); (b) the same, plus a line
   "this is how Lightning Vortex reads" naming the real card without art; (c) real names and texts, no art. Which?
   (b) and (c) need the IP question looked at again.
2. **Which placement rule to show for Fusion, Synchro and Xyz?** This note recommends the 2021 rule (any Main
   Monster Zone). Confirm, since the downloadable rulebook still shows the 2017 rule and a child with a Starter Deck
   booklet will read the old one.
3. **Are literal questions wanted?** Options C-A, C-B and C-D are question-like; the earlier research and the
   owner's earlier remark ("not too many questions") point to C-C (boards where the word decides the result).
   Mix, or boards only?
4. **Link: lite or full?** Link-lite fits the three-zone board; Link-full (arrows, second Link Monster, both Extra
   Monster Zones) needs a wider board. Is the arrow rule wanted in Junior at all?
5. **Pendulum:** name the zones and the Scale only (recommended), or also play a Pendulum Summon?
6. **Board width.** Keep three Main Monster Zones for the new worlds, or move to five for the "whole mat" world so
   the child sees the real mat once?
7. **Does the rival use these too?** Today the rival never uses a Monster effect. Should the rival Fusion / Xyz
   Summon in a capstone duel, or do only the child's side?
8. **"If… never misses" and the once-per-turn wordings** are taught (or would be) without a Konami TCG document
   behind them (§9). Accept as standard play, or have the judge contacts confirm before more levels build on them?
9. **Face-down banished cards:** teach only "banished face-down, nobody uses them again" (what Pot of Desires
   shows), and leave "who may look" out, since no source was found?
10. **Level budget.** Roughly 25 to 35 new levels (a guess). Is that the intended size, or should the first cut be
    one world (zones) to try with children first?

### 8.1 Owner's answers (2026-11-17)

1. **Real names and real card text** may be used.
2. **Teach the 2021 placement rule** (Fusion, Synchro and Xyz Monsters to any Main Monster Zone).
3. **Boards only** for card reading: the word on the card decides the result; no literal quiz questions.
4. **Link-lite** to begin with (no arrow rule); Link-full can come later.
5. **Play a Pendulum Summon**, not just name the zones. This overrides the recommendation in question 5.
6. **Whole mat**: five Main Monster Zones, so the child sees the real mat.
7. **The rival uses Extra Deck Summons too** in a capstone duel.
8. **"If… never misses" and the once-per-turn wordings are accepted as standard play** (the owner answered "yes";
   read here as "accept", not "have a judge confirm first").
9. **Face-down banish: teach that it exists**, and leave "who may look" out.
10. **Level budget: left to our recommendation.** Ours: build the full set (about 25 to 35 levels), one world at a
    time in the §6 order, the zones world first because every later world needs the whole-mat board.

Consequences to settle at design time (ours):

- Answers 4 and 5 meet at one rule: a Pendulum Monster Summoned from the **Extra Deck** needs the Extra Monster
  Zone or a zone a Link Monster points to (§3), which is the arrow rule Link-lite leaves out. A Pendulum Summon
  from the **hand** has no such limit. The simple fit is to Pendulum Summon from the hand only at first, and show
  a destroyed Pendulum Monster going face-up to the Extra Deck without Summoning it back.
- Answer 1 changes the IP position recorded in [kids-interactive-academy.md](./kids-interactive-academy.md) §8.1
  (invented names, emoji art). Card art is not covered by the answer; names and text only.

---

## 9. Unverified / could not confirm

| Point | Status | Why |
| --- | --- | --- |
| Whether a newer English rulebook than Version 10 exists | **Not found.** | Konami's rulebook page links only v10 (PDF dated 2017-07-27); the 2021 Rules Update says its changes "will be incorporated into an upcoming rulebook update". Stated as "current as far as the site shows". |
| Date the Main Monster Zone change took effect | **Not stated** on the page. | The page says some changes "have already been in effect"; it gives no date. No date is asserted here. |
| Who may look at face-down banished cards; whether banished cards are public | **Silent.** | Rulebook v10's *Public Knowledge* entry lists hand and Deck counts, Graveyards and LP only. The glossary entry for banished cards says only that they are "separated from the field". Face-down banishing is attested by Pot of Desires' text alone. |
| Banished cards are face-up by default | **Inference.** | No sentence says it; "face-down" is written on the cards that do it. |
| A Pendulum Monster sent from the **hand or Deck** to the Graveyard goes to the Graveyard | **Inference** from "on the field" (p. 17). | No separate sentence. |
| "If… you can" effects never miss their chance | **Unverified against a Konami TCG document.** | PSCT Parts 6 and 7 establish only that optional "When" effects depend on "the last thing that happened". The article Part 7 promised on strict timing is not in the Advanced Rules section today. Junior already teaches this (`docs/academy-junior-play.md`). Secondary sources (fan wikis) state it; they were not used as the basis. |
| How the three "once per turn" wordings differ (per copy against by name; "use" against "activate") | **Unverified against a Konami TCG document.** | The wordings are quoted from the database; no PSCT article, rulebook page or Advanced Rules page read here explains the difference. Search results were fan wikis and forums only. Konami's Japanese database Q&A, which this repo's rules audits cite, was not searched for this. |
| A card that does not say "target" does not target | **Inference** from PSCT Parts 3, 4 and 6. | Consistent with every example there; never stated as a rule in those articles. |
| A Link Summon starts no Chain | **By analogy.** | PSCT Part 5 and the Fast Effect Timing page name Xyz and Synchro (both pages predate Link Monsters). The rulebook's Link procedure has the same "declare" form. |
| Rank and Link Rating cannot stand in for a Level (so no Xyz or Link Monster as Synchro / Xyz material by Level, or in a Ritual total) | **Inference.** | v10 says Xyz Monsters "have Ranks instead of Levels" and gives Link Monsters no Level; it has no sentence about using them as material by Level. |
| Frame colours of Spell Cards, Trap Cards and Pendulum Monsters | **Not in any text read.** | The Beginner's Guide and Speed Duel Guide name yellow, orange, purple, white, black, dark blue and blue (Ritual) in words; Spell, Trap and Pendulum frames are pictures only. |
| Which way the Link Arrows of LANphorhynchus and Link Spider point | **Not read.** | The database shows arrows as an image; no text. Needed only for Link-full. |
| The mat diagram (positions of zones 1 to 7) and the Speed Duel mat's zone counts | **Not read.** | Pictures in the PDFs; only the numbered captions were extracted. That a Speed Duel uses three Monster Zones is therefore not cited here. |
| Rulebook page numbers | **Derived.** | The PDF is laid out two printed pages per sheet; printed numbers were read from the extracted text and matched to their columns. A citation could be off by one page within a spread. |
| French terms | **Read from Konami's French PDFs and database**, not checked by a native speaker. | The French rulebook on Konami's site is Version 9.0 (pre-Link); Link and Extra Monster Zone terms come from the French Starter Deck guide and the French 2021 Rules Update. |
| The DIVINE Attribute | **Not in v10.** | v10 lists six Attributes; DIVINE is known from the database's search form only and was not checked on a card. |

Every card text in this note was copied from the database page fetched on 2026-11-17. Card texts are revised by
Konami from time to time; re-fetch by cid before printing any of them in the app.

---

## Appendix: primary sources consulted (all accessed 2026-11-17)

**Konami: rules documents**
- Official Rulebook Version 10 (English): <https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf>,
  linked from <https://www.yugioh-card.com/en/rulebook/>
- 2021 Rules Update: <https://www.yugioh-card.com/en/play/2021_rules_update/>;
  French: <https://www.yugioh-card.com/eu/fr/play/2021-rules-update/>
- Fast Effect Timing: <https://www.yugioh-card.com/en/play/fast-effect-timing/>
- Advanced Rules index: <https://www.yugioh-card.com/en/play/advanced-rules/>
- Starter Deck Beginner's Guide (English): <https://www.yugioh-card.com/en/downloads/rulebook/YS17_BG_EN.pdf>
- Speed Duel Guide (English): <https://www.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf>
- For Beginners (video list and order): <https://www.yugioh-card.com/en/forbeginners/>
- Livret de Règles Officiel Version 9.0 (French):
  <https://img.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_fr.pdf>, linked from
  <https://www.yugioh-card.com/eu/fr/play/yu-gi-oh-tcg-rulebook/>
- Guide d'Apprentissage (French, with Link rules):
  <https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/FR-YS17-Beginner-Guide.pdf>, linked from
  <https://www.yugioh-card.com/eu/fr/play/yu-gi-oh-tcg-beginners-guide/>

**Konami: Problem-Solving Card Text**
- Index: <https://www.yugioh-card.com/en/play/psct/>
- Part 1, Reading the Cards of Tomorrow (2011-05-20): <https://www.yugioh-card.com/en/play/psct/psct-1/>
- Part 2, New Words & Phrases (2011-05-23): <https://www.yugioh-card.com/en/play/psct/psct-2/>
- Part 3, Conditions, Activations, and Effects (2011-06-01): <https://www.yugioh-card.com/en/play/psct/psct-3/>
- Part 4, The Clues on Your Cards (2011-06-01): <https://www.yugioh-card.com/en/play/psct/psct-4/>
- Part 5, Special Summons (2011-07-27): <https://www.yugioh-card.com/en/play/psct/psct-5/>
- Part 6, Finding Clues in TU6 & GENF (2011-08-08): <https://www.yugioh-card.com/en/play/psct/psct-6/>
- Part 7, 2012 Update – Conjunction Functions (2012-12-12): <https://www.yugioh-card.com/en/play/psct/psct-7/>
- The same series on the European site ("Understanding Card Text"; index only was read):
  <https://www.yugioh-card.com/eu/play/understanding-card-text/>

**Konami: card database** (`https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=<cid>&request_locale=en`,
and `request_locale=fr` for French). cids read: Polymerization 4837; Flame Swordsman 4021; Flame Manipulator 4148;
Masaki the Legendary Swordsman 4299; Gaia the Dragon Champion 4043; Gaia The Fierce Knight 4044; Curse of Dragon
4045; Gaia Knight, the Force of Earth 7697; Tune Warrior 7684; Giant Soldier of Stone 4080; Junk Warrior 7696; Junk
Synchron 7687; Gem-Knight Pearl 9601; Number 39: Utopia 9575; LANphorhynchus 13530; Link Spider 13034; Decode Talker
13036; Black Luster Soldier 4370; Black Luster Ritual 4676; Paladin of White Dragon 5600; White Dragon Ritual 5601;
Dawn of the Herald 8834; Herald of Perfection 7674; Black Illusion Ritual 4802; Relinquished 4737; Advanced Ritual
Art 6996; Ritual of Grace 8491; Mountain 4338; Monster Reborn 4842; Pot of Desires 12465; Raigeki 4343; Dark Hole
4342; Fissure 4835; Mystical Space Typhoon 4909; Raigeki Break 5544; Lightning Vortex 5217; Seven Tools of the
Bandit 4863; Kuriboh 4064; Exiled Force 5323; Sangan 4054; Peten the Dark Clown 6085; Cyber Dragon 6390; Marauding
Captain 5318; Gagaga Magician 9618; Upstart Goblin 4895; Graceful Charity 4812; Bottomless Trap Hole 5400; Trap Hole
4836; Sakuretsu Armor 5799; D.D. Warrior Lady 5719; Rush Recklessly 4905; Dian Keto the Cure Master 4348; Negate
Attack 4804; Mirror Force 4887; Magic Cylinder 5124.

**Repository files read**
- `docs/academy-junior-play.md`, `docs/academy-junior-pilot.md`, `docs/academy-french-terminology.md`
- `docs/research/junior-mode-playful-learning.md` (head and structure), `docs/research/kids-interactive-academy.md`
  (structure), `docs/research/beginner-lessons-rules-audit.md`
- `apps/academy-ygo/src/lib/junior/play/{cards,levels,engine,copy,copy-en,copy-fr,session}.ts` (`engine.ts` and
  `session.ts`: types and exports; `copy-fr.ts`: zone names)
- `apps/academy-ygo/src/components/junior/play/{mini-board,level-player}.tsx` (card face, board, reader panel)
