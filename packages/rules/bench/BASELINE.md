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

# Rules core, step 4 (effect records + once per turn)

Same positions, same benchmarks, same machine as step 3 (macOS, Darwin 24.2, Node 20+), 2026-11-23. Step 3's column is
the figure recorded above (measured earlier the same day, not re-run beside step 4: no stash or worktree was allowed
for this step), so a few percent of it is noise. Mean time per call:

| Position | `legalActions` step 3 | `legalActions` step 4 | list + `act` step 3 | list + `act` step 4 | today's engine (same run) | step 4 vs today's engine |
|---|---:|---:|---:|---:|---:|---:|
| opening | 0.0005 ms | 0.0006 ms | 0.0143 ms | 0.0195 ms | 0.367 ms | 19× |
| midgame | 0.0008 ms | 0.0014 ms | 0.0190 ms | 0.0314 ms | 1.604 ms | 51× |
| crowdedHand | 0.0010 ms | 0.0019 ms | 0.0466 ms | 0.0712 ms | 0.761 ms | 10.7× |

How to read it:
- The listing now dry-runs every cost (and places a Spell or Trap Card for the run when it has a cost or a target) before it
  offers an effect, so that targets are read on the board the cost leaves. That is the whole slowdown: about 1.5 to 2× on
  `legalActions`, 35 to 65 % on list + `act`. The cost is an immutable-value dry run (no undo, nothing copied but the
  cards it moves). Effects whose condition fails never reach the dry run.
- The step 2 target (≥ 10× today's engine, like for like) is at the edge on crowdedHand: 10.7× in the first run, 10.4×
  after the review fixes (0.0701 ms against 0.731 ms), and 9.8× in a later run the same day (0.0706 ms against
  0.690 ms; from about 16× at step 3). Treat it as not met with margin. The next lever is a cheap pre-check beside the
  dry run (the old `cost.can`), which step 4 dropped to keep one source of truth for a cost.
- `used` (once-per-turn keys) is three short arrays on the duel; `isSpent` is an `includes` on one of them and only runs
  for effects that have a `once`. It does not show in these positions.

Trigger-heavy benchmark (`bench/triggers.bench.ts`), mean per call: sweep 0.048 ms in the first run, 0.062 ms after the review fixes (step 3: 0.044), `legalActions`
while the optional triggers are chosen 0.0015 ms (0.0011), a Spell with 4 idle trigger cards 0.0045 ms (0.0036).

New in step 4 (`bench/records.bench.ts`, real cards as effect records), mean per call:

| Case | Mean |
|---|---:|
| `legalActions`: 3 hand cards, a Link Spider, 3 rival hand traps with costs and targets | 0.0015 ms |
| `legalActions`: the rival's window with Ash Blossom (twice) and D.D. Crow in hand | 0.0032 ms |
| Terraforming with 2 Field Spells: activate, both pass, the player chooses | 0.019 ms |

# Rules core, step 4 follow-up (cost choices, several targets, cheaper `act`)

Same machine and day (macOS, Node 20+, 2026-11-23). Mean time per call, one run of `bench/legal-moves.bench.ts`
(today's engine measured in the same run):

| Position | `legalActions` | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|
| opening | 0.0006 ms | 0.0178 ms | 0.378 ms | 21× |
| midgame | 0.0016 ms | 0.0262 ms | 1.566 ms | 60× |
| crowdedHand | 0.0020 ms | 0.0522 ms | 0.745 ms | 14.3× |

What changed, and how to read it:
- The margin that was down to 10.4× on crowdedHand came back from `act`, not from the cost pre-check: `act` used to list every
  action of the duel to check the one it was given; it now lists only what that action's own card could do (`isLegal`, a
  `only` filter in `collect`). The listing itself is unchanged by it. list + `act` on crowdedHand went from 0.0701 ms to
  about 0.052 ms.
- The optional `CostSpec.can` pre-check is in (it costs nothing when absent) and used by one fixture, but it moves nothing on
  the reference boards: their costed effects (hand traps) fail their condition before any dry run. Not a lever here.
- Skipping the placement dry run for an effect with a target and no cost made `legalActions` about 20 % faster but nothing
  else, and would let the listing and the activation read the targets on different boards, so it was not kept.
- Runs are noisy (a second full run had crowdedHand at ±11 % and a mean of 0.0676 ms, which is 10.7× against today's
  engine, with a median of 0.051 ms): the ratio to quote is 14× with the noise in mind, and the floor seen was 10.7×.
- New benchmark rows (`bench/records.bench.ts`) are unchanged within noise (0.0016 to 0.0019 ms listing, 0.0028 ms for the
  rival's window with Ash Blossom and D.D. Crow).

# Rules core, step 5 (negation)

Same machine and day (macOS, Node 20+, 2026-11-23), one run of `pnpm bench` (today's engine measured in the same run). Mean
time per call:

| Position | `legalActions` | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|
| opening | 0.0006 ms | 0.0188 ms | 0.359 ms | 19× |
| midgame | 0.0017 ms | 0.0268 ms | 1.546 ms | 58× |
| crowdedHand | 0.0021 ms | 0.0523 ms | 0.765 ms | 14.6× |

crowdedHand stays at or above 10× today's engine (the step 4 follow-up recorded 14.3×, floor seen 10.7×; same noise applies).
What step 5 adds to the listing: one `duel.summoning` read per offered effect (a field read), the `handIf` check for a hand
Trap that has one, and the Normal Summon / built-in Summon check per hand monster. `isNegated` scans `duel.negations`, empty
except while a card is negated; none of the reference boards has a negation, so it does not show here.

New in step 5 (`bench/negation.bench.ts`, real Solemn Judgment / Solemn Strike / Infinite Impermanence), mean per call:

| Case | Mean |
|---|---:|
| `legalActions`: the rival's window against a Summon (3 Set Counter Traps, Impermanence in the hand, one monster) | 0.0021 ms |
| `legalActions`: your turn with a negated monster and a Normal Summon available | 0.0007 ms |
| A Normal Summon negated by Solemn Judgment, the whole sequence (list, activate, resolve) | 0.0060 ms |

Re-measured after the step 5 review fixes (same machine, one run of `legal-moves.bench.ts`, today's engine in the same run):
crowdedHand 0.0556 ms list + `act` against 0.746 ms: **13.4×** (opening 0.0211 ms vs 0.365 ms, 17×; midgame 0.0277 ms vs 1.691 ms, 61×).
A full `pnpm bench` run earlier the same minute was noisy (today's engine ±35 % on crowdedHand) and is not quoted.

# Rules core, step 6 (destruction event, half LP)

Same machine and day (macOS, Node 20+, 2026-11-23), one run of `bench/legal-moves.bench.ts` (today's engine in the same run):

| Position | `legalActions` | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|
| opening | 0.0006 ms | 0.0186 ms | 0.350 ms | 19× |
| midgame | 0.0018 ms | 0.0275 ms | 1.542 ms | 56× |
| crowdedHand | 0.0022 ms | 0.0577 ms | 0.711 ms | **12.3×** |

crowdedHand stays above 10× (a full `pnpm bench` run just before had a noisy today's-engine mean of 0.727 ms against 0.0659 ms,
11.0×). Step 6's change in the move path is one optional field on `moved`; the listing is untouched.

# Rules core, step 6 (continuous effects, locks, control)

Another machine (Windows 11, Node 20+, 2026-11-23), so the absolute numbers are not comparable with the macOS rows above; the ratio
is. One run of `bench/legal-moves.bench.ts` (today's engine in the same run), mean per call:

| Position | `legalActions` | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|
| opening | 0.0004 ms | 0.0139 ms | 0.785 ms | 56× |
| midgame | 0.0014 ms | 0.0182 ms | 3.293 ms | 181× |
| crowdedHand | 0.0015 ms | 0.0383 ms | 1.142 ms | **29.8×** |

The reference boards have no modifier and no card with a continuous record, so every query returns at once (`quiet`); the
listing's new work is one `requiresAddToHand` flag read per offered effect.

New in step 6 (`bench/continuous.bench.ts`), mean per call:

| Case | Mean |
|---|---:|
| `legalActions`: Skill Drain, Muka Muka and a made-up continuous monster face-up, an ignition monster offered | 0.0016 ms |
| `atk` of Muka Muka under Skill Drain (reads every face-up source, and asks whether each source is itself negated) | 0.0073 ms |
| `legalActions`: your window with Droll & Lock Bird after the rival's search | 0.0009 ms |
| `legalActions`: the rival's turn under Droll's lock (Pot of Greed and Terraforming not offered) | 0.0004 ms |

`atk` on a board with continuous sources is the slow query (it walks the field and checks each source's own negation). Battle
(step 6b) reads it at damage calculation only; a bot that reads every monster's ATK per move should cache per position.

# Rules core, step 6b (battle)

Same Windows machine, same day, but a slower run overall (today's engine itself was ~25 % slower than in the step 6 run). One run
of `bench/legal-moves.bench.ts`: crowdedHand list + `act` 0.0697 ms against today's engine 1.409 ms: **20.2×** (a combined run with
the battle bench just before: 0.0748 ms vs 1.470 ms, 19.7×). The listing's new work outside the Battle Phase is one phase check.

New in step 6b (`bench/battle.bench.ts`), mean per call:

| Case | Mean |
|---|---:|
| `legalActions`: Battle Step, 3 attackers × 3 targets, a Set Shrink on the other side | 0.0004 ms |
| One attack from its declaration to the end of the Damage Step, nobody responding (5 trigger points, ATK/DEF read at damage calculation) | 0.0127 ms |

# Rules core, step 7 (zones)

Same Windows machine, 2026-11-23. One run of `bench/legal-moves.bench.ts` with `bench/triggers.bench.ts` and `bench/zones.bench.ts`,
mean per call:

| Position | `legalActions` | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|
| opening | 0.0005 ms | 0.0171 ms | 0.806 ms | 47× |
| midgame | 0.0017 ms | 0.0224 ms | 3.283 ms | 147× |
| crowdedHand | 0.0020 ms | 0.0442 ms | 1.127 ms | **25.5×** |

Every hand card that can be placed is listed once with its free `zones` (not once per zone); the free zones are read once per
listing. `act` uses the zone listed, without listing again.

New in step 7 (`bench/zones.bench.ts`), mean per call (the query rows from a first run, the listing rows after the free zones were cached per listing):

| Case | Mean |
|---|---:|
| `pointedZones` of every monster on the field (3 Link Monsters, 1 other) | 0.0008 ms |
| `summonZones`: a Link Monster from the Extra Deck (linked zones and the Extra Link path check) | 0.0050 ms |
| `summonZones`: a Fusion Monster from the Extra Deck | 0.0003 ms |
| `cardsInColumn`, all five columns | 0.0007 ms |
| `legalActions`: four cards to place with their zones | 0.0016 ms |
| the same under an Infinite Impermanence column negation | 0.0019 ms |

`bench/triggers.bench.ts`'s crowded board had ten monsters a side, which exact zones no longer allow: it now has five a side
(10 monsters swept, the same 6 mandatory triggers), so its sweep row is not comparable with earlier rows (0.0206 ms now).

# Rules core, step 8 (Summon procedures)

Same Windows machine, 2026-11-23. One run of `bench/legal-moves.bench.ts` with `bench/procedures.bench.ts`, mean per call:

| Position | `legalActions` | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|
| opening | 0.0006 ms | 0.0188 ms | 0.741 ms | 39× |
| midgame | 0.0024 ms | 0.0337 ms | 3.279 ms | 97× |
| crowdedHand | 0.0022 ms | 0.0531 ms | 1.061 ms | **20.0×** |

(A full run of every bench file just before gave crowdedHand 0.0532 ms against 1.095 ms: 20.6×.) After the review fixes the machine
was busy with other work and the means moved a lot from run to run: over eight more runs of `bench/legal-moves.bench.ts` the
crowdedHand ratio by means went from 12.0× (one run, list + `act` 0.1019 ms against 1.220 ms) to 27.1× (0.0500 ms against
1.356 ms), six of the eight between 16× and 22×; the fastest samples stayed put in every run (0.039 to 0.041 ms against 0.93 to
0.97 ms: 23× to 24×), as before the fixes (0.0394 ms against 0.9026 ms). Every run is above the 10× floor. The reference boards have no
Extra Deck procedure; what they pay for is the new actions: each Level 4 or lower monster of the hand is now also listed as a `set`,
each face-up monster on the field as a `change-position`, each face-down one as a `flip-summon`, and "list + `act`" does every one
of them. The listing itself is within noise of step 7 (0.0020 ms then); a Summon that needs Tributes or materials is listed once,
never once per set of materials.

A lock on Summons is asked of every monster listed. Reading the layers before asking whether their source is negated keeps the
step 6 board (Skill Drain and two Muka Mukas, `bench/continuous.bench.ts`) at 0.0032 ms; with the costly question first it was
0.0254 ms.

New in step 8 (`bench/procedures.bench.ts`), mean per call:

| Case | Mean |
|---|---:|
| `legalActions`: 15 Extra Deck monsters over 5 monsters on the field, 6 cards in hand with a Fusion and a Ritual Spell (7 procedure Summons listed) | 0.0765 ms |
| `legalActions`: the same Extra Deck with no legal set of materials (every search fails at once) | 0.0193 ms |
| A Synchro Summon, from the action to the monster on the field (material and zone choices answered) | 0.0544 ms |
| A Tribute Summon with 2 Tributes, from the action to the monster on the field | 0.0246 ms |
| Polymerization: activation, Fusion Monster, materials and zone chosen, Fusion Summon | 0.0524 ms |
| A Ritual Spell ("equal or exceed", 10 cards to Tribute among): activation, Tributes and zone chosen, Ritual Summon | 0.4433 ms |

The first row is the slow listing of this step: one search per Extra Deck monster (about 0.003 ms each on this board) and the
Ritual Spell's activation condition (0.025 ms: every Main Monster Zone is taken, so the search has to find a set with a Tribute from
the field). It is still 14× to 40× under today's engine on its own boards, but it is what step 9 should cache per position if the
bot lists at every node. Choosing materials costs more than listing: each question looks for a legal set once per candidate, and
once more to tell whether a candidate is in every set.

# Rules core, step 9 (bot support)

Same Windows machine, 2026-11-24, Node 22. `bench/legal-moves.bench.ts` (one run), mean per call:

| Position | `legalActions` | vs today's engine | list + `act` | today's engine | ratio |
|---|---:|---:|---:|---:|---:|
| opening | 0.0006 ms | ~1,300× | 0.0193 ms | 0.767 ms | 40× |
| midgame | 0.0025 ms | ~1,300× | 0.0359 ms | 3.308 ms | 92× |
| crowdedHand | 0.0022 ms | ~490× | 0.0498 ms | 1.070 ms | **21.5×** |

Step 9 does not touch the listing or `act`: the listing stays far past the spec's 30× and list + `act` on crowdedHand above the 10×
floor (within the noise of step 8's runs). No per-position cache of the procedure listing was added: the decision times below do not
need it.

`bench/bot.bench.ts`: one `chooseAction` per level for `you` in Main Phase 1 (seed 1), with a budget far above its cost (60 s) so the
expert row is the full sampling (4 candidates × 8 worlds, playouts to the end of the next turn, at most 60 decisions each). Mean (and
max) per decision, 20 runs (expert 5):

| Position | basic | medium | strong | expert |
|---|---:|---:|---:|---:|
| opening (reference) | 0.053 ms | 0.055 ms | 0.047 ms | 2.6 ms (max 3.2) |
| midgame (reference) | 0.083 ms | 0.070 ms | 0.115 ms | 48 ms (max 56) |
| crowdedHand (reference) | 0.049 ms | 0.058 ms | 0.089 ms | 7.8 ms (max 10) |
| handTrapMidgame (`bot-boards.ts`: real cards, hand traps in both hands, Set cards both sides) | 0.82 ms | 0.73 ms | 1.06 ms | **308 ms (max 378)** |

After the review fixes (playouts check the clock; a line's step comes on top of the 4 greedy candidates) one more run gave expert
2.0 / 34 / 6.8 / **241 ms (max 278)** on the same four boards.

The expert decision is under the spec's 1.5 s by about 4× on the heaviest board; its default budget (1,200 ms) is a cap, not the
expected cost. The boards have no plan, so medium and strong play as basic here (the differences are noise). Node, not a browser or
a tablet: a Worker on a slow tablet should be measured in step 10.

## Real-deck readiness: choices and Deck operations (2026-11-24)

Modes, declarations and coupled targets are read in `activationWays` (a record with none keeps its one facet, itself, with no new
allocation; facets of a record with modes are cached per record). `npx vitest bench --run bench/legal-moves.bench.ts`, one run, means:

| Position | `legalActions` | list + `act` | today's engine | list + `act` speed-up |
|---|---:|---:|---:|---:|
| opening | 0.0006 ms | 0.0200 ms | 0.776 ms | 39× |
| midgame | 0.0022 ms | 0.0392 ms | 3.329 ms | 85× |
| crowdedHand | 0.0023 ms | 0.0536 ms | 1.207 ms | **22.5×** |

crowdedHand list + `act` stays above the 10× floor, in line with step 9's 21.5× (0.0498 ms against 1.070 ms).

## Real-deck readiness: delayed effects, restrictions, protections (2026-11-24)

Every listing now asks whether an activation is locked (`activationLocked`) and whether a target is protected (`canBeTargetedBy`). Both
answer from one read per Duel value (`locksNow` and `anyShield`, cached in a `WeakMap`; nothing is read when the Duel has no modifier
and no card with a continuous record), and delayed effects, watches and the destruction check are skipped on an empty list.
`npx vitest bench --run bench/legal-moves.bench.ts`, the last of four runs, means:

| Position | `legalActions` | list + `act` | today's engine | list + `act` speed-up |
|---|---:|---:|---:|---:|
| opening | 0.0008 ms | 0.0163 ms | 0.794 ms | 49× |
| midgame | 0.0024 ms | 0.0460 ms | 4.691 ms | 102× |
| crowdedHand | 0.0024 ms | 0.0568 ms | 1.142 ms | **20.1×** |

crowdedHand list + `act` stays above the 10× floor. Over the four runs it took 0.0567, 0.0617, 0.0568 and 0.0568 ms, against 0.0536 ms
in the previous slice: about 6% more (each activation is now noted in `Duel.activations`, and each listing asks the two caches and
whether a delayed effect is owed). The listing alone is where it was (0.0022 to 0.0023 ms before on midgame and crowdedHand; the runs
vary more than that, the first one giving 0.0029 and 0.0030 ms on a busier machine).

## Real-deck readiness: review fixes (2026-11-24)

After the review fixes (cards moved together judged as a group in `moveCards`, a Summon's events raised once its group is placed, the
`requiresDraw` gate, the Skill Drain ordering, a chain that stops when the Duel is decided). `npx vitest bench --run
bench/legal-moves.bench.ts`, four runs on a machine that was busy for the first, crowdedHand list + `act` against today's engine:
0.0692 / 1.173 ms (17.0×), 0.0550 / 1.069 ms (19.4×), 0.0567 / 1.084 ms (19.1×), 0.0583 / 1.090 ms (18.7×). The listing alone took
0.0023 to 0.0032 ms on crowdedHand. list + `act` is where the previous table had it (0.0568 ms); the ratio moves with today's
engine's own time, and stays above the 10× floor.
