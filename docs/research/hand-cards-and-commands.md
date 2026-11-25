# Hand cards, card details and commands: how Master Duel, Duel Links, YGO Omega and EDOPro lay them out, and what Junior should do

> **Date of observation:** 2026-11-23. Every web page, image and source file cited below was fetched for this note.
> This repository was read on `main` at HEAD `973e3ee`, with uncommitted edits in `junior-play.tsx` (+ test),
> `island-world.tsx`, `world-scene.tsx`, `masters.ts` (+ test), `map-places.ts` (+ test) and one untracked test
> (`island-world.test.tsx`). None of the files read for this note (`level-player.tsx`, `mini-board.tsx`,
> `board-stage.tsx`, `display-card.tsx`, `move-pad.tsx`, `board3d/board-scene.tsx`, `board3d/board-3d-stage.tsx`,
> `board3d/card-textures.ts`, `board3d-view.ts`, `board3d-layout.ts`, `copy.ts`, `copy-en.ts`, `globals.css`) is among
> them. Line numbers are from the working tree.
> **Nature of this document:** a research note. No code was changed, nothing was committed or published. The app was
> run locally (the dev server was already up on port 3220) and driven with a headless Chromium to take screenshots;
> they and the reference images are in a temporary folder outside the repo (§7) and are not committed.
>
> **The request (owner, verbatim):** "Design of card in hand are really not design well. I don't know if it's quick
> spell, continus spell or others. The details of the cards is also written in the left side and it's really
> complicated. Should spread better where command controls are also. Research others ygo and adapt"
>
> **Sourcing rule used:** claims about this repo cite `file:line` or a screenshot taken for this note. Claims about
> Master Duel and Duel Links come from **Konami's own Steam store screenshots** (apps 1449850 and 601510). Konami
> publishes no manual of either duel screen (see the previous note, `opponent-turn-presentation.md` §1.1). Claims
> about EDOPro cite its public client source (`github.com/edo9300/edopro`, `master`), which gives exact positions. Claims
> about YGO Omega cite the official Omega wiki. The six Spell/Trap icons come from the **Official Rulebook v10, p. 27**.
> Community sources are marked as such. Recommendations are labelled **(ours)**. What could not be confirmed is in
> [§8](#8-unverified).

---

## 0. Short answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | Can a child tell a Quick-Play from a Continuous Spell in the hand today? | **Barely.** No icon is drawn anywhere. All Spells share one green frame and all Traps one pink frame. The kind is a line of text: 11 px capitals in the 2D hand (`mini-board.tsx:167`), and a line painted into the 3D card texture (`card-textures.ts:155-161`, from `board3d-view.ts:74`). On a desktop the 3D line is about 12 px high. In Hebrew it reads "לחש משחק מהיר (Quick-Play Spell)" squeezed into the same box, so it is about 6 px and unreadable (screenshot `trainer-desktop-he-3d-picked.png`). On a phone on its side the hand cards are about 45 px wide (`trainer-phone-3d-picked.png`). |
| 2 | Where is the "left side" text? | The 3D board has a **side panel** (`level-player.tsx:826-828`): `flex-row` with the mat first, so it is on the **right in English and French and on the left in Hebrew** (RTL). It holds everything, top to bottom: level title, goal, narration, "On the card: …" with the full printed text (in English, even for Hebrew players, `:586-601`), the action buttons, phase bar, Hint/Undo/Show me, Back and the 3D/flat switch. The owner's "left side" is most likely this panel as seen in Hebrew (inference, §8). In 2D, every hand card also prints its whole effect text, so cards are 300–450 px tall (`level-player.tsx:744-753`, `mini-board.tsx:169-173`). |
| 3 | Where are the commands today? | In that same panel, far from the card: a wrap of up to ~12 conditional buttons (`level-player.tsx:603-728`), then the phase bar (`:730-740`), then the utility row (`:772-797`). On a phone on its side (844×390), the panel is 40 % of the width and the buttons are **below the fold**, so the child must scroll the panel (`trainer-phone-3d-picked.png`). In 2D the hand sits under the phase bar, about 2.5 screens below the board on a phone (`trainer-phone-2d-picked.png`). |
| 4 | How do the reference games show a card's kind in the hand? | They draw the **real printed card**: frame colour, plus the Spell/Trap icon next to "[SPELL CARD]". Master Duel's detail panel repeats it as **icon + words** ("⟳ Quick-Play Spell") beside the art, and shows Level ★, ATK ⚔ and DEF 🛡 as icon rows (Konami screenshots, §7 images 1-2). The Rulebook names six icons: Equip, Field, Quick-Play, Ritual, Continuous, Counter; a card with none is Normal (§1.1). |
| 5 | Where do they put the card detail? | On PC, all of them put it in a **column at the left edge**, separate from the commands: Master Duel (floating panel, top left, ~21 % of the width), Duel Links PC (full-height left column, with the duel log on the right), EDOPro (card image at (1,1) and info tabs below it, `game.cpp:306-309`, `:1426`). The detail shows only the card being pointed at. No other text shares that panel. |
| 6 | Where do they put the commands? | **Next to the card.** EDOPro opens a small menu of only the available commands (Activate, Normal Summon, Special Summon, Set, Change position, Attack…) **20 px above the click point** (`event_handler.cpp` `ShowMenu`, §3.1). Master Duel shows the phase as a round button on the field's centre line ("Turn 2 / Battle"), with only small round utility buttons in the corners (§7 images 1-2). The board keeps no permanent command bar. |
| 7 | What should Junior do? **(ours)** | (a) Hand cards with **no effect text**, a big **type badge** (official icon + the word in the child's language), Level stars and ATK/DEF with icons, and a clear "can play" edge. (b) A **card reader** that shows only the card being looked at: a side column on a wide screen, a sheet over the rival's half on a phone. (c) **Context buttons above the picked card** (icon + word, ≥ 56 px), a **phase disc** at the edge of the mat, and the utility buttons in a small toolbar. Details for 2D and 3D in [§6](#6-proposal-for-junior-ours). |

---

## 1. Telling card kinds apart at a glance

### 1.1 The official icons (Rulebook v10, p. 27)

> "There are 6 types of icons that represent special properties a Spell or Trap Card may have. Spell and Trap Cards
> without an icon are called Normal Spell Cards or Normal Trap Cards." (Equip · Field · Quick-Play · Ritual ·
> Continuous · Counter)

Each icon goes with one kind only: Quick-Play, Equip, Field and Ritual are Spells; Counter is a Trap; Continuous is
both. The engine already stores this as `icon` (`packages/engine/src/catalogue.ts:493-511`), and the words exist in
every language (`copy-en.ts:219-220`, "Quick-Play Spell" … "Counter Trap"; French in `copy-fr.ts:224`). The usual
glyphs are a lightning-like bolt (Quick-Play), ∞ (Continuous), ✚ (Equip), a four-pointed compass star (Field), a flame
(Ritual) and a curved arrow (Counter) (shapes as printed on cards; see §8 for exact drawings).

### 1.2 Master Duel (Konami Steam screenshots, §7 images 1-2)

- **Hand:** the real printed cards stand side by side at the bottom centre, slightly overlapping, about 10 % of the
  screen height. The frame colour gives the kind (green Spell, pink Trap, orange Effect Monster). The printed name bar
  reads "[SPELL CARD ⟳]" / "[TRAP CARD ∞]", so the icon is visible on the card itself.
- **Detail panel**, image 2, "Called by the Grave": name + Attribute disc on a green title bar; the card picture;
  **beside it "⟳ Quick-Play Spell" (icon in a round chip + the words)**; then "[Spell]" and the text in large type
  (about 26 px at 1080p). For a monster, image 1, "Prank-Kids Rocksies": **★ 4, ⚔ 1500, 🛡 1500** as three icon rows,
  then "[Rock/Effect]" and the text. On the field, monsters show ATK/DEF as big numbers (e.g. "1900/1600") and their
  Level as "★4" next to the card.
- **Playable cards:** a community post says cards that can be Summoned from the hand have glowing blue edges
  (unverified, §8).

### 1.3 Duel Links PC (Konami Steam screenshot, §7 image 3)

The hand is printed cards at the bottom centre. The **left column** (about 29 % of the width) shows the card large, then
the name, "★ 4 · DARK", "[Spellcaster/Effect]" in green, the text, and "ATK/1200 DEF/1100" at the bottom. On the field,
monsters show "★4" and "ATK 1600" in big numbers.

### 1.4 YGO Omega (official wiki screenshot, §7 image 4)

The hand is printed cards at the bottom centre. Field monsters carry a stat chip: ATK/DEF, ⚔/🛡 icons and the Level in
an orange disc ("3000 / 600 ⑪"). The phase sits in a disc on the centre line ("MP1 / TURN 2"). There is no detail panel
in the screenshot (no card is selected). Source: https://omega.duelistsunite.org/wiki/beginner-s-guide-to-ygo-omega.

### 1.5 EDOPro (client source)

The hand cards are the printed card pictures. When a card is pointed at, its picture goes in `wCardImg` at the top
left (`game.cpp:306-312`), and an info tab control `wInfos` sits under it at `Scale(1, 275, 301, 639)` (`game.cpp:1426`):
name (`stName`), type line (`stInfo`, its own colour `CARDINFO_TYPES_COLOR`), stats (`stDataInfo`, colour
`CARDINFO_STATS_COLOR`) and text (`game.cpp:1430-1443`).

**Common pattern:** the card in hand is recognised by **frame colour + printed icon + art**. The words and numbers are
read **in the detail panel**, which separates type, stats and text and uses icons for Level/ATK/DEF.

---

## 2. Where the card detail goes

| Game | Placement (landscape) | What it holds | Source |
| --- | --- | --- | --- |
| Master Duel PC | Floating panel at the top left, about 400×720 px at 1080p, over the edge of the field; the board stays centred | Only the card pointed at: name, art, type chip, stats, text (scrolls) | Konami Steam images 1-2 |
| Duel Links PC | Full-height left column (about 29 %); the duel log is in a right column; the board is in the middle | Same, plus the big card picture | Konami Steam image 3 |
| EDOPro | Left column: picture at (1,1), info tabs from y=275 to 639 (base 1024×640), width 300 | Name, type, stats, text; other tabs: log, chat, settings | `game.cpp:306`, `:1426` |
| YGO Omega | Not shown in the official screenshot | — | §8 |

**Phones (portrait):** Master Duel and Duel Links are played upright on phones, so their mobile layout differs from PC.
No official screenshot of their portrait card-detail view was found (§8). Junior does not need a portrait layout: it
asks the child to turn the screen sideways below 48 rem wide (`globals.css:11`, `upright-small`; screenshot showed
"Turn your screen sideways"). What matters is a **phone on its side** (about 844×390).

**What Junior does today**

- **3D:** the side panel is `landscape:w-[min(23rem,40vw)]`, with the mat taking the rest (`level-player.tsx:828`). When
  a hand card is picked, "On the card: <name>" and the full printed text appear **between the narration and the buttons**
  (`:586-601`). For Hebrew (`copy.englishCards`), the printed text is in English (`printedText`, `mini-board.tsx:43-45`),
  and the Hebrew meaning is added under it only when the translation differs (`:595-600`). The panel also holds the
  goal, the dev bar, the prompt, the buttons, the phase bar and the utility buttons, so the card text competes with
  everything else (screenshots `trainer-desktop-3d-picked.png`, `trainer-desktop-he-3d-picked.png`).
- **2D:** the same text box sits under the board, and every hand card also prints its full text (`CardFace full`,
  `mini-board.tsx:169-173`, used at `level-player.tsx:753`), in 11 px type inside a 112 px-wide card (`w-28`, `:744`).

---

## 3. Where the commands go

### 3.1 EDOPro: a menu at the card (exact, from source)

`wCmdMenu` holds the buttons Activate, Normal Summon, Special Summon, Set (monster), Set (Spell/Trap), Change
position, Attack, Show list, Operation and Reset (`game.cpp:522-544`). `ClientField::ShowMenu(flag, x, y)` stacks
**only the buttons whose flag is set**, 21 px apart, and places the window with its bottom edge **20 px above the
pointer**, from x−20 to x+80 (`event_handler.cpp`, `ShowMenu`: `setRelativePosition(recti(x - Scale(20), y - Scale(20) -
height, x + Scale(80), y - Scale(20)))`). It is called from the click handlers on hand, field and pile cards
(`event_handler.cpp:1246-1337`). The phase buttons BP/M2/EP are in a small `wPhase` strip at `Scale(480, 310, 855, 330)`,
on the centre line of the field (`game.cpp:314-333`).

### 3.2 Master Duel (Konami screenshots + community)

The screenshots show the board **with no command bar**. There is a round phase button on the centre line at the right
("Turn 2 / Battle", "Turn 2 / Main 1"), a settings cog at the top left, and two round buttons at the bottom right
(info, duel log); the LP chips sit in the corners (§7 images 1-2). How it is commonly described (community, unverified
§8): tapping a hand card raises it and shows small buttons **directly above it** (Summon / Set / Activate), and tapping
the phase button opens the list of phases to move to. Chain prompts appear as a centred dialog over the field, with
"Activate?" yes/no; its frequency follows the Off / Auto / On setting (see `opponent-turn-presentation.md` §3).

### 3.3 Duel Links (Konami screenshot, image 3)

The board shows "Turn 6 / Your Main Phase" at the top, an "Auto-Duel" pill and a menu button. There is no command bar:
the hand at the bottom, a round "end of phase" arrow at the right edge of the field. The card actions open from the
card (community, §8).

**Common pattern:** commands appear **where the eye already is** (at the card just touched). Only what is possible is
offered. The phase control is **one round button on the field's edge or centre line**. System buttons (settings, log,
info) are small and in the corners. Nothing permanent covers the hand or the field.

---

## 4. What Junior does today (precisely)

### 4.1 The hand card, 2D (`CardFace`, `mini-board.tsx:98-176`, used `full` at `level-player.tsx:753`)

- Frame: `KIND_FRAME` monster/spell/trap or `SPECIAL_FRAME` ritual/fusion/synchro/xyz/link (`mini-board.tsx:13-15`).
  There is no Effect-Monster orange in 2D (the 3D textures have it, `card-textures.ts:15-22`). `display-card.tsx:83` has
  its own `FRAME` with `effect`.
- Art: a square of 60 % of the width, at most 64 px (`CardArt size="face"`, `:93`).
- Name, 12 px, followed by **⚡ (Quick Effect) or ✦ (effect)** for monsters only (`:103`, `:128`).
- Monster: stars, type line, Scale, `ATK n` / `DEF n`, and 🐾 per Tribute (`:130-165`).
- **Spell/Trap: one 11 px uppercase line, `cardType()`**, e.g. "QUICK-PLAY SPELL" (`:167`, `copy.ts:218-223`). No icon.
- Full printed text, 11 px (`:169-173`). With five cards the hand wraps to two rows of 300-450 px tall cards
  (`trainer-desktop-2d.png`).
- Button: `aria-pressed` when picked; border arcane (picked) / gold (hint) / transparent; `disabled:opacity-70`
  (`level-player.tsx:745-752`).

### 4.2 The hand card, 3D (`HandCard`, `board-scene.tsx:416-447`; face from `printedFace`, `board3d-view.ts:71-76`; painted by `face()`, `card-textures.ts:115-166`)

- A 256×372 canvas: frame colour (Effect orange, Spell green, Trap pink…), name at the top (28 px on the canvas), art
  212 px, then a dark box with **one line**: "ATK / DEF" for a monster ("2000 / 1500", no ATK/DEF words) with the stars
  under it, or **`cardType()` for a Spell/Trap** ("Quick-Play Spell") (`card-textures.ts:155-165`). No icon. No effect
  mark: the 2D ⚡/✦ is missing in 3D.
- `fitText` shrinks the line to fit the width, so longer words (Hebrew + English in brackets) get tiny.
- Picked: the card rises and gets a blue rim; hint: a gold breathing glow; not enabled: dimmed (`board-scene.tsx:420-444`).
- Hand row: `handSlots` spreads the cards across the mat's width at `layout.handScale` (`board3d-layout.ts:121-128`).
- Keyboard and screen reader: the HTML hand is still in the page as `sr-only` buttons (`level-player.tsx:742`) and the
  focused one is ringed on the mat (`:526-534`, `board-stage.tsx:110`). This is a good pattern to keep.

### 4.3 Commands (`level-player.tsx`)

- `prompt` text built from ~15 nested cases (`:478-503`).
- Buttons in one `flex-wrap` (`:603-728`): Rival next, search choices, effect choices, **Use its effect from the hand**,
  Use effect, Detach, **Pass**, Confirm Summon, Summon trigger, **Set it face-down**, Special Summon, Pendulum Summon,
  Attack directly, Change position, Use effect, **Put the card back**, End turn, Next level, Back to map, Undo.
  `primary` = gold, `quiet` = outlined, both `min-h-12` (48 px) (`:56-57`).
- Phase bar under the buttons (`:730-740`; `PhaseBar`, `mini-board.tsx:570-600`): six pills, `min-h-12`, 12 px words.
- Utility row under it: Undo, Restart, Hint, Show me (`:772-797`). Then Back to the map and the 3D/flat switch (`:800-810`).
- Normal play (Summon, activate) is **tap the card, then tap a glowing zone** (`onHand`, `:247-270`; glow `:384-394`). So
  "Summon" and "Activate" have no button: the only visible choices after a pick are "Set it face-down" and "Put the card
  back" (`trainer-desktop-3d-picked.png`). The child has to read "Tap a glowing zone" in the panel to know what to do.

---

## 5. What suits children of 7-12 **(ours)**

- **Icons with words, never icons alone.** Every icon has the word next to it in the child's language. The app already
  pairs icons and words on its buttons (lucide icons + text, e.g. `level-player.tsx:774-789`).
- **Big targets.** The app's own sizes: 48 px for buttons (`min-h-12`), 56 px on a phone and 76 px on a tablet for the
  map pad (`move-pad.tsx:12`), 80/112 px for the map's one action button (`move-pad.tsx:67`). Context actions on a card
  should use the pad sizes (56 / 76 px) and the `tablet:` variant (`globals.css:9`).
- **One thing to read at a time.** The card reader shows only the card; the narration line shows only what is happening;
  the buttons show only what can be done now.
- **Official word + kid meaning.** Junior teaches the real game, so the official term stays ("Quick-Play Spell"). A
  one-line meaning goes with it in the reader ("Fast: you can use it on the rival's turn too").
- **Keyboard and screen reader:** keep the HTML board and hand as the accessible layer (`board-stage.tsx:40-43`). The
  context buttons should be real HTML buttons (not canvas). When a card is picked, move focus to the first action;
  Escape = "Put the card back"; announce the pick in the existing `role="status"` line (`level-player.tsx:563`). The hand
  button's name should include the kind: "Dark Magical Curtain, Quick-Play Spell".
- **RTL:** place things with `start`/`end`, never left/right, as the panel does today. In Hebrew the meaning comes
  first and the English printed text is folded under it.

---

## 6. Proposal for Junior **(ours)**

### 6.1 The hand card (same design in 2D HTML and in the 3D texture)

```
┌──────────────────────┐   frame = official colour (Spell green, Trap pink, Normal yellow,
│ Dark Magical Curtain │           Effect orange, Ritual blue, Fusion purple…), 2D gets the Effect orange too
│ ┌──────────────────┐ │
│ │       art        │ │   art takes most of the card
│ └──────────────────┘ │
│ ┌─⚡─┬──────────────┐│   TYPE BADGE (Spell/Trap): round chip with the official icon,
│ │ ⚡ │ Quick-Play   ││   then 1-2 big words in the child's language
│ └────┴──────────────┘│
└──────────────────────┘
Monster:  ★★★★ (top-right, max 12)   ⚔ 2500  🛡 2100   + ✦ "Effect" / ⚡ "Quick" chip
```

- **No effect text on the card** (drop `full` text in the hand, `mini-board.tsx:169-173`). The text goes to the reader.
- **Type badge** = official icon + short word, colour of the frame, readable at the hand's size (on canvas: ≥ 44 px
  high out of 372, words ≤ 12 characters; the full official name is in the reader and the accessible name).

  | Kind | Icon (lucide, already a dependency) | Badge words (en) |
  | --- | --- | --- |
  | Normal Spell / Trap | none (empty chip) | "Spell" / "Trap" |
  | Quick-Play Spell | `Zap` | "Quick-Play" |
  | Continuous Spell / Trap | `Infinity` | "Continuous" |
  | Equip Spell | `Plus` (bold cross) | "Equip" |
  | Field Spell | `Compass` | "Field" |
  | Ritual Spell | `Flame` | "Ritual" |
  | Counter Trap | `Undo2` / curved arrow | "Counter" |

  Hebrew: the Hebrew word only on the card (no English in brackets: that is what makes the 3D line tiny today); the
  English printed name in the reader.
- **Monsters:** Level ★ (or Rank / Link) as a row; **ATK with ⚔ and DEF with 🛡** (as Master Duel's detail, Omega's
  chips); the effect mark (⚡/✦) on both boards, not only 2D; 🐾 Tributes kept.
- **Playable now:** enabled cards get a **blue edge**; cards that cannot be used are dimmed (today only
  `opacity-70` / `dim`). The gold "hint" glow and blue "picked" rim stay (`board-scene.tsx:429-439`).
- **Hand size:** in 3D, raise `handScale` so a card is at least ~90 px wide on a 844×390 phone; let cards overlap
  (Master Duel does) rather than shrink. In 2D, cards become fixed-height (~150 px) and in one row that scrolls
  sideways if needed.

### 6.2 The card reader (detail panel)

Shows **only** the card being looked at: picked in the hand, pointed at, focused with the keyboard, or tapped on the
field / in a pile. Layout, top to bottom: name; art (big); **type row = the same badge icon + full official name**
("⚡ Quick-Play Spell"), or ★ Level · Attribute · Type for monsters; **⚔ ATK 🛡 DEF** big; the one-line kid meaning; the
text (in Hebrew: Hebrew meaning first, then "As printed (English)" folded); a close ✕.

| Screen | Placement |
| --- | --- |
| Desktop / tablet on its side (≥ 48 rem wide and ≥ 32 rem high, the `tablet:` variant) | A column at the **start** edge (left in LTR, right in RTL), about 20-24 % of the width, as Master Duel / Duel Links / EDOPro do. It replaces today's mixed side panel: goal, narration and buttons leave it (see 6.3). Empty state: the goal sentence and the trainer's picture. |
| Phone on its side (≈ 844×390) | No permanent column. A **sheet over the rival's half of the mat**, at most 60 % of the height, slid down from the top, scrolling inside, ✕ to close. It opens when a card is picked or long-pressed and closes when the card is played or put back. The hand and the context buttons stay visible under it. |
| 2D board | Wide screen: board and reader side by side (a two-column grid, reader at the start). Narrow: the reader opens as the same sheet over the top of the board. |

### 6.3 Commands

1. **Context actions at the picked card (both boards).** When a hand card is picked, it rises (as today) and a row of
   1-3 big buttons appears **just above it**, inside the mat: **Summon** (⚔), **Set** (face-down card), **Activate** (✨),
   **Use from the hand** (in an answer window), and always a small **✕ Put back**. Only possible actions appear
   (EDOPro's rule). Tapping a glowing zone still works for children who already know it. The same row appears above a
   picked monster on the field: **Attack**, **Attack directly**, **Change position**, **Use effect**. Sizes: 56 px phone /
   76 px tablet, icon + word (`move-pad.tsx` sizes). Choices that need a list (search the Deck, Fusion materials,
   Pendulum) keep a panel, but as a sheet over the mat, not in the side column.
   - *3D:* HTML buttons in the overlay layer over the canvas, positioned by projecting the picked card's position
     (`project(view, point, w, h)`, already used by the effects in `board-3d-stage.tsx`). Clamped inside the mat, never
     over the hand.
   - *2D:* buttons absolutely positioned above the picked hand button (or field zone).
2. **Answer windows (chain prompt).** A banner across the **centre line of the mat** ("Kaiba attacks! Answer?") with
   two big buttons, **Answer** and **Let it go** (today "Pass"). The cards that can answer glow. This reuses
   `TurnBanner`'s answering state (`mini-board.tsx:603`).
3. **Phase disc.** One round button at the **end edge of the mat, on the centre line** (Master Duel / Omega): "Turn 3 ·
   Main 1", the child's blue or the rival's red. Tapping it opens the phases to move to as a short vertical list next
   to it. On course levels that teach phases (`level.bar !== "none"`), the list stays open as a vertical column at that
   edge, so the phases are still seen in order.
4. **Narration line.** One line at the top of the mat (the `role="status"` line, `level-player.tsx:563`), with the
   prompt ("Tap a glowing zone") under it. The long goal stays in the reader's empty state.
5. **Utility toolbar.** Hint, Undo, Restart, Show me, sound, 3D/flat, Back to the map become a small toolbar of icon
   buttons with a short word under each (48 px), in the top corner opposite the LP chip, apart from game actions (Master
   Duel keeps settings and log in corners).

### 6.4 Resulting screens

- **3D, desktop / tablet on its side:** `[card reader | mat with the phase disc on the end edge, the hand at the bottom,
  context buttons above the picked card, a narration line at the top, utility toolbar in a top corner]`.
- **3D, phone on its side:** the mat takes the full width. The reader is a sheet over the rival's half. The phase disc,
  context buttons and toolbar are on the mat. Nothing needs scrolling.
- **2D:** board, then **the hand directly under it** (not under the panel), the context buttons over the picked card,
  the phase bar beside the board on a wide screen, the reader at the start side.

### 6.5 Order of work (suggested)

1. Type badge + icons + no text on the hand card (2D `CardFace`, 3D `face()` / `printedFace`), plus the accessible
   names. This is the owner's first complaint and is small.
2. Card reader as its own component (side column / sheet), fed by `reading` (`level-player.tsx:509`).
3. Context actions at the card; then the phase disc and the toolbar; then empty the side panel.

---

## 7. Images (not committed)

**Junior today**: `C:\Users\meyer\AppData\Local\Temp\claude\ui-shots\`

| File | What |
| --- | --- |
| `trainer-desktop-3d.png` | Masters' island, Yugi Muto, 3D, 1366×800, English: the panel on the right, hand on the mat |
| `trainer-desktop-3d-picked.png` | Same, Magician's Rod picked: the "On the card" text in the panel; only "Set it face-down" / "Put the card back" offered; the phase bar is pushed below |
| `trainer-desktop-he-3d-picked.png` | Same in Hebrew: **panel on the left**, card text in English, the hand's type line is unreadable |
| `trainer-desktop-2d.png`, `trainer-desktop-2d-picked.png` | 2D, full page: the hand of tall text cards under the phase bar |
| `trainer-phone-3d.png`, `trainer-phone-3d-picked.png` | 3D, phone on its side 844×390: tiny hand, the buttons below the fold |
| `trainer-phone-2d.png`, `trainer-phone-2d-picked.png` | 2D on that phone: the hand ~2.5 screens below the board |
| `course-desktop-3d.png`, `course-desktop-2d.png` | Course level "Magic Jammer" (island of today's duels), during the rival's turn |

**References**: `C:\Users\meyer\AppData\Local\Temp\claude\ui-shots\ref\`

| # | File | Source | Shows |
| --- | --- | --- | --- |
| 1 | `md-detail-panel-monster.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1449850/ss_f4e2257edc1cb8093f1f0b40d7daf96211405f90.1920x1080.jpg (Konami, Steam app 1449850) | Master Duel: monster detail at the top left (★4, ⚔1500, 🛡1500 as icon rows, [Rock/Effect], text); hand of printed cards at the bottom; phase disc "Turn 2 / Battle" |
| 2 | `md-detail-panel-quickplay.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1449850/ss_6501d1b0e2dc14a5e1031d5e02456d9b72912a0b.1920x1080.jpg | Master Duel: **"⟳ Quick-Play Spell" as an icon chip + words** in the detail; chain links numbered |
| 3 | `dl-pc-detail-left-hand-bottom.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/601510/ss_b3919714fbe1369b37daefa187171acde0a63211.1920x1080.jpg (Konami, Steam app 601510) | Duel Links PC: detail column on the left, duel log on the right, the hand at the bottom, "Turn 6 / Your Main Phase" |
| 4 | `omega-duel-layout.png` | https://omega-592647419856-sa-east-1-an.s3.sa-east-1.amazonaws.com/wiki_assets/9de443c9fb9dfa2d98b4464713b1df39 (on the official Omega wiki) | YGO Omega: phase disc "MP1 / TURN 2" on the centre line, monster stat chips with ⚔/🛡 and Level, hand at the bottom |

Other sources: Official Rulebook v10, https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf (p. 27);
EDOPro client, https://github.com/edo9300/edopro (`gframe/game.cpp`, `gframe/event_handler.cpp`); Steam pages
https://store.steampowered.com/app/1449850/ and https://store.steampowered.com/app/601510/. Community (not relied on
for facts): https://gameplay.tips/guides/yu-gi-oh-master-duel-duel-screen-info-guide-duel-field-menu-and-icons.html.

---

## 8. Unverified

- **Master Duel's context buttons above the selected hand card (Summon / Set / Activate)** and the phase list that
  opens from the phase disc: widely described, but no Konami screenshot or document showing them was found. EDOPro's
  menu-at-the-card is verified from its source.
- **"Cards that can be Summoned have glowing blue edges" in Master Duel:** a community post quoted in search results.
  Not seen in the Konami screenshots.
- **Master Duel / Duel Links portrait (phone) layout of the card detail:** not found in official images. The Steam
  screenshots are PC/landscape.
- **YGO Omega's card-detail panel and action menu:** the official wiki page shows no selected card and does not
  describe them ("A single Move button handles most actions" is about Manual mode only).
- **The owner's "left side":** inferred from the Hebrew layout (panel on the left) and the 2D hand text. The owner's
  language setting was not checked.
- **Exact drawings of the six official icons:** the Rulebook names them, but the PDF text extraction does not include
  the pictures. The glyphs proposed in §6.1 are lucide equivalents, not Konami's art.
- **Screenshots of course levels with a Spell/Trap picked:** the course level captured ("Magic Jammer") opens on the
  rival's turn, so only the trainer duel shows a pick.
