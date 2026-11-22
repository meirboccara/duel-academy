# Legal-move baseline (today's engine)

`legalPlays` on the reference boards (`reference-boards.ts`), Node 22, Windows 11, vitest bench, 2026-11-23.
Mean time per call:

| Board | Mean | Target by step 2 (10×) | Target by step 9 (30×) |
|---|---:|---:|---:|
| opening | 0.79 ms | 0.079 ms | 0.026 ms |
| midgame | 3.59 ms | 0.359 ms | 0.120 ms |
| crowdedHand | 1.09 ms | 0.109 ms | 0.036 ms |

Rerun with `pnpm --filter @duel-academy/rules bench`; compare on the same machine.
