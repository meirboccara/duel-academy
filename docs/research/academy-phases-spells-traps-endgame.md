# Junior: the phases across the islands, Battle Phase steps, Spell & Trap art and types, and the final island

> **Date of observation:** 2026-11-20. Every web page and PDF cited below was fetched that day.
> The repository was read on `main` at HEAD `8c02084` (clean tree). The sibling repository
> `D:\Documents\Projet Meir\project-meir` was read, never written, the same day.
> **Nature of this document:** a research and design note. No code was changed and nothing was published.
>
> **The request (owner, paraphrased):** (1) the islands explain the phases, but island 5 does not cover them all:
> does a later island explain the rest? (2) What are the official steps inside the phases (Battle Phase steps, the
> Damage Step's timings), does the app teach them, and how could a child learn them? (3) Monsters show artwork but
> Spells and Traps do not: why, what would fix it, and which Spell and Trap types are taught? (4) What is the end of
> the journey today, and what would a final island look like where every trainer (Yugi, Atem, Kaiba and more) duels
> the child with their own deck, as automatic scripted bots, in a Master Duel–like system?
>
> **Sourcing rule used:** code claims cite `path:line` (paths under `apps/academy-ygo/` unless they start with
> `docs/` or name project-meir). Rules come from Konami's documents: the TCG *Official Rulebook Version 10* (English
> PDF) and the French *Livret de Règles Officiel Version 9.0* (Konami-hosted PDF), both converted to text locally with
> `pdftotext`, and Konami's *Damage Step Rules* page. Where only a fan source or a store listing was found, it is
> marked **(secondary)**. Proposals are marked **(ours)**.
>
> **Relation to existing notes.** [junior-mode-playful-learning.md](./junior-mode-playful-learning.md) designed the
> phase bar ("Four chimes, then six"); [junior-zones-extra-deck-card-reading.md](./junior-zones-extra-deck-card-reading.md)
> covers zones and card reading; [junior-save-slots-character-choice-official-art.md](./junior-save-slots-character-choice-official-art.md)
> covers card art and trainers. This note does not repeat them.

---

## 1. Short answers

1. **Does a later island explain the phases island 5 leaves out? No.** Island 5 ("Gagne ce tour") shows a
   four-chime bar: Draw, Main Phase 1, Battle, End (`src/components/junior/play/mini-board.tsx:494`). The six-chime
   bar appears on island 6 (2 levels), island 7 (the first whole duel), one level of island 16 and island 18
   (`src/lib/junior/play/levels.ts:139-140`, `:147`, `:215`, `:230`). **No island explains any phase in words.** The
   six names are printed on buttons; the only sentences are a phase's name when it starts ("Standby Phase."), "End
   Phase. Your turn is over." and refusal messages (`src/lib/junior/play/copy-fr.ts:330-337`, `:425-426`). The
   **Standby Phase** is never explained and nothing ever happens in it; **Main Phase 2** is required in exactly one
   level of the 79 (`rd-fissure`, island 16, `levels.ts:215`) and never explained. The six phases *are* explained,
   one slide each, in the older adult course at `/academy` (`src/content/chapters/first-duel/understanding-turn.ts:28-85`),
   but nothing on the Junior home links there (`src/app/page.tsx:3-5`).
2. **Battle Phase steps.** Konami's rulebook splits the Battle Phase into Start Step, Battle Step, Damage Step and
   End Step, with the Battle and Damage Steps repeated for each attack (Rulebook v10 pp. 37-38). Konami's *Damage
   Step Rules* page splits the Damage Step into five timings: start, before damage calculation, damage calculation,
   after damage calculation, end; a monster destroyed by battle only goes to the Graveyard at the **end** of the
   Damage Step (§3.1). **Junior teaches none of this** and leaves the Damage Step out on purpose
   (`docs/academy-junior-play.md:126`); one consequence: Kuriboh, whose printed text says "During damage
   calculation", is offered when the attack is declared (`docs/academy-junior-play.md:145`). The hidden `/academy`
   course does teach the steps and the five Damage Step parts (`src/content/chapters/advanced-rules/battle-rules.ts:29-153`).
   A French child version is proposed in §3.4, for a bonus level on island 16 and an advanced island after island 18.
3. **Spell & Trap art.** Nothing in the renderer treats Spells and Traps differently: a card shows official art if
   it has an entry in `src/lib/junior/play/card-art.json`, else its emoji (`mini-board.tsx:79-90`). The real Spells
   and Traps (from island 9 on: Monster Reborn, Mountain, Polymerization…) **do** have art. The ones without art are
   the **seven original Spells and Traps of islands 1 to 8** (Glow Charm, Spark Dash, Thunder Clap, Spark Trade, Fog
   Snare, Sticky Vine, Quick Burrow, `src/lib/junior/play/cards.ts:136-144`): invented cards, so no official art
   exists. Fixes: swap them for real twins (only Glow Charm has an exact one: Red Medicine), or draw our own art (§4.3).
   **Types:** Junior plays Normal, Field and Ritual Spells and Normal Traps only. **Quick-Play, Continuous and Equip
   Spells, and Continuous and Counter Traps are never played or explained** (§4.4). A plan to teach all nine is in §4.5.
4. **End game.** The journey ends on island 18, "Le duel de l'Extra Deck": one whole duel against the invented rival
   **Nox**, with Yami Yugi and Kaiba only watching, then a printable certificate (`levels.ts:226-250`,
   `src/lib/junior/world/trainers.ts:72`, `:214`). No trainer ever duels; every duel opponent is Nox following a
   fixed script (`src/lib/junior/play/session.ts:114-195`). In project-meir, the duel platform has a pure TypeScript
   engine (MIT, zero dependencies) and **scripted heuristic bots** that play whole duels in the browser, including a
   generic "Course Bot" that pilots any classic deck, but **no character decks**, **no automated card effects** (it is
   a manual simulator by design) and **no Damage Step timings** (§5.3). Master Duel, by contrast, resolves every
   effect automatically. Recommendation: build the final island on the Junior engine first, with one scripted deck
   per trainer drawn from cards the engine already knows, and grow the engine card by card; do not port the
   project-meir engine unless the owner wants hundreds of real cards (§5.6).

---

## 2. Q1: which island teaches which phase

### 2.1 How phases work in Junior

- The engine knows all six phases in order: `PHASES = ["draw", "standby", "main1", "battle", "main2", "end"]`
  (`src/lib/junior/play/engine.ts:15`). Phases only go forward, and a later phase can be tapped directly, skipping
  those between (`engine.ts:449-457`: only `after(to, s.phase)` is checked).
- Each level picks a phase bar: `"none" | "four" | "six"` (`levels.ts:34`, `:54`). `four` is Draw, Main Phase 1,
  Battle, End; `six` is all of them (`mini-board.tsx:494`). With `none`, phases follow the moves and an "End turn"
  button is shown (`src/components/junior/play/level-player.tsx:537-541`).
- A board can start in the Draw Phase (`strict`, `levels.ts:86-87`) or already in Main Phase 1 (`puzzle`, "the card
  for the turn already drawn", `levels.ts:88-89`).
- Phase names stay in English in all three languages (`copy-fr.ts:74`; `docs/academy-junior-play.md:71`).
- **What the child is told about phases** (French): the rule's name "Phases du tour" (`copy-fr.ts:200`); when a phase
  starts, its name, or "End Phase. Ton tour est fini." (`copy-fr.ts:425-426`); the hint "Passe à la Battle Phase."
  (`copy-fr.ts:498-499`); and refusals: "Ça, c'est pendant ta Main Phase : Invoquer, jouer une Magie, Poser un
  Piège, tourner un Monstre…", "Tu pioches une seule carte, pendant la Draw Phase.", "Le joueur qui commence ne pioche
  pas au premier tour.", "Les phases ne font qu'avancer.", "Personne n'attaque au tout premier tour d'un duel.", "Les
  attaques se font pendant la Battle Phase." (`copy-fr.ts:330-337`). The "phases" demonstration plays Draw → Main 1 →
  Summon → Battle → attack, on the four-chime bar (`levels.ts:268`). No trainer line mentions a phase
  (`trainers.ts:195-215`).

### 2.2 Island by island

"Shown" = the chime is on the bar. "Needed" = a recorded solution must enter that phase. Level counts and lines from
`levels.ts`.

| Island | Levels | Bar | Draw | Standby | Main 1 | Battle | Main 2 | End | Where |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Le Deck se réveille | 5 | none | – | – | – | – | – | – | `:97-101` |
| 2 Bouclier ou épée | 5 | none | – | – | – | – | – | "End turn" button | `:104-108` |
| 3 Appelle un ami | 8 | none ×6, **four** ×2 | **taught** (`w3-chimes`) | – | taught | taught | – | needed | `:111-118` |
| 4 Magies et Pièges | 4 | four | needed | – | needed | needed | – | needed | `:121-124` |
| **5 Gagne ce tour** | 10 | four | shown, never needed (boards start in Main 1) | – | needed | needed | – | needed (p6, p9) | `:127-136` |
| 6 La tour de tortues | 2 | **six** | needed | **stepped through once** (`w6-double`) | needed | shown | shown | needed | `:139-140` |
| 7 Le défi du rival | 1 | six | needed | shown | needed | needed | shown | needed | `:143-160` |
| 8 Lis la carte | 9 | four | – | – | needed | needed | – | needed | `:163-171` |
| 9 Tout le tapis | 7 | four (m-mat none) | – | – | needed | needed | – | – | `:174-180` |
| 10–15 Rituel … Pendule | 19 | four | once (`pe-extra`) | – | needed | needed | – | needed | `:183-211` |
| 16 Chaque mot compte | 5 | four, **six** in `rd-fissure` | – | shown | needed | needed | **needed once** | – | `:214-218` |
| 17 Légendes | 3 | four | needed (Exodia draw) | – | needed | needed | – | – | `:221-223` |
| 18 Le duel de l'Extra Deck | 1 | six | needed | shown | needed | needed | shown | needed | `:226-250` |

Total: 79 levels, matching `docs/academy-junior-play.md:9`.

### 2.3 The gaps, plainly

- **No phase is explained in words on any island.** The design note asked for "Four chimes, then six… Standby and
  Main Phase 2 named later" (`docs/research/junior-mode-playful-learning.md:220`, `:228-230`); "named" is what was
  built: island 6 adds the two chimes. The world 6 comment says "the six phase names" (`levels.ts:138`), but its
  blurb only talks about Chains (`copy-fr.ts:88`).
- **Standby Phase:** no card in Junior has a Standby effect (`cards.ts:4-36` has no such effect). The child passes
  through it in one level only (`levels.ts:140`) and is never told why it exists.
- **Main Phase 2:** the engine allows it only after the Battle Phase (`engine.ts:454`), and one level needs it
  (`rd-fissure`, `levels.ts:215`), where the goal text is about the word "Target", not about Main Phase 2
  (`copy-fr.ts:174`). On a four-chime bar, tapping End after Battle silently skips Main Phase 2.
- **End Phase:** told as "your turn is over". What happens there is not told: "until the end of the turn" effects
  wearing off (the engine does reset `boost`, `engine.ts:459-463`), and the 6-card hand limit, which Junior leaves
  out (`docs/academy-junior-play.md:126`, "hand size").
- **Draw Phase:** taught by doing on island 3, plus three refusal lines; the first-turn no-draw rule is enforced and
  explained (`copy-fr.ts:334`).
- **Main Phase 1 and Battle Phase:** taught by doing and by refusals. Good enough for the rule, but the "you may do
  these in any order, many times" idea is never said.

### 2.4 What Konami's rulebook says each phase is for (for the wording)

Rulebook v10 pp. 34-41 (English), v9 pp. 30-36 (French):

- **Draw Phase:** draw 1 card; a player who cannot draw loses; Traps and Quick-Play Spells can be activated after the
  draw; the first player does not draw on their first turn (v10 p. 34).
- **Standby Phase:** "Some cards have effects that activate, or costs you must pay, in the Standby Phase. If you do
  not have any of these cards on the field, you can still activate Trap Cards or Quick-Play Spell Cards before moving
  on to your Main Phase 1." (v10 p. 35)
- **Main Phase 1:** Normal Summon or Set once, change positions (three exceptions), activate cards and effects, Set
  Spells and Traps, "in any order you want" (v10 p. 36).
- **Battle Phase:** optional; not on the first player's first turn; split into steps (v10 pp. 36-38; §3.1).
- **Main Phase 2:** only if a Battle Phase was conducted; same actions as Main Phase 1, but once-per-turn things done
  in Main Phase 1 cannot be done again; "Use this phase to prepare for the opponent's turn." (v10 p. 39)
- **End Phase:** resolve "during the End Phase" effects; discard down to 6 cards (v10 p. 40).

### 2.5 Proposal (ours)

- **One sentence per phase, shown once**, the first time its chime appears, as a trainer bubble (the trainer-talk
  component already exists, `src/components/junior/play/trainer-talk.tsx`). French drafts, phase names in English as
  the app does:
  - Draw Phase : « Tu pioches 1 carte. Plus de carte à piocher ? Tu perds le duel. »
  - Standby Phase : « Une petite pause. Certaines cartes agissent ici. Souvent, rien ne se passe : on continue. »
  - Main Phase 1 : « Tu construis : une Invocation Normale, des Magies, des Pièges à Poser, dans l'ordre que tu veux. »
  - Battle Phase : « Chacun de tes Monstres en Position d'Attaque peut attaquer une fois. »
  - Main Phase 2 : « Après le combat, encore une Main Phase pour préparer le tour de ton adversaire. »
  - End Phase : « Les effets "jusqu'à la fin du tour" s'arrêtent. Plus de 6 cartes en main ? Défausse. Puis c'est à l'adversaire. »
- **Island 6 earns its "six phases" title:** add one level whose solution needs Main Phase 2 (attack first, then
  Summon a monster in Main Phase 2 so the rival sees it only after the battle, the rulebook's own advice, v10 p. 39),
  and say "Standby Phase" out loud in `w6-double`'s goal.
- **Island 5:** leave the four-chime bar (the puzzles start in Main Phase 1), but say so in the trainer's line:
  « Ici, tu as déjà pioché : on commence en Main Phase 1. »
- **End Phase:** one level where a Spark Dash boost visibly wears off at the End Phase, using the existing reset.
- The hand limit and Standby effects need engine work (a card with a Standby effect, a discard prompt); leave them for
  the advanced island of §3.4.

---

## 3. Q2: the steps inside the phases

### 3.1 The official structure

**Battle Phase** (Rulebook v10 pp. 37-38; French v9 pp. 33-34): "The Battle Phase is split into 4 steps and is
conducted in the order shown in the diagram. The Battle Step and Damage Step are repeated each time you attack with a
monster."

| Step | Rulebook v10 (pp. 37-38) |
| --- | --- |
| **Start Step** | "This step starts the Battle Phase. The turn player should announce 'I'm entering the Battle Phase.'" |
| **Battle Step** | Choose an attacker and a target (or attack directly) and declare the attack, then go to the Damage Step; afterwards "return to the Battle Step, and repeat". Each face-up Attack Position monster may attack once. If the opponent's monsters change before the Damage Step, a **replay** happens. |
| **Damage Step** | "In this step, the players calculate the result of the battle and whatever damage is done." |
| **End Step** | When you have no more monsters you want to attack with, "announce to your opponent that you are ending your Battle Phase." |

**The Damage Step's five timings** (Konami, *Damage Step Rules*, EU site, excerpts):

| Timing | What happens | What can be activated |
| --- | --- | --- |
| Start of the Damage Step | "You declare that you are entering the Damage Step." | effects that activate "at the start of the damage step" |
| Before damage calculation | A face-down attacked monster is flipped face-up; "cards or effects that modify ATK/DEF can activate"; a Flip effect "does not activate yet". | "before damage calculation" effects |
| Damage calculation | "during damage calculation" effects resolve, then compare ATK/DEF and apply damage; "Determine whether either monster will be destroyed by battle or not, but do not send it to the Graveyard yet." | "during damage calculation" effects (Kuriboh) |
| After damage calculation | "Effects that activate as a result of battle happen here"; "A monster that was determined to be destroyed is still not sent to the Graveyard." Flip effects of a monster flipped earlier. | "when this card battles", "when battle damage is inflicted", "after damage calculation", "when this card is flipped face-up" |
| End of the Damage Step | "If a monster was determined to be destroyed… send it to the Graveyard first"; then "destroyed by battle and sent to the Graveyard" effects. | "when a monster is destroyed by battle", "at the end of the Damage Step" |

**General limit** (Rulebook v10 p. 39; v9 p. 37 in French): "During the Damage Step, you can only activate Counter
Trap Cards, or cards with effects that directly change a monster's ATK or DEF. Also, these cards can only be
activated up until the start of damage calculation." (Cards that say they can be used in the Damage Step, such as
Kuriboh, are the exception, by their own text.)

**Other in-phase timing worth one sentence:** after the draw, and in the Standby Phase, Traps and Quick-Play Spells
can be activated (v10 pp. 34-35). Chains are already taught on island 6 at two links; Spell Speed is not needed for
children beyond "a Counter Trap answers anything" (§4.5).

**Sources not found:** the rulebook's link to `www.yugioh-card.com/en/gameplay/damage_step/` (v10 p. 39) returns
404 today; the *Fast Effect Timing* page does not describe the steps. A French Konami page for the Damage Step timings
was not found (the EU French URL returns 404). The French rulebook keeps **Start Step, Battle Step, Damage Step, End
Step** in English with a feminine article ("la Damage Step", "la Battle Step"), and uses "**calcul des dommages**",
"**Contre-Piège**", "Magie Jeu-Rapide" (v9 pp. 34, 37). This settles one gap the terminology note left open ("la
Damage Step", `docs/academy-french-terminology.md:17`): it is Konami's own usage. Note: that note says the v9 PDF's
text extraction failed (`docs/academy-french-terminology.md:13`); today `pdftotext` read it (Latin-1 encoded).

### 3.2 Does the app teach any of it?

| Where | What | Reachable by a child? |
| --- | --- | --- |
| Junior (all islands) | Nothing. "Left out: … the Damage Step, replays" (`docs/academy-junior-play.md:126`). The engine resolves an attack in one move: declare, compare, destroy, damage (`engine.ts:744-760` onward). | – |
| Junior, island 16 `rd-kuriboh` | Kuriboh's card text, correctly printed, says « Durant le calcul des dommages… » (`copy-fr.ts:70`), but the game offers it at the attack declaration (`docs/academy-junior-play.md:145`). The printed text and the play disagree. | Yes |
| Junior, Traps | Fog Snare, Sticky Vine, Sakuretsu Armor, Dimensional Prison all answer "when an opponent's monster declares an attack" (`copy-fr.ts:34-35`, `:40-41`): the Battle Step, unnamed. | Yes |
| `/academy` "Battle Phase" (first-duel) | Start of Battle, Battle Step, Damage Step, End of Battle as a timeline; "Keep the details of Damage Step timing for the chain chapters" (`src/content/chapters/first-duel/battle-phase.ts:38-51`). | Route exists, not linked from the home (`src/app/page.tsx:3-5`); "unlinked and awaiting the owner's word on deletion" (`docs/research/junior-save-slots-character-choice-official-art.md:499`) |
| `/academy` "Battle rules" (advanced-rules) | Start Step, Battle Step, replays, "Five Parts of the Damage Step", Damage Step restrictions, Flip effects after damage calculation (`src/content/chapters/advanced-rules/battle-rules.ts:25-238`). French in `src/lib/i18n/fr-content.json` ("Calcul des dommages"). | Same |

### 3.3 Why it matters for children (ours)

Most children never need the five timings. Three things do matter in real play and in the cards Junior already
uses: (1) "when a monster declares an attack" Traps act in the **Battle Step**, before any damage; (2) Kuriboh and
ATK boosts act **in the Damage Step**, after the attack is locked in; (3) a monster destroyed in battle is still on
the field until the end of the Damage Step, which is why "when destroyed by battle and sent to the GY" effects come
last. A replay (the target vanishes) also happens in Junior already when Sakuretsu Armor removes an attacker, but the
child is never told the word.

### 3.4 A child-friendly explanation in French (ours)

Phase and step names stay in English, as in the app and in Konami's French rulebook. Picture: the Battle Phase as a
short film in four scenes, the Damage Step as five photos.

> **La Battle Phase, en quatre étapes**
> 1. **Start Step** : tu dis « J'entre dans la Battle Phase ». Personne n'attaque encore.
> 2. **Battle Step** : tu choisis un Monstre qui attaque et sa cible. C'est le moment des Pièges qui disent
>    « Lorsqu'un monstre déclare une attaque ».
> 3. **Damage Step** : les deux Monstres se rencontrent. (Ensuite, retour à la Battle Step pour l'attaque suivante.)
> 4. **End Step** : plus personne ne veut attaquer ? Tu annonces la fin de ta Battle Phase.
>
> **La Damage Step, en cinq photos**
> 1. **Début** : on entre dans la Damage Step.
> 2. **Avant le calcul des dommages** : un Monstre face verso se retourne. Dernière chance de changer l'ATK ou la DEF.
> 3. **Calcul des dommages** : on compare les nombres et on enlève les Points de Vie. Kuriboh agit ici !
> 4. **Après le calcul des dommages** : le perdant est **encore** sur le Terrain. Les effets « lorsque ce monstre
>    combat » se déclenchent.
> 5. **Fin** : maintenant seulement, le perdant va au Cimetière.
>
> **La règle d'or :** pendant la Damage Step, on ne peut presque rien activer : seulement les Contre-Pièges et les
> cartes qui changent l'ATK ou la DEF, et seulement jusqu'au calcul des dommages. Sauf si la carte dit le contraire,
> comme Kuriboh.

**Where it fits (ours):**

- **Now, no engine change:** label the existing animation. The clash banner (`mini-board.tsx`, `ClashBanner`) could
  show "Battle Step" when the attack is declared and "Damage Step" when the numbers meet. Island 4 (first Trap) is the
  natural first sight: Sticky Vine stops the attack in the Battle Step, before any Damage Step.
- **Island 16 "Chaque mot compte":** a bonus level built on Kuriboh's real words "Durant le calcul des dommages", once
  the engine offers Kuriboh at damage calculation instead of at the declaration. This also removes the mismatch of §3.2.
- **An advanced island after island 18 (or before the trainers' island of §5):** "L'île des étapes", 3 to 5 levels:
  (1) a Quick-Play ATK boost before damage calculation (Rush Recklessly, §4.5); (2) Kuriboh during damage
  calculation; (3) a replay (the target leaves after the declaration); (4) "destroyed by battle and sent to the GY"
  coming last (the existing Busy Bee "If… sent to the GY" trigger, `cards.ts:138`); (5) a face-down monster flipped
  before damage calculation (needs Set monsters, which Junior leaves out, `docs/academy-junior-play.md:121-122`).
- **Engine work this needs:** the attack must stop between the declaration and the damage (a pending "damage step"
  state that answers can join), destruction must be sent to the GY at the end of the step, and replays must be
  offered as a choice. Today `attack()` is one atomic move (`engine.ts:744` onward).

---

## 4. Q3: Spell and Trap artwork, and the types taught

### 4.1 How card art is sourced and drawn

- **List:** `src/lib/junior/play/card-art.json` maps an app card id to a YGOPRODeck card id and picture id (75
  entries: the 14 real Normal Monsters, the real cards of islands 9 to 18, trainers' cards, shop cards).
- **Build:** `scripts/cards/build-art.mjs` (run by hand, `pnpm --filter academy-ygo cards:art`) fetches card facts
  once per language from `db.ygoprodeck.com/api/v7/cardinfo.php`, downloads each cropped picture once from
  `images.ygoprodeck.com/images/cards_cropped/<id>.jpg` into `.cache/cards` (at most ~5 requests a second,
  `build-art.mjs:21`, `:66-73`), writes `public/cards/<id>-160.webp` and `-480.webp` with sharp (`:74-78`), and
  generates `src/lib/junior/play/card-art.ts` (`:83-115`). YGOPRODeck forbids hot-linking; the rationale and the
  licensing record are in `docs/research/junior-save-slots-character-choice-official-art.md` §5.2 and §5.6.
- **Drawing:** `CardArt` shows the picture when `cardArtUrl(card)` returns one, else the card's emoji
  (`mini-board.tsx:79-90`); `CardFace` uses it for every kind (`:94-170`). The 3D board does the same with textures
  (`src/components/junior/play/board3d/card-textures.ts:84-86`, emoji fallback `:143`).

### 4.2 Why Spells and Traps "have no art"

The renderer has no Spell/Trap exception. The cards without art are exactly the **eleven original cards**:

- 7 Spells and Traps: Spark Trade, Glow Charm, Spark Dash, Thunder Clap (Spells), Fog Snare, Sticky Vine, Quick
  Burrow (Traps) (`cards.ts:136`, `:139-144`);
- 4 Effect Monsters: Glint Lynx, Cinder Hedgehog, Dozy Moth, Busy Bee (`cards.ts:134-138`).

They were written for the lessons and have no real card, so no official picture; the 14 plain monsters were swapped
for real Normal Monsters and got art, the others kept emoji
(`docs/research/junior-save-slots-character-choice-official-art.md` §5.5, §6.3; `docs/academy-junior-play.md:80`).
Islands 1 to 8 use only these seven Spells and Traps, so on those islands **every** Spell and Trap is emoji while
the monsters have art: that is the contrast the owner saw. From island 9 on, real Spells and Traps appear with art
(Monster Reborn, Mountain, Sakuretsu Armor, Dimensional Prison, Pot of Desires, Black Luster Ritual, Polymerization,
Lightning Vortex, Fissure, Upstart Goblin; `card-art.json`).

### 4.3 What adding art would take (ours)

Two routes, which can be mixed card by card:

1. **Swap for real cards** (art comes for free from the existing script). Candidates, texts read today on YGOPRODeck
   **(secondary; re-read on Konami's database before use)**:

   | Original | Real candidate | Fit |
   | --- | --- | --- |
   | Glow Charm (+500 LP) | **Red Medicine** (38199696, Normal Spell: "Increase your Life Points by 500 points.") | Exact; no level changes (also found by the earlier note §6.3). |
   | Spark Dash (target your monster, +500 ATK) | **Rush Recklessly** (70046172, **Quick-Play** Spell, +700, either player's monster) | Changes numbers in levels and introduces Quick-Play: better as a new card (§4.5) than a swap. |
   | Sticky Vine (negate the attack) | **Negate Attack** (14315573, **Counter Trap**: "negate the attack, then end the Battle Phase") | Different rule (ends the Battle Phase); better taught as the Counter Trap example. |
   | Spark Trade (discard; destroy all their monsters) | **Lightning Vortex** (already in, island 16) says "face-up" | Near-twin; Spark Trade could simply become Lightning Vortex if every level's monsters are face-up (they are: Junior has no Set monsters). |
   | Thunder Clap, Fog Snare, Quick Burrow | No exact twin found (the earlier note lists near relatives with different effects) | Keep original, or redesign levels. |

   Each swap: add the id to `card-art.json`, run the script, rename the card in `copy-{en,fr,he}.ts`, check numbers
   in level texts and tests (method as in the earlier note §6.2).
2. **Our own art for the originals** (commission or draw), stored as `public/cards/<name>-160/480.webp` with an
   entry in `card-art.ts`'s shape. `card-art.ts` is generated; the script would need a "local picture" kind so the
   generated module still lists them. Keeps every lesson as it is.

A cheaper interim: give Spells and Traps a type picture (the Spell / Trap frame colour already differs,
`KIND_FRAME` in `mini-board.tsx:100`) instead of a random emoji.

### 4.4 Inventory: which Spell and Trap cards and types appear, and which are explained

Types per Rulebook v10 p. 27: "There are 6 types of icons… Equip, Field, Quick-Play, Ritual, Continuous, Counter.
Spell and Trap Cards without an icon are called Normal Spell Cards or Normal Trap Cards." Junior's model only knows
`icon?: "field" | "ritual"` (`cards.ts:105-106`) and labels an icon-less card just « Magie » / « Piège »
(`mini-board.tsx:163`; `copy-fr.ts:184`, `:187`).

| Card (FR name) | Type | Islands (levels) | Explained? |
| --- | --- | --- | --- |
| Charme Lumineux (Glow Charm) | Normal Spell | 1, 5 | Used only |
| Coup de Tonnerre (Thunder Clap) | Normal Spell | 1, 4, 5, 6, 7, 8, 9, 16 | **Taught** island 4 `w4-spell` (Spell in the Main Phase); "Target" island 8 |
| Course d'Étincelle (Spark Dash) | Normal Spell | 4, 5, 7, 9 | Used |
| Échange d'Étincelles (Spark Trade) | Normal Spell | 8 | Cost taught island 8 |
| Monster Reborn | Normal Spell | 9-18 | **Taught** island 9 (Graveyard) |
| Pot des Désirs | Normal Spell | 9 | Banish face-down taught |
| Polymérisation | Normal Spell | 11, 17, 18 | **Taught** island 11 |
| Vortex Foudroyant, Fissure, Gobelin Parvenu | Normal Spells | 16, 18 | Card-reading words taught |
| Montagne (Mountain) | **Field Spell** | 9 | **Taught** island 9 `m-field` ("une Magie de Terrain… va dans la Zone Terrain et y reste", `copy-fr.ts:149`) |
| Rituel du Lustre Noir | **Ritual Spell** | 10 | **Taught** island 10 |
| Piège de Brume, Liane Collante | Normal Traps | 1, 4-9, 14, 16, 18 | **Taught** island 4 `w4-ambush` (Set, then flip on the rival's turn) |
| Terrier Éclair (Quick Burrow) | Normal Trap (answers a Spell) | 6, 7, 8 | Chain taught island 6 |
| Armure de Sakuretsu, Prison Dimensionnelle | Normal Traps | 9, 18 | Banish taught island 9 |
| Le Plumeau de Dame Harpie | Normal Spell | island 4 reward | Shown, never played (`trainers.ts:100-106`) |
| Pot of Greed, Scapegoat (**Quick-Play**), Swords of Revealing Light, Mirror Force | shop | island 1 shop | Album only: name and art, no text or type (`src/lib/junior/world/shop.ts:31-37`) |

**Gaps:** never played and never explained in Junior: **Quick-Play Spell, Continuous Spell, Equip Spell, Continuous
Trap, Counter Trap**. Even "Normal" is never named as a type. "In worlds 1 to 8 only Normal Spells and Normal Traps
exist" is a stated choice (`docs/academy-junior-play.md:128`). The hidden `/academy` course teaches all six Spell types
and three Trap types with invented example cards (`src/content/chapters/spells-and-traps/spell-cards.ts:1-115`,
`trap-cards.ts:18-63`).

Rulebook definitions to teach from (v10 pp. 28-31): Normal Spell single use then Graveyard; Continuous Spell
"remain on the field once they are activated, and their effect continues while the card stays face-up"; Equip Spell
gives an effect to 1 face-up monster, and is destroyed if that monster leaves or is flipped face-down; Field Spell in
the Field Zone, one per player; Ritual Spell used like a Normal Spell to Ritual Summon; Quick-Play Spell "can be
activated during any Phase of your turn"… and on the opponent's turn if Set first, but not the turn it was Set; Normal
Trap Set first, not the same turn, single use; Continuous Trap stays like a Continuous Spell; Counter Trap "normally
activated in response to the activation of other cards", often negating them. French names (v9 pp. 22-26): Magie
Normale, Magie Continue, Magie d'Équipement, Magie de Terrain, Magie Rituelle, Magie Jeu-Rapide; Piège Normal, Piège
Continu, Contre-Piège.

### 4.5 Plan: every type taught on some island (ours)

Real cards keep the art problem solved. Card texts below are from YGOPRODeck **(secondary)**; read each on Konami's
database (`request_locale=fr` for the French name and text) before writing levels.

| Type | Status | Where | Card | Level idea |
| --- | --- | --- | --- | --- |
| Normal Spell | taught | island 4 | (as now) | Name the type: « Magie Normale : une fois, puis au Cimetière. » |
| Field Spell | taught | island 9 | Mountain | as now |
| Ritual Spell | taught | island 10 | Black Luster Ritual | as now |
| Normal Trap | taught | island 4 | (as now) | Name the type. |
| **Quick-Play Spell** | new | island 6 (Chains) or island 8 | **Rush Recklessly** ("Target 1 face-up monster on the field; it gains 700 ATK until the end of this turn.") | Set it, then on the rival's turn answer its attack: the chain grows, and the boost lands before damage. Second level: "not the turn you Set it". Links to §3.4. |
| **Counter Trap** | new | island 6 | **Negate Attack** ("When an opponent's monster declares an attack: Target the attacking monster; negate the attack, then end the Battle Phase.") or **Magic Jammer** ("When a Spell Card is activated: Discard 1 card; negate the activation, and if you do, destroy it.") | Negate Attack: two attackers, one Trap, the whole Battle Phase ends. Magic Jammer: answer the rival's Thunder Clap, a cost before the `;` (already taught on island 8). |
| **Continuous Spell** | new | island 9 (cards that stay) | **Banner of Courage** ("All monsters you control gain 200 ATK during your Battle Phase only.") | Win this turn only because the boost stays and applies to every attacker. |
| **Equip Spell** | new | island 9 | **Legendary Sword** ("Equip only to a Warrior monster. It gains 300 ATK/DEF.") or **Axe of Despair** (+1000 ATK; its second effect would be left out like other "left out" rules) | Equip, attack; then the equipped monster is destroyed and the Equip goes too. |
| **Continuous Trap** | new | island 9 (Graveyard) | **Call of the Haunted** ("Activate this card by targeting 1 monster in your GY; Special Summon that target in Attack Position. When this card leaves the field, destroy that monster…") | A Trap that brings a monster back and stays; then Thunder Clap on the Trap takes the monster too. |

Alternatively, gather the five new types into **one new island "Les six icônes"** between island 9 and island 10,
with one level per icon and a final "read the icon" level. That keeps island 6 short for the youngest.

**What the engine needs:** a card that stays on the field after resolving and keeps applying (Continuous, Equip; the
Field Spell already does this, `cards.ts:21-22`), a link between an Equip and its monster, Quick-Play activation from
a Set card on either turn, a Counter Trap answer to an activation, and `icon` widened to all six icons with their
names in `copy-*.ts` and the reader panel.

---

## 5. Q4: the end of the journey and a trainers' final island

### 5.1 What the end is today

- **Last island:** 18, "Le duel de l'Extra Deck" (`levels.ts:225-250`; `copy-fr.ts:100`): one open duel on the whole
  mat from turn 1; the child has an Extra Deck (Gaia Knight, Gem-Knight Pearl, LANphorhynchus); the rival Fusion
  Summons on turn 1 and Xyz Summons later (`levels.ts:238-247`). It ends with a second printable certificate
  (`level-player.tsx:595-596`).
- **Who is there:** Yami Yugi and Seto Kaiba stand on the island and say « Le duel final, avec ton propre Extra Deck.
  Nous te regardons ! » / « Tu es maintenant un vrai duelliste ! » (`trainers.ts:72`, `:214`). No reward card
  (`cards: []`).
- **Who duels:** always **Nox**, an invented rival (`copy-fr.ts:75`). On Kaiba's island, « Aujourd'hui, Nox joue
  avec mes monstres » (`trainers.ts:204`). Trainers greet and give cards; they never play.
- **How the rival plays** (`src/lib/junior/play/session.ts`): a per-turn list of steps (`summon`, `attack`, `spell`,
  `auto-attack`, `extra`, `fusion`; `levels.ts:12-22`), skipped when impossible (`session.ts:114-158`); `auto-attack`
  attacks with the strongest monster first at the strongest target it can beat (`:146-157`, `autoTarget` `:101`);
  answers with a Set Trap whenever it can (`:164-171`); after its script it repeats `rivalRepeat` (`levels.ts:49-51`).
  The rival "never Sets a card during play and never uses a Monster effect" (`docs/academy-junior-play.md:127-128`).
- **Engine:** pure TypeScript, `apply(board, move)` → next board and events or a refusal (`engine.ts:1088`),
  `legalMoves` (`engine.ts:1116`), 58 cards with hand-written effects (`cards.ts`), no Damage Step, chains of two
  links, 4000 LP (`engine.ts:13`). "The duel uses the Junior engine, not `packages/duel-engine`, and the rival follows
  a fixed script." (`docs/academy-junior-play.md:186`)
- **Trainers available:** 14 characters with official portraits in `public/trainers/` (`trainers.ts:14-31`); Atem is
  present as "Yami Yugi". Signature cards per island at `trainers.ts:53-73`. Characters not yet in: Joey has a portrait;
  Pegasus, Bakura, Marik and others do not.

### 5.2 What Master Duel's gameplay is (as relevant)

- **First-party:** Konami's site lists a Solo Mode with "Tutorial" and "Duel Strategy", video tutorials for card types,
  Traps and each Summoning method, and a Solo Mode story where you "duel with a Loaner Deck" built from one archetype's
  cards (<https://www.konami.com/yugioh/masterduel/us/en/>). Konami's Steam listing: "The Solo Mode guides you through
  storylines of the themes from the Yu-Gi-Oh! TCG", recommended for beginners; tutorials "teach you the basics"; a Deck
  is given after them; "10,000+ unique cards" (<https://store.steampowered.com/app/1449850/YuGiOh_Master_Duel/>). The
  Development Team message stresses that Duelists "clearly see the text of the cards placed on the field"
  (<https://www.konami.com/yugioh/masterduel/us/en/message/>).
- **Secondary (fan guides and forums):** Solo Mode is a branching path of "gates", each made of scenario
  animations, practice duels with preset decks and AI duels (<https://game8.co/games/Yu-Gi-Oh-Master-Duel/archives/354380>);
  the game prompts the player whenever a card can be activated, with a chain setting On / Auto / Off, Auto by default
  (<https://steamcommunity.com/app/1449850/discussions/0/510701384252830139/>). Every card effect is resolved by the
  game; the player only chooses (targets, costs, yes/no). This is common knowledge of the game but no Konami page read
  today states it in those words.
- **What "Master Duel–like" means for Junior (ours):** (1) the game enforces and resolves every effect; (2) only legal
  actions are offered, as glowing cards and menus; (3) a prompt when you *may* respond, with "pass"; (4) a 3D-ish field
  with summon animations; (5) story gates of preset-deck duels against named opponents. Junior already has (1) for its
  58 cards, (2) glowing zones, (3) the "answer or let it happen" freeze (`copy-fr.ts:291`), (4) a 3D board and summon
  scenes, and the island map for (5). It lacks real opponents with their own decks and more than 58 cards.

### 5.3 What project-meir already has (read-only survey)

Paths below are in `D:\Documents\Projet Meir\project-meir`.

- **Engine `packages/duel-engine`:** pure TypeScript reducer, zero runtime dependencies, **MIT**
  (`packages/duel-engine/package.json:5-7`): `applyIntent(state, seat, intent)` → state and events, per-viewer
  redaction, seeded RNG (`docs/adr/0001-duel-simulator-architecture.md:18-31`; `packages/duel-engine/RULES.md:388`).
  It is "a **manual simulator with a rules assistant**… card effects are carried out by the players by hand"
  (`RULES.md:3-5`); "Card effects are not automated. Automating them would mean a card-script engine (EDOPro's
  approach), a different product." (`adr/0001:54-55`). Phases draw → standby → main1 → battle → main2 → end
  (`RULES.md:54-69`); a battle is one pending attack then damage calculation, with replays (`RULES.md:192-231`): **no
  Battle Phase steps, no Damage Step timings**; Spell Speed not enforced (`RULES.md:160-191`). All Summon types with
  material checks and Link-arrow placement (`RULES.md:71-158`).
- **Bots (`apps/duel-nextjs/src/client/training/`):** scripted heuristic bots, "A scripted bot, not an AI"
  (`apps/duel-nextjs/CONTEXT.md:380-382`). Each extends `TrainingBot` (`training-bot.ts:271`) and returns one intent
  at a time from its own view; plays are ordered task lists (`bot-kit.ts`), with per-archetype kits. Since the engine
  is manual, **each bot carries out its own effects by hand** (`CONTEXT.md:349-372`). The **Course Bot** "pilots any
  Deck from the card data alone (Normal and Tribute Summons, Ritual, Fusion, Synchro, Xyz, Pendulum and Link Summons,
  attacks) plus the effects of the course Decks' Spells and Traps… Pot of Greed, Hinotama, Fissure, Mystical Space
  Typhoon, Monster Reborn, Sakuretsu Armor, Negate Attack and Magic Jammer. A card it does not know it never
  activates", with a `gentle` mode for newcomers (`course-bot.ts:52-66`). A `ScriptedBot` follows exact lesson scripts
  (`scripted-bot.ts:30-60`). Bots play whole duels in the browser with no server (`src/client/duel/local-transport.ts`).
  About 70 test files.
- **Decks:** **no anime-character decks** (no Yugi, Kaiba or Joey deck; "Joey Bot" is a name to avoid,
  `CONTEXT.md:462-470`). Preset decks are TypeScript `DeckList` constants: a Kaiba-flavoured Blue-Eyes deck (40/4,
  `src/client/training/blue-eyes.ts:31`), six modern meta bots (`opponents.ts:148`), and the **Beginner course decks**,
  closest to the anime era: a Dragon deck (Blue-Eyes, Red-Eyes, Summoned Skull, Black Luster Soldier) and a
  Warrior/Spellcaster deck (Celtic Guardian, Gemini Elf, Dark Magician, Flame Swordsman), growing from 20 to 40 cards
  (`src/client/onboarding/course-decks.ts:15-56`, `:124-273`). (`src/` paths are under `apps/duel-nextjs/`.)
- **UI:** PixiJS 8 + GSAP board with React HUD (`adr/0001:42-44`); click menus or drag, including drag-to-attack
  (`src/client/duel/interaction.ts:33-43`); "Duel help" badges on cards that can act and menus limited to vouched plays,
  modelled on Master Duel (`docs/adr/0010-strict-card-menu-with-duel-help.md:10-27`).
- **Coupling:** the bots and UI depend on the app's API types, auth, and card data from Postgres via `/api/cards`
  (`src/client/duel/card-data.ts:1-30`); copy is English, for adults and competitive play. No AGPL code is used.

(Survey done by a read-only sub-agent; the four central quotes above were re-read by hand.)

### 5.4 Junior engine vs project-meir engine

| | Junior (`academy-ygo`) | project-meir `duel-engine` + bots |
| --- | --- | --- |
| Effects | Automatic, for 58 hand-modelled cards | Manual by design; bots carry out ~8 known Spells/Traps and their kits' effects |
| Rules enforced | Strict for its subset; refusals in child language | Hard and soft rules; soft rules can be overridden |
| Damage Step | None | None (one damage calculation) |
| Opponent | Fixed per-level script + simple auto-attack | Scripted heuristic bots, whole duels, Bo3, Extra Deck |
| Cards | 58 playable (+ display-only) | Whole card pool (~14.6k), but effects not automated |
| Child UX | Built for it: one rule per level, undo, hints, 3 languages, voice | Adult duel simulator |
| Licence | own | MIT engine; app private |

The core mismatch: the child needs **automatic effects** (Master Duel), which the project-meir engine deliberately
does not have. Its bots know how to *play* decks, but each known effect is a hand-written recipe on the bot's side, and
a child playing the same deck would have to resolve their own effects by hand.

### 5.5 Gap analysis for "every trainer, their own deck, automatic bots, Master Duel–like"

1. **Decks:** none exist anywhere for characters. Each trainer needs a deck of 20-30 cards whose effects the engine
   automates. Most anime signature cards have complex effects (Time Wizard's coin, Stardust Dragon's negate, Decode
   Talker's arrows); Normal Monsters, simple Spells and Traps and the Summon mechanics already in Junior cover a lot.
2. **Card effects:** Junior automates 58 cards. Each new effect is engine code plus copy in three languages plus tests.
   This is the main cost and it grows with every deck.
3. **Bot:** Junior's rival is per-level scripted. A trainer bot for a whole duel with a shuffled deck needs a
   general policy: summon the best monster, Tribute when worth it, play known Spells, attack with the strongest,
   answer with Traps. `legalMoves` and the hint search (`session.ts:215-238`) are a base. The Course Bot's priority
   list (`course-bot.ts`) is a good design reference even if not its code.
4. **Randomness:** Junior Decks are never shuffled (`docs/academy-junior-play.md:148`). A real duel needs shuffling
   with a seed, and difficulty tuning so a child can win.
5. **UX:** responding prompts exist; a real 40-card duel is long for a child. Shorter decks (20 cards) and 4000 LP,
   as now, suit the age.
6. **Rules still left out** that a real duel will hit: Set monsters and Flip, Quick-Play, Continuous and Equip cards,
   longer chains, the Damage Step, hand limit (§2.3, §3, §4.4).

### 5.6 Staged recommendation (ours)

- **Stage 1: "Le tournoi des maîtres" with the Junior engine (smallest step).** A new island 19 after island 18: one
  duel per trainer (Yugi, Atem/Yami Yugi, Kaiba, Joey, Mai, then the GX-to-ARC-V trainers), each a fixed **scripted
  deck** of 15-20 cards drawn mostly from cards the engine already plays, flavoured with the trainer's signature cards
  (Kaiba: Blue-Eyes, Battle Ox, Judge Man, Saggi; Yugi: Dark Magician, Mystical Elf, Giant Soldier of Stone,
  Black Luster Soldier; Joey: Flame Swordsman via Polymerization). The rival script format already supports summons,
  attacks, Spells, Fusion and Extra Deck Summons (`levels.ts:12-22`). Trainers' portraits and lines exist. Cost: level
  data, copy, a few new cards with art.
- **Stage 2: a general trainer bot.** Replace per-turn scripts with a policy function over `legalMoves`, a
  personality per trainer (Kaiba attacks hard, Yugi keeps Traps), and seeded shuffling, so each duel can be replayed
  differently. Add the card types of §4.5 and Battle Phase steps of §3.4 as the trainers' decks need them.
- **Stage 3: a "gauntlet" or tournament bracket** in which the child picks a deck (their binder) and meets every
  trainer; the binder and shop cards (`shop.ts:31-37`) become playable as their effects are automated.
- **Porting project-meir's engine is not recommended** unless the owner wants a large real card pool: it would need
  an automated effect layer the project deliberately does not have (`adr/0001:54-55`), and the child-specific rules
  explanations, undo and hints would have to be rebuilt. What to reuse: the **design** of the Course Bot's priorities
  and `gentle` mode, the Beginner course's anime-era deck lists as a starting point for Yugi/Kaiba decks, and the
  MIT engine's tests as a reference for rules Junior lacks (replays, Link arrows).

### 5.7 Open questions for the owner

1. Which trainers duel on the final island, in what order, and is Atem a separate trainer from "Yami Yugi" (the
   app uses Yami Yugi, `trainers.ts:16`)? Add Pegasus, Bakura, Marik?
2. Should trainer decks be their anime decks (complex effects, much engine work) or "inspired by" decks using cards
   Junior can already play?
3. Does the child duel with a deck the game gives, or one they build from their binder?
4. Shuffled decks and real randomness, or fixed draws as today (always winnable, replayable)?
5. Is winning required to finish the journey, or is each trainer duel optional with a reward card?
6. Keep 4000 LP and short decks, or move toward 8000 LP and 40 cards for the final island?
7. Should the hidden `/academy` course (which explains the six phases, Battle Phase steps and all Spell/Trap types)
   be deleted, linked, or mined for Junior copy?
8. For Spells and Traps without art: real-card swaps (lessons change), commissioned art, or a type picture?

### 5.8 Owner decisions (2026-11-20)

- **Q1 trainers:** Yugi and Atem are two separate trainers. Roster: Yugi, Atem, Kaiba, Jaden, Yusei, Rex Raptor,
  Weevil Underwood, Yami Bakura, Mako Tsunami, Joey Wheeler, Arkana, Pegasus, Yami Marik (13 trainers).
- **Q2 decks:** anime decks, not "inspired by" decks. This means the engine must automate many card effects.
  Jaden's deck needs Fusion with Elemental HEROes and Yusei's needs Synchro Summoning.
- **Q4 shuffling:** shuffled decks with real randomness.
- **Q6 Life Points:** 8000 LP.
- **Q3 child's deck:** the child picks one starter deck. Its cards are added to their binder, and they can edit
  the deck freely. Winning on the final island earns points that buy more advanced cards. The shop should unlock new
  cards as the child progresses.
- **Q5 wins and order:** the child must beat every trainer on the final island, and can rematch any of them. Keep
  the island 18 duel against Nox, watched by Kaiba and Yugi. It stays the step just before the new final island.
- **Deck size:** 40-card Main Deck, 15-card Extra Deck.
- **Q7 `/academy`:** keep it only as source material for Junior's explanations. Do not link it from Junior.
- **Q8 Spell/Trap art:** replace the 7 invented Spells/Traps of islands 1-8 (`cards.ts:136-144`) with real cards
  that have official art, and adapt the island 1-8 lessons where the effect differs. Glow Charm → Red Medicine is an
  exact match; the other 6 need the closest real card, with its text checked against Konami's database.
- All open questions are now answered.

---

## 6. Unverified / could not confirm

- Konami's English Damage Step page linked from the rulebook (`/en/gameplay/damage_step/`) is 404; the EU *Damage
  Step Rules* page was read through a summarising tool that limits quotes to short excerpts.
- No Konami page read today states in words that Master Duel resolves all effects automatically or describes its chain
  prompt settings; those points are from fan sources and common knowledge.
- The card texts in §4.3 and §4.5 come from YGOPRODeck, not Konami's database; French names were not read.
- The level-by-island phase table was built by reading `levels.ts`, not by running the levels.
- The project-meir survey (§5.3) was done by a read-only sub-agent; spot-checked quotes are `CONTEXT.md:380-382`,
  `RULES.md:3-5`, `adr/0001:54-55`, `course-bot.ts:52-66`, `RULES.md:192-200`, `package.json:5-7`.

---

## Sources

**Konami: rules documents (accessed 2026-11-20)**
- Official Rulebook Version 10 (English): <https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf>
  (pp. 27-31 card types; pp. 34-41 turn structure, Battle Phase steps, Damage Step rules)
- Livret de Règles Officiel Version 9.0 (French):
  <https://img.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_fr.pdf> (pp. 22-26 types; pp. 30-37 phases and steps)
- Damage Step Rules: <https://www.yugioh-card.com/eu/play/damage-step-rules/>
- Fast Effect Timing (checked; does not cover the steps): <https://www.yugioh-card.com/en/play/fast-effect-timing/>

**Konami: Master Duel**
- Official site: <https://www.konami.com/yugioh/masterduel/us/en/>
- Development Team message: <https://www.konami.com/yugioh/masterduel/us/en/message/>
- Konami's Steam listing: <https://store.steampowered.com/app/1449850/YuGiOh_Master_Duel/>

**Secondary**
- Game8 Solo Mode guide: <https://game8.co/games/Yu-Gi-Oh-Master-Duel/archives/354380>
- Steam discussion on the chain setting: <https://steamcommunity.com/app/1449850/discussions/0/510701384252830139/>
- Wikipedia, Yu-Gi-Oh! Master Duel: <https://en.wikipedia.org/wiki/Yu-Gi-Oh!_Master_Duel>
- YGOPRODeck card API (card texts in §4.3, §4.5): <https://db.ygoprodeck.com/api/v7/cardinfo.php>

**Repository files read (duel-academy)**
- `docs/academy-french-terminology.md`, `docs/academy-junior-play.md`, `docs/academy-junior-world.md`,
  `docs/academy-junior-pilot.md`; `docs/research/junior-mode-playful-learning.md` (§ mini-games),
  `junior-zones-extra-deck-card-reading.md` (head, sources), `junior-save-slots-character-choice-official-art.md` (§5, §6)
- `apps/academy-ygo/src/lib/junior/play/{levels,engine,cards,session,copy-fr,copy-en,card-art}.ts`, `card-art.json`
- `apps/academy-ygo/src/components/junior/play/{mini-board,level-player}.tsx`, `board3d/card-textures.ts`
- `apps/academy-ygo/src/lib/junior/world/{trainers,shop,dorm}.ts`, `src/app/page.tsx`
- `apps/academy-ygo/src/content/chapters/first-duel/{understanding-turn,battle-phase}.ts`,
  `advanced-rules/battle-rules.ts`, `spells-and-traps/{spell-cards,trap-cards}.ts`, `src/lib/i18n/fr-content.json`
- `apps/academy-ygo/scripts/cards/build-art.mjs`

**Repository files read (project-meir, read-only)**
- `apps/duel-nextjs/CONTEXT.md`, `packages/duel-engine/RULES.md`, `packages/duel-engine/package.json`,
  `docs/adr/0001-duel-simulator-architecture.md`, `docs/adr/0010-strict-card-menu-with-duel-help.md`,
  `apps/duel-nextjs/src/client/training/{course-bot,scripted-bot,training-bot,opponents,blue-eyes}.ts`,
  `apps/duel-nextjs/src/client/onboarding/course-decks.ts`
