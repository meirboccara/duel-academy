# Step 6 design: continuous effects as one list of timestamped modifiers

Based on `packages/rules` at HEAD 1a33d4e (working tree may differ: another agent is editing LP rounding, a destruction event
and Solemn vs hand effects). Record ids below are in `sources.md`. Owner decisions already taken: (1) Konami's Japanese Q&A is the
source for the ATK/DEF order (OCG-only, marked); (2) step 6 adds a "card added to the hand" event and brings Droll & Lock Bird back;
(3) Equip Cards wait for step 7; (4) `Duel.negations` is folded into the modifier list now, with a test showing nothing changed.

## 1. Shape

Two kinds of source feed **one ordered sequence of modifiers** per query:

- **Continuous records** (`EffectRecord.type: "continuous"`): the card's own effect, read **from the cards on the field when asked**,
  not stored. A card is a source while it is face-up on the field, its effect is not negated and its `condition` ("while...") holds.
  So moving, flipping face-down and negation need **no register/unregister code**: they stop being a source by looking
  (RB10 `continuous-effect-definition`: "starts when the face-up monster appears on the field, and ends once that monster is gone or is
  no longer face-up"; `skill-drain-notes`, `negated-floodgate-returns`: the effect is back the moment the negator is gone).
- **Lasting modifiers** (`Duel.modifiers`): what a resolved effect leaves ("until the end of this turn", "for the rest of this turn"):
  Shrink, Infinite Impermanence's negation, Droll's lock, a control change.

```ts
// src/modifiers.ts (new)
type Stat = "atk" | "def" | "level";
type Layer =
  | { kind: "base";  stat: Stat; to: (original: number, duel: Duel, id: number) => number } // "its original ATK becomes halved"
  | { kind: "set";   stat: Stat; to: number | ((duel: Duel, id: number) => number) }        // "becomes", Sacrifice, Reptilianne Gorgon
  | { kind: "add";   stat: Stat; by: number | ((duel: Duel, source: CardInstance) => number) } // "gains", "loses"; read each query
  | { kind: "negate" }                                                                    // the card's effects are negated (own continuous + activated in the Monster Zone)
  | { kind: "lock"; what: "add-to-hand" | "activate" | "special-summon"; who: Side | "both"; only?: (duel: Duel, subject: LockSubject) => boolean }
  | { kind: "control"; to: Side };                                                        // bookkeeping for expiry (see 5)
interface Modifier {
  readonly stamp: number;                  // from duel.clock: higher = applied later
  readonly source: { id: number; moves: number } | null;  // the card that made it (a card that moved is a new card)
  readonly affects: number | ((duel: Duel, target: CardInstance) => boolean); // one card (id + its moves frozen) or a field-wide filter
  readonly until: number | null;           // number of the turn whose end ends it; null = while the source stands (continuous)
  readonly layer: Layer;
}
```

- `Duel` gains `modifiers: readonly Modifier[]` and `clock: number` (shared counter for stamps; `batches` stays for events).
  `negations: Negation[]` is deleted; `negateCardEffects(duel, id, until)` now pushes `{ layer: { kind: "negate" }, affects: id (+moves) }`.
- A **continuous record** adds to `EffectRecord`: `type: "continuous"`, `modifies: (duel, source) => Layer[]` (or a list), `affects` (default:
  the source card itself), plus the existing `condition`. Its **stamp** is the stamp of the moment the source became face-up on the field
  (new `CardInstance.since: number`, set in `move()` when a card enters the field face-up or turns face-up; a move within the same zone keeps it).
  `since` is the one change to `duel.ts` and `CardInstance`: do it after the other agent has landed their edits.
- `CardDef.facts` gains `atk`, `def` (the printed numbers, "original ATK" in RB10 `atk-original-glossary`) and `kind` gains the Continuous
  Spell/Trap, which stays on the field after resolving (today `resolveChain` sweeps every face-up chained Spell/Trap to the Graveyard;
  a `stays: true` on the card's activation record skips the sweep).
- Defs index (a `WeakMap` over `duel.defs`, as `events.ts` does): `hasContinuous`, the codes with a continuous record, and whether any is a
  lock or a negator. Every query returns at once when `modifiers` is empty and the index is empty (reference boards: both).

## 2. Queries and their order

All are pure functions of the duel, in `src/modifiers.ts`, exported from `index.ts`:

`atk(duel, id)`, `def(duel, id)`, `originalAtk(duel, id)`, `level(duel, id)`, `isNegated(duel, id)`, `locked(duel, what, who, subject?)`,
`controller(duel, id)` (see 5). `isNegated` moves from `negation.ts` and keeps its signature, so `activation.ts`/`chain.ts` do not change.

**ATK/DEF order**, as induced by the Konami Q&As (`sources.md`, "What Konami says"); the judge agrees on the first two layers:

1. `original` = printed value (`facts`).
2. **Layer A**, in stamp order, `base` and `set` modifiers together: `base` replaces `original` (`original = to(original)`) **and** the value
   (`value = original`); `set` replaces the value only. A later one beats an earlier one, whichever kind
   (`set-then-shrink` = 1500; `set-vs-original-later-wins-a/b` both orders). An older `set` that is not applicable any more (its
   condition false, e.g. Megamorph-like LP equal) lets the value fall back to what the layer below it gave
   (`set-vs-original-later-wins-b`).
3. **Layer B**: every `add`, in any order (they are sums), on top of the value, **re-read on every query** (`shrink-then-own-gain`: 0/2 + own
   gain; `shrink-recomputes-losses`; `megamorph-notes`: no stored value, a change in the LPs changes the ATK).
4. **Layer C** (reserved, not built): swap ATK and DEF (Shield & Sword), last, from the judge only; no card needs it.
5. Result clamped at 0: this is what the old engine does (`engine.ts:536`); **no Konami page read** for it (see D6).

`level(duel, id)`: printed Level, then `set` and `add` modifiers in stamp order, a `set` overwriting what came before (judge lead only,
`q-lvl2`; no Konami record, see D6). A Link monster has no Level or DEF (RB10, Link Monsters): the query returns `null`.

**Negation** (`isNegated`): a card is negated when (a) a `negate` lasting modifier names it with its current `moves` (what `Duel.negations`
does today), or (b) a continuous `negate` source whose own card is face-up on the field, itself not negated, `affects` it. Only a card
**face-up in the Monster Zone** is reached for monsters (`negation-reaches-continuous`: "モンスターゾーンに存在する限り適用される永続効果";
the Graveyard is not). Recursion: evaluating (b) asks whether the source is negated; guard with an "in progress" set that treats a card
already being evaluated as not negated (a circle of two monster negators is not covered by any Konami page; document it, do not model).
Where a negated card's effect resolves: unchanged (`Link.effectNegated` at activation, `cardNegated` at resolution) plus the Skill Drain
edge: if the monster is **no longer face-up in the Monster Zone when it resolves**, it is not negated (`skill-drain-notes`, third note).

**Locks** (`locked`): true when a modifier or a continuous source with `kind: "lock"` matches `what`, the player (`who`) and the
optional `only(duel, subject)` filter; a negated source does not lock (`negated-floodgate-returns`).

## 3. How a continuous effect registers, unregisters

It does not. A continuous record is **read from the board**:

| Event | What happens |
|---|---|
| Card enters the Monster/Spell Zone face-up | `since` = clock tick; it now counts in queries |
| Card turns face-down, leaves, changes control | it stops counting (and `since` resets when it comes back face-up: a new card, `moves` already says so) |
| Source negated (Impermanence, Skill Drain) | `isNegated(source)` true, so it stops counting; back when the negation ends (`negated-floodgate-returns`) |
| End of turn | `withoutEnded` also drops `modifiers` whose `until <= turn`; continuous ones have `until: null` |

Lasting modifiers freeze the target's `moves` (`affects: id` plus `moves`), as `Negation` does now: a target that left and came back is a
new card (`negated-monster-state`).

## 4. How locks plug into `legalActions` and `act` (and keep the speed)

- **One read per listing, not per offer.** `collect` computes `const locks = activeLocks(duel)` once (`null` when `modifiers` is empty and no
  card in the defs index is a lock: the normal case, one comparison). Only when non-null do the three checks below run.
- **Activation locks** (`what: "activate"`, Jinzo-like): in `offer()`, right after the speed check: `if (locks && lockedActivation(locks, duel, ctx, effect)) return false`.
  `activateEffect` need not repeat it (it already trusts the listing; `act` re-lists only the card's own actions through `isLegal`).
- **Special Summon locks** (`what: "special-summon"`): checked on the built-in Special Summon in `collect` now; the Summon-by-effect and the procedures
  read it in step 8 (Konami's Rivalry/Gozen FAQ lists the Summons a lock stops: `rivalry-lock-sources`).
- **Add-to-hand lock** (Droll): the guard is in **`move()`** in `duel.ts` (the one place cards go deck to hand): if `locks` has `add-to-hand`
  and `before.zone === "deck" && to.zone === "hand"`, the move is not done (the duel returns unchanged) and no event is raised. So a draw or a
  search **does nothing** while the effect is still activated (`droll-lock-draws-fail`: Maxx "C" etc. can be activated, the draws are not
  done) and a card that does other things is played in full (`droll-lock-does-not-stop-other-parts`). Operations that say "if you do" read the
  card's zone afterwards, as the step 4 effects already do. Effects that can be **activated** only if they can add (a search worded
  "add 1 ... from your Deck to your hand"): a record flag `requiresAddToHand: true` makes `activationWays` return `[]` under the lock; the
  Konami Q&As that say which cards need it (fids 24396, 24401, 24256 on Droll's list) are **not read yet**; read them before slice 14.
- Speed: reference boards have no modifier and no continuous card, so each query is an early return. Target: stay at or above the step 5
  ratios (crowdedHand 13.4×, floor seen 10.7×: the margin is thin, so no new work may land per offered effect). New benches: a board with Skill
  Drain and Muka Muka on the field (queries scan the field), and the rival's window with Droll in hand and the lock active.

## 5. Control

`Duel.piles` is keyed by controller and every effect reads `piles[player].monster`, so a **virtual** controller would break most of the core and
step 7's zones. Recommended: keep `changeControl` as the physical move (step 1), and put **the return** in the modifier list:
`{ layer: { kind: "control", to }, affects: id + moves, until: turn }` is added when the control effect resolves and, at the end of turn `until`,
`withoutEnded` calls `changeControl` back for each one still the card it names (record `control-until-end-phase`; the opponent places it in a
Monster Zone: step 7). `controller(duel, id)` is simply `card.controller`; it is a query only so that step 10 has one place to call. A
changed-control card is a new card: its `moves` changes, so negations and lasting ATK modifiers on it end (what step 1 already says). Read
before building (not yet read): the Konami Q&A on a control-taken monster turned face-down (in Enemy Controller's list).

## 6. Cards written as records for step 6

All are real, with EN and FR text read from Konami today (`sources.md`):

```ts
// Droll & Lock Bird, cid 9279. Quick Effect from the hand: event "added-to-hand", from the Deck, to the OPPONENT, not in the Draw Phase.
{ code: "droll-lock-bird", kind: "monster", facts: { level: 1, atk: 1000, def: 0 },   // printed numbers: check on the page when writing
  effects: [{ type: "quick", range: "hand",
    event: (duel, e, { player }) => e.type === "added-to-hand" && e.from === "deck" && e.card.owner === other(player) && duel.turn.phase !== "draw",
    cost: sendThisToGraveyard,                 // "You can send this card from your hand to the GY;" (before the semicolon: a cost)
    operation: (duel) => addModifier(duel, { layer: { kind: "lock", what: "add-to-hand", who: "both" }, affects: () => true, until: duel.turn.number }) }] }
// Skill Drain, cid 5740. Continuous Trap: cost 1000 LP; while on the field, negates all face-up monsters' effects (activations still allowed).
{ code: "skill-drain", kind: "trap", effects: [
    { type: "activation", stays: true, cost: payLp(1000), operation: (duel) => duel },
    { type: "continuous", range: "field", modifies: () => [{ kind: "negate" }], affects: (duel, t) => t.zone === "monster" && t.face === "up" } ] }
// Shrink, cid 5355. Quick-Play: target 1 face-up monster on the field; its original ATK becomes halved until the end of this turn.
{ code: "shrink", kind: "quick-play", effects: [{ type: "activation",
    target: (duel) => faceUpMonsters(duel),    // either side
    operation: (duel, link) => addModifier(duel, { layer: { kind: "base", stat: "atk", to: (o) => o / 2 }, affects: targetsOf(duel, link)[0]!.id, until: duel.turn.number }) }] }
// Muka Muka, cid 4522 (notes not read). Continuous: "Gains 300 ATK/DEF for each card in your hand."
{ code: "muka-muka", kind: "monster", facts: { level: 2, atk: 600, def: 300 }, effects: [
    { type: "continuous", range: "field", modifies: (duel, s) => [{ kind: "add", stat: "atk", by: 300 * hand(duel, s.controller) }, { kind: "add", stat: "def", by: 300 * hand(duel, s.controller) }] }] }
```

Why these four: Droll is what the owner asked back and it is the lock; Skill Drain is the floodgate that is also the negation of
**continuous effects** of every monster; Shrink is the "original ATK" case every Konami ATK Q&A is filed under; Muka Muka is the one real
Academy card that is a pure continuous ATK gain (Osiris is the one Konami's Q&A uses; Academy has no Osiris). Equip cards (Megamorph, Sacrifice's
Q&A) wait for step 7; the Sacrifice/Megamorph order is tested with **made-up continuous Spells** (`set-card`, `double-card`), and the test says so.
Jinzo ("Trap Cards ... cannot be activated") is the natural `what: "activate"` card, and the old engine has it (`trapsLocked`); its text and Q&A
were not read: add it as a fifth card if the owner wants an activation lock proven on a real card (D5).

The new event: `GameEvent` gains `{ type: "added-to-hand"; card: CardInstance; from: Zone; batch?: number }`, raised from `move()` whenever a
card goes to the hand from another zone (so a draw and a search both raise it; `from` tells the Deck). The `moved` event is raised as today.
`Infinite Impermanence`'s column clause still waits for step 7, but its "for the rest of this turn" part is now a `negate` modifier with a
column filter in `affects`; keep `CardDef.unmodelled: ["column"]` until step 7.

## 7. TDD slices at the `legalActions` / `act` seam, smallest first

Each test goes through `position()`, `offered()`, `play()` as in the existing tests, and cites a record in its title with `cites(...)`.
"Made-up" cards are fixtures in `test/rules`, not in `CARD_SOURCES`. Expected results are on the board: ATK read through `atk(duel, id)`,
zones through `codes()`.

| # | Test title | Cites | Expected |
|---|---|---|---|
| 1 | "negations moved into the modifier list change nothing: Infinite Impermanence's three step 5 tests and `negation.test.ts` pass untouched" (refactor, no new test body except one: a monster negated, turned face-down, is not negated: `isNegated` false) | `negated-monster-state` | step 5 suite green; `Duel.negations` no longer exists |
| 2 | "a monster's ATK and DEF are its printed ones" | `atk-original-glossary` | `atk(id)` = facts.atk, `def` = facts.def, `level` = facts.level; Link: `null` |
| 3 | "Shrink halves the original ATK of a face-up monster of either player until the end of the turn" | `shrink-text` | ATK 2000 -> 1000 after the chain; back to 2000 on the next turn; both players' monsters are targets, a face-down one is not |
| 4 | "a later gain applies on top of the halved original ATK" (Muka Muka, 2 cards in hand, Shrink) | `shrink-then-own-gain` | 600/2 + 2*300 = 900, not (600+600)/2; hand size 3 -> 1200 at once (no stored value) |
| 5 | "a loss that was there before Shrink is recomputed on top of the halved original" (made-up lasting `add -800` x3, then Shrink on a 3200 monster) | `shrink-recomputes-losses` | 1600 - 2400 clamped to 0; the older **gain/loss** stays after Shrink ends; (the "older original-ATK effect is lost" half of that Q&A is pending, D2) |
| 6 | "a later change of the original ATK beats an earlier 'becomes 0'" (made-up lasting `set 0`, then Shrink on a 3000 monster) | `set-then-shrink` | 1500 |
| 7 | "a later 'becomes' beats an earlier original-ATK change, and an older 'becomes' comes back when the newer one stops applying" (made-up continuous `set-card` and `double-card` Spells, both orders, LPs equal and not) | `set-vs-original-later-wins-a`, `set-vs-original-later-wins-b` | 2500 in a; in b: 0 while LPs differ, 2500 when equal; marked "made-up cards instead of the Equip Card" |
| 8 | "a negated monster has its continuous effects switched off too" (Muka Muka negated by Infinite Impermanence) | `negation-reaches-continuous` | ATK back to 600 whatever the hand; Shrink (another card's lasting effect) still halves; at the end of the turn ATK is 600 + 300 x hand again; this is the owner's first case |
| 9 | "the negation ends when the monster turns face-down or leaves, as before" | `negated-monster-state` | Muka Muka re-played face-up is not negated |
| 10 | "Skill Drain costs 1000 LP and stays on the field after it resolves" | `skill-drain-text` | LP 7000; Skill Drain face-up in the Spell & Trap pile, not in the Graveyard; needs the `stays` change in `resolveChain` |
| 11 | "Skill Drain negates the effects of all face-up monsters of both players, and they can still be activated" | `skill-drain-text`, `skill-drain-notes` | Muka Muka ATK back to 600 for either player; an ignition monster is still offered and resolves with `Link.effectNegated`; a face-down monster is negated once flipped up |
| 12 | "a negated floodgate is off, and applies again when the negation ends" (a made-up continuous lock negated by Skill Drain, then Skill Drain leaves) | `negated-floodgate-returns` | lock off while Skill Drain stands; back at once when it is gone |
| 13 | "a monster that left the Monster Zone as its own cost is not negated when its effect resolves" | `skill-drain-notes` | the effect is applied |
| 14 | "a card added from the Deck to the hand raises 'added-to-hand' with where it came from" (search and draw) | `droll-text` | events seen through `duel.live`: `{from: "deck"}` for a search; `{from: "graveyard"}` for a recovery |
| 15 | "Droll & Lock Bird is offered when the opponent adds a card from the Deck to their hand outside the Draw Phase, and not otherwise" | `droll-text` | offered after the rival's Terraforming and not after the rival's own Draw Phase draw, not after **your** own search, not after a Graveyard recovery |
| 16 | "Droll sends itself to the Graveyard, and for the rest of this turn nobody can add a card from the Deck to the hand; a draw does nothing" | `droll-text`, `droll-lock-draws-fail` | Droll in your Graveyard; the rival's Pot of Greed is still offered and draws nothing; the lock is gone on the next turn |
| 17 | "a card that does something else is played in full under the lock" (made-up two-part card) | `droll-lock-does-not-stop-other-parts` | the other part is applied, the add is not |
| 18 | "a search that needs to add a card cannot be activated under the lock" (Terraforming) | fid 24396 / 24256 **to read first** | not offered; marked pending until the fid is read (D5) |
| 19 | "Droll can be activated after the whole chain when the card was added in the middle of it" | `droll-notes` | offered after a 2-link chain resolved where link 2's effect (the search) resolved first: needs the "lingering event" (D4) |
| 20 | "a Skill Drain-negated Droll does nothing... " is **not** a slice: Droll is in the hand (the hand is not reached) | `negation-reaches-continuous` | left out on purpose |
| 21 | "a control change lasts until the End Phase: the monster goes back to its owner then" (made-up `take-control` Quick-Play, resolves `changeControl` + control modifier) | `control-until-end-phase` | back in the opponent's Monster Zone after the End Phase; its lasting ATK and negation modifiers ended when it moved |
| 22 | "a monster taken a link before a later link resolves counts as yours at that resolution" | `control-read-at-resolution` | the later link may choose it |
| 23 | "Level is the printed one, then set and add in timestamp order" (made-up) | judge lead `q-lvl2` | tests title says "lead only, no Konami record"; or leave out (D6) |
| 24 | pending (not run, `it.todo` is not counted by `cites`): Gale/Apollousa "the older effect does not come back when Shrink ends" | `set-then-shrink-ends`, `shrink-recomputes-losses` | decided by D2; listed in `CardSources.deferred` or the rule record `pending` until then |

Each of slices 8, 10, 12 is more than one commit's worth of change; the first useful stopping point is after 9 (negation as a modifier,
the owner's first case), the second after 13 (Skill Drain), the third after 17 (Droll and the lock).

## 8. What the battle step (6b) and step 7 will read

**Battle (6b):** damage calculation reads `atk()`/`def()`, **at the moment it happens**, never an ATK frozen at attack declaration
(`atk-read-at-damage-calculation`, `chain-atk-changed-before-resolution`: conditions on ATK are read at resolution). So the Damage Step
needs no snapshot except "ATK when the effect was activated" for effects that say so; `originalAtk()` is public for cards that quote it.
Durations: `until` is a turn number today; the Damage Step wants "until the end of the Damage Step" and "during the Damage Step only". Make
`until` a small union now (`{ end: "turn", turn } | { end: "damage-step" }`, with only the first used), so 6b adds an expiry hook, not a new field.
Quick-effect ATK changers in the Damage Step (Shrink may be activated from the Damage Step start to before damage calculation per its notes)
are plain lasting modifiers; the legality window is 6b's.
`LP` changes (Megamorph-like) change ATK without any event: nothing to subscribe to, because ATK is a query.

**Step 7 (zones):** `affects` is a predicate over the target card, so a column or Link-arrow filter is a new predicate, not a new
modifier kind (Infinite Impermanence's column negation, co-link effects). Equip Cards are a **relation** (equipped to a card) that a
continuous record's `affects` reads; the relation and its "Equip Cards are destroyed if the monster is destroyed, flipped face-down or
removed" (RB10, Equip Spell Cards) belong to step 7, then Megamorph and Sacrifice can replace the made-up cards of slice 7. Control changes
need a zone for the returning monster (the opponent chooses, `control-until-end-phase`). Pendulum Zone effects need `range` to grow.
Lock `only` filters for "cannot Special Summon from the Extra Deck" and per-zone floodgates also use the predicate.

## 9. Decisions for the owner

- **D1. Continuous Spell/Trap cards stay on the field from step 6**, which means a `stays` flag on the activation record and removing them
  from the post-chain sweep (their exact zone stays step 7). Needed by Skill Drain. Recommended: yes.
- **D2. The ATK model.** Build the two-layer model of section 2 (later wins in `base`+`set`; `add` on top, re-read; swap reserved)
  and leave the two Konami cases where an older overwritten effect does **not** come back (Gale vs Shrink, Apollousa's two original-ATK effects) as
  pending (slice 24), or build a `lasting` supersession rule for them now. Recommended: pending; no real card of ours needs them, and
  the Q&As disagree with Sacrifice/Megamorph unless "lasting" and "continuous" are told apart, which is a reading.
- **D3. Control stays a physical move** (piles keyed by controller), with the return in the modifier list, not a virtual controller. Recommended.
- **D4. Droll after a chain.** Konami's note says it can be activated after the chain in which the card was added. Today's "last thing
  that happened" drops an event at the next link's resolution. Accept that limit, or give an `EffectRecord.lingers` flag so the event
  stays live to the end of the chain. Recommended: the flag (small; slice 19).
- **D5. Which activations a lock stops.** The result is stopped for draws (Konami read); for searches we know only the titles of the
  Q&As. Read fids 24396, 24401, 24256 first and set `requiresAddToHand` per card; add Jinzo as the real `activate` lock? (text and Q&A not read).
- **D6. Unsourced bits to accept or drop:** the clamp of ATK/DEF at 0 (old engine only); the Level query (judge lead only, slice 23);
  Muka Muka's Japanese notes not read (read them before it is called done, or use Osiris-style cards later).
- **D7. Order of work with the other agent.** `CardInstance.since`, `moves.ts`/`move()` guard and `Duel.modifiers` touch `duel.ts`,
  `negation.ts`, `chain.ts` and the README; start only after their edits (LP rounding, destruction event, Solemn vs hand effects) are committed
  or handed over, and rebase the destruction event: a destroyed card is where "leaves the field" cleanup would hook later.
