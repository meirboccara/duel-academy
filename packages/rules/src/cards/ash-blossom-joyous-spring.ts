import type { CardDef } from "../effects";
import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { sendThisToGraveyard } from "./helpers";
import { ICE_BELL_QA } from "../rule-sources";
import { konamiCardUrl } from "../sources";

/**
 * What Ash Blossom & Joyous Spring answers: a card or effect that "includes" one of the three listed effects. A draw is "add a card
 * from the Deck to the hand": Konami's Japanese Q&A fid 21685 (OCG only, record `draw-is-add-to-hand`) lets Ash Blossom be chained to
 * Knightmare Phoenix's effect only when it was activated co-linked, that is, only when the effect includes its "draw 1 card". A draw
 * effect says so with the category "draw".
 */
export const ASH_BLOSSOM_ANSWERS: readonly string[] = ["search", "draw", "summon-from-deck", "send-from-deck"];

/**
 * Quick Effect from the hand, on a chain link whose declared categories include one of the three; the cost is discarding
 * this card (dry-run by the listing); it negates the effect (the activation stands); once per turn by name.
 */
export const ASH_BLOSSOM: CardDef = {
	code: "ash-blossom-joyous-spring",
	kind: "monster",
	facts: { name: "Ash Blossom & Joyous Spring" },
	effects: [
		{
			type: "quick",
			range: "hand",
			condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.some((category) => ASH_BLOSSOM_ANSWERS.includes(category)) ?? false,
			cost: sendThisToGraveyard,
			operation: (duel, link) => negateEffect(duel, link.answers!),
			once: { scope: "name" },
		},
	],
};

export const ASH_BLOSSOM_SOURCES: CardSources = {
	code: "ash-blossom-joyous-spring",
	cid: 12950,
	french: {
		text: "Lorsqu'une carte ou un effet qui inclut n'importe lequel de ces effets est activé (Effet Rapide) : vous pouvez défausser cette carte ; annulez l'effet. ●Ajouter une carte depuis le Deck à la main. ●Invoquer Spécialement depuis le Deck. ●Envoyer une carte depuis le Deck au Cimetière. Vous ne pouvez utiliser cet effet de \"Floraison de Cendres et Joyeux Printemps\" qu'une fois par tour.",
		url: konamiCardUrl(12950, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 12950,
			url: konamiCardUrl(12950, "en"),
			read: "2026-11-23",
			quote: "When a card or effect is activated that includes any of these effects (Quick Effect): You can discard this card; negate that effect. ●Add a card from the Deck to the hand. ●Special Summon from the Deck. ●Send a card from the Deck to the GY. You can only use this effect of \"Ash Blossom & Joyous Spring\" once per turn.",
		},
		{ ...ICE_BELL_QA, id: "negated-effect-activation-stands" },
		// OCG only. Konami's Q&A fid 21685 (page dated 2026-09-25, read 2026-11-24): Knightmare Phoenix draws only when it was co-linked
		// at activation, and only then does its effect include "add a card from the Deck to the hand".
		{
			id: "draw-is-add-to-hand",
			kind: "jp-qa",
			cid: 12950,
			fid: 21685,
			url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=21685&request_locale=ja",
			read: "2026-11-24",
			quote: "相互リンク状態の「 トロイメア・フェニックス 」の効果を発動した時、チェーンして「 聖王の粉砕 」や「 灰流うらら 」の効果を発動できます。また、相互リンク状態ではない「 トロイメア・フェニックス 」の効果を発動した時、チェーンして「 聖王の粉砕 」や「 灰流うらら 」の効果を発動することはできません。",
		},
		// OCG only. Konami's notes (補足情報, 2022-03-02), read 2026-11-24: the whole Chain Link is negated, the parts that are not on the list too.
		{ id: "notes-whole-link", kind: "jp-notes", cid: 12950, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12950&request_locale=ja", read: "2026-11-24", quote: "■直前のチェーンブロック１つ分の効果処理が無効化されます。（チェーンブロック１つの効果処理内に●に該当する処理と該当しない処理が含まれている場合でも、チェーンブロック１つ分の効果処理が無効化されることでそれらの処理はいずれも適用されなくなります。）" },
	],
	effects: ["text"],
	rulings: [{ source: "negated-effect-activation-stands" }, { source: "draw-is-add-to-hand" }, { source: "notes-whole-link" }],
};
