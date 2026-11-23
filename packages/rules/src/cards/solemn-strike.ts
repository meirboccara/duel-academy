import type { CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { payLp } from "../life";
import { konamiCardUrl } from "../sources";
import { isMonsterEffect, summonOrActivationNegator } from "./negators";

/**
 * "When a monster(s) would be Special Summoned, OR a monster effect is activated: Pay 1500 LP; negate the Summon or activation,
 * and if you do, destroy that card." As Solemn Judgment, with Special Summons only and monster effects; 1500 LP is a cost. The
 * Konami card page (read 2026-11-23) has no once-per-turn sentence: none is modelled.
 */
export const SOLEMN_STRIKE: CardDef = {
	code: "solemn-strike",
	kind: "counter-trap",
	effects: [summonOrActivationNegator({ cost: (duel, { player }) => payLp(duel, player, 1500), summon: "special", activation: isMonsterEffect })],
};

export const SOLEMN_STRIKE_SOURCES: CardSources = {
	code: "solemn-strike",
	cid: 12187,
	french: {
		text: "Lorsqu'un ou plusieurs monstres vont être Invoqués Spécialement, OU qu'un effet de monstre est activé : payez 1500 LP ; annulez l'Invocation ou l'activation, et si vous le faites, détruisez la carte.",
		url: konamiCardUrl(12187, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 12187,
			url: konamiCardUrl(12187, "en"),
			read: "2026-11-23",
			quote: "When a monster(s) would be Special Summoned, OR a monster effect is activated: Pay 1500 LP; negate the Summon or activation, and if you do, destroy that card.",
		},
	],
	effects: ["text"],
	rulings: [],
};
