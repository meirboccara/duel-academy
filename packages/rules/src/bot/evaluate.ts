import { type CardInstance, type Duel, other, type Side } from "../duel";
import { type CardDef, inFieldRange, rangeOf } from "../effects";
import { atk, def, isNegated } from "../modifiers";
import { isSpent, keyOf } from "../once";
import { hiddenFrom } from "./hidden";

/**
 * Step 9: a score of the Duel from one side's view (docs/rules-core/step9/design.md, "Evaluation"): that side's assets minus the
 * opponent's. It reads only what `viewFor(duel, side)` keeps: of a card `side` cannot see, only that it is there.
 */
export const WIN = 1_000_000;

/** The weights, first guesses on the scale of today's bot (3 per card in hand). */
const LP = 1 / 100;
const CARD_IN_HAND = 3;
const FACE_DOWN_MONSTER = 4;
const MONSTER = 3;
const OTHER_ON_FIELD = 2;
const EXTRA_DECK = 0.5;
const GRAVEYARD = 0.1;
const INTERRUPTION = 2;
/** An unknown Set Spell or Trap Card of the opponent might be a negator: half an interruption. */
const UNKNOWN_SET = 0.5;

export function evaluate(duel: Duel, side: Side): number {
	if (duel.winner) return duel.winner === "draw" ? 0 : duel.winner === side ? WIN : -WIN;
	return assets(duel, side, side) - assets(duel, other(side), side);
}

/** What `owner` has, as `viewer` sees it. */
function assets(duel: Duel, owner: Side, viewer: Side): number {
	const piles = duel.piles[owner];
	let total = duel.lp[owner] * LP + piles.hand.length * CARD_IN_HAND + (piles.spell.length + piles.field.length) * OTHER_ON_FIELD;
	for (const id of piles.monster) {
		const card = duel.cards[id]!;
		total += card.face === "down" ? FACE_DOWN_MONSTER : MONSTER + (card.position === "attack" ? atk(duel, id) / 200 : def(duel, id) / 250);
	}
	total += piles.extra.filter((id) => duel.cards[id]!.face === "down").length * EXTRA_DECK + piles.graveyard.length * GRAVEYARD;
	return total + interruptions(duel, owner, viewer) * INTERRUPTION;
}

/**
 * How many times `owner` can answer the other player, as `viewer` sees it: a monster in hand with a Quick Effect usable from the hand
 * (a hand trap), a Set Trap, Quick-Play Spell or Counter Trap, a face-up card with a Quick Effect on the field, each only while its
 * once-per-turn use is not spent and it is not negated. A Set Spell or Trap Card `viewer` cannot see counts as half.
 */
export function interruptions(duel: Duel, owner: Side, viewer: Side): number {
	const piles = duel.piles[owner];
	let count = 0;
	for (const zone of ["hand", "spell", "field", "monster"] as const) {
		for (const id of piles[zone]) {
			const card = duel.cards[id]!;
			if (hiddenFrom(card, viewer)) {
				if (zone === "spell") count += UNKNOWN_SET;
				continue;
			}
			if (canAnswer(duel, card, duel.defs[card.code])) count++;
		}
	}
	return count;
}

const FAST_SPELLS_AND_TRAPS: ReadonlySet<CardDef["kind"]> = new Set(["quick-play", "trap", "counter-trap"]);

function canAnswer(duel: Duel, card: CardInstance, def: CardDef | undefined): boolean {
	const effects = def?.effects;
	if (!effects) return false;
	// A Set card counts even if it was Set this turn: it is there for the opponent's turn (not counting it would make Setting a Trap a loss).
	if (card.zone !== "hand" && card.face === "down") return card.zone !== "monster" && FAST_SPELLS_AND_TRAPS.has(def.kind) && effects.some((effect, index) => effect.type === "activation" && !isSpent(duel, effect, keyOf(effect, card.controller, card, index)));
	if (card.zone !== "hand" && isNegated(duel, card.id)) return false;
	return effects.some((effect, index) => {
		if (effect.type !== "quick") return false;
		const range = rangeOf(effect);
		if (card.zone === "hand" ? range !== "hand" : !inFieldRange(def, card, range)) return false;
		return !isSpent(duel, effect, keyOf(effect, card.controller, card, index));
	});
}
