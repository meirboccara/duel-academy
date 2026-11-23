import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { factsOf } from "./helpers";
import { konamiCardUrl } from "../sources";

const lowNormalsInHand = (duel: Duel, player: Side) =>
	duel.piles[player].hand.filter((id) => {
		const facts = factsOf(duel, id);
		return facts?.normal === true && (facts.level ?? 99) <= 4;
	});

/**
 * "Once per turn: You can Special Summon 1 Level 4 or lower Normal Monster from your hand to your zone this card
 * points to." An Ignition Effect on the field, once per turn for each copy. The player picks the monster when it
 * resolves (no target). Not expressed: "to your zone this card points to" (zones and arrows come with step 7: the
 * monster lands in the Monster Zone) and its Link Summon (step 8). That it cannot be activated with no such monster in
 * the hand is read by analogy with `search-needs-a-card`; no Konami page for it was read.
 */
export const LINK_SPIDER: CardDef = {
	code: "link-spider",
	kind: "monster",
	effects: [
		{
			type: "ignition",
			range: "field",
			once: { scope: "instance" },
			categories: ["summon"],
			condition: (duel, { player }) => lowNormalsInHand(duel, player).length > 0,
			operation: (duel, link) => ask(duel, link.player, lowNormalsInHand(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "monster", face: "up" })),
		},
	],
};

export const LINK_SPIDER_SOURCES: CardSources = {
	code: "link-spider",
	cid: 13034,
	french: {
		text: "1 Monstre Normal Une fois par tour : vous pouvez Invoquer Spécialement 1 Monstre Normal de max. Niveau 4 depuis votre main dans votre zone pointée par cette carte.",
		url: konamiCardUrl(13034, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 13034,
			url: konamiCardUrl(13034, "en"),
			read: "2026-11-23",
			quote: "Once per turn: You can Special Summon 1 Level 4 or lower Normal Monster from your hand to your zone this card points to.",
		},
	],
	effects: ["text"],
	rulings: [],
};
