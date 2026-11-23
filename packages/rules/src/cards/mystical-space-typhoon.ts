import { moveCard } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import type { CardSources } from "../coverage";
import { spellsAndTraps } from "./helpers";
import { konamiCardUrl } from "../sources";

/**
 * "Target 1 Spell/Trap on the field; destroy that target." A Quick-Play Spell. The card cannot target itself (it is being
 * activated). Destroying is a move to the Graveyard; the destruction as an event of its own comes with later steps.
 */
export const MYSTICAL_SPACE_TYPHOON: CardDef = {
	code: "mystical-space-typhoon",
	kind: "quick-play",
	effects: [
		{
			type: "activation",
			target: (duel, { card }) => spellsAndTraps(duel).filter((id) => id !== card.id),
			operation: (duel, link) => {
				// "that target": it must still be on the field as a Spell or Trap when this resolves.
				const target = targetsOf(duel, link)[0];
				return target && (target.zone === "spell" || target.zone === "field") ? moveCard(duel, target.id, { zone: "graveyard" }) : duel;
			},
		},
	],
};

export const MYSTICAL_SPACE_TYPHOON_SOURCES: CardSources = {
	code: "mystical-space-typhoon",
	cid: 4909,
	french: { text: "Ciblez 1 Magie/Piège sur le Terrain ; détruisez la cible.", url: konamiCardUrl(4909, "fr"), read: "2026-11-23" },
	sources: [{ id: "text", kind: "card-text", cid: 4909, url: konamiCardUrl(4909, "en"), read: "2026-11-23", quote: "Target 1 Spell/Trap on the field; destroy that target." }],
	effects: ["text"],
	rulings: [],
};
