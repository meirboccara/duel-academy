# Academy: the Junior island world

The home page of the academy (`/`) is a title screen with three saves, then Junior play, with a 3D island world on top. There is one island per Junior world
(18) and one stop per level. The child taps an island and a small boat sails there; taps the glowing stop, or the big
"Play" button, and the level starts.

## Where things are

| What | Where |
| --- | --- |
| The world as data: islands, roads, stops, boat routes | `apps/academy-ygo/src/lib/junior/world/world.ts` (+ `hex.ts`, `roads.ts`, `themes.ts`) |
| Locked / open / done islands, and each stop's mark | `apps/academy-ygo/src/lib/junior/world/status.ts` |
| Words around the scene (en, fr, he) | `apps/academy-ygo/src/lib/junior/world/copy.ts` |
| The HTML around the scene: island name, arrows, stop buttons, Play | `apps/academy-ygo/src/components/junior/world/island-world.tsx` |
| The 3D scene (three.js through React Three Fiber) | `apps/academy-ygo/src/components/junior/world/world-scene.tsx` |
| The model file | `apps/academy-ygo/public/world/kit.glb`, built by `pnpm --filter academy-ygo world:kit` |

## Rules the scene keeps

- **The map is the page.** It fills the screen under the header, on phones too (upright or on their side); the
  camera steps back on a narrow screen so the island fits across it. Below it there are only the rules met so far,
  the card album and the quiz link. There is no list of levels and no second Play button: every level is reachable
  from the map. The sound switch sits in the map's top corner.
- **No words inside the scene.** Every action is also a real button in the HTML around it, and the canvas is hidden
  from screen readers.
- **No 3D, no problem.** Without WebGL, after an error, or after a lost graphics context, the world disappears and
  the page shows the list of worlds and levels instead.
- **Motion** follows the device's "reduce motion" setting: with it, the boat jumps instead of sailing and the idle
  motion stops. There is no calm button any more; an old saved calm choice is ignored.
- **The child walks the figure.** On an open island the camera sits close on the chosen character and follows it.
  A tap on the island walks it along roads and free land (never into water, buildings or trees; logic in
  `src/lib/junior/world/walk-graph.ts`, framing in `camera.ts`); arrows or WASD do the same on a computer. A tap on
  a glowing stop walks there, then opens the level. Walking is play, not a control, so it has no HTML twin: every
  level still opens from the stop buttons and the Play button. The camera zooms out for a sail and on a sleeping
  island, and cuts instead of gliding under "reduce motion". Where the figure stands is not saved.
- **Frames on demand.** The scene draws during a trip, and about 15 times a second for the idle motion only while
  motion is allowed and the world is on screen.
- **No Konami creature or character is modelled in 3D.** Islands are told apart by landscape and colour. Official
  card art appears only as a texture on a card-shaped panel standing on each open island (its signature card); the
  anime characters appear only as the trainers in the HTML around the map.

## The title screen, the saves and the trainers

- **Title screen** (`src/components/junior/home/junior-home.tsx`, words in `src/lib/junior/home/copy.ts`): New game,
  Continue, and three save slots, one per child on a shared device. New game asks for a character (Knight, Mage or
  Rogue, as still pictures) and an optional nickname, then opens the map. Back, or the round "change player" button
  on the map, returns to the title screen. The server renders three neutral places; the saves fill in after
  hydration.
- **Saves** (`src/lib/junior/profiles.ts`): slot 1 keeps the play record's original key
  (`academy-ygo:junior:play:v1`), slots 2 and 3 add `:slot-2` / `:slot-3`; the play record code is unchanged. A
  forgiving profile list (`academy-ygo:junior:profiles:v1`) holds nickname, character and dates. A page whose save
  was deleted or replaced in another tab stops saving.
- **Save a copy / load a copy** (`src/lib/junior/save-code.ts`, `components/junior/home/manage-save.tsx`): a
  `DA1.<payload>.<check>` text code per save, because Safari may wipe a site's storage after seven days of use
  without a visit. The gear on a save tile also renames, changes character, deletes (with a confirmation), and shows
  grown-ups how to add the game to the Home Screen (`src/app/manifest.ts`, icons by `scripts/icons/build-icons.mjs`).
- **Trainers** (`src/lib/junior/world/trainers.ts`, `components/junior/play/trainer-talk.tsx`): Yugi, Kaiba, Joey
  and the others greet the child on their island, drawn with their official character art (our own copies in
  `public/trainers/`, made once from yugioh.com by `pnpm --filter academy-ygo trainers:portraits`), and stand on
  their island in 3D as a flat picture. Each has a signature card (Joey with Time Wizard on "Read the card"). A
  finished island gives its signature card to the binder (gold border); nothing new is stored. Six of these cards
  are display-only (`DISPLAY_CARDS`): shown and given, never played.
- **Stars and Grandpa's shop** (`src/lib/junior/world/shop.ts`, `components/junior/play/shop-dialog.tsx`): each
  solved mission gives a star (a real duel, `open` in `levels.ts`, gives two), one more when solved on the first try,
  and each finished island two more. Stars are computed from the solved levels, never stored. They buy cards in Solomon Muto's game shop, **on the first island only** (its building there, the
  shop button in the map's corner while that island is shown, or the button under world 1 in the list), each card
  shown with its price; nothing random is sold. Cards have a **rarity** (Common 4 ★, Rare 7, Super Rare 10, Ultra
  Rare 15, Secret Rare 20): the rarer, the dearer, and the bigger the reward, a brighter frame, a foil from Super
  Rare up (`components/junior/play/rarity-look.tsx`), a card that turns over when bought and a cheer. The shop's second tab, **For your hero**
  (`components/junior/play/hero-shop.tsx`, catalog in `src/lib/junior/world/wardrobe.ts`), sells shirt and cape
  colours, hats and things to hold, all from the KayKit Adventurers pack the figures come from (CC0), worn by any of
  the three figures. What was bought (cards, things) and what the figure wears are stored per save under
  `<play key>:shop` (`{ version: 1, cards, items, wear }`), carried in save codes, merged (never fewer) when a copy is
  loaded, and removed with the save.
- **My hero** (`components/junior/play/hero-room.tsx`): a pause menu in the manner of Ocarina of Time's subscreens,
  from the shirt button on the map at any time. Three pages turned with the arrows at the top or Q / E (a cube turn):
  **Equipment** (nearly full screen: a grid by place, owned things lit, the rest dimmed with their price in Grandpa's
  shop, a gold cursor moved with the arrow keys, Enter to put on or take off, and the figure in 3D on a stand beside
  it, turned by dragging across it or with two buttons, `heading` in `outfit-preview.tsx`), **Cards** (the album)
  and **Quest** (`quest-page.tsx`: the dorm, its leader and God card, stars, islands and missions done). The
  character can be switched here, and from the title screen, only until the first mission is done
  (`characterLocked` in `src/lib/junior/profiles.ts`); after that it is the child's for good.
- **Dorms** (`src/lib/junior/world/dorm.ts`, `components/junior/play/dorm-dialog.tsx`): once island 1 is finished the
  child joins Slifer Red, Ra Yellow or Obelisk Blue. The dorm's leader (Jaden Yuki, Bastion Misawa, Alexis Rhodes)
  then stands on the tower island and gives the dorm's Egyptian God card when it is finished. Stored per save under
  `<play key>:dorm`, carried in save codes, removed with the save.
- **Sideways only on small screens**: a phone or a small tablet (under 768 px wide) held upright shows "Turn your
  screen sideways" over the game (CSS only, `upright-small:` in `globals.css`).
- **The album** (`components/junior/play/album-dialog.tsx`): a round book button under the sound switch on the map
  (and in the list view) opens the card album at any time: cards played with, island rewards (gold ring) and cards
  bought (with their rarity).
- **On-screen controls** (`components/junior/play/move-pad.tsx`, contract in `src/lib/junior/world/controls.ts`): a
  direction pad on the left and one action button on the right, on every screen. On a phone they sit above the
  trainer's words (56 px arrows); on a tablet (wide and not a phone on its side) in the bottom corners under the
  thumbs (76 px arrows, a 112 px action button), with the stops and Play button kept in the middle. The action
  button changes with the figure's place: get on the boat, go ashore, play this level, open the shop. **A level never
  opens by walking onto its stop**: the action button (or E / Enter / Space) opens it; the HTML stop buttons and the
  big Play button still open it directly. The boat can be boarded at the dock and steered to another island. The
  previous / next island arrows sit beside the island's number.
- **The player's figure**: the chosen KayKit adventurer (`public/world/hero-*.glb`, built by
  `pnpm --filter academy-ygo world:heroes`, stills by `scripts/world/render-hero-stills.mjs`) rides the boat and
  walks to the last solved stop; after a solve it walks onto the next stop. Licence:
  `public/world/KAYKIT-ADVENTURERS-LICENSE.txt` (CC0).

## The models

The pieces come from KayKit's *Medieval Hexagon Pack 1.0* by Kay Lousberg, CC0 (public domain; credit not required).
The build script downloads them from GitHub at a fixed commit into `apps/academy-ygo/.cache/` (ignored by git), puts the
74 pieces used into one file with one shared 16 KB texture, and compresses it with Meshopt: about 0.97 MB, 0.5 MB
gzip. The pack's licence is copied next to it as `public/world/KAYKIT-LICENSE.txt`. Change the list of pieces in
`src/lib/junior/world/kit-pieces.json`, then run the script again.

Islands are generated from the course (`levelsOf`), so adding a level adds a stop. `world.test.ts` checks the
islands: every stop on the road, roads that join, one thing per hex, no boat route over land, the same world on
every visit.

Research behind this: `docs/research/junior-3d-island-world.md`, `docs/research/junior-3d-world-assets-and-build.md`.
