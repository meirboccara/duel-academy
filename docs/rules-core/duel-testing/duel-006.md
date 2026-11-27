# Duel 006: Sky Striker 745443 vs Blue-Eyes 746021

Date: 2026-11-26. This duel was completed. It counts as one of the 20 required agent-vs-agent duels.

## Setup

- Record: `duel-006.json`, a new record created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-006.json --you 745443 --rival 746021 --seed 11 --first you`.
- Seed 11. Seat `you` went first.
- `you`: Sky Striker 745443, played by a fresh Sonnet player (effort medium).
- `rival`: Blue-Eyes 746021, played by a fresh Opus player (effort medium).
- The referee was an Opus agent. It spawned each player once, then relayed priority to them one at a time with SendMessage.
  - Players never messaged each other.
  - Each player's report reached only the referee, and none of it was passed to the other player.
  - Each player got only its own Main/Extra list and the `show`/`move`/`dispute` CLI instructions.
- Duels 004 and 005 ran at the same time in the same repo. Their files were not touched.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

The lists are the same as in duels 001 to 003.

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Winner: `rival` (Blue-Eyes, Opus), on turn 10 in the Battle Phase.**
- Final LP: rival 8400, you 0.
- Blue-Eyes White Dragon (4000 ATK: 3000, +600 from two Lordly Lodes, +400 from the Neo Blue-Eyes Ultimate Dragon equip) attacked directly into 800 LP. It is logged as -800.

The record holds 188 logged moves and replays cleanly. `replay` prints `{"moves":188,"disputes":0,"turn":10,"phase":"battle","toAct":null,"winner":"rival"}`.

## Turn-by-turn summary

**Turn 1 (you, Sky Striker).**
- Two Upstart Goblins: you drew 2 (Ash Blossom, Shark Cannon), rival went to 10000 LP.
- You Set Linkage! and The Fallen & The Virtuous and ended the turn (no Battle Phase on turn 1).

**Turn 2 (rival, Blue-Eyes).**
- Primite Lordly Lode was activated for its search. You chained Ash Blossom, so the search was negated. Lode stayed face-up.
- Bingo Machine, Go!!! revealed Blue-Eyes White Dragon, Wishes for Eyes of Blue and Roar of the Blue-Eyed Dragons. The engine's random pick (the opponent's "random pick") added Roar.
- Roar Special Summoned Blue-Eyes White Dragon from the Deck in Defense Position (Dragon-only Extra Deck lock).
- Lode's second effect (declare Blue-Eyes White Dragon) was activated. You chained the Set The Fallen & The Virtuous, sending Ecclesia from the Extra Deck as cost, and destroyed that Blue-Eyes. Lode then revived it from the GY. Lode's lock applied ("cannot activate the effects of Special Summoned monsters on the field" this turn).
- Sage with Eyes of Blue, Normal Summoned, searched Effect Veiler. The rival Synchro Summoned Blue-Eyes Spirit Dragon (Blue-Eyes + Sage). Its Synchro trigger was not offered, correctly, under Lode's lock.
- The rival Set Majesty of the White Dragons. Spirit Dragon attacked directly: you 8000 to 5500.

**Turn 3 (you).**
- Shark Cannon targeted Blue-Eyes White Dragon in the rival's GY. With 3 Spells in your GY you chose to Special Summon it to your field; it cannot attack.
- The second The Fallen & The Virtuous (cost: The Dragon that Devours the Dogma) targeted Spirit Dragon. The rival chained Spirit Dragon's Quick Effect: it Tributed itself and Special Summoned Blue-Eyes Ultimate Spirit Dragon from the Extra Deck in Defense Position. The Fallen & The Virtuous lost its target.
- Ecclesia's GY effect targeted the Dogma dragon and Ultimate Spirit Dragon. The rival chained Majesty, which resolved with nothing shown and destroyed nothing (no Blue-Eyes White Dragon in the rival's hand, field or GY). Ecclesia shuffled the Ultimate Spirit Dragon back into the Extra Deck and Ecclesia and the Dogma dragon into yours.
- You Normal Summoned Mulcharmy Fuwalos and attacked directly for 100: rival 10000 to 9900. Blue-Eyes could not attack.

**Turn 4 (rival).**
- The rival drew Droll & Lock Bird. A second Lordly Lode searched Primite Drillbeam. Lode's second effect Special Summoned the last Blue-Eyes White Dragon from the Deck.
- The rival Normal Summoned Effect Veiler and Synchro Summoned a second Blue-Eyes Spirit Dragon, then Set Drillbeam.
- Spirit Dragon attacked Fuwalos: you 5500 to 3100.

**Turn 5 (you).** You drew Ash Blossom and kept it. Blue-Eyes could not attack. No other play.

**Turn 6 (rival).**
- Wishes for Eyes of Blue (cost: discard Droll & Lock Bird): you chained Ash Blossom and negated the search.
- The rival Normal Summoned Ghost Ogre & Snow Rabbit and Synchro Summoned Crimson Dragon (Spirit Dragon + Ghost Ogre, Level 12, 0/0).
- Lode revived Blue-Eyes White Dragon from the GY. Roar's GY effect (banish itself) Fusion Summoned Blue-Eyes Tyrant Dragon from Blue-Eyes and Crimson Dragon.
- Tyrant attacked the Blue-Eyes White Dragon on your field: you 3100 to 2700. That Blue-Eyes went to its owner's GY.

**Turn 7 (you).**
- You drew Widow Anchor and Set it. Linkage! sent it (the only other card you controlled) and Special Summoned Sky Striker Ace - Hayate to the Extra Monster Zone.
- Hayate attacked directly: rival 9900 to 8400. Its trigger sent Raye from the Deck to the GY.

**Turn 8 (rival).**
- The rival drew Infinite Impermanence. Lode revived Blue-Eyes White Dragon in Defense Position.
- Drillbeam (no reveal needed: the rival controlled a Normal Monster) negated and banished Hayate. Raye's GY effect Special Summoned Raye.
- Wishes' GY effect equipped Neo Blue-Eyes Ultimate Dragon to Blue-Eyes White Dragon (4000 ATK). The rival Set Infinite Impermanence.
- Tyrant attacked Raye. You Tributed Raye for a second Hayate in the Extra Monster Zone. The battle with Raye ended with no damage. Tyrant then attacked Hayate: you 2700 to 800. Hayate's trigger sent Roze, then Hayate was destroyed.

**Turn 9 (you).** Radiant Typhoon Vision drew 2 (Lightning Storm and a second Radiant Typhoon Vision) and discarded the second Vision. Lightning Storm destroyed Tyrant Dragon, the rival's only Attack Position monster. You had no other play.

**Turn 10 (rival).** The rival changed Blue-Eyes White Dragon to Attack Position and attacked directly for the win.

## Disputes

None were raised.

The players raised these questions in their reports instead. The referee checked each against the card records in the repo and, where noted, Konami pages. None was an engine error:

- **The non-turn player passed first in the Draw Phase (rival, turn 2).** After the normal draw, the turn player has closed-state priority first (`nextPhase` in `src/chain.ts`, `closedPriority(player)`). The rival had no legal response, so its pass was automatic and was printed under the previous turn's End Phase line. Your pass, the rival's pass in the open state, and your last pass followed. Correct order; the log placement misled the player (finding 3).
- **No chance to chain to one's own activation first (rival).** Konami's Fast Effect Timing chart, row "after activation": "The player who did NOT activate the effect" gets priority (record `after-activation` in `src/rule-sources.ts`). The activating player can still add a link after the opponent passes (record `chain-own-link`). Correct.
- **Bingo Machine, Go!!! offered copies of one name, Deep-Eyes and White Phantom Beast, and did not show who picked (rival).** The text asks for 3 cards that each meet a criterion, with no "different names" (cid 13844, records `reveal`, `criterion-monster`); "Blue-Eyes" monster includes Deep-Eyes, which is "always treated as a 'Blue-Eyes' card" (cid 22717, record `treated`), and White Phantom Beast by name. "Your opponent randomly picks 1" is the engine's RNG (record `random-pick`). Correct; the random pick has no log line (finding 6).
- **Roar summoned in Defense Position (rival).** Roar: "Special Summon in Defense Position" (cid 20605, record `summon`). Correct.
- **Lode summoned from the Deck or the GY (rival).** Lode: "from your hand, Deck, or GY in Defense Position" (cid 20534, record `summon`). Correct.
- **A pass window before Sage's Summon trigger (rival, turn 2).** Both passes were automatic (no legal response), in the window after the Normal Summon, before the trigger was activated. No player could act there, so no rule was affected.
- **Ultimate Spirit Dragon Special Summoned straight from the Extra Deck (rival).** Spirit Dragon: "Special Summon 1 LIGHT Dragon Synchro Monster from your Extra Deck in Defense Position ... but destroy it during the End Phase" (cid 12324, record `tribute`). Ultimate Spirit Dragon has no "must be Synchro Summoned" clause (cid 20607). Correct.
- **Ultimate Spirit Dragon's negation offered against Majesty but not against Ecclesia (rival).** It answers "When a card or effect is activated on the field" (cid 20607, record `negate`). Ecclesia's effect was activated in the GY. Correct.
- **Majesty of the White Dragons resolved with no effect (rival, turn 3).** Its effect shows "up to 3" Blue-Eyes White Dragon from the hand, face-up Monster Zone or GY, then destroys that many (cid 20606, record `show`). The rival had none in those places (one was on your field, the other in its Deck). Konami's notes (cid 20606, read 2026-11-26 in full): "処理時に…３体まで選び、お互いに確認する』処理を行い、１枚以上確認した場合、その後、『確認した数だけ相手フィールドのカードを破壊する』処理を行います": the destruction happens only if 1 or more were shown, so resolving with none is foreseen. The notes do not say whether the card may be activated with no Blue-Eyes to show; the engine allows it. That point is the engine's reading only, not checked against a Q&A; it did not change the duel (Majesty was chained to Ecclesia and destroyed nothing).
- **Blue-Eyes White Dragon could not attack (you, turns 3 and 5).** Shark Cannon: "you can Special Summon that monster to your field instead, but it cannot attack" (cid 13677, record `cannot-attack`). Correct; the player missed the lasting-effect line because it names no monster (finding 1).
- **Crimson Dragon was 0/0 (rival).** Printed ATK 0 DEF 0 (cid 18825, record `facts`). Correct.
- **Roar's Fusion picked the monster and materials without asking (rival, turn 6).** On the rival's field and hand, only Blue-Eyes White Dragon + Crimson Dragon could make a Fusion Monster (Blue-Eyes Tyrant Dragon: "Blue-Eyes White Dragon" + 1 Dragon monster, cid 16842). Only one legal set, so the automatic choice is legal (same as duel 001 #8).
- **Drillbeam offered own cards but not the opponent's Blue-Eyes White Dragon (rival, turn 4).** Konami's notes: "効果を持たないモンスターを対象に選択することはできません" (no monster without effects can be targeted; cid 20536, record `notes-targets`). Correct. Its "custom payment" cost on turn 8 was the free way: the rival controlled a Normal Monster (record `reveal-free`).
- **Lode effect 2 listed twice with two Lodes face-up (rival).** One line per copy; once one is used, the once-per-turn by name removes both (card text cid 20534, record `once`). Legal, but see finding 7.
- **Hayate's direct attack while the opponent had a monster (you, turn 7).** Hayate: "Can attack directly" (cid 13763, record `direct`). Correct.
- **Widow Anchor vanished when Linkage! resolved (you, turn 7).** Linkage!: "also send 1 other card you control to the GY, and if you do, Special Summon 1 'Sky Striker Ace' monster from your Extra Deck to the Extra Monster Zone" (cid 17034, record `send-summon`). The Set Widow Anchor was the only other card. Correct.
- **Raye's revival after Drillbeam banished Hayate (you, turn 8).** Raye: "if a face-up 'Sky Striker Ace' Link Monster you control ... leaves the field by an opponent's card effect: You can Special Summon this card" (cid 13670, record `revive`). Correct.
- **Blue-Eyes at 3600 before Wishes resolved, then 4000 (rival, turn 8).** Each Lode gives Normal Monsters "300 ATK for each Normal Monster with different names in your GY" (cid 20534, record `atk`): one name, two Lodes, +600. The Wishes equip "gives it 400 ATK" (cid 20604). Correct.
- **Tyrant attacked again after Raye left (both players, turn 8).** When the attack target left the field, the battle with Raye ended with no damage, and Tyrant attacked the new Hayate. Either as a replay or by Tyrant's "Can attack all monsters your opponent controls, once each" (cid 16842, record `attack-all`; Konami Q&A fid 16016 for a replay with that effect), the attack was legal. The log line "attacked sky-striker-ace-raye; no damage" reads like a finished battle (finding 9).
- **Hayate seemed to survive the 3400 attack (you, turn 8).** Hayate's trigger ("After damage calculation, if this card battled", cid 13763, record `send`) resolved first, then Hayate was destroyed at the end of the Damage Step. The log printed the destruction after the trigger. Correct order.
- **Radiant Typhoon Vision's second card (you, turn 9).** It draws 2, then discards a "Radiant Typhoon" card or Quick-Play Spell from the hand, or the whole hand if there is none (cid 21829, record `draw`). The second card drawn was the second Vision, discarded as the only eligible card. Correct, but the log hides the draw (finding 4).
- **Final damage logged as -800 (rival, turn 10).** Damage capped at the remaining LP, as in duel 002 #6.

## YGOProJudge chats

None. Every rules question was settled by the card records and Konami pages, so no question was sent and no verdict is owed. The Majesty point (activation with nothing to show) did not affect the duel and stays the engine's reading.

## Engine issues

None. There were no illegal outcomes, no unexplained errors and no replay failures.

Points checked and found correct:
- Draw Phase priority order (turn player first, closed state then open state).
- Ash Blossom's negation of Lode's and Wishes' searches; Lode staying face-up after its activation was negated.
- Lode's lock: Spirit Dragon's Synchro trigger was not offered under it.
- Shark Cannon's "Special Summon instead" with 3 Spells in the GY, and its "cannot attack" on turns 3 and 5.
- Spirit Dragon's Tribute Quick Effect, the End Phase destruction it schedules, and that schedule being dropped when Ultimate Spirit Dragon left by Ecclesia.
- Drillbeam's free cost, its targets, its negation then banishment.
- The Lode and Wishes ATK boosts (3000 + 600 + 400).
- Battle damage: 2500, 100, 2400, 400, 1500, 1900, then 4000 into 800 LP.
- The stale "cannot attack" lasting effect did not block the Blue-Eyes White Dragon that attacked on turn 10.

## Display and usability findings (from the players' reports and the referee's checks)

New in this duel:

1. **A lasting effect names no monster and outlives it.** Shark Cannon's line reads "both players cannot attack with that monster, for the rest of the Duel" without naming the card, and it stayed under "Effects in force" until the end, after that Blue-Eyes left the field on turn 6. The `you` player missed it and asked twice why Blue-Eyes could not attack. The same for "the effects of sky-striker-ace-hayate are negated (primite-drillbeam), until the end of turn 8" after Hayate was banished.
2. **Lasting-effect lines do not name their source.** "you cannot activate the effects of Special Summoned monsters on the field" did not say it came from Lordly Lode; the rival guessed.
3. **A Draw Phase automatic pass prints under the previous End Phase.** The turn player's automatic closed-state pass after the normal draw shows under the previous turn's End Phase, so the rival read the order as the non-turn player acting first (same family as duel 003 #7).
4. **A card drawn and discarded in one resolution is logged as coming from the Deck.** Radiant Typhoon Vision's log reads "you draw lightning-storm" then "radiant-typhoon-vision is discarded to the Graveyard from your Deck"; the second draw has no line. The `you` player could not tell what the second card was. The opponent's view showed one draw. The engine moved the card Deck to hand to GY (card file); only the log, which diffs the state before and after the resolution, is wrong.
5. **The summon of a chained effect prints after the next link resolves.** With Spirit Dragon (chain link 2) answering The Fallen & The Virtuous (link 1), the log printed "chain link 2 resolves", "chain link 1 resolves", then Ultimate Spirit Dragon's Special Summon. Drillbeam's negation line also printed after its banishment. Same family as duel 003 #7, more misleading here.
6. **Random picks have no log line.** Bingo Machine's random pick goes straight to "you add roar-of-the-blue-eyed-dragons".
7. **Two copies of one face-up card give two identical effect lines** (Lode effect 2), the field version of duel 002 #2.
8. **"No category recorded" and "custom payment".** Wishes' GY effect showed "no category recorded", and Drillbeam's cost "cost (custom payment)", so the player could not tell what they do.
9. **A battle ended by a replay reads like a finished battle.** "battle: blue-eyes-tyrant-dragon attacked sky-striker-ace-raye; no damage" does not say the target left and the attack could be redirected.

Still open from duels 001 to 003:
- Duel 003 #4: a "you can" option shown as a card pick. Shark Cannon's banish-or-Summon choice appeared as "choose sky-striker-mecha-shark-cannon"; the rival read it as targeting.
- Duel 003 #7 and duel 002 #5: log order and the 15-line tail read as new events (reported by the rival four times).
- Duel 003 #9: a resolution with no outcome has no line. Majesty resolved with no log line; The Fallen & The Virtuous with a lost target had none either.
- Duel 001 #10: phase passes cost relays.
- Duel 002 #6: capped damage hides the attack value.

Fixed or not seen this time:
- Duel 003 #1 (Lode lock worded too broadly): fixed. The line now reads "cannot activate the effects of Special Summoned monsters on the field".
- Duel 003 #8 (Chain section printed twice): not seen.
- No hidden information was shown to either seat. Opponent choices showed as `choose ?`, `special-summon ?` and `set ?`, the opponent's draws as "draws 1 card".

## Process

- Relays: the referee spawned each player once and sent 68 relay messages (SendMessage), under the 150 cap. The duel ended on turn 10, under the 14-turn cap.
- Procedure deviation (`you` player, turn 3): the player passed the Battle Phase and Main Phase 2 in a shell loop of `move` commands, without re-reading the board between them. The loop's third pass was rejected ("you does not hold the decision"). The two passes that went through were legal, matched the player's stated plan, and replay cleanly. The referee added "no loops or scripts; one move per command, re-read before each move" to the next relay, and the player confirmed it. No other deviation was seen.
- Referee notes to the coordinator: the judge-coordination rule (send any planned judge topic to the coordinator first) was acknowledged. No judge topic arose.
- Isolation:
  - No player received the other player's report, hand or private information. The referee relayed only "your priority; turn N phase X" lines and the one procedure reminder.
  - No player reported seeing a hidden card of the other seat. Every hidden card a player named was its own, or had been revealed (Bingo Machine's three cards, cards in the GY).
  - The referee read both seats' views to check reports; nothing from them was passed on.
- No source or test file was edited, no commit was made, and nothing was published. The only files written are `duel-006.json` (by the CLI) and this report. Konami's Majesty pages (cid 20606 notes and Q&A list) were saved to the OS temp folder `ss-pages-d006`, outside the repo.

## Replay verification

`node scripts/agent-play.cjs replay ../../docs/rules-core/duel-testing/duel-006.json` after the duel ended:
`{"moves":188,"disputes":0,"turn":10,"phase":"battle","toAct":null,"winner":"rival"}`.
