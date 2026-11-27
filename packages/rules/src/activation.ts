/**
 * Step 4 of docs/rules-core-spec.md: what activating an effect record takes, shared by an effect the player activates
 * (chain.ts) and a trigger put on a chain (triggers.ts), so the listing and the activation cannot disagree.
 */
import { type CardInstance, type Duel, type Link, moveCard, type Side } from "./duel";
import { type Action, sameIds } from "./action";
import { dropWhen, type GameEvent } from "./events";
import { type CardDef, type Cost, type CostSpec, type Declaration, type EffectContext, type EffectMode, type EffectRecord, effectOf, type Operation, sameDeclaration, speedOf, type TargetCount, type TargetGroup } from "./effects";
import { activationLocked, anyShield, atk, canBeTargetedBy, def, drawLocked, isNegatedLasting, locked } from "./modifiers";
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

/** How many targets the facet takes now: what it says, read on the board when it is a function, or exactly one. */
const countOf = (facet: Facet, duel: Duel, ctx: EffectContext): TargetCount => (typeof facet.targetCount === "function" ? facet.targetCount(duel, ctx) : (facet.targetCount ?? EXACTLY_ONE_TARGET));

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
	/** A cost whose cards are chosen one at a time (`CostSpec.choose`): how many cards will be paid. `paid` is then empty until they are chosen. */
	readonly pay?: number;
}

/** What is chosen at activation beyond the cost: one per mode of an effect with modes, else the record itself. */
interface Facet {
	readonly mode?: number;
	readonly condition?: EffectMode["condition"];
	readonly target?: EffectRecord["target"];
	readonly targetCount?: EffectRecord["targetCount"];
	readonly targetCheck?: EffectRecord["targetCheck"];
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

/**
 * A cost as the ways of paying it: a plain function is one way, with no card chosen. Every payment goes through `payCost`.
 */
const costSpecOf = (cost: Cost): CostSpec => (typeof cost === "function" ? { pay: (duel, ctx) => payCost(duel, cost(duel, ctx)) } : { ...cost, pay: (duel, ctx, picked) => payCost(duel, cost.pay(duel, ctx, picked)) });

/**
 * A payment that "sent" a card to the Graveyard which was banished instead (`Duel.sentInstead`, an effect such as "any card sent to the
 * GY is banished instead") did not pay the cost: the card or effect cannot be activated that way. Konami's Japanese Q&A fid 14540 (OCG
 * only; record `send-cost-replaced-unpaid`): "the cost of sending a card to the GY cannot be paid". A discard (`reason: "discarded"`),
 * a Tribute or a material is still paid, the card banished (fid 23815, case A, record `discard-cost-replaced-paid`).
 */
const payCost = (before: Duel, after: Duel | null): Duel | null => (after !== null && after.sentInstead > before.sentInstead ? null : after);

/** The ways a cost can be paid, as lists of the cards chosen: the spec's `pick`, or the one way with no choice. */
const waysToPay = (cost: CostSpec, duel: Duel, ctx: EffectContext) => (cost.pick ? cost.pick(duel, ctx) : PAY_WITH_NO_CHOSEN_CARDS);

/** The payments the listing tries for a cost with no card chosen one at a time: each way `pick` lists, or the one way with no choice. */
const payments = (cost: CostSpec | null, duel: Duel, ctx: EffectContext): readonly (readonly number[])[] => (cost ? waysToPay(cost, duel, ctx) : PAY_WITH_NO_CHOSEN_CARDS);

/**
 * A cost whose cards are chosen one at a time (`CostSpec.choose`): how many choices of cards are tried, per question asked (is this
 * count payable, which targets does it leave, may this card still be picked). Whether a choice pays, and which targets it leaves,
 * is only known by paying it in a dry run, and the choices of 6 cards among 15 are 5,005. Up to this bound the answer is exact: every
 * choice is tried. Beyond it only the first choices are, in the order of the candidates: what is listed can always be paid (each way
 * and each card offered rests on a choice that was tried), but a way that only later choices allow is not listed. A cost with no
 * target stops at the first choice that pays, so the bound only matters to it when the first 1,000 choices all fail.
 */
const COST_CHOICES_TRIED = 1000;

/**
 * Tries the choices of `count` different cards of `from` that hold every card of `chosen`, in the order of the candidates, until
 * `visit` accepts one (`true`) or `COST_CHOICES_TRIED` were tried. A choice found among all the choices is found, no later, among
 * those that hold some of its cards: the order is the same, with fewer choices before it.
 */
function someChoice(from: readonly number[], count: number, chosen: readonly number[], visit: (cards: readonly number[]) => boolean): boolean {
	const rest = chosen.length === 0 ? from : from.filter((id) => !chosen.includes(id));
	if (count < chosen.length || count - chosen.length > rest.length) return false;
	let tried = 0;
	const walk = (start: number, cards: readonly number[]): boolean => {
		if (cards.length === count) {
			tried++;
			return visit(cards);
		}
		for (let i = start; i <= rest.length - (count - cards.length) && tried < COST_CHOICES_TRIED; i++) if (walk(i + 1, [...cards, rest[i]!])) return true;
		return false;
	};
	return walk(0, chosen);
}

/**
 * For an action that names how many cards it pays (`Action.pay`), with `chosen` already picked: the cards the player may pick next.
 * A card is offered only when, with it, the cost can still be paid in full and the targets the action names are still a legal choice
 * once it is (a card that is itself a target, when paying removes it, is not offered). Read with the card placed, as the listing and
 * the payment read it (a card activated from the hand is no longer in the hand). Empty when the cost is not chosen that way or
 * cannot be paid so. When as many cards come back as are still to pay, they are the only way to pay.
 */
export function costChoice(duel: Duel, player: Side, card: CardInstance, index: number, { targets, zone, mode, groups, pay }: Way, chosen: readonly number[]): readonly number[] {
	const effect = effectOf(duel, { card, effect: index });
	const cost = effect.cost ? costSpecOf(effect.cost) : null;
	if (!cost?.choose || pay === undefined || !cost.choose.counts.includes(pay)) return NO_CARDS;
	const board = placed(duel, effect, card, zone);
	const ctx: EffectContext = { player, card: board.cards[card.id]! };
	const facet = facetOf(effect, mode);
	const from = [...new Set(cost.choose.from(board, ctx))];
	const open = new Set<number>();
	const legal = (cards: readonly number[]): boolean => {
		const after = cost.pay(board, ctx, cards);
		if (!after || !legalTargets(after, { player, card: after.cards[card.id]! }, facet, targets, groups)) return false;
		// Every card of a choice that pays may be picked: none of them is asked about again.
		for (const id of cards) open.add(id);
		return true;
	};
	for (const id of from) if (!chosen.includes(id) && !open.has(id)) someChoice(from, pay, [...chosen, id], legal);
	return from.filter((id) => open.has(id) && !chosen.includes(id));
}

/** A legal choice of targets with no group. */
const NO_GROUPS: { readonly sizes?: readonly number[] } = Object.freeze({});

/**
 * Are `targets` a legal choice for the facet on this board (the one the cost left)? The sizes of its groups (coupled targets; a
 * split the action does not name must be the only one possible: two splits of the same cards are two different choices), or `null`.
 */
function legalTargets(duel: Duel, ctx: EffectContext, facet: Facet, targets: readonly number[], groups: readonly number[] | undefined): { readonly sizes?: readonly number[] } | null {
	if (facet.target) {
		const candidates = targetable(duel, ctx, facet.target(duel, ctx));
		const { min, max } = countOf(facet, duel, ctx);
		if (targets.length < min || targets.length > max || new Set(targets).size !== targets.length || !targets.every((target) => candidates.includes(target))) return null;
		// A rule over the whole choice ("including a monster you control").
		return facet.targetCheck && !facet.targetCheck(duel, ctx, targets) ? null : NO_GROUPS;
	}
	if (!facet.targetGroups) return targets.length > 0 ? null : NO_GROUPS;
	const matching = groupCombinations(targetableGroups(duel, ctx, facet.targetGroups(duel, ctx)), facet.sameCount === true, Infinity).filter((choice) => sameIds(choice.targets, targets) && (groups === undefined || sameIds(choice.sizes, groups)));
	const sizes = groups !== undefined || matching.length === 1 ? matching[0]?.sizes : undefined;
	return sizes ? { sizes } : null;
}

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
		if (effect.operation || effect.target || effect.targetCount || effect.targetCheck || effect.declare || effect.categories || effect.targetGroups || effect.sameCount || effect.modes.length === 0) throw new Error(`${card.code}: an effect with modes has its operation, targets and declaration in each mode`);
		for (const mode of effect.modes) checkTargets(card, mode);
		checkCost(card, effect);
		return;
	}
	checkTargets(card, effect);
	if (!effect.operation && effect.type !== "continuous") throw new Error(`${card.code}: an effect needs an operation`);
	checkCost(card, effect);
}

/** A cost is chosen with `pick` or one card at a time with `choose`, not both; a Trigger Effect cannot ask for its cost. */
function checkCost(card: CardInstance, effect: EffectRecord): void {
	const cost = effect.cost;
	if (!cost || typeof cost === "function" || !cost.choose) return;
	if (cost.pick) throw new Error(`${card.code}: a cost is chosen with pick or with choose, not both`);
	if (effect.type === "trigger") throw new Error(`${card.code}: a Trigger Effect's cost cannot be chosen one card at a time (choose)`);
}

function checkTargets(card: CardInstance, facet: Facet & { readonly targetCount?: unknown }): void {
	if (facet.targetCount && !facet.target) throw new Error(`${card.code}: an effect with a targetCount needs a target function`);
	if (facet.targetCheck && !facet.target) throw new Error(`${card.code}: an effect with a targetCheck needs a target function`);
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
	const now = { ...ctx, card: board.cards[ctx.card.id]! };
	const cost = effect.cost ? costSpecOf(effect.cost) : null;
	if (cost?.can && !cost.can(board, now)) return NO_WAYS;
	// What may be declared is read on the duel as it is, before the cost (like the condition), once per facet.
	const declarations = facets.map((facet) => (facet.declare ? facet.declare(duel, ctx) : NO_DECLARATION));
	const ways: Way[] = [];
	/** For a cost chosen one card at a time: the ways already listed for the count being tried (two choices of cards often leave the same targets). */
	let listed: Set<string> | null = null;
	/** Lists the ways open on the board a payment left. `true`: one was found and only the first is asked for. */
	const list = (after: Duel, paid: readonly number[], pay?: number): boolean => {
		for (let f = 0; f < facets.length; f++) {
			const facet = facets[f]!;
			const room = firstOnly ? 1 : Infinity;
			const at = { ...ctx, card: after.cards[ctx.card.id]! };
			const check = facet.targetCheck;
			const targetChoices: readonly { readonly targets: readonly number[]; readonly sizes?: readonly number[] }[] = facet.target
				? check
					? // A rule over the whole choice: every combination is built, and only those it accepts are kept.
						combinations(targetable(after, at, facet.target(after, at)), countOf(facet, after, at), Infinity).filter((targets) => check(after, at, targets)).slice(0, room).map((targets) => ({ targets }))
					: combinations(targetable(after, at, facet.target(after, at)), countOf(facet, after, at), room).map((targets) => ({ targets }))
				: facet.targetGroups
					? groupCombinations(targetableGroups(after, at, facet.targetGroups(after, at)), facet.sameCount === true, room)
					: NO_TARGET_CHOICE.map((targets) => ({ targets }));
			const options = declarations[f]!;
			for (let d = 0; d < options.length; d++) {
				for (const choice of targetChoices) {
					if (listed) {
						const key = `${f}:${d}:${choice.targets.join(",")}:${choice.sizes?.join(",") ?? ""}`;
						if (listed.has(key)) continue;
						listed.add(key);
					}
					ways.push(pay === undefined ? wayOf(paid, choice.targets, facet.mode, options[d], choice.sizes) : { ...wayOf(paid, choice.targets, facet.mode, options[d], choice.sizes), pay });
				}
				if (firstOnly && ways.length > 0) return true;
			}
		}
		return false;
	};
	if (cost?.choose) {
		// A cost chosen one card at a time: the way names how many cards, not which (they are chosen after the action, `costChoice`).
		// A count is listed when some choice of that many candidates pays, with the targets any such choice leaves (`COST_CHOICES_TRIED`).
		const from = [...new Set(cost.choose.from(board, now))];
		const aims = facets.some((facet) => facet.target || facet.targetGroups);
		for (const count of new Set(cost.choose.counts)) {
			if (count < 0) continue;
			listed = new Set();
			someChoice(from, count, NO_CARDS, (cards) => {
				const after = cost.pay(board, now, cards);
				// With no target, every choice that pays leaves the same ways: the first one tells.
				return after !== null && (list(after, NO_CARDS, count) || !aims);
			});
			if (firstOnly && ways.length > 0) return ways;
		}
		return ways;
	}
	for (const paid of payments(cost, board, now)) {
		const after = cost ? cost.pay(board, now, paid) : board;
		if (after && list(after, paid)) return ways;
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
function combinations(candidates: readonly number[], { min, max }: TargetCount, limit: number): readonly (readonly number[])[] {
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
export function activateEffect(duel: Duel, player: Side, card: CardInstance, index: number, { paid, targets, zone, mode, declared, groups }: Way, answering = true, triggered?: readonly GameEvent[]): Duel {
	/** Who activates, with the card as it is at that point: a Trigger Effect also knows what triggered it. */
	const as = (now: CardInstance): EffectContext => (triggered ? { player, card: now, triggered } : { player, card: now });
	const effect = effectOf(duel, { card, effect: index });
	checkDefinition(card, effect);
	if ((mode === undefined) !== (effect.modes === undefined) || (mode !== undefined && (!Number.isInteger(mode) || !effect.modes![mode]))) throw new Error(`${JSON.stringify(mode)} is not a mode of ${card.code}`);
	const facet = facetOf(effect, mode);
	if (facet.condition && !facet.condition(duel, as(card))) throw new Error(`the mode ${mode} of ${card.code} cannot be chosen now`);
	if (facet.declare ? !facet.declare(duel, as(card)).some((option) => sameDeclaration(option, declared)) : declared !== undefined) throw new Error(`${JSON.stringify(declared)} cannot be declared for ${card.code}`);
	// A monster whose effects are negated still activates its effect and pays the cost; the effect is negated (Konami's notes on Effect Veiler and Infinite Impermanence).
	const negatedCard = hitByCardNegation(duel, { card, effect: index }) && isNegatedLasting(duel, card.id);
	const placedDuel = placed(duel, effect, card, zone);
	// The link holds the card as it is when activated: placed face-up (for a card activation), before the cost.
	const activated = placedDuel.cards[card.id]!;
	let next = placedDuel;
	const cost = effect.cost ? costSpecOf(effect.cost) : null;
	const ctx = as(activated);
	// A cost chosen one card at a time: the cards chosen are different candidates, as many as one of the counts allows.
	const chosenFrom = cost?.choose ? cost.choose.from(next, ctx) : null;
	const payable = chosenFrom ? cost!.choose!.counts.includes(paid.length) && new Set(paid).size === paid.length && paid.every((id) => chosenFrom.includes(id)) : (cost ? waysToPay(cost, next, ctx) : PAY_WITH_NO_CHOSEN_CARDS).some((way) => sameIds(way, paid));
	if (!payable) throw new Error(`${JSON.stringify(paid)} is not a way to pay the cost of ${card.code}`);
	if (cost) {
		const after = cost.pay(next, ctx, paid);
		if (!after) throw new Error(`the cost of ${card.code} cannot be paid`);
		next = after;
	}
	if (!facet.target && !facet.targetGroups && targets.length > 0) throw new Error(`${card.code} targets nothing`);
	const aimed = legalTargets(next, as(next.cards[card.id]!), facet, targets, groups);
	if (!aimed) throw new Error(`${JSON.stringify(targets)} is not a legal choice of targets for ${card.code} once its cost is paid`);
	const sizes = aimed.sizes;
	next = dropWhen(next);
	// A new activation: what the last chain left for a `lingers` effect to answer is over.
	if (next.lingering.length > 0) next = { ...next, lingering: [] };
	const key = keyOf(effect, player, card, index);
	const wasSet = effect.type === "activation" && card.face === "down" && (card.zone === "spell" || card.zone === "field");
	// A monster's ATK and DEF as it activates, before the cost (`Link.stats`): a monster that is its own cost is judged by these.
	const stats = activated.zone === "monster" && activated.face === "up" ? { atk: atk(placedDuel, card.id), def: def(placedDuel, card.id) } : undefined;
	const link = { ...newLink(next, player, activated, index, facet, targets, key, answering, triggered), effectNegated: negatedCard, wasSet, ...(declared === undefined ? {} : { declared }), ...(sizes === undefined ? {} : { targetGroups: sizes }), ...(triggered ? { triggered } : {}), ...(stats ? { stats } : {}) };
	// The activation is noted for the turn ("the turn you activate this effect, ..."): it stays noted if it is negated.
	return { ...spend(next, effect, key), chain: [...next.chain, link], activations: [...next.activations, { player, card: activated, effect: index }] };
}

/** A link for an activation, holding the card as it was when activated, the mode, and what the effect declared it would do, frozen. */
function newLink(duel: Duel, player: Side, card: CardInstance, index: number, facet: Facet, targets: readonly number[], spent: string | null, answering: boolean, triggered?: readonly GameEvent[]): Link {
	const effect = effectOf(duel, { card, effect: index });
	const declared = typeof facet.categories === "function" ? facet.categories(duel, { player, card: duel.cards[card.id]!, ...(triggered ? { triggered } : {}) }, targets) : (facet.categories ?? []);
	const link: Link = { player, card, effect: index, speed: speedOf(duel.defs[card.code] as CardDef, effect), targets, answers: answering && duel.chain.length > 0 ? duel.chain.length - 1 : null, targetMoves: targets.map((id) => duel.cards[id]!.moves), spent, categories: [...declared], activationNegated: false, effectNegated: false, wasSet: false };
	return facet.mode === undefined ? link : { ...link, mode: facet.mode };
}

/** The action that activates an effect that way; `paid` is left out when the cost has no choice. */
export const activateAction = (card: number, effect: number, { paid, targets, mode, declared, groups, pay }: Way): Extract<Action, { type: "activate" }> => {
	const plain: Extract<Action, { type: "activate" }> = paid.length === 0 ? { type: "activate", card, effect, targets } : { type: "activate", card, effect, targets, paid };
	const action = pay === undefined ? plain : { ...plain, pay };
	return mode === undefined && declared === undefined && groups === undefined ? action : { ...action, ...(mode === undefined ? {} : { mode }), ...(declared === undefined ? {} : { declared }), ...(groups === undefined ? {} : { groups }) };
};
