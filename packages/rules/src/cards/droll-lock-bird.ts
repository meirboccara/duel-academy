import type { CardSources } from "../coverage";
import { other } from "../duel";
import type { CardDef } from "../effects";
import { addModifier } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { sendThisToGraveyard } from "./helpers";

/**
 * "If a card(s) is added from the Main Deck to your opponent's hand, except during the Draw Phase (Quick Effect): You can send
 * this card from your hand to the GY; for the rest of this turn, cards cannot be added from either player's Main Deck to the hand."
 * The event is `added-to-hand` from the Deck, to the opponent's hand, outside the Draw Phase; sending itself is the cost (before
 * the semicolon); the lock lasts until the end of the turn and stops every move from a Deck to a hand (`move` in src/duel.ts), a
 * draw as well as a search. `lingers`: Konami's Japanese notes say it can be activated after the chain in which the card was added.
 * Never in the Damage Step (the same notes; an unflagged Quick Effect is not offered there).
 */
export const DROLL_LOCK_BIRD: CardDef = {
	code: "droll-lock-bird",
	kind: "monster",
	facts: { name: "Droll & Lock Bird", attribute: "WIND", monsterType: "Spellcaster", level: 1, atk: 0, def: 0 },
	effects: [
		{
			type: "quick",
			range: "hand",
			lingers: true,
			event: (duel, event, { player }) => event.type === "added-to-hand" && event.from === "deck" && event.card.owner === other(player) && duel.turn.phase !== "draw",
			cost: sendThisToGraveyard,
			operation: (duel) => addModifier(duel, { affects: () => true, until: duel.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } }),
		},
	],
};

const notes = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=9279&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;

export const DROLL_LOCK_BIRD_SOURCES: CardSources = {
	code: "droll-lock-bird",
	cid: 9279,
	french: {
		text: "Si une ou plusieurs cartes sont ajoutées depuis le Main Deck à la main de votre adversaire, sauf durant la Draw Phase (Effet Rapide) : vous pouvez envoyer cette carte depuis votre main au Cimetière ; le reste de ce tour, les cartes ne peuvent pas être ajoutées depuis le Main Deck de chaque joueur à la main.",
		url: konamiCardUrl(9279, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 9279, url: konamiCardUrl(9279, "en"), read: "2026-11-26", quote: "WIND Level 1 ATK 0 DEF 0 Spellcaster / Effect" },
		{
			id: "text",
			kind: "card-text",
			cid: 9279,
			url: konamiCardUrl(9279, "en"),
			read: "2026-11-23",
			quote: "If a card(s) is added from the Main Deck to your opponent's hand, except during the Draw Phase (Quick Effect): You can send this card from your hand to the GY; for the rest of this turn, cards cannot be added from either player's Main Deck to the hand.",
		},
		// OCG only: Konami's Japanese notes for the card (dated 2021-02-06).
		{ id: "notes", kind: "jp-notes", cid: 9279, url: notes, read: "2026-11-23", quote: "（チェーン処理中に相手がカードを手札に加えた場合には、その一連のチェーン処理後に発動できます。）" },
		// OCG only. The same notes (補足情報, 2021-02-06), page read 2026-11-26.
		{ id: "notes-hand", kind: "jp-notes", cid: 9279, url: notes, read: "2026-11-26", quote: "■手札で発動できる誘発即時効果です。" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 9279, url: notes, read: "2026-11-26", quote: "■ダメージステップ中には発動できません。" },
		// OCG only. Droll's list, Maxx "C" under the lock: it can be activated, and the draws are not done.
		{ id: "draws-fail", kind: "jp-qa", cid: 9279, fid: 12797, url: qa(12797), read: "2026-11-23", quote: "発動できます。ただし、その効果によってドローする状況になった際には、実際にカードをドローすることはできません。" },
		// OCG only. Droll's list, Allied Spatial Battle under the lock: a card that does not add from the Deck to the hand is played in full.
		{ id: "other-parts", kind: "jp-qa", cid: 9279, fid: 24259, url: qa(24259), read: "2026-11-23", quote: "発動できます。発動した場合、『お互いはそれぞれ自身のデッキから攻撃力？以外のモンスター１体を選び、お互いに確認する』処理を行い、攻撃力が高い方のモンスターは墓地に送られます。" },
		// OCG only. Droll's list, Drish's effect ② (page date 2026-10-02): of its two bullets, the one that returns the hands and then draws cannot be chosen.
		{ id: "drish", kind: "jp-qa", cid: 9279, fid: 24396, url: qa(24396), read: "2026-11-23", quote: "（A）１つ目の『●』の効果を選択して発動することはできますが、２つ目の『●』の効果を選択して発動することはできません。" },
		// OCG only. The rest of Droll's Q&A list read 2026-11-26 (18 entries, each opened); cards the core does not have, so pending. Opened with no
		// card of the core involved and no quote kept: fids 22837 (Jackalope, either turn), 24197 (Wrong Delivery), 21195, 15586, 14784.
		{ id: "card-destruction", kind: "jp-qa", cid: 9279, fid: 12854, url: qa(12854), read: "2026-11-26", quote: "「ドロール＆ロックバード」の効果が適用されているターンに「手札抹殺」を発動する事はできません。" },
		{ id: "sefer", kind: "jp-qa", cid: 9279, fid: 12850, url: qa(12850), read: "2026-11-26", quote: "「ドロール＆ロックバード」の効果が適用されている場合でも、「セフェルの魔導書」の発動は行えますが、その際に、墓地の「グリモの魔導書」を対象に選択する事はできません。" },
		{ id: "draws-as-part", kind: "jp-qa", cid: 9279, fid: 259, url: qa(259), read: "2026-11-26", quote: "「神星なる因子」はドローする効果を含む効果ですので、「ドロール＆ロックバード」の『このターン、お互いにデッキからカードを手札に加える事はできない』効果が既に適用されているターンには「神星なる因子」を発動する事ができません。" },
		{ id: "side-effect", kind: "jp-qa", cid: 9279, fid: 15780, url: qa(15780), read: "2026-11-26", quote: "「ドロール＆ロックバード」の効果適用中に、「副作用？」を発動する事はできません。" },
		{ id: "minerva", kind: "jp-qa", cid: 9279, fid: 15790, url: qa(15790), read: "2026-11-26", quote: "「ドロール＆ロックバード」の効果適用中でも、「ライトロード・セイント ミネルバ」の効果を発動する事はでき、『自分のデッキの上からカードを３枚墓地へ送る』処理は通常通り適用する事ができます。" },
		{ id: "chalice-order", kind: "jp-qa", cid: 9279, fid: 24256, url: qa(24256), read: "2026-11-26", quote: "ターンプレイヤーである自分が先に「禁じられた聖冠」をチェーン１で発動できます。" },
		{ id: "reincarnation", kind: "jp-qa", cid: 9279, fid: 9476, url: qa(9476), read: "2026-11-26", quote: "先に「ドロール＆ロックバード」の効果が適用されますので、自分が発動した「トリックスター・リンカーネイション」の『相手の手札を全て除外』する処理のみが行われ、『その枚数分だけ相手はデッキからドローする』処理は行われません。" },
	],
	effects: ["facts", "text"],
	rulings: [
		{ source: "notes" },
		{ source: "notes-hand" },
		{ source: "notes-damage-step" },
		{ source: "draws-fail" },
		{ source: "other-parts" },
		{ source: "drish", pending: "Drish (choosing among bullets) is not an Academy card" },
		{ source: "card-destruction", pending: "Card Destruction is not an Academy card" },
		{ source: "sefer", pending: "Sefer's Book of Spells and Grimoire are not Academy cards" },
		{ source: "draws-as-part", pending: "the Spell asked about is not an Academy card (the real Pot of Greed test below rests on YGOProJudge)" },
		{ source: "side-effect", pending: "Side Effects? is not an Academy card" },
		{ source: "minerva", pending: "Light Lord Saint Minerva is not an Academy card" },
		{ source: "chalice-order", pending: "Forbidden Chalice is not an Academy card" },
		{ source: "reincarnation", pending: "Trickstar Reincarnation is not an Academy card" },
	],
};
