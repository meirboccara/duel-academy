# @duel-academy/engine

The rules of a Yu-Gi-Oh! duel, independent of any app and of any card list.

- **Rules:** the board and its zones, Summons (Normal, Tribute, Flip, Special, Ritual, Fusion, Synchro, Xyz, Link with
  arrows, Pendulum from the hand and the Extra Deck), battle with the Battle Step and the Damage Step (and what may be
  used in each), Spells and Traps, the Chain with Spell Speeds (Counter Traps answer only, and are answered only by,
  Counter Traps), hand traps, "for the rest of this turn" locks, once-per-turn rules, missing the timing.
- **Effect vocabulary** (`effects.ts`, types in `catalogue.ts`): cards are written as data from shared steps (search,
  Special Summon, send, destroy, negate, draw…), triggers (Summoned, sent to the GY, events on other cards), Quick
  Effects, costs, conditions and filters. A card needs no code of its own.
- **Bot** (`bot.ts`): picks moves for a trainer, from a persona.

The engine knows no card. Give it a catalogue once, before the first duel:

```ts
import { apply, board, setCatalogue } from "@duel-academy/engine";

setCatalogue({ cards: { knight: { kind: "monster", level: 4, atk: 1800, def: 1000, art: "" } } });
const result = apply(board({ you: { hand: ["knight"] } }), { type: "place", card: "knight", row: "monsters", zone: 0 });
```

A catalogue package can narrow `CardId` to its own ids by declaration merging (see `@duel-academy/cards`).
`pnpm --filter @duel-academy/engine test` runs a duel with made-up cards.
