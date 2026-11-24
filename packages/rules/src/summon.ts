import { type CardInstance, closedPriority, destroyCard, type Destruction, type Duel, moveCard, occupant, type Position, type Side, type Summoning, type SummonKind } from "./duel";
import { breakEffect, dropWhen, raiseEvent } from "./events";
import { triggerPoint } from "./triggers";
import { summonZones } from "./zones";

/**
 * Step 5 of docs/rules-core-spec.md: a Summon as a moment of its own. A Summon is not an activation and starts no chain
 * (rule record `normal-summon-is-an-action`); "negate the Summon" answers the attempt, before it has succeeded: the
 * monster is not on the field yet (Konami's Japanese Q&A on Infinite Impermanence, record `impermanence-no-cards-summon-not-on-field`).
 *
 * Step 8: every Summon a player performs ends here, whatever started it (src/procedures.ts): a Tribute Summon, a Synchro, Xyz, Link
 * or Pendulum Summon, a Flip Summon (the monster is on the field, face-down, during its window), and a Summon an effect performs
 * ("Synchro Summon using...") when that effect was Chain Link 1.
 */

/** What step 8 adds to an attempt: the battle position, the procedure, and whether a success makes the monster properly Summoned. */
export interface SummonAttempt {
	readonly position?: Position;
	readonly kind?: SummonKind;
	readonly proper?: boolean;
}

/**
 * The player attempts a Summon of a card in their hand. Something has happened, so nothing before it is the last thing
 * that happened; the turn player may use a fast effect first (box B), then the opponent (box C). When both pass with no
 * chain, the Summon succeeds (`finishSummon`). `player` is who Summons (always the turn player in step 5); whoever it is, the turn player
 * has priority first.
 */
export function beginSummon(duel: Duel, player: Side, id: number, how: "normal" | "special" | "flip", slot?: number, attempt: SummonAttempt = {}): Duel {
	const next = breakEffect(duel);
	const summoning: Summoning = {
		player,
		cards: [id],
		how,
		negated: false,
		...(slot === undefined ? {} : { slots: [slot] }),
		...(attempt.position === undefined ? {} : { positions: [attempt.position] }),
		...(attempt.kind === undefined ? {} : { kind: attempt.kind }),
		...(attempt.proper ? { proper: true } : {}),
	};
	return { ...next, summoning, normalSummoned: how === "normal" ? true : next.normalSummoned, priority: closedPriority(duel.turn.player) };
}

/**
 * Both players passed on the moment. A Summon that was not negated succeeds: the monster goes to the Monster Zone
 * face-up and `summoned` is raised (the "when Summoned" triggers); one that was negated raises nothing.
 */
export function finishSummon(duel: Duel): Duel {
	const summoning = duel.summoning!;
	const next: Duel = { ...duel, summoning: null };
	return triggerPoint(summoning.negated ? next : landSummon(next, summoning), closedPriority(duel.turn.player));
}

const mark = (duel: Duel, id: number, change: Partial<CardInstance>): Duel => ({ ...duel, cards: { ...duel.cards, [id]: { ...duel.cards[id]!, ...change } } });

/**
 * The Summon succeeds: each monster is put face-up on the field in its zone and position, becomes properly Summoned if this was its
 * own procedure, and `summoned` is raised (`by`: an effect put it there). A Flip Summon turns the monster face-up in Attack Position where it is, and raises
 * `flipped` first (RB10: a Flip Effect is activated when the card is Flip Summoned).
 */
export function landSummon(duel: Duel, summoning: Summoning, by?: "effect"): Duel {
	let next = duel;
	for (const [i, id] of summoning.cards.entries()) {
		const kind = { ...(summoning.kind === undefined ? {} : { kind: summoning.kind }), ...(by ? { by } : {}) };
		if (summoning.how === "flip") {
			// A monster that left, or was turned face-up, during the window is no longer Flip Summoned.
			if (next.cards[id]!.zone !== "monster" || next.cards[id]!.face !== "down") continue;
			next = moveCard(next, id, { zone: "monster", face: "up", position: "attack" });
			next = raiseEvent(next, { type: "flipped", card: next.cards[id]! });
			next = raiseEvent(next, { type: "summoned", card: next.cards[id]!, how: "flip" });
			continue;
		}
		// The zone chosen when the Summon was attempted; if something took it in the Summon's window, the first one the monster may still go to (the core's reading).
		const chosen = summoning.slots?.[i];
		const free = chosen !== undefined && occupant(next, summoning.player, "monster", chosen) === null;
		const slot = free ? chosen : summonZones(next, summoning.player, id)[0];
		// No zone left at all: the Summon cannot be made. The monster is sent to the Graveyard without reaching the field, and the Xyz
		// Materials stacked under it go there with it (the core's reading, no page read).
		if (slot === undefined) {
			next = moveCard(next, id, { zone: "graveyard", negated: true });
			continue;
		}
		next = moveCard(next, id, { zone: "monster", face: "up", controller: summoning.player, slot, position: summoning.positions?.[i] ?? "attack" });
		next = mark(next, id, { proper: next.cards[id]!.proper || summoning.proper === true, summonedBy: summoning.kind ?? null });
		next = raiseEvent(next, { type: "summoned", card: next.cards[id]!, how: summoning.how, ...kind });
	}
	return next;
}

/**
 * Step 8: the chain has finished resolving and its Chain Link 1 performed a Summon ("Synchro Summon using..."): the Summon is
 * attempted now, and its window opens, the turn player first (Konami's Japanese Q&A 24054, record `summon-by-effect-chain-link-1`).
 * The Summon is something new that happens: optional "when" triggers of the chain have missed the timing.
 */
export function openPendingSummon(duel: Duel): Duel {
	const dropped = dropWhen(duel);
	const { pending: _pending, ...summoning } = dropped.summoning!;
	// Like any Summon attempted (`beginSummon`): nothing before it is the last thing that happened, for an effect that `lingers` either.
	return { ...dropped, live: [], lingering: [], summoning, priority: closedPriority(duel.turn.player) };
}

/**
 * Can a card that negates the Summon be activated against the Summon in progress? It must be one, and not already negated,
 * and no monster in it may have a Summon that cannot be negated (then the negating card is not offered at all: Konami's notes on
 * Obelisk the Tormentor, record `negate-summon-cannot-be-negated`). With `only`, just for that kind of Summon (Solemn Strike: Special).
 */
export function summonNegatable(duel: Duel, only?: "special"): boolean {
	const summoning = duel.summoning;
	if (!summoning || summoning.negated || summoning.pending) return false;
	if (only && summoning.how !== only) return false;
	return summoning.cards.every((id) => (duel.defs[duel.cards[id]!.code]?.summon?.cannotBeNegated as readonly string[] | undefined)?.includes(summoning.how) !== true);
}

/** Negates the Summon in progress: it will not succeed. Nothing happens to a Summon that cannot be negated. */
export function negateSummon(duel: Duel): Duel {
	return summonNegatable(duel) ? { ...duel, summoning: { ...duel.summoning!, negated: true } } : duel;
}

/**
 * "Negate the Summon, and if you do, destroy that card." The monster has not reached the field: it goes from where it is to
 * the Graveyard, and Konami does not treat it as sent from the field (record `negated-summon-not-from-field`). Step 8: a monster
 * being Flip Summoned is on the field, and is destroyed there (Konami's Japanese Q&A 17662, record
 * `negated-flip-summon-destroyed-on-field`).
 */
export function negateSummonAndDestroy(duel: Duel, destruction: Destruction): Duel {
	if (!summonNegatable(duel)) return duel;
	const negated = negateSummon(duel);
	const flip = negated.summoning!.how === "flip";
	return negated.summoning!.cards.reduce((next, id) => destroyCard(next, id, { destruction, ...(flip ? {} : { negated: true as const }) }), negated);
}
