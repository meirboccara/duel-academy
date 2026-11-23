import { closedPriority, destroyCard, type Duel, moveCard, type Side } from "./duel";
import { breakEffect, raiseEvent } from "./events";
import { triggerPoint } from "./triggers";

/**
 * Step 5 of docs/rules-core-spec.md: a Summon as a moment of its own. A Summon is not an activation and starts no chain
 * (rule record `normal-summon-is-an-action`); "negate the Summon" answers the attempt, before it has succeeded: the
 * monster is not on the field yet (Konami's Japanese Q&A on Infinite Impermanence, record `impermanence-no-cards-summon-not-on-field`).
 */

/**
 * The player attempts a Summon of a card in their hand. Something has happened, so nothing before it is the last thing
 * that happened; the turn player may use a fast effect first (box B), then the opponent (box C). When both pass with no
 * chain, the Summon succeeds (`finishSummon`). `player` is who Summons (always the turn player in step 5); whoever it is, the turn player
 * has priority first.
 */
export function beginSummon(duel: Duel, player: Side, id: number, how: "normal" | "special"): Duel {
	const next = breakEffect(duel);
	return { ...next, summoning: { player, cards: [id], how, negated: false }, normalSummoned: how === "normal" ? true : next.normalSummoned, priority: closedPriority(duel.turn.player) };
}

/**
 * Both players passed on the moment. A Summon that was not negated succeeds: the monster goes to the Monster Zone
 * face-up and `summoned` is raised (the "when Summoned" triggers); one that was negated raises nothing.
 */
export function finishSummon(duel: Duel): Duel {
	const summoning = duel.summoning!;
	let next: Duel = { ...duel, summoning: null };
	if (!summoning.negated) {
		for (const id of summoning.cards) {
			next = moveCard(next, id, { zone: "monster", face: "up" });
			next = raiseEvent(next, { type: "summoned", card: next.cards[id]!, how: summoning.how });
		}
	}
	return triggerPoint(next, closedPriority(duel.turn.player));
}

/**
 * Can a card that negates the Summon be activated against the Summon in progress? It must be one, and not already negated,
 * and no monster in it may have a Summon that cannot be negated (then the negating card is not offered at all: Konami's notes on
 * Obelisk the Tormentor, record `negate-summon-cannot-be-negated`). With `only`, just for that kind of Summon (Solemn Strike: Special).
 */
export function summonNegatable(duel: Duel, only?: "special"): boolean {
	const summoning = duel.summoning;
	if (!summoning || summoning.negated) return false;
	if (only && summoning.how !== only) return false;
	return summoning.cards.every((id) => duel.defs[duel.cards[id]!.code]?.summon?.cannotBeNegated?.includes(summoning.how) !== true);
}

/** Negates the Summon in progress: it will not succeed. Nothing happens to a Summon that cannot be negated. */
export function negateSummon(duel: Duel): Duel {
	return summonNegatable(duel) ? { ...duel, summoning: { ...duel.summoning!, negated: true } } : duel;
}

/**
 * "Negate the Summon, and if you do, destroy that card." The monster has not reached the field: it goes from where it is to
 * the Graveyard, and Konami does not treat it as sent from the field (record `negated-summon-not-from-field`).
 */
export function negateSummonAndDestroy(duel: Duel): Duel {
	if (!summonNegatable(duel)) return duel;
	const negated = negateSummon(duel);
	return negated.summoning!.cards.reduce((next, id) => destroyCard(next, id, { negated: true }), negated);
}
