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
	facts: { level: 1, atk: 0, def: 0 },
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
	],
	effects: ["text"],
	rulings: [{ source: "notes" }],
};
