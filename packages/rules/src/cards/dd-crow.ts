import { moveCard, other } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import type { CardSources } from "../coverage";
import { sendThisToGraveyard } from "./helpers";
import { konamiCardUrl } from "../sources";

/** "(Quick Effect): You can discard this card to the GY, then target 1 card in your opponent's GY; banish that target." */
export const DD_CROW: CardDef = {
	code: "dd-crow",
	kind: "monster",
	effects: [
		{
			type: "quick",
			range: "hand",
			cost: sendThisToGraveyard,
			target: (duel, { player }) => duel.piles[other(player)].graveyard,
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				return target?.zone === "graveyard" ? moveCard(duel, target.id, { zone: "banished", effect: link }) : duel;
			},
		},
	],
};

export const DD_CROW_SOURCES: CardSources = {
	code: "dd-crow",
	cid: 6980,
	french: {
		text: "(Effet Rapide) : vous pouvez défausser cette carte au Cimetière, puis ciblez 1 carte dans le Cimetière de votre adversaire ; bannissez la cible.",
		url: konamiCardUrl(6980, "fr"),
		read: "2026-11-23",
	},
	sources: [{ id: "text", kind: "card-text", cid: 6980, url: konamiCardUrl(6980, "en"), read: "2026-11-23", quote: "(Quick Effect): You can discard this card to the GY, then target 1 card in your opponent's GY; banish that target." }],
	effects: ["text"],
	rulings: [],
};
