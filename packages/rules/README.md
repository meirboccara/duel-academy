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
- `src/effects.ts`: the effect shape of steps 2 and 3, replaced by effect records in step 4 (below).
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
- The trigger fixtures are made-up test cards (written as effect records since step 4).
- Nothing raises `summoned` yet but a card effect: Summons come with step 8. No attack, destruction or "leaves the field"
  events beyond `moved` (a destruction is a move to the Graveyard; its cause is not recorded).
- Trigger occurrences are first filtered to those whose card has not moved since. An effect worded "each time" (`each:
  true`) then goes on the chain once for every time its condition was met, as Konami's Japanese Q&A says (records
  `each-time-counts-events`, `each-time-across-chain`; 24018 and 22573 are about "each time" effects only). Any other effect
  goes on the chain once per trigger point: no Konami page we found says whether such an effect can activate twice
  off two events, so the once-per-point policy is a choice, not a ruling.
- Cards moved at the same time by one effect (`moveCards`, events sharing a `batch`) are one occurrence for an "each time"
  effect (record `simultaneous-counts-once`: Konami's Japanese Q&A on Zeta Reticulant, two monsters banished at once, one
  activation; fid 6888 says the same for five cards). Separate moves (`moveCard`, or two links) count separately. A card
  effect has to say what is simultaneous by calling `moveCards`; the core cannot tell. "a monster" wording is assumed to
  count like "monsters": YGOProJudge (the owner's rules site, no source cited) says so, and no Konami page was found.
- Targets of an "each time" effect are not tied to one occurrence: it may choose among all cards that met the condition
  (YGOProJudge agrees, no source). `pass` declines all that is left of a player's optional effects, so an optional "each
  time" effect can be activated fewer times than it counted (a player may activate fewer; YGOProJudge agrees, no source).
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
  effect is activated" is a Quick Effect, which step 4's records can say; no card needs the same-timing check yet).
- Spell/Trap Cards that stay on the field and the Damage Step's limits are still out of scope.

Step 4 (effect records + once per turn):
- `src/effects.ts`: `EffectRecord` = `{ type, range, event, timing, condition, cost, target, operation, once }`, plus
  `mandatory`, `each` and `categories`. `type` is `activation` (the Spell/Trap Card itself), `ignition`, `quick` or
  `trigger`; `range` is where the card is (`hand`, `field`, `graveyard`, `banished`). A `CardDef` is a code, a `kind`, a few
  `facts` (Field icon, Level, Normal) and its records. The records are plain values shared by every duel.
- `src/activation.ts`: what activating a record takes, shared by an effect the player activates (`chain.ts`) and a trigger
  put on a chain (`triggers.ts`), so listing and activating cannot disagree. Listing: `condition`, the `once` limit, then
  a **dry run of the cost** (`cost` returns the duel with the cost paid, or `null`; it is run on the immutable duel and
  thrown away) and the `target` candidates **read on the board the cost leaves** (a cost can take the only target or make
  one: records `cost-then-target`, `costs-at-activation`). Activating pays for real, checks the target again on the paid
  board (the step 3 leftover) and freezes the link.
- Categories are frozen on the link: `categories` is a list, or a function read once at activation (on the board the cost
  left, with the targets), never again.
- Choices at resolution (`ask` in `effects.ts` returns the duel with the question in `duel.asking`; the `choose` action): an operation can return `ask(duel,
  player, candidates, then)` for a card that is not a target (Terraforming's Field Spell, Link Spider's monster). The chain
  waits, `legalActions` lists `choose`, `act` resumes the remaining links; one candidate is taken at once and none ends the
  effect (record `choice-at-resolution`). The continuation is a pure function, so a paused duel can be answered both
  ways. A teaching option never changes it.
- `src/once.ts` (internal, not exported): five once-per-turn scopes, as printed on the card: `instance` ("Once per turn:", per copy, lifted when the
  card became a new card, i.e. its `moves` changed), `name` ("You can only use this effect of [name] once per turn": per
  player, spent at activation, kept when the activation is negated), `activation` ("You can only activate 1 [name] per
  turn": a negated activation gives the use back, a negated effect does not; `negateActivation` does the refund), `duel`
  (never lifted) and `chain` (lifted once the chain has resolved). A `key` shares one limit between effects. Triggers use
  the same check.
- `src/cards/`: the cards Academy writes as data, as records, each with its `CardSources` and tests in `test/cards`: Ash
  Blossom & Joyous Spring, Terraforming, Mystical Space Typhoon, D.D. Crow, Pot of Greed and Link Spider
  (hard once per turn; draw; Quick Effects from the hand with cost and target; a search with a chosen card; a "once per
  turn" monster). `CARD_DEFS` is what to hand to `createDuel`. Celtic Guardian is the effect-less one.
- Tests: `test/rules/records.test.ts` (costs, targets, choices, categories), `test/rules/once-per-turn.test.ts` (the five
  scopes), `test/cards/*` (each card through `legalActions`/`act`, citing its Konami text).

Known limits of step 4 (what the tests do not prove):
- Once-per-turn semantics now rest mostly on Konami's Japanese Q&A (rule records in `src/rule-sources.ts`): a "use" wording
  is by player and effect and a second copy is blocked (`once-name-second-copy`, fid 24139), and it is spent when the
  activation or the effect is negated (`use-negated-activation-spent`, fid 12001; `effect-negated-still-activated`,
  fid 14075); an "activate 1 ..." limit gives the use back when the activation is negated (`activate-one-unless-negated`,
  fid 21245; `activate-negated-can-again`, fid 11730); a once-per-Duel use is spent even if negated and each player has
  their own (`duel-use-spent-even-if-negated`, fid 23336; `duel-per-player-control`, fid 12798; `duel-per-player-effect-used`,
  fid 8114). Still unsourced, resting on YGOProJudge (no source cited): a card that moved is a new card with a new
  "Once per turn:" use; what a negated activation does to a "Once per turn:" use (not refunded here; YGOProJudge's first
  answer on it was inconsistent, so unsettled); that the other player's copy has its own per-turn `name` use; and every
  claim about "once per Chain" (per player, lifted when the chain resolves), for which only a card's printed wording
  was found.
- A cost can offer choices (`CostSpec` in `effects.ts`: `pick` lists the ways, each a list of cards, `pay` pays one, an
  optional cheap `can` pre-check): `legalActions` lists one activation per way, combined with the targets read after paying
  it (`paid` on the action), and `act` pays exactly that way. A function cost stays one way. Which cards a cost lists is the
  card's `pick`: the core does not enumerate "any 2 cards" by itself (a card lists the combinations it allows). No real card
  of ours needs it yet (Ash and D.D. Crow discard themselves).
- Targets: `targetCount: { min, max }` (default one) lists every legal combination (zero for `min: 0`, "up to N", "target 2"),
  checked again after the cost; each target's `moves` is frozen on the link. Konami's pages only give the wording
  (`target-count-from-text`): the combinations are the core's reading. A target list is in the candidates' order, so the
  action must name them in that order. A card listed twice among the candidates counts once, so a card is never paired
  with itself. Combinations are not capped: "up to 5" of 30 candidates lists them all (the listing of a whole duel stops at
  the first way when it only needs to know whether there is one). A record with `targetCount` and no `target` is a
  definition error and throws when the effect is read. No real card of ours needs several targets yet.
- A target counts as the same card only while it has not moved (`targetsOf` compares `moves` with the value frozen on the
  link); that a card that left and came back is no longer "that target" is the core's reading, no Konami page found.
- Every link freezes `answers`, the link on top of the chain when it was activated (`null` for Chain Link 1 and for trigger
  effects put on a chain at a trigger point, which answer nothing), and Ash Blossom & Joyous Spring negates that link. Chain links only go on top, so nothing can sit between Ash and the link it answered; the test for it is structural (it would pass with the old
  `index - 1`) and says so; the
  frozen link only matters once something can change the chain from below (step 5). Several negations of one link, and
  "cannot be negated", also come with step 5.
- A resolved Field or Continuous Spell is swept to the Graveyard like a Normal Spell until step 7 (zones) and the later
  steps keep it on the field.
- A choice at resolution is one card from a list; "up to N" and "you may choose none" are not modelled as such (several cards
  are several `ask`s in a row), and a player cannot decline a mandatory search.
- Zones: Link Spider summons "to your zone this card points to" into the Monster Zone with no zone choice (step 7); a Field
  Spell is a Spell in the S/T pile (`facts.icon: "field"` is only used for searching).
- Droll & Lock Bird is not a card of the core yet: its lock "for the rest of this turn" is a continuous effect (step 6), so
  it would not play as printed. It waits for step 6 (its event, Draw Phase exception and cost are easy to write as a record).
- Ash Blossom & Joyous Spring answers `search`, `summon-from-deck` and `send-from-deck` only: the printed list. Drawing is
  not on it. Academy's old engine also lets Ash answer a draw; that is a difference of data, not settled here.
- Pot of Greed needs 2 cards in the Deck (kept from the old engine; no Konami page read). Link Spider needs a Normal Monster
  of Level 4 or lower in the hand to be activated (an analogy with `search-needs-a-card`; no Konami page read).
- Mystical Space Typhoon cannot target itself and "destroys" by moving to the Graveyard (no destruction event yet). The
  rulings of its Q&A that need a card on the field after the cost (Xyz Reborn) are only in the step 2 rule records.
- The cost dry run makes the listing 1.5 to 2× slower (BASELINE.md). `act` now checks an action by listing only what its own
  card could do, which more than pays for it; the optional `CostSpec.can` pre-check showed no gain on the reference boards.
