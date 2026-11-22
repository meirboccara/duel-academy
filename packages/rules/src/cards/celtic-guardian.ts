import type { CardSources } from "../coverage";

/**
 * Celtic Guardian: a Normal Monster, the first card through the definition of done. It has no effect, so it owes no
 * effect test. Konami's Japanese database lists two Q&A entries for it (fid 15856 and 19054), but both rule on other
 * cards' effects (cid 11890 and 12353), so they belong to those cards' files.
 * French text: YGOResources /data/card/4047, matching Konami's French page, read 2026-11-23.
 */
export const CELTIC_GUARDIAN: CardSources = {
	code: "celtic-guardian",
	cid: 4047,
	french: {
		text: "Cet elfe qui a appris à manier l'épée déroute l'ennemi par des attaques éclair.",
		url: "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4047&request_locale=fr",
		read: "2026-11-23",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 4047,
			url: "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4047&request_locale=en",
			read: "2026-11-23",
			quote: "An elf who learned to wield a sword, he baffles enemies with lightning-swift attacks.",
		},
	],
	effects: [],
	rulings: [],
};
