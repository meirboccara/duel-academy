# Duel 002: Sky Striker 745443 vs Blue-Eyes 746021

Date: 2026-11-26. **Stopped on turn 3 by an isolation breach caused by the player view** (details below). It does **not**
count as one of the 20 required agent-vs-agent duels. The record is preserved as is; nothing was fixed.

## Setup

- Record: `duel-002.json`, created fresh with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-002.json --you 745443 --rival 746021 --seed 7 --first rival`.
- Seed 7. Seat `rival` went first.
- `you`: Sky Striker 745443, played by a fresh Sonnet player (effort medium).
- `rival`: Blue-Eyes 746021, played by a fresh Sonnet player (effort medium).
- The referee was an Opus agent. It spawned each player once, then relayed priority to them one at a time with SendMessage.
  - Players never messaged each other.
  - Each player's report reached only the referee, and none of it was passed to the other player.
- Core at the start: 150 test files, 1682 passed, 1 todo, with the turn-1 phase skip, Droll-after-draw and dispute-text
  isolation fixes landed.
- Each player was given only its own Main/Extra list (below) and the CLI rules: `show RECORD OWN_SEAT --text`,
  `move RECORD OWN_SEAT INDEX --expect LABEL [--zone N] [--position ...]`, `dispute` if needed; no file reading, no
  opponent view, no scripts, one move per command, stop on toAct false / winner / dispute / error / 40 decisions.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**No winner. Stopped on turn 3 (rival's turn), Battle Phase, after Sky Striker Ace = Zero's effect resolved.**
- LP at the stop: you 8000, rival 6000.
- Stop reason: the `you` seat's move list at Zero's non-targeting "destroy 1 card on the field" choice named the
  rival's face-down Set card (Majesty of the White Dragons). See "Isolation breach" below.

`replay` of the preserved record prints
`{"moves":144,"disputes":0,"turn":3,"phase":"battle","toAct":"rival","winner":null}`.

## Turn-by-turn summary

**Turn 1 (rival, Blue-Eyes).**
- No draw for the first player; the turn went from Main Phase 1 to the End Phase with no Battle Phase (the turn-1
  skip fix held).
- Roar of the Blue-Eyed Dragons was negated by your Ash Blossom.
- Wishes for Eyes of Blue (discarding White Phantom Beast) added Sage with Eyes of Blue and Majesty of the White Dragons.
- Sage was Normal Summoned (Attack Position) and searched Maiden of White.
- Maiden's hand effect placed True Light from the Deck; True Light Set Bingo Machine, Go!!! from the Deck; Bingo
  Machine (a Normal Spell, activated the turn it was Set) added Deep-Eyes White Dragon.
- Majesty was Set. End of turn: Sage, True Light, a Set Majesty; hand Ghost Ogre, Ash, Deep-Eyes.

**Turn 2 (you, Sky Striker).**
- You Set The Fallen & The Virtuous, then activated Linkage!: it sent the Set card and Summoned Hayate to the EMZ.
- Hayate became Kagari (Link Summon). Kagari's trigger returned Linkage! to the hand.
- A second Linkage! sent Kagari and Summoned Sky Striker Ace = Zero (2000) to the EMZ. Zero's search trigger was
  negated by the rival's Ash Blossom.
- You Set Widow Anchor and Mystical Space Typhoon.
- Battle: Zero attacked Sage (0 ATK, Attack Position): rival 8000 to 6000.
- Main Phase 2: Lemnisgate! Set. You ended with Zero and three Set Quick-Plays, empty hand.

**Turn 3 (rival).**
- Rival drew Primite Drillbeam. Deep-Eyes discarded itself to search Sage.
- Sage was Normal Summoned; its search trigger was answered by your Widow Anchor (effects negated until end of turn;
  no control change, fewer than 3 Spells in the GY at resolution).
- Sage became Spirit with Eyes of Blue (Link Summon), which added Mausoleum of White. Mausoleum was activated.
  You declined MST on it (MST on Mausoleum was offered; the player believed it could not be used, a player error).
- Mausoleum targeted Spirit and sent Blue-Eyes White Dragon from the Deck (Spirit +800). Deep-Eyes' GY trigger
  Summoned itself at 3000 ATK. True Light revived Blue-Eyes White Dragon.
- Roar's GY effect (banish itself) Fusion Summoned Blue-Eyes Tyrant Dragon from Blue-Eyes White Dragon and Spirit.
- Battle: Tyrant (3400) attacked Zero. You tributed Zero (Quick Effect): Raye and Roze were Summoned from the Deck in
  Defense Position, then Zero's "you can destroy 1 card on the field" destroyed Tyrant.
- **Stopped here** (log index 143, the destroy choice).

## Isolation breach (engine display defect): duel stopped

At log index 143 the `you` seat resolved Zero's "then you can destroy 1 card on the field" (cid 21460, a non-targeting
choice). The move list offered every card on the field by name, including the rival's face-down Set card:

```
[7] choose majesty-of-the-white-dragons -- choose majesty-of-the-white-dragons from the opponent's Spell & Trap Zone 1: for the effect of sky-striker-ace-zero (chain link 1) that is resolving
```

- The board for the same seat still shows that card as `? (face-down) [opponent spell 1]`, and target lists for
  targeting effects hide it correctly (MST at Mausoleum's activation showed `?(rival spell 1)`). Only the
  `choose` labels at resolution leak the name.
- The `you` player reported "Their face-down S/T is now visible as Majesty of the White Dragons". It chose Tyrant,
  not the Set card, but it now knows a hidden card of the opponent, so the game is no longer information-clean.
- The referee rebuilt every earlier choice point of the record (truncated copies in a temp folder outside the repo,
  deleted afterwards) and checked the acting seat's move labels: this was the only choice that named an opponent's
  hidden card.
- The fault is in the seat view (choice labels for non-targeting picks on the field), not in a player's conduct. No
  fix was made; the record is preserved unchanged.

## Disputes

None were raised. The `disputes` array is empty and no ruling was recorded.

Rules questions from the player reports, checked by the referee against the card records in the repo
(no new primary-source reading was needed; nothing stayed unclear):

- **Linkage! appeared only after a card was Set (you, turn 2).** Its text: "send 1 other card you control to the GY,
  and if you do, Special Summon ..." and "If you control no monsters in your Main Monster Zone" (cid 17034, records
  `send-summon`, `condition`; notes `notes-emz-monster`, `notes-only-emz-monster`). With an empty field there was no
  other card to send, so it was correctly not offered; the second Linkage! could send Kagari from the EMZ. Not an error.
- **Lemnisgate! offered only while Kagari's trigger was on the chain (you, turn 2).** It targets "an equal number of
  'Sky Striker Ace' monsters and 'Sky Striker' Spells in your GY" (cid 21480, record `shuffle`). Linkage! left the GY
  when Kagari resolved, leaving no Spell to pair with Hayate. Correct.
- **Ash Blossom not offered against Linkage!** Linkage! Summons from the Extra Deck, which Ash does not cover. Correct.
- **Repeated passes in one step (you, turn 2).** After an action or chain resolves, both players pass in the response
  window, then the game state opens again and a pass asks to move on; this is the Konami response sequence already
  documented for duel 001 and the pilot (`next-phase`, `open-again`, `after-action-or-chain` in `src/rule-sources.ts`).
  Not an error, but it doubled the relays (finding 2).
- **Sage's search under Widow Anchor (turn 3).** Widow Anchor negates the targeted monster's effects; Sage's chain link
  resolved with no search. Correct (same reading as Effect Veiler in duel 003).
- **Ash on Zero's search, no "negated" line (rival, turn 2).** Zero's trigger resolved and nothing was added. Correct;
  display finding 3.
- **Roar's GY effect is a Fusion Summon** (cid 20605, record `fusion`): Tyrant from Blue-Eyes White Dragon + Spirit
  (a Dragon, cid 20609 `facts`), within Spirit's "Dragon monsters only" lock. Correct.
- **Mausoleum targeting Spirit (a Link monster).** Mausoleum targets "1 face-up monster you control" (cid 12331,
  record `send-gain`). Correct.
- **Zero's Quick Effect** (cid 21460, records `summon`, `destroy`): Raye and Roze from the Deck, then an optional
  destroy. Correct, apart from the leak above.

## YGOProJudge chats

None. No rule question stayed unclear after the card records, so no question was sent, no session was opened and no
verdict is owed.

## Engine issues

- **Hidden-information leak (stop reason):** `choose` move labels for a non-targeting "card on the field" pick name
  face-down opponent cards (Majesty of the White Dragons, at log index 143). This needs a fix in the seat view before
  the next duel.
- No illegal game outcome was seen. Points checked and found correct: Kagari at 1700 with 2 Spells in the GY; Zero at
  2000; 2000 battle damage on Sage in Attack Position; Deep-Eyes at 3000 and "banished if it leaves the field";
  Spirit +800; Widow Anchor's no-control result; Zero's destroy of Tyrant; no Battle Phase on turn 1.

## Display and usability findings (from the players' reports)

1. **Hidden card named in a choice list** (above).
2. **Phase passes and post-chain windows cost two relays each.** A Draw Phase with no action needed four single-pass
   stints. The rival's seat was handed decisions where `pass` was the only move (e.g. the turn-2 Draw Phase "end Draw
   Phase" window), with no automatic pass. 84 relays were spent reaching turn 3.
3. **No "negated" line for a negated chain link** (Ash on Zero, Widow Anchor on Sage); players inferred it from the
   hand count. Also open from duel 003 #9.
4. **Sent-to-GY lines name no cause.** Linkage!'s send of the Set The Fallen & The Virtuous showed only "is sent to the
   Graveyard"; the rival thought a card left with no activation.
5. **A refused move after toAct turned false** ("you does not hold the decision"): the `you` player sent a pass right
   after a Set, before rereading. No state change; the message is clear.

## Process

- Relays: the referee spawned each player once and sent 84 relay messages (SendMessage). Spawns: 2.
- Isolation:
  - No player received the other player's report, hand or reasoning; the referee relayed only "your priority" lines.
  - Neither player read a file, used the other seat, or raised a dispute.
  - The breach came from the engine's seat output (above), not from the relay protocol.
- Replay verification: the record replays to the stop position (144 moves, 0 disputes, turn 3 battle, toAct rival).
- No source or test file was edited, no commit was made, and nothing was published. `duel-001` and `duel-003` files were
  not touched.
