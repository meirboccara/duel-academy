import type { CardSources } from "../coverage";
import type { CardDef } from "../effects";
import { konamiCardUrl } from "../sources";

const FLAVOUR = "This legendary dragon is a powerful engine of destruction. Virtually invincible, very few have faced this awesome creature and lived to tell the tale.";

/**
 * Blue-Eyes White Dragon (cid 4007): a LIGHT Dragon Normal Monster, Level 8, 3000 ATK / 2500 DEF. A Normal Monster has no effect: its
 * printed text is flavour text, so it has no effect record (an `effect` fact would make it an Effect Monster). It is a "Blue-Eyes"
 * monster by its name (`archetypes`), a name-based archetype that no Konami page lists; nothing mentions another card name.
 * Konami's Japanese Q&A list for the card was not read: a Normal Monster owes no effect test, and the rulings that name it belong to the
 * effects of other cards.
 */
export const BLUE_EYES_WHITE_DRAGON: CardDef = {
	code: "blue-eyes-white-dragon",
	kind: "monster",
	facts: { name: "Blue-Eyes White Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, normal: true, archetypes: ["Blue-Eyes"] },
};

export const BLUE_EYES_WHITE_DRAGON_SOURCES: CardSources = {
	code: "blue-eyes-white-dragon",
	cid: 4007,
	french: {
		text: "Ce dragon légendaire est un puissant moteur de destruction. Rares sont ceux qui ont survécu à cette terrifiante créature quasiment invincible pour en parler.",
		url: konamiCardUrl(4007, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "text", kind: "card-text", cid: 4007, url: konamiCardUrl(4007, "en"), read: "2026-11-24", quote: FLAVOUR },
		// The facts of the card's page (EN), read 2026-11-24: LIGHT, Level 8, ATK 3000, DEF 2500, Dragon / Normal.
		{ id: "facts", kind: "card-text", cid: 4007, url: konamiCardUrl(4007, "en"), read: "2026-11-24", quote: "LIGHT Level 8 ATK 3000 DEF 2500 Dragon／Normal" },
	],
	effects: ["text", "facts"],
	rulings: [],
};
