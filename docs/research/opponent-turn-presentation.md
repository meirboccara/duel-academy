# The rival's hand and the rival's turn: how Master Duel, YGO Omega and EDOPro show them, and what Junior should do

> **Date of observation:** 2026-11-23. Every web page, image and source file cited below was fetched for this note.
> This repository was read on `main` at HEAD `3e76335`, with uncommitted edits in `junior-play.tsx` (+ test),
> `island-world.tsx`, `world-scene.tsx`, `masters.ts` (+ test), `map-places.ts` (+ test) and one untracked test
> (`island-world.test.tsx`); none of the files read for this note (`level-player.tsx`, `mini-board.tsx`,
> `board-3d-stage.tsx`, `board-scene.tsx`, `board3d-layout.ts`, `session.ts`, `copy*.ts`, `packages/engine/src/engine.ts`)
> is among them. Line numbers are from the working tree.
> **Nature of this document:** a research note. No code was changed, nothing was installed, committed or published.
> Four reference images were downloaded to a temporary folder outside the repo (§6); they are not committed.
>
> **The request (owner, verbatim):** "2. We still don't see opponent card in hand. I mean how many card he has, so
> should card as every ygo games. check master duel screenshot. 3. Opp phases, how he play, should be really like
> master duel and omega and should search how to do so against trainers."
>
> **Sourcing rule used:** claims about this repo cite `file:line`. Claims about EDOPro cite its public client source
> (`github.com/edo9300/edopro`, branch `master`, `gframe/*.cpp`), which is the most precise primary source available:
> it gives exact frame counts. Claims about YGO Omega cite the developers' own pages (the official Omega wiki and the
> release notes posted by the Omega team on the Duelists Unite forum). Konami publishes **no manual or patch notes** for
> Master Duel's duel screen on its official site (checked: the site lists only six tutorial videos and news, §1.1), so
> Master Duel claims come from Konami's own store screenshots (Steam, published by Konami) and, where needed, from
> community guides, each marked as such. Recommendations for Junior are labelled **(ours)**. What could not be
> confirmed is in [§7](#7-unverified).

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | How does Junior show the rival's hand today? | Only as a line of text, "✋ Rival's hand: 3 cards", under the rival's Life Points: `Lantern` in the 2D board (`mini-board.tsx:193-228`, used at `:320` and `:461`) and `LifeChip` in the 3D board (`board-3d-stage.tsx:57-85`, used at `:193`). No card back is drawn. |
| 2 | How do the reference games show it? | As **face-down card backs** along the far edge of the table, centered, mirrored from the player's own hand. Master Duel: backs side by side touching, half cut by the top of the screen, **no number** (Konami screenshot, §6 image 1). Omega: backs spaced apart above the opponent's field, no number on the hand itself (Omega wiki screenshot, §6 image 4). EDOPro: backs spaced 0.8 units apart up to 6 cards, then squeezed into a fixed width so they overlap (`client_field.cpp`, §1.3). A revealed card turns face up in place and glows (EDOPro: 1.5 s). |
| 3 | How does Junior play the rival's turn today? | One engine move every **250 ms** (700 ms when animations are on, 2200 ms after the rival activates a card or changes ATK) (`level-player.tsx:215-222`), with a "Rival's turn: next" button to step faster (`:603-608`). The rival's turn, its phases and its draw are emitted by the engine (`engine.ts:284-288`) but **not shown**: the phase bar only marks the child's phases (`mini-board.tsx:544-548`) and phase explanations only count the child's (`copy.ts:194-198`). |
| 4 | How do the reference games present the opponent's turn? | A **turn announcement**, then a **phase announcement for every phase entered**, then each action with its own beat: activated card shown big, card highlighted on the field, chain links numbered, attack arrow. EDOPro's exact beats at 60 fps: new turn 40 frames (667 ms), each phase 40 frames (667 ms), activation 30 frames (500 ms), attack arrow 40 frames (667 ms), drawn card 5 frames (83 ms) each, revealed hand card 90 frames (1.5 s) (§2.3). Omega colours the phase popup by whose turn it is: red opponent, blue you (§2.2). |
| 5 | What can the player do during it? | Answer in **windows**. All three games have a three-way setting: never ask / ask when it matters (default) / ask at every chance. Master Duel: Off / **Auto** / On; Omega: No Chain / **Auto Chain** / Always Chain; EDOPro: Ignore / When available / Always (§3). Junior already behaves like "Auto": the engine opens a window only when the child can answer (`engine.ts:734`, `:1171`). |
| 6 | What should Junior do? **(ours)** | Draw the rival's hand as card backs on both boards, with the number on a small badge next to it; announce the rival's turn and each of its phases in a red banner; give every rival action a beat of 0.9–2.2 s; stop and wait (no timer) whenever the child can answer, with two big buttons. Details and timings in [§5](#5-proposal-for-junior-ours). |

---

## 1. The opponent's hand

### 1.1 Master Duel (Konami)

- **No official manual.** Konami's Master Duel site (`konami.com/yugioh/masterduel/us/en/`, fetched 2026-11-23) lists
  six tutorial videos (Monster and Spell basics, Trap basics, Synchro, Xyz, Pendulum, Link) and news; it has no manual,
  no duel-screen description and no patch notes.
- **Konami's own store screenshot** (Steam, app 1449850, image 1 in §6) shows the opponent's hand as **four card
  backs, side by side and touching, centered on the top edge of the screen and cut in half by it**. The opponent's Deck
  and Extra Deck sit in the top corners, its Life Points in a chip at the top right ("Duel King LP 7500"). **No number**
  is printed on or next to the hand; the count is read from the backs themselves.
- A community guide of the duel screen (gameplay.tips, 2022-01-16) labels "Opponent's Hand" as one numbered element
  of its annotated screenshot, and a "Field Status" button that opens duel information. Whether that panel prints the
  hand count is not stated (§7).

### 1.2 YGO Omega

- The **official Omega wiki** ("Beginner's Guide to YGO Omega: Your First Duel") has a full-screen screenshot of an
  automatic duel (image 4 in §6). The opponent's hand is **two card backs (with the player's sleeve art) floating above
  the far edge of the opponent's field, centered, spaced apart, not overlapping**. Every pile shows its count as a big
  number beside it (Deck 15, Extra 20, Graveyard 3, banished 10; the player's 30, 13, 8, 1). The hand itself has no
  number. The opponent's name and Life Points are in a chip at the top right, the player's at the bottom right.
- Omega release v1.4.205 (2022-04-22, Omega team) fixed "Level in hand would show opponent's cards if those cards were
  revealed previously": a revealed card is remembered as known, and must go back to a back once the reveal ends.
- The Omega guide (Duelists Unite forum, "YGO Omega Guide") only adds that Action Duel cards have their own back with
  an "A".

### 1.3 EDOPro (open source: exact behaviour)

From `gframe/client_field.cpp` (hand placement) and `gframe/duelclient.cpp` (messages):

- **Position.** The opponent's hand is a row mirrored from the player's: Y = −3.4 (far edge) against 4.0 for the
  player; X counted from the other side. Cards are face down (`handfacedown`) unless the card is public or the duel is
  a replay with hands shown.
- **Spacing.** Up to 6 cards (5 in the top-down view) are laid at a fixed 0.8-unit step, centered
  (`xoff1 = (5.5 − 0.8·count)/2 + sequence·0.8`); beyond that they are squeezed into a fixed width of 4.0 units, so
  they overlap (`xoff2 = sequence·4.0/(count−1)`).
- **Draw.** `MSG_DRAW`: each card leaves the Deck, every hand card slides to its new place (10-frame move) and the
  client waits **5 frames (83 ms) per card**. The log line says "Opponent drew N card(s)".
- **Reveal.** `MSG_CONFIRM_CARDS` for hand cards: the card turns face up in place and glows (`is_highlighting`), held
  **90 frames (1.5 s)**, then turns back. A single card revealed from the Deck (a search) slides out, flips, and is held
  **45 frames (750 ms)**.
- **Activating from the hand** puts the chain marker next to the hand (`GetChainDrawCoordinates`, hand case).

### 1.4 DuelingBook

Not researched in depth: DuelingBook is a manual simulator with no automatic phases and no published client source;
its layout could not be confirmed from a primary source (§7).

---

## 2. The opponent's turn

### 2.1 Master Duel

- Konami's store screenshots (§6 images 1-3) show the **phase button**: a round button at the center-right edge of the
  field reading the turn and phase ("Turn 6 / Battle", "Turn 2 / Main 1"). It is the same button for both players;
  only the turn player can press it.
- **Activations**: the activated card is shown **big in the middle of the screen**, tilted, with the chain links
  numbered in large digits (2, 3, 4) and chains drawn between the cards (image 2, "Called by the Grave" as chain link 4).
  The card text of the selected card is shown in a panel on the left.
- **Big Summons**: a full-screen cut-in with the monster's art, its name, Level stars and "ATK 2800 DEF 2500" (image 3,
  "El Shaddoll Construct").
- **Damage**: a large red number over the field ("1200", image 1).
- **Answering**: the "Activation Confirmation" setting (community guides: outof.games, 2022; gameplay.tips, 2022) has
  three states. **Off**: no prompt for most optional effects. **Auto** (default in a duel, per both guides): a window
  after a Summon, an attack declaration, a Spell/Trap activation, an effect activation, and before the opponent ends
  the turn. **On**: a window at nearly every moment (phase changes, every step of the Battle Phase, after each
  resolution, a Set, the draw). Input modes "Hold" (hold to force On or Off) and "Switch" (click cycles
  Auto → Off → On). The button is hidden when the setting is Auto. The same guide says Solo Mode's computer opponent
  decides instantly.
- Animations cannot be turned off or sped up in a live duel (players' requests on the Steam forum; §7).

### 2.2 YGO Omega

- **Phase popups** (release v1.4.205, Omega team): "The phase popups have been changed to indicate whose turn it is
  during that phase. That means red is for opponent and blue is for player." Same release: "The middle phase button
  can be used to popup another sub-navigation menu to change phase", and "Turn counters will be shown in the center of
  the screen when those counters get incremented."
- The wiki screenshot (image 4) shows the **phase disc in the center of the field** between the two sides: "MP1 /
  TURN 2", ringed in pink, with "RW" and "FF" buttons either side (replay controls in that screenshot).
- **Chain settings** (Omega guide): *No Chain* "The game will never ask you whether you want to chain or activate a
  card" (key S); *Always Chain* "will always ask you … at every available opportunity" (key A); *Auto Chain*, the
  default, asks "in MP1, BP, and MP2", usually not in the Draw, Standby or End Phase; *Hold Chain* makes the keys work
  only while held. In Always Chain, when nothing can be activated the game asks "No cards can be activated at this
  time. Check the field?" (so the opponent cannot tell a bluff). A large hand-shaped button sits at the right edge of
  the screen in the wiki screenshot (image 4); its function is not captioned (§7).
- Speed: players report a "Game Speed" slider was replaced in 2022 by "Replay Speed", which no longer slows phase
  changes and animations in a live duel (forum thread "Option to slow down the animations?", 2022-03-26 and
  2022-09-02; community posts, no staff reply).

### 2.3 EDOPro (exact timings)

`WaitFrameSignal(frames)` waits `frames · 1000/60` ms; with the "quick animation" option, any wait of 12 frames or
more is cut to 12 frames (200 ms) (`drawing.cpp:1178-1179`).

| Moment | What is shown | Wait |
| --- | --- | --- |
| New turn (`MSG_NEW_TURN`) | sound "next turn", turn banner image in the middle (`showcardcode = 10`), chain buttons appear | 40 frames, **667 ms** |
| Each phase entered (`MSG_NEW_PHASE`) | sound "phase", a phase banner image (Draw, Standby, Main 1, Battle, Main 2, End: codes 4-9), the phase button of that phase lit; log line | 40 frames, **667 ms** per phase |
| Draw (`MSG_DRAW`) | card slides from Deck to hand | 5 frames, **83 ms** per card |
| Activation (`MSG_CHAINING`) | sound or the card's voice line; the card art grows in the middle; the card on the field glows and nudges | 30 frames, **500 ms** |
| A further chain link (`MSG_CHAINED`, link ≥ 2) | chain marker added | 20 frames, **333 ms** |
| Resolving a link (`MSG_CHAIN_SOLVING`) | the link's marker blinks 5 times | 11 + 5·6 frames, **~680 ms** |
| Attack (`MSG_ATTACK`) | an arrow from attacker to target (or to the player); log "X attacks Y" | 40 frames, **667 ms** |
| Revealed hand card (`MSG_CONFIRM_CARDS`) | card face up in place, glowing | 90 frames, **1.5 s** |
| Searched card shown | slides out of the Deck, flips | 45 frames, **750 ms** |

Phases are announced one by one as the core enters them; a Battle Phase not entered is not announced (the core sends
no message for it; inference from the handler, which reacts only to `MSG_NEW_PHASE`). Chain buttons "Ignore",
"Always" and "When available" sit beside the field (`game.cpp:857-866`) and can be hidden in the settings
(`chkHideChainButtons`).

### 2.4 Summary of the common grammar

1. Turn change: one banner, about 0.7 s, coloured by player (Omega: red for the opponent).
2. Every phase entered: a short banner (0.7 s) and the phase marker moves; skipped phases are not announced.
3. Every action is a separate beat: the card is shown big (0.5 s in EDOPro; longer cut-ins in Master Duel for big
   Summons), then lands; chain links are numbered; an attack is an arrow.
4. A window opens only when the player can answer (default "Auto"); the game waits for the player, and the opponent
   waits too.
5. The opponent's hand is card backs mirrored across the table; its count is the number of backs.

---

## 3. What Junior does today (precisely)

- **The rival's hand.** `Lantern` (2D) prints `✋ {copy.handCount("rival", n)}` under the rival's Life Points
  (`mini-board.tsx:193-228`), e.g. "Rival's hand: 3 cards" (`copy-en.ts:287`). `LifeChip` (3D) prints the same line at
  10-12 px in the top-left chip (`board-3d-stage.tsx:57-85`, `:193`). No card back is drawn on either board. The 3D
  layout already knows the rival's hand is "a spot the mat does not show" and puts it at the rival's edge
  (`board3d-layout.ts:122-130`). The child's 3D hand uses `handSlots` (centered, step `min(card width + 0.12, room)`,
  `board3d-layout.ts:105-112`), and the scene has a card-back texture (`board-scene.tsx:108`, `:247`).
- **The rival's turn.** `session.status === "rival"` triggers a timer that applies one bot move with `next()`
  (`session.ts:216-218` → `botNext`, `:201-213`): **250 ms** per move, **700 ms** when animations are on, **2200 ms**
  after an event `activated`, `sprung` or `boosted` on the rival's side (`level-player.tsx:215-222`). Each phase change
  is one bot move, so the rival's Draw, Standby, Main, Battle and End pass in 250-700 ms each with nothing on screen
  but the moving cards. The prompt reads "Rival's turn. Tap Next to watch each step." (`copy-en.ts:348`) and a
  "Rival's turn: next" button applies the next move at once (`level-player.tsx:603-608`, `copy-en.ts:320`); the
  text says to tap while the timer plays anyway.
- **Engine events already available.** `turn`, `phase`, `drew` carry the side (`engine.ts:284-288`); `window` says who
  may answer (`:340`). The UI only uses the child's: `phasesStarted` filters `side === "you"` (`copy.ts:194-198`) and
  the `PhaseBar` marks the current phase only when `board.turn === "you"` (`mini-board.tsx:544-548`).
- **Answering.** When the bot's move opens a window the child can use, `settle` sets status `answer`
  (`session.ts:81`), the timer stops, the prompt says "Freeze! Tap your Set Trap, or a card whose effect you can use
  now, or let it happen." (`copy-en.ts:349`) and a "Let it happen" button passes (`level-player.tsx:644-648`,
  `copy-en.ts:321`). The engine opens a window only if the child can answer (`engine.ts:734`, `:1171`): this is
  Master Duel's "Auto" / Omega's "Auto Chain".

---

## 4. What suits children of 7-12 **(ours)**

- **Keep the number, add the backs.** Every game the children will meet later shows backs; a 7-year-old counts five
  backs faster than he reads "5 cards". But with 6+ backs overlapping (EDOPro's rule) counting gets hard, so keep a
  small numeric badge on the fan as well (Omega puts numbers on every pile; the same idea).
- **Slower than the reference games.** EDOPro's 500-667 ms beats are tuned for players who already know what
  happens. A child reading a banner needs about 1 s for two or three words; a card's name and what it does needs
  2 s or more (the existing 2200 ms after an activation is a good anchor). Total rival turn: aim for 6-12 s for a
  simple turn (a Summon and one attack), never more than ~25 s without a tap.
- **Announce, but do not lecture.** Banners should be two or three words ("Rival's turn", "Battle Phase"). Phases
  where nothing happens (Standby, Main 2 with no move) get a short banner only, or are folded (see §5.2).
- **Never a timer on the child.** Master Duel's timer is a ranked-play feature; children answer at their own pace.
  Keep "Auto" behaviour (ask only when an answer is possible) and no setting for Off/On in Junior; an "On"
  mode would flood children with useless prompts.
- **One thing moves at a time**, the same as Master Duel's chain display: the eye goes where the movement is.
- **Respect "Animations off".** The existing `moving` flag already turns animations off; banners then become a still
  line of text and beats fall back to the current 250 ms.

---

## 5. Proposal for Junior **(ours)**

### 5.1 The rival's hand

**3D board.** Draw the rival's hand as card backs (the existing back texture) beyond the rival's back row, mirrored
from the child's hand: same `handSlots` math with Z at the rival's edge (`layout.minZ − margin`) and cards rotated 180°.
Scale 0.6-0.7 of the child's hand cards so they read as "far away"; spacing = card width + 0.08 up to 6 cards, then
squeezed to a fixed width (EDOPro's rule). Keep the backs fully inside the frame on a phone (Master Duel cuts them
in half; children may not count half cards). A round badge with the number sits on the right end of the fan; the
"✋ … cards" line in `LifeChip` can then go.

**2D mini-board.** Above the rival's `Lantern`, a single row of small backs (about 20 × 28 px, overlapping by 40 %
once there are more than 5) with the same number badge, `role="img"` and `aria-label` "Rival's hand: 4 cards" (the
current copy). The row replaces the text line in `Lantern`.

**Motion.** Rival draws: one back flies from the rival's Deck into the fan, 450 ms per card. Rival adds a card from the
Deck or Graveyard (event `added`): the card flies **face up** to the middle, is held 1500 ms with its name ("Rival
added Sage with Eyes of Blue"), then flips and joins the fan (this is what the real rules show: a searched card is
revealed). Rival plays a card from hand: the back leaves the fan, flips in the air on its way to its zone (or to the
middle for a Spell). Discard (cost): back leaves the fan, flips, goes to the Graveyard, 600 ms. A card revealed by an
effect: it rises from the fan face up, glows, 1500 ms, goes back down face down.

### 5.2 The rival's turn: sequence and timings

All values with animations on; with them off every step is 250 ms and banners are a still line in the prompt.

| Step | Shown | Duration |
| --- | --- | --- |
| End of the child's turn | the child's End Phase banner (blue), then fades | 700 ms |
| Turn change | full-width **red** banner "Kaiba's turn" with the trainer's picture (already shown at `level-player.tsx:543`), turn number small | 1400 ms |
| Draw Phase | small red phase banner "Draw Phase" + the draw flight (§5.1); the phase bar shows the rival's phase marked in red (read-only) | 900 ms + 450 ms |
| Standby Phase | folded into the Draw banner unless something happens there ("Draw → Standby" ticks on the bar) | 0-400 ms |
| Main Phase 1 | banner "Main Phase" | 900 ms |
| each rival action | the card flies from the hand fan; Summons and Sets: 900 ms; an activation: the card shown big in the middle with its name and one line of what it does, the field card glowing, chain number if ≥ 2 | 900 ms (Summon/Set), **2200 ms** (activation, as today) |
| Battle Phase (only if entered) | banner "Battle Phase" | 900 ms |
| each attack | attacker lifts, a red arrow to its target or to the child's Life Points, "Blue-Eyes attacks!"; then the existing `ClashBanner` sum | 1000 ms arrow + existing clash beat |
| Main Phase 2 (only if the bot acts there) | banner "Main Phase 2" | 900 ms |
| End Phase | banner "End Phase" | 800 ms |
| Back to the child | blue banner "Your turn!"; the child's Draw Phase starts as today | 1200 ms |

Typical simple turn (draw, one Summon, one attack): 1.4 + 1.35 + 0.9 + 0.9 + 0.9 + 1.0 + clash + 0.8 + 1.2 ≈ 9-10 s.
The "Rival's turn: next" button stays and **skips to the end of the current beat** (not to the next engine move),
so impatient children can speed up but never miss a banner entirely. Its copy should drop "Tap Next to watch each
step" (the turn plays by itself) for "Kaiba is playing…".

Implementation note: the engine already emits `turn`, `phase` and `drew` with `side: "rival"` (`engine.ts:284-288`),
so the beats can be driven from `session.events` the same way `telling` is computed today
(`level-player.tsx:218-220`), choosing the delay from the event kinds of the last move instead of the three fixed
values.

### 5.3 The answer prompts

When the bot's move leaves a window the child can use (status `answer`):

1. Everything stops. The rival's action stays visible (the card shown big shrinks to a corner, the attack arrow stays).
2. A short sound and a yellow banner over the board: **"Your chance!"** (two words; Master Duel's equivalent is the
   chain prompt), with the reason in one line: "Blue-Eyes attacks your Kuriboh."
3. The cards that can answer glow (already done: `level-player.tsx:427-433`); every other card is dimmed.
4. Two big buttons, always the same place: **"Use a card"** (only highlights; tapping a glowing card works without it)
   and **"Let it happen"** (existing `pass`). No timer. After 8 s without a tap, a hint bubble points at the glowing
   card, never an automatic pass.
5. After the answer resolves, a 900 ms beat showing what the answer did, then the rival's turn resumes.

No Off / On chain setting in Junior: the engine's "only when you can answer" rule (`engine.ts:734`, `:1171`) is
Master Duel's Auto and Omega's Auto Chain, the default both games recommend.

---

## 6. Reference images (not committed)

Folder: `C:\Users\meyer\AppData\Local\Temp\claude\md-shots\`. The three Master Duel images are Konami's own
promotional screenshots on its Steam store page; the Omega image is from the Omega team's own wiki page. Kept for
reference only, not for use in the game.

| # | File | Source URL | Shows |
| --- | --- | --- | --- |
| 1 | `md-opponent-hand-phase-button.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1449850/ss_f4e2257edc1cb8093f1f0b40d7daf96211405f90.1920x1080.jpg (Steam app 1449850) | Master Duel: opponent's hand as 4 touching card backs at the top edge, phase button "Turn 6 / Battle" at center-right, opponent LP chip top right, damage "1200" in red |
| 2 | `md-chain-links.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1449850/ss_6501d1b0e2dc14a5e1031d5e02456d9b72912a0b.1920x1080.jpg | Master Duel: a chain of 4 links, the newest card ("Called by the Grave") shown big, links numbered, phase button "Turn 2 / Main 1" |
| 3 | `md-summon-cut-in.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1449850/ss_e568cc7bd1896039e2383f48488a262d873fbf20.1920x1080.jpg | Master Duel: full-screen Summon cut-in with name, Level stars, ATK/DEF |
| 4 | `omega-duel-layout.png` | https://omega-592647419856-sa-east-1-an.s3.sa-east-1.amazonaws.com/wiki_assets/9de443c9fb9dfa2d98b4464713b1df39 (on https://omega.duelistsunite.org/wiki/beginner-s-guide-to-ygo-omega) | YGO Omega: opponent's hand as 2 spaced backs above its field, phase disc "MP1 / TURN 2" in the center, pile counts as numbers, LP chips at the right |

---

## 7. Unverified

- **Master Duel's opponent hand count** as a number: not shown in Konami's screenshots; whether the "Field Status"
  panel lists it could not be confirmed from any primary source.
- **Master Duel's turn-change banner** ("Your Turn" / "Opponent's Turn") and **phase banners**: their wording,
  colour and duration could not be confirmed from a primary source (no manual; no store screenshot shows one). The
  official tutorial video "Guide 2: Trap Card Basics" on Konami's site (YouTube id `JBovNyqXU_Y`) shows an opponent's
  turn and a chain prompt and is the place to check; it was not transcribed for this note.
- **Master Duel's default activation setting**: the two community guides say Auto during a duel; one Q&A says Off on
  first install. Not confirmed by Konami.
- **Master Duel draw/reveal animations** for the opponent: not documented by Konami.
- **Omega's right-edge hand button** (image 4): most likely the chain-mode toggle, not captioned.
- **Omega timings**: the client is not open source; no durations available. EDOPro's (open source, same YGOPro
  lineage) are used as the reference numbers instead.
- **DuelingBook**: layout not confirmed from a primary source.
- **The child timings in §4-§5** are proposals, not measured; they should be checked by watching two or three
  children play a trainer duel.

### Sources

- Konami, Master Duel official site: https://www.konami.com/yugioh/masterduel/us/en/
- Steam store, Master Duel (screenshots via `store.steampowered.com/api/appdetails?appids=1449850`)
- YGO Omega wiki, "Beginner's Guide to YGO Omega: Your First Duel": https://omega.duelistsunite.org/wiki/beginner-s-guide-to-ygo-omega
- YGO Omega v1.4.205 release notes: https://forum.duelistsunite.org/t/ygo-omega-v1-4-205/12029
- YGO Omega Guide (chain modes): https://forum.duelistsunite.org/t/ygo-omega-guide/519
- "Option to slow down the animations?" (Omega forum): https://forum.duelistsunite.org/t/option-to-slow-down-the-animations/11665
- EDOPro client source: https://github.com/edo9300/edopro (`gframe/duelclient.cpp`, `client_field.cpp`, `drawing.cpp`, `game.cpp`)
- Community, Master Duel activation settings: https://outof.games/realms/yugioh/guides/225-activation-confirmation-toggle-function-how-to-make-the-most-of-master-duels-prompts/
- Community, Master Duel duel screen: https://gameplay.tips/guides/yu-gi-oh-master-duel-duel-screen-info-guide-duel-field-menu-and-icons.html
