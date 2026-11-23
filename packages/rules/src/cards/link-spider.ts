import { type Duel, freeSlots, moveCard, type Side } from "../duel";
import { ask, askZone, type CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { factsOf } from "./helpers";
import { konamiCardUrl } from "../sources";
import { pointedZones } from "../zones";

const lowNormalsInHand = (duel: Duel, player: Side) =>
	duel.piles[player].hand.filter((id) => {
		const facts = factsOf(duel, id);
		return facts?.normal === true && (facts.level ?? 99) <= 4;
	});

/** "Your zone this card points to": the player's free Main Monster Zones its arrow points to, read now. */
const pointedFreeZones = (duel: Duel, spider: number, player: Side): number[] => {
	const free = freeSlots(duel, player, "monster");
	return pointedZones(duel, spider)
		.filter((zone) => zone.side === player && free.includes(zone.slot))
		.map((zone) => zone.slot);
};

/**
 * "Once per turn: You can Special Summon 1 Level 4 or lower Normal Monster from your hand to your zone this card
 * points to." An Ignition Effect on the field, once per turn for each copy. The player picks the monster when it
 * resolves (no target), then the zone among those its bottom arrow points to (step 7: with Link-1 there is one). It cannot be
 * activated with no such monster in the hand or no free zone it points to (by analogy with `search-needs-a-card`; no Konami page
 * read). Not expressed: its Link Summon (step 8).
 */
export const LINK_SPIDER: CardDef = {
	code: "link-spider",
	kind: "monster",
	facts: { frame: "link", arrows: ["bottom"], atk: 1000 },
	effects: [
		{
			type: "ignition",
			range: "field",
			once: { scope: "instance" },
			categories: ["summon"],
			condition: (duel, { player, card }) => lowNormalsInHand(duel, player).length > 0 && pointedFreeZones(duel, card.id, player).length > 0,
			operation: (duel, link) =>
				ask(duel, link.player, lowNormalsInHand(duel, link.player), (board, picked) =>
					askZone(board, link.player, pointedFreeZones(board, link.card.id, link.player), (placed, slot) => moveCard(placed, picked, { zone: "monster", face: "up", slot })),
				),
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
		// The page gives the Link Rating as text; the one lit arrow (bottom) is read from Konami's card image on the same page (cid 13034, ciid 1).
		{ id: "arrow", kind: "card-text", cid: 13034, url: konamiCardUrl(13034, "en"), read: "2026-11-23", quote: "Link 1" },
	],
	effects: ["text", "arrow"],
	rulings: [],
};
