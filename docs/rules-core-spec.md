# Rules core spec

The engine half of the wayfinder map "Meta decks playable under full tournament rules" (meirboccara/duel-academy#1),
decided in its ticket "Rules core spec: scope, acceptance and model for each step" (#10).

**Goal.** A new rules core in `packages/rules` that plays Yu-Gi-Oh! under full TCG tournament rules, so the masters'
decks can be played exactly as printed. Junior moves onto it when it reaches parity; the old `packages/engine` is then
removed and the new package takes the name `@duel-academy/engine` ([ADR 0001](./adr/0001-new-rules-core.md)).

**Inputs.**
- Rules model: [full-rules-engines-chains-timing.md](./research/full-rules-engines-chains-timing.md) §2–§3.
- Bot: [meta-deck-bot-approach.md](./research/meta-deck-bot-approach.md) (hybrid: general bot + per-deck combo data + expert sampling).
- Cards: the coverage notes in `docs/research/*-coverage-2026-11.md`.
- Definition of done for a card: wayfinder ticket #9.

## Standing rules

- **Clean room.** YGOPro's original core (Fluorohydride/ygopro-core, MIT) may be studied as a design reference. GPL/AGPL
  sources (ygopro-scripts, ProjectIgnis CardScripts, EDOPro's core, including `procedure.lua`) are never opened. Rules
  come from Konami's rulebook, rules pages and card text.
- **State.** The board is a value: each move returns a new board, sharing unchanged parts. No mutable state with undo.
  Speed comes from listing legal moves without building every candidate.
- **Determinism.** All randomness comes from the board's seeded RNG; the core never calls `Math.random` or the clock.
- **Response windows.** A player is offered a chance to respond only when they hold a legal response. A teaching option
  decides whether Junior passes automatically or shows every chance.
- **Teaching options** (small board, phases by hand, chain limits) limit what a child is offered; they never change how
  a card resolves.

## Acceptance for every step

1. Rule tests that cite their **source records** (kind, Konami address, date read, short quote), as card tests do.
2. A speed benchmark on fixed reference boards, kept in the repo and run in CI.
3. The old engine and Junior untouched until step 10.

**Speed targets.** Listing legal moves ≥ 10× faster than today's `legalPlays` (2.4–6.4 ms) by the end of step 2, ≥ 30×
by step 9. An expert bot decision ≤ 1.5 s in a Web Worker.

## Who builds it

Opus 5.5 leads every step and decides, per step or per task, when the rules work is deep enough to hand to Fable 5.2.
Sonnet 5.5 ports existing cards and writes meta cards once their mechanics exist. Every step is reviewed by a different
model than the one that wrote it.

## Steps

| # | Step | Scope | Done when (beyond the acceptance above) |
|---|---|---|---|
| 0 | Foundation | `packages/rules` package; seeded RNG; test harness with source records; coverage check (every printed effect and listed ruling has a test, French text present); benchmark harness and reference boards | A trivial card passes the full definition of done through the harness |
| 1 | Card identity | Each physical card is an instance with id, card code, owner, controller, location, face and a "moved" counter; a card's name is no longer its identity | Owner vs controller and "leaves the field" resets are testable |
| 2 | One chain + priority loop | Chain links (player, instance, effect, Spell Speed, snapshot, targets, categories, negation flags); Konami's fast-effect timing chart; responses legal iff speed ≥ top link and condition holds; **complete legal-action listing**, chain responses included; the teaching chain cap | Ash Blossom, Mystical Space Typhoon on a Quick-Play, several hand traps in one chain, own-turn hand effects; ≥ 10× speed |
| 3 | Triggers + missing the timing | Typed events; trigger collection into mandatory/optional × turn/non-turn; Konami's simultaneous-trigger order; the non-turn player chooses their optional triggers; "when" vs "if" with break points | Konami's missing-the-timing examples |
| 4 | Effect records + once per turn | `{ type, range, event, timing, condition, cost, target, operation, once }`; cost and target dry runs; non-target choices at resolution; categories frozen on the link; five once-per-turn scopes (per instance, hard per name, refunded if negated, per Duel, per chain) | Existing data-written cards expressible as records |
| 5 | Negation | Activation negated vs effect negated vs card negated on the field; negating a Summon as its own moment; "cannot be negated" flags | Solemn Judgment / Strike and Infinite Impermanence |
| 6 | Continuous effects | One list of timestamped modifiers; ATK/DEF/Level/controller/negated as queries in Konami's order; locks and "neither player can…" as modifiers | ATK/DEF ordering cases; floodgates |
| 6b | Battle (added by the owner, 2026-11-23) | Battle Phase steps (Start, Battle, Damage, End); attack declaration and targets; replays; the Damage Step's timings and what may be activated in it (Counter Traps, ATK/DEF changes, "during the Damage Step" effects); damage calculation and battle destruction; direct attacks | Konami's Damage Step examples; negation in the Damage Step |
| 7 | Zones | 5 Main + 2 shared Extra Monster Zones + 5 Spell & Trap + Field per side; columns; Link arrows across both sides; Pendulum Zones | Column and co-link effects |
| 8 | Summon procedures as data | Material specs per Extra Deck card (filters, counts, Tuner/non-Tuner, Link rating, alternative Xyz); Ritual "equal / equal or greater"; Fusion by effect from hand, field, Deck, GY or the opponent's field; Summons by effect and on the opponent's turn | The Synchro, Fusion and Ritual blockers named in the coverage notes |
| 9 | Bot support | Board seen from one player's side and re-dealing of hidden cards; moves as named sequential choices for combo data; evaluation that counts interruptions; bot in a Web Worker with a time budget and fallback | ≥ 30× speed; expert decision ≤ 1.5 s |
| 10 | Teaching options, parity, switch | Junior's levels rebuilt as teaching options; every card Academy scripts today ported; today's card and engine tests passing on the new core; the app switches; the old package removed and renamed | All of today's tests green on `packages/rules` |
| 11 | Special board objects | Tokens; counters; dice; monsters as Equip Cards; monsters treated as Continuous Spells (added by ticket #21; monster equips brought forward when required by the exact-list checklist below; the app switch still waits for parity) | Dark Time Wizard, Beetrooper, Angelechy and Radiant Typhoon cards expressible |

## Real-deck completion checklist (bounded work started 2026-11-24)

This is a checklist against the steps above, **not another roadmap**. The approved exact acceptance decks are
Blue-Eyes **746021** (43 Main / 15 Extra) and Sky Striker **745443** (40 Main / 15 Extra). The immutable inventory is
[`packages/rules/src/deck-manifests.ts`](../packages/rules/src/deck-manifests.ts), transcribed from the research notes'
L1 M/E/S columns, with the original deck URLs and local provenance. Each includes a separate 15-card Side inventory;
Side scripting is not part of this acceptance. No substitutions, including for unsupported new names.

**Current new-core registration:** 60 distinct Main/Extra names, 12 registered (Ash Blossom, Droll, Effect Veiler, Ghost Ogre,
Infinite Impermanence, Lightning Storm, MST, Mulcharmy Fuwalos, Mulcharmy Purulia, Raigeki, Upstart Goblin, Wishes for Eyes of Blue), 48 absent. Registration is not completion: printed identity, all effects/rulings, French text, independent review
and exact-deck integration still gate it. Historical research coverage describes the old engine, not readiness here.
`deckReadiness` reports missing/partial/registered only and cannot certify a ready deck.

| Existing step / card-plan work | Current state and completion gate |
|---|---|
| 1: printed identity | **Partial:** typed Attribute/monster Type/name/archetype/mentions facts and exact public queries implemented; existing card definitions still need complete sourced printed data. Effective Level/ATK/DEF remain step 6 queries. Dynamic names, Attributes, Types and material identities are not implemented. |
| 3: events | **Partial:** destruction provenance carries effect source snapshot, activating player, effect index; costs, battle and game mechanics are distinct. MST and core negators integrated, hidden source snapshots masked/re-dealt. Since 2026-11-24: delayed effects applied by their player in a later phase (`delay`, the `apply` action, End Phase ordering and choices) and lingering operations applied at once with no Chain Link (`watch`); `summoned` events carry who Summoned, from where, and a batch. Raye/Roze and Vision trigger/card cases remain unscripted; End Phase ordering rests on YGOProJudge only. Since the step 11 slice: Ignition and Quick Effects activated in the Graveyard or while banished are listed (`range`). |
| 4: records/choices | **Partial:** chain, costs, targets and sequential choices exist; since 2026-11-24 also modes, declarations (at activation and at resolution), "up to N" and optional choices at resolution, coupled targets, reveals, seeded Deck shuffles, bottom-of-Deck ordering, excavation, random picks and LP gains (README, last section). Since the second readiness slice: an effect replaced on the chain (`replaceEffect`, `Link.replaced`: the link keeps its activation, cost and once-per-turn use; Amatsu's notes and Q&A fids 24166, 24165, OCG only; negation cases YGOProJudge only). Per-card exact-list needs have not been audited against the new core; no blanket completion from generic fixtures. |
| 6: continuous | **Partial:** stat modifiers, locks, negation and control exist. Since 2026-11-24: restrictions as locks (activation prohibitions by any filter, "cannot draw by card effects", "cannot be banished from the GY", "cannot attack" / "directly"), durations "this turn", "until the end of your next turn" and "for the rest of this Duel", and a protection layer ("cannot be targeted", "cannot be destroyed by card effects / by battle", "unaffected by ...", "the first time each turn") asked by targeting, destruction, attributed moves, control changes and negation, never by costs (README, last section; five Konami Q&A pages, the rest YGOProJudge only). Cards moved or Summoned at the same time are judged and placed as a group; Skill Drain against a monster's own "unaffected" effect follows which began first (Konami Q&A fid 23897, OCG); no general ordering of continuous effects. Per-card exact-list needs have not been audited; implement any missing continuous behaviour alongside its card. |
| 6b: battle | **Partial:** basic battles and destruction exist. Since 2026-11-24 (second readiness slice): attack permissions as a modifier layer ("a second attack", "up to 2 attacks on monsters", "all monsters, once each", "attack again in a row", "can attack directly" past monsters, attacks in face-up Defense Position using DEF), with the turn's attacks kept in `Duel.attacked`, replays, and what a negated permission does before and in the Damage Step (Konami Q&A fids 12701, 16016, 11046, 23968, 24407, OCG only; the rest YGOProJudge only: README, last section). Made-up fixtures only: Hayate, Tyrant Dragon, Neo Blue-Eyes Ultimate Dragon and Ancient Fairy Life Dragon are not written; attack-target restrictions and the Start/End Step windows are missing ("twice per turn" is `Once.times`). |
| 8: procedures | **Partial:** generic procedures exist. Since 2026-11-24 (second readiness slice): Synchro recipes with a Tuner count other than one (`Procedure.tuners`, "2+ Tuners + 1 non-Tuner"); a Normal Summon "in addition to your Normal Summon/Set" as a permission offered once per turn as its own action (Mausoleum of White's notes, OCG only); monsters Special Summoned at the same time, all or none, in one batch of events (`specialSummonTogether`; Zero's notes), and the lock "cannot Special Summon 2 or more monsters at the same time" (Blue-Eyes Spirit Dragon, Q&A fid 18176). Made-up fixtures only. Exact recipes, alternative Summons, material identity exceptions and restrictions remain per-card gates. |
| 10: lifecycle, parity, switch | **Missing for exact-deck play:** full-duel lifecycle behaviour is not yet accepted by exact-deck tests; app migration remains explicitly deferred. |
| 11: monster equips | **Partial (monster equips built 2026-11-24; the rest of step 11 open):** a monster equipped to a monster is its card face-up in a Spell & Trap Zone, treated as an Equip Spell (RB10), with its monster effects not applying, what the equipping effect gives as a modifier tied to the relation (`equipMonster`, `gives`, `Modifier.equip`), the `equipped` range, a Fusion Monster's other way of being Special Summoned with an equipped card (`alternatives`, `mustFirstBeProper`; Konami's notes on Blue-Eyes Tyrant Dragon, OCG only), and `cardTypeOf` / `fromSpells` (README, last section). Negation of what the Equip Card gives, the zone rule, the kept "properly Summoned" status and Ghost Ogre against it rest on YGOProJudge only. Wishes for Eyes of Blue is written; Blue-Eyes Tyrant Dragon is not (its third effect needs an end-of-Damage-Step trigger from the GY/banishment and Setting a Trap from the GY; its 11 Q&A are unread). **Still open, not needed by the two lists:** Tokens, counters, dice, monsters treated as Continuous Spells, Union monsters, Traps as Equip Cards. |
| Blue-Eyes mechanic gaps (audit: [docs/rules-core/blue-eyes-gaps.md](rules-core/blue-eyes-gaps.md)) | **Built 2026-11-24, mechanics only (made-up fixtures, no real card):** each of the 22 remaining Blue-Eyes 746021 cards was read (Konami's TCG text) and audited clause by clause; all 22 now have a core mechanic for every printed clause. Added: the events that triggered a Trigger Effect (`EffectContext.triggered`, `Link.triggered`); "banish it when it leaves the field" (`banishWhenItLeaves`) and an own lasting effect that stops while negated (`Modifier.own`); "the turn you activate this card" (`EffectRecord.oath`, `drewByEffect`); Setting a Spell/Trap by an effect (`setByEffect`); negation of a face-up Spell/Trap; `FusionOptions.check`; halved damage (`damageFor`); a cost chosen one card at a time (`CostSpec.choose`, `Action.pay`); the end of the Damage Step (`battledNow`, `attackedNow`, `destroyedByBattleNow`); a target count read from the board; `fromActivated`; "your opponent cannot banish cards from your GY"; "Must be Synchro Summoned"; the Summons of this turn and the last (`summonedCount`) and `ifYouDo` on an Xyz alternative. Sources: Konami's notes on Deep-Eyes, Dominus Purge, Pot of Prosperity, Primite Drillbeam and Tyrant Dragon, Q&A fids 23378 and 23511 (OCG only), RB10; three points rest on YGOProJudge only (README, last section). **Still open:** negation Quick Effects in the Damage Step, "during your Standby Phase" as more than a trigger at its start, "sent to the GY are banished instead" for every card, and every card's own script, notes, Q&A, French text and review. |
| Card plan | **Missing:** all 48 absent Main/Extra cards, sourced identity for the four older registered cards (Ash, Droll, Infinite Impermanence, MST), per-effect/ruling/French coverage and independent review. Ghost Ogre, Veiler, Raigeki, Upstart Goblin, Lightning Storm, Mulcharmy Fuwalos, Mulcharmy Purulia and Wishes for Eyes of Blue are written to the definition of done (independent review pending). Ash Blossom now answers draw effects (Konami Q&A fid 21685); its printed facts are still incomplete. |
| 9 / final acceptance | **Not run:** exact lists playable, combo data, then 20 recorded Sonnet/Opus duels with failures reconciled. No duels or deck-ready claim in this foundation. |

- [x] Freeze exact Main/Extra and separate Side inventories; explicitly retain unsupported names.
- [x] Add printed identity and source-attributed destruction seams, tested red before implementation.
- [ ] Complete every Main/Extra entry's source, printed facts, effect/ruling coverage, French text and review (card-plan inventory below).
- [ ] Close the exact-list mechanic and lifecycle gaps above alongside consumers.
- [ ] Verify both decks without substitutions, then run and review 20 duels.
- [ ] Consider app parity/migration separately; this checklist does not authorize switching Junior.
