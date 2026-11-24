import { konamiCardUrl, type SourceRecord } from "./sources";

/**
 * Second real-deck readiness slice (Synchro Summons with 2 or more Tuners, a Normal Summon in addition to the Normal Summon/Set,
 * monsters Special Summoned at the same time, an effect replaced on the chain): the Konami pages cited by
 * test/rules/{synchro-tuners,extra-normal-summon,summon-together,effect-replacement}.test.ts, read on 2026-11-24. The card texts are
 * Konami's TCG database (English); the notes and Q&A are Konami's Japanese database (OCG only: no formal authority over the TCG),
 * reached from the pages of the cards of the two exact lists that use each mechanic: Blue-Eyes Ultimate Spirit Dragon (cid 20607),
 * Mausoleum of White (cid 12331), Sky Striker Ace = Zero (cid 21460), Blue-Eyes Spirit Dragon (cid 12324) and Prototype Sky Striker
 * Ace - Amatsu (cid 21600). None of these cards is written yet: the tests use made-up cards with the same wording.
 */
const read = "2026-11-24";
const text = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "card-text", cid, url: konamiCardUrl(cid, "en"), read, quote });
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });

export const SECOND_READINESS_SOURCES: readonly SourceRecord[] = [
	// Blue-Eyes Ultimate Spirit Dragon's material line.
	text("synchro-two-or-more-tuners", 20607, "2+ Tuners + 1 non-Tuner \"Blue-Eyes\" monster"),

	// Mausoleum of White: its text, and its notes (dated 2016-01-09) on the first effect.
	text("extra-normal-summon-text", 12331, "During your Main Phase, you can Normal Summon 1 Level 1 LIGHT Tuner in addition to your Normal Summon/Set. (You can only gain this effect once per turn.)"),
	notes("extra-normal-summon-either-order", 12331, "■通常召喚とこの効果による召喚が両方行える場合、どちらから先に行っても構いません。"),
	notes("extra-normal-summon-declared", 12331, "■この効果による召喚を行う際には、この効果によって召喚を行うことを相手に伝えます。"),
	notes("extra-normal-summon-one-per-turn", 12331, "■“通常召喚に加えて召喚を行う効果”が複数適用されている場合でも、そのターン中にはそれらの効果のうち１つしか適用できません。（１つを適用した場合、そのターンには他の“通常召喚に加えて召喚を行う効果”を適用できません。）"),
	notes("extra-normal-summon-controller-only", 12331, "■このカードのコントローラーのみが使用できます。"),
	// Page dated 2026-02-28, listed under Mausoleum of White: after one such Summon, another effect that gives one cannot be activated.
	qa("extra-normal-summon-blocks-others", 12331, 24288, "発動できません。“通常召喚に加えて召喚を行う効果”を適用して召喚を行った場合、そのターンには他の“通常召喚に加えて召喚を行う効果”は発動できなくなります。"),

	// Sky Striker Ace = Zero's notes (dated 2025-04-26) on "Special Summon 1 ... and 1 ..., then you can destroy 1 card on the field".
	notes("summon-together-needs-both", 21460, "の両方を特殊召喚できる状況で発動できます。（少なくとも一方が特殊召喚できない場合には発動できません。）"),
	notes("summon-together-both-or-nothing", 21460, "の内、少なくとも一方を特殊召喚できない場合は何も処理は行いません。"),
	notes("summon-together-then-destroy", 21460, "■特殊召喚する処理と破壊する処理を両方行う場合、それらは同時に行われません。"),
	// Blue-Eyes Spirit Dragon: its text, and its Q&A (page dated 2024-09-19) on effects that Special Summon 2 or more monsters at once.
	text("summon-together-lock-text", 12324, "Neither player can Special Summon 2 or more monsters at the same time."),
	qa("summon-together-lock", 12324, 18176, "「青眼の精霊龍」の①の永続効果が適用されている場合、お互いに、必ず２体以上を同時に特殊召喚する効果は発動できなくなります。"),
	qa("summon-together-lock-at-resolution", 12324, 18176, "「スケープ・ゴート」の発動にチェーンして発動した他の効果によって「青眼の精霊龍」が特殊召喚された場合、羊トークンは１体も特殊召喚されません。"),

	// Prototype Sky Striker Ace - Amatsu: its text, its notes (dated 2025-04-21) and two Q&A pages of the same date.
	text("replace-effect-text", 21600, "When a monster your opponent controls with 2000 or more ATK activates its effect (Quick Effect): You can make the activated effect become \"Destroy 1 \"Sky Striker Ace\" Link Monster your opponent controls\"."),
	notes("replace-effect-not-applied-to-monster", 21600, "■モンスターに適用する効果ではありません。(モンスター効果を受けない状態のモンスターの効果も、『相手フィールドの「閃刀姫」Lモンスター１体を破壊する』に変更されます。)"),
	notes("replace-effect-nothing-done", 21600, "■変更された効果の処理時に自分フィールドに「閃刀姫」Lモンスターが存在しない場合、本来の効果処理も『相手フィールドの「閃刀姫」Lモンスター１体を破壊する』処理も行われません。"),
	notes("replace-effect-opponent-chooses", 21600, "■破壊する『「閃刀姫」Lモンスター１体』は、この効果を発動したプレイヤーから見て相手が選びます。"),
	qa("replace-effect-still-opponents-effect", 21600, 24166, "発動できます。相手が発動した効果によって自分の「閃刀姫」リンクモンスターが破壊されていますので、『自分フィールドの「閃刀姫」Lモンスターが相手の効果でフィールドから離れた場合』の条件は満たされます。"),
	qa("replace-effect-protected-choice", 21600, 24165, "できます。（処理時に、効果を受けない「閃刀姫」リンクモンスターや、効果で破壊されない「閃刀姫」リンクモンスターを選ぶこともできます。）結果的に、相手が発動した効果は『相手フィールドの「閃刀姫」Lモンスター１体を破壊する』に変更され、破壊するカードとして選ばれた「試号閃刀姫－アマツ」はモンスターゾーンに残り、処理が完了します。"),
];
