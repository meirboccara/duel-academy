# Academy Junior: three save slots, a character choice, official artwork, real monsters, and trainers with their signature cards

> **Date of observation:** 2026-11-19. Every web page, API answer and repository file cited below was fetched
> that day. The repository was read on `main` at HEAD `8a528d2`, with the island world still uncommitted and other
> sessions editing the tree; code claims describe the files as they stood that day, and line numbers may move.
> **Nature of this document:** a research note written to be implemented from. **Nothing was built or run.** No
> code was changed, nothing was installed, tested or published, and no card image or model was put in the repo.
> The only file added is this one.
>
> **The owner's feedback this note answers (verbatim):**
>
> 1. "Should add also a landing screen with new game and continue with 3 saves maximum. Saves will be like
>    different profile for different children."
> 2. "You can use official artwork."
> 3. On the character-to-card pairings: "this is nice, joey time wizard for example."
> 4. "Could be nice when starting a game, can choose a character. Have a choice of 3 different character also
>    save."
>
> **Sourcing rule used:** each external claim is followed by the page that owns it. Claims about this repo cite
> `file:line`; paths are relative to `apps/academy-ygo/` unless they start with `docs/` or `apps/`. Figures
> marked **[measured]** were obtained that day as described next to them. Proposals, estimates and inferences are
> labelled **(ours)**. Web quotations were returned by a fetch tool that shortens long passages; where it cut or
> paraphrased, the text says so. What could not be confirmed at a primary source is listed in
> [§10](#10-unverified--could-not-confirm). **This is not legal advice.**
>
> **Relation to existing notes.** This is the follow-up to
> [junior-world-identity-avatar-rewards-trainers.md](./junior-world-identity-avatar-rewards-trainers.md) ("the
> previous note"). It does not repeat that note's findings on the map's wording, the walking mechanics or the
> reward options; it says what the new decisions change. Child profiles on one device were first sketched in
> [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §4.2 ("the
> login note"); the landing decision is in
> [academy-junior-only-landing.md](./academy-junior-only-landing.md) ("the landing note").

---

## 0. Decisions

### 0.1 Decided by the owner

| # | Decision | Owner's words |
| --- | --- | --- |
| D1 | A landing screen with New Game and Continue, three saves at most, one per child. | "landing screen with new game and continue with 3 saves maximum" |
| D2 | Official card artwork is used. | "You can use official artwork." |
| D3 | "Official artwork" also covers the anime characters. **The island trainers are the named characters** (Yugi, Kaiba, Grandpa, Joey and the others), not original mentors. | relayed by the coordinating session |
| D4 | At New Game the child chooses between **three original adventurer avatars** (the CC0 KayKit characters), not anime characters. The choice is saved. | "choice of 3 different character also save"; scope relayed |
| D5 | Iconic pairings such as Joey with Time Wizard. | "this is nice, joey time wizard for example." |
| D6 | **Devices:** Safari on iPad and iPhone first, Chrome on a computer second. | "Ipad, iphone safari, could be also computer chrome." |
| D7 | **A nickname** on each save. | "Yes go for nickname" |
| D8 | **Trainer faces are commissioned drawings.** Until they exist, a name plate with the signature card's art stands in. | "comissionned drawing" |
| D9 | **The original emoji monsters become real Normal Monsters**, where it can be done well. | "real normal monsters if you arrive to do it well" |
| D10 | **The academy is not commercial.** The repository may be made public if that helps. | "No commercial. Can make it this app repo public if it helps something." |

### 0.2 Assumed from a short answer: please confirm

| # | Question that was asked | Answer | Assumption used in this note |
| --- | --- | --- | --- |
| A1 | Nickname: how? | "Yes go for nickname" | A **typed** nickname, **optional**, with a default name when left empty (§2.4). |
| A2 | Three slots full: "let the child pick a save to replace and confirm, or hide deletion behind a grown-up step?" | "yes" | **The child picks a save to replace, then confirms.** No grown-up step (§2.5). |
| A3 | Signature cards the levels do not use: "shown by the trainer only, given as a reward, or a new level each?" | "yes" | **Shown by the trainer and given as the island's reward card in the binder.** A new level per card is optional later work (§7.5). |

### 0.3 Defaults chosen where the owner has not answered ("default, change if wanted")

| # | Topic | Default |
| --- | --- | --- |
| F1 | Read-aloud sound: per child or per device | **Per child**, as it is stored today inside the play record (`src/lib/junior/play/progress.ts:25-26`). No change. |
| F2 | The three avatars | **Knight, Mage, Rogue**, without weapons (§4.2). Not yet seen rendered. |
| F3 | Footer wording | The text in §5.6. |
| F4 | Nox or Kaiba on the rival island | **Both.** Kaiba is the island's trainer; the duel is still against Nox, so no level text is rewritten. With D9, Nox's monsters become Kaiba's own cards (Battle Ox, Judge Man, Saggi the Dark Clown), which ties the two together (§6.2). |
| F5 | The trainer mapping | The table in §7.4 as it stands. |
| F6 | Characters' names in French and Hebrew | **As spelled on the official anime site, in Latin letters, in all three languages.** Same rule as the card names in Hebrew. |
| F7 | Cards with several pictures | **The first picture the source lists**, whose picture id equals the card id. The picture id is written in the art list, so it can be changed per card. |
| F8 | Repository visibility | **Stay private** (§5.7). |

---

## 1. Short answers

| # | Point | Answer |
| --- | --- | --- |
| A | Landing with New Game / Continue and 3 saves | One play record per slot, each under its own key; **slot 1 is today's key**, so no progress moves. A small second record lists the profiles (nickname, character, dates). The landing is a title screen in front of the map on `/`. |
| B | Saves on iPad and iPhone | Safari deletes script-written storage after seven days of Safari use without a visit. So three things are part of the feature, not extras: a persistence request, an **export / import code per save**, and **Add to Home Screen**. |
| C | Choose one of 3 characters | Knight, Mage, Rogue from the CC0 KayKit *Adventurers* pack. Each published file is about 3.6 MB with 76 animations; each is trimmed in the build script and only the chosen one is loaded. The choice screen shows still pictures. |
| D | Official card art | A build script downloads each card's cropped art once from YGOPRODeck, resizes it and stores our own copy, as YGOPRODeck's guide requires. The art goes inside the app's own card frame, so French and Hebrew text stay as they are. One footer sentence, its two translations, a few code comments and three docs still promise "never real card art" and change together. |
| E | Real Normal Monsters for the original cards | **Yes, it can be done well for the 14 plain monsters.** 7 have a real twin with the same Level, ATK and DEF; 6 more keep every level working with no number changed; 1 needs a single level edited. The other 11 original cards are Spells, Traps and Effect Monsters with invented effects; they stay (§6). |
| F | Trainers | Commissioned portraits are the target; a brief for the artist is in §7.3. Until then: a name plate, a line of speech and the signature card's art. |
| G | Trainer and signature card | Table in §7.4. Joey Wheeler takes the "Read the card" island with **Time Wizard**, whose printed text starts "Once per turn:", the rule that island teaches. 13 of the 15 trainer-and-card pairings are confirmed on the official anime site's own card pages; Playmaker + Decode Talker and Yuya + Odd-Eyes Pendulum Dragon are not. |

The step-by-step plan is §8.

---

## 2. The title screen and three save slots

### 2.1 How progress is stored today

| Fact | Where |
| --- | --- |
| One record in `window.localStorage`, key `academy-ygo:junior:play:v1`. | `src/lib/junior/play/progress.ts:10`; storage picked at `src/components/junior/play/junior-play.tsx:17-23` |
| Shape: `{ version: 1, levels: { [levelId]: { clean, firstTry } }, slips: { [rule]: count }, calm, sound }`. | `progress.ts:13-27` |
| The parser is strict: any unknown version, a missing field or an unknown level id makes the whole record "not writable", and the app then stops saving. | `progress.ts:55-74`, `:87`, `:95` |
| Every save first re-reads the stored record and merges: a solved level never goes back, slip counts take the larger value. | `progress.ts:45-52`, `:93-103` |
| The key is a module constant used inside `loadPlayProgress` and `savePlayProgress`; the functions take the storage as an argument but not the key. The storage type has only `getItem` and `setItem`. | `progress.ts:28`, `:81-98` |
| The page listens for another tab's change on that one key. | `junior-play.tsx:72-80` |
| **Nothing else about the player is stored.** The album is computed from solved levels. | `progress.ts:129-139` |
| The island shown on the map is computed from progress, then held in component state only. | `src/lib/junior/world/status.ts:21-24`; `src/components/junior/world/island-world.tsx:66-67` |
| No storage access in the cue system, the sound module or the 3D scene (searched for `storage`: no match). | `src/lib/junior/play/cues.ts`, `sound.ts`, `src/components/junior/world/world-scene.tsx` |
| `sound` lives inside the play record. `calm` is still stored but ignored. | `progress.ts:25-26`; `junior-play.tsx:39-43`, `:104-107` |
| The language is one device-wide key, `duel-academy-language`. | `src/lib/i18n/locales.ts:4` |
| The older quiz has its own single record, `academy-ygo:junior:mission1:v1`. It stays shared by all children. | `src/lib/junior/progress.ts:4` |
| Tests pin the key name and write to it directly. | `src/lib/junior/play/progress.test.ts:101`; `junior-play.test.tsx:36`, `:50`, `:415`, `:429`; `junior-mat.test.tsx:35`; `junior-play-world.test.tsx:56` |

The single-player assumptions are few: one key, one storage listener. The album, the map position and the island
states need no change, because they are derived from whichever record is loaded.

### 2.2 Storage design

**One key per slot, plus one profile list.** The alternative, one document holding all three saves, was
rejected **(ours)**: it needs a migration, a damaged write would hurt all three children, an old cached page
would keep writing the old key, and the tested merge would have to be rewritten.

| Record | Key | Parsed |
| --- | --- | --- |
| Slot 1 play record | `academy-ygo:junior:play:v1` (today's key, unchanged) | Strictly, by the existing code |
| Slot 2 play record | `academy-ygo:junior:play:v1:slot-2` | Same code |
| Slot 3 play record | `academy-ygo:junior:play:v1:slot-3` | Same code |
| Profile list | `academy-ygo:junior:profiles:v1` | Forgivingly: unknown fields ignored, bad entries dropped |

The profile list:

```ts
interface Profiles {
  version: 1;
  /** Index 0 is slot 1. Null means the slot is empty. */
  slots: [Profile | null, Profile | null, Profile | null];
  /** The slot opened last (1, 2 or 3), for "Continue". */
  last: 1 | 2 | 3 | null;
}
interface Profile {
  /** Typed nickname, already cleaned (§2.4). Empty string means "use the default name". */
  name: string;
  avatar: "knight" | "mage" | "rogue";
  /** ISO date-time. Also identifies this save: a slot that is deleted and re-created gets a new value. */
  createdAt: string;
  /** ISO date-time of the last time the slot was opened. */
  playedAt: string;
}
```

Rules **(ours)**:

- **Slot 1 keeps today's key.** No copy and no migration step. A device that has today's key but no entry for
  slot 1 shows slot 1 as an existing save with the default name and the first avatar, and offers the character
  choice the first time it is opened.
- **`progress.ts` does not change.** The new code hands it a storage wrapper that maps the fixed key to the
  slot's key: `{ getItem: () => storage.getItem(slotKey), setItem: (_key, value) => storage.setItem(slotKey, value) }`.
  Adding a key parameter to the two functions is the other way; the wrapper touches no tested file.
- **No field is added to the play record.** A build that adds one makes every older cached page treat the record
  as unknown and stop saving (`progress.ts:58`, `:87`). Nickname, avatar and dates live in the profile list.
- **Sound stays in the play record**, so it is per child (default F1).
- **Unknown `avatar` falls back to `"knight"`**; a missing or broken profile list is treated as empty and
  rebuilt on the next write. The list never blocks play.
- **Deleting a slot** removes its play key and sets its entry to null. For slot 1 that means removing today's
  key, which needs `removeItem`; the new module uses the full `Storage` type, not `PlayStorage`.
- **Guard against a stale tab.** Saves are merged, never overwritten (`progress.ts:93-103`), and a page keeps its
  record in memory (`junior-play.tsx:37`, `:50-57`). If slot 2 is deleted in one tab while another tab still
  has that child's map open, the next solve in the old tab would write the whole old record back. So the page
  remembers the slot's `createdAt` when it opens the slot and, before each save, checks that the list still
  shows the same value. If not, it does not save and returns to the title screen.
- **Size.** 79 levels at about 45 bytes each is under 4 KB per child **(ours)**; the limit is "5 MiB of local
  storage ... per origin" (MDN, §3.1).

### 2.3 Where the landing sits, and the flow

**Today.** `/` renders the game directly: `src/app/page.tsx:3-6` returns `<JuniorPlay />`, whose first screen
is the island map. `/junior` and `/academy/...` redirect to `/` (`next.config.ts:13-18`). `/junior/quiz` is the
older quiz. The owner's earlier decision was: "`/` becomes a real landing page focused on Junior, built to make
visitors click into the game" (the landing note, "Owner decisions"). The title screen is that landing; the map
becomes the second screen.

**Design: steps inside `/`, in one new client component (ours).** A new `JuniorHome` shows the title screen,
then the slots, then (new game) the character choice and nickname, then mounts `JuniorPlay` with the slot's
storage. `JuniorPlay` already switches between map and level the same way (`junior-play.tsx:36`, `:89`) and
moves focus to each new screen's heading (`:82-87`). Separate routes (`/play`, `/new`) were considered and set
aside: the server cannot read `localStorage`, so `/play` could not be protected on the server, and a slot in
the address would need `useSearchParams`, which on a prerendered route makes the tree "up to the closest
`Suspense` boundary ... client-side rendered"
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md:82-86`).

**Flow:**

1. **Title screen.** The name, the tagline "Learn Yu-Gi-Oh! by playing." (`src/lib/brand.ts:2`, today only in
   the browser tab), one large famous card (§5.4), and the buttons **Continue** and **New game**. This also
   answers the previous note's first point, that nothing on the first screen says what the game teaches.
2. **The three save tiles** (§2.5), on the same screen below the buttons.
3. **New game only:** choose a character (§4), then the nickname (§2.4).
4. **Map.** As today, loaded with that slot's record. A "change player" button next to the sound switch
   (`island-world.tsx:123`) returns to the title screen.

**Browser Back.** Back from the map should return to the title screen, not leave the site. Next.js supports the
native History API: "`pushState` and `replaceState` calls integrate into the Next.js Router"
(`node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md:345-347`). Push one history
entry when a slot is opened and listen for `popstate`. Not tried.

**Hydration.** The server cannot see the saves, so the HTML it sends must not depend on them.

- The Next.js docs in the installed version: "User preferences, browser settings, and client-side storage
  aren't available during server rendering." "A Client Component that re-renders with client values causes a
  hydration error." "Deferring to `useEffect` avoids the error but introduces a visible flash."
  (`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md:7-13`).
- React's `useSyncExternalStore` takes a `getServerSnapshot` that "will be used only during server rendering
  and during hydration" and "must be the same between the client and the server"
  (<https://react.dev/reference/react/useSyncExternalStore>).
- The app already follows the safe pattern: "Server and first client render use the empty default; saved
  progress and the device setting join after hydration" (`junior-play.tsx:58-63`); the 3D scene is loaded with
  `ssr: false` (`island-world.tsx:14`).
- **For the title screen:** the server renders the title and three neutral tiles of the final size. The real
  content of each tile appears after hydration, by `useEffect` as today. Same-size placeholders make the flash
  a fill-in, not a jump. Do not read storage in a `useState` initializer on its own; that is the mismatch the
  guide warns about. Keep **Continue** disabled, not hidden, until the slots are known, so no button moves
  under a finger.

**Touch first (D6).** Every new control is a real button at least 48 pixels high, as the map's are
(`island-world.tsx:157`). Nothing depends on hover, a long press or a drag. Use `svh` units and the bottom safe
area as the map does (`island-world.tsx:105`, `:136`). The nickname field's text is at least 16 pixels, because
Safari on iPhone is reported to zoom the page when a smaller field takes focus (not checked at a primary
source, §10).

### 2.4 The nickname (assumption A1)

| Point | Specification (ours) |
| --- | --- |
| Required? | No. The field can be left empty. |
| Default | Empty is stored as `""`. The tile then shows a default made at display time in the current language: "Duelist 1", "Duelist 2", "Duelist 3" (the slot number). So the default follows a language change. |
| Length | At most **12 characters**, counted as the reader sees them (`Array.from(name).length`), enforced on input and again on save. |
| Allowed characters | Letters of any alphabet (`\p{L}`), combining marks (`\p{M}`), digits (`\p{N}`), space, hyphen and apostrophe. Everything else is removed. So Hebrew, French accents and Latin all work; emoji, symbols and line breaks do not. |
| Cleaning | Unicode NFC, runs of spaces to one space, trimmed at both ends. |
| The field | `<input type="text">` with `maxLength`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck={false}`, `autoCapitalize="words"`, `enterKeyHint="done"`, `dir="auto"`, and a visible label. A "Skip" button beside "OK". |
| Right-to-left | `dir="auto"` on the field and `<bdi>` around the name wherever it is shown, so a Hebrew name inside an English sentence, or the reverse, sits correctly. Card names already use `dir="auto"` (`src/components/junior/play/mini-board.tsx:107`). |
| Hint under the field | "A nickname, not your full name." In the three languages. |
| Where the name appears | On the save tile, on the map's "change player" button, in the delete and replace confirmations, and inside that save's export code (§3.3). **Nowhere else:** not in the address, not in the page title, not in any request. |
| Where it is stored | In the profile list in `localStorage` on the device. The app has no backend and no analytics (the landing note §3.3), so it is sent nowhere. The login note's reading holds: "Nothing is sent, so the legal position stays as it is today" (its §4.2). |
| Changing it | From the tile's "manage" view. |

### 2.5 The save tiles, New game, and replacing a save

| Element | Source | Note |
| --- | --- | --- |
| Character picture | `avatar` | The still picture of §4.3. For a child who reads little, this is the real label of the save. |
| Nickname | `name`, or the default | |
| Islands finished, for example "3 of 18" | `islandStatus(progress, world) === "done"` over `WORLD_IDS` (`status.ts:9-13`) | Derived. |
| Cards earned | `album(progress).length` (`progress.ts:130`), plus the reward cards of finished islands (§7.5) | Derived. |
| Last played | `playedAt` | "today", "yesterday", "3 days ago". |
| Empty slot | entry is null | A large "New game" tile with a plus sign. |

- **Continue** opens the slot in `last`. It is disabled when no slot exists.
- **New game** opens the first empty slot. Tapping an existing tile opens that save.
- **All three slots full (assumption A2).** New game says "All three places are taken. Choose a save to
  replace." and the tiles switch to a "replace" state. The child taps one. A confirmation follows.
- **The confirmation**, used for both "replace" and "delete": it is a dialog in the page, not `window.confirm`.
  It shows the character and the nickname and names what will be lost ("Noa: 12 levels, 9 cards"). Focus starts
  on **Keep**. The destructive button is second and apart from it. It offers **Save a copy first**, which opens
  the export of §3.3. Two taps on two different buttons; no press-and-hold or drag (the previous note's WCAG
  point, its §2.4).
- **Manage view** of a tile (a small gear on the tile): change nickname, change character, save a copy, load a
  copy, delete. Delete is here, not on the tile's face.
- **When storage is missing** (private window, blocked storage; the app already detects this,
  `junior-play.tsx:17-23`, `progress.ts:82`): the title screen shows one **Play** button and a plain line, "This
  browser will not keep your progress". No tiles that would silently forget.

### 2.6 How local slots relate to the parent-login research

The login note describes two steps: "the no-account step: child profiles on one device" (its §4.2) and a parent
account with child profiles on a server (its §4.3 to §4.5). This feature is the first step and does not block
the second: the proposed server tables there are `child_profile (id, parent_id, nickname, avatar)` and
`junior_progress (profile_id, data, updated_at)`, the same fields as a local slot; and the merge that would
reconcile a device with a server "already exists and is safe to run on a server" (its §4.4). What local slots
do not give, in that note's words: "progress on a second device without a manual step, and recovery when the
browser's storage is cleared". §3 is about exactly that.

---

## 3. Keeping a save alive on iPad and iPhone

### 3.1 What the browsers do

| Fact | Source |
| --- | --- |
| `localStorage` "data has no expiration time". | MDN, <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage> |
| Size: "Browsers can store up to 5 MiB of local storage, and 5 MiB of session storage per origin." Past it, "browsers throw a `QuotaExceededError` exception which should be handled by using a `try...catch` block." | MDN, <https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria> |
| IndexedDB and the Cache API have larger, browser-managed quotas: Chromium "up to 60% of the total disk size"; Firefox the smaller of "10% of the total disk size" and "10 GiB"; WebKit browser apps "up to around 60% of total disk". | Same MDN page |
| Default mode is best-effort: data "persists as long as the origin is below its quota, the device has enough storage space, and the user doesn't choose to delete the data via their browser's settings." | Same MDN page |
| Under storage pressure browsers evict by "a Least Recently Used (LRU) policy"; this "skips over origins that have been granted data persistence". | Same MDN page |
| **Safari's seven-day rule.** "If an origin has no user interaction, such as click or tap, in the last seven days of browser use, its data created from script will be deleted. Cookies set by server are exempt from this eviction." It applies "when cross-site tracking prevention is turned on". | Same MDN page |
| WebKit's own announcement (24 March 2020): "deleting all of a website's script-writable storage after seven days of Safari use without user interaction on the site"; the forms listed include "Indexed DB" and "LocalStorage". "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use." "We do not expect the first-party in such a web application to have its website data deleted." | WebKit blog, <https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/> (the tool returned the rule in two fragments) |
| WebKit's 2023 storage policy covers "localStorage, Cache API, IndexedDB, Service Worker, and File System"; "By default, all origins use a best-effort mode". WebKit "currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App." | WebKit blog, 10 August 2023, <https://webkit.org/blog/14403/updates-to-storage-policy/> |
| `navigator.storage.persist()` "requests permission to use persistent storage, and returns a `Promise` that resolves to `true` if permission is granted"; "The browser may or may not honor the request". Secure contexts only. | MDN, <https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist> |
| "Safari and most Chromium-based browsers ... automatically approve or deny the request based on the user's history of interaction with the site and do not show any prompts"; Firefox shows "a UI popup". | MDN quota page |
| Adding to the Home Screen on iOS: "tapping the Share button to open the Share menu, and then tapping 'Add to Home Screen'". A site with a manifest "with its display member set to standalone or fullscreen" becomes a Home Screen web app. | WebKit blog, 16 February 2023, <https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/> |
| Private browsing: `localStorage` data "is cleared when the last 'private' tab is closed". | MDN `localStorage` page |
| `localStorage` is per origin and per protocol. | MDN `localStorage` page |

Readings **(ours)**:

- **On the owner's main devices the seven-day rule is the real risk.** The count is days of Safari use, not
  calendar days: a family iPad on which Safari is used daily, and the game not opened for a week, can lose all
  three saves. Moving to IndexedDB does not help: WebKit lists both. Chrome on a computer has no such rule on
  the pages read; there the risks are a cleared browser or a full disk.
- **Changing the site's address loses every save**, because storage is per origin. An older open question asks
  about a custom domain (`docs/open-questions/2026-11-15-01h46.md`, cited in the landing note §9). Decide the
  address before children have saves worth keeping (§9).
- Whether a granted `persist()` exempts a site from the seven-day rule, and whether a Home Screen web app sees
  the saves made in Safari, are **not stated** on the pages read (§10). The design below assumes neither.

### 3.2 The persistence request

- Call `navigator.storage.persist()` once a save is worth keeping: when a slot is created and again after the
  first solved level. Guard it: `if (navigator.storage?.persist)`. It needs HTTPS, which the deployed site has.
- It shows no prompt in Safari or Chrome. It may answer `false`. The answer changes nothing in the game; it is
  only shown to a parent in the manage view ("This browser has agreed to keep saves" or "This browser may
  delete saves: keep a copy").
- Cost: a few lines. It does not replace §3.3.

### 3.3 Save a copy, load a copy: the export code

The only protection that survives a cleared browser, a new device, the move from Safari to the Home Screen app
and a changed address. The login note proposed it for moving a profile by hand (its §4.2).

**Format (ours):**

```
DA1.<payload>.<check>

payload = base64url( UTF-8( JSON.stringify({ v: 1, name, avatar, play }) ) )
play    = the slot's PlayProgress record, exactly as stored (progress.ts:19-27)
check   = 8 hex digits: the 32-bit FNV-1a hash of <payload>
```

- `DA1` names the format, so a later format can be told apart. The check catches a code that was cut when
  copied; it is not a security feature, and the code is not secret.
- **Size:** a finished course is about 4 KB of JSON, so about 5,500 characters. That is for copy and paste, a
  file or the share sheet, not for typing. A short typed code would need a server.
- **The code contains the nickname.** Say so beside the button, in one line for parents.

**Save a copy** (in a tile's manage view, and offered before replace and delete):

1. **Save as a file:** a `Blob` download named `duel-academy-<nickname or slot>.txt`.
2. **Share:** `navigator.share({ text })` where the browser has it, so the code can go to Notes, Mail or
   AirDrop from the iPad's share sheet.
3. **Copy:** `navigator.clipboard.writeText`, with a visible "Copied" answer.

All three start from a tap. Which of them work in Safari on iOS was not tried (§10); offering three is the
answer to that.

**Load a copy:**

1. A paste field, and a file picker (`<input type="file" accept=".txt,text/plain">`).
2. Check the `DA1.` prefix and the check digits; decode; parse the JSON.
3. **Clean before trusting:** keep only level ids this build knows, with boolean `clean` and `firstTry`; keep
   only whole-number slip counts; clean the nickname by §2.4; fall back on an unknown avatar. This is the login
   note's warning applied here: an unknown level id makes the strict parser reject the whole record
   (`progress.ts:63`; that note's §4.4).
4. **Into an empty slot:** create the profile and write the record. **Into an existing slot:** merge with
   `mergePlayProgress` (`progress.ts:45-52`), which never loses a solved level; the tile's nickname and avatar
   stay.
5. Show what was loaded ("Noa: 12 levels") before the final OK.

Pure functions (`encodeSave`, `decodeSave`, `cleanImported`) are easy to test next to `progress.test.ts`.

### 3.4 Add to Home Screen

- **Why:** WebKit says an installed web app has "their own counter of days of use", that it does "not expect"
  its data to be deleted, and that being a Home Screen web app is one of the things that gets `persist()`
  granted (§3.1).
- **What to build:** a web app manifest. Next.js has a file convention for it: "create a `app/manifest.ts` or
  `app/manifest.json` file" (`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md:20-24`; the
  guide's example sets `name`, `short_name`, `start_url: '/'`, `display: 'standalone'`, `background_color`,
  `theme_color` and `icons` of 192 and 512 pixels). The app has no manifest and no icon files today (the landing
  note §2; `public/` holds only `world/`). Theme colour: the existing `#05070f` (`src/app/layout.tsx:20`).
- **The icon must be our own drawing** (default **(ours)**): the site's initials or a plain card shape in the
  site's gold. It sits on the device's home screen outside the site, so it should not be a piece of card art.
- **iOS has no install button a site can trigger**; the parent uses the Share menu (WebKit quote in §3.1). So
  the app shows a short, illustrated hint for parents, in the manage view and once after the first finished
  island: "Tap Share, then Add to Home Screen. The game then keeps its saves better." In three languages.
- **Order for a family that already has saves in Safari:** save a copy, add to Home Screen, open the app from
  the icon, load the copy. The hint must say this, because the installed app may start with no saves (§10).
- No service worker is needed for this, and none is proposed.

---

## 4. Choosing one of three characters at New Game

The three figures are the **player's** figure on the map (D4). The island trainers are the anime characters of
§7 and are drawn as portraits, so the two cannot be confused.

### 4.1 What is in the repo and what the pack offers

- **In the repo today: no character.** `public/world/` holds `kit.glb` (971,280 bytes, the islands) and
  `KAYKIT-LICENSE.txt`. The child is shown by a boat (`docs/open-questions/2026-11-19-02h30.md`, item 4).
- **The pack:** KayKit *Adventurers* 1.0, by the same author as the islands (previous note §2.3).
- **Licence, from the pack's own file** (<https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/HEAD/LICENSE.txt>):

  > KayKit : Adventurers Character Pack (1.0)
  > Created/distributed by Kay Lousberg (www.kaylousberg.com)
  > License: (Creative Commons Zero, CC0) http://creativecommons.org/publicdomain/zero/1.0/
  > This content is free to use in personal, educational and commercial projects.
  > Support me by using a brand resource provided in this pack or by crediting Kay Lousberg, www.kaylousberg.com
  > (this is not mandatory)

**[measured]** The five character files, at commit `672074b` of the pack's repository (file list from
<https://api.github.com/repos/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/git/trees/HEAD?recursive=1>).
All five were downloaded to a temporary folder outside the repo, their glTF headers read, and deleted.

| File | Bytes | gzip -9 | Meshes | Triangles | Mesh data (bytes) | Loose items inside the file |
| --- | --- | --- | --- | --- | --- | --- |
| `Knight.glb` | 3,659,532 | 1,170,800 | 15 | 6,952 | 339,000 | two swords, an off-hand sword, four shields, helmet, cape |
| `Mage.glb` | 3,589,240 | 1,142,889 | 12 | 5,683 | 269,986 | two spell books, wand, staff, hat, cape |
| `Rogue.glb` | 3,616,284 | 1,153,233 | 12 | 6,377 | 296,282 | two knives, two crossbows, a throwable, cape |
| `Barbarian.glb` | 3,613,268 | 1,154,289 | 13 | 6,543 | 293,958 | three axes, round shield, mug, hat, cape |
| `Rogue_Hooded.glb` | 3,597,652 | 1,144,642 | 12 | 6,035 | 277,850 | as Rogue, with a hooded head |

Common to all five: 41 joints, one material, one texture of 14 to 17 KB inside the file, **76 animations**
whose keyframes total 1,331,056 bytes, of which `Idle`, `Walking_A`, `Cheer` and `Interact` together are
67,204 bytes. All five contain those four clips. Each body is six skinned meshes (two arms, body, head, two
legs); the other six to nine meshes are weapons, shields, hats and capes. Mesh node names: `Knight_Body`,
`Knight_Head`, `Knight_ArmLeft`, `Knight_ArmRight`, `Knight_LegLeft`, `Knight_LegRight`, `Knight_Helmet`,
`Knight_Cape`, and the same pattern with `Mage_` (`Mage_Hat`, `Mage_Cape`) and `Rogue_` (`Rogue_Cape`).

### 4.2 Which three (default F2)

**Knight, Mage, Rogue.**

- Three different outlines once the weapons are removed: a helmet, a pointed hat, a plain head with a cape.
- `Rogue_Hooded` is the Rogue with another head: not a third choice. The Barbarian's extras are axes and a mug,
  which suit a children's card game least.
- Each has its own texture (`knight_texture.png` 14,172 bytes, `mage_texture.png` 16,311, `rogue_texture.png`
  16,670), so the three also differ in colour.
- **No weapons.** Keep hat or helmet and cape. The figure is a duelist; a card in the hand can come with the
  reward work (previous note §3.2, R5).
- Not seen: how the three look on screen. The pack's sample pictures (`Samples/knight.png`, `mage.png`,
  `rogue.png`) were listed, not opened (§9).

### 4.3 Building, loading, and the choice screen

**Build.** `scripts/world/build-kit.mjs` already downloads a KayKit pack at a fixed commit into `.cache/` and
runs glTF Transform (`:17-22`, `:34-49`, `:70`). A sibling script `scripts/world/build-heroes.mjs` does, for
each of the three: read `Characters/gltf/<Name>.glb` at commit `672074b`; keep the six body meshes plus hat or
helmet and cape (by the node names above); keep the clips `Idle`, `Walking_A`, `Cheer`, `Interact`; prune;
compress with Meshopt; write `public/world/hero-knight.glb`, `hero-mage.glb`, `hero-rogue.glb`; copy the pack's
`LICENSE.txt` next to them.

- **Expected size: roughly 0.3 to 0.4 MB each before compression** (mesh data 270 to 340 KB minus the weapons,
  plus 67 KB of keyframes, plus the texture and the skeleton), less after Meshopt. An estimate from the files'
  tables; nothing was built.
- The app fetches `/world/hero-${avatar}.glb` with the loader it already uses for the kit, **after** the
  islands, so the map appears first. A child never downloads the two characters they did not pick.
- One shared animation file for all three is possible (the keyframe data has the same size in all five files)
  and would save about 67 KB per extra character, which a child never loads anyway. Not worth it **(ours)**.

**The choice screen shows three still pictures, not live 3D.** Three small images load at once, work without
WebGL (the app must, `island-world.tsx:16-24`, `:90`), are plain buttons with `alt` text for a screen reader,
and cost nothing on a phone. Three live figures would mean downloading all three models and the 3D engine
before the child has chosen.

- **The pictures:** `public/world/hero-knight.webp`, `hero-mage.webp`, `hero-rogue.webp`, 512 pixels square,
  transparent background. Simplest source: a screenshot of each trimmed figure taken once from the running
  scene. The pack's own sample renders are CC0 too but show the figures with weapons. Expected 10 to 30 KB each
  (estimate).
- **The screen:** a heading ("Who are you?"), three large tiles side by side (stacked on a narrow phone), each a
  button with the picture; the chosen one gets a gold border and a small bounce in CSS; an **OK** button. No
  names under the figures are needed; if wanted, "Knight", "Mage", "Rogue" in the three languages.
- The same three pictures are the save tiles of §2.5.

### 4.4 Storage, use, and changing later

- **Stored** as `avatar` in the slot's profile (§2.2). This replaces the separate `academy-ygo:junior:world:v1`
  key the previous note suggested (its §2.5, item 8), which predates the slots.
- **Used** by the walking design of the previous note §2.5 unchanged: the only new input is which file to load.
  Where the figure stands stays derived from progress (its item 1), so the slot stores no position.
- **Changeable later**, from the tile's manage view (§2.5). It is cosmetic and nothing is computed from it.

---

## 5. Official card art

### 5.1 Every place that still says or assumes "no real art"

| Where | What it says | What to do |
| --- | --- | --- |
| `src/components/site-footer.tsx:44` | "Cards are drawn as simple schematics with our own pictures, never real card art. Some are original examples; others use the name and text of a real Yu-Gi-Oh! card." | **Rewrite** (§5.6). Shown on every page. |
| `src/lib/i18n/ui-fr.ts:11`, `src/lib/i18n/ui-he.ts:11` | The French and Hebrew of that sentence. The English sentence is the lookup key, so all three change together. | Rewrite with the footer. |
| `src/components/site-footer.test.tsx:23-26`, `:46-50` | Asserts only the "not affiliated with or endorsed by Konami" line. **No test asserts the "never real card art" sentence** (searched the app's tests). | No test breaks. `src/lib/i18n/coverage.test.ts` checks that interface strings are translated (the landing note §3.2), so the new English sentence needs its two translations in the same change. |
| `src/lib/junior/play/cards.ts:68` | "A picture made of one emoji; decorative, never the only way a card is named." | Update: the emoji becomes the fallback. |
| `src/lib/junior/play/cards.ts:142` | "Real cards, by their real names, numbers and text. The pictures stay emoji." | Update. |
| `src/components/junior/play/mini-board.tsx:74`, `:85-87`, `:104-106` | "One schematic card: a picture, its name, and the numbers that matter"; the emoji is drawn in both card sizes. | The one place the picture is drawn (§5.4). |
| `src/lib/junior/world/themes.ts:6` | "Landscape and colour only: no Konami creature or character anywhere." | Update when art enters the scene. |
| `docs/academy-junior-world.md:32` | "**No Konami creature or character** is modelled." | Update. Still true of 3D models. |
| `docs/academy-junior-play.md:78-80` | "Worlds 1 to 8 use original cards (emoji pictures, invented names ...)" and "The pictures stay emoji: no card art is used." | Update, also for §6. |
| `apps/academy-ygo/README.md:4-5` | "schematic educational cards (original names, no real artwork)". | Describes the hidden beginner course; already out of date (the landing note §3.5). Fix with it. |
| `src/lib/sample-cards.ts:2-3`, `src/lib/lesson-types.ts:48`, `src/content/helpers.ts:11` | "Artwork is never used" and similar. | Beginner course code, unlinked and awaiting the owner's word on deletion (`docs/open-questions/2026-11-19-02h30.md`, item 1). Leave. |
| `src/components/junior/mission-art.tsx:3`, `src/components/junior/sort-card.tsx:5` | "Original schematic pictures". | The old quiz; true and unaffected. Leave. |
| Earlier research notes | "no Konami creature or character", "no look-alikes", and the previous note's §3.3 and §4.4. | Dated records. Do not rewrite them; §0 of this note records the change. |

There is no privacy, legal or "about" page in the app (the landing note §2), so the footer is the only public
text that makes the promise.

### 5.2 The image source: what its own guide says

YGOPRODeck API guide, "the latest API version (v7)" (<https://ygoprodeck.com/api-guide/>; the tool returned
these as separate sentences):

- "Do not continually hotlink images directly from this site." "Please download and re-host the images
  yourself." "Failure to do so will result in an IP blacklist."
- "You must download and store these images yourself!" "Please only pull an image once and then store it
  locally." "If we find you are pulling a very high volume of images per second then your IP will be
  blacklisted and blocked."
- "The rate limit is 20 requests per 1 second." "If you exceed this, you are blocked from accessing the API for
  1 hour."
- "Please download and store all data pulled from this API locally to keep the amount of API calls used to a
  minimum."
- Three picture sets: `https://images.ygoprodeck.com/images/cards/` (full card), `.../images/cards_small/`
  (small card), `.../images/cards_cropped/` ("cropped image art"). Files are named by picture id, for example
  `.../cards/27551.jpg`.
- "Credit to the Duelists Unite team for the cropped artwork images."
- Card facts: `https://db.ygoprodeck.com/api/v7/cardinfo.php`, with `name` ("You can pass multiple | separated
  names to this parameter") or `id` ("The 8-digit passcode of the card").
- Ownership: "The literal and graphical information presented on this site about Yu-Gi-Oh!, including card
  images ... is copyright 4K Media Inc, a subsidiary of Konami Digital Entertainment, Inc." "This website is
  not produced by, endorsed by, supported by, or affiliated with 4k Media or Konami Digital Entertainment."
- The guide does not ask API users to credit YGOPRODeck (the tool's reading of the page).

**[measured]** For one card (Time Wizard, id 71625222), by a headers-only request: full card 156,381 bytes,
small card 27,668 bytes, cropped art 112,587 bytes, all `image/jpeg`. Every card returned by the API today has
a `card_images` list with `id`, `image_url`, `image_url_small` and `image_url_cropped`.

### 5.3 The pipeline: a build-time script, like the islands'

**How the duel app does it.** `apps/duel-nextjs` keeps a **Mirror**: "Our own copy of a card image. YGOPRODeck
forbids hot-linking, so every image is downloaded once, re-encoded to WebP and served from here"
(`apps/duel-nextjs/CONTEXT.md:169-171`). It is a `ygo_card_images` table
(`apps/duel-nextjs/src/server/cards/ingest.ts:328-330`), a downloader limited to `images.ygoprodeck.com` at 8
requests a second and 4 at once (`apps/duel-nextjs/src/server/images/mirror.ts:21`, `:42-49`), `sharp`
(`mirror.ts:3`), a store in R2 or a folder (`apps/duel-nextjs/src/server/images/store.ts:9`) and a route that
serves WebP (`apps/duel-nextjs/src/app/api/card-image/[imageId]/[size]/route.ts:7-12`). It serves two sizes of
the **whole card**, 200 and 813 pixels wide (`apps/duel-nextjs/src/shared/api-types.ts:989-992`), and no
cropped art.

**The academy reuses the rule, not the code.** The mirror needs Postgres, an object store and a server route;
the academy is "fully static" with no database (`apps/academy-ygo/README.md`, quoted in the login note §4.1).
Pointing the academy at the duel app's image route would tie a children's site to another deployment and give
only whole-card scans.

**The academy's pipeline (ours):**

1. **An art list in the repo:** `src/lib/junior/play/card-art.json`, one entry per card that has official art:
   `{ "dark-magician": { "card": 46986414, "image": 46986414 }, ... }`. `card` is the YGOPRODeck card id;
   `image` is the picture id (default F7: equal to the card id).
2. **A script** `scripts/cards/build-art.mjs`, run as `pnpm --filter academy-ygo cards:art`. For each entry not
   yet in `.cache/cards/` (already ignored by git, `.gitignore`): download
   `https://images.ygoprodeck.com/images/cards_cropped/<image>.jpg` once, at most 5 requests a second, one at a
   time. Then with `sharp` write two WebP files per card: 160 pixels wide (board, binder, tiles) and 480 pixels
   wide (reward reveal, title screen, the panel on the map).
3. **Output** in `public/cards/`: `<image>-160.webp`, `<image>-480.webp`. The width is in the file name, so a
   changed size gives a new address.
4. **Run by hand when the list changes**, not on every deploy. Downloading on every build would break "only
   pull an image once". The output is committed with the app, as `kit.glb` is.
5. **A generated module** `src/lib/junior/play/card-art.ts` maps each `CardId` to its picture id, so the app
   never guesses a file name.

- **Volume:** 33 real cards already in the app (`cards.ts:143-177`), 14 real Normal Monsters (§6), 6 signature
  cards not yet in the app and a few alternates (§7.4): about 55 to 60 cards, so about 120 files. At an assumed
  5 to 10 KB for the small size and 20 to 40 KB for the large one, **2 to 3 MB in the repo, and a few small
  pictures per screen** (estimate; nothing was encoded).
- **New dev dependency:** `sharp`. The duel app uses `^0.35.3` (`apps/duel-nextjs/package.json:51`); the academy
  has none (`package.json:24-42`).

**Serving.** Files in `public/` get "`Cache-Control: public, max-age=0`", because "Next.js cannot safely cache
assets in the `public` folder"
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md:24-31`); the browser
asks again on every visit, as it does for `kit.glb` today. Since the file names carry the size and the picture
id, add a long-lived header for `/cards/:path*` with `headers()` in `next.config.ts` (the function was not read
in the bundled docs today, §10). The 3D scene needs a plain address for its texture, which is why the files are
in `public/` and not imported.

**`<img>`, not the image optimizer.** The pictures are already made in the right sizes, so `next/image`'s
on-demand resizing would be wasted work (and on Vercel it is metered). Use `<img>` with `width`, `height`,
`loading="lazy"`, `decoding="async"`, and `srcSet` for the two widths. `next/image` with `unoptimized` ("The
source image will be served as-is", `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:391-416`)
is the equivalent. No `images` setting in `next.config.ts` is needed.

**Offline.** The academy has no service worker (searched `src/` for `serviceWorker` and `manifest`: no match).
Pictures are cached by the browser like any file.

### 5.4 How artwork appears

| Place | Today | With official art |
| --- | --- | --- |
| **A card on the board and in the binder** | `CardFace` draws `info.art`, one emoji, above the name, inside the app's own coloured frame (`mini-board.tsx:81-107`). | The emoji span becomes the **cropped art** when the card has an entry in the art list; the emoji stays as fallback. Name, numbers and text stay as HTML. `alt=""`, because the name is right below. |
| **The reward reveal** (previous note §3.2, R1) | Not built. | The same card, large, with the 480-pixel picture. |
| **The binder** (R4) | The album row at the bottom of the page (`junior-play.tsx:129-144`). | Small pictures; grey places for cards to come. |
| **The island's signature card** | Not built. | A `CardFace` with art beside the island title, and a card-shaped panel standing on the island in 3D carrying the same art as a texture. Art only, so the rule "no words inside the scene" holds (`docs/academy-junior-world.md`). |
| **Title screen** | None. | One famous card, large: Dark Magician. |

**Cropped art inside our own frame, not the scan of the whole card.** A whole-card scan carries English text in
the picture. The app's cards are translated HTML: French shows the French card text, and Hebrew shows the
English card with its meaning underneath (`docs/academy-junior-play.md:78-80`; `copy.englishCards`,
`src/lib/junior/play/copy.test.ts:161-163`). Cropped art keeps all of that, keeps the text readable by a screen
reader, and is the smaller file. The owner's rule, Hebrew keeps the English card terms and French stays as is,
is met with no extra work.

### 5.5 What stays emoji

After §6, eleven original cards remain: seven Spells and Traps and four Effect Monsters. They have no official
art and keep their emoji. On a board they sit next to real monsters with art. That mix is expected; replacing
them is §6.3.

### 5.6 Residual risk and wording, restated briefly

- **The record.** The previous note found no published Konami text that permits a fan site to use card artwork
  or the anime characters; the terms it read reserve both (Konami's website terms, "All rights not expressly
  granted are reserved by Konami and/or its licensors", <https://legal.konami.com/kdeus/btob/terms/tou/en/>;
  the anime site's terms, <https://www.yugioh.com/news/terms-of-use>). YGOPRODeck says the pictures are not its
  own to license (§5.2). The characters are a separate set of rights from the cards (previous note §4.2(c)).
  The owner has decided with this on record; nothing new was found today that changes it in either direction.
- **No first-party source read asks fan sites for a particular disclaimer**, and none publishes a fan-content
  policy (previous note §4.2(b); again not found today). There is no official wording to copy.
- **What the first-party pages themselves print**, the nearest thing to a model:
  - Konami's card database: "©2026 Konami Digital Entertainment" and "©2020 Studio Dice/SHUEISHA, TV TOKYO,
    KONAMI" (<https://www.db.yugioh-card.com/>, a search page fetched today).
  - The anime site, per series: "Yu-Gi-Oh!" "©1996 Kazuki Takahashi"; "Yu-Gi-Oh! GX" "©1996 Kazuki Takahashi"
    "©2004 NAS • TV TOKYO"; 5D's "©2008 NAS • TV TOKYO"; ZEXAL "©2011"; ARC-V "©2014"; VRAINS "©2017"
    (<https://www.yugioh.com/characters/yami-yugi>, footer).
  - A printed card: "© 1996 KAZUKI TAKAHASHI" (read on one card picture today).
  - YGOPRODeck: "Credit to the Duelists Unite team for the cropped artwork images." Whether that is a request
    to API users or YGOPRODeck's own credit is not clear from the page.
- **Footer text, default F3 (ours, not from any source):**
  - Line 1, replacing `site-footer.tsx:44`: "Duel Academy is an unofficial, non-commercial fan project for
    learning. Card names, card text, card artwork and characters belong to their owners: Yu-Gi-Oh! © Kazuki
    Takahashi, Studio Dice/SHUEISHA, TV TOKYO, KONAMI. A few cards are our own examples."
  - Line 2, `site-footer.tsx:45`, unchanged: "Duel Academy is not affiliated with or endorsed by Konami.
    Yu-Gi-Oh! is a trademark of Konami."
  - Line 3: "Card pictures: YGOPRODeck and the Duelists Unite team. Island and character models: Kay Lousberg
    (KayKit), CC0." This also takes up the open thank-you to Kay Lousberg
    (`docs/open-questions/2026-11-19-02h30.md`, item 6).
  - The existing "© year Duel Academy. All rights reserved." (`site-footer.tsx:47-49`) reads oddly beside
    borrowed art; "© year Duel Academy for the lessons and the code" is truer.

### 5.7 Non-commercial, and whether a public repository helps

- **Recorded as a fact (D10): the academy is not commercial.** No ads, no shop links, no paid part. This
  answers a question left open in four earlier notes.
- **What the sources say it changes.** The FTC's COPPA FAQ says the Rule covers "operators of commercial
  websites and online services" and "not ... nonprofit entities" (quoted in the landing note §5.5); whether a
  private person's non-commercial site is treated like a nonprofit entity was not established there. Konami's
  website terms allow "personal, non-commercial use only" **of Konami's websites** (previous note §4.2(b));
  that sentence is not a grant to show card art elsewhere, commercial or not. No source read says that
  non-commercial use permits what §5.6 records as reserved.
- **Does making the repository public help? No source read says it does.** Neither YGOPRODeck's guide, nor the
  KayKit licence (CC0, "not mandatory" credit), nor any Konami text read asks for, rewards or mentions open
  source.
- **What it would change, factually:**
  - The academy is not a repository of its own. It is `apps/academy-ygo` inside a repository that also holds
    the salon booking site, the duel platform and an alarm app (`CONTEXT-MAP.md:7-9`). Making "the repo" public
    publishes all of them with their history, unless the academy is first moved to its own repository.
  - The card pictures of §5.3 are committed files. In a public repository anyone can download them from GitHub:
    a second public copy besides the site. The same goes for the commissioned portraits of §7.3.
  - GitHub's billing page lists "Standard GitHub-hosted runners in public repositories" as free
    (<https://docs.github.com/en/billing/concepts/product-billing/github-actions>; fragment returned by the
    tool). The academy has a CI workflow (`.github/workflows/academy-ygo.yaml`, per the landing note §3.3).
    That is the one concrete benefit found.
- **Default F8: stay private.** If it is made public later, do it for the academy alone, in its own repository.

---

## 6. Real Normal Monsters in place of the original cards (D9)

### 6.1 What "the 25 original cards" are

`src/lib/junior/play/cards.ts:116-140` holds 25 invented cards:

- **14 plain monsters** (no effect): Pocket Cub, Moss Beetle, River Otter, Lantern Owl, Pebble Crab, Storm Stag,
  Mountain Bison, Mud Toad, Night Bat, Thorn Fox, Bramble Ram, Iron Boar, Stone Golem, Shadow Wolf.
- **4 Effect Monsters** with invented effects: Glint Lynx and Cinder Hedgehog (`:130-131`), Dozy Moth and Busy
  Bee (`:133-134`).
- **7 Spells and Traps:** Spark Trade, Glow Charm, Spark Dash, Thunder Clap, Fog Snare, Sticky Vine, Quick
  Burrow (`:132`, `:135-140`).

Only the 14 plain monsters can become Normal Monsters. A Normal Monster has no effect, so the other 11 cannot
by definition.

### 6.2 The replacement table

**Method.** YGOPRODeck returned all 673 Normal Monsters in one call today. Each original card was matched on
Level, ATK and DEF. Where no exact twin exists, every level that uses the card (`levels.ts:97-250`) was read to
see which of its numbers the level depends on. **This was done by reading setups and solutions, not by running
the engine or the tests.** Four replacements were also read in Konami's own database today (marked K).

| Original (Level, ATK/DEF) | Real Normal Monster | YGOPRODeck id | Level, ATK/DEF | Type, Attribute | Levels |
| --- | --- | --- | --- | --- | --- |
| Pocket Cub (3, 1200/800) | **Silver Fang** K | 90357090 | 3, 1200/800 | Beast, EARTH | **Exact twin.** Unchanged. |
| River Otter (4, 1500/1000) | **Destroyer Golem** | 73481154 | 4, 1500/1000 | Rock, EARTH | **Exact twin.** Unchanged. Others with the same numbers: Mystic Clown (47060154), Ground Attacker Bugroth (58314394). Not Divine Dragon Ragnarok: a Dragon would get Mountain's +200 and change the Field Spell lesson (`levels.ts:176`). |
| Lantern Owl (4, 1800/600, Winged Beast) | **Sky Scout** K | 30532390 | 4, 1800/600 | Winged Beast, WIND | **Exact twin, same Type.** Unchanged; Mountain still boosts it (`levels.ts:176-177`). |
| Thorn Fox (4, 1400/1000) | **Fairy's Gift** | 68401546 | 4, 1400/1000 | Spellcaster, LIGHT | **Exact twin.** Unchanged. Also Water Magician (93343894). |
| Bramble Ram (4, 1500/1300) | **Maiden of the Moonlight** | 79629370 | 4, 1500/1300 | Spellcaster, LIGHT | **Exact twin.** Unchanged. |
| Stone Golem (4, 500/2000) | **Prevent Rat** | 549481 | 4, 500/2000 | Beast, EARTH | **Exact twin.** Unchanged. Also Earthbound Spirit (67105242). |
| Shadow Wolf (6, 2200/1500) | **Judge Man** | 30113682 | 6, 2200/1500 | Warrior, EARTH | **Exact twin.** Unchanged. A Kaiba card on the official site (his character page lists it). |
| Iron Boar (4, 1700/1200) | **Battle Ox** | 5053103 | 4, 1700/1000 | Beast-Warrior, EARTH | **Unchanged.** Same Level and ATK. Only DEF differs, and Iron Boar is never in Defense Position in any level. A Kaiba card (yugioh.com lists Seto Kaiba). Also Axe Raider (48305365; 1700/1150). |
| Mountain Bison (8, 2900/2200) | **Cosmo Queen** K | 38999506 | 8, 2900/2450 | Spellcaster, DARK | **Unchanged.** Same Level and ATK. DEF differs and is never used. |
| Mud Toad (2, 800/900) | **Happy Lover** | 99030164 | 2, 800/500 | Fairy, LIGHT | **Unchanged.** Same Level and ATK. DEF differs and is never used. Also Kagemusha of the Blue Flame (15401633; 2, 800/400), which Joey's official page lists. |
| Night Bat (3, 1100/400, Winged Beast) | **Lady of Faith** | 17358176 | 3, 1100/800 | Spellcaster, LIGHT | **Unchanged.** Same Level and ATK. DEF is never used. The Type changes: remove `type: "winged-beast"` at `cards.ts:124`. No level has Night Bat together with Mountain. To keep the Type instead: Fiend Reflection #2 (2863439; 4, 1100/1400, Winged Beast). |
| Moss Beetle (4, 1000/1800) | **Mystical Elf** | 15025844 | 4, 800/2000 | Spellcaster, LIGHT | **Unchanged.** The two levels that depend on it (`w2-crouch`, `levels.ts:104`; `p9`, `:135`) need a DEF above Iron Boar's 1700 and an ATK below it; 2000 and 800 do that. A Yugi card of the first duels. |
| Storm Stag (6, 2300/1600) | **Ally of Justice Clausolas** | 89386122 | 6, 2300/1200 | Machine, DARK | **Unchanged**, by the numbers: same Level and ATK, DEF never used. **Weak as a card for children:** an obscure name from a later era. See below. |
| Pebble Crab (2, 600/1500) | **Saggi the Dark Clown** K | 66602787 | **3**, 600/1500 | Spellcaster, DARK | **One level changes.** Same ATK and DEF; Level 3, not 2. A Kaiba card (yugioh.com lists Seto Kaiba). See below. |

**Storm Stag.** Nine levels count its 2300 ATK to the exact Life Point (`levels.ts:114`, `:129`, `:134`,
`:136`, `:174`, `:209`, `:210`, `:211`, `:214`). The only Level 6 Normal Monster with 2300 ATK is Ally of
Justice Clausolas. The better-known choice is **Luster Dragon #2** (17658803; 6, 2400/1400, Dragon); it costs
100 more Life Points on the rival in each of those nine levels (`w3-keep` 1300 to 1400, `p3` 1300 to 1400, `p8`
1100 to 1200, `p10` 2700 to 2800, `m-reborn` 1600 to 1700, `pe-first` 3800 to 3900, `pe-between` 3000 to 3100,
`pe-extra` 100 to 200, `rd-vortex` 2300 to 2400), and as a Dragon it would be boosted by Mountain in the two
whole duels. **Default: Clausolas, zero changes.** Keeping Storm Stag as the one original monster is the other
honest option.

**Pebble Crab.** No Level 2 Normal Monster has 600 ATK and a DEF above 1400, which `w2-wall` needs
(`levels.ts:106`: it must hold against 1100 and 1400) together with the 600 ATK that two levels count
(`p5`, `:131`; `pe-between`, `:210`). Saggi the Dark Clown has the ATK and the DEF at Level 3.

- `pe-between` (`levels.ts:210`) uses the Crab as the card whose Level is **too low** for the Pendulum Scales 2
  and 7, so it is Normal Summoned. At Level 3 it would fit between the Scales and the lesson's low example is
  gone. **Change:** in that one level, replace the Crab by the Level 2 Happy Lover (800 ATK) and raise the
  rival's Life Points from 3000 to 3200.
- `ri-first` (`levels.ts:183`) Tributes Storm Stag and the Crab for a Ritual that asks for Levels totalling "8
  or more": 6 + 3 = 9 still works. **Check its text** in the three languages in case it says "6 + 2 = 8".
- Everywhere else the Crab is a Tribute, a Link Material or a defender, and Level 3 changes nothing
  (`tributesFor`, `cards.ts:212-214`: Level 1 to 4 needs no Tribute).

**What every swap needs besides the table:**

- **Names in three languages.** The copy files name cards in level texts, for example "Lantern Owl is in Defense
  Position. Destroy Thorn Fox." (`src/lib/junior/play/copy-en.ts:104`; 31 lines of `copy-en.ts` mention an
  original monster by name). Each becomes the real name. French needs the official French names from Konami's
  database, as the other real cards have (`docs/academy-junior-play.md:79`); they were not read today. Hebrew
  keeps the English names.
- **Numbers quoted in hints.** Where a replacement's printed number differs (Mystical Elf 800/2000, Battle Ox
  DEF 1000, Cosmo Queen DEF 2450, Happy Lover DEF 500, Lady of Faith DEF 800, Clausolas DEF 1200), search the
  three copy files for the old number in that level's text. Not checked today.
- **The two whole duels** (`w7-duel`, `levels.ts:143-160`; `x-duel`, `:226-250`) are open play. Their scripted
  solutions do not use a changed number, but a child's own game can differ slightly (Mystical Elf attacks for
  800, not 1000).
- **Card ids in code.** The internal ids (`"pocket-cub"`) are used about 145 times in tests. Saves store level
  ids, never card ids (`progress.ts:22`), so renaming is safe for saves. Do the swap in two steps: first change
  numbers, names and art under the old ids; then rename the ids mechanically.
- **The art list** (§5.3) gets the 14 ids above.

### 6.3 The other 11 original cards

They stay original, with emoji, because their effects were written for the lessons:

- The 4 Effect Monsters teach Quick Effects, "once per turn" and "when / if" with deliberately small texts
  (`cards.ts:43-62`). Real Effect Monsters with exactly those texts were not looked for.
- Of the 7 Spells and Traps, **one has a real twin:** Glow Charm ("you gain Life Points", 500;
  `cards.ts:135`) is Red Medicine (38199696, Normal Spell): "Increase your Life Points by 500 points." It can be
  swapped with no level change.
- The others have near relatives with different effects, so a swap would change levels: Rush Recklessly
  (70046172) gives 700, not Spark Dash's 500, and is a Quick-Play Spell; Negate Attack (14315573) also ends the
  Battle Phase, unlike Sticky Vine; Soul Taker (81510157) also gives the opponent 1000 Life Points, unlike
  Thunder Clap; Compulsory Evacuation Device (94192409) returns any monster, where Quick Burrow returns one of
  your own.

### 6.4 Verdict

**Yes, the swap can be done well for the plain monsters.** 13 of 14 are good real cards, 7 of them identical in
every number, and several are cards a fan knows (Silver Fang, Mystical Elf, Battle Ox, Judge Man, Saggi the Dark
Clown, Cosmo Queen). One level's setup changes. The weak spot is Storm Stag, where the only card that fits
without touching nine levels is obscure. The work is mostly words: about 14 names in three languages across the
level texts, and the tests that name the cards. After the swap, a child sees real art on every monster of the
first eight islands except four Effect Monsters; Spells and Traps there stay our own.

---

## 7. Trainers

### 7.1 Decided form

- The trainers are the named anime characters (D3). Their faces are **commissioned drawings** (D8).
- **Until the drawings exist:** a name plate, a line of speech and the **signature card's art** in a round
  frame, in the HTML around the map. On the island, the signature card stands as a card-shaped panel (§5.4).
  This works for all 18 islands from the art pipeline alone and already delivers "Joey with Time Wizard".
- **Where the trainer is drawn:** in the HTML dialogue (a round portrait, a name plate, a speech bubble). It is
  where the trainer speaks, in three languages, readable by a screen reader, correct right-to-left, and it
  works without WebGL. A face on a flat panel inside the 3D scene would be a few pixels on a phone; the card
  panel reads better there. No 3D figures of the characters: no legitimate source was found (previous note
  §4.1, T1).
- **One table drives it:** `trainer`, `card`, `portrait?` per island (§8, slice 9). When a portrait file is
  present it replaces the card art in the round frame; nothing else changes.
- A commissioned drawing of a named character is still that character's likeness; §5.6 applies to it as to the
  card art.

### 7.2 Other sources that were looked at

Kept for the record; none is the plan.

| Source | Finding |
| --- | --- |
| The card database | YGOPRODeck has pictures of cards, not of people. |
| **Speed Duel Skill Cards** | Official Konami cards tied to a character; YGOPRODeck lists 124, with the character in the type line. At least one exists for Yami Yugi, Yugi, Kaiba, Joey, Mai, Pegasus, Téa, Jaden and Zane; none for Solomon Muto, Yusei, Yuma, Playmaker or Yuya. **[seen]** The one opened, "Grit" (id 300202004), shows only Joey's eyes and hair in a comic panel under the word "BAM", with the type line "[Joey/Skill]". So a Skill Card evokes the character; it is not a portrait. Its cropped-art address returned HTTP 404. Possible later as an extra reward card. |
| Portraits on the anime site | Each character page on yugioh.com shows one. No API; that site's terms say "No Content, in whole or in part, may be copied, reproduced, republished, uploaded, posted, transmitted, distributed" (previous note §4.2(c)). |
| Licensed art | "Konami Cross Media NY, Inc. is responsible for brand management, licensing, and marketing of the Yu-Gi-Oh! brand" (<https://www.yugioh.com/licensing>, as quoted in the previous note). No terms or prices are published. |

### 7.3 Commission brief for the artist

Ready to hand over. Numbers are proposals **(ours)**.

**What it is for.** A children's website (ages 8 to 12) that teaches a card game on a map of small islands. On
each island a character greets the child and talks in a speech bubble. We need each character's portrait.

**The characters (12, in the order the child meets them):**

1. Solomon Muto (Yugi's grandfather)
2. Yugi Muto
3. Yami Yugi
4. Mai Valentine
5. Seto Kaiba
6. Joey Wheeler
7. Jaden Yuki
8. Yusei Fudo
9. Yuma Tsukumo
10. Playmaker
11. Yuya Sakaki
12. Zane Truesdale

Optional thirteenth: Maximillion Pegasus.

**How many drawings.** Three expressions for each character, the same pose and framing, only the face and
perhaps one hand changing:

- **Talking:** friendly, mouth slightly open. The everyday picture.
- **Cheering:** big smile, for when the child finishes an island.
- **Thinking:** a hand to the chin or a raised eyebrow, for a hint.

That is **36 drawings** (39 with Pegasus). A smaller first order is **12**: the talking picture of each.

**Framing.** Head and shoulders, three-quarter view, looking towards the viewer. The face and hair must fit
inside a centred circle that covers 90% of the square, because the site shows the portrait in a round frame.
Nothing important in the corners.

**Size and format.**

- Master: **2048 x 2048 pixels**, PNG, **transparent background**, sRGB.
- The layered source file as well (PSD, Procreate, Krita or similar).
- The site will make its own small copies (256 and 512 pixels). The drawing must still read at **64 pixels**:
  a clear outline, a recognisable hair shape, no fine detail that turns to noise.

**Style: it must sit beside the island world.** The islands are low-polygon toy models in flat, bright colours
(the KayKit *Medieval Hexagon* pack; screenshots will be supplied). So:

- Flat colours with one shadow tone, no soft gradients, no painted texture.
- One clean, even outline, the same weight on every character.
- The same light on every character: from the top left.
- A rounded, friendly look. No menace, even for the rival.
- All 12 by the same hand, in one style, so they look like one cast.

**Do not include:** any background, any text or lettering, any logo, any card or card artwork, any weapon, and
no signature inside the picture.

**The picture may be mirrored.** In the Hebrew version the layout runs right to left, and the site may flip the
portrait so the character faces the speech bubble. Avoid anything that would read wrongly when flipped.

**Optional second item, later:** one full-body standing picture of each character, 1024 x 2048 pixels,
transparent, same style, for the island itself.

**To settle with the artist in writing:** that the owner may use the drawings on the website and keep them in
the project's files; the price per drawing and for the set; the number of correction rounds; delivery in two
batches (the first three characters to agree on the style, then the rest).

**File names the site expects:** `public/trainers/<character>-talk.webp`, `-cheer.webp`, `-think.webp`, in 256
and 512 pixels, for example `joey-wheeler-talk-256.webp`.

### 7.4 Trainer and signature card, by island (default F5)

How each line was checked:

- **Islands and what they teach:** `src/lib/junior/play/levels.ts:8`, `copy-en.ts:78-95`, and each world's
  levels (`levels.ts:97-250`).
- **Card facts:** YGOPRODeck, the card source the repo uses; id, exact name and type are from its answers today.
  Seven cards were also read in Konami's own database (`db.yugioh-card.com`) today: Time Wizard, Decode Talker,
  Odd-Eyes Pendulum Dragon, and four of §6.2. The app's existing real cards were checked there on 2026-11-17
  (`docs/academy-junior-play.md:79`).
- **Who uses the card:** the official anime site. Each card page on yugioh.com has a "Characters" section, and
  each character page lists "Cards associated with character in this episode". "yugioh.com" below means the
  card's page names that character. The fetch tool noted that the section "does not say these characters use
  the card"; it is an official association, which is what a signature card needs.
- **Names** follow yugioh.com (default F6): Yami Yugi and Yugi Muto are two entries there.

"In the app" means the card is already in `cards.ts` and playable. Ids are YGOPRODeck ids.

| # | Island (teaches) | Trainer | Signature card (id; type) | Why it fits | Alternates | Pairing confirmed by |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `wake` The Deck wakes up (three kinds of cards, first battles) | Solomon Muto, the first guide | **Blue-Eyes White Dragon** (89631139; Normal Monster) | His treasured card in episode 1. A Normal Monster is the plainest card to read. The child plays it on island 3 (`levels.ts:116`). In the app. | none | yugioh.com: the card page lists Solomon Muto; his page lists the card |
| 2 | `shield` Shield or sword (Defense Position, Life Points, direct attacks) | Yugi Muto | **Giant Soldier of Stone** (13039848; Normal Monster, DEF 2000) | A wall: DEF far above ATK. In the app. With §6, Mystical Elf (15025844) is played on this island too. | Joey Wheeler with **Shield & Sword** (52097679; Normal Spell): the island's own name, but a Spell before Spells are taught | yugioh.com: Giant Soldier of Stone lists Yami Yugi, Yugi Muto; Shield & Sword lists Joey Wheeler |
| 3 | `friend` Call a friend (Summons, Tributes, phases) | Yami Yugi | **Dark Magician** (46986414; Normal Monster, Level 7) | Two Tributes; the level `w3-magician` (`levels.ts:115`). In the app. | Joey with Red-Eyes Black Dragon (74677422; Level 7) | yugioh.com: Dark Magician lists Yami Yugi, Yugi Muto; "Red-Eyes B. Dragon" lists Joey Wheeler |
| 4 | `magic` Spells and Traps | Mai Valentine | **Harpie's Feather Duster** (18144507; Normal Spell) | One short line: "Destroy all Spell and Trap Cards your opponent controls." Not in the app. | Yami Yugi with Swords of Revealing Light (72302403; Spell) and Mirror Force (44095762; Trap) | yugioh.com: lists Joey Wheeler, Mai Valentine. Mirror Force not checked. |
| 5 | `puzzles` Win this turn (ten boards) | Solomon Muto, as the puzzle master | none | Ten boards, no single card. | | |
| 6 | `tower` Turtle tower (Chains) | none | none | Keep the turtle. | | |
| 7 | `rival` The rival's challenge | Seto Kaiba, beside Nox (default F4) | **Blue-Eyes White Dragon** (89631139) | The rival's ace. With §6, Nox's monsters in this duel are Kaiba's Battle Ox and friends (`levels.ts:150`). | Lord of D. (17985575), Obelisk the Tormentor (10000000) | yugioh.com: the card page lists Seto Kaiba. Alternates not checked. |
| 8 | `reading` Read the card (Cost, Target, Quick Effect, once per turn) | **Joey Wheeler** | **Time Wizard** (71625222; Effect Monster, LIGHT Spellcaster, Level 2, 500/400) | The owner's example. Its printed text begins "Once per turn: You can toss a coin and call it.", and this island teaches "once per turn" (level `r-once`, `levels.ts:168`). Not in the app. | Baby Dragon (88819587; Normal Monster) | yugioh.com: Time Wizard lists Joey Wheeler, Yugi Muto. Card facts also read in Konami's database. |
| 9 | `mat` The whole mat | none | Monster Reborn (83764719; Normal Spell) as the island card | The first level is `m-reborn` (`levels.ts:174`). In the app. | | no trainer |
| 10 | `ritual` The Ritual | Yami Yugi | **Black Luster Soldier** (5405694; Ritual Monster) | The card the three levels use (`levels.ts:183-185`). In the app. | Maximillion Pegasus with Relinquished (64631466; Ritual Effect Monster) | yugioh.com: Black Luster Soldier lists Yami Yugi, Yugi Muto; Relinquished lists Maximillion Pegasus |
| 11 | `fusion` Fusion | Jaden Yuki | **Elemental HERO Flame Wingman** (35809262; Fusion Monster) | "Elemental HERO Avian" + "Elemental HERO Burstinatrix". The owner asked for heroes. Not in the app. | Joey with **Thousand Dragon** (41462083; "Time Wizard" + "Baby Dragon"), which carries Time Wizard on from island 8; Flame Swordsman (45231177), the card the levels use | yugioh.com: Flame Wingman lists Jaden Yuki; Thousand Dragon and Flame Swordsman list Joey Wheeler |
| 12 | `synchro` Synchro | Yusei Fudo | **Stardust Dragon** (44508094; Synchro Monster) | His ace. Not in the app. | **Junk Warrior** (60800381; "Junk Synchron" + 1 or more non-Tuner monsters): the better card to teach "one Tuner" | yugioh.com: Stardust Dragon lists Akiza Izinski, Jack Atlas, Roman Goodwin, Yusei Fudo; Junk Warrior lists Yusei Fudo |
| 13 | `xyz` Xyz | Yuma Tsukumo | **Number 39: Utopia** (84013237; Xyz Monster) | Two of the four levels use it (`levels.ts:200-201`). In the app. | Gagaga Magician (26082117) | yugioh.com: lists Bronk Stone, Yuma Tsukumo |
| 14 | `link` Link | Playmaker | **Decode Talker** (1861629; Link Monster, Link 3) | His first ace. Not in the app. | Link Spider (98978921), Firewall Dragon (5043010) | **Fan knowledge only.** No yugioh.com page found for the card or the character. |
| 15 | `pendulum` Pendulum | Yuya Sakaki | **Odd-Eyes Pendulum Dragon** (16178681; Pendulum Effect Monster, Level 7, Scale 4) | His ace. Not in the app. | Stargazer Magician (94415058), Timegazer Magician (20409757) | **Fan knowledge only.** Yuya's yugioh.com page names no card; no card page found. |
| 16 | `words` Every word counts | Zane Truesdale | **Cyber Dragon** (70095154; Effect Monster) | The card of level `rd-colon` (`levels.ts:217`). In the app. | Yugi Muto with Kuriboh (40640057), the card of `rd-kuriboh` (`:218`) | yugioh.com: Cyber Dragon lists Zane Truesdale; Kuriboh lists Yami Yugi, Yugi Muto |
| 17 | `legends` Legends | Yami Yugi and Seto Kaiba, with Solomon Muto as host | **Exodia the Forbidden One** (33396948) and **Blue-Eyes Ultimate Dragon** (23995346; Fusion Monster) | The cards of the three levels (`levels.ts:221-223`). In the app. | | yugioh.com: Exodia lists Adrian Gecko, Yami Yugi, Yugi Muto; Blue-Eyes Ultimate Dragon lists Seto Kaiba, Yami Yugi. Grandpa is not listed for Exodia. |
| 18 | `final` The Extra Deck duel | Yami Yugi and Seto Kaiba watching | the child's own Extra Deck | | | |

Notes:

- **Changed from the previous note's mapping:** Joey moved from `shield` to `reading` with Time Wizard;
  Grandpa's card is Blue-Eyes White Dragon, which the official site ties to him, not Kuriboh; Exodia goes to
  Yami Yugi; Dark Magician Girl is dropped (not confirmed for Mai or Téa); Pegasus becomes an alternate on
  `ritual`; Zane Truesdale is new on `words`.
- yugioh.com shows Flame Swordsman as a "Normal Monster" (the anime's version); in the card databases and in
  the app it is a Fusion Monster (`cards.ts:153`). The app follows the real card.
- **Ids of the other real cards already in the app**, for the art list: Polymerization 24094653, Black Luster
  Ritual 55761792, Gaia Knight, the Force of Earth 97204936, Gem-Knight Pearl 71594310, LANphorhynchus 77637979,
  Flash Knight 17390179, Mountain 50913601, Sakuretsu Armor 56120475, Dimensional Prison 70342110, Pot of
  Desires 35261759, Flame Manipulator 34460851, Masaki the Legendary Swordsman 44287299, Tune Warrior 74093656,
  Dragong 83980492, Mandragon 19474136, Lightning Vortex 69162969, Fissure 66788016, Upstart Goblin 70368879,
  Right Arm of the Forbidden One 70903634, Left Arm 7902349, Right Leg 8124921, Left Leg 44519536.

### 7.5 Signature cards the levels do not use (assumption A3)

Six signature cards are not in the app: Time Wizard, Harpie's Feather Duster, Elemental HERO Flame Wingman,
Stardust Dragon, Decode Talker, Odd-Eyes Pendulum Dragon.

- **Shown by the trainer.** In the dialogue the trainer presents the card as their own ("This is my Time
  Wizard"). The child does not play it on that island.
- **Given as the island's reward.** When the island is finished, its signature card joins the binder. This is
  the previous note's option R2. **Nothing new is stored:** an island is finished when `islandStatus` is
  `"done"` (`status.ts:9-13`), so the binder shows `album(progress)` plus the signature card of every finished
  island.
- **Display-only cards.** These six are not added to `CARDS` (`cards.ts:115`), so the rules engine and its
  tests are untouched. They live in a small separate list with a name, a type line, the printed text and a
  picture id, and are drawn by the same card component in a read-only form.
- On islands whose signature card the child already plays (Dark Magician, Black Luster Soldier, Utopia and the
  others), the reward is that card with a gold border.
- **Optional later work: a level around each card.** Time Wizard would need a coin toss, and the engine has no
  chance element today (`cards.ts:4-36` lists every effect). A fair version for a puzzle would fix the result
  of the toss in the level's setup. Not planned.

### 7.6 Languages

- **Hebrew** keeps the English card names and wording, with the meaning underneath, as the cards already do
  (`copy.englishCards`; `mini-board.tsx:107`). Trainer lines in Hebrew say "Time Wizard" in Latin letters,
  marked `lang="en"`.
- **French** stays as it is: French card names from Konami's database (`docs/academy-junior-play.md:79`). The
  six new signature cards and the 14 Normal Monsters of §6 need their French names from the same place; they
  were not read today.
- **Characters' names:** default F6.
- The copy is the real work: a greeting and a line per finished island for each trainer, in three languages.

---

## 8. Implementation plan

Ordered slices. Each can be reviewed and shipped by itself. Estimates are rough, for an AI coding agent with the
owner reviewing screenshots. **Nothing below was built, run or tested.** Before writing code, read the Next.js
docs in `apps/academy-ygo/node_modules/next/dist/docs/`, as `apps/academy-ygo/AGENTS.md` asks. Other sessions
edit this tree; prefer new files.

### Slice 1: the profile list and slot storage (0.5 to 1 day)

- **Create** `src/lib/junior/profiles.ts`: the types of §2.2; `PROFILES_KEY`; `slotKey(slot)` returning
  `PLAY_PROGRESS_KEY` for slot 1 and `${PLAY_PROGRESS_KEY}:slot-2` / `:slot-3`; `loadProfiles(storage)`
  (forgiving; synthesizes slot 1 when today's key exists and the entry is missing); `saveProfiles`;
  `createSlot`, `deleteSlot`, `touchSlot`; `slotStorage(storage, slot): PlayStorage` (the wrapper);
  `cleanName(raw)` (§2.4); `isSameSave(profiles, slot, createdAt)`.
- **Create** `src/lib/junior/profiles.test.ts`.
- **No change** to `progress.ts`.
- **Acceptance:** a device with only today's key shows slot 1 as existing with every solved level; slots 2 and
  3 never read or write today's key; a broken profile list yields three empty slots plus the legacy slot 1 and
  does not throw; `cleanName` keeps "נועה" and "Zoé", cuts at 12 characters, removes emoji; deleting slot 1
  removes today's key.

### Slice 2: the title screen, the tiles, New game and Continue (1.5 to 2 days)

- **Create** `src/components/junior/home/junior-home.tsx` (the steps of §2.3), `save-tile.tsx`,
  `confirm-dialog.tsx`, `name-step.tsx`; `src/lib/junior/home/copy.ts` with English, French and Hebrew.
- **Change** `src/app/page.tsx:1-6`: render `<JuniorHome />`.
- **Change** `src/components/junior/play/junior-play.tsx`: accept optional props `storage?: PlayStorage`,
  `storageKey?: string` and `onChangePlayer?: () => void`; use them at `:54`, `:60`, `:74-75` in place of
  `getStorage()` and `PLAY_PROGRESS_KEY`; before `savePlayProgress` at `:54`, call the stale-save guard. With no
  props it behaves as today, so its existing tests keep passing.
- **Change** `src/components/junior/world/island-world.tsx:123`: the `corner` slot also receives the "change
  player" button (it is passed in from `junior-play.tsx:152-156`).
- **Create** tests for `JuniorHome`.
- **Acceptance:** first visit shows the title, the tagline, **New game**, a disabled **Continue** and three
  empty tiles; the server HTML and the first client render are identical (no hydration warning in the console);
  New game leads to the character choice, the nickname, then the map; a reload then shows the tile with
  character, nickname, "0 of 18" and "today"; a second child gets slot 2 and the first child's progress is
  untouched; with three saves, New game asks which to replace and confirms (A2); in a private window one
  **Play** button and the notice appear; every control is reachable by keyboard and at least 48 pixels high;
  Hebrew lays out right to left.

### Slice 3: keeping saves on iPad and iPhone (1.5 to 2.5 days)

- **Create** `src/lib/junior/save-code.ts` (`encodeSave`, `decodeSave`, `cleanImported`, FNV-1a) and its test.
- **Create** `src/components/junior/home/manage-save.tsx`: rename, change character, save a copy (file, share,
  copy), load a copy, delete, and the persistence line.
- **Create** `src/app/manifest.ts` (§3.4) and the icon files it names in `public/`.
- **Change** `junior-home.tsx`: call `navigator.storage.persist()` on slot creation; show the Add to Home Screen
  hint for parents. **Change** `junior-play.tsx:98`: call it again after the first solve.
- **Acceptance:** a code exported from one browser and pasted into another recreates the save with every solved
  level and star; a code with one character removed is refused with a plain message; loading into an existing
  save never removes a solved level; a code containing an unknown level id loads without it; on an iPad, the
  site added from the Share menu opens without Safari's bars, and a copy saved in Safari loads in it. **The
  last check needs a real iPad** and is the first real-device test of this project.

### Slice 4: official card art (2 to 3 days)

- **Create** `src/lib/junior/play/card-art.json` (ids from §6.2 and §7.4), `scripts/cards/build-art.mjs`, and
  the generated `src/lib/junior/play/card-art.ts`.
- **Change** `package.json:5-13`: script `"cards:art": "node scripts/cards/build-art.mjs"`; dev dependency
  `sharp` (the owner installs).
- **Change** `src/components/junior/play/mini-board.tsx:85-87` and `:104-106`: draw the picture when the card
  has one, else the emoji.
- **Change** `next.config.ts`: a `headers()` entry for `/cards/:path*`.
- **Change** the texts of §5.1: `src/components/site-footer.tsx:44-49`, `src/lib/i18n/ui-fr.ts:11`,
  `src/lib/i18n/ui-he.ts:11` (new keys for the new sentences), `cards.ts:68`, `:142`, `mini-board.tsx:74`,
  `themes.ts:6`, `docs/academy-junior-world.md:32`, `docs/academy-junior-play.md:78-80`.
- **Acceptance:** the script run twice downloads nothing the second time; no request to `ygoprodeck.com` appears
  in the browser's network panel on any page; Dark Magician shows its art on the board and in the album; an
  original Spell still shows its emoji; the footer shows the new text in the three languages and
  `coverage.test.ts` passes; in Hebrew the card name is still English with the meaning underneath.

### Slice 5: real Normal Monsters (1 to 2 days, mostly words and tests)

- **Change** `cards.ts:116-129`: the numbers of §6.2 (Moss Beetle 800/2000; Iron Boar DEF 1000; Mountain Bison
  DEF 2450; Mud Toad DEF 500; Night Bat DEF 800 and no `type`; Storm Stag DEF 1200; Pebble Crab Level 3).
- **Change** `levels.ts:210` (`pe-between`): the Level 2 monster in the hand and `lp: 3200`.
- **Change** the names in `copy-en.ts:7-20` and the level texts that name a card (31 lines in `copy-en.ts`), and
  the same in `copy-fr.ts` and `copy-he.ts`; check `ri-first` and the hints for quoted numbers (§6.2).
- **Add** the 14 ids to `card-art.json` and run the art script.
- **Then, separately:** rename the card ids across `cards.ts`, `levels.ts`, the copy files and the tests.
- **Acceptance:** every level's stored `solution` (`levels.ts`) still reaches its goal when replayed through
  the engine (whether the present suite already replays every solution was not checked; add that test if it
  does not); `pe-between` is solved by Normal Summoning the Level 2
  card; a save made before the change opens with the same solved levels and the same album size.

### Slice 6: the reward reveal and the binder, with art (2 to 3 days)

- As the previous note §3.2, R1 and R4: the seam is `onSolved` (`junior-play.tsx:98`) and the result block in
  `level-player.tsx`; the binder is a button in the map's corner (`island-world.tsx:123`).
- **Add** the island's reward card (§7.5): `src/lib/junior/world/trainers.ts` (the table of §7.4 as data) and a
  display-only card list for the six cards not in `CARDS`.
- **Acceptance:** after a first solve the new cards are shown once with their art; replaying shows nothing new;
  finishing island 8 puts Time Wizard in the binder; the tile's "cards earned" matches the binder.

### Slice 7: the character choice (0.5 to 1 day)

- **Create** `scripts/world/build-heroes.mjs` (§4.3) and `package.json` script `world:heroes`; outputs
  `public/world/hero-{knight,mage,rogue}.glb` and the three still pictures.
- **Create** `src/components/junior/home/choose-avatar.tsx`.
- **Acceptance:** each hero file is under 0.5 MB and contains exactly four animations; the choice screen loads
  no `.glb`; the chosen picture appears on the save tile; the choice can be changed in the manage view.

### Slice 8: the walking character (3 to 5 days)

- As the previous note §2.5, loading `/world/hero-${avatar}.glb` after the islands. Try it on the family iPad
  and an iPhone, the reference devices now (D6).

### Slice 9: trainers (3 to 5 days, mostly copy; portraits when delivered)

- **Create** `src/components/junior/world/trainer-talk.tsx` (round picture, name plate, bubble) and the trainer
  lines in three languages; the round picture is `portrait` when present, else the signature card's art.
- **Change** `island-world.tsx:115-122`: show the trainer for the focused island; the card panel in
  `world-scene.tsx`.
- **When the drawings arrive:** add the files of §7.3 and fill `portrait` in `trainers.ts`. No other change.
- **Acceptance:** each of the 16 islands with a trainer shows the name and a line in the three languages; with
  no portrait file the card art shows; with the files present the portraits show; the canvas still contains no
  words.

**Total, without the commission and the optional levels:** about 15 to 25 working days (estimate).

**How this re-orders the previous note's plan.** Its step 1 (say what the map is for) is absorbed by the title
screen and the trainers. Its step 2 (reward moment) comes after the art pipeline, so it is built once. Its step
3 (walking character) is unchanged but follows the choice. Its step 5 (original mentors) is dropped: the KayKit
adventurers are now the player only. Its step 6 (named characters and official artwork, "not a coding task") is
in scope as slices 4, 6 and 9. Saving, which that note did not need, now comes first, and its durability work
is part of it because the children are on iPads.

---

## 9. Remaining open questions for the owner

1. **Please confirm the three assumptions of §0.2:** a typed, optional nickname; the child picks a save to
   replace and confirms; signature cards are shown by the trainer and given as the island's reward.
2. **Is the site's address final?** Changing it later loses every save (§3.1).
3. **The three avatars:** Knight, Mage, Rogue without weapons, once you have seen them.
4. **Storm Stag:** Ally of Justice Clausolas with no level changed, Luster Dragon #2 with nine Life Point
   changes, or keep Storm Stag as the one original monster (§6.2)?
5. **Glow Charm into Red Medicine** (§6.3): do it with the monsters?
6. **How many portraits to order first:** 12 (one each) or 36 (three expressions each)? Pegasus too?
7. **The footer text** of §5.6: acceptable? Should a lawyer read it?
8. **Corrections to the trainer table** (§7.4), especially `shield`, `synchro`, and the two pairings that could
   not be confirmed officially (Playmaker, Yuya).
9. **Any default of §0.3 you want changed:** sound per child, Kaiba beside Nox, names in Latin letters, first
   picture of multi-art cards, private repository.

---

## 10. Unverified / could not confirm

- **Nothing was built or run.** No slot was stored, no character trimmed, no picture encoded, no level replayed,
  no screenshot taken. Every effort figure, the trimmed character size, the picture sizes and the repository
  growth are estimates.
- **The Normal Monster swap was checked by reading, not by running.** Level effects were worked out from the
  setups and solutions in `levels.ts`. The level texts and hints in the three copy files were not read for
  quoted numbers or for "6 + 2 = 8" in `ri-first`. The two whole duels were not replayed. That no level puts
  Iron Boar, Mountain Bison, Mud Toad, Night Bat or Storm Stag in Defense Position was checked in `levels.ts`
  only; a child can still change a position by hand in an open duel. The French names of the 14 monsters were
  not read. Only four of the 14 were read in Konami's database (Silver Fang, Sky Scout, Cosmo Queen, Saggi the
  Dark Clown); the rest are YGOPRODeck's data.
- **Browser storage.** Only MDN and three WebKit blog posts were read; the WHATWG Storage Standard and Chrome's
  and Firefox's own documentation were not. **Whether a granted `persist()` exempts a site from Safari's
  seven-day rule is not stated. Whether a Home Screen web app shares Safari's saves or starts empty is not
  stated** on the pages read; the design assumes it starts empty. Whether the 2020 rule is unchanged in current
  Safari was not tested. MDN gives two figures for Web Storage ("10 MiB of data maximum" and "5 MiB ... per
  origin" each); both are quoted as written. `navigator.storage.persisted()` was not read.
- **iOS behaviour not checked at any source:** that Safari zooms on a text field smaller than 16 pixels; that a
  `Blob` download, `navigator.share` and `navigator.clipboard.writeText` each work in Safari on iPad and iPhone.
  Nothing was tried on a real device.
- **Quotations.** The fetch tool shortens long passages and reported a 125-character limit on some pages. The
  WebKit seven-day rule, the YGOPRODeck sentences, the GitHub billing sentence and the yugioh.com descriptions
  came back in fragments; read them at the source before relying on them.
- **Next.js.** Quotes are from the docs shipped in `node_modules/next/dist/docs/` for the installed version.
  `headers()` in `next.config.ts`, the `manifest` file convention's own page and the icon file conventions were
  not read. Using the History API for Back inside one route was not tried.
- **KayKit characters.** All five files were measured; none was rendered. The sample pictures were listed, not
  opened. The trimming was not tried with glTF Transform. That the five skeletons are identical is inferred from
  equal joint counts and equal animation byte totals.
- **YGOPRODeck.** Four card-facts calls were made today (50 named cards, all Skill Cards, all Normal Monsters,
  23 more named cards). One whole-card picture (the Skill Card "Grit") was downloaded to a temporary folder,
  looked at and deleted. The pixel dimensions of the picture sets were not read. No terms page beyond the API
  guide was found, as before.
- **yugioh.com.** Card pages for Decode Talker and Odd-Eyes Pendulum Dragon were not found: the addresses tried
  returned another card's page. A character page for Playmaker was not found at the address tried. The
  "Characters" section of a card page is an association, not a statement of ownership. Pages for Mai Valentine,
  Maximillion Pegasus, Zane Truesdale, Yusei Fudo and Yuma Tsukumo were not opened; their names appear on the
  card pages that were. Mirror Force, Lord of D., Obelisk the Tormentor, Gagaga Magician, Link Spider, Firewall
  Dragon, Stargazer Magician, Timegazer Magician and Dark Magician Girl were not checked there.
- **Rights.** Nothing new was read about Konami's practice towards fan sites. No first-party text was found that
  asks fan sites for a given disclaimer; the footer wording is ours. Whether the "Duelists Unite" credit is
  required of API users is unclear. Whether non-commercial use changes anything in Konami's position was not
  found in any source. The anime site's terms and Konami's website terms are quoted from the previous note and
  were not re-read today.
- **Public repository.** Whether the repository is public today was not checked. Vercel's pages on the Hobby
  plan and fair use were fetched, but the tool returned no sentence about non-commercial use or about public
  and private repositories; what the hosting plan requires of a non-commercial site was therefore not
  established. Only one sentence fragment of GitHub's billing page was returned.
- **Repository.** `level-player.tsx`, `mini-board.tsx`, `world-scene.tsx`, `cues.ts` and the copy files were
  read in part or by search. Line numbers are from today's uncommitted files and will move. That
  `coverage.test.ts` flags an untranslated footer sentence is taken from the landing note.

---

## Appendix: primary sources consulted (all accessed 2026-11-19)

- **MDN:** "Storage quotas and eviction criteria"; `Window.localStorage`; `StorageManager.persist()`.
- **WebKit blog:** "Full Third-Party Cookie Blocking and More" (24 March 2020); "Web Push for Web Apps on iOS
  and iPadOS" (16 February 2023); "Updates to Storage Policy" (10 August 2023).
- **React docs:** `useSyncExternalStore`.
- **Next.js docs shipped with the installed package** (`apps/academy-ygo/node_modules/next/dist/docs/01-app/`):
  `02-guides/preventing-flash-before-hydration.md`, `02-guides/progressive-web-apps.md`,
  `02-guides/static-exports.md`, `02-guides/lazy-loading.md`,
  `01-getting-started/04-linking-and-navigating.md`, `01-getting-started/12-images.md`,
  `03-api-reference/02-components/image.md`, `03-api-reference/03-file-conventions/public-folder.md`,
  `03-api-reference/04-functions/use-search-params.md`.
- **KayKit (Kay Lousberg):** GitHub file tree and `LICENSE.txt` of
  `KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0` at commit `672074b`; the five files under
  `Characters/gltf/` (measured in a temporary folder outside the repo, then deleted).
- **YGOPRODeck:** API guide; `cardinfo.php` four times (50 cards by name; `type=Skill Card`; `type=Normal
  Monster`; 23 cards by name); headers of three picture addresses for one card; one Skill Card picture (viewed
  in a temporary folder, then deleted).
- **Konami:** `db.yugioh-card.com` card search, seven queries (Time Wizard, Decode Talker, Odd-Eyes Pendulum
  Dragon, Sky Scout, Saggi the Dark Clown, Cosmo Queen, Silver Fang); `yugioh.com` character list and the pages
  of Yami Yugi, Joey Wheeler, Seto Kaiba, Solomon Muto and Yuya Sakaki; `yugioh.com/cards/` pages for Time
  Wizard, Thousand Dragon, Red-Eyes B. Dragon, Flame Swordsman, Shield & Sword, Dark Magician, Kuriboh, Giant
  Soldier of Stone, Black Luster Soldier, Exodia the Forbidden One, Blue-Eyes White Dragon, Blue-Eyes Ultimate
  Dragon, Harpie's Feather Duster, Relinquished, Elemental HERO Flame Wingman, Stardust Dragon, Junk Warrior,
  Number 39: Utopia, Cyber Dragon, Battle Ox and Saggi the Dark Clown.
- **GitHub docs:** "GitHub Actions billing". **Vercel docs:** "Fair Use Guidelines", "Vercel Hobby Plan" (no
  usable sentence returned).
- **This repository at `8a528d2` (working tree):** `apps/academy-ygo/package.json`, `next.config.ts`,
  `.gitignore`, `vercel.json`, `AGENTS.md`, `README.md` (by search), `scripts/world/build-kit.mjs`,
  `public/world/`, `src/app/page.tsx`, `layout.tsx`, `not-found.tsx`, `junior/page.tsx`, `src/lib/brand.ts`,
  `src/components/site-header.tsx`, `site-footer.tsx`, `site-footer.test.tsx`, `src/lib/i18n/ui-fr.ts` and
  `ui-he.ts` (by search), `locales.ts` (by search), `src/components/junior/play/junior-play.tsx`,
  `mini-board.tsx` (in part), `src/components/junior/world/island-world.tsx`,
  `src/lib/junior/play/progress.ts`, `cards.ts`, `levels.ts` (lines 60 to 255), `copy-en.ts` (in part),
  `src/lib/junior/progress.ts`, `src/lib/junior/world/status.ts`, `themes.ts`; `apps/duel-nextjs/CONTEXT.md`,
  `scripts/mirror-images.ts`, `src/server/images/mirror.ts`,
  `src/app/api/card-image/[imageId]/[size]/route.ts`, `src/shared/api-types.ts`, `src/server/cards/ingest.ts`
  and `formats.ts` (in part or by search); `CONTEXT-MAP.md` (the academy has no `CONTEXT.md`);
  `docs/academy-junior-world.md`, `docs/academy-junior-play.md` (in part),
  `docs/open-questions/2026-11-19-02h30.md`, and the research notes named at the top.
