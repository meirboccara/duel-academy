/**
 * Step 4 of docs/rules-core-spec.md: what activating an effect record takes, shared by an effect the player activates
 * (chain.ts) and a trigger put on a chain (triggers.ts), so the listing and the activation cannot disagree.
 */
import { type CardInstance, type Duel, type Link, moveCard, type Side } from "./duel";
import { dropWhen } from "./events";
import { type CardDef, type EffectContext, type EffectRecord, effectOf, speedOf } from "./effects";
import { isSpent, keyOf, spend } from "./once";

const NO_TARGETS: readonly number[] = Object.freeze([]);
const NONE: readonly (readonly number[])[] = Object.freeze([]);
const JUST_ACTIVATE: readonly (readonly number[])[] = Object.freeze([NO_TARGETS]);

/** The card as it is once activated: a Spell or Trap Card is placed face-up on the field, a monster's effect leaves it in place. */
const placed = (duel: Duel, effect: EffectRecord, card: CardInstance): Duel => (effect.type === "activation" ? moveCard(duel, card.id, { zone: "spell", face: "up" }) : duel);

/**
 * Every way an effect can be activated now, as the targets chosen: none (`[]`) when it cannot be, one empty way when it
 * needs no target. The condition and the once-per-turn limit are read on the duel as it is; the cost is a dry run on the
 * duel with the card placed; the targets are the candidates on the board that leaves. Nothing is spent.
 */
export function activationWays(duel: Duel, ctx: EffectContext, index: number, effect: EffectRecord): readonly (readonly number[])[] {
	if (effect.condition && !effect.condition(duel, ctx)) return NONE;
	if (isSpent(duel, effect, keyOf(effect, ctx.player, ctx.card, index))) return NONE;
	if (!effect.cost && !effect.target) return JUST_ACTIVATE;
	let board = placed(duel, effect, ctx.card);
	const now = { player: ctx.player, card: board.cards[ctx.card.id]! };
	if (effect.cost) {
		const paid = effect.cost(board, now);
		if (!paid) return NONE;
		board = paid;
	}
	if (!effect.target) return JUST_ACTIVATE;
	return effect.target(board, { player: ctx.player, card: board.cards[ctx.card.id]! }).map((target) => [target]);
}

/**
 * Activates the effect for real: places the card, pays the cost, checks the targets again on the board the cost left,
 * freezes the link, spends the once-per-turn limit, and puts the link on the chain. Priority is the caller's.
 * Throws if the cost cannot be paid or a target is no longer legal: the listing has already ruled those out.
 */
export function activateEffect(duel: Duel, player: Side, card: CardInstance, index: number, targets: readonly number[]): Duel {
	const effect = effectOf(duel, { card, effect: index });
	const placedDuel = placed(duel, effect, card);
	// The link holds the card as it is when activated: placed face-up (for a card activation), before the cost.
	const activated = placedDuel.cards[card.id]!;
	let next = placedDuel;
	if (effect.cost) {
		const paid = effect.cost(next, { player, card: activated });
		if (!paid) throw new Error(`the cost of ${card.code} cannot be paid`);
		next = paid;
	}
	if (effect.target) {
		const candidates = effect.target(next, { player, card: next.cards[card.id]! });
		if (targets.length !== 1 || !candidates.includes(targets[0]!)) throw new Error(`${JSON.stringify(targets)} is not a legal target of ${card.code} once its cost is paid`);
	}
	next = dropWhen(next);
	const key = keyOf(effect, player, card, index);
	const link = newLink(next, player, activated, index, targets, key);
	return { ...spend(next, effect, key), chain: [...next.chain, link] };
}

/** A link for an activation, holding the card as it was when activated and what the effect declared it would do, frozen. */
function newLink(duel: Duel, player: Side, card: CardInstance, index: number, targets: readonly number[], spent: string | null): Link {
	const effect = effectOf(duel, { card, effect: index });
	const declared = typeof effect.categories === "function" ? effect.categories(duel, { player, card: duel.cards[card.id]! }, targets) : (effect.categories ?? []);
	return { player, card, effect: index, speed: speedOf(duel.defs[card.code] as CardDef, effect), targets, targetMoves: targets.map((id) => duel.cards[id]!.moves), spent, categories: [...declared], activationNegated: false, effectNegated: false };
}
