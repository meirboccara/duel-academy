/**
 * Step 4 of docs/rules-core-spec.md: what activating an effect record takes, shared by an effect the player activates
 * (chain.ts) and a trigger put on a chain (triggers.ts), so the listing and the activation cannot disagree.
 */
import { type CardInstance, type Duel, type Link, moveCard, type Side } from "./duel";
import { type Action, sameIds } from "./action";
import { dropWhen } from "./events";
import { type CardDef, type Cost, type CostSpec, type Declaration, type EffectContext, type EffectMode, type EffectRecord, effectOf, type Operation, sameDeclaration, speedOf, type TargetGroup } from "./effects";
import { activationLocked, anyShield, canBeTargetedBy, drawLocked, isNegatedLasting, locked } from "./modifiers";
import { hitByCardNegation } from "./negation";
import { isSpent, keyOf, spend } from "./once";

const NO_CARDS: readonly number[] = Object.freeze([]);
const NO_WAYS: readonly Way[] = Object.freeze([]);
/** Pay with no card chosen: the one way of a cost that offers no choice. */
const PAY_WITH_NO_CHOSEN_CARDS: readonly (readonly number[])[] = Object.freeze([NO_CARDS]);
/** An effect with no cost and no target: the one way to activate it. */
const ACTIVATE_AS_IS: readonly Way[] = Object.freeze([{ paid: NO_CARDS, targets: NO_CARDS }]);
/** The number of targets of a record that does not say: exactly one. */
const EXACTLY_ONE_TARGET = { min: 1, max: 1 } as const;

/** One way to activate an effect: the cards chosen to pay its cost, the mode chosen (an effect with modes) and the targets chosen. */
export interface Way {
	readonly paid: readonly number[];
	readonly targets: readonly number[];
	/** The mode chosen, for an effect with `modes`. */
	readonly mode?: number;
	/** What the player declared at activation ("declare 1 Attribute; ..."). */
	readonly declared?: Declaration;
	/** Step 7: the zone a card activated from the hand is placed in (default: the first free one). */
	readonly zone?: number;
	/** Coupled targets (`targetGroups`): how many of `targets` go to each group, in order. Two splits of the same cards are two ways. */
	readonly groups?: readonly number[];
}

/** What is chosen at activation beyond the cost: one per mode of an effect with modes, else the record itself. */
interface Facet {
	readonly mode?: number;
	readonly condition?: EffectMode["condition"];
	readonly target?: EffectRecord["target"];
	readonly targetCount?: EffectRecord["targetCount"];
	readonly categories?: EffectRecord["categories"];
	readonly declare?: EffectRecord["declare"];
	readonly targetGroups?: EffectRecord["targetGroups"];
	readonly sameCount?: true;
	readonly operation?: Operation;
}

const facetsCache = new WeakMap<EffectRecord, readonly Facet[]>();
/** The facets of a record: its modes (each with its index), or the record itself. Cached per record (records never change). */
function facetsOf(effect: EffectRecord): readonly Facet[] {
	if (!effect.modes) return [effect];
	let found = facetsCache.get(effect);
	if (!found) {
		found = Object.freeze(effect.modes.map((mode, index): Facet => ({ ...mode, mode: index })));
		facetsCache.set(effect, found);
	}
	return found;
}

/** The facet a link was activated with: its mode, or the record. */
const facetOf = (effect: EffectRecord, mode: number | undefined): Facet => (mode === undefined ? effect : facetsOf(effect)[mode]!);

/** What a link does when it resolves: the operation of the mode chosen, or the record's. */
export const operationOf = (effect: EffectRecord, link: Link): Operation => facetOf(effect, link.mode).operation!;

/** A cost as the ways of paying it: a plain function is one way, with no card chosen. */
const costSpecOf = (cost: Cost): CostSpec => (typeof cost === "function" ? { pay: (duel, ctx) => cost(duel, ctx) } : cost);

/** The ways a cost can be paid, as lists of the cards chosen: the spec's `pick`, or the one way with no choice. */
const waysToPay = (cost: CostSpec, duel: Duel, ctx: EffectContext) => (cost.pick ? cost.pick(duel, ctx) : PAY_WITH_NO_CHOSEN_CARDS);

/**
 * The card as it is once activated: a Spell or Trap Card is placed face-up on the field (a Set one where it is; from the hand, a Field
 * Spell in the Field Zone, any other in the Spell & Trap Zone `slot`), a monster's effect leaves it in place.
 */
function placed(duel: Duel, effect: EffectRecord, card: CardInstance, slot?: number): Duel {
	if (effect.type !== "activation") return duel;
	if (card.zone === "spell" || card.zone === "field") return moveCard(duel, card.id, { zone: card.zone, face: "up" });
	return duel.defs[card.code]?.facts?.icon === "field" ? moveCard(duel, card.id, { zone: "field", face: "up" }) : moveCard(duel, card.id, { zone: "spell", face: "up", slot });
}

/**
 * A record that counts targets but has nothing to target, that has no operation, or that has one besides its modes, is a mistake in
 * the card, not something to ignore.
 */
function checkDefinition(card: CardInstance, effect: EffectRecord): void {
	if (effect.modes) {
		if (effect.operation || effect.target || effect.targetCount || effect.declare || effect.categories || effect.targetGroups || effect.sameCount || effect.modes.length === 0) throw new Error(`${card.code}: an effect with modes has its operation, targets and declaration in each mode`);
		for (const mode of effect.modes) checkTargets(card, mode);
		return;
	}
	checkTargets(card, effect);
	if (!effect.operation && effect.type !== "continuous") throw new Error(`${card.code}: an effect needs an operation`);
}

function checkTargets(card: CardInstance, facet: Facet & { readonly targetCount?: unknown }): void {
	if (facet.targetCount && !facet.target) throw new Error(`${card.code}: an effect with a targetCount needs a target function`);
	if (facet.targetGroups && facet.target) throw new Error(`${card.code}: an effect targets with target or with targetGroups, not both`);
	if (facet.sameCount && !facet.targetGroups) throw new Error(`${card.code}: sameCount needs targetGroups`);
}

/** An effect with no cost, no target, no modes and nothing to declare has one way to activate. */
const asIs = (effect: EffectRecord): boolean => !effect.cost && !effect.target && !effect.targetGroups && !effect.modes && !effect.declare;

/**
 * Every way an effect can be activated now: none (`[]`) when it cannot be. The condition and the once-per-turn limit are
 * read on the duel as it is (and each mode's own condition); each way of paying the cost is a dry run on the duel with the card
 * placed; the targets are the combinations of candidates on the board that way leaves. Nothing is spent. With `firstOnly` it stops
 * at the first way (to tell whether there is one, without building every cost and target combination).
 */
export function activationWays(duel: Duel, ctx: EffectContext, index: number, effect: EffectRecord, firstOnly = false): readonly Way[] {
	checkDefinition(ctx.card, effect);
	if (effect.requiresAddToHand && locked(duel, "add-to-hand", ctx.player)) return NO_WAYS;
	// A card that only draws at once needs the draw to be possible now (`EffectRecord.requiresDraw`).
	if (effect.requiresDraw && drawLocked(duel, ctx.player)) return NO_WAYS;
	// A prohibition ("cannot activate monster effects", "... cards or effects with that name"): the activation is not offered at all.
	if (activationLocked(duel, ctx, index, effect)) return NO_WAYS;
	if (effect.condition && !effect.condition(duel, ctx)) return NO_WAYS;
	if (isSpent(duel, effect, keyOf(effect, ctx.player, ctx.card, index))) return NO_WAYS;
	if (asIs(effect)) return ACTIVATE_AS_IS;
	const facets = effect.modes ? facetsOf(effect).filter((facet) => !facet.condition || facet.condition(duel, ctx)) : facetsOf(effect);
	if (facets.length === 0) return NO_WAYS;
	const board = placed(duel, effect, ctx.card);
	const now = { player: ctx.player, card: board.cards[ctx.card.id]! };
	const cost = effect.cost ? costSpecOf(effect.cost) : null;
	if (cost?.can && !cost.can(board, now)) return NO_WAYS;
	// What may be declared is read on the duel as it is, before the cost (like the condition), once per facet.
	const declarations = facets.map((facet) => (facet.declare ? facet.declare(duel, ctx) : NO_DECLARATION));
	const ways: Way[] = [];
	for (const paid of cost ? waysToPay(cost, board, now) : PAY_WITH_NO_CHOSEN_CARDS) {
		const after = cost ? cost.pay(board, now, paid) : board;
		if (!after) continue;
		for (let f = 0; f < facets.length; f++) {
			const facet = facets[f]!;
			const room = firstOnly ? 1 : Infinity;
			const at = { player: ctx.player, card: after.cards[ctx.card.id]! };
			const targetChoices: readonly { readonly targets: readonly number[]; readonly sizes?: readonly number[] }[] = facet.target
				? combinations(targetable(after, at, facet.target(after, at)), facet.targetCount ?? EXACTLY_ONE_TARGET, room).map((targets) => ({ targets }))
				: facet.targetGroups
					? groupCombinations(targetableGroups(after, at, facet.targetGroups(after, at)), facet.sameCount === true, room)
					: NO_TARGET_CHOICE.map((targets) => ({ targets }));
			for (const declared of declarations[f]!) {
				for (const choice of targetChoices) ways.push(wayOf(paid, choice.targets, facet.mode, declared, choice.sizes));
				if (firstOnly && ways.length > 0) return ways;
			}
		}
	}
	return ways;
}

/**
 * The candidates the effect may really target: a card that "cannot be targeted" by this effect is left out (the protection layer,
 * src/modifiers.ts). Asked for every effect that targets, in the listing and again at activation; with no modifier and no continuous
 * card in the Duel, the list comes back as it is.
 */
function targetable(duel: Duel, ctx: EffectContext, candidates: readonly number[]): readonly number[] {
	if (candidates.length === 0 || !anyShield(duel)) return candidates;
	const kept = candidates.filter((id) => canBeTargetedBy(duel, id, ctx));
	return kept.length === candidates.length ? candidates : kept;
}

const targetableGroups = (duel: Duel, ctx: EffectContext, groups: readonly TargetGroup[]): readonly TargetGroup[] => groups.map((group) => { const from = targetable(duel, ctx, group.from); return from === group.from ? group : { ...group, from }; });

/** A facet with nothing to declare: one way, with no declaration. */
const NO_DECLARATION: readonly (Declaration | undefined)[] = Object.freeze([undefined]);
/** A facet that targets nothing: one way, with no target. */
const NO_TARGET_CHOICE: readonly (readonly number[])[] = Object.freeze([NO_CARDS]);

/** A way, with the mode and the declaration only when there are some (an action names them only then). */
function wayOf(paid: readonly number[], targets: readonly number[], mode: number | undefined, declared: Declaration | undefined, groups?: readonly number[]): Way {
	if (mode === undefined && declared === undefined && groups === undefined) return { paid, targets };
	return { paid, targets, ...(mode === undefined ? {} : { mode }), ...(declared === undefined ? {} : { declared }), ...(groups === undefined ? {} : { groups }) };
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
 * Every legal choice of coupled targets: for each group in order, `min` to `max` of its candidates that no earlier group took (with
 * `sameCount`, the same number in every group), the targets in group order with the size of each group. Up to `limit` of them; a
 * combination that breaks a constraint is never built.
 */
function groupCombinations(groups: readonly TargetGroup[], sameCount: boolean, limit: number): { readonly targets: readonly number[]; readonly sizes: readonly number[] }[] {
	const found: { targets: readonly number[]; sizes: readonly number[] }[] = [];
	// No group built from the board: there is nothing to target, so no legal choice (and no empty range to walk).
	if (groups.length === 0) return found;
	const counts = sameCount ? range(Math.max(...groups.map((group) => group.min)), Math.min(...groups.map((group) => group.max))) : [null];
	for (const count of counts) {
		const fill = (g: number, targets: readonly number[], sizes: readonly number[]): void => {
			if (found.length >= limit) return;
			if (g === groups.length) {
				found.push({ targets, sizes });
				return;
			}
			const group = groups[g]!;
			const free = group.from.filter((id) => !targets.includes(id));
			const bounds = count === null ? { min: group.min, max: group.max } : { min: count, max: count };
			for (const chosen of combinations(free, bounds, Infinity)) {
				if (chosen.length < bounds.min) continue;
				fill(g + 1, [...targets, ...chosen], [...sizes, chosen.length]);
				if (found.length >= limit) return;
			}
		};
		fill(0, NO_CARDS, []);
	}
	return found;
}

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/**
 * Activates the effect for real: places the card, pays the cost, checks the mode and the targets again on the board the cost left,
 * freezes the link, spends the once-per-turn limit, and puts the link on the chain. Priority is the caller's.
 * `answering`: the link responds to the link on top of the chain (false for a trigger put on a chain at a trigger point).
 * Throws when what it is given is not a way `activationWays` lists, which the listing has already ruled out: a `paid`
 * that is not one of the ways the cost offers (a plain function cost offers none but the empty one), a cost that cannot be
 * paid, a mode missing, unknown or whose condition does not hold, or targets that are not a legal choice once the cost is paid.
 */
export function activateEffect(duel: Duel, player: Side, card: CardInstance, index: number, { paid, targets, zone, mode, declared, groups }: Way, answering = true): Duel {
	const effect = effectOf(duel, { card, effect: index });
	checkDefinition(card, effect);
	if ((mode === undefined) !== (effect.modes === undefined) || (mode !== undefined && (!Number.isInteger(mode) || !effect.modes![mode]))) throw new Error(`${JSON.stringify(mode)} is not a mode of ${card.code}`);
	const facet = facetOf(effect, mode);
	if (facet.condition && !facet.condition(duel, { player, card })) throw new Error(`the mode ${mode} of ${card.code} cannot be chosen now`);
	if (facet.declare ? !facet.declare(duel, { player, card }).some((option) => sameDeclaration(option, declared)) : declared !== undefined) throw new Error(`${JSON.stringify(declared)} cannot be declared for ${card.code}`);
	// A monster whose effects are negated still activates its effect and pays the cost; the effect is negated (Konami's notes on Effect Veiler and Infinite Impermanence).
	const negatedCard = hitByCardNegation(duel, { card, effect: index }) && isNegatedLasting(duel, card.id);
	const placedDuel = placed(duel, effect, card, zone);
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
	if (facet.target) {
		const candidates = targetable(next, { player, card: next.cards[card.id]! }, facet.target(next, { player, card: next.cards[card.id]! }));
		const { min, max } = facet.targetCount ?? EXACTLY_ONE_TARGET;
		if (targets.length < min || targets.length > max || new Set(targets).size !== targets.length || !targets.every((target) => candidates.includes(target))) throw new Error(`${JSON.stringify(targets)} is not a legal choice of targets for ${card.code} once its cost is paid`);
	}
	let sizes: readonly number[] | undefined;
	if (facet.targetGroups) {
		const matching = groupCombinations(targetableGroups(next, { player, card: next.cards[card.id]! }, facet.targetGroups(next, { player, card: next.cards[card.id]! })), facet.sameCount === true, Infinity).filter((choice) => sameIds(choice.targets, targets) && (groups === undefined || sameIds(choice.sizes, groups)));
		// A split the action does not name must be the only one possible: two splits of the same cards are two different choices.
		sizes = groups !== undefined || matching.length === 1 ? matching[0]?.sizes : undefined;
		if (!sizes) throw new Error(`${JSON.stringify(targets)} is not a legal choice of targets for ${card.code} once its cost is paid`);
	} else if (!facet.target && targets.length > 0) throw new Error(`${card.code} targets nothing`);
	next = dropWhen(next);
	// A new activation: what the last chain left for a `lingers` effect to answer is over.
	if (next.lingering.length > 0) next = { ...next, lingering: [] };
	const key = keyOf(effect, player, card, index);
	const wasSet = effect.type === "activation" && card.face === "down" && (card.zone === "spell" || card.zone === "field");
	const link = { ...newLink(next, player, activated, index, facet, targets, key, answering), effectNegated: negatedCard, wasSet, ...(declared === undefined ? {} : { declared }), ...(sizes === undefined ? {} : { targetGroups: sizes }) };
	// The activation is noted for the turn ("the turn you activate this effect, ..."): it stays noted if it is negated.
	return { ...spend(next, effect, key), chain: [...next.chain, link], activations: [...next.activations, { player, card: activated, effect: index }] };
}

/** A link for an activation, holding the card as it was when activated, the mode, and what the effect declared it would do, frozen. */
function newLink(duel: Duel, player: Side, card: CardInstance, index: number, facet: Facet, targets: readonly number[], spent: string | null, answering: boolean): Link {
	const effect = effectOf(duel, { card, effect: index });
	const declared = typeof facet.categories === "function" ? facet.categories(duel, { player, card: duel.cards[card.id]! }, targets) : (facet.categories ?? []);
	const link: Link = { player, card, effect: index, speed: speedOf(duel.defs[card.code] as CardDef, effect), targets, answers: answering && duel.chain.length > 0 ? duel.chain.length - 1 : null, targetMoves: targets.map((id) => duel.cards[id]!.moves), spent, categories: [...declared], activationNegated: false, effectNegated: false, wasSet: false };
	return facet.mode === undefined ? link : { ...link, mode: facet.mode };
}

/** The action that activates an effect that way; `paid` is left out when the cost has no choice. */
export const activateAction = (card: number, effect: number, { paid, targets, mode, declared, groups }: Way): Extract<Action, { type: "activate" }> => {
	const action: Extract<Action, { type: "activate" }> = paid.length === 0 ? { type: "activate", card, effect, targets } : { type: "activate", card, effect, targets, paid };
	return mode === undefined && declared === undefined && groups === undefined ? action : { ...action, ...(mode === undefined ? {} : { mode }), ...(declared === undefined ? {} : { declared }), ...(groups === undefined ? {} : { groups }) };
};
