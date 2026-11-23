# Legal-move baseline (today's engine)

`legalPlays` on the reference boards (`reference-boards.ts`), Node 22, Windows 11, vitest bench, 2026-11-23.
Mean time per call:

| Board | Mean | Target by step 2 (10×) | Target by step 9 (30×) |
|---|---:|---:|---:|
| opening | 0.79 ms | 0.079 ms | 0.026 ms |
| midgame | 3.59 ms | 0.359 ms | 0.120 ms |
| crowdedHand | 1.09 ms | 0.109 ms | 0.036 ms |

Rerun with `pnpm --filter @duel-academy/rules bench`; compare on the same machine.

# Rules core, step 2 (one chain + priority loop)

The same positions rebuilt on the new core (`reference-duels.ts`), same machine, 2026-11-23. Mean time per call, and
how many times faster than the baseline above:

| Position | Actions listed | `legalActions` | vs baseline | `legalActions` + `act` on each | vs baseline |
|---|---:|---:|---:|---:|---:|
| opening | 5 | 0.0005 ms | ~1,600× | 0.017 ms | 47× |
| midgame | 6 | 0.0007 ms | ~5,100× | 0.018 ms | 197× |
| crowdedHand | 11 | 0.0010 ms | ~1,100× | 0.044 ms | 25× |

In the same run today's engine measured 0.71 / 3.17 / 1.15 ms, close to the baseline.

How to read it:
- `legalPlays` returns each move with the board it leads to. The like-for-like figure is the second one (list, then
  `act` on every action; an activation nobody answers resolves its whole chain). It meets the step 2 target (≥ 10×) on
  the three positions.
- The new core does not list everything yet: no Normal Summon or Set of a monster, no change of battle position, no
  attack, no Fusion Summon. It lists activations (hand, Set, field), Sets of Spells and Traps, and "pass": 5 / 6 / 11
  actions, where `legalPlays` returns 17 / 26 / 42 moves. The ratio will come down as later steps add those actions;
  the benchmark stays to watch it.
- Per move built, the second figure is about 3 to 4 µs for the new core against 46 / 138 / 26 µs for today's engine:
  14× / 46× / 6.5×. So listing alone is far past the target, while building every resulting duel is not yet 10× per
  move on crowdedHand. The spec's plan is to list without building each candidate; `act` has not been tuned.
- The cards of `reference-duels.ts` are benchmark fixtures in the provisional effect shape, not cards of the core.

# Rules core, step 3 (triggers + missing the timing)

Same positions, same benchmarks, **macOS (Darwin 24.2, Apple silicon not recorded), Node 20+, 2026-11-23**: a different
machine from the tables above, so only the ratios inside this table compare. Step 2 was re-measured on this machine
(git stash of the step 3 work) in the same session. Mean time per call:

| Position | `legalActions` step 2 | `legalActions` step 3 | list + `act` step 2 | list + `act` step 3 | today's engine | step 3 vs today's engine |
|---|---:|---:|---:|---:|---:|---:|
| opening | 0.0004 ms | 0.0005 ms | 0.0117 ms | 0.0143 ms | 0.342 ms | 24× |
| midgame | 0.0007 ms | 0.0008 ms | 0.0151 ms | 0.0190 ms | 1.599 ms | 84× |
| crowdedHand | 0.0009 ms | 0.0010 ms | 0.0370 ms | 0.0466 ms | 0.736 ms | 16× |

How to read it:
- Step 3 adds about 20 to 25 % to `act` (events on every move, a break before each link resolves, a trigger point after
  each chain and Set). `legalActions` is unchanged within noise: it does one extra check, `duel.building`.
- The like-for-like ratio is still above the step 2 target (10×) on the three positions; the spec's 30× is for step 9.
- The reference cards have no trigger effect, so the benchmark does not measure trigger collection itself: when no card
  of the duel listens to events (`events.ts`, `listeners`), `raiseEvent` returns at once. A duel with trigger cards
  scans every card of the duel on each move; a benchmark for that belongs to the step that has real trigger cards.

Trigger-heavy benchmark (`bench/triggers.bench.ts`), same machine and day, mean per call:

| Case | Mean |
|---|---:|
| Sweep of 20 monsters with trigger effects: 6 mandatory triggers chained (the engine scans every card on each move), optional ones asked | 0.044 ms |
| `legalActions` while the optional triggers are chosen | 0.0011 ms |
| A Spell with 4 trigger cards on the field that never trigger | 0.0036 ms |

The scan is linear in the cards of the duel for every move; this is the cost to watch when real trigger cards arrive.
