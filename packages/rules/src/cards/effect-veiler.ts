import type { CardSources } from "../coverage";
import { other } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import { isNegated, negateCardEffects } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { factsOf, sendThisToGraveyard, isEffectMonster } from "./helpers";

/**
 * "During your opponent's Main Phase (Quick Effect): You can send this card from your hand to the GY, then target 1 Effect Monster your
 * opponent controls; negate the effects of that face-up monster your opponent controls, until the end of this turn."
 *
 * Target legality: a face-up monster (YGOProJudge: a face-down monster cannot be verified as an Effect Monster; no Konami page for
 * the TCG wording), not a Normal Monster (Konami's Q&A on a Dual Monster treated as a Normal Monster), and one whose effects are not
 * negated already (YGOProJudge's answer for this card; Konami's note for Infinite Impermanence says the same of it). Both of YGOProJudge's
 * leads are unsourced.
 */
export const EFFECT_VEILER: CardDef = {
	code: "effect-veiler",
	kind: "monster",
	facts: { name: "Effect Veiler", attribute: "LIGHT", monsterType: "Spellcaster", level: 1, tuner: true, atk: 0, def: 0 },
	effects: [
		{
			type: "quick",
			range: "hand",
			condition: (duel, { player }) => duel.turn.player === other(player) && (duel.turn.phase === "main1" || duel.turn.phase === "main2"),
			cost: sendThisToGraveyard,
			target: (duel, { player }) => duel.piles[other(player)].monster.filter((id) => duel.cards[id]!.face === "up" && isEffectMonster(duel, id) && !isNegated(duel, id)),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				// "that face-up monster your opponent controls": `targetsOf` drops a target that was turned face-down, left the field or changed
				// control (each makes it a new card); `negateCardEffects` wants it face-up in the Monster Zone.
				if (!target) return duel;
				return negateCardEffects(duel, target.id, duel.turn.number);
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=8933&request_locale=ja";

export const EFFECT_VEILER_SOURCES: CardSources = {
	code: "effect-veiler",
	cid: 8933,
	french: {
		text: "Durant la Main Phase de votre adversaire (Effet Rapide) : vous pouvez envoyer cette carte depuis votre main au Cimetière, puis ciblez 1 Monstre à Effet contrôlé par votre adversaire ; jusqu'à la fin de ce tour, annulez les effets du monstre face recto contrôlé par votre adversaire.",
		url: konamiCardUrl(8933, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 8933,
			url: konamiCardUrl(8933, "en"),
			read: "2026-11-24",
			quote: "During your opponent's Main Phase (Quick Effect): You can send this card from your hand to the GY, then target 1 Effect Monster your opponent controls; negate the effects of that face-up monster your opponent controls, until the end of this turn.",
		},
		// OCG only. Konami's notes (補足情報, 2021-12-04), page read 2026-11-24.
		{ id: "notes-hand", kind: "jp-notes", cid: 8933, url: NOTES, read: "2026-11-24", quote: "■手札で発動できる誘発即時効果です。" },
		{ id: "notes-resolution", kind: "jp-notes", cid: 8933, url: NOTES, read: "2026-11-24", quote: "■処理時に、対象のモンスターが相手のモンスターゾーンに表側表示で存在する場合、そのモンスターは効果が無効化された状態になります。" },
		{ id: "notes-face-down", kind: "jp-notes", cid: 8933, url: NOTES, read: "2026-11-24", quote: "■この効果が適用されたモンスターが裏側守備表示になった場合、この効果の適用はなくなります。" },
		{ id: "notes-cost-leaving", kind: "jp-notes", cid: 8933, url: NOTES, read: "2026-11-24", quote: "■この効果が適用されたモンスターが、自身の効果を発動する際のコストとしてモンスターゾーンを離れた場合や、チェーンして発動した効果のコストや処理によってモンスターゾーンを離れた場合、無効になりますので、その処理は行われません。" },
		// OCG only. Konami's Q&A (fid 12318, 2017-03-24): a Dual Monster treated as a Normal Monster on the field is not a legal target.
		{
			id: "dual-as-normal",
			kind: "jp-qa",
			cid: 8933,
			fid: 12318,
			url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=12318&request_locale=ja",
			read: "2026-11-24",
			quote: "まず、フィールド上に存在する時に、通常モンスターとして扱われているデュアルモンスターに対して「エフェクト・ヴェーラー」の効果を発動する事はできません。",
		},
	],
	effects: ["text"],
	rulings: [{ source: "notes-hand" }, { source: "notes-resolution" }, { source: "notes-face-down" }, { source: "notes-cost-leaving" }, { source: "dual-as-normal" }],
};
