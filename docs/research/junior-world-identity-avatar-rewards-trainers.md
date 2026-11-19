# Academy Junior world: Yu-Gi-Oh! identity, a walking character, card rewards, trainers and monsters

> **Date of observation:** 2026-11-19. Every web page, registry record and repository file cited below was fetched
> that day. The repository was read on `main` at HEAD `8a528d2`, with the island world still uncommitted and other
> sessions editing the tree; code claims describe the files as they stood that day, and line numbers may move.
> **Nature of this document:** a research note. No code was changed, nothing was installed, built, run or
> published. Nothing was added to the repo except this file.
>
> **The request (owner, verbatim):**
>
> 1. "There is no sign on the map that the goal is for learning yugioh."
> 2. "Can we do a character to move in the island"
> 3. "After finishing a lesson, the character can have a reward like a card"
> 4. "Should do something to show on each island like a trainer, grand father of yugi for example for starting,
>    yugi, kaiba, and others yugioh character but also monsters like dark magician, blue eyes, heroes."
>
> **Sourcing rule used:** each external claim is followed by the page that owns it (the library's own docs, the
> rights holder's own terms, the asset author's own files). Claims about this repo cite `file:line`; paths are
> relative to `apps/academy-ygo/` unless they start with `docs/` or `apps/`. Figures marked **[measured]** were
> obtained that day as described next to them. Proposals, estimates and inferences are labelled **(ours)**. What
> could not be confirmed at a primary source is listed in [§7](#7-unverified--could-not-confirm).
> **This is not legal advice.** §4.2 reports what the published terms say and do not say. It draws no legal
> conclusion beyond them.
>
> **Relation to existing notes.** [junior-3d-island-world.md](./junior-3d-island-world.md) (engine, loading,
> accessibility rules) and [junior-3d-world-assets-and-build.md](./junior-3d-world-assets-and-build.md) (KayKit,
> the build pipeline, "tap to travel", Konami's terms in its §2) are the base. The second note's rule was "no
> Konami creature or character", and the built world keeps it (`src/lib/junior/world/themes.ts:6`,
> `docs/academy-junior-world.md`). The owner's point 4 asks to go the other way, so §4 looks at that line again.
> [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §3 covers what
> rewards do to children's motivation; this note only covers how a card reward plugs in.
> [card-data-yugioh-riftbound.md](./card-data-yugioh-riftbound.md) Part A covers card-data sources.

---

## 0. Short answers

| # | Point | Answer |
| --- | --- | --- |
| 1 | The map does not say "Yu-Gi-Oh!" | **True, and cheap to fix.** On the map the only visible words about the subject are the site name "Duel Academy" in the header. The page title is hidden, the intro sentence is only in the no-3D fallback, the one hint line is hidden on phones and talks about sailing. Fix with words first (a title line, the island's rule, the level name), then with card shapes in the scene (stops drawn as cards, a duel mat on each island). 1 to 2 days. |
| 2 | A character that moves | **Yes, with the libraries already installed.** Each island already carries a walking path in its data (`walk`) that the scene does not use. A CC0 KayKit adventurer can walk it when the child taps a stop. Tap to walk, not a joystick. The character file must be trimmed first: the published file is 3.66 MB with 76 animations. 3 to 5 days. |
| 3 | A card as reward | **Yes, and most of it exists.** The album already collects the cards of solved levels, but silently and at the bottom of the page. Add a "you earned this card" moment after a level and a card binder on the map. No new stored data is needed. Use the app's own drawn cards, as today. 2 to 3 days. |
| 4 | Trainers and monsters | **Technically easy, legally the open question.** No published Konami text was found that permits a fan site to use card artwork or the anime characters; the texts found reserve both. The anime characters are a separate set of rights from the cards. Recommended: original mentors (KayKit characters) and monsters shown as the app's own cards with their real names, which is what the app already does. Named anime characters and official artwork only after written permission or a lawyer's advice. |

**Suggested order (ours):** 1 (words), 3 (reward moment), 2 (character), then 1 again (card shapes in the scene) and
4 (mentors and island monsters). Details in §5.

---

## 1. Yu-Gi-Oh! learning identity on the map

### 1.1 What the map shows today

| What a child sees or does not see | Where |
| --- | --- |
| The header shows only the site name "Duel Academy" and the language switch. | `src/components/site-header.tsx:11-14` |
| The tagline "Learn Yu-Gi-Oh! by playing." exists but is used only in the browser tab title and meta description. | `src/lib/brand.ts:2`; `src/app/layout.tsx:15-16` |
| On the map, the page title "Junior: learn by playing" is hidden from sight (`sr-only`). | `src/components/junior/play/junior-play.tsx:161`; text at `src/lib/junior/play/copy-en.ts:73` |
| The intro sentence ("Small duels on a small board. Each one teaches one rule…") is shown only when there is no 3D. | `junior-play.tsx:193-196`; `copy-en.ts:74` |
| Over the sky: "Island 3 of 18", the island's title, and a count such as "2 of 8 levels solved". | `src/components/junior/world/island-world.tsx:115-122` |
| The island's blurb, the line that names the rules ("Summons, Tributes and the phases of a turn"), is shown only in the fallback list. | `junior-play.tsx:215`; `copy-en.ts:78-95` |
| Several island titles do not sound like a card game on their own: "The Deck wakes up", "Shield or sword", "Call a friend", "Turtle tower". | `copy-en.ts:78-83` |
| The only instruction is "Tap an island to sail there, then tap a glowing stop to play." It is hidden on small screens and on short screens. | `src/lib/junior/world/copy.ts:26`; `island-world.tsx:167` (`max-sm:hidden`) |
| Stops are buttons with a number and an icon. The level's name is only in the tooltip and the screen-reader label. | `island-world.tsx:155-160` |
| The big gold button does name the level: "Play: " followed by the level's title. | `island-world.tsx:138-141`; `copy.ts:31` |
| In the scene: windmills, castles, towers, homes, trees; a boat; gold gems and stars over the stops. Nothing card-shaped. | `themes.ts:21-40`; `src/components/junior/world/world-scene.tsx:163-218`, `:293-332` |
| The rule of the scene: "Landscape and colour only: no Konami creature or character anywhere." And no words inside the scene. | `themes.ts:6`; `docs/academy-junior-world.md` ("Rules the scene keeps") |
| The card album and the list of rules are below the map, after a full screen of scrolling. | `junior-play.tsx:109-151`, `:177` |

So the owner's remark is accurate. A child who lands on the page sees a pretty sea, a boat and villages. Nothing
on screen says "cards", "duel" or "Yu-Gi-Oh!" until a level opens.

### 1.2 Options

| # | Option | Cost | Trade-off |
| --- | --- | --- | --- |
| A | **Say it in words.** Show a short line over the map on every screen size, for example the existing tagline or "Learn to duel, one rule at a time", next to the site name or above the island title. | Hours. One copy key in three languages. | Takes a line of a small screen. The header already has room. |
| B | **Show what the island teaches.** Under the island title, show the blurb (the rules of that world) in place of, or beside, the solved count. | Hours. The text exists in three languages. | The top block grows; on a phone on its side it is already hidden (`island-world.tsx:116`, `:121`). |
| C | **Name the stops by their rule.** For the selected or next stop, show the level title and the rule it teaches (`level.teaches`, `copy.rules`). | Half a day. | Ten stops on `puzzles` cannot all show text; show it for the focused one only. |
| D | **A first-visit line from a guide.** One sentence shown until the first level is solved: "Welcome, duelist! Each island teaches one rule of Yu-Gi-Oh!. Tap Play." Derived from progress (no solved level), so nothing new is stored. | Half a day. | Becomes the natural place for the mentor of §4. |
| E | **Stops drawn as cards.** Replace the star and the gem (`world-scene.tsx:185-214`) by a small standing card: a flat box with the app's own frame colours (the same colours `CardFace` uses for Monster, Spell and Trap, `src/components/junior/play/mini-board.tsx:81`). Face-down grey for locked, glowing for next, gold-edged for starred. No picture and no text on it. | 1 day. Geometry made in code, like the boat. | Must not copy the real card back or the real frame artwork: a plain coloured rectangle with a border is ours; Konami's card back design is not (§4.2). |
| F | **A duel mat as landmark.** A flat board with five Monster zones and five Spell & Trap zones drawn as coloured rectangles, placed on each island next to the central landmark or on the `building_stage_A` piece. The same mat the child plays on inside a level. | 1 to 2 days. Code geometry, one more mesh per island or merged. | Small on a phone. Works best on the first island and as the place where the island's monster stands (§4). |
| G | **The island's signature card as HTML.** A `CardFace` chip (the app's own drawn card, real name where the card is real) beside the island title: Dark Magician on `friend`, Black Luster Soldier on `ritual`. | Half a day. `CardFace` exists and is already used by the album (`junior-play.tsx:137-141`). | None of note. It is HTML, so it is translated, readable by a screen reader and right-to-left safe. |
| H | **Flags and sails.** The kit already holds four flags that are loaded but unused (`src/lib/junior/world/kit-pieces.json:41-44`; no theme lists them). A card symbol on the sail. | Hours. | Decorative only. |
| I | **Rename the vague islands.** "Shield or sword" could become "Attack and Defense". | Copy work in three languages. | The current names were chosen for six-year-olds; the blurb (option B) may be enough. |

### 1.3 Recommendation (ours)

1. **A + B + D first**, in one go: they are text, cost a day, and answer the remark directly.
2. **G** with them, because a card on screen is the clearest sign of a card game.
3. **E then F** when the character work (§2) is done, because they touch the same scene file.

Keep the two rules the scene already follows: no words inside the canvas (they would not translate or read
right-to-left, see the first note §7.4) and every action also as an HTML button.

---

## 2. A character that moves on the island

### 2.1 What exists today

| Fact | Where |
| --- | --- |
| The 3D stack is `three` 0.187.0 and `@react-three/fiber` 9.8.2. `@react-three/drei` is **not** installed; no physics, no controller library. | `package.json:15`, `:22` |
| The child is shown by a boat made of boxes in code. It sails a curve between island harbours; with reduced motion it jumps. | `world-scene.tsx:293-332` (boat), `:372-446` (`Director`), `:387-397` (jump) |
| The owner was told: "No character yet. The child is shown by the boat and the glowing gem on the next stop." | `docs/open-questions/2026-11-19-02h30.md` item 4 |
| **Each island already has a walking path.** `walk` is "The walk from the dock round the road loop, hex by hex. Every stop is on it, in course order." | `src/lib/junior/world/world.ts:49-50`, built at `:97` |
| The scene does not use `walk` (searched `world-scene.tsx` for `walk`: no match). The tests already check that every stop is on the road. | `world-scene.tsx`; `docs/academy-junior-world.md` (last paragraph) |
| Each stop has a position (`stop.at`) and a large invisible tap target. | `world.ts:21-26`; `world-scene.tsx:180-184` |
| A tap on a stop of the focused island opens the level at once. | `world-scene.tsx:540`; `island-world.tsx:154` |
| Frames are drawn on demand; idle motion gets about 15 frames a second for 30 seconds after the last touch. | `world-scene.tsx:449-489`, `:553` |
| Motion follows the device's "reduce motion" setting only. | `junior-play.tsx:39-43` |
| The canvas is hidden from assistive technology (`aria-hidden`). | `world-scene.tsx:553` |

### 2.2 What the libraries in use offer

Neither three.js nor React Three Fiber has a "character controller". They give the parts:

- **Loading.** `GLTFLoader` is already used for the kit (`world-scene.tsx:64-66`). An animated glTF returns its
  clips with the scene.
- **Playing clips.** "`AnimationMixer` is a player for animations on a particular object in the scene. When
  multiple objects in the scene are animated independently, one `AnimationMixer` may be used for each object."
  `update()` "Advances the global mixer time and updates the animation. This is usually done in the render loop"
  (<https://threejs.org/docs/pages/AnimationMixer.html>).
- **Blending idle and walk.** `crossFadeTo`: "Causes this action to fade out and the given action to fade in,
  within the passed time interval" (<https://threejs.org/docs/pages/AnimationAction.html>).
- **More than one copy of a rigged model.** `SkeletonUtils.clone()` "Clones the given 3D object and its
  descendants, ensuring that any `SkinnedMesh` instances are correctly associated with their bones"
  (<https://threejs.org/docs/pages/module-SkeletonUtils.html>). Needed if mentors (§4) reuse the same model.
- **Moving along a path.** The boat already does it with `THREE.CatmullRomCurve3` and `getPointAt`
  (`world-scene.tsx:399-421`). A walk is the same code on another list of points.
- **Per-frame updates.** "Fast updates are carried out in `useFrame` by mutation"; "Use deltas instead of fixed
  values so that your app is refresh-rate independent"; "think twice before you mount/unmount things!"
  (<https://r3f.docs.pmnd.rs/advanced/pitfalls>). The scene already works this way.
- **Taps.** Objects "can be interacted with by declaring events on them. We support pointer events, clicks and
  wheel-scroll"; `onPointerMissed` "fires on clicks that haven't hit any meshes"
  (<https://r3f.docs.pmnd.rs/api/events>). The page does not mention touch by name; pointer events cover touch in
  browsers, and the existing stop taps already rely on it (ours).
- **Free roaming** would need what the second note listed and what is not installed: `@react-three/rapier`
  (physics) and `ecctrl` (controller with an on-screen joystick)
  ([junior-3d-world-assets-and-build.md](./junior-3d-world-assets-and-build.md) §5.1).

### 2.3 The character model [measured]

KayKit *Adventurers* 1.0, same author and licence as the islands: "License: (Creative Commons Zero, CC0)", "free
to use in personal, educational and commercial projects"
(<https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/HEAD/LICENSE.txt>).
The repository holds five characters as single `.glb` files: Barbarian, Knight, Mage, Rogue, Rogue_Hooded
(<https://api.github.com/repos/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/git/trees/HEAD?recursive=1>).

`Knight.glb`, downloaded to a temporary folder outside the repo, read and deleted:

| Measure | Value |
| --- | --- |
| File size | 3,659,532 bytes; 1,157,958 bytes with `gzip -9` |
| Meshes | 15, one material, one 14 KB texture inside the file (the other four files are 3.59 to 3.62 MB) |
| Triangles (all 15 meshes) | 6,952 |
| Skeleton | 41 joints |
| Animations | **76**, among them `Idle`, `Walking_A`, `Running_A`, `Cheer`, `Interact`, `PickUp`, `Sit_Floor_Idle`, `Spellcast_Raise`, and many attacks |

Readings **(ours)**:

- **The file cannot ship as it is.** It is almost four times the whole island kit (`public/world/kit.glb` is
  971,280 bytes). Nearly all of it is animations the map will never play.
- **Trim it in the build script.** `scripts/world/build-kit.mjs` already fetches a pack at a fixed commit and
  runs glTF Transform (`:12-15`, `:70`). The same script can keep four or five clips (`Idle`, `Walking_A`,
  `Cheer`, `Interact`), drop the weapon and shield meshes, and write `public/world/hero.glb`. By the accessor
  sizes in the file, those four clips hold about 67 KB of keyframes and all meshes together 339 KB before
  compression, so a trimmed file of **roughly 0.3 to 0.5 MB** is a fair expectation. That figure is an estimate
  from the file's tables, not a built file.
- **The 15 meshes are probably the body parts plus the accessories** the character holds; this was read from the
  count, not from the node names. Each skinned mesh is a draw call, so dropping accessories matters.
- The character does not share the islands' texture, so it cannot be merged into the island mesh. It adds a few
  draw calls, which the budget of under 100 allows
  ([junior-3d-world-assets-and-build.md](./junior-3d-world-assets-and-build.md) §5.4).

### 2.4 Tap to walk, or free roaming

| | Tap a stop, the character walks the road | Free roaming (joystick or drag) |
| --- | --- | --- |
| What the child does | Taps a stop or the Play button. The character walks there along the road. | Steers with a thumb. |
| New dependencies | None. | Physics and a controller (not installed). |
| Data needed | Already there: `island.walk`, `stop.at`. | Colliders for every building and coast. |
| Can the child get lost or stuck | No. | Yes. |
| Small hands, phone screen | One tap on a target that is already large (`world-scene.tsx:180-184`) and on HTML buttons of 48 pixels (`island-world.tsx:157`). | A virtual stick asks for a held, precise drag. WCAG 2.2 SC 2.5.7 (AA): "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging" (<https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html>). So a tap path must exist anyway. |
| Frames and battery | Frames only during a walk of one or two seconds, then the scene rests as today. | Continuous rendering while the child plays. |
| Reduced motion | The character is placed at the stop, as the boat is placed today (`world-scene.tsx:387-397`). | No equivalent. |
| Screen readers, keyboard | Unchanged: the HTML buttons stay the controls. | The canvas would need its own keyboard control. |
| Effort (ours) | 3 to 5 days. | Weeks (second note, §5.1: "(a) plus 2 to 4 weeks"). |

**Recommendation (ours): tap to walk.** It is what the second note already recommended for ages 6 to 10, and the
island data was built for it.

### 2.5 How it would work (ours)

1. **Where the character stands is derived, not stored.** On the focused island: at the stop of the last solved
   level, or at the dock when none is solved. Both come from `stopStatus` (`src/lib/junior/world/status.ts:15-19`).
   So nothing is added to `PlayProgress`, and the character is in the right place on any device or after a reload.
2. **Tap a stop:** the character walks along `walk` from its stop to the tapped one (a curve through the hex
   centres between the two), with `Walking_A` cross-faded in and `Idle` cross-faded back. Then the level opens.
   Cap the walk at about 1.5 seconds whatever the distance, so the map never becomes a wait. A second tap, or the
   HTML button, opens the level at once.
3. **Back from a solved level:** the character plays `Cheer` once, then walks to the next stop. This is also
   where the card reward of §3 can show.
4. **Sailing:** the character stands in the boat, or disappears at the dock and reappears on arrival. The boat
   and the route stay as they are.
5. **Camera:** no follow camera is needed. `framing()` already shows the whole island
   (`world-scene.tsx:354-362`), so the character is always in view. A camera that chases a small figure is the
   kind of motion the reduced-motion rule exists for.
6. **Frames:** `mixer.update(delta)` in `useFrame`, and `invalidate()` while a walk or a cheer plays. The idle
   breathing can ride on the existing 15-frames-a-second ticker (`world-scene.tsx:455-489`); if that looks
   choppy, hold a still pose when idle. This needs to be seen on a device.
7. **Locked stops:** the character does not walk to them; the tap does nothing, as today
   (`world-scene.tsx:174-177`).
8. **Choosing a character** (knight, mage, rogue…) would be the first thing that needs storing. Do not put it in
   the play record: its parser rejects a record it does not fully understand and then stops saving
   (`src/lib/junior/play/progress.ts:55-74`, `:87`; the trap is described in
   [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §4.4). Use a
   separate key, for example `academy-ygo:junior:world:v1`, read the same forgiving way as `calm` and `sound`.
9. **Tests:** the path between two stops is pure data and can be unit-tested next to `world.test.ts`. The drawing
   is checked by screenshots, as the open-questions file says for the rest of the scene (item 3).

**Performance budget (ours, to be corrected on a real tablet):** one character, under 7,000 triangles, 41 bones,
under 10 draw calls, under 0.5 MB over the wire, loaded after the islands so the map appears first. The
weakest known point is unchanged from the earlier notes: nothing has been tried on a cheap tablet
(`docs/open-questions/2026-11-19-02h30.md` item 5).

---

## 3. A card as reward after a lesson

### 3.1 What exists

| Mechanic | Where |
| --- | --- |
| A solved level is recorded with `clean` (no hint) and `firstTry`. | `progress.ts:13-18`, `:37-43` |
| **An album already exists.** `album(progress)` returns "every card of the child's side in a solved level". | `progress.ts:129-139` |
| It is shown as a row of the app's own drawn cards, under the map, below the list of rules. Empty text: "Cards you play with will appear here." | `junior-play.tsx:129-144`; `copy-en.ts:373-374` |
| Nothing announces a new card. After a solve the child sees "Solved!" and a Next button. | `src/components/junior/play/level-player.tsx:419-424`, `:512-522` |
| A printable certificate after the two whole duels. | `level-player.tsx:559-571` |
| Stars on stops, a finished state per island, a rule list with "met" and "mastered". | `status.ts:5-19`; `progress.ts:116-127` |
| The rewards note already proposed "Surprise album cards" (its option F) and two-tier world badges (option E). | [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §3.3 |

So the collection exists and the moment does not. The owner's idea is mostly a matter of showing what is already
computed.

### 3.2 Options (ours)

| # | Option | Stored data | Notes |
| --- | --- | --- | --- |
| R1 | **"New card!" after a level.** Compare the album before and after the solve; show each new card with a short flip, its name, and one line ("Dark Magician joins your album"). Then the Next button. | None. The difference of two `album()` calls. | The seam is `onSolved` in `junior-play.tsx:98` (it has the progress before and after) and the result block in `level-player.tsx:419-424`. With the cue system already in the tree (`src/lib/junior/play/cues.ts`) the flip can be one more cue. |
| R2 | **One special card per finished island.** When `islandStatus` becomes `done`, the island's signature card (§4.3) is "earned" and shown on the island, held by the character or standing on the duel mat. | None. Derived from `islandStatus` (`status.ts:9-13`). | Gives each island a goal a child can name: "I want the Blue-Eyes island". |
| R3 | **A shiny version for stars.** The island card turns gold when every level of the island is starred. | None. Derived from `clean`. | The rewards note's option E. A reason to replay with no new content. |
| R4 | **A binder button on the map.** Move the album from the bottom of the page to a button in the map's corner, next to the sound switch (`island-world.tsx:123`), opening a panel with earned cards and grey places for the ones to come. | None. | Makes the collection visible from the first screen, which also helps point 1. |
| R5 | **The character carries the last card.** A small card floats over the character on the map after a win. | None. | Decoration; do it with the character work. |
| R6 | **Random packs, duplicates, rarities, trades.** | New data. | **Not recommended.** It adds chance and scarcity to a course whose design excludes timers and streaks (`junior-play.tsx:28`), and the research summarised in the rewards note argues for rewards that inform, not prizes that are promised. |

A caution from the rewards note that still applies: a reward announced in advance for getting through can lower
interest in the activity itself, while one that tells the child something true about what they did does not
(Lepper et al. 1973; Deci et al. 1999, quoted there §3.2). R1 fits that: the card is the one the child just
played with, so it says "you now know this card". R2 is a promised prize; keep its wording about the island, not
about the prize.

One thing to decide: today a card enters the album when a level is solved **with or without a hint**
(`progress.ts:133`). If cards become the visible reward, a child can collect all of them by pressing Hint. The
star tier (R3) is the cheap answer; changing `album()` to count clean solves only is the strict one.

### 3.3 Which cards, and which pictures

- **The academy has no card-image source.** Its cards are written by hand in `src/lib/junior/play/cards.ts`:
  original cards and real cards "by their real names, numbers and text. The pictures stay emoji." (`cards.ts:142`,
  `:68`). Dark Magician, Blue-Eyes White Dragon, Blue-Eyes Ultimate Dragon and Exodia are already there
  (`cards.ts:169-177`). No image file or remote image URL is used (searched the app for `ygoprodeck`: only the
  footer link, `src/components/site-footer.tsx:9`).
- **The footer makes a promise:** "Cards are drawn as simple schematics with our own pictures, never real card
  art." (`site-footer.tsx:44`).
- **The other app in the repo does use real card images.** `apps/duel-nextjs` takes card data and images from
  YGOPRODeck and keeps its own copy of every image: "YGOPRODeck forbids hot-linking, so every image is downloaded
  once" (`apps/duel-nextjs/CONTEXT.md:169-170`; `apps/duel-nextjs/scripts/mirror-images.ts:2`).
- **What YGOPRODeck's own API guide says** (<https://ygoprodeck.com/api-guide/>, fetched today):
  - "Do not continually hotlink images directly from this site. Please download and re-host the images yourself.
    Failure to do so will result in an IP blacklist."
  - "Please only pull an image once and then store it locally."
  - Three image sets exist: full cards, small cards, and `cards_cropped` ("cropped image art"), with "Credit to
    the Duelists Unite team for the cropped artwork images."
  - "The rate limit is 20 requests per 1 second. If you exceed this, you are blocked from accessing the API for
    1 hour." "Please download and store all data pulled from this API locally".
  - On ownership: "The literal and graphical information presented on this site about Yu-Gi-Oh!, including card
    images, the attribute, level/rank and type symbols, and card text, is copyright 4K Media Inc, a subsidiary of
    Konami Digital Entertainment, Inc. This website is not produced by, endorsed by, supported by, or affiliated
    with 4k Media or Konami Digital Entertainment."
- **What that means for a reward card.** YGOPRODeck sets rules for how to fetch (store your own copy, do not
  hot-link) and says the images are not its own to license. It gives no permission to show them. Permission
  would have to come from Konami, and none was found (§4.2).

**Recommendation (ours):** the reward card is the app's own `CardFace`, with the real name and numbers where the
card is real, as today. Make it feel like a prize with our own means: a larger card, a gold border for legendary
cards, the flip, a sound from the existing tone generator. This keeps the footer true and needs no image at all.

---

## 4. Trainers and monsters on each island

### 4.1 How to show them: technical options

| # | Option | Asset source | Load cost | Fit |
| --- | --- | --- | --- | --- |
| T1 | **3D models of the named characters and monsters** (Yugi, Kaiba, Dark Magician, Blue-Eyes…) | Only fan uploads or extracted game files. "A fan upload cannot give rights its uploader does not have" ([junior-3d-world-assets-and-build.md](./junior-3d-world-assets-and-build.md) §2.3). No legitimate source was found. | Large: each model has its own textures and cannot merge with the kit. | **No.** |
| T2 | **Official card artwork on a flat panel in the scene** (a "billboard") | YGOPRODeck images, self-hosted (§3.3). | Small: a `Sprite` is "a plane that always faces towards the camera" (<https://threejs.org/docs/pages/Sprite.html>); one small JPEG per island. | Technically trivial. Legally the same question as any use of card art (§4.2). A full card image also carries English text, against the "no words in the scene" rule. |
| T3 | **Official artwork in the HTML around the scene** (a portrait beside the island title) | Same as T2. | Same. | Same legal question; no scene work at all. |
| T4 | **Original mentors in 3D: KayKit characters** | CC0, already the world's art family. Five adventurers, plus the Skeletons pack for the rival's side (second note, §1.2). | The trimmed character file of §2.3, reused with `SkeletonUtils.clone` (§2.2). One standing figure per visible island; only the focused island's mentor needs to animate. | **Recommended.** Same look as the islands, no rights question. They are generic fantasy figures, not look-alikes of anyone. |
| T5 | **Monsters as the app's own cards, standing in the scene** | Code geometry: the card shape of option E in §1.2, larger, on the island's duel mat, with the card's emoji drawn on it from a canvas texture. | A few triangles and one small texture each. | **Recommended** for the scene. The emoji is drawn by the device's font, so it differs between devices, as it already does on the cards (ours). |
| T6 | **Mentor and monster in HTML** | The existing `CardFace`, and a mentor shown as a name, an emoji or small original drawing, and a speech bubble. | None. | **Recommended first step.** It is where the mentor can actually speak, in three languages. Pairs with option D of §1.2. |
| T7 | **Original monsters as 3D models** (commissioned or AI-generated) | An artist, or a paid AI plan checked model by model (second note, §4). | Each has its own textures. | Later, and only for a few landmark creatures. |

### 4.2 Intellectual property: what the first-party sources say

Three different things are in the owner's sentence. The sources treat them differently, so they are kept apart
here.

**(a) What the app does today: real card names, numbers and card text, with its own pictures.**

- The app says so itself: "Some are original examples; others use the name and text of a real Yu-Gi-Oh! card",
  and "Duel Academy is not affiliated with or endorsed by Konami. Yu-Gi-Oh! is a trademark of Konami."
  (`site-footer.tsx:44-45`).
- No published Konami text was found that grants this either. The terms quoted below reserve "text" along with
  everything else. This is the position the project already took; this note does not change it. The second note
  already advised asking a lawyer if the academy becomes a paid product (its §8, decision 9).

**(b) Official card artwork** (the picture of Dark Magician or Blue-Eyes White Dragon as printed on the card).

- Konami Digital Entertainment, Inc., website Terms of Use, "Last Updated and Effective: June 1, 2024"
  (<https://legal.konami.com/kdeus/btob/terms/tou/en/>, fetched today):
  - "These Terms of Use permit you to use the Websites for your personal, non-commercial use only."
  - "All content on the Websites (e.g. pictures, illustrations, designs of characters, animations, text, music…)
    is owned or controlled by Konami or its licensors".
  - "Any secondary or derivative uses of the Websites and/or their content (including, but not limited to,
    reproduction, …) without our prior written permission are prohibited."
  - "All rights not expressly granted are reserved by Konami and/or its licensors."
  - On marks, naming "KONAMI" among them: "You must not use such marks without our prior written permission."
  - The page does not mention fan content, fan sites or educational use.
- The terms of Konami's card database forbid collecting its material and creating "a database by systematically
  downloading and storing Materials" ([card-data-yugioh-riftbound.md](./card-data-yugioh-riftbound.md) §A1, read
  on 2026-09-11, not re-read today).
- YGOPRODeck, the image source the duel app uses, states that the card images are "copyright 4K Media Inc, a
  subsidiary of Konami Digital Entertainment, Inc." and that it is not affiliated (§3.3). It does not and cannot
  grant a licence.
- **No fan-content policy was found, again.** A search limited to Konami's own domains returned the Community
  Code of Conduct and tournament policies, whose "Fan Content Area" is about filming at events. The two earlier
  notes found the same ([kids-interactive-academy.md](./kids-interactive-academy.md) §8.1;
  [junior-3d-world-assets-and-build.md](./junior-3d-world-assets-and-build.md) §2.2).
- **Plainly:** the sources found give no permission to show card artwork on a website, and reserve it. They also
  do not say what Konami does in practice about the many fan sites that show card images; that was not
  researched and cannot be read from terms.

**(c) The anime and manga characters** (Yugi, Kaiba, Solomon Muto "Grandpa", Jaden and the others): names and
likenesses.

- These are a separate property with other rights holders. The official anime site prints, per series:
  "©1996 Kazuki Takahashi"; for GX "©1996 Kazuki Takahashi ©2004 NAS • TV TOKYO"; for the recent series "©2020
  Studio Dice/SHUEISHA, TV TOKYO, KONAMI" (<https://www.yugioh.com/news/terms-of-use>, fetched today). Konami's
  card database carries the line "©2020 Studio Dice/SHUEISHA, TV TOKYO, KONAMI" as well
  (<https://www.db.yugioh-card.com/>, a search page fetched today).
- That site's operator: "This Website is owned by Konami Cross Media NY, Inc.", terms "posted on June 7, 2019".
  Its content is defined to include "characters, stories, ideas, graphics, illustrations, data, text, artwork,
  images, marks". "No Content, in whole or in part, may be copied, reproduced, republished, uploaded, posted,
  transmitted, distributed"; the prohibition names "creating montages, wallpaper, merchandise, video mash-ups,
  even if you provide these for free." "You cannot use any Trademarks for any reason without obtaining the prior
  written permission of KCM."
- Who to ask: "Konami Cross Media NY, Inc. is responsible for brand management, licensing, and marketing of the
  Yu-Gi-Oh! brand" and for "production and distribution of the Yu-Gi-Oh! series outside of Asia"
  (<https://www.yugioh.com/licensing>, fetched today). The page shows a Licensing link and a Contact link; no
  licence terms or prices are on it.
- **Plainly:** the sources found reserve the characters and give no permission to use them. A drawn look-alike
  of Yugi is a use of the character's design, and a 3D figure or a card-art panel of him is too. The sources do
  not say whether writing a character's **name** alone ("Yugi's favourite card") is treated differently from
  showing him; that is a legal question this note does not answer.
- A difference from (a) worth noticing **(ours)**: card names are facts the app must use to teach the real game.
  Anime characters are not needed to teach any rule. Adding them is a choice to use the brand's story, and it
  makes a children's site look like an official product, which the footer says it is not.

**(d) Original characters and creatures inspired by the game's ideas.**

- A wise shopkeeper, a proud rival, a hero in a cape, a white dragon as a kind of creature: none of the sources
  above speaks about ideas of this kind. Assets from a CC0 pack carry no third-party rights (second note, §2.3).
- The line the earlier note drew still seems the right one **(ours)**: new designs, "no look-alikes"
  ([kids-interactive-academy.md](./kids-interactive-academy.md) §8.1). A mentor with tri-coloured spiky hair and
  a pyramid pendant is a look-alike. So is the real card back, and so are the Millennium items.

### 4.3 A proposed mapping

World ids, titles and level counts are from the code (`src/lib/junior/play/levels.ts:8`; `copy-en.ts:78-95`;
counts by matching `world: "…"` in `levels.ts`, total 79). "In the app" means the card is already in `cards.ts`.

**Which anime character goes with which card or Summon type is from general knowledge of the series, not checked
at a primary source today (§7).** The owner knows the series and should correct it.

**Version 1: the owner's wish** (needs permission, §4.2 b and c). One trainer per island where there is a natural
fit; the Extra Deck islands follow the lead characters of the later series, which is where "heroes" fits.

| # | World | Levels | Trainer | Signature monster |
| --- | --- | --- | --- | --- |
| 1 | `wake` The Deck wakes up | 5 | Solomon Muto (Grandpa), in his game shop: the first guide | Kuriboh (in the app, `cards.ts:167`) |
| 2 | `shield` Shield or sword | 5 | Joey Wheeler | Giant Soldier of Stone, 2000 DEF (in the app, `cards.ts:155`) |
| 3 | `friend` Call a friend | 8 | Yugi Muto | Dark Magician: the world already has the level `w3-magician` (`levels.ts:115`) |
| 4 | `magic` Spells and Traps | 4 | Mai Valentine or Téa Gardner | Dark Magician Girl (not in the app) |
| 5 | `puzzles` Win this turn | 10 | Grandpa again, as the puzzle master | none: ten boards |
| 6 | `tower` Turtle tower | 2 | none | none: keep the turtle |
| 7 | `rival` The rival's challenge | 1 | Seto Kaiba | Blue-Eyes White Dragon (in the app, `cards.ts:171`) |
| 8 | `reading` Read the card | 9 | Maximillion Pegasus | none, or Monster Reborn as the card to read (in the app, `cards.ts:143`) |
| 9 | `mat` The whole mat | 7 | none | none: the mat itself is the subject |
| 10 | `ritual` The Ritual | 3 | Yugi Muto | Black Luster Soldier (in the app, `cards.ts:149`) |
| 11 | `fusion` Fusion | 3 | Jaden Yuki | an Elemental HERO Fusion Monster (not in the app; the app's Fusion levels use Flame Swordsman, `cards.ts:153`) |
| 12 | `synchro` Synchro | 3 | Yusei Fudo | Stardust Dragon (not in the app; the app uses Gaia Knight, `cards.ts:156`) |
| 13 | `xyz` Xyz | 4 | Yuma Tsukumo | Utopia (in the app, `cards.ts:158`) |
| 14 | `link` Link | 3 | Playmaker | Decode Talker (not in the app; the app uses Lanphorhynchus, `cards.ts:159`) |
| 15 | `pendulum` Pendulum | 3 | Yuya Sakaki | an Odd-Eyes dragon (not in the app; the app uses Flash Knight, Dragong, Mandragon, `cards.ts:160-162`) |
| 16 | `words` Every word counts | 5 | none | Kuriboh (level `rd-kuriboh`, `levels.ts:218`) or Cyber Dragon (`levels.ts:217`) |
| 17 | `legends` Legends | 3 | Grandpa | Exodia the Forbidden One and Blue-Eyes Ultimate Dragon (in the app, `cards.ts:172-177`; levels at `levels.ts:221-223`) |
| 18 | `final` The Extra Deck duel | 1 | Yugi and Kaiba watching | the child's own Extra Deck |

Two conflicts with the course as written:

- **The rival is Nox**, the app's own character (`copy-en.ts:70`, `:84`, `:95`). Kaiba on island 7 either replaces
  Nox in every level text, or stands beside him. Replacing means rewriting copy in three languages.
- **Four islands teach with cards that are not the famous one** (Fusion, Synchro, Link, Pendulum). Showing
  Stardust Dragon on an island whose levels use Gaia Knight promises a card the child never plays. Either the
  island shows the card the levels use, or new levels are written.

**Version 2: the fallback, with nothing that needs permission beyond what the app already uses.** Original
mentors from the KayKit characters, with our own names; monsters shown as the app's own drawn cards (T5, T6),
real names where the app already uses them.

| # | World | Mentor (original; KayKit model) | Island card (the app's own `CardFace`) |
| --- | --- | --- | --- |
| 1 | `wake` | The old shopkeeper: Mage, no weapon. The guide who speaks first and comes back on islands 5 and 17. | Pocket Cub, the child's first card (`cards.ts:116`, level `w1-field`) |
| 2 | `shield` | The guard: Knight with a shield | Giant Soldier of Stone, or Moss Beetle |
| 3 | `friend` | The young duelist: Rogue, in the island's green | Dark Magician |
| 4 | `magic` | The shopkeeper's apprentice: Mage with a spell book | Thunder Clap and Sticky Vine (a Spell and a Trap) |
| 5 | `puzzles` | The shopkeeper | none |
| 6 | `tower` | none | the turtle tower |
| 7 | `rival` | **Nox**, as now: a KayKit Skeleton, or a Knight in red | Blue-Eyes White Dragon, as Nox's ace, if the duel is rewritten to use it; else his current cards |
| 8 | `reading` | The scholar: Rogue_Hooded | Monster Reborn |
| 9 | `mat` | none | the mat |
| 10 | `ritual` | The young duelist | Black Luster Soldier |
| 11 | `fusion` | The hero in training: Barbarian, in blue | Flame Swordsman |
| 12 | `synchro` | The mechanic: Rogue | Gaia Knight |
| 13 | `xyz` | The dreamer: Knight, in yellow | Utopia |
| 14 | `link` | The masked one: Rogue_Hooded | Lanphorhynchus |
| 15 | `pendulum` | The showman: Mage, in red | Flash Knight |
| 16 | `words` | The scholar | Kuriboh |
| 17 | `legends` | The shopkeeper, with his oldest cards | Exodia the Forbidden One, Blue-Eyes Ultimate Dragon |
| 18 | `final` | Nox, and every mentor met so far standing around the arena | the child's Extra Deck |

Notes **(ours)**:

- Five free models cannot give thirteen different faces. Tell mentors apart by the island colour (the kit's
  blue, green, red and yellow, `themes.ts:3`) and by what they hold; each character's texture is a 14 to 17 KB
  image (file tree, §2.3), so a recoloured copy should be cheap, though recolouring was not tried. Fewer mentors who come back (a guide, a young duelist, a scholar, the rival) is a
  better story than eighteen strangers, and less copy to translate.
- The mentor's lines are the real work: one greeting and one line per finished island, in English, French and
  Hebrew. Hebrew keeps the English card names, as the cards already do (`level-player.tsx:439`).
- Version 2 is not a dead end for version 1. If permission comes, a mentor is one entry in a table: the model or
  picture changes, the code does not.

### 4.4 Recommendation (ours)

1. **Build version 2.** Start with the HTML form (T6): the guide's line on the first island and the island card
   beside each island title. Then the 3D mentors (T4) and standing cards (T5) with the character work.
2. **If the named characters matter to the owner, ask.** The licensing contact is Konami Cross Media NY for the
   characters and brand (§4.2 c). Until an answer or a lawyer's advice, keep official artwork and anime
   characters out of the academy.
3. **Do not use fan-made 3D models of the characters or monsters** in any case (T1).

---

## 5. Prioritised recommendation (ours)

Effort is a rough estimate for an AI coding agent with the owner reviewing screenshots. Nothing was built.

| Order | Step | Effort | Why here |
| --- | --- | --- | --- |
| 1 | **Say what the map is for**: a visible tagline, the island's rules under its title, the guide's welcome line, the island card as HTML (§1.2 A, B, D, G). | 1 to 2 days | Answers remark 1 with text that already exists. No 3D work, no risk. |
| 2 | **The card reward moment and the binder button** (§3.2 R1, R4). | 2 to 3 days | Answers remark 3 with no new stored data. Also makes cards visible on the first screen. |
| 3 | **The walking character** (§2.5): trim one KayKit adventurer in the build script, walk the existing `walk` path on tap, cheer after a win. Try it on a cheap tablet. | 3 to 5 days | Answers remark 2. Needs the tablet test the earlier notes still wait for. |
| 4 | **Card shapes in the scene**: stops as cards, a duel mat per island, the island card standing on it, the earned card on a finished island (§1.2 E, F; §3.2 R2, R3). | 2 to 4 days | Same scene file as step 3. |
| 5 | **Original mentors in 3D** on each island, with their lines in three languages (§4.3 version 2). | 3 to 5 days, mostly copy | Answers remark 4 without waiting for anyone's permission. |
| 6 | **Named characters and official artwork** (§4.3 version 1). | Not a coding task | Only after written permission or legal advice. |

---

## 6. Open questions for the owner

1. **Trainers: is version 2 (original mentors) acceptable**, or are Yugi, Kaiba and Grandpa by name essential?
   If essential, are you willing to write to Konami Cross Media NY, or to ask a lawyer, before they appear?
2. **Card pictures: stay with the app's own drawn cards** (the footer's promise), or do you want real card art?
   Real art is the same permission question, and the footer text would have to change.
3. **Is the academy commercial in any way**, now or planned? This question is still open from three earlier notes
   and weighs on every point of §4.2.
4. **Nox or Kaiba** on the rival island? Replacing Nox means rewriting level texts in three languages.
5. **Extra Deck islands:** show the card the levels really use (Flame Swordsman, Gaia Knight, Lanphorhynchus,
   Flash Knight), or write new levels around the famous ones (an Elemental HERO, Stardust Dragon, Decode Talker,
   an Odd-Eyes)?
6. **Which character is the child?** One fixed adventurer, or a choice of five? A choice is the first thing that
   needs saving outside the play record.
7. **Should a level open at once on tap, or after the character has walked there** (at most about 1.5 seconds)?
8. **Should a card count as earned after a hinted solve**, as the album does today, or only after a solve without
   a hint?
9. **How many mentors?** Three or four who come back, or one per island?
10. **The mapping in §4.3:** please correct the character and card pairings; they were written from memory of
    the series.
11. **A test device.** Which cheap tablet or phone is the reference? Still open from the earlier notes.

---

## 7. Unverified / could not confirm

- **Nothing was built or run.** No character was loaded, no walk animated, no screenshot taken. All effort
  figures, the performance budget, the 1.5 second cap and the trimmed character size (0.3 to 0.5 MB) are ours.
- **The KayKit character file.** Only `Knight.glb` was downloaded and measured; the other four are assumed
  alike from their file sizes. What the 15 meshes are (body parts or accessories) was not read. The keyframe
  byte counts were summed from the file's accessor table; the sum over all 76 clips (1.34 MB) does not account
  for the whole 3.66 MB file, so the split of the remainder was not established. The trimming was not tried with
  glTF Transform. Only the root `LICENSE.txt` of the repository was read.
- **Skinned animation on the 15-frames-a-second idle ticker** may look choppy; not seen.
- **React Three Fiber and touch.** The events page does not mention touch by name. That taps work on phones is
  inferred from pointer events and from the existing stop taps, which were only tried in desktop Chrome
  (`docs/open-questions/2026-11-19-02h30.md` item 5).
- **Konami.** No fan-content policy was found on Konami's domains; that is not proof none exists in another
  language or region. The terms quoted are the United States website terms and the anime site's terms; they
  govern the use of those websites, and are quoted as Konami's stated position, not as a ruling on a fan site.
  Quotations were returned by a fetch tool that shortens long sentences; the ellipses mark its cuts, and the
  full sentences should be read at the source before relying on them. How Konami treats fan sites in practice
  was not researched. Whether character names are registered trademarks was not checked. Whether showing a
  character's name without a picture is treated differently was not established. The card database terms were
  not re-read today.
- **Rights holders of the anime characters.** Read from the copyright lines on yugioh.com and the card
  database only. Which company can grant what, in which country, was not established. The licensing page was
  reached and names Konami Cross Media NY; its Licensing sub-page was not opened.
- **YGOPRODeck.** No terms-of-service page beyond the API guide was found (as on 2026-09-11). "4K Media Inc" is
  YGOPRODeck's wording for the rights holder; the anime site names "Konami Cross Media NY, Inc.". Whether these
  are the same company under an old and a new name was not checked.
- **The character-to-card pairings in §4.3** (Joey and Flame Swordsman, Jaden and Elemental HERO, Yusei and
  Stardust Dragon, Yuma and Utopia, Playmaker and Decode Talker, Yuya and Odd-Eyes, Grandpa and Exodia, the
  spellings of the names) are from general knowledge of the series. Only "Elemental HERO" was checked today as a
  real card name family in Konami's card database. Dark Magician Girl, Stardust Dragon, Decode Talker and the
  Odd-Eyes cards were not looked up.
- **Emoji drawn on a canvas texture** for the standing cards was not tried; how it looks on each device's emoji
  font is unknown.
- **The cue system** (`src/lib/junior/play/cues.ts`) was being edited by another session and was not read in
  full; that a card flip fits as one more cue is an assumption.
- **`level-player.tsx` and `mini-board.tsx`** were read in part. Line numbers are from today's uncommitted files
  and will move.
- **Level counts** come from a text match on `levels.ts`, not from importing the module.

---

## Appendix: primary sources consulted (all accessed 2026-11-19)

- **three.js docs:** `AnimationMixer`, `AnimationAction`, `SkeletonUtils` module, `Sprite`.
- **React Three Fiber docs:** "Events", "Performance pitfalls".
- **W3C:** Understanding WCAG 2.2, SC 2.5.7 Dragging Movements.
- **KayKit (Kay Lousberg):** GitHub file tree and root `LICENSE.txt` of
  `KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0`; `Characters/gltf/Knight.glb` (measured in a
  temporary folder outside the repo, then deleted).
- **Konami:** website Terms of Use at `legal.konami.com/kdeus/btob/terms/tou/en/`; yugioh.com "Terms of Use"
  (Konami Cross Media NY) and `/licensing`; one card search page of `db.yugioh-card.com` (card names and
  copyright line); one web search limited to `konami.com`, `yugioh-card.com`, `yugioh.com` and
  `legal.konami.com`.
- **YGOPRODeck:** API guide.
- **This repository at `8a528d2` (working tree):** `apps/academy-ygo/package.json`,
  `scripts/world/build-kit.mjs`, `public/world/`, `src/app/page.tsx`, `src/app/layout.tsx` (by search),
  `src/lib/brand.ts`, `src/components/site-header.tsx`, `site-footer.tsx`,
  `src/components/junior/world/island-world.tsx`, `world-scene.tsx`,
  `src/lib/junior/world/world.ts`, `themes.ts`, `status.ts`, `copy.ts`, `kit-pieces.json`,
  `src/components/junior/play/junior-play.tsx`, `level-player.tsx` and `mini-board.tsx` (in part),
  `src/lib/junior/play/progress.ts`, `cards.ts`, `levels.ts` (in part), `copy-en.ts` (by search);
  `apps/duel-nextjs/CONTEXT.md` and `scripts/mirror-images.ts` (by search); `CONTEXT-MAP.md` (the academy has no
  `CONTEXT.md`); `docs/academy-junior-world.md`, `docs/open-questions/2026-11-19-02h30.md`, and the research
  notes named at the top.
