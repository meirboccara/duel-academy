# Card rulings and French card text: where to get them by card id

> **Date of observation:** 2026-11-22/23. Working tree on `main`, HEAD `7d5587d`. Only this note was added: no code changes, commits, branches or publishing. Downloads went to the system temp directory outside the repository, and Python ran with `-I`. Fetches were one-off research lookups: about 15 Konami pages, rate-limited to one request every 2 seconds.
>
> **Question (issue #5):** "Where can official per-card rulings and French card text be fetched by card id?" The owner's rule: a card is *done* only when (a) tests built from its official text and official rulings pass, each test citing its source, and (b) its official French text is stored by card id.
>
> **Sourcing rule:** each claim cites the page or file it comes from. Anything marked **(ours)** is our inference or proposal. Section 7 lists the points not yet confirmed.

## 0. Short answer

| Need | Primary source | Keyed by | Format | Automated fetching |
|---|---|---|---|---|
| Official card text, all TCG languages incl. **French** | Konami **Yu-Gi-Oh! Neuron card database**, TCG side: `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=<cid>&request_locale=fr` | Konami **cid** (database id), **not** the passcode | HTML only | Terms of Use forbid scraping and "creat[ing] a database by systematically downloading and storing Materials" without written consent. No robots.txt is served. |
| Official per-card rulings: FAQ notes ("補足情報") + Q&A entries | Same database, **Japanese OCG side only**: `faq_search.action?ope=4&cid=<cid>&request_locale=ja` (list) and `faq_search.action?ope=5&fid=<fid>&request_locale=ja` (one Q&A) | cid for the card, **fid** for each Q&A | HTML only, Japanese only | Same Terms of Use |
| Official TCG rulings | **No per-card TCG rulings database exists.** The TCG has the rulebook, the Problem-Solving Card Text and advanced-rules pages, and the tournament policy. A Head Judge's call is final at an event. | n/a | HTML/PDF | n/a |

Our current French text comes from **YGOPRODeck**, a secondary source. On six sampled cards it differs from Konami's current French text on 2, and 7 of the repo's 179 cards that carry printed text silently fall back to English (section 5). **(ours)** The best by-id machine-readable route to Konami's current text and to the OCG Q&A is **YGOResources** (`db.ygoresources.com`), which is keyed by Konami cid and Q&A fid. It is a secondary mirror, so a test should cite the Konami URL for each item, and YGOResources only as the place we fetched it from.

## 1. Konami's card database (Yu-Gi-Oh! Neuron)

### 1.1 Ids

- Every card page and every FAQ page is addressed by **`cid`**, Konami's database id. Example: Polymerization is `cid=4837` on both the TCG and the OCG side. The French TCG page is [card_search.action?ope=2&cid=4837&request_locale=fr](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4837&request_locale=fr), and the Japanese Q&A list for the same cid is [faq_search.action?ope=4&cid=4837&request_locale=ja](https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4837&request_locale=ja) (「融合」へのQ&A一覧, 93 entries on 2026-11-22).
- The **passcode** (the 8 digits printed on the card, e.g. `24094653` for Polymerization) does **not** appear on the Konami page: a search of the downloaded French page found no match. To get from a passcode to a cid you need an aggregator. YGOPRODeck returns `konami_id` with `misc=yes` (its [API guide](https://ygoprodeck.com/api-guide/): "konami_id - The Konami ID of the card. This is not the passcode"). Verified mappings: 24094653→4837, 83764719→4842, 56120475→5799, 94192409→5914, 70342110→7400, 35261759→12465, 42141493→20500.
- One Q&A entry has a **`fid`** (e.g. [fid=23817](https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=23817&request_locale=ja), about activating 融合 under Macro Cosmos-type effects). Each list item shows an update date (更新日, here 2025-03-22).
- **Stability (ours):** cid URLs have been stable for years: this repo already cites them in `docs/academy-french-terminology.md`, and community sites key on them. The older Konami ruling hosts did **not** survive. The `yugioh.faq.konami.jp/EokpControl?…` links that Yugipedia still cites, and the Konami Europe judge forum `tcg.konami-europe.net/judgeforum/`, both failed to connect on 2026-11-23. Q&A entries also carry update dates, so their content can change. A citation should therefore record the date retrieved and the update date shown, and keep a short quote.

### 1.2 What each locale contains (observed 2026-11-22)

- **Card text:** the TCG side has English, Deutsch, **Français**, Italiano, Español and Portugues. The OCG side has 日本語, 한글, English (Asia) and 簡体字. These are the language switchers on the card page. The French page states: « Veuillez vous référer à cette page pour les règles officielles du JCC Yu-Gi-Oh! pour la carte "Polymérisation." » The English page says: "Please refer to this page for the Yu-Gi-Oh! TCG official rules for 'Polymerization.'"
- **Rulings (FAQ/Q&A): Japanese only.** `faq_search.action?ope=4&cid=4837` returned the Q&A list for `request_locale=ja`, with the card text, the 補足情報 notes dated 2022-05-20, and the Q&A list. For `en`, `fr`, `de`, `ko`, `ae` (English Asia) and `cn` it returned the database home page, with no `ope=5&fid=` links. The TCG card page has a hidden "view Q&A" switch in its script (`faq_search.action?ope=4&cid=4837`), but it leads nowhere outside Japanese.
- **Format:** server-rendered HTML. Card text sits in `<div class="text_linebreak">` after the "Texte de Carte" / "Card Text" label. No documented API was found.

### 1.3 Terms of use and robots

- The database footer links to the **Terms of Use (Yu-Gi-Oh! Neuron)**, "Last Updated: 04/14/2025", in every locale ([en](https://legal.konami.com/games/neuron/terms/tou/en/), [fr](https://legal.konami.com/games/neuron/terms/tou/fr/), [ja](https://legal.konami.com/games/neuron/terms/tou/ja/)). §3 grants a "personal, limited, revocable non-transferable license … solely for your personal, non-commercial purposes". §4 (Rules of Conduct) forbids, among other things:
  - "Create a database by systematically downloading and storing Materials."
  - "Use any robot, spider, site search/retrieval application or other manual or automatic device to retrieve, index, 'scrape', 'data mine' or in any way gather Materials … without Konami's express prior written consent."
  - "Reproduce, modify, adapt, publish, distribute … translate … any portion of the Services without Konami's prior approval."
- **robots.txt:** `https://www.db.yugioh-card.com/robots.txt` returns **404** (an nginx page behind Incapsula). `https://www.yugioh-card.com/robots.txt` redirects to `img.yugioh-card.com/robots.txt`, which also returns **404**. A missing robots.txt does not override the Terms of Use.
- **(ours)** Storing Konami's French text "by card id" for every card we ship is exactly "systematically downloading and storing". This holds whether we fetch the text from Konami or receive it through an aggregator: the text is Konami's either way. The repo already does this through YGOPRODeck (section 5). Whether that is acceptable for this project (non-commercial? teaching use? an existing licence?) is a **decision for the owner**. Section 7 lists it, and asking Konami for consent is the clean route. This is not legal advice.

## 2. Which rulings have authority for the TCG

- **The Head Judge decides.** "The Head Judge makes the final call for game play rulings and/or policy appeals. No other individual, including the Tournament Organizer or a KONAMI employee, can overturn a game play ruling" (KDE-US Tournament Policy v2.5, in effect September 5, 2025, [PDF](https://img.yugioh-card.com/en/downloads/penalty_guide/YGOTCG_Tournament_Policy_v_2_5.pdf)). The KDE-E policy, which covers Europe including France, has the same sentence (v2.5, [PDF](https://www.yugioh-card.com/eu/wp-content/uploads/2025/09/Official-KDE-E-Yu-Gi-Oh-TRADING-CARD-GAME-Tournament-Policy-Version-2.5.pdf), listed on the [policy documents page](https://www.yugioh-card.com/eu/play/policy-documents/)).
- **Card text authority:**
  - KDE-E policy §G (p. 54): "The most recent text for all cards can be found in the CARD DATABASE at: https://www.db.yugioh-card.com/yugiohdb/".
  - §M "Cards With Localization Errors or Incorrect Text" (KDE-E p. 59; KDE-US has the same wording): "the cards should be played according to the **English-language text** found on the CARD DATABASE".
  - **So for the TCG, English database text is authoritative, and French text is official but subordinate when it differs.**
- **No official per-card TCG rulings resource was found.** The judge FAQ sends judges to the Official Rulebook for RC-1. For RC-2 it sends them to "[Advanced Rules](https://www.yugioh-card.com/en/play/fast-effect-timing/)" and "[Problem-Solving Card Text](https://www.yugioh-card.com/en/play/psct/)" ([Konami Judge Program FAQ](https://www.yugioh-card.com/en/judges/judge-faq/)). The TCG menu lists only the Rulebook, PSCT, Advanced Rules, the 2021 rules update and alternate formats ([/en/play/](https://www.yugioh-card.com/en/play/)). The policy tells players to "read and understand the most current version of the official rulebook", and lists the French rulebook at `https://www.yugioh-card.com/eu/fr/play/yu-gi-oh-tcg-rulebook/` (KDE-US policy §F).
- **OCG rulings have no formal authority over the TCG**, though in practice they are the reference. YGOResources ([/about/not_tcg](https://db.ygoresources.com/about/not_tcg), secondary) puts it this way: KDE-J's FAQ bullets and Q&A are "issued by KDE-J, and thus holds no inherent authority over the TCG … The TCG has no documentation of comparable quantity, and many TCG judges will thus use the OCG's resources to inform their personal interpretation", while some entries fall under remaining OCG/TCG differences. None of Konami's TCG documents read here says this. Konami is silent on OCG Q&A.
- **Historic TCG rulings:** Yugipedia's rulings pages separate "OCG Rulings" from "Previously Official Rulings". The latter are "TCG rulings … issued by Upper Deck Entertainment and have since been declared unofficial by Konami" ([Card Rulings:Polymerization](https://yugipedia.com/wiki/Card_Rulings:Polymerization)). They should not be cited as authority.
- **(ours) Ranking for our tests:**
  1. English TCG card text in the database (what the card does)
  2. TCG rulebook, PSCT and Advanced Rules pages (general mechanics)
  3. Japanese OCG FAQ bullets and Q&A for that cid (per-card detail), marked `authority: "ocg"`
  4. Nothing from Upper Deck, forums, or wikis as authority

  When an OCG Q&A conflicts with TCG text or a known CG difference, the test follows the TCG and records the conflict.

## 3. Official French card text

- **Primary:** the Konami TCG database with `request_locale=fr`, by cid, HTML only, under the same Terms of Use. French appears only once the card is released in the TCG. The database's own home page says card info "will be available starting from its release date".
- The tournament policy confirms French TCG printings are legal everywhere in the TCG ("TCG cards printed in English, French, German, Italian, Portuguese, Spanish, or Japanese are legal…", §H). For a functional discrepancy, English wins (§M above).
- **French rulebook:** `https://www.yugioh-card.com/eu/fr/play/yu-gi-oh-tcg-rulebook/` (Konami EU). This is for terminology, not card text. See `docs/academy-french-terminology.md` for which terms were checked and for the earlier failed v9 PDF extraction.

## 4. Secondary aggregators: how they relate to the primaries

| Aggregator | Keyed by | Content | Relation to primary | Usage terms |
|---|---|---|---|---|
| **YGOPRODeck API** `db.ygoprodeck.com/api/v7/cardinfo.php?id=<passcode>&language=fr` | passcode (`id`); `konami_id` filter and `misc=yes` field | EN/FR/DE/IT/PT names and text, no rulings | Copy of card text of **unstated provenance and freshness**. The [API guide](https://ygoprodeck.com/api-guide/) says only that each language has "over 9000 cards translated" and that leaked OCG cards are "available only in English until the official translation is released". Observed to lag Konami (section 5). | "Please download and store all data pulled from this API locally"; 20 requests/s limit with a 1-hour block; images must not be hotlinked |
| **YGOResources DB** `db.ygoresources.com/data/card/<cid>`, `/data/qa/<fid>` ([API doc](https://db.ygoresources.com/about/api)) | **Konami cid and fid** ("All IDs are Konami's database IDs, and all paths request JSON objects") | Card text in ae/cn/de/en/es/fr/it/ja/ko/pt, Japanese FAQ bullets (`faqData`, with date), the Q&A index for the card (`qaIndex`, 93 ids for 4837), and Q&A in Japanese plus a **fan English translation** (`translationStatus`, `tlSrc`/`thisSrc` dates) | Mirrors Konami. Checked: its French Polymerization text equals Konami's current text, its Q&A 23817 equals Konami fid 23817, and the Japanese date 2025-03-22 matches. The English Q&A is a translation, not Konami's. | "Don't query the entire database … cache that data locally". Responses carry `X-Cache-Revision`, and `/manifest/<revision>` lists changed paths. "If you have a use case that requires offline access to all the data, get in touch." |
| **Yugipedia** `Card Rulings:<name>` | English page name; card pages show the database id | Translated OCG rulings with reference links, plus "Previously Official" Upper Deck rulings | Translation layer. Some of its reference URLs point to dead Konami hosts (section 1.1). | Wiki licence (not checked) |
| **YGOrganization** | articles | News and OCG Q&A translations | Translation and commentary, not authority | not checked |

**(ours)** In every case the Konami URL (cid/fid) is what a test cites. An aggregator is the transport we fetched it through, recorded separately.

## 5. What the repo does today

- `apps/academy-ygo/scripts/cards/build-art.mjs` fetches `cardinfo.php?id=<passcodes>` once in English and once with `&language=fr`. It caches the results in `apps/academy-ygo/.cache/cards/info-{en,fr}.json` (git-ignored by `apps/academy-ygo/.gitignore:5`) and generates `packages/cards/src/card-art.ts`, which has `nameFr` and `textFr` per app card id (`build-art.mjs:45-60, 84-93`).
- The key chain is app card id → **passcode** (`packages/cards/src/card-art.json`, e.g. `"polymerization": { "card": 24094653 }`). **No Konami cid is stored anywhere.**
- **Silent English fallback:** `nameFr: fr?.name ?? en.name` and `textFr: fr?.desc ?? en.desc ?? ""` (`build-art.mjs:91`). Of 301 entries, 179 carry printed text, and **7 have `textFr` identical to the English text**. All 7 are missing from the YGOPRODeck French response: Dark Time Wizard, Dark Magical Curtain, The Guiding Flute of Summoning Dragons, Kaibaman the Legend, Deep-Eyes White Dragon, the Blue Abyss, Blue-Eyes White Dragon, the White Phantom Beast, and Mulcharmy Fuwalos. Konami's French database **does** have at least three of them: cid 20500 *Mulcharmy Fuwalos* (« Si vous ne contrôlez aucune carte (Effet Rapide) : vous pouvez défausser cette carte… »), cid 21432 *Kaibaman la Légende*, and cid 22692 *Rideau Magique Sombre*. The other four were not checked. Three of them had their TCG release on 2026-11-12 per YGOPRODeck `misc_info`.
- **Sample check of YGOPRODeck FR vs Konami FR (6 cards, 2026-11-23):**
  - Equal: Monster Reborn (4842), Dispositif d'Évacuation Obligatoire (5914), Prison Dimensionnelle (7400), Pot des Désirs (12465).
  - **Different:**
    - *Polymérisation* (4837). Konami: « …depuis votre main ou Terrain. » YGOPRODeck and the repo: « …depuis votre main ou Terrain **comme Matériel Fusion**. »
    - *Armure de Sakuretsu* (5799). Konami: « Lorsqu'un monstre **de l'adversaire** déclare une attaque… » YGOPRODeck and the repo: « …**de votre adversaire**… »

  In every sampled case the repo's `textFr` matched YGOPRODeck. **(ours)** Both differences look like older printings' wording. They do not change how the cards play, but they mean the repo's French text is not "Konami's current text", contrary to the comment in `apps/academy-ygo/src/lib/junior/play/card-words.ts:5-6` ("Konami's wording").
- **Terminology:** `docs/academy-french-terminology.md` and `apps/academy-ygo/src/lib/i18n/terminology-fr.test.ts:7-19` already cite Konami French pages by **cid** (4837, 6176, 7742, 5907, 18788) and guard term families (Matériel, Jeu-Rapide, Sacrifiez, bannir). That doc says real-card text "should be looked up by its stable database identity". Lesson strings are in `apps/academy-ygo/src/lib/i18n/fr-content.json` and interface strings in `ui-fr.ts`. Both are translated by hand and are not tied to card ids.

## 6. Proposal (ours): how a test cites a ruling, and how a card stores its French text

1. **Store the Konami cid next to the passcode** in `card-art.json`, e.g. `"polymerization": { "card": 24094653, "cid": 4837 }`. Fill it once from YGOPRODeck `misc=yes` or YGOResources' print-code index, then check by hand on the Konami page.
2. **French text by cid, with its source:** e.g. `textFr`, `textFrSource: { url: "…card_search.action?ope=2&cid=4837&request_locale=fr", retrieved: "2026-11-23" }`.
   - Make the build **fail**, not fall back to English, when French is missing. Allow an explicit `textFrPending: true` for cards not yet released in French.
   - Fetch from YGOResources `/data/card/<cid>` (JSON, by cid) or from YGOPRODeck, then **diff against the Konami page** before a card counts as done.
   - Whether automated fetching from Konami itself is allowed depends on section 1.3 (owner decision).
3. **Each ruling test cites one source object:**

   ```ts
   // packages/cards/test/polymerization.test.ts
   const macroCosmosQa = {
     kind: "ocg-qa",              // "card-text" | "ocg-faq-bullet" | "ocg-qa" | "tcg-rulebook" | "tcg-psct" | "tcg-advanced-rules" | "tcg-policy"
     authority: "ocg",            // "tcg" for card text, rulebook, PSCT and policy; "ocg" for KDE-J FAQ/Q&A
     cid: 4837, fid: 23817,
     url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=23817&request_locale=ja",
     updated: "2025-03-22",       // 更新日 shown by Konami
     retrieved: "2026-11-23",
     quote: "発動できます。その場合、墓地へ送られる融合素材モンスターは除外されますが…", // short, original language
     via: "https://db.ygoresources.com/data/qa/23817", // transport only, never the authority
   } as const;
   it(`can Fusion Summon while Macro Cosmos-type effects apply; materials are banished [${macroCosmosQa.url}]`, () => { … });
   ```

   - The test title says the rule in English, and the `quote` keeps a few words of Konami's original so the citation survives a dead URL.
   - A test from card text cites `kind: "card-text"` with the **English** TCG page (authority under §M) and the cid.
   - FAQ bullets cite `ope=4&cid=` plus the bullet's date (`faqData.meta.ja.date`, 2022-05-20 for 4837).
4. **Collect sources in one file per card** (e.g. `packages/cards/rulings/<app-card-id>.ts`) so a coverage test can assert that every card marked done has a `card-text` source, at least one ruling source or an explicit "no rulings exist", and a non-pending `textFr`.

## 7. Unconfirmed points

- **Konami consent and licensing:** whether this project may store Konami's French text (and Japanese Q&A quotes) by card id under the Neuron Terms of Use §3/§4. Not resolved here. This is an owner decision, ideally made by asking Konami.
- **Whether Konami TCG gives per-card rulings in any official channel today**, for example customer-service email or set-release FAQs. None was found on yugioh-card.com/en or /eu. Not searched exhaustively.
- **Korean OCG Q&A:** `request_locale=ko` showed no Q&A for cid 4837, but a separate Korean source was not looked for.
- **FAQ availability may depend on session or cookie locale.** Each locale was tested once, without cookies.
- **cid stability** is inferred from long-standing use. Konami does not document it. Whether Konami keeps Q&A revisions or overwrites them in place is unknown.
- **The provenance of YGOPRODeck's French text** is not documented. YGOResources' freshness was checked on two items only.
- **Yugipedia and YGOrganization licences** were not checked.
- **Four of the seven fallback cards** (Dark Time Wizard, The Guiding Flute…, Deep-Eyes…, Blue-Eyes…, the White Phantom Beast) were not looked up on Konami's French database.
- The sample comparison covers **6 cards**. The repo's other 173 French texts were not compared.
