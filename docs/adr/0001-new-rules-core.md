# A new rules core replaces the Junior engine

Meta decks must play under full tournament rules, and that starts with giving each physical card its own identity and a chain where both players alternate responses. Both rewrite the board data that every card and the 43 app files importing `@duel-academy/engine` rely on, so we build a new rules core in a new package (`packages/rules`) instead of extending `packages/engine` in place. Junior keeps running on the old engine until the new core reaches parity: every card Academy scripts today ported, and today's card and engine tests passing. Then the app switches over, the old package is removed, and the new one takes the name `@duel-academy/engine`.

Junior's teaching levels (small board, phases driven by hand, chain limits) become teaching options inside the rules core: they limit what a child is offered and never change how a card resolves.

The core's design may study YGOPro's original core (Fluorohydride/ygopro-core, MIT) as a reference. Card effects are written only from Konami's card text; the GPL/AGPL card scripts (ygopro-scripts, ProjectIgnis CardScripts) and EDOPro's AGPL core are not opened while writing them.

## Considered options

- **Extend in place**: rejected; each step would be a large refactor of a live engine, and the first two steps touch everything anyway.
- **Two engines side by side forever** (old for Junior, new for meta decks): rejected; it doubles the cards and the rules to maintain.

Sources: [full-rules-engines-chains-timing.md](../research/full-rules-engines-chains-timing.md), [meta-deck-bot-approach.md](../research/meta-deck-bot-approach.md); decided in wayfinder ticket "Extend the current engine or build a new rules core?" (meirboccara/duel-academy#6).
