# Step 8: Summon procedures as data

Status: built 2026-11-23 (`packages/rules/src/procedures.ts`, `summon.ts`, `chain.ts`, `duel.ts`, README step 8 section; tests in
`test/rules/summon-procedures.test.ts`, `test/rules/normal-summons.test.ts`, `test/rules/summon-effects.test.ts` and the Link Spider
card test). Sources in [sources.md](./sources.md); records in `src/summon-sources.ts`.

Approved seams (owner, not asked again): (1) `legalActions` / `act`: Summon offers, the material, zone and position choices, the
board that results; (2) public board queries; (3) public move operations. TDD, one red/green slice at a time. Junior and the old
engine are untouched.

## Model

### One Summon, four ways to start it

Every Summon ends in the same place: `Duel.summoning` (the moment a "would be Summoned" card answers, step 5), then
`finishSummon`, which puts the monster(s) on the field, marks them properly Summoned and raises `summoned`. What differs is how
it starts:

| Start | Who chooses what | Window to negate |
|---|---|---|
| `summon` action, no material (Level 4 or lower, built-in from the hand) | `zones` / `positions` on the action (step 7's shape) | yes |
| `summon` / `set` action that needs Tributes or materials (Tribute Summon/Set, Synchro, Xyz, Link, contact Fusion) | the action is listed **once per card**; the materials, then the zone, are asked one at a time (`choose`, `pass` to stop, `place`) | yes (a Set: no, it is not a Summon) |
| `flip-summon`, `pendulum-summon` actions | Pendulum: the monsters one at a time, each with its zone | yes |
| An effect that **Special Summons** (`specialSummon`: Monster Reborn, Polymerization, a Ritual Spell, Link Spider) | the card's operation, with `ask` / `askMaterials` / `askPlace` | **no**: negate the effect instead |
| An effect that **performs a Summon** (`summonByEffect`: "Synchro Summon using...", "immediately after this effect resolves, Normal Summon") | as the action | only when the effect was Chain Link 1 |

### Why the materials are asked, not listed

A Link-4 with "2+ Effect Monsters" and seven monsters has dozens of legal material sets; fifteen Extra Deck cards would multiply
the listing. The spec's standing rule is "listing legal moves without building every candidate", and step 9 wants "moves as named
sequential choices". So `legalActions` only proves that **one** legal set exists (a depth-first search that stops at the first
hit) and lists the Summon once. After `act`, `Duel.asking` offers the cards that can still be part of a legal set (`choose`), and
`pass` ("these are all") as soon as the cards chosen are themselves a legal set. A set is legal only if it leaves a zone the
monster may go to (materials free their zones; a Link material that leaves takes its arrows with it). Then the zone is asked
(`place`), with the battle position when there is a choice. Nothing is asked when there is one answer.

### Procedures as data

`CardDef.procedure` is plain data shared by every duel:

```ts
interface MaterialSlot { filter?: (duel, card, ctx) => boolean; min: number; max: number }
interface Recipe { slots: MaterialSlot[]; check?: (duel, cards, ctx) => boolean; condition?: (duel, ctx) => boolean; transfer?: true }
type Procedure =
  | { kind: "synchro"; recipes?: Recipe[] }   // default: 1 Tuner + 1+ non-Tuner monsters; always: the Levels add up to the Level
  | { kind: "xyz"; recipes?: Recipe[]; alternatives?: Recipe[] }   // default: 2 monsters whose Level is the Rank
  | { kind: "link"; recipes: Recipe[] }       // always: the materials count for the Link Rating (a Link Monster for 1 or its Rating)
  | { kind: "fusion"; recipes: Recipe[]; contact?: { to: "graveyard" | "banished" | "deck" } }
  | { kind: "ritual" }
```

`facts` gains `tuner`, `rank`, `link` (the Link Rating), frame `ritual`, and `scale` stays in `pendulum`. A recipe is a list of
slots ("1 Tuner", "1+ non-Tuner Dragon monsters"); a card fills one slot; `check` is a rule over the whole set. The kind adds its
own rule (Level sum, Link Rating count), so a card only writes what is printed on it. One generic search (`existsSet`,
`extendable`) serves every kind, Tributes and Ritual included.

- **Fusion** is not an action: a Fusion Monster's recipe is used by the effect that Fusion Summons (`fusionSummon(duel, player,
  { pool, to })`), which says where the materials come from (hand, field, Deck, GY, banished, the opponent's field) and where they
  go. `contact` makes it an action too (materials from your field, no card effect).
- **Ritual**: `ritualSummon(duel, player, { monsters, pool, mode: "equal" | "at-least", whole, dispose })`. `at-least` refuses a
  set with a Tribute that is not needed. `whole(card, monster)`: a card that counts as the entire Tribute.
- **Xyz Materials** are cards in the new zone `material`, `attachedTo` their monster: not on the field (RB10). `detach` sends one
  to the Graveyard; they follow the monster to the Graveyard when it leaves, and stay across a flip or a control change.
  `alternatives` are the printed other ways ("using 1 Rank 4 Xyz Monster you control as material"), with `transfer`.
- **Pendulum Summon**: once a turn, two Pendulum Monsters in the Pendulum Zones, monsters of the hand and face-up Pendulum
  Monsters of the Extra Deck whose Level is strictly between the Scales; chosen one at a time with their zone.

### Normal Summon family

- Tribute Summon and Tribute Set: Level 5-6 one Tribute, 7+ two; the Tributes are a cost paid before the Summon (not refunded when
  it is negated). A Set is not a Summon: no window, no `summoned`.
- Normal Set of a monster: `set` action, face-down Defense Position; shares the turn's one Normal Summon/Set.
- Flip Summon: `flip-summon`, a face-down monster not put on the field this turn and not yet changed by hand this turn. The
  monster stays face-down during the window; negated, it is destroyed **on the field** (a destruction from the Monster Zone).
  Success raises `flipped` then `summoned` (`how: "flip"`).
- Battle position: `change-position`, once per monster per turn, not the turn it came to the field, not after it attacked; never a
  Link Monster. A Flip Summon is that monster's change of the turn. Raises `position-changed`. No window (FET: an action).
- Public operations for effects: `flipFaceUp`, `flipFaceDown`, `changePosition` (an effect's change does not use the manual one).
- FLIP effects are trigger records on `flipped` (step 6b raised it for an attacked monster; now also a Flip Summon and
  `flipFaceUp`).

### Properly Summoned

`CardInstance.proper`: the monster was Summoned by its own procedure and the Summon succeeded. Kept in the Graveyard, while
banished, face-up on the Extra Deck, and when it turns face-down (Konami: it stays "Xyz Summoned"); lost in the hand, the Deck and
face-down in the Extra Deck. `canBeRevived` (and `specialSummon`, unless the effect performs the monster's own Summon) refuse a
Fusion, Synchro, Xyz, Link or Ritual Monster that is not `proper` in the hand, the Deck, the Graveyard, banished or face-up on the
Extra Deck (RB10 names the hand, the Deck and the Graveyard). A negated Summon never sets it. The same monsters, and a card marked
`summon.cannotBeNormalSummoned`, are never offered a Normal Summon or Set. `CardInstance.summonedBy` keeps the kind ("synchro"...) for "if this card was Synchro Summoned".

### Locks

`Layer` `lock` gains `what: "summon"` with `ways` (`normal`, `flip`, `special`; default all) and `only` (which monsters). It stops
the Summon action being offered and `specialSummon` from Summoning; a Set is not stopped (Konami's Rivalry/Gozen FAQ). An effect
that can only Summon locked monsters says so in its `condition` with `canSpecialSummon`.

## Decisions

- **D1. Negating a Summon an effect performs.** Both Konami sources are kept, they answer different things. A monster an effect
  *Special Summons* is never open to "negate the Summon" (TCG PSCT part 5). An effect that *performs* a Synchro, Xyz, Link,
  Pendulum, Normal or Tribute Summon opens the window when it was Chain Link 1 and not from Chain Link 2 (Konami's Japanese Q&A
  24054 and 16986, OCG only; YGOProJudge asked for the TCG, see sources). `summonByEffect` reads the link's place in the chain.
- **D2. Materials are a cost of the attempt.** They leave before the window; a negated Summon does not bring them back
  (RB10 for Tributes; YGOProJudge for Synchro and Xyz materials).
- **D3. One action per Summon, sequential choices** (above). The no-material Summons keep step 7's `zones` on the action.
- **D4. Position.** A Special Summon is in face-up Attack or Defense Position, the player's choice (`positions` on the action or
  on `place`); a Link Monster only in Attack Position; a Normal Summon in Attack Position.
- **D5. Levels are read through `level()`** (step 6's query), so a Level change counts for Synchro, Xyz and Ritual. A monster with
  no printed Level (Xyz, Link) has none and cannot be used where a Level is needed.
- **D6. Out of scope**: Tokens (step 11), "treated as a Tuner/2 materials" material effects, Xyz Summons whose alternative has a
  cost, Gemini and Spirit monsters, a second Normal Summon, "Tribute 3" and Tribute-reducing effects, zone locks.

## Slices (each a red test first)

1. Tribute Summon (1 and 2 Tributes), zone freed by the Tribute, negated: Tributes stay gone.
2. Normal Set of a monster, Tribute Set; shares the Normal Summon; no window.
3. Flip Summon; negated Flip Summon destroyed on the field; FLIP effect on Flip Summon and on `flipFaceUp`.
4. Manual position change and its three limits; Link Monsters; effect changes.
5. `specialSummon` raises `summoned`; Link Spider raises it; no window for it.
6. Synchro: recipe, Tuner/non-Tuner, Level sum, zones, position, window, negated.
7. Xyz: materials attached, detach, leave with the monster, alternative with transfer.
8. Link: rating count with a Link Monster as 1 or its Rating, zones after the materials leave; Link Spider's own Link Summon.
9. Fusion by effect from hand/field, Deck, GY, the opponent's field; contact Fusion.
10. Ritual "equal" and "equal or greater", banish from the GY, whole Tribute.
11. Properly Summoned and revival; negated Summon is not proper.
12. `summonByEffect`: Chain Link 1 window, Chain Link 2 none; on the opponent's turn.
13. Pendulum Summon.
14. Summon locks.

## Review (2026-11-23)

A code review of the working tree (another agent, medium) found the defects below; each has a regression test that failed before
its fix (`test/rules/summon-review.test.ts`, and the tests named).

1. A monster taken "until the End Phase" and turned face-down by `flipFaceDown` never went back (the control modifier named the
   card as it was); an attack target turned face-down caused a replay. Fixed in `move()`: the control change and the attack in
   progress follow the monster through a flip face-down (`keptThroughFlip`). The control part is the core's reading (no source).
2. A Ritual Spell could pay its Tributes and Summon nothing for a Ritual Monster written with its frame alone. Fixed: the frame is
   the monster's own procedure too, and the Ritual and Fusion candidates are checked before anything is paid (`summonable`).
3. An Xyz Pendulum Monster face-up on the Extra Deck was listed with no zone to go to (the "a Main Monster Zone is free" shortcut).
   Fixed: the shortcut is not taken for a card face-up on the Extra Deck.
4. After a Summon performed by Chain Link 1, a `lingers` effect (Droll & Lock Bird) could still answer the chain's added card.
   Fixed: `openPendingSummon` clears `lingering`.
5. A Summon with no zone left when it should succeed left the monster in place with its Xyz Materials attached. Fixed: the monster
   is sent to the Graveyard and the materials follow.
6. `specialSummon` refused a monster in a Spell & Trap Zone (a Pendulum Monster in its Pendulum Zone). Fixed; such a monster is
   "played onto the field" that turn (`arrived`).
7. A `place` naming Attack Position for a Link Monster was refused. Fixed: `place` lists its `positions` even when there is one.

Found by the author while the review ran, with their own regression tests: a Ritual Monster was offered a Normal Summon or Set
(`normal-summons.test.ts`), could be Special Summoned from the hand by any effect or Pendulum Summoned (`summon-effects.test.ts`),
and a `summon` naming Attack Position for a Link Monster was refused (`summon-procedures.test.ts`). A mutation pass (16 small
changes to the new code) left one survivor, "every Summon makes the monster properly Summoned", now killed by a test.

How it was built, honestly: the model (`procedures.ts`, the changes to `summon.ts`, `chain.ts`, `duel.ts`) was written before its
tests, in one go, and the tests slice by slice afterwards; only the fixes listed above were strictly red first.

## Validation

Typecheck and single files often; the whole suite, `vitest bench --run` and a code review at the end; README lists the limits.
