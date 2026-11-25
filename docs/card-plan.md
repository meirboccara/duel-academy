# Card plan

The card half of the wayfinder map "Meta decks playable under full tournament rules" (meirboccara/duel-academy#1),
decided in its ticket "Card plan: order of staples and masters' decks" (#21). The engine half is
[rules-core-spec.md](./rules-core-spec.md); cards are written on the new rules core only.

**Inputs.**
- Coverage notes per deck: `docs/research/*-coverage-2026-11.md`.
- Master pools: wayfinder tickets #7 and #20.
- Rotation rules: ticket #8.
- Definition of done for a card: ticket #9.

## Rules for every card

- A card is written only once the rules-core steps its mechanics need have landed. It must meet the definition of done:
  - tests per printed effect and per applicable ruling, each citing a source record;
  - a coverage check;
  - French text from YGOResources by Konami card id;
  - review by a different model.
- Cards stay exactly as printed. The one exception is Jaden's Academy builds, where every swap is recorded.
- Sonnet writes cards. Opus reviews, and decides when a card needs Fable.

## Wave 1: shared staples (after rules-core steps 2–4)

1. **Hand traps rewritten to the full definition of done:** Ash Blossom & Joyous Spring, Droll & Lock Bird, Ghost Ogre & Snow Rabbit, Mulcharmy Fuwalos, Effect Veiler, Infinite Impermanence.
2. **Missing staples:** Mulcharmy Purulia, Typhoon, Hey, Space Trunade!, Pot of Sloth, Skull Meister.
3. **After step 5 (negation):** Nibiru, the Primal Being, Solemn Accusation, Solemn Judgment, Solemn Warning.
4. **After steps 7–8 (zones, procedures):** S:P Little Knight, The Great Gallant Bandit, Super Polymerization, and the other generic Extra Deck staples named in the coverage notes.

## Wave 2: the masters' decks (after rules-core step 8), in this order

| # | Deck | Master | Mainly needs |
|---|---|---|---|
| 1 | Blue-Eyes | Kaiba | step 8 |
| 2 | Elemental HERO (Academy builds) | Jaden | step 8, Fusion |
| 3 | Dark Magician Light and Darkness Ritual | Atem | step 8, Ritual |
| 4 | Dark Magician | Arkana (red art, by the deck's picture choice) | shares cards with Atem |
| 5 | Shining Sarcophagus | Yugi | shares cards with Atem |
| 6 | Stardust Synchro | Yusei | step 8, Synchro |
| 7 | Toon | Pegasus | |
| 8 | Sacred Beast | Marik | |
| 9 | Unchained | Bakura | |
| 10 | Umi (Beyond the Brave) | Mako | |
| 11 | Fire King | Rex | |
| 12 | Dark Time Wizard | Joey | step 11 |
| 13 | Beetrooper | Weevil | step 11 |
| 14 | Branded Dracotail, Sky Striker, Radiant Typhoon, Artmage, Angelechy, Branded, Elfnote | Solomon Muto | Angelechy and Radiant Typhoon need step 11 |

**Step 11, special board objects:** Tokens, counters, dice, monsters as Equip Cards, and monsters as Continuous Spells.
Its monster-equip subset is brought forward when exact Blue-Eyes/Sky Striker consumers need it; the remaining work stays in the existing rules-core step.

## When a master switches

- A master keeps today's deck until **2 lists** of their pool are fully done. The other lists join as they are
  finished.
- **Solomon Muto** appears once **2 of his 7 archetypes** are done, with 2 complete lists each. Each further archetype
  joins his random draw when it is finished.

## Combo data for the bot

Each deck's combo data (its main line and the alternatives for common interruptions) is written right after its cards
are done and before its master switches. Sonnet writes it and Opus reviews it. Each level uses it as follows:

| Level | Combo data used |
|---|---|
| basic | none |
| medium | the main line |
| strong | the main line plus the alternatives |
| expert | everything, plus determinized sampling |

## Exact-list completion inventory

See the [single rules-core checklist](./rules-core-spec.md#real-deck-completion-checklist-bounded-work-started-2026-11-24).
The manifest in `packages/rules/src/deck-manifests.ts` is authoritative for counts and provenance, not a playable deck.
Below, **registered** means only present in the new core; every unchecked row still owes complete printed identity,
all effect/ruling tests, French text, independent review and integration. **Missing** means no new-core definition.
Side inventories stay in the manifest separately and are not scripting targets. No old-engine coverage is credited.

| Complete | Exact Main/Extra name | New-core state |
|---|---|---|
| [x] | Ancient Fairy Life Dragon | Registered 2026-11-24; Synchro procedure, draw or World of Spirits search, Defense Position attack permission, EN/FR text, Konami's notes and its three Q&A (fids 24407, 23968, 14252); independent review pending |
| [ ] | Ash Blossom & Joyous Spring | Registered; answers draw effects since 2026-11-24 (Konami Q&A fid 21685); printed facts incomplete, completeness pending |
| [x] | Bingo Machine, Go!!! | Registered 2026-11-24 to the definition of done: reveal 3, the opponent's random pick (the Duel's RNG), shuffle, once per turn; the minimum of 3 revealable cards rests on YGOProJudge only; its one Q&A (Puppet Queen, not in the core) not opened |
| [x] | Blue-Eyes Spirit Dragon | Registered 2026-11-25; Synchro procedure with "Blue-Eyes" non-Tuners, the lock on Special Summoning 2+ monsters at once, the negation of a GY effect (also in the Damage Step, `damageStep`), the Tribute that Special Summons a LIGHT Dragon Synchro Monster in Defense Position and destroys it in the End Phase, EN/FR text, Konami's notes and 11 of its 18 Q&A (4 pending: cards the core lacks; 7 not opened); independent review pending |
| [x] | Blue-Eyes Tyrant Dragon | Registered 2026-11-25; Fusion and Tribute Summoning conditions, unaffected by Trap Cards/effects, attacks all monsters, the Set effect from the field, the GY and banishment, EN/FR text, Konami's notes and the 7 Q&A about its clauses (2 pending: Noble de Noir, Lifeline); built for it: `Once.acrossMoves`, `attackedNow` needs no damage calculation; independent review pending |
| [x] | Blue-Eyes Ultimate Spirit Dragon | Registered 2026-11-25; Synchro procedure (2+ Tuners), the GY banish lock, the negation with the ATK gain (also in the Damage Step), the Special Summon from the GY or banishment, EN/FR text, Konami's notes and its 2 Q&A (1 pending: Magical Bullet); independent review pending |
| [x] | Blue-Eyes White Dragon | Registered 2026-11-24; complete (Normal Monster: printed facts, Konami's flavour text EN/FR; no effect) |
| [x] | Blue-Eyes White Dragon, the White Phantom Beast | Registered 2026-11-24; all three effects (hand trigger, destroy and attack lock, Quick negation), EN/FR text, Konami's notes; Q&A fid 276 (Draw Phase draw) pending a normal draw in the core; independent review pending |
| [x] | Bystial Magnamhut | Registered 2026-11-24; both effects (Ignition and Quick from the hand, End Phase add), EN/FR text, Konami's notes and Q&A fid 22474; independent review pending |
| [x] | Crimson Dragon | Registered 2026-11-24; Synchro procedure, search, Quick return and Summon treated as a Synchro Summon, EN/FR text, Konami's notes and Q&A fid 12750; the return and the Summon are two moves in sequence (candidates read before the return), the notes' simultaneity being otherwise respected; independent review pending |
| [x] | Deep-Eyes White Dragon, the Blue Abyss | Registered 2026-11-24; all effects, EN/FR text, Konami's notes; Q&A fid 24303 pending effective names (Blue-Eyes Alternative White Dragon); banished-when-returned is YGOProJudge only; independent review pending |
| [x] | Dominus Purge | Registered 2026-11-24; hand activation, negation with destruction and the lock, EN/FR text, Konami's notes and three Q&A; fid 24299 (monsters with several Attributes) pending; independent review pending |
| [ ] | Droll & Lock Bird | Registered; completeness pending |
| [ ] | Ecclesia and the Dark Dragon | Missing |
| [x] | Effect Veiler | Registered; complete (printed facts, Konami texts, one test per clause and ruling) |
| [x] | Ghost Ogre & Snow Rabbit | Registered; complete (printed facts, Konami texts, one test per clause and ruling) |
| [x] | Hieratic Seal of the Heavenly Spheres | Registered 2026-11-24; Link procedure, Quick Tribute and return, Tributed trigger from the GY or banishment, EN/FR text, Konami's notes and Q&A fids 21579, 21580, 24070 (its other three Q&A were not opened); the scope of "once per opponent's turn" is YGOProJudge only; independent review pending |
| [ ] | Infinite Impermanence | Registered; completeness pending |
| [x] | Lightning Storm | Registered; complete (printed facts, Konami texts, one test per clause and ruling; YGOProJudge-only choices labelled) |
| [x] | Lightstorm Dragon | Registered 2026-11-24; Synchro procedure, destruction of Spells/Traps by target count, Set from the GY from the GY or banishment, EN/FR text, Konami's notes (no Q&A exists); how long the activation restriction follows the Set card is YGOProJudge only; independent review pending |
| [x] | Maiden of White | Registered 2026-11-24 to the definition of done: all three effects (place True Light, revive from the GY, Quick Effect when targeted or attacked), EN/FR text, Konami's notes, Q&A fid 24051; Q&A fids 14540 and 56 pending (Macro Cosmos-like effect, Alternative White Dragon); a free Spell & Trap Zone for the first effect rests on YGOProJudge only |
| [x] | Majesty of the White Dragons | Registered 2026-11-24; both effects, EN/FR text, Konami's notes; the Graveyard effect's Spell Speed 2 is YGOProJudge only; independent review pending |
| [x] | Mausoleum of White | Registered 2026-11-24 to the definition of done: all three effects, EN/FR text, Konami's notes, Q&A fid 18125; Q&A fids 18128, 18129, 24288 pending (Macro Cosmos-like effect, Double Summon, Gimmick Puppet - Fantasy Machina) |
| [x] | Mulcharmy Fuwalos | Registered; complete (printed facts, Konami texts, one test per clause and ruling; YGOProJudge-only choices labelled) |
| [x] | Mulcharmy Purulia | Registered; complete (printed facts, Konami texts, one test per clause and ruling; YGOProJudge-only choices labelled) |
| [ ] | Mystical Space Typhoon | Registered; completeness pending |
| [x] | Neo Blue-Eyes Ultimate Dragon | Registered 2026-11-25; Fusion procedure, the attack-again effect (twice per turn, the cost, the only face-up card), the GY Quick Effect negate-and-destroy (also in the Damage Step), EN/FR text, Konami's notes and 4 of its 7 Q&A (2 pending: Wonder Clover, Matter Transporter); independent review pending |
| [x] | Pot of Prosperity | Registered 2026-11-24; cost, halved damage, excavation, oath, EN/FR text, Konami's notes and Q&A (fids 9932, 17846, 23378, 23511); independent review pending |
| [ ] | Pot of Sloth | Missing |
| [x] | Primite Dragon Ether Beryl | Registered 2026-11-24; all three effects, EN/FR text, Konami's notes; the Standby Phase effect is offered once at the start of the phase (L2); independent review pending |
| [x] | Primite Drillbeam | Registered 2026-11-24; both effects, EN/FR text, Konami's notes and both Q&A; negating the effect of a Spell it is chained to is YGOProJudge only (R3); no Tokens in the core; independent review pending |
| [x] | Primite Lordly Lode | Registered 2026-11-24; all three effects, EN/FR text, Konami's notes and Q&A (fids 10803, 24080; 12551 pending Tokens); independent review pending |
| [ ] | Prototype Sky Striker Ace - Amatsu | Missing |
| [x] | Psychic End Punisher | Registered 2026-11-25; Synchro procedure, unaffected by the opponent's activated effects while its LP are not higher, the 1000 LP banishment of 2 targets, the Battle Phase ATK gain, EN/FR text, Konami's notes and 3 of its 8 Q&A (1 pending: Super Polymerization); independent review pending |
| [ ] | Radiant Typhoon Vision | Missing |
| [x] | Raigeki | Registered; complete (printed facts, Konami texts, one test per clause and ruling; Konami sources only) |
| [x] | Roar of the Blue-Eyed Dragons | Registered 2026-11-24; both effects and the shared use, EN/FR text, Konami's notes; independent review pending |
| [ ] | S:P Little Knight | Missing |
| [x] | Sage with Eyes of Blue | Registered 2026-11-24 to the definition of done: both effects, EN/FR text, Konami's notes; Q&A fid 18319 pending (Phantom Knights' Dark Gauntlet); which effect the once per turn limits (the second only) rests on YGOProJudge only |
| [ ] | Sky Striker Ace - Azalea | Missing |
| [ ] | Sky Striker Ace - Hayate | Missing |
| [ ] | Sky Striker Ace - Kagari | Missing |
| [ ] | Sky Striker Ace - Raye | Missing |
| [ ] | Sky Striker Ace - Roze | Missing |
| [ ] | Sky Striker Ace - Shizuku | Missing |
| [ ] | Sky Striker Ace - Zeke | Missing |
| [ ] | Sky Striker Ace = Zero | Missing |
| [ ] | Sky Striker Mecha - Shark Cannon | Missing |
| [ ] | Sky Striker Mecha - Widow Anchor | Missing |
| [ ] | Sky Striker Mobilize - Engage! | Missing |
| [ ] | Sky Striker Mobilize - Linkage! | Missing |
| [ ] | Sky Striker Special Maneuver - Lemnisgate! | Missing |
| [x] | Spirit with Eyes of Blue | Registered 2026-11-24; Link procedure, Special Summon lock, Mausoleum of White take, Tribute Summon with the Effect Monster restriction, EN/FR text, Konami's notes; its two Q&A are about True Light (not applicable); activating only with a Dragon "Blue-Eyes" monster and Summoning a non-Dragon after the Tribute are YGOProJudge only; independent review pending |
| [x] | Stardust Sifr Divine Dragon | Registered 2026-11-25; Synchro procedure (Synchro Monsters only), Must be Synchro Summoned, the first-time destruction protection, the negation of a monster effect with a destruction, the GY Special Summon, EN/FR text, Konami's notes and 13 of its 15 Q&A (3 pending: already-negated effect, Blue-Eyes Jet Dragon, Forbidden Chalice); built for it: a card keeps its "first time" use when turned face-down, two such protections apply once; independent review pending |
| [x] | Super Starslayer TY-PHON - Sky Crisis | Registered 2026-11-25; Xyz procedure and the alternative Xyz Summon (highest ATK, transfer, no Summon afterwards), the lock on monsters with 3000+ ATK (on the field: YGOProJudge only), the detach-and-return effect, EN/FR text, Konami's notes and its 2 Q&A (the Token ruling is pending: the core has no Tokens); independent review pending |
| [ ] | The Dragon that Devours the Dogma | Missing |
| [ ] | The Fallen & The Virtuous | Missing |
| [x] | True Light | Registered 2026-11-24 to the definition of done: protection, destruction trigger, activation alone / with its effect / Ignition Effect, EN/FR text, Konami's notes, Q&A fids 23374 and 23215; the other six Q&A entries are about cards the core does not have (titles read only) |
| [x] | Upstart Goblin | Registered; complete (printed facts, Konami texts, one test per clause and ruling; YGOProJudge-only choices labelled) |
| [x] | Wishes for Eyes of Blue | Registered 2026-11-24 to the definition of done: both effects, EN/FR text, Konami's notes; its one Q&A (fid 23815) pending a "banished instead of sent to the GY" effect; tests use made-up "Blue-Eyes" cards until the real ones exist; independent review pending |
