# Duel 003: Sky Striker 745443 vs Blue-Eyes 746021

Date: 2026-11-26. This duel was completed. It counts as one of the 20 required agent-vs-agent duels.

## Setup

- Record: `duel-003.json`, created with `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-003.json --you 745443 --rival 746021 --seed 6 --first rival`.
- Seed 6. Seat `rival` went first.
- `you`: Sky Striker 745443, played by a fresh Opus player (effort medium).
- `rival`: Blue-Eyes 746021, played by a fresh Sonnet player (effort medium).
- The referee was an Opus agent. It spawned each player once, then relayed priority to them one at a time with SendMessage.
  - Players never messaged each other.
  - Each player's report reached only the referee, and none of it was passed to the other player.
- Duel 002 ran at the same time in the same repo. Its files were not touched.

### Lists (from `packages/rules/src/deck-manifests.ts`, Main + Extra, no Side)

**Sky Striker 745443.**
- Main: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia, 1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze, 1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!, 2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
- Extra: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea, 2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero, 1 The Dragon that Devours the Dogma.

**Blue-Eyes 746021.**
- Main: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon, 1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge, 1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White, 1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam, 3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
- Extra: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon, 1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher, 2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Winner: `you` (Sky Striker, Opus), on turn 4 in the Battle Phase.**
- Final LP: you 8000, rival 0.
- Three direct attacks of 1500 each (Azalea, Roze, Raye) dealt 4500 into 4200 LP.

The record holds 115 logged moves and replays cleanly. `replay` prints `{"moves":115,"disputes":0,"turn":4,"phase":"battle","toAct":null,"winner":"you"}`.

## Turn-by-turn summary

**Turn 1 (rival, Blue-Eyes).**
- In the rival's Draw Phase, you discarded Mulcharmy Fuwalos, which covers the rival's whole turn.
- Primite Lordly Lode was activated and searched Primite Dragon Ether Beryl.
- Lode's second effect Special Summoned Blue-Eyes White Dragon from the Deck in Defense Position.
  - Fuwalos drew you 1 card.
  - Lode's lock applied ("you cannot activate the effects of Special Summoned monsters on the field this turn").
- The rival ended the turn holding 2 Effect Veiler, Ghost Ogre & Snow Rabbit, a Blue-Eyes White Dragon and Ether Beryl. Fuwalos' End Phase hand check took no cards.

**Turn 2 (you, Sky Striker).**
- Upstart Goblin: you drew 1, rival went to 9000 LP.
- Lightning Storm destroyed Lode. The Fallen & The Virtuous destroyed Blue-Eyes White Dragon, sending The Dragon that Devours the Dogma from the Extra Deck as its cost.
- Engage! searched Raye, then drew 1 (3+ Spells in the GY).
- You Normal Summoned Raye, which let Roze Special Summon itself from the hand. The rival passed on both.
- Battle Phase:
  - Raye and Roze attacked directly for 1500 each: 9000 to 6000.
  - Raye's Quick Effect tributed itself and Summoned Kagari to the EMZ. Kagari's trigger added Engage! back to the hand.
  - Kagari (1800 with 3 Spells in the GY) attacked directly: 6000 to 4200.
- Main Phase 2:
  - You Link Summoned S:P Little Knight from Roze and Kagari. Its trigger targeted Blue-Eyes White Dragon in the rival's GY, but the rival's Effect Veiler negated it.
  - Engage! again searched Raye and drew 1.
  - Lemnisgate! shuffled Kagari and Engage! back. With only 2 cards shuffled, nothing returned to the hand; the player had misremembered the card.
  - You Set The Fallen & The Virtuous and Widow Anchor.
- End Phase: the Dogma dragon's GY trigger added a third The Fallen & The Virtuous to the hand.

**Turn 3 (rival).**
- The rival drew a second Lordly Lode, activated it and searched Primite Drillbeam.
- You activated the Set The Fallen & The Virtuous on Lode, sending Ecclesia and the Dark Dragon as its cost.
  - The rival chained Drillbeam, revealing Ether Beryl as its cost. Drillbeam negated and banished The Fallen & The Virtuous, and Lode survived.
- Lode's second effect revived Blue-Eyes White Dragon from the GY in Defense Position.
- The rival Normal Summoned Ether Beryl and activated its Normal Summon trigger.
  - You chained Widow Anchor, which negated Ether Beryl and took control of it until the End Phase.
- The rival passed through the Battle Phase and Main Phase 2. In the End Phase, Ether Beryl returned to the rival.

**Turn 4 (you).**
- You drew Roze.
- Ecclesia's GY effect targeted the Dogma dragon and Lode, to shuffle both and itself into the Deck. You chained The Fallen & The Virtuous' second effect, which revived Raye.
- Roze Special Summoned itself from the hand. Lemnisgate!'s GY effect (cost: banish itself) Link Summoned Azalea from Little Knight and Raye.
- Azalea's trigger targeted Blue-Eyes White Dragon. The rival's second Effect Veiler negated it.
- Raigeki destroyed Blue-Eyes White Dragon and Ether Beryl.
- You Normal Summoned the second Raye.
- Azalea, Roze and Raye each attacked directly for 1500: 4200 to 2700 to 1200 to 0.

## Disputes

None were raised.

The players raised these rules questions in their reports instead. The referee checked each against the card records in the repo. None was an engine error:

- **Lordly Lode's lock, then Ether Beryl activated (you, turn 3).**
  - The log line reads "the opponent cannot activate cards or effects, until the end of turn 3".
  - The printed text is narrower: "also you cannot activate the effects of Special Summoned monsters on the field this turn" (cid 20534, record `lock` in `src/cards/primite-lordly-lode.ts`).
  - The engine applies that narrow lock. Ether Beryl was Normal Summoned, so its trigger was legal.
  - The fault is the display wording (finding 1 below).
- **Drillbeam's cost, with Ether Beryl still in the hand (rival, turn 3).** Drillbeam's cost is to reveal 1 "Primite" card or Normal Monster, not to discard one (record in `src/cards/primite-drillbeam.ts`). The revealed Ether Beryl stays in the hand, and the opponent's view shows it as known. Correct.
- **Fuwalos logged as "discarded" (you, turn 1).** The printed cost is "discard this card" (record in `src/cards/mulcharmy.ts`). Correct.
- **Lemnisgate! returned nothing to the hand (you, turn 2).** The return is "for every 3 shuffled cards", and only 2 were shuffled (record in `src/cards/sky-striker-special-maneuver-lemnisgate.ts`). Correct.
- **Lemnisgate!'s GY Link Summon took the materials without asking (you, turn 4).**
  - At resolution, the only face-up monsters were Little Knight (Link-2) and Raye. Azalea needs "2 LIGHT and/or DARK monsters".
  - The engine does not let a single Link-2 count as "2 monsters" (test `link-material-rating` in `test/rules/summon-procedures.test.ts`: "Alone it is not '2+ monsters'"). So Little Knight (counted as 1) plus Raye was the only legal set, and it was taken at once.
  - That reading matches common play: same-name "reincarnation" Link Summons need their own card text to use 1 monster. The referee read no Konami page for it this time.
- **TY-PHON's Xyz Summon offered with one Level 8 (rival, turn 3).** This is TY-PHON's alternative procedure: 1 monster with the highest ATK, open during the turn after the opponent Special Summoned 2+ monsters from the Extra Deck (Kagari and Little Knight on turn 2). Legal. The move label just does not say it is the alternative procedure.
- **Blue-Eyes revived in Defense Position with no choice (rival).** Lode says "in Defense Position". Correct.

## YGOProJudge chats

None. No rule question stayed unclear after the card records, so no question was sent and no verdict is owed.

## Engine issues

None. There were no illegal outcomes, no unexplained errors and no replay failures.

Points checked and found correct:
- Kagari's ATK, 1800 with 3 Spells after Engage! left the GY.
- The negations by Effect Veiler (until end of turn) and Drillbeam, including Drillbeam's negation of the chained Quick-Play's effect. That last reading is backed by YGOProJudge only, as already noted in the card file.
- Widow Anchor's control change and its End Phase return.
- Ecclesia's three-card shuffle.
- Azalea, while negated, stayed on the field.
- All battle damage: 1500, 1500, 1800, then 3 × 1500.

## Display and usability findings (from the players' reports)

1. **Lordly Lode's lock is worded too broadly.** The "lasting effect begins" log line says "cannot activate cards or effects", but the lock covers only the effects of Special Summoned monsters. Both players were misled: the rival believed it could activate nothing for the rest of the turn, and you suspected an illegal activation.
2. **The chain target arrow reads like a destination.**
   - Kagari's chain line `-> opponent graveyard 5` (its target, Engage! in the GY) was read by the rival as Kagari going to the Graveyard. The rival therefore passed instead of answering with Effect Veiler or Ghost Ogre.
   - A target in the GY shows only `you graveyard 1`, without naming the card.
3. **Costs do not say what they do.** The cost shows as `~ card` and "pays with card" without saying whether the card is revealed, discarded or sent. The rival thought Drillbeam discarded Ether Beryl and reported it as a discrepancy.
4. **"You can" options look like card picks.** Engage!'s draw and Widow Anchor's take-control are offered as `choose <card>` with `pass`, and nothing says what the choice means.
5. **Move details miss conditions and Summon kinds.**
   - Lemnisgate! effect 1 lists `return-to-hand` although the return is conditional on 3 shuffled cards.
   - Effect 2 shows only `special-summon`, not that it is a Link Summon or which materials it will use. The player said a clearer detail would have changed the play.
   - TY-PHON's alternative Xyz is not labelled as such.
6. **Zone prompts do not name the card or the reason.** For example, "zone 0 (a Main Monster Zone or a Spell & Trap Zone)" appeared for Ether Beryl's control return and for Widow Anchor's take-control. The prompt "(position: attack or defense)" has no separate move; `--position` works.
7. **Log order.**
   - The turn's normal draw is printed under the previous turn's last End Phase line. Both players misread it, as a Fuwalos End Phase draw and as a missing turn-2 Draw Phase line.
   - Lines from a resolving effect that asks a question (Widow Anchor's negation, Lode's lock) print before the "chain link N resolves" line and before the automatic passes. The record confirms the passes came first.
8. **The Chain section was printed twice.** In `show --text` on turn 3, with Drillbeam chained to The Fallen & The Virtuous, the board printed the `Chain (last link last):` header twice and chain link 1 twice.
9. **Some results have no cause or outcome line.**
   - Lode's return to the Deck from Ecclesia names no cause.
   - A negated chain link resolves with no "nothing happens" line.
   - The move list never says why a card is not offered.
10. **The Mulcharmy draw shows only as "you draw X"** (with "the opponent draws 1 card" on the other seat), not as Fuwalos' effect.
11. **Phase passes cost relays.** Each phase step cost one relay per player.

Fixed since duel 001 by the new board details:
- Duel 001 #3: Link monsters now show `LINK-2 ... attack 1600` with no DEF.
- Duel 001 #4: Summons are now named in the log, with source and zone.
- Duel 001 #6: Automatic passes are now folded into `pass (no legal response) xN`.
- Duel 001 #11: The final LP line is now complete.
- Duel 001 #12: `move` now prints a compact result.
- Duel 001 #5, in part: Negations now show as "lasting effect begins" lines and on the board (`{effects negated (effect-veiler) ...}`), but there are still no battle damage lines.
- Duel 001 #1, in part: Move details now give the effect number, what it does, the targets and the cost. Findings 3 to 5 above remain.

Still open from duel 001: #2 (zone prompts), #8 (automatic materials, by design when only one set is legal) and #10 (relays spent on passes).

## Process

- Relays: the referee spawned each player once and sent 44 relay messages (SendMessage), well under the 150 cap.
- Mid-duel, after the turn-4 Main Phase 1 relay, the coordinator reported a tool defect: dispute claims were visible to both seats.
  - The referee told both players to word any dispute claim without naming cards in their own hand, Deck or face-down cards.
  - No dispute was raised before or after that.
- Isolation:
  - No player received the other player's report, hand or private information.
  - No player reported knowing the other seat's hidden cards. Every hidden card the players named was their own, or had been revealed on the board (Ether Beryl, revealed for Drillbeam).
  - The referee relayed only "your priority" lines and the dispute-wording rule.
- No source or test file was edited, no commit was made, and nothing was published.
