# Junior mode: teaching the game through play, animation and short video instead of questions

> **Date of observation:** 2026-11-17. Every web page, PDF and API record cited below was fetched that day, unless a
> line says otherwise.
> The repository was read on `main` at HEAD `04e91da`. Other sessions were editing the tree at the same time; code
> claims describe the files as they stood that day.
> **Nature of this document:** a research and design note. No code was changed and nothing was published.
>
> **The request (owner, verbatim):** "Not too many questions, some fun games to learn. Search on the internet what
> could be a good way to teach children, with maybe some animation, maybe some parts of videos." The audience is
> children aged 8–12 learning the Yu-Gi-Oh! TCG in `apps/academy-ygo`, route `/junior`.
>
> **Sourcing rule used:** each external claim is followed by the source that owns it: Konami's own pages and PDFs,
> YouTube's and Google's own policy pages, the FTC, the library vendors' own repositories and pricing pages, and the
> original research papers (by DOI). Each research source says how much of it was read: **[full text]**,
> **[abstract]** or **[secondary]**. Product write-ups that could only be reached through a third party are
> labelled **[secondary]**. Proposals and inferences are labelled **(ours)**. Anything that could not be confirmed
> is listed in [§11](#11-unverified--could-not-confirm) and is not stated as fact.
>
> **This is not legal advice.** §6 reports what the rights holders, YouTube and the regulator publish. Decisions on
> intellectual property and children's privacy need a qualified lawyer.
>
> **Relation to existing notes.** [kids-interactive-academy.md](./kids-interactive-academy.md) (2026-11-16) led to
> the current pilot ([academy-junior-pilot.md](../academy-junior-pilot.md)). This note does not repeat it. §2 says
> what is new and what this note would change in it.
> [beginner-training-matches.md](./beginner-training-matches.md) (2026-10-11) already lists Konami's thirteen
> *For Beginners* videos with their IDs per language; §6.2 reuses that table instead of copying it.

---

## 1. Short answer

**The pilot teaches by asking; the evidence and the products that teach card games to children teach by letting
the child do the thing.** Mission 1 today is 17 screens, of which 9 are a multiple-choice screen (6 sorts and 3
quiz questions, all rendered by `choice-step.tsx`), after 6 story pages with nothing to do. The owner's reaction
("too many questions") matches what the research predicts for this age.

**What Junior mode should become (ours):**

- **A string of very short playable levels on a small duel board**, each adding **one new rule**. The child makes
  a move, the board answers with an animation that *is* the rule (the monsters collide, the numbers subtract, the
  Life Points drain). No question screen, no "Check" button.
- **The rule is the game mechanic, not a quiz between games.** In the one controlled study of exactly this choice
  with children of this age, the version where the learning content was the core mechanic taught more and was
  chosen seven times longer than the version that put the same content into quizzes between play (§3.1).
- **Show, then do.** A 10–20 second animated demonstration ("watch Pip do it"), then the same situation for the
  child. This is the worked-example pattern, and it is the kind of support with solid evidence in games (§3.2).
- **Assessment hidden in play.** What the child gets right on the first try, where a hint was needed, and whether a
  rule still works three levels later, are all visible from the moves. Nothing has to be asked (§3.4).
- **Animation only where it carries the rule.** Evidence favours animation that represents the content and is
  weakest for decoration (§5). The current gentle pulse on the story pictures is decoration.
- **"Video" as our own short animated clips, not embedded YouTube.** Konami's official beginner videos exist in
  English and French (no Hebrew), but an embedded YouTube player on a child-directed page brings YouTube's
  child-directed obligations and COPPA third-party responsibility with it, and clips can only be made with
  start/end parameters, never by cutting or re-hosting (§6). Official videos belong, at most, in a parents'
  corner behind a click.
- **A capstone the child wins:** a scripted duel against the rival, 4000 Life Points, stacked deck, the way
  Konami's own starter set and the Pokémon Battle Academy teach a first game (§3.5).

**Build order (detail in §9):** (1) a mini duel board with one battle mini-game, and Mission 1 reworked around it;
(2) positions and Life Points; (3) summoning and Tributes; (4) Spells and Traps; (5) "win this turn" puzzles as
the hidden assessment; (6) the chain; (7) the rival duel; then voice and sound. Test step 1 with a few children
before building the rest.

---

## 2. What is new, and what this note would revise in the earlier note

| Earlier note (2026-11-16) | This note | Why |
| --- | --- | --- |
| §10.1: every mission is **Story (6–10 pages) → Try it → Quiz (3–5 questions)**. | **Play first.** At most two or three story beats before the first move; no separate quiz block. The mission ends on a playable challenge. | Habgood & Ainsworth 2011 (§3.1); Andersen et al. 2012: instructions work when given at the moment of need, not up front (§3.2); in Wouters & van Oostendorp 2013 narrative support was the weakest category (d = .11, not significant) (§3.2). |
| §10.4 ranks the **quiz slide first** for learning value. | Demote it. Retrieval practice stays, but as a **move on the board** in a later level (§3.4). The quiz component is kept for an optional "challenge" and for teachers. | The earlier ranking rests on Karpicke et al. 2016, which compares retrieval with re-reading, not quiz screens with play. A move that needs the rule is also retrieval **(ours, an inference; not tested in that paper)**. |
| §6 K: voice is "a support, not a replacement for text". | **Raise the priority of spoken words.** | Modality (spoken instead of written words) is one of the five game features Mayer 2019 calls promising, and the largest category effect in Wouters & van Oostendorp 2013 (d = 1.24). Caveat: those studies are mostly with college students (§3.2). |
| §8.1: "A child-facing track should not embed third-party players". | **Confirmed and made precise**: which YouTube and FTC texts create the problem, what "privacy-enhanced mode" does and does not do, and the three ways a video could still be offered (§6). | The owner asked for "parts of videos", so the reasons and the alternatives need to be on the table. |
| §13: Konami's video guidelines for creators "not located or read". | **Located and read** (`konami.com/yugioh/guide/movieguideline`): Japan residents only, individuals only, video platforms only (§6.4). | It still grants nothing for a website outside Japan. |
| §12 Q5: three-zone or five-zone board left open. | **Recommend a small three-zone, 4000 LP board** for all Junior levels. | It is Konami's own on-ramp (§3.5) and a small board is what makes one-rule levels readable on a phone. |
| §6 I: local badges and a rank ladder. | Keep them **small, unexpected and tied to what the child did**, and prefer collecting the cards used in play. | Deci, Koestner & Ryan 1999: expected rewards for completing a task undermine intrinsic motivation, more so for children (§3.3). |
| §7.2: stay on CSS plus `motion`. | **Unchanged**, with licences and prices now checked (§5.2). | — |

Still valid and not repeated here: the rule subset (§4.2 of the earlier note), the WCAG table (§9.1), the
language findings (§9.3), the "original art only" rule (§8.1) and the privacy posture (§8.2).

---

## 3. What works for 8–12, and the evidence behind each mechanic

### 3.1 Make the rule the game (intrinsic integration)

- **The study.** Habgood & Ainsworth built *Zombie Division*, a maths game "for teaching mathematics to seven to
  eleven year olds", in three versions. In the *intrinsic* version the division content was the combat mechanic.
  In the *extrinsic* version the same content was put into quizzes between rounds of play. Study 1: 58 children
  (aged 7 years 1 month to 8 years 10 months) played for two hours. At the delayed test the intrinsic group scored
  58 % against 41 % (extrinsic) and 38 % (control). Study 2: with free choice, 16 children "spent over seven times
  longer playing the intrinsic version" (75.7 against 10.3 minutes). (Habgood & Ainsworth 2011, *Journal of the
  Learning Sciences* 20(2), 169–206; accepted manuscript at <https://shura.shu.ac.uk/3556/> **[full text]**.)
- **Limits.** One game, one subject, small samples, children at the young end of our band. A web search also
  surfaced a later thesis reporting a failed replication and a critique about a confound in the extrinsic
  version's difficulty; neither was read **[secondary, §11]**. Treat it as the best available evidence for the
  direction, not as proof.
- **What it means here (ours).** The current flow, story then questions, is the *extrinsic* design. The Yu-Gi-Oh!
  rules are already a game, so the intrinsic design is cheap: the level *is* a tiny piece of a duel.

### 3.2 Instructional support that works inside games

| Finding | Source | Consequence (ours) |
| --- | --- | --- |
| Adding instructional support to a learning game improves learning (d = .34; k = 107). By category: **modality** d = 1.24, **personalization** d = 1.06, **feedback** d = .49, **modeling** (worked examples, scaffolding) d = .46, reflection d = .29, collaboration d = .14; **narrative** d = .11, advice d = .13 and control d = .13 were not significant. The authors report signs of publication bias. Most of the modality and personalization studies are with college students. | Wouters & van Oostendorp 2013, *Computers & Education* 60, 412–425, DOI [10.1016/j.compedu.2012.07.018](https://doi.org/10.1016/j.compedu.2012.07.018) **[full text, Table 4 and study table]** | Spend effort on: a spoken line, a demonstration before the child's turn, and feedback that explains. Spend little on story. |
| "Value-added research suggests five promising features to include in educational computer games: modality, personalization, pretraining, coaching, and self-explanation." | Mayer 2019, *Annual Review of Psychology* 70, DOI [10.1146/annurev-psych-010418-102744](https://doi.org/10.1146/annurev-psych-010418-102744) **[abstract]** | Pretraining = name the pieces (card, zone, ATK) before the level that uses them. Coaching = a hint when stuck. Personalization = the mentor says "your monster", not "the monster". |
| In the most complex of three games (Foldit), tutorials raised play time by up to 29 % and progress by up to 75 %; in the two simpler games they did not help. Instructions given "as closely as possible to when they were needed, rather than out of context in an up-front manual" raised play time by 16 % and progress by 40 % in Foldit. "We found no evidence to support the claim that restricting player freedom ... improves learnability." Over 45,000 players, not children. | Andersen et al. 2012, CHI '12, DOI [10.1145/2207676.2207687](https://doi.org/10.1145/2207676.2207687), PDF at <https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf> **[full text]** | Yu-Gi-Oh! is a complex, unconventional game, so guidance is worth building. Put each instruction on the board at the moment it applies; do not front-load it in story pages. Do not lock every tap: let the child try a wrong card and let the board answer. |
| Presenting multimedia in learner-paced segments helps retention (d = 0.32) and transfer (d = 0.36) and lowers cognitive load; 56 investigations. Learners with **higher** prior knowledge benefited more on retention. | Rey et al. 2019, *Educational Psychology Review* 31, 389–419, DOI [10.1007/s10648-018-9456-4](https://doi.org/10.1007/s10648-018-9456-4) **[full text]** | One rule per level, the child taps to go on. Not a magic bullet for complete beginners, so keep each segment tiny. |
| Letting learners control the pace of a narrated animation improved transfer. | Mayer & Chandler 2001, *J. Educational Psychology* 93(2), DOI [10.1037/0022-0663.93.2.390](https://doi.org/10.1037/0022-0663.93.2.390) **[abstract]**; college students | Demonstrations pause at each step until tapped, or offer "again". |
| Guidance helps inquiry learning (learning outcomes d = 0.50; 72 studies); too few studies to say how this differs by age. | Lazonder & Harmsen 2016, *Review of Educational Research*, DOI [10.3102/0034654315627366](https://doi.org/10.3102/0034654315627366) **[abstract]** | "Discover it yourself" needs hints behind it. |
| Working-memory capacity grows roughly linearly from 4 to 15 years, "with each component undergoing sizable expansion in functional capacity throughout the early and middle school years". | Gathercole et al. 2004, *Developmental Psychology* 40(2), DOI [10.1037/0012-1649.40.2.177](https://doi.org/10.1037/0012-1649.40.2.177) **[abstract]** | An 8-year-old holds less at once than a 12-year-old. One new element per level; keep everything else on screen identical to the previous level. |

### 3.3 Difficulty, rewards and feedback

- **Easier keeps children playing, but the most engaging settings taught slowest.** In two large online
  experiments on a maths game (10,000 and 70,000 players), "subjects were more engaged and played longer when the
  game was easier", and "the most engaging design conditions produced the slowest rates of learning" (Lomas et al.
  2013, CHI '13, DOI [10.1145/2470654.2470668](https://doi.org/10.1145/2470654.2470668) **[abstract]**).
  Consequence (ours): start each world very easy, then add one harder "boss" level; do not tune for time spent.
- **Let the first game be a win.** Konami's Demo Judge FAQ, quoted in the earlier note (§4.1), says the same.
- **Expected prizes for finishing a task reduce intrinsic motivation, more for children.** Meta-analysis of 128
  experiments: engagement-contingent, completion-contingent and performance-contingent rewards "significantly
  undermined free-choice intrinsic motivation (d = -0.40, -0.36, and -0.28)"; "Positive feedback enhanced both
  free-choice behavior (d = 0.33) and self-reported interest (d = 0.31)"; "Tangible rewards tended to be more
  detrimental for children than college students, and verbal rewards tended to be less enhancing for children"
  (Deci, Koestner & Ryan 1999, *Psychological Bulletin* 125(6), DOI
  [10.1037/0033-2909.125.6.627](https://doi.org/10.1037/0033-2909.125.6.627) **[abstract]**). These are
  laboratory rewards, not in-game badges, so the transfer is an inference (ours): make rewards a surprise and
  about what the child did ("You won with a Trap!"), not a promised prize for finishing.
- **"Juicy" effects make a game look better, not necessarily play better.** Visual embellishments "contribute to
  the visual appeal of all games, but only affects aspects such as competence under specific circumstances"
  (Hicks et al. 2019, CHI PLAY '19, DOI [10.1145/3311350.3347171](https://doi.org/10.1145/3311350.3347171)
  **[abstract]**; 40 and 32 participants, not children). A small hit effect is enough.
- **Feedback that explains beats right/wrong** (earlier note §5, Van der Kleij et al. 2015). In a board game the
  explanation can be the animation plus one spoken or written line.

### 3.4 Assessment without questions

- **Definition.** "Stealth assessment is seamlessly woven directly into the fabric of the instructional
  environment ... learner performance data are continuously gathered during the course of playing/learning and
  inferences are made about the level of relevant competencies." It "is intended to support learning and maintain
  flow" (Shute 2011, "Stealth assessment in computer-based games to support learning", in Tobias & Fletcher
  (eds.), *Computer Games and Instruction*, pp. 503–523, author's copy at
  <https://myweb.fsu.edu/vshute/pdf/shute%20pres_h.pdf> **[full text, opening sections]**). Shute's method uses
  evidence-centred design and Bayesian models; that machinery is far beyond what a nine-rule course needs.
- **A light version for Junior (ours).** Each level names the one rule it checks. From the moves alone the app can
  record, per rule:
  - solved on the first try, or after how many tries;
  - whether the hint or the demonstration was replayed;
  - which illegal move was attempted (attacking with a Defense Position monster, activating a Trap the turn it
    was Set). Each illegal move is a specific misconception, and the board can answer that one;
  - whether the rule still works **three or four levels later**, when a puzzle needs it again without saying so.
    This is the spacing and retrieval the earlier note wanted from quizzes.
- **Mastery (ours).** A rule is mastered when it has been used correctly, unprompted, in a later level. Stored in
  the browser only, like today. A child who struggles gets the demonstration again and an easier variant, never a
  score.
- **Where a question is still fine.** One "what will happen?" tap *on the board* before an attack resolves
  (predict, then watch) is a move, not a quiz screen. Use it sparingly.

### 3.5 How Konami and comparable products onboard

**Verified on first-party pages or documents:**

| Product | What it does | Source |
| --- | --- | --- |
| **Konami, Speed Duel** | "the perfect introduction to the Yu‑Gi‑Oh! TRADING CARD GAME"; "easy to learn". Official one-page guide: "Each player begins with 4000 LP", "Your Deck needs to contain between 20 and 30 cards", "Each player draws the top 4 cards from their Deck for their starting hand", "If you go first, don't draw a card on your first turn". The guide teaches battle with a picture and a subtraction ("2000-1200=800"), not prose. | <https://www.yugioh-card.com/eu/play/speed-duel-beginners-guide/>; PDF <https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Speed_Duel_Guide_EN.pdf> |
| **Konami, 2-Player Starter Set** | "the Starter Set's 64-page comic book walks you through a scripted (non-randomized) Duel", "from your first card draw, through Summons and battles"; afterwards the decks can be rebuilt and replayed. | <https://www.yugioh-card.com/eu/product/yu-gi-oh-tcg-2-player-starter-set/> |
| **Konami, *For Beginners* videos** | Thirteen videos of 1:31 to 3:16, five of them "The Basics of Dueling"; they "use scenes from the popular television series". | Earlier note [beginner-training-matches.md](./beginner-training-matches.md) §2 (fetched 2026-10-11); lengths re-checked today for three videos (128 s each for "Getting Started" EN-EU, EN-NA and FR) |
| **Konami, Duel Links and Master Duel** | Tutorial by playing, "Duel Quizzes" (board puzzles), Solo Mode guides in rule order. | Earlier note kids-interactive-academy.md §4.1 (fetched 2026-11-16) |
| **ChessKid** | Lessons in seven levels named after the pieces, from Pawn (6 lessons) to SuperKing; each lesson is a short video plus "interactive practice, puzzles, and fun challenges". "ChessKid has no outside links, ads, or social networking between kids and adults." | <https://www.chesskid.com/learn/lessons>; <https://support.chesskid.com/en/articles/8858305-what-s-the-difference-between-chesskid-and-chess-com> |
| **Duolingo** | "learners interact with information right from the start, in their very first lesson"; "Mistakes are part of the learning process"; explicit rules are offered on the side: "Explicitly learning a rule or pattern can help move your learning along by directing you to the correct hypothesis". | Blanco, 2023-08-03, <https://blog.duolingo.com/what-is-implicit-learning/> |
| **Khan Academy Kids** | Ages 2 to 8; "Guided by five whimsical characters including narrator Kodi Bear"; "No ads, no subscriptions". Younger than our band; cited for the narrator-character pattern only. | <https://www.khanacademy.org/kids> |

**Reached only through third parties [secondary], use as ideas, not as facts:**

- **Pokémon TCG Battle Academy**: two guide booklets walk both players through the first turns with decks in a
  fixed order, so the first turns have a known outcome; then you shuffle and play freely. (Reviews; the official
  product page returned 404 and the official rules PDF could not be downloaded.)
- **MTG Arena "Color Challenge"**: early matches against bots with predetermined draws, played like puzzles, one
  colour at a time. (Community wiki and guides; no Wizards design article found.)
- **Hearthstone**: the tutorial aimed to teach only enough to start the real game, the rest being learned while
  playing; the team filmed new players and found many did not understand one mechanic (Taunt). (Summary of
  gamedeveloper.com coverage of Eric Dodds' GDC 2014 talk; talk listed at <https://www.gdcvault.com/play/1020775>,
  not watched.)
- **Plants vs. Zombies**: George Fan's GDC 2012 talk "How I Got My Mom to Play Through Plants vs. Zombies" exists
  on the official GDC channel (<https://www.youtube.com/watch?v=fbzhHSexzpY>, title confirmed by oEmbed). Its ten
  tips (blend the tutorial into the game, let the player do rather than read, about eight words on screen at a
  time) are reported by third-party summaries; the talk itself was not watched.
- **DragonBox Algebra**: rules introduced gradually, discovered by experimenting with cards, instant feedback,
  minimal instruction. (Store listings and reviews; the publisher's page was not reached.)

**The common pattern (ours):** a small fixed situation with a known good outcome; one new idea at a time; the
learner acts from the first minute; explanation arrives after or beside the action; a scripted first full game
that the learner wins; then free play. Konami's own material follows it (scripted duel, 4000 LP on-ramp, puzzles),
which makes it a safe model to copy in structure.

---

## 4. Mini-games mapped to the rules a beginner needs (ours)

All of these run on one shared **mini board**: three Monster Zones and three Spell & Trap Zones per side, a Deck,
a Graveyard, two Life Point lanterns starting at 4000, a hand of two to four original schematic cards. Three zones
and 4000 LP follow Konami's Speed Duel on-ramp (4000 LP verified today; the three-zone layout is from the earlier
note, fetched 2026-10-11). Every game has **tap-then-tap** as the main control (drag optional), no timer, unlimited
retries, a "show me" button that replays the demonstration, and a calm mode that swaps motion for a cross-fade.

The rules follow the subset in the earlier note §4.2 and the academy's existing lessons. Each rule statement
below should be checked against the rulebook when the level is written; simplify by leaving things out, never by
changing a rule.

| # | Mini-game | Rule it teaches | How it plays | Why it suits 8–12 | Hidden assessment |
| --- | --- | --- | --- | --- | --- |
| 1 | **Fill the field** (replaces the six-screen sort) | Three card types; where each goes; a Trap goes face-down first | Three or four cards slide into the hand. Tap a card, the zones that accept it glow, tap a zone. A Monster stands up in a Monster Zone; a Spell flashes and goes to the Graveyard; a Trap flips face-down and "hides". A wrong zone gently bounces the card back and the right row glows. | Sorting and placing are one action; about ten seconds per card; almost no reading. Teaches types **and** zones in the time the sort took. | First-try placement per card type. |
| 2 | **Clash!** | Attack Position against Attack Position: higher ATK wins, the loser is destroyed, its owner loses the difference; equal ATK destroys both | The rival has one monster. The child has two. Tap yours, tap theirs. The two cards slide together, the two ATK numbers grow, the subtraction appears between them ("1800 − 1200 = 600"), the loser cracks and goes to the Graveyard, the rival's lantern drops by 600. Choosing the weaker monster shows the same animation going the other way, then "try again". | The arithmetic is shown as an event, as Konami's own Speed Duel guide does. It is the most "anime" moment of the game and the easiest to make fun. | Picks a monster that wins on the first try; later, picks the one that deals the most damage. |
| 3 | **Shield or sword** | Defense Position: turned sideways, uses DEF; the defender takes no damage; if the attacker's ATK is lower than the DEF, the attacker's owner takes the difference and nothing is destroyed | The rival is about to attack. Before it does, the child may turn their monster sideways. Then the attack plays out. Levels: a case where defending saves Life Points, a case where staying in attack wins, a case where the rival bounces off a big shield and hurts itself. | "Stand or crouch" is a body idea (the cub with the shield already exists). The surprise of the attacker hurting itself is memorable. | Chooses the position that loses the fewest Life Points. |
| 4 | **Blow out the lantern** | Life Points; direct attack only when the opponent controls no monster; reaching 0 wins | The rival has 2000 LP and one small monster. The child has two attackers. First clear the way, then attack directly: the lantern drains to 0 and goes out. Later levels ask for the exact order ("which one attacks first?") by play, not by question. | A whole tiny duel with a win in under a minute. Subtraction of round hundreds is primary-school maths. | Orders the two attacks correctly without a hint. |
| 5 | **Call a friend** | One Normal Summon or Set per turn; Level 1–4 needs no Tribute, Level 5–6 needs one, Level 7 or higher needs two | A "summon gem" glows once per turn; using it dims it. A Level 6 card in hand shows one empty paw-print: tap one of your monsters to send it to the Graveyard, the paw fills, the big monster lands. Level 7 shows two paws. Trying to summon twice makes the dim gem shake. | The cost is visible and countable on the card, not a sentence. Sets up the classic problem "my monster is too weak", solved by the child. | Tributes the right number; does not waste the stronger monster. |
| 6 | **Four chimes, then six** | The order of a turn: Draw, Main, Battle, End first; Standby and Main Phase 2 named later | Not an ordering quiz. A phase bar sits on every board from game 5 onward. The child taps "Draw" (a card flies to the hand), plays in Main, taps "Battle" (attack arrows appear), taps "End". Things that cannot be done in a phase are simply not tappable and the bar pulses where they can be. | The turn is learned as a routine by doing it ten times, the way children learn any board game. | Advances phases without prompting after two or three levels. |
| 7 | **Spell now!** | A Normal Spell is played from the hand in your Main Phase, does what it says, and goes to the Graveyard | A puzzle where the battle cannot be won as it stands. A Spell in hand ("destroy one face-up monster") opens the way. If the child enters the Battle Phase first, the Spell greys out and the mentor says "Spells like this one are for your Main Phase"; rewind one step. | The child feels why order matters instead of being asked about it. | Plays the Spell before attacking on the first try. |
| 8 | **Ambush** | A Trap is Set face-down first, cannot be activated the turn it was Set, and can be activated on the opponent's turn | Turn 1: Set the chameleon card (it hides). Tap "End". Turn 2, the rival declares an attack: the game **freezes**, the Set card wiggles, tap it to spring the Trap. Not tapping lets the attack through, and the level offers a replay. Tapping the Trap on the turn it was Set gets a sleepy "not yet". | Hide-and-pounce is the most toy-like idea in the game. The freeze gives the timing without any time pressure. | Sets on own turn and springs on the rival's attack, unprompted, in a later puzzle. |
| 9 | **Turtle tower** | A two-link chain: the last card activated resolves first | The rival activates a Spell (turtle 1 climbs on). The child answers with a Trap (turtle 2 climbs on top). Then the tower unstacks from the top with a small pause per turtle. A "predict" variant: tap the turtle that will jump first before it resolves. | A stack is a physical thing; "last on, first off" needs no vocabulary. Two links only. | Predicts correctly; later, chooses to chain when it saves a monster. |
| 10 | **Win this turn** (puzzle pack) | Everything so far, combined | A fixed board and hand, "win this turn" or "survive this turn". Ten to fifteen boards, each needing rules from earlier levels. Stars for solving without the hint. | Chess-puzzle format (ChessKid) and Konami's own "Duel Quizzes" (Duel Links). Short, replayable, shareable with a parent. | This is the main assessment (§3.4): spaced, unprompted use of each rule. |
| 11 | **The rival's challenge** | A whole short duel | Scripted duel, stacked decks of about ten cards, 4000 LP, the mentor whispers at most one line per turn, the child wins on turn three or four. Then "play again" with the cards shuffled a little. | The first-game pattern of the Konami starter set and the Battle Academy; a win to end on. | Number of prompts needed. |
| 12 | **Replay theatre** (not a game: the demonstration layer) | Any rule | A 10–20 second animated run of the board with a spoken or captioned line, shown before the child's first try of a new rule and on "show me". Stepped: it pauses after each beat. | Worked example before problem solving (modeling d = .46, §3.2); learner pacing (§3.2). This is also the "video" the owner asked for, made of our own animation (§6.6). | Replays requested per rule. |

**Rule accuracy notes (ours).** Games 2 and 3 cover the three battle outcomes of the earlier note §4.2. Game 6
starts with four phase names and adds the other two later: this leaves phases out for a while, it does not rename
them. Game 8 uses a Normal Trap only and game 7 a Normal Spell only, as the pilot already does to avoid false
general rules. Face-down Defense Position (Set monsters) and flipping are left for a later level and should not
be implied away.

**What happens to the existing pieces.** The cub, spark and chameleon stay as the faces of Monster, Spell and
Trap. The six story pages shrink to two or three beats spread between games 1 and 2. The six-card sort becomes
game 1. The three quiz questions ("Trap first", "ATK", "Spell now") become games 8, 2 and 7.

---

## 5. Animation

### 5.1 What helps and what distracts

| Finding | Source | Consequence (ours) |
| --- | --- | --- |
| Animation beats static pictures overall (d = 0.37; 26 studies, 76 comparisons), more "when the animation is representational rather than decorational (d = 0.40)", and most "when procedural-motor knowledge is to be acquired (d = 1.06)". | Höffler & Leutner 2007, *Learning and Instruction* 17, 722–738, DOI [10.1016/j.learninstruc.2007.09.013](https://doi.org/10.1016/j.learninstruc.2007.09.013) **[abstract, via ERIC EJ780451]** | Animate the rule itself: the card turning to Defense Position, the Tribute leaving, the chain unstacking. A duel is a procedure, which is where animation helps most. |
| Animation over static graphics: g = 0.226 (61 studies, N = 7,036, 140 comparisons); larger when "coupled with auditory commentary (g = 0.336)" and largest when the instruction "did not include any accompanying text (g = 0.883)". | Berney & Bétrancourt 2016, *Computers & Education* 101, 150–167, DOI [10.1016/j.compedu.2016.06.005](https://doi.org/10.1016/j.compedu.2016.06.005) **[abstract, via the University of Geneva archive]** | Do not put a paragraph beside a moving board. One short line, ideally spoken, or the line after the motion ends. |
| Interesting but irrelevant additions ("seductive details") tend to lower learning; results are mixed on how much. | Sundararajan & Adesope 2020, *Educational Psychology Review*, DOI [10.1007/s10648-020-09522-4](https://doi.org/10.1007/s10648-020-09522-4) **[partial abstract only, §11]** | Keep idle loops, confetti and background motion out of the moment a rule is being shown. |
| Embellishment improves appeal, not reliably competence. | Hicks et al. 2019 (§3.3) | A small impact effect per hit; no more. |

**Applied to the pilot (ours).** `mission-art.tsx` adds `animate-pulse` to the whole story picture when motion
is on. That is a decorational loop: it carries no rule. The motion budget is better spent on the six or seven
"rule animations" of §4. The accessibility limits in the earlier note §9.1 still apply (one flash per hit, no
strobe, loops stop within five seconds or have an off switch, calm mode).

**A short list of rule animations to build once and reuse (ours):** card to zone; card flips face-down / face-up;
card turns to Defense Position; two cards clash with the subtraction; card to Graveyard; Life Point lantern
drains; chain link stacks / unstacks; phase bar advances.

### 5.2 Practical options for this app (Next.js 16, React 19, static)

Licences were read from each project's own repository; versions and licence fields from the npm registry.

| Option | Licence and cost (verified) | What it is good for | Notes |
| --- | --- | --- | --- |
| **CSS transitions / keyframes** | Web platform | Flashes, glows, simple slides | Already governed by the global reduced-motion rule. |
| **`motion`** (installed `^14.0.0`; npm latest 14.14.0) | MIT (<https://github.com/motiondivision/motion/blob/main/LICENSE.md>). The docs mention a paid "Motion+" tier for extras such as a custom cursor and `AnimateNumber`; the core is free. | Everything in §5.1: independent transforms, springs, keyframe sequences, layout animation between zones, `AnimatePresence` exits, tap and drag gestures (<https://motion.dev/docs/react-animation>). | **Recommended. No new dependency.** A Life Point count-down does not need `AnimateNumber`; a `useMotionValue` or a plain interval does it. |
| **Inline SVG** (as today) | Ours | Characters, cards, the board | Stays crisp, themable, text-free for three languages. |
| **Lottie** (`lottie-web` 5.13.0; `@lottiefiles/dotlottie-react` 0.22.2) | Players MIT (<https://github.com/airbnb/lottie-web>, <https://github.com/LottieFiles/dotlottie-web>). Free files on LottieFiles are under the Lottie Simple License: use "including for commercial purposes", attribution "permitted" to omit "though attribution is strongly encouraged" (<https://lottiefiles.com/page/license>). | A ready-made celebration or a pre-drawn effect | Animations are authored in After Effects or downloaded. A downloaded file's originality is the uploader's claim, not LottieFiles' guarantee **(ours)**; for a children's product about a licensed game, prefer effects we draw. Not interactive. |
| **Rive** (`@rive-app/react-canvas`, `@rive-app/react-webgl2` 4.39.0) | Runtimes MIT, "no runtime fees", "no royalties". Editor: Free plan exports ".riv files with a splash screen"; Cadet, $9 per seat per month, ships "without the splash screen" (<https://rive.app/pricing>, read today; prices change). | Characters that react (blink, cheer, look at the tapped card) through a state machine | Adds a WebAssembly runtime and a new authoring tool. The React docs page read says nothing about reduced motion or Next.js; both must be handled by us. Worth it only if the owner wants truly expressive characters (§10). |
| **`canvas-confetti`** 1.9.4 | ISC | One win effect | Could equally be ten CSS particles. Must respect calm mode. |
| **`howler`** 2.2.4 | MIT | Sound effects | Optional; the Web Audio API alone is enough for four short sounds. Sound starts only after a tap (earlier note §7.3). |
| **Pixi / Phaser** | MIT | Full game canvas | Not recommended: a card board is DOM-sized, and canvas loses the accessibility the pilot already has (native buttons, focus, `aria-live`). |

**Recommendation (ours):** build the mini board and the rule animations with `motion`, CSS and SVG. Keep every
animated thing a real DOM element so that keyboard, focus and screen-reader behaviour of the pilot survive.
Revisit Rive only after children have tested the first games.

---

## 6. Video

### 6.1 Length and format for this age

- **The much-quoted "six minutes" is about adults.** Guo, Kim & Rubin analysed 6.9 million video sessions in four
  edX courses: "median engagement time is at most 6 minutes, regardless of total video length"; they recommend to
  "segment videos into chunks shorter than 6 minutes" and note that tablet-drawing tutorials with "motion and
  continuous visual flow" engage more than slides. They measured watching time, not learning, in university-level
  MOOCs (L@S 2014, DOI [10.1145/2556325.2566239](https://doi.org/10.1145/2556325.2566239), PDF at
  <https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf> **[full text]**).
- **Closest study to our age.** In two flipped middle-school science classes, test scores right after short and
  long videos did not differ significantly, but "longer-term retention for males and students with learning
  disabilities was higher following short videos", and students reported being "more engaged" with shorter ones
  (Slemmons et al. 2018, *J. Science Education and Technology* 27, 469–479, DOI
  [10.1007/s10956-018-9736-2](https://doi.org/10.1007/s10956-018-9736-2) **[abstract, via ERIC EJ1187565]**; the
  lengths compared are not in the abstract).
- **Segmenting and pacing** (Rey et al. 2019; Mayer & Chandler 2001, §3.2) say the same thing for any age: small
  units, learner-controlled.
- **Konami's own choice**: beginner videos of 1:31 to 3:16 (§3.5).
- **No source was found that tests video length for 8–12-year-olds in a game-learning setting** (§11).

**Design figure (ours):** a clip of **10–20 seconds for one rule** (the Replay theatre of §4), never more than
about 60–90 seconds for a recap, always followed at once by the child doing the same thing, always skippable and
replayable, with a spoken line or a caption but not a paragraph beside it (§5.1).

### 6.2 The official Konami videos: what exists, in which languages

- **Thirteen *For Beginners* videos**, on <https://www.yugioh-card.com/eu/forbeginners/> (EU) and
  <https://www.yugioh-card.com/en/forbeginners/> (North America). IDs per language are in
  [beginner-training-matches.md](./beginner-training-matches.md) §2.1–2.2 (fetched 2026-10-11): English (EU and
  NA uploads), French, German, Italian, Spanish. Konami's own French page uses the English video for #5.
  The five "Basics of Dueling" videos are the ones that match the Junior subset: Getting Started (2:08), The Flow
  of a Duel (2:34), All About Monsters (2:58), In the Heat of the Battle (3:16), More Main Phase Actions (2:37).
- **Hebrew: none.** No Hebrew upload is listed on Konami's pages. Checked today in the watch-page data of
  "Getting Started" (EU English `WnEM6gaIYvo`, NA English `orVzLmJhi2c`, French `fDEC9t9tYw8`): each has a single
  caption track, **auto-generated** (`kind: "asr"`) in its own language, and YouTube's automatic translation list
  includes Hebrew (`iw`). So a Hebrew viewer could at best get a machine translation of machine captions; its
  quality on game terms was not tested (§11).
- **They are still embeddable** (`playableInEmbed: true` today on those three) and marked `isFamilySafe: true`.
  Whether Konami designated them "made for kids" is not visible in that data (§11).
- **They are built from anime footage** ("use scenes from the popular television series"), so they are Konami's
  and the anime rights holders' material from start to finish.
- `docs/video-to-see.md` was checked for relevance: its three links are high-rated Dueling Book match recordings
  by fan channels ("The DB Grinder", "Pain"), not teaching material and not for children.
- The duel app already embeds these videos for its general-audience Beginner course
  (`apps/duel-nextjs/src/client/onboarding/videos.ts`, `youtube-nocookie.com/embed/<id>?rel=0`). That is a
  different audience from a page built for under-13s.

### 6.3 "Parts of videos": what YouTube allows

- **The only permitted way to show a YouTube video elsewhere is YouTube's player.** Terms of Service: you may not
  "access, reproduce, download, distribute, transmit, broadcast, display, sell, license, alter, modify" content
  except as the Service allows; "You may also show YouTube videos through the embeddable YouTube player."
  (<https://www.youtube.com/static?template=terms>). Downloading a Konami video and cutting a clip from it is
  therefore out, independently of copyright.
- **A "clip" means start and end parameters on the embed.** `start`: "causes the player to begin playing the
  video at the given number of seconds from the start of the video." `end`: "specifies the time, measured in
  seconds from the start of the video, when the player should stop". Captions: `cc_load_policy=1` shows them by
  default; `cc_lang_pref` "specifies the default language that the player will use to display captions"; `hl`
  sets the interface language. "Embedded players must have a viewport that is at least 200px by 200px."
  `modestbranding` "is deprecated and has no effect."
  (<https://developers.google.com/youtube/player_parameters>)
- **The player may not be altered.** YouTube API Services Developer Policies, III.I: you must not "modify, build
  upon, or block any portion or functionality of a YouTube player", must not "remove, obscure, alter, or disable
  any links that appear in YouTube players", and must not "separate, isolate, or modify the audio or video
  components of any YouTube audiovisual content" ("you must not apply alternate audio tracks to videos").
  (<https://developers.google.com/youtube/terms/developer-policies>) So: no cropping overlay to hide the YouTube
  links, and **no Hebrew voice-over laid on top of a Konami video**.
- **Practical limits (ours).** A start/end clip still shows YouTube's title, logo and link out to youtube.com,
  and what the player offers when the segment ends is YouTube's choice (`rel` only "indicates whether the player
  should show related videos", and its behaviour changed in 2018). A child is one tap from YouTube itself, whose
  Terms say "You may use the Service if you are at least 13 years old", younger children only when "enabled by a
  parent or legal guardian".

### 6.4 Konami's position on its own footage and card images

- **Konami's Yu-Gi-Oh! video-posting guidelines** (遊戯王カードゲーム 動画投稿ガイドライン), established
  2026-01-26, last revised 2026-07-01 (<https://www.konami.com/yugioh/guide/movieguideline>, Japanese; read today
  through an automatic summary and translation, so wording is approximate):
  - "日本国内に居住するお客様のみ、本ゲームのプレー動画等の投稿が可能です。" (only customers residing in Japan
    may post play videos of the game); individuals only, organisations must apply separately.
  - Covers posting **your own play videos and screenshots** to a named list of video and social platforms.
    General websites are not mentioned.
  - Conditions include not extracting only the music or the character images, no posting for commercial
    purposes other than a platform's own monetisation, no implying a partnership with Konami, takedown on request.
  - Anime footage is not mentioned.
- **So nothing new is granted for this project.** The guidelines do not cover a website, a non-Japan resident,
  card images outside play footage, or anime clips. The earlier note's finding stands (§8.1 there): Konami's
  published terms reserve card art, anime characters, music and trademarks, and the yugioh.com terms explicitly
  prohibit "video mash-ups, even if you provide these for free".
- **Embedding is not copying, but it is not a licence either (ours).** Konami leaves embedding switched on and
  embeds these videos itself, so an unmodified embed with credit and a link back is the low-risk way to show
  them. It gives no right to cut, dub, subtitle or re-host them, and Konami can switch embedding off at any time.

### 6.5 Embedding YouTube on a page made for under-13s

- **YouTube requires child-directed sites to say so.** YouTube Help, "Embed videos & playlists": "If your website
  or app is child-oriented and you embed YouTube content, you must self-designate your site or app"; "This
  self-designation will ensure Google does not serve personalized ads on these sites or apps", and "some features
  will be turned off in the embedded player." (<https://support.google.com/youtube/answer/171780>)
- **Privacy-enhanced mode does not remove that duty.** Same page: the mode "prevents the use of views of embedded
  YouTube content" from influencing the viewer's browsing experience on YouTube; ads shown in it are
  non-personalized; to use it, "Change the domain for the embed URL ... to https://www.youtube-nocookie.com"; and
  "If your website or app is child directed, you must self-designate your site or app." The page does not say that
  no data is collected or that nothing is stored on the device (§11).
- **Developer Policies, III.J, Child-Directed API Clients** set further limits for a client that "targets or
  directs itself to children", and III.E.4 says that with made-for-kids content one "must turn off tracking and
  make sure that all data collection with respect to that player is compliant". The same policies note that "You
  can limit the data shared with YouTube before a user interacts with the YouTube embedded player by setting
  Autoplay to `false`."
- **COPPA makes the site answerable for what an embed collects.** FTC COPPA FAQ: "you are responsible for the
  collection of personal information from your users, no matter who is doing the collection" (D.9); for embedded
  third-party content, "you must conduct an inquiry into the information collection practices of every third party
  that can collect information via your app" (D.11); personal information includes "persistent identifiers, such
  as a customer number held in a cookie, an IP address" (C.5). COPPA "applies to commercial websites and online
  services" (B.5), so whether this site is commercial matters (§10).
  (<https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>)
- **Why YouTube built these controls.** In 2019 Google and YouTube paid "$170 million" over allegations that
  YouTube collected "persistent identifiers that are used to track users across the Internet" from "viewers of
  child-directed channels, without first notifying parents and getting their consent"
  (<https://www.ftc.gov/news-events/news/press-releases/2019/09/google-youtube-will-pay-record-170-million-alleged-violations-childrens-privacy-law>).
- **GDPR.** Article 8 and Recitals 30 and 38 are quoted in the earlier note §8.2. Any embed sends the child's IP
  address to a third company; whether an embedded player's device storage needs prior consent under EU cookie
  rules was not verified on a regulator's page today (§11).

### 6.6 Options for "parts of videos" (ours)

| Option | What the child sees | Privacy and IP | Cost | Verdict |
| --- | --- | --- | --- | --- |
| **A. Our own animated clips** (Replay theatre, §4 #12) | A 10–20 s animated board with the three characters, in the child's language, spoken or captioned | No third party, no borrowed material | Low per clip once the rule animations of §5.1 exist: a clip is a scripted sequence of them | **Recommended.** It is also the better teaching: the clip shows the exact board the child is about to play. |
| **B. Official videos in a parents' and teachers' corner** | Nothing in the child's path. An adult page lists Konami's five basics videos (English, French) with a click-to-load preview; the player loads only after the click | YouTube is contacted only on an adult's click (a "facade": the real player "is loaded on interaction", <https://developer.chrome.com/docs/lighthouse/performance/third-party-facades>); use `youtube-nocookie.com`, self-designate the site with YouTube, credit Konami and link to its page. No Hebrew. | Small | Reasonable **after legal review**. A plain link to Konami's own page is the zero-risk variant. |
| **C. Official clips inside a mission** (`start`/`end` embeds) | A YouTube player in the middle of play | Everything in §6.5 applies in full; the child is one tap from YouTube; no Hebrew; cannot be dubbed or trimmed beyond start/end | Small | **Not recommended.** |
| **D. Ask Konami** for permission to use footage or card images | — | The only route to real clips or real cards | Unknown; the guidelines say Konami does not answer interpretation questions, and organisations apply through a separate form | Owner's decision. |

---

## 7. Child-specific UX and safety

Additions to the earlier note §5, §8.2 and §9; not a repeat.

| Area | Guidance | Basis |
| --- | --- | --- |
| **Reading load** | During play: one line, about eight to twelve words, and it should make sense heard, not only read. Game terms stay official; each appears first on the thing itself (the word "ATK" on the number that moves). | Berney & Bétrancourt 2016 (no accompanying text, §5.1); NN/g in the earlier note §5; "eight words" is George Fan's rule as reported **[secondary]**. The word count is ours. |
| **Voice** | A spoken line per level is worth piloting in one language first. Text stays visible as a caption. | Modality: Wouters & van Oostendorp 2013, Mayer 2019 (§3.2). The earlier note's caution stands: device speech voices vary, and Hebrew or French voices may be missing. Recorded audio in three languages is a real cost. |
| **Level length** | 30–90 seconds per level, five to seven levels per world, a natural stopping point after each world ("That's a good place to stop. Your cards are saved."). A world fits inside Konami's 10–15 minute demo limit. | Konami Demo FAQ (earlier note). **No tested session length for this age was found** (§11); the numbers are ours. |
| **Failure** | No "wrong" screen and no lost progress. A losing move plays out (that is the feedback), then one step is rewound. After two failures the demonstration is offered; after three, the right card glows. | Explanatory feedback (earlier note §5); coaching (Mayer 2019); Andersen et al. 2012: letting players experiment did no harm. |
| **Difficulty** | Easy first, one "boss" per world. Never tune for time spent. | Lomas et al. 2013. |
| **Rewards** | Earned cards go into an album (the cards the child just played with). Praise names the action. No promised prize for finishing, no countdown, no streak, no "come back tomorrow", no loss for leaving. | Deci et al. 1999 (§3.3). The UK Children's Code standard on nudge techniques could again not be read (403), so it is not cited (§11). |
| **Comparison with others** | None. The rival is a character. | Earlier note §6, §8.2. |
| **Motion and sound** | Calm mode stays and must cover the new board: cross-fade instead of slide, numbers change without the clash. Sound off by default, starts after a tap, a visible mute. One flash per hit. | Earlier note §7.3, §9.1; existing `calm-toggle.tsx`. |
| **Touch and pointer** | Tap-then-tap is the primary control, drag is extra. Targets stay at 48 px or more as in the pilot. No hover-only information. | WCAG 2.5.7 and 2.5.8 (earlier note §9.1). |
| **Keyboard and screen readers** | Zones and cards are real buttons with names ("Your Monster Zone 2, empty"); every outcome is also announced in words through the existing `aria-live` region ("Pocket Cub wins. Rival loses 600 Life Points."). | Existing pilot behaviour; earlier note §9.1. |
| **Hebrew and right-to-left** | Mirror: the level map, the direction of "next", the hand's reading order, the phase bar's direction. Do **not** mirror: the board (each player's side is defined by the game), the subtraction (`2000 − 1500 = 500` stays left-to-right, as the pilot already does for numbers), a video's own controls. Isolate Latin card names inside Hebrew text. Check each animation's direction in Hebrew: a card flying "forward" should fly toward the field, not toward the reading direction. | W3C guidance in the earlier note §9.3. The mirror/do-not-mirror list is ours; Apple's and Material's bidirectional guidance pages could not be read (§11). |
| **Links out** | None in the child's path, including YouTube. Sources and videos live in the adult corner. | Earlier note §8.2; ChessKid: "no outside links, ads, or social networking" (§3.5). |
| **Data** | Unchanged: browser storage only, no account, no analytics. The hidden assessment of §3.4 is stored locally and never sent. | Earlier note §8.2. |

---

## 8. How it fits the code (read today, nothing changed)

- **Reusable in the academy:** `duel-field.tsx`, `educational-card.tsx`, `life-points.tsx`, `chain-stack.tsx`,
  `phase-timeline.tsx`, `numeric-slide.tsx` (earlier note §2.3). The Junior pilot adds `flow.ts` (a typed list of
  steps), `progress.ts` (defensive local storage), `calm-toggle.tsx`, the three characters in `mission-art.tsx`,
  and tri-lingual copy in `mission1-copy.ts`.
- **What a level needs that does not exist yet (ours):** a small board state (zones, hand, Life Points, phase), a
  list of allowed moves per level with the outcome of each, and the rule animations. For games 1–9 a level can be
  plain data: a starting board, the accepted moves, and what each move plays. That is a new `Step` kind next to
  `story`, `sort` and `quiz` in `flow.ts`, not a rewrite.
- **A rules engine already exists in the monorepo.** `packages/duel-engine` describes itself as a "Pure
  TypeScript rules engine ... Zero runtime dependencies so it runs unchanged on the game server and in the
  browser" (`package.json`), and `apps/duel-nextjs/src/client/onboarding/` already has staged lessons, a scripted
  lesson bot (`training/scripted-bot.ts`), a spotlight that points at the card or zone to tap (`spotlight.ts`)
  and a lesson log. Those lessons use **real card passcodes** (`LESSON_CARD` in `lessons.ts`) on the full duel
  screen. Whether the engine can run a three-zone board with invented cards was **not assessed** (§11). It matters
  for game 11 only; games 1–10 do not need an engine.
- **Progress.** Mastery today means "all six sorts and all three quiz questions answered correctly"
  (`academy-junior-pilot.md`). Changing the mission changes that definition, so the storage key needs a new
  version rather than a silent reinterpretation; `progress.ts` already refuses to overwrite records it does not
  understand.
- **Tests.** The pilot was built test-first at two seams (answer functions, rendered mission). Level data
  ("this move on this board gives this outcome") is easy to test the same way, and is where rule accuracy can be
  pinned down.

---

## 9. Prioritised recommendation (ours)

Effort scale as in the earlier note: **S** about a day, **M** two to four days, **L** one to two weeks, for one
developer, excluding art, voice and translation review.

| Order | Build | Why now | Effort | Trade-off |
| --- | --- | --- | --- | --- |
| **1** | **Mini board + "Clash!" (game 2) + "Fill the field" (game 1), and rework Mission 1 around them.** Story cut to two or three beats; the three quiz screens removed; the pulse on story art removed; one demonstration clip. | It answers the owner's complaint directly, it is the most fun rule in the game, and it builds the board and the first rule animations everything else reuses. | **M–L** | Throws away part of the tested pilot flow (the quiz steps and their mastery rule). The copy file shrinks; French and Hebrew still need a native review. |
| **2** | **Test with three to five children** of 8, 10 and 12, on a phone and a tablet, before building more. Watch, do not ask. | Every number in this note about length, words and difficulty is a guess until then. Hearthstone's team found its biggest tutorial problem only by watching new players **[secondary]**. | **S** | Needs children and a parent's time. |
| **3** | **"Shield or sword" + "Blow out the lantern"** (games 3, 4) as world 2. | Completes battle and gives the first full win. Reuses the clash animation. | **M** | — |
| **4** | **"Call a friend" + the phase bar** (games 5, 6) as world 3. | Summoning and the turn, learned by routine. | **M** | The phase bar must be right the first time, since every later level shows it. |
| **5** | **"Spell now!" + "Ambush"** (games 7, 8) as world 4. | The two card types the pilot only describes today. | **M** | Needs the "freeze" on the rival's attack, the first real timing moment. |
| **6** | **"Win this turn" puzzles** (game 10), ten to fifteen boards, with local stars and the hidden mastery record (§3.4). | The assessment without questions, and the most replayable content per day of work. | **M** for the pack once the board exists | Each puzzle must be rules-correct; write them as tested data. |
| **7** | **"Turtle tower"** (game 9). | The chain is the hardest idea in the subset; it comes last, as in Konami's own order. | **M** | — |
| **8** | **"The rival's challenge"** (game 11) and a printable certificate. | The ending the course needs. | **L** | Decide first: a hand-scripted duel, or `duel-engine` with invented cards (§8). |
| **9** | **Voice and sound**: one spoken line per level in one language, four sound effects, mute. | Best-supported addition in the game-learning literature, but with adult samples; cheap to pilot in one language. | **S** with device speech, **L** recorded in three languages | Device voices vary; recorded voice needs a speaker per language. |
| **10** | **Parents' and teachers' corner**: what the child is learning, the official Konami videos (option B of §6.6) or a link to Konami's page, privacy notice. | Gives official video a place without putting YouTube in front of children. | **S** | Legal review before embedding. |
| — | **Not recommended:** YouTube inside missions; cutting, dubbing or re-hosting Konami videos; card images or anime stills; timers; streaks; leaderboards; a canvas game engine; Rive before the first test. | §5.2, §6, §7. | | |

**If only one thing is built:** step 1. It can be judged with children in a week, and it decides whether the
direction is right before any art or voice is paid for.

---

## 10. Trade-offs and open questions for the owner

1. **Is "one small board, one new rule per level, no question screens" the direction you want?** It changes the
   pilot's shape more than its content.
2. **May the three quiz questions and the six sorts be replaced**, and the saved "mastery" of the pilot reset
   under a new storage version? (Nobody outside testing has used it yet, as far as the pilot note says.)
3. **Three-zone, 4000 LP board for Junior** (recommended, Konami's Speed Duel shape), or the full five-zone
   board the adult academy draws? The small board is easier to read on a phone; the full board matches what the
   child will see on a real table later.
4. **Video.** Are our own short animated clips (option A) what you meant by "parts of videos", or do you
   specifically want Konami's footage? If the latter: only as an unmodified embed, best kept in an adult corner,
   with no Hebrew, and after legal review (§6).
5. **Is the site commercial in any way** (ads, shop links, paid tier, the duel app's own business)? The COPPA
   reading depends on it (earlier note §12 Q11, still open).
6. **Voice:** none, the device's voice, or recorded? In which language first?
7. **Art.** The geometric characters are enough for the first test. For the rule animations and a rival, who
   draws: you, an illustrator, or generated images (higher look-alike risk)?
8. **Characters that react** (Rive, a paid editor plan and a new tool), or expressive stills moved by code?
9. **Invented cards only, forever?** Children will ask for real cards. Real card images need Konami's permission
   (§6.4). A middle path is real *names* in a text list for parents, to be checked with a lawyer.
10. **The rival duel:** hand-scripted, or on `packages/duel-engine`? The second is more work now and gives free
    play later.
11. **Hebrew:** no official video or terminology exists. Is Hebrew a first-class Junior language (then voice and
    review are needed), or text-only for now?
12. **Can three to five children test step 1?** Still the question that matters most (earlier note §12 Q12).

---

## 11. Unverified / could not confirm

- **Replications of Habgood & Ainsworth 2011.** A search surfaced a thesis (Nidd, Carleton) reporting no support
  for the intrinsic-integration result and a critique about a difficulty confound. Neither was read. The original
  paper's numbers are from its accepted manuscript.
- **Papers read as abstracts only:** Mayer 2019; Mayer & Chandler 2001; Lomas et al. 2013; Deci, Koestner & Ryan
  1999; Hicks et al. 2019; Gathercole et al. 2004; Lazonder & Harmsen 2016 (all via OpenAlex); Höffler & Leutner
  2007 and Slemmons et al. 2018 (via ERIC); Berney & Bétrancourt 2016 (via the Geneva archive page).
  **Sundararajan & Adesope 2020**: only a fragment of the abstract was retrieved; its effect size is not quoted.
  **Brame 2016** ("Effective Educational Videos", DOI 10.1187/cbe.16-03-0125): only the abstract was reachable
  (PMC showed a robot check), so its specific recommendations are not used.
- **Rey et al. 2019** table values: the retention (0.32) and transfer (0.36) figures were read from the results
  text; the extracted table layout was garbled, so the system-paced and learner-paced sub-values are not quoted.
- **Wouters & van Oostendorp 2013**: category effects were read from the extracted Table 4; column alignment was
  imperfect for confidence intervals, which are therefore not quoted. The age mix behind each category was judged
  from the study table (mostly "Col./univ." for modality and personalization), not counted.
- **Age transfer.** Guo et al., Andersen et al., Hicks et al., Mayer & Chandler and most of the modality studies
  are with adults. Applying them to 8–12-year-olds is an inference.
- **Session length, clip length and words per screen for 8–12:** no tested figure found. All numbers in §6.1 and
  §7 are ours.
- **Product onboarding marked [secondary] in §3.5:** Pokémon Battle Academy (official page 404; the official
  rules PDF URL returned HTML), Pokémon TCG Live (not researched), MTG Arena, Hearthstone, Plants vs. Zombies
  (talk exists, not watched), DragonBox. No first-party design write-up was reached for any of them.
- **Speed Duel's three zones per row and absence of Main Phase 2**: from the earlier note (2026-10-11), not found
  in the text extracted from the one-page guide today (the board is a picture).
- **Konami video guidelines page:** read through an automated summary and translation of a Japanese page; one
  Japanese sentence is quoted as returned. A native reading is needed before relying on details. Whether Konami
  has an equivalent policy for other regions was not found.
- **"Made for kids" status of Konami's videos:** not visible in the page data read; `isFamilySafe: true` is a
  different flag.
- **Hebrew captions:** only the presence of Hebrew in YouTube's auto-translation list was seen; no translated
  caption was read. Only "Getting Started" (three uploads) was checked today; the other twelve videos and the
  German, Italian and Spanish uploads were not re-checked.
- **What `youtube-nocookie.com` stores or sends before and after play** (cookies, local storage, IP logging): not
  tested, and YouTube's help page does not say. **How a site "self-designates" as child-directed** with YouTube:
  the help page states the duty; the mechanism's page was not read.
- **What the YouTube player shows when an `end` time is reached**, and current `rel` behaviour: not tested.
- **COPPA 2025 amendments:** the Federal Register page redirected to a block page; the FAQ only says the Rule
  "was amended on April 22, 2025". The FAQ's last 40,000 characters (including the "internal operations"
  answers) were not read.
- **EU cookie-consent rules for embedded video players:** no regulator page that addresses YouTube embeds was
  read (a CNIL page fetched covers audience measurement only). **UK Children's Code:** 403 again.
  **Israeli privacy law:** not researched.
- **Right-to-left mirroring conventions:** Apple's and Material Design's pages returned no content; the list in
  §7 is ours.
- **Rive:** bundle and WebAssembly size, Next.js static-export behaviour and reduced-motion handling are not in
  the pages read. Prices are as shown on 2026-11-17.
- **LottieFiles files:** the licence text was read; whether an individual file's uploader had the rights to it
  cannot be checked from the licence.
- **`motion` at the installed version (14.0.0):** features were read from the current docs, not tested against
  the installed version. "Motion+" contents and price were not read.
- **`packages/duel-engine` with invented cards on a three-zone board:** not assessed; only `package.json`, the
  export list and the head of the onboarding files were read.
- **Rule statements in §4** were written from the earlier notes' subset and general rules knowledge, not
  re-checked line by line against the rulebook today. Each level needs that check when written.
- **Nothing in this note was tried with children.**

---

## Appendix: primary sources consulted (all accessed 2026-11-17)

**Research**
- Habgood & Ainsworth 2011: <https://shura.shu.ac.uk/3556/> (accepted manuscript, full text)
- Wouters & van Oostendorp 2013: DOI 10.1016/j.compedu.2012.07.018 (full text via
  <https://cddoc.uc.cl/wp-content/uploads/2020/03/Metaanalytic_review_rol_instructio.pdf>)
- Andersen et al. 2012: <https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf>
- Rey et al. 2019: DOI 10.1007/s10648-018-9456-4 (full text via a co-author's site,
  <https://maria-wirzberger.de/wp-content/uploads/2019/01/Rey2019_Article_AMeta-analysisOfTheSegmentingE.pdf>)
- Guo, Kim & Rubin 2014: <https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf>
- Shute 2011: <https://myweb.fsu.edu/vshute/pdf/shute%20pres_h.pdf>
- Höffler & Leutner 2007: <https://eric.ed.gov/?id=EJ780451>
- Slemmons et al. 2018: <https://eric.ed.gov/?id=EJ1187565>
- Berney & Bétrancourt 2016: <https://archive-ouverte.unige.ch/unige:92234>
- Via `api.openalex.org` (abstracts): Mayer 2019; Mayer & Chandler 2001; Lomas et al. 2013; Deci, Koestner &
  Ryan 1999; Hicks et al. 2019; Gathercole et al. 2004; Lazonder & Harmsen 2016; Brame 2016

**Konami**
- <https://www.yugioh-card.com/eu/play/speed-duel-beginners-guide/> and
  <https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Speed_Duel_Guide_EN.pdf>
- <https://www.yugioh-card.com/eu/product/yu-gi-oh-tcg-2-player-starter-set/>
- <https://www.yugioh-card.com/en/rulebook/>
- <https://www.konami.com/yugioh/guide/movieguideline>
- YouTube watch pages and oEmbed for `WnEM6gaIYvo`, `orVzLmJhi2c`, `fDEC9t9tYw8`

**YouTube / Google / FTC**
- <https://www.youtube.com/static?template=terms>
- <https://developers.google.com/youtube/player_parameters>
- <https://developers.google.com/youtube/terms/developer-policies>
- <https://support.google.com/youtube/answer/171780>, <https://support.google.com/youtube/answer/9527654>
- <https://developer.chrome.com/docs/lighthouse/performance/third-party-facades>
- <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>
- <https://www.ftc.gov/news-events/news/press-releases/2019/09/google-youtube-will-pay-record-170-million-alleged-violations-childrens-privacy-law>

**Products**
- <https://www.chesskid.com/learn/lessons>,
  <https://support.chesskid.com/en/articles/8858305-what-s-the-difference-between-chesskid-and-chess-com>
- <https://blog.duolingo.com/what-is-implicit-learning/>
- <https://www.khanacademy.org/kids>
- <https://www.youtube.com/watch?v=fbzhHSexzpY> (existence and title only), <https://www.gdcvault.com/play/1020775>
  (listing only)

**Animation tools**
- <https://github.com/motiondivision/motion/blob/main/LICENSE.md>, <https://motion.dev/docs/react-animation>
- <https://github.com/airbnb/lottie-web/blob/master/LICENSE.md>,
  <https://github.com/LottieFiles/dotlottie-web/blob/main/LICENSE>, <https://lottiefiles.com/page/license>
- <https://github.com/rive-app/rive-wasm/blob/master/LICENSE>, <https://github.com/rive-app/rive-react>,
  <https://rive.app/pricing>, <https://rive.app/docs/runtimes/react/react>
- <https://github.com/catdad/canvas-confetti>, <https://github.com/goldfire/howler.js>,
  <https://github.com/pixijs/pixijs>, <https://github.com/phaserjs/phaser>
- npm registry `latest` records for `motion`, `lottie-web`, `@lottiefiles/dotlottie-react`,
  `@lottiefiles/dotlottie-web`, `@rive-app/react-canvas`, `@rive-app/react-webgl2`, `canvas-confetti`, `howler`

**Repository files read**
- `docs/research/kids-interactive-academy.md`, `docs/research/beginner-training-matches.md` (§2),
  `docs/academy-junior-pilot.md`, `docs/academy-french-terminology.md`, `docs/video-to-see.md`
- `apps/academy-ygo/src/lib/junior/{flow,mission1}.ts`, `apps/academy-ygo/src/components/junior/{mission-one,mission-art,choice-step}.tsx`
- `packages/duel-engine/package.json`, `packages/duel-engine/src/index.ts`
- `apps/duel-nextjs/src/client/onboarding/{videos,lessons,spotlight}.ts`, `apps/duel-nextjs/src/client/training/scripted-bot.ts` (headers)
