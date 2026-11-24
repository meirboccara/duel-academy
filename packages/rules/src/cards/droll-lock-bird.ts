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
 */
export const DROLL_LOCK_BIRD: CardDef = {
	code: "droll-lock-bird",
	kind: "monster",
	facts: { name: "Droll & Lock Bird", level: 1, atk: 0, def: 0 },
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
		// OCG only. Droll's list, Maxx "C" under the lock: it can be activated, and the draws are not done.
		{ id: "draws-fail", kind: "jp-qa", cid: 9279, fid: 12797, url: qa(12797), read: "2026-11-23", quote: "発動できます。ただし、その効果によってドローする状況になった際には、実際にカードをドローすることはできません。" },
		// OCG only. Droll's list, Allied Spatial Battle under the lock: a card that does not add from the Deck to the hand is played in full.
		{ id: "other-parts", kind: "jp-qa", cid: 9279, fid: 24259, url: qa(24259), read: "2026-11-23", quote: "発動できます。発動した場合、『お互いはそれぞれ自身のデッキから攻撃力？以外のモンスター１体を選び、お互いに確認する』処理を行い、攻撃力が高い方のモンスターは墓地に送られます。" },
		// OCG only. Droll's list, Drish's effect ② (page date 2026-10-02): of its two bullets, the one that returns the hands and then draws cannot be chosen.
		{ id: "drish", kind: "jp-qa", cid: 9279, fid: 24396, url: qa(24396), read: "2026-11-23", quote: "（A）１つ目の『●』の効果を選択して発動することはできますが、２つ目の『●』の効果を選択して発動することはできません。" },
	],
	effects: ["text"],
	rulings: [{ source: "notes" }, { source: "draws-fail" }, { source: "other-parts" }, { source: "drish", pending: "Drish (choosing among bullets) is not an Academy card" }],
};
