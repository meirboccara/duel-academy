# Bot approach for meta decks: per-deck plans, general search, or a hybrid?

> **Question (GitHub issue #4):** the Masters (bot trainers at four levels: basic, medium, strong, expert) will play real tournament meta decks under full tournament rules. Should they play from (b) per-deck scripted game plans, (c) a general search bot (MCTS / information-set MCTS with determinization, an evaluation function, maybe self-play learning), or a hybrid of general search plus per-deck combo hints?
>
> **Date of observation:** 2026-11-23. Working tree on `main`, HEAD `7d5587d`. Only this note was added. Downloads (papers, WindBot / Forge / ygo-agent sources) and the benchmark scripts were kept in the system temporary directory outside the repo; Python was not needed (PDFs were read with `pdftotext`). Downloaded content was treated as data.
>
> **Sourcing rule:** claims about other projects cite their own source files or papers. Claims about this repo cite `file:line`. Anything that is our reasoning, estimate or measurement is marked **(ours)**. Unconfirmed points are listed in section 8.
>
> **Builds on:** [meta-decks-engine-coverage-2026-11.md](./meta-decks-engine-coverage-2026-11.md) (which cards and rules are missing) and [trainer-meta-decks.md](./trainer-meta-decks.md).

## 0. Answer in short

**Recommendation: the hybrid. Keep one general bot that chooses only among the engine's legal moves and checks each choice by simulating it. Give it per-deck combo hints written as data (lines, end boards, what to keep for the opponent's turn). Add determinized Monte Carlo sampling at the few decisions where hidden information matters, mostly for expert.** Full ISMCTS and self-play learning are not worth building now **(ours)**.

Why, in one paragraph each:

- **Pure per-deck scripts (b)** are how every playable Yu-Gi-Oh bot works today. WindBot, the bot of YGOPro/EDOPro, has one hand-written C# executor per deck, and the meta decks we want are among them: Elfnote is 8,597 lines, Radiant Typhoon 5,175, Sacred Beast 2,760 and Sky Striker 1,864 (section 2.1). Its own contributor guide calls the inability to foresee what an effect will do its main limitation. A script plays the real combo well when nothing interrupts it. Each script costs thousands of lines per deck, and it breaks with every ban list or new support card.
- **Pure general search (c)** is what the card-game literature recommends for Magic and Hearthstone. It reached expert-rules strength in a reduced Magic with less than one CPU-second (section 3). But it depends on a fast forward model: 10,000 iterations in about one second, or a simulator running 10,000 full games per second. Our engine currently runs about 15 random full games per second on small Academy decks (section 5). That is roughly three orders of magnitude too slow, and the gap will widen with 40-card meta decks. Generic search also struggles to find 20-to-40-step combo turns whose payoff only shows at the end of the turn.
- **The hybrid** is what Forge, the largest open-source Magic engine, has converged on (section 2.3). Its heuristic AI plays, a flat Monte Carlo layer with re-dealt hidden cards compares its top 5 to 8 candidates, and a combo catalogue rewards rollouts for assembling known combos. Our engine can already simulate every move (`apply`/`legalPlays`), so our hints can be checked by the engine rather than trusted blindly. WindBot cannot do that, by its own account. The hybrid also fits a children's teaching game: the trainer plays the deck's real, recognisable line, and difficulty comes from how much of the plan it knows and how well it answers.

**What this implies for the engine** (detailed in section 6): (1) **a complete legal-action listing**, including every chain-response window, all zones, all material sets and multi-target choices. This is the hard prerequisite for any of the three options. (2) **A stable name for each move** (card, effect, choice) that hints can refer to. (3) **A view of the board from one player's side plus a re-deal of hidden cards** (determinization). (4) **Determinism**, which is already in place (a seeded RNG inside `Board`). (5) **Speed**: listing legal moves must get about 10 to 30 times cheaper for the hybrid's sampling, and 100 to 1,000 times cheaper for real ISMCTS, plus running the bot in a Web Worker with a time budget.

## 1. What exists today: `packages/engine/src/bot.ts`

`bot.ts` is a **general bot that looks one move ahead, scores boards with a fixed evaluation, and plans a little within its own turn**. It has no per-deck knowledge:

- **Move generation by the engine.** `botMove` takes `legalPlays(state)` (`bot.ts:127`). Each play already carries the board it leads to, so every candidate is simulated, not guessed (`engine.ts:3461-3565`: candidate moves are generated and each one is run through `apply`, which keeps those that are accepted).
- **Evaluation.** `evaluate` (`bot.ts:55-75`) scores Life Points weighted by `aggression`, monster strength, hand size (×3), Set cards (×3), Field Spells, a small penalty for hand traps still in hand, and a `foreseen` estimate of what the opponent's next Battle Phase would cost (`bot.ts:96-115`). It has no notion of the number of interruptions, the cards left in the Deck, the Extra Deck, or combo progress.
- **Hidden information.** It never reads face-down cards or the opponent's hand. An attack on a face-down monster is scored against an assumed 1,500 DEF (`bot.ts:79,135-143`), coin tosses are averaged (`bot.ts:144-148`), and a pending answer is scored "as if the other player let it happen" (`settled`, `bot.ts:44-52`). **(ours)** One small leak: a move that draws (for example Pot of Greed) is scored on the true drawn cards, because `legalPlays` resolves on the real Deck order. Today it barely matters, because `evaluate` only reads the bot's own hand contents for the hand-trap penalty.
- **Lookahead.** `plans` (0 to 2) re-ranks the best `PLANNED = 8` moves by the best board reachable within `plans` more of its own moves (`bot.ts:118,158-169,180-187`). It does not plan past coin tosses or unseen monsters. It never models the opponent's turn beyond `foreseen`.
- **Answers.** When something is pending, it picks the answer that leaves the best settled board, or passes, and forgets to answer with probability `1 - answers` (`bot.ts:151-161`).
- **Difficulty.** Four presets in `apps/academy-ygo/src/lib/junior/play/masters.ts:72-77`: `basic {skill 0.3, caution 0.3, answers 0.5, slack 0}`, `medium {0.5, 0.9, 0.85, slack 0.7, plans 1}`, `strong {0.85, 1, 1, slack 0.85, plans 1}`, `expert {1, 1, 1, plans 2}`, plus per-trainer `aggression`. Mistakes are "play another move that still helps" (`bot.ts:188-191`). Packs carry their own personas (`packs/blue-eyes/pack.ts:39`, `packs/hero/pack.ts:40`).
- **Runtime.** The app calls `botMove` once per step, synchronously on the main thread (`session.ts:206`), with a safety cap of 80 moves per turn (`session.ts:195-196`). No Web Worker is used **(ours: grep of `apps/academy-ygo/src`)**.

The file's own comment states the design choice: "bots, not scripts" (`bot.ts:4-8`). So the repo is already on the general-search side, with the shallowest possible search.

## 2. Existing Yu-Gi-Oh and card-game bots: what their source shows

### 2.1 WindBot (YGOPro / EDOPro): per-deck scripts, no simulation

Read from `IceYGO/windbot` master on 2026-11-23: `AGENTS.md`, `README.md`, `Game/AI/Executor.cs`, `Game/AI/DefaultExecutor.cs`, `Game/GameAI.cs` and several `Game/AI/Decks/*Executor.cs`.

- **It is per-deck scripted.** `Game/AI/Decks/` holds 73 executor files, one per deck. The guide says: "`Game/AI/Decks/`: the dedicated executors of each deck, the first place to add or adjust deck logic". It also says: "The single deck's opening routes, card priorities and temporary flags stay in that deck's executor" (AGENTS.md, translated from Chinese).
- **The order of `AddExecutor` calls is the priority.** "`GameAI` walks `Executor.Executors` in registration order …; the first executor that matches and returns `true` wins immediately". Reordering the calls changes the bot's behaviour (AGENTS.md, "AI decision model").
- **It cannot simulate.** Listed as "one of the main limitations of this project": "The bot cannot know how the game engine and card scripts will process an effect after it or the opponent activates it … Do not write strategies as if they could preview scripts, fully resolve effects or read future states." A second major limitation: choices are *pre-selected* before activation, and "when one chain contains several activations … a later activation may consume the wrong selection" (also in README "Known issue").
- **The server lists the legal moves.** "The server has already given the legal candidates when it asks the client to respond. The deck AI mostly judges 'is it worth doing now' and 'which target to pick'" (AGENTS.md). The rules engine (ygopro-core) does the enumeration, including chain windows; the bot only filters.
- **It respects hidden information** by construction: unknown cards arrive with `Id == 0` (AGENTS.md).
- **Executor sizes for decks in our requested set** (line count / number of `AddExecutor` calls, last commit date from the GitHub API): `ElfnoteExecutor.cs` 8,597 / 65 (2026-09-23), `RadiantTyphoonExecutor.cs` 5,175 / 66 (2026-09-05), `SacredBeastExecutor.cs` 2,760 / 45 (2026-09-12), `SkyStrikerExecutor.cs` 1,864 / 63 (2026-08-30). For comparison, `MalissExecutor.cs` is 4,184 / 92, the shared `DefaultExecutor.cs` is 2,227, and the do-anything test executor `DoEveryThingExecutor.cs` is 47 lines with 5 generic executors.
- **What a modern executor looks like:** `ElfnoteExecutor.cs` has helpers such as `IsOpeningComboTurn()`, `ShouldRerouteChickenSixUnderBanish()`, `IsFuwalosOnlyOpeningCompromise()` and `ComboIsStuck()`. These are hand-written branches for when the opponent interrupts the combo (lines 342-514, 3254), plus 51 private flags. **(ours)** This is what "per-deck game plan" costs in practice for one modern combo deck: thousands of lines, with every interruption branch written by a human who knows the deck.
- **Difficulty levels:** only per-deck labels such as `Normal`, `Easy`, `NotFinished` and `Test` (AGENTS.md "Adding a deck"). There is no strength setting.
- **Strength:** no published win rates against humans were found **(unconfirmed)**. The README points to "WindBot Arena", a separate project for regression tests and bot-vs-bot win-rate rankings.

### 2.2 ygo-agent: a learned policy on top of ygopro-core

`sbl1996/ygo-agent` README (read 2026-11-23):

- "ygoenv is a high performance game environment for Yu-Gi-Oh!, implemented on top of envpool and ygopro-core". The agent is trained with reinforcement learning in JAX. Card effects are turned into text and embedded with an LLM, "to handle the diverse and complex card effects".
- Cost: the reference model was "trained for over 100M games (equivalent to training on 32 4090 GPUs for 5 days)". Training on many decks "typically [needs] 8x4090 GPUs and 128-core CPU for a few days". A laptop GTX 1650 trains about 1,000 steps per second. After 50 iterations a fresh model beats random play 98% of the time, yet wins only 3.1% against the 100M-game model.
- Supported cards are a fixed list (`scripts/code_list.txt`). New decks "may also" cause errors. "MCTS Planning", "Fast fine-tuning methods for new decks" and "Zero-shot generalization of new cards" are still on the roadmap.
- It exports `.tflite` models and is served as an HTTP API for the Neos web client.
- **(ours)** Three takeaways: a learned bot needs a native-speed engine running millions of games, retraining when the card pool changes, and a GPU budget. Nothing in the README claims strength against human tournament players **(unconfirmed)**.

### 2.3 Forge (Magic: The Gathering): heuristics + flat Monte Carlo + combo catalogue

Read from `Card-Forge/forge` master, `forge-ai/src/main/java/forge/ai/`, on 2026-11-23:

- **Per-effect-type AI logic:** 159 files in `forge-ai/.../ai/ability/`, one per kind of ability. Card scripts are data (`Counterspell`: `A:SP$ Counter | TargetType$ Spell …`).
- **Flat Monte Carlo layer** (`simulation/FlatMonteCarloPicker.java`): "Flat Monte Carlo refinement on top of the normal heuristic AI". It takes "the first few approved plays (best heuristic choice first)". In each sample it "copies the game and re-deals the cards the AI cannot see (HiddenInfoShuffler)", then lets "the heuristic AI itself continue the turn (the playout policy)". The position is scored at the second main phase. Candidates use "common random numbers". "The heuristic choice gets a bonus … so rollouts only override it for a clear gain". "Every problem (time, errors, a line that cannot be simulated) falls back to the heuristic choice". It is "deliberately not a tree search". Budgets: `MAX_CANDIDATES_DESKTOP = 8`, `MAX_ROLLOUTS_DESKTOP = 8`, `MAX_DECISION_MS_DESKTOP = 1500`, `MAX_TURN_MS_DESKTOP = 6000`; on mobile `MAX_CANDIDATES_MOBILE = 5`, `MOBILE_DECISION_MS = 600`.
- **Determinization** (`simulation/HiddenInfoShuffler.java`): "For every player, the cards in hand and library that are not visible to the AI player are pooled, shuffled and dealt back into the same slots". Without this, "the AI would effectively see the opponent's hand and the order of the libraries".
- **Combo hints as data** (`simulation/ComboCatalog.java`, `ComboPlan.java`): "The known combos of Vintage, Legacy and Modern as data, read from `ai-combos.txt` (add a line there to teach the AI a new combo)". "The rollouts are rewarded for having every slot in the hand or on the battlefield". "The steps of a combo (the loops) are found by the rollouts themselves". For opponents, a visible combo is a threat to aim removal at, and "nothing in a hidden zone is looked at". `ComboPlan.java` lists combo kinds the rules engine "can really carry out" (Storm, Reanimator, Show and Tell …). There are also specific solvers (`StormSolver.java`, `ElfLoop.java`, `DoomsdayPile.java`).
- **A tree search exists too** (`SpellAbilityPicker.java`, `GameSimulator.java`, `GameCopier.java`), separate from the flat sampler.
- **(ours)** This is the hybrid this note recommends, built by a mature project for a game at least as rich as Yu-Gi-Oh: heuristics generate a few candidates, sampling with re-dealt hidden cards picks among them, and per-combo data steers the evaluation. **(unconfirmed)** Whether the flat Monte Carlo layer is on by default in released Forge builds was not checked.

### 2.4 Konami Master Duel

- **Konami's AI project.** Konami runs a "Master Duel × AI project": anyone can develop an AI that duels in Master Duel, and AIs can be pitted against each other. The AIs operate "Master Duel from outside". In 2024 two engineering teams ran a 30-day AI-vs-AI contest with "reinforcement-learning AIs" ([Konami press release on PR TIMES, 2024](https://prtimes.jp/main/html/rd/p/000001005.000050711.html); no winner or rules stated there). An interview reported by YGOrganization says the AI "is learning from scratch how to Duel by Dueling over and over" and was trained "over 100000 times" against the Solo Mode CPU, using a text-only "console simulator" ([YGOrganization, 2024-02-04](https://ygorganization.com/master-duel-upcoming-products-and-more-on-the-ai-project); secondary report of a Konami livestream).
- **Solo Mode CPU.** A third-party slide deck reverse-engineers it as "search + board evaluation": it lists actions, evaluates the board after each, and picks the best. Its evaluation looks like a comparison of total ATK and ignores how many interruptions the opponent has left ([docswell slides, 2024-09-16](https://www.docswell.com/s/asei/KDNNQ4-2024-09-16-165348), slides 29-31; inference by an outside author, not Konami). **(ours)** That is the same shape as today's `bot.ts`, with the same blind spot.
- No Konami engineering talk describing a shipped Master Duel bot was found **(unconfirmed)**.

## 3. What the research literature says

| Source | Game | Result relevant here |
| --- | --- | --- |
| Cowling, Powley, Whitehouse, "Information Set Monte Carlo Tree Search", IEEE TCIAIG 4(2):120-143, 2012 ([PDF](https://eprints.whiterose.ac.uk/id/eprint/75048/1/CowlingPowleyWhitehouse2012.pdf)) | Lord of the Rings: The Confrontation, Phantom (4,4,4), Dou Di Zhu | Determinization ("assume hidden information known, search each sample") suffers **strategy fusion** and **non-locality**. ISMCTS searches one tree of information sets instead. On Lord of the Rings, "determinized UCT is outperformed by all three ISMCTS variants". Benchmark budget: "with an efficient implementation on modern hardware, we expect 10 000 iterations to equate to roughly one second of computation, which is an acceptable delay for play against a human." On Dou Di Zhu the hidden-information effects were small. |
| Cowling, Ward, Powley, "Ensemble Determinization in MCTS for the Imperfect Information Card Game Magic: The Gathering", IEEE TCIAIG 4(4):241-257, 2012 ([PDF](https://eprints.whiterose.ac.uk/id/eprint/75050/1/EnsDetMagic.pdf)) | Reduced Magic (creatures and lands, fixed decks) | An "expert" hand-written rules player won 42.1% of 114 games against 7 strong human players. Ensemble determinized MCTS with enhancements was "competitive with a sophisticated expert rules player with a simulation budget of less than one CPU second", reaching "slightly better than the expert player". Splitting a move into a **binary yes/no decision tree** improved strength and "substantially reduced CPU time per move". **Dominated-move pruning** cut branching. **Rollouts by the deterministic expert player were worse** than rollouts by a reduced rules player with some randomness, and uniform random rollouts were "very weak". |
| Świechowski, Tajmajer, Janusz, "Improving Hearthstone AI by Combining MCTS and Supervised Learning Algorithms", CIG 2018 ([arXiv:1808.04794](https://arxiv.org/abs/1808.04794)) | Hearthstone | Their C++ simulator "performs 10K full games per second, in average". They combine perfect-information Monte Carlo sampling (PIMC) with ISMCTS, split actions into atomic steps, and use a learned value network. Against humans at 1 s per move (our reading of their Table III): about even with two "regular" players, 16 wins out of 29, and 12 wins out of 39 against two Legend-rank players. |
| Santos, Santos, Melo, "Monte Carlo Tree Search Experiments in Hearthstone", CIG 2017 ([thesis version](https://fenix.tecnico.ulisboa.pt/downloadFile/1407770020545829/dissertacao.pdf)) | Hearthstone | "By enriching Monte Carlo tree search with a properly constructed heuristic, it is possible to introduce significant gains in performance" over vanilla MCTS and the then state-of-the-art bot. |
| Choe, Kim, "Enhancing Monte Carlo Tree Search for Playing Hearthstone", CoG 2019 ([PDF](https://ieee-cog.org/2020/papers2019/paper_257.pdf)) | Hearthstone | A turn is "a move sequence via various combinations of atomic actions", so "the branching factor of the search space is extremely large". They use state abstraction into a DAG and sparse sampling for hidden information and randomness. |
| Zhang, Buro, "Improving Hearthstone AI by learning high-level rollout policies and bucketing chance node events", CIG 2017, DOI 10.1109/CIG.2017.8080452 | Hearthstone | Learned high-level rollout policies plus bucketing of chance events (abstract via Semantic Scholar; full text not read, **unconfirmed** beyond the abstract). |
| Xiao et al. (ByteDance), "Mastering Strategy Card Game (Hearthstone) with Improved Techniques", 2023 ([arXiv:2303.05197](https://arxiv.org/abs/2303.05197)) | Hearthstone | An end-to-end RL policy with fictitious self-play won all Best-of-5 matches against a top-10 China-league player. It names "Yu-Gi-Oh: Master Duel" among the games of this genre but does not test it. The cost is industrial-scale RL training. |
| Kowalski et al., "Dynamic Resource Allocation for Ensemble Determinization MCTS", 2026 ([arXiv:2607.13007](https://arxiv.org/abs/2607.13007)) | Jaipur, Lost Cities, Splendor | Ensemble determinization is still being refined in 2026 by varying the number of sampled worlds and spreading simulations unevenly across them. |

**No peer-reviewed Yu-Gi-Oh AI paper was found** (one web search plus the sources above; **unconfirmed** that none exists).

**What this means for us (ours):**

1. Search beats or matches hand-written rules in card games, *given* about 10^3 to 10^4 simulations per decision and a heuristic rollout or evaluation. Every successful result above uses domain heuristics inside the search.
2. Hidden information is handled well enough by determinization (several sampled worlds) at our scale. ISMCTS helps when information gathering and hiding matter. For a Yu-Gi-Oh trainer the important hidden facts are "does the opponent hold a hand trap?" and "what is this Set card?". Sampling worlds and taking an ensemble covers that.
3. A Yu-Gi-Oh combo turn resembles a Hearthstone turn (a long sequence of atomic actions, huge branching), only longer. The literature handles this with atomic or binary decisions, pruning, abstraction and heuristic rollouts. That is exactly the role combo hints would play.

## 4. The three options compared

All ratings are **(ours)**, for this repo's situation: TypeScript engine, browser runtime, one maintainer plus agents, tournament meta decks, four levels.

| | (b) Per-deck scripted game plans | (c) General search (determinized MCTS / ISMCTS, eval, maybe RL) | Hybrid: general search + per-deck hints |
| --- | --- | --- | --- |
| **Strength on its own combo turn** | High while the script's assumptions hold. Strongest at playing the known line exactly. | Low to medium unless the budget is huge. Payoffs come 20 to 40 actions later, and generic rollouts rarely find the line. | High: the hint proposes the line, the engine checks each step, and search fills the gaps. |
| **Strength when interrupted** (Ash, Veiler, Impermanence, Fuwalos) | Only as good as the branches written. Elfnote's executor needed explicit re-route helpers (section 2.1). Unwritten branches lead to poor play. | Good in principle: it re-plans from the new state. | Good: the hint fails to apply, search takes over from the real board, and alternative hint lines can be tried. |
| **Strength on the opponent's turn** (when to use hand traps, chain responses) | Written per card (`AshBlossomActivate` and so on in every executor). Reasonable. | Best, given enough samples. Determinization covers the opponent's possible hands. | Same as (c), limited to response windows, so the budget stays small. |
| **Effort to build** | Low engine effort, very high per-deck effort. WindBot needs 1,900 to 8,600 lines per deck. It has to be rewritten after ban lists and new support, and every deck needs a deck expert. | Very high engine effort (section 6), then near zero per deck. Tuning the evaluation for combo decks is hard: the "interruptions left" problem of section 2.4. Self-play RL adds GPU training and retraining for every card-pool change (section 2.2). | Medium engine effort: the same correctness work as (c) but far less speed work. Per deck, a short data file of lines and end boards, estimated at 30 to 150 lines rather than thousands, because legality and targets come from the engine. |
| **What it demands from the engine** | Complete legal listing still needed: tournament rules require the chain windows. Little speed needed. No determinization. | Complete legal listing, fast clone and apply, very fast move generation, a viewer-aware state with a hidden-card re-deal, determinism, and a board evaluation. | Complete legal listing, stable move identities, a viewer-aware re-deal, determinism, and moderate speed. |
| **Simulations needed per decision** | ~1 (none) | 10^3 to 10^4 (literature benchmark, section 3) | ~10 to 100 at chosen decision points, for example 5 to 8 candidates × 4 to 8 samples like Forge (section 2.3). 0 on most moves. |
| **Browser runtime cost** | Negligible. | Seconds per decision on today's engine (section 5). Needs a Web Worker and a 10^2 to 10^3× faster engine to feel acceptable. Battery and heat on tablets. | Hint steps cost one `apply` each. Sampling costs about 0.3 to 1.5 s at expert, in a Web Worker, after a 10 to 30× speedup of move listing. |
| **How difficulty levels map** | Crudely: drop branches, add random mistakes. A weak script plays oddly (it stops mid-combo). | By iterations, sampled worlds and softmax temperature over root values. Weakening by budget alone gives uneven, unnatural mistakes **(ours)**. | Naturally, by how much of the plan the trainer knows and how well it answers. See section 7. |
| **Teaching value for children** | High: shows the real combo. | Lower: may find odd but legal lines. Hard to explain. | High: real lines, and real adaptation when interrupted. |
| **Fits existing `bot.ts`** | No (a new architecture). | Partly: `legalPlays` + `evaluate` are a 1-ply search to grow from. | Yes: hints and sampling sit on top of `botMove`'s ranking (section 7). |

## 5. Measured: how fast is our engine as a forward model? (ours)

Method: the engine and cards were bundled with the repo's own esbuild (`node_modules/.pnpm/esbuild@0.21.5`) into the system temporary directory and run on Node 22.23.4, on this Windows 11 machine, single thread. The decks are the two 20-card test decks of `packages/cards/test/arena.test.ts:42-87` (`CHAINS` and `DATA`), the full mat, `board({ full: true, phase: "draw", turnNumber: 1 })` as in that test. These are **Academy decks, not meta decks**: meta lists have 40 to 60 Main Deck cards and 15 Extra Deck cards, and far more legal moves.

| Measurement | Result |
| --- | --- |
| `structuredClone` of a board (about 2 KB as JSON) | 20 to 24 µs |
| `apply` of one legal move (includes the clone) | ~39 µs on average |
| `legalPlays` (generate candidates, `apply` each, keep the legal ones) | 2.4 to 6.4 ms per call on average; on average 8 to 11 legal moves, at most 38 |
| `botMove`, expert persona (`plans: 2`) | 17 to 18 ms on average, 172 to 216 ms at worst |
| `botMove`, hint persona (`plans: 1`) | 11 to 14 ms on average, up to 140 ms |
| `botMove`, basic persona | 2.4 to 5.8 ms on average |
| Full random playout (uniform over `legalPlays`, about 45 moves) | ~67 ms per game, so **~15 playouts per second** |

Readings **(ours)**:

- `legalPlays` costs about 150 `apply` calls (5.8 ms ÷ 39 µs). The engine finds legal moves by **generate-and-test**: it lists many candidates and keeps those `apply` accepts (`engine.ts:3555-3564`). Most of that work is thrown away.
- Compare: 10,000 ISMCTS iterations per second (Cowling 2012) and 10,000 full Hearthstone games per second (Świechowski 2018) against our ~15 random full games per second. We are about 10^2.5 to 10^3 times slower, before meta decks multiply the candidates.
- Today's bot is fast enough on the main thread because it only looks 1 to 3 moves ahead. A Forge-style flat Monte Carlo pass (8 candidates × 8 samples × about 20 moves played out by `botMove` at about 15 ms) would take about 19 s per decision on today's engine. With move listing 10 to 30 times cheaper, it falls to about 0.6 to 2 s, which fits an expert's "thinking" pause in a Web Worker.
- Browser V8 should be close to Node V8, but this was **not measured in a browser, nor on a tablet** (section 8).

## 6. What the recommended hybrid requires from the engine

In order of necessity. Items 1 to 4 are correctness prerequisites that all three options need, (b) included; only the speed item is specific to search.

1. **Complete legal-action listing, including chain responses, at every point where a player may act.** Today the bot can only pick moves the engine lists, and the earlier coverage note found the list incomplete for tournament play:
   - only Counter Traps can go above an answer (`engine.ts:1482-1495`, `:1523-1533`, per [meta-decks-engine-coverage-2026-11.md §1](./meta-decks-engine-coverage-2026-11.md));
   - response eligibility comes from small explicit lists;
   - Extra Deck and Fusion/Ritual materials are capped at 3 (`MOST_MATERIALS`, `engine.ts:3441,3528-3529,3539`);
   - on the full mat a card is offered only in the first empty zone (`engine.ts:3455`), which is wrong once Link arrows and the column or centre-zone effects of Elfnote and Angelechy matter;
   - quick effects in pending mode are restricted to "targeted" data effects (`engine.ts:3485-3493`).

   YGOPro's core works the same way at every decision: it hands the client the full list of legal options, and WindBot only filters it (section 2.1). Our engine needs the same contract: "every legal move for the player who has priority now, including pass".
2. **Moves decomposed into sequential choices, each with a stable name.** Today a `Move` bundles card + zone + tributes + materials + target + discard + pick (`engine.ts:189-198`). Two things follow:
   - hints must be able to name a step ("activate Elvenotes Red's effect 1, choose X") that still matches after the board changes;
   - search gains from choosing one decision at a time, as in the Magic paper's binary decision tree (section 3), instead of a cross-product of all choices.

   A move identity like `{card, effect index, from zone, choice path}` serves both.
3. **A board seen from one player's side and a re-deal of hidden cards (determinization).** `Board` holds both hands and both Deck orders in clear (`engine.ts:146-188`), so any search over `apply` sees everything. Needed:
   - a function `observe(board, viewer)` that keeps what the viewer knows: its own hand, public zones, revealed cards, the order of cards it placed;
   - a function `determinize(board, viewer, rng)` that re-deals the opponent's hand, Set cards and both Decks' unknown order into the same slots, as Forge's `HiddenInfoShuffler` does;
   - a model of plausible opponent cards. A tournament deck list or meta hand-trap statistics are better than uniform sampling **(ours)**.
4. **Determinism.** It is already in place: the RNG state lives in `Board.rng` (`engine.ts:182-183`), shuffles and coins draw from it (`engine.ts:620-640`), coins can be forced (`apply(…, { coin })`, `engine.ts:3405`), and the engine has no `Math.random` (grep: only `bot.ts:125` defaults to it, and the app passes a seeded generator, `session.ts:197`). Keep it that way: every sample must be reproducible from a seed, for tests and for replays.
5. **Speed** (search only, graded by option):
   - **Hybrid with sampling at chosen decision points:** make `legalPlays` about 10 to 30 times cheaper. Options: build only legal-by-construction candidates; check cheap preconditions before cloning; return moves without boards and `apply` lazily (the bot only needs boards for moves it scores). Run the bot in a **Web Worker** with a time budget and a fallback to the best move so far, like Forge's `budgetNanos` and fall-back-to-heuristic rule.
   - **Full ISMCTS or MCTS with rollouts:** move generation and `apply` together must reach about 10^3 to 10^4 simulated steps per 100 ms. That means 100 to 1,000 times faster than today: mutable state with undo or structural sharing instead of a full `structuredClone` per candidate, and incremental legal-move tracking.
   - **Self-play RL:** a native-speed headless engine able to run millions of games (ygo-agent: 100M+ games, 32 GPUs × 5 days), plus a model runtime in the browser. Out of scope **(ours)**.
6. **A better evaluation**, used by all levels. Add terms for interruptions held and on board (negates, hand traps the bot knows it has, Set cards), resources (cards in hand, Deck, Extra Deck, Graveyard fuel), and per-deck end-board targets coming from the hints. The Master Duel Solo CPU is criticised for exactly this gap (section 2.4).

## 7. Sketch of the hybrid and the level mapping (ours)

- **Per-deck hints as data** next to each Master's deck (not in the engine), for example:
  - `lines`: ordered move patterns with fallbacks ("if Ash on step 2, switch to line B");
  - `endBoards`: target boards, scored in `evaluate` as plan progress;
  - `keep`: cards to keep for the opponent's turn, such as hand traps and Set traps;
  - `threats`: opponent cards worth answering, mirroring Forge's `AntiCombo`.

  A hint step is played only if it matches a legal move and the board after it is not worse by the bot's own evaluation. The engine verifies every step; nothing is assumed.
- **Decision loop:**
  1. If a hint line is active and its next step is legal, rank that step first. This is like the heuristic bonus in Forge.
  2. Otherwise, `botMove`'s current ranking applies.
  3. At *choke points* (answer or not, which hand trap to use, going-second break moves, choosing between hint lines), the expert compares the top K candidates over N determinized worlds, with the opponent's reply simulated by the same bot.
- **Levels:**
  - **basic:** today's basic persona and no hints, or only the line's first one or two steps; it forgets answers half the time.
  - **medium:** the main line without branches (it falls back to greedy play when interrupted); 1-ply answers.
  - **strong:** main line plus branch lines for the common interruptions; 1-ply answers with a determinized check of whether the opponent may have a hand trap.
  - **expert:** all lines, determinized sampling at choke points (about 300 to 1,500 ms in a Web Worker), and hand traps used with correct timing.

  The knobs that exist today (`skill`, `slack`, `answers`, `caution`, `aggression`) stay as they are.
- **Testing:** extend `packages/cards/test/arena.test.ts` into per-deck regression duels (seeded), as WindBot Arena does for WindBot. Check that the hint line completes with no interruption, re-routes against Ash and Veiler, and never makes an illegal move.

## 8. Unconfirmed points

- **Browser and tablet speed** of the engine was not measured; the section 5 numbers are Node 22 on one desktop. Meta-deck branching in our engine cannot be measured yet, because most meta cards are absent (329 of 345 unique cards, per the coverage note).
- **WindBot's strength** against humans: no published data found. Whether its 2026 executors for Elfnote, Radiant Typhoon, Sacred Beast and Sky Striker match the November 2026 lists was not checked.
- **ygo-agent's strength** against human tournament players: not stated in its README.
- **Forge**: whether `FlatMonteCarloPicker` and the combo catalogue are enabled by default in released builds was not checked. Forge's actual measured strength gain was not found.
- **Master Duel Solo CPU** design comes from a third-party slide deck, not from Konami. The result and rules of Konami's 2024 AI contest were not found.
- **Zhang and Buro (2017)**: only the abstract was available. The Świechowski Table III numbers are our reading of a garbled PDF table.
- **No Yu-Gi-Oh-specific research paper** was found. Absence is not proof.
- **Effort estimates** (30 to 150 lines of hint data per deck; 10 to 30× and 100 to 1,000× speed targets) are our extrapolations, not measurements.
