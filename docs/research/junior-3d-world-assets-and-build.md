# Academy Junior: building a full 3D island world with no artist (assets, tools, verification)

> **Date of observation:** 2026-11-19. Every web page, registry record, repository file and licence text cited below
> was fetched that day. The repository was read on `main` at HEAD `8a528d2`, with uncommitted changes from other
> sessions in the tree; code claims describe the files as they stood that day.
> **Nature of this document:** a research note. No code was changed, nothing was installed, nothing was added to
> the repo except this file, nothing was published. No 3D scene was built or run.
>
> **The decision this note starts from (owner):** the world must be **full 3D**, a place the child moves through,
> not 2.5D pictures. There is **no artist**. The AI coding agent must find the assets on the internet and assemble
> the world itself. So every step must be doable by an agent that writes code, runs command-line tools and
> downloads files, but cannot use a program like Blender by hand and cannot hand-model.
>
> **Relation to the first note.** [junior-3d-island-world.md](./junior-3d-island-world.md) established that a 3D
> world is feasible in the browser with React Three Fiber on three.js, how it loads in Next.js, the WebGL 2 base,
> the accessibility rules (real HTML buttons, the list as fallback, no words inside the scene) and the mapping
> onto the existing progression. None of that is repeated here. This note answers what was left open there:
> "who makes the islands" (its §5 and §9, step 4).
>
> **Sourcing rule used:** each external claim is followed by the page that owns it (the asset author's own page
> and licence file, the vendor's own docs or terms, the project's own repository or npm registry record). Claims
> about this repo cite the file. Figures marked **[measured]** were obtained that day as described next to them.
> Proposals, estimates and judgements are labelled **(ours)**. What could not be confirmed at a primary source is
> listed in [§9](#9-unverified--could-not-confirm) and is not stated as fact.
> **This is not legal advice.** §2 reports what Konami's published terms say; it does not replace a lawyer.

---

## 0. Short answer

**Yes, an agent can build it, on one condition: the world is made of ready-made kit pieces, not of original
models.**

1. **Assets.** Use **one family of packs from one author: KayKit, by Kay Lousberg.** Every KayKit pack opened is
   CC0 (public domain: commercial use allowed, no credit required), ships glTF files directly (no conversion), and
   all models share one tiny colour texture, so they look like one world. Ten KayKit packs are also on GitHub,
   where each file has a plain download URL with no login (§1).
2. **How the world is made.** The agent writes the island as data (a grid of hexagon tiles, plus trees, houses and
   stops, with coordinates), a small script glues the pieces into one file per island, and three.js draws water
   and sky from code. No Blender is needed for this path (§3).
3. **How the agent checks its work.** It takes screenshots of the running scene with Playwright and looks at them,
   reads the renderer's counters (draw calls, triangles), and unit-tests the layout data. The repo already has
   Playwright in the duel app, not in the academy (§6).
4. **What "full 3D" should be for ages 6-10.** A real 3D archipelago where a small boat and a character move, but
   **on rails**: the child taps where to go, the boat sails there, the camera follows. No joystick, no physics.
   Free steering can be added later on top of the same world (§5).
5. **What to avoid.** 3D models of Yu-Gi-Oh! monsters or characters from fan uploads, and AI-generated models as
   the main source of art (§2, §4).

**Honest limits.** The islands will look like a tidy, cute, generic fantasy kit. They will not look like
Yu-Gi-Oh! and they will not have a unique art style. Nothing here was built: the sizes are measured on real files,
but frame rate on a child's tablet is still unknown until a spike runs (§7, §9).

---

## 1. Asset sources an agent can actually use

### 1.1 Summary table

"Agent-downloadable" means: a file URL that works with a plain HTTP request, with no login and no button to
click. Style is our judgement **(ours)**.

| Source | Licence, in its own words | Commercial / children's product | Credit required | Formats | Agent-downloadable | Style |
| --- | --- | --- | --- | --- | --- | --- |
| **KayKit (Kay Lousberg)** | "Free for personal and commercial use, no attribution required. (CC0 Licensed)" (each pack page, §1.2). The licence file inside the pack: "License: (Creative Commons Zero, CC0)", "free to use in personal, educational and commercial projects" (<https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0/HEAD/LICENSE.txt>) | Yes. CC0 has no field-of-use limit. | No ("this is not mandatory", same file) | "Included files are .FBX, .GLTF, and .OBJ" (pack pages) | **Yes for 10 packs**: mirrored on GitHub under the user `KayKit-Game-Assets` (<https://api.github.com/users/KayKit-Game-Assets/repos>), so every file has a `raw.githubusercontent.com` URL. The other packs are on itch.io only (see §9). | One author, one look. "Textured using a single gradient atlas texture (1024x1024) that can be downsampled to 128x128" (<https://kaylousberg.com/game-assets/medieval-hexagon>). |
| **Kenney** | "all game assets on the asset pages are public domain licensed (CC0)"; "Attribution is not required" (<https://kenney.nl/support>). Each pack page opened shows "Creative Commons CC0" (§1.3). | Yes: "You're free to use them, even in commercial projects" (same page) | No | **Not stated on the pack pages** (§9) | **Not directly.** The Download button opens a donation pop-up; the page script then calls `https://kenney.nl/download-link/<id>` to "Request a fresh signed link" (inline script of <https://kenney.nl/assets/pirate-kit>). A plain request to that address returned `{"error":"forbidden"}` **[measured]**. | One author, very consistent, flatter and simpler than KayKit. |
| **Quaternius** | "All models are under the CC0 License" (<https://quaternius.com/faq.html>). Pack pages show "CC0" (§1.3). | Yes: "free to use in personal and commercial projects" (<https://quaternius.com/packs/ultimatefantasyrts.html>) | No: "attribution is not necessary" (FAQ) | Newer pack pages list "FBX, OBJ, Blend, glTF"; the FAQ still says ".blend" and "FBX" | **Not confirmed.** The download buttons are in-page anchors; the file host was not visible (§9). Newer "MegaKit" packs give "60-70%" free and the rest to paying supporters (<https://quaternius.com/packs/stylizednaturemegakit.html>). | One author, but the look changed over the years (84 packs listed on <https://quaternius.com/>). Mix only packs from the same period. |
| **Poly Haven** | "Our assets are all licensed as CC0"; "You do not need to give credit" (<https://polyhaven.com/license>) | Yes: "any purpose" | No | Not read for models | Yes: a public API, "Free to use for any purpose, personal or commercial" (<https://github.com/Poly-Haven/Public-API>) | **Wrong style for this job (ours):** realistic scanned models and textures. Useful only for sky images, if one is ever wanted. |
| **Poly Pizza** | No site-wide licence. The terms say you "agree to adhere to the terms of the Creative Commons license that applies at the time of download" (<https://poly.pizza/docs/tos>). Per model it is CC0 or CC-BY (first note, §5.3). | Model by model | For CC-BY models, yes | Not confirmed today | **Risky.** The terms forbid to "scrape the Services, scrape Content from the Services, or use automated means" (same page). An API page exists (`/docs/api/v1.1`) but its text could not be read (§9). | A mix of many authors. It re-hosts Kenney and Quaternius models, so it adds little. |
| **OpenGameArt** | Uploads carry CC0, CC-BY, CC-BY-SA, OGA-BY or GPL (<https://opengameart.org/content/faq>) | "Yes, you can use this art. Even in commercial projects", under each licence's terms (same page) | Yes, except for CC0 | Any; set by each uploader | Not checked | Patchwork. And a trap: for CC-BY and CC-BY-SA the FAQ says the work "may not be not used on distribution networks that use some form of Digital Rights Management", naming Apple iOS. Use CC0 items only. |
| **Sketchfab** | Per model. Free-download Creative Commons terms could not be read at a primary page, as in the first note (§9). | Model by model | Usually (CC-BY) | "Models are available in glTF, GLB, and USDZ formats" through the API (<https://sketchfab.com/developers/download-api>) | **No.** "Downloading models requires users to be authenticated with a Sketchfab account" (same page). | Patchwork. Also where most fan-made Yu-Gi-Oh! models are found (§2): avoid. |
| **itch.io** | Set by each creator on each page; itch.io's own FAQ says nothing general about it (<https://itch.io/docs/creators/faq>) | Page by page | Page by page | Page by page | Not confirmed (§9) | Patchwork. It is where KayKit and Kenney host their packs. |

### 1.2 KayKit packs opened that day

All figures and quotations are from each pack's own page on `kaylousberg.com`. Every page below carries the same
sentence: "Free for personal and commercial use, no attribution required. (CC0 Licensed)".

| Pack | Page | What is in it (as the page says) | On GitHub (direct file URLs) |
| --- | --- | --- | --- |
| **Medieval Hexagon** | <https://kaylousberg.com/game-assets/medieval-hexagon> | "over 200 stylised medieval hexagonal tiles, buildings, and props" | Yes: `KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0` |
| **Dungeon Remastered** | <https://kaylousberg.com/game-assets/dungeon-remastered> | "Over 200" dungeon assets and props | Yes: `KayKit-Dungeon-Remastered-1.0` |
| **Halloween Bits** | <https://kaylousberg.com/game-assets/halloween-bits> | Over 60 models | Yes: `KayKit-Halloween-Bits-1.0` |
| **Space Base Bits** | <https://kaylousberg.com/game-assets/space-base-bits> | 48 or more models | Yes: `KayKit-Space-Base-Bits-1.0` |
| **Characters: Adventurers** | <https://kaylousberg.com/game-assets/characters-adventurers> | "5 (+3 in the EXTRA tier)" characters, "fully rigged and animated", ".FBX, .GLTF" | Yes: `KayKit-Character-Pack-Adventures-1.0` |
| **Characters: Skeletons** | <https://kaylousberg.com/game-assets/characters-skeletons> | 4 skeleton characters (+2 in the EXTRA tier) | Yes: `KayKit-Character-Pack-Skeletons-1.0` |
| **Forest Nature Pack** | <https://kaylousberg.com/game-assets/forest-nature-pack> | Free tier: "100+ models of trees, rocks, bushes, and grass" | No: itch.io only (<https://kaylousberg.itch.io/kaykit-forest>) |
| **Platformer Pack** | <https://kaylousberg.com/game-assets/platformer> | 120 unique designs, 370 with recolours | No: itch.io only |
| **Resource Bits** | <https://kaylousberg.com/game-assets/resource-bits> | "75+ Low poly optimized 3D models" | No: itch.io only |

The GitHub user also holds City Builder Bits, Furniture Bits, Prototype Bits and Restaurant Bits
(<https://api.github.com/users/KayKit-Game-Assets/repos>); their pack pages were not opened (§9). The itch.io page
of Medieval Hexagon confirms the same licence ("Creative Commons Zero v1.0 Universal"), a free tier of 33 MB with
"over 200 3D models", and paid tiers that add more models: Extra at "$9.99 USD or more" (150+ more assets:
"buildings, vehicles, units, horses") and Source at "$14.99 USD or more" (<https://kaylousberg.itch.io/kaykit-medieval-hexagon>).

**What the Medieval Hexagon pack really contains [measured].** Read from the GitHub file tree
(<https://api.github.com/repos/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0/git/trees/HEAD?recursive=1>):

- 221 `.gltf` models, each with a `.bin` file; the whole `gltf` folder is 12.7 MB before any compression.
- Tiles: grass (flat and sloped), water, 5 coast shapes, 15 road shapes, 15 river shapes (with and without water).
- Nature: mountains, hills, single trees and tree groups, rocks, water plants, two clouds.
- Buildings in four colours (blue, green, red, yellow, 18 each) plus 21 neutral ones: castle, towers, homes,
  church, market, windmill, lumber mill, barracks, walls, gates, bridges, a stage, scaffolding.
- Props: barrels, crates, a tent, a target, a weapon rack, a wheelbarrow, resources.
- The shared colour texture `hexagons_medieval.png` is **15,783 bytes**.

This one pack already gives an island its ground, its coast, its paths, its hills and its buildings, and the four
building colours give a free way to tell islands apart.

### 1.3 Other packs whose pages were opened

| Pack | Page | Licence on the page | Note |
| --- | --- | --- | --- |
| Kenney Pirate Kit | <https://kenney.nl/assets/pirate-kit> | "Creative Commons CC0" | 70 files; version 2.1 "Added fortress walls" |
| Kenney Nature Kit | <https://kenney.nl/assets/nature-kit> | "Creative Commons CC0" | 330 files; tags nature, tree, rock, foliage |
| Quaternius Stylized Nature MegaKit | <https://quaternius.com/packs/stylizednaturemegakit.html> | "CC0" | 116 models; ".FBX, .OBJ and .glTF formats"; part of the pack is for paying supporters |
| Quaternius Pirate Kit | <https://quaternius.com/packs/piratekit.html> | "CC0" | 71 models, "animated characters and environmental models" |
| Quaternius Ultimate Fantasy RTS | <https://quaternius.com/packs/ultimatefantasyrts.html> | CC0 | 128 models, "buildings in different evolution stages, along with nature assets" |

Other Kenney packs that would fit islands exist and returned a page that day (file counts read from the page
**[measured]**): Hexagon Kit (70), Castle Kit (75), Fantasy Town Kit (160), Watercraft Kit (45), Graveyard Kit
(90), Platformer Kit (150), Survival Kit (80), Tower Defense Kit (160), Space Kit (150), Mini Dungeon (30), Mini
Characters (40). Their licence line was not read one by one (§9).

### 1.4 Which single family (ours)

**KayKit.** Reasons, in order:

1. It is the only family where the licence, the glTF format and a no-login file URL were **all three confirmed**
   that day.
2. One texture for everything. One material means the pieces of an island can be merged into one object, which is
   what keeps a 3D scene fast (§5.4).
3. The hexagon tiles are a construction system. An agent has no eye for sculpting a coastline, but it can fill a
   hexagon grid from rules: water outside, coast on the edge, grass inside, a road through the stops. The result
   is correct by construction.
4. Its other packs (dungeon, Halloween, space base, characters) extend the same look to the darker and stranger
   worlds of the course.

**Kenney is the backup family**, with the same legal comfort, if the owner prefers its look. It then needs one
manual step: a person downloads the zip files once. Do not mix KayKit and Kenney in the same world.

---

## 2. Yu-Gi-Oh! intellectual property

### 2.1 What the app does today

| Fact | Where |
| --- | --- |
| Junior cards carry no artwork. Each card's picture is "A picture made of one emoji; decorative, never the only way a card is named." | `apps/academy-ygo/src/lib/junior/play/cards.ts:68` |
| Real cards appear "by their real names, numbers and text. The pictures stay emoji." | `apps/academy-ygo/src/lib/junior/play/cards.ts:142` |
| The real names and texts are "the ones in Konami's card database". | `apps/academy-ygo/src/lib/junior/play/copy-en.ts:32` |
| No image file, no `<img>` and no remote image URL anywhere in the academy sources (searched `<img`, `next/image`, `.jpg`, `.png`, `.webp`: no match). No `images` setting in the Next config. | `apps/academy-ygo/src`; `apps/academy-ygo/next.config.ts` |
| The footer says: "Duel Academy is not affiliated with or endorsed by Konami. Yu-Gi-Oh! is a trademark of Konami." | `apps/academy-ygo/src/components/site-footer.tsx:45` |

So the academy today uses Konami's **words** (card names and card text, to teach the rules) and none of Konami's
**pictures**.

### 2.2 What Konami publishes

- The official site's footer links its Terms of Use at <https://legal.konami.com/kdeus/btob/terms/tou/en/>. They
  cover the use of Konami's websites. They "permit you to use the Websites for your personal, non-commercial use
  only". "Any secondary or derivative uses of the Websites and/or their content", including "reproduction,
  adaptation, translation, modification, on-screen presentation, distribution, sale", are prohibited "without our
  prior written permission". On trademarks: "You must not use such marks without our prior written permission."
- The Community Code of Conduct says: "Intentionally purchasing or distributing infringing or pirated copies of
  KONAMI products is not allowed" (<https://www.yugioh-card.com/eu/code-of-conduct/>).
- **No fan-content policy was found.** A search limited to `konami.com` and `yugioh-card.com` returned only
  tournament policies, which speak of "Fan Content Areas" at events (filming at tournaments), not of fan-made
  games, art or 3D models. Konami does not appear to publish a permission of the kind some other game publishers
  do. Absence of a page is not proof that none exists (§9).

### 2.3 Safe and unsafe for the 3D world

| | Examples | Why |
| --- | --- | --- |
| **Safe (ours)** | Generic fantasy islands from CC0 kits: meadow, castle, village, graveyard, dungeon, star base. Islands told apart by colour and landscape. Themes taken from general ideas the game also uses (light and dark, fire and water, a dragon's mountain as a landscape with no dragon model). The island names already in the app. | CC0 assets carry no third-party rights, and nothing in them comes from Konami. |
| **Avoid** | Any 3D model of a Yu-Gi-Oh! monster or character (Blue-Eyes White Dragon, Dark Magician, Exodia, Kuriboh, the anime characters), from Sketchfab, Poly Pizza or anywhere else. Card artwork as a texture in the scene. The Yu-Gi-Oh! logo, the card back or the Millennium items as 3D objects. | A fan upload cannot give rights its uploader does not have: a "CC-BY" label on a fan-made Blue-Eyes does not make it free to use. Konami's published terms grant no such use (§2.2). |
| **Avoid** | Asking an AI model generator for a named Konami monster or "in the style of Yu-Gi-Oh!". | Same reason. Meshy's own terms also forbid using the service to "infringe upon or violate any third party rights, including intellectual property rights" (<https://www.meshy.ai/terms-of-use>). |

One point needs the owner's attention **(ours)**: the `legends` world is about real famous cards ("three dragons
in one, and the Forbidden One", `apps/academy-ygo/src/lib/junior/play/copy-en.ts:94`). Its island must suggest
"legend" with landscape only (a golden castle on the highest mountain), and must not show a dragon that could be
read as Blue-Eyes or a figure that could be read as Exodia.

---

## 3. Building the world without an artist

### 3.1 Four techniques an agent can do from code

| Technique | What the agent writes | What it is good for | Limits |
| --- | --- | --- | --- |
| **Kit composition** | A data file per island: which tile sits on which hexagon, which tree, house or prop sits where, at which rotation. A script turns the data into one model file. | The islands themselves. Correct by construction on a hexagon grid. | Only as varied as the kit. |
| **Procedural terrain** | A function that raises a grid of points with noise. three.js ships the helpers `ImprovedNoise.js` and `SimplexNoise.js` in `examples/jsm/math/` (present in <https://github.com/mrdoob/three.js/tree/dev/examples/jsm/math>). | The sea floor, far background islands, a volcano cone. | Hard to judge by an agent: a noise island can look wrong and no test will say so. Use sparingly. |
| **Primitives and flat materials** | Boxes, cones, cylinders and spheres with plain colours. | Markers, the path between stops, locks, stars, the "you are here" beacon, simple clouds. | Looks poor for buildings and characters. |
| **Water and sky from code** | three.js ships `Water.js`, "A basic flat, reflective water effect", which "can only be used with WebGLRenderer" (<https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/objects/Water.js>), and `Sky.js` in the same folder. | The sea between islands, the sky. | A reflective water draws the scene twice. For a tablet, a flat coloured plane with a light animated shader is the safer start (ours). |

### 3.2 What drei offers today

Read from the sidebar of the drei docs (<https://drei.docs.pmnd.rs/getting-started/introduction>), `@react-three/drei`
10.7.9 (<https://registry.npmjs.org/@react-three/drei/latest>). Names that matter for this job:

- **Staging:** `Sky`, `Stars`, `Cloud`, `Environment`, `Float`, `Sparkles`, `ContactShadows`, `Center`, `Bounds`.
- **Performance:** `Instances`, `Merged`, `Detailed`, `PerformanceMonitor`, `AdaptiveDpr`, `Preload`, `Bvh`.
- **Controls:** `CameraControls`, `MotionPathControls`, `KeyboardControls`, `PresentationControls`.
- **Loaders:** `Gltf / useGLTF`, `Ktx2 / useKTX2`, `Progress / useProgress`.
- **Misc:** `Html`, `DetectGPU / useDetectGPU`, `Stats`, `StatsGl`.

**There is no water or ocean component in drei's list.** Water comes from three.js itself (§3.1) or from a small
shader written for the app. `Instances` "allows you to define hundreds of thousands of objects in a single draw
call, but declaratively", "at the cost of CPU overhead" (<https://drei.docs.pmnd.rs/performances/instances>).

### 3.3 Command-line tools

"On this machine" is what a lookup on the owner's PATH showed that day: Node 22 and `npx` present; `blender`,
`gltfpack`, `FBX2glTF` and `toktx` absent; the Python on the PATH is 3.10.

| Tool | What it does | Licence | Install on Windows | Needed for the KayKit path? |
| --- | --- | --- | --- | --- |
| **glTF Transform CLI** | Commands include `inspect` ("Inspect contents of the model"), `validate` ("Validate model against the glTF spec"), `merge` ("Merge two or more models into one"), `join` ("Join meshes and reduce draw calls"), `palette` ("Creates palette textures and merges materials"), `dedup`, `prune`, `weld`, `simplify`, `quantize`, `meshopt`, `resize`, `webp` (<https://gltf-transform.dev/cli>). It is also a JavaScript library, so the island builder can be a Node script. | MIT, `@gltf-transform/cli` 4.5.1 (<https://registry.npmjs.org/@gltf-transform/cli/latest>) | "npm install --global @gltf-transform/cli" (same docs page), or a dev dependency | **Yes. The main tool.** |
| **gltfjsx** | Turns a GLB into a React Three Fiber component (first note, §5.2). | MIT, 6.5.3 | `npx gltfjsx` | Useful for animated characters. |
| **gltfpack** (meshoptimizer) | Optimizes glTF files: it "optimizes meshes, quantizes geometry, merges meshes to cut draw calls"; reads `.gltf`, `.glb`, `.obj`; `-cc` gives Meshopt compression (<https://meshoptimizer.org/gltf/>). | MIT | Release v1.3 (2026-09-25) has `gltfpack-windows.zip` (<https://api.github.com/repos/zeux/meshoptimizer/releases/latest>). Also on npm (`gltfpack` 1.3.0), but "Native binaries are recommended over npm" (docs page). | Optional. glTF Transform covers the same need. |
| **Blender, background mode** | `--background`: "Run in background (often used for UI-less rendering)". `--python <filepath>`: "Run the given Python script file" (<https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html>, Blender 5.3 manual). The glTF exporter is scriptable: its `export_format` and `export_draco_mesh_compression_enable` options are documented (<https://docs.blender.org/api/current/bpy.ops.export_scene.html>). Blender also exists as a Python module: `pip install bpy`, version 5.3.0, Python "==3.13.*" only, a 356 MB Windows wheel (<https://pypi.org/project/bpy/>). | GPL-3.0 (PyPI record) | Installer from blender.org (page not readable that day, §9), or the `bpy` wheel, which needs Python 3.13. | **No.** Needed only to convert FBX or .blend packs, or to render still pictures for the fallback. |
| **FBX2glTF** | "A command-line tool for the conversion of 3D model assets on the FBX file format to the glTF file format" (<https://github.com/facebookincubator/FBX2glTF>). | BSD 3-clause (same page) | The Godot fork publishes `FBX2glTF-windows-x86_64.zip`, v0.13.1, dated 2023-06-13 (<https://api.github.com/repos/godotengine/FBX2glTF/releases/latest>). npm has `fbx2gltf` 0.9.7-p1. Building it needs Autodesk's FBX SDK ("only version 2019.2 of the FBX SDK is supported"). | **No**, because KayKit ships glTF. |
| **KTX-Software** | "`ktx`", "a generic command line tool for managing KTX2 files with subcommands" such as `create`, `encode`, `transcode`, `validate` (<https://github.com/KhronosGroup/KTX-Software>). | Apache-2.0 (<https://raw.githubusercontent.com/KhronosGroup/KTX-Software/main/LICENSE.md>) | Release v4.4.2 has `KTX-Software-4.4.2-Windows-x64.exe` (<https://api.github.com/repos/KhronosGroup/KTX-Software/releases/latest>) | **No.** The whole world uses one 16 KB texture; there is nothing to compress. |

**Reading (ours):** the KayKit path needs exactly one tool, glTF Transform, and it is an npm package. That is the
strongest practical argument for KayKit: no Blender, no converter, no installer.

### 3.4 The build pipeline (ours)

1. **Fetch once.** A script downloads the chosen pack from GitHub at a fixed commit into a folder kept out of git,
   and copies the pack's `LICENSE.txt` next to the files.
2. **Describe.** One data file per island: hexagon coordinates to tile name and rotation; a list of decorations;
   the list of stops (one per level, from `levelsOf(world)`).
3. **Compose.** A Node script reads the data, places each piece, joins everything that does not move into one
   mesh, removes duplicates, quantizes and compresses, and writes one `.glb` per island.
4. **Check.** `gltf-transform validate` and `inspect` on each file; fail the build over a size or triangle budget.
5. **Ship.** The `.glb` files are static files served by the app. Note that the academy has no `public/`
   directory today (first note, §1); this would create it.

The source pack is never edited by hand, so the same script rebuilds everything when a layout changes.

---

## 4. AI-generated 3D models

### 4.1 What each service publishes

| Service | API | Output | Price as published | Who owns the output |
| --- | --- | --- | --- | --- |
| **Meshy** | Yes, on paid plans ("API & MCP"). Not on Free. `POST /openapi/v2/text-to-3d` (<https://docs.meshy.ai/en/api/text-to-3d>) | `glb`, `obj`, `fbx`, `stl`, `usdz`, `3mf`. Face count can be set (100 to 300,000). | The pricing page showed local currency: Free ₪0 with 100 credits a month; Pro ₪60 a month with 1,000 credits (<https://www.meshy.ai/pricing>). Per call: text-to-3D mesh 5 or 20 credits, texture 10, image-to-3D 5 to 35 (<https://docs.meshy.ai/en/api/pricing>). | **Free:** "Meshy owns all right, title, and interest" and gives the user a CC BY 4.0 licence, so credit to Meshy is required. **Paid:** "customers on a paid Meshy plan own their Customer Output" (<https://www.meshy.ai/terms-of-use>). |
| **Tripo** | Yes (<https://developers.tripo3d.ai/>) | "GLB, FBX, OBJ, USDZ and other mainstream formats" | "1 credit = $0.01 USD"; text to 3D "10-20 credits", image to 3D "20-30 credits" (same page) | **Not read**: the pricing and terms pages returned 403 (§9). |
| **Rodin (Hyper3D)** | "Full API access" on the Business plan (<https://hyper3d.ai/subscribe>) | Not stated on the pages read | Free $0; Creator $30 a month; Business $120 a month (same page) | Not stated as a licence. "Paid plans include broader export and usage rights." Free results may go to a public gallery (same page). |
| **Stability AI (Stable Fast 3D, SPAR3D)** | Yes: `POST https://api.stability.ai/v2beta/3d/stable-fast-3d` (<https://docs.stability.ai/api-reference/3d/stable-fast-3d.md>) | A binary glTF (`model/gltf-binary`). **Input is an image**, not text. | "1 credit = $0.01"; Stable Fast 3D 10 credits, SPAR3D 4 credits (<https://docs.stability.ai/pricing.md>) | Not stated on the pages read (§9). |
| **Hunyuan3D 2.1 (Tencent)** | Open weights to run yourself (<https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1>) | Shape and textures from an image | Free weights; about 10 GB of video memory for shape, 21 GB for texture, 29 GB for both (same page) | **Territory limit.** The licence "DOES NOT APPLY IN THE EUROPEAN UNION, UNITED KINGDOM AND SOUTH KOREA", and "You must not use, reproduce, modify, distribute, or display the Tencent Hunyuan 3D 2.1 Works, Output or results" outside its territory (<https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/LICENSE>). The academy has a French edition: **do not use.** |
| **TRELLIS.2 (Microsoft)** | Open weights to run yourself (<https://github.com/microsoft/TRELLIS.2>) | GLB, from an image | Free; needs an NVIDIA GPU "with at least 24GB of memory", "currently tested only on Linux" (same page) | Code and model MIT (same page). Not runnable on an ordinary Windows PC. |
| **Luma (Genie)** | Not found: the page at <https://lumalabs.ai/genie> no longer mentions Genie or text-to-3D (§9) | - | - | - |

### 4.2 Is it good enough for a children's world? (ours, unverified)

No model was generated for this note, so quality was **not tested**. What can be said honestly:

- **Style consistency is the weak point.** Each generation is a separate guess. Twenty generated houses will not
  share proportions, colours or level of detail the way twenty pieces by one author do. The first note's warning
  about patchwork (§5.3) applies even more here.
- **Generated models are heavy and need cleaning.** They come with their own textures, not the shared 16 KB
  palette, so they cannot be merged with the kit and each one costs a draw call and texture memory.
- **An agent cannot judge the result well.** It can check size and triangle count, not whether a creature looks
  friendly or frightening to a six-year-old. A person must look at every generated model.
- **Reasonable use:** at most a few "landmark" objects that no kit has, generated on a **paid** plan (so the app
  owns them and owes no credit), checked by the owner one by one. Not the base of the world.

---

## 5. What "full 3D" should mean here

### 5.1 Three options

| | (a) Guided camera | (b) Steered boat or character | (c) Free-roam open world |
| --- | --- | --- | --- |
| **What the child does** | Sees the archipelago in 3D. Taps an island: the camera flies there. Taps a stop: the level starts. | Drives a boat between islands and a character on them, with an on-screen stick. | Walks anywhere, in any direction, with a free camera. |
| **Libraries** | three, `@react-three/fiber`, `@react-three/drei` (`CameraControls`, "an implementation of the camera-controls library", <https://drei.docs.pmnd.rs/controls/camera-controls>). Nothing else. | As (a) plus `@react-three/rapier` (physics) and `ecctrl` (character and vehicle controller). | As (b) plus pathfinding for other characters (`three-pathfinding` 1.3.0 or `@recast-navigation/three` 0.44.0, both MIT, npm registry), terrain loading by distance, a camera that avoids walls. |
| **Fits React 19.2.8?** | Yes (first note, §3.1). | By declaration, yes. `@react-three/rapier` 2.2.0 peers: `react ^19`, `@react-three/fiber ^9.0.4`. `ecctrl` 2.0.2 peers: `react >=19.2.7`, `three >=0.184.0`, `@react-three/fiber >=9.4`, `@react-three/drei >=10.7`, `@react-three/rapier >=2.2.0` (<https://registry.npmjs.org/ecctrl/latest>). Not built or run (§9). | Same as (b). |
| **Touch for small children** | Taps only. Objects in the scene receive pointer and click events (<https://r3f.docs.pmnd.rs/api/events>); the real controls stay HTML buttons (first note, §7). | `ecctrl` ships a `Joystick` and a `VirtualButton` from `ecctrl/input`; "The built-in UI is just a DOM overlay" (<https://raw.githubusercontent.com/pmndrs/ecctrl/main/readme.md>). Keyboard through drei's `KeyboardControls`. A virtual stick is hard for a six-year-old (ours). | Two thumbs, one to move and one to look. Too hard for the youngest (ours). |
| **Collision** | None. | Rapier builds colliders from meshes: `"cuboid"`, `"trimesh"`, `"hull"`; `<Physics />` "needs to be wrapped in `<Suspense />`" because it loads WebAssembly (<https://raw.githubusercontent.com/pmndrs/react-three-rapier/main/packages/react-three-rapier/readme.md>). | Same, on a much larger world. |
| **Rendering cost** | Still most of the time, so `frameloop="demand"` works (first note, §6). | Moves all the time: continuous rendering while the child plays, plus physics each frame. Rapier offers `updateLoop="independent"`, which invalidates the canvas only when bodies move (same readme). | Continuous, with the largest scene. |
| **Extra download** | None beyond the engine. | The physics engine: `@dimforge/rapier3d-compat` is 15 MB unpacked on npm (registry record); its size over the wire was not measured (§9). | As (b), more models. |
| **Calm mode and fallback** | Jump cuts in place of camera flights; the present list (first note, §7.3). | The whole mode has no calm version: the fallback is (a) or the list. | Same. |
| **Effort (ours)** | 3 to 5 weeks for 18 islands (§7.4). | (a) plus 2 to 4 weeks. | Months. Not recommended. |
| **Main risk** | May feel like "a map", not "a world". | Children getting stuck, lost, or bored by sailing; heat and battery. | Scope. |

### 5.2 Recommendation for ages 6 to 10: "tap to travel" (ours)

Neither (a) nor (b) as written, but the point between them:

- The world is fully 3D and the child **does** move through it: a small boat carries a character from island to
  island, and the character walks from stop to stop.
- The child does not steer. **The child taps a destination** (an island, or the next stop) and the boat or the
  character travels there along a path that was laid out in advance. The camera follows from behind and above.
- So there is no joystick, no collision, no physics engine, no way to get lost or stuck, and every tap target can
  be large.
- The path is data: a list of points per island and between islands. It comes from the same island data as the
  tiles (the road tiles), so the agent can build and test it.
- Libraries: exactly those of option (a). drei's `MotionPathControls` and `CameraControls` exist for moving a
  camera along a path or to a point (drei sidebar, §3.2).
- Calm mode: the boat and the camera jump, with no travel animation.
- Later, if children ask to drive the boat, option (b) is added on the open sea only, on top of the same islands.
  Nothing built for "tap to travel" is thrown away.

Why not a joystick from the start: the youngest pilots are six, the screen may be a phone, and a level-select
that needs skill to operate puts a wall in front of the lessons. The lessons are the product.

### 5.3 A character and a boat (ours)

- **Character:** one of the five free KayKit Adventurers, "fully rigged and animated" with "Basic movement
  animations included" (<https://kaylousberg.com/game-assets/characters-adventurers>). The rival Nox can be one
  of the KayKit Skeletons, or an Adventurer in the red colour. An animated character cannot be merged into the
  island mesh; it costs its own draw calls.
- **Boat:** not confirmed in the free Medieval Hexagon tier (no boat in the file list read in §1.2; "vehicles" are
  named only in the paid Extra tier). Options: build a simple boat from primitives, or pay $9.99 for Extra (§9).

### 5.4 Performance budget

What the sources say:

- "Each mesh is a draw call"; "no more than 1000 as the very maximum, and optimally a few hundred or less".
  "Each geometry and material means additional overhead for the GPU"; "You should try to re-use resources"
  (<https://r3f.docs.pmnd.rs/advanced/scaling-performance>).
- "Share materials and geometries if you can"; "Fast updates are carried out in `useFrame` by mutation"; "Use
  deltas instead of fixed values so that your app is refresh-rate independent"
  (<https://r3f.docs.pmnd.rs/advanced/pitfalls>).
- Distant objects can be simpler: drei's `Detailed` "sets up LOD without boilerplate" (scaling-performance page).
- three.js exposes counters to check all this: `renderer.info.render.calls` is "The number of draw calls per
  frame", `render.triangles` "The number of rendered triangles primitives per frame", `memory.geometries` and
  `memory.textures` the active counts (<https://threejs.org/docs/pages/WebGLRenderer.html>).

What was measured on the real KayKit files **[measured]** (20 models downloaded from the GitHub mirror into a
temporary folder outside the repo; triangles counted from each file's index data; sizes compressed with gzip
level 9):

| Model | Triangles | Raw size | gzip |
| --- | --- | --- | --- |
| `hex_grass` (a ground tile) | 36 | 5.4 KB | 1.4 KB |
| `hex_water` | 24 | 4.5 KB | 1.1 KB |
| `hex_coast_A` | 100 | 8.7 KB | 2.9 KB |
| `hex_road_A` | 58 | 6.7 KB | 1.7 KB |
| `trees_A_large` (a group of trees) | 864 | 60 KB | 19 KB |
| `mountain_A_grass_trees` | 468 | 30 KB | 11 KB |
| `building_home_A_blue` | 1,011 | 58 KB | 20 KB |
| `building_church_blue` | 1,601 | 93 KB | 28 KB |
| `building_windmill_blue` | 2,653 | 149 KB | 55 KB |
| `building_castle_blue` (the heaviest seen) | 5,659 | 321 KB | 101 KB |
| **All 20 sampled models** | **23,127** | **1.30 MB** | **455 KB** |

Every sampled model uses one material and the one shared texture. That is what allows merging.

The budget this suggests **(ours, to be corrected by a real device)**:

| Item | Budget | How it is met |
| --- | --- | --- |
| Draw calls | Under 100 in view | One merged mesh per island (18), water, sky, boat, one or two animated characters, markers. |
| Triangles in view | Under 150,000 | A full island is about 15,000 to 30,000 (§7.2). Only the island being visited and its neighbours are drawn in full; far islands are drawn as a simplified copy (`gltf-transform simplify`) or hidden in mist. |
| Texture memory | Almost nothing | One 1024 x 1024 palette, which the author says can go down to 128 x 128. |
| Device pixel ratio | 1.5 at most on phones | As in the first note, §6. |
| Frames | None while nothing moves | `frameloop="demand"`; frames are drawn only during a trip. |
| Shadows | None in real time at first | A soft blob under objects (`ContactShadows` exists in drei, §3.2) or none. Real-time shadows are the first thing to cut on a tablet (ours). |

---

## 6. How the agent verifies its own 3D work

### 6.1 What the repo has

| Fact | Where |
| --- | --- |
| The duel app has Playwright: `"@playwright/test": "^1.63.0"`, script `"e2e": "playwright test"`. | `apps/duel-nextjs/package.json` |
| Its config runs the **system Chrome** (`channel: "chrome"`), "so no browser download is needed", with screenshots on failure. | `apps/duel-nextjs/playwright.config.ts` |
| It has about twenty end-to-end specs. | `apps/duel-nextjs/e2e/` |
| The academy has **no** Playwright: only Vitest with jsdom. | `apps/academy-ygo/package.json` |

jsdom has no WebGL, so the existing academy tests cannot draw a 3D scene. They can still test everything that is
data (§6.3).

### 6.2 Screenshots of WebGL in a headless browser

- Playwright takes a screenshot of a page with `await page.screenshot({ path: 'screenshot.png' })` and of one
  element with `page.locator(...).screenshot(...)` (<https://playwright.dev/docs/screenshots>). The page says
  nothing specific about canvas or WebGL.
- Headless modes differ. By default Playwright uses "a separate chromium headless shell for headless mode"; the
  new headless mode "is the real Chrome browser, and is thus more authentic", and branded Chrome and Edge "have
  switched to a new headless mode implementation that is closer to a regular headed mode"
  (<https://playwright.dev/docs/browsers>). The duel config uses branded Chrome, so it is already on the new mode.
- Without a GPU, Chrome can draw WebGL in software with SwiftShader. Chromium's own page gives the flags
  `--use-gl=angle --use-angle=swiftshader`, and for the plain WebGL fallback
  `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`. It warns that the automatic
  fallback is deprecated: "WebGL context creation will soon fail instead of falling back to SwiftShader"
  (<https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md>). So the flags must be passed
  on purpose; do not rely on the fallback.
- Chrome's own article on testing GPU features in headless Chrome uses `--headless=new` and `--use-angle=vulkan`,
  and shows `chrome://gpu` as the place to see whether WebGL is "Software only" or "Hardware accelerated"
  (<https://developer.chrome.com/blog/supercharge-web-ai-testing>).

**Whether this works on the owner's Windows machine was not tried (§9).** The simple route there is a headed
Chrome window, which uses the real graphics card.

### 6.3 The checks (ours)

The agent can open image files and look at them, so a screenshot is real feedback, not only a file. In order of
value:

1. **Data tests, no 3D needed (Vitest, as today).** For each island file: it has exactly as many stops as
   `levelsOf(world).length`; every stop stands on a land tile; consecutive stops are linked by a path; no two
   objects share a hexagon; every tile on the edge is a coast tile; every model name exists in the pack.
2. **File checks.** `gltf-transform validate` passes; `inspect` shows one material and one texture; size and
   triangle count are under the budget (§5.4).
3. **Standard screenshots.** For each island, four fixed cameras: from above, from the front, from the child's
   travel camera, and at phone size. The agent looks at each: is anything floating, buried, overlapping, facing
   the wrong way, cut by the screen edge?
4. **Counters.** The page exposes `renderer.info` on `window` in a test build; Playwright reads draw calls and
   triangles and fails over the budget.
5. **Blank-canvas test.** The screenshot must not be one flat colour (catches a failed load or a lost context).
6. **Travel test.** Tap island 2, wait, screenshot: the boat is at island 2.
7. **Fallback test.** With WebGL disabled, the list of levels appears (first note, §7.3).

What no automatic check can tell: whether it is pretty, and whether children like it. Both need people.

---

## 7. Proposed shortlist and scene recipe

### 7.1 Shortlist (ours)

| Need | Pack | Licence confirmed | Download confirmed |
| --- | --- | --- | --- |
| Ground, coast, roads, rivers, hills, mountains, trees, buildings, props, clouds | KayKit Medieval Hexagon, free tier | Yes (pack page, itch page and `LICENSE.txt`) | Yes (GitHub) |
| Dark and magic places: walls, torches, chests, altars | KayKit Dungeon Remastered | Yes (pack page) | Yes (GitHub) |
| Graveyard, pumpkins, spooky props | KayKit Halloween Bits | Yes (pack page) | Yes (GitHub) |
| "Other world" places: domes, modules, landing pads | KayKit Space Base Bits | Yes (pack page) | Yes (GitHub) |
| The child's character | KayKit Characters: Adventurers | Yes (pack page) | Yes (GitHub) |
| The rival Nox and his helpers | KayKit Characters: Skeletons | Yes (pack page) | Yes (GitHub) |
| Sea, sky, path markers, locks, stars, beacon, boat | Made in code (§3.1) | - | - |
| Optional: more trees and rocks | KayKit Forest Nature Pack, free tier | Yes (pack page) | No: itch.io, by hand |

### 7.2 Recipe for one island (ours)

Take `wake`, the first world, 5 levels (`apps/academy-ygo/src/lib/junior/play/levels.ts:8`).

1. A hexagon grid about 9 tiles across: roughly 60 tiles.
2. The outer ring is `hex_coast_*`, turned to face the sea. Inside is `hex_grass`. A line of `hex_road_*` tiles
   winds from the beach to the far side.
3. Five stops on the road, one per level. Each stop is a small landmark: a tent, a house, a market, a windmill, a
   tower. The landmark is the picture; the HTML button stays the control (first note, §7).
4. Around them: two tree groups, a hill, a mountain behind as a backdrop, some rocks, barrels and crates.
5. All of it joined into one mesh and written as `wake.glb`.

Estimated weight, from the measurements of §5.4: 60 tiles at about 50 triangles, 5 landmarks at 1,000 to 2,700,
about 12 decorations at 20 to 900. That is **about 15,000 to 20,000 triangles** and, because repeated tiles
repeat the same data, **roughly 150 to 300 KB gzip** for the island file before Meshopt compression. This is an
estimate from measured parts, not a built file.

### 7.3 Eighteen islands

World ids, titles and level counts are from the repo (`levels.ts:8`; `copy-en.ts:77-96`; counts by matching
`world: "…"` in `levels.ts`, total 79). **The themes are proposals (ours).** They use landscape and colour only,
and no Konami creature.

| # | World id | Title in the app | Levels | Island theme | Main pieces |
| --- | --- | --- | --- | --- | --- |
| 1 | `wake` | The Deck wakes up | 5 | Morning meadow with a small camp | Grass, road, tent, home, windmill |
| 2 | `shield` | Shield or sword | 5 | Walled keep on a hill | Walls, gate, towers, barracks, target |
| 3 | `friend` | Call a friend | 8 | Friendly village | Homes, market, stage, bridge |
| 4 | `magic` | Spells and Traps | 4 | Wizard's hill, half sunny and half misty | Church, tower, dungeon props, torches |
| 5 | `puzzles` | Win this turn | 10 | The long road: a large island with a winding path of ten stops | Roads, river crossings, bridges, scaffolding |
| 6 | `tower` | Turtle tower | 2 | A single tall tower on a rock | Stacked towers, mountain, clouds |
| 7 | `rival` | The rival's challenge | 1 | Nox's fort, in red | Red castle, red walls, a skeleton guard |
| 8 | `reading` | Read the card | 9 | Scholar's town | Church, homes, market, stage; a long street |
| 9 | `mat` | The whole mat | 7 | One island with seven districts, one per zone | Graveyard corner (Halloween Bits), field, storehouse |
| 10 | `ritual` | The Ritual | 3 | Stone circle on a plateau | Rocks, dungeon altar, torches |
| 11 | `fusion` | Fusion | 3 | Two small islands joined by one bridge | Coast tiles, `building_bridge` |
| 12 | `synchro` | Synchro | 3 | Windy peaks | Mountains, windmills, clouds |
| 13 | `xyz` | Xyz | 4 | Star base on a dark rock | Space Base Bits |
| 14 | `link` | Link | 3 | A chain of islets linked by bridges | Coast tiles, bridges, signal towers |
| 15 | `pendulum` | Pendulum | 3 | Two tall towers, blue and red, with a field between | Blue tower, red tower, grass |
| 16 | `words` | Every word counts | 5 | Lighthouse island of quiet study | Tower, homes, fences |
| 17 | `legends` | Legends | 3 | The golden castle on the highest mountain | Yellow castle, mountains, clouds (no dragon, §2.3) |
| 18 | `final` | The Extra Deck duel | 1 | The great arena, flags of all four colours | Castles of each colour, stage, walls |

Notes:

- Worlds with one or two levels (`rival`, `final`, `tower`) become small islands; `puzzles` and `reading` become
  large ones. The first note already saw this unevenness (§8).
- The four building colours carry meaning for free: blue for the child's side, red for the rival, yellow for
  legends, green for neutral villages.

**Estimated download for all 18 (ours).** About 80 to 100 different models are used across the world. By the
ratio measured in §5.4 (about 23 KB gzip per model on average, pulled up by the castle), that is **about 2 MB
gzip** if each island file repeats what it needs, and less if common pieces are shared. Meshopt compression and
quantization should cut it further; by how much was not measured. Loading is per island: the child downloads the
first island (about 0.2 to 0.3 MB) plus the engine (about 200 KB gzip, first note §3.1), and the rest as they
travel. Characters with animations come on top and were not measured (§9).

### 7.4 Effort (ours, honest)

These are estimates for an AI coding agent with the owner reviewing screenshots. Nothing was built, so treat them
as a range, not a promise.

| Step | Work | Estimate |
| --- | --- | --- |
| 1. Spike | One island (`wake`), the build script, water and sky, tap to travel between five stops, HTML buttons, list fallback, Playwright screenshots. On its own route. Run it on a real cheap tablet. | 3 to 5 working days |
| 2. World | Layout generator and data for 18 islands, the archipelago, boat travel between islands, far-island simplification, loading per island. | 2 to 3 weeks |
| 3. Life | Locked islands under mist, a finished island that changes, the character's walk, sounds, calm mode, Hebrew direction. | 1 to 2 weeks |
| 4. Hardening | Lost context, low-end devices, the automatic checks of §6.3 in the test suite. | 3 to 5 days |
| Optional | A boat the child steers on the open sea (option b). | 2 to 4 weeks more |

The part most likely to take longer than planned is not code. It is the back-and-forth "this island looks dull,
make it nicer", because the agent cannot judge beauty and the kit has limits.

---

## 8. Recommendation and open decisions

### Recommendation (plain words)

1. **Build the world from the KayKit packs.** They are free, legal for a commercial children's app, need no
   credit, and all look the same. Start with the Medieval Hexagon pack.
2. **Build islands from hexagon tiles, described as data.** A script makes one file per island. No Blender.
3. **Make it "tap to travel".** A real 3D world with a boat and a character that move, but the child only taps
   where to go. No joystick for now.
4. **Keep the rules of the first note:** real HTML buttons, the list as fallback, no words inside the 3D scene.
5. **Do not use any 3D model of a Yu-Gi-Oh! monster or character.** Do not use AI-generated models as the base.
6. **Start with a one-island test (3 to 5 days)** and try it on a real cheap tablet before building 18 islands.
7. **Add Playwright to the academy** so the agent can take screenshots and check its own work.

### Open decisions for the owner

1. **Look.** Open <https://kaylousberg.com/game-assets/medieval-hexagon> and <https://kenney.nl/assets/category:3D>.
   Do you like the KayKit look? If you prefer Kenney, the plan still works, but you must download the zip files
   once by hand.
2. **Is "generic cute fantasy" acceptable?** The world will not look like Yu-Gi-Oh!. It cannot, legally and
   without an artist.
3. **Tap to travel, or a joystick?** We recommend tap to travel for ages 6 to 10. Do you agree?
4. **Money.** Everything recommended is free. Two small optional costs: the KayKit Extra tier ($9.99, more
   buildings, units and vehicles) and a paid AI plan if you want a few special objects.
5. **Credit.** CC0 does not require it. Do you want to thank Kay Lousberg on a credits page anyway? The author
   asks for it kindly ("this is not mandatory").
6. **The 18 themes in §7.3.** Are they right? Which islands matter most to you?
7. **The `legends` island.** Confirm it shows no dragon and no Exodia figure.
8. **A test device.** Which cheap tablet or phone will be the reference for speed and battery?
9. **Legal check.** If the academy becomes a paid product, ask a lawyer about the use of the Yu-Gi-Oh! name and
   card texts. This note found no Konami permission for fan projects.

---

## 9. Unverified / could not confirm

- **Nothing was built or run.** No island was assembled, no scene rendered, no screenshot taken. All effort,
  budget and "estimated" size figures are ours. Only the per-model sizes and triangle counts in §5.4 are measured,
  and only on 20 of 221 models, with gzip and not with Meshopt or Brotli.
- **Kenney file formats and download.** The pack pages opened do not state the 3D formats, so "GLB included" is
  not confirmed here. The signed-link request returned `{"error":"forbidden"}` when called without a browser
  session; whether it works with cookies was not tried, and whether automated download is welcome was not read.
  The licence line was read on the Pirate Kit and Nature Kit pages only; the other Kenney packs listed in §1.3
  were opened only for their file count.
- **Quaternius downloads.** The file host behind the "Download" buttons was not visible. Whether the free part of
  a "MegaKit" includes glTF, and which models are in the paid part, was not checked.
- **KayKit packs not on GitHub** (Forest Nature, Platformer, Resource Bits, and others): whether itch.io gives a
  download URL without a browser session was not tested. The pages of City Builder Bits, Furniture Bits,
  Prototype Bits, Restaurant Bits, Block Bits, Holiday Bits and RPG Tools were not opened. Only the licence file
  of the Medieval Hexagon repository was read; the other GitHub repositories are assumed to carry the same kind
  of file. The GitHub repositories are named "1.0" and were last pushed in 2023 and 2024; whether they match the
  newest itch.io versions was not checked.
- **A boat model** in the free KayKit tier was not found in the file list; the contents of the paid Extra tier
  were not seen.
- **KayKit character files:** size, triangle count, number of bones and list of animations were not measured.
- **Poly Pizza API:** the documentation page is drawn by script and its text could not be read; whether a key
  needs an account, the limits and the formats are unknown.
- **Sketchfab free-download licences** remain unread at a primary page, as in the first note.
- **itch.io:** no general statement on asset licences or on downloading without an account was found.
- **Konami.** No fan-content policy was found; that is not proof that none exists in another language or region.
  The terms quoted are the United States website terms. How Konami treats educational fan sites that use card
  names and texts was not established. Nothing here is legal advice.
- **AI services.** No model was generated; quality and style consistency are our judgement, untested. Tripo's
  pricing and terms pages returned 403: its output licence is unread. Rodin's output formats, API credit cost and
  output licence were not on the pages read. Stability's licence for outputs was not on the pages read. Luma's
  Genie page no longer mentions Genie; whether the product ended was not confirmed. Meshy's prices were shown in
  local currency, so the amounts in other currencies were not read. The money price of one Meshy credit is not
  published on the API pricing page.
- **Rapier and ecctrl on this stack.** Compatibility is by declared peer ranges only. The npm record of
  `@react-three/rapier` 2.2.0 has no licence field (the GitHub repository reports MIT). `ecctrl` lists `leva` as
  a peer in the registry while its readme calls it optional. The download size of the Rapier WebAssembly file
  over the wire was not measured. The pathfinding libraries were read from their registry records only.
- **drei.** Component names come from the docs sidebar; only `Instances`, `KeyboardControls`, `CameraControls`
  and (in the first note) `Html` pages were read. `MotionPathControls`, `Merged`, `Sky`, `Cloud` and `Detailed`
  were not read in detail.
- **three.js.** `Water.js`, `Sky.js` and the noise helpers were confirmed to exist in the repository; only the
  header comment of `Water.js` was read. The three.js manual pages on performance could not be found at the
  expected addresses (404), so performance guidance is quoted from the React Three Fiber docs only.
- **Blender.** The download page returned 403, so the Windows install options (installer, winget, store) are not
  confirmed. The licence page returned 403; "GPL-3.0" is from the PyPI record of `bpy`. The name of the FBX
  import operator in Blender 5.3 was not found on the pages read.
- **FBX2glTF.** The original repository shows no "latest release" through the GitHub API; the newest Windows
  build found is the Godot fork's, from 2023.
- **KTX-Software.** The readme describes the `ktx` tool; the status of the older `toktx` tool was not read.
- **Headless WebGL on this machine.** No Playwright run was made. Which flags give a correct picture with the
  system Chrome on Windows, and whether software rendering shows the same colours as a real device, is unknown.
- **Level counts** (79 levels; per-world numbers in §7.3) come from a text match on `levels.ts`, not from
  importing the module.

---

## Appendix: primary sources consulted (all accessed 2026-11-19)

- **Kay Lousberg / KayKit:** `kaylousberg.com/game-assets` and the pack pages `medieval-hexagon`,
  `forest-nature-pack`, `characters-adventurers`, `characters-skeletons`, `platformer`, `dungeon-remastered`,
  `halloween-bits`, `resource-bits`, `space-base-bits`; itch.io page `kaylousberg.itch.io/kaykit-medieval-hexagon`;
  GitHub API: repositories of the user `KayKit-Game-Assets`, the file tree and `LICENSE.txt` of
  `KayKit-Medieval-Hexagon-Pack-1.0`, and 20 `.gltf` + `.bin` files of that repository (measured in a temporary
  folder outside the repo, then deleted).
- **Kenney:** `kenney.nl/support`; the 3D category page; pack pages `pirate-kit` (including its inline download
  script) and `nature-kit`; 16 further pack pages for their file count; one request to the `download-link`
  address.
- **Quaternius:** home page (pack list), `faq.html`, pack pages `stylizednaturemegakit`, `piratekit`,
  `ultimatefantasyrts`.
- **Poly Haven:** `/license`; `Poly-Haven/Public-API` readme. **Poly Pizza:** home page, `/docs/tos`,
  `/docs/api/v1.1` (text not readable). **OpenGameArt:** FAQ. **Sketchfab:** Download API page. **itch.io:**
  creators FAQ.
- **Konami:** Terms of Use at `legal.konami.com/kdeus/btob/terms/tou/en/` (linked from the footer of
  `yugioh-card.com/en/`); Community Code of Conduct at `yugioh-card.com/eu/code-of-conduct/`; one web search
  limited to Konami's domains.
- **Tools:** glTF Transform CLI page; meshoptimizer `gltf` page and GitHub latest release; Blender 5.3 manual
  "Command Line Arguments" and Python API page `bpy.ops.export_scene`; PyPI `bpy`; `facebookincubator/FBX2glTF`
  readme and GitHub API records of it and of `godotengine/FBX2glTF`; `KhronosGroup/KTX-Software` readme,
  `LICENSE.md` and latest release.
- **Libraries:** drei docs (introduction sidebar, `Instances`, `KeyboardControls`, `CameraControls`); React Three
  Fiber docs ("Scaling performance", "Performance pitfalls", "Events"); three.js docs page `WebGLRenderer` and
  repository files under `examples/jsm/objects` and `examples/jsm/math`; readmes of `pmndrs/ecctrl` and
  `pmndrs/react-three-rapier`.
- **npm registry `latest` records:** `@react-three/rapier`, `ecctrl`, `@react-three/drei`, `@react-three/fiber`,
  `three`, `gltfpack`, `@gltf-transform/cli`, `gltfjsx`, `meshoptimizer`, `three-pathfinding`,
  `@recast-navigation/three`, `camera-controls`, `@dimforge/rapier3d-compat`, `fbx2gltf`, `@playwright/test`.
- **AI services:** Meshy pricing page, terms of use, API pages "Text to 3D" and "Pricing"; Tripo developers page;
  Hyper3D (Rodin) subscribe page and docs home; Stability AI docs (`llms.txt`, "Stable Fast 3D", pricing);
  `Tencent-Hunyuan/Hunyuan3D-2.1` readme and `LICENSE`; `microsoft/TRELLIS.2` readme; Luma `/genie`.
- **Verification:** Playwright docs "Screenshots" and "Browsers"; Chromium `docs/gpu/swiftshader.md`; Chrome for
  Developers "Supercharge web AI model testing".
- **This repository at `8a528d2` (working tree):** `apps/academy-ygo/package.json`, `next.config.ts`,
  `src/lib/junior/play/levels.ts`, `cards.ts`, `copy-en.ts`, `src/components/site-footer.tsx`;
  `apps/duel-nextjs/package.json`, `playwright.config.ts`, `e2e/`; and
  [junior-3d-island-world.md](./junior-3d-island-world.md).
