import { battledNow } from "../battle";
import type { CardSources } from "../coverage";
import { moveCard } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo } from "../identity";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Sky Striker Ace - Hayate";

/**
 * WIND Machine Link 1, bottom-left arrow. Exactly one non-WIND "Sky Striker Ace" monster (every Ace is also a "Sky Striker" card, by its name).
 * - "You can only Special Summon "Sky Striker Ace - Hayate(s)" once per turn": a card rule, not an effect (Konami's notes), `summon.oncePerTurn`.
 * - "Can attack directly": the `attack` permission `directly`, a Continuous Effect of the Monster Zone (notes).
 * - After damage calculation, if this card battled: the optional Trigger Effect of the Monster Zone at the `after` step of the Damage Step. It is
 *   activated after a direct attack or an attack on a monster, and also when this card is to be destroyed by that battle (it is still on the field
 *   then: it goes to the GY at the end of the Damage Step), notes. The card sent is chosen when it resolves (no target), among the "Sky Striker"
 *   cards of any kind in the Deck.
 */
export const SKY_STRIKER_ACE_HAYATE: CardDef = {
	code: "sky-striker-ace-hayate",
	kind: "monster",
	facts: { name: NAME, attribute: "WIND", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom-left"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME] },
	summon: { oncePerTurn: true },
	procedure: { kind: "link", materials: { min: 1, max: 1, filter: (duel, card) => belongsTo(duel, card.id, "Sky Striker Ace") && factsOf(duel, card.id)?.attribute !== "WIND" } },
	effects: [
		{ type: "continuous", modifies: () => [{ kind: "attack", allows: { what: "directly" } }] },
		{
			type: "trigger",
			timing: "if",
			categories: ["send-from-deck"],
			condition: (duel, { player }) => duel.piles[player].deck.some((id) => belongsTo(duel, id, "Sky Striker")),
			event: (duel, event, { card }) => event.type === "damage-step" && event.step === "after" && battledNow(duel, card.id),
			operation: (duel, link) =>
				ask(
					duel,
					link.player,
					duel.piles[link.player].deck.filter((id) => belongsTo(duel, id, "Sky Striker")),
					(board, picked) => moveCard(board, picked, { zone: "graveyard", effect: link }),
				),
		},
	],
};

const EN = konamiCardUrl(13763, "en");
const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13763&request_locale=ja";

export const SKY_STRIKER_ACE_HAYATE_SOURCES: CardSources = {
	code: "sky-striker-ace-hayate",
	cid: 13763,
	french: {
		text: "1 monstre \"Assaut de l'Air - As\" non-VENT\nVous ne pouvez Invoquer Spécialement un ou plusieurs \"Assaut de l'Air - As - Hayaté\" qu'une fois par tour. Peut attaquer directement. Après le calcul des dommages, si cette carte a combattu : vous pouvez envoyer 1 carte \"Assaut de l'Air\" depuis votre Deck au Cimetière.",
		url: konamiCardUrl(13763, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13763, url: EN, read: "2026-11-26", quote: "WIND Link 1 ATK 1500 DEF - Machine ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 13763, url: EN, read: "2026-11-26", quote: "1 non-WIND \"Sky Striker Ace\" monster" },
		{ id: "once", kind: "card-text", cid: 13763, url: EN, read: "2026-11-26", quote: "You can only Special Summon \"Sky Striker Ace - Hayate(s)\" once per turn." },
		{ id: "direct", kind: "card-text", cid: 13763, url: EN, read: "2026-11-26", quote: "Can attack directly." },
		{ id: "send", kind: "card-text", cid: 13763, url: EN, read: "2026-11-26", quote: "After damage calculation, if this card battled: You can send 1 \"Sky Striker\" card from your Deck to the GY." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-26. Q&A 13241 (Raye after Hayate's send) belongs to batch 7; 23993 and 13862 are tested in attack-targets.test.ts.
		{ id: "notes-not-effect", kind: "jp-notes", cid: 13763, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。" },
		{ id: "notes-any-summon", kind: "jp-notes", cid: 13763, url: NOTES, read: "2026-11-26", quote: "■リンク召喚による特殊召喚かどうかにかかわらず、１ターンに１度しか特殊召喚できません。" },
		{ id: "notes-continuous", kind: "jp-notes", cid: 13763, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-trigger", kind: "jp-notes", cid: 13763, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-direct-or-destroyed", kind: "jp-notes", cid: 13763, url: NOTES, read: "2026-11-26", quote: "■このカードが直接攻撃を行った場合でもモンスターと戦闘を行った場合でも発動できます。また、このカードが相手モンスターとの戦闘で破壊される場合でも、そのダメージ計算後に発動できます。" },
	],
	effects: ["facts", "procedure", "once", "direct", "send"],
	rulings: [{ source: "notes-not-effect" }, { source: "notes-any-summon" }, { source: "notes-continuous" }, { source: "notes-trigger" }, { source: "notes-direct-or-destroyed" }],
};
