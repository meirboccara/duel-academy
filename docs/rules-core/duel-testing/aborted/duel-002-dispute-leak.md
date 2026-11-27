# Duel 002: Sky Striker 745443 vs Blue-Eyes 746021 (stopped: hidden information leaked through the dispute display)

Date: 2026-11-26. Rerun of duel 002; earlier attempts were stopped by engine defects since fixed. **This run is stopped on turn 2 and does not count toward the 20**: the board display showed the rival the `you` player's dispute claim, which named a card in that player's hand.

## Setup

- Record: `duel-002.json`, created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-002.json --you 745443 --rival 746021 --seed 5 --first rival`.
- Seed 5. Seat `rival` (Blue-Eyes) went first.
- `you`: Sky Striker 745443, played by a fresh Sonnet player (effort medium).
- `rival`: Blue-Eyes 746021, played by a different fresh Sonnet player (effort medium).
- Referee: an Opus agent. It spawned each player once and relayed priority with SendMessage, one player at a time. The players never messaged each other, and every report reached only the referee.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Unfinished, stopped on turn 2 (`you`'s turn) in Main Phase 1, LP 8000 to 8000.** The duel was stopped for an isolation breach caused by the tool, not by either player (see "Isolation breach" below). The record holds 59 logged moves and 1 settled dispute, and it replays: `{"moves":59,"disputes":1,"turn":2,"phase":"main1","toAct":"you","winner":null}`.

## Turn-by-turn summary

**Turn 1 (rival, Blue-Eyes).**
- Rival activated Wishes for Eyes of Blue (discarding Primite Drillbeam) and added Sage with Eyes of Blue and Roar of the Blue-Eyed Dragons.
- `you` answered with Mulcharmy Purulia from the hand (it controlled no cards).
- Roar Special Summoned Blue-Eyes White Dragon from the Deck in Defense Position. Roar's lock means no Extra Deck Special Summons that turn except Dragons.
- Rival Normal Summoned Sage, and `you` drew 1 from Purulia. Sage searched Maiden of White.
- `you` activated a second Purulia. That is legal: the card allows "1 other Mulcharmy monster effect" per turn and has no once-per-turn by name.
- Rival Synchro Summoned Blue-Eyes Spirit Dragon (Sage + Blue-Eyes White Dragon) and Set Dominus Purge.
- Maiden's hand effect placed True Light, and True Light revived Blue-Eyes White Dragon. Maiden's GY trigger revived Maiden. Rival ended the turn with Spirit Dragon, Blue-Eyes White Dragon, Maiden, True Light, a Set Dominus Purge, and Effect Veiler and Droll & Lock Bird in hand.

**Turn 2 (you, Sky Striker).**
- `you` drew Pot of Sloth and activated Raigeki. Rival chained Spirit Dragon's Tribute effect and Special Summoned Crimson Dragon in Defense Position.
- Raigeki then destroyed Blue-Eyes White Dragon, Maiden and Crimson Dragon. Dominus Purge was not offered against Raigeki, which is correct: Raigeki adds no card from the Deck.
- `you` activated Pot of Sloth. Rival could have chained Dominus Purge but kept it. `you` drew 2 (Mystical Space Typhoon, Linkage!) and placed MST on the bottom.
- `you` disputed the Pot of Sloth lock (dispute 0). It was settled with no error.
- The rival then saw the dispute claim in its own board display, and the duel was stopped. `you` held Lemnisgate!, The Fallen & The Virtuous, Raigeki and Linkage! with an empty field. Rival had 2 cards in hand, a Set Dominus Purge and True Light.

## Disputes

### 0: Pot of Sloth lock vs The Fallen & The Virtuous (raised by `you`, log 57, turn 2 Main Phase 1): settled, no engine error

- **Claim.** After Pot of Sloth resolved, the log said "lasting effect begins: you cannot activate cards or effects, until the end of turn 2", yet the move list still offered The Fallen & The Virtuous.
- **Ruling: no error.** Pot of Sloth's printed text says "For the rest of this turn after this card resolves, you cannot activate "Pot of Sloth"" (Konami card text cid 23010; record `lock` in `src/cards/pot-of-sloth.ts`). The engine's lock stops only activations of cards named "Pot of Sloth", so the other activations were legal.
- **The real defect is the log line,** which shows the lock without its "Pot of Sloth only" limit.
- Recorded in `disputes[0].ruling` (via `konami`). The record still replays and the state is unchanged.

## YGOProJudge chats

None. Every question was settled from the card text records, so no question was sent and no verdict is owed.

## Isolation breach (tool defect): reason for the stop

- **What leaked.** `seatFor` in `src/match.ts` (line ~786, `disputes: match.disputes`) gives every seat every dispute. `renderSeat` in `src/agent-play.ts` (line ~133) prints each claim verbatim, plus its ruling, in a `Disputes:` section.
- **What the rival saw.** The `you` player's claim named a card it still held in hand ("activate the-fallen-and-the-virtuous (a Quick-Play Spell activation from my hand)"). The rival's next `show` displayed it, and the rival's report says it read it ("their Fallen & Virtuous move was still legal"). The referee's ruling text named the card again.
- **Effect.** The rival now knows a hidden card in the opponent's hand. Per the brief, the referee stopped the duel.
- **Reproduction.** In any match, a seat runs `agent-play dispute RECORD you claim ... <a card in my hand> ...`. Then `agent-play show RECORD rival --text` prints the claim under `Disputes:`.
- **Possible fixes, for the owner to decide:**
  - show a seat only its own disputes' text, and only a one-line notice of the other seat's (for example "the opponent raised a dispute; the referee is settling it");
  - or tell players never to name hidden cards in a claim, which is weaker.
  - Referees should also keep hidden card names out of ruling text while the dispute display is shared.
- **Not affected.** The `you` player's JSON board was checked and holds none of the rival's hidden cards. Neither player received the other's report.

## Engine issues

No rule errors were found, and there were no unexplained errors or replay failures. Points the players questioned, all checked against the card records:
- **Second Purulia offered.** Legal: the card has no once-per-turn by name ("You can only activate 1 other "Mulcharmy" monster effect").
- **Purulia draws on the Normal Summon of Sage.** Legal: Purulia counts Summons from the hand.
- **Droll & Lock Bird offered during the rival's own Sage trigger.** Legal: the opponent had drawn a card outside the Draw Phase. The card's record cites Konami's notes that Droll can be activated after the chain in which the card was added.
- **Spirit Dragon Synchro from 2 materials.** Legal: "1 Tuner + 1+ non-Tuner "Blue-Eyes" monsters" (cid 12324).
- **Two passes in each Draw Phase.** The draw opens a response window before the open game state, and the Window line says so. Not a loop.
- **Crimson Dragon "destroyed from your Extra Deck".** Display only (finding 3 below). Crimson Dragon was Special Summoned by Spirit Dragon's effect, then destroyed by Raigeki in the same step.

## Display and usability findings (from the players' reports)

1. **"Effects in force" and "lasting effect begins" lines drop the qualifier.**
   - Roar's lock showed as "cannot Summon monsters"; the card only locks Extra Deck Special Summons except Dragons. The rival believed its Normal Summon was blocked until it checked the move list.
   - Pot of Sloth's lock showed as "cannot activate cards or effects", which caused dispute 0.
   - The referee told both players the same tool note: the numbered moves are what the engine allows. This is the most harmful display finding of the run.
2. **The `Disputes:` section is shared with the opponent.** See "Isolation breach" above.
3. **The log builds each move's notes from a before/after diff (`describeChange` in `src/match.ts`).** A card that moves twice within one step shows only its start and end. Crimson Dragon's Special Summon line was missing, and the log said it was "destroyed ... from your Extra Deck". Both players misread it, the rival guessing it was a "delayed Special Summon".
4. **Leftover delayed effects.** Spirit Dragon's End Phase destruction stayed listed under "Effects in force" after Crimson Dragon had left the field, and the line says neither what it does nor that it will do nothing.
5. **Labels hide what effects do.**
   - Labels such as `#3` do not say what the effect does. The rival chose Crimson Dragon without knowing the effect would destroy it in the End Phase.
   - The Purulia label reads "does: draw", which the `you` player read as the trigger rather than the result.
6. **The place prompt says "zone N (a Main Monster Zone or a Spell & Trap Zone)"** when placing a monster.
7. **Monster lines read "defense 3000/2500",** which looked to one player like stats in Defense order.
8. **Synchro materials are applied automatically after the zone prompt,** so the player cannot see which materials were used (the same as duel 001 finding 8).
9. **`dispute` prints the full JSON board,** the same as duel 001 finding 12 for `move`. `move` itself now prints a compact result, which neither player complained about.

Fixed since duel 001 (no complaints this run):
- The log now names searched cards and the cards Summoned (duel 001 finding 4).
- LP and negation lines exist (duel 001 finding 5).
- `move` output is compact (duel 001 finding 12).
- The Window line explains what a pass does. It answered the double-pass questions.

## Process

- **Relays.** 32 relay messages (SendMessage) after the two spawns. One relay gave the wrong phase (standby while the duel was still in the Draw Phase); the next message corrected it, and no move came of it.
- **Messages beyond "your priority".** The referee sent:
  - one tool note to both players: the numbered moves are authoritative, "Effects in force" lines are abbreviated;
  - the dispute 0 ruling to `you`;
  - a correction explaining the Draw Phase response window.
- **No hidden information was relayed by the referee.** The leak came from the tool's shared dispute display.
- **No other edits.** No source or test file was edited. The only record edit was `disputes[0].ruling`. Referee reconstructions used a copy in the OS temp folder (`duel002-ref`). No commit was made and nothing was published.
