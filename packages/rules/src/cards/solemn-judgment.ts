import type { CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { payHalfLp } from "../life";
import { konamiCardUrl } from "../sources";
import { isSpellTrapCardActivation, summonOrActivationNegator } from "./negators";

/**
 * "When a monster(s) would be Summoned, OR a Spell/Trap Card is activated: Pay half your LP; negate the Summon or activation,
 * and if you do, destroy that card." Any Summon, or the activation of a Spell or Trap Card (Konami's notes: chained directly to
 * the activation of a card, not to an effect of one). Half the LP is a cost.
 */
export const SOLEMN_JUDGMENT: CardDef = {
	code: "solemn-judgment",
	kind: "counter-trap",
	effects: [summonOrActivationNegator({ cost: (duel, { player }) => payHalfLp(duel, player), activation: isSpellTrapCardActivation })],
};

export const SOLEMN_JUDGMENT_SOURCES: CardSources = {
	code: "solemn-judgment",
	cid: 4861,
	french: {
		text: "Lorsqu'un ou plusieurs monstres vont être Invoqués, OU qu'une Carte Magie/Piège est activée : payez la moitié de vos LP ; annulez l'Invocation ou l'activation, et si vous le faites, détruisez la carte.",
		url: konamiCardUrl(4861, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 4861,
			url: konamiCardUrl(4861, "en"),
			read: "2026-11-23",
			quote: "When a monster(s) would be Summoned, OR a Spell/Trap Card is activated: Pay half your LP; negate the Summon or activation, and if you do, destroy that card.",
		},
	],
	effects: ["text"],
	rulings: [],
};
