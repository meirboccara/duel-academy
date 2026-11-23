import { type CardInstance, type Duel, type Link, moveCard, other, PHASES, type Side } from "./duel";
import { type CardDef, type Effect, speedOf } from "./effects";

/**
 * Step 2 of docs/rules-core-spec.md: one chain and the priority loop, after Konami's Fast Effect Timing chart.
 *
 * - The game state is open (box A): the turn player may do anything their phase allows. Any action closes it.
 * - After an activation, the other player may respond (box D); players alternate until both pass in a row, then the
 *   whole chain resolves from the last link to the first, with no activation in between.
 * - After a chain resolves or an action that starts no chain, the turn player may use a fast effect first (box B),
 *   then the opponent (box C); when both pass, the game state is open again.
 * - When both pass in an open game state, the turn moves to the next phase.
 *
 * Not here yet: triggers (step 3), once per turn (step 4), "cannot be negated" (step 5), the Damage Step's limits,
 * Summons, attacks, the normal draw, and Continuous, Equip and Field cards that stay on the field (a Field Spell is
 * placed and swept like any Spell; the Field Zone comes with step 7). Known limits until step 4: targets are not
 * checked again after the cost is paid, and a Spell or Trap whose control changed while on the chain is not swept to
 * the Graveyard (the sweep matches the card as activated, move count included).
 */
export type Action =
	| { readonly type: "pass" }
	/** Activate a card or an effect: `effect` is its index in the card's effects, `targets` the cards it targets. */
	| { readonly type: "activate"; readonly card: number; readonly effect: number; readonly targets: readonly number[] }
	/** Set a Spell or Trap from the hand. */
	| { readonly type: "set"; readonly card: number };

const PASS: Action = Object.freeze({ type: "pass" });
const NO_TARGETS: readonly number[] = Object.freeze([]);
/** Step 7 gives the exact zones; until then a side holds at most five cards in its Spell & Trap Zones. */
const SPELL_ZONES = 5;

/**
 * Every action open to the player who holds priority, "pass" first. A player who does not hold priority has none.
 * The teaching chain limit only shortens this list: once the chain has that many links, only "pass" is offered.
 */
export function legalActions(duel: Duel): Action[] {
	const actions: Action[] = [PASS];
	collect(duel, actions);
	return actions;
}

/** Lists what the holder of priority can do besides passing; with no list, only tells whether there is anything. */
function collect(duel: Duel, out: Action[] | null): boolean {
	const { chain, priority, turn, options, defs } = duel;
	if (options.chainLimit !== null && chain.length >= options.chainLimit) return false;
	const player = priority.holder;
	const topSpeed = chain.length > 0 ? chain[chain.length - 1]!.speed : 0;
	const ownTurn = player === turn.player;
	/** Spell Speed 1 and Setting need an open game state, in the turn player's own Main Phase. */
	const slow = topSpeed === 0 && priority.open && ownTurn && (turn.phase === "main1" || turn.phase === "main2");
	const piles = duel.piles[player];
	const room = piles.spell.length < SPELL_ZONES;
	let found = false;

	const offer = (card: CardInstance, def: CardDef, index: number, effect: Effect): boolean => {
		const speed = speedOf(def, effect);
		if (speed === 1 ? !slow : speed < topSpeed) return false;
		const ctx = { player, card };
		if (effect.condition && !effect.condition(duel, ctx)) return false;
		if (effect.cost?.can && !effect.cost.can(duel, ctx)) return false;
		if (!effect.targets) {
			out?.push({ type: "activate", card: card.id, effect: index, targets: NO_TARGETS });
			return true;
		}
		const targets = effect.targets(duel, ctx);
		if (out) for (const target of targets) out.push({ type: "activate", card: card.id, effect: index, targets: [target] });
		return targets.length > 0;
	};

	for (const id of piles.hand) {
		const card = duel.cards[id]!;
		const def = defs[card.code];
		if (!def) continue;
		const isSpellOrTrap = def.kind !== "monster";
		// A Spell goes from the hand to a free zone, in its controller's turn; a Trap must be Set first.
		const fromHand = room && (def.kind === "spell" || (def.kind === "quick-play" && ownTurn));
		const effects = def.effects;
		if (effects) {
			for (let index = 0; index < effects.length; index++) {
				const effect = effects[index]!;
				if (effect.activates === "card" ? !fromHand : effect.from !== "hand") continue;
				if (offer(card, def, index, effect)) {
					if (!out) return true;
					found = true;
				}
			}
		}
		if (isSpellOrTrap && slow && room) {
			if (!out) return true;
			out.push({ type: "set", card: id });
			found = true;
		}
	}
	for (const zone of ["spell", "monster"] as const) {
		for (const id of piles[zone]) {
			const card = duel.cards[id]!;
			const effects = defs[card.code]?.effects;
			if (!effects) continue;
			const def = defs[card.code]!;
			// A Set Spell can be activated at once; a Set Trap or Quick-Play Spell, not in the turn it was Set.
			const setReady = zone === "spell" && card.face === "down" && def.kind !== "monster" && (def.kind === "spell" || !duel.setThisTurn.includes(id));
			for (let index = 0; index < effects.length; index++) {
				const effect = effects[index]!;
				if (effect.activates === "card" ? !setReady : effect.from !== "field" || card.face !== "up") continue;
				if (offer(card, def, index, effect)) {
					if (!out) return true;
					found = true;
				}
			}
		}
	}
	return found;
}

/** Compares a legal action with what a caller asked for, which may be malformed (missing targets, wrong type). */
function sameAction(legal: Action, asked: Action): boolean {
	if (legal.type !== asked.type) return false;
	if (legal.type === "pass") return true;
	const other = asked as typeof legal;
	if (legal.card !== other.card) return false;
	if (legal.type !== "activate") return true;
	const targets = (asked as typeof legal).targets;
	return legal.effect === (asked as typeof legal).effect && Array.isArray(targets) && legal.targets.length === targets.length && legal.targets.every((target, i) => target === targets[i]);
}

/**
 * Does one action for the player who holds priority and returns the duel that follows; the duel given is not changed.
 * Throws when the action is not among `legalActions(duel)`. Unless the `everyWindow` teaching option is on, a player
 * who can only pass does so at once, so the duel returned always waits on a real decision.
 */
export function act(duel: Duel, action: Action): Duel {
	if (!legalActions(duel).some((legal) => sameAction(legal, action))) throw new Error(`not a legal action for ${duel.priority.holder}: ${JSON.stringify(action)}`);
	let next = action.type === "pass" ? pass(duel) : action.type === "set" ? set(duel, action.card) : activate(duel, action);
	while (!next.options.everyWindow && !decides(next) && !collect(next, null)) next = pass(next);
	return next;
}

/** In an open game state the turn player always decides for themselves, even when all they can do is end the phase. */
const decides = (duel: Duel) => duel.chain.length === 0 && duel.priority.open && duel.priority.passed.length === 0 && duel.priority.holder === duel.turn.player;

function set(duel: Duel, id: number): Duel {
	const next = moveCard(duel, id, { zone: "spell", face: "down" });
	// An action that starts no chain: the turn player may use a fast effect first, then the opponent (boxes B and C).
	return { ...next, setThisTurn: [...next.setThisTurn, id], priority: { holder: duel.turn.player, passed: [], open: false } };
}

function activate(duel: Duel, action: Extract<Action, { type: "activate" }>): Duel {
	const player = duel.priority.holder;
	const before = duel.cards[action.card]!;
	const def = duel.defs[before.code]!;
	const effect = def.effects![action.effect]!;
	// A Spell or Trap Card is placed face-up on the field (or flipped face-up); a monster's effect leaves it in place.
	let next = effect.activates === "card" ? moveCard(duel, before.id, { zone: "spell", face: "up" }) : duel;
	const card = next.cards[before.id]!;
	if (effect.cost) next = effect.cost.pay(next, { player, card });
	const link: Link = { player, card, effect: action.effect, speed: speedOf(def, effect), targets: action.targets, categories: effect.categories ?? [], activationNegated: false, effectNegated: false };
	return { ...next, chain: [...next.chain, link], priority: { holder: other(player), passed: [], open: false } };
}

function pass(duel: Duel): Duel {
	const { holder, passed, open } = duel.priority;
	if (!passed.includes(other(holder))) return { ...duel, priority: { holder: other(holder), passed: [...passed, holder], open } };
	// Both players have passed in a row.
	const turnPlayer = duel.turn.player;
	if (duel.chain.length > 0) return { ...resolveChain(duel), priority: { holder: turnPlayer, passed: [], open: false } };
	if (!open) return { ...duel, priority: { holder: turnPlayer, passed: [], open: true } };
	return nextPhase(duel);
}

/**
 * Resolves the whole chain, the last link first. A link whose activation or effect was negated applies nothing. While
 * a link resolves, `duel.chain` still holds it and the links below it. Afterwards, every Spell or Trap Card activated
 * in the chain that is still face-up on the field goes to the Graveyard, negated or not.
 * (When exactly such a card leaves, after its own link or after the whole chain, is not written on a Konami page we
 * could cite: the rulebook only says "After resolving the effect, send the card to the Graveyard." We send them once
 * the chain has resolved; to be confirmed with a Q&A when a card depends on it.)
 */
function resolveChain(duel: Duel): Duel {
	let next = duel;
	for (let index = duel.chain.length - 1; index >= 0; index--) {
		const link = next.chain[index]!;
		if (!link.activationNegated && !link.effectNegated) next = effectOf(next, link).resolve(next, link, index);
		next = { ...next, chain: next.chain.slice(0, index) };
	}
	for (const link of duel.chain) {
		if (effectOf(duel, link).activates !== "card") continue;
		const now = next.cards[link.card.id]!;
		if (now.zone === "spell" && now.face === "up" && now.moves === link.card.moves) next = moveCard(next, now.id, { zone: "graveyard" });
	}
	return next;
}

const effectOf = (duel: Duel, link: Link): Effect => duel.defs[link.card.code]!.effects![link.effect]!;

/** The next phase, or the other player's next turn after the End Phase. The game state is open, the turn player first. */
function nextPhase(duel: Duel): Duel {
	const at = PHASES.indexOf(duel.turn.phase);
	if (at < PHASES.length - 1) return { ...duel, turn: { ...duel.turn, phase: PHASES[at + 1]! }, priority: { holder: duel.turn.player, passed: [], open: true } };
	const player: Side = other(duel.turn.player);
	return { ...duel, turn: { player, number: duel.turn.number + 1, phase: PHASES[0]! }, setThisTurn: [], priority: { holder: player, passed: [], open: true } };
}

const flag = (duel: Duel, index: number, change: Partial<Link>): Duel => (duel.chain[index] ? { ...duel, chain: duel.chain.map((link, i) => (i === index ? { ...link, ...change } : link)) } : duel);

/** Negates the activation of the link at `index`: it will apply nothing, and its card was never activated. */
export const negateActivation = (duel: Duel, index: number): Duel => flag(duel, index, { activationNegated: true });

/** Negates the effect of the link at `index`: the activation stands, the effect is not applied. */
export const negateEffect = (duel: Duel, index: number): Duel => flag(duel, index, { effectNegated: true });
