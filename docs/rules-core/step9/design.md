# Step 9: Bot support

Status: built 2026-11-23 (`packages/rules/src/bot/`, `packages/rules/src/bot-worker.ts`, README step 9 section; tests in
`packages/rules/test/bot/`; `bench/bot.bench.ts` and the step 9 table in `bench/BASELINE.md`).

Approved seams (owner, not asked again): (1) `viewFor(duel, side)` + `redeal(view, seed)`; (2) named moves and combo lines;
(3) `evaluate(duel, side)`; (4) `chooseAction(duel, side, { level, budgetMs, seed })`; (5) the worker message protocol as a pure
function, plus a worker entry file. TDD, one red/green slice at a time. Junior, `apps/` and the old engine are untouched; wiring the
worker into the app is step 10.

Inputs: [meta-deck-bot-approach.md](../../research/meta-deck-bot-approach.md) (wayfinder ticket #4: the hybrid, general bot +
per-deck combo lines as data + determinized Monte Carlo sampling for expert; no ISMCTS, no self-play).

## Model

### What one player can see (`viewFor`)

A `View` is `{ side, duel, unknown }`. `duel` is the Duel with every card the viewer cannot see given the code `HIDDEN` (`"?"`):

| Hidden from `side` | Not hidden |
|---|---|
| the opponent's hand | `side`'s own hand |
| both Decks (contents and order; `side` knows its own Deck's contents, not its order) | every face-up card, on the field, in the GY, banished face-up, Xyz Materials |
| the opponent's face-down cards on the field (monsters, Set Spells/Traps) | `side`'s own face-down cards (it Set them) |
| the opponent's face-down Extra Deck (its face-up Pendulum Monsters are public) | `side`'s own Extra Deck |
| the opponent's face-down banished cards | the chain (an activated card is revealed), cards `side` is being asked to choose from |
| a hidden card whose trigger waits (a world drops the trigger if the card is dealt a code without it) | |

Everything else (counts per zone, ids, zones, positions, `moves`, LP, the chain, once-per-turn uses, modifiers, turn, priority) is
public and kept. Events kept in `live`, `lingering`, `waiting` and a paused chain's `carried` carry card snapshots; their codes are masked the same way (a card
drawn face-down is not revealed by the `moved` event of the draw).

`unknown` is what the viewer may deal from: per owner, the sorted multiset of hidden codes in each **pool**:
- `main`: the hidden Main Deck cards (hand, Deck, face-down field cards, face-down banished) of that owner;
- `extra`: the face-down Extra Deck of that owner.

**Decision D1 (decklists are known).** The pool is the true multiset of the hidden cards, so the viewer "knows" the opponent's
decklist but not where each card is. This is Forge's `HiddenInfoShuffler` and the usual open-decklist assumption of tournament
play; a model of plausible meta lists can replace the pool later without changing the seam. Sorting the pool means the view carries
no order.

### Re-dealing (`redeal`)

`redeal(view, seed)` gives a full legal Duel: each hidden card keeps its id, zone, slot, face, position and history; only its code
is dealt from its pool (a seeded `createRng` Fisher-Yates). Codes, not ids, are dealt, so everything keyed by id (the chain, Set
this turn, modifiers, attacks) stays true. Constraints are dealt first, most restrictive first: a face-down Field Zone card gets a
Field Spell, a face-down Spell & Trap Zone card a Spell or Trap that is not a Field Spell, a face-down monster a Main Deck monster; the rest goes to the
hand, the Deck and face-down banishment. If a greedy deal ever paints itself into a corner the card is given a code that fits from
what is left, else the first left (a world that can only arise from an inconsistent pool). The same view and seed give the same
world, and the view alone is read, so a re-deal cannot leak what the view does not hold.

### Named moves (`actionName`)

The fixtures' labels become the public names: `pass`, `activate terraforming`, `activate mst > set-card`, `activate x ~ paid`,
`summon x`, `special-summon x`, `set x`, `flip-summon x`, `change-position x`, `pendulum-summon`, `attack big > small`,
`attack big directly`, `choose umi`, `place 2`. A card with two or more effect records adds `#n` (1-based) to `activate`. A step of a
combo line may add ` @z` (zone) and ` as defense` / ` as attack` to a placing action; without them the first listed is used.

A **combo line** is data: `{ name, steps: string[] }`; a deck's plan is `{ lines }`, the first line being the main line. `followLine`
plays a line step by step through `act`, and stops cleanly at the first step that is not legal (`{ duel, played, failed: { index,
step, offered } }`). Steps are only the bot's own decisions: the opponent's answers happen in between.

### Evaluation (`evaluate`)

From `side`'s view only (it reads exactly what `viewFor` keeps, so `evaluate(duel, s) === evaluate(viewFor(duel, s).duel, s)` up to
the masked codes it never needs): mine minus theirs of
- LP / 100; a won Duel is +1,000,000, a lost one -1,000,000, a draw 0;
- board: each face-up monster 3 + ATK / 200 (Attack Position) or DEF / 250 (Defense Position); a face-down monster 4; each other
  card on the field 2;
- card advantage: 3 per card in hand, 0.5 per Extra Deck monster that can still come out (counted, not read), 0.1 per card in the
  GY (fuel);
- **interruptions**, 2 each: a monster in hand with a Quick Effect usable from the hand whose once-per-turn use is not spent (hand
  traps); a Set Trap, Quick-Play Spell or Counter Trap whose activation's use is not spent (Set this turn included: it guards the
  opponent's turn) (an opponent's Set card is unknown: 1 each); a face-up card with a Quick Effect
  on the field whose use is not spent ("untapped").

The weights are first guesses (the old `bot.ts` used the same scale: 3 per hand card). A hand trap is worth its card plus its
interruption, so the bot keeps it rather than pitching it to a cost, and spends it only when what it stops is worth more than 5
points (a 3000 ATK monster is 18): denying a plain search is card-for-card and is not taken (known limit).

### The bot (`chooseAction` / `decide`)

Always on a re-dealt world, never on the real Duel: the bot first takes `viewFor(duel, side)` and deals worlds from it. The action
returned is one of `legalActions(duel)` (ids are the same in every world).

- **Quick choice** (fallback): the next step of the active line if legal, else the first listed action (`pass` in a window, the
  first card when a choice must be made). Computed first, returned when the budget is gone.
- **Greedy (1-ply)**: each legal action is played on world 0, then the Duel is **settled** (the opponent passes, `side`'s own
  questions take the first answer, until `side` decides again or the turn changes), and evaluated. Best score wins; ties go to the
  earlier action, so the result is deterministic.
- **Lines** (medium, strong, expert): if a line is active and its next step is legal, play it. A line starts when its first step
  is legal while `side` decides in an open state of its own turn. When the next step is not legal while `side` decides in an open
  state or is asked a question, the line has failed: medium drops to greedy; strong and expert switch to another line of the plan
  that shares the steps played so far and whose next step is legal. In other windows (a chain to answer) a step that is not legal
  just waits. Progress (`{ line, step }`) is returned with the decision and handed back on the next call (the bot holds no state).
- **Sampling** (expert): at a decision with two or more candidates while hidden cards exist, the top K = 4 greedy candidates (plus
  the line step, with a bonus of 3 points so sampling overrides a line only for a clear gain) are compared over N = 8 worlds
  dealt from the view (the same worlds for every candidate: common random numbers). A playout reads the clock before each decision and
  is abandoned, with its world, when the time is up. Each playout plays the candidate, then both
  players with the greedy policy (no settling passes: the opponent answers with what it holds in that world) to the end of the
  next turn, at most 60 decisions, and evaluates. Worlds are taken one at a time across all candidates, so a budget cut leaves every
  candidate with the same worlds. The mean wins.

Levels: `basic` greedy, no lines; `medium` greedy + the main line only; `strong` greedy + all lines; `expert` strong + sampling.
Mistakes and personas (`skill`, `answers`, `aggression` of today's masters) are step 10's (the app's), not the core's.

**Budget and determinism.** The clock is injected (`now`, default `performance.now`); the core itself still reads no clock. The
budget is checked between candidates (greedy) and between playouts (sampling); when it runs out, the best complete answer so far is
returned, else the quick choice. With the same Duel, seed, plan and progress, and a budget that is not reached, the answer is the
same; once the budget cuts the work, it can depend on the machine's speed (as Forge's does).

### Worker protocol

`BotRequest = { id, setup, actions, side, level, budgetMs?, seed, plan?, progress? }`, `BotAnswer = { id, action, name, progress }`
or `{ id, error }`. A Duel holds functions (card records, the continuation of a question), which do not cross `postMessage`, so the
request carries the Duel as **its setup and the actions played since** (both plain data); the worker rebuilds it with the card
records it was given. `answerRequest(request, defs)` is the pure function; `serveBot(scope, defs)` binds it to a worker scope's
`onmessage`; `src/bot-worker.ts` is the entry (`serveBot(self, CARD_DEFS)`), not exported from `src/index.ts`.

## Slices (TDD, red then green, each at a seam above)

1. `viewFor` hides the opponent's hand and both Decks' order, keeps own hand and public cards.
2. `viewFor` hides the opponent's face-down field cards and face-down Extra Deck, keeps their face-up Pendulums, keeps own Set cards.
3. Two Duels that differ only in what `side` cannot see give the same view (events masked too).
4. `redeal` keeps every visible card and every count, deals hidden codes from their pools, is deterministic per seed, differs across
   seeds, and gives a playable Duel (`legalActions` / `act`); face-down cards get codes that fit their zone.
5. `actionName` on each action kind; `findNamed` with `@zone`.
6. `followLine` plays a line to its end; stops at the first step that is not legal, saying which.
7. `evaluate`: LP, board, hand, interruptions (hand trap, Set card, untapped Quick Effect, a spent one not counted); symmetric; ignores
   hidden cards.
8. `chooseAction` returns a legal action at every level, in every kind of decision (open state, chain window, question).
9. Determinism: same seed same answer; same answer for Duels that differ only in hidden cards.
10. Lines: medium follows the main line; when it fails medium falls back to greedy; strong switches to the alternative.
11. Expert: a fixed position where the opponent's likely hand trap makes the greedy choice bad; expert picks the safe one, basic does
    not.
12. Budget: a clock that runs out at once gives the quick choice, in time.
13. Protocol: `answerRequest` rebuilds the Duel and answers; errors are answers; `serveBot` posts the answer.

## Speed plan

- Listing and `act` are unchanged (step 8's numbers stay); the bot adds no work to `legalActions`.
- Greedy costs one `act` + settle per action (about 0.05 ms each on the reference boards). Expert costs K x N playouts; measured in
  `bench/bot.bench.ts` on the reference boards and a midgame board with hand traps, target <= 1.5 s, default expert budget 1,200 ms.
- A per-position cache of the procedure listing is added only if the bench shows it is needed (README step 8: 0.08 ms per listing
  with fifteen Extra Deck monsters).
