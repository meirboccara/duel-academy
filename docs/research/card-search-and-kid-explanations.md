# Card search page and kid-friendly card explanations

> **Date of observation:** 2026-11-23. Repository read on `feature/engine-improvement` at HEAD `e211ccb` (working tree clean for this note). No code was changed and nothing was published.
>
> **The request (owner):** (1) a header link to a "search cards" page; (2) each card explained in a very simple, child-friendly way. Example given for Mystical Space Typhoon: you target a card when you activate it, then the chain must resolve before it is destroyed.
>
> **Sourcing rule:** every claim cites a source. Code claims use `path:line`. Rules claims prefer Konami (rulebook PDF, PSCT articles, card database). Plain-language claims prefer US Digital.gov / plain-language principles and WCAG. Proposals are labelled **(ours)**. Anything not confirmed against a primary source is marked **UNVERIFIED**.
>
> **File naming.** `docs/research/` uses an undated topic slug with a "Date of observation" header ([kids-interactive-academy.md:28-29](./kids-interactive-academy.md)). This note follows that.
>
> **Relation to existing notes.** [junior-zones-extra-deck-card-reading.md](./junior-zones-extra-deck-card-reading.md) already records PSCT and card-reading for Junior. [kids-interactive-academy.md](./kids-interactive-academy.md) covers ages 8–12, reading load, and Konami beginner order. [card-rulings-and-french-text-sources.md](./card-rulings-and-french-text-sources.md) covers Neuron ToU and French text. [junior-save-slots-character-choice-official-art.md](./junior-save-slots-character-choice-official-art.md) covers official art via YGOPRODeck. This note does not rewrite those; it applies them to a search page and kid explanations.
>
> **This is not legal advice.** §D reports what rights holders publish. Decisions on IP need the owner (and counsel if needed).

---

## 0. Short answer

- **Header today has no in-app nav links** beyond the brand home link. Patreon and the language switcher sit beside it. Adding "Search cards" means editing `SiteHeader` and mounting a new App Router page under `src/app/`.
- **Routing is App Router** (`apps/academy-ygo/src/app/`). There is no `pages/` directory. `/academy/*` and `/junior` redirect home (`next.config.ts`).
- **Cards:** `@duel-academy/cards` holds rules in `cards.ts` (~289 engine cards) and printed facts in `card-art.ts` (~301 art entries). Fields include name, French name, kind, race/icon, frame, optional level/ATK/DEF/attribute/text/ban, and an image passcode. Pictures live under `apps/academy-ygo/public/cards/`.
- **No dedicated card-search or kid-explanation page exists.** Closest UI: Deck builder binder search (name-only) and album grid without search. Play copy uses printed text, not a second "for kids" layer.
- **Mystical Space Typhoon is not in the catalogue.** Official English text (Neuron, cid 4909): *"Target 1 Spell/Trap on the field; destroy that target."* Quick-Play Spell. Targeting is activation text before `;`, **not** a cost. The owner's example wording should say "point to / choose" at activation, not "pay a cost".
- **Kid explanations should keep official terms** (Chain, Target, Cost, Activate, Resolve, Quick-Play) but teach them one at a time in short sentences — matching the app's own "one line at a time" copy rule and Konami's "simplify for a 10-year-old" demo guidance.

---

## A. The codebase

### A.1 Header and navigation

| Fact | Source |
| --- | --- |
| Header component | `apps/academy-ygo/src/components/site-header.tsx:12-33` |
| Only in-app link: brand name → `/` via `next/link` | `site-header.tsx:16-18` |
| External Patreon `<a>` + `LanguageSwitcher` | `site-header.tsx:19-30` |
| Comment: "one children's game", name leads home | `site-header.tsx:8-10` |
| Mounted on every page in root layout | `apps/academy-ygo/src/app/layout.tsx:29` |
| Test expects brand → `/`, no "Beginner"/"Home" links, exactly 2 links (brand + Patreon) | `apps/academy-ygo/src/components/site-header.test.tsx` ("leads home…", "no longer offers the beginner course…", "offers to support…") |
| Audience ages 8–12 | `apps/academy-ygo/src/lib/brand.ts:5-6` |

**Implication (ours):** a "Search cards" link belongs in `SiteHeader` next to the existing controls; the header test that asserts link count will need updating when implemented.

Footer resource links (YGOPRODeck, YGOProJudge, DuelingTCG) are hidden on `/junior` paths (`site-footer.tsx:17-18,22-42`). Home is Junior (`page.tsx` renders `JuniorHome`), and `/junior` redirects to `/` (`next.config.ts:13-17`), so those footer outbound links are currently shown on the children's home path. **(ours)** A card-search page should stay inside the app and not push kids to third-party sites; linking Konami's database from a grown-up "Learn more" is a separate decision.

### A.2 Routing style

- **App Router**, not Pages Router: routes under `apps/academy-ygo/src/app/` (`layout.tsx`, `page.tsx`, `junior/`, `academy/[chapter]/[lesson]/`). No `src/pages/` directory.
- Home is Junior only (`apps/academy-ygo/src/app/page.tsx:3-6`).
- Temporary redirects: `/junior` → `/`, `/academy/:path*` → `/` (`next.config.ts:10-17`). Academy lesson files still exist under `src/app/academy/` but are not offered as live URLs.

**(ours)** A search page fits as e.g. `src/app/cards/page.tsx` (list) and optionally `src/app/cards/[id]/page.tsx` (detail), linked from the header with `Link href="/cards"`.

### A.3 How cards are defined (`packages/cards`)

| Piece | Role | Source |
| --- | --- | --- |
| `cards.ts` | Engine rules (`kind`, `effect`, `cost`, `icon`, frames…) | `packages/cards/src/cards.ts:1-7,27+` |
| `card-art.ts` | Printed facts from YGOPRODeck (generated) | `packages/cards/src/card-art.ts:1-24` |
| `card-art.json` | Passcode list feeding the art build | `packages/cards/src/card-art.json` |
| `index.ts` | Registers catalogue with the engine | `packages/cards/src/index.ts:9` |
| README | Art generated by `pnpm --filter academy-ygo cards:art` | `packages/cards/README.md:3-5` |

**`CardArtEntry` fields** (`card-art.ts:4-23`):

- Always: `image` (passcode used as picture id), `name`, `nameFr`, `kind` (`monster` \| `spell` \| `trap`), `race` (Monster Type or Spell/Trap icon such as `"Quick-Play"`), `frame`.
- Monsters: optional `level`, `atk`, `def`, `attribute`.
- Effect text: optional `text`, `textFr` (Normal Monsters omit story text in this file).
- Optional `ban` (`Forbidden` / `Limited` / `Semi-Limited`).

**Counts observed 2026-11-23 (derived from the generated files):**

- `CARD_ART` entries: **301**.
- `CARDS` / `JuniorCardId` entries: **289** (four Junior-only invented monsters — `glint-lynx`, `cinder-hedgehog`, `dozy-moth`, `busy-bee` — have rules without art entries; sixteen art-only ids are not in `CARDS`).
- Kind mix in art: ~219 monsters, ~61 spells, ~22 traps.
- ~179 entries carry English `text:`; ~15 carry `ban:`.

**Mystical Space Typhoon:** no id containing `typhoon` / `mystical-space` in `card-art.ts` or `cards.ts`. Closest similar Quick-Play destroy-one patterns already in the pack include Offerings to the Doomed (`thunder-clap`) and Book of Moon (`book-of-moon`) (`card-art.ts:42,277`).

Pictures: `public/cards/<passcode>-160.webp` and `-480.webp`, long-cached (`next.config.ts:23-28`). Footer credits YGOPRODeck / Duelists Unite (`site-footer.tsx:46`).

### A.4 Existing list / search / detail / kid text

| UI | What it does | Kid explanation? |
| --- | --- | --- |
| `DeckBuilder` | Binder filters (`all` / monster / spell / trap / extra), **name search**, sort by level/ATK/name, detail panel with full printed text | No — shows `copy.cards[card].text` (printed wording) (`deck-builder.tsx:51-57,62-64,100-105,182-183`) |
| `AlbumDialog` / `AlbumCards` | Grid of owned cards; no search | No (`album-dialog.tsx`) |
| `display-card` / `BinderCard` | Card face with art | No |
| Play `copy-*.ts` | "One line at a time, short enough to be said aloud" for UI; card `text` is **printed** wording | Tone for UI exists; **no parallel kid-rewrite field** (`copy.ts:11-12,24-25`) |
| `printedWords()` | Falls back to `CARD_ART` name/text EN/FR | Printed only (`card-words.ts`) |
| Academy slides / `sample-cards.ts` | Schematic teaching cards, not the Junior catalogue | Separate curriculum |

**Docs already planning a binder search UX:** deck builder "filters by kind, a search, a sort, and a panel…" (`docs/academy-junior-masters-plan.md:113-115`). That is in-play, owned-cards only — not a whole-catalogue search page.

### A.5 Docs on tone, age, glossary, card explanations

| Topic | What docs already say | Source |
| --- | --- | --- |
| Ages **8 to 12** | Brand and research | `brand.ts:5-6`; `kids-interactive-academy.md` title/§1 |
| Reading load **(ours)** | At most two short sentences per story page; one new term at a time | `kids-interactive-academy.md:303-305` |
| Play copy | One line, said aloud | `copy.ts:11` |
| PSCT teaching | `CONDITIONS : ACTIVATION ; RESOLUTION`; targeting and costs before `;` | `junior-zones-extra-deck-card-reading.md:50-52,428-444` |
| French glossary of **game terms** | Official French card/rulebook terms | `docs/academy-french-terminology.md` |
| Agent domain glossary | `CONTEXT.md` pattern for code vocabulary, not kid card blurbs | `docs/agents/domain.md` |
| **No** dedicated kid "card explanation" corpus | — | Search of `docs/` found lessons/play copy, not per-card kid blurbs |

---

## B. Rules accuracy (primary sources)

### B.1 Mystical Space Typhoon — official text

Fetched 2026-11-23 from Konami Neuron:

- **Name:** Mystical Space Typhoon
- **Type:** Quick-Play Spell
- **Card Text:** `Target 1 Spell/Trap on the field; destroy that target.`
- **cid:** 4909
- **URL:** https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4909&request_locale=en

Japanese FAQ list for the same cid (サイクロン) shows matching effect text and 補足情報 dated 2022-04-29 (face-up or face-down legal; cannot target itself; cannot activate with no other Spell/Trap; cannot activate in the Damage Step) — https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4909&request_locale=ja. **TCG:** English database text is authoritative for play; OCG Q&A has no formal TCG authority (see [card-rulings-and-french-text-sources.md](./card-rulings-and-french-text-sources.md) §2).

**Not in this repo's card list** — samples below that use MST are for the owner's example and for future catalogue work.

### B.2 PSCT: colon, semicolon, targeting vs cost

| Claim | Primary source |
| --- | --- |
| Structure is **CONDITIONS : ACTIVATION ; RESOLUTION** | PSCT Part 3: https://www.yugioh-card.com/en/play/psct/psct-3/ ; Rulebook v10 glossary "Colon (:) and Semi-colon (;)" p. 52 (PDF `SD_RuleBook_EN_10.pdf`) |
| Text before `:` = when / conditions | Same |
| Text before `;` = what you do **when you activate** — **"This includes things like costs and targeting."** | PSCT Part 3 |
| Text after `;` = what happens at **resolution** | Rulebook glossary p. 52; PSCT Part 3 |
| **Costs** are pay / discard / Tribute / destroy in activation text; "Costs are always paid at activation." | PSCT Part 4: https://www.yugioh-card.com/en/play/psct/psct-4/ ; Rulebook "Pay a Cost" p. 54 |
| Costs are **not** part of the effect; paying a cost does not start a Chain | Rulebook p. 51, 53 |
| If resolution text still says **"target" / "that target"**, re-check targeting requirements at resolution | PSCT Part 4 |
| Order: check condition → do activation (cost/target) → **then** others may Chain → resolve backward | PSCT Part 3 |

**For MST specifically:** "Target 1 Spell/Trap…" is **before** the semicolon → chosen at **activation**. There is **no** cost word (no discard, pay, Tribute). Destroy happens **after** `;` → at **resolution**. Calling the target a "cost" is incorrect.

### B.3 Chain resolution

Rulebook v10 pp. 44–47 (`SD_RuleBook_EN_10.pdf`, section "Chains and Spell Speed"):

- A Chain orders multiple activated effects.
- Players keep adding links until both pass; then resolve **"in reverse order – starting with the last card that was activated."**
- Diagram: resolve from the top link down to Chain Link 1.
- Quick-Play Spells are **Spell Speed 2** (with Normal/Continuous Traps and Quick Effects).

Quick-Play Spell timing (rulebook p. 29): can activate during any Phase of your turn; on the opponent's turn only if Set beforehand, and not the same turn you Set it. Beginner's Guide (YS17) p. 15–16: "Quick-Play – You can play these Spell Cards from your hand during any Phase of your turn. You can also Set them and use them like Trap Cards." PDF: https://img.yugioh-card.com/en/downloads/rulebook/YS17_BG_EN.pdf

### B.4 If the target leaves / changes before resolution

- PSCT Part 4: when the effect still refers to a **"target"**, requirements must still be met at resolution; if the card says **"it"** instead, requirements only had to be met when targeted.
- MST says **"destroy that target"** → **"that target"** wording → if the chosen card is no longer a legal Spell/Trap on the field when MST resolves, the destroy does not apply to it **(application of PSCT Part 4 to this exact text; no separate English TCG ruling page for MST was found on the play site)**.
- Japanese FAQ list for cid 4909 includes questions about chaining to an activation and destroying with サイクロン (e.g. titles mentioning Swords of Revealing Light + Cyclone). Full Q&A bodies were not systematically translated here; treat OCG Q&A as **UNVERIFIED for TCG authority** unless restated in TCG materials.
- **Flipped face-down:** for MST, face-down Spell/Trap is still a Spell/Trap on the field (Japanese 補足情報 allows face-down targets at activation). A Spell/Trap does not "flip" like a monster; if the question meant Book of Moon on a **monster** target, see §B.5. **UNVERIFIED** as a dedicated English ruling sentence for "MST vs card that becomes face-down mid-chain" beyond PSCT "that target" re-check.

### B.5 Brief accuracy notes for cards that **are** in `packages/cards`

Printed English text below from `card-art.ts` (YGOPRODeck-sourced; Neuron URLs cited where re-fetched 2026-11-23). Kid blurbs in §C must follow these mechanics.

| Card (repo id) | Printed text (EN) | Activation vs resolution | Cost? | Target? |
| --- | --- | --- | --- | --- |
| Book of Moon (`book-of-moon`) | Target 1 face-up monster on the field; change that target to face-down Defense Position. | Target at activation; change at resolution. Quick-Play. | No | Yes — "that target" | Neuron cid 5432 |
| Monster Reborn (`monster-reborn`) | Target 1 monster in either GY; Special Summon it. | Target GY monster at activation; Summon at resolution. | No | Yes ("it") | Neuron cid 4842 |
| Lightning Vortex (`lightning-vortex`) | Discard 1 card; destroy all face-up monsters your opponent controls. | Discard is **cost** before `;`; destroy does **not** target. | Yes | No | Neuron cid 5217 |
| Pot of Desires (`pot-of-desires`) | Banish 10 cards… face-down; draw 2… | Banish is **cost**; draw at resolution. | Yes | No | Neuron cid 12465 |
| Sakuretsu Armor (`sakuretsu-armor`) | When an opponent's monster declares an attack: Target the attacking monster; destroy that target. | Condition before `:`; target before `;`; destroy after. | No | Yes | Neuron cid 5799 |
| Rush Recklessly (`spark-dash`) | Target 1 face-up monster…; it gains 700 ATK… | Target at activation; boost at resolution. Quick-Play. Uses "it" after `;`. | No | Yes |
| Offerings to the Doomed (`thunder-clap`) | Target 1 face-up monster…; destroy that target, also skip your next Draw Phase. | Same pattern as MST but on a monster; "also" = both parts independent (PSCT Part 7). | No | Yes |
| Tribute to the Doomed (`spark-trade`) | Discard 1 card, then target 1 monster…; destroy it. | Discard + target in activation; "then" orders them. | Discard is cost-like activation; destroy uses "it". | Yes |
| Heavy Storm (`heavy-storm`) | Destroy all Spell and Trap Cards on the field. | No `;` targeting clause — does not target. | No | No |
| Harpie's Feather Duster (`harpies-feather-duster`) | Destroy all Spell and Trap Cards your opponent controls. | Same — no target. | No | No |
| Fissure (`fissure`) | Destroy the 1 face-up monster… lowest ATK… | Chooses by rule text, does not say "Target". | No | No (per PSCT non-"target" reading; see zones note §9 on inference) |
| Dark Magician / Blue-Eyes / other Normal Monsters | No effect text in `card-art` | Summon / battle stats only | — | — |

### B.6 Official basic terms a kid explanation must get right

| Term | Official sense (short) | Source |
| --- | --- | --- |
| **Activate** | Placing a Spell/Trap face-up (or flipping Set) / declaring a monster effect | Beginner's Guide FAQ "What does Activate mean?" (YS17 PDF ~p. 15–16); Rulebook Spell activation language p. 28 |
| **Resolve** | Carry out the effect text after the Chain is ready / for that link | Rulebook Chain section pp. 44–47; glossary colon/semicolon p. 52 |
| **Chain** | Ordered stack of activated effects; resolve last-in first-out | Rulebook pp. 44–47 |
| **Target** | Card(s) chosen in activation text (before `;`) | PSCT Parts 3–4 |
| **Cost** | Pay/discard/Tribute/etc. required to activate; paid up front; not refunded if negated; not an effect | PSCT Part 4; Rulebook "Pay a Cost" p. 54 |
| **Quick-Play Spell** | Spell Speed 2; from hand on your turn any Phase; on opponent's turn only if Set earlier (not same turn Set) | Rulebook p. 29, 45; YS17 Beginner's Guide |

Speed Duel Guide explicitly defers "advanced things like Quick-Play Spells" to the full rulebook (Speed Duel Guide PDF opening pages).

---

## C. Child-friendly explanation guidance

### C.1 Plain-language / reading-level (authoritative)

| Guidance | Source |
| --- | --- |
| "The first rule of plain language is: write for your audience." Use language they understand; account for their knowledge. | https://digital.gov/guides/plain-language/principles |
| "Only write for 8th graders if your audience is, in fact, an 8th-grade class." | Same |
| Short and simple: simple clear words, active voice; "Long, complex sentences containing multiple phrases and clauses can confuse the reader." | https://digital.gov/guides/plain-language/principles/short-simple |
| Active voice, present tense, address the reader | https://digital.gov/guides/plain-language/writing |
| WCAG 2.2 **3.1.5 Reading Level (AAA):** when text needs more than **lower secondary** ability (~7–9 years of school), provide simpler supplemental content | https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html |

**Numeric "max N words per sentence" for children:** not found as a hard federal rule on the Digital.gov pages fetched. **UNVERIFIED** as a universal number. This repo's own prior proposal remains: ≤2 short sentences per story beat (`kids-interactive-academy.md:303-305`).

### C.2 How Konami explains rules to beginners

| Material | Tone / content | URL / file |
| --- | --- | --- |
| Demo Judge FAQ | Tailor to age; "If you are demoing to a **10-year-old**, try to **simplify**…"; demos **10–15 minutes**; cover card types, features, phases, interactions, LP, winning | https://www.yugioh-card.com/en/judges/demo-faq/ |
| Starter Deck Beginner's Guide (YS17) | Short FAQ definitions ("What does Activate mean?"); icon blurbs for Continuous / Equip / Quick-Play / Field / Counter | https://img.yugioh-card.com/en/downloads/rulebook/YS17_BG_EN.pdf |
| Speed Duel Guide | Very short play script; points to full rulebook for Quick-Play etc. | https://img.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf |
| Official Rulebook v10 | Full terms; Chain diagram with Heavy Storm example | https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf |
| For Beginners video order | Basics first, then "Chains and Chaining", then Extra Deck summons | Cited in `kids-interactive-academy.md:228-232` → https://www.yugioh-card.com/eu/forbeginners/ |

### C.3 Template per card **(ours)**

Keep official words in a small glossary strip; body text stays short.

```text
## {Printed name}
Kind: {Monster / Spell / Trap} · {Normal / Quick-Play / …}

What it does
- One or two short sentences in present tense. Say the outcome in kid words,
  but keep Target / destroy / banish when those are the real verbs.

When you play it (Activate)
- What you must already see on the field / in hand.
- What you do **right away**: pay any Cost; choose any Target.
- Say clearly: "Choosing is not a Cost." when the card targets.

What happens later (Resolve)
- "Other cards may answer. Then we resolve the Chain from the last card back."
- Then state this card's after-`;` effect.

Watch out!
- One gotcha: missing target, Quick-Play Set rule, once-per-turn, Damage Step, etc.

Chain picture (optional)
- Stack analogy: last card put on the stack happens first.
```

**Correction to the owner's example wording:**  
"You target when you activate, then the Chain finishes, then the card is destroyed" is right on **timing**. Framing the target as something you "pay" / a **cost** is wrong — targeting is activation procedure beside costs, not a cost (PSCT Part 3–4). Prefer: "You **point to** one Spell or Trap when you play this. That choice is not a cost. After everyone has answered, this card **destroys** the one you pointed to."

### C.4 Sample explanations **(ours)**, checked against §B

#### Mystical Space Typhoon *(not in repo catalogue; owner's example)*

**What it does**  
This Quick-Play Spell destroys one Spell or Trap on the field.

**When you play it**  
Point to one Spell or Trap. You do that as soon as you activate the card. Pointing is **not** a cost — you are not discarding or paying Life Points.

**What happens later**  
Other cards may answer (a Chain). We resolve from the **last** card played back to the first. When this card's turn comes, it destroys the card you pointed to — if that card is still a legal target on the field.

**Watch out!**  
On your opponent's turn you must have Set it earlier (and not the same turn you Set it). It cannot destroy a card that is already gone when it resolves.

#### Book of Moon *(in catalogue)*

**What it does**  
This Quick-Play Spell turns one face-up monster face-down into Defense Position.

**When you play it**  
Point to one face-up monster. That is your Target at activation — not a cost.

**What happens later**  
After the Chain resolves down to this card, that monster becomes face-down Defense Position if it is still a legal "that target".

**Watch out!**  
Same Quick-Play Set rules as other Quick-Play Spells.

#### Lightning Vortex *(in catalogue)*

**What it does**  
Destroys every face-up monster your opponent controls.

**When you play it**  
**Discard 1 card** from your hand. That discard is a **Cost** — you pay it right away, even if someone negates the Spell later.

**What happens later**  
When this Spell resolves, those face-up monsters are destroyed. You never "Target" them one by one.

**Watch out!**  
If this is the only card in your hand, you cannot activate it (nothing left to discard).

#### Sakuretsu Armor *(in catalogue)*

**What it does**  
This Trap destroys the monster that just attacked.

**When you play it**  
Only when an opponent's monster **declares an attack**. Then point to that attacking monster (Target).

**What happens later**  
After the Chain, destroy that target if it is still legal.

**Watch out!**  
You must have Set this Trap on a previous turn. It does not work against a monster that is not declaring an attack.

---

## D. Card search UX for kids

### D.1 Fields to search / filter (from actual data)

From `CardArtEntry` + engine card:

| Field | Use in UI **(ours)** | Notes |
| --- | --- | --- |
| `name` / `nameFr` | Primary text search | Deck builder already searches localized name + English name (`deck-builder.tsx:104`) |
| `kind` | Filter chips: Monster / Spell / Trap | Matches deck builder |
| `race` | Filter: Type (Warrior…) or Spell/Trap icon (Quick-Play…) | Important for "find Quick-Play Spells" |
| `frame` | Filter: Normal / Effect / Fusion / Synchro / Xyz / Link / Ritual | Extra Deck teaching |
| `attribute`, `level`, `atk`, `def` | Optional advanced filters | Monsters only; keep behind "More filters" for ages 8–12 |
| `text` / `textFr` | Optional full-text search | Powerful but noisy; secondary |
| `ban` | Badge, optional filter | Forbidden/Limited teaching |
| Kid blurb **(new field, ours)** | Shown on detail; searchable later | Not in data today |
| `image` | Thumbnails via local `/cards/{image}-160.webp` | Already how the app serves art |

**Default kid UX (ours):** big search box (name), three kind filters, results as card pictures + name, tap → detail with printed text **and** kid template sections. Reuse Deck builder patterns; do not require "owned" for a catalogue browser.

### D.2 Image licensing and official database linking

| Source | What it allows / forbids | Relevance |
| --- | --- | --- |
| **Neuron Terms of Use** (updated 04/14/2025) | Personal, non-commercial license; forbids systematically downloading/storing a database; forbids scraping; forbids reproduce/publish without approval | https://legal.konami.com/games/neuron/terms/tou/en/ — do **not** scrape Neuron for the search page |
| **YGOPRODeck API guide** | Must download/store images locally; **do not hotlink**; 20 req/s; store API data locally | https://ygoprodeck.com/api-guide/ — matches current `cards:art` pipeline |
| **App footer** | Unofficial fan project; art credited to YGOPRODeck / Duelists Unite; not affiliated with Konami | `site-footer.tsx:44-46` |
| **Owner decision (prior research)** | "You can use official artwork" via local copies | `junior-save-slots-character-choice-official-art.md` §0 / §5 |
| **Konami EU support (secondary pointer)** | States they do not hand out permission for graphics/logos | Cited in web search snippets from eu-support.konami.com — treat residual IP risk as **owner decision**, not cleared by this note |

**(ours) Linking practice for a kid page:**

- Show **local** art only (already in `public/cards/`).
- Optional grown-up "Official card text" link to Neuron by **cid** (need passcode→cid map; YGOPRODeck `konami_id` with `misc=yes` — secondary transport; cite Neuron URL in UI).
- Do not scrape or bulk-mirror Neuron on page load.
- Keep the existing non-endorsement footer on the search/detail pages.

---

## E. Owner decisions (2026-11-23)

1. **Mystical Space Typhoon: add it** to `@duel-academy/cards`.
2. **Kid explanations live in a separate file**, not inside `CARD_ART`.
3. **Search shows every card**, the whole YGOPRODeck catalogue, not only the 289 in the game. Postgres is acceptable if needed.
4. **Kid explanations in every app language:** `en`, `fr`, `he` (`apps/academy-ygo/src/lib/i18n/locales.ts:1`).
5. **Each card page links to its YGOProJudge card page**, not to Neuron.

### E.1 Facts checked after the decisions

| Fact | Source |
| --- | --- |
| YGOProJudge card page is `https://ygoprojudge.com/cards/<passcode>`. `/cards/5318639` returns 200 with title "Mystical Space Typhoon - Card Rulings · YGOPROJudge". Slug (`/cards/mystical-space-typhoon`) and Konami cid (`/cards/4909`) both return 404. | Fetched 2026-11-23 |
| YGOProJudge search is `https://ygoprojudge.com/cards?q=<name>` | Site home page markup, 2026-11-23 |
| The app already stores the passcode as `CardArtEntry.image`, so the link needs no new data for cards in the game | `packages/cards/src/card-art.ts:4-23` |
| The full YGOPRODeck catalogue is about 14,684 cards (`cardinfo.php?misc=yes`) | `docs/research/arkana-dark-magician-coverage-2026-11.md:344` |
| No database exists in the repo today (no Postgres, Prisma, Drizzle or Supabase) | Repo search, 2026-11-23 |
| YGOPRODeck: store data and images locally, never hotlink, 20 requests/s | https://ygoprodeck.com/api-guide/ |
| The footer already links YGOProJudge, so it is not a new outbound site for the app | `apps/academy-ygo/src/components/site-footer.tsx:10` |

### E.2 What the decisions mean **(ours)**

- **Scale of the kid explanations.** About 14,700 cards in 3 languages is about 44,000 short texts. Nobody can write or rules-check that by hand. Choices: (a) kid explanations only for a curated set (the 289 game cards plus MST first), and printed text plus the YGOProJudge link for every other card; (b) generate drafts with a model and mark them "not yet checked" until reviewed; (c) a mix of both.
- **Hebrew has no official card text.** Konami prints no Hebrew cards, so Hebrew kid explanations would be the only Hebrew card text. They must keep the official English term (or one fixed Hebrew term) for Target, Chain and Cost.
- **Postgres is probably not needed for searching.** ~14.7k cards as a static JSON file, built by a script like `cards:art`, can be searched in the browser or in a Next.js route. Postgres would matter only for edited data, such as reviewing kid explanations, and the app has no server data layer today.
- **Pictures for every card.** YGOPRODeck forbids hotlinking, so the whole catalogue needs local images. At two sizes per card that means tens of thousands of files (or object storage). This is the biggest cost of "every card". A smaller option is to show a picture only for cards in the game and a plain frame for the rest. **UNVERIFIED:** total image size was not measured.
- **Engine vs search.** Search can list 14.7k cards, but only cards in `CARDS` can be played. The card page should say which ones the kid can use in the game.

### E.3 Second round of decisions (2026-11-23)

- **First version: full YGOPRODeck catalogue in Postgres now**, not a smaller set first.
- **Kid explanations file lives in `packages/cards`** (for example `packages/cards/src/kid-explanations.ts`), next to `cards.ts` and `card-art.ts`.
- Mystical Space Typhoon's passcode is **5318639**. Checked on YGOProJudge: `/cards/5318639` returns 200 with title "Mystical Space Typhoon - Card Rulings · YGOPROJudge".

### E.4 Third round of decisions (2026-11-23)

- **Every card gets a kid explanation.** The card page shows **only the one in the chosen language** (`en`, `fr` or `he`), not all three.
- **Kid explanations can live in the database.** This replaces the "separate file in `packages/cards`" decision from §E.3. A file in the repo can't hold about 44,000 texts.
- **Every card gets a picture.** The owner suggests a **shared database** for the cards and is still thinking about it.

### E.5 What already exists in YGOProJudge (owner's other app)

Read-only look at `~/Documents/personal/project-meir/apps/duel-nextjs` on 2026-11-23:

| Fact | Source |
| --- | --- |
| Postgres with Drizzle | `duel-nextjs/drizzle.config.ts` |
| `ygo_cards`: passcode (primary key), Konami id, name, type, race, description, archetype, ATK/DEF/level/attribute, typeline. About 14,533 cards. | `duel-nextjs/src/server/db/schema/schema.ts:149-240` |
| `ygo_card_images`: one row per artwork, with a `storage_path` in their own bucket ("YGOPRODeck IP-blacklists hot-linkers") | `schema.ts:241-267` |
| Daily ingest from YGOPRODeck; new art is uploaded to an R2 bucket | `duel-nextjs/scripts/ingest-cards.ts:1-22` |
| Image route `GET /api/card-image/{imageId}/{size}?v=`; it copies a missing picture on its first request | `duel-nextjs/src/server/images/route-handler.ts:36`, `scripts/mirror-images.ts:11-12` |
| Picture store: R2 bucket when `R2_*` is set, otherwise local disk | `duel-nextjs/src/server/images/index.ts:37-44` |
| No table for kid explanations | Search for "kid / explanation / blurb" in `src`, 2026-11-23 |
| French card text in that database | **UNVERIFIED**: not checked |

So the card data, the pictures and the daily refresh Duel Academy needs already exist in YGOProJudge. The real question is how Duel Academy reaches them.

### E.6 Ways to share **(ours)**

1. **Read the same Postgres directly.** Duel Academy gets a read-only database user on YGOProJudge's cards tables and serves pictures from the same R2 bucket. This is the fastest search, with nothing copied. The catch: the two apps become tied by the table layout, so a schema change in YGOProJudge can break Duel Academy.
2. **Call a YGOProJudge API.** YGOProJudge would add a small card API (search, card by passcode) and Duel Academy would show pictures through its `/api/card-image/...` route. The apps stay loosely tied, but Duel Academy goes down if YGOProJudge does, and someone has to build and maintain that API.
3. **Duel Academy keeps its own copy.** Duel Academy runs the same ingest into its own Postgres and bucket. It's independent, but it doubles the storage and the daily jobs.

**Kid explanations:** a table `card_kid_explanations (passcode, locale, text, status, source, updated_at)`. It could sit in Duel Academy's own schema in the shared database (options 1 and 3) or in YGOProJudge (option 2). A model drafts them, for example the first time a card is opened in a language, and saves them. `status` marks "draft" or "checked" so the page can label drafts. Each draft must follow the PSCT rules in §B.2: choosing a target is not a cost, and the chain resolves last-in-first-out.

### E.7 Fourth round of decisions (2026-11-23)

- **Sharing: option 1.** Duel Academy reads YGOProJudge's Postgres card tables (`ygo_cards`, `ygo_card_images`) with a **read-only** database user and shows pictures from the same R2 bucket. Duel Academy never writes to YGOProJudge's tables.
- **Kid explanations go in Duel Academy's own table** in the same database, in a separate Postgres schema owned by Duel Academy (for example `academy.card_kid_explanations`), so YGOProJudge's migrations never touch it.
- **An AI model drafts every kid explanation.**
- **No game jargon in the explanation.** The text must not use words like "Target", "Chain" or "Cost". It says what they mean in plain words a child understands, written fresh in each language (`en`, `fr`, `he`), not translated word for word. **This overrides §C.3**, which kept the official terms. The official card text stays visible on the page (and on YGOProJudge) for grown-ups.

  Example for Mystical Space Typhoon (English, draft style): "Pick one Spell or Trap card on the field. Your opponent can still play a card to answer. When it's this card's turn, the card you picked is destroyed, if it's still there."

### E.8 Fifth round of decisions (2026-11-23)

- **YGOProJudge is a provider only.** Duel Academy may read its card data and pictures **read-only**. It must **not** create Academy tables, schemas or migrations on YGOProJudge's database. That overrides the "`academy` schema in the same database" part of §E.7.
- **If Academy needs a database** (kid explanations, drafts, review status), it gets **its own Postgres**, owned by Duel Academy.
- **Pictures: same as YGOProJudge** — serve mirrored art the same way Judge does (R2 when `R2_*` is set; image route that mirrors on first request). Do not hotlink YGOPRODeck.
- **Kid explanations are drafted offline**, by running Claude as an agent in the terminal — **not** on page load / "on flight". The search and card pages only **read** stored explanations. Missing text shows a short "coming soon" line plus official card text.
- **Header label:** "Cards" / "Cartes" / "קלפים".

### E.9 Build plan **(ours)** (revised after §E.8)

1. **Two data stores.**
   - **Cards + art (provider):** read-only client against YGOProJudge's `ygo_cards` / `ygo_card_images` (typed mirror of those tables in Academy; no writes). Env: `CARDS_DATABASE_URL` (read-only). Pictures: same pattern as Judge — either shared R2 credentials + Judge-compatible paths, or call Judge's `/api/card-image/{imageId}/{size}` (owner picks which "same as" means in ops; behaviour matches Judge).
   - **Kid explanations (Academy-owned):** separate Postgres + Drizzle in `apps/academy-ygo` (or a small `packages/` data module). Table e.g. `card_kid_explanations (passcode, locale, text, status 'draft'|'checked', model, prompt_version, created_at, updated_at)`, unique `(passcode, locale)`. Env: `ACADEMY_DATABASE_URL`.
2. **Search page.** `src/app/cards/page.tsx`: name search, Monster/Spell/Trap filters, picture grid, server-side paged query on the provider DB.
3. **Card page.** `src/app/cards/[passcode]/page.tsx`: picture, name, official text, kid explanation **for the chosen locale only**, link `https://ygoprojudge.com/cards/<passcode>`, badge when the passcode is in `@duel-academy/cards` `CARDS`.
4. **Offline drafting.** A repo script / Claude Code terminal workflow reads official text from the provider (or a dump), writes kid blurbs with the §B.2 / §C / no-jargon rules, and upserts into Academy's DB. No model call from the Next.js request path.
5. **Header.** "Cards" / "Cartes" / "קלפים" in `SiteHeader`; update `site-header.test.tsx`.
6. **Mystical Space Typhoon.** Add to `packages/cards` (passcode 5318639) via `cards:art`.

### E.10 Sixth round of decisions (2026-11-23)

- **Local Docker for development** for both the read-only cards DB (YGOProJudge's Postgres on port 5433) and Academy's own Postgres for kid explanations.
- **Pictures load from `ygoprojudge.com`**: use Judge's image route (`https://ygoprojudge.com/api/card-image/{imageId}/{size}?v=…`), not shared R2 credentials in Academy and not YGOPRODeck hotlinks.

### E.10a Correction (2026-11-23): §E.5 described the wrong app

§E.5 looked at `project-meir/apps/duel-nextjs`. That is the owner's **dueling platform**. It calls YGOProJudge as an outside service (`duel-nextjs/CONTEXT.md:1003,1072`); it is **not** YGOProJudge. YGOProJudge is the repo `~/Documents/personal/ygo-judge` (`git@github.com:meirboccara/ygo-judge.git`). What it actually has:

| Fact | Source |
| --- | --- |
| `cards` table: only `passcode`, `name`, `desc`, `archetype`, `synced_at`. No card kind, type, ATK/DEF or pictures. | `ygo-judge/db/schema.ts:151-157` |
| `card_rulings` per passcode, with `raw_card_json` (nullable) and AI ruling sections | `ygo-judge/db/schema.ts:160-183` |
| Database is hosted (Neon). No local Docker setup is documented; `DATABASE_URL` is optional. | `ygo-judge/.env.example:63-66` |
| Pictures are not mirrored. The live card page loads `https://ygoprojudge.com/_next/image?url=https://images.ygoprodeck.com/images/cards/<passcode>.jpg&w=384&q=75`, through Next's image optimizer (`remotePatterns` allows `images.ygoprodeck.com`). | Live page `/cards/5318639`, 2026-11-23; `ygo-judge/next.config.ts:15-23` |
| `https://ygoprojudge.com/api/card-image/...` returns **404**: that route belongs to duel-nextjs, not YGOProJudge | Fetched 2026-11-23 |

So decisions §E.7–E.10 ("same database as YGOProJudge", "local Docker", "pictures from ygoprojudge.com") need to be made again against the right app.

### E.10b Seventh round of decisions (2026-11-23), after the correction

- **Card data: YGOProJudge's own database** (`ygo-judge` repo, `cards` table), read-only. Search is by name only: that table has no Monster/Spell/Trap kind.
- **Pictures: through ygoprojudge.com**, the way YGOProJudge shows them: `https://ygoprojudge.com/_next/image?url=<images.ygoprodeck.com/images/cards/<passcode>.jpg>&w=256|384&q=75`.
- **Built (uncommitted)**: header link "Cards" → `/card-search`, the search and card pages, Duel Academy's own `card_kid_explanations` table, the `explanations:todo` / `explanations:save` scripts, and [docs/kid-explanations-guide.md](../kid-explanations-guide.md). The route is `/card-search` because `/cards/*` already serves the local card pictures with year-long caching (`next.config.ts`).
- **Mystical Space Typhoon** shows up in search from YGOProJudge's list. Making it **playable** in the Junior game needs a new engine effect (destroy 1 Spell/Trap); that's not done yet.

### E.10c Goal of the card explanations (owner, 2026-11-23)

Duel Academy has two features with one goal: **the game** and **the card explanations**. The card explanations let a child **look up a card they own** and understand what it does. What follows:

- **Find by the printed number.** Every card shows its passcode at the bottom left (8 digits, for example `05318639`). Search accepts it, with the leading zero and spaces, and opens that card directly. Built.
- **Names in the child's language.** French cards have French names. Owner's decision: **add them to YGOProJudge**. Done in the `ygo-judge` working tree (uncommitted): a nullable `cards.name_fr` column with a trigram index (migration `0039_cards_name_fr.sql`), filled by `cards:sync` from YGOPRODeck `language=fr`. Duel Academy searches the English or French name and shows the French name to French readers. Hebrew readers hold English cards, so they need nothing extra.
- The explanation comes first on the card page. The printed text and the YGOProJudge link are for grown-ups.

### E.11 Still open

1. Hosted / production `CARDS_DATABASE_URL` (read-only) when leaving local Docker.
2. Hosted Academy Postgres for explanations in production.
3. IP: whole-catalogue display makes the Konami question bigger (§D.2).

---

## F. UNVERIFIED

- Exact English TCG ruling sentence for "MST target leaves the field / is activated in response" beyond applying PSCT "that target" rules (OCG FAQ exists; TCG authority not established).
- Whether face-down change mid-Chain affects MST beyond "still a Spell/Trap on the field".
- Hard numeric reading-age formula (e.g. "max 12 words") from Digital.gov — not found; WCAG lower-secondary bar is for AAA supplemental content, not a kid-copy word cap.
- Full GOV.UK "reading age of 9 / 25-word sentences" page: redirects encountered; **not** re-verified in this session.
- Completeness of French `textFr` vs Neuron FR (known gaps in [card-rulings-and-french-text-sources.md](./card-rulings-and-french-text-sources.md)).
- Whether every `card-art.ts` English string still matches Neuron on 2026-11-23 (only MST, Monster Reborn, Book of Moon, Lightning Vortex, Pot of Desires, Sakuretsu Armor were re-fetched).

---

## Sources

### Repo (absolute paths)

- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/components/site-header.tsx`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/components/site-header.test.tsx`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/app/layout.tsx`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/app/page.tsx`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/next.config.ts`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/lib/brand.ts`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/components/site-footer.tsx`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/components/junior/play/deck-builder.tsx`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/lib/junior/play/copy.ts`
- `/Users/meirboccara/Documents/personal/duel-academy/apps/academy-ygo/src/lib/junior/play/card-words.ts`
- `/Users/meirboccara/Documents/personal/duel-academy/packages/cards/src/card-art.ts`
- `/Users/meirboccara/Documents/personal/duel-academy/packages/cards/src/cards.ts`
- `/Users/meirboccara/Documents/personal/duel-academy/packages/cards/README.md`
- `/Users/meirboccara/Documents/personal/duel-academy/docs/research/kids-interactive-academy.md`
- `/Users/meirboccara/Documents/personal/duel-academy/docs/research/junior-zones-extra-deck-card-reading.md`
- `/Users/meirboccara/Documents/personal/duel-academy/docs/research/card-rulings-and-french-text-sources.md`
- `/Users/meirboccara/Documents/personal/duel-academy/docs/research/junior-save-slots-character-choice-official-art.md`
- `/Users/meirboccara/Documents/personal/duel-academy/docs/academy-junior-masters-plan.md`

### Konami / official

- Mystical Space Typhoon (Neuron): https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4909&request_locale=en
- MST Japanese FAQ list: https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4909&request_locale=ja
- Book of Moon: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5432&request_locale=en
- Monster Reborn: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4842&request_locale=en
- Lightning Vortex: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5217&request_locale=en
- Pot of Desires: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=12465&request_locale=en
- Sakuretsu Armor: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5799&request_locale=en
- PSCT index: https://www.yugioh-card.com/en/play/psct/
- PSCT Part 3: https://www.yugioh-card.com/en/play/psct/psct-3/
- PSCT Part 4: https://www.yugioh-card.com/en/play/psct/psct-4/
- Rulebook page: https://www.yugioh-card.com/en/rulebook/
- Rulebook PDF: https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf
- Beginner's Guide PDF: https://img.yugioh-card.com/en/downloads/rulebook/YS17_BG_EN.pdf
- Speed Duel Guide PDF: https://img.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf
- Demo Judge FAQ: https://www.yugioh-card.com/en/judges/demo-faq/
- Neuron Terms of Use: https://legal.konami.com/games/neuron/terms/tou/en/
- Fast Effect Timing (no mid-resolution graveyard sentence found on-page): https://www.yugioh-card.com/en/play/fast-effect-timing/

### Plain language / a11y

- Digital.gov plain language principles: https://digital.gov/guides/plain-language/principles
- Short and simple: https://digital.gov/guides/plain-language/principles/short-simple
- Writing (active voice): https://digital.gov/guides/plain-language/writing
- WCAG 2.2 Understanding 3.1.5 Reading Level: https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html

### Secondary (transport / prior art only)

- YGOPRODeck API guide: https://ygoprodeck.com/api-guide/
- Yugipedia MST page (pointer to db #4909 only; not used as rules authority): https://yugipedia.com/wiki/Mystical_Space_Typhoon
