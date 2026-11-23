import type { SourceRecord } from "./sources";

/**
 * Step 8 (Summon procedures): the rules cited by test/rules/normal-summons.test.ts, summon-procedures.test.ts and
 * summon-effects.test.ts. Quotes copied from the pages read on 2026-11-23 (docs/rules-core/step8/sources.md). RB10 and the Rivalry /
 * Gozen card FAQ are TCG sources; the Japanese Q&A are OCG only.
 */
const read = "2026-11-23";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const RIVALRY_FAQ = "https://www.yugioh-card.com/en/play/card-faq-1/";
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });

export const SUMMON_SOURCES: readonly SourceRecord[] = [
	// RB10 printed p. 25, Tribute Summon. (The PDF's text layer drops the digit 2 of this sentence; the table beside it reads "2 Tributes".)
	rb10("tribute-summon", "For monsters that are Level 5 or higher, you must Tribute at least 1 monster you control before the Normal Summon/Set. This is called a Tribute Summon."),
	rb10("tribute-count", "Monsters that are Level 5 or 6 require 1 Tribute and Monsters that are Level 7 or higher require 2 Tributes."),
	rb10("tribute-set", "If you Tribute Summon in face-down Defense Position, it is called a Tribute Set. A monster Tribute Set on the field is NOT considered Summoned."),
	// RB10 printed p. 25, Normal Set.
	rb10("normal-set", "To play a Monster Card from your hand in face-down Defense Position is called a Normal Set. A monster Normal Set on the field is NOT considered Summoned."),
	rb10("normal-summon-or-set", "you can only Normal Summon OR Normal Set (Normal Summon/Set, in short), once per turn"),
	// RB10 printed p. 24, Flip Summon.
	rb10("flip-summon", "You can change a face-down Defense Position monster into face-up Attack Position, without using a card effect. This is called a Flip Summon."),
	rb10("flip-summon-not-the-turn-set", "A Monster Card cannot be Flip Summoned in the same turn that it was Set onto the field."),
	// RB10 printed p. 9, Flip Effect.
	rb10("flip-effect", "This is an effect that is activated when a face-down card is flipped face-up. This can happen when it is Flip Summoned, attacked while face-down, or flipped face-up by a card effect."),
	// RB10 printed p. 34, Change Your Monsters' Battle Positions. (The text layer drops the digit 2 of "Main Phase 2".)
	rb10("position-not-the-turn-played", "You cannot change the battle position of a monster that was played onto the field this turn."),
	rb10("position-not-after-attack", "You cannot change it in Main Phase 2 if the monster attacked during the Battle Phase."),
	rb10("position-once-per-turn", "You cannot change it if you have already changed its battle position once this turn."),
	// RB10 printed p. 48, Actions which cannot be Chained to.
	rb10("actions-not-chained-to", "Summoning a monster, Tributing, changing a monster’s battle position and paying costs are not effect activations and therefore you cannot respond to those actions using a Chain."),
	// RB10 printed p. 51, glossary: Tribute, Pay a Cost.
	rb10("tribute-not-destroyed", "Tributing is sending a monster you control to the Graveyard. You can Tribute a face-up or face-down monster, unless otherwise specified."),
	rb10("tribute-is-a-cost", "Tributing to Tribute Summon a Level 5 monster is an example of a cost."),
	// RB10 printed p. 24, Special Summon.
	rb10("special-summon-position", "Unless otherwise specified, a Special Summoned monster is played onto the field in your choice of face-up Attack Position or face-up Defense Position."),
	rb10("special-summon-monsters-need-proper", "You cannot use a card effect to Special Summon those monsters from your hand, Deck, or the Graveyard unless it was properly Special Summoned first."),
	// RB10 printed p. 24, Normal Summon; p. 23, Ritual Monsters.
	rb10("normal-summon-restriction", "All Normal Monsters, and most Effect Monsters (unless they have a specific restriction), can be Summoned in this way."),
	rb10("ritual-monster-needs-ritual", "Ritual Monster Cards are placed in the Main Deck and cannot be Summoned unless you have all the proper cards together in your hand or on the field."),
	rb10("properly-summoned-first", "Synchro Monsters have to be properly Special Summoned first, before they can be Special Summoned by another card’s effect."),
	// RB10 printed p. 20-21, Synchro Monsters.
	rb10("synchro-procedure", "sending 1 face-up “Tuner” monster and any number of face-up non-Tuner monsters from your field to the Graveyard, when the sum of all their Levels is exactly equal to the Level of the Synchro Monster."),
	rb10("synchro-position", "take the Synchro Monster from your Extra Deck and play it in the Extra Monster Zone in face-up Attack or Defense Position."),
	// RB10 printed p. 18-19, Xyz Monsters; p. 48, Xyz Materials.
	rb10("xyz-procedure", "You use 2 Level 4 Monsters as the Xyz Materials to Summon this monster. Xyz Materials must be face-up before you can use them."),
	rb10("xyz-materials-not-on-field", "Monsters that have become Xyz Materials are not treated as cards on the field. When an Xyz Monster leaves the field, all of the Xyz Materials attached to it are sent to the Graveyard."),
	rb10("xyz-materials-stay", "If an Xyz Monster is flipped face-down, or becomes controlled by the opponent, the Xyz Materials are not sent to the Graveyard."),
	rb10("xyz-detach", "take one of the stacked Xyz Material cards beneath your Xyz Monster and put it in the Graveyard."),
	// RB10 printed p. 12-15, Link Monsters.
	rb10("link-procedure", "send a number of face-up monsters from your field to the Graveyard equal to the Link Rating of that Link Monster."),
	rb10("link-material-rating", "when you use a Link Monster as material for another Link Summon, you can count it as either 1 monster, or as a number of monsters equal to its Link Rating."),
	rb10("link-zone", "Place the Link Monster from your Extra Deck in the Extra Monster Zone, or one of your Main Monster Zones that another Link Monster is pointing to."),
	rb10("link-no-defense", "Link Monsters have no DEF and cannot ever be in Defense Position."),
	// RB10 printed p. 22, Fusion Monsters.
	rb10("fusion-procedure", "Send the Fusion Materials to the Graveyard, then take the appropriate Fusion Monster from your Extra Deck and play it in the Extra Monster Zone in either face-up Attack or Defense Position."),
	rb10("fusion-material-places", "If you have all the Fusion Materials listed on the Fusion Monster Card, in the places specified on your Summoning card, you can activate your Summoning card"),
	// RB10 printed p. 23, Ritual Monsters.
	rb10("ritual-procedure", "Tribute monsters by sending them from your hand or the field to the Graveyard. The Ritual Spell Card will list the required amount to Tribute."),
	rb10("ritual-position", "play the Ritual Monster Card in your Main Monster Zone in either face-up Attack or Defense Position."),
	// RB10 printed p. 16-17, Pendulum Monsters.
	rb10("pendulum-summon-once", "once per turn during your Main Phase, declare that you’re Pendulum Summoning."),
	rb10("pendulum-summon-levels", "Special Summon as many monsters as you want from your hand and as many face-up Pendulum Monsters from your Extra Deck, whose Levels are in between those Pendulum Scales."),
	rb10("pendulum-summon-extra-zone", "Monsters Pendulum Summoned from the Extra Deck must be Summoned to the Extra Monster Zone or your Main Monster Zone pointed to by a Link Monster."),
	// Konami TCG "Card FAQ: Rivalry of Warlords & Gozen Match": which Summons a lock stops, and that a Set is not one of them.
	{ id: "summon-lock-stops", kind: "tcg-rule", url: RIVALRY_FAQ, read, quote: "So you can’t do any of the following to put a monster with the wrong Type/Attribute on your side of the field: Normal Summon Tribute Summon Flip Summon Xyz Summon Synchro Summon Fusion Summon Special Summon with a monster’s own effect." },
	{ id: "summon-lock-stops-activation", kind: "tcg-rule", url: RIVALRY_FAQ, read, quote: "Activate a card or effect that can only Special Summon monsters of the wrong Type/Attribute" },
	{ id: "summon-lock-set-allowed", kind: "tcg-rule", url: RIVALRY_FAQ, read, quote: "While Rivalry/Gozen is active, you can still Set monsters of any Type/Attribute" },
	// OCG only. Tenpai Dragon Chundra's Synchro Summon by effect, filed under Solemn Judgment (cid 4861), Q&A dated 2026-07-17.
	qa("summon-by-effect-chain-link-1", 4861, 24054, "「天盃龍チュンドラ」の③の効果がチェーン１で発動したのであれば、そのシンクロ召喚の際に「古聖戴サウラヴィス」の②の効果や「神の宣告」を発動できます。"),
	qa("summon-by-effect-chain-link-2", 4861, 24054, "「天盃龍チュンドラ」の③の効果がチェーン２以降で発動したのであれば、そのシンクロ召喚の際に「古聖戴サウラヴィス」の②の効果や「神の宣告」を発動することはできません。"),
	// OCG only. Ehther the Heavenly Monarch's Tribute Summon by effect on the opponent's turn, filed under Solemn Judgment (cid 4861), Q&A dated 2026-10-10.
	qa("tribute-summon-by-effect", 4861, 16986, "「天帝アイテール」の②の効果がチェーン１で発動したのであれば、そのアドバンス召喚の際に「神の宣告」を発動できます。"),
	// OCG only. Linkuriboh's Link Summon negated by Solemn Strike (cid 12187), Q&A dated 2024-09-16: it cannot come back from the Graveyard.
	qa("revive-needs-successful-proper-summon", 12187, 21297, "融合・シンクロ・エクシーズ・リンクモンスターを墓地や除外状態から特殊召喚する場合、１度正規の方法での特殊召喚に成功している必要があります。"),
	// OCG only. The Phantom Knights of Break Sword, filed under Solemn Judgment (cid 4861), Q&A dated 2025-04-04.
	qa("negated-flip-summon-destroyed-on-field", 4861, 17662, "反転召喚が無効になり破壊される場合、そのモンスターはモンスターゾーンで破壊されます"),
	qa("face-down-still-xyz-summoned", 4861, 17662, "エクシーズモンスターがエクシーズ召喚されたのち裏側守備表示になった場合でも、そのモンスターは引き続き“エクシーズ召喚されたモンスター”として扱われます。"),
];
