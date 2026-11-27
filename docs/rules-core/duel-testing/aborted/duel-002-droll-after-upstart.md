# Duel 002 (rerun): stopped on an engine defect, turn 9

Date: 2026-11-26. This is the rerun of duel 002; the first attempt was stopped by an earlier engine defect, since fixed. **This run is
also stopped unfinished**: the referee found an engine defect on turn 8 (Droll & Lock Bird not offered after Upstart Goblin's draw).
The record is kept as is. Whether it counts toward the 20 is the owner's decision.

## Setup

- Command (from `packages/rules`): `node scripts/agent-play.cjs new ../../docs/rules-core/duel-testing/duel-002.json --you 745443 --rival 746021 --seed 5 --first rival`
- Private record: `duel-002.json` (players never read it).
- `you`: Sky Striker 745443, Sonnet, medium effort, one fresh agent continued with SendMessage.
- `rival`: Blue-Eyes 746021, Sonnet, medium effort, a different fresh agent continued with SendMessage. Blue-Eyes went first.
- Each player received only its own list (from `src/deck-manifests.ts`, Main + Extra, no Side), the CLI commands and the isolation rules.
  Players never messaged each other; every report came back to the referee only.

Lists as manifests:

- **Sky Striker 745443**, Main 40: 3 Ash Blossom & Joyous Spring, 2 Lightning Storm, 3 Mulcharmy Fuwalos, 3 Mulcharmy Purulia,
  1 Mystical Space Typhoon, 2 Pot of Sloth, 3 Radiant Typhoon Vision, 3 Raigeki, 3 Sky Striker Ace - Raye, 2 Sky Striker Ace - Roze,
  1 Sky Striker Mecha - Shark Cannon, 1 Sky Striker Mecha - Widow Anchor, 2 Sky Striker Mobilize - Engage!, 3 Sky Striker Mobilize - Linkage!,
  2 Sky Striker Special Maneuver - Lemnisgate!, 3 The Fallen & The Virtuous, 3 Upstart Goblin.
  Extra 15: 1 Ecclesia and the Dark Dragon, 1 Prototype Sky Striker Ace - Amatsu, 1 S:P Little Knight, 1 Sky Striker Ace - Azalea,
  2 Sky Striker Ace - Hayate, 3 Sky Striker Ace - Kagari, 1 Sky Striker Ace - Shizuku, 1 Sky Striker Ace - Zeke, 3 Sky Striker Ace = Zero,
  1 The Dragon that Devours the Dogma.
- **Blue-Eyes 746021**, Main 43: 3 Ash Blossom & Joyous Spring, 1 Bingo Machine, Go!!!, 2 Blue-Eyes White Dragon,
  1 Blue-Eyes White Dragon, the White Phantom Beast, 1 Bystial Magnamhut, 3 Deep-Eyes White Dragon, the Blue Abyss, 3 Dominus Purge,
  1 Droll & Lock Bird, 3 Effect Veiler, 3 Ghost Ogre & Snow Rabbit, 3 Infinite Impermanence, 3 Maiden of White,
  1 Majesty of the White Dragons, 1 Mausoleum of White, 1 Pot of Prosperity, 1 Primite Dragon Ether Beryl, 1 Primite Drillbeam,
  3 Primite Lordly Lode, 1 Roar of the Blue-Eyed Dragons, 3 Sage with Eyes of Blue, 1 True Light, 3 Wishes for Eyes of Blue.
  Extra 15: 1 Ancient Fairy Life Dragon, 2 Blue-Eyes Spirit Dragon, 1 Blue-Eyes Tyrant Dragon, 1 Blue-Eyes Ultimate Spirit Dragon,
  1 Crimson Dragon, 2 Hieratic Seal of the Heavenly Spheres, 1 Lightstorm Dragon, 1 Neo Blue-Eyes Ultimate Dragon, 1 Psychic End Punisher,
  2 Spirit with Eyes of Blue, 1 Stardust Sifr Divine Dragon, 1 Super Starslayer TY-PHON - Sky Crisis.

## Result

**Unfinished**: stopped by the referee on an engine defect (below). State at the stop: turn 9, Draw Phase, rival (Blue-Eyes) to act,
210 logged moves, no winner. LP: Sky Striker 1500, Blue-Eyes 8500. Sky Striker had one face-down Ash Blossom and an empty hand;
Blue-Eyes had two Blue-Eyes White Dragon, Maiden of White, True Light and Mausoleum of White, so a Blue-Eyes win on turn 9 was likely
but not played.

## Turn-by-turn summary

1. **Blue-Eyes**: Wishes for Eyes of Blue (cost Primite Drillbeam) added Sage with Eyes of Blue and Majesty of the White Dragons.
   Sky Striker discarded Mulcharmy Purulia in response windows, twice (the second is the one "other Mulcharmy" the text allows); the Normal
   Summon of Sage from the hand drew Sky Striker 1 card. Blue-Eyes set Majesty and Dominus Purge; Sage added Maiden of White;
   Spirit with Eyes of Blue (Link, Sage) added Mausoleum of White; Maiden placed True Light; True Light set Roar of the Blue-Eyed
   Dragons, which Blue-Eyes activated the same turn (a Normal Spell) for Blue-Eyes White Dragon from the Deck in Defense Position.
2. **Sky Striker**: Raigeki; Blue-Eyes chained Majesty (to destroy Raigeki); Sky Striker chained The Fallen & The Virtuous (sent
   Ecclesia) to destroy Majesty. Majesty still resolved and destroyed Raigeki, and Raigeki still resolved and destroyed both Blue-Eyes
   monsters (a destroyed Normal Spell/Trap still resolves). True Light revived Blue-Eyes White Dragon and Maiden of White revived; a
   second Raigeki cleared them. Pot of Sloth was negated and destroyed by Dominus Purge (a draw counts as an add from the Deck).
3. **Blue-Eyes**: True Light revived Blue-Eyes White Dragon, Maiden revived, Sage added Maiden, Synchro Summon of Blue-Eyes Spirit
   Dragon (Maiden + BEWD), direct attack: Sky Striker 8000 to 5500.
4. **Sky Striker**: set Lemnisgate, Linkage! sent it and Special Summoned Hayate; Blue-Eyes answered with Spirit Dragon's Tribute
   effect for Blue-Eyes Ultimate Spirit Dragon (Defense Position). Lemnisgate's banish effect Link Summoned Kagari (Hayate); Effect Veiler
   negated Kagari; Kagari became Shizuku. Shizuku (-500 to Blue-Eyes monsters) destroyed Sage by battle: Blue-Eyes 8000 to 6500. In
   the End Phase Spirit Dragon's delayed effect destroyed Ultimate Spirit Dragon, which revived Blue-Eyes White Dragon; Maiden revived.
   Sky Striker declined Shizuku's End Phase effect twice.
5. **Blue-Eyes**: Bingo Machine, Go!!! (the random pick gave Blue-Eyes White Dragon); BEWD destroyed Shizuku: Sky Striker 5500 to 4500.
6. **Sky Striker**: drew and set Mystical Space Typhoon, nothing else.
7. **Blue-Eyes**: Tribute Summon of Blue-Eyes White Dragon (two Tributes: Maiden and BEWD; the player had expected one), additional
   Normal Summon of Maiden via Mausoleum, direct attack: Sky Striker 4500 to 1500. Main Phase 2: Spirit with Eyes of Blue (Maiden),
   Tributed for BEWD from the GY; Maiden revived; Wishes set and destroyed by Sky Striker's Mystical Space Typhoon.
8. **Sky Striker**: Upstart Goblin twice (Blue-Eyes 6500 to 8500), drew Ash Blossom, set it face-down in Defense Position, ended the
   turn. **Engine defect here** (below): Blue-Eyes held Droll & Lock Bird and was never offered it after Upstart Goblin's draw.
9. Stopped at the Draw Phase.

## Disputes

None raised by either player (`disputes` is empty; no ruling recorded).

## YGOProJudge chats

None. The defect below is settled by Konami's card text and notes and the engine's own Droll test; no question was sent.

## Engine issues

### Droll & Lock Bird is not offered after a draw followed by "then" in the same resolution (Upstart Goblin)

Turn 8, Main Phase 1. Sky Striker resolved Upstart Goblin ("Draw 1 card, then your opponent gains 1000 LP"). Blue-Eyes held
Droll & Lock Bird in hand. Droll: "If a card(s) is added from the Main Deck to your opponent's hand, except during the Draw Phase (Quick
Effect)" (Konami cid 9279), and Konami's Japanese notes (record `notes`): if the opponent added the card during a chain's resolution,
Droll can be activated after that chain. The engine already treats a draw as an add from the Deck (Dominus Purge and the Droll lock cite
Konami Q&A fid 21685). After the chain, Blue-Eyes's only legal move was pass (auto-passed, "no legal response"), so Sky Striker went on
to the second Upstart Goblin and drew Ash Blossom. With Droll used, the second Upstart Goblin could not have been activated.

Cause (diagnosed, not fixed): `src/cards/upstart-goblin.ts` calls `breakEffect` between the draw and the LP gain. `breakEffect`
(`src/events.ts`) empties `live` and `lingering`, so the draw's `added-to-hand` event is gone before `resolveChain` (`src/chain.ts`, the
`carried` loop) copies `result.live` into `Duel.lingering`. Droll's `lingers` check then finds nothing. The same loss would hit any
effect that adds a card from the Deck and then does something after "then", when a `lingers` effect should answer after the chain.

Minimal reproduction (referee scratch probe, no repo file changed): replay the first 203 entries of `duel-002.json`, then apply entry 203
(`activate upstart-goblin`) with every window shown and pass step by step. After the chain resolves, `live` holds `lp-gained, moved`,
`lingering` is empty, and the rival's legal actions are `pass` only. With the same prefix and an Upstart operation without the
`breakEffect`, `live` holds `added-to-hand:deck` after the chain, `lingering` has 1 event, and the rival is offered
`activate` Droll & Lock Bird. A regression test in the style of `test/cards/droll-lock-bird.test.ts` ("can be activated after the whole
chain when the card was added in the middle of it") with Upstart Goblin as the card that adds would pin it.

The duel was stopped here, as the brief requires. The record was not changed.

## Display and usability findings (from the players' reports)

- `choose` prompts do not say what the choice is for (Wishes, Sage, Bingo Machine's three picks, Majesty's show and destroy, Spirit
  Dragon's pick), and list one entry per copy, so names repeat.
- `place N` does not say whether the zone is a Main Monster Zone, an Extra Monster Zone or a Spell & Trap Zone.
- A Tribute Summon asks only for a zone: it does not say it is a Tribute Summon, how many Tributes it needs, or which were taken (taken
  automatically when only one set is possible). The opponent's log shows no Tribute either.
- Lingering effects are invisible: nothing showed that Mulcharmy Purulia's effect was active, and its draws did not appear as a log line.
- The log does not show what resolved: the opponent's chain steps, Linkage's sent card, Link materials, a delayed effect's destruction
  appear only as board changes. Both players were repeatedly unsure how a card got to the GY.
- A chain link is shown at the card's current place ("graveyard 15") once its cost moved it, which read as a GY effect (Spirit with Eyes
  of Blue Tributed for its own effect).
- A mandatory "apply ..." move (Spirit Dragon's End Phase destruction) did not say what it does; the missing pass was the only clue.
- Linkage! is listed only once its player controls another card to send (correct, but it surprised the player).
- `move` prints a large JSON dump before the text; the moves list is empty when the seat is not acting.
- Several player misreadings of their own cards (Purulia's condition, Majesty as a Counter Trap, The Fallen & The Virtuous as a negation,
  BEWD needing one Tribute) were the players' and never caused a wrong engine result.

## Process notes

- The rival once reported that its "command loop" sent three extra `move 0` calls after control had left it; the engine refused each
  ("does not hold the decision"), so the state did not change. The referee reminded it to send one move per command after a fresh
  `show`, and it complied from then on. No other scripted play was seen.
- One rival report was stale (it listed its own Wishes as still set after Mystical Space Typhoon had destroyed it); the record and the
  board were checked and were consistent.
- Neither player reported seeing hidden information of the other seat. No isolation problem.
- Relays: 102 (two spawns and 100 SendMessage resumes). The 14-turn and 150-relay caps were not reached.
- Replay: `node scripts/agent-play.cjs replay ../../docs/rules-core/duel-testing/duel-002.json` replays cleanly:
  `{"moves":210,"disputes":0,"turn":9,"phase":"draw","toAct":"rival","winner":null}`.
