# Academy Junior play

Route: `/junior` in `apps/academy-ygo` (dev: `http://localhost:3220/junior`). It replaces the story-and-quiz pilot as
the Junior entry; the pilot is kept unchanged at `/junior/quiz` (see `academy-junior-pilot.md`) and linked from the
bottom of the map as an extra. Design source: `docs/research/junior-mode-playful-learning.md`, build order steps 1
and 3 to 9. Step 2 (testing with children) and step 10 (parents' corner) were left out on the owner's instruction.

## What it is

A hundred and one levels on 21 islands (88 lessons and puzzles, then 13 duels against the trainers of the masters'
island; see "Phases, card types, steps and the masters' island" below). Worlds 1 to 8 are played on a mini duel board
(three Monster Zones and three Spell & Trap Zones per side, 4000 Life Points); the later worlds on the whole mat (see
"The whole mat" below). Each level adds at most one rule. There is no question screen: the child taps a card and then a zone, or a
Monster and then its target, and the board plays the rule out.

| World | Levels | Rules |
| --- | --- | --- |
| 1 The Deck wakes up | 5 | card kinds and zones ("Fill the field"), ATK against ATK, a tie ("Clash!") |
| 2 Shield or sword | 5 | Defense Position, Life Points, direct attacks |
| 3 Call a friend | 8 | one Normal Summon per turn, Tributes (with Dark Magician and Blue-Eyes White Dragon), the phase bar (four phases) |
| 4 Spells and Traps | 4 | Normal Spell in the Main Phase, Trap Set then flipped on the rival's turn |
| 5 Win this turn | 10 | puzzles: earlier rules, not named |
| 6 Turtle tower | 2 | a two-link chain; the six phase names |
| 7 The rival's challenge | 1 | a whole duel from turn 1 against a scripted rival, then a printable certificate |
| 8 Read the card | 9 | rulings in real card wording: a cost before the `;`, Target, Quick Effect against Main-Phase-only effects, once per turn, "When… you can" against "If… you can" |
| 9 The whole mat | 7 | the Graveyard as a place you can use (Monster Reborn, "either GY"), the Field Zone (Mountain, "on the field" is both players), banished cards (Dimensional Prison against Sakuretsu Armor; Pot of Desires face-down), then every card to its zone |
| 10 The Ritual | 3 | Ritual Summon: the Ritual Spell, the Ritual Monster in the hand, Tributes from hand or field whose Levels reach "8 or more" |
| 11 Fusion | 3 | the Extra Deck; Polymerization and the materials a Fusion Monster names, from hand or field, sent to the Graveyard |
| 12 Synchro | 3 | exactly one Tuner, Levels that add up exactly, no Spell |
| 13 Xyz | 4 | same Level, materials under the monster; detaching one as a cost (Number 39: Utopia), and what happens with none left |
| 14 Link | 3 | Link Rating = number of monsters, the Extra Monster Zone, no DEF and no Defense Position |
| 15 Pendulum | 3 | two Scales in the Pendulum Zones, a Pendulum Summon from the hand of Levels between them, a destroyed Pendulum Monster going face-up to the Extra Deck |
| 16 Every word counts | 5 | real cards where one word decides: a cost that fills the Graveyard, no "Target" (Fissure), "then" (Upstart Goblin), a condition with no colon (Cyber Dragon), a Quick Effect in the hand (Kuriboh) |
| 17 Legends | 3 | three Blue-Eyes White Dragons fused into Blue-Eyes Ultimate Dragon; Exodia the Forbidden One: the five pieces in the hand win the Duel, whatever the Life Points |
| 18 The Extra Deck duel | 1 | a whole duel on the whole mat against a rival that Fusion and Xyz Summons, then a second certificate |

- **Show, then do.** The level that introduces a rule opens on a stepped demonstration ("Watch first") made by the
  same rules engine; it waits for a tap after each step and is on "Show me" afterwards.
- **Feedback is the board.** A move that breaks a rule changes nothing and gets one line saying which rule. A losing
  move is played out, then "Go back one step" or "Start again". After three failed tries the next move is shown.
- **The rival's turn** advances one step per tap. When the rival attacks or plays a Spell and the child has a Set Trap
  that can answer, the game freezes until the child flips it or lets it happen.
- **Hidden assessment.** From the moves alone the app stores, per level: solved, solved without a hint, solved on the
  first try; and how often each rule was broken. A rule counts as "used again without help" once a later level that
  needs it was solved without a hint. Stars mark levels solved without a hint. Nothing is sent anywhere.
- **Rewards.** No timer, streak, score or leaderboard. The cards of solved levels appear in an album.
- **Animation** shows what the rules did: a card landing or turning sideways, the two fighters meeting with the
  subtraction, the Life Point bar draining, the chain stack, and the effects and scenes below. The only pieces that
  are there for joy alone are the stars of a won duel and the legendary cards' scenes. Calm mode and the device's reduced-motion setting
  turn all of it off (`MotionConfig`, `data-motion`).
- **Card effects are shown, not only told.** Every event of the rules engine becomes a cue (`effectCues` in
  `lib/junior/play/cues.ts`, a pure function of the board before, the events and the board after), and `BoardStage`
  plays the cues over the board, beat after beat: the card that acts, sparkles flying to Life Points that count up,
  lightning on a destroyed monster, a swirl to the banished cards, materials coming together for a Summon. Lightning
  flashes once, on one zone, and "destroy all" strikes every zone in the same beat. The sentence under the board
  stays; with motion off no cue plays.
- **Summon scenes** (`summon-scenes.tsx`) show the rule of each way of Summoning, with its sum under it: a Ritual circle
  with the Tributes' Levels, a purple whirl for Fusion, the Tuner's rings and the stars of the other Levels for
  Synchro, materials that circle the Xyz Monster, a Link square whose arrows light up to the Link Rating, a pendulum
  swinging between the two Scales. A beat lasts as long as its longest cue (`timeline` in `cues.ts`), and the new
  monster lands in its zone when its scene ends.
- **Legendary cards.** Dark Magician and Blue-Eyes White Dragon (world 3, Tributes), Blue-Eyes Ultimate Dragon and
  Exodia the Forbidden One (the Legends world) are real cards with their real numbers and text. Each has a scene of
  its own, drawn with CSS and SVG. The famous moments of the anime are retold as levels (five pieces of the Forbidden
  One in the hand win the Duel; three Blue-Eyes fuse into one), with no footage: anime clips are copyrighted, and the
  Junior page loads nothing from a third party.
- **Voice and sounds** are off until the child turns them on, and off again each time the game opens (turning them on
  lasts for that visit). The voice is a speech voice that runs on the device
  (`speechSynthesis`, `localService` only; silent when there is none), the sounds are made with Web Audio (short tones, and a burst of noise for thunder). No audio
  file, no third-party player, no video embed. In Hebrew the voice speaks the English line (`VOICE_LOCALE`), because
  the cards a Hebrew-speaking child reads are in English.
- **Languages.** English, French and Hebrew from `copy-{en,fr,he}.ts`. The board is never mirrored; sums stay
  left-to-right. Phase names, ATK and DEF stay in English as in the rest of the site.
- **Hebrew keeps the English card words.** No card exists in Hebrew, so Hebrew text shows each card word in English
  beside the Hebrew one ("זימון (Summon)"), card names are English, and card text is printed in English with its
  Hebrew meaning underneath. `copy.test.ts` checks that every Hebrew line carries the English card words its English
  line uses. French keeps French terms; its card text follows the style of French cards.
- **Card text** follows real-card wording (Problem-Solving Card Text): a cost before the `;`, "Target" only on cards
  that target, "(Quick Effect)" and "once per turn" written out. Picking a card shows its text in a reader panel.
- **Cards.** The 14 plain monsters of worlds 1 to 8 are real Normal Monsters (Silver Fang, Mystical Elf, Battle Ox,
  Judge Man, Cosmo Queen and the others), kept under the old internal ids; their numbers are the printed ones, and
  only `pe-between` changed (a Level 2 Happy Lover, rival at 3200). Eleven original cards remain: four Effect
  Monsters and seven Spells and Traps with effects written for the lessons, drawn with emoji. Dark Magician and
  Blue-Eyes White Dragon appear in world 3; from world 9 on, 31 more real cards appear under their real names, with
  the numbers and the text of Konami's card database (English and French read from the database on 2026-11-17;
  Hebrew shows the English card with its meaning underneath).
- **Card art.** Every real card shows its official cropped art inside the app's own frame, so the name and text stay
  translated HTML. The pictures are our own copies (`public/cards/<picture id>-160.webp` and `-480.webp`), made once
  from YGOPRODeck by `pnpm --filter academy-ygo cards:art` from the list in `src/lib/junior/play/card-art.json`
  (YGOPRODeck forbids hot-linking). The script also writes `src/lib/junior/play/card-art.ts`; never edit it by hand.

## "When… you can" against "If… you can"

Two cards carry the same Graveyard effect with a different first word: Busy Bee ("If this card is sent to the GY: You
can inflict 500 damage to your opponent.") and Dozy Moth ("When this card is sent to the GY: …"). Such effects wait
until the Chain has resolved (`Board.triggers`). "If…" always gets its chance. "When…" misses it when something else
happened right after the card went to the Graveyard: discarded as a cost (the card being activated comes after) or
Tributed for a Tribute Summon (the Summon comes after). Destroyed in battle or by a Spell, nothing comes after, so it
works. For a child the miss is told by naming what came last: "Here, activating the Spell came last."

## The whole mat

Design source: `docs/research/junior-zones-extra-deck-card-reading.md` and the owner's answers in its §8.1.

- **Zones.** Per player: five Main Monster Zones, five Spell & Trap Zones (the leftmost and rightmost are the
  Pendulum Zones while a Pendulum Monster is there), a Field Zone, the Graveyard, the Deck, the Extra Deck, the
  banished cards, and one Extra Monster Zone. A zone shows the picture and the number; its label and the reader
  panel carry the rest. A line under the mat says what each small picture stands for.
- **Piles open.** Tapping a Graveyard or the banished cards (either player's) or your own Extra Deck opens it with
  every card and its text. The rival's Extra Deck stays closed. Face-down banished cards are counted, not shown.
- **Placement** follows Konami's 2021 Rules Update: a Fusion, Synchro or Xyz Monster goes to any Main Monster Zone
  (it lands where its materials stood) or to the Extra Monster Zone; a Link Monster goes to the Extra Monster Zone.
- **Choosing materials.** Ritual and Fusion start from the Spell in the hand; Synchro, Xyz and Link start from the
  monster in the Extra Deck. The child taps the monsters, the prompt shows the running sum of Levels against the
  number to reach, and "Summon!" tries it. A wrong choice is refused with the rule it breaks.
- **Card reading is on boards**, not in questions: each level of world 16, and one or two in every Summon world,
  is won or lost on one word of a real card's text, which the reader panel prints when the card is picked.
- **The rival** can now Fusion Summon and Synchro, Xyz or Link Summon from a script (`RivalStep` `fusion`, `extra`).
  In the last duel it Fusion Summons on its first turn and Xyz Summons on its second if its two monsters survive.

## Rules: what is left out

Rules are simplified by leaving things out, never by changing them. Not in Junior play: Set (face-down) Monsters and
flipping, Setting a Spell, Special Summons and Monster effects other than "target 1 monster; it loses ATK" (both
only in worlds 1 to 8; from world 9 on, the Summons and effects of the cards listed above are played), activating a
Trap on your own turn, Quick Effects outside an answer or your own turn, a second answer to the same attack, chains
longer than two links, mandatory "When…" effects (without "you can"), Graveyard effects other than "inflict 500
damage", choosing not to use an optional "you can" effect (it is always used), the Damage Step, replays, hand size. The rival never
Sets a card during play and never uses a Monster effect; when it has a Set Trap it always uses it. In worlds 1 to 8
only Normal Spells and Normal Traps exist.

Left out on the whole mat as well:

- **Link Arrows** are in (2026-11-23): a Link Monster goes to the Extra Monster Zone or to a Main Monster Zone a Link
  Monster points to, and so does a Pendulum Monster Summoned face-up from the Extra Deck. Each player has one Extra
  Monster Zone, above their Main Monster Zone 1; arrows that point at the other player's side are left out (no
  co-links, no Extra Link).
- **Pendulum:** Pendulum Effects (the three Pendulum Monsters used have none); a Scale being destroyed.
- **Choices:** a Special Summoned monster always arrives in Attack Position; the zone it lands in is chosen for the
  child; the Spell & Trap Zone a Ritual Spell, Polymerization or Monster Reborn uses is chosen for the child.
- **A Ritual Spell that says "exactly".** Only Black Luster Ritual ("8 or more") is in; "exactly" is taught by the
  Synchro Summon. The one "exactly" Ritual Spell the research has the text of (Dawn of the Herald) Summons a
  monster whose effect Junior cannot play.
- **Number 39: Utopia** negates an attack only in answer to the rival's attack, not the child's own. When it is
  attacked with no material and destroyed, the attack goes on as a direct attack only if nothing else is in the
  way; otherwise it ends (a full replay is not played).
- **Kuriboh** is offered in the Damage Step, as its text says ("During damage calculation").
- **Chains** (since 2026-11-23) grow past two links when an answer can itself be answered: a Counter Trap (Spell
  Speed 3) answers an answer, and only a Counter Trap answers a Counter Trap. A level can cap the length
  (`chainLimit`). An answer is played as it always was once nobody answers it; only Counter Traps resolve as links of
  their own. A Synchro, Xyz, Link or Pendulum Summon starts no Chain; placing a Scale is not offered an answer. A
  Field Spell can be answered like any Spell, and only counts once it has resolved. Effect Veiler is used in answer
  to a moment (a Summon, an effect, a Spell), not at any time of the opponent's Main Phase.
- The Extra Deck is never sorted by the child before a duel. Decks are shuffled only on the masters' island.
- **Exodia the Forbidden One** wins only from the hand, checked once a move is done; pieces on the field or in the
  Graveyard do not count. No other alternative win condition is in Junior.

Two rules are played that the research could not find in a Konami TCG document (its §9): no Tribute beyond what a
Ritual Spell needs is allowed, and a card that does not say "target" does not target.

## Layout

- `src/lib/junior/play/`
  - `cards.ts`: the 58 cards (25 original, 33 real), and `spellTarget` (whose Monster a Spell targets). `engine.ts`: the pure rules (on the whole mat `monsters` has six places: the five Main Monster Zones, then the Extra Monster Zone, `EXTRA_ZONE`; `apply(board, move)` returns the next board and events, or
    the reason the move is refused; `legalMoves`).
  - `levels.ts`: level data (start board, goal, scripted rival, recorded solution) and the demonstrations.
  - `session.ts`: one try at a level (goal check, rival steps, undo, hint by search, outcome).
  - `progress.ts`: browser storage under `academy-ygo:junior:play:v1`, parsed defensively like the pilot's.
  - `copy.ts` plus one file per language; `sound.ts`.
  - `cues.ts`: the pure step from a move's events to the animation cues, and their timeline.
- `src/components/junior/play/`: `junior-play.tsx` (map and state), `level-player.tsx`, `mini-board.tsx`,
  `demo-theatre.tsx`, `board-stage.tsx` (the board with the cues played over it), `summon-scenes.tsx` (Summon and
  legend scenes), `effect-kit.ts` (what the two share).
- `src/app/junior/page.tsx` (now Junior play), `src/app/junior/quiz/page.tsx` (the pilot).


## Tests

Seams: the rules engine, the level session, saved progress, and the rendered page. Every level is checked two ways:
its recorded solution solves it, and a search over all legal moves finds a solution. Every demonstration runs through
the engine. Each language has a sentence for every event of every level. Run:
`cd apps/academy-ygo && node node_modules/vitest/vitest.mjs run`.

## Caveats

- Not tried with children. Level length, wording and difficulty are guesses until it is.
- French and Hebrew were written by the model; a native review is needed.
- Voice quality depends on the device; many devices have no Hebrew voice.
- Card pictures are emoji, which look different on each device.
- The whole mat is tight on a phone: seven columns leave about 45 px a zone, so a zone shows a picture and one
  number. Looked at in a browser at 520 px wide in English, French and Hebrew; not on a real phone.
- The duel uses the Junior engine, not `packages/duel-engine`, and the rival follows a fixed script.

## Phases, card types, steps and the masters' island (2026-11-20)

The owner's decisions and the plan: `docs/research/academy-phases-spells-traps-endgame.md` §5.8 and
`docs/academy-junior-masters-plan.md`.

- **Real Spells and Traps on islands 1 to 8.** The seven invented ones became real cards with official art, under
  the same ids: Red Medicine, Rush Recklessly (Quick-Play), Offerings to the Doomed (Quick-Play, "skip your next Draw
  Phase" is played), Tribute to the Doomed, Reinforcements, Draining Shield, Compulsory Evacuation Device. Where a real
  card may target either player's monster, Junior offers only the side the lesson needs (left out, not changed).
- **The six phases explained.** With the phase bar, the mentor says one sentence for each of the child's phases the
  first time it starts in a level (`phaseHelp`). Island 6 adds "After the battle", which needs Main Phase 2.
- **Every Spell and Trap type** has a printed type line ("Normal Spell", "Quick-Play Spell", "Counter Trap"…) and
  island 10, "The six icons", teaches Quick-Play (Set, then used on the rival's turn), Counter (Negate Attack),
  Continuous Spell (Banner of Courage), Equip (Legendary Sword) and Continuous Trap (Call of the Haunted).
- **The steps of an attack.** An attack is a Battle Step (Traps that answer a declared attack) then a Damage Step
  (only cards that change ATK, and Kuriboh); the Damage Step opens a window only when the defender can act there. The
  clash banner names the step; from the island of steps on, each step is explained once per level. Island 19, "The
  island of steps", has two levels.
- **The masters' island** (island 21, after the Nox duel): one duel per trainer, 13 trainers. Each trainer is a bot
  (`bot.ts`: every legal move is tried and the board it leads to scored, with a personality per trainer, gentle at
  first) playing an anime deck (`master-decks.ts`: 40 cards, Extra Deck up to 15). Decks are shuffled from a seed,
  5 cards each, a coin decides who goes first, 8000 Life Points. The child chooses a starter deck once
  (`starters.ts`), whose cards join the binder, and edits the deck with any playable card of the binder (`DeckDialog`).
  A first win gives 5 stars, a rematch is always open, and each beaten trainer opens some of their cards in the shop.
  Hints come from the same bot, playing the child's side.
- **Trainers' cards.** About 150 real cards were added (209 playable cards in all): their numbers, Types, Attributes and texts come from
  `card-art.ts` (generated); each effect is written by hand in `cards.ts` and played by `engine.ts`. A card the engine
  cannot play exactly is left out of a deck. Arkana, Yami Bakura, Pegasus, Yami Marik and Yusei have too few such
  anime cards: their decks carry `filler` cards, listed apart in `master-decks.ts`.

Still left out: Flip effects (Set Monsters and Flip Summons are in since 2026-11-21, see the plan), replays, the hand size limit, Spell Speed beyond "a Counter Trap answers
an attack", Trap Hole and other cards that answer a Summon, and the anime cards with effects the engine does not play
yet (Stardust Dragon, Toons, Time Wizard, the Egyptian Gods among them).


## Developer tools (local only)

Under `next dev` only (`src/components/junior/dev/dev-slot.tsx`): a production build leaves their code out entirely (checked by searching the built `.next` files), and a wrench
in the bottom corner of the Junior page opens a panel, in English:

- open any level or trainer duel, locked or not; solve every level before one; finish up to an island, or all;
- forget every solved level of this save, or its starter Deck;
- masters' island: every playable card in the binder (Deck editor), who starts a duel, every trainer at one level.

In a level, a dashed "Dev" bar under the board plays the recorded solution, lets the bot play the child's turn, or
wins at once. The settings are kept in this browser under `academy-ygo:junior:dev`.
