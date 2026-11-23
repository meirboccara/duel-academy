import type { SourceRecord } from "./sources";

/**
 * Step 5 (negation): the rules cited by the tests in test/rules/negation*.test.ts. Quotes were copied from the pages on
 * the date read and re-checked against the saved pages. Konami's Japanese Q&A (OCG) has no formal authority over the TCG;
 * where it is the only Konami page for a rule, the comment says so.
 */
const read = "2026-11-23";
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
/** A 補足情報 note on a card's Q&A page: no Q&A id. */
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });
const psct = (id: string, part: number, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: `https://www.yugioh-card.com/en/play/psct/psct-${part}/`, read, quote });

export const NEGATION_SOURCES: readonly SourceRecord[] = [
	// OCG only. M∀LICE <Q> HEARTS OF CRYPTER (its activation and effect cannot be negated while a monster is in its linked zone), filed under Infinite Impermanence.
	qa("cannot-be-negated-checked-at-resolution", 13631, 24353, "「無限泡影」や「心を見通す眼」のような、カード自体の効果を無効化する効果や、チェーンブロックを作らずに適用され続ける効果で無効化される場合、発動した「M∀LICE＜Q＞HEARTS OF CRYPTER」の効果処理時に、リンク先にモンスターが存在するかによって、無効化されるかが決まります。"),
	// OCG only. Filed under Solemn Judgment (cid 4861): Fairy Tail - Snow's effect after its Spell activation was negated by Solemn Judgment.
	qa("negated-card-not-from-field", 4861, 24277, "（魔法・罠カードの発動が無効になり墓地へ送られた場合、フィールドから墓地へ送られた扱いにはなりません。）"),
	// OCG only. Cosmic Blazer Dragon, filed under Solemn Strike (cid 12187): the cost (banishing itself) stays after Solemn Strike negated the activation.
	qa("negated-activation-cost-stays", 12187, 20639, "質問の状況のように、「コズミック・ブレイザー・ドラゴン」のモンスター効果の発動が「神の通告」によって無効になった場合でも、除外された「コズミック・ブレイザー・ドラゴン」はそのターンのエンドフェイズにメインモンスターゾーンに戻る事になります。"),
	// OCG only. WW-Glass Bell with Effect Veiler (cid 8933) chained to its effect: the same state as Infinite Impermanence's. Neither part of the effect applies.
	qa("negated-effect-on-chain-not-applied", 8933, 20294, "『デッキから「WW－グラス・ベル」以外の「WW」モンスター１体を手札に加える』効果は適用されず、『この効果の発動後、ターン終了時まで自分は風属性モンスターしか特殊召喚できない』効果も適用されません。"),
	// OCG only. Infinite Impermanence's own notes (cid 13631, dated 2021-05-15, page re-read 2026-11-23): the negation ends when the monster is turned face-down.
	notes("negated-monster-state", 13631, "■この効果が適用されたモンスターが裏側守備表示になった場合、『そのモンスターの効果をターン終了時まで無効にする』効果の適用はなくなります。"),
	// OCG only. Filed under Infinite Impermanence (cid 13631): its negation reaches effects activated in the Monster Zone, even when the monster itself is the cost.
	qa("impermanence-negates-effect-activated-in-monster-zone", 13631, 8398, "効果自体はモンスターゾーンで発動していますので、無効化されます。"),
	// OCG only. Same Q&A: an effect activated in the Graveyard (Critter's "sent to the GY") is not negated.
	qa("impermanence-only-monster-zone", 13631, 8398, "「無限泡影」の効果によって無効化される効果は、モンスターゾーンで発動する効果と、モンスターゾーンに存在する限り適用される永続効果のみとなります。"),
	// OCG only (no TCG page found). Dinomorphia Intact (cid 18539, Q&A dated 2023-02-01): paying half of an odd number of Life Points leaves the rounded-up half (125 LP leaves 63).
	qa("half-lp-odd-rounds-remaining-up", 18539, 23944, "奇数のライフポイントから半分を払った場合、残りのライフポイントが整数になるように四捨五入されます"),
	// FET chart: a Normal Summon is an action in the open game state (box A), and after it, an action that does not start a chain.
	{ id: "normal-summon-is-an-action", kind: "tcg-rule", url: "https://www.yugioh-card.com/en/play/fast-effect-timing/", read, quote: "Normal Summon (including Tribute Summon) Set a card Perform a Special Summon that does not start a Chain (including Xyz Summon, Synchro Summon) Change a monster’s Battle Position" },
	// OCG only. Obelisk the Tormentor's notes (cid 4998, dated 2024-03-23): "This card's Normal Summon cannot be negated" means no negating effect can be activated against it.
	notes("negate-summon-cannot-be-negated", 4998, "■このカードの召喚を無効にする効果はお互いに発動できません。"),
	// Solemn Judgment's notes (cid 4861, dated 2024-06-08), OCG: chained directly to a Spell/Trap *Card* activation, not to an effect of one that is not a card activation.
	notes("solemn-judgment-notes", 4861, "■魔法・罠カードのカードの発動に直接チェーンして発動します。（カードの発動を伴わない魔法・罠カードの効果の発動にチェーンして発動することはできません。）"),
	// PSCT part 6 (article dated 2011-08-08): activating a Spell/Trap Card is not activating the effect of one that is on the field.
	psct("activation-of-card-vs-effect", 6, "When you activate a Spell/Trap effect, you’re activating the effect of a card already on the field, usually a Continuous Spell or Continuous Trap."),
	// PSCT part 5 (article dated 2011-07-27): a Summon is negated by a card that negates a Summon; an activation negator does not answer it.
	psct("negate-summon-built-in-only", 5, "These effects can ONLY negate the actual Summon – they can’t negate an effect that Summons, or a Spell/Trap that Summons."),
	// Solemn Strike's notes (cid 12187, dated 2025-02-21), OCG: the Summon half answers Special Summons that make no chain block (Synchro, Xyz, Pendulum, Link...); the other half is chained directly to a monster effect.
	notes("solemn-strike-notes", 12187, "■モンスターの効果が発動した時に直接チェーンして発動できる効果です。"),
	// OCG only. Filed under Infinite Impermanence (cid 13631): a monster being Special Summoned, not yet successful, is not treated as on the field, so a player with no other card may activate it from the hand.
	qa("impermanence-no-cards-summon-not-on-field", 13631, 24096, "自分のモンスターはまだ特殊召喚に成功していませんので、フィールドに存在する扱いにはなっていません。"),
	// OCG only. ABC-Dragon Buster, filed under Solemn Strike (cid 12187): a Special Summon negated and the monster destroyed; it is not treated as sent from the field.
	qa("negated-summon-not-from-field", 12187, 6216, "破壊され墓地へ送られますが、フィールドから墓地へ送られた扱いとはならず"),
	// OCG only, Infinite Impermanence's notes (cid 13631, dated 2021-05-15, page re-read 2026-11-23): what cannot be targeted.
	notes("impermanence-target-limits", 13631, "ただし、デュアルモンスター以外の通常モンスター（モンスタートークンを含む）や、すでに効果が無効化されているモンスターを対象として発動することはできません。"),
	// Same notes: the hand activation, and in either turn.
	notes("impermanence-hand-activation", 13631, "■セットされているこのカードを発動する方法に加え、自分フィールドにカードが存在しない場合には、このカードを手札から魔法＆罠ゾーンに表側表示で置いて発動することができます。"),
	notes("impermanence-hand-either-turn", 13631, "■自分のターンでも相手のターンでもこの方法で発動できます。"),
	// OCG only. M∀LICE <Q> HEARTS OF CRYPTER, filed under Infinite Impermanence (cid 13631): a negation that makes a chain block reads the immunity when it resolves. Two kinds: negate the activation ...
	qa("cannot-negate-activation-read-when-negator-resolves", 13631, 24353, "「フルール・ド・バロネス」のようなチェーンブロックを作り、効果の発動を無効にする効果の場合、発動を無効にする効果の処理時に、リンク先にモンスターが存在するかによって、無効化されるかが決まります。"),
	// ... and negate the effect.
	qa("cannot-negate-effect-read-when-negator-resolves", 13631, 24353, "「鎖縛竜ザレン」のようなチェーンブロックを作り、発動した効果を無効にする効果の場合、効果を無効にする効果の処理時に、リンク先にモンスターが存在するかによって、無効化されるかが決まります。"),
	// OCG only. サブテラーの決戦 (a card that makes some activated effects not negated), filed under Solemn Strike (cid 12187): "activated effects cannot be negated" does not stop the activation itself from being negated.
	qa("effect-immunity-not-activation-immunity", 12187, 21378, "「サブテラー」カードの効果の発動自体が無効にならない、というものではありません。"),
	// OCG only. Dynawrestler Marshalanga, filed under Solemn Strike (cid 12187): the monster whose effect was activated from the hand was already sent to the Graveyard as the cost.
	qa("hand-effect-negated-card-already-in-graveyard", 12187, 22418, "手札で発動した「ダイナレスラー・マーシャルアンガ」のモンスター効果の発動が無効になった場合でも、その「ダイナレスラー・マーシャルアンガ」は、自身の効果を発動するために墓地へ送られていますので"),
	// RB10, "Normal Summon / Set" (the turn's actions): one Normal Summon or Set a turn.
	{ id: "normal-summon-once-per-turn", kind: "tcg-rule", url: "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf", read, quote: "There is no limit to the number of times you can Flip Summon or Special Summon during a turn, but you can only Normal Summon or Set a monster (including a Tribute Summon) once per turn." },
];
