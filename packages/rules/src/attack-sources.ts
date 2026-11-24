import type { SourceRecord } from "./sources";

/**
 * Attack permissions (extra attacks, direct attacks while the opponent controls monsters, attacks in face-up Defense Position): the
 * pages cited by test/rules/extra-attacks.test.ts and test/rules/direct-and-defense-attacks.test.ts, read on 2026-11-24. All but
 * the rulebook line are Konami's Japanese Q&A and notes (OCG only: no formal authority over the TCG), reached from the Q&A lists of
 * the cards of the two exact lists that use the mechanic: Blue-Eyes Tyrant Dragon (cid 16842), Neo Blue-Eyes Ultimate Dragon
 * (cid 12484), Sky Striker Ace - Hayate (cid 13763), Ancient Fairy Life Dragon (cid 21176). Where no Konami page was found, the
 * tests say "YGOProJudge only" or "the core's reading" in their titles and cite nothing.
 */
const read = "2026-11-24";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });

export const ATTACK_SOURCES: readonly SourceRecord[] = [
	// "Can attack all monsters your opponent controls, once each" (page dated 2025-06-21, listed under Blue-Eyes Tyrant Dragon): with the
	// defender choosing the attack targets, the same monster still cannot be attacked twice.
	qa("attack-all-once-each", 16842, 12701, "できません。相手の「阿修羅」が１回目の攻撃を行う際に、自分が「マシュマロン」を指定し、それに攻撃宣言させた場合、その後の「阿修羅」が２回目の攻撃を行う際には、「ノーブル・ド・ノワール」を指定し、それに攻撃宣言させることになります。"),
	// The same permission and direct attacks (page dated 2026-10-22, four cases; the list of monsters it applies to names Blue-Eyes Tyrant Dragon).
	qa("attack-all-direct-or-monsters", 16842, 16016, "（A）直接攻撃できます。なお、このターンに「冥骸合竜－メメントラル・テクトリカ」が他のモンスターに攻撃して戦闘を行っている場合、直接攻撃はできませんので、攻撃は終了します。（B）直接攻撃を行い、ダメージ計算が行われていますので、モンスターに攻撃することはできません。（C）できません。"),
	// Case D of the same page: the permission to attack directly (an Equip Card here) is lost at the declaration of a direct attack; the
	// question states that this causes a replay ("それによって戦闘の巻き戻しが発生し"), and the answer that no other monster is attacked afterwards.
	qa("direct-attack-lost-replay", 16842, 16016, "（D）できません。「冥骸合竜－メメントラル・テクトリカ」は直接攻撃を宣言していますので、戦闘の巻き戻しによって攻撃対象をモンスターへと変更して攻撃を行った場合でも、『このカードは相手モンスター全てに１回ずつ攻撃できる』効果によって他のモンスターに攻撃することはできなくなります。"),
	// A Continuous Effect that gives several attacks, negated during a second or later attack (page dated 2025-09-27; its lists name the
	// "once each", "2 attacks" and "3 attacks" monsters, Blue-Eyes Tyrant Dragon among them).
	qa("multi-attack-negated", 16842, 11046, "２回目以降の攻撃宣言を行った際に永続効果が無効化された場合、２回目以降の攻撃はできなくなります。また、ダメージステップ中に発動した「禁じられた一滴」等の効果によって永続効果が無効化された場合、その戦闘は続行されますので、ダメージ計算を行います。"),
	// Neo Blue-Eyes Ultimate Dragon's notes (dated 2024-03-23): "this card can attack again in a row" ends when the monster is no longer face-up in the Monster Zone.
	notes("attack-again-while-face-up", 12484, "■『このカードは続けて攻撃できる』効果が適用されたこのモンスターが、モンスターゾーンに表側表示で存在しなくなった場合、この効果の適用はなくなります。"),
	// RB10, Glossary, "Attack Directly".
	{ id: "direct-attack-ability", kind: "tcg-rule", url: RB10, read, quote: "Some monsters have an effect that allows them to attack directly even if the opponent controls a monster." },
	// Sky Striker Ace - Hayate's notes (dated 2018-04-14) on its "can attack directly".
	notes("direct-attack-continuous", 13763, "【①の効果について】■モンスターゾーンで適用する永続効果です。"),
	// Ancient Fairy Life Dragon attacking in Defense Position (3300 DEF) into a 3500 ATK monster (page read 2026-11-24).
	qa("defense-attack-damage", 21176, 24407, "自分が２００の戦闘ダメージを受け、「エンシェント・フェアリー・ライフ・ドラゴン」が戦闘で破壊されます。表側守備表示で攻撃し、守備力を攻撃力としてダメージ計算を行った場合でも、より数値が低かったモンスターのコントローラーに数値の差分の戦闘ダメージが発生します。また、数値に差があった場合には数値の低かったモンスターが、数値が同じ場合にはお互いのモンスターが戦闘で破壊されることになります。"),
	// The first half of fid 23968 (its second half is `defense-attacker-stops` in src/battle-sources.ts); the page lists Ancient Fairy Life Dragon.
	qa("defense-attack-negated-before-damage-step", 21176, 23968, "ダメージステップに入るまでの間に『表側守備表示のままで攻撃できる』効果が無効化された場合、その「スケアクロー・クシャトリラ」は攻撃を行えなくなり、ダメージステップには入らず、その攻撃は終了します。"),
];
