import { type Duel, freeSlots, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
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
 * resolves (no target), then the zone among those its bottom arrow points to (step 7: with Link-1 there is one) and the battle
 * position (step 8, RB10: a Special Summoned monster is in face-up Attack or Defense Position). It cannot be activated with no such
 * monster in the hand that can be Special Summoned, or no free zone it points to (by analogy with `search-needs-a-card`; no Konami
 * page read). Step 8: the Summon raises `summoned`, and "1 Normal Monster" is its Link Material (`procedure`).
 */
export const LINK_SPIDER: CardDef = {
	code: "link-spider",
	kind: "monster",
	facts: { frame: "link", link: 1, arrows: ["bottom"], atk: 1000 },
	procedure: { kind: "link", materials: { min: 1, filter: (duel, card) => factsOf(duel, card.id)?.normal === true } },
	effects: [
		{
			type: "ignition",
			range: "field",
			once: { scope: "instance" },
			categories: ["summon"],
			condition: (duel, { player, card }) => lowNormalsInHand(duel, player).some((id) => canSpecialSummon(duel, player, id)) && pointedFreeZones(duel, card.id, player).length > 0,
			operation: (duel, link) =>
				ask(duel, link.player, lowNormalsInHand(duel, link.player).filter((id) => canSpecialSummon(duel, link.player, id)), (board, picked) =>
					askSpecialSummon(board, link.player, picked, { zones: pointedFreeZones(board, link.card.id, link.player) }),
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
		// Step 8: its Link Material line (the first line of the card text; French: "1 Monstre Normal").
		{ id: "materials", kind: "card-text", cid: 13034, url: konamiCardUrl(13034, "en"), read: "2026-11-23", quote: "1 Normal Monster" },
	],
	effects: ["text", "arrow", "materials"],
	rulings: [],
};
