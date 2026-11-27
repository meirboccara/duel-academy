# Duel 002: Sky Striker 745443 vs Blue-Eyes 746021

Date: 2026-11-26. This duel was completed. It counts as one of the 20 required agent-vs-agent duels.
Earlier duel 002 attempts were stopped by engine or tool defects, which have since been fixed. Their records stay in
`aborted/`; this is a new record, not a continuation.

## Setup

- Record: `duel-002.json`, created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-002.json --you 745443 --rival 746021 --seed 8 --first you`.
- Seed 8. Seat `you` went first.
- `you`: Sky Striker 745443, played by a fresh Sonnet player (effort medium).
- `rival`: Blue-Eyes 746021, played by a fresh Sonnet player (effort medium).
- The referee was an Opus agent. It spawned each player once, then relayed priority to them one at a time with SendMessage.
  - Players never messaged each other.
  - Each player's report reached only the referee, and none of it was passed to the other player.
  - Each player got only its own Main/Extra list and the `show`/`move`/`dispute` CLI instructions.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Winner: `rival` (Blue-Eyes, Sonnet), on turn 4 in the Battle Phase.**
- Final LP: rival 8000, you 0.
- Blue-Eyes White Dragon (3000) attacked directly into 2500 LP.

The record holds 110 logged moves and replays cleanly. `replay` prints `{"moves":110,"disputes":0,"turn":4,"phase":"battle","toAct":null,"winner":"rival"}`.

## Turn-by-turn summary

**Turn 1 (you, Sky Striker).**
- Opening hand: Lemnisgate!, Mulcharmy Purulia, 2 Raigeki, The Fallen & The Virtuous. No Sky Striker monster and nothing to target.
- You made no play and passed through every phase (no Battle Phase on turn 1).

**Turn 2 (rival, Blue-Eyes).**
- Deep-Eyes White Dragon discarded itself to search Sage with Eyes of Blue. In response to the search resolving, you discarded Mulcharmy Purulia (you controlled no cards).
- Sage was Normal Summoned (Purulia: you drew 1) and searched Maiden of White.
- Maiden sent itself from the hand to place True Light. True Light Set Roar of the Blue-Eyed Dragons from the Deck.
- Roar Special Summoned Blue-Eyes White Dragon from the Deck in Defense Position. Maiden's GY trigger Special Summoned Maiden.
- Rival Synchro Summoned Blue-Eyes Spirit Dragon from Sage and Blue-Eyes White Dragon.
- Deep-Eyes' hand effect Special Summoned the second Deep-Eyes (ATK becomes 3000; banished if it leaves the field). Purulia: you drew 1 (Purulia's two draws were Pot of Sloth and a second Purulia).
- Battle: Deep-Eyes attacked directly (8000 to 5000), then Spirit Dragon (5000 to 2500). Maiden did not attack.
- End Phase: Purulia's hand check (hand more than opponent's cards + 6) took nothing.

**Turn 3 (you).**
- You drew The Fallen & The Virtuous.
- Raigeki destroyed Maiden and Spirit Dragon; Deep-Eyes was banished by its own clause. The rival kept 3 cards in hand.
- Pot of Sloth drew 1 card (the rival controlled 1 card, True Light): the second Lemnisgate!.
- You Set The Fallen & The Virtuous and passed with no monster to summon.
- End Phase: True Light's first effect Special Summoned Blue-Eyes White Dragon from the GY; Maiden's GY trigger revived Maiden in Defense Position.
- You did not use the Set The Fallen & The Virtuous. Its offered targets were Maiden and True Light only.

**Turn 4 (rival).**
- The rival drew Infinite Impermanence.
- True Light's second effect Set Majesty of the White Dragons from the Deck. The rival Set Infinite Impermanence.
- Blue-Eyes White Dragon attacked directly. You had no legal response: 2500 to 0.

## Disputes

None were raised.

The players raised these questions in their reports instead. The referee checked each against the card records in the repo. None was an engine error:

- **Purulia offered at every window (you, turns 1 and 2).** Purulia's activation condition is "If you control no cards (Quick Effect)" (cid 20206, record `text-activation` in its card file); it needs no opponent action. Once you Set a card on turn 3, it was no longer offered (the referee checked the `you` move list on turn 4).
- **Purulia did not draw at once (you).** It draws "each time your opponent Normal or Special Summons a monster(s) from the hand" (record `text-draw`). The draws came on Sage's Normal Summon and Deep-Eyes' Special Summon from the hand, not on the searches. The player at first thought it drew on searches.
- **Purulia's End Phase effect did nothing (both players).** It applies only "if the number of cards in your hand is more than the number of cards your opponent controls +6" (record `text-end-phase`): 6 cards in hand against 4 + 6. Correct.
- **Blue-Eyes White Dragon not offered to The Fallen & The Virtuous (you, turns 3 and 4).** True Light: "Your opponent cannot target "Blue-Eyes White Dragon" in your Monster Zone with card effects" (cid 16653, record `protect` in `src/cards/true-light.ts`). Correct.
- **Roar summoned Blue-Eyes in Defense Position with no choice (rival).** Roar: "Special Summon in Defense Position, 1 "Blue-Eyes" monster..." (cid 20605, record `summon`). Correct.
- **"chain link 1: deep-eyes-white-dragon activated by you" after the first attack (rival).** It was the earlier Main Phase 1 activation still in the 15-line log tail, read as new. No new activation happened in battle.
- **The Fallen & The Virtuous listed twice (you).** It is a Quick-Play Spell (cid 22089), so it could be activated from the hand during your own turn; two copies in hand gave two sets of identical entries. Legal, but see finding 2.

## YGOProJudge chats

None. No rule question stayed unclear after the card records, so no question was sent and no verdict is owed.

## Engine issues

None. There were no illegal outcomes, no unexplained errors and no replay failures.

Points checked and found correct:
- Purulia's activation condition, its draw trigger (Normal and Special Summons from the hand only) and its End Phase hand check.
- Roar's Defense Position and its Dragon-only Extra Deck lock (Spirit Dragon is a Dragon).
- Deep-Eyes' set ATK 3000 and its banish-instead clause on Raigeki.
- Pot of Sloth drawing 1 for 1 opponent card, and its "cannot activate Pot of Sloth" lock for the rest of the turn.
- True Light's protection of Blue-Eyes White Dragon from targeting, and its once-per-turn effect used on turns 3 and 4.
- Battle damage: 3000, 2500, then 3000 into 2500 LP (logged as -2500).

## Display and usability findings (from the players' reports and the referee's checks)

1. **Set did not ask for a zone.** The rival Set Infinite Impermanence and the engine chose Spell & Trap Zone 1 without asking. `move` accepts `--zone N`, but the Set move line does not say a zone can be chosen. For Impermanence the column matters.
2. **Identical copies give identical move lines.** With 2 The Fallen & The Virtuous in hand, every cost and target combination was printed twice with the same `#1` label, which the player read as a duplication bug (same as duel 001 #7 for search lists).
3. **Mulcharmy draws print before the Summon line.** After Deep-Eyes' Special Summon from the hand, the log printed "the opponent draws 1 card" before "deep-eyes-white-dragon is Special Summoned". The draw is not named as Purulia's.
4. **Lasting effects do not say what they wait for.** Purulia's entry in "Effects in force" reads "applied each time its condition happens" without naming the condition, and the move detail said "does: draw", so the player expected an immediate draw.
5. **The log tail reads as new events.** The 15-line tail kept the Main Phase 1 chain line under the battle lines, and the rival took it for an unexplained activation (same family as duel 003 #7).
6. **Capped damage hides the attack value.** The final line reads `-2500` for a 3000 attack into 2500 LP. Correct LP, but the battle line could also give the ATK.
7. **Pass lines look repeated.** The `you` player reported "pass" lines appearing twice in the text output. The referee saw only the usual `pass` followed by an indented `pass (no legal response)` for the other seat, which is easy to read as a repeat.
8. **Piping `show` into `Select-Object -First N` exits 255.** The rival hit it once after a move; the move had already been played. It is a closed-pipe exit code, not an engine error.
9. **Phase passes cost relays.** As in duels 001 and 003, every phase step cost one relay per player. Passing Main Phase 1 with no monsters still entered the Battle Phase.

Fixed since earlier duels, as seen here:
- Duel 003 #8 (the Chain section printed twice): not seen; chains printed once.
- Duel 003 #1 (Lordly Lode lock wording): Lode was not played, so not checked.
- The hidden-information fixes from the aborted duel 002 attempts held: the opponent's choices showed only as `choose ?` and `set ?`, the True Light Set card as "a card is Set ... from the opponent's Deck", and no player reported seeing a hidden card.

Still open: duel 001 #2 (zone prompts; now also for Sets), #7 (identical entries), #10 (relays spent on passes); duel 003 #7 (log order).

## Process

- Relays: the referee spawned each player once and sent 73 relay messages (SendMessage), under the 150 cap. One relay to the rival added "Reminder: run show before every move" after it reported moving once without re-reading the board (the move was a forced pass and matched `--expect`).
- Players made no takebacks and no rejected moves were reported.
- Isolation:
  - No player received the other player's report, hand or private information. The referee relayed only "your priority; turn N phase X" lines and the one procedure reminder.
  - No player reported knowing the other seat's hidden cards. Every hidden card a player named was its own, or had been revealed on the field.
  - The referee read both seats' views to check reports; nothing from them was passed on.
  - One observation, not a breach: the log shows the other seat's automatic "pass (no legal response)", which tells a player the opponent had no legal response at that point (but not which cards they hold).
- No source or test file was edited, no commit was made, and nothing was published. The only edits are this file and the new `duel-002.json` record.

## Replay verification

`node scripts/agent-play.cjs replay ../../docs/rules-core/duel-testing/duel-002.json` after the duel ended:
`{"moves":110,"disputes":0,"turn":4,"phase":"battle","toAct":null,"winner":"rival"}`.
