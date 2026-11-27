# Pilot 001 — stopped after information-isolation breach

Date: 2026-11-26. This is a development pilot for player-view usability and the local driver. It does **not** count toward the required 20 completed duels.

## Setup and information boundaries

- Seed 1; first seat `you`.
- `you`: Sonnet, medium effort, exact Sky Striker 745443.
- `rival`: Opus, medium effort, exact Blue-Eyes 746021.
- Private referee record: `pilot-001.json`. Players must not read it.
- Players receive only their own CLI seat output and select moves themselves. They may not read source, tests, Deck order, the other seat or the other player's report. No random/bot move policy substitutes for agent judgment.
- The parent relays priority between persistent player agents. No API-based orchestration was built.

## Observed play

1. Sonnet activated Radiant Typhoon Vision, drew two and discarded Widow Anchor.
2. In Main Phase 1, Sonnet Normal Summoned Raye, then used Raye's effect to Special Summon Kagari to Extra Monster Zone slot 5.
3. Kagari targeted Widow Anchor in the GY. Opus chained Infinite Impermanence from the hand, controlling no cards.
4. Sonnet chained Linkage and chose Shizuku. The pilot paused on dispute 0 (below), which was settled without a state correction.
5. Sonnet placed Shizuku in slot 5. Linkage sent Kagari by its effect; Impermanence lost its valid target, and Kagari recovered Widow Anchor. Sonnet verified this resolution from their seat.
6. Sonnet mistakenly activated Widow Anchor on their own Shizuku. This was legal and stands; no undo. Dispute 1 was withdrawn (below).
7. Sonnet kept Shizuku and ended turn 1. They activated Shizuku's End Phase effect while it was negated by Widow Anchor; it added nothing. **Disputed, see dispute 2:** the parent first said effect negation does not generally prohibit activation, then retracted that as unverified. Neither claim is established; a diagnosis against primary sources is running.
8. Turn 2 (Opus): passed Draw and Standby; Maiden of White placed True Light from the hand; True Light set Wishes for Eyes of Blue; Bingo Machine added White Phantom Beast, which Opus Special Summoned (2700/2200 under Shizuku's Spell-count reduction, then 3000/2500 when its trigger destroyed Shizuku). Opus has not yet used a Normal Summon. Sonnet holds priority. No winner or completed duel is recorded.

## Disputes

### 0 — Linkage send timing: settled, no error

Raised by Sonnet at log count 12: Linkage appeared to send Kagari on activation before an opponent response. Referee reconstruction with explicit windows showed that Kagari remained on the field at activation. The rival had exactly one legal action, pass, so `act` passed for them automatically and began resolution. That automatic pass was absent from the submitted-move log. Kagari was the only legal send choice leaving room for an Ace, so that choice was also automatic.

A regression test covers both a meaningful Effect Veiler response (the opponent retains priority and the monster stays on the field) and a no-response hand (automatic pass, then send at resolution). Linkage's text/notes cid 17034 and Impermanence's text cid 13631 support the resolution. No judge call was necessary. The ruling is recorded in the private record; the game was not undone.

### 1 — Widow Anchor own-monster target: settled, withdrawn

Sonnet initially questioned targeting their own Shizuku, then corrected their recollection. Widow Anchor says “Target 1 face-up Effect Monster on the field”, without an opponent-control requirement (Konami cid 13675; source records `condition` and `notes-targets`). The activation is legal and remains played.

### 2 — Negated Shizuku activated its End Phase effect: settled, no error

Raised by Opus (rival) from what their seat shows: Sonnet's Shizuku was negated by their own Widow Anchor, yet its End Phase effect was offered and activated. Opus held that a negated monster cannot activate its effects.

Ruling: no error. Konami Q&A fid 8398 describes a monster under Widow Anchor's (and Effect Veiler's, Impermanence's) negation activating its effect in the Monster Zone, with the effect negated; the Skill Drain notes (cid 5740) check negation at resolution, not at activation; Widow Anchor's notes say it negates the monster's effects until the end of the turn; Shizuku's notes say its End Phase effect is a Trigger Effect activated in the Monster Zone. The engine offered it and resolved it negated (no Spell added, hand stayed at 3). One point is the engine's reading only: Shizuku's once per turn is used even though the effect was negated (no Konami page found). A regression test was added; no engine change was needed and the pilot record replays unchanged (35 moves).

Process note: the parent first stated the correct rule, then retracted it without a source, then said it was unsure. Only the primary-source check settled it, and the rival player's dispute was reasonable and worth raising.

## Isolation breach (parent's protocol error), turn 2 Main Phase 1

To save relays the parent told the two player agents to message each other directly. A message to a finished agent resumes it and returns its final report to the sender, so Sonnet's report, which stated its hand (Pot of Sloth, two Raigeki), reached Opus. Opus did not seek it and made no decision after reading it, but the pilot is no longer a clean information-hidden game. Hidden-information isolation depends on one rule: **players never message each other, and a player's report goes only to the parent or a referee**. The pilot does not count toward the 20. It can be finished only as a usability exercise, or ended here.

Opus also questioned repeated passes on an empty chain in Main Phase 1 without advancing the phase. A referee reconstruction (replaying each log prefix with every window shown) found **no engine bug**: log #40 was Sonnet's response to Sage's chain link, #41 Opus passed so the chain resolved, #42 Opus's search choice resolved with an automatic pass for Opus, #43 was Sonnet's pass in the response window after the chain (game state opens again), and #44 was Opus's pass in the open state, which asks to end the phase and gives Sonnet a last Fast Effect Timing chance. Two Sonnet passes never came back to back in an open state. Sources: the Konami fast-effect-timing records `next-phase`, `open-again` and `after-action-or-chain` (`src/rule-sources.ts`, tests in `test/rules/act.test.ts`). The real problem is display: the board says neither whether the game state is open nor what a pass does. Header text for that is being added; move labels stay unchanged so records replay.

## Driver findings

- "Chain (last link last):" is followed by log lines when the chain is empty, which reads as if they were chain links. Normal Summon places the monster without a zone choice while effect Summons ask for one. Move labels `#1`/`#2` do not say what the effect does.

- Opus found the move labels do not say what an effect does or which prompt a choice answers (Bingo's three picks, Maiden's hand-or-deck source), that Normal Summon moves vanish while a window is open with no indication of the open window, that identical Wishes copies are indistinguishable in choose lists, and that `move` prints the whole state every time.

- Two early Sonnet commands were rejected by `--expect` (a stale choice and a shortened label). Neither changed game state.
- Absolute engine-side labels confused the rival player. Fixed: board turn, chain refs, logs, disputes and winner are now viewer-relative. Some exact move labels still use absolute sides; selection semantics are unchanged.
- `--text` originally printed JSON plus moves. Fixed: readable sections for header, players, chain, log tail, disputes and numbered moves.
- Automatic passes were absent from the submitted-move log, causing dispute 0. Fixed: logs now show `pass (no legal response)` per seat. Older records remain replayable; parent verified the pilot replay after this change (22 moves, turn 2 Main Phase 1).
- A chain-target arrow followed departed Kagari into the GY, although target validation correctly rejected it. Fixed: invalidated targets now display `gone`.
- Sonnet noted that the board does not explicitly flag Shizuku's effect negation. Resolution was correct; this remains a display usability finding.

## Engine/source follow-up outside the pilot

Mandatory End Phase delayed processes created by a hand-adjustment trigger chain were silently dropped. A test-first fix now applies mandatory processes before the turn passes. Optional delayed processes are not offered while closing; that policy and the blanket closing restriction remain the core's reading, not a general rule established by Konami Q&A 17233.

The official fid 17233 answer was read directly and the source quote corrected to its Scarm-specific hand-adjustment sentence. It does not prohibit every phase effect of every card arriving earlier in the End Phase.

Parent validation before the latest Linkage regression test: `tsc --noEmit` clean; 149 files, 1616 passed, 1 todo. The Linkage regression test subsequently passed in the diagnosing agent's focused run.

This pilot is not frozen-version tournament validation. Relevant changes require replay; an illegal move or changed logged name must stop the run, not silently rewrite history. No commits or external publication were made.
