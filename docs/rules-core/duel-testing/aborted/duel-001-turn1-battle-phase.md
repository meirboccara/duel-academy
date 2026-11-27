# Duel 001: stopped on an engine defect (turn 1 Battle Phase)

Date: 2026-11-26. Private record: `duel-001.json` (players must not read it). **Not a completed duel**: it does not count toward
the 20.

## Setup

- `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-001.json --you 745443 --rival 746021 --seed 2 --first you`
- Seed 2; `you` goes first.
- `you`: Sky Striker 745443, a fresh Sonnet player (medium effort).
  - Main (40): Ash Blossom & Joyous Spring x3, Lightning Storm x2, Mulcharmy Fuwalos x3, Mulcharmy Purulia x3, Mystical Space Typhoon x1,
    Pot of Sloth x2, Radiant Typhoon Vision x3, Raigeki x3, Sky Striker Ace - Raye x3, Sky Striker Ace - Roze x2, Sky Striker Mecha -
    Shark Cannon x1, Sky Striker Mecha - Widow Anchor x1, Sky Striker Mobilize - Engage! x2, Sky Striker Mobilize - Linkage! x3, Sky
    Striker Special Maneuver - Lemnisgate! x2, The Fallen & The Virtuous x3, Upstart Goblin x3.
  - Extra (15): Ecclesia and the Dark Dragon x1, Prototype Sky Striker Ace - Amatsu x1, S:P Little Knight x1, Sky Striker Ace - Azalea
    x1, Sky Striker Ace - Hayate x2, Sky Striker Ace - Kagari x3, Sky Striker Ace - Shizuku x1, Sky Striker Ace - Zeke x1, Sky Striker
    Ace = Zero x3, The Dragon that Devours the Dogma x1.
- `rival`: Blue-Eyes 746021, a fresh Opus player (medium effort).
  - Main (43): Ash Blossom & Joyous Spring x3, Bingo Machine, Go!!! x1, Blue-Eyes White Dragon x2, Blue-Eyes White Dragon, the White
    Phantom Beast x1, Bystial Magnamhut x1, Deep-Eyes White Dragon, the Blue Abyss x3, Dominus Purge x3, Droll & Lock Bird x1, Effect
    Veiler x3, Ghost Ogre & Snow Rabbit x3, Infinite Impermanence x3, Maiden of White x3, Majesty of the White Dragons x1, Mausoleum of
    White x1, Pot of Prosperity x1, Primite Dragon Ether Beryl x1, Primite Drillbeam x1, Primite Lordly Lode x3, Roar of the Blue-Eyed
    Dragons x1, Sage with Eyes of Blue x3, True Light x1, Wishes for Eyes of Blue x3.
  - Extra (15): Ancient Fairy Life Dragon x1, Blue-Eyes Spirit Dragon x2, Blue-Eyes Tyrant Dragon x1, Blue-Eyes Ultimate Spirit Dragon
    x1, Crimson Dragon x1, Hieratic Seal of the Heavenly Spheres x2, Lightstorm Dragon x1, Neo Blue-Eyes Ultimate Dragon x1, Psychic End
    Punisher x1, Spirit with Eyes of Blue x2, Stardust Sifr Divine Dragon x1, Super Starslayer TY-PHON - Sky Crisis x1.
- Each player was spawned once by the referee and then resumed only by the referee. Players never messaged each other. No report
  text from one player reached the other.

## Result

**Unfinished**: stopped on turn 1 because of an engine defect (dispute 0). Final position: turn 1, Battle Phase (it should not exist),
`you` to act. LP: `you` 8000, `rival` 9000 (Upstart Goblin). 20 moves logged, 1 dispute. 6 relays (2 spawns, 4 resumes).

## Turn-by-turn summary

Turn 1 (`you`, Sky Striker):
- Passed the Draw and Standby Phases.
- Activated Upstart Goblin: drew 1 card, and the rival gained 1000 LP.
- Activated Sky Striker Mobilize - Engage! and added Sky Striker Ace - Raye.
- Normal Summoned Raye. Raye's effect tributed itself and Special Summoned Sky Striker Ace - Hayate to Extra Monster Zone 5.
- The rival passed both response windows where Effect Veiler on Hayate was legal (its own choice, kept for a better target).
- Set 1 Spell/Trap. Both players passed in Main Phase 1, and the engine moved into the **Battle Phase** on turn 1. The rival disputed
  this.

## Disputes

### 0 (log 20, raised by `rival`): the engine enters the Battle Phase on the first turn. Upheld: engine defect

Claim: after both players passed in Main Phase 1 of turn 1, the engine moved to the Battle Phase. The player who goes first cannot
conduct a Battle Phase on their first turn, so the turn should go from Main Phase 1 to the End Phase.

Ruling (konami): **upheld**. The engine broke the rule. Sources, read in full from the cached rulebook text (`%TEMP%/step8/rb10-layout.txt`,
the `pdftotext -layout` output of `SD_RuleBook_EN_10.pdf`):
- Rulebook v10 p. 34: "IMPORTANT: The player who goes first cannot conduct their Battle Phase on their first turn."
- Rulebook v10 p. 34, the turn flowchart: "If no battles are conducted", Main Phase 1 goes to the End Phase.
- Rulebook v10 p. 39: "If you conducted your Battle Phase, your turn moves to Main Phase 2 afterwards."
- Repo record `no-battle-first-turn` (`src/battle-sources.ts`).

No YGOProJudge chat was opened, because the rulebook settles the question.

Engine cause (read, not changed): in `packages/rules/src/chain.ts`, `nextPhase` always advances `main1` to `battle`, with a Start
Step, a Battle Step and an End Step, then to `main2`. The first-turn rule exists only in `battle.ts` `attackActions`, as
`if (turn.number === 1) return false`, which blocks attack declarations and nothing else. So on turn 1, play can include Battle Phase
windows, "start/end of the Battle Phase" triggers and Battle-Phase-only effects, plus a Main Phase 2 (a second set of Main Phase
actions after the Battle Phase). The existing test (`test/rules/battle.test.ts`, "cannot attack on the Duel's first turn") checks only
the attack. The ruling is stored in `disputes[0].ruling`. The record still replays: 20 moves, 1 dispute, turn 1, battle, toAct `you`.

The rival also noted that the dispute line on its own board read `by: you`. In the record it is `by: "rival"`. The board shows it
relative to the viewer, so this is not a bug.

## Engine issues

1. **Turn 1 Battle Phase and Main Phase 2** (above). Minimal reproduction, verified in a scratch record outside the repo, since deleted:
   ```
   node scripts/agent-play.cjs new <tmp>.json --you 745443 --rival 746021 --seed 2 --first you
   node scripts/agent-play.cjs move <tmp>.json you 0 --expect "pass"   # Draw Phase
   node scripts/agent-play.cjs move <tmp>.json you 0 --expect "pass"   # Standby Phase
   node scripts/agent-play.cjs move <tmp>.json you 0 --expect "pass"   # Main Phase 1 (rival auto-passes)
   node scripts/agent-play.cjs replay <tmp>.json                       # turn 1, phase "battle"
   ```
   Expected: turn 1 goes from Main Phase 1 to the End Phase. The owner decides on the fix. Nothing was changed.

## Display and usability findings (players' reports)

- After a chain resolves, the player must pass a "response window: passing keeps Main Phase 1" before the normal Main Phase 1 menu
  comes back (Sonnet).
- The label "activate sky-striker-ace-raye #1" does not say that the effect sends Raye to the GY and Special Summons from the Extra
  Deck (Sonnet; also noted in pilot 001).
- Choice lists repeat cards with the same name, for example three "choose sky-striker-ace-raye" entries (Sonnet).
- The `--text` output is long, and the Moves list comes last (Sonnet).
- The window text "your pass moves on to Battle Phase" on turn 1 already showed the wrong transition before it happened (Opus).
- Hidden choices show as "choose ?", and an opponent's set card shows as "? (face-down) [opponent spell 0]". Both are clear (Opus).

## Isolation

No breach. The referee spawned and resumed each player separately. Each report came back only to the referee and was never forwarded.
Players were told never to run the other seat or read repo files. Both reports named some of the player's own hand cards; that text
stayed with the referee and is left out here, except Effect Veiler, which the rival named as the response it declined.
