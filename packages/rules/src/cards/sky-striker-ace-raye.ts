import type { CardSources } from "../coverage";
import type { Duel, Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { type GameEvent, leftFieldBy } from "../events";
import { belongsTo } from "../identity";
import { askSpecialSummon, canSpecialSummon, tribute } from "../procedures";
import { konamiCardUrl } from "../sources";
import { acesForExtraZone, EXTRA_MONSTER_ZONES } from "./sky-striker-helpers";

const NAME = "Sky Striker Ace - Raye";

/** "A face-up "Sky Striker Ace" Link Monster you control" as it was on the field (`before` of its `moved` event). */
const wasAceLink = (duel: Duel, event: Extract<GameEvent, { type: "moved" }>, player: Side): boolean =>
	event.before.zone === "monster" && event.before.face === "up" && event.before.controller === player && duel.defs[event.before.code]?.facts?.frame === "link" && belongsTo(duel, event.before.id, "Sky Striker Ace");

/**
 * "(Quick Effect): You can Tribute this card; Special Summon 1 "Sky Striker Ace" monster from your Extra Deck to the Extra Monster Zone. While this
 * card is in your GY, if a face-up "Sky Striker Ace" Link Monster you control is destroyed by battle, or leaves the field by an opponent's card
 * effect: You can Special Summon this card. You can only use each effect of "Sky Striker Ace - Raye" once per turn." A DARK Warrior Effect Monster of
 * Level 4, "Sky Striker" and "Sky Striker Ace" by its name.
 *
 * - First effect: a Quick Effect of the Monster Zone (notes), also in the opponent's turn, not in the Damage Step (notes: the core lets only effects
 *   that change ATK or DEF there). The cost is the Tribute of this card (a cost, so it is not "left by an effect"). It cannot be activated while the
 *   player has no Extra Monster Zone to Summon the monster to (`acesForExtraZone`: a player with a monster in one Extra Monster Zone cannot use the
 *   other, RB10 as the core reads it), nor when no "Sky Striker Ace" monster of the Extra Deck can be Special Summoned: one that "must be Link
 *   Summoned" is not a candidate (it is not a Link Summon: notes), nor one barred by its own once per turn (`summon.oncePerTurn`). The monster is
 *   chosen when it resolves (no target) and goes to an Extra Monster Zone, any that is free; it is not a Link Summon, so it is not properly Summoned.
 * - Second effect: an optional "if" Trigger Effect of the Graveyard, in the Damage Step too (notes). It is triggered by a face-up "Sky Striker Ace"
 *   Link Monster the player controlled, on the field, that was destroyed by battle (the move at the end of the Damage Step: Konami's Q&A fid 13241,
 *   Hayate's send after damage calculation counts) or that left the field by an opponent's card effect (`leftFieldBy`: destroyed, banished, returned,
 *   sent or Tributed by it, not used as a material of its Link Summon, not moved to a Spell & Trap Zone: fids 23445, 23614). Raye must be in the
 *   Graveyard before (the core never triggers a card that arrived with the event: notes). The player who controlled the monster when it left is the
 *   player who may use their Raye (fid 8161): the core reads `before.controller` against this card's controller. It Special Summons this very card,
 *   if it is still in the Graveyard and a zone is free (the effect is not offered otherwise).
 * - "Each effect once per turn": two uses by name, one for each effect.
 * - Q&A not modelled: fid 24289 (a Link Monster whose name was changed on the field counts by its name there: the core has no effective names), fid 21941
 *   ("Black Bird Close" answers Raye's Tribute effect: the card is absent), fids 24189 and 24184 (cards of neither list).
 */
export const SKY_STRIKER_ACE_RAYE: CardDef = {
	code: "sky-striker-ace-raye",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Warrior", level: 4, atk: 1500, def: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME] },
	effects: [
		{
			type: "quick",
			categories: ["special-summon"],
			once: { scope: "name", key: "sky-striker-ace-raye-summon" },
			condition: (duel, { player }) => acesForExtraZone(duel, player).length > 0,
			cost: (duel, { card }) => tribute(duel, [card.id]),
			operation: (duel, link) => ask(duel, link.player, acesForExtraZone(duel, link.player), (board, picked) => askSpecialSummon(board, link.player, picked, { zones: EXTRA_MONSTER_ZONES })),
		},
		{
			type: "trigger",
			range: "graveyard",
			timing: "if",
			// It Special Summons from the Graveyard: what answers an effect "that includes a Special Summon from the GY" (Konami's Q&A fid 23215, about Zero's effect), "Ghost Belle & Haunted Mansion" among them.
			categories: ["special-summon", "summon-from-graveyard"],
			once: { scope: "name", key: "sky-striker-ace-raye-revive" },
			condition: (duel, { player, card }) => canSpecialSummon(duel, player, card.id),
			event: (duel, event, { player }) => {
				if (event.type !== "moved" || !wasAceLink(duel, event, player)) return false;
				if (event.by === "battle" && event.reason === "destroyed") return true;
				const by = leftFieldBy(event);
				return by !== null && by.player !== event.before.controller;
			},
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				return now.zone === "graveyard" && now.moves === link.card.moves ? askSpecialSummon(duel, link.player, now.id) : duel;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13670&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(13670, "en");

export const SKY_STRIKER_ACE_RAYE_SOURCES: CardSources = {
	code: "sky-striker-ace-raye",
	cid: 13670,
	french: {
		text: "(Effet Rapide) : vous pouvez Sacrifier cette carte ; Invoquez Spécialement 1 monstre \"Assaut de l'Air - As\" depuis votre Extra Deck dans la Zone Monstre Extra. Tant que cette carte est dans votre Cimetière, si un Monstre Lien \"Assaut de l'Air - As\" face recto que vous contrôlez est détruit au combat ou quitte le Terrain par un effet de carte de l'adversaire : vous pouvez Invoquer Spécialement cette carte. Vous ne pouvez utiliser chaque effet de \"Assaut de l'Air - As - Raye\" qu'une fois par tour.",
		url: konamiCardUrl(13670, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13670, url: EN, read: "2026-11-26", quote: "DARK Level 4 ATK 1500 DEF 1500 Warrior ／ Effect" },
		{ id: "summon", kind: "card-text", cid: 13670, url: EN, read: "2026-11-26", quote: "(Quick Effect): You can Tribute this card; Special Summon 1 \"Sky Striker Ace\" monster from your Extra Deck to the Extra Monster Zone." },
		{ id: "revive", kind: "card-text", cid: 13670, url: EN, read: "2026-11-26", quote: "While this card is in your GY, if a face-up \"Sky Striker Ace\" Link Monster you control is destroyed by battle, or leaves the field by an opponent's card effect: You can Special Summon this card." },
		{ id: "once", kind: "card-text", cid: 13670, url: EN, read: "2026-11-26", quote: "You can only use each effect of \"Sky Striker Ace - Raye\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2021-12-25), page read 2026-11-26.
		{ id: "notes-quick", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "■ダメージステップ中には発動できません。" },
		{ id: "notes-needs-emz", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "■自分がエクストラモンスターゾーンにモンスターを特殊召喚できない状況では発動できません。" },
		{ id: "notes-not-link-summon", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "■この効果による特殊召喚はリンク召喚ではありません。" },
		{ id: "notes-grave-trigger", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "■墓地で発動できる誘発効果です。" },
		{ id: "notes-already-in-grave", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "（このカードと「閃刀姫」リンクモンスターが同時に破壊された場合、それをきっかけとして破壊されたこのカードの効果を発動することはできません。）" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 13670, url: NOTES, read: "2026-11-26", quote: "■ダメージステップでも発動できます。" },
		// OCG only. Konami's Q&A fids 13241 (2018-04-20), 8161 (2018-03-30), 23445 (2021-11-20) and 23614 (2026-11-06), pages read 2026-11-26. Fid 24167 is about
		// "Sky Striker Special Maneuver - Lemnisgate!" (batch 6): a Quick-Play Spell chained to this card's first effect stays on the field until the chain ends.
		{ id: "qa-hayate-13241", kind: "jp-qa", cid: 13670, fid: 13241, url: qa(13241), read: "2026-11-26", quote: "質問の状況であれば、「閃刀姫－ハヤテ」のモンスター効果で墓地へ送られている「閃刀姫－レイ」の『このカードを特殊召喚する』モンスター効果を、その「閃刀姫－ハヤテ」が戦闘で破壊され墓地へ送られたダメージステップ終了時に発動する事ができます。" },
		{ id: "qa-controller-8161", kind: "jp-qa", cid: 13670, fid: 8161, url: qa(8161), read: "2026-11-26", quote: "「閃刀姫－カガリ」が戦闘で破壊される際にコントロールしていたプレイヤー（＝質問の状況の場合、自分）が、自身の墓地に存在する「閃刀姫－レイ」の『このカードを特殊召喚する』モンスター効果を発動する事ができます。" },
		{ id: "qa-link-material-23445", kind: "jp-qa", cid: 13670, fid: 23445, url: qa(23445), read: "2026-11-26", quote: "その結果として対象のモンスターがフィールドを離れます。これは『相手の効果によってフィールドから離れた』状況として扱いません。" },
		{ id: "qa-leave-23614", kind: "jp-qa", cid: 13670, fid: 23614, url: qa(23614), read: "2026-11-26", quote: "原則として、フィールドのモンスターが魔法＆罠ゾーンに移動した場合や、フィールドのカードをエクシーズモンスターのエクシーズ素材にした場合には、モンスターがフィールドを離れたことになりません。" },
		// OCG only. Konami's Q&A fids 10427 (2025-08-15, "Gozen Match"), 24166 (2025-04-21, "Prototype Sky Striker Ace - Amatsu"), 24289 (2026-02-19), 21941 (2022-12-30), 24189 (2026-05-11) and 24184 (2025-06-12), pages read 2026-11-26.
		{ id: "qa-gozen-10427", kind: "jp-qa", cid: 13670, fid: 10427, url: qa(10427), read: "2026-11-26", quote: "発動した場合、コストとして「閃刀姫－レイ」がリリースされたことにより自分のモンスターゾーンに闇属性モンスターが存在しなくなり、どの属性のモンスターも特殊召喚できるようになりますので、結果的に炎属性の「閃刀姫－カガリ」を特殊召喚することができます。" },
		{ id: "qa-amatsu-24166", kind: "jp-qa", cid: 13670, fid: 24166, url: qa(24166), read: "2026-11-26", quote: "発動できます。相手が発動した効果によって自分の「閃刀姫」リンクモンスターが破壊されていますので、『自分フィールドの「閃刀姫」Lモンスターが相手の効果でフィールドから離れた場合』の条件は満たされます。" },
		{ id: "qa-new-name-24289", kind: "jp-qa", cid: 13670, fid: 24289, url: qa(24289), read: "2026-11-26", quote: "「閃刀姫－レイ」の②の効果は、モンスターゾーンでのカード名に「閃刀姫」を含むリンクモンスターが相手の効果でフィールドから離れた場合、または戦闘で破壊された場合に発動できます。" },
		{ id: "qa-black-bird-21941", kind: "jp-qa", cid: 13670, fid: 21941, url: qa(21941), read: "2026-11-26", quote: "モンスターゾーンの自身をリリースして相手のモンスター効果が発動した時も、『相手フィールドのモンスターが効果を発動した時』にあたりますので、自分は「ブラック・バード・クローズ」を発動する事ができます。" },
		{ id: "qa-sensor-array-24189", kind: "jp-qa", cid: 13670, fid: 24189, url: qa(24189), read: "2026-11-26", quote: "「閃刀姫＝ゼロ」の『フィールドのカード１枚を破壊できる』効果で「センサー万別」や「御前試合」を破壊した場合は、特殊召喚した「閃刀姫－レイ」と「閃刀姫－ロゼ」はどちらもフィールドに残ります" },
		{ id: "qa-attack-position-24184", kind: "jp-qa", cid: 13670, fid: 24184, url: qa(24184), read: "2026-11-26", quote: "攻撃表示で特殊召喚した「閃刀姫－レイ」「閃刀姫－ロゼ」はどちらも攻撃表示のままとなります。" },
		{ id: "qa-lemnisgate-24167", kind: "jp-qa", cid: 13670, fid: 24167, url: qa(24167), read: "2026-11-26", quote: "チェーン２以降で発動した速攻魔法・通常罠カードは、その効果処理が終わっても魔法＆罠ゾーンに残り続け、一連のチェーン処理が全て終わってから同時に墓地へ送られます。" },
	],
	effects: ["facts", "summon", "revive", "once"],
	rulings: [
		{ source: "notes-quick" },
		{ source: "notes-no-damage-step" },
		{ source: "notes-needs-emz" },
		{ source: "notes-not-link-summon" },
		{ source: "notes-grave-trigger" },
		{ source: "notes-already-in-grave" },
		{ source: "notes-damage-step" },
		{ source: "qa-hayate-13241" },
		{ source: "qa-controller-8161" },
		{ source: "qa-link-material-23445" },
		{ source: "qa-leave-23614" },
		{ source: "qa-gozen-10427" },
		{ source: "qa-amatsu-24166" },
		{ source: "qa-new-name-24289", pending: "needs a monster whose name is changed on the field (a Link Monster treated as \"Fairy Prince\" by an opponent's card): the core gives a card its printed name only" },
		{ source: "qa-black-bird-21941", pending: "needs \"Black Bird Close\", which the core does not have; the rule it states (a monster that Tributes itself as its cost still activated an effect of a monster the opponent controls) is the core's own" },
		{ source: "qa-sensor-array-24189", pending: "about the cards named 「センサー万別」 and 「御前試合」 in Konami's Japanese text, destroyed by Zero's effect: neither is in the core's lists (a made-up one-Attribute lock is used for the Gozen Match Q&A fid 10427)" },
		{ source: "qa-attack-position-24184", pending: "needs a monster that changes the position of the monsters on the field (\"Number 41: Bagooska the Terribly Tired Tapir\"); Special Summoned in Attack Position, the two stay so while its effect is only applied after the chain block" },
		{ source: "qa-lemnisgate-24167", pending: "about \"Sky Striker Special Maneuver - Lemnisgate!\" (batch 6); the rule it states (a Quick-Play Spell activated as Chain Link 2 or higher is sent to the GY after the whole chain) is the core's own and is tested with that card" },
	],
};
