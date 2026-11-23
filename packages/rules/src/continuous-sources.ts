import type { SourceRecord } from "./sources";

/**
 * Step 6 (continuous effects): the rules cited by the tests in test/rules/continuous*.test.ts. Quotes were copied from the pages on
 * the date read (sources are listed in /private notes of the step; the pages were saved when read). Konami's Japanese Q&A (OCG) has
 * no formal authority over the TCG; the owner accepted it as the source of the ATK/DEF order (2026-11-23), so each such record says
 * "OCG only". Where a record rests on a TCG page, it says which.
 */
const read = "2026-11-23";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const qaUrl = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const notesUrl = (cid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`;
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: qaUrl(fid), read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: notesUrl(cid), read, quote });
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });

export const CONTINUOUS_SOURCES: readonly SourceRecord[] = [
	// RB10 Glossary, "Original ATK (or DEF)" (PDF p. 30).
	rb10("atk-original-glossary", "The Original ATK (or DEF) is the number of ATK (or DEF) points printed on the Monster Card."),
	// OCG only. Shrink's list (cid 5355), Apollousa, Bow of the Goddess: its ATK lowered by 800 three times, then Shrink applies: the original ATK is halved and the lowering is added on top.
	qa("shrink-recomputes-losses", 5355, 22612, "（元々の攻撃力が3200の半分の1600となりますので、その数値に、『このカードの攻撃力を８００ダウンし、その発動を無効にする』効果によってダウンする攻撃力が加わり、フィールドにて適用される攻撃力の数値は0となります。）"),
	// OCG only. Shrink's list (cid 5355), Reptilianne Gorgon: a monster whose ATK became 0 by that effect, then Shrink: half the printed ATK.
	qa("set-then-shrink", 5355, 8976, "「レプティレス・ゴルゴーン」の効果によって攻撃力が0になっているモンスターが、「収縮」の効果を受ける場合、攻撃力はカードに記載されている元々の攻撃力の半分の数値になります。"),
	// OCG only. Shrink's list (cid 5355), Osiris the Sky Dragon (gains 1000 ATK/DEF for each card in hand): Shrink halves the original ATK first, then the card's own gain applies on top, and still does after Shrink stops applying.
	qa("shrink-then-own-gain", 5355, 11906, "「収縮」の効果によって元々の攻撃力の半分の数値になった後、「オシリスの天空竜」の『このカードの攻撃力・守備力は自分の手札の数×１０００ポイントアップする。』効果が適用される為、結果的に「オシリスの天空竜」の数値は『自分の手札の数×１０００ポイントアップ』した数値になります。"),
	// OCG only. Megamorph's list (cid 4663): Sacrifice (its ATK becomes its equipped monster's), with Megamorph already equipped: Sacrifice's effect, the later one, is what applies, and later Life Point changes do not change it.
	qa("set-vs-original-later-wins-a", 4663, 6156, "その後に、自分や相手のライフポイントが変化し、それによって適用される「巨大化」の『自分のLPが相手より少ない場合、装備モンスターの攻撃力は元々の攻撃力の倍になる』処理や『自分のLPが相手より多い場合、装備モンスターの攻撃力は元々の攻撃力の半分になる』処理が変わる場合でも、「サクリファイス」の攻撃力や守備力が変化する事はありません。"),
	// OCG only. Same list: Sacrifice first, Megamorph equipped later: while Megamorph changes the original ATK the ATK is the original 0; when the Life Points are equal, Sacrifice's 2500 is back.
	qa("set-vs-original-later-wins-b", 4663, 113, "『自分のLPが相手より少ない場合、装備モンスターの攻撃力は元々の攻撃力の倍になる』処理または、『自分のLPが相手より多い場合、装備モンスターの攻撃力は元々の攻撃力の半分になる』処理が適用される間は、「サクリファイス」の元々の攻撃力となる0の状態になりますが、自分と相手のライフポイントが同じ間は、装備されている「ブラック・マジシャン」の攻撃力となる2500の状態になります。"),
	// OCG only. Skill Drain's list (cid 5740), a "neither player can Special Summon" monster negated by Skill Drain: once the negating card has left, the effect applies again at once.
	qa("negated-floodgate-returns", 5740, 7965, "（「D-HERO Bloo-D」がモンスターゾーンから離れますと「虚無魔人」の効果が再び適用され、モンスターを特殊召喚できなくなりますので、相手は「D-HERO Bloo-D」を素材に含めて融合召喚できません。）"),
	// OCG only. Enemy Controller's notes (cid 5505): control taken "until the End Phase" goes back to the opponent then.
	notes("control-until-end-phase", 5505, "■エンドフェイズに効果を適用したモンスターのコントロールが相手に戻る場合、相手のメインモンスターゾーンに置く位置は相手が決めます。"),
	// OCG only. Enemy Controller's list: a monster whose control was taken by a link that resolved earlier counts as yours when a later link resolves.
	qa("control-read-at-resolution", 5505, 18400, "『「ルドラの魔導書」以外の自分の手札・フィールドの「魔導書」カード１枚または自分フィールドの魔法使い族モンスター１体を墓地へ送り』の処理によって、そのコントロールを得た魔法使い族モンスターを墓地へ送るカードに選ぶ事ができます。"),
];
