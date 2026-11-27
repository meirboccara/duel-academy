# Duel 001: Sky Striker 745443 vs Blue-Eyes 746021

Date: 2026-11-26. This is a rerun: the first attempt was stopped by an engine defect, which has since been fixed. It counts as one of the 20 required agent-vs-agent duels.

## Setup

- Record: `duel-001.json`, created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-001.json --you 745443 --rival 746021 --seed 4 --first you`.
- Seed 4. Seat `you` went first.
- `you`: Sky Striker 745443, played by a fresh Sonnet player (effort medium).
- `rival`: Blue-Eyes 746021, played by a fresh Opus player (effort medium).
- The referee was an Opus agent. It spawned each player once, then relayed priority to them one at a time with SendMessage. Players never messaged each other. Each player's report reached only the referee, and no report text, hand or deck information was passed on to the other player.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Winner: `rival` (Blue-Eyes, Opus), on turn 4 in the Battle Phase.** Final LP: rival 10000, you 0. Blue-Eyes Ultimate Spirit Dragon (4500) attacked directly into 3300 LP.

The record holds 137 logged moves and replays cleanly: `replay` prints `{"moves":137,"disputes":0,"turn":4,"phase":"battle","toAct":null,"winner":"rival"}`.

## Turn-by-turn summary

**Turn 1 (you, Sky Striker).**
- Upstart Goblin: you drew 1, rival went to 9000 LP. Rival passed with Ash in hand.
- You Normal Summoned Roze, used it to Link Summon Hayate (EMZ), and activated Linkage!: Hayate was sent, and Kagari was Summoned to the EMZ.
- Kagari's trigger targeted Linkage! in the GY. Rival chained Effect Veiler on Kagari, so the trigger was negated.
- You activated Lemnisgate!, shuffling Roze and Linkage! back into the Deck. It returned no card, because the player had misremembered the card.
- You Set Radiant Typhoon Vision and ended the turn holding Ash Blossom.

**Turn 2 (rival, Blue-Eyes).**
- Bingo Machine, Go!!!: you chained Ash Blossom and negated it. Rival then played Primite Lordly Lode, searching Primite Dragon Ether Beryl.
- Deep-Eyes discarded itself to search Sage with Eyes of Blue. Sage was Normal Summoned and searched Maiden of White.
- Maiden's hand effect placed True Light face-up. True Light Set Wishes for Eyes of Blue from the Deck.
- Rival Link Summoned Spirit with Eyes of Blue, which searched Mausoleum of White, and activated Mausoleum.
- Wishes (discarding Ether Beryl) added Sage and Majesty of the White Dragons. A second Sage, Normal Summoned through Mausoleum's extra Summon, searched Effect Veiler.
- Mausoleum targeted Sage and sent Blue-Eyes White Dragon from the Deck (Sage +800). Deep-Eyes' GY trigger Special Summoned itself at 3000 ATK.
- Spirit's effect revived Blue-Eyes White Dragon. Maiden's GY trigger revived Maiden.
- Rival Synchro Summoned Blue-Eyes Ultimate Spirit Dragon from Sage, Maiden and Deep-Eyes (2 Tuners + 1 non-Tuner Blue-Eyes); Deep-Eyes was banished by its own clause. Rival Set Majesty.
- Battle: Blue-Eyes White Dragon attacked Kagari. You activated Radiant Typhoon Vision and rival chained Ash on it. Kagari, now 1800 with 3 Spells in the GY, was destroyed: you took 1200, from 8000 to 6800.
- Ultimate Spirit attacked directly for 3500: you went to 3300.

**Turn 3 (you).**
- You drew Upstart Goblin. Upstart drew Lemnisgate! and put rival on 10000 LP.
- Lemnisgate! targeted Kagari and Lemnisgate! in the GY. Rival negated it with Ultimate Spirit Dragon's Quick Effect, which took the Dragon to 4500.
- You had no cards left and passed through every phase.

**Turn 4 (rival).**
- Rival declined White Phantom Beast's draw trigger and Ether Beryl's GY effect, went to battle, and Ultimate Spirit attacked directly for the win.

## Disputes

None were raised. Both players asked rules questions in their reports instead, and the referee checked each against the card text records in the repo:

- **Opponent passes, yet the activating player acts again (rival, turn 1).** After rival passed on Upstart Goblin, the chain did not resolve at once: the activating player was offered one more chance to chain. That follows the Konami response sequence (a chain resolves after both players pass in succession), and the Window line said so ("response window: passing lets the chain resolve"). Not an error.
- **Wishes for Eyes of Blue activated the turn it was Set (rival, turn 2).** Wishes is a Normal Spell by its printed text (record in `src/cards/wishes-for-eyes-of-blue.ts`). Only Traps and Quick-Play Spells must wait a turn after being Set. The referee told the rival this rule answer; it contained no hidden information.
- **No Synchro offered for Sage + Deep-Eyes, Level 11 (rival, turn 2).** Psychic End Punisher (Level 11) was not offered because Spirit with Eyes of Blue was face-up, and its text says "You cannot Special Summon, except Dragon monsters" (cid 20609, record `lock`). Psychic End Punisher is a Psychic. The referee checked this by rebuilding the earlier position from a truncated copy of the record (temp folder, not in the repo). Not an error.
- **Sage's "send and Summon" effect missing on the field (rival, turn 2).** The printed text is a hand effect ("You can discard this card, then target...", cid 12292), so it cannot be used while Sage is on the field. Not an error.
- **Ash Blossom offered on the rival's own Lordly Lode.** Ash's text does not limit it to the opponent's cards, so the offer is legal, though pointless.
- **Wishes' second add with no choice.** Majesty was the only Spell/Trap left in the Deck that mentions Blue-Eyes White Dragon and is not Wishes, so an automatic pick is legal.

## YGOProJudge chats

None. No rule question stayed unclear after the card text records, so no question was sent and no verdict is owed.

## Engine issues

None. There were no illegal outcomes, no unexplained errors and no replay failures. Points checked and found correct:
- Kagari's ATK under Veiler and after.
- Deep-Eyes' printed 0/0, with ATK set to Blue-Eyes White Dragon's 3000.
- Mausoleum's Level x 100 boost.
- Ultimate Spirit's materials and its negation with +1000 ATK.
- Battle damage of 1200, 3500 and 4500.

## Display and usability findings (from the players' reports)

1. Effect labels (`#1`, `#2`, `#5 :2`, `=Blue-Eyes White Dragon`) never say what the effect does or what an option chooses. Both players chose blind at least once: Sonnet activated Radiant Typhoon Vision and Lemnisgate! without knowing their effects, and Opus did not know True Light's option 2 Sets a card.
2. Zone prompts (`place N`) do not say whether they mean a monster or a Spell/Trap zone, or which card is being placed. Opus expected a monster zone and got True Light in the Spell/Trap zone. Nothing says which EMZ or Link arrows matter.
3. Link monsters show a DEF of `/0` (Hayate, Kagari).
4. The log does not name the opponent's summon or choice: it shows `special-summon ?` and `choose ?`. Opus could not see that Hayate was Link Summoned, or which Link monster Linkage chose.
5. The log has no lines for battle damage, negation, ATK changes or effect results. Players worked out the Ash negation of Lemnisgate!, the +1000 on Ultimate Spirit and the 1200 battle damage from LP, GY and hand counts.
6. Battles fill the log with about 10 automatic passes per attack, so the Damage Step steps cannot be told apart.
7. Search lists show each copy separately: Deep-Eyes' search listed 8 entries for 3 distinct cards, and Mausoleum listed two identical Blue-Eyes White Dragon entries.
8. Synchro Summons pick the materials without asking. That was correct here, since only one set was legal, but the player cannot see which materials will be used.
9. A rejected move ("placement is not legal for the selected move") does not explain why (a Normal Summon must be face-up attack).
10. Each phase step costs one wake-up per player, plus a "passing keeps <phase>" window after every action. Passing in Main Phase 1 always enters the Battle Phase, even with no monsters. Many relays were spent on passes.
11. The text output after the duel ended cut the LP line short, so the final damage number does not show.
12. `move` prints the full JSON state.
13. Sonnet read the 40-decision stop as counting across stints and stopped early several times. The referee clarified mid-duel that the limit is per stint.

## Process

- Relays: the referee spawned each player once and sent 85 relay messages (SendMessage), which is under the 150 cap. One message to `you` went out twice by mistake while that agent was still running. The player found toAct false on the next check and did nothing, and no move came of it.
- Opus's tool count climbed sharply during turn 2. When asked, it confirmed it used only the `show`/`move` CLI for its own seat, never ran show for the other seat, and opened no file. Sonnet's reports contain nothing beyond its own seat view.
- Isolation: no player received the other player's report, hand or private information, and no player reported knowing the other seat's hidden cards. The referee kept every player report to itself, and relayed only "your priority" lines plus one general rule answer (Set Normal Spells) to the rival.
- No source or test file was edited, no commit was made, and nothing was published.
