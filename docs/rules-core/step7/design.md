# Step 7: exact zones

Status: built 2026-11-23 (`packages/rules/src/zones.ts`, `duel.ts`, README step 7 section, tests in `test/rules/zones.test.ts` and the Infinite Impermanence and Link Spider card tests).

Approved seams: `legalActions`/`act` for choices and real cards; public board queries for columns, arrows, co-links and shared Extra Monster Zones; public movement/equip operations for occupancy, Field replacement, Pendulum placement and equip cleanup. TDD is one red/green slice at a time. No changes to Junior or the old engine.

## Model

Keep controller-keyed compact piles for existing card scripts. Add an exact `slot` to each on-field card, not a second mutable board representation. Main and Spell/Trap slots are 0–4 from their controller's left. Monster slots 5–6 denote the two physical shared Extra Monster Zones from **you**'s perspective, regardless of controller. Field has slot 0, outside columns. Off-field cards have no slot. Board queries translate perspective explicitly. Occupancy is checked at the movement boundary, including both players for shared zones.

Link arrows use a fixed geometry: your Main row y=0, shared Extra row y=1 at x=1 and 3, rival Main row y=2. Rival arrows rotate 180 degrees. Arrows point to adjacent Monster Zones only, never through the empty middle positions or to Spell/Trap Zones. Co-link means reciprocal arrows, even across controllers. Negation does not erase printed arrows. Extra Deck destination queries apply the current rules update, not RB10's outdated restriction on Fusion/Synchro/Xyz. The second Extra Monster Zone requires the incoming Link monster to complete an Extra Link; this exception is judge-backed pending a Konami text.

A Pendulum card activated as a Spell occupies slot 0 or 4 of the same Spell/Trap row; its Pendulum status distinguishes it from an ordinary card merely occupying an outer slot. Its monster effects and Pendulum effects use separate ranges. Pendulum cards sent from the field to the GY go face-up to the Extra Deck, except negated activations/Summons. Procedures and materials are step 8, not part of placement.

Field activations/Sets go to the Field Zone, sending the old Field Spell to the GY (not destroying it), even when the replacement's activation is later negated. Equip Cards remain in Spell/Trap slots; their relation to a face-up monster survives slot/control changes and is removed when the Equip leaves. If the monster leaves/turns face-down, destroy its Equip Cards. Monsters as Equip Cards and other special objects remain step 11.

## Choices

Exact destinations belong to actions: each Summon, Set and activation from the hand is listed once with `zones` (not once per zone, to keep the listing fast); `act` takes the `zone` named among them, or the first listed. Resolution-time placement and control returns pause on a public zone choice with a continuation. Low-level `moveCard` retains first-free defaults for setup compatibility; it validates explicit destinations and never overwrites occupied slots. Legal-action callers must use listed actions.

Control return is resolved before normal End Phase play, by the receiving player, sequentially if several cards return. Full receiving Main zones destroy the monster by game mechanics (judge lead; distinguish from a card effect in the docs). Existing step 6 identity semantics across control changes remain; equip links use physical identity and are not accidentally lost with that counter.

## Real card integration

Infinite Impermanence records whether it was Set at activation. Successful monster negation plus the same Trap still on the field applies a turn-long column modifier, using its column at application. S/T effects activated in the column are negated even if the source leaves as cost (Konami Wonder Wand Q&A); continuous S/T effects in that column are also negated. Later arrivals are covered, other columns/Field/hand/GY effects are not. Do not remove the partial marker until regressions cover these distinctions.

Link Spider gains its printed bottom arrow; activation requires a free own pointed Main zone and a legal Normal Monster in hand. Resolve against the current board, choosing card and zone. The `summoned` event for a Summon by effect is left to step 8 (README). Link Summon material legality remains step 8.

## Validation

Each geometry/movement/card slice adds a citing seam test and is run red before implementation, green afterwards. Typecheck regularly; full rules tests and fixed-reference benchmarks at completion. A separate review is required; confirmed findings are fixed before handoff. README records remaining limitations and judge-only interpretations rather than claiming full tournament procedure coverage.
