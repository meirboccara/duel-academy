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
  off two events; YGOProJudge's chat agrees (asked 2026-11-23, no source cited).
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
  Chain Link 1; the core applies it to all of them, and YGOProJudge's chat agrees (asked 2026-11-23, no source cited).
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
  (never lifted) and `chain` (lifted once the chain has resolved). A `key` shares one limit between effects (which must then allow the same number of uses). Triggers use
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
  link); that a card that left and came back is no longer "that target" has no Konami page; YGOProJudge's chat agrees (asked 2026-11-23, no source cited).
- Every link freezes `answers`, the link on top of the chain when it was activated (`null` for Chain Link 1 and for trigger
  effects put on a chain at a trigger point, which answer nothing), and Ash Blossom & Joyous Spring negates that link. Chain links only go on top, so nothing can sit between Ash and the link it answered; the test for it is structural (it would pass with the old
  `index - 1`) and says so; the
  frozen link only matters once something can change the chain from below. Step 5 added "cannot be negated" (see below);
  two negations of one link are still not told apart (the one that resolves first takes).
- A resolved Continuous Spell stays on the field from step 6 (`stays`); a Field Spell, an equipped Equip Spell and a Pendulum Monster
  in its Pendulum Zone stay from step 7.
- A choice at resolution is one card from a list; "up to N" and "you may" are `askUpTo` and `askMay` since the 2026-11-24 readiness
  slice (last section), and a player still cannot decline a mandatory search.
- Zones: see step 7 below (Link Spider's pointed zone, the Field Zone).
- Droll & Lock Bird is not a card of the core yet: its lock "for the rest of this turn" is a continuous effect (step 6), so
  it would not play as printed. It waits for step 6 (its event, Draw Phase exception and cost are easy to write as a record).
- Ash Blossom & Joyous Spring answers `search`, `draw`, `summon-from-deck` and `send-from-deck`. A draw is "add a card from the
  Deck to the hand": settled on 2026-11-24 with Konami's Japanese Q&A fid 21685 (OCG only; see the last section).
- Pot of Greed needs 2 cards in the Deck, and Link Spider a Level 4 or lower Normal Monster in the hand (and a free zone it
  points to), to be activated: no Konami page read; YGOProJudge's chat agrees (asked 2026-11-23, no source cited) on both.
- Mystical Space Typhoon cannot target itself and "destroys" with `destroyCard` (the `moved` event carries `reason: "destroyed"`). The
  rulings of its Q&A that need a card on the field after the cost (Xyz Reborn) are only in the step 2 rule records.
- The cost dry run makes the listing 1.5 to 2× slower (BASELINE.md). `act` now checks an action by listing only what its own
  card could do, which more than pays for it; the optional `CostSpec.can` pre-check showed no gain on the reference boards.

Step 5 (negation):
- Four different things, kept apart (`src/negation.ts`, `src/summon.ts`, `src/life.ts`, the chain in `src/chain.ts`):
  - **Activation negated / effect negated**: the two `Link` flags and `negateActivation` / `negateEffect`, as before. A negated
    activation still pays its cost and still counts as an activation for "once per turn" limits (Konami's Japanese Q&A, records
    `negated-activation-cost-stays`, `negated-activation-still-counts`); only a "You can only activate 1 ..." limit is given
    back (step 4). `negateActivationAndDestroy` is "negate the activation, and if you do, destroy that card".
  - **A card negated on the field** ("negate its effects until the end of this turn"): `Duel.negations`, a list of
    `{ card, moves, until, stamp }`, read by `isNegated`. It is the card as it was (`moves`): a card turned face-down, gone and
    back, or under another controller is new and no longer negated (record `negated-monster-state`). A negated monster still
    activates its effects and pays the cost, and the effect is negated: when the link is made (`Link.effectNegated`, so a
    monster that is its own cost is negated too) and again when it resolves (a negation chained to its effect). Only effects
    activated in the Monster Zone are reached (`impermanence-only-monster-zone`). The list falls at the end of the turn. For now
    it only stops the card's chain links: its Continuous effects stay applied until step 6 makes negation a modifier.
  - **"Cannot be negated"**: `EffectRecord.activationCannotBeNegated` / `effectCannotBeNegated`, a boolean or a condition. A
    negation that makes a chain block (`negateActivation`, `negateEffect`) reads it when the negating effect resolves; the
    negation of the card's own effects reads it when the immune effect resolves (record
    `cannot-be-negated-checked-at-resolution`). A Summon that cannot be negated (`CardDef.summon.cannotBeNegated`, Obelisk's
    wording) is different: the negating card is not offered at all (`negate-summon-cannot-be-negated`).
  - **A Summon negated**, as a moment of its own (`Duel.summoning`). The `summon` action (a Normal Summon of a Level 4 or lower
    monster once a turn, or a built-in Special Summon from the hand, `CardDef.builtInSummon`) starts no chain
    (`normal-summon-is-an-action`). The monster stays in the hand, not on the field. The turn player and then the opponent may
    answer with an effect marked `answersSummon`; when both pass, the Summon succeeds (`summoned` is raised, so the "when
    Summoned" triggers go on a chain). A negator marks the Summon negated and destroys the monster where it is; no `summoned`
    is raised and no trigger happens. A Spell or Trap Card whose activation was negated, and a monster whose Summon was
    negated, reach the Graveyard without being sent from the field (`moved.negated`; records `negated-card-not-from-field`,
    `negated-summon-not-from-field`).
- `Duel.lp` (8000 each) and `payLp`, `payHalfLp`: the costs of the Solemn cards. No damage yet.
- `EffectRecord.handIf`: "if you control no cards, you can activate this card from your hand" (a Trap is listed from the hand,
  in either turn, with no "Set this turn" limit).
- `src/cards/`: Solemn Judgment, Solemn Strike and Infinite Impermanence, each with its Konami text (English and French) and
  tests in `test/cards`. New rule records: `src/negation-sources.ts`, with `SourceKind` `"jp-notes"` for the 補足情報 notes at
  the top of a card's Q&A page (they have no Q&A id).
- Infinite Impermanence was partial until step 7 (its column clause); it is now applied in full (see step 7). `CardDef.unmodelled`
  and `CardSources.deferred` stay for later cards: `coverage` reports a deferred part as **pending**, never as done, and step 10's
  port must refuse a card with `unmodelled` parts.
- `bench/negation.bench.ts`, and the step 5 table in `bench/BASELINE.md`.

Known limits of step 5 (what the tests do not prove):
- YGOProJudge (the owner's rules site, no source cited, asked 2026-11-23 in four sessions) is the only backing for: the Summon's
  window offers only cards worded "would be Summoned" and is over once a chain started in it has resolved (asked twice, the
  second time precisely); a monster whose effects are negated can still activate its Ignition, Quick and Trigger Effects and
  pay the cost, and the effect resolves negated; once per turn: an activation negated gives back an "activate 1" use and not
  the "Once per turn:" or "use this effect" ones. Konami's own pages cover the rest (see `src/negation-sources.ts`), but most of
  that is Konami's Japanese Q&A (OCG), which has no formal authority over the TCG; the TCG pages say a Summon is an action with no
  chain (FET, rulebook) and, in a 2011 article, that only a built-in Summon can be negated.
- Summons: only a Normal Summon with no Tribute and a built-in Special Summon from the hand; no Flip Summon, Tribute Summon, Extra
  Deck procedure or Summon by effect (step 8). **For step 8**: the 2011 TCG article (PSCT part 5) says a Summon performed by an
  effect is not negatable by "negate the Summon" cards; Konami's 2026 Japanese Q&A (fids 24054, 16986) says a Summon an effect
  performs can be answered by Solemn Judgment when that effect was Chain Link 1 and cannot from Chain Link 2. Pick one in step 8;
  step 5 never opens the window for an effect's Summon. Also for step 8: a negated Summon is not "successful" (the monster
  cannot be revived by a "must first be Special Summoned" clause: fid 21297), and a negated Flip Summon is destroyed on the field
  (fid 17662).
- "Pay half your LP" pays the half rounded down for an odd LP and keeps the rounded-up half (125 LP leaves 63): Konami's Japanese
  Q&A for Dinomorphia Intact (cid 18539, fid 23944), OCG only; no TCG page found.
- The Damage Step's limits are not modelled (Counter Traps there, Infinite Impermanence not).
- Infinite Impermanence's targets exclude a Normal Monster and an already negated monster: that is Konami's Japanese note only; the
  TCG text has no such sentence. Whether a negated monster's trigger effects trigger is YGOProJudge's answer only (yes).
- Destruction is a `moved` event with `reason: "destroyed"` (`destroyCard`): MST, and the card or monster a negator destroys
  (even a negated Summon or activation, which is destroyed but "not sent from the field"). A move that is not a destruction
  (discard, send, Tribute, a cost) has no reason. The monster of a negated hand effect that stayed in the hand (an effect whose
  cost is not the card itself) is destroyed in the hand: YGOProJudge's answer only (asked 2026-11-23, no source cited). Konami's
  Q&A for Solemn Strike (cid 12187, 27 entries, all titles read) has no entry on it, and Solemn Judgment's 105 were not read.
- A negated monster's Continuous effects, and any other source of negation (Skill Drain), are step 6's modifiers.

Step 6 (continuous effects, as one list of timestamped modifiers; design in `docs/rules-core/step6/design.md`, sources in
`docs/rules-core/step6/sources.md`):
- `src/modifiers.ts`: two sources feed every query. **Lasting modifiers** (`Duel.modifiers`, stamped by `Duel.clock`) are what a
  resolved effect leaves "until the end of this turn": a negation (`negateCardEffects`; `Duel.negations` of step 5 is folded in),
  Shrink, Droll & Lock Bird's lock, a control change. **Continuous records** (`EffectRecord.type: "continuous"`, with `modifies` and
  `affects`) are read from the board when asked, never stored: a card is a source while it is face-up on the field, not negated and
  its `condition` holds, so a card that leaves, turns face-down or is negated simply stops counting, and counts again when the
  negation ends (record `negated-floodgate-returns`). Its stamp is `CardInstance.since`, the moment it came face-up on the field.
- Queries: `atk`, `def`, `originalAtk`, `level`, `isNegated`, `locked`. ATK/DEF: the printed value, then `base` ("original ATK
  becomes") and `set` ("becomes") in stamp order, a later one winning, then every `add` on top, re-read on each query (Konami's
  Japanese Q&A, OCG only, accepted by the owner: records in `src/continuous-sources.ts`). A negated monster loses its continuous
  effects while it is in the Monster Zone (Infinite Impermanence, Skill Drain).
- Locks: `locked(duel, "add-to-hand")` is checked in `move()` (a card does not go from a Deck to a hand while it holds) and in
  `activationWays` for a record marked `requiresAddToHand` (Terraforming, Pot of Greed), which is then not offered.
- `GameEvent` gains `added-to-hand` (`from` says where the card was). `EffectRecord.lingers`: a Quick Effect worded "If ..." may also
  answer what a link of the chain that has just resolved raised, in the first window after it (`Duel.lingering`; Droll's notes).
- Control: `takeControl(duel, id, side, until)` moves the card (control stays physical, design D3) and adds a `control` modifier;
  as the End Phase of turn `until` begins, `returnControl` gives the card back if it is still the card taken (sent to the Graveyard
  if its owner has no free Monster Zone). With no free Main Monster Zone when it resolves, the monster taken is destroyed and
  sent to its owner's Graveyard, and a card that takes control should not be activated with none (its condition): YGOProJudge's
  chat answer only (asked 2026-11-23, no source cited).
- `EffectRecord.stays`: a Continuous Spell or Trap Card stays on the field after its chain (Skill Drain).
- `src/cards/`: Shrink, Muka Muka, Skill Drain, Droll & Lock Bird. `bench/continuous.bench.ts` and the step 6 table in BASELINE.md.

Known limits of step 6 (what the tests do not prove):
- The ATK/DEF order rests on Konami's Japanese Q&A (OCG only) and on made-up continuous Spells standing in for the Equip Cards of
  those Q&As (Sacrifice, Megamorph: step 7). Two Konami cases are **not** modelled (design D2, an `it.todo`): an older *lasting*
  change of the original ATK (Gale, Apollousa's own effect) does not come back when a later one (Shrink) ends; the core brings back
  whatever still applies.
- ATK and DEF are clamped at 0 after every gain and loss is added (500 - 1000 + 700 = 200): no Konami page read; YGOProJudge's chat agrees (asked 2026-11-23, no source cited). The Level query (set, then add, in stamp order) is
  YGOProJudge's lead only (no source cited) and has no floor (a Level can go below 1); a Link monster's Level is not modelled (no
  `link` fact yet).
- Which cards cannot be activated under Droll's lock (`requiresAddToHand`) is YGOProJudge's answer for Terraforming and Pot of Greed
  (asked 2026-11-23, no source cited). Konami's Q&A says Maxx "C"-like cards can be activated and only their draws fail
  (`draws-fail`), and that Drish's draw bullet cannot be chosen (`drish`, pending: not an Academy card). Each new card needs its own call.
- `lingering` keeps the `added-to-hand` events the links of the chain raised, for the first window after the chain only; it is cleared by the next
  break or activation. Only Droll uses it.
- From step 7 the players choose the zones of a taken and a returning monster. A returning monster with no free Main Monster Zone
  is destroyed (YGOProJudge only), and so is a monster taken when no zone is left (YGOProJudge only). A taken monster
  that was turned face-down still goes back (see step 8's limits: YGOProJudge only).
- Two negators that negate each other: a card being asked about counts as not negated (no Konami page; the guard only stops a loop).
- Modifier durations are turn numbers; the Damage Step's durations come with the battle step.
- `atk` on a board with continuous sources walks the field each time (0.007 ms in the bench): fine for damage calculation, worth a
  per-position cache if a bot reads every ATK per move.

Step 6b (battle; plan in `docs/rules-core/battle/design.md`, sources in `docs/rules-core/battle/sources.md`, records in
`src/battle-sources.ts`):
- `src/battle.ts`. In the Battle Phase, with the game state open, `legalActions` lists `attack` actions (`{ type: "attack", card,
  target }`, `target: null` for a direct attack): each face-up Attack Position monster once a turn (`Duel.attacked`, per card as it
  was), never on the Duel's first turn, directly only when the opponent has no monster (more attacks, direct attacks past monsters
  and Defense Position attacks are permissions since the second readiness slice: last section). Declaring starts no chain (FET); the turn
  player then the opponent may respond.
- `Duel.battle` is the attack in progress. When both players pass with no chain it moves on: Battle Step (`declared`) → start of
  the Damage Step → before damage calculation (a face-down target is flipped face-up in Defense Position) → damage calculation
  (RB10's tables, ATK/DEF read now through step 6's queries; 0 ATK destroys nothing; `battled`, `battle-damage` events; the
  target's `flipped` event is raised only now) → after → end (the destroyed monsters go to the Graveyard together, `moved` with
  `reason: "destroyed"`, `by: "battle"`) → back to the Battle Step. Each timing raises `damage-step` and is a trigger point.
- Replay: a target gone or a new monster on the opponent's side before the Damage Step stops the attack; the attacker may attack
  again (`Duel.replay`), or another monster does and the first stays used.
- In the Damage Step, up to damage calculation, only Counter Trap Cards and effects whose `categories` say they directly change ATK
  or DEF (`change-atk`, `change-def`; Shrink has it) can be activated; afterwards nothing but triggers (`damageStepAllows`). Since
  2026-11-25 (last section) a Quick Effect flagged `damageStep` is also offered at every timing; Counter Traps keep RB10's limit.
- `CardInstance.position` (`attack` / `defense`); `loseLp` and `Duel.winner` (0 LP loses, both at once is a draw); a won Duel
  offers nothing.

Known limits of step 6b (what the tests do not prove):
- The Battle Phase's Start Step and End Step are not separate windows (the `phase` event of the Battle Phase stands for the Start
  Step); damage calculation itself has no window ("during damage calculation" effects: none of our cards).
- After damage calculation and at the end of the Damage Step nothing is listed but triggers, as RB10 says. YGOProJudge (lead, no
  source) would also allow Counter Traps and activation negators there; no Konami page read says so. (Superseded on 2026-11-25 by
  the official OCG rulebook and Konami's notes: last section.)
- A monster Quick Effect that does not change ATK/DEF is refused in the Damage Step (RB10's wording); no Konami page on hand traps
  there was read (YGOProJudge agrees, no source). Whether an effect "directly changes ATK or DEF" is the card's `categories`.
- Changing battle positions, Flip Summons and FLIP effects as such are step 8 (the `flipped` event exists; a FLIP card is a trigger on
  it). Negate Attack and "end the Battle Phase" are not modelled (YGOProJudge lead in `docs/rules-core/battle/ygoprojudge-leads.json`).
- Modifiers still end with the turn; "until the end of the Damage Step" durations are not modelled (no card needs them yet).
- A monster that leaves during the Damage Step ends the attack with no damage calculation, the other has not battled, and the
  Damage Step goes to its end: no Konami page read; YGOProJudge's chat agrees (asked 2026-11-23, no source cited).
  A target flipped face-up still has its flip raised then. An attacker that is no longer face-up in Attack Position at damage
  calculation (changed to Defense Position, turned face-down) can no longer attack: no damage calculation, the Damage Step ends.
  Source: Konami's Japanese Q&A on a Defense Position attacker whose permission is negated (fid 23968, OCG only), applied by
  analogy (record `defense-attacker-stops`). YGOProJudge gave two contradicting answers (DEF used; attack stops), no source.
- Konami's worked Damage Step examples (design slice 20) are not scripted as one test; each timing has its own test.

Step 7 (zones; plan in `docs/rules-core/step7/design.md`, sources in `docs/rules-core/step7/sources.md`, records in
`src/zone-sources.ts`):
- `CardInstance.slot`: the exact zone on the field, `null` off it. Main Monster and Spell & Trap Zones 0 to 4 from the controller's
  left; the two shared Extra Monster Zones are monster slots 5 and 6 as `you` see them, whoever controls the monster there; the
  Field Zone is `field` slot 0. The piles stay keyed by controller (the Extra Monster Zone monster is in its controller's
  `monster` pile), so every card written before step 7 reads the board as before. `moveCard` takes `slot`, refuses an occupied or
  out-of-range one (the shared zones are checked on both sides) and defaults to the zone the card is in, then the first free one;
  with none free it throws. `changeControl` takes a Main Monster Zone (a monster from an Extra Monster Zone goes to one, RB10).
- Choices. `legalActions` lists a Summon, a Set and an activation from the hand with `zones` (the free zones it may go to); `act`
  takes the `zone` the player names among them, or the first. Choices made while an effect resolves (`askZone`) or as the End
  Phase gives a monster back (`returnControl`, the owner choosing) are listed as `{ type: "place", zone }`; one zone is taken
  without asking. `Asking.resume` carries a choice made outside a chain.
- Queries (`src/zones.ts`): `columnOf` / `cardsInColumn` / `sameColumn` from either player's side (the Extra Monster Zones are in the
  second and fourth columns, the Field Zone in none); `pointedZones`, `pointsTo`, `coLinked`, `linkedZones`, `isLinked` from
  `facts.arrows` (turned round for the rival's monsters; arrows into Spell & Trap Zones or the middle of the Extra Monster Zone
  row point nowhere); `summonZones` (where a monster may be Summoned from where it is: the 2021 update for Fusion/Synchro/Xyz, the
  Extra Monster Zone or linked zones for a Link or face-up Pendulum Monster from the Extra Deck, Main Monster Zones for anything
  else, one Extra Monster Zone per player); `placingZones`; `pendulumZones`.
- Field Zone: a Field Spell (`facts.icon: "field"`) is activated or Set there, outside the five Spell & Trap Zones; the one
  already there is sent to the Graveyard (not destroyed) when the new one is placed; it stays after its chain.
- Pendulum Zones: a Pendulum Monster (`facts.pendulum`) with an `activation` record is activated as a Spell (Spell Speed 1, own Main
  Phase, open game state) into a free leftmost or rightmost Spell & Trap Zone, shared with ordinary Spells and Traps, and stays.
  `range: "pendulum"` effects work only there; a monster card's `field` effects only in the Monster Zone (also for continuous
  ones). From the field to the Graveyard it goes face-up to its owner's Extra Deck instead, unless its activation was negated.
- Equip Cards: `equip(duel, equipId, monsterId)` and `CardInstance.equippedTo`; `equipsOf`. An equipped Equip Spell stays after
  its chain; one that could not equip is sent to the Graveyard after it. The Equip Card is destroyed when its monster is destroyed,
  leaves the field or is flipped face-down; the link ends when the Equip Card leaves; a control change keeps it.
- Cards: Infinite Impermanence's column (`negateColumn`, `negatedWhere`, `Link.wasSet`), done; Link Spider's bottom arrow and
  Summon to the zone it points to (`facts.arrows`, `askZone`).
- `bench/zones.bench.ts` and the step 7 table in BASELINE.md.

Known limits of step 7 (what the tests do not prove):
- YGOProJudge only (asked 2026-11-23, no source cited): what a column is beyond RB10's mat; the Extra Link exception to "one Extra
  Monster Zone per player" (a Link Monster completing a co-linked path, which may run through the rival's monsters) and the rival's
  arrows opening your Main Monster Zones; a returning monster with no free zone is destroyed; an Equip Card stays equipped across a
  control change; an Equip Spell that could not equip goes to the Graveyard after the chain, not destroyed; a negated Pendulum
  activation goes to the Graveyard. Each test that rests on one says so in its title.
- Infinite Impermanence's column rests on Konami's Japanese notes and Q&A (OCG only): no TCG page read. Its "successfully negated"
  is "the monster was still face-up in the Monster Zone" (no card is unaffected by it yet). The column negates Spell & Trap Zone
  cards only (Pendulum Zones included); Trap Monsters and monsters treated as Spells are step 11.
- Summon procedures are step 8: `summonZones` is the zone rule only; Link Summons, Pendulum Summons, materials and Summons by effect
  (Link Spider moves the monster; no `summoned` event for a Summon by effect yet) come then. Moving a monster to another zone by an
  effect, and zone-locking effects, are not modelled.
- A Summon whose chosen zone was taken during its window goes to the first free Main Monster Zone (the core's reading, no page
  read; YGOProJudge says a Normal Summon's zone cannot become taken, since nothing can respond to the Summon itself); a Field Spell given to a player replaces theirs, as placing one does (RB10's one Field Spell a side).
- `moveCard` is the low-level move: it checks occupancy, not the Extra Monster Zone rules (one per player), which belong to the
  Summon (`summonZones`). Test boards may put a player in both Extra Monster Zones.
- Equip Cards: Equip Spells, with the relation set by the card's own operation, and since 2026-11-24 monsters treated as Equip
  Cards (step 11, last section); equip limits ("equip only to a monster you control") are not modelled; when the monster leaves,
  its Equip Cards are destroyed one by one after its move, not in the same batch.

Step 8 (Summon procedures as data; plan in `docs/rules-core/step8/design.md`, sources in `docs/rules-core/step8/sources.md`, records in
`src/summon-sources.ts`):
- `src/procedures.ts`. A procedure is data on the card (`CardDef.procedure`; `facts` gains `tuner`, `rank`, `link`, frame `ritual`):
  `synchro` (1 Tuner + 1 or more non-Tuners, or the card's own filters; the Levels add up, a Level changed by an effect counting
  as changed: no Konami page read, YGOProJudge's chat agrees, asked 2026-11-23, no source cited), `xyz` (2 monsters whose Level is the
  Rank, or the card's count and filter; `alternatives` for "you can also Xyz Summon this card by using...", with `transfer`), `link`
  (the card's count and filter; the materials count for the Link Rating, a Link Monster for 1 or its Rating), `fusion` (the listed
  materials; `contact` for a Fusion Monster Summoned by sending its materials away with no card effect), `ritual`. One search serves
  every kind, Tributes included: `legalActions` only asks whether one legal set of materials exists (it never builds them all) and
  lists the Summon **once per card**; after `act`, the materials are asked one at a time (`choose`, among cards that can still be
  part of a legal set; `pass` as soon as the cards chosen are enough; a card every legal set needs is taken without asking), then
  the zone (`place`). A set is legal only if it leaves the monster a zone (materials free theirs; a Link material takes its arrows
  with it).
- Actions (`legalActions` / `act`): `summon` (`normal`: also a Tribute Summon, 1 Tribute for Level 5-6, 2 for Level 7+; `special`:
  also the own procedure of an Extra Deck monster, with `positions` when the player chooses Attack or Defense Position), `set` of a
  monster (Normal Set and Tribute Set: face-down Defense Position, not a Summon, shares the turn's Normal Summon), `flip-summon`,
  `change-position` (once per monster per turn, not the turn it came to the field, not after it attacked, never a Link Monster),
  `pendulum-summon` (once a turn: the monsters one at a time, each with its zone and position, then all at once in one window).
  Every Summon a player performs is a moment of its own (step 5) that "would be Summoned" cards can answer; Tributes and materials
  are paid before it and stay paid when it is negated.
- For card effects: `specialSummon` / `askSpecialSummon` / `canSpecialSummon` (an effect puts the monster on the field: `summoned` is
  raised with `by: "effect"`, there is no window), `fusionSummon` / `canFusionSummon` (the effect says where the materials come from:
  hand, field, Deck, Graveyard, banished, the opponent's field, and where they go), `ritualSummon` / `canRitualSummon` (`equal` or
  `at-least`, a banish from the Graveyard as Tribute, a card that is the whole Tribute), `summonByEffect` / `canSummonByEffect` (the
  effect performs a Synchro, Xyz or Link Summon, or a Normal or Tribute Summon, in either player's turn), `askMaterials`, `tribute`,
  `flipFaceUp`, `flipFaceDown`, `changePosition`, `attach`, `detach`, `materialsOf`.
- Decided (design D1): "negate the Summon" cards never answer a monster an effect Special Summons (TCG PSCT part 5); they answer a
  Summon an effect *performs* when that effect was Chain Link 1, its window opening once the chain has resolved, and not from Chain
  Link 2 (Konami's Japanese Q&A 24054 and 16986, OCG only; YGOProJudge says the same for the TCG, no page cited).
- Xyz Materials are cards in the new zone `material` (`CardInstance.attachedTo`): not on the field; sent to the Graveyard when their
  monster leaves the field (or its Summon is negated), kept across a flip or a control change.
- `CardInstance.proper` / `summonedBy`: the monster was Summoned by its own procedure and the Summon succeeded. A Fusion, Synchro,
  Xyz, Link or Ritual Monster can be Special Summoned by anything else only then (`canBeRevived`: from the hand, the Deck, the
  Graveyard, banished, or face-up on the Extra Deck); a negated Summon never sets it; a face-down monster keeps it. `CardInstance.arrived`: the turn it was played onto the field.
- Events: `summoned` gains `kind` (tribute, fusion, synchro, xyz, link, ritual, pendulum) and `by: "effect"`; `moved.reason` gains
  `tributed` and `material` (`usedFor`); `position-changed`; `flipped` is also raised by a Flip Summon and by `flipFaceUp` (FLIP
  effects are trigger records on it). A negated Flip Summon destroys the monster on the field (no `negated` mark).
- Locks: `Layer` `lock` with `what: "summon"`, `ways` (`normal`, `flip`, `special`) and `only` (which monsters); `summonLocked`. It
  stops the action being offered and `specialSummon` from Summoning; a Set is never stopped.
- Link Spider now has its Link Material ("1 Normal Monster"), raises `summoned` for the monster it Summons, and asks for the position.
- `Asking` gains `done` (the player may stop choosing: `pass`) and `positions` (a `place` names the battle position);
  `askPlace` in `src/effects.ts`. `bench/procedures.bench.ts` and the step 8 table in BASELINE.md.

Known limits of step 8 (what the tests do not prove):
- Every card in the step 8 tests is made up (shaped like the blockers of the coverage notes: generic Synchro and one with a non-Tuner
  filter, Xyz with a detach cost and an alternative Summon, Link, Fusion by effect from the Deck, the Graveyard and the opponent's
  field, contact Fusion, Ritual "equal" and "equal or exceed" with a Graveyard banish and a whole-Tribute card). No real meta card
  was written; Link Spider is the only real card touched.
- YGOProJudge only (asked 2026-11-23, four sessions, no Konami page cited): "equal or exceed" refuses a Tribute that is not needed;
  materials are not given back when the Summon is negated, and the monsters stacked for a negated Xyz Summon go to the Graveyard; a
  negated Pendulum Summon sends every monster of it to the Graveyard; a Flip Summon is the monster's change of position of the turn
  and an effect's change is not. Each test that rests on one says so.
- Konami's Japanese Q&A only (OCG, no TCG page): the window of a Summon performed by an effect (24054, 16986), "one successful proper
  Summon" for revival (21297; RB10 says "properly Special Summoned first" for the TCG), a negated Flip Summon destroyed in the Monster
  Zone and a face-down monster still "Xyz Summoned" (17662).
- Not expressible yet: Tokens as materials or Tributes (step 11); effects that change how a card counts as material ("can be treated
  as a Tuner", "as 2 Tributes", Fusion substitutes, "treated as Level X for an Xyz Summon"); a Synchro Monster that needs 2 Tuners or
  none (since the second readiness slice: `Procedure.tuners`, last section); an Xyz alternative with a cost; "Tribute 3 monsters", Summons with fewer Tributes, a second Normal Summon as an action
  (since the same slice: the `extra` Summon)
  (`summonByEffect` gives one by effect); Gemini, Spirit and Union monsters; a Pendulum Summon performed by an effect; Special Summons
  and Sets in face-down Defense Position by an effect; zone locks. (Materials "shuffled into the Deck" were placed on it until the
  2026-11-24 readiness slice, which shuffles them: see the last section.)
- "Properly Summoned" is asked of a Fusion, Synchro, Xyz, Link or Ritual Monster in the hand, the Deck, the Graveyard, banished or
  face-up on the Extra Deck; a card worded "ignoring its Summoning conditions" has no way to say so yet. A monster keeps `proper`
  when it is banished face-down. A Ritual Monster, an Extra Deck monster and a card marked `summon.cannotBeNormalSummoned` are
  never offered a Normal Summon or Set.
- A monster turned face-down where it stands is a new card for what was applied to it (step 5), but it still goes back to its owner
  when a control change "until the End Phase" ends, and an attack on it goes on with no replay (RB10's replay causes): the control
  part rests on YGOProJudge's chat answer only (asked 2026-11-23, no source cited; Konami's Q&A on it is listed as not read in step 6's sources). A monster that attacked and was turned face-down and face-up again where it stands cannot attack again that turn (YGOProJudge's
  chat answer only, asked 2026-11-23, no source cited); one that left the field and came back is a new card and may.
- A change of control keeps `arrived`, so a monster taken this turn may change position by hand (no Konami page read; YGOProJudge's chat agrees (asked 2026-11-23, no source cited)). Any declared attack
  stops the change of position for the rest of the turn, in Main Phase 2 as RB10 says (the attack being negated is not looked at).
- The monster of a Summon whose zone was taken during its window goes to the first zone it may still use; with none left the Summon
  fails and the monster is sent to the Graveyard without reaching the field, its stacked Xyz Materials with it (the core's reading;
  YGOProJudge says a Normal Summon's zone cannot become taken). All monsters of a Pendulum Summon are negated together.
- A card that every legal set of materials needs is taken without asking, and the player is asked for a zone only when there are
  two or more: a choice of the core for fewer questions, not a rule. A `place` lists `positions` even when there is one (a Link
  Monster), and a monster in a Spell & Trap Zone (a Pendulum Monster in its Pendulum Zone) can be Special Summoned by an effect.
- Event matchers are also run by the listing's dry runs (costs and placements on the immutable duel), as before step 8: a matcher
  must stay a pure function.
- The listing looks for one legal material set per Extra Deck monster on every call: 0.08 ms with fifteen of them over five
  monsters and a Ritual Spell in hand (BASELINE.md). A bot that lists per node should cache "can Summon" per position; material choices cost more (a Ritual
  Summon with ten cards to Tribute among: 0.44 ms from the activation to the monster on the field).

Step 9 (bot support; design in `docs/rules-core/step9/design.md`; code in `src/bot/`, tests in `test/bot/`):
- `viewFor(duel, side)` (`src/bot/view.ts`): the Duel as `side` sees it. Cards it cannot see have the code `HIDDEN`: the opponent's
  hand, both Decks (contents and order), the opponent's face-down cards on the field, face-down Extra Deck (face-up Pendulums stay
  public) and face-down banished cards; event snapshots in `live`, `lingering`, `waiting` and the triggers being chained are masked
  too, and so is the RNG. `unknown` holds, per owner, the sorted pools those cards come from (`main`, `extra`).
- `redeal(view, seed)`: a full legal Duel consistent with the view. Each hidden card keeps its id, place and history and gets a code
  dealt from its owner's pool (seeded `createRng`); a face-down Field Zone card gets a Field Spell, a Set card a Spell or Trap, a
  face-down monster a monster. The world's RNG is reseeded.
- `actionName(duel, action)` / `findNamed(duel, step)` / `followLine(duel, steps)` (`src/bot/names.ts`): names in the fixtures' style
  ("activate terraforming", "attack big > small", "choose umi", "place 2"; "#n" for a card with several effect records; a step may add
  " @z" and " as defense"); a line is followed with `act` and stops at the first step that is not legal (`failed: { index, step, offered }`).
- `evaluate(duel, side)` / `interruptions(duel, owner, viewer)` (`src/bot/evaluate.ts`): LP, board, hand, Extra Deck and GY counts,
  and interruptions (hand traps, Set Quick-Plays and Traps, untapped Quick Effects on the field; an opponent's unknown Set card counts
  half), reading only what `viewFor` keeps.
- `chooseAction(duel, side, { level, seed, budgetMs, plan, progress, now })` / `decide(...)` (`src/bot/bot.ts`): levels `basic`
  (greedy: each action played on a re-dealt world and settled as if nobody answered), `medium` (+ the main line of the `DeckPlan`),
  `strong` (+ switching to another line sharing the steps played), `expert` (+ determinized sampling: the top 4 candidates, the line
  step with a bonus, over 8 re-dealt worlds, both players playing greedily to the end of the next turn). Never the real Duel: always
  worlds re-dealt from the view. Line `Progress` is returned and handed back (no state in the bot). A quick choice first, then the
  search within `budgetMs` (default 1,000 ms, expert 1,200 ms) with an injected clock.
- `answerRequest(request, defs)` / `rebuildDuel` / `serveBot(scope, defs)` (`src/bot/protocol.ts`) and the worker entry
  `src/bot-worker.ts` (not exported): the request carries the Duel as its setup and the actions played (plain data).
- `bench/bot.bench.ts` and `bench/bot-boards.ts`; the step 9 table in BASELINE.md (expert 308 ms on the heaviest board).

Known limits of step 9 (what the tests do not prove):
- The opponent's pool is the true multiset of its hidden cards: the bot "knows" the opponent's decklist (Forge's choice; design D1).
  A model of plausible meta lists would replace it without changing the seams.
- What a player saw and remembers is not tracked: a card searched or returned to the hand in view of both players is hidden again
  once in the hand and re-dealt like any other (event snapshots of it are masked too, so a world stays consistent). A hidden card
  whose trigger is waiting stays hidden; a world drops a waiting trigger whose card was dealt a code without it. Face-down banished
  cards of the opponent are pooled with its Main Deck cards.
- The re-deal is greedy (most restricted zones first); a pool that cannot fit every face-down zone gives a card that does not fit
  rather than failing (only an inconsistent view can lead there).
- The evaluation's weights are first guesses. A hand trap is worth its card plus an interruption, so the playout policy spends it only
  when it stops more than 5 points: it negates a monster Summoned from the Deck, not a plain search (card for card). Per-deck end
  boards are not scored. A Set card counts as an interruption even in the turn it was Set (it is there for the opponent's turn; not
  counting it would make Setting a Trap a loss), but not once its once-per-turn activation is spent.
- `basic`, `medium` and `strong` settle a move as if the opponent passed; only `expert`'s playouts let the opponent answer, and only
  with what it holds in each sampled world. Playouts are greedy (no randomness), so worlds differ only by the cards dealt. No
  mistakes or personas: today's knobs (`skill`, `answers`, `aggression`) are the app's (step 10).
- Lines: a line starts only in an open state of the side's own turn, at most one line a turn; a step that is not legal elsewhere (a
  chain to answer) waits. A step is played without checking that the board after it is not worse. When expert's sampling prefers
  another move, the line does not move on and its step is offered again.
- Determinism holds while the budget is not reached; once the budget cuts the search, the answer can depend on the machine's speed.
  A budget cut during sampling keeps only the worlds every candidate was played on (checked by reading, no test isolates it); a
  playout checks the clock before each decision and is abandoned when the time is up. A world that refuses a move (a throw from `act`)
  leaves that candidate unscored in it (defensive: no such world was found).
- Times are Node on a desktop, not a browser Worker on a tablet. The worker entry is not run in a real Worker by any test (its
  `serveBot` is, on a fake scope); the app wiring is step 10. The request replays the Duel from its setup: step 10's opening draw has
  to be part of that setup or of the actions.

Exact-list readiness foundation (2026-11-24; checklist in `docs/rules-core-spec.md`, card inventory in `docs/card-plan.md`):
- `READINESS_DECKS` / `deckReadiness` (`src/deck-manifests.ts`): exact Blue-Eyes 746021 and Sky Striker 745443 inventories with
  separate Side inventories. It reports registration only; `ready` is always `false`. Names without a code are unsupported, not
  substituted. 49 of the 60 distinct Main/Extra names are absent (11 registered since the Mulcharmy slice).
- `Facts` now has typed printed `name`, `attribute`, `monsterType`, `archetypes` and exact `mentions`. Use `printedFacts`,
  `hasPrintedName`, `belongsTo` and `mentionsCard`; they never infer from `code` or text fragments. Effective Level/ATK/DEF stay
  in `level`/`atk`/`def`; effective name, Attribute, Type and archetype changes are not modelled.
- `moved.destruction` attributes every destroyed move: `effect` (activated source snapshot, activating player and effect index),
  `cost` (source and player), `battle`, or `game-mechanic`. Scripts pass `effectDestruction(link)` or `costDestruction(ctx)` to
  `destroyCard(..., { destruction })`. MST, Solemn Judgment/Strike and the core summon/activation negators retain the negator's
  source after resolution. An `effect` or `cost` source was activated, so shown to both players: `viewFor` keeps it as it was, even
  once the card is hidden again, and a re-dealt world never gives it another code. `hasPrintedName`, `belongsTo` and `mentionsCard`
  read the definition whatever the face: a script checking a face-up card must check the face and zone itself.

Known limits of the readiness foundation:
- Registration is not completion: registered cards still need complete sourced printed identity for exact-list use.
- Whether destruction paid as a cost satisfies a card's "destroyed by card effect" wording is unsettled; the event keeps `cost`
  separate and provides no predicate. Raye, Roze and Radiant Typhoon Vision are not scripted.
- Every destroyed move needs its attribution: `move` throws on `reason: "destroyed"` without `destruction`, and on a `destruction`
  without that reason. The built-in Equip and battle moves pass `game-mechanic` and `battle`. `deckReadiness` counts a card as
  registered only when its printed name matches the manifest, and the manifests are frozen at runtime.

Ghost Ogre & Snow Rabbit and Effect Veiler (2026-11-24; `src/cards/ghost-ogre-snow-rabbit.ts`, `effect-veiler.ts`; Konami pages read 2026-11-24, texts and notes quoted in each file's sources):
- Ghost Ogre is two records, one per place (`range: "hand"` and `"field"`), sharing the printed once-per-turn by name through `once.key`.
  It answers the top link only when its card was on the field when activated and the effect is not a card activation (`type` is not
  `activation`): a monster's effect in the Monster Zone, or an effect of a Spell/Trap already face-up (Konami's notes, OCG; a
  monster treated as an Equip Card is read by its place: tested since step 11's monster equips, `test/rules/monster-equips.test.ts`,
  on YGOProJudge's answer). It destroys with
  `effectDestruction(link)`, it does not negate. The answered card is destroyed while it has not left the field since it was
  activated (`CardInstance.fieldEntries` unchanged): a monster turned face-down in the chain still is (Konami Q&A fid 6334), and so
  is one turned face-down and up again, or whose control changed; a card that left the field, even to come back to the same zone, is
  not, and nothing happens (Konami's notes).
- Effect Veiler: Quick Effect in the hand, in the opponent's Main Phase 1 or 2 only; the cost is sending itself. Targets a face-up
  Effect Monster the opponent controls (a monster with effect records, or a test card printed `effect: true`; not a Normal Monster (Konami Q&A fid 12318 on a Dual Monster treated as Normal; the core has
  no Dual state, so the Normal flag stands for it), and not already negated. Infinite Impermanence uses the same Effect Monster test. The face-up and not-already-negated limits rest on
  YGOProJudge's answers only (asked 2026-11-24, no source cited; the same limit is written in Konami's notes for Infinite
  Impermanence). A face-down monster is treated as not a legal target (YGOProJudge only).
- Limits: effective Level, Attribute, Type or name changes are not modelled.

Choices at activation and resolution, Deck operations, Life Points; Raigeki, Upstart Goblin, Lightning Storm (2026-11-24; tests in
`test/rules/choices.test.ts`, `test/rules/deck-operations.test.ts`, `test/cards/{raigeki,upstart-goblin,lightning-storm}.test.ts`):
- **Modes** (`EffectRecord.modes`, `EffectMode`): "Activate 1 of these effects". Each mode has its own `condition`, `target` /
  `targetCount` / `targetGroups`, `declare`, `categories` and `operation`; the record keeps the shared `condition`, `cost` and `once`
  (a record with modes and its own `operation`, `target` or `declare` throws when read). `legalActions` lists one activation per legal
  mode and target combination (`Action.mode`, `Way.mode`); the mode is frozen on the link (`Link.mode`) with its categories, and the
  link resolves that mode's operation even if its condition no longer holds. Bot names: `activate card :2` (1-based).
- **Declarations** (`Declaration`: `name`, `attribute`, `type`, `level`; `ATTRIBUTES`, `MONSTER_TYPES`, `cardNames(duel)`): at activation
  with `EffectRecord.declare` (one action per value, `Action.declared`, frozen as `Link.declared`; bot names `=VALUE`), or while the effect
  resolves with `askDeclare` (a new `declare` action, the only action added).
- **Optional and "up to N" at resolution** (`src/choices.ts`): `askUpTo(duel, player, from, { min, max }, then)` picks one card at a time
  through `choose`; once `min` are picked `pass` stops (with `min: 0`, declines). `askMay(duel, player, card, yes, no?)`: "you can ...",
  accepted by choosing the effect's own card, declined with `pass`.
- **Coupled targets** (`EffectRecord.targetGroups`, `TargetGroup`, `sameCount`): groups chosen from their own candidates, a card never in
  two groups, every group the same size with `sameCount`; only legal combinations are built. `Link.targetGroups` keeps the group sizes and
  `targetGroupsOf(duel, link)` reads the targets back, group by group, dropping those that moved. The split travels with the action
  (`Action.groups`, `Way.groups`, shown as `{1,1}` in names): two splits of the same cards are two different actions. An effect with
  `modes` throws if its record also sets `categories`, `targetGroups` or `sameCount`, which each mode carries instead.
- **Deck operations** (`src/deck.ts`): `shuffleDeck` (Fisher-Yates with the Duel's seeded RNG; the RNG state moves on, so a replay
  shuffles the same way), `shuffleDecksOf`, `pickRandom(duel, from, count)` (random hand or Deck picks through the same RNG),
  `excavate(duel, side, n)` (the top N revealed, left on top), `askBottomOrder(duel, player, ids, then?)` (the player picks the order one
  card at a time; the last picked is the bottom card). Step 8's limit is fixed: materials "shuffled into the Deck" by a contact Fusion or
  `fusionSummon({ to: "deck" })` now shuffle each owner's Deck.
- **Reveal** (`revealCards(duel, player, ids)`, a cost or part of an operation): a public `revealed` event, and `Duel.revealed`. `viewFor`
  shows a revealed card to both players while it stays where it was revealed (same `moves` and zone; in a Deck, the same place in it), so a
  re-dealt world keeps it; a shuffle of that Deck hides it again.
- **Life Points**: `gainLp` (raises `lp-gained`). Damage by an effect is `loseLp`, the same loss as battle damage (0 LP decides the Duel);
  paying LP stays `payLp`.
- Cards: **Raigeki** (cid 4343), **Upstart Goblin** (cid 4895: no once-per-turn on its text), **Lightning Storm** (cid 14876: modes, its
  "no face-up cards" condition, "activate 1 per turn"), each with its Konami EN/FR text and Japanese notes, registered in `CARD_DEFS` and in
  the Sky Striker 745443 manifest.

Known limits of this slice (what the tests do not prove):
- Only YGOProJudge backs (asked 2026-11-24, no source cited): Lightning Storm's mode with nothing to destroy cannot be chosen, its condition
  is not checked again at resolution, and Pendulum Monsters in the Pendulum Zones are among the "Spells and Traps" destroyed; Upstart
  Goblin cannot be activated under Droll & Lock Bird's lock (`requiresAddToHand`). Konami's notes are OCG only; no TCG page was read.
- A mode's `condition` and a `declare` list are read on the Duel before the cost is paid (like the record's condition), and checked again
  at `act` on the same Duel; a cost that would change which modes are legal is not modelled.
- "Declare 1 card name" offers the printed names of the Duel's own definitions (`cardNames`), not every card that exists: a name no card of
  the Duel has cannot change how a card resolves, but a bluff is not possible.
- `askMay`'s "yes" is `choose` of the effect's own card (no new action); `askUpTo` takes every card left without asking when they are no
  more than the minimum still needed. Ordering for "the top of the Deck in any order" is not written (only the bottom).
- Reveal memory is per card and place: a card revealed in the hand stays known only while it stays in the hand; a Deck card revealed stops
  being known once anything above it moves (conservative: forgetting is the safe side). What the opponent saw before (a card searched,
  then shuffled back) is still not remembered (step 9's limit).
- `gainLp`'s event has no answering card yet; Konami's Q&A on a card that answers Upstart Goblin's LP gain (fid 23121, Performapal Life
  Swordsman) was not opened. The `fusionSummon({ to: "deck" })` shuffle has no test of its own (the contact Fusion one is tested).
- Raigeki's and Upstart Goblin's other Q&A entries concern cards the core does not have (titles read only).

Delayed effects, lingering operations, restrictions, protections; Ash Blossom vs draws; Mulcharmy Fuwalos and Purulia (2026-11-24;
tests in `test/rules/{restrictions,protections,delayed,watches}.test.ts` with the made-up cards of `test/rules/readiness-fixtures.ts`
(every code starts with `fixture-`), and `test/cards/{mulcharmy-fuwalos,mulcharmy-purulia,ash-blossom-joyous-spring}.test.ts`):
- **Delayed effects** (`src/delayed.ts`: `delay(duel, link, { due, card?, mandatory, condition?, apply })`, `Duel.delayed`, `Delayed`,
  `nextPhaseTurn(duel, phase, whose?)`, `delayedDestruction(self)`): "during the End Phase of this turn ...", "during your opponent's
  next End Phase ...", "at the start of the next Standby Phase ...". They live in the Duel, so they survive their source leaving the
  field; `card` ties one to a card as it was (a card that moved is a new card: nothing is applied). Several resolved copies leave one
  each. Nothing is done because the phase began: in its phase, with the game state open, the player whose effect it is applies it with
  the new `apply` action (`{ type: "apply", card, delayed }`, bot name `apply <code>`), which starts no chain and is followed by a
  trigger point and the turn player's priority. The turn player holds priority first; the other player gets theirs when the turn
  player passes. While a player holds a mandatory one that is due, `pass` is not offered to them in an open game state, so the phase
  cannot end before it is applied; an optional one is gone when the phase ends. `condition` is read when it would be applied ("if the
  number of cards in your hand is more than ..."): while it fails nothing is offered or owed. `apply` may ask its player for choices.
- **Lingering operations** (`watch(duel, link, { until, event, apply })`, `Duel.watches`): "for the rest of this turn, each time your
  opponent Special Summons ..., immediately draw 1 card". Applied inside `raiseEvent`, so at once, also while a chain resolves, with no
  Chain Link; events of one batch count once (a `summoned` event now carries `player` (who Summoned), `from` and `batch`; every Summon
  the core performs gives the three); each resolved copy applies on its own. Konami's notes on Mulcharmy Fuwalos (OCG only).
- **Drawing by an effect**: `drawCards(duel, side, n)` (one batch; nothing while `drawLocked`; a player who must draw more than the
  Deck holds loses, `lose` in `src/life.ts`). Pot of Greed and Upstart Goblin now draw through it; Upstart Goblin attempts its draw
  even when the Deck was emptied in response (its controller loses, and the opponent gains nothing). `EffectRecord.requiresDraw`: a
  card that only draws at once (Pot of Greed, Upstart Goblin) is not offered while `drawLocked` (a `draw` lock or an `add-to-hand`
  lock); a search (`requiresAddToHand`) is not stopped by a `draw` lock, and the Mulcharmy monsters set neither (YGOProJudge only).
- **A Duel decided while a chain resolves ends there** (`resolveChain`, `answer` in `src/chain.ts`): once `winner` is set by a link
  (or by the answer to a choice it asked), nothing more is asked, the links below are not resolved and no card is swept;
  `legalActions` is empty and `act` refuses everything.
- **Restrictions** are locks, in the one model of `src/modifiers.ts` (`LockKind` gains `activate`, `draw`, `banish-from-graveyard`,
  `attack`, `attack-directly`; the layer gains `stops(duel, attempt)` for `activate`): `activationLocked` is asked by `activationWays`
  (the listing and trigger effects alike), `attackLocked` by the attack listing, `banishLocked` by every move from a Graveyard to
  banishment (`canBeBanished` for a cost to ask first), `drawLocked` by `drawCards`. A lock is not a negation: what is on the chain
  still resolves. Durations: `duel.turn.number` ("this turn"), `untilEndOfNextTurnOf(duel, player)`, `FOREVER` ("for the rest of this
  Duel"; a lasting modifier never needs its source). `CardInstance.specialSummoned` tells "Special Summoned monsters" (set by every
  Special Summon the core performs, kept while the card stays on the field). `Duel.activations` lists the turn's activations, negated
  ones included ("the turn you activate this effect, ..."). The locks of a Duel are read once per Duel value (`WeakMap`), so the
  listing does not scan the field for every effect it offers.
- **Protections** are a `protect` layer of the same model: `against` `target`, `effect-destruction`, `battle-destruction` or `effects`
  ("unaffected"), `from` which effects (`fromOpponent`, `fromTraps`, `fromOtherCards`; default all), `firstEachTurn` ("the first time
  each would be destroyed each turn", `Duel.spared`). Who asks: targets are filtered in `activationWays` and checked again at
  activation (`canBeTargetedBy`); every destruction by an effect (`destroyCard`, `moveCards` with `effectDestruction`) and the battle's
  damage calculation ask `spareDestruction`; a move done by an effect passes `effect: link` to `moveCard` / `moveCards` and is not done
  to a card that is `unaffectedBy` it; `takeControl` and `negateCardEffects` take the effect as their last argument; `negateActivation`
  and `negateEffect` do not reach a link whose card is still face-up on the field and unaffected by the negating effect; stat and
  negation modifiers from an effect the card is unaffected by are dropped from every query (`Modifier.by`, or a continuous effect's
  own card). Costs, Summon procedures, Tributes and battle pass no effect and are never stopped. `anyShield(duel)` (cached per Duel)
  keeps every one of these questions at one lookup when no protection is in play.
- **Cards moved at the same time are judged together** (`moveCards`): locks and protections are read for the whole group on the board
  before any of its cards has moved, then the others move in order. Raigeki destroys the monster that protects the others and not
  the monsters it protects, wherever it stands; a "first time each turn" protection is used once per card it spared (the core's
  reading of "at the same time"; YGOProJudge agrees, no source cited).
- **The monsters of one Summon arrive together** (`landSummon`): all are placed and marked, then each one's `moved` and `summoned`
  events are raised, so a watch ("immediately draw 1 card") and trigger conditions read the board with the whole group on it.
- **Skill Drain and a monster's own "unaffected" effect** (`appliedFirst` in `src/modifiers.ts`): whichever began to apply first
  wins. Skill Drain already face-up when the monster comes face-up negates it, its "unaffected" effect included, until Skill Drain
  stops applying; a monster face-up first is unaffected by a Skill Drain activated later. Konami's Japanese Q&A fid 23897 (OCG only),
  and YGOProJudge's answer. Applied to any continuous negation read from a card on the field (an inference beyond Skill Drain); not a
  general rule of order for protections.
- **Attribution audit of the registered cards** (which effect moves or changes a card, so "unaffected" can be asked): Shrink
  (`by: link`, and nothing is applied to an unaffected target), D.D. Crow's banishment (`effect: link`) and Infinite Impermanence's
  column (`negateColumn(..., link)`: a card still in the column that is unaffected by it is not negated; `isNegatedLasting` and
  `negatedWhere` read it) are now attributed, like the destructions (Raigeki, Lightning Storm, Mystical Space Typhoon, Ghost Ogre,
  the Solemn cards) and the negations (Effect Veiler, Infinite Impermanence, Ash Blossom) before. Not attributed: the cards a player
  adds or returns from their own Deck or hand (Terraforming's search, the draws of `drawCards`, Mulcharmy's End Phase shuffle) and
  Droll & Lock Bird's lock (a lock applies to players, not to cards).
- Sources (Konami's Japanese Q&A, OCG only, `src/readiness-sources.ts`): "cannot be targeted" is applied to the player who targets
  (fid 14200); an unaffected monster stays a target and the effect is not applied (fid 13714); an unaffected monster can be sent to
  the GY as a cost (fid 24398); a Counter Trap does not negate the activation of a monster on the field that is unaffected by it, and
  does once the monster left as its own cost (fid 12428); Skill Drain against a monster's own "unaffected" effect, in both orders
  (fid 23897).
- **Ash Blossom & Joyous Spring answers draws** (`ASH_BLOSSOM_ANSWERS` now has `draw`): Konami's Q&A fid 21685 (page dated 2026-09-25)
  lets Ash be chained to Knightmare Phoenix only when it was co-linked at activation, the only case in which its effect includes
  "draw 1 card". Its notes (the whole Chain Link is negated) are cited too. Pot of Greed, Upstart Goblin and the Mulcharmy monsters
  are answered.
- **Mulcharmy Fuwalos** (cid 20500) and **Mulcharmy Purulia** (cid 20206), `src/cards/mulcharmy*.ts`: Quick Effect in the hand while
  their player controls no cards (cost: discard), a watch for the draws (Fuwalos: the opponent's Special Summons from the Deck or Extra
  Deck; Purulia: their Normal or Special Summons from the hand, never a Set), a mandatory delayed effect for the End Phase hand limit
  (random cards by the Duel's RNG, then the Deck is shuffled), and the "1 other Mulcharmy monster effect" sentence as part of the
  activation condition, counted on `Duel.activations`. Each has Konami's EN and FR text (read once each), its Japanese notes and
  Q&A fid 7813 (a negated activation counts), Fuwalos also fid 24217 (the opponent Summons from the Fuwalos player's own Deck).

Known limits of this slice (what the tests do not prove):
- Only YGOProJudge backs (asked 2026-11-24, no source cited; no Konami page found): that delayed effects start no chain in general
  (Konami's notes say so for Mulcharmy only), that a delayed effect is not applied to a card that moved, the End Phase order (turn
  player first, each player ordering their own), "until the end of your next turn" as a turn count, "cannot be destroyed by card
  effects" not stopping a send to the GY or a banishment, the "first time each turn" protection being per card, shared by battle and
  effects, and new for a card that moved, a non-targeting effect reaching a card that cannot be targeted, and Ash Blossom answering
  a Mulcharmy activation (Konami's Q&A covers draw effects in general, not this card).
- **YGOProJudge disagrees with the Konami page followed here**: it answered that an activation of an unaffected monster on the field
  is negated by a Counter Trap (the monster only escaping the destruction); Konami's Japanese Q&A fid 12428 says the activation is
  not negated. The core follows Konami's page (OCG); if TCG practice differs, `shielded` in `src/chain.ts` is the one place to change.
- End Phase ordering is simpler than a real End Phase: a player cannot pass in an open game state while they owe a mandatory delayed
  effect, so the turn player cannot let the opponent apply theirs first; control taken "until the End Phase" still goes back when the
  phase begins (step 6), before anything else. "At the start of the Standby Phase" is "during" it. A delayed effect about a card that
  is face-down, or protected when it is applied, is simply spent.
- A watch's `apply` must not ask for a choice. For a Summon it is applied once the whole group is on the field (`landSummon`); for
  cards moved together by `moveCards` (a draw of several cards, "destroy all") the events are still raised card by card as each one
  moves, so a watch on `moved` or `added-to-hand` is applied between the cards of the batch. "Immediately" inside an operation means
  at the `raiseEvent` call.
- "Unaffected" is asked when an effect would be applied. Moves are only stopped when the script passes `effect: link` (see the
  attribution audit above for the registered cards; the older fixtures do not). A lasting modifier added without `by` still reaches an
  unaffected card. A card that becomes unaffected keeps what was applied to it before only if that modifier has no `by`: this also
  holds for a lasting negation applied while Skill Drain was negating the monster's own "unaffected" effect, which stops reaching the
  monster once Skill Drain is gone (no page read; arguably that negation should keep negating the immunity). "Unaffected by activated
  effects" (as opposed to all effects) is not told apart. A protection never looks at the face or zone of the card by itself: the
  card's `affects` says which cards it reaches.
- The Skill Drain ordering compares the moments the two cards came face-up on the field: a conditional "unaffected" effect counts
  from then, not from when its condition began to hold, and a Skill Drain is taken to apply from the moment it is face-up (its
  activation has not resolved yet during its own chain). Other orderings between continuous effects are not modelled.
- Simultaneous destruction by a script that loops over `destroyCard` (the made-up `fixture-destroy-all`) is still sequential: only
  `moveCards` judges the group together. The registered cards that destroy several cards use `moveCards`.
- A Duel decided outside a resolving chain (a watch's draw when a Summon succeeds, a delayed effect) still runs the step that
  follows (the trigger point); nothing is offered afterwards (`legalActions` is empty), but `building` or `waiting` may be set.
- `banish-from-graveyard` stops the move silently: a cost that banishes must ask `canBeBanished` first (no real card does yet).
  That a card that only draws cannot be activated under a `draw` lock (`requiresDraw`) rests on YGOProJudge only (asked 2026-11-24,
  no source cited).
- `specialSummoned` is set by the core's Summons only; a fixture that moves a monster to the field and raises `summoned` by hand
  leaves it `false`, and its event has no `player`, `from` or `batch`.
- The "1 other Mulcharmy" sentence is read as "at most 2 Mulcharmy monster effects per player and turn", which is the same thing while
  every Mulcharmy monster carries the sentence. The other entries of both cards' Q&A lists (Maxx "C" with other cards, Magical Hats,
  PSY-Framegear Gamma, a discard cost while cards are banished instead of sent to the GY) were not opened: their cards are not in the core.
- The Mulcharmy draw in the middle of a Summon negation window is not a question: nothing is drawn before the Summon succeeds
  (the `summoned` event), which is also what makes a negated Summon draw nothing (YGOProJudge's lead; follows from the event model).
- Bot: `viewFor` keeps `delayed`, `watches`, `spared` and `activations` as they are (their sources were activated, so both players
  know them); a re-dealt world keeps them and plays on. The evaluation does not value a pending delayed effect or a watch.

Attack permissions, Tuner counts, an additional Normal Summon, simultaneous Special Summons, a replaced effect (2026-11-24, second
readiness slice; mechanics only, no real card written; tests in `test/rules/{extra-attacks,direct-and-defense-attacks,synchro-tuners,
extra-normal-summon,summon-together,effect-replacement}.test.ts` and `test/bot/second-readiness.test.ts`, with the made-up cards of
`test/rules/{attack,summon-extras,replace}-fixtures.ts` (every new code starts with `fixture-`); records in `src/attack-sources.ts` and
`src/second-readiness-sources.ts`):
- **Attack permissions** are a layer of the one modifier model (`{ kind: "attack", allows }`, `AttackAllowance`, `attackAllowances`),
  given by a card's Continuous Effect or left by a resolved effect, so a negated or absent source no longer allows:
  - `times` ("can make a second attack during each Battle Phase": `count: 2`; `monstersOnly` for "up to 2 attacks on monsters"),
    `all-monsters` ("can attack all monsters your opponent controls, once each"), `directly` ("can attack directly"), `in-defense`
    ("can attack while in face-up Defense Position", DEF used as ATK for damage calculation).
  - `attackAgain(duel, id)` for "this card can attack again in a row" (`Duel.again`): one more attack, as the next attack of the turn;
    used up when declared, lost when another monster attacks or the monster is no longer face-up in the Monster Zone. It is granted
    only to a monster that has declared an attack this turn ("again": on one that has not, nothing happens, so its first attack
    never uses it up), and one granted during an attack that is then replayed is kept when the same monster makes that attack again.
    `Once.times` makes a once-per-turn limit a count ("you can use this effect twice per turn"); effects that share a `key` must
    declare the same `times` (a definition error is thrown when a listing reads such a limit).
  - `Duel.attacked` is now the list of the turn's attacks (`AttackMade`: the attacker as it was, its target, whether a direct attack
    was declared in it, whether it used "again"): a monster with several attacks is there once per attack, and an attack replayed
    and made again by the same monster stays one entry (its "direct attack declared" mark stays too). `canChangePosition` reads it as
    before.
  - A direct attack is listed beside the attacks on monsters (`{ type: "attack", target: null }`, named "attack X directly" as
    before); the `attack-directly` lock removes only that action, the `attack` lock all of them.
  - Read again before the Damage Step: a second or later attack whose permission is gone ends there; a Defense Position attacker
    whose permission is gone ends there with no replay; a direct attack on a player who controls monsters whose permission is gone
    is replayed, and so is a direct attack by a monster that "cannot attack directly" since it was declared (the `attack-directly`
    lock, whatever the opponent controls; the replay offers no direct attack). In the Damage Step: a negated extra-attack permission
    changes nothing (damage calculation is done); a negated Defense Position or direct-attack permission, or a "cannot attack
    directly" lock that began to apply during a direct attack, ends the Damage Step with no damage calculation.
- **Synchro Summons with a Tuner count other than one**: `Procedure.tuners` (`{ min: 2 }` for "2+ Tuners", `{ min: 2, max: 2 }` for
  "2 Tuners"), beside `nonTuners` and the two filters; with none, exactly 1 Tuner as before. A Tuner never fills a non-Tuner's place.
- **A Normal Summon in addition to the Normal Summon/Set** is a permission for a player (`{ kind: "permit", what: "normal-summon", who,
  only }`: a Continuous Effect such as Mausoleum of White's, or a lasting modifier), not an effect that Summons: `legalActions` lists
  it as a `summon` action marked `extra: true` (named "summon X additional"), beside the turn's own Normal Summon when both are open
  (the player says which they use), in the player's own Main Phase with the game state open. It is a Normal Summon (a Tribute Summon
  for a Level 5 or higher monster, never a Set), it opens the Summon's window like any other, and it uses `Duel.extraNormalSummoned`,
  not `normalSummoned`: one additional Normal Summon per turn in all, whatever gives it, also when it is negated. `extraNormalSummon`
  is the query; a card that gives the permission by an activated effect reads `duel.extraNormalSummoned` in its condition.
- **Monsters Special Summoned at the same time** by one effect: `canSpecialSummonTogether(duel, player, ids, { leaving })` (all of
  them or none: no "2 or more at the same time" lock, each one Summonable, a zone for each, the zones of a cost's monsters counted as
  free), `specialSummonTogether(duel, player, picks)` (with `{ kind }`, each monster is properly Summoned only if that is its own
  procedure) and `askSpecialSummonTogether(duel, player, ids, { then })` (the player gives
  each monster its zone and position in turn; a zone is offered only if it leaves the others one). All are placed, then their events
  are raised as one batch (`landSummon`), so "each time ... Special Summons" counts the group once and every "if Summoned" trigger
  waits for the same trigger point. If they cannot all be Summoned when the effect resolves, none is.
- **"Neither player can Special Summon 2 or more monsters at the same time"** is the lock `summon-together`
  (`summonTogetherLocked`): `canSpecialSummonTogether` refuses two or more (so the effect cannot be activated, and Summons nothing if
  the lock began in its chain), and a Pendulum Summon is then of one monster.
- **Replacing an effect on the chain**: `replaceEffect(duel, index, operation, by)` sets `Link.replaced`; when that link resolves,
  the new operation runs instead of the card's own, with the same link: it is still the effect of the card and player that activated
  it (who makes its choices, and whose destruction it is), with its cost paid, its once-per-turn use spent and its place in
  `Duel.activations`. The card's definition is never touched. It is not applied to the monster, so an "unaffected" monster's effect
  is replaced too; a link negated before it resolves does neither effect; if the replacing effect's activation is negated, nothing
  is replaced.
- Bot: no new action type, one new mark (`extra` on `summon`) with its stable name; `viewFor` and `redeal` keep `attacked`, `again`,
  `extraNormalSummoned` and a link's `replaced` (all public), and a re-dealt world plays on from them.
- Speed: whether any attack permission or protection exists is read once per Duel value (`layerKindsNow`), so the Battle Phase
  listing reads no modifier when there is none (BASELINE.md).

Sources of this slice (read 2026-11-24): RB10's glossary line on direct attacks; Konami's TCG card texts of Blue-Eyes Ultimate
Spirit Dragon, Mausoleum of White, Blue-Eyes Spirit Dragon and Prototype Sky Striker Ace - Amatsu; Konami's Japanese notes and Q&A
(OCG only): attacks on all monsters (fids 12701, 16016), several attacks negated (11046), Neo Blue-Eyes Ultimate Dragon's notes,
Sky Striker Ace - Hayate's notes, Defense Position attackers (24407, 23968), Mausoleum of White's notes and fid 24288, Sky Striker
Ace = Zero's notes, Blue-Eyes Spirit Dragon's fid 18176, Amatsu's notes and fids 24166, 24165. Also opened and not cited: fids 17195,
23993, 13862 (Hayate's list), 14252, 18129, 24189, 24150, 19892, 24393, 24164.

Known limits of this slice (what the tests do not prove):
- No real card is written: Hayate, Zero, Amatsu, Mausoleum of White, the Spirit Dragons, Tyrant Dragon, Neo Blue-Eyes Ultimate
  Dragon and Ancient Fairy Life Dragon still owe their other clauses, printed identity, French text and tests.
- Only YGOProJudge backs (asked 2026-11-24, six chats, no official source cited): "in a row" means the next attack declared; "up to 2
  attacks on monsters" gives nothing after a direct attack and no direct second attack; both attacks of "a second attack" may be
  direct; a replayed attack made again is the same attack; a direct-attack permission lost in the Damage Step ends the attack with no
  damage calculation; a "cannot attack directly" effect that begins to apply during a direct attack causes a replay in the Battle
  Step and ends the attack with no damage calculation in the Damage Step (a seventh chat, same day); a replaced link that is negated does neither effect, and a negated replacing effect leaves the original; a
  Pendulum Summon of one monster under the "2 or more" lock. YGOProJudge also answered that only one additional Normal Summon is made
  per turn across such effects and that the player declares which Summon they use: there Konami's notes say the same (OCG).
- **A YGOProJudge example not followed**: it counted Double Summon among the "in addition to your Normal Summon/Set" effects (2
  Summons in all with Mausoleum of White). Konami's Q&A fid 18129 gives 3 (Double Summon is worded "2 Normal Summons/Sets this turn",
  not "in addition"). Double Summon's wording is not modelled; nothing in the core rests on that example.
- The extra-attack Q&A pages are about Continuous Effects on other cards (Mementoal Tecuhtlica and lists that name Blue-Eyes Tyrant
  Dragon); the core applies them to any `all-monsters` / `times` permission. "Once each" forgets a monster that left and came back (a
  new card). A `times` and an `all-monsters` permission on one monster each open their own attacks; two `times` permissions do not
  add up, the widest applies (two "a second attack" give two attacks in all): no page read. An attack made "again in a row" counts
  among the attacks of a `times` permission. "Attack again in a row" given to a monster that has not attacked this turn does
  nothing: the core's reading of the wording, no page read.
- A "cannot attack" lock (not "directly") that begins to apply during an attack on a monster does not stop that attack: only the
  listing and a direct attack in progress read it. With `{ kind }`, `specialSummonTogether` still marks every monster of the group
  as Summoned by that kind (`summonedBy`), also one whose own procedure it is not.
- Restrictions on attack targets ("your opponent cannot target other monsters for attacks", "must attack if able", "the controller
  chooses the attack target") are not modelled (Hayate's Q&A fids 23993 and 13862 say which of them leave a direct attack open).
- A direct attack by permission that meets a new monster on the opponent's side is replayed like any attack (RB10's replay causes;
  no page read for this case). The `attack-declared` event does not say whether the attacker is in Defense Position (a card reads the
  attacker's position: Konami's Q&A fid 14252, Mirror Force).
- The additional Normal Summon is one per turn for the turn player whatever its source (OCG notes; the TCG text says "you can only
  gain this effect once per turn", read the same way by YGOProJudge). Which effect gave it is not recorded on the Summon; a card that
  would care ("if Summoned this way") cannot ask. A lock on Normal Summons stops it like any Normal Summon.
- Simultaneous Summons: "as many as possible" under the "2 or more" lock (one monster: Konami's Q&A fid 24150) is for the card to
  write (Summon one with `specialSummon`); monsters Summoned to both players' fields at once, Tokens, and a group Summoned face-down
  are not written. `canSpecialSummonTogether` judges zones on the board as it is, minus `leaving`; a cost that frees a zone must say
  so. The players' choice order (zone and position per monster, in the order the effect lists them) is the core's.
- A replaced effect keeps the `categories` and targets frozen at activation: nothing can answer a link after the chain started to
  resolve, so no test reads them. The ATK "before it left as its cost" of Amatsu's condition (Konami's Q&A fid 24164) is the card's to
  read (the link holds the card as it was when activated, not its ATK then). A choice the replaced effect asks is its own player's.
- The Battle Phase still has no Start Step or End Step window, and "each Battle Phase" is the turn's one Battle Phase.

Step 11, monsters treated as Equip Cards only; effects activated in the Graveyard; Wishes for Eyes of Blue (2026-11-24; `src/equips.ts`,
records in `src/equip-sources.ts`, tests in `test/rules/{monster-equips,monster-equips-review,graveyard-effects}.test.ts` with the made-up cards of
`test/rules/equip-fixtures.ts` (every code starts with `fixture-`), `test/bot/monster-equips.test.ts` and
`test/cards/wishes-for-eyes-of-blue.test.ts`). Tokens, counters, dice and monsters treated as Continuous Spells are still open: the two
exact lists do not need them.
- **A monster equipped to a monster is its card in a Spell & Trap Zone** (RB10: "equipped monsters are considered to be Equip
  Spells"): face-up, in a zone of the player whose effect equipped it, with `CardInstance.equippedTo` naming its monster, the relation
  step 7 gave Equip Spells (`equipsOf`; destroyed and sent to the Graveyard when its monster is destroyed, leaves the field or is
  flipped face-down; kept across a control change of its monster). No new zone and no new pile: what reads the Spell & Trap Zones finds
  it (Mystical Space Typhoon targets it, Infinite Impermanence's column negates it), what reads the Monster Zones does not.
  `cardTypeOf(duel, card)` says what a card is where it is (`"spell"` for a monster card in a Spell & Trap Zone, a Pendulum Monster in
  its Pendulum Zone included); `isEquipCard`. What is printed on the card is still its own (`printedFacts`,
  `belongsTo`: "a Fusion Monster equipped to it" is asked of the Equip Card's printed frame).
- **Its monster effects do not apply** while it is there (a monster card's `field` range is the Monster Zone). `range: "equipped"` is
  for an effect a card has "while this card is equipped to a monster" (Ignition, Quick, Trigger or Continuous): listed, triggered and
  read only then. Such an activated effect is the effect of a Spell already face-up on the field: Ghost Ogre & Snow Rabbit answers it
  and destroys the Equip Card, and the negation of the card's effects reaches it (`hitByCardNegation`).
- **Equipping by an effect**: `equipMonster(duel, id, monsterId, { player, slot?, by?, gives? })`, `askEquipMonster` (the player
  chooses the zone when more than one is free; nothing is asked for a card that cannot be equipped or moved),
  `canEquipMonster(duel, player, id, monsterId)` for the activation condition: a monster card from the Extra Deck, the Deck, the hand,
  the Graveyard, banishment or a Monster Zone; a face-up monster to equip; a free Spell & Trap Zone of `player`. Otherwise nothing
  happens and the card stays where it was. `by`: the effect that equips; a card unaffected by it is not moved. The monster it is
  equipped to is not asked: the effect is not applied to it (Konami's notes on Wishes for Eyes of Blue). `moveCard` takes
  `equippedTo` (with zone `spell`, face-up), so the `moved` event carries the relation.
- **What the Equip Card gives** ("as an Equip Spell that gives it 400 ATK"): `gives`, layers of `src/modifiers.ts` that reach the
  monster it is equipped to, kept in `Duel.modifiers` with `Modifier.equip` (the Equip Card's id). They are that card's own effect, a
  Spell effect: not applied while its effects are negated, not applied to a monster unaffected by Spell effects (`fromSpells`), and
  removed when the card stops being equipped (it leaves, or its monster does). Equipped with nothing given, it does nothing.
- **It stays with its monster** (RB10: "cannot be moved to a different target"): `equip` and `equipMonster` do nothing to a monster
  card that is already an Equip Card.
- **Status**. A monster that becomes an Equip Card is no longer a "Special Summoned monster" (`specialSummoned` is now kept in the
  Monster Zone only), its own Equip Cards are destroyed and its Xyz Materials sent to the Graveyard (it left the Monster Zone). It
  keeps `proper`: equipped after a proper Summon, it can be Special Summoned later; equipped straight from the Extra Deck, it cannot
  be, as an Equip Card or from the Graveyard (`canBeRevived` now asks it of a card in a Spell & Trap Zone too: an Equip Card, and an
  Extra Deck Pendulum Monster in a Pendulum Zone, which before step 11 was asked nothing).
- **Never in a Pendulum Zone**: an Equip Card in the leftmost or rightmost Spell & Trap Zone is not a Pendulum Scale (`pendulumZones`,
  the `pendulum` range, the Pendulum Summon). **Not a monster for materials**: `fusionSummon` and `ritualSummon` take from their pool
  only what is a monster where it is (`cardTypeOf`), so not an Equip Card nor a Pendulum Monster in a Pendulum Zone, even if the
  card's pool names the whole field. What can be Summoned is still read from the printed card (an Equip Card that was properly
  Summoned can be Special Summoned from its zone).
- **A Summon procedure that uses an equipped card**: `Procedure` `fusion` gains `alternatives` (`FusionAlternative`: `how: "tribute"`,
  `materials`, `check`, `condition`), another way printed on a Fusion Monster of Special Summoning it from the Extra Deck with cards
  that are not its Fusion Materials ("or Special Summoned from your Extra Deck by Tributing 1 [monster] equipped with a Fusion
  Monster"; the filter asks `equipsOf`). It is an action like a contact Fusion (`summon`, `how: "special"`; the materials, then the
  zone, are asked): the monsters are Tributed (`moved.reason: "tributed"`, `usedFor: "fusion"`), then the Summon is attempted in its
  window, as a proper Summon that is not a Fusion Summon (`summonedBy` stays `null`). An effect that Fusion Summons reads the printed
  materials only, and an effect that performs a Summon (`summonByEffect`, `canSummonByEffect`) never performs this way: it is the
  player's own action. On a card that also has a contact Fusion, with both open, the `summon` action is listed once per way
  (`way: "contact" | "tribute"`, `procedureWays`; named "... by tribute" by the bot's `actionName`) and the cards are handled as the
  way chosen says, even when they fit both; with one way open it is listed once, with no `way`. Every Tribute goes through `tribute`. `CardDef.summon.mustFirstBeProper` ("Must first be ..."): from the face-down Extra Deck only its own procedures
  Summon the card, never an effect that just Special Summons it. Konami's notes on Blue-Eyes Tyrant Dragon (OCG only).
- **A cost that uses an equipped card** needs nothing new: `equipsOf` in a `CostSpec.pick` (tested with a made-up card).
- **Effects activated in the Graveyard or while banished**: `legalActions` now lists the Ignition and Quick Effects with
  `range: "graveyard"` or `"banished"` of the player's cards there (face-up ones), like those of the hand and the field. The
  Graveyard and the banished cards are read only when some card of the Duel has such an effect (a per-`defs` cache). Trigger Effects
  from there already worked.
- **Wishes for Eyes of Blue** (`src/cards/wishes-for-eyes-of-blue.ts`, cid 20604; EN and FR text, Konami's notes and its one Q&A read
  2026-11-24): both effects, each once per turn by name. The Q&A (fid 23815, discarding under "cards sent to the GY are banished
  instead") is listed as pending: the core has no such effect. Its code is in the Blue-Eyes manifest: 12 of the 60 Main/Extra names
  are registered.
- The bot: no new action type (the monster and the zone are `choose` and `place`; the `summon` action's `way` is named by `actionName`); a card equipped from a hidden Extra Deck is public
  from then on and leaves the pool of hidden codes; a view and its re-dealt worlds keep the relation and what the Equip Card gives.
  These tests passed with no change to `src/bot`.
- Speed (`bench/BASELINE.md`, last section): crowdedHand list + `act` 0.057 to 0.073 ms against 0.99 to 1.29 ms for today's engine
  (17.5× to 17.7×); the committed sources and this slice benched side by side are the same within noise.

Known limits of this slice (what the tests do not prove):
- **YGOProJudge only** (asked 2026-11-24, five answers, none with an official source): the gain "as an Equip Spell that gives it 400
  ATK" is the Equip Card's own Spell effect (it stops while that card is negated, the card staying equipped; a monster unaffected by
  Spell effects is equipped and gains nothing); with no free Spell & Trap Zone the effect cannot be activated, and if the last zone is
  taken before it resolves the monster stays where it was; a monster equipped after a proper Summon keeps its "properly Summoned"
  status and is not a "Special Summoned monster" while it is an Equip Card; Ghost Ogre & Snow Rabbit answers an effect a monster
  treated as an Equip Card activates, and Mystical Space Typhoon can destroy such a card; Wishes for Eyes of Blue adds nothing when
  one of its two kinds is missing at resolution, and adds its two cards at the same time. The first question was first asked without
  a card name and came back as a request for the card; it was asked again naming Wishes for Eyes of Blue. Each test that rests on one
  says so in its title. That an Equip Card stays equipped when its monster changes control is step 7's lead (asked for Equip Spells).
- The core's own readings, no page read: a monster equipped straight from the Extra Deck cannot be Special Summoned from its Spell &
  Trap Zone (RB10's "properly Special Summoned first", applied to that place); an effect of range `equipped` is negated with its
  card; a monster equipped to an opponent's monster sits in the Spell & Trap Zone of the player who equipped it.
- Not modelled: Union monsters (equipping by their own effect, "1 Union per monster", RB10's exception that lets them be moved to
  another monster, and Special Summoning the equipped card back); equip eligibility that is checked while equipped ("equip only to
  a ..." becoming false destroys the Equip Card); Traps that become Equip Cards (they stay Traps); an Equip Card that is a monster
  being flipped face-down; a monster equipped to a face-down monster. When the equipped monster leaves, its Equip Cards are still
  destroyed one by one after its move, not in its batch (step 7's limit).
- `gives` takes card-reaching layers only (no lock, permission or control). A `negate` layer given this way ("the equipped monster's
  effects are negated") is read like a continuous negation, by `isNegated` when the effect resolves (it stops while the Equip Card is
  negated, and a monster that left the Monster Zone as its cost is not negated); it is never a lasting negation (`isNegatedLasting`,
  `negatedWhere` skip it). The core's reading, tested with a made-up card; no page read.
- After the review of this slice (`test/rules/monster-equips-review.test.ts`): the two-way choice above is tested with a made-up card
  (no real card with both a contact Fusion and another way was looked for); the same first-match choice between an Xyz Monster's
  recipes (`alternatives` with `transfer`, step 8) is unchanged. "Properly Summoned first" in a Pendulum Zone rests on YGOProJudge
  only (asked 2026-11-24, no source cited). What an Equip Card gives is pruned where the relation ends (a move of the Equip Card;
  its monster leaving or flipped face-down destroys it) and checked again on every read (`equippedTo`); a control change of either
  card ends nothing. The core has no "discarded" reason for a move (Wishes for Eyes of Blue's cost is a plain move to the Graveyard).
- `mustFirstBeProper` is the flag for "Must first be ..." on a card whose own procedures are a Fusion Summon and `alternatives`; no
  other "Must be ..." wording was audited. `alternatives` knows one `how` (`tribute`). The Tribute's event carries `usedFor:
  "fusion"` for Konami's "Tributed as Fusion Material"; no card reads it yet.
- **Blue-Eyes Tyrant Dragon is not written**: its Summoning condition is covered by the made-up `fixture-tyrant` (text and five notes
  cited), "unaffected by Trap Cards or effects" and "attack all monsters, once each" by earlier slices. What blocks it: its third
  effect ("at the end of the Damage Step, if this card battled: target 1 Trap in your GY; Set it") needs a trigger at the end of the
  Damage Step that can also be activated from the Graveyard or from banishment when the card was destroyed by that battle (its notes)
  and an operation that Sets a Trap from the Graveyard, neither written; its 11 Q&A entries were listed (titles read) but not opened;
  and "Blue-Eyes White Dragon" itself is not registered.
- Wishes for Eyes of Blue: the cards it adds are not shown to the opponent by the core (as for Terraforming; the bot's view keeps
  them hidden); "Blue-Eyes White Dragon" is read from the printed name and "Blue-Eyes" from `facts.archetypes`, so its tests use
  made-up monsters with those facts (and the real Effect Veiler as the Level 1 LIGHT Tuner) until the real ones are written; a
  target that changed control or was flipped in the chain is not equipped (the core's reading of a target). Independent review pending.
- Effects in the Graveyard: only the player's own Graveyard and banished cards are read (a card there is its owner's); a card
  banished face-down has no effect to activate. The bot's count of what a player could answer with (`evaluate`) does not count them.

Blue-Eyes batch: Blue-Eyes White Dragon, Sage with Eyes of Blue, Maiden of White, True Light, Mausoleum of White, Bingo Machine, Go!!!
(2026-11-24; `src/cards/{blue-eyes-white-dragon,sage-with-eyes-of-blue,maiden-of-white,true-light,mausoleum-of-white,bingo-machine-go}.ts`,
tests in `test/cards/` with the made-up cards of `test/cards/blue-eyes-fixtures.ts`, every code starting with `fixture-`; no new mechanic
was built). All six are registered in `CARD_DEFS` / `CARD_SOURCES` and in the Blue-Eyes 746021 manifest (18 of the 60 Main/Extra names are
registered now). Konami's EN and FR card pages and the Japanese notes were read once each; every printed effect and every listed ruling that
can arise has a test, the others are `pending` with their reason.
- **Blue-Eyes White Dragon** (cid 4007): a Normal Monster; its flavour text is the printed text; no effect record. "Blue-Eyes" (its archetype)
  is name-based and no Konami page lists it. The same goes for "Eyes of Blue" on Sage.
- **Sage with Eyes of Blue** (cid 12292): the Normal Summon trigger and the hand Ignition Effect (discard, target an Effect Monster, send it, then
  Special Summon a "Blue-Eyes" monster from the Deck). The send and the Summon are two steps in the core (the Summon sees the zone the target
  left); Konami's notes call them simultaneous.
- **Maiden of White** (cid 20602): three effects, the third one in two timings (chained to an activation that targets it; an attack that targets it),
  each one a record sharing its use (`once.key`). The placed True Light is moved to a Spell & Trap Zone of the player's choice, face-up, with
  no activation (Konami's Q&A fid 24051: it works under a "cannot activate Spell/Trap Cards" lock).
- **True Light** (cid 16653): the card alone, the card with its effect in the same Chain Link, and the later Ignition Effect are three records
  (the second and third share the effect's once per turn by name); the protection is a continuous `protect` layer (the opponent's card effects
  cannot target "Blue-Eyes White Dragon" in the controller's Monster Zone); the destruction is a mandatory "if" trigger of the Graveyard that
  reads the move's `before` (face-up, in a Spell & Trap Zone) and `negated` (Konami's notes and Q&A fid 23215: a negated activation, or a Set
  card, does not trigger it; it triggers in the Damage Step too). The Set effect sets the card face-down and marks it as Set this turn; a
  Field Spell is Set in the Field Zone and the one there goes to the Graveyard (the rulebook's reading, no Konami page read). Cards "you control"
  for the different name are the face-up ones (Q&A fid 23374: a Set card of that name does not stop a Set).
- **Mausoleum of White** (cid 12331): the additional Normal Summon is the `permit` layer, the second effect a lasting `add` modifier (kept when the
  card leaves, Q&A fid 18125), the third a Graveyard search with its cost. The Level read is the printed Level of the monster sent.
- **Bingo Machine, Go!!!** (cid 13844): the player picks the 3 cards (`askUpTo`), they are revealed, the opponent's random pick is `pickRandom`, the
  card goes to the hand and the Deck is shuffled, in one resolution.

Known limits of this batch (what the tests do not prove):
- **YGOProJudge only** (asked 2026-11-24, it cited no official source; the questions are in the report of the batch): Sage's once per turn limits
  only its second effect; Bingo Machine cannot be activated with fewer than 3 cards that meet a criterion in the Deck and the 3 may be copies of one
  card; Maiden's first effect needs a free Spell & Trap Zone (the cost frees none: it is a monster). Each such test says so in its title.
- The core's own readings, no page read: an effect that Special Summons or Sets from the hand, Graveyard or Deck is activated only while a card
  can be Summoned or Set (a Summon needs a free zone; True Light's Set effect a free Spell & Trap Zone, the card it is activated from the hand
  taking one); Sage's search needs a Level 1 LIGHT Tuner in the Deck (`search-needs-a-card`) and its second effect a "Blue-Eyes" monster that can be Summoned, the zone the target leaves counted; a Special Summon of "Blue-Eyes White Dragon" by the opponent does not
  trigger Maiden of White (the text says "you"); Maiden's placed True Light goes where the player chooses, as the core's reading of a placement.
- Pending Q&A (the cards or effects they are about do not exist in the core): Macro Cosmos-like "banished instead" (Maiden fid 14540, Mausoleum fid
  18128; Mausoleum's gain is guarded by "if you do" (the Normal Monster must reach the GY), but with no replacement effect in the core that guard has no test), Blue-Eyes Alternative White Dragon (Maiden fid 56), Double Summon (Mausoleum fid 18129; YGOProJudge disagreed with that entry, see the
  second readiness slice), Gimmick Puppet - Fantasy Machina (Mausoleum fid 24288), Phantom Knights' Dark Gauntlet (Sage fid 18319). Titles read only: True Light's other six Q&A entries (fids 24070, 24238, 23488, 23574, 23362, 24155), Bingo's one (Puppet Queen).
- Names are printed names: "Blue-Eyes White Dragon" is asked of `facts.name` whatever the face, so Blue-Eyes Alternative White Dragon (its name
  becomes "Blue-Eyes White Dragon" on the field and in the GY) is not modelled; effective name changes are not.
- The Spell/Trap activation lock used in the Maiden test and the Damage Step Quick-Play Spells are made-up cards; the Damage Step windows come from
  the existing battle model.

Mechanic gaps of the exact Blue-Eyes list (2026-11-24; audit in [docs/rules-core/blue-eyes-gaps.md](../../docs/rules-core/blue-eyes-gaps.md);
mechanics only, no real card written; tests in `test/rules/{trigger-events,leave-field-banish,activation-oath,set-by-effect,negate-spell-on-field,
fusion-including,damage-halved,chosen-cost,end-of-damage-step,extra-deck-gaps,summon-history}.test.ts` with the made-up cards of
`test/rules/blue-eyes-gap-fixtures.ts` (every code starts with `fixture-`); records in `src/blue-eyes-gap-sources.ts`):
- **A Trigger Effect knows what triggered it**: `EffectContext.triggered` (for its condition, cost and targets) and `Link.triggered`
  (for its operation) hold the events that met its condition at the trigger point: all of them for an effect that activates once
  ("If ... is sent to your GY: You can target 1 of them"), those of one batch for an "each time" effect. A card that came to the hand,
  the Graveyard or banishment in the same batch as another card's move is not triggered by that move (it was not there yet).
- **"Banish it when it leaves the field"**: `banishWhenItLeaves(duel, id, by?)`, a `leaves` layer on the card as it is: leaving the
  field for the Graveyard, the hand, the Deck or the Extra Deck, by anything, it is banished face-up instead (the `moved` event keeps
  its reason). Over once the card is no longer that card (turned face-down). Not applied when it becomes an Xyz Material.
  `Modifier.own`: a lasting modifier that is the card's own effect on itself stops while that card's effects are negated.
- **"The turn you activate this card"**: `EffectRecord.oath` gives locks that hold from the activation to the end of the turn, read
  from `Duel.activations` (nothing has to resolve); `negateActivation` lifts them (`Activation.negated`), a negated effect does not.
  `drewByEffect(duel, side)` (`Duel.drewByEffect`, set by `drawCards`) is the other half: "not in a turn you already drew by a card
  effect".
- **Setting a Spell or Trap by an effect** (`src/set.ts`): `setByEffect(duel, player, id, { slot?, effect? })`, `askSetByEffect`
  (the player chooses the zone), `canSetByEffect`, `setZones`: from a Deck, a hand, a Graveyard or banishment, face-down in a Spell &
  Trap Zone of the player (a Field Spell in the Field Zone, replacing the one there), noted in `setThisTurn` (a Trap or a Quick-Play
  Spell cannot be activated that turn).
- **Negating a face-up Spell or Trap**: `negateCardEffects` reaches any face-up card on the field, and returns the Duel given when
  nothing was negated (what "and if you do" reads).
- **A Fusion Summon whose effect asks for a material**: `FusionOptions.check` ("including a "Blue-Eyes" monster").
- **Halved damage**: the `damage` layer (`{ kind: "damage", who, halved: true }`), `damageHalved`, `damageFor(duel, side, amount)`;
  `loseLp` applies it, and the `battle-damage` event carries the damage really taken. Several halvings halve once.
- **A cost of several cards chosen one at a time**: `CostSpec.choose` (`from`, `counts`). `legalActions` lists the activation once
  per count (`Action.pay`, named `x3` by the bot); `act` then asks for the cards (`choose`) and activates once they are chosen. The
  opponent answers the activation, never the choice.
- **The end of the Damage Step**: `battledNow(duel, id)`, `attackedNow`, `destroyedByBattleNow` (`Battle.fought`: damage calculation
  was performed), by card id so that a monster destroyed by that battle can activate from the Graveyard or from banishment.
- **Smaller additions**: `targetCount` may be a function of the board; `fromActivated` for "unaffected by ... activated effects";
  a `banish-from-graveyard` lock with `banisher: "opponent"` (`banishLocked` and `canBeBanished` take the banishing player);
  `summon.onlyByOwnProcedure` ("Must be Synchro Summoned"); `Duel.summons` / `summonedCount` (the Summons of this turn and the last);
  `ifYouDo` on an Xyz alternative ("If you do, you cannot Normal or Special Summon for the rest of this turn").
- Bot: one new mark on `activate` (`pay`) with its name; `viewFor` masks hidden cards inside `Link.triggered`; the new Duel fields
  (`drewByEffect`, `summons`, `Activation.negated`, `Battle.fought`) are public and kept by a view and its re-dealt worlds.
- Speed (`bench/BASELINE.md`, last section): crowdedHand list + `act` 0.0605 ms against 1.0165 ms for today's engine (16.8×).

Sources of this slice (read 2026-11-24): Konami's TCG card texts of the 22 cards of the audit; Konami's Japanese notes (OCG only) on
Deep-Eyes White Dragon, the Blue Abyss, Dominus Purge, Pot of Prosperity, Primite Drillbeam and Blue-Eyes Tyrant Dragon, and Q&A fids
23378 and 23511; RB10 on "Leaves the Field", Set cards and Field Spells.

Known limits of this slice (what the tests do not prove):
- No real card is written. The audit says "ready to script" when every printed clause has a mechanic; each card still owes its
  identity, French text, its own notes and Q&A, tests and review.
- **YGOProJudge only** (asked 2026-11-24, three chats, no official source cited): a monster that is banished when it leaves the field
  is banished instead of returning to the hand or the Deck, and is not banished when it becomes an Xyz Material (RB10 says only that
  its "leaves the field" effects do not activate); a Normal Trap's effect activated in the GY with no timing stated is Spell Speed 2
  (nothing in the core depends on it). **A YGOProJudge answer not built**: Primite Drillbeam chained to a Normal Spell would negate
  that Spell's effect although the card is banished; in the core a lasting negation follows the card as it is, so the link of a card
  that has left is not negated unless the script negates it.
- The core's own readings, no page read: half of an odd damage is rounded up; `ifYouDo` applies once the materials are used and
  stands if the Summon is negated; the Summons noted are those that succeeded, Summons by effects included, and a turn's notes are
  kept through the next turn only; "Must be Synchro Summoned" also refuses a revival after a proper Summon; a card Set by an effect
  from the opponent's Deck or Graveyard goes to the field of the player who Sets; `targetCount` as a function is read on the board
  the cost left; a `banisher: "opponent"` lock stops a banishment from that GY that names nobody (neither `effect` nor `player`
  on the move, no `by` for `canBeBanished`), the owner's own included: a cost asks `canBeBanished` with its player and moves with
  `player` (the core's choice for a move with no player, no page read).
- `EffectContext.triggered` is every matching event since the last trigger point for an effect that activates once, also events of
  different moments (two cards sent by two links of one chain are both "them"): no page read. `arrivedWith` only looks at cards moved
  in one `moveCards` batch.
- `banishWhenItLeaves` replaces the move whatever causes it: a cost worded "send to the GY" is paid by a monster that is banished
  instead (no page read). "Cards sent to the GY are banished instead" for every card (the pending Q&A of Wishes, Maiden and Mausoleum)
  is not built: no card of the list has it.
- `oath` gives locks only, for the turn of the activation. `drewByEffect` notes draws made through `drawCards`; a script that moves a
  card from the Deck to the hand by hand does not draw.
- `CostSpec.choose`: a count is listed when some choice of that many candidates pays, with the targets any such choice leaves; each
  card then offered can still be paid with around the targets named (a target that paying would remove is not offered). Both try up
  to 1,000 choices of cards per question (`COST_CHOICES_TRIED`, src/activation.ts): past that, a way only later choices allow is not
  listed (what is listed can always be paid). A cost with targets tries every choice at each listing, so it costs more to list than
  a cost with none (which stops at the first choice that pays). Not for a Trigger Effect; once the action is taken the player
  cannot go back.
- A dead `banishWhenItLeaves` modifier is dropped when its card moves; other lasting modifiers of one card that last FOREVER (the ATK
  an effect left on it) stay in `Duel.modifiers` after the card moved: they reach nothing, but keep the modifier queries off their
  quick answer.
- `setByEffect` does not ask whether the card "can" be Set beyond a zone (a Spell that could never be activated is Set all the same).
- The Damage Step still lets only Counter Traps and ATK/DEF changes be activated: the negating Quick Effects of this list are not
  offered there (no Konami page read says they are). "During your Standby Phase: You can ..." is a trigger offered when the phase
  begins, not later in it.
- Blue-Eyes Tyrant Dragon's 11 Q&A entries, Pot of Prosperity's entries on a Deck lock (fids 9932, 17846) and the other cards' notes
  were not opened.

Blue-Eyes second batch: the ten remaining Main Deck cards of the exact 746021 list (2026-11-24; `src/cards/{blue-eyes-white-dragon-the-white-phantom-beast,
bystial-magnamhut,deep-eyes-white-dragon,dominus-purge,majesty-of-the-white-dragons,pot-of-prosperity,primite-dragon-ether-beryl,primite-drillbeam,
primite-lordly-lode,roar-of-the-blue-eyed-dragons}.ts`, tests in `test/cards/` with the made-up cards of `test/cards/{blue-eyes,primite}-fixtures.ts`
and `test/rules/blue-eyes-gap-fixtures.ts`, every code starting with `fixture-`; no mechanic was built). Every printed clause of the ten is a
record, none is `unmodelled`; all are registered in `CARD_DEFS` / `CARD_SOURCES` and in the manifest (28 of the 60 Main/Extra names are now
registered, 32 missing). Konami's EN and FR card pages were each read once, the Japanese notes of each card (OCG only) and the Q&A entries listed
in the cards' sources; the mapping clause to test is each card's `CardSources` and its test file.
- Added `askSpecialSummonIn` (`src/cards/helpers.ts`): "Special Summon ... in Defense Position", the player choosing the zone only.
- Two readings that the core's records force: Pot of Prosperity reads "the number of cards banished" at resolution, and the Chain Link keeps no
  list of the cards paid, so the one printed effect is two activation records, one per count (3 and 6) sharing the use and the oath, as
  Maiden of White writes one effect in two places. Roar of the Blue-Eyed Dragons shares its use between its two effects by `once.key`.
- **YGOProJudge only, no Konami page read** (labelled in the cards, the test titles and here): Majesty of the White Dragons' Graveyard
  effect is a Quick Effect (Spell Speed 2; Konami's notes only say it makes a Chain Link); Primite Drillbeam negates the effect of a Spell Card
  it is chained to as well as banishing it (R3 of docs/rules-core/blue-eyes-gaps.md: Drillbeam's own notes and its two Q&A entries, fids
  24176 and 24386, say nothing about it, so it stays a lead; only a Spell or Trap Card's own activation is negated this way, a monster's
  effect that was already activated resolves, which is the core's reading with no page read); Deep-Eyes White Dragon banished instead when it
  returns to the hand or Deck (R1; its notes settle the face-down case: it goes to the GY); Deep-Eyes White Dragon is still Special Summoned,
  with its ATK unchanged, when the monster it targeted has left the GY before it resolves (asked 2026-11-24, kept after two follow-ups that contested it with the targeting rule: it cites only an internal PSCT note and says "no official source retrieved"; the Summon does not use the target and
  "and if you do" ties the ATK to the Summon; it conflicts with the general idea that an effect whose targets are all illegal does not resolve,
  which no Konami page read settles for this shape, so it stays a lead).
- Konami's Q&A, OCG, fid 23793 (Ash Blossom against Magical Book of Judgment, its list names Bystial Magnamhut's second effect): an effect whose
  add from the Deck to the hand is done later, in the End Phase, still "includes" it, whether or not the Deck holds the card. Magnamhut's "if this
  card is Special Summoned" effect declares `search`, so Ash Blossom & Joyous Spring can be chained to it. Dominus Purge, whose text has the same
  wording, answers it too: the core's reading from the text, no Konami page names Dominus Purge here.
- The core's own readings, no page read: a "when/if ... you can" effect that Summons, Sets or searches is offered only while it can be done (as in
  the first batch); the Set effect of Primite Dragon Ether Beryl needs a "Primite" Spell/Trap Set-able from the Deck; Majesty of the White
  Dragons' count of cards shown is not capped by the opponent's cards; Dominus Purge destroys, after negating, the card where it activated it
  (field or hand, Konami's Q&A fid 23949: not if it has moved) when a Trap is in the GY; the cards of the hand revealed as costs (Primite
  Drillbeam, the White Phantom Beast) are revealed publicly through `revealCards`.
- Limits left in the open (clause and reason; none stops a card): the core has no Draw Phase draw, so Konami's Q&A fid 276 (the White Phantom
  Beast can be activated when a normal draw adds it) is a pending ruling; it has no Tokens (Primite Lordly Lode's Q&A fid 12551, Primite
  Drillbeam's "except a Token" and Token-targeting notes cannot arise); it gives a monster one printed Attribute (Dominus Purge's Q&A fid 24299
  on monsters with several Attributes is pending); effective names are not modelled (Deep-Eyes White Dragon's Q&A fid 24303 on Blue-Eyes
  Alternative White Dragon is pending); excavated cards are added to the hand and the rest are placed on the bottom of the Deck one after the
  other, not simultaneously (Pot of Prosperity's notes); the Standby Phase effect of Primite Dragon Ether Beryl is offered once, when the phase
  begins (L2); the negating Quick Effect of the White Phantom Beast is not offered in the Damage Step, which agrees with Konami's notes on that
  card (L1 is about the other cards of the list).
- Q&A opened beyond the cards' own notes: Pot of Prosperity fids 9932, 17846 (the lock on adding cards from the Deck) and 23511 (23378's quotes come from the audit's sources, not re-read); Primite
  Drillbeam 24176 and 24386; Primite Lordly Lode 10803, 24080 and 12551; Bystial Magnamhut 22474 and 23793 (24059 and 21722, found by title on its list, are about other chains, not opened beyond reading them: 24059 is the Prohibition one); Deep-Eyes White Dragon 24303 (its other four, 19063, 23217, 23218 and 24006, were read for a target that has left: none says anything about it); Dominus Purge
  23949, 24162 and 24299; the White Phantom Beast 276 and 24176. Titles only: the other Q&A entries of those cards (by their titles they are about other cards' chains),
  and Majesty of the White Dragons' one (a revealed hand), Primite Dragon Ether Beryl's one (Amatsu) and Roar of the Blue-Eyed Dragons' one
  (Ghost Belle): none opened.
- The test-first loop: each card's test file was written and run with the card unregistered (red) before the card was written; some tests passed
  with the card absent because they assert that something is not offered (Primite Lordly Lode's and Pot of Prosperity's Deck-lock tests, the
  "not activated" tests of Bystial Magnamhut and Deep-Eyes White Dragon); the `facts` tests of the five Spells and Traps, and the Q&A tests added
  after reading more Q&A (Lode's declaration, Magnamhut's lock, Dominus Purge's three, the White Phantom Beast's reveal), were written after the card.

Blue-Eyes Extra Deck batch: five of the six Extra Deck cards asked for, from the exact 746021 list (2026-11-24; `src/cards/{ancient-fairy-life-dragon,crimson-dragon,
hieratic-seal-of-the-heavenly-spheres,spirit-with-eyes-of-blue,lightstorm-dragon}.ts`, tests in `test/cards/` with the made-up cards of
`test/cards/extra-deck-fixtures.ts` (Synchro and Link materials of every Level, "Ancient Fairy Dragon", "World of Spirits", "Eternal Sunshine", Spells and Traps
that mention "Crimson Dragon", Dragon Synchro Monsters to be Summoned by Crimson Dragon, a "Blue-Eyes" monster that is not a Dragon), `test/cards/blue-eyes-fixtures.ts`
and `test/rules/{blue-eyes-gap,attack}-fixtures.ts`; every code starts with `fixture-`; no mechanic was built). Every printed clause of the five is a record, none is
`unmodelled`; the five are registered in `CARD_DEFS` / `CARD_SOURCES` and in the manifest (33 of the 60 Main/Extra names are now registered, 27 missing). Konami's EN and
FR card pages were each read once (one page per card; the text was taken verbatim from the page's own text block), the Japanese notes of each card and the Q&A named in the
cards' sources (OCG only).
- **Blue-Eyes Spirit Dragon is not written** (clause and reason): its second effect, "when an effect of a card in the GY is activated (Quick Effect): You can negate the
  activation", is, in Konami's notes (補足情報, 2024-03-23), usable "ダメージステップ中でも" (also in the Damage Step), and the core offers only Counter Traps and effects
  that change ATK or DEF there (limit L1 of `docs/rules-core/blue-eyes-gaps.md`). No stand-in was written: the card stays unregistered with its manifest entry
  without a code. Its other clauses (the Synchro procedure with "Blue-Eyes" non-Tuners, the lock on Special Summoning 2 or more monsters at the same time, the Tribute that
  Special Summons a LIGHT Dragon Synchro Monster in Defense Position and destroys it in the End Phase, "not treated as" a Synchro Summon only for itself) have their mechanics.
  Its notes also say its third effect cannot be activated in the Damage Step and not if it was Special Summoned from the GY or banishment; its 18 Q&A were not opened.
- Ancient Fairy Life Dragon: the draw and the search are one effect read when it resolves (notes): "World of Spirits" on either field then, face-up, turns the draw into
  the search, so a Chain that destroys it in between draws instead; the effect is activated only while the branch the field shows at the activation can be done (a draw that
  is not locked, or a card to add with no lock on adding): the core's reading of "cannot activate when it cannot be done". Its permission is `in-defense` for "Ancient Fairy
  Dragon" by name and every monster whose `facts.mentions` has that name, itself included. Its three Q&A (fids 24407, 23968, 14252) were opened: they are about Defense
  Position attacks and were already played by the core (`direct-and-defense-attacks.test.ts`); the card's tests show them with the card, and they were not red first.
- Crimson Dragon: the Quick Effect reads the Extra Deck as it is before the return (so "Crimson Dragon" itself is not a candidate) and frees the zone it leaves for the
  Summon; the core performs the two moves one after the other, so their two events are not in one batch (a limit; nothing on the list depends on it). A monster that "must be
  Synchro Summoned" may be chosen, and a Synchro Summon trigger answers the Summon (`specialSummon(..., { kind: "synchro" })`). The Quick Effect is not offered in the Damage
  Step (notes), and its target must be a face-up Synchro Monster of Level 7 or higher read now. Q&A fid 12750 (no window to negate a Summon treated as a Synchro Summon) is
  tested with "Solemn Judgment".
- Hieratic Seal of the Heavenly Spheres: the cost pays 1 monster of the hand or field, face-down ones included, and is not offered when it would leave no face-up card to return
  (Q&A fid 21579); a Quick-Play Spell chained and still on the field is neither returned nor counted (fid 21580); the Tributed trigger is two records (Graveyard, face-up banishment) and
  is not put on a Chain when the card has left that place by then (fid 24070, tested with a banishment in response). "Once per opponent's turn" is a use for each copy
  (`once: instance`), spent when negated: **YGOProJudge's answer only** (asked 2026-11-24, no source cited); the same answer says it cannot Tribute itself when it is the only
  face-up card, as Konami's Q&A says. Its other three Q&A (ATK/DEF changes, Link Ribbon, and one whose title was not shown) were not opened.
- Spirit with Eyes of Blue: "Special Summon ... except Dragon monsters" is a `summon` lock on the printed Type; its third effect is activated only while a Dragon "Blue-Eyes" monster
  can be Special Summoned with the lock in place, and may then Summon a non-Dragon since the Tribute ends the lock: **YGOProJudge's answer only** (asked 2026-11-24, no source
  cited; contested once, it kept its answer). "Add it to your hand or send it to the GY" is `askMay` (choosing the card adds it, passing sends it); with cards unable to be added
  from the Deck, it is sent. The Effect Monster Summoned from the GY is negated and cannot attack while it stays that card (a flip face-down makes it a new card: notes). Its "Eyes of Blue"
  archetype is the name's wording, no Konami page lists it. Its two Q&A (fids 23362, 23215, about "True Light") were opened and read in full and are not about this card's clauses.
- Lightstorm Dragon: the first effect's `targetCount` reads the Normal Monsters of the player's own GY (+1); the second is two records (Graveyard, face-up banishment) for a destruction by
  battle or card effect, and the "cannot be activated unless you control a Normal Monster" is a lasting lock on the Set card as it is (a face-up Normal Monster of the Monster Zone lifts it): how
  long it follows the card is **YGOProJudge's answer only** (asked 2026-11-24, no source cited). The card has no Q&A.
- YGOProJudge, every `ask` of this batch (three chats, one question each): (1) the Spirit with Eyes restriction and its Tribute (the first send returned an error and was sent a second time with the
  card named; then one follow-up contesting the answer); (2) how long the Lightstorm Dragon restriction lasts; (3) Hieratic Seal's "once per opponent's turn" and Tributing itself. None cited an official
  source.
- Tests that passed with the card absent (they assert something is not offered): Ancient Fairy Life Dragon 1, Crimson Dragon 2, Hieratic Seal 2, Spirit with Eyes of Blue 1, Lightstorm Dragon 2; the Q&A tests
  of Ancient Fairy Life Dragon and Crimson Dragon were written after the card and passed at once against existing core rules. Every other test was red first.

What can be activated in the Damage Step (limit L1, 2026-11-25; `damageStepAllows` in `src/battle.ts`, `src/damage-step-sources.ts`,
`test/rules/damage-step-flag.test.ts`, `test/rules/battle.test.ts`):
- No general rule for negations. No Konami page found says that effects which negate an activation can be activated in the Damage Step.
  Searched: the TCG rulebook (RB10: "you can only activate Counter Trap Cards, or cards with effects that directly change a monster's
  ATK or DEF"), Konami's TCG "Damage Step Rules" page (EU; the US page is gone and its 2021 archived copy has the same text: neither
  lists card kinds), and the official OCG rulebook (Master Rule, 2020-04-01, pp. 77-78), which names "basically" (基本的に) only effects
  worded for that timing, ATK/DEF changes and Counter Traps. Only each card's notes say "it can also be activated in the Damage Step".
  YGOProJudge calls it a general mechanic, with no source. So the design stays per record.
- `EffectRecord.damageStep` (a boolean) lets a Quick Effect be activated at every timing of the Damage Step the core has (`start`,
  `before`, `after`, `end`). It is set only on a record whose Konami notes say so: the negations of Blue-Eyes Spirit Dragon (its second
  effect; its third effect's notes say it cannot), Blue-Eyes Ultimate Spirit Dragon (second effect) and Neo Blue-Eyes Ultimate Dragon
  (second effect, the Quick Effect activated in the GY by banishing itself). All OCG only. It is read on `type: "quick"` only (the
  notes read are all about monsters' Quick Effects) and ignored on any other record; it adds to what the record is otherwise allowed.
  Unflagged, the rulebook's limit applies.
- Inferred: the notes name no timing. That the flag also covers "after damage calculation" and "end" rests on Konami Q&A fid 12836
  (a monster's negating Quick Effect chained during damage calculation, so not held to "up until the start of damage calculation") and
  on YGOProJudge's lead; no Konami page read shows such a monster effect at those two timings.
- Counter Traps keep the TCG rulebook's limit: only at the start of the Damage Step and before damage calculation (RB10: "these cards
  can only be activated up until the start of damage calculation"), the owner's decision of 2026-11-25 to follow the TCG text. The
  official OCG rulebook (under "after damage calculation" and "end of the Damage Step": basically no other card except Counter Traps)
  and Konami Q&A fid 7966 (Nine Pillars of Yang Zing negating D.D. Warrior's effect after damage calculation) allow them later, both
  OCG only, and are not followed. YGOProJudge said TCG judges allow it; contested in the same chat (2026-11-25), it conceded that no
  official TCG source says so, and the section of the TCG Damage Step Rules page it named does not exist (page checked). To follow the
  OCG instead, see the comment on `damageStepAllows`.
- `SourceKind` has `ocg-rule` (the official OCG rulebook; needs no card id).
- Limits: damage calculation itself still has no window, so an effect shown activated "during damage calculation" (fid 12836, and
  the OCG rulebook's list for that timing) can only be activated at the timings the core has. The flag is not read for Trigger
  Effects (put on a chain at their trigger point). The OCG rulebook's quotes were typed from the PDF's page images (it has no text layer).
- YGOProJudge, 2026-11-25, three chats, all closed: (1) Counter Traps after damage calculation and at the end of the Damage Step in
  the TCG: yes, "no explicit official TCG document", judge practice follows the OCG; (2) negating Quick Effects at every timing, and
  a general Konami rule: yes at every timing, "a general game mechanic", no Konami source cited; (3) the Counter Trap question again,
  asking for a TCG source, with one follow-up contesting it: still yes, but "there is no exact sentence in an official TCG document",
  "based on general judge practice"; the TCG page section it named does not exist. The TCG rulebook's wording was kept.
