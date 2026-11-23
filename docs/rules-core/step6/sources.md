# Step 6 sources (continuous effects, ATK/DEF order, negation, locks)

Read on 2026-11-23, one page at a time (3 s pauses), no 403 met (one 404 on a guessed URL, `yugioh-card.com/japan/rules/`, not retried
with variants). Saved pages: `/private/tmp/claude-501/step6/pages/` (`*.txt` text, `*.html` raw). No GPL source opened.
Kinds follow `src/sources.ts`: `tcg-rule`, `card-text`, `jp-qa` (cid + fid), `jp-notes` (cid, the 補足情報 block, dated).
Japanese Q&A is OCG-only, accepted by the owner for the ATK/DEF order (decision 1), as in step 5. The date after "page date" is
the 更新日 / 補足情報 date shown on Konami's page, not a read date.

## What Konami says, in one paragraph

Konami has **no single "攻撃力の計算順序" page** that we could find (the database searches by card name only; search engines returned
nothing). The order is only visible through card Q&A. Six Q&As and two notes give a consistent picture:
1. A card's **original ATK** is the printed one; an effect can change it (Shrink, Megamorph, Apollousa). Changes of the original ATK
   come first; gains and losses (Osiris's own gain, Apollousa's -800s) are then **recomputed on top** whatever their age.
2. An effect that **sets** ATK ("becomes", Sacrifice, Reptilianne Gorgon, Gale) and an effect that **changes the original ATK**
   fight by **timestamp**: the later one wins (Sacrifice/Megamorph, both orders; Gorgon then Shrink = half the original).
3. A **continuous** effect that is overridden comes back when the later one stops applying (Sacrifice's 2500 when the LPs are equal).
   A **resolved, lasting** one does not seem to (Gale then Shrink: when Shrink ends, "back to the original value"). Mismatch to settle
   in the design (D2 in design.md).
4. A **negated** monster loses only its continuous effects while it is in the Monster Zone; effects activated elsewhere (Graveyard)
   are untouched; it can still activate effects, which are negated; when the negator goes, the continuous effect applies again.
5. Locks that apply for a turn ("neither player can...") stop the **result**, not the activation, for draws; Konami lists which cards
   can still be activated.

## Records

Ids are proposals for `src/continuous-sources.ts` (the same shape as `negation-sources.ts`). Quotes are copied from the saved pages.

### Order of ATK/DEF changes

- **atk-original-glossary** (`tcg-rule`) RB10 PDF, Glossary, "Original ATK (or DEF)", PDF p. 30
  <https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf>, read 2026-11-23.
  "The Original ATK (or DEF) is the number of ATK (or DEF) points printed on the Monster Card. This does not include an increase from an Equip Spell Card or other card effect."
- **continuous-effect-definition** (`tcg-rule`) RB10, "Continuous Effect", PDF p. 7 (same URL).
  "This effect is active while the Effect Monster Card is face-up on the field. The effect starts when the face-up monster appears on the field, and ends once that monster is gone or is no longer face-up; there is no trigger for its activation."
  (Basis for "register when face-up on the field, unregister when it leaves or turns face-down", and for the timestamp = when it starts applying.)
- **continuous-effect-wording** (`tcg-rule`) PSCT part 6, Bountiful Artemis and Vision HERO Trinity
  <https://www.yugioh-card.com/en/play/psct/psct-6/>, read 2026-11-23.
  "Artemis has been confusing players for years, but now it's clearly a Continuous Effect (hint: no colon or semicolon)." and
  "During the turn this card was Fusion Summoned, its ATK is double its original ATK. ... These effects are all Continuous!"
  (An ATK effect with a duration and "original ATK" in a continuous effect; no order stated.)
- **shrink-notes** (`jp-notes`, cid 5355 Shrink 収縮, page date 2022-04-29)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=5355&request_locale=ja>
  "■この効果の適用後、対象のモンスターの攻撃力が他の効果によってアップまたはダウンする場合、その攻撃力の数値は再計算されます。（元々の攻撃力が半分になったうえで、他の効果よる攻撃力のアップまたはダウンが計算されます。）"
- **shrink-then-own-gain** (`jp-qa`, cid 5355, fid 11906, Osiris the Sky Dragon, page date 2017-03-24)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=11906&request_locale=ja>
  "「収縮」の効果によって元々の攻撃力の半分の数値になった後、「オシリスの天空竜」の『このカードの攻撃力・守備力は自分の手札の数×１０００ポイントアップする。』効果が適用される為、結果的に「オシリスの天空竜」の数値は『自分の手札の数×１０００ポイントアップ』した数値になります。また、「収縮」の効果が適用されなくなった後も、...攻撃力は『自分の手札の数×１０００ポイントアップ』した数値になります。" (and it follows the hand size while Shrink applies).
- **shrink-recomputes-losses** (`jp-qa`, cid 5355, fid 22612, Apollousa, page date 2022-12-30)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=22612&request_locale=ja>
  "（元々の攻撃力が3200の半分の1600となりますので、その数値に、『このカードの攻撃力を８００ダウンし、その発動を無効にする』効果によってダウンする攻撃力が加わり、フィールドにて適用される攻撃力の数値は0となります。）" and
  "なお、「収縮」の効果の適用がなくなった場合には、『②：このカードの元々の攻撃力は、このカードのリンク素材としたモンスターの数×８００になる』モンスター効果による元々の攻撃力の適用がなくなります。" (the two original-ATK effects: the later replaces, and when Shrink ends the older one does **not** come back: original ATK 0.)
- **shrink-original-zero** (`jp-qa`, cid 5355, fid 9588, Ra, page date 2017-03-24)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=9588&request_locale=ja>
  "元々の攻撃力「0」が半分になり、その後、自身の効果によるアップした数値が適用され、攻撃力は6000になります。"
- **set-then-shrink** (`jp-qa`, cid 5355, fid 8976, Reptilianne Gorgon, page date 2017-03-24)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=8976&request_locale=ja>
  "「レプティレス・ゴルゴーン」の効果によって攻撃力が0になっているモンスターが、「収縮」の効果を受ける場合、攻撃力はカードに記載されている元々の攻撃力の半分の数値になります。したがって、例の場合、「青眼の白龍」の攻撃力は、元々の攻撃力の半分である1500になります。" (a later change of the original ATK beats an earlier "becomes 0".)
- **set-then-shrink-ends** (`jp-qa`, cid 5355, fid 7944, BF - Gale the Whirlwind, page date 2017-03-24)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=7944&request_locale=ja>
  "攻撃力は元々の攻撃力を半分にした数値になります。また、「収縮」の効果が適用されなくなった場合、攻撃力の数値は、元々の数値に戻ります。" (a lasting "halved" effect applied earlier does not return when Shrink ends.)
- **megamorph-notes** (`jp-notes`, cid 4663 Megamorph 巨大化, page date 2022-04-23)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4663&request_locale=ja>
  "■魔法＆罠ゾーンで適用するチェーンブロックの作られない効果です。■装備モンスターに適用され続ける効果です。...■この効果が適用されている間に、『自分のLPが相手より少ない場合』『自分のLPが相手より多い場合』の状況が変化した場合には、この効果によって適用される攻撃力の数値も変化します。" (A continuous effect is a query over the board, re-read each time: no stored value. Equip: step 7.)
- **set-vs-original-later-wins-a** (`jp-qa`, cid 4663, fid 6156, Sacrifice with Megamorph first, page date 2019-03-18)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=6156&request_locale=ja>
  "『このカードの攻撃力・守備力は、このカードの効果で装備したモンスターのそれぞれの数値になり...』モンスター効果が適用されますので、攻撃力は2500・守備力は2100の状態となります。その後に、自分や相手のライフポイントが変化し...「サクリファイス」の攻撃力や守備力が変化する事はありません。"
- **set-vs-original-later-wins-b** (`jp-qa`, cid 4663, fid 113, Sacrifice first, Megamorph later, page date 2019-03-18)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=113&request_locale=ja>
  "『自分のLPが相手より少ない場合、装備モンスターの攻撃力は元々の攻撃力の倍になる』処理または、『自分のLPが相手より多い場合、...半分になる』処理が適用される間は、「サクリファイス」の元々の攻撃力となる0の状態になりますが、自分と相手のライフポイントが同じ間は、装備されている「ブラック・マジシャン」の攻撃力となる2500の状態になります。" (the older continuous "set" comes back when the newer one stops changing anything: both continuous.)
- **atk-read-at-damage-calculation** (`jp-qa`, cid 5355, fid 17944, Tsukumo Slash... Shrink before damage calculation, page date 2017-03-24) -- for the battle step
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=17944&request_locale=ja>
  "「九十九スラッシュ」はダメージ計算時の時点で、攻撃を行っている自分のモンスターよりも、相手モンスターの攻撃力の方が高い状態であれば、発動する事ができます。"
- **chain-atk-changed-before-resolution** (`jp-qa`, cid 5355, fid 11906's neighbour, Bottomless Trap Hole, **fid 10738**, page date 2017-03-24) -- the ATK is read when the effect resolves
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=10738&request_locale=ja>
  "「奈落の落とし穴」の効果処理時に、召喚・反転召喚・特殊召喚を行ったモンスターの攻撃力が1500未満になっていた場合、そのモンスターを破壊してゲームから除外する事はできません。" (Filed under Shrink's list; a condition on ATK is read at resolution.)

### Negated card's continuous effects

- **skill-drain-text** (`card-text`, cid 5740 Skill Drain; EN and FR read 2026-11-23)
  EN: "Activate this card by paying 1000 LP. Negate the effects of all face-up monsters while they are face-up on the field (but their effects can still be activated)."
  FR: "Activez cette carte en payant 1000 LP. Annulez les effets de tous les monstres face recto tant qu'ils sont face recto sur le Terrain (mais leurs effets peuvent toujours être activés)."
  <https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5740&request_locale=en> (and `fr`)
- **skill-drain-notes** (`jp-notes`, cid 5740, page date 2020-04-01)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=5740&request_locale=ja>
  "■この効果によってモンスターの効果が無効化されている限り、そのモンスターが持つチェーンブロックの作られない効果はモンスターゾーンでは適用されません。" and
  "■モンスターがモンスターゾーンで効果を発動した処理時に、そのモンスターがモンスターゾーンに表側表示で存在し、そのモンスターにこの効果が適用されている場合、その処理は行われません。"
  and "■モンスターがモンスターゾーンで効果を発動した処理時に、そのモンスターがモンスターゾーンに表側表示で存在しなくなった場合、そのモンスター効果は無効化されず、処理は行われます。" (the `Link.effectNegated` of step 5 matches the first; the last is a new edge: the negation is read at resolution on the card **as it is then**, off the field = not negated.)
- **negation-reaches-continuous** (`jp-qa`, cid 13631 Infinite Impermanence, fid 8398, page date 2025-12-24) (already cited in step 5 as `impermanence-only-monster-zone`; re-read today)
  "「無限泡影」の効果によって無効化される効果は、モンスターゾーンで発動する効果と、モンスターゾーンに存在する限り適用される永続効果のみとなります。"
- **negated-floodgate-returns** (`jp-qa`, cid 5740, fid 7965, page date 2025-11-27)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=7965&request_locale=ja>
  "（「D-HERO Bloo-D」がモンスターゾーンから離れますと「虚無魔人」の効果が再び適用され、モンスターを特殊召喚できなくなりますので、相手は「D-HERO Bloo-D」を素材に含めて融合召喚できません。）" and, for a negated floodgate: "（A）できません。（「黒魔女ディアベルスター」を特殊召喚する場合、墓地へ送るカードとして「スキルドレイン」以外のカードを墓地へ送る必要があります。）"
  (A negated "neither player can Special Summon" is off; it is back the moment the negator is gone, even inside a procedure. Step 8 owns the "inside a procedure" part.)
- **negated-name-effect** (`jp-qa`, cid 5740, Harpie Queen, fid 6646, page date 2017-03-24)
  "「ハーピィ・クィーン」がフィールド上に表側表示で存在する場合、「スキルドレイン」の効果によって効果が無効化される為、「ハーピィ・クィーン」として扱います。また、...墓地に存在する「ハーピィ・クィーン」は「ハーピィ・レディ」として扱われます。" (A continuous effect that changes name/type/etc. also stops: **same list covers Level, Attribute**; it works on the field only.)
- Step 5's `negated-monster-state` (Impermanence notes: negation ends when turned face-down) stays as is.
- **rivalry-negated** (`tcg-rule`, Konami TCG "Card FAQ: Rivalry of Warlords & Gozen Match")
  <https://www.yugioh-card.com/en/play/card-faq-1/>, read 2026-11-23.
  "Also, if Rivalry/Gozen is being negated, you can Summon monsters of any Type/Attribute. If it stops being negated, you have to send monsters to the Graveyard until you control only 1 Type/Attribute again, just like if Rivalry/Gozen had just resolved."
  (A TCG page, not OCG: a floodgate that is negated is off, and when negation ends it is applied again, with its on-start clean-up.)

### Locks and floodgates

- **droll-text** (`card-text`, cid 9279 Droll & Lock Bird; EN, FR read 2026-11-23)
  EN: "If a card(s) is added from the Main Deck to your opponent's hand, except during the Draw Phase (Quick Effect): You can send this card from your hand to the GY; for the rest of this turn, cards cannot be added from either player's Main Deck to the hand."
  FR: "Si une ou plusieurs cartes sont ajoutées depuis le Main Deck à la main de votre adversaire, sauf durant la Draw Phase (Effet Rapide) : vous pouvez envoyer cette carte depuis votre main au Cimetière ; le reste de ce tour, les cartes ne peuvent pas être ajoutées depuis le Main Deck de chaque joueur à la main."
  <https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=9279&request_locale=en> (and `fr`). Konami's English page also lists it as "Limited".
- **droll-notes** (`jp-notes`, cid 9279, page date 2021-02-06; the OCG text differs: "自分・相手ターンに、相手がドローフェイズ以外で...", i.e. it also works in either turn; the TCG text above has no turn limit either)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=9279&request_locale=ja>
  "■手札で発動できる誘発即時効果です。■相手がドローフェイズ以外でデッキからカードを手札に加えた場合に発動できます。（チェーン処理中に相手がカードを手札に加えた場合には、その一連のチェーン処理後に発動できます。）■ダメージステップ中には発動できません。"
- **droll-lock-draws-fail** (`jp-qa`, cid 9279, fid 12797, page date 2025-03-30)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=12797&request_locale=ja>
  "発動できます。ただし、その効果によってドローする状況になった際には、実際にカードをドローすることはできません。...「ドロール＆ロックバード」の効果が適用されているターンに以下の効果も発動できますが、実際にドローすることはできません。「マルチャミー・プルリア」「マルチャミー・フワロス」「マルチャミー・ニャルス」「超再生能力」「相乗り」"
  (Asked about Maxx "C": activation is allowed, the draws are not done.)
- **droll-lock-does-not-stop-other-parts** (`jp-qa`, cid 9279, fid 24259, page date 2026-01-19)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=24259&request_locale=ja>
  "発動できます。発動した場合、『お互いはそれぞれ自身のデッキから攻撃力？以外のモンスター１体を選び、お互いに確認する』処理を行い、攻撃力が高い方のモンスターは墓地に送られます。" (Allied Spatial Battle: a card that does not add from the Deck to the hand is still played in full.)
- Not read (known list on Droll's Q&A page, titles only): fid 24396 (2つに1つ), 24401 (三戦の号), 24256 (原石の皇脈 etc.), 24162 (hand-add events), 12854 (priority between two hand-add reactions), 10803, 14784. The step 6 slice list says which of them to fetch when the slice is built.
- **rivalry-lock-sources** (`tcg-rule`, the Konami card FAQ above): the list of Summons it stops ("Normal Summon, Tribute Summon, Flip Summon, Xyz Summon, Synchro Summon, Fusion Summon, Special Summon with a monster's own effect") is the shape of a floodgate that stops a **result** and also activations that "would" do something ("including effects that could theoretically Summon anything, but currently cannot"). Step 8.
- RB10 (PDF p. 29, "Control / Possess") for the controller modifier: "If a player takes control of a card from their opponent, move it to the new controller's side of the field. If sent to the Graveyard, or returned to the hand or Deck, it is always returned to the Graveyard / hand / Deck of the original owner."

### Controller changes

- **control-until-end-phase** (`jp-notes`, cid 5505 Enemy Controller, page date 2022-04-23)
  <https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=5505&request_locale=ja>
  "その表側表示モンスターのコントロールをエンドフェイズまで得る" (card text) and "■エンドフェイズに効果を適用したモンスターのコントロールが相手に戻る場合、相手のメインモンスターゾーンに置く位置は相手が決めます。"
- **control-read-at-resolution** (`jp-qa`, cid 5505, fid 18400, page date 2017-04-27): a monster controlled through a Chain Link before a later link resolves counts as "your" monster at that resolution.
  "『「ルドラの魔導書」以外の自分の手札・フィールドの「魔導書」カード１枚または自分フィールドの魔法使い族モンスター１体を墓地へ送り』の処理によって、そのコントロールを得た魔法使い族モンスターを墓地へ送るカードに選ぶ事ができます。"
- Not read: fid 18400's siblings in Enemy Controller's list (17476 Chain, 14580, 8795 Xyz materials under a taken Xyz, 10989). The "control returns when it is turned face-down / which modifier ends" question (a Konami Q&A "turned face-down, does it return at End Phase?" is in the list) was not read.

### Level changes

- **No Konami page read.** Not found by a keyword path in the time spent. Step 6 can model Level as a modifier list read through `level(duel, id)` without a Konami record, which the slice list marks as lead-backed (below). Konami's TCG Synchro/Xyz/Ritual text uses "Level" as printed unless it says "current"; to be fetched at step 8 when Levels matter for Summons (RB10 p. 24, Synchro: "equal to the Level of the Synchro Monster", only the arithmetic).

### Card texts for the proposed cards (EN, FR read 2026-11-23, same URL form)

- **shrink-text** (cid 5355) EN "Target 1 face-up monster on the field; its original ATK becomes halved until the end of this turn." FR "Ciblez 1 monstre face recto sur le Terrain ; jusqu'à la fin de ce tour, son ATK d'origine sera divisée par deux."
- **muka-muka-text** (cid 4522) EN "Gains 300 ATK/DEF for each card in your hand." FR "Gagne 300 ATK/DEF pour chaque carte dans votre main." (Earth, Level 2, 600/300, Rock, Effect.) Konami's Japanese notes for it were **not** read; if the card is chosen, read `faq_search.action?ope=4&cid=4522` and cite its notes.
- Droll & Lock Bird (above); Skill Drain (above).

## YGOProJudge (leads only, no source cited by it; asked 2026-11-23, one question per session)

1. **ATK/DEF order in the TCG** (session `q-atk1`): "ATK/DEF modifiers are calculated using a strict hierarchy: original ATK/DEF, then effects that change the original, then fixed values ('becomes'), then additions/subtractions/multipliers, finally swaps ... If multiple effects fall into the same category (or if a fixed-value effect resolves after an additive one), apply them in the order they resolved (timestamping)." Citation given: "MECHANIC_RULES: ATK/DEF Modification Hierarchy"; `sources: []`. Its example (Shrink after an equip: 500 + 1000) agrees with Konami's Shrink notes. **Lead**, with two doubts: (a) "fixed value overrides earlier additions" and "gains after a set stack on it" agrees with the Konami Q&As only when the set is older; the Sacrifice/Megamorph Q&As (fid 6156/113) show a **later change of the original ATK beating an earlier set**, which its hierarchy (original changes always first) would not give; (b) it did not mention the lasting-vs-continuous difference (Gale vs Sacrifice). Konami wins; tests cite the Konami Q&As above.
2. **Level changes** (sessions `q-lvl1` and `q-lvl2`: the first was sent and only its greeting was printed because of a display error, the second repeated the same question; two sessions, same question): "applied based on the order they resolve (their timestamps). An effect that sets the Level to a specific number overwrites any previously applied modifications, while any subsequent effects that add or subtract will apply on top of that newly set value ... When a temporary effect expires ... recalculate the Level using the original Level and any effects that are still active." `ruling.sources: []`. **Lead** for the Level query: base, then modifiers in timestamp order, a set overwriting what came before.

## Gaps (not found at Konami, or not read)

- A Konami page stating the **full** ATK order as a rule (OCG or TCG): none found. The order is the one **induced** by the Q&As above plus the leads.
- Whether a lasting "becomes"/"halved" effect that was overwritten **by a later effect** comes back when the later one ends: Konami says no for Gale/Shrink and for Apollousa's two original-ATK effects (fid 7944, 22612) and yes for two continuous ones (fid 113). The design records the difference as a flag on the modifier (`lasting`), a reading of those three Q&As, not a Konami rule.
- Level change order, Level read by Link/Xyz/Synchro: no Konami record; judge lead only.
- Timestamp definition (what is the "timestamp" of a continuous effect): RB10 says the effect "starts when the face-up monster appears on the field", but no page defines a timestamp or compares two continuous effects that started at the same time (e.g. two Field Spells appearing together). Not asked of the judge (the question would have repeated #1).
- Two simultaneous locks or a lock and its source being negated at the same time: the lazy reading in design.md makes it order-free except the negation recursion; no Konami page.
- Droll & Lock Bird: whether the hand-add event survives a later Chain Link that resolved in the same chain (Konami only says "after the whole chain resolves"); OCG-only wording; step 3's "last thing that happened" limit may drop it (see design.md, Droll slice).
