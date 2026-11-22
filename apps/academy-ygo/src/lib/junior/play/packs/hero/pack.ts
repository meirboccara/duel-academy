import { build } from "../../master-decks";
import type { Pack } from "..";

/**
 * Elemental and Destiny HEROes, meta-lite. Shadow Mist and Blazeman search, E - Emergency Call and Reinforcement of the
 * Army find the HERO that is missing, Destiny HERO - Malicious calls its twin from the GY, and Polymerization makes the
 * Fusions. The same hand traps as every deck of today, and Counter Traps that answer the answers.
 */
export const HERO: Pack = {
	archetype: "HERO",
	engine: ["elemental-hero-shadow-mist", "elemental-hero-blazeman", "destiny-hero-malicious", "polymerization", "e-emergency-call"],
	deck: {
		main: build(
			["elemental-hero-shadow-mist", 3],
			["elemental-hero-blazeman", 3],
			["destiny-hero-malicious", 2],
			["elemental-hero-sparkman", 3],
			["elemental-hero-avian", 2],
			["elemental-hero-burstinatrix", 2],
			["elemental-hero-clayman", 1],
			["elemental-hero-neos", 1],
			["ash-blossom-joyous-spring", 3],
			["effect-veiler", 2],
			["ghost-ogre-snow-rabbit", 2],
			["polymerization", 3],
			["e-emergency-call", 2],
			["reinforcement-of-the-army", 1],
			["a-hero-lives", 1],
			["fusion-sage", 1],
			["monster-reborn", 1],
			["foolish-burial", 1],
			["infinite-impermanence", 3],
			["solemn-strike", 1],
			["seven-tools-of-the-bandit", 1],
			["magic-jammer", 1],
		),
		extra: build(["elemental-hero-flame-wingman", 3], ["elemental-hero-shining-flare-wingman", 1], ["elemental-hero-thunder-giant", 2], ["elemental-hero-great-tornado", 2], ["elemental-hero-nova-master", 2], ["elemental-hero-gaia", 2], ["elemental-hero-rampart-blaster", 1], ["gaia-saber-the-lightning-shadow", 1], ["gem-knight-pearl", 1]),
	},
	/* A strong trainer, as the trainers' strong tier plays (masters.ts): bold, now and then a move short of the best. */
	persona: { aggression: 1.1, skill: 0.85, caution: 1, answers: 1, slack: 0.85, plans: 1 },
};
