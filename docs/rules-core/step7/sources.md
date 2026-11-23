# Step 7 sources

Read 2026-11-23. Konami is primary; Japanese database notes are OCG-only evidence, explicitly marked. No third-party engine/script sources used.

## Rulebook v10

https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf

- Printed pp.4–5: Main Monster and Spell/Trap rows each hold five. “Normally, each player can only use 1 of these zones” (the two shared Extra Monster Zones). Field: “Each player can have 1 Field Spell Card on their own side of the field. To use another Field Spell, send your previous one to the Graveyard.” Field Spells do not count toward the five S/T limit.
- pp.12–15: “When two Link Monsters have red arrows that point at each other, they are ‘co-linked’.” Link Summon to the Extra Monster Zone or “one of your Main Monster Zones that another Link Monster is pointing to.” Arrows and zone coordinates follow the printed board diagram. Monsters revived from GY/banishment go to Main Monster Zones. A monster taken from the opponent's Extra Monster Zone moves to your Main Monster Zone; on return it goes to their Main Monster Zone.
- pp.16–17: Pendulum activation uses the leftmost/rightmost S/T Zones, which also become Pendulum Zones. “Whenever one of your Pendulum Monster Cards on the field (regardless of which Zone it is in, or even if it is a monster or not) would be sent to the Graveyard, place it face-up on your Extra Deck instead.” Extra Deck Pendulum Summons need Extra Monster or linked Main zones.
- pp.28–29: Equip Spells remain in a S/T Zone and affect one face-up monster (either player's, depending on the card). “If the equipped monster is destroyed, flipped face-down, or removed from the field, its Equip Cards are destroyed.” Field Spells stay in the Field Zone; they may be Set there and do not apply until face-up.

## Current Extra Deck rule (supersedes RB10)

https://www.yugioh-card.com/en/play/2021_rules_update/

This published rules update incorporates the 2020 revision: “Fusion, Synchro, and Xyz Monsters can be first Summoned from the Extra Deck to any of your Main Monster Zones.” Extra Monster Zones remain optional for them. “The restrictions requiring an Extra Monster Zone or Link Monster pointing still apply to Link Monsters and Pendulum Monsters that are Summoned from the Extra Deck.” Read live and in the earlier local Konami capture. Guessed 2020 URL variants returned 404; use this authoritative current text, not an invented 2020 URL.

## Infinite Impermanence

TCG card text and French text: cid 13631, existing source records. Notes (OCG only, updated 2021-05-15):
https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13631&request_locale=ja

- “対象のモンスターの効果を無効にすることに成功し、このカードが魔法＆罠ゾーンに存在し、かつセットされているこのカードを発動していた場合” — successful monster negation, this card remains in S/T and was activated from Set are all required.
- “その適用の時点でのこのカードの位置を参照して無効化する縦列が決まります” — column determined at application, not activation.
- “適用後、このターン中にその縦列に魔法・罠カードが存在する場合（存在するようになった場合）、その効果は無効化されます” — includes cards arriving later that turn.

Wonder Wand Q&A, OCG only, fid 21698, updated 2022-12-30:
https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=21698&request_locale=ja

“同じ縦列で発動した魔法・罠の効果の発動の際の効果も無効化されます” — not only card activations, also S/T effect activations. Wonder Wand sends itself as cost but its effect is still negated because it activated in that S/T column.

## YGOProJudge leads (not source records)

Direct partner API, one session per question, closed afterwards; answers gave no usable Konami citation. Existing completed answers re-read from `/tmp/ans-column.txt` and `/tmp/ans-imp.txt`; new answers `/tmp/ans-zone-control.txt`, `/tmp/ans-extra-link.txt`, `/tmp/ans-pend.txt`, `/tmp/ans-equip.txt` (session scratch, not kept in the repo).

- Columns include aligned Main/S/T zones and the Extra Monster Zones in columns 2/4; not Field Zones. Mirror the opponent's left/right. Column interpretation is judge-backed in addition to the rulebook board diagram.
- Impermanence column follows its location at application, lingers after it leaves, affects future arrivals and self-sending S/T costs. Confirmed by the Konami notes/Q&A above.
- Control return with full Main zones destroys by game mechanics, not by card effect. Equip remains with the same physical monster across control change, unless its text now forbids that target. No Konami source yet for these two details; do not imply otherwise.
- Second shared Extra Monster Zone requires an incoming Link to complete a mutually co-linked path to the first. Opponent arrows can grant own Main zones; an Extra Link path may include opponent-controlled monsters. The judge's example confusingly mentions an occupied opponent EMZ; implementation must still enforce physical occupancy. Extra Link path exception remains judge-only until a primary text is read.

- A Pendulum Monster whose activation as a Spell is negated (Solemn Judgment) goes to the Graveyard, not the Extra Deck: it never was on the field; a destroyed one in the Monster Zone goes face-up to the Extra Deck. Consistent with the existing Konami record `negated-card-not-from-field`.
- An Equip Spell whose target left or turned face-down before it resolved equips nothing and is sent to the Graveyard after the chain by the game's rules, not destroyed.

## Card data

Link Spider (cid 13034): the English page gives "Link 1"; its one arrow (bottom) is read from Konami's card image on that page (ATK 1000).

## Scope boundaries

Step 8 owns material/procedure legality and Pendulum Summon mechanics; step 11 owns monsters treated as Equips/Continuous Spells, Tokens and counters. Existing battle timing limitations are not silently fixed here.
