import type { CardSources } from "../coverage";
import type { CardDef } from "../effects";
import { konamiCardUrl } from "../sources";

/** "Gains 300 ATK/DEF for each card in your hand." A Continuous Effect: read from the board each time, so it follows the hand at once. */
export const MUKA_MUKA: CardDef = {
	code: "muka-muka",
	kind: "monster",
	facts: { level: 2, atk: 600, def: 300 },
	effects: [
		{
			type: "continuous",
			range: "field",
			operation: (duel) => duel,
			modifies: (duel, source) => {
				const gain = 300 * duel.piles[source.controller].hand.length;
				return [
					{ kind: "add", stat: "atk", by: gain },
					{ kind: "add", stat: "def", by: gain },
				];
			},
		},
	],
};

export const MUKA_MUKA_SOURCES: CardSources = {
	code: "muka-muka",
	cid: 4522,
	french: { text: "Gagne 300 ATK/DEF pour chaque carte dans votre main.", url: konamiCardUrl(4522, "fr"), read: "2026-11-23" },
	sources: [
		{ id: "text", kind: "card-text", cid: 4522, url: konamiCardUrl(4522, "en"), read: "2026-11-23", quote: "Gains 300 ATK/DEF for each card in your hand." },
		// OCG only: Konami's Japanese notes for the card (dated 2015-08-28).
		{ id: "notes", kind: "jp-notes", cid: 4522, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4522&request_locale=ja", read: "2026-11-23", quote: "■自分の手札の枚数が変化した際には、アップする攻撃力・守備力もただちに変化します。" },
	],
	effects: ["text"],
	rulings: [{ source: "notes" }],
};
