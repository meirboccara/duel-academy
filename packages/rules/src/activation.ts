/**
 * Step 4 of docs/rules-core-spec.md: what activating an effect record takes, shared by an effect the player activates
 * (chain.ts) and a trigger put on a chain (triggers.ts), so the listing and the activation cannot disagree.
 */
import { type CardInstance, type Duel, type Link, moveCard, type Side } from "./duel";
import { type Action, sameIds } from "./action";
import { dropWhen } from "./events";
import { type CardDef, type Cost, type CostSpec, type EffectContext, type EffectRecord, effectOf, speedOf } from "./effects";
import { hitByCardNegation, isNegated } from "./negation";
import { isSpent, keyOf, spend } from "./once";

const NO_CARDS: readonly number[] = Object.freeze([]);
const NO_WAYS: readonly Way[] = Object.freeze([]);
/** Pay with no card chosen: the one way of a cost that offers no choice. */
const PAY_WITH_NO_CHOSEN_CARDS: readonly (readonly number[])[] = Object.freeze([NO_CARDS]);
/** An effect with no cost and no target: the one way to activate it. */
const ACTIVATE_AS_IS: readonly Way[] = Object.freeze([{ paid: NO_CARDS, targets: NO_CARDS }]);
/** The number of targets of a record that does not say: exactly one. */
const EXACTLY_ONE_TARGET = { min: 1, max: 1 } as const;

/** One way to activate an effect: the cards chosen to pay its cost, and the targets chosen. */
export interface Way {
	readonly paid: readonly number[];
	readonly targets: readonly number[];
}

/** A cost as the ways of paying it: a plain function is one way, with no card chosen. */
const costSpecOf = (cost: Cost): CostSpec => (typeof cost === "function" ? { pay: (duel, ctx) => cost(duel, ctx) } : cost);

/** The ways a cost can be paid, as lists of the cards chosen: the spec's `pick`, or the one way with no choice. */
const waysToPay = (cost: CostSpec, duel: Duel, ctx: EffectContext) => (cost.pick ? cost.pick(duel, ctx) : PAY_WITH_NO_CHOSEN_CARDS);

/** The card as it is once activated: a Spell or Trap Card is placed face-up on the field, a monster's effect leaves it in place. */
const placed = (duel: Duel, effect: EffectRecord, card: CardInstance): Duel => (effect.type === "activation" ? moveCard(duel, card.id, { zone: "spell", face: "up" }) : duel);

/** A record that counts targets but has nothing to target is a mistake in the card, not something to ignore. */
function checkDefinition(card: CardInstance, effect: EffectRecord): void {
	if (effect.targetCount && !effect.target) throw new Error(`${card.code}: an effect with a targetCount needs a target function`);
}

/**
 * Every way an effect can be activated now: none (`[]`) when it cannot be. The condition and the once-per-turn limit are
 * read on the duel as it is; each way of paying the cost is a dry run on the duel with the card placed; the targets are
 * the combinations of candidates on the board that way leaves. Nothing is spent. With `firstOnly` it stops at the first
 * way (to tell whether there is one, without building every cost and target combination).
 */
export function activationWays(duel: Duel, ctx: EffectContext, index: number, effect: EffectRecord, firstOnly = false): readonly Way[] {
	checkDefinition(ctx.card, effect);
	if (effect.condition && !effect.condition(duel, ctx)) return NO_WAYS;
	if (isSpent(duel, effect, keyOf(effect, ctx.player, ctx.card, index))) return NO_WAYS;
	if (!effect.cost && !effect.target) return ACTIVATE_AS_IS;
	const board = placed(duel, effect, ctx.card);
	const now = { player: ctx.player, card: board.cards[ctx.card.id]! };
	const cost = effect.cost ? costSpecOf(effect.cost) : null;
	if (cost?.can && !cost.can(board, now)) return NO_WAYS;
	const ways: Way[] = [];
	for (const paid of cost ? waysToPay(cost, board, now) : PAY_WITH_NO_CHOSEN_CARDS) {
		const after = cost ? cost.pay(board, now, paid) : board;
		if (!after) continue;
		if (!effect.target) {
			ways.push({ paid, targets: NO_CARDS });
		} else {
			const room = firstOnly ? 1 : Infinity;
			for (const targets of combinations(effect.target(after, { player: ctx.player, card: after.cards[ctx.card.id]! }), effect.targetCount ?? EXACTLY_ONE_TARGET, room)) ways.push({ paid, targets });
		}
		if (firstOnly && ways.length > 0) break;
	}
	return ways;
}

/**
 * Every choice of `min` to `max` different candidates, in the order the candidates come (a card repeated in the list
 * counts once), up to `limit` of them. Not capped otherwise: a card that targets "up to 5" of 30 candidates lists them all.
 */
function combinations(candidates: readonly number[], { min, max }: NonNullable<EffectRecord["targetCount"]>, limit: number): readonly (readonly number[])[] {
	const distinct = [...new Set(candidates)];
	const found: (readonly number[])[] = [];
	const pick = (from: number, chosen: readonly number[]): void => {
		if (chosen.length >= min) found.push(chosen);
		if (chosen.length === max) return;
		for (let i = from; i < distinct.length && found.length < limit; i++) pick(i + 1, [...chosen, distinct[i]!]);
	};
	pick(0, []);
	return found.slice(0, limit);
}

/**
 * Activates the effect for real: places the card, pays the cost, checks the targets again on the board the cost left,
 * freezes the link, spends the once-per-turn limit, and puts the link on the chain. Priority is the caller's.
 * `answering`: the link responds to the link on top of the chain (false for a trigger put on a chain at a trigger point).
 * Throws when what it is given is not a way `activationWays` lists, which the listing has already ruled out: a `paid`
 * that is not one of the ways the cost offers (a plain function cost offers none but the empty one), a cost that cannot be
 * paid, or targets that are not a legal choice once the cost is paid.
 */
export function activateEffect(duel: Duel, player: Side, card: CardInstance, index: number, { paid, targets }: Way, answering = true): Duel {
	const effect = effectOf(duel, { card, effect: index });
	checkDefinition(card, effect);
	// A monster whose effects are negated still activates its effect and pays the cost; the effect is negated (Konami's notes on Effect Veiler and Infinite Impermanence).
	const negatedCard = hitByCardNegation(duel, { card, effect: index }) && isNegated(duel, card.id);
	const placedDuel = placed(duel, effect, card);
	// The link holds the card as it is when activated: placed face-up (for a card activation), before the cost.
	const activated = placedDuel.cards[card.id]!;
	let next = placedDuel;
	const cost = effect.cost ? costSpecOf(effect.cost) : null;
	const ctx = { player, card: activated };
	if (!(cost ? waysToPay(cost, next, ctx) : PAY_WITH_NO_CHOSEN_CARDS).some((way) => sameIds(way, paid))) throw new Error(`${JSON.stringify(paid)} is not a way to pay the cost of ${card.code}`);
	if (cost) {
		const after = cost.pay(next, ctx, paid);
		if (!after) throw new Error(`the cost of ${card.code} cannot be paid`);
		next = after;
	}
	if (effect.target) {
		const candidates = effect.target(next, { player, card: next.cards[card.id]! });
		const { min, max } = effect.targetCount ?? EXACTLY_ONE_TARGET;
		if (targets.length < min || targets.length > max || new Set(targets).size !== targets.length || !targets.every((target) => candidates.includes(target))) throw new Error(`${JSON.stringify(targets)} is not a legal choice of targets for ${card.code} once its cost is paid`);
	}
	next = dropWhen(next);
	const key = keyOf(effect, player, card, index);
	const link = { ...newLink(next, player, activated, index, targets, key, answering), effectNegated: negatedCard };
	return { ...spend(next, effect, key), chain: [...next.chain, link] };
}

/** A link for an activation, holding the card as it was when activated and what the effect declared it would do, frozen. */
function newLink(duel: Duel, player: Side, card: CardInstance, index: number, targets: readonly number[], spent: string | null, answering: boolean): Link {
	const effect = effectOf(duel, { card, effect: index });
	const declared = typeof effect.categories === "function" ? effect.categories(duel, { player, card: duel.cards[card.id]! }, targets) : (effect.categories ?? []);
	return { player, card, effect: index, speed: speedOf(duel.defs[card.code] as CardDef, effect), targets, answers: answering && duel.chain.length > 0 ? duel.chain.length - 1 : null, targetMoves: targets.map((id) => duel.cards[id]!.moves), spent, categories: [...declared], activationNegated: false, effectNegated: false };
}

/** The action that activates an effect that way; `paid` is left out when the cost has no choice. */
export const activateAction = (card: number, effect: number, { paid, targets }: Way): Extract<Action, { type: "activate" }> => (paid.length === 0 ? { type: "activate", card, effect, targets } : { type: "activate", card, effect, targets, paid });
