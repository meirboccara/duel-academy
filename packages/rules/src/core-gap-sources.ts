import type { SourceRecord } from "./sources";

/**
 * The pages cited by the core-gap slice of 2026-11-26 (test/rules/battle-phase-steps.test.ts, attack-targets.test.ts,
 * special-once-per-turn.test.ts, graveyard-redirect.test.ts, phase-triggers.test.ts): the Battle Phase's Start and End Steps, the
 * restrictions on attack targets, "You can only Special Summon "[name]" once per turn", "cards sent to the GY are banished instead",
 * and the optional Trigger Effects of a phase. RB10 was read again (its text extracted from Konami's PDF) and the Fast Effect Timing
 * page fetched on 2026-11-26. The Japanese Q&A and notes are OCG only: they have no formal authority over the TCG.
 */
const read = "2026-11-26";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const FET = "https://www.yugioh-card.com/en/play/fast-effect-timing/";
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });

/** Sky Striker Ace - Hayate (cid 13763), whose notes and Q&A list hold the attack-target and once-per-turn pages. */
const HAYATE = 13763;

export const CORE_GAP_SOURCES: readonly SourceRecord[] = [
	// RB10, "Battle Phase" (printed pp. 37-38).
	rb10("battle-phase-steps", "The Battle Phase is split into 4 steps and is conducted in the order shown in the diagram. The Battle Step and Damage Step are repeated each time you attack with a monster."),
	rb10("start-step", "This step starts the Battle Phase. The turn player should announce “I’m entering the Battle Phase.”"),
	rb10("end-step", "After you’ve resolved all your battles by repeating the Battle and Damage Steps, and you have no more monsters you want to attack with, announce to your opponent that you are ending your Battle Phase."),
	// Konami's Fast Effect Timing page: every step, the Start and End Steps included, opens in box A.
	{ id: "each-step-starts-open", kind: "tcg-rule", url: FET, read, quote: "Each Phase and Step starts with the turn player in box A of the chart listed below." },
	// Fid 23993 (page dated 2026-06-06, listed under Hayate): can a monster able to attack directly do so under (A) Double Iris Knight
	// Astram's "your opponent cannot target other monsters for attacks", (B) Fighting Spirit Image's "your opponent can only target the
	// monster with the highest ATK you control for attacks"? (A) yes: it restricts monsters as targets, not the player; (B) no: it
	// restricts the choice of an attack target itself.
	qa("target-other-monsters-direct-open", HAYATE, 23993, "（A）直接攻撃できます。"),
	qa("only-target-closes-direct", HAYATE, 23993, "（B）直接攻撃できません。"),
	// Fid 13862 (2018-07-23): two Skyfang Brigade monsters that each forbid attacks on the other "Skyfang Brigade" monsters: none can be
	// selected; a monster that can attack directly may still attack the player directly.
	qa("no-target-selectable", HAYATE, 13862, "自分は、相手のモンスターゾーンに表側表示で存在する、どの「空牙団」と名のついたモンスターも攻撃対象に選択する事ができません。"),
	qa("no-target-direct-attacker-still-direct", HAYATE, 13862, "なお、「閃刀姫－ハヤテ」など、直接攻撃を行えるモンスターであれば、相手プレイヤーへの直接攻撃を行う事はできます。"),
	// Fid 10015 (The Phantom Knights' Fog Blade, cid 12205, 2017-03-24, page read 2026-11-27): Fog Blade activated in the Battle Step on
	// the attack target, after the attack was declared: damage is calculated as usual; its "cannot be selected as an attack target" does
	// not undo a target already selected, so no replay, and the attack does not become direct.
	{ id: "target-lock-after-declaration", kind: "jp-qa", cid: 12205, fid: 10015, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=10015&request_locale=ja", read: "2026-11-27", quote: "既に攻撃対象が選択された後に発動したとしても、戦闘の巻き戻しが発生する事はありません。また、直接攻撃にもなりません。" },
	// Hayate's notes (2018-04-14), on "You can only Special Summon "Sky Striker Ace - Hayate(s)" once per turn".
	notes("special-once-not-an-effect", HAYATE, "■効果として扱いません。"),
	notes("special-once-any-way", HAYATE, "■リンク召喚による特殊召喚かどうかにかかわらず、１ターンに１度しか特殊召喚できません。"),
	// "Cards sent to the GY are banished instead" (Macro Cosmos and the like). Fid 18128 (Mausoleum of White, cid 12331, 2017-03-24):
	// the Normal Monster its effect sends is banished, and the ATK gain that needs it sent is not applied.
	qa("redirect-effect-send-banished", 12331, 18128, "自分の手札または自分のデッキから選んだ通常モンスターは墓地へ送られず除外される事になります。"),
	qa("redirect-if-you-do-fails", 12331, 18128, "『対象のモンスターの攻撃力・守備力はターン終了時まで、墓地へ送ったモンスターのレベル×１００アップする』処理は適用されません。"),
	// Fid 14540 (Maiden of White, cid 20602, 2025-12-13): Forbidden Droplet, whose cost sends cards to the GY, cannot be activated.
	qa("send-cost-replaced-unpaid", 20602, 14540, "墓地へ送られるカードが除外されてしまい、コストとしてカードを墓地へ送ることができないためです。"),
	// Fid 23815 (Wishes for Eyes of Blue, cid 20604, 2026-06-26): (A) a discard cost (Ash Blossom) can be paid, the card banished; (B)
	// an effect worded "discard to the GY" cannot be activated.
	qa("discard-cost-replaced-paid", 20604, 23815, "コストとして捨てたカードは結果的に墓地へは行かず除外されますが、「灰流うらら」のように、テキストに『墓地へ捨てて発動』とは記載されていない効果は発動できます。"),
	qa("discard-to-gy-cost-replaced-unpaid", 20604, 23815, "『墓地へ捨てて発動できる』効果については、『墓地へ』と記載されている通り、コストとして捨てられるカードが墓地へ送られる必要がありますので、「マクロコスモス」の適用中には発動できません。"),
];
