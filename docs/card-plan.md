# Card plan

The card half of the wayfinder map "Meta decks playable under full tournament rules" (meirboccara/duel-academy#1),
decided in its ticket "Card plan: order of staples and masters' decks" (#21). The engine half is
[rules-core-spec.md](./rules-core-spec.md); cards are written on the new rules core only.

**Inputs.**
- Coverage notes per deck: `docs/research/*-coverage-2026-11.md`.
- Master pools: wayfinder tickets #7 and #20.
- Rotation rules: ticket #8.
- Definition of done for a card: ticket #9.

## Rules for every card

- A card is written only once the rules-core steps its mechanics need have landed. It must meet the definition of done:
  - tests per printed effect and per applicable ruling, each citing a source record;
  - a coverage check;
  - French text from YGOResources by Konami card id;
  - review by a different model.
- Cards stay exactly as printed. The one exception is Jaden's Academy builds, where every swap is recorded.
- Sonnet writes cards. Opus reviews, and decides when a card needs Fable.

## Wave 1: shared staples (after rules-core steps 2–4)

1. **Hand traps rewritten to the full definition of done:** Ash Blossom & Joyous Spring, Droll & Lock Bird, Ghost Ogre & Snow Rabbit, Mulcharmy Fuwalos, Effect Veiler, Infinite Impermanence.
2. **Missing staples:** Mulcharmy Purulia, Typhoon, Hey, Space Trunade!, Pot of Sloth, Skull Meister.
3. **After step 5 (negation):** Nibiru, the Primal Being, Solemn Accusation, Solemn Judgment, Solemn Warning.
4. **After steps 7–8 (zones, procedures):** S:P Little Knight, The Great Gallant Bandit, Super Polymerization, and the other generic Extra Deck staples named in the coverage notes.

## Wave 2: the masters' decks (after rules-core step 8), in this order

| # | Deck | Master | Mainly needs |
|---|---|---|---|
| 1 | Blue-Eyes | Kaiba | step 8 |
| 2 | Elemental HERO (Academy builds) | Jaden | step 8, Fusion |
| 3 | Dark Magician Light and Darkness Ritual | Atem | step 8, Ritual |
| 4 | Dark Magician | Arkana (red art, by the deck's picture choice) | shares cards with Atem |
| 5 | Shining Sarcophagus | Yugi | shares cards with Atem |
| 6 | Stardust Synchro | Yusei | step 8, Synchro |
| 7 | Toon | Pegasus | |
| 8 | Sacred Beast | Marik | |
| 9 | Unchained | Bakura | |
| 10 | Umi (Beyond the Brave) | Mako | |
| 11 | Fire King | Rex | |
| 12 | Dark Time Wizard | Joey | step 11 |
| 13 | Beetrooper | Weevil | step 11 |
| 14 | Branded Dracotail, Sky Striker, Radiant Typhoon, Artmage, Angelechy, Branded, Elfnote | Solomon Muto | Angelechy and Radiant Typhoon need step 11 |

**Step 11, special board objects:** Tokens, counters, dice, monsters as Equip Cards, and monsters as Continuous Spells.
It is a rules-core step after the switch, because Academy's current cards don't need it.

## When a master switches

- A master keeps today's deck until **2 lists** of their pool are fully done. The other lists join as they are
  finished.
- **Solomon Muto** appears once **2 of his 7 archetypes** are done, with 2 complete lists each. Each further archetype
  joins his random draw when it is finished.

## Combo data for the bot

Each deck's combo data (its main line and the alternatives for common interruptions) is written right after its cards
are done and before its master switches. Sonnet writes it and Opus reviews it. Each level uses it as follows:

| Level | Combo data used |
|---|---|
| basic | none |
| medium | the main line |
| strong | the main line plus the alternatives |
| expert | everything, plus determinized sampling |
