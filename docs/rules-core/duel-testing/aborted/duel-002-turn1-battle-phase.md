# Duel 002: ABORTED, not counted

Date: 2026-11-26. **Status: aborted at turn 2, Draw Phase. It does not count toward the required 20 duels.**

**Stop reason:** the referee of duel 001 found an engine defect. On turn 1 the engine lets the first player enter the Battle Phase (and Main Phase 2), but the rulebook (RB10 pp. 34 and 39) says the player going first cannot conduct a Battle Phase on their first turn. Duel 002 went through that turn 1, so its record holds an illegal Battle Phase entry (Blue-Eyes passed through Battle, Main 2 and End). Once the engine is fixed, the record will stop replaying. The coordinator stopped the duel. **It will be rerun from scratch after the fix**, with the same setup.

## Setup

- Record (private, referee only): `duel-002.json`, created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-002.json --you 745443 --rival 746021 --seed 3 --first rival`.
- Seed 3. The `rival` seat goes first.
- `you`: Sky Striker 745443, played by a fresh Sonnet agent (medium effort), with the exact Main + Extra lists from `packages/rules/src/deck-manifests.ts`.
- `rival`: Blue-Eyes 746021, played by a fresh Sonnet agent (medium effort), with the exact Main + Extra lists from the same file.
- Each player was spawned once and afterwards resumed only by the referee. Each player saw only its own seat and its own list.

## How far it got

The record holds 32 moves. It stopped at turn 2, Draw Phase, with `you` to act and no winner. Both players are at 8000 LP. The record replays at the time of the stop (`replay`: 32 moves, 0 disputes).

- **Turn 1 (Blue-Eyes):**
  1. Deep-Eyes White Dragon was discarded from the hand to search Sage with Eyes of Blue.
  2. Sage was Normal Summoned, and its effect added Maiden of White.
  3. Maiden's hand effect placed True Light.
  4. True Light Special Summoned Blue-Eyes White Dragon.
  5. Maiden's trigger in the GY Special Summoned Maiden itself.
  6. Sage and Blue-Eyes White Dragon were used for a Synchro Summon of Blue-Eyes Spirit Dragon.
  7. Deep-Eyes Special Summoned itself from the GY.
  8. One card was Set.
  9. The engine offered Battle Phase, Main 2 and End, and the player passed through them without attacking. **This is the illegal Battle Phase entry.**
- End of turn 1: Blue-Eyes controls Spirit Dragon (2500/3000), Deep-Eyes (3000) and Maiden on the field. Its Spell/Trap zone holds True Light face-up and one face-down card. Its GY holds Blue-Eyes White Dragon and Sage.
- **Turn 2 (Sky Striker):** Sky Striker passed in the window after the draw, and Blue-Eyes passed back. The duel stopped in the open game state of the Draw Phase, where Sky Striker had a choice between passing and a Widow Anchor activation.

Relays: 5 resumes in all (2 spawns, 3 SendMessage priority relays), plus one halt message to the `you` player, who made no further move.

## Disputes

None raised.

## YGOProJudge chats

None. No judge call was made.

## Engine issues

- **Turn-1 Battle Phase.** The first player can enter the Battle Phase and Main Phase 2 on the first turn of the duel, against RB10 pp. 34 and 39. Duel 001's referee found this, and it is the reason this duel was stopped. Repro: replay `duel-002.json` up to log `T1 battle`.
- No other engine errors occurred. The pass sequence in the turn-2 Draw Phase is not a defect: the player passed in the window after the draw, the opponent passed, and the open game state followed. The window header said so.

## Display and usability findings (from the players' reports)

- Choice windows show only `place N` or `choose X`. They do not say what is placed or which prompt the choice answers (rival).
- Searches list identical copies, for example `effect-veiler` three times, with nothing to tell them apart (rival).
- Some passes in response windows fell back to a "choice pending" state, and no message said why (rival).
- Effect labels do not describe the effect. `activate true-light #5 :1/:2` does not say which effect is `:1` and which is `:2`, and `activate maiden-of-white #3` does not say that it Special Summons Maiden itself (rival).
- `move` prints the full JSON, including the whole log, which is long (you).
- The face-down card shows as `?` as expected, and the rest of the board was readable (you).
- Referee note: one priority step takes one relay, so passes through empty phases cost many relays. In a full duel this weighs on the 120-relay cap.

## Isolation

No problem. Neither player received the other's report or any private information. All reports came back to the referee only.
