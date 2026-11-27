import type { CardSources } from "../coverage";
import { type Duel, moveCard } from "../duel";
import { type CardDef } from "../effects";
import { breakEffect } from "../events";
import { addModifier, unaffectedBy } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { banishTemporarily } from "../temporary";
import { isEffectMonster } from "./helpers";
import { cardsOnField, faceUpMonsters, stillTargeted } from "./sky-striker-targets";

const NAME = "S:P Little Knight";
/** The frames that are "a Fusion, Synchro, Xyz, or Link Monster" (read from the printed frame of each material: a monster treated as another kind is not modelled). */
const EXTRA_DECK_FRAMES: readonly string[] = ["fusion", "synchro", "xyz", "link"];

/** "1 card on the field or in either GY": any card of either field, face-up or face-down, and any card of either Graveyard. */
const toBanish = (duel: Duel): number[] => [...cardsOnField(duel), ...duel.piles.you.graveyard, ...duel.piles.rival.graveyard];

/**
 * DARK Warrior Link 2 (arrows at the left and the right), 1600 ATK. "2 Effect Monsters. If this card is Link Summoned using a Fusion, Synchro, Xyz, or Link
 * Monster as material: You can target 1 card on the field or in either GY; banish it, also your monsters cannot attack directly this turn. When your
 * opponent activates a card or effect (Quick Effect): You can target 2 face-up monsters on the field, including a monster you control; banish both until the
 * End Phase. You can only use each effect of "S:P Little Knight" once per turn." No Konami page lists an archetype for it.
 *
 * - Procedure: 2 Effect Monsters (`isEffectMonster`: not a Normal Monster, with effects).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone, for a Link Summon of the card with at least one material whose printed frame is Fusion,
 *   Synchro, Xyz or Link (`summoned.materials`, S4 of docs/rules-core/sky-striker-gaps.md); the player who controls the card after the Chain activates it
 *   (fid 24016). It may be activated in a turn when a monster of the player already attacked directly (notes). It targets 1 card of either field, or of either
 *   Graveyard, itself included, and banishes it face-up, a face-down card too (notes). When it resolves, the restriction follows the banishment whether or not
 *   the card was banished, unless the effect was negated (notes): the player's monsters cannot attack directly for the rest of the turn, those that come to the
 *   Monster Zone later too, but not a monster that is unaffected by this card's effect (notes: unaffected by monster effects). A target that is gone at resolution is
 *   simply not banished (a banishment that did not take): the restriction still applies.
 * - Second effect: a Quick Effect of the Monster Zone, chained directly to the activation of a card or effect of the opponent (the link on top of the chain),
 *   not in the Damage Step (notes). It targets 2 face-up monsters on the field, at least one the player controls (`targetCheck`, S8). When it resolves both
 *   targets must still be in the Monster Zone, else nothing is done (notes); a target that was turned face-down meanwhile is banished face-down (notes), and
 *   `stillTargeted` reads it as the same card; a target that is unaffected by the effect stays and the other is banished (notes). They come back in the End Phase
 *   (S2, `banishTemporarily`): each to the Main Monster Zone of the player who controlled it, who chooses the zone (fid 8571), in the position it had; all the
 *   monsters that can come back do so at the same time and the others are placed in the Graveyard, not sent there (fid 24001), with one zone for two the player
 *   picks one (fid 24029); not a Special Summon, and a monster not properly Summoned also comes back (fid 11586, case C).
 * - Each effect once per turn, by name, one use each.
 */
export const SP_LITTLE_KNIGHT: CardDef = {
	code: "sp-little-knight",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Warrior", frame: "link", link: 2, arrows: ["left", "right"], atk: 1600, mentions: [NAME] },
	procedure: { kind: "link", materials: { min: 2, max: 2, filter: (duel, card) => isEffectMonster(duel, card.id) } },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["banish"],
			once: { scope: "name", key: "sp-little-knight-1" },
			target: (duel) => toBanish(duel),
			event: (duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.kind === "link" && event.card.id === card.id && (event.materials ?? []).some((material) => EXTRA_DECK_FRAMES.includes(duel.defs[material.code]?.facts?.frame ?? "")),
			operation: (duel, link) => {
				const [target] = stillTargeted(duel, link);
				// The restriction follows whether or not the card was banished, a target that is gone included, as long as the effect was not negated (notes).
				const banished = target ? moveCard(duel, target.id, { zone: "banished", face: "up", effect: link }) : duel;
				const source = { card: link.card, player: link.player, effect: link.effect };
				return addModifier(breakEffect(banished), { affects: () => false, until: duel.turn.number, layer: { kind: "lock", what: "attack-directly", who: link.player, only: (board, monster) => !unaffectedBy(board, monster.id, source), describe: "with your monsters" } });
			},
		},
		{
			type: "quick",
			categories: ["banish"],
			once: { scope: "name", key: "sp-little-knight-2" },
			condition: (duel, { player }) => {
				const top = duel.chain[duel.chain.length - 1];
				return top !== undefined && top.player !== player;
			},
			target: (duel) => faceUpMonsters(duel),
			targetCount: { min: 2, max: 2 },
			targetCheck: (duel, { player }, targets) => targets.some((id) => duel.cards[id]!.controller === player),
			operation: (duel, link) => {
				const targets = stillTargeted(duel, link);
				if (targets.length !== 2 || targets.some((target) => !target || target.zone !== "monster")) return duel;
				return banishTemporarily(duel, targets.map((target) => target!.id), link, { phase: "end", turn: duel.turn.number });
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=19188&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(19188, "en");

export const SP_LITTLE_KNIGHT_SOURCES: CardSources = {
	code: "sp-little-knight",
	cid: 19188,
	french: {
		text: "2 Monstres à Effet\nSi cette carte est Invoquée par Lien en utilisant un Monstre Fusion, Synchro, Xyz ou Lien comme Matériel : vous pouvez cibler 1 carte sur le Terrain ou dans l'un des Cimetières ; bannissez-la, et aussi, vos monstres ne peuvent pas attaquer directement ce tour. Lorsque votre adversaire active une carte ou un effet (Effet Rapide) : vous pouvez cibler 2 monstres face recto sur le Terrain (un monstre que vous contrôlez inclus) ; jusqu'à la End Phase, bannissez-les tous les deux. Vous ne pouvez utiliser chaque effet de \"S:P Petite Chevaleresse\" qu'une fois par tour.",
		url: konamiCardUrl(19188, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 19188, url: EN, read: "2026-11-26", quote: "DARK Link 2 ATK 1600 DEF - Warrior ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 19188, url: EN, read: "2026-11-26", quote: "2 Effect Monsters" },
		{ id: "banish", kind: "card-text", cid: 19188, url: EN, read: "2026-11-26", quote: "If this card is Link Summoned using a Fusion, Synchro, Xyz, or Link Monster as material: You can target 1 card on the field or in either GY; banish it, also your monsters cannot attack directly this turn." },
		{ id: "blink", kind: "card-text", cid: 19188, url: EN, read: "2026-11-26", quote: "When your opponent activates a card or effect (Quick Effect): You can target 2 face-up monsters on the field, including a monster you control; banish both until the End Phase." },
		{ id: "once", kind: "card-text", cid: 19188, url: EN, read: "2026-11-26", quote: "You can only use each effect of \"S:P Little Knight\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2023-07-22), page read 2026-11-26.
		{ id: "notes-banish-trigger", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-banish-after-attack", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■既に自分のモンスターが直接攻撃を行ったターンでも発動できます。（『このターン、自分のモンスターは直接攻撃できない』は効果処理であり、効果処理以降ターン終了時まで適用されます。）" },
		{ id: "notes-banish-then-lock", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■この効果の処理は『そのカードを除外する』で完了です。この効果の処理後、ただちに『このターン、自分のモンスターは直接攻撃できない』効果を適用します。" },
		{ id: "notes-lock-without-banish", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■カードを除外する処理に成功したかに関わらず、この効果が無効にならなかったのであれば、『このターン、自分のモンスターは直接攻撃できない』状態になります。" },
		{ id: "notes-banish-face-down", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■フィールドに裏側表示で存在するカードを除外する場合、そのカードは表側表示で除外されます。" },
		{ id: "notes-lock-continuous", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■『このターン、自分のモンスターは直接攻撃できない』効果は、ターン中、自分のモンスターゾーンに存在するモンスターに対して、継続的に適用されます。（モンスターの効果を受けないモンスターは直接攻撃できます。この効果の適用後に自分のモンスターゾーンに存在するようになったモンスターに対しても適用されます。）" },
		{ id: "notes-blink-quick", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-blink-no-damage-step", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-blink-chain-directly", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■相手の効果が発動した時に、直接チェーンして発動できます。" },
		{ id: "notes-blink-both-or-nothing", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のモンスター２体がモンスターゾーンに存在する場合、『そのモンスター２体をエンドフェイズまで除外する』処理を行います。少なくとも片方が対象から外れた場合、処理は行われません。" },
		{ id: "notes-blink-face-down", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のモンスターが裏側守備表示になっている場合、そのモンスターは裏側表示で除外され、エンドフェイズに裏側守備表示でメインモンスターゾーンに戻ります。" },
		{ id: "notes-blink-unaffected", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■『そのモンスター２体をエンドフェイズまで除外する』処理を行う際に、対象のカードのうち片方がこの効果を受けない場合、もう片方のカードだけがエンドフェイズまで除外されます。" },
		{ id: "notes-blink-return", kind: "jp-notes", cid: 19188, url: NOTES, read: "2026-11-26", quote: "■この効果で除外されたモンスターはエンドフェイズに、除外された時の表示形式で、除外された時のコントローラーのメインモンスターゾーンに戻ります。その際にチェーンブロックは作られません。（これは特殊召喚ではありません。）" },
		// OCG only. Konami's Q&A of this card's list (15 entries), pages read 2026-11-26: fids 24016 (2023-10-18), 8571 (2026-04-09), 24001 (2023-12-02), 24029 (2023-11-23),
		// 11586 (2024-06-30), 16743 (2026-07-17), 17476 (2026-07-31), 24032 (2026-09-13) and 11533 (2024-08-29). Fid 23467 (2026-08-20) was opened after the review: a monster Special Summoned from the Graveyard and returned from a temporary banishment (this card's second effect) is still one
		// Special Summoned from the Graveyard. Not opened: the entries about cards of neither list.
		{ id: "qa-controller-after-chain-24016", kind: "jp-qa", cid: 19188, fid: 24016, url: qa(24016), read: "2026-11-26", quote: "一連のチェーン処理後（その「S：Pリトルナイト」の誘発効果を発動可能なタイミング）におけるコントローラーである、自分が発動できます。" },
		{ id: "qa-zone-8571", kind: "jp-qa", cid: 19188, fid: 8571, url: qa(8571), read: "2026-11-26", quote: "相手が決めます。" },
		{ id: "qa-return-together-24001", kind: "jp-qa", cid: 19188, fid: 24001, url: qa(24001), read: "2026-11-26", quote: "同一の効果にて一時的に除外されている複数体のモンスターをフィールドに戻す際には、まずそのそれぞれについてフィールドに戻せるかどうかを確認します。戻せるモンスターが複数存在する場合にはそのすべてを同時にフィールドに戻し、戻せないモンスターは墓地へ置かれます。" },
		{ id: "qa-placed-not-sent-24001", kind: "jp-qa", cid: 19188, fid: 24001, url: qa(24001), read: "2026-11-26", quote: "そのため、自分のモンスターはフィールドに戻り、相手のモンスターは墓地へ置かれます。（相手のモンスターは墓地へ送られた扱いになりません。）" },
		{ id: "qa-one-zone-24029", kind: "jp-qa", cid: 19188, fid: 24029, url: qa(24029), read: "2026-11-26", quote: "自分がモンスターゾーンに戻すモンスターを１体選び、そのモンスターをモンスターゾーンに戻し、選ばなかったモンスターは墓地に置かれます。" },
		{ id: "qa-not-properly-summoned-11586", kind: "jp-qa", cid: 19188, fid: 11586, url: qa(11586), read: "2026-11-26", quote: "（C）どちらも除外され、エンドフェイズにメインモンスターゾーンに戻ります。（これは特殊召喚ではありません。）" },
		{ id: "qa-token-11586", kind: "jp-qa", cid: 19188, fid: 11586, url: qa(11586), read: "2026-11-26", quote: "（A）対象としたモンスタートークンは消滅し、「S：Pリトルナイト」のみが除外され、エンドフェイズにメインモンスターゾーンに戻ります。" },
		{ id: "qa-trap-monster-11586", kind: "jp-qa", cid: 19188, fid: 11586, url: qa(11586), read: "2026-11-26", quote: "（B）どちらも除外され、エンドフェイズにメインモンスターゾーンに戻りますが、「ホールティアの蟲惑魔」はただちに墓地へ送られます。" },
		{ id: "qa-extra-deck-kept-16743", kind: "jp-qa", cid: 19188, fid: 16743, url: qa(16743), read: "2026-11-26", quote: "エクストラデッキから特殊召喚したモンスターが、一時的に除外されてモンスターゾーンに戻っている場合、そのモンスターは引き続き『EXデッキから特殊召喚されたモンスター』として扱います。" },
		{ id: "qa-control-no-duration-17476", kind: "jp-qa", cid: 19188, fid: 17476, url: qa(17476), read: "2026-11-26", quote: "「No.11 ビッグ・アイ」のように、コントロールを得る期間が定められていない効果については、一時的に除外された場合でも、相手にコントロールが戻ることはありません。" },
		{ id: "qa-control-duration-17476", kind: "jp-qa", cid: 19188, fid: 17476, url: qa(17476), read: "2026-11-26", quote: "「心変わり」のように、コントロールを得る期間が定められている効果については、一時的に除外された時点で効果の適用が終了し、モンスターゾーンに戻りますと、直ちに相手にコントロールが戻ります。" },
		{ id: "qa-graveyard-summon-kept-23467", kind: "jp-qa", cid: 19188, fid: 23467, url: qa(23467), read: "2026-11-26", quote: "墓地から特殊召喚したモンスターが、一時的に除外されてモンスターゾーンに戻っている場合、そのモンスターは引き続き『墓地から特殊召喚されたモンスター』として扱います。" },
		{ id: "qa-new-card-24032", kind: "jp-qa", cid: 19188, fid: 24032, url: qa(24032), read: "2026-11-26", quote: "「閃刀姫－シズク」の②の効果を発動するには、特殊召喚されてからエンドフェイズまで、モンスターゾーンに表側表示で存在し続ける必要があります。" },
		{ id: "qa-end-phase-owed-11533", kind: "jp-qa", cid: 19188, fid: 11533, url: qa(11533), read: "2026-11-26", quote: "その場合、再び相手が優先権を得た状態になり、必ず行わなければならない「S：Pリトルナイト」をフィールドに戻す処理を相手は行う必要があります。" },
	],
	effects: ["facts", "procedure", "banish", "blink", "once"],
	rulings: [
		{ source: "notes-banish-trigger" },
		{ source: "notes-banish-after-attack" },
		{ source: "notes-banish-then-lock" },
		{ source: "notes-lock-without-banish" },
		{ source: "notes-banish-face-down" },
		{ source: "notes-lock-continuous" },
		{ source: "notes-blink-quick" },
		{ source: "notes-blink-no-damage-step" },
		{ source: "notes-blink-chain-directly" },
		{ source: "notes-blink-both-or-nothing" },
		{ source: "notes-blink-face-down" },
		{ source: "notes-blink-unaffected" },
		{ source: "notes-blink-return" },
		{ source: "qa-controller-after-chain-24016" },
		{ source: "qa-zone-8571" },
		{ source: "qa-return-together-24001" },
		{ source: "qa-placed-not-sent-24001" },
		{ source: "qa-one-zone-24029" },
		{ source: "qa-not-properly-summoned-11586" },
		{ source: "qa-token-11586", pending: "Monster Tokens are not in either list, and the core has none" },
		{ source: "qa-trap-monster-11586", pending: "a monster whose original type is a Trap Card (the Traptrix example) is in neither list, and the core does not have that kind of monster" },
		{ source: "qa-extra-deck-kept-16743" },
		{ source: "qa-control-no-duration-17476" },
		{ source: "qa-control-duration-17476" },
		{ source: "qa-graveyard-summon-kept-23467" },
		{ source: "qa-new-card-24032" },
		{ source: "qa-end-phase-owed-11533" },
	],
};
