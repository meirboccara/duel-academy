import { activateAction, activateEffect, activationWays } from "./activation";
import { type Action, PASS, sameAction } from "./action";
import { type CardInstance, type Duel, type Link, moveCard, other, PHASES, type Side } from "./duel";
import { breakEffect, raiseEvent } from "./events";
import { type CardDef, type EffectRecord, effectOf, rangeOf, speedOf } from "./effects";
import { endChain, newTurn, refund } from "./once";
import { chooseTrigger, declineTriggers, triggerActions, triggerPoint } from "./triggers";

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
 * - Triggers (step 3, src/triggers.ts): after a chain resolves or an action that starts no chain, the trigger effects
 *   waiting in `duel.waiting` go on a chain in Konami's order (turn player's mandatory, opponent's mandatory, turn
 *   player's optional, opponent's optional), each player choosing in turn; the player who did not activate the last
 *   one then has priority. Events (src/events.ts) are raised by every move and by effects.
 *
 * - Effect records (step 4, src/effects.ts and src/activation.ts): an effect is listed when its condition holds, its
 *   once-per-turn limit is not spent, its cost passes a dry run (run on the immutable duel, thrown away) and, if it
 *   targets, a target is legal on the board the cost leaves. Activating pays the cost for real and checks the target
 *   again on the paid board. The link freezes `categories`; the limit is spent at activation, and a negated activation
 *   gives back only a "You can only activate 1 ..." use (`negateActivation`). While a link resolves, its operation
 *   may ask its player for a card that is not a target: the chain then waits (`duel.asking`) and `legalActions` lists
 *   `choose`; with one candidate, nothing is asked.
 *
 * Not here yet: "cannot be negated" (step 5), the Damage Step's limits, Summons, attacks, the normal draw, and
 * Continuous, Equip and Field cards that stay on the field (a Field Spell is placed and swept like any Spell; the
 * Field Zone comes with step 7). Known limit: a Spell or Trap whose control changed while on the chain is not swept
 * to the Graveyard (the sweep matches the card as activated, move count included).
 */
/** Step 7 gives the exact zones; until then a side holds at most five cards in its Spell & Trap Zones. */
const SPELL_ZONES = 5;

/**
 * Every action open to the player who holds priority, "pass" first. A player who does not hold priority has none.
 * The teaching chain limit only shortens this list: once the chain has that many links, only "pass" is offered.
 */
export function legalActions(duel: Duel): Action[] {
	if (duel.asking) return duel.asking.from.map((card): Action => ({ type: "choose", card }));
	if (duel.building) return triggerActions(duel);
	const actions: Action[] = [PASS];
	collect(duel, actions);
	return actions;
}

/** Lists what the holder of priority can do besides passing; with no list, only tells whether there is anything. */
function collect(duel: Duel, out: Action[] | null, only?: number): boolean {
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

	const offer = (card: CardInstance, def: CardDef, index: number, effect: EffectRecord): boolean => {
		const speed = speedOf(def, effect);
		if (speed === 1 ? !slow : speed < topSpeed) return false;
		const ctx = { player, card };
		// An effect that answers an event needs that event to be the last thing that happened.
		if (effect.event && !duel.live.some((event) => effect.event!(duel, event, ctx))) return false;
		const ways = activationWays(duel, ctx, index, effect, out === null);
		if (out) for (const way of ways) out.push(activateAction(card.id, index, way));
		return ways.length > 0;
	};

	/** Is the effect one this card can be activated with from its zone? `ready`: a Spell or Trap Card could be activated from here now. */
	const listedHere = (effect: EffectRecord, card: CardInstance, zone: "hand" | "field", ready: boolean): boolean =>
		effect.type === "activation" ? ready : effect.type !== "trigger" && rangeOf(effect) === zone && (zone === "hand" || card.face === "up");

	for (const id of piles.hand) {
		if (only !== undefined && id !== only) continue;
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
				if (!listedHere(effect, card, "hand", fromHand)) continue;
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
			if (only !== undefined && id !== only) continue;
			const card = duel.cards[id]!;
			const effects = defs[card.code]?.effects;
			if (!effects) continue;
			const def = defs[card.code]!;
			// A Set Spell can be activated at once; a Set Trap or Quick-Play Spell, not in the turn it was Set.
			const setReady = zone === "spell" && card.face === "down" && def.kind !== "monster" && (def.kind === "spell" || !duel.setThisTurn.includes(id));
			for (let index = 0; index < effects.length; index++) {
				const effect = effects[index]!;
				if (!listedHere(effect, card, "field", setReady)) continue;
				if (offer(card, def, index, effect)) {
					if (!out) return true;
					found = true;
				}
			}
		}
	}
	return found;
}

/**
 * Does one action for the player who holds priority and returns the duel that follows; the duel given is not changed.
 * Throws when the action is not among `legalActions(duel)`. Unless the `everyWindow` teaching option is on, a player
 * who can only pass does so at once, so the duel returned always waits on a real decision.
 */
export function act(duel: Duel, action: Action): Duel {
	if (!isLegal(duel, action)) throw new Error(`not a legal action for ${duel.asking ? duel.asking.player : duel.priority.holder}: ${JSON.stringify(action)}`);
	let next = apply(duel, action);
	while (!next.building && !next.asking && !next.options.everyWindow && !decides(next) && !collect(next, null)) next = pass(next);
	return next;
}

/** Is the action among `legalActions(duel)`? An ordinary action is checked by listing only what its own card could do. */
function isLegal(duel: Duel, action: Action): boolean {
	if (duel.asking || duel.building) return legalActions(duel).some((legal) => sameAction(legal, action));
	// Passing is always open to the player who holds priority.
	if (action.type === "pass") return true;
	const listed: Action[] = [];
	collect(duel, listed, action.card);
	return listed.some((legal) => sameAction(legal, action));
}

function apply(duel: Duel, action: Action): Duel {
	if (duel.asking) return answer(duel, (action as Extract<Action, { type: "choose" }>).card);
	if (duel.building) return action.type === "pass" ? declineTriggers(duel) : chooseTrigger(duel, action as Extract<Action, { type: "activate" }>);
	if (action.type === "pass") return pass(duel);
	return action.type === "set" ? set(duel, action.card) : activate(duel, action as Extract<Action, { type: "activate" }>);
}

/** In an open game state the turn player always decides for themselves, even when all they can do is end the phase. */
const decides = (duel: Duel) => duel.chain.length === 0 && duel.priority.open && duel.priority.passed.length === 0 && duel.priority.holder === duel.turn.player;

function set(duel: Duel, id: number): Duel {
	const next = moveCard(breakEffect(duel), id, { zone: "spell", face: "down" });
	// An action that starts no chain: trigger effects go first; then the turn player may use a fast effect, then the opponent (boxes B and C).
	return triggerPoint({ ...next, setThisTurn: [...next.setThisTurn, id] }, { holder: duel.turn.player, passed: [], open: false });
}

function activate(duel: Duel, action: Extract<Action, { type: "activate" }>): Duel {
	const player = duel.priority.holder;
	const next = activateEffect(duel, player, duel.cards[action.card]!, action.effect, { paid: action.paid ?? [], targets: action.targets });
	return { ...next, priority: { holder: other(player), passed: [], open: false } };
}

function pass(duel: Duel): Duel {
	const { holder, passed, open } = duel.priority;
	if (!passed.includes(other(holder))) return { ...duel, priority: { holder: other(holder), passed: [...passed, holder], open } };
	// Both players have passed in a row.
	const turnPlayer = duel.turn.player;
	if (duel.chain.length > 0) return resolveChain(duel, duel.chain, null);
	// Nothing happened and both passed: the game state is open again, and the events before are no longer the last thing.
	if (!open) return { ...breakEffect(duel), priority: { holder: turnPlayer, passed: [], open: true } };
	return nextPhase(duel);
}

/**
 * Resolves the chain, the last link first, from where it stands. A link whose activation or effect was negated applies
 * nothing. While a link resolves, `duel.chain` still holds it and the links below it. If the effect asks for a card
 * that is not a target, the chain waits in `duel.asking` (one candidate is taken at once, none ends the effect);
 * `answer` picks it up again. Afterwards, every Spell or Trap Card activated in the chain (`all`) that is still face-up
 * on the field goes to the Graveyard, negated or not, "once per Chain" limits are lifted, and the triggers go on a chain.
 * (When: after the whole chain, not after its own link. Konami's Japanese Q&A says so for Quick-Play Spells and Traps
 * chained to an effect: rule record `chained-card-after-chain`; the core applies it to every Spell and Trap Card.)
 */
function resolveChain(duel: Duel, all: readonly Link[], pending: Duel | null): Duel {
	let next = duel;
	let result = pending;
	for (;;) {
		if (result === null) {
			if (next.chain.length === 0) break;
			next = breakEffect(next);
			const index = next.chain.length - 1;
			const link = next.chain[index]!;
			result = link.activationNegated || link.effectNegated ? next : effectOf(next, link).operation(next, link, index);
		}
		const asking = result.asking;
		if (asking) {
			if (asking.from.length > 1) return { ...result, asking: { ...asking, links: all } };
			const board = { ...result, asking: null };
			result = asking.from.length === 1 ? asking.then(board, asking.from[0]!) : board;
			continue;
		}
		next = { ...result, chain: result.chain.slice(0, -1) };
		result = null;
	}
	for (const link of all) {
		if (effectOf(next, link).type !== "activation") continue;
		const now = next.cards[link.card.id]!;
		if (now.zone === "spell" && now.face === "up" && now.moves === link.card.moves) next = moveCard(next, now.id, { zone: "graveyard" });
	}
	return triggerPoint(endChain(next), { holder: next.turn.player, passed: [], open: false });
}

/** The player picked a card for the effect that was asking: it goes on, and the rest of the chain resolves. */
function answer(duel: Duel, picked: number): Duel {
	const { links, then } = duel.asking!;
	const board = { ...duel, asking: null };
	return resolveChain(board, links, then(board, picked));
}

/** The next phase, or the other player's next turn after the End Phase. The game state is open, the turn player first. */
function nextPhase(duel: Duel): Duel {
	const at = PHASES.indexOf(duel.turn.phase);
	// A new phase is something that happens: nothing before it is the last thing any more, and its triggers are chained first.
	const moved = breakEffect(duel);
	if (at < PHASES.length - 1) {
		const phase = PHASES[at + 1]!;
		const turn = { ...moved.turn, phase };
		return triggerPoint(raiseEvent({ ...moved, turn }, { type: "phase", phase, player: turn.player }), { holder: turn.player, passed: [], open: true });
	}
	const player: Side = other(duel.turn.player);
	const turn = { player, number: duel.turn.number + 1, phase: PHASES[0]! };
	return triggerPoint(raiseEvent(newTurn({ ...moved, turn, setThisTurn: [] }), { type: "phase", phase: turn.phase, player }), { holder: player, passed: [], open: true });
}

const flag = (duel: Duel, index: number, change: Partial<Link>): Duel => (duel.chain[index] ? { ...duel, chain: duel.chain.map((link, i) => (i === index ? { ...link, ...change } : link)) } : duel);

/** Negates the activation of the link at `index`: it will apply nothing, and its card was never activated. */
export function negateActivation(duel: Duel, index: number): Duel {
	const link = duel.chain[index];
	const flagged = flag(duel, index, { activationNegated: true });
	return link ? refund(flagged, link, effectOf(duel, link)) : flagged;
}

/** Negates the effect of the link at `index`: the activation stands, the effect is not applied. */
export const negateEffect = (duel: Duel, index: number): Duel => flag(duel, index, { effectNegated: true });
