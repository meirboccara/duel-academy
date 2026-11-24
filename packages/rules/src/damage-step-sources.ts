import type { SourceRecord } from "./sources";

/**
 * What can be activated in the Damage Step beyond the TCG rulebook's sentence (record `damage-step-activation-limit`): the Konami
 * pages cited by test/rules/damage-step-flag.test.ts and test/rules/battle.test.ts. All of them are OCG only (Konami's Japanese
 * rulebook and database: no formal authority over the TCG).
 *
 * Is there a general rule that effects which negate an activation can be activated in the Damage Step? None was found on a Konami
 * page (searched on 2026-11-25): the TCG rulebook (RB10) and Konami's TCG "Damage Step Rules" page (EU; the US page, gone, read in
 * its 2021 archived copy, has the same text) name no such effects; the official OCG rulebook (pp. 77-78, the two `ocg-rule`
 * records below) names, "basically", only the effects worded for that timing, ATK/DEF changes and Counter Traps. Only the notes
 * of each card say "it can also be activated in the Damage Step", so `EffectRecord.damageStep` is set per record. YGOProJudge calls
 * it a general mechanic and cites no source (2026-11-25).
 *
 * None of the cards named here is written yet: the tests use made-up cards with the same wording.
 */
const OCG_RULEBOOK = "https://www.yugioh-card.com/japan/howto/data/rulebook_masterrule20200401_ver1.0.pdf";
const rulebook = (id: string, quote: string): SourceRecord => ({ id, kind: "ocg-rule", url: OCG_RULEBOOK, read: "2026-11-25", quote });
const qa = (id: string, cid: number, fid: number, read: string, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read: "2026-11-25", quote });

const SPIRIT_DRAGON = 12324;
const ULTIMATE_SPIRIT_DRAGON = 20607;
const NEO_ULTIMATE_DRAGON = 12484;
const NINE_PILLARS = 12667;
const CRYSTAL_WING = 12321;

export const DAMAGE_STEP_SOURCES: readonly SourceRecord[] = [
	// The official OCG rulebook (Master Rule, revised 2020-04-01, ver. 1.0), "ダメージステップの詳細について", printed pp. 77-78: what can be
	// activated at each of the five timings. At the start of the Damage Step (the same sentence stands for "before damage
	// calculation", with 「ダメージ計算前」 added): effects that negate an activation are not in the list.
	rulebook("ocg-damage-step-start-list", "基本的に「ダメージステップ時」に発動できる効果と、モンスターの攻撃力・守備力を増減させる効果（「収縮」「オネスト」等）、カウンター罠以外は発動できません。"),
	// The same pages, under "4 ダメージ計算後" (after the effects triggered by the battle) and again under "5 ダメージステップ終了時": Counter
	// Traps can be activated after damage calculation and at the end of the Damage Step. Under "3 ダメージ計算時" too (a timing the core
	// has no window for).
	rulebook("ocg-counter-traps-after-damage-calculation", "基本的に、その他のカードはカウンター罠以外は発動できません。"),
	// Konami's Japanese Q&A fid 7966 (2017-05-25, Nine Pillars of Yang Zing, a Counter Trap): D.D. Warrior, destroyed by battle,
	// activates its effect after damage calculation (ダメージ計算後), and the Counter Trap chained to it negates that activation.
	qa("counter-trap-negates-after-damage-calculation", NINE_PILLARS, 7966, "2026-11-25", "質問の状況の場合、「竜星の九支」の『その発動を無効にし』の処理によって、発動した「異次元の戦士」のモンスター効果の発動は無効になります。"),
	// Blue-Eyes Spirit Dragon (notes dated 2024-03-23), its second effect: "Once per turn, when an effect of a card in the GY is
	// activated: negate the activation", a Quick Effect on the field. No timing of the Damage Step is named.
	notes("spirit-dragon-negation-in-damage-step", SPIRIT_DRAGON, "【②の効果について】■モンスターゾーンで発動できる誘発即時効果です。■墓地で効果が発動した時、その発動に直接チェーンして発動できます。■ダメージステップ中でも発動できます。"),
	// The same notes, its third effect (the Quick Effect that Tributes it to Special Summon a Synchro Monster): per effect, not per card.
	notes("spirit-dragon-summon-not-in-damage-step", SPIRIT_DRAGON, "【③の効果について】■モンスターゾーンで発動できる誘発即時効果です。■ダメージステップ中には発動できません。"),
	// Blue-Eyes Ultimate Spirit Dragon (notes dated 2024-09-07), its second effect: "when a card or effect is activated on the field:
	// negate the activation, and this card gains 1000 ATK", a Quick Effect on the field. (Its third effect, a Trigger Effect, has the
	// same sentence; a Trigger Effect needs no flag.)
	notes("ultimate-spirit-dragon-negation-in-damage-step", ULTIMATE_SPIRIT_DRAGON, "【②の効果について】■モンスターゾーンで発動できる誘発即時効果です。■ダメージステップでも発動できます。"),
	// Neo Blue-Eyes Ultimate Dragon (notes dated 2024-03-23), its second effect, a Quick Effect activated in the GY: "When a card or
	// effect is activated that targets a "Blue-Eyes" monster(s) you control (Quick Effect): You can banish this card from your GY;
	// negate the activation, and if you do, destroy that card" (Konami's English page, cid 12484, read 2026-11-25). Its first effect
	// (attack again, whose cost sends a "Blue-Eyes" Fusion Monster from the Extra Deck to the GY) is a Trigger Effect: no flag.
	notes(
		"neo-ultimate-dragon-negation-in-damage-step",
		NEO_ULTIMATE_DRAGON,
		"【②の効果について】■墓地で発動できる誘発即時効果です。■自分のモンスターゾーンの表側表示の「ブルーアイズ」モンスターを対象とする（対象に含む）魔法・罠・モンスターの効果が発動した時、その発動に直接チェーンして発動できます。■ダメージステップ中でも発動できます。",
	),
	// Konami's Japanese Q&A fid 12836 (2017-03-24, Crystal Wing Synchro Dragon; read 2026-11-24): a monster's Quick Effect that negates
	// an activation is chained to an effect activated during damage calculation (a timing the core has no window for). It shows such an
	// effect is not held to "up until the start of damage calculation".
	qa("monster-negation-during-damage-calculation", CRYSTAL_WING, 12836, "2026-11-24", "さらにチェーンして「クリスタルウィング・シンクロ・ドラゴン」の『その発動を無効にし破壊する』モンスター効果を発動する事はできます。"),
];
