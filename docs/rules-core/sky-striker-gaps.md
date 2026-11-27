# Sky Striker 745443: mechanic gaps of the cards still to script (audit, 2026-11-26)

What each of the **20 Main/Extra names missing at audit time** of the exact Sky Striker list (`packages/rules/src/deck-manifests.ts`;
7 of 27 distinct names were registered then; **all 27 are registered since Batch 8, 2026-11-26**, which is not tournament readiness)
needs from the rules core, clause by clause, and what is missing. Same shape as
[blue-eyes-gaps.md](blue-eyes-gaps.md). **Audit only: no core or card code was changed.** The Side inventory is out of scope.

Core inspected as it stands on 2026-11-26 after the core-gap slice (README, last section; `src/core-gap-sources.ts`; its five test
files, 23 tests, pass): Battle Phase Start/End Steps, the `attack-target` lock, `summon.oncePerTurn`, the GY-to-banish `redirect`
layer, `EffectRecord.during`. **As audited, Sky Striker Ace - Hayate's mechanics existed and the Hayate card was not written** (no
`src/cards/sky-striker-ace-hayate.ts` then): it was one of the 20 below. It was written in batch 5 and is registered now (docs/card-plan.md).

Sources read for this audit (2026-11-26, each page fetched once, kept outside the repo):
- **EN**: Konami's TCG card page of each of the 20 cards (`card_search.action?ope=2&cid=…&request_locale=en`): name, stats, text.
- **FR**: the same page in `request_locale=fr` for all 20 (names and texts present; French text is quoted by each card's slice).
- **JP**: Konami's Japanese notes page of each card (`faq_search.action?ope=4&cid=…`, OCG only) and its full Q&A list (titles and
  fids). Q&A opened here: fids 23614, 24167, 23977, 17476, 8571, 24029, 24001, 11555, 24032, 13241, 24181, 13232, 16743, 11586,
  23933, 8161, 23445, 8398, 23195, 24189, 11533, 24016. Opened earlier and reused (2026-11-24/26 slices): 24164, 24165, 24166, 23993,
  13862, 17195, 24393. All Japanese pages are OCG only: no formal TCG authority.
- Link Arrows: read from the EN page's `icon_img_set linkNN` class (keypad digits: 7 8 9 / 4 6 / 1 2 3). The mapping was checked once on
  Hieratic Seal of the Heavenly Spheres (cid 13496, `link13`, written bottom-left and bottom-right in its script). An inference from the
  page's markup, to confirm against the card image in each slice.

**YGOProJudge: no question was sent.** Every decision point found has a Konami page (OCG notes or Q&A) or is a per-card detail for its
slice. The known leads (End Phase ordering, no-zone control return) were reused, not re-asked.

## Summary

| # | Card | cid | Kind / stats (EN page) | Needs | Batch |
|---|---|---:|---|---|---|
| 1 | Pot of Sloth | 23010 | Normal Spell | nothing new | 5 |
| 2 | Sky Striker Mobilize - Engage! | 13671 | Normal Spell | nothing new | 5 |
| 3 | Sky Striker Mecha - Shark Cannon | 13677 | Quick-Play Spell | nothing new | 5 |
| 4 | Sky Striker Mecha - Widow Anchor | 13675 | Quick-Play Spell | nothing new (S6 for its Shizuku interplay, tested in batch 7) | 5 |
| 5 | Sky Striker Mobilize - Linkage! | 17034 | Quick-Play Spell | nothing new | 5 |
| 6 | Sky Striker Ace - Kagari | 13668 | FIRE Machine Link 1, 1500, arrow top-left | nothing new | 5 |
| 7 | Sky Striker Ace - Hayate | 13763 | WIND Machine Link 1, 1500, arrow bottom-left | nothing new (core-gap slice) | 5 |
| 8 | Radiant Typhoon Vision | 21829 | Quick-Play Spell | card pattern: modes with their own once (P1) | 6 |
| 9 | The Fallen & The Virtuous | 22089 | Quick-Play Spell | card pattern: modes with their own cost (P1) | 6 |
| 10 | Sky Striker Special Maneuver - Lemnisgate! | 21480 | Quick-Play Spell | nothing new | 6 |
| 11 | Sky Striker Ace - Azalea | 18448 | DARK Machine Link 2, 1500, arrows top-left, bottom-right | nothing new | 6 |
| 12 | Sky Striker Ace - Raye | 13670 | DARK Warrior Level 4, 1500/1500 | **S1** | 7 |
| 13 | Sky Striker Ace - Roze | 14829 | LIGHT Warrior Level 4, 1500/1500 | **S1** | 7 |
| 14 | Sky Striker Ace = Zero | 21460 | LIGHT Machine Link 2, 2000, arrows bottom-left, bottom-right | **S3** | 7 |
| 15 | Sky Striker Ace - Shizuku | 13669 | WATER Machine Link 1, 1500, arrow top-right | **S5**, S6 (Q&A 11555) | 7 |
| 16 | The Dragon that Devours the Dogma | 22090 | DARK Beast Fusion Level 8, 3000/2500 | **S5** | 7 |
| 17 | Sky Striker Ace - Zeke | 14947 | DARK Machine Link 2, 1500, arrows top, bottom | **S2** | 8 |
| 18 | S:P Little Knight | 19188 | DARK Warrior Link 2, 1600, arrows left, right | **S2**, **S4**, S8 | 8 |
| 19 | Ecclesia and the Dark Dragon | 22144 | LIGHT Spellcaster Synchro Level 8, 2500/2500 | **S2** | 8 |
| 20 | Prototype Sky Striker Ace - Amatsu | 21600 | DARK Machine Link 1, 1500, arrow bottom | **S7** | 8 |

"Nothing new" means every printed clause maps to an existing mechanic. It does not mean done: each card still owes printed identity
(archetypes: every "Sky Striker Ace" card is also a "Sky Striker" card, read from the name as for "Blue-Eyes"), EN/FR text, its notes
and Q&A, one test per clause and ruling, and an independent review.

## Core gaps (S1-S8), each with its consumers and source

**Status, 2026-11-26: S1 to S8 are built** in `packages/rules` (test-first, made-up `fixture-` cards, no real card; records in
`src/sky-striker-gap-sources.ts`; API, tests and limits in the last section of `packages/rules/README.md`). Each gap below ends with
its status line. Batches 7 and 8 are no longer blocked by the core.

- **S1. "Leaves the field by an opponent's / your card effect".** The `moved` event carries `destruction` for destroyed moves only;
  `MoveTo.effect` is passed to `moveCard` but is not on the event. Needed: the effect (source snapshot and player) on every `moved`
  done by an effect's processing: banished, returned to hand or Deck, sent, Tributed by an effect, destroyed. Not a cost, not a Summon
  procedure, and not a monster used as material by an effect that performs a Summon (fid 23445: not "left by the opponent's effect").
  fid 23614: "効果の処理によって" (by the effect's processing): destroy, banish, return to hand or Deck. A move to a Spell & Trap Zone or
  attaching as Xyz Material is not leaving the field. Consumers: Raye ②, Roze ②. Whose monster it was is `before.controller` (fid 8161).
  **Status: built.** `moved.effect` and `leftFieldBy(event)` (src/events.ts); `tribute(duel, ids, usedFor, link)` for a Tribute by an
  effect. Tests: `test/rules/left-by-effect.test.ts` (5). An operation must name its effect on each move (`effect: link`).
- **S2. Temporary banishment** ("banish ... until the End Phase", "until your opponent's next End Phase", "banish this card (until the
  End Phase)"). Nothing exists. Konami: Zeke's and S:P's notes, Ecclesia's notes, fids 8571, 24029, 24001, 11586, 16743, 17476, 24032,
  11533. Needed:
  - Banished face-up, or face-down when the monster is face-down (S:P notes).
  - Comes back at the due End Phase as a **mandatory End Phase process of the effect's controller**, with no Chain Link and not a
    Summon. The player orders it with their other End Phase processes when they hold priority (fid 11533's worked example).
    `delay` with `mandatory: true` is the carrier.
  - Goes to the Main Monster Zone of the player who controlled it when it was banished, that player choosing the zone (fid 8571),
    in the position it was banished in.
  - The monsters banished by one effect come back together. Each that cannot come back is **placed** in its owner's GY, which is not
    "sent" (fid 24001). With one zone for two, the player picks which one comes back (fid 24029). Ecclesia's notes say the same.
  - It is a new card for "stayed face-up since Summoned" (Shizuku, fid 24032) and for once-per-turn uses. It keeps "Special Summoned
    from the Extra Deck" (fid 16743) and its properly-Summoned status (Spirit Dragon's notes, already cited in the core). A monster
    not properly Summoned also comes back (fid 11586 C).
  - A control change with a duration ends at once on its return (fid 17476 B); a control change without one is kept (fid 17476 A).
  - A monster unaffected by the effect is not banished; the other target still is (S:P notes).
  - Consumers: Zeke ①, S:P ②, Ecclesia ①.
  - **Status: built.** `banishTemporarily(duel, ids, link, due)` (src/temporary.ts), `MoveTo.placed`, `CardInstance.summonedFrom` and
    `summonedTurn`. Tests: `test/rules/temporary-banishment.test.ts` (12). Limits: only a free Main Monster Zone decides whether a
    monster can come back; the player who owes the return cannot pass first (fid 11533 lets them wait until both have passed).
- **S3. "Cannot be used as Link Material."** No such restriction exists. It is not an effect and still applies while negated (Zero's
  notes). Read by the Link material filter, both for the procedure and for a Summon by effect (Lemnisgate). Consumer: Zero.
  **Status: built.** `CardDef.cannotBeMaterial: ["link"]`. Tests: `test/rules/summon-materials.test.ts` (2).
- **S4. The materials of a Summon.** Needed for "If this card is Link Summoned using a Fusion, Synchro, Xyz, or Link Monster as
  material" (S:P ①): the materials as they were on the field, readable by the Summoned card's trigger. Today `useMaterials` moves them
  (`usedFor`) and nothing records them on the monster. fid 24016 says the effect is activated by the controller after the chain. No
  page read says whether a material that was not a Fusion/Synchro/Xyz/Link card by its frame counts: read the frame as printed.
  **Status: built.** `summoned.materials` and `CardInstance.summonMaterials` (snapshots of the materials as they were); a waiting
  trigger follows a control change on the field (fid 24016). Tests: `test/rules/summon-materials.test.ts` (3).
- **S5. A "During the End Phase" optional effect of the non-turn player.** The core-gap slice offers `during` to the turn player only
  (its known limit). Konami fid 11533 (OCG) is a source for the window: after the turn player passes, the other player activates or
  applies their End Phase effects in any order, and then mandatory processes are done, the turn player first. The same window
  already exists for delayed effects (`delay`, the `apply` action), so extend `phaseTriggers` the same way. Consumers: Shizuku ② (often
  Special Summoned in the opponent's turn by Raye or Zero) and Dogma ③ (sent as the cost of The Fallen & The Virtuous in the
  opponent's turn).
  **Status: built.** `EffectRecord.eitherTurn` beside `during: "end"`. Tests: `test/rules/end-phase-order.test.ts` (3).
- **S6. Control "until the End Phase" given back as an orderable End Phase process.** Today `returnControl` runs as the End Phase begins,
  before anything. fid 11555 (Mind Control on Shizuku): the player who took control chooses whether to give it back first or to
  activate Shizuku ② first; whoever controls Shizuku then may activate it. fid 17476 B covers the interplay with S2. Consumer: Widow
  Anchor (its own clauses work today; the interplay test goes in batch 7 with Shizuku). The "destroyed when no zone" fallback stays a
  YGOProJudge lead.
  **Status: built.** The return is an `apply` action of the player who took the monster (`controlReturnsDue`, src/modifiers.ts),
  owed in the End Phase. Tests: `test/rules/end-phase-order.test.ts` (2). A test that passes through the End Phase while a monster
  is taken must now `apply <monster>` (the shared `nextTurn` helper does it). Shizuku's "once per turn" needs
  `{ scope: "instance", acrossMoves: true }` for the second half of fid 11555.
- **S7. A monster's ATK when its effect was activated.** Amatsu ①: "a monster your opponent controls with 2000 or more ATK activates
  its effect". fid 24164: a monster that Tributes itself as the cost is judged by its ATK before it left. The link holds the card
  but not its ATK (README's limit on Amatsu). Needed: the ATK/DEF read before the cost, on the link. Blue-Eyes Spirit Dragon (2500,
  Tributes itself) makes this real in a Blue-Eyes vs Sky Striker duel.
  **Status: built.** `Link.stats` (`{ atk, def }`). Tests: `test/rules/activation-stats.test.ts` (2).
- **S8 (optional). A target combination rule** for "target 2 face-up monsters on the field, including a monster you control" (S:P ②).
  `targetGroups` can express it, but the same pair then appears twice, once per split. A combination predicate on `target`/`targetCount`
  avoids that. Without it, the card uses `targetGroups` and the bot sees duplicate actions.
  **Status: built.** `EffectRecord.targetCheck` (also per mode). Tests: `test/rules/target-check.test.ts` (2).

**P1, card pattern, no core change.** Radiant Typhoon Vision ("you can only use each of these effects once per turn") and The Fallen
& The Virtuous (●1 has a cost, ●2 none) need a `once` and a `cost` per mode. `EffectMode` has neither (the record's apply to every
mode). Write each mode as its own `activation` record (True Light has two). Radiant Typhoon Vision gets one `once` per record; the
choice counts even when negated (fid 23977, which lists this card by name). The Fallen & The Virtuous keeps "activate 1 per turn" as a
`once.key` shared by its two records. Fallback, if the bot naming or the categories break: add `cost`/`once` to `EffectMode`
(a small core change).
**Status, 2026-11-26: P1 used, no core change** (batch 6: `radiant-typhoon-vision.ts`, `the-fallen-and-the-virtuous.ts`, with `sky-striker-special-maneuver-lemnisgate.ts`,
`sky-striker-ace-azalea.ts`, and `mystical-space-typhoon.ts` brought to the definition of done). Two records per card, told apart in tests by the
action's `effect` index (the label of both activations is the same when neither has a target). Gaps found, not fixed: a card turned face-down is a new
card, so `targetsOf` forgets it, while the notes of The Fallen & The Virtuous say its destruction still happens (the card reads a flip as `moves + 1`);
the card of this list that is activated in a chain cannot be chosen by a "return 1 card on the field to the hand" effect (Lemnisgate!, Q&A fid 21580 by
analogy, as Hieratic Seal does), duplicated in each card for lack of a shared helper.

## Main Deck cards, clause by clause

**Pot of Sloth** (no Q&A)
- "Draw cards equal to the number of cards your opponent controls". Exists: a draw by effect.
- "then if you drew 2 or more cards, place cards from your hand on the bottom of the Deck in any order, equal to the number you
  drew -1". Exists: `askUpTo` (min = max) and then `askBottomOrder`. The two are not simultaneous (notes).
- "For the rest of this turn after this card resolves, you cannot activate "Pot of Sloth"." Exists: an `activate` lock set at
  resolution. Notes: it applies whether or not the draw succeeded, unless negated.

**Sky Striker Mobilize - Engage!**
- "If you control no monsters in your Main Monster Zone": a condition on `slot < 5` (the Extra Monster Zones are slots 5 and 6).
- "Add 1 "Sky Striker" card from your Deck to your hand, except ...": exists. "then, if you have 3 or more Spells in your GY, you can
  draw 1 card": exists (`breakEffect`, `askMay`, `cardTypeOf`). Notes: not simultaneous. fid 13232: it can be activated with 1 card
  left in the Deck; the draw is then not offered.

**Sky Striker Mecha - Shark Cannon**
- Target 1 monster in the opponent's GY; "banish that monster, or, if you have 3 or more Spells in your GY, you can Special Summon
  that monster to your field instead, but it cannot attack." Exists: the Monster Reborn shape (`test/rules/summon-fixtures.ts`),
  `askMay`, `canBeRevived`, an `attack` lock on that card while it stays face-up (notes). Not in the Damage Step.

**Sky Striker Mecha - Widow Anchor**
- Target 1 face-up Effect Monster on the field; "negate ... until the end of this turn, then, if you have 3 or more Spells in your
  GY, you can take control of that monster until the End Phase". Exists: `negateCardEffects`, `takeControl` (to a Main Monster Zone,
  also from an Extra Monster Zone). Notes: nothing happens if the target is no longer face-up in the Monster Zone. fid 8398: an effect
  of the negated monster activated in the Monster Zone stays negated even if its cost removed it (already tested with Infinite
  Impermanence). S6 for fids 11555 and 17476.

**Sky Striker Mobilize - Linkage!**
- "You cannot Special Summon from the Extra Deck for the rest of this turn after this card resolves, except "Sky Striker Ace"
  monsters". Exists: a `summon` lock with `only`. Notes and fid 24181: it applies even if the send or the Summon failed.
- "send 1 other card you control to the GY, and if you do, Special Summon 1 "Sky Striker Ace" monster from your Extra Deck to the
  Extra Monster Zone". Exists: the redirect layer makes the "if you do" fail (fid 24181), and `askSpecialSummon` with `zones` limited
  to 5 and 6 (`summonZones` already allows one Extra Monster Zone per player).
  - Card rule (notes): when the player has a monster in an Extra Monster Zone and a Summonable "Sky Striker Ace" in the Extra Deck,
    only that monster can be sent.
  - The notes call the send and the Summon simultaneous; the core does two moves in a row (as for Crimson Dragon). No consumer reads
    the difference.
- "and if you have at least 1 LIGHT and 1 DARK "Sky Striker Ace" monsters on your field and/or in your GY, the Summoned monster gains
  1000 ATK". Exists: a stat modifier, read when the Summon is done (notes).

**Sky Striker Special Maneuver - Lemnisgate!**
- ① "Target an equal number of "Sky Striker Ace" monsters and "Sky Striker" Spells in your GY; shuffle them into the Deck". Exists:
  `targetGroups` with `sameCount`; Extra Deck monsters go back to the Extra Deck. "then, for every 3 shuffled cards, you can return up
  to 1 card on the field to the hand". The number counted is how many actually went back; `askUpTo`. Notes: not simultaneous; targets
  that are gone are skipped.
- ② "If a "Sky Striker" monster(s) is Special Summoned to your field, while this card is in your GY (except during the Damage Step):
  You can banish this card; immediately after this effect resolves, Link Summon 1 "Sky Striker Ace" Link Monster." Exists:
  - a Graveyard trigger on `summoned`, not fired for a card that arrives in the GY at the same time;
  - the cost banishes the card itself;
  - `summonByEffect` (Chain Link 1: the Summon's window opens after the chain; Chain Link 2 or higher: no window; Q&A 24054, 16986);
  - "Must be Link Summoned" monsters are allowed, since it is a Link Summon.
  fid 24167: a Quick-Play Spell activated as Chain Link 2 or higher stays on the field until the chain ends, so it is not yet in the GY
  when the Chain Link 1 Summon happens. Already the core's rule (`resolveChain` sends Spells after the whole chain). fid 23933: the
  effect counts as "an effect that Special Summons" (categories).

**Radiant Typhoon Vision**
- "Activate 1 of these effects (but you can only use each of these effects ... once per turn)": P1. ●1 "Draw 2 cards, then if you have
  a "Radiant Typhoon" card or a Quick-Play Spell in your hand, discard 1 of them, or your entire hand if you don't." Exists: draw,
  `breakEffect`, a discard (`reason: "discarded"`). ●2 "Add 1 "Mystical Space Typhoon" from your Deck or GY to your hand." Exists.
- "If this card is destroyed by the effect of "Mystical Space Typhoon": You can Set this card." Exists:
  - `moved.destruction.source` read by printed name;
  - two records, Graveyard and face-up banishment (notes: where it first went);
  - `setByEffect` from either place.
  **Mystical Space Typhoon is "registered, completeness pending"**: bring it to the definition of done in the same batch.

**The Fallen & The Virtuous**
- "(always treated as a "Branded" and "Dogmatika" card)": `facts.archetypes` (notes: not an effect).
- ●1 "Send 1 monster that mentions "Fallen of Albaz" from your Extra Deck to the GY, then target 1 face-up card on the field; destroy
  it." The send is the cost (JP: 送り…対象として発動できる), so under the redirect it is not paid. Filtered by `mentionsCard`. Dogma
  and Ecclesia name "Fallen of Albaz" in their text, so their `facts.mentions` must hold it. It cannot target itself (notes), and it
  destroys a target that was turned face-down (notes).
- ●2 "If you have an "Ecclesia" monster in your field or GY: Target 1 monster in either GY; Special Summon it to your field."
  Exists: the Monster Reborn shape and `canBeRevived`, so a Dogma sent by ●1 was never properly Summoned and cannot be revived.
  Notes: the Ecclesia monster must be face-up if it is on the field.
- "You can only activate 1 ... per turn": `once.key` over both records (P1).

**Sky Striker Ace - Raye**
- ① "(Quick Effect): You can Tribute this card; Special Summon 1 "Sky Striker Ace" monster from your Extra Deck to the Extra Monster
  Zone." Exists: a `quick` record with the Tribute cost and `askSpecialSummon` limited to the Extra Monster Zones. Notes:
  - it cannot be activated if no Extra Monster Zone can take the monster;
  - it is not a Link Summon, so Azalea and Zeke (`onlyByOwnProcedure`) are not candidates;
  - not in the Damage Step;
  - `summon.oncePerTurn` limits the candidates.
- ② "While this card is in your GY, if a face-up "Sky Striker Ace" Link Monster you control is destroyed by battle, or leaves the
  field by an opponent's card effect: You can Special Summon this card." "Destroyed by battle" exists:
  - a trigger at the end of the Damage Step, where the core sends battle-destroyed monsters to the GY;
  - fid 13241: Raye sent by Hayate after damage calculation can be activated there;
  - Raye must already be in the GY (it is not triggered when destroyed at the same time);
  - fid 8161: the player who controlled the destroyed monster is the one who may activate it.
  **"Leaves the field by an opponent's card effect": S1.**
- "each effect ... once per turn": two `once` keys.

**Sky Striker Ace - Roze**
- ① "If a "Sky Striker Ace" monster(s) is Normal or Special Summoned, except "Sky Striker Ace - Roze" (except during the Damage
  Step): You can Special Summon this card from your hand." Exists: a hand trigger on `summoned`. Notes: the Summoned monster must be
  face-up.
- ② "If an opponent's monster in the Extra Monster Zone is destroyed by battle, or leaves the field by your card effect, while this
  card is in your GY: You can Special Summon this card, then you can negate the effects of 1 face-up monster your opponent controls,
  until the end of this turn." "In the Extra Monster Zone" is `before.slot >= 5`. Battle exists; **"by your card effect": S1.** The
  negation is chosen when it resolves (not a target) and is not simultaneous with the Summon (notes): `askMay` + `negateCardEffects`.

## Extra Deck cards, clause by clause

**Sky Striker Ace - Kagari** (Link 1: "1 non-FIRE "Sky Striker Ace" monster")
- Once-per-turn Special Summon: `summon.oncePerTurn`. "If this card is Special Summoned: You can target 1 "Sky Striker" Spell in your
  GY; add it to your hand": exists, also in the Damage Step (notes). "Gains 100 ATK for each Spell in your GY": exists, as Primite
  Lordly Lode's per-count gain.

**Sky Striker Ace - Hayate** (Link 1: "1 non-WIND "Sky Striker Ace" monster"). **Mechanics built by the core-gap slice; card not
written.**
- `summon.oncePerTurn`; "Can attack directly" is the `attack` permission `directly`. "After damage calculation, if this card battled:
  You can send 1 "Sky Striker" card from your Deck to the GY" is a trigger on `damage-step` `after` with `battledNow`. Notes: also after
  a direct attack, and also when Hayate is destroyed by that battle. Q&A 23993 and 13862 are already tested
  (`attack-targets.test.ts`); 13241 is above. 17195, 23936, 23937, 24347 (damage-calculation edge cases) and 21899 (Muzzle Flash
  Dragon, absent) are still unread.

**Sky Striker Ace - Shizuku** (Link 1: "1 non-WATER "Sky Striker Ace" monster")
- `summon.oncePerTurn`. "Monsters your opponent controls lose 100 ATK/DEF for each Spell in your GY": exists (a continuous stat
  modifier on the other side).
- "Once per turn, during the End Phase, if this card was Special Summoned this turn: You can add 1 "Sky Striker" Spell from your Deck
  to your hand, with a name different from the cards in your GY." In its controller's turn this is `during: "end"` with a condition
  that it is the card Special Summoned this turn (same `moves`). fid 24032: it must have stayed face-up since, so a temporary
  banishment makes it a new card (S2). **In the opponent's turn: S5.** **fid 11555 (control taken): S6.**

**Sky Striker Ace - Azalea** (Link 2: "2 LIGHT and/or DARK monsters"; no Q&A)
- "Must be Link Summoned": `onlyByOwnProcedure`. `summon.oncePerTurn`. ① "If this card is Special Summoned: You can target 1 card on
  the field; destroy it, then, if you have 3 or less Spells in your GY, send this card to the GY." Exists; also in the Damage Step,
  not simultaneous (notes). ② "Once per turn, at the start of the Damage Step, if this card battles an opponent's monster: You can
  banish 1 Spell from your GY; destroy that opponent's monster." Exists: a trigger on `damage-step` `start` reading `duel.battle`, with
  a cost that banishes a card from the GY.

**Sky Striker Ace - Zeke** (Link 2: "2 monsters, including a "Sky Striker Ace" monster")
- "Must be Link Summoned", `summon.oncePerTurn`: exist. The material rule is `check` ("including").
- ① "If this card is Link Summoned: You can target 1 face-up monster on the field; banish it until your opponent's next End Phase."
  **S2**, due `nextPhaseTurn(duel, "end", opponent)`. It comes back to the Main Monster Zone of the player who controlled it, not as a
  Special Summon (notes); fids 8571 and 17476.
- ② "Once per turn: You can target 1 other card you control; this card gains 1000 ATK, then, send the targeted card to the GY."
  Exists. Notes: nothing is sent if Zeke is no longer in the Monster Zone; the two steps are not simultaneous.

**Sky Striker Ace = Zero** (Link 2: "2 "Sky Striker Ace" monsters")
- `summon.oncePerTurn`. **"Cannot be used as Link Material": S3.**
- ① "If this card is Special Summoned: You can add 1 "Sky Striker" Spell from your Deck or GY to your hand." Exists, also in the Damage
  Step.
- ② "(Quick Effect): You can Tribute this card; Special Summon 1 "Sky Striker Ace - Raye" and 1 "Sky Striker Ace - Roze" from your Deck
  and/or GY, then you can destroy 1 card on the field." Exists: `canSpecialSummonTogether` with `leaving` (built from these very notes)
  and `specialSummonTogether`, then `breakEffect` and an optional destruction. Not in the Damage Step. fid 23195: the optional
  destruction does not make it "an effect that destroys", so its categories carry no destruction.
- "You can only use 1 "Sky Striker Ace = Zero" effect per turn, and only once that turn": a shared `once.key`.

**Prototype Sky Striker Ace - Amatsu** (Link 1: "1 "Sky Striker Ace" monster")
- `summon.oncePerTurn`. ① "When a monster your opponent controls with 2000 or more ATK activates its effect (Quick Effect): You can
  make the activated effect become "Destroy 1 "Sky Striker Ace" Link Monster your opponent controls"." Exists: `replaceEffect`
  (records from its notes, fids 24166 and 24165); a direct chain to the top link; not in the Damage Step. **ATK at activation: S7**
  (fid 24164).
- ② "When an attack is declared involving this card and an opponent's monster: You can target 1 "Sky Striker Ace" monster you control
  and 1 card your opponent controls; destroy them." Exists: a trigger on `attack-declared`, `targetGroups`; targets that are gone are
  skipped (notes).

**S:P Little Knight** (Link 2: "2 Effect Monsters")
- ① "If this card is Link Summoned using a Fusion, Synchro, Xyz, or Link Monster as material: You can target 1 card on the field or in
  either GY; banish it, also your monsters cannot attack directly this turn." **The condition: S4.** The banishment exists, and a
  face-down card is banished face-up (notes). The `attack-directly` lock exists and applies even if the banishment failed, also to
  monsters that arrive later. Notes: a monster unaffected by monster effects can still attack directly; check that the lock respects
  protections (card test).
- ② "When your opponent activates a card or effect (Quick Effect): You can target 2 face-up monsters on the field, including a monster
  you control; banish both until the End Phase." **S2** (and S8). Notes:
  - nothing happens if either target is gone;
  - a face-down target is banished face-down and comes back face-down;
  - a target that is unaffected stays, and the other is still banished.
  fids 8571, 24029, 24001, 11586, 16743, 24032. Not in the Damage Step.

**Ecclesia and the Dark Dragon** (Synchro: "1 Tuner + 1+ non-Tuners")
- ① "During the Main Phase (Quick Effect): You can banish this card (until the End Phase), and if you do, Special Summon 1 "Fallen of
  Albaz" or 1 Level 4 or lower monster that mentions it from your Deck or GY." **S2** (the card itself; notes: with no free Main
  Monster Zone when it comes back, it is placed in the GY). The Summon target uses `mentionsCard` and exists. **Neither list holds
  "Fallen of Albaz" or a monster that mentions it, so ① is never activatable in the exact lists**: script it and test it with a made-up
  card anyway (definition of done).
- ② "If this card is in your GY: You can target 1 Level 8 Fusion Monster in your GY or banishment and 1 card on the field; shuffle
  both of those cards and this card into the Deck." Exists: `targetGroups`; notes: nothing happens if any of the three is gone.

**The Dragon that Devours the Dogma** (Fusion: ""Fallen of Albaz" + 1 LIGHT or DARK monster + 1 Effect Monster")
- The procedure is data by printed name. **The exact list has no way to Fusion Summon it**: in this deck it is a cost for The Fallen &
  The Virtuous and searches it back. Test the procedure with made-up cards.
- "While an "Ecclesia" monster is on the field or in either GY, this card gains 500 ATK, also it is unaffected by other cards'
  effects." Exists: a conditional stat modifier and protection (notes: a face-up Ecclesia monster on the field).
- ① "If this card is Special Summoned: You can shuffle up to 2 cards from any GY(s) and/or banishment into the Deck." Exists (`askUpTo`).
  Notes: face-down banished cards can be chosen too; Extra Deck monsters go back face-down to the Extra Deck.
- ③ "During the End Phase, if this card is in the GY because it was sent there this turn: You can add 1 "Dogmatika" or "Tri-Brigade"
  card from your Deck to your hand." In its controller's turn this is `during: "end"`, `range: "graveyard"`, with a condition that it
  was sent there this turn (notes: also when sent there during that End Phase). **In the opponent's turn: S5.** The Fallen & The
  Virtuous counts as "Dogmatika".
- "You can only use each of the following effects ... once per turn": two `once` keys.

## Q&A lists (titles read for all; what each card's slice still has to open)

Only entries about cards or rules present in the two lists are named; the rest are about absent cards (titles read, pending like
the Blue-Eyes ones).
- Raye (13): read 24167, 13241, 24166, 8161, 11555, 23445, 23614, 24189. Absent cards: 10427, 24289, 21941, 24184, 21759.
- Roze (3): 24189 read; 24006 (two self-Summoning effects in one chain) unread; 24184 absent.
- Shark Cannon (3): 21761 (Solemn Warning, a Side card) unread; 24159, 8227 absent.
- Widow Anchor (6): read 17476, 8398, 8161. Absent: 10018, 12521, 22203.
- Engage! (4): read 13232, 24167. Absent: 21992, 23258.
- Linkage! (1): 24181 read.
- Lemnisgate! (3): read 23933, 24167; 24182 absent.
- Pot of Sloth: none. Azalea: none.
- Radiant Typhoon Vision (3): 23977 read; 24403, 24312 absent.
- The Fallen & The Virtuous (1): 13612 absent. Ecclesia (1): 23215 read after the audit and tested (batch 8 follow-up).
- Amatsu (6): read 24164, 24165, 24166 (2026-11-24); 10427 read after the audit and tested (real Raye/Kagari/Amatsu); 24393, 7934 read after the audit, pending absent-card interactions.
- S:P Little Knight (15): read 11533, 17476, 16743, 24032, 8571, 11586, 24016, 24029, 24001; 23467 (read after the audit: a temporary banishment keeps the summon origin, tested); 24059, 15447, 24198, 12619, 24161 absent.
- Hayate (8): read 23993, 13862, 13241, 17195; 23936, 23937, 24347 unread; 21899 absent.
- Kagari (3): read 8161; 10427, 21760 absent. Shizuku (2): read 24032, 11555.
- Zeke (3): read 17476, 8571; 12619 absent. Zero (5): read 23195, 24189; 24296, 23215, 24184 absent.
- Dogma (3): 24417 (choosing face-down banished cards: the notes already say yes) unread; 18424, 24308 absent.

## Order and batches 5-8

1. **Core slice "Sky Striker gaps"**, before batch 7 (Fable or Opus, test-first, made-up `fixture-` cards, no real card):
   S1, S2, S3, S5, S6, S7, then S4 (and S8 if cheap). It touches nothing batches 5-6 need, so it may run alongside them, but not on
   the same files at the same time. S2 is the largest piece: carrier `delay`, return rules, interplay with S6.
2. **Batch 5** (Sonnet, no core change): Pot of Sloth, Engage!, Shark Cannon, Widow Anchor, Linkage!, Kagari, Hayate.
3. **Batch 6** (Sonnet, no core change; P1 decided here): Radiant Typhoon Vision, The Fallen & The Virtuous, Lemnisgate!, Azalea, and
   Mystical Space Typhoon brought to the definition of done (Radiant Typhoon Vision's ② depends on it).
4. **Batch 7** (after S1, S3, S5, S6): Raye, Roze, Zero, Shizuku, The Dragon that Devours the Dogma; with the Widow Anchor × Shizuku
   test (fid 11555).
5. **Batch 8** (after S2, S4, S7): Zeke, S:P Little Knight, Ecclesia and the Dark Dragon, Amatsu.
   **Status, 2026-11-26: written and registered**, no core change (`src/cards/sky-striker-ace-zeke.ts`, `sp-little-knight.ts`,
   `ecclesia-and-the-dark-dragon.ts`, `prototype-sky-striker-ace-amatsu.ts`, with `sky-striker-targets.ts`; tests in
   `test/cards/` with `sky-striker-batch8-fixtures.ts`). No YGOProJudge question was needed: every ruling has a Konami page.
  **Independent review, 2026-11-26:** no confirmed local defect. A Q&A follow-up then found two defects, both fixed red-first: S:P's effect ①
  direct-attack lock must apply even when its sole target has gone (the notes say so), and Ecclesia's
  effect ① carries the `summon-from-graveyard` category (Konami fid 23215).
   Card-level readings, not core changes: a target that was only turned face-down meanwhile is still the target for S:P ② and
   Ecclesia ② (`stillTargeted`: Konami's notes process it, `targetsOf` forgets it, the gap already found for The Fallen & The
   Virtuous); a Set card activated in the same Chain cannot be returned by Ecclesia ② (`leavingAfterChain`); Zeke's +1000 ATK
   follows the core's reading of a card's own lasting effects. Pending rulings: S:P's fid 11586 cases A and B (Token, a monster
   whose original type is a Trap Card), Ecclesia's "treated as Fallen of Albaz" monsters and its simultaneous banish-and-Summon.
   Every Main and Extra name of both exact lists is now registered (`deckReadiness`: no `missing` card).

Each batch: Konami EN/FR text quoted, notes and the Q&A above, one test per clause and ruling (red first), registration in
`CARD_DEFS`, the card-plan row, an independent review, then a commit when the owner asks. Reached: `deckReadiness` reports 27/27 registered for Sky Striker, and the exact-list lifecycle
test exists (`test/rules/sky-striker-745443-lifecycle.test.ts`, 3 tests). Still open: the combo data and the 20 duels.

## Blockers and risks

- No hard blocker: every clause maps to an existing mechanic or to S1-S8.
- Dead clauses in the exact lists (still scripted and tested with made-up cards): Ecclesia ①'s Summon (no "Fallen of Albaz" and no
  monster that mentions it) and Dogma's Fusion Summon (no way to perform it).
- Effective names ("treated as "Fallen of Albaz"") are not modelled. Not needed by either list.
- The core-gap slice's other limits do not touch these cards: Pendulum Monsters under the redirect, and one narrow case still open:
  a "can only target ... for attacks" lock (`closesDirect`) that begins during a direct attack (the core does not replay it; no
  Konami page read). An attack-target lock that begins after an attack on a monster was declared, listed here before as a limit, is
  the ruling, not a gap: the attack goes on to damage calculation, with no replay, and does not become direct (Konami's Japanese
  Q&A fid 10015, OCG only, record `target-lock-after-declaration`, `test/rules/attack-targets.test.ts`).
- The bot sees duplicate S:P ② actions until S8 exists. This costs speed only, not correctness.
- Housekeeping: an empty, untracked `modifiers.ts` (0 bytes, 11:32) sits at the repository root, apparently left by a concurrent edit.
  It is not part of this audit and was not touched. Recheck on 2026-11-26: no such file is at the repository root any more.
