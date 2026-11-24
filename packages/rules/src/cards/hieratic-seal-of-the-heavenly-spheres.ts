import type { CardSources } from "../coverage";
import { type CardInstance, type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef, effectOf, type EffectRecord } from "../effects";
import { FOREVER, addModifier } from "../modifiers";
import { askSpecialSummon, canSpecialSummon, tribute } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Hieratic Seal of the Heavenly Spheres";

/**
 * "1 face-up card on the field" that can be returned to the hand when the effect resolves: a face-up monster, Spell or Trap of either field,
 * except a Spell or Trap Card that is a Chain Link activated and still to be sent to the Graveyard after it resolves (a Quick-Play Spell
 * chained: Konami's Q&A fid 21580, OCG only). A Continuous card stays on the field and may be chosen.
 */
const returnable = (duel: Duel): number[] => {
	const leaving = new Set(duel.chain.filter((link) => effectOf(duel, link).type === "activation" && effectOf(duel, link).stays !== true && duel.defs[link.card.code]?.kind !== "monster").map((link) => link.card.id));
	return (["you", "rival"] as const).flatMap((side) => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field]).filter((id) => duel.cards[id]!.face === "up" && !leaving.has(id));
};

/** "1 Dragon monster from your hand or Deck" that can be Special Summoned now. */
const dragonsToSummon = (duel: Duel, player: Side): number[] =>
	[...duel.piles[player].hand, ...duel.piles[player].deck].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.monsterType === "Dragon" && canSpecialSummon(duel, player, id));

/** "If this card is Tributed": it was Tributed from the field and went to the Graveyard, or was banished face-up (Konami's notes: it triggers where it first went). */
const tributedTo = (zone: "graveyard" | "banished"): EffectRecord["event"] => (_duel, event, { card }) =>
	event.type === "moved" && event.before.id === card.id && event.before.zone === "monster" && event.reason === "tributed" && event.after.zone === zone && (zone === "graveyard" || event.after.face === "up");

/** "Special Summon 1 Dragon monster from your hand or Deck, and make its ATK/DEF 0": the one Summoned has them from then on. */
const summonAtZero = (zone: "graveyard" | "banished"): EffectRecord => ({
	type: "trigger",
	range: zone,
	timing: "if",
	mandatory: true,
	categories: ["special-summon", "change-atk"],
	once: { scope: "name", key: "hieratic-seal-of-the-heavenly-spheres-summon" },
	event: tributedTo(zone),
	operation: (duel, link) =>
		ask(duel, link.player, dragonsToSummon(duel, link.player), (board, picked) =>
			askSpecialSummon(board, link.player, picked, {
				then: (done) => {
					const summoned: CardInstance = done.cards[picked]!;
					const reaches = { card: summoned.id, moves: summoned.moves };
					const zeroed = addModifier(done, { affects: reaches, until: FOREVER, layer: { kind: "set", stat: "atk", to: 0 }, by: link });
					return addModifier(zeroed, { affects: reaches, until: FOREVER, layer: { kind: "set", stat: "def", to: 0 }, by: link });
				},
			}),
		),
});

/**
 * "2 Dragon monsters. Once per opponent's turn, if this card is in the Extra Monster Zone (Quick Effect): You can Tribute 1 monster from your
 * hand or field; return 1 face-up card on the field to the hand. If this card is Tributed: Special Summon 1 Dragon monster from your hand or
 * Deck, and make its ATK/DEF 0. You can only use this effect of "Hieratic Seal of the Heavenly Spheres" once per turn." A LIGHT Dragon Link
 * Effect Monster, Link 2 (arrows at the bottom left and bottom right), 0 ATK.
 *
 * - Procedure: 2 Dragon monsters (`procedure: { kind: "link" }`, a Dragon filter on the printed Type).
 * - First effect: a Quick Effect of the Monster Zone (Konami's notes, OCG), only in the opponent's turn, with the card in an Extra Monster Zone
 *   (`slot` 5 or 6), not in the Damage Step (notes: the core lets only effects that change ATK or DEF in it). The cost is the Tribute of 1 monster of
 *   the hand or the field, face-down ones included, the card itself too (notes). The card to return is chosen when the effect resolves (no target:
 *   notes), among the face-up cards of either field; a Fusion, Synchro, Xyz or Link Monster goes to the Extra Deck of its owner, face-down (notes). The
 *   card cannot Tribute itself when no other face-up card would remain to return (Konami's Q&A fid 21579, OCG only: it can with a monster of the hand,
 *   and then it must choose itself), and a Quick-Play Spell activated in the Chain, still on the field, cannot be chosen, nor counted (Q&A fid 21580):
 *   `returnable`. "Once per opponent's turn" is a use per turn for each copy (`once: instance`), spent even when the activation is negated: the
 *   scope is YGOProJudge's answer only (asked 2026-11-24, no source cited), Konami's wording being the plain "once per turn" of the core's `instance`.
 * - Second effect: a mandatory Trigger Effect that goes off where the card first went, in the Graveyard, or face-up banished (notes), so two records
 *   (one per place) sharing one use per turn by name; also in the Damage Step (notes). It is not activated when the card has left that place before
 *   the effect could be put on a Chain (Konami's Q&A fid 24070). The Dragon is chosen when it resolves (hand or Deck, no target), and it keeps 0 ATK
 *   and 0 DEF as a lasting effect on that monster. With nothing to Summon, the mandatory effect resolves for nothing.
 */
export const HIERATIC_SEAL_OF_THE_HEAVENLY_SPHERES: CardDef = {
	code: "hieratic-seal-of-the-heavenly-spheres",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "link", link: 2, arrows: ["bottom-left", "bottom-right"], atk: 0, mentions: [NAME] },
	procedure: { kind: "link", materials: { min: 2, filter: (duel, card) => factsOf(duel, card.id)?.monsterType === "Dragon" } },
	effects: [
		{
			type: "quick",
			range: "field",
			categories: ["return-to-hand"],
			once: { scope: "instance" },
			condition: (duel, { player, card }) => duel.turn.player !== player && card.slot !== null && card.slot >= 5,
			cost: {
				// "1 monster from your hand or field", face-down ones included.
				pick: (duel, { player }) => [...duel.piles[player].hand, ...duel.piles[player].monster].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster").map((id) => [id]),
				// Not paid when no face-up card would be left to return.
				pay: (duel, _ctx, picked) => {
					const paid = tribute(duel, picked);
					return returnable(paid).length > 0 ? paid : null;
				},
			},
			operation: (duel, link) => ask(duel, link.player, returnable(duel), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
		summonAtZero("graveyard"),
		summonAtZero("banished"),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13496&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(13496, "en");

export const HIERATIC_SEAL_OF_THE_HEAVENLY_SPHERES_SOURCES: CardSources = {
	code: "hieratic-seal-of-the-heavenly-spheres",
	cid: 13496,
	french: {
		text: "2 monstres Dragon\nUne fois par tour de l'adversaire, si cette carte est dans la Zone Monstre Extra (Effet Rapide) : vous pouvez Sacrifier 1 monstre depuis votre main ou Terrain ; renvoyez 1 carte face recto sur le Terrain à la main. Si cette carte est Sacrifiée : Invoquez Spécialement 1 monstre Dragon depuis votre main ou Deck, et faites devenir 0 son ATK/DEF. Vous ne pouvez utiliser cet effet de \"Sceau Hiératique des Sphères Divines\" qu'une fois par tour.",
		url: konamiCardUrl(13496, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13496, url: EN, read: "2026-11-24", quote: "Hieratic Seal of the Heavenly Spheres LIGHT Link 2 ATK 0 DEF - Dragon ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 13496, url: EN, read: "2026-11-24", quote: "2 Dragon monsters" },
		{ id: "once-opponent-turn", kind: "card-text", cid: 13496, url: EN, read: "2026-11-24", quote: "Once per opponent's turn, if this card is in the Extra Monster Zone (Quick Effect):" },
		{ id: "return", kind: "card-text", cid: 13496, url: EN, read: "2026-11-24", quote: "You can Tribute 1 monster from your hand or field; return 1 face-up card on the field to the hand." },
		{ id: "summon", kind: "card-text", cid: 13496, url: EN, read: "2026-11-24", quote: "If this card is Tributed: Special Summon 1 Dragon monster from your hand or Deck, and make its ATK/DEF 0." },
		{ id: "once", kind: "card-text", cid: 13496, url: EN, read: "2026-11-24", quote: "You can only use this effect of \"Hieratic Seal of the Heavenly Spheres\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2020-12-05), page read 2026-11-24. Its 6 Q&A: three opened (below); the other three were not opened (their titles mention ATK/DEF changes and Link Ribbon, one title was not shown).
		{ id: "notes-quick-field", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-cost", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■この効果を発動する際にコストとして、自分の手札または自分のモンスターゾーンのモンスター１体をリリースします。（裏側守備表示モンスターもリリースできます。）" },
		{ id: "notes-chosen", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■手札に戻すカードは処理時に選びます。" },
		{ id: "notes-extra-deck", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■この効果によって、融合・シンクロ・エクシーズ・リンクモンスターを選ぶこともできます。その場合、選んだモンスターは元々の持ち主のエクストラデッキに裏側表示で戻ります。" },
		{ id: "notes-summon-trigger", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■誘発効果です。" },
		{ id: "notes-summon-mandatory", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■必ず発動する効果です。" },
		{ id: "notes-summon-damage-step", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■ダメージステップでも発動します。" },
		{ id: "notes-summon-graveyard", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "■このカードがリリースされ、墓地へ送られた場合には墓地で、表側で除外された場合には除外されている状態で発動します。" },
		{ id: "notes-summon-banished", kind: "jp-notes", cid: 13496, url: NOTES, read: "2026-11-24", quote: "表側で除外された場合には除外されている状態で発動します。（リリースされ、最初に送られたところで発動します。）" },
		// OCG only. Konami's Q&A fids 21579, 21580 and 24070 (2022-12-30, 2022-12-30, 2025-09-28), pages read 2026-11-24.
		{ id: "qa-only-itself", kind: "jp-qa", cid: 13496, fid: 21579, url: qa(21579), read: "2026-11-24", quote: "質問の状況のように、お互いのフィールドに表側表示で存在するカードが「天球の聖刻印」自身のみの場合、自身をリリースして、『フィールドの表側表示のカード１枚を選んで持ち主の手札に戻す』モンスター効果を発動する事はできません。" },
		{ id: "qa-quick-play-chain", kind: "jp-qa", cid: 13496, fid: 21580, url: qa(21580), read: "2026-11-24", quote: "質問の状況のように、チェーンして発動した速攻魔法カードは発動後に墓地へ送られるカードとなりますので、持ち主の手札に戻すカードとして選ぶ事はできません。" },
		{ id: "qa-left-graveyard", kind: "jp-qa", cid: 13496, fid: 24070, url: qa(24070), read: "2026-11-24", quote: "「天球の聖刻印」の②の効果は、リリースされた一連のチェーン処理後に最初に送られたところで発動する効果ですので、リリースされたのち②の効果を発動する前に最初に送られたところから離れている場合には発動しません。" },
	],
	effects: ["facts", "procedure", "once-opponent-turn", "return", "summon", "once"],
	rulings: [
		{ source: "notes-quick-field" },
		{ source: "notes-no-damage-step" },
		{ source: "notes-cost" },
		{ source: "notes-chosen" },
		{ source: "notes-extra-deck" },
		{ source: "notes-summon-trigger" },
		{ source: "notes-summon-mandatory" },
		{ source: "notes-summon-damage-step" },
		{ source: "notes-summon-graveyard" },
		{ source: "notes-summon-banished" },
		{ source: "qa-only-itself" },
		{ source: "qa-quick-play-chain" },
		{ source: "qa-left-graveyard" },
	],
};
