import { drawCards, pickRandom, shuffleDeck } from "../deck";
import { delay, watch } from "../delayed";
import { type Duel, moveCards, other, type Side } from "../duel";
import type { CardDef, EffectRecord, Facts } from "../effects";
import type { GameEvent } from "../events";
import { controlsNoCards } from "../negation";
import { discardThis } from "./helpers";

/**
 * What the "Mulcharmy" monsters share (Fuwalos, Purulia; each card's file holds its own text, sources and the Summons it counts):
 *
 * "If you control no cards (Quick Effect): You can discard this card; apply these effects this turn.
 *  ●Each time your opponent [Summons ...], immediately draw 1 card.
 *  ●Once, during this End Phase, if the number of cards in your hand is more than the number of cards your opponent controls +6, you
 *   must randomly shuffle cards from your hand into the Deck so the number in your hand equals the number your opponent controls +6.
 *  You can only activate 1 other "Mulcharmy" monster effect, the turn you activate this effect."
 *
 * - The activation: a Quick Effect in the hand (either player's turn; not in the Damage Step, which the core's Damage Step rule
 *   already gives), while its player controls no cards; discarding itself is the cost. It can be activated when no draw is possible
 *   (Konami's notes), so it does not ask for a draw or an add to be possible (`requiresDraw` and `requiresAddToHand` are not set).
 * - Its effect includes drawing (category "draw"), so Ash Blossom & Joyous Spring can answer it: YGOProJudge's answer for this card
 *   (asked 2026-11-24, no source cited); Konami's Q&A on draw effects is Ash Blossom's record `draw-is-add-to-hand`.
 * - The first ●: a watch (src/delayed.ts): applied at once each time, with no Chain Link, once per group of monsters Summoned at the
 *   same time, each resolved copy on its own (Konami's notes). The draw is `drawCards`: nothing while cards cannot be added from the
 *   Deck, and a loss with an empty Deck (the notes again).
 * - The second ●: a delayed effect due in this turn's End Phase, mandatory, with its condition read when it would be applied; it
 *   starts no chain (the notes). The cards are picked with the Duel's seeded RNG and the Deck is shuffled.
 * - The last sentence is not an effect (the notes): it is part of the activation condition, counted on the turn's activations
 *   (`Duel.activations`), negated ones included (Konami's Q&A fid 7813). Every "Mulcharmy" monster carries it, so the core reads it as
 *   "at most 2 Mulcharmy monster effects activated by this player in the turn"; a "Mulcharmy" monster without the sentence, activated
 *   after one with it, would not be stopped (no such card exists).
 */
export const MULCHARMY = "Mulcharmy";

/** How many "Mulcharmy" monster effects `player` has activated this turn, negated or not. */
export function mulcharmyActivations(duel: Duel, player: Side): number {
	let count = 0;
	for (const entry of duel.activations) {
		const def = duel.defs[entry.card.code];
		if (entry.player === player && def?.kind === "monster" && def.facts?.archetypes?.includes(MULCHARMY)) count++;
	}
	return count;
}

/** The number of cards a player controls: monsters, Spells and Traps, and the Field Zone. */
const controlled = (duel: Duel, side: Side): number => duel.piles[side].monster.length + duel.piles[side].spell.length + duel.piles[side].field.length;

/** The hand limit of the second ●: the number of cards the opponent controls, +6. */
const handLimit = (duel: Duel, player: Side): number => controlled(duel, other(player)) + 6;

type Summoned = Extract<GameEvent, { type: "summoned" }>;

/** A "Mulcharmy" monster: its printed facts and which Summons of the opponent its first ● counts. */
export function mulcharmy(code: string, facts: Facts, counts: (event: Summoned) => boolean): CardDef {
	const effect: EffectRecord = {
		type: "quick",
		range: "hand",
		categories: ["draw"],
		condition: (duel, { player }) => controlsNoCards(duel, player) && mulcharmyActivations(duel, player) < 2,
		cost: discardThis,
		operation: (duel, link) => {
			const watching = watch(duel, link, {
				until: duel.turn.number,
				// "Your opponent Summons": the player who performed the Summon, whoever's Deck the monster came from (Konami's Q&A fid 24217).
				event: (_board, event, self) => event.type === "summoned" && (event.player ?? event.card.controller) === other(self.player) && counts(event),
				apply: (board, self) => drawCards(board, self.player, 1),
			});
			return delay(watching, link, {
				due: { phase: "end", turn: duel.turn.number },
				mandatory: true,
				condition: (board, self) => board.piles[self.player].hand.length > handLimit(board, self.player),
				apply: (board, self) => {
					const hand = board.piles[self.player].hand;
					const { duel: picking, picked } = pickRandom(board, hand, hand.length - handLimit(board, self.player));
					return shuffleDeck(moveCards(picking, picked, { zone: "deck" }), self.player);
				},
			});
		},
	};
	return { code, kind: "monster", facts: { ...facts, archetypes: [MULCHARMY] }, effects: [effect] };
}
