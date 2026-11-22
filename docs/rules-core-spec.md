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
| 7 | Zones | 5 Main + 2 shared Extra Monster Zones + 5 Spell & Trap + Field per side; columns; Link arrows across both sides; Pendulum Zones | Column and co-link effects |
| 8 | Summon procedures as data | Material specs per Extra Deck card (filters, counts, Tuner/non-Tuner, Link rating, alternative Xyz); Ritual "equal / equal or greater"; Fusion by effect from hand, field, Deck, GY or the opponent's field; Summons by effect and on the opponent's turn | The Synchro, Fusion and Ritual blockers named in the coverage notes |
| 9 | Bot support | Board seen from one player's side and re-dealing of hidden cards; moves as named sequential choices for combo data; evaluation that counts interruptions; bot in a Web Worker with a time budget and fallback | ≥ 30× speed; expert decision ≤ 1.5 s |
| 10 | Teaching options, parity, switch | Junior's levels rebuilt as teaching options; every card Academy scripts today ported; today's card and engine tests passing on the new core; the app switches; the old package removed and renamed | All of today's tests green on `packages/rules` |
| 11 | Special board objects | Tokens; counters; dice; monsters as Equip Cards; monsters treated as Continuous Spells (added by ticket #21; after the switch because today's cards don't need it) | Dark Time Wizard, Beetrooper, Angelechy and Radiant Typhoon cards expressible |
