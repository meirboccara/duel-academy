# Step 8 sources

Read 2026-11-23. Konami is primary; Konami's Japanese Q&A is OCG-only evidence and marked so. No third-party engine or script was
opened. Pages were fetched one at a time (four Q&A pages, one card FAQ, Link Spider's card page in English and French); nothing
of them is stored in the repo but the short quotes below and in `packages/rules/src/summon-sources.ts`.

Every quote in `summon-sources.ts` was checked by script against the text read: the rulebook's text layer
(`pdftotext` of `SD_RuleBook_EN_10.pdf`, ligatures and line-break hyphens normalised), the FAQ page's text and the four Q&A pages.
Two rulebook sentences lose the digit "2" in the first extraction used by earlier steps ("require • Tributes", "Main Phase •");
`pdftotext -layout` gives "require 2 Tributes" and "in Main Phase 2", which is what the records quote.

## Rulebook v10 (TCG)

https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf (printed page numbers)

- p. 9, Flip Effect: "This is an effect that is activated when a face-down card is flipped face-up. This can happen when it is
  Flip Summoned, attacked while face-down, or flipped face-up by a card effect."
- pp. 12-15, Link Monsters: "send a number of face-up monsters from your field to the Graveyard equal to the Link Rating of that
  Link Monster." "when you use a Link Monster as material for another Link Summon, you can count it as either 1 monster, or as a
  number of monsters equal to its Link Rating." "Place the Link Monster from your Extra Deck in the Extra Monster Zone, or one of
  your Main Monster Zones that another Link Monster is pointing to." "Link Monsters have no DEF and cannot ever be in Defense
  Position." (Also: "They can't even be flipped into face-down Defense Position.")
- pp. 16-17, Pendulum Monsters: "once per turn during your Main Phase, declare that you're Pendulum Summoning." "Special Summon as
  many monsters as you want from your hand and as many face-up Pendulum Monsters from your Extra Deck, whose Levels are in between
  those Pendulum Scales." "Monsters Pendulum Summoned from the Extra Deck must be Summoned to the Extra Monster Zone or your Main
  Monster Zone pointed to by a Link Monster." (The example: Scales 1 and 8 allow Levels 2 to 7: strictly between.)
- pp. 18-19, Xyz Monsters: "You use 2 Level 4 Monsters as the Xyz Materials to Summon this monster. Xyz Materials must be face-up
  before you can use them." "When an Xyz Monster tells you to 'detach' a material, take one of the stacked Xyz Material cards
  beneath your Xyz Monster and put it in the Graveyard."
- pp. 20-21, Synchro Monsters: "sending 1 face-up 'Tuner' monster and any number of face-up non-Tuner monsters from your field to
  the Graveyard, when the sum of all their Levels is exactly equal to the Level of the Synchro Monster." "take the Synchro Monster
  from your Extra Deck and play it in the Extra Monster Zone in face-up Attack or Defense Position." (The zone is superseded by
  the 2021 update, step 7.)
- p. 22, Fusion Monsters: "If you have all the Fusion Materials listed on the Fusion Monster Card, in the places specified on your
  Summoning card, you can activate your Summoning card". "Send the Fusion Materials to the Graveyard, then take the appropriate
  Fusion Monster from your Extra Deck and play it ... in either face-up Attack or Defense Position." "If another card effect causes
  your Fusion Materials to be sent to a place other than the Graveyard when your Summoning card resolves, send them to that other
  place, but the Fusion Summon still happens anyway." (The last sentence was read but is not a record: no test of step 8
  moves Fusion Materials elsewhere by another card's effect.)
- p. 23, Ritual Monsters: "Tribute monsters by sending them from your hand or the field to the Graveyard. The Ritual Spell Card will
  list the required amount to Tribute." "play the Ritual Monster Card in your Main Monster Zone in either face-up Attack or Defense
  Position."
- p. 24, Flip Summon and Special Summon: "You can change a face-down Defense Position monster into face-up Attack Position, without
  using a card effect. This is called a Flip Summon." "A Monster Card cannot be Flip Summoned in the same turn that it was Set onto
  the field." "Unless otherwise specified, a Special Summoned monster is played onto the field in your choice of face-up Attack
  Position or face-up Defense Position." "Synchro Monsters have to be properly Special Summoned first, before they can be Special
  Summoned by another card's effect."
- p. 25, Normal Set and Tribute Summon: "To play a Monster Card from your hand in face-down Defense Position is called a Normal Set.
  A monster Normal Set on the field is NOT considered Summoned." "you can only Normal Summon OR Normal Set (Normal Summon/Set, in
  short), once per turn". "For monsters that are Level 5 or higher, you must Tribute at least 1 monster you control before the
  Normal Summon/Set. This is called a Tribute Summon." "Monsters that are Level 5 or 6 require 1 Tribute and Monsters that are
  Level 7 or higher require 2 Tributes." "If you Tribute Summon in face-down Defense Position, it is called a Tribute Set. A monster
  Tribute Set on the field is NOT considered Summoned."
- p. 34, Change Your Monsters' Battle Positions: "You cannot change the battle position of a monster that was played onto the field
  this turn." "You cannot change it in Main Phase 2 if the monster attacked during the Battle Phase." "You cannot change it if you
  have already changed its battle position once this turn."
- p. 48: "Summoning a monster, Tributing, changing a monster's battle position and paying costs are not effect activations and
  therefore you cannot respond to those actions using a Chain." Xyz Materials: "Monsters that have become Xyz Materials are not
  treated as cards on the field. When an Xyz Monster leaves the field, all of the Xyz Materials attached to it are sent to the
  Graveyard. If an Xyz Monster is flipped face-down, or becomes controlled by the opponent, the Xyz Materials are not sent to the
  Graveyard."
- p. 51, glossary: "Tributing is sending a monster you control to the Graveyard. You can Tribute a face-up or face-down monster,
  unless otherwise specified." "A monster sent to the Graveyard by Tributing is not treated as 'destroyed.'" "Tributing to Tribute
  Summon a Level 5 monster is an example of a cost."

## Konami TCG card FAQ: Rivalry of Warlords & Gozen Match

https://www.yugioh-card.com/en/play/card-faq-1/

- "So you can't do any of the following to put a monster with the wrong Type/Attribute on your side of the field: Normal Summon
  Tribute Summon Flip Summon Xyz Summon Synchro Summon Fusion Summon Special Summon with a monster's own effect."
- "Activate a card or effect that can only Special Summon monsters of the wrong Type/Attribute (including effects that could
  theoretically Summon anything, but currently cannot ...)"
- "While Rivalry/Gozen is active, you can still Set monsters of any Type/Attribute, and you can Special Summon monsters of the
  wrong Type/Attribute face-down. But you can't Flip Summon them afterwards".

Used as the shape of a Summon lock: it stops every way of Summoning, and the activation of an effect that could only Summon a
locked monster; a Set is not stopped. Rivalry and Gozen themselves are not cards of the core (they need Types and Attributes).

## PSCT part 5 (TCG, 2011), already a record of step 5

`negate-summon-built-in-only`: "These effects can ONLY negate the actual Summon – they can't negate an effect that Summons, or a
Spell/Trap that Summons."

## Konami's Japanese Q&A (OCG only)

- fid 24054 (dated 2026-07-17), filed under Solemn Judgment (cid 4861) among others:
  https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=24054&request_locale=ja
  "「天盃龍チュンドラ」の③の効果がチェーン１で発動したのであれば、そのシンクロ召喚の際に「古聖戴サウラヴィス」の②の効果や「神の宣告」を発動できます。"
  "「天盃龍チュンドラ」の③の効果がチェーン２以降で発動したのであれば、そのシンクロ召喚の際に「古聖戴サウラヴィス」の②の効果や「神の宣告」を発動することはできません。"
  The answer says the same for every effect that performs a Synchro, Xyz, Link or Pendulum Summon (it lists Formula Synchron,
  Urgent Tuning, I:P Masquerena and others).
- fid 16986 (dated 2026-10-10), cid 4861:
  https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=16986&request_locale=ja
  "「天帝アイテール」の②の効果がチェーン１で発動したのであれば、そのアドバンス召喚の際に「神の宣告」を発動できます。" (and not from Chain
  Link 2). The same for effects that perform a Normal or Tribute Summon.
- fid 21297 (dated 2024-09-16), filed under Solemn Strike (cid 12187):
  https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=21297&request_locale=ja
  "融合・シンクロ・エクシーズ・リンクモンスターを墓地や除外状態から特殊召喚する場合、１度正規の方法での特殊召喚に成功している必要があります。"
  (Linkuriboh whose Link Summon was negated by Solemn Strike cannot use its Graveyard effect to come back.)
- fid 17662 (dated 2025-04-04), cid 4861:
  https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=17662&request_locale=ja
  "反転召喚が無効になり破壊される場合、そのモンスターはモンスターゾーンで破壊されます" and "エクシーズモンスターがエクシーズ召喚されたのち裏側守備表示に
  なった場合でも、そのモンスターは引き続き“エクシーズ召喚されたモンスター”として扱われます。"

## Card data

Link Spider (cid 13034), English and French pages re-read: "1 Normal Monster" / "1 Monstre Normal" is its material line; "Link 1".

## YGOProJudge leads (not source records)

Partner API, one question per session, closed afterwards, 2026-11-23. None of the answers cites a Konami page; each is a lead.

1. **Ritual "equal or exceed"**: the total may exceed the Level, but no Tribute may be unnecessary ("If removing any one monster
   from your chosen Tributes would still leave the remaining total equal to or greater than the required Level, that combination
   is illegal"); "exactly equal": any combination with the exact sum. Citation: "General mechanics knowledge". **The core's
   `at-least` rule rests on this only.**
2. **Negated Extra Deck Summons**: the Synchro Materials stay in the Graveyard and were sent as Synchro Material; the monsters
   stacked for a negated Xyz Summon go to the Graveyard (not detached); a negated Pendulum Summon destroys every monster of it, and
   they go to the Graveyard, not the Extra Deck (never on the field). Citation: Solemn Judgment's ruling cache, and a
   YGOResources sentence. **Materials not returned, and the Xyz Materials going to the Graveyard, rest on this only.** The
   Pendulum part agrees with step 5's Konami record `negated-card-not-from-field`.
3. **Manual position changes**: a Flip Summon is the monster's manual change of the turn; a change by a card effect does not use
   it; a monster Summoned, Set or that declared an attack this turn cannot be changed. Citation: the rulebook. **"A Flip Summon
   uses the change" and "an effect's change does not" rest on this only** (the rulebook's three cases are Konami's).
4. **A Synchro Summon performed by an effect** (Urgent Tuning, Formula Synchron): Solemn Judgment may negate it only if the effect
   was Chain Link 1; Monster Reborn and Polymerization cannot have their Summon negated, only their activation. No Konami page
   cited, but it is what fid 24054 says for the OCG and what PSCT part 5 says for effects that Special Summon.

5. **Not answered.** A fifth question (does a monster taken "until the End Phase" and turned face-down still go back; is there a
   replay when the attack target is turned face-down) got `api_not_enabled` from the partner API with the key in use at that
   time. The core's choices there (it goes back; no replay) rest on RB10's replay causes for the second and on nothing for the
   first; step 6's sources list Konami's Q&A on it as not read.

## Scope boundaries

Step 11 owns Tokens (as materials too) and monsters treated as Spells; step 9 the bot. Cards of the meta lists are not written
here (card plan, wave 2): the tests use made-up cards shaped like the blockers named in the coverage notes (generic Synchro with
a Tuner filter, Fusion by effect from the Deck, the Graveyard and the opponent's field, a Ritual Spell with "equal or exceed", a
banish from the Graveyard and a card that is the whole Tribute).
