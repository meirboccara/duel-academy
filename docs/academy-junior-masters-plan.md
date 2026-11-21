# Junior: build plan for phases, Spell/Trap types, Battle steps and the masters' island

Source of the decisions: [research note §5.8](./research/academy-phases-spells-traps-endgame.md). Started 2026-11-20.

## Step 1: real cards replace the seven invented Spells and Traps (islands 1-8)

Ids stay (saves store level ids, never card ids); data, art and copy change. Texts: YGOPRODeck en/fr (Konami wording).

| Old id | Real card | Change for the levels |
| --- | --- | --- |
| `glow-charm` | Red Medicine (Normal Spell, +500 LP) | none |
| `spark-dash` | Rush Recklessly (Quick-Play, +700 ATK until end of turn) | numbers only; target own monster (other side left out) |
| `thunder-clap` | Offerings to the Doomed (Quick-Play: destroy target face-up monster, skip your next Draw Phase) | foe target only (own side left out); skip-draw rule added to the engine |
| `sticky-vine` | Draining Shield (Normal Trap: negate the attack, gain LP = its ATK) | gains LP |
| `quick-burrow` | Compulsory Evacuation Device (Normal Trap: target 1 monster on the field; return it to the hand) | own monster, in answer to a Spell (other uses left out) |
| `spark-trade` | removed: levels use `lightning-vortex` (same effect in Junior: no Set monsters) | |
| `fog-snare` | removed: levels use `sakuretsu-armor` | numbers re-tuned |

## Step 2: phases explained

- One sentence per phase, said by the mentor the first time its chime appears (FR/EN/HE).
- Island 6 needs all six phases: a new level that needs Main Phase 2; `w6-double` names the Standby Phase.
- Island 5's mentor line says the board starts in Main Phase 1.

## Step 3: every Spell and Trap type

New island `icons` after island 9: Normal, Quick-Play (Set, used on the rival's turn), Continuous Spell (Banner of
Courage), Equip Spell (Legendary Sword), Continuous Trap (Call of the Haunted), Counter Trap (Negate Attack; Magic
Jammer left out: its discard cost on a flipped card needs a new choice on screen). The card reader names every icon.

## Step 4: Battle Phase steps

- The attack is two windows: Battle Step (declaration: "when an attack is declared" Traps) then Damage Step
  (Quick-Play boosts, Kuriboh "during damage calculation"); a window opens only when the answering player can use it.
- The clash banner names the step. New island `steps` before the Nox duel, with the step explanation.

## Step 5: the masters' island (after the Nox duel)

- 13 trainers, each a bot with its own anime deck (40 cards, Extra Deck up to 15), shuffled, 8000 LP.
- The bot is a policy over `legalMoves` with a personality per trainer; no per-turn script.
- The child picks one starter deck once; its cards join the binder; a deck editor builds from the binder (40 cards,
  up to 3 copies, Extra Deck up to 15).
- Beating a trainer the first time earns stars; any trainer can be rematched. Shop cards unlock with progress.
- Cards in decks must be automated by the engine: decks are drawn from each character's anime cards that the engine
  plays exactly; a card the engine cannot play exactly is left out of the deck, never changed.

## Left out (stated, not changed)

Set monsters and Flip effects, replays, the hand-size limit, Spell Speed beyond "Counter Traps answer Spells".

## Status (2026-11-20)

All five steps are built and tested (918 tests, typecheck, production build). What is still open:

- Decks with `filler` (not from the anime): Arkana, Yami Bakura, Pegasus, Yami Marik, Yusei. They need more anime
  cards automated first (Toons, Stardust Dragon, Speed Warrior, Ra, Dark Necrofear…).
- Card texts of the trainers' cards come from YGOPRODeck (Konami's wording), not checked one by one against Konami's
  database; Hebrew shows them in English without a written meaning.
- The bot is greedy (one move ahead): it never plans a combo over two turns, and it never sees face-down cards.
- Not tried with children: deck size (40) and 8000 Life Points make long duels.

## Owner's answers (2026-11-20, after the first build)

- Non-anime cards in a deck are fine when the anime gives too few the engine plays (`filler` in `master-decks.ts`).
- Trainers have levels: basic (Rex Raptor, Weevil, Mako), medium (Joey, Arkana, Yami Bakura), strong (Pegasus,
  Yugi, Jaden, Yusei), expert (Yami Marik, Kaiba, Atem). The level is shown after the trainer's name. A basic trainer
  plays one move at a time, often a weaker one, and answers with its Traps half the time; medium and strong trainers
  look one move further (Summon, then attack), medium still making mistakes; an expert looks two moves further and
  always plays its best. Simulated with the same deck (20 duels each): medium beats basic 16 times, strong beats medium
  14, expert beats strong 12 and basic 18 (`MASTER_TIER`, `TIER_PLAY` in `masters.ts`).

## Starter Extra Decks and the TCG banlist (2026-11-21)

- Every Deck (the 13 trainers' and the 3 starters') follows the current TCG Forbidden & Limited List: the status of
  each card is fetched with its facts (`ban` in `card-art.ts`), `copiesAllowed` / `deckProblems` enforce it, the Deck
  editor too, and `masters.test.ts` checks every Deck. Pot of Greed and Heavy Storm are Forbidden: the trainers who
  used them in the anime get Upstart Goblin / Harpie's Feather Duster instead (listed as filler). Red-Eyes Dark Dragoon
  and Crystal Wing Synchro Dragon were considered and left out: Forbidden.
- Starters, each around a legend, with an Extra Deck it can Summon:
  - Dark Magician: Dark Paladin, Dark Magician the Dragon Knight, Dark Magician Girl the Dragon Knight, Black Skull
    Dragon, Gaia the Dragon Champion, Gaia Dragon the Thunder Charger, plus a Synchro, two Xyz and a Link.
  - Blue-Eyes: Blue-Eyes Ultimate Dragon, Twin Burst Dragon, Spirit Dragon (Flamvell Guard is its Level 1 Tuner).
  - Elemental HEROes: Flame Wingman, Shining Flare Wingman, Thunder Giant, Great Tornado, Nova Master, Rampart Blaster.
- Left out as too complex to play exactly: The Dark Magicians, Master of Chaos, Dark Cavalry, Neo Blue-Eyes Ultimate
  Dragon, Blue-Eyes Tyrant Dragon, Azure-Eyes Silver Dragon. Optional "you can" effects are always used (Twin Burst
  banishes, Spirit Dragon negates the opponent's Graveyard effects); Spirit Dragon's Tribute calls a LIGHT Dragon
  Synchro the starter does not have yet.
- Simulated against the 13 trainers (expert bot on the child's side, 52 duels): Dark Magician 41, Blue-Eyes 44,
  Elemental HEROes 30 wins: the HERO Deck is the hardest to win with. A Deck saved with cards a starter no longer
  has, or breaking the banlist, becomes the starter's new Deck when the game opens (`refreshDeck`).
