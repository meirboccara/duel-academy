# Blue-Eyes 746021: mechanic gaps of the cards still to script (audit, 2026-11-24)

What each remaining card of the exact Blue-Eyes list (`packages/rules/src/deck-manifests.ts`; 18 of 60 Main/Extra names registered)
needs from the rules core, clause by clause, and what was built for it. **No real card was written or registered in this slice**: the
mechanics are tested with made-up cards (`packages/rules/test/rules/blue-eyes-gap-fixtures.ts`, every code starts with `fixture-`),
and the cards are scripted afterwards (CLAUDE.md model split).

Printed texts: Konami's TCG card database, English, each card page read once on 2026-11-24 (card id `cid` below). "Exists" names the
mechanic of `packages/rules/README.md` the clause uses. "Built" names what this slice added (README, last section).

> Update 2026-11-25: Spirit Dragon, Tyrant Dragon, Ultimate Spirit Dragon, Neo Ultimate Dragon, Psychic End Punisher, Stardust Sifr Divine Dragon and TY-PHON are now scripted and registered (packages/rules/README.md, last section). The core gained `Once.acrossMoves`, an `attackedNow` that needs no damage calculation and a first-time protection kept through a flip; the Q&A that forced them are in that section.

## Summary

| Card | cid | Status after this slice |
|---|---:|---|
| Blue-Eyes White Dragon, the White Phantom Beast | 22716 | Ready to script (limit L1 for its third effect) |
| Bystial Magnamhut | 17762 | Ready to script |
| Deep-Eyes White Dragon, the Blue Abyss | 22717 | Ready to script: needed the triggering events, "banish it when it leaves the field", an own lasting effect that stops while negated (all built) |
| Dominus Purge | 20257 | Ready to script (nothing was missing: its lock is applied when it resolves, Konami's notes) |
| Majesty of the White Dragons | 20606 | Ready to script (nothing was missing; its GY effect is Spell Speed 2 on YGOProJudge's answer only) |
| Pot of Prosperity | 15756 | Ready to script: needed the cost chosen one card at a time, the restriction "the turn you activate this card", the note of a draw by effect, halved damage (all built) |
| Primite Dragon Ether Beryl | 20754 | Ready to script: needed Setting a Spell/Trap by an effect (built); limit L2 for its Standby Phase effect |
| Primite Drillbeam | 20536 | Ready to script: needed the negation of a face-up Spell/Trap's effects and the Set from the GY (built); open ruling R3 |
| Primite Lordly Lode | 20534 | Ready to script (nothing was missing) |
| Roar of the Blue-Eyed Dragons | 20605 | Ready to script: needed "including a "Blue-Eyes" monster" over the materials (built) |
| Ancient Fairy Life Dragon | 21176 | Ready to script |
| Blue-Eyes Spirit Dragon | 12324 | Ready to script (limit L1) |
| Blue-Eyes Tyrant Dragon | 16842 | Ready to script: needed "if this card battled" at the end of the Damage Step, also from the GY or banishment, and Setting a Trap from the GY (built). Its 11 Q&A entries are still unread |
| Blue-Eyes Ultimate Spirit Dragon | 20607 | Ready to script: needed "your opponent cannot banish cards from your GY" (built); limit L1 |
| Crimson Dragon | 18825 | Ready to script ("treated as a Synchro Summon" is `specialSummon(..., { kind: "synchro" })`, tested in this slice) |
| Hieratic Seal of the Heavenly Spheres | 13496 | Ready to script |
| Lightstorm Dragon | 20780 | Ready to script: needed a number of targets read from the board and the Set from the GY (built) |
| Neo Blue-Eyes Ultimate Dragon | 12484 | Ready to script: needed "if this card attacked" at the end of the Damage Step (built); limit L1 for its GY effect |
| Psychic End Punisher | 17154 | Ready to script: needed "unaffected by your opponent's activated effects" (built) |
| Spirit with Eyes of Blue | 20609 | Ready to script |
| Stardust Sifr Divine Dragon | 11931 | Ready to script: needed "Must be Synchro Summoned" (built) |
| Super Starslayer TY-PHON - Sky Crisis | 19184 | Ready to script: needed the Summons of this turn and the last, and an Xyz alternative that leaves a lock (built) |

"Ready to script" means every printed clause has a core mechanic. It does not mean done: each card still owes its printed identity,
French text, the reading of its own Japanese notes and Q&A, its tests and an independent review.

## Main Deck cards, clause by clause

**Blue-Eyes White Dragon, the White Phantom Beast**
- "When this card is added from the Deck to your hand, or a monster you control is destroyed by battle: You can reveal this card in
  your hand; Special Summon it." Exists: a Trigger Effect of `range: "hand"`, on `added-to-hand` (`from: "deck"`) or a `moved` with
  `by: "battle"`; `revealCards` as the cost; `specialSummon`.
- "If this card is Special Summoned from the hand or Deck: You can destroy all monsters your opponent controls, also you can only
  attack directly with "Blue-Eyes" monsters for the rest of this turn." Exists: `summoned.from`, `moveCards` with
  `effectDestruction`, an `attack-directly` lock with `only`.
- "When a card or effect is activated that targets this card on the field (Quick Effect): You can discard 1 card; negate that
  effect." Exists: a Quick Effect reading the top link's `targets`, a `CostSpec.pick` over the hand, `negateEffect`. Limit L1.

**Bystial Magnamhut**
- "You can target 1 LIGHT or DARK monster in either GY; banish it, and if you do, Special Summon this card from your hand. This is a
  Quick Effect if your opponent controls a monster." Exists: two records (`ignition` and `quick`, `range: "hand"`) sharing the
  once per turn (`once.key`), the second with the condition; `canBeBanished` (now with the banishing player), `moveCard` with
  `effect`, `specialSummon`.
- "If this card is Special Summoned: You can activate this effect; during the End Phase of this turn, add 1 Dragon monster from your
  Deck or GY to your hand ..." Exists: a trigger, `delay` with `nextPhaseTurn`.

**Deep-Eyes White Dragon, the Blue Abyss**
- "(This card is always treated as a "Blue-Eyes" card.)" Exists: `facts.archetypes` (not an effect: its notes).
- "You can discard this card; add 1 Level 1 LIGHT Tuner from your Deck to your hand." Exists.
- "If a "Blue-Eyes" Ritual Monster or "Blue-Eyes White Dragon" is sent to your GY (except during the Damage Step): You can target 1
  of them in the GY". **Was missing, built**: a trigger's targets could not read what triggered it. `EffectContext.triggered` /
  `Link.triggered`. "Except during the Damage Step" is the card's matcher reading `duel.battle`.
- "Special Summon this card from your GY (if it was there when the monster was sent) or hand (even if not)". Two records (hand,
  Graveyard). **Was missing, built**: a card sent to the GY at the same time as the monster is not triggered (its notes).
- "and if you do, its ATK becomes that target's". Exists (`set` layer); **built**: `Modifier.own`, so that it stops while the card's
  effects are negated (its notes).
- "also banish it when it leaves the field." **Was missing, built**: `banishWhenItLeaves`.

**Dominus Purge**
- "If your opponent controls a card, you can activate this card from your hand." Exists: `handIf`.
- "When a card or effect is activated that includes an effect that adds a card(s) from the Deck to the hand: Negate that effect, then
  if you have a Trap in your GY, destroy that card." Exists: the answered link's `categories`, `negateEffect`, `destroyCard`.
- "If you activated this card from your hand, you cannot activate the effects of DARK, WATER, and FIRE monsters for the rest of this
  Duel." Exists: `Link.wasSet`, an `activate` lock until `FOREVER`. Its notes say the lock is applied when the card resolves (a card
  activated from the hand after its player already activated such effects is fine), so nothing has to happen at activation.
- "You can only activate 1 "Dominus Purge" per turn." Exists.

**Majesty of the White Dragons**
- "Show up to 3 of the "Blue-Eyes White Dragon" in your hand, face-up Monster Zone, and/or GY, then destroy an equal number of cards
  your opponent controls." Exists: `askUpTo`, `revealCards`, `breakEffect`, `moveCards` with `effectDestruction`.
- "You can banish this card from your GY; Ritual Summon 1 Ritual Monster from your hand, by Tributing "Blue-Eyes White Dragon(s)" from
  your hand or field whose total Levels equal its Level." Exists: an effect of `range: "graveyard"`, `ritualSummon` (`mode:
  "equal"`, the pool filtered by name). Ruling R2: written as a Quick Effect.

**Pot of Prosperity**
- "Banish 3 or 6 cards of your choice from your Extra Deck, face-down;" **Was missing, built**: `CostSpec.choose` (one action per
  count, the cards chosen one at a time before the activation). A face-down banishment existed.
- "for the rest of this turn after this card resolves, any damage your opponent takes is halved". **Was missing, built**: the
  `damage` layer and `damageFor`.
- "also excavate cards from the top of your Deck equal to the number of cards banished, add 1 excavated card to your hand, place the
  rest on the bottom of your Deck in any order." Exists: `excavate`, `ask`, `askBottomOrder`.
- "You can only activate 1 "Pot of Prosperity" per turn." Exists.
- "You cannot draw cards by card effects the turn you activate this card." **Was missing, built**: `EffectRecord.oath` (from the
  activation, lifted when the activation is negated) and `drewByEffect` (not after a draw by effect).

**Primite Dragon Ether Beryl**
- "If this card is Normal Summoned: You can Set 1 "Primite" Spell/Trap from your Deck." **Was missing as a core operation, built**:
  `setByEffect` / `askSetByEffect` / `canSetByEffect` (True Light had its own private copy for its own effect).
- "You can Tribute this card; send 1 Normal Monster from your Deck to the GY." Exists: `tribute` as a cost.
- "During your Standby Phase, if you have a Normal Monster in your field or GY: You can add this card from the GY to your hand."
  Exists as a trigger on the `phase` event with `range: "graveyard"`. Limit L2.

**Primite Drillbeam**
- "Reveal 1 "Primite" card, or 1 Normal Monster, in your hand ... (or ... you can activate this effect without revealing a card)".
  Exists: a `CostSpec.pick` with one way per card, and the empty way under the condition.
- "then target 1 face-up card on the field; negate its effects, and if you do, banish it." **Was missing, built**:
  `negateCardEffects` reached monsters only; it now reaches a face-up Spell or Trap, and says when nothing was negated. Ruling R3.
- "During your Main Phase, if you control a "Primite" monster: You can Set this card from your GY." **Built**: `setByEffect`.

**Primite Lordly Lode**
- "When this card is activated: Add 1 "Primite" card from your Deck to your hand ..." Exists (`stays`, a search).
- "You can declare 1 Normal Monster Card name; Special Summon 1 declared Normal Monster from your hand, Deck, or GY in Defense
  Position, also you cannot activate the effects of Special Summoned monsters on the field this turn." Exists: `declare` (the card
  lists the Normal Monster names of `cardNames`), `askSpecialSummon`, an `activate` lock with `stops` (`specialSummoned`).
- "Normal Monsters and "Primite" monsters you control gain 300 ATK for each Normal Monster with different names in your GY." Exists.

**Roar of the Blue-Eyed Dragons**
- "Special Summon in Defense Position, 1 "Blue-Eyes" monster from your Deck, GY, or banishment (but if you control no "Blue-Eyes White
  Dragon", you can only Special Summon "Blue-Eyes White Dragon" with this effect), also you cannot Special Summon from the Extra Deck
  for the rest of this turn, except Dragon monsters." Exists: `ask`, `specialSummon`, a `summon` lock with `only`.
- "You can banish this card from your GY; Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field,
  including a "Blue-Eyes" monster." The Graveyard effect exists; **was missing, built**: `FusionOptions.check`.
- "You can only use 1 "Roar of the Blue-Eyed Dragons" effect per turn, and only once that turn." Exists: `once.key`.

## Extra Deck cards, clause by clause

- **Ancient Fairy Life Dragon**: generic Synchro; the trigger with its "World of Spirits" branch (by printed name; that card is not
  in the list); the `in-defense` attack permission for the monsters it names. All exist.
- **Blue-Eyes Spirit Dragon**: the `summon-together` lock; "when an effect of a card in the GY is activated (Quick Effect): negate the
  activation" (the answered link's card was in the Graveyard when activated: `Link.card.zone`); the Tribute as a cost, a Special
  Summon from the Extra Deck in Defense Position, `delay` with `delayedDestruction`. All exist. Limit L1.
- **Blue-Eyes Tyrant Dragon**: its Summoning condition, "unaffected by Trap Cards or effects" and "all monsters, once each" exist.
  "Once per turn, at the end of the Damage Step, if this card battled: You can target 1 Trap in your GY; Set it." **Was missing,
  built**: `battledNow` / `destroyedByBattleNow` (one record per place: Monster Zone, Graveyard, banished, as its notes say) and
  `setByEffect`.
- **Blue-Eyes Ultimate Spirit Dragon**: "2+ Tuners" exists. "Your opponent cannot banish cards from your GY." **Was missing, built**:
  the `banish-from-graveyard` lock now takes `banisher: "opponent"`. The negation of an activation "on the field" with the ATK gain
  and the trigger when destroyed exist. Limit L1.
- **Crimson Dragon**: the search by `mentionsCard`; "return this card to the Extra Deck, and if you do, Special Summon 1 Dragon Synchro
  Monster ... (this is treated as a Synchro Summon)" is `specialSummon(..., { kind: "synchro" })`: it exists, and is now tested
  against "Must be Synchro Summoned".
- **Hieratic Seal of the Heavenly Spheres**: "if this card is in the Extra Monster Zone" is `card.slot >= 5`; a Tribute from the hand
  or field as a cost with a choice; a card returned to the hand chosen when it resolves; the trigger "if this card is Tributed"
  (`moved.reason: "tributed"`); ATK/DEF made 0. All exist.
- **Lightstorm Dragon**: "target Spells/Traps on the field up to the number of Normal Monsters in your GY +1". **Was missing,
  built**: `targetCount` as a function. "Set it, but it cannot be activated unless you control a Normal Monster": **built**
  `setByEffect`, with an `activate` lock on that card (exists).
- **Neo Blue-Eyes Ultimate Dragon**: "at the end of the Damage Step, if this Fusion Summoned card attacked". **Was missing, built**:
  `attackedNow`. `attackAgain`, `Once.times` and the GY Quick Effect (`negateActivationAndDestroy`) exist. Limit L1.
- **Psychic End Punisher**: "unaffected by your opponent's activated effects". **Was missing, built**: `fromActivated`. Coupled
  targets, an LP cost and a trigger on the Battle Phase exist.
- **Spirit with Eyes of Blue**: a continuous `summon` lock, the trigger with a choice (hand or GY), the Tribute as a cost, an `attack`
  lock and a negation on the monster Summoned. All exist.
- **Stardust Sifr Divine Dragon**: materials by filter exist. "Must be Synchro Summoned." **Was missing, built**:
  `summon.onlyByOwnProcedure`. "The first time each card you control would be destroyed each turn" (`firstEachTurn`), the negation
  with a destruction and the GY effect exist.
- **Super Starslayer TY-PHON - Sky Crisis**: "During the turn, or turn after, your opponent Special Summoned 2 or more monsters from
  the Extra Deck". **Was missing, built**: `Duel.summons` and `summonedCount`. "using 1 monster you control with the highest ATK
  (your choice, if tied). (Transfer its materials.)" exists (`alternatives`, `transfer`, a filter reading `atk`). "If you do, you
  cannot Normal or Special Summon for the rest of this turn." **Was missing, built**: `ifYouDo` on the alternative. The activation
  lock by ATK and the detach cost exist.

## Rulings asked of YGOProJudge (2026-11-24, three chats, none cited an official source)

- **R1** (banished when it leaves the field). Used as Xyz Material: not banished, it becomes a material. Returned to the hand or
  shuffled into the Deck: banished instead. Flipped face-down, then destroyed: goes to the GY (the state is over). The last point is
  also in Konami's notes on Deep-Eyes; the first two rest on YGOProJudge only, and the tests say so.
- **R2** (a Normal Trap's effect activated in the GY with no timing stated, Majesty of the White Dragons): Spell Speed 2, in either
  player's turn. No Konami page read. Nothing in the core depends on it; the card's script will (a `quick` record).
- **R3** (Primite Drillbeam chained to the activation of a Normal Spell, targeting that Spell): YGOProJudge answers that the Spell's
  effect is negated although the card is banished. **Not built**: in the core a lasting negation follows the card as it is, so once
  the card has been banished its Chain Link is not negated; the card's script would have to call `negateEffect` on that link. For a
  monster the usual ruling goes the other way (an effect activated on the field resolves if the monster has left). Unsettled: read
  Drillbeam's Q&A before scripting it.

## Limits that remain (not built)

- **L1. Negation Quick Effects in the Damage Step: resolved (2026-11-25).** `EffectRecord.damageStep` (a boolean, read on Quick
  Effects only) lets a Quick Effect be activated at every timing of the Damage Step. It is set only on a record whose Konami notes
  say it "can also be activated in the Damage Step" (src/damage-step-sources.ts, OCG only). No Konami page found states a general
  rule for effects that negate an activation (searched: the TCG rulebook, Konami's TCG Damage Step Rules page, the official OCG
  rulebook pp. 77-78; YGOProJudge calls it general and cites no source), so it is per record; the notes name no timing, so "after
  damage calculation" and "end" are inferred (packages/rules/README.md, last section). Notes read: Blue-Eyes Spirit Dragon's second
  effect, the negation (yes; its third effect, the Tribute, no); Blue-Eyes Ultimate Spirit Dragon's second effect, the negation
  (yes; its third effect, a Trigger Effect, yes too and needs no flag); Neo Blue-Eyes Ultimate Dragon's second effect (yes): the
  Quick Effect activated in the GY, "You can banish this card from your GY; negate the activation, and if you do, destroy that
  card" (its first effect, whose cost sends a "Blue-Eyes" Fusion Monster from the Extra Deck to the GY, is the attack-again Trigger
  Effect and needs no flag). Set `damageStep: true` on those three negation records when scripting them. The White Phantom Beast's
  notes say its negation ("negate that effect") is NOT usable in the Damage Step: leave it unflagged. Counter Traps keep
  the TCG rulebook's limit (up to damage calculation); the OCG rulebook and Konami Q&A fid 7966 allowing them later are not followed.
- **L2. "During your Standby Phase: You can ..."** is offered once, when the phase begins (a trigger on the `phase` event); the player
  cannot activate it later in the same Standby Phase.
- **"Cards sent to the GY are banished instead"** (the pending Q&A of Wishes for Eyes of Blue fid 23815, Maiden of White fid 14540,
  Mausoleum of White fid 18128): no card of the list has such an effect; `banishWhenItLeaves` is about one card leaving the field,
  not a rule for every card sent to the GY. Not built.
- A cost worded "send to the GY" paid with a monster that is banished when it leaves the field: the monster is banished and the cost
  counts as paid (no page read).
- `CostSpec.choose` is not available to a Trigger Effect, and the targets of such an activation are offered on the board the first
  candidates would leave.
- Pot of Prosperity under "cannot add cards from the Deck to the hand" (its Q&A fids 9932 and 17846) and its other entries were not
  opened: for the card's own slice.

## Konami pages read for this audit (2026-11-24)

- The English card page of each of the 22 cards above, once each.
- Japanese notes pages (OCG only): Deep-Eyes White Dragon, the Blue Abyss (cid 22717), Dominus Purge (20257), Pot of Prosperity
  (15756), Primite Drillbeam (20536), Blue-Eyes Tyrant Dragon (16842). Q&A: fid 23378 and fid 23511 (Pot of Prosperity).
- RB10 (local text): "Leaves the Field", Set Spell and Trap Cards, Field Spell Cards.
