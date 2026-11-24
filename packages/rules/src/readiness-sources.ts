import type { SourceRecord } from "./sources";

/**
 * Real-deck readiness (restrictions, protections, delayed effects): the Konami pages cited by test/rules/protections.test.ts. All are
 * Konami's Japanese Q&A (OCG only: no formal authority over the TCG), found with the database's own Q&A text search and read on
 * 2026-11-24. No TCG page states these rules; where no Konami page was found at all, the tests say "YGOProJudge only" in their titles
 * and cite nothing.
 */
const read = "2026-11-24";
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });

export const READINESS_SOURCES: readonly SourceRecord[] = [
	// Void Feast's "your opponent cannot target them with card effects" on an Infernoid unaffected by Spell effects (the Infernoid monster of the question, インフェルノイド・ルキフグス, cid 11534; page dated 2023-03-11).
	qa("cannot-be-targeted-restricts-the-player", 11534, 14200, "『効果の対象にもできない』は相手プレイヤーに適用される効果です。いずれも自分フィールドの「インフェルノイド」モンスターに適用される効果ではありません。"),
	// Moondance Ritual (cid 10821; page dated 2025-12-19): its target became unaffected by Trap effects. The effect is not applied; the monster is still its target.
	qa("unaffected-targeted-not-applied", 10821, 13714, "『フィールドのこのカードを、このカードの発動時に対象としたモンスターの下に重ねてX素材とする』処理は適用されず、「 ムーンダンスの儀式 」はフィールドに残ります。その場合、「 ムーンダンスの儀式 」はそのエクシーズモンスターを対象に取り続けており"),
	// Wonder Wand on a monster unaffected by other cards' effects (cid 23549; page dated 2026-10-05): the monster is sent to the GY as the cost.
	qa("unaffected-sent-as-cost", 23549, 24398, "（効果の発動を行う際のコストとして、他の効果を受けないモンスターを墓地へ送ることができます。）"),
	// Tyrant's Temper (cid 9156; page dated 2017-03-24): Divine Wrath does not negate the activation of a monster on the field that is unaffected by Trap
	// effects; Rescue Rabbit, banished as its own cost, is no longer on the field, and its activation is negated.
	qa("unaffected-activation-not-negated-on-field", 9156, 12428, "「 天罰 」の効果は適用されないため、効果モンスターの効果の発動は無効化されず、破壊される事もありません。また、「 レスキューラビット 」の効果を発動した場合、発動コストとして「 レスキューラビット 」自身をゲームから除外した時点で、『フィールド上に表側表示で存在するモンスター』ではなくなり、「 暴君の威圧 」の効果が適用されなくなります。"),
	// Skill Drain's list (cid 5740; page dated 2026-09-05), on The Arrival Cyberse @Ignister's "unaffected by other cards' effects" (and, "likewise", a
	// list of monsters with "unaffected by Trap effects" such as Elemental HERO Wildheart): which of the two began to apply first decides.
	qa("skill-drain-first-negates-own-immunity", 5740, 23897, "「スキルドレイン」の適用中に、「ジ・アライバル・サイバース＠イグニスター」が特殊召喚された場合、『③：このカードは他のカードの効果を受けない』効果は「スキルドレイン」によって無効になります。（その後に、「スキルドレイン」の適用がなくなったのであれば、『③：このカードは他のカードの効果を受けない』効果が適用される事になります。）"),
	qa("own-immunity-first-skill-drain-not-applied", 5740, 23897, "「ジ・アライバル・サイバース＠イグニスター」が特殊召喚された後に「スキルドレイン」が発動した場合、『③：このカードは他のカードの効果を受けない』効果は通常通り適用されますので、「ジ・アライバル・サイバース＠イグニスター」は「スキルドレイン」の効果を受けません。"),
];
