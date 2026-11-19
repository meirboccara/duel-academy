# Academy Junior: a 3D island world for progression, in the browser

> **Date of observation:** 2026-11-19. Every web page, registry record and published file cited below was fetched
> that day. The repository was read on `main` at HEAD `8a528d2`, with uncommitted changes from other sessions in the
> tree; code claims describe the files as they stood that day.
> **Nature of this document:** a research note. No code was changed, nothing was installed, built or published. No
> 3D scene was run on any device: every performance statement below is either a quotation from a primary source or
> labelled as ours.
>
> **The request (owner, verbatim):** "Is it possible to create a world with a field in 3D while staying in web
> format? Like an island, with a progression game for the children."
>
> **Sourcing rule used:** each external claim is followed by the source that owns it (the specification, the
> vendor's own docs, the package's own registry record or published file). Claims about this repo cite the file.
> Sizes marked **[measured]** were obtained by downloading the publisher's own build file from jsDelivr and
> compressing it locally with `gzip -9`; they are whole-library figures before any tree-shaking. Effort figures,
> proposals and inferences are labelled **(ours)**. Whatever could not be confirmed at a primary source is listed
> in [§10](#10-unverified--could-not-confirm) and is not stated as fact.
>
> **Relation to existing notes.** [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) §5 advised
> against "a canvas game engine" for the card board, because "canvas loses the accessibility the pilot already has".
> This note does not reverse that for the board. It looks at a different surface, the level-select screen, and
> keeps the same condition: the real controls stay in the DOM.
> [academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §3 covers what the
> rewards should be; this note only covers how a world map could show them.

---

## 0. Short answer

**Yes, it is possible.** A 3D island world can run inside the existing Next.js app, in the browser, with no native
app and no plugin. The browser feature it needs (WebGL 2) is reported as supported for 97.29% of tracked global
usage, including iOS Safari since 15 and Chrome on Android
(<https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgl2.json>). The library that fits this stack
(React Three Fiber 9 on three.js) declares support for the React version the academy already uses.

The conditions:

1. **It is loaded only on the client and only on the map screen.** A 3D library needs `window`; in the App Router
   that means `next/dynamic` with `ssr: false` inside a Client Component (§3.2).
2. **The buttons stay real HTML.** The 3D scene is the picture; the level buttons, their labels in French, English
   and Hebrew, their focus order and their locked state stay DOM elements laid over or beside it (§7).
3. **The present list stays as the fallback.** It is what a child sees while the scene loads, when WebGL is not
   available, when the GPU context is lost, and in calm mode (§7.3).
4. **The scene is small and mostly still.** One low-poly scene, rendered on demand and not 60 times a second, to
   spare the battery of a phone or tablet (§6).
5. **Someone makes or assembles the island.** The code is the smaller part. The art (one coherent set of islands)
   is the real cost, even with free CC0 packs (§5).

**Honest caveat:** for a level-select screen, a drawn or pre-rendered island with HTML buttons on top ("2.5D")
gives most of the same feeling for a fraction of the cost and risk (§4). Real 3D earns its place only if the world
is meant to move: a camera that travels from island to island, an island that comes alive when its world is
finished, a character that walks to the next level.

---

## 1. What the repo has today

| Fact | Where |
| --- | --- |
| Next.js `16.3.2`, React and React DOM `19.2.8`, `motion` `^14.0.0`, Tailwind 4. No 3D, canvas or WebGL dependency. | `apps/academy-ygo/package.json` |
| No `<canvas>`, no WebGL and no three.js import anywhere in the sources (searched `webgl`, `from "three`, `<canvas`: no match). | `apps/academy-ygo/src` |
| No service worker, no web manifest, no `public/` directory. The academy is not an offline app. | `apps/academy-ygo/src` (searched `serviceWorker`, `manifest.`, `navigator.onLine`: no match); `apps/academy-ygo/public` does not exist |
| "No app runtime env vars — the site is fully static." | `apps/academy-ygo/README.md:34` |
| The Junior course is 18 worlds (`WORLD_IDS`) holding 79 levels (counted by matching `world: "…"` in the `LEVELS` array; between 1 and 10 levels per world). | `apps/academy-ygo/src/lib/junior/play/levels.ts:8`, `:95` |
| Progress is one `localStorage` record, key `academy-ygo:junior:play:v1`: per solved level `{ clean, firstTry }`, plus `slips`, `calm`, `sound`. | `apps/academy-ygo/src/lib/junior/play/progress.ts` |
| Levels open strictly in order: `isUnlocked` is true for the first level and for a level whose predecessor is solved. `nextLevel` returns the first unsolved level. | `apps/academy-ygo/src/lib/junior/play/progress.ts` (`isUnlocked`, `nextLevel`) |
| The level-select screen today is a list: one `<section>` per world with a heading, a blurb and an `<ol>` of `<button>`s, each `min-h-12`, `disabled` when locked, with an `aria-label` carrying the state, and a lock, check or star icon. | `apps/academy-ygo/src/components/junior/play/junior-play.tsx:155-185` |
| The screen is already a Client Component. | `apps/academy-ygo/src/components/junior/play/junior-play.tsx:1` |
| Calm mode: motion is off when the child chose calm or the device asks for reduced motion (`moving = hydrated && !progress.calm && !deviceReduced`). A global CSS rule also cuts animations under `prefers-reduced-motion`. | `apps/academy-ygo/src/components/junior/play/junior-play.tsx:38-62`; `apps/academy-ygo/src/app/globals.css:127` |
| Three languages; Hebrew is right-to-left (`dirOf("he") === "rtl"`). World and level titles come from `copy.worlds[world].title` and `copy.levels[id].title`. | `apps/academy-ygo/src/lib/i18n/locales.ts:9`; `apps/academy-ygo/src/lib/junior/play/copy-fr.ts`, `copy-en.ts`, `copy-he.ts` |

The important point for this question: **everything a world map needs to know is already computed by pure
functions** (`WORLD_IDS`, `levelsOf`, `isSolved`, `isUnlocked`, `nextLevel`, `ruleMastery`, `album`). A 3D map is a
second view of the same data, not a new data model (§8).

---

## 2. What browsers can do today

### 2.1 WebGL 2: the safe base

- caniuse data: `usage_perc_y` 97.29, partial 0. First supporting versions: Chrome 56, Firefox 51, Edge 79, Safari
  15, iOS Safari 15.0, Samsung Internet 7.2; Chrome for Android and Firefox for Android supported in the listed
  current versions (<https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgl2.json>).
- So a child on an iPad or iPhone needs iOS/iPadOS 15 or later; older devices get the fallback.
- Creating a context can still fail on a supported browser. `getContext()` returns `null` when the context type is
  not supported, and the `failIfMajorPerformanceCaveat` attribute exists precisely to refuse a context "if the
  system performance is low or if no hardware GPU is available"
  (<https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext>). A context can also be taken
  away later: MDN says to "handle `webglcontextlost` events, which can be emitted when the GPU runs out of memory,
  among other reasons" (<https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices>).

### 2.2 WebGPU: real, but not something to depend on

- MDN marks it "Limited availability. This feature is not Baseline because it does not work in some of the most
  widely-used browsers", and secure-context only (<https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API>).
- caniuse data: `usage_perc_y` 86.83, partial 3.32. Chrome and Edge from 113; Chrome for Android supported; iOS
  Safari from 26.0; Samsung Internet from 24; Safari on Mac partial ("only being enabled by default on macOS 26
  Tahoe or later"); Firefox partial ("Only enabled by default on Windows as well as macOS 26 Tahoe or later on
  Apple Silicon"); Firefox for Android not supported
  (<https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgpu.json>).
- On Android the support is conditional on the device: "WebGPU is now enabled by default in Chrome 121 on devices
  running Android 12 and greater powered by Qualcomm and ARM GPUs"
  (<https://developer.chrome.com/blog/new-in-webgpu-121>). Older or cheaper Android tablets fall outside that.
- On Apple devices it arrived with Safari 26 "for macOS, iOS, iPadOS, and visionOS"
  (<https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/>). A family
  iPad that cannot install iPadOS 26 has no WebGPU.

**Reading (ours):** a low-poly island needs nothing WebGPU offers. Build on WebGL 2. The engines below can use
WebGPU where present and fall back, so this is not a door that closes.

### 2.3 Low-end limits that the sources actually state

- "WebGL doesn't offer APIs to query the maximum amount of video memory on the system", so an app "must be
  conscious of VRAM usage"; MDN advises to "offer different graphics quality settings"
  (<https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices>).
- On phones, texture memory is the scarce resource: GPU-compressed textures "are smaller in GPU memory, and are
  faster to sample from. (This reduces texture memory bandwidth, which is precious on mobile.)" (same page).
- Draw calls: "Each mesh is a draw call, you should be mindful of how many of these you employ: no more than 1000
  as the very maximum, and optimally a few hundred or less"
  (<https://r3f.docs.pmnd.rs/advanced/scaling-performance>).

No primary source gives a hard memory ceiling per tab for iOS Safari; see §10.

---

## 3. Engine options

### 3.1 Summary

Versions, licences and peer dependencies are from each package's own npm registry record
(`https://registry.npmjs.org/<package>/latest`).

| Option | Version, licence | Fits React 19.2.8 / Next 16? | Whole-library size [measured] | WebGPU | Notes |
| --- | --- | --- | --- | --- | --- |
| **three.js** | `three` 0.187.0, MIT (<https://raw.githubusercontent.com/mrdoob/three.js/dev/LICENSE>) | Framework-neutral; no peer dependencies. | `three.module.min.js` 392 KB raw / 89 KB gzip plus `three.core.min.js` 422 KB / 105 KB: about **195 KB gzip** for the WebGL build. `three.webgpu.min.js`: 492 KB / 123 KB. | `WebGPURenderer` "tries to use a WebGPU backend if the browser supports WebGPU. If not, [it] falls backs to a WebGL 2 backend" (<https://threejs.org/docs/pages/WebGPURenderer.html>). | Imperative API: scene, camera and render loop are written by hand and must be wired to React state manually. |
| **React Three Fiber (+ drei)** | `@react-three/fiber` 9.8.2, MIT; `@react-three/drei` 10.7.9, MIT | **Yes by declaration.** Fiber peers: `react >=19 <19.4`, `react-dom >=19 <19.4`, `three >=0.156`. Drei peers: `react ^19`, `@react-three/fiber ^9`. "@react-three/fiber@9 pairs with react@19" (<https://r3f.docs.pmnd.rs/getting-started/installation>). | three.js plus the Fiber reconciler (not measured separately). | Through three: "To use `WebGPURenderer`, import it from `three/webgpu` and initialize it in an async `gl` factory" (<https://r3f.docs.pmnd.rs/api/canvas>). | The scene is written as React components, so it can read `progress` directly. Canvas has a `fallback` prop: "optional DOM JSX elements or regular components in case GL is not supported" (same page). |
| **Babylon.js** | `@babylonjs/core` 9.37.1, Apache-2.0 | Framework-neutral. A React binding exists: `react-babylonjs` 4.0.2, MIT, peers `react >=19`. | Full UMD `babylon.js`: 8.9 MB raw / **1.93 MB gzip**. The ES-module package is meant to be tree-shaken; that size was not measured. | "available and backward compatible with the WebGL implementation", "since the Babylon.js 5.0 release in May 2022" (<https://doc.babylonjs.com/setup/support/webGPU>). | A full game engine (physics, GUI, inspector). More than a level-select needs. |
| **PlayCanvas** | `playcanvas` 2.24.2, MIT; `@playcanvas/react` 0.11.7, MIT | Binding peers: `react ^18.3.1 \|\| ^19.1.0`. Version 0.x. | `playcanvas.min.mjs`: 2.9 MB raw / **749 KB gzip**. | "WebGPU (Beta)"; "The engine will seamlessly fall back from WebGPU to WebGL based on browser support" (<https://developer.playcanvas.com/user-manual/graphics/>). | Also a full engine, with an online editor. |
| **Spline** | `@splinetool/react-spline` 4.2.0 and `@splinetool/runtime` 2.0.194; **no licence field in either registry record** | Peers: `next >=14.2.0`, `react *`. | Not established (the 132 KB `runtime.js` measured looks like a loader, see §10). | Not checked. | A design tool, not an engine: the island is drawn in Spline's editor and exported. "You can download the code exports and host them on your own server" (<https://docs.spline.design/exporting-your-scene/web/exporting-as-code>). Proprietary runtime and editor; plan terms not verified. |
| **Unity Web** | Unity 6.6 | A separate WebAssembly application embedded in the page, not a React component. | Not measured. | Not checked. | Mobile support is "iOS Safari 15 and newer", "Chrome 58 and newer" on Android (<https://docs.unity.com/en-us/engine/current/manual/platform-specific/webgl/intro/browsercompatibility>). A second toolchain and a second codebase. |
| **Godot Web** | Godot 4 (stable docs) | Same: a separate WebAssembly application. | Not measured. | "Godot does not support WebGPU yet"; "Godot 4 can only target WebGL 2.0 (using the Compatibility rendering method)". | The docs themselves warn that "Safari has several WebGL 2 issues that other browsers don't have" and that native exports "will always perform significantly better" (<https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html>). |

**Reading (ours):**

- **React Three Fiber is the natural fit.** It is the only option where the island is an ordinary React component
  that reads the same `progress` object as the present list, in the same repo, the same language and the same test
  setup. Its declared React range (`>=19 <19.4`) contains the academy's `19.2.8`. The upper bound matters: a future
  React 19.4 upgrade must wait for a Fiber release that allows it.
- Babylon.js and PlayCanvas are sound engines, but they bring three to ten times the code of three.js for features
  a level-select does not use.
- Unity and Godot are the wrong tool here. They answer "can a whole game run in the browser", at the cost of a
  second toolchain, a large WebAssembly download and no shared code with the 79 existing levels.
- Spline shortens the art step for a non-3D-artist, at the price of a closed runtime whose licence this note could
  not read.

### 3.2 Constraints in the Next.js App Router

Read from the docs bundled with the installed version (`apps/academy-ygo/node_modules/next/dist/docs/`, as
`apps/academy-ygo/AGENTS.md` requires):

- Lazy loading "allows you to defer loading of **Client Components** and imported libraries, and only include them
  in the client bundle when they're needed" (`01-app/02-guides/lazy-loading.md:13`).
- "To dynamically load a component on the client side, you can use the `ssr` option to disable server-rendering.
  This is useful if an external dependency or component relies on browser APIs like `window`" (same file, `:262`).
- "`ssr: false` option is not supported in Server Components. You will see an error if you try to use it in Server
  Components" (same file, `:94`).

Consequence: the island component is imported with `dynamic(() => import("./island-world"), { ssr: false })` from
`junior-play.tsx`, which is already a Client Component (`junior-play.tsx:1`). The three.js code then stays out of
every other page's bundle, and the adult academy and the level player are not made heavier.

The Fiber docs add one Next.js point: "It should work out of the box but you will encounter untranspiled add-ons in
the three.js ecosystem, in that case" add `three` to `transpilePackages`
(<https://r3f.docs.pmnd.rs/getting-started/installation>). The option exists in this Next version
(`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/transpilePackages.md`). Whether it
is needed with Next 16 and Turbopack was not tested (§10).

---

## 4. Cheaper ways to get "an island"

| Approach | What it is | New dependency | What it cannot do |
| --- | --- | --- | --- |
| **Pre-rendered or drawn 2.5D map** | One picture of the islands (an illustration, or a still rendered once from 3D models), with the existing HTML buttons positioned over it. Locked islands greyed or under cloud with CSS. | None. `motion` is already installed (`apps/academy-ygo/package.json`). | The view never turns. Every state of the island (locked, open, finished) is either a CSS effect or one more picture. |
| **CSS 3D transforms** | Flat layers tilted and stacked with `perspective` and `transform-style: preserve-3d`, for depth and parallax. `perspective` "determines the distance between the z=0 plane and the user in order to give a 3D-positioned element some perspective" and is Baseline "since September 2015" (<https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/perspective>). | None. | No real models, lighting or shadows. Good for tilted boards and floating cards, poor for terrain. |
| **2D canvas map (PixiJS)** | A scrolling 2D game map. PixiJS is "an advanced, open-source 2D rendering engine", "built on WebGL and optionally WebGPU" (<https://pixijs.com/8.x/guides/getting-started/intro>). `pixi.js` 8.23.0, MIT; `@pixi/react` 8.0.5 peers `react >=19.0.0` (npm registry). | `pixi.min.mjs` 913 KB raw / **255 KB gzip** [measured]: larger than three.js. | It is still a canvas, with the same accessibility work as 3D (§7), and it is not 3D. |
| **One GLB island, fixed camera** | Real 3D, but the smallest version of it: one model file, one camera that does not move freely, rendered when something changes. | three.js + Fiber (§3.1). | Free exploration. That is a later step, not a different technology. |

**When fake 3D is enough (ours).** A level-select screen has one job: show where the child is, what is open, and
what comes next. A still picture does that. Well-known mobile games have used a painted map with a winding path for
this for years. Real 3D is justified only by motion that a picture cannot give: the camera gliding to the next
island when a world is finished, the island changing as the child progresses, a mascot that walks. If the owner's
picture of "a world with a field in 3D" is a *place the child looks at*, 2.5D is enough. If it is a *place the
child moves through*, it needs real 3D.

The two are not exclusive. The pre-rendered picture is also exactly the fallback image that real 3D needs anyway
(§7.3), so doing 2.5D first is not wasted work.

---

## 5. Assets: the real cost

### 5.1 Format

- glTF "is an API-neutral runtime asset delivery format"; its stated motivations include "compact file sizes" and
  binary data that "can often be loaded directly into GPU buffers with no additional parsing or processing". GLB is
  the single-file container, storing "JSON and binary data in one file without base64 encoding"
  (<https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html>).
- Compression extensions, all "Complete, Ratified by the Khronos Group":
  - `KHR_draco_mesh_compression`: "defines a schema to use Draco geometry compression"
    (<https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md>).
  - `EXT_meshopt_compression`: "a generic option for compressing binary data", designed for "very fast decoding
    (using WebAssembly SIMD, the decoders run at ~1 GB/sec on modern desktop hardware)", and meant to be combined
    with gzip rather than replace it
    (<https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md>).
  - `KHR_texture_basisu`: "KTX v2 images with Basis Universal supercompression", with "reducing GPU memory
    footprint" as a goal
    (<https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md>).
- **Reading (ours):** a low-poly island coloured with flat materials or one small palette texture hardly needs
  texture compression at all. Draco and KTX2 each add a decoder download; for a few hundred kilobytes of geometry,
  Meshopt or plain quantization is the lighter choice.

### 5.2 Tooling

- **Blender** exports glTF through its bundled add-on (manual page "glTF 2.0 - Blender 5.3 Manual",
  <https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html>). Blender is free software. The export
  options (Draco, Meshopt) could only be read from a search summary of that page, see §10.
- **glTF Transform** (`@gltf-transform/cli` 4.5.1, MIT, npm registry): its `optimize` command will "optimize model
  by all available methods"; individual commands cover Draco, Meshopt, quantization, WebP and KTX + Basis textures
  (<https://gltf-transform.dev/cli>).
- **gltfjsx** (6.5.3, MIT, npm registry): "A small command-line tool that turns GLTF assets into declarative and
  re-usable react-three-fiber JSX components"; its `--transform` flag writes a "binary-packed, draco-compressed,
  texture-resized (1024x1024), webp compressed" copy. Its README says this "can reduce the size of an asset by
  70%-90%", a figure the project gives without a benchmark
  (<https://raw.githubusercontent.com/pmndrs/gltfjsx/master/readme.md>).

### 5.3 Where islands come from, and under which licence

| Source | Licence, in the source's own words | Usable here? |
| --- | --- | --- |
| **Kenney** | "all game assets on the asset pages are public domain licensed (CC0)". "You're free to use them, even in commercial projects." "Attribution is not required." (<https://kenney.nl/support>) | Yes, with no condition. |
| **Quaternius** | "All models are under the CC0 License"; usable "for free without the need for attribution in commercial, educational, and personal projects". Formats: "You can open the .blend files directly or import the FBX files." (<https://quaternius.com/faq.html>) | Yes. Conversion to GLB through Blender is needed where only FBX or .blend is offered. |
| **Poly Pizza** | The licence is shown per model; pages seen list "Public Domain (CC0)" for Kenney and Quaternius models and Creative Commons Attribution for others (for example <https://poly.pizza/m/5EGWBMpuXq>). No site-wide licence page was found. | Yes, model by model. A CC-BY model needs a visible credit. |
| **Sketchfab** | Only the paid-store licences could be read: "Standard" and "Editorial", the latter "cannot be used for any commercial or promotional use" (<https://sketchfab.com/licenses>). The per-model Creative Commons licences for free downloads could not be read at a primary page (§10). | Only model by model, after reading that model's licence. Avoid NC (non-commercial) and ND (no derivatives) variants. |

Two warnings **(ours)**:

- **Free packs do not make a world.** Mixing models from different authors gives a patchwork. Eighteen worlds that
  look like one place need either one pack used consistently, or an artist. This is the largest and least
  predictable cost of the whole idea.
- **No Yu-Gi-Oh! artwork in the scene.** The Junior course uses its own invented cards
  (`apps/academy-ygo/src/lib/junior/play/cards.ts`); an island world should stay on that side of the line and not
  model Konami characters or monsters. The earlier note already rules out "card images or anime stills"
  ([junior-mode-playful-learning.md](./junior-mode-playful-learning.md), recommendations table).

---

## 6. Performance, loading, battery

What the sources say, and what follows for this app:

- **Do not render when nothing moves.** A continuous render loop "is what generally drains batteries the most and
  makes fans spin up". "All you need to do is set the canvas `frameloop` prop to `demand`"; "this saves battery and
  keeps noisy fans in check" (<https://r3f.docs.pmnd.rs/advanced/scaling-performance>). A level-select map is still
  most of the time, so this fits it exactly.
- **Cap the resolution.** The Fiber canvas defaults to `dpr` `[1, 2]` (<https://r3f.docs.pmnd.rs/api/canvas>). MDN:
  "Consider reducing canvas.width and height and keeping canvas.style.width and height at a constant size"
  (<https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices>).
- **Let slow devices step down.** Drei's `PerformanceMonitor` "will collect the average fps (frames per second)
  over time"; the app "has to opt into performance scaling"
  (<https://r3f.docs.pmnd.rs/advanced/scaling-performance>).
- **Keep draw calls low.** "optimally a few hundred or less" (same page). Eighteen islands of forty separate
  objects each would already exceed that; merged meshes or instancing keep it down ("hundreds of thousands of
  objects in a single draw call", same page).
- **Survive a lost context.** "You should also safeguard the canvas against WebGL context crashes"
  (<https://r3f.docs.pmnd.rs/api/canvas>).
- **Load it late.** `next/dynamic` with `ssr: false` (§3.2) keeps the engine off the first paint. The list renders
  first; the island replaces or joins it when ready.

**A budget to hold the spike to (ours, not from a source):** engine code about 200 KB gzip (the measured three.js
figure plus the reconciler), all island assets together under 1 MB over the wire, under 100 draw calls, device pixel
ratio capped at 1.5 on phones, zero frames rendered while the child is not touching the map. The numbers are a
starting position to be corrected by a test on a real low-end tablet; no source prescribes them.

**Thermal behaviour and battery drain on real children's devices cannot be read from documentation.** They have to
be measured (§9, first step).

**Offline / PWA.** Not applicable today: the academy has no service worker and no manifest (§1). If it gets one
later, the GLB files and the lazy JavaScript chunk become part of what must be cached, which is the same work the
duel app already did for its Decks (`apps/duel-nextjs/src/client/offline/`). Until then the island simply loads
from the network like every other asset.

---

## 7. Accessibility and children

### 7.1 A canvas is opaque

- MDN: the `<canvas>` element "must be made accessible by providing fallback text"; fallback content placed inside
  the element is what is "accessed by screen readers". A canvas with `role="presentation"` "should only be used if
  the canvas is purely presentational"
  (<https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage>).
- `@react-three/a11y` (3.0.0, MIT) offers "Focus and focus indication", "Tab index and keyboard navigation",
  "Screen reader support and alt-text" for objects in a Fiber scene
  (<https://raw.githubusercontent.com/pmndrs/react-three-a11y/main/README.md>). Its latest npm release is dated
  2022-05-15 and its peers are `react >=18.0`, `@react-three/fiber >=8.0` (npm registry). It was published before
  React 19 and Fiber 9; treat it as untested on this stack.

**Recommendation (ours): do not make the 3D objects the controls.** Keep the level buttons as the real `<button>`
elements they are today (`junior-play.tsx:172-181`), and make the canvas purely presentational. Then keyboard
order, focus rings, `disabled`, `aria-label` with the level state, and screen-reader output keep working with no
new library, and the existing tests in `junior-play.test.tsx` keep their meaning. Two ways to place the buttons:

- Beside or under the scene, as a list for the selected island. Simplest, and safest in Hebrew.
- Floating on the island with drei's `Html`, which "allows you to tie HTML content to any object of your scene".
  Its own docs warn that in `transform` mode the HTML "may look blurry on some devices and browsers"
  (<https://drei.docs.pmnd.rs/misc/html>); the plain (non-transform) mode avoids that.

### 7.2 Touch targets

- WCAG 2.2 SC 2.5.8 (level AA): "The size of the target for pointer inputs is at least 24 by 24 CSS pixels", with
  listed exceptions (<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>).
- The present buttons are `min-h-12`, that is 48 CSS pixels (`junior-play.tsx:177`). A 3D map must not shrink
  them: up to 10 levels on one island (`puzzles` has 10, per the count in §1) will not fit as 48-pixel buttons on
  a small model seen on a phone. That is a design argument for "tap the island, then pick the level from a list".

### 7.3 Fallbacks

One fallback serves four cases **(ours)**: the scene is still loading; WebGL is refused or absent (§2.1; Fiber's
`fallback` prop, §3.1); the context is lost mid-session; the child or the device asked for calm
(`junior-play.tsx:39`). In all four, show the present list, ideally over a still picture of the island. The Fiber
docs make the same point: "Ideally, and if possible, your fallback is a seamless, visual replacement"
(<https://r3f.docs.pmnd.rs/api/canvas>).

Calm mode needs a decision, not just a switch: a still 3D scene with no camera travel is arguably already calm. The
minimum is that no automatic camera movement, bobbing or particle effect runs when `moving` is false.

### 7.4 French, English, Hebrew

Text drawn inside a WebGL scene is a texture: it has no `dir`, no bidirectional layout and no screen-reader
presence unless the app builds them. Text kept in HTML gets all three from the browser, and the app's existing
`dirOf` and `<bdi>` handling (`apps/academy-ygo/src/lib/i18n/locales.ts:9`, `junior-play.tsx:158`) keeps working.
So: **no words inside the 3D scene**. Titles, level names and states stay HTML. A side effect is that the island
models contain no language and need no translation.

Whether the *path* across the islands should run right-to-left in Hebrew is a design question this note leaves
open.

---

## 8. How a world maps onto the existing progression

Without designing the feature, the correspondence is direct, and nothing in storage has to change:

| World-map idea | Existing data | Source |
| --- | --- | --- |
| An island | One of the 18 `WORLD_IDS` | `apps/academy-ygo/src/lib/junior/play/levels.ts:8` |
| The stops on an island | `levelsOf(world)`, 1 to 10 levels | `levels.ts:254` |
| A stop is locked / open / done / starred | `isUnlocked`, `isSolved`, `progress.levels[id].clean` | `apps/academy-ygo/src/lib/junior/play/progress.ts` |
| An island is reachable | Its first level is unlocked (derived; no stored field) | `progress.ts` (`isUnlocked`) |
| An island is finished | All of `levelsOf(world)` are solved (derived) | `progress.ts` (`isSolved`) |
| "You are here" | `nextLevel(progress)` | `progress.ts` (`nextLevel`) |
| Things that could appear on a finished island | Cards from `album(progress)`, rules from `ruleMastery` | `progress.ts` |
| Island name and blurb | `copy.worlds[world].title`, `.blurb` | `apps/academy-ygo/src/lib/junior/play/copy-fr.ts`, `copy-en.ts`, `copy-he.ts` |

Notes **(ours)**:

- The map is a pure function of `PlayProgress`. It can be developed and unit-tested against hand-made progress
  objects, like `progress.test.ts` does today, without any 3D running.
- Unlocking is strictly linear today (`isUnlocked`). A world map invites the question "can I go to another island
  when I am stuck?", which the rewards note already raised
  ([academy-analytics-animation-rewards-login.md](./academy-analytics-animation-rewards-login.md) §3). The map does
  not answer it, but it will make the linearity visible to children.
- Worlds are very uneven: `rival` and `final` have 1 level, `tower` 2, `puzzles` 10 (§1). Islands will differ in
  size, or small worlds share an island.
- The only new static data is presentational: which model and which position each world has. It belongs next to
  the component, not in `PlayProgress`.

---

## 9. Comparison and recommended path

Effort is a rough estimate for one developer who knows this codebase, **(ours)**, and excludes art unless said.

| # | Option | New code shipped to the child | Effort (code) | Art needed | Risk | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| A | Keep the list, restyle it as a path | None | 1-2 days | None | None | Not what was asked, but the baseline. |
| B | 2.5D: island pictures + HTML buttons + `motion` | None | 3-6 days | 18 island pictures, or one large map (drawn, or rendered once in Blender from CC0 models) | Low. Works everywhere the app works. | **Enough for a level-select.** Also the fallback for C. |
| C | Real 3D, small: R3F, one low-poly scene, fixed or guided camera, HTML buttons, list as fallback | About 200 KB gzip of engine + the GLB | 1-2 weeks after a 2-3 day spike | The same islands as GLB models: one consistent CC0 pack assembled in Blender, or an artist | Medium: performance on cheap tablets, art coherence, one more dependency tied to the React version | **Recommended if the world should move.** |
| D | Real 3D, explorable: free camera or a character that walks | As C, more assets | 4-8 weeks | Characters, animation, more terrain | High: input on touch, motion sickness and calm mode, accessibility, scope | Only after C has been tested with children. |
| E | Babylon.js or PlayCanvas instead of R3F | 750 KB to 1.9 MB gzip before tree-shaking | As C or more | As C | Medium-high: heavier, and a less direct React fit | No advantage for this use. |
| F | Spline scene embedded | Closed runtime, size not established | Days, if someone learns the editor | Made in Spline | Medium: vendor lock-in, licence unread | Only if nobody can use Blender. |
| G | Unity or Godot web export | A separate WebAssembly app | Months | Full game art | Very high | No. |

### Recommended path (ours)

1. **Answer to the owner: yes.** Build it as a *view* over the existing progression, not as a new game.
2. **Smallest step that proves it: a one-island spike, thrown away afterwards.** One world (`wake`, 5 levels), one
   free CC0 island model, React Three Fiber, loaded with `next/dynamic` and `ssr: false`, `frameloop="demand"`,
   the five existing buttons in HTML, the present list as fallback. On a separate route so nothing existing is
   touched. It answers the four questions documentation cannot:
   - Does it build and run on Next 16.3.2 / React 19.2.8 with Turbopack, with or without `transpilePackages`?
   - How long until the island appears on a real low-end Android tablet and an older iPad, on home Wi-Fi?
   - Does the device stay cool and the battery steady after ten minutes on the map?
   - Do children actually like it more than the list? (The pilot method in `docs/academy-junior-pilot.md` applies.)
3. **If the spike passes:** option C for the whole course, with the picture of each island (option B's art) as the
   fallback. If it fails on performance or the art cannot be made coherent: option B alone, which still reads as
   "an island world" and costs no dependency.
4. **Decide before either:** who makes the islands. That decision, more than the engine, sets the cost.

---

## 10. Unverified / could not confirm

- **Nothing was run.** No scene was built or measured on any device. All performance guidance is quoted from docs;
  the budget in §6 and the effort figures in §9 are ours.
- **React Three Fiber on this exact stack.** Compatibility is by declared peer ranges and the docs' statement about
  React 19. No build was made on Next 16.3.2 with Turbopack; whether `transpilePackages: ["three"]` is needed is
  unknown. Fiber 10 exists only as alpha/canary tags on npm; its requirements were not read.
- **Bundle sizes.** Measured on whole published build files with `gzip -9`, not on a tree-shaken production bundle
  of this app, and not with Brotli. The assumption that the three.js WebGL build is `three.module.min.js` plus
  `three.core.min.js` comes from the file layout, not from a three.js doc. The Fiber and drei contributions were
  not measured. The Babylon figure is the full UMD bundle, which overstates a tree-shaken ES-module build.
- **three.js WebGPU maturity.** The API page confirms the automatic WebGL 2 fallback. The manual page on
  `WebGPURenderer` could not be fetched (404 at two URLs), so whether three.js calls it production-ready was not
  read.
- **iOS Safari memory limits per tab** and the point at which iOS discards a WebGL context: no primary source
  found. MDN only says a context can be lost "when the GPU runs out of memory".
- **WebGPU on Apple devices:** the WebKit post names the operating systems, not the minimum hardware.
- **Blender glTF export options.** The manual page was reached and its title read ("Blender 5.3 Manual"), but the
  body did not come through; the Draco and Meshopt export options are known only from a search-engine summary of
  that page.
- **Sketchfab free-download licences** (CC BY, CC0, NC, ND variants): the help-centre article returned 404 and the
  Fab support page could not be opened. A community post found by search says free licensing was being moved from
  Sketchfab to Fab; the current state was not confirmed.
- **Poly Pizza:** no site-wide licence page was found (`/docs/license` is 404); the per-model licences were seen in
  search results for individual model pages, not read in full.
- **Spline:** licence of the runtime (the npm records carry no licence field), plan and watermark terms, the true
  runtime download size, and WebGPU status were not established. The measured 132 KB `runtime.js` is likely a
  loader for larger chunks.
- **PlayCanvas and Babylon.js on mobile:** only their WebGPU status and licences were read; no mobile guidance from
  either vendor was consulted.
- **Unity and Godot export sizes** were not measured. Unity's "Technical limitations" page was not read.
- **Level count.** "79 levels" comes from a text match on `levels.ts`, not from importing the module. The earlier
  note says 74 levels and 17 worlds at commit `cd07378`; the tree has moved since.
- **`@react-three/a11y`** was not tested with React 19 or Fiber 9; its last npm release predates both.

---

## Appendix: primary sources consulted (all accessed 2026-11-19)

- caniuse data repository (`Fyrd/caniuse`, `main`): `features-json/webgl2.json`, `features-json/webgpu.json`.
- MDN: "WebGL best practices"; `HTMLCanvasElement.getContext()`; "WebGPU API"; Canvas tutorial "Basic usage";
  CSS `perspective`.
- Chrome for Developers: "What's New in WebGPU (Chrome 121)". WebKit blog: "News from WWDC25: Web technology coming
  this fall in Safari 26 Beta".
- Khronos: glTF 2.0 specification (first 100,000 characters read); extension READMEs
  `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_texture_basisu` (`KhronosGroup/glTF`, `main`).
- W3C: Understanding WCAG 2.2, SC 2.5.8.
- three.js: API page `WebGPURenderer`; `LICENSE` (`mrdoob/three.js`, `dev`).
- React Three Fiber docs: "Installation", "Canvas", "Scaling performance". Drei docs: `Html`. READMEs of
  `pmndrs/react-three-a11y` and `pmndrs/gltfjsx`. glTF Transform: CLI page.
- Babylon.js docs: "WebGPU Support". PlayCanvas user manual: "Graphics". PixiJS 8 guide: introduction. Spline
  docs: "Exporting as code". Unity 6.6 manual: "Web browser compatibility". Godot stable docs: "Exporting for the
  Web".
- Kenney: support page. Quaternius: FAQ. Poly Pizza: one model page. Sketchfab: `/licenses`. Blender manual:
  glTF 2.0 add-on page (title only).
- npm registry `latest` records: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/a11y`,
  `@babylonjs/core`, `babylonjs`, `react-babylonjs`, `playcanvas`, `@playcanvas/react`, `pixi.js`, `@pixi/react`,
  `@splinetool/react-spline`, `@splinetool/runtime`, `@gltf-transform/cli`, `gltfjsx`.
- jsDelivr, publisher build files measured: `three/build/three.module.min.js`, `three.core.min.js`,
  `three.webgpu.min.js`; `babylonjs/babylon.js`; `playcanvas/build/playcanvas.min.mjs`;
  `pixi.js/dist/pixi.min.mjs`; `@splinetool/runtime/build/runtime.js`.
- This repository at `8a528d2` (working tree): `apps/academy-ygo/package.json`, `README.md`, `AGENTS.md`,
  `next.config.ts`, `src/lib/junior/play/levels.ts`, `progress.ts`, `src/components/junior/play/junior-play.tsx`,
  `src/lib/i18n/locales.ts`, `src/app/globals.css`, and the bundled Next.js docs under
  `node_modules/next/dist/docs/`.
