# @duel-academy/cards

The cards Duel Academy plays, as a catalogue for `@duel-academy/engine`: every card's rules (`cards.ts`) and its
printed facts from YGOPRODeck (`card-art.ts`, generated from `card-art.json` by the app's
`pnpm --filter academy-ygo cards:art`, which also makes the pictures the app serves).

Importing the package gives the cards to the engine and narrows the engine's `CardId` to these ids:

```ts
import "@duel-academy/cards";
```

The tests here play the engine's rules with these cards (`pnpm --filter @duel-academy/cards test`).
