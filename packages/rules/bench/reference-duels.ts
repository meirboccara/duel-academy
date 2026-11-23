import { ASH_BLOSSOM_ANSWERS, type CardDef, type Duel, type EffectRecord, moveCard, negateEffect, other } from "../src";
import { position } from "../test/rules/fixtures";

/**
 * The reference boards of reference-boards.ts, rebuilt on the new core: the same cards in the same places, your turn,
 * Main Phase 1, the game state open. The cards are written as effect records (src/effects.ts), close
 * enough to their text for the listing to do the same kind of work: conditions over the Deck, the field and the chain,
 * targets, costs. They are benchmark fixtures, not cards of the rules core.
 *
 * What the new core does not list yet, and today's engine does: Normal Summons and Sets of monsters, battle position
 * changes, attacks, Fusion Summons. The ratio in BASELINE.md is to be read with that in mind until those steps land.
 */
const nothing: EffectRecord["operation"] = (duel) => duel;
const never = () => false;
const monstersOf = (duel: Duel, side: "you" | "rival") => duel.piles[side].monster;
const discardItself: EffectRecord["cost"] = (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" });
const FIELD_SPELLS = new Set(["umi"]);
const isMonster = (duel: Duel, id: number) => DEFS[duel.cards[id]!.code]?.kind === "monster";

const monster = (code: string, effect?: Omit<EffectRecord, "type" | "range" | "operation"> & { operation?: EffectRecord["operation"] }): CardDef => ({ code, kind: "monster", effects: effect ? [{ type: "quick", range: "hand", operation: nothing, ...effect }] : undefined });
const card = (code: string, kind: CardDef["kind"], effect: Partial<EffectRecord> = {}): CardDef => ({ code, kind, effects: [{ type: "activation", operation: nothing, ...effect }] });

const LIST: CardDef[] = [
	...["dark-magician", "celtic-guardian", "summoned-skull", "blue-eyes-white-dragon", "giant-soldier-of-stone"].map((code) => monster(code)),
	// Hand effects. Kuriboh and Droll & Lock Bird wait for an event the core does not raise yet.
	monster("kuriboh", { condition: never, cost: discardItself, operation: nothing }),
	monster("droll-lock-bird", { condition: never, cost: discardItself, operation: nothing }),
	monster("ash-blossom-joyous-spring", {
		condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.some((category) => ASH_BLOSSOM_ANSWERS.includes(category)) ?? false,
		cost: discardItself,
		operation: (duel, _link, index) => negateEffect(duel, index - 1),
	}),
	monster("effect-veiler", {
		condition: (duel, { player }) => duel.turn.player !== player && (duel.turn.phase === "main1" || duel.turn.phase === "main2"),
		target: (duel, { player }) => monstersOf(duel, other(player)).filter((id) => duel.cards[id]!.face === "up"),
		cost: discardItself,
		operation: nothing,
	}),
	monster("ghost-ogre-snow-rabbit", {
		condition: (duel) => {
			const top = duel.chain[duel.chain.length - 1];
			return top !== undefined && duel.cards[top.card.id]!.zone === "monster";
		},
		cost: discardItself,
		operation: nothing,
	}),
	// Spells.
	card("pot-of-greed", "spell", { categories: ["draw"], condition: (duel, { player }) => duel.piles[player].deck.length >= 2 }),
	card("terraforming", "spell", { categories: ["search"], condition: (duel, { player }) => duel.piles[player].deck.some((id) => FIELD_SPELLS.has(duel.cards[id]!.code)) }),
	card("raigeki", "spell", { condition: (duel, { player }) => monstersOf(duel, other(player)).length > 0 }),
	card("harpies-feather-duster", "spell", { condition: (duel, { player }) => duel.piles[other(player)].spell.length > 0 }),
	card("foolish-burial", "spell", { categories: ["send-from-deck"], condition: (duel, { player }) => duel.piles[player].deck.some((id) => isMonster(duel, id)) }),
	card("monster-reborn", "spell", { categories: ["summon"], target: (duel) => [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard].filter((id) => isMonster(duel, id)) }),
	// Polymerization needs Fusion Summons (step 8).
	card("polymerization", "spell", { condition: never }),
	// Traps. The Mirror Forces wait for an attack; Solemn Strike answers a monster effect.
	card("mirror-force", "trap", { condition: never }),
	card("storming-mirror-force", "trap", { condition: never }),
	card("solemn-strike", "counter-trap", { condition: (duel) => duel.chain.length > 0 && isMonster(duel, duel.chain[duel.chain.length - 1]!.card.id) }),
	card("infinite-impermanence", "trap", { target: (duel, { player }) => monstersOf(duel, other(player)).filter((id) => duel.cards[id]!.face === "up") }),
];
const DEFS: Record<string, CardDef> = Object.fromEntries(LIST.map((def) => [def.code, def]));

export const REFERENCE_DUELS: Record<string, () => Duel> = {
	/** Turn 1, Main Phase 1: five cards in hand, nothing on the field. */
	opening: () =>
		position({
			defs: DEFS,
			you: { hand: ["dark-magician", "celtic-guardian", "pot-of-greed", "terraforming", "mirror-force"], deck: ["kuriboh", "summoned-skull", "raigeki", "monster-reborn", "foolish-burial"] },
			rival: { hand: ["ash-blossom-joyous-spring", "effect-veiler", "kuriboh", "celtic-guardian", "raigeki"], deck: ["summoned-skull", "dark-magician"] },
		}),
	/** Mid-duel: monsters and Set cards on both sides, hand traps waiting. */
	midgame: () =>
		position({
			defs: DEFS,
			you: {
				hand: ["monster-reborn", "polymerization", "summoned-skull", "infinite-impermanence"],
				monsters: ["dark-magician", "celtic-guardian", "giant-soldier-of-stone"],
				set: ["mirror-force", "solemn-strike"],
				graveyard: ["blue-eyes-white-dragon", "kuriboh"],
				deck: ["pot-of-greed", "raigeki", "foolish-burial", "terraforming"],
			},
			rival: {
				hand: ["ash-blossom-joyous-spring", "droll-lock-bird", "ghost-ogre-snow-rabbit"],
				monsters: ["blue-eyes-white-dragon", "summoned-skull"],
				set: ["storming-mirror-force", "infinite-impermanence"],
				deck: ["kuriboh", "dark-magician"],
			},
		}),
	/** A crowded hand: many cards to place, many zones to choose. */
	crowdedHand: () =>
		position({
			defs: DEFS,
			you: {
				hand: ["dark-magician", "celtic-guardian", "summoned-skull", "kuriboh", "pot-of-greed", "raigeki", "monster-reborn", "mirror-force", "solemn-strike", "harpies-feather-duster"],
				deck: ["blue-eyes-white-dragon", "giant-soldier-of-stone", "terraforming", "foolish-burial"],
				graveyard: ["blue-eyes-white-dragon"],
			},
			rival: { monsters: ["summoned-skull", "giant-soldier-of-stone"], set: ["mirror-force"], hand: ["effect-veiler"], deck: ["kuriboh"] },
		}),
};
