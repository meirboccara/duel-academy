# Duel 005: Sky Striker 745443 vs Blue-Eyes 746021

Date: 2026-11-26/27. This duel was completed. It counts as one of the 20 required agent-vs-agent duels.

## Setup

- Record: `duel-005.json`, a new record created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-005.json --you 745443 --rival 746021 --seed 10 --first you`.
- Seed 10. Seat `you` went first.
- `you`: Sky Striker 745443, played by a fresh Opus player (effort medium).
- `rival`: Blue-Eyes 746021, played by a fresh Sonnet player (effort medium).
- The referee was an Opus agent. It spawned each player once, then relayed priority to them one at a time with SendMessage.
  - Players never messaged each other.
  - Each player's report reached only the referee, and none of it was passed to the other player.
  - Each player got only its own Main/Extra list and the `show`/`move`/`dispute` CLI instructions.
- Duels 004 and 006 ran at the same time in the same repo. Their files were not touched.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Winner: `rival` (Blue-Eyes, Sonnet), on turn 8 in the Battle Phase.**
- Final LP: rival 10000, you 0.
- Blue-Eyes Spirit Dragon destroyed the face-down Ash Blossom, then two Blue-Eyes White Dragons attacked directly: 3600 to 600 to 0.

The record holds 253 logged moves and replays cleanly. `replay` prints `{"moves":253,"disputes":0,"turn":8,"phase":"battle","toAct":null,"winner":"rival"}`.

## Turn-by-turn summary

**Turn 1 (you, Sky Striker).**
- Upstart Goblin drew the second Upstart Goblin, which drew Raigeki; the rival went to 10000 LP.
- Normal Summoned Raye. Raye's Quick Effect tributed it and Summoned Hayate to EMZ 5.
- Link Summoned Kagari from Hayate (no Spell in the GY, so no Kagari trigger), then Shizuku from Kagari.
- Set The Fallen & The Virtuous. End Phase: Shizuku searched Engage!.

**Turn 2 (rival, Blue-Eyes).**
- Mausoleum of White, then Primite Lordly Lode (searched Ether Beryl).
- Lode's second effect declared Blue-Eyes White Dragon. You chained The Fallen & The Virtuous on Lode (cost: Ecclesia). The rival chained Primite Drillbeam (cost: revealed Ether Beryl), which negated and banished The Fallen & The Virtuous.
- Lode Special Summoned Blue-Eyes White Dragon from the Deck; Lode's lock (no effects of Special Summoned monsters this turn) applied.
- Bingo Machine, Go!!! revealed Wishes, Majesty and Blue-Eyes White Dragon; the random pick added Blue-Eyes White Dragon.
- Sage was Normal Summoned and searched Effect Veiler. Blue-Eyes Spirit Dragon was Synchro Summoned from Sage and Blue-Eyes White Dragon. Dominus Purge was Set.
- Battle: Spirit Dragon (2300 under Shizuku, 2 Spells in your GY) destroyed Shizuku: 8000 to 7200. Raye's GY trigger revived Raye in Defense Position.
- End Phase: you tributed Raye and Summoned Kagari to EMZ 5.

**Turn 3 (you).**
- Raigeki. The rival chained Spirit Dragon's tribute effect, Summoning Blue-Eyes Ultimate Spirit Dragon, which Raigeki then destroyed. Its trigger revived Blue-Eyes Spirit Dragon from the GY.
- Engage! was negated by Dominus Purge (no Trap in the rival's GY, so no destruction).
- Lemnisgate! shuffled Shizuku (to the Extra Deck) and Engage!: 2 cards, so nothing returned to the hand.
- Pot of Sloth drew 3 (the rival controlled 3 cards) and put 2 on the bottom.
- Link Summoned Shizuku from Kagari. Lemnisgate!'s GY effect was negated by Spirit Dragon.
- Set Linkage!. No attack. End Phase: Shizuku searched Widow Anchor.

**Turn 4 (rival).**
- Lode's effect was negated by your Ash Blossom. Wishes (discarding Ether Beryl) added Sage and Majesty.
- Sage Normal Summoned, searched Maiden. Maiden placed True Light; True Light revived Blue-Eyes White Dragon; Maiden's GY trigger revived Maiden. Majesty Set.
- Battle: Blue-Eyes White Dragon attacked Shizuku. You answered with Linkage! (Shizuku sent, Kagari Summoned; Kagari returned Linkage! to the hand). The attack was replayed. Spirit Dragon attacked Kagari: 7200 to 6600. Raye's GY trigger was negated by Spirit Dragon.

**Turn 5 (you).**
- Set Widow Anchor, then Linkage! from the hand: at resolution it sent the only other card you controlled, Widow Anchor, and Summoned Hayate.
- Majesty (showing Blue-Eyes White Dragon in the hand) destroyed Hayate. Raye's GY trigger was negated by Spirit Dragon again.
- Set Ash Blossom face-down as a blocker.

**Turn 6 (rival).**
- Ether Beryl's GY effect added itself to the hand. Lode's second effect Special Summoned Blue-Eyes White Dragon from the hand in Defense Position.
- Spirit Dragon destroyed the face-down Ash; Blue-Eyes White Dragon attacked directly: 6600 to 3600. Dominus Purge Set.

**Turn 7 (you).** Drew Ash Blossom, Set it face-down, passed.

**Turn 8 (rival).** Changed the second Blue-Eyes White Dragon to Attack Position. Spirit Dragon destroyed Ash; both Blue-Eyes White Dragons attacked directly for the win.

## Disputes

None were raised.

The players raised these questions in their reports instead. The referee checked each against the card records in the repo. None was an engine error:

- **Hayate gave no GY trigger when used as Link Material (you, turn 1).** Its send effect is "After damage calculation, if this card battled: You can send 1 "Sky Striker" card from your Deck to the GY" (cid 13763, record `send` in `src/cards/sky-striker-ace-hayate.ts`). No battle, no trigger.
- **Pot of Sloth offered only as a Set on turn 1.** It draws "cards equal to the number of cards your opponent controls" (cid 23010, record `draw`); the rival controlled 0 cards. On turn 3 it drew 3 for 3 cards.
- **Lordly Lode's effect after The Fallen & The Virtuous targeted Lode (you, turn 2).** The Fallen & The Virtuous was negated by Drillbeam, so Lode stayed and resolved. Konami's note (record `notes-lock-needs-card`) says nothing happens if Lode has left the field; that case did not arise.
- **"The opponent cannot activate the effects of Special Summoned monsters" (both players).** This is Lode's own lock on its controller (record `lock`), not Spirit Dragon's or Drillbeam's. The line does not name its source (finding 3).
- **Spirit Dragon's tribute effect offered in the Draw and Standby Phases (rival).** The printed text is an unrestricted Quick Effect (cid 12324, record `tribute`). It was correctly no longer offered after Spirit Dragon was revived from the GY (record `notes-tribute-not-from-graveyard`).
- **Ultimate Spirit Dragon's GY trigger after it was Special Summoned by Spirit Dragon, not Synchro Summoned (you).** The trigger is "If this card is destroyed by battle or card effect" with no Synchro condition (cid 20607, record `special-summon`).
- **Dominus Purge answering a Spell (you, turn 3).** "When a card or effect is activated that includes an effect that adds a card(s) from the Deck to the hand" (cid 20257, record `negate`): Engage! searches. Not offered against Raigeki, which does not search.
- **Lemnisgate! returned nothing (you, turn 3).** The return needs 3 shuffled cards, as in duels 001 and 003.
- **Sage's DEF 1100 under Shizuku (you, turn 4).** Sage's printed DEF is 1500 (`facts.def` in `src/cards/sage-with-eyes-of-blue.ts`), and Shizuku took 400 (4 Spells). The player later corrected itself.
- **True Light used the turn Maiden placed it (you, turn 4).** It was placed face-up, not Set, so its effects could be used at once.
- **Blue-Eyes White Dragon's replay (you, turn 4).** After Linkage! removed Shizuku, the rival's move list offered Blue-Eyes White Dragon another attack (on Kagari), as well as other attackers. The rival attacked with Spirit Dragon instead, which ends the replay; Blue-Eyes White Dragon had no attack left. This follows the engine's replay record `replay` (RB10, `src/battle.ts`).
- **Widow Anchor not offered on Blue-Eyes White Dragon (you).** It targets Effect Monsters, and True Light also protects Blue-Eyes White Dragon from targeting.
- **Linkage! activated with no monster on the field (you, turn 5).** Its condition is "If you control no monsters in your Main Monster Zone" (cid 17034, record `condition`). The send is part of the resolution ("also send 1 other card you control to the GY", record `send-summon`), not a cost; with only the Set Widow Anchor on the field, it sent that. The player called this its own misplay.
- **Second Blue-Eyes White Dragon not offered as an attacker (rival, turn 6).** Lode Summons in Defense Position (record `summon`).
- **The opponent's named hand cards (you, turns 2 and 5).** The `you` player stopped once to report "primite-dragon-ether-beryl" in the rival's hand as a possible leak, and asked about "blue-eyes-white-dragon" later. Both were public: Ether Beryl was shown as Drillbeam's reveal cost (the referee rebuilt the earlier position from a truncated copy of the record in the OS temp folder, since deleted), and Blue-Eyes White Dragon was shown by Majesty. The referee told the player only that the card was public.

## YGOProJudge chats

None. No rule question stayed unclear after the card records, so no topic was proposed to the coordinator, no question was sent, and no verdict is owed.

## Engine issues

None. There were no illegal outcomes, no unexplained errors and no replay failures.

Points checked and found correct:
- Shizuku's ATK/DEF loss on every opponent monster (100 per Spell in your GY), and the return to base stats once Shizuku left.
- Kagari's ATK (1700, 1800, 1900, 2000 as Spells entered the GY).
- Spirit Dragon's negation of GY activations (once per turn), its tribute effect, and that effect's loss after a revival from the GY.
- Raigeki destroying a monster Summoned by a chain link resolving before it.
- Dominus Purge and Ash Blossom negations; Drillbeam's negate and banish.
- Lode's lock applied on turn 2, and not applied on turn 4 when Ash negated Lode.
- Pot of Sloth: 3 draws, 2 to the bottom, its own lock.
- Battle damage: 800, 600, 3000, 3000, then 600 (capped).
- Hidden information: searched cards, Sets, Pot of Sloth's draws and the returned cards stayed hidden from the other seat.

## Display and usability findings

New in this duel:
1. **Revealed cards are logged as hidden.** Bingo Machine's three revealed cards and Majesty's shown Blue-Eyes White Dragon appear to the other seat only as `choose ?`, with no "reveals" or "shows" line. The board then lists the shown card as known in the hand, with no line explaining why, so the `you` player stopped once and asked again later.
2. **A public card returned to the hand is shown as `?`.** Ether Beryl, known to both players, went GY to hand by its own effect on turn 6, but the `you` seat lists the rival's hand as all `?`.
3. **Lasting effects do not name their source.** "you cannot activate the effects of Special Summoned monsters on the field" was read as Drillbeam's by the rival and as Spirit Dragon's by the `you` player; it is Lode's.
4. **Continuous stat changes are not listed.** Shizuku's ATK/DEF loss shows only in the changed numbers; neither player could see its source in "Effects in force".
5. **Battle summary lines arrive late.** "battle: X attacked Y; ..." prints after any chain started in that battle has resolved (Raye's revival on turn 2, Kagari's trigger on turn 4), so both players took it for a second battle.
6. **A stopped attack reads as a finished one.** The replay case printed "battle: blue-eyes-white-dragon attacked sky-striker-ace-shizuku; no damage", with no word that the attack was stopped and could be replayed.
7. **Linkage!'s send is shown in different places.** On turn 4 the send line printed under the activation, on turn 5 under the opponent's pass. It is a resolution step, but the turn-4 placement made the `you` player take it for a cost, and that led to its turn-5 misplay.
8. **Special Summons by Spirit Dragon name no zone** ("is Special Summoned from the opponent's Extra Deck"), and the summon and destruction lines print after Raigeki's resolution line.
9. **Mausoleum of White's move detail says "Continuous Spell from the hand"** although it is a Field Spell (`facts.icon: "field"`).
10. **Choice prompts do not say how many picks or what a pick means.** Pot of Sloth's third `choose` sets the order; Bingo Machine needs three picks; True Light's `#5 :1` does not say it Summons.
11. **Move details miss part of the effect.** Widow Anchor says only "does: negate"; Lemnisgate!'s GY effect does not say what it Summons; Ash Blossom, Effect Veiler and Maiden say "no category recorded".
12. **The 15-entry log tail was misread as misaligned headers** by the `you` player several times. The referee found the headers correct; the nested lines under each entry make the tail hard to scan.

Already listed in duels 001-003 and seen again:
- Duel 003 #9: a negated chain link resolves with no "negated" line (Dominus Purge, Ash, Spirit Dragon). Both players asked about it.
- Duel 003 #7: lines from a resolving effect that asks a question print before the "chain link N resolves" line (Linkage!, Pot of Sloth, Spirit Dragon).
- Duel 003 #3: costs do not say whether a card is revealed or discarded (Drillbeam's `~ primite-dragon-ether-beryl`).
- Duel 003 #5: Lemnisgate!'s detail lists `return-to-hand` without the 3-card condition.
- Duel 001 #7 / duel 002 #2: identical cards give identical move labels (two Blue-Eyes White Dragons' attacks and position changes).
- Duel 001 #10: phase passes cost relays. Each phase took up to four passes; after every resolved chain the turn player got a response window with no Main Phase actions, and the rival twice passed by mistake there, expecting the Main Phase menu.

Fixed since earlier duels, as seen here: the Chain section printed once (duel 003 #8); Lode's lock is now worded narrowly (duel 003 #1); Set moves accept `--zone` (duel 002 #1) and players used it.

## Process

- Relays: the referee spawned each player once and sent 132 relay messages (SendMessage), under the 150 cap. Two relays added a referee note that a named card was public (no hand or reasoning passed on). Two relays to the rival added a procedure reminder.
- Procedure lapses (rival): it twice moved without running `show` first (a forced or chosen pass each time, matching `--expect`). Once it sent two extra pass commands in a short loop; the engine rejected both ("rival does not hold the decision"), so no move came of it. It was reminded and did not repeat it. Once it passed `--zone` on a position change and the engine rejected it.
- The rival's turn-6 stint stopped at the 40-decision limit; the `you` seat had no legal response during turns 6 and 8 and was never woken then.
- Isolation:
  - No player received the other player's report, hand or private information. The referee relayed only "your priority; turn N phase X" lines, the two "that card is public" notes and the procedure reminders.
  - No player reported knowing the other seat's hidden cards. Every hidden card a player named was its own, or public (Ether Beryl revealed by Drillbeam, Blue-Eyes White Dragon shown by Majesty, Linkage! returned by Kagari).
  - The referee read both seats' views and rebuilt one earlier position in the OS temp folder to check reports; nothing from them was passed on, and the temp copy was deleted.
- No source or test file was edited, no commit was made, and nothing was published. The only files written are `duel-005.json` (created by the CLI) and this report. No dispute ruling was recorded, since none was raised.

## Replay verification

`node scripts/agent-play.cjs replay ../../docs/rules-core/duel-testing/duel-005.json` after the duel ended:
`{"moves":253,"disputes":0,"turn":8,"phase":"battle","toAct":null,"winner":"rival"}`.
