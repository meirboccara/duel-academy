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
- `src/effects.ts`: a provisional effect shape, replaced by effect records in step 4.
- `src/rule-sources.ts`: the rules cited by the tests in `test/rules` with `cites("rules", id)`.
