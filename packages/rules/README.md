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
  was), never on the Duel's first turn, directly only when the opponent has no monster. Declaring starts no chain (FET); the turn
  player then the opponent may respond.
- `Duel.battle` is the attack in progress. When both players pass with no chain it moves on: Battle Step (`declared`) → start of
  the Damage Step → before damage calculation (a face-down target is flipped face-up in Defense Position) → damage calculation
  (RB10's tables, ATK/DEF read now through step 6's queries; 0 ATK destroys nothing; `battled`, `battle-damage` events; the
  target's `flipped` event is raised only now) → after → end (the destroyed monsters go to the Graveyard together, `moved` with
  `reason: "destroyed"`, `by: "battle"`) → back to the Battle Step. Each timing raises `damage-step` and is a trigger point.
- Replay: a target gone or a new monster on the opponent's side before the Damage Step stops the attack; the attacker may attack
  again (`Duel.replay`), or another monster does and the first stays used.
- In the Damage Step, up to damage calculation, only Counter Trap Cards and effects whose `categories` say they directly change ATK
  or DEF (`change-atk`, `change-def`; Shrink has it) can be activated; afterwards nothing but triggers (`damageStepAllows`).
- `CardInstance.position` (`attack` / `defense`); `loseLp` and `Duel.winner` (0 LP loses, both at once is a draw); a won Duel
  offers nothing.

Known limits of step 6b (what the tests do not prove):
- The Battle Phase's Start Step and End Step are not separate windows (the `phase` event of the Battle Phase stands for the Start
  Step); damage calculation itself has no window ("during damage calculation" effects: none of our cards).
- After damage calculation and at the end of the Damage Step nothing is listed but triggers, as RB10 says. YGOProJudge (lead, no
  source) would also allow Counter Traps and activation negators there; no Konami page read says so.
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
- Equip Cards: only Equip Spells, with the relation set by the card's own operation; equip limits ("equip only to a monster you
  control") and monsters as Equip Cards (step 11) are not modelled; when the monster leaves, its Equip Cards are destroyed one by one
  after its move, not in the same batch.

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
  none; an Xyz alternative with a cost; "Tribute 3 monsters", Summons with fewer Tributes, a second Normal Summon as an action
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
  monster treated as an Equip Card is read by its place, untested until step 11 adds such monsters). It destroys with
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
