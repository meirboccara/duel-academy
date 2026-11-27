import type { CardDef } from "../effects";
import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { discardThis } from "./helpers";
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
 * Konami's notes (OCG): chained directly to the last Chain Link only (`condition` reads the top link) and never in the Damage Step (an
 * unflagged Quick Effect is not offered there). A card with modes counts the categories of the mode chosen only (Q&A fid 24163, OCG only).
 */
export const ASH_BLOSSOM: CardDef = {
	code: "ash-blossom-joyous-spring",
	kind: "monster",
	facts: { name: "Ash Blossom & Joyous Spring", attribute: "FIRE", monsterType: "Zombie", level: 3, tuner: true, atk: 0, def: 1800, mentions: ["Ash Blossom & Joyous Spring"] },
	effects: [
		{
			type: "quick",
			range: "hand",
			condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.some((category) => ASH_BLOSSOM_ANSWERS.includes(category)) ?? false,
			cost: discardThis,
			operation: (duel, link) => negateEffect(duel, link.answers!),
			once: { scope: "name" },
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12950&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;

export const ASH_BLOSSOM_SOURCES: CardSources = {
	code: "ash-blossom-joyous-spring",
	cid: 12950,
	french: {
		text: "Lorsqu'une carte ou un effet qui inclut n'importe lequel de ces effets est activé (Effet Rapide) : vous pouvez défausser cette carte ; annulez l'effet. ●Ajouter une carte depuis le Deck à la main. ●Invoquer Spécialement depuis le Deck. ●Envoyer une carte depuis le Deck au Cimetière. Vous ne pouvez utiliser cet effet de \"Floraison de Cendres et Joyeux Printemps\" qu'une fois par tour.",
		url: konamiCardUrl(12950, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 12950, url: konamiCardUrl(12950, "en"), read: "2026-11-26", quote: "FIRE Level 3 ATK 0 DEF 1800 Zombie / Tuner / Effect" },
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
		// OCG only. The same notes (補足情報, 2022-03-02), page read 2026-11-26.
		{ id: "notes-hand", kind: "jp-notes", cid: 12950, url: NOTES, read: "2026-11-26", quote: "■手札で発動できる誘発即時効果です。" },
		{ id: "notes-direct", kind: "jp-notes", cid: 12950, url: NOTES, read: "2026-11-26", quote: "■●のいずれかを含む魔法・罠・モンスターの効果が発動した時に、直接チェーンして発動できます。" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 12950, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		// OCG only. Konami's Q&A fid 24163 (page dated 2026-10-30, read 2026-11-26): for a card that lists bullets to choose from, only the chosen bullet counts.
		{
			id: "modes-chosen-bullet",
			kind: "jp-qa",
			cid: 12950,
			fid: 24163,
			url: qa(24163),
			read: "2026-11-26",
			quote: "１つ目の『●自分は２枚ドローする』効果を選択して「三戦の才」を発動したのであれば、「灰流うらら」の効果をチェーンして発動できます。その他の『●』の効果を選択して発動した場合には、「灰流うらら」の効果をチェーンして発動することはできません。",
		},
		// OCG only. Konami's Q&A fid 24162 (page dated 2026-09-25, read 2026-11-26), on a Droll & Lock Bird lock: the effect still "includes" an addition
		// from the Deck though it cannot be done, so Ash Blossom can still be chained to it.
		{ id: "qa-lock-still-includes", kind: "jp-qa", cid: 12950, fid: 24162, url: qa(24162), read: "2026-11-26", quote: "『セットせず手札に加える事もできる』効果を適用できない状況で「三戦の号」を発動した時でも『●デッキからカードを手札に加える効果』が含まれているためです。" },
		// OCG only. Konami's Q&A fid 23815 (page dated 2026-06-26, read 2026-11-26), (A): under "cards sent to the GY are banished instead" an effect worded
		// "discard this card" (Ash Blossom) can be activated; the discarded card is banished and the cost is paid. (B), "discard to the GY", cannot.
		{ id: "qa-discard-while-banished-instead", kind: "jp-qa", cid: 12950, fid: 23815, url: qa(23815), read: "2026-11-26", quote: "コストとして捨てたカードは結果的に墓地へは行かず除外されますが、「灰流うらら」のように、テキストに『墓地へ捨てて発動』とは記載されていない効果は発動できます。" },
		// OCG only. Konami's Q&A fid 23378 (read 2026-11-26): Ash Blossom answers Pot of Prosperity, and the oath stands when only its effect is negated.
		{ id: "pot-of-prosperity", kind: "jp-qa", cid: 12950, fid: 23378, url: qa(23378), read: "2026-11-26", quote: "ただし、「金満で謙虚な壺」の効果が無効になった場合、同じターン中に自分はカードの効果によってドローできません。" },
	],
	effects: ["facts", "text"],
	rulings: [
		{ source: "negated-effect-activation-stands" },
		{ source: "draw-is-add-to-hand" },
		{ source: "notes-whole-link" },
		{ source: "notes-hand" },
		{ source: "notes-direct" },
		{ source: "notes-damage-step" },
		{ source: "modes-chosen-bullet" },
		{ source: "pot-of-prosperity" },
		{ source: "qa-lock-still-includes" },
		{ source: "qa-discard-while-banished-instead" },
	],
};
