import { ask, type CardDef, targetGroupsOf } from "../effects";
import type { CardSources } from "../coverage";
import { replaceEffect } from "../chain";
import { destroyCard, type Duel, effectDestruction, type Link, moveCards, other } from "../duel";
import { belongsTo } from "../identity";
import { konamiCardUrl } from "../sources";
import { cardsOnField } from "./sky-striker-targets";

const NAME = "Prototype Sky Striker Ace - Amatsu";
const ACE = "Sky Striker Ace";

/** A face-up "Sky Striker Ace" Link Monster in a Monster Zone. */
const isAceLink = (duel: Duel, id: number): boolean => {
	const card = duel.cards[id]!;
	return card.zone === "monster" && card.face === "up" && duel.defs[card.code]?.facts?.frame === "link" && belongsTo(duel, id, ACE);
};

/** "Destroy 1 "Sky Striker Ace" Link Monster your opponent controls": the effect that replaces the activated one; `link` is the replaced link, whose player is "you" and who chooses. */
const destroyAnAceLink = (duel: Duel, link: Link): Duel =>
	ask(
		duel,
		link.player,
		duel.piles[other(link.player)].monster.filter((id) => isAceLink(duel, id)),
		(board, picked) => destroyCard(board, picked, { destruction: effectDestruction(link) }),
	);

/**
 * DARK Machine Link 1 (arrow at the bottom), 1500 ATK. "1 "Sky Striker Ace" monster. You can only Special Summon "Prototype Sky Striker Ace - Amatsu(s)" once per
 * turn. When a monster your opponent controls with 2000 or more ATK activates its effect (Quick Effect): You can make the activated effect become "Destroy 1 "Sky
 * Striker Ace" Link Monster your opponent controls". When an attack is declared involving this card and an opponent's monster: You can target 1 "Sky Striker Ace"
 * monster you control and 1 card your opponent controls; destroy them. You can only use each effect of "Prototype Sky Striker Ace - Amatsu" once per turn." A
 * "Sky Striker Ace" card (its name, and Konami's Q&A fid 24165 calls it a "Sky Striker Ace" Link Monster), so also a "Sky Striker" card.
 *
 * - Procedure: 1 "Sky Striker Ace" monster. The once-per-turn Special Summon is a card rule, not an effect, whatever the way of Summoning (`summon.oncePerTurn`, notes).
 * - First effect: a Quick Effect of the Monster Zone, not in the Damage Step (notes), chained directly to the effect of a monster the opponent controls that is face-up
 *   in the Monster Zone with 2000 or more ATK, read when that effect was activated and before its cost (S7, `Link.stats`: a monster that Tributes itself as its cost
 *   is judged by the ATK it had before it left, Konami's Q&A fid 24164; and an ATK that comes from another effect counts). It makes that link a "destroy 1 "Sky Striker
 *   Ace" Link Monster your opponent controls" effect (`replaceEffect`): the activated effect is replaced, not applied to the monster, so the effect of a monster that
 *   is unaffected by other cards' effects is replaced too; the player who activated it chooses among the Link Monsters of the player who controls this card (notes),
 *   a protected one too (fid 24165: it is chosen, stays, and the effect is over); with none at resolution neither the new nor the original effect is done (notes); the
 *   effect still applies when this card's player has no such monster by then (notes). A monster destroyed by it is destroyed by the opponent's effect (fid 24166).
 * - Second effect: an optional "when" Trigger Effect of the Monster Zone for an attack declared by this card on an opponent's monster, or by an opponent's monster
 *   on this card (notes; not a direct attack). It targets 1 face-up "Sky Striker Ace" monster of the player's Monster Zone and 1 card the opponent controls, a
 *   face-down one too (`targetGroups`); when it resolves a target that is no longer a legal target is skipped and the others are destroyed (notes), together.
 * - Each effect once per turn, by name, one use each.
 */
export const PROTOTYPE_SKY_STRIKER_ACE_AMATSU: CardDef = {
	code: "prototype-sky-striker-ace-amatsu",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1500, archetypes: [ACE, "Sky Striker"], mentions: [NAME] },
	summon: { oncePerTurn: true },
	procedure: { kind: "link", materials: { min: 1, max: 1, filter: (duel, card) => belongsTo(duel, card.id, ACE) } },
	effects: [
		{
			type: "quick",
			once: { scope: "name", key: "prototype-sky-striker-ace-amatsu-1" },
			condition: (duel, { player }) => {
				const top = duel.chain[duel.chain.length - 1];
				return top !== undefined && top.player !== player && top.stats !== undefined && top.stats.atk >= 2000;
			},
			operation: (duel, link) => (link.answers === null ? duel : replaceEffect(duel, link.answers, destroyAnAceLink, link)),
		},
		{
			type: "trigger",
			categories: ["destroy"],
			once: { scope: "name", key: "prototype-sky-striker-ace-amatsu-2" },
			event: (_duel, event, { card }) => event.type === "attack-declared" && event.target !== null && (event.attacker.id === card.id || event.target.id === card.id),
			targetGroups: (duel, { player }) => [
				{ from: duel.piles[player].monster.filter((id) => duel.cards[id]!.face === "up" && belongsTo(duel, id, ACE)), min: 1, max: 1 },
				{ from: cardsOnField(duel, [other(player)]), min: 1, max: 1 },
			],
			operation: (duel, link) =>
				moveCards(
					duel,
					targetGroupsOf(duel, link).flatMap((group) => group.map((card) => card.id)),
					{ zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) },
				),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=21600&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(21600, "en");

export const PROTOTYPE_SKY_STRIKER_ACE_AMATSU_SOURCES: CardSources = {
	code: "prototype-sky-striker-ace-amatsu",
	cid: 21600,
	french: {
		text: "1 monstre \"Assaut de l'Air - As\"\nVous ne pouvez Invoquer Spécialement un ou plusieurs \"Prototype Assaut de l'Air - As - Amatsu\" qu'une fois par tour. Lorsqu'un monstre contrôlé par votre adversaire avec min. 2000 ATK active son effet (Effet Rapide) : vous pouvez faire devenir l'effet activé \"Détruisez 1 Monstre Lien \"Assaut de l'Air - As\" contrôlé par votre adversaire\". Lorsqu'une attaque impliquant cette carte et un monstre de l'adversaire est déclarée : vous pouvez cibler 1 monstre \"Assaut de l'Air - As\" que vous contrôlez et 1 carte contrôlée par votre adversaire ; détruisez-les. Vous ne pouvez utiliser chaque effet de \"Prototype Assaut de l'Air - As - Amatsu\" qu'une fois par tour.",
		url: konamiCardUrl(21600, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 21600, url: EN, read: "2026-11-26", quote: "DARK Link 1 ATK 1500 DEF - Machine ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 21600, url: EN, read: "2026-11-26", quote: "1 \"Sky Striker Ace\" monster" },
		{ id: "once-summon", kind: "card-text", cid: 21600, url: EN, read: "2026-11-26", quote: "You can only Special Summon \"Prototype Sky Striker Ace - Amatsu(s)\" once per turn." },
		{ id: "replace", kind: "card-text", cid: 21600, url: EN, read: "2026-11-26", quote: "When a monster your opponent controls with 2000 or more ATK activates its effect (Quick Effect): You can make the activated effect become \"Destroy 1 \"Sky Striker Ace\" Link Monster your opponent controls\"." },
		{ id: "destroy", kind: "card-text", cid: 21600, url: EN, read: "2026-11-26", quote: "When an attack is declared involving this card and an opponent's monster: You can target 1 \"Sky Striker Ace\" monster you control and 1 card your opponent controls; destroy them." },
		{ id: "once", kind: "card-text", cid: 21600, url: EN, read: "2026-11-26", quote: "You can only use each effect of \"Prototype Sky Striker Ace - Amatsu\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2025-04-21), page read 2026-11-26.
		{ id: "notes-not-effect", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。" },
		{ id: "notes-any-summon", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■リンク召喚による特殊召喚かどうかにかかわらず、１ターンに１度しか特殊召喚できません。" },
		{ id: "notes-replace-quick", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-replace-no-damage-step", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-replace-chain-directly", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■相手フィールドの攻撃力２０００以上のモンスターが効果を発動した時に直接チェーンして発動できます。" },
		{ id: "notes-replace-not-applied-to-monster", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■モンスターに適用する効果ではありません。(モンスター効果を受けない状態のモンスターの効果も、『相手フィールドの「閃刀姫」Lモンスター１体を破壊する』に変更されます。)" },
		{ id: "notes-replace-applies-with-no-ace", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■この効果の処理時に自分フィールドに「閃刀姫」Lモンスターが存在しない場合でも、この効果は適用され、モンスター効果は『相手フィールドの「閃刀姫」Lモンスター１体を破壊する』に変更されます。" },
		{ id: "notes-replace-nothing-done", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■変更された効果の処理時に自分フィールドに「閃刀姫」Lモンスターが存在しない場合、本来の効果処理も『相手フィールドの「閃刀姫」Lモンスター１体を破壊する』処理も行われません。" },
		{ id: "notes-replace-opponent-chooses", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■破壊する『「閃刀姫」Lモンスター１体』は、この効果を発動したプレイヤーから見て相手が選びます。" },
		{ id: "notes-destroy-trigger", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "【②の効果について】■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-destroy-attack", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■このカードが相手モンスターに攻撃する攻撃宣言時、または相手モンスターがこのカードに攻撃する攻撃宣言時に発動できる効果です。" },
		{ id: "notes-destroy-targets", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■自分のモンスターゾーンに表側表示で存在する「閃刀姫」モンスター１体と、相手フィールドのカード１枚を対象として発動できます。" },
		{ id: "notes-destroy-partial", kind: "jp-notes", cid: 21600, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のカードの一部が対象から外れていた場合でも、残りの対象のカードについて処理を行います。" },
		// OCG only. Konami's Q&A fids 24164, 24165 and 24166 (all 2025-04-21), pages read 2026-11-26 (the last two on 2026-11-24 too). The remaining three, fids 24393 (2026-09-25), 7934 (2025-04-21), 10427 (2025-08-15), read 2026-11-26.
		// Black Paladin/Camellia and Stardust Dragon are absent from both lists; Gozen Match is absent but its Raye/Kagari/Amatsu clause applies to the exact-list cards.
		{ id: "qa-paladin-24393", kind: "jp-qa", cid: 21600, fid: 24393, url: qa(24393), read: "2026-11-26", quote: "質問の状況でも、「波動の超魔導剣士－ブラック・パラディン」の『④：このカードが戦闘・効果でカードを破壊し墓地へ送った時に適用する。そのカードが墓地に存在する限り、その効果は発動できない』効果が適用されるためです。" },
		{ id: "qa-stardust-7934", kind: "jp-qa", cid: 21600, fid: 7934, url: qa(7934), read: "2026-11-26", quote: "以下の効果によって「スターダスト・ドラゴン」の発動した①の効果が変更された場合も同様に、エンドフェイズに②の効果を発動することはできません。" },
		{ id: "qa-gozen-10427", kind: "jp-qa", cid: 21600, fid: 10427, url: qa(10427), read: "2026-11-26", quote: "ただし、このターンに、自分がまだ「閃刀姫－カガリ」と闇属性の「試号閃刀姫－アマツ」をそれぞれ１回も特殊召喚しておらず、エクストラデッキに「試号閃刀姫－アマツ」が存在している場合、「閃刀姫－レイ」の『①：自分・相手ターンに、このカードをリリースして発動できる。EXデッキから「閃刀姫」モンスター１体をEXモンスターゾーンに特殊召喚する』効果を発動することができます。" },
		{ id: "qa-atk-before-cost-24164", kind: "jp-qa", cid: 21600, fid: 24164, url: qa(24164), read: "2026-11-26", quote: "「試号閃刀姫－アマツ」の①の効果を発動する場合、相手モンスターが効果を発動する際にコストとしてモンスターゾーンから離れる前の攻撃力を参照します。" },
		{ id: "qa-protected-choice-24165", kind: "jp-qa", cid: 21600, fid: 24165, url: qa(24165), read: "2026-11-26", quote: "できます。（処理時に、効果を受けない「閃刀姫」リンクモンスターや、効果で破壊されない「閃刀姫」リンクモンスターを選ぶこともできます。）" },
		{ id: "qa-opponents-effect-24166", kind: "jp-qa", cid: 21600, fid: 24166, url: qa(24166), read: "2026-11-26", quote: "発動できます。相手が発動した効果によって自分の「閃刀姫」リンクモンスターが破壊されていますので、『自分フィールドの「閃刀姫」Lモンスターが相手の効果でフィールドから離れた場合』の条件は満たされます。" },
	],
	effects: ["facts", "procedure", "once-summon", "replace", "destroy", "once"],
	rulings: [
		{ source: "notes-not-effect" },
		{ source: "notes-any-summon" },
		{ source: "notes-replace-quick" },
		{ source: "notes-replace-no-damage-step" },
		{ source: "notes-replace-chain-directly" },
		{ source: "notes-replace-not-applied-to-monster" },
		{ source: "notes-replace-applies-with-no-ace" },
		{ source: "notes-replace-nothing-done" },
		{ source: "notes-replace-opponent-chooses" },
		{ source: "notes-destroy-trigger" },
		{ source: "notes-destroy-attack" },
		{ source: "notes-destroy-targets" },
		{ source: "notes-destroy-partial" },
		{ source: "qa-paladin-24393", pending: "Black Paladin and Camellia are in neither exact list and are not implemented; no stand-in interaction is claimed" },
		{ source: "qa-stardust-7934", pending: "Stardust Dragon (not Stardust Sifr Divine Dragon) and the other listed revival effects are absent from both exact lists; no stand-in interaction is claimed" },
		{ source: "qa-gozen-10427" },
		{ source: "qa-atk-before-cost-24164" },
		{ source: "qa-protected-choice-24165" },
		{ source: "qa-opponents-effect-24166" },
	],
};
