# @duel-academy/rules

The new rules core: Yu-Gi-Oh! under full TCG tournament rules, built step by step from
[docs/rules-core-spec.md](../../docs/rules-core-spec.md) ([ADR 0001](../../docs/adr/0001-new-rules-core.md)).
Junior keeps running on `@duel-academy/engine` until this package reaches parity.

Step 0 (foundation) so far:
- `createRng`: the seeded, resumable source of all randomness.
- `SourceRecord` / `validateSource`: what each test cites (card text, TCG rule, Japanese Q&A on Konami's pages).
- `CardSources` / `coverage` / `cites`: the definition of done, checked by `test/definition-of-done.test.ts` over every
  card in `src/cards` and the card tests in `test/cards`.
- `bench/`: reference boards and the legal-move baseline (`BASELINE.md`).

Step 1 (card identity): `createDuel`, `moveCard`, `changeControl` in `src/duel.ts`.

Step 2 (one chain + priority loop):
- `legalActions(duel)` / `act(duel, action)` in `src/chain.ts`: every action open to the player who holds priority, and
  the duel after one of them. Konami's Fast Effect Timing chart; the chain resolves when both players pass in a row.
- `Duel` now carries the turn, the chain (`Link[]`), the priority state and the teaching options (`chainLimit`,
  `everyWindow`).
- `src/effects.ts`: a provisional effect shape, replaced by effect records in step 4.
- `src/rule-sources.ts`: the rules cited by the tests in `test/rules` with `cites("rules", id)`.

Step 3 (triggers + missing the timing):
- `src/events.ts`: typed events (`moved` on every move, `summoned` and `phase` raised by effects and the core) with
  `raiseEvent`, and `breakEffect`: "something else happened", after which optional "when" triggers have missed the
  timing and a fast effect (`Effect.on`) can no longer answer the earlier events. Effects call it between the parts of
  a "then"; the core calls it before each link resolves, after a cost, before a phase and before a Set.
- `src/triggers.ts` (with `Building`, the choice in progress): `Effect.activates: "trigger"` (with `on`, `mandatory`, `timing: "when" | "if"`, `from`). After a
  chain resolves, a Set, or the start of a phase, the waiting triggers go on one chain in Konami's order (turn player's
  mandatory, opponent's mandatory, turn player's optional, opponent's optional). The player chooses in any order within
  a group through `legalActions`/`act` (`activate`, and `pass` to decline the rest of their optional effects); a mandatory
  trigger with one way to activate goes on by itself. A trigger whose card moved in between does not activate.
- `test/rules/triggers.test.ts`: Konami's simultaneous-trigger order, optional choices of the non-turn player, "when" vs
  "if", whole-chain deferral, cost events, moved cards, and the Heraldry Change / Torrential Tribute example.

Known limits of step 3 (to be honest about what the tests do not prove):
- The trigger fixtures are test cards in the provisional effect shape; step 4 replaces the shape.
- Nothing raises `summoned` yet but a card effect: Summons come with step 8. No attack, destruction or "leaves the field"
  events beyond `moved` (a destruction is a move to the Graveyard; its cause is not recorded).
- Trigger occurrences are first filtered to those whose card has not moved since. An effect worded "each time" (`each:
  true`) then goes on the chain once for every time its condition was met, as Konami's Japanese Q&A says (records
  `each-time-counts-events`, `each-time-across-chain`; 24018 and 22573 are about "each time" effects only). Any other effect
  goes on the chain once per trigger point: no Konami page we found says whether such an effect can activate twice
  off two events, so the once-per-point policy is a choice, not a ruling. Simultaneous moves are one event each, so an
  "each time" effect counts a sweep of two cards twice; Konami counts simultaneous sends once. Batched events are not
  modelled yet.
- The teaching chain limit stops optional triggers from being offered once the chain is full; mandatory triggers still
  go on the chain (dropping them would change how a card resolves), so a trigger chain can exceed the limit.
- A Spell or Trap Card of a chain goes to the Graveyard after the whole chain (record `chained-card-after-chain`: Konami's
  Japanese Q&A, about Quick-Play Spells and Traps chained to an effect). No page we found says it for a Normal Spell at
  Chain Link 1; the core applies it to all of them.
- An event stays the one that fast effects answer while the chain it triggered is built (a Trap can be Chain Link 2 to
  the trigger of a Summon, and another response Chain Link 3: records `answer-the-summon-in-the-chain`,
  `answer-the-summon-again`). That it stops once both pass or after the trigger chain resolves is not worded on a page
  we found: it follows from "the last thing that happened", and the test says so.
- An optional "each time" trigger that waits twice is declined as a whole by "pass"; Konami's "up to that many times"
  does not say how a player declines, so this is a choice. An "each time" effect's targets are not tied to the event
  that counted (no fixture needs it yet).
- Where Konami's pages are silent the tests say so in `src/rule-sources.ts`: that a "when" trigger of a card paid as a cost
  misses the timing is derived (cost-not-chainable and the "last thing that happened" rule), not quoted. Konami's
  OCG Q&A orders simultaneous effects by "priority 1/2/3" with different grouping (face-up optional effects before
  hidden ones); this core follows the TCG rulebook (RB10 p. 50), as the spec says.
- No same-timing check between trigger effects that respond to the activation of an effect (a trigger "when a card or
  effect is activated" is a Quick Effect, step 4's records).
- Spell/Trap Cards that stay on the field and the Damage Step's limits are still out of scope.
