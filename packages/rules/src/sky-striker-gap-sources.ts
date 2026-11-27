import { konamiCardUrl, type SourceRecord } from "./sources";

/**
 * The pages cited by the "Sky Striker gaps" core slice of 2026-11-26 (docs/rules-core/sky-striker-gaps.md, S1 to S8; tests:
 * test/rules/{left-by-effect,temporary-banishment,end-phase-order,summon-materials,activation-stats,target-check}.test.ts): a monster
 * that leaves the field by an effect, temporary banishment, "cannot be used as Link Material", the materials of a Summon, the End
 * Phase's order of effects and processes, the ATK of a monster when its effect was activated, and a rule over a combination of targets.
 * Every page was read on 2026-11-26 (the audit's copies; fid 24164 fetched that day). The Japanese notes and Q&A are OCG only: they
 * have no formal authority over the TCG. Each Q&A is filed under a card of the Sky Striker list whose Q&A list holds it. None of
 * these cards is written yet: the tests use made-up cards with the same wording.
 */
const read = "2026-11-26";
const text = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "card-text", cid, url: konamiCardUrl(cid, "en"), read, quote });
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });

const RAYE = 13670;
const SHIZUKU = 13669;
const ZEKE = 14947;
const SP_LITTLE_KNIGHT = 19188;
const ZERO = 21460;
const AMATSU = 21600;
const ECCLESIA = 22144;
const DOGMA = 22090;

export const SKY_STRIKER_GAP_SOURCES: readonly SourceRecord[] = [
	// S1. Fid 23614 (page dated 2026-11-06; it lists Sky Striker Ace - Raye ② by name): what "left the field by [an] effect" means.
	qa("left-field-by-effect-processing", RAYE, 23614, "モンスターゾーンに存在するカードが通常罠カードの効果の処理によってフィールドに存在しなくなった場合が、『自分の通常罠カードの効果でモンスターがフィールドから離れた場合』にあたります。"),
	qa("left-field-by-effect-kinds", RAYE, 23614, "具体的には、破壊する効果や除外する効果、手札に戻す効果やデッキに戻す効果によって、モンスターがフィールドに存在しなくなった場合、モンスターがフィールドから離れたことになります。"),
	qa("left-field-not-spell-zone-or-material", RAYE, 23614, "原則として、フィールドのモンスターが魔法＆罠ゾーンに移動した場合や、フィールドのカードをエクシーズモンスターのエクシーズ素材にした場合には、モンスターがフィールドを離れたことになりません。"),
	// Fid 23445 (2021-11-20): a "Sky Striker" Link Monster used by the opponent's effect as the material of a Link Summon.
	qa("left-field-as-material-not-by-effect", RAYE, 23445, "これは『相手の効果によってフィールドから離れた』状況として扱いません。"),
	// Fid 8161 (2018-03-30): whose monster it was is the player who controlled it then, not its owner.
	qa("left-field-controller-then", RAYE, 8161, "「閃刀姫－カガリ」が戦闘で破壊される際にコントロールしていたプレイヤー（＝質問の状況の場合、自分）が、自身の墓地に存在する「閃刀姫－レイ」の『このカードを特殊召喚する』モンスター効果を発動する事ができます。"),

	// S2. Temporary banishment. Sky Striker Ace - Zeke's notes on ① ("banish it until your opponent's next End Phase").
	notes("temporary-banishment-return", ZEKE, "■この効果で除外されたモンスターは次の相手のエンドフェイズに、除外された時の表示形式で、除外された時のコントローラーのメインモンスターゾーンに戻ります。その際にチェーンブロックは作られません。（これは特殊召喚ではありません。）"),
	// S:P Little Knight's notes on ② ("banish both until the End Phase").
	notes("temporary-banishment-face-down", SP_LITTLE_KNIGHT, "■処理時に、対象のモンスターが裏側守備表示になっている場合、そのモンスターは裏側表示で除外され、エンドフェイズに裏側守備表示でメインモンスターゾーンに戻ります。"),
	notes("temporary-banishment-unaffected-stays", SP_LITTLE_KNIGHT, "■『そのモンスター２体をエンドフェイズまで除外する』処理を行う際に、対象のカードのうち片方がこの効果を受けない場合、もう片方のカードだけがエンドフェイズまで除外されます。"),
	// Ecclesia and the Dark Dragon's notes on ① ("banish this card (until the End Phase)").
	notes("temporary-banishment-no-zone-graveyard", ECCLESIA, "■エンドフェイズにこのカードをフィールドに戻す際に自分の使用可能なメインモンスターゾーンがない場合、このカードは除外状態から墓地に置かれます。"),
	// Fid 8571 (2026-04-09; it lists Zeke ① by name): who chooses the zone the opponent's monster comes back to.
	qa("temporary-banishment-zone-chosen-by-controller", SP_LITTLE_KNIGHT, 8571, "相手が決めます。"),
	// Fid 24001 (2023-12-02): the monsters banished by one effect.
	qa("temporary-banishment-return-together", SP_LITTLE_KNIGHT, 24001, "同一の効果にて一時的に除外されている複数体のモンスターをフィールドに戻す際には、まずそのそれぞれについてフィールドに戻せるかどうかを確認します。戻せるモンスターが複数存在する場合にはそのすべてを同時にフィールドに戻し、戻せないモンスターは墓地へ置かれます。"),
	qa("temporary-banishment-placed-not-sent", SP_LITTLE_KNIGHT, 24001, "そのため、自分のモンスターはフィールドに戻り、相手のモンスターは墓地へ置かれます。（相手のモンスターは墓地へ送られた扱いになりません。）"),
	// Fid 24029 (2023-11-23): two monsters of one player, one usable Monster Zone.
	qa("temporary-banishment-one-zone-pick", SP_LITTLE_KNIGHT, 24029, "自分がモンスターゾーンに戻すモンスターを１体選び、そのモンスターをモンスターゾーンに戻し、選ばなかったモンスターは墓地に置かれます。"),
	// Fid 11586 (2024-06-30), case C: a Ritual, Fusion, Synchro, Xyz or Link Monster that was not properly Summoned.
	qa("temporary-banishment-not-a-summon", SP_LITTLE_KNIGHT, 11586, "（C）どちらも除外され、エンドフェイズにメインモンスターゾーンに戻ります。（これは特殊召喚ではありません。）"),
	// Fid 16743 (2026-07-17): "a monster Special Summoned from the Extra Deck", (A) turned face-down, (B) temporarily banished and back.
	qa("from-extra-deck-lost-face-down", SP_LITTLE_KNIGHT, 16743, "エクストラデッキから表側表示で特殊召喚したモンスターが、他の効果によって裏側守備表示になった場合、そのモンスターは『EXデッキから特殊召喚されたモンスター』としては扱わなくなります。その後に表側表示に戻った場合も同様です。"),
	qa("from-extra-deck-kept-through-temporary-banishment", SP_LITTLE_KNIGHT, 16743, "エクストラデッキから特殊召喚したモンスターが、一時的に除外されてモンスターゾーンに戻っている場合、そのモンスターは引き続き『EXデッキから特殊召喚されたモンスター』として扱います。"),
	// Fid 17476 (2026-07-31): a monster whose control was taken, then temporarily banished.
	qa("temporary-banishment-control-without-duration-kept", SP_LITTLE_KNIGHT, 17476, "「No.11 ビッグ・アイ」のように、コントロールを得る期間が定められていない効果については、一時的に除外された場合でも、相手にコントロールが戻ることはありません。"),
	qa("temporary-banishment-control-with-duration-ends", SP_LITTLE_KNIGHT, 17476, "「心変わり」のように、コントロールを得る期間が定められている効果については、一時的に除外された時点で効果の適用が終了し、モンスターゾーンに戻りますと、直ちに相手にコントロールが戻ります。"),
	// Fid 24032 (2026-09-13): Sky Striker Ace - Shizuku, Special Summoned this turn, temporarily banished and back in the End Phase.
	qa("summoned-this-turn-needs-face-up-since", SP_LITTLE_KNIGHT, 24032, "「閃刀姫－シズク」の②の効果を発動するには、特殊召喚されてからエンドフェイズまで、モンスターゾーンに表側表示で存在し続ける必要があります。"),

	// S3. Sky Striker Ace = Zero's notes on "You can only Special Summon ... once per turn, and this card cannot be used as Link Material".
	notes("cannot-be-link-material-not-an-effect", ZERO, "■効果として扱いません。"),
	notes("cannot-be-link-material-while-negated", ZERO, "■このカードの効果が無効化されている状況でも、リンク素材にできません。"),

	// S4. S:P Little Knight ①, and fid 24016 (2023-10-18): the monster was Link Summoned in a chain and its control taken later in it.
	text("link-summoned-using-text", SP_LITTLE_KNIGHT, "If this card is Link Summoned using a Fusion, Synchro, Xyz, or Link Monster as material: You can target 1 card on the field or in either GY; banish it, also your monsters cannot attack directly this turn."),
	qa("summon-trigger-controller-after-chain", SP_LITTLE_KNIGHT, 24016, "一連のチェーン処理後（その「S：Pリトルナイト」の誘発効果を発動可能なタイミング）におけるコントローラーである、自分が発動できます。"),

	// S5. Fid 11533 (2024-08-29, a basic-rules page listed under S:P Little Knight): the order of what is done in a Standby or End Phase.
	qa("end-phase-turn-player-first", SP_LITTLE_KNIGHT, 11533, "各フェイズの最初に優先権を持っているのはターンプレイヤーであるため、まずターンプレイヤーから先に発動・処理を行うことができます。行いたい処理が複数ある場合は、好きな順番でその発動・処理を行うことができます。"),
	qa("end-phase-other-player-next", SP_LITTLE_KNIGHT, 11533, "次にターンプレイヤーが優先権を放棄し、相手プレイヤーが優先権を得た場合は、同様に相手プレイヤーも好きな順番で発動・処理を行うことができます。"),
	qa("end-phase-mandatory-process-owed", SP_LITTLE_KNIGHT, 11533, "その場合、再び相手が優先権を得た状態になり、必ず行わなければならない「S：Pリトルナイト」をフィールドに戻す処理を相手は行う必要があります。"),
	qa("end-phase-optional-after-mandatory", SP_LITTLE_KNIGHT, 11533, "また、必ず行わなければならない処理が全て完了した後でも、任意で行うことができる処理がある場合は、その発動・処理を優先権を得ているプレイヤーから行うことができます。"),

	// The Dragon that Devours the Dogma's notes on ③ (2025-10-25), page read 2026-11-26: "sent to the GY this turn" (`CardInstance.sentTurn`).
	notes("sent-this-turn-stayed-in-graveyard", DOGMA, "■このカードが墓地へ送られ、そのままそのターンのエンドフェイズまで墓地に存在し続けた場合に発動できます。なお、エンドフェイズに墓地へ送られた場合、そのエンドフェイズに発動できます。"),

	// S6. Fid 11555 (2018-04-12): Mind Control on a Sky Striker Ace - Shizuku the opponent Special Summoned this turn.
	qa("control-return-ordered-by-taker", SHIZUKU, 11555, "質問の状況の場合、エンドフェイズに「精神操作」の効果が適用されている「閃刀姫－シズク」のコントロールを相手に戻す処理と、「閃刀姫－シズク」の『デッキから、同名カードが自分の墓地に存在しない「閃刀」魔法カード１枚を手札に加える』モンスター効果の発動の、どちらを先に行うか選ぶ事ができます。"),
	qa("control-return-then-controller-activates", SHIZUKU, 11555, "「閃刀姫－シズク」のコントロールを相手に戻す処理を先に行った場合は、「閃刀姫－シズク」のモンスター効果を相手プレイヤーが発動する事ができますが、自分が「閃刀姫－シズク」のモンスター効果の発動を行った後に、「閃刀姫－シズク」のコントロールを相手に戻した場合には、相手プレイヤーは「閃刀姫－シズク」のモンスター効果を発動する事はできません。"),

	// S7. Fid 24164 (2025-04-21): a monster with 2000 or more ATK that Tributes itself as the cost of its effect.
	qa("activating-monster-atk-before-cost", AMATSU, 24164, "「試号閃刀姫－アマツ」の①の効果を発動する場合、相手モンスターが効果を発動する際にコストとしてモンスターゾーンから離れる前の攻撃力を参照します。"),

	// S8. S:P Little Knight ②: a rule over the pair of targets, not over each one.
	text("targets-including-text", SP_LITTLE_KNIGHT, "When your opponent activates a card or effect (Quick Effect): You can target 2 face-up monsters on the field, including a monster you control; banish both until the End Phase."),
];
