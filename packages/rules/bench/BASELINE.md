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
