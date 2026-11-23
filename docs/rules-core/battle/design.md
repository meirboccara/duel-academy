# Step 6b, Battle: design and slice list

Status: research and design only. Nothing in the repo was changed. Built after step 6 (reads ATK/DEF through step 6's queries). Records live in `packages/rules/src/battle-sources.ts` (new, same shape as `negation-sources.ts`); quotes are in `sources.md` next to this file.

## Record ids (all read 2026-11-23)

| id | kind | source |
|---|---|---|
| `battle-phase-four-steps` | tcg-rule | RB10 p.37-43: Start, Battle, Damage, End; Battle and Damage Step repeat per attack |
| `no-battle-first-turn` | tcg-rule | RB10: the first player cannot conduct their Battle Phase on their first turn |
| `attack-declaration` | tcg-rule | RB10: select 1 own monster and 1 target; direct attack only if the opponent has no monster |
| `one-attack-per-monster` | tcg-rule | RB10: each face-up Attack Position monster is allowed 1 attack per turn |
| `attack-is-no-chain-action` | tcg-rule | FET: "Declare an attack" is an open-game-state action that does not start a Chain; Turn Player at B then Opponent at C |
| `replay` | tcg-rule | RB10: replay wording; a different attacker still counts as having declared |
| `damage-step-timings` | tcg-rule | Damage Step Rules: start / before / perform / after / end |
| `damage-step-activation-limit` | tcg-rule | RB10: only Counter Traps or cards that directly change ATK/DEF, only up to the start of damage calculation |
| `flip-face-up-before-calc` | tcg-rule | Damage Step Rules + RB10: face-down defender flips before damage calculation; its Flip effect waits until after |
| `damage-atk-vs-atk`, `damage-atk-vs-def`, `damage-direct` | tcg-rule | RB10 tables |
| `destruction-sent-at-end` | tcg-rule | Damage Step Rules: determined at calculation, sent to GY at the end of the Damage Step |
| `battled-needs-calc` | tcg-rule | RB10: "battled" needs the attack to reach damage calculation |
| `lp-zero-wins-both-draw` | tcg-rule | RB10 winning |
| `impermanence-not-in-damage-step` | jp-notes, OCG only | cid 13631, 2021-05-15 |
| `solemn-strike-in-damage-step` | jp-notes, OCG only | cid 12187, 2025-02-21 |

## Model

- `Phase` stays the flat list. Add a `Battle` moment on `Duel` (like `Summoning`): `{ attacker, target | "direct", step: "battle" | "damage", sub: "start" | "before" | "calc" | "after" | "end", declared: attacker ids this turn }`. `attacksDeclared` (per instance, reset when the turn changes) lives on the Duel, not on the card.
- Public seam unchanged: `legalActions` lists "declare attack" actions for the turn player at the Battle Step, and `act` runs them. Declaring is an action, not a chain link; then the priority loop offers responses (FET: turn player first, then opponent).
- A function `damageStepOffer(duel, card, effect)` is the single place deciding if an effect is activatable in the Damage Step: before-calc: Counter Trap, or effect whose categories include a direct ATK/DEF change; at calc and after: only what a record allows (none until sourced); the engine refuses everything else. This is the one read of the activation limit.
- Damage calculation reads ATK/DEF through step 6's query (never raw card stats), takes a snapshot at calc, calls `loseLp` (new, next to `payLp` in life.ts), marks destroyed-by-battle without moving the card.
- Destruction: at `end`, move to GY with a cause `{ battle: true, by }` on the `moved` event (step 3 events currently carry no cause: add one field, see Risks).
- Winner: `Duel.winner` set when LP is 0; both 0 gives `"draw"`. Checked after each LP change.
- Replay: after attack declaration responses finish, if the target left or a new monster came to the defender's side, the turn player picks: same attacker again, another attacker, or stop. The declared attacker stays marked.
- Negation in the Damage Step reuses step 5: a Counter Trap negating an activation in the before-calc window is allowed (`solemn-strike-in-damage-step`); Infinite Impermanence is refused (`impermanence-not-in-damage-step`, OCG only).

## Slices (each: one failing test first, cites a record)

| # | Slice | Record |
|---|---|---|
| 1 | No "declare attack" in the Battle Phase of the first player's first turn | `no-battle-first-turn` |
| 2 | Attack actions exist only in the Battle Phase, Battle Step | `battle-phase-four-steps` |
| 3 | Declare an attack on an opposing monster; the declaration is an action, not a chain link; turn player then opponent get the window | `attack-declaration`, `attack-is-no-chain-action` |
| 4 | Direct attack only when the opponent has no monster | `attack-declaration` |
| 5 | One attack per face-up Attack Position monster per turn; counter reset next turn; Defense Position monsters cannot attack | `one-attack-per-monster` |
| 6 | ATK vs ATK: higher destroys, difference to LP, equal destroys both with no damage (uses step 6 ATK) | `damage-atk-vs-atk` |
| 7 | ATK vs DEF: all three outcomes | `damage-atk-vs-def` |
| 8 | Direct damage is the full ATK | `damage-direct` |
| 9 | LP 0 sets a winner; both at 0 is a draw | `lp-zero-wins-both-draw` |
| 10 | Destruction is decided at calc, the card leaves at the end of the Damage Step; after-calc triggers see it still on the field; the `moved` event says "destroyed by battle" | `destruction-sent-at-end`, `damage-step-timings` |
| 11 | Face-down defender flips before calc; its Flip effect fires after calc, not before | `flip-face-up-before-calc` |
| 12 | Sub-steps are visible to the effect layer (start, before, calc, after, end) so triggers worded with those timings attach to the right one | `damage-step-timings` |
| 13 | Before calc the turn player and opponent are offered only Counter Traps and direct ATK/DEF changes; nothing else (Quick Effects, normal Quick-Play, Normal Trap refused) | `damage-step-activation-limit` |
| 14 | From calc onwards only what a record allows: nothing until sourced | `damage-step-activation-limit` |
| 15 | A Counter Trap negating inside the Damage Step; Infinite Impermanence refused there (OCG-only records) | `solemn-strike-in-damage-step`, `impermanence-not-in-damage-step` |
| 16 | ATK change in before-calc changes the damage (step 6's modifier order) | `damage-step-activation-limit`, `damage-atk-vs-atk` |
| 17 | Replay when the target leaves before the Damage Step: same attacker, another attacker, or stop; the first attacker stays used | `replay` |
| 18 | Replay when a monster is added to the defender's side | `replay` |
| 19 | "Battled" only if calc was reached (an attack negated or replayed away did not battle) | `battled-needs-calc` |
| 20 | Konami's Damage Step examples (done-when): all slices together on one script | all of the above |

Order notes: 1-9 need only step 6's ATK/DEF query; 10-12 need step 3 events; 13-16 need step 5; 17-19 last.

## Risks

- `moved` events carry no cause; slice 10 adds one field and touches triggers.ts tests.
- The old engine ignores replays; no behaviour to copy, use the rulebook.
- Hand traps and monster Quick Effects at Damage Step starts have no source: slices 13-14 refuse them, which may be too strict.

## Open questions for the owner

1. YGOProJudge was not asked: the harness blocked reading `YGOJ_PARTNER_KEY` as credential exploration. If the owner wants it, they must allow that read (or run the questions). Questions to ask, one per session, flagged as leads:
   a. In the TCG, which effects can be activated after damage calculation and at the end of the Damage Step?
   b. Can a monster Quick Effect (such as a hand trap) be activated at the start of the Damage Step?
   c. After Negate Attack, does the attacker count as having declared its attack, and does the Battle Phase continue?
2. Slices 13-14 follow RB10 strictly. Confirm that over a looser reading.
3. Replay slice order (17-19) is last by decision; confirm it stays inside 6b.
